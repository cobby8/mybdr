import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Placeholder ↔ Real User 통합 (일반화 함수)
 *
 * 같은 사람이 placeholder 계정 + real 계정 두 개로 분리되어 있을 때,
 * placeholder 의 모든 활동(ttp/tm)을 real 로 이전하고 placeholder 는 status=merged.
 *
 * **stat/PBP 자동 보존**: ttp.id 변경 0 → MatchPlayerStat / play_by_plays 의 FK 그대로 유지.
 *
 * 단계 (트랜잭션 1회):
 * 1. ph 의 모든 ttp → real userId UPDATE
 *    - 충돌 시 (`(tournamentTeamId, userId)` UNIQUE) skip + 카운트
 *    - opts.realName 지정 시 ttp.player_name 도 함께 update
 * 2. ph 의 모든 tm → real 에 통합
 *    - real 이 같은 팀 이미 멤버 → ph DELETE 먼저, real jersey 흡수 (real 이 null 일 때만)
 *      ※ `(team_id, jersey_number)` UNIQUE 우회를 위해 DELETE → UPDATE 순서 필수
 *    - real 미가입 → ph tm 의 userId UPDATE
 * 3. real user.name set (null 일 때만, 기존 값 보존)
 * 4. ph user nickname `{realName}_merged_{phUid}` 변경 + status=merged
 *    ※ `(nickname)` UNIQUE 우회를 위해 nickname 도 함께 변경 필수
 *
 * **잔여 참조** (community_posts/team_follows/notifications/comments) 는 Phase 2 별도 작업.
 *
 * **호출 시 사용자 책임**:
 * - phUid 와 realUid 가 **확실히 같은 사람** 임을 사전 검증할 것.
 * - 동명이인 위험 — real 이 다른 팀에서 활발한 ttp 를 가지고 있으면 동명이인 가능성 높음.
 *
 * @param phUid placeholder user.id
 * @param realUid real user.id
 * @param opts.realName 지정 시 ttp.player_name + real.name (null 일 때만) set
 * @param opts.skipTmTransfer true 면 ph tm 을 DELETE 만 (호출자가 별도 teamMember.create 함)
 *                            기본값 false (운영 backfill 용 — tm transfer/absorb 까지 처리)
 *                            ※ `mergeTempMember` (가입 hook) 는 호출자가 create 하므로 true 로 호출
 * @returns 처리 결과 통계
 */
export type MergePlaceholderResult = {
  ttpsTransferred: number;
  ttpsSkipped: number;
  tmsTransferred: number;
  tmsAbsorbed: number;
  tmsDeleted: number;
  realNameSet: boolean;
};

