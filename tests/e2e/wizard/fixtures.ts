/**
 * Phase 7 A PR1 — Wizard E2E Fixtures (공통 헬퍼 3종)
 *
 * 이유:
 *   - 시나리오 spec 마다 cleanup / API 호출 / prefix 박제 로직 중복 회피.
 *   - 운영 DB 안전 가드 (prefix + try-finally) 단일 source.
 *
 * 제공 헬퍼:
 *   1) `withTimestampPrefix(label)`     — "e2e-test-{ts}-{label}" 박제 (cleanup 필터용)
 *   2) `cleanupByPrefix(prefix)`        — Prisma 직접 DELETE (Tournament → 의존 순서)
 *   3) `apiHelper(request)`             — Playwright APIRequestContext wrapper (snake_case 응답 박제)
 *
 * 박제 안전 룰 (CLAUDE.md §DB 정책):
 *   - 모든 INSERT 데이터 = prefix 의무
 *   - cleanup = prefix 필터 (`name.startsWith("e2e-test-")`) — 운영 데이터 영향 0
 *   - DROP / TRUNCATE / 대량 UPDATE 절대 금지
 *
 * 사용 예 (spec):
 *   import { test } from "@playwright/test";
 *   import { withTimestampPrefix, cleanupByPrefix, apiHelper } from "./fixtures";
 *   const prefix = withTimestampPrefix("quick");
 *   test.afterAll(async () => { await cleanupByPrefix("e2e-test-"); });
 */
import type { APIRequestContext } from "@playwright/test";
import { prisma } from "@/lib/db/prisma";

// ============================================================
// 1. withTimestampPrefix — prefix 박제
// ============================================================
/**
 * 테스트 데이터 이름에 timestamp prefix 박제.
 * 이유: cleanup 시 prefix 필터로 안전하게 좁힘 (운영 데이터 영향 0).
 *
 * @example
 *   const name = withTimestampPrefix("quick");  // "e2e-test-1700000000000-quick"
 */
export function withTimestampPrefix(label: string): string {
  const ts = Date.now();
  return `e2e-test-${ts}-${label}`;
}

// ============================================================
// 2. cleanupByPrefix — Prisma 직접 DELETE
// ============================================================
/**
 * 테스트 데이터 정리 (Prisma 직접 DELETE).
 *
 * 이유:
 *   - API DELETE 라우트 추가 검증 부담 회피 (운영 코드 변경 0).
 *   - Prisma 직접 호출 = 빠르고 정확 + FK 의존 순서 명시 가능.
 *
 * 삭제 순서 (FK 의존 — 자식 → 부모):
 *   1) tournament_division_rules (대회 종별 룰 — Tournament FK)
 *   2) tournament_matches (매치 — Tournament FK)  ← 필요 시 (시나리오 1 에선 0건)
 *   3) tournaments (대회)
 *   4) tournament_series (시리즈)
 *   5) organizations (단체)
 *
 * 필터:
 *   - tournaments.name.startsWith(prefix)
 *   - tournament_series.name.startsWith(prefix)
 *   - organizations.name.startsWith(prefix)
 *
 * @param prefix — 보통 "e2e-test-" (전체 잔존 정리) 또는 "e2e-test-{ts}-" (시나리오 specific)
 */
export async function cleanupByPrefix(prefix: string): Promise<{
  tournaments: number;
  series: number;
  organizations: number;
}> {
  // 1) 삭제 대상 tournament IDs 사전 수집 (의존 children 삭제용)
  const tournaments = await prisma.tournament.findMany({
    where: { name: { startsWith: prefix } },
    select: { id: true },
  });
  const tournamentIds = tournaments.map((t) => t.id);

  // 2) 자식 row 부터 (Tournament 자체 onDelete=NoAction 인 FK 가 많아 cascade 의존 ❌)
  if (tournamentIds.length > 0) {
    // Prisma client 필드명 = `tournamentId` (camelCase) / DB 컬럼 = `tournament_id` (@map)
    await prisma.tournamentDivisionRule.deleteMany({
      where: { tournamentId: { in: tournamentIds } },
    });
  }

  // 3) Tournament 삭제 (prefix 필터)
  const tDel = await prisma.tournament.deleteMany({
    where: { name: { startsWith: prefix } },
  });

  // 4) Series 삭제 (prefix 필터 — 자식 tournament 가 위에서 이미 삭제됨)
  // 모델명 = tournament_series (Prisma client 는 snake_case 모델명 그대로 사용)
  const sDel = await prisma.tournament_series.deleteMany({
    where: { name: { startsWith: prefix } },
  });

  // 5) Organization 삭제 (prefix 필터)
  const oDel = await prisma.organizations.deleteMany({
    where: { name: { startsWith: prefix } },
  });

  return {
    tournaments: tDel.count,
    series: sDel.count,
    organizations: oDel.count,
  };
}

// ============================================================
// 3. apiHelper — Playwright APIRequestContext wrapper
// ============================================================
/**
 * Playwright `request` (storageState cookie 자동 포함) wrapper.
 *
 * 이유:
 *   - 응답 키 snake_case 자동 변환 (errors.md 2026-04-17 박제 5회 사고 — apiSuccess wrapper 룰).
 *   - JSON 파싱 + 에러 throw + body 표준화 단일 source.
 *
 * 사용 예:
 *   const api = apiHelper(request);
 *   const { ok, status, data } = await api.post("/api/web/tournaments", { name: "..." });
 */
export function apiHelper(request: APIRequestContext) {
  return {
    async post(url: string, body: Record<string, unknown>) {
      const res = await request.post(url, {
        data: body,
        headers: { "Content-Type": "application/json" },
      });
      const json = await res.json().catch(() => ({}));
      return {
        ok: res.ok(),
        status: res.status(),
        // 응답은 snake_case wrapper 가정 (apiSuccess 자동 변환).
        // 예: { tournament_id, redirect_url } — camelCase 폴백도 허용.
        data: json as Record<string, unknown>,
      };
    },

    async get(url: string) {
      const res = await request.get(url);
      const json = await res.json().catch(() => ({}));
      return {
        ok: res.ok(),
        status: res.status(),
        data: json as Record<string, unknown>,
      };
    },
  };
}

// Prisma client export — 시나리오 spec 에서 DB 사후 검증용
export { prisma };
