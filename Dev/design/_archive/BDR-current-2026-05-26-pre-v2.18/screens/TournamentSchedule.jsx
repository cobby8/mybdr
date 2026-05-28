/* global React, TOURNAMENTS, SCHEDULE */

// ============================================================
// TournamentSchedule — /tournaments/[id]/schedule (Phase F3)
// 라운드별 그룹화 (조별 / 토너먼트) · 상태 뱃지 (예정 / 진행중 / 종료)
// ============================================================

function TournamentSchedule({ setRoute }) {
  const t = (typeof TOURNAMENTS !== 'undefined' && TOURNAMENTS[0]) || { title:'BDR CHALLENGE SPRING 2026', id:'bdr-challenge-spring-2026' };
  const [filter, setFilter] = React.useState('전체');

  const games = [
    { round:'예선 A조', date:'05.18 (월)', time:'19:00', court:'잠실 1코트', a:'REDEEM', b:'OUTLIERS', sa:78, sb:65, status:'ended' },
    { round:'예선 A조', date:'05.18 (월)', time:'21:00', court:'잠실 1코트', a:'GHOSTS',  b:'TROJANS',  sa:null, sb:null, status:'live' },
    { round:'예선 B조', date:'05.19 (화)', time:'19:00', court:'잠실 2코트', a:'GUARDS',  b:'KINGS',    sa:null, sb:null, status:'upcoming' },
    { round:'예선 B조', date:'05.19 (화)', time:'21:00', court:'잠실 2코트', a:'PHOENIX', b:'WOLVES',   sa:null, sb:null, status:'upcoming' },
    { round:'예선 C조', date:'05.20 (수)', time:'19:00', court:'잠실 1코트', a:'REDEEM',  b:'GHOSTS',   sa:null, sb:null, status:'upcoming' },
    { round:'8강',     date:'05.25 (월)', time:'20:00', court:'잠실 메인', a:'A조 1위', b:'B조 2위',  sa:null, sb:null, status:'upcoming' },
    { round:'8강',     date:'05.25 (월)', time:'21:30', court:'잠실 메인', a:'C조 1위', b:'D조 2위',  sa:null, sb:null, status:'upcoming' },
    { round:'준결승',  date:'06.01 (월)', time:'20:00', court:'잠실 메인', a:'8강 W1',  b:'8강 W2',   sa:null, sb:null, status:'upcoming' },
    { round:'결승',    date:'06.07 (일)', time:'19:00', court:'잠실 메인', a:'준결 W1', b:'준결 W2',  sa:null, sb:null, status:'upcoming' },
  ];

  const statusMeta = {
    upcoming: { label:'예정',   color:'var(--cafe-blue)' },
    live:     { label:'진행중', color:'var(--ok)' },
    ended:    { label:'종료',   color:'var(--ink-dim)' },
  };

  const filters = ['전체', '예정', '진행중', '종료'];
  const counts = {
    '전체': games.length,
    '예정': games.filter(g => g.status==='upcoming').length,
    '진행중': games.filter(g => g.status==='live').length,
    '종료': games.filter(g => g.status==='ended').length,
  };

  const shown = games.filter(g => {
    if (filter === '전체') return true;
    if (filter === '예정') return g.status === 'upcoming';
    if (filter === '진행중') return g.status === 'live';
    if (filter === '종료') return g.status === 'ended';
  });

  // 라운드별 그룹
  const grouped = shown.reduce((acc, g) => {
    (acc[g.round] = acc[g.round] || []).push(g);
    return acc;
  }, {});

  return (
    <div className="page" style={{maxWidth:1040}}>
      {/* Back */}
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
        <button className="btn btn--sm" onClick={()=>setRoute('tournamentDetail')} style={{minHeight:36}}>← 대회로</button>
        <div style={{fontSize:12, color:'var(--ink-mute)'}}>{t.title}</div>
      </div>

      <h1 style={{margin:'0 0 6px', fontFamily:'var(--ff-display)', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>경기 일정</h1>
      <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:18}}>
        총 {games.length}경기 · 진행 {counts['진행중']} · 종료 {counts['종료']}
      </div>

      {typeof TournamentTabBar !== 'undefined' && (
        <TournamentTabBar value="schedule" onChange={(v)=>{
          if (v==='overview') setRoute('tournamentDetail');
          else if (v==='bracket') setRoute('bracket');
          else if (v==='teams') setRoute('tournamentTeams');
        }} setRoute={setRoute}/>
      )}

      {/* Filter tabs */}
      <div style={{display:'flex', gap:0, margin:'18px 0 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap'}}>
        {filters.map(f => (
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:'10px 16px', minHeight:44, background:'transparent',
            border:'none', borderBottom: filter===f ? '2px solid var(--accent)' : '2px solid transparent',
            color: filter===f ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: filter===f ? 700 : 500, cursor:'pointer', fontSize:13,
            marginBottom:-1,
          }}>
            {f} <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', marginLeft:3}}>{counts[f]}</span>
          </button>
        ))}
      </div>

      {/* 라운드별 */}
      <div style={{display:'flex', flexDirection:'column', gap:18}}>
        {Object.keys(grouped).length === 0 && (
          <div className="card" style={{padding:'28px 22px', textAlign:'center', color:'var(--ink-mute)', fontSize:13}}>
            해당 상태의 경기가 없습니다
          </div>
        )}
        {Object.entries(grouped).map(([round, list]) => (
          <div key={round}>
            <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:8}}>
              <h2 style={{margin:0, fontSize:14, fontWeight:800, letterSpacing:'.06em', textTransform:'uppercase', color:'var(--accent)'}}>{round}</h2>
              <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{list.length}경기</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {list.map((g, i) => {
                const sm = statusMeta[g.status];
                const winnerA = g.sa != null && g.sb != null && g.sa > g.sb;
                const winnerB = g.sa != null && g.sb != null && g.sb > g.sa;
                return (
                  <div key={i} className="card ts-row" style={{
                    padding:'12px 16px',
                    display:'grid',
                    gridTemplateColumns:'90px 1fr 100px 80px',
                    gap:14, alignItems:'center',
                    borderLeft: g.status==='live' ? `3px solid ${sm.color}` : `3px solid transparent`,
                  }}>
                    {/* 시간 */}
                    <div>
                      <div style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-mute)', fontWeight:700}}>{g.date}</div>
                      <div style={{fontFamily:'var(--ff-mono)', fontSize:14, fontWeight:800}}>{g.time}</div>
                    </div>
                    {/* 매치업 */}
                    <div style={{display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:8, alignItems:'center'}}>
                      <div style={{textAlign:'right', fontWeight: winnerA ? 800 : 600, fontSize:14, color: winnerA ? 'var(--ink)' : g.status==='ended' ? 'var(--ink-dim)' : 'var(--ink)'}}>
                        {g.a}
                      </div>
                      <div style={{
                        fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:800, color:'var(--ink)',
                        padding:'4px 10px', background:'var(--bg-alt)', borderRadius:4, minWidth:64, textAlign:'center',
                      }}>
                        {g.sa != null ? `${g.sa} : ${g.sb}` : 'vs'}
                      </div>
                      <div style={{textAlign:'left', fontWeight: winnerB ? 800 : 600, fontSize:14, color: winnerB ? 'var(--ink)' : g.status==='ended' ? 'var(--ink-dim)' : 'var(--ink)'}}>
                        {g.b}
                      </div>
                    </div>
                    {/* 코트 */}
                    <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{g.court}</div>
                    {/* 상태 */}
                    <div style={{textAlign:'right'}}>
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        padding:'3px 8px', fontSize:10, fontWeight:800,
                        letterSpacing:'.06em', textTransform:'uppercase',
                        background: g.status==='live' ? sm.color : 'transparent',
                        color: g.status==='live' ? '#fff' : sm.color,
                        border: g.status==='live' ? 'none' : `1px solid ${sm.color}`,
                        borderRadius:3,
                      }}>
                        {g.status==='live' && <span style={{width:5, height:5, borderRadius:'50%', background:'#fff', animation:'tspulse 1.2s ease-in-out infinite'}}/>}
                        {sm.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes tspulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
        @media (max-width: 720px) {
          .ts-row {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto auto;
            gap: 8px !important;
          }
          .ts-row > div:nth-child(2) { grid-column: 1 / -1; order: 0; }
        }
      `}</style>
    </div>
  );
}

window.TournamentSchedule = TournamentSchedule;
