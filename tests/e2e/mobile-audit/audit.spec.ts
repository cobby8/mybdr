import { test, expect, type Page } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

/* ============================================================
 * P3-1 모바일 감사 스크립트
 *
 * 목표:
 *  - iPhone SE (375x667), Galaxy S20 (360x800) 두 viewport로
 *    주요 라우트를 자동 방문해 모바일 회귀를 1회 명령으로 검증.
 *
 * 검사 항목 (라우트별):
 *  1) 가로 스크롤 발생 (overflow-x)            → High
 *  2) 폰트 크기 < 11px DOM 카운트                → Med (>=5)
 *  3) 클릭 가능한 요소 < 44x44 카운트            → Low (>=5)
 *  4) "준비 중" 또는 빈 상태 카운트              → Low (>=1)
 *  5) 콘솔 에러 카운트                           → Med (>=1)
 *
 * 출력:
 *  - Dev/design/audit-results/<YYYYMMDD>.html
 *  - 시안 _mobile_audit_report.html 형식 (KPI / High / Med / Low)
 *
 * 실행:
 *  - npm run audit:mobile           (package.json에 추가됨)
 *  - 또는: npx playwright test tests/e2e/mobile-audit --project=mobile
 *
 * 주의:
 *  - 로컬 개발서버(localhost:3001)가 떠 있어야 함.
 *  - 인증이 필요한 라우트는 로그인 페이지로 리다이렉트되며 그 자체가 측정 대상.
 *  - mobile project는 Pixel 7 (412x915)이 기본이지만,
 *    spec 안에서 page.setViewportSize()로 SE/S20 viewport를 명시 적용.
 * ============================================================ */

// 검사할 모바일 viewport 두 종류
const VIEWPORTS = [
  { name: "iPhone SE", width: 375, height: 667 },
  { name: "Galaxy S20", width: 360, height: 800 },
] as const;

// 기본 라우트 목록 (PM 기획서 기준)
const ROUTES = [
  "/",
  "/games",
  "/tournaments",
  "/teams",
  "/courts",
  "/community",
  "/profile",
  "/login",
  "/signup",
  "/help",
] as const;

// 라우트별 측정 결과
type RouteResult = {
  route: string;
  viewport: string;
  // 가로 스크롤 발생 여부 (scrollWidth > clientWidth + 1px 허용)
  hasHorizontalScroll: boolean;
  scrollWidth: number;
  clientWidth: number;
  // 폰트 < 11px DOM 카운트 (visible text 기준)
  smallFontCount: number;
  // 클릭 요소 < 44x44 카운트 (button, a, [role=button])
  smallTapTargetCount: number;
  // "준비 중" 텍스트 카운트
  emptyStateCount: number;
  // 콘솔 에러 카운트 (page 단위 누적)
  consoleErrorCount: number;
  // 콘솔 에러 메시지 (최대 3개 샘플)
  consoleErrorSamples: string[];
  // 페이지 진입 자체 실패 여부
  navigationError: string | null;
};

// 결과 누적 (test.describe 바깥에 둬서 모든 테스트 종료 후 reporter에서 사용)
const allResults: RouteResult[] = [];

/**
 * 단일 라우트 + 단일 viewport 감사
 *
 * 이유: page.evaluate()로 한 번에 DOM을 훑는 게 라운드트립 비용을 최소화하기 때문에,
 *      개별 항목별로 여러 번 evaluate를 호출하지 않고 하나의 측정 함수로 묶음.
 */
