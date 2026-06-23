/* global window */
// =====================================================================
// admin-data3.jsx — 콘솔 잔여 8화면 mock (분석/리포트/알림/캠페인/파트너/요금제/제안/로그)
// =====================================================================
const D3D = window.ADMIN;

// 분석
D3D.ANALYTICS = {
  kpis: [
    { icon: 'user-plus', label: '신규 가입(30일)', value: '1,284', delta: '+8.2%', trend: 'up' },
    { icon: 'repeat', label: '재방문율', value: '63%', delta: '+2.1%', trend: 'up' },
    { icon: 'calendar-check', label: '대회 참가율', value: '74%', delta: '−1.4%', trend: 'down' },
    { icon: 'won-sign', label: '월 매출', value: '3,820만', delta: '+12%', trend: 'up' },
  ],
  region: [['서울', 42], ['경기', 28], ['인천', 11], ['부산', 9], ['대구', 6], ['기타', 14]],
  funnel: [['방문', 100], ['가입', 58], ['팀 등록', 34], ['대회 신청', 21], ['참가 확정', 16]],
};

// 경기 리포트(신고)
D3D.REPORTS = [
  { id: 'r1', target: '게시글 #4821', kind: '욕설', reason: '비방성 댓글 다수', reporter: '강도현', status: 'pending', when: '2026-06-20 14:02' },
  { id: 'r2', target: 'thunderdunk', kind: '비매너', reason: '경기 중 폭언', reporter: '오영진', status: 'pending', when: '2026-06-20 09:11' },
  { id: 'r3', target: '경기 #882', kind: '노쇼', reason: '상대팀 미출석', reporter: '한지석', status: 'resolved', when: '2026-06-19 21:30' },
  { id: 'r4', target: 'no_chill', kind: '광고', reason: '상업적 도배', reporter: '서민지', status: 'resolved', when: '2026-06-19 11:48' },
  { id: 'r5', target: '게시글 #4790', kind: '도용', reason: '사진 무단 사용', reporter: '박하늘', status: 'rejected', when: '2026-06-18 16:20' },
];
D3D.REPORT_STATUS = { pending: { label: '대기', tone: 'warn' }, resolved: { label: '처리완료', tone: 'ok' }, rejected: { label: '기각', tone: 'grey' } };

// 알림
D3D.NOTIS = [
  { id: 'n1', title: '서머 오픈 #4 접수 시작 안내', target: '전체', channel: '앱', sent: 18243, status: 'sent', when: '2026-06-20 10:00' },
  { id: 'n2', title: '대기 접수 자리 발생 안내', target: '대기팀', channel: 'SMS', sent: 12, status: 'sent', when: '2026-06-19 18:30' },
  { id: 'n3', title: '6월 정기점검 안내', target: '전체', channel: '앱', sent: 0, status: 'scheduled', when: '2026-06-25 02:00' },
  { id: 'n4', title: '입금 확인 요청', target: '미입금팀', channel: '이메일', sent: 0, status: 'draft', when: '—' },
];
D3D.NOTI_STATUS = { sent: { label: '발송완료', tone: 'ok' }, scheduled: { label: '예약', tone: 'primary' }, draft: { label: '임시저장', tone: 'grey' } };

// 캠페인
D3D.CAMPAIGNS = [
  { id: 'cp1', name: '여름 챌린지 배너', type: '배너', period: '06/01~06/30', views: 84200, clicks: 3120, status: 'active' },
  { id: 'cp2', name: 'PRO 구독 프로모션', type: '푸시', period: '06/15~06/22', views: 18243, clicks: 940, status: 'active' },
  { id: 'cp3', name: '신규 코트 오픈 알림', type: '배너', period: '05/20~06/05', views: 51200, clicks: 1880, status: 'ended' },
  { id: 'cp4', name: '가을 리그 사전등록', type: '푸시', period: '07/01~07/15', views: 0, clicks: 0, status: 'scheduled' },
];
D3D.CAMP_STATUS = { active: { label: '진행중', tone: 'ok' }, ended: { label: '종료', tone: 'grey' }, scheduled: { label: '예약', tone: 'primary' } };

// 파트너
D3D.PARTNERS = [
  { id: 'pt1', name: '나이키 코리아', field: '용품', region: '전국', manager: '김파트', status: 'active' },
  { id: 'pt2', name: '장충체육관', field: '시설', region: '서울 중구', manager: '이시설', status: 'active' },
  { id: 'pt3', name: '스포츠몬스터', field: '용품', region: '경기', manager: '박몬스', status: 'pending' },
  { id: 'pt4', name: 'KBL 아카데미', field: '교육', region: '서울', manager: '정아카', status: 'active' },
];
D3D.PARTNER_STATUS = { active: { label: '계약중', tone: 'ok' }, pending: { label: '협의중', tone: 'warn' }, ended: { label: '종료', tone: 'grey' } };

// 요금제 (카드)
D3D.PLANS = [
  { id: 'pl1', name: 'Free', price: 0, subs: 16800, feats: ['기본 매칭', '팀 1개', '대회 참가'], active: true, accent: false },
  { id: 'pl2', name: 'PRO', price: 9900, subs: 1284, feats: ['무제한 팀', '기록·통계', '우선 매칭', '광고 제거'], active: true, accent: true },
  { id: 'pl3', name: 'TEAM', price: 39000, subs: 159, feats: ['단체 운영', '대회 개최', '심판 배정', '정산 관리'], active: true, accent: false },
];

// 제안
D3D.SUGGESTIONS = [
  { id: 's1', title: '경기 일정 캘린더 연동', author: '오영진', cat: '기능', votes: 142, status: 'reviewing' },
  { id: 's2', title: '팀 채팅방 추가', author: '강도현', cat: '기능', votes: 98, status: 'planned' },
  { id: 's3', title: '코트 리뷰 사진 첨부', author: '서민지', cat: '개선', votes: 64, status: 'reviewing' },
  { id: 's4', title: '다크모드 지원', author: '한지석', cat: '개선', votes: 211, status: 'planned' },
  { id: 's5', title: '경기 영상 업로드', author: '박하늘', cat: '기능', votes: 37, status: 'hold' },
];
D3D.SUG_STATUS = { reviewing: { label: '검토중', tone: 'warn' }, planned: { label: '반영예정', tone: 'primary' }, hold: { label: '보류', tone: 'grey' } };

// 감사 로그
D3D.LOGS = [
  { id: 'lg1', action: '대회 생성', target: 'BDR 서머 오픈 #4', who: '김도훈', sev: 'ok', when: '2026-06-20 14:02' },
  { id: 'lg2', action: '유저 정지', target: 'thunderdunk', who: '이박재', sev: 'danger', when: '2026-06-20 11:20' },
  { id: 'lg3', action: '권한 변경', target: 'u_lee_park → tournament_admin', who: '김도훈', sev: 'primary', when: '2026-06-19 16:40' },
  { id: 'lg4', action: '환불 처리', target: '클러치 · 70,000원', who: '정세훈', sev: 'warn', when: '2026-06-19 10:05' },
  { id: 'lg5', action: '게시글 숨김', target: '게시글 #4790', who: '이박재', sev: 'warn', when: '2026-06-18 16:22' },
];
D3D.LOG_SEV = { ok: 'var(--ok)', danger: 'var(--danger)', primary: 'var(--primary)', warn: 'var(--warn)' };
