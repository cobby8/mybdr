/* global React */
// ============================================================
// BDR v2.25 — billing-shared.jsx
// Phase 6.2 (결제·구독·예약) 박제 공용 데이터 + mini components.
// shared / game / team / org / comm / profile-shared 답습.
//
// ★ 토스페이먼츠 운영 실연결 (route /payments/confirm + /[id]/refund) — mock 0 박제.
//
// 토큰 출처 (PRISMA_billing_models_spec.md):
//   plans (name / description / plan_type / feature_key / price / max_uses /
//     is_active / 구독자 수 집계)
//   user_subscriptions (plan / status / started_at / expires_at / next_billing)
//   payments (payment_code / payable_type / final_amount / payment_method /
//     status[paid/failed/refunded/ready] / created_at / toss key / user)
//   court_bookings (court / start_at / end_at / final_amount / status) — Phase 7
//
// ★ BB 정합: BU1 플랜 list = BU3 "현재 구독" = BA2 플랜 = 동일 PLANS 컬럼.
//   BU3 결제 이력 = BA1 결제 list = 동일 payments 컬럼 (status / toss key).
// ============================================================

// ============================================================
// 1) plans — 멤버십 플랜 (BU1 list · BU3 현재 구독 · BA2 관리)
//    feature_key: team_create / pickup_game / court_rental / tournament_create
// ============================================================
window.PLANS = [
  {
    id: 'plan-free', name: '무료', tier: 'free',
    plan_type: 'monthly', feature_key: 'pickup_game', price: 0,
    is_active: true, subscribers: 4821,
    tagline: '동네 농구를 시작하는 모두에게',
    features: ['픽업 게임 참가 무제한', '팀 가입 · 코트 둘러보기', '커뮤니티 읽기·쓰기', '기본 프로필 · 시즌 stat'],
  },
  {
    id: 'plan-plus', name: 'BDR+', tier: 'basic',
    plan_type: 'monthly', feature_key: 'team_create', price: 4900,
    is_active: true, subscribers: 612, badge: '가장 인기',
    tagline: '팀을 운영하는 캡틴을 위해',
    features: ['무료 혜택 전체 포함', '팀 생성 · 운영 (최대 3팀)', '코트 예약 수수료 면제', '게스트 모집 우선 노출', '경기 결과 · 매너 통계'],
  },
  {
    id: 'plan-pro', name: 'BDR PRO', tier: 'premium',
    plan_type: 'monthly', feature_key: 'tournament_create', price: 9900,
    is_active: true, subscribers: 188,
    tagline: '대회를 여는 운영자를 위해',
    features: ['BDR+ 혜택 전체 포함', '대회 생성 · 운영 무제한', '대진표 · 라이브 스코어', '우선 매칭 · 전용 배지', '월간 활동 리포트'],
  },
];
window.PLAN_TYPE_LABEL = { monthly: '월 구독', one_time: '1회 구매' };

// ============================================================
// 2) user_subscriptions — 본인 현재 구독 (BU3-구독 탭)
//    USER_ME.subscription_status = 'active' (PRO) carry-over
// ============================================================
window.MY_SUBSCRIPTION = {
  id: 'sub-91', plan_id: 'plan-pro', plan_name: 'BDR PRO', tier: 'premium',
  status: 'active',                     // active / cancelled / expired
  is_usable: true,
  price: 9900, plan_type: 'monthly',
  started_at: '2026-03-16',
  expires_at: '2026-06-16',
  next_billing: '2026-06-16',
  days_left: 16,
  // 결제 수단 (토스 빌링키 — 마지막 4자리만)
  method_brand: '카카오뱅크', method_kind: 'card', method_last4: '1234',
};

