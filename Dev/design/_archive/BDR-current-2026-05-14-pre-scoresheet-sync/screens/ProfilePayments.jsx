/* global React */

// ============================================================
// ProfilePayments — /profile/payments (Phase F2)
//
// 결제 내역 (날짜 / 항목 / 금액 / 상태) + 필터
// Billing.jsx 와 차이: Billing = 결제 수단·구독 관리 / Payments = 거래 이력
// ============================================================

const { useState: useStatePay, useMemo: useMemoPay } = React;

function ProfilePayments({ setRoute }) {
  const [filter, setFilter] = useStatePay('all');
  const [year,   setYear]   = useStatePay('2026');

  const all = [
    { id:'TXN-26041901', date:'2026-04-19', desc:'BDR+ PREMIUM 월 구독',          method:'카드 ****8822', amt: 9900,   status:'paid' },
    { id:'TXN-26041502', date:'2026-04-15', desc:'장충체육관 픽업 게임 참가비',  method:'토스페이',       amt: 12000,  status:'paid' },
    { id:'TXN-26040501', date:'2026-04-05', desc:'BDR CHALLENGE SPRING 참가비',   method:'카드 ****8822', amt: 80000,  status:'paid' },
    { id:'TXN-26032801', date:'2026-03-28', desc:'반포 주말 3x3 참가비',          method:'카드 ****8822', amt: 8000,   status:'failed', failReason:'카드 한도 초과' },
    { id:'TXN-26032802', date:'2026-03-28', desc:'반포 주말 3x3 참가비 (재결제)', method:'토스페이',       amt: 8000,   status:'paid' },
    { id:'TXN-26031901', date:'2026-03-19', desc:'BDR+ PREMIUM 월 구독',          method:'카드 ****8822', amt: 9900,   status:'paid' },
    { id:'TXN-26031202', date:'2026-03-12', desc:'KINGS CUP VOL.06 참가비',       method:'카드 ****8822', amt: 120000, status:'refunded', refundDate:'2026-03-13' },
    { id:'TXN-26021901', date:'2026-02-19', desc:'BDR+ PREMIUM 월 구독',          method:'카드 ****8822', amt: 9900,   status:'paid' },
    { id:'TXN-26020803', date:'2026-02-08', desc:'심판 비용 분담',                method:'토스페이',       amt: 5000,   status:'paid' },
    { id:'TXN-26011901', date:'2026-01-19', desc:'BDR+ PREMIUM 월 구독',          method:'카드 ****8822', amt: 9900,   status:'paid' },
    { id:'TXN-26011501', date:'2026-01-15', desc:'코트 예약 — 잠실 실내체육관',  method:'카드 ****8822', amt: 30000,  status:'refunded', refundDate:'2026-01-16' },
    { id:'TXN-25122901', date:'2025-12-29', desc:'BDR+ PREMIUM 월 구독',          method:'카드 ****8822', amt: 9900,   status:'paid' },
  ];

  const filters = [
    { id:'all',      label:'전체',      count: all.length },
    { id:'paid',     label:'결제 완료', count: all.filter(t=>t.status==='paid').length },
    { id:'refunded', label:'환불',      count: all.filter(t=>t.status==='refunded').length },
    { id:'failed',   label:'실패',      count: all.filter(t=>t.status==='failed').length },
  ];

  const rows = useMemoPay(() => {
    return all.filter(t => filter === 'all' ? true : t.status === filter)
              .filter(t => year === 'all' ? true : t.date.startsWith(year));
  }, [filter, year]);

  const summary = useMemoPay(() => {
    const paid    = rows.filter(t => t.status === 'paid').reduce((s,t) => s + t.amt, 0);
    const refund  = rows.filter(t => t.status === 'refunded').reduce((s,t) => s + t.amt, 0);
    return { paid, refund, net: paid - refund, count: rows.length };
  }, [rows]);

  const fmtKRW = (n) => '₩' + n.toLocaleString('ko-KR');

  const statusMeta = (s) => {
    if (s === 'paid')     return { label:'완료', cls:'badge--ok' };
    if (s === 'refunded') return { label:'환불', cls:'badge--ghost' };
    return { label:'실패', cls:'badge--red' };
  };

  return (
    <div className="page" style={{maxWidth:960}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>결제 내역</span>
      </div>

      {/* Hero + 요약 */}
      <header style={{marginBottom:18, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">PAYMENTS</div>
          <h1 style={{margin:'4px 0 4px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1, 30px)', fontWeight:800, letterSpacing:'-0.015em'}}>
            결제 내역
          </h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>
            BDR+ 구독·대회 참가비·코트 예약 거래 이력. <a onClick={()=>setRoute('billing')} style={{color:'var(--accent)', cursor:'pointer'}}>결제 수단 관리 →</a>
          </div>
        </div>
        <button className="btn btn--sm" style={{minHeight:44}}>영수증 일괄 다운로드</button>
      </header>

      {/* 요약 4 stats */}
      <div className="pp-summary" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:14}}>
        <SCard k="이번 기간 거래"   v={summary.count + '건'} c="var(--ink)"/>
        <SCard k="결제 완료 합계"   v={fmtKRW(summary.paid)} c="var(--ink)"/>
        <SCard k="환불 합계"        v={fmtKRW(summary.refund)} c="var(--ink-mute)"/>
        <SCard k="순 결제액"        v={fmtKRW(summary.net)} c="var(--accent)"/>
      </div>

      {/* 필터 + 연도 */}
      <div className="card" style={{padding:'14px 16px', marginBottom:14, display:'flex', gap:8, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap'}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {filters.map(f => {
            const on = filter === f.id;
            return (
              <button key={f.id} onClick={()=>setFilter(f.id)} style={{
                padding:'10px 14px', minHeight:40,
                border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink-soft)',
                borderRadius:6, cursor:'pointer',
                fontSize:13, fontWeight: on ? 700 : 500,
                display:'flex', alignItems:'center', gap:6,
              }}>
                {f.label}
                <span style={{
                  fontSize:11, fontFamily:'var(--ff-mono)', fontWeight:700,
                  padding:'1px 6px', borderRadius:3,
                  background: on ? 'rgba(255,255,255,.22)' : 'var(--bg-alt)',
                  color: on ? '#fff' : 'var(--ink-dim)',
                }}>{f.count}</span>
              </button>
            );
          })}
        </div>
        <select className="input" value={year} onChange={e=>setYear(e.target.value)}
          style={{fontSize:14, minHeight:40, padding:'0 12px', maxWidth:140}}>
          <option value="all">전체 기간</option>
          <option value="2026">2026년</option>
          <option value="2025">2025년</option>
        </select>
      </div>

      {/* Table */}
      <div className="card data-table" style={{padding:0, overflow:'hidden'}}>
        <div className="data-table__head" style={{
          display:'grid', gridTemplateColumns:'120px 1.6fr 140px 110px 90px',
          gap:14, padding:'12px 18px', background:'var(--bg-alt)',
          fontSize:11, color:'var(--ink-mute)', fontWeight:700,
          letterSpacing:'.06em', textTransform:'uppercase',
          borderBottom:'1px solid var(--border)',
        }}>
          <div>날짜</div>
          <div>항목</div>
          <div>결제수단</div>
          <div style={{textAlign:'right'}}>금액</div>
          <div style={{textAlign:'center'}}>상태</div>
        </div>
        {rows.length === 0 ? (
          <div style={{padding:'40px 20px', textAlign:'center', color:'var(--ink-dim)', fontSize:13}}>
            해당 기간·상태에 거래 내역이 없습니다.
          </div>
        ) : rows.map((t, i) => {
          const meta = statusMeta(t.status);
          return (
            <div key={t.id} className="data-table__row" style={{
              display:'grid', gridTemplateColumns:'120px 1.6fr 140px 110px 90px',
              gap:14, padding:'14px 18px',
              borderBottom: i < rows.length - 1 ? '1px solid var(--border)' : 0,
              alignItems:'center', fontSize:13,
            }}>
              <div data-label="날짜" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', fontSize:12}}>
                {t.date}
                <div style={{fontSize:10, color:'var(--ink-dim)', marginTop:2}}>{t.id}</div>
              </div>
              <div data-label="항목" data-primary="true">
                <div style={{fontWeight:600}}>{t.desc}</div>
                {t.status === 'failed' && (
                  <div style={{fontSize:11, color:'var(--accent)', marginTop:2}}>실패 사유 · {t.failReason}</div>
                )}
                {t.status === 'refunded' && (
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>환불 처리 · {t.refundDate}</div>
                )}
              </div>
              <div data-label="결제수단" style={{fontSize:12, color:'var(--ink-soft)'}}>{t.method}</div>
              <div data-label="금액" style={{
                textAlign:'right', fontFamily:'var(--ff-mono)', fontWeight:700,
                color: t.status === 'refunded' ? 'var(--ink-mute)' : t.status === 'failed' ? 'var(--ink-dim)' : 'var(--ink)',
                textDecoration: t.status === 'failed' ? 'line-through' : 'none',
              }}>
                {fmtKRW(t.amt)}
              </div>
              <div data-label="상태" style={{textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                <span className={`badge ${meta.cls}`} style={{fontSize:11}}>{meta.label}</span>
                {t.status === 'paid' && (
                  <a style={{fontSize:10, color:'var(--ink-dim)', cursor:'pointer'}}>영수증 ↓</a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA bottom */}
      <div style={{marginTop:14, padding:'14px 18px', background:'var(--bg-alt)', borderRadius:6, fontSize:12, color:'var(--ink-mute)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap'}}>
        <span>현금영수증·세금계산서 발급은 <a onClick={()=>setRoute('settings')} style={{color:'var(--accent)', cursor:'pointer'}}>설정 › 결제·멤버십</a> 에서 처리됩니다.</span>
        <button className="btn btn--sm" style={{minHeight:36}}>문의하기</button>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .pp-summary { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>
    </div>
  );
}

function SCard({ k, v, c }) {
  return (
    <div className="card" style={{padding:'16px 18px'}}>
      <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase'}}>
        {k}
      </div>
      <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24, letterSpacing:'-0.015em', marginTop:4, color:c}}>
        {v}
      </div>
    </div>
  );
}

window.ProfilePayments = ProfilePayments;
