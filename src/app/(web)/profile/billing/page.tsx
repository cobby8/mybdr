"use client";

/* ============================================================
 * ProfileBillingPage — 결제 허브 (구독 + 결제 내역 탭 통합)
 *
 * 왜 (M1 Day 8):
 *  - 기존 /profile/subscription + /profile/payments 두 페이지가 좌측 네비 "결제" 하나로 묶여 있었지만
 *    실제로는 별도 페이지라 사용자가 구독/내역을 오가기 위해 네비를 다시 눌러야 했음.
 *  - 한 페이지에 탭 2개로 통합 + 구 경로는 redirect 보존.
 *
 * 어떻게:
 *  - 탭 상태는 URL ?tab=subscription | payments 로 관리
 *  - 탭 전환은 router.replace(..., { scroll: false })
 *  - 비활성 탭 섹션은 조건부 렌더 → 해당 API(useSWR /api/web/profile/subscription 또는 /payments) 호출 절약
 *  - 기존 페이지들의 "뒤로" 버튼 (← /profile) 과 개별 h1 은 제거. 허브 단일 헤더 "결제"만.
 * ============================================================ */

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)
import { PageBackButton } from "@/components/shared/page-back-button";

// Phase 6.2C-6 (BU3): 환불 탭 추가 → 3-tab IA (구독 / 결제 내역 / 환불)
// 이유: 시안 BU3 가 환불을 별도 sub-tab 으로 분리. 운영도 결제 내역 행 inline 환불 버튼 →
//       환불 전용 탭으로 이전 (Option A). 환불 가능/완료 결제를 한 곳에 모아 가독성↑.
type TabKey = "subscription" | "payments" | "refund";
const VALID_TABS: TabKey[] = ["subscription", "payments", "refund"];

