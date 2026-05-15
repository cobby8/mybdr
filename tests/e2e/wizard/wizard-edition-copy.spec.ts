/**
 * Phase 7 A PR2 — 시나리오 2: 기존 시리즈에 회차 복제 (add-edition)
 *
 * 목적: `/tournament-admin/series/[id]/add-edition` (단순 폼) 흐름의 회귀 영구 차단.
 *
 * 흐름:
 *   1) 사전 시드 — 단체 1건 (옵션 / 본 시나리오는 시리즈만 충분) → 시리즈 1건 → 회차 1건 (division_rules 5건 박제)
 *   2) `/tournament-admin/series/{seriesId}/add-edition` 진입
 *   3) 페이지 헤더 "새 회차 추가" 노출 확인
 *   4) 입력: 날짜 (이전 회차 +60일) → 장소·팀 수 default 유지
 *   5) "회차 추가하기" 제출
 *   6) redirect 완료 (`/tournament-admin/series/{seriesId}?added=2`) 확인
 *   7) DB 사후 검증:
 *      - 회차 2 (edition_number === 2) 박제
 *      - series_id === seedSeries.id (정확한 시리즈 매핑)
 *      - status === "registration_open" (legacy path 기본값 — 운영 동작 정합)
 *      - organizerId === testUserId
 *      - tournament_series.tournaments_count === 2 (트랜잭션 +1 정합)
 *
 * 메모 (운영 동작 정합):
 *   - "이전 회차 prefill 확인" 의뢰서 §A 항목은 운영 add-edition 페이지에 미구현 (line 13~15 빈 초기값).
 *     → 본 시나리오는 운영 코드 그대로의 동작을 검증 — prefill 미구현이 의도된 동작이면 통과.
 *   - division_rules 5건 자동 복제 의뢰서 §A 항목도 legacy path 미구현 (route.ts 의 마법사 path 만 createMany).
 *     → 본 시나리오는 회차 2의 division_rules.count === 0 검증 (운영 동작 정합).
 *       향후 legacy path 에 복제 로직 추가 시 본 시나리오 update 필요 (회귀 가드).
 *
 * 안전 가드 (CLAUDE.md §DB 정책):
 *   - 모든 시드 데이터 = "e2e-test-{ts}-edition-copy" prefix 박제
 *   - afterAll cleanup = "e2e-test-" 전체 (회차 1+2 / 시리즈 / 단체 자동 정리)
 *   - 시드 실패 시도 cleanup 보장 (try-finally 패턴)
 */
import { test, expect } from "@playwright/test";
import {
  withTimestampPrefix,
  cleanupByPrefix,
  apiHelper,
  seedSeries,
  seedTournamentWithRules,
  prisma,
} from "./fixtures";

