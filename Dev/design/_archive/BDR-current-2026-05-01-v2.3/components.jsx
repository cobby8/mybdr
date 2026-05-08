/* global React, BOARDS, POSTS, HOT_POSTS, LATEST_POSTS, HOME_STATS, TOURNAMENTS, TEAMS, POST_DETAIL, COMMENTS */

const { useState, useEffect, useMemo, useRef } = React;

// ============================================================
// Icons (inline SVG, minimal set)
// ============================================================
const Icon = {
  sun:  (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4 12H2M22 12h-2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  search: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  bell: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>,
  plus: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  filter: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M6 12h12M10 18h4"/></svg>,
  image: (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path d="m21 15-5-5L5 21"/></svg>,
  heart: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  eye:   (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  msg:   (p) => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  mail:  (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 9h8M8 13h5"/></svg>,
  chevron:(p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m9 18 6-6-6-6"/></svg>,
  /* Bottom-nav glyphs (22px viewBox 24) */
  navHome: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>,
  navGames: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5 5l14 14M19 5 5 19"/></svg>,
  navTrophy: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4a3 3 0 0 0 3 3M17 6h3a3 3 0 0 1-3 3"/><path d="M10 14h4l-1 4h-2z"/><path d="M8 21h8"/></svg>,
  navOrg: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5M14 20c0-2 2-4 4.5-4S22 18 22 20"/></svg>,
  navTeam: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 4v6c0 4-3 7-8 8-5-1-8-4-8-8V7z"/></svg>,
  navCourt: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="6" width="18" height="12" rx="1"/><path d="M12 6v12M3 12h3a3 3 0 0 0 0-6M21 12h-3a3 3 0 0 1 0-6M3 12h3a3 3 0 0 1 0 6M21 12h-3a3 3 0 0 0 0 6"/></svg>,
  navRank: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="4" y="13" width="4" height="8"/><rect x="10" y="9" width="4" height="12"/><rect x="16" y="5" width="4" height="16"/></svg>,
  navCommunity: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12z"/></svg>,
  navUser: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,
  navCalendar: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  navBookmark: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 3h12v18l-6-4-6 4z"/></svg>,
  navMessage: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  navWhistle: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="10" cy="14" r="6"/><path d="M16 14h6V9h-6M14 8 11 4M19 6V3"/></svg>,
  navCard: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>,
  navUp: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 14 6-6 6 6"/></svg>,
  navDown: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m6 10 6 6 6-6"/></svg>,
  navX: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
};

// ============================================================
// Avatar — shows logo image if provided, else colored letter block
// ============================================================
function Avatar({ src, tag, name, color, ink = '#fff', size = 44, radius = 6, title }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={name || tag} title={title || name}
        style={{ width:size, height:size, borderRadius:radius, objectFit:'cover', background:'var(--bg-alt)', border:'1px solid var(--border)', flex:'0 0 auto' }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div style={{
      width:size, height:size, background:color || 'var(--ink-soft)', color:ink,
      display:'grid', placeItems:'center',
      fontFamily:'var(--ff-mono)', fontWeight:700,
      fontSize: size > 60 ? 16 : size > 40 ? 12 : 10,
      borderRadius:radius, flex:'0 0 auto', letterSpacing:'.04em',
    }} title={title || name}>
      {tag || (name ? name.slice(0,2).toUpperCase() : '?')}
    </div>
  );
}

// ============================================================
// Poster — tournament poster image with fallback gradient
// ============================================================
function Poster({ src, title, edition, accent = '#E31B23', width = 'auto', height = 160, radius = 6 }) {
  const [ok, setOk] = useState(!!src);
  if (src && ok) {
    return (
      <img src={src} alt={title}
        style={{ width, height, borderRadius:radius, objectFit:'cover', display:'block', background:'var(--bg-alt)' }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <div style={{
      width, height, borderRadius:radius,
      background:`linear-gradient(135deg, ${accent} 0%, color-mix(in oklab, ${accent} 60%, #000) 100%)`,
      color:'#fff', padding:'18px 18px', display:'flex', flexDirection:'column', justifyContent:'space-between',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute', inset:0, opacity:.12, background:'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)'}}/>
      <div style={{fontSize:10, fontWeight:800, letterSpacing:'.18em', opacity:.85, position:'relative'}}>{edition}</div>
      <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.05, position:'relative'}}>{title}</div>
    </div>
  );
}

// ============================================================
// Theme switch
// ============================================================
// ThemeSwitch — frozen 룰 §4: PC(≥768px) 듀얼 라벨 / 모바일 단일 아이콘
// ============================================================
function ThemeSwitch({ theme, setTheme }) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else mq.addListener(onChange);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', onChange);
      else mq.removeListener(onChange);
    };
  }, []);
  if (isMobile) {
    // 모바일: 단일 아이콘 토글 (☀/☾)
    const next = theme === 'dark' ? 'light' : 'dark';
    return (
      <button
        className="app-nav__icon-btn"
        title={theme === 'dark' ? '라이트 모드로' : '다크 모드로'}
        aria-label="테마 전환"
        onClick={() => setTheme(next)}
      >
        {theme === 'dark' ? <Icon.sun/> : <Icon.moon/>}
      </button>
    );
  }
  // 데스크톱: 듀얼 라벨
  return (
    <div className="theme-switch" role="group" aria-label="theme">
      <button className="theme-switch__btn" data-active={theme === 'light'} onClick={() => setTheme('light')}>
        <Icon.sun/> 라이트
      </button>
      <button className="theme-switch__btn" data-active={theme === 'dark'} onClick={() => setTheme('dark')}>
        <Icon.moon/> 다크
      </button>
    </div>
  );
}

// ============================================================
// App nav (top bar) — utility + main
// frozen 룰: 9 메인 탭(마지막=더보기) / utility 우측 모바일 표시 / main 우측 4개만
// ============================================================
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
    { id: '__more', label: '더보기' },  // 9번째 — drawer(5그룹 패널) 토글
  ];
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);
  const go = (id) => { setRoute(id); setDrawerOpen(false); };
  const onTab = (id) => { if (id === '__more') setDrawerOpen(v => !v); else setRoute(id); };
  // [Phase 15] 더보기 IA 대정리 — 다른 메뉴에 진입점이 있는 항목 모두 제거
  // ─ 본래 위치 회귀 매핑:
  //   내 활동 (mygames/calendar/saved/messages/achievements/stats) → MyPage Tier 1·2
  //   경기·대회 (live/bracket/scrim/tournamentEnroll/guestApply) → 9 탭 "경기"·"대회" + 게임 카드 CTA
  //   등록·예약 (courtBooking/courtAdd/teamCreate/teamManage/refereeRequest) → 9 탭 "코트"·"팀" + 게임 상세 CTA
  //   둘러보기 (searchResults) → main bar 검색 아이콘 결과
  // ─ 더보기 잔류 원칙: "어느 메인 메뉴(9탭/마이페이지/환경설정/utility)에도 진입점이 없는 기능만"
  //   utility 좌측(소개·요금제·도움말)은 모바일 hidden 이라 모바일 진입점 보장 차원에서 유지
  const moreGroups = [
    { title:'둘러보기', items:[
      { id:'coaches',       label:'코치·트레이너', icon:'👔' },
      { id:'reviews',       label:'리뷰 모음',     icon:'⭐' },
      { id:'awards',        label:'수상 아카이브', icon:'🏆' },
      { id:'gallery',       label:'갤러리',        icon:'🎞' },
      { id:'shop',          label:'샵',            icon:'🛒' },
      { id:'refereeInfo',   label:'심판 센터 안내', icon:'🦓' },
    ]},
    { title:'계정·도움', items:[
      { id:'about',         label:'소개',          icon:'ℹ' },
      { id:'pricing',       label:'요금제',        icon:'💎' },
      { id:'help',          label:'도움말',        icon:'❓' },
    ]},
  ];
  return (
    <nav className="app-nav">
      <div className="app-nav__utility">
        <div className="app-nav__utility-inner">
          <span>MyBDR 커뮤니티</span>
          <span className="sep"/>
          <a href="#" data-util="left" onClick={(e)=>{e.preventDefault();setRoute('about');}}>소개</a>
          <span className="sep"/>
          <a href="#" data-util="left" onClick={(e)=>{e.preventDefault();setRoute('pricing');}}>요금제</a>
          <span className="sep"/>
          <a href="#" data-util="left" onClick={(e)=>{e.preventDefault();setRoute('help');}}>도움말</a>
          <span className="app-nav__utility-spacer"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('mypage');}}>마이페이지</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('settings');}}>설정</a>
          <span className="sep"/>
          <a href="#" onClick={(e)=>{e.preventDefault();setRoute('login');}}>로그아웃</a>
        </div>
      </div>
      <div className="app-nav__main">
        <a href="#" className="app-nav__logo" onClick={(e)=>{e.preventDefault();setRoute('home');}}>
          <img src="assets/bdr-logo.png" alt=""/>
          <span>MyBDR<span className="dot">.</span></span>
        </a>
        <div className="app-nav__tabs">
          {tabs.map(t => (
            <button
              key={t.id}
              className="app-nav__tab"
              data-active={t.id === '__more' ? drawerOpen : (route === t.id || (route === 'post' && t.id === 'board'))}
              aria-expanded={t.id === '__more' ? drawerOpen : undefined}
              onClick={() => onTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="app-nav__right">
          <ThemeSwitch theme={theme} setTheme={setTheme}/>
          <button className="app-nav__icon-btn" title="검색" aria-label="검색" onClick={()=>setRoute('search')}>
            <Icon.search/>
          </button>
          <button className="app-nav__icon-btn" title="쪽지 · 채팅" aria-label="쪽지 · 채팅" onClick={()=>setRoute('messages')} style={{position:'relative'}}>
            <Icon.mail/>
            <span aria-hidden="true" style={{position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>
          </button>
          <button className="app-nav__icon-btn" title="알림" aria-label="알림" onClick={()=>setRoute('notifications')} style={{position:'relative'}}>
            <Icon.bell/>
            <span aria-hidden="true" style={{position:'absolute', top:6, right:6, width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>
          </button>
          <button className="app-nav__burger" aria-label="메뉴" onClick={()=>setDrawerOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
          </button>
        </div>
      </div>
      <div className="app-nav__bottom-line"/>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={()=>setDrawerOpen(false)}/>
          <aside className="drawer drawer--more" role="dialog" aria-modal="true" aria-label="더보기">
            <div className="drawer__head">
              <div className="drawer__head-title">더보기</div>
              <button className="drawer__close" onClick={()=>setDrawerOpen(false)} aria-label="닫기">×</button>
            </div>
            <div className="drawer__body drawer__body--groups">
              {/* 모바일: 9 메인 탭 빠른 접근 (PC 에서는 hidden) */}
              <div className="drawer__tabs-mobile">
                {tabs.filter(t => t.id !== '__more').map(t => (
                  <button key={t.id} className="drawer__item" data-active={route === t.id || (route === 'post' && t.id === 'board')} onClick={()=>go(t.id)}>
                    <span>{t.label}</span>
                    <Icon.chevron/>
                  </button>
                ))}
                <div className="drawer__divider"/>
              </div>
              {/* 5그룹 IA 패널 */}
              <div className="more-grid">
                {moreGroups.map(g => (
                  <section key={g.title} className="more-grid__group">
                    <h3 className="more-grid__title">{g.title}</h3>
                    <ul className="more-grid__items">
                      {g.items.map(m => (
                        <li key={m.id}>
                          <button
                            className="more-grid__item"
                            data-active={route === m.id}
                            onClick={()=>go(m.id)}
                          >
                            <span className="more-grid__icon" aria-hidden="true">{m.icon}</span>
                            <span className="more-grid__label">{m.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>
            <div className="drawer__foot">
              <ThemeSwitch theme={theme} setTheme={setTheme}/>
              <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>rdm_captain · 로그아웃</div>
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
          <button className="onb__card" data-sel={sel === 'light'} onClick={()=>setSel('light')}>
            <div className="onb__preview light"/>
            <div className="onb__tag">추천 · 기존 다음카페 분위기</div>
            <h3>라이트 모드</h3>
            <p>파란 헤더 · 깔끔한 게시판 · 익숙한 정보 구조. 이관하신 분들이 편하게 적응할 수 있어요.</p>
          </button>
          <button className="onb__card" data-sel={sel === 'dark'} onClick={()=>setSel('dark')}>
            <div className="onb__preview dark"/>
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
    </div>
  );
}

// ============================================================
// Level badge helper
// ============================================================
function LevelBadge({ level }) {
  if (level === 'ADMIN')  return <span className="badge badge--red">운영</span>;
  if (level === 'COACH')  return <span className="badge badge--blue">코치</span>;
  if (level === 'PRESS')  return <span className="badge badge--blue">기자</span>;
  return <span className="badge badge--ghost" style={{fontFamily:'var(--ff-mono)', fontSize:11}}>{level}</span>;
}

// ============================================================
// Pagination
// ============================================================
function Pager({ current = 1, total = 8, onGo = ()=>{} }) {
  const pages = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="pager">
      <button className="pager__btn" onClick={()=>onGo(Math.max(1, current-1))}>‹</button>
      {pages.map(p => (
        <button key={p} className="pager__btn" data-active={p === current} onClick={()=>onGo(p)}>{p}</button>
      ))}
      <button className="pager__btn" onClick={()=>onGo(Math.min(total, current+1))}>›</button>
    </div>
  );
}

// ============================================================
// Sidebar (board list)
// ============================================================
function Sidebar({ active, setActive, setRoute }) {
  const groups = [
    { title: '메인', items: BOARDS.filter(b => b.category === 'main') },
    { title: '플레이',  items: BOARDS.filter(b => b.category === 'play') },
    { title: '이야기',  items: BOARDS.filter(b => b.category === 'chat') },
  ];
  return (
    <aside className="aside">
      <div className="aside__group">
        <button className="btn btn--primary" style={{width:'100%'}} onClick={() => setRoute('write')}>
          <Icon.plus/> 글쓰기
        </button>
      </div>
      <div className="aside__divider"/>
      {groups.map(g => (
        <div key={g.title} className="aside__group">
          <div className="aside__title">{g.title}</div>
          {g.items.map(b => (
            <a key={b.id} className="aside__link" data-active={active === b.id} onClick={(e)=>{e.preventDefault(); setActive(b.id); setRoute('board');}}>
              <span>{b.name} {b.new && <span className="badge badge--new">N</span>}</span>
              <span className="count">{b.count.toLocaleString()}</span>
            </a>
          ))}
        </div>
      ))}
    </aside>
  );
}

Object.assign(window, { Icon, ThemeSwitch, AppNav, Onboarding, LevelBadge, Pager, Sidebar, Avatar, Poster });

// ============================================================
// BottomNav — Mobile-only fixed bottom tab bar (≤720px)
// 5 slots, customizable via Settings → 표시·접근성 → 하단 자주가기
// Default: home / games / match / board / profile
// ============================================================

// Slot catalog — id, label, icon name (Icon[...]) , target route, parent routes that
// should highlight this slot.
const BOTTOM_NAV_CATALOG = [
  { id: 'home',     label: '홈',    icon: 'navHome',      route: 'home',     match: ['home'] },
  { id: 'games',    label: '경기',  icon: 'navGames',     route: 'games',    match: ['games', 'gameDetail', 'gameEdit', 'createGame', 'guestApply'] },
  { id: 'match',    label: '대회',  icon: 'navTrophy',    route: 'match',    match: ['match', 'matchDetail', 'tournamentEnroll', 'bracket'] },
  { id: 'orgs',     label: '단체',  icon: 'navOrg',       route: 'orgs',     match: ['orgs', 'orgDetail'] },
  { id: 'team',     label: '팀',    icon: 'navTeam',      route: 'team',     match: ['team', 'teamDetail', 'teamCreate', 'teamManage', 'teamInvite'] },
  { id: 'court',    label: '코트',  icon: 'navCourt',     route: 'court',    match: ['court', 'courtDetail', 'courtBooking', 'courtAdd', 'venueDetail'] },
  { id: 'rank',     label: '랭킹',  icon: 'navRank',      route: 'rank',     match: ['rank'] },
  { id: 'board',    label: '커뮤니티', icon: 'navCommunity', route: 'board',  match: ['board', 'post', 'write', 'postEdit'] },
  { id: 'profile',  label: '마이',  icon: 'navUser',      route: 'profile',  match: ['profile', 'mypage', 'editProfile'] },
  { id: 'calendar', label: '일정',  icon: 'navCalendar',  route: 'calendar', match: ['calendar'] },
  { id: 'saved',    label: '보관함', icon: 'navBookmark', route: 'saved',    match: ['saved'] },
  { id: 'messages', label: '쪽지',  icon: 'navMessage',   route: 'messages', match: ['messages'] },
  { id: 'refereeInfo', label: '심판', icon: 'navWhistle', route: 'refereeInfo', match: ['refereeInfo', 'refereeRequest'] },
  { id: 'billing',  label: '결제',  icon: 'navCard',      route: 'billing',  match: ['billing', 'checkout'] },
];

const BOTTOM_NAV_DEFAULT = ['home', 'games', 'match', 'board', 'profile'];
const BOTTOM_NAV_KEY = 'mybdr.bottomNav';

function getBottomNavSlots() {
  try {
    const raw = localStorage.getItem(BOTTOM_NAV_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 5) return parsed;
    }
  } catch (e) {}
  return BOTTOM_NAV_DEFAULT;
}

function setBottomNavSlots(slots) {
  try {
    localStorage.setItem(BOTTOM_NAV_KEY, JSON.stringify(slots));
    window.dispatchEvent(new CustomEvent('mybdr:bottomNavChange'));
  } catch (e) {}
}

function findCatalogItem(id) {
  return BOTTOM_NAV_CATALOG.find(c => c.id === id) || BOTTOM_NAV_CATALOG[0];
}

function BottomNav({ route, setRoute }) {
  const [slots, setSlots] = useState(getBottomNavSlots);

  useEffect(() => {
    const onChange = () => setSlots(getBottomNavSlots());
    window.addEventListener('mybdr:bottomNavChange', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('mybdr:bottomNavChange', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const items = slots.map(findCatalogItem);

  return (
    <nav className="bottom-nav" aria-label="하단 자주가기" role="navigation">
      {items.map(item => {
        const active = item.match.includes(route);
        const IconComp = Icon[item.icon] || Icon.navHome;
        return (
          <button
            key={item.id}
            type="button"
            className={`bottom-nav__btn ${active ? 'is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
            onClick={() => setRoute(item.route)}
          >
            <span className="bottom-nav__icon"><IconComp/></span>
            <span className="bottom-nav__label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

Object.assign(window, {
  BottomNav,
  BOTTOM_NAV_CATALOG,
  BOTTOM_NAV_DEFAULT,
  getBottomNavSlots,
  setBottomNavSlots,
});
