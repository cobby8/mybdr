# BDR 디자인 시스템 토큰

> 모든 시안은 이 토큰을 사용합니다. 하드코딩 hex / 외부 색상 라이브러리 금지.
>
> **실측 동기화 2026-05-07** — 본 문서는 `src/app/globals.css` 의 실제 정의값과 일치시켜 박제. 차이 발생 시 globals.css 가 source of truth.

---

## 0. 듀얼 테마 구조 (2026-05-07 갱신)

> **중요**: BDR 은 **라이트 = Modernized Daum Café feel** + **다크 = Refined Brutalism** 두 톤을 동시 운영.
> 첫 페인트는 라이트 (`color-scheme: light`) 가 기본 — 다크는 `[data-theme="dark"]` 또는 `html.dark` 적용 시 활성화.
> 토큰은 `:root` 에 brand/radii/spacing 공유 + `[data-theme="light"]` 와 `[data-theme="dark"]` 가 surface/ink/border 를 각자 정의.

```css
/* 첫 페인트 = 라이트 (다음 카페 톤) */
:root:not([data-theme]) { color-scheme: light; }
[data-theme="light"], html.light { color-scheme: light; }
[data-theme="dark"],  html.dark  { color-scheme: dark;  }
```

라이트/다크가 다른 값을 갖는 토큰은 §1 표에서 두 컬럼으로 표기.

---

## 1. 색상 (CSS 변수)

### 1-1. 브랜드 (라이트/다크 공유 — `:root`)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--bdr-red)` | `#E31B23` | BDR Red — 브랜드 원색 (raw) |
| `var(--bdr-red-ink)` | `#B3141A` | Red 어두운 변형 (호버 / pressed) |
| `var(--bdr-red-hot)` | `#FF2A33` | Red 밝은 변형 (LIVE / pulse) |
| `var(--accent)` | `var(--bdr-red)` | 강조 / 1차 CTA / 활성 상태 (alias) |
| `var(--accent-soft)` | 라이트 `#FDE8E9` / 다크 `#2A1214` | accent 반투명 배경 |
| `var(--cafe-blue)` | 라이트 `#0F5FCC` / 다크 `#3B82F6` | utility bar / 링크 / 다음카페 톤 |
| `var(--cafe-blue-deep)` | 라이트 `#0A4CA6` / 다크 `#1E3A8A` | hover / pressed |
| `var(--cafe-blue-soft)` | 라이트 `#E8F1FC` / 다크 `#1A2338` | 정보 카드 배경 |
| `var(--cafe-blue-hair)` | 라이트 `#C7DCF5` / 다크 `#23324F` | 1px 헤어라인 보더 |
| `var(--info)` | `#0079B9` | 링크 / 정보성 뱃지 |
| `var(--link)` | 라이트 `#0066CC` / 다크 `#6EA8FE` | 본문 링크 |
| `var(--link-visited)` | 라이트 `#6544A6` / 다크 `#B79BFF` | 방문한 링크 |

> ⚠️ **회귀 가드**: 기존 문서는 `var(--cafe-blue) = #1B3C87` (Navy) 로 정의했으나 실제 globals.css 는 다음카페 톤의 더 밝은 블루. 시안 박제 시 globals.css 값 사용.

### 1-2. 배경 / 표면

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `var(--bg)` | `#F4F6FA` (블루 틴트 페이지) | `#0B0D10` |
| `var(--bg-elev)` | `#FFFFFF` | `#13171C` |
| `var(--bg-card)` | `#FFFFFF` | `#171C22` |
| `var(--bg-alt)` | `#F8FAFD` | `#1B2128` |
| `var(--bg-head)` | `#EEF2F7` | `#1D232B` | 테이블 헤더 / 섹션 헤딩 배경 |

> **참고**: `--bg-hover` 는 globals.css 에 별도 정의 없음 — hover 시 `--bg-alt` 를 그대로 사용하거나 컴포넌트별 `--bg-elev` 로 한 단계 lift.

### 1-3. 텍스트 (잉크)

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `var(--ink)` | `#1A1E27` | `#F6F7F9` |
| `var(--ink-soft)` | `#404755` | `#D7DDE6` |
| `var(--ink-mute)` | `#6B7280` | `#9BA5B3` |
| `var(--ink-dim)` | `#8C94A0` | `#6B7482` |
| `var(--ink-on-brand)` | `#FFFFFF` | `#FFFFFF` |

