"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper → div + 토큰 (admin/* 단순화)
// - 자체 rounded bg-* 버튼 → .btn .btn--primary / .btn--ghost / .btn--sm
// - thead 자체 className 제거 (admin-table CSS 자동)
// - tr hover className 제거 (admin-table CSS 자동)
// 2026-05-15: Admin-5-B 박제 (BDR v2.14)
// - AdminPageHeader 에 eyebrow="ADMIN · 비즈니스" + breadcrumbs + actions(결제 내역 링크)
// - 상태 `.badge--soft` 인라인 색상 → `admin-stat-pill[data-tone]` (active=ok / withdrawn=mute)
// - 프로모션 종료 버튼 / 모달 / fetch / Server Action 100% 보존
// 2026-05-31: Phase 6.2C-4 박제 (BDR v2.25 · BA2 · BB1)
// - 플랜 list: admin-table → 카드 grid (시안 BB1 bl-pgrid 답습). 기존 CARD_CLASS/CARD_STYLE 재사용 → 신규 CSS 0
// - 카드 = 이름 + 활성배지(admin-stat-pill) + 타입/기능키 태그 + 가격(0원→무료, 천단위) + 설명 + 수정/토글/삭제
// - subscribers·features hide (운영 plans 미보유 컬럼, mock 0) / 복제 버튼 미배치 (신규 mutation 0)
// - 파싱 보정: data.data ?? data (apiSuccess snake_case 래핑 대비, 액션 0 변경)
// - CRUD 시그니처·권한가드·프로모션 관리·생성/수정 모달 100% 보존

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
// Toss Phase 2 2B — lucide 키트 Icon (Material Symbols 교체)
import { Icon } from "@/components/admin-toss";
import { PageHead, StatRow, StatusBadge } from "@/components/admin/console-kit";

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
const ACTIVE_META = {
  active: { label: "활성", tone: "ok" as const },
  inactive: { label: "비활성", tone: "grey" as const },
};
const FEATURE_KEY_OPTIONS = [
  { value: "team_create", label: "팀 생성권" },
  { value: "pickup_game", label: "픽업게임" },
  { value: "court_rental", label: "체육관 대관" },
  { value: "tournament_create", label: "대회 생성" },
];

const PROMO_TIERS = [
  { membershipType: 1, label: "픽업호스트", price: "₩49,000/월" },
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
    // 파싱 보정: apiSuccess() 가 { success, data } 로 래핑할 경우 data 추출 (배열 직반환도 호환)
    const plansJson = await plansRes.json();
    const plansData = plansJson?.data ?? plansJson;
    setPlans(Array.isArray(plansData) ? plansData : []);
    if (statsRes.ok) {
      const statsJson = await statsRes.json();
      const statsData = statsJson?.data ?? statsJson;
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
    <div data-skin="toss">
      <PageHead
        icon="package"
        eyebrow="ADMIN / 비즈니스"
        title="요금제 관리"
        sub="유료·무료 플랜의 가격·기능·가입자 추이를 관리합니다."
        actions={
          <>
            {/* 시안 v2.14 — 결제 내역 이동 보조 actions (운영 라우트 /admin/payments) */}
            <Link href="/admin/payments" className="btn">
              <Icon name="credit-card" size={16} />
              결제 내역
            </Link>
            <Button onClick={openCreate}>+ 요금제 추가</Button>
          </>
        }
      />

      <StatRow
        items={[
          { icon: "package-check", label: "전체 요금제", value: plans.length.toLocaleString() },
          { icon: "toggle-right", label: "활성", value: plans.filter((p) => p.is_active).length.toLocaleString(), trend: "up", delta: "active" },
          { icon: "gift", label: "프로모션 대상", value: promoStats.reduce((sum, s) => sum + s.count, 0).toLocaleString() },
          { icon: "credit-card", label: "유료 플랜", value: plans.filter((p) => p.price > 0).length.toLocaleString() },
        ]}
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
                  // 시안 v2.14 — admin-stat-pill mute 톤 (회색)
                  <span className="admin-stat-pill" data-tone="mute">프로모션 없음</span>
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
        // 시안 BB1 bl-pgrid 박제 — admin-table → 카드 grid. 기존 CARD_CLASS/CARD_STYLE 재사용 (신규 CSS 0)
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            // 기능 키 라벨 매핑 (기존 FEATURE_KEY_OPTIONS 재사용, 미매핑 시 원문 노출)
            const featureLabel = FEATURE_KEY_OPTIONS.find((o) => o.value === plan.feature_key)?.label ?? plan.feature_key;
            return (
              <div
                key={plan.id}
                className={`${CARD_CLASS} flex flex-col`}
                // 비활성 플랜은 흐리게 (시안 bl-pcard--off 톤 답습)
                style={{ ...CARD_STYLE, opacity: plan.is_active ? 1 : 0.6 }}
              >
                {/* 상단: 이름 + 활성 배지 */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{plan.name}</span>
                  <StatusBadge map={ACTIVE_META} value={plan.is_active ? "active" : "inactive"} />
                </div>

                {/* 타입 / 기능 키 태그 */}
                <div className="mb-3 flex flex-wrap gap-1.5">
                  <span
                    className="rounded-[6px] px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--color-surface)", color: "var(--color-text-secondary)" }}
                  >
                    {PLAN_TYPE_LABELS[plan.plan_type] ?? plan.plan_type}
                  </span>
                  <span
                    className="rounded-[6px] px-2 py-0.5 text-xs font-medium"
                    style={{ background: "var(--color-surface)", color: "var(--color-text-muted)" }}
                  >
                    {featureLabel}
                  </span>
                </div>

                {/* 가격 (0원 → "무료", 천 단위 통일) */}
                <div className="mb-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
                    {plan.price === 0 ? "무료" : `₩${plan.price.toLocaleString()}`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                      {plan.plan_type === "monthly" ? "/ 월" : "/ 회"}
                    </span>
                  )}
                </div>

                {/* 설명 (운영 단일 description 컬럼만 — features 다중 컬럼 미보유로 hide) */}
                {plan.description && (
                  <p className="mb-4 text-sm" style={{ color: "var(--color-text-muted)" }}>{plan.description}</p>
                )}

                {/* 액션: 수정 / 토글 / 삭제 — 기존 핸들러 그대로 (CRUD 0 변경 / 복제 버튼 미배치) */}
                <div className="mt-auto flex flex-wrap gap-2 pt-2">
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
              </div>
            );
          })}
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
