/* global React */
// ============================================================
// BDR v2.28 — CourtBooking (VU3 · Phase 8B · 통합 신규 · BV2 ★★★★★)
// 운영: booking(157) + payment-fail(236) + checkin(181) = 574 · 박제 ❌ → 3-step wizard.
//
// Step1 시간 선택 (날짜 + 가능 시간 grid + 인원) · Step2 결제 (Phase 6.2 BU2 토스 위젯) ·
// Step3 사후 (성공 hero + QR + 체크인 link / 실패 hero Phase 6.2 BU5 답습).
// 별 화면 = /checkin (QR hero · court_checkins). 토스 실연결 mock 0.
// ============================================================
const VU3_DATES = [
  { w: '오늘', d: '7' }, { w: '월', d: '8' }, { w: '화', d: '9' }, { w: '수', d: '10' },
  { w: '목', d: '11' }, { w: '금', d: '12' }, { w: '토', d: '13' },
];
const VU3_PM = [
  { key: 'card', label: '카드', ico: 'credit_card' },
  { key: 'transfer', label: '계좌이체', ico: 'account_balance' },
  { key: 'easy', label: '간편결제', ico: 'bolt' },
];

function CourtBooking() {
  const c = window.COURTS[0];
  const [step, setStep] = React.useState(0);
  const [date, setDate] = React.useState(0);
  const [slot, setSlot] = React.useState(null);
  const [pm, setPm] = React.useState('card');
  const [result, setResult] = React.useState('success');
  const [view, setView] = React.useState('booking'); // booking | checkin

  const amount = c.fee;

  if (view === 'checkin') {
    return (
      <div className="pm-page">
        <div className="pm-page__inner bl-narrow">
          <div style={{ textAlign: 'center', marginBottom: 14 }}>
            <button className="au-back" onClick={() => setView('booking')} style={{ background: 'none', border: 0, cursor: 'pointer' }}><span className="ico material-symbols-outlined">arrow_back</span>예약으로</button>
          </div>
          <div className="bl-result bl-result--ok" style={{ maxWidth: 420 }}>
            <div className="au-step-eyebrow" style={{ color: 'var(--ink-dim)' }}>현장 체크인 · CHECK-IN</div>
            <h1 className="bl-result__title" style={{ marginTop: 8 }}>{c.name}</h1>
            <p className="bl-result__desc">코트에 부착된 QR을 스캔하거나, 아래 버튼으로 체크인하세요.</p>
            <div className="cv-qr"><div className="cv-qr__inner"><span className="ico material-symbols-outlined">qr_code_2</span></div></div>
            <dl className="bl-result__detail" style={{ marginBottom: 18 }}>
              <dt>예약 시간</dt><dd>6월 7일 (오늘) 19:00–20:00</dd>
              <dt>예약 번호</dt><dd className="mono">BK-905</dd>
            </dl>
            <div className="bl-result__btns">
              <button className="bl-paybtn" style={{ background: 'var(--ok)', borderColor: 'var(--ok)' }}><span className="ico material-symbols-outlined">check</span>체크인 완료</button>
              <a className="btn" href="vu2-court-detail.html">코트 상세로</a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-narrow">
        <a className="pm-back" href="vu2-court-detail.html"><span className="ico material-symbols-outlined">arrow_back_ios_new</span>코트 상세</a>

        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 26, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 18px', color: 'var(--ink)' }}>코트 예약</h1>

        <window.StepIndicator steps={['시간 선택', '결제', '예약 완료']} current={step} />

        {/* court summary */}
        <div className="cv-booking-court">
          <span className="cv-booking-court__ico"><span className="ico material-symbols-outlined">stadium</span></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="cv-booking-court__name">{c.name}</div>
            <div className="cv-booking-court__loc">{c.addr}</div>
          </div>
          <window.StarRating value={c.rating} />
        </div>

        {/* STEP 1 */}
        {step === 0 && (
          <>
            <div className="pm-sec-title" style={{ marginBottom: 8 }}>날짜</div>
            <div className="cv-date-row">
              {VU3_DATES.map((dt, i) => (
                <button key={i} className={'cv-date' + (date === i ? ' is-on' : '')} onClick={() => setDate(i)}>
                  <div className="cv-date__w">{dt.w}</div><div className="cv-date__d">{dt.d}</div>
                </button>
              ))}
            </div>
            <div className="pm-sec-title" style={{ marginBottom: 8 }}>시간 (1시간 단위)</div>
            <div className="cv-slots">
              {window.BOOKING_SLOTS.map(s => (
                <button key={s.t} className={'cv-slot' + (slot === s.t ? ' is-on' : '')} disabled={!s.avail} onClick={() => setSlot(s.t)}>
                  <div className="cv-slot__t">{s.t}</div>
                  <div className="cv-slot__s">{s.avail ? s.spots + '자리' : '마감'}</div>
                </button>
              ))}
            </div>
            <div className="bl-summary" style={{ marginTop: 18 }}>
              <div>
                <div className="bl-summary__l">선택</div>
                <div className="bl-summary__name">{slot ? VU3_DATES[date].d + '일 ' + slot : '시간을 선택하세요'}</div>
              </div>
              <window.PriceTag price={amount} type="one_time" size="md" />
            </div>
            <button className="au-btn au-btn--accent" style={{ marginTop: 14 }} disabled={!slot} onClick={() => setStep(1)}>결제 단계로<span className="ico material-symbols-outlined">arrow_forward</span></button>
          </>
        )}

        {/* STEP 2 — 토스 위젯 (BU2 답습) */}
        {step === 1 && (
          <>
            <div className="bl-summary">
              <div>
                <div className="bl-summary__l">예약 정보</div>
                <div className="bl-summary__name">{c.name}</div>
                <div className="bl-summary__type">{VU3_DATES[date].d}일 {slot}–{slot ? (parseInt(slot) + 1) + ':00' : ''} · 1시간</div>
              </div>
              <window.PriceTag price={amount} type="one_time" size="md" />
            </div>

            <div className="bl-widget" style={{ marginBottom: 16 }}>
              <div className="bl-widget__head">
                <span className="bl-widget__title">결제 수단 선택</span>
                <span className="bl-widget__brand"><span className="ico material-symbols-outlined">shield</span>toss payments</span>
              </div>
              <div className="bl-widget__body">
                <div className="bl-pm-row">
                  {VU3_PM.map(m => (
                    <button key={m.key} className={'bl-pm' + (pm === m.key ? ' is-on' : '')} onClick={() => setPm(m.key)}>
                      <span className="ico material-symbols-outlined">{m.ico}</span>{m.label}
                    </button>
                  ))}
                </div>
                {pm === 'card' && (
                  <div className="bl-pm-skel">
                    <div className="bl-pm-skel__bar">카드 번호  ····  ····  ····  ····</div>
                    <div className="bl-pm-skel__half"><div className="bl-pm-skel__bar">MM/YY</div><div className="bl-pm-skel__bar">비밀번호 ··</div></div>
                  </div>
                )}
                {pm !== 'card' && <div className="bl-pm-skel"><div className="bl-pm-skel__bar">{pm === 'transfer' ? '은행 선택 후 계좌 인증' : '간편결제 앱 연결'}</div></div>}
              </div>
              <div className="bl-widget__note"><span className="ico material-symbols-outlined">lock</span>토스페이먼츠 안전 결제 · 예약 24시간 전 취소 시 100% 환불</div>
            </div>

            {/* 시안 데모: 성공/실패 토글 */}
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div className="au-demo">
                <button className={result === 'success' ? 'is-on' : ''} onClick={() => setResult('success')}>결제 성공</button>
                <button className={result === 'fail' ? 'is-on' : ''} onClick={() => setResult('fail')}>결제 실패</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="au-btn au-btn--ghost" style={{ flex: '0 0 90px' }} onClick={() => setStep(0)}>이전</button>
              <button className="bl-paybtn" onClick={() => setStep(2)}><span className="ico material-symbols-outlined">lock</span>{window.wonRaw(amount)} 결제</button>
            </div>
          </>
        )}

        {/* STEP 3 — 결과 */}
        {step === 2 && result === 'success' && (
          <div className="bl-result bl-result--ok">
            <div className="bl-result__icon"><span className="ico material-symbols-outlined">check</span></div>
            <div className="bl-result__eyebrow">예약 완료 · BOOKING CONFIRMED</div>
            <h1 className="bl-result__title">예약이 확정됐어요 🏀</h1>
            <p className="bl-result__desc">결제가 완료되어 코트가 예약됐습니다. 현장에서 QR로 체크인하세요.</p>
            <div className="cv-qr"><div className="cv-qr__inner"><span className="ico material-symbols-outlined">qr_code_2</span></div></div>
            <dl className="bl-result__detail" style={{ marginBottom: 18 }}>
              <dt>코트</dt><dd>{c.name}</dd>
              <dt>일시</dt><dd>6월 {VU3_DATES[date].d}일 {slot}–{slot ? (parseInt(slot) + 1) + ':00' : ''}</dd>
              <dt>결제 금액</dt><dd>{window.wonRaw(amount)}</dd>
              <dt>예약 번호</dt><dd className="mono">BK-905</dd>
            </dl>
            <div className="bl-result__btns">
              <button className="bl-paybtn" style={{ background: 'var(--ok)', borderColor: 'var(--ok)' }} onClick={() => setView('checkin')}><span className="ico material-symbols-outlined">qr_code_scanner</span>체크인 페이지</button>
              <a className="btn" href="bu4-profile-bookings.html">내 예약 보기</a>
            </div>
          </div>
        )}
        {step === 2 && result === 'fail' && (
          <div className="bl-result bl-result--fail">
            <div className="bl-result__icon"><span className="ico material-symbols-outlined">error</span></div>
            <div className="bl-result__eyebrow">결제 실패 · PAYMENT FAILED</div>
            <h1 className="bl-result__title">결제에 실패했어요</h1>
            <p className="bl-result__desc">카드 한도나 잔액을 확인한 뒤 다시 시도해 주세요. 예약은 아직 확정되지 않았어요.</p>
            <div className="bl-result__errchip"><span>오류 코드</span><code>NOT_ENOUGH_BALANCE</code></div>
            <div className="bl-result__btns">
              <button className="bl-paybtn" onClick={() => setStep(1)}><span className="ico material-symbols-outlined">refresh</span>다시 결제하기</button>
              <a className="btn" href="vu2-court-detail.html">코트 상세로</a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

window.CourtBooking = CourtBooking;
