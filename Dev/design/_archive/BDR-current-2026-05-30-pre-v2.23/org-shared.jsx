/* global React */
// ============================================================
// BDR v2.22 — org-shared.jsx
// Phase 4 (단체 영역) 박제 공용 데이터 + mini components.
// team-shared.jsx + game-shared.jsx 답습. 본 파일은 단체/시리즈 mock + OrgLogo /
// SeriesOperatorBadge / OrgStatusBadge / OrgHierarchyCrumbs / OrgCard / SeriesCard.
//
// 토큰: organizations / tournament_series / organization_members (PRISMA spec carry-over)
// ============================================================

// ============================================================
// 1) 단체 (Organizations) — OU1 + OU2 + OO1 + OA1 공용
// ============================================================
window.ORG_LIST = [
  {
    id: 'org-1', slug: 'gangnam-bba',
    name: '강남구농구협회', logo: '강',
    region: '서울 강남',
    brand_color: '#1B3C87',
    description: '강남구 정기 대회 + 유스 리그 운영. 1998 창립.',
    members_count: 12, series_count: 4,
    tournaments_count: 18,
    teams_count: 47,
    contact_email: 'gangnam-bba@example.kr',
    website_url: 'https://gangnam-bba.kr',
    status: 'approved', is_public: true,
    owner: { id: 'u-1', nickname: '김승철', avatar: '김' },
    my_role: 'owner', // 본인이 owner
    founded_year: 1998,
    apply_note: null,
    submitted_at: '2024-03-15',
    approved_at: '2024-03-16',
  },
  {
    id: 'org-2', slug: 'bdr-ops',
    name: 'BDR 운영팀', logo: 'B',
    region: '전국',
    brand_color: '#E31B23',
    description: '전국 단위 BDR 시리즈 / 서머 오픈 / 윈터컵 주최.',
    members_count: 8, series_count: 3,
    tournaments_count: 24,
    teams_count: 96,
    contact_email: 'ops@mybdr.kr',
    website_url: 'https://mybdr.kr',
    status: 'approved', is_public: true,
    owner: { id: 'u-2', nickname: '박수빈', avatar: '박' },
    my_role: 'admin',
    founded_year: 2023,
    apply_note: null,
    submitted_at: '2023-01-10',
    approved_at: '2023-01-11',
  },
  {
    id: 'org-3', slug: 'mapo-bsa',
    name: '마포구체육회', logo: '마',
    region: '서울 마포',
    brand_color: '#0F234F',
    description: '마포구 봄/가을 정기 대회 주최. 마포컵 7회 누적.',
    members_count: 6, series_count: 2,
    tournaments_count: 14,
    teams_count: 38,
    contact_email: 'mapo-bsa@example.kr',
    website_url: null,
    status: 'approved', is_public: true,
    owner: { id: 'u-3', nickname: '윤호석', avatar: '윤' },
    my_role: null,
    founded_year: 2010,
    apply_note: null,
    submitted_at: '2024-05-20',
    approved_at: '2024-05-21',
  },
  {
    id: 'org-4', slug: 'songpa-stars',
    name: '송파농구연맹', logo: '송',
    region: '서울 송파',
    brand_color: '#0A5132',
    description: '송파 동호회 연합. 평일 야간 리그 운영.',
    members_count: 4, series_count: 0,
    tournaments_count: 0, teams_count: 0,
    contact_email: 'songpa@example.kr',
    website_url: null,
    status: 'pending', is_public: false,
    owner: { id: 'u-4', nickname: '한지원', avatar: '한' },
    my_role: 'owner',
    founded_year: 2026,
    apply_note: '송파 지역 동호회 5팀 연합. 6월 첫 리그 개막 예정.',
    submitted_at: '2026-05-25',
    approved_at: null,
  },
  {
    id: 'org-5', slug: 'sb-club',
    name: '서초농구클럽', logo: '서',
    region: '서울 서초',
    brand_color: '#404755',
    description: '(보관됨) 2023 해산.',
    members_count: 0, series_count: 1,
    tournaments_count: 6, teams_count: 22,
    contact_email: null, website_url: null,
    status: 'archived', is_public: false,
    owner: { id: 'u-5', nickname: '이태우', avatar: '이' },
    my_role: null,
    founded_year: 2015,
    apply_note: null,
    submitted_at: '2015-04-01',
    approved_at: '2015-04-02',
  },
];

