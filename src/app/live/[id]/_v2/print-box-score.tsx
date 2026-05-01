"use client";

// 2026-05-02: GameResult v2 — 프린트 전용 박스스코어 영역 (옛 page.tsx 풀 복원)
// 이전: 단순 누적 박스스코어 2개 (홈/원정) 만 출력
// 이후: 옛 PrintBoxScoreTable 그대로 — printOptions (PrintOptionsDialog 결과) 기반 (팀 × 기간) 조합 매핑.
//      누적 / Q1 / Q2 / Q3 / Q4 / OT 별 별개 페이지로 출력 (팀별 enabled 체크 시).
//
// 출처: src/app/live/[id]/page.tsx L1652-1862 (PrintBoxScoreTable) + L869-896 (printSections 매핑)
//
// 동작 원리:
//  - globals.css 의 [data-live-root][data-printing="true"] 룰이
//    #box-score-print-area 외 모든 형제 노드를 display: none 처리.
//  - @media print 가 #box-score-print-area 의 표 스타일을 검정 잉크로 강제.
//  - .print-team-page 가 팀 × 기간 1페이지 분리 (page-break-after: always).

import { useMemo } from "react";
import type { MatchDataV2, PlayerRowV2 } from "./game-result";
import type { PrintOptions } from "./print-options-dialog";

