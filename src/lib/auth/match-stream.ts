/**
 * 2026-05-09 — 매치 라이브 스트림 (YouTube) 등록 권한 헬퍼.
 *
 * 도메인 컨텍스트 (Dev/live-youtube-embed-2026-05-09.md §6 / Q7 결재):
 *   영상 등록/제거 권한은 3 role — super_admin / tournament.organizerId / tournamentAdminMember(is_active=true).
 *   recorder 는 점수 입력 전용이라 영상 등록 권한 별도 부여 안 함 (Q7 결재 준수).
 *
 * 사용처:
 *   POST/PATCH/DELETE /api/web/tournaments/[id]/matches/[matchId]/youtube-stream
 *   GET             /api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search
 *
 * 호출 패턴:
 *   const allowed = await canManageMatchStream(userId, matchId);
 *   if (!allowed) return apiError("권한이 없습니다.", 403);
 *
 *   또는 match → tournamentId 매핑 검증까지 한 번에:
 *   const result = await resolveMatchStreamAuth(userId, tournamentId, matchId);
 *   if ("error" in result) return result.error;
 */

import { type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";

/** super_admin role 여부 — JWT payload 기반 단순 검사 */
function isSuperAdmin(session: { role?: string; admin_role?: string } | null | undefined): boolean {
  if (!session) return false;
  return session.role === "super_admin" || session.admin_role === "super_admin";
}

/**
 * userId 가 matchId 의 영상 스트림을 관리할 수 있는지 검증.
 * - super_admin → true
 * - tournament.organizerId === userId → true
 * - tournamentAdminMember.is_active=true → true
 * - 그 외 → false
 *
 * matchId 가 존재하지 않거나 BigInt 변환 실패 시 false (404 는 호출처에서 별도 처리).
 */
export async function canManageMatchStream(
  userId: bigint,
  matchId: bigint,
  session?: { role?: string; admin_role?: string } | null,
): Promise<boolean> {
  // 1) super_admin 우회 — DB 조회 없이 즉시 통과 (UX/성능)
  if (isSuperAdmin(session)) return true;

  // 2) match → tournament 조회 (존재 + organizer 동시 검증)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      tournamentId: true,
      tournament: { select: { organizerId: true } },
    },
  });
  if (!match) return false;

  // 3) organizer 검증
  if (match.tournament.organizerId === userId) return true;

  // 4) tournamentAdminMember.is_active=true 검증
  const member = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId: match.tournamentId, userId, isActive: true },
    select: { id: true },
  });
  return Boolean(member);
}

type MatchStreamAuthOk = {
  match: {
    id: bigint;
    tournamentId: string;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    scheduledAt: Date | null;
    started_at: Date | null;
    youtube_video_id: string | null;
    youtube_status: string | null;
    youtube_verified_at: Date | null;
  };
};
type MatchStreamAuthErr = { error: NextResponse };

/**
 * 한 번에 검증 — matchId 존재 + tournamentId 일치 (IDOR 방어) + 권한.
 * 호출처에서 매치 정보도 같이 사용할 수 있도록 match 스니펫 반환.
 */
export async function resolveMatchStreamAuth(
  userId: bigint,
  tournamentId: string,
  matchId: bigint,
  session?: { role?: string; admin_role?: string } | null,
): Promise<MatchStreamAuthOk | MatchStreamAuthErr> {
  // 매치 + tournament organizer 한 쿼리에 조회 (왕복 1회로 단축)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      scheduledAt: true,
      started_at: true,
      youtube_video_id: true,
      youtube_status: true,
      youtube_verified_at: true,
      tournament: { select: { organizerId: true } },
    },
  });

  if (!match) {
    return { error: apiError("경기를 찾을 수 없습니다.", 404) };
  }

  // IDOR 방어 — URL params 위조 시 matchId 가 다른 대회 소속일 수 있음
  if (match.tournamentId !== tournamentId) {
    return { error: apiError("해당 대회의 경기가 아닙니다.", 404) };
  }

  // 권한 검증
  // 1) super_admin → 즉시 통과
  if (isSuperAdmin(session)) {
    return { match: stripTournament(match) };
  }
  // 2) organizer
  if (match.tournament.organizerId === userId) {
    return { match: stripTournament(match) };
  }
  // 3) admin member
  const member = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });
  if (member) {
    return { match: stripTournament(match) };
  }

  return { error: apiError("권한이 없습니다.", 403) };
}

// 내부 — match 객체에서 tournament 중첩 제거 (응답 단순화)
function stripTournament(match: {
  id: bigint;
  tournamentId: string;
  homeTeamId: bigint | null;
  awayTeamId: bigint | null;
  scheduledAt: Date | null;
  started_at: Date | null;
  youtube_video_id: string | null;
  youtube_status: string | null;
  youtube_verified_at: Date | null;
}) {
  return {
    id: match.id,
    tournamentId: match.tournamentId,
    homeTeamId: match.homeTeamId,
    awayTeamId: match.awayTeamId,
    scheduledAt: match.scheduledAt,
    started_at: match.started_at,
    youtube_video_id: match.youtube_video_id,
    youtube_status: match.youtube_status,
    youtube_verified_at: match.youtube_verified_at,
  };
}
