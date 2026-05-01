/* global React */

function CourtAdd({ setRoute }) {
  const [step, setStep] = React.useState(1);
  const [submitted, setSubmitted] = React.useState(false);
  const [data, setData] = React.useState({
    name: '',
    area: '서울',
    addr: '',
    type: 'outdoor',
    surface: 'urethane',
    hoops: 2,
    lighting: true,
    fee: 'free',
    feeAmount: 0,
    hours: '24시간',
    features: [],
    vibe: 'mixed',
    desc: '',
    photos: [],
  });
  const update = (k, v) => setData({...data, [k]:v});
  const toggleF = (f) => update('features', data.features.includes(f) ? data.features.filter(x=>x!==f) : [...data.features, f]);

  if (submitted) {
    return (
      <div className="page" style={{maxWidth:560}}>
        <div className="card" style={{padding:'40px 36px', textAlign:'center'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:40, margin:'0 auto 18px', fontWeight:900}}>✓</div>
          <h1 style={{margin:'0 0 6px', fontSize:22, fontWeight:800}}>코트 제보 완료</h1>
          <p style={{margin:'0 0 14px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
            BDR 운영팀이 <b>24~48시간 내</b> 검토 후 등록합니다.<br/>
            등록되면 <b>기여 배지</b>와 <b>포인트 500P</b>를 드려요.
          </p>
          <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, margin:'16px 0 22px', textAlign:'left'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6, letterSpacing:'.08em'}}>제보 요약</div>
            <div style={{display:'grid', gridTemplateColumns:'70px 1fr', gap:8, fontSize:13}}>
              <div style={{color:'var(--ink-dim)'}}>이름</div><div style={{fontWeight:700}}>{data.name || '(이름 없음)'}</div>
              <div style={{color:'var(--ink-dim)'}}>위치</div><div>{data.area} · {data.addr || '—'}</div>
              <div style={{color:'var(--ink-dim)'}}>유형</div><div>{data.type==='outdoor'?'야외':'실내'} · 골대 {data.hoops}개</div>
            </div>
          </div>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <button className="btn btn--lg" onClick={()=>setRoute('court')}>코트 목록</button>
            <button className="btn btn--primary btn--lg" onClick={()=>{setSubmitted(false); setStep(1); setData({...data, name:'', addr:''});}}>또 제보하기</button>
          </div>
        </div>
      </div>
    );
  }

  const Step = ({ n, l }) => (
    <div style={{flex:1, display:'flex', alignItems:'center', gap:6}}>
      <div style={{width:24, height:24, borderRadius:'50%', background: step>=n?'var(--accent)':'var(--bg-alt)', color: step>=n?'#fff':'var(--ink-dim)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:11}}>{step>n?'✓':n}</div>
      <div style={{fontSize:11, fontWeight:700, color: step>=n?'var(--ink)':'var(--ink-dim)'}}>{l}</div>
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('court')} style={{cursor:'pointer'}}>코트</a><span>›</span>
        <span style={{color:'var(--ink)'}}>코트 제보</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">COURT REPORT · 코트 제보</div>
        <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>새 코트 제보</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>BDR에 없는 코트를 발견했다면 알려주세요 · 등록되면 <b style={{color:'var(--accent)'}}>500P</b> 지급</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:18, alignItems:'flex-start'}}>
        <div className="card" style={{padding:'24px 28px'}}>
          <div style={{display:'flex', marginBottom:24, gap:20}}>
            <Step n={1} l="기본 정보"/>
            <Step n={2} l="시설·특징"/>
            <Step n={3} l="사진·설명"/>
          </div>

          {step === 1 && (
            <div>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>기본 정보</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>코트 이름 *</label>
                  <input className="input" value={data.name} onChange={e=>update('name', e.target.value)} placeholder="코트 이름"/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>지역 *</label>
                  <select className="input" value={data.area} onChange={e=>update('area', e.target.value)}>
                    {['서울','경기','인천','부산','대구','대전','광주','울산','기타'].map(a => <option key={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>운영 시간</label>
                  <input className="input" value={data.hours} onChange={e=>update('hours', e.target.value)} placeholder="24시간 / 09:00-22:00"/>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>상세 주소 *</label>
                  <input className="input" value={data.addr} onChange={e=>update('addr', e.target.value)} placeholder="도로명 또는 지번 주소"/>
                  <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>📍 주소를 입력하면 자동으로 지도에 표시됩니다</div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>유형</label>
                  <div style={{display:'flex', gap:6}}>
                    {[{v:'outdoor', l:'야외'},{v:'indoor', l:'실내'},{v:'mixed', l:'복합'}].map(t => (
                      <button key={t.v} onClick={()=>update('type', t.v)} className={`btn btn--sm ${data.type===t.v?'btn--primary':''}`} style={{flex:1}}>{t.l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>바닥</label>
                  <select className="input" value={data.surface} onChange={e=>update('surface', e.target.value)}>
                    <option value="urethane">우레탄</option>
                    <option value="asphalt">아스팔트</option>
                    <option value="wood">우드</option>
                    <option value="pvc">PVC</option>
                    <option value="concrete">콘크리트</option>
                  </select>
                </div>
              </div>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
                <button className="btn btn--primary" disabled={!data.name || !data.addr} onClick={()=>setStep(2)}>다음 →</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>시설·특징</h2>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:20}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>골대 수</label>
                  <div style={{display:'flex', gap:6}}>
                    {[1,2,4,6].map(n => (
                      <button key={n} onClick={()=>update('hoops', n)} className={`btn btn--sm ${data.hoops===n?'btn--primary':''}`} style={{flex:1}}>{n}개</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>조명</label>
                  <div style={{display:'flex', gap:6}}>
                    <button onClick={()=>update('lighting', true)} className={`btn btn--sm ${data.lighting?'btn--primary':''}`} style={{flex:1}}>있음</button>
                    <button onClick={()=>update('lighting', false)} className={`btn btn--sm ${!data.lighting?'btn--primary':''}`} style={{flex:1}}>없음</button>
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>이용료</label>
                  <div style={{display:'flex', gap:6, marginBottom:8}}>
                    <button onClick={()=>update('fee', 'free')} className={`btn btn--sm ${data.fee==='free'?'btn--primary':''}`} style={{flex:1}}>무료</button>
                    <button onClick={()=>update('fee', 'paid')} className={`btn btn--sm ${data.fee==='paid'?'btn--primary':''}`} style={{flex:1}}>유료</button>
                    <button onClick={()=>update('fee', 'reserve')} className={`btn btn--sm ${data.fee==='reserve'?'btn--primary':''}`} style={{flex:2}}>예약제</button>
                  </div>
                  {data.fee === 'paid' && <input className="input" type="number" value={data.feeAmount} onChange={e=>update('feeAmount', Number(e.target.value))} placeholder="시간당 이용료 (원)"/>}
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>편의시설 (복수)</label>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {['주차장','화장실','음수대','샤워실','라커','벤치','매점','와이파이','AED','응급실 인근','흡연 구역','자판기'].map(f => (
                      <button key={f} onClick={()=>toggleF(f)} className={`btn btn--sm ${data.features.includes(f)?'btn--primary':''}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div style={{gridColumn:'1/-1'}}>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>분위기</label>
                  <div style={{display:'flex', gap:6}}>
                    {[{v:'pickup', l:'픽업 위주'},{v:'practice', l:'개인 연습'},{v:'family', l:'가족·어린이'},{v:'mixed', l:'혼합'}].map(t => (
                      <button key={t.v} onClick={()=>update('vibe', t.v)} className={`btn btn--sm ${data.vibe===t.v?'btn--primary':''}`} style={{flex:1}}>{t.l}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
                <button className="btn" onClick={()=>setStep(1)}>← 이전</button>
                <button className="btn btn--primary" onClick={()=>setStep(3)}>다음 →</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{margin:'0 0 14px', fontSize:16, fontWeight:700}}>사진·설명</h2>
              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>사진 (최대 5장)</label>
              <div style={{padding:'24px', border:'2px dashed var(--border)', borderRadius:8, textAlign:'center', marginBottom:8, background:'var(--bg-alt)'}}>
                <div style={{fontSize:32, opacity:.3, marginBottom:6}}>📸</div>
                <div style={{fontSize:13, fontWeight:600}}>드래그하거나 클릭해서 업로드</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>JPG · PNG · 최대 5MB · 코트 전체가 보이는 사진이 좋아요</div>
                <button className="btn btn--sm" style={{marginTop:12}}>파일 선택</button>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:6, marginBottom:18}}>
                {[0,1,2].map(i => (
                  <div key={i} style={{aspectRatio:'1', background:`linear-gradient(135deg, ${['#DC2626','#0F5FCC','#10B981'][i]}88, ${['#DC2626','#0F5FCC','#10B981'][i]}44)`, borderRadius:4, display:'grid', placeItems:'center', color:'#fff', fontSize:22, fontWeight:900, position:'relative'}}>
                    <span style={{opacity:.5}}>🏀</span>
                    <button style={{position:'absolute', top:4, right:4, width:18, height:18, borderRadius:'50%', background:'rgba(0,0,0,.5)', color:'#fff', border:0, cursor:'pointer', fontSize:10}}>×</button>
                  </div>
                ))}
              </div>

              <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>한줄 설명 (선택)</label>
              <textarea className="input" rows={3} value={data.desc} onChange={e=>update('desc', e.target.value)} placeholder="코트 분위기·이용 팁 등" style={{resize:'vertical'}}/>

              <div style={{marginTop:18, padding:'12px 14px', background:'color-mix(in oklab, var(--accent) 5%, transparent)', borderLeft:'3px solid var(--accent)', borderRadius:4, fontSize:12, color:'var(--ink-soft)', lineHeight:1.6}}>
                제보해주신 내용은 BDR 운영팀 검토 후 공개됩니다. 허위 정보나 이미 등록된 코트일 경우 반려될 수 있어요.
              </div>

              <div style={{display:'flex', justifyContent:'space-between', marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
                <button className="btn" onClick={()=>setStep(2)}>← 이전</button>
                <button className="btn btn--primary btn--lg" onClick={()=>setSubmitted(true)}>제보하기</button>
              </div>
            </div>
          )}
        </div>

        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'18px 20px', background:'linear-gradient(135deg, #DC262622, #0F5FCC22)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>🎁 기여 보상</div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13}}><span>제보 승인</span><b style={{fontFamily:'var(--ff-mono)', color:'var(--accent)'}}>+500P</b></div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13}}><span>사진 3장 이상</span><b style={{fontFamily:'var(--ff-mono)', color:'var(--accent)'}}>+200P</b></div>
            <div style={{display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13}}><span>월 3회 이상 제보</span><b style={{fontFamily:'var(--ff-mono)', color:'var(--accent)'}}>🥇 배지</b></div>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>내 기여 현황</div>
            <div style={{fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900}}>3<span style={{fontSize:14, color:'var(--ink-dim)', fontWeight:700}}> 개 제보</span></div>
            <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>누적 포인트 1,200P · 🥈 은 기여자</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.CourtAdd = CourtAdd;
