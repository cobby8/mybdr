/* global React, Icon */

/**
 * SeriesEdition — /organizations/[slug]/series/[seriesSlug] 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 시리즈 상세 — 회차(edition) 타임라인. 각 대회 시간순 + 상태 + 우승팀
 * 진입: /organizations/[slug] 단체 상세 → 시리즈 카드 클릭
 * 복귀: 회차 클릭 → /tournaments/[id] 대회 상세
 *
 * 데이터 모델: tournament_series → tournaments[] (edition_number, status, champion_team_id)
 */
function SeriesEdition({ setRoute }) {
  // mock 시리즈 + 5회차
  const series = {
    name: 'Kings Cup',
    description: '서울 3x3 정기 시리즈 — 분기별 정점 토너먼트',
    org: { name:'서울 3x3 연합', slug:'seoul-3x3' },
    editions: [
      { id:7, num:7, name:'Kings Cup Vol.07', status:'in_progress', date:'2026.05.08', venue:'장충체육관',  teams:'12/16', champ:null },
      { id:6, num:6, name:'Kings Cup Vol.06', status:'completed',  date:'2026.02.14', venue:'잠실종합운동장', teams:'16/16', champ:'REDEEM' },
      { id:5, num:5, name:'Kings Cup Vol.05', status:'completed',  date:'2025.11.22', venue:'올림픽공원',     teams:'16/16', champ:'SWEEP' },
      { id:4, num:4, name:'Kings Cup Vol.04', status:'completed',  date:'2025.08.16', venue:'장충체육관',     teams:'14/16', champ:'IRON' },
      { id:3, num:3, name:'Kings Cup Vol.03', status:'completed',  date:'2025.05.10', venue:'한강시민공원',   teams:'12/16', champ:'REDEEM' },
    ],
  };

  const STATUS = {
    draft:       { label:'준비중', color:'var(--ink-mute)' },
    upcoming:    { label:'예정',   color:'var(--cafe-blue)' },
    registration:{ label:'접수중', color:'var(--cafe-blue)' },
    open:        { label:'접수중', color:'var(--cafe-blue)' },
    in_progress: { label:'진행중', color:'var(--accent)' },
    live:        { label:'진행중', color:'var(--accent)' },
    completed:   { label:'종료',   color:'var(--ink-dim)' },
    ended:       { label:'종료',   color:'var(--ink-dim)' },
    cancelled:   { label:'취소',   color:'var(--ink-dim)' },
  };

  return (
    <div className="page" style={{maxWidth:760, margin:'0 auto', padding:'24px 20px 80px'}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:14}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('orgDetail')} style={{cursor:'pointer'}}>{series.org.name}</a><span>›</span>
        <span style={{color:'var(--ink)'}}>{series.name}</span>
      </div>

      {/* 시리즈 헤더 */}
      <div style={{marginBottom:28}}>
        <div className="eyebrow" style={{fontSize:11, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)'}}>SERIES</div>
        <h1 style={{margin:'4px 0 6px', fontSize:26, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>{series.name}</h1>
        <p style={{margin:'0 0 4px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>{series.description}</p>
        <p style={{margin:0, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>총 {series.editions.length}회차</p>
      </div>

      {/* 회차 타임라인 — 좌측 세로선 + 도트 */}
      <div style={{position:'relative'}}>
        <div style={{position:'absolute', left:20, top:0, bottom:0, width:2, background:'var(--border)'}}></div>

        <div style={{display:'flex', flexDirection:'column', gap:14}}>
          {series.editions.map(t => {
            const st = STATUS[t.status] || STATUS.draft;
            const isCompleted = t.status === 'completed' || t.status === 'ended';
            return (
              <div key={t.id} style={{position:'relative', paddingLeft:48}}>
                {/* 타임라인 도트 */}
                <div style={{
                  position:'absolute', left:14, top:18,
                  width:14, height:14, borderRadius:'50%',
                  border:'2px solid ' + st.color,
                  background: isCompleted ? st.color : 'var(--surface)',
                }}></div>

                {/* 회차 카드 */}
                <a onClick={()=>setRoute('match')} className="card" style={{
                  display:'block', padding:'14px 18px', cursor:'pointer',
                  textDecoration:'none', color:'inherit',
                }}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12}}>
                    <div style={{minWidth:0, flex:1}}>
                      <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>
                        <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginRight:6}}>#{t.num}</span>
                        {t.name}
                      </div>
                      <div style={{display:'flex', gap:8, alignItems:'center', fontSize:11, color:'var(--ink-mute)', flexWrap:'wrap'}}>
                        <span style={{fontFamily:'var(--ff-mono)'}}>{t.date}</span>
                        <span>·</span>
                        <span>{t.venue}</span>
                        <span>·</span>
                        <span>{t.teams}팀</span>
                      </div>
                    </div>
                    {/* 상태 뱃지 */}
                    <span style={{
                      fontSize:11, fontWeight:600, padding:'3px 10px', borderRadius:'50%',
                      color: st.color,
                      background: 'color-mix(in srgb, ' + st.color + ' 12%, transparent)',
                      whiteSpace:'nowrap',
                    }}>{st.label}</span>
                  </div>

                  {/* 우승팀 (종료된 회차만) */}
                  {isCompleted && t.champ && (
                    <div style={{
                      marginTop:8, paddingTop:8, borderTop:'1px solid var(--border)',
                      display:'flex', alignItems:'center', gap:6,
                      fontSize:12,
                    }}>
                      <span style={{color:'var(--accent)', fontSize:14}}>🏆</span>
                      <span style={{color:'var(--accent)', fontWeight:700}}>우승: {t.champ}</span>
                    </div>
                  )}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* 비어있는 시리즈 안내 (조건부 — 시안 데모는 5건) */}
      {series.editions.length === 0 && (
        <p style={{padding:'40px 20px', textAlign:'center', fontSize:13, color:'var(--ink-dim)'}}>
          아직 등록된 대회가 없습니다.
        </p>
      )}
    </div>
  );
}

window.SeriesEdition = SeriesEdition;