export default function ProfileBillingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL ?tab 우선, 없으면 subscription 기본
  const rawTab = searchParams.get("tab");
  const activeTab: TabKey =
    rawTab && (VALID_TABS as string[]).includes(rawTab)
      ? (rawTab as TabKey)
      : "subscription";

  const handleTabChange = useCallback(
    (tab: TabKey) => {
      router.replace(`/profile/billing?tab=${tab}`, { scroll: false });
    },
    [router]
  );

  return (
    // 시안 v2(1) Billing.jsx — page max-width 880, 빵부스러기 + eyebrow + h1 박제
    <div className="page mx-auto" style={{ maxWidth: 880 }}>
      {/* Phase 12 §G — 모바일 백버튼 (lg+ hidden). billing 은 settings 하위 메뉴이므로 settings 로 fallback */}
      <PageBackButton fallbackHref="/profile/settings" />
      {/* 시안 빵부스러기 (프로필 › 결제·구독) */}
      <div
        style={{
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 10,
        }}
      >
        <Link
          href="/profile"
          style={{ cursor: "pointer", color: "var(--ink-mute)" }}
        >
          프로필
        </Link>{" "}
        ›{" "}
        <span style={{ color: "var(--ink)" }}>결제·구독</span>
      </div>

      {/* 시안 eyebrow + h1 */}
      <div className="eyebrow">결제 · BILLING</div>
      <h1
        style={{
          margin: "6px 0 18px",
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        결제·구독 관리
      </h1>

      {/* ============ 탭 바 (border-b-2 절제형) ============ */}
      <div
        role="tablist"
        aria-label="결제 카테고리"
        className="flex gap-6 border-b"
        style={{ borderColor: "var(--border)", marginBottom: 16 }}
      >
        <TabButton
          label="구독"
          active={activeTab === "subscription"}
          onClick={() => handleTabChange("subscription")}
          controls="panel-subscription"
        />
        <TabButton
          label="결제 내역"
          active={activeTab === "payments"}
          onClick={() => handleTabChange("payments")}
          controls="panel-payments"
        />
        {/* Phase 6.2C-6: 환불 탭 (시안 BU3 RefundTab) */}
        <TabButton
          label="환불"
          active={activeTab === "refund"}
          onClick={() => handleTabChange("refund")}
          controls="panel-refund"
        />
      </div>

      {/* ============ 탭 패널 (조건부 렌더) ============ */}
      {activeTab === "subscription" && (
        <div
          role="tabpanel"
          id="panel-subscription"
          aria-labelledby="tab-subscription"
        >
          <SubscriptionSection />
        </div>
      )}

      {/* 결제 내역 + 환불 = 동일 payments 데이터 공유 (PaymentsHub).
          이유: 환불 탭도 같은 /api/web/profile/payments 를 보므로, 두 탭을 한 컴포넌트가
                관리해 SWR 키와 환불 모달/handleRefund 를 공유 → 추가 fetch·중복 mutation 0. */}
      {(activeTab === "payments" || activeTab === "refund") && (
        <div
          role="tabpanel"
          id={activeTab === "payments" ? "panel-payments" : "panel-refund"}
          aria-labelledby={
            activeTab === "payments" ? "tab-payments" : "tab-refund"
          }
        >
          <PaymentsHub view={activeTab} />
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * TabButton — 공통 탭 버튼 (Settings 페이지와 동일 스타일)
 * ============================================================ */
function TabButton({
  label,
  active,
  onClick,
  controls,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  controls: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={controls}
      onClick={onClick}
      className="relative -mb-px py-3 text-sm font-semibold transition-colors"
      style={{
        color: active
          ? "var(--accent)"
          : "var(--ink-mute)",
        borderBottom: active
          ? "2px solid var(--accent)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
}

/* ============================================================
 * 구독 혜택 + 플랜 비교 정적 데이터 (ProfileSubscription.jsx 시안 박제)
 * 이유: DB는 plan.name/feature_key만 제공 — 혜택 목록은 UI-only 정적 매핑
 * ============================================================ */
const PLAN_BENEFITS: Record<
  string,
  { ok: boolean; text: string; highlight?: boolean }[]
> = {
  premium: [
    { ok: true, text: "Pro 의 모든 혜택" },
    {
      ok: true,
      text: "팀 운영 도구 — 로스터 무제한 / 통합 통계",
      highlight: true,
    },
    { ok: true, text: "광고 제거 — 모든 페이지" },
    { ok: true, text: "코치 매칭 — 월 1회 무료 화상 코칭" },
    { ok: true, text: "영상 분석 — 경기 영상 AI 분석 (월 5건)" },
    { ok: true, text: "우선 고객 지원" },
  ],
  pro: [
    { ok: true, text: "우선 매칭 — 빠른 게스트 모집" },
    { ok: true, text: "전 시즌 통계 무제한" },
    { ok: true, text: "대회 접수 24h 우선 오픈" },
    { ok: true, text: "프로필 인증 배지" },
    { ok: false, text: "광고 노출 — 부분 제거" },
  ],
  free: [
    { ok: true, text: "기본 매칭 알고리즘" },
    { ok: true, text: "커뮤니티 게시판 열람·작성" },
    { ok: true, text: "기본 통계 (시즌 1개)" },
    { ok: false, text: "우선 매칭 — 결제 회원 우선" },
    { ok: false, text: "광고 노출" },
  ],
};

const PLAN_COMPARE = [
  {
    key: "free",
    label: "Free",
    price: 0,
    cycle: "",
    color: "var(--ink-mute)",
    desc: "기본 매칭 + 커뮤니티",
  },
  {
    key: "pro",
    label: "BDR Pro",
    price: 4900,
    cycle: "/월",
    color: "var(--cafe-blue)",
    desc: "우선 매칭 + 통계 무제한",
  },
  {
    key: "premium",
    label: "BDR Premium",
    price: 9900,
    cycle: "/월",
    color: "var(--accent)",
    desc: "팀 운영 + 광고 제거 + 코치 매칭",
  },
];

/** plan.name 또는 feature_key 로 tierKey 판별 */
function getPlanTier(
  planName: string,
  featureKey?: string
): "premium" | "pro" | "free" {
  const k = (featureKey || planName || "").toLowerCase();
  if (k.includes("premium")) return "premium";
  if (k.includes("pro")) return "pro";
  return "free";
}

/* ============================================================
 * SubscriptionSection — 구독 서브 섹션 (기존 /profile/subscription 이식)
 *
 * 원본: src/app/(web)/profile/subscription/page.tsx
 * 변경: 상단 "뒤로" + h1 제거, 나머지 동일
 * ============================================================ */

interface SubscriptionItem {
  id: string;
  plan: {
    id: string;
    name: string;
    description: string | null;
    plan_type: string;
    price: number;
    feature_key: string;
  };
  status: string;
  feature_key: string;
  started_at: string;
  expires_at: string | null;
  is_usable: boolean;
  created_at: string;
}

interface SubscriptionsResponse {
  subscriptions: SubscriptionItem[];
}

function getSubStatusInfo(
  status: string,
  isUsable: boolean
): { label: string; color: string } {
  if (status === "active") {
    return { label: "이용중", color: "var(--ok)" };
  }
  if (status === "cancelled" && isUsable) {
    return { label: "해지 예정", color: "var(--accent)" };
  }
  if (status === "cancelled") {
    return { label: "해지됨", color: "var(--ink-mute)" };
  }
  return { label: status, color: "var(--ink-mute)" };
}

function SubscriptionSection() {
  const [cancelTarget, setCancelTarget] = useState<SubscriptionItem | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // useSWR: 이 섹션이 렌더될 때만 호출 (탭 조건부 렌더와 결합 = 결제 탭 활성일 땐 구독 API 호출 안됨)
  const { data, isLoading } = useSWR<SubscriptionsResponse>(
    "/api/web/profile/subscription",
    { revalidateOnFocus: false }
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch("/api/web/profile/subscription", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: cancelTarget.id }),
      });
      const body = await res.json();
      if (res.ok) {
        mutate("/api/web/profile/subscription");
        setCancelTarget(null);
        alert("구독이 해지되었습니다. 만료일까지 계속 이용 가능합니다.");
      } else {
        alert(body.error || "해지에 실패했습니다.");
      }
    } catch {
      alert("해지 처리 중 오류가 발생했습니다.");
    } finally {
      setCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  const subscriptions = data?.subscriptions ?? [];

  return (
    <div className="space-y-4">
      {subscriptions.length === 0 ? (
        <TossCard>
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--ink-dim)" }}
            >
              card_membership
            </span>
            <p
              className="text-sm mb-3"
              style={{ color: "var(--ink-mute)" }}
            >
              구독 중인 요금제가 없습니다
            </p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-bold px-4 py-2 rounded"
              style={{
                backgroundColor: "var(--accent)",
                color: "var(--ink-on-brand)",
              }}
            >
              요금제 보기
            </Link>
          </div>
        </TossCard>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => {
            const statusInfo = getSubStatusInfo(sub.status, sub.is_usable);
            const canCancel = sub.status === "active";

            return (
              // 시안 v2(1) 박제: 그라디언트 헤더 + 메타 그리드 + 액션 버튼 행 (3섹션 카드)
              <div
                key={sub.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                  marginBottom: 18,
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                }}
              >
                {/* 시안: 그라디언트 헤더 (cafe-blue → cafe-blue-deep) */}
                <div
                  style={{
                    padding: "20px 24px",
                    background:
                      "linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))",
                    color: "var(--ink-on-brand)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.8,
                        fontWeight: 700,
                        letterSpacing: ".12em",
                        textTransform: "uppercase",
                        marginBottom: 6,
                      }}
                    >
                      현재 구독
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--ff-display)",
                        fontWeight: 900,
                        fontSize: 30,
                        letterSpacing: "-0.01em",
                        marginBottom: 4,
                      }}
                    >
                      {sub.plan.name}
                    </div>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>
                      {sub.plan.price.toLocaleString("ko-KR")}원 /{" "}
                      {sub.plan.plan_type === "monthly" ? "월" : "회"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        padding: "4px 10px",
                        background: "rgba(255,255,255,.18)",
                        borderRadius: 3,
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: ".06em",
                        display: "inline-block",
                        marginBottom: 6,
                        color: statusInfo.color,
                        // 그라디언트 헤더 위에선 가독성을 위해 흰색 글씨 + 색상 dot
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: statusInfo.color,
                          marginRight: 6,
                          verticalAlign: "middle",
                        }}
                      />
                      <span style={{ color: "var(--ink-on-brand)" }}>
                        {statusInfo.label.toUpperCase()}
                      </span>
                    </div>
                    {sub.expires_at && (
                      <div style={{ fontSize: 12, opacity: 0.85 }}>
                        {sub.status === "cancelled" && sub.is_usable
                          ? "만료 · "
                          : "다음 결제 · "}
                        {new Date(sub.expires_at).toLocaleDateString("ko-KR")}
                      </div>
                    )}
                  </div>
                </div>

                {/* 시안: 메타 그리드 (140px 1fr 2열, 14px 폰트) */}
                <div
                  style={{
                    padding: "18px 24px",
                    display: "grid",
                    gridTemplateColumns: "140px 1fr",
                    rowGap: 10,
                    fontSize: 14,
                    color: "var(--ink)",
                  }}
                >
                  <div style={{ color: "var(--ink-dim)" }}>요금</div>
                  <div>
                    {sub.plan.price.toLocaleString("ko-KR")}원 /{" "}
                    {sub.plan.plan_type === "monthly" ? "월" : "회"}
                  </div>
                  <div style={{ color: "var(--ink-dim)" }}>시작일</div>
                  <div>
                    {new Date(sub.started_at).toLocaleDateString("ko-KR")}
                  </div>
                  {sub.expires_at && (
                    <>
                      <div style={{ color: "var(--ink-dim)" }}>
                        {sub.status === "cancelled" ? "만료일" : "다음 갱신"}
                      </div>
                      <div>
                        {new Date(sub.expires_at).toLocaleDateString("ko-KR")}
                        {sub.status === "active" && " · 자동 갱신"}
                      </div>
                    </>
                  )}
                  {sub.plan.description && (
                    <>
                      <div style={{ color: "var(--ink-dim)" }}>혜택</div>
                      <div>{sub.plan.description}</div>
                    </>
                  )}
                </div>

                {/* 시안: 하단 액션 버튼 행 (border-top 구분) */}
                <div
                  style={{
                    padding: "14px 24px",
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {canCancel && (
                    <>
                      <Link
                        href="/pricing"
                        className="btn btn--sm"
                        style={{ textDecoration: "none", minHeight: 36 }}
                      >
                        플랜 변경
                      </Link>
                      <Link
                        href="/profile/billing?tab=payments"
                        className="btn btn--sm"
                        style={{ textDecoration: "none", minHeight: 36 }}
                      >
                        결제 내역
                      </Link>
                      {/* 자동 갱신 토글 — UI-only (API 미지원) */}
                      <label
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          color: "var(--ink-soft)",
                          cursor: "default",
                          marginLeft: "auto",
                        }}
                      >
                        <input
                          type="checkbox"
                          defaultChecked
                          readOnly
                          style={{ cursor: "default" }}
                        />
                        자동 갱신
                      </label>
                      <button
                        className="btn btn--sm"
                        style={{
                          color: "var(--danger)",
                          borderColor:
                            "color-mix(in oklab, var(--danger) 30%, var(--border))",
                          minHeight: 36,
                        }}
                        onClick={() => setCancelTarget(sub)}
                      >
                        해지
                      </button>
                    </>
                  )}
                </div>

                {/* 해지 예정 안내 (active 외 상태) */}
                {sub.status === "cancelled" &&
                  sub.is_usable &&
                  sub.expires_at && (
                    <div
                      style={{
                        margin: "0 24px 18px",
                        padding: "12px 14px",
                        borderRadius: 4,
                        backgroundColor: "var(--bg-alt)",
                        color: "var(--ink-mute)",
                        fontSize: 12,
                        borderLeft: "3px solid var(--accent)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontSize: 14,
                          color: "var(--accent)",
                          verticalAlign: "text-bottom",
                          marginRight: 4,
                        }}
                      >
                        info
                      </span>
                      {new Date(sub.expires_at).toLocaleDateString("ko-KR")}까지
                      계속 이용 가능합니다.
                    </div>
                  )}
              </div>
            );
          })}

          {/* 시안 v2(1): 업그레이드 프롬프트 카드 (border-left accent) */}
          <div
            className="card"
            style={{
              padding: "18px 22px",
              marginBottom: 22,
              background: "var(--bg-alt)",
              borderLeft: "3px solid var(--accent)",
              border: "1px solid var(--border)",
              borderRadius: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    marginBottom: 2,
                    color: "var(--ink)",
                  }}
                >
                  팀장이라면?{" "}
                  <span style={{ color: "var(--accent)" }}>TEAM PRO</span>{" "}
                  플랜으로
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--ink-mute)",
                  }}
                >
                  로스터 무제한 · 대회 우선 신청 · 통합 통계
                </div>
              </div>
              <Link
                href="/pricing"
                className="btn btn--primary"
                style={{ textDecoration: "none" }}
              >
                요금제 비교 →
              </Link>
            </div>
          </div>

          {/* 시안 ProfileSubscription.jsx — 혜택 목록 (활성 구독 기준) */}
          {(() => {
            const primarySub =
              subscriptions.find((s) => s.status === "active") ??
              subscriptions[0];
            if (!primarySub) return null;
            const tier = getPlanTier(
              primarySub.plan.name,
              primarySub.plan.feature_key
            );
            const benefits = PLAN_BENEFITS[tier];
            return (
              <div
                className="card"
                style={{ padding: "22px 24px", marginBottom: 14 }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 14,
                  }}
                >
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                    {primarySub.plan.name} 혜택
                  </h2>
                  <Link
                    href="/pricing"
                    style={{
                      fontSize: 12,
                      color: "var(--ink-dim)",
                      textDecoration: "none",
                    }}
                  >
                    전체 비교 →
                  </Link>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {benefits.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "24px 1fr",
                        gap: 14,
                        padding: "12px 0",
                        alignItems: "center",
                        borderBottom:
                          i < benefits.length - 1
                            ? "1px solid var(--border)"
                            : 0,
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          display: "grid",
                          placeItems: "center",
                          background: b.ok
                            ? "color-mix(in oklab, var(--ok) 18%, transparent)"
                            : "var(--bg-alt)",
                          color: b.ok ? "var(--ok)" : "var(--ink-dim)",
                          fontSize: 12,
                          fontWeight: 900,
                        }}
                      >
                        {b.ok ? "✓" : "×"}
                      </span>
                      <div
                        style={{
                          fontSize: 14,
                          color: b.ok ? "var(--ink)" : "var(--ink-dim)",
                          fontWeight: b.highlight ? 700 : 500,
                          textDecoration: b.ok ? "none" : "line-through",
                        }}
                      >
                        {b.text}
                        {b.highlight && (
                          <span
                            style={{
                              marginLeft: 8,
                              padding: "2px 8px",
                              background:
                                "color-mix(in oklab, var(--accent) 12%, transparent)",
                              color: "var(--accent)",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: ".06em",
                              borderRadius: 3,
                              textTransform: "uppercase",
                            }}
                          >
                            PREMIUM
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* 시안 ProfileSubscription.jsx — 다른 플랜 비교 (정적 UI) */}
          {(() => {
            const primarySub =
              subscriptions.find((s) => s.status === "active") ??
              subscriptions[0];
            const currentTier = primarySub
              ? getPlanTier(
                  primarySub.plan.name,
                  primarySub.plan.feature_key
                )
              : "free";
            return (
              <div
                className="card"
                style={{
                  padding: "22px 24px",
                  marginBottom: 14,
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                }}
              >
                <h2 style={{ margin: "0 0 14px", fontSize: 18, fontWeight: 700 }}>
                  다른 플랜
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 10,
                  }}
                >
                  {PLAN_COMPARE.map((p) => {
                    const isCurrent = p.key === currentTier;
                    return (
                      <div
                        key={p.key}
                        style={{
                          padding: "18px",
                          border: `1px solid ${
                            isCurrent ? p.color : "var(--border)"
                          }`,
                          borderRadius: 6,
                          background: isCurrent
                            ? `color-mix(in oklab, ${p.color} 6%, transparent)`
                            : "transparent",
                          position: "relative",
                        }}
                      >
                        {isCurrent && (
                          <span
                            style={{
                              position: "absolute",
                              top: -9,
                              left: 14,
                              padding: "2px 8px",
                              background: p.color,
                              color: "var(--ink-on-brand)",
                              fontSize: 10,
                              fontWeight: 800,
                              letterSpacing: ".08em",
                              borderRadius: 3,
                              textTransform: "uppercase",
                            }}
                          >
                            이용 중
                          </span>
                        )}
                        <div
                          style={{
                            fontFamily: "var(--ff-display)",
                            fontWeight: 900,
                            fontSize: 20,
                            color: p.color,
                            marginBottom: 4,
                          }}
                        >
                          {p.label}
                        </div>
                        <div
                          style={{
                            fontFamily: "var(--ff-mono)",
                            fontSize: 18,
                            fontWeight: 800,
                            marginBottom: 4,
                          }}
                        >
                          {p.price === 0
                            ? "무료"
                            : `${p.price.toLocaleString("ko-KR")}원${p.cycle}`}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--ink-mute)",
                            minHeight: 32,
                            marginBottom: 12,
                          }}
                        >
                          {p.desc}
                        </div>
                        {!isCurrent && (
                          <Link
                            href="/pricing"
                            className="btn btn--sm"
                            style={{
                              display: "block",
                              textAlign: "center",
                              textDecoration: "none",
                              minHeight: 40,
                              lineHeight: "40px",
                              padding: 0,
                              background:
                                p.key === "free" ? "transparent" : p.color,
                              color:
                                p.key === "free" ? "var(--ink-soft)" : "var(--ink-on-brand)",
                              borderColor:
                                p.key === "free" ? "var(--border)" : p.color,
                            }}
                          >
                            {p.key === "free" ? "다운그레이드" : "업그레이드"}
                          </Link>
                        )}
                      </div>
                    );
                  })}
                </div>
                <style>{`
                  @media (max-width: 720px) {
                    .plan-compare-grid { grid-template-columns: 1fr !important; }
                  }
                `}</style>
              </div>
            );
          })()}
        </div>
      )}

      {/* 해지 확인 모달 */}
      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !cancelling && setCancelTarget(null)}
        >
          <div
            className="w-[90%] max-w-[360px] rounded-md p-6"
            style={{ backgroundColor: "var(--bg-elev)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--bg-alt)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "var(--danger)" }}
                >
                  cancel
                </span>
              </div>
            </div>

            <h2
              className="text-center text-lg font-bold mb-2"
              style={{ color: "var(--ink)" }}
            >
              구독을 해지하시겠습니까?
            </h2>
            <p
              className="text-center text-sm mb-1"
              style={{ color: "var(--ink-mute)" }}
            >
              <strong>{cancelTarget.plan.name}</strong> 구독이 해지됩니다.
            </p>
            {cancelTarget.expires_at && (
              <p
                className="text-center text-sm mb-6"
                style={{ color: "var(--ink-mute)" }}
              >
                {new Date(cancelTarget.expires_at).toLocaleDateString("ko-KR")}
                까지는 계속 이용할 수 있습니다.
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--bg-alt)",
                  color: "var(--ink-mute)",
                }}
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--danger)",
                  color: "var(--ink-on-brand)",
                  opacity: cancelling ? 0.6 : 1,
                }}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? "처리중..." : "해지하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
 * PaymentsHub — 결제 내역 + 환불 통합 섹션 (Phase 6.2C-6)
 *
 * 원본: src/app/(web)/profile/payments/page.tsx → /profile/billing 결제 탭
 * 변경 (6.2C-6):
 *  - view prop("payments" | "refund")으로 두 뷰 분기. 동일 payments SWR 공유 →
 *    환불 탭이 별도 fetch 안 함 (추가 fetch 0).
 *  - 결제 내역 뷰: 영수증 링크만 (inline 환불 버튼 제거 → 환불 탭으로 이전 = Option A).
 *  - 환불 뷰: 환불 안내 note + 환불 가능 결제(can_refund) + 환불 완료(refunded) 분리 (시안 BU3 RefundTab).
 *  - 환불 모달 / handleRefund 는 공유 (기존 refund API POST 그대로, 신규 mutation 0).
 * ============================================================ */

