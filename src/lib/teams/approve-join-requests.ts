import { prisma } from "@/lib/db/prisma";

/**
 * 가입 신청 일괄 처리 (운영 + 박제 작업 공용)
 *
 * 한 번의 트랜잭션으로 여러 가입 신청을 일괄 처리한다.
 * 멱등성 보장 — 이미 approved/rejected 상태인 신청은 skip.
 *
 * **3가지 액션**:
 * - `approve_with_jersey`: team_members 등록(jersey 부여) + 옵션으로 tt_players 동시 등록
 * - `approve_no_jersey`: team_members 등록(jersey=null, 비활성 멤버용)
 * - `reject`: 거절 사유 기록
 *
 * **사용 예** (슬로우 케이스 그대로):
 * ```ts
 * const result = await approveJoinRequests([
 *   { type: "approve_with_jersey", requestId: 185n, jerseyNumber: 1,
 *     playerName: "강찬영", tournamentTeamId: 246n },
 *   { type: "approve_no_jersey", requestId: 127n },
 *   { type: "reject", requestId: 178n, reason: "이미 등록" },
 * ]);
 * ```
 *
 * **참고**:
 * - `tt_players` INSERT 는 `tournamentTeamId` 명시 시에만 (대회 출전 명단 자동 등록).
 * - `playerName` 미지정 시 User.name → User.nickname → null 순으로 fallback.
 * - 중복 INSERT 차단: team_members `(teamId, userId)` UNIQUE / tt_players `(tournamentTeamId, userId)` UNIQUE 검사 후 skip.
 */

export type ApproveAction =
  | {
      type: "approve_with_jersey";
      requestId: bigint;
      jerseyNumber: number;
      playerName?: string;
      tournamentTeamId?: bigint;
    }
  | {
      type: "approve_no_jersey";
      requestId: bigint;
    }
  | {
      type: "reject";
      requestId: bigint;
      reason: string;
    };

export type ApproveResult = {
  approved: number;
  rejected: number;
  teamMembersCreated: number;
  ttPlayersCreated: number;
  skipped: Array<{ requestId: bigint; reason: string }>;
  errors: Array<{ requestId: bigint; error: string }>;
};

export async function approveJoinRequests(
  actions: ApproveAction[],
  opts?: { processedById?: bigint }
): Promise<ApproveResult> {
  const result: ApproveResult = {
    approved: 0,
    rejected: 0,
    teamMembersCreated: 0,
    ttPlayersCreated: 0,
    skipped: [],
    errors: [],
  };

  await prisma.$transaction(
    async (tx) => {
      for (const action of actions) {
        try {
          // 1. 신청 조회 + 멱등성 체크
          const req = await tx.team_join_requests.findUnique({
            where: { id: action.requestId },
            select: {
              id: true,
              team_id: true,
              user_id: true,
              status: true,
            },
          });
          if (!req) {
            result.errors.push({ requestId: action.requestId, error: "신청 없음" });
            continue;
          }
          if (req.status !== "pending") {
            result.skipped.push({
              requestId: action.requestId,
              reason: `이미 ${req.status} 처리됨`,
            });
            continue;
          }

          // 2. reject 처리
          if (action.type === "reject") {
            await tx.team_join_requests.update({
              where: { id: action.requestId },
              data: {
                status: "rejected",
                processed_at: new Date(),
                processed_by_id: opts?.processedById,
                rejection_reason: action.reason,
              },
            });
            result.rejected++;
            continue;
          }

          // 3. approve 공통: 신청 status UPDATE
          await tx.team_join_requests.update({
            where: { id: action.requestId },
            data: {
              status: "approved",
              processed_at: new Date(),
              processed_by_id: opts?.processedById,
            },
          });
          result.approved++;

          // 4. team_members 중복 체크 후 INSERT
          const existingTm = await tx.teamMember.findFirst({
            where: { teamId: req.team_id, userId: req.user_id },
            select: { id: true },
          });
          if (!existingTm) {
            const jersey =
              action.type === "approve_with_jersey" ? action.jerseyNumber : null;
            await tx.teamMember.create({
              data: {
                teamId: req.team_id,
                userId: req.user_id,
                jerseyNumber: jersey,
                role: "member",
                status: "active",
                joined_at: new Date(),
              },
            });
            result.teamMembersCreated++;
          }

          // 5. tt_players INSERT (with_jersey + tournamentTeamId 지정 시)
          if (
            action.type === "approve_with_jersey" &&
            action.tournamentTeamId !== undefined
          ) {
            const existingTtp = await tx.tournamentTeamPlayer.findFirst({
              where: {
                tournamentTeamId: action.tournamentTeamId,
                userId: req.user_id,
              },
              select: { id: true },
            });
            if (!existingTtp) {
              // playerName fallback: User.name → User.nickname → null
              let playerName: string | null = action.playerName ?? null;
              if (!playerName) {
                const u = await tx.user.findUnique({
                  where: { id: req.user_id },
                  select: { name: true, nickname: true },
                });
                playerName = u?.name || u?.nickname || null;
              }
              await tx.tournamentTeamPlayer.create({
                data: {
                  tournamentTeamId: action.tournamentTeamId,
                  userId: req.user_id,
                  jerseyNumber: action.jerseyNumber,
                  player_name: playerName,
                  role: "player",
                  is_active: true,
                  auto_registered: true,
                },
              });
              result.ttPlayersCreated++;
            }
          }
        } catch (e) {
          result.errors.push({
            requestId: action.requestId,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    },
    { timeout: 60000 }
  );

  return result;
}
