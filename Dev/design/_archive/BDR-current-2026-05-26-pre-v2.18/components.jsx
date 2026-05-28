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
  mail: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>,
  chevron: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6" /></svg>,
  filter: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M6 12h12M10 18h4" /></svg>,
  list: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  calendar: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  week: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 11h18M9 6v14M15 6v14" /></svg>
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
// NavBadge — 4 variants (dot / count / new / live)
// 03 §7 Phase 19 frozen — drawer 게이트웨이 R3 강조 등에 사용
// ============================================================
function NavBadge({ variant = 'dot', count, inline = false, style }) {
  // 03 §7 + 운영 nav-badge.tsx 정합 (Phase A.5)
  // inline=false (default): position:absolute (아이콘 버튼 위에 겹침)
  // inline=true: position:static + margin-left (텍스트 옆에 inline)
  const cls = `nav-badge nav-badge--${variant}` + (inline ? ' nav-badge--inline' : '');
  if (variant === 'dot') {
    return <span className={cls} style={style} aria-hidden="true" />;
  }
  if (variant === 'count') {
    const n = typeof count === 'number' ? count : 0;
    if (n <= 0) return null;
    return <span className={cls} style={style} aria-label={`알림 ${n > 99 ? '99+' : n}건`}>{n > 99 ? '99+' : n}</span>;
  }
  if (variant === 'new') {
    return <span className={cls} style={style} aria-label="새 항목">N</span>;
  }
  if (variant === 'live') {
    return <span className={cls} style={style} aria-label="실시간">LIVE</span>;
  }
  return null;
}

// ============================================================
// Theme switch — PC 듀얼 라벨 / 모바일 단일 아이콘 (03 §2 frozen)
// ============================================================
function ThemeSwitch({ theme, setTheme }) {
  const isDark = theme === 'dark';
  return (
    <React.Fragment>
      <div className="theme-switch theme-switch--desktop" role="group" aria-label="theme">
        <button className="theme-switch__btn" data-active={!isDark} onClick={() => setTheme('light')}>
          <Icon.sun /> 라이트
        </button>
        <button className="theme-switch__btn" data-active={isDark} onClick={() => setTheme('dark')}>
          <Icon.moon /> 다크
        </button>
      </div>
      <button
        className="app-nav__icon-btn theme-switch--mobile"
        title={isDark ? '라이트 모드' : '다크 모드'}
        aria-label={isDark ? '라이트 모드' : '다크 모드'}
        onClick={() => setTheme(isDark ? 'light' : 'dark')}>
        {isDark ? <Icon.sun /> : <Icon.moon />}
      </button>
    </React.Fragment>);

}

