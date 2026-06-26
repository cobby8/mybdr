"use client";

/* ============================================================
 * Admin 캠페인 관리 페이지
 * 캠페인 목록 / 승인 / 반려 / 배치 상태 확인
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
import { Icon } from "@/components/admin-toss";
import {
  DataTable,
  PageHead,
  PrimaryCell,
  StatRow,
  StatusBadge,
  Toolbar,
  type Column,
} from "@/components/admin/console-kit";

// 캠페인 타입 정의
interface Campaign {
  id: string;
  uuid: string;
  partner_name: string;
  partner_logo: string | null;
  title: string;
  headline: string;
  description: string | null;
  image_url: string | null;
  link_url: string;
  cta_text: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  impressions: number;
  clicks: number;
  placements_count: number;
  created_at: string;
}

interface PartnerOption {
  id: string;
  name: string;
  status: string;
}

type CreateCampaignForm = {
  partner_id: string;
  title: string;
  headline: string;
  description: string;
  image_url: string;
  link_url: string;
  cta_text: string;
  start_date: string;
  end_date: string;
  status: string;
};

const STATUS_META = {
  draft: { tone: "primary" as const, label: "초안" },
  pending: { tone: "warn" as const, label: "심사중" },
  pending_review: { tone: "warn" as const, label: "심사중" },
  approved: { tone: "ok" as const, label: "승인" },
  rejected: { tone: "danger" as const, label: "반려" },
  paused: { tone: "grey" as const, label: "일시정지" },
  ended: { tone: "grey" as const, label: "종료" },
};

const EMPTY_CREATE_FORM: CreateCampaignForm = {
  partner_id: "",
  title: "",
  headline: "",
  description: "",
  image_url: "",
  link_url: "",
  cta_text: "자세히 보기",
  start_date: "",
  end_date: "",
  status: "pending",
};

const PLACEMENT_OPTIONS = [
  { id: "feed", label: "피드", icon: "newspaper" },
  { id: "sidebar", label: "사이드바", icon: "panel-right" },
  { id: "court_top", label: "코트 상단", icon: "map-pin" },
  { id: "list", label: "목록", icon: "list" },
];

// CTR 계산 (클릭률)
function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateCampaignForm>(EMPTY_CREATE_FORM);
  const [placements, setPlacements] = useState<string[]>(["feed"]);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 캠페인 목록 조회
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/campaigns${qs}`);
    if (res.ok) {
      const data = await res.json();
      const rows = data?.data ?? data;
      setCampaigns(Array.isArray(rows) ? rows : []);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const fetchPartners = useCallback(async () => {
    const res = await fetch("/api/admin/partners?status=approved");
    if (!res.ok) return;
    const data = await res.json();
    const rows = data?.data ?? data;
    setPartners(Array.isArray(rows) ? rows : []);
  }, []);

  useEffect(() => { fetchPartners(); }, [fetchPartners]);

  // 캠페인 상태 변경
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchCampaigns();
  };

  const updateCreateForm = (patch: Partial<CreateCampaignForm>) => {
    setCreateForm((prev) => ({ ...prev, ...patch }));
  };

  const togglePlacement = (id: string) => {
    setPlacements((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const openCreate = () => {
    setCreateForm({
      ...EMPTY_CREATE_FORM,
      partner_id: partners[0]?.id ?? "",
    });
    setPlacements(["feed"]);
    setCreateError(null);
    setShowCreate(true);
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    const res = await fetch("/api/admin/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...createForm, placements }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCreateError(data?.error ?? "캠페인 생성에 실패했습니다.");
      setCreating(false);
      return;
    }
    setCreating(false);
    setShowCreate(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setPlacements(["feed"]);
    fetchCampaigns();
  };

  const tabs = [
    { id: "", label: "전체" },
    { id: "pending", label: "심사중" },
    { id: "pending_review", label: "파트너 심사" },
    { id: "approved", label: "승인" },
    { id: "rejected", label: "반려" },
    { id: "paused", label: "일시정지" },
  ];

  const columns: Column<Campaign>[] = [
    {
      key: "headline",
      label: "캠페인",
      width: "minmax(260px,1.7fr)",
      render: (c) => (
        <PrimaryCell
          initials={c.partner_name.slice(0, 1)}
          title={c.headline}
          meta={`${c.partner_name} · ${c.title}`}
          accent
        />
      ),
    },
    {
      key: "status",
      label: "상태",
      width: "110px",
      align: "center",
      render: (c) => <StatusBadge map={STATUS_META} value={c.status} />,
    },
    {
      key: "impressions",
      label: "노출",
      width: "120px",
      align: "right",
      hideSm: true,
      render: (c) => c.impressions.toLocaleString(),
    },
    {
      key: "clicks",
      label: "클릭/CTR",
      width: "130px",
      align: "right",
      render: (c) => `${c.clicks.toLocaleString()} · ${ctr(c.impressions, c.clicks)}`,
    },
    {
      key: "placements_count",
      label: "배치",
      width: "90px",
      align: "center",
      hideSm: true,
      render: (c) => `${c.placements_count}곳`,
    },
    {
      key: "id",
      label: "액션",
      width: "160px",
      align: "right",
      render: (c) => (
        <span className="inline-flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {c.status === "pending" && (
            <>
              <button onClick={() => handleStatusChange(c.id, "approved")} className="ts-btn ts-btn--secondary ts-btn--sm">
                승인
              </button>
              <button
                onClick={() => handleStatusChange(c.id, "rejected")}
                className="ts-btn ts-btn--secondary ts-btn--sm"
                style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
              >
                반려
              </button>
            </>
          )}
          {c.status === "approved" && (
            <button onClick={() => handleStatusChange(c.id, "paused")} className="ts-btn ts-btn--secondary ts-btn--sm">
              일시정지
            </button>
          )}
          {c.status === "paused" && (
            <button onClick={() => handleStatusChange(c.id, "approved")} className="ts-btn ts-btn--secondary ts-btn--sm">
              재개
            </button>
          )}
        </span>
      ),
    },
  ];

  return (
    <div data-skin="toss">
      <PageHead
        icon="megaphone"
        eyebrow="ADMIN / 비즈니스"
        title="광고 캠페인"
        sub="채널별 캠페인 집행과 전환·ROI 성과를 추적합니다."
        actions={
          <button type="button" onClick={openCreate} className="ts-btn ts-btn--primary">
            <Icon name="plus" size={16} />
            캠페인 생성
          </button>
        }
      />

      <StatRow
        items={[
          { icon: "megaphone", label: "현재 목록", value: campaigns.length.toLocaleString() },
          { icon: "clock", label: "심사중", value: campaigns.filter((c) => c.status === "pending").length.toLocaleString() },
          { icon: "mouse-pointer-click", label: "클릭", value: campaigns.reduce((sum, c) => sum + c.clicks, 0).toLocaleString() },
          { icon: "layout-grid", label: "배치", value: campaigns.reduce((sum, c) => sum + c.placements_count, 0).toLocaleString() },
        ]}
      />

      <Toolbar tabs={tabs} active={filter} onTab={setFilter} />

      {/* 캠페인 목록 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-lg animate-pulse"
              style={{ backgroundColor: "var(--color-surface)" }} />
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-sm" style={{ color: "var(--color-text-muted)" }}>
          캠페인이 없습니다
        </div>
      ) : (
        <DataTable columns={columns} rows={campaigns} keyField="id" emptyTitle="캠페인이 없습니다" />
      )}

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4"
          style={{ background: "color-mix(in srgb, #000 55%, transparent)" }}
          onClick={() => !creating && setShowCreate(false)}
          role="presentation"
        >
          <form
            onSubmit={handleCreateCampaign}
            className="my-6 grid w-full max-w-5xl gap-5 rounded-[var(--radius-card)] border p-5 lg:grid-cols-[1fr_340px]"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-card)",
              boxShadow: "var(--shadow-card)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: ".08em" }}>
                    ADMIN / 캠페인 작성
                  </p>
                  <h2 className="mt-1 text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
                    새 광고 캠페인
                  </h2>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="ts-btn ts-btn--secondary ts-btn--sm" disabled={creating}>
                  <Icon name="x" size={16} />
                  닫기
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>파트너 *</span>
                  <select
                    value={createForm.partner_id}
                    onChange={(e) => updateCreateForm({ partner_id: e.target.value })}
                    required
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  >
                    <option value="">승인 파트너 선택</option>
                    {partners.map((partner) => (
                      <option key={partner.id} value={partner.id}>{partner.name}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>생성 상태</span>
                  <select
                    value={createForm.status}
                    onChange={(e) => updateCreateForm({ status: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  >
                    <option value="pending">심사중</option>
                    <option value="draft">초안</option>
                    <option value="approved">즉시 승인</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>내부 제목 *</span>
                  <input
                    value={createForm.title}
                    onChange={(e) => updateCreateForm({ title: e.target.value })}
                    required
                    placeholder="여름 리그 배너"
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>사용자 노출 제목 *</span>
                  <input
                    value={createForm.headline}
                    onChange={(e) => updateCreateForm({ headline: e.target.value })}
                    required
                    placeholder="이번 주 농구 장비 특가"
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>설명</span>
                <textarea
                  value={createForm.description}
                  onChange={(e) => updateCreateForm({ description: e.target.value })}
                  rows={3}
                  placeholder="광고 설명문"
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>링크 URL *</span>
                  <input
                    value={createForm.link_url}
                    onChange={(e) => updateCreateForm({ link_url: e.target.value })}
                    required
                    placeholder="https://..."
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>CTA</span>
                  <input
                    value={createForm.cta_text}
                    onChange={(e) => updateCreateForm({ cta_text: e.target.value })}
                    placeholder="자세히 보기"
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
              </div>

              <label className="space-y-1 block">
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>이미지 URL</span>
                <input
                  value={createForm.image_url}
                  onChange={(e) => updateCreateForm({ image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full rounded border px-3 py-2 text-sm"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                />
              </label>

              <div>
                <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>배치 채널</span>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PLACEMENT_OPTIONS.map((option) => {
                    const on = placements.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => togglePlacement(option.id)}
                        className="rounded border px-3 py-2 text-left text-sm"
                        style={{
                          borderColor: on ? "var(--color-accent)" : "var(--color-border)",
                          background: on ? "color-mix(in srgb, var(--color-accent) 10%, var(--color-card))" : "var(--color-card)",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Icon name={option.icon} size={16} />
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>시작일</span>
                  <input
                    type="date"
                    value={createForm.start_date}
                    onChange={(e) => updateCreateForm({ start_date: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-semibold" style={{ color: "var(--color-text-muted)" }}>종료일</span>
                  <input
                    type="date"
                    value={createForm.end_date}
                    onChange={(e) => updateCreateForm({ end_date: e.target.value })}
                    className="w-full rounded border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
                  />
                </label>
              </div>

              {createError && (
                <div className="rounded border px-3 py-2 text-sm" style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}>
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowCreate(false)} className="ts-btn ts-btn--secondary" disabled={creating}>
                  취소
                </button>
                <button
                  type="submit"
                  className="ts-btn ts-btn--primary"
                  disabled={creating || !createForm.partner_id || !createForm.title.trim() || !createForm.headline.trim() || !createForm.link_url.trim()}
                >
                  {creating ? "생성 중..." : "캠페인 생성"}
                </button>
              </div>
            </div>

            <aside className="space-y-3">
              <div className="text-xs font-bold uppercase" style={{ color: "var(--color-text-muted)", letterSpacing: ".08em" }}>
                실시간 미리보기
              </div>
              <div className="rounded-[12px] border p-4" style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}>
                {createForm.image_url ? (
                  <img
                    src={createForm.image_url}
                    alt=""
                    className="mb-3 h-36 w-full rounded-[8px] object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-36 items-center justify-center rounded-[8px]" style={{ background: "var(--color-elevated)", color: "var(--color-text-muted)" }}>
                    <Icon name="image" size={28} />
                  </div>
                )}
                <div className="text-xs" style={{ color: "var(--color-accent)", fontWeight: 800 }}>
                  SPONSORED
                </div>
                <h3 className="mt-1 text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                  {createForm.headline.trim() || "사용자 노출 제목"}
                </h3>
                <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                  {createForm.description.trim() || "설명을 입력하면 여기에 표시됩니다."}
                </p>
                <div className="mt-3 inline-flex items-center gap-1 rounded border px-3 py-1.5 text-sm font-semibold" style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}>
                  {createForm.cta_text.trim() || "자세히 보기"}
                  <Icon name="arrow-right" size={14} />
                </div>
              </div>
              <div className="rounded border p-3 text-xs" style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)", lineHeight: 1.6 }}>
                생성 시 선택한 배치 채널은 `ad_placements`에 함께 저장됩니다. 이후 승인/일시정지는 기존 캠페인 목록 액션을 그대로 사용합니다.
              </div>
            </aside>
          </form>
        </div>
      )}
    </div>
  );
}
