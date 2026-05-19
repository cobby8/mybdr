/* global React */

/**
 * RefereeInfo — /referee (D등급 P3-12 신규, 옵션B SEO 페이지)
 *
 * Why: 심판 제도 안내 (비로그인 열람 가능, SEO 인덱스 친화)
 *      Referee.jsx (심판 목록) / RefereeRequest.jsx (심판 요청) 와 별도 — "심판이 되려면 / 어떤 자격 / 보수 / 신청" 정적 안내
 * Pattern: 마케팅 랜딩 톤, 풀폭 hero + 4 step + FAQ + CTA
 *
 * 진입: 외부 검색엔진 / Help "심판이 되고 싶어요" 링크 / About 페이지
 * 복귀: 비로그인 → /signup / 로그인 → /referee/request (신청 페이지)
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   Hero + 한 줄      | -        | ✅ full-bleed       | SEO       | 1열
 *   4 step process    | -        | ✅ 그리드           | -        | 1열
 *   자격·보수 표      | -        | ✅ 2열 카드         | -        | 1열
 *   FAQ 5개           | -        | ✅ accordion        | -        | OK
 *   CTA               | -        | ✅ 비/로그인 분기   | -        | 하단 sticky
 */

function RefereeInfo({ setRoute, isLoggedIn = false }) {
  const [openFaq, setOpenFaq] = React.useState(0);

  const steps = [
    { n:'01', title:'온라인 신청', body:'프로필·자격 정보를 등록 (5분)' },
    { n:'02', title:'온라인 교육', body:'규칙 영상 강의 + 퀴즈 (2시간)' },
    { n:'03', title:'실기 평가', body:'실제 픽업 경기 1회 배정 평가' },
    { n:'04', title:'심판 인증', body:'활동 시작 — 등급별 콜 접수' },
  ];

  const tiers = [
    { tier:'BRONZE', fee:'₩30,000 / 경기', desc:'픽업·게스트 경기',     req:'기본 교육 수료' },
    { tier:'SILVER', fee:'₩50,000 / 경기', desc:'동호회 정기 리그',     req:'30 경기 이상 + 평점 4.0' },
    { tier:'GOLD',   fee:'₩80,000 / 경기', desc:'BDR 공식 토너먼트',    req:'KBA 자격증 + 평점 4.5' },
  ];

  const faqs = [
    { q:'농구 경험이 없어도 신청할 수 있나요?', a:'규칙을 정확히 이해하고 있다면 가능합니다. 다만 실기 평가에서 경기 흐름을 읽는 능력이 평가되어, 일정 수준의 경기 관전 경험을 권장합니다.' },
    { q:'교육과 평가 비용은 얼마인가요?',         a:'BRONZE 등급까지는 무료입니다. SILVER 이상 승급 시 KBA 자격증 취득 비용이 별도 발생합니다.' },
    { q:'정산은 언제 받나요?',                    a:'경기 완료 후 양 팀 모두의 평점 등록을 마치면, 매주 화요일 등록된 계좌로 일괄 입금됩니다.' },
    { q:'활동 지역을 선택할 수 있나요?',          a:'활동 가능한 행정구를 최대 5곳까지 등록할 수 있으며, 등록한 지역의 경기만 알림으로 받습니다.' },
    { q:'분쟁이 발생하면 어떻게 처리되나요?',     a:'경기 중 분쟁은 심판이 1차 판정합니다. 사후 이의제기는 BDR 운영팀이 영상 검토 후 최종 판정합니다.' },
  ];

  return (
    <div className="page page--wide" style={{paddingBottom:120}}>
      {/* Hero */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:20}}>
        <div style={{
          padding:'56px 48px',
          background:'linear-gradient(135deg, #1a1a1a, #000)',
          color:'#fff',
          position:'relative',
        }}>
          <div style={{maxWidth:600}}>
            <div style={{fontSize:11, fontWeight:800, letterSpacing:'.14em', color:'var(--accent)', marginBottom:14}}>BDR REFEREE PROGRAM</div>
            <h1 style={{margin:'0 0 14px', fontSize:42, fontWeight:900, lineHeight:1.1, letterSpacing:'-0.025em', fontFamily:'var(--ff-display)'}}>
              경기를 만드는 또 하나의 길,<br/>
              <span style={{color:'var(--accent)'}}>심판</span>이 되어보세요
            </h1>
            <p style={{margin:'0 0 24px', fontSize:15, color:'rgba(255,255,255,.78)', lineHeight:1.6, maxWidth:520}}>
              BDR 인증 심판은 픽업부터 공식 토너먼트까지, 매주 50건 이상의 경기에 배정됩니다.
              온라인 교육 후 첫 콜까지 평균 7일.
            </p>
            <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
              <button className="btn btn--primary btn--xl" onClick={()=>setRoute(isLoggedIn ? 'refereeRequest' : 'signup')}>
                {isLoggedIn ? '심판 신청 →' : '가입하고 신청 →'}
              </button>
              <button className="btn btn--xl" style={{background:'rgba(255,255,255,.08)', borderColor:'rgba(255,255,255,.2)', color:'#fff'}} onClick={()=>setRoute('referee')}>활동 중인 심판 보기</button>
            </div>
          </div>

          {/* 통계 strip */}
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:30, marginTop:48, paddingTop:30, borderTop:'1px solid rgba(255,255,255,.12)', maxWidth:600}}>
            {[
              { k:'활동 심판', v:'127명' },
              { k:'주간 경기', v:'52건' },
              { k:'평균 평점', v:'4.6 / 5.0' },
            ].map(s => (
              <div key={s.k}>
                <div style={{fontSize:24, fontWeight:900, fontFamily:'var(--ff-display)', color:'#fff'}}>{s.v}</div>
                <div style={{fontSize:11, color:'rgba(255,255,255,.5)', fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase'}}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Process */}
      <section style={{marginBottom:32}}>
        <div className="eyebrow" style={{marginBottom:6}}>HOW · 4 STEPS</div>
        <h2 style={{margin:'0 0 20px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>심판이 되는 과정</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10}}>
          {steps.map(s => (
            <div key={s.n} className="card" style={{padding:'20px 18px'}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:34, fontWeight:900, color:'var(--accent)', lineHeight:1, marginBottom:10}}>{s.n}</div>
              <div style={{fontSize:14, fontWeight:700, marginBottom:4}}>{s.title}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', lineHeight:1.5}}>{s.body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tiers */}
      <section style={{marginBottom:32}}>
        <div className="eyebrow" style={{marginBottom:6}}>TIERS · 보수 체계</div>
        <h2 style={{margin:'0 0 20px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>등급과 활동 범위</h2>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {tiers.map(t => (
            <div key={t.tier} className="card" style={{padding:'22px 22px'}}>
              <div style={{fontSize:11, fontWeight:800, letterSpacing:'.16em', color:'var(--accent)', marginBottom:10}}>{t.tier}</div>
              <div style={{fontSize:22, fontWeight:900, fontFamily:'var(--ff-display)', marginBottom:6}}>{t.fee}</div>
              <div style={{fontSize:13, color:'var(--ink-soft)', marginBottom:14, lineHeight:1.5}}>{t.desc}</div>
              <div style={{paddingTop:14, borderTop:'1px solid var(--border)'}}>
                <div style={{fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.1em', marginBottom:4}}>승급 요건</div>
                <div style={{fontSize:12, color:'var(--ink-soft)'}}>{t.req}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{marginBottom:32}}>
        <div className="eyebrow" style={{marginBottom:6}}>FAQ</div>
        <h2 style={{margin:'0 0 20px', fontSize:24, fontWeight:800, letterSpacing:'-0.015em'}}>자주 묻는 질문</h2>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          {faqs.map((f, i) => (
            <div key={i} style={{borderBottom: i < faqs.length-1 ? '1px solid var(--border)' : 'none'}}>
              <button onClick={()=>setOpenFaq(openFaq === i ? -1 : i)} style={{
                width:'100%', textAlign:'left', padding:'16px 22px', background:'transparent', border:0, cursor:'pointer',
                display:'flex', justifyContent:'space-between', alignItems:'center', gap:12,
              }}>
                <span style={{fontSize:14, fontWeight:600}}>{f.q}</span>
                <span className="material-symbols-outlined" style={{fontSize:20, color:'var(--ink-dim)', transform: openFaq === i ? 'rotate(180deg)' : 'none', transition:'transform .2s'}}>expand_more</span>
              </button>
              {openFaq === i && (
                <div style={{padding:'0 22px 18px', fontSize:13, color:'var(--ink-soft)', lineHeight:1.7}}>
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <div className="card" style={{padding:'30px 32px', textAlign:'center', background:'linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), transparent)'}}>
        <h3 style={{margin:'0 0 8px', fontSize:20, fontWeight:800, letterSpacing:'-0.015em'}}>이번 주, 심판 신청 받고 있어요</h3>
        <p style={{margin:'0 0 18px', fontSize:13, color:'var(--ink-mute)'}}>
          신청 → 교육 → 첫 경기 배정까지 평균 7일.
        </p>
        <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
          {!isLoggedIn ? (
            <>
              <button className="btn btn--lg" onClick={()=>setRoute('login')}>로그인</button>
              <button className="btn btn--primary btn--lg" onClick={()=>setRoute('signup')}>가입하고 신청 →</button>
            </>
          ) : (
            <button className="btn btn--primary btn--lg" onClick={()=>setRoute('refereeRequest')}>심판 신청 →</button>
          )}
        </div>
      </div>
    </div>
  );
}

window.RefereeInfo = RefereeInfo;
