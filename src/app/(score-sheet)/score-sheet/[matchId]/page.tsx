/**
 * FIBA SCORESHEET 페이지 (server entry) — (score-sheet) route group.
 *
 * 2026-05-11 — Phase 1 신규 (기존 (web)/score-sheet/[matchId]/page.tsx 이전 + 재설계).
 *
 * 왜 (이유):
 *   사이트 헤더 / AppNav 와 격리된 minimal layout 으로 종이 기록지 입력 집중도 향상.
 *   URL = 동일 `/score-sheet/{matchId}` (route group 은 URL 미반영) → admin link 변경 0.
 *   기존 `(web)/score-sheet/` 디렉토리는 폐기 — Phase 1 진입 결재 §6 (a) 채택.
 *
 * 진입 흐름 (기존 패턴 재사용):
 *   1. requireScoreSheetAccess(matchId) — web 세션 + 권한 + 매치/대회 SELECT
 *   2. getRecordingMode(match) — paper 아니면 안내 페이지
 *   3. 사전 라인업 양쪽 fetch (MatchLineupConfirmed + TTP fallback)
 *   4. <ScoreSheetForm /> 렌더 (client 폼 본체)
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireScoreSheetAccess } from "@/lib/auth/require-score-sheet-access";
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import { ScoreSheetForm } from "./_components/score-sheet-form";
import type {
  RosterItem,
  TeamRosterData,
} from "./_components/team-section-types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/**
 * Phase 16 (2026-05-13) — scheduledAt 을 splitDateTime() 친화 형식으로 직렬화.
 *
 * 이유: FibaHeader 의 splitDateTime() 은 마지막 공백 분리 → DATE / TIME.
 *   "YYYY-MM-DD HH:mm" 형식이면 깨끗히 분리 가능.
 *   한국 시간대 (Asia/Seoul) 기준 — Vercel 서버 UTC 회피.
 */
function formatScheduledAt(d: Date): string {
  // Asia/Seoul timezone 강제 (Vercel 서버 = UTC / DB 는 UTC 저장).
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  // en-CA = "YYYY-MM-DD" 형식 (locale 디자인 선택)
  const date = `${get("year")}-${get("month")}-${get("day")}`;
  // hour12: false 라도 일부 환경 "24" 반환 가능 → 안전 정규화
  const hour = get("hour") === "24" ? "00" : get("hour");
  const time = `${hour}:${get("minute")}`;
  return `${date} ${time}`;
}

/**
 * 라인업 / TTP 조회 + 직렬화 — server-only.
 * 기존 (web)/score-sheet/[matchId]/page.tsx 의 loadTeamRoster 패턴 그대로 이전.
 */
async function loadTeamRoster(
  matchId: bigint,
  teamSide: "home" | "away",
  ttpId: bigint | null,
  teamName: string
): Promise<TeamRosterData> {
  if (!ttpId) {
    return {
      teamSide,
      teamName,
      tournamentTeamId: null,
      hasConfirmedLineup: false,
      players: [],
      // Phase 7-B — ttp 미배정 = 사전 라인업 없음 (빈 배열)
      confirmedStarters: [],
      confirmedSubstitutes: [],
    };
  }

  // 사전 라인업 1건 — 본 측면만 (Phase 7-B: starters/substitutes string[] 직렬화 후 score-sheet-form 에 전달)
  const lineup = await prisma.matchLineupConfirmed.findUnique({
    where: {
      matchId_teamSide: {
        matchId,
        teamSide,
      },
    },
    select: {
      starters: true,
      substitutes: true,
    },
  });

  // 팀 선수 전체 (jersey 순)
  const players = await prisma.tournamentTeamPlayer.findMany({
    where: {
      tournamentTeamId: ttpId,
      is_active: true,
    },
    select: {
      id: true,
      jerseyNumber: true,
      role: true,
      player_name: true,
      isStarter: true,
      users: {
        select: {
          id: true,
          nickname: true,
          name: true,
        },
      },
    },
    orderBy: [{ jerseyNumber: "asc" }, { id: "asc" }],
  });

  const starterSet = new Set<string>(
    (lineup?.starters ?? []).map((b) => b.toString())
  );
  const subSet = new Set<string>(
    (lineup?.substitutes ?? []).map((b) => b.toString())
  );

  // bigint → string 직렬화 (Next.js 15 server → client prop = plain JSON)
  const serialized: RosterItem[] = players.map((p) => {
    const idStr = p.id.toString();
    const isInLineup = starterSet.has(idStr) || subSet.has(idStr);
    const isStarter = starterSet.has(idStr);
    return {
      tournamentTeamPlayerId: idStr,
      jerseyNumber: p.jerseyNumber,
      role: p.role,
      displayName:
        p.player_name?.trim() ||
        p.users?.nickname?.trim() ||
        p.users?.name?.trim() ||
        "(이름 없음)",
      userId: p.users?.id?.toString() ?? null,
      isStarter,
      isInLineup,
    };
  });

  // Phase 7-B — 사전 라인업 string[] 직렬화 (BigInt → string)
  const confirmedStarters = (lineup?.starters ?? []).map((b) => b.toString());
  const confirmedSubstitutes = (lineup?.substitutes ?? []).map((b) =>
    b.toString()
  );

  return {
    teamSide,
    teamName,
    tournamentTeamId: ttpId.toString(),
    hasConfirmedLineup: Boolean(lineup),
    players: serialized,
    confirmedStarters,
    confirmedSubstitutes,
  };
}

