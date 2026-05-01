/* global React, TEAMS, Avatar, GameResult, Icon */

/**
 * LiveResult — /live/[id] finished 분기 (D등급 P0-3 회귀 픽스)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃·기능 옛 디자인 복원
 * 옛 레이아웃 핵심: 큰 스코어보드 / 쿼터별 점수 / MVP / 평가 진입점 / 기록 보기
 *
 * 진입: /live/[id] (경기 종료 자동) / 알림 "경기 결과 보기" 클릭
 * 복귀: /games/[id] / /games/my-games / /live (다른 경기 보기)
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점          | 모바일
 *   FINAL 스코어보드  | ✅       | ✅ GameResult 활용   | 라이브 종료     | qscore 가로
 *   쿼터별 점수       | ✅       | ✅ qscore 보존       | -               | hscroll
 *   MVP 배너          | ✅       | ✅ GameResult banner | -               | OK
 *   박스스코어        | ✅       | ✅ GameResult tab    | -               | hscroll
 *   타임라인          | ✅       | ✅ GameResult tab    | -               | OK
 *   하이라이트 클립   | ✅ NEW   | ✅ 4-up 비디오 grid  | finished only   | 1열
 *   경기원 평가       | ✅       | ✅ CTA 카드          | finished CTA    | OK
 *   기록 보기 액션    | ✅       | ✅ 상단 nav          | -               | OK
 *
 * NOTE: 박스스코어·타임라인·MVP·쿼터·팀스탯 모두 GameResult.jsx 가 이미 구현.
 *       Live 페이지에서 finished 진입 시 이 컴포넌트가 GameResult 를 감싸서 띄우고
 *       라이브 전용 정보(하이라이트 클립·경기원 평가 CTA·시청자 통계)만 추가한다.
 */

function LiveResult({ setRoute }) {
  const teamA = TEAMS.find(t => t.tag==='RDM') || TEAMS[0];
  const teamB = TEAMS.find(t => t.tag==='3P') || TEAMS[1];

  // 라이브 종료 통계 (라이브 한정 — GameResult 에는 없음)
  const liveStats = {
    totalViewers: 1287,
    peakViewers: 1542,
    duration: '1시간 38분',
    chatMessages: 2341,
    highlights: 4,
  };

  return (
    <div className="page">
      {/* breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('live')} style={{cursor:'pointer'}}>라이브</a><span>›</span>
        <span style={{color:'var(--ink)'}}>경기 종료</span>
      </div>

      {/* 종료 배너 — 라이브 진입 직후 컨텍스트 */}
      <div className="card" style={{padding:'14px 20px', marginBottom:18, display:'flex', alignItems:'center', gap:14, background:'linear-gradient(90deg, color-mix(in oklab, var(--cafe-blue) 8%, transparent), transparent)', flexWrap:'wrap'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{background:'var(--ink)', color:'var(--bg)', fontSize:11, fontWeight:800, letterSpacing:'.12em', padding:'4px 10px', borderRadius:3}}>FINAL</span>
          <div style={{fontSize:13, fontWeight:700}}>Kings Cup Vol.07 · 8강 1경기</div>
        </div>
        <div style={{flex:1, fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', minWidth:200}}>
          {liveStats.duration} · 누적 {liveStats.totalViewers.toLocaleString()}명 · 피크 {liveStats.peakViewers.toLocaleString()}명 · 채팅 {liveStats.chatMessages.toLocaleString()}건
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn btn--sm" onClick={()=>setRoute('live')}>다른 경기</button>
          <button className="btn btn--sm" onClick={()=>setRoute('myGames')}>내 경기</button>
        </div>
      </div>

      {/* ── 옛 레이아웃 복원: GameResult 가 스코어보드+쿼터+MVP+박스스코어+팀스탯+타임라인 모두 그려줌 ── */}
      <GameResult setRoute={setRoute}/>

      {/* 라이브 한정 — 하이라이트 클립 (GameResult 엔 없음) */}
      <div className="card" style={{padding:'20px 24px', marginTop:18}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
          <h3 style={{margin:0, fontSize:15, fontWeight:700}}>하이라이트 클립 ({liveStats.highlights})</h3>
          <a style={{fontSize:12, color:'var(--cafe-blue)', cursor:'pointer'}}>전체 클립 보기 →</a>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
          {[
            { time:'Q4 0:28', desc:'rdm_captain 자유투 2/2 결승', dur:'0:42' },
            { time:'Q4 3:47', desc:'rdm_sniper 코너 3점 성공', dur:'0:18' },
            { time:'Q4 8:45', desc:'3p_big 골밑 덩크', dur:'0:25' },
            { time:'Q3 5:18', desc:'rdm_pivot 블록 → 속공', dur:'0:34' },
          ].map((h, i) => (
            <div key={i} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}}>
              <div style={{aspectRatio:'16/9', background:'linear-gradient(135deg, #1a1a1a, #000)', position:'relative', display:'grid', placeItems:'center'}}>
                <span style={{position:'absolute', top:8, left:8, background:'rgba(0,0,0,.7)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:3, fontFamily:'var(--ff-mono)'}}>{h.time}</span>
                <span style={{position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,.7)', color:'#fff', fontSize:10, padding:'2px 6px', borderRadius:3, fontFamily:'var(--ff-mono)'}}>{h.dur}</span>
                <span className="material-symbols-outlined" style={{color:'rgba(255,255,255,.85)', fontSize:42}}>play_circle</span>
              </div>
              <div style={{padding:'10px 12px', fontSize:12, fontWeight:600, lineHeight:1.4}}>{h.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 라이브 한정 — 경기원 평가 + 기록 보기 CTA */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14, marginBottom:40}}>
        <div className="card" style={{padding:'20px 22px', display:'flex', alignItems:'center', gap:14}}>
          <div style={{width:48, height:48, borderRadius:8, background:'color-mix(in oklab, var(--cafe-blue) 12%, transparent)', display:'grid', placeItems:'center', flexShrink:0}}>
            <span className="material-symbols-outlined" style={{color:'var(--cafe-blue)', fontSize:26}}>rate_review</span>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14, fontWeight:700, marginBottom:2}}>경기원 평가하기</div>
            <div style={{fontSize:12, color:'var(--ink-mute)'}}>참여한 선수에게 매너·실력 평점을 남겨 주세요</div>
          </div>
          <button className="btn btn--primary btn--sm" onClick={()=>setRoute('gameReport')}>평가 →</button>
        </div>
        <div className="card" style={{padding:'20px 22px', display:'flex', alignItems:'center', gap:14}}>
          <div style={{width:48, height:48, borderRadius:8, background:'color-mix(in oklab, var(--accent) 12%, transparent)', display:'grid', placeItems:'center', flexShrink:0}}>
            <span className="material-symbols-outlined" style={{color:'var(--accent)', fontSize:26}}>insights</span>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:14, fontWeight:700, marginBottom:2}}>전체 기록 보기</div>
            <div style={{fontSize:12, color:'var(--ink-mute)'}}>슛 차트·플레이 다이어그램·선수별 상세</div>
          </div>
          <button className="btn btn--sm" onClick={()=>setRoute('stats')}>기록 →</button>
        </div>
      </div>
    </div>
  );
}

window.LiveResult = LiveResult;
