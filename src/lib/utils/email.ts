/**
 * 이메일 발송 유틸리티 (stub)
 *
 * RESEND_API_KEY 환경변수가 있으면 Resend API로 실제 발송하고,
 * 없으면 콘솔에 로그만 남긴다 (개발 환경에서 편리).
 *
 * 사용법:
 *   await sendEmail({
 *     to: "user@example.com",
 *     subject: "제목",
 *     html: "<p>내용</p>",
 *   });
 */

// 이메일 발송 파라미터 타입
interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string; // 기본값: noreply@mybdr.co.kr
}

// 발송 결과 타입
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Resend API 키 (서버 전용이므로 NEXT_PUBLIC_ 접두사 없음)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DEFAULT_FROM = "MyBDR <noreply@mybdr.co.kr>";

/**
 * 이메일 발송 함수
 *
 * - RESEND_API_KEY가 있으면 → Resend API로 실제 발송
 * - RESEND_API_KEY가 없으면 → 콘솔 로그만 출력 (개발용)
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { to, subject, html, from = DEFAULT_FROM } = params;

  // API 키가 없으면 콘솔 로그로 대체 (개발 환경)
  if (!RESEND_API_KEY) {
    console.log("========== [EMAIL STUB] ==========");
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`HTML:    ${html.slice(0, 200)}...`);
    console.log("===================================");
    return { success: true, messageId: "stub-" + Date.now() };
  }

  // Resend API로 실제 발송
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    const body = (await res.json()) as { id?: string; message?: string };

    if (!res.ok) {
      console.error("[EMAIL ERROR]", body);
      return {
        success: false,
        error: body.message || `HTTP ${res.status}`,
      };
    }

    return { success: true, messageId: body.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[EMAIL ERROR]", message);
    return { success: false, error: message };
  }
}
