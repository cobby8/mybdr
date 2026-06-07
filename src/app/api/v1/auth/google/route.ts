import { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/jwt";
import { upsertOAuthUser, WithdrawnUserError } from "@/lib/auth/oauth";
import { googleMobileSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, validationError, internalError } from "@/lib/api/response";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/login-attempts";

// 외부 provider fetch 타임아웃 (네트워크 지연 시 라우트 무한 대기 방지)
const FETCH_TIMEOUT_MS = 5000;

// 구글이 발급하는 iss(토큰 발급자)의 허용 값
const ALLOWED_GOOGLE_ISS = new Set([
  "accounts.google.com",
  "https://accounts.google.com",
]);

// 모바일 구글 로그인 (인증 불필요)
//   앱이 구글 SDK로 받은 id_token 전달 → 서버가 tokeninfo로 검증(aud+iss) 후 JWT 발급.
export async function POST(req: NextRequest) {
  // rate-limit 식별자 = IP (모바일은 email 사전 미확보 → IP 기준)
  const ip = getClientIp(req);

  try {
    // 1. body 파싱 (JSON 아니면 422)
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return validationError([{ field: "body", message: "유효하지 않은 값입니다." }]);
    }

    // 2. 스키마 검증 (수동 safeParse — login route 패턴)
    const result = googleMobileSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error.issues);
    }
    const { id_token } = result.data;

    // 3. 브루트포스 차단 (검증 전 IP 기준)
    if (await isLoginBlocked(ip)) {
      return apiError("Too many login attempts. Try again later.", 429, "RATE_LIMITED");
    }

    // 4. 구글 tokeninfo로 id_token 검증
    let tokenInfo: {
      aud?: string;
      iss?: string;
      sub?: string;
      email?: string;
      name?: string;
      picture?: string;
    };
    try {
      const infoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`,
        { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }
      );
      // tokeninfo가 비정상(400 등) 시 토큰 무효
      if (!infoRes.ok) {
        await recordLoginAttempt(ip, ip);
        return apiError("Invalid Google token", 401, "INVALID_GOOGLE_TOKEN");
      }
      tokenInfo = await infoRes.json();
    } catch {
      // 네트워크/타임아웃/파싱 실패 → 토큰 검증 실패로 처리 (시크릿 로그 금지)
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Google token", 401, "INVALID_GOOGLE_TOKEN");
    }

    // sub 없으면 무효 토큰
    if (!tokenInfo.sub) {
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Google token", 401, "INVALID_GOOGLE_TOKEN");
    }

    // 4-1. aud 검증 — 우리 앱(GOOGLE_CLIENT_ID)에 발급된 토큰인지 확인 (토큰 탈취/오용 방어)
    if (tokenInfo.aud !== process.env.GOOGLE_CLIENT_ID) {
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Google audience", 401, "INVALID_GOOGLE_AUD");
    }

    // 4-2. iss 검증 — 진짜 구글이 발급한 토큰인지 확인
    if (!tokenInfo.iss || !ALLOWED_GOOGLE_ISS.has(tokenInfo.iss)) {
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Google issuer", 401, "INVALID_GOOGLE_ISS");
    }

    // 5. upsert (탈퇴 회원 → 403). 구글은 전화번호 미제공 → phone null.
    let user;
    try {
      user = await upsertOAuthUser({
        provider: "google",
        uid: tokenInfo.sub,
        email: tokenInfo.email || null,
        nickname: tokenInfo.name || null,
        profileImage: tokenInfo.picture || null,
        phone: null,
      });
    } catch (e) {
      if (e instanceof WithdrawnUserError) {
        return apiError("Account withdrawn", 403, "ACCOUNT_WITHDRAWN");
      }
      throw e;
    }

    // 6. 로그인 성공: 시도 기록 삭제 + JWT 발급
    await clearLoginAttempts(ip);
    const token = await generateToken(user);

    // login route와 100% 동형 응답 (snake_case 자동 변환)
    return apiSuccess({
      token,
      user: {
        id: user.id.toString(),
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.profile_image_url,
        membershipType: user.membershipType,
        isAdmin: user.isAdmin ?? false,
      },
    });
  } catch (error) {
    console.error("[POST /api/v1/auth/google]", error);
    return internalError();
  }
}
