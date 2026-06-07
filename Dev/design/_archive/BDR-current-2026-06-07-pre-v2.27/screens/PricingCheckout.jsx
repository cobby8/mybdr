/* global React */
// ============================================================
// BDR v2.25 — PricingCheckout (BU2 · Phase 6.2B · 신규 · BB5 ★★★★)
// 운영: /pricing/checkout (511 · toss requestPayment) · 박제 ❌ → 신규.
//
// Hero mini (선택 플랜) + 3 step (플랜 선택 → 결제 정보 → 결제 완료) +
// 결제자 정보(readOnly) + 토스 위젯 시각 박제(mock 0) + 약관 4종 +
// "결제하기" CTA (필수 3종 동의 시 활성). → BU5 success / fail.
// ============================================================
const PM_METHODS = [
  { key: 'card',  lbl: '카드',     ico: 'credit_card' },
  { key: 'vbank', lbl: '가상계좌', ico: 'account_balance' },
  { key: 'easy',  lbl: '간편결제', ico: 'bolt' },
];

function PricingCheckout() {
  const plan = window.PLANS.find(p => p.id === 'plan-pro');
  const u = window.USER_ME;
  const [method, setMethod] = React.useState('card');
  const [terms, setTerms] = React.useState({ pg: false, third: false, refund: false, marketing: false });
  const allReq = terms.pg && terms.third && terms.refund;
  const allChecked = allReq && terms.marketing;

  const toggle = (k) => setTerms(t => ({ ...t, [k]: !t[k] }));
  const toggleAll = () => {
    const next = !allChecked;
    setTerms({ pg: next, third: next, refund: next, marketing: next });
  };

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-narrow">
        <div className="bl-crumb">
          <a href="pu1-profile.html">홈</a><span className="sep">›</span>
          <a href="bu1-pricing.html">요금제</a><span className="sep">›</span><span className="cur">결제</span>
        </div>

        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 18px', color: 'var(--ink)' }}>결제하기</h1>

        {/* 3 step */}
        <window.StepIndicator steps={['플랜 선택', '결제 정보', '결제 완료']} current={1} />

        {/* 선택 플랜 요약 */}
        <div className="bl-summary">
          <div>
            <div className="bl-summary__l">선택한 플랜</div>
            <div className="bl-summary__name">{plan.name}</div>
            <div className="bl-summary__type">{window.PLAN_TYPE_LABEL[plan.plan_type]} · 30일 자동 갱신</div>
          </div>
          <window.PriceTag price={plan.price} type={plan.plan_type} size="md" />
        </div>

        {/* 결제자 정보 readOnly */}
        <div className="pm-card" style={{ marginBottom: 16 }}>
          <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">person</span>결제자 정보</h2>
          <div className="bl-field">
            <label className="bl-field__l">이메일</label>
            <input className="bl-ro-input" value={u.email} readOnly />
          </div>
          <div className="bl-field" style={{ marginBottom: 0 }}>
            <label className="bl-field__l">이름</label>
            <input className="bl-ro-input" value={u.nickname} readOnly />
          </div>
        </div>

        {/* 토스 위젯 (시각 박제 · mock 0) */}
        <div className="pm-card" style={{ marginBottom: 16 }}>
          <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">payments</span>결제 수단</h2>
          <div className="bl-widget">
            <div className="bl-widget__head">
              <span className="bl-widget__title">결제 수단 선택</span>
              <span className="bl-widget__brand"><span className="ico material-symbols-outlined">bolt</span>toss payments</span>
            </div>
            <div className="bl-widget__body">
              <div className="bl-pm-row">
                {PM_METHODS.map(m => (
                  <button key={m.key} className={'bl-pm' + (method === m.key ? ' is-on' : '')} onClick={() => setMethod(m.key)}>
                    <span className="ico material-symbols-outlined">{m.ico}</span>{m.lbl}
                  </button>
                ))}
              </div>
              <div className="bl-pm-skel">
                <div className="bl-pm-skel__bar">카드 번호  ····  ····  ····  ····</div>
                <div className="bl-pm-skel__half">
                  <div className="bl-pm-skel__bar">유효기간  MM / YY</div>
                  <div className="bl-pm-skel__bar">생년월일</div>
                </div>
              </div>
            </div>
            <div className="bl-widget__note">
              <span className="ico material-symbols-outlined">lock</span>토스페이먼츠 위젯이 이 영역에 임베드됩니다 (실 결제창 연동).
            </div>
          </div>
        </div>

        {/* 약관 */}
        <div className="pm-card" style={{ marginBottom: 16 }}>
          <div className="bl-terms">
            <label className="bl-term bl-term--all">
              <input type="checkbox" checked={allChecked} onChange={toggleAll} />
              전체 약관에 동의합니다
            </label>
            <label className="bl-term">
              <input type="checkbox" checked={terms.pg} onChange={() => toggle('pg')} />
              <span className="bl-term__req">필수</span>전자금융거래 이용약관
              <a className="bl-term__view" href="#">보기</a>
            </label>
            <label className="bl-term">
              <input type="checkbox" checked={terms.third} onChange={() => toggle('third')} />
              <span className="bl-term__req">필수</span>개인정보 제3자 제공 (토스페이먼츠)
              <a className="bl-term__view" href="#">보기</a>
            </label>
            <label className="bl-term">
              <input type="checkbox" checked={terms.refund} onChange={() => toggle('refund')} />
              <span className="bl-term__req">필수</span>구독 자동결제 · 환불 정책
              <a className="bl-term__view" href="#">보기</a>
            </label>
            <label className="bl-term">
              <input type="checkbox" checked={terms.marketing} onChange={() => toggle('marketing')} />
              <span className="bl-term__opt">선택</span>마케팅 정보 수신
            </label>
          </div>
        </div>

        {!allReq && <p className="bl-pay-hint" style={{ marginBottom: 8 }}>필수 약관 3건 동의 시 결제할 수 있어요</p>}

        <a
          className="bl-paybtn"
          href={allReq ? 'bu5-pricing-result.html' : undefined}
          aria-disabled={!allReq}
          onClick={(e) => { if (!allReq) e.preventDefault(); }}
          style={!allReq ? { background: 'var(--border-strong)', borderColor: 'var(--border-strong)', color: 'var(--bg-elev)', cursor: 'not-allowed', pointerEvents: 'auto' } : {}}
        >
          {window.wonRaw(plan.price)} 결제하기
        </a>
        <p className="bl-pay-hint">결제는 토스페이먼츠를 통해 안전하게 처리됩니다.</p>

        <div style={{ marginTop: 14, textAlign: 'center' }}>
          <a href="bu1-pricing.html" style={{ fontSize: 13, color: 'var(--ink-mute)', textDecoration: 'none' }}>← 요금제 목록으로</a>
        </div>
      </div>
    </div>
  );
}

window.PricingCheckout = PricingCheckout;
