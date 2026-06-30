/* global window */
// =====================================================================
// au-extra-data.jsx — 통합 콘솔 추가 mock (시즌 시상 / BDR NEWS / 종별 마스터)
// =====================================================================
const AX = window.ADMIN;

// 시즌 시상 (super_admin 직접 입력)
AX.AWARDS = [
  { id: 'aw1', season: '2026 봄시즌', category: '정규리그 MVP', winner: '오영진', team: '슬로우', status: 'published', when: '2026-05-10' },
  { id: 'aw2', season: '2026 봄시즌', category: '득점왕', winner: '강도현', team: '하프코트', status: 'published', when: '2026-05-10' },
  { id: 'aw3', season: '2026 봄시즌', category: '베스트 수비', winner: '한지석', team: '런앤건', status: 'draft', when: '—' },
  { id: 'aw4', season: '2026 봄시즌', category: '매너상', winner: '서민지', team: '식스맨', status: 'draft', when: '—' },
  { id: 'aw5', season: '2025 가을시즌', category: '정규리그 MVP', winner: '윤재호', team: '백보드', status: 'published', when: '2025-11-22' },
];
AX.AWARD_STATUS = { published: { label: '공개', tone: 'ok' }, draft: { label: '작성중', tone: 'grey' } };

// BDR NEWS (알기자 콘텐츠 검수)
AX.NEWS = [
  { id: 'nw1', title: '강남구협회장배 #9 접수 마감 임박 — 잔여 32팀', author: '알기자', cat: '대회', views: 2840, status: 'published', when: '2026-05-15' },
  { id: 'nw2', title: '5월 주말 픽업게임 베스트 코트 5선', author: '알기자', cat: '코트', views: 1620, status: 'published', when: '2026-05-14' },
  { id: 'nw3', title: '슬로우, 봄대회 우승 인터뷰 “팀워크가 전부”', author: '알기자', cat: '인터뷰', views: 980, status: 'review', when: '2026-05-13' },
  { id: 'nw4', title: '신규 코트 3곳 오픈 안내', author: '운영팀', cat: '공지', views: 0, status: 'draft', when: '—' },
];
AX.NEWS_STATUS = { published: { label: '게시', tone: 'ok' }, review: { label: '검수중', tone: 'warn' }, draft: { label: '임시저장', tone: 'grey' } };

// 종별 마스터 (admin_categories)
AX.CATEGORIES = [
  { id: 'cat1', name: '일반부', code: 'OPEN', divisions: ['1부', '2부', '3부'], ages: '제한없음', teams: 142, active: true },
  { id: 'cat2', name: '청년부', code: 'YOUTH', divisions: ['1부', '2부'], ages: '만 19~29', teams: 86, active: true },
  { id: 'cat3', name: '마스터즈', code: 'MASTERS', divisions: ['40+', '50+'], ages: '만 40 이상', teams: 54, active: true },
  { id: 'cat4', name: '유소년부', code: 'JUNIOR', divisions: ['U12', 'U15', 'U18'], ages: '만 18 이하', teams: 38, active: true },
  { id: 'cat5', name: '여성부', code: 'WOMEN', divisions: ['1부', '2부'], ages: '제한없음', teams: 27, active: true },
  { id: 'cat6', name: '대학부', code: 'COLLEGE', divisions: ['1부'], ages: '재학생', teams: 12, active: false },
];

window.ADMIN = AX;
