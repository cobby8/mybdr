/* global React */
// ============================================================
// BDR v2.18 — shared.jsx
// Phase 1B 의 모든 시안이 공통으로 쓰는 컴포넌트:
//   AppNav (frozen 9-tab, 03 카피 — 위반 검수 4 케이스 통과)
//   AdminShell (E 등급 자체 sidebar)
//   Crumbs / Eyebrow / KindBadge / StatusBadge
// ============================================================

window.MAIN_TABS = [
  { key: 'home',     label: '홈' },
  { key: 'games',    label: '경기' },
  { key: 'tn',       label: '대회' },
  { key: 'orgs',     label: '단체' },
  { key: 'team',     label: '팀' },
  { key: 'court',    label: '코트' },
  { key: 'rank',     label: '랭킹' },
  { key: 'comm',     label: '커뮤니티' },
  { key: 'more',     label: '더보기' },
];

// AppNav frozen — 03 카피
// 룰 1: 9 탭 / 룰 2: utility 좌측 mobile hidden 우측 표시
// 룰 3: main bar 우측 = 검색 / 쪽지 / 알림 / 다크 / 햄버거 5개만 (순서 고정)
// 룰 4: 다크 토글 PC 듀얼 / mobile 단일 / 룰 5: app-nav__icon-btn (no border/bg)
// 룰 6: mobile 닉네임 hidden / 룰 7: 더보기 9번째 탭
window.AppNav = function AppNav({ active = 'tn', isAdmin = false, theme = 'light' }) {
  return (
    <nav className="appnav">
      <div className="appnav__util">
        <div className="appnav__util-left">
          <a>MyBDR 커뮤니티</a>
          <a>소개</a>
          <a>요금제</a>
          <a>도움말</a>
        </div>
        <div className="appnav__util-right">
          <a>계정</a>
          <a>설정</a>
          <a>로그아웃</a>
        </div>
      </div>
      <div className="appnav__main">
        <span className="appnav__logo">MyBDR<span className="dot">.</span></span>
        <div className="appnav__tabs" role="tablist">
          {window.MAIN_TABS.map(t => (
            <button key={t.key} className="appnav__tab" data-active={active === t.key ? 'true' : 'false'} role="tab">
              {t.label}
            </button>
          ))}
        </div>
        <div className="appnav__right">
          {/* 룰 3: 순서 = 검색 / 쪽지 / 알림 / 다크 / 햄버거(mobile) */}
          <button className="app-nav__icon-btn" aria-label="검색">
            <span className="ico material-symbols-outlined">search</span>
          </button>
          <button className="app-nav__icon-btn" aria-label="쪽지">
            <span className="ico material-symbols-outlined">mail</span>
            <span className="app-nav__notif-dot" />
          </button>
          <button className="app-nav__icon-btn" aria-label="알림">
            <span className="ico material-symbols-outlined">notifications</span>
            <span className="app-nav__notif-dot" />
          </button>
          {/* 룰 4: PC 듀얼 (한 컴포넌트 안에서 viewport 분기 CSS) */}
          <span className="appnav__theme-pc">
            <span className={theme === 'light' ? 'is-on' : ''}>☀ 라이트</span>
            <span style={{color:'var(--ink-dim)'}}>/</span>
            <span className={theme === 'dark' ? 'is-on' : ''}>☾ 다크</span>
          </span>
          <button className="appnav__theme-mobile" aria-label="테마 전환">
            <span className="ico material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
          </button>
          {/* 햄버거 — mobile only */}
          <button className="appnav__burger" aria-label="메뉴">
            <span className="ico material-symbols-outlined">menu</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

// AdminShell — E 등급 자체 영역. AppNav 적용 외.
window.ADMIN_NAV_GROUPS = [
  {
    title: '대회 관리',
    items: [
      { key: 'list', label: '대회 목록', icon: 'list_alt' },
      { key: 'orgs', label: '단체', icon: 'apartment' },
      { key: 'series', label: '시리즈', icon: 'collections_bookmark' },
      { key: 'templates', label: '템플릿', icon: 'description' },
    ]
  },
  {
    title: '운영 중',
    items: [
      { key: 'setup', label: '셋업 hub', icon: 'tune', active: false },
      { key: 'teams', label: '참가팀', icon: 'groups' },
      { key: 'bracket', label: '대진표', icon: 'account_tree' },
      { key: 'matches', label: '경기', icon: 'sports_basketball' },
      { key: 'admins', label: '운영진', icon: 'shield_person' },
    ]
  }
];

window.AdminShell = function AdminShell({ active = 'setup', tournamentName = 'BDR 서머 오픈 #4', crumbTrail = ['대회 관리', '셋업 hub'], children }) {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          MyBDR<span className="dot">.</span>
          <small>관리자</small>
        </div>
        {window.ADMIN_NAV_GROUPS.map(g => (
          <div key={g.title}>
            <div className="admin-sidebar__group">{g.title}</div>
            {g.items.map(it => (
              <div key={it.key} className={'admin-sidebar__item' + (active === it.key ? ' is-active' : '')}>
                <span className="ico">{it.icon}</span>
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        ))}
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar__crumb">
            {crumbTrail.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">›</span>}
                <span className={i === crumbTrail.length - 1 ? 'cur' : ''}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="admin-topbar__right">
            <span className="admin-topbar__role">TAM</span>
            <span>박수빈</span>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
};

// Eyebrow / Crumbs
window.Eyebrow = function Eyebrow({ children }) {
  return <div className="eyebrow">{children}</div>;
};

window.Crumbs = function Crumbs({ trail }) {
  return (
    <nav className="crumbs">
      {trail.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">›</span>}
          {i < trail.length - 1
            ? <a>{t}</a>
            : <span className="cur">{t}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Tournament mock data — shared across UA1/UA2/UA3/UB1/UC1
window.TN_DATA = {
  // status enum (subset for user side) — recruit / preseason / main / completed
  // (DB enum 17종은 운영 매핑; 시안에서는 사용자 표시 4종으로 집약)
  list: [
    {
      id: 'tn-1', kind: 'tn',
      name: '강남구협회장배 봄 농구대회',
      org: { name: '강남구농구협회', avatar: '강' },
      divisions: ['U12', 'U15', 'U18', '오픈'],
      starts_at: '2026-05-09', ends_at: '2026-05-10',
      venue: '잠실학생체육관',
      status: 'recruit',       // 모집 중
      teams_now: 18, teams_max: 24,
      apply_deadline: '2026-05-01', // D-3
      fee_min: 25000, fee_max: 60000,
      poster_hue: 14,
    },
    {
      id: 'tn-2', kind: 'tn',
      name: 'BDR 서머 오픈 #4',
      org: { name: 'BDR 운영팀', avatar: 'B' },
      divisions: ['오픈', '아마추어'],
      starts_at: '2026-06-15', ends_at: '2026-06-21',
      venue: '장충체육관',
      status: 'preseason',     // 예선 진행
      teams_now: 32, teams_max: 32,
      apply_deadline: null,
      fee_min: 40000, fee_max: 60000,
      poster_hue: 220,
    },
    {
      id: 'tn-3', kind: 'tn',
      name: '한강 3x3 챌린지',
      org: { name: '서울시농구협회', avatar: '서' },
      divisions: ['3x3 오픈'],
      starts_at: '2026-05-25', ends_at: '2026-05-25',
      venue: '여의도 한강공원',
      status: 'recruit',
      teams_now: 6, teams_max: 16,
      apply_deadline: '2026-05-20', // D-15 (여유)
      fee_min: 30000, fee_max: 30000,
      poster_hue: 280,
    },
    {
      id: 'tn-4', kind: 'tn',
      name: '용산구 어울림배',
      org: { name: '용산구청', avatar: '용' },
      divisions: ['초등', '중등'],
      starts_at: '2026-04-26', ends_at: '2026-04-27',
      venue: '용산구민체육센터',
      status: 'main',          // 본선 진행
      teams_now: 16, teams_max: 16,
      apply_deadline: null,
      fee_min: 0, fee_max: 0,
      poster_hue: 160,
    },
    {
      id: 'tn-5', kind: 'tn',
      name: '봄맞이 마포컵',
      org: { name: '마포구체육회', avatar: '마' },
      divisions: ['오픈'],
      starts_at: '2026-03-15', ends_at: '2026-03-16',
      venue: '마포구민체육센터',
      status: 'completed',     // 종료
      teams_now: 24, teams_max: 24,
      apply_deadline: null,
      fee_min: 35000, fee_max: 35000,
      champion: '강남BC',
      mvp: '김지훈',
      poster_hue: 38,
    },
    {
      id: 'tn-6', kind: 'tn',
      name: '동작구 봄철 농구왕',
      org: { name: '동작구체육회', avatar: '동' },
      divisions: ['U12', 'U15'],
      starts_at: '2026-04-12', ends_at: '2026-04-13',
      venue: '동작구민체육센터',
      status: 'completed',
      teams_now: 20, teams_max: 20,
      apply_deadline: null,
      fee_min: 25000, fee_max: 25000,
      champion: '서초유스',
      mvp: '박서준',
      poster_hue: 198,
    },
    {
      id: 'tn-7', kind: 'tn',
      name: '광진구청장배 챌린지',
      org: { name: '광진구청', avatar: '광' },
      divisions: ['오픈'],
      starts_at: '2026-06-28', ends_at: '2026-06-28',
      venue: '광진구민체육센터',
      status: 'recruit',
      teams_now: 4, teams_max: 16,
      apply_deadline: '2026-05-30', // D-25
      fee_min: 40000, fee_max: 40000,
      poster_hue: 100,
    },
    {
      id: 'tn-8', kind: 'tn',
      name: '성동구 가족 농구한마당',
      org: { name: '성동구청', avatar: '성' },
      divisions: ['가족부', 'U10'],
      starts_at: '2026-05-12', ends_at: '2026-05-12',
      venue: '성동구민체육센터',
      status: 'recruit',
      teams_now: 12, teams_max: 16,
      apply_deadline: '2026-05-05', // D-7
      fee_min: 0, fee_max: 0,
      poster_hue: 340,
    },
  ],
};

// 사용자 본인 신청 mock (TournamentTeam 조회 결과)
window.MY_TOURNAMENTS = [
  {
    id: 'mt-1',
    tn_id: 'tn-1',
    tn_name: '강남구협회장배 봄 농구대회',
    division: 'U15',
    team_name: 'rdm 농구단',
    status: 'pending',          // 승인 대기
    step_idx: 1,                // 0=신청 1=대기 2=승인 3=결제완료 4=진행 중
    submitted_at: '2026-04-28',
    next_action: '관리자 승인 대기 중',
  },
  {
    id: 'mt-2',
    tn_id: 'tn-2',
    tn_name: 'BDR 서머 오픈 #4',
    division: '아마추어',
    team_name: 'rdm 농구단',
    status: 'approved',         // 결제 대기
    step_idx: 2,
    submitted_at: '2026-04-15',
    next_action: '결제 마감 D-2 (5/2)',
    pay_due: '2026-05-02',
    fee: 40000,
  },
  {
    id: 'mt-3',
    tn_id: 'tn-4',
    tn_name: '용산구 어울림배',
    division: '초등',
    team_name: '강남BC 유스',
    status: 'in_progress',      // 진행 중
    step_idx: 4,
    submitted_at: '2026-04-10',
    next_action: '예선 D-2 (4/26)',
  },
  {
    id: 'mt-4',
    tn_id: 'tn-5',
    tn_name: '봄맞이 마포컵',
    division: '오픈',
    team_name: 'rdm 농구단',
    status: 'completed',        // 종료
    step_idx: 4,
    submitted_at: '2026-02-20',
    next_action: '8강 진출 · MVP 김지훈',
  },
  {
    id: 'mt-5',
    tn_id: 'tn-7',
    tn_name: '광진구청장배 챌린지',
    division: '오픈',
    team_name: 'rdm 농구단',
    status: 'rejected',         // 거절됨
    step_idx: 1,
    submitted_at: '2026-04-22',
    next_action: '서류 미비로 거절 — 재신청 가능',
  },
];

// 종료 발표 (UB1) — Tournament status='completed'
window.TN_COMPLETED = {
  id: 'tn-5',
  name: '봄맞이 마포컵',
  edition: 'Vol.7',
  org: { name: '마포구체육회', avatar: '마' },
  divisions: ['오픈'],
  ended_at: '2026-03-16',
  venue: '마포구민체육센터',
  champion: { name: '강남BC', logo: '강', roster_count: 8 },
  runner_up: { name: '서초파이브', logo: '서' },
  third: [{ name: '용산레전드', logo: '용' }, { name: '강북코프', logo: '강' }],
  mvp: { name: '김지훈', team: '강남BC', stat: '평균 24.3득점 · 8어시' },
  best5: [
    { pos: 'PG', name: '김지훈', team: '강남BC', stat: '24.3pt · 8as' },
    { pos: 'SG', name: '이태우', team: '서초파이브', stat: '21.0pt · 4.2rb' },
    { pos: 'SF', name: '박재현', team: '강남BC', stat: '18.7pt · 5.5rb' },
    { pos: 'PF', name: '정성훈', team: '용산레전드', stat: '16.2pt · 9.3rb' },
    { pos: 'C',  name: '윤호석', team: '서초파이브', stat: '14.0pt · 11.2rb' },
  ],
  photos: [
    { id: 1, caption: '결승전 종료 직후' },
    { id: 2, caption: '시상식' },
    { id: 3, caption: '강남BC 단체' },
    { id: 4, caption: '명장면' },
    { id: 5, caption: 'MVP 인터뷰' },
    { id: 6, caption: '관중석' },
  ],
  story: {
    id: 'post-mapo-2026',
    title: '강남BC, 마포컵 우승 — 김지훈 MVP',
    excerpt: '3쿼터까지 동점이던 결승전, 4쿼터 김지훈의 클러치 8연속 득점으로 강남BC가 우승컵을 들어올렸다.',
  },
  next: {
    id: 'tn-next',
    name: '봄맞이 마포컵 Vol.8',
    starts_at: '2026-09-12',
    d_day: 117,
  },
};
