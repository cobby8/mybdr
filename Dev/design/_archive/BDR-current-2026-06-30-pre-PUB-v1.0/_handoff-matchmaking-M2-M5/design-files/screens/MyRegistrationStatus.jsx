/* global React */
/**
 * MyRegistrationStatus — /my/registrations (신규 · M2 대기열)
 *
 * Why: 내가 신청한 경기의 상태(신청완료·대기 N번·승격 확정 대기·확정)를 한 화면에서.
 * Pattern: MyActivity 리스트 톤 + 대기열 상태 행 + 승격 확정 모달(카운트다운).
 *
 * 진입: 알림(자리 알림) / 마이페이지 / 경기 상세
 * 복귀: AppNav / 프로필
 * 상태: confirmed 확정 · waiting 대기 N번 · promoted 승격(확정 CTA+카운트다운) · applied 신청완료
 */

function CountdownText({ seconds }) {
  const [left, setLeft] = React.useState(seconds);
  React.useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return <span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{mm}:{ss} 남음</span>;
}
window.CountdownText = CountdownText;

function WaitlistPromoteModal({ reg, onConfirm, onClose }) {
  return (
    <div role="dialog" aria-modal="true" onClick={onClose}
      style={{position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.55)', display:'grid', placeItems:'center', padding:16}}>
      <div onClick={e=>e.stopPropagation()} className="card"
        style={{width:'100%', maxWidth:400, padding:0, overflow:'hidden'}}>
        <div style={{padding:'20px 22px', background:'color-mix(in oklab, var(--accent) 12%, transparent)', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', color:'var(--accent)', marginBottom:6}}>🔔 자리가 났어요</div>
          <div style={{fontWeight:800, fontSize:18, letterSpacing:'-0.01em'}}>{reg.title}</div>
          <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:3}}>{reg.court} · {reg.when}</div>
        </div>
        <div style={{padding:'20px 22px'}}>
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg-alt)', borderRadius:6, marginBottom:14}}>
            <span style={{fontSize:13, color:'var(--ink-soft)'}}>확정 마감까지</span>
            <span style={{fontSize:15, color:'var(--accent)'}}><CountdownText seconds={1790}/></span>
          </div>
          <p style={{margin:'0 0 16px', fontSize:13, color:'var(--ink-soft)', lineHeight:1.6}}>
            대기 1번이에요. 시간 안에 확정하지 않으면 다음 순번에게 넘어갑니다.
          </p>
          <button className="btn btn--primary btn--xl" style={{width:'100%', marginBottom:8}} onClick={onConfirm}>참가 확정하기</button>
          <button className="btn" style={{width:'100%'}} onClick={onClose}>다음에 하기</button>
        </div>
      </div>
    </div>
  );
}
window.WaitlistPromoteModal = WaitlistPromoteModal;