interface PaymentItem {
  id: string;
  order_id: string;
  payable_type: string;
  amount: number;
  final_amount: number;
  payment_method: string | null;
  status: string;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount: number | null;
  created_at: string;
  description: string | null;
  can_refund: boolean;
}

interface PaymentsResponse {
  payments: PaymentItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

function getStatusInfo(status: string): { label: string; color: string } {
  switch (status) {
    case "paid":
      return { label: "결제완료", color: "var(--ok)" };
    case "refunded":
      return { label: "환불완료", color: "var(--ink-mute)" };
    case "pending":
      return { label: "대기중", color: "var(--accent)" };
    case "failed":
      return { label: "실패", color: "var(--danger)" };
    default:
      return { label: status, color: "var(--ink-mute)" };
  }
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function PaymentsHub({ view }: { view: "payments" | "refund" }) {
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);
  const [refunding, setRefunding] = useState(false);
  // 시안 ProfilePayments.jsx — 클라이언트 필터 (신규 fetch 0, 현재 페이지 데이터에 적용)
  const [statusFilter, setStatusFilter] = useState<
    "all" | "paid" | "refunded" | "failed"
  >("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const { data, isLoading } = useSWR<PaymentsResponse>(
    `/api/web/profile/payments?page=${page}&limit=20`,
    { revalidateOnFocus: false }
  );

  const handleRefund = async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      const res = await fetch(`/api/web/payments/${refundTarget.id}/refund`, {
        method: "POST",
        credentials: "include",
      });
      const body = await res.json();
      if (res.ok) {
        mutate(`/api/web/profile/payments?page=${page}&limit=20`);
        setRefundTarget(null);
        alert("환불이 완료되었습니다.");
      } else {
        alert(body.error || "환불에 실패했습니다.");
      }
    } catch {
      alert("환불 처리 중 오류가 발생했습니다.");
    } finally {
      setRefunding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  const payments = data?.payments ?? [];
  const pagination = data?.pagination;

  // 시안 ProfilePayments.jsx — 요약 통계 (로드된 전체 페이지 기준)
  const totalPaidAmt = payments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.final_amount, 0);
  const totalRefundAmt = payments
    .filter((p) => p.status === "refunded")
    .reduce((s, p) => s + (p.refund_amount ?? p.final_amount), 0);
  const totalNet = totalPaidAmt - totalRefundAmt;

