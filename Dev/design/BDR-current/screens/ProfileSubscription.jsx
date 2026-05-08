/* global React, ForceActionModal */

// ============================================================
// ProfileSubscription — /profile/subscription (Phase F2)
//
// 현재 구독 (Free / Pro / Premium) 카드 + 다음 결제일 + 멤버십 혜택 리스트
// 변경 / 해지 CTA — 해지는 ForceActionModal (withdraw 모드) 재사용
// Billing.jsx 와 차이: Billing = 결제 수단 / Subscription = 플랜 자체
// ============================================================

const { useState: useStateSub } = React;

function ProfileSubscription({ setRoute }) {
  const [tier, setTier]       = useStateSub('premium'); // free / pro / premium
  const [autoRenew, setAuto]  = useStateSub(true);
  const [cancelOpen, setCancel] = useStateSub(false);

  const plans = {
    free: {
      key:'free', label:'Free', price: 0, cycle:'무료',
      color:'var(--ink-mute)',
      desc:'기본 매칭 + 커뮤니티',
    },
    pro: {
      key:'pro', label:'BDR Pro', price: 4900, cycle:'/월',
      color:'var(--cafe-blue)',
      desc:'우선 매칭 + 통계 무제한',
    },
    premium: {
      key:'premium', label:'BDR Premium', price: 9900, cycle:'/월',
      color:'var(--accent)',
      desc:'팀 운영 + 광고 제거 + 코치 매칭',
    },
  };
  const current = plans[tier];

  const benefits = {
    free: [
      { ok:true,  t:'기본 매칭 알고리즘' },
      { ok:true,  t:'커뮤니티 게시판 열람·작성' },
      { ok:true,  t:'기본 통계 (시즌 1개)' },
      { ok:false, t:'우선 매칭 — 결제 회원 우선' },
      { ok:false, t:'광고 노출' },
    ],
    pro: [
      { ok:true,  t:'우선 매칭 — 빠른 게스트 모집' },
      { ok:true,  t:'전 시즌 통계 무제한' },
      { ok:true,  t:'대회 접수 24h 우선 오픈' },
      { ok:true,  t:'프로필 인증 배지' },
      { ok:false, t:'광고 노출 — 부분 제거' },
    ],
    premium: [
      { ok:true,  t:'Pro 의 모든 혜택' },
      { ok:true,  t:'팀 운영 도구 — 로스터 무제한 / 통합 통계', highlight:true },
      { ok:true,  t:'광고 제거 — 모든 페이지' },
      { ok:true,  t:'코치 매칭 — 월 1회 무료 화상 코칭' },
      { ok:true,  t:'영상 분석 — 경기 영상 AI 분석 (월 5건)' },
      { ok:true,  t:'우선 고객 지원' },
    ],
  };

  const billingHistory = [
    { date:'2026-04-19', amt: 9900, status:'paid' },
    { date:'2026-03-19', amt: 9900, status:'paid' },
    { date:'2026-02-19', amt: 9900, status:'paid' },
  ];

  const fmtKRW = (n) => '₩' + n.toLocaleString('ko-KR');

  const handleCancel = (data) => {
    setCancel(false);
    setTier('free');
  };

  return (
    <div className="page" style={{maxWidth:880}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>구독</span>
      </div>

      {/* Hero */}
      <header style={{marginBottom:18}}>
        <div className="eyebrow">SUBSCRIPTION</div>
        <h1 style={{margin:'4px 0 4px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1, 30px)', fontWeight:800, letterSpacing:'-0.015em'}}>
          구독
        </h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>
          현재 플랜과 혜택을 확인하고 변경·해지할 수 있어요.
        </div>
      </header>

      {/* 현재 구독 카드 */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14, border: tier === 'free' ? '1px solid var(--border)' : `1px solid color-mix(in oklab, ${current.color} 32%, var(--border))`}}>
        <div className="ps-hero" style={{
          padding:'26px 28px',
          background: tier === 'free'
            ? 'var(--bg-alt)'
            : `linear-gradient(135deg, ${current.color}, color-mix(in oklab, ${current.color} 65%, #000))`,
          color: tier === 'free' ? 'var(--ink)' : '#fff',
          display:'grid', gridTemplateColumns:'minmax(0, 1fr) auto', gap:18, alignItems:'flex-start',
        }}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', opacity: tier === 'free' ? 0.7 : 0.85}}>
              현재 플랜
            </div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:34, letterSpacing:'-0.02em', margin:'4px 0'}}>
              {current.label}
            </div>
            <div style={{fontSize:13, opacity: tier === 'free' ? 0.75 : 0.92}}>
              {current.desc}
            </div>
            {tier !== 'free' && (
              <div style={{display:'flex', gap:14, marginTop:14, fontSize:12, opacity:.92, flexWrap:'wrap'}}>
                <span><strong style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:14}}>{fmtKRW(current.price)}</strong>{current.cycle}</span>
                <span style={{opacity:.7}}>·</span>
                <span>다음 결제 · <strong style={{fontFamily:'var(--ff-mono)'}}>2026-05-19</strong></span>
                <span style={{opacity:.7}}>·</span>
                <span>가입 · <span style={{fontFamily:'var(--ff-mono)'}}>2025-11-19</span> (5개월)</span>
              </div>
            )}
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{
              padding:'5px 12px',
              background: tier === 'free' ? 'var(--bg-card, #fff)' : 'rgba(255,255,255,.18)',
              color: tier === 'free' ? 'var(--ink-mute)' : '#fff',
              borderRadius:3, fontSize:11, fontWeight:800,
              letterSpacing:'.08em', textTransform:'uppercase',
              display:'inline-block',
            }}>
              {tier === 'free' ? 'BASIC' : 'ACTIVE'}
            </div>
          </div>
        </div>

        {/* 액션 바 */}
        <div style={{padding:'14px 22px', display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', borderTop:'1px solid var(--border)'}}>
          {tier === 'free' ? (
            <button className="btn btn--primary" onClick={()=>setRoute('pricing')} style={{minHeight:44}}>업그레이드 →</button>
          ) : (
            <>
              <button className="btn btn--sm" onClick={()=>setRoute('pricing')} style={{minHeight:44}}>플랜 변경</button>
              <button className="btn btn--sm" onClick={()=>setRoute('billing')} style={{minHeight:44}}>결제수단 관리</button>
              <button className="btn btn--sm" onClick={()=>setRoute('profilePayments')} style={{minHeight:44}}>결제 내역</button>
              <div style={{flex:1}}/>
              <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--ink-soft)', cursor:'pointer'}}>
                <input type="checkbox" checked={autoRenew} onChange={e=>setAuto(e.target.checked)}/>
                자동 갱신
              </label>
              <button
                className="btn btn--sm"
                onClick={()=>setCancel(true)}
                style={{minHeight:44, color:'var(--accent)', borderColor:'color-mix(in oklab, var(--accent) 30%, var(--border))'}}
              >
                해지
              </button>
            </>
          )}
        </div>
      </div>

      {/* 혜택 리스트 */}
      <div className="card" style={{padding:'22px 24px', marginBottom:14}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
          <h2 style={{margin:0, fontSize:18, fontWeight:700}}>{current.label} 혜택</h2>
          <a onClick={()=>setRoute('pricing')} style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>전체 비교 →</a>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:0}}>
          {benefits[tier].map((b, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'24px 1fr',
              gap:14, padding:'12px 0', alignItems:'center',
              borderBottom: i < benefits[tier].length - 1 ? '1px solid var(--border)' : 0,
            }}>
              <span style={{
                width:22, height:22, borderRadius:'50%',
                display:'grid', placeItems:'center',
                background: b.ok
                  ? 'color-mix(in oklab, var(--ok) 18%, transparent)'
                  : 'var(--bg-alt)',
                color: b.ok ? 'var(--ok)' : 'var(--ink-dim)',
                fontSize:12, fontWeight:900,
              }}>
                {b.ok ? '✓' : '×'}
              </span>
              <div style={{
                fontSize:14,
                color: b.ok ? 'var(--ink)' : 'var(--ink-dim)',
                fontWeight: b.highlight ? 700 : 500,
                textDecoration: b.ok ? 'none' : 'line-through',
              }}>
                {b.t}
                {b.highlight && (
                  <span style={{
                    marginLeft:8, padding:'2px 8px',
                    background:'color-mix(in oklab, var(--accent) 12%, transparent)',
                    color:'var(--accent)',
                    fontSize:10, fontWeight:800, letterSpacing:'.06em',
                    borderRadius:3, textTransform:'uppercase',
                  }}>
                    PREMIUM
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 다른 플랜 비교 */}
      <div className="card" style={{padding:'22px 24px', marginBottom:14}}>
        <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>다른 플랜</h2>
        <div className="ps-other" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {Object.values(plans).map(p => {
            const on = p.key === tier;
            return (
              <div key={p.key} style={{
                padding:'18px 18px',
                border:`1px solid ${on ? p.color : 'var(--border)'}`,
                borderRadius:6,
                background: on ? `color-mix(in oklab, ${p.color} 6%, transparent)` : 'transparent',
                position:'relative',
              }}>
                {on && (
                  <span style={{
                    position:'absolute', top:-9, left:14,
                    padding:'2px 8px', background:p.color, color:'#fff',
                    fontSize:10, fontWeight:800, letterSpacing:'.08em',
                    borderRadius:3, textTransform:'uppercase',
                  }}>
                    이용 중
                  </span>
                )}
                <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:20, color:p.color, marginBottom:4}}>
                  {p.label}
                </div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:18, fontWeight:800, marginBottom:4}}>
                  {p.price === 0 ? '무료' : `${fmtKRW(p.price)}${p.cycle}`}
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)', minHeight:32, marginBottom:12}}>
                  {p.desc}
                </div>
                {!on && (
                  <button
                    className="btn btn--sm"
                    onClick={()=>setRoute('pricing')}
                    style={{
                      width:'100%', minHeight:40,
                      background: p.key === 'free' ? 'transparent' : p.color,
                      color: p.key === 'free' ? 'var(--ink-soft)' : '#fff',
                      borderColor: p.key === 'free' ? 'var(--border)' : p.color,
                    }}
                  >
                    {p.key === 'free' ? '다운그레이드' : (
                      plans[tier].price < p.price ? '업그레이드' : '변경'
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 최근 결제 */}
      {tier !== 'free' && (
        <div className="card" style={{padding:'22px 24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:10}}>
            <h2 style={{margin:0, fontSize:16, fontWeight:700}}>최근 결제</h2>
            <a onClick={()=>setRoute('profilePayments')} style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>전체 내역 →</a>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {billingHistory.map((h, i) => (
              <div key={i} style={{
                display:'grid', gridTemplateColumns:'1fr auto auto',
                gap:14, padding:'12px 0', alignItems:'center',
                borderBottom: i < billingHistory.length - 1 ? '1px solid var(--border)' : 0,
                fontSize:13,
              }}>
                <div style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)', fontSize:12}}>{h.date}</div>
                <div style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{fmtKRW(h.amt)}</div>
                <span className="badge badge--ok" style={{fontSize:11}}>완료</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 해지 모달 — ForceActionModal withdraw 패턴 재사용 */}
      <ForceActionModal
        open={cancelOpen}
        mode="withdraw"
        memberName={current.label}
        onClose={()=>setCancel(false)}
        onSubmit={handleCancel}
      />

      <style>{`
        @media (max-width: 720px) {
          .ps-hero { grid-template-columns: 1fr !important; }
          .ps-other { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

window.ProfileSubscription = ProfileSubscription;
