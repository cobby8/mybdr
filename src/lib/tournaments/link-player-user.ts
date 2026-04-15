import { prisma } from "@/lib/db/prisma";

/**
 * 대회 선수(TournamentTeamPlayer)의 userId를 자동으로 연결하는 배치 함수
 *
 * 로직: 같은 팀(Team)의 TeamMember 중에서 nickname 또는 name이
 * player_name과 일치하는 유저를 찾아 userId를 설정
 *
 * @param tournamentTeamId - TournamentTeam의 id (BigInt)
 * @returns 연결된 선수 수
 */
export async function linkPlayersToUsers(
  tournamentTeamId: bigint
): Promise<number> {
  // 1) 해당 대회팀의 원본 팀ID 조회 (Team 테이블과의 연결고리)
  const tournamentTeam = await prisma.tournamentTeam.findUnique({
    where: { id: tournamentTeamId },
    select: { teamId: true },
  });
  if (!tournamentTeam) return 0;

  // 2) userId가 아직 연결 안 된 대회 선수만 조회
  const unlinkedPlayers = await prisma.tournamentTeamPlayer.findMany({
    where: { tournamentTeamId, userId: null },
    select: { id: true, player_name: true },
  });
  if (unlinkedPlayers.length === 0) return 0;

  // 3) 같은 팀의 활성 멤버 조회 (userId + 닉네임/이름)
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId: tournamentTeam.teamId, status: "active" },
    include: { user: { select: { id: true, nickname: true, name: true } } },
  });

  // 4) 이름 매칭으로 userId 연결
  // - 정확히 1명만 매칭될 때만 연결 (동명이인 방지)
  // - unique 제약 (tournamentTeamId, userId) 위반 방지
  let linked = 0;

  // 이미 연결된 userId 목록 (중복 방지용)
  const existingUserIds = new Set(
    (
      await prisma.tournamentTeamPlayer.findMany({
        where: { tournamentTeamId, userId: { not: null } },
        select: { userId: true },
      })
    ).map((p) => p.userId!.toString())
  );

  for (const player of unlinkedPlayers) {
    if (!player.player_name) continue;

    // 닉네임 또는 이름이 player_name과 정확히 일치하는 멤버 찾기
    const matches = teamMembers.filter(
      (m) =>
        m.user &&
        (m.user.nickname === player.player_name ||
          m.user.name === player.player_name)
    );

    // 정확히 1명만 매칭되고, 아직 이 대회팀에 연결 안 된 유저일 때만
    if (matches.length === 1 && matches[0].user) {
      const matchedUserId = matches[0].user.id;

      // unique 제약 위반 방지: 이미 같은 대회팀에 연결된 userId인지 확인
      if (existingUserIds.has(matchedUserId.toString())) continue;

      try {
        await prisma.tournamentTeamPlayer.update({
          where: { id: player.id },
          data: { userId: matchedUserId },
        });
        existingUserIds.add(matchedUserId.toString());
        linked++;
      } catch {
        // unique 제약 등 에러 시 무시하고 다음 선수로 진행
        continue;
      }
    }
  }

  return linked;
}

/**
 * 단일 선수에 대해 userId 매칭 시도
 * 현장 등록(v1 API) 시 호출용 -- 선수 생성 전에 미리 매칭할 userId를 찾음
 *
 * @param playerName - 선수 이름
 * @param teamId - Team의 id (BigInt) -- TournamentTeam.teamId
 * @param tournamentTeamId - 중복 체크용 TournamentTeam의 id (BigInt)
 * @returns 매칭된 userId 또는 null
 */
export async function findUserIdByName(
  playerName: string,
  teamId: bigint,
  tournamentTeamId: bigint
): Promise<bigint | null> {
  if (!playerName) return null;

  // 같은 팀의 활성 멤버 중 이름이 일치하는 유저 검색
  const members = await prisma.teamMember.findMany({
    where: {
      teamId,
      status: "active",
      user: {
        OR: [{ nickname: playerName }, { name: playerName }],
      },
    },
    select: { userId: true },
  });

  // 매칭 후보가 정확히 1명이 아니면 안전하게 null 반환
  if (members.length !== 1) return null;

  const matchedUserId = members[0].userId;

  // unique 제약 방지: 이미 같은 대회팀에 연결된 userId인지 확인
  const alreadyLinked = await prisma.tournamentTeamPlayer.findFirst({
    where: { tournamentTeamId, userId: matchedUserId },
  });
  if (alreadyLinked) return null;

  return matchedUserId;
}
