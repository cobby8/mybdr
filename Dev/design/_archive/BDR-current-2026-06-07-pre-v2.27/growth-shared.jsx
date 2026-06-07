/* global React */
// ============================================================
// BDR v2.26 — growth-shared.jsx
// Phase 6.3 (마이페이지 후반부 — 성장·주간리포트·설정) 보강 공용.
// shared / profile-shared / billing-shared 답습. Phase 6 묶음 종료.
//
// ★ 모두 옛 v2 박제됨 (보강) — GU1 v2.2 / GU2 v2.4 / GU3 v2.3.
// BG1 GU1 마일스톤 = PU4 user_badges 정합 (profile-shared BADGE_CATALOG)
// BG2 GU2 KPI 4 = PU3 시즌 stat 정합 (profile-shared SEASON_STAT)
// BG3 GU3 billing 섹션 = BU3 ProfileBilling link (billing-shared MY_SUBSCRIPTION)
// ============================================================

// ============================================================
// 1) GU1 — ProfileGrowth (게이미피케이션 + 12주 추이 + 마일스톤 6)
// ============================================================
window.GROWTH = {
  level: 14, xp: 4820, next_level_xp: 5200, title: '코트 지배자', emoji: '🏀', streak: 6,
  // 12주 추이 (DB 미지원 — 주간 집계 큐 별도 → "준비 중" 라벨)
  weekly_games:   [4, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 8],
  weekly_ratings: [3.8, 3.9, 4.0, 4.1, 4.0, 4.2, 4.3, 4.4, 4.3, 4.5, 4.6, 4.6],
  // 마일스톤 6 (PU4 user_badges 시각 정합 · isDummy = DB 미지원)
  milestones: [
    { ico: 'sports_basketball', label: '누적 경기',   val: '86',   goal: '100', pct: 86, tone: 'red',   dummy: false },
    { ico: 'star',              label: '평균 평점',   val: '4.8',  goal: '5.0', pct: 96, tone: 'gold',  dummy: false },
    { ico: 'local_fire_department', label: '시즌 MVP', val: '3회', goal: '-',  pct: 100, tone: 'red',  dummy: false },
    { ico: 'calendar_month',    label: '연속 출석',   val: '6주',  goal: '24주', pct: 25, tone: 'blue', dummy: false },
    { ico: 'forum',             label: '커뮤니티 활동', val: '128', goal: '200', pct: 64, tone: 'green', dummy: true },
    { ico: 'handshake',         label: '팀 멤버 추천', val: '8',   goal: '10',  pct: 80, tone: 'blue',  dummy: true },
  ],
  next_goal: { label: '누적 50경기', remaining: 0, done: true, label2: '누적 100경기', remaining2: 14 },
};

// ============================================================
// 2) GU2 — WeeklyReport (KPI 4 + 인사이트 + TOP 3 코트 + 비교)
// ============================================================
window.WEEKLY = {
  nickname: '박수빈', level: 14, title: '코트 지배자', emoji: '🏀', streak: 6,
  week_label: '2026년 22주차', prev_label: 'W21', period: '05.25 (월) – 05.31 (일)',
  this_week: { session_count: 5, total_minutes: 540, unique_courts: 3, active_days: 4, total_xp: 320 },
  last_week: { session_count: 4, total_minutes: 480, unique_courts: 2, active_days: 3, total_xp: 260 },
  // KPI 4 (시안 v2.4 슬롯 · 평균 평점 = 운영 미지원 placeholder)
  kpis: [
    { label: '경기',      val: 5,   prev: 4,   unit: '회',   tone: 'red',  has: true },
    { label: '평균 평점', val: null, prev: null, unit: '/5.0', tone: 'blue', has: false },
    { label: 'XP',        val: 320, prev: 260, unit: 'XP',   tone: 'ok',   has: true },
    { label: '활동 시간', val: 9,   prev: 8,   unit: '시간', tone: 'gold', has: true },
  ],
  insights: [
    { ico: 'trending_up', text: '지난주보다 경기 1회, 활동 시간 1시간 늘었어요. 꾸준함이 빛나고 있어요.' },
    { ico: 'schedule',    text: '주로 야간(20–22시)에 활동했어요. 같은 시간대 픽업이 활발합니다.' },
    { ico: 'groups',      text: 'rdm 농구단과 3경기를 함께했어요. 팀 케미가 오르는 중!' },
  ],
  top_courts: [
    { name: '장충체육관 2코트', addr: '서울 중구',  visits: 4 },
    { name: '송파 다목적체육관 A', addr: '서울 송파구', visits: 3 },
    { name: '잠실학생체육관 1코트', addr: '서울 송파구', visits: 2 },
  ],
  // 다음 주 추천 3 (DB 미지원 — 추천엔진 → "곧 제공")
  next_recommends: ['수요 정기런 (송파)', '주말 게스트 매치', '서머 오픈 8강'],
};

