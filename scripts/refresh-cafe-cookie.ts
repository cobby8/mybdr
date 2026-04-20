/**
 * ═════════════════════════════════════════════════════════════════════════════
 * scripts/refresh-cafe-cookie.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * 다음카페 로그인 쿠키(storageState)를 갱신하고 GitHub Secret 에 등록하는 도구.
 *
 * 배경:
 *   - Phase 3 CI (.github/workflows/cafe-sync.yml) 는 Secret
 *     `DAUM_CAFE_STORAGE_STATE_B64` 에 저장된 base64 storageState 를 매시 사용.
 *   - 다음카페 TIARA/DID 쿠키 수명은 실측 기준 7~30일 사이 들쭉날쭉.
 *   - 본 스크립트는 로그인 → 검증 → base64 → `gh secret set` 을 한 번에 처리.
 *
 * 사용법:
 *   npx tsx scripts/refresh-cafe-cookie.ts                 # 전 과정 실행 (로그인 포함)
 *   npx tsx scripts/refresh-cafe-cookie.ts --skip-login    # 현재 .auth/cafe-state.json 그대로 재등록
 *   npx tsx scripts/refresh-cafe-cookie.ts --dry-run       # 크기만 출력, gh secret set 스킵
 *   npx tsx scripts/refresh-cafe-cookie.ts --repo=owner/name
 *
 * 의존:
 *   - gh CLI (`gh auth login` 상태)
 *   - scripts/cafe-login.ts (Playwright headed 브라우저 로그인, Windows 권장)
 *
 * 사용자 지시 (2026-04-20):
 *   - --repo 미지정 시 git remote 에서 자동 추출
 *   - 쿠키 만료 권장 주기: 7일 (설계안 14일에서 축소)
 *   - gh secret set 은 stdin 전달 (Windows cmd 8191자 한계 회피)
 * ═════════════════════════════════════════════════════════════════════════════
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve } from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// 상수
// ─────────────────────────────────────────────────────────────────────────────

/** storageState 경로 (article-fetcher / cafe-login 과 동일 규약) */
const STATE_PATH = resolve(process.cwd(), ".auth/cafe-state.json");

/** GitHub Secret 이름 (workflow 와 동일 규약) */
const SECRET_NAME = "DAUM_CAFE_STORAGE_STATE_B64";

/** 쿠키 만료 경고 기준 일수 (사용자 지시: 14 → 7) */
const COOKIE_MAX_AGE_DAYS = 7;

/** GitHub Secret 개별 상한 (64 KB) */
const SECRET_MAX_BYTES = 64 * 1024;

/** 최소 쿠키 개수 (로그인 실패 시 빈 배열 방어) */
const MIN_COOKIE_COUNT = 5;

// ─────────────────────────────────────────────────────────────────────────────
// CLI 인자 파싱
// ─────────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const DRY_RUN = argv.includes("--dry-run");
const SKIP_LOGIN = argv.includes("--skip-login");
const REPO_ARG = argv.find((a) => a.startsWith("--repo="))?.split("=")[1];

// ─────────────────────────────────────────────────────────────────────────────
// 1. git remote 에서 owner/repo 자동 추출
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 이유: 사용자 지시 — 하드코딩 대신 현재 브랜치의 origin URL 에서 추출.
 *       SSH / HTTPS 양쪽 포맷 지원.
 *   - https://github.com/bdr-tech/mybdr.git   → bdr-tech/mybdr
 *   - git@github.com:bdr-tech/mybdr.git       → bdr-tech/mybdr
 */
