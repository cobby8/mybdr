/**
 * 매치 코드 v4 — `{YY}-{region}-{shortCode}-{matchNum}` 형식
 *
 * 예: `26-GG-MD21-001` (2026-경기-몰텐배제21회-001번 매치)
 *
 * 구성:
 * - YY: 연도 뒤 2자리 (예: 2026 → "26")
 * - region: 17 시도 영문약어 2자 (예: 경기 → "GG")
 * - shortCode: 대회 영문 이니셜 2자 + 시즌/회차 2자리 (예: 몰텐배제21회 → "MD21")
 * - matchNum: 매치 번호 3자리 (001~999)
 *
 * 사용자 결정 (2026-05-04, decisions.md "매치 코드 v4 체계 채택" 참조):
 * - Q5 구분자 = `-` / Q6 매치번호 3자리 / Q7 17시도 영문약어 2자
 * - Q8 회차 = 시즌/회차 2자리 / Q9 종별/디비전 = 별도 컬럼 / Q10 풀리그 group_letter NEW
 *
 * 본 모듈은 **순수 함수만** 노출. DB 의존성 0 (Phase 4 generator 가 Prisma 의존성 주입).
 */

// ============================================================
// 1) 17 시도 → 영문약어 2자 매핑 (Q7=B 결정)
// ============================================================

/**
 * 17 시도 한글명 → 영문약어 2자
 *
 * 주의: 키 = 한글 정확명 (시도 단위). "특별시"/"광역시"/"도" 같은 접미사 없는 표준명 사용.
 * 자유 텍스트 → 영문약어 변환은 normalizeRegion() 사용.
 */
export const REGION_CODE_MAP = {
  서울: "SE",
  부산: "BS",
  대구: "DG",
  인천: "IC",
  광주: "GJ",
  대전: "DJ",
  울산: "US",
  세종: "SJ",
  경기: "GG",
  강원: "GW",
  충북: "CB",
  충남: "CN",
  전북: "JB",
  전남: "JN",
  경북: "GB",
  경남: "GN",
  제주: "JJ",
} as const;

/** 영문약어 2자 union 타입 (예: "SE" | "BS" | ... ) */
export type RegionCode = (typeof REGION_CODE_MAP)[keyof typeof REGION_CODE_MAP];

/**
 * 시도 풀네임 → 약식 alias 매핑
 *
 * REGION_CODE_MAP 키는 약식 (`충남`/`전북`/`경남` 등) 이지만
 * 운영 데이터에 풀네임 (`충청남도`/`전라북도`/`경상남도`) 표기가 흔함 (도청 주소 / 공식 문서 등).
 * normalizeRegion() 의 키워드 검색 단계에서 풀네임도 인식하기 위한 보조 alias.
 */
const REGION_FULLNAME_ALIAS: Record<string, keyof typeof REGION_CODE_MAP> = {
  충청북도: "충북",
  충청남도: "충남",
  전라북도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
};

/**
 * 도시명 → 시도명 보조 매핑 (운영 2대회 + 자주 출현 도시 우선)
 *
 * 사용 케이스: city 가 "남양주시" / "화성" 같은 시군구 단독 표기일 때
 * 시도 키워드 (`경기`/`서울`) 가 포함되어 있지 않아도 정규화 가능하게 함.
 *
 * 추가 룰: 운영에서 새 도시명 발견 시 본 매핑에 점진 보강.
 */
const CITY_TO_SIDO: Record<string, string> = {
  // 경기 (운영 2대회 = 남양주/화성)
  남양주: "경기",
  화성: "경기",
  안양: "경기",
  의정부: "경기",
  수원: "경기",
  성남: "경기",
  고양: "경기",
  용인: "경기",
  부천: "경기",
  안산: "경기",
  광명: "경기",
  평택: "경기",
  파주: "경기",
  김포: "경기",
  // 인천 (자치구)
  부평: "인천",
  연수: "인천",
  계양: "인천",
  남동: "인천",
  // 서울 (자치구)
  강남: "서울",
  강북: "서울",
  강서: "서울",
  강동: "서울",
  송파: "서울",
  서초: "서울",
  마포: "서울",
  종로: "서울",
  중랑: "서울",
  노원: "서울",
  은평: "서울",
  관악: "서울",
};

