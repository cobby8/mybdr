import { type NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api/response";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { prisma } from "@/lib/db/prisma";
import { generateKnockoutMatches } from "@/lib/tournaments/tournament-seeding";

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

  // settings.bracket에서 knockoutSize/bronzeMatch 추출 (기본값 적용)
  const settings = tournament.settings as Record<string, unknown> | null;
  const bracket = settings?.bracket as Record<string, unknown> | undefined;
  const knockoutSize = (bracket?.knockoutSize as number | undefined) ?? 4;
  const bronzeMatch = (bracket?.bronzeMatch as boolean | undefined) ?? false;

  try {
    const generated = await generateKnockoutMatches(id, knockoutSize, bronzeMatch);
    return apiSuccess({ generated });
  } catch (e) {
    // seeding 내부에서 던진 유효성 에러("이미 N건 있습니다" 등)를 그대로 사용자에게 전달
    return apiError(e instanceof Error ? e.message : "토너먼트 생성 실패", 400);
  }
}
