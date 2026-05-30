/* global React */
// ============================================================
// BDR v2.22 — OrganizationsList (OU1 · Phase 4B · 보강 · BO1 + BO2)
// 운영 박제 대상: /organizations
// 진입: AppNav "단체" 탭 / Home Hero 카로셀
// 복귀: 카드 클릭 → /organizations/[slug] (OU2)
// 에러: 빈 상태 = "공개된 단체가 없습니다"
//
// 보강 (운영 92 line 위 — BO1 신청 CTA / 필터·추천 / OrgsListV2 → 시안 단순화):
//   - 추천 row (지역 일치 + 활성 단체)
//   - 전체 grid (approved + is_public 만)
//   - 우상단 "단체 등록" CTA → OU3
// A 등급
// ============================================================

function OrganizationsList() {
  const orgs = window.ORG_LIST.filter(o => o.status === 'approved' && o.is_public);
  const [region, setRegion] = React.useState('all');
  const [sort, setSort] = React.useState('series');

  const regions = ['all', ...new Set(orgs.map(o => o.region.split(' ')[0]))];
  let filtered = region === 'all' ? orgs : orgs.filter(o => o.region.startsWith(region));
  filtered = [...filtered].sort((a, b) => {
    if (sort === 'series') return b.series_count - a.series_count;
    if (sort === 'tournaments') return b.tournaments_count - a.tournaments_count;
    if (sort === 'newest') return b.founded_year - a.founded_year;
    return 0;
  });

  // 추천 = 시리즈 3+ & 서울 (예시 — 운영은 사용자 활동 지역 기준)
  const recommended = orgs.filter(o => o.series_count >= 3 && o.region.startsWith('서울')).slice(0, 3);

  return (
    <div className="ou1-page">
      <header className="ou1-head">
        <div>
          <div className="eyebrow">단체 · ORGANIZATIONS</div>
          <h1 className="ou1-head__title">리그 · 협회 · 동호회</h1>
          <p className="ou1-head__sub">
            여러 팀을 아우르는 <b style={{color:'var(--ink)', fontFamily:'var(--ff-display)'}}>{orgs.length}</b>개의 농구 단체. 단체 페이지에서 소속 시리즈와 누적 우승팀을 확인할 수 있습니다.
          </p>
        </div>
        <a className="ou1-head__cta" href="ou3-organization-apply.html">
          <span className="ico material-symbols-outlined">add</span>
          단체 등록
        </a>
      </header>

      {/* Filter */}
      <div className="ou1-filter">
        <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase'}}>지역</span>
        <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
          {regions.map(r => (
            <button key={r}
              className={'tu1-filter__chip' + (region === r ? ' is-on' : '')}
              onClick={()=>setRegion(r)}>
              {r === 'all' ? '전체' : r}
            </button>
          ))}
        </div>
        <span className="tu1-filter__sep"/>
        <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase'}}>정렬</span>
        <div style={{display:'flex', gap:4}}>
          {[
            { v:'series', l:'시리즈 많은 순' },
            { v:'tournaments', l:'대회 많은 순' },
            { v:'newest', l:'신규' },
          ].map(s => (
            <button key={s.v}
              className={'tu1-filter__chip' + (sort === s.v ? ' is-on' : '')}
              onClick={()=>setSort(s.v)}>
              {s.l}
            </button>
          ))}
        </div>
        <div style={{flex:1}}/>
        <div className="tu1-filter__search" style={{minWidth:200}}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="단체명 / 지역"/>
        </div>
      </div>

      {/* 추천 row (지역 일치) */}
      {recommended.length > 0 && (
        <section className="ou1-reco-section">
          <div className="ou1-reco-section__head">
            <h2 className="ou1-reco-section__h">내 지역 단체</h2>
            <span className="ou1-reco-section__hint">서울 · 활동 중 시리즈 3+</span>
            <span className="tu1-section-h__hint" style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-dim)'}}>{recommended.length} / {orgs.length}</span>
          </div>
          <div className="ou1-recos">
            {recommended.map(o => (
              <window.OrgCard key={o.id} org={o} variant="compact"/>
            ))}
          </div>
        </section>
      )}

      {/* 전체 grid */}
      <section>
        <div className="ou1-reco-section__head">
          <h2 className="ou1-reco-section__h">전체 단체</h2>
          <span className="ou1-reco-section__hint">{filtered.length}개</span>
        </div>
        <div className="ou1-grid">
          {filtered.map(o => (
            <window.OrgCard key={o.id} org={o} variant="list"/>
          ))}
        </div>
      </section>

      {/* About box */}
      <div style={{
        marginTop: 24,
        padding: '18px 22px',
        background: 'var(--cafe-blue-soft)',
        border: '1px solid var(--cafe-blue-hair)',
        borderLeft: '3px solid var(--cafe-blue)',
        borderRadius: 'var(--r-md)',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:24, color:'var(--cafe-blue-deep)', flexShrink:0}}>lightbulb</span>
        <div>
          <div style={{fontWeight:800, marginBottom:4, color:'var(--cafe-blue-deep)'}}>단체란?</div>
          <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.6}}>
            여러 팀을 아우르는 <b>리그 / 협회 / 동호회 연합</b>입니다. 단체는 <b>시리즈</b>를 만들고 시리즈마다 <b>회차(대회)</b>가 누적됩니다.
            본인이 단체를 운영하고 싶다면 <b>"단체 등록"</b> 으로 신청 후 사이트 운영자 승인을 받으세요 (1-2일 소요).
          </div>
        </div>
      </div>
    </div>
  );
}

window.OrganizationsList = OrganizationsList;
