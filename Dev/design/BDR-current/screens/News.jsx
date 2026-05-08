/* global React, Icon */

/**
 * News — /news 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 알기자 (BDR NEWS AI) 가 매치 종료 후 자동 작성하는 단신 기사 카드 그리드
 * 진입: 글로벌 nav / 알림 deep-link (5/7 0ccf785) / 매치 상세 "기사 보기"
 * 복귀: 매치 상세 (/news/match/[matchId])
 */
function News({ setRoute }) {
  // mock 데이터 — 실제 API X, 시안 데모용 6건
  const articles = [
    {
      id: 'n1',
      title: 'REDEEM, 8강서 3POINT 격침… 파이널 4 진출',
      preview: 'Kings Cup Vol.07 8강 1경기에서 REDEEM이 마지막 쿼터 12-4 런으로 3POINT를 꺾고 4강행 티켓을 거머쥐었다. 가드 김민준의 결정적 3점이 흐름을 바꿨다.',
      date: '5월 8일', views: 1247, likes: 89, comments: 23, tag: '8강',
    },
    {
      id: 'n2',
      title: '몽키즈 vs 피벗, 더블 OT 끝 79-77',
      preview: '주말농구협회 4라운드 명승부. 정규시간 동점 + 1차 연장도 무승부 끝에 2차 연장 0.4초 남기고 피벗의 페이드어웨이가 림을 외면했다.',
      date: '5월 7일', views: 832, likes: 67, comments: 18, tag: '리그',
    },
    {
      id: 'n3',
      title: 'SWEEP 캡틴 박지훈, 시즌 첫 트리플더블',
      preview: '23득점 11리바운드 12어시스트로 BDR 챌린지 예선 A조 IRON 전에서 단일 매치 트리플더블을 작성했다. 시즌 통산 첫 기록.',
      date: '5월 7일', views: 614, likes: 52, comments: 14, tag: '기록',
    },
    {
      id: 'n4',
      title: '장충 주간 픽업, 신규 회원 7명 영입',
      preview: '5/4 장충체육관 정기 픽업에 신규 가입자 7명이 합류해 현재 등록 회원 124명. 최근 3주 연속 풀 코트 운영중.',
      date: '5월 5일', views: 401, likes: 28, comments: 9, tag: '픽업',
    },
    {
      id: 'n5',
      title: '수원 청소년 연합전 5/10 개막… 16팀 참가',
      preview: '수원리그 주관 U-19 토너먼트가 5/10~5/17 진행된다. 분당·수지·광교 클럽 16팀 참가. 결승 라이브 중계 예정.',
      date: '5월 4일', views: 298, likes: 21, comments: 6, tag: '대회',
    },
    {
      id: 'n6',
      title: '코치K, 알기자 인터뷰 "농구는 결국 패스"',
      preview: 'BDR 공식 해설가 코치K가 알기자와의 인터뷰에서 현대 농구의 본질을 패스 게임으로 정의했다. 픽앤롤 응용 분석.',
      date: '5월 3일', views: 1056, likes: 134, comments: 41, tag: '인터뷰',
    },
  ];

  return (
    <div className="page">
      {/* Breadcrumb — 시안 일관 */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <span style={{color:'var(--ink)'}}>BDR NEWS</span>
      </div>

      {/* 헤더 — 알기자 박제 */}
      <div style={{borderBottom:'1px solid var(--border)', paddingBottom:18, marginBottom:22}}>
        <div style={{display:'flex', alignItems:'baseline', gap:12, flexWrap:'wrap'}}>
          <h1 style={{margin:0, fontSize:30, fontWeight:800, letterSpacing:'-0.02em', fontFamily:'var(--ff-display)'}}>BDR NEWS</h1>
          <span style={{fontSize:13, color:'var(--ink-dim)'}}>✍ 알기자 · BDR NEWS AI</span>
        </div>
        <p style={{margin:'8px 0 0', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
          BDR 동호회 매치 단신 기사. 매치 종료 후 AI 기자 알기자가 자동으로 작성합니다.
        </p>
      </div>

      {/* 카드 그리드 — 3열 (md+) / 2열 (sm) / 1열 (mobile) */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14}}>
        {articles.map(a => (
          <a key={a.id} onClick={()=>setRoute('matchNews')} className="card" style={{padding:'18px 20px', cursor:'pointer', textDecoration:'none', color:'inherit', display:'block'}}>
            {/* 카테고리 + 날짜 */}
            <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:8}}>
              <span className="badge badge--red" style={{fontSize:10}}>BDR NEWS</span>
              <span className="badge badge--ghost" style={{fontSize:10}}>{a.tag}</span>
              <span style={{fontSize:11, color:'var(--ink-dim)', marginLeft:'auto', fontFamily:'var(--ff-mono)'}}>{a.date}</span>
            </div>
            {/* 제목 — line-clamp 2 */}
            <h2 style={{margin:'0 0 8px', fontSize:15, fontWeight:700, lineHeight:1.4, letterSpacing:'-0.01em', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{a.title}</h2>
            {/* 미리보기 — line-clamp 3 */}
            <p style={{margin:'0 0 12px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.55, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{a.preview}</p>
            {/* 메타 (조회/좋아요/댓글) */}
            <div style={{display:'flex', gap:12, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
              <span>👁 {a.views.toLocaleString()}</span>
              <span>♡ {a.likes}</span>
              <span>💬 {a.comments}</span>
            </div>
          </a>
        ))}
      </div>

      {/* 페이지네이션 — mock */}
      <nav style={{marginTop:28, display:'flex', justifyContent:'center', gap:6}}>
        <button className="btn btn--sm" disabled style={{opacity:.5}}>← 이전</button>
        <span style={{padding:'8px 14px', fontSize:13, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>1 / 3</span>
        <button className="btn btn--sm">다음 →</button>
      </nav>

      {/* 푸터 안내 */}
      <p style={{marginTop:28, paddingTop:18, borderTop:'1px solid var(--border)', textAlign:'center', fontSize:11, color:'var(--ink-dim)'}}>
        BDR NEWS는 AI 기자 알기자가 매치 종료 후 자동 작성한 기사이며, 운영자 검수 후 발행됩니다. 사실 오류는 <a onClick={()=>setRoute('help')} style={{textDecoration:'underline', cursor:'pointer'}}>문의하기</a>로 알려주세요.
      </p>
    </div>
  );
}

window.News = News;