export default async function ScoreSheetPage({ params }: PageProps) {
  const { matchId: matchIdParam } = await params;
  const matchIdNum = Number(matchIdParam);
  if (!Number.isFinite(matchIdNum) || matchIdNum <= 0) {
    redirect("/");
  }

  // 1) 권한 + 매치/대회 SELECT
  const access = await requireScoreSheetAccess(BigInt(matchIdNum));
  if ("error" in access) {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
        <div
          className="rounded-[4px] px-4 py-8"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          <p className="text-base font-semibold">접근할 수 없습니다</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            로그인 후 운영자 또는 기록원 권한으로 접근해주세요.
          </p>
          <div className="mt-4">
            <Link
              href="/"
              className="inline-block rounded-[4px] px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { match, tournament } = access;

  // Phase 16 (2026-05-13) — venue (courts.name) 별도 조회.
  // 이유: require-score-sheet-access 는 courts relation include 안 함 (venue_id 만 보유).
  //   FIBA 헤더 Place 자동 매핑 위해 court_number 우선 / 없으면 courts.name fallback.
  //   별도 쿼리 1회 = 작은 비용 (운영 영향 0 / SELECT 만).
  const venue =
    match.venue_id != null
      ? await prisma.courts.findUnique({
          where: { id: match.venue_id },
          select: { name: true },
        })
      : null;

  // 2) 모드 가드 — paper 가 아니면 안내 화면
  const mode = getRecordingMode({ settings: match.settings });
  if (mode !== "paper") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12">
        <div
          className="rounded-[4px] px-4 py-8 text-center"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-info) 8%, transparent)",
            color: "var(--color-text-primary)",
          }}
        >
          <p className="text-base font-semibold">현재 Flutter 기록앱으로 진행 중</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            이 매치는 Flutter 기록앱 모드입니다. 종이 기록지로 입력하려면
            운영자가 대회 관리 페이지에서 기록 모드를 &quot;종이 기록지(웹)&quot;로
            전환해야 합니다.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/tournament-admin/tournaments/${tournament.id}/matches`}
              className="inline-block rounded-[4px] px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              운영자 페이지로
            </Link>
            <Link
              href={`/live/${match.id.toString()}`}
              className="inline-block rounded-[4px] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
            >
              라이브 페이지로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // 3) 사전 라인업 양쪽 fetch
  const [homeTeamData, awayTeamData] = await Promise.all([
    loadTeamRoster(
      match.id,
      "home",
      match.homeTeamId,
      await prisma.tournamentTeam
        .findUnique({
          where: { id: match.homeTeamId ?? BigInt(-1) },
          select: { team: { select: { name: true } } },
        })
        .then((t) => t?.team?.name ?? "Team A 미정")
    ),
    loadTeamRoster(
      match.id,
      "away",
      match.awayTeamId,
      await prisma.tournamentTeam
        .findUnique({
          where: { id: match.awayTeamId ?? BigInt(-1) },
          select: { team: { select: { name: true } } },
        })
        .then((t) => t?.team?.name ?? "Team B 미정")
    ),
  ]);

  // 4) client prop 직렬화 (FIBA Phase 1 필요 필드만)
  // Phase 16 (2026-05-13) — splitDateTime() 안정성 위해 ISO 형식 "YYYY-MM-DD HH:mm" 사용.
  // 이유: 이전 toLocaleString("ko-KR") 출력 = "2026. 05. 13. 14:00" 류로 점·여백 섞여
  //   splitDateTime 의 lastIndexOf(" ") 분리가 어색 → DATE/TIME 표시 깨짐.
  //   ISO 형식 = 마지막 공백 1개 → date·time 깨끗히 분리.
  const scheduledAtLabel = match.scheduledAt
    ? formatScheduledAt(new Date(match.scheduledAt))
    : null;

  // Place 자동 매핑 fallback chain — court_number (수동 입력 우선) → courts.name (relation).
  const placeLabel =
    (match.court_number && match.court_number.trim()) || venue?.name || null;

  const matchProps = {
    id: match.id.toString(),
    tournamentId: match.tournamentId,
    match_code: match.match_code,
    scheduledAtLabel,
    courtLabel: placeLabel,
  };

  const tournamentProps = {
    id: tournament.id,
    name: tournament.name ?? "(대회명 미정)",
  };

  // Phase 7-B — 사전 라인업 prop 산출.
  //   양 팀 모두 hasConfirmedLineup=true + starters=5 = 확정 → 모달 skip + 자동 fill.
  //   한 팀이라도 미확정 = 전체 모달 강제 (양쪽 동시 입력 흐름 단순화).
  const initialLineup =
    homeTeamData.hasConfirmedLineup &&
    awayTeamData.hasConfirmedLineup &&
    homeTeamData.confirmedStarters.length === 5 &&
    awayTeamData.confirmedStarters.length === 5
      ? {
          home: {
            starters: homeTeamData.confirmedStarters,
            substitutes: homeTeamData.confirmedSubstitutes,
          },
          away: {
            starters: awayTeamData.confirmedStarters,
            substitutes: awayTeamData.confirmedSubstitutes,
          },
        }
      : undefined;

  return (
    <ScoreSheetForm
      match={matchProps}
      tournament={tournamentProps}
      homeRoster={homeTeamData}
      awayRoster={awayTeamData}
      initialLineup={initialLineup}
    />
  );
}
