"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 → div + 토큰 (코트 등록 폼 / 표 / 제안·앰배서더 카드)
// - <Badge> → .badge--soft + 상태별 inline color
// - 자체 rounded bg-* 버튼 → .btn .btn--primary / .btn--sm

import { useState } from "react";
import { useRouter } from "next/navigation";
// Phase 2A (Toss 전환) — Material Symbols → lucide(<Icon>) 키트
import { Icon } from "@/components/admin-toss";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";
import { EDITABLE_FIELDS, type EditableFieldKey } from "@/lib/constants/court";

// (web) 시안 카드 패턴
const CARD_CLASS = "rounded-[var(--radius-card)] border";
const CARD_STYLE: React.CSSProperties = {
  borderColor: "var(--color-border)",
  backgroundColor: "var(--color-card)",
  boxShadow: "var(--shadow-card)",
};

// 서버에서 직렬화된 코트 타입
interface SerializedCourt {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  courtType: string;
  status: string;
  isFree: boolean | null;
  reviewsCount: number;
  createdAt: string;
}

// 위키 수정 제안 타입
interface SerializedSuggestion {
  id: string;
  courtId: string;
  courtName: string;
  userId: string;
  nickname: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  reason: string;
  status: string;
  createdAt: string;
}

// P1-a 코트 제보 타입
interface SerializedSubmission {
  id: string;
  userId: string;
  nickname: string;
  name: string;
  region: string;
  courtType: string;
  address: string;
  operatingHours: string | null;
  feeText: string | null;
  amenities: string[];
  description: string | null;
  status: string;
  createdAt: string;
}

// 앰배서더 신청 타입
interface SerializedAmbassador {
  id: string;
  userId: string;
  nickname: string;
  courtId: string;
  courtName: string;
  courtCity: string;
  courtDistrict: string | null;
  status: string;
  appointedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
}

const COURT_TYPE_LABEL: Record<string, string> = {
  indoor: "실내",
  outdoor: "실외",
};

// P1-a 제보 코트 유형 라벨(폼 select 값: indoor/outdoor/3x3)
const SUBMISSION_TYPE_LABEL: Record<string, string> = {
  indoor: "실내 풀코트",
  outdoor: "실외 풀코트",
  "3x3": "하프코트 (3x3)",
};

// P1-a 편의시설 키 → 라벨 (폼 AMENITIES 박제)
const AMENITY_LABEL: Record<string, string> = {
  shower: "샤워실",
  parking: "주차",
  indoor: "실내",
  light: "야간 조명",
  locker: "락커",
  rental: "용품 대여",
};

const STATUS_LABEL: Record<string, string> = {
  active: "운영중",
  inactive: "비활성",
};

// 2026-05-15 Admin-4-B 박제 — STATUS_STYLE inline 색 → admin-stat-pill data-tone 매핑.
// active=ok / inactive=err (시안 AdminCourts.jsx v2.9 status_tone 박제 패턴 — 운영중/폐쇄/등록대기)
const STATUS_TONE: Record<string, "mute" | "info" | "ok" | "warn" | "err" | "accent"> = {
  active: "ok",
  inactive: "err",
};

interface Props {
  courts: SerializedCourt[];
  pendingSuggestions: SerializedSuggestion[];
  pendingAmbassadors: SerializedAmbassador[];
  pendingSubmissions: SerializedSubmission[];
  createCourtAction: (formData: FormData) => Promise<void>;
  updateCourtAction: (formData: FormData) => Promise<void>;
  deleteCourtAction: (formData: FormData) => Promise<void>;
}

