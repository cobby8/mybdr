# UI 통일성 감사 보고서 — 2026-04-29

> **상태**: active
> **갱신 주기**: 1회성 감사 (Phase 9 보강)
> **상위 문서**: [README.md](./README.md)
> **함께 보는 문서**: [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) (시안 일치도 5+1 등급) · [phase-9-audit.md](./phase-9-audit.md) (진입점 단절) · [DESIGN.md](./DESIGN.md) (규칙)
> **작성일**: 2026-04-29
> **대상 브랜치**: design_v2

---

## 1. TL;DR — 한눈에

| 카테고리 | 페이지/파일 수 | 우선도 | 비고 |
|----------|---------------|-------|-----|
| 🔴 시안 박제 안 된 페이지 (D등급) | 11개 | P1 | phase-9-paste-completeness.md 인용 |
| 🟡 시안 부분 박제 (C등급) | 9개 | P2 | 동상 |
| ❌ 시안 있는데 라우트 없음 (F등급) | 1개 | P2 | Referee.jsx (별도 referee 시스템 존재) |
| 🚨 모바일 UI 깨짐 (사용자 보고) | 5건 → 8건 픽스 완료 | ✅ | 커밋 `4afb4f9` (오늘 15:30) |
| ⚠️ 코드 레벨 규칙 위반 (하드코딩 hex) | 4 파일, 약 25건 | P1 | 토큰 미사용 |
| ⚠️ lucide-react import (금지) | 1 파일 | P1 | personal-hero.tsx |
| 검증 필요 (스크린샷 vs 픽스 시점) | 5개 페이지 | P0 | 사용자 재확인 권장 |

**총 작업 견적**: 약 16~22시간 (P0 1h + P1 8h + P2 7~13h)

---

## 2. 카테고리 A — 시안 박제 안 된 페이지 (D등급)

> 출처: [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) 33~50줄. **모든 라우트는 실제로 페이지가 존재하나 BDR v2 시안 톤이 미적용 상태**.

| # | 라우트 | 시안 파일 (`Dev/design/BDR v2/screens/`) | 현재 상태 | 우선도 |
|---|--------|-----|---------|-------|
| 1 | `/community/[id]/edit` | (PostWrite 응용) | 박제 흔적 0. 기본 Card/Button 만 사용 | P1 |
| 2 | `/games/[id]/edit` | (CreateGame 응용) | 박제 흔적 0. CreateGame v2 톤 미반영 | P1 |
| 3 | `/games/new` | CreateGame.jsx | server wrapper만 v2. 내부 `NewGameForm` 박제 검수 필요 | P2 |
| 4 | `/teams/new` | CreateTeam.jsx | server wrapper만 v2. 내부 `NewTeamForm` 박제 검수 필요 | P2 |
| 5 | `/profile/bookings` | (시안 없음) | 자체 디자인. 토큰 일치만 검수 | P3 |
| 6 | `/profile/growth` | (Profile 응용) | useEffect 구식 fetch 패턴. 게이미피케이션 톤 미반영 | P2 |
| 7 | `/profile/weekly-report` | (시안 없음) | 자체 디자인 | P3 |
| 8 | `/profile/complete` | OnboardingV2.jsx | "M5 온보딩 압축" — v2 시안 미반영 | P2 |
| 9 | `/profile/complete/preferences` | (없음) | 단계 페이지. v2 흔적 0 | P3 |
| 10 | `/venues/[slug]` | (Court 응용 가능) | 공개 SEO 페이지. `Link` + 기본 마크업만 | P2 |
| 11 | `/help/glossary` | (Help 응용) | 박제 흔적 0. Help 가 통합 허브로 흡수 → 레거시 가능성 | P3 |

---

## 3. 카테고리 B — 시안 부분 박제 (C등급)

> 출처: [phase-9-paste-completeness.md](./phase-9-paste-completeness.md) 57~71줄. **핵심 일부만 박제됐고 시안 대비 누락 있음**.

