/* global React */

function About({ setRoute }) {
  return (
    <div className="page">
      <div className="eyebrow">소개 · ABOUT</div>
      <h1 style={{margin:'6px 0 18px', fontSize:36, fontWeight:800, letterSpacing:'-0.02em'}}>BDR — Basketball Daily Routine</h1>
      <p style={{fontSize:17, color:'var(--ink-soft)', maxWidth:'62ch', lineHeight:1.7, marginBottom:28}}>
        MyBDR는 전국 농구 매칭 플랫폼의 공식 허브입니다.
        픽업 게임부터 정규 대회까지, 농구인이 가장 빠르게 “오늘 뛸 무엇”을 찾고
        팀을 운영하고 대회를 개최할 수 있도록 만들어졌습니다.
      </p>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:32}}>
        {[
          { kicker:'축 1 · 참여', title:'농구인을 매치에 꽂는다', body:'발견 → 신청까지 1–2탭. 픽업·게스트·팀대결·대회 한 곳에서.' },
          { kicker:'축 2 · 개최', title:'컴맹도 핸드폰으로 대회를 연다', body:'시리즈 생성 → 회차 추가 → 공개까지 5분 룰.' },
          { kicker:'축 3 · 신뢰', title:'BDR 브랜드의 공식 허브', body:'공식 기록·랭킹·시리즈 계보가 한 곳에 모입니다.' },
        ].map(c => (
          <div key={c.kicker} className="card" style={{padding:'20px 22px', borderLeft:'3px solid var(--accent)'}}>
            <div style={{fontSize:11, color:'var(--ink-mute)', fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:8}}>{c.kicker}</div>
            <div style={{fontSize:17, fontWeight:700, marginBottom:6}}>{c.title}</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>{c.body}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:'22px 26px', marginBottom:24}}>
        <h2 style={{margin:'0 0 12px', fontSize:20, fontWeight:700}}>운영 정보</h2>
        <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:10, fontSize:14}}>
          <div style={{color:'var(--ink-dim)'}}>운영</div><div>BDR 리그 사무국</div>
          <div style={{color:'var(--ink-dim)'}}>이메일</div><div>bdr.wonyoung@gmail.com</div>
          <div style={{color:'var(--ink-dim)'}}>YouTube</div><div>@BDRBASKET</div>
          <div style={{color:'var(--ink-dim)'}}>Instagram</div><div>@bdr_basket</div>
          <div style={{color:'var(--ink-dim)'}}>설립</div><div>2024</div>
        </div>
      </div>

      <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
        <button className="btn btn--primary" onClick={()=>setRoute('home')}>홈으로</button>
        <button className="btn" onClick={()=>setRoute('pricing')}>요금제 보기</button>
        <button className="btn btn--ghost" onClick={()=>setRoute('help')}>도움말</button>
      </div>
    </div>
  );
}

window.About = About;