async function auditRoute(
  page: Page,
  route: string,
  viewportName: string,
): Promise<RouteResult> {
  // 콘솔 에러 capture: 페이지 이동 전에 리스너 부착해야 첫 로드 에러도 잡힘
  const consoleErrors: string[] = [];
  const onConsole = (msg: import("@playwright/test").ConsoleMessage) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text().slice(0, 200));
    }
  };
  const onPageError = (err: Error) => {
    consoleErrors.push(`[pageerror] ${err.message.slice(0, 200)}`);
  };
  page.on("console", onConsole);
  page.on("pageerror", onPageError);

  let navigationError: string | null = null;
  try {
    // domcontentloaded까지만 기다림 (networkidle은 SSE/WS 때문에 무한 대기 위험)
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 15_000 });
    // 클라이언트 hydration 안정화를 위한 짧은 대기 (idle이 아닌 timeout)
    await page.waitForTimeout(800);
  } catch (e) {
    navigationError = e instanceof Error ? e.message.slice(0, 200) : String(e);
  }

  // DOM 일괄 측정. 측정 실패해도 audit 자체는 계속 진행.
  let measurement = {
    scrollWidth: 0,
    clientWidth: 0,
    smallFontCount: 0,
    smallTapTargetCount: 0,
    emptyStateCount: 0,
  };

  if (!navigationError) {
    try {
      measurement = await page.evaluate(() => {
        const doc = document.documentElement;
        const body = document.body;
        // 가로 스크롤은 documentElement.scrollWidth vs clientWidth로 판정
        const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth ?? 0);
        const clientWidth = doc.clientWidth;

        // 모든 element 1회 순회. visible & has direct text node인 것만 폰트 측정.
        let smallFontCount = 0;
        let smallTapTargetCount = 0;
        let emptyStateCount = 0;

        const all = document.querySelectorAll<HTMLElement>("*");
        for (const el of Array.from(all)) {
          // 화면에서 보이지 않는 요소(display:none 등)는 제외
          const cs = window.getComputedStyle(el);
          if (cs.display === "none" || cs.visibility === "hidden") continue;

          // 1) 작은 폰트 — 직접 텍스트 노드를 가진 leaf-ish 요소만
          //    (모든 div를 카운트하면 자식 텍스트 때문에 중복)
          const hasDirectText = Array.from(el.childNodes).some(
            (n) =>
              n.nodeType === Node.TEXT_NODE &&
              (n.textContent ?? "").trim().length > 0,
          );
          if (hasDirectText) {
            const fs = parseFloat(cs.fontSize);
            if (!Number.isNaN(fs) && fs > 0 && fs < 11) {
              smallFontCount += 1;
            }
            // 4) "준비 중" 텍스트 — 같은 leaf 텍스트 노드에서 검출
            const txt = (el.textContent ?? "").trim();
            if (
              txt.length > 0 &&
              txt.length <= 30 &&
              (txt.includes("준비 중") ||
                txt === "준비중" ||
                txt.includes("Coming soon"))
            ) {
              emptyStateCount += 1;
            }
          }

          // 3) 클릭 가능한 요소 < 44x44 — button/a/[role=button]
          const tag = el.tagName.toLowerCase();
          const role = el.getAttribute("role");
          const isClickable =
            tag === "button" ||
            tag === "a" ||
            role === "button" ||
            role === "link";
          if (isClickable) {
            const r = el.getBoundingClientRect();
            // 화면에 렌더된 것만 (size 0인 hidden 링크는 제외)
            if (r.width > 0 && r.height > 0) {
              if (r.width < 44 || r.height < 44) {
                smallTapTargetCount += 1;
              }
            }
          }
        }

        return {
          scrollWidth,
          clientWidth,
          smallFontCount,
          smallTapTargetCount,
          emptyStateCount,
        };
      });
    } catch (e) {
      navigationError =
        navigationError ??
        (e instanceof Error ? `[eval] ${e.message.slice(0, 200)}` : String(e));
    }
  }

  // 리스너 정리 (페이지 재사용 시 leak 방지)
  page.off("console", onConsole);
  page.off("pageerror", onPageError);

  // 1px 허용 오차로 가로 스크롤 판정 (subpixel rounding 회피)
  const hasHorizontalScroll =
    measurement.scrollWidth > measurement.clientWidth + 1;

  return {
    route,
    viewport: viewportName,
    hasHorizontalScroll,
    scrollWidth: measurement.scrollWidth,
    clientWidth: measurement.clientWidth,
    smallFontCount: measurement.smallFontCount,
    smallTapTargetCount: measurement.smallTapTargetCount,
    emptyStateCount: measurement.emptyStateCount,
    consoleErrorCount: consoleErrors.length,
    consoleErrorSamples: consoleErrors.slice(0, 3),
    navigationError,
  };
}

/* ============================================================
 * 테스트 본체
 * ============================================================ */

test.describe.configure({ mode: "serial" });

