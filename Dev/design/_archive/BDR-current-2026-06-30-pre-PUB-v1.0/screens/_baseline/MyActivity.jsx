/* global React */
// ============================================================
// MyActivity.jsx — UC1 (마이페이지 통합 — "내 대회" 섹션 신설)
//   진입: setRoute('myActivity')   /profile/activity
//   복귀: setRoute('myPage')
//
//   B1 갭의 진입 보강 — MyRegistrationStatus 컴포넌트를 마이페이지 list 에 재사용.
//   더보기 메뉴 신규 추가 ❌ — 마이페이지 안 카드로만 진입 (룰 §2 통과).
// ============================================================

(function () {
  const { useState, useMemo } = React;

  const SECTIONS = [
    { key: 'tournaments', label: '내 대회',     ico: 'emoji_events' },
    { key: 'games',       label: '내 신청 경기', ico: 'sports_basketball' },
    { key: 'teams',       label: '내 팀',       ico: 'groups' },
    { key: 'saved',       label: '저장한 항목', ico: 'bookmark' },
  ];

  const STATUS_FILTERS = [
    { key: 'all',         label: '전체' },
    { key: 'pending',     label: '승인 대기' },
    { key: 'approved',    label: '결제 대기' },
    { key: 'in_progress', label: '진행 중' },
    { key: 'completed',   label: '종료' },
    { key: 'rejected',    label: '거절' },
  ];

  // status sort order — pending 상단, rejected 하단 (UC1 룰)
  const STATUS_ORDER = {
    pending: 0,
    approved: 1,
    in_progress: 2,
    paid: 2,
    completed: 3,
    waitlist: 3,
    rejected: 4,
  };

  function Sidebar({ active, onChange }) {
    return (
      <aside className="ma-side">
        <div className="ma-side__profile">
          <div className="ma-side__av">RDM</div>
          <div className="ma-side__info">
            <div className="ma-side__name">rdm_captain</div>
            <div className="ma-side__handle">@rdm_captain</div>
          </div>
        </div>
        <nav className="ma-side__nav">
          <a className="ma-side__link" data-active={active === '__home' ? 'true' : 'false'}>
            <span className="ico material-symbols-outlined">person</span>
            <span>프로필</span>
          </a>
          <div className="ma-side__group">활동</div>
          {SECTIONS.map(s => (
            <a key={s.key} className="ma-side__link"
               data-active={active === s.key ? 'true' : 'false'}
               onClick={() => onChange(s.key)}>
              <span className="ico material-symbols-outlined">{s.ico}</span>
              <span>{s.label}</span>
            </a>
          ))}
          <div className="ma-side__group">설정</div>
          <a className="ma-side__link">
            <span className="ico material-symbols-outlined">notifications</span>
            <span>알림 설정</span>
          </a>
          <a className="ma-side__link">
            <span className="ico material-symbols-outlined">manage_accounts</span>
            <span>계정 설정</span>
          </a>
        </nav>
      </aside>
    );
  }

  function StatCard({ count, sub, accent }) {
    return (
      <div className={'ma-stat' + (accent ? ' ma-stat--accent' : '')}>
        <span className="ma-stat__count">{count}</span>
        <span className="ma-stat__sub">{sub}</span>
      </div>
    );
  }

  function EmptyState() {
    return (
      <div className="ma-empty">
        <span className="ico material-symbols-outlined">emoji_events</span>
        <div className="ma-empty__title">아직 신청한 대회가 없습니다</div>
        <div className="ma-empty__sub">모집 중인 대회를 둘러보세요. 우리 동네 대회도 있습니다.</div>
        <button className="btn btn--accent btn--touch">대회 둘러보기 →</button>
      </div>
    );
  }

  function TournamentsSection() {
    const [filter, setFilter] = useState('all');

    const all = window.MY_TOURNAMENTS || [];
    const counts = useMemo(() => ({
      all: all.length,
      pending: all.filter(r => r.status === 'pending').length,
      approved: all.filter(r => r.status === 'approved').length,
      in_progress: all.filter(r => r.status === 'in_progress').length,
      completed: all.filter(r => r.status === 'completed').length,
      rejected: all.filter(r => r.status === 'rejected').length,
    }), [all]);

    const filtered = useMemo(() => {
      const list = filter === 'all' ? all.slice() : all.filter(r => r.status === filter);
      list.sort((a, b) => {
        const oa = STATUS_ORDER[a.status] ?? 9;
        const ob = STATUS_ORDER[b.status] ?? 9;
        if (oa !== ob) return oa - ob;
        return b.submitted_at.localeCompare(a.submitted_at);
      });
      return list;
    }, [filter, all]);

    return (
      <div className="ma-tn">
        <header className="ma-tn__head">
          <window.Eyebrow>MY TOURNAMENTS · 내 대회</window.Eyebrow>
          <h1 className="ma-tn__title">신청한 대회</h1>
          <p className="ma-tn__sub">
            내 대회 <b>{counts.all}</b>건 · 진행 중 <b>{counts.in_progress}</b>건
            {counts.pending > 0 && <> · 승인 대기 <b className="ma-tn__accent">{counts.pending}</b>건</>}
            {counts.approved > 0 && <> · 결제 대기 <b className="ma-tn__accent">{counts.approved}</b>건</>}
          </p>
        </header>

        {/* Stats strip */}
        <div className="ma-stats">
          <StatCard count={counts.pending} sub="승인 대기" accent={counts.pending > 0} />
          <StatCard count={counts.approved} sub="결제 대기" accent={counts.approved > 0} />
          <StatCard count={counts.in_progress} sub="진행 중" />
          <StatCard count={counts.completed} sub="종료" />
        </div>

        {/* Filter chips */}
        <div className="ma-filter">
          {STATUS_FILTERS.map(f => (
            <button key={f.key}
              className={'ma-filter__chip' + (filter === f.key ? ' is-on' : '')}
              onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="ma-filter__count">{counts[f.key] ?? 0}</span>
            </button>
          ))}
        </div>

        {filtered.length === 0
          ? <EmptyState />
          : <ul className="ma-list">
              {filtered.map(reg => (
                <li key={reg.id}>
                  <window.MyRegistrationStatus reg={reg} variant="compact" />
                </li>
              ))}
            </ul>}
      </div>
    );
  }

  function OtherSection({ label, ico }) {
    return (
      <div className="ma-other">
        <window.Eyebrow>{label.toUpperCase()}</window.Eyebrow>
        <h1 className="ma-tn__title">{label}</h1>
        <div className="ma-other__placeholder">
          <span className="ico material-symbols-outlined">{ico}</span>
          <div>
            <div className="ma-other__title">이 영역은 본 의뢰 범위 외</div>
            <div className="ma-other__sub">
              UC1 시안은 "내 대회" 섹션 신설만 해당. 다른 섹션 (내 신청 경기 / 내 팀 / 저장한 항목) 은
              기존 마이페이지 hub 골격을 보존합니다. (Phase 13 박제)
            </div>
          </div>
        </div>
      </div>
    );
  }

  window.MyActivity = function MyActivity({ setRoute, defaultSection = 'tournaments' }) {
    const [section, setSection] = useState(defaultSection);
    return (
      <div className="ma-page">
        <div className="ma-page__inner">
          <window.Crumbs trail={['홈', '마이페이지', '내 활동']} />

          <div className="ma-shell">
            <Sidebar active={section} onChange={setSection} />
            <main className="ma-main">
              {section === 'tournaments' && <TournamentsSection />}
              {section === 'games'       && <OtherSection label="내 신청 경기" ico="sports_basketball" />}
              {section === 'teams'       && <OtherSection label="내 팀" ico="groups" />}
              {section === 'saved'       && <OtherSection label="저장한 항목" ico="bookmark" />}
            </main>
          </div>
        </div>
      </div>
    );
  };
})();
