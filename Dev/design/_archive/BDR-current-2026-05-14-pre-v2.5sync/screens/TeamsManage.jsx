/* global React, Icon */

/**
 * TeamsManage — /teams/manage 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 본인이 운영진(captain/vice/manager)인 팀 목록 허브
 *           - 0팀 → 빈 상태 + 새 팀 만들기 / 팀 둘러보기 안내
 *           - 1팀 → /teams/[id]/manage 자동 redirect (시안에선 데모로 표시)
 *           - 2팀+ → 카드 그리드 선택 화면
 * 진입: 더보기 → 팀 관리 / 알림
 * 복귀: 카드 클릭 → /teams/[id]/manage (TeamManage.jsx)
 *
 * ※ TeamManage.jsx 와 다름: 본 페이지는 다중팀 선택 허브 (운영팀 N개 보여주기)
 */
function TeamsManage({ setRoute }) {
  // mock 데이터 — 운영팀 3건 (captain 2 / vice 1)
  const teams = [
    { id:1, name:'REDEEM',   tag:'RDM', city:'서울', district:'중구',   color:'#DC2626', role:'captain', members:8, recent:'2일 전 픽업' },
    { id:2, name:'SWEEP',    tag:'SWP', city:'경기', district:'분당구', color:'#1B3C87', role:'vice',    members:11, recent:'5일 전 매치' },
    { id:3, name:'IRON',     tag:'IRN', city:'서울', district:'송파구', color:'#0F766E', role:'captain', members:6, recent:'어제 모집글' },
  ];

  const ROLE = { captain:'팀장', vice:'부팀장', manager:'매니저' };

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('teams')} style={{cursor:'pointer'}}>팀</a><span>›</span>
        <span style={{color:'var(--ink)'}}>팀 관리</span>
      </div>

      {/* 헤더 */}
      <header style={{marginBottom:20}}>
        <div className="eyebrow" style={{fontSize:11, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)'}}>MY TEAMS · 운영 팀 선택</div>
        <h1 style={{margin:'6px 0 2px', fontSize:24, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>관리할 팀을 선택하세요</h1>
        <p style={{margin:0, fontSize:13, color:'var(--ink-mute)'}}>
          내가 운영진(팀장·부팀장·매니저)으로 등록된 팀 {teams.length}개
        </p>
      </header>

      {/* 카드 그리드 */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
        {teams.map(t => (
          <a key={t.id} onClick={()=>setRoute('teamManage')} className="card" style={{padding:'16px 18px', cursor:'pointer', display:'block', textDecoration:'none', color:'inherit'}}>
            <div style={{display:'grid', gridTemplateColumns:'56px 1fr auto', gap:14, alignItems:'center'}}>
              {/* 팀 이니셜 박스 */}
              <div style={{
                width:56, height:56, borderRadius:8,
                background:t.color, color:'#fff',
                display:'grid', placeItems:'center',
                fontFamily:'var(--ff-display)', fontWeight:900, fontSize:18, letterSpacing:'-0.02em',
              }}>{t.tag}</div>

              {/* 팀명 + 지역 */}
              <div style={{minWidth:0}}>
                <div style={{fontSize:15, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</div>
                <div style={{marginTop:3, fontSize:12, color:'var(--ink-mute)'}}>
                  {t.city} {t.district} · 멤버 {t.members}명
                </div>
                <div style={{marginTop:2, fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{t.recent}</div>
              </div>

              {/* 역할 뱃지 */}
              <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4}}>
                <span className="badge badge--ghost" style={{fontSize:10}}>{ROLE[t.role]}</span>
                <span style={{fontSize:14, color:'var(--ink-dim)'}}>›</span>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* 새 팀 만들기 안내 */}
      <div style={{marginTop:24, padding:'14px 18px', border:'1px dashed var(--border)', borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10}}>
        <div>
          <div style={{fontSize:13, fontWeight:600, marginBottom:2}}>새로운 팀을 만드시겠어요?</div>
          <div style={{fontSize:12, color:'var(--ink-mute)'}}>본인이 팀장이 되어 동호회를 운영할 수 있습니다.</div>
        </div>
        <button className="btn btn--primary btn--sm" onClick={()=>setRoute('teamCreate')}>+ 새 팀 만들기</button>
      </div>

      {/* 안내 */}
      <p style={{marginTop:16, fontSize:11, color:'var(--ink-dim)', lineHeight:1.5}}>
        해산된 팀(status=dissolved)은 이 목록에 표시되지 않습니다. 운영팀이 1개일 경우 자동으로 해당 팀 관리 페이지로 이동합니다.
      </p>
    </div>
  );
}

window.TeamsManage = TeamsManage;
