/* global React */

/**
 * ProfileWeeklyReport — /profile/weekly (D등급 P1-9 신규)
 *
 * Why: 주간 단위 활동 리포트 (이메일 주간 발송 미리보기 톤)
 *      ProfileGrowth 가 12주 trends 라면, 이건 "이번 주 vs 지난 주" 비교 + 인사이트
 * Pattern: 이메일 뉴스레터 레이아웃 — 좁은 칼럼 (max 680), 카드 stack, 명확한 섹션 헤더
 *
 * 진입: /profile "주간 리포트" 카드 / 알림 "주간 리포트가 도착했어요"
 * 복귀: AppNav 뒤로 / "이메일 구독 관리" → /profile/notifications
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   주차 navigation   | -        | ✅ < W47 >          | -        | OK
 *   요약 통계         | Profile ✅(분산) | ✅ 4 KPI       | -        | 2열
 *   비교 (vs 지난주)  | -        | ✅ delta 표시      | -        | OK
 *   경기 하이라이트   | -        | ✅ 베스트 1경기    | -        | 1열
 *   인사이트 카피     | -        | ✅ 3 인사이트      | -        | 1열
 *   다음 주 추천      | -        | ✅ 3 추천 슬롯     | -        | 1열
 *   이메일 구독 토글  | -        | ✅ footer link     | -        | OK
 */

