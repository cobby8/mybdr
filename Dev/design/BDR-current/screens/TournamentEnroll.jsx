/* global React */
// ============================================================
// TournamentEnroll.jsx — UA3 (부분보강 — B3 결제)
//   진입: setRoute('tournamentEnroll', { id })   /tournaments/[id]/join
//   복귀: setRoute('tournamentDetail', { id })
//   에러: setRoute('serverError')
//
// 5단계 stepper 보존 (대회확인 / 디비전 / 로스터 / 서류 / 결제)
//  + step 5 결제: 결제수단 / 명세 / 안내
//  + 5단계 완료 후 "사후 안내" page (success hero + CTA)
// ============================================================

(function () {
  const { useState } = React;

  const STEPS = [
    { n: 1, label: '대회 확인',  ico: 'info' },
    { n: 2, label: '디비전',     ico: 'category' },
    { n: 3, label: '로스터',     ico: 'group' },
    { n: 4, label: '서류',       ico: 'description' },
    { n: 5, label: '결제',       ico: 'payments' },
  ];

  const T = {
    name: 'BDR 서머 오픈 #4',
    deadline: '2026-05-09',
    pay_due_days: 3,
  };

  const PAYMENT_METHODS = [
    { key: 'bank',     label: '계좌이체',  desc: '발급된 가상계좌로 입금',     ico: 'account_balance' },
    { key: 'manual',   label: '무통장 입금', desc: '운영팀 계좌 직접 입금 (수동 확인)', ico: 'receipt_long' },
    { key: 'card',     label: '카드 결제',  desc: '신용/체크카드 즉시 결제',     ico: 'credit_card' },
  ];

  function Stepper({ step }) {
    return (
      <ol className="te-stepper">
        {STEPS.map((s, i) => {
          const done = step > s.n;
          const cur  = step === s.n;
          const state = done ? 'done' : cur ? 'cur' : 'mute';
          return (
            <li key={s.n} className={'te-step is-' + state}>
              <span className="te-step__dot">
                {done ? <span className="ico material-symbols-outlined">check</span> : s.n}
              </span>
              <span className="te-step__lbl">{s.label}</span>
              {i < STEPS.length - 1 && <span className={'te-step__line is-' + (done ? 'done' : 'mute')} />}
            </li>
          );
        })}
      </ol>
    );
  }

  function PayPane({ method, onMethod, division, t }) {
    const fee = division === '오픈' ? 60000 : division === '아마추어' ? 40000 : 25000;
    const insurance = 15000;
    const total = fee + insurance;

    return (
      <div className="te-pay">
        <div className="te-pay__col">
          <h3 className="te-h3">결제 수단</h3>
          <div className="te-methods">
            {PAYMENT_METHODS.map(m => (
              <label key={m.key} className={'te-method' + (method === m.key ? ' is-on' : '')}>
                <input
                  type="radio"
                  name="pay"
                  checked={method === m.key}
                  onChange={() => onMethod(m.key)}
                />
                <span className="te-method__ico ico material-symbols-outlined">{m.ico}</span>
                <span className="te-method__txt">
                  <span className="te-method__label">{m.label}</span>
                  <span className="te-method__desc">{m.desc}</span>
                </span>
                <span className="te-method__check ico material-symbols-outlined">check_circle</span>
              </label>
            ))}
          </div>

          {method === 'manual' && (
            <div className="te-bank">
              <div className="te-bank__title">운영팀 입금 계좌</div>
              <div className="te-bank__row"><span>은행</span><b>국민은행</b></div>
              <div className="te-bank__row"><span>계좌</span><b>123-4567-89012</b></div>
              <div className="te-bank__row"><span>예금주</span><b>(사)BDR운영팀</b></div>
              <div className="te-bank__note">입금자명에 <b>팀명_주장닉네임</b> 형식으로 입금해 주세요.</div>
            </div>
          )}
        </div>

        <div className="te-pay__col">
          <h3 className="te-h3">결제 금액</h3>
          <div className="te-bill">
            <div className="te-bill__row">
              <span>참가비 ({division || '아마추어'})</span>
              <span>{fee.toLocaleString()}원</span>
            </div>
            <div className="te-bill__row">
              <span>보험료 <span className="te-bill__sub">(의무가입)</span></span>
              <span>{insurance.toLocaleString()}원</span>
            </div>
            <div className="te-bill__row te-bill__row--total">
              <span>합계</span>
              <span>{total.toLocaleString()}원</span>
            </div>
          </div>
          <div className="te-pay__note">
            <span className="ico material-symbols-outlined">info</span>
            <div>
              <b>결제 완료 후 운영자 승인 대기.</b>
              <br/>승인 결과는 알림으로 전달됩니다. 결제는 신청일로부터 <b>{t.pay_due_days}일 내</b> 처리 필요.
            </div>
          </div>
        </div>
      </div>
    );
  }

  function SuccessHero() {
    return (
      <div className="te-success">
        <div className="te-success__icon">
          <span className="ico material-symbols-outlined">check_circle</span>
        </div>
        <div className="te-success__eyebrow">ENROLLMENT COMPLETE</div>
        <h1 className="te-success__title">신청이 접수되었습니다</h1>
        <p className="te-success__sub">
          관리자 승인 시 알림과 쪽지로 알려드립니다. 결제는 <b>{T.pay_due_days}일 내</b> 처리해 주세요.
        </p>

        <ol className="te-success__steps">
          <li>
            <span className="te-success__step-n">1</span>
            <div>
              <div className="te-success__step-t">서류 검토 (24시간 이내)</div>
              <div className="te-success__step-s">운영자가 로스터 / 보험증서 확인</div>
            </div>
          </li>
          <li>
            <span className="te-success__step-n">2</span>
            <div>
              <div className="te-success__step-t">결제 확인</div>
              <div className="te-success__step-s">선택한 결제수단으로 입금/카드결제 처리</div>
            </div>
          </li>
          <li>
            <span className="te-success__step-n">3</span>
            <div>
              <div className="te-success__step-t">참가 확정 알림</div>
              <div className="te-success__step-s">조 추첨 + 대진표 공개 시 자동 알림</div>
            </div>
          </li>
        </ol>

        <div className="te-success__cta">
          <button className="btn btn--accent btn--touch">
            <span className="ico material-symbols-outlined">person</span>
            내 참가 현황 보기
          </button>
          <button className="btn btn--touch">
            <span className="ico material-symbols-outlined">arrow_back</span>
            대회 상세로
          </button>
        </div>
      </div>
    );
  }

  // ---- Step placeholders (1~4 are existing — kept as condensed mock) ----
  function PlaceholderPane({ n, label }) {
    return (
      <div className="te-placeholder">
        <span className="te-placeholder__n">STEP {n}</span>
        <h3 className="te-h3">{label}</h3>
        <p className="te-placeholder__p">
          이 단계 (Phase 1B 보존 항목) — <code>enroll-stepper</code> / <code>enroll-aside</code> / <code>enroll-poster</code> /
          <code>enroll-step-docs</code> 시그니처 유지. 본 시안 보강 = step 5 결제 + 사후 안내.
        </p>
        <div className="te-placeholder__mock">
          {n === 2 && <div>오픈 / 아마추어 / U18 디비전 선택 (기존 박제 보존)</div>}
          {n === 3 && <div>등록 선수 5–10명 선택 (TEAMS / 로스터 골격 보존)</div>}
          {n === 4 && <div>보험증서 / 신분증 / 학교장 추천서 (U18) 업로드</div>}
          {n === 1 && <div>대회 정보 / 시리즈 / 상금 / 일정 요약 (기존 enroll-poster 보존)</div>}
        </div>
      </div>
    );
  }

  window.TournamentEnroll = function TournamentEnroll({ setRoute, startStep = 5 }) {
    const [step, setStep] = useState(startStep);
    const [done, setDone] = useState(false);
    const [method, setMethod] = useState('bank');
    const [division] = useState('아마추어');

    if (done) {
      return (
        <div className="te-page te-page--done">
          <div className="te-inner">
            <SuccessHero />
          </div>
        </div>
      );
    }

    return (
      <div className="te-page">
        <div className="te-inner">
          <window.Crumbs trail={['홈', '대회', T.name, '접수']} />

          <header className="te-header">
            <window.Eyebrow>TOURNAMENT ENROLLMENT · 대회 접수</window.Eyebrow>
            <h1 className="te-title">{T.name}</h1>
            <p className="te-sub">
              접수마감 <b className="te-sub__d">D-11 (5/9 23:59)</b> · 예선 6/15–17 · 본선 6/20–21
            </p>
          </header>

          <Stepper step={step} />

          <div className="te-body">
            <div className="te-card">
              {step < 5
                ? <PlaceholderPane n={step} label={STEPS[step-1].label} />
                : <PayPane method={method} onMethod={setMethod} division={division} t={T} />}

              <div className="te-actions">
                <button className="btn btn--touch" disabled={step <= 1} onClick={() => setStep(s => Math.max(1, s - 1))}>
                  <span className="ico material-symbols-outlined">arrow_back</span>
                  이전
                </button>
                {step < 5
                  ? <button className="btn btn--accent btn--touch" onClick={() => setStep(s => s + 1)}>
                      다음
                      <span className="ico material-symbols-outlined">arrow_forward</span>
                    </button>
                  : <button className="btn btn--accent btn--touch" onClick={() => setDone(true)}>
                      <span className="ico material-symbols-outlined">check</span>
                      신청 완료
                    </button>}
              </div>
            </div>

            <aside className="te-aside">
              <h3 className="te-aside__h">신청 요약</h3>
              <dl className="te-aside__list">
                <div><dt>대회</dt><dd>{T.name}</dd></div>
                <div><dt>디비전</dt><dd>{division}</dd></div>
                <div><dt>팀</dt><dd>rdm 농구단</dd></div>
                <div><dt>로스터</dt><dd>8명</dd></div>
                <div><dt>참가비</dt><dd>40,000원</dd></div>
                <div><dt>보험료</dt><dd>15,000원</dd></div>
                <div className="te-aside__total"><dt>합계</dt><dd>55,000원</dd></div>
              </dl>
              <div className="te-aside__d">
                <span className="ico material-symbols-outlined">schedule</span>
                <span>접수 마감 <b>D-11</b></span>
              </div>
            </aside>
          </div>
        </div>

        {/* mobile sticky bottom CTA */}
        <div className="te-mobile-cta">
          <span className="te-mobile-cta__step">STEP {step}/5</span>
          {step < 5
            ? <button className="btn btn--accent btn--touch te-mobile-cta__btn" onClick={() => setStep(s => s + 1)}>다음 단계</button>
            : <button className="btn btn--accent btn--touch te-mobile-cta__btn" onClick={() => setDone(true)}>55,000원 결제 · 신청 완료</button>}
        </div>
      </div>
    );
  };
})();
