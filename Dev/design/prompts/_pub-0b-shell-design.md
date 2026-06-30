# PUB-0b-① — 공개웹 셸 교체 + 토큰 마이그레이션 설계 (읽기 전용 분석)

> 작성: planner-architect / 2026-06-30
> 대상: `src/app/(web)` 운영 셸 ↔ `Dev/design/BDR-current` (PUB-v1.0, DualSideNav DS v4)
> 목적: 0b-② 실제 박제 전 **영향 범위 정밀 파악 + PR 분할 설계**
> ⚠️ 읽기 전용. src/·BDR-current/ 미수정. 모든 판단은 실제 파일 근거. 불확실은 "불확실" 표기.

---

## 0. 비유로 보는 이번 작업 (바이브 코더용)

- 지금 공개웹은 **건물 1층 천장에 가로로 긴 안내 간판**(상단 AppNav)이 붙어있고, 모바일은 햄버거로 서랍(Drawer)이 열린다.
- 시안은 이걸 떼고 **건물 왼쪽 벽면에 세로 2단 안내데스크**(DualSideNav = 아이콘 기둥 76px + 메뉴 패널 234px)를 새로 세운다.
- 간판만 바꾸는 게 아니라 **건물 전체 페인트 색(토큰)도 새 팔레트**로 바꾼다. 그런데 페인트 통(globals.css)이 공개웹뿐 아니라 **관리자·심판·기록지 건물과 공유**라서, 색을 바꾸면 옆 건물에도 번질 수 있다 — 이게 이번 최대 리스크다.

---

## 1. 셸 교체 영향 범위

### 1-1. 현행 셸이 렌더되는 구조 (실측)

```
src/app/(web)/layout.tsx                         [server]
  └ getAuthUser() → initialUser 도출 (세션·referee SELECT)
  └ <WebLayoutInner initialUser>                  [client] _layout/web-layout-inner.tsx
       └ SWRProvider > PreferFilterProvider > ToastProvider
            └ <div flex min-h-screen flex-col bg=var(--bg)>
                 ├ <AppNav user unreadCount newGameCount newCommunityCount/>   ← 상단 가로 셸
                 │     components/bdr-v2/app-nav.tsx
                 │       ├ app-nav__utility (로고+계정/설정/로그아웃)
                 │       ├ app-nav__main (로고 + 탭9 + 우측 검색/쪽지/알림/다크/햄버거)
                 │       └ <AppDrawer/>  components/bdr-v2/app-drawer.tsx  ← 모바일 서랍 + MORE_GROUPS
                 ├ <main flex-1>{children}</main>
                 ├ <Footer/>  components/layout/Footer.tsx
                 └ <BottomNav/>  components/BottomNav.tsx  ← ≤720px fixed 하단 탭
```

핵심: 셸은 **layout.tsx(서버) + web-layout-inner.tsx(클라이언트) 2파일에 집중**되어 있고, `(web)` 하위 모든 페이지는 `children`으로만 주입된다. 따라서 **셸 교체 = 이 2파일 + 셸 컴포넌트 교체**이며, 개별 페이지 파일은 원칙적으로 건드리지 않는다.

### 1-2. 현행 AppNav가 제공하는 "기능"과 DualSideNav 매핑

| 현행 AppNav 기능 | 위치 | DualSideNav 대응 | 비고 |
|---|---|---|---|
| 메인 9탭 | main bar | 아이콘 레일 9섹션 | 더보기→마이 교체 (P0-3) |
| 더보기 5그룹 IA | AppDrawer | 컨텍스트 패널 섹션별 서브메뉴 | more-groups.ts → NAV_CTX |
| 검색 | 우측 아이콘 | 패널 상단 인라인 검색바 | 동작 배선 필요 |
| 쪽지/알림 + unread dot | 우측 아이콘 | 마이 섹션 서브메뉴 항목 | 헤더 dot 뱃지 → 서브메뉴 count/dot |
| 다크모드 토글 | 우측 ThemeSwitch | 패널 footer | theme-switch 로직 재사용 |
| 계정/설정/로그아웃 | utility bar | 패널 footer | LogoutLink 로직 재사용 |
| 관리자 진입 링크 | utility bar | railFooter 또는 panelFooter | admin_entry_url 보존 |
| 모바일 햄버거→Drawer | burger btn | 좌측 드래그 핸들 3단 스냅 | AppDrawer 폐기 |
| NEW 뱃지(경기/커뮤니티) | 탭 NavBadge | 레일 dot / 서브메뉴 isNew | newGameCount 등 재사용 |
| 하단 BottomNav | 별도 | DualSideNav 모바일 오버레이로 흡수 | **BottomNav 제거 검토** |