// ============================================================
// 2) 시리즈 (Tournament Series) — OU4 + OO3 공용
// ============================================================
window.SERIES_LIST = [
  {
    id: 'sr-1', slug: 'bdr-summer-open',
    name: 'BDR 서머 오픈',
    org_id: 'org-2', org_name: 'BDR 운영팀',
    description: '전국 단위 여름 정기 대회. 4년째 진행 중.',
    logo: '☀',
    color: '#E31B23',
    tournaments_count: 4,
    is_public: true,
    created_at: '2023-06-01',
    founded_year: 2023,
    next_edition_id: 'tn-2', next_edition_name: 'BDR 서머 오픈 #4',
    teams_total: 96,
    champions: [
      { edition: 3, year: 2025, team: '강남BC', mvp: '김지훈' },
      { edition: 2, year: 2024, team: '서초파이브', mvp: '이태우' },
      { edition: 1, year: 2023, team: 'rdm 농구단', mvp: '박수빈' },
    ],
  },
  {
    id: 'sr-2', slug: 'gangnam-spring',
    name: '강남구협회장배 봄대회',
    org_id: 'org-1', org_name: '강남구농구협회',
    description: '강남구 봄 정기. U12/U15/U18/오픈 4종별.',
    logo: '봄',
    color: '#1B3C87',
    tournaments_count: 8,
    is_public: true,
    created_at: '2018-03-01',
    founded_year: 2018,
    next_edition_id: 'tn-1', next_edition_name: '강남구협회장배 봄 농구대회 #8',
    teams_total: 188,
    champions: [
      { edition: 7, year: 2025, team: '강남BC', mvp: '김지훈' },
      { edition: 6, year: 2024, team: '서초파이브', mvp: '이태우' },
    ],
  },
  {
    id: 'sr-3', slug: 'gangnam-youth-league',
    name: '강남 유스 리그',
    org_id: 'org-1', org_name: '강남구농구협회',
    description: 'U12 / U15 6개월 정기 리그.',
    logo: 'Y',
    color: '#0F5FCC',
    tournaments_count: 12,
    is_public: true,
    created_at: '2019-09-01',
    founded_year: 2019,
    next_edition_id: null, next_edition_name: null,
    teams_total: 264,
    champions: [
      { edition: 11, year: 2025, team: '강남유스 U15', mvp: '박서준' },
    ],
  },
  {
    id: 'sr-4', slug: 'mapo-cup',
    name: '마포컵',
    org_id: 'org-3', org_name: '마포구체육회',
    description: '마포 봄/가을 더블 시즌.',
    logo: '컵',
    color: '#0F234F',
    tournaments_count: 7,
    is_public: true,
    created_at: '2020-03-15',
    founded_year: 2020,
    next_edition_id: 'tn-next', next_edition_name: '봄맞이 마포컵 Vol.8',
    teams_total: 154,
    champions: [
      { edition: 7, year: 2026, team: '강남BC', mvp: '김지훈' },
      { edition: 6, year: 2025, team: '서초파이브', mvp: '이태우' },
    ],
  },
  {
    id: 'sr-5', slug: 'bdr-winter-cup',
    name: 'BDR 윈터컵',
    org_id: 'org-2', org_name: 'BDR 운영팀',
    description: '동절기 실내 단판 토너먼트.',
    logo: '❄',
    color: '#0A4CA6',
    tournaments_count: 2,
    is_public: true,
    created_at: '2024-12-01',
    founded_year: 2024,
    next_edition_id: null, next_edition_name: null,
    teams_total: 32,
    champions: [],
  },
  {
    id: 'sr-6', slug: 'bdr-3x3-challenge',
    name: 'BDR 3x3 챌린지',
    org_id: 'org-2', org_name: 'BDR 운영팀',
    description: '한강공원 야외 3x3 정기.',
    logo: '3',
    color: '#8B0E15',
    tournaments_count: 5,
    is_public: true,
    created_at: '2022-05-10',
    founded_year: 2022,
    next_edition_id: 'tn-3', next_edition_name: '한강 3x3 챌린지',
    teams_total: 60,
    champions: [
      { edition: 4, year: 2025, team: '용산레전드', mvp: '정성훈' },
    ],
  },
  {
    id: 'sr-7', slug: 'gangnam-autumn',
    name: '강남구청장배 가을대회',
    org_id: 'org-1', org_name: '강남구농구협회',
    description: '강남구 가을 정기. 단판제.',
    logo: '秋',
    color: '#B47A11',
    tournaments_count: 5,
    is_public: true,
    created_at: '2020-10-01',
    founded_year: 2020,
    next_edition_id: null, next_edition_name: null,
    teams_total: 80,
    champions: [],
  },
  {
    id: 'sr-8', slug: 'mapo-autumn-cup',
    name: '마포 가을컵',
    org_id: 'org-3', org_name: '마포구체육회',
    description: '마포 가을 정기.',
    logo: '秋',
    color: '#5B6271',
    tournaments_count: 7,
    is_public: true,
    created_at: '2019-10-01',
    founded_year: 2019,
    next_edition_id: null, next_edition_name: null,
    teams_total: 96,
    champions: [],
  },
];

