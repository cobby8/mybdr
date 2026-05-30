/* global React */
// ============================================================
// Tournaments.jsx — UA1 (목록 전면교체)
//   진입: setRoute('tournaments')   /tournaments
//   복귀: setRoute('home')
//   에러: setRoute('serverError')
//
// B7 status 뱃지 / B4 정원 progress / B6 종료 우승팀 라인
// AppNav frozen — 03 카피
// 토큰 100% var(--*) / lucide-react 0 / pill 9999px 0
// ============================================================

(function () {
  const { useState, useMemo } = React;

  // status → display
  const STATUS_META = {
    recruit:    { label: '모집 중',   tone: 'accent' },
    preseason:  { label: '예선 진행', tone: 'navy' },
    main:       { label: '본선 진행', tone: 'navy' },
    completed:  { label: '종료',      tone: 'mute' },
  };

  const FILTERS = [
    { key: 'all',       label: '전체' },
    { key: 'recruit',   label: '모집 중' },
    { key: 'inprog',    label: '진행 중' },
    { key: 'completed', label: '종료' },
    { key: 'local',     label: '내 지역' },
  ];

  const SORTS = [
    { key: 'closing',   label: '마감 임박' },
    { key: 'recent',    label: '최신 등록' },
    { key: 'ended',     label: '종료일 가까운 순' },
  ];

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date('2026-04-28T00:00:00'); // mock fixed today
    const d = new Date(dateStr + 'T00:00:00');
    return Math.ceil((d - today) / (1000*60*60*24));
  }

  function dateLine(t) {
    const s = new Date(t.starts_at + 'T00:00:00');
    const e = new Date(t.ends_at + 'T00:00:00');
    const same = t.starts_at === t.ends_at;
    const fmt = (d) => `${d.getMonth()+1}/${d.getDate()}`;
    return same ? `${fmt(s)}` : `${fmt(s)} – ${fmt(e)}`;
  }

  function Poster({ hue, name }) {
    return (
      <div className="tnl-poster"
        style={{
          background: `linear-gradient(155deg, hsl(${hue} 65% 32%) 0%, hsl(${hue} 70% 18%) 100%)`,
        }}>
        <div className="tnl-poster__grid" />
        <div className="tnl-poster__name">{name}</div>
      </div>
    );
  }

  function ProgressBar({ now, max, deadlineDays, completed }) {
    if (completed) {
      return (
        <div className="tnl-cap">
          <div className="tnl-cap__bar" aria-hidden="true">
            <div className="tnl-cap__fill is-done" style={{width:'100%'}} />
          </div>
          <div className="tnl-cap__meta">
            <span className="tnl-cap__count">{now}팀 참가</span>
            <span className="tnl-cap__deadline is-end">대회 종료</span>
          </div>
        </div>
      );
    }
    const pct = Math.min(100, Math.round((now / max) * 100));
    const full = now >= max;
    const urgent = deadlineDays !== null && deadlineDays <= 3;
    return (
      <div className="tnl-cap">
        <div className="tnl-cap__bar" aria-hidden="true">
          <div className={'tnl-cap__fill' + (full ? ' is-full' : '')} style={{width: pct + '%'}} />
        </div>
        <div className="tnl-cap__meta">
          <span className="tnl-cap__count">
            <b>{now}</b>/{max}팀
            {full && <span className="tnl-cap__chip">정원 마감</span>}
          </span>
          {deadlineDays !== null && (
            <span className={'tnl-cap__deadline' + (urgent ? ' is-urgent' : '')}>
              {deadlineDays <= 0 ? '오늘 마감' : `마감 D-${deadlineDays}`}
            </span>
          )}
        </div>
      </div>
    );
  }

  function ChampionLine({ champion, mvp }) {
    return (
      <div className="tnl-champ">
        <span className="tnl-champ__ico">🏆</span>
        <span className="tnl-champ__name"><b>{champion}</b> 우승</span>
        <span className="tnl-champ__sep">·</span>
        <span className="tnl-champ__mvp">MVP {mvp}</span>
      </div>
    );
  }

  function FeeText({ min, max }) {
    if (min === 0 && max === 0) return <span className="tnl-fee is-free">무료</span>;
    if (min === max) return <span className="tnl-fee">{min.toLocaleString()}원</span>;
    return <span className="tnl-fee">{min.toLocaleString()}–{max.toLocaleString()}원</span>;
  }

  function Card({ t }) {
    const meta = STATUS_META[t.status];
    const d = daysUntil(t.apply_deadline);
    const completed = t.status === 'completed';

    return (
      <article className={'tnl-card tnl-card--' + meta.tone} data-status={t.status}>
        <Poster hue={t.poster_hue} name={t.name} />

        <div className="tnl-card__body">
          <header className="tnl-card__head">
            <div className="tnl-card__divs">
              {t.divisions.slice(0, 3).map(d => (
                <span key={d} className="tnl-div">{d}</span>
              ))}
              {t.divisions.length > 3 && <span className="tnl-div tnl-div--more">+{t.divisions.length - 3}</span>}
            </div>
            <span className={'tnl-status tnl-status--' + meta.tone}>
              <span className="tnl-status__dot" />
              {meta.label}
            </span>
          </header>

          <h3 className="tnl-card__name">{t.name}</h3>

          <dl className="tnl-card__meta">
            <div className="tnl-mi">
              <span className="ico material-symbols-outlined">event</span>
              <span>{dateLine(t)}</span>
            </div>
            <div className="tnl-mi">
              <span className="ico material-symbols-outlined">location_on</span>
              <span>{t.venue}</span>
            </div>
          </dl>

          {completed
            ? <ChampionLine champion={t.champion} mvp={t.mvp} />
            : <ProgressBar now={t.teams_now} max={t.teams_max} deadlineDays={d} completed={false} />}
        </div>

        <footer className="tnl-card__foot">
          <div className="tnl-host">
            <span className="tnl-host__av">{t.org.avatar}</span>
            <div className="tnl-host__txt">
              <div className="tnl-host__name">{t.org.name}</div>
              <div className="tnl-host__role">주최</div>
            </div>
          </div>
          <FeeText min={t.fee_min} max={t.fee_max} />
        </footer>
      </article>
    );
  }

  function EmptyState({ onReset }) {
    return (
      <div className="tnl-empty">
        <span className="ico material-symbols-outlined">manage_search</span>
        <div className="tnl-empty__title">조건에 맞는 대회가 없습니다</div>
        <div className="tnl-empty__sub">다른 필터로 검색해보거나, 검색어를 비워보세요.</div>
        <button className="btn btn--accent" onClick={onReset}>필터 초기화</button>
      </div>
    );
  }

  window.Tournaments = function Tournaments({ setRoute }) {
    const [filter, setFilter] = useState('all');
    const [sort, setSort] = useState('closing');
    const [q, setQ] = useState('');

    const filtered = useMemo(() => {
      let list = (window.TN_DATA?.list || []).slice();
      if (filter === 'recruit') list = list.filter(t => t.status === 'recruit');
      else if (filter === 'inprog') list = list.filter(t => t.status === 'preseason' || t.status === 'main');
      else if (filter === 'completed') list = list.filter(t => t.status === 'completed');
      else if (filter === 'local') list = list.filter(t => /강남|서초|용산|마포|동작|광진|성동/.test(t.venue));
      if (q.trim()) list = list.filter(t => (t.name + t.org.name + t.venue).toLowerCase().includes(q.trim().toLowerCase()));
      if (sort === 'closing') list.sort((a,b) => (daysUntil(a.apply_deadline) ?? 9999) - (daysUntil(b.apply_deadline) ?? 9999));
      if (sort === 'recent')  list.sort((a,b) => b.starts_at.localeCompare(a.starts_at));
      if (sort === 'ended')   list.sort((a,b) => a.ends_at.localeCompare(b.ends_at));
      return list;
    }, [filter, sort, q]);

    const counts = useMemo(() => {
      const all = window.TN_DATA?.list || [];
      return {
        all: all.length,
        recruit: all.filter(t => t.status === 'recruit').length,
        inprog: all.filter(t => t.status === 'preseason' || t.status === 'main').length,
        completed: all.filter(t => t.status === 'completed').length,
        local: all.filter(t => /강남|서초|용산|마포|동작|광진|성동/.test(t.venue)).length,
      };
    }, []);

    return (
      <div className="tnl-page">
        <div className="tnl-inner">
          <header className="tnl-hero">
            <window.Eyebrow>TOURNAMENTS · 전국 농구 매칭</window.Eyebrow>
            <h1 className="tnl-hero__title">대회 둘러보기</h1>
            <p className="tnl-hero__sub">
              모집 중인 대회 <b>{counts.recruit}</b>건 · 진행 중 <b>{counts.inprog}</b>건 · 종료 <b>{counts.completed}</b>건.
              우리 동네 대회는 <a className="tnl-link" onClick={() => setFilter('local')}>내 지역</a> 필터로.
            </p>
          </header>

          {/* sticky filter bar */}
          <div className="tnl-filter">
            <div className="tnl-filter__chips" role="tablist">
              {FILTERS.map(f => (
                <button key={f.key}
                  className={'tnl-chip' + (filter === f.key ? ' is-on' : '')}
                  onClick={() => setFilter(f.key)}>
                  {f.label}
                  <span className="tnl-chip__count">{counts[f.key] ?? ''}</span>
                </button>
              ))}
            </div>
            <div className="tnl-filter__right">
              <label className="tnl-search">
                <span className="ico material-symbols-outlined">search</span>
                <input
                  type="search"
                  placeholder="대회명·장소·주최"
                  maxLength={40}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </label>
              <div className="tnl-sort">
                <span className="tnl-sort__lbl">정렬</span>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {filtered.length === 0
            ? <EmptyState onReset={() => { setFilter('all'); setQ(''); }} />
            : <div className="tnl-grid">{filtered.map(t => <Card key={t.id} t={t} />)}</div>}
        </div>
      </div>
    );
  };
})();
