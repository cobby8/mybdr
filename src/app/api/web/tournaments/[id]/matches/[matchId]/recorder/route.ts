import { type NextRequest, type NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { getWebSession } from "@/lib/auth/web-session";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";

/**
 * Track B-d — 경기별 기록자 배정 (settings.recorder_id jsonb)
 *
 * 설계 근거(SoT: scratchpad §B-d, PM 확정②):
 *   - 경기별 기록자 = TournamentMatch.settings jsonb 키 `recorder_id` (신규 테이블 0·스키마 0).
 *   - 기존 매치 PATCH 라우트(matches/[matchId])는 점수/상태전환/진출처리가 무겁고 settings 처리를 안 함.
 *     recording_mode 토글도 별도 endpoint 인 것처럼, recorder 배정도 본 경량 endpoint 로 격리한다.
 *     → 기존 흐름 회귀 위험 0.
 *   - ⚠️ settings 통째 덮어쓰기 금지: 기존 키(division_code/recording_mode/timeouts 등) spread 보존 후
 *     recorder_id 만 set/unset (errors.md 2026-05-17 division_code 누락 동형 방지).
 */

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 권한 가드 통합 반환 타입 — recorders/route.ts 의 requireRecordersManageAccess 와 동형.
type RecordersAuthOk = { userId: bigint; session: { sub: string; role: string } };
type RecordersAuthResult = RecordersAuthOk | { error: NextResponse };

/**
 * 경기별 기록자 배정 권한 가드.
 * 대회 풀 관리와 동일 권한(recorder_admin 전역 / organizer / TAM)을 허용한다.
 *   1) recorder_admin (전역 기록원 관리자) — 대회 존재만 확인 후 즉시 통과
 *   2) 그 외 — 기존 requireTournamentAdmin fallback (organizer/TAM/super_admin)
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

/**
 * PATCH /api/web/tournaments/[id]/matches/[matchId]/recorder
 *
 * body: { recorder_id: string | number | null }
 *   - 값 지정 → 해당 경기에 기록자 배정 (settings.recorder_id = userId)
 *   - null/빈값 → 배정 해제 (settings.recorder_id 키 제거)
 *
 * 가드:
 *   - 대회 관리 권한(requireRecordersManageAccess)
 *   - 배정 대상은 반드시 해당 대회 풀(tournament_recorders·isActive) 내 인원이어야 함
 */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id, matchId } = await params;

  // 권한 가드 — 대회 풀 관리와 동일 권한 요구
  const auth = await requireRecordersManageAccess(id);
  if ("error" in auth) return auth.error;

  // matchId BigInt 변환 (parse 실패 → 404)
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  // recorder_id 는 snake_case 로 수신 (프론트 접근자도 snake — 응답 자동 변환 일관)
  const rawRecorderId = body.recorder_id;

  // null / 빈 문자열 = 배정 해제. 그 외 = 배정 대상 userId.
  const isUnassign =
    rawRecorderId === null || rawRecorderId === undefined || rawRecorderId === "";

  let recorderUserId: bigint | null = null;
  if (!isUnassign) {
    recorderUserId = parseBigIntParam(String(rawRecorderId));
    if (recorderUserId === null) {
      return apiError("유효하지 않은 기록자 ID입니다.", 400);
    }
  }

  // 해당 대회 범위 내 경기인지 확인 (IDOR 방지 — tournamentId 일치)
  const match = await prisma.tournamentMatch.findFirst({
    where: { id: matchBigInt, tournamentId: id },
    select: { id: true, settings: true },
  });
  if (!match) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // ⚠️ 풀 검증: 배정 대상은 해당 대회 풀(tournament_recorders) 의 활성 인원만 허용.
  //   해제(null)는 풀 검증 불필요.
  if (recorderUserId !== null) {
    const inPool = await prisma.tournament_recorders.findFirst({
      where: { tournamentId: id, recorderId: recorderUserId, isActive: true },
      select: { id: true },
    });
    if (!inPool) {
      return apiError(
        "해당 대회의 기록원 풀에 등록된 인원만 경기에 배정할 수 있습니다.",
        400,
        "RECORDER_NOT_IN_POOL",
      );
    }
  }

  // 🔑 settings jsonb merge — 기존 키 보존 후 recorder_id 만 set/unset.
  //   통째 덮어쓰면 division_code/recording_mode 등 유실 (errors.md 2026-05-17 동형) → spread 필수.
  const prevSettings =
    match.settings && typeof match.settings === "object" && !Array.isArray(match.settings)
      ? (match.settings as Record<string, unknown>)
      : {};

  const nextSettings: Record<string, unknown> = { ...prevSettings };
  if (recorderUserId === null) {
    // 해제 — 키 자체 제거 (멱등: 없던 키 삭제도 무해)
    delete nextSettings.recorder_id;
  } else {
    // 배정 — userId 문자열로 저장 (BigInt JSON 직렬화 불가 → string)
    nextSettings.recorder_id = recorderUserId.toString();
  }

  // 트랜잭션 — 매치 settings UPDATE 1건 (멱등: 같은 값 재배정도 안전)
  const updated = await prisma.$transaction(async (tx) => {
    return tx.tournamentMatch.update({
      where: { id: matchBigInt },
      data: { settings: nextSettings as object },
      select: { id: true, settings: true },
    });
  });

  // 감사 로그 — 배정/해제 추적 (admin_id 는 세션 내부 자동 추출)
  await adminLog(
    recorderUserId === null ? "match.recorder.unassign" : "match.recorder.assign",
    "TournamentMatch",
    {
      resourceId: matchBigInt,
      ...(recorderUserId !== null && { targetType: "User", targetId: recorderUserId }),
      description:
        recorderUserId === null
          ? `경기 ${matchBigInt} 기록자 배정 해제`
          : `경기 ${matchBigInt} 기록자(user ${recorderUserId}) 배정`,
      changesMade: { recorder_id: recorderUserId?.toString() ?? null },
      severity: "info",
    },
  );

  // apiSuccess → 응답 키 자동 snake_case. settings.recorder_id 는 그대로 string.
  return apiSuccess({
    match_id: matchBigInt.toString(),
    recorder_id: recorderUserId?.toString() ?? null,
    settings: updated.settings,
  });
}
