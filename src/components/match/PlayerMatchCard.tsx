"use client";

/* ============================================================
 * PlayerMatchCard — 선수 본인 기록이 표시되는 매치 카드 (글로벌 컴포넌트)
 *
 * 왜 (NBA Game Log 스타일):
 * - /users/[id] "최근 경기" 탭에서 board__row 단순 행 → NBA.com Game Log 형식 카드로 전환.
 * - 대회상세 ScheduleTimeline (`schedule-timeline.tsx`) 의 매치 카드 시각 패턴을 카피하고,
 *   여기에 "본인 기록 줄" (22 PTS · 14 REB · 3 AST · 2 STL [W]) 한 줄 추가.
 * - 향후 /teams/[id] "최근 경기" 섹션에서도 동일 컴포넌트 재사용 (E-1 채택 — 글로벌 위치).
 *
 * 어떻게:
 * - 카드 상단 메타 줄: [매치코드 또는 #번호] | 라운드 | 시간 | N코트 | StatusBadge
 * - 카드 중앙 VS 행: 홈팀 로고+이름 / 스코어박스 (또는 VS) / 어웨이팀 이름+로고
 * - 카드 하단 본인 기록 줄: 22 PTS · 14 REB · 3 AST · 2 STL [W]
 * - 전체 wrapper: <Link href={`/live/${matchId}`}> — 카드 클릭 = 라이브 페이지 이동
 *
 * 디자인 토큰:
 * - var(--color-*) 토큰 사용 (대회상세 카드와 동일 — Tailwind globals.css 토큰 시스템)
 * - rounded-lg / hover:opacity-80 / lucide-react ❌
 * ============================================================ */

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { formatShortDate, formatShortTime } from "@/lib/utils/format-date";

/** 본인 기록 줄에 표시되는 4 stat (Q5 = D-1 형식) */
export interface PlayerMatchStat {
  points: number;
  rebounds: number;
  assists: number;
  steals: number;
}

export interface PlayerMatchCardProps {
  /** TournamentMatch.id (라우팅 /live/[id] 용) */
  matchId: string;
  /** 매치 코드 v4 (예: 26-GG-MD21-006) — NULL 시 #matchNumber fallback */
  matchCode: string | null;
  /** 매치 번호 — matchCode NULL 시 fallback */
  matchNumber: number | null;
  /** 조 이름 (예: "B조") — 현재 미사용이지만 확장용 */
  groupName?: string | null;
  /** 라운드명 (예: "B조 2경기") */
  roundName: string | null;
  /** 시작 시간 ISO */
  scheduledAt: string | null;
  /** 코트 번호 */
  courtNumber: string | null;
  /** scheduled / live / in_progress / completed */
  status: string | null;
  /** 홈팀 정보 */
  homeTeamName: string | null;
  homeTeamLogoUrl: string | null;
  homeScore: number | null;
  /** 어웨이팀 정보 */
  awayTeamName: string | null;
  awayTeamLogoUrl: string | null;
  awayScore: number | null;
  /** 선수 본인 기록 (4 stat) */
  playerStat: PlayerMatchStat;
  /** 본인 팀이 홈/원정 어느 쪽인지 — 승/패 표시용. 판별 불가 시 null */
  playerSide: "home" | "away" | null;
}

/* -- TeamLogo (대회상세 schedule-timeline.tsx L76~112 카피) --
 *  16팀 PNG 이 512×512 padding 정규화 → object-contain 으로 잘림 0 + 비율 보존.
 *  logoUrl 없으면 회색 원 + 팀명 첫 글자 fallback.
 *  img 태그 직접 사용 (Next/Image 도메인 화이트리스트 회피). */
function TeamLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string | null;
}) {
  const initial = name && name.length > 0 ? name.charAt(0) : "·";
  return (
    <span
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-9 sm:w-9"
      style={{
        border: "1px solid var(--color-border)",
        backgroundColor: logoUrl ? "var(--color-surface)" : "var(--color-elevated)",
      }}
      aria-hidden="true"
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        <span
          className="text-xs font-bold sm:text-sm"
          style={{ color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)" }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}

/* -- StatusBadge (schedule-timeline.tsx L114~123 카피) -- */
function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return <Badge variant="info">종료</Badge>;
  }
  if (status === "live" || status === "in_progress") {
    return <Badge variant="error">LIVE</Badge>;
  }
  return <Badge variant="default">예정</Badge>;
}

export function PlayerMatchCard(props: PlayerMatchCardProps) {
  const {
    matchId,
    matchCode,
    matchNumber,
    roundName,
    scheduledAt,
    courtNumber,
    status,
    homeTeamName,
    homeTeamLogoUrl,
    homeScore,
    awayTeamName,
    awayTeamLogoUrl,
    awayScore,
    playerStat,
    playerSide,
  } = props;

  // 종료/라이브 판별 — 스코어 박스 vs VS 결정
  const isCompleted = status === "completed";
  const isLive = status === "live" || status === "in_progress";
  const showScoreBox = isCompleted || isLive;

  // 승/패 판별 — playerSide 가 있고 종료된 경기에서만 의미
  const homeWins = isCompleted && (homeScore ?? 0) > (awayScore ?? 0);
  const awayWins = isCompleted && (awayScore ?? 0) > (homeScore ?? 0);
  // 본인 W/L 뱃지 — 승무패 동점 (homeScore===awayScore) 도 종료된 경기면 뱃지 미노출
  let wlBadge: "W" | "L" | null = null;
  if (isCompleted && playerSide !== null && homeScore != null && awayScore != null) {
    if (homeScore !== awayScore) {
      const playerWon =
        (playerSide === "home" && homeScore > awayScore) ||
        (playerSide === "away" && awayScore > homeScore);
      wlBadge = playerWon ? "W" : "L";
    }
  }

  // 시간 라벨: "5/2(토) 15:30" 형식 (formatShortDate + formatShortTime 합성)
  const timeLabel = scheduledAt
    ? `${formatShortDate(scheduledAt)} ${formatShortTime(scheduledAt)}`
    : null;

  return (
    <Link
      href={`/live/${matchId}`}
      className="block rounded-lg border p-3 transition-all hover:opacity-80"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
      }}
    >
      {/* 카드 상단 메타 — DualMatchCard / ScheduleTimeline 패턴 (inline 1줄):
          코드/번호 | 라운드 | 시간 | 코트 ... [상태] */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {/* 매치 코드 우선, NULL 시 #매치번호 fallback (대회상세 카드 동일 패턴) */}
          {matchCode ? (
            <>
              <span
                className="match-code"
                title={`매치 코드: ${matchCode}`}
                aria-label={`매치 코드 ${matchCode}`}
              >
                {matchCode}
              </span>
              <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
            </>
          ) : matchNumber != null ? (
            <>
              <span
                className="font-mono text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                #{matchNumber}
              </span>
              <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
            </>
          ) : null}
          {/* 라운드명 */}
          {roundName && (
            <span
              className="truncate text-xs font-medium"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {roundName}
            </span>
          )}
          {/* 시간 */}
          {timeLabel && (
            <>
              <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
              <span
                className="whitespace-nowrap text-xs font-bold"
                style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-heading)" }}
              >
                {timeLabel}
              </span>
            </>
          )}
          {/* 코트 */}
          {courtNumber && (
            <>
              <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {courtNumber}코트
              </span>
            </>
          )}
        </div>
        <StatusBadge status={status} />
      </div>

      {/* 카드 중앙: 팀 VS 팀 + 스코어 (대회상세 카드 동일 패턴) */}
      <div className="flex items-center justify-between">
        {/* 홈팀: 로고(좌) + 팀명 */}
        <div className="flex flex-1 items-center gap-2 text-left min-w-0">
          <TeamLogo logoUrl={homeTeamLogoUrl} name={homeTeamName} />
          <span
            className={`truncate font-bold ${
              homeTeamName ? "text-base sm:text-lg" : "text-sm italic sm:text-base"
            }`}
            style={{
              color: homeTeamName
                ? homeWins
                  ? "var(--color-text-primary)"
                  : isCompleted
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-primary)"
                : "var(--color-text-muted)",
              opacity: homeTeamName ? 1 : 0.7,
            }}
          >
            {homeTeamName ?? "미정"}
          </span>
        </div>

        {/* 스코어 또는 VS */}
        <div className="mx-3 flex-shrink-0">
          {showScoreBox ? (
            <div
              className="flex items-center gap-1.5 rounded-full px-4 py-1.5"
              style={{ backgroundColor: "var(--color-elevated)" }}
            >
              <span
                className="text-lg font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: homeWins
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                }}
              >
                {homeScore ?? 0}
              </span>
              <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>:</span>
              <span
                className="text-lg font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-heading)",
                  color: awayWins
                    ? "var(--color-primary)"
                    : "var(--color-text-secondary)",
                }}
              >
                {awayScore ?? 0}
              </span>
            </div>
          ) : (
            <span
              className="rounded-full px-4 py-1.5 text-base font-bold"
              style={{ backgroundColor: "var(--color-primary)", color: "white" }}
            >
              VS
            </span>
          )}
        </div>

        {/* 어웨이팀: 팀명 + 로고(우) */}
        <div className="flex flex-1 items-center justify-end gap-2 text-right min-w-0">
          <span
            className={`truncate font-bold ${
              awayTeamName ? "text-base sm:text-lg" : "text-sm italic sm:text-base"
            }`}
            style={{
              color: awayTeamName
                ? awayWins
                  ? "var(--color-text-primary)"
                  : isCompleted
                    ? "var(--color-text-secondary)"
                    : "var(--color-text-primary)"
                : "var(--color-text-muted)",
              opacity: awayTeamName ? 1 : 0.7,
            }}
          >
            {awayTeamName ?? "미정"}
          </span>
          <TeamLogo logoUrl={awayTeamLogoUrl} name={awayTeamName} />
        </div>
      </div>

      {/* 카드 하단: 본인 기록 줄 (Q5 = D-1 형식) — 22 PTS · 14 REB · 3 AST · 2 STL [W] */}
      <div
        className="mt-2.5 flex items-center justify-between border-t pt-2.5"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center gap-2 text-xs sm:text-sm"
          style={{
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono, var(--ff-mono))",
          }}
        >
          <span>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              {playerStat.points}
            </strong>{" "}
            PTS
          </span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              {playerStat.rebounds}
            </strong>{" "}
            REB
          </span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              {playerStat.assists}
            </strong>{" "}
            AST
          </span>
          <span style={{ color: "var(--color-border)" }}>·</span>
          <span>
            <strong style={{ color: "var(--color-text-primary)", fontWeight: 700 }}>
              {playerStat.steals}
            </strong>{" "}
            STL
          </span>
        </div>
        {/* W/L 뱃지 — 승무패 (동점) 또는 playerSide null 일 때 미노출 */}
        {wlBadge && (
          <span
            className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold"
            style={{
              backgroundColor:
                wlBadge === "W" ? "var(--color-success)" : "var(--color-error)",
              color: "white",
            }}
            aria-label={wlBadge === "W" ? "승" : "패"}
          >
            {wlBadge}
          </span>
        )}
      </div>
    </Link>
  );
}
