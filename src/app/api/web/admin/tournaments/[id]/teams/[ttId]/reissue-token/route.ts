/**
 * 2026-05-12 Phase 4-B (옵션 B 1번) — 토큰 재발급 API.
 *
 * 진입: 운영자 페이지 모달 "토큰 재발급" 버튼
 * 권한: canManageTournament (super_admin / organizer / TAM is_active)
 * 동작: TournamentTeam.apply_token / apply_token_expires_at 재발급 + applied_via='admin' 복원
 *
 * 사용 케이스:
 *   - apply_token 만료 (대회 시작일 + 7일 경과) → 코치 명단 입력 불가 → 운영자가 재발급
 *   - 토큰 분실 / 잘못 발송 → 재발급
 *   - 코치 정보 변경 후 재발송 필요
 */

import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { newApplyToken } from "@/lib/utils/apply-token";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string; ttId: string }> };

function resolveOrigin(req: NextRequest): string {
  const host = req.headers.get("host") ?? "mybdr.kr";
  const proto = req.headers.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

// 만료 = 대회 startDate + 7일 또는 now + 30일
function resolveExpiresAt(startDate: Date | null): Date {
  if (startDate) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + 7);
    // 이미 과거면 now + 30일로 fallback (재발급 시점 기준)
    if (d.getTime() < Date.now()) {
      const fallback = new Date();
      fallback.setUTCDate(fallback.getUTCDate() + 30);
      return fallback;
    }
    return d;
  }
  const fallback = new Date();
  fallback.setUTCDate(fallback.getUTCDate() + 30);
  return fallback;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, ttId } = await params;

  // 권한
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // TournamentTeam fetch
  const tt = await prisma.tournamentTeam.findUnique({
    where: { id: BigInt(ttId) },
    select: {
      id: true,
      tournamentId: true,
      apply_token: true,
      apply_token_expires_at: true,
      applied_via: true,
      team: { select: { name: true } },
      tournament: { select: { startDate: true } },
    },
  });
  if (!tt) return apiError("팀을 찾을 수 없습니다.", 404);
  if (tt.tournamentId !== tournamentId) return apiError("대회 매칭 오류.", 400);

  // 새 토큰 생성
  const newToken = newApplyToken();
  const newExpiresAt = resolveExpiresAt(tt.tournament.startDate);
  const previousToken = tt.apply_token;
  const previousExpiresAt = tt.apply_token_expires_at;

  await prisma.tournamentTeam.update({
    where: { id: tt.id },
    data: {
      apply_token: newToken,
      apply_token_expires_at: newExpiresAt,
      // applied_via='coach_token' 이었으면 'admin' 으로 복원 (재입력 가능 상태)
      applied_via: "admin",
    },
  });

  await adminLog("tournament_team.reissue_token", "TournamentTeam", {
    description: `${tt.team?.name ?? "(이름 없음)"} 토큰 재발급 — 만료 ${newExpiresAt.toISOString().slice(0, 10)} (대회 ${tournamentId})`,
    previousValues: {
      apply_token: previousToken,
      apply_token_expires_at: previousExpiresAt?.toISOString() ?? null,
    },
    changesMade: {
      apply_token: newToken,
      apply_token_expires_at: newExpiresAt.toISOString(),
    },
    severity: "info",
  });

  const origin = resolveOrigin(req);
  return apiSuccess({
    ok: true,
    applyTokenUrl: `${origin}/team-apply/${newToken}`,
    expiresAt: newExpiresAt.toISOString(),
  });
}
