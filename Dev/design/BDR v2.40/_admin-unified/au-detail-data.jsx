/* global window */
// =====================================================================
// au-detail-data.jsx — 콘솔 상세(드릴다운) 화면 mock
//   대회 참가팀·대진표·정산 / 유저 활동 / 팀 로스터 / 단체 소속 /
//   코트 예약 / 경기 기록. 디자인 목업용 공용 샘플(엔티티당 1세트).
// =====================================================================
const DD = window.ADMIN;

// ── 대회: 참가팀 ──────────────────────────────────────────────────────
DD.TN_TEAMS = [
  { id: 'e1', name: '슬로우', division: '일반 1부', region: '서울 강남', seed: 1, members: 9, paid: 'paid', captain: '오영진' },
  { id: 'e2', name: '하프코트', division: '일반 1부', region: '서울 송파', seed: 2, members: 8, paid: 'paid', captain: '강도현' },
  { id: 'e3', name: '런앤건', division: '일반 1부', region: '경기 성남', seed: 3, members: 7, paid: 'paid', captain: '한지석' },
  { id: 'e4', name: '식스맨', division: '일반 1부', region: '서울 마포', seed: 4, members: 10, paid: 'paid', captain: '서민지' },
  { id: 'e5', name: '백보드', division: '일반 2부', region: '인천 연수', seed: 5, members: 6, paid: 'paid', captain: '윤재호' },
  { id: 'e6', name: '클러치', division: '일반 2부', region: '서울 강서', seed: 6, members: 8, paid: 'pending', captain: '조상혁' },
  { id: 'e7', name: '올드보이즈', division: '마스터 40+', region: '경기 분당', seed: 7, members: 5, paid: 'paid', captain: '박하늘' },
  { id: 'e8', name: '점프볼', division: '마스터 40+', region: '서울 노원', seed: 8, members: 7, paid: 'refunded', captain: '정세훈' },
];
DD.ENTRY_STATUS = { paid: { label: '입금완료', tone: 'ok' }, pending: { label: '입금대기', tone: 'warn' }, refunded: { label: '환불', tone: 'grey' } };

// ── 대회: 대진표 (8강 토너먼트) ───────────────────────────────────────
DD.TN_BRACKET = [
  { round: '8강', matches: [
    { a: '슬로우', b: '점프볼', sa: 68, sb: 41, done: true },
    { a: '클러치', b: '식스맨', sa: 55, sb: 60, done: true },
    { a: '하프코트', b: '올드보이즈', sa: 72, sb: 49, done: true },
    { a: '백보드', b: '런앤건', sa: 51, sb: 58, done: true },
  ]},
  { round: '4강', matches: [
    { a: '슬로우', b: '식스맨', sa: 64, sb: 62, done: true },
    { a: '하프코트', b: '런앤건', sa: 70, sb: 55, done: true },
  ]},
  { round: '결승', matches: [
    { a: '슬로우', b: '하프코트', sa: 0, sb: 0, done: false },
  ]},
];

// ── 대회: 정산 ────────────────────────────────────────────────────────
DD.TN_SETTLE = {
  rows: [
    ['참가비 수입', '56팀 × 80,000원', 4480000, 'in'],
    ['심판 배정비', '12경기 × 60,000원', -720000, 'out'],
    ['코트 대관료', '장충체육관 3일', -900000, 'out'],
    ['시상·운영비', '트로피·메달·진행', -640000, 'out'],
    ['환불', '점프볼 1팀', -80000, 'out'],
  ],
};

// ── 유저: 활동 ────────────────────────────────────────────────────────
DD.U_TIMELINE = [
  { sev: 'ok', action: '대회 참가 신청', desc: '강남구협회장배 #9 · 슬로우', when: '2026-06-18 14:20' },
  { sev: 'primary', action: 'PRO 구독 갱신', desc: '9,900원 · 카드', when: '2026-06-15 09:01' },
  { sev: 'ok', action: '경기 기록', desc: '슬로우 vs 런앤건 · 22득점 8어시', when: '2026-06-12 21:30' },
  { sev: 'warn', action: '게스트 모집 마감', desc: '강남 주말 픽업 · 4명 확정', when: '2026-06-10 18:00' },
  { sev: 'primary', action: '팀 가입', desc: '식스맨 합류', when: '2026-05-28 11:12' },
];
DD.U_GAMES = [
  { id: 'ug1', title: '슬로우 vs 런앤건', when: '2026-06-12', pts: 22, reb: 5, ast: 8, result: 'W' },
  { id: 'ug2', title: '강남 주말 픽업', when: '2026-06-08', pts: 14, reb: 9, ast: 3, result: '-' },
  { id: 'ug3', title: '식스맨 vs 클러치', when: '2026-06-01', pts: 18, reb: 4, ast: 6, result: 'L' },
  { id: 'ug4', title: '하프코트 vs 백보드', when: '2026-05-25', pts: 27, reb: 6, ast: 4, result: 'W' },
];

