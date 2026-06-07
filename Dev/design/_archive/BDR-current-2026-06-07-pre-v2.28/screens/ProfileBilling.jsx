/* global React */
// ============================================================
// BDR v2.25 — ProfileBilling (BU3 · Phase 6.2B · 신규 · BB1+BB2 ★★★★★)
// 운영: /profile/billing (1039 · 구독+이력 통합) · 박제 ❌ → 3 sub-tab hub.
//
// ?tab=subscription (default) / history / refund   ← Phase 6.2 특수 검수
//   구독: 현재 plan card + 다음 결제일 + 남은 기간 + 결제 수단 + 변경/취소
//   이력: payments list (성공/실패/환불) + 영수증 다운로드
//   환불: 환불 안내 + 환불 가능/완료 결제 (운영 환불 form 미확인 → inline)
// BB1 = BU1/BA2 동일 PLANS · BB2 = BA1 동일 payments.
// ============================================================
const BU3_TABS = [
  { key: 'subscription', lbl: '구독',      ico: 'card_membership' },
  { key: 'history',      lbl: '결제 내역', ico: 'receipt_long' },
  { key: 'refund',       lbl: '환불',      ico: 'undo' },
];

function PayRow({ p, showReceipt = true }) {
  return (
    <div className="bl-pay-row">
      <div className="bl-pay-row__main">
        <div className="bl-pay-row__item">{p.item}</div>
        <div className="bl-pay-row__meta">
          <span>{window.payDate(p.created_at)}</span>
          <span>{p.method}</span>
          {p.toss_key && <span>{p.toss_key.slice(0, 12)}…</span>}
        </div>
      </div>
      <div className="bl-pay-row__amt" data-refunded={p.status === 'refunded'}>{window.wonRaw(p.amount)}</div>
      <div className="bl-pay-row__right">
        <window.PayStatusBadge status={p.status} />
        {showReceipt && p.receipt && <a className="bl-receipt" href="#"><span className="ico material-symbols-outlined">download</span>영수증</a>}
      </div>
    </div>
  );
}

function SubscriptionTab({ onCancel }) {
  const s = window.MY_SUBSCRIPTION;
  return (
    <div>
      <div className="bl-sub" style={{ marginBottom: 14 }}>
        <div className="bl-sub__head">
          <div className="bl-sub__tier">
            <span className="bl-sub__name">{s.plan_name}</span>
            <span className="bl-sub__chip" data-s={s.status}>{s.status === 'active' ? '이용 중' : '해지 예정'}</span>
          </div>
          <div className="bl-sub__price">{window.wonRaw(s.price)} / 월 · 자동 결제</div>
        </div>
        <div className="bl-sub__meta">
          <div className="bl-sub__cell"><div className="bl-sub__cell-l">시작일</div><div className="bl-sub__cell-v">{window.dateK(s.started_at).slice(0, 10)}</div></div>
          <div className="bl-sub__cell"><div className="bl-sub__cell-l">다음 결제일</div><div className="bl-sub__cell-v">{window.dateK(s.next_billing).slice(0, 10)}</div></div>
          <div className="bl-sub__cell"><div className="bl-sub__cell-l">남은 기간</div><div className="bl-sub__cell-v">{s.days_left}<small> 일</small></div></div>
        </div>
        <div className="bl-sub__pay">
          <div className="bl-sub__pay-ico"><span className="ico material-symbols-outlined">credit_card</span></div>
          <div className="bl-sub__pay-body">
            <div className="bl-sub__pay-t">{s.method_brand} 카드</div>
            <div className="bl-sub__pay-s">•••• •••• •••• {s.method_last4} · 토스 빌링키</div>
          </div>
          <button className="btn btn--sm">변경</button>
        </div>
        <div className="bl-sub__actions">
          <a className="btn btn--primary" href="bu1-pricing.html"><span className="ico material-symbols-outlined">swap_horiz</span>구독 변경</a>
          <button className="btn" onClick={onCancel}><span className="ico material-symbols-outlined">cancel</span>구독 취소</button>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--ink-dim)', lineHeight: 1.6, margin: 0 }}>
        구독을 취소해도 <strong style={{ color: 'var(--ink-soft)' }}>{window.dateK(s.expires_at).slice(0, 10)}</strong>까지 BDR PRO 혜택이 유지됩니다. 이후 무료 플랜으로 자동 전환돼요.
      </p>
    </div>
  );
}

