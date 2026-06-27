import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { apiSuccess, apiError } from "@/lib/api/response";

// PR-2 3-D 정산 지출 — 대회별 지출 목록/추가.
//   권한: requireTournamentAdmin(id) (형제 라우트 동일 가드 = organizer/TAM/super_admin) → IDOR/멀티테넌트 보장.
//   응답: apiSuccess() (재귀 snake). 신규 필드명(label/amount/category/memo/created_at)은 단어/이미 snake.

type Ctx = { params: Promise<{ id: string }> };

// 지출 생성 검증 — amount 는 양의 정수(원). label 필수.
const createExpenseSchema = z.object({
  label: z.string().trim().min(1, "항목명을 입력하세요.").max(100, "항목명이 너무 깁니다."),
  amount: z
    .number({ invalid_type_error: "금액은 숫자여야 합니다." })
    .int("금액은 정수여야 합니다.")
    .positive("금액은 0보다 커야 합니다."),
  category: z.string().trim().max(50).optional().nullable(),
  memo: z.string().trim().max(500).optional().nullable(),
});

// GET /api/web/tournaments/[id]/expenses — 대회 지출 목록(최신순)
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  const expenses = await prisma.tournament_expense.findMany({
    where: { tournament_id: id },
    orderBy: { created_at: "desc" },
  });

  return apiSuccess(expenses);
}

// POST /api/web/tournaments/[id]/expenses — 지출 추가
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = createExpenseSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "유효하지 않은 값입니다.", 400);
  }

  const { label, amount, category, memo } = parsed.data;
  const created = await prisma.tournament_expense.create({
    data: {
      tournament_id: id,
      label,
      amount,
      category: category ?? null,
      memo: memo ?? null,
    },
  });

  return apiSuccess(created);
}
