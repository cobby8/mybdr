import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";

// PR-2 3-D 정산 지출 — 지출 단건 수정/삭제.
//   IDOR/멀티테넌트: requireTournamentAdmin(id) + 지출 row 의 tournament_id === id 소유 검증(findFirst).

type Ctx = { params: Promise<{ id: string; expenseId: string }> };

const updateExpenseSchema = z.object({
  label: z.string().trim().min(1, "항목명을 입력하세요.").max(100).optional(),
  amount: z
    .number({ invalid_type_error: "금액은 숫자여야 합니다." })
    .int("금액은 정수여야 합니다.")
    .positive("금액은 0보다 커야 합니다.")
    .optional(),
  category: z.string().trim().max(50).optional().nullable(),
  memo: z.string().trim().max(500).optional().nullable(),
});

// 대회 소유 + 지출 존재 검증 — 다른 대회 지출 id 로 접근 차단(멀티테넌트).
async function findOwnedExpense(tournamentId: string, expenseIdStr: string) {
  const expenseId = parseBigIntParam(expenseIdStr);
  if (expenseId === null) return null;
  return prisma.tournament_expense.findFirst({
    where: { id: expenseId, tournament_id: tournamentId },
    select: { id: true },
  });
}

// PATCH /api/web/tournaments/[id]/expenses/[expenseId]
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, expenseId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const owned = await findOwnedExpense(id, expenseId);
  if (!owned) return apiError("지출 항목을 찾을 수 없습니다.", 404);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = updateExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 값입니다.", 400);
  }

  const data = parsed.data;
  const updateData: Record<string, unknown> = {};
  if (data.label !== undefined) updateData.label = data.label;
  if (data.amount !== undefined) updateData.amount = data.amount;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.memo !== undefined) updateData.memo = data.memo;

  const updated = await prisma.tournament_expense.update({
    where: { id: owned.id },
    data: updateData,
  });

  return apiSuccess(updated);
}

// DELETE /api/web/tournaments/[id]/expenses/[expenseId]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, expenseId } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const owned = await findOwnedExpense(id, expenseId);
  if (!owned) return apiError("지출 항목을 찾을 수 없습니다.", 404);

  await prisma.tournament_expense.delete({ where: { id: owned.id } });

  return apiSuccess({ deleted: true });
}
