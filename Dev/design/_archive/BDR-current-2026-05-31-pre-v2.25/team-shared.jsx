/* global React */
// ============================================================
// BDR v2.21 — team-shared.jsx
// Phase 3 (팀 영역) 박제 공용 데이터 + mini components
// shared.jsx + game-shared.jsx 답습. 본 파일은 팀 mock data + RoleBadge / TeamCard / OperatorBadge / RequestRow / JerseyAvatar / MannerStars / TeamMiniHero
// ============================================================

// ============================================================
// 1) 팀 (Teams) 목록 — TU1 + TU3 + TA1 공용
// ============================================================
window.TEAM_LIST = [
  {
    id: 'tm-1', name: 'rdm 농구단', logo: 'R',
    city: '강남구', district: '역삼동',
    member_count: 14, max_members: 18,
    captain: { name: '박수빈', avatar: '박' },
    accepting_members: true,
    pending_apps: 3,       // BT1 — 가입 신청 대기
    last_activity_at: '2026-05-27',  // 1일 전
    manner_avg: 4.6,
    wins: 24, losses: 8, draws: 1,
    tournaments_count: 6,
    color_primary: '#1B3C87',  // navy
    color_secondary: '#E31B23', // red
    description: '주말 픽업 + 대회 출전 정기 팀. 실력보다 매너 중시.',
    home_court: '강남구민체육센터',
    role_for_me: 'captain',  // 본인 role (TU2 sidebar 분기용)
    status: 'active',
  },
  {
    id: 'tm-2', name: '강남BC', logo: '강',
    city: '강남구', district: '청담동',
    member_count: 12, max_members: 15,
    captain: { name: '김지훈', avatar: '김' },
    accepting_members: true,
    pending_apps: 1,
    last_activity_at: '2026-05-25',
    manner_avg: 4.8,
    wins: 32, losses: 5, draws: 0,
    tournaments_count: 9,
    color_primary: '#0F5FCC',
    color_secondary: '#F4C76C',
    description: '강남 대회 강팀. 마포컵 우승.',
    home_court: '강남구민체육센터',
    role_for_me: 'member',
    status: 'active',
  },
  {
    id: 'tm-3', name: '서초파이브', logo: '서',
    city: '서초구', district: '반포동',
    member_count: 10, max_members: 12,
    captain: { name: '이태우', avatar: '이' },
    accepting_members: false,
    pending_apps: 0,
    last_activity_at: '2026-05-26',
    manner_avg: 4.4,
    wins: 18, losses: 12, draws: 2,
    tournaments_count: 4,
    color_primary: '#0A5132',
    color_secondary: '#FFFFFF',
    description: '서초구 정기 팀. 모집 마감.',
    home_court: '서초구민체육센터',
    role_for_me: null,  // 미가입
    status: 'active',
  },
  {
    id: 'tm-4', name: '용산레전드', logo: '용',
    city: '용산구', district: '한남동',
    member_count: 16, max_members: 20,
    captain: { name: '정성훈', avatar: '정' },
    accepting_members: true,
    pending_apps: 2,
    last_activity_at: '2026-05-20',
    manner_avg: 4.2,
    wins: 15, losses: 10, draws: 1,
    tournaments_count: 3,
    color_primary: '#E31B23',
    color_secondary: '#1A1E27',
    description: '용산 베테랑 모임. 평일 야간 위주.',
    home_court: '용산구민체육센터',
    role_for_me: 'manager',
    status: 'active',
  },
  {
    id: 'tm-5', name: '마포FC', logo: '마',
    city: '마포구', district: '망원동',
    member_count: 11, max_members: 15,
    captain: { name: '윤호석', avatar: '윤' },
    accepting_members: true,
    pending_apps: 5,
    last_activity_at: '2026-05-28',
    manner_avg: 4.5,
    wins: 22, losses: 9, draws: 0,
    tournaments_count: 5,
    color_primary: '#0F234F',
    color_secondary: '#F4C76C',
    description: '마포 주말 정기. 가족 같은 분위기.',
    home_court: '마포구민체육센터',
    role_for_me: 'vice',
    status: 'active',
  },
  {
    id: 'tm-6', name: '송파스나이퍼즈', logo: '송',
    city: '송파구', district: '잠실동',
    member_count: 8, max_members: 12,
    captain: { name: '한지원', avatar: '한' },
    accepting_members: true,
    pending_apps: 0,
    last_activity_at: '2026-05-22',
    manner_avg: 4.7,
    wins: 9, losses: 6, draws: 0,
    tournaments_count: 2,
    color_primary: '#8B0E15',
    color_secondary: '#F4F6FA',
    description: '신생 팀 — 멤버 모집 중.',
    home_court: '송파구민체육센터',
    role_for_me: null,
    status: 'active',
  },
  {
    id: 'tm-7', name: '강북코프', logo: '강',
    city: '강북구', district: '미아동',
    member_count: 9, max_members: 15,
    captain: { name: '서태원', avatar: '서' },
    accepting_members: true,
    pending_apps: 0,
    last_activity_at: '2026-02-15',  // 100일+ 무활동
    manner_avg: 3.4,
    wins: 4, losses: 11, draws: 1,
    tournaments_count: 1,
    color_primary: '#404755',
    color_secondary: '#E3E7ED',
    description: '강북 평일 모임. 활동 저조.',
    home_court: '강북구민체육센터',
    role_for_me: null,
    status: 'active',
  },
  {
    id: 'tm-8', name: '동작 챌린저스', logo: '동',
    city: '동작구', district: '사당동',
    member_count: 6, max_members: 12,
    captain: { name: '조민기', avatar: '조' },
    accepting_members: true,
    pending_apps: 1,
    last_activity_at: '2026-05-15',
    manner_avg: 3.8,
    wins: 6, losses: 8, draws: 0,
    tournaments_count: 1,
    color_primary: '#B47A11',
    color_secondary: '#1A1E27',
    description: '동작 신생. 캐주얼.',
    home_court: '동작구민체육센터',
    role_for_me: null,
    status: 'pending',
  },
];

