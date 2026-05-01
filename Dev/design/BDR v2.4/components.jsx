/* global React, BOARDS, POSTS, HOT_POSTS, LATEST_POSTS, HOME_STATS, TOURNAMENTS, TEAMS, POST_DETAIL, COMMENTS */

const { useState, useEffect, useMemo, useRef } = React;

// ============================================================
// Icons (inline SVG, minimal set)
// ============================================================
const Icon = {
  sun: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>,
  moon: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>,
  search: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>,
  bell: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  plus: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>,
  image: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" /><path d="m21 15-5-5L5 21" /></svg>,
  heart: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
  eye: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  msg: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
  // [Phase 19 추가] 쪽지·채팅 아이콘 (main bar 우측 검색~알림 사이) — uploads/03 §1 frozen 코드용
  mail: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  chevron: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6" /></svg>
};

// ============================================================
// Avatar — shows logo image if provided, else colored letter block
// ============================================================
function Avatar({ src, tag, name, color, ink = '#fff', size = 44, radius = 6, title }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={name || tag} title={title || name}
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', background: 'var(--bg-alt)', border: '1px solid var(--border)', flex: '0 0 auto' }}
      onError={() => setOk(false)} />);


  }
  return (
    <div style={{
      width: size, height: size, background: color || 'var(--ink-soft)', color: ink,
      display: 'grid', placeItems: 'center',
      fontFamily: 'var(--ff-mono)', fontWeight: 700,
      fontSize: size > 60 ? 16 : size > 40 ? 12 : 10,
      borderRadius: radius, flex: '0 0 auto', letterSpacing: '.04em'
    }} title={title || name}>
      {tag || (name ? name.slice(0, 2).toUpperCase() : '?')}
    </div>);

}

// ============================================================
// Poster — tournament poster image with fallback gradient
// ============================================================
function Poster({ src, title, edition, accent = '#E31B23', width = 'auto', height = 160, radius = 6 }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={title}
      style={{ width, height, borderRadius: radius, objectFit: 'cover', display: 'block', background: 'var(--bg-alt)' }}
      onError={() => setOk(false)} />);


  }
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: `linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 60%, #000) 100%)`,
      color: '#fff', padding: '18px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', inset: 0, opacity: .12, background: 'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)' }} />
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '.18em', opacity: .85, position: 'relative' }}>{edition}</div>
      <div style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.05, position: 'relative' }}>{title}</div>
    </div>);

}

