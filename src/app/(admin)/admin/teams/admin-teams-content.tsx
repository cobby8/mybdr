"use client";

// 2026-06-22 v2.40 Phase A3-1a — 통합 콘솔 키트(console-kit) 통일.
//   변경: Toolbar(탭) + DataTable(행 요약 Drawer) 로 UI 교체.
//   유지(0변경): 데이터 패칭(page.tsx 서버 ?q=)·server action(updateTeamStatusAction)·
//     전적 조건부 hide·snake/직렬화 접근자.
//   설계 메모:
//     - 검색은 page.tsx AdminPageHeader 서버 ?q= 폼 담당 → Toolbar 는 탭만(검색칸 미노출).
//       useFilter 는 "클라 탭 필터" 전용.
//
// (이전 이력) 2026-05-04: (web) 디자인 시스템 통일 / 2026-05-29 PR-3C-6 TA1/TA2 박제.

import { useState } from "react";
// v2.40 A3-1a — 통합 콘솔 키트
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

// 서버에서 직렬화된 팀 타입
interface SerializedTeam {
  id: string;
  name: string;
  city: string | null;
  membersCount: number;
  wins: number;
  losses: number;
  draws: number;
  status: string;
  createdAt: string;
  captainName: string | null;
  captainEmail: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  active: "활동중",
  inactive: "비활성",
};

// v2.40 A3-1a — StatusBadge map (team status → 톤/라벨).
//   기존 admin-stat-pill 매핑을 키트 Badge tone 으로 변환(승인 규약): active(ok)·inactive(err→danger).
const STATUS_META: Record<string, StatusMeta> = {
  active: { tone: "ok", label: "활동중" },
  inactive: { tone: "danger", label: "비활성" },
};

// useFilter 가 status 로 탭 매칭 — SerializedTeam(status:string) 에 FilterableRow 제약 교차.
type FilterRow = SerializedTeam & FilterableRow;

// useFilter 검색 필드 — 검색은 서버 ?q= 담당이라 빈 배열(탭 필터만). 컴포넌트 밖 상수.
const FILTER_FIELDS: (keyof FilterRow)[] = [];

interface Props {
  teams: SerializedTeam[];
  updateStatusAction: (formData: FormData) => Promise<void>;
}

export function AdminTeamsContent({ teams, updateStatusAction }: Props) {
  // 클라 탭 필터(검색 X — 서버 ?q= 담당). status 가 이미 string 이라 그대로 사용.
  //   teams 배열을 FilterableRow 제약을 만족하는 FilterRow[] 로 단언.
  const { tab, setTab, filtered } = useFilter<FilterRow>(
    teams as FilterRow[],
    FILTER_FIELDS,
  );

  const [selected, setSelected] = useState<SerializedTeam | null>(null);

  const tabs = [
    { id: "all", label: "전체", n: teams.length },
    { id: "active", label: "활성", n: teams.filter((t) => t.status === "active").length },
    { id: "inactive", label: "비활성", n: teams.filter((t) => t.status === "inactive").length },
  ];

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("ko-KR");

  // DataTable 컬럼 — 시안 au-screens AuTeams 패턴(데이터/문구 유지).
  const columns: Column<FilterRow>[] = [
    {
      key: "name",
      label: "팀",
      render: (r) => (
        <PrimaryCell
          initials={(r.name || "?").slice(0, 2)}
          title={r.name}
          meta={`${r.membersCount}명`}
          accent
        />
      ),
    },
    {
      key: "city",
      label: "도시",
      width: "120px",
      hideSm: true,
      render: (r) => <span style={{ color: "var(--ink-mute)" }}>{r.city ?? "-"}</span>,
    },
    {
      key: "status",
      label: "상태",
      align: "center",
      width: "92px",
      render: (r) => <StatusBadge map={STATUS_META} value={r.status} />,
    },
  ];

  return (
    <>
      {/* 상태 탭 — 검색칸 미노출(서버 ?q= 가 헤더 폼에서 담당) */}
      <Toolbar tabs={tabs} active={tab} onTab={setTab} />

      {/* 키트 DataTable — keyField/onRowClick (teams 는 서버 페이지네이션 없음·take:50) */}
      <DataTable
        columns={columns}
        rows={filtered}
        keyField="id"
        onRowClick={(r) => setSelected(r)}
        emptyTitle="해당하는 팀이 없습니다."
      />

      {/* 행 요약 Drawer — 요약 DL + 상태 토글 액션(기존 server action) */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        sub={selected?.city ?? ""}
        foot={
          selected ? (
            <form
              action={updateStatusAction}
              className="flex w-full items-center gap-2"
              onSubmit={() => setSelected(null)}
            >
              <input type="hidden" name="team_id" value={selected.id} />
              <input
                type="hidden"
                name="status"
                value={selected.status === "active" ? "inactive" : "active"}
              />
              <Btn
                type="submit"
                size="sm"
                variant={selected.status !== "active" ? "primary" : "secondary"}
                block
              >
                {selected.status === "active" ? "비활성화" : "활성화"}
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
                ["팀장", selected.captainName ?? selected.captainEmail ?? "-"],
                ["도시", selected.city ?? "-"],
                ["멤버수", `${selected.membersCount}명`],
                // 전적 조건부 hide(기존 TA2 박제) — 전부 0 이면 노이즈라 미표시.
                ...(selected.wins + selected.losses + selected.draws > 0
                  ? ([
                      ["전적", `${selected.wins}W ${selected.losses}L ${selected.draws}D`],
                    ] as [string, string][])
                  : []),
                ["생성일", fmtDate(selected.createdAt)],
              ]}
            />
          </>
        )}
      </Drawer>
    </>
  );
}
