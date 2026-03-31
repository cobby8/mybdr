"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR, { mutate } from "swr";

/**
 * 캠페인 상세/수정 페이지
 * - 캠페인 정보 표시 + 수정 가능 (draft/pending_review/rejected 상태만)
 * - 배치(placement) 목록 + 추가
 * - 통계 (노출/클릭/CTR)
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
      <div className="space-y-4 animate-pulse">
        <div className="h-6 rounded w-1/3" style={{ backgroundColor: "var(--color-surface)" }} />
        <div className="h-40 rounded" style={{ backgroundColor: "var(--color-surface)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 뒤로가기 + 제목 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/partner-admin/campaigns")}
            className="p-1 rounded transition-colors hover:opacity-70"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>
              {campaign.title}
            </h2>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-secondary)",
              }}
            >
              {statusLabels[campaign.status] ?? campaign.status}
            </span>
          </div>
        </div>

        {isEditable && !editing && (
          <button
            onClick={startEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-secondary)",
            }}
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            수정
          </button>
        )}
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "노출", value: campaign.impressions.toLocaleString(), icon: "visibility" },
          { label: "클릭", value: campaign.clicks.toLocaleString(), icon: "ads_click" },
          { label: "CTR", value: `${campaign.ctr}%`, icon: "trending_up" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-lg border p-3 text-center"
            style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
          >
            <span className="material-symbols-outlined text-lg mb-1 block" style={{ color: "var(--color-text-muted)" }}>
              {s.icon}
            </span>
            <p className="text-lg font-bold" style={{ color: "var(--color-text-primary)" }}>{s.value}</p>
            <p className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* 캠페인 정보 (보기/수정) */}
      <div
        className="rounded-lg border p-5 space-y-4"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          캠페인 정보
        </h3>

        {editing ? (
          // 수정 모드
          <div className="space-y-3">
            {[
              { key: "title", label: "캠페인명 (내부용)" },
              { key: "headline", label: "광고 제목 (표시용)" },
              { key: "link_url", label: "링크 URL" },
              { key: "cta_text", label: "CTA 버튼 텍스트" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                  {field.label}
                </label>
                <input
                  type="text"
                  value={formData[field.key] ?? ""}
                  onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  className="w-full rounded border px-3 py-2 text-sm outline-none"
                  style={{
                    backgroundColor: "var(--color-surface)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-primary)",
                  }}
                />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--color-text-secondary)" }}>
                광고 설명
              </label>
              <textarea
                value={formData.description ?? ""}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full rounded border px-3 py-2 text-sm outline-none resize-none"
                style={{
                  backgroundColor: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setEditing(false)}
                className="px-3 py-1.5 rounded text-sm"
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}
              >
                취소
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: "var(--color-primary)", color: "#fff" }}
              >
                {saving ? "저장 중..." : "저장"}
              </button>
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
                <span className="text-xs font-medium w-16 shrink-0" style={{ color: "var(--color-text-muted)" }}>
                  {row.label}
                </span>
                <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 배치 목록 */}
      <div
        className="rounded-lg border p-5"
        style={{ backgroundColor: "var(--color-card)", borderColor: "var(--color-border)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
            광고 배치 위치
          </h3>
        </div>

        {campaign.placements.length === 0 ? (
          <p className="text-xs text-center py-4" style={{ color: "var(--color-text-muted)" }}>
            배치된 위치가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {campaign.placements.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm" style={{ color: "var(--color-text-muted)" }}>
                    grid_view
                  </span>
                  <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                    {placementLabels[p.placement] ?? p.placement}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
                  <span>우선순위 {p.priority}</span>
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: p.is_active ? "var(--color-success, #22C55E)" : "var(--color-text-disabled)" }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 배치 추가 */}
        {isEditable && (
          <div className="flex items-center gap-2 mt-3">
            <select
              value={newPlacement}
              onChange={(e) => setNewPlacement(e.target.value)}
              className="rounded border px-2 py-1.5 text-sm outline-none"
              style={{
                backgroundColor: "var(--color-surface)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-primary)",
              }}
            >
              {Object.entries(placementLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <button
              onClick={handleAddPlacement}
              disabled={addingPlacement}
              className="px-3 py-1.5 rounded text-xs font-medium disabled:opacity-50"
              style={{ backgroundColor: "var(--color-surface)", color: "var(--color-text-secondary)" }}
            >
              {addingPlacement ? "추가 중..." : "+ 배치 추가"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
