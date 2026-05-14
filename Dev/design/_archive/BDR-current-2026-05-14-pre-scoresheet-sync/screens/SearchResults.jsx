/* global React, Avatar, Poster, TEAMS, GAMES, TOURNAMENTS, COURTS */

function SearchResults({ setRoute }) {
  const [q, setQ] = React.useState('장충');
  const [tab, setTab] = React.useState('all');
  const [sort, setSort] = React.useState('relevance');
  const [filters, setFilters] = React.useState({
    area: [],
    level: [],
    dateRange: 'any',
    freeOnly: false,
    openOnly: true,
  });

  const toggleF = (k, v) => {
    const arr = filters[k];
    setFilters({...filters, [k]: arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v]});
  };

  const recent = ['장충체육관','3x3 대회','중급 픽업','잠실','서초 코트'];
  const trending = ['BDR Challenge','여성부 대회','한강 코트','야간 픽업','신촌 농구'];

  const tabs = [
    { id:'all', l:'전체', n:48 },
    { id:'games', l:'경기', n:12 },
    { id:'tournaments', l:'대회', n:3 },
    { id:'teams', l:'팀', n:8 },
    { id:'courts', l:'코트', n:5 },
    { id:'players', l:'선수', n:14 },
    { id:'posts', l:'게시글', n:6 },
  ];

  const results = {
    games: [
      { title:'토요 아침 픽업 @ 장충', court:'장충체육관 B코트', when:'2026.04.27 07:00', fee:'5,000원', lv:'중급', applied:'6/10', color:'#DC2626' },
      { title:'평일 저녁 3x3 @ 장충', court:'장충 야외', when:'2026.04.29 19:00', fee:'무료', lv:'중-상급', applied:'9/12', color:'#0F5FCC' },
      { title:'장충 주말 픽업', court:'장충체육관 A코트', when:'2026.05.02 10:00', fee:'8,000원', lv:'상급', applied:'3/8', color:'#10B981' },
    ],
    tournaments: [
      { title:'BDR Challenge Spring 2026', venue:'장충체육관', dates:'2026.05.16-17', teams:'24팀', status:'open', accent:'#DC2626', edition:'Vol.12' },
    ],
    teams: [
      { name:'장충 올스타즈', tag:'JCA', members:12, area:'서울 중구', color:'#DC2626', ink:'#fff' },
      { name:'Monday Grinders', tag:'MNG', members:8, area:'서울 중구', color:'#0F5FCC', ink:'#fff' },
    ],
    courts: [
      { name:'장충체육관', area:'서울 중구', hoops:2, surface:'우레탄', rating:4.8, fee:'무료' },
      { name:'장충 야외 농구장', area:'서울 중구', hoops:4, surface:'아스팔트', rating:4.5, fee:'무료' },
    ],
    players: [
      { name:'jc_sniper', lv:'L.7', pos:'G', area:'장충동', rating:4.9, games:127 },
      { name:'jc_pivot', lv:'L.6', pos:'C', area:'장충동', rating:4.7, games:89 },
    ],
    posts: [
      { board:'경기후기', title:'장충체육관에서 뛰면서 느낀 점 공유', excerpt:'오랜만에 장충 나갔는데 골대 높이가 딱 맞고…', author:'rdm_captain', when:'2일 전' },
    ],
  };

  const showAll = tab === 'all';
  const showSection = (key) => tab === 'all' || tab === key;

  return (
    <div className="page page--wide">
      {/* Search bar */}
      <div style={{marginBottom:20}}>
        <div style={{position:'relative', maxWidth:720}}>
          <input
            className="input"
            value={q}
            onChange={e=>setQ(e.target.value)}
            placeholder="경기·팀·코트·선수 검색"
            style={{padding:'14px 14px 14px 44px', fontSize:16, fontWeight:600}}
          />
          <div style={{position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', fontSize:18, opacity:.5}}>🔍</div>
          {q && <button onClick={()=>setQ('')} style={{position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', background:'var(--bg-alt)', border:0, width:26, height:26, borderRadius:13, cursor:'pointer', fontSize:12}}>×</button>}
        </div>
        <div style={{display:'flex', gap:6, marginTop:10, fontSize:11, color:'var(--ink-dim)', flexWrap:'wrap', alignItems:'center'}}>
          <span style={{fontWeight:700}}>최근:</span>
          {recent.map(r => <button key={r} onClick={()=>setQ(r)} className="btn btn--sm" style={{padding:'3px 10px', fontSize:11}}>{r}</button>)}
          <span style={{marginLeft:12, fontWeight:700}}>🔥 인기:</span>
          {trending.map(r => <button key={r} onClick={()=>setQ(r)} className="btn btn--sm" style={{padding:'3px 10px', fontSize:11}}>{r}</button>)}
        </div>
      </div>

      {/* Header */}
      <div style={{marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
        <div>
          <h1 style={{margin:0, fontSize:20, fontWeight:800, letterSpacing:'-0.01em'}}>"{q}" 검색 결과</h1>
          <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:12}}>전체 <b style={{color:'var(--ink)'}}>48개</b> · 0.12초</p>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <select className="input" value={sort} onChange={e=>setSort(e.target.value)} style={{padding:'6px 10px', fontSize:12, width:'auto'}}>
            <option value="relevance">관련도순</option>
            <option value="recent">최신순</option>
            <option value="popular">인기순</option>
            <option value="distance">거리순</option>
          </select>
          <button className="btn btn--sm">🔔 알림 저장</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:18, overflowX:'auto'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 16px', background:'transparent', border:0, cursor:'pointer',
            fontSize:13, fontWeight: tab===t.id?700:500, whiteSpace:'nowrap',
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--ink)' : 'var(--ink-soft)', marginBottom:-1,
          }}>
            {t.l}
            <span style={{marginLeft:6, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.n}</span>
          </button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'240px minmax(0,1fr)', gap:20, alignItems:'flex-start'}}>
        {/* Filters */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:'18px 18px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <h3 style={{margin:0, fontSize:13, fontWeight:700, letterSpacing:'.05em'}}>필터</h3>
              <a style={{fontSize:11, color:'var(--cafe-blue)', cursor:'pointer', fontWeight:600}} onClick={()=>setFilters({area:[],level:[],dateRange:'any',freeOnly:false,openOnly:true})}>초기화</a>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:8, letterSpacing:'.06em'}}>지역</div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {['강남','서초','송파','성동','용산','중구','마포','영등포'].map(a => {
                  const on = filters.area.includes(a);
                  return <button key={a} onClick={()=>toggleF('area', a)} className={`btn btn--sm ${on?'btn--primary':''}`} style={{padding:'3px 9px', fontSize:11}}>{a}</button>;
                })}
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:8, letterSpacing:'.06em'}}>실력</div>
              <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                {['초보','중급','상급','선출급'].map(l => {
                  const on = filters.level.includes(l);
                  return <button key={l} onClick={()=>toggleF('level', l)} className={`btn btn--sm ${on?'btn--primary':''}`} style={{padding:'3px 9px', fontSize:11}}>{l}</button>;
                })}
              </div>
            </div>

            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:8, letterSpacing:'.06em'}}>일정</div>
              <div style={{display:'flex', flexDirection:'column', gap:4}}>
                {[{v:'any',l:'전체'},{v:'today',l:'오늘'},{v:'week',l:'이번 주'},{v:'month',l:'이번 달'},{v:'weekend',l:'주말만'}].map(d => (
                  <label key={d.v} style={{display:'flex', gap:6, alignItems:'center', cursor:'pointer', fontSize:12}}>
                    <input type="radio" checked={filters.dateRange===d.v} onChange={()=>setFilters({...filters, dateRange:d.v})}/>
                    {d.l}
                  </label>
                ))}
              </div>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:8, paddingTop:12, borderTop:'1px solid var(--border)'}}>
              <label style={{display:'flex', gap:6, alignItems:'center', fontSize:12, cursor:'pointer'}}>
                <input type="checkbox" checked={filters.freeOnly} onChange={e=>setFilters({...filters, freeOnly:e.target.checked})}/>
                무료만
              </label>
              <label style={{display:'flex', gap:6, alignItems:'center', fontSize:12, cursor:'pointer'}}>
                <input type="checkbox" checked={filters.openOnly} onChange={e=>setFilters({...filters, openOnly:e.target.checked})}/>
                모집중만
              </label>
            </div>
          </div>
        </aside>

        {/* Results */}
        <div style={{display:'flex', flexDirection:'column', gap:24}}>
          {showSection('games') && (
            <section>
              {showAll && <SectionHeader title="경기" count={12} onMore={()=>setTab('games')}/>}
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {results.games.slice(0, showAll?2:12).map((g, i) => (
                  <div key={i} className="card" style={{padding:'14px 18px', cursor:'pointer', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:14, alignItems:'center'}} onClick={()=>setRoute('gameDetail')}>
                    <div style={{width:44, height:44, background:g.color, borderRadius:4, display:'grid', placeItems:'center', color:'#fff', fontWeight:900, fontFamily:'var(--ff-display)'}}>🏀</div>
                    <div>
                      <div style={{fontWeight:700, fontSize:14}} dangerouslySetInnerHTML={{__html: highlight(g.title, q)}}/>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}} dangerouslySetInnerHTML={{__html: highlight(`${g.when} · ${g.court} · ${g.lv} · ${g.fee}`, q)}}/>
                    </div>
                    <div style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-mute)', fontWeight:700}}>{g.applied}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showSection('tournaments') && (
            <section>
              {showAll && <SectionHeader title="대회" count={3} onMore={()=>setTab('tournaments')}/>}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
                {results.tournaments.map((t, i) => (
                  <div key={i} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('matchDetail')}>
                    <div style={{background:t.accent, color:'#fff', padding:'14px 16px'}}>
                      <div style={{fontSize:10, opacity:.85, fontWeight:800, letterSpacing:'.1em'}}>{t.edition}</div>
                      <div style={{fontWeight:800, fontSize:15, marginTop:4}} dangerouslySetInnerHTML={{__html: highlight(t.title, q)}}/>
                    </div>
                    <div style={{padding:'12px 16px', fontSize:12, color:'var(--ink-mute)'}}>
                      <div style={{fontFamily:'var(--ff-mono)'}}>{t.venue} · {t.dates}</div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:6}}>
                        <span>{t.teams} 모집</span>
                        <span className="badge badge--ok">접수중</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showSection('teams') && (
            <section>
              {showAll && <SectionHeader title="팀" count={8} onMore={()=>setTab('teams')}/>}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10}}>
                {results.teams.slice(0, showAll?4:8).map((t, i) => (
                  <div key={i} className="card" style={{padding:'14px 16px', cursor:'pointer', display:'grid', gridTemplateColumns:'44px 1fr', gap:12, alignItems:'center'}} onClick={()=>setRoute('teamDetail')}>
                    <Avatar tag={t.tag} color={t.color} ink={t.ink} size={44} radius={4}/>
                    <div>
                      <div style={{fontWeight:800, fontSize:14}} dangerouslySetInnerHTML={{__html: highlight(t.name, q)}}/>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.members}명 · {t.area}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showSection('courts') && (
            <section>
              {showAll && <SectionHeader title="코트" count={5} onMore={()=>setTab('courts')}/>}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:10}}>
                {results.courts.map((c, i) => (
                  <div key={i} className="card" style={{padding:'14px 16px', cursor:'pointer'}} onClick={()=>setRoute('courtDetail')}>
                    <div style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)'}}>{c.area}</div>
                    <div style={{fontWeight:800, fontSize:14, marginTop:2}} dangerouslySetInnerHTML={{__html: highlight(c.name, q)}}/>
                    <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:4}}>골대 {c.hoops} · {c.surface} · {c.fee}</div>
                    <div style={{fontSize:11, color:'var(--warn)', fontWeight:700, marginTop:2}}>★ {c.rating}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showSection('players') && (
            <section>
              {showAll && <SectionHeader title="선수" count={14} onMore={()=>setTab('players')}/>}
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10}}>
                {results.players.map((p, i) => (
                  <div key={i} className="card" style={{padding:'12px 14px', cursor:'pointer', display:'grid', gridTemplateColumns:'40px 1fr auto', gap:10, alignItems:'center'}} onClick={()=>setRoute('playerProfile')}>
                    <Avatar tag={p.name.slice(0,2).toUpperCase()} color="#0F5FCC" ink="#fff" size={40} radius={4}/>
                    <div>
                      <div style={{fontWeight:800, fontSize:13}} dangerouslySetInnerHTML={{__html: highlight(p.name, q)}}/>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{p.pos} · {p.lv} · ★{p.rating}</div>
                    </div>
                    <button className="btn btn--sm" onClick={(e)=>e.stopPropagation()}>팔로우</button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {showSection('posts') && (
            <section>
              {showAll && <SectionHeader title="게시글" count={6} onMore={()=>setTab('posts')}/>}
              <div className="card" style={{padding:0, overflow:'hidden'}}>
                {results.posts.map((p, i) => (
                  <div key={i} style={{padding:'14px 18px', borderTop: i>0?'1px solid var(--border)':'none', cursor:'pointer'}} onClick={()=>setRoute('post')}>
                    <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4}}>
                      <span className="badge badge--soft">{p.board}</span>
                      <span style={{fontSize:11, color:'var(--ink-dim)'}}>{p.author} · {p.when}</span>
                    </div>
                    <div style={{fontWeight:700, fontSize:14}} dangerouslySetInnerHTML={{__html: highlight(p.title, q)}}/>
                    <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}} dangerouslySetInnerHTML={{__html: highlight(p.excerpt, q)}}/>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, count, onMore }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
      <h2 style={{margin:0, fontSize:14, fontWeight:700, letterSpacing:'.04em', textTransform:'uppercase'}}>
        {title} <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginLeft:6}}>{count}</span>
      </h2>
      <a onClick={onMore} style={{fontSize:12, color:'var(--cafe-blue)', cursor:'pointer', fontWeight:600}}>모두 보기 →</a>
    </div>
  );
}

function highlight(text, q) {
  if (!q) return text;
  const safe = String(text).replace(/</g,'&lt;');
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return safe.replace(re, '<mark style="background:color-mix(in oklab, var(--accent) 30%, transparent); color:inherit; padding:0 2px; border-radius:2px;">$1</mark>');
}

window.SearchResults = SearchResults;
