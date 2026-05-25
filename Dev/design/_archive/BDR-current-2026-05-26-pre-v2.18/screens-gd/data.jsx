/* global window */
// Game detail redesign — shared game data + applicant roster
const GD_GAME = {
  title: '4월 26일 9시~11시 구의중학교 초청합니다',
  shortTitle: '구의중학교 초청 연습경기',
  kind: '연습경기',       // 연습경기 | 픽업 | 게스트
  status: '모집 중',     // 모집 전 | 모집 중 | 모집 마감
  court: '구의중학교 체육관',
  area: '서울 광진구',
  date: '2026.04.26 (일)',
  time: '09:00 – 11:00',
  countdown: 'D-2',
  level: '전체 환영',
  fee: '무료',
  spotsTotal: 10,
  spotsMin: 4,
  guest: '게스트 참여 가능',
  uniformHome: '#E31B23',
  uniformAway: '#1B3C87',
  host: { handle: 'wlsjfl88', name: '이진우', team: '일레이스', rating: 4.7, games: 23, level: '중급', avatar: '#1B3C87' },
  intro: [
    'HOME 팀명 : 일레이스',
    '일시 : 04월 26일 (일)',
    '장소 : 구의중학교 체육관 (실내)',
    '대관보조 : 2만원 (참가비 무료, 게스트 전원 동일)',
    '실력 : 전체 / 게스트 등급 무관',
    '주차 : 학교 정문 좌측 30분 무료',
  ],
  rules: [
    '경기 5분 전 도착',
    '농구화 지참 필수 (실내 코트)',
    '취소 시 3시간 전 통보',
  ],
};

const GD_APPLICANTS = [
  { id: 'a1', handle: 'hoops_jun',   name: '김지훈', pos: 'PG', level: '중급',  rating: 4.5, badge: '호스트팀',  color: '#E31B23' },
  { id: 'a2', handle: 'soo_min',     name: '이수민', pos: 'SF', level: '중급',  rating: 4.3, badge: null,        color: '#0F5FCC' },
  { id: 'a3', handle: 'pivot_jh',    name: '박재현', pos: 'C',  level: '상급',  rating: 4.8, badge: '단골',      color: '#10B981' },
  { id: 'a4', handle: 'mino_g',      name: '정민호', pos: 'SG', level: '중급',  rating: 4.2, badge: null,        color: '#F59E0B' },
  { id: 'a5', handle: 'ki_t',        name: '한기태', pos: 'PF', level: '초급',  rating: 3.9, badge: '게스트',    color: '#8B5CF6' },
  { id: 'a6', handle: 'do_h',        name: '윤도현', pos: 'PG', level: '상급',  rating: 4.6, badge: null,        color: '#EC4899' },
  { id: 'a7', handle: 'subin_s',     name: '송수빈', pos: 'SF', level: '중급',  rating: 4.1, badge: null,        color: '#06B6D4' },
];

const GD_ME = { handle: 'kimsoobin', name: '김수빈', pos: 'PG/SG/SF', level: '중급', rating: 4.2, games: 18 };

window.GD_GAME = GD_GAME;
window.GD_APPLICANTS = GD_APPLICANTS;
window.GD_ME = GD_ME;
