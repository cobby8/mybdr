"use client";

// ============================================================
// _console.tsx — R2-A 유저 콘솔 (클라). 정본 bo-pages ConsolePage 1:1.
//   탭 3(사용자/팀/단체) + 행 클릭 드릴다운 → 상세 화면 전환(setDetail).
//   리스트 데이터는 서버에서 실 Prisma 매핑되어 props 로 전달(추가 fetch 0).
// ============================================================

import React from "react";
import { SchemaList, type Schema, type SchemaCol, type SchemaRow } from "@/components/admin-v2";
import type { AdminBoUser, AdminBoTeam, AdminBoOrg } from "@/lib/admin-v2/data";
import { UserDetail, TeamDetail, OrgDetail } from "./_detail";
import { OrgCreateModal } from "./_org-modals";

const AV = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

// ── 컬럼 정의(정본 bo-data 1:1, mock 컬럼 제외) ──
const USER_COLS: SchemaCol[] = [
  { key: "name", label: "회원", w: "minmax(0,1.8fr)", type: "avatar" },
  { key: "region", label: "지역", w: "minmax(0,1fr)", type: "muted" },
  { key: "teamsLabel", label: "소속팀", w: "84px", align: "center", type: "mono" },
  { key: "joined", label: "가입일", w: "minmax(0,1fr)", type: "mono" },
  { key: "status", label: "상태", w: "96px", align: "center", type: "badge" },
  { key: "act", label: "", w: "76px", align: "right", type: "actions" },
];
const TEAM_COLS: SchemaCol[] = [
  { key: "name", label: "팀", w: "minmax(0,1.8fr)", type: "avatar" },
  { key: "region", label: "활동 지역", w: "minmax(0,1fr)", type: "muted" },
  { key: "membersLabel", label: "선수", w: "84px", align: "center", type: "mono" },
  { key: "status", label: "상태", w: "96px", align: "center", type: "status" },
  { key: "act", label: "", w: "60px", align: "right", type: "actions" },
];
const ORG_COLS: SchemaCol[] = [
  { key: "name", label: "단체", w: "minmax(0,1.8fr)", type: "avatar" },
  { key: "type", label: "유형", w: "minmax(0,1fr)", type: "muted" },
  { key: "tourn", label: "시리즈", w: "84px", align: "center", type: "mono" },
  { key: "verified", label: "인증", w: "100px", align: "center", type: "badge" },
  { key: "act", label: "", w: "76px", align: "right", type: "actions" },
];

type Detail =
  | { view: "user"; row: AdminBoUser & { color: string } }
  | { view: "team"; row: AdminBoTeam }
  | { view: "org"; row: AdminBoOrg & { color: string } }
  | null;

export function UserConsole({
  users,
  teams,
  orgs,
  currentUserId,
  suspendAction,
  initialTab = "users",
}: {
  users: AdminBoUser[];
  teams: AdminBoTeam[];
  orgs: AdminBoOrg[];
  currentUserId: string | null;
  suspendAction: (formData: FormData) => Promise<void>;
  /** 서브라우트(/teams, /orgs) 진입 시 초기 탭 설정. 기본값 "users". */
  initialTab?: "users" | "teams" | "orgs";
}) {
  const [tab, setTab] = React.useState<"users" | "teams" | "orgs">(initialTab);
  const [detail, setDetail] = React.useState<Detail>(null);
  const [createOrgOpen, setCreateOrgOpen] = React.useState(false);

  // 색상 주입(정본 av) — 리스트 아바타 + 상세 hero 공용
  const usersC = React.useMemo(
    () => users.map((u, i) => ({ ...u, color: AV[i % AV.length] })),
    [users]
  );
  const orgsC = React.useMemo(
    () => orgs.map((o, i) => ({ ...o, color: AV[i % AV.length] })),
    [orgs]
  );

  // ── 탭별 스키마(rows = 표시필드 + _e 엔티티 참조) ──
  const schema: Schema = React.useMemo(() => {
    if (tab === "teams") {
      return {
        head: "팀 관리",
        sub: "등록된 모든 팀을 관리합니다. 행을 눌러 팀 상세·선수 명단으로 이동합니다.",
        cols: TEAM_COLS,
        rows: teams.map((t) => ({
          id: t.id, name: t.name, sub: t.sub, color: t.color, region: t.region,
          membersLabel: t.members, st: t.status, sttone: t.sttone, _e: t,
        })) as SchemaRow[],
      };
    }
    if (tab === "orgs") {
      return {
        head: "단체 관리",
        sub: "주최 단체·협회·동호회의 인증과 권한을 관리합니다. 행을 눌러 단체 상세·인증 처리로 이동합니다.",
        addLabel: "새 단체",
        addAction: () => setCreateOrgOpen(true),
        cols: ORG_COLS,
        rows: orgsC.map((o) => ({
          id: o.id, name: o.name, sub: o.slug, color: o.color, type: o.type,
          tourn: o.tourn, badge: o.badge, tone: o.tone, _e: o,
        })) as SchemaRow[],
      };
    }
    return {
      head: "사용자 관리",
      sub: "전체 회원 계정을 조회·관리합니다. 행을 눌러 회원 상세·계정 관리로 이동합니다.",
      cols: USER_COLS,
      rows: usersC.map((u) => ({
        id: u.id, name: u.name, sub: u.email, color: u.color, region: u.region,
        teamsLabel: `${u.teams.length}팀`, joined: u.joined, badge: u.badge, tone: u.tone, _e: u,
      })) as SchemaRow[],
    };
  }, [tab, teams, orgsC, usersC]);

  // 행 클릭 → 상세 드릴다운
  const onRow = (r: SchemaRow) => {
    const e = (r as { _e: unknown })._e;
    if (tab === "users") setDetail({ view: "user", row: e as AdminBoUser & { color: string } });
    else if (tab === "teams") setDetail({ view: "team", row: e as AdminBoTeam });
    else setDetail({ view: "org", row: e as AdminBoOrg & { color: string } });
  };

  const back = () => setDetail(null);

  if (detail?.view === "user")
    return (
      <UserDetail
        row={detail.row}
        onBack={back}
        currentUserId={currentUserId}
        suspendAction={suspendAction}
      />
    );
  if (detail?.view === "team") return <TeamDetail row={detail.row} onBack={back} />;
  if (detail?.view === "org") return <OrgDetail row={detail.row} onBack={back} />;

  const TABS = [
    { id: "users", label: "사용자" },
    { id: "teams", label: "팀" },
    { id: "orgs", label: "단체" },
  ] as const;

  return (
    <div>
      <div className="bo-constabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className="bo-constab"
            data-on={tab === t.id ? "true" : "false"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <SchemaList schema={schema} eyebrow="유저 콘솔" onRow={onRow} />
      <OrgCreateModal open={createOrgOpen} onClose={() => setCreateOrgOpen(false)} />
    </div>
  );
}