### 1-3. 셸 교체 시 수정/신규 파일 목록

| 파일 | 작업 | 비고 |
|---|---|---|
| `src/components/bdr-v2/dual-side-nav.tsx` | **신규** | `BDR-current/dual-sidenav.jsx` 포팅. JSX→TSX, React.useRef/useEffect 유지, `injectDualNavCss`는 globals.css로 흡수 권장(런타임 주입 대신 정적 CSS) |
| `src/components/bdr-v2/nav-ia.ts` | **신규** | `NAV_SECTIONS`(9) + `NAV_CTX`(섹션별 서브메뉴) + 각 항목 `href` 추가 + `navSectionOf(pathname)` 헬퍼. MyBDR.html L149~247 데이터 정본 |
| `src/app/(web)/_layout/web-layout-inner.tsx` | **수정** | AppNav→DualSideNav 교체. flex-col(세로) → DualSideNav 내부 flex-row(레일+패널+main). Footer는 main 컬럼 내부로 이동. BottomNav 제거. 폴링(me/notifications/nav-badges) 로직 보존 |
| `src/app/(web)/layout.tsx` | **소폭 수정** | initialUser 유지. (DualSideNav active 판정은 client usePathname로 처리 → 서버 변경 최소) |
| `src/components/bdr-v2/theme-switch.tsx` | **재배치** | 로직 유지, panelFooter 안으로 이동. 이중 셀렉터(`[data-theme="dark"], html.dark`) 보존 필수 |
| `src/components/bdr-v2/app-nav.tsx` | **휴면/보관** | import 0 되면 dead. 즉시 삭제보다 1 PR 안정화 후 정리 권장 |
| `src/components/bdr-v2/app-drawer.tsx` | **휴면/보관** | 동상 |
| `src/components/bdr-v2/more-groups.ts` | **폐기 예정** | NAV_CTX(mypage 섹션 등)로 대체. 단 진입점 누락 6항목(아래 §3) 정리 후 삭제 |
| `src/components/BottomNav.tsx` + `bottom-nav.css` | **제거 검토** | DualSideNav 모바일 핸들이 대체. 단 BottomNav는 localStorage 5슬롯 커스텀 기능 보유 → 사용자 결정 필요 |
| `src/app/globals.css` | **수정(대규모)** | §2 토큰 마이그레이션 + 셸 CSS + 컴포넌트 CSS(soft 전환). 별도 PR 권장 |

추정 핵심 수정 파일 수 = **신규 2 + 수정 5~6 + globals.css 1 ≈ 8~9파일**. 개별 (web) 페이지는 원칙적으로 0 (단 §1-4 폭/Footer 회귀 점검 대상은 별도).

### 1-4. (web) 하위 전 페이지가 받는 영향

- **구조적 영향 0 (children 주입)**: 모든 페이지는 `<main>{children}` 자리에 그대로 렌더된다.
- **레이아웃 영향 있음**: 현재 main은 **풀폭**(viewport 전체). DualSideNav 채택 시 main은 `.bdr-dsnav__main`(flex:1)으로 좌측 310px(레일76+패널234)를 제외한 영역. 페이지가 **자체 `.page`(max-w 1200) 중앙정렬**을 쓰면 안전하나, **풀폭/100vw 가정·자체 fixed 헤더·자체 sticky 좌측 요소**가 있는 페이지는 회귀 점검 필요.
- **Footer 위치 변경**: 현재 Footer는 main 아래 풀폭. DualSideNav에서는 main 컬럼(우측) 내부 하단으로 들어간다 — 풀폭 Footer를 원하면 셸 밖에 별도 배치 결정 필요.
- **모바일(≤920px)**: 현재 BottomNav(≤720px fixed). DualSideNav는 ≤920px에서 레일+패널을 숨기고 좌측 드래그 핸들로 노출. **분기점 720(현행) vs 920(시안) 불일치** → 통일 결정 필요(시안 responsive.css는 920 기준 셸, 화면 본문은 720 분기).

