# AppNav (헤더) Frozen 컴포넌트

> ⚠️ **이 컴포넌트는 frozen 입니다.** 모든 시안 작업 시 아래 코드를 **그대로 카피**해서 사용. **재작성 / 재구성 절대 금지**.
> 변경 필요 시 사용자 직접 확인 후에만.

---

## 🔒 보존 룰 (사용자 결정 §1)

다음 7 규칙 모두 준수:

| # | 룰 | 검증 방법 |
|---|-----|---------|
| 1 | 9 메인 탭 = 홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기 | tabs 배열 8개 + 마지막 더보기 = 9 |
| 2 | utility bar 우측 (계정/설정/로그아웃) **모바일에서도 표시** | `.util-left` 모바일 hidden / 우측 그대로 |
| 3 | main bar 우측 = 검색/알림/다크/햄버거(모바일) **만** | 더보기 dropdown trigger / 아바타 추가 X |
| 4 | 다크모드 — PC 듀얼 라벨 / **모바일 단일 아이콘** | ThemeSwitch 가 viewport 분기 |
| 5 | 검색/알림 = `app-nav__icon-btn` 클래스 (아이콘만) | border / 배경 박스 X |
| 6 | 모바일 닉네임 hidden | `hidden sm:inline` 또는 미디어 쿼리 |
| 7 | 더보기 = 마지막 9번째 탭 (햄버거 클릭 시 5그룹 패널) | `.app-nav__more` 또는 drawer 안 |

---

## 1. JSX 코드 (시안용)

> 시안 작업 시 `components.jsx` 의 AppNav 를 다음 코드로 사용. 변경 X.

```jsx
function AppNav({ route, setRoute, theme, setTheme }) {
  const tabs = [
    { id: 'home',   label: '홈' },
    { id: 'games',  label: '경기' },
    { id: 'match',  label: '대회' },
    { id: 'orgs',   label: '단체' },
    { id: 'team',   label: '팀' },
    { id: 'court',  label: '코트' },
    { id: 'rank',   label: '랭킹' },
    { id: 'board',  label: '커뮤니티' },
    { id: 'more',   label: '더보기' },  // ⭐ 9번째 탭 — 클릭 시 drawer 또는 5그룹 패널
  ];
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const go = (id) => {
    if (id === 'more') {
      setDrawerOpen(true);
      return;
    }
    setRoute(id);
    setDrawerOpen(false);
  };

  return (
    <nav className="app-nav">
      {/* utility bar — 상단 파란 띠 */}
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          {/* 좌측 그룹 — 모바일 hidden (.util-left) */}
          <span className="util-left">MyBDR 커뮤니티</span>
          <span className="sep util-left"/>
          <a href="#" className="util-left" onClick={(e)=>{e.preventDefault();setRoute('about');}}>소개</a>
          <span className="sep util-left"/>
          <a href="#" className="util-left" onClick={(e)=>{e.preventDefault();setRoute('pricing');}}>요금제</a>
          <span className="sep util-left"/>
          <a href="#" className="util-left" onClick={(e)=>{e.preventDefault();setRoute('help');}}>도움말</a>
          <span className="app-nav__utility-spacer"/>
          {/* 우측 그룹 — 모바일에서도 표시 (사용자 결정 §1-2) */}
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('profile');}}>계정</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('settings');}}>설정</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('login');}}>로그아웃</a>
        </div>
      </div>

      {/* main bar — 로고 + 9 탭 + 우측 컨트롤 */}
      <div className="app-nav__main">
        <a href="#" className="app-nav__logo" onClick={(e)=>{e.preventDefault();setRoute('home');}}>
          <img src="assets/bdr-logo.png" alt=""/>
          <span>MyBDR<span className="dot">.</span></span>
        </a>

        {/* 9 메인 탭 (lg+ 만 표시. 모바일은 햄버거로) */}
        <div className="app-nav__tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className="app-nav__tab"
              data-active={route === t.id || (route === 'post' && t.id === 'board')}
              onClick={() => go(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 우측 컨트롤 = 검색 + 쪽지 + 알림 + 다크 + 햄버거(모바일) — 5개 (Phase 19 추가: 쪽지·채팅) */}
        <div className="app-nav__right">
          {/* 다크모드 토글 — PC 듀얼 / 모바일 단일 (ThemeSwitch 내부 분기) */}
          <ThemeSwitch theme={theme} setTheme={setTheme}/>

          {/* 검색 — 아이콘만 (.app-nav__icon-btn, border/bg X) */}
          <button className="app-nav__icon-btn" title="검색" onClick={()=>setRoute('search')}>
            <Icon.search/>
          </button>

          {/* 쪽지 · 채팅 — 아이콘 + 빨간 점 뱃지 (Phase 19) */}
          <button className="app-nav__icon-btn" title="쪽지 · 채팅" onClick={()=>setRoute('messages')} style={{position:'relative'}}>
            <Icon.mail/>
            <span className="app-nav__notif-dot"/>
          </button>

          {/* 알림 — 아이콘 + 빨간 점 뱃지 */}
          <button className="app-nav__icon-btn" title="알림" onClick={()=>setRoute('notifications')} style={{position:'relative'}}>
            <Icon.bell/>
            <span className="app-nav__notif-dot"/>
          </button>

          {/* 햄버거 — 모바일 only */}
          <button className="app-nav__burger" aria-label="메뉴" onClick={()=>setDrawerOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 7h18M3 12h18M3 17h18"/>
            </svg>
          </button>

          {/* ❌ 절대 추가 금지 (사용자 결정 §1-3):
              - 더보기 dropdown trigger 버튼
              - 계정 아이콘 + 닉네임 버튼 (RDM rdm_captain 등) */}
        </div>
      </div>
      <div className="app-nav__bottom-line"/>

      {/* 모바일 drawer + 더보기 5그룹 패널 (생략 — 기존 BDR v2.2 의 drawer / moreGroups 코드 그대로 카피) */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={()=>setDrawerOpen(false)}/>
          <aside className="drawer" role="dialog" aria-modal="true">
            {/* drawer 안에 5그룹 (내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움) */}
            {/* 자세한 내용은 04-more-groups.md 참고 또는 BDR v2.2 components.jsx 의 drawer 부분 */}
          </aside>
        </>
      )}
    </nav>
  );
}
```

