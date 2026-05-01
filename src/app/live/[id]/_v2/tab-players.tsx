"use client";

// 2026-04-22: Phase 2 GameResult v2 — 개인 기록 탭
// 시안: Dev/design/BDR v2/screens/GameResult.jsx L268~L287
// 팀별 박스스코어 테이블
//
// 2026-05-02: 슈팅 확률(FG%/3P%/FT%) 컬럼 추가
// 이유: 사용자 요청 — 박스스코어에서 효율 지표가 핵심이라 누락된 % 컬럼 복원.
// 변경: 14 컬럼 → 17 컬럼.
//   기존: # / 선수 / MIN / PTS / REB / AST / STL / BLK / TOV / PF / FG / 3P / FT / +/-
//   신규: # / 선수 / MIN / PTS / REB / AST / STL / BLK / TOV / PF / FG / FG% / 3P / 3P% / FT / FT% / +/-
// 0/0 → "-" 로 표시 (DivByZero 방지). 그 외 Math.round((made/att)*100)% 표기.
// minWidth 860 → 1020 으로 상향 (가로 스크롤 wrapper 는 ScrollableTable 이 제공).

import { ScrollableTable } from "@/components/ui/scrollable-table";
import type { MatchDataV2, PlayerRowV2 } from "./game-result";

// 그리드 컬럼 정의 — 17 컬럼 (한 곳에서 관리해 헤더/행 동기화)
// # / 선수 / MIN / PTS / REB / AST / STL / BLK / TOV / PF / FG / FG% / 3P / 3P% / FT / FT% / +/-
const GRID_COLS =
  "36px 1fr 42px 50px 40px 40px 40px 40px 40px 40px 56px 44px 56px 44px 56px 44px 50px";
const GRID_MIN_WIDTH = 1020;

// 슈팅 확률 헬퍼 — 시도 0 이면 "-" 반환 (NaN 방지)
function pct(made: number, attempted: number): string {
  if (!attempted || attempted <= 0) return "-";
  return `${Math.round((made / attempted) * 100)}%`;
}

export function TabPlayers({ match }: { match: MatchDataV2 }) {
  const mvpId = match.mvp_player?.id ?? null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <TeamTable
        team={match.home_team}
        score={match.home_score}
        players={match.home_players}
        mvpId={mvpId}
      />
      <TeamTable
        team={match.away_team}
        score={match.away_score}
        players={match.away_players}
        mvpId={mvpId}
      />
    </div>
  );
}

