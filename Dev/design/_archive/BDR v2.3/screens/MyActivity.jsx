/* global React, TOURNAMENTS, TEAMS */

function MyActivity({ setRoute }) {
  const [tab, setTab] = React.useState('all');

  const items = [
    { kind:'tournament', status:'pending', title:'BDR CHALLENGE SPRING 2026', sub:'팀 신청 · 검토중', when:'D-14', meta:'참가비 ₩80,000', accent:'var(--warn)', route:'matchDetail' },
    { kind:'game',       status:'confirmed', title:'장충체육관 픽업 3v3', sub:'토 19:00 · 4명 모집', when:'토 19:00', meta:'본인 신청 확정', accent:'var(--ok)', route:'gameDetail' },
    { kind:'team',       status:'pending', title:'리딤 (RDM)', sub:'팀 가입 신청 · 팀장 검토중', when:'2일 전', meta:'서울 강남 · D3', accent:'var(--warn)', route:'teamDetail' },
    { kind:'tournament', status:'confirmed', title:'KINGS CUP VOL.07', sub:'팀 등록 확정', when:'D-3', meta:'예선 토 10:00', accent:'var(--ok)', route:'matchDetail' },
    { kind:'game',       status:'cancelled', title:'한강 농구코트 픽업', sub:'주최자 취소', when:'어제', meta:'환불 처리됨', accent:'var(--danger)', route:'gameDetail' },
    { kind:'team',       status:'rejected', title:'몽키즈 (MKZ)', sub:'팀 가입 신청 · 거절', when:'1주 전', meta:'정원 마감', accent:'var(--danger)', route:'teamDetail' },
    { kind:'game',       status:'past', title:'올림픽공원 5v5', sub:'완료 · 24-19 승', when:'1주 전', meta:'스탯 입력 완료', accent:'var(--ink-mute)', route:'gameResult' },
  ];

  const filters = [
    { id:'all',  label:'전체', count: items.length },
    { id:'tournament', label:'대회', count: items.filter(x=>x.kind==='tournament').length },
    { id:'game', label:'경기', count: items.filter(x=>x.kind==='game').length },
    { id:'team', label:'팀',   count: items.filter(x=>x.kind==='team').length },
    { id:'pending', label:'검토중', count: items.filter(x=>x.status==='pending').length },
  ];
  const shown = tab === 'all' ? items
    : tab === 'pending' ? items.filter(x=>x.status==='pending')
    : items.filter(x=>x.kind===tab);

  const statusLabel = { pending:'검토중', confirmed:'확정', rejected:'거절', cancelled:'취소', past:'완료' };
  const statusBadge = { pending:'badge--warn', confirmed:'badge--ok', rejected:'badge--ghost', cancelled:'badge--ghost', past:'badge--ghost' };
  const kindIcon = { tournament:'🏆', game:'🏀', team:'👥' };

  // counters at top
  const pending = items.filter(x=>x.status==='pending').length;
  const upcoming = items.filter(x=>x.status==='confirmed' && (x.when.startsWith('D-') || x.when.startsWith('토') || x.when.startsWith('일'))).length;

  return (
    <div className="page">
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a> › <span style={{color:'var(--ink)'}}>내 활동</span>
      </div>

      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:10}}>
        <div>
          <div className="eyebrow">내 활동 · MY ACTIVITY</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>신청한 모든 것</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>경기 · 대회 · 팀 가입 신청을 한 화면에서</div>
        </div>
      </div>

      {/* counters */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:18}}>
        {[
          { n: pending, lbl:'검토중', tone:'var(--warn)' },
          { n: upcoming, lbl:'예정', tone:'var(--cafe-blue)' },
          { n: items.filter(x=>x.status==='past').length, lbl:'완료', tone:'var(--ink-mute)' },
          { n: items.filter(x=>x.status==='rejected'||x.status==='cancelled').length, lbl:'취소·거절', tone:'var(--ink-dim)' },
        ].map((c,i)=> (
          <div key={i} className="card" style={{padding:'14px 16px', borderTop:`3px solid ${c.tone}`}}>
            <div style={{fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, lineHeight:1, color:c.tone}}>{c.n}</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4}}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* filter chips */}
      <div style={{display:'flex', gap:8, marginBottom:14, flexWrap:'wrap'}}>
        {filters.map(f => (
          <button key={f.id} className="btn btn--sm" onClick={()=>setTab(f.id)}
            style={tab===f.id ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>
            {f.label} <span style={{fontFamily:'var(--ff-mono)', opacity:.7, marginLeft:4}}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* list */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        {shown.map((it, i) => (
          <div key={i} onClick={()=>setRoute(it.route)} style={{
            display:'grid', gridTemplateColumns:'40px 1fr auto auto', gap:14,
            alignItems:'center', padding:'14px 18px',
            borderBottom: i<shown.length-1 ? '1px solid var(--border)' : 0,
            cursor:'pointer',
            borderLeft: `3px solid ${it.accent}`,
          }}>
            <div style={{fontSize:22}}>{kindIcon[it.kind]}</div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                <span className={`badge ${statusBadge[it.status]}`}>{statusLabel[it.status]}</span>
                <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{it.when}</span>
              </div>
              <div style={{fontWeight:700, fontSize:15, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{it.title}</div>
              <div style={{fontSize:13, color:'var(--ink-mute)'}}>{it.sub} · {it.meta}</div>
            </div>
            <div style={{fontSize:12, color:'var(--ink-dim)', textAlign:'right', whiteSpace:'nowrap'}}>
              {it.status==='pending' && <button className="btn btn--sm" onClick={(e)=>{e.stopPropagation();}}>신청 취소</button>}
              {it.status==='confirmed' && it.kind!=='team' && <button className="btn btn--sm">상세</button>}
              {it.status==='past' && <button className="btn btn--sm btn--ghost">기록 보기</button>}
            </div>
          </div>
        ))}
        {shown.length === 0 && (
          <div style={{padding:'60px 20px', textAlign:'center', color:'var(--ink-mute)'}}>
            아직 신청한 항목이 없어요.
          </div>
        )}
      </div>

      <div style={{display:'flex', gap:8, marginTop:16, flexWrap:'wrap'}}>
        <button className="btn" onClick={()=>setRoute('games')}>경기 찾기</button>
        <button className="btn" onClick={()=>setRoute('match')}>대회 찾기</button>
        <button className="btn" onClick={()=>setRoute('team')}>팀 찾기</button>
      </div>
    </div>
  );
}

window.MyActivity = MyActivity;