/**
 * city 자유 텍스트 → region_code 정규화
 *
 * 우선순위:
 * 1. 정확 매칭 (`서울` → `SE`)
 * 2. 접미사 제거 (`서울특별시` / `경기도` → `서울` / `경기` → 매칭)
 * 3. 시도 키워드 포함 검사 (`경기도 화성시` 안에 `경기` 포함 → `GG`)
 * 4. 도시→시도 보조 매핑 (`남양주시` → `남양주` 추출 → `경기` → `GG`)
 * 5. 모두 실패 시 null 반환 (백필 시 region_code = NULL → 운영자 수동 검수)
 *
 * @param city 자유 텍스트 (예: `"경기도 화성시"`, `"남양주시"`, `"서울특별시"`, `null`)
 * @returns 영문약어 2자 또는 null
 */
export function normalizeRegion(city: string | null | undefined): RegionCode | null {
  // 1) null/empty 가드
  if (!city || typeof city !== "string") return null;
  const trimmed = city.trim();
  if (trimmed === "") return null;

  // 2) 접미사 제거 후 정확 매칭 (예: "서울특별시" → "서울" / "경기도" → "경기")
  // 주의: 정규식 그룹 마지막 매칭만 제거. "특별자치도/특별자치시" 우선 처리.
  const stripped = trimmed
    .replace(/(특별자치도|특별자치시|특별시|광역시)$/g, "")
    .replace(/(도|시)$/g, "")
    .trim();
  if (stripped in REGION_CODE_MAP) {
    return REGION_CODE_MAP[stripped as keyof typeof REGION_CODE_MAP];
  }

  // 3-a) 풀네임 alias 검사 (예: "충청남도 천안시" → "충남" → "CN")
  // 풀네임 우선 검사 이유: "충청남도"는 "충남"을 포함하지 않아 3-b 단계에서 실패함.
  for (const [fullName, alias] of Object.entries(REGION_FULLNAME_ALIAS)) {
    if (trimmed.includes(fullName)) {
      return REGION_CODE_MAP[alias];
    }
  }

  // 3-b) 시도 키워드 포함 검사 (예: "경기도 화성시" → "경기" → "GG")
  for (const sido of Object.keys(REGION_CODE_MAP)) {
    if (trimmed.includes(sido)) {
      return REGION_CODE_MAP[sido as keyof typeof REGION_CODE_MAP];
    }
  }

  // 4) 도시→시도 보조 매핑 (시군구 단독 표기 대응)
  for (const [cityKey, sido] of Object.entries(CITY_TO_SIDO)) {
    if (trimmed.includes(cityKey)) {
      return REGION_CODE_MAP[sido as keyof typeof REGION_CODE_MAP];
    }
  }

  // 5) 모두 실패 → null (운영자 수동 보정 큐)
  return null;
}

// ============================================================
// 2) 매치 코드 생성 (generate)
// ============================================================

/** 매치 코드 생성 입력 */
export interface MatchCodeInput {
  /** 4자리 연도 (예: 2026). 자동으로 뒤 2자리 추출. */
  year: number;
  /** 17 시도 영문약어 2자 (REGION_CODE_MAP 값) */
  regionCode: RegionCode;
  /** 대회 short_code: 영문 이니셜 2자 + 회차 2자리 (예: "MD21") */
  shortCode: string;
  /** 매치 번호 (1~999, 자동 zero-pad 3자리) */
  matchNumber: number;
}

/**
 * 매치 코드 생성 — `26-GG-MD21-001`
 *
 * 입력 검증은 호출자 책임 (generator 가 Prisma 조회 후 호출 가정).
 * regionCode 는 RegionCode 타입으로 컴파일타임 검증.
 *
 * @example
 * generateMatchCode({ year: 2026, regionCode: "GG", shortCode: "MD21", matchNumber: 1 })
 * // → "26-GG-MD21-001"
 */