export async function mergePlaceholderUser(
  phUid: bigint,
  realUid: bigint,
  opts?: { realName?: string; skipTmTransfer?: boolean },
): Promise<MergePlaceholderResult> {
  // 사전 검증
  if (phUid === realUid) {
    throw new Error(`mergePlaceholderUser: phUid(${phUid}) === realUid (자기 자신 통합 불가)`);
  }
  const ph = await prisma.user.findUnique({
    where: { id: phUid },
    select: { id: true, status: true },
  });
  const real = await prisma.user.findUnique({
    where: { id: realUid },
    select: { id: true, status: true },
  });
  if (!ph) throw new Error(`mergePlaceholderUser: phUid=${phUid} 존재 안 함`);
  if (!real) throw new Error(`mergePlaceholderUser: realUid=${realUid} 존재 안 함`);
  if (ph.status === "merged") {
    throw new Error(`mergePlaceholderUser: phUid=${phUid} 이미 merged`);
  }
  if (real.status === "merged") {
    throw new Error(`mergePlaceholderUser: realUid=${realUid} 이미 merged`);
  }

  return await prisma.$transaction(
    async (tx) => {
      const result: MergePlaceholderResult = {
        ttpsTransferred: 0,
        ttpsSkipped: 0,
        tmsTransferred: 0,
        tmsAbsorbed: 0,
        tmsDeleted: 0,
        realNameSet: false,
      };

      // ========== [1] ttp transfer ==========
      const phTtps = await tx.tournamentTeamPlayer.findMany({
        where: { userId: phUid },
        select: { id: true, tournamentTeamId: true },
      });
      for (const ttp of phTtps) {
        // (tournamentTeamId, userId) UNIQUE 충돌 검사
        const conflict = await tx.tournamentTeamPlayer.findFirst({
          where: { tournamentTeamId: ttp.tournamentTeamId, userId: realUid },
          select: { id: true },
        });
        if (conflict) {
          result.ttpsSkipped++;
          continue;
        }
        const data: Prisma.TournamentTeamPlayerUpdateInput = {
          users: { connect: { id: realUid } },
        };
        if (opts?.realName) {
          data.player_name = opts.realName;
        }
        await tx.tournamentTeamPlayer.update({
          where: { id: ttp.id },
          data,
        });
        result.ttpsTransferred++;
      }

      // ========== [2] tm 처리 ==========
      const phTms = await tx.teamMember.findMany({
        where: { userId: phUid },
        select: { id: true, teamId: true, jerseyNumber: true },
      });
      for (const tm of phTms) {
        if (opts?.skipTmTransfer) {
          // 가입 hook 모드: 호출자가 곧 teamMember.create + team.members_count increment
          // → ph tm DELETE + members_count decrement 로 net 0 보장
          await tx.teamMember.delete({ where: { id: tm.id } });
          await tx.team.update({
            where: { id: tm.teamId },
            data: { members_count: { decrement: 1 } },
          });
          result.tmsDeleted++;
          continue;
        }

        // 운영 backfill 모드: tm transfer/absorb
        const realTm = await tx.teamMember.findFirst({
          where: { teamId: tm.teamId, userId: realUid },
          select: { id: true, jerseyNumber: true },
        });
        if (realTm) {
          // real 이 같은 팀 이미 멤버
          // (team_id, jersey_number) UNIQUE 우회: DELETE 먼저, jersey UPDATE 나중
          const phJersey = tm.jerseyNumber;
          const realHasNoJersey = realTm.jerseyNumber == null;
          await tx.teamMember.delete({ where: { id: tm.id } });
          if (phJersey != null && realHasNoJersey) {
            await tx.teamMember.update({
              where: { id: realTm.id },
              data: { jerseyNumber: phJersey },
            });
          }
          result.tmsAbsorbed++;
        } else {
          // real 미가입 → ph tm 의 userId UPDATE
          await tx.teamMember.update({
            where: { id: tm.id },
            data: { user: { connect: { id: realUid } } },
          });
          result.tmsTransferred++;
        }
      }

      // ========== [3] real.name set (null 일 때만) ==========
      if (opts?.realName) {
        const realUser = await tx.user.findUnique({
          where: { id: realUid },
          select: { name: true },
        });
        if (!realUser?.name) {
          await tx.user.update({
            where: { id: realUid },
            data: { name: opts.realName },
          });
          result.realNameSet = true;
        }
      }

      // ========== [4] ph user nickname unique 풀기 + status=merged ==========
      const mergedNickname = `${opts?.realName ?? "merged"}_${phUid}`;
      await tx.user.update({
        where: { id: phUid },
        data: {
          status: "merged",
          nickname: mergedNickname,
        },
      });

      return result;
    },
    { timeout: 30000 },
  );
}

/**
 * Placeholder 식별 — email 패턴으로 판별
 * (운영 backfill / 통합 도구에서 사용)
 */
export function isPlaceholderEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.toLowerCase();
  return (
    e.endsWith("@bdr.placeholder") ||
    e.endsWith("@mybdr.temp") ||
    e.startsWith("temp_") ||
    e.startsWith("placeholder-")
  );
}

/**
 * Placeholder nickname 표식 (status=merged 후) 패턴
 * — 검색/디버깅 시 활용
 */
export function getMergedNicknamePattern(realName: string, phUid: bigint): string {
  return `${realName}_merged_${phUid}`;
}
