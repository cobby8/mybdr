import { prisma } from "@/lib/db/prisma";
import { mergePlaceholderUser } from "@/lib/teams/merge-placeholder-user";

/**
 * 사전 생성 계정 병합 로직 (가입 hook 시점 자동 호출)
 *
 * 실제 사용자가 팀에 가입할 때, 같은 닉네임이면서
 * 한 번도 로그인하지 않은(사전 등록된) 멤버가 있으면
 * 등번호/포지션/역할을 이관하고 placeholder 의 모든 활동(ttp/tm) 을 real 로 이전한다.
 *
 * **2026-05-03 강화**: 내부에서 `mergePlaceholderUser` 호출 → ttp 통합 (stat/PBP 자동 보존)
 * + UNIQUE 우회 + nickname 변경 + status=merged 까지 일괄 처리.
 *
 * **호환성**: 반환 타입 (jerseyNumber/position/role) 기존 호출자 보호 위해 유지.
 *
 * 대상: @mybdr.temp, @placeholder.mybdr.kr, 실제 이메일이지만 미로그인 계정
 *
 * @param teamId 가입 대상 팀
 * @param realUserId 실제 가입자 user.id
 * @returns 이관된 데이터 { jerseyNumber, position, role } 또는 null (매칭 placeholder 없음)
 */
export async function mergeTempMember(
  teamId: bigint,
  realUserId: bigint,
): Promise<{ jerseyNumber: number | null; position: string | null; role: string | null } | null> {
  // 실제 사용자 nickname / name 둘 다 조회 (4가지 조합 매칭에 사용)
  const realUser = await prisma.user.findUnique({
    where: { id: realUserId },
    select: { nickname: true, name: true },
  });
  if (!realUser) return null;

  // 매칭 후보 값 수집 (빈 값/null 제거)
  // 이유: placeholder 의 nickname OR name 과, real user 의 nickname OR name 모두 교차 비교
  // 케이스 예시 — 백주익: real(nick=hifabric, name=백주익) ↔ placeholder(nick=백주익)
  // → real.name == placeholder.nickname 매칭으로 통합 가능
  const candidates: string[] = [];
  if (realUser.nickname) candidates.push(realUser.nickname);
  if (realUser.name && realUser.name !== realUser.nickname) candidates.push(realUser.name);
  if (candidates.length === 0) return null;

  // 같은 팀에서 placeholder 멤버 찾기 (4가지 조합 OR 매칭)
  // 안전 가드:
  // 1) userId not realUserId — 자기 자신 매칭 방지
  // 2) last_login_at: null — 한 번도 로그인 안 한 계정 (기존 가드 유지)
  // 3) provider='placeholder' OR email LIKE 'temp_%' — placeholder 임을 명시적으로 한정
  //    (실제 가입 후 미로그인 사용자가 우연히 동명이인일 경우 잘못 통합되는 것 방지)
  const tempMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: { not: realUserId },
      user: {
        last_login_at: null,
        // placeholder 식별 — provider 또는 temp 이메일
        OR: [{ provider: "placeholder" }, { email: { startsWith: "temp_" } }],
        // nickname / name 매칭 — 후보 값 모두에 대해 양쪽 컬럼 비교 (4가지 조합)
        AND: {
          OR: [
            { nickname: { in: candidates } },
            { name: { in: candidates } },
          ],
        },
      },
    },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!tempMember) return null;

  // 반환 데이터 (호출자 보호용 — 기존 시그니처)
  // ※ tempMember.jerseyNumber 는 mergePlaceholderUser 가 흡수해서 real tm 으로 이전.
  //   호출자는 이 반환값을 별도 처리할 필요 없음 (참고용 카운트 정도).
  const transferred = {
    jerseyNumber: tempMember.jerseyNumber,
    position: tempMember.position,
    role: tempMember.role !== "member" ? tempMember.role : null,
  };

  // ====== 강화: mergePlaceholderUser 위임 ======
  // ttp 통합 + UNIQUE 우회 + name 정규화 + status=merged 일괄 처리
  // ※ skipTmTransfer: true — 가입 hook 모드. ph tm 만 DELETE (호출자가 곧 teamMember.create 함)
  //                          → (team_id, user_id) UNIQUE 충돌 회피
  // realName = real.name (있으면) 또는 매칭된 candidate (placeholder 의 name/nickname)
  const realName = realUser.name ?? candidates[0] ?? undefined;
  await mergePlaceholderUser(tempMember.userId, realUserId, {
    realName,
    skipTmTransfer: true,
  });

  return transferred;
}
