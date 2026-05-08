/* global React */

/**
 * HelpGlossary — /help/glossary (D등급 P2-11 redirect 박제)
 *
 * Why: 외부 링크/SEO 인덱스로 들어온 사용자 처리 — 이미 Help.jsx에 glossary 탭 존재
 * Pattern: 자동 redirect + 수동 fallback (5초 타이머)
 *
 * 진입: 외부 검색엔진 (SEO 인덱스 잔존) / 옛 도움말 링크
 * 복귀: → /help (glossary 탭) 자동 redirect
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   자동 redirect     | -        | ✅ 1.5s setTimeout | SEO       | OK
 *   수동 fallback     | -        | ✅ "지금 이동" CTA | -        | OK
 *   3초 카운트다운    | -        | ✅                  | -        | OK
 */

function HelpGlossary({ setRoute }) {
  const [count, setCount] = React.useState(3);

  React.useEffect(() => {
    if (count <= 0) {
      setRoute('help');
      return;
    }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, setRoute]);

  return (
    <div className="page" style={{maxWidth:520, paddingTop:80}}>
      <div className="card" style={{padding:'48px 36px', textAlign:'center'}}>
        <div style={{width:64, height:64, borderRadius:'50%', background:'var(--bg-alt)', color:'var(--ink-mute)', display:'grid', placeItems:'center', margin:'0 auto 18px'}}>
          <span className="material-symbols-outlined" style={{fontSize:32}}>menu_book</span>
        </div>
        <div className="eyebrow" style={{marginBottom:6}}>HELP · GLOSSARY</div>
        <h1 style={{margin:'0 0 10px', fontSize:22, fontWeight:800, letterSpacing:'-0.015em'}}>용어집이 도움말로 통합되었어요</h1>
        <p style={{margin:'0 0 22px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.7}}>
          <code style={{fontFamily:'var(--ff-mono)', fontSize:12, padding:'1px 6px', background:'var(--bg-alt)', borderRadius:3}}>/help/glossary</code> 는<br/>
          <code style={{fontFamily:'var(--ff-mono)', fontSize:12, padding:'1px 6px', background:'var(--bg-alt)', borderRadius:3}}>/help</code> 의 "용어집" 탭으로 이동합니다.
        </p>

        <div style={{padding:'12px 0', marginBottom:18, fontSize:12, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
          {count}초 후 자동 이동…
        </div>

        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
          <button className="btn btn--lg" onClick={()=>setRoute('home')}>홈으로</button>
          <button className="btn btn--primary btn--lg" onClick={()=>setRoute('help')}>지금 이동 →</button>
        </div>
      </div>

      <div style={{textAlign:'center', marginTop:18, fontSize:11, color:'var(--ink-dim)'}}>
        북마크를 사용 중이라면 새 주소(/help)로 업데이트해주세요.
      </div>
    </div>
  );
}

window.HelpGlossary = HelpGlossary;
