"use client";

// 2026-04-22: Phase 2 GameResult v2 — 팀 비교 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L251~L266
//
// 2026-05-02 v6 (NBA.com 정합 — 사용자 요청):
//  - PTS 행 추가 (총 득점, 맨 위)
//  - 야투/3점/자유투 → FG%/3P%/FT% 분리 (확률만)
//  - 막대 두께 24/28/32px (NBA 스타일)
//  - 수치 폰트 14/18/22px (큰 폰트)
//  - 모바일/PC 분기 (모바일 단순 / PC 풀 데이터)

import type { MatchDataV2, PlayerRowV2 } from "./game-result";
import "./tab-team-stats.css";

export function TabTeamStats({ match }: { match: MatchDataV2 }) {
  const homeStats = aggregateTeam(match.home_players);
  const awayStats = aggregateTeam(match.away_players);
  const homePts = match.home_score;
  const awayPts = match.away_score;

  const statRows: StatRow[] = [
    // 득점 (NBA 정합 — 맨 위)
    {
      label: "득점",
      homeShort: String(homePts), awayShort: String(awayPts),
      homeFull: String(homePts), awayFull: String(awayPts),
      homeNum: homePts, awayNum: awayPts,
    },
    {
      label: "리바운드",
      homeShort: String(homeStats.reb), awayShort: String(awayStats.reb),
      homeFull: String(homeStats.reb), awayFull: String(awayStats.reb),
      homeNum: homeStats.reb, awayNum: awayStats.reb,
    },
    {
      label: "오펜스 리바운드",
      homeShort: String(homeStats.oreb), awayShort: String(awayStats.oreb),
      homeFull: String(homeStats.oreb), awayFull: String(awayStats.oreb),
      homeNum: homeStats.oreb, awayNum: awayStats.oreb,
    },
    {
      label: "디펜스 리바운드",
      homeShort: String(homeStats.dreb), awayShort: String(awayStats.dreb),
      homeFull: String(homeStats.dreb), awayFull: String(awayStats.dreb),
      homeNum: homeStats.dreb, awayNum: awayStats.dreb,
    },
    { label: "어시스트", homeShort: String(homeStats.ast), awayShort: String(awayStats.ast), homeFull: String(homeStats.ast), awayFull: String(awayStats.ast), homeNum: homeStats.ast, awayNum: awayStats.ast },
    { label: "스틸", homeShort: String(homeStats.stl), awayShort: String(awayStats.stl), homeFull: String(homeStats.stl), awayFull: String(awayStats.stl), homeNum: homeStats.stl, awayNum: awayStats.stl },
    { label: "블록", homeShort: String(homeStats.blk), awayShort: String(awayStats.blk), homeFull: String(homeStats.blk), awayFull: String(awayStats.blk), homeNum: homeStats.blk, awayNum: awayStats.blk },
    { label: "턴오버", homeShort: String(homeStats.to), awayShort: String(awayStats.to), homeFull: String(homeStats.to), awayFull: String(awayStats.to), homeNum: homeStats.to, awayNum: awayStats.to },
    { label: "파울", homeShort: String(homeStats.fouls), awayShort: String(awayStats.fouls), homeFull: String(homeStats.fouls), awayFull: String(awayStats.fouls), homeNum: homeStats.fouls, awayNum: awayStats.fouls },
    // 슈팅 확률 (NBA 정합 — 분리 행)
    {
      label: "FG%",
      homeShort: `${pct(homeStats.fgm, homeStats.fga)}%`,
      awayShort: `${pct(awayStats.fgm, awayStats.fga)}%`,
      homeFull: `${pct(homeStats.fgm, homeStats.fga)}% (${homeStats.fgm}/${homeStats.fga})`,
      awayFull: `${pct(awayStats.fgm, awayStats.fga)}% (${awayStats.fgm}/${awayStats.fga})`,
      homeNum: pct(homeStats.fgm, homeStats.fga),
      awayNum: pct(awayStats.fgm, awayStats.fga),
    },
    {
      label: "3P%",
      homeShort: `${pct(homeStats.tpm, homeStats.tpa)}%`,
      awayShort: `${pct(awayStats.tpm, awayStats.tpa)}%`,
      homeFull: `${pct(homeStats.tpm, homeStats.tpa)}% (${homeStats.tpm}/${homeStats.tpa})`,
      awayFull: `${pct(awayStats.tpm, awayStats.tpa)}% (${awayStats.tpm}/${awayStats.tpa})`,
      homeNum: pct(homeStats.tpm, homeStats.tpa),
      awayNum: pct(awayStats.tpm, awayStats.tpa),
    },
    {
      label: "FT%",
      homeShort: `${pct(homeStats.ftm, homeStats.fta)}%`,
      awayShort: `${pct(awayStats.ftm, awayStats.fta)}%`,
      homeFull: `${pct(homeStats.ftm, homeStats.fta)}% (${homeStats.ftm}/${homeStats.fta})`,
      awayFull: `${pct(awayStats.ftm, awayStats.fta)}% (${awayStats.ftm}/${awayStats.fta})`,
      homeNum: pct(homeStats.ftm, homeStats.fta),
      awayNum: pct(awayStats.ftm, awayStats.fta),
    },
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
  homeShort: string;
  awayShort: string;
  homeFull: string;
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

// 좌/우 비교 바 행 — NBA.com 스타일
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
        <span className={`tts-value ${homeWin ? "tts-value--win" : "tts-value--lose"}`}>
          <span className="tts-value--mobile">{row.homeShort}</span>
          <span className="tts-value--full">{row.homeFull}</span>
        </span>
      </div>

      {/* 중앙 라벨 */}
      <div className="tts-label">{row.label}</div>

      {/* 우: 원정팀 (수치 + 막대 좌측 정렬) */}
      <div className="tts-side--away">
        <span className={`tts-value ${awayWin ? "tts-value--win" : "tts-value--lose"}`}>
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
