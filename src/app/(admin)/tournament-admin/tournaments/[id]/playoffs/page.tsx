/**
 * 2026-05-16 PR-Admin-6 — /playoffs 신규 hub (admin 흐름 §6.5 우선 6).
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §3 단계 10~11 = "예선 종료 → 순위전 → 결승 → 우승팀 결정"
 *     이 3 페이지에 산재 (matches / bracket / divisions). 단일 hub 부재.
 *   - 본 페이지 = 4 영역을 단일 hub 로 통합:
 *     1) 종별 standings 표 (예선 결과 시각화 — getDivisionStandings)
 *     2) AdvancePlayoffsButton (예선 종료 → 순위전 placeholder 일괄 매핑 — PR-Admin-2 재사용)
 *     3) 순위전 매치 목록 (roundName "순위" 매치 — 자동 채움 결과 시각화)
 *     4) 결승전 정보 + 우승팀 (있다면)
 *     5) PlaceholderValidationBanner (강남구 사고 재발 방지 — PR-Admin-3 재사용)
 *
 * 권한 가드: matches/page.tsx 와 동일 패턴 (super_admin / organizer / active TAM).
 *
 * server component (server-side fetch + 권한 가드) → playoffs-client.tsx (UI 렌더).
 *   - getDivisionStandings 는 server 에서 모든 종별 standings 한번에 fetch (N+1 방지)
 *   - 매치는 모든 매치 fetch 후 client 에서 RANKING_ROUND_REGEX 필터링
 */

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { getDivisionStandings, type DivisionStanding } from "@/lib/tournaments/division-advancement";
import { PlayoffsClient, type PlayoffsMatch, type DivisionStandingsBundle } from "./playoffs-client";

export const dynamic = "force-dynamic";

export default async function PlayoffsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 대회 + 권한 검증 (matches/page.tsx 와 동일 패턴 — super_admin / organizer / TAM)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      organizerId: true,
      // 대회 표시명 (헤더용)
      name: true,
      // 종별 룰 — 종별별 standings 산출 + 라벨 표시용
      divisionRules: {
        select: { code: true, label: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!tournament) notFound();

  if (session.role !== "super_admin") {
    const isOrganizer = tournament.organizerId === userId;
    if (!isOrganizer) {
      const member = await prisma.tournamentAdminMember.findFirst({
        where: { tournamentId: id, userId, isActive: true },
      });
      if (!member) notFound();
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 종별별 standings 산출 (server side — N+1 방지)
  //   - divisionRules 0건이면 단일 종별 폴백 ("default" code)
  //   - getDivisionStandings 는 PrismaClient | TransactionClient 둘 다 허용
  // ─────────────────────────────────────────────────────────────
  const divisionCodes = tournament.divisionRules.map((r) => r.code);
  const codesToQuery = divisionCodes.length > 0 ? divisionCodes : ["default"];

  // Promise.all 로 병렬 조회 (각 종별 1 쿼리)
  const standingsPromises = codesToQuery.map(async (code) => {
    const standings = await getDivisionStandings(prisma, id, code);
    const rule = tournament.divisionRules.find((r) => r.code === code);
    const label = rule?.label ?? code;
    return { code, label, standings } satisfies DivisionStandingsBundle;
  });
  const divisionStandings = await Promise.all(standingsPromises);

  // ─────────────────────────────────────────────────────────────
  // 매치 fetch (모든 매치 — client 에서 roundName "순위" 필터 + 결승 식별)
  //   - matches API (/api/web/tournaments/[id]/bracket) 와 동등한 필드 select
  //   - 클라 필터링 = RANKING_ROUND_REGEX (placeholder-helpers 와 동일 정규식)
  // ─────────────────────────────────────────────────────────────
  const rawMatches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    select: {
      id: true,
      roundName: true,
      round_number: true,
      match_number: true,
      group_name: true,
      status: true,
      homeTeamId: true,
      awayTeamId: true,
      homeScore: true,
      awayScore: true,
      winner_team_id: true,
      notes: true,
      settings: true,
      scheduledAt: true,
      venue_name: true,
      court_number: true,
      homeTeam: { select: { team: { select: { name: true } } } },
      awayTeam: { select: { team: { select: { name: true } } } },
    },
    orderBy: [{ round_number: "asc" }, { match_number: "asc" }],
  });

  // BigInt → string 직렬화 (client component 에 전달 시 필수)
  const matches: PlayoffsMatch[] = rawMatches.map((m) => ({
    id: m.id.toString(),
    roundName: m.roundName,
    round_number: m.round_number,
    match_number: m.match_number,
    group_name: m.group_name,
    status: m.status ?? "pending",
    homeTeamId: m.homeTeamId?.toString() ?? null,
    awayTeamId: m.awayTeamId?.toString() ?? null,
    homeScore: m.homeScore ?? 0,
    awayScore: m.awayScore ?? 0,
    winner_team_id: m.winner_team_id?.toString() ?? null,
    notes: m.notes,
    // settings 는 Prisma Json → unknown 로 전달 (client 에서 옵셔널 안전 접근)
    settings: m.settings as Record<string, unknown> | null,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    venue_name: m.venue_name,
    court_number: m.court_number,
    homeTeamName: m.homeTeam?.team?.name ?? null,
    awayTeamName: m.awayTeam?.team?.name ?? null,
  }));

  return (
    <div>
      {/* 헤더 — bracket/matches 페이지와 동일 패턴 */}
      <div className="mb-6">
        <Link
          href={`/tournament-admin/tournaments/${id}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">순위전·결승 hub</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {tournament.name} — 예선 종료 후 순위전 진출 / 결승 / 우승팀 결정 한 곳에서 관리
        </p>
      </div>

      {/* client 컴포넌트로 5 섹션 위임 (interactive — Advance 버튼 / Banner 토글) */}
      <PlayoffsClient
        tournamentId={id}
        divisionStandings={divisionStandings}
        matches={matches}
      />
    </div>
  );
}

// 타입 re-export (client 모듈의 import 단순화)
export type { DivisionStanding };
