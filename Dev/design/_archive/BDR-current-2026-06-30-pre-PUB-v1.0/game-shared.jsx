/* global React */
// ============================================================
// BDR v2.20 — game-shared.jsx
// Phase 2 (경기 영역) 박제 공용 데이터 + mini components
// shared.jsx 의 AppNav / AdminShell 답습 + 본 파일은 데이터 / chip / step indicator만
// ============================================================

// ============================================================
// 1) 경기 (Games) 시안 — UA1 / UA2 / UC2 / UB1 / UC1 공용
// ============================================================
window.GM_DATA = {
  list: [
    {
      id: 'gm-1', kind: 'pickup',
      title: '강남 평일 픽업 5x5',
      host: { name: '박수빈', avatar: '박' },
      area: '강남구',
      court: '강남구민체육센터',
      starts_at: '2026-05-29', time: '20:00',
      duration: 120,
      status: 'open',         // 모집 중
      spots_now: 7, spots_max: 10,
      fee: 8000,
      auto_approve: true,
      guest_allowed: false,
      live: false,
    },
    {
      id: 'gm-2', kind: 'guest',
      title: '게스트 모집 — 마포 평일 야간',
      host: { name: '김도현', avatar: '김' },
      area: '마포구',
      court: '마포구민체육센터',
      starts_at: '2026-05-30', time: '21:00',
      duration: 90,
      status: 'open',
      spots_now: 9, spots_max: 10,
      fee: 12000,
      auto_approve: false,
      guest_allowed: true,
      min_years: 2,
      live: false,
    },
    {
      id: 'gm-3', kind: 'pickup',
      title: 'U10 결승 · 강남BC vs 마포FC',
      host: { name: '강남구협회', avatar: '강' },
      area: '잠실',
      court: '잠실학생체육관',
      starts_at: '2026-05-28', time: '19:00',
      duration: 80,
      status: 'live',         // 라이브 중
      spots_now: 10, spots_max: 10,
      fee: 0,
      live: true,
      live_label: 'Q3 14-10',
      live_minutes: 5,
      tn_id: 'tn-2',
      tn_name: '강남구협회장배 봄',
    },
    {
      id: 'gm-4', kind: 'scrimmage',
      title: '주말 연습경기 — 서초',
      host: { name: '이태우', avatar: '이' },
      area: '서초구',
      court: '서초구민체육센터',
      starts_at: '2026-05-31', time: '14:00',
      duration: 120,
      status: 'open',
      spots_now: 12, spots_max: 12,
      fee: 5000,
      auto_approve: true,
      guest_allowed: false,
      live: false,
    },
    {
      id: 'gm-5', kind: 'guest',
      title: '용산 게스트 — 일요일 오전',
      host: { name: '윤호석', avatar: '윤' },
      area: '용산구',
      court: '용산구민체육센터',
      starts_at: '2026-06-01', time: '10:00',
      duration: 120,
      status: 'open',
      spots_now: 6, spots_max: 10,
      fee: 10000,
      auto_approve: false,
      guest_allowed: true,
      min_years: 3,
      live: false,
    },
    {
      id: 'gm-6', kind: 'pickup',
      title: '봄맞이 마포컵 결승',
      host: { name: '마포구체육회', avatar: '마' },
      area: '마포구',
      court: '마포구민체육센터',
      starts_at: '2026-03-16', time: '17:30',
      duration: 90,
      status: 'completed',    // 종료
      spots_now: 10, spots_max: 10,
      fee: 0,
      champion: '강남BC',
      mvp: '김지훈',
      final_score: '78-72',
      tn_id: 'tn-5',
      tn_name: '봄맞이 마포컵',
    },
    {
      id: 'gm-7', kind: 'pickup',
      title: '평일 픽업 — 송파',
      host: { name: '정성훈', avatar: '정' },
      area: '송파구',
      court: '송파구민체육센터',
      starts_at: '2026-05-15', time: '20:00',
      duration: 90,
      status: 'completed',
      spots_now: 10, spots_max: 10,
      fee: 6000,
      mvp: '박재현',
      final_score: null,      // 일반 픽업 — score 추적 없음
    },
    {
      id: 'gm-8', kind: 'pickup',
      title: 'U15 4강 — 서초유스 vs 용산레전드',
      host: { name: '강남구협회', avatar: '강' },
      area: '잠실',
      court: '잠실학생체육관',
      starts_at: '2026-05-28', time: '20:30',
      duration: 80,
      status: 'live',
      spots_now: 10, spots_max: 10,
      fee: 0,
      live: true,
      live_label: 'Q2 22-18',
      live_minutes: 3,
      tn_id: 'tn-2',
      tn_name: '강남구협회장배 봄',
    },
  ],
};

