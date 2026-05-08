/* global React, GAMES, Icon */

function GamesList({ setRoute }) {
  const [tab, setTab] = React.useState('all'); // all | pickup | guest | scrimmage
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState([]);
  const kindLabel = { pickup: '픽업', guest: '게스트', scrimmage: '연습경기' };
  const kindColor = { pickup: 'var(--cafe-blue)', guest: 'var(--bdr-red)', scrimmage: 'var(--ok)' };

  const shown = GAMES.filter(g => tab === 'all' ? true : g.kind === tab);
  const counts = {
    all: GAMES.length,
    pickup: GAMES.filter(g => g.kind === 'pickup').length,
    guest: GAMES.filter(g => g.kind === 'guest').length,
    scrimmage: GAMES.filter(g => g.kind === 'scrimmage').length,
  };

  const TABS = [['all','전체'],['pickup','픽업'],['guest','게스트 모집'],['scrimmage','연습경기']];
  const FILTER_CHIPS = ['오늘','이번주','주말','서울','경기','무료','초보환영'];

  function toggleFilter(s) {
    setActiveFilters(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  return (
    <div className="page games-page">
      {/* Header — title row + compact "만들기" on the right (mobile + PC same) */}
      <div className="games-header">
        <div className="games-header__title">
          <div className="eyebrow">경기 · GAMES</div>
          <h1 className="games-header__h1">픽업 · 게스트 모집</h1>
          <div className="games-header__sub">같이 뛸 사람을 찾는 {GAMES.length}건의 모집이 열려 있습니다</div>
        </div>
        <button className="btn btn--primary games-create-btn">
          <Icon.plus/> <span>만들기</span>
        </button>
      </div>

      {/* Toolbar — segmented tabs + filter icon (no horizontal scroll) */}
      <div className="games-toolbar">
        <div className="games-segmented" role="tablist">
          {TABS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab===k}
              onClick={()=>setTab(k)}
              className={`games-segmented__btn ${tab===k ? 'is-active' : ''}`}>
              <span className="games-segmented__label">{l}</span>
              <span className="games-segmented__count">{counts[k]}</span>
            </button>
          ))}
        </div>
        <button
          className={`games-filter-btn ${filterOpen ? 'is-open' : ''} ${activeFilters.length ? 'has-active' : ''}`}
          onClick={()=>setFilterOpen(o=>!o)}
          aria-label="필터" title="필터">
          <Icon.filter/>
          {activeFilters.length > 0 && <span className="games-filter-btn__dot">{activeFilters.length}</span>}
        </button>
      </div>

      {/* Filter chips — collapsible */}
      {filterOpen && (
        <div className="games-filter-chips">
          {FILTER_CHIPS.map(s => {
            const on = activeFilters.includes(s);
            return (
              <button key={s}
                className={`btn btn--sm ${on ? 'btn--primary' : ''}`}
                onClick={()=>toggleFilter(s)}>
                {s}
              </button>
            );
          })}
          {activeFilters.length > 0 && (
            <button className="btn btn--sm games-filter-clear" onClick={()=>setActiveFilters([])}>전체 해제</button>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="games-grid">
        {shown.map(g => {
          const pct = (g.applied / g.spots) * 100;
          const isClosing = g.status === 'closing';
          return (
            <div key={g.id} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column'}} onClick={()=>setRoute('gameDetail')}>
              <div style={{height:4, background: kindColor[g.kind]}}/>
              <div style={{padding:'16px 18px 12px'}}>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap'}}>
                  <span className="badge" style={{background: kindColor[g.kind], color:'#fff', borderColor: kindColor[g.kind]}}>{kindLabel[g.kind]}</span>
                  {isClosing && <span className="badge badge--red">마감임박</span>}
                  <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', marginLeft:'auto'}}>{g.area}</span>
                </div>
                <div style={{fontWeight:700, fontSize:15, lineHeight:1.4, letterSpacing:'-0.005em', marginBottom:10, color:'var(--ink)'}}>
                  {g.title}
                </div>
                <div style={{fontSize:13, color:'var(--ink-mute)', display:'grid', gridTemplateColumns:'68px 1fr', rowGap:4, columnGap:8, marginBottom:12}}>
                  <span style={{color:'var(--ink-dim)'}}>장소</span><span>{g.court}</span>
                  <span style={{color:'var(--ink-dim)'}}>일시</span><span>{g.date} · {g.time}</span>
                  <span style={{color:'var(--ink-dim)'}}>레벨</span><span>{g.level}</span>
                  <span style={{color:'var(--ink-dim)'}}>비용</span><span style={{fontWeight: g.fee === '무료' ? 700 : 500, color: g.fee === '무료' ? 'var(--ok)' : 'var(--ink-soft)'}}>{g.fee}</span>
                </div>
                <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:10}}>
                  {g.tags.map(t => (
                    <span key={t} style={{fontSize:11, padding:'2px 7px', color:'var(--ink-mute)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)'}}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{padding:'12px 18px 14px', borderTop:'1px dashed var(--border)', display:'flex', alignItems:'center', gap:10, marginTop:'auto'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4}}>
                    <span style={{color:'var(--ink-dim)'}}>{g.host}</span>
                    <span style={{fontFamily:'var(--ff-mono)', fontWeight:700, color: isClosing ? 'var(--accent)' : 'var(--ink-soft)'}}>
                      {g.applied}/{g.spots}
                    </span>
                  </div>
                  <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
                    <div style={{width:`${pct}%`, height:'100%', background: isClosing ? 'var(--accent)' : kindColor[g.kind]}}/>
                  </div>
                </div>
                <button className="btn btn--sm btn--primary">신청</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

window.GamesList = GamesList;
