"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";
// Toss 키트 — 아이콘(Icon) · 버튼(Btn) · KPI 카드(StatCard) · 상태 뱃지(Badge)
import { Icon, Btn, StatCard, Badge } from "@/components/admin-toss";

/**
 * 캠페인 상세/수정 페이지
 * - 캠페인 정보 표시 + 수정 가능 (draft/pending_review/rejected 상태만)
 * - 배치(placement) 목록 + 추가
 * - 통계 (노출/클릭/CTR)
 *
 * 2026-06-21 Phase 3 PR-A — Toss 재스킨(비주얼만).
 *   루트 data-skin="toss". StatCard KPI, 카드/배치=.ts-card, 폼=.ts-field.
 *   PATCH/placements POST·isEditable·startEdit·handleSave = 변경 0.
 */

interface CampaignDetail {
  id: string;
  uuid: string;
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
  ctr: string;
  placements: Array<{
    id: string;
    placement: string;
    priority: number;
    is_active: boolean;
  }>;
  partner_name: string;
  created_at: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// 상태 레이블 매핑
const statusLabels: Record<string, string> = {
  draft: "임시저장",
  pending_review: "심사 대기",
  approved: "승인됨",
  rejected: "반려됨",
  paused: "일시정지",
  ended: "종료",
};

// 배치 위치 레이블
const placementLabels: Record<string, string> = {
  feed: "피드",
  sidebar: "사이드바",
  court_top: "코트 상단",
  list: "리스트",
};

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const apiUrl = `/api/web/partner/campaigns/${campaignId}`;
  const { data: campaign } = useSWR<CampaignDetail>(apiUrl, fetcher);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [addingPlacement, setAddingPlacement] = useState(false);
  const [newPlacement, setNewPlacement] = useState("feed");

  // 수정 가능한 상태인지 확인
  const isEditable = campaign && ["draft", "pending_review", "rejected"].includes(campaign.status);

  // 수정 모드 시작
  function startEdit() {
    if (!campaign) return;
    setFormData({
      title: campaign.title,
      headline: campaign.headline,
      description: campaign.description ?? "",
      link_url: campaign.link_url,
      cta_text: campaign.cta_text ?? "자세히 보기",
    });
    setEditing(true);
  }