function HistoryTab() {
  return (
    <div className="bl-pay-list">
      {window.MY_PAYMENTS.map(p => <PayRow key={p.id} p={p} />)}
    </div>
  );
}

function RefundTab() {
  const refundable = window.MY_PAYMENTS.filter(p => p.status === 'paid' && (p.type === 'booking' || p.type === 'tournament'));
  const refunded = window.MY_PAYMENTS.filter(p => p.status === 'refunded');
  return (
    <div>
      <div className="bl-refund-note">
        <span className="ico material-symbols-outlined">info</span>
        <div>
          <div className="bl-refund-note__t">환불은 결제 항목별로 신청합니다</div>
          <div className="bl-refund-note__d">코트 예약·대회 참가비는 각 환불 정책에 따라 환불할 수 있어요. 구독 결제는 다음 결제일 전 <strong>구독 취소</strong>로 처리됩니다. 환불은 결제 수단으로 3~5영업일 내 입금돼요.</div>
        </div>
      </div>

      {refundable.length > 0 && (
        <>
          <div className="pm-sec-title" style={{ marginTop: 16 }}>환불 가능 결제</div>
          <div className="bl-pay-list">
            {refundable.map(p => (
              <div key={p.id} className="bl-pay-row">
                <div className="bl-pay-row__main">
                  <div className="bl-pay-row__item">{p.item}</div>
                  <div className="bl-pay-row__meta"><span>{window.payDate(p.created_at)}</span><span>{p.method}</span></div>
                </div>
                <div className="bl-pay-row__amt">{window.wonRaw(p.amount)}</div>
                <div className="bl-pay-row__right">
                  <button className="btn btn--sm">환불 신청</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="pm-sec-title" style={{ marginTop: 16 }}>환불 완료</div>
      {refunded.length > 0
        ? <div className="bl-pay-list">{refunded.map(p => <PayRow key={p.id} p={p} showReceipt={false} />)}</div>
        : <div className="pm-empty"><span className="ico material-symbols-outlined">undo</span><p>환불 내역이 없습니다</p></div>}
    </div>
  );
}

function ProfileBilling() {
  const [tab, setTab] = React.useState('subscription');
  const [cancelOpen, setCancelOpen] = React.useState(false);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <window.PageBackBilling to="설정" href="pu2-profile-edit.html" />

        <div className="bl-crumb">
          <a href="pu1-profile.html">프로필</a><span className="sep">›</span><span className="cur">결제·구독</span>
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>결제 · BILLING</div>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>결제·구독 관리</h1>

        {/* sub-tabs (?tab=) */}
        <div className="bl-subtabs">
          {BU3_TABS.map(t => (
            <button key={t.key} className={'bl-subtab' + (tab === t.key ? ' is-on' : '')} onClick={() => setTab(t.key)}>
              <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
            </button>
          ))}
        </div>

        {tab === 'subscription' && <SubscriptionTab onCancel={() => setCancelOpen(true)} />}
        {tab === 'history' && <HistoryTab />}
        {tab === 'refund' && <RefundTab />}
      </div>

      {/* 구독 취소 모달 */}
      {cancelOpen && (
        <div className="bl-modal-stage" onClick={() => setCancelOpen(false)}>
          <div className="bl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <div>
                <h3 className="bl-modal__title">구독을 취소할까요?</h3>
                <div className="bl-modal__sub">BDR PRO · {window.wonRaw(9900)}/월</div>
              </div>
              <button className="bl-modal__close" onClick={() => setCancelOpen(false)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="bl-refund-note">
                <span className="ico material-symbols-outlined">event_available</span>
                <div>
                  <div className="bl-refund-note__t">{window.dateK(window.MY_SUBSCRIPTION.expires_at).slice(0, 10)}까지 이용 가능</div>
                  <div className="bl-refund-note__d">지금 취소해도 남은 기간 동안 PRO 혜택이 유지되며, 이후 무료 플랜으로 자동 전환됩니다. 위약금은 없어요.</div>
                </div>
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setCancelOpen(false)}>유지하기</button>
              <button className="btn btn-reject" onClick={() => setCancelOpen(false)}><span className="ico material-symbols-outlined">cancel</span>구독 취소</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ProfileBilling = ProfileBilling;
