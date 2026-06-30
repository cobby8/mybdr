/* global React, PasswordInput */

function PasswordReset({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState(['','','','','','']);
  const [pw1, setPw1] = React.useState('');
  const [pw2, setPw2] = React.useState('');

  // Strength
  const strength = (() => {
    let s = 0;
    if (pw1.length >= 8) s++;
    if (/[A-Z]/.test(pw1)) s++;
    if (/[0-9]/.test(pw1)) s++;
    if (/[^A-Za-z0-9]/.test(pw1)) s++;
    return s;
  })();
  const strengthLabel = ['매우 약함','약함','보통','강함','매우 강함'][strength];
  const strengthColor = ['var(--err)','var(--err)','var(--warn)','var(--ok)','var(--ok)'][strength];

  const steps = [
    { n:1, l:'이메일 확인' },
    { n:2, l:'인증 코드' },
    { n:3, l:'새 비밀번호' },
    { n:4, l:'완료' },
  ];

  const setCodeAt = (i, v) => {
    const next = [...code];
    next[i] = v.slice(-1);
    setCode(next);
    if (v && i < 5) {
      const el = document.getElementById(`pwcode-${i+1}`);
      if (el) el.focus();
    }
  };

  return (
    <div className="page" style={{maxWidth:520}}>
      <div style={{textAlign:'center', marginBottom:20}}>
        <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, letterSpacing:'-0.02em', marginBottom:4}}>MyBDR</div>
        <h1 style={{margin:'14px 0 4px', fontSize:22, fontWeight:800}}>비밀번호 재설정</h1>
        <p style={{margin:0, fontSize:13, color:'var(--ink-mute)'}}>가입할 때 쓴 이메일로 인증 코드를 보내드려요.</p>
      </div>

      <div style={{display:'flex', marginBottom:24, padding:'0 10px'}}>
        {steps.map((s, i) => (
          <div key={s.n} style={{flex:1, display:'flex', alignItems:'center'}}>
            <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4, position:'relative', zIndex:1}}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: step>=s.n ? 'var(--accent)' : 'var(--bg-alt)',
                color: step>=s.n ? '#fff' : 'var(--ink-dim)',
                display:'grid', placeItems:'center',
                fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:11,
              }}>{step>s.n ? '✓' : s.n}</div>
              <div style={{fontSize:10, fontWeight:700, color: step>=s.n ? 'var(--ink)' : 'var(--ink-dim)'}}>{s.l}</div>
            </div>
            {i<steps.length-1 && <div style={{flex:1, height:2, background: step>s.n ? 'var(--accent)' : 'var(--border)', margin:'0 6px', marginBottom:14}}/>}
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'28px 32px'}}>
        {step === 1 && (
          <div>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>이메일</label>
            <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoFocus/>
            <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:6}}>가입 시 등록한 이메일을 입력해주세요.</div>
            <button className="btn btn--primary btn--xl" style={{width:'100%', marginTop:20}} disabled={!email.includes('@')} onClick={()=>setStep(2)}>
              인증 코드 보내기
            </button>
            <div style={{textAlign:'center', marginTop:14, fontSize:12}}>
              <a onClick={()=>setRoute('login')} style={{cursor:'pointer', color:'var(--cafe-blue)', fontWeight:600}}>← 로그인으로 돌아가기</a>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{padding:'12px 14px', background:'color-mix(in oklab, var(--ok) 8%, transparent)', borderRadius:4, marginBottom:18, fontSize:13, color:'var(--ink-soft)'}}>
              <b style={{color:'var(--ok)'}}>✓</b> <b>{email}</b>(으)로 6자리 인증 코드를 보냈습니다.
            </div>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:10}}>인증 코드 6자리</label>
            <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:8, marginBottom:14}}>
              {code.map((c, i) => (
                <input
                  key={i}
                  id={`pwcode-${i}`}
                  className="input"
                  maxLength={1}
                  value={c}
                  onChange={e=>setCodeAt(i, e.target.value)}
                  style={{textAlign:'center', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:22, padding:'14px 0'}}
                  autoFocus={i===0}
                />
              ))}
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:12, color:'var(--ink-dim)', marginBottom:18}}>
              <span>코드 유효시간: <span style={{fontFamily:'var(--ff-mono)', color:'var(--err)', fontWeight:700}}>04:53</span></span>
              <a style={{cursor:'pointer', color:'var(--cafe-blue)', fontWeight:600}}>다시 보내기</a>
            </div>
            <button className="btn btn--primary btn--xl" style={{width:'100%'}} disabled={code.some(c=>!c)} onClick={()=>setStep(3)}>
              코드 확인
            </button>
          </div>
        )}

        {step === 3 && (
          <div>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>새 비밀번호</label>
            <PasswordInput value={pw1} onChange={e=>setPw1(e.target.value)} placeholder="8자 이상, 영문·숫자·기호" autoComplete="new-password"/>
            {pw1 && (
              <div style={{marginTop:8}}>
                <div style={{display:'flex', gap:4, marginBottom:4}}>
                  {[0,1,2,3].map(i => (
                    <div key={i} style={{flex:1, height:4, background: i<strength ? strengthColor : 'var(--border)', borderRadius:2}}/>
                  ))}
                </div>
                <div style={{fontSize:11, color:strengthColor, fontWeight:700}}>{strengthLabel}</div>
              </div>
            )}
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6, marginTop:16}}>비밀번호 확인</label>
            <PasswordInput value={pw2} onChange={e=>setPw2(e.target.value)} autoComplete="new-password"/>
            {pw2 && pw1 !== pw2 && <div style={{fontSize:11, color:'var(--err)', marginTop:4, fontWeight:700}}>비밀번호가 일치하지 않습니다</div>}

            <div style={{marginTop:18, padding:'10px 12px', background:'var(--bg-alt)', borderRadius:4, fontSize:11, color:'var(--ink-soft)', lineHeight:1.7}}>
              <b>비밀번호 요구사항</b><br/>
              · 8자 이상 · 영문 대소문자 포함 · 숫자 1개 이상 · 특수문자 권장
            </div>

            <button className="btn btn--primary btn--xl" style={{width:'100%', marginTop:20}} disabled={strength<3 || pw1!==pw2} onClick={()=>setStep(4)}>
              비밀번호 변경
            </button>
          </div>
        )}

        {step === 4 && (
          <div style={{textAlign:'center', padding:'20px 0'}}>
            <div style={{width:72, height:72, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:40, margin:'0 auto 18px', fontWeight:900}}>✓</div>
            <h2 style={{margin:'0 0 6px', fontSize:20, fontWeight:800}}>변경 완료</h2>
            <p style={{margin:'0 0 24px', fontSize:13, color:'var(--ink-mute)'}}>새 비밀번호로 로그인해주세요.</p>
            <button className="btn btn--primary btn--xl" onClick={()=>setRoute('login')}>로그인 화면으로</button>
          </div>
        )}
      </div>
    </div>
  );
}

window.PasswordReset = PasswordReset;
