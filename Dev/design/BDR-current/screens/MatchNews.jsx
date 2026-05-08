/* global React, TEAMS, Icon, Avatar */

/**
 * MatchNews — /news/match/[matchId] 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 알기자 단신 본문 + 매치 헤드라인(스코어보드) + Hero 사진 + linkify 본문 + 갤러리
 * 진입: News (목록) / 알림 deep-link (5/7 0ccf785) scroll+highlight 도착지 / 매치 상세 "기사 보기"
 * 복귀: News / 매치 상세 (/live/{matchId}) / 토너먼트 상세 / 팀 상세 (linkify 링크들)
 */
function MatchNews({ setRoute }) {
  // mock 데이터 — 단일 기사 + 매치 헤드라인
  const teamA = TEAMS.find(t => t.tag === 'RDM') || TEAMS[0];
  const teamB = TEAMS.find(t => t.tag === '3P') || TEAMS[1];

  const article = {
    title: 'REDEEM, 마지막 12-4 런으로 8강 1경기 제압',
    publishedAt: '2026년 5월 8일 오후 11:23',
    tournament: 'Kings Cup Vol.07',
    round: '8강 · 1경기',
    body: [
      'REDEEM이 5월 8일 장충체육관 메인코트에서 열린 Kings Cup Vol.07 8강 1경기에서 3POINT를 67-58로 꺾고 4강 진출을 확정지었다.',
      '경기 초반 양 팀은 박빙의 흐름을 보였다. 1쿼터를 13-11로 마친 REDEEM은 2쿼터 들어 가드 김민준의 연속 3점포로 흐름을 잡는 듯했으나, 3POINT 캡틴 박지훈의 미드레인지 슈팅이 살아나며 동점으로 하프타임을 마쳤다.',
      '승부의 분수령은 4쿼터 잔여 5분. 56-54로 박빙이던 상황에서 REDEEM은 12-4 결정적 런을 완성하며 승부를 갈랐다. 김민준은 이 구간 동안 2개의 3점과 1개의 어시스트를 기록했다.',
      '경기 후 인터뷰에서 김민준은 "마지막 5분 동안 우리 수비가 살아났고, 동료들이 좋은 패스를 줬다"고 말했다. 이어 "4강 상대가 누가 되든 준비된 모습 보여드리겠다"고 다짐했다.',
      'REDEEM은 5/15 4강 1경기에서 몽키즈 vs 피벗 승자와 맞붙는다.',
    ],
    views: 1247, likes: 89, comments: 23,
  };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('news')} style={{cursor:'pointer'}}>BDR NEWS</a><span>›</span>
        <span style={{color:'var(--ink)'}}>매치 #1</span>
      </div>

      {/* 기사 본문 카드 */}
      <article className="card" style={{padding:'28px 32px', maxWidth:880, margin:'0 auto'}}>
        {/* 카테고리 + 시각 */}
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:14}}>
          <span className="badge badge--red">BDR NEWS</span>
          <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{article.publishedAt}</span>
        </div>

        {/* 제목 */}
        <h1 style={{margin:'0 0 14px', fontSize:28, fontWeight:800, lineHeight:1.3, letterSpacing:'-0.02em', fontFamily:'var(--ff-display)'}}>{article.title}</h1>

        {/* 알기자 뱃지 */}
        <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:22}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:5, background:'var(--bg-alt)', color:'var(--accent)', fontSize:12, fontWeight:700, padding:'4px 10px', borderRadius:4}}>
            🤖 알기자
          </span>
          <span style={{fontSize:12, color:'var(--ink-dim)'}}>BDR NEWS AI</span>
        </div>

        {/* 매치 헤드라인 — 스코어 박스 */}
        <div style={{padding:'20px 24px', background:'var(--bg-alt)', borderRadius:8, border:'1px solid var(--border)', marginBottom:22}}>
          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:18, alignItems:'center'}}>
            <a onClick={()=>setRoute('teamDetail')} style={{cursor:'pointer', textAlign:'center'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:6}}>
                <span style={{width:28, height:28, background:teamA.color, color:teamA.ink, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, display:'grid', placeItems:'center', borderRadius:4}}>{teamA.tag}</span>
                <span style={{fontSize:14, fontWeight:700}}>{teamA.name}</span>
              </div>
              <div style={{fontSize:36, fontWeight:900, fontFamily:'var(--ff-display)', fontVariantNumeric:'tabular-nums'}}>67</div>
            </a>
            <div style={{fontSize:18, color:'var(--ink-dim)', fontWeight:700}}>vs</div>
            <a onClick={()=>setRoute('teamDetail')} style={{cursor:'pointer', textAlign:'center'}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginBottom:6}}>
                <span style={{width:28, height:28, background:teamB.color, color:teamB.ink, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, display:'grid', placeItems:'center', borderRadius:4}}>{teamB.tag}</span>
                <span style={{fontSize:14, fontWeight:700}}>{teamB.name}</span>
              </div>
              <div style={{fontSize:36, fontWeight:900, fontFamily:'var(--ff-display)', fontVariantNumeric:'tabular-nums', color:'var(--ink-mute)'}}>58</div>
            </a>
          </div>
          <div style={{marginTop:12, paddingTop:12, borderTop:'1px solid var(--border)', display:'flex', justifyContent:'center', gap:10, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
            <a onClick={()=>setRoute('match')} style={{cursor:'pointer', textDecoration:'underline'}}>{article.tournament}</a>
            <span>· {article.round}</span>
            <span>· 장충체육관 메인코트</span>
          </div>
        </div>

        {/* Hero 사진 placeholder — 실제 운영은 NewsPhotoHero */}
        <div style={{aspectRatio:'16/9', background:'linear-gradient(135deg, var(--bg-alt), var(--bg))', borderRadius:6, border:'1px solid var(--border)', display:'grid', placeItems:'center', marginBottom:22, color:'var(--ink-dim)', fontSize:12}}>
          <span>🏀 Hero 사진</span>
        </div>

        {/* 본문 (linkify mock) */}
        <div style={{fontSize:15, lineHeight:1.85, color:'var(--ink)'}}>
          {article.body.map((p, i) => (
            <p key={i} style={{margin:'0 0 14px'}}>{p}</p>
          ))}
        </div>

        {/* 갤러리 placeholder — 실제 운영은 NewsPhotoGallery */}
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginTop:18}}>
          {[1,2,3].map(i => (
            <div key={i} style={{aspectRatio:'4/3', background:'var(--bg-alt)', borderRadius:4, border:'1px solid var(--border)', display:'grid', placeItems:'center', color:'var(--ink-dim)', fontSize:11}}>📷 {i}</div>
          ))}
        </div>

        {/* 메타 + 매치 상세 링크 */}
        <div style={{marginTop:22, paddingTop:18, borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', gap:14, fontSize:13, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
          <span>👁 {article.views.toLocaleString()}</span>
          <span>♡ {article.likes}</span>
          <span>💬 {article.comments}</span>
          <a onClick={()=>setRoute('live')} style={{marginLeft:'auto', color:'var(--accent)', textDecoration:'underline', cursor:'pointer'}}>매치 상세 →</a>
        </div>

        {/* 안내 */}
        <p style={{marginTop:14, fontSize:11, color:'var(--ink-dim)', lineHeight:1.5}}>
          이 기사는 AI 기자 알기자가 매치 종료 후 자동으로 작성하고 운영자 검수를 거쳐 발행됩니다. 사실 오류 발견 시 신고해 주세요.
        </p>
      </article>

      {/* 다른 기사 보기 */}
      <div style={{marginTop:18, textAlign:'center'}}>
        <button className="btn" onClick={()=>setRoute('news')}>← 다른 기사 보기</button>
      </div>
    </div>
  );
}

window.MatchNews = MatchNews;
