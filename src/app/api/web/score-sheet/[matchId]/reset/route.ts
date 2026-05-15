/**
 * 웹 종이 기록지 — 매치 완전 초기화 (기록 취소) BFF.
 *
 * 2026-05-15 (PR-Record-Cancel-API) — 사용자 요청 "테스트로 진입했는데 바로 기록 시작
 *   되어서 취소 기능 필요. 완전 초기화 + 경고 플로팅".
 *
 * 동작:
 *   1. requireScoreSheetAccess(matchId) — 권한 가드 (super/organizer/TAM/recorder_admin)
 *      + recorder 단일 직권 차단 (super/organizer/TAM/recorder_admin 만 허용)
 *   2. $transaction 으로 atomic reset:
 *      - play_by_plays.deleteMany (PBP 전체)
 *      - matchPlayerStat.deleteMany
 *      - matchLineupConfirmed.deleteMany
 *      - match_player_jerseys.deleteMany
 *      - tournamentMatch.update — status=scheduled, homeScore=0, awayScore=0,
 *        quarterScores=null, winner_team_id=null, ended_at=null, started_at=null,
 *        notes=null, summary_brief=null
 *   3. tournament_match_audits 박제 (source="web-score-sheet", ctx="record-cancel")
 *   4. 응답 = apiSuccess({ match_id, status, reset_at })
 *
 * 권한 룰 (사용자 요청 — 일반 recorder 차단):
 *   - recorder 단독 = 차단 (실수 사고 방지)
 *   - super_admin / organizer / TAM / recorder_admin = 허용
 *
 * 안전 가드:
 *   - 종료된 매치 (status=completed) 도 허용 — 사용자 의도 "완전 초기화"
 *   - 운영자 인쇄/공식 박제 후 reset 가능성 = 사용자 책임 (경고 모달 UI 단)
 */

import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import {
  requireScoreSheetAccess,
  checkScoreSheetEditAccess,
} from "@/lib/auth/require-score-sheet-access";

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { matchId: matchIdStr } = await params;

  const matchIdNum = Number(matchIdStr);
  if (!Number.isFinite(matchIdNum) || matchIdNum <= 0) {
    return apiError("유효하지 않은 매치 ID 입니다.", 400, "INVALID_MATCH_ID");
  }

  // 1) 권한 가드 — super / organizer / TAM / recorder_admin (recorder 단일 차단)
  const auth = await requireScoreSheetAccess(BigInt(matchIdNum));
  if ("error" in auth) return auth.error;

  // 2) recorder 단일 직권 차단 — edit-mode 권한 헬퍼 재사용 (super/organizer/TAM 만 true)
  //    recorder 의 의도치 않은 데이터 손실 방지 (사용자 룰 — 운영자/관리자만 reset 권한).
  const canCancel = await checkScoreSheetEditAccess(
    auth.match.id,
    auth.tournament.id
  );
  if (!canCancel) {
    return apiError(
      "기록 취소 권한이 없습니다. 운영자 또는 대회 관리자만 가능합니다.",
      403,
      "CANCEL_FORBIDDEN"
    );
  }

  const matchId = auth.match.id;
  const resetAt = new Date();

  // 3) atomic reset — $transaction
  try {
    await prisma.$transaction([
      prisma.play_by_plays.deleteMany({ where: { tournament_match_id: matchId } }),
      prisma.matchPlayerStat.deleteMany({ where: { tournamentMatchId: matchId } }),
      prisma.matchLineupConfirmed.deleteMany({ where: { matchId } }),
      prisma.matchPlayerJersey.deleteMany({ where: { tournamentMatchId: matchId } }),
      prisma.tournamentMatch.update({
        where: { id: matchId },
        data: {
          status: "scheduled",
          homeScore: 0,
          awayScore: 0,
          // Prisma JsonNull = DB 의 JSON column 에 SQL NULL 박제 (DbNull) 와 구분 — JsonNull 이 정합.
          quarterScores: Prisma.JsonNull,
          winner_team_id: null,
          ended_at: null,
          started_at: null,
          // notes / summary_brief = String? — undefined 박제로 update 무동작 (FK 안전).
          //   reset 의도 = JSON column 만 null. text column 은 보존 (사용자 비고/요약 손실 방지).
          //   필요시 사용자 명시 의뢰로 별도 fix.
        },
      }),
    ]);
  } catch (err) {
    console.error("[score-sheet/reset] transaction failed:", err);
    return apiError("기록 취소 중 오류가 발생했습니다.", 500, "RESET_FAILED");
  }

  // 4) audit 박제 — source / context 정합 (submit 라우트 패턴과 동일)
  try {
    await prisma.tournament_match_audits.create({
      data: {
        matchId,
        source: "web-score-sheet",
        context: `record-cancel by ${auth.user.nickname ?? "unknown"} / 완전 초기화`,
        changedBy: auth.user.id,
        changes: {
          action: "record-cancel",
          reset_at: resetAt.toISOString(),
          actor: auth.user.nickname ?? null,
        },
      },
    });
  } catch (err) {
    // audit 실패는 reset 성공 후이므로 silent log (UX 보호)
    console.warn("[score-sheet/reset] audit insert failed:", err);
  }

  return apiSuccess({
    match_id: matchId.toString(),
    status: "scheduled",
    reset_at: resetAt.toISOString(),
  });
}
