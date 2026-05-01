/* global React */

/**
 * ProfileComplete — /profile/complete (D등급 P0-4 신규)
 *
 * Why: 신규 가입 후 프로필 완성 유도 (포지션 / 키 / 활동 지역 / 사진)
 *      OnboardingV2(6스텝)는 풀 온보딩, 이건 압축형 4스텝 — "지금 바로" 유도
 *
 * Pattern: OnboardingV2 단계형 폼 + 진행 막대 + 카드 컨테이너 (M5 압축)
 *
 * 진입: /verify 직후 자동 redirect / /profile "프로필 60% — 완성하기" 배너
 *       /profile/complete/preferences (P2) 와 짝
 * 복귀: 완료 → /onboarding/setup (전체 온보딩) 또는 / (이미 마쳤으면 홈)
 *       건너뛰기 → /
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점       | 모바일
 *   포지션 선택       | OnboardingV2 ✅ | ✅ 5칩         | verify 직후 | 3열
 *   키·체급           | EditProfile ✅  | ✅ slider/select| -          | 1열
 *   활동 지역         | OnboardingV2 ✅ | ✅ 칩 다중     | -          | 2열
 *   사진 업로드       | EditProfile ✅  | ✅ drop zone   | -          | OK
 *   건너뛰기          | -              | ✅ 우상단 link | -          | OK
 */

