import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRecorder } from "@/lib/auth/require-recorder";
import { apiSuccess, apiError } from "@/lib/api/response";
import { RECORDER_TRANSITIONS } from "@/lib/tournaments/match-transitions";
import { getMatchScore, updateMatchStatus } from "@/lib/services/match";
import { prisma } from "@/lib/db/prisma";
import { createNotificationBulk } from "@/lib/notifications/create";
import { NOTIFICATION_TYPES } from "@/lib/notifications/types";
// 2026-05-11: Phase 1-A 매치별 recording_mode 게이팅 — Flutter status 변경 차단 (paper 매치만).
import { assertRecordingMode } from "@/lib/tournaments/recording-mode";

const statusSchema = z.object({
  status: z.enum(["in_progress", "completed", "cancelled"]),
});

// PATCH /api/v1/matches/:id/status
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await requireRecorder(req, id);
    if (auth instanceof NextResponse) return auth;
    const { matchId } = auth as { matchId: bigint; userId: bigint; tournamentId: string };

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError("잘못된 요청입니다.", 400);
    }

    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return apiError("유효하지 않은 상태값입니다.", 400);

    const { status } = parsed.data;

    const match = await getMatchScore(matchId);
    if (!match) return apiError("경기를 찾을 수 없습니다.", 404);

    // 2026-05-11: Phase 1-A — paper 매치 status 변경 차단 (settings 별도 1회 SELECT).
    // getMatchScore 는 settings 미포함 select — 변경 최소화 위해 별도 가벼운 SELECT 추가 (id+settings 2 컬럼만).
    const modeRow = await prisma.tournamentMatch.findUnique({
      where: { id: matchId },
      select: { id: true, settings: true },
    });
    if (modeRow) {
      const modeGuard = assertRecordingMode(
        modeRow,
        "flutter",
        `PATCH /api/v1/matches/${id}/status`
      );
      if (modeGuard) return modeGuard;
    }

    const current = match.status ?? "scheduled";
    const allowed = RECORDER_TRANSITIONS[current] ?? [];
    if (!allowed.includes(status)) {
      return apiError(`'${current}' 상태에서 '${status}'로 변경할 수 없습니다.`, 400);
    }

    const updated = await updateMatchStatus(matchId, status, {
      source: "flutter",
      context: `PATCH /api/v1/matches/${id}/status`,
      changedBy: (auth as { userId: bigint }).userId,
    });

    // 경기가 live(in_progress)되면 대회도 자동으로 in_progress 전환
    if (status === "in_progress" && match.tournamentId) {
      prisma.tournament.updateMany({
        where: {
          id: match.tournamentId,
          status: { in: ["draft", "registration_open", "registration_closed"] },
        },
        data: { status: "in_progress" },
      }).catch(() => {}); // fire-and-forget
    }

    // 경기 취소 시 참가자(양 팀 선수)에게 알림 발송 (fire-and-forget)
    if (status === "cancelled") {
      const teamIds = [match.homeTeamId, match.awayTeamId].filter(
        (tid): tid is bigint => tid !== null && tid !== undefined
      );

      if (teamIds.length > 0) {
        // 양 팀의 모든 선수(userId) 조회
        prisma.tournamentTeamPlayer
          .findMany({
            where: { tournamentTeamId: { in: teamIds }, is_active: true },
            select: { userId: true },
          })
          .then((players) => {
            // 중복 제거 + null userId 필터링 (BigInt?로 변경되어 null 가능)
            const uniqueUserIds = [...new Set(players.map((p) => p.userId).filter((id): id is bigint => id !== null))];
            if (uniqueUserIds.length === 0) return;

            return createNotificationBulk(
              uniqueUserIds.map((uid) => ({
                userId: uid,
                notificationType: NOTIFICATION_TYPES.GAME_CANCELLED,
                title: "경기가 취소되었습니다",
                content: `배정된 경기가 취소되었습니다. 자세한 내용은 대회 페이지를 확인해주세요.`,
                notifiableType: "TournamentMatch",
                notifiableId: matchId,
              }))
            );
          })
          .catch(() => {}); // 알림 실패가 취소 처리를 실패시키면 안 됨
      }
    }

    return apiSuccess(updated);
  } catch (err) {
    console.error("[PATCH /api/v1/matches/[id]/status]", err);
    return apiError("Internal server error", 500);
  }
}