// ============================================================
// 2) 내 팀 (TU3 hub + TU5 MyActivity "내 팀" 섹션) — role_for_me 있는 팀만
// ============================================================
window.MY_TEAMS = window.TEAM_LIST.filter(t => t.role_for_me);

// ============================================================
// 3) 내 신청 (TU5 "내 신청" 섹션 — BT1 + BT2 통합)
// ============================================================
window.MY_TEAM_REQUESTS = [
  // BT1 — 팀 가입 신청 (team_join_requests)
  {
    id: 'jr-1', kind: 'join',
    team_id: 'tm-3', team_name: '서초파이브', team_logo: '서',
    status: 'pending',     // pending / approved / rejected
    step_idx: 1,           // 0=신청 1=캡틴 검토 2=승인
    submitted_at: '2026-05-26 19:30',
    message: '주말 픽업 자주 참가합니다. 평균 8점.',
  },
  // BT2 — 멤버 변경 신청 (TeamMemberRequest)
  {
    id: 'mr-1', kind: 'jersey_change',
    team_id: 'tm-1', team_name: 'rdm 농구단', team_logo: 'R',
    status: 'pending',
    step_idx: 1,
    submitted_at: '2026-05-25 21:00',
    payload: { old: 23, new: 11 },
  },
  {
    id: 'mr-2', kind: 'dormant',
    team_id: 'tm-4', team_name: '용산레전드', team_logo: '용',
    status: 'approved',
    step_idx: 2,
    submitted_at: '2026-05-20 14:00',
    approved_at: '2026-05-21 09:00',
    payload: { period: '3개월', reason: '학기 중' },
  },
];

// ============================================================
// 4) 휴면 예정 (BT3 — 60일+ 90일 미만 = 휴면 예정 D-N)
// ============================================================
window.MY_DORMANT_PENDING = [
  {
    team_id: 'tm-4', team_name: '용산레전드', team_logo: '용',
    last_activity_at: '2026-04-05',     // 53일 전
    days_until_dormant: 37,             // D-37
    last_action: '경기 신청',
  },
];

