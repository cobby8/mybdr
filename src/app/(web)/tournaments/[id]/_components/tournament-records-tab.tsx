"use client";

/**
 * tournament-records-tab.tsx — 대회 기록실 탭
 * ─────────────────────────────────────────────────────────
 * 시안 박제: Dev/design/BDR v2.33/_delivery-records-2026-06-16/screens/TournamentRecords.jsx
 *
 * 이유(왜): 대회 상세 "기록실" 탭. 한 대회 안 전수 집계를 [선수][팀][경기] 토글로.
 * 방법(어떻게): /api/web/tournaments/[id]/records 공개 API(공식가드) 를 client fetch.
 *   응답은 snake_case(raw) 그대로 사용 → 시안 statCols 키와 1:1. camelCase 변환 안 함.
 *   링크는 Team.id / User.id 기반(시안의 팀명 링크 → 운영 id 링크).
 */

import { useState, useEffect } from "react";
import useSWR from "swr";
import {
  RecSeg,
  RecAggToggle,
  RecTable,
  RecEmpty,
  RecLoading,
  Lnk,
  userHref,
  teamHref,
  fmt1,
  statCols,
  type RecRow,
  type RecColumn,
  type StatMode,
} from "../../../_components/records/records-shared";
// 2026-06-27 기록 모드 인증 뱃지 — 대회 메타 헤더(대회 기본 모드) + 경기로그 행(per-game).
import { RecordingModeBadge } from "@/components/recording-mode-badge";

// raw fetcher — snake_case 응답 그대로(camelCase 변환 안 함).
// apiSuccess 가 {data:...} 래핑/비래핑 모두 대비해 root 폴백.
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  });

interface RecordsData {
  meta: {
    status: string;
    division: string | null;
    teams_n: number;
    games_n: number;
    mvp_name: string | null;
    // 2026-06-27: 대회 기본 기록 모드(records API meta 가 이미 노출). 타입만 보강.
    default_recording_mode?: string | null;
  };
  players: RecRow[];
  teams: RecRow[];
  games: RecRow[];
}

const SEG_OPTIONS = [
  { v: "player", l: "선수 기록", ico: "person" },
  { v: "team", l: "팀 기록", ico: "groups" },
  { v: "game", l: "경기", ico: "sports_basketball" },
];

// 평균/누적 토글 — 선수·팀 집계표 전용(경기 로그는 N/A).
const AGG_OPTIONS = [
  { v: "avg", l: "평균" },
  { v: "sum", l: "누적" },
];

const LEAD_CATS: {
  key: string;
  label: string;
  unit: string;
  pct?: boolean;
  filter?: (r: RecRow) => boolean;
}[] = [
  { key: "ppg", label: "득점", unit: "PPG" },
  { key: "rpg", label: "리바운드", unit: "RPG" },
  { key: "apg", label: "어시스트", unit: "APG" },
  { key: "spg", label: "스틸", unit: "SPG" },
  { key: "bpg", label: "블록", unit: "BPG" },
  { key: "tp_pct", label: "3점 성공률", unit: "3P%", pct: true, filter: (r) => Number(r.tp_pct) > 0 },
];