---

## 2. ThemeSwitch — PC 듀얼 / 모바일 단일 (사용자 결정 §1-6)

```jsx
function ThemeSwitch({ theme, setTheme }) {
  const isDark = theme === 'dark';
  return (
    <>
      {/* 데스크톱: 듀얼 라벨 토글 (md ≥ 768px) */}
      <div className="theme-switch theme-switch--desktop">
        <button
          className="theme-switch__option"
          data-active={!isDark}
          onClick={() => setTheme('light')}
        >
          ☀ 라이트
        </button>
        <button
          className="theme-switch__option"
          data-active={isDark}
          onClick={() => setTheme('dark')}
        >
          ☾ 다크
        </button>
      </div>

      {/* 모바일: 단일 아이콘 토글 (md < 768px) */}
      <button
        className="app-nav__icon-btn theme-switch--mobile"
        title={isDark ? '라이트 모드' : '다크 모드'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? '☀' : '☾'}
      </button>
    </>
  );
}
```

CSS:
```css
.theme-switch--desktop { display: flex; }
.theme-switch--mobile { display: none; }

@media (max-width: 768px) {
  .theme-switch--desktop { display: none; }
  .theme-switch--mobile { display: inline-flex; }
}
```

---

## 3. CSS 클래스 — `app-nav__icon-btn` (사용자 결정 §1-5)

```css
/* 검색 / 알림 / 모바일 다크 토글 — 아이콘만 (border/bg 박스 없음) */
.app-nav__icon-btn {
  background: transparent;
  border: 0;
  padding: 8px;
  border-radius: 4px;
  color: var(--ink-soft);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.app-nav__icon-btn:hover {
  background: var(--bg-alt);
  color: var(--ink);
}
.app-nav__icon-btn svg {
  width: 18px;
  height: 18px;
}

/* 알림 빨간 점 뱃지 */
.app-nav__notif-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

/* 모바일 — 좌측 utility 그룹만 hidden (사용자 결정 §1-2) */
@media (max-width: 768px) {
  .app-nav__utility-inner .util-left { display: none; }
}
```

---

## 4. 더보기 5그룹 IA (사용자 결정 §2)