  // 수정 저장
  async function handleSave() {
    if (saving) return;
    setSaving(true);

    try {
      const res = await fetch(apiUrl, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        mutate(apiUrl);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  // 배치 추가
  async function handleAddPlacement() {
    setAddingPlacement(true);
    try {
      const res = await fetch(`/api/web/partner/campaigns/${campaignId}/placements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placement: newPlacement }),
      });
      if (res.ok) {
        mutate(apiUrl);
      }
    } finally {
      setAddingPlacement(false);
    }
  }

  if (!campaign) {
    return (
      <div data-skin="toss" className="space-y-4 animate-pulse">
        <div className="h-6 rounded w-1/3" style={{ backgroundColor: "var(--grey-100)" }} />
        <div className="h-40 rounded" style={{ backgroundColor: "var(--grey-100)" }} />
      </div>
    );
  }

  // 수정 모드 입력 필드 정의 (기존 그대로)
  const editFields = [
    { key: "title", label: "캠페인명 (내부용)" },
    { key: "headline", label: "광고 제목 (표시용)" },
    { key: "link_url", label: "링크 URL" },
    { key: "cta_text", label: "CTA 버튼 텍스트" },
  ];

  return (
    // data-skin="toss" — 페이지 루트 opt-in
    <div data-skin="toss" className="space-y-6">
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {/* arrow_back → lucide arrow-left */}
          <Btn variant="ghost" size="sm" onClick={() => router.push("/partner-admin/campaigns")}>
            <Icon name="arrow-left" size={18} />
          </Btn>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--ink)" }}>
              {campaign.title}
            </h2>
            {/* 상태 라벨 — Toss Badge(grey) */}
            <span style={{ display: "inline-flex", marginTop: 4 }}>
              <Badge tone="grey">{statusLabels[campaign.status] ?? campaign.status}</Badge>
            </span>
          </div>
        </div>

        {isEditable && !editing && (
          // edit → lucide pencil
          <Btn variant="secondary" size="sm" icon="pencil" onClick={startEdit}>
            수정
          </Btn>
        )}
      </div>

      {/* 통계 요약 — StatCard KPI grid (노출/클릭/CTR) */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon="eye" label="노출" value={campaign.impressions.toLocaleString()} />
        <StatCard icon="mouse-pointer-click" label="클릭" value={campaign.clicks.toLocaleString()} />
        <StatCard icon="trending-up" label="CTR" value={`${campaign.ctr}%`} />
      </div>

      {/* 캠페인 정보 (보기/수정) — .ts-card */}
      <div className="ts-card space-y-4">
        <h3 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
          캠페인 정보
        </h3>

        {editing ? (
          // 수정 모드 — .ts-field
          <div className="space-y-3">
            {editFields.map((field) => (
              <div key={field.key} className="ts-field" style={{ marginBottom: 0 }}>
                <label className="ts-field__label">{field.label}</label>
                <input
                  type="text"
                  className="ts-input"
                  value={formData[field.key] ?? ""}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                />
              </div>
            ))}
            <div className="ts-field" style={{ marginBottom: 0 }}>
              <label className="ts-field__label">광고 설명</label>
              <textarea
                className="ts-input"
                style={{ resize: "none" }}
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Btn variant="secondary" size="sm" onClick={() => setEditing(false)}>
                취소
              </Btn>
              <Btn variant="primary" size="sm" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </Btn>
            </div>
          </div>
        ) : (
          // 보기 모드
          <div className="space-y-2">
            {[
              { label: "광고 제목", value: campaign.headline },
              { label: "설명", value: campaign.description ?? "-" },
              { label: "링크", value: campaign.link_url },
              { label: "CTA", value: campaign.cta_text ?? "자세히 보기" },
              { label: "시작일", value: campaign.start_date ? new Date(campaign.start_date).toLocaleDateString("ko-KR") : "미설정" },
              { label: "종료일", value: campaign.end_date ? new Date(campaign.end_date).toLocaleDateString("ko-KR") : "미설정" },
            ].map((row) => (
              <div key={row.label} className="flex items-start gap-4">
                <span className="text-xs font-medium w-16 shrink-0" style={{ color: "var(--ink-mute)" }}>
                  {row.label}
                </span>
                <span className="text-sm" style={{ color: "var(--ink)" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 배치 목록 — .ts-card */}
      <div className="ts-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "var(--ink)" }}>
            광고 배치 위치
          </h3>
        </div>

        {campaign.placements.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--ink-mute)" }}>
            배치된 위치가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {campaign.placements.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ backgroundColor: "var(--grey-50)" }}
              >
                <div className="flex items-center gap-2">
                  {/* grid_view → lucide layout-grid */}
                  <Icon name="layout-grid" size={15} color="var(--ink-mute)" />
                  <span className="text-sm" style={{ color: "var(--ink)" }}>
                    {placementLabels[p.placement] ?? p.placement}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--ink-mute)" }}>
                  <span>우선순위 {p.priority}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.is_active ? "var(--ok)" : "var(--ink-dim)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 배치 추가 — .ts-select + Btn */}
        {isEditable && (
          <div className="flex items-center gap-2 mt-3">
            <select
              className="ts-select"
              style={{ width: "auto" }}
              value={newPlacement}
              onChange={(e) => setNewPlacement(e.target.value)}
            >
              {Object.entries(placementLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Btn variant="secondary" size="sm" icon="plus" onClick={handleAddPlacement} disabled={addingPlacement}>
              {addingPlacement ? "추가 중..." : "배치 추가"}
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
