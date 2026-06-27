/* global window */

// =====================================================================
// toss-data.jsx — 관리자 Toss 모듈 데이터 (P0)
//   레퍼런스: BDR-join-v1 admin_categories(종별 마스터) + teams/players
// =====================================================================

// ── 진행방식 (TournamentDivisionRule.format) ──────────────────────────
const METHODS = {
  single_elimination:   { code: 'single_elimination',   label: '토너먼트',          short: '토너먼트', icon: 'git-fork' },
  group_stage_knockout: { code: 'group_stage_knockout', label: '조별리그 + 토너먼트', short: '조별+토너', icon: 'layout-grid' },
  full_league:          { code: 'full_league',          label: '리그전',            short: '리그전',  icon: 'table' },
  dual_tournament:      { code: 'dual_tournament',      label: '더블 엘리미네이션',   short: '더블엘리', icon: 'split' },
};

// ── 종별 마스터 (admin_categories) — 사용자 실제 데이터 4종 시드 복원 ────
//   { id, name(종별명), divisions: string[], ages: string[] }
const CATEGORY_MASTER = [
  { id: 'cm-general', name: '일반부',   divisions: ['D3', 'D4', 'D5', 'D6', 'D7', 'D8'], ages: [] },
  { id: 'cm-youth',   name: '유청소년', divisions: ['하모니', 'i1', 'i2', 'i3', 'i4'], ages: ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18'] },
  { id: 'cm-univ',    name: '대학부',   divisions: ['U1', 'U2', 'U3'], ages: [] },
  { id: 'cm-senior',  name: '시니어',   divisions: ['S1', 'S2', 'S3'], ages: ['+40', '+45', '+50', '+55', '+60', '+65', '+70'] },
];

const GENDERS = ['남성', '여성', '혼성'];

// ── 내 팀 (참가신청 Step1 — 로그인 사용자가 가입한 팀들) ─────────────────
//   각 팀은 기존 로스터(가입 선수) 보유 → 신청 시 선택만.
function player(name, no, pos, birth, elite) { return { id: `p_${name}_${no}`, name, no, pos, birth, elite }; }

const MY_TEAMS = [
  {
    id: 'team-slow', name_ko: '슬로우', name_en: 'SLOW', manager: '오영진', phone: '01023456789',
    province: '서울', city: '강남구', uniformHome: '#3182F6', uniformAway: '#FFFFFF',
    roster: [
      player('오영진', '4', 'PG', '910302', false), player('김상우', '7', 'SG', '930511', false),
      player('이재현', '11', 'SF', '950820', true), player('박도윤', '23', 'PF', '920104', false),
      player('정해성', '32', 'C', '900715', true), player('최우진', '5', 'G', '960228', false),
      player('강민호', '9', 'F', '940612', false), player('윤서준', '14', 'G', '970319', false),
      player('임지호', '21', 'F', '930925', false),
    ],
  },
  {
    id: 'team-clutch', name_ko: '클러치', name_en: 'CLUTCH', manager: '오영진', phone: '01023456789',
    province: '서울', city: '서초구', uniformHome: '#191F28', uniformAway: '#FF9500',
    roster: [
      player('한동석', '3', 'PG', '980412', false), player('서지훈', '8', 'SG', '991103', false),
      player('남기준', '15', 'SF', '970725', true), player('오영진', '10', 'PF', '910302', false),
      player('배준영', '24', 'C', '960518', false), player('신우혁', '6', 'G', '000204', false),
    ],
  },
];

// ── mock 정원/집계 (Step2 디비전 — div_caps + 현재 신청 수) ──────────────
const DIVISION_CAPS = {
  'D3': { cap: 16, current: 16 },  // 정원 초과 → 대기접수
  'D4': { cap: 16, current: 12 },
  'D5': { cap: 24, current: 9 },
  'D6': { cap: 24, current: 3 },
  'i2': { cap: 12, current: 8 },
  'i3': { cap: 12, current: 12 },  // 대기접수
  'U15': { cap: 16, current: 6 },
};

// ── 참가팀 관리 mock (대회상세 — teams) ──────────────────────────────────
//   status: APPLIED | WAITING | CONFIRMED | CANCELED · payment: pending|paid|refunded
const ADMIN_TEAMS = [
  { id: 'at1', name_ko: '슬로우', name_en: 'SLOW', manager: '오영진', phone: '01023456789', province: '서울', city: '강남구', category: '남성 일반부', division: 'D3', players: 9, status: 'CONFIRMED', payment: 'paid' },
  { id: 'at2', name_ko: '런앤건', name_en: 'RUN&GUN', manager: '이재현', phone: '01034567890', province: '경기', city: '성남시', category: '남성 일반부', division: 'D3', players: 7, status: 'APPLIED', payment: 'pending' },
  { id: 'at3', name_ko: '하프코트', name_en: 'HALFCOURT', manager: '박도윤', phone: '01045678901', province: '서울', city: '송파구', category: '남성 일반부', division: 'D4', players: 8, status: 'APPLIED', payment: 'paid' },
  { id: 'at4', name_ko: '백보드', name_en: 'BACKBOARD', manager: '정해성', phone: '01056789012', province: '인천', city: '연수구', category: '남성 일반부', division: 'D4', players: 6, status: 'WAITING', payment: 'pending' },
  { id: 'at5', name_ko: '식스맨', name_en: 'SIXTH MAN', manager: '최우진', phone: '01067890123', province: '서울', city: '마포구', category: '여성 일반부', division: 'D5', players: 10, status: 'CONFIRMED', payment: 'paid' },
  { id: 'at6', name_ko: '클러치', name_en: 'CLUTCH', manager: '한동석', phone: '01078901234', province: '서울', city: '서초구', category: '유청소년', division: 'i2', players: 8, status: 'APPLIED', payment: 'pending' },
];

const STATUS_OPTS = [
  { v: 'APPLIED', label: '접수완료', tone: 'ok' },
  { v: 'WAITING', label: '대기접수', tone: 'warn' },
  { v: 'CONFIRMED', label: '참가확정', tone: 'primary' },
  { v: 'CANCELED', label: '취소', tone: 'danger' },
];
const PAYMENT_OPTS = [
  { v: 'pending', label: '미입금', tone: 'warn' },
  { v: 'paid', label: '입금완료', tone: 'ok' },
  { v: 'refunded', label: '환불완료', tone: 'grey' },
];

window.TOSS = {
  METHODS, CATEGORY_MASTER, GENDERS, MY_TEAMS, DIVISION_CAPS, ADMIN_TEAMS, STATUS_OPTS, PAYMENT_OPTS,
  TOURNAMENT: { name: '강남구협회장배 #9', date: '2026-08-15', venue: '장충체육관', fee: 80000, bank: '국민은행', account: '123456-78-901234', holder: 'BDR운영위' },
};
