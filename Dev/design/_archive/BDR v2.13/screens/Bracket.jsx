/* global React, TOURNAMENTS, TEAMS, Avatar */

function Bracket({ setRoute }) {
  const [tournament, setTournament] = React.useState('kings7');
  const [round, setRound] = React.useState('all');
  const [view, setView] = React.useState('bracket'); // bracket | standings

  // Group stage standings (예선 리그 → 본선 진출)
  const standings = {
    A: [
      { tag:'RDM', name:'REDEEM',      color:'#DC2626', ink:'#fff', w:3, l:0, pf:62, pa:48, streak:'WWW', adv:'본선' },
      { tag:'3P',  name:'3POINT',      color:'#0F5FCC', ink:'#fff', w:2, l:1, pf:58, pa:51, streak:'LWW', adv:'본선' },
      { tag:'PVT', name:'PIVOT',       color:'#8B5CF6', ink:'#fff', w:1, l:2, pf:49, pa:54, streak:'WLL', adv:'와일드' },
      { tag:'DWN', name:'DAWN SQUAD',  color:'#0EA5E9', ink:'#fff', w:0, l:3, pf:42, pa:58, streak:'LLL', adv:'탈락' },
    ],
    B: [
      { tag:'MKY', name:'MONKEYS',     color:'#F59E0B', ink:'#111', w:3, l:0, pf:65, pa:46, streak:'WWW', adv:'본선' },
      { tag:'KGS', name:'KINGS CREW',  color:'#7C2D12', ink:'#fff', w:2, l:1, pf:60, pa:49, streak:'WWL', adv:'본선' },
      { tag:'IRN', name:'IRON WOLVES', color:'#475569', ink:'#fff', w:1, l:2, pf:51, pa:55, streak:'LWL', adv:'와일드' },
      { tag:'SWP', name:'SWEEP',       color:'#10B981', ink:'#fff', w:0, l:3, pf:44, pa:60, streak:'LLL', adv:'탈락' },
    ],
  };
  const advBadge = (a) => {
    if (a === '본선') return <span className="badge badge--ok" style={{fontSize:10}}>본선 진출</span>;
    if (a === '와일드') return <span className="badge badge--soft" style={{fontSize:10}}>와일드카드</span>;
    return <span className="badge badge--ghost" style={{fontSize:10, color:'var(--ink-dim)'}}>탈락</span>;
  };
  const StandingsTable = ({ title, rows }) => (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <div style={{padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg-alt)', display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div>
          <div style={{fontSize:10, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)'}}>GROUP</div>
          <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, letterSpacing:'-0.01em'}}>{title}</div>
        </div>
        <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>4팀 · 풀리그</div>
      </div>
      <div className="board data-table" style={{border:0, borderRadius:0}}>
        <div className="board__head data-table__head" style={{gridTemplateColumns:'40px 1fr 56px 56px 70px 70px 80px 90px'}}>
          <div>#</div><div>팀</div><div>승</div><div>패</div><div>득점</div><div>실점</div><div>최근</div><div>진출</div>
        </div>
        {rows.map((r, i) => {
          const diff = r.pf - r.pa;
          return (
            <div key={r.tag} className="board__row data-table__row" style={{gridTemplateColumns:'40px 1fr 56px 56px 70px 70px 80px 90px', background: i<2 ? 'color-mix(in oklab, var(--ok) 6%, var(--bg-elev))' : (i===2 ? 'var(--bg-alt)' : 'var(--bg-elev)')}}>
              <div data-label="#" className="num" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:15, color: i===0?'var(--accent)':'var(--ink-dim)'}}>{i+1}</div>
              <div data-primary="true" className="title" style={{display:'flex', alignItems:'center', gap:10}}>
                <Avatar tag={r.tag} color={r.color} ink={r.ink} size={26} radius={3}/>
                <span style={{fontWeight:700}}>{r.name}</span>
              </div>
              <div data-label="승" style={{fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ok)'}}>{r.w}</div>
              <div data-label="패" style={{fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ink-dim)'}}>{r.l}</div>
              <div data-label="득점" style={{fontFamily:'var(--ff-mono)'}}>{r.pf}</div>
              <div data-label="실점" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>{r.pa}<div style={{fontSize:10, color: diff>=0?'var(--ok)':'var(--accent)'}}>{diff>=0?'+':''}{diff}</div></div>
              <div data-label="최근" style={{display:'flex', gap:2}}>
                {r.streak.split('').map((s, si) => (
                  <span key={si} style={{width:14, height:14, fontSize:9, fontWeight:800, display:'grid', placeItems:'center', color:'#fff', background: s==='W'?'var(--ok)':'var(--ink-dim)', borderRadius:2, fontFamily:'var(--ff-display)'}}>{s}</span>
                ))}
              </div>
              <div data-label="진출">{advBadge(r.adv)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const teams = [
    { tag:'RDM', name:'REDEEM', seed:1, color:'#DC2626', ink:'#fff' },
    { tag:'3P',  name:'3POINT', seed:2, color:'#0F5FCC', ink:'#fff' },
    { tag:'MKY', name:'MONKEYS', seed:3, color:'#F59E0B', ink:'#111' },
    { tag:'IRN', name:'IRON WOLVES', seed:4, color:'#475569', ink:'#fff' },
    { tag:'SWP', name:'SWEEP', seed:5, color:'#10B981', ink:'#fff' },
    { tag:'KGS', name:'KINGS CREW', seed:6, color:'#7C2D12', ink:'#fff' },
    { tag:'PVT', name:'PIVOT', seed:7, color:'#8B5CF6', ink:'#fff' },
    { tag:'DWN', name:'DAWN SQUAD', seed:8, color:'#0EA5E9', ink:'#fff' },
  ];

  const matches = {
    qf: [
      { id:'qf1', a:teams[0], b:teams[7], as:68, bs:52, done:true, winner:'a', court:'잠실', date:'05.09 10:00' },
      { id:'qf2', a:teams[3], b:teams[4], as:61, bs:64, done:true, winner:'b', court:'잠실', date:'05.09 12:00' },
      { id:'qf3', a:teams[1], b:teams[6], as:null, bs:null, done:false, live:true, court:'장충', date:'05.09 14:00', current:{a:47,b:52,q:'Q3 5:24'} },
      { id:'qf4', a:teams[2], b:teams[5], as:null, bs:null, done:false, court:'장충', date:'05.09 16:00' },
    ],
    sf: [
      { id:'sf1', a:teams[0], b:teams[4], as:null, bs:null, done:false, court:'장충', date:'05.16 13:00' },
      { id:'sf2', a:null, b:null, tbd:true, court:'장충', date:'05.16 15:00' },
    ],
    f: [
      { id:'f1', a:null, b:null, tbd:true, court:'장충', date:'05.17 14:00' },
    ],
  };

  const MatchCard = ({ m, size='md' }) => {
    const h = size==='sm' ? 62 : 74;
    return (
      <div style={{
        background:'var(--bg)',
        border:'1px solid var(--border)',
        borderRadius:6,
        overflow:'hidden',
        width: size==='sm' ? 200 : 220,
        position:'relative',
        boxShadow: m.live ? '0 0 0 2px var(--err)' : 'none',
      }}>
        {m.live && <div style={{position:'absolute', top:-8, right:8, background:'var(--err)', color:'#fff', fontSize:9, fontWeight:800, padding:'2px 7px', borderRadius:3, letterSpacing:'.1em', zIndex:1}}>● LIVE</div>}
        {m.tbd ? (
          <div style={{height:h*2, display:'grid', placeItems:'center', color:'var(--ink-dim)', fontSize:12, fontWeight:600}}>
            대진 대기중
          </div>
        ) : (
          <>
            {[{t:m.a, s:m.as, w:m.winner==='a'}, {t:m.b, s:m.bs, w:m.winner==='b'}].map((side, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'28px 24px 1fr auto', gap:8,
                padding:'10px 12px', alignItems:'center',
                borderTop: i>0 ? '1px solid var(--border)' : 0,
                background: side.w ? 'color-mix(in oklab, var(--ok) 10%, var(--bg))' : (m.done && !side.w ? 'var(--bg-alt)' : 'transparent'),
                opacity: m.done && !side.w ? 0.6 : 1,
              }}>
                <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:700}}>#{side.t.seed}</span>
                <Avatar tag={side.t.tag} color={side.t.color} ink={side.t.ink} size={24} radius={3}/>
                <span style={{fontWeight:600, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{side.t.name}</span>
                <span style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:900, color: side.w ? 'var(--ok)' : m.live ? (side.s === Math.max(m.current?.a||0, m.current?.b||0) ? 'var(--err)' : 'var(--ink)') : 'var(--ink)'}}>
                  {m.live ? (i===0 ? m.current.a : m.current.b) : (side.s ?? '–')}
                </span>
              </div>
            ))}
            <div style={{padding:'5px 12px', fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', background:'var(--bg-alt)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between'}}>
              <span>{m.court} · {m.date}</span>
              {m.live && <span style={{color:'var(--err)', fontWeight:700}}>{m.current.q}</span>}
              {m.done && <span style={{color:'var(--ok)', fontWeight:700}}>완료</span>}
            </div>
          </>
        )}
      </div>
    );
  };

  // Column header
  const ColHeader = ({ title, n, date }) => (
    <div style={{marginBottom:16, textAlign:'center'}}>
      <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.14em'}}>{title}</div>
      <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, letterSpacing:'-0.01em', marginTop:2}}>{n}경기</div>
      <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:2}}>{date}</div>
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <span style={{color:'var(--ink)'}}>대진표</span>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:20, flexWrap:'wrap', gap:12}}>
        <div>
          <div className="eyebrow">BRACKET · SINGLE ELIMINATION</div>
          <h1 style={{margin:'6px 0 0', fontSize:32, fontWeight:800, letterSpacing:'-0.02em'}}>Kings Cup Vol.07 · 본선</h1>
          <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>8팀 · 싱글 엘리미네이션 · 2026.05.09 ~ 05.17 · 장충체육관</p>
        </div>
        <div style={{display:'flex', gap:6}}>
          <select className="input" value={tournament} onChange={e=>setTournament(e.target.value)} style={{fontSize:12}}>
            <option value="kings7">Kings Cup Vol.07 본선</option>
            <option value="spring">BDR Challenge Spring 2026</option>
            <option value="seoul">서울바스켓 4R</option>
          </select>
          <button className="btn btn--sm">🔖 저장</button>
          <button className="btn btn--sm">↗ 공유</button>
          <button className="btn btn--sm">🖨 출력</button>
        </div>
      </div>

      {/* View toggle: 대진표 ↔ 순위표 */}
      <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:18, gap:0}}>
        {[['bracket','대진표', '8경기'],['standings','조별 순위표', '예선 8팀']].map(([k,l,sub]) => (
          <button key={k} onClick={()=>setView(k)} style={{
            padding:'12px 20px', background:'transparent', border:0,
            borderBottom: view===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
            color: view===k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: view===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
            display:'flex', flexDirection:'column', alignItems:'flex-start',
          }}>
            <span>{l}</span>
            <span style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:500}}>{sub}</span>
          </button>
        ))}
      </div>

      {view === 'standings' ? (
        <>
          <div className="card" style={{padding:'16px 20px', marginBottom:18, background:'var(--bg-alt)'}}>
            <div style={{display:'flex', gap:18, flexWrap:'wrap', alignItems:'center', fontSize:13}}>
              <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{width:14, height:14, background:'color-mix(in oklab, var(--ok) 30%, transparent)', borderRadius:2}}/> 본선 직행 (1·2위)</div>
              <div style={{display:'flex', alignItems:'center', gap:6}}><span style={{width:14, height:14, background:'var(--bg-alt)', border:'1px solid var(--border-strong)', borderRadius:2}}/> 와일드카드 (3위)</div>
              <div style={{color:'var(--ink-mute)'}}>각 조 1·2위 직행, 3위 중 득실차 1팀 와일드카드 진출</div>
            </div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, alignItems:'flex-start'}}>
            <StandingsTable title="A조" rows={standings.A}/>
            <StandingsTable title="B조" rows={standings.B}/>
          </div>

          {/* 와일드카드 비교 */}
          <div className="card" style={{padding:'18px 22px', marginTop:20}}>
            <h3 style={{margin:'0 0 14px', fontSize:15, fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
              <span className="badge badge--soft">와일드카드 경합</span>
              3위 팀 중 득실차 +로 1팀 진출
            </h3>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14}}>
              {[
                {...standings.A[2], group:'A'},
                {...standings.B[2], group:'B'},
              ].sort((a,b)=>(b.pf-b.pa)-(a.pf-a.pa)).map((r, i) => (
                <div key={r.tag} className="card" style={{padding:'14px 16px', display:'flex', gap:12, alignItems:'center', borderColor: i===0 ? 'var(--ok)' : undefined, borderWidth: i===0 ? 2 : 1}}>
                  <Avatar tag={r.tag} color={r.color} ink={r.ink} size={36} radius={4}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>{r.group}조 3위</div>
                    <div style={{fontWeight:700, fontSize:15}}>{r.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:2}}>득실 {r.pf-r.pa>=0?'+':''}{r.pf-r.pa} ({r.pf}/{r.pa})</div>
                  </div>
                  {i===0
                    ? <span className="badge badge--ok">진출 유력</span>
                    : <span className="badge badge--ghost">탈락 유력</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* 조별 잔여 경기 */}
          <div style={{marginTop:20, display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
            {[
              {grp:'A', games:[
                {time:'05.05 14:00', a:'PIVOT', b:'DAWN SQUAD', score:null},
                {time:'05.05 16:00', a:'REDEEM', b:'3POINT', score:null},
              ]},
              {grp:'B', games:[
                {time:'05.05 18:00', a:'IRON WOLVES', b:'SWEEP', score:null},
                {time:'05.05 20:00', a:'MONKEYS', b:'KINGS CREW', score:null},
              ]},
            ].map(g => (
              <div key={g.grp} className="card" style={{padding:'16px 18px'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
                  <h3 style={{margin:0, fontSize:14, fontWeight:700}}>{g.grp}조 잔여 경기</h3>
                  <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{g.games.length}경기 남음</span>
                </div>
                {g.games.map((m, i) => (
                  <div key={i} style={{display:'grid', gridTemplateColumns:'90px 1fr', gap:10, padding:'8px 0', borderTop: i>0?'1px solid var(--border)':0, alignItems:'center'}}>
                    <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)'}}>{m.time}</div>
                    <div style={{fontSize:13}}>
                      <span style={{fontWeight:600}}>{m.a}</span>
                      <span style={{color:'var(--ink-dim)', margin:'0 8px', fontFamily:'var(--ff-mono)'}}>vs</span>
                      <span style={{fontWeight:600}}>{m.b}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      ) : (<>

      {/* Status bar */}
      <div className="card" style={{padding:'14px 20px', marginBottom:18, display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:0}}>
        {[
          {l:'참가팀', v:'8', sub:'전원 본선'},
          {l:'경기완료', v:'2', sub:'/ 7경기'},
          {l:'진행중', v:'1', sub:'LIVE', color:'var(--err)'},
          {l:'현재라운드', v:'8강', sub:'Quarter'},
          {l:'우승상금', v:'₩3,000,000', sub:'+ 트로피'},
        ].map((s, i) => (
          <div key={s.l} style={{padding:'0 12px', borderLeft: i>0 ? '1px solid var(--border)' : 0, textAlign:'center'}}>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.12em'}}>{s.l}</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, marginTop:2, color: s.color || 'var(--ink)'}}>{s.v}</div>
            <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Bracket */}
      <div className="card bracket-tree" style={{padding:'28px 20px', overflowX:'auto'}}>
        <div className="bracket-grid" style={{display:'grid', gridTemplateColumns:'1fr auto 1fr auto 1fr', gap:40, minWidth:1000, alignItems:'center'}}>
          {/* QF col */}
          <div className="bracket-col">
            <ColHeader title="8강 · QUARTERFINALS" n={4} date="05.09 토"/>
            <div style={{display:'flex', flexDirection:'column', gap:30}}>
              {matches.qf.map(m => <MatchCard key={m.id} m={m}/>)}
            </div>
          </div>

          {/* Connector lines */}
          <div className="bracket-conn" style={{height:420, display:'flex', flexDirection:'column', justifyContent:'space-around', alignItems:'center'}}>
            {[0,1,2,3].map(i => (
              <div key={i} style={{width:40, height:2, background:'var(--border)', position:'relative'}}>
                {i % 2 === 0 && <div style={{position:'absolute', right:-1, top:2, width:2, height:110, background:'var(--border)'}}/>}
              </div>
            ))}
          </div>

          {/* SF col */}
          <div className="bracket-col">
            <ColHeader title="4강 · SEMIFINALS" n={2} date="05.16 토"/>
            <div className="bracket-sf-list" style={{display:'flex', flexDirection:'column', gap:140, marginTop:60}}>
              {matches.sf.map(m => <MatchCard key={m.id} m={m}/>)}
            </div>
          </div>

          {/* Connector lines */}
          <div className="bracket-conn" style={{height:420, display:'flex', flexDirection:'column', justifyContent:'space-around', alignItems:'center'}}>
            <div style={{width:40, height:2, background:'var(--border)', marginTop:80, position:'relative'}}>
              <div style={{position:'absolute', right:-1, top:2, width:2, height:190, background:'var(--border)'}}/>
            </div>
          </div>

          {/* Final col */}
          <div className="bracket-col">
            <ColHeader title="결승 · FINAL" n={1} date="05.17 일"/>
            <div className="bracket-final-wrap" style={{marginTop:190}}>
              <div style={{position:'relative'}}>
                <div style={{position:'absolute', top:-42, left:'50%', transform:'translateX(-50%)', background:'linear-gradient(135deg, #F59E0B, #D97706)', color:'#fff', padding:'6px 14px', borderRadius:4, fontSize:11, fontWeight:800, letterSpacing:'.12em', whiteSpace:'nowrap'}}>🏆 CHAMPIONSHIP</div>
                <MatchCard m={matches.f[0]}/>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule list */}
      <div style={{marginTop:22, display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:18, alignItems:'flex-start'}}>
        <div className="card" style={{padding:'20px 22px'}}>
          <h3 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>경기 일정</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {[...matches.qf, ...matches.sf, ...matches.f].map((m, i) => (
              <div key={i} className="bracket-sched-row" style={{display:'grid', gridTemplateColumns:'110px 60px 1fr auto', gap:14, padding:'12px 0', borderBottom:'1px solid var(--border)', alignItems:'center'}}>
                <div style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{m.date}</div>
                <span className={`badge ${m.live?'badge--red':m.done?'badge--ok':'badge--soft'}`} style={{fontSize:10}}>
                  {m.live?'LIVE':m.done?'완료':m.tbd?'TBD':'예정'}
                </span>
                <div style={{fontSize:13, fontWeight:600}}>
                  {m.tbd ? '승자 vs 승자' : <>{m.a?.name || 'TBD'} <span style={{color:'var(--ink-dim)', margin:'0 6px'}}>vs</span> {m.b?.name || 'TBD'}</>}
                  <span style={{color:'var(--ink-dim)', fontSize:11, fontFamily:'var(--ff-mono)', marginLeft:8}}>{m.court}</span>
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:800, color: m.done ? 'var(--ok)' : 'var(--ink)'}}>
                  {m.done ? `${m.as} : ${m.bs}` : m.live ? `${m.current.a} : ${m.current.b}` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>시드 순위</h3>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {teams.map(t => (
                <div key={t.tag} style={{display:'grid', gridTemplateColumns:'24px 28px 1fr auto', gap:8, padding:'6px 8px', background:'var(--bg-alt)', borderRadius:4, alignItems:'center'}}>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-dim)'}}>#{t.seed}</span>
                  <Avatar tag={t.tag} color={t.color} ink={t.ink} size={24} radius={3}/>
                  <span style={{fontWeight:600, fontSize:12}}>{t.name}</span>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>1684</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'18px 20px'}}>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700}}>우승 예측 (커뮤니티)</h3>
            {[
              {t:'REDEEM', pct:38, color:'#DC2626'},
              {t:'3POINT', pct:27, color:'#0F5FCC'},
              {t:'MONKEYS', pct:18, color:'#F59E0B'},
              {t:'IRON WOLVES', pct:9, color:'#475569'},
              {t:'기타', pct:8, color:'var(--ink-dim)'},
            ].map(p => (
              <div key={p.t} style={{marginBottom:10}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3}}>
                  <span style={{fontWeight:600}}>{p.t}</span>
                  <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{p.pct}%</span>
                </div>
                <div style={{height:5, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width:`${p.pct}%`, height:'100%', background:p.color}}/>
                </div>
              </div>
            ))}
            <button className="btn btn--sm" style={{width:'100%', marginTop:10}}>내 예측 투표</button>
          </div>
        </aside>
      </div>
      </>)}
    </div>
  );
}

window.Bracket = Bracket;