  // 시안 ProfilePayments.jsx — 클라이언트 필터 (status + year)
  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (yearFilter !== "all") {
      const dateStr = (p.paid_at || p.created_at).substring(0, 4);
      if (dateStr !== yearFilter) return false;
    }
    return true;
  });

  // 5열 board grid 정의 (시안 ProfilePayments.jsx: 날짜/항목/결제수단/금액/상태)
  const BOARD_COLUMNS = "120px 1.6fr 140px 110px 90px";

  // 환불 탭용 분리 (시안 BU3 RefundTab): can_refund=서버 산출(paid + 7일 이내) / refunded=환불 완료
  const refundable = payments.filter((p) => p.can_refund);
  const refunded = payments.filter((p) => p.status === "refunded");

  // 환불 확인 모달 (결제 내역/환불 두 뷰 공통 — 환불 탭에서만 트리거되지만 마운트는 공유)
  const refundModal = refundTarget && (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={() => !refunding && setRefundTarget(null)}
    >
      <div
        className="w-[90%] max-w-[360px] rounded-md p-6"
        style={{ backgroundColor: "var(--bg-elev)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center mb-4">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--bg-alt)" }}
          >
            <span
              className="material-symbols-outlined text-3xl"
              style={{ color: "var(--danger)" }}
            >
              currency_exchange
            </span>
          </div>
        </div>

        <h2
          className="text-center text-lg font-bold mb-2"
          style={{ color: "var(--ink)" }}
        >
          환불하시겠습니까?
        </h2>
        <p
          className="text-center text-sm mb-6"
          style={{ color: "var(--ink-mute)" }}
        >
          {formatAmount(refundTarget.final_amount)}이 환불됩니다.
          <br />
          환불 후에는 되돌릴 수 없습니다.
        </p>

        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded text-sm font-bold"
            style={{
              backgroundColor: "var(--bg-alt)",
              color: "var(--ink-mute)",
            }}
            onClick={() => setRefundTarget(null)}
            disabled={refunding}
          >
            취소
          </button>
          <button
            className="flex-1 py-3 rounded text-sm font-bold"
            style={{
              backgroundColor: "var(--danger)",
              color: "var(--ink-on-brand)",
              opacity: refunding ? 0.6 : 1,
            }}
            onClick={handleRefund}
            disabled={refunding}
          >
            {refunding ? "처리중..." : "환불하기"}
          </button>
        </div>
      </div>
    </div>
  );

  // ====== 환불 뷰 (시안 BU3 RefundTab) ======
  if (view === "refund") {
    return (
      <div className="space-y-4">
        {/* 환불 안내 note (시안 bl-refund-note 톤 → 운영 인라인) */}
        <div
          style={{
            display: "flex",
            gap: 12,
            padding: "16px 18px",
            background: "var(--bg-alt)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            marginBottom: 4,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 22,
              color: "var(--cafe-blue, var(--accent))",
              flexShrink: 0,
            }}
          >
            info
          </span>
          <div>
            <div
              style={{ fontSize: 13.5, fontWeight: 800, color: "var(--ink)" }}
            >
              환불은 결제 항목별로 신청합니다
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--ink-mute)",
                lineHeight: 1.6,
                marginTop: 4,
              }}
            >
              결제 후 7일 이내 결제 건만 환불할 수 있어요. 구독 결제는 다음 결제일
              전 <strong style={{ color: "var(--ink-soft)" }}>구독 취소</strong>로
              처리됩니다. 환불은 결제 수단으로 영업일 기준 3~5일 내 입금돼요.
            </div>
          </div>
        </div>

        {/* 환불 가능 결제 (can_refund) */}
        {refundable.length > 0 && (
          <div className="space-y-2">
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                marginTop: 12,
              }}
            >
              환불 가능 결제
            </div>
            {refundable.map((p) => (
              <RefundRow
                key={p.id}
                p={p}
                onRefund={() => setRefundTarget(p)}
              />
            ))}
          </div>
        )}

        {/* 환불 완료 (refunded) */}
        <div className="space-y-2">
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "var(--ink)",
              marginTop: 12,
            }}
          >
            환불 완료
          </div>
          {refunded.length > 0 ? (
            refunded.map((p) => (
              <RefundRow key={p.id} p={p} refundedView />
            ))
          ) : (
            <TossCard>
              <div className="py-10 text-center">
                <span
                  className="material-symbols-outlined text-4xl mb-3 block"
                  style={{ color: "var(--ink-dim)" }}
                >
                  undo
                </span>
                <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
                  환불 내역이 없습니다
                </p>
              </div>
            </TossCard>
          )}
        </div>

        {/* 환불 가능·완료 모두 0건 → 안내 (note 외 빈 상태) */}
        {refundable.length === 0 && refunded.length === 0 && (
          <p
            style={{
              fontSize: 12,
              color: "var(--ink-dim)",
              textAlign: "center",
              padding: "4px 0 12px",
            }}
          >
            환불 가능한 결제가 없습니다.
          </p>
        )}

        {refundModal}
      </div>
    );
  }

  // ====== 결제 내역 뷰 (ProfilePayments.jsx 시안 갭 적용) ======
  // 변경: 요약 통계 4카드 + 필터 칩 + 연도 셀렉트 + 5열 테이블 + CTA 푸터
  // 보존: 기존 useSWR/handleRefund/pagination/snake_case 접근 0변경

  // 필터 칩 정의 (시안 ProfilePayments.jsx L32-36)
  const filterChips = [
    {
      id: "all" as const,
      label: "전체",
      count: payments.length,
    },
    {
      id: "paid" as const,
      label: "결제 완료",
      count: payments.filter((p) => p.status === "paid").length,
    },
    {
      id: "refunded" as const,
      label: "환불",
      count: payments.filter((p) => p.status === "refunded").length,
    },
    {
      id: "failed" as const,
      label: "실패",
      count: payments.filter((p) => p.status === "failed").length,
    },
  ];

  return (
    <div className="space-y-4">
      {/* 시안 ProfilePayments.jsx L80-86 — 요약 4 stats */}
      <div
        className="pp-stats"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginBottom: 4,
        }}
      >
        {[
          { label: "이번 기간 거래", value: `${payments.length}건`, color: "var(--ink)" },
          {
            label: "결제 완료 합계",
            value: formatAmount(totalPaidAmt),
            color: "var(--ink)",
          },
          {
            label: "환불 합계",
            value: formatAmount(totalRefundAmt),
            color: "var(--ink-mute)",
          },
          {
            label: "순 결제액",
            value: formatAmount(totalNet),
            color: "var(--accent)",
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: "16px 18px" }}>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                fontWeight: 800,
                letterSpacing: ".08em",
                textTransform: "uppercase",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                fontSize: 22,
                letterSpacing: "-0.015em",
                marginTop: 4,
                color: s.color,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* 시안 ProfilePayments.jsx L88-120 — 필터 칩 + 연도 셀렉트 */}
      <div
        className="card"
        style={{
          padding: "14px 16px",
          display: "flex",
          gap: 8,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {filterChips.map((f) => {
            const on = statusFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id)}
                style={{
                  padding: "8px 12px",
                  minHeight: 40,
                  border: `1px solid ${on ? "var(--accent)" : "var(--border)"}`,
                  background: on ? "var(--accent)" : "transparent",
                  color: on ? "var(--ink-on-brand)" : "var(--ink-soft)",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: on ? 700 : 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                {f.label}
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "var(--ff-mono)",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: 3,
                    background: on
                      ? "rgba(255,255,255,.22)"
                      : "var(--bg-alt)",
                    color: on ? "var(--ink-on-brand)" : "var(--ink-dim)",
                  }}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          style={{
            fontSize: 14,
            minHeight: 40,
            padding: "0 10px",
            maxWidth: 140,
            border: "1px solid var(--border)",
            borderRadius: 4,
            background: "var(--bg-alt)",
            color: "var(--ink)",
            cursor: "pointer",
          }}
        >
          <option value="all">전체 기간</option>
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
          <option value="2024">2024년</option>
        </select>
      </div>

      {/* 테이블 */}
      {filteredPayments.length === 0 ? (
        <TossCard>
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--ink-dim)" }}
            >
              receipt_long
            </span>
            <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
              해당 기간·상태에 결제 내역이 없습니다
            </p>
          </div>
        </TossCard>
      ) : (
        <>
          {/* 시안 ProfilePayments.jsx — 5열 data-table (날짜/항목/결제수단/금액/상태) */}
          <div className="board">
            <div
              className="board__head"
              style={{ gridTemplateColumns: BOARD_COLUMNS }}
            >
              <div>날짜</div>
              <div>항목</div>
              <div>결제수단</div>
              <div style={{ textAlign: "right" }}>금액</div>
              <div style={{ textAlign: "center" }}>상태</div>
            </div>

            {filteredPayments.map((p) => {
              const statusInfo = getStatusInfo(p.status);
              // 결제일은 paid_at 우선, 없으면 created_at — 기존 동작 보존
              const dateStr = p.paid_at
                ? new Date(p.paid_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })
                : new Date(p.created_at).toLocaleDateString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  });

              return (
                <div
                  key={p.id}
                  className="board__row"
                  style={{ gridTemplateColumns: BOARD_COLUMNS }}
                >
                  {/* 날짜 + 주문번호 */}
                  <div
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontSize: 12,
                      color: "var(--ink-mute)",
                    }}
                  >
                    {dateStr}
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--ink-dim)",
                        marginTop: 2,
                      }}
                    >
                      {p.order_id}
                    </div>
                  </div>

                  {/* 항목 — description 우선, payable_type 폴백 */}
                  <div className="title" style={{ display: "block" }}>
                    <p
                      style={{
                        fontWeight: 600,
                        color: "var(--ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.description || p.payable_type}
                    </p>
                    {p.status === "refunded" && p.refunded_at && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--ink-dim)",
                          fontFamily: "var(--ff-mono)",
                          marginTop: 2,
                        }}
                      >
                        환불 처리 ·{" "}
                        {new Date(p.refunded_at).toLocaleDateString("ko-KR")}
                      </p>
                    )}
                  </div>

                  {/* 결제수단 (5열 신규) */}
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--ink-soft)",
                    }}
                  >
                    {p.payment_method || "—"}
                  </div>

                  {/* 금액 — refunded는 line-through */}
                  <div
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 700,
                      textAlign: "right",
                      color:
                        p.status === "refunded"
                          ? "var(--ink-mute)"
                          : p.status === "failed"
                          ? "var(--ink-dim)"
                          : "var(--ink)",
                      textDecoration:
                        p.status === "failed" ? "line-through" : "none",
                    }}
                  >
                    {formatAmount(p.final_amount)}
                  </div>

                  {/* 상태 + 영수증 */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      className={`badge ${
                        p.status === "paid"
                          ? "badge--ok"
                          : p.status === "failed"
                          ? "badge--red"
                          : "badge--ghost"
                      }`}
                      style={{ fontSize: 11, whiteSpace: "nowrap" }}
                    >
                      {statusInfo.label}
                    </span>
                    {/* 영수증: 결제완료 건만 */}
                    {p.status === "paid" && (
                      <Link
                        href={`/pricing/success?orderId=${encodeURIComponent(
                          p.order_id
                        )}&amount=${p.final_amount}&method=${encodeURIComponent(
                          p.payment_method ?? "카드"
                        )}`}
                        style={{
                          fontSize: 10,
                          color: "var(--ink-dim)",
                          textDecoration: "none",
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 12 }}
                        >
                          receipt
                        </span>
                        영수증
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 페이지네이션 (필터 미적용 전체 기준) */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--accent)" }}
          >
            이전
          </button>
          <span className="text-sm" style={{ color: "var(--ink-mute)" }}>
            {page} / {pagination.total_pages}
          </span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => setPage(page + 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--accent)" }}
          >
            다음
          </button>
        </div>
      )}

      {/* 시안 ProfilePayments.jsx L183-186 — CTA 푸터 (현금영수증 안내) */}
      <div
        style={{
          marginTop: 8,
          padding: "14px 18px",
          background: "var(--bg-alt)",
          borderRadius: 4,
          fontSize: 12,
          color: "var(--ink-mute)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <span>
          현금영수증·세금계산서 발급은{" "}
          <Link
            href="/settings"
            style={{ color: "var(--accent)", textDecoration: "none" }}
          >
            설정 › 결제·멤버십
          </Link>{" "}
          에서 처리됩니다.
        </span>
        <button className="btn btn--sm" style={{ minHeight: 36 }}>
          문의하기
        </button>
      </div>

      {/* 환불 확인 모달 (공통 변수 — 결제 내역 뷰에서도 마운트하나 트리거는 환불 탭) */}
      {refundModal}

      <style>{`
        @media (max-width: 720px) {
          .pp-stats { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

/* ============================================================
 * RefundRow — 환불 탭 결제 행 (시안 BU3 bl-pay-row 톤 → 운영 인라인)
 *  - refundedView=false: 환불 가능 결제 ("환불 신청" 버튼)
 *  - refundedView=true:  환불 완료 결제 (금액 line-through + 환불일)
 * ============================================================ */
function RefundRow({
  p,
  onRefund,
  refundedView = false,
}: {
  p: PaymentItem;
  onRefund?: () => void;
  refundedView?: boolean;
}) {
  const dateStr = (p.paid_at ? new Date(p.paid_at) : new Date(p.created_at))
    .toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        border: "1px solid var(--border)",
        borderRadius: 4,
        background: "var(--bg-elev)",
      }}
    >
      {/* 내역 + 메타 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {p.description || p.payable_type}
        </div>
        <div
          style={{
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            color: "var(--ink-mute)",
            marginTop: 3,
          }}
        >
          {dateStr}
          {p.payment_method ? ` · ${p.payment_method}` : ""}
          {refundedView && p.refunded_at
            ? ` · 환불 ${new Date(p.refunded_at).toLocaleDateString("ko-KR")}`
            : ""}
        </div>
      </div>

      {/* 금액 — 환불 완료는 line-through 음소거 */}
      <div
        style={{
          fontFamily: "var(--ff-mono)",
          fontWeight: 700,
          fontSize: 15,
          whiteSpace: "nowrap",
          color: refundedView ? "var(--ink-mute)" : "var(--ink)",
          textDecoration: refundedView ? "line-through" : "none",
        }}
      >
        {formatAmount(
          refundedView && p.refund_amount ? p.refund_amount : p.final_amount
        )}
      </div>

      {/* 액션: 환불 가능 → 환불 신청 버튼 / 환불 완료 → 상태 배지 */}
      {refundedView ? (
        <span
          className="badge"
          style={{
            color: "var(--ink-mute)",
            backgroundColor: "var(--bg-alt)",
            border: "1px solid var(--border)",
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "var(--radius-chip, 4px)",
            whiteSpace: "nowrap",
          }}
        >
          환불완료
        </span>
      ) : (
        <button
          type="button"
          onClick={onRefund}
          style={{
            fontSize: 12,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: "var(--radius-chip, 4px)",
            color: "var(--danger)",
            backgroundColor: "transparent",
            border: "1px solid var(--danger)",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          환불 신청
        </button>
      )}
    </div>
  );
}
