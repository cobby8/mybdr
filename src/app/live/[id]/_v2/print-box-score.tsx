"use client";

// 2026-05-02: GameResult v2 — 프린트 전용 박스스코어 영역
// 이유: 사용자 요청 — 옛 page.tsx 의 프린트 기능 v2 페이지에 복원.
// 단순화 옵션 (PM 추천): 풀 다이얼로그 X, 누적 박스스코어만 (쿼터별 필터 X).
//
// 동작 원리:
//  - globals.css 의 [data-live-root][data-printing="true"] 룰이
//    #box-score-print-area 외 모든 형제 노드를 display: none 처리.
//  - @media print 가 #box-score-print-area 의 표 스타일을 검정 잉크로 강제.
//  - .print-team-page 가 팀별 1페이지 분리 (page-break-after: always).
//
// 컬럼 (옛 PrintBoxScoreTable 와 동일 19컬럼):
//  # / 이름 / MIN / PTS / FG / FG% / 3P / 3P% / FT / FT% / OR / DR / REB / AST / STL / BLK / TO / PF / +/-

import type { MatchDataV2, PlayerRowV2 } from "./game-result";

// 슈팅 확률 — 시도 0 이면 "-" (NaN 방지)
const pct = (made: number, attempted: number): string =>
  attempted > 0 ? `${Math.round((made / attempted) * 100)}%` : "-";