export function AdminCourtsContent({
  courts,
  pendingSuggestions,
  pendingAmbassadors,
  pendingSubmissions,
  createCourtAction,
  updateCourtAction,
  deleteCourtAction,
}: Props) {
  // 탭 상태: "courts" | "submissions" | "suggestions" | "ambassadors"
  const [activeTab, setActiveTab] = useState<
    "courts" | "submissions" | "suggestions" | "ambassadors"
  >("courts");
  const [selected, setSelected] = useState<SerializedCourt | null>(null);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      {/* ─── 탭 네비게이션 ─── */}
      <div className="flex gap-1 mb-4 rounded-lg p-1" style={{ backgroundColor: "var(--color-surface)" }}>
        <button
          onClick={() => setActiveTab("courts")}
          className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === "courts" ? "var(--color-card)" : "transparent",
            color: activeTab === "courts" ? "var(--color-text-primary)" : "var(--color-text-muted)",
            boxShadow: activeTab === "courts" ? "var(--shadow-card)" : "none",
          }}
        >
          {/* sports_basketball → 농구 lucide 부재 → volleyball 대체 */}
          <Icon name="volleyball" size={16} className="mr-1 align-middle" />
          코트 관리
        </button>
        {/* P1-a 제보 검토 탭 — 수정 제안/앰배서더와 동형 */}
        <button
          onClick={() => setActiveTab("submissions")}
          className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === "submissions" ? "var(--color-card)" : "transparent",
            color: activeTab === "submissions" ? "var(--color-text-primary)" : "var(--color-text-muted)",
            boxShadow: activeTab === "submissions" ? "var(--shadow-card)" : "none",
          }}
        >
          {/* add_location_alt → lucide map-pin-plus */}
          <Icon name="map-pin-plus" size={16} className="mr-1 align-middle" />
          제보 검토
          {pendingSubmissions.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)", minWidth: "18px", height: "18px" }}
            >
              {pendingSubmissions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === "suggestions" ? "var(--color-card)" : "transparent",
            color: activeTab === "suggestions" ? "var(--color-text-primary)" : "var(--color-text-muted)",
            boxShadow: activeTab === "suggestions" ? "var(--shadow-card)" : "none",
          }}
        >
          {/* edit_note → lucide file-pen */}
          <Icon name="file-pen" size={16} className="mr-1 align-middle" />
          수정 제안
          {pendingSuggestions.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)", minWidth: "18px", height: "18px" }}
            >
              {pendingSuggestions.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("ambassadors")}
          className="flex-1 rounded-md px-4 py-2 text-sm font-semibold transition-colors"
          style={{
            backgroundColor: activeTab === "ambassadors" ? "var(--color-card)" : "transparent",
            color: activeTab === "ambassadors" ? "var(--color-text-primary)" : "var(--color-text-muted)",
            boxShadow: activeTab === "ambassadors" ? "var(--shadow-card)" : "none",
          }}
        >
          {/* shield_person → lucide shield-user */}
          <Icon name="shield-user" size={16} className="mr-1 align-middle" />
          앰배서더
          {pendingAmbassadors.length > 0 && (
            <span
              className="ml-1 inline-flex items-center justify-center rounded-full px-1.5 text-xs font-bold text-white"
              style={{ backgroundColor: "var(--color-primary)", minWidth: "18px", height: "18px" }}
            >
              {pendingAmbassadors.length}
            </span>
          )}
        </button>
      </div>

      {/* ─── P1-a 제보 검토 탭 ─── */}
      {activeTab === "submissions" && (
        <SubmissionsReviewTab submissions={pendingSubmissions} />
      )}

      {/* ─── 수정 제안 탭 ─── */}
      {activeTab === "suggestions" && (
        <SuggestionsTab suggestions={pendingSuggestions} />
      )}

      {/* ─── 앰배서더 관리 탭 ─── */}
      {activeTab === "ambassadors" && (
        <AmbassadorsTab ambassadors={pendingAmbassadors} />
      )}

      {/* ─── 코트 관리 탭 (기존) ─── */}
      {activeTab === "courts" && <>
      {/* 코트 등록 폼 — 기존 유지 */}
      <div className={`${CARD_CLASS} mb-6 p-5`} style={CARD_STYLE}>
        <h2 className="mb-4 text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
          {/* add_circle → lucide circle-plus */}
          <Icon name="circle-plus" size={16} className="mr-1 align-middle" />
          새 코트 등록
        </h2>
        <form action={createCourtAction} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>코트명 *</label>
            <input
              name="name"
              required
              placeholder="예: 서울숲 농구장"
              className="rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>주소 *</label>
            <input
              name="address"
              required
              placeholder="예: 서울시 성동구 ..."
              className="rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>도시 *</label>
            <input
              name="city"
              required
              placeholder="예: 서울"
              className="w-24 rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>구/군</label>
            <input
              name="district"
              placeholder="예: 성동구"
              className="w-24 rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-primary)" }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: "var(--color-text-muted)" }}>유형 *</label>
            <select
              name="court_type"
              defaultValue="outdoor"
              className="rounded-[10px] border px-3 py-2 text-sm outline-none"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)" }}
            >
              <option value="outdoor">실외</option>
              <option value="indoor">실내</option>
            </select>
          </div>
          {/* (web) .btn .btn--primary 패턴 */}
          <button type="submit" className="btn btn--primary btn--sm">
            등록
          </button>
        </form>
      </div>

      {/* 축소된 테이블: 코트명 / 도시 / 유형 (3칸) */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">코트명</th>
              <th className="w-[120px] px-5 py-4 font-medium">도시</th>
              <th className="w-[80px] px-5 py-4 font-medium">유형</th>
            </tr>
          </thead>
          <tbody>
            {courts.map((c) => (
              <tr key={c.id} onClick={() => setSelected(c)} className="cursor-pointer">
                <td data-primary="true" className="px-5 py-3">
                  <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {c.name}
                  </p>
                  <p className="truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {c.address}
                  </p>
                </td>
                <td data-label="도시" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {c.city}{c.district ? ` ${c.district}` : ""}
                </td>
                <td data-label="유형" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {COURT_TYPE_LABEL[c.courtType] ?? c.courtType}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {courts.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          등록된 코트가 없습니다.
        </div>
      )}

      {/* 상세 모달 */}
      </>}

      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.name}
          actions={
            <div className="flex items-center gap-2">
              {/* 유형 토글 */}
              <form action={updateCourtAction} className="flex-1">
                <input type="hidden" name="court_id" value={selected.id} />
                <input type="hidden" name="name" value={selected.name} />
                <input type="hidden" name="address" value={selected.address} />
                <input type="hidden" name="city" value={selected.city} />
                <input type="hidden" name="district" value={selected.district ?? ""} />
                <input
                  type="hidden"
                  name="court_type"
                  value={selected.courtType === "indoor" ? "outdoor" : "indoor"}
                />
                <button type="submit" className="btn btn--sm w-full">
                  {/* swap_horiz → lucide arrow-left-right */}
                  <Icon name="arrow-left-right" size={16} className="mr-1 align-middle" />
                  {selected.courtType === "indoor" ? "실외로 변경" : "실내로 변경"}
                </button>
              </form>
              {/* 삭제 */}
              <form action={deleteCourtAction}>
                <input type="hidden" name="court_id" value={selected.id} />
                <button
                  type="submit"
                  className="btn btn--sm"
                  style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                >
                  {/* delete → lucide trash-2 */}
                  <Icon name="trash-2" size={16} className="mr-1 align-middle" />
                  삭제
                </button>
              </form>
            </div>
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="코트 정보"
              rows={[
                ["주소", selected.address],
                ["도시", `${selected.city}${selected.district ? ` ${selected.district}` : ""}`],
                ["유형", COURT_TYPE_LABEL[selected.courtType] ?? selected.courtType],
                ["상태", (
                  // Admin-4-B 박제 — admin-stat-pill[data-tone] (admin.css)
                  <span className="admin-stat-pill" data-tone={STATUS_TONE[selected.status] ?? "mute"}>
                    {STATUS_LABEL[selected.status] ?? selected.status}
                  </span>
                )],
                ["무료 여부", selected.isFree === null ? "미확인" : selected.isFree ? "무료" : "유료"],
                ["리뷰수", `${selected.reviewsCount}건`],
              ]}
            />
            <ModalInfoSection
              title="기타"
              rows={[["등록일", fmtDate(selected.createdAt)]]}
            />
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────
// SuggestionsTab — 대기 중인 위키 수정 제안 관리
// ─────────────────────────────────────────────────
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined) return "미등록";
  if (typeof value === "boolean") return value ? "있음" : "없음";
  const fieldDef = EDITABLE_FIELDS[key as EditableFieldKey];
  if (fieldDef && "options" in fieldDef && fieldDef.options) {
    const opt = fieldDef.options.find((o: { value: string; label: string }) => o.value === value);
    if (opt) return opt.label;
  }
  if (key === "fee") return `${Number(value).toLocaleString()}원`;
  if (key === "hoops_count") return `${value}개`;
  return String(value);
}

