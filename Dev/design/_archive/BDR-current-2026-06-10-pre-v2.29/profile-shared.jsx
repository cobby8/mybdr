/* global React */
// ============================================================
// BDR v2.24 — profile-shared.jsx
// Phase 6.1 (프로필·마이페이지 본체) 박제 공용 데이터 + mini components.
// shared.jsx + game-shared.jsx + team-shared.jsx + comm-shared.jsx 답습.
//
// 토큰 출처 (PRISMA_user_models_spec.md carry-over):
//   User (nickname / public_id / email / profile_image_url / isAdmin / status /
//     suspended_at / last_login_at / evaluation_rating / total_games_* /
//     subscription_status / bank_* / preferred_* / dominant_hand / skill_level /
//     strengths / privacy_settings)
//   UserSeasonStat — PU3 시즌 stat
//   user_badges — PU4 업적
//   cross-domain: games.final_mvp_user_id (Phase 2 BG4) · Team.wins/losses/draws
//     (Phase 3 BT6) · Tournament.champion_team_id (Phase 1A PA7) · community_posts
//
// ★ BP1 정합 핵심: USER_ME (본인 시야) == USER_ME (공개 시야) 동일 데이터,
//   privacy_settings 분기로 시각만 분리. PU5 는 USER_ME 를 publicView() 로 필터.
// ============================================================

// ============================================================
// 1) 본인 User (PU1 / PU2 / PU3 / PU4 source · PU5 의 공개 대상)
// ============================================================
window.USER_ME = {
  id: 'u-1', public_id: 'rdm_captain',
  nickname: '박수빈', name: '박수빈', avatar: '박',
  email: 'subin.park@mybdr.kr', phone: '010-2841-77**',
  city: '서울', district: '송파구',
  position: 'PG', height: 178, weight: 72,
  dominant_hand: 'right',           // 좌/우/양손
  skill_level: 'advanced',          // beginner / intermediate / advanced / pro
  strengths: ['외곽슛', '픽앤롤', '수비 IQ', '클러치'],
  bio: '주 2회 정기런 + 주말 대회. 가드 포지션, 픽앤롤과 외곽이 강점입니다. 매너 좋은 코트 환영해요.',
  level: 14, xp: 4820,
  evaluation_rating: 4.8, manner_count: 42,
  total_games_participated: 86, total_games_hosted: 23,
  subscription_status: 'active',    // PRO
  profile_completed: true,
  isAdmin: true,                    // 본인 = super-admin (PA1 가드 대상)
  status: 'active',
  last_login_at: '2026-05-30T08:12:00',
  created_at: '2024-03-12',
  // 결제·은행 (Phase 6.2 영역 — PU2 link out · PU5 hide · PA1 read-only)
  bank_name: '카카오뱅크', account_number: '3333-**-******1',
  // privacy_settings (Json) — 공개 / 비공개 분기 (PU5 필터 · PU2 토글)
  privacy_settings: {
    bio: true, position: true, region: true, height_weight: true,
    season_stat: true, teams: true, activity: true, achievements: true,
    email: false, phone: false, billing: false,
  },
};

// 본인 소속 팀 (Phase 3 cross-domain)
window.ME_TEAMS = [
  { id: 'tm-7', name: 'rdm 농구단', color: '#0F5FCC', logo: 'R', role: 'captain', jersey: 7, city: '서울 송파' },
  { id: 'tm-21', name: '송파 새벽런', color: '#0A5132', logo: '송', role: 'member', jersey: 11, city: '서울 송파' },
];

// 본인 소속 단체 (Phase 4 cross-domain)
window.ME_ORGS = [
  { id: 'org-3', name: '송파구농구연합', avatar: '송', role: '회원' },
];

