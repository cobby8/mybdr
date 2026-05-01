/* global React, Avatar */

function GameReport({ setRoute }) {
  const [submitted, setSubmitted] = React.useState(false);
  const [ratings, setRatings] = React.useState({});
  const [reports, setReports] = React.useState({});
  const [mvp, setMvp] = React.useState(null);
  const [noshows, setNoshows] = React.useState([]);
  const [overall, setOverall] = React.useState(0);
  const [comment, setComment] = React.useState('');

  const players = [
    { id:1, name:'rdm_sniper', team:'A', pos:'G', num:7, color:'#DC2626' },
    { id:2, name:'rdm_forward', team:'A', pos:'F', num:23, color:'#DC2626' },
    { id:3, name:'rdm_pivot', team:'A', pos:'C', num:44, color:'#DC2626' },
    { id:4, name:'hoops_alex', team:'B', pos:'G', num:11, color:'#0F5FCC' },
    { id:5, name:'threes_jk', team:'B', pos:'F', num:22, color:'#0F5FCC' },
    { id:6, name:'paint_bk', team:'B', pos:'C', num:33, color:'#0F5FCC' },
  ];

  const setRating = (id, v) => setRatings({...ratings, [id]:v});
  const toggleReport = (id, flag) => {
    const cur = reports[id] || [];
    setReports({...reports, [id]: cur.includes(flag) ? cur.filter(f=>f!==flag) : [...cur, flag]});
  };
  const toggleNoshow = (id) => setNoshows(noshows.includes(id) ? noshows.filter(n=>n!==id) : [...noshows, id]);

  if (submitted) {
    return (
      <div className="page" style={{maxWidth:560}}>
        <div className="card" style={{padding:'40px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:40, margin:'0 auto 18px', fontWeight:900}}>✓</div>
          <h1 style={{margin:'0 0 6px', fontSize:22, fontWeight:800}}>리포트 제출 완료</h1>
          <p style={{margin:'0 0 18px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
            평가해주셔서 감사합니다. 각 플레이어의 매너 점수에 반영됩니다.<br/>
            심각한 신고는 BDR 운영팀이 별도 검토합니다.
          </p>
          <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, margin:'0 0 22px', textAlign:'left'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>리포트 요약</div>
            <div style={{display:'grid', gridTemplateColumns:'90px 1fr', gap:8, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>평가한 선수</div><div style={{fontWeight:700}}>{Object.keys(ratings).length}명</div>
              <div style={{color:'var(--ink-dim)'}}>신고</div><div>{Object.keys(reports).filter(k=>reports[k]?.length).length}건</div>
              <div style={{color:'var(--ink-dim)'}}>노쇼</div><div>{noshows.length}명</div>
              <div style={{color:'var(--ink-dim)'}}>MVP 추천</div><div style={{fontWeight:700}}>{mvp ? players.find(p=>p.id===mvp)?.name : '—'}</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('mygames')}>내 경기로</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('gameResult')}>결과 보기</button>
          </div>
        </div>
      </div>
    );
  }

  const flags = [
    { k:'noshow', l:'노쇼·지각', c:'var(--warn)' },
    { k:'manner', l:'매너 이슈', c:'var(--warn)' },
    { k:'foul', l:'과격 플레이', c:'var(--err)' },
    { k:'verbal', l:'폭언·비방', c:'var(--err)' },
    { k:'cheat', l:'부정 행위', c:'var(--err)' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('mygames')} style={{cursor:'pointer'}}>내 경기</a><span>›</span>
        <span style={{color:'var(--ink)'}}>경기 후 리포트</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">POST-GAME REPORT · 경기 후 평가</div>
        <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>경기 후 리포트</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>토요 아침 픽업 @ 장충 · 2026.04.24 · 호스트로서 리포트 작성</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:18, alignItems:'flex-start'}}>
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Overall */}
          <div className="card" style={{padding:'22px 24px'}}>
            <h2 style={{margin:'0 0 12px', fontSize:16, fontWeight:700}}>경기 전반</h2>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>오늘 경기는 어땠나요?</label>
            <div style={{display:'flex', gap:6, marginBottom:14}}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={()=>setOverall(n)} style={{
                  width:54, height:54, borderRadius:4,
                  background: overall>=n?'var(--accent)':'var(--bg-alt)', color:overall>=n?'#fff':'var(--ink-dim)',
                  border:0, cursor:'pointer', fontSize:22, fontWeight:900,
                }}>★</button>
              ))}
              <div style={{flex:1}}/>
              <div style={{display:'flex', alignItems:'center', fontSize:12, color:'var(--ink-dim)', fontWeight:700}}>
                {overall === 0 && '평가 없음'}
                {overall === 1 && '매우 나빴음'}
                {overall === 2 && '아쉬움'}
                {overall === 3 && '보통'}
                {overall === 4 && '좋았음'}
                {overall === 5 && '최고!'}
              </div>
            </div>
            <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>운영 관련 특이사항 (선택)</label>
            <textarea className="input" rows={2} value={comment} onChange={e=>setComment(e.target.value)} placeholder="예: 골대 하나가 낮아서 불편했음. 화장실 만실. 다음엔 30분 빨리 오픈 권장." style={{resize:'vertical'}}/>
          </div>

          {/* Per-player */}
          <div className="card" style={{padding:'22px 24px'}}>
            <h2 style={{margin:'0 0 4px', fontSize:16, fontWeight:700}}>선수별 평가</h2>
            <p style={{margin:'0 0 14px', fontSize:12, color:'var(--ink-mute)'}}>매너 점수 · 문제 있었다면 신고 (익명)</p>
            <div style={{display:'flex', flexDirection:'column', gap:0}}>
              {players.map((p, i) => (
                <div key={p.id} style={{padding:'16px 0', borderTop: i>0?'1px solid var(--border)':'none'}}>
                  <div style={{display:'grid', gridTemplateColumns:'44px 1fr auto', gap:12, alignItems:'center', marginBottom:10}}>
                    <Avatar tag={`${p.team}${p.num}`} color={p.color} ink="#fff" size={44} radius={6}/>
                    <div>
                      <div style={{display:'flex', gap:8, alignItems:'baseline'}}>
                        <div style={{fontWeight:800, fontSize:14}}>{p.name}</div>
                        <span className="badge badge--soft">{p.pos}</span>
                        <span className="badge badge--ghost" style={{background: p.color+'22', color:p.color}}>팀 {p.team}</span>
                      </div>
                      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>#{p.num} · 매너 4.8 · 과거 픽업 23회</div>
                    </div>
                    <button onClick={()=>setMvp(p.id===mvp?null:p.id)} className={`btn btn--sm ${mvp===p.id?'btn--primary':''}`}>
                      {mvp===p.id ? '★ MVP 추천' : '★ MVP로'}
                    </button>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:12, alignItems:'center', marginLeft:56}}>
                    <div style={{display:'flex', gap:2}}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} onClick={()=>setRating(p.id, n)} style={{
                          width:28, height:28, borderRadius:2, background: ratings[p.id]>=n?'var(--warn)':'var(--bg-alt)',
                          color:ratings[p.id]>=n?'#fff':'var(--ink-dim)', border:0, cursor:'pointer', fontSize:14, fontWeight:900,
                        }}>★</button>
                      ))}
                    </div>
                    <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                      {flags.map(f => {
                        const on = (reports[p.id] || []).includes(f.k);
                        return (
                          <button key={f.k} onClick={()=>toggleReport(p.id, f.k)} style={{
                            padding:'3px 8px', borderRadius:10,
                            background: on ? f.c : 'transparent',
                            color: on ? '#fff' : 'var(--ink-dim)',
                            border: `1px solid ${on ? f.c : 'var(--border)'}`,
                            cursor:'pointer', fontSize:10, fontWeight:700,
                          }}>
                            {f.l}
                          </button>
                        );
                      })}
                    </div>
                    <label style={{display:'flex', gap:4, alignItems:'center', fontSize:11, color:'var(--ink-soft)', cursor:'pointer', whiteSpace:'nowrap'}}>
                      <input type="checkbox" checked={noshows.includes(p.id)} onChange={()=>toggleNoshow(p.id)}/>
                      불참/노쇼
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'16px 20px', background:'var(--bg-alt)', fontSize:12, color:'var(--ink-soft)', lineHeight:1.6}}>
            <b>🔒 익명성 보장</b> — 신고 내용은 해당 선수에게 공개되지 않습니다. 누적 신고가 많은 선수는 BDR 운영팀이 개별 확인합니다.
          </div>

          <div style={{display:'flex', justifyContent:'space-between', paddingTop:8}}>
            <button className="btn" onClick={()=>setRoute('mygames')}>나중에 하기</button>
            <div style={{display:'flex', gap:8}}>
              <button className="btn">임시 저장</button>
              <button className="btn btn--primary btn--lg" onClick={()=>setSubmitted(true)} disabled={overall===0}>리포트 제출</button>
            </div>
          </div>
        </div>

        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>진행 상황</div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13}}><span>전반 평가</span><b style={{color: overall?'var(--ok)':'var(--ink-dim)'}}>{overall?'✓':'—'}</b></div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13}}><span>선수별 평가</span><b style={{fontFamily:'var(--ff-mono)'}}>{Object.keys(ratings).length}/{players.length}</b></div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13}}><span>MVP 추천</span><b style={{color: mvp?'var(--ok)':'var(--ink-dim)'}}>{mvp?'✓':'—'}</b></div>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>🛡 신고 기준</div>
            <div style={{fontSize:12, lineHeight:1.7, color:'var(--ink-soft)'}}>
              <b>노쇼·지각</b> 연락 없이 불참<br/>
              <b>매너 이슈</b> 비협조·무례<br/>
              <b>과격 플레이</b> 고의 파울, 부상 유발<br/>
              <b>폭언</b> 욕설·비방·성희롱<br/>
              <b>부정</b> 콜 조작·점수 속임<br/>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.GameReport = GameReport;
