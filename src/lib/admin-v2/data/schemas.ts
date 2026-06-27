// ============================================================
// schemas.ts — admin-v2 Zod4 응답 스키마 (R1 토대·핵심필드)
//   ⚠ Zod4 패턴: 옵션객체 금지. z.number().int() / .nullable() / .optional().
//   고위험 신규필드(금액·정수 등) 우선 검증. R2 에서 엔드포인트별 확장.
// ============================================================

import { z } from "zod";

// 정산 지출(예시 — 금액=정수 검증) — adminFetch schema 로 전달.
export const adminExpenseSchema = z.object({
  id: z.number().int(),
  tournamentId: z.string(),
  label: z.string(),
  amount: z.number().int(),
  memo: z.string().nullable().optional(),
});
export type AdminExpenseParsed = z.infer<typeof adminExpenseSchema>;

export const adminExpenseListSchema = z.array(adminExpenseSchema);

export const adminTournamentSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.string(),
  teamCount: z.number().int().optional(),
  startDate: z.string().nullable().optional(),
});
export const adminTournamentListSchema = z.array(adminTournamentSummarySchema);