// ============================================================
// 2) 시즌 stat (UserSeasonStat) — PU3-B 5 카드 + PU5-A 공개 stat
// ============================================================
window.SEASON_STAT = {
  season: '2026',
  participated: 86,                 // total_games_participated
  hosted: 23,                       // total_games_hosted
  mvp_month: 3,                     // Phase 2 BG4 — final_mvp 30일 집계 (cross-domain)
  mvp_total: 8,                     // 전체 게임 MVP 누적 (PU4-C)
  rating: 4.8,                      // evaluation_rating
  team_wins: 15, team_losses: 9, team_draws: 1,  // Phase 3 BT6 — 본인 팀 전적 합 (cross-domain)
};

// 통산 경기 기록 (Phase 1 8열 — PU3 CareerStats · PU5 overview)
window.CAREER_STAT = {
  games: 18, win_rate: 61,
  ppg: 12.8, rpg: 3.4, apg: 7.1, mpg: 24,
  fg: 44.2, tp: 36.5,
};

// ============================================================
// 3) 선호 정보 (preferred_* 8 종 · Json[]) — PU3-C chip 선택 UX
// ============================================================
window.PREFERRED = [
  { key: 'divisions',   label: '선호 종별',   ico: 'category',
    options: ['오픈', '아마추어', 'U18', '3x3', '시니어'], selected: ['오픈', '아마추어'] },
  { key: 'regions',     label: '활동 지역',   ico: 'location_on',
    options: ['송파', '강남', '강동', '서초', '광진', '성동'], selected: ['송파', '강남', '강동'] },
  { key: 'days',        label: '선호 요일',   ico: 'event',
    options: ['월', '화', '수', '목', '금', '토', '일'], selected: ['수', '금', '토'] },
  { key: 'time_slots',  label: '선호 시간',   ico: 'schedule',
    options: ['오전', '오후', '야간', '심야'], selected: ['야간', '오전'] },
  { key: 'skill_levels',label: '선호 수준',   ico: 'trending_up',
    options: ['입문', '초급', '중급', '고급'], selected: ['중급', '고급'] },
  { key: 'game_types',  label: '선호 유형',   ico: 'sports_basketball',
    options: ['픽업', '게스트', '연습경기', '5x5', '3x3'], selected: ['픽업', '게스트', '5x5'] },
  { key: 'positions',   label: '선호 포지션', ico: 'directions_run',
    options: ['PG', 'SG', 'SF', 'PF', 'C'], selected: ['PG', 'SG'] },
  { key: 'board_categories', label: '관심 게시판', ico: 'tag',
    options: ['팀원모집', '정보공유', '대회후기', '농구장터'], selected: ['팀원모집', '정보공유'] },
];

// ============================================================
// 4) 우승 이력 (Phase 1A PA7 cross-domain · Tournament.champion_team_id)
//    captain_id=me 또는 team_members.user_id=me 자동 표시
// ============================================================
window.ME_CHAMPIONS = [
  { id: 'tn-5', tn: '봄맞이 마포컵 Vol.6', division: '오픈', team: 'rdm 농구단', placed: '우승', date: '2026.03', auto: true },
  { id: 'tn-7', tn: '광진구청장배 챌린지', division: '오픈', team: 'rdm 농구단', placed: '준우승', date: '2025.11', auto: true },
  { id: 'tn-9', tn: '송파 가을리그', division: '오픈', team: '송파 새벽런', placed: '3위', date: '2025.09', auto: true },
];