// ============================================================
// 5) 팀 상세 (TU2) — 단일 팀 mock
// ============================================================
window.TEAM_DETAIL_MOCK = {
  ...window.TEAM_LIST[0],  // rdm 농구단 base
  founded_at: '2024-03-15',
  hero_image_hue: 220,
  // 진행 중인 라이브 경기 (BT5 / BG7 — sticky 띠)
  live_games: [
    { id: 'gm-3', round: '결승', title: 'U10 결승', label: 'Q3 14-10', kind: 'tn' },
  ],
  // 최근 경기 (stats 탭)
  recent_games: [
    { id: 'gm-rec1', date: '2026-05-25', opponent: '강남BC', score: '32-28', result: 'win', kind: 'pickup' },
    { id: 'gm-rec2', date: '2026-05-18', opponent: '서초파이브', score: '24-30', result: 'loss', kind: 'scrimmage' },
    { id: 'gm-rec3', date: '2026-05-11', opponent: '마포FC', score: '36-22', result: 'win', kind: 'pickup' },
  ],
  // 우승 이력 (BT6 — PA7 답습)
  trophies: [
    { tn_id: 'tn-3', tn_name: '강남구청장배 #3', place: 1, year: 2025 },
    { tn_id: 'tn-7', tn_name: 'BDR 봄 오픈', place: 3, year: 2025 },
  ],
  // 팀 MVP (BG4 답습)
  team_mvp: { name: '박수빈', avatar: '박', stat: '평균 12.3pt · 5.1as', games: 18 },
  // 로스터 미리보기
  roster_preview: [
    { name: '박수빈', avatar: '박', role: 'captain', jersey: 11, manner: 4.8 },
    { name: '강민호', avatar: '강', role: 'vice', jersey: 23, manner: 4.5 },
    { name: '이태우', avatar: '이', role: 'manager', jersey: 7, manner: 4.6 },
    { name: '김지훈', avatar: '김', role: 'member', jersey: 33, manner: 4.7 },
    { name: '윤호석', avatar: '윤', role: 'member', jersey: 24, manner: 4.3 },
    { name: '박재현', avatar: '박', role: 'member', jersey: 15, manner: 4.6 },
  ],
};

// ============================================================
// 6) 팀 관리 — TU4 mock
// ============================================================
window.TEAM_MEMBERS_MOCK = [
  { id: 'm1', name: '박수빈', avatar: '박', role: 'captain', jersey: 11, status: 'active', last_activity_at: '2026-05-27', manner: 4.8 },
  { id: 'm2', name: '강민호', avatar: '강', role: 'vice', jersey: 23, status: 'active', last_activity_at: '2026-05-26', manner: 4.5 },
  { id: 'm3', name: '이태우', avatar: '이', role: 'manager', jersey: 7, status: 'active', last_activity_at: '2026-05-24', manner: 4.6 },
  { id: 'm4', name: '김지훈', avatar: '김', role: 'member', jersey: 33, status: 'active', last_activity_at: '2026-05-22', manner: 4.7 },
  { id: 'm5', name: '윤호석', avatar: '윤', role: 'member', jersey: 24, status: 'active', last_activity_at: '2026-05-15', manner: 4.3 },
  { id: 'm6', name: '박재현', avatar: '박', role: 'member', jersey: 15, status: 'active', last_activity_at: '2026-05-11', manner: 4.6 },
  { id: 'm7', name: '한지원', avatar: '한', role: 'member', jersey: 9, status: 'dormant', last_activity_at: '2026-02-10', manner: 4.0 },
  { id: 'm8', name: '서태원', avatar: '서', role: 'member', jersey: 21, status: 'active', last_activity_at: '2026-03-01', manner: 3.5 },  // 휴면 후보
];

// BT1 — 가입 신청 큐 (TU4 ?tab=requests)
window.TEAM_JOIN_REQUESTS_MOCK = [
  {
    id: 'jr-i-1', user_name: '정성훈', user_avatar: '정',
    city: '강남구', skill_level: 'intermediate',
    submitted_at: '2026-05-27 22:30',
    message: '주말 자주 참가합니다. 평균 9점.',
    manner_avg: 4.5,
  },
  {
    id: 'jr-i-2', user_name: '조민기', user_avatar: '조',
    city: '서초구', skill_level: 'beginner',
    submitted_at: '2026-05-26 21:00',
    message: '초보입니다. 잘 부탁드려요.',
    manner_avg: null,  // 신규
  },
  {
    id: 'jr-i-3', user_name: '백승호', user_avatar: '백',
    city: '강남구', skill_level: 'advanced',
    submitted_at: '2026-05-24 12:00',
    message: '대회 경험 있음.',
    manner_avg: 4.2,
  },
];