// 내 경기 — UC1 MyActivity 의 "내 경기" 섹션 + UA2 step indicator 공용
window.MY_GAMES = [
  {
    id: 'mg-1',
    game_id: 'gm-2',
    title: '게스트 모집 — 마포 평일 야간',
    kind: 'guest',
    host: '김도현',
    court: '마포구민체육센터',
    starts_at: '2026-05-30',
    time: '21:00',
    status: 'pending',         // 승인 대기 (BG1)
    step_idx: 1,               // 0=신청 1=호스트 승인 대기 2=참가 확정
    applied_at: '2026-05-27 22:30',
  },
  {
    id: 'mg-2',
    game_id: 'gm-1',
    title: '강남 평일 픽업 5x5',
    kind: 'pickup',
    host: '박수빈',
    court: '강남구민체육센터',
    starts_at: '2026-05-29',
    time: '20:00',
    status: 'approved',        // 참가 확정
    step_idx: 2,
    applied_at: '2026-05-26 18:00',
    approved_at: '2026-05-26 21:15',
  },
  {
    id: 'mg-3',
    game_id: 'gm-3',
    title: 'U10 결승 · 강남BC vs 마포FC',
    kind: 'pickup',
    host: '강남구협회',
    court: '잠실학생체육관',
    starts_at: '2026-05-28',
    time: '19:00',
    status: 'live',            // 진행 중
    step_idx: 2,
    applied_at: '2026-05-20 12:00',
    approved_at: '2026-05-21 09:00',
  },
  {
    id: 'mg-4',
    game_id: 'gm-6',
    title: '봄맞이 마포컵 결승',
    kind: 'pickup',
    host: '마포구체육회',
    court: '마포구민체육센터',
    starts_at: '2026-03-16',
    time: '17:30',
    status: 'completed',       // 종료
    step_idx: 2,
    applied_at: '2026-02-20 09:00',
    approved_at: '2026-02-21 11:00',
  },
  {
    id: 'mg-5',
    game_id: 'gm-9',
    title: '강북구 평일 픽업',
    kind: 'pickup',
    host: '윤호석',
    court: '강북구민체육센터',
    starts_at: '2026-05-22',
    time: '21:00',
    status: 'rejected',        // 거절
    step_idx: 1,
    applied_at: '2026-05-19 22:00',
    rejected_at: '2026-05-20 08:30',
    reject_reason: '실력 기준 미충족',
  },
];

// 내 매너 — UC1 + UD2 공용 (BG2 = 평균 + flag 종류만, 개별 건수 ❌)
window.MY_MANNER = {
  avg: 4.3,                    // 1-5 평점
  total_evaluations: 32,       // "32명에게 평가 받음" (개별 건수가 아닌 평가자 수)
  // flag 종류만 (개별 건수 ❌)
  positive_flags: ['on_time', 'good_attitude', 'team_play'],
  negative_flags: ['late_5min'],
};

// flag key → 한국어 라벨 매핑 (UC1 / UD2 공용)
window.MANNER_FLAG_LABELS = {
  on_time: { label: '시간 약속 잘 지킴', emoji: '👍', tone: 'ok' },
  good_attitude: { label: '좋은 매너', emoji: '👍', tone: 'ok' },
  team_play: { label: '팀 플레이 좋음', emoji: '👍', tone: 'ok' },
  fair_play: { label: '페어 플레이', emoji: '👍', tone: 'ok' },
  late_5min: { label: '5분 이상 늦음', emoji: '⚠', tone: 'warn' },
  late: { label: '약속 시간 늦음', emoji: '⚠', tone: 'warn' },
  no_show: { label: '노쇼', emoji: '🚫', tone: 'err' },
  rough_play: { label: '거친 플레이', emoji: '⚠', tone: 'warn' },
  bad_attitude: { label: '비매너', emoji: '🚫', tone: 'err' },
};

