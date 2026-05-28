/* global React */

function Verify({ setRoute }) {
  const [step, setStep] = React.useState('phone'); // phone | code | done
  const [phone, setPhone] = React.useState('010-');
  const [code, setCode] = React.useState('');
  const [secondsLeft, setSecondsLeft] = React.useState(180);

  React.useEffect(() => {
    if (step !== 'code') return;
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s-1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div className="page" style={{maxWidth:480}}>
      <div className="eyebrow">온보딩 1/2 · VERIFY</div>
      <h1 style={{margin:'8px 0 6px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>전화번호 인증</h1>
      <p style={{color:'var(--ink-mute)', fontSize:14, marginBottom:24, lineHeight:1.6}}>
        매치 신청·대회 운영 알림을 받으려면 전화번호 인증이 필요합니다.
        SMS로 6자리 인증번호를 발송합니다.
      </p>

      {/* progress */}
      <div style={{display:'flex', gap:6, marginBottom:24}}>
        <div style={{flex:1, height:4, background: step!=='done' ? 'var(--cafe-blue)' : 'var(--ok)', borderRadius:2}}/>
        <div style={{flex:1, height:4, background: step==='done' ? 'var(--ok)' : 'var(--border)', borderRadius:2}}/>
      </div>

      {step === 'phone' && (
        <div className="card" style={{padding:'24px 26px'}}>
          <label className="label">휴대전화번호</label>
          <input className="input" inputMode="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="010-0000-0000" autoFocus/>
          <div style={{fontSize:12, color:'var(--ink-dim)', marginTop:8, lineHeight:1.6}}>
            ※ 입력하신 번호는 본인 확인과 알림 외 목적으로 사용되지 않습니다.
          </div>
          <div style={{marginTop:18, display:'flex', gap:8}}>
            <button className="btn btn--primary btn--xl" onClick={()=>{setStep('code'); setSecondsLeft(180);}}>
              인증번호 받기
            </button>
          </div>
          <div style={{marginTop:12, textAlign:'center'}}>
            <button className="btn btn--ghost" onClick={()=>setRoute('home')} style={{fontSize:13, color:'var(--ink-mute)'}}>
              나중에 (홈으로)
            </button>
          </div>
        </div>
      )}

      {step === 'code' && (
        <div className="card" style={{padding:'24px 26px'}}>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:6}}>{phone} 으로 발송됨</div>
          <label className="label">인증번호 6자리</label>
          <input className="input" inputMode="numeric" maxLength={6} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} placeholder="000000"
            style={{fontFamily:'var(--ff-mono)', fontSize:22, letterSpacing:'.4em', textAlign:'center'}} autoFocus/>
          <div style={{display:'flex', justifyContent:'space-between', marginTop:10, fontSize:12, color:'var(--ink-mute)'}}>
            <span>남은 시간 <b style={{color:'var(--accent)', fontFamily:'var(--ff-mono)'}}>{fmt(secondsLeft)}</b></span>
            <button className="btn btn--ghost btn--sm" onClick={()=>setSecondsLeft(180)}>재전송</button>
          </div>
          <div style={{marginTop:18, display:'grid', gap:8}}>
            <button className="btn btn--primary btn--xl" disabled={code.length<6} onClick={()=>setStep('done')}>
              인증 확인
            </button>
            <button className="btn btn--ghost" onClick={()=>setStep('phone')} style={{fontSize:13}}>
              번호 다시 입력
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div className="card" style={{padding:'32px 26px', textAlign:'center'}}>
          <div style={{width:64, height:64, background:'var(--ok)', color:'#fff', borderRadius:'50%', display:'grid', placeItems:'center', margin:'0 auto 16px', fontSize:32, fontWeight:700}}>✓</div>
          <h2 style={{margin:'0 0 6px', fontSize:20, fontWeight:700}}>인증 완료</h2>
          <p style={{margin:'0 0 22px', color:'var(--ink-mute)', fontSize:14}}>이제 미니 프로필 3가지만 채우면 끝나요.</p>
          <button className="btn btn--primary btn--xl" onClick={()=>setRoute('onboardingV2')}>
            미니 프로필 작성 (15초)
          </button>
        </div>
      )}
    </div>
  );
}

window.Verify = Verify;
