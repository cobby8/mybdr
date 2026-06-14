/**
 * 시즌 시상(P1-b) 카테고리 단일 source.
 *
 * 왜 코드 상수인가:
 *   - DB는 category String @db.VarChar (enum 강제 X) — 향후 카테고리 추가 시 운영 DB ALTER 회피
 *     (court_type 와 동일 컨벤션). 화이트리스트 검증은 코드에서 담당.
 *   - admin 입력 폼(검증) + /awards 고급부 연결(렌더) 양쪽이 같은 정의를 봐야 표류 0.
 *
 * 8종 (설계서 season-awards-plan §c):
 *   all_star_1st · all_star_2nd · coach_of_year · new_face · mvp_quote ·
 *   best_defense · manner · rating_up
 */

// 카테고리 코드 8종 (DB category 값 화이트리스트)
export const SEASON_AWARD_CATEGORIES = [
  "all_star_1st",
  "all_star_2nd",
  "coach_of_year",
  "new_face",
  "mvp_quote",
  "best_defense",
  "manner",
  "rating_up",
] as const;

export type SeasonAwardCategory = (typeof SEASON_AWARD_CATEGORIES)[number];

// 카테고리 → 한글 라벨 (admin 폼 + /awards 표시 공용)
export const SEASON_AWARD_CATEGORY_LABELS: Record<SeasonAwardCategory, string> = {
  all_star_1st: "올스타 1st팀",
  all_star_2nd: "올스타 2nd팀",
  coach_of_year: "올해의 감독",
  new_face: "NEW FACE (신인상)",
  mvp_quote: "MVP 코멘트",
  best_defense: "수비왕",
  manner: "매너상",
  rating_up: "레이팅 상승",
};

// 카테고리당 다수 수상자 허용 여부 (올스타 5명 / 그 외 단일)
//   - admin 폼 안내 + display_order 운용에 사용
export const SEASON_AWARD_MULTI_SLOT: Record<SeasonAwardCategory, number> = {
  all_star_1st: 5,
  all_star_2nd: 5,
  coach_of_year: 1,
  new_face: 1,
  mvp_quote: 1,
  best_defense: 1,
  manner: 1,
  rating_up: 1,
};

// 화이트리스트 판정 (Zod refine / 수동 검증 공용)
export function isSeasonAwardCategory(v: unknown): v is SeasonAwardCategory {
  return (
    typeof v === "string" &&
    (SEASON_AWARD_CATEGORIES as readonly string[]).includes(v)
  );
}
