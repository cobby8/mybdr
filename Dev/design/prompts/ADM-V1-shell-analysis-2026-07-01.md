# ADM-V1 셸 아키텍처 갭 분석

작성: 2026-07-01 · 담당: design-system-expert · **코드 수정 0**

---

## 0. 분석 대상 파일 요약

| 구분 | 파일 |
|------|------|
| 시안 셸 (v52) | `Dev/design/BDR v2.41-admin-toss/admin-shell.jsx` |
| 운영 셸 | `src/components/admin-v2/shell.tsx` |
| 운영 CSS | `src/styles/admin-v2/toss.css` |
| 셸 래퍼 5개 | `_shell.tsx` · `ta/_ta-shell.tsx` · `operate/[id]/_operate-shell.tsx` · `partner/_partner-shell.tsx` · `referee-console/_referee-shell.tsx` |

---

## 1. 핵심 아키텍처 갭

### 시안 v52 AdminShell — 듀얼 레일+패널

```
[RAIL 76px] [PANEL 236px] [MAIN margin-left: 312px]
 고정 아이콘   컨텍스트 패널
 레일          (모든 섹션 또는 활성 섹션만)
```

- `adn-rail` (76px): 섹션 아이콘 버튼들. 활성 섹션에 왼쪽 3px 인디케이터 바.
- `adn-panel` (236px): eyebrow+title 헤더 + nav 링크 + UserChip foot.
- `flatPanel=true` (기본값): 패널에 모든 섹션 나열 (현재 단일 사이드바와 동일한 정보량).
- `flatPanel=false`: 레일에서 선택한 섹션 항목만 패널에 표시 (진짜 "듀얼네비" UX).
- `roles` prop: `filterNav()` 로 역할별 메뉴 항목 숨김.
- `parseSections()`: `{label}` 그룹 마커 → 레일 섹션으로 자동 파싱. 섹션별 아이콘은 `LABEL_ICON` 매핑 테이블로.
- 모바일(≤900px): `adn-rail`·`adn-panel` 모두 `display:none`. 기존 `ts-topbar`·`ts-drawer` 그대로.

### 운영 AdminShell — 단일 `.ts-sidebar` 248px

```
[SIDEBAR 248px] [MAIN margin-left: 248px]
 단일 고정 사이드바
```

- `ts-sidebar` (248px): BackRow + Brand + Nav (flat list) + foot.
- prop: `brand, brandSub, nav, active, onNav, user, children, home, isHome, footAction, onUser`.
- **누락 prop**: `roles`, `flatPanel`.
- `NavLink` 타입에 `children`(하위 들여쓰기) 없음.
- `--sidebar-w: 248px` (toss.css L65).

### 비교표

| 항목 | 시안 v52 | 운영 현재 | 갭 |
|------|---------|----------|-----|
| 사이드바 폭 | RAIL 76 + PANEL 236 = **312px** | **248px** | +64px |
| CSS `--sidebar-w` | `312px` (JS 주입) | `248px` (toss.css) | 충돌 |
| CSS 클래스 | `adn-rail`, `adn-panel`, `adn-railitem`, `adn-link`, `adn-dgroup__label`, `adn-panel__*` | 없음 | 신규 필요 |
| `ts-main margin-left` | `var(--sidebar-w)=312px` | `var(--sidebar-w)=248px` | +64px |
| props | `roles`, `flatPanel` 있음 | 없음 | 신규 추가 |
| `NavLink.children` | 있음 (들여쓰기) | 없음 | 선택적 추가 |
| `parseSections()` | JS 구현 있음 | 없음 | 신규 추가 |
| `filterNav()` | JS 구현 있음 | 없음 | 신규 추가 |
| 모바일 | 동일 (900px 분기) | 동일 | 갭 없음 |
| 상세 드로어/토스트 | 동일 구조 | 동일 | 갭 없음 |

---

## 2. 범위 — 영향 파일·화면

### AdminShell 직접 소비처 (셸 래퍼 5개)

`AdminShell`을 직접 import하는 파일은 셸 래퍼 5개뿐. 나머지 90+ page 파일은 셸 래퍼를 통해 간접 소비 → 직접 수정 불필요.