| # | 라우트 | 시안 파일 | 누락 부분 | 우선도 |
|---|--------|----------|---------|-------|
| 1 | `/community` | BoardList.jsx | page.tsx 헤더 코멘트 부재 (커밋 흔적은 있음) | P3 |
| 2 | `/notifications` | Notifications.jsx | wrapper에 시안 출처 코멘트 분산 | P3 |
| 3 | `/rankings` | Rank.jsx | wrapper에 v2 출처 코멘트 부재 | P3 |
| 4 | `/help/glossary` | (Help 일부) | 단순 redirect — `/help` 통합 검토 | P3 |
| 5 | `/safety` | Safety.jsx | DB 0% (의도된 더미). 진입점 부재 (audit) | P2 |
| 6 | `/scrim` | Scrim.jsx | DB 0% (정상) | P3 |
| 7 | `/match` | Match.jsx | DB 미연결 + 진입점 0건. 라우트 정책 결정 필요 | P1 |
| 8 | `/onboarding/setup` | OnboardingV2.jsx | 회원가입 직후 자동 redirect 미구현 | P1 |
| 9 | `/courts/[id]/manage` | (시안 없음) | 자체 디자인 — E로 재분류 가능 | — |

---

## 4. 카테고리 C — 모바일 UI 깨짐 (`ui_breaking/` 5건)

오늘(2026-04-29) `Dev/design/ui_breaking/` 에 업로드된 5장의 KakaoTalk 스크린샷.

### 4-1. 사용자 보고 5건 + 전수조사 발견 → 8건 일괄 픽스 완료

✅ **커밋 [`4afb4f9`](2026-04-29 15:30)** "fix(layout): 모바일 grid 안티패턴 8건 일괄 픽스" 가 다음을 처리:

| 페이지 | 안티패턴 | 픽스 |
|--------|---------|------|
| `/admin` | `sm:grid-cols-2 xl:grid-cols-4` (md 구간 비어있음) | `md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` |
| `/pricing` | 인라인 `grid-template-columns: repeat(3, 1fr)` | `grid-cols-1 md:grid-cols-3` |
| `/reviews` | 인라인 `[minmax(0,1fr) 360px]` 모바일 좌측 ~55px 압축 → 한 글자씩 줄바꿈 | `grid-cols-1 sm:grid-cols-[minmax(0,1fr)_360px]` |
| `/coaches` | `repeat(3, 1fr)` 고정 | `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` |
| `/calendar` | 7일 달력 모바일 폭 부족 | 가로 스크롤 래퍼 + 사이드 패널 분기 |
| `/awards` | `repeat(5, 1fr)` 고정 | `grid-cols-2 md:grid-cols-5` |
| `/about` | 가치 6 / 운영진 6 모바일 강제 1열 | 모바일 1~2열 분기 |
| `/guest-apps` | `repeat(3, 1fr)` 고정 | `grid-cols-1 sm:grid-cols-3` |

**근본 원인 (lessons.md 후보)**: 인라인 style의 `gridTemplateColumns: 'repeat(N, 1fr)'` 또는 `[minmax(0,1fr) ###px]` 같은 고정값은 mobile-first className 기반(`grid-cols-1 sm:grid-cols-N`)으로 강제 통일해야 함. 인라인 grid는 미디어 쿼리가 없어 모바일에서 컬럼이 압축되어 글자 단위 줄바꿈/오버플로 발생.

### 4-2. 검증 필요 (P0)

스크린샷이 픽스 이전 상태일 가능성이 높지만, 실제 모바일에서 다시 확인 필요:

