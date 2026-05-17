/**
 * 강남구협회장배 한정 승점 룰 헬퍼 (2026-05-17 박제).
 *
 * 사유: 대회 규정마다 승점 룰이 다름.
 * - 기본 대회: 승=3 / 패=0 (단순 승률 기반)
 * - 강남구협회장배: 점수차에 따른 가산점 분기 (i2 = 20/30점차, i3/i3w = 10/15점차)
 *
 * 박제 원칙:
 * - tournament.settings.points_rule = "gnba" 박제 시만 강남구 룰 적용 (= 다른 대회 회귀 0)
 * - divisionCode prefix 매칭 (i2-* / i3-* / i3w-* / 그 외)
 * - 무승부 / NULL score = 0 vs 0 (= FIBA 농구 무승부 미발생 / 안전 분기)
 */

export type PointsRuleScheme = "gnba" | "default";

export interface MatchPointsInput {
  homeScore: number | null;
  awayScore: number | null;
  divisionCode: string | null; // i2-* / i3-* / i3w-* / null
  pointsRule: PointsRuleScheme;
}

export interface MatchPointsResult {
  homePoints: number;
  awayPoints: number;
}

/**
 * 매치 1건의 home / away 승점 계산.
 *
 * 강남구 (pointsRule="gnba") 룰:
 * - 승리 = 3점 (기본)
 * - i2 종별 (divisionCode startsWith "i2"): 20점차↑ = 2점 / 30점차↑ = 1점
 * - i3 / i3w 종별 (startsWith "i3" — i3w 포함): 10점차↑ = 2점 / 15점차↑ = 1점
 * - 패배 = 0점
 *
 * default 룰 (그 외 대회):
 * - 승리 = 3점 / 패배 = 0점 (= 가산점 분기 없음)
 *
 * 무승부 = 둘 다 0점 (FIBA 농구 = 무승부 미발생 / 안전 분기)
 * NULL score = 둘 다 0점 (= 미입력 매치 영향 0)
 */
export function calculateMatchPoints(input: MatchPointsInput): MatchPointsResult {
  const { homeScore, awayScore, divisionCode, pointsRule } = input;

  // 무승부 / NULL = 둘 다 0
  if (homeScore == null || awayScore == null || homeScore === awayScore) {
    return { homePoints: 0, awayPoints: 0 };
  }

  // 점수차 산출 (절댓값)
  const winnerScore = Math.max(homeScore, awayScore);
  const loserScore = Math.min(homeScore, awayScore);
  const diff = winnerScore - loserScore;

  // 기본 승점 = 3 (default 룰 + 강남구 작은 점수차 기본값)
  let winnerPoints = 3;

  // 강남구 룰 분기 — divisionCode prefix 매칭
  if (pointsRule === "gnba" && divisionCode) {
    const code = divisionCode.toLowerCase();
    const isI2 = code.startsWith("i2");
    const isI3 = code.startsWith("i3"); // i3-* 와 i3w-* 모두 포함 (startsWith "i3")

    if (isI2) {
      // i2 종별: 20점차↑ = 2점 / 30점차↑ = 1점
      if (diff >= 30) winnerPoints = 1;
      else if (diff >= 20) winnerPoints = 2;
    } else if (isI3) {
      // i3 / i3w 종별: 10점차↑ = 2점 / 15점차↑ = 1점
      if (diff >= 15) winnerPoints = 1;
      else if (diff >= 10) winnerPoints = 2;
    }
    // i2 / i3 외 종별 = 기본 3점 (강남구 룰에 명시 없음)
  }

  // 승자 / 패자에 점수 분배
  const homePoints = homeScore > awayScore ? winnerPoints : 0;
  const awayPoints = awayScore > homeScore ? winnerPoints : 0;

  return { homePoints, awayPoints };
}
