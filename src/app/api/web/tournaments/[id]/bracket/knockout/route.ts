import { type NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { prisma } from "@/lib/db/prisma";
import {
  generateKnockoutMatches,
  calculateLeagueRanking,
} from "@/lib/tournaments/tournament-seeding";
// 2026-05-16 PR-G5.5-NBA-seed: opt-in NBA 표준 시드 generator (default sequential 보존)
import { generateNbaSeedKnockout } from "@/lib/tournaments/nba-seed-knockout";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/web/tournaments/[id]/bracket/knockout
 *
 * 리그 순위 기반 토너먼트 경기 수동 생성 (admin 전용)
 * - 자동 생성 실패 시 재시도용 안전장치
 * - settings.bracket.knockoutSize / bracket.bronzeMatch 설정값 사용 (기본 4강, 3/4위전 없음)
 * - 이미 토너먼트 경기가 있으면 중복 생성 방지 (generateKnockoutMatches 내부에서 throw)
 */
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;

  // 대회 admin 권한 검증 (IDOR 방지)
  const auth = await requireTournamentAdmin(id);
  if ("error" in auth) return auth.error;

  // 대회 설정 로드
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: { settings: true, format: true },
  });
  if (!tournament) return apiError("대회를 찾을 수 없습니다.", 404);

  // full_league_knockout 포맷 대회에서만 사용 가능
  if (tournament.format !== "full_league_knockout") {
    return apiError("리그+토너먼트 포맷 대회에서만 사용할 수 있습니다.", 400);
  }

  // settings.bracket에서 knockoutSize/bronzeMatch/seedingMode 추출 (기본값 적용)
  // 2026-05-16 PR-G5.5-NBA-seed: seedingMode opt-in — default "sequential" (운영 회귀 0)
  //   "nba" → NBA 표준 양분 트리 (1+8, 4+5, 3+6, 2+7) — generateNbaSeedKnockout
  //   기본/sequential → 기존 generateKnockoutMatches (1+8, 2+7, 3+6, 4+5)
  const settings = tournament.settings as Record<string, unknown> | null;
  const bracket = settings?.bracket as Record<string, unknown> | undefined;
  const knockoutSize = (bracket?.knockoutSize as number | undefined) ?? 4;
  const bronzeMatch = (bracket?.bronzeMatch as boolean | undefined) ?? false;
  const seedingMode = (bracket?.seedingMode as "nba" | "sequential" | undefined) ?? "sequential";

  try {
    let generated: number;
    if (seedingMode === "nba") {
      // NBA 모드: ranking → SeedingTeam[] 변환 후 generateNbaSeedKnockout 호출
      // 사유: nba-seed-knockout 은 caller 가 ranking 을 전달하도록 분리 설계 (plan/generate 분리 + 테스트 용이)
      const ranking = await calculateLeagueRanking(id);
      const seedingTeams = ranking.map((r) => ({
        tournamentTeamId: r.tournamentTeamId,
        seedNumber: r.rank,
      }));
      generated = await generateNbaSeedKnockout(id, seedingTeams, knockoutSize, bronzeMatch);
    } else {
      // 기본 sequential 모드 — 기존 동작 100% 보존 (운영 회귀 0)
      generated = await generateKnockoutMatches(id, knockoutSize, bronzeMatch);
    }
    return apiSuccess({ generated, seedingMode });
  } catch (e) {
    // seeding 내부에서 던진 유효성 에러("이미 N건 있습니다" 등)를 그대로 사용자에게 전달
    return apiError(e instanceof Error ? e.message : "토너먼트 생성 실패", 400);
  }
}