test.describe("모바일 감사 (P3-1)", () => {
  for (const vp of VIEWPORTS) {
    for (const route of ROUTES) {
      test(`${vp.name} ${vp.width}x${vp.height} — ${route}`, async ({
        page,
      }) => {
        // mobile project의 device 프로파일을 우리 viewport로 강제 오버라이드
        await page.setViewportSize({ width: vp.width, height: vp.height });

        const result = await auditRoute(page, route, vp.name);
        allResults.push(result);

        // 테스트 자체는 실패시키지 않고 측정만 수집 — 보고서가 본질.
        // 단, 페이지 자체가 진입 실패하면 명시적으로 expect 통과시켜 알림.
        expect(result.route).toBe(route);
      });
    }
  }

  // 모든 케이스 종료 후 한 번만 HTML 보고서 생성
  test.afterAll(async () => {
    if (allResults.length === 0) return;
    const html = renderHtmlReport(allResults);
    const outDir = path.join(
      process.cwd(),
      "Dev",
      "design",
      "audit-results",
    );
    fs.mkdirSync(outDir, { recursive: true });
    const ymd = formatYmd(new Date());
    const outPath = path.join(outDir, `${ymd}.html`);
    fs.writeFileSync(outPath, html, "utf-8");
    // eslint-disable-next-line no-console
    console.log(`\n[mobile-audit] 보고서 생성: ${outPath}\n`);
  });
});

/* ============================================================
 * HTML 렌더링 — 시안 _mobile_audit_report.html 형식 모방
 * ============================================================ */

// YYYYMMDD
function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

