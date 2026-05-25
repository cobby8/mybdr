/* global React */
/**
 * OnboardingIdentity — Phase 12 본인인증 (1/5)
 * 진입: 가입 직후 / 미인증 사용자 첫 로그인
 * 옵션: PASS / 휴대폰 인증 / NICE 본인확인
 */
function OnboardingIdentity({ setRoute }) {
  const { useState } = React;
  const [method, setMethod] = useState(null);
  const [phase, setPhase]   = useState('select'); // select | progress | done
  const [phone, setPhone]   = useState('');
  const [code,  setCode]    = useState('');
  const [sent,  setSent]    = useState(false);

  const start = (m) => {
    setMethod(m);
    if (m === 'phone') return setPhase('select'); // stay, will show form below
    setPhase('progress');
    setTimeout(() => setPhase('done'), 1600);
  };

  const sendCode = () => {
    if (!/^01\d{8,9}$/.test(phone.replace(/-/g, ''))) return alert('휴대폰 번호 형식 확인');
    setSent(true);
  };
  const verify = () => {
    if (code.length !== 6) return alert('인증번호 6자리');
    setPhase('done');
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <OnboardingStepHeader
        step={1}
        onBack={() => setRoute('signup')}
        onSkip={() => setRoute('onboardingBasketball')}
      />
      <div className="page" style={{ maxWidth: 560, paddingTop: 24 }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{
            margin: 0, fontFamily: 'var(--ff-display)', fontWeight: 800,
            fontSize: 26, letterSpacing: '-0.015em',
          }}>본인인증</h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
            안전한 매칭을 위해 1회 인증이 필요해요. 인증 정보는 매칭 외 용도로 사용되지 않습니다.
          </p>
        </div>

        {phase === 'done' ? (
          <DoneCard method={method} onNext={() => setRoute('onboardingBasketball')} />
        ) : (
          <React.Fragment>
            <div style={{ display: 'grid', gap: 10 }}>
              <MethodCard id="pass" active={method === 'pass'} onClick={() => start('pass')}
                tag="PASS" tagColor="var(--cafe-blue)"
                title="PASS 본인확인"
                desc="이동통신 3사 인증 앱 — 가장 빠릅니다 (~10초)"
                badge="추천" />
              <MethodCard id="phone" active={method === 'phone'} onClick={() => setMethod('phone')}
                tag="📱" title="휴대폰 인증"
                desc="SMS 6자리 인증번호 입력" />
              <MethodCard id="nice" active={method === 'nice'} onClick={() => start('nice')}
                tag="NICE" tagColor="var(--ink-soft)"
                title="NICE 본인확인"
                desc="공동·금융 인증서 / 신용카드 — 외국인·보호자 가능" />
            </div>

            {method === 'phone' && (
              <div style={{
                marginTop: 16, padding: 16,
                background: 'var(--bg-card)', border: '1px solid var(--cafe-blue-hair)',
                borderLeft: '3px solid var(--cafe-blue)',
                borderRadius: 'var(--radius-card)',
              }}>
                <label className="label">휴대폰 번호</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="input" type="tel" inputMode="numeric"
                    placeholder="010-0000-0000" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ flex: 1, fontSize: 16 }} />
                  <button className="btn" onClick={sendCode} disabled={sent}
                    style={{ minHeight: 44, whiteSpace: 'nowrap' }}>
                    {sent ? '재전송' : '인증번호'}
                  </button>
                </div>
                {sent && (
                  <div style={{ marginTop: 12 }}>
                    <label className="label">인증번호 (6자리) <span style={{ color: 'var(--accent)', fontFamily: 'var(--ff-mono)' }}>02:58</span></label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input className="input" type="text" inputMode="numeric" maxLength={6}
                        placeholder="000000" value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                        style={{ flex: 1, fontSize: 18, fontFamily: 'var(--ff-mono)', letterSpacing: '0.4em', textAlign: 'center' }} />
                      <button className="btn btn--primary" onClick={verify}
                        style={{ minHeight: 44 }}>확인</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {phase === 'progress' && method !== 'phone' && (
              <div style={{
                marginTop: 16, padding: 28,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)', textAlign: 'center',
              }}>
                <div style={{
                  width: 36, height: 36, margin: '0 auto 14px',
                  border: '3px solid var(--bg-alt)',
                  borderTopColor: 'var(--accent)',
                  borderRadius: '50%',
                  animation: 'idspin 1s linear infinite',
                }} />
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>
                  {method === 'pass' ? 'PASS 앱에서 인증 진행 중…' : 'NICE 본인확인 중…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 4 }}>
                  팝업 창에서 확인을 완료해주세요
                </div>
                <style>{`@keyframes idspin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            <SafetyNote />
          </React.Fragment>
        )}
      </div>
    </div>
  );
}

function MethodCard({ active, onClick, tag, tagColor = 'var(--cafe-blue)', title, desc, badge }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', minHeight: 72,
      background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-card)',
      border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border)'}`,
      borderRadius: 'var(--radius-card)',
      cursor: 'pointer', textAlign: 'left',
      transition: 'border-color .15s, background .15s',
    }}>
      <div style={{
        flex: '0 0 auto', width: 48, height: 48, borderRadius: 8,
        background: tagColor, color: '#fff',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 13, letterSpacing: '-0.01em',
      }}>{tag}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{title}</span>
          {badge && <span className="badge" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent' }}>{badge}</span>}
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <div style={{ color: 'var(--ink-dim)', fontSize: 18, lineHeight: 1 }}>›</div>
    </button>
  );
}

function DoneCard({ method, onNext }) {
  const labels = { pass: 'PASS', phone: '휴대폰', nice: 'NICE' };
  return (
    <div style={{
      padding: '32px 24px',
      background: 'var(--bg-card)', border: '1px solid var(--ok)',
      borderLeft: '3px solid var(--ok)',
      borderRadius: 'var(--radius-card)', textAlign: 'center',
    }}>
      <div style={{
        margin: '0 auto 12px', width: 56, height: 56, borderRadius: '50%',
        background: 'color-mix(in oklab, var(--ok) 18%, transparent)',
        color: 'var(--ok)', display: 'grid', placeItems: 'center',
        fontSize: 28, fontWeight: 900,
      }}>✓</div>
      <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 19, color: 'var(--ink)' }}>
        본인인증 완료
      </div>
      <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 6 }}>
        {labels[method] || ''} 인증으로 확인되었습니다
      </div>
      <span className="badge" style={{
        marginTop: 14, background: 'var(--ok)', color: '#fff', borderColor: 'transparent',
      }}>✓ 인증 완료</span>
      <div style={{ marginTop: 22 }}>
        <button className="btn btn--primary" onClick={onNext}
          style={{ minHeight: 48, padding: '0 32px' }}>
          농구정보 입력하기 →
        </button>
      </div>
    </div>
  );
}

function SafetyNote() {
  return (
    <div style={{
      marginTop: 18, padding: '12px 14px',
      background: 'var(--bg-alt)',
      borderRadius: 6, fontSize: 11.5,
      color: 'var(--ink-mute)', lineHeight: 1.6,
    }}>
      ⓘ <b style={{ color: 'var(--ink-soft)' }}>왜 인증하나요?</b><br/>
      · 미성년자 보호 (18세 미만 별도 안내) · 부정 가입 방지<br/>
      · 매칭 신뢰도 향상 — 인증된 회원만 게스트 모집·심판 신청 가능
    </div>
  );
}

window.OnboardingIdentity = OnboardingIdentity;