---

## 2. 토큰 마이그레이션 계획 (이번 작업의 진짜 난이도)

### 2-1. 핵심 발견 — 토큰은 "값"이 아니라 "별칭 레이어" 문제다

운영 `globals.css`는 이미 **2개의 토큰 어휘**가 공존한다:

1. **신형 토큰** (값 보유): `--bg`, `--ink`, `--accent`, `--cafe-blue`, `--border` 등 (L94~185)
2. **`--color-*` 별칭 레이어** (L2780~2831): `--color-primary: var(--accent)` / `--color-surface: var(--bg-elev)` / `--color-text-primary: var(--ink)` … = **`--color-*`는 이미 신형 토큰으로 자동 연결**

> 즉 `(web)`의 `--color-*` 사용 **2,615건 / 145파일** (전체 5,482건/250파일)은 **별칭을 통해 신형 토큰으로 흐른다 → 일괄 치환 불필요.** 02-design-system-tokens §9 매핑표(폐기 토큰→신규)가 이미 CSS 레벨에서 구현돼 있음.

### 2-2. 진짜 작업 = ① 값 갱신 ② DS v4 단축 토큰 신규 정의

**① 토큰 값 갱신 (globals.css `:root`/`[data-theme]` 블록)** — DS v4 = BDR-current/tokens.css 값으로:

| 슬롯 | 현행 light | DS v4 light | 현행 dark | DS v4 dark |
|---|---|---|---|---|
| `--bg` | #F4F6FA | #F2F4F6 | #0B0D10 | #0A0C10 |
| `--accent`/포인트 | `var(--bdr-red)` (빨강) | **#3182F6 (토스블루)** | `var(--bdr-red)` | #E31B23 (레드) |
| `--cafe-blue` | #0F5FCC | #3182F6 | #3B82F6 | #E31B23 |
| 라운딩 `--r-2` | **4px** | **9px** | 4px | 9px |
| 라운딩 `--r-3` | **6px** | **11px** | 6px | 11px |

→ **P0-2 색상 결재가 여기 박힌다**: 현행은 light/dark 모두 `--accent = bdr-red`. 시안은 light=토스블루/dark=레드 듀얼. 수빈 결재 후 light 블록의 `--accent`/`--cafe-blue`/`--primary`만 토스블루로.

**② DS v4 단축 토큰 신규 정의 (현행 globals.css에 부재 — 실측):**

DualSideNav CSS + 포팅 화면이 참조하나 **현행 globals.css에 없는** 토큰:

| DS v4 토큰 | 현행 대응 토큰 | 상태 |
|---|---|---|
| `--primary` / `--primary-deep` / `--primary-on` | `--accent` / (없음) / `--ink-on-brand` | **신규 별칭 필요** |
| `--soft` / `--mute` / `--dim` | `--ink-soft` / `--ink-mute` / `--ink-dim` | **신규 별칭 필요** |
| `--elev` / `--card` / `--alt` / `--head` | `--bg-elev` / `--bg-card` / `--bg-alt` / `--bg-head` | **신규 별칭 필요** |
| `--bstrong` | `--border-strong` | **신규 별칭 필요** |
| `--soft-fill` / `--soft-ink` | (없음) / (없음) | **신규 정의 필요** |
| `--ff-display` | 있음 (Archivo, 단 Bebas 폴백) | 값 정합 검토 |
| `--r-2`(9px)/`--r-3`(11px) | 있음 (단 4px/6px) | **값 충돌 — §2-4** |

