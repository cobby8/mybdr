/**
 * /api/web/series/[id]/last-edition — 시리즈의 마지막 회차 + 종별 룰 조회.
 *
 * 2026-05-14 (Phase 5 작업 A) — 통합 마법사 "이전 회차 복제" prefill 용.
 *
 * 동작:
 *   1. 시리즈 조회 (organizer_id 검증을 위해 select)
 *   2. IDOR 가드 — series.organizer_id === ctx.userId OR super_admin (Phase C 의
 *      series PATCH/DELETE 와 달리 본 GET 은 organizer 본인 + super_admin 으로 좁힘.
 *      마법사 진입 자체가 시리즈 소유자만 가능하므로 단체 owner/admin 까지 풀 필요 X).
 *   3. 마지막 회차 = orderBy [{ edition_number: desc }, { createdAt: desc }] findFirst.
 *      (edition_number 누락된 legacy 회차 폴백 — createdAt 으로 정렬).
 *   4. 종별 룰 = tournamentDivisionRule.findMany { tournamentId } orderBy sortOrder.
 *   5. 응답: { series, last_edition, division_rules }
 *      - last_edition.status 는 응답에서 제거 (마법사는 항상 draft 강제 — 02-db-changes §3).
 *      - apiSuccess() 가 BigInt → string / camelCase → snake_case 자동 변환.
 *
 * 응답 분기:
 *   - 회차 0개 시리즈 (방금 만든 시리즈 등): last_edition = null, division_rules = []
 *   - 회차 있음: last_edition = Tournament 전체 (status 제외), division_rules = 배열
 *
 * 의존 (read-only):
 *   - tournament_series (organizer_id 검증)
 *   - tournament (마지막 회차)
 *   - tournament_division_rules (종별 룰)
 *
 * 운영 영향: SELECT 만 — destructive 0. CLAUDE.md §DB 정책 가드 5 (영향 0 작업).
 */

import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

type RouteCtx = { params: Promise<{ id: string }> };

export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id: idStr } = await routeCtx.params;

  // (1) seriesId BigInt 파싱 — 잘못된 id 형식 방어
  let seriesId: bigint;
  try {
    seriesId = BigInt(idStr);
  } catch {
    return apiError("유효하지 않은 시리즈 ID입니다.", 400);
  }

  // (2) 시리즈 조회 — organizer_id (IDOR 가드 용) + 응답 필드 (id/name/tournaments_count)
  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesId },
    select: {
      id: true,
      name: true,
      organizer_id: true,
      tournaments_count: true,
    },
  });

  if (!series) {
    return apiError("시리즈를 찾을 수 없습니다.", 404);
  }

  // (3) IDOR 가드 — organizer 본인 OR super_admin 만 통과
  //   - 단체 owner/admin 까지 풀 수도 있지만 (Phase C 의 requireSeriesEditor 패턴), 마법사
  //     진입 권한 자체가 시리즈 소유자 기준으로 좁혀져 있음. 본 GET 은 보수적으로 organizer
  //     + super_admin 만 허용. 추후 마법사 권한 확장 시 동기화.
  if (series.organizer_id !== ctx.userId && !isSuperAdmin(ctx.session)) {
    return apiError("본인 시리즈만 조회 가능합니다.", 403);
  }

  // (4) 마지막 회차 조회 — edition_number 내림차순 + createdAt 내림차순 폴백
  //   - edition_number 가 NULL 인 legacy 회차도 있을 수 있음 → createdAt 으로 안전 폴백.
  const lastEdition = await prisma.tournament.findFirst({
    where: { series_id: series.id },
    orderBy: [
      { edition_number: "desc" },
      { createdAt: "desc" },
    ],
  });

  // (5) 종별 룰 — lastEdition 이 있을 때만 조회
  //   - sortOrder 오름차순 (UI 노출 순서 정합)
  const divisionRules = lastEdition
    ? await prisma.tournamentDivisionRule.findMany({
        where: { tournamentId: lastEdition.id },
        orderBy: { sortOrder: "asc" },
      })
    : [];

  // (6) 응답 구성
  //   - last_edition.status 는 응답에서 제외 (마법사는 항상 draft 강제 — 02-db-changes §3).
  //     destructuring 으로 status 만 떼어내고 나머지 전체 박제. apiSuccess 가 snake_case 변환.
  //   - 회차 0개 시리즈: last_edition = null, division_rules = []
  let lastEditionResponse: Omit<typeof lastEdition, "status"> | null = null;
  if (lastEdition) {
    // _status 미사용 변수 — ESLint 회피용 underscore prefix
    const { status: _status, ...rest } = lastEdition;
    void _status;
    lastEditionResponse = rest;
  }

  return apiSuccess({
    series: {
      id: series.id,
      name: series.name,
      tournaments_count: series.tournaments_count ?? 0,
    },
    last_edition: lastEditionResponse,
    division_rules: divisionRules,
  });
});
