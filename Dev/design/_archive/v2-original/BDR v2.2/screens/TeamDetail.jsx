/* global React, TEAMS, PLAYERS, Icon, Avatar */

// ============================================================
// ChalkTalk — 작전판. 코트 다이어그램 + 플레이 카드 + 작전 노트.
// 주장/매니저 영역 시뮬레이션 (실제 권한 체크는 데모 생략)
// ============================================================
function ChalkTalk({ team, roster }) {
  const PLAYS = [
    { id:'p1', name:'호크 액션', tag:'OFFENSE', use:'1차공격', desc:'4번이 헤드 픽 → 7번 페이드 → 11번 백도어 컷.', star:true,
      pos:[
        {n:4, x:50, y:78, role:'볼핸들러', color:team.color},
        {n:7, x:18, y:60, role:'섯터', color:team.color},
        {n:11, x:82, y:60, role:'커터', color:team.color},
        {n:14, x:30, y:30, role:'스크리너', color:team.color},
        {n:23, x:70, y:30, role:'롤러', color:team.color},
      ],
      arrows:[
        {from:[50,78], to:[42,52], dash:true},   // 4 dribble
        {from:[18,60], to:[18,30]},               // 7 fade
        {from:[82,60], to:[60,18], dash:true},    // 11 back-cut
        {from:[30,30], to:[55,30]},               // 14 screen
      ],
    },
    { id:'p2', name:'엘보 픽앤팝', tag:'OFFENSE', use:'세트 플레이', desc:'엘보에서 23번 스크린 → 4번 미드레인지.',
      pos:[
        {n:4, x:50, y:75, role:'핸들러', color:team.color},
        {n:23, x:62, y:42, role:'스크리너', color:team.color},
        {n:11, x:88, y:60, role:'코너', color:team.color},
        {n:7,  x:12, y:60, role:'코너', color:team.color},
        {n:14, x:30, y:30, role:'페인트', color:team.color},
      ],
      arrows:[
        {from:[50,75], to:[58,48], dash:true},
        {from:[62,42], to:[40,60]},
      ],
    },
    { id:'p3', name:'2-1-2 존', tag:'DEFENSE', use:'수비 셋업', desc:'외곽 압박 + 페인트 헬프. 픽 시 스위치.',
      pos:[
        {n:4, x:30, y:55, role:'외곽', color:'#475569'},
        {n:7, x:70, y:55, role:'외곽', color:'#475569'},
        {n:11, x:50, y:35, role:'프리 스로우', color:'#475569'},
        {n:14, x:25, y:18, role:'페인트', color:'#475569'},
        {n:23, x:75, y:18, role:'페인트', color:'#475569'},
      ],
      arrows:[],
    },
    { id:'p4', name:'아이솔레이션', tag:'OFFENSE', use:'클러치', desc:'4번 1대1, 나머지 위크사이드 클리어아웃.',
      pos:[
        {n:4, x:78, y:55, role:'1대1', color:team.color},
        {n:7, x:18, y:75, role:'코너', color:team.color},
        {n:11, x:18, y:35, role:'윙', color:team.color},
        {n:14, x:30, y:18, role:'페인트', color:team.color},
        {n:23, x:50, y:25, role:'위크사이드', color:team.color},
      ],
      arrows:[
        {from:[78,55], to:[60,30], dash:true},
      ],
    },
  ];

  const NOTES = [
    {when:'어제', who:'박성진', text:'다음 경기 호크 액션 첫 세트로. 7번이 페이드 타이밍 좀 늦어요.'},
    {when:'2일 전', who:'정승우', text:'2-1-2 존, 외곽 슈터 강한 팀에는 매치업으로 바로 변경.'},
    {when:'3일 전', who:'박성진', text:'엘보 픽앤팝 영상 폴더 공유. 모임 전 1번씩 보고 오기.'},
  ];

  const [active, setActive] = React.useState(PLAYS[0].id);
  const [side, setSide] = React.useState('all'); // all | offense | defense
  const play = PLAYS.find(p => p.id === active);
  const filtered = PLAYS.filter(p => side==='all' || (side==='offense' && p.tag==='OFFENSE') || (side==='defense' && p.tag==='DEFENSE'));

  return (
    <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 280px', gap:16, alignItems:'flex-start'}}>
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, flexWrap:'wrap'}}>
          <div>
            <div className="eyebrow" style={{marginBottom:4}}>CHALK TALK · 작전판</div>
            <div style={{fontSize:18, fontWeight:700}}>{play.name} <span className="badge" style={{marginLeft:6, fontSize:10, background: play.tag==='OFFENSE'?'var(--accent)':'var(--ink-soft)', color:'#fff', borderColor:'transparent'}}>{play.tag}</span></div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{play.use} · {play.desc}</div>
          </div>
          <div style={{display:'flex', gap:6}}>
            <button className="btn btn--sm">📹 영상</button>
            <button className="btn btn--sm">📤 팀에 공유</button>
            <button className="btn btn--sm btn--primary"><Icon.plus/> 새 작전</button>
          </div>
        </div>

        {/* Court diagram (half-court SVG) */}
        <div style={{position:'relative', background:'#D9A574', padding:'18px 24px 24px'}}>
          <svg viewBox="0 0 100 100" style={{width:'100%', height:'auto', display:'block', maxHeight:420}}>
            {/* Court markings (half-court, basket at top) */}
            <defs>
              <pattern id="wood" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(90)">
                <rect width="6" height="6" fill="#D9A574"/>
                <line x1="0" y1="0" x2="0" y2="6" stroke="#C39158" strokeWidth=".4"/>
              </pattern>
            </defs>
            <rect x="0" y="0" width="100" height="100" fill="url(#wood)"/>
            {/* baseline + sidelines */}
            <rect x="2" y="2" width="96" height="96" fill="none" stroke="#fff" strokeWidth=".6"/>
            {/* paint */}
            <rect x="36" y="2" width="28" height="32" fill="rgba(255,255,255,.18)" stroke="#fff" strokeWidth=".5"/>
            {/* free throw line + circle */}
            <line x1="36" y1="34" x2="64" y2="34" stroke="#fff" strokeWidth=".5"/>
            <circle cx="50" cy="34" r="8" fill="none" stroke="#fff" strokeWidth=".5" strokeDasharray="2 1.4"/>
            {/* basket / hoop */}
            <line x1="44" y1="6" x2="56" y2="6" stroke="#fff" strokeWidth=".7"/>
            <circle cx="50" cy="9" r="2.2" fill="none" stroke="#E31B23" strokeWidth=".7"/>
            {/* restricted arc */}
            <path d="M44 9 A6 6 0 0 0 56 9" fill="none" stroke="#fff" strokeWidth=".4"/>
            {/* 3pt arc */}
            <path d="M14 2 L14 18 A36 36 0 0 0 86 18 L86 2" fill="none" stroke="#fff" strokeWidth=".5"/>
            {/* center half-circle */}
            <path d="M40 98 A10 10 0 0 1 60 98" fill="none" stroke="#fff" strokeWidth=".5"/>

            {/* arrows */}
            {play.arrows.map((a, i) => (
              <g key={i}>
                <line x1={a.from[0]} y1={a.from[1]} x2={a.to[0]} y2={a.to[1]}
                  stroke="#0B1220" strokeWidth="1.1"
                  strokeDasharray={a.dash ? '2 1.5' : 'none'}
                  markerEnd="url(#arrowhead)"
                />
              </g>
            ))}
            <defs>
              <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="4" refY="3" orient="auto">
                <path d="M0,0 L0,6 L5,3 z" fill="#0B1220"/>
              </marker>
            </defs>

            {/* players */}
            {play.pos.map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="4" fill={p.color} stroke="#fff" strokeWidth=".7"/>
                <text x={p.x} y={p.y+1.4} textAnchor="middle" fontFamily="var(--ff-mono)" fontWeight="800" fontSize="3.6" fill={team.ink || '#fff'}>{p.n}</text>
              </g>
            ))}
          </svg>

          {/* Legend */}
          <div style={{position:'absolute', bottom:8, left:24, right:24, display:'flex', gap:14, justifyContent:'center', fontSize:11, color:'#0B1220', flexWrap:'wrap', background:'rgba(255,255,255,.85)', padding:'4px 10px', borderRadius:4}}>
            <span>━ 패스/스크린</span>
            <span style={{borderTop:'1px dashed #0B1220', paddingTop:1}}>┄ 드리블/컷</span>
            <span>● 선수 (등번호)</span>
          </div>
        </div>

        {/* Position legend */}
        <div style={{padding:'12px 18px', background:'var(--bg-alt)', borderTop:'1px solid var(--border)', display:'flex', gap:18, flexWrap:'wrap', fontSize:12}}>
          {play.pos.map((p, i) => {
            const pl = roster.find(r=>r.num===p.n);
            return (
              <div key={i} style={{display:'flex', alignItems:'center', gap:6}}>
                <span style={{width:18, height:18, background:p.color, color:'#fff', borderRadius:'50%', display:'grid', placeItems:'center', fontSize:9, fontWeight:800, fontFamily:'var(--ff-mono)'}}>{p.n}</span>
                <span style={{fontWeight:600}}>{pl?.name}</span>
                <span style={{color:'var(--ink-dim)'}}>· {p.role}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side: play list + notes */}
      <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:120}}>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
            <div style={{fontSize:13, fontWeight:700}}>플레이북</div>
            <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{filtered.length}/{PLAYS.length}</span>
          </div>
          <div style={{display:'flex', gap:0, padding:'0', borderBottom:'1px solid var(--border)'}}>
            {[['all','전체'],['offense','공격'],['defense','수비']].map(([k,l]) => (
              <button key={k} onClick={()=>setSide(k)} style={{
                flex:1, padding:'8px', background: side===k?'var(--bg-alt)':'transparent', border:0,
                fontSize:12, fontWeight: side===k?700:500, color: side===k?'var(--ink)':'var(--ink-mute)',
                cursor:'pointer', borderBottom: side===k?'2px solid var(--cafe-blue)':'2px solid transparent',
              }}>{l}</button>
            ))}
          </div>
          <div>
            {filtered.map(p => (
              <button key={p.id} onClick={()=>setActive(p.id)} style={{
                width:'100%', textAlign:'left', padding:'11px 14px',
                background: active===p.id ? 'var(--cafe-blue-soft)' : 'transparent',
                border:0, borderBottom:'1px solid var(--border)', cursor:'pointer',
                display:'flex', alignItems:'center', gap:10,
              }}>
                <span style={{
                  width:6, height:32, background: p.tag==='OFFENSE'?'var(--accent)':'var(--ink-soft)',
                  borderRadius:3, flexShrink:0,
                }}/>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:700, color: active===p.id?'var(--cafe-blue-deep)':'var(--ink)', display:'flex', alignItems:'center', gap:4}}>
                    {p.name} {p.star && <span style={{color:'var(--warn)', fontSize:11}}>★</span>}
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:1}}>{p.use}</div>
                </div>
              </button>
            ))}
          </div>
          <button className="btn btn--sm" style={{margin:10, width:'calc(100% - 20px)'}}><Icon.plus/> 새 플레이 추가</button>
        </div>

        <div className="card" style={{padding:'14px 16px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
            <div style={{fontSize:13, fontWeight:700}}>코치 노트</div>
            <button className="btn btn--sm">+ 추가</button>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {NOTES.map((n, i) => (
              <div key={i} style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)', borderLeft:'3px solid var(--cafe-blue)'}}>
                <div style={{fontSize:11, color:'var(--ink-dim)', marginBottom:3, display:'flex', justifyContent:'space-between'}}>
                  <span style={{fontWeight:700, color:'var(--ink-soft)'}}>{n.who}</span>
                  <span>{n.when}</span>
                </div>
                <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.5}}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function TeamDetail({ setRoute, teamId }) {
  const t = TEAMS.find(x => x.id === teamId) || TEAMS[0];
  const [tab, setTab] = React.useState('overview');
  const winRate = Math.round(t.wins / (t.wins + t.losses) * 100);

  const roster = [
    { num: 4,  name: '박성진', pos: 'PG', role: '주장', ppg: 16.8 },
    { num: 7,  name: '정승우', pos: 'SG', role: '부주장', ppg: 11.4 },
    { num: 11, name: '김태윤', pos: 'SF', role: '선수', ppg: 9.6 },
    { num: 14, name: '송진수', pos: 'PF', role: '선수', ppg: 8.2 },
    { num: 23, name: '임재현', pos: 'C',  role: '선수', ppg: 12.5 },
    { num: 32, name: '오민호', pos: 'SG', role: '선수', ppg: 7.1 },
  ];

  const recent = [
    { date: '04.12', opp: '몽키즈',       score: '21 : 18', result: 'W', tournament: 'BDR CHALLENGE' },
    { date: '03.28', opp: 'KINGS CREW',   score: '17 : 19', result: 'L', tournament: 'KINGS CUP' },
    { date: '03.15', opp: '3POINT',       score: '22 : 14', result: 'W', tournament: '정규 리그' },
    { date: '03.02', opp: 'THE ZONE',     score: '20 : 16', result: 'W', tournament: '정규 리그' },
    { date: '02.18', opp: 'SEOUL HEAT',   score: '15 : 21', result: 'L', tournament: '스크림' },
  ];

  return (
    <div className="page page--wide">
      <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:14, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('team')} style={{cursor:'pointer'}}>팀</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{t.name}</span>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}CC 60%, #0B0D10 140%)`,
        color: t.ink, borderRadius:'var(--radius-card)', padding:'36px 32px', marginBottom:20,
        position:'relative', overflow:'hidden',
      }}>
        <div style={{position:'absolute', right:-20, top:-20, fontFamily:'var(--ff-display)', fontWeight:900, fontSize:220, letterSpacing:'-0.04em', opacity:.12, lineHeight:.8}}>{t.tag}</div>
        <div style={{position:'relative', display:'grid', gridTemplateColumns:'auto 1fr auto', gap:24, alignItems:'flex-end'}}>
          <Avatar src={t.logo} tag={t.tag} name={t.name} color="rgba(255,255,255,.2)" ink={t.ink} size={96} radius={12}/>
          <div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:12, fontWeight:800, letterSpacing:'.14em', opacity:.9, marginBottom:10}}>TEAM · {t.tag} · 창단 {t.founded}</div>
            <h1 className="t-display" style={{margin:0, fontSize:52, lineHeight:1, letterSpacing:'-0.02em'}}>{t.name}</h1>
            <div style={{display:'flex', gap:22, marginTop:18, fontSize:14, flexWrap:'wrap'}}>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.rating}</b> <span style={{opacity:.75, marginLeft:4}}>레이팅</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.wins}</b> <span style={{opacity:.75, marginLeft:4}}>승</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{t.losses}</b> <span style={{opacity:.75, marginLeft:4}}>패</span></div>
              <div><b style={{fontSize:22, fontFamily:'var(--ff-display)'}}>{winRate}%</b> <span style={{opacity:.75, marginLeft:4}}>승률</span></div>
            </div>
          </div>
          <div style={{display:'flex', gap:8}}>
            <button className="btn" style={{background:'rgba(255,255,255,.16)', color:t.ink, borderColor:'rgba(255,255,255,.35)'}} onClick={()=>setRoute('invite')}>↗ 초대 링크</button>
            <button className="btn" style={{background:'rgba(255,255,255,.16)', color:t.ink, borderColor:'rgba(255,255,255,.35)'}}>팔로우</button>
            <button className="btn btn--accent">매치 신청</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', borderBottom:'2px solid var(--border)', marginBottom:20, flexWrap:'wrap'}}>
        {[['overview','개요'],['roster','로스터'],['recent','최근 경기'],['stats','기록'],['chalk','작전판','captain']].map(([k, l, restrict]) => (
          <button key={k} onClick={()=>setTab(k)} style={{
            padding:'12px 18px', background:'transparent', border:0,
            borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
            color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: tab===k ? 700 : 500, fontSize:14, cursor:'pointer', marginBottom:-2,
            display:'inline-flex', alignItems:'center', gap:6,
          }}>{l}{restrict==='captain' && <span className="badge badge--red" style={{fontSize:9, padding:'1px 5px'}}>주장</span>}</button>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:24, alignItems:'flex-start'}}>
        <div>
          {tab === 'overview' && (
            <>
              <div className="card" style={{padding:'20px 22px', marginBottom:16}}>
                <h2 style={{margin:'0 0 10px', fontSize:18, fontWeight:700}}>팀 소개</h2>
                <p style={{margin:0, color:'var(--ink-soft)', lineHeight:1.7}}>
                  {t.founded}년 창단한 {t.name} 입니다. 매주 화·목·토 정기 연습을 진행하며, 2025 동계 대회 4강 진출을 목표로 하고 있습니다.
                  신입 게스트 1~2명 상시 모집 중이며, 중급 이상 경력자 우대합니다.
                </p>
              </div>
              <div className="card" style={{padding:'20px 22px'}}>
                <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>팀 정보</h2>
                <div style={{display:'grid', gridTemplateColumns:'120px 1fr', rowGap:10, fontSize:14}}>
                  <div style={{color:'var(--ink-dim)'}}>창단</div><div>{t.founded}년</div>
                  <div style={{color:'var(--ink-dim)'}}>홈 코트</div><div>용산국민체육센터</div>
                  <div style={{color:'var(--ink-dim)'}}>연습일</div><div>매주 화·목·토</div>
                  <div style={{color:'var(--ink-dim)'}}>팀 레벨</div><div>중-상급</div>
                  <div style={{color:'var(--ink-dim)'}}>레이팅</div><div><b>{t.rating}</b> · 전체 {TEAMS.findIndex(x=>x.id===t.id)+1}위</div>
                  <div style={{color:'var(--ink-dim)'}}>게스트 모집</div><div><span className="badge badge--ok">상시 모집</span></div>
                </div>
              </div>
            </>
          )}

          {tab === 'roster' && (
            <div className="board data-table">
              <div className="board__head data-table__head" style={{gridTemplateColumns:'56px 1fr 80px 100px 80px'}}>
                <div>#</div><div>이름</div><div>포지션</div><div>역할</div><div>PPG</div>
              </div>
              {roster.map(r => (
                <div key={r.num} className="board__row data-table__row" style={{gridTemplateColumns:'56px 1fr 80px 100px 80px'}}>
                  <div data-label="#" className="num" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:16, color: t.color}}>{r.num}</div>
                  <div data-primary="true" className="title">
                    <span style={{width:22, height:22, background:'var(--bg-alt)', display:'grid', placeItems:'center', fontSize:11, fontWeight:700, borderRadius:'50%', flexShrink:0}}>{r.name.charAt(0)}</span>
                    <span style={{fontWeight:600}}>{r.name}</span>
                  </div>
                  <div data-label="포지션" style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.pos}</div>
                  <div data-label="역할">{r.role === '주장' ? <span className="badge badge--red">{r.role}</span> : r.role === '부주장' ? <span className="badge badge--soft">{r.role}</span> : <span style={{color:'var(--ink-mute)', fontSize:12}}>{r.role}</span>}</div>
                  <div data-label="PPG" style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{r.ppg}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'recent' && (
            <div className="board data-table">
              <div className="board__head data-table__head" style={{gridTemplateColumns:'80px 1fr 120px 80px 160px'}}>
                <div>날짜</div><div>상대</div><div>스코어</div><div>결과</div><div>대회</div>
              </div>
              {recent.map((m, i) => (
                <div key={i} className="board__row data-table__row" style={{gridTemplateColumns:'80px 1fr 120px 80px 160px'}}>
                  <div data-label="날짜" style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{m.date}</div>
                  <div data-primary="true" className="title"><a>{m.opp}</a></div>
                  <div data-label="스코어" style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{m.score}</div>
                  <div data-label="결과">{m.result === 'W' ? <span className="badge badge--ok">W</span> : <span className="badge" style={{background:'var(--ink-dim)', color:'#fff', borderColor:'transparent'}}>L</span>}</div>
                  <div data-label="대회" style={{fontSize:12, color:'var(--ink-mute)'}}>{m.tournament}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'chalk' && <ChalkTalk team={t} roster={roster}/>}

          {tab === 'stats' && (
            <div className="card" style={{padding:'22px'}}>
              <h2 style={{margin:'0 0 16px', fontSize:18, fontWeight:700}}>2026 시즌 평균</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
                {[['득점', 18.4],['실점', 15.2],['리바', 28.1],['어시', 12.3]].map(([l, v]) => (
                  <div key={l} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)'}}>
                    <div style={{fontSize:11, color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>{l}</div>
                    <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:28, marginTop:4, letterSpacing:'-0.02em'}}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Side */}
        <aside style={{position:'sticky', top:120}}>
          <div className="card" style={{padding:'18px 20px', marginBottom:14}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:10}}>최근 폼</div>
            <div style={{display:'flex', gap:6, marginBottom:14}}>
              {['W','W','L','W','W'].map((r, i) => (
                <span key={i} style={{width:28, height:28, display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:13, color:'#fff', background: r === 'W' ? 'var(--ok)' : 'var(--ink-dim)', borderRadius:4}}>{r}</span>
              ))}
            </div>
            <button className="btn btn--primary btn--xl" style={{marginBottom:8}}>게스트 지원</button>
            <button className="btn" style={{width:'100%'}}>팀 매치 신청</button>
          </div>
          <div className="card" style={{padding:'16px 20px'}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', textTransform:'uppercase', marginBottom:10}}>연락</div>
            <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.7}}>
              팀장 · rdm_captain<br/>
              응답시간 · 평균 2시간
            </div>
            <button className="btn btn--sm" style={{marginTop:10, width:'100%'}}>쪽지 보내기</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.TeamDetail = TeamDetail;
