/* global React */

function Series({ setRoute }) {
  const series = [
    { slug:'bdr-challenge', name:'BDR CHALLENGE', tagline:'3x3 오픈 챔피언십', editions:8, latest:'SPRING 2026', accent:'#E31B23', status:'live', next:'D-14', host:'BDR 사무국' },
    { slug:'kings-cup', name:'KINGS CUP', tagline:'왕좌는 하나다', editions:7, latest:'VOL. 07', accent:'#0F5FCC', status:'closing', next:'D-3', host:'KINGS BASKETBALL' },
    { slug:'midnight-3on3', name:'MIDNIGHT 3on3', tagline:'밤의 코트', editions:12, latest:'EP. 12', accent:'#7C3AED', status:'preparing', next:'D-32', host:'한강사이드' },
    { slug:'rookie-league', name:'ROOKIE LEAGUE', tagline:'신인 등용문', editions:4, latest:'2026 SEASON 1', accent:'#10B981', status:'open', next:'D-7', host:'BDR x 학원연합' },
    { slug:'queens-court', name:'QUEENS COURT', tagline:'여성부 정규 시리즈', editions:5, latest:'SPRING CUP', accent:'#EC4899', status:'open', next:'D-9', host:'QC 사무국' },
    { slug:'street-classic', name:'STREET CLASSIC', tagline:'스트릿 정통파', editions:9, latest:'CHAPTER 09', accent:'#F59E0B', status:'ended', next:'다음 회차 미정', host:'스트릿클래식' },
  ];
  const statusLabel = { live:'진행중', closing:'마감임박', open:'접수중', preparing:'접수예정', ended:'완료' };
  const statusBadge = { live:'badge--red', closing:'badge--red', open:'badge--ok', preparing:'badge--soft', ended:'badge--ghost' };

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10}}>
        <div>
          <div className="eyebrow">시리즈 · SERIES</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>대회 시리즈 허브</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>정기적으로 열리는 모든 시리즈와 그 회차의 계보</div>
        </div>
        <button className="btn btn--primary" onClick={()=>setRoute('seriesCreate')}>+ 시리즈 만들기</button>
      </div>

      {/* spotlight */}
      <div className="card" style={{padding:0, marginBottom:20, overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr'}}>
        <div style={{background:`linear-gradient(135deg, ${series[0].accent}, ${series[0].accent}AA 50%, #0B0D10)`, color:'#fff', padding:'30px 32px'}}>
          <div style={{fontSize:11, letterSpacing:'.14em', fontWeight:800, opacity:.85, marginBottom:10}}>SPOTLIGHT · {series[0].editions}TH EDITION</div>
          <div style={{fontFamily:'var(--ff-display)', fontSize:40, fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.05}}>{series[0].name}</div>
          <div style={{fontSize:15, opacity:.9, marginTop:8}}>{series[0].tagline}</div>
        </div>
        <div style={{padding:'26px 30px', display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:12, color:'var(--ink-dim)', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:4}}>최신 회차</div>
            <div style={{fontWeight:800, fontSize:22, marginBottom:8}}>{series[0].latest}</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>16개 팀, 더블 엘리미네이션. 4월 11–12일 장충체육관에서 진행됩니다.</div>
          </div>
          <div style={{display:'flex', gap:8, marginTop:18}}>
            <button className="btn btn--primary" onClick={()=>setRoute('seriesDetail')}>회차 보기 →</button>
            <button className="btn">최근 우승자</button>
          </div>
        </div>
      </div>

      {/* grid */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14}}>
        {series.map(s => (
          <div key={s.slug} className="card" onClick={()=>setRoute('seriesDetail')} style={{padding:0, cursor:'pointer', overflow:'hidden'}}>
            <div style={{padding:'18px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14}}>
              <div style={{minWidth:0}}>
                <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:6}}>
                  <span className={`badge ${statusBadge[s.status]}`}>{statusLabel[s.status]}</span>
                  <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{s.next}</span>
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, letterSpacing:'-0.01em', marginBottom:2}}>{s.name}</div>
                <div style={{fontSize:13, color:'var(--ink-mute)'}}>{s.tagline}</div>
              </div>
              <div style={{width:48, height:48, background:s.accent, borderRadius:8, flex:'0 0 auto', display:'grid', placeItems:'center', color:'#fff', fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:13}}>
                {s.slug.split('-')[0].slice(0,3).toUpperCase()}
              </div>
            </div>
            <div style={{padding:'12px 20px', display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--ink-mute)', background:'var(--bg-alt)'}}>
              <span>{s.host}</span>
              <span><b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>{s.editions}</b>회 진행</span>
              <span>최신: <b style={{color:'var(--ink)'}}>{s.latest}</b></span>
            </div>
          </div>
        ))}
      </div>

      {/* about */}
      <div className="card" style={{padding:'18px 22px', marginTop:22, background:'var(--bg-alt)', borderLeft:'3px solid var(--cafe-blue)'}}>
        <div style={{display:'flex', gap:14, alignItems:'flex-start'}}>
          <div style={{fontSize:24}}>💡</div>
          <div>
            <div style={{fontWeight:700, marginBottom:4}}>시리즈란?</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', lineHeight:1.65}}>
              같은 주최자가 정기적으로 여는 대회들의 묶음입니다. 시리즈 페이지에는 <b>전 회차 우승팀·MVP·대진 결과</b>가 누적되며,
              내 팀이 출전한 시리즈 이력이 프로필에 기록됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.Series = Series;