// ============================================================
// App nav (top bar) — utility + main
// ============================================================
function AppNav({ route, setRoute, theme, setTheme }) {
  const tabs = [
  { id: 'home', label: '홈' },
  { id: 'games', label: '경기' },
  { id: 'match', label: '대회' },
  { id: 'orgs', label: '단체' },
  { id: 'team', label: '팀' },
  { id: 'court', label: '코트' },
  { id: 'rank', label: '랭킹' },
  { id: 'board', label: '커뮤니티' },
  { id: 'more', label: '더보기' }];


  // 햄버거 NavBadge dot — drawer 게이트웨이 R3 강조 (newGameCount + newCommunityCount + unreadCount > 0 시)
  const newGameCount = 2;
  const newCommunityCount = 3;
  const unreadCount = 4;
  const burgerBadge = newGameCount + newCommunityCount + unreadCount > 0;

  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => {document.body.style.overflow = '';};
  }, [drawerOpen]);
  const go = (id) => {
    if (id === 'more') {setDrawerOpen(true);return;}
    setRoute(id);setDrawerOpen(false);
  };
  const moreGroups = [
  { title: '내 활동', items: [
    { id: 'mygames', label: '내 신청 내역', icon: '📋' },
    // [v2.2 삭제] guestApps: DB 미존재 가짜링크 (user-design-decisions §2-2)
    { id: 'calendar', label: '내 일정', icon: '📅' },
    { id: 'saved', label: '보관함', icon: '🔖' },
    { id: 'messages', label: '쪽지', icon: '💬', count: 4 },
    { id: 'achievements', label: '업적·배지', icon: '🎖', isNew: true },
    { id: 'stats', label: '스탯 분석', icon: '📈' }]
  },
  { title: '경기·대회', items: [
    { id: 'live', label: '라이브 중계', icon: '🔴', isNew: true },
    { id: 'bracket', label: '대진표', icon: '🏆' },
    // [v2.2 삭제] gameResult / gameReport: 가짜링크 (user-design-decisions §2-2)
    // 경기 결과/신고·평가는 종료된 경기 카드의 CTA 정책으로 전환됨
    { id: 'scrim', label: '스크림 매칭', icon: '🆚' },
    { id: 'tournamentEnroll', label: '대회 접수', icon: '📝' },
    { id: 'guestApply', label: '게스트 지원 신청', icon: '🙋' }]
  },
  { title: '등록·예약', items: [
    { id: 'courtBooking', label: '코트 예약', icon: '📍' },
    { id: 'courtAdd', label: '코트 제보', icon: '📮' },
    { id: 'teamCreate', label: '팀 등록', icon: '➕' },
    { id: 'teamManage', label: '팀 관리', icon: '⚙' },
    { id: 'refereeRequest', label: '심판 배정 요청', icon: '📣' }]
  },
  { title: '둘러보기', items: [
    { id: 'searchResults', label: '검색 결과', icon: '🔎' },
    // [v2.2 수정] referee → refereeInfo: 욵션B SEO 안내 페이지로 행선 (사이트의 /referee 심판 플랫폼과 분리)
    { id: 'refereeInfo', label: '심판 센터 안내', icon: '🦓' },
    { id: 'coaches', label: '코치·트레이너', icon: '👔' },
    { id: 'reviews', label: '리뷰', icon: '⭐' },
    { id: 'awards', label: '수상 아카이브', icon: '🏆' },
    { id: 'gallery', label: '갤러리', icon: '🎞' },
    { id: 'shop', label: '샵', icon: '🛒' }]
  },
  { title: '계정·도움', items: [
    { id: 'mypage', label: '마이페이지', icon: '🏠' },
    { id: 'editProfile', label: '프로필 편집', icon: '✏' },
    { id: 'notificationSettings', label: '알림 설정', icon: '🔔' },
    { id: 'safety', label: '안전·차단', icon: '🛡' },
    { id: 'passwordReset', label: '비밀번호 찾기', icon: '🔑' },
    { id: 'onboardingV2', label: '가입 설정', icon: '🎯' },
    { id: 'about', label: '소개', icon: 'ℹ' },
    { id: 'pricing', label: '요금제', icon: '💎' },
    { id: 'help', label: '도움말', icon: '❓' }]
  }];

  return (
    <nav className="app-nav">
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          {/* utility 좌측 — BDR 로고 이미지 (Phase 19 frozen, height 18px) */}
          <a href="#" className="app-nav__utility-logo util-left" onClick={(e) => {e.preventDefault();setRoute('home');}} aria-label="MyBDR 홈">
            <svg width="60" height="18" viewBox="0 0 100 30" aria-hidden="true">
              <text x="0" y="23" fontFamily="var(--ff-display)" fontSize="24" fontWeight="900" fill="#fff" letterSpacing="-0.5">BDR<tspan fill="var(--bdr-red)">.</tspan></text>
            </svg>
          </a>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => {e.preventDefault();setRoute('about');}}>소개</a>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => {e.preventDefault();setRoute('pricing');}}>요금제</a>
          <span className="sep util-left" />
          <a href="#" className="util-left" onClick={(e) => {e.preventDefault();setRoute('help');}}>도움말</a>
          <span className="app-nav__utility-spacer" />
          {/* utility 우측 — 보존 (시안 패턴, 회귀 가드) */}
          <a href="#" onClick={(e) => {e.preventDefault();setRoute('mypage');}}>rdm_captain</a>
          <span className="sep" />
          <a href="#" onClick={(e) => {e.preventDefault();setRoute('mypage');}}>마이페이지</a>
          <span className="sep" />
          <a href="#" onClick={(e) => {e.preventDefault();setRoute('settings');}}>설정</a>
          <span className="sep" />
          <a href="#" onClick={(e) => {e.preventDefault();setRoute('login');}}>로그아웃</a>
        </div>
      </div>
      <div className="app-nav__main">
        {/* 메인 로고 — 텍스트만 (img 제거, Phase 19 frozen) */}
        <a href="#" className="app-nav__logo" onClick={(e) => {e.preventDefault();setRoute('home');}}>
          <span>MyBDR<span className="dot">.</span></span>
        </a>
        <div className="app-nav__tabs">
          {tabs.map((t) =>
          <button key={t.id} className="app-nav__tab" data-active={route === t.id || route === 'post' && t.id === 'board'} onClick={() => go(t.id)}>
              {t.label}
            </button>
          )}
        </div>
        {/* 우측 컨트롤 — 다크/검색/쪽지/알림/햄버거 5개만 (Phase 19 frozen) */}
        <div className="app-nav__right">
          <ThemeSwitch theme={theme} setTheme={setTheme} />
          <button className="app-nav__icon-btn" title="검색" aria-label="검색" onClick={() => setRoute('search')}>
            <Icon.search />
          </button>
          <button className="app-nav__icon-btn" title="쪽지 · 채팅" aria-label="쪽지" onClick={() => setRoute('messages')} style={{ position: 'relative' }}>
            <Icon.mail />
            <span className="app-nav__notif-dot" />
          </button>
          <button className="app-nav__icon-btn" title="알림" aria-label="알림" onClick={() => setRoute('notifications')} style={{ position: 'relative' }}>
            <Icon.bell />
            <span className="app-nav__notif-dot" />
          </button>
          <button className="app-nav__burger" aria-label="메뉴" onClick={() => setDrawerOpen(true)} style={{ position: 'relative' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7h18M3 12h18M3 17h18" /></svg>
            {burgerBadge && <NavBadge variant="dot" />}
          </button>
        </div>
      </div>
      <div className="app-nav__bottom-line" />

      {drawerOpen &&
      <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer" role="dialog" aria-modal="true">
            <div className="drawer__head">
              <div className="drawer__head-title">MyBDR<span className="dot">.</span></div>
              <button className="drawer__close" onClick={() => setDrawerOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="drawer__body">
              {/* 9 메인 탭 */}
              {tabs.filter((t) => t.id !== 'more').map((t) =>
            <button key={t.id} className="drawer__item" data-active={route === t.id || route === 'post' && t.id === 'board'} onClick={() => go(t.id)}>
                  <span className="drawer__item-label">{t.label}</span>
                  <Icon.chevron />
                </button>
            )}
              <div className="drawer__divider" />
              {/* 더보기 5그룹 패널 (Phase A.5 §11 — 그룹 박스 명확 구분) */}
              {moreGroups.map((g) =>
            <div key={g.title} className="drawer__group">
                  <div className="drawer__group-title">{g.title}</div>
                  {g.items.map((it) =>
              <button key={it.id} className="drawer__item" onClick={() => {setRoute(it.id);setDrawerOpen(false);}}>
                      <span className="drawer__item-label">
                        <span className="drawer__item-icon" aria-hidden="true">{it.icon}</span>
                        <span>{it.label}</span>
                        {it.isNew && <NavBadge variant="new" inline />}
                        {typeof it.count === 'number' && it.count > 0 && <NavBadge variant="count" count={it.count} inline />}
                      </span>
                      <Icon.chevron />
                    </button>
              )}
                </div>
            )}
            </div>
            <div className="drawer__foot">
              <ThemeSwitch theme={theme} setTheme={setTheme} />
              <div style={{ fontSize: 11, color: 'var(--ink-dim)', textAlign: 'center' }}>rdm_captain · <a href="#" onClick={(e) => {e.preventDefault();setRoute('login');setDrawerOpen(false);}} style={{ color: 'var(--ink-mute)' }}>로그아웃</a></div>
            </div>
          </aside>
        </>
      }
    </nav>);

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

// ============================================================
// MemberPendingBadge — 4 종 신청 상태 칩 (Phase A.5, 운영 라벨 표준)
// jersey_change / dormant / withdraw / transfer
// 운영 패턴: <span className="badge badge--soft">{label}</span>
// ============================================================
function MemberPendingBadge({ kind, newJersey, toTeamName, anchor = false, style }) {
  let label = '';
  if (kind === 'jersey_change') {
    label = newJersey != null ? `#${newJersey}번 변경 신청 중` : '번호 변경 신청 중';
  } else if (kind === 'dormant') {
    label = '휴면 신청 중';
  } else if (kind === 'withdraw') {
    label = '탈퇴 신청 중';
  } else if (kind === 'transfer') {
    label = toTeamName ? `→ ${toTeamName} 이적 신청 중` : '이적 신청 중';
  } else {
    return null;
  }
  const cls = anchor ? 'member-pending-anchor' : '';
  return <span className={cls} style={style}><span className="badge badge--soft">{label}</span></span>;
}

// ============================================================
// PasswordInput — 통합 컴포넌트 (Phase A.5, 운영 password-input.tsx 정합)
// Material Symbols Outlined visibility / visibility_off
// fontSize 20 / aria-label / tabIndex=-1 / paddingRight 44 / iOS 16px input
// ============================================================
function PasswordInput({ value, defaultValue, onChange, autoComplete = 'current-password', placeholder, id, name, required, style }) {
  const [show, setShow] = useState(false);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? '');
  const v = isControlled ? value : internal;
  const handleChange = (e) => {
    if (!isControlled) setInternal(e.target.value);
    onChange && onChange(e);
  };
  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type={show ? 'text' : 'password'}
        value={v}
        onChange={handleChange}
        autoComplete={autoComplete}
        placeholder={placeholder}
        id={id}
        name={name}
        required={required}
        className="input"
        style={{ paddingRight: 44, fontSize: 16 }} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          background: 'transparent', border: 0, color: 'var(--ink-mute)',
          cursor: 'pointer', padding: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
        }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
          {show ? 'visibility_off' : 'visibility'}
        </span>
      </button>
    </div>);
}

