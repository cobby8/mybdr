/* global React */
// ============================================================
// BDR v2.25 — AdminPayments (BA1 · Phase 6.2A · 신규 · BB2+BB6 · super-admin)
// 운영: /admin/payments (66 · payments + refund API) · 박제 ❌ → Phase 4 OA1 답습.
// 측: Site Operator (super-admin)
//
// Hero (이달/누적/환불/실패 + Site Operator badge) + 검색·필터 + 4 탭
//   (성공 / 실패 / 환불됨 / 환불 대기) + 결제 테이블 + 환불 모달 (refund API 실연결).
// 모달 = Phase 2 UD1 답습 (알림 ✅). BB2 = BU3 결제 이력 동일 payments.
// ============================================================
const BA1_TABS = [
  { key: 'paid',        lbl: '성공',      ico: 'check_circle' },
  { key: 'failed',      lbl: '실패',      ico: 'error' },
  { key: 'refunded',    lbl: '환불됨',    ico: 'undo' },
  { key: 'refund_wait', lbl: '환불 대기', ico: 'schedule' },
];
const BA1_PERIOD = ['이번달', '최근 30일', '최근 90일', '1년', '전체'];

function AdminPayments() {
  const all = window.ADMIN_PAYMENTS;
  const [tab, setTab] = React.useState('paid');
  const [refundT, setRefundT] = React.useState(null);
  const [notify, setNotify] = React.useState(true);

  const paid = all.filter(p => p.status === 'paid');
  const monthSum = paid.reduce((a, p) => a + p.amount, 0);
  const counts = {
    paid: paid.length,
    failed: all.filter(p => p.status === 'failed').length,
    refunded: all.filter(p => p.status === 'refunded').length,
    refund_wait: all.filter(p => p.status === 'refund_wait').length,
  };
  const refundSum = all.filter(p => p.status === 'refunded').reduce((a, p) => a + p.amount, 0);
  const rows = all.filter(p => p.status === tab);

  return (
    <div className="oa1-page">
      {/* Hero */}
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>결제 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 비즈니스 · 토스페이먼츠 실연결</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{window.wonRaw(monthSum)}</div><div className="oa1-hero__stat-lbl">이번달 결제</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{counts.paid}</div><div className="oa1-hero__stat-lbl">성공 건수</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--archived">{window.wonRaw(refundSum)}</div><div className="oa1-hero__stat-lbl">환불 합계</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--rejected">{counts.failed}</div><div className="oa1-hero__stat-lbl">실패</div></div>
        </div>
      </header>

      {/* 검색 + 필터 */}
      <div className="oa1-filter">
        <div className="tu1-filter__search" style={{ minWidth: 220, maxWidth: 320 }}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="사용자 / 결제 ID / 토스 키" />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="tu1-filter__lbl">기간</span>
          <select className="ga-filter__sel">{BA1_PERIOD.map(o => <option key={o}>{o}</option>)}</select>
        </div>
      </div>

      {/* tabs */}
      <div className="ca1-tabs">
        {BA1_TABS.map(t => (
          <button key={t.key} className={'ca1-tab' + (tab === t.key ? ' is-on' : '')} data-active={tab === t.key} onClick={() => setTab(t.key)}>
            <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
            <span className="ca1-tab__count">{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {/* table */}
      <div className="bl-ptable">
        <div className="bl-ptable__head">
          <div>사용자</div><div>결제 항목</div><div>금액</div><div>상태</div><div style={{ textAlign: 'right' }}>액션</div>
        </div>
        {rows.map(p => (
          <div key={p.id} className="bl-ptable__row" onClick={() => p.status === 'paid' && setRefundT(p)}>
            <div className="bl-p-user" data-label="사용자">
              <span className="bl-p-av">{p.avatar}</span>
              <div style={{ minWidth: 0 }}>
                <div className="bl-p-name">{p.user}</div>
                <div className="bl-p-handle">@{p.handle}</div>
              </div>
            </div>
            <div data-label="항목">
              <div className="bl-p-item">{p.item}</div>
              <div className="bl-p-key">{p.toss_key ? p.toss_key.slice(0, 14) + '…' : (p.fail_code || p.id)} · {window.payDate(p.created_at)}</div>
            </div>
            <div className="bl-p-amt" data-label="금액">{window.wonRaw(p.amount)}</div>
            <div data-label="상태"><window.PayStatusBadge status={p.status} /></div>
            <div className="bl-p-act" data-label="액션" onClick={(e) => e.stopPropagation()}>
              {p.status === 'paid'
                ? <button className="btn btn--sm" onClick={() => setRefundT(p)}><span className="ico material-symbols-outlined">currency_exchange</span>환불</button>
                : p.status === 'refund_wait'
                  ? <button className="btn btn--sm btn-suspend" onClick={() => setRefundT(p)}>처리</button>
                  : <span className="bl-p-date">{p.refunded_at ? '환불 ' + window.payDate(p.refunded_at).slice(0, 8) : '—'}</span>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="pm-empty"><span className="ico material-symbols-outlined">receipt_long</span><p>해당 상태의 결제가 없습니다</p></div>}
      </div>

      {/* 환불 모달 (refund API · Phase 2 UD1 알림) */}
      {refundT && (
        <div className="bl-modal-stage" onClick={() => setRefundT(null)}>
          <div className="bl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <div>
                <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--err)' }}>currency_exchange</span>결제 환불</h3>
                <div className="bl-modal__sub">{refundT.toss_key || refundT.id} · {refundT.user}</div>
              </div>
              <button className="bl-modal__close" onClick={() => setRefundT(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="bl-pay-row" style={{ marginBottom: 16 }}>
                <div className="bl-pay-row__main">
                  <div className="bl-pay-row__item">{refundT.item}</div>
                  <div className="bl-pay-row__meta"><span>{refundT.user} (@{refundT.handle})</span><span>{window.payDate(refundT.created_at)}</span></div>
                </div>
                <div className="bl-pay-row__amt">{window.wonRaw(refundT.amount)}</div>
                <div className="bl-pay-row__right"><window.PayStatusBadge status={refundT.status} /></div>
              </div>
              <div className="bl-field">
                <label className="bl-field__l">환불 금액</label>
                <input className="pm-input" defaultValue={window.wonRaw(refundT.amount)} />
              </div>
              <div className="bl-field" style={{ marginBottom: 0 }}>
                <label className="bl-field__l">환불 사유 (사용자 안내용)</label>
                <input className="pm-input" placeholder="중복 결제 / 예약 취소 등" />
              </div>
            </div>
            <div className="bl-modal__foot">
              <div className="bl-modal__notify">
                <input type="checkbox" id="ba1-notify" checked={notify} onChange={() => setNotify(!notify)} />
                <div>
                  <strong>환불 결과를 사용자에게 알림 발송</strong>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 2 }}>카카오 알림톡 + 이메일 ({refundT.user})</div>
                </div>
              </div>
              <button className="btn btn--sm" onClick={() => setRefundT(null)}>취소</button>
              <button className="btn btn--sm btn-reject"><span className="ico material-symbols-outlined">currency_exchange</span>환불 + 알림</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminPayments = AdminPayments;
