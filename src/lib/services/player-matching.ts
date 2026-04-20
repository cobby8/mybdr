import { prisma } from "@/lib/db/prisma";

/**
 * 전화번호 기반 선수-유저 자동 매칭
 *
 * 관리자가 선수를 등록할 때 전화번호만 넣어두면,
 * 유저가 가입/인증할 때 이 함수가 호출되어 자동으로 연결된다.
 *
 * 매칭 조건:
 * - TournamentTeamPlayer.phone === 유저의 phone
 * - TournamentTeamPlayer.userId === null (아직 미연결)
 * - 같은 팀에 이미 해당 userId가 없어야 함 (중복 방지)
 *
 * @param userId - 연결할 유저 ID
 * @param phone - 숫자만 포함된 전화번호 (예: "01012345678")
 * @returns 연결된 선수 수
 */
export async function matchPlayersByPhone(
  userId: bigint,
  phone: string
): Promise<number> {
  // 숫자만 남기기 (안전장치)
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) return 0;

  // phone이 일치하고 아직 유저가 연결되지 않은 선수들 조회
  const unlinked = await prisma.tournamentTeamPlayer.findMany({
    where: {
      phone: cleanPhone,
      userId: null,
    },
    select: {
      id: true,
      tournamentTeamId: true,
    },
  });

  if (unlinked.length === 0) return 0;

  // 같은 팀에 이미 해당 userId로 등록된 선수가 있는지 확인
  // (tournamentTeamId, userId) 유니크 제약 위반 방지
  const alreadyLinked = await prisma.tournamentTeamPlayer.findMany({
    where: {
      userId,
      tournamentTeamId: { in: unlinked.map((p) => p.tournamentTeamId) },
    },
    select: { tournamentTeamId: true },
  });

  // 이미 연결된 팀 ID 셋
  const linkedTeamIds = new Set(alreadyLinked.map((p) => p.tournamentTeamId));

  // 중복이 아닌 선수들만 필터링
  const toLink = unlinked.filter((p) => !linkedTeamIds.has(p.tournamentTeamId));

  if (toLink.length === 0) return 0;

  // 한 번에 업데이트 (각각의 ID로)
  const result = await prisma.tournamentTeamPlayer.updateMany({
    where: {
      id: { in: toLink.map((p) => p.id) },
    },
    data: { userId },
  });

  return result.count;
}