// ============================================================
// Modal — 표준 모달 셰 (Phase A.5, 5 모달 background 일원화)
// background = var(--bg-card) / max-width 460 / mobile padding 14
// ============================================================
function Modal({ open, onClose, title, children, foot }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose && onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">{title}</div>
          <button className="modal__close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal__body">{children}</div>
        {foot && <div className="modal__foot">{foot}</div>}
      </div>
    </div>);
}

// ============================================================
// ForceActionModal — jersey / withdraw 두 모드 (Phase A.5, 운영 1단계 패턴)
// jersey 모드: 등번호 input (0~99 정수, 빈값=미배정 null) + 사유 textarea (선택)
// withdraw 모드: 사유 textarea (필수, 1자+) — busy 처리 중 닫기 방지
// ============================================================
function ForceActionModal({ open, onClose, mode, memberName, onSubmit }) {
  const [jersey, setJersey] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setJersey(''); setReason(''); setBusy(false); } }, [open]);
  if (!open) return null;
  const isJersey = mode === 'jersey';
  const canSubmit = isJersey ? true : reason.trim().length > 0;
  const handleClose = () => { if (busy) return; onClose && onClose(); };
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    const payload = isJersey
      ? { jersey: jersey === '' ? null : Number(jersey), reason: reason.trim() || null }
      : { reason: reason.trim() };
    try { await (onSubmit && onSubmit(payload)); onClose && onClose(); }
    catch (e) { setBusy(false); }
  };
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isJersey ? `등 번호 강제 변경 · ${memberName || ''}` : `회원 강제 탈퇴 · ${memberName || ''}`}
      foot={
        <>
          <button className="btn" onClick={handleClose} disabled={busy}>취소</button>
          <button
            className={isJersey ? 'btn btn--primary' : 'btn btn--accent'}
            onClick={handleSubmit}
            disabled={!canSubmit || busy}>
            {busy ? '처리 중…' : isJersey ? '변경 실행' : '강제 탈퇴 실행'}
          </button>
        </>
      }>
      {isJersey ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>새 등번호 (0~99, 비우면 미배정)</label>
          <input
            type="number" min="0" max="99" step="1"
            className="input"
            value={jersey}
            onChange={(e) => setJersey(e.target.value)}
            placeholder="예: 23"
            style={{ fontSize: 16 }} />
          <label style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600, marginTop: 4 }}>사유 (선택)</label>
          <textarea
            className="input"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="운영 로그에 기록됩니다"
            style={{ resize: 'vertical', fontSize: 16 }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 4, fontSize: 13, color: 'var(--ink)' }}>
            강제 탈퇴는 되돌릴 수 없습니다. 사유는 운영 로그에 기록됩니다.
          </div>
          <label style={{ fontSize: 12, color: 'var(--ink-mute)', fontWeight: 600 }}>사유 (필수)</label>
          <textarea
            className="input"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="탈퇴 사유를 입력하세요"
            required
            style={{ resize: 'vertical', fontSize: 16 }} />
        </div>
      )}
    </Modal>);
}