// 게임 클럭 포맷 — 초 → "M:SS" (옛 page.tsx L165-169)
function formatGameClock(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// 슈팅 확률 — 시도 0 이면 0
const pct = (made: number, attempted: number) =>
  attempted > 0 ? Math.round((made / attempted) * 100) : 0;

export function PrintBoxScoreArea({
  match,
  printOptions,
}: {
  match: MatchDataV2;
  printOptions: PrintOptions | null;
}) {
  // printOptions 기반 (팀 × 기간) 매핑 — 옛 page.tsx L559-574 의 printSections 로직 카피.
  // 순서: 홈(누적 → 1Q → ... → OT) → 원정(누적 → 1Q → ... → OT)
  const printSections = useMemo(() => {
    if (!printOptions) return [];
    const out: Array<{ team: "home" | "away"; filter: string; label: string }> = [];
    for (const side of ["home", "away"] as const) {
      const o = printOptions[side];
      if (!o.enabled) continue;
      if (o.total) out.push({ team: side, filter: "all", label: "누적 기록" });
      for (const q of ["1", "2", "3", "4", "5"]) {
        if (o.quarters[q]) {
          const label = q === "5" ? "OT" : `${q}쿼터`;
          out.push({ team: side, filter: q, label });
        }
      }
    }
    return out;
  }, [printOptions]);

  // 쿼터별 점수 — quarter_scores 가 있으면 quarters 배열로 재가공
  const quarters = useMemo(() => {
    const out: Array<{ label: string; home: number; away: number }> = [];
    const qs = match.quarter_scores;
    if (!qs) return out;
    out.push({ label: "Q1", home: qs.home.q1, away: qs.away.q1 });
    out.push({ label: "Q2", home: qs.home.q2, away: qs.away.q2 });
    out.push({ label: "Q3", home: qs.home.q3, away: qs.away.q3 });
    out.push({ label: "Q4", home: qs.home.q4, away: qs.away.q4 });
    qs.home.ot.forEach((h, i) => {
      out.push({ label: `OT${i + 1}`, home: h, away: qs.away.ot[i] ?? 0 });
    });
    return out;
  }, [match.quarter_scores]);

  // 화면용은 항상 hidden, isPrinting=true 시에만 globals.css 룰로 단독 표시.
  // printOptions=null 이면 빈 컨테이너 (다이얼로그가 아직 안 열림).
  return (
    <div id="box-score-print-area" className="hidden print:block">
      {printSections.map((sec, i) => {
        const isHome = sec.team === "home";
        const team = isHome ? match.home_team : match.away_team;
        const players = isHome ? match.home_players : match.away_players;
        const score = isHome ? match.home_score : match.away_score;
        const opponentName = isHome ? match.away_team.name : match.home_team.name;
        const opponentScore = isHome ? match.away_score : match.home_score;
        return (
          <PrintBoxScoreTable
            key={`${sec.team}-${sec.filter}-${i}`}
            teamName={team.name}
            color={team.color}
            players={players}
            opponentName={opponentName}
            score={score}
            opponentScore={opponentScore}
            quarters={quarters}
            tournamentName={match.tournament_name}
            roundName={match.round_name}
            isHome={isHome}
            filter={sec.filter}
            filterLabel={sec.label}
            hasQuarterEventDetail={match.has_quarter_event_detail}
          />
        );
      })}
    </div>
  );
}

/**
 * 옛 page.tsx L1652-1862 의 PrintBoxScoreTable — 풀 복원.
 * - 화면용 BoxScoreTable 과 달리 쿼터 필터 버튼 없음 (filter prop 으로 고정)
 * - 페이지 상단에 "팀명 vs 상대 — 누적 기록 / 1쿼터 등" 라벨 크게 표시 + 쿼터별 점수 요약
 * - filter !== "all" + hasQuarterEventDetail=false → MIN/+- 외 모든 스탯 "-"
 */
function PrintBoxScoreTable({
  teamName,
  color,
  players,
  opponentName,
  score,
  opponentScore,
  quarters,
  tournamentName,
  roundName,
  isHome,
  filter,
  filterLabel,
  hasQuarterEventDetail,
}: {
  teamName: string;
  color: string;
  players: PlayerRowV2[];
  opponentName: string;
  score: number;
  opponentScore: number;
  quarters: Array<{ label: string; home: number; away: number }>;
  tournamentName: string;
  roundName: string | null;
  isHome: boolean;
  filter: string; // "all" | "1"~"5"
  filterLabel: string; // "누적 기록" / "1쿼터" / "OT"
  hasQuarterEventDetail: boolean;
}) {
  if (!players || players.length === 0) return null;

  // 쿼터 필터 시 이벤트 기록 없으면 플레이스홀더
  const showPlaceholder = filter !== "all" && !hasQuarterEventDetail;

  // 화면용과 동일 applyQuarterFilter — 스탯만 치환, dnp 는 원본 유지
  const applyQuarterFilter = (p: PlayerRowV2): PlayerRowV2 => {
    if (filter === "all") return p;
    const qs = p.quarter_stats?.[filter];
    if (!qs) {
      return {
        ...p,
        min: 0,
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
        plus_minus: 0,
      };
    }
    return {
      ...p,
      min: qs.min,
      min_seconds: qs.min_seconds,
      pts: qs.pts,
      fgm: qs.fgm,
      fga: qs.fga,
      tpm: qs.tpm,
      tpa: qs.tpa,
      ftm: qs.ftm,
      fta: qs.fta,
      oreb: qs.oreb,
      dreb: qs.dreb,
      reb: qs.reb,
      ast: qs.ast,
      stl: qs.stl,
      blk: qs.blk,
      to: qs.to,
      fouls: qs.fouls,
      plus_minus: qs.plus_minus,
    };
  };

  // 활성/DNP 분리 + 스타팅 우선 백넘버 오름차순 정렬
  const activePlayers = players.filter((p) => !p.dnp).map(applyQuarterFilter);
  const dnpPlayers = players.filter((p) => p.dnp);
  const sortByStarterJersey = (a: PlayerRowV2, b: PlayerRowV2) => {
    const aS = a.is_starter ? 1 : 0;
    const bS = b.is_starter ? 1 : 0;
    if (aS !== bS) return bS - aS;
    const aJ = a.jersey_number ?? 999;
    const bJ = b.jersey_number ?? 999;
    return aJ - bJ;
  };
  const sorted = [...activePlayers].sort(sortByStarterJersey);
  dnpPlayers.sort(sortByStarterJersey);

  // TOTAL 합산 (활성 선수만)
  const total = activePlayers.reduce(
    (acc, p) => ({
      min: acc.min + p.min,
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
      min: 0,
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

  // color 변수 회피 (프린트 검정 잉크) — TS 미사용 경고 방지
  void color;

  return (
    <div className="print-team-page">
      {/* 페이지 상단 헤더 — 팀명 + 상대 + 기간 라벨(빨강 강조) + 토너먼트/라운드명 */}
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
            {/* 기간 라벨 — BDR primary 빨강 강조 */}
            <span
              style={{
                fontSize: "14px",
                marginLeft: "12px",
                fontWeight: 700,
                color: "#E31B23",
              }}
            >
              — {filterLabel}
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
        {/* 쿼터별 점수 요약 — 데이터 있을 때만 */}
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

      {/* 테이블 본체 — globals.css @media print 룰이 검정 잉크로 강제 변환 */}
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
                <td>{formatGameClock(p.min_seconds ?? p.min * 60)}</td>
                <td style={{ fontWeight: 700 }}>{showPlaceholder ? "-" : p.pts}</td>
                <td>{showPlaceholder ? "-" : `${p.fgm}/${p.fga}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.fgm, p.fga)}%`}</td>
                <td>{showPlaceholder ? "-" : `${p.tpm}/${p.tpa}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.tpm, p.tpa)}%`}</td>
                <td>{showPlaceholder ? "-" : `${p.ftm}/${p.fta}`}</td>
                <td>{showPlaceholder ? "-" : `${pct(p.ftm, p.fta)}%`}</td>
                <td>{showPlaceholder ? "-" : p.oreb}</td>
                <td>{showPlaceholder ? "-" : p.dreb}</td>
                <td>{showPlaceholder ? "-" : p.reb}</td>
                <td>{showPlaceholder ? "-" : p.ast}</td>
                <td>{showPlaceholder ? "-" : p.stl}</td>
                <td>{showPlaceholder ? "-" : p.blk}</td>
                <td>{showPlaceholder ? "-" : p.to}</td>
                <td>{showPlaceholder ? "-" : p.fouls}</td>
                <td>
                  {p.plus_minus != null
                    ? p.plus_minus > 0
                      ? `+${p.plus_minus}`
                      : p.plus_minus
                    : "-"}
                </td>
              </tr>
            ))}
            {/* DNP 행 — MIN 셀에 "DNP", 나머지 16개 "-" */}
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
              <td>{formatGameClock(total.min_seconds)}</td>
              <td>{showPlaceholder ? "-" : total.pts}</td>
              <td>{showPlaceholder ? "-" : `${total.fgm}/${total.fga}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.fgm, total.fga)}%`}</td>
              <td>{showPlaceholder ? "-" : `${total.tpm}/${total.tpa}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.tpm, total.tpa)}%`}</td>
              <td>{showPlaceholder ? "-" : `${total.ftm}/${total.fta}`}</td>
              <td>{showPlaceholder ? "-" : `${pct(total.ftm, total.fta)}%`}</td>
              <td>{showPlaceholder ? "-" : total.oreb}</td>
              <td>{showPlaceholder ? "-" : total.dreb}</td>
              <td>{showPlaceholder ? "-" : total.reb}</td>
              <td>{showPlaceholder ? "-" : total.ast}</td>
              <td>{showPlaceholder ? "-" : total.stl}</td>
              <td>{showPlaceholder ? "-" : total.blk}</td>
              <td>{showPlaceholder ? "-" : total.to}</td>
              <td>{showPlaceholder ? "-" : total.fouls}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