// BT2 — 멤버 변경 신청 (TU4 ?tab=member-requests)
window.TEAM_MEMBER_REQUESTS_MOCK = [
  {
    id: 'mr-i-1', kind: 'jersey_change',
    user_name: '강민호', user_avatar: '강',
    submitted_at: '2026-05-26 19:00',
    payload: { old: 23, new: 8 },
    status: 'pending',
  },
  {
    id: 'mr-i-2', kind: 'dormant',
    user_name: '한지원', user_avatar: '한',
    submitted_at: '2026-05-20 12:00',
    payload: { period: '3개월', reason: '시험 기간' },
    status: 'pending',
  },
  {
    id: 'mr-i-3', kind: 'withdraw',
    user_name: '서태원', user_avatar: '서',
    submitted_at: '2026-05-18 22:00',
    payload: { reason: '이사로 인한 탈퇴' },
    status: 'pending',
  },
];

// BT4 — 임원 권한 (TU4 ?tab=officers)
window.TEAM_OFFICER_PERMISSIONS_MOCK = {
  vice: {  // 부캡틴 (강민호)
    name: '강민호',
    perms: {
      approve_members: true,
      reject_members: true,
      change_member_jersey: true,
      classify_ghost: false,
      delegate_officers: false,
      kick_members: false,
      edit_team_info: true,
    },
  },
  manager: {  // 매니저 (이태우)
    name: '이태우',
    perms: {
      approve_members: true,
      reject_members: false,
      change_member_jersey: false,
      classify_ghost: true,
      delegate_officers: false,
      kick_members: false,
      edit_team_info: false,
    },
  },
};

window.PERMISSION_LABELS = {
  approve_members: '멤버 가입 승인',
  reject_members: '멤버 가입 거절',
  change_member_jersey: '멤버 jersey 번호 변경',
  classify_ghost: '유령(휴면) 분류',
  delegate_officers: '임원 권한 위임',
  kick_members: '강제 탈퇴',
  edit_team_info: '팀 정보 수정',
};

// BT3 — 유령 후보 (last_activity_at 3개월+)
window.TEAM_GHOST_CANDIDATES_MOCK = [
  {
    id: 'gc-1', user_name: '서태원', user_avatar: '서', jersey: 21,
    last_activity_at: '2026-03-01',     // 88일 전
    days_since: 88,
    last_action: '경기 신청 — 강남 평일 픽업',
  },
  {
    id: 'gc-2', user_name: '한지원', user_avatar: '한', jersey: 9,
    last_activity_at: '2026-02-10',     // 107일 전 (이미 dormant)
    days_since: 107,
    last_action: '대회 출전',
    already_dormant: true,
  },
];

// BT5 — 받은 매치 신청 (TU4 ?tab=match-requests)
window.TEAM_MATCH_REQUESTS_MOCK = [
  {
    id: 'tmr-1',
    from_team: { id: 'tm-3', name: '서초파이브', logo: '서' },
    submitted_at: '2026-05-27 18:00',
    proposed_date: '2026-06-08 (토)',
    proposed_court: '강남구민체육센터',
    message: '주말 스크림 어떠세요? 우리 팀 5인 / 그쪽 5인 + 게스트 OK.',
    status: 'pending',
  },
  {
    id: 'tmr-2',
    from_team: { id: 'tm-5', name: '마포FC', logo: '마' },
    submitted_at: '2026-05-25 22:00',
    proposed_date: '2026-06-15 (토)',
    proposed_court: '마포구민체육센터',
    message: '한 번 붙어봅시다.',
    status: 'pending',
  },
];

// ============================================================
// 7) Admin Teams (TA1 / TA2) — super-admin 측 mock
// ============================================================
window.ADMIN_TEAMS_STATS = {
  total: 84,
  active: 68,
  pending: 8,
  suspended: 5,
  dissolved: 3,
};

