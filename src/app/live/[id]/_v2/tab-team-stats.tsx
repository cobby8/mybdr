"use client";

// 2026-04-22: Phase 2 GameResult v2 — 팀 비교 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L251~L266
// 팀별 스탯을 좌우 비교 그래프 행으로 표시 (시안 9항목: 야투/3점/자유투/리바운드/어시/스틸/블록/턴오버/파울)
//
// 2026-05-02 v5 (NBA.com 참고 — 사용자 요청):
//  - 막대 두께 24/28/32px (NBA 스타일)
//  - 수치 폰트 14/18/22px (큰 폰트)
//  - 수치 막대 끝 inline (NBA 패턴)
//  - 모바일 수치 단순화 ("26/66 (39%)" → "39%")
//  - PC 좌·우 공백 줄임 (max-width)

import type { MatchDataV2, PlayerRowV2 } from "./game-result";
import "./tab-team-stats.css";

export function TabTeamStats({ match }: { match: MatchDataV2 }) {
  // 팀별 합계 집계
  const homeStats = aggregateTeam(match.home_players);
  const awayStats = aggregateTeam(match.away_players);

  // 표시할 스탯 라인 — 시안 L36~L49 중 DB 산출 가능한 9항목
  // homeShort / awayShort: 모바일 단순화 (% 또는 정수)
  // homeFull / awayFull: PC 풀 데이터 ("26/66 (39%)")
  const statRows: StatRow[] = [
    {
      label: "야투",
      homeShort: `${pct(homeStats.fgm, homeStats.fga)}%`,
      awayShort: `${pct(awayStats.fgm, awayStats.fga)}%`,
      homeFull: `${homeStats.fgm}/${homeStats.fga} (${pct(homeStats.fgm, homeStats.fga)}%)`,
      awayFull: `${awayStats.fgm}/${awayStats.fga} (${pct(awayStats.fgm, awayStats.fga)}%)`,
      homeNum: homeStats.fgm,
      awayNum: awayStats.fgm,
    },
    {
      label: "3점",
      homeShort: `${pct(homeStats.tpm, homeStats.tpa)}%`,
      awayShort: `${pct(awayStats.tpm, awayStats.tpa)}%`,
      homeFull: `${homeStats.tpm}/${homeStats.tpa} (${pct(homeStats.tpm, homeStats.tpa)}%)`,
      awayFull: `${awayStats.tpm}/${awayStats.tpa} (${pct(awayStats.tpm, awayStats.tpa)}%)`,
      homeNum: homeStats.tpm,
      awayNum: awayStats.tpm,
    },
    {
      label: "자유투",
      homeShort: `${pct(homeStats.ftm, homeStats.fta)}%`,
      awayShort: `${pct(awayStats.ftm, awayStats.fta)}%`,
      homeFull: `${homeStats.ftm}/${homeStats.fta} (${pct(homeStats.ftm, homeStats.fta)}%)`,
      awayFull: `${awayStats.ftm}/${awayStats.fta} (${pct(awayStats.ftm, awayStats.fta)}%)`,
      homeNum: homeStats.ftm,
      awayNum: awayStats.ftm,
    },
    {
      label: "리바운드",
      homeShort: String(homeStats.reb),
      awayShort: String(awayStats.reb),
      homeFull: `${homeStats.reb} (O ${homeStats.oreb} · D ${homeStats.dreb})`,
      awayFull: `${awayStats.reb} (O ${awayStats.oreb} · D ${awayStats.dreb})`,
      homeNum: homeStats.reb,
      awayNum: awayStats.reb,
    },
    { label: "어시스트", homeShort: String(homeStats.ast), awayShort: String(awayStats.ast), homeFull: String(homeStats.ast), awayFull: String(awayStats.ast), homeNum: homeStats.ast, awayNum: awayStats.ast },
    { label: "스틸", homeShort: String(homeStats.stl), awayShort: String(awayStats.stl), homeFull: String(homeStats.stl), awayFull: String(awayStats.stl), homeNum: homeStats.stl, awayNum: awayStats.stl },
    { label: "블록", homeShort: String(homeStats.blk), awayShort: String(awayStats.blk), homeFull: String(homeStats.blk), awayFull: String(awayStats.blk), homeNum: homeStats.blk, awayNum: awayStats.blk },
    { label: "턴오버", homeShort: String(homeStats.to), awayShort: String(awayStats.to), homeFull: String(homeStats.to), awayFull: String(awayStats.to), homeNum: homeStats.to, awayNum: awayStats.to },
    { label: "파울", homeShort: String(homeStats.fouls), awayShort: String(awayStats.fouls), homeFull: String(homeStats.fouls), awayFull: String(homeStats.fouls), homeNum: homeStats.fouls, awayNum: awayStats.fouls },
  ];

  return (
    <div className="card tts-card">
      {/* 상단 팀 vs 팀 헤더 */}
      <div className="tts-header">
        <div style={{ textAlign: "right" }}>
          <div className="tts-team-name">{match.home_team.name}</div>
          <div className="tts-team-tag">HOME</div>
        </div>
        <div className="tts-vs">VS</div>
        <div style={{ textAlign: "left" }}>
          <div className="tts-team-name">{match.away_team.name}</div>
          <div className="tts-team-tag">AWAY</div>
        </div>
      </div>

      {statRows.map((row) => (
        <StatCompareRow key={row.label} row={row} />
      ))}
    </div>
  );
}