function MyRegistrationStatus({ setRoute }) {
  const [items, setItems] = React.useState([
    { id:'r1', status:'promoted', kind:'pickup', title:'반포 주말 오전 3x3', court:'반포종합사회복지관', when:'토 09:00', wait:1, accent:'var(--accent)' },
    { id:'r2', status:'waiting',  kind:'guest',  title:'IRON WOLVES 주말 연습경기 게스트', court:'용산국민체육센터', when:'토 14:00', wait:3, accent:'var(--warn)' },
    { id:'r3', status:'confirmed',kind:'pickup', title:'목요일 저녁 하남미사 픽업 · 6:4', court:'미사강변체육관', when:'목 20:30', accent:'var(--ok)' },
    { id:'r4', status:'applied',  kind:'guest',  title:'성동구민체육관 게스트 3명 모집', court:'성동구민체육관', when:'일 13:00', accent:'var(--cafe-blue)' },
  ]);
  const [promo, setPromo] = React.useState(null);

  const kindIcon = { pickup:'🏀', guest:'🤝', scrimmage:'🆚' };
  const STATUS = {
    promoted:  { label:'승격 · 확정 대기', cls:'badge--red' },
    waiting:   { label:'대기중',          cls:'badge--warn' },
    confirmed: { label:'확정',            cls:'badge--ok' },
    applied:   { label:'신청완료',        cls:'badge--soft' },
  };

  const confirmPromo = () => {
    setItems(items.map(it => it.id === promo.id ? { ...it, status:'confirmed', accent:'var(--ok)' } : it));
    setPromo(null);
  };

  const counts = {
    promoted: items.filter(i=>i.status==='promoted').length,
    waiting:  items.filter(i=>i.status==='waiting').length,
    confirmed:items.filter(i=>i.status==='confirmed').length,
    applied:  items.filter(i=>i.status==='applied').length,
  };

  return (
    <div className="page">
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a> › <span style={{color:'var(--ink)'}}>내 신청 현황</span>
      </div>

      <div style={{marginBottom:18}}>
        <div className="eyebrow">내 신청 · REGISTRATIONS</div>
        <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>내 신청 현황</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>신청·대기·확정 상태를 한 화면에서 관리하세요</div>
      </div>

      {/* 승격 알림 배너 */}
      {counts.promoted > 0 && (
        <div className="card" style={{padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', borderLeft:'3px solid var(--accent)', background:'color-mix(in oklab, var(--accent) 7%, transparent)'}}>
          <div style={{fontSize:24}}>🔔</div>
          <div style={{flex:1, minWidth:160}}>
            <div style={{fontWeight:800, fontSize:15}}>자리가 났어요 · 지금 확정하세요</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>대기 1번 경기의 빈자리가 발생했습니다</div>
          </div>
          <button className="btn btn--primary" onClick={()=>setPromo(items.find(i=>i.status==='promoted'))}>확정하기</button>
        </div>
      )}

      {/* counters */}
      <div className="reg-counters" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:18}}>
        {[
          { n:counts.confirmed, lbl:'확정', tone:'var(--ok)' },
          { n:counts.promoted,  lbl:'확정 대기', tone:'var(--accent)' },
          { n:counts.waiting,   lbl:'대기중', tone:'var(--warn)' },
          { n:counts.applied,   lbl:'신청완료', tone:'var(--cafe-blue)' },
        ].map((c,i)=>(
          <div key={i} className="card" style={{padding:'14px 16px', borderTop:`3px solid ${c.tone}`}}>
            <div style={{fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, lineHeight:1, color:c.tone}}>{c.n}</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4}}>{c.lbl}</div>
          </div>
        ))}
      </div>

      {/* list */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        {items.map((it, i) => {
          const s = STATUS[it.status];
          return (
            <div key={it.id} className="reg-row" style={{
              display:'grid', gridTemplateColumns:'40px 1fr auto', gap:14, alignItems:'center',
              padding:'16px 18px', borderBottom: i<items.length-1 ? '1px solid var(--border)' : 0,
              borderLeft:`3px solid ${it.accent}`,
            }}>
              <div style={{fontSize:22}}>{kindIcon[it.kind]}</div>
              <div style={{minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap'}}>
                  <span className={`badge ${s.cls}`}>{s.label}</span>
                  {it.status === 'waiting' && <span style={{fontSize:12, fontWeight:800, color:'var(--warn)', fontFamily:'var(--ff-mono)'}}>대기 {it.wait}번</span>}
                  {it.status === 'promoted' && <span style={{fontSize:12, color:'var(--accent)'}}><CountdownText seconds={1790}/></span>}
                  <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{it.when}</span>
                </div>
                <div style={{fontWeight:700, fontSize:15, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{it.title}</div>
                <div style={{fontSize:13, color:'var(--ink-mute)', marginTop:1}}>{it.court}</div>
              </div>
              <div className="reg-actions" style={{display:'flex', gap:6, justifyContent:'flex-end', flexWrap:'wrap'}}>
                {it.status === 'promoted' && <button className="btn btn--sm btn--primary" onClick={()=>setPromo(it)}>확정</button>}
                {it.status === 'waiting' && <button className="btn btn--sm">대기 취소</button>}
                {it.status === 'confirmed' && <button className="btn btn--sm" onClick={()=>setRoute('gameDetail')}>상세</button>}
                {it.status === 'applied' && <button className="btn btn--sm">신청 취소</button>}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{display:'flex', gap:8, marginTop:16, flexWrap:'wrap'}}>
        <button className="btn" onClick={()=>setRoute('games')}>경기 더 찾기</button>
        <button className="btn" onClick={()=>setRoute('myActivity')}>내 활동 전체</button>
      </div>

      {promo && <WaitlistPromoteModal reg={promo} onConfirm={confirmPromo} onClose={()=>setPromo(null)}/>}

      <style>{`
        @media (max-width: 720px) {
          .reg-counters { grid-template-columns: 1fr 1fr !important; }
          .reg-row { grid-template-columns: 32px 1fr !important; }
          .reg-actions { grid-column: 1 / -1; justify-content: flex-start !important; margin-top: 4px; }
        }
      `}</style>
    </div>
  );
}

window.MyRegistrationStatus = MyRegistrationStatus;
