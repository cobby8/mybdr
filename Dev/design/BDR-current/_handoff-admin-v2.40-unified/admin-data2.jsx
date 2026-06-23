/* global window */

// =====================================================================
// admin-data2.jsx — 콘솔 Phase 2 화면 mock (대시보드/결제/코트/팀)
// =====================================================================
const D = window.ADMIN;

// ── 대시보드 ──────────────────────────────────────────────────────────
D.DASH = {
  stats: [
    { icon: 'users', label: '전체 유저', value: '18,243', delta: '+312 / 7일', trend: 'up' },
    { icon: 'trophy', label: '진행 대회', value: '47', delta: '+3 / 7일', trend: 'up' },
    { icon: 'volleyball', label: '진행중 경기', value: '124', delta: '−6 / 7일', trend: 'down' },
    { icon: 'shield', label: '등록 팀', value: '842', delta: '+24 / 7일', trend: 'up' },
  ],
  chart: [{ d: '05-09', n: 42 }, { d: '05-10', n: 58 }, { d: '05-11', n: 31 }, { d: '05-12', n: 71 }, { d: '05-13', n: 64 }, { d: '05-14', n: 89 }, { d: '05-15', n: 53 }],
  logs: [
    { id: 'l1', sev: 'ok', action: '대회 생성', desc: 'BDR 서머 오픈 #4 — 종별 4개 / 정원 44팀', who: '김도훈', when: '2분 전' },
    { id: 'l2', sev: 'warn', action: '신고 검토 보류', desc: '게시글 #4821 — 욕설 신고 3건', who: '이박재', when: '12분 전' },
    { id: 'l3', sev: 'primary', action: '유저 권한 변경', desc: 'u_lee_park → tournament_admin 부여', who: '김도훈', when: '38분 전' },
    { id: 'l4', sev: 'danger', action: '결제 실패', desc: '캠페인 cm_winter — 카드 인증 실패 7건', who: '시스템', when: '1시간 전' },
    { id: 'l5', sev: 'primary', action: '코트 등록', desc: '장충체육관 — 외부 단체 등록 / 승인 대기', who: '정세훈', when: '3시간 전' },
  ],
};

// ── 결제 ──────────────────────────────────────────────────────────────
D.PAYMENTS = [
  { id: 'pay1', ref: '슬로우 · 강남구협회장배', type: '참가비', amount: 80000, method: '계좌이체', status: 'paid', when: '2026-05-15 10:22' },
  { id: 'pay2', ref: '오영진 · BDR PRO 구독', type: '구독', amount: 9900, method: '카드', status: 'paid', when: '2026-05-15 09:01' },
  { id: 'pay3', ref: '하프코트 · 서머 오픈', type: '참가비', amount: 70000, method: '계좌이체', status: 'pending', when: '2026-05-14 18:40' },
  { id: 'pay4', ref: '런앤건 · 코트 예약', type: '예약', amount: 40000, method: '카드', status: 'paid', when: '2026-05-14 15:12' },
  { id: 'pay5', ref: '클러치 · 서머 오픈', type: '참가비', amount: 70000, method: '카드', status: 'refunded', when: '2026-05-13 11:30' },
  { id: 'pay6', ref: '백보드 · 캠페인 광고', type: '광고', amount: 150000, method: '카드', status: 'failed', when: '2026-05-13 02:11' },
];
D.PAY_STATUS = { paid: { label: '완료', tone: 'ok' }, pending: { label: '대기', tone: 'warn' }, refunded: { label: '환불', tone: 'grey' }, failed: { label: '실패', tone: 'danger' } };

// ── 코트 ──────────────────────────────────────────────────────────────
D.COURTS = [
  { id: 'c1', name: '장충체육관', region: '서울 중구', type: '실내', rate: 80000, status: 'active', owner: '서울시설공단' },
  { id: 'c2', name: '대치 코트', region: '서울 강남', type: '실외', rate: 0, status: 'active', owner: '공공' },
  { id: 'c3', name: '올림픽공원 농구장', region: '서울 송파', type: '실외', rate: 0, status: 'active', owner: '공공' },
  { id: 'c4', name: '망원 체육관', region: '서울 마포', type: '실내', rate: 50000, status: 'pending', owner: '마포구민체육센터' },
  { id: 'c5', name: '잠실학생체육관', region: '서울 송파', type: '실내', rate: 120000, status: 'active', owner: '서울시교육청' },
  { id: 'c6', name: '한강 농구장', region: '서울 영등포', type: '실외', rate: 0, status: 'inactive', owner: '공공' },
];
D.COURT_STATUS = { active: { label: '운영중', tone: 'ok' }, pending: { label: '승인대기', tone: 'warn' }, inactive: { label: '중단', tone: 'grey' } };

// ── 팀 ────────────────────────────────────────────────────────────────
D.TEAMS = [
  { id: 'tm1', name: '슬로우', region: '서울 강남', members: 9, org: '마포 슬램덩크 클럽', tournaments: 5, status: 'active' },
  { id: 'tm2', name: '런앤건', region: '경기 성남', members: 7, org: '—', tournaments: 3, status: 'active' },
  { id: 'tm3', name: '하프코트', region: '서울 송파', members: 8, org: '강남구농구협회', tournaments: 4, status: 'active' },
  { id: 'tm4', name: '백보드', region: '인천 연수', members: 6, org: '—', tournaments: 2, status: 'active' },
  { id: 'tm5', name: '식스맨', region: '서울 마포', members: 10, org: '마포 슬램덩크 클럽', tournaments: 6, status: 'active' },
  { id: 'tm6', name: '올드보이즈', region: '경기 분당', members: 5, org: '분당 농구사랑', tournaments: 1, status: 'dormant' },
];
D.TEAM_STATUS = { active: { label: '활성', tone: 'ok' }, dormant: { label: '휴면', tone: 'grey' } };