// ============================================================
// 3) 단체 멤버 (organization_members) — OO2 ?tab=members
// ============================================================
window.ORG_MEMBERS_MOCK = [
  { id: 'om-1', user_id: 'u-1', nickname: '김승철', email: 'kim.sc@example.kr', avatar: '김', role: 'owner', joined_at: '2024-03-16', is_active: true },
  { id: 'om-2', user_id: 'u-10', nickname: '정성훈', email: 'jung.sh@example.kr', avatar: '정', role: 'admin', joined_at: '2024-04-02', is_active: true },
  { id: 'om-3', user_id: 'u-11', nickname: '강민호', email: 'kang.mh@example.kr', avatar: '강', role: 'admin', joined_at: '2024-05-10', is_active: true },
  { id: 'om-4', user_id: 'u-12', nickname: '서태원', email: 'seo.tw@example.kr', avatar: '서', role: 'member', joined_at: '2024-07-22', is_active: true },
  { id: 'om-5', user_id: 'u-13', nickname: '백승호', email: 'baek.sh@example.kr', avatar: '백', role: 'member', joined_at: '2024-09-04', is_active: true },
  { id: 'om-6', user_id: 'u-14', nickname: '한지원', email: 'han.jw@example.kr', avatar: '한', role: 'member', joined_at: '2025-01-15', is_active: true },
];

// ============================================================
// 4) 단체 활동 이력 (OO2 ?tab=activity)
// ============================================================
window.ORG_ACTIVITY_LOG = [
  { id: 'al-1', at: '2026-05-27 14:20', kind: 'series_create', actor: '박수빈', body: '시리즈 "BDR 서머 오픈" 회차 #4 모집 시작' },
  { id: 'al-2', at: '2026-05-25 11:00', kind: 'member_invite', actor: '김승철', body: '백승호 멤버 초대 (admin)' },
  { id: 'al-3', at: '2026-05-22 18:30', kind: 'tournament_complete', actor: '시스템', body: '강남구청장배 봄대회 #7 종료 — 우승 강남BC' },
  { id: 'al-4', at: '2026-05-18 09:15', kind: 'org_edit', actor: '김승철', body: '단체 정보 수정 (연락 이메일 변경)' },
  { id: 'al-5', at: '2026-05-10 22:00', kind: 'series_create', actor: '박수빈', body: '시리즈 "BDR 윈터컵 #2" 회차 추가' },
  { id: 'al-6', at: '2026-05-01 16:00', kind: 'super_admin', actor: 'Site Operator', body: '단체 "송파농구연맹" 신청 수신 (대기 대기열)' },
];

// ============================================================
// 5) Mini Components
// ============================================================

// OrgLogo — 단체 로고 (브랜드 색상 + 한글자)
window.OrgLogo = function OrgLogo({ logo, color = '#1B3C87', size = 48, rounded = false }) {
  return (
    <div className="org-logo" style={{
      width: size, height: size,
      background: 'linear-gradient(135deg, ' + color + ', ' + shade(color, -18) + ')',
      color: '#fff',
      fontSize: size * 0.42,
      borderRadius: rounded ? '50%' : 'var(--r-md)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--ff-display)', fontWeight: 900,
      flexShrink: 0,
      letterSpacing: '-0.02em',
      boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.16), 0 1px 3px rgba(0,0,0,.15)',
    }}>{logo}</div>
  );
};

// 색상 darken util (단순 hex shade)
function shade(hex, p) {
  const f = parseInt(hex.slice(1), 16);
  const t = p < 0 ? 0 : 255;
  const P = Math.abs(p) / 100;
  const R = f >> 16, G = (f >> 8) & 0xff, B = f & 0xff;
  return '#' + (0x1000000 + (Math.round((t - R) * P) + R) * 0x10000 + (Math.round((t - G) * P) + G) * 0x100 + (Math.round((t - B) * P) + B)).toString(16).slice(1);
}

