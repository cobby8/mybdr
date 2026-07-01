import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError, apiSuccess } from "@/lib/api/response";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { assertRecordingMode } from "@/lib/tournaments/recording-mode";
import { resetMatchRecord } from "@/lib/services/match-record-reset";

// POST /api/v1/matches/:id/reset
// Flutter 기록앱의 "저장 안 하고 나가기" 전용 초기화 API.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;

    const { matchId, userId } = auth;
    const match = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: {
        id: true,
        settings: true,
        status: true,
        homeScore: true,
        awayScore: true,
        winner_team_id: true,
      },
    });
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    const modeGuard = assertRecordingMode(
      match,
      "flutter",
      `POST /api/v1/matches/${id}/reset`
    );
    if (modeGuard) return modeGuard;

    // 가드1 1차방어 (2026-07-01 준결승 306 재발 방지):
    // 이미 completed(확정)된 경기는 record-discard 로 폐기하면 확정 결과 + 라이브 3테이블
    // (play_by_plays/matchPlayerStat/liveScoreboard)을 cascade 파괴한다 (준결승 306 사고 원인).
    // 이미 SELECT 해둔 match.status 를 재사용 — 추가 DB 쿼리 0. completed 만 차단하고
    // in_progress(정상 폐기)/scheduled(멱등 재폐기)/cancelled(재개 리셋)는 그대로 통과.
    if (match.status === "completed") {
      return apiError(
        "이미 완료된 경기는 기록을 폐기할 수 없습니다.",
        409,
        "MATCH_ALREADY_COMPLETED"
      );
    }

    const resetAt = new Date();
    await prisma.$transaction(async (tx) => {
      await resetMatchRecord(tx, {
        matchId,
        before: {
          status: match.status,
          homeScore: match.homeScore,
          awayScore: match.awayScore,
          winner_team_id: match.winner_team_id,
        },
        source: "flutter",
        context: "flutter-record-discard",
        changedBy: userId,
      });
    });

    return apiSuccess({
      match_id: matchId.toString(),
      status: "scheduled",
      reset_at: resetAt.toISOString(),
    });
  } catch (err) {
    console.error("[POST /api/v1/matches/[id]/reset]", err);
    return apiError("경기 기록 초기화 중 오류가 발생했습니다.", 500);
  }
}
