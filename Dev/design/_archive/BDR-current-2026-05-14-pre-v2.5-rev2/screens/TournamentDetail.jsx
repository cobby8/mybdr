/* global React, TOURNAMENTS, TEAMS, MY_TEAM */

// ============================================================
// TournamentDetail — /tournaments/[id] (Phase F3)
//
// Hero (포스터 / 제목 / 일정 / 장소 / 참가비) + 상태 뱃지 + D-day
// 진행률 막대 (team_count / max_teams) — Phase A.6 패턴
// 5 탭 (개요 / 일정 / 대진표 / 참가팀 / 규정) — inline 분기
// "신청" / "대진표 보기" CTA
// ============================================================

const { useState: useStateTD } = React;

function TournamentDetail({ setRoute }) {
  const t = (typeof TOURNAMENTS !== 'undefined' && TOURNAMENTS[0]) || {
    id:'bdr-challenge-spring-2026', title:'BDR CHALLENGE SPRING 2026',
    host:'BDR 운영팀', date:'2026.05.18 ~ 06.07', venue:'잠실 실내체육관 외 3개 코트',
    fee:80000, status:'open', team_count:24, max_teams:32, accent:'#E31B23',
    division:'OPEN · 5x5', mode:'더블 엘리미네이션',
  };
  const [tab, setTab] = useStateTD('overview');

  const statusMeta = {
    open:      { label:'접수중',   color:'var(--cafe-blue)', dday:'D-9'  },
    closing:   { label:'마감임박', color:'var(--accent)',    dday:'D-2'  },
    closed:    { label:'접수마감', color:'var(--ink-dim)',   dday:'마감'  },
    live:      { label:'진행중',   color:'var(--ok)',        dday:'LIVE' },
    ended:     { label:'종료',     color:'var(--ink-dim)',   dday:'종료' },
    preparing: { label:'접수예정', color:'var(--cafe-blue)', dday:'D-21' },
  };
  const sm = statusMeta[t.status] || statusMeta.open;
  const pct = Math.round((t.team_count / t.max_teams) * 100);

  return (
    <div className="page" style={{maxWidth:1040}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('match')} style={{cursor:'pointer'}}>대회</a><span>›</span>
        <span style={{color:'var(--ink)'}}>{t.title}</span>
      </div>

      {/* HERO */}
      <div className="card" style={{padding:0, overflow:'hidden', marginBottom:14}}>
        <div className="td-hero" style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:0, alignItems:'stretch'}}>
          {/* 포스터 placeholder */}
          <div style={{
            background:`linear-gradient(135deg, ${t.accent || 'var(--accent)'}, color-mix(in oklab, ${t.accent || 'var(--accent)'} 50%, #000))`,
            color:'#fff', padding:'24px 22px', display:'flex', flexDirection:'column', justifyContent:'space-between',
            minHeight:240,
          }}>
            <div>
              <div style={{fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', opacity:.85}}>BDR TOURNAMENT</div>
              <div style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:28, lineHeight:1.05, letterSpacing:'-0.02em', marginTop:14}}>
                {t.title.split(' ').slice(0, 2).join(' ')}<br/>
                <span style={{fontSize:18, opacity:.85}}>{t.title.split(' ').slice(2).join(' ')}</span>
              </div>
            </div>
            <div style={{fontFamily:'var(--ff-mono)', fontSize:11, opacity:.85, letterSpacing:'.06em'}}>
              {t.id}
            </div>
          </div>
          {/* 정보 */}
          <div style={{padding:'24px 28px', display:'flex', flexDirection:'column', gap:14}}>
            <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
              <span style={{
                padding:'4px 10px', background:sm.color, color:'#fff',
                fontSize:11, fontWeight:800, letterSpacing:'.06em', borderRadius:3, textTransform:'uppercase',
              }}>{sm.label}</span>
              <span style={{
                fontFamily:'var(--ff-display)', fontWeight:900, fontSize:22,
                color:sm.color, letterSpacing:'-0.01em',
              }}>{sm.dday}</span>
              <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>· {t.division || 'OPEN'}</span>
              <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>· {t.mode || '더블 엘리'}</span>
            </div>
            <h1 style={{margin:0, fontFamily:'var(--ff-display)', fontSize:26, fontWeight:800, letterSpacing:'-0.015em'}}>
              {t.title}
            </h1>
            <div style={{display:'grid', gridTemplateColumns:'auto 1fr', gap:'6px 14px', fontSize:13}}>
              <span style={{color:'var(--ink-dim)'}}>주최</span><span>{t.host || 'BDR 운영팀'}</span>
              <span style={{color:'var(--ink-dim)'}}>일정</span><span style={{fontFamily:'var(--ff-mono)'}}>{t.date}</span>
              <span style={{color:'var(--ink-dim)'}}>장소</span><span>{t.venue}</span>
              <span style={{color:'var(--ink-dim)'}}>참가비</span><span style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>₩{(t.fee || 0).toLocaleString('ko-KR')} / 팀</span>
            </div>

            {/* 진행률 */}
            <div>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:5, color:'var(--ink-mute)'}}>
                <span>참가팀 모집</span>
                <span style={{fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ink)'}}>
                  {t.team_count} / {t.max_teams} <span style={{color:sm.color, marginLeft:4}}>({pct}%)</span>
                </span>
              </div>
              <div style={{height:6, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden'}}>
                <div style={{width:`${pct}%`, height:'100%', background:sm.color, transition:'width .3s'}}/>
              </div>
            </div>

            {/* CTA */}
            <div style={{display:'flex', gap:8, marginTop:4, flexWrap:'wrap'}}>
              <button className="btn btn--primary" onClick={()=>setRoute('tournamentEnroll')} style={{minHeight:44, minWidth:140}}>
                참가 신청
              </button>
              <button className="btn btn--sm" onClick={()=>setTab('bracket')} style={{minHeight:44}}>
                대진표 보기
              </button>
              <button className="btn btn--sm" style={{minHeight:44}}>공유</button>
              <button className="btn btn--sm" style={{minHeight:44, marginLeft:'auto'}}>관심 ☆</button>
            </div>
          </div>
        </div>
      </div>

      {/* 5 탭 */}
      {typeof TournamentTabBar !== 'undefined' && (
        <TournamentTabBar value={tab} onChange={setTab} setRoute={setRoute} tid={t.id}/>
      )}

      {/* Inline 컨텐츠 분기 */}
      <div style={{marginTop:14}}>
        {tab === 'overview' && <TDOverview t={t}/>}
        {tab === 'schedule' && (
          <div className="card" style={{padding:'22px 24px', textAlign:'center'}}>
            <div style={{fontSize:14, color:'var(--ink-mute)', marginBottom:10}}>경기 일정 전체 페이지로 이동</div>
            <button className="btn btn--primary" onClick={()=>setRoute('tournamentSchedule')} style={{minHeight:44}}>일정 페이지 →</button>
          </div>
        )}
        {tab === 'bracket' && (
          <div className="card" style={{padding:'22px 24px', textAlign:'center'}}>
            <div style={{fontSize:14, color:'var(--ink-mute)', marginBottom:10}}>대진표 전체 페이지로 이동</div>
            <button className="btn btn--primary" onClick={()=>setRoute('bracket')} style={{minHeight:44}}>대진표 페이지 →</button>
          </div>
        )}
        {tab === 'teams' && (
          <div className="card" style={{padding:'22px 24px', textAlign:'center'}}>
            <div style={{fontSize:14, color:'var(--ink-mute)', marginBottom:10}}>참가팀 전체 페이지로 이동</div>
            <button className="btn btn--primary" onClick={()=>setRoute('tournamentTeams')} style={{minHeight:44}}>참가팀 페이지 →</button>
          </div>
        )}
        {tab === 'rules' && <TDRules/>}
      </div>

      <style>{`
        @media (max-width: 720px) {
          .td-hero { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function TDOverview({ t }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'minmax(0, 2fr) minmax(0, 1fr)', gap:14}} className="td-overview">
      <div className="card" style={{padding:'22px 24px'}}>
        <h2 style={{margin:'0 0 12px', fontSize:18, fontWeight:700}}>대회 소개</h2>
        <p style={{margin:'0 0 14px', fontSize:14, color:'var(--ink-soft)', lineHeight:1.7}}>
          BDR Challenge Spring 2026 은 전국 5x5 아마추어 클럽팀 대상 더블 엘리미네이션 토너먼트입니다.
          예선 8개 그룹 · 본선 16강 · 결승까지 5주에 걸쳐 진행되며, 우승팀에는 상금 500만원과 시즌 시드 배정 혜택이 주어집니다.
        </p>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginTop:10}}>
          {[
            { k:'우승 상금', v:'₩5,000,000', c:'var(--accent)' },
            { k:'준우승',    v:'₩2,000,000', c:'var(--cafe-blue)' },
            { k:'MVP',       v:'₩500,000',   c:'var(--ink)' },
          ].map(s => (
            <div key={s.k} style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, borderTop:`3px solid ${s.c}`}}>
              <div style={{fontSize:10, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase'}}>{s.k}</div>
              <div style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:16, marginTop:2}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card" style={{padding:'22px 24px'}}>
        <h3 style={{margin:'0 0 10px', fontSize:14, fontWeight:700}}>주요 일정</h3>
        <div style={{display:'flex', flexDirection:'column', gap:0}}>
          {[
            { d:'05.10', t:'접수 마감', on:false },
            { d:'05.18', t:'예선 1라운드', on:true },
            { d:'05.25', t:'예선 2라운드', on:false },
            { d:'06.01', t:'준결승', on:false },
            { d:'06.07', t:'결승', on:false },
          ].map((e, i) => (
            <div key={i} style={{
              display:'grid', gridTemplateColumns:'56px 1fr 8px',
              gap:10, padding:'10px 0', alignItems:'center',
              borderBottom: i < 4 ? '1px solid var(--border)' : 0,
            }}>
              <span style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-mute)', fontWeight:700}}>{e.d}</span>
              <span style={{fontSize:13, fontWeight: e.on ? 700 : 500, color: e.on ? 'var(--accent)' : 'var(--ink)'}}>{e.t}</span>
              {e.on && <span style={{width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>}
            </div>
          ))}
        </div>
      </div>
      <style>{`
        @media (max-width: 720px) {
          .td-overview { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function TDRules() {
  const sections = [
    { h:'참가 자격', items:['BDR 등록 클럽팀 한정 (4인 이상 로스터)', '선출 출전 제한 — L7 이상 팀당 최대 1명', '나이 제한 없음 / 만 18세 이상 동의 필요'] },
    { h:'경기 규칙', items:['FIBA 5x5 룰 적용 (10분 4쿼터)', '24초 샷클락 / 8초 백코트', '파울 5개 → 퇴장 / 팀 파울 7개 → 자유투'] },
    { h:'복장·장비', items:['홈/원정 유니폼 색 구분 의무', '등번호 0~99 (중복 금지)', '액세서리 반입 금지 — 안전상'] },
    { h:'분쟁·이의 제기', items:['경기 종료 30분 이내 운영팀 서면 제출', '심판 판정은 최종 — 경기 결과 번복 불가', '징계 대상 행위는 운영팀이 별도 결정'] },
  ];
  return (
    <div className="card" style={{padding:'22px 24px'}}>
      <h2 style={{margin:'0 0 14px', fontSize:18, fontWeight:700}}>대회 규정</h2>
      {sections.map((s, i) => (
        <div key={i} style={{marginBottom:18}}>
          <div style={{fontSize:12, fontWeight:800, letterSpacing:'.08em', textTransform:'uppercase', color:'var(--accent)', marginBottom:8}}>
            {s.h}
          </div>
          <ul style={{margin:0, paddingLeft:18, fontSize:13, color:'var(--ink-soft)', lineHeight:1.7}}>
            {s.items.map((it, j) => <li key={j}>{it}</li>)}
          </ul>
        </div>
      ))}
      <div style={{padding:'14px 16px', background:'var(--bg-alt)', borderRadius:6, fontSize:12, color:'var(--ink-mute)'}}>
        규정 전문 PDF는 참가 신청 시 함께 발송됩니다.
      </div>
    </div>
  );
}

window.TournamentDetail = TournamentDetail;