function TeamTable({
  team,
  score,
  players,
  mvpId,
}: {
  team: MatchDataV2["home_team"];
  score: number;
  players: PlayerRowV2[];
  mvpId: number | null;
}) {
  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        borderRadius: 4,
      }}
    >
      {/* 팀 헤더 — 이름 + 스코어 */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: `color-mix(in oklab, ${team.color} 10%, transparent)`,
        }}
      >
        <div
          style={{
            width: 6,
            height: 28,
            background: team.color,
            borderRadius: 2,
          }}
        />
        <div style={{ fontWeight: 800, fontSize: 15, color: "var(--ink)" }}>{team.name}</div>
        <div
          style={{
            marginLeft: "auto",
            fontFamily: "var(--ff-display)",
            fontWeight: 900,
            fontSize: 22,
            color: team.color,
          }}
        >
          {score}
        </div>
      </div>

      {/* 테이블 — ScrollableTable 로 가로 스크롤 + 페이드 마스크.
          17 컬럼이라 모바일은 가로 스크롤 필수 (minWidth 1020). */}
      <ScrollableTable>
        {/* 헤더 행 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: GRID_COLS,
            gap: 6,
            padding: "8px 10px",
            background: "var(--bg-alt)",
            fontSize: 10,
            fontWeight: 700,
            color: "var(--ink-dim)",
            letterSpacing: ".06em",
            minWidth: GRID_MIN_WIDTH,
          }}
        >
          <span>#</span>
          <span>선수</span>
          <span>MIN</span>
          <span style={{ color: team.color, fontWeight: 800 }}>PTS</span>
          <span>REB</span>
          <span>AST</span>
          <span>STL</span>
          <span>BLK</span>
          <span>TOV</span>
          <span>PF</span>
          <span>FG</span>
          <span>FG%</span>
          <span>3P</span>
          <span>3P%</span>
          <span>FT</span>
          <span>FT%</span>
          <span>+/-</span>
        </div>

        {players.map((p, i) => (
          <PlayerRow
            key={p.id}
            player={p}
            teamColor={team.color}
            isLast={i === players.length - 1}
            isMvp={mvpId !== null && p.id === mvpId}
          />
        ))}

        {players.length === 0 && (
          <div
            style={{
              padding: "20px 16px",
              textAlign: "center",
              fontSize: 12,
              color: "var(--ink-dim)",
            }}
          >
            기록된 선수가 없습니다.
          </div>
        )}
      </ScrollableTable>
    </div>
  );
}

function PlayerRow({
  player,
  teamColor,
  isLast,
  isMvp,
}: {
  player: PlayerRowV2;
  teamColor: string;
  isLast: boolean;
  isMvp: boolean;
}) {
  // DNP 는 모든 스탯 자리에 "-" 표시 (NBA 컨벤션)
  const dnp = player.dnp === true;
  // MIN 포맷 — 초 단위 → "MM:SS"
  const minStr = dnp ? "DNP" : formatMin(player.min_seconds ?? (player.min * 60));

  // +/- 부호
  const pm = player.plus_minus ?? 0;
  const pmStr = pm > 0 ? `+${pm}` : String(pm);

  // 슈팅 확률 미리 계산 (DNP 가 아닐 때만 의미 있음)
  const fgPct = pct(player.fgm, player.fga);
  const tpPct = pct(player.tpm, player.tpa);
  const ftPct = pct(player.ftm, player.fta);

  const cellBase = {
    fontFamily: "var(--ff-mono)",
    fontSize: 11,
    color: "var(--ink)",
  } as const;

  // % 셀은 약간 더 톤다운 (보조 지표) — ink-soft 사용
  const pctCell = {
    fontFamily: "var(--ff-mono)",
    fontSize: 10,
    color: "var(--ink-soft)",
  } as const;

  if (dnp) {
    // DNP 행 — 배경 어둡게, 17 컬럼 모두 "-" (선수/MIN 제외)
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: GRID_COLS,
          gap: 6,
          padding: "10px",
          fontSize: 11,
          borderBottom: isLast ? 0 : "1px solid var(--border)",
          alignItems: "center",
          minWidth: GRID_MIN_WIDTH,
          background: "var(--bg-alt)",
          opacity: 0.6,
        }}
      >
        <span style={{ color: "var(--ink-dim)", fontWeight: 700 }}>
          {player.jersey_number ?? "-"}
        </span>
        <span
          style={{
            fontFamily: "var(--ff-sans)",
            fontWeight: 500,
            color: "var(--ink-soft)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {player.name}
        </span>
        <span style={cellBase}>DNP</span>
        {/* 나머지 15 컬럼은 모두 "-" — PTS/REB/AST/STL/BLK/TOV/PF/FG/FG%/3P/3P%/FT/FT%/+/- */}
        {Array.from({ length: 15 }).map((_, idx) => (
          <span key={idx} style={cellBase}>
            -
          </span>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: GRID_COLS,
        gap: 6,
        padding: "10px",
        fontSize: 11,
        borderBottom: isLast ? 0 : "1px solid var(--border)",
        alignItems: "center",
        minWidth: GRID_MIN_WIDTH,
      }}
    >
      <span style={{ color: "var(--ink-dim)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>
        {player.jersey_number ?? "-"}
      </span>
      <span
        style={{
          fontFamily: "var(--ff-sans)",
          fontWeight: 700,
          color: "var(--ink)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isMvp && <span style={{ color: "var(--accent)", marginRight: 4 }}>★</span>}
        {player.name}
      </span>
      <span style={cellBase}>{minStr}</span>
      <span
        style={{
          color: teamColor,
          fontWeight: 800,
          fontSize: 12,
          fontFamily: "var(--ff-mono)",
        }}
      >
        {player.pts}
      </span>
      <span style={cellBase}>{player.reb}</span>
      <span style={cellBase}>{player.ast}</span>
      <span style={cellBase}>{player.stl}</span>
      <span style={cellBase}>{player.blk}</span>
      <span
        style={{
          ...cellBase,
          color: player.to > 2 ? "var(--err, var(--error, #ef4444))" : "var(--ink)",
        }}
      >
        {player.to}
      </span>
      <span style={cellBase}>{player.fouls}</span>
      <span style={cellBase}>
        {player.fgm}/{player.fga}
      </span>
      {/* 슈팅 확률 3종 — 보조 지표라 ink-soft 톤다운 */}
      <span style={pctCell}>{fgPct}</span>
      <span style={cellBase}>
        {player.tpm}/{player.tpa}
      </span>
      <span style={pctCell}>{tpPct}</span>
      <span style={cellBase}>
        {player.ftm}/{player.fta}
      </span>
      <span style={pctCell}>{ftPct}</span>
      <span
        style={{
          ...cellBase,
          color: pm > 0 ? "var(--ok, #10B981)" : pm < 0 ? "var(--err, #ef4444)" : "var(--ink)",
          fontWeight: 700,
        }}
      >
        {pmStr}
      </span>
    </div>
  );
}

// 초 → "MM:SS"
function formatMin(seconds: number): string {
  if (!seconds || seconds <= 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