// ============================================================
// WizardShell — 마법사 외곽 wrapper (좌 240 sticky aside + 우 main)
//   진입: TournamentAdminWizard / AssociationWizard / EditionWizard(예정)
//   복귀: setRoute('home') 또는 외부 callback
//   에러: ErrorBoundary 자체 핸들 X (caller 가 EmptyState 카드로 처리)
// 모바일 (≤720px): aside 가로 stepper / main 1열 stack
// ============================================================
function WizardShell({ title, subtitle, eyebrow, stepper, footer, children, onBack, shellMode = 'page', backLabel = '뒤로' }) {
  const wrapperClass = shellMode === 'admin' ? 'wizard-shell-wrap--admin' : 'page';
  // admin 모드 = AdminShell.main__inner 가 외부 padding 제공하므로 wizard 자체 padding 최소화
  const wrapperStyle = shellMode === 'admin' ? { padding: 0, maxWidth: 'none', margin: 0 } : { maxWidth: 1080 };
  const isAdmin = shellMode === 'admin';
  return (
    <div className={wrapperClass} style={wrapperStyle}>
      {!isAdmin && (
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'transparent', border: 0, color: 'var(--ink-mute)', cursor: 'pointer', padding: 0, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_back</span> {backLabel}
            </button>
          )}
          {onBack && <span style={{ opacity: 0.4 }}>·</span>}
          <span>대회 관리자</span>
          <span style={{ opacity: 0.4 }}>›</span>
          <span style={{ color: 'var(--ink)' }}>{eyebrow || '마법사'}</span>
        </div>
      )}

      <div className="eyebrow">{eyebrow || 'WIZARD'}</div>
      <h1 style={{ margin: '8px 0 6px', fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em' }}>{title}</h1>
      {subtitle && <p style={{ color: 'var(--ink-mute)', fontSize: 14, marginBottom: 24, lineHeight: 1.6, maxWidth: 720 }}>{subtitle}</p>}

      <div className="wizard-shell">
        <aside className="wizard-shell__aside">{stepper}</aside>
        <main className="wizard-shell__main">
          {children}
          {footer && <div className="wizard-shell__footer">{footer}</div>}
        </main>
      </div>
    </div>);

}