1. **`/teams/[id]` 모바일 헤더 (KakaoTalk_125433298)** — 검색·알림·"더보기"·아바타·햄버거가 좁은 모바일에서 한 줄로 짓눌림 가능성. 4afb4f9 픽스 대상 아님 → 별도 검토.
2. **`/referee` 빈 상태 (KakaoTalk_125934063)** — 사이드바 메뉴가 본문 EmptyState와 겹쳐 보이는 시각. `referee-shell.tsx:163` 은 `hidden lg:flex` 정상. **재캡처 권장**.
3. **`/admin` 빈 상태 (KakaoTalk_130223780)** — 사이드바와 본문 카드가 겹쳐 보임. `admin/sidebar.tsx:67` 은 `hidden lg:flex` 정상. **재캡처 권장**.

---

## 5. 카테고리 D — 코드 레벨 규칙 위반 (DESIGN.md)

### 5-1. 하드코딩 hex 색상 (CSS 변수 미사용)

| 파일 | 위반 건수 | 대표 패턴 |
|------|----------|-----------|
| `src/components/home/quick-menu.tsx` | 11+ | `text-[#111827]`, `bg-[#1B3C87]`, `border-[#E8ECF0]`, `text-[#6B7280]`, `hover:bg-[#EEF2FF]` |
| `src/components/home/personal-hero.tsx` | 6+ | `text-[#1B3C87]`, `bg-[#1B3C87]`, `text-[#111827]` |
| `src/components/home/hero-section.tsx` | 5+ | `from-[#1B3C87]/15`, `border-[#E8ECF0]`, `text-[#E31B23]` |
| `src/app/(web)/games/new/_components/wizard-progress.tsx` | 1 (주석 내) | 주석 안의 `bg-[#E31B23]` — 코드는 `var(--color-primary)` 사용 정상 |

권장: 모두 `var(--color-primary)`, `var(--color-accent)`, `var(--color-text-primary)`, `var(--color-text-muted)`, `var(--color-border)` 토큰으로 치환.

### 5-2. lucide-react import (금지)

| 파일 | 라인 | 라인 내용 |
|------|------|-----------|
| `src/components/home/personal-hero.tsx` | 5 | `import { Calendar, MapPin, Trophy, Users, Flame, ChevronLeft, ChevronRight } from "lucide-react";` |

권장: Material Symbols Outlined 로 1:1 대체 (icon ligature: `event`, `location_on`, `emoji_events`, `group`, `local_fire_department`, `chevron_left`, `chevron_right`).

> ⚠️ 추가 발견: `package.json` 에 `"lucide-react": "^1.7.0"` 의존성 그대로 등재됨. import 0건 만든 후 `npm uninstall lucide-react` 까지 수행해야 CLAUDE.md "완전 제거" 명세와 일치.

### 5-3. pill border-radius 의심 (검증 필요)

`rounded-full` 은 376건 — 대부분 아바타/뱃지/dot은 합법. 다만 일부 버튼/입력에 부적절하게 적용된 케이스가 있을 수 있음. 비주얼 검수 단계에서 점검.

특히 다음 곳들은 **버튼/태그**에 `rounded-full` 사용 확인됨 (DESIGN.md §6-1 위반):
- `src/components/home/personal-hero.tsx:78` (경기 찾기 CTA)
- `src/components/home/personal-hero.tsx:157` ("팀 찾기" CTA)
- `src/components/home/personal-hero.tsx:199` ("토너먼트" CTA)
- `src/components/home/quick-menu.tsx:87` (메뉴 편집 버튼)
- `src/components/home/quick-menu.tsx:99` (태그 칩 — pill 칩은 §6-1 미명시 → 컨벤션 결정 필요)

DESIGN.md §6-1 은 `4px` 표준이고 pill 9999px **금지** — 버튼은 모두 `rounded-md`(6px) 또는 `rounded-[4px]` 로 교체 권장.

### 5-4. 금지 색상 (핑크/살몬/코랄)

전체 검색 결과 **0건 — clean** ✅

### 5-5. site/admin 헤더 web 영역 혼입

전체 검색 결과 **0건 — clean** ✅

---

## 6. 통일성 유지 계획

