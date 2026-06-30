/* global window */

// =====================================================================
// admin-data.jsx — 관리자 콘솔 5화면 mock (Toss 리스킨)
//   기존 admin 시안 데이터 형태 유지 (사용자/대회/경기/커뮤니티/단체)
// =====================================================================

const ADMIN = {};

// ── 사용자 ────────────────────────────────────────────────────────────
ADMIN.USERS = [
  { id: 'u1', nickname: '오영진', email: 'oyj@example.com', phone: '010-1234-1248', tier: 'VVIP', status: 'active', region: '서울 마포', teams: 2, games: 184, lastSeen: '2026-05-15 11:42', joined: '2024-03-14', reports: 0 },
  { id: 'u2', nickname: '한지석', email: 'hjs@example.com', phone: '010-2345-2901', tier: 'VIP', status: 'active', region: '서울 송파', teams: 1, games: 142, lastSeen: '2026-05-15 09:18', joined: '2023-11-08', reports: 0 },
  { id: 'u3', nickname: '강도현', email: 'kdh@example.com', phone: '010-3456-4011', tier: 'A', status: 'active', region: '서울 서초', teams: 1, games: 96, lastSeen: '2026-05-14 22:14', joined: '2024-05-21', reports: 0 },
  { id: 'u4', nickname: '서민지', email: 'smj@example.com', phone: '010-4567-5023', tier: 'B', status: 'new', region: '서울 강남', teams: 1, games: 3, lastSeen: '2026-05-15 08:30', joined: '2026-05-08', reports: 0 },
  { id: 'u5', nickname: '박하늘', email: 'phn@example.com', phone: '010-5678-3322', tier: 'B', status: 'new', region: '서울 강서', teams: 1, games: 5, lastSeen: '2026-05-13 19:55', joined: '2026-04-30', reports: 0 },
  { id: 'u6', nickname: '윤재호', email: 'yjh@example.com', phone: '010-6789-9120', tier: 'C', status: 'dormant', region: '서울 서초', teams: 1, games: 24, lastSeen: '2025-11-12 14:01', joined: '2023-06-30', reports: 0 },
  { id: 'u7', nickname: '조상혁', email: 'csh@example.com', phone: '010-7890-6677', tier: 'C', status: 'dormant', region: '경기 분당', teams: 0, games: 18, lastSeen: '2025-12-04 21:18', joined: '2024-01-10', reports: 0 },
  { id: 'u8', nickname: 'thunderdunk', email: 'td@example.com', phone: '010-8901-1111', tier: 'F', status: 'suspended', region: '서울 광진', teams: 0, games: 8, lastSeen: '2026-04-22 02:11', joined: '2024-09-04', reports: 4 },
  { id: 'u9', nickname: 'no_chill', email: 'nc@example.com', phone: '010-9012-2222', tier: 'D', status: 'suspended', region: '서울 영등포', teams: 0, games: 12, lastSeen: '2026-05-02 23:48', joined: '2024-08-19', reports: 2 },
];
ADMIN.USER_STATUS = { active: { label: '활성', tone: 'ok' }, new: { label: '신규', tone: 'warn' }, dormant: { label: '휴면', tone: 'grey' }, suspended: { label: '정지', tone: 'danger' } };
ADMIN.TIER_TONE = { VVIP: 'primary', VIP: 'primary', A: 'primary', B: 'grey', C: 'grey', D: 'danger', F: 'danger' };

// ── 대회 ──────────────────────────────────────────────────────────────
ADMIN.TOURNAMENTS = [
  { id: 't1', name: '강남구협회장배 #9', status: 'registering', divisions: 9, teams: 56, cap: 88, start: '2026-08-15', organizer: 'BDR', fee: 80000 },
  { id: 't2', name: 'BDR 서머 오픈 #4', status: 'registering', divisions: 4, teams: 38, cap: 44, start: '2026-07-20', organizer: 'BDR', fee: 70000 },
  { id: 't3', name: '서울 유소년 페스타', status: 'closed', divisions: 6, teams: 64, cap: 64, start: '2026-06-28', organizer: '서울시농구협회', fee: 50000 },
  { id: 't4', name: '대학부 챔피언십', status: 'draft', divisions: 2, teams: 0, cap: 32, start: '2026-09-05', organizer: 'BDR', fee: 100000 },
  { id: 't5', name: '강남구협회장배 봄대회 #8', status: 'done', divisions: 9, teams: 82, cap: 88, start: '2026-04-12', organizer: 'BDR', fee: 80000 },
  { id: 't6', name: '주말 리그전 5월', status: 'done', divisions: 3, teams: 18, cap: 24, start: '2026-05-03', organizer: 'BDR', fee: 60000 },
];
ADMIN.TN_STATUS = { draft: { label: '작성중', tone: 'grey' }, registering: { label: '접수중', tone: 'primary' }, closed: { label: '마감', tone: 'warn' }, done: { label: '종료', tone: 'grey' } };

