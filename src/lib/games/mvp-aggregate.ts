import { prisma } from "@/lib/db/prisma";

/**
 * 게임의 final_mvp_user_id 재계산 + 캐시 갱신
 *
 * 알고리즘
 * 1. game_reports 의 mvp_user_id 다수결 (NULL 제외)
 * 2. 동률이면 game_player_ratings.rating 평균 최고인 후보 선정
 * 3. 그래도 fallback 필요 시 첫 번째 후보 (idempotent)
 *
 * 호출 타이밍: 리포트 생성/수정/삭제 직후
 */
export async function recomputeFinalMvp(gameId: bigint): Promise<bigint | null> {
  // 1단계: MVP 표(다수결) 집계 — NULL 표는 제외
  const tally = await prisma.game_reports.groupBy({
    by: ["mvp_user_id"],
    where: { game_id: gameId, mvp_user_id: { not: null } },
    _count: { mvp_user_id: true },
    orderBy: { _count: { mvp_user_id: "desc" } },
  });

  // 표가 하나도 없으면 final_mvp_user_id 를 null 로 클리어
  if (tally.length === 0) {
    await prisma.games.update({
      where: { id: gameId },
      data: { final_mvp_user_id: null },
    });
    return null;
  }

  // 최다 득표 수 추출 + 동률 후보 필터
  const topCount = tally[0]._count.mvp_user_id;
  const topCandidates = tally.filter((t) => t._count.mvp_user_id === topCount);

  let finalMvp: bigint;
  if (topCandidates.length === 1) {
    // 단독 1위 — 즉시 확정
    finalMvp = topCandidates[0].mvp_user_id!;
  } else {
    // 동률 — 평점 평균 최고 후보로 tie-break
    const candidateIds = topCandidates.map((c) => c.mvp_user_id!).filter(Boolean);
    const ratingAvgs = await prisma.game_player_ratings.groupBy({
      by: ["rated_user_id"],
      where: {
        rated_user_id: { in: candidateIds },
        // 같은 게임의 리포트에 달린 평점만 집계 (relation filter)
        report: { game_id: gameId },
      },
      _avg: { rating: true },
      orderBy: { _avg: { rating: "desc" } },
    });
    // 평점 데이터가 있으면 평균 최고 사용자 / 없으면 idempotent fallback
    finalMvp =
      ratingAvgs.length > 0 && ratingAvgs[0]._avg.rating !== null
        ? ratingAvgs[0].rated_user_id
        : candidateIds[0];
  }

  // games.final_mvp_user_id 캐시 갱신
  await prisma.games.update({
    where: { id: gameId },
    data: { final_mvp_user_id: finalMvp },
  });
  return finalMvp;
}

/**
 * users.manner_score / manner_count 캐시 갱신 (옵션)
 *
 * - 모든 game_player_ratings 누적 평균을 사용자 매너 점수로 캐시
 * - 소수점 2자리로 반올림하여 저장 (스키마 Decimal/String 호환)
 * - 평점이 하나도 없으면 manner_score 는 null, manner_count 는 0
 */
export async function recomputeMannerScore(userId: bigint): Promise<void> {
  const stats = await prisma.game_player_ratings.aggregate({
    where: { rated_user_id: userId },
    _avg: { rating: true },
    _count: { rating: true },
  });

  // Prisma 스키마에서 유저 모델은 단수형 `User` (테이블은 @@map("users"))
  await prisma.user.update({
    where: { id: userId },
    data: {
      manner_score: stats._avg.rating ? stats._avg.rating.toFixed(2) : null,
      manner_count: stats._count.rating,
    },
  });
}
