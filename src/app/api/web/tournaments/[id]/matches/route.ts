import { type NextRequest, type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { getWebSession } from "@/lib/auth/web-session";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { apiSuccess, apiError } from "@/lib/api/response";
import { listMatches, createMatch } from "@/lib/services/match";

type Ctx = { params: Promise<{ id: string }> };

// 권한 가드 통합 반환 타입 — recorders/route.ts·recorder/route.ts 의 동형 가드와 일치.
type RecordersAuthOk = { userId: bigint; session: { sub: string; role: string } };
type RecordersAuthResult = RecordersAuthOk | { error: NextResponse };

/**
 * 경기 목록 조회 권한 가드 (Track B-d 정합·2026-06-21).
 *
 * 이유(왜): GET이 requireTournamentAdmin 만이면 recorder_admin 이 recorders 화면을 열 때
 *   경기 목록 GET이 403 → 경기목록 빈 상태 → B-d "경기별 기록자 배정" UI 무용지물.
 *   배정 PATCH(matches/[matchId]/recorder)·자동배정(auto-assign)은 requireRecordersManageAccess 로
 *   recorder_admin 통과인데 목록 읽기만 막혀 비대칭. 읽기 가드를 PATCH와 동일하게 정렬한다.
 *   (보안 약화 아님 — 기록자 관리 권한자: recorder_admin / organizer / TAM / super_admin 만 통과.)
 *
 * 분기:
 *   1) recorder_admin (전역 기록원 관리자) — 대회 존재만 확인 후 즉시 통과 (모든 대회)
 *   2) 그 외 — 기존 requireTournamentAdmin fallback (organizer / TAM / super_admin)
 */
async function requireRecordersManageAccess(
  tournamentId: string,
): Promise<RecordersAuthResult> {
  // 1) recorder_admin 우선 분기 — 본인 대회 여부 무관 모든 대회 통과
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

  // 2) fallback — 기존 requireTournamentAdmin (organizer / TAM / super_admin)
  return requireTournamentAdmin(tournamentId);
}

// GET /api/web/tournaments/[id]/matches
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  // Track B-d 정합: PATCH/auto-assign 과 동일한 기록자 관리 권한 가드로 정렬(recorder_admin 통과).
  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  const matches = await listMatches(id);

  return apiSuccess(matches);
}

// POST /api/web/tournaments/[id]/matches — 경기 수동 생성
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const { homeTeamId, awayTeamId, roundName, round_number, scheduledAt, venue_name, court_number } =
    body as Record<string, string | null | undefined>;

  // TC-NEW-010: BigInt 변환 실패 방지
  let homeBigInt: bigint | null = null;
  let awayBigInt: bigint | null = null;
  try {
    if (homeTeamId) homeBigInt = BigInt(homeTeamId);
    if (awayTeamId) awayBigInt = BigInt(awayTeamId);
  } catch {
    return apiError("유효하지 않은 팀 ID입니다.", 400);
  }

  const match = await createMatch({
    tournamentId: id,
    homeTeamId: homeBigInt,
    awayTeamId: awayBigInt,
    roundName: roundName ?? null,
    roundNumber: round_number ? Number(round_number) : null,
    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    venueName: venue_name ?? null,
    courtNumber: court_number ?? null,
  });

  return apiSuccess(match);
}
