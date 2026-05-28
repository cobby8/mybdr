/* global React */

/**
 * ProfileBookings — /profile/bookings (D등급 P1-7 신규)
 *
 * Why: 본인 예약 내역 (코트 예약 / 토너먼트 신청 / 게스트 신청)
 * Pattern: 카테고리 탭 + 상태 필터 칩 + 카드 리스트
 *
 * 진입: 더보기 "내 활동" (메인) / /profile 본인 카드 보조 링크
 *       (확정: §1-3 빌링 탭 X — 결제 영수증과 혼동 방지)
 * 복귀: 항목 클릭 → 해당 상세 / 뒤로 → /profile
 */

function ProfileBookings({ setRoute }) {
  const [tab, setTab] = React.useState('all');
  const [status, setStatus] = React.useState('all');

  const items = [
    { id:1, kind:'court', title:'미사강변체육관 · A코트', sub:'2026.05.02 (목) 20:30 – 22:30', status:'upcoming', meta:'₩40,000 결제 완료', route:'courtDetail' },
    { id:2, kind:'tournament', title:'Kings Cup Vol.07 · 8강', sub:'2026.05.10 (토) 14:00', status:'upcoming', meta:'팀 REDEEM · 참가 확정', route:'matchDetail' },
    { id:3, kind:'guest', title:'목요일 저녁 미사 픽업', sub:'2026.05.02 (목) 20:30', status:'upcoming', meta:'호스트 승인 · ₩5,000', route:'gameDetail' },
    { id:4, kind:'court', title:'장충체육관 · 풀코트', sub:'2026.04.20 (일) 10:00 – 12:00', status:'done', meta:'₩60,000 · 영수증', route:'courtDetail' },
    { id:5, kind:'tournament', title:'BDR Challenge 예선', sub:'2026.04.12 (토)', status:'done', meta:'예선 탈락 · 4위', route:'matchDetail' },
    { id:6, kind:'guest', title:'주말 픽업 · 6:4', sub:'2026.04.18 (일) 09:00', status:'cancelled', meta:'호스트 취소 · 환불 완료', route:'gameDetail' },
  ];

  const tabs = [
    { id:'all', label:'전체', n: items.length },
    { id:'court', label:'코트 예약', n: items.filter(i=>i.kind==='court').length },
    { id:'tournament', label:'토너먼트', n: items.filter(i=>i.kind==='tournament').length },
    { id:'guest', label:'게스트', n: items.filter(i=>i.kind==='guest').length },
  ];
  const statuses = [
    { id:'all', label:'전체' },
    { id:'upcoming', label:'예약중', tone:'var(--ok)' },
    { id:'done', label:'완료', tone:'var(--ink-dim)' },
    { id:'cancelled', label:'취소', tone:'var(--bdr-red)' },
  ];
  const kindLabel = { court:'코트', tournament:'토너', guest:'게스트' };
  const kindTone = { court:'var(--cafe-blue)', tournament:'var(--accent)', guest:'#10B981' };
  const statusLabel = { upcoming:'예약중', done:'완료', cancelled:'취소' };
  const statusTone = { upcoming:'var(--ok)', done:'var(--ink-dim)', cancelled:'var(--bdr-red)' };

  const filtered = items.filter(i => (tab==='all'||i.kind===tab) && (status==='all'||i.status===status));

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>내 프로필</a><span>›</span>
        <span style={{color:'var(--ink)'}}>예약 내역</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">BOOKINGS · MY RESERVATIONS</div>
        <h1 style={{margin:'6px 0 4px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>예약 내역</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>코트·토너먼트·게스트 신청을 한곳에서 관리하세요</div>
      </div>

      {/* 탭 */}
      <div className="hscroll" style={{display:'flex', gap:6, borderBottom:'1px solid var(--border)', marginBottom:14, overflowX:'auto'}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 16px', background:'transparent', border:'none', cursor:'pointer',
            fontSize:13, fontWeight:600,
            color: tab===t.id ? 'var(--ink)' : 'var(--ink-mute)',
            borderBottom: tab===t.id ? '3px solid var(--accent)' : '3px solid transparent',
            flexShrink:0,
          }}>{t.label} <span style={{fontSize:11, color:'var(--ink-dim)'}}>{t.n}</span></button>
        ))}
      </div>

      {/* 상태 칩 */}
      <div style={{display:'flex', gap:6, marginBottom:18, flexWrap:'wrap'}}>
        {statuses.map(s => (
          <button key={s.id} onClick={()=>setStatus(s.id)} style={{
            padding:'6px 14px', borderRadius:'var(--radius-chip)',
            background: status===s.id ? 'var(--ink)' : 'var(--bg-alt)',
            color: status===s.id ? 'var(--bg)' : 'var(--ink)',
            border:'1px solid var(--border)', cursor:'pointer',
            fontSize:12, fontWeight:600,
          }}>{s.label}</button>
        ))}
      </div>

      {/* 리스트 */}
      {filtered.length === 0 ? (
        <div className="card" style={{padding:'48px 24px', textAlign:'center'}}>
          <div style={{fontSize:42, marginBottom:10}}>📅</div>
          <div style={{fontSize:15, fontWeight:700, marginBottom:6}}>해당 조건의 예약이 없습니다</div>
          <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:18}}>새 예약을 시작해 보세요</div>
          <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn" onClick={()=>setRoute('courts')}>코트 찾기</button>
            <button className="btn" onClick={()=>setRoute('match')}>대회 보기</button>
            <button className="btn btn--primary" onClick={()=>setRoute('games')}>경기 찾기</button>
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gap:10, marginBottom:40}}>
          {filtered.map(it => (
            <div key={it.id} className="card" style={{padding:'16px 20px', display:'flex', alignItems:'center', gap:14, cursor:'pointer'}} onClick={()=>setRoute(it.route)}>
              <div style={{width:8, height:48, background:kindTone[it.kind], borderRadius:2, flexShrink:0}}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4, flexWrap:'wrap'}}>
                  <span style={{fontSize:10, fontWeight:800, letterSpacing:'.1em', color:kindTone[it.kind], background:`color-mix(in oklab, ${kindTone[it.kind]} 12%, transparent)`, padding:'2px 8px', borderRadius:3}}>{kindLabel[it.kind]}</span>
                  <span style={{fontSize:10, fontWeight:700, color:statusTone[it.status]}}>● {statusLabel[it.status]}</span>
                </div>
                <div style={{fontSize:14, fontWeight:700, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{it.title}</div>
                <div style={{fontSize:12, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{it.sub}</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:4}}>{it.meta}</div>
              </div>
              <span className="material-symbols-outlined" style={{fontSize:20, color:'var(--ink-dim)'}}>chevron_right</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.ProfileBookings = ProfileBookings;
