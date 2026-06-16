"use client";

/**
 * team-records-tab.tsx — 팀 기록 탭 (/teams/[id]?tab=stats "기록")
 * ─────────────────────────────────────────────────────────
 * 시안 박제: Dev/design/BDR v2.33/_delivery-records-2026-06-16/screens/TeamRecords.jsx
 *
 * 이유(왜): 팀 상세 "기록" 탭. 기존 StatsTabV2(전부 "준비 중" placeholder)를 교체.
 * 방법(어떻게): /api/web/teams/[id]/records 공개 API(공식가드) 를 client fetch.
 *   - 경기별/대회별은 먼저 목록 → 항목 클릭 시 팀 전체 박스로 드릴다운.
 *   - 시즌별은 연도 칩 + 로스터 집계 + 팀 평균 pinned 행.
 *   - 응답은 snake_case(raw) 그대로 사용 → statCols 키와 1:1. camelCase 변환 안 함.
 *   - ⚠ 대회 경기(TournamentMatch) 한정. 친선/픽업은 박스 없음.
 *   - 로스터/집계는 TournamentTeam 경유 ttp 기준. 평점은 null('–').
 */

import { useState } from "react";
import useSWR from "swr";
import {
  RecSeg,
  RecTable,
  RecEmpty,
  RecLoading,
  Lnk,
  userHref,
  statCols,
  type RecRow,
  type RecColumn,
} from "../../../_components/records/records-shared";

// raw fetcher — snake_case 응답 그대로(camelCase 변환 안 함).
const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`API ${r.status}`);
    return r.json();
  });

interface GameRow {
  match_id: string;
  date: string;
  tournament: string;
  opp: string;
  opp_id: string | null;
  result: string;
  hs: number;
  as: number;
  box: RecRow[];
}
interface TeamRecordsData {
  meta: { team_name: string; members_n: number; claimed_n: number };
  seasons: number[];
  tournaments: { id: string; name: string }[];
  games: GameRow[];
  season_rosters: Record<string, RecRow[]>;
  tournament_rosters: Record<string, RecRow[]>;
}

const SEG_OPTIONS = [
  { v: "game", l: "경기별", ico: "list_alt" },
  { v: "tournament", l: "대회별", ico: "emoji_events" },
  { v: "season", l: "시즌별", ico: "calendar_month" },
];

const r1 = (n: number): number => Math.round(n * 10) / 10;
const pctOf = (made: number, att: number): number =>
  att ? Math.round((made / att) * 1000) / 10 : 0;

