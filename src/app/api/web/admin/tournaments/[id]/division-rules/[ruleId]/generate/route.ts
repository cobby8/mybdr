/**
 * 2026-05-16 PR-Admin-4 — 종별 단위 매치 generator trigger.
 *
 * 이유(왜):
 *   - bracket POST (대회 단위) 만으로는 4 종별 다른 format 운영 불가 (강남구협회장배 케이스).
 *   - 1 종별만 운영자 수정 → 다른 종별 매치 보존하며 재생성 = 본 endpoint 만 가능.
 *   - division-advancement.ts 의 3 generator 는 이미 divisionCode 인자 받아 종별 단위 동작 → 본 endpoint 는 분기 호출 + 권한 + 가드만 박제.
 *
 * 동작:
 *   - body { clear?: boolean } — true 면 본 종별 매치 deleteMany 사전
 *   - division_rule.format → 3 generator 분기:
 *     - league_advancement → generateLeagueAdvancementMatches
 *     - group_stage_with_ranking → generateGroupStageRankingMatches
 *     - group_stage_knockout → generateGroupStageKnockoutMatches (stub)
 *   - 그 외 format (single_elim/dual_tournament/swiss/round_robin/full_league*) = 400
 *     → 사유: 본 endpoint 는 종별 단위 책임 (대회 단위 = bracket POST 사용)
 *   - bracket_version 박제 = 대회 단위 (종별 generator 가 1 종별만 변경해도 +1 — 사용자 명확 인지)
 *
 * 권한: canManageTournament (super_admin / organizer / TAM is_active)
 *
 * 회귀 가드:
 *   - bracket POST 단일 source 패턴 보존 (본 endpoint 는 종별 단위 신규 추가)
 *   - clear=true 시 settings.division_code 매칭 매치만 deleteMany (다른 종별 매치 보존)
 *   - 종별 generator 의 idempotent (existing > 0 → skip) 동작 그대로 — clear=false 시 재호출 안전
 *
 * 응답: apiSuccess() — snake_case 변환
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError, unauthorized, forbidden } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import {
  generateLeagueAdvancementMatches,
  generateGroupStageRankingMatches,
  generateGroupStageKnockoutMatches,
} from "@/lib/tournaments/division-advancement";
import { createBracketVersion, getBracketVersionStatus } from "@/lib/tournaments/bracket-version";
import { adminLog } from "@/lib/admin/log";

type Ctx = { params: Promise<{ id: string; ruleId: string }> };

// 본 endpoint 가 지원하는 format 화이트리스트 (대회 단위 format 은 bracket POST 사용)
const SUPPORTED_FORMATS = new Set([
  "league_advancement",
  "group_stage_with_ranking",
  "group_stage_knockout",
]);

const PostBodySchema = z.object({
  clear: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, ruleId } = await params;

  // 1) 권한 검증 — canManageTournament (advance route 와 동일 패턴)
  const session = await getWebSession();
  if (!session) return unauthorized();
  const userId = BigInt(session.sub);
  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) return forbidden();

  // 2) ruleId BigInt 변환 가드 (잘못된 입력 = 400)
  let ruleIdBig: bigint;
  try {
    ruleIdBig = BigInt(ruleId);
  } catch {
    return apiError("invalid-rule-id", 400);
  }

  // 3) division_rule 존재 + tournamentId 일치 검증 (IDOR / 404 가드)
  //    sub-tenant 누수 방지: 다른 대회 ruleId 입력 시 404 (200 또는 403 노출 ❌)
  const rule = await prisma.tournamentDivisionRule.findUnique({
    where: { id: ruleIdBig },
    select: { tournamentId: true, code: true, format: true },
  });
  if (!rule || rule.tournamentId !== tournamentId) {
    return apiError("rule-not-found-or-mismatch", 404);
  }

  // 4) format 화이트리스트 검증 — 종별 단위 generator 지원 format 만 (그 외 = bracket POST)
  if (!rule.format || !SUPPORTED_FORMATS.has(rule.format)) {
    return apiError(
      `종별 단위 generator 미지원 format=${rule.format ?? "null"}. 대회 단위 (single_elimination / dual_tournament / round_robin / swiss) 는 bracket 페이지의 "대진표 생성" 버튼을 사용하세요.`,
      400,
    );
  }

  // 5) body 검증 (optional clear)
  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    /* body 없어도 OK — clear=false default */
  }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const clear = parsed.data.clear ?? false;

  // 6) 트랜잭션 — clear deleteMany + generator 호출 (다른 종별 매치 보존 보장)
  //    advisory lock = 동시 호출 race 방지 (tournamentId + ruleId 조합)
  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // tournament_id 기반 advisory lock (bracket POST 와 동일 패턴 — 동일 대회 동시 요청 직렬화)
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${tournamentId})::bigint)`;

        // clear=true 시 본 종별 매치만 deleteMany (다른 종별 매치 보존 = settings.division_code 매칭)
        // 사유: tournamentMatch 에 division_code 컬럼 없음 — settings JSON path 로 매칭
        let deleted = 0;
        if (clear) {
          const r = await tx.tournamentMatch.deleteMany({
            where: {
              tournamentId,
              settings: { path: ["division_code"], equals: rule.code },
            },
          });
          deleted = r.count;
        }

        // generator 분기 호출 — division-advancement.ts 의 시그니처 그대로 사용
        // 본 endpoint = format 화이트리스트 통과 → 분기 분기 결정적
        let genResult;
        switch (rule.format) {
          case "league_advancement":
            genResult = await generateLeagueAdvancementMatches(tx, tournamentId, rule.code);
            break;
          case "group_stage_with_ranking":
            genResult = await generateGroupStageRankingMatches(tx, tournamentId, rule.code);
            break;
          case "group_stage_knockout":
            // stub — 후속 PR 진입 (현재 generated=0 / reason 안내 메시지 반환)
            genResult = await generateGroupStageKnockoutMatches(tx, tournamentId, rule.code);
            break;
          default:
            // 화이트리스트 통과한 이후라 이 분기는 도달 0 (방어적 분기)
            throw new Error(`unreachable format=${rule.format}`);
        }

        // Tournament.matches_count 캐시 업데이트 (bracket POST 와 일관성 — 매치 수 변경 시 갱신)
        const total = await tx.tournamentMatch.count({ where: { tournamentId } });
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { matches_count: total },
        });

        return { genResult, deleted };
      },
      { timeout: 30000 },
    );

    // 7) bracket_version 박제 (트랜잭션 외부 — 다른 format 일관성 유지)
    //    종별 generator 가 1 종별만 변경해도 버전 +1 = 운영자가 변경 인지 가능
    //    free version 한도 도달 시 createBracketVersion 내부 분기로 정상 동작 (단순 INSERT)
    await createBracketVersion(tournamentId, userId);
    const versionStatus = await getBracketVersionStatus(tournamentId);

    // 8) admin_logs 박제 — advance-placeholders route 와 동일 패턴
    await adminLog("tournament.division_generate", "Tournament", {
      resourceId: tournamentId,
      description: `종별 매치 생성 — ${rule.code} (format=${rule.format}) / generated=${result.genResult.generated} / skipped=${result.genResult.skipped} / cleared=${result.deleted}`,
      changesMade: {
        division_code: rule.code,
        format: rule.format,
        clear,
        generated: result.genResult.generated,
        skipped: result.genResult.skipped,
        deleted: result.deleted,
        reason: result.genResult.reason,
      },
      severity: "info",
    }).catch(() => {
      /* admin_logs 실패해도 본 작업 영향 0 */
    });

    // 9) 응답 — apiSuccess() snake_case 변환 (호출자 = DivisionGenerateButton)
    return apiSuccess({
      division_code: result.genResult.divisionCode,
      format: rule.format,
      generated: result.genResult.generated,
      skipped: result.genResult.skipped,
      deleted: result.deleted,
      reason: result.genResult.reason,
      match_ids: result.genResult.matchIds,
      version_number: versionStatus.currentVersion,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[division-generate] failed", { tournamentId, ruleId, code: rule.code, err: msg });
    return apiError(`종별 매치 생성 실패: ${msg}`, 500);
  }
}
