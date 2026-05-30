"use client";

/* ============================================================
 * /pricing/checkout — 결제 페이지 (BDR v2.25 시안 BU2 박제 · Phase 6.2C-7)
 *
 * 왜 이렇게:
 * - PM 지시: 시안 BU2(PricingCheckout)의 시각 패턴을 박제 — 3 step indicator +
 *   플랜 요약(실데이터) + 결제수단 칩 + 토스 결제창 안내 박스 + 약관 4종(전체동의 포함).
 * - 토스 위젯 흐름은 운영 그대로(결제창 팝업 방식). SDK 로드 / toss.requestPayment 인자
 *   (method/amount/orderId/orderName/successUrl/failUrl/customerEmail/customerName) /
 *   confirm·fail URL / plan fetch / me fetch / handlePay / disabled 로직 → 한 글자도 변경 X.
 * - ★ 토스 mock 0: 시안의 가짜 카드입력 스켈레톤(bl-pm-skel)은 재현하지 않음.
 *   대신 "토스 결제창 안내 박스 + 결제수단 칩"으로 박제 (실제 카드입력은 토스 팝업이 담당).
 *   결제수단 칩 선택 상태는 시각 표시용일 뿐 requestPayment 인자에 영향 0(항상 CARD 고정).
 * - bl-* 클래스는 import하지 않음 → 전부 인라인 + var(--*) 토큰으로 재현 (bu2-·bb- prefix 신설 0).
 *
 * 시안 → 박제 매핑:
 *   1) breadcrumb 홈 › 요금제 › 결제 (기존 Breadcrumb 보존)
 *   2) 3 step indicator (플랜 선택 → 결제 정보[현재] → 결제 완료) — 신규
 *   3) 플랜 요약(선택한 플랜 + 이름 + 타입·30일 갱신 + 큰 가격) — 실데이터
 *   4) 결제자 정보 readOnly (me fetch — 로직 보존, person 아이콘 헤더 추가)
 *   5) 결제수단 칩 3종(카드/가상계좌/간편결제) + 토스 결제창 안내 박스 (mock 스켈레톤 X)
 *   6) 약관 4종 + 전체동의 (기존 agreedTerms state 4키 보존)
 *   7) 결제 CTA (allRequiredAgreed disabled 로직 보존)
 * ============================================================ */

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { Breadcrumb } from "@/components/shared/breadcrumb";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TossPayments: (clientKey: string) => any;
  }
}

