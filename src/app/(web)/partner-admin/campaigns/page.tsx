"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";

/**
 * 파트너 캠페인 목록 페이지
 * - 상태별 필터 탭
 * - 캠페인 카드 리스트
 * - 새 캠페인 생성 폼
 */

interface Campaign {
  id: string;
  uuid: string;
  title: string;
  headline: string;
  status: string;
  impressions: number;
  clicks: number;
  placements_count: number;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 캠페인 상태 뱃지 색상 매핑
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "임시저장", color: "var(--color-text-muted)", bg: "var(--color-surface)" },
  pending_review: { label: "심사 대기", color: "var(--color-warning, #FFAB00)", bg: "rgba(255,171,0,0.1)" },
  approved: { label: "승인됨", color: "var(--color-success, #22C55E)", bg: "rgba(34,197,94,0.1)" },
  rejected: { label: "반려됨", color: "var(--color-primary)", bg: "rgba(227,27,35,0.1)" },
  paused: { label: "일시정지", color: "var(--color-text-secondary)", bg: "var(--color-surface)" },
  ended: { label: "종료", color: "var(--color-text-disabled)", bg: "var(--color-surface)" },
};

export default function PartnerCampaignsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    headline: "",
    link_url: "",
    description: "",
    cta_text: "자세히 보기",
  });
  const [submitting, setSubmitting] = useState(false);

  // 캠페인 목록 조회
  const apiUrl = filter === "all" ? "/api/web/partner/campaigns" : `/api/web/partner/campaigns?status=${filter}`;
  const { data: campaigns } = useSWR<Campaign[]>(apiUrl, fetcher);

  // 필터 탭 목록
  const filterTabs = [
    { key: "all", label: "전체" },
    { key: "draft", label: "임시저장" },
    { key: "pending_review", label: "심사 대기" },
    { key: "approved", label: "승인됨" },
    { key: "rejected", label: "반려됨" },
  ];

  // 캠페인 생성 핸들러
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/web/partner/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        // 목록 갱신
        mutate(apiUrl);
        setShowForm(false);
        setFormData({ title: "", headline: "", link_url: "", description: "", cta_text: "자세히 보기" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          캠페인 관리
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium transition-colors active:scale-95"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
          }}
        >
          <span className="material-symbols-outlined text-lg">add</span>
          새 캠페인
        </button>
      </div>

      {/* 캠페인 생성 폼 (토글) */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-lg border p-5 space-y-4"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            새 캠페인 만들기
          </h3>
          <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            생성 후 관리자 심사를 거쳐 승인되면 광고가 노출됩니다.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 관리용 제목 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                캠페인명 (내부용) *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                placeholder="예: 2026 봄 시즌 프로모션"
              />
            </div>

            {/* 광고 제목 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                광고 제목 (표시용) *
              </label>
              <input
                type="text"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                placeholder="예: 체육관 대관 50% 할인!"
              />
            </div>

            {/* 링크 URL */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                링크 URL *
              </label>
              <input
                type="url"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                required
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                placeholder="https://example.com"
              />
            </div>

            {/* CTA 텍스트 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                CTA 버튼 텍스트
              </label>
              <input
                type="text"
                value={formData.cta_text}
                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                className="w-full rounded border px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                placeholder="자세히 보기"
              />
            </div>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
              광고 설명
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded border px-3 py-2 text-sm outline-none resize-none"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
              placeholder="광고에 표시될 설명문"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded text-sm font-medium"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
              }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded text-sm font-medium transition-colors active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: "var(--color-primary)",
                color: "#fff",
              }}
            >
              {submitting ? "생성 중..." : "캠페인 생성"}
            </button>
          </div>
        </form>
      )}

      {/* 필터 탭 */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: filter === tab.key ? "var(--color-primary)" : "var(--color-surface)",
              color: filter === tab.key ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 캠페인 목록 */}
      <div className="space-y-3">
        {!campaigns ? (
          // 로딩 스켈레톤
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg border p-4 animate-pulse"
              style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
            >
              <div className="h-4 rounded w-1/3 mb-2" style={{ backgroundColor: "var(--color-surface)" }} />
              <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--color-surface)" }} />
            </div>
          ))
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12">
            <span
              className="material-symbols-outlined text-4xl mb-2 block"
              style={{ color: "var(--color-text-disabled)" }}
            >
              campaign
            </span>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              등록된 캠페인이 없습니다.
            </p>
          </div>
        ) : (
          campaigns.map((c) => {
            const cfg = statusConfig[c.status] ?? statusConfig.draft;
            const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";

            return (
              <Link
                key={c.id}
                href={`/partner-admin/campaigns/${c.id}`}
                className="block rounded-lg border p-4 transition-all hover:shadow-md active:scale-[0.99]"
                style={{
                  backgroundColor: "var(--color-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                      {c.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                      {c.headline}
                    </p>
                  </div>
                  {/* 상태 뱃지 */}
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                    style={{ backgroundColor: cfg.bg, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>

                {/* 하단 통계 */}
                <div className="flex items-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">visibility</span>
                    {c.impressions.toLocaleString()} 노출
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">ads_click</span>
                    {c.clicks.toLocaleString()} 클릭
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    CTR {ctr}%
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                    {c.placements_count} 배치
                  </span>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