// ============================================================
// 5) 업적 배지 (user_badges) — PU4 grid + PU1/PU5 mini
//    earned = 획득 / locked = 미획득 (catalog merge)
// ============================================================
window.BADGE_CATALOG = [
  { type: 'first_game',  name: '첫 경기',     ico: 'sports_basketball', tone: 'blue',  desc: '첫 픽업 게임 참가', earned_at: '2024-03-15' },
  { type: 'champion',    name: '대회 우승',   ico: 'emoji_events',      tone: 'gold',  desc: '대회 우승 (자동)', earned_at: '2026-03-16' },
  { type: 'mvp_streak',  name: 'MVP 3연속',   ico: 'local_fire_department', tone: 'red', desc: '3경기 연속 MVP', earned_at: '2026-05-10' },
  { type: 'host_20',     name: '호스트 20',   ico: 'add_circle',        tone: 'blue',  desc: '경기 20회 주최', earned_at: '2025-12-01' },
  { type: 'manner_high', name: '매너 마스터', ico: 'volunteer_activism', tone: 'green', desc: '매너 4.8 이상 유지', earned_at: '2026-04-22' },
  { type: 'season_20',   name: '시즌 개근',   ico: 'calendar_month',    tone: 'blue',  desc: '시즌 정기런 20회', earned_at: '2026-05-01' },
  { type: 'sharpshooter',name: '슈터',        ico: 'my_location',       tone: 'red',   desc: '3점 성공률 36%+', earned_at: '2026-02-18' },
  // locked
  { type: 'triple_double', name: '트리플더블', ico: 'auto_awesome',     tone: 'gold',  desc: '한 경기 트리플더블', earned_at: null },
  { type: 'tournament_5',  name: '대회 5회',   ico: 'workspace_premium', tone: 'gold', desc: '대회 5회 참가', earned_at: null },
  { type: 'host_50',       name: '호스트 50',  ico: 'stars',            tone: 'blue',  desc: '경기 50회 주최', earned_at: null },
];
window.BADGE_EARNED = window.BADGE_CATALOG.filter(b => b.earned_at);
window.BADGE_RECENT = [...window.BADGE_EARNED].sort((a, b) => (b.earned_at > a.earned_at ? 1 : -1)).slice(0, 3);

// ============================================================
// 6) 최근 활동 (PU5-C cross-domain) — 경기 / 작성 글
// ============================================================
window.ME_RECENT_GAMES = [
  { id: 'g-1', title: '송파 수요 정기런', date: '2026.05.28', result: 'W 68-61', mvp: true },
  { id: 'g-2', title: 'BDR 서머 오픈 #4 예선', date: '2026.05.24', result: 'W 54-49', mvp: false },
  { id: 'g-3', title: '강동 5x5 픽업', date: '2026.05.21', result: 'L 47-52', mvp: false },
  { id: 'g-4', title: '봄맞이 마포컵 결승', date: '2026.03.16', result: 'W 72-65', mvp: true },
  { id: 'g-5', title: '송파 토요 게스트런', date: '2026.05.17', result: 'W 60-58', mvp: false },
];
window.ME_RECENT_POSTS = [
  { id: 'cp-203', title: '[송파] 평일 야간 가드 1명 구합니다', cat: 'recruit', date: '2026.05.29' },
  { id: 'cp-211', title: '2-3 지역방어 깨는 하이포스트 활용', cat: 'info', date: '2026.05.20' },
];