function SuggestionsTab({ suggestions }: { suggestions: SerializedSuggestion[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  // 승인/거절 API 호출
  const handleAction = async (suggestion: SerializedSuggestion, action: "approve" | "reject") => {
    setProcessing(suggestion.id);
    try {
      const res = await fetch(
        `/api/web/courts/${suggestion.courtId}/suggestions/${suggestion.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            review_note: action === "reject" ? rejectNote[suggestion.id] || undefined : undefined,
          }),
        }
      );
      if (res.ok) {
        // 페이지 새로고침으로 서버 데이터 반영
        router.refresh();
      }
    } finally {
      setProcessing(null);
    }
  };

  if (suggestions.length === 0) {
    return (
      <div className={`${CARD_CLASS} p-8 text-center`} style={CARD_STYLE}>
        {/* check_circle → lucide circle-check (빈상태 아이콘) */}
        <Icon
          name="circle-check"
          size={36}
          className="mb-2"
          color="var(--color-text-disabled)"
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          대기 중인 수정 제안이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <div key={s.id} className={`${CARD_CLASS} p-4`} style={CARD_STYLE}>
          {/* 헤더: 코트명 + 제안자 + 날짜 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                {s.courtName}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {s.nickname} &middot; {new Date(s.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
            {/* Admin-4-B 박제 — admin-stat-pill[data-tone] (admin.css) */}
            <span className="admin-stat-pill" data-tone="info">대기중</span>
          </div>

          {/* 변경 내용 diff */}
          <div className="space-y-1 mb-2">
            {Object.entries(s.changes).map(([key, diff]) => {
              const field = EDITABLE_FIELDS[key as EditableFieldKey];
              if (!field) return null;
              return (
                <div key={key} className="flex items-center gap-1.5 text-xs">
                  <span className="font-medium" style={{ color: "var(--color-text-muted)" }}>
                    {field.label}:
                  </span>
                  <span style={{ color: "var(--color-text-disabled)" }}>
                    {formatValue(key, diff.old)}
                  </span>
                  {/* arrow_forward → lucide arrow-right (diff old→new) */}
                  <Icon name="arrow-right" size={12} color="var(--color-text-disabled)" />

                  <span className="font-semibold" style={{ color: "var(--color-info)" }}>
                    {formatValue(key, diff.new)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 사유 */}
          <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
            사유: {s.reason}
          </p>

          {/* 거절 사유 입력 */}
          <input
            type="text"
            placeholder="거절 사유 (선택)"
            value={rejectNote[s.id] ?? ""}
            onChange={(e) => setRejectNote((prev) => ({ ...prev, [s.id]: e.target.value }))}
            className="w-full rounded-lg px-3 py-1.5 text-xs mb-2 focus:outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />

          {/* 승인/거절 버튼 — (web) .btn 패턴 (success / error 톤은 inline) */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(s, "approve")}
              disabled={processing === s.id}
              className="btn btn--sm disabled:opacity-50"
              style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
            >
              {processing === s.id ? "처리 중..." : "승인 (코트 정보 반영 + 10XP)"}
            </button>
            <button
              onClick={() => handleAction(s, "reject")}
              disabled={processing === s.id}
              className="btn btn--sm disabled:opacity-50"
              style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
            >
              거절
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// AmbassadorsTab — 앰배서더 신청 승인/거절/해임 관리
// ─────────────────────────────────────────────────
const AMBASSADOR_STATUS_LABEL: Record<string, string> = {
  pending: "대기중",
  active: "활동중",
  revoked: "해임/거절",
};

// 2026-05-15 Admin-4-B 박제 — AMBASSADOR_STATUS_COLOR inline 색 → admin-stat-pill data-tone 매핑.
// pending=warn / active=ok / revoked=err (시안 AdminCourts.jsx v2.9 status_tone 박제 패턴)
const AMBASSADOR_STATUS_TONE: Record<string, "mute" | "info" | "ok" | "warn" | "err" | "accent"> = {
  pending: "warn",
  active: "ok",
  revoked: "err",
};

// 앰배서더 상태 필터 타입
type AmbassadorFilter = "all" | "pending" | "active" | "revoked";

function AmbassadorsTab({ ambassadors }: { ambassadors: SerializedAmbassador[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  // 상태 필터 (기본: 전체)
  const [filter, setFilter] = useState<AmbassadorFilter>("all");

  // 필터링된 앰배서더 목록
  const filteredAmbassadors = filter === "all"
    ? ambassadors
    : ambassadors.filter((a) => a.status === filter);

  // 상태별 건수 (필터 탭에 뱃지로 표시)
  const counts = {
    all: ambassadors.length,
    pending: ambassadors.filter((a) => a.status === "pending").length,
    active: ambassadors.filter((a) => a.status === "active").length,
    revoked: ambassadors.filter((a) => a.status === "revoked").length,
  };

  // 승인/거절/해임 API 호출
  const handleAction = async (
    ambassador: SerializedAmbassador,
    action: "approve" | "reject" | "revoke"
  ) => {
    setProcessing(ambassador.id);
    try {
      const res = await fetch(`/api/web/admin/ambassadors/${ambassador.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "처리에 실패했습니다");
      }
    } finally {
      setProcessing(null);
    }
  };

  // 필터 탭 정의
  const filterTabs: { key: AmbassadorFilter; label: string }[] = [
    { key: "all", label: "전체" },
    { key: "pending", label: "대기중" },
    { key: "active", label: "활동중" },
    { key: "revoked", label: "해임/거절" },
  ];

  if (ambassadors.length === 0) {
    return (
      <div className={`${CARD_CLASS} p-8 text-center`} style={CARD_STYLE}>
        {/* shield_person → lucide shield-user (빈상태 아이콘) */}
        <Icon
          name="shield-user"
          size={36}
          className="mb-2"
          color="var(--color-text-disabled)"
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          앰배서더 신청이 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 상태별 필터 탭 — (web) .btn 패턴 (활성 .btn--primary) */}
      <div className="flex gap-2 mb-4">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`btn btn--sm flex items-center gap-1.5 ${filter === tab.key ? "btn--primary" : ""}`}
          >
            {tab.label}
            {/* 건수 뱃지 */}
            {counts[tab.key] > 0 && (
              <span
                className="rounded-full px-1.5 text-[10px] font-bold"
                style={{
                  backgroundColor: filter === tab.key ? "rgba(255,255,255,0.2)" : "var(--color-border)",
                  color: filter === tab.key ? "#FFFFFF" : "var(--color-text-muted)",
                }}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 필터된 결과가 없을 때 */}
      {filteredAmbassadors.length === 0 && (
        <div className={`${CARD_CLASS} p-6 text-center`} style={CARD_STYLE}>
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            해당 상태의 앰배서더가 없습니다
          </p>
        </div>
      )}

      {filteredAmbassadors.map((a) => (
        <div key={a.id} className={`${CARD_CLASS} p-4`} style={CARD_STYLE}>
          {/* 헤더: 코트명 + 상태 뱃지 */}
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                {a.courtName}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {a.courtCity}{a.courtDistrict ? ` ${a.courtDistrict}` : ""}
              </p>
            </div>
            {/* Admin-4-B 박제 — admin-stat-pill[data-tone] (admin.css) */}
            <span className="admin-stat-pill" data-tone={AMBASSADOR_STATUS_TONE[a.status] ?? "mute"}>
              {AMBASSADOR_STATUS_LABEL[a.status] ?? a.status}
            </span>
          </div>

          {/* 신청자 정보 */}
          <div className="flex items-center gap-2 mb-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              // accent 배경 대비가 다크/라이트 자동 유지되도록 on-accent 변수 사용
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)" }}
            >
              {(a.nickname ?? "?")[0]}
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                {a.nickname}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                신청일: {new Date(a.createdAt).toLocaleDateString("ko-KR")}
                {a.appointedAt && (
                  <> &middot; 임명일: {new Date(a.appointedAt).toLocaleDateString("ko-KR")}</>
                )}
              </p>
            </div>
          </div>

          {/* 상태별 액션 버튼 — (web) .btn 패턴 (success / error 톤은 inline) */}
          <div className="flex gap-2">
            {a.status === "pending" && (
              <>
                <button
                  onClick={() => handleAction(a, "approve")}
                  disabled={processing === a.id}
                  className="btn btn--sm disabled:opacity-50"
                  style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
                >
                  {processing === a.id ? "처리 중..." : "승인 (앰배서더 임명)"}
                </button>
                <button
                  onClick={() => handleAction(a, "reject")}
                  disabled={processing === a.id}
                  className="btn btn--sm disabled:opacity-50"
                  style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
                >
                  거절
                </button>
              </>
            )}
            {a.status === "active" && (
              <button
                onClick={() => handleAction(a, "revoke")}
                disabled={processing === a.id}
                className="btn btn--sm disabled:opacity-50"
                style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
              >
                {processing === a.id ? "처리 중..." : "해임"}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────
// SubmissionsReviewTab — P1-a 코트 신규 등록 제보 승인/반려
//   SuggestionsTab 동형(fetch PATCH + router.refresh). 승인 시 court_infos 생성됨
// ─────────────────────────────────────────────────
function SubmissionsReviewTab({ submissions }: { submissions: SerializedSubmission[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  // 제보별 반려 사유 입력값
  const [rejectNote, setRejectNote] = useState<Record<string, string>>({});

  // 승인/반려 API 호출 — PATCH /api/web/admin/court-submissions/[subId]
  const handleAction = async (sub: SerializedSubmission, action: "approve" | "reject") => {
    setProcessing(sub.id);
    try {
      const res = await fetch(`/api/web/admin/court-submissions/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          review_note: action === "reject" ? rejectNote[sub.id] || undefined : undefined,
        }),
      });
      if (res.ok) {
        // 서버 데이터 반영(승인 시 court_infos 생성 → 목록/카운트 갱신)
        router.refresh();
      } else {
        const err = await res.json().catch(() => null);
        alert(err?.error || "처리에 실패했습니다");
      }
    } finally {
      setProcessing(null);
    }
  };

  if (submissions.length === 0) {
    return (
      <div className={`${CARD_CLASS} p-8 text-center`} style={CARD_STYLE}>
        {/* check_circle → lucide circle-check (빈상태 아이콘) */}
        <Icon
          name="circle-check"
          size={36}
          className="mb-2"
          color="var(--color-text-disabled)"
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          대기 중인 코트 제보가 없습니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((s) => (
        <div key={s.id} className={`${CARD_CLASS} p-4`} style={CARD_STYLE}>
          {/* 헤더: 코트명 + 제보자/날짜 + 상태 */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold" style={{ color: "var(--color-text-primary)" }}>
                {s.name}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {s.nickname} &middot; {new Date(s.createdAt).toLocaleDateString("ko-KR")}
              </p>
            </div>
            <span className="admin-stat-pill" data-tone="info">대기중</span>
          </div>

          {/* 제보 상세 정보 */}
          <div className="space-y-1 mb-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <div>
              <span className="font-medium">지역:</span> {s.region}
              {" · "}
              <span className="font-medium">유형:</span>{" "}
              {SUBMISSION_TYPE_LABEL[s.courtType] ?? s.courtType}
            </div>
            <div>
              <span className="font-medium">주소:</span> {s.address}
            </div>
            {(s.operatingHours || s.feeText) && (
              <div>
                {s.operatingHours && (
                  <>
                    <span className="font-medium">운영:</span> {s.operatingHours}
                  </>
                )}
                {s.operatingHours && s.feeText && " · "}
                {s.feeText && (
                  <>
                    <span className="font-medium">이용료:</span> {s.feeText}
                  </>
                )}
              </div>
            )}
            {s.amenities.length > 0 && (
              <div>
                <span className="font-medium">편의시설:</span>{" "}
                {s.amenities.map((a) => AMENITY_LABEL[a] ?? a).join(", ")}
              </div>
            )}
            {s.description && (
              <div>
                <span className="font-medium">설명:</span> {s.description}
              </div>
            )}
          </div>

          {/* 반려 사유 입력(선택) */}
          <input
            type="text"
            placeholder="반려 사유 (선택)"
            value={rejectNote[s.id] ?? ""}
            onChange={(e) => setRejectNote((prev) => ({ ...prev, [s.id]: e.target.value }))}
            className="w-full rounded-lg px-3 py-1.5 text-xs mb-2 focus:outline-none"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border-subtle)",
            }}
          />

          {/* 승인/반려 버튼 — (web) .btn 패턴(success/error 톤 inline) */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAction(s, "approve")}
              disabled={processing === s.id}
              className="btn btn--sm disabled:opacity-50"
              style={{ background: "var(--color-success)", color: "#fff", borderColor: "var(--color-success)" }}
            >
              {processing === s.id ? "처리 중..." : "승인 (코트 등록 + 10XP)"}
            </button>
            <button
              onClick={() => handleAction(s, "reject")}
              disabled={processing === s.id}
              className="btn btn--sm disabled:opacity-50"
              style={{ borderColor: "var(--color-error)", color: "var(--color-error)" }}
            >
              반려
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
