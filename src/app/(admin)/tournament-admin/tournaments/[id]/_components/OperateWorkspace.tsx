"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { Icon } from "@/components/admin-toss";
import type { RecordingMode } from "@/lib/tournaments/recording-mode";
import type { MatchStats, StatusTone, TournamentWorkspaceProps } from "./TournamentWorkspace";

type MenuId = "teams" | "bracket" | "schedule" | "ops" | "site" | "settle";

type PanelComponent = ComponentType<object>;

type MatchesPanelProps = {
  tournamentId: string;
  defaultMode: RecordingMode;
  matchStats: MatchStats;
};

const TeamsPanel = dynamic(() => import("../_panels/teams-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const BracketPanel = dynamic(() => import("../_panels/bracket-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const MatchesPanel = dynamic(() => import("../_panels/matches-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as ComponentType<MatchesPanelProps>;
const RecordersPanel = dynamic(() => import("../_panels/recorders-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const AdminsPanel = dynamic(() => import("../_panels/admins-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;
const SitePanel = dynamic(() => import("../_panels/site-panel"), {
  ssr: false,
  loading: () => <PanelLoading />,
}) as PanelComponent;

const MENUS: Array<{ id: MenuId; label: string; icon: string; desc: string }> = [
  { id: "teams", label: "참가팀", icon: "users", desc: "종별 참가 신청과 참가비 현황을 관리합니다." },
  { id: "bracket", label: "대진표", icon: "git-merge", desc: "종별 운영 방식에 맞춰 대진표를 생성합니다." },
  { id: "schedule", label: "일정", icon: "calendar-clock", desc: "생성된 경기의 일정과 기록 방식을 관리합니다." },
  { id: "ops", label: "운영관리", icon: "shield-check", desc: "운영진, 기록원, 경기 운영 역할을 관리합니다." },
  { id: "site", label: "사이트", icon: "globe", desc: "공개 대회 사이트를 설정하고 발행합니다." },
  { id: "settle", label: "정산", icon: "wallet", desc: "대회 정산 연결 상태를 확인합니다." },
];

const HASH_MENU_MAP: Record<string, MenuId> = {
  teams: "teams",
  applications: "teams",
  divisions: "bracket",
  structure: "bracket",
  bracket: "bracket",
  matches: "schedule",
  schedule: "schedule",
  game: "schedule",
  staff: "ops",
  recorders: "ops",
  admins: "ops",
  ops: "ops",
  publish: "site",
  site: "site",
  settle: "settle",
  settlement: "settle",
};

function menuFromHash(): MenuId | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace("#", "");
  return HASH_MENU_MAP[raw] ?? null;
}

function formatDate(value: string) {
  if (!value) return "일정 미정";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${year}. ${Number(month)}. ${Number(day)}.`;
}

function getDday(startDate: string) {
  if (!startDate) return "D- ?";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const [year, month, day] = startDate.split("-").map(Number);
  const target = new Date(year, month - 1, day).getTime();
  const diff = Math.round((target - today) / 86400000);
  if (diff === 0) return "D-Day";
  return diff > 0 ? `D- ${diff}` : `D+ ${Math.abs(diff)}`;
}

function numberText(value: number | null | undefined, fallback = "0") {
  if (typeof value !== "number") return fallback;
  return value.toLocaleString("ko-KR");
}

export function OperateWorkspace({
  tournamentId,
  progress,
  publishGate,
  matchStats,
  defaultRecordingMode,
  setup,
  summary,
}: TournamentWorkspaceProps) {
  const [menu, setMenu] = useState<MenuId>("teams");
  const current = useMemo(() => MENUS.find((item) => item.id === menu) ?? MENUS[0], [menu]);
  const dateRange = setup.endDate && setup.endDate !== setup.startDate
    ? `${formatDate(setup.startDate)} ~ ${formatDate(setup.endDate)}`
    : formatDate(setup.startDate);

  useEffect(() => {
    const sync = () => {
      const next = menuFromHash();
      if (next) setMenu(next);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function selectMenu(next: MenuId) {
    setMenu(next);
    window.history.replaceState(null, "", `#${next}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div data-skin="toss" className="tw-shell operate-workspace">
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div className="min-w-0">
            <div className="ts-ph__eyebrow">대회 운영 워크스페이스 · v2.41 Toss</div>
            <h1 className="ts-ph__title">{setup.name}</h1>
            <div className="tw-badges">
              <span className="ct-pill" data-tone={summary.statusTone}>{summary.statusLabel}</span>
              <span className="ct-pill" data-tone="info">{getDday(setup.startDate)}</span>
              <span className="ct-pill" data-tone="mute">
                참가 {numberText(summary.teamCount)} 팀 · {numberText(summary.divisionCount)} 종별
              </span>
              <span className="ct-pill" data-tone={summary.matchCount > 0 ? "ok" : "warn"}>
                {numberText(summary.matchCount)}경기
              </span>
            </div>
            <p className="ts-ph__sub">{dateRange}{setup.venue_name ? ` · ${setup.venue_name}` : ""}</p>
          </div>
          <div className="operate-workspace__head-actions">
            <Link href="/tournament-admin/tournaments" className="ts-btn ts-btn--secondary ts-btn--sm">
              목록으로
            </Link>
            <Link href={`/tournament-admin/tournaments/${tournamentId}/edit`} className="ts-btn ts-btn--secondary ts-btn--sm">
              대회 정보 수정 <Icon name="pencil" size={15} />
            </Link>
          </div>
        </div>
      </div>

      <div className="operate-summary">
        <OperateMetric label="참가팀" value={`${numberText(summary.teamCount)}${summary.maxTeams ? ` / ${summary.maxTeams}` : ""}`} tone="info" />
        <OperateMetric label="종별" value={`${numberText(summary.divisionCount)}개`} tone="info" />
        <OperateMetric label="경기" value={`${numberText(summary.matchCount)}경기`} tone={summary.matchCount > 0 ? "ok" : "warn"} />
        <OperateMetric label="공개" value={summary.sitePublished ? "공개 중" : summary.siteConfigured ? "사이트 준비" : "사이트 필요"} tone={summary.sitePublished ? "ok" : "warn"} />
        <OperateMetric label="필수 확인" value={publishGate.ok ? "완료" : `${publishGate.missing.length}개 남음`} tone={publishGate.ok ? "ok" : "warn"} />
        <OperateMetric label="셋업" value={`${progress.completed}/${progress.total}`} tone={publishGate.ok ? "ok" : "info"} />
      </div>

      <div className="op-menu" role="tablist" aria-label="대회 운영 메뉴">
        {MENUS.map((item) => {
          const active = item.id === menu;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={["op-menu__item", active ? "is-active" : ""].join(" ")}
              onClick={() => selectMenu(item.id)}
            >
              <Icon name={item.icon} size={22} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <section className="ts-card operate-panel">
        <div className="ct-section__head">
          <span className="ct-headicon"><Icon name={current.icon} size={18} /></span>
          <div>
            <h2 className="ct-section__title">{current.label}</h2>
            <p className="ct-section__sub">{current.desc}</p>
          </div>
        </div>
        <OperateBody
          menu={menu}
          tournamentId={tournamentId}
          defaultRecordingMode={defaultRecordingMode}
          matchStats={matchStats}
        />
      </section>
    </div>
  );
}

function OperateBody({
  menu,
  tournamentId,
  defaultRecordingMode,
  matchStats,
}: {
  menu: MenuId;
  tournamentId: string;
  defaultRecordingMode: RecordingMode;
  matchStats: MatchStats;
}) {
  if (menu === "teams") {
    return <PanelFrame><TeamsPanel /></PanelFrame>;
  }
  if (menu === "bracket") {
    return <PanelFrame><BracketPanel /></PanelFrame>;
  }
  if (menu === "schedule") {
    return (
      <PanelFrame>
        <MatchesPanel
          tournamentId={tournamentId}
          defaultMode={defaultRecordingMode}
          matchStats={matchStats}
        />
      </PanelFrame>
    );
  }
  if (menu === "ops") {
    return <OpsPanel />;
  }
  if (menu === "site") {
    return <PanelFrame><SitePanel /></PanelFrame>;
  }
  return <SettlementPanel />;
}

function OpsPanel() {
  return (
    <div className="operate-stack">
      <div className="ts-card ts-card--flat">
        <div className="ct-section__head">
          <span className="ct-headicon"><Icon name="shield" size={18} /></span>
          <div>
            <h3 className="ct-section__title">운영진</h3>
            <p className="ct-section__sub">대회 운영 권한을 가진 관리자를 추가하거나 제거합니다.</p>
          </div>
        </div>
        <PanelFrame><AdminsPanel /></PanelFrame>
      </div>
      <div className="ts-card ts-card--flat">
        <div className="ct-section__head">
          <span className="ct-headicon"><Icon name="pencil" size={18} /></span>
          <div>
            <h3 className="ct-section__title">기록원</h3>
            <p className="ct-section__sub">경기별 기록 담당자를 배정합니다.</p>
          </div>
        </div>
        <PanelFrame><RecordersPanel /></PanelFrame>
      </div>
    </div>
  );
}

function SettlementPanel() {
  return (
    <div className="ct-emptybox ct-emptybox--tall">
      <Icon name="wallet" size={36} color="var(--ink-dim)" />
      <b style={{ color: "var(--ink)" }}>대회별 정산 패널은 아직 실배선 전입니다.</b>
      <span>
        현재 운영 DB에는 심판 배정 정산 흐름만 연결되어 있습니다. 참가비 입금·지출 정산은 데이터 필드 확정 후 연결해야 합니다.
      </span>
      <div className="operate-empty-actions">
        <Link href="/referee/admin/settlements" className="ts-btn ts-btn--secondary ts-btn--sm">
          심판 정산 관리
        </Link>
      </div>
    </div>
  );
}

function OperateMetric({
  label,
  value,
  tone = "mute",
}: {
  label: string;
  value: string;
  tone?: StatusTone;
}) {
  return (
    <div className="operate-metric" data-tone={tone}>
      <span className="operate-metric__label">{label}</span>
      <span className="operate-metric__value">{value}</span>
    </div>
  );
}

function PanelFrame({ children }: { children: ReactNode }) {
  return <div className="ct-panel-embed operate-panel__body">{children}</div>;
}

function PanelLoading() {
  return (
    <div className="ct-emptybox mt-4">
      불러오는 중입니다.
    </div>
  );
}
