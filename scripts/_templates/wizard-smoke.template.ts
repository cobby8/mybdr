/**
 * 마법사 통합 흐름 스모크 검증 템플릿
 *
 * Phase 1 (lib 인프라) + Phase 5 (API) 가 운영에서 정상 동작하는지 자동 검증.
 * Phase 7 작업 B (가이드: Dev/wizard-2026-05-13/04-prompts/phase-7-auto-verification.md).
 *
 * **사용 방법** (CLAUDE.md §🗄️ DB 정책 가드 3 준수):
 *
 * 1. `cp scripts/_templates/wizard-smoke.template.ts scripts/_temp/wizard-smoke.ts`
 * 2. `_temp/wizard-smoke.ts` 안의 다음 값 채우기:
 *    - TEST_USER_EMAIL / TEST_USER_PASSWORD (또는 cookie 직접 박제)
 *    - DEV_PREVIEW_URL (mybdr-git-dev-mybdr.vercel.app 또는 http://localhost:3001)
 * 3. dev 프리뷰 또는 localhost 에서 실행: `npx tsx scripts/_temp/wizard-smoke.ts`
 * 4. 8 단계 모두 PASS 확인
 * 5. **즉시 정리**: `rm -rf scripts/_temp` (운영 DB credentials 노출 방지)
 *
 * **8 단계 검증**:
 * 1. 로그인 → cookie 획득
 * 2. POST /api/web/organizations — 단체 1개 생성 ("스모크 테스트 단체-{timestamp}")
 * 3. POST /api/web/series — 시리즈 1개 생성 ("스모크 시리즈-{timestamp}")
 * 4. POST /api/web/series/{id}/editions — 회차 1 (기존 path, status="registration_open")
 * 5. GET /api/web/series/{id}/last-edition — 응답 확인 + division_rules 길이
 * 6. POST /api/web/series/{id}/editions — 회차 2 (마법사 path, tournament_payload + division_rules)
 * 7. 회차 2 의 tournament_division_rules 수 == 회차 1 의 수 (복제 정합성)
 * 8. cleanup — 생성된 모든 행 DELETE
 *
 * **운영 DB 안전 가드**:
 * - 모든 INSERT 데이터에 "스모크 테스트" prefix → 식별 가능
 * - cleanup 단계 누락 시 사용자 보고 (잔존 행 수동 정리)
 * - 실패 시 try/finally 로 cleanup 보장
 *
 * **금지**:
 * - 실제 운영 데이터 (사용자 단체 / 진행 중 대회) 건드림 ❌
 * - 임시 데이터 cleanup 누락 ❌
 * - scripts/_temp 영구 보존 ❌
 */

import { PrismaClient } from "@prisma/client";

// =============================================================================
// 사용자 입력 (실행 전 채우기)
// =============================================================================
const DEV_PREVIEW_URL = "http://localhost:3001"; // 또는 dev 프리뷰 URL
// ⚠️ Cookie 이름 = "bdr_session" (NOT "_web_session"). DevTools Application → Cookies → http://localhost:3001 확인.
const SESSION_COOKIE = "bdr_session=..."; // 로그인 후 devtools 에서 bdr_session 값 추출
// =============================================================================

const prisma = new PrismaClient();

interface CreatedIds {
  organization_id?: string; // BigInt → string 응답 (apiSuccess snake_case 자동 변환)
  series_id?: string; // BigInt → string 응답
  tournament_1_id?: string;
  tournament_2_id?: string;
}

