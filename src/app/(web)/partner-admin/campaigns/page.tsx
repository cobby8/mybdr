"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
// Toss 키트 — 아이콘(Icon) · 버튼(Btn) · 상태 뱃지(Badge)
import { Icon, Btn, Badge, type BadgeTone } from "@/components/admin-toss";

/**
 * 파트너 캠페인 목록 페이지
 * - 상태별 필터 탭
 * - 캠페인 카드 리스트
 * - 새 캠페인 생성 폼
 *
 * 2026-06-21 Phase 3 PR-A — Toss 재스킨(비주얼만).
 *   루트 data-skin="toss". H+Btn, 필터=.ts-chip, 카드=.ts-card+Badge, 폼=.ts-field.
 *   POST/filterTabs/statusConfig 매핑 데이터 = 변경 0(색만 Badge tone 으로 표현).
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

// 캠페인 상태 → Toss Badge tone + 라벨 매핑.
// (기존 statusConfig 의 색 의미를 그대로 Badge tone 으로 치환 — 데이터/분기 불변)
const statusConfig: Record<string, { label: string; tone: BadgeTone }> = {
  draft: { label: "임시저장", tone: "grey" },
  pending_review: { label: "심사 대기", tone: "warn" },
  approved: { label: "승인됨", tone: "ok" },
  rejected: { label: "반려됨", tone: "danger" },
  paused: { label: "일시정지", tone: "grey" },
  ended: { label: "종료", tone: "grey" },
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

  // 헤더 합계 — 실데이터인 노출·클릭 합계만 reduce 로 산출 (mock 매출 필드 회피).
  const totals = (campaigns ?? []).reduce(
    (acc, c) => ({ impressions: acc.impressions + c.impressions, clicks: acc.clicks + c.clicks }),
    { impressions: 0, clicks: 0 },
  );

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
    // data-skin="toss" — 페이지 루트 opt-in
    <div data-skin="toss" className="space-y-6">
      {/* 헤더 — H(타이틀+합계) + Btn(새 캠페인) */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div style={{ margin: "2px 0 4px" }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--ink)" }}>캠페인 관리</h2>
          {/* 헤더 합계 — 실데이터 노출·클릭만 (매출은 mock 회피) */}
          <p style={{ fontSize: 13.5, color: "var(--ink-mute)", marginTop: 4 }}>
            노출 {totals.impressions.toLocaleString()} · 클릭 {totals.clicks.toLocaleString()}
          </p>
        </div>
        {/* add → lucide plus */}
        <Btn variant="primary" icon="plus" onClick={() => setShowForm(!showForm)}>
          새 캠페인
        </Btn>
      </div>

      {/* 캠페인 생성 폼 (토글) — .ts-card + .ts-field */}
      {showForm && (
        <form onSubmit={handleCreate} className="ts-card space-y-4">
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
              새 캠페인 만들기
            </h3>
            <p className="text-xs mt-1" style={{ color: "var(--ink-mute)" }}>
              생성 후 관리자 심사를 거쳐 승인되면 광고가 노출됩니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 관리용 제목 */}
            <div className="ts-field">
              <label className="ts-field__label">캠페인명 (내부용) *</label>
              <input
                type="text"
                className="ts-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="예: 2026 봄 시즌 프로모션"
              />
            </div>

            {/* 광고 제목 */}
            <div className="ts-field">
              <label className="ts-field__label">광고 제목 (표시용) *</label>
              <input
                type="text"
                className="ts-input"
                value={formData.headline}
                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                required
                placeholder="예: 체육관 대관 50% 할인!"
              />
            </div>

            {/* 링크 URL */}
            <div className="ts-field">
              <label className="ts-field__label">링크 URL *</label>
              <input
                type="url"
                className="ts-input"
                value={formData.link_url}
                onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                required
                placeholder="https://example.com"
              />
            </div>

            {/* CTA 텍스트 */}
            <div className="ts-field">
              <label className="ts-field__label">CTA 버튼 텍스트</label>
              <input
                type="text"
                className="ts-input"
                value={formData.cta_text}
                onChange={(e) => setFormData({ ...formData, cta_text: e.target.value })}
                placeholder="자세히 보기"
              />
            </div>
          </div>

          {/* 설명 */}
          <div className="ts-field" style={{ marginBottom: 0 }}>
            <label className="ts-field__label">광고 설명</label>
            <textarea
              className="ts-input"
              style={{ resize: "none" }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="광고에 표시될 설명문"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Btn variant="secondary" size="sm" type="button" onClick={() => setShowForm(false)}>
              취소
            </Btn>
            <Btn variant="primary" size="sm" type="submit" disabled={submitting}>
              {submitting ? "생성 중..." : "캠페인 생성"}
            </Btn>
          </div>
        </form>
      )}

      {/* 필터 탭 — Toss .ts-chip (data-active 로 활성 표시) */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="ts-chip whitespace-nowrap"
            data-active={filter === tab.key ? "true" : "false"}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 캠페인 목록 — .ts-card grid 2열. 로딩/빈상태는 grid 깨짐 방지 위해 별도 분기 */}
      {!campaigns ? (
        // 로딩 스켈레톤
        <div className="grid sm:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="ts-card animate-pulse">
              <div className="h-4 rounded w-1/3 mb-2" style={{ backgroundColor: "var(--grey-100)" }} />
              <div className="h-3 rounded w-1/2" style={{ backgroundColor: "var(--grey-100)" }} />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12">
          {/* campaign → lucide megaphone */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
            <Icon name="megaphone" size={36} color="var(--ink-dim)" />
          </div>
          <p className="text-sm" style={{ color: "var(--ink-mute)" }}>
            등록된 캠페인이 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {campaigns.map((c) => {
            const cfg = statusConfig[c.status] ?? statusConfig.draft;
            const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(1) : "0.0";

            return (
              <Link
                key={c.id}
                href={`/partner-admin/campaigns/${c.id}`}
                className="ts-card block transition-all hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--ink)" }}>
                      {c.title}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--ink-mute)" }}>
                      {c.headline}
                    </p>
                  </div>
                  {/* 상태 뱃지 — Toss Badge(tone) */}
                  <span className="shrink-0">
                    <Badge tone={cfg.tone}>{cfg.label}</Badge>
                  </span>
                </div>

                {/* 하단 통계 — lucide 아이콘 매핑 */}
                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--ink-mute)" }}>
                  <span className="flex items-center gap-1">
                    {/* visibility → eye */}
                    <Icon name="eye" size={14} />
                    {c.impressions.toLocaleString()} 노출
                  </span>
                  <span className="flex items-center gap-1">
                    {/* ads_click → mouse-pointer-click */}
                    <Icon name="mouse-pointer-click" size={14} />
                    {c.clicks.toLocaleString()} 클릭
                  </span>
                  <span className="flex items-center gap-1">
                    {/* trending_up → trending-up */}
                    <Icon name="trending-up" size={14} />
                    CTR {ctr}%
                  </span>
                  <span className="flex items-center gap-1">
                    {/* grid_view → layout-grid */}
                    <Icon name="layout-grid" size={14} />
                    {c.placements_count} 배치
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
