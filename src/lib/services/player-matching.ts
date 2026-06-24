import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

type LinkedPlayerForMembership = {
  id: bigint;
  tournamentTeamId: bigint;
  jerseyNumber: number | null;
  position: string | null;
  tournamentTeam: { teamId: bigint };
};

async function ensureTeamMemberForLinkedPlayer(
  tx: Prisma.TransactionClient,
  player: LinkedPlayerForMembership,
  userId: bigint,
): Promise<boolean> {
  const teamId = player.tournamentTeam.teamId;
  let jerseyNumber = player.jerseyNumber;

  if (jerseyNumber !== null) {
    const jerseyConflict = await tx.teamMember.findFirst({
      where: {
        teamId,
        jerseyNumber,
        userId: { not: userId },
        status: "active",
      },
      select: { id: true },
    });
    if (jerseyConflict) jerseyNumber = null;
  }

  const existing = await tx.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId } },
    select: {
      id: true,
      status: true,
      joined_at: true,
      jerseyNumber: true,
      position: true,
    },
  });

  if (existing) {
    const data: Prisma.TeamMemberUpdateInput = {};
    if (existing.status !== "active") data.status = "active";
    if (!existing.joined_at) data.joined_at = new Date();
    data.left_at = null;
    if (existing.jerseyNumber === null && jerseyNumber !== null) {
      data.jerseyNumber = jerseyNumber;
    }
    if (!existing.position && player.position) data.position = player.position;

    if (Object.keys(data).length > 0) {
      await tx.teamMember.update({ where: { id: existing.id }, data });
    }
    return false;
  }

  await tx.teamMember.create({
    data: {
      teamId,
      userId,
      role: "member",
      status: "active",
      joined_at: new Date(),
      ...(jerseyNumber !== null ? { jerseyNumber } : {}),
      ...(player.position ? { position: player.position } : {}),
    },
  });
  await tx.team.update({
    where: { id: teamId },
    data: { members_count: { increment: 1 } },
  });
  return true;
}

export async function ensureTeamMemberForTournamentPlayer(
  userId: bigint,
  tournamentTeamPlayerId: bigint,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const player = await tx.tournamentTeamPlayer.findUnique({
      where: { id: tournamentTeamPlayerId },
      select: {
        id: true,
        tournamentTeamId: true,
        jerseyNumber: true,
        position: true,
        tournamentTeam: { select: { teamId: true } },
      },
    });
    if (!player) return false;
    return ensureTeamMemberForLinkedPlayer(tx, player, userId);
  });
}

/**
 * 전화번호 기반 선수-유저 자동 매칭.
 *
 * 현장 등록 선수는 TournamentTeamPlayer.phone에 숫자만 저장하고 userId는 비워둔다.
 * 실제 사용자가 가입/본인인증을 완료하면 인증된 전화번호로 미연결 선수를 찾아
 * userId를 연결하고, 해당 실제 팀(TeamMember)에도 자동 가입시킨다.
 */
export async function matchPlayersByPhone(
  userId: bigint,
  phone: string,
): Promise<number> {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  if (!cleanPhone) return 0;

  const unlinked = await prisma.tournamentTeamPlayer.findMany({
    where: {
      phone: cleanPhone,
      userId: null,
    },
    select: {
      id: true,
      tournamentTeamId: true,
      jerseyNumber: true,
      position: true,
      tournamentTeam: { select: { teamId: true } },
    },
  });

  if (unlinked.length === 0) return 0;

  const alreadyLinked = await prisma.tournamentTeamPlayer.findMany({
    where: {
      userId,
      tournamentTeamId: { in: unlinked.map((p) => p.tournamentTeamId) },
    },
    select: { tournamentTeamId: true },
  });

  const linkedTeamIds = new Set(alreadyLinked.map((p) => p.tournamentTeamId));
  const toLink = unlinked.filter((p) => !linkedTeamIds.has(p.tournamentTeamId));
  if (toLink.length === 0) return 0;

  let linked = 0;
  for (const player of toLink) {
    try {
      await prisma.$transaction(async (tx) => {
        await tx.tournamentTeamPlayer.update({
          where: { id: player.id },
          data: {
            userId,
            claim_status: "claimed",
            claimed_user_id: userId,
            claimed_at: new Date(),
          },
        });
        await ensureTeamMemberForLinkedPlayer(tx, player, userId);
      });
      linked++;
    } catch (error) {
      console.warn("[player-matching] phone match skipped", {
        userId: userId.toString(),
        tournamentTeamPlayerId: player.id.toString(),
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return linked;
}