→ 권장: §2-1의 `--color-*` 별칭과 **대칭으로 DS v4 단축 별칭 레이어 추가**. 예:
```css
:root { --primary: var(--accent); --soft: var(--ink-soft); --elev: var(--bg-elev); --card: var(--bg-card); --alt: var(--bg-alt); --bstrong: var(--border-strong); /* … */ }
```
이러면 DualSideNav가 기존 토큰 위에서 그대로 렌더된다(값 중복 정의 회피·단일 source 유지). BDR-current/tokens.css를 통째 복붙하는 방식은 **이중 정의·드리프트 위험**이 커서 비권장.

### 2-3. 듀얼 모드 적용 방식 (셀렉터 호환)

- 현행 셀렉터: `[data-theme="light"], html.light, :root:not([data-theme])` / `[data-theme="dark"], html.dark` (globals L94/152)
- 시안 셀렉터: `[data-theme]` + `[data-mode]`
- ThemeSwitch는 **data-theme + html.dark 클래스 이중 세팅**(theme-switch.tsx L60). → 현행 셀렉터 유지하고 **`[data-mode]`는 추가 안 해도 됨**(시안 전용). light 블록에만 토스블루 포인트를 넣으면 듀얼 모드 자동 성립.

### 2-4. 기존 공유 컴포넌트 영향 (회귀 위험)

- **라운딩 전역 변경**: `--r-2` 4px→9px, `--r-3` 6px→11px는 `--r-2/--r-3`를 쓰는 **모든 도메인**(game-card/board-row/btn 등)에 적용된다. CLAUDE.md "버튼 4px"는 DS v4 "버튼 11px soft"로 의도된 변경이나, **공개웹 외 영역(admin/referee/score-sheet)도 globals.css 공유** → 전역 번짐(§5 리스크).
- **컴포넌트 CSS 스타일 전환**: 현행 globals.css는 다크모드 brutalist 스타일 다수 — `.btn`(border 2px·translate hover·radius 0 탭), `.card`(border 2px), `.app-nav`(2px hard border). DS v4는 soft(그림자 블러·11px·각진 모서리/흰 테두리 제거). **토큰값뿐 아니라 컴포넌트 CSS 규칙 교체도 필요** → 토큰 PR과 분리하거나 `.pub-*` 스코프로 격리 권장.

---

## 3. more-groups 재편 (5그룹 15항목 → 9섹션 서브메뉴)

### 3-1. 매핑표 (현행 MORE_GROUPS → DualSideNav NAV_CTX)

| 현행 더보기 항목 | 현행 그룹 | DS v4 배치 섹션 | NAV_CTX id |
|---|---|---|---|
| calendar | 내 활동 | 경기(내 경기 그룹) | `calendar` |
| saved | 내 활동 | 마이(내 활동) | `saved` |
| stats | 내 활동 | 랭킹 | `stats` |
| live | 경기·대회 | 경기 | `live` |
| scrim | 경기·대회 | 경기 | `scrim` |
| reviews | 둘러보기 | 커뮤니티 | `reviews` |
| awards | 둘러보기 | 랭킹 | `awards` |
| gallery | 둘러보기 | 커뮤니티 | `gallery` |
| pricing | 계정·도움 | 마이(계정·설정) | `pricing` |
| **refereeInfo** | 둘러보기 | **시안 미배치** | ⚠️ 진입점 소멸 |
| **coaches** | 둘러보기 | **시안 미배치** | ⚠️ 진입점 소멸 |
| **shop** | 둘러보기 | **시안 미배치** | ⚠️ 진입점 소멸 |
| **safety** | 계정·도움 | **시안 미배치** | ⚠️ 진입점 소멸 |
| **about** | 계정·도움 | **시안 미배치** | ⚠️ 진입점 소멸 |
| **help** | 계정·도움 | **시안 미배치** | ⚠️ 진입점 소멸 |

### 3-2. 마이탭 신설 (NAV_CTX `mypage`)

시안 mypage 섹션 = 2그룹:
- **내 활동**: myActivity(`/my`) · myRegistrations(`/my/registrations`) · saved(`/saved`) · messages(`/messages`) · notifications(`/notifications`)
- **계정·설정**: profile(`/profile`) · editProfile(`/profile/edit`) · settings(`/settings`) · pricing(`/pricing`)

