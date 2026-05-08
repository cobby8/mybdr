/* global React, Icon */

// ============================================================
// Phase A.6 §4 — CourtList 운영 정합 (mybdr.kr/courts 패턴)
// - Hero 헤더 grid 1fr auto
// - 검색 토글 (.app-nav__icon-btn) + 지도 토글
// - FilterChipBar 코트 타입 (전체 / 실내 / 실외 / 무료 / 지금 한산)
// - 카카오맵 placeholder (시안 더미 마커, 실제 임베드 X)
// - 미니멀 카드 (이름 + 주소 + 타입 + 무료/유료 + 활동 인원)
// ============================================================

const COURTS = [
  { id: 'jangchung', name: '장충체육관', area: '중구', type: '실내', courts: 2, fee: '무료', hours: '09–22', hot: true,  today: 18, status: 'busy',  floor: '우레탄', light: '상',     tag: '픽업 다수' },
  { id: 'olympic',   name: '올림픽체조경기장 보조', area: '송파구', type: '실내', courts: 1, fee: '유료', hours: '10–20', hot: false, today: 6,  status: 'ok',    floor: '마룻바닥', light: '최상',   tag: '대회장' },
  { id: 'yongsan',   name: '용산국민체육센터', area: '용산구', type: '실내', courts: 2, fee: '유료', hours: '06–22', hot: true,  today: 14, status: 'ok',    floor: '우레탄', light: '상',     tag: '샤워실 있음' },
  { id: 'yangjae',   name: '양재체육관', area: '서초구', type: '실내', courts: 1, fee: '유료', hours: '09–21', hot: false, today: 4,  status: 'quiet', floor: '마룻바닥', light: '중',     tag: '대회 예정' },
  { id: 'hanriver',  name: '뚝섬유원지 농구장', area: '광진구', type: '실외', courts: 3, fee: '무료', hours: '상시',  hot: true,  today: 22, status: 'busy',  floor: '아스팔트', light: '야간X',   tag: '강변 뷰' },
  { id: 'jamsil',    name: '잠실학생체육관', area: '송파구', type: '실내', courts: 2, fee: '유료', hours: '09–21', hot: false, today: 8,  status: 'ok',    floor: '마룻바닥', light: '최상',   tag: '대회장' },
  { id: 'sungsu',    name: '성수동 간이 농구장', area: '성동구', type: '실외', courts: 1, fee: '무료', hours: '상시',  hot: false, today: 5,  status: 'quiet', floor: '우레탄', light: '야간O',   tag: '소규모' },
  { id: 'gangnam',   name: '강남구민체육센터', area: '강남구', type: '실내', courts: 1, fee: '유료', hours: '06–22', hot: false, today: 9,  status: 'ok',    floor: '우레탄', light: '상',     tag: '개인 락커' },
];

function statusBadge(s) {
  if (s === 'busy')  return { label: '혼잡', cls: 'badge--red' };
  if (s === 'quiet') return { label: '한산', cls: 'badge--soft' };
  return { label: '보통', cls: 'badge--ok' };
}