export function generateMatchCode(input: MatchCodeInput): string {
  // 연도 뒤 2자리 추출 (2026 → "26"). 음수/4자리 미만 입력은 호출자 책임.
  const yy = String(input.year).slice(-2).padStart(2, "0");
  // 매치 번호 3자리 zero-pad
  const num = String(input.matchNumber).padStart(3, "0");
  return `${yy}-${input.regionCode}-${input.shortCode}-${num}`;
}

// ============================================================
// 3) 매치 코드 파싱 (parse)
// ============================================================

/** 파싱된 매치 코드 */
export interface ParsedMatchCode {
  /** 4자리 연도 (2000+yy). 예: "26" → 2026 */
  year: number;
  /** 17 시도 영문약어 (RegionCode 추정 — 정규식만 통과, 17 시도 외 코드도 허용) */
  regionCode: RegionCode;
  /** 대회 short_code (예: "MD21") */
  shortCode: string;
  /** 매치 번호 (1~999) */
  matchNumber: number;
}

/** 매치 코드 정규식 — `YY-RR-LLNN-NNN` (RR=2자 대문자, LL=2자 대문자, NN/NNN=숫자) */
const MATCH_CODE_REGEX = /^(\d{2})-([A-Z]{2})-([A-Z]{2}\d{2})-(\d{3})$/;

/**
 * 매치 코드 파싱 — `26-GG-MD21-001` → 구조체
 *
 * 정규식 매칭만 검증. region 17 시도 검증 / shortCode DB 존재 검증은 별도 함수 (호출자 책임).
 * 형식 오류 시 null 반환 (throw 안 함 — UI 안정성).
 *
 * @example
 * parseMatchCode("26-GG-MD21-001")
 * // → { year: 2026, regionCode: "GG", shortCode: "MD21", matchNumber: 1 }
 *
 * parseMatchCode("invalid")
 * // → null
 */
export function parseMatchCode(code: string): ParsedMatchCode | null {
  if (!code || typeof code !== "string") return null;
  const m = code.match(MATCH_CODE_REGEX);
  if (!m) return null;

  const yy = parseInt(m[1], 10);
  const matchNum = parseInt(m[4], 10);

  // year/matchNum NaN 가드 (정규식 통과 시 거의 발생 안 하지만 안전)
  if (Number.isNaN(yy) || Number.isNaN(matchNum)) return null;

  return {
    year: 2000 + yy,
    regionCode: m[2] as RegionCode,
    shortCode: m[3],
    matchNumber: matchNum,
  };
}

// ============================================================
// 4) short_code 검증
// ============================================================

/** short_code 정규식 — 영문 대문자 2자 + 숫자 2자리 (예: "MD21") */
const SHORT_CODE_REGEX = /^[A-Z]{2}\d{2}$/;

/**
 * short_code 형식 검증 (대회 등록 시 운영자 입력값 검증용)
 *
 * 룰: 영문 대문자 2자 + 숫자 2자리 = 정확히 4자.
 * 소문자/3자/5자/특수문자 모두 거부.
 *
 * @example
 * isValidShortCode("MD21")  // true
 * isValidShortCode("HJ02")  // true
 * isValidShortCode("md21")  // false (소문자)
 * isValidShortCode("M21")   // false (3자)
 */
export function isValidShortCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  return SHORT_CODE_REGEX.test(code);
}

// ============================================================
// 5) 종별/디비전 자동 분류 (Q9 — 매치별 category_letter / division_tier)
// ============================================================

/**
 * 종별 한글명 → 영문 1자 매핑 (사용자 결정 Q9 — 종별/디비전 별도 컬럼)
 *
 * 운영 데이터 발견 시 점진 보강:
 * - 일반부 = A (Adult / 일반 성인부)
 * - 유청소년부 = Y (Youth)
 * - 시니어부 = S (Senior)
 * - 여성부 = W (Women)
 * - 대학부 = U (University)
 *
 * 매핑 외 종별은 null 반환 (운영자가 admin 에서 수동 입력 가능).
 */
export function categoryNameToLetter(name: string): string | null {
  if (!name || typeof name !== "string") return null;
  const map: Record<string, string> = {
    일반부: "A",
    유청소년부: "Y",
    시니어부: "S",
    여성부: "W",
    대학부: "U",
  };
  return map[name.trim()] ?? null;
}

