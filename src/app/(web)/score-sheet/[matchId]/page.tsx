/**
 * 웹 종이 기록지 입력 페이지 (server entry).
 *
 * 2026-05-11 — Phase 1-B-2 신규 (decisions.md [2026-05-11] §1 / planner-architect §URL).
 *
 * URL: `/score-sheet/{matchId}` — 운영자/기록원 전용 (AppNav 진입 없음).
 *
 * 진입 흐름:
 *   1. `requireScoreSheetAccess(matchId)` — web 세션 + 권한 (recorder/organizer/admin/super) + 매치/대회 SELECT
 *   2. `getRecordingMode(match)` — paper 아니면 안내 페이지 (flutter 진행 중)
 *   3. 사전 라인업 SELECT (`MatchLineupConfirmed` 양쪽) — 미존재 시 TTP 전체 fallback
 *   4. `<ScoreSheetForm />` 렌더 — client 폼 본체
 *
 * 단일 책임:
 *   - server: 권한 + 매치 정보 + 라인업 데이터 fetch + serialize (bigint → string)
 *   - client (`ScoreSheetForm`): 폼 상태 + localStorage draft + submit 핸들러
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { requireScoreSheetAccess } from "@/lib/auth/require-score-sheet-access";
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
import { ScoreSheetForm } from "./_components/score-sheet-form";
import type { RosterItem, TeamRosterData } from "./_components/team-roster";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/**
 * 라인업/TTP 조회 + 직렬화 — server-only.
 *
 * 사전 라인업 (PR1~5) 우선:
 *   - starters[5] = "선발" 표시
 *   - substitutes[7] = "후보" 표시
 * 미존재 시 fallback:
 *   - TournamentTeamPlayer.is_active=true 전체 (jersey 순)
 *   - 운영 초기 매치 (라인업 미정착) 대응
 */
async function loadTeamRoster(
  matchId: bigint,
  teamSide: "home" | "away",
  ttpId: bigint | null,
  teamName: string
): Promise<TeamRosterData> {
  if (!ttpId) {
    // 슬롯 미배정 매치 = 빈 명단 (폼이 manual 입력 fallback 표시)
    return {
      teamSide,
      teamName,
      tournamentTeamId: null,
      hasConfirmedLineup: false,
      players: [],
    };
  }

  // 사전 라인업 (MatchLineupConfirmed) 1건 조회 — 본 측면만
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

  // 팀 선수 전체 조회 (jersey 순) — 라인업 마킹 후 그대로 폼에 노출
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

  // bigint → string 직렬화 (client 컴포넌트 prop 전달)
  // 이유: Next.js 15 server → client prop 은 plain JSON 만 — BigInt 직접 통과 X
  const serialized: RosterItem[] = players.map((p) => {
    const idStr = p.id.toString();
    const isInLineup = starterSet.has(idStr) || subSet.has(idStr);
    const isStarter = starterSet.has(idStr);
    return {
      tournamentTeamPlayerId: idStr,
      jerseyNumber: p.jerseyNumber,
      role: p.role,
      // 표시명 우선순위: TTP.player_name (운영자 등록) → user.nickname → user.name → "(이름 없음)"
      displayName:
        p.player_name?.trim() ||
        p.users?.nickname?.trim() ||
        p.users?.name?.trim() ||
        "(이름 없음)",
      userId: p.users?.id?.toString() ?? null,
      isStarter, // 사전 라인업 starters 우선 (없으면 false)
      isInLineup, // starters + substitutes 합집합 — 라인업 미입력 매치는 전체 false
    };
  });

  return {
    teamSide,
    teamName,
    tournamentTeamId: ttpId.toString(),
    hasConfirmedLineup: Boolean(lineup),
    players: serialized,
  };
}

