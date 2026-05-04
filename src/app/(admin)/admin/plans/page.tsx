"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper → div + 토큰 (admin/* 단순화)
// - 자체 rounded bg-* 버튼 → .btn .btn--primary / .btn--ghost / .btn--sm
// - thead 자체 className 제거 (admin-table CSS 자동)
// - tr hover className 제거 (admin-table CSS 자동)

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// (web) 시안 카드 패턴
const CARD_CLASS = "rounded-[var(--radius-card)] border p-4 sm:p-5";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

type Plan = {
  id: string;
  name: string;
  description: string | null;
  plan_type: string;
  feature_key: string;
  price: number;
  max_uses: number | null;
  is_active: boolean;
  created_at: string;
};

const PLAN_TYPE_LABELS: Record<string, string> = { monthly: "월 구독", one_time: "1회 구매" };
const FEATURE_KEY_OPTIONS = [
  { value: "team_create", label: "팀 생성권" },
  { value: "pickup_game", label: "픽업게임" },
  { value: "court_rental", label: "체육관 대관" },
  { value: "tournament_create", label: "대회 생성" },
];

const PROMO_TIERS = [
  { membershipType: 2, label: "팀장", price: "₩3,900/월" },
  { membershipType: 3, label: "대회관리자", price: "₩199,000/월" },
];

const EMPTY_FORM = { name: "", description: "", plan_type: "monthly", feature_key: "team_create", price: "", max_uses: "" };