/**
 * tournament.categories JSON 분석 → category_letter / division_tier 추정
 *
 * categories JSON 형식 예: `{"일반부": ["D3"]}` (단일 종별 + 단일 디비전)
 * - 운영 케이스 ④ (몰텐배): `{"일반부": ["D3"]}` → A / D3 일괄 부여
 * - 운영 케이스 ① (열혈): categories 비어있음 (또는 다중) → 둘 다 NULL
 *
 * 다중 종별/디비전 (미래): 매치 자체에 category_letter/division_tier 가 이미 부여돼 있다면 우선 사용.
 *
 * @param categoriesJson tournament.categories (Prisma Json? 타입)
 * @param matchOverride 매치별 오버라이드 (이미 category_letter/division_tier 가 부여된 경우)
 * @returns { categoryLetter, divisionTier } — 둘 다 null 가능
 */
export function parseCategoryDivision(
  categoriesJson: unknown,
  matchOverride?: { category_letter?: string | null; division_tier?: string | null },
): { categoryLetter: string | null; divisionTier: string | null } {
  // 1) 매치 자체에 이미 category_letter/division_tier 가 있으면 우선 사용 (admin 수동 입력 시나리오)
  if (matchOverride?.category_letter || matchOverride?.division_tier) {
    return {
      categoryLetter: matchOverride.category_letter ?? null,
      divisionTier: matchOverride.division_tier ?? null,
    };
  }

  // 2) categoriesJson 가 없거나 비어있으면 NULL (케이스 ① — 열혈 패턴)
  if (!categoriesJson || typeof categoriesJson !== "object") {
    return { categoryLetter: null, divisionTier: null };
  }
  const entries = Object.entries(categoriesJson as Record<string, unknown>);
  if (entries.length === 0) {
    return { categoryLetter: null, divisionTier: null };
  }

  // 3) 단일 종별 + 단일 디비전 (케이스 ④ — 몰텐배 패턴 = 가장 흔함)
  if (entries.length === 1) {
    const [name, divs] = entries[0];
    const categoryLetter = categoryNameToLetter(name);
    const divisionTier =
      Array.isArray(divs) && divs.length === 1 && typeof divs[0] === "string"
        ? (divs[0] as string)
        : null;
    return { categoryLetter, divisionTier };
  }

  // 4) 다중 종별 — 매치 단위 분기 필요. 현재 운영 데이터 없음 → 둘 다 NULL.
  //    미래 운영자가 admin 에서 매치별로 입력하면 step 1 에서 흡수됨.
  return { categoryLetter: null, divisionTier: null };
}

// ============================================================
// 6) Phase 4 generator 통합 헬퍼 — applyMatchCodeFields
// ============================================================

/**
 * generator INSERT 전 매치 데이터에 v4 필드 자동 부여
 *
 * 동작:
 * 1. tournament.short_code + region_code 둘 다 있으면 match_code 생성 (둘 중 하나라도 NULL → match_code NULL)
 * 2. tournament.categories 분석 → category_letter / division_tier 일괄 부여
 * 3. group_letter = match.group_name 그대로 복사 (dual_tournament 의 A/B/C/D 조)
 *
 * 호출자 영향 0 보장:
 * - matches 배열을 in-place 변형하지 않음 — 새 배열 반환
 * - tournament 메타 인자 받기만 함 (조회는 caller 책임)
 * - match_number 가 부여돼 있어야 match_code 생성 가능 (없으면 match_code NULL)
 *
 * @param matches 매치 데이터 배열 (Prisma createMany input 형식)
 * @param tournamentMeta tournament 메타 (short_code / region_code / categories / startDate)
 * @returns v4 필드가 부여된 새 매치 배열
 */
export function applyMatchCodeFields<
  T extends {
    match_number?: number | null;
    group_name?: string | null;
    category_letter?: string | null;
    division_tier?: string | null;
    match_code?: string | null;
    group_letter?: string | null;
  },