// SeriesOperatorBadge — 단체 운영자 (Series Operator)
// 시각 분리: Site Operator = dark + gold 가로, 본 컴포넌트 = navy + silver
window.SeriesOperatorBadge = function SeriesOperatorBadge() {
  return (
    <span className="series-operator-badge">
      <span className="ico material-symbols-outlined">apartment</span>
      Series Operator
    </span>
  );
};

// OrgStatusBadge — pending / approved / rejected / archived
window.OrgStatusBadge = function OrgStatusBadge({ status, small = false }) {
  const def = {
    pending:  { label: '대기',   color: '#8B5A0F',         bg: 'var(--warn-soft)' },
    approved: { label: '승인',   color: 'var(--ok)',       bg: 'var(--ok-soft)' },
    rejected: { label: '거절',   color: 'var(--err)',      bg: 'var(--err-soft)' },
    archived: { label: '보관됨', color: 'var(--ink-mute)', bg: 'var(--bg-head)' },
  }[status] || { label: status, color: 'var(--ink-mute)', bg: 'var(--bg-head)' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: small ? '1px 6px' : '2px 8px',
      fontSize: small ? 10 : 11,
      fontWeight: 800,
      color: def.color, background: def.bg,
      borderRadius: 'var(--r-xs)',
      letterSpacing: '0.02em',
      fontFamily: 'var(--ff-mono)',
      whiteSpace: 'nowrap',
    }}>{def.label}</span>
  );
};

// OrgHierarchyCrumbs — 홈 → 단체 → 시리즈 → 회차 → 대회 (BO2 위계)
// trail = [{ label, href?, current? }]
window.OrgHierarchyCrumbs = function OrgHierarchyCrumbs({ trail }) {
  return (
    <nav className="org-crumbs" aria-label="위계">
      {trail.map((t, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="org-crumbs__sep">›</span>}
          {t.current
            ? <span className="org-crumbs__cur" aria-current="page">{t.icon && <span className="ico material-symbols-outlined">{t.icon}</span>}{t.label}</span>
            : <a className="org-crumbs__link">{t.icon && <span className="ico material-symbols-outlined">{t.icon}</span>}{t.label}</a>}
        </React.Fragment>
      ))}
    </nav>
  );
};

// OrgCard — OU1 (public list) / OO1 (admin list) 공용
window.OrgCard = function OrgCard({ org, variant = 'list', onClick }) {
  // variant: 'list' (OU1) / 'admin' (OO1) / 'compact' (OU2 추천)
  const showRole = variant === 'admin';
  const showStatus = variant === 'admin';
  return (
    <a className={'org-card org-card--' + variant} onClick={onClick}>
      <div className="org-card__head">
        <window.OrgLogo logo={org.logo} color={org.brand_color} size={variant === 'compact' ? 36 : 44}/>
        <div className="org-card__head-text">
          <div className="org-card__name">
            {org.name}
            {showStatus && org.status !== 'approved' && <window.OrgStatusBadge status={org.status} small/>}
          </div>
          <div className="org-card__sub">
            {org.region}{org.founded_year ? ' · 설립 ' + org.founded_year : ''}
          </div>
        </div>
        {showRole && org.my_role && (
          <span className={'org-card__role org-card__role--' + org.my_role}>
            {{ owner: '소유자', admin: '관리자', member: '멤버' }[org.my_role]}
          </span>
        )}
      </div>
      {variant !== 'compact' && org.description && (
        <div className="org-card__desc">{org.description}</div>
      )}
      <div className="org-card__meta">
        <span className="org-card__meta-item">
          <span className="ico material-symbols-outlined">collections_bookmark</span>
          시리즈 <b>{org.series_count}</b>
        </span>
        <span className="org-card__meta-item">
          <span className="ico material-symbols-outlined">emoji_events</span>
          대회 <b>{org.tournaments_count}</b>회
        </span>
        <span className="org-card__meta-item">
          <span className="ico material-symbols-outlined">groups</span>
          팀 <b>{org.teams_count}</b>
        </span>
      </div>
    </a>
  );
};

// SeriesCard — OU4 grid / OO3 list 공용
window.SeriesCard = function SeriesCard({ series, variant = 'grid', onClick }) {
  return (
    <a className={'series-card series-card--' + variant} onClick={onClick}>
      <div className="series-card__head">
        <div className="series-card__tagline">
          <span className="series-card__edition">{series.tournaments_count}회 진행</span>
        </div>
        <div className="series-card__title">{series.name}</div>
        {series.description && (
          <div className="series-card__desc">{series.description}</div>
        )}
      </div>
      <div className="series-card__logo" style={{ background: series.color }}>
        {series.logo}
      </div>
      <div className="series-card__foot">
        <span className="series-card__org">
          <span className="ico material-symbols-outlined">apartment</span>
          {series.org_name}
        </span>
        <span className="series-card__teams">
          누적 <b>{series.teams_total}</b>팀
        </span>
      </div>
    </a>
  );
};