function detectRepoFromGitRemote(): string | null {
  try {
    const url = execSync("git config --get remote.origin.url", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
    // HTTPS 형식
    let m = url.match(/github\.com[/:]([^/]+\/[^/]+?)(\.git)?$/);
    if (m) return m[1];
    return null;
  } catch {
    return null;
  }
}

const REPO = REPO_ARG ?? detectRepoFromGitRemote();
if (!REPO) {
  console.error(
    "❌ --repo 미지정이고 git remote origin URL 파싱 실패. 예: --repo=bdr-tech/mybdr",
  );
  process.exit(1);
}

console.log(`▶ 대상 레포: ${REPO}${REPO_ARG ? " (--repo 지정)" : " (git remote 자동)"}`);
console.log(`▶ dry-run: ${DRY_RUN} / skip-login: ${SKIP_LOGIN}`);
console.log();

// ─────────────────────────────────────────────────────────────────────────────
// 2. gh CLI 인증 확인
// ─────────────────────────────────────────────────────────────────────────────

try {
  execSync("gh auth status", { stdio: ["ignore", "ignore", "ignore"] });
  console.log("✓ gh CLI 로그인 상태 OK");
} catch {
  console.error("❌ gh CLI 미로그인. 먼저 실행: gh auth login");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. 기존 .auth/cafe-state.json 나이 체크 (7일 초과 시 강한 권고)
// ─────────────────────────────────────────────────────────────────────────────

if (existsSync(STATE_PATH)) {
  const ageDays = (Date.now() - statSync(STATE_PATH).mtimeMs) / 86_400_000;
  console.log(
    `▶ 기존 쿠키 나이: ${ageDays.toFixed(1)}일 (만료 권장 기준 ${COOKIE_MAX_AGE_DAYS}일)`,
  );
  if (ageDays > COOKIE_MAX_AGE_DAYS && SKIP_LOGIN) {
    console.warn(
      `⚠️  --skip-login 이지만 쿠키 나이가 ${COOKIE_MAX_AGE_DAYS}일 초과. 새 로그인 권장.`,
    );
  }
} else if (SKIP_LOGIN) {
  console.error(
    `❌ --skip-login 이지만 ${STATE_PATH} 없음. 먼저 npx tsx scripts/cafe-login.ts 실행하세요.`,
  );
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. cafe-login.ts 실행 (헤드풀 Playwright — 사용자 수동 로그인)
// ─────────────────────────────────────────────────────────────────────────────

if (!SKIP_LOGIN) {
  console.log();
  console.log("▶ scripts/cafe-login.ts 실행 — 브라우저 창에서 로그인 후 Enter 키 누르세요");
  console.log("  (Playwright headed 모드. Windows 직접 실행 권장. CI 환경 불가.)");
  console.log();
  const r = spawnSync("npx", ["tsx", "scripts/cafe-login.ts"], {
    stdio: "inherit",
    shell: process.platform === "win32", // Windows 에서 npx.cmd 실행 위해 shell: true
  });
  if (r.status !== 0) {
    console.error(`❌ cafe-login 실패 (exit ${r.status})`);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. storageState 유효성 검증
// ─────────────────────────────────────────────────────────────────────────────

if (!existsSync(STATE_PATH)) {
  console.error(`❌ ${STATE_PATH} 파일 없음 — 로그인 단계에서 저장 실패 가능성`);
  process.exit(1);
}

const raw = readFileSync(STATE_PATH);
let parsed: { cookies?: Array<{ domain?: string; name?: string; value?: string }> };
try {
  parsed = JSON.parse(raw.toString("utf8"));
} catch (e) {
  console.error(`❌ ${STATE_PATH} JSON 파싱 실패: ${(e as Error).message}`);
  process.exit(1);
}

const cookieCount = parsed.cookies?.length ?? 0;
if (cookieCount < MIN_COOKIE_COUNT) {
  console.error(
    `❌ 쿠키 ${cookieCount}개 — 최소 ${MIN_COOKIE_COUNT}개 필요. 로그인 실패 가능성.`,
  );
  process.exit(1);
}

// .daum.net 도메인 쿠키만 별도 카운트 (workflow 에서 추출하는 것과 동일 규약)
const daumCookies = (parsed.cookies ?? []).filter((c) => {
  const d = c.domain ?? "";
  return d.endsWith(".daum.net") || d === "m.cafe.daum.net" || d === "daum.net";
});
console.log(`✓ 전체 쿠키 ${cookieCount}개 / .daum.net 도메인 ${daumCookies.length}개`);
if (daumCookies.length === 0) {
  console.error("❌ .daum.net 도메인 쿠키 0개 — CI 에서 DAUM_CAFE_COOKIE 추출 실패 예정.");
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. base64 인코딩 + 크기 점검
// ─────────────────────────────────────────────────────────────────────────────

const b64 = raw.toString("base64");
const b64Kb = (b64.length / 1024).toFixed(2);
console.log(
  `✓ base64 크기: ${b64Kb} KB (Secret 상한 ${SECRET_MAX_BYTES / 1024} KB 대비 ${(
    (b64.length / SECRET_MAX_BYTES) *
    100
  ).toFixed(1)}%)`,
);
if (b64.length > SECRET_MAX_BYTES * 0.9) {
  console.warn(
    `⚠️  Secret 상한 근접 (${b64Kb} KB). 쿠키 도메인 필터링 검토 필요.`,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. dry-run 분기
// ─────────────────────────────────────────────────────────────────────────────

if (DRY_RUN) {
  console.log();
  console.log("[dry-run] gh secret set 스킵. 실제 등록 시 --dry-run 제거하고 재실행.");
  process.exit(0);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. gh secret set (stdin 전달 — Windows cmd 8191자 한계 회피)
// ─────────────────────────────────────────────────────────────────────────────

console.log();
console.log(`▶ gh secret set ${SECRET_NAME} --repo ${REPO}  (stdin 전달)`);
const r2 = spawnSync(
  "gh",
  ["secret", "set", SECRET_NAME, "--repo", REPO],
  {
    input: b64, // stdin 으로 값 전달 (명령줄 길이 한계 회피)
    stdio: ["pipe", "inherit", "inherit"],
    shell: process.platform === "win32",
  },
);
if (r2.status !== 0) {
  console.error(`❌ gh secret set 실패 (exit ${r2.status})`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. 성공 안내 + 다음 권장일
// ─────────────────────────────────────────────────────────────────────────────

const nextDate = new Date(Date.now() + COOKIE_MAX_AGE_DAYS * 86_400_000)
  .toISOString()
  .slice(0, 10);

console.log();
console.log("✅ 쿠키 Secret 업데이트 완료");
console.log(`   다음 권장 갱신일: ${nextDate} (${COOKIE_MAX_AGE_DAYS}일 후)`);
console.log();
console.log("검증(선택):");
console.log(`   gh secret list --repo ${REPO}`);
console.log(`   gh workflow run cafe-sync.yml --repo ${REPO}`);