// ============================================================
// 3) payments — 본인 결제 이력 (BU3-이력 탭 · BU5 결과)
// ============================================================
window.MY_PAYMENTS = [
  { id: 'pay-5521', code: 'PLAN-pro-1-1747', item: 'BDR PRO 월 구독', type: 'subscription',
    amount: 9900, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-16T09:02:00',
    toss_key: 'tviva20260516Av8kQ2', receipt: true },
  { id: 'pay-5390', code: 'COURT-882-1-1747', item: '장충체육관 2코트 (2h)', type: 'booking',
    amount: 30000, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-20T18:40:00',
    toss_key: 'tviva20260520Lp3mX9', receipt: true },
  { id: 'pay-5102', code: 'TN-44-1-1746', item: 'BDR 서머 오픈 #4 참가비', type: 'tournament',
    amount: 40000, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-02T13:25:00',
    toss_key: 'tviva20260502Qz7nB1', receipt: true },
  { id: 'pay-4980', code: 'PLAN-pro-1-1744', item: 'BDR PRO 월 구독', type: 'subscription',
    amount: 9900, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-04-16T09:01:00',
    toss_key: 'tviva20260416Wd2kF5', receipt: true },
  { id: 'pay-4871', code: 'COURT-771-1-1745', item: '강동 실내코트 (1h)', type: 'booking',
    amount: 25000, method: '카드 · 카카오뱅크', status: 'refunded', created_at: '2026-04-28T20:10:00',
    toss_key: 'tviva20260428Rk9pZ3', refunded_at: '2026-04-29T11:30:00', receipt: true },
  { id: 'pay-5610', code: 'COURT-905-1-1748', item: '송파 다목적체육관 (2h)', type: 'booking',
    amount: 30000, method: '카드', status: 'failed', created_at: '2026-05-25T21:05:00',
    fail_code: 'NOT_ENOUGH_BALANCE', receipt: false },
  { id: 'pay-4760', code: 'PLAN-pro-1-1742', item: 'BDR PRO 월 구독', type: 'subscription',
    amount: 9900, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-03-16T09:00:00',
    toss_key: 'tviva20260316Tn4cM8', receipt: true },
];

// ============================================================
// 4) court_bookings — 본인 예약 (BU4 · Phase 7 cross-domain)
//    status → 시안 4 탭: upcoming(예정) / ongoing(진행) / done(종료) / cancelled(취소·환불)
// ============================================================
window.MY_BOOKINGS = [
  { id: 'bk-905', court: '장충체육관 2코트', court_id: 'c-882', addr: '서울 중구',
    date: '2026-06-15', start: '14:00', end: '16:00', amount: 30000,
    status: 'upcoming', pay_status: 'paid', toss_key: 'tviva20260520Lp3mX9' },
  { id: 'bk-911', court: '송파 다목적체육관 A', court_id: 'c-905', addr: '서울 송파구',
    date: '2026-06-08', start: '20:00', end: '22:00', amount: 30000,
    status: 'upcoming', pay_status: 'paid', toss_key: 'tviva20260601Hh1aQ7' },
  { id: 'bk-899', court: '강동 실내코트', court_id: 'c-771', addr: '서울 강동구',
    date: '2026-05-31', start: '10:00', end: '12:00', amount: 28000,
    status: 'ongoing', pay_status: 'paid', toss_key: 'tviva20260528Bn2kP4' },
  { id: 'bk-840', court: '잠실학생체육관 1코트', court_id: 'c-640', addr: '서울 송파구',
    date: '2026-05-21', start: '19:00', end: '21:00', amount: 32000,
    status: 'done', pay_status: 'paid', toss_key: 'tviva20260514Zx8mN0' },
  { id: 'bk-812', court: '마포 실내코트 B', court_id: 'c-512', addr: '서울 마포구',
    date: '2026-05-10', start: '13:00', end: '15:00', amount: 26000,
    status: 'done', pay_status: 'paid', toss_key: 'tviva20260503Cv5kR2' },
  { id: 'bk-790', court: '강동 실내코트', court_id: 'c-771', addr: '서울 강동구',
    date: '2026-04-28', start: '20:00', end: '21:00', amount: 25000,
    status: 'cancelled', pay_status: 'refunded', toss_key: 'tviva20260428Rk9pZ3' },
];

