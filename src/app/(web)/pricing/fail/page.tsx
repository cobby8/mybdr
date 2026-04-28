import Link from "next/link";

/**
 * 결제 실패 페이지 (/pricing/fail)
 *
 * 시안 v2(1) PricingFail.jsx 톤 박제:
 *   - 카드 borderTop: 4px solid {동적 tone} (사용자 취소 → ink-mute, 입력/한도 → warn, 만료/거절 → danger)
 *   - eyebrow "결제 실패 · PAYMENT FAILED"
 *   - 상단 ! 원형 (color-mix tone bg + tone color)
 *   - 오류 코드 칩 (mono font, bg-alt 배경)
 *   - 버튼: btn--primary btn--xl 다시 결제 + btn 홈으로 + btn ghost 도움말
 *
 * 토스페이먼츠는 결제 실패 시 이 URL로 리다이렉트하면서
 * ?code=...&message=...&orderId=... 쿼리를 붙여준다.
 *
 * Server Component 유지 — 인쇄 등 클라이언트 동작 없음.
 */

// 토스페이먼츠 공식 에러 코드 → 사용자 친화적 한국어 메시지 + 시안 tone.
// 우리 13개 그대로 유지 (시안엔 6개만 있음 — 우리 매핑이 더 충실).
// tone:
//   - var(--ink-mute): 사용자 취소 (실패가 아니라 흐름)
//   - var(--warn):     입력/한도 (재시도로 해결 가능)
//   - var(--danger):   만료/거절/인증실패 (개입 필요)
const ERROR_MESSAGES: Record<
  string,
  { title: string; desc: string; tone: string }
> = {
  // 사용자가 결제창에서 취소 버튼을 누른 경우 (가장 흔함)
  PAY_PROCESS_CANCELED: {
    title: "결제를 취소하셨어요",
    desc: "언제든 다시 시도하실 수 있어요.",
    tone: "var(--ink-mute)",
  },
  // 결제창이 닫히거나 통신 오류로 중단된 경우
  PAY_PROCESS_ABORTED: {
    title: "결제가 중단됐어요",
    desc: "다시 시도해 주세요.",
    tone: "var(--ink-mute)",
  },
  // 일부 토스 SDK 버전에서 사용자 취소를 이 코드로 내려주기도 함
  USER_CANCEL: {
    title: "결제를 취소하셨어요",
    desc: "언제든 다시 시도하실 수 있어요.",
    tone: "var(--ink-mute)",
  },
  // 카드 번호 오타/잘못된 형식
  INVALID_CARD_NUMBER: {
    title: "카드 번호가 올바르지 않아요",
    desc: "카드 정보를 다시 확인해 주세요.",
    tone: "var(--warn)",
  },
  // 유효기간 만료/잘못 입력
  INVALID_CARD_EXPIRATION: {
    title: "카드 유효기간을 다시 확인해 주세요",
    desc: "유효기간이 지났거나 형식이 올바르지 않아요.",
    tone: "var(--warn)",
  },
  // 할부 불가 카드 / 할부 개월 비지원
  INVALID_CARD_INSTALLMENT_PLAN: {
    title: "할부 개월 수를 확인해 주세요",
    desc: "선택하신 카드에서 지원하지 않는 할부 조건이에요.",
    tone: "var(--warn)",
  },
  // 일 결제 횟수 초과
  EXCEED_MAX_DAILY_PAYMENT_COUNT: {
    title: "오늘 결제 한도를 초과했어요",
    desc: "내일 다시 시도하거나 다른 결제 수단을 이용해 주세요.",
    tone: "var(--warn)",
  },
  // 일 결제 금액 초과
  EXCEED_MAX_ONE_DAY_AMOUNT: {
    title: "일일 결제 한도를 초과했어요",
    desc: "다른 결제 수단이나 카드사에 문의해 주세요.",
    tone: "var(--warn)",
  },
  // 카드 한도 초과 / 계좌 잔액 부족
  NOT_ENOUGH_BALANCE: {
    title: "잔액이 부족해요",
    desc: "카드 한도나 계좌 잔액을 확인해 주세요.",
    tone: "var(--warn)",
  },
  // 카드사 승인 거절 (도난/정지/한도 외 사유)
  REJECT_CARD_COMPANY: {
    title: "카드사에서 거절했어요",
    desc: "카드사에 직접 문의해 주시거나 다른 카드로 시도해 주세요.",
    tone: "var(--danger)",
  },
  // 권한/IP 차단 등으로 요청이 막힌 경우
  FORBIDDEN_REQUEST: {
    title: "결제 요청이 거부됐어요",
    desc: "잠시 후 다시 시도하거나 관리자에게 문의해 주세요.",
    tone: "var(--danger)",
  },
  // 시크릿키 오류 등 인증 실패 — 서비스 설정 문제
  UNAUTHORIZED_KEY: {
    title: "결제 인증에 실패했어요",
    desc: "관리자에게 문의해 주세요.",
    tone: "var(--danger)",
  },
  // 파라미터 누락/잘못된 요청
  INVALID_REQUEST: {
    title: "잘못된 요청이에요",
    desc: "다시 시도하거나 관리자에게 문의해 주세요.",
    tone: "var(--danger)",
  },
};

