/* global React */
// ============================================================
// BDR v2.27 — PasswordRecovery (AU3 · Phase 7 · 신규+보강 · BA3 ★★★)
// 운영: /forgot-password (164 · 박제 ❌) + /reset-password (449 · v2(1) 박제 ✅)
//
// forgot = 이메일 입력 + 전송 + 사후 안내 hero · reset = 4단계 indicator +
//   새 비밀번호 + 강도 미터 5단계 + 사후 hero. 시안 데모 토글.
// ============================================================
function ForgotView() {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  if (sent) {
    return (
      <div className="au-card__body">
        <div className="au-result au-result--mail">
          <div className="au-result__icon"><span className="ico material-symbols-outlined">mark_email_read</span></div>
          <h1 className="au-result__title">메일을 확인하세요</h1>
          <p className="au-result__desc"><strong>{email || 'you@example.com'}</strong>로 비밀번호 재설정 링크를 보냈어요. 메일이 안 보이면 스팸함도 확인해 주세요.</p>
          <button className="au-btn au-btn--ghost" onClick={() => setSent(false)}>다른 이메일로 다시 보내기</button>
        </div>
      </div>
    );
  }
  return (
    <div className="au-card__body">
      <div className="au-step-head">
        <h1 className="au-step-title" style={{ fontSize: 20 }}>비밀번호 찾기</h1>
        <p className="au-step-desc">가입한 이메일로 재설정 링크를 보내드려요.</p>
      </div>
      <div className="au-field">
        <label className="au-label">이메일</label>
        <input className="au-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
      </div>
      <button className="au-btn" style={{ marginTop: 6 }} onClick={() => setSent(true)}><span className="ico material-symbols-outlined">send</span>재설정 링크 전송</button>
      <div className="au-foot" style={{ marginTop: 16 }}><a href="au1-login-signup.html">← 로그인으로 돌아가기</a></div>
    </div>
  );
}

function ResetView() {
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [done, setDone] = React.useState(false);
  const strength = window.pwStrength(pw);
  const RESET_STEPS = [{ label: '이메일 확인' }, { label: '인증 코드' }, { label: '새 비밀번호' }, { label: '완료' }];
  const canSubmit = strength >= 3 && pw === pw2 && pw.length >= 8;

  return (
    <div className="au-card__body">
      <window.AuStepper steps={RESET_STEPS} current={done ? 3 : 2} />
      {done ? (
        <div className="au-result au-result--ok">
          <div className="au-result__icon"><span className="ico material-symbols-outlined">check</span></div>
          <h1 className="au-result__title">비밀번호가 변경됐어요</h1>
          <p className="au-result__desc">새 비밀번호로 다시 로그인해 주세요. 잠시 후 로그인 화면으로 이동합니다.</p>
          <a className="au-btn" href="au1-login-signup.html">로그인하기</a>
        </div>
      ) : (
        <>
          <div className="au-step-head" style={{ marginBottom: 18 }}>
            <h1 className="au-step-title" style={{ fontSize: 20 }}>새 비밀번호 설정</h1>
            <p className="au-step-desc">안전한 비밀번호를 입력해 주세요.</p>
          </div>
          <div className="au-field">
            <label className="au-label">새 비밀번호</label>
            <window.PwInput value={pw} onChange={e => setPw(e.target.value)} placeholder="8자 이상" />
            <window.PwStrength pw={pw} />
          </div>
          <div className="au-field">
            <label className="au-label">새 비밀번호 확인</label>
            <window.PwInput value={pw2} onChange={e => setPw2(e.target.value)} placeholder="비밀번호 재입력" />
            {pw2 && pw !== pw2 && <div className="au-hint" style={{ color: 'var(--err)' }}>비밀번호가 일치하지 않습니다</div>}
          </div>
          <div className="au-reqs"><b>비밀번호 요구사항</b><br />· 8자 이상 · 영문 대소문자 · 숫자 1개 이상 · 특수문자 권장</div>
          <button className="au-btn" style={{ marginTop: 14 }} disabled={!canSubmit} onClick={() => setDone(true)}>비밀번호 변경</button>
        </>
      )}
    </div>
  );
}

function PasswordRecovery() {
  const [view, setView] = React.useState('forgot');
  return (
    <div className="au-page">
      <div className="au-wrap">
        <window.AuthBrand slogan="비밀번호 재설정" />
        <div style={{ textAlign: 'center' }}>
          <div className="au-demo">
            <button className={view === 'forgot' ? 'is-on' : ''} onClick={() => setView('forgot')}>비밀번호 찾기</button>
            <button className={view === 'reset' ? 'is-on' : ''} onClick={() => setView('reset')}>재설정</button>
          </div>
        </div>
        <div className="au-card">
          {view === 'forgot' ? <ForgotView /> : <ResetView />}
        </div>
      </div>
    </div>
  );
}

window.PasswordRecovery = PasswordRecovery;
