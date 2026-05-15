/* global React, Icon */

/**
 * CourtManage — /courts/[id]/manage 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 코트 운영자(court_rental 멤버십 활성)가 예약 현황을 보고 차단 슬롯 등록 + 취소
 * 진입: /courts/[id] 운영자 진입 / 더보기 → 코트 운영
 * 복귀: /courts/[id] 코트 상세
 */
function CourtManage({ setRoute }) {
  // mock 데이터 — 차단 폼 state + 예약 4건 (시안 데모용, 실제 API X)
  const [blockDate, setBlockDate] = React.useState('2026-05-12');
  const [blockHour, setBlockHour] = React.useState(19);
  const [blockDuration, setBlockDuration] = React.useState(1);
  const [blockReason, setBlockReason] = React.useState('');

  const bookings = [
    { id:'b1', start:'5/9 (목) 19:00', dur:2, purpose:'pickup', status:'confirmed', user:'rdm_captain', count:8, amount:30000 },
    { id:'b2', start:'5/10 (금) 20:00', dur:1, purpose:'team', status:'confirmed', user:'sweep_pg', count:6, amount:15000 },
    { id:'b3', start:'5/11 (토) 14:00', dur:3, purpose:'scrim', status:'pending', user:'iron_center', count:10, amount:45000 },
    { id:'b4', start:'5/12 (일) 09:00', dur:2, purpose:'block', status:'blocked', user:'운영자', count:null, amount:0 },
  ];

  const STATUS = {
    confirmed: { label:'확정', color:'var(--ok)' },
    pending:   { label:'대기', color:'var(--warn)' },
    blocked:   { label:'차단', color:'var(--ink-mute)' },
    cancelled: { label:'취소', color:'var(--err)' },
  };
  const PURPOSE = { pickup:'픽업', team:'팀 훈련', scrim:'연습경기', private:'개인', block:'운영자 차단' };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('courts')} style={{cursor:'pointer'}}>코트</a><span>›</span>
        <a onClick={()=>setRoute('courtDetail')} style={{cursor:'pointer'}}>장충체육관</a><span>›</span>
        <span style={{color:'var(--ink)'}}>운영</span>
      </div>

      {/* 헤더 */}
      <div style={{borderBottom:'1px solid var(--border)', paddingBottom:16, marginBottom:20}}>
        <div className="eyebrow" style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', color:'var(--ink-dim)'}}>COURT MANAGE</div>
        <h1 style={{margin:'4px 0 2px', fontSize:24, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>장충체육관 · 코트 운영</h1>
        <p style={{margin:0, fontSize:13, color:'var(--ink-mute)'}}>예약 현황을 확인하고 정비/임대불가 시간대를 차단할 수 있습니다.</p>
      </div>

      {/* 차단 슬롯 등록 폼 */}
      <div className="card" style={{padding:18, marginBottom:20}}>
        <h2 style={{margin:'0 0 12px', fontSize:15, fontWeight:700}}>차단 슬롯 등록</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10}}>
          <label style={{display:'flex', flexDirection:'column', gap:4}}>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>날짜</span>
            <input type="date" value={blockDate} onChange={e=>setBlockDate(e.target.value)} style={{height:36, padding:'0 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', color:'var(--ink)'}} />
          </label>
          <label style={{display:'flex', flexDirection:'column', gap:4}}>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>시작 시간</span>
            <select value={blockHour} onChange={e=>setBlockHour(Number(e.target.value))} style={{height:36, padding:'0 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', color:'var(--ink)'}}>
              {Array.from({length:18}, (_,i)=>i+6).map(h=><option key={h} value={h}>{String(h).padStart(2,'0')}:00</option>)}
            </select>
          </label>
          <label style={{display:'flex', flexDirection:'column', gap:4}}>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>차단 시간</span>
            <select value={blockDuration} onChange={e=>setBlockDuration(Number(e.target.value))} style={{height:36, padding:'0 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', color:'var(--ink)'}}>
              {[1,2,3,4].map(d=><option key={d} value={d}>{d}시간</option>)}
            </select>
          </label>
          <label style={{display:'flex', flexDirection:'column', gap:4, gridColumn:'span 2'}}>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>사유 (선택)</span>
            <input type="text" value={blockReason} onChange={e=>setBlockReason(e.target.value)} placeholder="예: 정기 청소" style={{height:36, padding:'0 10px', fontSize:14, border:'1px solid var(--border)', borderRadius:4, background:'var(--surface)', color:'var(--ink)'}} />
          </label>
        </div>
        <div style={{marginTop:12, display:'flex', justifyContent:'flex-end'}}>
          <button className="btn btn--primary btn--sm">차단 등록</button>
        </div>
      </div>

      {/* 예약 현황 리스트 */}
      <div className="card" style={{padding:0}}>
        <div style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <h2 style={{margin:0, fontSize:15, fontWeight:700}}>예약 현황 <span style={{color:'var(--ink-dim)', fontWeight:500, fontSize:12, marginLeft:6}}>오늘 + 향후 30일</span></h2>
          <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{bookings.length}건</span>
        </div>
        {bookings.map(b => {
          const st = STATUS[b.status] || STATUS.confirmed;
          return (
            <div key={b.id} style={{padding:'14px 18px', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:12, alignItems:'center'}}>
              <div>
                <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:4}}>
                  <span style={{fontSize:14, fontWeight:600, fontFamily:'var(--ff-mono)'}}>{b.start}</span>
                  <span style={{fontSize:11, color:'var(--ink-dim)'}}>· {b.dur}시간</span>
                  <span className="badge badge--ghost" style={{fontSize:10}}>{PURPOSE[b.purpose]}</span>
                  <span style={{fontSize:11, color:st.color, fontWeight:600}}>● {st.label}</span>
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)'}}>
                  @{b.user} {b.count!=null && `· ${b.count}명`} {b.amount>0 && `· ₩${b.amount.toLocaleString()}`}
                </div>
              </div>
              {b.status !== 'cancelled' && b.status !== 'blocked' && (
                <button className="btn btn--ghost btn--sm" style={{color:'var(--err)'}}>취소</button>
              )}
              {b.status === 'blocked' && (
                <button className="btn btn--ghost btn--sm">해제</button>
              )}
            </div>
          );
        })}
      </div>

      {/* 안내 */}
      <p style={{marginTop:18, fontSize:12, color:'var(--ink-dim)', lineHeight:1.6}}>
        예약 모드(자동/수동) 변경은 <a onClick={()=>setRoute('help')} style={{textDecoration:'underline', cursor:'pointer'}}>운영자 가이드</a>를 참고하거나 운영진에게 문의해주세요.
      </p>
    </div>
  );
}

window.CourtManage = CourtManage;
