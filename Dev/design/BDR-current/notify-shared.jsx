/* global React */
// ============================================================
// BDR v2.29 — notify-shared.jsx
// Phase 9 (알림·메시지·검색) 박제 공용. 사용자 3 + super-admin 1.
// shared / profile / court-shared 답습.
//
// ★ Prisma: notifications (활성) · messages 모델 = 없음 (DB 0% · 정적 더미 + "준비 중").
// BN1 NotifCategory + main bar 카운트 · BN2 메시지 carry · BN3 검색 cross-domain Phase 1~8 · BN4 발송.
// ============================================================

// ============================================================
// 1) NotifCategory enum (carry) + 카테고리 메타
// ============================================================
window.NOTIF_CATS = [
  { key: 'all',        label: '전체',   ico: 'notifications' },
  { key: 'tournament', label: '대회',   ico: 'emoji_events',     tone: 'red',   href: 'ua1-tournaments.html' },
  { key: 'game',       label: '경기',   ico: 'sports_basketball', tone: 'blue',  href: 'p2-ua1-games.html' },
  { key: 'team',       label: '팀',     ico: 'groups',            tone: 'green', href: 'tu1-teams.html' },
  { key: 'community',  label: '커뮤니티', ico: 'forum',           tone: 'gold',  href: 'cu1-community-list.html' },
  { key: 'system',     label: '시스템', ico: 'campaign',          tone: 'mute',  href: '#' },
];
window.NOTIF_CAT_MAP = Object.fromEntries(window.NOTIF_CATS.map(c => [c.key, c]));

// 알림 list (notifications 모델)
window.NOTIFICATIONS = [
  { id: 'n1', cat: 'tournament', title: 'BDR 서머 오픈 #4 접수 마감 임박', content: '참가 신청이 내일 자정에 마감됩니다.', time: '방금', status: 'unread', href: 'ua2-tournament-detail.html' },
  { id: 'n2', cat: 'game', title: '경기 초대 — 강동 실내코트', content: '백승호님이 목요일 20:00 픽업 게임에 초대했어요.', time: '12분 전', status: 'unread', href: 'p2-ua2-game-detail.html' },
  { id: 'n3', cat: 'team', title: 'REDEEM 농구단 — 새 멤버 신청', content: '한지원님이 팀 가입을 신청했습니다.', time: '1시간 전', status: 'unread', href: 'tu3-team-manage.html' },
  { id: 'n4', cat: 'game', title: '경기 결과가 등록됐어요', content: '5월 21일 잠실 경기 결과를 확인하세요. (78:74 승)', time: '3시간 전', status: 'read', href: 'p2-ub1-game-result.html' },
  { id: 'n5', cat: 'community', title: '내 게시글에 댓글 3개', content: '"강남 코트 추천" 글에 새 댓글이 달렸어요.', time: '5시간 전', status: 'read', href: 'cu2-community-detail.html' },
  { id: 'n6', cat: 'tournament', title: '대진표가 공개됐어요', content: 'BDR 봄 리그 16강 대진표를 확인하세요.', time: '어제', status: 'read', href: 'ua2-tournament-detail.html' },
  { id: 'n7', cat: 'system', title: 'BDR PRO 결제가 완료됐어요', content: '6월 구독료 ₩9,900이 정상 결제됐습니다.', time: '어제', status: 'read', href: 'bu3-profile-billing.html' },
  { id: 'n8', cat: 'team', title: 'SWEEP 팀 단톡 — 경기 준비물 공지', content: '이번주 경기 준비물이 공지됐습니다.', time: '2일 전', status: 'read', href: 'tu2-team-detail.html' },
  { id: 'n9', cat: 'community', title: '팔로우한 코트에 새 픽업 모집', content: '장충체육관에 새 픽업 게임이 모집 중이에요.', time: '3일 전', status: 'read', href: 'vu2-court-detail.html' },
  { id: 'n10', cat: 'system', title: '본인 인증이 완료됐어요', content: '대회 참가와 매칭을 이용할 수 있어요.', time: '4일 전', status: 'read', href: 'gu3-profile-settings.html' },
];