### 6-1. 작업 순서 (의존성 고려)

```
P0 (오늘 ~ 1일)
├─ 1. 4afb4f9 픽스 결과 모바일 재확인 (8개 페이지)
└─ 2. /teams/[id] /referee /admin 모바일 캡처 재확보 — 회귀 여부 판정

P1 (이번 주 ~ 4일)
├─ 3. 코드 위반 일괄 정리 (3 파일 hex → 토큰, 1 파일 lucide-react → Material Symbols)
├─ 4. D등급 P1 박제 4건: community/[id]/edit, games/[id]/edit, profile/complete, profile/growth
├─ 5. C등급 P1: /match 정책 결정, /onboarding/setup 자동 redirect
└─ 6. F등급 1건: /referee 라우트 정책 결정 (사용자 라우트 만들기 vs 시안 폐기)

P2 (다음 주 ~ 3일)
├─ 7. D등급 P2: games/new, teams/new 박제 검수, venues/[slug] 박제
├─ 8. C등급 P2: safety 진입점, courts/[id]/manage E 재분류
└─ 9. 자동 검증 시스템 구축 (eslint plugin / 스크립트)

P3 (백로그)
└─ 10. B등급 페이지 헤더 코멘트 보강 (10건 × 5분)
```

### 6-2. 통일성 유지 메커니즘 (재발 방지)

#### 가드레일 1 — Pre-commit grep 룰 (1시간 작업)

`scripts/check-design-rules.sh` 신설:

```bash
#!/usr/bin/env bash
# 디자인 규칙 위반 사전 차단 — pre-commit hook 또는 npm run lint:design 으로 호출
set -e

VIOLATIONS=0

echo "[1/4] 하드코딩 hex 색상 검사..."
HEX=$(rg -n "(text|bg|border|from|to|via)-\[#[0-9A-Fa-f]{3,8}" src --glob '!**/_v2/**/tokens*' || true)
if [ -n "$HEX" ]; then echo "$HEX"; VIOLATIONS=$((VIOLATIONS+1)); fi

echo "[2/4] lucide-react import 검사..."
LUCIDE=$(rg -n "from ['\"]lucide-react['\"]" src || true)
if [ -n "$LUCIDE" ]; then echo "$LUCIDE"; VIOLATIONS=$((VIOLATIONS+1)); fi

echo "[3/4] 인라인 grid 고정 컬럼 검사..."
INLINE_GRID=$(rg -n "gridTemplateColumns:\s*['\"]repeat\([0-9]" src || true)
INLINE_GRID2=$(rg -n "gridTemplateColumns:\s*['\"]minmax" src || true)
if [ -n "$INLINE_GRID" ] || [ -n "$INLINE_GRID2" ]; then echo "$INLINE_GRID$INLINE_GRID2"; VIOLATIONS=$((VIOLATIONS+1)); fi

echo "[4/4] 금지 색상 (핑크/살몬) 검사..."
BAN=$(rg -n "(text|bg|border)-(pink|rose|orange|amber)-[0-9]" src || true)
if [ -n "$BAN" ]; then echo "$BAN"; VIOLATIONS=$((VIOLATIONS+1)); fi

if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "❌ 디자인 규칙 위반 $VIOLATIONS 카테고리 발견"
  exit 1
fi
echo "✅ 디자인 규칙 통과"
```

`package.json` 에 추가: `"lint:design": "bash scripts/check-design-rules.sh"`.

#### 가드레일 2 — 시안 출처 코멘트 표준 (즉시 적용)

신규/수정 페이지 page.tsx 또는 _v2 컴포넌트 상단에 표준 헤더 의무화:

```tsx
/* ============================================================
 * /라우트경로 — 페이지 한 줄 설명
 *
 * 시안 출처: Dev/design/BDR v2/screens/Xxx.jsx
 * 박제 등급: A | B | C | D | E (phase-9-paste-completeness.md 기준)
 * 마지막 검증: YYYY-MM-DD
 * ============================================================ */
```

