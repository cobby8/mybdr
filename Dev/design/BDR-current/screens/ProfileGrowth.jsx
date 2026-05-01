/* global React, Icon */

/**
 * ProfileGrowth — /profile/growth (D등급 P1-6 신규)
 *
 * Why: 사용자 성장 트래킹 (경기 수 / 평점 추이 / 마일스톤)
 * Pattern: Profile.jsx 게이미피케이션 톤 + Achievements 와 일관
 *
 * 진입: /profile "내 성장" 카드 / /profile/settings 프로필 탭 링크 / 더보기 "내 활동"
 * 복귀: AppNav 뒤로 / 햄버거 → /profile
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점     | 모바일
 *   레벨·XP           | Profile ✅ | ✅ hero            | 본인 카드 | 1열
 *   경기수 추이       | -        | ✅ 12주 spark      | -        | 가로 hscroll
 *   평점 추이         | -        | ✅ 12주 line       | -        | OK
 *   마일스톤          | Achievements ✅ | ✅ 6 cards    | -        | 2열
 *   다음 목표         | -        | ✅ progress + CTA  | -        | 1열
 *   "준비 중" 라벨    | -        | ✅ DB 미구현 표시   | -        | OK
 */

function ProfileGrowth({ setRoute }) {
  // 12주 더미 — DB 미구현 영역은 prepBadge 로 구분
  const games = [4, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7, 8];
  const ratings = [3.8, 3.9, 4.0, 4.1, 4.0, 4.2, 4.3, 4.4, 4.3, 4.5, 4.6, 4.6];
  const maxG = Math.max(...games);
  const minR = 3.5, maxR = 5.0;

  const milestones = [
    { icon:'🏀', label:'누적 경기', val:'47', goal:'100', pct:47, tone:'var(--accent)' },
    { icon:'⭐', label:'평균 평점', val:'4.6', goal:'5.0', pct:92, tone:'var(--cafe-blue)' },
    { icon:'🎯', label:'시즌 MVP 후보', val:'1회', goal:'-', pct:100, tone:'var(--ok)', earned:true },
    { icon:'🔥', label:'연속 출석', val:'12주', goal:'24주', pct:50, tone:'#F59E0B' },
    { icon:'💬', label:'커뮤니티 활동', val:'128', goal:'200', pct:64, tone:'#10B981' },
    { icon:'🤝', label:'팀 멤버 추천', val:'8', goal:'10', pct:80, tone:'#8B5CF6' },
  ];

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12, flexWrap:'wrap'}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>내 프로필</a><span>›</span>
        <span style={{color:'var(--ink)'}}>내 성장</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">GROWTH · MY JOURNEY</div>
        <h1 style={{margin:'6px 0 4px', fontSize:30, fontWeight:800, letterSpacing:'-0.015em'}}>내 성장 기록</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>지난 12주 활동 + 마일스톤 진행도</div>
      </div>

      {/* HERO — 레벨/XP/연속 */}
      <div className="card" style={{padding:'24px 28px', marginBottom:14, background:'linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), transparent)'}}>
        <div style={{display:'grid', gridTemplateColumns:'auto 1fr auto', gap:20, alignItems:'center'}}>
          <div style={{width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg, var(--accent), #FF6B35)', color:'#fff', display:'grid', placeItems:'center', fontSize:30, fontWeight:900, fontFamily:'var(--ff-display)'}}>L7</div>
          <div>
            <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.12em', marginBottom:4}}>LEVEL 7 · INTERMEDIATE+</div>
            <div style={{fontSize:22, fontWeight:800, marginBottom:8}}>다음 레벨까지 <span style={{color:'var(--accent)'}}>340 XP</span></div>
            <div style={{height:8, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
              <div style={{width:'72%', height:'100%', background:'linear-gradient(90deg, var(--accent), #FF6B35)'}}/>
            </div>
            <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:6, fontFamily:'var(--ff-mono)'}}>2,160 / 2,500 XP</div>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.1em'}}>STREAK</div>
            <div style={{fontSize:32, fontWeight:900, fontFamily:'var(--ff-display)', color:'#F59E0B'}}>🔥 12</div>
            <div style={{fontSize:11, color:'var(--ink-mute)'}}>연속 주</div>
          </div>
        </div>
      </div>

      {/* 12주 추이 — 경기수 + 평점 */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14}}>
        <div className="card" style={{padding:'18px 20px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
            <h3 style={{margin:0, fontSize:14, fontWeight:700}}>주간 경기수</h3>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>최근 12주</span>
          </div>
          <div className="hscroll" style={{display:'flex', alignItems:'flex-end', gap:6, height:80, overflowX:'auto', paddingBottom:4}}>
            {games.map((g, i) => (
              <div key={i} style={{flex:'0 0 18px', display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                <div style={{width:14, height:`${(g/maxG)*60}px`, background: i === games.length-1 ? 'var(--accent)' : 'var(--cafe-blue-soft)', borderRadius:2}}/>
                <div style={{fontSize:9, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{g}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:8}}>이번 주 <b style={{color:'var(--accent)'}}>{games[games.length-1]}경기</b> · 12주 평균 5.5</div>
        </div>

        <div className="card" style={{padding:'18px 20px'}}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
            <h3 style={{margin:0, fontSize:14, fontWeight:700}}>평균 평점 추이</h3>
            <span style={{fontSize:11, color:'var(--ink-dim)'}}>5.0 만점</span>
          </div>
          <svg viewBox="0 0 240 80" style={{width:'100%', height:80}}>
            <polyline
              fill="none" stroke="var(--cafe-blue)" strokeWidth="2"
              points={ratings.map((r, i) => `${(i/(ratings.length-1))*240},${80 - ((r-minR)/(maxR-minR))*70}`).join(' ')}
            />
            {ratings.map((r, i) => (
              <circle key={i} cx={(i/(ratings.length-1))*240} cy={80 - ((r-minR)/(maxR-minR))*70} r={i===ratings.length-1?4:2} fill={i===ratings.length-1?'var(--accent)':'var(--cafe-blue)'}/>
            ))}
          </svg>
          <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:6}}>현재 <b style={{color:'var(--cafe-blue)'}}>{ratings[ratings.length-1]}</b> · 12주 +0.8 ↑</div>
        </div>
      </div>

      {/* 마일스톤 6개 */}
      <h2 style={{margin:'8px 0 12px', fontSize:18, fontWeight:800}}>마일스톤</h2>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:14}}>
        {milestones.map(m => (
          <div key={m.label} className="card" style={{padding:'18px 20px'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10}}>
              <span style={{fontSize:24}}>{m.icon}</span>
              {m.earned && <span style={{fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--ok)', background:'color-mix(in oklab, var(--ok) 12%, transparent)', padding:'3px 8px', borderRadius:3}}>달성</span>}
            </div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:4}}>{m.label}</div>
            <div style={{display:'flex', alignItems:'baseline', gap:4, marginBottom:10}}>
              <span style={{fontSize:24, fontWeight:900, fontFamily:'var(--ff-display)', color:m.tone}}>{m.val}</span>
              {m.goal !== '-' && <span style={{fontSize:12, color:'var(--ink-dim)'}}>/ {m.goal}</span>}
            </div>
            <div style={{height:5, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
              <div style={{width:`${m.pct}%`, height:'100%', background:m.tone, transition:'width .3s'}}/>
            </div>
          </div>
        ))}
      </div>

      {/* 다음 목표 CTA */}
      <div className="card" style={{padding:'18px 22px', marginBottom:14, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap'}}>
        <span className="material-symbols-outlined" style={{fontSize:28, color:'var(--accent)'}}>flag</span>
        <div style={{flex:1, minWidth:200}}>
          <div style={{fontSize:13, fontWeight:700, marginBottom:2}}>다음 목표 — 누적 50경기 (3경기 남음)</div>
          <div style={{fontSize:12, color:'var(--ink-mute)'}}>이번 주 추천 경기에 신청해 마일스톤을 달성해 보세요</div>
        </div>
        <button className="btn btn--primary btn--sm" onClick={()=>setRoute('games')}>경기 찾기 →</button>
      </div>

      {/* 준비 중 — 구간별 상세 분석 */}
      <div className="card" style={{padding:'18px 22px', marginBottom:40, opacity:0.65, display:'flex', alignItems:'center', gap:12}}>
        <span style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', color:'var(--ink-dim)', background:'var(--bg-alt)', padding:'4px 10px', borderRadius:3}}>준비 중</span>
        <div style={{flex:1, fontSize:13, color:'var(--ink-mute)'}}>구간별 상세 분석 (포지션별 / 코트별 / 시간대별) 곧 추가됩니다</div>
      </div>
    </div>
  );
}

window.ProfileGrowth = ProfileGrowth;
