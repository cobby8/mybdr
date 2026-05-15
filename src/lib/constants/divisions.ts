/**
 * BDR 디비전 규정 기준 (2025.07.15 카페 공지)
 *
 * 디비전 체계:
 * - 일반부 (D시리즈): D3~D8, 숫자 작을수록 상위
 * - 유청소년 (i시리즈): 하모니, i1~i4
 * - 대학부 (U시리즈): U1~U3
 * - 시니어 (S시리즈): S1~S3
 *
 * 여성부: 모든 디비전 코드 뒤에 "W" 추가 (예: D3W, i1W)
 *
 * 상위리그 출전권:
 * - 24팀 대회: 4장
 * - 12팀 대회: 2장
 */

// ─── 타입 정의 ────────────────────────────────────────
export type GenderCode = "male" | "female";
export type CategoryCode = "general" | "youth" | "university" | "senior";
// 디비전 코드는 여성부 접미사(W) 등 동적 조합이라 union 대신 string 사용
export type DivisionCode = string;

// ─── 성별 (혼성 없음) ─────────────────────────────────
export const GENDERS = {
  male: { label: "남성", code: "male" as const },
  female: { label: "여성", code: "female" as const },
} as const;

// ─── 종별 (카테고리) ──────────────────────────────────
// divisionPrefix: 해당 종별의 디비전 코드 접두어
export const CATEGORIES = {
  general: { label: "일반부", code: "general" as const, divisionPrefix: "D" },
  youth: { label: "유청소년", code: "youth" as const, divisionPrefix: "i" },
  university: { label: "대학부", code: "university" as const, divisionPrefix: "U" },
  senior: { label: "시니어", code: "senior" as const, divisionPrefix: "S" },
} as const;

// ─── 디비전 상세 정보 타입 ────────────────────────────
export interface DivisionInfo {
  label: string;
  leagueName: string | null;
  ranking: string | null;
  selection: string | null;
  registration: string | null;
  tier: number;
  category: CategoryCode;
  description?: string;
  // 여성부 여부 (W 접미사)
  gender: GenderCode;
}

// ─── 일반부 (D 시리즈) ────────────────────────────────
// D3~D8: 숫자가 작을수록 상위 디비전
const GENERAL_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  D3: {
    label: "D3",
    leagueName: "동호회 최강전",
    ranking: "30위",
    selection: "2명",
    registration: "등록",
    tier: 1,
    category: "general",
  },
  D4: {
    label: "D4",
    leagueName: "챌린저스",
    ranking: "100위",
    selection: "1명",
    registration: "등록",
    tier: 2,
    category: "general",
  },
  D5: {
    label: "D5",
    leagueName: "비기너스",
    ranking: "100위 밖",
    selection: "없음",
    registration: "등록권장",
    tier: 3,
    category: "general",
  },
  D6: {
    label: "D6",
    leagueName: "뉴비",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 4,
    category: "general",
    description: "신생팀/대회경험 부족팀/대학부→일반부 도전팀",
  },
  D7: {
    label: "D7",
    leagueName: "스타터스",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 5,
    category: "general",
    description: "농구교실팀(초급)/동네 농구만 하던 분들/유니폼 없이 참가 가능",
  },
  D8: {
    label: "D8",
    leagueName: "아카데미",
    ranking: null,
    selection: "없음",
    registration: "비등록",
    tier: 6,
    category: "general",
  },
};