이 코멘트가 있는 페이지를 grep 으로 자동 카운트해 박제 진행률 KPI 추적.

#### 가드레일 3 — 모바일 자동 스크린샷 (Phase 10 후보, 4-5h)

`Dev/design/BDR v2/_mobile_audit.html` 의 자체 감사 인프라가 이미 있음. 이를 확장해 Playwright 로 주요 페이지 모바일(390x844) 스크린샷을 자동 생성하고 PR 마다 비교:

```
scripts/mobile-screenshot.ts — Playwright + 페이지 리스트 + diff
.github/workflows/mobile-visual-regression.yml — PR 시 스크린샷 비교
```

#### 가드레일 4 — `_components_v2/` 디렉토리 표준 + ESLint

이미 31개의 `*-v2.tsx` 파일과 3개의 `_components_v2/` 디렉토리 존재. ESLint 룰 추가:
- `_components_v2/` 안의 파일은 `var(--color-*)` 토큰만 허용 (no-hardcoded-color rule)
- 인라인 `style={{ color: '#...' }}` 금지

---

## 7. CLI 프롬프트 (클로드 CLI 에 그대로 붙여넣기)

> 각 프롬프트는 독립 실행 가능. 의존성 없음. CLI 세션 시작 후 "오늘 작업 시작하자" 체크리스트 통과 뒤 사용.

### 7-1. P0-1 — `4afb4f9` 픽스 결과 모바일 재확인 (15분)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

작업: 커밋 4afb4f9 가 픽스한 8개 페이지를 모바일 뷰포트(390x844)에서 재확인.
시안 깨짐 회귀가 없는지 시각 점검.

대상 8개:
- /admin
- /pricing
- /reviews
- /coaches
- /calendar
- /awards
- /about
- /guest-apps

방법:
1. 로컬 dev 서버 띄우기 (port 3001)
2. 각 라우트를 Chrome DevTools 모바일 뷰(390x844)로 열기
3. 다음 체크:
   - 가로 스크롤바 없음
   - 텍스트 줄바꿈 정상 (한 글자씩 떨어지지 않음)
   - 카드/그리드가 한 열로 떨어지거나 의도된 다열 유지
   - 헤더가 단일 줄에 짓눌리지 않음
4. 문제 발견 시 src 경로 + 라인 + 스크린샷 경로 보고

추가: /teams/[id], /referee, /admin 빈 상태 3개도 모바일에서 직접 확인.
Dev/design/ui_breaking/ 의 스크린샷과 현재 상태 비교.

결과는 1) 픽스 회귀 0건 / 2) 추가 발견 깨짐 N건 (경로+라인+증거) 형식으로 보고.
```

### 7-2. P1-1 — 코드 위반 일괄 정리 (1.5시간)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: DESIGN.md 규칙 위반 코드 일괄 정리. 4 파일 수정 / 동작 변경 0.

대상 파일:
1. src/components/home/personal-hero.tsx — lucide-react import 제거 + Material Symbols 로 교체
2. src/components/home/personal-hero.tsx — 하드코딩 hex 6+ 건을 var(--color-*) 토큰으로
3. src/components/home/hero-section.tsx — 하드코딩 hex 5+ 건을 토큰으로
4. src/components/home/quick-menu.tsx — 하드코딩 hex 11+ 건을 토큰으로

매핑 규칙 (DESIGN.md 9-2/9-3/9-5 참조):
- #E31B23 → var(--color-primary)
- #1B3C87 → var(--color-accent)
- #111827 → var(--color-text-primary)
- #6B7280, #9CA3AF → var(--color-text-muted)
- #E8ECF0, #F1F5F9 → var(--color-border)
- #FFFFFF → var(--color-card)
- #EEF2FF (hover bg) → color-mix(in srgb, var(--color-accent) 8%, transparent)
- rgba(27,60,135,0.12) → var(--color-accent-light)

아이콘 매핑 (lucide → Material Symbols):
- Calendar → event
- MapPin → location_on
- Trophy → emoji_events
- Users → group
- Flame → local_fire_department
- ChevronLeft → chevron_left
- ChevronRight → chevron_right

추가 정리: 두 곳 button 에 rounded-full 사용됨 — DESIGN.md 4px 규칙 위반.
- personal-hero.tsx:78 → rounded-md
- quick-menu.tsx:87 → rounded-md

검증:
- rg "lucide-react" src/  → 0건
- rg "(text|bg|border|from|to|via)-\[#" src/  → 0건 (또는 token 안의 정당한 hex만)
- rg "rounded-full" src/components/home/{personal-hero,quick-menu}.tsx  → 버튼이 아닌 아바타/dot에만 남기

검증 통과 후 각 파일 별도 커밋 (3 commit) — message 형식:
fix(design): personal-hero hex/lucide 토큰화

마지막으로 package.json 에서도 lucide-react 의존성 제거:
- npm uninstall lucide-react
- 4번째 커밋: chore(deps): lucide-react 제거 (CLAUDE.md "완전 제거" 명세 일치)
```