### 1-4. 테두리

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `var(--border)` | `#E3E7ED` | `#262D36` |
| `var(--border-strong)` | `#D0D5DD` | `#3A4450` |
| `var(--border-hard)` | `#B5BCC6` | `#FFFFFF` (브루탈 강조) |

### 1-5. 상태

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--ok)` | `#1CA05E` | 성공 / 인증완료 / 정상 (브랜드 톤 그린) |
| `var(--warn)` | `#E8A33B` | 경고 |
| `var(--danger)` | `#E24C4B` | 에러 / 위험 (Red 변형 — accent 와 분리) |
| `var(--info)` | `#0079B9` | 정보 / 링크 |

> ⚠️ **회귀 가드 (2026-05-07)**: 기존 문서의 `--err` / `--err-light` / `--warn = #F59E0B` 토큰은 globals.css 에 미정의. 실제 토큰은 `--ok / --warn / --danger / --info` 4종. 시안에서 hex fallback 사용 시 위 값 (예: `#1CA05E` `#E24C4B`) 만 허용.

---

## 2. 금지 색상

### 2-1. 절대 사용 금지

```
❌ 핑크 / 살몬 / 로즈 / 코랄 / 피치
❌ 따뜻한 베이지 / 크림색 / 따뜻한 흰색
❌ 하드코딩 hex 범위:
   - #FF8xxx, #FFAxxx, #FFBxxx (핑크/오렌지)
   - #E7Bxxx, #E8Axxx, #F0Dxxx
   - #FFF0xx, #FFF5xx (따뜻한 흰)
   - #FAExxx, #FCExxx (베이지)
```

### 2-2. 빨강 변형 시 주의

```
✅ Red #E31B23 + 투명도 → rgba(227,27,35, 0.15) (밝게 만들 때)
❌ Red 의 밝은 변형으로 핑크 사용 금지 (#FF8xxx 류)
```

---

## 3. 타이포그래피