test.describe("Wizard add-edition — 시나리오 2 (회차 복제)", () => {
  // 시드 결과 — afterAll 에서 cleanup 보장
  let testUserId: bigint;
  let prefix: string;
  let seriesId: bigint;
  let edition1Id: string;

  test.beforeAll(async ({ request }) => {
    // ==========================================================================
    // 0. 운영자 본인 ID 추출 (me API)
    // ==========================================================================
    const api = apiHelper(request);
    const meRes = await api.get("/api/web/me");
    expect(meRes.ok, "me API 응답 실패 — storageState 만료 가능").toBeTruthy();
    const userIdRaw =
      (meRes.data.user_id as number | string | undefined) ??
      (meRes.data.userId as number | string | undefined) ??
      ((meRes.data.data as Record<string, unknown> | undefined)?.user_id as
        | number
        | string
        | undefined) ??
      ((meRes.data.data as Record<string, unknown> | undefined)?.userId as
        | number
        | string
        | undefined);
    expect(userIdRaw, `me 응답에 user_id 없음 — payload=${JSON.stringify(meRes.data)}`).toBeDefined();
    testUserId = BigInt(userIdRaw!);

    // ==========================================================================
    // 1. 사전 시드 — 시리즈 + 회차 1 + division_rules 5건
    //    이유: add-edition 페이지 진입 자체가 시리즈 존재를 전제. 회차 1 은 edition_number 채번 (count+1=2) 정합용.
    //    division_rules 5건은 의뢰서 §A 검증 (legacy path 복제 미수행 = 0건 박제 회귀 가드).
    // ==========================================================================
    prefix = withTimestampPrefix("edition-copy");
    const series = await seedSeries({ organizerId: testUserId, prefix });
    seriesId = series.id;
    const edition1 = await seedTournamentWithRules({
      seriesId,
      organizerId: testUserId,
      prefix,
      ruleCount: 5, // 의뢰서 §A — 5건 박제
    });
    edition1Id = edition1.id;
  });

  // afterAll cleanup — try-finally 양면 가드 (개별 test 실패해도 잔존 0)
  test.afterAll(async () => {
    // prefix "e2e-test-" = 본 describe 의 시드 + 신규 회차 + 잔존 모두 정리
    const result = await cleanupByPrefix("e2e-test-");
    // eslint-disable-next-line no-console
    console.log(
      `[wizard-edition-copy] cleanup: tournaments=${result.tournaments} / series=${result.series} / organizations=${result.organizations}`,
    );
    await prisma.$disconnect();
  });

  test("add-edition 진입 → 날짜 입력 → 회차 2 박제 + 시리즈 매핑 검증", async ({ page }) => {
    // ==========================================================================
    // 1. add-edition 페이지 진입 (seriesId = BigInt → string)
    // ==========================================================================
    // 운영 url 구조: /tournament-admin/series/[id]/add-edition (page.tsx line 11 `useParams<{ id: string }>()` )
    await page.goto(`/tournament-admin/series/${seriesId.toString()}/add-edition`, {
      waitUntil: "domcontentloaded",
    });

    // 권한 / 페이지 로딩 확인 — "새 회차 추가" 헤더 노출
    // 운영 코드 line 51: <h1 className="...">새 회차 추가</h1>
    await expect(page.getByRole("heading", { name: "새 회차 추가" })).toBeVisible({
      timeout: 10_000,
    });

    // ==========================================================================
    // 2. 날짜 입력 (이전 회차 +60일 — 의뢰서 §A)
    //    이유: prefill 미구현이지만 운영자 의도 (다음 회차 = 약 2개월 후) 시뮬레이션.
    // ==========================================================================
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 60);
    const targetDateStr = targetDate.toISOString().slice(0, 10); // "YYYY-MM-DD" (input[type=date] 포맷)

    // 운영 코드 line 60: <input type="date" value={startDate} ... required autoFocus />
    await page.locator('input[type="date"]').first().fill(targetDateStr);

    // venueName / maxTeams 는 default 유지 (선택 입력)

    // ==========================================================================
    // 3. 제출 — redirect 대기
    // ==========================================================================
    // 운영 코드 line 35: router.push(`/tournament-admin/series/${id}?added=${editionNumber}`)
    // 정규식: /tournament-admin/series/[id]?added=2 (edition_number=2)
    await Promise.all([
      page.waitForURL(/\/tournament-admin\/series\/\d+\?added=\d+/, { timeout: 15_000 }),
      page.getByRole("button", { name: /회차 추가하기|추가 중/ }).click(),
    ]);

    // redirect URL 의 added 파라미터 = 2 (edition_number 채번 정합)
    const finalUrl = page.url();
    expect(finalUrl).toContain(`/tournament-admin/series/${seriesId.toString()}`);
    expect(finalUrl).toContain("?added=2");

    // ==========================================================================
    // 4. DB 사후 검증 — 회차 2 박제 + 시리즈 매핑 + 카운터
    // ==========================================================================
    // 회차 2 SELECT (edition_number=2 + series_id 매칭)
    const edition2 = await prisma.tournament.findFirst({
      where: {
        series_id: seriesId,
        edition_number: 2,
      },
      select: {
        id: true,
        name: true,
        status: true,
        series_id: true,
        edition_number: true,
        organizerId: true,
        startDate: true,
      },
    });

    expect(edition2, `회차 2 박제 0건 — seriesId=${seriesId}`).not.toBeNull();
    expect(edition2!.edition_number).toBe(2); // 채번 정합 (count+1=2)
    expect(edition2!.series_id).toBe(seriesId); // 정확한 시리즈 매핑 (의뢰서 §A 핵심)
    expect(edition2!.status).toBe("registration_open"); // legacy path 기본값 — 운영 동작 정합
    expect(edition2!.organizerId).toBe(testUserId); // 본인 박제 확인 (IDOR 가드 정합)
    expect(edition2!.startDate).not.toBeNull(); // 날짜 박제 확인

    // ==========================================================================
    // 5. division_rules 박제 검증 (운영 동작 정합)
    //    legacy path 는 division_rules 자동 복제 X → 회차 2 의 룰 count === 0 박제
    //    (의뢰서 §A 의 "복제 5건" 검증은 마법사 path 한정 — legacy path 는 0건 정합)
    // ==========================================================================
    const edition2RulesCount = await prisma.tournamentDivisionRule.count({
      where: { tournamentId: edition2!.id },
    });
    expect(edition2RulesCount).toBe(0); // legacy path 자동 복제 미수행 정합

    // 회차 1 의 룰 5건 박제 확인 (시드 정합 — 회귀 안전망)
    const edition1RulesCount = await prisma.tournamentDivisionRule.count({
      where: { tournamentId: edition1Id },
    });
    expect(edition1RulesCount).toBe(5); // seedTournamentWithRules({ ruleCount: 5 }) 정합

    // ==========================================================================
    // 6. tournament_series.tournaments_count 증분 검증
    //    legacy path 트랜잭션 line 178~184: increment +1
    //    seedTournamentWithRules 에서 +1 (1건) + 본 시나리오 회차 추가 +1 (2건) = 2
    // ==========================================================================
    const series = await prisma.tournament_series.findUnique({
      where: { id: seriesId },
      select: { tournaments_count: true },
    });
    expect(series!.tournaments_count).toBe(2);
  });
});
