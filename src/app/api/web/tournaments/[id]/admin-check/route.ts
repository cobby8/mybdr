/**
 * 2026-05-05 Phase 1 PR4 — 운영자 여부 boolean 확인 API
 *
 * 사용처: 라이브 페이지 (/live/[matchId]) 가 "임시 번호" 운영자 버튼 노출 여부 결정.
 *   라이브 페이지는 인증 없이 누구나 접근 가능 — 운영자 식별만 별도 fetch 로 분리.
 *
 * 권한: 미로그인 = isAdmin:false (조용히 false). 응답은 항상 200.
 *   organizer or tournament_admin_members.is_active=true → isAdmin:true.
 *
 * 운영자 변경/거버넌스는 별도 admins API. 본 API 는 단순 boolean 게이트.
 */

import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  const session = await getWebSession();
  if (!session) {
    // 미로그인 = 항상 false. 401 안 내림 (라이브 페이지 자체가 공개라 silent fail).
    return apiSuccess({ isAdmin: false });
  }

  const userId = BigInt(session.sub);

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });
  if (!tournament) {
    // 존재하지 않는 토너먼트 — 라이브 페이지가 정상 렌더면 매치는 있음. 방어적 false.
    return apiSuccess({ isAdmin: false });
  }

  // organizer 우선
  if (tournament.organizerId === userId) {
    return apiSuccess({ isAdmin: true });
  }

  // tournament_admin_members.is_active=true 검증
  const member = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });

  return apiSuccess({ isAdmin: Boolean(member) });
}
