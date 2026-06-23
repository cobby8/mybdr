/* global React, GAMES, Icon */
/**
 * GamesList — /games (등급 A · M5 · UX 보강)
 *
 * Why: 경기 목록에서 빠른 탐색(정렬·필터 칩)과 카드 정보 밀도(상태 뱃지·진행률)를 높임.
 * Pattern: 기존 kind 탭 + 카드 그리드 보존 위에 UX 레이어(정렬·칩·상태)만 추가.
 *
 * 진입: AppNav [경기] / 홈 바로가기
 * 복귀: AppNav
 * 빈 상태: 결과 0건 → 안내 + 칩 끄기 / 인접 지역 보기 CTA
 */

function GamesList({ setRoute }) {
  const [tab, setTab] = React.useState('all'); // all | pickup | guest | scrimmage
  const [chips, setChips] = React.useState([]); // 다중 선택 빠른 필터
  const [sort, setSort] = React.useState('soon'); // soon | filling | latest
  const [sortOpen, setSortOpen] = React.useState(false);

  const kindLabel = { pickup: '픽업', guest: '게스트', scrimmage: '연습' };
  const kindColor = { pickup: 'var(--cafe-blue)', guest: 'var(--bdr-red)', scrimmage: 'var(--ok)' };

  const sortLabel = { soon: '임박순', filling: '모집임박순', latest: '최신순' };

  const QUICK = [
    { id: 'today',   label: '오늘' },
    { id: 'weekend', label: '이번 주말' },
    { id: 'near',    label: '내 동네' },
    { id: 'filling', label: '모집임박' },
    { id: 'free',    label: '무료' },
  ];

  const isFree = (g) => /무료/.test(g.fee);
  const fillPct = (g) => Math.min(100, Math.round((g.applied / g.spots) * 100));
  const isFull = (g) => g.status === 'full' || g.applied >= g.spots;
  const isWeekend = (g) => /\(토\)|\(일\)/.test(g.date);
  const isFilling = (g) => !isFull(g) && (g.status === 'closing' || fillPct(g) >= 70);
  const dateKey = (g) => {
    const d = (g.date.match(/\d{4}\.\d{2}\.\d{2}/) || ['9999.99.99'])[0].replace(/\./g, '');
    const h = (g.time.match(/(\d{2}):/) || [, '99'])[1];
    return Number(d + h);
  };

  const matchesChip = (g, id) =>
    id === 'today'   ? !!g.today :
    id === 'weekend' ? isWeekend(g) :
    id === 'near'    ? !!g.near :
    id === 'filling' ? isFilling(g) :
    id === 'free'    ? isFree(g) : true;

  let shown = GAMES.filter(g => (tab === 'all' || g.kind === tab) && chips.every(c => matchesChip(g, c)));
  shown = [...shown].sort((a, b) =>
    sort === 'soon'    ? dateKey(a) - dateKey(b) :
    sort === 'filling' ? fillPct(b) - fillPct(a) :
    GAMES.indexOf(b) - GAMES.indexOf(a) // latest = 등록 역순
  );

  const counts = {
    all: GAMES.length,
    pickup: GAMES.filter(g => g.kind === 'pickup').length,
    guest: GAMES.filter(g => g.kind === 'guest').length,
    scrimmage: GAMES.filter(g => g.kind === 'scrimmage').length,
  };

  const toggleChip = (id) => setChips(chips.includes(id) ? chips.filter(c => c !== id) : [...chips, id]);

  // 상태 뱃지 — STATUS_LABEL 색상 토큰 재사용
  const statusBadge = (g) => {
    if (isFull(g)) return g.waitlist >= 0 && g.status === 'full'
      ? { label: g.applied >= g.spots ? '대기 가능' : '마감', cls: 'badge--soft' }
      : { label: '마감', cls: 'badge--ghost' };
    if (isFilling(g)) return { label: '마감임박', cls: 'badge--red' };
    return { label: '모집중', cls: 'badge--ok' };
  };

  return (
    <div className="page">
      <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, gap:16, flexWrap:'wrap'}}>
        <div>
          <div className="eyebrow">경기 · GAMES</div>
          <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>픽업 · 게스트 모집</h1>
          <div style={{fontSize:13, color:'var(--ink-mute)'}}>같이 뛸 사람을 찾는 {GAMES.length}건의 모집이 열려 있습니다</div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {/* 정렬 — 데스크톱 라벨 드롭다운 / 모바일 아이콘+시트 */}
          <div style={{position:'relative'}}>
            <button className="btn btn--sm games-sort-btn" onClick={()=>setSortOpen(o=>!o)} aria-haspopup="listbox" aria-expanded={sortOpen}>
              <span className="games-sort-icon" aria-hidden="true">⇅</span>
              <span className="games-sort-label">정렬 · {sortLabel[sort]}</span>
              <span className="games-sort-caret" aria-hidden="true" style={{transform: sortOpen?'rotate(180deg)':'none', transition:'transform .15s'}}>⌄</span>
            </button>
            {sortOpen && (
              <>
                <div onClick={()=>setSortOpen(false)} style={{position:'fixed', inset:0, zIndex:40}}/>
                <div className="games-sort-menu" role="listbox">
                  <div className="games-sort-sheet-grip" aria-hidden="true"/>
                  <div className="games-sort-sheet-title">정렬 기준</div>
                  {Object.entries(sortLabel).map(([k, l]) => (
                    <button key={k} role="option" aria-selected={sort===k} onClick={()=>{setSort(k); setSortOpen(false);}}
                      className="games-sort-item" data-active={sort===k}>
                      <span>{l}</span>
                      {sort===k && <span style={{color:'var(--accent)', fontWeight:800}}>✓</span>}
                    </button>
                  ))}
                  <div className="games-sort-hint">가까운순은 위치 정보가 있을 때 제공됩니다</div>
                </div>
              </>
            )}
          </div>
          <button className="btn btn--primary"><Icon.plus/> 만들기</button>
        </div>
      </div>

      {/* Kind tabs */}
      <div style={{display:'flex', gap:4, marginBottom:12, borderBottom:'1px solid var(--border)'}}>
        {[['all','전체'],['pickup','픽업'],['guest','게스트'],['scrimmage','연습']].map(([k, l]) => (
          <button key={k} onClick={()=>setTab(k)}
            style={{
              padding:'10px 16px', background:'transparent', border:0, cursor:'pointer',
              borderBottom: tab===k ? '3px solid var(--cafe-blue)' : '3px solid transparent',
              color: tab===k ? 'var(--ink)' : 'var(--ink-mute)',
              fontWeight: tab===k ? 700 : 500, fontSize:14, marginBottom:-1,
            }}>
            {l} <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', marginLeft:4}}>{counts[k]}</span>
          </button>
        ))}
      </div>

      {/* 빠른 필터 칩 — 가로 스크롤, 다중 선택 */}
      <div className="games-chips" style={{display:'flex', gap:8, marginBottom:18, overflowX:'auto', paddingBottom:2}}>
        {QUICK.map(q => {
          const on = chips.includes(q.id);
          return (
            <button key={q.id} onClick={()=>toggleChip(q.id)} className="games-chip" data-active={on}>
              {q.label}
            </button>
          );
        })}
        {chips.length > 0 && (
          <button onClick={()=>setChips([])} className="games-chip games-chip--clear">초기화 ✕</button>
        )}
      </div>

      {/* Cards or empty */}
      {shown.length === 0 ? (
        <div className="card" style={{padding:'56px 24px', textAlign:'center'}}>
          <div style={{fontSize:34, marginBottom:10}}>🔍</div>
          <div style={{fontWeight:800, fontSize:17, marginBottom:6}}>조건에 맞는 모집이 없어요</div>
          <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:18}}>필터를 줄이거나 인접한 지역을 둘러보세요</div>
          <div style={{display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap'}}>
            <button className="btn btn--primary" onClick={()=>setChips([])}>맞춤필터 끄기</button>
            <button className="btn" onClick={()=>{setChips(chips.filter(c=>c!=='near')); setTab('all');}}>인접 지역 보기</button>
          </div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14}}>
          {shown.map(g => {
            const pct = fillPct(g);
            const sb = statusBadge(g);
            const full = isFull(g);
            const hot = pct >= 80 || g.status === 'closing';
            const waitAvail = g.status === 'full' && g.applied >= g.spots;
            return (
              <div key={g.id} className="card" style={{padding:0, overflow:'hidden', cursor:'pointer', display:'flex', flexDirection:'column'}} onClick={()=>setRoute('gameDetail')}>
                <div style={{height:4, background: kindColor[g.kind]}}/>
                <div style={{padding:'16px 18px 12px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap'}}>
                    <span className="badge" style={{background: kindColor[g.kind], color:'#fff', borderColor: kindColor[g.kind]}}>{kindLabel[g.kind]}</span>
                    <span className={`badge ${sb.cls}`}>{sb.label}</span>
                    <span style={{fontSize:11, fontFamily:'var(--ff-mono)', color:'var(--ink-dim)', marginLeft:'auto', whiteSpace:'nowrap'}}>{g.area}</span>
                  </div>
                  <div style={{fontWeight:700, fontSize:15, lineHeight:1.4, letterSpacing:'-0.005em', marginBottom:10, color:'var(--ink)'}}>
                    {g.title}
                  </div>
                  <div style={{fontSize:13, color:'var(--ink-mute)', display:'grid', gridTemplateColumns:'68px 1fr', rowGap:4, columnGap:8, marginBottom:12}}>
                    <span style={{color:'var(--ink-dim)'}}>장소</span><span>{g.court}</span>
                    <span style={{color:'var(--ink-dim)'}}>일시</span><span>{g.date} · {g.time}</span>
                    <span style={{color:'var(--ink-dim)'}}>레벨</span><span>{g.level}</span>
                    <span style={{color:'var(--ink-dim)'}}>비용</span><span style={{fontWeight: isFree(g) ? 700 : 500, color: isFree(g) ? 'var(--ok)' : 'var(--ink-soft)'}}>{g.fee}</span>
                  </div>
                  <div style={{display:'flex', gap:4, flexWrap:'wrap', marginBottom:10}}>
                    {g.tags.map(t => (
                      <span key={t} style={{fontSize:11, padding:'2px 7px', color:'var(--ink-mute)', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)', whiteSpace:'nowrap'}}>{t}</span>
                    ))}
                  </div>
                </div>
                <div style={{padding:'12px 18px 14px', borderTop:'1px dashed var(--border)', display:'flex', alignItems:'center', gap:10, marginTop:'auto'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4}}>
                      <span style={{color:'var(--ink-dim)'}}>{g.host}</span>
                      <span style={{fontFamily:'var(--ff-mono)', fontWeight:700, color: full ? 'var(--ink-mute)' : hot ? 'var(--accent)' : 'var(--ink-soft)'}}>
                        {full ? (waitAvail ? `마감 · 대기 ${g.waitlist}` : '마감') : `${g.applied}/${g.spots}`}
                      </span>
                    </div>
                    <div style={{height:4, background:'var(--bg-alt)', borderRadius:2, overflow:'hidden'}}>
                      <div style={{width:`${pct}%`, height:'100%', background: full ? 'var(--ink-mute)' : hot ? 'var(--accent)' : kindColor[g.kind]}}/>
                    </div>
                  </div>
                  <button className={`btn btn--sm ${full ? '' : 'btn--primary'}`}>{full ? (waitAvail ? '대기 신청' : '마감') : '신청'}</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .games-chips { -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .games-chip {
          flex: 0 0 auto; padding: 7px 14px; border-radius: var(--radius-chip);
          background: var(--bg-card); border: 1px solid var(--border);
          color: var(--ink-soft); font-size: 13px; font-weight: 600; cursor: pointer;
          white-space: nowrap; transition: all .12s;
        }
        .games-chip:hover { background: var(--bg-alt); color: var(--ink); }
        .games-chip[data-active="true"] {
          background: var(--cafe-blue); border-color: var(--cafe-blue); color: #fff;
        }
        .games-chip--clear { background: transparent; border-color: transparent; color: var(--ink-dim); }
        .games-sort-icon { display: none; }
        .games-sort-menu {
          position: absolute; right: 0; top: calc(100% + 6px); z-index: 50;
          min-width: 200px; background: var(--bg-card); border: 1px solid var(--border);
          border-radius: var(--radius-card); box-shadow: var(--sh-lg); padding: 6px;
        }
        .games-sort-sheet-grip, .games-sort-sheet-title { display: none; }
        .games-sort-item {
          width: 100%; display: flex; align-items: center; justify-content: space-between;
          padding: 10px 12px; background: transparent; border: 0; border-radius: var(--radius-chip);
          color: var(--ink); font-size: 14px; font-weight: 600; cursor: pointer; text-align: left;
        }
        .games-sort-item:hover { background: var(--bg-alt); }
        .games-sort-item[data-active="true"] { color: var(--accent); }
        .games-sort-hint {
          padding: 8px 12px 4px; font-size: 11px; color: var(--ink-dim);
          border-top: 1px solid var(--border); margin-top: 4px;
        }
        @media (max-width: 720px) {
          .games-sort-label, .games-sort-caret { display: none; }
          .games-sort-icon { display: inline; font-size: 16px; }
          .games-sort-btn { padding: 8px 12px; }
          /* 모바일 = 하단 시트 */
          .games-sort-menu {
            position: fixed; left: 0; right: 0; bottom: 0; top: auto;
            min-width: 0; border-radius: var(--radius-card) var(--radius-card) 0 0;
            padding: 8px 12px calc(16px + env(safe-area-inset-bottom));
          }
          .games-sort-sheet-grip {
            display: block; width: 40px; height: 4px; border-radius: 2px;
            background: var(--border); margin: 4px auto 10px;
          }
          .games-sort-sheet-title {
            display: block; font-size: 12px; font-weight: 800; letter-spacing: .08em;
            color: var(--ink-dim); padding: 0 4px 8px;
          }
          .games-sort-item { padding: 14px 12px; }
        }
      `}</style>
    </div>
  );
}

window.GamesList = GamesList;