// ── 경기 ──────────────────────────────────────────────────────────────
ADMIN.GAMES = [
  { id: 'g1', title: '슬로우 vs 런앤건', type: 'match', court: '장충체육관', when: '2026-05-16 19:00', status: 'scheduled', players: 18 },
  { id: 'g2', title: '강남 픽업게임', type: 'pickup', court: '대치 코트', when: '2026-05-15 20:00', status: 'live', players: 10 },
  { id: 'g3', title: '하프코트 vs 백보드', type: 'match', court: '올림픽공원', when: '2026-05-15 18:00', status: 'finished', players: 16 },
  { id: 'g4', title: '마포 새벽농구', type: 'pickup', court: '망원 체육관', when: '2026-05-17 06:00', status: 'scheduled', players: 8 },
  { id: 'g5', title: '식스맨 vs 클러치', type: 'match', court: '잠실학생체육관', when: '2026-05-14 21:00', status: 'finished', players: 14 },
  { id: 'g6', title: '주말 3대3', type: 'pickup', court: '한강 농구장', when: '2026-05-18 14:00', status: 'cancelled', players: 0 },
];
ADMIN.GAME_STATUS = { scheduled: { label: '예정', tone: 'primary' }, live: { label: '진행중', tone: 'ok' }, finished: { label: '종료', tone: 'grey' }, cancelled: { label: '취소', tone: 'danger' } };
ADMIN.GAME_TYPE = { match: '매치', pickup: '픽업' };

// ── 커뮤니티 ──────────────────────────────────────────────────────────
ADMIN.POSTS = [
  { id: 'p1', title: '서머 오픈 #4 예선 후기 — 8강 진출!', board: '대회후기', author: '오영진', date: '2026-05-15', likes: 42, comments: 11, reports: 0, status: 'normal' },
  { id: 'p2', title: '강남 주말 픽업 같이 하실 분', board: '게스트모집', author: '강도현', date: '2026-05-14', likes: 8, comments: 5, reports: 0, status: 'normal' },
  { id: 'p3', title: '심판 배정 관련 문의드립니다', board: '자유게시판', author: '한지석', date: '2026-05-14', likes: 3, comments: 7, reports: 0, status: 'normal' },
  { id: 'p4', title: '(광고) 농구화 싸게 팝니다 링크', board: '자유게시판', author: 'no_chill', date: '2026-05-13', likes: 0, comments: 1, reports: 3, status: 'reported' },
  { id: 'p5', title: '코트 예약 취소 환불 언제 되나요', board: '문의', author: '서민지', date: '2026-05-13', likes: 1, comments: 2, reports: 0, status: 'normal' },
  { id: 'p6', title: '비방성 댓글 신고합니다', board: '자유게시판', author: 'thunderdunk', date: '2026-05-12', likes: 0, comments: 0, reports: 2, status: 'hidden' },
];
ADMIN.POST_STATUS = { normal: { label: '정상', tone: 'ok' }, reported: { label: '신고', tone: 'danger' }, hidden: { label: '숨김', tone: 'grey' } };

// ── 단체 ──────────────────────────────────────────────────────────────
ADMIN.ORGS = [
  { id: 'o1', name: '강남구농구협회', type: '협회', region: '서울 강남', teams: 24, members: 312, owner: '김협회', status: 'approved' },
  { id: 'o2', name: '서울시농구협회', type: '협회', region: '서울', teams: 86, members: 1240, owner: '이대표', status: 'approved' },
  { id: 'o3', name: '마포 슬램덩크 클럽', type: '동호회', region: '서울 마포', teams: 4, members: 48, owner: '오영진', status: 'approved' },
  { id: 'o4', name: '분당 농구사랑', type: '동호회', region: '경기 분당', teams: 6, members: 72, owner: '조상혁', status: 'pending' },
  { id: 'o5', name: '대학농구연맹', type: '연맹', region: '전국', teams: 18, members: 240, owner: '박연맹', status: 'pending' },
];
ADMIN.ORG_STATUS = { approved: { label: '승인', tone: 'ok' }, pending: { label: '대기', tone: 'warn' }, rejected: { label: '반려', tone: 'danger' } };

window.ADMIN = ADMIN;
