"use client";

// 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3)
// - <Card> wrapper 제거 / <Badge> → .badge--soft + 상태별 inline color
// - thead/tr 자체 className 제거 (admin-table CSS 자동)
// - 자체 rounded bg-accent 버튼 → .btn .btn--primary

import { useState } from "react";
import { AdminStatusTabs } from "@/components/admin/admin-status-tabs";
import {
  AdminDetailModal,
  ModalInfoSection,
} from "@/components/admin/admin-detail-modal";

// 서버에서 직렬화된 건의사항 타입
interface SerializedSuggestion {
  id: string;
  title: string;
  content: string | null;
  status: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  open: "접수됨",
  in_progress: "처리중",
  resolved: "완료",
};

// 상태별 .badge--soft inline color (default / warning / success)
const STATUS_STYLE: Record<string, React.CSSProperties | undefined> = {
  pending: undefined, // default = .badge--soft 기본
  open: {
    background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    color: "var(--color-warning)",
    borderColor: "transparent",
  },
  in_progress: {
    background: "color-mix(in srgb, var(--color-warning) 12%, transparent)",
    color: "var(--color-warning)",
    borderColor: "transparent",
  },
  resolved: {
    background: "color-mix(in srgb, var(--color-success) 12%, transparent)",
    color: "var(--color-success)",
    borderColor: "transparent",
  },
};

// 상태 전환 규칙
const TRANSITIONS: Record<string, string[]> = {
  pending: ["open", "in_progress", "resolved"],
  open: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};

interface Props {
  suggestions: SerializedSuggestion[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminSuggestionsContent({
  suggestions,
  updateStatusAction,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<SerializedSuggestion | null>(null);

  const filtered =
    activeTab === "all"
      ? suggestions
      : suggestions.filter((s) => s.status === activeTab);

  const tabs = [
    { key: "all", label: "전체", count: suggestions.length },
    { key: "pending", label: "대기", count: suggestions.filter((s) => s.status === "pending").length },
    { key: "open", label: "접수됨", count: suggestions.filter((s) => s.status === "open").length },
    { key: "in_progress", label: "처리중", count: suggestions.filter((s) => s.status === "in_progress").length },
    { key: "resolved", label: "완료", count: suggestions.filter((s) => s.status === "resolved").length },
  ];

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ko-KR");

  return (
    <>
      <AdminStatusTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* 축소된 테이블: 제목 / 작성자 / 상태 / 날짜 (4칸) */}
      <div className="overflow-x-auto admin-table-wrap">
        {/* admin-table: 모바일 ≤720px 카드 변환 (globals.css [Admin Phase B]) */}
        <table className="admin-table w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-5 py-4 font-medium">제목</th>
              <th className="w-[100px] px-5 py-4 font-medium">작성자</th>
              <th className="w-[90px] px-5 py-4 font-medium">상태</th>
              <th className="w-[90px] px-5 py-4 font-medium">날짜</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} onClick={() => setSelected(s)} className="cursor-pointer">
                <td data-primary="true" className="px-5 py-3">
                  <p className="truncate font-medium" style={{ color: "var(--color-text-primary)" }}>
                    {s.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs" style={{ color: "var(--color-text-muted)" }}>
                    {s.content}
                  </p>
                </td>
                <td data-label="작성자" className="px-5 py-3 truncate" style={{ color: "var(--color-text-muted)" }}>
                  {s.authorName ?? s.authorEmail ?? "-"}
                </td>
                <td data-label="상태" className="px-5 py-3">
                  <span className="badge badge--soft" style={STATUS_STYLE[s.status]}>
                    {STATUS_LABEL[s.status] ?? s.status}
                  </span>
                </td>
                <td data-label="날짜" className="px-5 py-3" style={{ color: "var(--color-text-muted)" }}>
                  {fmtDate(s.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && (
        <div className="p-8 text-center" style={{ color: "var(--color-text-muted)" }}>
          건의사항이 없습니다.
        </div>
      )}

      {/* 상세 모달 — 내용 전체 + 상태변경 */}
      {selected && (
        <AdminDetailModal
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          title={selected.title}
          actions={
            (TRANSITIONS[selected.status] ?? []).length > 0 ? (
              <form action={updateStatusAction} className="flex items-center gap-2">
                <input type="hidden" name="suggestion_id" value={selected.id} />
                <select
                  name="status"
                  defaultValue=""
                  className="flex-1 rounded-[10px] border px-3 py-2 text-sm outline-none"
                  style={{ borderColor: "var(--color-border)", background: "var(--color-card)", color: "var(--color-text-secondary)" }}
                >
                  <option value="" disabled>상태 변경</option>
                  {(TRANSITIONS[selected.status] ?? []).map((st) => (
                    <option key={st} value={st}>
                      {STATUS_LABEL[st] ?? st}
                    </option>
                  ))}
                </select>
                {/* (web) .btn .btn--primary 패턴 */}
                <button type="submit" className="btn btn--primary btn--sm">
                  적용
                </button>
              </form>
            ) : undefined
          }
        >
          <div className="space-y-4">
            <ModalInfoSection
              title="정보"
              rows={[
                ["작성자", selected.authorName ?? selected.authorEmail ?? "-"],
                ["상태", STATUS_LABEL[selected.status] ?? selected.status],
                ["작성일", fmtDate(selected.createdAt)],
              ]}
            />
            {/* 내용 전체 표시 */}
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>
                내용
              </p>
              <div
                className="rounded-[12px] border p-4 text-sm leading-relaxed"
                style={{ borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
              >
                {selected.content || (
                  <span style={{ color: "var(--color-text-muted)" }}>내용 없음</span>
                )}
              </div>
            </div>
          </div>
        </AdminDetailModal>
      )}
    </>
  );
}