### 7-3. P1-2 — D등급 P1 박제 (4건, 6시간)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: phase-9-paste-completeness.md 의 D등급 중 우선도 P1 4건을 BDR v2 시안 톤으로 박제.

대상:
1. src/app/(web)/community/[id]/edit/page.tsx — Dev/design/BDR v2/screens/PostWrite.jsx 패턴 차용 (eyebrow + 카드 컨테이너 + with-aside)
2. src/app/(web)/games/[id]/edit/page.tsx — Dev/design/BDR v2/screens/CreateGame.jsx 3카드 분할 패턴
3. src/app/(web)/profile/complete/page.tsx — OnboardingV2.jsx 톤 일치 (M5 단계 압축 검토)
4. src/app/(web)/profile/growth/page.tsx — Profile.jsx 게이미피케이션 섹션 톤

박제 룰 (phase-9-prompts.md 표준):
- 시안의 클래스명/구조는 그대로 (eyebrow, with-aside, card 등 globals.css 의 v2 클래스)
- 데이터 fetching 로직은 유지 (API/prisma 호출 변경 금지)
- 상단에 표준 헤더 코멘트:
  * 시안 출처: Dev/design/BDR v2/screens/<File>.jsx
  * 박제 등급: B (또는 A 목표)
  * 마지막 검증: 2026-04-29

각 페이지 박제 후 다음 검증:
- /community/[id]/edit: 게시글 수정 폼 동작 확인 (POST /api/web/posts/[id])
- /games/[id]/edit: 경기 수정 폼 동작 확인
- /profile/complete: M5 단계 진행 그대로 동작
- /profile/growth: useEffect 패턴은 일단 유지 (시각만 v2 톤)

작업 단위: 페이지 1건당 별도 커밋. message:
feat(design-v2): /community/[id]/edit Phase 9 박제 (PostWrite.jsx)

