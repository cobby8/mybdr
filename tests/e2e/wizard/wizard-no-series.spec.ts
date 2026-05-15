/**
 * Phase 7 A PR3 — 시나리오 3: 1회성 대회 (단체+시리즈 없이)
 *
 * 목적: 마법사 default 폼 (`/tournament-admin/tournaments/new/wizard`) 의 "1회성 대회" 흐름 회귀 영구 차단.
 *
 * 시나리오 1 과의 차이:
 *   - 시나리오 1 = "신규 사용자 (시리즈 0개)" — 시리즈 dropdown 에 옵션 없음 자체 검증.
 *   - 시나리오 3 = "1회성 대회" — 시리즈가 있을 수도 있는 상황에서 의도적으로 "개인 대회 (시리즈 없음)" 선택.
 *     운영 코드 line 399: <option value="">개인 대회 (시리즈 없음)</option> — 첫 옵션 명시 선택.
 *
 * 흐름:
 *   1) `/tournament-admin/tournaments/new/wizard` 진입 (default = QuickCreateForm)
 *   2) "대회 이름" 입력 (e2e-test-{ts}-no-series-{rand})
 *   3) "소속 시리즈 (선택)" = "" (개인 대회) 명시 선택 — 1회성 의도 박제
 *   4) "대회 만들기" 제출
 *   5) redirect 완료 (체크리스트 hub) 확인
 *   6) DB 사후 검증:
 *      - tournament.series_id === null (1회성 핵심)
 *      - tournament.status === "draft" (schema default)
 *      - tournament.organizerId === testUserId
 *      - tournament.edition_number === null (시리즈 미연결 = 회차 없음)
 *   7) cleanup (afterAll — try-finally + prefix 필터)
 *
 * 안전 가드 (CLAUDE.md §DB 정책):
 *   - 모든 INSERT name 에 "e2e-test-{ts}-" prefix 박제
 *   - afterAll cleanup = prefix 필터 (운영 데이터 영향 0)
 *   - 시드 없음 (시나리오 1 동일 — 운영자만 로그인 상태)
 */
import { test, expect } from "@playwright/test";
import { withTimestampPrefix, cleanupByPrefix, apiHelper, prisma } from "./fixtures";

test.describe("Wizard QuickCreateForm — 시나리오 3 (1회성 대회 — 단체+시리즈 없이)", () => {
  // afterAll cleanup — try-finally 패턴
  test.afterAll(async () => {
    // prefix "e2e-test-" 전체 — 본 describe + 이전 실행 잔존 모두 정리
    const result = await cleanupByPrefix("e2e-test-");
    // eslint-disable-next-line no-console
    console.log(
      `[wizard-no-series] cleanup: tournaments=${result.tournaments} / series=${result.series} / organizations=${result.organizations}`,
    );
    await prisma.$disconnect();
  });

  test("시리즈 명시 미선택 → 1회성 대회 박제 (series_id=null, edition_number=null)", async ({
    page,
    request,
  }) => {
    // ==========================================================================
    // 0. me API — testUserId 추출 (organizerId 검증용)
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
    const testUserId = BigInt(userIdRaw!);

    // ==========================================================================
    // 1. wizard 페이지 진입
    // ==========================================================================
    await page.goto("/tournament-admin/tournaments/new/wizard", {
      waitUntil: "domcontentloaded",
    });

    // 권한 가드 통과 — "새 대회 만들기" 헤더 노출 (운영 코드 line 315)
    await expect(page.getByRole("heading", { name: "새 대회 만들기" })).toBeVisible({
      timeout: 10_000,
    });

    // ==========================================================================
    // 2. 대회 이름 박제 (필수)
    //    이유: prefix = "e2e-test-{ts}-no-series-{rand}" — cleanup 필터 매칭 + 시나리오 식별
    // ==========================================================================
    const tournamentName = withTimestampPrefix(
      `no-series-${Math.floor(Math.random() * 100000)}`,
    );
    // 운영 코드 line 364~388 — autoFocus 첫 번째 text input = 대회 이름 input
    await page.locator('input[type="text"]').first().fill(tournamentName);

    // ==========================================================================
    // 3. 시리즈 dropdown = "" (개인 대회 / 시리즈 없음) 명시 선택
    //    이유: 시나리오 1 과의 차이 = 시리즈가 있을 수 있는 상황에서도 1회성 의도 박제.
    //    운영 코드 line 399: <option value="">개인 대회 (시리즈 없음)</option>
    // ==========================================================================
    const seriesSelect = page.locator("select").first();
    await seriesSelect.selectOption({ value: "" });

    // ==========================================================================
    // 4. 제출 → router.push(`/tournament-admin/tournaments/${tournament.id}`)
    // ==========================================================================
    await Promise.all([
      page.waitForURL(/\/tournament-admin\/tournaments\/[a-f0-9-]+/, { timeout: 15_000 }),
      page.getByRole("button", { name: "대회 만들기" }).click(),
    ]);

    // ==========================================================================
    // 5. DB 사후 검증 — 1회성 대회 박제 확인
    // ==========================================================================
    const tournament = await prisma.tournament.findFirst({
      where: { name: tournamentName },
      select: {
        id: true,
        name: true,
        status: true,
        series_id: true,
        edition_number: true,
        organizerId: true,
        format: true,
        maxTeams: true,
      },
    });

    expect(tournament, `DB 에 tournament 박제 0건 — name=${tournamentName}`).not.toBeNull();

    // 시나리오 3 핵심 검증 = 1회성 (series_id=null + edition_number=null)
    expect(tournament!.series_id).toBeNull(); // ← 의뢰서 §B 핵심 (1회성)
    expect(tournament!.edition_number).toBeNull(); // 시리즈 미연결 = 회차 없음 정합

    // 기타 정합 (시나리오 1 과 동일)
    expect(tournament!.status).toBe("draft"); // QuickCreateForm = draft 박제 (즉시 공개 X)
    expect(tournament!.organizerId).toBe(testUserId); // 본인 박제 (IDOR 가드 정합)
    expect(tournament!.format).toBe("single_elimination"); // QuickCreateForm default 박제
    expect(tournament!.maxTeams).toBe(16); // QuickCreateForm default 박제

    // ==========================================================================
    // 6. redirect URL 형식 확인 (UUID 매핑 정합)
    // ==========================================================================
    const finalUrl = page.url();
    expect(finalUrl).toContain(`/tournament-admin/tournaments/${tournament!.id}`);
  });
});
