/* global React, TOURNAMENTS, Avatar */

function RefereeRequest({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [tourney, setTourney] = React.useState(0);
  const [selected, setSelected] = React.useState([0, 2]);
  const [msg, setMsg] = React.useState('');
  const [fee, setFee] = React.useState(80000);

  const tournaments = (typeof TOURNAMENTS !== 'undefined' && TOURNAMENTS.length) ? TOURNAMENTS : [
    { title:'BDR Challenge Spring 2026', edition:'Vol.12', accent:'#DC2626', dates:'2026.05.16 - 05.17' },
  ];

  const referees = [
    { id:0, name:'김정환 심판', cert:'KBL 2급', years:8, games:412, rating:4.9, avail:true, color:'#DC2626', specialty:'빠른 판정 · 3x3 경력 많음' },
    { id:1, name:'이성훈 심판', cert:'FIBA 3',   years:6, games:287, rating:4.8, avail:true, color:'#0F5FCC', specialty:'국제 대회 경력' },
    { id:2, name:'박민수 심판', cert:'KBL 3급', years:4, games:156, rating:4.7, avail:true, color:'#10B981', specialty:'커뮤니케이션 우수' },
    { id:3, name:'정하영 심판', cert:'KBL 2급', years:9, games:502, rating:4.9, avail:false, color:'#F59E0B', specialty:'대회장 경험 풍부 · 현재 배정중' },
    { id:4, name:'최유진 심판', cert:'KBL 3급', years:5, games:198, rating:4.6, avail:true, color:'#8B5CF6', specialty:'여성부 대회 전문' },
    { id:5, name:'오승환 심판', cert:'FIBA 3',   years:7, games:325, rating:4.8, avail:true, color:'#EC4899', specialty:'피지컬 플레이 잘 잡음' },
  ];

  const toggleRef = (id) => {
    if (selected.includes(id)) setSelected(selected.filter(r => r !== id));
    else setSelected([...selected, id]);
  };

  if (step === 3) {
    return (
      <div className="page" style={{maxWidth:600}}>
        <div className="card" style={{padding:'40px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:40, margin:'0 auto 18px', fontWeight:900}}>✓</div>
          <h1 style={{margin:'0 0 6px', fontSize:22, fontWeight:800, letterSpacing:'-0.01em'}}>요청 전송 완료</h1>
          <p style={{margin:'0 0 6px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
            선택한 <b style={{color:'var(--ink)'}}>{selected.length}명</b>의 심판에게 배정 요청을 보냈습니다.<br/>
            각 심판은 24시간 내 수락·거절 응답을 보냅니다.
          </p>
          <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, margin:'20px 0 24px', textAlign:'left'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>요청 요약</div>
            <div style={{display:'grid', gridTemplateColumns:'80px 1fr', gap:8, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>대회</div><div style={{fontWeight:700}}>{tournaments[tourney].title}</div>
              <div style={{color:'var(--ink-dim)'}}>심판</div><div style={{fontWeight:700}}>{selected.map(i => referees[i].name.split(' ')[0]).join(', ')}</div>
              <div style={{color:'var(--ink-dim)'}}>수당</div><div style={{fontFamily:'var(--ff-mono)'}}>₩{fee.toLocaleString()} / 경기</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('match')}>대회로</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('referee')}>심판 대시보드</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <span style={{color:'var(--ink)'}}>심판 배정 요청</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">REFEREE REQUEST · 심판 배정 요청 (호스트)</div>
        <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>심판 배정 요청</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>대회에 필요한 심판 수 × 1.5배 정도를 선택해 보내는 걸 권장합니다.</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:18, alignItems:'flex-start'}}>
        <div>
          {step === 1 && (
            <div className="card" style={{padding:'24px 28px'}}>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>1. 대회 선택</h2>
              <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:20}}>
                {tournaments.map((t, i) => (
                  <button key={i} onClick={()=>setTourney(i)} style={{
                    textAlign:'left', padding:'14px 16px',
                    background: tourney===i?'var(--bg-alt)':'transparent',
                    border: tourney===i?`2px solid ${t.accent}`:'1px solid var(--border)',
                    borderRadius:6, cursor:'pointer', display:'grid', gridTemplateColumns:'48px 1fr auto', gap:12, alignItems:'center',
                  }}>
                    <div style={{width:48, height:48, background:t.accent, color:'#fff', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14, borderRadius:4}}>{t.edition||'T'}</div>
                    <div>
                      <div style={{fontWeight:800, fontSize:14}}>{t.title}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.dates || '2026.05.16 - 05.17'} · 총 24경기</div>
                    </div>
                    <div style={{fontSize:11, color:'var(--ink-dim)'}}>경기당 필요 <b style={{color:'var(--accent)', fontSize:14, fontFamily:'var(--ff-mono)'}}>2명</b></div>
                  </button>
                ))}
              </div>

              <h2 style={{margin:'18px 0 10px', fontSize:16, fontWeight:700}}>2. 심판 수당 설정</h2>
              <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:10}}>
                {[60000, 80000, 100000, 120000].map(f => (
                  <button key={f} onClick={()=>setFee(f)} className={`btn ${fee===f?'btn--primary':''}`} style={{padding:'12px 0'}}>
                    <div style={{fontFamily:'var(--ff-mono)', fontSize:15, fontWeight:800}}>₩{f.toLocaleString()}</div>
                    <div style={{fontSize:10, opacity:.75}}>/ 경기</div>
                  </button>
                ))}
              </div>
              <div style={{fontSize:11, color:'var(--ink-dim)'}}>BDR 권장: 80,000~100,000원 · 국제 대회 경력자는 120,000 이상 권장</div>

              <div style={{display:'flex', justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
                <button className="btn btn--primary" onClick={()=>setStep(2)}>심판 선택 →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card" style={{padding:'24px 28px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
                <h2 style={{margin:0, fontSize:16, fontWeight:700}}>3. 심판 선택 ({selected.length}명)</h2>
                <div style={{fontSize:11, color:'var(--ink-dim)'}}>AI 추천 순 · 평점/경력/가용성 기반</div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {referees.map(r => {
                  const sel = selected.includes(r.id);
                  return (
                    <button key={r.id} onClick={()=> r.avail && toggleRef(r.id)} disabled={!r.avail} style={{
                      textAlign:'left', padding:'14px 16px',
                      background: sel?'color-mix(in oklab, var(--accent) 6%, var(--bg))': r.avail?'transparent':'var(--bg-alt)',
                      border: sel?'2px solid var(--accent)':'1px solid var(--border)',
                      borderRadius:6, cursor: r.avail?'pointer':'not-allowed',
                      display:'grid', gridTemplateColumns:'auto 44px 1fr auto', gap:12, alignItems:'center',
                      opacity: r.avail?1:0.55,
                    }}>
                      <input type="checkbox" checked={sel} readOnly disabled={!r.avail}/>
                      <Avatar tag={r.name.slice(0,1)} color={r.color} ink="#fff" size={44} radius={4}/>
                      <div>
                        <div style={{display:'flex', gap:6, alignItems:'baseline'}}>
                          <div style={{fontWeight:800, fontSize:14}}>{r.name}</div>
                          <span className="badge badge--ghost">{r.cert}</span>
                          {!r.avail && <span className="badge badge--red">배정중</span>}
                        </div>
                        <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>경력 {r.years}년 · 운영 {r.games}경기 · ★ {r.rating}</div>
                        <div style={{fontSize:11, color:'var(--ink-soft)', marginTop:3, fontStyle:'italic'}}>"{r.specialty}"</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:'var(--ff-mono)', fontWeight:700, fontSize:13, color:'var(--ink-soft)'}}>예상 응답</div>
                        <div style={{fontSize:11, color:'var(--ok)', fontWeight:700}}>~ 2시간</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <h2 style={{margin:'24px 0 10px', fontSize:16, fontWeight:700}}>4. 메시지 (선택)</h2>
              <textarea className="input" rows={3} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="예: 대회 특성·경기 분위기·챙겨오실 점 등을 알려주세요." style={{resize:'vertical'}}/>

              <div style={{display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
                <button className="btn" onClick={()=>setStep(1)}>← 이전</button>
                <button className="btn btn--primary btn--lg" disabled={!selected.length} onClick={()=>setStep(3)}>
                  {selected.length}명에게 요청 전송
                </button>
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>요청 요약</div>
            <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:12}}>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>대회</span><span style={{fontWeight:700}}>{tournaments[tourney].title}</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>필요 심판</span><span style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>2명/경기 × 24</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>요청 대상</span><span style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>{selected.length}명</span></div>
              <div style={{display:'flex', justifyContent:'space-between'}}><span style={{color:'var(--ink-dim)'}}>경기당 수당</span><span style={{fontWeight:700, fontFamily:'var(--ff-mono)'}}>₩{fee.toLocaleString()}</span></div>
            </div>
            <div style={{borderTop:'1px dashed var(--border)', marginTop:12, paddingTop:12, display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <span style={{fontSize:12, fontWeight:700}}>예상 총액</span>
              <span style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, color:'var(--accent)'}}>₩{(fee*24*2).toLocaleString()}</span>
            </div>
          </div>
          <div className="card" style={{padding:'16px 18px', background:'var(--bg-alt)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:6}}>💡 TIP</div>
            <div style={{fontSize:12, lineHeight:1.7, color:'var(--ink-soft)'}}>
              대회 당일까지 충분한 심판을 확보하려면 <b>필요 인원의 1.5~2배</b>를 요청하는 걸 권장합니다. 거절률 평균 30%.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.RefereeRequest = RefereeRequest;
