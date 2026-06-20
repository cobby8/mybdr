import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, validationError } from "@/lib/api/response";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { checkRateLimit, RATE_LIMITS } from "@/lib/security/rate-limit";
import { getClientIp } from "@/lib/security/get-client-ip";

/**
 * POST /api/v1/auth/reset-password-request
 * 앱용 비밀번호 재설정 요청.
 *
 * - body: { email }
 * - 계정 존재 여부/소셜 계정 여부와 무관하게 **항상 200 { ok: true }** 를 반환한다.
 *   (account enumeration 방지 — 어떤 이메일이 가입돼 있는지 노출하지 않음)
 * - 실제 메일 발송 여부는 requestPasswordReset 내부에서 판단(소셜/탈퇴 skip).
 * - 공개 엔드포인트(withAuth 없음)이므로 IP 기준 rate-limit 으로 메일 폭주를 막는다.
 */

// 이메일 형식만 검증 (형식 자체가 틀린 요청만 거른다)
const schema = z.object({
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  // IP 기준 rate-limit — 무제한 메일 트리거(Resend 발송량 폭주) 방지.
  // 이메일이 아닌 IP 기준이라 429 응답이 가입여부를 노출하지 않음(enumeration 안전).
  // 웹 forgot-password 와 동일하게 login config(20 req/min) 사용.
  const ip = getClientIp(req);
  const rl = await checkRateLimit(`v1-reset-pwd:${ip}`, RATE_LIMITS.login);
  if (!rl.allowed) {
    return apiError("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return validationError([{ field: "body", message: "유효하지 않은 값입니다." }]);
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return validationError(parsed.error.issues);
  }

  // 토큰 생성/메일 발송. 내부에서 모든 분기를 조용히 처리하므로
  // 실패해도 호출측에는 동일 결과를 준다.
  // (DB/메일 오류로 throw 되더라도 enumeration 노출을 막기 위해 항상 200 유지)
  try {
    await requestPasswordReset(parsed.data.email);
  } catch (err) {
    // 내부 오류는 로그만 남기고 응답은 동일하게 유지
    console.error(
      "[reset-password-request]",
      err instanceof Error ? err.message : "Unknown error"
    );
  }

  return apiSuccess({ ok: true });
}
