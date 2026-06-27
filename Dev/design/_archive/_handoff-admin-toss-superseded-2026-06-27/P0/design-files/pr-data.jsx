/* global window */
// =====================================================================
// pr-data.jsx — partner-admin · referee mock (Toss 재스킨)
// =====================================================================
const PR = {};

// ── Partner ───────────────────────────────────────────────────────────
PR.PARTNER = { name: '장충체육관', kind: '시설 파트너' };
PR.P_KPIS = [
  { icon: 'calendar-check', label: '이번달 예약', value: '128', delta: '+14%', trend: 'up' },
  { icon: 'banknote', label: '정산 예정', value: '420만', delta: '+8%', trend: 'up' },
  { icon: 'star', label: '평점', value: '4.8', delta: '+0.1', trend: 'up' },
  { icon: 'megaphone', label: '진행 캠페인', value: '2', trend: 'flat' },
];
PR.VENUES = [
  { id: 'v1', name: '장충체육관 A코트', type: '실내', rate: 80000, slots: '06~24시', status: 'active' },
  { id: 'v2', name: '장충체육관 B코트', type: '실내', rate: 60000, slots: '06~24시', status: 'active' },
  { id: 'v3', name: '야외 농구장', type: '실외', rate: 0, slots: '06~22시', status: 'maintenance' },
];
PR.V_STATUS = { active: { label: '운영중', tone: 'ok' }, maintenance: { label: '점검중', tone: 'warn' }, closed: { label: '폐쇄', tone: 'grey' } };
PR.P_CAMPAIGNS = [
  { id: 'pc1', name: '주중 할인 프로모션', period: '06/01~06/30', views: 12400, bookings: 86, status: 'active' },
  { id: 'pc2', name: '신규 회원 첫 예약 무료', period: '06/10~07/10', views: 8200, bookings: 54, status: 'active' },
  { id: 'pc3', name: '5월 가정의달 이벤트', period: '05/01~05/31', views: 21000, bookings: 142, status: 'ended' },
];
PR.PC_STATUS = { active: { label: '진행중', tone: 'ok' }, ended: { label: '종료', tone: 'grey' }, scheduled: { label: '예약', tone: 'primary' } };

// ── Referee ───────────────────────────────────────────────────────────
PR.REF = { name: '정세훈', grade: '2급 심판' };
PR.R_KPIS = [
  { icon: 'flag', label: '이번달 배정', value: '12', delta: '+3', trend: 'up' },
  { icon: 'check-circle-2', label: '완료 경기', value: '9', trend: 'flat' },
  { icon: 'banknote', label: '정산 예정', value: '54만', delta: '+18만', trend: 'up' },
  { icon: 'star', label: '평점', value: '4.9', trend: 'flat' },
];
PR.ASSIGNMENTS = [
  { id: 'a1', match: '슬로우 vs 런앤건', tn: '강남구협회장배 #9', court: '장충체육관', when: '2026-06-22 19:00', role: '주심', status: 'confirmed' },
  { id: 'a2', match: 'D4 8강 1경기', tn: '서머 오픈 #4', court: '올림픽공원', when: '2026-06-23 14:00', role: '부심', status: 'confirmed' },
  { id: 'a3', match: 'D3 4강', tn: '강남구협회장배 #9', court: '장충체육관', when: '2026-06-25 16:00', role: '주심', status: 'pending' },
  { id: 'a4', match: '결승전', tn: '서머 오픈 #4', court: '잠실학생체육관', when: '2026-06-28 18:00', role: '대기심', status: 'pending' },
];
PR.A_STATUS = { confirmed: { label: '확정', tone: 'ok' }, pending: { label: '수락 대기', tone: 'warn' }, declined: { label: '거절', tone: 'grey' } };
PR.SETTLEMENTS = [
  { id: 's1', period: '2026-06', games: 9, amount: 540000, status: 'pending' },
  { id: 's2', period: '2026-05', games: 14, amount: 840000, status: 'paid' },
  { id: 's3', period: '2026-04', games: 11, amount: 660000, status: 'paid' },
];
PR.S_STATUS = { pending: { label: '정산 예정', tone: 'warn' }, paid: { label: '지급완료', tone: 'ok' } };

window.PR = PR;