// ============================================================
// 2) NU2 Messages — 정적 더미 (DB 미지원 carry)
// ============================================================
window.MSG_THREADS = [
  { id: 't1', name: 'block (블럭)', tag: 'BK', color: '#16a34a', online: true, last: '목요일 저녁 하남미사 픽업 자리 확정됐습니다', time: '14:32', unread: 2, team: 'BLOCK', pinned: true },
  { id: 't2', name: '3POINT_슈', tag: '3P', color: '#1B3C87', online: true, last: '내일 연습경기 몇시쯤 시작하나요?', time: '13:08', unread: 1, team: '3POINT' },
  { id: 't3', name: '몽키즈_센터', tag: 'MK', color: '#B47A11', online: false, last: '영상 편집본 받아보시면 말씀해주세요', time: '어제', unread: 0, team: 'MONKEYS' },
  { id: 't4', name: 'SWEEP 팀 단톡', tag: 'SW', color: '#B47A11', online: false, last: 'SWEEP: 이번주 경기 준비물 공지합니다', time: '어제', unread: 0, team: 'SWEEP', group: true, members: 12 },
  { id: 't5', name: 'kings_cap', tag: 'KG', color: '#7C2D12', online: false, last: '5월 첫째주 가능하신가요?', time: '04.21', unread: 0 },
  { id: 't6', name: '운영팀 (BDR)', tag: 'AD', color: 'var(--accent)', online: true, last: '대회 접수가 완료되었습니다.', time: '04.20', unread: 0, official: true },
  { id: 't7', name: 'pivot_mia', tag: 'PV', color: '#8B5CF6', online: false, last: '반포 토요일 자리 한 명 빠져서요', time: '04.19', unread: 0 },
  { id: 't8', name: 'REDEEM 팀 단톡', tag: 'RDM', color: '#DC2626', online: false, last: 'rdm_captain: 내일 훈련 장소 변경', time: '04.18', unread: 0, team: 'REDEEM', group: true, members: 8 },
];
window.MSG_CONVO = [
  { from: 'them', time: '14:15', body: '안녕하세요! 목요일 픽업 관심있다고 하셨는데 아직 자리 있으세요?' },
  { from: 'me', time: '14:18', body: '네 가능합니다. 포지션은 가드고 L.8입니다.' },
  { from: 'them', time: '14:20', body: '딱 좋네요. 저희 가드 한명 모자랐거든요.' },
  { from: 'them', time: '14:21', body: '6:4 팀 분배고 21점 선취제로 진행합니다. 참가비는 현장에서 5,000원이에요.' },
  { from: 'me', time: '14:25', body: '좋습니다. 농구화 따로 챙겨가야 하나요?' },
  { from: 'them', time: '14:28', body: '네 실내화는 필수입니다. 탈의실이랑 샤워실도 사용가능해요.' },
  { from: 'them', time: '14:32', body: '목요일 저녁 하남미사 픽업 자리 확정됐습니다 👍', attach: { title: '목요일 저녁 하남미사 픽업', date: '04.25 · 20:30', court: '미사강변체육관' } },
];

