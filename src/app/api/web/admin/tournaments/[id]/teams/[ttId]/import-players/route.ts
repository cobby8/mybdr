/**
 * 2026-05-12 Phase 4-B (옵션 B 4번) — 선수 명단 일괄 import API.
 *
 * POST /api/web/admin/tournaments/[id]/teams/[ttId]/import-players
 * body: { players: [{ player_name, birth_date, jersey_number, position?, school_name?, parent_name?, parent_phone }] }
 * 권한: canManageTournament
 *
 * 사용 케이스:
 *   - 코치가 team-apply 토큰 못 사용 / 운영자가 대리 입력
 *   - 카톡 명단 텍스트 → 운영자가 모달에 붙여넣기 → 일괄 INSERT
 *
 * Phase 3-A team-apply 로직 일부 재사용. 단 차이:
 *   - applied_via 마킹 X (운영자 대리 = admin 그대로 유지)
 *   - 종별 룰 검증 (선택적 — 옵션 strictDivisionRule 으로 분기)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string; ttId: string }> };

const PlayerSchema = z.object({
  player_name: z.string().trim().min(1).max(30),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 YYYY-MM-DD"),
  jersey_number: z.number().int().min(0).max(99).nullable().optional(),
  position: z.string().trim().max(10).nullable().optional(),
  school_name: z.string().trim().max(50).nullable().optional(),
  grade: z.number().int().min(1).max(12).nullable().optional(),
  parent_name: z.string().trim().max(30).nullable().optional(),
  parent_phone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/, "휴대폰 형식")
    .nullable()
    .optional(),
});

const BodySchema = z.object({
  players: z.array(PlayerSchema).min(1).max(30),
  // strictDivisionRule=true 이면 종별 룰 위반 시 422 거부, false 이면 경고만
  strictDivisionRule: z.boolean().optional().default(false),
  // overwrite=true 면 기존 TTP 전체 삭제 후 INSERT (재입력 케이스)
  overwrite: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, ttId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return apiError("유효하지 않은 입력입니다.", 422);
  const { players, strictDivisionRule, overwrite } = parsed.data;

  const tt = await prisma.tournamentTeam.findUnique({
    where: { id: BigInt(ttId) },
    select: {
      id: true, tournamentId: true, category: true,
      team: { select: { name: true } },
      _count: { select: { players: true } },
    },
  });
  if (!tt) return apiError("팀을 찾을 수 없습니다.", 404);
  if (tt.tournamentId !== tournamentId) return apiError("대회 매칭 오류.", 400);

  // 종별 룰 (있을 때만 검증)
  const rule = tt.category
    ? await prisma.tournamentDivisionRule.findFirst({
        where: { tournamentId, code: tt.category },
        select: { birthYearMin: true, birthYearMax: true, gradeMin: true, gradeMax: true },
      })
    : null;

  // 검증
  const warnings: Array<{ index: number; field: string; message: string }> = [];
  players.forEach((p, idx) => {
    const birthYear = Number(p.birth_date.slice(0, 4));
    if (rule?.birthYearMin && birthYear < rule.birthYearMin) {
      warnings.push({ index: idx, field: "birth_date", message: `${rule.birthYearMin}년 이후 출생` });
    }
    if (rule?.birthYearMax && birthYear > rule.birthYearMax) {
      warnings.push({ index: idx, field: "birth_date", message: `${rule.birthYearMax}년 이전 출생` });
    }
    if (p.grade != null) {
      if (rule?.gradeMin && p.grade < rule.gradeMin) {
        warnings.push({ index: idx, field: "grade", message: `${rule.gradeMin}학년 이상` });
      }
      if (rule?.gradeMax && p.grade > rule.gradeMax) {
        warnings.push({ index: idx, field: "grade", message: `${rule.gradeMax}학년 이하` });
      }
    }
  });

  if (warnings.length > 0 && strictDivisionRule) {
    return apiError("종별 자격 검증 실패", 422, "DIVISION_VALIDATION_FAILED", { errors: warnings });
  }

  const now = new Date();

  // 트랜잭션 — overwrite 시 기존 TTP 전체 삭제 후 createMany
  const result = await prisma.$transaction(async (tx) => {
    let deleted = 0;
    if (overwrite) {
      const r = await tx.tournamentTeamPlayer.deleteMany({
        where: { tournamentTeamId: tt.id },
      });
      deleted = r.count;
    }

    const created = await tx.tournamentTeamPlayer.createMany({
      data: players.map((p) => ({
        tournamentTeamId: tt.id,
        player_name: p.player_name,
        birth_date: p.birth_date,
        jerseyNumber: p.jersey_number ?? null,
        position: p.position ?? null,
        school_name: p.school_name ?? null,
        grade: p.grade ?? null,
        parent_name: p.parent_name ?? null,
        parent_phone: p.parent_phone ?? null,
        division_code: tt.category,
        is_active: true,
        claim_status: "pending",
        auto_registered: false,
        invited_at: now,
      })),
    });

    return { inserted: created.count, deleted };
  });

  await adminLog("tournament_team.import_players", "TournamentTeam", {
    description: `${tt.team?.name ?? "(이름 없음)"} 운영자 대리 선수 일괄 INSERT — ${result.inserted}건 (이전 ${tt._count.players}건${overwrite ? `, 덮어쓰기 삭제 ${result.deleted}건` : ""})`,
    changesMade: {
      inserted: result.inserted,
      deleted: result.deleted,
      overwrite,
      warnings_count: warnings.length,
    },
    severity: warnings.length > 0 ? "warning" : "info",
  });

  return apiSuccess({
    ok: true,
    insertedCount: result.inserted,
    deletedCount: result.deleted,
    warnings,
  });
}