### 3-1. 폰트 패밀리

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--ff-display)` | `'Archivo', 'Bebas Neue', 'Impact', 'Noto Sans KR', system-ui` | 영문 헤딩 / 큰 숫자 |
| `var(--ff-body)` | `'Pretendard', 'Noto Sans KR', -apple-system, system-ui` | 한글 본문 전체 |
| `var(--ff-mono)` | `'JetBrains Mono', 'IBM Plex Mono', ui-monospace` | 코드 / 통계 숫자 |

> next/font/google 변수 (`--font-archivo`, `--font-jetbrains`) 는 `layout.tsx` 에서 `html` 변수로 주입 — `--ff-display` / `--ff-mono` 가 자동으로 호스팅된 폰트로 덮어씀.

### 3-2. 크기 체계 (CSS 토큰 — 라이트/다크 별도)

> globals.css 는 듀얼 테마라 폰트 크기도 라이트/다크가 다르게 정의 (다크 = 큰 헤딩 = brutalism poster 톤). 토큰 사용 권장.

| 토큰 | 라이트 | 다크 | 용도 |
|------|--------|------|------|
| `var(--fs-hero)` | `clamp(28px, 3.4vw, 44px)` | `clamp(40px, 5vw, 72px)` | 페이지 히어로 / display |
| `var(--fs-h1)` | `28px` | `36px` | 페이지 타이틀 |
| `var(--fs-h2)` | `22px` | `26px` | 섹션 헤딩 |
| `var(--fs-h3)` | `17px` | `19px` | 카드 헤딩 |
| `var(--fs-body)` | `14px` | `15px` | 본문 |
| `var(--fs-small)` | `13px` | `13px` | 보조 텍스트 |
| `var(--fs-micro)` | `11px` | `11px` | 라벨 / eyebrow |
| `var(--lh-body)` | `1.6` | `1.55` | 본문 라인하이트 |

### 3-3. 굵기 / 폰트 매핑 (관례)

| 레벨 | 굵기 | 폰트 |
|------|------|------|
| Hero / Display | 700~800 | `--ff-display` |
| H1 / H2 | 700 | `--ff-display` 또는 `--ff-body` |
| H3 / Title | 600 | `--ff-body` |
| Body | 400 | `--ff-body` |
| Caption / Small | 400~500 | `--ff-body` |
| Label / Micro | 500~600 | `--ff-body` |
| 통계 / 숫자 | 600 | `--ff-mono` (`tnum` feature 활성화됨) |

### 3-4. 큰글씨 모드

`html.large-text` 클래스 추가 시 전체 폰트 120% 확대 (접근성).

---

## 4. 라운딩 (border-radius)

### 4-0. 토큰 (실제 globals.css)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `var(--r-0)` | `0px` | 직각 (다크 brutalism 카드) |
| `var(--r-1)` | `2px` | 미세 라운딩 (chip / 다크 mode chip) |
| `var(--r-2)` | `4px` | **버튼 표준** (`var(--radius-pill)` alias 와 동일 의미) |
| `var(--r-3)` | `6px` | 라이트 mode chip / 작은 카드 |
| `var(--r-4)` | `8px` | 중간 카드 |
| `var(--radius-card)` | 라이트 `10px` / 다크 `0px` | **카드 표준 — 라이트는 부드러움 / 다크는 brutalism 직각** |
| `var(--radius-chip)` | 라이트 `6px` / 다크 `2px` | chip / pill / 필터 칩 |
| `50%` | 별도 | **아바타 / dot / 정사각형 원형 뱃지** (9999px 대신 50% 사용) |

> ⚠️ **중요 — 다크 brutalism 룰**: 다크 모드에서 카드는 라운딩 0px (직각). 시안에서 `border-radius: var(--radius-card)` 사용 시 자동으로 라이트 10px / 다크 0px 적용. 카드 박스에 하드코딩 8px 금지.

### 4-1. pill 9999px 룰 명확화 (2026-05-01)

> **"pill 9999px ❌"의 정의 = 직사각형(W ≠ H) 요소를 알약 모양으로 만드는 9999px**
>
> 정사각형(W = H) 요소의 원형은 **`border-radius: 50%`** 사용 — 룰 위반 아님.

| 케이스 | 권장 | 금지 |
|--------|------|------|
| 직사각형 버튼 (예: `100×40`) | `4px` (`var(--radius-pill)`) | ❌ `9999px` (pill) |
| 정사각형 뱃지 (예: `18×18`) | ✅ `50%` | ❌ `9999px` (CSS 결과 동일하나 룰 회색 영역 회피) |
| 아바타 (정사각형 이미지) | ✅ `50%` | — |
| dot 인디케이터 (예: `8×8`) | ✅ `50%` | — |

**판정 기준**: 코드 grep으로 `9999px` 검색 시 **0건**이 깔끔. 정사각형 원형은 모두 `50%`로 통일.

---

## 5. 그림자 (4단계 — 듀얼 톤)

> 라이트 = 부드러운 blur 그림자 / 다크 = brutalism hard offset (`Npx Npx 0 0`).

| 토큰 | 라이트 | 다크 |
|------|--------|------|
| `var(--sh-xs)` | `0 1px 2px rgba(15,23,42,.04)` | `2px 2px 0 0 rgba(0,0,0,.6)` |
| `var(--sh-sm)` | `0 2px 6px rgba(15,23,42,.06)` | `4px 4px 0 0 rgba(0,0,0,.6)` |
| `var(--sh-md)` | `0 6px 18px rgba(15,23,42,.08)` | `6px 6px 0 0 rgba(0,0,0,.7)` |
| `var(--sh-lg)` | `0 12px 40px rgba(15,23,42,.10)` | `10px 10px 0 0 rgba(0,0,0,.75)` |

> **brutalism 호버**: 다크 mode 버튼/카드 호버 시 `transform: translate(-2px, -2px)` + 더 큰 sh 토큰 적용 → 종이가 들리는 느낌.

> ⚠️ **회귀 가드 (2026-05-07)**: 기존 문서의 `--sh-card` / `--sh-lift` 토큰은 globals.css 에 미정의 — 시안에서 사용 X. `--sh-xs/sm/md/lg` 4단계만 사용.

---

## 6. 모바일 룰 (필수 준수)

### 6-1. 브레이크포인트

```css
@media (max-width: 720px) {  /* 모바일 (phone) — 표준 */ }
@media (max-width: 768px) {  /* 모바일 (tablet small) */ }
@media (max-width: 900px) {  /* 태블릿 + 일부 with-aside */ }
@media (max-width: 1024px) { /* 태블릿 (lg 미만) */ }
```

### 6-2. iOS Safari 자동 줌 차단

```css
@media (max-width: 720px) {
  input:not([type="checkbox"]):not([type="radio"]),
  select,
  textarea {
    font-size: 16px !important;  /* 16px 미만이면 iOS 자동 줌 발생 */
  }
}
```

### 6-3. 터치 타겟

```css
@media (max-width: 720px) {
  .btn { min-height: 44px; }       /* iOS HIG 권장 */
  .btn--sm { min-height: 44px; }
  .btn--xl { min-height: 48px; }
}
```

### 6-4. 가로 overflow 차단

```css
@media (max-width: 768px) {
  html, body { overflow-x: hidden; max-width: 100vw; }
  .page { overflow-x: hidden; max-width: 100%; }
}
```

### 6-5. 인라인 grid 사용 시

```jsx
{/* ❌ 모바일 분기 없는 고정 grid 금지 */}
<div style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>...</div>