// ============================================================
// 2) 라이브 (UA5 / UC2 LIVE chip row 공용)
// ============================================================
window.LIVE_NOW = [
  {
    id: 'gm-3', title: 'U10 결승 · 강남BC vs 마포FC',
    label: 'Q3 14-10', minutes: 5,
    tn: { id: 'tn-2', name: '강남구협회장배 봄', round: '결승' },
    kind: 'tn',
  },
  {
    id: 'gm-8', title: 'U15 4강 · 서초유스 vs 용산레전드',
    label: 'Q2 22-18', minutes: 3,
    tn: { id: 'tn-2', name: '강남구협회장배 봄', round: '4강' },
    kind: 'tn',
  },
  {
    id: 'gm-live-3', title: '강남 평일 픽업',
    label: '진행 12분', minutes: 12,
    tn: null,
    kind: 'pickup',
  },
];

// ============================================================
// 3) GameResult (UB1) 데이터 — /games/[id] status='completed' variant
// ============================================================
window.GM_COMPLETED = {
  id: 'gm-r-1',
  game_id: 'gm-3',
  title: 'U10 결승',
  kind: 'tn',
  ended_at: '2026-05-28 21:15',
  duration: 85,
  court: '잠실학생체육관',
  tn: { name: '강남구협회장배 봄', round: '결승' },
  home: { name: '강남BC', logo: '강', color: 'var(--cafe-blue)' },
  away: { name: '마포FC', logo: '마', color: 'var(--accent)' },
  final_score: { home: 28, away: 22 },
  mvp: {
    name: '김지훈',
    team: '강남BC',
    stat: '12득점 · 4어시',
    avatar: '김',
  },
  best: [
    { name: '이태우', team: '강남BC', stat: '10pt · 3rb', avatar: '이' },
    { name: '박재현', team: '강남BC', stat: '6pt · 5rb', avatar: '박' },
    { name: '윤호석', team: '마포FC', stat: '9pt · 4rb', avatar: '윤' },
  ],
  participants: [
    { team: '강남BC', members: ['김지훈', '이태우', '박재현', '정성훈', '강민호'] },
    { team: '마포FC', members: ['윤호석', '한지원', '서태원', '조민기', '백승호'] },
  ],
  avg_manner: 4.5,
  host_message: '훌륭한 경기 감사드립니다. 다음에 또 만나요.',
};

// ============================================================
// 4) AdminGames (UD1) — 관리자 신청 알림 큐 + 액션 출처 (BG1+BG5)
// ============================================================
window.ADMIN_GAMES_LIST = [
  {
    id: 'gm-1',
    title: '강남 평일 픽업 5x5',
    kind: 'pickup', city: '강남구',
    status: 1,                 // 1=open / 2=closed / 3=completed
    status_label: '모집중',
    spots: '7/10',
    host_name: '박수빈',
    starts_at: '2026-05-29 20:00',
    pending_apps: 2,           // BG1 — 신청 대기 건수
    last_changed_by: { role: 'host', name: '박수빈', at: '5분 전' },
  },
  {
    id: 'gm-2',
    title: '게스트 모집 — 마포 평일',
    kind: 'guest', city: '마포구',
    status: 1,
    status_label: '모집중',
    spots: '9/10',
    host_name: '김도현',
    starts_at: '2026-05-30 21:00',
    pending_apps: 1,
    last_changed_by: { role: 'host', name: '김도현', at: '12분 전' },
  },
  {
    id: 'gm-3',
    title: 'U10 결승 · 강남BC vs 마포FC',
    kind: 'pickup', city: '잠실',
    status: 1,
    status_label: '라이브',
    spots: '10/10',
    host_name: '강남구협회',
    starts_at: '2026-05-28 19:00',
    pending_apps: 0,
    last_changed_by: { role: 'system', name: '시스템', note: '자동 라이브 전환', at: '8분 전' },
  },
  {
    id: 'gm-5',
    title: '용산 게스트 — 일요일 오전',
    kind: 'guest', city: '용산구',
    status: 1,
    status_label: '모집중',
    spots: '6/10',
    host_name: '윤호석',
    starts_at: '2026-06-01 10:00',
    pending_apps: 3,
    last_changed_by: { role: 'admin', name: 'super_admin', note: '강제 status 변경', at: '34분 전' },
  },
  {
    id: 'gm-6',
    title: '봄맞이 마포컵 결승',
    kind: 'pickup', city: '마포구',
    status: 3,
    status_label: '종료',
    spots: '10/10',
    host_name: '마포구체육회',
    starts_at: '2026-03-16 17:30',
    pending_apps: 0,
    last_changed_by: { role: 'system', name: '시스템', note: '자동 종료', at: '70일 전' },
  },
  {
    id: 'gm-9',
    title: '강북구 평일 픽업 — 취소',
    kind: 'pickup', city: '강북구',
    status: 2,
    status_label: '취소',
    spots: '3/10',
    host_name: '윤호석',
    starts_at: '2026-05-22 21:00',
    pending_apps: 0,
    last_changed_by: { role: 'host', name: '윤호석', note: '호스트 취소', at: '2일 전' },
  },
];