| 셸 래퍼 | 라우트 커버 | NAV 항목 수 | 섹션 수 | 특이사항 |
|---------|-----------|------------|--------|---------|
| `v2/_shell.tsx` (V2Shell) | `/v2/**` 백오피스 전체 | 22 | 4 (운영/운영 콘솔/정산·플랜/시스템) | 가장 복잡. href 외부링크 혼재 |
| `v2/ta/_ta-shell.tsx` (TaShell) | `/v2/ta/**` 대회 콘솔 | 5 | 2 (운영/구성) | 단순 |
| `v2/operate/[id]/_operate-shell.tsx` (OperateShell) | `/v2/operate/[id]` | 6 | 1 (운영 메뉴) | 단일 섹션 — `flatPanel=true` 유효 |
| `partner/_partner-shell.tsx` (PartnerShell) | `/partner/**` | 4 | 3 (운영/마케팅/정산) | 협력업체 페르소나 |
| `referee-console/_referee-shell.tsx` (RefereeShell) | `/referee-console/**` | 17 | 4 (운영/심판단/경기·평가/정산/시스템) | badge 5종, 가장 많은 항목 |

### 간접 영향 — 페이지 파일

셸 교체 시 **페이지 파일 자체는 변경 불필요**. 단, `--sidebar-w` 변화(248→312px)로 `ts-main { margin-left }` 가 64px 증가 → 콘텐츠 영역이 좁아짐. CSS 변수 변경이라 자동 반영.

영향 페이지 수 (간접): 127개 tsx 파일 (backoffice 46 + ta 13 + operate 10 + partner 9 + referee-console 49).

### 무영향 영역

- 공개웹 `src/app/(web)/` — 완전히 별도 DS (`[data-pub]` 스코프).
- `src/app/api/**` — 백엔드 무변경 원칙.
- `src/styles/admin-v2/admin-pages.css` — `adn-*` 추가 필요 없음 (내부 콘텐츠 클래스).
- `src/components/admin-v2/kit.tsx`, `blocks.tsx` — 무변경.

---

## 3. 리스크

### R1 — `--sidebar-w` 248→312px (+64px) — **중간**

`.ts-main { margin-left: var(--sidebar-w) }` 가 toss.css L191에 있음. `--sidebar-w` 변경 시 모든 관리자 페이지 콘텐츠가 64px 우측으로 이동.

- **1024px 뷰포트**: 콘텐츠 가용폭 776px → 712px. `ts-main__inner { max-width: 1160px }` 를 넘지 않으므로 레이아웃 깨짐 없음.
- **900~1024px 구간**: 사이드바가 표시되는 최소 폭. 312px 사이드바 + `ts-main__inner` 패딩 32+32 = 376px 고정. 가용 콘텐츠: 900-312-64 = 524px → DataTable 최소폭(`min-width: 700px`) 과 충돌 가능. `overflow-x: auto`(`ad-tablescroll`)로 처리되지만 사용성 저하.
- **완화안**: 900px 분기를 유지하거나 `ts-main__inner` 패딩을 900~1024px 구간에서 줄임.

### R2 — `parseSections()` TypeScript 이식 — **낮음**

JS → TS 변환 시 `secs` 배열 타입, `LABEL_ICON` 매핑 타입 선언 필요. 로직 자체는 단순(반복문+필터). 위험 낮음.

### R3 — `filterNav()` / `roles` prop — **낮음**

현재 운영에서 `roles`를 쓰는 코드 없음. 새 prop을 추가해도 기존 셸 래퍼들이 전달하지 않으면 필터링 비활성(안전 기본값 `undefined → 필터 없음`). 기능 추가이지 회귀 없음.

### R4 — `flatPanel` prop 기본값 결정 — **중간 (결정 필요)**

`flatPanel=true` (기본): 패널에 전 섹션 나열 → 현재 단일 사이드바와 동일한 정보 접근성. 레일 아이콘은 시각적 계층만 추가.

`flatPanel=false` (진짜 듀얼): 레일 클릭 시 패널 내용이 해당 섹션으로 전환. V2Shell(22항목 4섹션)·RefereeShell(17항목 4섹션)에 효과적. OperateShell(단일 섹션)은 실질 차이 없음.

