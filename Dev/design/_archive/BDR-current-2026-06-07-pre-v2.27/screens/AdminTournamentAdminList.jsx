/* global React */
// ============================================================
// AdminTournamentAdminList.jsx — A1 (Phase 1A 진입점 통합)
//   /tournament-admin/tournaments
//
// 진입: 어드민 sidebar "대회 목록"
// 복귀: AdminTournamentSetupHub (대회 카드 클릭)
// 에러: 권한 없음 = redirect to /admin / list empty = empty state
//
// S1 사각지대 해소: 단일 hero CTA → 4 옵션 인라인 panel.
//   1. Quick (1분, 추천)   /wizard
//   2. Legacy (5분 / 단계별) /wizard?legacy=1
//   3. Prospectus (3분 / PDF) /wizard/prospectus
//   4. 협회 (super_admin 전용) /wizard/association
// ============================================================

(function () {

  // mock — 본인이 운영하는 대회 목록
  const TN_LIST = [
    { id: 'tn-2026-summer-4', name: 'BDR 서머 오픈 #4', series: 'BDR 서머 오픈 시리즈', edition: 4,
      status: 'live', apply: ['05-01', '05-25'], main: ['06-15', '06-22'],
      teams_now: 38, teams_max: 44, divisions: 4, published: true },
    { id: 'tn-2026-challenge-8', name: 'BDR 챌린지 #8', series: 'BDR 챌린지 시리즈', edition: 8,
      status: 'live', apply: ['04-10', '05-10'], main: ['06-22', '06-29'],
      teams_now: 24, teams_max: 32, divisions: 3, published: true },
    { id: 'tn-2026-rookie-4', name: '루키 컵 #4', series: '루키 컵 시리즈', edition: 4,
      status: 'apply', apply: ['06-01', '06-30'], main: ['07-10', '07-12'],
      teams_now: 12, teams_max: 16, divisions: 2, published: true },
    { id: 'tn-2026-winter-3', name: '윈터 인비테이셔널 #3', series: '윈터 인비테이셔널', edition: 3,
      status: 'apply', apply: ['11-01', '12-10'], main: ['12-20', '12-22'],
      teams_now: 6, teams_max: 16, divisions: 2, published: false },
    { id: 'tn-2026-q3-open', name: 'Q3 오픈 (제목 미정)', series: null, edition: null,
      status: 'draft', apply: null, main: null,
      teams_now: 0, teams_max: 32, divisions: 0, published: false },
    { id: 'tn-2026-rookie-3', name: '루키 컵 #3', series: '루키 컵 시리즈', edition: 3,
      status: 'done', apply: ['03-01', '04-10'], main: ['04-22', '04-24'],
      teams_now: 16, teams_max: 16, divisions: 2, published: true },
    { id: 'tn-2026-spring-2', name: '스프링 오픈 #2', series: '스프링 오픈', edition: 2,
      status: 'done', apply: ['02-01', '03-15'], main: ['03-30', '04-01'],
      teams_now: 32, teams_max: 32, divisions: 4, published: true },
  ];

  const STATUS_LABEL = { draft: '작성중', apply: '신청중', live: '진행중', done: '완료', archived: '보관' };
  const TABS = [
    { k: 'all',   label: '전체' },
    { k: 'draft', label: '작성중' },
    { k: 'apply', label: '신청중' },
    { k: 'live',  label: '진행중' },
    { k: 'done',  label: '완료' },
    { k: 'archived', label: '보관' },
  ];

  const ENTRY_OPTIONS = [
    {
      key: 'quick',
      name: 'Quick · 빠르게 시작',
      icon: 'flash_on',
      time: '1분',
      case: '이전 대회 비슷하게',
      sub: '이름·시작일만 입력. 셋업은 hub 에서 차근차근.',
      rec: true,
    },
    {
      key: 'legacy',
      name: '단계별 설정',
      icon: 'list_alt',
      time: '5분',
      case: '처음부터 꼼꼼히',
      sub: '3-step 마법사 — 대회정보 / 참가설정 / 확인.',
      rec: false,
    },
    {
      key: 'prospectus',
      name: 'PDF 요강',
      icon: 'description',
      time: '3분',
      case: '협회 요강 PDF 가 있을 때',
      sub: 'PDF 업로드 → AI 가 종별·신청정책 자동 추출.',
      rec: false,
    },
    {
      key: 'association',
      name: '협회 대회',
      icon: 'workspace_premium',
      time: '7분',
      case: '협회 박제 + 종별 위임',
      sub: '협회 단체 박제 + 시리즈 + 권한 위임 4-step.',
      rec: false,
      admin: true,
    },
  ];

  function StatusPill({ s }) {
    return <span className={'aen-pill aen-pill--' + s}>{STATUS_LABEL[s] || s}</span>;
  }

  window.AdminTournamentAdminList = function AdminTournamentAdminList({ isSuperAdmin = true }) {
    const [tab, setTab] = React.useState('all');
    const [panelOpen, setPanelOpen] = React.useState(false);
    const [q, setQ] = React.useState('');

    const filtered = React.useMemo(() => {
      let rows = TN_LIST.slice();
      if (tab !== 'all') rows = rows.filter(r => r.status === tab);
      if (q) rows = rows.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || (r.series || '').toLowerCase().includes(q.toLowerCase()));
      return rows;
    }, [tab, q]);

    const counts = React.useMemo(() => {
      const c = { all: TN_LIST.length, draft: 0, apply: 0, live: 0, done: 0, archived: 0 };
      TN_LIST.forEach(r => { if (c[r.status] != null) c[r.status]++; });
      return c;
    }, []);

    return (
      <window.AdminShell active="list" tournamentName="" crumbTrail={['대회 관리', '내 대회 목록']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">A1 · Phase 1A · 진입점 통합</div>
                  <h1 className="admin-page__title">내 대회 목록</h1>
                  <p className="admin-page__sub">내가 운영하는 모든 대회를 상태별로 관리합니다.</p>
                </div>
              </div>
            </header>

            {/* Hero CTA — 단일 진입점 */}
            <div className="aen-hero">
              <div>
                <div className="aen-hero__eyebrow">대회 만들기 · 4 가지 방법</div>
                <div className="aen-hero__title">새 대회를 어떻게 만들까요?</div>
                <p className="aen-hero__sub">
                  이전 대회 빠르게 복제 · 처음부터 꼼꼼히 · PDF 요강에서 자동 · 협회 박제.
                </p>
              </div>
              <button className="aen-hero__cta" onClick={() => setPanelOpen(v => !v)}>
                <span className="ico material-symbols-outlined">add_circle</span>
                새 대회 만들기
                <span className="ico material-symbols-outlined">{panelOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
            </div>

            {/* 4 옵션 panel (펼침) */}
            {panelOpen && (
              <div className="aen-panel">
                <div className="aen-panel__head">
                  <h3 className="aen-panel__title">생성 방식 선택</h3>
                  <button className="aen-panel__close" onClick={() => setPanelOpen(false)}>
                    <span className="ico material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="aen-grid">
                  {ENTRY_OPTIONS.map(o => {
                    if (o.admin && !isSuperAdmin) return null;
                    const cls = 'aen-opt'
                      + (o.rec ? ' aen-opt--rec' : '')
                      + (o.admin ? ' aen-opt--admin' : '');
                    return (
                      <button key={o.key} className={cls}>
                        {o.rec && <span className="aen-opt__rec-chip">추천</span>}
                        <div className="aen-opt__head">
                          <span className="aen-opt__icon ico material-symbols-outlined">{o.icon}</span>
                          <h4 className="aen-opt__name">{o.name}</h4>
                        </div>
                        <p className="aen-opt__sub">{o.sub}</p>
                        <div className="aen-opt__meta">
                          <span className="aen-opt__time">
                            <span className="ico material-symbols-outlined">schedule</span>
                            예상 {o.time}
                          </span>
                          <span className="aen-opt__case">{o.case}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 상태 탭 */}
            <div className="aen-tabs" role="tablist">
              {TABS.map(t => (
                <button key={t.k}
                  className={'aen-tabs__tab' + (tab === t.k ? ' is-on' : '')}
                  onClick={() => setTab(t.k)}>
                  {t.label}
                  <span className="aen-tabs__count">{counts[t.k]}</span>
                </button>
              ))}
              <div style={{ flex: 1 }} />
              <div className="atm-toolbar__search" style={{ marginLeft: 'auto' }}>
                <span className="ico material-symbols-outlined">search</span>
                <input
                  placeholder="대회명·시리즈 검색"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  style={{ fontSize: 14 }}
                />
              </div>
            </div>

            {/* 대회 카드 list */}
            <div className="aen-list">
              {filtered.map(r => (
                <div key={r.id} className="aen-row">
                  <div className="aen-row__name">
                    <div className="aen-row__t1">
                      <span className="aen-row__title">{r.name}</span>
                      <span className={'aen-row__pub' + (r.published ? ' is-on' : '')}>
                        {r.published ? '공개' : '비공개'}
                      </span>
                    </div>
                    {r.series
                      ? <div className="aen-row__series">{r.series} · #{r.edition}</div>
                      : <div className="aen-row__series" style={{ fontStyle: 'italic', color: 'var(--ink-dim)' }}>시리즈 미연결</div>
                    }
                  </div>
                  <StatusPill s={r.status} />
                  <div className="aen-row__date">
                    {r.apply ? <>{r.apply[0]} ~ {r.apply[1]}<small>신청</small></> : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </div>
                  <div className="aen-row__date">
                    {r.main ? <>{r.main[0]} ~ {r.main[1]}<small>본선</small></> : <span style={{ color: 'var(--ink-dim)' }}>—</span>}
                  </div>
                  <div>
                    <div className="aen-row__teams">{r.teams_now}<small>/{r.teams_max}</small></div>
                    <div className="aen-row__teams-bar"><i style={{ width: (r.teams_now / r.teams_max * 100) + '%' }} /></div>
                  </div>
                  <span className="aen-row__cta">
                    <span className="ico material-symbols-outlined">chevron_right</span>
                  </span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="adv-empty">
                  <span className="adv-empty__icon ico material-symbols-outlined">inbox</span>
                  <div className="adv-empty__h">조건에 맞는 대회가 없어요</div>
                  <div className="adv-empty__sub">필터를 초기화하거나 검색어를 다시 입력하세요.</div>
                  <button className="btn" onClick={() => { setTab('all'); setQ(''); }}>필터 초기화</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
