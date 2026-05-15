import { defineConfig, devices } from "@playwright/test";

// .env.test.local 로드 (TEST_USER_EMAIL / TEST_USER_PASSWORD / BASE_URL) — gitignored 박제
// 이유: 자격증명 하드코딩 금지 + Playwright 자체 dotenv 자동 로드 없음 → 수동 require
// (Node 20+ 의 --env-file 플래그 의존 회피 — vitest/dev 와 dotenv 정책 불일치 방지)
import { config as loadDotenv } from "dotenv";
import path from "path";
loadDotenv({ path: path.resolve(process.cwd(), ".env.test.local") });

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false, // localStorage 충돌 방지 (순차 실행)
  reporter: [["list"]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3001",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      // iPhone 14 디바이스 프로파일(webkit 기본)은 chromium-only 환경에서 실행 불가
      // → Pixel 7(chromium 기반 + 모바일 뷰포트/터치) 사용으로 대체
      name: "mobile",
      use: { ...devices["Pixel 7"] }, // chromium + 412 x 915 + 모바일 UA
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    // ==========================================================
    // 2026-05-15 Phase 7 A PR1 — Wizard E2E project
    // 이유: storageState 1회 박제로 시나리오 재로그인 비용 0 + 로그인 회귀 안정성 ↑
    // 의존: setup project (auth.setup.ts) 가 .auth/wizard.json 박제 → wizard 가 storageState 로 재사용
    // 운영 DB 영향: 모든 INSERT 데이터 = "e2e-test-{timestamp}" prefix + afterAll cleanup 의무
    // ==========================================================
    {
      name: "setup-wizard",
      testMatch: /tests\/e2e\/wizard\/auth\.setup\.ts$/,
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: "wizard",
      testMatch: /tests\/e2e\/wizard\/.*\.spec\.ts$/,
      dependencies: ["setup-wizard"],
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
        storageState: ".auth/wizard.json",
      },
    },
  ],
});