// ============================================================
// WizardStepper — 단계 표시
// step 상태: 완료 (var(--ok) ✓) / 현재 (accent) / 미진행 (--ink-mute + --bg-alt)
// 동그라미는 02 §4-1 명확화 — 정사각형 50% 만 예외 허용
// 데스크톱 세로 / 모바일 가로 (스크롤)
// ============================================================
function WizardStepper({ steps, currentStep, completedSteps, onJump }) {
  const isDone = (i) => completedSteps.includes(i);
  const isCurrent = (i) => i === currentStep;
  const canJump = (i) => isDone(i) || i === currentStep || i < currentStep;
  return (
    <ol className="wizard-stepper">
      {steps.map((s, i) =>
      <li key={i}
      className="wizard-stepper__item"
      data-status={isCurrent(i) ? 'current' : isDone(i) ? 'done' : 'todo'}
      data-jumpable={canJump(i) ? 'true' : 'false'}>

          <button
          type="button"
          className="wizard-stepper__btn"
          onClick={() => canJump(i) && onJump?.(i)}
          disabled={!canJump(i)}>

            <span className="wizard-stepper__dot" aria-hidden="true">
              {isDone(i) ?
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> :

            <span>{i + 1}</span>
            }
            </span>
            <span className="wizard-stepper__label">
              <span className="wizard-stepper__title">{s.title}</span>
              {s.hint && <span className="wizard-stepper__hint">{s.hint}</span>}
            </span>
          </button>
        </li>
      )}
    </ol>);

}

