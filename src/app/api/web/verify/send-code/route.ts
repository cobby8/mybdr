import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 메모리 저장소 (프로덕션에서는 Redis로 교체)
const codeStore = new Map<string, { code: string; expires: number }>();

/**
 * POST /api/web/verify/send-code
 * 전화번호 인증 코드 발송
 *
 * 개발 환경: 코드를 응답에 포함 (SMS 발송 없이 테스트)
 * 프로덕션: Naver SENS 등 SMS API 연동
 */
export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  const body = await req.json() as { phone?: string };
  const phone = body.phone?.replace(/[^0-9]/g, "");

  if (!phone || !phone.match(/^01[016789]\d{7,8}$/)) {
    return apiError("올바른 전화번호를 입력해주세요.", 400);
  }

  // 6자리 랜덤 코드
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const key = `${ctx.userId}:${phone}`;

  // 5분 유효
  codeStore.set(key, { code, expires: Date.now() + 5 * 60 * 1000 });

  // TODO: 프로덕션에서 SMS 발송
  // await sendSMS(phone, `[BDR] 인증 코드: ${code}`);

  const isDev = process.env.NODE_ENV !== "production";
  return apiSuccess({
    message: "인증 코드를 발송했습니다.",
    ...(isDev && { code }), // 개발 환경에서만 코드 노출
  });
});

// 코드 검증 (내부 함수로 export)
export function verifyCode(userId: bigint, phone: string, code: string): boolean {
  const key = `${userId}:${phone}`;
  const stored = codeStore.get(key);
  if (!stored) return false;
  if (Date.now() > stored.expires) {
    codeStore.delete(key);
    return false;
  }
  if (stored.code !== code) return false;
  codeStore.delete(key); // 일회성
  return true;
}
