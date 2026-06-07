/* global React */
// ============================================================
// BDR v2.27 — LoginSignup (AU1 · Phase 7 · 신규 통합 · BA1 ★★★★★)
// 운영: /login (549) + /signup (311) · 박제 ❌ → 통합 entry.
//
// 로그인/회원가입 탭 토글 · 같은 시각 패턴 · OAuth 4 (카카오/네이버/구글/애플)
// AU1-A 로그인 = 이메일+비번+자동로그인+비번찾기(→AU3) · AU1-B 회원가입 = +약관 3
// 사후 = onboarding 진입(→AU2) 또는 홈.
// ============================================================
function LoginSignup() {
  const [tab, setTab] = React.useState('login');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pw2, setPw2] = React.useState('');
  const [nick, setNick] = React.useState('');
  const [agree, setAgree] = React.useState(false);

  return (
    <div className="au-page">
      <div className="au-wrap">
        <window.AuthBrand />

        <div className="au-card">
          <div className="au-tabs">
            <button className={'au-tab' + (tab === 'login' ? ' is-on' : '')} onClick={() => setTab('login')}>로그인</button>
            <button className={'au-tab' + (tab === 'signup' ? ' is-on' : '')} onClick={() => setTab('signup')}>회원가입</button>
          </div>

          <div className="au-card__body">
            {tab === 'login' ? (
              <>
                <div className="au-field">
                  <label className="au-label">이메일</label>
                  <input className="au-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="au-field">
                  <label className="au-label">비밀번호</label>
                  <window.PwInput value={pw} onChange={e => setPw(e.target.value)} />
                </div>
                <div className="au-meta">
                  <label><input type="checkbox" defaultChecked />자동 로그인</label>
                  <a href="au3-password-recovery.html">비밀번호 찾기</a>
                </div>
                <a className="au-btn" href="au2-onboarding.html">로그인</a>
                <div className="au-divider">또는</div>
                <window.OAuthRow row />
                <div className="au-foot">아직 계정이 없으신가요? <button onClick={() => setTab('signup')}>회원가입</button></div>
              </>
            ) : (
              <>
                <div className="au-field">
                  <label className="au-label">이메일</label>
                  <input className="au-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
                </div>
                <div className="au-field">
                  <label className="au-label">비밀번호</label>
                  <window.PwInput value={pw} onChange={e => setPw(e.target.value)} placeholder="8자 이상" />
                  <window.PwStrength pw={pw} />
                  <div className="au-hint">8자 이상 · 영문·숫자·특수문자 포함</div>
                </div>
                <div className="au-field">
                  <label className="au-label">비밀번호 확인</label>
                  <window.PwInput value={pw2} onChange={e => setPw2(e.target.value)} placeholder="비밀번호 재입력" />
                  {pw2 && pw !== pw2 && <div className="au-hint" style={{ color: 'var(--err)' }}>비밀번호가 일치하지 않습니다</div>}
                </div>
                <div className="au-field">
                  <label className="au-label">닉네임</label>
                  <input className="au-input" value={nick} onChange={e => setNick(e.target.value)} placeholder="2~20자" />
                </div>
                <label className="au-terms" style={{ margin: '12px 0 16px' }}>
                  <input type="checkbox" checked={agree} onChange={() => setAgree(a => !a)} />
                  <span><a href="#">이용약관</a> 및 <a href="#">개인정보처리방침</a>에 동의합니다 <span style={{ color: 'var(--accent)', fontWeight: 800 }}>(필수)</span></span>
                </label>
                <a className="au-btn au-btn--accent" href={agree ? 'au2-onboarding.html' : undefined} aria-disabled={!agree} onClick={e => { if (!agree) e.preventDefault(); }} style={!agree ? { background: 'var(--border-strong)', borderColor: 'var(--border-strong)', color: 'var(--bg-elev)', cursor: 'not-allowed' } : {}}>가입하기</a>
                <div className="au-divider">또는 간편 가입</div>
                <window.OAuthRow row />
                <div className="au-foot">이미 계정이 있으신가요? <button onClick={() => setTab('login')}>로그인</button></div>
              </>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <a className="au-back" href="p2-uc2-home.html"><span className="ico material-symbols-outlined">arrow_back</span>홈으로 돌아가기</a>
        </div>
      </div>
    </div>
  );
}

window.LoginSignup = LoginSignup;
