/* global React */
// ============================================================
// BDR v2.25 — Pricing (BU1 · Phase 6.2B · 신규 박제 · BB1 ★★★★★)
// 운영: /pricing (41 wrapper · pricing-content.tsx) · 박제 ❌ → 신규.
//
// Hero band "MyBDR 멤버십" + 플랜 grid (free/BDR+/PRO · plans 모델) +
// 본인 현재 구독 badge (user_subscriptions) + 비교 표.
// CTA → /pricing/checkout (BU2). BB1 = BU3 "현재 구독" = BA2 플랜 동일 PLANS.
// ============================================================
const COMPARE_ROWS = [
  { label: '픽업 게임 참가', free: true, plus: true, pro: true },
  { label: '커뮤니티 · 코트 둘러보기', free: true, plus: true, pro: true },
  { label: '팀 생성 · 운영', free: false, plus: '최대 3팀', pro: '무제한' },
  { label: '코트 예약 수수료', free: '일반', plus: '면제', pro: '면제' },
  { label: '게스트 모집 우선 노출', free: false, plus: true, pro: true },
  { label: '대회 생성 · 운영', free: false, plus: false, pro: true },
  { label: '대진표 · 라이브 스코어', free: false, plus: false, pro: true },
  { label: '월간 활동 리포트', free: false, plus: false, pro: true },
];

function CompareCell({ v }) {
  if (v === true) return <span className="ico material-symbols-outlined">check</span>;
  if (v === false) return <span className="ico material-symbols-outlined" data-no="true">remove</span>;
  return <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>{v}</span>;
}

function Pricing() {
  const plans = window.PLANS;
  const myPlanId = window.MY_SUBSCRIPTION.plan_id;

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <window.PageBackBilling />

        {/* Hero band */}
        <header className="pm-hero">
          <div className="pm-hero__row">
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">MyBDR 멤버십</h1>
              </div>
              <p className="pm-hero__bio">
                전국 농구 매칭을 더 깊게. 팀 운영부터 대회 개최까지, 나에게 맞는 플랜을 선택하세요.
                지금 <strong>BDR PRO</strong>를 이용 중이에요.
              </p>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">verified</span>토스페이먼츠 안전 결제</span>
                <span><span className="ico material-symbols-outlined">autorenew</span>언제든 해지 가능</span>
                <span><span className="ico material-symbols-outlined">receipt_long</span>월 자동 결제</span>
              </div>
            </div>
          </div>
        </header>

        {/* 플랜 grid */}
        <div className="bl-plans" style={{ marginBottom: 18 }}>
          {plans.map(p => (
            <window.PlanCard key={p.id} plan={p} current={p.id === myPlanId} />
          ))}
        </div>

        {/* 비교 표 */}
        <div className="pm-card">
          <div className="pm-card__head">
            <h2 className="pm-card__h"><span className="ico material-symbols-outlined">table_rows</span>플랜 비교</h2>
            <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>월 구독 기준</span>
          </div>
          <div className="bl-compare-wrap">
            <table className="bl-compare">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>혜택</th>
                  <th>무료</th>
                  <th>BDR+</th>
                  <th>BDR PRO</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map((r, i) => (
                  <tr key={i}>
                    <th>{r.label}</th>
                    <td><CompareCell v={r.free} /></td>
                    <td><CompareCell v={r.plus} /></td>
                    <td><CompareCell v={r.pro} /></td>
                  </tr>
                ))}
                <tr>
                  <th>월 요금</th>
                  <td style={{ fontFamily: 'var(--ff-display)', fontWeight: 800 }}>무료</td>
                  <td style={{ fontFamily: 'var(--ff-display)', fontWeight: 800 }}>{window.wonRaw(4900)}</td>
                  <td style={{ fontFamily: 'var(--ff-display)', fontWeight: 800 }}>{window.wonRaw(9900)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 12, color: 'var(--ink-dim)', margin: '12px 0 0', lineHeight: 1.6 }}>
            플랜은 언제든 변경·해지할 수 있으며, 해지 시 다음 결제일까지 혜택이 유지됩니다. 결제는 토스페이먼츠를 통해 안전하게 처리됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

window.Pricing = Pricing;
