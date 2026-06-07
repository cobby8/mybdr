import { NextRequest } from "next/server";
import { generateToken } from "@/lib/auth/jwt";
import { upsertOAuthUser, WithdrawnUserError } from "@/lib/auth/oauth";
import { kakaoMobileSchema } from "@/lib/validation/auth";
import { apiSuccess, apiError, validationError, internalError } from "@/lib/api/response";
import { getClientIp } from "@/lib/security/get-client-ip";
import {
  isLoginBlocked,
  recordLoginAttempt,
  clearLoginAttempts,
} from "@/lib/security/login-attempts";

// 외부 provider fetch 타임아웃 (네트워크 지연 시 라우트 무한 대기 방지)
const FETCH_TIMEOUT_MS = 5000;

// 모바일 카카오 로그인 (인증 불필요)
//   앱이 카카오 SDK로 받은 access_token 전달 → 서버가 카카오 API로 검증 후 JWT 발급.
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
    const result = kakaoMobileSchema.safeParse(body);
    if (!result.success) {
      return validationError(result.error.issues);
    }
    const { access_token } = result.data;

    // 3. 브루트포스 차단 (검증 전 IP 기준)
    if (await isLoginBlocked(ip)) {
      return apiError("Too many login attempts. Try again later.", 429, "RATE_LIMITED");
    }

    // 4. 카카오 사용자 정보 조회 (access_token 검증 겸용)
    let kakaoData: {
      id?: number | string;
      kakao_account?: {
        email?: string;
        phone_number?: string;
        profile?: { nickname?: string; profile_image_url?: string };
      };
    };
    try {
      const userRes = await fetch("https://kapi.kakao.com/v2/user/me", {
        headers: { Authorization: `Bearer ${access_token}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      // 카카오가 비정상 응답(401 등) 시 토큰 무효로 간주
      if (!userRes.ok) {
        await recordLoginAttempt(ip, ip);
        return apiError("Invalid Kakao token", 401, "INVALID_KAKAO_TOKEN");
      }
      kakaoData = await userRes.json();
    } catch {
      // 네트워크/타임아웃/파싱 실패 → 토큰 검증 실패로 처리 (시크릿 로그 금지)
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Kakao token", 401, "INVALID_KAKAO_TOKEN");
    }

    // id 없으면 무효 토큰
    if (!kakaoData.id) {
      await recordLoginAttempt(ip, ip);
      return apiError("Invalid Kakao token", 401, "INVALID_KAKAO_TOKEN");
    }

    // 5. profile 매핑 (웹 콜백 kakao/route.ts와 동일 필드)
    const account = kakaoData.kakao_account || {};
    const profile = account.profile || {};

    // 6. upsert (탈퇴 회원 → 403)
    let user;
    try {
      user = await upsertOAuthUser({
        provider: "kakao",
        uid: String(kakaoData.id),
        email: account.email || null,
        nickname: profile.nickname || null,
        profileImage: profile.profile_image_url || null,
        phone: account.phone_number || null,
      });
    } catch (e) {
      if (e instanceof WithdrawnUserError) {
        return apiError("Account withdrawn", 403, "ACCOUNT_WITHDRAWN");
      }
      throw e;
    }

    // 7. 로그인 성공: 시도 기록 삭제 + JWT 발급
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
    console.error("[POST /api/v1/auth/kakao]", error);
    return internalError();
  }
}