// ============================================================
// 7) PA1 — super-admin 사용자 검수 (User.status / isAdmin / cross-domain stat)
// ============================================================
window.ADMIN_USERS = [
  // super-admin 4명 (isAdmin desc — 운영 정렬 답습) — 본인 맨 위
  { id: 'u-1',  public_id: 'rdm_captain', nickname: '박수빈', avatar: '박', email: 'subin.park@mybdr.kr', isAdmin: true, status: 'active', is_me: true,
    rating: 4.8, last_login: '2026-05-30T08:12:00', created: '2024-03-12', games: 86, hosted: 23, titles: 1, level: 14 },
  { id: 'u-2',  public_id: 'bdr_news', nickname: 'BDR 알기자', avatar: 'B', email: 'press@mybdr.kr', isAdmin: true, status: 'active', is_official: true,
    rating: null, last_login: '2026-05-30T07:40:00', created: '2024-01-04', games: 0, hosted: 0, titles: 0, level: 9 },
  { id: 'u-3',  public_id: 'site_op_kim', nickname: '김운영', avatar: '김', email: 'op.kim@mybdr.kr', isAdmin: true, status: 'active',
    rating: 4.6, last_login: '2026-05-29T22:05:00', created: '2024-01-04', games: 31, hosted: 12, titles: 0, level: 11 },
  { id: 'u-4',  public_id: 'admin_jung', nickname: '정대표', avatar: '정', email: 'ceo@mybdr.kr', isAdmin: true, status: 'active',
    rating: null, last_login: '2026-05-28T18:30:00', created: '2023-11-20', games: 4, hosted: 1, titles: 0, level: 6 },
  // 일반 active
  { id: 'u-21', public_id: 'kim_jihoon', nickname: '김지훈', avatar: '김', email: 'jihoon.k@example.com', isAdmin: false, status: 'active',
    rating: 4.9, last_login: '2026-05-30T09:01:00', created: '2024-05-18', games: 124, hosted: 41, titles: 6, level: 19 },
  { id: 'u-22', public_id: 'lee_taewoo', nickname: '이태우', avatar: '이', email: 'taewoo@example.com', isAdmin: false, status: 'active',
    rating: 4.7, last_login: '2026-05-29T20:18:00', created: '2024-06-02', games: 98, hosted: 8, titles: 3, level: 16 },
  { id: 'u-23', public_id: 'jung_sh', nickname: '정성훈', avatar: '정', email: 'sh.jung@example.com', isAdmin: false, status: 'active',
    rating: 4.8, last_login: '2026-05-27T11:42:00', created: '2024-09-11', games: 76, hosted: 19, titles: 2, level: 14 },
  { id: 'u-24', public_id: 'han_jiwon', nickname: '한지원', avatar: '한', email: 'jiwon.han@example.com', isAdmin: false, status: 'active',
    rating: 5.0, last_login: '2026-05-30T06:55:00', created: '2025-02-20', games: 44, hosted: 22, titles: 1, level: 12 },
  { id: 'u-25', public_id: 'baek_sh', nickname: '백승호', avatar: '백', email: 'seungho.b@example.com', isAdmin: false, status: 'active',
    rating: 3.2, last_login: '2026-03-02T13:10:00', created: '2025-04-30', games: 12, hosted: 0, titles: 0, level: 4 },
  // 정지
  { id: 'u-99', public_id: 'user_8841', nickname: 'user_8841', avatar: 'U', email: 'flagged841@example.com', isAdmin: false, status: 'suspended',
    rating: 2.1, last_login: '2026-05-12T03:22:00', created: '2025-12-08', games: 6, hosted: 9, titles: 0, level: 3, suspended_at: '2026-05-26' },
  { id: 'u-87', public_id: 'baller_kim', nickname: 'baller_kim', avatar: 'B', email: 'dispute.kim@example.com', isAdmin: false, status: 'suspended',
    rating: 2.8, last_login: '2026-05-20T19:44:00', created: '2025-07-15', games: 33, hosted: 2, titles: 0, level: 7, suspended_at: '2026-05-24' },
  // 신규 (최근 7일)
  { id: 'u-31', public_id: 'newbie_seo', nickname: '서민재', avatar: '서', email: 'minjae.seo@example.com', isAdmin: false, status: 'active', is_new: true,
    rating: null, last_login: '2026-05-30T10:20:00', created: '2026-05-29', games: 1, hosted: 0, titles: 0, level: 1 },
  { id: 'u-32', public_id: 'rookie_oh', nickname: '오제니', avatar: '오', email: 'jenny.oh@example.com', isAdmin: false, status: 'active', is_new: true,
    rating: null, last_login: '2026-05-28T15:05:00', created: '2026-05-26', games: 0, hosted: 0, titles: 0, level: 1 },
];

// ============================================================
// 8) Helpers
// ============================================================
window.HAND_LABEL = { right: '오른손', left: '왼손', both: '양손' };
window.SKILL_LABEL = { beginner: '입문', intermediate: '중급', advanced: '고급', pro: '선출/프로' };

window.pmDateShort = function pmDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return ('' + d.getFullYear()).slice(2) + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');
};
window.pmRelLogin = function pmRelLogin(iso) {
  if (!iso) return '무로그인';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  const d = Math.floor(diff / 86400);
  if (d < 30) return d + '일 전';
  if (d < 90) return Math.floor(d / 7) + '주 전';
  return Math.floor(d / 30) + '개월 전';
};