export default async function ScoreSheetPage({ params }: PageProps) {
  const { matchId: matchIdParam } = await params;
  const matchIdNum = Number(matchIdParam);
  if (!Number.isFinite(matchIdNum) || matchIdNum <= 0) {
    // 잘못된 URL — 홈으로 이동 (server-side redirect)
    redirect("/");
  }

  // 1) 권한 + 매치/대회 SELECT (settings 포함 — 모드 가드 재사용)
  const access = await requireScoreSheetAccess(BigInt(matchIdNum));
  if ("error" in access) {
    // 비로그인 401 → /login (page level redirect)
    // 권한 없음 403 / 매치 없음 404 → 안내 페이지 표시
    // (NextResponse 는 server component 에서 직접 반환 불가 → render 분기로 처리)
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12 text-center">
        <div
          className="rounded-[12px] px-4 py-8"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
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
              className="inline-block rounded-[4px] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
            >
              홈으로
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { user, match, tournament } = access;

  // 2) 모드 가드 — paper 가 아니면 안내 화면
  const mode = getRecordingMode({ settings: match.settings });
  if (mode !== "paper") {
    return (
      <main className="mx-auto w-full max-w-4xl px-4 py-12">
        <div
          className="rounded-[12px] px-4 py-8 text-center"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
            color: "var(--color-text-primary)",
          }}
        >
          <p className="text-base font-semibold">현재 Flutter 기록앱으로 진행 중</p>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            이 매치는 Flutter 기록앱 모드입니다. 종이 기록지로 입력하려면 운영자가
            대회 관리 페이지에서 기록 모드를 &quot;종이 기록지(웹)&quot;로 전환해야 합니다.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Link
              href={`/tournament-admin/tournaments/${tournament.id}/matches`}
              className="inline-block rounded-[4px] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white"
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

  // 3) 사전 라인업 양쪽 fetch (homeTtp / awayTtp 미배정 매치는 빈 명단)
  const [homeTeamData, awayTeamData] = await Promise.all([
    loadTeamRoster(
      match.id,
      "home",
      match.homeTeamId,
      // 팀명 — TournamentTeam → Team.name SELECT 별도 (요청 최소화 위해 inline)
      await prisma.tournamentTeam
        .findUnique({
          where: { id: match.homeTeamId ?? BigInt(-1) },
          select: { team: { select: { name: true } } },
        })
        .then((t) => t?.team?.name ?? "홈팀 미정")
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
        .then((t) => t?.team?.name ?? "원정팀 미정")
    ),
  ]);

  // 4) 클라이언트 prop 직렬화 — bigint → string / Date → ISO
  // 이유: Server Component → Client Component prop 은 plain JSON 만 통과
  const matchProps = {
    id: match.id.toString(),
    tournamentId: match.tournamentId,
    homeTeamId: match.homeTeamId?.toString() ?? null,
    awayTeamId: match.awayTeamId?.toString() ?? null,
    status: match.status,
    homeScore: match.homeScore ?? 0,
    awayScore: match.awayScore ?? 0,
    roundName: match.roundName,
    round_number: match.round_number,
    match_number: match.match_number,
    match_code: match.match_code,
    scheduledAt: match.scheduledAt?.toISOString() ?? null,
    court_number: match.court_number,
    // quarterScores JSON 그대로 전달 (form 이 파싱)
    quarterScores: (match.quarterScores ?? null) as Record<string, unknown> | null,
    notes: match.notes,
  };

  const tournamentProps = {
    id: tournament.id,
    name: tournament.name ?? "(대회명 미정)",
    format: tournament.format,
  };

  const userProps = {
    id: user.id.toString(),
    nickname: user.nickname,
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6">
      {/* PC 우선 + 모바일 가드 (사용자 결재 §2) — 720px 미만 안내 + 입력 차단은 form 안에서 분기 */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link
            href={`/tournament-admin/tournaments/${tournament.id}/matches`}
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          >
            ← 경기 관리로
          </Link>
          <h1 className="mt-1 text-xl font-bold text-[var(--color-text-primary)] sm:text-2xl">
            📝 종이 기록지 입력
          </h1>
        </div>
        <div className="text-right text-xs text-[var(--color-text-muted)]">
          입력자: {user.nickname ?? "익명"}
        </div>
      </div>

      <ScoreSheetForm
        match={matchProps}
        tournament={tournamentProps}
        homeRoster={homeTeamData}
        awayRoster={awayTeamData}
        user={userProps}
      />
    </main>
  );
}