export function TournamentRecordsTab({ tournamentId }: { tournamentId: string }) {
  const { data, isLoading, error } = useSWR(
    `/api/web/tournaments/${tournamentId}/records`,
    fetcher,
    { revalidateOnFocus: false },
  );
  const [unit, setUnit] = useState<string>("player");
  const [leadCat, setLeadCat] = useState<string | null>(null);
  // 집계 단위(평균/누적) — 선수·팀 표에 적용. 리더보드/경기 로그는 무관(평균 기준 유지).
  const [aggMode, setAggMode] = useState<StatMode>("avg");

  // ESC 로 더보기 모달 닫기
  useEffect(() => {
    if (!leadCat) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLeadCat(null);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [leadCat]);

  if (isLoading) return <RecLoading />;
  if (error)
    return (
      <RecEmpty
        icon="error_outline"
        title="기록을 불러오지 못했습니다"
        desc="잠시 후 다시 시도해 주세요."
      />
    );

  const root = (data?.data ?? data ?? {}) as Partial<RecordsData>;
  const D: RecordsData = {
    meta: root.meta ?? {
      status: "",
      division: null,
      teams_n: 0,
      games_n: 0,
      mvp_name: null,
      default_recording_mode: null,
    },
    players: root.players ?? [],
    teams: root.teams ?? [],
    games: root.games ?? [],
  };

  // 공식 매치/기록 0 → 빈 상태
  if (D.games.length === 0 && D.players.length === 0) {
    return (
      <section className="rec-card">
        <div className="rec-card__head">
          <h3 className="rec-card__h">
            <span className="ico material-symbols-outlined">leaderboard</span>
            대회 기록실
          </h3>
        </div>
        <RecEmpty
          title="아직 기록이 없습니다"
          desc="완료된 대회 경기가 집계되면 선수·팀·경기 기록이 표시됩니다."
        />
      </section>
    );
  }

  // 선수 리더보드 컬럼 — 표준 박스(statCols, avg)
  const playerCols: RecColumn<RecRow>[] = [
    {
      key: "name",
      label: "선수",
      align: "left",
      sticky: true,
      strong: true,
      sortVal: (r) => String(r.name),
      render: (r) => (
        <span className="rec-player">
          {r.claimed ? (
            <Lnk href={userHref(r.user_id as string | null)} className="rec-player__name">
              {r.name}
            </Lnk>
          ) : (
            <span className="rec-player__name">{r.player_name}</span>
          )}
          <Lnk href={teamHref(r.team_id as string | null)} className="rec-tn-team">
            {r.team}
          </Lnk>
          {!r.claimed && <span className="rec-player__unlinked">미연동</span>}
          {!!r.claimed && (
            <span className="ico material-symbols-outlined rec-player__go">
              chevron_right
            </span>
          )}
        </span>
      ),
    },
    { key: "g", label: "G", align: "right" },
    ...statCols<RecRow>({ mode: aggMode }),
  ];

  // 팀 집계 컬럼 — 표준 박스(MIN 제외) + 순위(승–패·실점·득실)
  const teamSc = statCols<RecRow>({ mode: aggMode }).filter((c) => c.key !== "min");
  const teamCols: RecColumn<RecRow>[] = [
    {
      key: "name",
      label: "팀",
      align: "left",
      sticky: true,
      strong: true,
      render: (r) => (
        <span className="rec-player">
          <Lnk href={teamHref(r.team_id as string | null)} className="rec-player__name">
            {r.name}
          </Lnk>
          <span className="ico material-symbols-outlined rec-player__go">
            chevron_right
          </span>
        </span>
      ),
    },
    { key: "g", label: "G", align: "right" },
    {
      key: "wl",
      label: "승–패",
      align: "right",
      sortable: false,
      render: (r) => (
        <span className="rec-wlrec">
          {r.w}–{r.l}
        </span>
      ),
    },
    {
      key: "win",
      label: "승률",
      align: "right",
      sortVal: (r) => (Number(r.g) ? Number(r.w) / Number(r.g) : 0),
      render: (r) =>
        Number(r.g) ? Math.round((Number(r.w) / Number(r.g)) * 100) + "%" : "–",
    },
    { ...teamSc[0], label: "득점" },
    {
      key: "oppg",
      label: "실점",
      align: "right",
      render: (r) => fmt1(r.oppg),
    },
    {
      key: "diff",
      label: "득실",
      align: "right",
      render: (r) => (
        <span
          style={{
            color: Number(r.diff) >= 0 ? "var(--ok)" : "var(--color-error)",
            fontWeight: 700,
          }}
        >
          {(Number(r.diff) >= 0 ? "+" : "") + fmt1(r.diff)}
        </span>
      ),
    },
    ...teamSc.slice(1),
  ];

  // 경기 로그 컬럼
  const gameCols: RecColumn<RecRow>[] = [
    {
      key: "date",
      label: "날짜",
      align: "left",
      sticky: true,
      strong: true,
      sortVal: (r) => String(r.date),
      render: (r) => String(r.date).slice(5).replace("-", "."),
    },
    {
      key: "round",
      label: "라운드",
      align: "left",
      sortable: false,
      // 라운드 + 이 경기의 기록 모드 뱃지(sm, per-game recording_mode).
      render: (r) => (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span className="rec-dim">{r.round}</span>
          <RecordingModeBadge
            mode={r.recording_mode as string | null | undefined}
            size="sm"
          />
        </span>
      ),
    },
    {
      key: "home",
      label: "홈",
      align: "right",
      sortable: false,
      render: (r) => (
        <Lnk href={teamHref(r.home_id as string | null)}>
          <span
            style={{
              fontWeight: Number(r.hs) > Number(r.as) ? 800 : 500,
              color: Number(r.hs) > Number(r.as) ? "var(--ink)" : "var(--ink-mute)",
            }}
          >
            {r.home}
          </span>
        </Lnk>
      ),
    },
    {
      key: "score",
      label: "스코어",
      align: "right",
      sortable: false,
      render: (r) => (
        <span className="rec-tn-score">
          {r.hs} : {r.as}
        </span>
      ),
    },
    {
      key: "away",
      label: "원정",
      align: "left",
      sortable: false,
      render: (r) => (
        <Lnk href={teamHref(r.away_id as string | null)}>
          <span
            style={{
              fontWeight: Number(r.as) > Number(r.hs) ? 800 : 500,
              color: Number(r.as) > Number(r.hs) ? "var(--ink)" : "var(--ink-mute)",
            }}
          >
            {r.away}
          </span>
        </Lnk>
      ),
    },
  ];

  // 스탯 리더 (클레임 선수만)
  const claimed = D.players.filter((p) => p.claimed);
  const rankFor = (c: (typeof LEAD_CATS)[number]) =>
    claimed
      .filter(c.filter || (() => true))
      .slice()
      .sort((a, b) => Number(b[c.key]) - Number(a[c.key]));

  const leaders = (
    <div className="rec-leaders">
      {LEAD_CATS.map((c) => {
        const full = rankFor(c);
        const list = full.slice(0, 3);
        const max = list.length ? Number(list[0][c.key]) : 1;
        return (
          <div className="rec-lead" key={c.key}>
            <div className="rec-lead__h">
              <span>{c.label}</span>
              <span className="rec-lead__unit">{c.unit}</span>
            </div>
            {list.map((p, i) => (
              <div
                className="rec-lead__row"
                key={(p.user_id as string) || (p.name as string)}
                title={p.name + " · " + p.team}
              >
                <span className={"rec-lead__rank" + (i === 0 ? " is-top" : "")}>
                  {i + 1}
                </span>
                <span className="rec-lead__name">
                  <Lnk href={userHref(p.user_id as string | null)}>{p.name}</Lnk>
                  <Lnk href={teamHref(p.team_id as string | null)}>
                    <i>{p.team}</i>
                  </Lnk>
                </span>
                <span className="rec-lead__bar">
                  <b
                    style={{
                      width: (Number(p[c.key]) / (max || 1)) * 100 + "%",
                      background: i === 0 ? "var(--accent)" : "var(--cafe-blue)",
                    }}
                  />
                </span>
                <span className="rec-lead__val">
                  {c.pct
                    ? Number(p[c.key]).toFixed(1) + "%"
                    : Number(p[c.key]).toFixed(1)}
                </span>
              </div>
            ))}
            <button className="rec-lead__more" onClick={() => setLeadCat(c.key)}>
              더보기 <span className="rec-lead__more-n">전체 {full.length}명</span>
            </button>
          </div>
        );
      })}
    </div>
  );

  // 더보기 모달
  const modalCat = LEAD_CATS.find((c) => c.key === leadCat);
  let leaderModal = null;
  if (modalCat) {
    const full = rankFor(modalCat);
    const max = full.length ? Number(full[0][modalCat.key]) : 1;
    leaderModal = (
      <div className="rec-modal" onClick={() => setLeadCat(null)}>
        <div className="rec-modal__panel" onClick={(e) => e.stopPropagation()}>
          <div className="rec-modal__head">
            <h4>
              <span className="ico material-symbols-outlined">emoji_events</span>
              {modalCat.label} 순위{" "}
              <span className="rec-dim">
                {modalCat.unit} · 전체 {full.length}명
              </span>
            </h4>
            <button
              className="rec-modal__x"
              onClick={() => setLeadCat(null)}
              aria-label="닫기"
            >
              <span className="ico material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="rec-modal__body">
            {full.map((p, i) => (
              <div
                className="rec-lead__row rec-modal__row"
                key={(p.user_id as string) || (p.name as string)}
              >
                <span className={"rec-lead__rank" + (i === 0 ? " is-top" : "")}>
                  {i + 1}
                </span>
                <span className="rec-lead__name">
                  <Lnk href={userHref(p.user_id as string | null)}>{p.name}</Lnk>
                  <Lnk href={teamHref(p.team_id as string | null)}>
                    <i>{p.team}</i>
                  </Lnk>
                </span>
                <span className="rec-lead__bar">
                  <b
                    style={{
                      width: (Number(p[modalCat.key]) / (max || 1)) * 100 + "%",
                      background: i === 0 ? "var(--accent)" : "var(--cafe-blue)",
                    }}
                  />
                </span>
                <span className="rec-lead__val">
                  {modalCat.pct
                    ? Number(p[modalCat.key]).toFixed(1) + "%"
                    : Number(p[modalCat.key]).toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  let body: React.ReactNode;
  if (unit === "player")
    body = (
      <>
        <h4 className="rec-subh">
          <span className="ico material-symbols-outlined">emoji_events</span>
          스탯 리더{" "}
          <span className="rec-dim">카테고리별 TOP 3 · 더보기로 전체</span>
        </h4>
        {leaders}
        <h4 className="rec-subh" style={{ marginTop: 20 }}>
          <span className="ico material-symbols-outlined">format_list_numbered</span>
          전체 선수 <span className="rec-dim">{claimed.length}명 · 기록 헤더 클릭 정렬</span>
        </h4>
        <RecTable
          columns={playerCols}
          rows={D.players}
          getKey={(r) => (r.user_id as string) || (r.player_name as string)}
          initialSort={{ key: "pts", dir: "desc" }}
        />
      </>
    );
  else if (unit === "team")
    body = (
      <RecTable
        columns={teamCols}
        rows={D.teams.map((t) => ({ ...t, pts: t.ppg }) as RecRow)}
        getKey={(r) => r.team_id as string}
        initialSort={{ key: "win", dir: "desc" }}
      />
    );
  else
    body = (
      <RecTable
        columns={gameCols}
        rows={D.games}
        getKey={(r) => r.match_id as string}
        initialSort={{ key: "date", dir: "desc" }}
      />
    );

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h">
          <span className="ico material-symbols-outlined">leaderboard</span>
          대회 기록실
        </h3>
        <span className="rec-card__src">
          MatchPlayerStat · TournamentTeam · TournamentMatch
        </span>
      </div>
      <div className="rec-tnmeta">
        {D.meta.status && <span className="rec-tnmeta__pill">{D.meta.status}</span>}
        {/* 2026-06-27 대회 기본 기록 모드 뱃지(md) — 메타 헤더. flutter/paper 만 노출 */}
        <RecordingModeBadge mode={D.meta.default_recording_mode} size="md" />
        {D.meta.division && <span>{D.meta.division}</span>}
        <span>
          <span className="ico material-symbols-outlined">groups</span>
          {D.meta.teams_n}팀
        </span>
        <span>
          <span className="ico material-symbols-outlined">sports_basketball</span>
          {D.meta.games_n}경기
        </span>
        {D.meta.mvp_name && (
          <span>
            <span className="ico material-symbols-outlined">military_tech</span>
            MVP {D.meta.mvp_name}
          </span>
        )}
      </div>

      <div className="rec-toolbar">
        <RecSeg value={unit} onChange={setUnit} options={SEG_OPTIONS} />
        {unit === "player" && (
          <span className="rec-toolbar__note">
            <span className="ico material-symbols-outlined">touch_app</span>
            선수 → 개인 기록
          </span>
        )}
        {unit === "team" && (
          <span className="rec-toolbar__note">
            <span className="ico material-symbols-outlined">touch_app</span>팀 → 팀 페이지
          </span>
        )}
        {unit === "game" && (
          <span className="rec-toolbar__note">
            <span className="ico material-symbols-outlined">touch_app</span>경기 → 박스스코어
          </span>
        )}
        {/* 평균/누적 토글 — 우측 정렬(margin-left:auto). 선수·팀 집계표에만(경기 로그 N/A) */}
        {(unit === "player" || unit === "team") && (
          <div style={{ marginLeft: "auto" }}>
            <RecAggToggle
              value={aggMode}
              onChange={(v) => setAggMode(v as StatMode)}
              options={AGG_OPTIONS}
            />
          </div>
        )}
      </div>

      {body}
      {leaderModal}

      <div className="rec-foot">
        <span className="ico material-symbols-outlined">info</span>
        <span>
          대회 한정 집계 — 참가 선수의 MatchPlayerStat(이 대회 매치)와
          TournamentTeam·TournamentMatch 기준. 미연동 선수는 대회 명단 이름만 표시.
        </span>
      </div>
    </section>
  );
}