{/* ✅ auto-fit minmax (모바일 자동 줄 수) */}
<div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>...</div>

{/* ✅ 또는 className 분기 */}
<div className="grid-cards">...</div>
{/* CSS:
   .grid-cards { display: grid; grid-template-columns: repeat(3, 1fr); }
   @media (max-width: 720px) { .grid-cards { grid-template-columns: 1fr; } }
*/}
```

---

## 7. 아이콘

### 7-1. 사용 가능

```
✅ Material Symbols Outlined (Google Fonts CDN)
   <span className="material-symbols-outlined">arrow_back</span>

✅ Unicode 이모지 (시안에 검증된 것)
   - 더보기 메뉴 그룹 / 프로필 settings 섹션
   - 👤🏀🔔🔒💳⚠️📋📅🔖💬🎖📈✍🆚➕📍📮⚙📣🔎👔⭐🏆📷✏🔑🎯🛡🦓
```

### 7-2. 절대 금지

```
❌ lucide-react (외부 라이브러리)
❌ react-icons / heroicons / 등 외부 아이콘 패키지
```

### 7-3. 아이콘 크기

| 용도 | 크기 |
|------|------|
| 사이드바 / 네비 | 1.25rem (20px) |
| 모바일 하단 탭 | 1.5rem (24px) |
| FAB | 1.875rem (30px) |
| 설정 메뉴 | 1.125rem (18px) |

---

## 8. 컴포넌트 표준

### 8-1. 버튼

```css
.btn {
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.15s;
}
.btn--primary {
  background: var(--accent);
  color: var(--on-accent);
}
.btn--primary:hover { background: var(--accent-hover); }
.btn--accent {
  background: var(--cafe-blue);
  color: #fff;
}
.btn--sm { padding: 8px 12px; font-size: 13px; }
.btn--xl { padding: 12px 20px; font-size: 15px; }