window.ADMIN_TEAMS_LIST = window.TEAM_LIST.map(t => ({
  ...t,
  status: t.status === 'pending' ? 'pending' : 'active',
})).concat([
  {
    id: 'tm-susp-1', name: '한남스타스', logo: '한',
    city: '용산구', district: '한남동',
    member_count: 6, captain: { name: '백상호', avatar: '백' },
    last_activity_at: '2026-04-01',
    manner_avg: 2.4,
    wins: 1, losses: 8, draws: 0,
    status: 'suspended',
    suspended_reason: '매너 평가 평균 2.4 (다회 신고)',
    suspended_at: '2026-05-10',
  },
  {
    id: 'tm-pending-1', name: '광진코어즈', logo: '광',
    city: '광진구', district: '구의동',
    member_count: 4, captain: { name: '문주영', avatar: '문' },
    last_activity_at: '2026-05-28',
    manner_avg: null,
    wins: 0, losses: 0, draws: 0,
    status: 'pending',
    submitted_at: '2026-05-27',
  },
]);

// ============================================================
// 8) Mini Components
// ============================================================

// RoleBadge — captain / vice / manager / member
window.RoleBadge = function RoleBadge({ role, small = false }) {
  const def = {
    captain: { label: '캡틴',     color: '#fff', bg: 'var(--accent)',     ico: 'shield' },
    vice:    { label: '부캡틴',   color: '#fff', bg: 'var(--accent-deep)', ico: 'shield_person' },
    manager: { label: '매니저',   color: '#fff', bg: 'var(--cafe-blue)',   ico: 'manage_accounts' },
    member:  { label: '멤버',     color: 'var(--ink-soft)', bg: 'var(--bg-head)', ico: 'person' },
  }[role] || { label: role, color: 'var(--ink-mute)', bg: 'var(--bg-head)' };
  return (
    <span className="role-badge" data-small={small} style={{ background: def.bg, color: def.color }}>
      {def.ico && <span className="ico material-symbols-outlined">{def.ico}</span>}
      {def.label}
    </span>
  );
};

// OperatorBadge — super-admin "Site Operator" badge (Phase 1A PA3 답습)
window.OperatorBadge = function OperatorBadge() {
  return (
    <span className="operator-badge">
      <span className="ico material-symbols-outlined">verified_user</span>
      Site Operator
    </span>
  );
};

// JerseyAvatar — 팀 로고 (jersey 색상 두 줄로 표현)
window.JerseyAvatar = function JerseyAvatar({ logo, color1 = '#1B3C87', color2, size = 48 }) {
  return (
    <div className="jersey-av" style={{
      width: size, height: size,
      background: color1,
      color: '#fff',
      fontSize: size * 0.45,
      borderRadius: '50%',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--ff-display)', fontWeight: 900,
      position: 'relative', overflow: 'hidden',
      flexShrink: 0,
    }}>
      {color2 && (
        <span style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%',
          background: color2, opacity: 0.6,
        }}/>
      )}
      <span style={{position: 'relative', zIndex: 1}}>{logo}</span>
    </div>
  );
};

// MannerStars — 평균 평점 1-5 시각
window.MannerStars = function MannerStars({ avg, showNum = true }) {
  if (avg == null) return <span className="manner-stars manner-stars--none">평가 없음</span>;
  const tone = avg >= 4.5 ? 'ok' : avg >= 3.5 ? 'warn' : 'err';
  const color = { ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)' }[tone];
  return (
    <span className="manner-stars" style={{ color }}>
      <span style={{fontSize: 12}}>★</span>
      {showNum && <span className="manner-stars__num">{avg.toFixed(1)}</span>}
    </span>
  );
};

