import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";
import { WEB_SESSION_COOKIE } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
// 2026-05-11 Phase 2 — isSuperAdmin 단일 source 통합 + Phase 1-C super_admin 분기 추가.
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

type AuthOk = { userId: bigint; session: { sub: string; role: string } };
type AuthErr = { error: NextResponse };

/** 대회 관리자(주최자 or 관리 멤버) 권한 검증 */
export async function requireTournamentAdmin(
  tournamentId: string
): Promise<AuthOk | AuthErr> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token)
    return { error: apiError("로그인이 필요합니다.", 401) };

  const session = await verifyToken(token);
  if (!session)
    return { error: apiError("세션이 만료되었습니다.", 401) };

  const userId = BigInt(session.sub);

  // 2026-05-11 Phase 1-C — super_admin 우회 분기.
  // 이유: 기존 코드는 organizer 비교 후 TAM SELECT — super_admin 도 organizer 아니면서 TAM row
  //   없으면 403. canManageTournament / resolveMatchStreamAuth 등 다른 헬퍼와 동일 패턴 통일.
  // 안전 가드: tournament 존재 확인은 super_admin 우회 시에도 필요 (404 vs 200 구분).
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });

  if (!tournament)
    return { error: apiError("대회를 찾을 수 없습니다.", 404) };

  // super_admin 이면 organizer/TAM 검증 skip — 즉시 통과
  if (isSuperAdmin(session)) {
    return { userId, session };
  }

  if (tournament.organizerId !== userId) {
    const member = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
    });
    if (!member)
      return { error: apiError("권한이 없습니다.", 403) };
  }

  return { userId, session };
}

/** 간단한 웹 세션 유저 추출 */
export async function getWebUser(): Promise<{ userId: bigint; sub: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(WEB_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await verifyToken(token);
  if (!session) return null;
  return { userId: BigInt(session.sub), sub: session.sub };
}

/**
 * 대회 관계자(insider) 판별 — 비공개 대회 접근 가드에서 사용.
 * 관계자 = super_admin | organizerId | tournamentAdminMember(isActive)
 * 참가팀 멤버는 차기에 확장.
 */
export async function isTournamentInsider(
  userId: bigint,
  tournamentId: string,
  session?: { role?: string; admin_role?: string } | null
): Promise<boolean> {
  // 2026-05-11 Phase 2 — isSuperAdmin 단일 source 사용 (인라인 제거).
  if (isSuperAdmin(session)) {
    return true;
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { organizerId: true },
  });
  if (!tournament) return false;

  if (tournament.organizerId === userId) return true;

  const member = await prisma.tournamentAdminMember.findFirst({
    where: { tournamentId, userId, isActive: true },
    select: { id: true },
  });
  return Boolean(member);
}
