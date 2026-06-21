import { type NextRequest, type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { getWebSession } from "@/lib/auth/web-session";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

/**
 * Track B-d — 경기별 기록자 자동 배정 (라운드로빈)
 *
 * 설계 근거(SoT: scratchpad §B-d "자동배정(시안 wand)"):
 *   - 풀(tournament_recorders·isActive) 인원을 미배정 경기에 라운드로빈으로 순환 배정.
 *   - 단순 순환(과설계 금지). 핵심은 수동 배정이고 이건 편의 기능.
 *   - settings jsonb merge 로 recorder_id 만 set (기존 키 spread 보존).
 *
 * body(선택): { overwrite?: boolean }
 *   - false(기본): 이미 기록자 배정된 경기는 건너뜀 (미배정만 채움)
 *   - true: 모든 경기를 풀 순환으로 재배정
 */

type Ctx = { params: Promise<{ id: string }> };

type RecordersAuthOk = { userId: bigint; session: { sub: string; role: string } };
type RecordersAuthResult = RecordersAuthOk | { error: NextResponse };

// 권한 가드 — recorders/route.ts·matches/[matchId]/recorder/route.ts 와 동형.
async function requireRecordersManageAccess(
  tournamentId: string,
): Promise<RecordersAuthResult> {
  const session = await getWebSession();
  if (isRecorderAdmin(session) && session) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });
    if (!tournament) {
      return { error: apiError("대회를 찾을 수 없습니다.", 404) };
    }
    return {
      userId: BigInt(session.sub),
      session: { sub: session.sub, role: session.role ?? "" },
    };
  }
  return requireTournamentAdmin(tournamentId);
}

// settings 객체 정규화 — null/array 방어 후 Record 로.
function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

/**
 * POST /api/web/tournaments/[id]/recorders/auto-assign
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  // overwrite 옵션 파싱 (body 없을 수도 있음 → 기본 false)
  let overwrite = false;
  try {
    const body = (await req.json()) as Record<string, unknown>;
    overwrite = body?.overwrite === true;
  } catch {
    // body 없음 — 기본값 사용
  }

  // 활성 풀 인원 조회 (배정 순환 대상)
  const pool = await prisma.tournament_recorders.findMany({
    where: { tournamentId: id, isActive: true },
    select: { recorderId: true },
    orderBy: { createdAt: "asc" },
  });
  if (pool.length === 0) {
    return apiError("배정할 기록원이 없습니다. 먼저 기록원 풀에 인원을 추가하세요.", 400);
  }

  // 경기 목록 조회 (생성 순서대로 — 라운드/대진 순서 안정)
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId: id },
    select: { id: true, settings: true },
    orderBy: [{ round_number: "asc" }, { bracket_position: "asc" }, { id: "asc" }],
  });

  // 배정 대상 결정 — overwrite 면 전체, 아니면 미배정(recorder_id 없음)만.
  const targets = matches.filter((m) => {
    if (overwrite) return true;
    const s = asRecord(m.settings);
    return s.recorder_id == null || s.recorder_id === "";
  });

  if (targets.length === 0) {
    return apiSuccess({ assigned_count: 0, message: "배정할 경기가 없습니다." });
  }

  // 라운드로빈 순환 배정 — 각 경기 settings.recorder_id set (기존 키 spread 보존).
  //   트랜잭션으로 묶어 부분 실패 방지.
  const updates = targets.map((m, idx) => {
    const recorderId = pool[idx % pool.length].recorderId;
    const nextSettings = {
      ...asRecord(m.settings),
      recorder_id: recorderId.toString(),
    };
    return prisma.tournamentMatch.update({
      where: { id: m.id },
      data: { settings: nextSettings as object },
      select: { id: true },
    });
  });

  await prisma.$transaction(updates);

  // 감사 로그 — 자동배정 1건 (대량 작업이므로 건별 로그 대신 요약 1건).
  //   tournamentId 는 String(uuid) → resource_id(BigInt) 컬럼과 불일치라 resourceId 생략(null).
  await adminLog("match.recorder.auto_assign", "Tournament", {
    description: `경기별 기록자 자동배정 ${targets.length}건 (풀 ${pool.length}명, overwrite=${overwrite})`,
    changesMade: { assigned_count: targets.length, pool_size: pool.length, overwrite },
    severity: "info",
  });

  return apiSuccess({
    assigned_count: targets.length,
    pool_size: pool.length,
    overwrite,
  });
}
