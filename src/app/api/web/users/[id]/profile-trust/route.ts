import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
// [M4 wave2] 등급 파생 로직을 공유 유틸로 추출 — page.tsx(prisma 직접 파생)와 임계값 단일 소스.
import { deriveMannerGrade } from "@/lib/games/manner-grade";

/**
 * GET /api/web/users/[id]/profile-trust — [M4] 공개 프로필 "신뢰 카드" 파생 데이터
 *
 * 무엇을 반환하는가(전부 파생 — schema 변경 0):
 *   - manner_grade       : 매너 등급 라벨("아주 좋음"/"좋음"/"보통"/"주의 필요"). 평가 0건이면 null.
 *   - manner_grade_key   : 등급 토큰 키("excellent"/"good"/"normal"/"caution"/null) — 프론트 색상/배지 매핑용.
 *   - mvp_count          : final_mvp_user_id = 이 유저인 games 수(받은 MVP 횟수).
 *   - games_played       : status=1(승인) AND attended_at != null 인 game_applications 수(실제 출석한 경기).
 *   - has_ratings        : manner_count > 0(매너 평가를 한 건이라도 받았는지).
 *
 * ⚠️ manner_score(Decimal) "숫자"는 절대 응답에 넣지 않는다 — 등급 라벨 + 토큰 키만 노출한다.
 *    (사용자에게 점수 숫자가 직접 비교/낙인 되지 않도록 추상화.)
 *
 * 응답 키는 snake_case(apiSuccess 가 자동 변환하나 키 자체를 snake 로 둔다).
 * 공개 프로필용이므로 followers/following 라우트와 동일하게 무인증 GET 패턴을 따른다.
 */

// 매너 등급 분기는 @/lib/games/manner-grade 로 추출됨(route·page 단일 소스).
//   ≥4.5 아주 좋음 / 4.0~4.4 좋음 / 3.0~3.9 보통 / <3.0 주의 필요. (평가 0건 → null)

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // id 정규화 — 양의 정수 문자열만 허용(잘못된 값은 422 로 명확히).
    //   BigInt 리터럴(0n) 대신 정규식 + 숫자 사전 검증으로 tsc target 호환.
    if (!/^[1-9][0-9]*$/.test(id)) {
      return apiError("유효하지 않은 사용자 id 입니다.", 422, "INVALID_USER_ID");
    }
    const userId = BigInt(id);

    // 대상 유저의 매너 점수/카운트 조회(점수 숫자는 등급 계산 후 버린다).
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { manner_score: true, manner_count: true },
    });
    if (!user) {
      return apiError("사용자를 찾을 수 없습니다.", 404, "NOT_FOUND");
    }

    // 파생 3종을 병렬 조회(서로 독립).
    //   - mvp_count   : games.final_mvp_user_id = userId
    //   - games_played: game_applications.status=1 AND attended_at != null (실제 출석)
    const [mvpCount, gamesPlayed] = await Promise.all([
      prisma.games.count({
        where: { final_mvp_user_id: userId },
      }),
      prisma.game_applications.count({
        where: { user_id: userId, status: 1, attended_at: { not: null } },
      }),
    ]);

    // manner_score(Decimal) → number 변환(등급 계산용). 응답에는 숫자를 넣지 않는다.
    const mannerScoreNum =
      user.manner_score !== null ? Number(user.manner_score) : null;
    const mannerCount = user.manner_count ?? 0;
    const grade = deriveMannerGrade(mannerScoreNum, mannerCount);

    return apiSuccess({
      manner_grade: grade.label, // 등급 라벨만(숫자 비노출)
      manner_grade_key: grade.key, // 토큰 키(프론트 색상 매핑)
      mvp_count: mvpCount,
      games_played: gamesPlayed,
      has_ratings: mannerCount > 0,
    });
  } catch {
    return apiError("신뢰 정보를 불러올 수 없습니다.", 500, "INTERNAL_ERROR");
  }
}
