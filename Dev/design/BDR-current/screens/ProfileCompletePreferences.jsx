/* global React */

/**
 * ProfileCompletePreferences — /profile/complete/preferences (D등급 P2-10 신규)
 *
 * Why: ProfileComplete (기본 정보) 완료 후 follow-up — 매칭 정확도 향상용 취향 설정
 *      ProfileComplete = 4 step (포지션/키/지역/사진), 이건 4 step (스킬/스타일/요일·시간/목표)
 * Pattern: ProfileComplete.jsx 와 동일 wizard (진행바 + step + 좌측 nav 없음, 단순 next/back)
 *
 * 진입: ProfileComplete 완료 화면 "취향 설정 →" / /profile "프로필 보강하기" 카드
 * 복귀: 마지막 step 완료 → /home / 건너뛰기 → /home
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점         | 모바일
 *   진행바 4 step     | ProfileComplete ✅ | ✅ 동일 톤   | 후속 wizard   | OK
 *   1) 스킬 자가평가  | -        | ✅ 5축 슬라이더    | -            | 1열
 *   2) 플레이 스타일  | -        | ✅ 6 카드 multi    | -            | 2열
 *   3) 활동 요일/시간 | -        | ✅ grid + chips    | -            | 가로 hscroll
 *   4) 목표·동기      | -        | ✅ 4 카드 multi    | -            | 1열
 *   완료 → 홈         | -        | ✅                  | -            | OK
 */