→ Phase19에서 헤더 중복 이유로 빠졌던 messages/notifications가 **헤더 자체가 사라져 마이 섹션으로 정당하게 재등장**(IA 델타 §2-D 분석과 일치).

### 3-3. 작업 본질

- NAV_CTX는 시안 정본(MyBDR.html L160~241)에 **id/label/icon만** 있고 **href 없음**(시안은 setRoute SPA). → **포팅 시 각 항목에 운영 라우트 href 부여**가 핵심 작업(IA 델타 §1-A 매핑표 + more-groups.ts 기존 href 재사용).
- active 판정: 시안은 `navSectionOf(route)`. 운영은 `usePathname()` → 섹션/서브 역매핑 헬퍼 신규(`nav-ia.ts`).
- **누락 6항목(refereeInfo/coaches/shop/safety/about/help)** = **P1-1 결재 대상**. 라우트는 실재 → 진입점만 소멸. 옵션: ⓐ Footer 링크 보강 ⓑ 해당 섹션 서브메뉴에 추가(시안 확장) ⓒ 의도적 드롭. **셸 박제 자체와 독립** → PR3에서 결정.

---

## 4. PR 분할 제안 (0b-②)

> 의존순서: **PR1 → PR2 → PR3 → PR4** (직렬 권장). PR1(토큰)이 토대라 셸이 그 위에 올라감.

| PR | 범위 | 핵심 파일 | 검증 포인트 | 의존 |
|---|---|---|---|---|
| **PR1 토큰 토대** | DS v4 토큰 값 갱신 + 단축 별칭 레이어 추가 + 색상 듀얼(P0-2) + 라운딩 soft | `globals.css` | ① 기존 (web) 화면 색·라운딩 회귀 스냅 ② **legacy admin/referee/score-sheet 번짐 0 확인**(스코프) ③ light=토스블루/dark=레드 토글 | 없음 (P0-2 결재 선행) |
| **PR2 셸 컴포넌트** | DualSideNav 포팅 + nav-ia 데이터 + web-layout-inner 교체 + theme-switch 재배치 + BottomNav 처리 | `dual-side-nav.tsx`(신규) · `nav-ia.ts`(신규) · `web-layout-inner.tsx` · `layout.tsx` · `theme-switch.tsx` | ① 데스크톱 레일+패널 렌더 ② children 폭/Footer 회귀 ③ 폴링(알림/뱃지) 유지 ④ 로그인/비로그인 footer 분기 | PR1 |
| **PR3 IA 배선** | NAV_CTX href 부여 + active 역매핑 + unread/NEW 뱃지 배선 + 검색 동작 + 누락6 진입점(P1-1) | `nav-ia.ts` · `web-layout-inner.tsx` · `more-groups.ts`(폐기) | ① 9섹션 전 서브메뉴 라우트 정확 ② active 하이라이트 ③ 쪽지/알림 dot ④ 검색 → `/search` | PR2 |
| **PR4 반응형·정리** | 모바일 핸들 3단 스냅 검증 + 720/920 분기 통일 + dead code(app-nav/app-drawer/more-groups) 정리 + 13룰 문서 갱신 | `globals.css`(모바일) · 03/00 문서 · 잔재 삭제 | ① 모바일 드래그 스냅 ② 키보드/ESC/백드롭 ③ a11y(검색 label) ④ tsc+build | PR3 |

> 분할 사유: 토큰(전역 영향)과 셸(구조)은 회귀 표면이 완전히 달라 **한 PR에 묶으면 회귀 원인 격리가 불가**. 토큰만 먼저 머지해 안정화 후 셸을 올리는 것이 롤백·검증 모두 유리.

---

## 5. 리스크·주의

