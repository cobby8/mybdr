/**
 * Phase 7 A PR1 — 시나리오 1: QuickCreateForm 신규 사용자 (단체+시리즈 0개)
 *
 * 목적: 통합 마법사 default 폼 (`/tournament-admin/tournaments/new/wizard`) 의 회귀 영구 차단.
 *
 * 흐름:
 *   1) `/tournament-admin/tournaments/new/wizard` 진입 (default = QuickCreateForm)
 *   2) "대회 이름" 입력 (e2e-test-{ts}-quick-{rand})
 *   3) "소속 시리즈 (선택)" = "개인 대회 (시리즈 없음)" — 시리즈 0개 신규 사용자 흐름
 *   4) "대회 만들기" 제출
 *   5) redirect 완료 (체크리스트 hub 또는 대회 상세) 확인
 *   6) DB 사후 검증:
 *      - tournament 1건 박제 (name 매칭)
 *      - `status === "draft"` (schema default)
 *      - `series_id === null` (시리즈 미연결)
 *      - `organizerId === testUserId` (운영자 본인 박제)
 *   7) cleanup (afterAll — try-finally + prefix 필터)
 *
 * 안전 가드 (CLAUDE.md §DB 정책):
 *   - 모든 INSERT name 에 "e2e-test-{ts}-" prefix 박제
 *   - afterAll cleanup = prefix 필터 (운영 데이터 영향 0)
 *   - 부분 실패 시에도 다음 실행에서 자동 정리 (prefix 만으로 safety net)
 */
import { test, expect } from "@playwright/test";
import { withTimestampPrefix, cleanupByPrefix, apiHelper, prisma } from "./fixtures";

// ============================================================
// describe — 시나리오 1
// ============================================================
test.describe("Wizard QuickCreateForm — 시나리오 1 (시리즈 0개 신규 사용자)", () => {
  // afterAll cleanup — try-finally 패턴 (개별 test 실패해도 잔존 0)
  test.afterAll(async () => {
    // prefix = "e2e-test-" 전체 — 본 describe 의 모든 데이터 + 이전 실행 잔존도 정리
    const result = await cleanupByPrefix("e2e-test-");
    // 진단용 로그 (Playwright reporter list 모드에서 확인 가능)
    // eslint-disable-next-line no-console
    console.log(
      `[wizard-quick-new] cleanup: tournaments=${result.tournaments} / series=${result.series} / organizations=${result.organizations}`,
    );
    // prisma client disconnect — Playwright worker 종료 시 연결 누수 방지
    await prisma.$disconnect();
  });

  test("대회 이름만 입력 → POST 성공 → DB draft 박제 확인", async ({ page, request }) => {
    // ============================================================
    // 0. 사전 자가검증 — me API 로 운영자 본인 ID 추출
    // 이유: DB 사후 검증에서 `organizerId === testUserId` 매칭 확인용.
    //   storageState 의 cookie 가 동일 사용자임을 보장.
    // ============================================================
    const api = apiHelper(request);
    const meRes = await api.get("/api/web/me");
    expect(meRes.ok, "me API 응답 실패 — storageState 만료 가능").toBeTruthy();
    // 응답 키 — apiSuccess 가 snake_case 자동 변환 / camelCase 폴백
    // userId 는 BigInt 응답 → 클라이언트는 number/string 변환된 형태
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

    // ============================================================
    // 1. wizard 페이지 진입
    // ============================================================
    await page.goto("/tournament-admin/tournaments/new/wizard", { waitUntil: "domcontentloaded" });

    // 권한 가드 통과 확인 — 로딩 끝나고 "새 대회 만들기" 헤더 보임
    // (권한 부족 시 "권한이 필요합니다" 화면이 노출됨 — 그 경우 즉시 fail)
    await expect(page.getByRole("heading", { name: "새 대회 만들기" })).toBeVisible({
      timeout: 10_000,
    });

    // ============================================================
    // 2. 대회 이름 박제 (필수)
    // ============================================================
    const tournamentName = withTimestampPrefix(`quick-${Math.floor(Math.random() * 100000)}`);
    // QuickCreateForm 의 name input — placeholder 또는 label "대회 이름" 기준
    // 운영 코드 line 322: <label>대회 이름 *</label><input autoFocus required ... />
    await page.locator('input[type="text"]').first().fill(tournamentName);

    // ============================================================
    // 3. 시리즈 선택 = "개인 대회 (시리즈 없음)" (default 옵션 value="")
    // ============================================================
    // 운영 코드 line 357: <option value="">개인 대회 (시리즈 없음)</option>
    // initial state 가 이미 seriesId=null + value="" 이므로 명시 선택 불필요.
    // 단, 다른 시리즈가 dropdown 에 있을 수 있으므로 명시적으로 "" 선택해서 의도 박제.
    const seriesSelect = page.locator("select").first();
    await seriesSelect.selectOption({ value: "" });

    // ============================================================
    // 4. 제출
    // ============================================================
    // 이유: Server Action 아닌 fetch POST → router.push(redirect_url) — URL 변경 대기 명시.
    await Promise.all([
      page.waitForURL(/\/tournament-admin\/tournaments\/[a-f0-9-]+/, { timeout: 15_000 }),
      page.getByRole("button", { name: "대회 만들기" }).click(),
    ]);

    // ============================================================
    // 5. DB 사후 검증 — 운영 DB SELECT (read-only)
    // ============================================================
    // 이유: UI redirect 만 확인하면 API 응답을 그대로 신뢰. DB 실측이 회귀 가드의 본질.
    const tournament = await prisma.tournament.findFirst({
      where: { name: tournamentName },
      select: {
        id: true,
        name: true,
        status: true,
        series_id: true,
        organizerId: true,
        format: true,
        maxTeams: true,
        primary_color: true,
      },
    });

    expect(tournament, `DB 에 tournament 박제 0건 — name=${tournamentName}`).not.toBeNull();
    expect(tournament!.status).toBe("draft");
    expect(tournament!.series_id).toBeNull(); // 시리즈 미연결 (시나리오 1 핵심)
    expect(tournament!.organizerId).toBe(testUserId); // 본인 박제 확인
    expect(tournament!.format).toBe("single_elimination"); // QuickCreateForm default 박제
    expect(tournament!.maxTeams).toBe(16);
    expect(tournament!.primary_color).toBeTruthy(); // BDR_PRIMARY_HEX 박제 확인 (값 자체 비검증 — 변경 빈번)

    // ============================================================
    // 6. redirect URL 형식 확인 (URL 패턴)
    // ============================================================
    // 운영 코드 line 271: `/tournament-admin/tournaments/${tournament.id}` (UUID)
    const finalUrl = page.url();
    expect(finalUrl).toContain(`/tournament-admin/tournaments/${tournament!.id}`);
  });
});
