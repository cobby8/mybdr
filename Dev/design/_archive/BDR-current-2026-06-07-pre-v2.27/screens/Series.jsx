/* global React */
// ============================================================
// BDR v2.22 — Series (OU4 · Phase 4B · 신규 · BO2 + BO8)
// 운영 박제 대상: /series (list) + /series/[slug] (detail)
// 진입: AppNav "대회" 탭 / OU2 events tab "시리즈 hub" CTA
// 복귀: 회차 row 클릭 → Phase 1 /tournaments/[id] (BO8 cross-domain) / 시리즈 spotlight 클릭 → 단체 페이지
// 에러: 빈 회차 = "아직 회차가 없습니다"
//
// 신규 박제 (운영 205 line OU4a + 227 line OU4b):
//   PAGE 1 — Series list (/series) — spotlight + grid + about box
//   PAGE 2 — Series detail (/series/[slug]) — hero + editions timeline + sidebar (다음 회차 BO8)
//
// BO2 위계: 홈 → 단체 → 시리즈 → 회차 → 대회 (breadcrumb 일관)
// BO8 cross-domain: 회차 row 클릭 → Phase 1 tournaments/[id]
// A 등급
// ============================================================

// PAGE 1 — Series LIST
window.SeriesList = function SeriesList() {
  const series = window.SERIES_LIST.filter(s => s.is_public);
  const spotlight = series[0];  // BDR 서머 오픈
  const rest = series.slice(1);

  return (
    <div className="ou4-page">
      <div className="ou2-page__crumbs">
        <window.OrgHierarchyCrumbs trail={[
          { label: '홈', icon: 'home' },
          { label: '시리즈', current: true, icon: 'collections_bookmark' },
        ]}/>
      </div>

      <header className="ou1-head">
        <div>
          <div className="eyebrow">시리즈 · SERIES</div>
          <h1 className="ou1-head__title">대회 시리즈 허브</h1>
          <p className="ou1-head__sub">
            정기적으로 열리는 모든 시리즈와 그 회차의 계보 — <b style={{color:'var(--ink)', fontFamily:'var(--ff-display)'}}>{series.length}</b>개
          </p>
        </div>
        <a className="ou1-head__cta btn--navy" href="oo3-series-admin.html" style={{background:'var(--cafe-blue)', borderColor:'var(--cafe-blue-deep)'}}>
          <span className="ico material-symbols-outlined">add</span>
          시리즈 만들기
        </a>
      </header>

      {/* Spotlight */}
      <a className="ou4-spotlight">
        <div className="ou4-spotlight__main" style={{background: 'linear-gradient(135deg, ' + spotlight.color + ' 0%, ' + spotlight.color + ' 50%, #0B0D10 100%)'}}>
          <div className="ou4-spotlight__eyebrow">SPOTLIGHT · {spotlight.tournaments_count}TH EDITION</div>
          <h2 className="ou4-spotlight__title">{spotlight.name}</h2>
          <p className="ou4-spotlight__desc">{spotlight.description}</p>
        </div>
        <div className="ou4-spotlight__side">
          <div>
            <div className="ou4-spotlight__sidehead">누적 회차</div>
            <div className="ou4-spotlight__big">{spotlight.tournaments_count}회</div>
            <div className="ou4-spotlight__msg">
              시리즈 페이지에서 회차별 우승팀과 MVP 기록을 확인할 수 있습니다.
            </div>
          </div>
          <a className="ou4-spotlight__cta">
            회차 보기
            <span className="ico material-symbols-outlined">arrow_forward</span>
          </a>
        </div>
      </a>

      {/* Grid */}
      <div className="ou4-grid">
        {rest.map(s => (
          <window.SeriesCard key={s.id} series={s}/>
        ))}
      </div>

      {/* About */}
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
          <div style={{fontWeight:800, marginBottom:4, color:'var(--cafe-blue-deep)'}}>시리즈란?</div>
          <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.65}}>
            같은 주최자가 정기적으로 여는 대회들의 묶음입니다. 시리즈 페이지에는{' '}
            <b style={{color:'var(--ink)'}}>전 회차 우승팀 · MVP · 대진 결과</b>가 누적되며,
            내 팀이 출전한 시리즈 이력이 프로필에 기록됩니다.
            위계: <b style={{fontFamily:'var(--ff-mono)', color:'var(--ink)'}}>단체 → 시리즈 → 회차 → 대회</b>.
          </div>
        </div>
      </div>
    </div>
  );
};

