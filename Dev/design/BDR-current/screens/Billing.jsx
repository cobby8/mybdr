/* global React */

function Billing({ setRoute }) {
  const subscription = { plan:'PREMIUM', price:'₩9,900', cycle:'월', renewAt:'2026-05-19', method:'토스페이 · 신한카드 (****1234)', status:'active' };
  const history = [
    { date:'2026-04-19', desc:'PREMIUM 월 구독', amt:'₩9,900', status:'paid' },
    { date:'2026-04-05', desc:'BDR CHALLENGE SPRING 참가비', amt:'₩80,000', status:'paid' },
    { date:'2026-03-19', desc:'PREMIUM 월 구독', amt:'₩9,900', status:'paid' },
    { date:'2026-03-12', desc:'KINGS CUP VOL.06 참가비', amt:'₩120,000', status:'refunded' },
    { date:'2026-02-19', desc:'PREMIUM 월 구독', amt:'₩9,900', status:'paid' },
    { date:'2026-01-19', desc:'PREMIUM 월 구독', amt:'₩9,900', status:'paid' },
  ];

  return (
    <div className="page" style={{maxWidth:880}}>
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a> › <span style={{color:'var(--ink)'}}>결제·구독</span>
      </div>
      <div className="eyebrow">결제 · BILLING</div>
      <h1 style={{margin:'6px 0 18px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>결제·구독 관리</h1>

      {/* current subscription */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:18}}>
        <div style={{padding:'20px 24px', background:'linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))', color:'#fff', display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:14, flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11, opacity:.8, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', marginBottom:6}}>현재 구독</div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:30, letterSpacing:'-0.01em', marginBottom:4}}>{subscription.plan}</div>
            <div style={{fontSize:13, opacity:.9}}>{subscription.price} / {subscription.cycle}</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{padding:'4px 10px', background:'rgba(255,255,255,.18)', borderRadius:3, fontSize:11, fontWeight:700, letterSpacing:'.06em', display:'inline-block', marginBottom:6}}>ACTIVE</div>
            <div style={{fontSize:12, opacity:.85}}>다음 결제 · {subscription.renewAt}</div>
          </div>
        </div>
        <div style={{padding:'18px 24px', display:'grid', gridTemplateColumns:'140px 1fr', rowGap:10, fontSize:14}}>
          <div style={{color:'var(--ink-dim)'}}>결제수단</div><div>{subscription.method}</div>
          <div style={{color:'var(--ink-dim)'}}>다음 갱신</div><div>{subscription.renewAt} · 자동 갱신</div>
          <div style={{color:'var(--ink-dim)'}}>혜택</div><div>맞춤 추천 강화 · 광고 제거 · 통계 무제한 · 우선 매칭</div>
        </div>
        <div style={{padding:'14px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap'}}>
          <button className="btn">결제수단 변경</button>
          <button className="btn">영수증 받기</button>
          <button className="btn btn--ghost" style={{marginLeft:'auto', color:'var(--danger)'}}>구독 해지</button>
        </div>
      </div>

      {/* upgrade prompt */}
      <div className="card" style={{padding:'18px 22px', marginBottom:22, background:'var(--bg-alt)', borderLeft:'3px solid var(--accent)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:14, flexWrap:'wrap'}}>
          <div>
            <div style={{fontWeight:700, marginBottom:2}}>팀장이라면? <span style={{color:'var(--accent)'}}>TEAM PRO</span> 플랜으로</div>
            <div style={{fontSize:13, color:'var(--ink-mute)'}}>로스터 무제한 · 대회 우선 신청 · 통합 통계</div>
          </div>
          <button className="btn btn--primary" onClick={()=>setRoute('pricing')}>요금제 비교 →</button>
        </div>
      </div>

      {/* history */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
        <h2 style={{margin:0, fontSize:18, fontWeight:700}}>결제 내역</h2>
        <a style={{fontSize:13, color:'var(--link)', cursor:'pointer'}}>전체 다운로드</a>
      </div>
      <div className="card data-table" style={{padding:0, overflow:'hidden'}}>
        <div className="data-table__head" style={{display:'grid', gridTemplateColumns:'120px 1fr 110px 90px', gap:14, padding:'12px 18px', background:'var(--bg-head)', fontSize:12, color:'var(--ink-mute)', fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid var(--border)'}}>
          <div>날짜</div><div>내역</div><div style={{textAlign:'right'}}>금액</div><div style={{textAlign:'center'}}>상태</div>
        </div>
        {history.map((h,i) => (
          <div key={i} className="data-table__row" style={{display:'grid', gridTemplateColumns:'120px 1fr 110px 90px', gap:14, padding:'14px 18px', borderBottom: i<history.length-1?'1px solid var(--border)':0, alignItems:'center', fontSize:13}}>
            <div data-label="날짜" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>{h.date}</div>
            <div data-label="내역" data-primary="true" style={{fontWeight:500}}>{h.desc}</div>
            <div data-label="금액" style={{textAlign:'right', fontFamily:'var(--ff-mono)', fontWeight:700, color: h.status==='refunded'?'var(--ink-mute)':'var(--ink)'}}>{h.amt}</div>
            <div data-label="상태" style={{textAlign:'center'}}>
              <span className={`badge ${h.status==='paid'?'badge--ok':'badge--ghost'}`}>{h.status==='paid'?'완료':'환불'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Billing = Billing;
