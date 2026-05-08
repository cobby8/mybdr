/* global React, TEAMS, Icon */

/**
 * Scoreboard — /scoreboard/[matchId] 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 매치 코드 v4 (5/7 완료) Supabase realtime broadcast 구독 — 점수/타이머/쿼터/팀파울/PBP 라이브
 * 진입: 매치 상세 → "스코어보드 보기" / 외부 링크 (URL 공유)
 * 복귀: 매치 상세 / 토너먼트 / 라이브 중계 (Live)
 *
 * UI 우선 (mock 룰): Supabase 실시간 구독 X — 정적 mock state.
 */
function Scoreboard({ setRoute }) {
  const teamA = TEAMS.find(t => t.tag === 'RDM') || TEAMS[0];
  const teamB = TEAMS.find(t => t.tag === '3P') || TEAMS[1];

  // mock state — 운영은 useReducer + realtime broadcast
  const state = {
    homeName: teamA.name, awayName: teamB.name,
    homeScore: 47, awayScore: 52,
    quarter: 3, quarterLabel: 'Q3',
    remainingSeconds: 324, // 5:24
    isRunning: true,
    shotClock: 14,
    homeTeamFouls: 4, awayTeamFouls: 3,
    homeTimeoutsRemaining: 2, homeTimeoutsTotal: 3,
    awayTimeoutsRemaining: 1, awayTimeoutsTotal: 3,
    connectionStatus: 'connected', // connecting | connected | disconnected | error
  };

  const recentEvents = [
    { ts:'5:42', side:'away', num:7,  player:'박지훈', desc:'3점 성공',     points:3 },
    { ts:'5:58', side:'home', num:11, player:'김민준', desc:'2점 레이업',    points:2 },
    { ts:'6:14', side:'away', num:23, player:'이서준', desc:'리바운드',     points:0 },
    { ts:'6:32', side:'home', num:4,  player:'최우진', desc:'어시스트',     points:0 },
    { ts:'6:48', side:'away', num:7,  player:'박지훈', desc:'2점 성공',     points:2 },
    { ts:'7:05', side:'home', num:11, player:'김민준', desc:'스틸 + 속공',  points:2 },
  ];

  // mm:ss 포맷
  const fmtTime = (s) => {
    const m = Math.floor(s/60), sec = s%60;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  };

  // 연결 상태 표시
  const connConfig = {
    connecting: { color:'var(--warn)', label:'연결 중...' },
    connected:  { color:'var(--ok)',   label:'LIVE',    pulse:true },
    disconnected:{ color:'var(--ink-dim)', label:'연결 끊김' },
    error:      { color:'var(--err)',  label:'오류' },
  }[state.connectionStatus];

  return (
    <div style={{minHeight:'100vh', background:'#000', color:'#fff', display:'flex', flexDirection:'column'}}>
      {/* 상단: 브랜드 + 연결 상태 */}
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,.1)'}}>
        <span style={{fontSize:11, fontWeight:800, letterSpacing:'.16em', opacity:.6}}>BDR LIVE</span>
        <span style={{display:'flex', alignItems:'center', gap:6, fontSize:12, opacity:.7}}>
          <span style={{width:8, height:8, borderRadius:'50%', background:connConfig.color, animation: connConfig.pulse ? 'pulse 1.5s infinite':'none'}}/>
          {connConfig.label}
        </span>
      </header>

      {/* 메인 점수판 */}
      <main style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 20px'}}>
        <section style={{width:'100%', maxWidth:760}}>
          {/* 팀 이름 */}
          <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'center', textAlign:'center', marginBottom:8}}>
            <h2 style={{margin:0, fontSize:20, fontWeight:800, letterSpacing:'-0.01em'}}>{state.homeName}</h2>
            <span style={{fontSize:14, opacity:.4}}>vs</span>
            <h2 style={{margin:0, fontSize:20, fontWeight:800, letterSpacing:'-0.01em'}}>{state.awayName}</h2>
          </div>

          {/* 점수 — 거대 폰트 */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:32, marginBottom:24}}>
            <span style={{fontSize:120, fontWeight:900, fontFamily:'var(--ff-display)', fontVariantNumeric:'tabular-nums', lineHeight:1}}>{state.homeScore}</span>
            <span style={{fontSize:48, opacity:.3, fontWeight:300}}>:</span>
            <span style={{fontSize:120, fontWeight:900, fontFamily:'var(--ff-display)', fontVariantNumeric:'tabular-nums', lineHeight:1, color:'var(--err)'}}>{state.awayScore}</span>
          </div>

          {/* 쿼터 / 타이머 / 샷클락 */}
          <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:14, marginBottom:32}}>
            <span style={{background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:800, letterSpacing:'.08em', padding:'5px 12px', borderRadius:4}}>{state.quarterLabel}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:32, fontWeight:800, fontVariantNumeric:'tabular-nums', color: state.isRunning ? 'var(--ok)' : '#fff'}}>{fmtTime(state.remainingSeconds)}</span>
            {state.shotClock !== null && (
              <span style={{background:'rgba(255,255,255,.1)', fontSize:14, fontWeight:800, padding:'5px 10px', borderRadius:4, fontFamily:'var(--ff-mono)', fontVariantNumeric:'tabular-nums', color:'var(--warn)'}}>Shot: {state.shotClock}</span>
            )}
          </div>

          {/* 팀 파울 / 타임아웃 */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, padding:'20px 24px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8, marginBottom:32}}>
            {[
              { label:'홈', fouls: state.homeTeamFouls, rem: state.homeTimeoutsRemaining, total: state.homeTimeoutsTotal },
              { label:'어웨이', fouls: state.awayTeamFouls, rem: state.awayTimeoutsRemaining, total: state.awayTimeoutsTotal },
            ].map((t, i) => (
              <div key={i} style={{textAlign:'center'}}>
                <div style={{fontSize:11, opacity:.5, fontWeight:700, letterSpacing:'.06em', marginBottom:4}}>팀파울</div>
                <div style={{fontSize:28, fontWeight:800, fontFamily:'var(--ff-mono)', fontVariantNumeric:'tabular-nums', marginBottom:10}}>{t.fouls}</div>
                <div style={{fontSize:11, opacity:.5, fontWeight:700, letterSpacing:'.06em', marginBottom:4}}>T/O</div>
                <div style={{display:'flex', justifyContent:'center', gap:5}}>
                  {Array.from({length: t.total}).map((_, k) => (
                    <span key={k} style={{width:10, height:10, borderRadius:'50%', background: k < t.rem ? 'var(--warn)' : 'rgba(255,255,255,.15)'}}/>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 최근 플레이 (PBP) */}
          {recentEvents.length > 0 && (
            <section style={{padding:'18px 22px', background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.1)', borderRadius:8}}>
              <h3 style={{margin:'0 0 12px', fontSize:11, fontWeight:800, letterSpacing:'.12em', opacity:.6}}>최근 플레이</h3>
              <ul style={{margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:10}}>
                {recentEvents.map((e, i) => (
                  <li key={i} style={{display:'flex', alignItems:'center', gap:10, fontSize:13}}>
                    <span style={{width:48, fontFamily:'var(--ff-mono)', fontSize:11, opacity:.5, fontVariantNumeric:'tabular-nums'}}>{e.ts}</span>
                    <span style={{padding:'2px 7px', fontSize:11, fontWeight:800, borderRadius:3, background: e.side === 'home' ? 'rgba(220,38,38,.2)' : 'rgba(15,95,204,.2)', color: e.side === 'home' ? '#ff6b6b' : '#4d9eff', fontFamily:'var(--ff-mono)'}}>#{e.num}</span>
                    <span style={{flex:1}}>
                      <span style={{fontWeight:700, marginRight:6}}>{e.player}</span>
                      <span style={{opacity:.7}}>{e.desc}</span>
                    </span>
                    {e.points > 0 && <span style={{color:'var(--ok)', fontWeight:800, fontFamily:'var(--ff-mono)'}}>+{e.points}</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </section>
      </main>

      {/* 하단 */}
      <footer style={{padding:'14px', textAlign:'center', fontSize:11, opacity:.4}}>
        MyBDR Live Scoreboard
      </footer>

      <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

window.Scoreboard = Scoreboard;