// ============================================================
// WizardCard — step 내부 카드 (입력 그룹 단위)
//   radius 8px / bg var(--bg-card) / border var(--border)
//   상단 eyebrow + h3 + 본문 / 우상단 보조 액션
// ============================================================
function WizardCard({ eyebrow, title, hint, action, children, accent }) {
  return (
    <section className="wizard-card" data-accent={accent ? 'true' : 'false'}>
      <header className="wizard-card__head">
        <div style={{ minWidth: 0 }}>
          {eyebrow && <div className="wizard-card__eyebrow">{eyebrow}</div>}
          {title && <h3 className="wizard-card__title">{title}</h3>}
          {hint && <p className="wizard-card__hint">{hint}</p>}
        </div>
        {action && <div className="wizard-card__action">{action}</div>}
      </header>
      <div className="wizard-card__body">{children}</div>
    </section>);

}

// ============================================================
// WizardFooter — 하단 navigation
//   좌측: 이전 / 중앙: 임시저장(텍스트 링크) / 우측: 다음 / 마지막 = primary 생성
// ============================================================
function WizardFooter({ onPrev, onNext, onDraft, nextLabel, nextDisabled, isLast, prevDisabled }) {
  return (
    <div className="wizard-footer">
      <button
        type="button"
        className="btn"
        onClick={onPrev}
        disabled={prevDisabled}
        style={{ visibility: prevDisabled ? 'hidden' : 'visible' }}>

        <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 2 }}>arrow_back</span>
        이전
      </button>
      <button type="button" className="wizard-footer__draft" onClick={onDraft}>임시저장</button>
      <button
        type="button"
        className={isLast ? "btn btn--accent btn--lg" : "btn btn--primary"}
        onClick={onNext}
        disabled={nextDisabled}>

        {nextLabel || '다음'}
        {!isLast &&
        <span className="material-symbols-outlined" style={{ fontSize: 16, marginLeft: 2 }}>arrow_forward</span>
        }
      </button>
    </div>);

}

Object.assign(window, { Icon, ThemeSwitch, AppNav, NavBadge, MemberPendingBadge, PasswordInput, Modal, ForceActionModal, Onboarding, LevelBadge, Pager, Sidebar, Avatar, Poster, WizardShell, WizardStepper, WizardCard, WizardFooter });