/* ============================================================
 * SectionKey — Settings 7 섹션 키 + 폴백 매핑 (v2.3 재구성)
 *
 * 왜 (2026-05-01 갱신):
 *  - 시안 v2.3 Settings 재구성으로 6 섹션 → 7 섹션 변경:
 *      삭제: profile / privacy (사용자 결정 B3-fallback)
 *      신규: feed / bottomNav / display (사용자 결정 A1/C3/D2)
 *  - URL 쿼리 ?section=... 의 합법 값을 한 곳에 집중 → 페이지/네비/섹션이
 *    같은 source of truth 를 공유.
 *  - 외부 링크/북마크 호환성 유지 — 기존 ?tab=preferences|notifications + 옛 ?section=profile|privacy 폴백.
 *
 * 어떻게:
 *  - SectionKey 유니언 타입 + VALID_SECTIONS 상수.
 *  - resolveSection(rawSection, rawTab) 으로 우선순위 결정:
 *      1. ?section=... 가 유효하면 그대로
 *      2. 옛 섹션 키 폴백: profile → account / privacy → account
 *      3. 없으면 ?tab=preferences → "feed" (Q1=① 결정)
 *                ?tab=notifications → "notify"
 *      4. 그 외 기본 "account"
 * ============================================================ */

export type SectionKey =
  | "account"
  | "feed"
  | "notify"
  | "bottomNav"
  | "billing"
  | "display"
  | "danger";

export const VALID_SECTIONS: readonly SectionKey[] = [
  "account",
  "feed",
  "notify",
  "bottomNav",
  "billing",
  "display",
  "danger",
] as const;

// 외부에서 들어오는 임의의 문자열을 안전한 SectionKey 로 좁힘.
export function resolveSection(
  rawSection: string | null,
  rawTab: string | null,
): SectionKey {
  if (rawSection && (VALID_SECTIONS as readonly string[]).includes(rawSection)) {
    return rawSection as SectionKey;
  }
  // 옛 섹션 키 폴백 (v2.3 재구성으로 삭제된 것)
  // - profile / privacy → "account" (본인인증·공개 범위 모두 account 보안 영역으로 흡수)
  if (rawSection === "profile" || rawSection === "privacy") return "account";

  // 기존 ?tab= 호환:
  // - preferences (옛 맞춤설정) → 신규 "feed" (Q1=① 결정으로 redirect 매핑도 변경됨)
  // - notifications → "notify"
  if (rawTab === "preferences") return "feed";
  if (rawTab === "notifications") return "notify";
  return "account";
}
