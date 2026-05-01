"use client";

// 2026-04-22: Phase 2 GameResult v2 — 팀 비교 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L251~L266
// 팀별 스탯을 좌우 비교 그래프 행으로 표시
// D5 원칙: 페인트득점/패스트브레이크/벤치득점 생략 — PBP 에 is_fastbreak 필드는 있지만 신뢰도 낮음.
//         시안 12항목 중 9항목(야투/3점/자유투/리바/어시/스틸/블록/턴오버/파울) 유지.

import type { MatchDataV2, PlayerRowV2 } from "./game-result";

export function TabTeamStats({ match }: { match: MatchDataV2 }) {
  // 팀별 합계 집계
  const homeStats = aggregateTeam(match.home_players);
  const awayStats = aggregateTeam(match.away_players);

  // 표시할 스탯 라인 — 시안 L36~L49 중 DB 산출 가능한 9항목
  const statRows: StatRow[] = [
    {
      label: "야투",
      homeValue: `${homeStats.fgm}/${homeStats.fga} (${pct(homeStats.fgm, homeStats.fga)}%)`,
      awayValue: `${awayStats.fgm}/${awayStats.fga} (${pct(awayStats.fgm, awayStats.fga)}%)`,
      homeNum: homeStats.fgm,
      awayNum: awayStats.fgm,
    },
    {
      label: "3점",
      homeValue: `${homeStats.tpm}/${homeStats.tpa} (${pct(homeStats.tpm, homeStats.tpa)}%)`,
      awayValue: `${awayStats.tpm}/${awayStats.tpa} (${pct(awayStats.tpm, awayStats.tpa)}%)`,
      homeNum: homeStats.tpm,
      awayNum: awayStats.tpm,
    },
    {
      label: "자유투",
      homeValue: `${homeStats.ftm}/${homeStats.fta} (${pct(homeStats.ftm, homeStats.fta)}%)`,
      awayValue: `${awayStats.ftm}/${awayStats.fta} (${pct(awayStats.ftm, awayStats.fta)}%)`,
      homeNum: homeStats.ftm,
      awayNum: awayStats.ftm,
    },
    {
      label: "리바운드",
      homeValue: `${homeStats.reb} (O ${homeStats.oreb} · D ${homeStats.dreb})`,
      awayValue: `${awayStats.reb} (O ${awayStats.oreb} · D ${awayStats.dreb})`,
      homeNum: homeStats.reb,
      awayNum: awayStats.reb,
    },
    { label: "어시스트", homeValue: String(homeStats.ast), awayValue: String(awayStats.ast), homeNum: homeStats.ast, awayNum: awayStats.ast },
    { label: "스틸", homeValue: String(homeStats.stl), awayValue: String(awayStats.stl), homeNum: homeStats.stl, awayNum: awayStats.stl },
    { label: "블록", homeValue: String(homeStats.blk), awayValue: String(awayStats.blk), homeNum: homeStats.blk, awayNum: awayStats.blk },
    { label: "턴오버", homeValue: String(homeStats.to), awayValue: String(awayStats.to), homeNum: homeStats.to, awayNum: awayStats.to },
    { label: "파울", homeValue: String(homeStats.fouls), awayValue: String(awayStats.fouls), homeNum: homeStats.fouls, awayNum: awayStats.fouls },
  ];

  return (
    <div className="card" style={{ padding: "20px 22px", borderRadius: 4 }}>
      {/* 상단 팀 vs 팀 헤더 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          gap: 16,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>{match.home_team.name}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            HOME
          </div>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "var(--ink-dim)",
            fontWeight: 800,
            letterSpacing: ".1em",
            textAlign: "center",
          }}
        >
          VS
        </div>
        <div style={{ textAlign: "left" }}>
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>{match.away_team.name}</div>
          <div
            style={{
              fontSize: 11,
              color: "var(--ink-dim)",
              fontFamily: "var(--ff-mono)",
            }}
          >
            AWAY
          </div>
        </div>
      </div>

      {statRows.map((row) => (
        <StatCompareRow
          key={row.label}
          row={row}
          homeColor={match.home_team.color}
          awayColor={match.away_team.color}
        />
      ))}
    </div>
  );
}

interface StatRow {
  label: string;
  homeValue: string;
  awayValue: string;
  homeNum: number;
  awayNum: number;
}

// 팀 합계 집계용 타입
interface TeamAgg {
  fgm: number;
  fga: number;
  tpm: number;
  tpa: number;
  ftm: number;
  fta: number;
  oreb: number;
  dreb: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  to: number;
  fouls: number;
}

function aggregateTeam(players: PlayerRowV2[]): TeamAgg {
  const agg: TeamAgg = {
    fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0,
    oreb: 0, dreb: 0, reb: 0,
    ast: 0, stl: 0, blk: 0, to: 0, fouls: 0,
  };
  for (const p of players) {
    agg.fgm += p.fgm;
    agg.fga += p.fga;
    agg.tpm += p.tpm;
    agg.tpa += p.tpa;
    agg.ftm += p.ftm;
    agg.fta += p.fta;
    agg.oreb += p.oreb;
    agg.dreb += p.dreb;
    agg.reb += p.reb;
    agg.ast += p.ast;
    agg.stl += p.stl;
    agg.blk += p.blk;
    agg.to += p.to;
    agg.fouls += p.fouls;
  }
  return agg;
}

function pct(made: number, attempt: number): number {
  if (attempt === 0) return 0;
  return Math.round((made / attempt) * 100);
}

// 좌/우 비교 바 행 — 시안 StatRow (L64~L85)
// 2026-05-02 v2 (사용자 재요청): 팀 컬러 무시하고 고정 색상으로 시인성 강화.
//  - winner 막대: var(--cafe-blue) (진한 파랑) + 수치 흰색
//  - loser 막대: var(--bg-elev) (연한 회색) + 수치 var(--ink) (진한 검정/흰색 토큰)
//  - opacity 제거 (loser 도 가독성 확보)
//  - 막대 높이 22 + 수치 overlay 유지
function StatCompareRow({ row }: { row: StatRow; homeColor: string; awayColor: string }) {
  const total = row.homeNum + row.awayNum || 1;
  const homeWin = row.homeNum >= row.awayNum;
  const awayWin = row.awayNum >= row.homeNum;
  const homePct = (row.homeNum / total) * 100;
  const awayPct = (row.awayNum / total) * 100;

  // 단일 고정 색상 — winner 강조, loser 가독성 모두 보장
  const winnerBg = "var(--cafe-blue)";
  const loserBg = "var(--bg-elev)";
  const winnerText = "#fff";
  const loserText = "var(--ink)";

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) 70px minmax(0, 1fr)",
        gap: 8,
        alignItems: "center",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* 좌: 홈팀 막대 (우측 끝에서 좌측으로 grow) */}
      <div
        style={{
          position: "relative",
          height: 22,
          background: "var(--bg-alt)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: `${homePct}%`,
            background: homeWin ? winnerBg : loserBg,
            transition: "width 0.3s ease",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            right: 8,
            transform: "translateY(-50%)",
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: homeWin ? 700 : 600,
            color: homeWin ? winnerText : loserText,
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {row.homeValue}
        </span>
      </div>

      {/* 중앙 라벨 */}
      <div
        style={{
          textAlign: "center",
          fontSize: 11,
          color: "var(--ink-soft)",
          fontWeight: 700,
        }}
      >
        {row.label}
      </div>

      {/* 우: 원정팀 막대 (좌측 끝에서 우측으로 grow) */}
      <div
        style={{
          position: "relative",
          height: 22,
          background: "var(--bg-alt)",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            height: "100%",
            width: `${awayPct}%`,
            background: awayWin ? winnerBg : loserBg,
            transition: "width 0.3s ease",
          }}
        />
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: 8,
            transform: "translateY(-50%)",
            fontFamily: "var(--ff-mono)",
            fontSize: 11,
            fontWeight: awayWin ? 700 : 600,
            color: awayWin ? winnerText : loserText,
            whiteSpace: "nowrap",
            zIndex: 1,
          }}
        >
          {row.awayValue}
        </span>
      </div>
    </div>
  );
}