// ============================================================
// 5) AdminGameReports (UD2) — 매너 통계 데이터 (BG2)
// ============================================================
window.AGR_REPORT_QUEUE = [
  // flags 배열 있는 ratings 만 = 신고 큐
  {
    id: 'rp-1',
    reporter: '김도현', target: '윤호석',
    game_id: 'gm-9', game_title: '강북구 평일 픽업 — 취소',
    flags: ['no_show'],
    overall: 1.5,
    submitted_at: '2026-05-23 09:20',
    status: 'submitted',
  },
  {
    id: 'rp-2',
    reporter: '박수빈', target: '서태원',
    game_id: 'gm-1', game_title: '강남 평일 픽업 5x5',
    flags: ['late_5min', 'bad_attitude'],
    overall: 2.0,
    submitted_at: '2026-05-26 22:40',
    status: 'submitted',
  },
  {
    id: 'rp-3',
    reporter: '강민호', target: '조민기',
    game_id: 'gm-7', game_title: '평일 픽업 — 송파',
    flags: ['rough_play'],
    overall: 2.5,
    submitted_at: '2026-05-16 08:00',
    status: 'reviewed',
  },
  {
    id: 'rp-4',
    reporter: '한지원', target: '백승호',
    game_id: 'gm-7', game_title: '평일 픽업 — 송파',
    flags: ['late'],
    overall: 3.0,
    submitted_at: '2026-05-16 08:30',
    status: 'dismissed',
  },
];

// BG2 매너 통계 — 평균 + flag 종류만 / 개별 건수 ❌ (사용자 결재)
window.AGR_STATS_30D = {
  total_evaluations: 1247,
  avg_rating: 4.3,
  report_rate: 2.4,             // flags 있는 평가 비율 (%)
  top_flag: 'late_5min',        // 가장 많이 받은 flag (키워드만)
  distribution: [
    { score: 5, pct: 56 },
    { score: 4, pct: 28 },
    { score: 3, pct: 11 },
    { score: 2, pct: 3 },
    { score: 1, pct: 2 },
  ],
  // 상위 매너 사용자 (평균 4.5+ / 평가 10+) — 평균만 / 개별 평가 ❌
  top_users: [
    { name: '김지훈', avg: 4.9, eval_count: 22 },
    { name: '박수빈', avg: 4.8, eval_count: 31 },
    { name: '이태우', avg: 4.7, eval_count: 18 },
    { name: '박재현', avg: 4.7, eval_count: 24 },
    { name: '정성훈', avg: 4.6, eval_count: 15 },
  ],
  // 하위 매너 사용자 (평균 3.0- 또는 flags 5+) — 평균 + flag 종류만
  low_users: [
    { name: '서태원', avg: 2.5, eval_count: 12, flags: ['late_5min', 'bad_attitude'] },
    { name: '조민기', avg: 2.8, eval_count: 8, flags: ['rough_play'] },
    { name: '윤호석', avg: 3.0, eval_count: 11, flags: ['no_show', 'late'] },
  ],
};