총 4 커밋 → subin 브랜치 push → dev PR.
```

### 7-4. P1-3 — F등급 정책 결정 + C등급 /match (1.5시간)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 정책 결정 2건 + 후속 작업.

(1) F등급 — Dev/design/BDR v2/screens/Referee.jsx 시안의 라우트 누락
배경:
- 시안 파일 Referee.jsx 존재
- 실제 /referee 라우트는 사용자용이 아닌 심판 플랫폼(referee 그룹) 으로 별도 구축됨
- 즉 사용자용 "심판" 페이지 시안과 실제 referee 시스템 충돌

PM 결정 옵션:
- A: 시안 폐기 — Referee.jsx 시안을 archive 처리. 심판 시스템은 별도 도메인.
- B: 사용자용 새 라우트 생성 — /referee-info 같은 SEO 페이지로 (시안 1:1 박제, DB 비연결)
- C: 시안 흡수 — 심판 플랫폼 메인 대시보드(/referee/page.tsx) 의 빈 상태 UI 에 시안 톤 일부 차용

PM 에 1번 답변 받은 뒤 진행.

(2) C등급 /match 정책 결정 (phase-9-audit.md P1)
배경:
- /match 라우트는 Phase 8 박제 완료 (시안 1:1)
- 진입점 0건 + DB 미연결 상태
- 토너먼트 시스템과 의미 중복 가능

옵션:
- A: 진입점 추가 (More 메뉴 + 홈 카드)
- B: redirect /tournaments
- C: 시안 보존 + 라우트 비활성화 (404 또는 hidden)

PM 결정 후 1줄 작업 (라우트/리다이렉트 수정).

(3) /onboarding/setup 자동 redirect 보강 (phase-9-audit.md 1-A)
- /verify 직후 또는 회원가입 직후 /onboarding/setup 자동 진입 흐름 추가
- 현재 라우트는 박제됐지만 진입점 단절
- 작업 위치: src/app/(web)/verify/page.tsx 또는 verify 후 redirect 처리 컴포넌트
- 완료 조건 검증: 신규 회원가입 → /verify → /onboarding/setup 자동 도착 시나리오

각 항목 단위 커밋. PM 의사결정 답이 필요한 (1)(2) 는 결정 받은 뒤 수행.
```

### 7-5. P2-1 — 자동 검증 시스템 구축 (3시간)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: 디자인 규칙 위반 재발 방지를 위한 자동 검증 인프라 구축.

산출물:
1. scripts/check-design-rules.sh — 4 카테고리 grep 검사
2. package.json 의 "lint:design" 스크립트
3. .husky/pre-commit (또는 lint-staged) 훅 통합
4. .github/workflows/design-lint.yml — PR 시 자동 체크

스크립트 명세 (Dev/design/ui-consistency-audit-2026-04-29.md §6-2 가드레일 1 참고):
- 하드코딩 hex 색상 (text|bg|border|from|to|via 모두)
- lucide-react import
- 인라인 gridTemplateColumns 의 repeat() / minmax() 고정
- 금지 색상 (pink/rose/orange/amber 클래스)

각 검사는 발견 0건이면 통과, 1건+ 면 위반 라인 출력 후 exit 1.

테스트:
- 의도적으로 hex 한 줄 추가 후 lint:design 실패 확인
- 제거 후 재실행 → 통과 확인

추가 산출:
- src/app/**/page.tsx 의 시안 출처 코멘트 카운트 스크립트
- "박제 진행률 = (코멘트 있는 페이지 수 / 전체 page.tsx 수) * 100"
- README.md 또는 phase-9-paste-completeness.md 의 KPI 표 자동 갱신 가능하게

검증 후 커밋 4건 분리:
1. chore(scripts): check-design-rules.sh
2. chore(npm): lint:design 스크립트 추가
3. chore(husky): pre-commit 훅 통합
4. ci: design-lint workflow
```

### 7-6. P2-2 — D등급 P2/P3 박제 잔여 (4시간)

```text
"오늘 작업 시작하자" 체크리스트 통과 후 다음 작업.

목표: phase-9-paste-completeness.md D등급 P2/P3 6건 정리.

