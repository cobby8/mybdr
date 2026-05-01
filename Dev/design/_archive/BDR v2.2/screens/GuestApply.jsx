/* global React, GAMES, TEAMS, Avatar, Icon */

function GuestApply({ setRoute }) {
  const g = (typeof GAMES !== 'undefined' && GAMES[0]) || {
    title:'토요 아침 픽업 @ 장충',
    when:'2026.04.27 (토) 07:00 - 09:00',
    court:'장충체육관 B코트',
    host:{ name:'3POINT', tag:'3PT' },
    level:'중급',
    fee:'5,000원',
  };

  const [submitted, setSubmitted] = React.useState(false);
  const [pos, setPos] = React.useState('G');
  const [exp, setExp] = React.useState('2');
  const [msg, setMsg] = React.useState('');
  const [accept, setAccept] = React.useState({ insurance:true, cancel:false });

  if (submitted) {
    return (
      <div className="page" style={{maxWidth:560}}>
        <div className="card" style={{padding:'40px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:40, margin:'0 auto 18px', fontWeight:900}}>✓</div>
          <h1 style={{margin:'0 0 6px', fontSize:22, fontWeight:800, letterSpacing:'-0.01em'}}>지원 완료</h1>
          <p style={{margin:'0 0 6px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
            <b style={{color:'var(--ink)'}}>{g.host.name}</b> 호스트가 검토 후 수락·거절을 알려줍니다.<br/>
            보통 <b>2시간 이내</b> 응답이 와요.
          </p>
          <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, margin:'20px 0 24px', textAlign:'left'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', marginBottom:6}}>신청 요약</div>
            <div style={{display:'grid', gridTemplateColumns:'80px 1fr', gap:8, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>경기</div><div style={{fontWeight:700}}>{g.title}</div>
              <div style={{color:'var(--ink-dim)'}}>일시</div><div style={{fontFamily:'var(--ff-mono)'}}>{g.when}</div>
              <div style={{color:'var(--ink-dim)'}}>포지션</div><div style={{fontWeight:700}}>{pos}</div>
              <div style={{color:'var(--ink-dim)'}}>참가비</div><div style={{fontFamily:'var(--ff-mono)'}}>{g.fee} (현장 결제)</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('guestApps')}>지원 현황 보기</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('games')}>다른 경기 찾기</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('games')} style={{cursor:'pointer'}}>경기</a><span>›</span>
        <a onClick={()=>setRoute('gameDetail')} style={{cursor:'pointer'}}>경기 상세</a><span>›</span>
        <span style={{color:'var(--ink)'}}>게스트 지원</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">GUEST APPLY · 게스트 지원</div>
        <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>게스트로 지원하기</h1>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:18, alignItems:'flex-start'}}>
        <div className="card" style={{padding:'24px 28px'}}>
          {/* Game summary */}
          <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, marginBottom:22}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', marginBottom:4}}>지원 대상</div>
            <div style={{fontWeight:800, fontSize:15, marginBottom:4}}>{g.title}</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{g.when} · {g.court} · {g.level}</div>
          </div>

          <h2 style={{margin:'0 0 12px', fontSize:16, fontWeight:700}}>내 정보</h2>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:18}}>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>주 포지션 *</label>
              <div style={{display:'flex', gap:6}}>
                {['G','F','C'].map(p => (
                  <button key={p} onClick={()=>setPos(p)} style={{
                    flex:1, padding:'10px 0', background:pos===p?'var(--accent)':'var(--bg-alt)',
                    color:pos===p?'#fff':'var(--ink)', border:0, borderRadius:4, cursor:'pointer',
                    fontFamily:'var(--ff-display)', fontWeight:800, fontSize:15, letterSpacing:'.02em',
                  }}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>구력</label>
              <select className="input" value={exp} onChange={e=>setExp(e.target.value)}>
                <option value="0">1년 미만</option>
                <option value="1">1~3년</option>
                <option value="2">3~5년</option>
                <option value="3">5~10년</option>
                <option value="4">10년 이상</option>
              </select>
            </div>
          </div>

          <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:4, marginBottom:18, display:'grid', gridTemplateColumns:'40px 1fr auto', gap:10, alignItems:'center'}}>
            <Avatar tag="ME" color="#0F5FCC" ink="#fff" size={40} radius={4}/>
            <div>
              <div style={{fontWeight:700}}>@me_player · Lv.6</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>매너 4.8 · 픽업 23회 · 노쇼 0</div>
            </div>
            <span className="badge badge--ok">인증</span>
          </div>

          <h2 style={{margin:'24px 0 10px', fontSize:16, fontWeight:700}}>호스트에게 한마디</h2>
          <textarea
            className="input"
            rows={4}
            value={msg}
            onChange={e=>setMsg(e.target.value)}
            placeholder="예: 슛이 좋은 편이고, 처음이지만 열심히 뛰겠습니다. 혹시 주차 가능할까요?"
            style={{resize:'vertical'}}
          />
          <div style={{display:'flex', justifyContent:'space-between', marginTop:4}}>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>수락 확률을 높이는 좋은 소개말을 적어주세요</span>
            <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{msg.length}/300</span>
          </div>

          <h2 style={{margin:'24px 0 10px', fontSize:16, fontWeight:700}}>약관 동의</h2>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { k:'insurance', l:'스포츠 상해에 대한 본인 책임 이해', req:true },
              { k:'cancel',    l:'수락 후 24시간 이내 취소 시 매너점수 차감 가능', req:true },
            ].map(t => (
              <label key={t.k} style={{display:'flex', gap:10, fontSize:13, cursor:'pointer', alignItems:'flex-start'}}>
                <input type="checkbox" checked={accept[t.k]} onChange={e=>setAccept({...accept, [t.k]:e.target.checked})} style={{marginTop:3}}/>
                <span><span style={{color:'var(--err)', fontWeight:800, marginRight:2}}>*</span>{t.l}</span>
              </label>
            ))}
          </div>

          <div style={{display:'flex', justifyContent:'space-between', marginTop:28, paddingTop:20, borderTop:'1px solid var(--border)'}}>
            <button className="btn" onClick={()=>setRoute('gameDetail')}>← 취소</button>
            <button
              className="btn btn--primary btn--lg"
              disabled={!accept.insurance || !accept.cancel}
              onClick={()=>setSubmitted(true)}
            >게스트로 지원하기</button>
          </div>
        </div>

        <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:120}}>
          <div className="card" style={{padding:'16px 18px', background:'var(--bg-alt)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>💡 호스트가 보는 것</div>
            <ul style={{margin:0, paddingLeft:16, fontSize:12, lineHeight:1.7, color:'var(--ink-soft)'}}>
              <li>내 아이디·매너점수·레벨</li>
              <li>주 포지션과 구력</li>
              <li>호스트에게 남긴 메시지</li>
              <li>과거 픽업 이력 (노쇼 여부)</li>
            </ul>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>예상 대기 시간</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900}}>~ 2시간</div>
            <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>이 호스트 평균 응답</div>
          </div>
          <div className="card" style={{padding:'14px 16px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>동시 지원</div>
            <div style={{fontSize:12, lineHeight:1.6, color:'var(--ink-soft)'}}>
              다른 경기 <b>2개</b>에 동시 지원 중. 어느 쪽이든 수락되면 자동으로 나머지는 취소됩니다.
            </div>
            <a onClick={()=>setRoute('guestApps')} style={{fontSize:11, color:'var(--cafe-blue)', cursor:'pointer', fontWeight:700, marginTop:6, display:'inline-block'}}>지원 현황 보기 →</a>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.GuestApply = GuestApply;
