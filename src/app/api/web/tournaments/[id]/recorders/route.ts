import { type NextRequest, type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
// 2026-05-15 PR2 — recorder_admin (전역 기록원 관리자) 분기 add-only.
// 이유: 기존 requireTournamentAdmin 은 organizer/TAM 검증 — recorder_admin 은 본인 대회 X
//   여도 모든 대회 기록원 배정/조회/해제 통과 (권한 매트릭스 §1 "기록원 배정/해제" 행).
// 가드 흐름: getWebSession → isRecorderAdmin true 면 tournament 존재만 확인 후 즉시 통과.
//   그 외는 기존 requireTournamentAdmin fallback (회귀 0 — organizer/TAM 동작 그대로).
import { getWebSession } from "@/lib/auth/web-session";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

type Ctx = { params: Promise<{ id: string }> };

// 권한 가드 통합 반환 타입 — requireTournamentAdmin 의 AuthOk 와 호환.
// 이유: 핸들러 본문은 auth.userId / auth.session 으로 assignedBy 박제 — 분기 결과 동일 형태 의무.
//   error 분기는 NextResponse 자체 — apiError 와 requireTournamentAdmin AuthErr 양쪽 호환 위해
//   가장 느슨한 NextResponse 사용 (제네릭 제거 — TS 호환).
type RecordersAuthOk = { userId: bigint; session: { sub: string; role: string } };
type RecordersAuthResult = RecordersAuthOk | { error: NextResponse };

/**
 * 기록원 배정 API 권한 가드.
 *
 * 분기:
 *   1) recorder_admin (전역 기록원 관리자) — tournament 존재만 확인 후 즉시 통과 (모든 대회)
 *   2) 그 외 — 기존 requireTournamentAdmin fallback (organizer/TAM 검증)
 *
 * 안전 가드:
 *   - recorder_admin 통과 시에도 tournament 존재 확인 (404 vs 200 구분 — 존재하지 않는 대회 id
 *     에 기록원 추가/조회/삭제 방지).
 *   - super_admin 은 isRecorderAdmin 내부에서 자동 흡수 (Q1 결재) — 추가 분기 0.
 *   - audit log (assignedBy) 용 userId 는 분기 무관 일관 박제.
 */
async function requireRecordersManageAccess(
  tournamentId: string,
): Promise<RecordersAuthResult> {
  // 1) recorder_admin 우선 분기 — DB 조회 1회 (tournament 존재 확인) + 즉시 통과
  // 이유: recorder_admin 은 본인 대회 여부 무관 모든 대회 통과 — TAM/organizer 검증 skip.
  const session = await getWebSession();
  if (isRecorderAdmin(session) && session) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });
    if (!tournament) {
      return { error: apiError("대회를 찾을 수 없습니다.", 404) };
    }
    // session.sub → userId (assignedBy 박제 용) / role 은 사용처에서 안 봄
    return {
      userId: BigInt(session.sub),
      session: { sub: session.sub, role: session.role ?? "" },
    };
  }

  // 2) fallback — 기존 requireTournamentAdmin (organizer / TAM / super_admin)
  // 회귀 0: super_admin 도 isRecorderAdmin 내부에서 이미 자동 흡수되지만, recorder_admin 분기를
  //   안 타도 본 호출에서 super_admin 통과. 즉 이중 보장.
  return requireTournamentAdmin(tournamentId);
}

// GET /api/web/tournaments/:id/recorders
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  // 2026-05-15 PR2 — recorder_admin 분기 add-only (requireRecordersManageAccess).
  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  const recorders = await prisma.tournament_recorders.findMany({
    where: { tournamentId: id },
    include: {
      recorder: { select: { id: true, email: true, nickname: true, profile_image_url: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return apiSuccess(recorders);
}

// POST /api/web/tournaments/:id/recorders
// body: { email?: string; userId?: string }
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  // 2026-05-15 PR2 — recorder_admin 분기 add-only. auth.userId 는 assignedBy 박제 용.
  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { email, userId: userIdStr } = body as { email?: string; userId?: string };

  let targetUser: { id: bigint; email: string; nickname: string | null } | null = null;

  if (userIdStr) {
    const uid = parseBigIntParam(userIdStr);
    if (uid === null) {
      return apiError("유효하지 않은 사용자 ID입니다.", 400);
    }
    targetUser = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, email: true, nickname: true },
    });
  } else if (email) {
    targetUser = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, nickname: true },
    });
  } else {
    return apiError("이메일 또는 사용자 ID가 필요합니다.", 400);
  }

  if (!targetUser) {
    return apiError("사용자를 찾을 수 없습니다.", 404);
  }

  // 이미 등록된 기록원인지 확인
  const existing = await prisma.tournament_recorders.findFirst({
    where: { tournamentId: id, recorderId: targetUser.id },
  });

  if (existing) {
    // 비활성화된 기록원이면 재활성화
    if (!existing.isActive) {
      const updated = await prisma.tournament_recorders.update({
        where: { id: existing.id },
        data: { isActive: true, assignedBy: auth.userId },
      });
      return apiSuccess(updated);
    }
    return apiError("이미 기록원으로 등록된 사용자입니다.", 409);
  }

  const recorder = await prisma.tournament_recorders.create({
    data: {
      tournamentId: id,
      recorderId:   targetUser.id,
      assignedBy:   auth.userId,
      isActive:     true,
    },
    include: {
      recorder: { select: { id: true, email: true, nickname: true, profile_image_url: true } },
    },
  });

  return apiSuccess(recorder);
}

// DELETE /api/web/tournaments/:id/recorders
// body: { recorderId: string }
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  // 2026-05-15 PR2 — recorder_admin 분기 add-only.
  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { recorderId } = body as { recorderId?: string };
  if (!recorderId) {
    return apiError("recorderId가 필요합니다.", 400);
  }

  const recorderBigInt = parseBigIntParam(recorderId);
  if (recorderBigInt === null) {
    return apiError("유효하지 않은 기록원 ID입니다.", 400);
  }

  const row = await prisma.tournament_recorders.findFirst({
    where: { tournamentId: id, recorderId: recorderBigInt },
  });
  if (!row) {
    return apiError("기록원을 찾을 수 없습니다.", 404);
  }

  // 소프트 삭제 (isActive = false)
  await prisma.tournament_recorders.update({
    where: { id: row.id },
    data: { isActive: false },
  });

  return apiSuccess({ deleted: true });
}