type PromoStats = { membershipType: number; count: number };

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Plan | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [promoStats, setPromoStats] = useState<PromoStats[]>([]);
  const [endingPromo, setEndingPromo] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const [plansRes, statsRes] = await Promise.all([
      fetch("/api/admin/plans"),
      fetch("/api/admin/promo-stats"),
    ]);
    const plansData = await plansRes.json();
    setPlans(Array.isArray(plansData) ? plansData : []);
    if (statsRes.ok) {
      const statsData = await statsRes.json();
      setPromoStats(Array.isArray(statsData) ? statsData : []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError(null);
    setShowModal(true);
  }

  function openEdit(plan: Plan) {
    setEditTarget(plan);
    setForm({
      name: plan.name,
      description: plan.description ?? "",
      plan_type: plan.plan_type,
      feature_key: plan.feature_key,
      price: String(plan.price),
      max_uses: plan.max_uses ? String(plan.max_uses) : "",
    });
    setError(null);
    setShowModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const url = editTarget ? `/api/admin/plans/${editTarget.id}` : "/api/admin/plans";
    const method = editTarget ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: parseInt(form.price), max_uses: form.max_uses ? parseInt(form.max_uses) : null }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "저장 실패"); setSaving(false); return; }
    setSaving(false);
    setShowModal(false);
    load();
  }

  async function handleToggle(plan: Plan) {
    await fetch(`/api/admin/plans/${plan.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !plan.is_active }),
    });
    load();
  }

  async function handleDelete(plan: Plan) {
    if (!confirm(`"${plan.name}" 요금제를 삭제하시겠습니까?`)) return;
    const res = await fetch(`/api/admin/plans/${plan.id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.deactivated) alert("구독자가 있어 비활성화 처리되었습니다.");
    load();
  }

  const endPromotion = async (membershipType: number, label: string) => {
    const count = promoStats.find((s) => s.membershipType === membershipType)?.count ?? 0;
    if (!confirm(`[${label}] 프로모션을 종료하시겠습니까?\n현재 ${count}명의 구독이 만료됩니다.`)) return;
    setEndingPromo(membershipType);
    try {
      const formData = new FormData();
      formData.append("membership_type", String(membershipType));
      const { endPromotionAction } = await import("@/app/actions/admin-users");
      const result = await endPromotionAction(formData);
      if (result.error) {
        alert(result.error);
      } else {
        await load();
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setEndingPromo(null);
    }
  };

  return (
    <div>
      <AdminPageHeader
        eyebrow="ADMIN · PLANS"
        title="요금제 관리"
        subtitle="기능별 요금제 / 프로모션 관리"
        actions={<Button onClick={openCreate}>+ 요금제 추가</Button>}
      />

      {/* 프로모션 관리 */}
      <div className={`${CARD_CLASS} mb-6`} style={CARD_STYLE}>
        <h2 className="mb-4 text-base font-semibold">프로모션 관리</h2>
        <div className="space-y-3">
          {PROMO_TIERS.map((tier) => {
            const stat = promoStats.find((s) => s.membershipType === tier.membershipType);
            const count = stat?.count ?? 0;
            return (
              <div
                key={tier.membershipType}
                className="flex items-center justify-between rounded-[12px] px-4 py-3"
                style={{ background: "var(--color-surface)" }}
              >
                <div>
                  <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{tier.label}</p>
                  <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                    정가 {tier.price} ·{" "}
                    <span className="font-medium" style={{ color: "var(--color-primary)" }}>프로모션 무료 {count}명</span>
                  </p>
                </div>
                {count > 0 ? (
                  // (web) .btn 패턴 — 위험 톤은 inline color 만 유지
                  <button
                    onClick={() => endPromotion(tier.membershipType, tier.label)}
                    disabled={endingPromo === tier.membershipType}
                    className="btn btn--sm disabled:opacity-50"
                    style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                  >
                    {endingPromo === tier.membershipType ? "처리 중..." : "프로모션 종료"}
                  </button>
                ) : (
                  <span className="badge badge--soft">프로모션 없음</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
          * 프로모션 종료 시 해당 티어의 subscription_expires_at = NULL 인 유저가 즉시 만료됩니다.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center" style={{ color: "var(--color-text-muted)" }}>로딩 중...</div>
      ) : plans.length === 0 ? (
        <div className={`${CARD_CLASS} py-12 text-center`} style={{ ...CARD_STYLE, color: "var(--color-text-muted)" }}>
          <div className="mb-2 text-3xl" style={{ color: "var(--color-text-muted)" }}>--</div>
          등록된 요금제가 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto admin-table-wrap">
          {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
          <table className="admin-table w-full table-fixed text-sm">
            <colgroup>
              <col />
              <col className="w-[130px]" />
              <col className="w-[90px]" />
              <col className="w-[105px]" />
              <col className="w-[75px]" />
              <col className="w-[165px]" />
            </colgroup>
            <thead>
              <tr>
                <th className="pb-3 pr-4">이름</th>
                <th className="pb-3 pr-4">기능 키</th>
                <th className="pb-3 pr-4">타입</th>
                <th className="pb-3 pr-4">금액</th>
                <th className="pb-3 pr-4">상태</th>
                <th className="pb-3">관리</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id}>
                  <td data-primary="true" className="py-3 pr-4 font-medium">
                    {plan.name}
                    {plan.description && (
                      <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>{plan.description}</div>
                    )}
                  </td>
                  <td data-label="기능 키" className="py-3 pr-4 font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>{plan.feature_key}</td>
                  <td data-label="타입" className="py-3 pr-4 text-xs" style={{ color: "var(--color-text-muted)" }}>{PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type}</td>
                  <td data-label="금액" className="py-3 pr-4 font-semibold">{plan.price.toLocaleString()}원</td>
                  <td data-label="상태" className="py-3 pr-4">
                    <span
                      className="badge badge--soft"
                      style={
                        plan.is_active
                          ? { background: "color-mix(in srgb, var(--color-success) 12%, transparent)", color: "var(--color-success)", borderColor: "transparent" }
                          : undefined
                      }
                    >
                      {plan.is_active ? "활성" : "비활성"}
                    </span>
                  </td>
                  <td data-actions="true" className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(plan)} className="btn btn--sm">수정</button>
                      <button onClick={() => handleToggle(plan)} className="btn btn--sm">
                        {plan.is_active ? "비활성화" : "활성화"}
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        className="btn btn--sm"
                        style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-[20px] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <h2 className="mb-4 text-lg font-bold">{editTarget ? "요금제 수정" : "요금제 추가"}</h2>

            {error && (
              <div className="mb-4 rounded-[12px] px-4 py-3 text-sm" style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}>{error}</div>
            )}

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">이름 *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                  placeholder="예: 팀 생성권"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-text-muted)]">설명</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                  placeholder="간단한 설명"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">타입 *</label>
                  <select
                    value={form.plan_type}
                    onChange={(e) => setForm({ ...form, plan_type: e.target.value })}
                    disabled={!!editTarget}
                    className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                  >
                    <option value="monthly">월 구독</option>
                    <option value="one_time">1회 구매</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">기능 키 *</label>
                  <select
                    value={form.feature_key}
                    onChange={(e) => setForm({ ...form, feature_key: e.target.value })}
                    disabled={!!editTarget}
                    className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none"
                  >
                    {FEATURE_KEY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">금액 (원) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                    placeholder="9900"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-[var(--color-text-muted)]">최대 사용 횟수</label>
                  <input
                    type="number"
                    value={form.max_uses}
                    onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
                    className="w-full rounded-[12px] border-none bg-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
                    placeholder="2 (선택)"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="flex-1">
                {saving ? "저장 중..." : "저장"}
              </Button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-[12px] border border-[var(--color-border)] py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
