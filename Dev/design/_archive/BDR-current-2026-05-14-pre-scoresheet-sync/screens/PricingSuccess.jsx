/* global React */

function PricingSuccess({ setRoute }) {
  return (
    <div className="page" style={{maxWidth:520, paddingTop:48}}>
      <div className="card" style={{padding:'32px 28px', textAlign:'center', borderTop:'4px solid var(--ok)'}}>
        <div style={{width:72, height:72, background:'var(--ok)', color:'#fff', borderRadius:'50%', display:'grid', placeItems:'center', margin:'0 auto 16px', fontSize:36, fontWeight:700}}>✓</div>
        <div className="eyebrow" style={{justifyContent:'center'}}>결제 완료 · PAYMENT SUCCESS</div>
        <h1 style={{margin:'10px 0 8px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>PREMIUM에 오신 걸 환영해요</h1>
        <p style={{color:'var(--ink-mute)', fontSize:14, lineHeight:1.7, marginBottom:24, maxWidth:'40ch', marginLeft:'auto', marginRight:'auto'}}>
          결제가 정상적으로 완료되었습니다. 영수증은 등록된 이메일로 발송되었어요.
        </p>

        <div style={{padding:'16px 18px', background:'var(--bg-alt)', borderRadius:8, marginBottom:22, textAlign:'left', display:'grid', gridTemplateColumns:'120px 1fr', rowGap:10, fontSize:13}}>
          <div style={{color:'var(--ink-dim)'}}>결제 금액</div><div style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>₩9,900</div>
          <div style={{color:'var(--ink-dim)'}}>결제수단</div><div>토스페이 · 신한카드</div>
          <div style={{color:'var(--ink-dim)'}}>주문번호</div><div style={{fontFamily:'var(--ff-mono)', fontSize:12}}>BDR-2026-04-19-0042</div>
          <div style={{color:'var(--ink-dim)'}}>다음 결제일</div><div>2026-05-19</div>
        </div>

        <div style={{display:'grid', gap:8}}>
          <button className="btn btn--primary btn--xl" onClick={()=>setRoute('home')}>홈으로 가기</button>
          <button className="btn" onClick={()=>setRoute('billing')}>결제 내역 보기</button>
        </div>
      </div>
    </div>
  );
}

window.PricingSuccess = PricingSuccess;