>(
  matches: T[],
  tournamentMeta: {
    short_code: string | null;
    region_code: string | null;
    categories: unknown;
    startDate: Date | null;
  },
): T[] {
  // 매치 코드 생성 가능 여부 (둘 다 있어야 함)
  const canGenerateCode =
    !!tournamentMeta.short_code &&
    !!tournamentMeta.region_code &&
    isValidShortCode(tournamentMeta.short_code) &&
    tournamentMeta.region_code.length === 2;

  // 연도 = startDate 기반 (없으면 현재 연도 fallback — 운영 무중단)
  const year = tournamentMeta.startDate
    ? tournamentMeta.startDate.getFullYear()
    : new Date().getFullYear();

  // categories 일괄 분석 (단일 종별/디비전이면 모든 매치 동일 부여)
  const { categoryLetter: defaultCategory, divisionTier: defaultDivision } =
    parseCategoryDivision(tournamentMeta.categories);

  return matches.map((m) => {
    // match_code 생성 (조건 충족 + match_number 존재 시)
    let matchCode: string | null = m.match_code ?? null;
    if (canGenerateCode && typeof m.match_number === "number" && m.match_number > 0) {
      matchCode = generateMatchCode({
        year,
        regionCode: tournamentMeta.region_code as RegionCode,
        shortCode: tournamentMeta.short_code as string,
        matchNumber: m.match_number,
      });
    }

    // category_letter / division_tier — 매치별 오버라이드 우선, 없으면 default
    const categoryLetter = m.category_letter ?? defaultCategory;
    const divisionTier = m.division_tier ?? defaultDivision;

    // group_letter — dual_tournament 의 group_name (A/B/C/D) 그대로 복사
    // group_name 이 한 글자가 아닌 케이스는 null (안전 가드 — VarChar(1) 제약)
    const groupLetter =
      m.group_letter ??
      (typeof m.group_name === "string" && m.group_name.length === 1 ? m.group_name : null);

    return {
      ...m,
      match_code: matchCode,
      category_letter: categoryLetter,
      division_tier: divisionTier,
      group_letter: groupLetter,
    };
  });
}

// ============================================================
// 7) UNIQUE 충돌 fallback — generateUniqueMatchCode
// ============================================================

/**
 * Prisma client 타입 (트랜잭션 client 호환)
 *
 * 인터페이스만 명시 — generator 가 prisma 또는 tx 둘 다 받을 수 있도록.
 * @prisma/client 의 PrismaClient 또는 Prisma.TransactionClient 둘 다 호환.
 */
type PrismaCodeChecker = {
  tournamentMatch: {
    findUnique: (args: {
      where: { match_code: string };
      select: { id: true };
    }) => Promise<{ id: bigint } | null>;
  };
};

/**
 * UNIQUE 충돌 시 fallback — matchNumber+1 재시도 max 10회
 *
 * 사용 시나리오:
 * - **운영 backfill 의 백업용** (Phase 3 에서는 사용 안 했음 — UNIQUE 충돌 0)
 * - **generator** 가 단조 증가 match_number 사용해 1차 시도 성공 보장 → 본 함수는 백업
 * - **점진 backfill 가드** (관리자 페이지에서 수동 부여 시나리오)
 *
 * 동작:
 * 1. matchNumber 로 코드 생성 → DB findUnique
 * 2. 존재하면 matchNumber+1 재시도 (max 10회)
 * 3. 10회 내 성공 시 코드 반환 / 실패 시 throw
 *
 * @param prisma Prisma client (트랜잭션 client 가능)
 * @param input 매치 코드 입력
 * @param maxRetry 최대 재시도 횟수 (default 10)
 * @returns 충돌 없는 match_code
 * @throws maxRetry 회 재시도 후도 충돌 시 Error
 */
export async function generateUniqueMatchCode(
  prisma: PrismaCodeChecker,
  input: MatchCodeInput,
  maxRetry = 10,
): Promise<string> {
  for (let i = 0; i < maxRetry; i++) {
    const candidate = generateMatchCode({
      ...input,
      matchNumber: input.matchNumber + i,
    });
    const existing = await prisma.tournamentMatch.findUnique({
      where: { match_code: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }
  throw new Error(
    `generateUniqueMatchCode: ${maxRetry}회 재시도 후도 충돌 — input=${JSON.stringify(input)}`,
  );
}
