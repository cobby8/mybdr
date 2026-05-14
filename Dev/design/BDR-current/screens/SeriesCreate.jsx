/* global React */

function SeriesCreate({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [data, setData] = React.useState({
    name:'', tagline:'', accent:'#E31B23', format:'3v3', frequency:'분기', firstDate:'',
    venue:'', capacity:16, fee:'', prize:'', visibility:'public',
  });
  const set = (k,v) => setData(d => ({...d, [k]:v}));

  return (
    <div className="page" style={{maxWidth:720}}>
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('series')} style={{cursor:'pointer'}}>시리즈</a> › <span style={{color:'var(--ink)'}}>새 시리즈 만들기</span>
      </div>

      <div className="eyebrow">시리즈 개설 · 5분 룰</div>
      <h1 style={{margin:'8px 0 6px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>새 시리즈 만들기</h1>
      <p style={{color:'var(--ink-mute)', fontSize:14, marginBottom:24, lineHeight:1.6}}>
        이름 입력 → 첫 회차 3필드 → 공개. 컴맹도 핸드폰만으로 5분이면 됩니다.
      </p>

      {/* progress */}
      <div style={{display:'flex', gap:6, marginBottom:24}}>
        {[1,2,3].map(n => (
          <div key={n} style={{flex:1, height:4, background: step>=n ? 'var(--cafe-blue)':'var(--border)', borderRadius:2}}/>
        ))}
      </div>

      {/* step 1 — series basics */}
      {step === 1 && (
        <div className="card" style={{padding:'24px 26px'}}>
          <div style={{fontSize:12, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', marginBottom:6}}>STEP 1 / 3</div>
          <h2 style={{margin:'0 0 18px', fontSize:18, fontWeight:700}}>시리즈 기본 정보</h2>

          <label className="label">시리즈 이름 *</label>
          <input className="input" placeholder="예) BDR CHALLENGE" value={data.name} onChange={e=>set('name', e.target.value)} autoFocus/>

          <div style={{height:14}}/>
          <label className="label">한 줄 태그라인</label>
          <input className="input" placeholder="예) 3x3 오픈 챔피언십" value={data.tagline} onChange={e=>set('tagline', e.target.value)}/>

          <div style={{height:14}}/>
          <label className="label">시리즈 색상</label>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            {['#E31B23','#0F5FCC','#7C3AED','#10B981','#F59E0B','#EC4899','#06B6D4','#0B0D10'].map(c => (
              <button key={c} onClick={()=>set('accent', c)} style={{width:34, height:34, background:c, border: data.accent===c?'3px solid var(--ink)':'2px solid var(--border)', borderRadius:6, cursor:'pointer', padding:0}}/>
            ))}
          </div>

          <div style={{display:'flex', gap:10, marginTop:24}}>
            <button className="btn btn--primary" disabled={!data.name} onClick={()=>setStep(2)}>다음 →</button>
            <button className="btn btn--ghost" onClick={()=>setRoute('series')}>취소</button>
          </div>
        </div>
      )}

      {/* step 2 — first edition */}
      {step === 2 && (
        <div className="card" style={{padding:'24px 26px'}}>
          <div style={{fontSize:12, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', marginBottom:6}}>STEP 2 / 3</div>
          <h2 style={{margin:'0 0 8px', fontSize:18, fontWeight:700}}>첫 회차 — 3필드만 채우면 끝</h2>
          <p style={{margin:'0 0 18px', fontSize:13, color:'var(--ink-mute)'}}>
            상세 규정·일정은 나중에 추가할 수 있어요.
          </p>

          <label className="label">개최 장소 *</label>
          <input className="input" placeholder="예) 장충체육관" value={data.venue} onChange={e=>set('venue', e.target.value)}/>

          <div style={{height:14}}/>
          <label className="label">개최일 *</label>
          <input className="input" type="date" value={data.firstDate} onChange={e=>set('firstDate', e.target.value)}/>

          <div style={{height:14}}/>
          <label className="label">참가 정원</label>
          <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
            {[8,12,16,24,32].map(n => (
              <button key={n} className="btn btn--sm" onClick={()=>set('capacity', n)}
                style={data.capacity===n?{background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'}:{}}>
                {n}팀
              </button>
            ))}
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:14}}>
            <div>
              <label className="label">참가비 (선택)</label>
              <input className="input" placeholder="₩80,000" value={data.fee} onChange={e=>set('fee', e.target.value)}/>
            </div>
            <div>
              <label className="label">상금 (선택)</label>
              <input className="input" placeholder="₩5,000,000" value={data.prize} onChange={e=>set('prize', e.target.value)}/>
            </div>
          </div>

          <div style={{display:'flex', gap:10, marginTop:24}}>
            <button className="btn btn--primary" disabled={!data.venue || !data.firstDate} onClick={()=>setStep(3)}>다음 →</button>
            <button className="btn btn--ghost" onClick={()=>setStep(1)}>← 이전</button>
          </div>
        </div>
      )}

      {/* step 3 — review & publish */}
      {step === 3 && (
        <div className="card" style={{padding:'24px 26px'}}>
          <div style={{fontSize:12, fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', marginBottom:6}}>STEP 3 / 3</div>
          <h2 style={{margin:'0 0 18px', fontSize:18, fontWeight:700}}>확인 후 공개</h2>

          <div style={{padding:'18px 20px', borderRadius:8, background:`linear-gradient(135deg, ${data.accent}, ${data.accent}AA)`, color:'#fff', marginBottom:16}}>
            <div style={{fontSize:11, opacity:.8, fontWeight:700, letterSpacing:'.1em', marginBottom:6}}>SERIES PREVIEW</div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, letterSpacing:'-0.01em'}}>{data.name || 'My Series'}</div>
            <div style={{fontSize:13, opacity:.9, marginTop:4}}>{data.tagline || '태그라인 없음'}</div>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'120px 1fr', rowGap:10, fontSize:14, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, marginBottom:18}}>
            <div style={{color:'var(--ink-dim)'}}>첫 회차</div><div>{data.venue || '—'} · {data.firstDate || '—'}</div>
            <div style={{color:'var(--ink-dim)'}}>경기 방식</div><div>{data.format} · {data.capacity}팀</div>
            <div style={{color:'var(--ink-dim)'}}>참가비</div><div>{data.fee || '무료'}</div>
            <div style={{color:'var(--ink-dim)'}}>상금</div><div>{data.prize || '미정'}</div>
          </div>

          <label className="label">공개 범위</label>
          <div style={{display:'flex', gap:6, marginBottom:18}}>
            {[['public','전체 공개'],['unlisted','링크 공유'],['private','초대만']].map(([k,l]) => (
              <button key={k} className="btn btn--sm" onClick={()=>set('visibility', k)}
                style={data.visibility===k ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'}:{}}>{l}</button>
            ))}
          </div>

          <div style={{display:'flex', gap:10}}>
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('seriesDetail')}>공개하고 시리즈 만들기 ✓</button>
            <button className="btn btn--ghost" onClick={()=>setStep(2)}>← 이전</button>
          </div>
        </div>
      )}
    </div>
  );
}

window.SeriesCreate = SeriesCreate;