// PAGE 2 — Series DETAIL (`/series/[slug]`)
window.SeriesDetail = function SeriesDetail() {
  const s = window.SERIES_LIST[0];  // BDR 서머 오픈
  const org = window.ORG_LIST.find(o => o.id === s.org_id);

  // Editions = real Phase 1 TN_DATA + s.champions를 매핑
  const editions = [
    { id: 'ed-4', edition: 4, name: s.name + ' #4', date: '2026-06-15', city: '서울', venue: '장충체육관', status: 'recruit',   teams: 18, max: 32 },
    { id: 'ed-3', edition: 3, name: s.name + ' #3', date: '2025-06-20', city: '서울', venue: '장충체육관', status: 'completed', teams: 32, max: 32, champion: '강남BC', mvp: '김지훈' },
    { id: 'ed-2', edition: 2, name: s.name + ' #2', date: '2024-07-15', city: '서울', venue: '잠실학생체육관', status: 'completed', teams: 28, max: 32, champion: '서초파이브', mvp: '이태우' },
    { id: 'ed-1', edition: 1, name: s.name + ' #1', date: '2023-06-25', city: '서울', venue: '장충체육관', status: 'completed', teams: 24, max: 32, champion: 'rdm 농구단', mvp: '박수빈' },
  ];

  const latestActive = editions.find(e => e.status === 'recruit' || e.status === 'ongoing');

  return (
    <div className="ou4-page">
      <div className="ou2-page__crumbs">
        <window.OrgHierarchyCrumbs trail={[
          { label: '홈', icon: 'home' },
          { label: org.name, icon: 'apartment' },
          { label: '시리즈', icon: 'collections_bookmark' },
          { label: s.name, current: true },
        ]}/>
      </div>

      {/* Hero */}
      <div className="ou4-series-hero" style={{background: 'linear-gradient(135deg, ' + s.color + ' 0%, ' + s.color + ' 50%, #0B0D10 100%)'}}>
        <div className="ou4-series-hero__eyebrow">
          SERIES · {org.name.toUpperCase()}
        </div>
        <h1 className="ou4-series-hero__title">{s.name}</h1>
        <p className="ou4-series-hero__desc">{s.description}</p>
        <div className="ou4-series-hero__meta">
          <span><b>{s.tournaments_count}</b>회 진행</span>
          <span style={{opacity:0.5}}>·</span>
          <span>5v5 토너먼트</span>
          <span style={{opacity:0.5}}>·</span>
          <span>설립 {s.founded_year}</span>
          <span style={{opacity:0.5}}>·</span>
          <span>누적 <b>{s.teams_total}</b>팀</span>
        </div>
      </div>

      <div className="ou2-grid">
        {/* Main: editions timeline */}
        <div className="ou2-main">
          <div className="ou2-card">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">timeline</span>
              회차 (Editions) — BO2 위계
              <span style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-mute)'}}>최신순</span>
            </h2>
            <div style={{marginBottom:10, fontSize:12.5, color:'var(--ink-mute)', display:'flex', gap:6, alignItems:'center'}}>
              <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:14, color:'var(--accent)'}}>account_tree</span>
              회차 클릭 → <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)', letterSpacing:'0.02em'}}>/tournaments/[id]</b> (BO8 cross-domain — Phase 1 대회)
            </div>
            <div className="ou4-editions">
              {editions.map(e => (
                <a key={e.id} className="ou4-edition-row" href="ua2-tournament-detail.html">
                  <div className={'ou4-edition-row__num' + (e.status === 'recruit' || e.status === 'ongoing' ? ' ou4-edition-row__num--cur' : '')}>
                    <b>{e.edition}</b>
                    <small>회</small>
                  </div>
                  <div className="ou4-edition-row__body">
                    <div className="ou4-edition-row__name">
                      {e.name}
                      {' '}
                      <span className={'ou2-edition__status ou2-edition__status--' + e.status} style={{marginLeft:4}}>
                        {{ recruit:'모집중', ongoing:'진행중', completed:'종료' }[e.status]}
                      </span>
                    </div>
                    <div className="ou4-edition-row__meta">
                      <span>{e.date}</span>
                      <span>{e.city} {e.venue}</span>
                      <span>{e.teams}/{e.max}팀</span>
                      {e.champion && <span>🏆 {e.champion}</span>}
                      {e.mvp && <span>MVP {e.mvp}</span>}
                    </div>
                  </div>
                  <div className="ou4-edition-row__cta">
                    대회 상세 →
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* About */}
          <div className="ou2-card">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">info</span>
              시리즈 소개
            </h2>
            <div className="ou2-info-row">
              <span className="ou2-info-row__l">주최 단체</span>
              <span className="ou2-info-row__v">
                <a href="ou2-organization-detail.html" style={{color:'var(--cafe-blue-deep)', textDecoration:'underline'}}>{org.name}</a>
              </span>
            </div>
            <div className="ou2-info-row">
              <span className="ou2-info-row__l">설립</span>
              <span className="ou2-info-row__v">{s.founded_year}</span>
            </div>
            <div className="ou2-info-row">
              <span className="ou2-info-row__l">소개</span>
              <span className="ou2-info-row__v">{s.description}</span>
            </div>
            <div className="ou2-info-row">
              <span className="ou2-info-row__l">누적 통계</span>
              <span className="ou2-info-row__v">{s.tournaments_count}회 진행 · 누적 {s.teams_total}팀</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="ou2-side">
          {/* 다음 회차 (BO8) */}
          {latestActive && (
            <div className="ou2-card ou2-next-edition">
              <h2 className="ou2-card__h">
                <span className="ico material-symbols-outlined">event</span>
                다음 회차
              </h2>
              <div className="ou2-next-edition__date">{latestActive.date} · {latestActive.venue}</div>
              <div className="ou2-next-edition__name">{latestActive.name}</div>
              <a className="ou2-next-edition__cta" href="ua3-tournament-enroll.html">
                참가 신청
              </a>
            </div>
          )}

          {/* 알림 받기 (운영 답습 — disabled UI) */}
          <div className="ou2-card">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">notifications_active</span>
              알림 받기
            </h2>
            <div style={{fontSize:12.5, color:'var(--ink-mute)', marginBottom:10, lineHeight:1.6}}>
              새 회차가 열리면 알려드릴게요.
            </div>
            <button className="btn" style={{width:'100%', justifyContent:'center', opacity:0.6, cursor:'not-allowed'}} disabled title="시리즈 팔로우 기능은 추후 제공 예정입니다">
              ★ 시리즈 팔로우 <span style={{fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--ink-dim)', marginLeft:4}}>SOON</span>
            </button>
          </div>

          {/* 우승 이력 */}
          <div className="ou2-card">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">military_tech</span>
              명예의 전당
            </h2>
            {s.champions.map(c => (
              <div key={c.edition} style={{display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px dashed var(--border)'}}>
                <div style={{width:36, height:36, background:'linear-gradient(135deg, #F4C76C, #B47A11)', color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-sm)', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14, flexShrink:0}}>
                  {c.edition}회
                </div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:12.5}}>🏆 {c.team}</div>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-mute)', fontWeight:700}}>{c.year} · MVP {c.mvp}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