// ============================================================
// Theme switch — uploads/03 §2 frozen 코드 (PC 듀얼 라벨 / 모바일 단일 아이콘)
// 이유(왜): viewport 분기로 햄버거 영역 압박 해소 (사용자 결정 §1-6)
// ============================================================
function ThemeSwitch({ theme, setTheme }) {
  const isDark = theme === 'dark';
  return (
    <>
      {/* 데스크톱: 듀얼 라벨 토글 (md ≥ 768px) */}
      <div className="theme-switch theme-switch--desktop" role="group" aria-label="theme">
        <button className="theme-switch__btn" data-active={!isDark} onClick={() => setTheme('light')}>
          <Icon.sun /> 라이트
        </button>
        <button className="theme-switch__btn" data-active={isDark} onClick={() => setTheme('dark')}>
          <Icon.moon /> 다크
        </button>
      </div>

      {/* 모바일: 단일 아이콘 토글 (md < 768px) — .app-nav__icon-btn 일관 */}
      <button
        className="app-nav__icon-btn theme-switch--mobile"
        title={isDark ? '라이트 모드' : '다크 모드'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
      >
        {isDark ? <Icon.sun /> : <Icon.moon />}
      </button>
    </>
  );
}

// ============================================================
// App nav (top bar) — utility + main
// ============================================================
// [재박제 R-A-1] AppNav frozen — uploads/03-appnav-frozen-component.md §1 코드 그대로 카피
// 이유(왜): 시안 회귀 차단 (moreOpen/dropdown trigger / RDM 아바타 / 더보기 ▼ / btn--sm 박스 모두 제거)
// 9 메인 탭(마지막 더보기 = drawer 트리거) + main bar 우측 5컨트롤 + util-left 클래스 분리
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
    { id: 'more',   label: '더보기' },  // ⭐ 9번째 탭 — 클릭 시 drawer 토글 (dropdown 패널 X)
  ];
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // 라우트 이동 + drawer 닫기 헬퍼. 'more' 만 drawer 열고 라우트 이동 X
  const go = (id) => {
    if (id === 'more') {
      setDrawerOpen(true);
      return;
    }
    setRoute(id);
    setDrawerOpen(false);
  };

  // drawer 안 5그룹 (uploads/03 §4) — 가짜링크 4건(gameResult/gameReport/guestApps/referee) 제거
  // refereeInfo / mypage 포함 (사용자 결정 §2)
  const moreGroups = [
    { title: '내 활동', items: [
      { id: 'mygames',      label: '내 신청 내역', icon: '📋' },
      { id: 'calendar',     label: '내 일정',      icon: '📅' },
      { id: 'saved',        label: '보관함',       icon: '🔖' },
      { id: 'messages',     label: '쪽지',         icon: '💬' },
      { id: 'achievements', label: '업적·배지',    icon: '🎖' },
      { id: 'stats',        label: '스탯 분석',    icon: '📈' },
      { id: 'communityNew', label: '글 작성',      icon: '✍' },
    ]},
    { title: '경기·대회', items: [
      { id: 'live',     label: '라이브 중계', icon: '🔴' },
      { id: 'gameNew',  label: '경기 등록',   icon: '➕' },
      { id: 'scrim',    label: '스크림 매칭', icon: '🆚' },
    ]},
    { title: '등록·예약', items: [
      { id: 'courtBooking', label: '코트 예약', icon: '📍' },
      { id: 'courtAdd',     label: '코트 제보', icon: '📮' },
      { id: 'teamCreate',   label: '팀 등록',   icon: '➕' },
      { id: 'teamManage',   label: '팀 관리',   icon: '⚙' },
    ]},
    { title: '둘러보기', items: [
      { id: 'searchResults', label: '검색 결과',     icon: '🔎' },
      { id: 'refereeInfo',   label: '심판 센터 안내', icon: '🦓' },  // referee 가짜링크 대체
      { id: 'coaches',       label: '코치·트레이너', icon: '👔' },
      { id: 'reviews',       label: '리뷰',          icon: '⭐' },
      { id: 'awards',        label: '수상 아카이브', icon: '🏆' },
      { id: 'gallery',       label: '갤러리',        icon: '🎞' },
      { id: 'shop',          label: '샵',            icon: '🛒' },
    ]},
    { title: '계정·도움', items: [
      { id: 'mypage',               label: '마이페이지',   icon: '🏠' },  // Phase 13 신규
      { id: 'editProfile',          label: '프로필 편집',  icon: '✏' },
      { id: 'notificationSettings', label: '알림 설정',    icon: '🔔' },
      { id: 'safety',               label: '안전·차단',    icon: '🛡' },
      { id: 'passwordReset',        label: '비밀번호 찾기', icon: '🔑' },
      { id: 'onboardingV2',         label: '가입 설정',    icon: '🎯' },
      { id: 'about',                label: '소개',         icon: 'ℹ' },
      { id: 'pricing',              label: '요금제',       icon: '💎' },
      { id: 'help',                 label: '도움말',       icon: '❓' },
    ]},
  ];

  return (
    <nav className="app-nav">
      {/* utility bar — 상단 파란 띠 */}
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          {/* 좌측 그룹 — 모바일 hidden (.util-left) */}
          <span className="util-left">MyBDR 커뮤니티</span>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => { e.preventDefault(); setRoute('about'); }}>소개</a>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => { e.preventDefault(); setRoute('pricing'); }}>요금제</a>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => { e.preventDefault(); setRoute('help'); }}>도움말</a>
          <span className="app-nav__utility-spacer" />
          {/* 우측 그룹 — 모바일에서도 표시 (사용자 결정 §1-2) */}
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute('profile'); }}>계정</a>
          <span className="sep" />
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute('settings'); }}>설정</a>
          <span className="sep" />
          <a href="#" onClick={(e) => { e.preventDefault(); setRoute('login'); }}>로그아웃</a>
        </div>
      </div>

      {/* main bar — 로고 + 9 탭 + 우측 컨트롤 */}
      <div className="app-nav__main">
        <a href="#" className="app-nav__logo" onClick={(e) => { e.preventDefault(); setRoute('home'); }}>
          <img src="assets/bdr-logo.png" alt="" />
          <span>MyBDR<span className="dot">.</span></span>
        </a>

        {/* 9 메인 탭 (lg+ 만 표시. 모바일은 햄버거로) */}
        <div className="app-nav__tabs">
          {tabs.map((t) => (
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

        {/* 우측 컨트롤 = 다크 + 검색 + 쪽지 + 알림 + 햄버거(모바일) — 5개 (Phase 19 추가: 쪽지·채팅) */}
        <div className="app-nav__right">
          {/* 다크모드 토글 — PC 듀얼 / 모바일 단일 (ThemeSwitch 내부 분기) */}
          <ThemeSwitch theme={theme} setTheme={setTheme} />

          {/* 검색 — 아이콘만 (.app-nav__icon-btn, border/bg X) */}
          <button className="app-nav__icon-btn" title="검색" onClick={() => setRoute('search')}>
            <Icon.search />
          </button>

          {/* 쪽지 · 채팅 — 아이콘 + 빨간 점 뱃지 (Phase 19) */}
          <button className="app-nav__icon-btn" title="쪽지 · 채팅" onClick={() => setRoute('messages')} style={{ position: 'relative' }}>
            <Icon.mail />
            <span className="app-nav__notif-dot" />
          </button>

          {/* 알림 — 아이콘 + 빨간 점 뱃지 */}
          <button className="app-nav__icon-btn" title="알림" onClick={() => setRoute('notifications')} style={{ position: 'relative' }}>
            <Icon.bell />
            <span className="app-nav__notif-dot" />
          </button>

          {/* 햄버거 — 모바일 only */}
          <button className="app-nav__burger" aria-label="메뉴" onClick={() => setDrawerOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <path d="M3 7h18M3 12h18M3 17h18" />
            </svg>
          </button>

          {/* ❌ 절대 추가 금지 (사용자 결정 §1-3):
              - 더보기 dropdown trigger 버튼
              - 계정 아이콘 + 닉네임 버튼 (RDM rdm_captain 등) */}
        </div>
      </div>
      <div className="app-nav__bottom-line" />

      {/* 모바일 drawer + 더보기 5그룹 패널 — 9번째 탭 'more' 또는 햄버거 클릭 시 표시 */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="drawer__head">
              <div className="drawer__head-title">MyBDR<span className="dot">.</span></div>
              <button className="drawer__close" onClick={() => setDrawerOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="drawer__body">
              {/* 9 메인 탭 (모바일용 stack) */}
              {tabs.filter((t) => t.id !== 'more').map((t) => (
                <button
                  key={t.id}
                  className="drawer__item"
                  data-active={route === t.id || (route === 'post' && t.id === 'board')}
                  onClick={() => go(t.id)}
                >
                  <span>{t.label}</span>
                  <Icon.chevron />
                </button>
              ))}
              <div className="drawer__divider" />
              {/* 더보기 5그룹 — 9번째 탭 'more' 클릭의 본질 */}
              {moreGroups.map((g) => (
                <div key={g.title} style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--ink-mute)', textTransform: 'uppercase', padding: '8px 12px 4px' }}>{g.title}</div>
                  {g.items.map((m) => (
                    <button
                      key={m.id + g.title}
                      className="drawer__item"
                      data-active={route === m.id}
                      onClick={() => go(m.id)}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ width: 18, textAlign: 'center', fontSize: 13 }} aria-hidden>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                      <Icon.chevron />
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="drawer__foot">
              <ThemeSwitch theme={theme} setTheme={setTheme} />
            </div>
          </aside>
        </>
      )}
    </nav>
  );
}

// ============================================================
// Onboarding modal — first-visit theme picker
// ============================================================
function Onboarding({ onPick, onSkip }) {
  const [sel, setSel] = useState('light');
  return (
    <div className="onb-backdrop" role="dialog" aria-modal="true">
      <div className="onb">
        <div className="onb__head">
          <h2>어서오세요, MyBDR 입니다</h2>
          <p>다음카페에서 이관하신 분들을 위해 익숙한 <b>라이트 모드</b>와, 새로운 감성의 <b>다크 모드</b> 두 가지를 준비했어요. 지금 바로 골라보세요 — 언제든 상단에서 바꿀 수 있습니다.</p>
        </div>
        <div className="onb__body">
          <button className="onb__card" data-sel={sel === 'light'} onClick={() => setSel('light')}>
            <div className="onb__preview light" />
            <div className="onb__tag">추천 · 기존 다음카페 분위기</div>
            <h3>라이트 모드</h3>
            <p>파란 헤더 · 깔끔한 게시판 · 익숙한 정보 구조. 이관하신 분들이 편하게 적응할 수 있어요.</p>
          </button>
          <button className="onb__card" data-sel={sel === 'dark'} onClick={() => setSel('dark')}>
            <div className="onb__preview dark" />
            <div className="onb__tag">새로운 감성</div>
            <h3>다크 모드</h3>
            <p>스포츠 포스터 톤 · 큰 타이포 · 레드 포인트. BDR의 새 브랜드 감성을 경험해보세요.</p>
          </button>
        </div>
        <div className="onb__foot">
          <button className="skip" onClick={onSkip}>나중에 선택하기</button>
          <button className="btn btn--primary btn--lg" onClick={() => onPick(sel)}>이 모드로 시작하기</button>
        </div>
      </div>
    </div>);

}

// ============================================================
// Level badge helper
// ============================================================
function LevelBadge({ level }) {
  if (level === 'ADMIN') return <span className="badge badge--red">운영</span>;
  if (level === 'COACH') return <span className="badge badge--blue">코치</span>;
  if (level === 'PRESS') return <span className="badge badge--blue">기자</span>;
  return <span className="badge badge--ghost" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}>{level}</span>;
}

// ============================================================
// Pagination
// ============================================================
function Pager({ current = 1, total = 8, onGo = () => {} }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="pager">
      <button className="pager__btn" onClick={() => onGo(Math.max(1, current - 1))}>‹</button>
      {pages.map((p) =>
      <button key={p} className="pager__btn" data-active={p === current} onClick={() => onGo(p)}>{p}</button>
      )}
      <button className="pager__btn" onClick={() => onGo(Math.min(total, current + 1))}>›</button>
    </div>);

}

// ============================================================
// Sidebar (board list)
// ============================================================
function Sidebar({ active, setActive, setRoute }) {
  const groups = [
  { title: '메인', items: BOARDS.filter((b) => b.category === 'main') },
  { title: '플레이', items: BOARDS.filter((b) => b.category === 'play') },
  { title: '이야기', items: BOARDS.filter((b) => b.category === 'chat') }];

  return (
    <aside className="aside">
      <div className="aside__group">
        <button className="btn btn--primary" style={{ width: '100%' }} onClick={() => setRoute('write')}>
          <Icon.plus /> 글쓰기
        </button>
      </div>
      <div className="aside__divider" />
      {groups.map((g) =>
      <div key={g.title} className="aside__group">
          <div className="aside__title">{g.title}</div>
          {g.items.map((b) =>
        <a key={b.id} className="aside__link" data-active={active === b.id} onClick={(e) => {e.preventDefault();setActive(b.id);setRoute('board');}}>
              <span>{b.name} {b.new && <span className="badge badge--new">N</span>}</span>
              <span className="count">{b.count.toLocaleString()}</span>
            </a>
        )}
        </div>
      )}
    </aside>);

}

Object.assign(window, { Icon, ThemeSwitch, AppNav, Onboarding, LevelBadge, Pager, Sidebar, Avatar, Poster });