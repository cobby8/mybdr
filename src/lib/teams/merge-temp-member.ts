import { prisma } from "@/lib/db/prisma";

/**
 * 사전 생성 계정 병합 로직
 *
 * 실제 사용자가 팀에 가입할 때, 같은 닉네임이면서
 * 한 번도 로그인하지 않은(사전 등록된) 멤버가 있으면
 * 등번호/포지션/역할을 이관하고 사전 등록 멤버를 제거한다.
 *
 * 대상: @mybdr.temp, @placeholder.mybdr.kr, 실제 이메일이지만 미로그인 계정
 *
 * @returns 이관된 데이터 { jerseyNumber, position, role } 또는 null
 */
export async function mergeTempMember(
  teamId: bigint,
  realUserId: bigint,
): Promise<{ jerseyNumber: number | null; position: string | null; role: string | null } | null> {
  // 실제 사용자 닉네임 조회
  const realUser = await prisma.user.findUnique({
    where: { id: realUserId },
    select: { nickname: true, name: true },
  });
  if (!realUser) return null;

  const realName = realUser.nickname || realUser.name;
  if (!realName) return null;

  // 같은 팀에서 같은 닉네임 + 한 번도 로그인 안 한 멤버 찾기
  const tempMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: { not: realUserId },
      user: {
        last_login_at: null,
        OR: [{ nickname: realName }, { name: realName }],
      },
    },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!tempMember) return null;

  const transferred = {
    jerseyNumber: tempMember.jerseyNumber,
    position: tempMember.position,
    role: tempMember.role !== "member" ? tempMember.role : null,
  };

  const tempUserId = tempMember.userId;

  // 임시 멤버 삭제 + members_count 감소 (트랜잭션)
  await prisma.$transaction([
    prisma.teamMember.delete({ where: { id: tempMember.id } }),
    prisma.team.update({
      where: { id: teamId },
      data: { members_count: { decrement: 1 } },
    }),
  ]);

  // 사전 생성 사용자가 다른 팀에도 속해있는지 확인
  const otherMemberships = await prisma.teamMember.count({
    where: { userId: tempUserId },
  });
  if (otherMemberships === 0) {
    // 다른 팀 소속이 없으면 비활성화
    await prisma.user.update({
      where: { id: tempUserId },
      data: { status: "merged" },
    });
  }

  return transferred;
}
