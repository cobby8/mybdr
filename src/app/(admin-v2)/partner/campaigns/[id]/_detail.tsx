"use client";

// ============================================================
// partner/campaigns/[id]/_detail.tsx — 캠페인 상세 + 편집 폼 (클라). 정본 partner-pages CampaignDetail 1:1.
//   backlink + PageHead + KpiGrid + 노출 영역(placements) 패널. 실값은 서버 props.
//   - KPI 3 = 총 노출 / 클릭 / 클릭률. ★과금(예산/소진/단가/전환) 제외 — 통계만.
//   - 주차별 노출 막대(정본) 제외 — 시계열 데이터 부재(mock 0) → 실 placements 패널만.
//   - ★편집 = Modal 폼(레거시 partner-admin 폼 로직 포팅). PATCH /api/web/partner/campaigns/[id].
//     · 수정 가능 상태(draft/pending_review/rejected)만 폼 진입 — 그 외 토스트로 차단(정직).
//     · mutation = adminFetch(camel→snake 자동변환) → 성공 시 router.refresh().
//   - 일시중지 = pause 엔드포인트 부재 → 준비 중 토스트 유지(honest no-op).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  KpiGrid,
  AdListPanel,
  Btn,
  Icon,
  Modal,
  useAdminShell,
  type KpiItem,
  type ListItem,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// 편집 폼 초기값(camelCase) — 서버 page.tsx 에서 snake → camel 단일 매핑되어 전달.
export type CampaignEditData = {
  status: string;
  title: string;
  headline: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  ctaText: string;
  startDate: string; // yyyy-MM-dd 또는 ""
  endDate: string;
};

export type CampaignDetailData = {
  id: string;
  title: string;
  meta: string;
  kpis: KpiItem[];
  placements: ListItem[];
  edit: CampaignEditData;
};

// 수정 가능한 상태(레거시 isEditable 동일) — 그 외(approved/paused/ended)는 폼 진입 차단.
const EDITABLE_STATUSES = ["draft", "pending_review", "rejected"];

export function CampaignDetail({ data }: { data: CampaignDetailData }) {
  const router = useRouter();
  const { toast } = useAdminShell();

  // 편집 모달 상태 — 폼 값/저장중/에러를 분리(verify 패턴 동일).
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CampaignEditData>(data.edit);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const editable = EDITABLE_STATUSES.includes(data.edit.status);

  // 수정 버튼 클릭 — 가능 상태면 폼 초기화 후 모달 오픈, 아니면 차단 토스트.
  function startEdit() {
    if (!editable) {
      toast("승인·종료·일시중지된 캠페인은 수정할 수 없습니다");
      return;
    }
    setForm(data.edit); // 항상 서버 최신값으로 리셋
    setError(null);
    setOpen(true);
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
  }

  // 폼 단일 필드 변경 헬퍼(제어 컴포넌트)
  function setField<K extends keyof CampaignEditData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // 저장 — adminFetch PATCH. 날짜 빈값은 null 로 보내 DateTime 파싱 오류 회피.
  async function handleSave() {
    if (busy) return;
    // 필수값(레거시 동일) 가드 — 제목/광고제목/링크
    if (!form.title.trim() || !form.headline.trim() || !form.linkUrl.trim()) {
      setError("캠페인명 · 광고 제목 · 링크 URL 은 필수입니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // body 는 camelCase — adminFetch 가 snake(title/headline/link_url/...)로 자동 변환.
      await adminFetch(`/api/web/partner/campaigns/${data.id}`, {
        method: "PATCH",
        body: {
          title: form.title,
          headline: form.headline,
          description: form.description,
          imageUrl: form.imageUrl,
          linkUrl: form.linkUrl,
          ctaText: form.ctaText,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        },
      });
      setBusy(false);
      setOpen(false);
      router.refresh(); // 서버 재조회(반려 → 재심사 pending_review 반영 포함)
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "캠페인 수정에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  return (
    <div>
      <button
        className="ad-backlink"
        onClick={() => router.push("/partner/campaigns")}
      >
        <Icon name="arrow-left" size={16} />
        캠페인 목록
      </button>

      <PageHead
        eyebrow="협력업체 콘솔"
        title={data.title}
        sub={data.meta}
        actions={
          <>
            <Btn variant="secondary" icon="pencil" size="sm" onClick={startEdit}>
              수정
            </Btn>
            <Btn
              variant="secondary"
              icon="pause"
              size="sm"
              onClick={() => toast("캠페인 일시중지는 준비 중입니다")}
            >
              일시중지
            </Btn>
          </>
        }
      />

      <KpiGrid items={data.kpis} />

      <div className="ad-cols">
        <AdListPanel title="노출 영역" items={data.placements} />
      </div>

      {/* 편집 모달 — 레거시 partner-admin 폼 필드 1:1 포팅 + 날짜/이미지 추가 */}
      <Modal
        open={open}
        onClose={close}
        title="캠페인 수정"
        sub="수정 후 다시 심사를 거쳐 노출됩니다."
        foot={
          <>
            <Btn variant="secondary" onClick={close} disabled={busy}>
              취소
            </Btn>
            <Btn icon="check" onClick={handleSave} disabled={busy}>
              {busy ? "저장 중..." : "저장"}
            </Btn>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {error && (
            <div
              style={{
                fontSize: 13.5,
                color: "var(--danger)",
                background: "var(--danger-weak, rgba(240,68,82,0.08))",
                border: "1px solid var(--danger)",
                borderRadius: 6,
                padding: "10px 12px",
                lineHeight: 1.5,
                marginBottom: 12,
              }}
            >
              {error}
            </div>
          )}

          <div className="ts-field">
            <label className="ts-field__label">캠페인명 (내부용) *</label>
            <input
              className="ts-input"
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="예: 봄 시즌 프로모션"
            />
          </div>

          <div className="ts-field">
            <label className="ts-field__label">광고 제목 (표시용) *</label>
            <input
              className="ts-input"
              value={form.headline}
              onChange={(e) => setField("headline", e.target.value)}
              placeholder="예: 체육관 대관 50% 할인"
            />
          </div>

          <div className="ts-field">
            <label className="ts-field__label">링크 URL *</label>
            <input
              type="url"
              className="ts-input"
              value={form.linkUrl}
              onChange={(e) => setField("linkUrl", e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="ts-field">
            <label className="ts-field__label">CTA 버튼 텍스트</label>
            <input
              className="ts-input"
              value={form.ctaText}
              onChange={(e) => setField("ctaText", e.target.value)}
              placeholder="자세히 보기"
            />
          </div>

          <div className="ts-field">
            <label className="ts-field__label">이미지 URL</label>
            <input
              type="url"
              className="ts-input"
              value={form.imageUrl}
              onChange={(e) => setField("imageUrl", e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          {/* 시작·종료일 2열 — 빈값 허용(상시 노출) */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            <div className="ts-field">
              <label className="ts-field__label">시작일</label>
              <input
                type="date"
                className="ts-input"
                value={form.startDate}
                onChange={(e) => setField("startDate", e.target.value)}
              />
            </div>
            <div className="ts-field">
              <label className="ts-field__label">종료일</label>
              <input
                type="date"
                className="ts-input"
                value={form.endDate}
                onChange={(e) => setField("endDate", e.target.value)}
              />
            </div>
          </div>

          <div className="ts-field" style={{ marginBottom: 0 }}>
            <label className="ts-field__label">광고 설명</label>
            <textarea
              className="ts-input ts-textarea"
              style={{ resize: "none" }}
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="광고에 표시될 설명문"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
