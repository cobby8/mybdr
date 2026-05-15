/**
 * 2026-05-16 PR-G5.8 swiss generator — R2~ 라운드 생성 endpoint (501 STUB).
 *
 * ⚠️ 본 endpoint 는 PR-G5.8 옵션 B 결정 (2026-05-16) 에 따라 501 stub.
 *   사유:
 *     1) 운영 사용 0 — swiss tournament 운영 진입 사례 미존재
 *     2) spec 변경 위험 ↓ — 운영 진입 시점에 실제 요구사항 확정 후 박제
 *     3) PURE 페어링 (planSwissNextRound — swiss-helpers.ts) 는 박제 완료 → vitest 검증 가능
 *     4) endpoint skeleton 은 박제 → 향후 PR 진입점 명확화 (URL 변경 0)
 *
 * 후속 PR 진입 시 박제 흐름 (옵션 B → C 진화):
 *   1) 이전 라운드 (R(N-1)) 종료 검증 — 모든 매치 status="completed"
 *   2) getSwissStandings 헬퍼 호출 — wins/losses/buchholz/pointDiff/opponentIds 산출
 *   3) generateSwissNextRound (swiss-knockout.ts) 호출 — R(N) 매치 박제
 *   4) bracket_version 박제
 *   5) admin_logs 박제
 *
 * 권한:
 *   - canManageTournament (super_admin / organizer / TAM is_active) — advance-placeholders 패턴 동일
 *
 * 응답:
 *   - 501 Not Implemented + 사유 (운영 진입 시점에 박제)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";

type Ctx = { params: Promise<{ id: string }> };

// body 스키마 — roundNumber (2 이상 정수)
// 사유: 향후 풀구현 시 검증 룰 그대로 재사용 (스펙 박제)
const PostBodySchema = z.object({
  roundNumber: z.number().int().min(2).max(20),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId } = await params;

  // 1) 권한 검증 — advance-placeholders 패턴 동일
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return apiError("권한이 없습니다.", 403);

  // 2) body 검증 — roundNumber 정수 (2 이상)
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    return apiError("유효하지 않은 입력입니다 (body JSON 필수).", 422, "VALIDATION_ERROR");
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError(
      "유효하지 않은 입력입니다 (roundNumber 는 2 이상 정수).",
      422,
      "VALIDATION_ERROR",
    );
  }

  // 3) 501 응답 — 옵션 B (운영 진입 시점에 풀구현)
  // 사유: 운영 사용 0 / spec 변경 위험 ↓ / PURE 페어링은 vitest 검증 완료
  return apiError(
    "PR-G5.8 후속 PR — 운영 진입 시점에 구현 (현재 옵션 B = R1 박제 + R(N) endpoint stub).",
    501,
    "NOT_IMPLEMENTED",
  );
}
