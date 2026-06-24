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