function ProfileWeeklyReport({ setRoute }) {
  // 주간 더미 데이터
  const week = {
    label: '2025년 47주차',
    range: '11/17 (월) – 11/23 (일)',
    prev: 'W46',
    next: 'W48',
  };

  const kpis = [
    { label:'경기',     val:3, prev:2, unit:'경기', tone:'var(--accent)' },
    { label:'평균 평점', val:4.7, prev:4.4, unit:'/5.0', tone:'var(--cafe-blue)' },
    { label:'XP',       val:340, prev:220, unit:'XP', tone:'#10B981' },
    { label:'활동 시간', val:6.5, prev:4.0, unit:'시간', tone:'#F59E0B' },
  ];

  const highlight = {
    title: '이번 주 베스트 경기',
    when: '11/22 (토) 19:00',
    venue: '장충체육관 1코트',
    score: '72-68 W',
    you: { pts: 18, ast: 6, reb: 4 },
    note: '4쿼터 클러치 결정타. 평점 4.9 (팀내 1위).',
  };

  const insights = [
    { icon:'trending_up',    head:'어시스트가 늘었습니다', body:'지난주 대비 어시스트 +2.4. 동료들과의 호흡이 좋아지고 있습니다.', tone:'var(--cafe-blue)' },
    { icon:'fitness_center', head:'체력 분포가 안정적',     body:'4쿼터 평점 4.6 — 후반 집중력이 유지되고 있습니다.',           tone:'var(--ok)' },
    { icon:'lightbulb',      head:'다음 도전: 3점 슈팅',     body:'3PT 성공률 28% → 35% 목표. 연습 메뉴를 코치진과 상의해보세요.',  tone:'#F59E0B' },
  ];

  const recommendations = [
    { type:'GAME',  title:'토요일 픽업 7:00pm', sub:'장충체육관 · 2자리', cta:'신청' },
    { type:'COACH', title:'박재훈 코치 1:1', sub:'슈팅 폼 교정 · ₩50,000', cta:'예약' },
    { type:'TEAM',  title:'양재 BLAZE 게스트 모집', sub:'일요일 4:00pm', cta:'합류' },
  ];

  const Delta = ({ now, prev, asPct = false }) => {
    const diff = now - prev;
    const up = diff > 0;
    const flat = Math.abs(diff) < 0.05;
    const sign = flat ? '' : (up ? '↑' : '↓');
    const txt = asPct ? `${Math.abs(Math.round((diff/prev)*100))}%` : Math.abs(diff).toFixed(diff%1===0?0:1);
    return (
      <span style={{
        fontSize:11, fontWeight:700,
        color: flat ? 'var(--ink-dim)' : (up ? 'var(--ok)' : 'var(--err)'),
        fontFamily:'var(--ff-mono)',
      }}>
        {sign} {txt} <span style={{color:'var(--ink-dim)', fontWeight:500}}>vs {week.prev}</span>
      </span>
    );
  };

  return (
    <div className="page" style={{maxWidth:720, margin:'0 auto'}}>
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>내 프로필</a><span>›</span>
        <span style={{color:'var(--ink)'}}>주간 리포트</span>
      </div>

      {/* HERO — 이메일 뉴스레터 톤 */}
      <div style={{textAlign:'center', padding:'24px 0 28px', borderBottom:'1px solid var(--border)', marginBottom:20}}>
        <div className="eyebrow" style={{marginBottom:8}}>WEEKLY REPORT · 매주 월요일 도착</div>
        <h1 style={{margin:'0 0 6px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>{week.label}</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:16}}>{week.range}</div>
        {/* Week navigation */}
        <div style={{display:'flex', justifyContent:'center', gap:8}}>
          <button className="btn btn--sm" style={{minWidth:100}}>← {week.prev}</button>
          <button className="btn btn--sm btn--primary" disabled style={{minWidth:120, opacity:1}}>이번 주</button>
          <button className="btn btn--sm" style={{minWidth:100}} disabled>{week.next} →</button>
        </div>
      </div>

      {/* SECTION 1: KPI 4 */}
      <Section eyebrow="01" title="이번 주 요약">
        <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10}}>
          {kpis.map(k => (
            <div key={k.label} className="card" style={{padding:'16px 18px'}}>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6}}>{k.label}</div>
              <div style={{display:'flex', alignItems:'baseline', gap:4, marginBottom:6}}>
                <span style={{fontSize:28, fontWeight:900, fontFamily:'var(--ff-display)', color:k.tone}}>{k.val}</span>
                <span style={{fontSize:12, color:'var(--ink-mute)'}}>{k.unit}</span>
              </div>
              <Delta now={k.val} prev={k.prev} />
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 2: Highlight */}
      <Section eyebrow="02" title="이번 주 하이라이트">
        <div className="card" style={{padding:'20px 22px', background:'linear-gradient(135deg, color-mix(in oklab, var(--accent) 6%, transparent), transparent)'}}>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10}}>
            <div>
              <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.1em', marginBottom:4}}>BEST GAME</div>
              <div style={{fontSize:13, color:'var(--ink-mute)'}}>{highlight.when} · {highlight.venue}</div>
            </div>
            <div style={{fontSize:24, fontWeight:900, fontFamily:'var(--ff-display)', color:'var(--ok)'}}>{highlight.score}</div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:12}}>
            {[
              { l:'PTS', v:highlight.you.pts },
              { l:'AST', v:highlight.you.ast },
              { l:'REB', v:highlight.you.reb },
            ].map(s => (
              <div key={s.l} style={{textAlign:'center', padding:'10px 0', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:6}}>
                <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em'}}>{s.l}</div>
                <div style={{fontSize:22, fontWeight:900, fontFamily:'var(--ff-display)'}}>{s.v}</div>
              </div>
            ))}
          </div>
          <p style={{margin:0, fontSize:13, lineHeight:1.6, color:'var(--ink-soft)', fontStyle:'italic', borderLeft:'2px solid var(--accent)', paddingLeft:12}}>
            "{highlight.note}"
          </p>
          <button className="btn btn--sm" onClick={()=>setRoute('gameResult')} style={{marginTop:14}}>경기 리포트 보기 →</button>
        </div>
      </Section>

      {/* SECTION 3: Insights */}
      <Section eyebrow="03" title="이번 주 인사이트">
        <div style={{display:'grid', gap:10}}>
          {insights.map((ins, i) => (
            <div key={i} className="card" style={{padding:'14px 18px', display:'grid', gridTemplateColumns:'40px 1fr', gap:14, alignItems:'flex-start'}}>
              <div style={{width:40, height:40, borderRadius:8, background:`color-mix(in oklab, ${ins.tone} 14%, transparent)`, color:ins.tone, display:'grid', placeItems:'center'}}>
                <span className="material-symbols-outlined" style={{fontSize:22}}>{ins.icon}</span>
              </div>
              <div>
                <div style={{fontSize:14, fontWeight:700, marginBottom:3}}>{ins.head}</div>
                <div style={{fontSize:12, color:'var(--ink-soft)', lineHeight:1.6}}>{ins.body}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* SECTION 4: 다음 주 추천 */}
      <Section eyebrow="04" title="다음 주 추천">
        <div style={{display:'grid', gap:8}}>
          {recommendations.map((r, i) => (
            <div key={i} className="card" style={{padding:'12px 16px', display:'flex', alignItems:'center', gap:12}}>
              <span style={{fontSize:9, fontWeight:800, letterSpacing:'.12em', padding:'3px 7px', background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:3, color:'var(--ink-mute)'}}>{r.type}</span>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:700, marginBottom:2}}>{r.title}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>{r.sub}</div>
              </div>
              <button className="btn btn--sm btn--primary">{r.cta}</button>
            </div>
          ))}
        </div>
      </Section>

      {/* FOOTER — 구독 관리 */}
      <div style={{textAlign:'center', padding:'28px 0 12px', borderTop:'1px solid var(--border)', marginTop:24, fontSize:12, color:'var(--ink-mute)', lineHeight:1.7}}>
        매주 월요일 오전 9시에 받아보고 있습니다.<br/>
        <a onClick={()=>setRoute('notificationSettings')} style={{color:'var(--cafe-blue)', cursor:'pointer'}}>이메일 구독 관리</a>
        {' · '}
        <a onClick={()=>setRoute('profileGrowth')} style={{color:'var(--cafe-blue)', cursor:'pointer'}}>12주 성장 추이 보기 →</a>
      </div>
    </div>
  );
}

function Section({ eyebrow, title, children }) {
  return (
    <section style={{marginBottom:28}}>
      <div style={{display:'flex', alignItems:'baseline', gap:10, marginBottom:12}}>
        <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', fontWeight:700}}>{eyebrow}</span>
        <h2 style={{margin:0, fontSize:16, fontWeight:800, letterSpacing:'-0.01em'}}>{title}</h2>
        <div style={{flex:1, height:1, background:'var(--border)'}}/>
      </div>
      {children}
    </section>
  );
}

window.ProfileWeeklyReport = ProfileWeeklyReport;
