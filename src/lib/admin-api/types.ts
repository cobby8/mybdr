/**
 * 관리자 영역 camelCase 도메인 응답 타입 — M1 파일럿 최소셋.
 *
 * 원칙:
 *  - 모든 필드는 **camelCase**(adminFetch 가 snake→camel 변환 후 반환하므로).
 *  - jsonb 컬럼(settings/categories/divisions 등)은 `unknown` 으로 두고 adminFetch 의
 *    `rawJsonKeys` 로 raw 보존(F-2b 함정 차단). 호출부가 필요 시 좁혀 쓴다.
 *  - 전면 모델링 금지 — 파일럿(대회관리자 셸 + expenses)이 실제 쓰는 필드 위주.
 *    forward-compat 위해 일부 타입에 인덱스 시그니처(`[key: string]: unknown`) 허용.
 *
 *  날짜/Decimal/BigInt 직렬화 규칙(apiSuccess = convertKeysToSnakeCase):
 *   - Date  → ISO 문자열(string)
 *   - BigInt → 문자열(string)  ← tournament_expense.id 등
 *   - Decimal → 그대로(string|number, Prisma 직렬화 결과)
 */

/** 대회 상태(운영 문자열). 좁은 union 대신 string — route 가 자유 문자열이라 안전하게. */
export type TournamentStatus = string;

/** 대회 목록 1행(요약). 목록 화면이 실제 쓰는 핵심 필드. */
export type AdminTournamentSummary = {
  id: string;
  name: string | null;
  status: TournamentStatus | null;
  startDate: string | null;
  endDate: string | null;
  maxTeams: number | null;
  teamsCount: number | null;
  matchesCount: number | null;
  isPublic: boolean | null;
  city: string | null;
  district: string | null;
  seriesId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  // 목록 route 가 부가 필드를 더 줄 수 있어 forward-compat 허용
  [key: string]: unknown;
};

/**
 * 대회 상세. 요약 + jsonb 확장 필드(raw 보존 대상).
 * jsonb 필드는 unknown — adminFetch rawJsonKeys 로 내부 키 변환을 막은 raw 값.
 */
export type AdminTournamentDetail = AdminTournamentSummary & {
  format: string | null;
  organizer: string | null;
  host: string | null;
  sponsors: string | null;
  // ⚠️ jsonb (rawJsonKeys 보존 대상) — 내부 키는 사용자 데이터라 camel 변환 금지
  settings: unknown;
  categories: unknown;
  divisions: unknown;
  divisionTiers: unknown;
  divCaps: unknown;
  divFees: unknown;
  prizeDistribution: unknown;
  gameRules: unknown;
  places: unknown;
  scheduleDates: unknown;
};

/** 대회 상세에서 raw 로 보존해야 하는 jsonb 키들(snake 형태로 지정 — 매칭은 양형 모두 허용). */
export const TOURNAMENT_RAW_JSON_KEYS = [
  "settings",
  "categories",
  "divisions",
  "division_tiers",
  "div_caps",
  "div_fees",
  "prize_distribution",
  "game_rules",
  "places",
  "schedule_dates",
] as const;

/** 대회 지출 1건(오늘 추가분 tournament_expense). 신규필드라 고위험 → Zod 검증 동반. */
export type AdminExpense = {
  id: string; // BigInt → 문자열
  tournamentId: string;
  label: string;
  amount: number; // 원(정수)
  category: string | null;
  memo: string | null;
  createdAt: string; // ISO
  updatedAt?: string | null;
};

/** 지출 생성 입력(camelCase — adminFetch 가 snake 로 변환 전송). */
export type CreateExpenseInput = {
  label: string;
  amount: number;
  category?: string | null;
  memo?: string | null;
};

/** 지출 삭제 응답. */
export type DeleteResult = {
  deleted: boolean;
};