// /api/web/me 응답 중 결제에 사용할 필드만 부분 타입으로 선언
// (id 는 Toss orderId 생성에 필요. email/nickname/name 은 결제 customer 식별용)
type MeInfo = {
  id?: string | number | null;
  email?: string | null;
  nickname?: string | null;
  name?: string | null;
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planId = searchParams.get("planId");
  const [plan, setPlan] = useState<{ id: string; name: string; price: number; plan_type: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const sdkLoaded = useRef(false);

  // 약관 동의 상태 — PM 지시: agreed=true 일 때만 결제 가능 (reviewer 지적 반영)
  // 이유: 필수 약관 3종(pg/third/refund) 모두 체크되어야 결제 버튼이 활성화됨.
  //       marketing 은 선택이므로 결제 차단 조건에서 제외.
  const [agreedTerms, setAgreedTerms] = useState<{
    pg: boolean;
    third: boolean;
    refund: boolean;
    marketing: boolean;
  }>({ pg: false, third: false, refund: false, marketing: false });

  // 필수 3종 모두 동의했는지 — 결제 버튼 disabled 판정에 사용 (로직 보존)
  const allRequiredAgreed = agreedTerms.pg && agreedTerms.third && agreedTerms.refund;

  // 전체 동의(필수 3 + 선택 1) 여부 — 시안 BU2 "전체 약관 동의" 체크박스 표시용
  const allChecked = allRequiredAgreed && agreedTerms.marketing;

  // 전체 동의 토글 — 한 번에 4종 on/off (시안 toggleAll 답습, 결제 차단 로직엔 영향 없음)
  function toggleAllTerms() {
    const next = !allChecked;
    setAgreedTerms({ pg: next, third: next, refund: next, marketing: next });
  }

  // 결제수단 칩 — ★ 시각 표시용 only. 운영 toss.requestPayment 는 항상 method:"CARD" 고정이므로
  // 이 선택 state 는 requestPayment 인자에 전혀 반영되지 않음(토스 mock 0 / 결제 흐름 불변).
  const PM_METHODS = [
    { key: "card", label: "카드", icon: "credit_card" },
    { key: "vbank", label: "가상계좌", icon: "account_balance" },
    { key: "easy", label: "간편결제", icon: "bolt" },
  ] as const;
  const [method, setMethod] = useState<string>("card");

  // me 정보를 readOnly 표시용으로 미리 받아둔다.
  // 이유: 사용자가 결제 직전에 본인 이메일·이름이 맞는지 시각적으로 확인하길 원함(PM 지시).
  // 실패(401 등)는 무시 — handlePay 흐름에서 다시 검증하므로 readOnly 미표시여도 결제 진행 가능.
  const [me, setMe] = useState<MeInfo | null>(null);

  useEffect(() => {
    if (!planId) {
      router.replace("/pricing");
      return;
    }
    fetch(`/api/web/plans/${planId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setPlan(data);
      })
      .catch(() => setError("요금제 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  }, [planId, router]);

  // 토스 SDK 스크립트 로드 (한 번만)
  useEffect(() => {
    if (sdkLoaded.current) return;
    sdkLoaded.current = true;
    const script = document.createElement("script");
    script.src = "https://js.tosspayments.com/v2/standard";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // me 미리 fetch — readOnly input 표시용. 실패해도 결제 진행에는 영향 없음.
  useEffect(() => {
    fetch("/api/web/me")
      .then(async (r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .then((data) => {
        if (data) setMe(data);
      })
      .catch(() => {
        // 무시 — readOnly 미표시 상태로 결제는 가능
      });
  }, []);

  async function handlePay() {
    if (!plan || !planId) return;
    setPaying(true);
    setError(null);

    try {
      // ⚠️ 아래 로직(특히 toss.requestPayment 인자)은 한 글자도 건드리지 말 것
      const meRes = await fetch("/api/web/me");
      if (!meRes.ok) {
        // 대회 직전 §C-2: 결제 직전 401 발생 시 로그인 후 자동 복귀(open redirect 방어는 /login 페이지 isValidRedirect 가 처리).
        // SSR 안전 위해 typeof window 가드.
        const currentUrl = typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/pricing/checkout";
        router.push(`/login?redirect=${encodeURIComponent(currentUrl)}`);
        return;
      }
      const me = await meRes.json();

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error("결제 설정 오류");

      const toss = window.TossPayments(clientKey);
      const orderId = `PLAN-${planId}-${me.id}-${Date.now()}`;

      await toss.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: plan.price },
        orderId,
        orderName: plan.name,
        successUrl: `${window.location.origin}/api/web/payments/confirm?planId=${planId}`,
        failUrl: `${window.location.origin}/pricing/fail`,
        customerEmail: me.email ?? undefined,
        customerName: me.nickname ?? me.name ?? undefined,
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.message !== "결제 취소") {
        setError(e.message || "결제 중 오류가 발생했습니다.");
      }
      setPaying(false);
    }
  }

  // ── v2 스타일 로딩 스피너 ─────────────────────────────
  // 이유: PM 지시 — Suspense fallback / loading 도 v2 톤으로(spinner는 var(--accent)).
  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid var(--accent)",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── v2 스타일 에러 카드 ─────────────────────────────
  if (error || !plan) {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            maxWidth: 440,
            margin: "40px auto",
            padding: 32,
            textAlign: "center",
          }}
        >
          <p style={{ marginBottom: 16, color: "var(--accent)" }}>
            {error ?? "요금제를 찾을 수 없습니다."}
          </p>
          <a
            href="/pricing"
            style={{
              fontSize: 14,
              color: "var(--cafe-blue)",
              textDecoration: "underline",
            }}
          >
            요금제 목록으로
          </a>
        </div>
      </div>
    );
  }

  // me 응답에서 readOnly 표시할 값 추출 (없으면 "(미등록)" placeholder)
  const displayEmail = me?.email ?? "";
  const displayName = me?.nickname ?? me?.name ?? "";

  // plan_type 라벨 — 기존 규칙 보존 (PM 지시 4번)
  const planTypeLabel = plan.plan_type === "monthly" ? "월 구독 (30일)" : "1회 구매";

  return (
    <div className="page">
      {/* breadcrumb — 홈 › 요금제 › 결제 (PM 지시 1번) */}
      <div style={{ marginBottom: 16 }}>
        <Breadcrumb
          items={[
            { label: "홈", href: "/" },
            { label: "요금제", href: "/pricing" },
            { label: "결제" },
          ]}
        />
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <h1
          style={{
            fontFamily: "var(--ff-display)",
            fontSize: 24,
            fontWeight: 900,
            letterSpacing: "-0.02em",
            marginBottom: 18,
            color: "var(--ink)",
          }}
        >
          결제하기
        </h1>

        {/* 3 step indicator — 시안 StepIndicator(플랜 선택 → 결제 정보[현재] → 결제 완료)
            인라인 재현. current=1(결제 정보) 고정 — 이 페이지가 결제 정보 단계임. */}
        <ol
          style={{
            display: "flex",
            alignItems: "center",
            listStyle: "none",
            margin: "0 0 20px",
            padding: 0,
          }}
        >
          {["플랜 선택", "결제 정보", "결제 완료"].map((label, i) => {
            // i<1: 완료(done) / i===1: 현재(on) / i>1: 예정(todo)
            const state = i < 1 ? "done" : i === 1 ? "on" : "todo";
            const isOn = state === "on";
            const isDone = state === "done";
            return (
              <li
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  flex: i < 2 ? 1 : "0 0 auto",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    fontSize: 12,
                    fontWeight: 800,
                    flexShrink: 0,
                    // done/on=accent 채움 / todo=흐린 테두리
                    background: isDone || isOn ? "var(--accent)" : "var(--bg-alt)",
                    // accent 배경 위 텍스트 — 운영 .btn--accent 컨벤션과 동일하게 #fff 사용
                    color: isDone || isOn ? "#fff" : "var(--ink-dim)",
                    border: isDone || isOn ? "none" : "1px solid var(--border)",
                  }}
                >
                  {isDone ? (
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 16 }}
                    >
                      check
                    </span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: isOn ? 700 : 500,
                    color: isOn ? "var(--ink)" : "var(--ink-mute)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {label}
                </span>
                {/* 마지막 항목 제외 연결선 */}
                {i < 2 && (
                  <span
                    style={{
                      flex: 1,
                      height: 1,
                      margin: "0 4px",
                      background: i < 1 ? "var(--accent)" : "var(--border)",
                    }}
                  />
                )}
              </li>
            );
          })}
        </ol>

        {/* 선택 플랜 요약 — 시안 bl-summary 톤(선택한 플랜 라벨 + 이름 + 타입·30일 갱신 + 큰 가격) */}
        <div
          className="card"
          style={{
            padding: 20,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-mute)",
                marginBottom: 4,
              }}
            >
              선택한 플랜
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink)",
                marginBottom: 4,
              }}
            >
              {plan.name}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              {planTypeLabel}
            </div>
          </div>
          {/* 큰 가격 (시안 PriceTag md) — 실데이터 toLocaleString */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <span
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--accent)",
              }}
            >
              {plan.price.toLocaleString()}원
            </span>
            {plan.plan_type === "monthly" && (
              <span style={{ fontSize: 13, color: "var(--ink-mute)" }}> / 월</span>
            )}
          </div>
        </div>

        {/* 결제자 정보 (readOnly) — PM 지시 3번 */}
        {/* 이유: 사용자가 결제 직전에 자기 이메일·이름이 맞는지 확인. 수정은 불가(readOnly). */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          {/* 시안 BU2: person 아이콘 + "결제자 정보" 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              person
            </span>
            결제자 정보
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                이메일
              </span>
              <input
                type="text"
                readOnly
                value={displayEmail}
                placeholder="(미등록)"
                className="input"
                // readOnly 시각적 구분: 살짝 흐린 배경
                style={{
                  background: "var(--bg-alt)",
                  color: displayEmail ? "var(--ink)" : "var(--ink-dim)",
                  cursor: "default",
                }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                이름
              </span>
              <input
                type="text"
                readOnly
                value={displayName}
                placeholder="(미등록)"
                className="input"
                style={{
                  background: "var(--bg-alt)",
                  color: displayName ? "var(--ink)" : "var(--ink-dim)",
                  cursor: "default",
                }}
              />
            </label>
          </div>
        </div>

        {/* 결제 수단 — 시안 BU2 토스 위젯 영역 박제.
            ★ 토스 mock 0: 가짜 카드입력 스켈레톤(bl-pm-skel)은 재현하지 않음.
            결제수단 칩(시각) + "토스 결제창 안내 박스"로 대체 — 실제 카드입력은
            handlePay 의 toss.requestPayment 가 띄우는 토스 결제창(팝업)이 담당. */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          {/* payments 아이콘 + "결제 수단" 헤더 */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              payments
            </span>
            결제 수단
          </div>

          {/* 결제수단 칩 3종 — 시각 표시용(선택 state 는 requestPayment 인자 불변) */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            {PM_METHODS.map((m) => {
              const on = method === m.key;
              return (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => setMethod(m.key)}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                    padding: "12px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: on ? 700 : 500,
                    cursor: "pointer",
                    // 선택 시 accent 테두리 강조 / 비선택은 기본 테두리
                    background: on ? "var(--accent-soft)" : "var(--bg-alt)",
                    color: on ? "var(--accent)" : "var(--ink-mute)",
                    border: on
                      ? "1px solid var(--accent)"
                      : "1px solid var(--border)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 20 }}
                  >
                    {m.icon}
                  </span>
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* 토스 결제창 안내 박스 — mock 카드입력 스켈레톤 대신 실 결제창 안내 (lock 아이콘) */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "12px 14px",
              borderRadius: 4,
              fontSize: 13,
              lineHeight: 1.5,
              background: "var(--bg-alt)",
              color: "var(--ink-soft)",
              border: "1px dashed var(--border)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 18, color: "var(--ink-mute)", marginTop: 1 }}
            >
              lock
            </span>
            <span>
              결제하기를 누르면 토스페이먼츠 결제창이 열립니다. 카드 정보는 토스
              결제창에서 안전하게 입력합니다.
            </span>
          </div>
        </div>

        {/* 약관 4종 + 전체동의 — 시안 BU2 톤 (UI 박제, 필수 3종 동의 시에만 결제 가능) */}
        <div
          className="card"
          style={{
            padding: 24,
            marginBottom: 16,
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {/* 전체 약관 동의 — 한 번에 4종 토글 (시안 bl-term--all) */}
            <li
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingBottom: 10,
                borderBottom: "1px solid var(--border)",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              <input
                type="checkbox"
                checked={allChecked}
                onChange={toggleAllTerms}
                style={{ accentColor: "var(--accent)" }}
              />
              전체 약관에 동의합니다
            </li>

            {/* 개별 약관 4종 — 기존 agreedTerms state 4키 보존, 필수/선택 뱃지 + 보기 링크 */}
            {([
              { key: "pg", label: "전자금융거래 이용약관", req: true, view: true },
              { key: "third", label: "개인정보 제3자 제공 (토스페이먼츠)", req: true, view: true },
              { key: "refund", label: "구독 자동결제 · 환불 정책", req: true, view: true },
              { key: "marketing", label: "마케팅 정보 수신", req: false, view: false },
            ] as const).map((t) => (
              <li
                key={t.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 13,
                  color: "var(--ink-soft)",
                }}
              >
                <input
                  type="checkbox"
                  // 체크 상태를 agreedTerms state 와 동기화 (기존 로직 보존)
                  checked={agreedTerms[t.key]}
                  onChange={(e) =>
                    setAgreedTerms((prev) => ({ ...prev, [t.key]: e.target.checked }))
                  }
                  style={{ accentColor: "var(--accent)" }}
                />
                {/* 필수/선택 뱃지 (시안 bl-term__req / bl-term__opt) */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: t.req ? "var(--accent)" : "var(--ink-mute)",
                  }}
                >
                  {t.req ? "필수" : "선택"}
                </span>
                <span style={{ flex: 1 }}>{t.label}</span>
                {/* "보기" 링크 — 시안 박제(약관 상세 미연결, 시각만) */}
                {t.view && (
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--ink-dim)",
                      textDecoration: "underline",
                    }}
                  >
                    보기
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* 에러 메시지 (결제 시도 중 발생) */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              borderRadius: 8,
              fontSize: 13,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              border: "1px solid var(--accent)",
            }}
          >
            {error}
          </div>
        )}

        {/* 필수 약관 미체크 안내 — PM 지시 (reviewer 지적): 미체크일 때만 노출 */}
        {!allRequiredAgreed && (
          <p
            style={{
              marginBottom: 8,
              textAlign: "center",
              fontSize: 12,
              color: "var(--ink-dim)",
            }}
          >
            필수 약관 3건 동의 시 결제 가능
          </p>
        )}

        {/* 결제 버튼 — v2 .btn .btn--accent .btn--xl
            disabled: paying 중이거나 필수 약관 3종 미체크 시 비활성화 (reviewer 지적 반영) */}
        <button
          onClick={handlePay}
          disabled={paying || !allRequiredAgreed}
          className="btn btn--accent btn--xl"
        >
          {paying ? "결제 진행 중..." : `${plan.price.toLocaleString()}원 결제하기`}
        </button>

        <p
          style={{
            marginTop: 16,
            textAlign: "center",
            fontSize: 12,
            color: "var(--ink-mute)",
          }}
        >
          결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
        </p>

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <a
            href="/pricing"
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              textDecoration: "none",
            }}
          >
            ← 요금제 목록으로
          </a>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        // Suspense fallback 도 v2 spinner (PM 지시: 추가 항목)
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              border: "2px solid var(--accent)",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
