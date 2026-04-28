"use client";

/**
 * 결제 성공 페이지 (/pricing/success)
 *
 * 시안 v2(1) PricingSuccess.jsx 박제:
 *   - 영수증 카드: borderTop 4px solid var(--ok), 카드 padding 32/28
 *   - 상단 ✓ 원형 (var(--ok))
 *   - eyebrow "결제 완료 · PAYMENT SUCCESS"
 *   - 결제 상세: 2단 grid(120px 1fr) — 결제 금액/수단/주문번호/결제일시(승인번호)
 *   - 버튼: btn--primary btn--xl 홈으로 + btn 결제 내역
 *
 * 데이터 fetch / useSearchParams / 인쇄 버튼 동작 100% 보존.
 */

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// 금액 포맷 (천 단위 콤마 + 원 → 시안 톤은 ₩ 접두지만 ko-KR 사용자 친화 위해 원 유지)
function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function ReceiptContent() {
  const searchParams = useSearchParams();

  // URL에서 결제 정보 추출 — 기존 동작 그대로 보존
  const orderId = searchParams.get("orderId") ?? "-";
  const paymentKey = searchParams.get("paymentKey") ?? "";
  const amount = Number(searchParams.get("amount")) || 0;
  const method = searchParams.get("method") ?? "카드";

  // 현재 시각을 결제 시각으로 표시 — 기존 보존
  const paidAt = new Date().toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 브라우저 인쇄 기능 — 기존 보존
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="page mx-auto" style={{ maxWidth: 520, paddingTop: 48 }}>
      {/* 시안 톤 영수증 카드 — borderTop 4px solid var(--ok) */}
      <div
        className="card"
        style={{
          padding: "32px 28px",
          textAlign: "center",
          borderTop: "4px solid var(--ok)",
        }}
      >
        {/* 상단 ✓ 원형 (var(--ok)) — 기존 Material Symbols check 유지하되 원형 배경은 시안 톤으로 */}
        <div
          style={{
            width: 72,
            height: 72,
            background: "var(--ok)",
            color: "#fff",
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 16px",
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>
            check
          </span>
        </div>

        {/* eyebrow */}
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          결제 완료 · PAYMENT SUCCESS
        </div>

        {/* 제목 */}
        <h1
          style={{
            margin: "10px 0 8px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.01em",
          }}
        >
          결제가 완료됐어요
        </h1>

        {/* 부연 설명 */}
        <p
          style={{
            color: "var(--ink-mute)",
            fontSize: 14,
            lineHeight: 1.7,
            marginBottom: 24,
            maxWidth: "40ch",
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          결제가 정상적으로 완료되었습니다. 영수증은 등록된 이메일로 발송되었어요.
        </p>

        {/* 결제 금액 큰 글씨 강조 — 기존 동작 보존 (amount > 0 일 때만 노출) */}
        {amount > 0 && (
          <div
            style={{
              padding: "12px 0",
              borderBottom: "1px dashed var(--border)",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "var(--ff-mono)",
                color: "var(--color-text-primary)",
                letterSpacing: "-0.01em",
              }}
            >
              {formatAmount(amount)}
            </div>
          </div>
        )}

        {/* 결제 상세 — 시안 톤 2단 grid (120px 1fr) */}
        <div
          style={{
            padding: "16px 18px",
            background: "var(--bg-alt)",
            borderRadius: 8,
            marginBottom: 22,
            textAlign: "left",
            display: "grid",
            gridTemplateColumns: "120px 1fr",
            rowGap: 10,
            fontSize: 13,
          }}
        >
          <div style={{ color: "var(--ink-dim)" }}>주문번호</div>
          <div style={{ fontFamily: "var(--ff-mono)", fontSize: 12 }}>{orderId}</div>

          <div style={{ color: "var(--ink-dim)" }}>결제수단</div>
          <div>{method}</div>

          <div style={{ color: "var(--ink-dim)" }}>결제일시</div>
          <div>{paidAt}</div>

          {paymentKey && (
            <>
              <div style={{ color: "var(--ink-dim)" }}>승인번호</div>
              <div style={{ fontFamily: "var(--ff-mono)", fontSize: 12 }}>
                {paymentKey.slice(0, 12)}...
              </div>
            </>
          )}
        </div>

        {/* 버튼 — 시안 톤 grid gap=8, btn--primary btn--xl + 인쇄/홈으로 */}
        <div style={{ display: "grid", gap: 8 }}>
          <Link
            href="/"
            className="btn btn--primary btn--xl"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
            홈으로 가기
          </Link>
          {/* 인쇄 버튼 — 동작 100% 보존 (window.print) */}
          <button
            type="button"
            onClick={handlePrint}
            className="btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>print</span>
            영수증 인쇄
          </button>
          {/* 결제 내역 — 기존 /profile/billing?tab=payments 라우트 보존 (Day 8 코멘트 그대로) */}
          <Link
            href="/profile/billing?tab=payments"
            className="btn"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
          >
            결제 내역 보기
          </Link>
        </div>
      </div>

      {/* 카드 아래 보조 링크 (기존 보존) */}
      <div className="mt-6 flex justify-center gap-4">
        <Link
          href="/pricing"
          className="text-xs transition-colors hover:underline"
          style={{ color: "var(--ink-mute)" }}
        >
          요금제 보기
        </Link>
      </div>
    </div>
  );
}

// useSearchParams는 Suspense boundary가 필요 — 기존 패턴 보존
export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
            불러오는 중...
          </p>
        </div>
      }
    >
      <ReceiptContent />
    </Suspense>
  );
}
