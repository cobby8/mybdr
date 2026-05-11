// BDR 브랜드 색상 상수 (hardcode hex 단일화)
//
// 사용 컨텍스트:
//   - 대회 사이트 생성 wizard 의 primary_color / secondary_color 초기값
//   - 대회 사이트 색상 팔레트 (선택지)
//   - 기타 DB 박제용 hex 초기값 (CSS 변수 우회 컨텍스트)
//
// 위반: 컴포넌트 CSS 에서는 `var(--accent)` / `var(--bdr-red)` 토큰 사용.
//        본 상수는 "DB 박제 / 사용자 선택 미리보기" 등 hex 그대로 저장이 필요한 곳 전용.
// 출처: Dev/design/claude-project-knowledge/02-design-system-tokens.md §1-1

// BDR 브랜드 원색 — `#E31B23` (BDR Red). globals.css `--bdr-red` 와 동일.
export const BDR_PRIMARY_HEX = "#E31B23";

// 대회 사이트 secondary 기본 색상. 단순 호환을 위해 기존 hardcode 값을 그대로 박제.
// (브랜드 표준 secondary 가 별도 정해지면 본 값을 갱신.)
export const BDR_SECONDARY_HEX = "#E76F51";
