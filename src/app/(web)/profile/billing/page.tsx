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

type TabKey = "subscription" | "payments";
const VALID_TABS: TabKey[] = ["subscription", "payments"];

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
        style={{ borderColor: "var(--color-border-subtle)", marginBottom: 16 }}
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

      {activeTab === "payments" && (
        <div
          role="tabpanel"
          id="panel-payments"
          aria-labelledby="tab-payments"
        >
          <PaymentsSection />
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
          ? "var(--color-primary)"
          : "var(--color-text-secondary)",
        borderBottom: active
          ? "2px solid var(--color-primary)"
          : "2px solid transparent",
      }}
    >
      {label}
    </button>
  );
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
    return { label: "이용중", color: "var(--color-success, #22C55E)" };
  }
  if (status === "cancelled" && isUsable) {
    return { label: "해지 예정", color: "var(--color-accent)" };
  }
  if (status === "cancelled") {
    return { label: "해지됨", color: "var(--color-text-muted)" };
  }
  return { label: status, color: "var(--color-text-muted)" };
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
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
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
              style={{ color: "var(--color-text-disabled)" }}
            >
              card_membership
            </span>
            <p
              className="text-sm mb-3"
              style={{ color: "var(--color-text-muted)" }}
            >
              구독 중인 요금제가 없습니다
            </p>
            <Link
              href="/pricing"
              className="inline-block text-sm font-bold px-4 py-2 rounded"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "var(--color-on-primary, #FFFFFF)",
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
                  background: "var(--color-card)",
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
                    color: "#fff",
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
                      <span style={{ color: "#fff" }}>
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
                  }}
                >
                  {canCancel && (
                    <button
                      className="btn btn--ghost"
                      style={{
                        marginLeft: "auto",
                        color: "var(--danger)",
                      }}
                      onClick={() => setCancelTarget(sub)}
                    >
                      구독 해지
                    </button>
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
            style={{ backgroundColor: "var(--color-bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "var(--color-error, #EF4444)" }}
                >
                  cancel
                </span>
              </div>
            </div>

            <h2
              className="text-center text-lg font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              구독을 해지하시겠습니까?
            </h2>
            <p
              className="text-center text-sm mb-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              <strong>{cancelTarget.plan.name}</strong> 구독이 해지됩니다.
            </p>
            {cancelTarget.expires_at && (
              <p
                className="text-center text-sm mb-6"
                style={{ color: "var(--color-text-muted)" }}
              >
                {new Date(cancelTarget.expires_at).toLocaleDateString("ko-KR")}
                까지는 계속 이용할 수 있습니다.
              </p>
            )}

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => setCancelTarget(null)}
                disabled={cancelling}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
                  color: "var(--color-on-primary, #FFFFFF)",
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
 * PaymentsSection — 결제 내역 서브 섹션 (기존 /profile/payments 이식)
 *
 * 원본: src/app/(web)/profile/payments/page.tsx
 * 변경: 상단 "뒤로" + h1 제거, 나머지 동일
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
      return { label: "결제완료", color: "var(--color-success, #22C55E)" };
    case "refunded":
      return { label: "환불완료", color: "var(--color-text-muted)" };
    case "pending":
      return { label: "대기중", color: "var(--color-accent)" };
    case "failed":
      return { label: "실패", color: "var(--color-error, #EF4444)" };
    default:
      return { label: status, color: "var(--color-text-muted)" };
  }
}

function formatAmount(amount: number): string {
  return amount.toLocaleString("ko-KR") + "원";
}

function PaymentsSection() {
  const [page, setPage] = useState(1);
  const [refundTarget, setRefundTarget] = useState<PaymentItem | null>(null);
  const [refunding, setRefunding] = useState(false);

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
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          불러오는 중...
        </p>
      </div>
    );
  }

  const payments = data?.payments ?? [];
  const pagination = data?.pagination;

  // 4열 board grid 정의
  // 이유: 데스크톱에서 결제일/내역/금액/상태 컬럼 너비를 고정해 정렬을 안정시키고,
  //       상태 컬럼은 라벨+inline 액션(영수증/환불)을 모두 담아야 해서 폭을 크게(220px) 잡음.
  const BOARD_COLUMNS = "140px 1fr 120px 220px";

  return (
    <div className="space-y-6">
      {payments.length === 0 ? (
        <TossCard>
          <div className="py-12 text-center">
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              receipt_long
            </span>
            <p
              className="text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              결제 내역이 없습니다
            </p>
          </div>
        </TossCard>
      ) : (
        <>
          {/* 시안 v2(1): 결제 내역 섹션 헤더 (h2 + 전체 다운로드 링크) */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 10,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "var(--ink)",
              }}
            >
              결제 내역
            </h2>
          </div>

          {/* v2 .board 토큰 사용 — 다른 v2 보드(rankings/teams)와 동일 패턴 */}
          <div className="board">
          {/* 헤더: 4열 grid */}
          <div
            className="board__head"
            style={{ gridTemplateColumns: BOARD_COLUMNS }}
          >
            <div>결제일</div>
            <div>내역</div>
            <div>금액</div>
            <div>상태</div>
          </div>

          {payments.map((p) => {
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
                {/* 결제일 — mono 폰트로 정렬 가독성 향상 */}
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontSize: 13,
                    color: "var(--ink-dim)",
                  }}
                >
                  {dateStr}
                </div>

                {/* 내역 — description 우선, 없으면 payable_type 폴백 + 결제수단/환불일 메타 */}
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
                  <p
                    style={{
                      fontSize: 12,
                      marginTop: 2,
                      color: "var(--ink-mute)",
                    }}
                  >
                    {p.payment_method || "—"}
                    {p.status === "refunded" && p.refunded_at && (
                      <>
                        {" · 환불 "}
                        {new Date(p.refunded_at).toLocaleDateString("ko-KR")}
                        {p.refund_amount
                          ? ` (${formatAmount(p.refund_amount)})`
                          : ""}
                      </>
                    )}
                  </p>
                </div>

                {/* 금액 — refunded 상태는 line-through로 음소거 */}
                <div
                  style={{
                    fontFamily: "var(--ff-mono)",
                    fontWeight: 700,
                    color:
                      p.status === "refunded"
                        ? "var(--ink-mute)"
                        : "var(--ink)",
                    textDecoration:
                      p.status === "refunded" ? "line-through" : "none",
                  }}
                >
                  {formatAmount(p.final_amount)}
                </div>

                {/* 상태 + inline 액션 (영수증/환불)
                    이유: 4열 board 안에 별도 액션 컬럼을 추가하면 모바일에서 너무 좁아짐.
                          상태 라벨 옆에 inline으로 배치해 시각적 그룹화. */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    className="badge"
                    style={{
                      color: statusInfo.color,
                      backgroundColor: "var(--bg-alt)",
                      border: "1px solid var(--border)",
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "var(--radius-chip, 4px)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {statusInfo.label}
                  </span>

                  {/* 영수증: 결제완료 건만 노출 — pricing/success 페이지 재활용 */}
                  {p.status === "paid" && (
                    <Link
                      href={`/pricing/success?orderId=${encodeURIComponent(
                        p.order_id
                      )}&amount=${p.final_amount}&method=${encodeURIComponent(
                        p.payment_method ?? "카드"
                      )}`}
                      className="inline-flex items-center gap-1"
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: "var(--cafe-blue, var(--color-primary))",
                        textDecoration: "none",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{ fontSize: 14 }}
                      >
                        receipt
                      </span>
                      영수증
                    </Link>
                  )}

                  {/* 환불: API에서 can_refund=true 일 때만 — 모달 트리거 */}
                  {p.can_refund && (
                    <button
                      type="button"
                      onClick={() => setRefundTarget(p)}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 10px",
                        borderRadius: "var(--radius-chip, 4px)",
                        color: "var(--color-error, #EF4444)",
                        backgroundColor: "transparent",
                        border: "1px solid var(--color-error, #EF4444)",
                        cursor: "pointer",
                      }}
                    >
                      환불
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </>
      )}

      {/* 페이지네이션 */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--color-primary)" }}
          >
            이전
          </button>
          <span
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            {page} / {pagination.total_pages}
          </span>
          <button
            disabled={page >= pagination.total_pages}
            onClick={() => setPage(page + 1)}
            className="text-sm font-bold px-3 py-1 rounded disabled:opacity-30"
            style={{ color: "var(--color-primary)" }}
          >
            다음
          </button>
        </div>
      )}

      {/* 환불 확인 모달 */}
      {refundTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => !refunding && setRefundTarget(null)}
        >
          <div
            className="w-[90%] max-w-[360px] rounded-md p-6"
            style={{ backgroundColor: "var(--color-bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center mb-4">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "var(--color-error, #EF4444)" }}
                >
                  currency_exchange
                </span>
              </div>
            </div>

            <h2
              className="text-center text-lg font-bold mb-2"
              style={{ color: "var(--color-text-primary)" }}
            >
              환불하시겠습니까?
            </h2>
            <p
              className="text-center text-sm mb-6"
              style={{ color: "var(--color-text-muted)" }}
            >
              {formatAmount(refundTarget.final_amount)}이 환불됩니다.
              <br />
              환불 후에는 되돌릴 수 없습니다.
            </p>

            <div className="flex gap-3">
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-surface)",
                  color: "var(--color-text-secondary)",
                }}
                onClick={() => setRefundTarget(null)}
                disabled={refunding}
              >
                취소
              </button>
              <button
                className="flex-1 py-3 rounded text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-error, #EF4444)",
                  color: "var(--color-on-primary, #FFFFFF)",
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
      )}
    </div>
  );
}
