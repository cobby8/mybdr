/* global React */

function Invite({ setRoute }) {
  const invite = {
    type:'team',  // team | tournament | series
    targetName:'리딤 (RDM)',
    inviter:'김원영',
    inviterRole:'팀장',
    role:'정식 멤버',
    expiresIn:'48시간',
    note:'4월 BDR CHALLENGE 같이 나가실 분 모십니다. 합류 환영!',
  };

  return (
    <div className="page" style={{maxWidth:520, paddingTop:48}}>
      <div style={{textAlign:'center', marginBottom:18}}>
        <div style={{display:'inline-flex', padding:'4px 10px', background:'var(--accent-soft)', color:'var(--accent)', borderRadius:99, fontSize:11, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase'}}>
          ✨ 초대장 도착
        </div>
      </div>

      <div className="card" style={{padding:'32px 28px', textAlign:'center'}}>
        <div style={{width:72, height:72, background:'#E11D48', color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:18, borderRadius:14, margin:'0 auto 14px'}}>RDM</div>

        <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:6}}>
          <b style={{color:'var(--ink)'}}>{invite.inviter}</b>({invite.inviterRole})님이
        </div>
        <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.02em'}}>{invite.targetName}</h1>
        <div style={{fontSize:14, color:'var(--ink-soft)', marginBottom:20}}>팀에 초대했어요</div>

        <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:8, fontSize:13, color:'var(--ink-soft)', textAlign:'left', marginBottom:20, borderLeft:'3px solid var(--cafe-blue)'}}>
          “{invite.note}”
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, fontSize:13, color:'var(--ink-mute)', marginBottom:24, textAlign:'left'}}>
          <div>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4}}>역할</div>
            <div style={{color:'var(--ink)', fontWeight:600}}>{invite.role}</div>
          </div>
          <div>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4}}>유효 기간</div>
            <div style={{color:'var(--accent)', fontWeight:700, fontFamily:'var(--ff-mono)'}}>{invite.expiresIn}</div>
          </div>
        </div>

        <div style={{display:'grid', gap:8}}>
          <button className="btn btn--primary btn--xl" onClick={()=>setRoute('teamDetail')}>초대 수락하고 합류</button>
          <button className="btn" onClick={()=>setRoute('teamDetail')}>먼저 팀 둘러보기</button>
          <button className="btn btn--ghost" onClick={()=>setRoute('home')} style={{color:'var(--ink-mute)', fontSize:13}}>거절</button>
        </div>
      </div>

      <p style={{textAlign:'center', fontSize:12, color:'var(--ink-dim)', marginTop:18, lineHeight:1.6}}>
        로그인이 필요해요. 아직 회원이 아니라면 가입 후 자동으로 합류됩니다.
      </p>
    </div>
  );
}

window.Invite = Invite;