// 30일 추세 (간략)
window.AGR_TREND_30D = [
  { d: '04-29', avg: 4.2, count: 38 },
  { d: '05-02', avg: 4.3, count: 42 },
  { d: '05-05', avg: 4.4, count: 51 },
  { d: '05-08', avg: 4.3, count: 47 },
  { d: '05-12', avg: 4.5, count: 56 },
  { d: '05-15', avg: 4.2, count: 49 },
  { d: '05-18', avg: 4.4, count: 53 },
  { d: '05-21', avg: 4.3, count: 48 },
  { d: '05-25', avg: 4.3, count: 51 },
  { d: '05-28', avg: 4.5, count: 44 },
];

// ============================================================
// 6) Mini Components (공용 시각 요소)
// ============================================================

// LiveDot — 깜박이는 빨간 점 (BG7)
window.LiveDot = function LiveDot() {
  return (
    <span style={{
      display:'inline-block', width:8, height:8, borderRadius:'50%',
      background:'var(--err)',
      boxShadow:'0 0 0 0 rgba(220,38,38,.5)',
      animation:'bdr-pulse 1.5s infinite',
    }} />
  );
};

// KindBadge — 종별 (pickup / guest / scrimmage / tn)
window.GMKindBadge = function GMKindBadge({ kind, small }) {
  const label = { pickup:'픽업', guest:'게스트', scrimmage:'연습', tn:'대회' }[kind] || kind;
  const color = { pickup:'var(--cafe-blue)', guest:'var(--accent)', scrimmage:'var(--ok)', tn:'var(--bdr-navy)' }[kind] || 'var(--ink-mute)';
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: small ? '2px 6px' : '3px 8px',
      fontSize: small ? 10 : 11, fontWeight:800,
      background: color, color:'#fff',
      borderRadius:'var(--r-xs)',
      letterSpacing:'0.04em',
    }}>{label}</span>
  );
};

// Status badge for game (open / live / completed / cancelled)
window.GMStatusBadge = function GMStatusBadge({ status, label }) {
  const def = {
    open: { color:'var(--ok)', bg:'var(--ok-soft)' },
    live: { color:'var(--err)', bg:'var(--err-soft)' },
    completed: { color:'var(--cafe-blue-deep)', bg:'var(--cafe-blue-soft)' },
    cancelled: { color:'var(--ink-mute)', bg:'var(--bg-head)' },
    pending: { color:'#8B5A0F', bg:'var(--warn-soft)' },
    approved: { color:'var(--ok)', bg:'var(--ok-soft)' },
    rejected: { color:'var(--err)', bg:'var(--err-soft)' },
  }[status] || { color:'var(--ink-mute)', bg:'var(--bg-head)' };
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding:'3px 8px',
      fontSize:11, fontWeight:800,
      color:def.color, background:def.bg,
      borderRadius:'var(--r-xs)',
      letterSpacing:'0.02em',
    }}>{label || status}</span>
  );
};

