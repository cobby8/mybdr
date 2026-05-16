import { NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { withAuth, withErrorHandler, type AuthContext } from "@/lib/api/middleware";
import { batchSyncSchema } from "@/lib/validation/match";
import { apiSuccess, forbidden, validationError } from "@/lib/api/response";
// 2026-05-16 영구 fix (PR-G5.5-followup-B): post-process 5종 통합 헬퍼.
//   기존: advanceWinner + updateTeamStandings fire-and-forget — placeholder advancer / dual / auto-complete 누락.
//   변경: finalizeMatchCompletion fire-and-forget — 5종 통합 + 신규 path 박제 단일 source.
import { finalizeMatchCompletion } from "@/lib/tournaments/finalize-match-completion";
// 2026-05-09: 알기자 자동 발행 — Flutter batch-sync path 가 updateMatchStatus 헬퍼 우회로 trigger 미호출되던 문제 fix.
import { waitUntil } from "@vercel/functions";
import { triggerMatchBriefPublish } from "@/lib/news/auto-publish-match-brief";
// 2026-05-11: Phase 1-A 매치별 recording_mode 게이팅 — paper 매치 batch 차단 (per-match try 안에서 검사).
import { getRecordingMode } from "@/lib/tournaments/recording-mode";
// 2026-05-16: recorder_admin 전역 흡수 (Flutter 기록앱 모든 대회 batch-sync 통과)
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

// FR-025: 매치 일괄 동기화
async function handler(req: NextRequest, ctx: AuthContext, tournamentId: string) {
  // 2026-05-16: super_admin / recorder_admin 자동 통과 (전역 기록원 관리자 — DB 조회 0)
  const hasGlobalAccess = isSuperAdmin(ctx.payload) || isRecorderAdmin(ctx.payload);
  if (!hasGlobalAccess) {
    const adminMember = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId: BigInt(ctx.userId), isActive: true },
    });
    if (!adminMember) return forbidden("No access to this tournament");
  }

  let body: unknown;
  try { body = await req.json(); } catch { return validationError([{ message: "Invalid JSON body" }]); }

  const result = batchSyncSchema.safeParse(body);
  if (!result.success) return validationError(result.error.issues);

  let synced = 0;
  let failed = 0;
  const errors: { matchId: string; reason: string }[] = [];

  for (const match of result.data.matches) {
    try {
      await prisma.$transaction(async (tx) => {
        const existing = await tx.tournamentMatch.findFirst({
          where: { id: BigInt(match.matchId), tournamentId },
        });
        if (!existing) throw new Error("Match not found in tournament");

        // 2026-05-11: Phase 1-A — paper 매치는 batch-sync 차단 (per-match).
        // 사유: batch 응답이 errors[] 로 매치별 reason 반환 가능 → catch 에서 분기 처리.
        // throw 후 외부 catch 가 safeReason 매핑 (line ~67) — 신규 reason 추가.
        if (getRecordingMode(existing) === "paper") {
          throw new Error("RECORDING_MODE_PAPER");
        }

        await tx.tournamentMatch.update({
          where: { id: BigInt(match.matchId) },
          data: {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            status: match.status,
            quarterScores: match.quarterScores ?? undefined,
          },
        });
      });

      // 경기 시작 시 대회 상태 자동 전환 (fire-and-forget)
      if (match.status === "in_progress") {
        prisma.tournament.updateMany({
          where: { id: tournamentId, status: { in: ["draft", "registration_open", "registration_closed"] } },
          data: { status: "in_progress" },
        }).catch(() => {});
      }

      // 경기 완료 시 통합 post-process 헬퍼 호출 (fire-and-forget)
      // 2026-05-16 영구 fix (PR-G5.5-followup-B): 기존 분산 호출 (advanceWinner + updateTeamStandings) →
      //   finalizeMatchCompletion 통합 (placeholder advancer / dual / auto-complete 신규 박제).
      //   기존 누락 사고: divisionCode 있는 batch-sync 매치가 placeholder advancer 미호출 → 결선 매치 null 유지.
      //   안전성: fire-and-forget — batch 응답 자체는 매치 update 성공 시 synced++ (헬퍼 실패는 errors[] 미포함).
      //   waitUntil = Vercel 응답 종료 후 background 보장.
      if (match.status === "completed") {
        waitUntil(
          finalizeMatchCompletion(
            BigInt(match.matchId),
            tournamentId,
            "flutter-batch-sync",
          ).catch((err) => {
            console.error(
              `[finalize-match:flutter-batch-sync] matchId=${match.matchId} 후처리 실패:`,
              err,
            );
          }),
        );
        // 2026-05-09: 알기자 자동 발행 — completed 신규 전환만 trigger (existing 의 status 비교는 트랜잭션 내 already 처리되었으므로 idempotent 신뢰).
        //   triggerMatchBriefPublish 자체가 멱등 (이미 brief 박혔으면 skip / community_post 중복 방지 가드 내장).
        //   waitUntil = Vercel 응답 종료 후 background Promise 보장.
        waitUntil(triggerMatchBriefPublish(BigInt(match.matchId)));
      }
      synced++;
    } catch (err) {
      failed++;
      // ★ 보안: 내부 에러 메시지 노출 방지 — 화이트리스트로만 카피 전달
      // 2026-05-11: RECORDING_MODE_PAPER reason 신규 추가 — Flutter 측 토스트 분기 가능
      const errMsg = err instanceof Error ? err.message : "";
      let safeReason: string;
      if (errMsg === "Match not found in tournament") {
        safeReason = "Match not found in tournament";
      } else if (errMsg === "RECORDING_MODE_PAPER") {
        safeReason = "이 매치는 종이 기록지 모드로 진행 중입니다.";
      } else {
        safeReason = "Sync failed";
      }
      console.error(`[batch-sync] Match ${match.matchId} failed:`, err);
      errors.push({ matchId: match.matchId, reason: safeReason });
    }
  }

  return apiSuccess({ synced, failed, errors }, failed > 0 && synced > 0 ? 207 : 200);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return withErrorHandler(withAuth(async (r: NextRequest, authCtx: AuthContext) => {
    return handler(r, authCtx, id);
  }))(req);
}
