/* global React */
// ============================================================
// BDR v2.30 — Reviews (IU4 · Phase 10B · 보강 carry · BI4 ★★)
// 운영: /reviews (127 · v3 박제 — 코트 단일 탭).
//
// 보강: 평점 분포 chart(별 1~5) + 최신 리뷰 list + 필터 chip +
//       Phase 2 BG2 답습(평균 + flag 종류만 / 개별 건수 ❌).
// 데이터: window.REVIEWS (court_reviews · status='published' 최신순).
// ============================================================
function Reviews() {
  const all = window.REVIEWS;
  const flags = window.REVIEW_FLAGS;
  const [filter, setFilter] = React.useState('all');

  // 평균 (소수 1자리)
  const avg = all.reduce((s, r) => s + r.rating, 0) / all.length;
  const total = all.length;

  // 분포 (별 5→1, 0.5 단위는 올림 처리해 정수 칸에 집계)
  const dist = [5, 4, 3, 2, 1].map(star => {
    const n = all.filter(r => Math.round(r.rating) === star).length;
    return { star, n, pct: Math.round((n / total) * 100) };
  });

  const filters = [
    { key: 'all', label: '전체', ico: 'list' },
    { key: 'top', label: '평점 높은순', ico: 'trending_up' },
    { key: 'photo', label: '사진 리뷰', ico: 'photo_camera' },
    { key: 'verified', label: '인증 방문', ico: 'verified' },
  ];

  let rows = [...all];
  if (filter === 'top') rows.sort((a, b) => b.rating - a.rating);
  else if (filter === 'photo') rows = rows.filter(r => r.photos > 0);
  else if (filter === 'verified') rows = rows.filter(r => r.verified);

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        {/* Hero */}
        <header className="info-hero">
          <div className="eyebrow">리뷰 · REVIEWS</div>
          <h1 className="info-hero__title">코트 리뷰</h1>
          <p className="info-hero__lead">
            BDR 멤버들이 직접 뛰어보고 남긴 코트 후기입니다. 인증 방문·사진 리뷰를 한눈에 비교하세요.
          </p>
        </header>

        {/* 요약 — 평균 + 분포 + BG2 flag 종류 */}
        <section className="card rv-summary">
          <div className="rv-summary__score">
            <div className="rv-summary__avg">{avg.toFixed(1)}</div>
            <div className="rv-summary__stars"><window.RatingStars value={avg} size={18} /></div>
            <div className="rv-summary__count">리뷰 {total}건 · 코트 {total}곳</div>
          </div>
          <div className="rv-summary__dist">
            {dist.map(d => (
              <div key={d.star} className="rv-dist__row">
                <span className="rv-dist__lbl">{d.star}<span className="ico material-symbols-outlined">star</span></span>
                <span className="rv-dist__bar"><span className="rv-dist__fill" style={{ width: d.pct + '%' }} /></span>
                <span className="rv-dist__pct">{d.pct}%</span>
              </div>
            ))}
          </div>
          {/* Phase 2 BG2 답습 — 항목 종류만 (개별 건수 ❌) */}
          <div className="rv-flags">
            <span className="rv-flags__lbl">자주 언급</span>
            {flags.map((f, i) => (
              <span key={i} className={'rv-flag rv-flag--' + f.type}>
                <span className="ico material-symbols-outlined">{f.ico}</span>{f.label}
              </span>
            ))}
            <span className="rv-flags__note">
              <span className="ico material-symbols-outlined">info</span>
              항목 종류만 표시 · 개별 건수 비공개
            </span>
          </div>
        </section>

        {/* 필터 chip */}
        <div className="rv-filter">
          {filters.map(f => (
            <button key={f.key} className={'rv-chip' + (filter === f.key ? ' is-on' : '')} onClick={() => setFilter(f.key)}>
              <span className="ico material-symbols-outlined">{f.ico}</span>{f.label}
            </button>
          ))}
        </div>

        {/* 리뷰 카드 list */}
        <div className="rv-list">
          {rows.map(r => (
            <article key={r.id} className="rv-card">
              <div className="rv-card__top">
                <div className="rv-card__court">
                  <span className="rv-card__court-name">
                    {r.target}<span className="ico material-symbols-outlined">north_east</span>
                  </span>
                  <div className="rv-card__court-sub">
                    <span className="ico material-symbols-outlined">location_on</span>{r.targetSub}
                  </div>
                </div>
                <div className="rv-card__rating">
                  <span className="rv-card__rating-num">{r.rating.toFixed(1)}</span>
                  <window.RatingStars value={r.rating} size={13} />
                </div>
              </div>

              {(r.verified || r.photos > 0) && (
                <div className="rv-card__badges">
                  {r.verified && <span className="rv-badge rv-badge--verified"><span className="ico material-symbols-outlined">verified</span>인증 방문</span>}
                  {r.photos > 0 && <span className="rv-badge rv-badge--photo"><span className="ico material-symbols-outlined">photo_camera</span>사진 {r.photos}장</span>}
                </div>
              )}

              <div>
                <div className="rv-card__title">{r.title}</div>
                <p className="rv-card__body" style={{ margin: '6px 0 0' }}>{r.body}</p>
              </div>

              <div className="rv-card__foot">
                <div className="rv-card__author">
                  <span className="rv-card__avatar">{r.author[0]}</span>
                  <div>
                    <div className="rv-card__author-name">{r.author}</div>
                    <div className="rv-card__author-meta">{r.authorLevel}</div>
                  </div>
                </div>
                <span className="rv-card__helpful"><span className="ico material-symbols-outlined">thumb_up</span>{r.likes}</span>
                <span className="rv-card__date">{r.createdAt.replace(/-/g, '.')}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

window.Reviews = Reviews;
