/**
 * 2026-05-11 Phase 1 — 대회 단위 운영 권한 헬퍼.
 *
 * 도메인 컨텍스트:
 *   - match-stream.ts 의 canManageMatchStream() 이 매치 단위 권한이라면,
 *     본 헬퍼는 대회 자체 (tournamentId) 단위 권한.
 *   - 사용처: /api/web/admin/tournaments/[id]/team-applications 등
 *     "대회 운영자만 접근 가능" 어드민 라우트 / 페이지.
 *
 * 권한 3종 (Q7 youtube-stream 패턴 동일):
 *   1) super_admin (JWT role 또는 admin_role)
 *   2) tournament.organizerId === userId
 *   3) tournamentAdminMember.is_active=true row 존재
 *
 * 호출 패턴:
 *   const allowed = await canManageTournament(tournamentId, userId, session);
 *   if (!allowed) return apiError("권한이 없습니다.", 403);
 *
 * tournamentId 가 존재하지 않는 경우 false (404 는 호출처에서 별도 처리).
 */

import { prisma } from "@/lib/db/prisma";
// 2026-05-11 Phase 2 — isSuperAdmin 단일 source 통합 (인라인 제거).
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

/**
 * userId 가 tournamentId 의 어드민 권한을 가지는지 검증.
 * - super_admin → true (DB 조회 우회)
 * - tournament.organizerId === userId → true
 * - tournamentAdminMember.is_active=true → true
 * - 그 외 → false
 */
export async function canManageTournament(
  tournamentId: string,
  userId: bigint,
  session?: { role?: string; admin_role?: string } | null,
): Promise<boolean> {
  // 1) super_admin 우회 — DB 조회 없이 즉시 통과
  if (isSuperAdmin(session)) return true;

  // 2) tournament 존재 + organizer 검증 1 쿼리에
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });
  if (!tournament) return false;

  // 3) organizer 검증
  if (tournament.organizerId === userId) return true;

  // 4) tournamentAdminMember.is_active=true 검증
  const member = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });
  return Boolean(member);
}
