/* global React */

// ============================================================
// ProfilePreferences — /profile/preferences (Phase F2)
//
// 매칭 선호 (Onboarding Preferences 입력값 편집)
// 성별 / 연령대 / 레벨 분포 / BDR 점수 표시
// var(--cafe-blue) 정보 톤 (진단·점수 영역)
// ============================================================

const { useState: useStatePref } = React;

function ProfilePreferences({ setRoute }) {
  const [gender,    setGender]    = useStatePref('mixed');
  const [ages,      setAges]      = useStatePref(['20s', '30s']);
  const [levelMix,  setLevelMix]  = useStatePref('similar');
  const [intensity, setIntensity] = useStatePref('balanced');
  const [region,    setRegion]    = useStatePref(['gangnam', 'seocho', 'songpa']);
  const [scoreOpt,  setScoreOpt]  = useStatePref(true);

  const ageOpts = [
    { v:'teens',  l:'10대' },
    { v:'20s',    l:'20대' },
    { v:'30s',    l:'30대' },
    { v:'40s',    l:'40대' },
    { v:'50s+',   l:'50대+' },
  ];
  const regionOpts = [
    { v:'gangnam', l:'강남구' },
    { v:'seocho',  l:'서초구' },
    { v:'songpa',  l:'송파구' },
    { v:'gangdong',l:'강동구' },
    { v:'mapo',    l:'마포구' },
    { v:'yongsan', l:'용산구' },
    { v:'gwanak',  l:'관악구' },
    { v:'jongro',  l:'종로구' },
  ];
  const toggleAge    = (v) => setAges(ages.includes(v) ? ages.filter(x=>x!==v) : [...ages, v]);
  const toggleRegion = (v) => setRegion(region.includes(v) ? region.filter(x=>x!==v) : [...region, v]);

  // BDR 점수 — 매칭 진단
  const score = {
    total:    82.4,
    manner:   91,
    presence: 96,
    skill:    78,
    comm:     65,
  };

  return (
    <div className="page" style={{maxWidth:880}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>매칭 선호</span>
      </div>

      {/* Hero */}
      <header style={{marginBottom:18}}>
        <div className="eyebrow">PREFERENCES</div>
        <h1 style={{margin:'4px 0 4px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1, 30px)', fontWeight:800, letterSpacing:'-0.015em'}}>
          매칭 선호
        </h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>
          매칭 알고리즘이 최우선 고려하는 항목입니다. 변경 시 즉시 반영돼요.
        </div>
      </header>

      {/* BDR 점수 — info hero (var(--cafe-blue) 톤) */}
      <div className="card" style={{
        padding:0, overflow:'hidden', marginBottom:14,
        border:'1px solid color-mix(in oklab, var(--cafe-blue) 28%, var(--border))',
      }}>
        <div className="pp-bdr" style={{
          display:'grid', gridTemplateColumns:'minmax(0, 220px) minmax(0, 1fr)',
          background:'linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))',
          color:'#fff',
        }}>
          <div style={{padding:'24px 26px', borderRight:'1px solid rgba(255,255,255,.16)'}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', opacity:.85}}>
              BDR 점수
            </div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:54, letterSpacing:'-0.02em', lineHeight:1, margin:'8px 0 4px'}}>
              {score.total}
            </div>
            <div style={{fontSize:12, opacity:.85}}>전국 상위 14% · A 등급</div>
            <div style={{
              display:'inline-block', marginTop:10, padding:'4px 8px',
              background:'rgba(255,255,255,.18)', borderRadius:3,
              fontSize:10, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase',
            }}>
              지난 달 +1.2 ▲
            </div>
          </div>
          <div className="pp-bdr-grid" style={{padding:'24px 26px', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
            {[
              { k:'매너',     v:score.manner,   d:'리뷰 평균' },
              { k:'출석',     v:score.presence, d:'노쇼 0회' },
              { k:'실력',     v:score.skill,    d:'레이팅 환산' },
              { k:'소통',     v:score.comm,     d:'쪽지·답장' },
            ].map(s => (
              <div key={s.k} style={{minWidth:0}}>
                <div style={{fontSize:11, opacity:.8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>{s.k}</div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:26, letterSpacing:'-0.01em', margin:'2px 0'}}>{s.v}</div>
                <div style={{height:4, background:'rgba(255,255,255,.18)', borderRadius:2, overflow:'hidden', marginBottom:4}}>
                  <div style={{width:`${s.v}%`, height:'100%', background:'rgba(255,255,255,.95)'}}/>
                </div>
                <div style={{fontSize:10, opacity:.8}}>{s.d}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{padding:'14px 22px', background:'var(--bg-alt)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
          <div style={{fontSize:12, color:'var(--ink-soft)'}}>
            점수가 높을수록 좋은 매칭이 우선 노출됩니다. <strong style={{color:'var(--ink)'}}>소통 점수가 가장 낮아요</strong> — 쪽지 답장 속도를 올려보세요.
          </div>
          <button className="btn btn--sm" onClick={()=>setRoute('profileGrowth')} style={{minHeight:36}}>점수 가이드 →</button>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1fr) minmax(0, 1fr)', gap:14}} className="pp-split">
        {/* 성별 */}
        <PrefCard label="성별 매칭" desc="누구와 함께 뛸지">
          <Seg value={gender} onChange={setGender} options={[
            { v:'any',    l:'상관없음' },
            { v:'mixed',  l:'혼성 환영' },
            { v:'same',   l:'동성만' },
          ]}/>
        </PrefCard>

        {/* 강도 */}
        <PrefCard label="경기 분위기" desc="얼마나 진지하게 임할지">
          <Seg value={intensity} onChange={setIntensity} options={[
            { v:'fun',      l:'재미 위주' },
            { v:'balanced', l:'균형' },
            { v:'serious',  l:'진지' },
          ]}/>
        </PrefCard>

        {/* 연령대 */}
        <PrefCard label="연령대" desc={`선택 ${ages.length}/${ageOpts.length}`}>
          <ChipGroup options={ageOpts} value={ages} onToggle={toggleAge} cols={5}/>
        </PrefCard>

        {/* 레벨 분포 */}
        <PrefCard label="레벨 분포" desc="상대 실력 범위">
          <Seg value={levelMix} onChange={setLevelMix} options={[
            { v:'similar', l:'비슷한 레벨' },
            { v:'open',    l:'전체 허용' },
            { v:'strong',  l:'더 강한 상대' },
          ]} stack/>
        </PrefCard>
      </div>

      {/* 활동 지역 */}
      <div className="card" style={{padding:'22px 24px', marginTop:14}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10, flexWrap:'wrap', gap:8}}>
          <div>
            <div style={{fontWeight:700, fontSize:15}}>활동 지역</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>선택 {region.length}개 — 우선 노출되는 모집글 지역</div>
          </div>
          <a onClick={()=>setRoute('onboardingEnvironment')} style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>온보딩에서 편집 →</a>
        </div>
        <ChipGroup options={regionOpts} value={region} onToggle={toggleRegion} cols={4}/>
      </div>

      {/* 점수 시스템 옵트인 */}
      <div className="card" style={{padding:'22px 24px', marginTop:14}}>
        <SettingsToggleLite
          on={scoreOpt}
          onChange={setScoreOpt}
          label="BDR 점수 공개"
          desc="다른 사용자가 내 매칭 점수를 볼 수 있도록 허용 — 좋은 매칭에 도움됩니다"
        />
      </div>

      {/* 저장/취소 */}
      <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:18, flexWrap:'wrap'}}>
        <button className="btn btn--sm" onClick={()=>setRoute('profile')} style={{minHeight:44, minWidth:100}}>취소</button>
        <button className="btn btn--primary btn--sm" onClick={()=>setRoute('profile')} style={{minHeight:44, minWidth:120}}>저장</button>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .pp-split { grid-template-columns: 1fr !important; }
          .pp-bdr { grid-template-columns: 1fr !important; }
          .pp-bdr > div:first-child { border-right: 0 !important; border-bottom: 1px solid rgba(255,255,255,.16) !important; }
          .pp-bdr-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// 공통
// ============================================================
function PrefCard({ label, desc, children }) {
  return (
    <div className="card" style={{padding:'18px 20px'}}>
      <div style={{marginBottom:10}}>
        <div style={{fontWeight:700, fontSize:14}}>{label}</div>
        {desc && <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function Seg({ value, onChange, options, stack }) {
  return (
    <div style={{
      display: stack ? 'grid' : 'flex',
      gridTemplateColumns: stack ? '1fr' : undefined,
      gap: 6,
    }}>
      {options.map(o => {
        const on = value === o.v;
        return (
          <button key={o.v} onClick={()=>onChange(o.v)} style={{
            flex: stack ? undefined : 1,
            padding:'12px 14px', minHeight:44,
            background: on ? 'var(--cafe-blue-soft)' : 'transparent',
            color: on ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
            border:`1px solid ${on ? 'var(--cafe-blue-hair, var(--cafe-blue))' : 'var(--border)'}`,
            borderRadius:6, cursor:'pointer',
            fontSize:13, fontWeight: on ? 700 : 500,
            textAlign: stack ? 'left' : 'center',
          }}>
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

function ChipGroup({ options, value, onToggle, cols }) {
  return (
    <div className="pp-chips" style={{display:'grid', gridTemplateColumns:`repeat(${cols}, 1fr)`, gap:6}}>
      {options.map(o => {
        const on = value.includes(o.v);
        return (
          <button key={o.v} onClick={()=>onToggle(o.v)} style={{
            minHeight:44, padding:'10px 12px',
            background: on ? 'var(--cafe-blue-soft)' : 'transparent',
            color: on ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
            border:`1px solid ${on ? 'var(--cafe-blue-hair, var(--cafe-blue))' : 'var(--border)'}`,
            borderRadius:6, cursor:'pointer',
            fontSize:13, fontWeight: on ? 700 : 500,
          }}>
            {o.l}
          </button>
        );
      })}
      <style>{`
        @media (max-width: 720px) {
          .pp-chips { grid-template-columns: repeat(3, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function SettingsToggleLite({ on, onChange, label, desc }) {
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
      <div style={{minWidth:0, flex:1}}>
        <div style={{fontWeight:600, fontSize:14, color:'var(--ink)'}}>{label}</div>
        {desc && <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{desc}</div>}
      </div>
      <button
        type="button" role="switch" aria-checked={on} aria-label={label}
        onClick={()=>onChange(!on)}
        style={{
          position:'relative', width:44, height:26, minWidth:44,
          padding:0, border:0, cursor:'pointer',
          background: on ? 'var(--cafe-blue)' : 'var(--bg-alt)',
          borderRadius:13, transition:'background .2s', flex:'0 0 auto',
        }}
      >
        <span style={{
          position:'absolute', top:3, left:3,
          width:20, height:20, borderRadius:'50%', background:'#fff',
          transform: on ? 'translateX(18px)' : 'translateX(0)',
          transition:'transform .2s',
          boxShadow:'0 1px 3px rgba(0,0,0,.25)',
        }}/>
      </button>
    </div>
  );
}

window.ProfilePreferences = ProfilePreferences;
