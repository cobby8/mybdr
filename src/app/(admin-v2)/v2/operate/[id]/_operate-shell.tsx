"use client";

// ============================================================
// operate/[id]/_operate-shell.tsx — 대회 운영 워크스페이스 셸 (R4-A)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/operate.jsx (OperateWorkspace)
//   - 자체 AdminShell(brandSub="대회 운영" · 6메뉴 nav). ta 콘솔 TaShell 과 별개
//     셸 → /v2/ta/layout 밖(/v2/operate)에 마운트하여 셸 중첩 회피.
//   - 6메뉴 = 참가팀 / 대진표 / 일정 / 운영관리 / 사이트 / 정산(정본 MENUS).
//   - R4-A = 참가팀 패널만 구현. 나머지 5메뉴 = "준비 중"(다음 증분 R4-B~).
//   - 상단 요약 헤더(ts-ph) = 실 대회 데이터(이름/기간/장소/상태/팀수/종별/경기수).
//   className(ts-ph/ct-*)·마크업은 정본 verbatim.
// ============================================================

import React from "react";
import {
  AdminShell,
  Icon,
  Btn,
  Empty,
  useAdminShell,
  type AdminUser,
  type NavItem,
} from "@/components/admin-v2";
import { LogoutButton } from "./_logout-button";
import {
  TeamsPanel,
  type OperateTeam,
  type OperateRule,
} from "./_teams-panel";
import { BracketPanel, type BracketData } from "./_bracket-panel";
import { SchedulePanel, type ScheduleData } from "./_schedule-panel";
import { OpsPanel, type OpsData } from "./_ops-panel";
import { SettlePanel, type SettleData } from "./_settle-panel";
import { SitePanel, type SiteData } from "./_site-panel";

// 정본 MENUS (operate.jsx) — 6 운영 메뉴
const MENUS: { id: string; label: string; icon: string; desc: string }[] = [
  { id: "teams", label: "참가팀", icon: "users", desc: "각 종별 참가신청·참가비 납부 현황" },
  { id: "bracket", label: "대진표", icon: "git-merge", desc: "각 종별 대진표 생성" },
  { id: "schedule", label: "일정", icon: "calendar-clock", desc: "대진표 기반 일정 관리" },
  { id: "ops", label: "운영관리", icon: "shield-check", desc: "운영진·심판·기록원·공지·경기 운영" },
  { id: "site", label: "사이트", icon: "globe", desc: "공개 사이트 개설·관리" },
  { id: "settle", label: "정산", icon: "wallet", desc: "참가비 입금·지출 현황" },
];

export type OperateSummary = {
  name: string;
  period: string; // "2026.06.15 ~ 06.22" | "미정"
  venue: string;
  statusLabel: string;
  statusTone: string; // ct-pill data-tone
  teamCount: number;
  divisionCount: number;
  matchCount: number;
};

// "대회 정보 수정" 버튼 = R5 스텁(준비 중 토스트). 셸 컨텍스트 토스트 사용 위해 분리.
function EditTournamentButton() {
  const { toast } = useAdminShell();
  return (
    <Btn
      variant="secondary"
      size="sm"
      iconRight="pencil"
      onClick={() => toast("대회 정보 수정은 준비 중입니다")}
    >
      대회 정보 수정
    </Btn>
  );
}

export function OperateShell({
  tournamentId,
  user,
  summary,
  teams,
  rules,
  bracketData,
  scheduleData,
  opsData,
  settleData,
  siteData,
}: {
  tournamentId: string;
  user: AdminUser;
  summary: OperateSummary;
  teams: OperateTeam[];
  rules: OperateRule[];
  bracketData: BracketData;
  scheduleData: ScheduleData;
  opsData: OpsData;
  settleData: SettleData;
  siteData: SiteData;
}) {
  const [menu, setMenu] = React.useState("teams");
  const cur = MENUS.find((m) => m.id === menu) ?? MENUS[0];

  // 정본 NAV — "운영 메뉴" 그룹 + 6메뉴. 참가팀에 팀수 badge.
  const nav: NavItem[] = [
    { label: "운영 메뉴" },
    ...MENUS.map((m) =>
      m.id === "teams"
        ? { id: m.id, icon: m.icon, text: m.label, badge: summary.teamCount }
        : { id: m.id, icon: m.icon, text: m.label }
    ),
  ];

  return (
    <AdminShell
      brand="MyBDR"
      brandSub="대회 운영"
      nav={nav}
      active={menu}
      onNav={(id) => {
        setMenu(id);
        window.scrollTo({ top: 0 });
      }}
      user={user}
      home="/v2/ta"
      footAction={<LogoutButton />}
    >
      {/* 요약 헤더 (정본 ts-ph) */}
      <div className="ts-ph" style={{ marginBottom: 16 }}>
        <div className="ts-ph__row">
          <div>
            <div className="ts-ph__eyebrow">대회 운영 워크스페이스</div>
            <div className="ts-ph__title">{summary.name}</div>
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              <span className="ct-pill" data-tone={summary.statusTone}>
                {summary.statusLabel}
              </span>
              <span className="ct-pill" data-tone="info">
                {summary.period}
              </span>
              <span className="ct-pill" data-tone="mute">
                {summary.venue}
              </span>
              <span className="ct-pill" data-tone="mute">
                참가 {summary.teamCount}팀 · {summary.divisionCount}종별
              </span>
              <span className="ct-pill" data-tone="mute">
                경기 {summary.matchCount}건
              </span>
            </div>
          </div>
          <EditTournamentButton />
        </div>
      </div>

      {/* 현재 메뉴 섹션 카드 (정본 ct-section) */}
      <section className="ts-card ct-section">
        <div className="ct-section__head">
          <span className="ct-headicon">
            <Icon name={cur.icon} size={18} />
          </span>
          <div>
            <h2 className="ct-section__title">{cur.label}</h2>
            <p className="ct-section__sub">{cur.desc}</p>
          </div>
        </div>

        {menu === "teams" ? (
          <TeamsPanel
            tournamentId={tournamentId}
            tournamentName={summary.name}
            teams={teams}
            rules={rules}
          />
        ) : menu === "bracket" ? (
          // R4-B: 대진표 패널(실데이터 READ + 기존 엔드포인트 mutation)
          <BracketPanel tournamentId={tournamentId} data={bracketData} />
        ) : menu === "schedule" ? (
          // R4-C: 일정 패널(실데이터 READ · 계획 클라 오버레이 · 영속화 미배선 보고)
          <SchedulePanel data={scheduleData} />
        ) : menu === "ops" ? (
          // R4-D: 운영관리(운영진·기록원·심판·공지·기록모드 — 실 엔드포인트)
          <OpsPanel tournamentId={tournamentId} data={opsData} />
        ) : menu === "site" ? (
          // R4-D: 사이트(TournamentSite 설정·발행·방문 — 실 엔드포인트)
          <SitePanel tournamentId={tournamentId} data={siteData} />
        ) : menu === "settle" ? (
          // R4-D: 정산(참가비 입금 = teams paid × fee · 지출 = tournament_expense)
          <SettlePanel
            tournamentId={tournamentId}
            teams={teams}
            rules={rules}
            data={settleData}
          />
        ) : (
          // 정의되지 않은 메뉴(방어) — 정본 Empty
          <Empty
            icon={cur.icon}
            title="준비 중입니다"
            desc="이 메뉴는 다음 업데이트에서 제공됩니다."
          />
        )}
      </section>
    </AdminShell>
  );
}
