/**
 * 2026-05-09 PR2 — 매치 사전 라인업 확정 권한 헬퍼.
 *
 * 도메인 컨텍스트 (Dev/match-lineup-confirmation-2026-05-09.md §7 / Q9=A 채택):
 *   라인업 입력 권한 = 팀장 (team.captainId / team.manager_id) + 운영자 대리 (super_admin / organizer / tournamentAdminMember).
 *   recorder 는 점수 입력 전용 — 라인업 입력 권한 별도 부여 안 함 (Q9 결재 따름 / planner §7.1).
 *
 * 권한 매핑:
 *   - super_admin                                  → home + away 양쪽 편집 가능
 *   - tournament.organizerId === userId            → home + away 양쪽 편집 가능
 *   - tournamentAdminMember(isActive=true)         → home + away 양쪽 편집 가능
 *   - team.captainId === userId (해당 측만)        → 본인 팀(home OR away) 만 편집 가능
 *   - team.manager_id === userId (해당 측만)       → 본인 팀(home OR away) 만 편집 가능
 *   - 그 외                                        → 권한 없음
 *
 * 사용처:
 *   POST/PATCH/DELETE /api/web/tournaments/[id]/matches/[matchId]/lineup
 *   GET             /api/web/tournaments/[id]/matches/[matchId]/lineup (canEdit 필드 계산)
 *
 * 호출 패턴 (단일 검증):
 *   const result = await resolveLineupAuth(userId, tournamentId, matchId, "home", session);
 *   if ("error" in result) return result.error;
 *
 * 호출 패턴 (양쪽 권한 조회 — GET):
 *   const canEdit = await getLineupCanEdit(userId, tournamentId, matchId, session);
 *   // canEdit = { home: boolean, away: boolean, isAdmin: boolean }
 */

import { type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

// teamSide 리터럴 — DB 컬럼 enum 처럼 운용 (TypeScript 단)
export type TeamSide = "home" | "away";

/** super_admin role 여부 — JWT payload 기반 단순 검사 (DB 조회 0) */
function isSuperAdmin(session: { role?: string; admin_role?: string } | null | undefined): boolean {
  if (!session) return false;
  return session.role === "super_admin" || session.admin_role === "super_admin";
}

/**
 * 매치 + 양 팀 + tournament 정보 한 쿼리에 조회.
 * 권한 검증과 응답 양 팀 정보를 동시에 활용 가능하도록 공통 select 분리.
 */
async function fetchMatchWithTeams(matchId: bigint) {
  return prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      scheduledAt: true,
      started_at: true,
      status: true,
      tournament: { select: { organizerId: true } },
      // 양 팀 → team 단계까지 (captainId / manager_id 권한 검증용)
      homeTeam: {
        select: {
          id: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              captainId: true,
              manager_id: true,
            },
          },
        },
      },
      awayTeam: {
        select: {
          id: true,
          teamId: true,
          team: {
            select: {
              id: true,
              name: true,
              captainId: true,
              manager_id: true,
            },
          },
        },
      },
    },
  });
}

type MatchWithTeams = NonNullable<Awaited<ReturnType<typeof fetchMatchWithTeams>>>;

/**
 * 매치 1건 단위 권한 검증 (특정 teamSide 편집 시도).
 * 호출처: POST/PATCH/DELETE /lineup — body 의 teamSide 와 함께 검증.
 *
 * 검증 흐름:
 *   1. 매치 존재 + tournamentId 일치 (IDOR 방어)
 *   2. super_admin/organizer/admin → 양쪽 통과
 *   3. captain/manager → 해당 측만 통과
 *   4. 그 외 → 403
 */
type LineupAuthOk = { match: MatchWithTeams; isAdmin: boolean };
type LineupAuthErr = { error: NextResponse };

export async function resolveLineupAuth(
  userId: bigint,
  tournamentId: string,
  matchId: bigint,
  teamSide: TeamSide,
  session?: { role?: string; admin_role?: string } | null,
): Promise<LineupAuthOk | LineupAuthErr> {
  const match = await fetchMatchWithTeams(matchId);
  if (!match) {
    return { error: apiError("경기를 찾을 수 없습니다.", 404) };
  }

  // IDOR 방어 — URL params 위조 시 matchId 가 다른 대회 소속일 수 있음
  if (match.tournamentId !== tournamentId) {
    return { error: apiError("해당 대회의 경기가 아닙니다.", 404) };
  }

  // 1) super_admin / organizer / tournamentAdminMember = 양쪽 편집
  if (isSuperAdmin(session)) {
    return { match, isAdmin: true };
  }
  if (match.tournament.organizerId === userId) {
    return { match, isAdmin: true };
  }
  const adminMember = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });
  if (adminMember) {
    return { match, isAdmin: true };
  }

  // 2) 팀장 권한 — 해당 teamSide 측 team 의 captainId/manager_id 만 통과
  const targetSide = teamSide === "home" ? match.homeTeam : match.awayTeam;
  if (!targetSide || !targetSide.team) {
    // 매칭 미정 매치 (homeTeamId/awayTeamId NULL) 라인업 입력 차단
    return { error: apiError("아직 팀이 배정되지 않은 경기입니다.", 409) };
  }
  const isCaptain = targetSide.team.captainId === userId;
  const isManager = targetSide.team.manager_id === userId;
  if (isCaptain || isManager) {
    return { match, isAdmin: false };
  }

  return { error: apiError("권한이 없습니다.", 403) };
}

/**
 * GET /lineup 응답의 canEdit 필드 계산용.
 * 양쪽 권한을 한 번에 평가 (admin = 양쪽 / 팀장 = 본인 팀만).
 */
export async function getLineupCanEdit(
  userId: bigint,
  tournamentId: string,
  match: MatchWithTeams,
  session?: { role?: string; admin_role?: string } | null,
): Promise<{ home: boolean; away: boolean; isAdmin: boolean }> {
  // admin (super_admin / organizer / admin member) = 양쪽 편집
  if (isSuperAdmin(session)) {
    return { home: true, away: true, isAdmin: true };
  }
  if (match.tournament.organizerId === userId) {
    return { home: true, away: true, isAdmin: true };
  }
  const adminMember = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });
  if (adminMember) {
    return { home: true, away: true, isAdmin: true };
  }

  // 팀장 (captain / manager) = 해당 측만
  const homeAllowed =
    Boolean(match.homeTeam?.team) &&
    (match.homeTeam!.team.captainId === userId ||
      match.homeTeam!.team.manager_id === userId);
  const awayAllowed =
    Boolean(match.awayTeam?.team) &&
    (match.awayTeam!.team.captainId === userId ||
      match.awayTeam!.team.manager_id === userId);

  return { home: homeAllowed, away: awayAllowed, isAdmin: false };
}

/**
 * GET 전용 — 매치 + 양 팀 정보 단순 조회 (canEdit 계산 전 단계).
 * 외부에서 fetchMatchWithTeams 직접 호출 가능하도록 export.
 */
export async function getMatchWithTeams(matchId: bigint, tournamentId: string) {
  const match = await fetchMatchWithTeams(matchId);
  if (!match) return null;
  if (match.tournamentId !== tournamentId) return null;
  return match;
}
