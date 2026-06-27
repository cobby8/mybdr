// ============================================================
// types.ts — admin-v2 데이터 계층 camel 도메인 타입 (R1 토대)
//   호출부가 보는 camel 타입. snake 응답은 adminFetch 에서 이미 변환됨.
//   R2(백오피스/대회운영)에서 도메인 타입을 여기에 확장.
// ============================================================

// jsonb 컬럼 키 — adminFetch rawJsonKeys 로 전달하면 값 verbatim 보존.
// (대회 도메인: settings/일정/종별 등 내부 구조 변환 방지)
export const TOURNAMENT_RAW_JSON_KEYS = [
  "settings",
  "scheduleDates",
  "schedule_dates",
  "categories",
  "meta",
] as const;

// 토대 단계 예시 도메인 타입(R2 에서 실엔드포인트별 확장).
export type AdminTournamentSummary = {
  id: string;
  name: string;
  status: string;
  teamCount?: number;
  startDate?: string | null;
};

export type AdminExpense = {
  id: number;
  tournamentId: string;
  label: string;
  amount: number;
  memo?: string | null;
};
