/* global React */

function NotFound({ setRoute }) {
  return (
    <div className="page" style={{minHeight:'60vh', display:'grid', placeItems:'center', textAlign:'center'}}>
      <div style={{maxWidth:480}}>
        <div style={{fontFamily:'var(--ff-display)', fontSize:120, fontWeight:900, letterSpacing:'-0.04em', lineHeight:1, color:'var(--accent)'}}>404</div>
        <div className="eyebrow" style={{justifyContent:'center', marginTop:8}}>PAGE NOT FOUND</div>
        <h1 style={{margin:'14px 0 10px', fontSize:24, fontWeight:700}}>요청한 페이지를 찾을 수 없어요</h1>
        <p style={{color:'var(--ink-mute)', fontSize:14, lineHeight:1.7, marginBottom:24}}>
          주소가 변경되었거나 삭제된 페이지일 수 있습니다.<br/>
          홈으로 돌아가거나 검색을 통해 다시 찾아보세요.
        </p>
        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
          <button className="btn btn--primary" onClick={()=>setRoute('home')}>홈으로</button>
          <button className="btn" onClick={()=>setRoute('search')}>검색</button>
          <button className="btn btn--ghost" onClick={()=>setRoute('help')}>도움말</button>
        </div>
      </div>
    </div>
  );
}

window.NotFound = NotFound;