// OrgHeroV2 — OU2 hero (브랜드 그라디언트 + 가입 신청 alert)
window.OrgHero = function OrgHero({ org, isMember = false }) {
  return (
    <section className="org-hero" style={{
      background: 'linear-gradient(135deg, ' + org.brand_color + ' 0%, ' + shade(org.brand_color, -28) + ' 60%, #0B0D10 100%)',
    }}>
      <div className="org-hero__pattern" aria-hidden></div>
      <div className="org-hero__body">
        <div className="org-hero__eyebrow">ORGANIZATION · {org.region.toUpperCase()}</div>
        <h1 className="org-hero__title">{org.name}</h1>
        {org.description && <p className="org-hero__desc">{org.description}</p>}
        <div className="org-hero__meta">
          <span><b>{org.series_count}</b> 시리즈</span>
          <span className="org-hero__meta-sep">·</span>
          <span><b>{org.tournaments_count}</b>회 대회 진행</span>
          <span className="org-hero__meta-sep">·</span>
          <span>설립 {org.founded_year}</span>
        </div>
      </div>
      <div className="org-hero__side">
        <window.OrgLogo logo={org.logo} color={org.brand_color} size={84} rounded/>
        {!isMember && (
          <a className="btn btn--primary org-hero__cta">
            <span className="ico material-symbols-outlined">person_add</span>
            멤버 가입 신청
          </a>
        )}
      </div>
    </section>
  );
};

// ============================================================
// 6) SeriesOperatorShell — 단체 운영자 (Series Operator) 자체 sidebar shell
// AdminShell (Site Operator · super-admin) 과 시각 분리 — 좌측 사이드바 navy gradient
// ============================================================

window.SERIES_OPS_NAV = [
  {
    title: '단체 운영',
    items: [
      { key: 'orgs',    label: '내 단체',    icon: 'apartment' },
      { key: 'members', label: '멤버 관리',  icon: 'group' },
      { key: 'series',  label: '시리즈',     icon: 'collections_bookmark' },
      { key: 'public',  label: '공개 페이지', icon: 'open_in_new' },
    ],
  },
  {
    title: '운영 도구',
    items: [
      { key: 'editions', label: '회차 일정', icon: 'event' },
      { key: 'archive',  label: '보관 / 이력', icon: 'inventory_2' },
    ],
  },
];

window.SeriesOperatorShell = function SeriesOperatorShell({ active = 'orgs', crumbTrail = ['단체 운영', '내 단체'], orgName = '강남구농구협회', children }) {
  return (
    <div className="ops-shell">
      <aside className="ops-shell__side">
        <div className="ops-shell__brand">
          MyBDR<span className="dot">.</span>
          <small>단체 운영</small>
        </div>
        {window.SERIES_OPS_NAV.map(g => (
          <div key={g.title}>
            <div className="ops-shell__group">{g.title}</div>
            {g.items.map(it => (
              <div key={it.key} className={'ops-shell__item' + (active === it.key ? ' is-active' : '')}>
                <span className="ico material-symbols-outlined">{it.icon}</span>
                <span>{it.label}</span>
              </div>
            ))}
          </div>
        ))}
      </aside>
      <main className="ops-shell__main">
        <div className="ops-shell__topbar">
          <div className="ops-shell__topbar-crumb">
            {crumbTrail.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">›</span>}
                <span className={i === crumbTrail.length - 1 ? 'cur' : ''}>{c}</span>
              </React.Fragment>
            ))}
          </div>
          <div className="ops-shell__topbar-right">
            <window.SeriesOperatorBadge/>
            <span style={{fontFamily:'var(--ff-display)', fontWeight:700, fontSize:13, color:'var(--ink)'}}>박수빈</span>
          </div>
        </div>
        <div className="ops-shell__body">
          {children}
        </div>
      </main>
    </div>
  );
};

// Site Operator badge re-export (team-shared 답습 — 본 파일에서도 직접 참조 가능하게)
// (team-shared.jsx 의 OperatorBadge 가 이미 등록되어 있음 — 재선언 X)
