"use client";

// ============================================================
// partner/campaigns/_campaigns.tsx — 캠페인 목록 + 생성 폼 (클라). 정본 partner-pages SchemaList(PT_CAMPAIGNS) 1:1.
//   서버에서 ad_campaigns(partner 스코프) 실 매핑된 rows 를 받아 렌더.
//   - 행 클릭 → 캠페인 상세(/partner/campaigns/[id]) 라우트 이동.
//   - ★생성 = 헤더 "새 캠페인" → Modal 폼(레거시 partner-admin 폼 로직 포팅).
//     · SchemaList 는 add 훅이 없고 공유 컴포넌트(blocks.tsx)를 건드리지 않기 위해
//       PageHead+toolbar+DataTable 을 정본과 동일 마크업으로 직접 조합(파트너 영역 한정).
//     · mutation = adminFetch POST /api/web/partner/campaigns(camel→snake 자동변환) → router.refresh().
//   - ⚠ 과금(예산/소진/단가) 컬럼 제외 — 통계(노출/클릭률)만(광고 과금 로직 미구현).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import {
  PageHead,
  DataTable,
  renderSchemaCell,
  Btn,
  Icon,
  Modal,
  useAdminShell,
  type SchemaCol,
  type SchemaRow,
  type DataRow,
} from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// 정본 PT_CAMPAIGNS cols 1:1 (과금 컬럼 없음 — 정본도 노출/클릭률만)
const COLS: SchemaCol[] = [
  { key: "name", label: "캠페인", w: "minmax(0,2fr)", type: "title" },
  { key: "slot", label: "노출 영역", w: "minmax(0,1.2fr)", type: "muted" },
  { key: "period", label: "기간", w: "minmax(0,1.3fr)", type: "mono" },
  { key: "imp", label: "노출", w: "92px", align: "center", type: "mono" },
  { key: "ctr", label: "클릭률", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "92px", align: "center", type: "badge" },
];

export type PtCampaignRow = SchemaRow & {
  slot: string;
  period: string;
  imp: string;
  ctr: string;
};

// 생성 폼 초기값(camelCase) — adminFetch 가 snake 로 자동 변환.
const EMPTY_FORM = {
  title: "",
  headline: "",
  linkUrl: "",
  ctaText: "자세히 보기",
  imageUrl: "",
  startDate: "",
  endDate: "",
  description: "",
};
type CreateForm = typeof EMPTY_FORM;

export function CampaignsList({ rows }: { rows: PtCampaignRow[] }) {
  const router = useRouter();
  const { toast } = useAdminShell();

  // 검색(정본 SchemaList 동일)
  const [q, setQ] = React.useState("");
  // 생성 모달 상태
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState<CreateForm>(EMPTY_FORM);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filtered = rows.filter(
    (r) => !q || (r.name && r.name.includes(q)) || (r.sub && r.sub.includes(q))
  );

  // 행 클릭 → 상세 라우트 이동(정본 SchemaList rowHref 동작과 동일하게 router 사용)
  function goRow(r: DataRow) {
    router.push(`/partner/campaigns/${(r as SchemaRow).id}`);
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setOpen(true);
  }
  function close() {
    if (busy) return;
    setOpen(false);
    setError(null);
  }
  function setField<K extends keyof CreateForm>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // 생성 — adminFetch POST. 날짜 빈값은 null(DateTime 파싱 오류 회피).
  async function handleCreate() {
    if (busy) return;
    if (!form.title.trim() || !form.headline.trim() || !form.linkUrl.trim()) {
      setError("캠페인명 · 광고 제목 · 링크 URL 은 필수입니다.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminFetch("/api/web/partner/campaigns", {
        method: "POST",
        body: {
          title: form.title,
          headline: form.headline,
          linkUrl: form.linkUrl,
          ctaText: form.ctaText,
          imageUrl: form.imageUrl,
          description: form.description,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        },
      });
      setBusy(false);
      setOpen(false);
      router.refresh(); // 목록 서버 재조회(신규 pending_review 캠페인 반영)
    } catch (e) {
      setBusy(false);
      setError(
        e instanceof AdminApiError
          ? e.message
          : "캠페인 생성에 실패했습니다. 다시 시도해주세요."
      );
    }
  }

  return (
    <div>
      <PageHead
        eyebrow="협력업체 콘솔"
        title="캠페인"
        sub="운영 중인 프로모션·배너 캠페인의 성과를 확인합니다."
        actions={
          <>
            <Btn
              variant="secondary"
              icon="download"
              size="sm"
              onClick={() => toast("캠페인 내보내기")}
            >
              내보내기
            </Btn>
            <Btn icon="plus" onClick={openCreate}>
              새 캠페인
            </Btn>
          </>
        }
      />

      {/* 검색/필터 툴바 — 정본 SchemaList 마크업 1:1 */}
      <div className="ad-toolbar">
        <div className="ad-search">
          <Icon name="search" size={18} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="캠페인 검색"
          />
        </div>
        <Btn
          variant="secondary"
          icon="sliders-horizontal"
          size="sm"
          onClick={() => toast("필터")}
        >
          필터
        </Btn>
      </div>

      <DataTable
        cols={COLS}
        rows={filtered}
        onRow={goRow}
        render={(r, k) =>
          renderSchemaCell(
            r as SchemaRow,
            COLS.find((c) => c.key === k)!,
            undefined,
            toast
          )
        }
        empty="데이터가 없습니다"
      />

      {/* 생성 모달 — 레거시 partner-admin 생성 폼 필드 1:1 포팅 + 날짜/이미지 추가 */}
      <Modal
        open={open}
        onClose={close}
        title="새 캠페인 만들기"
        sub="생성 후 관리자 심사를 거쳐 승인되면 광고가 노출됩니다."
        foot={
          <>
            <Btn variant="secondary" onClick={close} disabled={busy}>
              취소
            </Btn>
            <Btn icon="plus" onClick={handleCreate} disabled={busy}>
              {busy ? "생성 중..." : "캠페인 생성"}
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
