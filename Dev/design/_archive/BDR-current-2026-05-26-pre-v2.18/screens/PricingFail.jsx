/* global React */

function PricingFail({ setRoute }) {
  // Simulate toss errorCode → user-friendly message mapping (Q8)
  const errorCodes = {
    'PAY_PROCESS_CANCELED': { title:'결제가 취소되었어요', body:'사용자가 결제 창을 닫았습니다. 다시 시도하시려면 아래 버튼을 눌러주세요.', tone:'var(--ink-mute)' },
    'INVALID_CARD_COMPANY': { title:'카드 정보가 올바르지 않아요', body:'카드 번호·유효기간·CVC를 다시 확인해주세요. 다른 카드로도 시도해 보실 수 있습니다.', tone:'var(--warn)' },
    'NOT_ENOUGH_BALANCE': { title:'잔액이 부족해요', body:'결제 가능한 잔액이 부족합니다. 다른 결제수단을 선택해 주세요.', tone:'var(--warn)' },
    'EXCEED_MAX_DAILY_PAYMENT_COUNT': { title:'일일 결제 한도를 초과했어요', body:'카드사 일일 한도가 초과되었습니다. 내일 다시 시도하거나 다른 카드를 사용해 주세요.', tone:'var(--warn)' },
    'EXPIRED_CARD': { title:'유효기간이 만료된 카드예요', body:'유효한 카드로 다시 시도해 주세요.', tone:'var(--danger)' },
    'UNKNOWN': { title:'결제에 실패했어요', body:'잠시 후 다시 시도해 주세요. 문제가 계속되면 아래 채널로 문의 부탁드립니다.', tone:'var(--danger)' },
  };

  const [code, setCode] = React.useState('PAY_PROCESS_CANCELED');
  const e = errorCodes[code];

  return (
    <div className="page" style={{maxWidth:520, paddingTop:48}}>
      <div className="card" style={{padding:'32px 28px', textAlign:'center', borderTop:`4px solid ${e.tone}`}}>
        <div style={{width:64, height:64, borderRadius:'50%', background:`color-mix(in oklab, ${e.tone} 12%, var(--bg-elev))`, color:e.tone, display:'grid', placeItems:'center', margin:'0 auto 16px', fontSize:32, fontWeight:700}}>!</div>
        <div className="eyebrow" style={{justifyContent:'center'}}>결제 실패 · PAYMENT FAILED</div>
        <h1 style={{margin:'10px 0 8px', fontSize:22, fontWeight:700}}>{e.title}</h1>
        <p style={{color:'var(--ink-mute)', fontSize:14, lineHeight:1.7, marginBottom:18, maxWidth:'42ch', marginLeft:'auto', marginRight:'auto'}}>{e.body}</p>

        <div style={{display:'flex', justifyContent:'center', gap:6, marginBottom:18, fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>
          <span>오류 코드</span>
          <span style={{padding:'2px 8px', background:'var(--bg-alt)', borderRadius:3, color:'var(--ink-soft)'}}>{code}</span>
        </div>

        <div style={{display:'grid', gap:8}}>
          <button className="btn btn--primary btn--xl" onClick={()=>setRoute('pricing')}>다시 결제하기</button>
          <button className="btn" onClick={()=>setRoute('pricing')}>다른 결제수단 선택</button>
          <button className="btn btn--ghost" onClick={()=>setRoute('help')} style={{fontSize:13}}>도움이 필요해요</button>
        </div>
      </div>

      {/* dev: code switcher (would not be in production) */}
      <details style={{marginTop:14, fontSize:12, color:'var(--ink-mute)'}}>
        <summary style={{cursor:'pointer'}}>다른 오류 코드 미리보기 (디자인 검토용)</summary>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginTop:8}}>
          {Object.keys(errorCodes).map(k => (
            <button key={k} className="btn btn--sm" onClick={()=>setCode(k)} style={code===k?{background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'}:{}}>{k}</button>
          ))}
        </div>
      </details>
    </div>
  );
}

window.PricingFail = PricingFail;