작업 1 — games/new, teams/new 내부 form 컴포넌트 박제 검수 (1h):
- src/app/(web)/games/new/_components/game-wizard.tsx (또는 NewGameForm)
- src/app/(web)/teams/new/_components/* (NewTeamForm 등)
- 커밋 history 의 "Phase 2 CreateGame" / "Phase 3 TeamCreate" 흔적 vs 현재 코드 일치 검수
- 시안 출처 코멘트가 form 컴포넌트 안에 있으면 page.tsx wrapper 에도 1줄 추가

작업 2 — venues/[slug] 박제 (2h):
- src/app/(web)/venues/[slug]/page.tsx
- CourtDetail.jsx 시안의 히어로 + 정보 카드 패턴 차용
- 공개 SEO 페이지 → metadata 보존 + 데이터 fetching 그대로

작업 3 — profile/bookings, profile/weekly-report E 재분류 (30m):
- 시안 정말 없으면 phase-9-paste-completeness.md 표 D → E 로 이동
- BDR v2 토큰만 일치하는지 확인

작업 4 — help/glossary redirect (30m):
- /help 메인 페이지가 통합 허브이면 /help/glossary 는 /help#glossary 로 redirect
- 또는 시안 톤 일치만 보강

각 작업 단위 커밋.
```

---

## 8. 우선순위 권고 (요약)

```
지금 (오늘):
└─ P0-1 8개 페이지 모바일 재확인 + ui_breaking 3건 회귀 점검 (1h)

이번 주:
├─ P1-1 코드 위반 4 파일 토큰화 (1.5h)
├─ P1-2 D등급 P1 4건 박제 (6h)
└─ P1-3 정책 결정 + /onboarding/setup redirect (1.5h)

다음 주:
├─ P2-1 자동 검증 시스템 (3h)
└─ P2-2 D등급 P2/P3 잔여 (4h)
```

**총 견적**: P0 1h + P1 9h + P2 7h = **약 17시간 / 3 작업일**.

---

## 9. 품질 KPI (감사 후 추적)

| 지표 | 현재 | 목표 (Phase 9 완료 시) |
|------|------|---------------------|
| A등급 라우트 (시안 출처 명시) | 32 | 40+ |
| D등급 라우트 (박제 안됨) | 11 | 0~3 (재분류 후) |
| F등급 라우트 (라우트 누락) | 1 | 0 (정책 결정) |
| 하드코딩 hex 위반 파일 | 4 | 0 |
| lucide-react import | 1 | 0 |
| 모바일 grid 안티패턴 | 0 (4afb4f9 픽스 후) | 0 (재발 방지 검증 자동화) |
| 시안 출처 코멘트 적용 페이지 | ~20 | 50+ |

---

## 부록 A — 검증된 사실 vs 추측

| 주장 | 근거 | 신뢰도 |
|------|------|--------|
| 모바일 grid 안티패턴 8건 픽스됨 | 커밋 4afb4f9 (2026-04-29 15:30) | ✅ git log 확인 |
| ui_breaking/ 5장은 픽스 이전 | 파일 mtime 12:54~13:02 (커밋은 15:30) | ✅ ls -la 확인 |
| 하드코딩 hex 4 파일 | rg `(text\|bg\|border\|from\|to\|via)-\[#` | ✅ grep 결과 |
| lucide-react 1 import | rg `from ['"]lucide-react['"]` | ✅ grep 결과 (12 mention 중 11 은 코멘트) |
| /admin /referee 사이드바 정상 | className `hidden lg:flex` 확인 | ✅ 코드 확인 (스크린샷 vs 코드 모순 → 재캡처 필요) |
| D등급 11개 / C등급 9개 / F등급 1건 | phase-9-paste-completeness.md | ✅ 문서 인용 |

## 부록 B — 외부 참조 인덱스

- `Dev/design/DESIGN.md` — 디자인 시스템 명세 (영구 참조)
- `Dev/design/phase-9-paste-completeness.md` — 117 라우트 5+1 등급 분류 (이 보고서의 D/C/F 출처)
- `Dev/design/phase-9-audit.md` — 진입점 단절 감사 (4 라우트 0건)
- `Dev/design/phase-9-prompts.md` — Phase 9 CLI 프롬프트 11개
- `Dev/design/BDR v2/screens/` — 시안 70+ 화면
- `Dev/design/ui_breaking/` — 사용자 보고 깨짐 5장 (2026-04-29)