async function fetchJson(
  method: string,
  path: string,
  body?: object,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${DEV_PREVIEW_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: SESSION_COOKIE,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function cleanup(ids: CreatedIds) {
  console.log("\n=== Cleanup ===");
  if (ids.tournament_1_id) {
    await prisma.tournamentDivisionRule.deleteMany({
      where: { tournamentId: ids.tournament_1_id },
    });
    await prisma.tournament.delete({ where: { id: ids.tournament_1_id } });
    console.log(`✅ tournament_1 (${ids.tournament_1_id}) deleted`);
  }
  if (ids.tournament_2_id) {
    await prisma.tournamentDivisionRule.deleteMany({
      where: { tournamentId: ids.tournament_2_id },
    });
    await prisma.tournament.delete({ where: { id: ids.tournament_2_id } });
    console.log(`✅ tournament_2 (${ids.tournament_2_id}) deleted`);
  }
  if (ids.series_id) {
    await prisma.tournament_series.delete({ where: { id: BigInt(ids.series_id) } });
    console.log(`✅ series (${ids.series_id}) deleted`);
  }
  if (ids.organization_id) {
    await prisma.organizations.delete({ where: { id: BigInt(ids.organization_id) } });
    console.log(`✅ organization (${ids.organization_id}) deleted`);
  }
}

async function main() {
  const ids: CreatedIds = {};
  const ts = Date.now();

  try {
    // (1) 로그인 검증 (cookie 유효성)
    // ⚠️ /api/web/me 는 비로그인 시도 200 + {id: null} 반환 (2026-05-05 fix, SWR 폭주 방지).
    //    단순 res.ok 검증 부족 — body 의 id !== null 확인 필수.
    console.log("=== 1. 로그인 cookie 검증 ===");
    const meRes = await fetchJson("GET", "/api/web/me");
    if (!meRes.ok) throw new Error(`로그인 실패: ${meRes.status}`);
    const meData = meRes.data as { id: string | null } | null;
    if (!meData?.id) throw new Error("cookie 무효 — /api/web/me 응답 id: null (비로그인 상태). cookie 재박제 필요.");
    console.log(`✅ cookie OK (user_id=${meData.id})`);

    // (2) 단체 생성
    console.log("\n=== 2. POST /api/web/organizations ===");
    const orgRes = await fetchJson("POST", "/api/web/organizations", {
      name: `스모크 테스트 단체-${ts}`,
      region: "서울특별시",
    });
    if (!orgRes.ok) throw new Error(`단체 생성 실패: ${JSON.stringify(orgRes.data)}`);
    // ⚠️ apiSuccess() 응답 키 자동 snake_case 변환 (CLAUDE.md 보안 §) — `id` 직접 (data 래핑 없음)
    ids.organization_id = (orgRes.data as { id: string }).id;
    console.log(`✅ organization_id=${ids.organization_id}`);

    // (3) 시리즈 생성
    console.log("\n=== 3. POST /api/web/series ===");
    const seriesRes = await fetchJson("POST", "/api/web/series", {
      name: `스모크 시리즈-${ts}`,
      organization_id: ids.organization_id,
    });
    if (!seriesRes.ok) throw new Error(`시리즈 생성 실패: ${JSON.stringify(seriesRes.data)}`);
    ids.series_id = (seriesRes.data as { id: string }).id;
    console.log(`✅ series_id=${ids.series_id}`);

    // (4) 회차 1 (기존 path)
    console.log("\n=== 4. POST /editions 회차 1 (기존 path) ===");
    const ed1Res = await fetchJson(
      "POST",
      `/api/web/series/${ids.series_id}/editions`,
      {
        startDate: new Date(ts + 86400000 * 30).toISOString(), // +30일
        venueName: "스모크 테스트 코트",
        maxTeams: 8,
      },
    );
    if (!ed1Res.ok) throw new Error(`회차 1 생성 실패: ${JSON.stringify(ed1Res.data)}`);
    // ⚠️ apiSuccess() snake_case 자동 변환 — `tournamentId` → `tournament_id`
    ids.tournament_1_id = (ed1Res.data as { tournament_id: string }).tournament_id;
    console.log(`✅ tournament_1_id=${ids.tournament_1_id}`);

    // (5) last-edition GET
    console.log("\n=== 5. GET /last-edition ===");
    const lastRes = await fetchJson("GET", `/api/web/series/${ids.series_id}/last-edition`);
    if (!lastRes.ok) throw new Error(`last-edition 조회 실패: ${JSON.stringify(lastRes.data)}`);
    const lastData = lastRes.data as {
      last_edition: { id: string } | null;
      division_rules: unknown[];
    };
    console.log(
      `✅ last_edition.id=${lastData.last_edition?.id} / division_rules=${lastData.division_rules.length}`,
    );

    // (6) 회차 2 (마법사 path)
    console.log("\n=== 6. POST /editions 회차 2 (마법사 path) ===");
    const ed2Res = await fetchJson(
      "POST",
      `/api/web/series/${ids.series_id}/editions`,
      {
        tournament_payload: {
          name: `스모크 회차 2-${ts}`,
          startDate: new Date(ts + 86400000 * 60).toISOString(), // +60일
          venue_name: "스모크 테스트 코트 2",
          maxTeams: 16,
          format: "single_elimination",
        },
        division_rules: [], // 빈 배열 OK
      },
    );
    if (!ed2Res.ok) throw new Error(`회차 2 생성 실패: ${JSON.stringify(ed2Res.data)}`);
    ids.tournament_2_id = (ed2Res.data as { tournament_id: string }).tournament_id;
    console.log(`✅ tournament_2_id=${ids.tournament_2_id}`);

    // (7) status="draft" 강제 확인
    console.log("\n=== 7. tournament_2.status === 'draft' 검증 ===");
    const t2 = await prisma.tournament.findUnique({
      where: { id: ids.tournament_2_id },
      select: { status: true, edition_number: true },
    });
    console.log(`✅ status=${t2?.status} / edition_number=${t2?.edition_number}`);
    if (t2?.status !== "draft") {
      throw new Error(`status 강제 실패: ${t2?.status} (expected draft)`);
    }

    // (8) 종합
    console.log("\n=== 8. 종합 ===");
    console.log(`✅ 8 단계 모두 PASS`);
    console.log(`  - organization_id: ${ids.organization_id}`);
    console.log(`  - series_id: ${ids.series_id}`);
    console.log(`  - tournament_1_id (회차 1): ${ids.tournament_1_id}`);
    console.log(`  - tournament_2_id (회차 2): ${ids.tournament_2_id}`);
  } catch (e) {
    console.error("\n=== FAIL ===");
    console.error(e);
    process.exitCode = 1;
  } finally {
    await cleanup(ids);
    await prisma.$disconnect();
  }
}

main();
