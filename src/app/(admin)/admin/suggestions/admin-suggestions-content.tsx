"use client";

// 2026-06-22 v2.40 Phase A3-2b — 통합 콘솔 키트(console-kit) 풀 교체.
//   변경: AdminStatusTabs→Toolbar(탭) · admin-table→DataTable(행 요약 Drawer) ·
//         AdminDetailModal→Drawer(DL 요약 + foot 상태변경 form) · admin-stat-pill→StatusBadge.
//   유지(0변경): 데이터 패칭(page.tsx 서버 ?q=)·server action(updateSuggestionStatusAction)·
//     TRANSITIONS 상태전환 규칙·snake/직렬화 접근자.
//   설계 메모:
//     - 검색은 page.tsx AdminPageHeader 서버 ?q= 폼 담당 → Toolbar 는 탭만(검색칸 미노출).
//       useFilter 는 "클라 탭 필터" 전용.
//
// (이전 이력) 2026-05-04: (web) 디자인 시스템 통일 (Phase C-3).

import { useState } from "react";
// v2.40 A3-2b — 통합 콘솔 키트
import {
  Toolbar,
  DataTable,
  Drawer,
  DL,
  PrimaryCell,
  StatusBadge,
  useFilter,
  type Column,
  type StatusMeta,
  type FilterableRow,
} from "@/components/admin/console-kit";
import { Btn } from "@/components/admin-toss";

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

// v2.40 A3-2b — StatusBadge map (status → 톤/라벨).
//   기존 admin-stat-pill 매핑을 키트 Badge tone 으로 변환(승인 규약):
//   mute→grey · warn→warn · ok→ok.
const STATUS_META: Record<string, StatusMeta> = {
  pending: { tone: "grey", label: "대기" },
  open: { tone: "warn", label: "접수됨" },
  in_progress: { tone: "warn", label: "처리중" },
  resolved: { tone: "ok", label: "완료" },
};

// 상태 전환 규칙 (기존 보존 — 변경 0)
const TRANSITIONS: Record<string, string[]> = {
  pending: ["open", "in_progress", "resolved"],
  open: ["in_progress", "resolved"],
  in_progress: ["resolved"],
  resolved: [],
};

// useFilter 가 status 로 탭 매칭 — SerializedSuggestion(status:string) 에 FilterableRow 제약 교차.
type FilterRow = SerializedSuggestion & FilterableRow;

// useFilter 검색 필드 — 검색은 서버 ?q= 담당이라 빈 배열(탭 필터만). 컴포넌트 밖 상수.
const FILTER_FIELDS: (keyof FilterRow)[] = [];

interface Props {
  suggestions: SerializedSuggestion[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminSuggestionsContent({
  suggestions,
  updateStatusAction,
}: Props) {
  // 클라 탭 필터(검색 X — 서버 ?q= 담당). status 가 이미 string 이라 그대로 사용.
  const { tab, setTab, filtered } = useFilter<FilterRow>(
    suggestions as FilterRow[],
    FILTER_FIELDS,
  );

  const [selected, setSelected] = useState<SerializedSuggestion | null>(null);

  const tabs = [
    { id: "all", label: "전체", n: suggestions.length },
    { id: "pending", label: "대기", n: suggestions.filter((s) => s.status === "pending").length },
    { id: "open", label: "접수됨", n: suggestions.filter((s) => s.status === "open").length },
    { id: "in_progress", label: "처리중", n: suggestions.filter((s) => s.status === "in_progress").length },
    { id: "resolved", label: "완료", n: suggestions.filter((s) => s.status === "resolved").length },
  ];

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");

  // DataTable 컬럼 — 기존 4칸(제목/작성자/상태/날짜) 데이터/문구 유지.
  const columns: Column<FilterRow>[] = [
    {
      key: "title",
      label: "제목",
      render: (r) => (
        <PrimaryCell
          title={r.title}
          meta={r.content ?? undefined}
        />
      ),
    },
    {
      key: "author",
      label: "작성자",
      width: "120px",
      hideSm: true,
      render: (r) => (
        <span style={{ color: "var(--ink-mute)" }}>
          {r.authorName ?? r.authorEmail ?? "-"}
        </span>
      ),
    },
    {
      key: "status",
      label: "상태",
      align: "center",
      width: "92px",
      render: (r) => <StatusBadge map={STATUS_META} value={r.status} />,
    },
    {
      key: "createdAt",
      label: "날짜",
      width: "100px",
      hideSm: true,
      render: (r) => (
        <span style={{ color: "var(--ink-mute)" }}>{fmtDate(r.createdAt)}</span>
      ),
    },
  ];

  // 선택된 건의사항의 다음 전환 가능 상태들
  const nextStates = selected ? TRANSITIONS[selected.status] ?? [] : [];

  return (
    <>
      {/* 상태 탭 — 검색칸 미노출(서버 ?q= 가 헤더 폼에서 담당) */}
      <Toolbar tabs={tabs} active={tab} onTab={setTab} />

      {/* 키트 DataTable — keyField/onRowClick (suggestions 는 서버 페이지네이션 없음·take:50) */}
      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        onRowClick={(r) => setSelected(r)}
        emptyTitle="건의사항이 없습니다."
      />

      {/* 행 요약 Drawer — 정보 DL + 내용 전체 + foot 상태변경 form(기존 server action) */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
        foot={
          // 전환 가능한 상태가 있을 때만 상태변경 폼 노출(기존 게이트 보존)
          selected && nextStates.length > 0 ? (
            <form
              action={updateStatusAction}
              className="flex w-full items-center gap-2"
              onSubmit={() => setSelected(null)}
            >
              <input type="hidden" name="suggestion_id" value={selected.id} />
              <select
                name="status"
                defaultValue=""
                required
                className="flex-1 rounded-[4px] border px-3 py-2 text-sm outline-none"
                style={{
                  borderColor: "var(--border)",
                  background: "var(--card)",
                  color: "var(--ink)",
                }}
              >
                <option value="" disabled>
                  상태 변경
                </option>
                {nextStates.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABEL[st] ?? st}
                  </option>
                ))}
              </select>
              <Btn type="submit" size="sm" variant="primary">
                적용
              </Btn>
            </form>
          ) : undefined
        }
      >
        {selected && (
          <>
            <div style={{ marginBottom: 18 }}>
              <StatusBadge map={STATUS_META} value={selected.status} />
            </div>
            <DL
              rows={[
                ["작성자", selected.authorName ?? selected.authorEmail ?? "-"],
                ["상태", STATUS_LABEL[selected.status] ?? selected.status],
                ["작성일", fmtDate(selected.createdAt)],
              ]}
            />
            {/* 내용 전체 표시 — 기존 박스 패턴(키트 토큰으로 정합) */}
            <div style={{ marginTop: 18 }}>
              <div
                className="mb-1.5 text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--ink-mute)" }}
              >
                내용
              </div>
              <div
                className="rounded-[6px] border p-4 text-sm leading-relaxed"
                style={{ borderColor: "var(--border)", color: "var(--ink)" }}
              >
                {selected.content || (
                  <span style={{ color: "var(--ink-mute)" }}>내용 없음</span>
                )}
              </div>
            </div>
          </>
        )}
      </Drawer>
    </>
  );
}