**결정이 없으면 `true`로 시작해도 시각 완성도는 충분** (레일 추가만으로 v52 시안과 거의 동일).

### R5 — 컷오버 redirect와의 상호작용 — **없음**

redirect는 `next.config.ts`에서 경로를 셸과 무관하게 처리. 셸 교체는 도달한 라우트의 렌더링만 변경 → 상호작용 없음.

### R6 — CSS 주입 방식 — **낮음**

시안은 `if (!window.__adnInjected)` 패턴으로 `<style>` 태그를 JS에서 주입. 운영 Next.js는 CSS 파일로 import 해야 함. `adn-*` 클래스를 `toss.css`에 `[data-admin="v2"]` 스코프로 추가하면 됨. Next.js SSR 친화적.

### R7 — `NavLink.children` (하위 들여쓰기) — **선택적**

시안 `Link` 컴포넌트는 `it.children` 재귀를 지원. 현재 운영의 5개 셸 래퍼 NAV 배열에는 `children` 항목이 없음. **미구현해도 즉각 회귀 없음**. V2Shell 구 레거시에는 `BDR NEWS`가 하위 링크였으나 현재는 별도 항목으로 분리된 상태. 선택적 후속 작업.

---

## 4. 작업량 추정

### Option A — 듀얼 레일+패널 전면 교체

| 파일 | 작업 | 규모 |
|------|------|------|
| `src/styles/admin-v2/toss.css` | `--adn-rail`, `--adn-panel` 토큰 추가, `--sidebar-w` → 312px 변경, `adn-*` CSS 규칙 추가 (~70줄) | 소 |
| `src/components/admin-v2/shell.tsx` | `AdminShell` 컴포넌트에 레일+패널 DOM 추가, `parseSections()`, `filterNav()`, `roles`/`flatPanel` 타입 추가 (~150줄 추가, 기존 단일 사이드바 DOM 교체) | 중 |
| 셸 래퍼 5개 (`_shell.tsx` 등) | 구조 변경 없음. `roles`/`flatPanel` prop 선택적 추가만 가능 | 소(선택) |
| 페이지 파일 127개 | 0 변경 | — |

**총 규모**: 소-중. 집중 작업 기준 1 PR(2파일).

### Option B — 단일 사이드바 유지, 세부 정합만

| 항목 | 규모 |
|------|------|
| toss.css sidebar brand padding 정합 (16px→22px 조정) | 극소 |
| `roles`/`filterNav` 추가 | 소 |
| BackRow 버튼 정합 (운영 추가 헬퍼 유지) | 0 |

**총 규모**: 극소. 1~2줄.

---

## 5. 대안 비교

| 기준 | A — 듀얼 레일 전면 교체 | B — 단일 사이드바 유지 |
|------|----------------------|---------------------|
| 시안 충실도 | ★★★ v52 1:1 | ★ 시안 대비 큰 시각 갭 |
| 구현 리스크 | 중간 (CSS 새 클래스, 컴포넌트 재구성) | 낮음 |
| 콘텐츠 가용 폭 | 900~1024px 구간 주의 | 현재 유지 |
| 백엔드 영향 | 0 | 0 |
| 모바일 | 동일 (900px 분기) | 동일 |
| 롤백 난이도 | 낮음 (shell.tsx + toss.css 2파일 되돌리기) | 해당 없음 |
| ADM-V0 delta 취지 | v52가 명시적으로 "듀얼 사이드바 IA 일관화"를 목표로 변경 — 무시하면 방향 역행 | v52 의도 무시 |
| OperateShell 적합성 | 단일 섹션(6메뉴)이라 `flatPanel=true` 시 차이 미미 | 기존과 동일 |
| RefereeShell 적합성 | 17항목 4섹션 — 레일 계층으로 인지 부담 감소 | 현재 flat list |

---

## 6. 권장안

**Option A (듀얼 레일 전면 교체)** 를 권장한다.

