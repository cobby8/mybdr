/* global React */
// ============================================================
// BDR v2.29 — Search (NU3 · Phase 9B · 보강 carry · BN3 ★★★)
// 운영: /search?q=... (261 · BDR v2 재구성) — cross-domain 보강.
//
// 검색바(자동완성+최근) + 카테고리 chip(전체/경기/대회/팀/코트/유저/커뮤니티) +
// 카테고리별 결과 섹션(각 5 + "더 보기" → 해당 Phase list) + 빈 상태.
// cross-domain Phase 1~8 (게임/대회/팀/코트/유저/커뮤니티 동일 source).
// ============================================================
function Search() {
  const cats = window.SEARCH_CATS;
  const results = window.SEARCH_RESULTS;
  const [q, setQ] = React.useState('장충');
  const [cat, setCat] = React.useState('all');

  const hasQuery = q.trim().length > 0;
  const visibleCats = cat === 'all' ? cats.filter(c => c.key !== 'all') : cats.filter(c => c.key === cat);
  const anyResults = visibleCats.some(c => (results[c.key] || []).length > 0);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div className="eyebrow" style={{ marginBottom: 6 }}>통합 검색 · SEARCH</div>

        {/* search bar */}
        <div className="nt-searchbar">
          <span className="ico material-symbols-outlined">search</span>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="경기 · 대회 · 팀 · 코트 · 유저 · 커뮤니티 검색" />
          {q && <button className="cv-fav" style={{ width: 30, height: 30, border: 0, background: 'none' }} onClick={() => setQ('')}><span className="ico material-symbols-outlined">close</span></button>}
        </div>

        {/* recent / suggest */}
        <div className="nt-recent">
          <span className="nt-recent__lbl">{hasQuery ? '추천 검색어' : '최근 검색'}</span>
          {(hasQuery ? window.SEARCH_SUGGEST : window.SEARCH_RECENT).map(s => (
            <a key={s} className="nt-recent__chip" href="#" onClick={e => { e.preventDefault(); setQ(s); }}>
              <span className="ico material-symbols-outlined">{hasQuery ? 'trending_up' : 'history'}</span>{s}
            </a>
          ))}
        </div>

        {/* category chips */}
        <div className="nt-chiprow" style={{ position: 'static', borderBottom: '1px solid var(--border)' }}>
          {cats.map(c => (
            <button key={c.key} className={'nt-chip' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
              <span className="ico material-symbols-outlined">{c.ico}</span>{c.label}
            </button>
          ))}
        </div>

        {/* results */}
        <div style={{ marginTop: 18 }}>
          {hasQuery && anyResults ? visibleCats.map(c => {
            const rows = results[c.key] || [];
            if (rows.length === 0) return null;
            return (
              <div key={c.key} className="nt-result-section">
                <div className="nt-result-head">
                  <div className="nt-result-head__l"><span className="ico material-symbols-outlined">{c.ico}</span>{c.label}<span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-dim)', fontWeight: 700 }}>{rows.length}</span></div>
                  <a className="nt-result-head__more" href={c.href}>더 보기<span className="ico material-symbols-outlined">chevron_right</span></a>
                </div>
                {rows.map((r, i) => (
                  <a key={i} className="nt-result-row" href={r.href}>
                    <span className="nt-result-row__ico"><span className="ico material-symbols-outlined">{c.ico}</span></span>
                    <div className="nt-result-row__body">
                      <div className="nt-result-row__t">{r.title}</div>
                      <div className="nt-result-row__m">{r.meta}</div>
                    </div>
                    <span className="nt-result-row__arr ico material-symbols-outlined">chevron_right</span>
                  </a>
                ))}
              </div>
            );
          }) : (
            <div className="nt-empty">
              <span className="ico material-symbols-outlined">search_off</span>
              <div className="nt-empty__t">검색 결과가 없어요</div>
              <div className="nt-empty__d">다른 검색어를 입력하거나 아래 추천 검색어를 시도해 보세요.</div>
              <div className="nt-recent" style={{ justifyContent: 'center' }}>
                {window.SEARCH_SUGGEST.map(s => (
                  <a key={s} className="nt-recent__chip" href="#" onClick={e => { e.preventDefault(); setQ(s); }}>
                    <span className="ico material-symbols-outlined">trending_up</span>{s}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.Search = Search;
