/* global React */
// ============================================================
// BDR v2.25 — PricingResult (BU5 · Phase 6.2B · 신규 · BB3 ★★★)
// 운영: /pricing/success (227) + /pricing/fail (288) · 박제 ❌ → 통합 패턴.
//
// success: 🎉 hero (var(--ok)) + 결제 정보 + "구독 보기"(→BU3) / 영수증 인쇄 / 요금제
// fail:    ⚠ hero (var(--warn)) + 토스 에러 코드 매핑 + "다시 결제"(→BU2) / 다른 수단 / 홈
// 시안 전용 데모 토글로 success/fail 동시 박제 (운영은 URL 분기).
// ============================================================

// 토스페이먼츠 공식 에러 코드 → 한국어 (운영 BU5 fail page 매핑 답습 · 대표 4)
const TOSS_ERR = {
  NOT_ENOUGH_BALANCE:   { title: '잔액이 부족해요', desc: '카드 한도나 계좌 잔액을 확인해 주세요.' },
  PAY_PROCESS_CANCELED: { title: '결제를 취소하셨어요', desc: '언제든 다시 시도하실 수 있어요.' },
  REJECT_CARD_COMPANY:  { title: '카드사에서 거절했어요', desc: '카드사에 문의하시거나 다른 카드로 시도해 주세요.' },
  INVALID_CARD_NUMBER:  { title: '카드 번호가 올바르지 않아요', desc: '카드 정보를 다시 확인해 주세요.' },
};

function ResultSuccess() {
  const paidAt = '2026년 5월 16일 오전 09:02';
  return (
    <div className="bl-result bl-result--ok">
      <div className="bl-result__icon"><span className="ico material-symbols-outlined">check</span></div>
      <div className="bl-result__eyebrow">결제 완료 · PAYMENT SUCCESS</div>
      <h1 className="bl-result__title">결제가 완료됐어요 🎉</h1>
      <p className="bl-result__desc">BDR PRO 멤버십 결제가 정상 처리되었습니다. 영수증은 등록된 이메일로 발송됐어요.</p>

      <div className="bl-result__amount">{window.wonRaw(9900)}</div>

      <dl className="bl-result__detail">
        <dt>결제 항목</dt><dd>BDR PRO 월 구독</dd>
        <dt>결제수단</dt><dd>카드 · 카카오뱅크</dd>
        <dt>주문번호</dt><dd className="mono">PLAN-pro-1-1747</dd>
        <dt>승인번호</dt><dd className="mono">tviva20260516…</dd>
        <dt>결제일시</dt><dd>{paidAt}</dd>
      </dl>

      <div className="bl-result__btns">
        <a className="bl-paybtn" href="bu3-profile-billing.html" style={{ background: 'var(--cafe-blue)', borderColor: 'var(--cafe-blue-deep)' }}>
          <span className="ico material-symbols-outlined">card_membership</span>내 구독 보기
        </a>
        <button className="btn" type="button"><span className="ico material-symbols-outlined">print</span>영수증 인쇄</button>
        <a className="btn" href="bu1-pricing.html">요금제 보기</a>
      </div>
    </div>
  );
}

function ResultFail() {
  const code = 'NOT_ENOUGH_BALANCE';
  const e = TOSS_ERR[code];
  return (
    <div className="bl-result bl-result--fail">
      <div className="bl-result__icon"><span className="ico material-symbols-outlined">error</span></div>
      <div className="bl-result__eyebrow">결제 실패 · PAYMENT FAILED</div>
      <h1 className="bl-result__title">{e.title}</h1>
      <p className="bl-result__desc">{e.desc} 다시 시도하시거나, 문제가 계속되면 관리자에게 문의해 주세요.</p>

      <div className="bl-result__errchip"><span>오류 코드</span><code>{code}</code></div>

      <div className="bl-result__btns">
        <a className="bl-paybtn" href="bu2-pricing-checkout.html"><span className="ico material-symbols-outlined">refresh</span>다시 결제하기</a>
        <a className="btn" href="bu1-pricing.html">다른 결제수단 선택</a>
        <a className="btn" href="pu1-profile.html">홈으로</a>
      </div>

      <div className="bl-result__foot">
        <a href="#">문제가 계속되면 관리자에게 문의하기</a>
      </div>
    </div>
  );
}

function PricingResult() {
  const [mode, setMode] = React.useState('success');
  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-narrow">
        {/* 시안 전용 데모 토글 — 운영은 /success · /fail URL 분기 */}
        <div style={{ textAlign: 'center' }}>
          <div className="bl-demo-toggle">
            <button className={mode === 'success' ? 'is-on' : ''} onClick={() => setMode('success')}>결제 성공</button>
            <button className={mode === 'fail' ? 'is-on' : ''} onClick={() => setMode('fail')}>결제 실패</button>
          </div>
        </div>
        {mode === 'success' ? <ResultSuccess /> : <ResultFail />}
      </div>
    </div>
  );
}

window.PricingResult = PricingResult;