export function TeamRecordsTab({ teamId }: { teamId: string }) {
  const { data, isLoading, error } = useSWR(
    `/api/web/teams/${teamId}/records`,
    fetcher,
    { revalidateOnFocus: false },
  );
  const [unit, setUnit] = useState<string>("game");
  const [season, setSeason] = useState<number | null>(null);
  const [selGame, setSelGame] = useState<string | null>(null);
  const [selTn, setSelTn] = useState<string | null>(null);

  if (isLoading) return <RecLoading />;
  if (error)
    return (
      <RecEmpty
        icon="error_outline"
        title="기록을 불러오지 못했습니다"
        desc="잠시 후 다시 시도해 주세요."
      />
    );

  const root = (data?.data ?? data ?? {}) as Partial<TeamRecordsData>;
  const D: TeamRecordsData = {
    meta: root.meta ?? { team_name: "팀", members_n: 0, claimed_n: 0 },
    seasons: root.seasons ?? [],
    tournaments: root.tournaments ?? [],
    games: root.games ?? [],
    season_rosters: root.season_rosters ?? {},
    tournament_rosters: root.tournament_rosters ?? {},
  };

  // 대회 경기 0 → 빈 상태 (대회 경기 한정 안내)
  if (D.games.length === 0) {
    return (
      <section className="rec-card">
        <div className="rec-card__head">
          <h3 className="rec-card__h">
            <span className="ico material-symbols-outlined">groups</span>기록
          </h3>
        </div>
        <RecEmpty
          title="아직 대회 경기 기록이 없습니다"
          desc="대회 경기 기록만 표시됩니다 (친선·픽업 경기는 박스스코어가 없습니다)."
        />
      </section>
    );
  }

  const curSeason = season ?? (D.seasons[0] ?? null);
  const switchUnit = (v: string) => {
    setUnit(v);
    setSelGame(null);
    setSelTn(null);
  };

  // 팀 합계/평균 행 (클레임 선수 합산) — 시안 teamLine 박제
  const teamLine = (rows: RecRow[], avg: boolean): RecRow | null => {
    const cs = rows.filter(
      (r) => r.claimed && (avg ? r.g != null : true),
    );
    if (!cs.length) return null;
    const sum = (k: string) =>
      cs.reduce((a, r) => a + (Number(r[k]) || 0), 0);
    const t: RecRow = { _team: true };
    (["fgm", "fga", "tpm", "tpa", "ftm", "fta", "oreb", "dreb", "ast", "stl", "blk", "tov", "pf"] as const).forEach(
      (k) => {
        t[k] = r1(sum(k));
      },
    );
    t.pts = r1(2 * Number(t.fgm) + Number(t.tpm) + Number(t.ftm));
    t.reb = r1(Number(t.oreb) + Number(t.dreb));
    t.fg_pct = pctOf(sum("fgm"), sum("fga"));
    t.tp_pct = pctOf(sum("tpm"), sum("tpa"));
    t.ft_pct = pctOf(sum("ftm"), sum("fta"));
    t.pm = r1(sum("pm") / cs.length);
    t.rating = null; // 평점 데이터 부재 (Q1)
    t.min = null; // 팀 합계에서 MIN 은 의미 약함
    if (avg) t.g = Math.max(...cs.map((r) => Number(r.g)));
    return t;
  };

  // 선수/팀 이름 셀
  const nameCell = (r: RecRow) =>
    r._team ? (
      <span className="rec-player rec-player--team">
        <span className="ico material-symbols-outlined rec-player__teamico">
          groups
        </span>
        <span className="rec-player__name">{D.meta.team_name} 평균</span>
        <span className="rec-player__teamtag">팀 전체</span>
      </span>
    ) : (
      <span className="rec-player">
        {r.jersey != null && (
          <span className="rec-player__jersey">{r.jersey}</span>
        )}
        {r.claimed ? (
          <Lnk
            href={userHref(r.user_id as string | null)}
            className="rec-player__name"
          >
            {r.name}
          </Lnk>
        ) : (
          <span className="rec-player__name">{r.player_name}</span>
        )}
        {!r.claimed && <span className="rec-player__unlinked">미연동</span>}
        {!!r.claimed && (
          <span className="ico material-symbols-outlined rec-player__go">
            chevron_right
          </span>
        )}
      </span>
    );

  const nameCol: RecColumn<RecRow> = {
    key: "name",
    label: "선수",
    align: "left",
    sticky: true,
    strong: true,
    sortVal: (r) => String(r.name),
    render: nameCell,
  };
  const gCol: RecColumn<RecRow> = {
    key: "g",
    label: "G",
    align: "right",
    sortVal: (r) => (r.g == null ? -1 : Number(r.g)),
    render: (r) =>
      r.g == null ? <span className="rec-na">–</span> : (r.g as number),
  };
  const aggCols: RecColumn<RecRow>[] = [
    nameCol,
    gCol,
    ...statCols<RecRow>({ avg: true }),
  ];
  const boxCols: RecColumn<RecRow>[] = [
    nameCol,
    ...statCols<RecRow>({ avg: false }),
  ];

  const pinned = (rows: RecRow[], avg: boolean): RecRow[] => {
    const t = teamLine(rows, avg);
    return t ? [t] : [];
  };
  const playerKey = (r: RecRow) =>
    (r.jersey ?? "") + "-" + (r.user_id ?? r.player_name ?? "");

  let body: React.ReactNode;

  if (unit === "season") {
    const rows = (curSeason != null ? D.season_rosters[String(curSeason)] : []) ?? [];
    body = (
      <>
        <div className="rec-scope" style={{ marginBottom: 12 }}>
          {D.seasons.map((y) => (
            <button
              key={y}
              className={"rec-chip" + (curSeason === y ? " is-on" : "")}
              onClick={() => setSeason(y)}
            >
              {y}
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <RecEmpty title="해당 시즌 기록이 없습니다" />
        ) : (
          <RecTable
            columns={aggCols}
            rows={rows}
            getKey={playerKey}
            initialSort={{ key: "pts", dir: "desc" }}
            pinnedRows={pinned(rows, true)}
          />
        )}
      </>
    );
  } else if (unit === "tournament") {
    if (selTn) {
      const tnMeta = D.tournaments.find((t) => t.id === selTn);
      const rows = D.tournament_rosters[selTn] ?? [];
      body = (
        <>
          <button className="rec-back" onClick={() => setSelTn(null)}>
            <span className="ico material-symbols-outlined">arrow_back</span>
            대회 목록
          </button>
          <h4 className="rec-drillhead">
            <span className="ico material-symbols-outlined">emoji_events</span>
            {tnMeta ? tnMeta.name : ""}{" "}
            <span className="rec-dim">팀 전체 기록</span>
          </h4>
          {rows.length === 0 ? (
            <RecEmpty title="해당 대회 기록이 없습니다" />
          ) : (
            <RecTable
              columns={aggCols}
              rows={rows}
              getKey={playerKey}
              initialSort={{ key: "pts", dir: "desc" }}
              pinnedRows={pinned(rows, true)}
            />
          )}
        </>
      );
    } else {
      body = (
        <div className="rec-list">
          {D.tournaments.map((t) => (
            <button
              key={t.id}
              className="rec-listrow"
              onClick={() => setSelTn(t.id)}
            >
              <span
                className="ico material-symbols-outlined"
                style={{ color: "var(--accent)", fontSize: 20 }}
              >
                emoji_events
              </span>
              <span className="rec-listrow__main">
                <span className="rec-listrow__title">{t.name}</span>
                <span className="rec-listrow__sub">대회 전체 기록 보기</span>
              </span>
              <span className="ico material-symbols-outlined rec-listrow__go">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      );
    }
  } else {
    // game
    if (selGame) {
      const gm = D.games.find((g) => g.match_id === selGame);
      body = gm ? (
        <>
          <button className="rec-back" onClick={() => setSelGame(null)}>
            <span className="ico material-symbols-outlined">arrow_back</span>
            경기 목록
          </button>
          <h4 className="rec-drillhead">
            <span>
              {gm.date.slice(5).replace("-", ".")} vs {gm.opp}
            </span>
            <span className={"rec-wl rec-wl--" + (gm.result === "W" ? "w" : "l")}>
              {gm.result}
            </span>
            <span className="rec-drillhead__score">
              {gm.hs} : {gm.as}
            </span>
            <span className="rec-dim">팀 전체 기록</span>
          </h4>
          <RecTable
            columns={boxCols}
            rows={gm.box}
            getKey={playerKey}
            initialSort={{ key: "pts", dir: "desc" }}
            pinnedRows={pinned(gm.box, false)}
          />
        </>
      ) : (
        <RecEmpty title="경기 기록을 찾을 수 없습니다" />
      );
    } else {
      body = (
        <div className="rec-list">
          {D.games.map((g) => (
            <button
              key={g.match_id}
              className="rec-listrow"
              onClick={() => setSelGame(g.match_id)}
            >
              <span className="rec-listrow__date">
                {g.date.slice(5).replace("-", ".")}
              </span>
              <span className="rec-listrow__main">
                <span className="rec-listrow__title">vs {g.opp}</span>
                <span className="rec-listrow__sub">{g.tournament}</span>
              </span>
              <span
                className={"rec-wl rec-wl--" + (g.result === "W" ? "w" : "l")}
              >
                {g.result}
              </span>
              <span className="rec-listrow__score">
                {g.hs} : {g.as}
              </span>
              <span className="ico material-symbols-outlined rec-listrow__go">
                chevron_right
              </span>
            </button>
          ))}
        </div>
      );
    }
  }

  const listMode =
    (unit === "game" && !selGame) || (unit === "tournament" && !selTn);

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h">
          <span className="ico material-symbols-outlined">groups</span>기록
        </h3>
        <span className="rec-card__src">TournamentTeam × MatchPlayerStat</span>
      </div>
      <p className="rec-card__lede">
        {listMode
          ? unit === "game"
            ? "대회 경기를 선택하면 해당 경기의 팀 전체 기록(선수별 박스)을 봅니다. · 박스스코어는 대회 경기에서만 기록됩니다."
            : "대회를 선택하면 해당 대회의 팀 전체 기록을 봅니다."
          : "소속 선수 " +
            D.meta.members_n +
            "명 · 연동 " +
            D.meta.claimed_n +
            "명. 선수를 누르면 개인 기록으로 이동합니다."}
      </p>

      <div className="rec-toolbar">
        <RecSeg value={unit} onChange={switchUnit} options={SEG_OPTIONS} />
      </div>

      {body}

      <div className="rec-foot">
        <span className="ico material-symbols-outlined">info</span>
        <span>
          미연동 선수는 대회 명단의 이름만 표시됩니다. 계정 클레임 후 개인 박스
          기록이 합산됩니다. · 경기별 기록은 대회 경기(TournamentMatch) 한정 —
          친선·픽업은 박스스코어 없음. · 팀 집계는 TournamentTeam 로스터 기준.
        </span>
      </div>
    </section>
  );
}