// ============================================================
// 5) BA1 — super-admin 결제 list (payments · 다중 사용자)
// ============================================================
window.ADMIN_PAYMENTS = [
  { id: 'pay-5610', user: '백승호', avatar: '백', handle: 'baek_sh', item: '송파 다목적체육관 (2h)', type: 'booking',
    amount: 30000, method: '카드', status: 'failed', created_at: '2026-05-25T21:05:00', fail_code: 'NOT_ENOUGH_BALANCE' },
  { id: 'pay-5588', user: '한지원', avatar: '한', handle: 'han_jiwon', item: 'BDR+ 월 구독', type: 'subscription',
    amount: 4900, method: '카드 · 토스', status: 'paid', created_at: '2026-05-24T08:12:00', toss_key: 'tviva20260524Aa1bC2' },
  { id: 'pay-5560', user: '이태우', avatar: '이', handle: 'lee_taewoo', item: '강남 농구장 (1h)', type: 'booking',
    amount: 22000, method: '카드 · 토스', status: 'refund_wait', created_at: '2026-05-23T19:40:00', toss_key: 'tviva20260523Dd3eF4' },
  { id: 'pay-5521', user: '박수빈', avatar: '박', handle: 'rdm_captain', item: 'BDR PRO 월 구독', type: 'subscription',
    amount: 9900, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-16T09:02:00', toss_key: 'tviva20260516Av8kQ2' },
  { id: 'pay-5505', user: '김지훈', avatar: '김', handle: 'kim_jihoon', item: 'BDR 서머 오픈 #4 참가비', type: 'tournament',
    amount: 40000, method: '카드 · 토스', status: 'paid', created_at: '2026-05-15T22:30:00', toss_key: 'tviva20260515Gg5hI6' },
  { id: 'pay-5480', user: '정성훈', avatar: '정', handle: 'jung_sh', item: '잠실 1코트 (2h)', type: 'booking',
    amount: 32000, method: '카드 · 토스', status: 'paid', created_at: '2026-05-14T17:05:00', toss_key: 'tviva20260514Jj7kL8' },
  { id: 'pay-5421', user: '백승호', avatar: '백', handle: 'baek_sh', item: 'BDR+ 월 구독', type: 'subscription',
    amount: 4900, method: '카드', status: 'failed', created_at: '2026-05-12T11:20:00', fail_code: 'REJECT_CARD_COMPANY' },
  { id: 'pay-5390', user: '박수빈', avatar: '박', handle: 'rdm_captain', item: '장충체육관 2코트 (2h)', type: 'booking',
    amount: 30000, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-20T18:40:00', toss_key: 'tviva20260520Lp3mX9' },
  { id: 'pay-5301', user: '이태우', avatar: '이', handle: 'lee_taewoo', item: '강동 실내코트 (1h)', type: 'booking',
    amount: 25000, method: '카드 · 토스', status: 'refunded', created_at: '2026-05-08T20:00:00', toss_key: 'tviva20260508Mm9nO0', refunded_at: '2026-05-09T10:15:00' },
  { id: 'pay-5288', user: '한지원', avatar: '한', handle: 'han_jiwon', item: '광진 5x5 픽업 게스트비', type: 'booking',
    amount: 8000, method: '카드 · 토스', status: 'paid', created_at: '2026-05-06T14:25:00', toss_key: 'tviva20260506Pp1qR2' },
  { id: 'pay-5102', user: '박수빈', avatar: '박', handle: 'rdm_captain', item: 'BDR 서머 오픈 #4 참가비', type: 'tournament',
    amount: 40000, method: '카드 · 카카오뱅크', status: 'paid', created_at: '2026-05-02T13:25:00', toss_key: 'tviva20260502Qz7nB1' },
  { id: 'pay-5044', user: '서민재', avatar: '서', handle: 'newbie_seo', item: 'BDR+ 월 구독', type: 'subscription',
    amount: 4900, method: '카드 · 토스', status: 'refunded', created_at: '2026-04-30T09:50:00', toss_key: 'tviva20260430Ss3tU4', refunded_at: '2026-05-01T16:40:00' },
];

// ============================================================
// 6) Helpers
// ============================================================
// 금액 — 천 단위 구분 통일 (₩50,000)  ← Phase 6.2 특수 검수
window.won = function won(n) {
  if (n === 0) return '무료';
  return '₩' + Number(n).toLocaleString('ko-KR');
};
window.wonRaw = function wonRaw(n) { return '₩' + Number(n).toLocaleString('ko-KR'); };

// 결제 status — 색 분리 (성공=ok / 실패=err / 환불=neutral / 대기=warn) ← Phase 6.2 특수
window.PAY_STATUS = {
  paid:        { label: '결제 완료', tone: 'ok',      ico: 'check_circle' },
  failed:      { label: '결제 실패', tone: 'err',     ico: 'error' },
  refunded:    { label: '환불 완료', tone: 'neutral', ico: 'undo' },
  refund_wait: { label: '환불 대기', tone: 'warn',    ico: 'schedule' },
  ready:       { label: '결제 대기', tone: 'warn',    ico: 'hourglass_top' },
};
window.BOOKING_STATUS = {
  upcoming:  { label: '예정',      tone: 'blue' },
  ongoing:   { label: '진행 중',   tone: 'ok' },
  done:      { label: '이용 완료', tone: 'neutral' },
  cancelled: { label: '취소·환불', tone: 'mute' },
};

window.payDate = function payDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return ('' + d.getFullYear()).slice(2) + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' +
    String(d.getDate()).padStart(2, '0') + ' ' +
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
window.dateK = function dateK(ymd) {
  if (!ymd) return '—';
  const d = new Date(ymd + 'T00:00:00');
  const w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0') + ' (' + w + ')';
};

// ============================================================
// 7) Mini Components
// ============================================================

// PayStatusBadge — 결제 status pill (BU3 / BA1 / BU4 공용)
window.PayStatusBadge = function PayStatusBadge({ status }) {
  const s = window.PAY_STATUS[status] || window.PAY_STATUS.ready;
  return (
    <span className="bl-pstat" data-tone={s.tone}>
      <span className="ico material-symbols-outlined">{s.ico}</span>{s.label}
    </span>
  );
};

// PriceTag — 큰 가격 표시 (BU1 카드 / BU2 요약)
window.PriceTag = function PriceTag({ price, type = 'monthly', size = 'md' }) {
  const free = price === 0;
  return (
    <div className={'bl-price bl-price--' + size}>
      <span className="bl-price__v">{free ? '무료' : window.wonRaw(price)}</span>
      {!free && <span className="bl-price__per">/ {type === 'monthly' ? '월' : '회'}</span>}
    </div>
  );
};

// StepIndicator — 결제 step (BU2: 플랜 선택 → 결제 정보 → 결제 완료)
window.StepIndicator = function StepIndicator({ steps, current }) {
  return (
    <ol className="bl-steps">
      {steps.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'on' : 'todo';
        return (
          <li key={i} className="bl-step" data-state={state}>
            <span className="bl-step__dot">{state === 'done' ? <span className="ico material-symbols-outlined">check</span> : i + 1}</span>
            <span className="bl-step__lbl">{label}</span>
          </li>
        );
      })}
    </ol>
  );
};