// ─── 유청소년 (i 시리즈) ──────────────────────────────
const YOUTH_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  하모니: {
    label: "하모니",
    leagueName: "하모니",
    ranking: null,
    selection: null,
    registration: null,
    tier: 0,
    category: "youth",
    description: "엘리트 초등학교팀 + 최상위권 유소년 클럽",
  },
  i1: { label: "i1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "youth" },
  i2: { label: "i2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "youth" },
  i3: { label: "i3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "youth" },
  i4: { label: "i4", leagueName: null, ranking: null, selection: null, registration: null, tier: 4, category: "youth" },
};

// ─── 대학부 (U 시리즈) ────────────────────────────────
const UNIVERSITY_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  U1: { label: "U1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "university" },
  U2: { label: "U2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "university" },
  U3: { label: "U3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "university" },
};

// ─── 시니어 (S 시리즈) ────────────────────────────────
const SENIOR_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  S1: { label: "S1", leagueName: null, ranking: null, selection: null, registration: null, tier: 1, category: "senior" },
  S2: { label: "S2", leagueName: null, ranking: null, selection: null, registration: null, tier: 2, category: "senior" },
  S3: { label: "S3", leagueName: null, ranking: null, selection: null, registration: null, tier: 3, category: "senior" },
};

// ─── 남성부 기본 디비전 통합 ──────────────────────────
// 모든 종별의 남성부 디비전을 하나의 맵으로 합침
const BASE_DIVISIONS: Record<string, Omit<DivisionInfo, "gender">> = {
  ...GENERAL_DIVISIONS,
  ...YOUTH_DIVISIONS,
  ...UNIVERSITY_DIVISIONS,
  ...SENIOR_DIVISIONS,
};

// ─── 여성부 디비전 자동 생성 ──────────────────────────
// 모든 디비전 코드 뒤에 "W"를 붙여 여성부 디비전 생성
function buildWomenDivisions(
  base: Record<string, Omit<DivisionInfo, "gender">>
): Record<string, Omit<DivisionInfo, "gender">> {
  const result: Record<string, Omit<DivisionInfo, "gender">> = {};
  for (const [code, info] of Object.entries(base)) {
    result[`${code}W`] = {
      ...info,
      label: `${info.label}W`, // 레이블에도 W 추가
    };
  }
  return result;
}

const WOMEN_DIVISIONS = buildWomenDivisions(BASE_DIVISIONS);

// ─── 전체 디비전 맵 (성별 포함) ──────────────────────
// 남성부 + 여성부 모든 디비전을 gender 정보와 함께 통합
const ALL_DIVISIONS_MAP: Record<string, DivisionInfo> = {};

// 남성부 등록
for (const [code, info] of Object.entries(BASE_DIVISIONS)) {
  ALL_DIVISIONS_MAP[code] = { ...info, gender: "male" };
}
// 여성부 등록
for (const [code, info] of Object.entries(WOMEN_DIVISIONS)) {
  ALL_DIVISIONS_MAP[code] = { ...info, gender: "female" };
}

/** 전체 디비전 맵 (읽기 전용) */
export const DIVISIONS = ALL_DIVISIONS_MAP as Readonly<Record<string, DivisionInfo>>;

// ─── 종별별 기본(남성) 디비전 코드 목록 ──────────────
// 필터링 UI 등에서 종별 선택 시 해당 디비전만 보여줄 때 사용
const CATEGORY_DIVISION_CODES: Record<CategoryCode, string[]> = {
  general: Object.keys(GENERAL_DIVISIONS),
  youth: Object.keys(YOUTH_DIVISIONS),
  university: Object.keys(UNIVERSITY_DIVISIONS),
  senior: Object.keys(SENIOR_DIVISIONS),
};

// ─── 유틸 함수 ───────────────────────────────────────

/**
 * 디비전 코드로 상세 정보 조회.
 *
 * 2026-05-15 fallback 확장 (Phase 3.5 Q3=A 결재):
 *   1) 직접 lookup (기존 동작 — `"D3"`, `"i2W"`, `"하모니W"` 등) — 회귀 0
 *   2) 실패 시 `parseDivisionCode` 호출 → 결합 코드 (`"i2-U11"`) 파싱
 *   3) parse 결과의 `baseCode` 로 재 lookup → 미래 호출자에서 결합 코드 입력 시 안전
 *
 * 호출자 0건이지만 (commit `8d92c9d` 가 생성한 결합 코드 lookup 영구 차단 보호막).
 *
 * @param code - 디비전 코드 (예: "D3", "D3W", "하모니W", "i2-U11")
 * @returns 디비전 정보 또는 null
 */
export function getDivisionInfo(code: string): DivisionInfo | null {
  // 1) 직접 lookup 우선 — 일반 코드 ("D3"/"i2W") 성능 영향 0
  const direct = ALL_DIVISIONS_MAP[code];
  if (direct) return direct;

  // 2) 결합 코드 fallback ("i2-U11" → "i2" lookup)
  const parsed = parseDivisionCode(code);
  if (parsed && parsed.isCombined) {
    return ALL_DIVISIONS_MAP[parsed.baseCode] ?? null;
  }

  return null;
}

// ─── 결합 코드 파싱 (2026-05-15 Phase 3.5) ────────────────
// 사유: commit `8d92c9d` 으로 생성된 유청소년 결합 코드 ("i2-U11" 형식) 후속 안전 박제.
//   - 운영 매칭 (DB row findFirst) 영향 0 — 메모리 lookup 영향 0 (호출자 0건)
//   - 미래 호출자 (라벨 생성 / 필터 분기 / 정렬) 가 baseCode/age 분리 필요 시 단일 source
//   - Q2=A 결재: 4 필드 시그니처 (baseCode + age + gender + isCombined)
//   - Q5=A 결재: YOUTH_AGES strict 화이트리스트 ("U99" 같은 형식만 정규식 매칭 = null)

/**
 * `parseDivisionCode` 반환 타입.
 *
 * - `baseCode`: ALL_DIVISIONS_MAP lookup 가능한 코드 ("i2", "D3W", "하모니" 등)
 * - `age`: 결합 코드 시 YouthAge ("U11" 등), 아니면 null
 * - `gender`: baseCode 가 "W" 로 끝나면 female, 아니면 male
 * - `isCombined`: age !== null (편의 플래그 — 호출자 분기 단순화)
 */
export interface ParsedDivisionCode {
  baseCode: string;
  age: YouthAge | null;
  gender: GenderCode;
  isCombined: boolean;
}

/**
 * 디비전 코드 (단독 또는 결합) 를 구성 요소로 파싱.
 *
 * 룰 (Q5=A YOUTH_AGES strict 화이트리스트):
 *   1) null/undefined/empty/non-string → null
 *   2) 결합 형식 (`/^(.+)-(U\d{1,2})$/`) 매칭 + age ∈ YOUTH_AGES + baseCode ∈ ALL_DIVISIONS_MAP
 *      → `{ baseCode, age, gender, isCombined: true }`
 *   3) 단독 코드 + ALL_DIVISIONS_MAP 멤버 → `{ baseCode: code, age: null, gender, isCombined: false }`
 *   4) 이상 매칭 모두 실패 → null
 *
 * gender 계산: baseCode 가 "W" 로 끝나면 female (기존 `getGenderFromDivision` 룰 재사용).
 *
 * @param code - 디비전 코드 (예: "i2-U11" / "i2W-U11" / "D3" / "하모니W")
 * @returns 파싱 결과 또는 null
 */
export function parseDivisionCode(
  code: string | null | undefined,
): ParsedDivisionCode | null {
  // 1) null/undefined/empty/non-string 방어
  if (typeof code !== "string" || code.length === 0) return null;

  // 2) 결합 형식 시도 — base code + "-" + age ("U" + 1~2 digit)
  const combinedMatch = code.match(/^(.+)-(U\d{1,2})$/);
  if (combinedMatch) {
    const [, baseCode, ageStr] = combinedMatch;
    // Q5=A strict — YOUTH_AGES 화이트리스트만 통과 ("U99" 같은 형식만 매칭 거부)
    const ageValid = (YOUTH_AGES as readonly string[]).includes(ageStr);
    if (!ageValid) return null;
    // baseCode 검증 — ALL_DIVISIONS_MAP 멤버여야 통과
    if (!ALL_DIVISIONS_MAP[baseCode]) return null;
    return {
      baseCode,
      age: ageStr as YouthAge,
      gender: getGenderFromDivision(baseCode),
      isCombined: true,
    };
  }

  // 3) 단독 코드 시도 — ALL_DIVISIONS_MAP 멤버여야 통과
  if (ALL_DIVISIONS_MAP[code]) {
    return {
      baseCode: code,
      age: null,
      gender: getGenderFromDivision(code),
      isCombined: false,
    };
  }

  // 4) 모두 실패 = null (잘못된 코드)
  return null;
}

/**
 * 성별 + 종별로 사용 가능한 디비전 코드 목록 반환
 * @param category - 종별 코드
 * @param gender - 성별 코드
 * @returns 해당 조건의 디비전 코드 배열
 */
export function getDivisionsForCategory(
  category: CategoryCode,
  gender: GenderCode
): string[] {
  const baseCodes = CATEGORY_DIVISION_CODES[category] ?? [];
  if (gender === "female") {
    // 여성부는 코드 뒤에 W 추가
    return baseCodes.map((code) => `${code}W`);
  }
  return [...baseCodes];
}

/**
 * 디비전 코드에서 성별 판단
 * W로 끝나면 여성, 아니면 남성
 */
export function getGenderFromDivision(code: string): GenderCode {
  return code.endsWith("W") ? "female" : "male";
}

/**
 * 전체 디비전 코드 목록 (남성부 + 여성부 flat array)
 */
export function getAllDivisionCodes(): string[] {
  return Object.keys(ALL_DIVISIONS_MAP);
}

// ─── 유청소년 연령 옵션 (U7~U18, 2026-05-15 사용자 결재 Q1=b) ──────────────
// 사유: 강남구협회장배 등 유소년 대회는 디비전(i1~i4) × 연령(U7~U18) 결합 코드 박제
//   (예: "i2-U11", "i3-U9"). 운영 DB 의 TournamentDivisionRule.code 형식 호환.
// 사용처: division-generator-modal STEP 4 (category="youth" 시에만 노출).
export const YOUTH_AGES = [
  "U7", "U8", "U9", "U10", "U11", "U12",
  "U13", "U14", "U15", "U16", "U17", "U18",
] as const;
export type YouthAge = (typeof YOUTH_AGES)[number];

/**
 * 디비전 × 연령 cross-product 으로 결합 코드 배열 생성.
 *
 * @param divs - 선택된 디비전 (예: ["i2", "i3"])
 * @param ages - 선택된 연령 (예: ["U11", "U12"]) — 빈 배열이면 디비전 단독 반환 (회귀 0)
 * @returns 결합 코드 배열 (예: ["i2-U11", "i2-U12", "i3-U11", "i3-U12"])
 *
 * 사유 (Q4=b): 사용자 결재로 "1개 이상 선택 (cross-product)" 룰 박제.
 *   - 디비전 N × 연령 M → N×M row 생성.
 *   - 운영 DB 호환: format/settings 는 row 단위 독립 → divisions 관리 페이지에서 별도 편집.
 *   - 호환: ages 빈 배열 = 기존 동작 (i2 단독) 보존 — youth 외 종별 cross-product 회피.
 */
export function buildYouthDivisionCodes(
  divs: string[],
  ages: string[],
): string[] {
  if (ages.length === 0) return [...divs];
  return divs.flatMap((d) => ages.map((a) => `${d}-${a}`));
}

// ─── 배열 형태 export (UI 필터/드롭다운용) ──────────────
// Record 형태 외에 배열 형태도 필요한 곳(필터 UI 등)이 있어서 추가
export const GENDERS_LIST = [
  { key: "male" as const, label: "남성부" },
  { key: "female" as const, label: "여성부" },
] as const;

export const CATEGORIES_LIST = [
  { key: "general" as const, label: "일반부" },
  { key: "youth" as const, label: "유청소년" },
  { key: "university" as const, label: "대학부" },
  { key: "senior" as const, label: "시니어" },
] as const;

// 성별+종별 조합별 디비전 배열 (UI 드롭다운/선택 컴포넌트용)
export const DIVISIONS_BY_CATEGORY: Record<
  GenderCode,
  Record<CategoryCode, { key: string; label: string; subtitle?: string }[]>
> = {
  male: {
    general: Object.entries(GENERAL_DIVISIONS).map(([key, info]) => ({
      key,
      label: info.label,
      subtitle: info.leagueName ?? undefined,
    })),
    youth: Object.entries(YOUTH_DIVISIONS).map(([key, info]) => ({
      key,
      label: info.label,
      subtitle: info.leagueName ?? undefined,
    })),
    university: Object.entries(UNIVERSITY_DIVISIONS).map(([key, info]) => ({
      key,
      label: info.label,
    })),
    senior: Object.entries(SENIOR_DIVISIONS).map(([key, info]) => ({
      key,
      label: info.label,
    })),
  },
  female: {
    general: Object.entries(GENERAL_DIVISIONS).map(([key, info]) => ({
      key: `${key}W`,
      label: `${info.label}W`,
      subtitle: info.leagueName ?? undefined,
    })),
    youth: Object.entries(YOUTH_DIVISIONS).map(([key, info]) => ({
      key: `${key}W`,
      label: `${info.label}W`,
      subtitle: info.leagueName ?? undefined,
    })),
    university: Object.entries(UNIVERSITY_DIVISIONS).map(([key, info]) => ({
      key: `${key}W`,
      label: `${info.label}W`,
    })),
    senior: Object.entries(SENIOR_DIVISIONS).map(([key, info]) => ({
      key: `${key}W`,
      label: `${info.label}W`,
    })),
  },
};