function ProfileCompletePreferences({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const total = 4;

  const [data, setData] = React.useState({
    skills: { shoot:3, drive:3, def:3, pass:3, reb:3 },
    styles: [],         // multi
    days:   [],         // multi
    times:  [],         // multi
    goals:  [],         // multi
  });
  const upd = (k, v) => setData({ ...data, [k]: v });
  const toggle = (k, v) => {
    const arr = data[k];
    upd(k, arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]);
  };
  const setSkill = (k, v) => upd('skills', { ...data.skills, [k]: v });

  // ── 완료 화면 ──
  if (step === total + 1) {
    return (
      <div className="page" style={{maxWidth:560, paddingTop:60}}>
        <div className="card" style={{padding:'48px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg, var(--cafe-blue), #4F46E5)', color:'#fff', display:'grid', placeItems:'center', fontSize:32, margin:'0 auto 18px'}}>🎯</div>
          <h1 style={{margin:'0 0 8px', fontSize:24, fontWeight:800, letterSpacing:'-0.02em'}}>취향 설정 완료!</h1>
          <p style={{margin:'0 0 24px', fontSize:14, color:'var(--ink-mute)', lineHeight:1.6}}>
            맞춤 추천이 더 정확해졌어요.<br/>
            홈에서 추천 픽업·게스트 모집을 확인해 보세요.
          </p>
          <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('home')}>홈으로 →</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:620, paddingTop:30}}>
      {/* 진행 막대 — ProfileComplete 와 동일 톤 */}
      <div style={{marginBottom:24}}>
        <div style={{display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>
          <span>STEP {step} / {total} · 취향 설정</span>
          <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>건너뛰기</a>
        </div>
        <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
          <div style={{width:`${(step/total)*100}%`, height:'100%', background:'var(--cafe-blue)', transition:'width .3s'}}/>
        </div>
      </div>

      {/* STEP 1: 스킬 자가평가 */}
      {step === 1 && (
        <div className="card" style={{padding:'30px 32px'}}>
          <div className="eyebrow" style={{marginBottom:6}}>STEP 1 · SKILLS</div>
          <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>스킬 자가평가</h1>
          <p style={{margin:'0 0 24px', fontSize:13, color:'var(--ink-mute)'}}>1 (입문) ~ 5 (수준급) · 비교 매칭에만 사용됩니다.</p>

          {[
            { k:'shoot', label:'슈팅' },
            { k:'drive', label:'돌파' },
            { k:'def',   label:'수비' },
            { k:'pass',  label:'패스' },
            { k:'reb',   label:'리바운드' },
          ].map(s => (
            <div key={s.k} style={{marginBottom:18}}>
              <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
                <span style={{fontSize:13, fontWeight:600}}>{s.label}</span>
                <span style={{fontSize:13, fontFamily:'var(--ff-mono)', color:'var(--cafe-blue)', fontWeight:700}}>{data.skills[s.k]} / 5</span>
              </div>
              <div style={{display:'flex', gap:6}}>
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={()=>setSkill(s.k, n)} style={{
                    flex:1, height:36, borderRadius:6, fontSize:13, fontWeight:700,
                    border: n <= data.skills[s.k] ? '1px solid var(--cafe-blue)' : '1px solid var(--border)',
                    background: n <= data.skills[s.k] ? 'var(--cafe-blue)' : 'var(--bg-elev)',
                    color: n <= data.skills[s.k] ? '#fff' : 'var(--ink-soft)',
                    cursor:'pointer', transition:'all .15s',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 2: 플레이 스타일 */}
      {step === 2 && (
        <div className="card" style={{padding:'30px 32px'}}>
          <div className="eyebrow" style={{marginBottom:6}}>STEP 2 · STYLE</div>
          <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>플레이 스타일</h1>
          <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>해당하는 항목 모두 선택 · 복수 선택 가능</p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:8}}>
            {[
              { id:'aggressive', icon:'🔥', label:'공격적', desc:'적극적인 돌파·도전' },
              { id:'team',       icon:'🤝', label:'팀 플레이', desc:'어시스트·스크린' },
              { id:'shooter',    icon:'🎯', label:'슈터형',   desc:'외곽 슈팅 위주' },
              { id:'paint',      icon:'💪', label:'골밑형',   desc:'페인트존 지배' },
              { id:'allround',   icon:'⚡', label:'올라운드', desc:'다재다능' },
              { id:'chill',      icon:'😎', label:'재미 우선', desc:'경쟁보다 즐거움' },
            ].map(s => {
              const on = data.styles.includes(s.id);
              return (
                <button key={s.id} onClick={()=>toggle('styles', s.id)} style={{
                  textAlign:'left', padding:'14px 16px', borderRadius:8,
                  border: on ? '1.5px solid var(--cafe-blue)' : '1px solid var(--border)',
                  background: on ? 'color-mix(in oklab, var(--cafe-blue) 8%, transparent)' : 'var(--bg-elev)',
                  cursor:'pointer', transition:'all .15s',
                }}>
                  <div style={{fontSize:22, marginBottom:4}}>{s.icon}</div>
                  <div style={{fontSize:13, fontWeight:700, marginBottom:2, color: on ? 'var(--cafe-blue)' : 'var(--ink)'}}>{s.label}</div>
                  <div style={{fontSize:11, color:'var(--ink-mute)'}}>{s.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: 활동 요일/시간 */}
      {step === 3 && (
        <div className="card" style={{padding:'30px 32px'}}>
          <div className="eyebrow" style={{marginBottom:6}}>STEP 3 · WHEN</div>
          <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>활동 요일·시간</h1>
          <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>주로 활동 가능한 요일과 시간대를 선택해주세요.</p>

          <div style={{fontSize:12, fontWeight:700, color:'var(--ink-soft)', marginBottom:8}}>요일</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(7, 1fr)', gap:6, marginBottom:20}}>
            {['월','화','수','목','금','토','일'].map(d => {
              const on = data.days.includes(d);
              return (
                <button key={d} onClick={()=>toggle('days', d)} style={{
                  height:42, borderRadius:6, fontSize:13, fontWeight:700,
                  border: on ? '1.5px solid var(--cafe-blue)' : '1px solid var(--border)',
                  background: on ? 'var(--cafe-blue)' : 'var(--bg-elev)',
                  color: on ? '#fff' : 'var(--ink-soft)',
                  cursor:'pointer',
                }}>{d}</button>
              );
            })}
          </div>

          <div style={{fontSize:12, fontWeight:700, color:'var(--ink-soft)', marginBottom:8}}>시간대</div>
          <div className="hscroll" style={{display:'flex', gap:6, overflowX:'auto', paddingBottom:4}}>
            {[
              { id:'dawn',    label:'새벽 (5-8시)' },
              { id:'morning', label:'오전 (8-12시)' },
              { id:'lunch',   label:'점심 (12-14시)' },
              { id:'afternoon', label:'오후 (14-18시)' },
              { id:'evening', label:'저녁 (18-22시)' },
              { id:'late',    label:'심야 (22-25시)' },
            ].map(t => {
              const on = data.times.includes(t.id);
              return (
                <button key={t.id} onClick={()=>toggle('times', t.id)} style={{
                  flexShrink:0, padding:'10px 16px', borderRadius:20, fontSize:12, fontWeight:600,
                  border: on ? '1.5px solid var(--cafe-blue)' : '1px solid var(--border)',
                  background: on ? 'color-mix(in oklab, var(--cafe-blue) 12%, transparent)' : 'var(--bg-elev)',
                  color: on ? 'var(--cafe-blue)' : 'var(--ink-soft)',
                  cursor:'pointer', whiteSpace:'nowrap',
                }}>{t.label}</button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 4: 목표 */}
      {step === 4 && (
        <div className="card" style={{padding:'30px 32px'}}>
          <div className="eyebrow" style={{marginBottom:6}}>STEP 4 · GOALS</div>
          <h1 style={{margin:'0 0 6px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>이 앱에서 원하는 것</h1>
          <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)'}}>매칭 추천 우선순위에 반영됩니다 · 복수 선택 가능</p>
          <div style={{display:'grid', gap:8}}>
            {[
              { id:'fun',     icon:'sports_basketball', label:'재미있게 농구하기',    desc:'픽업·캐주얼 게임 중심' },
              { id:'compete', icon:'emoji_events',      label:'경쟁적인 경기',         desc:'리그·토너먼트' },
              { id:'improve', icon:'trending_up',       label:'실력 향상',             desc:'코칭·피드백' },
              { id:'social',  icon:'group',             label:'새로운 친구·팀 만나기', desc:'커뮤니티 중심' },
            ].map(g => {
              const on = data.goals.includes(g.id);
              return (
                <button key={g.id} onClick={()=>toggle('goals', g.id)} style={{
                  textAlign:'left', padding:'14px 18px', borderRadius:8,
                  border: on ? '1.5px solid var(--cafe-blue)' : '1px solid var(--border)',
                  background: on ? 'color-mix(in oklab, var(--cafe-blue) 8%, transparent)' : 'var(--bg-elev)',
                  cursor:'pointer', display:'grid', gridTemplateColumns:'40px 1fr auto', gap:14, alignItems:'center',
                }}>
                  <span className="material-symbols-outlined" style={{fontSize:28, color: on ? 'var(--cafe-blue)' : 'var(--ink-mute)'}}>{g.icon}</span>
                  <div>
                    <div style={{fontSize:14, fontWeight:700, marginBottom:2, color: on ? 'var(--cafe-blue)' : 'var(--ink)'}}>{g.label}</div>
                    <div style={{fontSize:12, color:'var(--ink-mute)'}}>{g.desc}</div>
                  </div>
                  <span style={{
                    width:22, height:22, borderRadius:'50%',
                    border: on ? '6px solid var(--cafe-blue)' : '1.5px solid var(--border)',
                    background: on ? '#fff' : 'transparent',
                  }}/>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{display:'flex', gap:8, marginTop:18}}>
        {step > 1 && (
          <button className="btn btn--lg" onClick={()=>setStep(step-1)} style={{flex:'0 0 auto'}}>← 이전</button>
        )}
        <button className="btn btn--primary btn--lg" onClick={()=>setStep(step+1)} style={{flex:1}}>
          {step === total ? '완료' : '다음 →'}
        </button>
      </div>
    </div>
  );
}

window.ProfileCompletePreferences = ProfileCompletePreferences;
