import { adminFetch } from "../client";
import { expenseListSchema, expenseSchema, deleteResultSchema } from "../schemas";
import type { AdminExpense, CreateExpenseInput, DeleteResult } from "../types";

/**
 * 대회 지출(tournament_expense) 타입드 엔드포인트.
 * route: /api/web/tournaments/[id]/expenses (GET/POST), /[expenseId] (PATCH/DELETE)
 * 권한: requireTournamentAdmin (route 가 보장 — 여기선 호출만).
 *
 * 신규필드라 고위험 → 응답을 Zod 스키마로 런타임 검증(계약 위반 즉시 throw).
 */

/** 지출 목록(최신순). */
export function listExpenses(
  tournamentId: string,
  signal?: AbortSignal
): Promise<AdminExpense[]> {
  return adminFetch<AdminExpense[]>(
    `/api/web/tournaments/${tournamentId}/expenses`,
    { schema: expenseListSchema, signal }
  );
}

/** 지출 추가. body 는 camelCase → adminFetch 가 snake 로 변환 전송. */
export function createExpense(
  tournamentId: string,
  input: CreateExpenseInput,
  signal?: AbortSignal
): Promise<AdminExpense> {
  return adminFetch<AdminExpense>(
    `/api/web/tournaments/${tournamentId}/expenses`,
    { method: "POST", body: input, schema: expenseSchema, signal }
  );
}

/** 지출 삭제. */
export function deleteExpense(
  tournamentId: string,
  expenseId: string,
  signal?: AbortSignal
): Promise<DeleteResult> {
  return adminFetch<DeleteResult>(
    `/api/web/tournaments/${tournamentId}/expenses/${expenseId}`,
    { method: "DELETE", schema: deleteResultSchema, signal }
  );
}