| # | 리스크 | 심각도 | 대응 |
|---|---|---|---|
| R1 | **globals.css 토큰 전역 번짐** — `:root`/`[data-theme]` 값 변경은 (web) 외 legacy (admin)/(referee)/(score-sheet)/site-host에도 적용(전부 `--color-*`/`--accent` 공유). light 포인트 red→blue·라운딩 4→9px가 옆 영역으로 샘 | **최상** | ⓐ 토큰 변경을 `.pub-shell`/`[data-pub]` 스코프로 격리 or ⓑ 전역 적용 수용(legacy도 함께 리뉴얼 의도면 OK). **PR1 전 사용자 결정 필수.** admin-v2는 자체 styles라 안전 |
| R2 | 라운딩 전역 변경(--r-2/--r-3) | 상 | R1과 동일 스코프 전략. CLAUDE.md "버튼 4px" 항목 갱신 동반 |
| R3 | (web) 페이지 폭/Footer 회귀 — 풀폭·자체 fixed/sticky 가정 페이지 | 중 | PR2에서 대표 페이지(홈/경기목록/대회상세/마이) 우선 스냅. Footer 풀폭 여부 결정 |
| R4 | BottomNav 제거 시 모바일 회귀(localStorage 5슬롯 커스텀 상실) | 중 | 사용자 결정 — DualSideNav 핸들로 대체 vs 병행 유지 |
| R5 | 13룰 A(AppNav frozen) 위반 — 셸 자체 교체 | 상(절차) | **P0-1 결재 = AppNav frozen PUB 면제.** 후속: `03-appnav-frozen-component.md`를 "PUB=DualSideNav frozen"으로 갱신 + 00-master-guide 13룰 개정(신규 DualSideNav frozen 문서 신설) |
| R6 | 박제 가드 — API/데이터 패칭 유지·UI만 | 중 | 셸은 **순수 presentational**. 폴링(me/notifications/nav-badges)·snake_case 응답키 접근(unread_count 등) **그대로 보존**. 신규 fetch 0 |
| R7 | snake_case 함정 | 하 | 셸은 데이터 거의 무관(user.name/unread만). 신규 API 0이라 노출 적음 |
| R8 | 모바일 셸 CSS 런타임 주입(`injectDualNavCss`) | 하 | SSR/hydration 안전 위해 **globals.css 정적 편입 권장**(JS 주입 → FOUC 가능) |
| R9 | 누락 6항목 진입점 소멸(refereeInfo/coaches/shop/safety/about/help) | 하 | P1-1 — 셸과 독립, PR3 결정 |

### 13룰 갱신 필요 항목 (요약)
- `03-appnav-frozen-component.md`: PUB 도메인 AppNav frozen **면제** 명시 + DualSideNav를 신규 frozen 셸로 박제 (포팅 후 코드 동결)
- `00-master-guide.md` 13룰 A(7룰): PUB 한정 무효화 주석 + 메인 탭 9 = 홈~**마이**(더보기 폐지)
- `02-design-system-tokens.md`: light 포인트=토스블루(P0-2 결재 반영), 라운딩 soft(9/11/13/16px), DS v4 단축 토큰 별칭 추가 명문화
- `04-page-inventory.md`: 신규/삭제 라우트(IA 델타 §2-E) 반영

---

## 6. 핵심 요약

- **셸 교체 수정 파일 ≈ 8~9개** (신규 2: dual-side-nav.tsx·nav-ia.ts / 수정 5~6: web-layout-inner·layout·theme-switch·globals + 휴면 app-nav·app-drawer·more-groups). **개별 (web) 페이지는 children 주입이라 원칙 0** (폭/Footer 회귀 점검만 별도).
- **PR 분할 = 4단계 직렬**: ①토큰 토대 → ②셸 컴포넌트 → ③IA 배선 → ④반응형·정리. 토큰(전역 영향)과 셸(구조)을 반드시 분리.
- **토큰 마이그레이션 진짜 작업** = `--color-*` 2,615건 치환이 **아니라**(이미 별칭으로 흐름), ⓐ 토큰 **값** DS v4화 + ⓑ **DS v4 단축 토큰(--primary/--soft/--elev/--bstrong 등) 별칭 레이어 신규 추가**.
- **최대 리스크(R1)** = globals.css 토큰 변경이 **공개웹 외 legacy 영역(admin/referee/score-sheet)으로 전역 번짐**. PR1 착수 전 "스코프 격리 vs 전역 수용" 사용자 결정 필수.
