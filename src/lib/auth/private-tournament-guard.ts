import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isTournamentInsider } from "@/lib/auth/tournament-auth";

/**
 * 비공개 대회 노출 차단 가드 (웹 API용).
 *
 * SSR(tournaments/[id]/page.tsx)과 100% 동일 정책:
 *   is_public === false 인 대회는 관계자(insider = super_admin | organizer | active adminMember)
 *   외에는 접근 차단(존재 숨김). 비로그인은 차단.
 *
 * 공개 대회(is_public true / null=기본 공개)는 항상 통과 → 기존 동작 회귀 0.
 *
 * @param tournamentId 대회 UUID
 * @param isPublic 호출부에서 이미 조회한 is_public 값 (있으면 재조회 생략)
 * @returns true = 차단해야 함(비공개 + 비관계자) / false = 통과
 *
 * 사용 예:
 *   if (await blockIfPrivateTournament(id, tournament.is_public)) {
 *     return apiError("Tournament not found", 404);
 *   }
 */
export async function blockIfPrivateTournament(
  tournamentId: string,
  isPublic?: boolean | null,
): Promise<boolean> {
  let pub = isPublic;
  if (pub === undefined) {
    const t = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { is_public: true },
    });
    // 존재하지 않으면 차단 판단 불가 → 통과(호출부의 별도 404 처리에 위임).
    if (!t) return false;
    pub = t.is_public;
  }

  // 공개(true) 또는 미설정(null=기본 공개)은 통과.
  if (pub !== false) return false;

  // 비공개: 세션 확인 후 관계자만 통과.
  const session = await getWebSession();
  if (!session) return true; // 비로그인 = 차단
  const insider = await isTournamentInsider(
    BigInt(session.sub),
    tournamentId,
    session,
  );
  return !insider; // 관계자 아니면 차단
}
