/* global React */

// ============================================================
// ProfileBasketball — /profile/basketball (Phase F2)
//
// 시즌 스탯 (PPG / RPG / APG / +/-) + 포지션·키·손·경력 정보
// Onboarding Basketball 입력값 표시 + 편집 버튼
// 시안 출처: Profile.jsx Phase 13 Tier 1 "내 농구" 카드 확장판
// var(--accent) 강조
// ============================================================

function ProfileBasketball({ setRoute }) {
  const stats = [
    { k: 'PPG',  v: '14.2', sub: '+1.8 vs 직전',  trend: 'up'   },
    { k: 'RPG',  v: '3.8',  sub: '−0.4 vs 직전',  trend: 'down' },
    { k: 'APG',  v: '5.1',  sub: '+0.6 vs 직전',  trend: 'up'   },
    { k: '+/−',  v: '+6.4', sub: '리그 상위 18%', trend: 'up'   },
  ];
  const advanced = [
    { k: 'FG%',  v: '47.3' },
    { k: '3P%',  v: '36.1' },
    { k: 'FT%',  v: '78.2' },
    { k: 'TO',   v: '2.1'  },
    { k: 'STL',  v: '1.4'  },
    { k: 'BLK',  v: '0.3'  },
    { k: 'EFF',  v: '17.6' },
    { k: 'MIN',  v: '24.8' },
  ];
  const profile = [
    { k: '주포지션', v: 'G · 가드',     desc: '볼 핸들링·슈팅' },
    { k: '주력 손',  v: '오른손',       desc: '— ' },
    { k: '키',       v: '178 cm',       desc: '체중 72 kg' },
    { k: '경력',     v: 'L4 · 5년+',    desc: '아마추어 대회 출전' },
    { k: '레벨',     v: 'L8 · 1,684',   desc: '시즌 레이팅' },
    { k: 'BDR 점수', v: '82.4',         desc: '매너 91 · 출석 96' },
  ];
  const recent = [
    { date: '04.20', oppo: '장충체육관 픽업',   line: '18p 4r 6a', result: 'W 21–18', pct: '+12' },
    { date: '04.17', oppo: 'REDEEM 주간 스크림', line: '12p 5r 7a', result: 'W 38–32', pct: '+8'  },
    { date: '04.12', oppo: '반포 주말 3x3',    line: '8p 2r 3a',   result: 'L 15–21', pct: '−6'  },
    { date: '04.07', oppo: '강남구 픽업 리그', line: '22p 3r 4a',  result: 'W 24–20', pct: '+9'  },
    { date: '04.03', oppo: '용산 야간 픽업',   line: '11p 4r 8a',  result: 'W 20–17', pct: '+5'  },
  ];

  return (
    <div className="page" style={{maxWidth:960}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>내 농구</span>
      </div>

      {/* Hero */}
      <header style={{marginBottom:20, display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:12, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">MY BASKETBALL</div>
          <h1 style={{margin:'4px 0 4px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1, 30px)', fontWeight:800, letterSpacing:'-0.015em'}}>
            내 농구
          </h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>
            2026 Spring · 47경기 · <span style={{color:'var(--accent)', fontWeight:700}}>30승 17패 · 승률 63.8%</span>
          </div>
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          <button className="btn btn--sm" onClick={()=>setRoute('stats')} style={{minHeight:44}}>전체 시즌 →</button>
          <button className="btn btn--sm" onClick={()=>setRoute('onboardingBasketball')} style={{minHeight:44}}>정보 편집</button>
        </div>
      </header>

      {/* 4 핵심 스탯 — var(--accent) 강조 */}
      <div className="pb-stats" style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom:18}}>
        {stats.map((s, i) => (
          <div key={s.k} className="card" style={{
            padding:'20px 22px',
            borderTop: i === 0 ? '3px solid var(--accent)' : '3px solid transparent',
            position:'relative',
          }}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase'}}>
              {s.k}
            </div>
            <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:42, letterSpacing:'-0.02em', margin:'2px 0 4px', color: i === 0 ? 'var(--accent)' : 'var(--ink)'}}>
              {s.v}
            </div>
            <div style={{
              fontSize:11, fontFamily:'var(--ff-mono)',
              color: s.trend === 'up' ? 'var(--ok)' : 'var(--accent)',
            }}>
              {s.trend === 'up' ? '▲' : '▼'} {s.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0, 1.4fr) minmax(0, 1fr)', gap:14, alignItems:'flex-start'}} className="pb-split">
        {/* 좌: 선수 정보 카드 */}
        <div className="card" style={{padding:'22px 24px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
            <h2 style={{margin:0, fontSize:18, fontWeight:700}}>선수 정보</h2>
            <a onClick={()=>setRoute('onboardingBasketball')} style={{fontSize:12, color:'var(--ink-dim)', cursor:'pointer'}}>온보딩에서 편집 →</a>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, border:'1px solid var(--border)', borderRadius:6, overflow:'hidden'}} className="pb-info-grid">
            {profile.map((p, i) => (
              <div key={p.k} style={{
                padding:'14px 16px',
                background: i % 2 === 0 ? 'var(--bg-alt)' : 'transparent',
                borderTop: i >= 2 ? '1px solid var(--border)' : 0,
                borderLeft: i % 2 === 1 ? '1px solid var(--border)' : 0,
              }}>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase'}}>
                  {p.k}
                </div>
                <div style={{fontFamily:'var(--ff-display)', fontWeight:800, fontSize:18, letterSpacing:'-0.01em', margin:'2px 0'}}>
                  {p.v}
                </div>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 우: 어드밴스드 스탯 */}
        <div className="card" style={{padding:'22px 24px'}}>
          <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>세부 지표</h2>
          <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:0}}>
            {advanced.map((a, i) => (
              <div key={a.k} style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
                padding:'10px 0',
                borderBottom: i < advanced.length - 2 ? '1px solid var(--border)' : 0,
                paddingLeft: i % 2 === 1 ? 12 : 0,
                paddingRight: i % 2 === 0 ? 12 : 0,
                borderRight: i % 2 === 0 ? '1px solid var(--border)' : 0,
              }}>
                <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em'}}>{a.k}</span>
                <span style={{fontFamily:'var(--ff-mono)', fontSize:14, fontWeight:700}}>{a.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 최근 경기 폼 */}
      <div className="card" style={{padding:'22px 24px', marginTop:14}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
          <h2 style={{margin:0, fontSize:18, fontWeight:700}}>최근 폼</h2>
          <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>최근 5경기</span>
        </div>
        <div className="data-table" style={{border:'1px solid var(--border)', borderRadius:6, overflow:'hidden'}}>
          <div className="data-table__head" style={{
            display:'grid', gridTemplateColumns:'72px 1fr 110px 110px 80px',
            gap:10, padding:'10px 14px', background:'var(--bg-alt)',
            fontSize:11, color:'var(--ink-mute)', fontWeight:700,
            letterSpacing:'.06em', textTransform:'uppercase',
            borderBottom:'1px solid var(--border)',
          }}>
            <div>날짜</div><div>상대</div><div>박스스코어</div><div>결과</div><div style={{textAlign:'right'}}>+/−</div>
          </div>
          {recent.map((r, i) => (
            <div key={i} className="data-table__row" style={{
              display:'grid', gridTemplateColumns:'72px 1fr 110px 110px 80px',
              gap:10, padding:'12px 14px',
              borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 0,
              alignItems:'center', fontSize:13,
            }}>
              <div data-label="날짜" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>{r.date}</div>
              <div data-label="상대" data-primary="true" style={{fontWeight:600}}>{r.oppo}</div>
              <div data-label="박스" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-soft)'}}>{r.line}</div>
              <div data-label="결과">
                <span className={`badge ${r.result.startsWith('W') ? 'badge--ok' : 'badge--red'}`} style={{fontSize:11}}>
                  {r.result}
                </span>
              </div>
              <div data-label="+/−" style={{
                textAlign:'right', fontFamily:'var(--ff-mono)', fontWeight:700,
                color: r.pct.startsWith('+') ? 'var(--ok)' : 'var(--accent)',
              }}>
                {r.pct}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .pb-stats { grid-template-columns: repeat(2, 1fr) !important; }
          .pb-split { grid-template-columns: 1fr !important; }
          .pb-info-grid { grid-template-columns: 1fr !important; }
          .pb-info-grid > div { border-left: 0 !important; border-top: 1px solid var(--border) !important; background: var(--bg-alt) !important; }
          .pb-info-grid > div:first-child { border-top: 0 !important; }
        }
      `}</style>
    </div>
  );
}

window.ProfileBasketball = ProfileBasketball;
