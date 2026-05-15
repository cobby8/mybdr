/**
 * Phase 7 A PR1 — Wizard E2E Auth Setup
 *
 * 이유:
 *   - 시나리오 spec 마다 로그인 form 입력 반복 시 ~5초 × N 시나리오 = 비용 누적.
 *   - storageState 1회 박제 후 `playwright.config.ts` wizard project 가 재사용 → 시나리오 즉시 진입.
 *
 * 흐름:
 *   1) `.env.test.local` 의 TEST_USER_EMAIL / TEST_USER_PASSWORD 검증
 *   2) `/login` 페이지 진입 (Server Action `loginAction` 사용)
 *   3) email/password input + submit
 *   4) navigation 완료까지 `waitForURL` 명시 (cookie 박제 보장)
 *   5) `context.storageState()` → `.auth/wizard.json` 박제
 *
 * 박제 위치: `.auth/wizard.json` (gitignore `.auth/*.json` 박제 — commit 0)
 *
 * 실행:
 *   npm run test:e2e:wizard:setup   (단독)
 *   npm run test:e2e:wizard         (자동 의존 — config.projects[wizard].dependencies)
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";

const STORAGE_STATE = path.resolve(process.cwd(), ".auth/wizard.json");

setup("로그인 → storageState 박제", async ({ page }) => {
  // 1) 자격증명 검증 — 빈 placeholder 로 실행 시 즉시 fail (혼란 메시지 회피)
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "[auth.setup] TEST_USER_EMAIL / TEST_USER_PASSWORD 가 .env.test.local 에 비어 있습니다. " +
        "실행 전 자격증명을 채워주세요. (gitignore 박제 — 안전)",
    );
  }

  // 2) /login 진입
  // 이유: 운영 코드의 인증 흐름 = Server Action `loginAction` (src/app/actions/auth.ts) → WEB_SESSION_COOKIE HttpOnly 박제.
  //   API 직접 호출 (예: POST /api/auth/login) 도 가능하지만, form 흐름 통과가 회귀 가드로 더 안정적.
  await page.goto("/login", { waitUntil: "domcontentloaded" });

  // 3) form 입력
  // 셀렉터 우선순위: label → name → placeholder (운영 코드 input 의 name 속성 기반)
  // 운영 /login 페이지의 input name 은 "email" / "password" (Server Action FormData 키)
  await page.locator('input[name="email"], input[type="email"]').first().fill(email);
  await page.locator('input[name="password"], input[type="password"]').first().fill(password);

  // 4) 제출 + navigation 대기
  // 이유: Server Action 제출 후 redirect 까지 cookie 박제 완료 보장 (단순 click 만 하면 race condition).
  //   성공 시 운영 코드는 `/` 또는 `redirect` 쿼리 파라미터 경로로 이동. /login 이탈만 검증하면 충분.
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), { timeout: 15_000 }),
    page.locator('button[type="submit"]').first().click(),
  ]);

  // 5) 세션 검증 — `/api/web/me` 가 200 응답 + role 박제 확인
  // 이유: cookie 가 박제됐어도 role 권한 부족 시 wizard 진입 단계에서 fail — 사전 fail 빠르게.
  const meRes = await page.request.get("/api/web/me");
  expect(meRes.ok(), "TEST_USER 가 인증 실패 — 자격증명 또는 status 확인").toBeTruthy();
  const meJson = await meRes.json();
  const role = (meJson.role ?? meJson.data?.role ?? "") as string;
  const allowed = ["super_admin", "organizer", "admin", "tournament_admin"];
  expect(
    allowed.includes(role),
    `TEST_USER 권한 부족 — 현재 role=${role}, 필요 role=${allowed.join("|")}`,
  ).toBeTruthy();

  // 6) storageState 박제 — wizard project 가 재사용
  await page.context().storageState({ path: STORAGE_STATE });
});
