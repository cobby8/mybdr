import { NextRequest } from "next/server";
import { z } from "zod";
import { apiSuccess, apiError, validationError, internalError } from "@/lib/api/response";
import { confirmPasswordReset } from "@/lib/auth/password-reset";

/**
 * POST /api/v1/auth/reset-password
 * 앱용 비밀번호 재설정 확정.
 *
 * - body: { token, newPassword }
 * - 토큰 유효 + 만료 전 → 비밀번호 교체 후 200 { ok: true }
 * - 토큰 만료/무효/재사용 → 410 Gone (재설정 링크가 만료/무효)
 * - 입력 형식 오류(빈 토큰, 8자 미만 비번) → 422 validationError
 */

// 토큰 비어있지 않음 + 새 비밀번호 8자 이상 (웹 reset-password 기준과 동일)
const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export async function POST(req: NextRequest) {
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

  const { token, newPassword } = parsed.data;

  // 토큰 검증 + 비밀번호 교체 (공통 lib).
  // prisma 등 내부 오류는 try/catch 로 흡수해 스택 노출 없이 500(sanitized) 반환.
  try {
    const result = await confirmPasswordReset(token, newPassword);

    if (!result.ok) {
      // 토큰 만료/무효/재사용 — 410 Gone 으로 명확히 구분
      return apiError(
        "재설정 링크가 만료되었거나 유효하지 않습니다.",
        410,
        "RESET_TOKEN_INVALID"
      );
    }

    return apiSuccess({ ok: true });
  } catch (err) {
    console.error(
      "[v1/reset-password]",
      err instanceof Error ? err.message : "Unknown error"
    );
    return internalError();
  }
}