interface StatRow {
  label: string;
  homeShort: string;  // 모바일 (예: "39%" / "12")
  awayShort: string;
  homeFull: string;   // PC (예: "26/66 (39%)" / "12")
  awayFull: string;
  homeNum: number;
  awayNum: number;
}

interface TeamAgg {
  fgm: number; fga: number; tpm: number; tpa: number; ftm: number; fta: number;
  oreb: number; dreb: number; reb: number;
  ast: number; stl: number; blk: number; to: number; fouls: number;
}

function aggregateTeam(players: PlayerRowV2[]): TeamAgg {
  const agg: TeamAgg = {
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
    oreb: 0, dreb: 0, reb: 0,
    ast: 0, stl: 0, blk: 0, to: 0, fouls: 0,
  };
  for (const p of players) {
    agg.fgm += p.fgm; agg.fga += p.fga; agg.tpm += p.tpm; agg.tpa += p.tpa;
    agg.ftm += p.ftm; agg.fta += p.fta;
    agg.oreb += p.oreb; agg.dreb += p.dreb; agg.reb += p.reb;
    agg.ast += p.ast; agg.stl += p.stl; agg.blk += p.blk;
    agg.to += p.to; agg.fouls += p.fouls;
  }
  return agg;
}

function pct(made: number, attempt: number): number {
  if (attempt === 0) return 0;
  return Math.round((made / attempt) * 100);
}

// 좌/우 비교 바 행 — NBA.com 스타일 (2026-05-02 v5)
//  - 막대 두께 24~32px (CSS 분기)
//  - 수치 막대 끝 inline (큰 폰트)
//  - 모바일 수치 단순화 ("26/66 (39%)" → "39%")
function StatCompareRow({ row }: { row: StatRow }) {
  const total = row.homeNum + row.awayNum || 1;

  // 턴오버 / 파울 — low-is-better
  const lowerIsBetter = row.label === "턴오버" || row.label === "파울";
  const homeWin = lowerIsBetter
    ? row.homeNum <= row.awayNum
    : row.homeNum >= row.awayNum;
  const awayWin = lowerIsBetter
    ? row.awayNum <= row.homeNum
    : row.awayNum >= row.homeNum;

  const homePct = (row.homeNum / total) * 100;
  const awayPct = (row.awayNum / total) * 100;

  return (
    <div className="tts-row">
      {/* 좌: 홈팀 (막대 우측 정렬 + 수치) */}
      <div className="tts-side--home">
        <div className="tts-bar-wrap tts-bar-wrap--home">
          <div className="tts-bar" style={{ width: `${homePct}%` }} />
        </div>
        <span
          className={`tts-value ${homeWin ? "tts-value--win" : "tts-value--lose"}`}
        >
          <span className="tts-value--mobile">{row.homeShort}</span>
          <span className="tts-value--full">{row.homeFull}</span>
        </span>
      </div>

      {/* 중앙 라벨 */}
      <div className="tts-label">{row.label}</div>

      {/* 우: 원정팀 (수치 + 막대 좌측 정렬) */}
      <div className="tts-side--away">
        <span
          className={`tts-value ${awayWin ? "tts-value--win" : "tts-value--lose"}`}
        >
          <span className="tts-value--mobile">{row.awayShort}</span>
          <span className="tts-value--full">{row.awayFull}</span>
        </span>
        <div className="tts-bar-wrap tts-bar-wrap--away">
          <div className="tts-bar" style={{ width: `${awayPct}%` }} />
        </div>
      </div>
    </div>
  );
}
