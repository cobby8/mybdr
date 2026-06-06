/* global React */
// ============================================================
// BDR v2.25 — ProfileBookings (BU4 · Phase 6.2B · 보강 · BB4 ★★★)
// 운영: /profile/bookings (231 · court_bookings) · Phase 7 코트 cross-domain.
//
// 4 탭 (예정 / 진행 중 / 종료 / 취소·환불) + 예약 카드 (코트 + 날짜 + 시간 + 금액 + 상태)
// "예약 취소" → court-bookings/[id]/payment-cancel (환불 정책 모달).
// 본 의뢰는 사용자 본인 예약만 (court_bookings). 코트 상세 = Phase 7 cross-domain.
// ============================================================
const BU4_TABS = [
  { key: 'upcoming',  lbl: '예정',      ico: 'event_upcoming' },
  { key: 'ongoing',   lbl: '진행 중',   ico: 'play_circle' },
  { key: 'done',      lbl: '종료',      ico: 'task_alt' },
  { key: 'cancelled', lbl: '취소·환불', ico: 'undo' },
];

function BookingCard({ b, onCancel }) {
  const d = new Date(b.date + 'T00:00:00');
  const bs = window.BOOKING_STATUS[b.status];
  const w = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  const canCancel = b.status === 'upcoming';
  return (
    <div className="bl-booking">
      <div className="bl-booking__date">
        <div className="bl-booking__date-d">{d.getDate()}</div>
        <div className="bl-booking__date-m">{d.getMonth() + 1}월 ({w})</div>
      </div>
      <div className="bl-booking__div"></div>
      <div className="bl-booking__body">
        <div className="bl-booking__court">
          <span className="ico material-symbols-outlined">stadium</span>{b.court}
          <span className="bl-tag" title="Phase 7 코트 영역">코트</span>
        </div>
        <div className="bl-booking__meta">
          <span>{b.addr}</span>
          <span>{b.start}–{b.end}</span>
          <span className="bl-booking__amt">{window.wonRaw(b.amount)}</span>
        </div>
      </div>
      <div className="bl-booking__right">
        <span className="bl-bstat" data-tone={bs.tone}>{bs.label}</span>
        <window.PayStatusBadge status={b.pay_status} />
        <div className="bl-booking__actions">
          {canCancel
            ? <button className="btn btn--sm" onClick={() => onCancel(b)}><span className="ico material-symbols-outlined">close</span>예약 취소</button>
            : b.status === 'ongoing'
              ? <span className="bl-tag" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>오늘 이용</span>
              : null}
        </div>
      </div>
    </div>
  );
}

function ProfileBookings() {
  const all = window.MY_BOOKINGS;
  const [tab, setTab] = React.useState('upcoming');
  const [cancelT, setCancelT] = React.useState(null);

  const counts = {
    upcoming:  all.filter(b => b.status === 'upcoming').length,
    ongoing:   all.filter(b => b.status === 'ongoing').length,
    done:      all.filter(b => b.status === 'done').length,
    cancelled: all.filter(b => b.status === 'cancelled').length,
  };
  const rows = all.filter(b => b.status === tab);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <window.PageBackBilling />

        <div className="bl-crumb">
          <a href="pu1-profile.html">프로필</a><span className="sep">›</span><span className="cur">예약 내역</span>
        </div>
        <div className="eyebrow" style={{ marginBottom: 6 }}>예약 · BOOKINGS</div>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>코트 예약 내역</h1>

        {/* tabs */}
        <div className="ca1-tabs" style={{ marginBottom: 16 }}>
          {BU4_TABS.map(t => (
            <button key={t.key} className={'ca1-tab' + (tab === t.key ? ' is-on' : '')} data-active={tab === t.key} onClick={() => setTab(t.key)}>
              <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
              <span className="ca1-tab__count">{counts[t.key]}</span>
            </button>
          ))}
        </div>

        {/* list */}
        {rows.length > 0
          ? rows.map(b => <BookingCard key={b.id} b={b} onCancel={setCancelT} />)
          : <div className="pm-empty"><span className="ico material-symbols-outlined">event_busy</span><p>해당 상태의 예약이 없습니다</p></div>}

        {/* cross-domain note */}
        <div className="bl-refund-note" style={{ marginTop: 14 }}>
          <span className="ico material-symbols-outlined">hub</span>
          <div>
            <div className="bl-refund-note__t">코트 예약은 Phase 7 코트 영역과 연동됩니다</div>
            <div className="bl-refund-note__d">예약 결제는 토스페이먼츠로 처리되며, 결제 상태는 결제 내역(구독·결제)에서도 확인할 수 있어요. 대회·게스트 신청 내역은 <a href="uc1-my-activity.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>내 활동</a>에서 관리됩니다.</div>
          </div>
        </div>
      </div>

      {/* 취소 (payment-cancel) 모달 */}
      {cancelT && (
        <div className="bl-modal-stage" onClick={() => setCancelT(null)}>
          <div className="bl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title">예약을 취소할까요?</h3>
              <button className="bl-modal__close" onClick={() => setCancelT(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="bl-booking" style={{ marginBottom: 14 }}>
                <div className="bl-booking__body">
                  <div className="bl-booking__court"><span className="ico material-symbols-outlined">stadium</span>{cancelT.court}</div>
                  <div className="bl-booking__meta"><span>{window.dateK(cancelT.date)}</span><span>{cancelT.start}–{cancelT.end}</span></div>
                </div>
              </div>
              <div className="bl-refund-note">
                <span className="ico material-symbols-outlined">policy</span>
                <div>
                  <div className="bl-refund-note__t">환불 정책</div>
                  <div className="bl-refund-note__d">이용 24시간 전 취소 시 <strong style={{ color: 'var(--ok)' }}>100% 환불</strong>, 24시간 이내 취소 시 50% 환불됩니다. 환불은 결제 수단으로 3~5영업일 내 처리돼요.</div>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, padding: '12px 14px', background: 'var(--bg-alt)', borderRadius: 'var(--r-sm)' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>예상 환불 금액</span>
                <span style={{ fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 800, color: 'var(--ok)' }}>{window.wonRaw(cancelT.amount)}</span>
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setCancelT(null)}>유지하기</button>
              <button className="btn btn-reject" onClick={() => setCancelT(null)}><span className="ico material-symbols-outlined">undo</span>취소 + 환불 요청</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ProfileBookings = ProfileBookings;