// PlanCard — 멤버십 플랜 카드 (BU1 grid · current 표시)
window.PlanCard = function PlanCard({ plan, current = false, onSelect }) {
  return (
    <div className={'bl-plan' + (plan.badge ? ' bl-plan--feat' : '') + (current ? ' bl-plan--current' : '')} data-tier={plan.tier}>
      {plan.badge && <div className="bl-plan__ribbon">{plan.badge}</div>}
      {current && <div className="bl-plan__ribbon bl-plan__ribbon--cur">현재 구독 중</div>}
      <div className="bl-plan__name">{plan.name}</div>
      <div className="bl-plan__tag">{plan.tagline}</div>
      <window.PriceTag price={plan.price} type={plan.plan_type} size="lg" />
      <ul className="bl-plan__feats">
        {plan.features.map((f, i) => (
          <li key={i}><span className="ico material-symbols-outlined">check</span>{f}</li>
        ))}
      </ul>
      {current
        ? <button className="bl-plan__cta bl-plan__cta--ghost" disabled>이용 중인 플랜</button>
        : plan.price === 0
          ? <button className="bl-plan__cta bl-plan__cta--ghost" disabled>기본 제공</button>
          : <a className={'bl-plan__cta' + (plan.badge ? ' bl-plan__cta--accent' : '')} href="bu2-pricing-checkout.html">{plan.name} 선택</a>}
    </div>
  );
};

// PageBackBilling — 모바일 백버튼
window.PageBackBilling = function PageBackBilling({ to = '프로필', href = 'pu1-profile.html' }) {
  return (
    <a className="pm-back" href={href}>
      <span className="ico material-symbols-outlined">arrow_back_ios_new</span>{to}
    </a>
  );
};
