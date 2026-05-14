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
// 2026-05-11: Phase C — status="completed" 전환 시 score 자동 보정 (sync 누락 매치 자동 복구).
//   Flutter app 이 /sync 미호출로 homeScore/awayScore=0 으로 남는 케이스 (매치 #132 패턴) 자동 박제.
//   응답 schema 변경 ❌ / Flutter app 영향 0 — 백엔드 내부 안전망.
import { applyScoreSafetyNet } from "@/lib/services/match-score-recompute";

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

    // 2026-05-11 Phase C: status="completed" 전환 시 score 자동 보정 (sync 누락 안전망).
    // 왜:
    //   - Flutter app 이 매치 종료 시 /sync 한번도 호출 안 하는 케이스 (매치 #132 패턴) 반복.
    //     → homeScore=0/awayScore=0 으로 운영 DB 박제됨 (Phase A 에서 10건 backfill).
    //   - safety net = 새 매치도 같은 누락 재발 시 자동 보정 (앞으로 재발 방지).
    // 어떻게:
    //   - applyScoreSafetyNet 가 자체 3단 fallback 으로 결정 (homeScore>0 skip / playerStats / PBP).
    //   - 별도 트랜잭션 — updateMatchStatus 의 메인 트랜잭션 (status/winner/진출/audit) 이 이미
    //     커밋된 후 호출. safety net 실패해도 status 변경은 살아있음 (운영 영향 0 — Phase D 의
    //     admin recompute UI 로 별도 복구 가능).
    //   - 멱등성: 이미 박제된 매치 (homeScore>0) 는 skip → 변경 0.
    if (status === "completed") {
      try {
        await prisma.$transaction(async (tx) => {
          await applyScoreSafetyNet(tx, matchId, "status-completed-safety-net");
        });
      } catch (safetyErr) {
        // safety net 실패 = status 변경 유지 + 로그만 박제 (운영 영향 0).
        // 운영자가 Phase D admin recompute UI 또는 별도 backfill 로 수동 복구.
        console.error("[PATCH /api/v1/matches/[id]/status] safety net 실패", safetyErr);
      }
    }

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
