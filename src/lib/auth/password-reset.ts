import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { sendEmail } from "@/lib/utils/email";

/**
 * 공통 비밀번호 재설정 로직 (앱 v1 라우트 전용)
 *
 * 설계 메모:
 * - 웹 라우트(api/web/auth/forgot-password, reset-password)는 rate-limit /
 *   dev-token 응답 / withdrawn 분기 등 웹 전용 동작이 섞여 있어 회귀 리스크가
 *   크므로 건드리지 않는다. 본 lib는 v1 라우트만 사용한다.
 * - 토큰 규격은 웹과 동일하게 맞춘다: crypto.randomBytes(32) hex(64자),
 *   만료 30분, bcryptjs salt rounds 12.
 */

// 토큰 만료 시간 (30분) — 웹 라우트와 동일
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

// bcrypt salt rounds — 웹 reset-password 라우트와 동일하게 12로 통일
const BCRYPT_SALT_ROUNDS = 12;

// 이메일/비밀번호 계정으로 간주하는 provider 값.
// provider 가 null 이거나 "email" 이면 자체 비밀번호 계정 → 메일 발송 대상.
// google / kakao 등 소셜 로그인은 비밀번호가 없으므로 발송하지 않는다.
function isEmailAccount(provider: string | null): boolean {
  return provider === null || provider === "" || provider === "email";
}

// 재설정 링크 base URL. env 가 있으면 그것을, 없으면 운영 도메인을 사용.
function getResetBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mybdr.kr";
}

/**
 * 비밀번호 재설정 요청.
 *
 * - 사용자가 없거나, 탈퇴했거나, 소셜 계정이면 메일을 보내지 않고 조용히 끝낸다.
 * - 이메일 계정이면 토큰을 생성·저장(30분)하고 재설정 링크 메일을 발송한다.
 * - 어떤 경우든 호출측에는 동일 결과(반환값 동일)를 주어 계정 존재 여부를
 *   노출하지 않는다(account enumeration 방지).
 */
export async function requestPasswordReset(rawEmail: string): Promise<void> {
  const email = (rawEmail ?? "").trim().toLowerCase();
  if (!email) return; // 빈 이메일이면 아무 일도 하지 않음 (응답은 호출측에서 200 고정)

  // 해당 이메일 사용자 조회 (필요한 필드만)
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, status: true, provider: true },
  });

  // 사용자 없음 / 탈퇴 / 소셜 계정 → 메일 발송 skip (조용히 종료)
  if (!user) return;
  if (user.status === "withdrawn") return;
  if (!isEmailAccount(user.provider)) return;

  // 랜덤 토큰 생성(64자 hex) + 만료 30분 — 웹 라우트와 동일 규격
  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);

  // DB에 토큰 저장
  await prisma.user.update({
    where: { id: user.id },
    data: {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires,
    },
  });

  // 기존 웹 재설정 페이지를 재사용하는 링크
  const resetUrl = `${getResetBaseUrl()}/reset-password?token=${resetToken}`;

  // 재설정 안내 메일 발송 (RESEND_API_KEY 없으면 email.ts 가 콘솔 로그로 fallback).
  // ⚠️ await 하지 않는다(fire-and-forget): 메일 네트워크 왕복을 응답 경로에서 제거해
  //    미존재 이메일과의 응답 시간차(타이밍 사이드채널)를 줄인다. 실패는 로그만 남긴다.
  void sendEmail({
    to: email,
    subject: "[MyBDR] 비밀번호 재설정 안내",
    html: `
      <div style="font-family:Pretendard,Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#E31B23;">비밀번호 재설정</h2>
        <p>아래 버튼을 눌러 비밀번호를 재설정해주세요. 이 링크는 30분간 유효합니다.</p>
        <p style="margin:24px 0;">
          <a href="${resetUrl}"
             style="display:inline-block;background:#E31B23;color:#fff;
                    padding:12px 24px;border-radius:4px;text-decoration:none;">
            비밀번호 재설정
          </a>
        </p>
        <p style="color:#888;font-size:13px;">
          본인이 요청하지 않았다면 이 메일을 무시해주세요.
        </p>
      </div>
    `,
  }).catch((err) => {
    // fire-and-forget: 발송 실패해도 응답엔 영향 없음. 로그만 남긴다.
    console.error(
      "[password-reset] sendEmail failed:",
      err instanceof Error ? err.message : "Unknown error"
    );
  });
}

// confirmPasswordReset 결과 코드 — 라우트가 이를 보고 상태코드를 결정한다.
export type ConfirmResult =
  | { ok: true }
  | { ok: false; code: "INVALID_OR_EXPIRED" };

/**
 * 토큰 검증 + 비밀번호 변경.
 *
 * - 토큰이 존재하고 만료(reset_token_expires)되지 않았으면 비밀번호를 교체한다.
 * - 사용된 토큰은 즉시 클리어하여 재사용을 막는다.
 * - 토큰이 없거나 만료/무효면 INVALID_OR_EXPIRED 를 반환한다.
 */
export async function confirmPasswordReset(
  rawToken: string,
  newPassword: string
): Promise<ConfirmResult> {
  const token = (rawToken ?? "").trim();
  if (!token) return { ok: false, code: "INVALID_OR_EXPIRED" };

  // 토큰 일치 + 만료시간이 현재 이후(아직 유효)인 사용자 조회
  const user = await prisma.user.findFirst({
    where: {
      reset_token: token,
      reset_token_expires: { gte: new Date() },
    },
    select: { id: true },
  });

  // 토큰 무효 / 만료 / 이미 사용됨(클리어됨) → 실패
  if (!user) return { ok: false, code: "INVALID_OR_EXPIRED" };

  // 새 비밀번호 해싱 (bcrypt, salt rounds 12 — 웹과 동일)
  const passwordDigest = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);

  // 비밀번호 교체 + 토큰 클리어 (원자적 update)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordDigest,
      reset_token: null,
      reset_token_expires: null,
    },
  });

  return { ok: true };
}