// ApplyStep — BG1 신청 step indicator (UA2 / UC1 공용)
// step_idx: 0=신청 1=호스트 승인 대기 2=참가 확정 / status: pending|approved|rejected
window.ApplyStep = function ApplyStep({ stepIdx = 0, status = 'pending', applied_at, approved_at, rejected_at, reject_reason, compact = false }) {
  const steps = [
    { i: 0, label: '신청 완료', time: applied_at },
    { i: 1, label: '호스트 승인 대기', time: status === 'approved' ? approved_at : (status === 'rejected' ? rejected_at : null) },
    { i: 2, label: status === 'rejected' ? '거절됨' : '참가 확정', time: status === 'approved' ? approved_at : null },
  ];
  const isRejected = status === 'rejected';
  return (
    <div className="apply-step" data-compact={compact}>
      {steps.map((s, idx) => {
        const isDone = idx < stepIdx || (idx === stepIdx && status === 'approved');
        const isCur = idx === stepIdx && status === 'pending';
        const isReject = isRejected && idx === 2;
        const isLast = idx === steps.length - 1;
        return (
          <React.Fragment key={s.i}>
            <div className={'apply-step__cell' + (isDone ? ' is-done' : '') + (isCur ? ' is-cur' : '') + (isReject ? ' is-rej' : '')}>
              <div className="apply-step__dot">
                {isDone ? <span className="ico material-symbols-outlined">check</span> :
                 isReject ? <span className="ico material-symbols-outlined">close</span> :
                 <span>{idx+1}</span>}
              </div>
              <div className="apply-step__lbl">{s.label}</div>
              {s.time && <div className="apply-step__time">{s.time}</div>}
            </div>
            {!isLast && <div className={'apply-step__line' + (idx < stepIdx ? ' is-done' : '') + (isRejected && idx >= 0 ? ' is-rej' : '')} />}
          </React.Fragment>
        );
      })}
      {isRejected && reject_reason && (
        <div className="apply-step__reject-note">
          <span className="ico material-symbols-outlined">info</span>
          거절 사유 — {reject_reason}
        </div>
      )}
    </div>
  );
};

// LiveChipRow — UC2 Home 의 Hero 위 sticky 띠 + UA1 Games 상단 띠 공용
window.LiveChipRow = function LiveChipRow({ items = [] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="live-chip-row">
      <div className="live-chip-row__lbl">
        <window.LiveDot />
        <span className="live-chip-row__lbl-text">LIVE</span>
        <span className="live-chip-row__count">{items.length}</span>
      </div>
      <div className="live-chip-row__scroll">
        {items.map(it => (
          <button key={it.id} className="live-chip" data-kind={it.kind}>
            <span className="live-chip__round">
              {it.kind === 'tn' ? `🏆 ${it.tn?.round || it.tn?.name || '대회'}` : '🏀 픽업'}
            </span>
            <span className="live-chip__title">{it.title}</span>
            <span className="live-chip__score">
              <window.LiveDot />
              {it.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

// MannerCard — UC1 마이페이지 "내 매너" 카드 (BG2 = 평균 + flag 종류만)
window.MannerCard = function MannerCard({ data }) {
  const { avg, total_evaluations, positive_flags = [], negative_flags = [] } = data;
  const tone = avg >= 4.5 ? 'ok' : avg >= 3.0 ? 'warn' : 'err';
  const toneColor = { ok:'var(--ok)', warn:'var(--warn)', err:'var(--err)' }[tone];
  return (
    <div className="manner-card">
      <div className="manner-card__head">
        <h3 className="manner-card__h">내 매너 평가</h3>
        <span className="manner-card__hint" title="최근 50건 평균">
          <span className="ico material-symbols-outlined">info</span>
          최근 50건 평균
        </span>
      </div>
      <div className="manner-card__body">
        <div className="manner-card__score" style={{color: toneColor}}>
          <span className="manner-card__big">{avg.toFixed(1)}</span>
          <span className="manner-card__den">/ 5.0</span>
        </div>
        <div className="manner-card__count">{total_evaluations}명에게 평가 받음</div>
      </div>
      {(positive_flags.length > 0 || negative_flags.length > 0) ? (
        <div className="manner-card__flags">
          <div className="manner-card__flags-lbl">받은 평가 키워드 <span style={{color:'var(--ink-dim)', fontWeight:500}}>(종류만 / 건수 ❌)</span></div>
          <div className="manner-card__flags-row">
            {positive_flags.map(f => {
              const lab = window.MANNER_FLAG_LABELS[f] || { label: f, emoji:'·', tone:'ok' };
              return <span key={f} className={'manner-flag manner-flag--' + lab.tone}>{lab.emoji} {lab.label}</span>;
            })}
            {negative_flags.map(f => {
              const lab = window.MANNER_FLAG_LABELS[f] || { label: f, emoji:'·', tone:'warn' };
              return <span key={f} className={'manner-flag manner-flag--' + lab.tone}>{lab.emoji} {lab.label}</span>;
            })}
          </div>
        </div>
      ) : (
        <div className="manner-card__empty">아직 매너 평가가 없습니다. 더 많은 경기에 참가해보세요.</div>
      )}
    </div>
  );
};