@media (max-width: 720px) {
  .btn { min-height: 44px; }
}
```

### 8-2. 카드

```css
.card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: var(--sh-card);
}
.card:hover { background: var(--bg-hover); }
```

### 8-3. 페이지 셸

```css
.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px var(--gutter);
}
.page--wide { max-width: 1440px; }
```

### 8-4. with-aside (좌 사이드바 + 우 본문)

```css
.with-aside {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 24px;
}
@media (max-width: 900px) {
  .with-aside { grid-template-columns: 1fr; }
}
```

---

## 9. 폐기 토큰 (시안 박제 시 사용 금지)

> globals.css 주석 (`L9 "기존 --color-* 변수는 전면 폐기"`) 따라 다음 토큰은 시안 박제 시 사용 X.
> 잔존 페이지 (admin / referee / tournament-admin 약 320 파일) 는 마이그레이션 대상.

```
❌ var(--color-primary)
❌ var(--color-accent)
❌ var(--color-card)
❌ var(--color-surface)
❌ var(--color-surface-bright)
❌ var(--color-border)
❌ var(--color-text-muted)
❌ var(--color-text-secondary)
❌ var(--color-on-accent)
❌ var(--color-success / --color-warning / --color-error)
```

→ 마이그레이션 매핑:

| 폐기 토큰 | 신규 토큰 |
|----------|----------|
| `--color-primary` | `--accent` |
| `--color-accent` | `--accent` |
| `--color-card` | `--bg-card` |
| `--color-surface` | `--bg-elev` |
| `--color-surface-bright` | `--bg-alt` |
| `--color-border` | `--border` |
| `--color-text-muted` | `--ink-mute` |
| `--color-text-secondary` | `--ink-soft` |
| `--color-on-accent` | `--ink-on-brand` |
| `--color-success` | `--ok` |
| `--color-warning` | `--warn` |
| `--color-error` | `--danger` |

---

## 10. 신규 컴포넌트 표준 (2026-04~05 추가, 박제 대상)

> 사용자 직접 수정으로 박제된 신규 패턴들. 향후 시안 작업 시 다음 패턴을 base 로 삼음.

### 10-1. NavBadge (다목적 뱃지)
- 경로: `src/components/bdr-v2/nav-badge.tsx` + `nav-badge.css`
- 변형: `variant="dot"` (빨간 점) / `"count"` (숫자) / `"new"` (NEW 텍스트) / `"live"` (LIVE 펄스)
- 사용처: AppNav 햄버거 (R3 강조 — 신규 컨텐츠 있을 때 dot), 메인 탭 (경기 / 커뮤니티 NEW)

### 10-2. PasswordInput (통합 컴포넌트)
- 경로: `src/components/bdr-v2/password-input.tsx`
- 5 파일 일괄 적용 (login / signup / 비밀번호 재설정 / 회원 인증 / 매치 코드 입력)
- 보기 토글 + autocomplete 정밀 제어 + iOS 16px 자동 줌 차단

### 10-3. ForceActionModal (jersey / withdraw 강제 액션 모달)
- 경로: `src/app/(web)/teams/[id]/manage/_components/force-action-modal.tsx`
- 기존 `window.prompt / alert / confirm` 통합 → 표준 모달 + toast 패턴
- 두 모드: jersey 변경 / 회원 탈퇴
- 다른 강제 액션 모달 만들 때 본 컴포넌트 카피 후 mode prop 추가

### 10-4. PageBackButton 제거 (메인 페이지 정책)
- 메인 메뉴 9개 페이지 (홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기) 는 PageBackButton 사용 X
- AppNav 가 이미 글로벌 네비 — 뒤로가기 중복
- 상세 페이지 (`/games/[id]`, `/teams/[id]` 등) 는 PageBackButton 유지

### 10-5. Hero 헤더 grid 1fr auto 패턴
- 표준: `display: grid; grid-template-columns: 1fr auto;` + grid item `min-width: 0`
- 적용: `/courts`, `/teams/[id]`, `/profile/_v2` 히어로 헤더
- 좌측 = 제목/메타 (1fr 가변), 우측 = 액션 버튼 그룹 (auto)

### 10-6. fade chevron 원형 배지 (가로 스크롤 칩 바)
- 적용: `/courts`, `/teams` 칩 바 (지역/카테고리 필터)
- 좌우 끝 fade gradient + 원형 chevron 배지로 추가 칩 표시
- 표준 클래스: `.filter-chip-bar` (`src/components/bdr-v2/filter-chip-bar.tsx`)

### 10-7. 본인 카드 dropdown (overflow visible 룰)
- 본인 회원 카드 (`/profile`, `/teams/[id]/manage`) 의 ⋮ 메뉴
- **dropdown 자르지 않으려면 부모 카드 `overflow: visible`** 필수 (hidden 금지)
- 본인 표시 = 좌하단 신청 중 뱃지 (4종 신청 시각화 — 번호변경 / 휴면 / 탈퇴 / 이적)

---

## 11. 출처

- `Dev/design/DESIGN.md` (영구 참조)
- `Dev/design/BDR-current/tokens.css` (활성 시안 토큰 — `_archive/BDR v2.X/` 직접 참조 ❌)
- `src/app/globals.css` (사이트 적용 룰 — **source of truth**, 충돌 시 우선)
- `src/components/bdr-v2/*.css` (컴포넌트별 CSS — nav-badge.css 등)
