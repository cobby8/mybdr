/* global React, TEAMS */

function SeriesDetail({ setRoute }) {
  const [tab, setTab] = React.useState('editions');

  const series = {
    name:'BDR CHALLENGE', tagline:'서울 3x3 오픈 챔피언십', host:'BDR 리그 사무국',
    accent:'#E31B23', founded:2023, editionsTotal:8, format:'3v3 더블 엘리미네이션',
    sponsorTier:'OFFICIAL',
  };

  const editions = [
    { num:8, name:'SPRING 2026', date:'2026.04.11', status:'open', winner:null, mvp:null, applied:12, capacity:16 },
    { num:7, name:'WINTER 2025', date:'2025.12.20', status:'ended', winner:'monkeys',  mvp:'김도현', applied:16, capacity:16 },
    { num:6, name:'AUTUMN 2025', date:'2025.10.18', status:'ended', winner:'kings',    mvp:'박정훈', applied:16, capacity:16 },
    { num:5, name:'SUMMER 2025', date:'2025.07.05', status:'ended', winner:'redeem',   mvp:'이수빈', applied:16, capacity:16 },
    { num:4, name:'SPRING 2025', date:'2025.04.13', status:'ended', winner:'zone',     mvp:'정민서', applied:14, capacity:16 },
    { num:3, name:'WINTER 2024', date:'2024.12.21', status:'ended', winner:'monkeys',  mvp:'김도현', applied:12, capacity:12 },
    { num:2, name:'AUTUMN 2024', date:'2024.10.12', status:'ended', winner:'3point',   mvp:'장혁민', applied:12, capacity:12 },
    { num:1, name:'INAUGURAL ',  date:'2023.11.04', status:'ended', winner:'kings',    mvp:'박정훈', applied:8,  capacity:8  },
  ];

  // honors
  const titles = {};
  editions.filter(e=>e.winner).forEach(e => { titles[e.winner] = (titles[e.winner]||0)+1; });
  const honors = Object.entries(titles).map(([id,c]) => ({ team: TEAMS.find(t=>t.id===id), count:c }))
    .sort((a,b)=>b.count-a.count);

  return (
    <div className="page page--wide">
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a> ›{' '}
        <a onClick={()=>setRoute('series')} style={{cursor:'pointer'}}>시리즈</a> ›{' '}
        <span style={{color:'var(--ink)'}}>{series.name}</span>
      </div>

      {/* hero */}
      <div style={{background:`linear-gradient(135deg, ${series.accent}, ${series.accent}AA 50%, #0B0D10)`, color:'#fff', padding:'40px 36px', borderRadius:'var(--radius-card)', marginBottom:22, position:'relative', overflow:'hidden'}}>
        <div style={{position:'absolute', inset:0, opacity:.08, background:'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 18px)'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11, letterSpacing:'.14em', fontWeight:800, opacity:.85, marginBottom:12}}>SERIES · {series.host}</div>
          <h1 className="t-display" style={{margin:'0 0 6px', fontSize:56, letterSpacing:'-0.02em'}}>{series.name}</h1>
          <div style={{fontSize:17, opacity:.9, marginBottom:18}}>{series.tagline}</div>
          <div style={{display:'flex', gap:24, fontSize:13, opacity:.9, flexWrap:'wrap'}}>
            <span><b style={{fontFamily:'var(--ff-mono)'}}>{series.editionsTotal}</b>회 진행</span>
            <span>·</span>
            <span>{series.format}</span>
            <span>·</span>
            <span>설립 {series.founded}</span>
            <span style={{padding:'3px 8px', background:'rgba(255,255,255,.18)', borderRadius:3, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, letterSpacing:'.08em'}}>{series.sponsorTier}</span>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:24, alignItems:'flex-start'}}>
        <div>
          <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20, flexWrap:'wrap'}}>
            {[['editions','회차 계보'],['honors','명예의 전당'],['stats','통계'],['about','소개']].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:'12px 18px', background:'transparent', border:0,
                borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
                color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
                fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
              }}>{l}</button>
            ))}
          </div>

          {tab === 'editions' && (
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {editions.map((e, i) => {
                const w = e.winner ? TEAMS.find(t=>t.id===e.winner) : null;
                return (
                  <div key={e.num} onClick={()=>setRoute('matchDetail')} style={{
                    display:'grid', gridTemplateColumns:'52px 90px 1fr 1fr 80px', gap:14, alignItems:'center',
                    padding:'14px 18px',
                    borderBottom: i<editions.length-1 ? '1px solid var(--border)' : 0,
                    cursor:'pointer', background: e.status==='open'?'var(--cafe-blue-soft)':'transparent'
                  }}>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, color:'var(--ink-mute)'}}>#{e.num}</div>
                    <div style={{fontSize:12, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>{e.date}</div>
                    <div>
                      <div style={{fontWeight:700, fontSize:15}}>{e.name}</div>
                      <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{e.applied}/{e.capacity}팀 참가</div>
                    </div>
                    <div>
                      {w ? (
                        <div style={{display:'flex', alignItems:'center', gap:8}}>
                          <span style={{width:22, height:22, background:w.color, color:w.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{w.tag}</span>
                          <div>
                            <div style={{fontSize:13, fontWeight:700}}>🏆 {w.name}</div>
                            <div style={{fontSize:11, color:'var(--ink-mute)'}}>MVP · {e.mvp}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="badge badge--ok">접수중</span>
                      )}
                    </div>
                    <div style={{textAlign:'right'}}>
                      <button className="btn btn--sm">{e.status==='open'?'참가':'기록'}</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'honors' && (
            <div className="card" style={{padding:'24px 26px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>🏆 다수 우승팀</h2>
              <div style={{display:'grid', gap:10}}>
                {honors.map((h, i) => (
                  <div key={h.team.id} style={{display:'grid', gridTemplateColumns:'40px 36px 1fr 80px', gap:14, alignItems:'center', padding:'12px 16px', background:'var(--bg-alt)', borderRadius:6}}>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22, color: i===0?'var(--accent)':'var(--ink-mute)'}}>{i+1}</div>
                    <div style={{width:32, height:32, background:h.team.color, color:h.team.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:11, borderRadius:4}}>{h.team.tag}</div>
                    <div style={{fontWeight:700}}>{h.team.name}</div>
                    <div style={{textAlign:'right', fontFamily:'var(--ff-mono)'}}><b style={{fontSize:18, color:'var(--accent)'}}>{h.count}</b> <span style={{fontSize:11, color:'var(--ink-mute)'}}>회</span></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'stats' && (
            <div style={{display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:14}}>
              {[
                { lbl:'누적 참가팀',  v:'104팀',  sub:'8회 평균 13팀' },
                { lbl:'누적 경기 수', v:'312경기', sub:'개최당 39경기' },
                { lbl:'평균 득점',    v:'18.4점', sub:'경기당 양 팀 합계' },
                { lbl:'평균 진행 시간', v:'14분',  sub:'정규시간 + 연장' },
              ].map((s,i)=>(
                <div key={i} className="card" style={{padding:'18px 20px'}}>
                  <div style={{fontSize:11, color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700, marginBottom:6}}>{s.lbl}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:32, lineHeight:1, marginBottom:6}}>{s.v}</div>
                  <div style={{fontSize:12, color:'var(--ink-mute)'}}>{s.sub}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'about' && (
            <div className="card" style={{padding:'24px 26px'}}>
              <h2 style={{margin:'0 0 12px', fontSize:18, fontWeight:700}}>{series.name} 소개</h2>
              <p style={{color:'var(--ink-soft)', lineHeight:1.75, margin:'0 0 14px'}}>
                BDR 리그 사무국이 분기마다 개최하는 서울 3x3 오픈 챔피언십. 2023년 첫 대회 이후 현재까지 8회 진행되었으며,
                참가 자격 제한 없이 누구나 팀 단위로 등록 가능합니다.
              </p>
              <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:10, columnGap:16, fontSize:14, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6}}>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>주최</div><div>{series.host}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>설립</div><div>{series.founded}년</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>경기 방식</div><div>{series.format}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>개최 빈도</div><div>분기 1회 (3·6·9·12월)</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>대상</div><div>참가 자격 제한 없음</div>
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:'18px 20px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10}}>다음 회차</div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, marginBottom:4}}>SPRING 2026</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:14}}>2026.04.11 — 장충체육관</div>
            <div style={{display:'flex', alignItems:'baseline', gap:6, marginBottom:14}}>
              <span style={{fontFamily:'var(--ff-display)', fontSize:36, fontWeight:900, color:'var(--accent)', lineHeight:1}}>D-14</span>
              <span style={{fontSize:12, color:'var(--ink-mute)'}}>접수 마감</span>
            </div>
            <button className="btn btn--primary btn--xl" onClick={()=>setRoute('matchDetail')}>참가 신청</button>
            <button className="btn" style={{width:'100%', marginTop:8}} onClick={()=>setRoute('matchDetail')}>회차 상세</button>
          </div>

          <div className="card" style={{padding:'18px 20px', marginTop:14}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase', marginBottom:10}}>알림 받기</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:12}}>새 회차가 열리면 알려드릴게요</div>
            <button className="btn" style={{width:'100%'}}>★ 시리즈 팔로우</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.SeriesDetail = SeriesDetail;