function CourtList({ setRoute }) {
  const [filter, setFilter] = React.useState('전체');
  const [city, setCity] = React.useState('전체');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [q, setQ] = React.useState('');
  const [showMap, setShowMap] = React.useState(true);
  const filters = ['전체', '실내', '실외', '무료', '지금 한산'];

  const cityCounts = React.useMemo(() => {
    const m = {};
    COURTS.forEach(c => { m[c.area] = (m[c.area] || 0) + 1; });
    return m;
  }, []);
  const cities = ['전체', ...Object.keys(cityCounts).sort((a,b) => cityCounts[b] - cityCounts[a])];

  const shown = COURTS.filter(c => {
    if (filter === '실내' && c.type !== '실내') return false;
    if (filter === '실외' && c.type !== '실외') return false;
    if (filter === '무료' && c.fee !== '무료') return false;
    if (filter === '지금 한산' && c.status === 'busy') return false;
    if (city !== '전체' && c.area !== city) return false;
    if (q && !c.name.includes(q) && !c.area.includes(q)) return false;
    return true;
  });

  return (
    <div className="page">
      {/* Hero 헤더 grid 1fr auto (02 §10-5) */}
      <div style={{display:'grid', gridTemplateColumns:'1fr auto', alignItems:'flex-end', gap:16, marginBottom:18, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">코트 · COURTS</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>서울 코트 {COURTS.length}곳</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>오늘 방문자 기반 혼잡도 · 10분마다 갱신</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          {searchOpen && (
            <input
              autoFocus
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="코트 이름·지역 검색"
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
          <button
            className="btn btn--sm"
            onClick={()=>setShowMap(!showMap)}
            style={showMap?{background:'var(--bg-elev)', borderColor:'var(--ink-dim)'}:{}}
          >
            {showMap ? '지도 숨기기' : '지도 보기'}
          </button>
        </div>
      </div>

      {/* FilterChipBar — 코트 타입 + 지역 (운영 chip-bar 패턴) */}
      <div style={{display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'space-between', marginBottom:16}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {filters.map(f => (
            <button
              key={f}
              className="btn btn--sm"
              onClick={()=>setFilter(f)}
              style={filter===f?{background:'var(--ink)', color:'var(--bg)', borderColor:'var(--ink)'}:{}}
            >{f}</button>
          ))}
        </div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', flexShrink:0}}>
          <span style={{fontSize:12, color:'var(--ink-mute)', whiteSpace:'nowrap', flexShrink:0}}>지역</span>
          {cities.slice(0, 6).map(c => (
            <button
              key={c}
              className="btn btn--sm"
              onClick={()=>setCity(c)}
              style={city===c?{background:'var(--bg-elev)', borderColor:'var(--ink-dim)', color:'var(--ink)'}:{}}
            >
              {c}
              {c !== '전체' && <span style={{fontFamily:'var(--ff-mono)', fontSize:10, marginLeft:4, opacity:.7}}>{cityCounts[c]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* 카카오맵 placeholder + 카드 그리드 */}
      <div style={{display:'grid', gridTemplateColumns: showMap ? 'minmax(0,1fr) 340px' : '1fr', gap:20, alignItems:'flex-start'}}>
        <div>
          {shown.length === 0 ? (
            <div className="card" style={{padding:'48px 24px', textAlign:'center', color:'var(--ink-mute)'}}>
              <div style={{fontSize:13}}>조건에 맞는 코트가 없습니다.</div>
            </div>
          ) : (
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
              {shown.map(c => {
                const s = statusBadge(c.status);
                return (
                  <div key={c.id} className="card" style={{padding:'14px 16px', cursor:'pointer', display:'flex', flexDirection:'column', gap:8}} onClick={()=>setRoute('courtDetail')}>
                    <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8}}>
                      <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', whiteSpace:'nowrap'}}>{c.area}</span>
                      <div style={{display:'flex', gap:4, flexShrink:0}}>
                        {c.hot && <span className="badge badge--red">HOT</span>}
                        <span className={`badge ${s.cls}`}>{s.label}</span>
                      </div>
                    </div>
                    <div style={{fontWeight:700, fontSize:16, letterSpacing:'-0.01em'}}>{c.name}</div>
                    <div style={{fontSize:12, color:'var(--ink-mute)', lineHeight:1.5}}>
                      {c.type} · {c.courts}코트 · {c.fee} · {c.hours}
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginTop:'auto', paddingTop:6, borderTop:'1px dashed var(--border)'}}>
                      <div style={{flex:1, fontSize:11, color:'var(--ink-dim)'}}>활동 <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)'}}>{c.today}</b>명</div>
                      <button className="btn btn--sm">상세</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showMap && (
          <aside style={{position:'sticky', top:120}}>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              <div style={{
                height: 320,
                background:
                  'repeating-linear-gradient(45deg, var(--bg-alt) 0 10px, var(--bg-elev) 10px 20px)',
                position:'relative',
                borderBottom:'1px solid var(--border)',
              }}>
                {shown.slice(0, 8).map((c, i) => {
                  const x = 15 + (i * 11) % 70;
                  const y = 20 + (i * 17) % 65;
                  return (
                    <div
                      key={c.id}
                      title={c.name}
                      style={{
                        position:'absolute', left:`${x}%`, top:`${y}%`,
                        width:14, height:14,
                        background: c.status==='busy' ? 'var(--accent)' : c.status==='quiet' ? 'var(--ok)' : 'var(--cafe-blue)',
                        border:'2px solid #fff', borderRadius:'50% 50% 50% 0',
                        transform:'rotate(-45deg)', boxShadow:'0 2px 6px rgba(0,0,0,.25)',
                      }}
                    />
                  );
                })}
                <div style={{position:'absolute', bottom:10, left:10, fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', background:'var(--bg-elev)', padding:'3px 7px', borderRadius:3}}>
                  KAKAO MAP · placeholder
                </div>
              </div>
              <div style={{padding:'14px 16px'}}>
                <div style={{fontWeight:700, fontSize:14}}>내 주변 코트</div>
                <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>위치 권한을 허용하면 가까운 순으로 정렬됩니다.</div>
                <button className="btn btn--sm btn--primary" style={{marginTop:12}}>위치 허용</button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

window.CourtList = CourtList;