// ============================================================
// 3) GU3 — ProfileSettings (7 섹션 + 좌측 sticky nav)
// ============================================================
window.SETTINGS_SECTIONS = [
  { key: 'account',   ico: 'person',           label: '계정·보안',   desc: '이메일 · 비밀번호 · 본인인증' },
  { key: 'feed',      ico: 'tune',             label: '피드·선호',   desc: '관심 지역 · 종별 · 추천 설정' },
  { key: 'notify',    ico: 'notifications',    label: '알림',        desc: '카카오 · 이메일 · 푸시' },
  { key: 'bottomNav', ico: 'bottom_navigation', label: '하단 메뉴',  desc: '모바일 빠른 메뉴 편집' },
  { key: 'billing',   ico: 'credit_card',      label: '결제·구독',   desc: '플랜 · 결제 수단 · 이력' },
  { key: 'display',   ico: 'palette',          label: '화면·테마',   desc: '다크 모드 · 글자 크기' },
  { key: 'danger',    ico: 'warning',          label: '계정 삭제',   desc: '계정 영구 삭제', danger: true },
];

// ============================================================
// 4) Helpers / Mini Components
// ============================================================

// XP progress %
window.gwXpPct = function gwXpPct() {
  const g = window.GROWTH;
  return Math.min(Math.round((g.xp / g.next_level_xp) * 100), 100);
};

// Spark — 12주 막대 (경기 수)
window.GrowthSpark = function GrowthSpark({ data }) {
  const max = Math.max(...data);
  return (
    <div className="gw-spark">
      {data.map((v, i) => (
        <div key={i} className="gw-spark__col">
          <div className="gw-spark__bar" style={{ height: Math.max((v / max) * 100, 6) + '%' }} data-last={i === data.length - 1}></div>
          <span className="gw-spark__x">{i + 1}</span>
        </div>
      ))}
    </div>
  );
};

// RatingLine — 12주 평점 추이 (경량 SVG polyline · 데이터 시각화)
window.GrowthLine = function GrowthLine({ data, min = 3.5, max = 5.0 }) {
  const W = 100, H = 32;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((v - min) / (max - min)) * H;
    return x.toFixed(1) + ',' + y.toFixed(1);
  }).join(' ');
  const last = data[data.length - 1];
  return (
    <div className="gw-line">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="gw-line__svg">
        <polyline points={pts} fill="none" stroke="var(--cafe-blue)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="gw-line__range"><span>{min.toFixed(1)}</span><span className="gw-line__cur">현재 {last.toFixed(1)}</span><span>{max.toFixed(1)}</span></div>
    </div>
  );
};

// MilestoneTile — 마일스톤 카드 (PU4 BadgeTile 시각 정합)
window.MilestoneTile = function MilestoneTile({ m }) {
  return (
    <div className="gw-mile" data-tone={m.tone}>
      <div className="gw-mile__top">
        <span className="gw-mile__ico"><span className="ico material-symbols-outlined">{m.ico}</span></span>
        {m.dummy && <span className="gw-soon"><span className="ico material-symbols-outlined">schedule</span>준비 중</span>}
      </div>
      <div className="gw-mile__val">{m.val}<span className="gw-mile__goal"> / {m.goal}</span></div>
      <div className="gw-mile__label">{m.label}</div>
      <div className="gw-mile__track"><div className="gw-mile__fill" style={{ width: m.pct + '%' }}></div></div>
    </div>
  );
};

// ComingSoon — "곧 제공" 배지 (warn-soft 통일)
window.ComingSoon = function ComingSoon() {
  return <span className="gw-soon"><span className="ico material-symbols-outlined">schedule</span>곧 제공</span>;
};

// KpiCard — 주간 KPI (delta vs 지난주)
window.KpiCard = function KpiCard({ k, prevLabel }) {
  const diff = k.has ? k.val - k.prev : 0;
  const up = diff > 0, flat = diff === 0;
  return (
    <div className="gw-kpi" data-tone={k.tone}>
      <div className="gw-kpi__label">{k.label}</div>
      <div className="gw-kpi__val">{k.has ? k.val : '—'}<span className="gw-kpi__unit">{k.unit}</span></div>
      {k.has
        ? <div className="gw-kpi__delta" data-dir={flat ? 'flat' : up ? 'up' : 'down'}>{flat ? '—' : (up ? '▲' : '▼') + ' ' + Math.abs(diff)} <span>vs {prevLabel}</span></div>
        : <div className="gw-kpi__delta" data-dir="na">집계 예정</div>}
    </div>
  );
};
