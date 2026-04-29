import { prisma } from "@/lib/db/prisma";

/**
 * 사용자가 게임 리포트를 작성/수정할 수 있는지 검증
 *
 * 조건: 게임 종료(status===3) + (호스트 OR 승인된 참가자)
 * - 게임 진행/예정 상태에서는 리포트 불가 (GAME_NOT_FINISHED)
 * - 호스트(organizer_id)는 항상 작성 가능 (isHost: true)
 * - 일반 사용자는 game_applications.status === 1 (approved)만 작성 가능
 */
export async function canReportGame(
  gameId: bigint,
  userId: bigint
): Promise<
  | { canReport: true; isHost: boolean }
  | { canReport: false; reason: "GAME_NOT_FINISHED" | "NOT_PARTICIPANT" | "GAME_NOT_FOUND" }
> {
  // 게임 존재 + 상태 확인 (필요한 컬럼만 select)
  const game = await prisma.games.findUnique({
    where: { id: gameId },
    select: { id: true, status: true, organizer_id: true },
  });
  if (!game) return { canReport: false, reason: "GAME_NOT_FOUND" };
  // status===3 은 "종료"를 의미. 그 외 상태는 리포트 작성 불가
  if (game.status !== 3) return { canReport: false, reason: "GAME_NOT_FINISHED" };

  // 호스트는 항상 작성 가능
  if (game.organizer_id === userId) {
    return { canReport: true, isHost: true };
  }

  // 일반 사용자: 승인된 참가 신청 내역이 있어야 함
  const application = await prisma.game_applications.findFirst({
    where: { game_id: gameId, user_id: userId, status: 1 }, // approved
    select: { id: true },
  });
  if (application) return { canReport: true, isHost: false };

  return { canReport: false, reason: "NOT_PARTICIPANT" };
}

/**
 * 24시간 수정 윈도우
 *
 * 리포트 작성 후 24h 이내에만 수정을 허용한다.
 * (race-condition 방지를 위해 createdAt 기준으로 절대시간 비교)
 */
export function canEditReport(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() < 24 * 60 * 60 * 1000;
}