**이유**:
1. ADM-V0 delta 분석에서 확인된 v52 핵심 변경 = "운영/위저드를 포함한 전 화면의 IA 일관화". 단일 사이드바 유지는 delta 취지에 역행.
2. 구현 파일이 2개(shell.tsx + toss.css)로 좁고, 페이지 파일 127개는 0 변경.
3. `flatPanel=true` 기본값 채택 시 패널 정보 구조가 현재 단일 사이드바와 동일 → 사용자 혼란 없이 시각 업그레이드.
4. 롤백이 2파일 revert로 즉시 가능.

### 단계별 PR 시퀀스 (작은 단위)

```
[Step 1] ADM-V1-S1 — CSS 레이어 (toss.css)
  · --adn-rail: 76px, --adn-panel: 236px 토큰 추가
  · --sidebar-w: 312px 로 변경
  · adn-rail, adn-panel, adn-railitem, adn-link, adn-dgroup__label, adn-panel__* CSS 추가 (~70줄)
  · .ts-main margin-left 는 var(--sidebar-w) 그대로 → 자동 반영
  · 검증: tsc 0, next build 0, dev 프리뷰 /v2 에서 레이아웃 shift 확인(아직 레일 없어서 sidebar 폭만 넓어짐)

[Step 2] ADM-V1-S2 — 컴포넌트 레이어 (shell.tsx)
  · AdminShellProps에 roles?: string[], flatPanel?: boolean 추가
  · parseSections() TypeScript 이식
  · filterNav() TypeScript 이식
  · <aside className="adn-rail"> DOM 추가 (레일 아이콘 섹션 버튼)
  · <aside className="adn-panel"> DOM 추가 (컨텍스트 패널)
  · 기존 <aside className="ts-sidebar"> 제거
  · 모바일 drower는 그대로 유지 (ts-drawer, ts-topbar)
  · flatPanel 기본값 = true
  · 검증: tsc 0, next build 0, dev 프리뷰 5콘솔 시각 QA

[Step 3] (선택) ADM-V1-S3 — 셸 래퍼 props
  · V2Shell, TaShell, RefereeShell: flatPanel=false 로 진짜 섹션 전환 UX 활성화 여부 결정
  · roles prop 연결(인증 계층에서 역할 정보 내려오면 배선)
  · 파일: _shell.tsx, ta/_ta-shell.tsx, referee-console/_referee-shell.tsx (최대 3파일)

[Step 4] ADM-V1-S4 — RESPONSIVE-QA
  · 390 / 720 / 1024 / 1440 각 뷰포트 QA
  · 900~1024px 구간 DataTable 가로 스크롤 확인
  · 모바일 drawer 정상 동작 확인
```

### 결정 필요 사항 (PM/수빈 확인 항목)

| # | 결정 항목 | 선택지 | 기본 권장 |
|---|----------|--------|----------|
| D1 | `flatPanel` 기본값 | `true`(모든 항목 노출, 현재 UX 유지) vs `false`(섹션 전환 UX) | `true` (1차), 이후 수빈 확인 후 `false` 전환 |
| D2 | `roles` prop 배선 여부 | ADM-V1에서 즉시 배선 vs 후속 | 후속 (현재 5콘솔은 인증 통과 후 전체 메뉴 노출 = 현행 유지) |
| D3 | `NavLink.children` | ADM-V1에서 추가 vs 생략 | 생략 (현재 NAV 배열에 children 없음) |
| D4 | 900~1024px 가용폭 | 현재 패딩 유지 vs `ts-main__inner` 패딩 축소 | 프리뷰 QA 후 결정 |

---

## 7. 분석 요약 (PM 전달용)

- **영향 파일**: `shell.tsx` + `toss.css` 2개 핵심. 셸 래퍼 5개 선택적 props 추가. 페이지 파일 127개 변경 없음.
- **작업 규모**: S1(CSS, 소) + S2(컴포넌트, 중) = 1 PR. 연계 테스트 포함 반나절.
- **주요 리스크**: `--sidebar-w` +64px 로 900~1024px 구간 테이블 가로 스크롤 주의. 모바일·백엔드 무영향.
- **권장**: Option A(듀얼 레일 전면 교체), `flatPanel=true`로 시작, 프리뷰 QA 후 결정사항 D1~D4 확인.
- **승인 전 코드 변경 없음** (이 문서는 분석 전용).