// ============================================================
// 3) NU3 Search — cross-domain 결과 (Phase 1~8)
// ============================================================
window.SEARCH_CATS = [
  { key: 'all',        label: '전체',     ico: 'search' },
  { key: 'game',       label: '경기',     ico: 'sports_basketball', href: 'p2-ua1-games.html' },
  { key: 'tournament', label: '대회',     ico: 'emoji_events',      href: 'ua1-tournaments.html' },
  { key: 'team',       label: '팀',       ico: 'groups',            href: 'tu1-teams.html' },
  { key: 'court',      label: '코트',     ico: 'stadium',           href: 'vu1-courts.html' },
  { key: 'user',       label: '유저',     ico: 'person',            href: 'pu5-user-public.html' },
  { key: 'community',  label: '커뮤니티', ico: 'forum',             href: 'cu1-community-list.html' },
];
window.SEARCH_RESULTS = {
  game: [
    { title: '목요일 저녁 하남미사 픽업', meta: '04.25 20:30 · 미사강변체육관', href: 'p2-ua2-game-detail.html' },
    { title: '강동 실내코트 5:5 풀코트', meta: '05.30 19:00 · 강동 실내코트', href: 'p2-ua2-game-detail.html' },
  ],
  tournament: [
    { title: 'BDR 서머 오픈 #4', meta: '접수 중 · 서울 · 16/32팀', href: 'ua2-tournament-detail.html' },
    { title: 'BDR 봄 리그 2026', meta: '진행 중 · 서울', href: 'ua2-tournament-detail.html' },
  ],
  team: [
    { title: 'REDEEM 농구단', meta: '서울 · 멤버 8명', href: 'tu2-team-detail.html' },
    { title: 'BLOCK', meta: '하남 · 멤버 14명', href: 'tu2-team-detail.html' },
  ],
  court: [
    { title: '장충체육관 2코트', meta: '서울 중구 · ★ 4.8', href: 'vu2-court-detail.html' },
    { title: '강동 실내코트', meta: '서울 강동구 · ★ 4.4', href: 'vu2-court-detail.html' },
  ],
  user: [
    { title: '박수빈', meta: 'PG · 서울 · Lv.14', href: 'pu5-user-public.html' },
    { title: '김지훈', meta: 'SF · 서울', href: 'pu5-user-public.html' },
  ],
  community: [
    { title: '강남 코트 추천 부탁드려요', meta: '정보공유 · 댓글 12', href: 'cu2-community-detail.html' },
    { title: '목요일 게스트 구합니다', meta: '팀원모집 · 댓글 5', href: 'cu2-community-detail.html' },
  ],
};
window.SEARCH_RECENT = ['장충체육관', '서머 오픈', 'REDEEM', '강동 픽업'];
window.SEARCH_SUGGEST = ['픽업 게임', '주말 대회', '실내 코트', '게스트 모집'];

// ============================================================
// 4) NA1 — 발송 이력 (admin)
// ============================================================
window.NA1_TARGETS = [
  { key: 'all',    label: '전체 유저',   ico: 'public', count: 5284 },
  { key: 'active', label: '일반 유저',   ico: 'person', count: 5096 },
  { key: 'leader', label: '팀장',        ico: 'shield_person', count: 142 },
  { key: 'admin',  label: '관리자',      ico: 'admin_panel_settings', count: 12 },
];
window.NA1_HISTORY = [
  { id: 'h1', title: 'BDR 서머 오픈 접수 시작 안내', target: '전체 유저', recipients: 5284, cat: 'tournament', time: '2026-06-06 10:00', sender: '운영팀' },
  { id: 'h2', title: '6월 정기 점검 안내 (새벽 2–4시)', target: '전체 유저', recipients: 5284, cat: 'system', time: '2026-06-04 18:30', sender: '운영팀' },
  { id: 'h3', title: '팀장 전용 — 신규 운영 도구 안내', target: '팀장', recipients: 142, cat: 'team', time: '2026-06-02 14:00', sender: '운영팀' },
  { id: 'h4', title: 'BDR PRO 봄 프로모션 (50% 할인)', target: '일반 유저', recipients: 5096, cat: 'system', time: '2026-05-28 11:00', sender: '운영팀' },
  { id: 'h5', title: '커뮤니티 이용 수칙 업데이트', target: '전체 유저', recipients: 5284, cat: 'community', time: '2026-05-20 09:00', sender: '운영팀' },
];
window.NA1_STATS = { total: 48, this_month: 5, recipients_sum: 21090 };

// ============================================================
// 5) Mini Components
// ============================================================

// NotifIcon — 카테고리 아이콘 (tone별 색)
window.NotifIcon = function NotifIcon({ cat }) {
  const c = window.NOTIF_CAT_MAP[cat] || window.NOTIF_CAT_MAP.system;
  return (
    <span className="nt-ico" data-tone={c.tone || 'mute'}>
      <span className="ico material-symbols-outlined">{c.ico}</span>
    </span>
  );
};

// CatBadge — 카테고리 badge
window.CatBadge = function CatBadge({ cat }) {
  const c = window.NOTIF_CAT_MAP[cat] || window.NOTIF_CAT_MAP.system;
  return <span className="nt-catbadge" data-tone={c.tone || 'mute'}>{c.label}</span>;
};

// MsgAvatar — 스레드 아바타
window.MsgAvatar = function MsgAvatar({ tag, color, size = 44, online }) {
  return (
    <div className="nt-msgav" style={{ width: size, height: size, background: color, fontSize: Math.max(11, Math.floor(size * 0.32)) }}>
      {tag}
      {online && <span className="nt-msgav__dot"></span>}
    </div>
  );
};
