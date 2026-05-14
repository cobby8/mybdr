/* global React, TEAMS, Icon, LevelBadge, Avatar */

// ============================================================
// Phase A.6 §3 — TeamList 운영 정합 (mybdr.kr/teams 패턴)
// - Hero 헤더 grid 1fr auto (eyebrow + h1 + 부제 / 우측 액션)
// - 검색 토글 (.app-nav__icon-btn 패턴 — 클릭 시 input 노출)
// - FilterChipBar (지역 / 정렬) — 가나다 desc count
// - 미니멀 카드 (로고 + 팀명 한/영 + 지역 + 멤버 수 + 레이팅)
// ============================================================

// 운영 src 추정 도시 매핑 (TEAMS 에 city 데이터 없어 id 별 잠정 박제)
const TEAM_CITIES = {
  redeem: '서울',  '3point': '서울',  monkeys: '경기', iron: '인천',
  zone: '서울',    heat: '서울',      kings: '경기',   pivot: '인천',
};
const TEAM_MEMBERS = {
  redeem: 12, '3point': 9, monkeys: 14, iron: 8,
  zone: 11, heat: 7, kings: 15, pivot: 6,
};
const TEAM_NAME_EN = {
  redeem: 'REDEEM', '3point': '3POINT', monkeys: 'MONKEYS', iron: 'IRON WOLVES',
  zone: 'THE ZONE', heat: 'SEOUL HEAT', kings: 'KINGS CREW', pivot: 'PIVOT',
};

function TeamList({ setRoute }) {
  const [city, setCity] = React.useState('전체');
  const [sort, setSort] = React.useState('rating');     // rating | members | recent
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState('');

  // 가나다 desc count (운영 cities 패턴)
  const cityCounts = React.useMemo(() => {
    const m = {};
    TEAMS.forEach(t => { const c = TEAM_CITIES[t.id] || '기타'; m[c] = (m[c] || 0) + 1; });
    return m;
  }, []);
  const cities = ['전체', ...Object.keys(cityCounts).sort((a,b) => cityCounts[b] - cityCounts[a])];

  let shown = TEAMS.filter(t => {
    if (city !== '전체' && (TEAM_CITIES[t.id] || '기타') !== city) return false;
    if (q && !t.name.includes(q) && !t.tag.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  if (sort === 'rating')  shown = [...shown].sort((a,b) => b.rating - a.rating);
  if (sort === 'members') shown = [...shown].sort((a,b) => (TEAM_MEMBERS[b.id]||0) - (TEAM_MEMBERS[a.id]||0));
  if (sort === 'recent')  shown = [...shown].sort((a,b) => b.founded - a.founded);

  return (
    <div className="page">
      {/* Hero 헤더 grid 1fr auto (02 §10-5) */}
      <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap:16, marginBottom:18, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">팀 · TEAMS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>등록 팀 {TEAMS.length}팀</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>전국 팀 모집 · 매치 신청 · 팀 합류</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {searchOpen && (
            <input
              autoFocus
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="팀 이름·태그 검색"
              className="input"
              style={{width:200, fontSize:13, padding:'8px 12px', borderRadius:'var(--radius-chip)'}}
            />
          )}
          <button
            className="app-nav__icon-btn"
            onClick={()=>{ setSearchOpen(!searchOpen); if (searchOpen) setQ(''); }}
            title="검색"
            aria-label="검색"
          >
            <Icon.search/>
          </button>
          <button className="btn btn--primary" onClick={()=>setRoute('createTeam')}>
            <Icon.plus/> 팀 등록
          </button>
        </div>
      </div>

      {/* FilterChipBar — 지역 + 정렬 (운영 cities 패턴) */}
      <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {cities.map(c => (
            <button
              key={c}
              onClick={()=>setCity(c)}
              className="btn btn--sm"
              style={city===c?{background:'var(--ink)', color:'var(--bg)', borderColor:'var(--ink)'}:{}}
            >
              {c}
              {c !== '전체' && <span style={{fontFamily:'var(--ff-mono)', fontSize:10, marginLeft:4, opacity:.7}}>{cityCounts[c]}</span>}
            </button>
          ))}
        </div>
        <div style={{display:'flex', gap:6, alignItems:'center', flexShrink:0}}>
          <span style={{fontSize:12, color:'var(--ink-mute)', whiteSpace:'nowrap', flexShrink:0}}>정렬</span>
          {[['rating','레이팅순'],['members','멤버순'],['recent','최신순']].map(([k,l]) => (
            <button
              key={k}
              onClick={()=>setSort(k)}
              className="btn btn--sm"
              style={sort===k?{background:'var(--bg-elev)', color:'var(--ink)', borderColor:'var(--ink-dim)'}:{}}
            >{l}</button>
          ))}
        </div>
      </div>

      {/* 미니멀 카드 그리드 — 로고 + 팀명 한/영 + 지역 + 멤버 수 */}
      {shown.length === 0 ? (
        <div className="card" style={{padding:'48px 24px', textAlign:'center', color:'var(--ink-mute)'}}>
          <div style={{fontSize:13}}>검색 결과가 없습니다.</div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12}}>
          {shown.map((t) => (
            <div
              key={t.id}
              className="card"
              style={{padding:'16px', display:'grid', gridTemplateColumns:'56px 1fr', gap:14, alignItems:'center', cursor:'pointer'}}
              onClick={()=>setRoute('teamDetail')}
            >
              <Avatar src={t.logo} tag={t.tag} name={t.name} color={t.color} ink={t.ink} size={56} radius={6}/>
              <div style={{minWidth:0}}>
                <div style={{display:'flex', alignItems:'baseline', gap:6, flexWrap:'wrap'}}>
                  <div style={{fontWeight:700, fontSize:16, letterSpacing:'-0.01em', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'100%'}}>{t.name}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', letterSpacing:'.06em', whiteSpace:'nowrap'}}>{TEAM_NAME_EN[t.id] || t.tag}</div>
                </div>
                <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4, display:'flex', gap:10, flexWrap:'wrap'}}>
                  <span style={{whiteSpace:'nowrap'}}>📍 {TEAM_CITIES[t.id] || '기타'}</span>
                  <span style={{whiteSpace:'nowrap'}}>👥 {TEAM_MEMBERS[t.id] || '?'}명</span>
                  <span style={{color:'var(--ink-soft)', fontFamily:'var(--ff-mono)', whiteSpace:'nowrap'}}>R {t.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

window.TeamList = TeamList;