// publicView — BP1 핵심: USER_ME → privacy_settings 필터링된 공개 객체
window.publicView = function publicView(u) {
  const p = u.privacy_settings || {};
  return {
    ...u,
    email: p.email ? u.email : null,
    phone: p.phone ? u.phone : null,
    bank_name: null, account_number: null,   // 결제·은행 = 공개 항상 hide
    bio: p.bio ? u.bio : null,
    show_region: p.region !== false,
    show_height_weight: p.height_weight !== false,
    show_season_stat: p.season_stat !== false,
    show_teams: p.teams !== false,
    show_activity: p.activity !== false,
    show_achievements: p.achievements !== false,
  };
};

// ============================================================
// 9) Mini Components
// ============================================================

// LevelBadge — L.N 게이미피케이션 레벨
window.LevelBadge = function LevelBadge({ level, pro = false }) {
  return (
    <span className="pm-lvl">
      <span className="pm-lvl__n">L.{level}</span>
      {pro && <span className="pm-lvl__pro">PRO</span>}
    </span>
  );
};

// HandSkill — dominant_hand + skill_level chip row (PU3-A)
window.SkillChip = function SkillChip({ skill }) {
  return <span className="pm-skill" data-s={skill}>{window.SKILL_LABEL[skill] || skill}</span>;
};

// StatCard — 시즌 stat 카드 (PU3-B / PU5-A 공용)
window.StatCard = function StatCard({ icon, label, value, sub, tone = '', cross = false }) {
  return (
    <div className={'pm-stat' + (tone ? ' pm-stat--' + tone : '')}>
      <div className="pm-stat__top">
        <span className="ico material-symbols-outlined">{icon}</span>
        {cross && <span className="pm-stat__cross" title="다른 영역 데이터">cross-domain</span>}
      </div>
      <div className="pm-stat__val">{value}</div>
      <div className="pm-stat__lbl">{label}</div>
      {sub && <div className="pm-stat__sub">{sub}</div>}
    </div>
  );
};

// BadgeTile — 업적 배지 타일 (PU4 grid / PU1·PU5 mini)
window.BadgeTile = function BadgeTile({ badge, mini = false }) {
  const locked = !badge.earned_at;
  return (
    <div className={'pm-badge' + (locked ? ' pm-badge--locked' : '') + (mini ? ' pm-badge--mini' : '')} data-tone={badge.tone}>
      <div className="pm-badge__ico">
        <span className="ico material-symbols-outlined">{locked ? 'lock' : badge.ico}</span>
      </div>
      <div className="pm-badge__name">{badge.name}</div>
      {!mini && <div className="pm-badge__desc">{badge.desc}</div>}
      {!mini && (
        <div className="pm-badge__date">{locked ? '미획득' : window.pmDateShort(badge.earned_at)}</div>
      )}
    </div>
  );
};

// UserStatusBadge — PA1 active/suspended/admin
window.UserStatusBadge = function UserStatusBadge({ status, isAdmin, isOfficial }) {
  if (isAdmin) return <span className="pm-ubadge" data-s="admin"><span className="ico material-symbols-outlined">verified_user</span>{isOfficial ? '봇/공식' : '관리자'}</span>;
  if (status === 'suspended') return <span className="pm-ubadge" data-s="suspended"><span className="ico material-symbols-outlined">block</span>정지</span>;
  return <span className="pm-ubadge" data-s="active"><span className="ico material-symbols-outlined">check_circle</span>활성</span>;
};

// PageBack — 모바일 백버튼 (운영 PageBackButton 답습)
window.PageBack = function PageBack({ to = '프로필' }) {
  return (
    <a className="pm-back" href="pu1-profile.html">
      <span className="ico material-symbols-outlined">arrow_back_ios_new</span>
      {to}
    </a>
  );
};