// TeamCard — TU1 / TU3 (운영 hub) / TA1 공용
window.TeamCard = function TeamCard({ team, variant = 'list', onClick }) {
  // variant: 'list' (TU1) / 'manage' (TU3) / 'admin' (TA1)
  const showRole = variant === 'manage';
  const showPendingChip = variant === 'manage' || variant === 'admin';
  const showAdminStatus = variant === 'admin';
  return (
    <a className={'team-card team-card--' + variant} onClick={onClick}>
      <div className="team-card__head">
        <window.JerseyAvatar logo={team.logo} color1={team.color_primary} color2={team.color_secondary} size={44}/>
        <div className="team-card__head-text">
          <div className="team-card__name">{team.name}</div>
          <div className="team-card__sub">
            {team.city} {team.district} · 캡틴 {team.captain.name}
          </div>
        </div>
        {showRole && team.role_for_me && (
          <window.RoleBadge role={team.role_for_me} small/>
        )}
        {showAdminStatus && (
          <span className={'team-card__status team-card__status--' + team.status}>
            {{ active: '활성', pending: '미승인', suspended: '정지', dissolved: '해산' }[team.status]}
          </span>
        )}
      </div>
      <div className="team-card__meta">
        <span className="team-card__meta-item">
          <span className="ico material-symbols-outlined">groups</span>
          {team.member_count}
          {team.max_members && <span className="team-card__meta-den">/{team.max_members}</span>}
        </span>
        <span className="team-card__meta-item">
          <window.MannerStars avg={team.manner_avg}/>
        </span>
        <span className="team-card__meta-item">
          <span className="ico material-symbols-outlined">military_tech</span>
          {team.wins}승 {team.losses}패
        </span>
        <span className="team-card__activity">
          {(() => {
            if (!team.last_activity_at) return '활동 없음';
            const d = (new Date('2026-05-28') - new Date(team.last_activity_at)) / (1000 * 60 * 60 * 24);
            if (d < 1) return '오늘';
            if (d < 30) return Math.round(d) + '일 전';
            if (d < 60) return Math.round(d / 7) + '주 전';
            return Math.round(d / 30) + '개월 전';
          })()}
        </span>
      </div>
      {/* BT1 — 가입 신청 N건 chip (manage/admin variant) */}
      {showPendingChip && team.pending_apps > 0 && (
        <div className="team-card__pending">
          <span className="ico material-symbols-outlined">how_to_reg</span>
          가입 신청 {team.pending_apps}건 대기
        </div>
      )}
      {/* TU1 (list) — 모집 중 표시 (관리자 시야가 아닌 일반 사용자에게는 카운트 hide) */}
      {variant === 'list' && team.accepting_members && (
        <div className="team-card__open">
          <span className="ico material-symbols-outlined">how_to_reg</span>
          모집 중
        </div>
      )}
      {variant === 'list' && !team.accepting_members && (
        <div className="team-card__closed">
          모집 마감
        </div>
      )}
    </a>
  );
};

// RequestRow — TU4 가입 신청 / 변경 신청 큐 row (BG1 답습 패턴)
window.RequestRow = function RequestRow({ children, status = 'pending', onApprove, onReject, onDetail }) {
  return (
    <div className={'request-row request-row--' + status}>
      {children}
    </div>
  );
};

// TeamMiniHero — TU4 상단 미니 hero
window.TeamMiniHero = function TeamMiniHero({ team, currentTab = 'members' }) {
  return (
    <div className="team-mini-hero">
      <window.JerseyAvatar logo={team.logo} color1={team.color_primary} color2={team.color_secondary} size={56}/>
      <div className="team-mini-hero__body">
        <div className="team-mini-hero__name">
          {team.name}
          {team.role_for_me && <window.RoleBadge role={team.role_for_me} small/>}
        </div>
        <div className="team-mini-hero__meta">
          <span><span className="ico material-symbols-outlined">groups</span> {team.member_count}명</span>
          <span><window.MannerStars avg={team.manner_avg}/></span>
          <span><span className="ico material-symbols-outlined">military_tech</span> {team.wins}승 {team.losses}패</span>
          <span><span className="ico material-symbols-outlined">place</span> {team.city}</span>
        </div>
      </div>
      <div className="team-mini-hero__cta">
        <a className="btn btn--sm btn--ghost" href="#">팀 상세 →</a>
      </div>
    </div>
  );
};

// AdminTeamStatusBadge — TA1 카드 + TA2 모달 헤더
window.AdminTeamStatusBadge = function AdminTeamStatusBadge({ status }) {
  const def = {
    active:     { label: '활성',   color: 'var(--ok)',     bg: 'var(--ok-soft)' },
    pending:    { label: '미승인', color: '#8B5A0F',       bg: 'var(--warn-soft)' },
    suspended:  { label: '정지',   color: 'var(--err)',    bg: 'var(--err-soft)' },
    dissolved:  { label: '해산',   color: 'var(--ink-mute)', bg: 'var(--bg-head)' },
  }[status] || { label: status, color: 'var(--ink-mute)', bg: 'var(--bg-head)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 9px',
      fontSize:11.5, fontWeight:800,
      color:def.color, background:def.bg,
      borderRadius:'var(--r-xs)',
      letterSpacing:'0.02em',
    }}>{def.label}</span>
  );
};
