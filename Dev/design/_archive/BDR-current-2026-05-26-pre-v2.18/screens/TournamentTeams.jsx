/* global React, TOURNAMENTS, TEAMS, MY_TEAM */

// ============================================================
// TournamentTeams — /tournaments/[id]/teams (Phase F3)
// 참가팀 카드 그리드 · 디비전/그룹별 분류 · 본인 소속 강조
// ============================================================

function TournamentTeams({ setRoute }) {
  const t = (typeof TOURNAMENTS !== 'undefined' && TOURNAMENTS[0]) || { title:'BDR CHALLENGE SPRING 2026', team_count:24, max_teams:32 };
  const myTeamId = (typeof MY_TEAM !== 'undefined' && MY_TEAM.id) || 'redeem';

  const teams = (typeof TEAMS !== 'undefined' && TEAMS) || [];
  // synthesize 24 teams from existing 8 if needed (3 groups × 8)
  const synth = (i) => {
    const base = teams[i % Math.max(1, teams.length)] || { id:`team-${i}`, name:`TEAM ${i+1}`, region:'서울', members:8, color:'#1B3C87' };
    return { ...base, _key: `${base.id}-${i}`, _idx:i };
  };
  const allEntries = Array.from({length:24}, (_,i) => synth(i));

  // 4 groups (A/B/C/D) × 6 teams
  const groupNames = ['A조', 'B조', 'C조', 'D조'];
  const groups = groupNames.map((g, gi) => ({
    name: g,
    teams: allEntries.slice(gi*6, gi*6+6),
  }));

  const [groupFilter, setGroupFilter] = React.useState('전체');

  const visibleGroups = groupFilter === '전체' ? groups : groups.filter(g => g.name === groupFilter);

  return (
    <div className="page" style={{maxWidth:1040}}>
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
        <button className="btn btn--sm" onClick={()=>setRoute('tournamentDetail')} style={{minHeight:36}}>← 대회로</button>
        <div style={{fontSize:12, color:'var(--ink-mute)'}}>{t.title}</div>
      </div>

      <h1 style={{margin:'0 0 6px', fontFamily:'var(--ff-display)', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>참가팀</h1>
      <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:18}}>
        {t.team_count}/{t.max_teams} 팀 모집 · 4개 조 편성 (조별 6팀)
      </div>

      {typeof TournamentTabBar !== 'undefined' && (
        <TournamentTabBar value="teams" onChange={(v)=>{
          if (v==='overview') setRoute('tournamentDetail');
          else if (v==='schedule') setRoute('tournamentSchedule');
          else if (v==='bracket') setRoute('bracket');
        }} setRoute={setRoute}/>
      )}

      {/* Group filter tabs */}
      <div style={{display:'flex', gap:0, margin:'18px 0 14px', borderBottom:'1px solid var(--border)', flexWrap:'wrap'}}>
        {['전체', ...groupNames].map(g => (
          <button key={g} onClick={()=>setGroupFilter(g)} style={{
            padding:'10px 16px', minHeight:44, background:'transparent',
            border:'none', borderBottom: groupFilter===g ? '2px solid var(--accent)' : '2px solid transparent',
            color: groupFilter===g ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: groupFilter===g ? 700 : 500, cursor:'pointer', fontSize:13,
            marginBottom:-1,
          }}>
            {g}
          </button>
        ))}
      </div>

      {/* Groups */}
      <div style={{display:'flex', flexDirection:'column', gap:24}}>
        {visibleGroups.map(grp => (
          <section key={grp.name}>
            <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:10}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:800, letterSpacing:'.04em'}}>{grp.name}</h2>
              <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{grp.teams.length}팀</span>
            </div>
            <div className="tt-grid" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
              {grp.teams.map((team) => {
                const isMine = team.id === myTeamId;
                const tcolor = team.color || team.accent || '#1B3C87';
                return (
                  <div key={team._key} className="card" style={{
                    padding:'14px 16px',
                    display:'grid', gridTemplateColumns:'44px 1fr', gap:12, alignItems:'center',
                    borderLeft: isMine ? `3px solid var(--accent)` : `3px solid transparent`,
                    background: isMine ? 'color-mix(in oklab, var(--accent) 6%, var(--bg-card))' : 'var(--bg-card)',
                    cursor:'pointer',
                  }}
                  onClick={()=>setRoute('teamDetail')}>
                    {/* logo placeholder */}
                    <div style={{
                      width:44, height:44, borderRadius:4,
                      background:`linear-gradient(135deg, ${tcolor}, color-mix(in oklab, ${tcolor} 50%, #000))`,
                      color:'#fff', display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14, letterSpacing:'.04em',
                    }}>
                      {(team.name || 'T').slice(0,2).toUpperCase()}
                    </div>
                    {/* info */}
                    <div style={{minWidth:0}}>
                      <div style={{display:'flex', gap:6, alignItems:'center'}}>
                        <div style={{fontWeight:700, fontSize:14, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {team.name}
                        </div>
                        {isMine && <span style={{
                          padding:'1px 6px', fontSize:9, fontWeight:800,
                          background:'var(--accent)', color:'#fff',
                          borderRadius:3, letterSpacing:'.06em',
                        }}>MY</span>}
                      </div>
                      <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:3}}>
                        {team.region || '서울'} · {team.members || 8}명
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <style>{`
        @media (max-width: 920px) {
          .tt-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 540px) {
          .tt-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

window.TournamentTeams = TournamentTeams;
