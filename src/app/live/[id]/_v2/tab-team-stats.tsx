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
    // 득점 (NBA 정합 — 맨 위) — count: 합 정규화 (양팀 합 대비 비율)
    {
      label: "득점",
      homeShort: String(homePts), awayShort: String(awayPts),
      homeFull: String(homePts), awayFull: String(awayPts),
      homeNum: homePts, awayNum: awayPts,
      kind: "count",
    },
    {
      label: "리바운드",
      homeShort: String(homeStats.reb), awayShort: String(awayStats.reb),
      homeFull: String(homeStats.reb), awayFull: String(awayStats.reb),
      homeNum: homeStats.reb, awayNum: awayStats.reb,
      kind: "count",
    },
    {
      // 2026-05-02: 줄바꿈 위치 명시 — '오펜스' 윗줄 / '리바운드' 아랫줄 (사용자 요청)
      label: "오펜스\n리바운드",
      homeShort: String(homeStats.oreb), awayShort: String(awayStats.oreb),
      homeFull: String(homeStats.oreb), awayFull: String(awayStats.oreb),
      homeNum: homeStats.oreb, awayNum: awayStats.oreb,
      kind: "count",
    },
    {
      label: "디펜스\n리바운드",
      homeShort: String(homeStats.dreb), awayShort: String(awayStats.dreb),
      homeFull: String(homeStats.dreb), awayFull: String(awayStats.dreb),
      homeNum: homeStats.dreb, awayNum: awayStats.dreb,
      kind: "count",
    },
    { label: "어시스트", homeShort: String(homeStats.ast), awayShort: String(awayStats.ast), homeFull: String(homeStats.ast), awayFull: String(awayStats.ast), homeNum: homeStats.ast, awayNum: awayStats.ast, kind: "count" },
    { label: "스틸", homeShort: String(homeStats.stl), awayShort: String(awayStats.stl), homeFull: String(homeStats.stl), awayFull: String(awayStats.stl), homeNum: homeStats.stl, awayNum: awayStats.stl, kind: "count" },
    { label: "블록", homeShort: String(homeStats.blk), awayShort: String(awayStats.blk), homeFull: String(homeStats.blk), awayFull: String(awayStats.blk), homeNum: homeStats.blk, awayNum: awayStats.blk, kind: "count" },
    { label: "턴오버", homeShort: String(homeStats.to), awayShort: String(awayStats.to), homeFull: String(homeStats.to), awayFull: String(awayStats.to), homeNum: homeStats.to, awayNum: awayStats.to, kind: "count" },
    { label: "파울", homeShort: String(homeStats.fouls), awayShort: String(awayStats.fouls), homeFull: String(homeStats.fouls), awayFull: String(awayStats.fouls), homeNum: homeStats.fouls, awayNum: awayStats.fouls, kind: "count" },
    // 슈팅 확률 (NBA 정합 — 분리 행) — percent: 절대 0~100 스케일 (50% = 절반 막대)
    {
      label: "FG%",
      homeShort: `${pct(homeStats.fgm, homeStats.fga)}%`,
      awayShort: `${pct(awayStats.fgm, awayStats.fga)}%`,
      homeFull: `${pct(homeStats.fgm, homeStats.fga)}% (${homeStats.fgm}/${homeStats.fga})`,
      awayFull: `${pct(awayStats.fgm, awayStats.fga)}% (${awayStats.fgm}/${awayStats.fga})`,
      homeNum: pct(homeStats.fgm, homeStats.fga),
      awayNum: pct(awayStats.fgm, awayStats.fga),
      kind: "percent",
    },
    {
      label: "3P%",
      homeShort: `${pct(homeStats.tpm, homeStats.tpa)}%`,
      awayShort: `${pct(awayStats.tpm, awayStats.tpa)}%`,
      homeFull: `${pct(homeStats.tpm, homeStats.tpa)}% (${homeStats.tpm}/${homeStats.tpa})`,
      awayFull: `${pct(awayStats.tpm, awayStats.tpa)}% (${awayStats.tpm}/${awayStats.tpa})`,
      homeNum: pct(homeStats.tpm, homeStats.tpa),
      awayNum: pct(awayStats.tpm, awayStats.tpa),
      kind: "percent",
    },
    {
      label: "FT%",
      homeShort: `${pct(homeStats.ftm, homeStats.fta)}%`,
      awayShort: `${pct(awayStats.ftm, awayStats.fta)}%`,
      homeFull: `${pct(homeStats.ftm, homeStats.fta)}% (${homeStats.ftm}/${homeStats.fta})`,
      awayFull: `${pct(awayStats.ftm, awayStats.fta)}% (${awayStats.ftm}/${awayStats.fta})`,
      homeNum: pct(homeStats.ftm, homeStats.fta),
      awayNum: pct(awayStats.ftm, awayStats.fta),
      kind: "percent",
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

// 2026-05-04 옵션 C: count(합 정규화) vs percent(절대 0~100 스케일) 분기
//  - count: 득점/리바/AST/STL/BLK/TO/PF — 양팀 합 대비 비율로 시각화
//  - percent: FG%/3P%/FT% — 50% 가 절반 막대로 보이도록 절대 스케일
type StatKind = "count" | "percent";

interface StatRow {
  label: string;
  homeShort: string;
  awayShort: string;
  homeFull: string;
  awayFull: string;
  homeNum: number;
  awayNum: number;
  kind: StatKind;
}

// 막대 정규화 — 옵션 C 분기 처리
//  - percent: home/away 가 이미 0~100 비율 → 그대로 사용 (50% = 절반)
//  - count: 합 정규화 (home/(home+away) * 100). 합 0 이면 양쪽 0 + visualWeak
//  - count + 합 ≤ 2 (블록 1 vs 0 같은 극단값) → visualWeak 플래그로 시각 약화 (opacity 0.4)
function normalizeBar(
  home: number,
  away: number,
  kind: StatKind,
): { homePct: number; awayPct: number; visualWeak: boolean } {
  if (kind === "percent") {
    // % 항목: 0~100 절대 스케일 (안전 clamp)
    return {
      homePct: Math.max(0, Math.min(100, home)),
      awayPct: Math.max(0, Math.min(100, away)),
      visualWeak: false,
    };
  }
  // count: 합 정규화
  const total = home + away;
  if (total === 0) {
    return { homePct: 0, awayPct: 0, visualWeak: true };
  }
  // 합 ≤ 2 = 통계적 의미 약함 (블록 1 vs 0, 스틸 0 vs 1 등) → 시각 약화
  const visualWeak = total <= 2;
  return {
    homePct: (home / total) * 100,
    awayPct: (away / total) * 100,
    visualWeak,
  };
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
  // 턴오버 / 파울 — low-is-better (작을수록 좋음)
  const lowerIsBetter = row.label === "턴오버" || row.label === "파울";
  const homeWin = lowerIsBetter
    ? row.homeNum <= row.awayNum
    : row.homeNum >= row.awayNum;
  const awayWin = lowerIsBetter
    ? row.awayNum <= row.homeNum
    : row.awayNum >= row.homeNum;

  // 옵션 C 정규화 분기 (count: 합 정규화 / percent: 절대 0~100 / 합≤2: weak)
  const { homePct, awayPct, visualWeak } = normalizeBar(row.homeNum, row.awayNum, row.kind);

  // weak 모디파이어 — count 항목 합≤2 또는 0/0 시 시각 약화 (opacity 0.4)
  const homeBarClass = `tts-bar tts-bar--home${visualWeak ? " tts-bar--weak" : ""}`;
  const awayBarClass = `tts-bar tts-bar--away${visualWeak ? " tts-bar--weak" : ""}`;

  return (
    <div className="tts-row">
      {/* 좌: 홈팀 (막대 우측 정렬 + 수치) */}
      <div className="tts-side--home">
        <div className="tts-bar-wrap tts-bar-wrap--home">
          <div className={homeBarClass} style={{ width: `${homePct}%` }} />
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
          <div className={awayBarClass} style={{ width: `${awayPct}%` }} />
        </div>
      </div>
    </div>
  );
}
