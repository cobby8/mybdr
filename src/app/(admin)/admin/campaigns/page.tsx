"use client";

/* ============================================================
 * Admin 캠페인 관리 페이지
 * 캠페인 목록 / 승인 / 반려 / 배치 상태 확인
 * ============================================================ */

import { useState, useEffect, useCallback } from "react";
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

const STATUS_META = {
  draft: { tone: "primary" as const, label: "초안" },
  pending: { tone: "warn" as const, label: "심사중" },
  approved: { tone: "ok" as const, label: "승인" },
  rejected: { tone: "danger" as const, label: "반려" },
  paused: { tone: "grey" as const, label: "일시정지" },
  ended: { tone: "grey" as const, label: "종료" },
};

// CTR 계산 (클릭률)
function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  // 캠페인 목록 조회
  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    const qs = filter ? `?status=${filter}` : "";
    const res = await fetch(`/api/admin/campaigns${qs}`);
    if (res.ok) {
      const data = await res.json();
      setCampaigns(data);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  // 캠페인 상태 변경
  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/campaigns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) fetchCampaigns();
  };

  const tabs = [
    { id: "", label: "전체" },
    { id: "pending", label: "심사중" },
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
              <button onClick={() => handleStatusChange(c.id, "approved")} className="btn btn--sm">
                승인
              </button>
              <button
                onClick={() => handleStatusChange(c.id, "rejected")}
                className="btn btn--sm"
                style={{ borderColor: "var(--danger)", color: "var(--danger)" }}
              >
                반려
              </button>
            </>
          )}
          {c.status === "approved" && (
            <button onClick={() => handleStatusChange(c.id, "paused")} className="btn btn--sm">
              일시정지
            </button>
          )}
          {c.status === "paused" && (
            <button onClick={() => handleStatusChange(c.id, "approved")} className="btn btn--sm">
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
    </div>
  );
}