// 폴백 tone — 매핑되지 않은 코드는 danger로 처리 (시안의 UNKNOWN과 동일)
const FALLBACK_TONE = "var(--danger)";

export default async function PaymentFailPage({
  searchParams,
}: {
  // Next.js 15: searchParams는 Promise로 전달된다 — 기존 시그니처 보존
  searchParams: Promise<{ message?: string; code?: string }>;
}) {
  // Promise를 await로 풀어서 실제 쿼리값 접근
  const params = await searchParams;
  const code = params.code ?? "";
  const message = params.message ?? "";

  // 매핑에 해당 code가 있으면 매핑된 메시지/tone, 없으면 폴백
  const mapped = ERROR_MESSAGES[code];
  const title = mapped?.title ?? (message || "결제에 실패했어요");
  const desc =
    mapped?.desc ?? "다시 시도하시거나, 계속 문제가 발생하면 관리자에게 문의해 주세요.";
  const tone = mapped?.tone ?? FALLBACK_TONE;

  // 매핑되지 않은 코드는 하단에 원본 code + message를 노출해 문의 시 활용
  const showRawInfo = !mapped && (code || message);

  return (
    <div className="page mx-auto" style={{ maxWidth: 520, paddingTop: 48 }}>
      {/* 시안 톤 카드 — borderTop 동적 tone */}
      <div
        className="card"
        style={{
          padding: "32px 28px",
          textAlign: "center",
          borderTop: `4px solid ${tone}`,
        }}
      >
        {/* 상단 ! 원형 — bg는 tone의 12% 혼합, color는 tone */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: `color-mix(in oklab, ${tone} 12%, transparent)`,
            color: tone,
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            fontSize: 32,
            fontWeight: 700,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 36 }}>
            error
          </span>
        </div>

        {/* eyebrow */}
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          결제 실패 · PAYMENT FAILED
        </div>

        {/* 제목 — 매핑된 한국어 또는 토스 message 원문 */}
        <h1 style={{ margin: "10px 0 8px", fontSize: 22, fontWeight: 700 }}>
          {title}
        </h1>

        {/* 부연 설명 */}
        <p
          style={{
            color: "var(--ink-mute)",
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 18,
            maxWidth: "42ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {desc}
        </p>

        {/* 오류 코드 칩 — 시안 톤 (mono font, bg-alt 배경) */}
        {code && (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 6,
              marginBottom: 18,
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--ink-dim)",
              alignItems: "center",
            }}
          >
            <span>오류 코드</span>
            <span
              style={{
                padding: "2px 8px",
                background: "var(--bg-alt)",
                borderRadius: 3,
                color: "var(--ink-soft)",
              }}
            >
              {code}
            </span>
          </div>
        )}

        {/* 매핑 없는 코드 — 디버깅/문의용 원본 정보 (코드 칩이 위에 이미 있을 수 있음) */}
        {showRawInfo && !code && message && (
          <div
            style={{
              marginBottom: 18,
              padding: "8px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-chip)",
              fontFamily: "var(--ff-mono)",
              fontSize: 11,
              color: "var(--ink-mute)",
            }}
          >
            {message}
          </div>
        )}

        {/* 버튼 — 시안 톤 grid gap=8 */}
        <div style={{ display: "grid", gap: 8 }}>
          <Link
            href="/pricing"
            className="btn btn--primary btn--xl"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            다시 결제하기
          </Link>
          <Link
            href="/pricing"
            className="btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            다른 결제수단 선택
          </Link>
          <Link
            href="/"
            className="btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              textDecoration: "none",
            }}
          >
            홈으로
          </Link>
        </div>
      </div>

      {/* 관리자 문의 링크 — 기존 보존 */}
      <div className="mt-4 text-center">
        <a
          href="mailto:bdr.wonyoung@gmail.com"
          className="text-xs transition-colors hover:underline"
          style={{ color: "var(--ink-mute)" }}
        >
          문제가 계속되면 관리자에게 문의하기 (bdr.wonyoung@gmail.com)
        </a>
      </div>
    </div>
  );
}
