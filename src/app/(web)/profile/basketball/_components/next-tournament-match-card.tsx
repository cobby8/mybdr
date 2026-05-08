/* ============================================================
 * NextTournamentMatchCard — 본인 출전 예정 다음 대회 매치 (영역 ⑧)
 *
 * 왜 (사용자 결정 Q4=N-1):
 *  - 본인 전용 가치 — 마이페이지 hub 의 "다음 경기" (game_applications) 와 다름
 *  - 출처: tournamentMatch (status='scheduled' + scheduledAt > now + ttp.user_id = 본인)
 *  - 가장 가까운 미래 1건만 노출 (page.tsx orderBy scheduledAt asc + take 1)
 *  - 미래 매치 0건 시 → 카드 자체 hidden (page.tsx conditional)
 *
 * 어떻게:
 *  - props: 단일 매치 정보 (matchId, scheduledAt, tournament, 양 팀 등)
 *  - 카드 형식: PlayerMatchCard 패턴 카피 (본인 기록 줄 X — 아직 안 일어남)
 *  - 클릭 → /live/[matchId]
 *
 *  - Material Symbols Outlined / BDR 토큰 (var(--*))
 * ============================================================ */

import Link from "next/link";

export interface NextMatchInfo {
  matchId: string;
  matchCode: string | null;
  matchNumber: number | null;
  groupName: string | null;
  roundName: string | null;
  scheduledAt: string; // ISO — 미래 시각만 전달 (page.tsx 가드)
  courtNumber: number | null;
  tournamentName: string | null;
  tournamentShortCode: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  /** 본인 팀이 어느 쪽인지 (page.tsx ttp 비교 후 전달) */
  myTeamSide: "home" | "away" | null;
}

export interface NextTournamentMatchCardProps {
  match: NextMatchInfo | null;
}

// D-N 계산 (오늘=오늘, 1일후=D-1)
function fmtDDay(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDay = Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  if (diffDay === 0) return "D-DAY";
  if (diffDay > 0) return `D-${diffDay}`;
  return `D+${Math.abs(diffDay)}`;
}

// "5/12 (월) 19:30" 형식
function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const dow = days[d.getDay()];
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${m}/${day} (${dow}) ${hh}:${mm}`;
}

export function NextTournamentMatchCard({ match }: NextTournamentMatchCardProps) {
  if (!match) return null;

  // 본인 팀 표기 — myTeamSide 별 접두어
  const homeLabel = match.homeTeamName ?? "TBD";
  const awayLabel = match.awayTeamName ?? "TBD";
  const myMark =
    match.myTeamSide === "home"
      ? { home: "(우리팀)", away: "" }
      : match.myTeamSide === "away"
        ? { home: "", away: "(우리팀)" }
        : { home: "", away: "" };

  return (
    <Link
      href={`/live/${match.matchId}`}
      className="card"
      style={{
        display: "block",
        padding: "18px 20px",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* 헤더 — 일시 + D-Day + 상세 → */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 18, color: "var(--accent)" }}
            aria-hidden
          >
            event
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--ink-dim)",
              letterSpacing: ".06em",
              textTransform: "uppercase",
            }}
          >
            다음 매치
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--accent)",
            padding: "2px 6px",
            background: "color-mix(in srgb, var(--accent) 14%, transparent)",
            borderRadius: 4,
            fontFamily: "var(--ff-mono)",
          }}
        >
          {fmtDDay(match.scheduledAt)}
        </span>
      </div>

      {/* 일시 + 코트 */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "var(--ink)",
          marginBottom: 4,
        }}
      >
        {fmtDateTime(match.scheduledAt)}
        {match.courtNumber != null && (
          <span style={{ fontSize: 12, color: "var(--ink-dim)", marginLeft: 8, fontWeight: 400 }}>
            · 코트 {match.courtNumber}
          </span>
        )}
      </div>

      {/* 매치코드 + 대회 + 라운드 */}
      <div
        style={{
          fontSize: 11.5,
          color: "var(--ink-dim)",
          marginBottom: 12,
          fontFamily: "var(--ff-mono)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {match.matchCode ?? "—"}
        {match.tournamentName && (
          <span style={{ fontFamily: "inherit" }}> · {match.tournamentName}</span>
        )}
        {(match.groupName || match.roundName) && (
          <span style={{ fontFamily: "inherit" }}>
            {" "}
            · {[match.groupName, match.roundName].filter(Boolean).join(" ")}
          </span>
        )}
      </div>

      {/* 팀 대결 — 좌 홈팀 / 중앙 vs / 우 어웨이팀 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 10,
          padding: "10px 12px",
          background: "var(--bg-alt)",
          borderRadius: 6,
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: match.myTeamSide === "home" ? 800 : 600,
            color: match.myTeamSide === "home" ? "var(--ink)" : "var(--ink-soft)",
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {homeLabel}
          {myMark.home && (
            <span style={{ fontSize: 10.5, color: "var(--accent)", marginLeft: 4 }}>
              {myMark.home}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--ink-dim)",
            fontFamily: "var(--ff-mono)",
            fontWeight: 700,
            letterSpacing: ".06em",
          }}
        >
          VS
        </div>
        <div
          style={{
            fontSize: 13,
            fontWeight: match.myTeamSide === "away" ? 800 : 600,
            color: match.myTeamSide === "away" ? "var(--ink)" : "var(--ink-soft)",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {awayLabel}
          {myMark.away && (
            <span style={{ fontSize: 10.5, color: "var(--accent)", marginLeft: 4 }}>
              {myMark.away}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