// 사람이 읽는 날짜 (YYYY-MM-DD)
function formatYmdDash(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// HTML 이스케이프 (XSS/렌더 깨짐 방지)
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Severity = "high" | "med" | "low" | "ok";

type Issue = {
  severity: Severity;
  route: string;
  viewport: string;
  desc: string;
};

/**
 * 측정 결과 → 이슈 분류
 *
 * 임계값:
 *  - High: 가로 스크롤 발생 OR navigationError
 *  - Med: 콘솔 에러 ≥1 OR 작은 폰트 ≥5
 *  - Low: 작은 탭 타겟 ≥5 OR "준비 중" ≥1
 */
function classifyIssues(results: RouteResult[]): Issue[] {
  const issues: Issue[] = [];
  for (const r of results) {
    if (r.navigationError) {
      issues.push({
        severity: "high",
        route: r.route,
        viewport: r.viewport,
        desc: `페이지 진입 실패: <code>${esc(r.navigationError)}</code>`,
      });
      continue;
    }
    if (r.hasHorizontalScroll) {
      issues.push({
        severity: "high",
        route: r.route,
        viewport: r.viewport,
        desc: `가로 스크롤 발생 — scrollWidth <code>${r.scrollWidth}px</code> &gt; viewport <code>${r.clientWidth}px</code>`,
      });
    }
    if (r.consoleErrorCount > 0) {
      const sample =
        r.consoleErrorSamples.length > 0
          ? ` 예: <code>${esc(r.consoleErrorSamples[0])}</code>`
          : "";
      issues.push({
        severity: "med",
        route: r.route,
        viewport: r.viewport,
        desc: `콘솔 에러 <code>${r.consoleErrorCount}</code>건.${sample}`,
      });
    }
    if (r.smallFontCount >= 5) {
      issues.push({
        severity: "med",
        route: r.route,
        viewport: r.viewport,
        desc: `폰트 &lt; 11px 요소 <code>${r.smallFontCount}</code>개. 가독성 저하.`,
      });
    }
    if (r.smallTapTargetCount >= 5) {
      issues.push({
        severity: "low",
        route: r.route,
        viewport: r.viewport,
        desc: `탭 타겟 &lt; 44×44 요소 <code>${r.smallTapTargetCount}</code>개. iOS HIG 권장 미달.`,
      });
    }
    if (r.emptyStateCount >= 1) {
      issues.push({
        severity: "low",
        route: r.route,
        viewport: r.viewport,
        desc: `"준비 중" 텍스트 <code>${r.emptyStateCount}</code>건.`,
      });
    }
  }
  return issues;
}

// KPI 계산
function computeKpi(results: RouteResult[], issues: Issue[]) {
  const totalCases = results.length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const medLowCount = issues.filter(
    (i) => i.severity === "med" || i.severity === "low",
  ).length;
  const okCases = results.filter(
    (r) => !r.hasHorizontalScroll && !r.navigationError,
  ).length;
  const passRate =
    totalCases > 0 ? Math.round((okCases / totalCases) * 100) : 0;
  return { totalCases, passRate, highCount, medLowCount };
}

function renderRows(issues: Issue[], severity: Severity): string {
  const filtered = issues.filter((i) => i.severity === severity);
  if (filtered.length === 0) {
    return `<div class="row"><div class="row__route">—</div><span class="row__sev sev-ok">OK</span><div class="row__desc">해당 등급 이슈 없음.</div><div class="row__status fixed">CLEAN</div></div>`;
  }
  return filtered
    .map((i) => {
      const sevClass =
        i.severity === "high"
          ? "sev-high"
          : i.severity === "med"
            ? "sev-med"
            : "sev-low";
      const sevLabel =
        i.severity === "high"
          ? "High"
          : i.severity === "med"
            ? "Med"
            : "Low";
      return `
  <div class="row">
    <div class="row__route">${esc(i.route)} <span style="color:var(--dim)">· ${esc(i.viewport)}</span></div>
    <span class="row__sev ${sevClass}">${sevLabel}</span>
    <div class="row__desc">${i.desc}</div>
    <div class="row__status todo">TODO</div>
  </div>`;
    })
    .join("\n");
}

function renderHtmlReport(results: RouteResult[]): string {
  const issues = classifyIssues(results);
  const kpi = computeKpi(results, issues);
  const today = formatYmdDash(new Date());

  const passClass =
    kpi.passRate >= 90 ? "ok" : kpi.passRate >= 70 ? "warn" : "bad";
  const highClass = kpi.highCount === 0 ? "ok" : "bad";
  const medClass = kpi.medLowCount === 0 ? "ok" : "warn";

  // 라우트별 상세 측정 테이블 (참고용)
  const detailRows = results
    .map((r) => {
      const status = r.navigationError
        ? `<span style="color:var(--red)">ERR</span>`
        : r.hasHorizontalScroll
          ? `<span style="color:var(--red)">SCROLL</span>`
          : `<span style="color:var(--ok)">OK</span>`;
      return `
  <div class="row" style="grid-template-columns:140px 80px repeat(5, 1fr) 80px">
    <div class="row__route">${esc(r.route)}</div>
    <div class="row__route" style="color:var(--mute)">${esc(r.viewport)}</div>
    <div class="row__desc">${r.scrollWidth}/${r.clientWidth}</div>
    <div class="row__desc">${r.smallFontCount}</div>
    <div class="row__desc">${r.smallTapTargetCount}</div>
    <div class="row__desc">${r.emptyStateCount}</div>
    <div class="row__desc">${r.consoleErrorCount}</div>
    <div class="row__status">${status}</div>
  </div>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>MyBDR · 모바일 감사 리포트 · ${today}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css" rel="stylesheet"/>
<style>
:root{
  --bg:#0B0D10; --panel:#13171C; --card:#171C22; --alt:#1B2128;
  --ink:#F6F7F9; --soft:#D7DDE6; --mute:#9BA5B3; --dim:#6B7482;
  --line:#262D36; --line2:#3A4450;
  --red:#E31B23; --ok:#1CA05E; --warn:#E8A33B; --info:#3B82F6;
  --display:'Archivo', system-ui, sans-serif;
  --body:'Pretendard', system-ui, sans-serif;
  --mono:'JetBrains Mono', ui-monospace, monospace;
}
*{box-sizing:border-box}
html,body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--body);font-size:14px;line-height:1.55}
.wrap{max-width:1100px;margin:0 auto;padding:32px 24px 80px}
.eyebrow{font-family:var(--display);font-weight:800;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);display:flex;align-items:center;gap:10px;margin-bottom:8px}
.eyebrow::before{content:"";width:24px;height:2px;background:var(--red)}
h1{font-family:var(--display);font-weight:900;letter-spacing:-0.02em;font-size:42px;margin:0 0 8px;line-height:1}
.lede{color:var(--mute);font-size:15px;max-width:60ch;margin:0 0 28px}
.kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:28px}
.kpi__card{background:var(--card);border:1px solid var(--line);padding:14px 16px}
.kpi__lbl{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dim)}
.kpi__val{font-family:var(--display);font-weight:900;font-size:32px;letter-spacing:-0.02em;line-height:1.05;margin-top:4px}
.kpi__val.ok{color:var(--ok)}
.kpi__val.warn{color:var(--warn)}
.kpi__val.bad{color:var(--red)}
.kpi__sub{font-size:11px;color:var(--mute);margin-top:2px}
h2{font-family:var(--display);font-weight:900;font-size:24px;letter-spacing:-0.01em;margin:36px 0 14px;display:flex;align-items:baseline;gap:10px}
h2 .num{color:var(--red);font-family:var(--mono);font-size:13px;font-weight:500;letter-spacing:0}
.section{background:var(--panel);border:1px solid var(--line);padding:0;margin-bottom:14px;overflow:hidden}
.row{display:grid;grid-template-columns:200px 80px 1fr 90px;gap:14px;padding:12px 14px;border-bottom:1px solid var(--line);align-items:start;font-size:13px}
.row:last-child{border-bottom:0}
.row__route{font-family:var(--mono);font-size:12px;color:var(--soft);font-weight:600}
.row__sev{font-family:var(--display);font-weight:800;font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:3px 7px;border:1px solid var(--line2);text-align:center;align-self:start;justify-self:start}
.sev-high{background:var(--red);color:#fff;border-color:var(--red)}
.sev-med{background:var(--warn);color:#000;border-color:var(--warn)}
.sev-low{background:transparent;color:var(--dim);border-color:var(--line2)}
.sev-ok{background:var(--ok);color:#fff;border-color:var(--ok)}
.row__desc{color:var(--soft);line-height:1.5}
.row__desc code{font-family:var(--mono);font-size:11.5px;background:var(--alt);padding:1px 5px;border-radius:2px;color:var(--ink)}
.row__status{font-family:var(--mono);font-size:11px;color:var(--dim);text-align:right;align-self:start}
.row__status.fixed{color:var(--ok)}
.row__status.todo{color:var(--warn)}
.head-row{display:grid;grid-template-columns:200px 80px 1fr 90px;gap:14px;padding:10px 14px;background:var(--alt);font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--dim);border-bottom:1px solid var(--line2)}
.foot{margin-top:30px;padding-top:18px;border-top:1px solid var(--line);color:var(--dim);font-size:12px;font-family:var(--mono)}
@media (max-width:720px){
  .kpi{grid-template-columns:repeat(2,1fr)}
  .row,.head-row{grid-template-columns:1fr;gap:6px}
  .row__status{text-align:left}
  h1{font-size:30px}
}
</style>
</head>
<body>
<div class="wrap">

<div class="eyebrow">MyBDR · QA · ${today}</div>
<h1>모바일 감사 리포트</h1>
<p class="lede">Playwright 자동 감사 결과. iPhone SE(375×667) / Galaxy S20(360×800) 두 viewport에서 ${ROUTES.length}개 라우트를 순회하며 가로 스크롤·작은 폰트·작은 탭 타겟·빈 상태·콘솔 에러를 측정.</p>

<div class="kpi">
  <div class="kpi__card">
    <div class="kpi__lbl">감사 케이스</div>
    <div class="kpi__val">${kpi.totalCases}</div>
    <div class="kpi__sub">routes × viewports</div>
  </div>
  <div class="kpi__card">
    <div class="kpi__lbl">통과율</div>
    <div class="kpi__val ${passClass}">${kpi.passRate}%</div>
    <div class="kpi__sub">가로스크롤 + 진입에러 0</div>
  </div>
  <div class="kpi__card">
    <div class="kpi__lbl">High 이슈</div>
    <div class="kpi__val ${highClass}">${kpi.highCount}</div>
    <div class="kpi__sub">즉시 수정 권장</div>
  </div>
  <div class="kpi__card">
    <div class="kpi__lbl">Medium / Low</div>
    <div class="kpi__val ${medClass}">${kpi.medLowCount}</div>
    <div class="kpi__sub">개선 가능</div>
  </div>
</div>

<h2><span class="num">01</span>High · 즉시 수정 권장</h2>
<div class="section">
  <div class="head-row">
    <div>Route</div><div>Severity</div><div>Issue</div><div>Status</div>
  </div>
  ${renderRows(issues, "high")}
</div>

<h2><span class="num">02</span>Medium · 가독성 / 인터랙션</h2>
<div class="section">
  <div class="head-row">
    <div>Route</div><div>Severity</div><div>Issue</div><div>Status</div>
  </div>
  ${renderRows(issues, "med")}
</div>

<h2><span class="num">03</span>Low · 폴리시</h2>
<div class="section">
  <div class="head-row">
    <div>Route</div><div>Severity</div><div>Issue</div><div>Status</div>
  </div>
  ${renderRows(issues, "low")}
</div>

<h2><span class="num">04</span>전체 측정 데이터</h2>
<div class="section">
  <div class="head-row" style="grid-template-columns:140px 80px repeat(5, 1fr) 80px">
    <div>Route</div><div>Viewport</div><div>scroll/vp</div><div>&lt;11px</div><div>&lt;44tap</div><div>준비중</div><div>err</div><div>Status</div>
  </div>
  ${detailRows}
</div>

<div class="foot">
  generated by tests/e2e/mobile-audit/audit.spec.ts · ${new Date().toISOString()}
</div>

</div>
</body>
</html>`;
}