// ── 팀: 로스터 ────────────────────────────────────────────────────────
DD.TM_ROSTER = [
  { id: 'm1', name: '오영진', no: 7, pos: '가드', role: '주장', games: 184, pts: 18.4 },
  { id: 'm2', name: '강도현', no: 11, pos: '포워드', role: '선수', games: 96, pts: 14.1 },
  { id: 'm3', name: '한지석', no: 3, pos: '가드', role: '선수', games: 142, pts: 11.8 },
  { id: 'm4', name: '서민지', no: 23, pos: '센터', role: '선수', games: 88, pts: 9.6 },
  { id: 'm5', name: '윤재호', no: 5, pos: '포워드', role: '선수', games: 64, pts: 8.2 },
];
DD.TM_RESULTS = [
  { id: 'tr1', tn: '강남구협회장배 #8', result: '우승', record: '5승 0패', when: '2026-04' },
  { id: 'tr2', tn: 'BDR 서머 오픈 #3', result: '4강', record: '3승 1패', when: '2026-03' },
  { id: 'tr3', tn: '주말 리그전 3월', result: '준우승', record: '4승 1패', when: '2026-03' },
];

// ── 단체: 소속 팀 ─────────────────────────────────────────────────────
DD.ORG_TEAMS = [
  { id: 'ot1', name: '슬로우', region: '서울 강남', members: 9, status: 'active' },
  { id: 'ot2', name: '식스맨', region: '서울 마포', members: 10, status: 'active' },
  { id: 'ot3', name: '백코트', region: '서울 용산', members: 7, status: 'active' },
  { id: 'ot4', name: '리바운더스', region: '서울 강북', members: 6, status: 'dormant' },
];
DD.ORG_ADMINS = [
  { id: 'oa1', name: '오영진', role: '대표', phone: '010-1234-1248' },
  { id: 'oa2', name: '강도현', role: '총무', phone: '010-3456-4011' },
];

// ── 코트: 예약 ────────────────────────────────────────────────────────
DD.COURT_BOOKINGS = [
  { id: 'cb1', who: '슬로우', use: '팀 훈련', date: '2026-06-22', time: '19:00~21:00', status: 'confirmed' },
  { id: 'cb2', who: '강남 픽업게임', use: '픽업', date: '2026-06-22', time: '21:00~23:00', status: 'confirmed' },
  { id: 'cb3', who: '강남구협회장배 #9', use: '대회', date: '2026-06-24', time: '09:00~18:00', status: 'pending' },
  { id: 'cb4', who: '식스맨', use: '팀 훈련', date: '2026-06-25', time: '20:00~22:00', status: 'confirmed' },
];
DD.COURT_BOOK_STATUS = { confirmed: { label: '확정', tone: 'ok' }, pending: { label: '대기', tone: 'warn' }, cancelled: { label: '취소', tone: 'grey' } };
DD.COURT_AMENITIES = ['실내 우레탄', '샤워실', '주차 30대', '관중석 200석', '전광판', '대여 라커'];

// ── 경기: 기록 ────────────────────────────────────────────────────────
DD.GAME_DETAIL = {
  quarters: [['1Q', 18, 15], ['2Q', 16, 14], ['3Q', 19, 20], ['4Q', 15, 12]],
  lineupA: [
    { no: 7, name: '오영진', pos: '가드', pts: 22 },
    { no: 11, name: '강도현', pos: '포워드', pts: 16 },
    { no: 3, name: '한지석', pos: '가드', pts: 12 },
    { no: 23, name: '서민지', pos: '센터', pts: 10 },
    { no: 5, name: '윤재호', pos: '포워드', pts: 8 },
  ],
  lineupB: [
    { no: 9, name: '조상혁', pos: '가드', pts: 18 },
    { no: 14, name: '박하늘', pos: '포워드', pts: 14 },
    { no: 21, name: '정세훈', pos: '센터', pts: 11 },
    { no: 4, name: '이준서', pos: '가드', pts: 9 },
    { no: 12, name: '김태양', pos: '포워드', pts: 9 },
  ],
};

window.ADMIN = DD;