// 초 → "MM:SS"
function formatMin(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function PrintBoxScoreArea({ match }: { match: MatchDataV2 }) {
  // 화면용 영역 — globals.css 룰로 평소엔 숨김(hidden), data-printing="true" 시에만 표시.
  // 옛 페이지 동작 그대로 카피 (id 변경 X).
  return (
    <div id="box-score-print-area" className="hidden print:block">
      <PrintTeamTable
        teamName={match.home_team.name}
        opponentName={match.away_team.name}
        score={match.home_score}
        opponentScore={match.away_score}
        players={match.home_players}
        tournamentName={match.tournament_name}
        roundName={match.round_name}
        isHome={true}
        quarterScores={match.quarter_scores}
      />
      <PrintTeamTable
        teamName={match.away_team.name}
        opponentName={match.home_team.name}
        score={match.away_score}
        opponentScore={match.home_score}
        players={match.away_players}
        tournamentName={match.tournament_name}
        roundName={match.round_name}
        isHome={false}
        quarterScores={match.quarter_scores}
      />
    </div>
  );
}

function PrintTeamTable({
  teamName,
  opponentName,
  score,
  opponentScore,
  players,
  tournamentName,
  roundName,
  isHome,
  quarterScores,
}: {
  teamName: string;
  opponentName: string;
  score: number;
  opponentScore: number;
  players: PlayerRowV2[];
  tournamentName: string;
  roundName: string | null;
  isHome: boolean;
  quarterScores: MatchDataV2["quarter_scores"];
}) {
  if (!players || players.length === 0) return null;

  // 활성/DNP 분리 + 스타팅 우선 백넘버 오름차순 정렬 (옛 페이지와 동일)
  const sortByStarterJersey = (a: PlayerRowV2, b: PlayerRowV2) => {
    const aS = a.is_starter ? 1 : 0;
    const bS = b.is_starter ? 1 : 0;
    if (aS !== bS) return bS - aS;
    const aJ = a.jersey_number ?? 999;
    const bJ = b.jersey_number ?? 999;
    return aJ - bJ;
  };
  const activePlayers = players.filter((p) => !p.dnp);
  const dnpPlayers = players.filter((p) => p.dnp);
  const sorted = [...activePlayers].sort(sortByStarterJersey);
  dnpPlayers.sort(sortByStarterJersey);

  // TOTAL 합산 (활성 선수만)
  const total = activePlayers.reduce(
    (acc, p) => ({
      min_seconds: acc.min_seconds + (p.min_seconds ?? p.min * 60),
      pts: acc.pts + p.pts,
      fgm: acc.fgm + p.fgm,
      fga: acc.fga + p.fga,
      tpm: acc.tpm + p.tpm,
      tpa: acc.tpa + p.tpa,
      ftm: acc.ftm + p.ftm,
      fta: acc.fta + p.fta,
      oreb: acc.oreb + p.oreb,
      dreb: acc.dreb + p.dreb,
      reb: acc.reb + p.reb,
      ast: acc.ast + p.ast,
      stl: acc.stl + p.stl,
      blk: acc.blk + p.blk,
      to: acc.to + p.to,
      fouls: acc.fouls + p.fouls,
    }),
    {
      min_seconds: 0,
      pts: 0,
      fgm: 0,
      fga: 0,
      tpm: 0,
      tpa: 0,
      ftm: 0,
      fta: 0,
      oreb: 0,
      dreb: 0,
      reb: 0,
      ast: 0,
      stl: 0,
      blk: 0,
      to: 0,
      fouls: 0,
    },
  );

  // 쿼터별 점수 — quarter_scores 가 있으면 표시 (Q1~Q4 + OT)
  // 옛 페이지의 quarters 배열 형태로 재가공 (label / home / away)
  const quarters: Array<{ label: string; home: number; away: number }> = [];
  if (quarterScores) {
    const qs = quarterScores;
    quarters.push({ label: "Q1", home: qs.home.q1, away: qs.away.q1 });
    quarters.push({ label: "Q2", home: qs.home.q2, away: qs.away.q2 });
    quarters.push({ label: "Q3", home: qs.home.q3, away: qs.away.q3 });
    quarters.push({ label: "Q4", home: qs.home.q4, away: qs.away.q4 });
    qs.home.ot.forEach((h, i) => {
      quarters.push({ label: `OT${i + 1}`, home: h, away: qs.away.ot[i] ?? 0 });
    });
  }

  return (
    <div className="print-team-page">
      {/* 페이지 상단 헤더 — 팀명 + 상대 + 토너먼트/라운드명. data-print-show 로 인쇄 시 표시 */}
      <div data-print-show className="hidden">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: "6px",
          }}
        >
          <div>
            <span style={{ fontSize: "16px", fontWeight: 800 }}>{teamName}</span>
            <span style={{ fontSize: "12px", marginLeft: "8px", color: "#666" }}>
              vs {opponentName}
            </span>
            {/* 기간 라벨 — 누적 기록 (단순 모드) — 빨강 강조 */}
            <span
              style={{
                fontSize: "14px",
                marginLeft: "12px",
                fontWeight: 700,
                color: "#E31B23",
              }}
            >
              — 누적 기록
            </span>
          </div>
          <div style={{ textAlign: "right" }}>
            <span style={{ fontSize: "11px", color: "#666" }}>{tournamentName}</span>
            {roundName && (
              <span style={{ fontSize: "10px", color: "#999", marginLeft: "6px" }}>
                {roundName}
              </span>
            )}
          </div>
        </div>
        {/* 쿼터별 점수 요약 — 데이터 있으면 표시 */}
        {quarters.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              fontSize: "9px",
              color: "#666",
              borderBottom: "1px solid #ccc",
              paddingBottom: "3px",
              marginBottom: "2px",
            }}
          >
            <span style={{ fontWeight: 700, color: "#000", fontSize: "12px" }}>
              {score} : {opponentScore}
            </span>
            {quarters.map((q) => {
              const myScore = isHome ? q.home : q.away;
              const oppScore = isHome ? q.away : q.home;
              return (
                <span key={q.label}>
                  {q.label} {myScore}-{oppScore}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* 테이블 본체 — globals.css 의 @media print 룰이 검정 잉크로 강제 변환 */}
      <div className="print-team-table-wrap">
        <table className="w-full">
          <thead>
            <tr>
              <th>#</th>
              <th style={{ textAlign: "left" }}>이름</th>
              <th>MIN</th>
              <th>PTS</th>
              <th>FG</th>
              <th>FG%</th>
              <th>3P</th>
              <th>3P%</th>
              <th>FT</th>
              <th>FT%</th>
              <th>OR</th>
              <th>DR</th>
              <th>REB</th>
              <th>AST</th>
              <th>STL</th>
              <th>BLK</th>
              <th>TO</th>
              <th>PF</th>
              <th>+/-</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.id}>
                <td>{p.jersey_number ?? "-"}</td>
                <td style={{ textAlign: "left" }}>{p.name}</td>
                <td>{formatMin(p.min_seconds ?? p.min * 60)}</td>
                <td style={{ fontWeight: 700 }}>{p.pts}</td>
                <td>
                  {p.fgm}/{p.fga}
                </td>
                <td>{pct(p.fgm, p.fga)}</td>
                <td>
                  {p.tpm}/{p.tpa}
                </td>
                <td>{pct(p.tpm, p.tpa)}</td>
                <td>
                  {p.ftm}/{p.fta}
                </td>
                <td>{pct(p.ftm, p.fta)}</td>
                <td>{p.oreb}</td>
                <td>{p.dreb}</td>
                <td>{p.reb}</td>
                <td>{p.ast}</td>
                <td>{p.stl}</td>
                <td>{p.blk}</td>
                <td>{p.to}</td>
                <td>{p.fouls}</td>
                <td>
                  {p.plus_minus != null
                    ? p.plus_minus > 0
                      ? `+${p.plus_minus}`
                      : p.plus_minus
                    : "-"}
                </td>
              </tr>
            ))}
            {/* DNP 행 — MIN에 "DNP", 나머지 "-" */}
            {dnpPlayers.map((p) => (
              <tr key={`dnp-${p.id}`}>
                <td>{p.jersey_number ?? "-"}</td>
                <td style={{ textAlign: "left" }}>{p.name}</td>
                <td style={{ fontWeight: 600 }}>DNP</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
              </tr>
            ))}
            {/* TOTAL 행 — print-total-row 클래스로 상단 굵은 선 + bold */}
            <tr className="print-total-row">
              <td></td>
              <td style={{ textAlign: "left" }}>TOTAL</td>
              <td>{formatMin(total.min_seconds)}</td>
              <td>{total.pts}</td>
              <td>
                {total.fgm}/{total.fga}
              </td>
              <td>{pct(total.fgm, total.fga)}</td>
              <td>
                {total.tpm}/{total.tpa}
              </td>
              <td>{pct(total.tpm, total.tpa)}</td>
              <td>
                {total.ftm}/{total.fta}
              </td>
              <td>{pct(total.ftm, total.fta)}</td>
              <td>{total.oreb}</td>
              <td>{total.dreb}</td>
              <td>{total.reb}</td>
              <td>{total.ast}</td>
              <td>{total.stl}</td>
              <td>{total.blk}</td>
              <td>{total.to}</td>
              <td>{total.fouls}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