```jsx
const moreGroups = [
  { title:'내 활동', items:[
    { id:'mygames',      label:'내 신청 내역', icon:'📋' },
    { id:'calendar',     label:'내 일정',      icon:'📅' },
    { id:'saved',        label:'보관함',       icon:'🔖' },
    { id:'messages',     label:'쪽지',         icon:'💬' },
    { id:'achievements', label:'업적·배지',    icon:'🎖' },
    { id:'stats',        label:'스탯 분석',    icon:'📈' },
    { id:'communityNew', label:'글 작성',      icon:'✍' },
  ]},
  { title:'경기·대회', items:[
    { id:'live',             label:'라이브 중계',   icon:'🔴' },
    { id:'gameNew',          label:'경기 등록',     icon:'➕' },
    { id:'scrim',            label:'스크림 매칭',   icon:'🆚' },
  ]},
  { title:'등록·예약', items:[
    { id:'courtBooking',    label:'코트 예약',     icon:'📍' },
    { id:'courtAdd',        label:'코트 제보',     icon:'📮' },
    { id:'teamCreate',      label:'팀 등록',       icon:'➕' },
    { id:'teamManage',      label:'팀 관리',       icon:'⚙' },
  ]},
  { title:'둘러보기', items:[
    { id:'searchResults', label:'검색 결과',     icon:'🔎' },
    { id:'refereeInfo',   label:'심판 센터 안내', icon:'🦓' },  // ⭐ refereeInfo (가짜링크 referee 대신)
    { id:'coaches',       label:'코치·트레이너', icon:'👔' },
    { id:'reviews',       label:'리뷰',          icon:'⭐' },
    { id:'awards',        label:'수상 아카이브', icon:'🏆' },
    { id:'gallery',       label:'갤러리',        icon:'🎞' },
    { id:'shop',          label:'샵',            icon:'🛒' },
  ]},
  { title:'계정·도움', items:[
    { id:'mypage',               label:'마이페이지',   icon:'🏠' },  // ⭐ Phase 13 신규
    { id:'editProfile',          label:'프로필 편집',  icon:'✏' },
    { id:'notificationSettings', label:'알림 설정',    icon:'🔔' },
    { id:'safety',               label:'안전·차단',    icon:'🛡' },
    { id:'passwordReset',        label:'비밀번호 찾기', icon:'🔑' },
    { id:'onboardingV2',         label:'가입 설정',    icon:'🎯' },
    { id:'about',                label:'소개',         icon:'ℹ' },
    { id:'pricing',              label:'요금제',       icon:'💎' },
    { id:'help',                 label:'도움말',       icon:'❓' },
  ]},
];
```

**❌ 절대 추가 금지** (사용자 결정 §2-2):
- `gameResult` (가짜링크 — 실제 라우트 없음)
- `gameReport` (가짜링크 — 종료된 경기 카드 CTA 정책으로 전환)
- `guestApps` (가짜링크 — DB 미존재)
- `referee` (사이트 `/referee` = 심판 플랫폼 점유 → `refereeInfo` 사용)

---

## 5. 위반 사례 (이미 발생) — 회귀 방지

### Case 1: BDR v2.2 시안 components.jsx (Phase 13 캡처)

```
❌ 위반: main bar 우측에 "더보기 ▼" dropdown trigger 버튼 + "RDM rdm_captain" 아바타 노출
✅ 정답: main bar 우측 = 검색/알림/다크/햄버거 4개만
```

### Case 2: 다크모드 모바일에서 듀얼 라벨

```
❌ 위반: 모바일 (≤768px) 에서 "☀ 라이트 ☾ 다크" 두 라벨 노출 (햄버거와 충돌)
✅ 정답: 모바일은 단일 아이콘 (☀ 또는 ☾) 만
```

### Case 3: 검색/알림에 border/bg 박스

```
❌ 위반: <button className="btn btn--sm">  (.btn--sm 의 border + 배경)
✅ 정답: <button className="app-nav__icon-btn">  (아이콘만)
```

→ 시안 작성 시 위 3 케이스 모두 자동 회귀 검수 (`06-self-checklist.md` §1).

---

## 6. 새 시안 작업 시 절차

```
1. components.jsx 안의 AppNav 함수를 위 §1 코드로 대체 (또는 그대로 카피)
2. ThemeSwitch 함수를 §2 코드로 대체
3. CSS 의 .app-nav__icon-btn 등 §3 클래스 보존 (없으면 추가)
4. moreGroups 배열을 §4 코드로 대체 (가짜링크 4건 자동 제거)
5. 새 시안 (마이페이지 등) 본문만 신규 디자인
6. 시안 완료 후 06-self-checklist.md §1 (AppNav 7 룰) 모두 ✅ 검수
```

---

## 7. 출처

- 사용자 결정: `01-user-design-decisions.md` §1
- 사이트 적용 코드: `src/components/bdr-v2/app-nav.tsx` (TypeScript, Next.js)
- 시안 베이스: `Dev/design/BDR v2.2/components.jsx` (위반 5건 수정 후 frozen)
