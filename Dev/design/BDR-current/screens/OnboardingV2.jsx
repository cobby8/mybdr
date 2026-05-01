/* global React */

function OnboardingV2({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    pos: 'G',
    height: 178,
    level: '',
    styles: [],
    areas: [],
    frequency: 'weekly',
    goals: [],
    notifications: { games:true, tournaments:true, messages:true, marketing:false },
  });
  const update = (k, v) => setData({...data, [k]:v});
  const toggle = (k, v) => {
    const arr = data[k];
    if (arr.includes(v)) update(k, arr.filter(x => x !== v));
    else update(k, [...arr, v]);
  };

  const total = 6;

  if (step === 7) {
    return (
      <div className="page" style={{maxWidth:560, paddingTop:60}}>
        <div className="card" style={{padding:'48px 36px', textAlign:'center'}}>
          <div style={{width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), #FF6B35)', color:'#fff', display:'grid', placeItems:'center', fontSize:44, margin:'0 auto 18px', fontWeight:900}}>🏀</div>
          <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.02em'}}>환영합니다!</h1>
          <p style={{margin:'0 0 20px', fontSize:14, color:'var(--ink-mute)', lineHeight:1.6}}>
            취향에 맞는 경기와 팀이 이미 준비되어 있어요.<br/>
            지금 바로 첫 경기를 찾아보세요.
          </p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, margin:'28px 0', padding:'18px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)'}}>
            <div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, color:'var(--accent)'}}>24</div>
              <div style={{fontSize:11, color:'var(--ink-dim)'}}>추천 경기</div>
            </div>
            <div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, color:'var(--cafe-blue)'}}>8</div>
              <div style={{fontSize:11, color:'var(--ink-dim)'}}>내 지역 팀</div>
            </div>
            <div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:22, fontWeight:900, color:'var(--ok)'}}>3</div>
              <div style={{fontSize:11, color:'var(--ink-dim)'}}>열린 대회</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('profile')}>프로필 보기</button>
            <button className="btn btn--primary btn--xl" onClick={()=>setRoute('games')}>경기 찾기 →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:640, paddingTop:40}}>
      {/* Progress */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>
          <span>STEP {step} / {total}</span>
          <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>건너뛰기</a>
        </div>
        <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
          <div style={{width:`${(step/total)*100}%`, height:'100%', background:'var(--accent)', transition:'width .3s'}}/>
        </div>
      </div>

      <div className="card" style={{padding:'36px 40px', minHeight:440}}>
        {step === 1 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>어떤 포지션으로 뛰나요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>매칭·추천에 활용되는 가장 중요한 정보예요.</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
              {[
                {v:'G', l:'가드', d:'볼 핸들링·슈팅·플레이메이킹', color:'#0F5FCC'},
                {v:'F', l:'포워드', d:'다재다능·득점·리바운드', color:'#10B981'},
                {v:'C', l:'센터', d:'포스트업·리바운드·블락', color:'#DC2626'},
              ].map(p => (
                <button key={p.v} onClick={()=>update('pos', p.v)} style={{
                  padding:'22px 16px', textAlign:'center',
                  background: data.pos===p.v?'var(--bg-alt)':'transparent',
                  border: data.pos===p.v?`2px solid ${p.color}`:'1px solid var(--border)',
                  borderRadius:8, cursor:'pointer',
                }}>
                  <div style={{width:54, height:54, borderRadius:'50%', background:p.color, color:'#fff', display:'grid', placeItems:'center', margin:'0 auto 10px', fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900}}>{p.v}</div>
                  <div style={{fontWeight:800, fontSize:14}}>{p.l}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>{p.d}</div>
                </button>
              ))}
            </div>
            <div style={{marginTop:24}}>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>신장 {data.height}cm</label>
              <input type="range" min="150" max="210" value={data.height} onChange={e=>update('height', Number(e.target.value))} style={{width:'100%'}}/>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>실력 수준은 어느 정도인가요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>비슷한 수준의 플레이어와 매칭해드려요. 부정확해도 괜찮아요—언제든 수정 가능.</p>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {[
                {v:'초보', d:'농구 경험 거의 없음. 재미 위주.'},
                {v:'초-중급', d:'룰 알고 패스·슛 기본 가능.'},
                {v:'중급', d:'픽업 정기 참여. 포지션별 롤 수행.'},
                {v:'중-상급', d:'아마추어 대회 출전. 상대 분석 가능.'},
                {v:'상급', d:'리그·전국 아마 대회 입상 경험.'},
                {v:'선출급', d:'선수 또는 선수 출신.'},
              ].map(l => (
                <button key={l.v} onClick={()=>update('level', l.v)} style={{
                  textAlign:'left', padding:'14px 18px',
                  background: data.level===l.v?'var(--bg-alt)':'transparent',
                  border: data.level===l.v?'2px solid var(--accent)':'1px solid var(--border)',
                  borderRadius:6, cursor:'pointer',
                }}>
                  <div style={{fontWeight:800, fontSize:14}}>{l.v}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{l.d}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>어떤 스타일로 뛰나요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>최대 4개까지 · 플레이 스타일 매칭에 사용</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
              {['3점 슈터','돌파형','포스트업','패서','수비수','올라운더','리바운더','블락커','허슬러','전환 빠른','시스템 플레이','야전 타입'].map(s => {
                const sel = data.styles.includes(s);
                return (
                  <button key={s} onClick={()=> (sel || data.styles.length<4) && toggle('styles', s)} style={{
                    padding:'14px 10px', textAlign:'center',
                    background: sel?'var(--accent)':'var(--bg-alt)',
                    color: sel?'#fff':'var(--ink)',
                    border:0, borderRadius:6, cursor:'pointer', fontSize:13, fontWeight:700,
                    opacity: !sel && data.styles.length>=4 ? 0.3 : 1,
                  }}>{s}</button>
                );
              })}
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>주로 어디서 뛰나요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>해당 지역의 경기·코트·팀을 우선 추천해드려요.</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:20}}>
              {['강남','서초','송파','성동','용산','중구','마포','영등포','구로','금천','관악','동작','성북','강동','광진','하남','고양','부천'].map(a => {
                const sel = data.areas.includes(a);
                return (
                  <button key={a} onClick={()=>toggle('areas', a)} style={{
                    padding:'10px 0', textAlign:'center',
                    background: sel?'var(--cafe-blue)':'var(--bg-alt)',
                    color: sel?'#fff':'var(--ink)',
                    border:0, borderRadius:4, cursor:'pointer', fontSize:12, fontWeight:700,
                  }}>{a}</button>
                );
              })}
            </div>
            <div>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>얼마나 자주 뛰나요?</label>
              <div style={{display:'flex', gap:6}}>
                {[{v:'daily', l:'주 3회 이상'},{v:'weekly', l:'주 1~2회'},{v:'monthly', l:'월 몇 번'},{v:'rare', l:'가끔'}].map(f => (
                  <button key={f.v} onClick={()=>update('frequency', f.v)} className={`btn btn--sm ${data.frequency===f.v?'btn--primary':''}`} style={{flex:1}}>{f.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>어떤 목표가 있나요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>목표에 맞는 콘텐츠와 기능을 보여드려요. 복수 선택 가능.</p>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {[
                {v:'friends', e:'🤝', l:'새 친구·팀 만들기', d:'지역·실력 맞는 사람들과 네트워킹'},
                {v:'fit',     e:'💪', l:'건강·운동', d:'정기적인 농구로 체력 관리'},
                {v:'skill',   e:'🏀', l:'실력 향상', d:'기술·전술 배우고 실력 키우기'},
                {v:'compete', e:'🏆', l:'대회 참가', d:'아마추어 대회·리그 참가'},
                {v:'team',    e:'👥', l:'팀 만들기', d:'나만의 팀 운영·관리'},
                {v:'fun',     e:'🔥', l:'순수 재미', d:'부담 없이 즐기는 픽업 경기'},
              ].map(g => {
                const sel = data.goals.includes(g.v);
                return (
                  <button key={g.v} onClick={()=>toggle('goals', g.v)} style={{
                    textAlign:'left', padding:'12px 16px',
                    background: sel?'var(--bg-alt)':'transparent',
                    border: sel?'2px solid var(--accent)':'1px solid var(--border)',
                    borderRadius:6, cursor:'pointer', display:'grid', gridTemplateColumns:'36px 1fr', gap:12, alignItems:'center',
                  }}>
                    <div style={{fontSize:24, textAlign:'center'}}>{g.e}</div>
                    <div>
                      <div style={{fontWeight:700, fontSize:13}}>{g.l}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)'}}>{g.d}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>알림을 어떻게 받을까요?</h1>
            <p style={{margin:'0 0 28px', fontSize:14, color:'var(--ink-mute)'}}>나중에 설정에서 언제든 바꿀 수 있어요.</p>
            <div style={{display:'flex', flexDirection:'column', gap:0}}>
              {[
                {k:'games', l:'경기 알림', d:'관심 지역에 새 경기가 열리면 알림'},
                {k:'tournaments', l:'대회 알림', d:'대회 접수 시작·마감·결과'},
                {k:'messages', l:'쪽지·팀 활동', d:'쪽지, 팀 공지, 가입 신청 등'},
                {k:'marketing', l:'이벤트·프로모션', d:'BDR+ 할인, 굿즈, 이벤트'},
              ].map((n, i) => (
                <div key={n.k} style={{display:'flex', justifyContent:'space-between', padding:'14px 0', borderTop: i>0?'1px solid var(--border)':'none', alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700, fontSize:13}}>{n.l}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)'}}>{n.d}</div>
                  </div>
                  <button onClick={()=>update('notifications', {...data.notifications, [n.k]:!data.notifications[n.k]})} style={{
                    width:44, height:24, borderRadius:12, border:0, cursor:'pointer',
                    background: data.notifications[n.k]?'var(--accent)':'var(--border)',
                    position:'relative', transition:'.2s',
                  }}>
                    <div style={{width:18, height:18, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: data.notifications[n.k]?23:3, transition:'.2s'}}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{display:'flex', justifyContent:'space-between', marginTop:32, paddingTop:20, borderTop:'1px solid var(--border)'}}>
          <button className="btn" onClick={()=>step>1?setStep(step-1):setRoute('home')}>{step>1?'← 이전':'나가기'}</button>
          <button className="btn btn--primary btn--lg" onClick={()=>setStep(step+1)}
            disabled={step===2 && !data.level}>
            {step<total?'다음 →':'완료 →'}
          </button>
        </div>
      </div>
    </div>
  );
}

window.OnboardingV2 = OnboardingV2;
