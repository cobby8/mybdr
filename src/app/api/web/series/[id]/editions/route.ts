/**
 * /api/web/series/[id]/editions — 시리즈에 회차 (Tournament) 추가.
 *
 * 2026-05-14 (Phase 5 작업 B) — 통합 마법사 호환 확장.
 *
 * 기존 동작 (호환 100% 보장):
 *   - body: { startDate, venueName?, maxTeams? }
 *   - 호출처: src/app/(web)/tournament-admin/series/[id]/add-edition/* (기존 폼)
 *   - 동작: edition_number 자동 채번 + Tournament 생성 (status="registration_open") +
 *           series.tournaments_count +1
 *
 * 신규 마법사 path (이번 Phase 추가):
 *   - body: { tournament_payload, division_rules? }
 *   - 우선순위: tournament_payload 가 있으면 그것을 사용 (기존 startDate/venueName/maxTeams 무시)
 *   - status = "draft" 강제 (02-db-changes §3 — 마법사는 정보 입력 단계, 즉시 공개 ❌)
 *   - division_rules 가 있으면 트랜잭션 안에서 createMany 일괄 생성
 *
 * 공통:
 *   - IDOR 가드: series.organizer_id === ctx.userId (기존 동작 유지)
 *   - edition_number 자동 채번: count + 1 (기존 코드 패턴 답습)
 *   - 트랜잭션: Tournament create + DivisionRule createMany + series.tournaments_count +1 원자 처리
 *   - 실패 시 카운터 +1 안 됨 (롤백)
 *
 * 충돌 가드 (Phase 5 작업 C 완료 — 2026-05-14 commit `b28545f`):
 *   - 운영 DB 에 `tournaments_series_edition_unique` UNIQUE 인덱스 적용 완료
 *   - 동시 채번 (count + 1) 시 23505 / Prisma P2002 발생 가능 → retry 1회 보강
 *   - retry 동작:
 *       attempt 0 = 트랜잭션 시도 → P2002 catch → count 재조회 → attempt 1 진입
 *       attempt 1 = 다시 시도 → 성공 시 응답 / 실패 시 409 (CONFLICT)
 *   - retry 영향 0 케이스: 성공 path 그대로 / unique 위반 외 에러는 즉시 throw
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { Prisma } from "@prisma/client";

type RouteCtx = { params: Promise<{ id: string }> };

// =============================================================================
// 마법사 path 의 tournament_payload / division_rules 타입
// =============================================================================
// any 금지 (CLAUDE.md TypeScript strict). 신뢰 가능 호출자 (마법사) 가정으로
// Zod 엄격 검증은 생략하되, 타입 박제만 명시.
//
// Phase 1 의 wizard-types.ts 의 TournamentPayload 와 DivisionRulePayload 는 폼 state
// (camelCase 컴포지션). 본 API 의 입력은 Phase 4 의 "Prisma create input" 직전 단계
// (DB 컬럼명 정합 — 일부 snake_case). 본 turn 에서는 Prisma 의 Tournament create 입력에
// 그대로 spread 가능한 형식을 받음 — Phase 4 의 payload builder 가 변환 책임.

type WizardTournamentPayload = Record<string, unknown>;
type WizardDivisionRule = Record<string, unknown>;

interface WizardBody {
  tournament_payload?: WizardTournamentPayload;
  division_rules?: WizardDivisionRule[];
}

interface LegacyBody {
  startDate?: string;
  venueName?: string;
  maxTeams?: number;
}

export const POST = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;

  try {
    // (1) IDOR 방지 — 시리즈 소유자 확인 (기존 동작 유지)
    const series = await prisma.tournament_series.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, name: true, organizer_id: true },
    });
    if (!series) return apiError("시리즈를 찾을 수 없습니다.", 404);
    if (series.organizer_id !== ctx.userId) {
      return apiError("접근 권한이 없습니다.", 403);
    }

    const body = (await req.json()) as WizardBody & LegacyBody;
    const hasFullPayload = !!body.tournament_payload;

    // 기존 path (legacy) 의 입력 사전 검증 — retry 루프 진입 전 1회만
    // 이유: startDate 누락은 400 (입력 오류) — retry 대상 아님
    if (!hasFullPayload && !body.startDate) {
      return apiError("날짜는 필수입니다.", 400);
    }

    // =========================================================================
    // (2~4) edition_number 채번 + 트랜잭션 — retry 1회 보강
    //
    // 이유: 운영 DB 에 `tournaments_series_edition_unique` 인덱스 추가 (2026-05-14 b28545f).
    //   동시 회차 추가 시 (count + 1) race 로 P2002 / 23505 발생 가능.
    //   → attempt 0 에서 P2002 catch → count 재조회 → attempt 1 한 번 더 시도 → 그래도
    //     실패면 409 응답.
    //
    // 비-P2002 에러는 즉시 throw → 바깥 catch 가 500 처리 (기존 동작 보존).
    // =========================================================================
    let createdTournament:
      | Awaited<ReturnType<typeof prisma.tournament.create>>
      | null = null;
    let editionNumber = 0;

    for (let attempt = 0; attempt < 2; attempt++) {
      // (2) edition_number 자동 채번 — count + 1 패턴 (기존 코드 답습)
      //     attempt 마다 재조회 (race 직후 +1 반영)
      const count = await prisma.tournament.count({
        where: { series_id: series.id },
      });
      editionNumber = count + 1;

      // (3) Tournament 데이터 결정 — 마법사 path vs 기존 path 분기
      let tournamentCreateData:
        | Prisma.TournamentCreateInput
        | Prisma.TournamentUncheckedCreateInput;

      if (hasFullPayload) {
        // 마법사 path — tournament_payload 우선
        //   - status 는 항상 "draft" 강제 (02-db-changes §3 — 입력값 무시)
        //   - series_id / edition_number / organizerId 는 서버에서 강제 박제 (사용자 입력 무시)
        const payload = body.tournament_payload!;
        // status 키를 입력에서 제거 (있어도 무시) — destructuring 으로 분리
        const { status: _ignoredStatus, ...payloadRest } = payload as {
          status?: unknown;
        } & Record<string, unknown>;
        void _ignoredStatus;

        tournamentCreateData = {
          ...payloadRest,
          // name 폴백 (payload 에 name 없으면 시리즈명 + 회차)
          name:
            (payloadRest.name as string | undefined) ??
            `${series.name} ${editionNumber}회`,
          series_id: series.id,
          edition_number: editionNumber,
          status: "draft", // ← 강제
          organizerId: ctx.userId,
        } as Prisma.TournamentUncheckedCreateInput;
      } else {
        // 기존 path — startDate/venueName/maxTeams 직접 입력 (회귀 호환)
        const startDate = body.startDate!; // 위 사전 검증으로 보장
        const venueName = body.venueName?.trim() || null;
        const maxTeams = Number(body.maxTeams) || 8;

        tournamentCreateData = {
          series_id: series.id,
          edition_number: editionNumber,
          name: `${series.name} ${editionNumber}회`,
          startDate: new Date(startDate),
          venue_name: venueName,
          maxTeams,
          status: "registration_open", // 기존 동작 보존 (호출처 회귀 X)
          format: "single_elimination",
          organizerId: ctx.userId,
          is_public: true,
        };
      }

      // (4) 트랜잭션 — Tournament create + DivisionRule createMany + series 카운터 +1
      //     실패 시 자동 롤백 (카운터 +1 안 됨 / 자체 검수 #5 충족)
      try {
        createdTournament = await prisma.$transaction(async (tx) => {
          // (4-1) Tournament 생성
          const created = await tx.tournament.create({
            data: tournamentCreateData,
          });

          // (4-2) division_rules 일괄 생성 (마법사 path 에서만 의미 — 빈 배열 / undefined 모두 안전 skip)
          if (
            hasFullPayload &&
            body.division_rules &&
            body.division_rules.length > 0
          ) {
            const rulesData = body.division_rules.map((rule) => ({
              ...rule,
              tournamentId: created.id,
            })) as Prisma.TournamentDivisionRuleCreateManyInput[];
            await tx.tournamentDivisionRule.createMany({
              data: rulesData,
            });
          }

          // (4-3) 시리즈 카운터 +1 (기존 코드 패턴 답습)
          await tx.tournament_series.update({
            where: { id: series.id },
            data: {
              tournaments_count: { increment: 1 },
              updated_at: new Date(),
            },
          });

          return created;
        });
        break; // 성공 → retry 루프 탈출
      } catch (txErr) {
        // P2002 = Prisma unique constraint failed (운영 DB 의 tournaments_series_edition_unique 와 충돌)
        //   attempt 0 → count 재조회 후 한 번 더 시도
        //   attempt 1 → 바깥 catch 의 409 처리
        if (
          attempt === 0 &&
          txErr instanceof Prisma.PrismaClientKnownRequestError &&
          txErr.code === "P2002"
        ) {
          // 다음 iteration 진입 (count 재조회 + 재시도)
          continue;
        }
        // 비-P2002 또는 retry 후에도 P2002 → 바깥 catch 로 전파
        throw txErr;
      }
    }

    // retry 루프가 break 없이 빠져나오면 (이론상 unreachable — for 안에서 success break 또는 throw)
    if (!createdTournament) {
      return apiError("회차 추가 중 오류가 발생했습니다.", 500);
    }

    // =========================================================================
    // (5) 응답 — 기존 호환 keys (success / tournamentId / editionNumber / name / redirectUrl)
    //     마법사 path 도 동일 형식 사용 — 호출자 분기 없이 redirect 가능
    // =========================================================================
    return apiSuccess({
      success: true,
      tournamentId: createdTournament.id,
      editionNumber,
      name: createdTournament.name,
      redirectUrl: `/tournament-admin/tournaments/${createdTournament.id}`,
    });
  } catch (e) {
    // edition_number unique 충돌 — retry 1회 후도 실패 시 도달 (또는 비-P2002 에러)
    //   Prisma P2002 (또는 raw 23505 / Unique constraint 메시지) → 409 CONFLICT
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return apiError("이미 같은 회차가 있어요. 다시 시도해주세요.", 409);
    }
    // raw SQL / 메시지 기반 fallback (Prisma 외 path 경유 시 안전망)
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("P2002") || msg.includes("23505") || msg.includes("Unique constraint")) {
      return apiError("이미 같은 회차가 있어요. 다시 시도해주세요.", 409);
    }
    return apiError("회차 추가 중 오류가 발생했습니다.", 500);
  }
});