function ProfileComplete({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    pos: 'G',
    height: 178,
    weight: 72,
    areas: [],
    photo: null,
  });
  const update = (k, v) => setData({...data, [k]:v});
  const toggleArea = (v) => {
    const arr = data.areas;
    if (arr.includes(v)) update('areas', arr.filter(x => x !== v));
    else if (arr.length < 3) update('areas', [...arr, v]);
  };

  const total = 4;
  const POSITIONS = [
    { id:'PG', label:'포인트 가드', desc:'볼 핸들러' },
    { id:'SG', label:'슈팅 가드', desc:'외곽 슈터' },
    { id:'SF', label:'스몰 포워드', desc:'다재다능' },
    { id:'PF', label:'파워 포워드', desc:'골밑 + 미들' },
    { id:'C',  label:'센터', desc:'골밑 지배' },
  ];
  const AREAS = [
    '강남·서초', '송파·강동', '용산·중구', '마포·서대문', '성동·광진',
    '동대문·성북', '노원·도봉', '구로·금천', '영등포·양천', '관악·동작',
    '하남·미사', '분당·판교', '인천·부천', '기타',
  ];

  // ── 완료 화면 ──
  if (step === total + 1) {
    return (
      <div className="page" style={{maxWidth:560, paddingTop:60}}>
        <div className="card" style={{padding:'48px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), #FF6B35)', color:'#fff', display:'grid', placeItems:'center', fontSize:36, margin:'0 auto 18px'}}>🏀</div>
          <h1 style={{margin:'0 0 8px', fontSize:24, fontWeight:800, letterSpacing:'-0.02em'}}>프로필 기본 정보 완료!</h1>
          <p style={{margin:'0 0 24px', fontSize:14, color:'var(--ink-mute)', lineHeight:1.6}}>
            기본 정보가 채워졌어요. 더 정확한 매칭을 원하면<br/>
            취향 설정도 마쳐 보세요 (1분).
          </p>
          <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('home')}>나중에 하기</button>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('onboarding')}>취향 설정 →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:560, paddingTop:30}}>
      {/* 진행 막대 */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>
          <span>STEP {step} / {total} · 프로필 완성</span>
          <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>건너뛰기</a>
        </div>
        <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
          <div style={{width:`${(step/total)*100}%`, height:'100%', background:'var(--accent)', transition:'width .3s'}}/>
        </div>
      </div>

      <div className="card" style={{padding:'36px 40px', minHeight:380}}>
        {/* ── Step 1: 포지션 ── */}
        {step === 1 && (
          <div>
            <div className="eyebrow" style={{marginBottom:6, color:'var(--accent)'}}>1 · POSITION</div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>주 포지션을 골라 주세요</h1>
            <p style={{margin:'0 0 22px', fontSize:13, color:'var(--ink-mute)'}}>나중에 프로필에서 변경할 수 있어요</p>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
              {POSITIONS.map(p => (
                <button key={p.id} onClick={()=>update('pos', p.id)} style={{
                  padding:'16px 12px', textAlign:'center', cursor:'pointer',
                  background: data.pos === p.id ? 'color-mix(in oklab, var(--accent) 8%, transparent)' : 'var(--bg-alt)',
                  border: data.pos === p.id ? '2px solid var(--accent)' : '2px solid var(--border)',
                  borderRadius:8,
                }}>
                  <div style={{fontSize:18, fontWeight:900, fontFamily:'var(--ff-display)', marginBottom:4}}>{p.id}</div>
                  <div style={{fontSize:11, fontWeight:700, marginBottom:2}}>{p.label}</div>
                  <div style={{fontSize:10, color:'var(--ink-dim)'}}>{p.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: 키·체중 ── */}
        {step === 2 && (
          <div>
            <div className="eyebrow" style={{marginBottom:6, color:'var(--accent)'}}>2 · BODY</div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>신체 정보를 입력해 주세요</h1>
            <p style={{margin:'0 0 22px', fontSize:13, color:'var(--ink-mute)'}}>매칭 정확도를 높이는 데 사용됩니다 · 비공개 가능</p>
            <div style={{display:'grid', gap:18}}>
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                  <label style={{fontSize:13, fontWeight:700}}>키</label>
                  <span style={{fontSize:18, fontWeight:800, fontFamily:'var(--ff-display)', color:'var(--accent)'}}>{data.height} cm</span>
                </div>
                <input type="range" min="150" max="220" value={data.height} onChange={e=>update('height', parseInt(e.target.value))} style={{width:'100%'}}/>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--ink-dim)', marginTop:4}}>
                  <span>150</span><span>185</span><span>220</span>
                </div>
              </div>
              <div>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8}}>
                  <label style={{fontSize:13, fontWeight:700}}>체중</label>
                  <span style={{fontSize:18, fontWeight:800, fontFamily:'var(--ff-display)', color:'var(--accent)'}}>{data.weight} kg</span>
                </div>
                <input type="range" min="40" max="150" value={data.weight} onChange={e=>update('weight', parseInt(e.target.value))} style={{width:'100%'}}/>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--ink-dim)', marginTop:4}}>
                  <span>40</span><span>95</span><span>150</span>
                </div>
              </div>
              <label style={{display:'flex', gap:8, alignItems:'center', fontSize:12, color:'var(--ink-mute)', cursor:'pointer'}}>
                <input type="checkbox" defaultChecked/> 신체 정보 비공개
              </label>
            </div>
          </div>
        )}

        {/* ── Step 3: 활동 지역 ── */}
        {step === 3 && (
          <div>
            <div className="eyebrow" style={{marginBottom:6, color:'var(--accent)'}}>3 · AREA</div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>주로 어디서 뛰나요?</h1>
            <p style={{margin:'0 0 22px', fontSize:13, color:'var(--ink-mute)'}}>최대 3곳까지 선택 ({data.areas.length}/3)</p>
            <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
              {AREAS.map(a => {
                const on = data.areas.includes(a);
                const disabled = !on && data.areas.length >= 3;
                return (
                  <button key={a} onClick={()=>toggleArea(a)} disabled={disabled} style={{
                    padding:'10px 16px', cursor: disabled ? 'not-allowed' : 'pointer',
                    background: on ? 'var(--accent)' : 'var(--bg-alt)',
                    color: on ? '#fff' : 'var(--ink)',
                    border: on ? '2px solid var(--accent)' : '2px solid var(--border)',
                    borderRadius:'var(--radius-chip)',
                    fontSize:13, fontWeight:600,
                    opacity: disabled ? 0.4 : 1,
                  }}>{a}</button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 4: 사진 ── */}
        {step === 4 && (
          <div>
            <div className="eyebrow" style={{marginBottom:6, color:'var(--accent)'}}>4 · PHOTO</div>
            <h1 style={{margin:'0 0 4px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em'}}>프로필 사진을 추가해 주세요</h1>
            <p style={{margin:'0 0 22px', fontSize:13, color:'var(--ink-mute)'}}>나중에 추가해도 괜찮아요</p>
            <div style={{display:'grid', placeItems:'center', padding:'32px 20px', background:'var(--bg-alt)', border:'2px dashed var(--border)', borderRadius:8}}>
              <div style={{width:96, height:96, borderRadius:'50%', background:'var(--bg-elev)', border:'1px solid var(--border)', display:'grid', placeItems:'center', marginBottom:14}}>
                <span className="material-symbols-outlined" style={{fontSize:42, color:'var(--ink-dim)'}}>person</span>
              </div>
              <button className="btn btn--primary btn--sm">사진 업로드</button>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:10}}>JPG·PNG / 5MB 이하</div>
            </div>
            <label style={{display:'flex', gap:8, alignItems:'flex-start', fontSize:12, color:'var(--ink-mute)', cursor:'pointer', marginTop:14, lineHeight:1.5}}>
              <input type="checkbox" style={{marginTop:2}}/>
              <span>나중에 사진 추가하기 — 프로필 설정에서 언제든 변경할 수 있습니다.</span>
            </label>
          </div>
        )}

        <div style={{display:'flex', justifyContent:'space-between', marginTop:32, paddingTop:20, borderTop:'1px solid var(--border)'}}>
          <button className="btn" onClick={()=>step>1?setStep(step-1):setRoute('home')}>{step>1?'← 이전':'나가기'}</button>
          <button className="btn btn--primary btn--lg" onClick={()=>setStep(step+1)}>
            {step<total?'다음 →':'완료 →'}
          </button>
        </div>
      </div>

      {/* 단계 미리보기 */}
      <div style={{marginTop:14, fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>
        포지션 · 신체 · 지역 · 사진 — 약 1분 소요
      </div>
    </div>
  );
}

window.ProfileComplete = ProfileComplete;
