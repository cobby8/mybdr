/* global React, TOURNAMENTS, TEAMS, BRACKET_R16, SCHEDULE, OPEN_RUNS, Icon, Poster, Avatar */

// ============================================================
// OpenRunPanel — 즉석 매칭. "지금/곧" 시작하는 코트.
// ============================================================
function OpenRunPanel({ setRoute }) {
  const [sort, setSort] = React.useState('soonest');   // soonest | distance | needs
  const [filter, setFilter] = React.useState('all');   // all | indoor | outdoor | live
  const [postOpen, setPostOpen] = React.useState(false);

  const fmtETA = (m) => m === 0 ? '진행중' : m < 60 ? `${m}분 후` : `${Math.floor(m/60)}시간 ${m%60}분 후`;

  let runs = OPEN_RUNS.slice();
  if (filter === 'indoor')  runs = runs.filter(r => r.indoor);
  if (filter === 'outdoor') runs = runs.filter(r => !r.indoor);
  if (filter === 'live')    runs = runs.filter(r => r.live || r.startsIn <= 15);
  if (sort === 'soonest')  runs.sort((a,b)=>a.startsIn-b.startsIn);
  if (sort === 'distance') runs.sort((a,b)=>a.distanceKm-b.distanceKm);
  if (sort === 'needs')    runs.sort((a,b)=>a.needs-b.needs);

  return (
    <div>
      {/* Hero strip — "지금 코트 가자" */}
      <div style={{
        background:'linear-gradient(95deg, var(--bdr-red) 0%, var(--bdr-red-ink) 65%, #2C0509 110%)',
        color:'#fff', borderRadius:'var(--radius-card)', padding:'22px 26px',
        display:'grid', gridTemplateColumns:'1fr auto', gap:18, alignItems:'center', marginBottom:18,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute', right:-30, top:-30, width:180, height:180, border:'2px solid rgba(255,255,255,.18)', borderRadius:'50%'}}/>
        <div style={{position:'absolute', right:10, top:10, width:120, height:120, border:'2px solid rgba(255,255,255,.12)', borderRadius:'50%'}}/>
        <div style={{position:'relative'}}>
          <div style={{fontSize:11, fontWeight:800, letterSpacing:'.16em', opacity:.85, marginBottom:6}}>OPEN RUN · 즉석 매칭</div>
          <h2 style={{margin:'0 0 6px', fontFamily:'var(--ff-display)', fontSize:30, fontWeight:900, letterSpacing:'-0.02em'}}>지금 코트 갑니다</h2>
          <p style={{margin:0, fontSize:13, opacity:.9}}>
            한 명이 부족해서 게임이 안 됩니까? 30분 안에 시작하는 코트만 모았습니다.
            현재 <b>{OPEN_RUNS.filter(r=>r.startsIn<=30).length}곳</b>에서 인원 모집중.
          </p>
        </div>
        <button className="btn" style={{background:'#fff', color:'var(--bdr-red-ink)', borderColor:'#fff', fontWeight:800, padding:'12px 20px'}} onClick={()=>setPostOpen(true)}>
          <Icon.plus/> 오픈런 띄우기
        </button>
      </div>

      {/* Filter / sort bar */}
      <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', marginBottom:14, justifyContent:'space-between'}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {[['all','전체'],['live','지금/임박'],['indoor','실내'],['outdoor','야외']].map(([k,l]) => (
            <button key={k} className="btn btn--sm" onClick={()=>setFilter(k)}
              style={filter===k?{background:'var(--ink)', color:'var(--bg)', borderColor:'var(--ink)'}:{}}>{l}</button>
          ))}
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center'}}>
          <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>정렬</span>
          {[['soonest','임박순'],['distance','거리순'],['needs','채우기쉬운순']].map(([k,l]) => (
            <button key={k} className="btn btn--sm" onClick={()=>setSort(k)}
              style={sort===k?{background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'}:{}}>{l}</button>
          ))}
        </div>
      </div>

      {/* Run cards */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14}}>
        {runs.map(r => {
          const urgent = r.live || r.startsIn <= 15;
          const fillPct = Math.round(r.on / (r.on + r.needs) * 100);
          return (
            <div key={r.id} className="card" style={{padding:0, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative', borderColor: urgent ? 'var(--accent)' : undefined}}>
              {/* ETA strip */}
              <div style={{
                display:'flex', alignItems:'center', justifyContent:'space-between',
                padding:'10px 14px',
                background: urgent ? 'var(--accent)' : 'var(--bg-alt)',
                color: urgent ? '#fff' : 'var(--ink-soft)',
                borderBottom: '1px solid var(--border)',
              }}>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  {urgent && <span style={{width:8, height:8, borderRadius:'50%', background:'#fff', boxShadow:'0 0 0 4px rgba(255,255,255,.3)', animation:'orPulse 1.4s ease-in-out infinite'}}/>}
                  <span style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18, letterSpacing:'-0.01em'}}>
                    {r.live ? 'LIVE · 진행중' : fmtETA(r.startsIn)}
                  </span>
                </div>
                <span style={{fontSize:11, fontFamily:'var(--ff-mono)', opacity: urgent?.9:.7}}>
                  {r.indoor ? '🏟 실내' : '☀ 야외'} · {r.duration}분
                </span>
              </div>

              <div style={{padding:'14px 16px', display:'flex', flexDirection:'column', gap:10, flex:1}}>
                <div>
                  <div style={{fontSize:12, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>{r.area} · {r.distanceKm}km</div>
                  <div style={{fontSize:16, fontWeight:700, marginTop:2, lineHeight:1.3}}>{r.court}</div>
                </div>

                <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                  <span className="badge badge--soft" style={{fontSize:10}}>{r.format}</span>
                  <span className="badge" style={{fontSize:10}}>{r.level}</span>
                  {r.vibes.map(v => <span key={v} className="badge badge--ghost" style={{fontSize:10}}>{v}</span>)}
                </div>

                {r.note && (
                  <div style={{fontSize:13, color:'var(--ink-soft)', background:'var(--bg-alt)', padding:'10px 12px', borderRadius:'var(--radius-chip)', borderLeft:'3px solid var(--cafe-blue)', lineHeight:1.5}}>
                    "{r.note}"
                    <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>— {r.host}</div>
                  </div>
                )}

                {/* Roster pips + need */}
                <div style={{marginTop:'auto'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
                    <div style={{display:'flex', gap:3, flex:1}}>
                      {Array.from({length: r.on + r.needs}).map((_, i) => (
                        <div key={i} style={{
                          flex:1, height:8, borderRadius:2,
                          background: i < r.on ? 'var(--ok)' : 'var(--bg-head)',
                          border: i < r.on ? 0 : '1px dashed var(--border-strong)',
                        }}/>
                      ))}
                    </div>
                    <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color: r.needs<=1?'var(--accent)':'var(--ink-soft)'}}>
                      {r.needs}명 더
                    </span>
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    <button className="btn btn--sm btn--primary" style={{flex:1}}
                      onClick={()=>setRoute('createGame')}>
                      합류하기 ({r.fee})
                    </button>
                    <button className="btn btn--sm" title="쪽지" onClick={()=>setRoute('messages')}><Icon.msg/></button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {runs.length === 0 && (
        <div className="card" style={{padding:'60px 20px', textAlign:'center', color:'var(--ink-mute)'}}>
          <div style={{fontSize:42, marginBottom:8}}>🏀</div>
          <div style={{fontWeight:700, color:'var(--ink)', marginBottom:4}}>지금 열린 오픈런이 없어요</div>
          <div style={{fontSize:13, marginBottom:14}}>제일 먼저 띄워서 사람을 모아보는 건 어떨까요?</div>
          <button className="btn btn--primary" onClick={()=>setPostOpen(true)}>+ 내가 띄우기</button>
        </div>
      )}

      {/* Quick post modal */}
      {postOpen && (
        <div style={{position:'fixed', inset:0, zIndex:300, background:'rgba(10,14,22,.55)', display:'grid', placeItems:'center', padding:20}} onClick={()=>setPostOpen(false)}>
          <div className="card" onClick={(e)=>e.stopPropagation()} style={{width:'100%', maxWidth:520, padding:0, overflow:'hidden'}}>
            <div style={{padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div className="eyebrow" style={{marginBottom:4}}>QUICK POST · 30초컷</div>
                <h3 style={{margin:0, fontSize:18, fontWeight:700}}>오픈런 띄우기</h3>
              </div>
              <button className="btn btn--sm" onClick={()=>setPostOpen(false)}>×</button>
            </div>
            <div style={{padding:'18px 22px', display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <label className="label">코트</label>
                <input className="input" placeholder="예: 용산국민체육센터" defaultValue=""/>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
                <div>
                  <label className="label">시작까지</label>
                  <select className="select">
                    <option>지금 (LIVE)</option>
                    <option>15분 후</option>
                    <option>30분 후</option>
                    <option>1시간 후</option>
                  </select>
                </div>
                <div>
                  <label className="label">필요 인원</label>
                  <select className="select">
                    <option>1명</option><option>2명</option><option>3명</option><option>4명</option>
                  </select>
                </div>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6}}>
                {['3v3', '5v5', '풀코트'].map(f => (
                  <button key={f} className="btn btn--sm">{f}</button>
                ))}
              </div>
              <div>
                <label className="label">한마디</label>
                <textarea className="textarea" style={{minHeight:80}} placeholder="예: 한 명만 더 오면 풀게임. 캐주얼한 분위기."/>
              </div>
            </div>
            <div style={{padding:'14px 22px', background:'var(--bg-alt)', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <span style={{fontSize:12, color:'var(--ink-dim)'}}>30km 반경 사용자에게 푸시 알림</span>
              <button className="btn btn--accent" onClick={()=>setPostOpen(false)}>띄우기</button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes orPulse {0%,100% {opacity:1;transform:scale(1);} 50% {opacity:.5;transform:scale(1.3);}}`}</style>
    </div>
  );
}

function MatchList({ setRoute }) {
  const statusLabel = {
    open: '접수중', closing: '마감임박', closed: '접수마감', live: '진행중', ended: '종료', preparing: '접수예정',
  };
  const statusBadge = {
    open: 'badge--ok', closing: 'badge--red', closed: 'badge--ghost', live: 'badge--red', ended: 'badge--ghost', preparing: 'badge--soft',
  };
  const [view, setView] = React.useState('tournaments'); // tournaments | openrun
  const [filter, setFilter] = React.useState('전체');
  const filters = ['전체','접수중','마감임박','진행중','접수예정','종료'];
  const shown = TOURNAMENTS.filter(t => {
    if (filter === '전체') return true;
    if (filter === '접수중') return t.status === 'open';
    if (filter === '마감임박') return t.status === 'closing';
    if (filter === '진행중') return t.status === 'live';
    if (filter === '접수예정') return t.status === 'preparing';
    if (filter === '종료') return t.status === 'ended';
    return true;
  });

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10}}>
        <div>
          <div className="eyebrow">{view==='tournaments' ? '대회 · TOURNAMENTS' : '오픈런 · OPEN RUN'}</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>
            {view==='tournaments' ? '열린 대회 · 예정 대회' : '지금 시작하는 코트'}
          </h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>
            {view==='tournaments'
              ? <>접수중 {TOURNAMENTS.filter(t=>t.status==='open').length} · 마감임박 {TOURNAMENTS.filter(t=>t.status==='closing').length} · 진행중 {TOURNAMENTS.filter(t=>t.status==='live').length} · 예정 {TOURNAMENTS.filter(t=>t.status==='preparing').length}</>
              : <>30분 안 시작 {OPEN_RUNS.filter(r=>r.startsIn<=30).length} · LIVE {OPEN_RUNS.filter(r=>r.live).length} · 한 명만 더 {OPEN_RUNS.filter(r=>r.needs===1).length}</>
            }
          </div>
        </div>
        {view==='tournaments' && <button className="btn btn--primary"><Icon.plus/> 대회 개설</button>}
      </div>

      {/* View toggle: 정식 대회 ↔ 오픈런 */}
      <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:18, gap:0}}>
        {[['tournaments','정식 대회', TOURNAMENTS.length],['openrun','오픈런 (즉석)', OPEN_RUNS.length]].map(([k,l,n]) => (
          <button key={k} onClick={()=>setView(k)} style={{
            padding:'12px 20px', background:'transparent', border:0,
            borderBottom: view===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
            color: view===k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: view===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
            display:'flex', alignItems:'center', gap:8,
          }}>
            {l}
            <span style={{
              fontFamily:'var(--ff-mono)', fontSize:11, padding:'1px 7px', borderRadius:10,
              background: view===k ? 'var(--cafe-blue)' : 'var(--bg-alt)',
              color: view===k ? '#fff' : 'var(--ink-dim)', fontWeight:700,
            }}>{n}</span>
            {k==='openrun' && OPEN_RUNS.some(r=>r.live) && (
              <span style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)', boxShadow:'0 0 0 3px rgba(227,27,35,.2)', animation:'orPulse 1.4s ease-in-out infinite'}}/>
            )}
          </button>
        ))}
      </div>

      {view === 'openrun' ? <OpenRunPanel setRoute={setRoute}/> : (<>

      <div style={{display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center'}}>
        <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em'}}>빠른 작업 ·</span>
        <button className="btn btn--sm" onClick={()=>setRoute('createGame')}>＋ 픽업 경기 만들기</button>
        <button className="btn btn--sm" onClick={()=>setRoute('tournamentEnroll')}>대회 접수</button>
        <button className="btn btn--sm" onClick={()=>setRoute('bracket')}>대진표 보기</button>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:16, flexWrap:'wrap'}}>
        {filters.map(s => (
          <button key={s} className="btn btn--sm" onClick={()=>setFilter(s)}
            style={filter === s ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{s}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14}}>
        {shown.map(t => (
          <div key={t.id} className="card" style={{padding:0, display:'grid', gridTemplateColumns:'140px 1fr', overflow:'hidden', cursor:'pointer'}} onClick={()=>setRoute('matchDetail')}>
            {t.poster ? (
              <Poster src={t.poster} title={t.title} edition={t.edition} accent={t.accent} width="100%" height={148} radius={0}/>
            ) : (
              <div style={{background:`linear-gradient(155deg, ${t.accent}, ${t.accent}CC 50%, #000 130%)`, color:'#fff', padding:14, display:'flex', flexDirection:'column', justifyContent:'space-between', minHeight:148, position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute', inset:0, opacity:.1, background:'repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 14px)'}}/>
                <div style={{fontSize:10, fontWeight:800, letterSpacing:'.12em', opacity:.85, position:'relative'}}>{t.level}</div>
                <div style={{position:'relative'}}>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, lineHeight:1, letterSpacing:'-0.01em'}}>{t.title.split(' ')[0]}</div>
                  <div style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:900, lineHeight:1, letterSpacing:'-0.01em'}}>{t.title.split(' ').slice(1).join(' ') || t.edition}</div>
                  <div style={{fontSize:10, opacity:.7, marginTop:4}}>{t.edition}</div>
                </div>
              </div>
            )}
            <div style={{padding:16, display:'flex', flexDirection:'column', gap:8}}>
              <div style={{display:'flex', gap:6, alignItems:'center'}}>
                <span className={`badge ${statusBadge[t.status]}`}>{statusLabel[t.status]}</span>
                {t.tags.slice(1,3).map(tag => <span key={tag} className="badge badge--ghost" style={{fontSize:10}}>{tag}</span>)}
              </div>
              <div style={{fontWeight:700, fontSize:16, letterSpacing:'-0.01em'}}>{t.subtitle}</div>
              <div style={{fontSize:13, color:'var(--ink-mute)', display:'grid', gridTemplateColumns:'auto 1fr', columnGap:10, rowGap:4}}>
                <span>📅</span><span>{t.dates}</span>
                <span>📍</span><span>{t.court}</span>
                <span>💰</span><span>{t.prize} · 참가비 {t.fee}</span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:10, marginTop:'auto'}}>
                <div style={{flex:1, height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width:`${(t.applied/t.capacity)*100}%`, height:'100%', background: t.status === 'closing' ? 'var(--accent)' : 'var(--cafe-blue)'}}/>
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{t.applied}/{t.capacity}</div>
                <button className="btn btn--sm btn--primary" onClick={(e)=>{e.stopPropagation(); setRoute('matchDetail');}}>
                  {t.status === 'open' || t.status === 'closing' ? '신청' : t.status === 'live' ? '라이브' : '상세'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      </>)}
    </div>
  );
}

function MatchDetail({ setRoute }) {
  const t = TOURNAMENTS[0];
  const [tab, setTab] = React.useState('overview');
  const appliedTeams = ['redeem','monkeys','3point','kings','zone','pivot','iron','heat'].map(id => TEAMS.find(x=>x.id===id)).filter(Boolean);

  return (
    <div className="page page--wide">
      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:10, whiteSpace:'nowrap', flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{t.title}</span>
      </div>

      <div style={{background:`linear-gradient(135deg, ${t.accent}, ${t.accent}AA 50%, #0B0D10)`, color:'#fff', padding:'36px 32px', borderRadius:'var(--radius-card)', position:'relative', overflow:'hidden', marginBottom:20, display:'grid', gridTemplateColumns: t.poster ? '200px 1fr' : '1fr', gap:28, alignItems:'center'}}>
        {t.poster && <Poster src={t.poster} title={t.title} edition={t.edition} accent={t.accent} width={200} height={280} radius={8}/>}
        <div>
          <div style={{fontSize:11, letterSpacing:'.12em', fontWeight:800, opacity:.85, marginBottom:10}}>{t.level} · {t.edition}</div>
          <h1 className="t-display" style={{margin:'0 0 8px', fontSize:48, letterSpacing:'-0.02em'}}>{t.title}</h1>
          <div style={{fontSize:16, opacity:.9, marginBottom:18}}>{t.subtitle}</div>
          <div style={{display:'flex', gap:18, fontSize:13, opacity:.9, flexWrap:'wrap'}}>
            <span>📅 {t.dates}</span>
            <span>📍 {t.court}</span>
            <span>💰 상금 {t.prize}</span>
            <span>👥 {t.format}</span>
          </div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20, flexWrap:'wrap'}}>
            {[['overview','대회소개'],['schedule','경기일정'],['bracket','대진표'],['teams','참가팀'],['rules','규정']].map(([k,l]) => (
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:'12px 18px', background:'transparent', border:0,
                borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
                color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
                fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
              }}>{l}</button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="card" style={{padding:'24px 26px'}}>
              <h2 style={{margin:'0 0 12px', fontSize:20, fontWeight:700}}>대회 개요</h2>
              <p style={{color:'var(--ink-soft)', margin:'0 0 16px', lineHeight:1.7}}>
                3x3 농구의 정수를 겨루는 오픈 챔피언십. 더블 엘리미네이션 방식으로 16강부터 결승까지 이틀간 진행됩니다.
                OPEN 레벨이므로 참가 자격 제한 없이, 팀 단위로 등록한 누구나 참가 가능합니다.
              </p>
              <div style={{display:'grid', gridTemplateColumns:'140px 1fr', rowGap:10, columnGap:16, fontSize:14, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)'}}>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>주최</div><div>{t.host}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>문의</div><div>{t.hostContact}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>경기장</div><div>{t.court} — {t.address}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>접수 기간</div><div>{t.period}</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>참가 방식</div><div>{t.format} · 참가비 {t.fee} ({t.feePerTeam ? '팀당' : '인당'})</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>정원</div><div>{t.capacity}팀 (현재 {t.applied}팀 접수)</div>
                <div style={{color:'var(--ink-dim)', fontSize:12}}>우승상금</div><div style={{color:'var(--accent)', fontWeight:700}}>{t.prize}</div>
              </div>
            </div>
          )}

          {tab === 'schedule' && (
            <div style={{display:'flex', flexDirection:'column', gap:16}}>
              {SCHEDULE.map((day, di) => (
                <div key={di} className="card" style={{padding:0, overflow:'hidden'}}>
                  <div style={{padding:'12px 18px', borderBottom:'1px solid var(--border)', background:'var(--bg-alt)', fontWeight:700}}>{day.date}</div>
                  {day.rows.map((r, ri) => {
                    const ta = r.teams[0] ? TEAMS.find(x=>x.id===r.teams[0]) : null;
                    const tb = r.teams[1] ? TEAMS.find(x=>x.id===r.teams[1]) : null;
                    return (
                      <div key={ri} style={{display:'grid', gridTemplateColumns:'80px 60px 1fr auto', gap:14, padding:'12px 18px', borderBottom: ri < day.rows.length-1 ? '1px solid var(--border)' : 0, alignItems:'center'}}>
                        <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.time}</div>
                        <div><span className="badge badge--ghost">코트 {r.court}</span></div>
                        <div style={{display:'flex', alignItems:'center', gap:10}}>
                          <span style={{fontSize:12, color:'var(--ink-dim)', marginRight:6, minWidth:72}}>{r.label}</span>
                          {ta && tb ? (
                            <>
                              <span style={{fontWeight:700}}>{ta.name}</span>
                              <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>vs</span>
                              <span style={{fontWeight:700}}>{tb.name}</span>
                            </>
                          ) : (
                            <span style={{color:'var(--ink-dim)', fontSize:13}}>이전 경기 승자</span>
                          )}
                        </div>
                        <button className="btn btn--sm">상세</button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {tab === 'bracket' && (
            <div className="card" style={{padding:'22px 24px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>16강 대진표</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 60px 1fr', gap:14, alignItems:'center'}}>
                {BRACKET_R16.map((m, i) => {
                  const a = TEAMS.find(x=>x.id===m.a);
                  const b = TEAMS.find(x=>x.id===m.b);
                  return (
                    <React.Fragment key={i}>
                      <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                        <span style={{width:24, height:24, background:a.color, color:a.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{a.tag}</span>
                        <span style={{fontWeight:700, flex:1}}>{a.name}</span>
                      </div>
                      <div style={{textAlign:'center', fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)'}}>
                        <div>VS</div>
                        <div style={{fontSize:10, marginTop:2}}>{m.time}</div>
                      </div>
                      <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                        <span style={{width:24, height:24, background:b.color, color:b.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{b.tag}</span>
                        <span style={{fontWeight:700, flex:1}}>{b.name}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'teams' && (
            <div className="board data-table">
              <div className="board__head data-table__head" style={{gridTemplateColumns:'56px 1fr 90px 100px 80px'}}>
                <div>#</div><div>팀</div><div>레이팅</div><div>전적</div><div>상태</div>
              </div>
              {appliedTeams.map((tm, i) => (
                <div key={tm.id} className="board__row data-table__row" style={{gridTemplateColumns:'56px 1fr 90px 100px 80px'}}>
                  <div data-label="#" className="num" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14}}>{i+1}</div>
                  <div data-primary="true" className="title">
                    <span style={{width:22, height:22, background:tm.color, color:tm.ink, display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, borderRadius:3}}>{tm.tag}</span>
                    <span style={{fontWeight:600}}>{tm.name}</span>
                  </div>
                  <div data-label="레이팅" style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{tm.rating}</div>
                  <div data-label="전적" style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{tm.wins}W {tm.losses}L</div>
                  <div data-label="상태"><span className="badge badge--ok">확정</span></div>
                </div>
              ))}
            </div>
          )}

          {tab === 'rules' && (
            <div className="card" style={{padding:'22px 26px'}}>
              <h2 style={{margin:'0 0 12px', fontSize:18, fontWeight:700}}>경기 규정</h2>
              <ul style={{margin:0, paddingLeft:20, color:'var(--ink-soft)', lineHeight:1.8}}>
                <li>FIBA 3x3 공식 규정을 따릅니다.</li>
                <li>정규 시간은 10분이며, 21점 선취 시 경기 종료.</li>
                <li>동점 시 2분 연장, 2점 선취 시 종료.</li>
                <li>선수 등록은 최대 4명 (교체 1명 포함).</li>
                <li>팀 소속 증빙은 접수 마감 3일 전까지 필수.</li>
                <li>무단 불참 시 다음 대회 참가 제한 (1회).</li>
              </ul>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:0, overflow:'hidden'}}>
            <div style={{padding:'18px 20px 14px', borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--accent)', textTransform:'uppercase', marginBottom:6}}>접수중</div>
              <div style={{display:'flex', alignItems:'baseline', gap:6, marginBottom:4}}>
                <span style={{fontFamily:'var(--ff-display)', fontSize:44, fontWeight:900, letterSpacing:'-0.02em', color:'var(--accent)', lineHeight:1}}>D-14</span>
                <span style={{color:'var(--ink-mute)', fontSize:12}}>마감까지</span>
              </div>
              <div style={{fontSize:13, color:'var(--ink-mute)'}}>{t.period}</div>
            </div>
            <div style={{padding:'16px 20px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em'}}>참가비 (팀)</div>
                <div style={{fontWeight:800, fontSize:18, marginTop:2}}>{t.fee}</div>
              </div>
              <div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.04em'}}>상금</div>
                <div style={{fontWeight:800, fontSize:18, marginTop:2, color:'var(--accent)'}}>{t.prize}</div>
              </div>
              <div style={{gridColumn:'1 / -1'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6}}>
                  <span style={{color:'var(--ink-dim)'}}>접수 현황</span>
                  <span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{t.applied}/{t.capacity}팀</span>
                </div>
                <div style={{height:8, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
                  <div style={{width:`${(t.applied/t.capacity)*100}%`, height:'100%', background:'var(--cafe-blue)'}}/>
                </div>
              </div>
            </div>
            <div style={{padding:'0 20px 20px'}}>
              <button className="btn btn--primary btn--xl">팀으로 신청하기</button>
              <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center', marginTop:8}}>로그인된 팀: <b style={{color:'var(--ink)'}}>리딤 (RDM)</b></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.MatchList = MatchList;
window.MatchDetail = MatchDetail;
