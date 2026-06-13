/* global React */
// ============================================================
// BDR v2.30 — News (IU2 · Phase 10B · 보강 carry · BI2 ★★★)
// 운영: /news (E1 매거진 156) + /news/match/[id] (E2 단신 271).
//
// 보강: 카테고리 chip(전체/매치 단신/매거진/공지/이벤트) + trending spotlight +
//       카드 grid + IA1 발행 결과 자동 표시(NEW badge) +
//       Phase 1 대회 / Phase 2 경기 cross-domain link.
// 데이터: window.NEWS / window.NEWS_CATS / window.NEWS_BODY / window.NEWS_LINKS
// ============================================================

// ---- /news 매거진 메인 ----
function News() {
  const all = window.NEWS;
  const cats = window.NEWS_CATS;
  const [cat, setCat] = React.useState('all');

  const countByCat = {};
  cats.forEach(c => { countByCat[c.key] = c.key === 'all' ? all.length : all.filter(n => n.cat === c.key).length; });

  const rows = cat === 'all' ? all : all.filter(n => n.cat === cat);
  const spotlight = rows.find(n => n.trending) || rows[0];
  const rest = rows.filter(n => n !== spotlight);

  const catTag = (c) => {
    if (c === 'match') return { cls: 'nw-tag--match', label: '매치 단신' };
    if (c === 'magazine') return { cls: 'nw-tag--news', label: '매거진' };
    if (c === 'notice') return { cls: 'nw-tag--notice', label: '공지' };
    if (c === 'event') return { cls: 'nw-tag--event', label: '이벤트' };
    return { cls: 'nw-tag--news', label: 'BDR NEWS' };
  };

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 1080 }}>
        {/* 헤더 */}
        <header className="nw-head">
          <div className="nw-head__row">
            <h1 className="nw-head__title">BDR NEWS</h1>
            <span className="nw-head__by"><span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>smart_toy</span>알기자 · BDR NEWS AI</span>
          </div>
          <p className="nw-head__sub">
            매치 종료 후 AI 기자 <b>알기자</b>가 자동으로 작성하고, 운영자 검수 후 발행되는 BDR 동호회 단신·매거진입니다.
          </p>
        </header>

        {/* 카테고리 chip */}
        <div className="nw-cats">
          {cats.map(c => (
            <button key={c.key} className={'nw-cat' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
              <span className="ico material-symbols-outlined" style={{ fontSize: 15 }}>{c.ico}</span>{c.label}
              <span className="nw-cat__count">{countByCat[c.key]}</span>
            </button>
          ))}
        </div>

        {/* 카드 grid */}
        <div className="nw-grid">
          {/* trending spotlight */}
          {spotlight && (
            <a className="nw-spotlight" href={spotlight.matchId ? ('#/news/match/' + spotlight.matchId) : '#'}>
              <div className="nw-spotlight__cover">
                <span className="ico material-symbols-outlined">{spotlight.cat === 'match' ? 'sports_basketball' : 'photo'}</span>
              </div>
              <div className="nw-spotlight__body">
                <div className="nw-spotlight__eyebrow">
                  <span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>local_fire_department</span>
                  트렌딩 · 가장 많이 본 기사
                </div>
                <div className="nw-spotlight__title">{spotlight.title}</div>
                <p className="nw-spotlight__preview">{spotlight.preview}</p>
                <div className="nw-spotlight__foot">
                  <span><span className="ico material-symbols-outlined" style={{ fontSize: 15 }}>visibility</span>{spotlight.views.toLocaleString()}</span>
                  <span><span className="ico material-symbols-outlined" style={{ fontSize: 15 }}>favorite</span>{spotlight.likes}</span>
                  <span><span className="ico material-symbols-outlined" style={{ fontSize: 15 }}>chat_bubble</span>{spotlight.comments}</span>
                  <span style={{ marginLeft: 'auto' }}>{spotlight.date}</span>
                </div>
              </div>
            </a>
          )}

          {/* 나머지 카드 */}
          {rest.map(n => {
            const t = catTag(n.cat);
            return (
              <a key={n.id} className="nw-card" href={n.matchId ? ('#/news/match/' + n.matchId) : '#'}>
                <div className="nw-card__cover">
                  <span className="nw-card__cover-icon material-symbols-outlined">{n.cat === 'match' ? 'sports_basketball' : n.cat === 'event' ? 'celebration' : n.cat === 'notice' ? 'campaign' : 'photo'}</span>
                  {n.isNew && <span className="nw-card__cover-tag"><span className="nw-tag nw-tag--new">NEW</span></span>}
                </div>
                <div className="nw-card__body">
                  <div className="nw-card__meta-top">
                    <span className={'nw-tag ' + t.cls}>{t.label}</span>
                    <span className="nw-card__date">{n.date}</span>
                  </div>
                  <div className="nw-card__title">{n.title}</div>
                  <p className="nw-card__preview">{n.preview}</p>
                  <div className="nw-card__foot">
                    <span><span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>{n.views.toLocaleString()}</span>
                    <span><span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>favorite</span>{n.likes}</span>
                    <span><span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>chat_bubble</span>{n.comments}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>

        {/* 푸터 안내 */}
        <footer className="nw-footer">
          BDR NEWS는 AI 기자 알기자가 매치 종료 후 자동으로 작성한 기사이며, 운영자 검수 후 발행됩니다.<br />
          사실 오류는 <a>문의하기</a>로 알려주세요.
        </footer>
      </div>
    </div>
  );
}
window.News = News;

// ---- /news/match/[id] 단신 상세 (E2 carry) ----
function NewsMatch({ id = 'n1' }) {
  const post = window.NEWS.find(n => n.id === id) || window.NEWS[0];
  const body = window.NEWS_BODY[post.id] || [post.preview];
  const links = window.NEWS_LINKS;

  // {용어} → linkify anchor 치환
  const renderPara = (text) => {
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((p, i) => {
      const m = p.match(/^\{([^}]+)\}$/);
      if (m) {
        const label = m[1];
        return <a key={i} className="linkify" href={links[label] ? ('#' + links[label]) : '#'}>{label}</a>;
      }
      return <React.Fragment key={i}>{p}</React.Fragment>;
    });
  };

  const homeWin = post.homeScore >= post.awayScore;

  return (
    <div className="page">
      <div className="nm-wrap">
        {/* breadcrumb */}
        <nav className="nm-crumb">
          <a href="#/news">BDR NEWS</a>
          <span className="sep">›</span>
          <span>{post.tnName || '매치 단신'}</span>
        </nav>

        <article className="nm-article">
          <div className="nm-article__cat">
            <span className="nw-tag nw-tag--match">매치 단신</span>
            <span className="nw-card__date">{post.date}</span>
          </div>
          <h1 className="nm-article__title">{post.title}</h1>

          {/* 알기자 byline */}
          <div className="nm-byline">
            <span className="nm-byline__bot"><span className="ico material-symbols-outlined" style={{ fontSize: 14 }}>smart_toy</span>알기자</span>
            <span className="nm-byline__sub">BDR NEWS AI</span>
          </div>

          {/* 매치 스코어보드 (cross-domain) */}
          {post.matchId && (
            <div className="nm-score">
              <div className="nm-score__row">
                <div className={'nm-score__team' + (homeWin ? ' is-win' : '')}>
                  <div className="nm-score__team-name">{post.homeTeam}</div>
                  <div className="nm-score__team-num">{post.homeScore}</div>
                </div>
                <div className="nm-score__vs">vs</div>
                <div className={'nm-score__team' + (!homeWin ? ' is-win' : '')}>
                  <div className="nm-score__team-name">{post.awayTeam}</div>
                  <div className="nm-score__team-num">{post.awayScore}</div>
                </div>
              </div>
              <div className="nm-score__meta">
                <a href={'#/tournaments/' + post.tnId}>{post.tnName}</a>
                {post.round && <span>· {post.round}</span>}
              </div>
            </div>
          )}

          {/* Hero 사진 placeholder */}
          <div className="nm-cover">
            <span className="ico material-symbols-outlined">image</span>
            <span>경기 사진 (알기자 갤러리)</span>
          </div>

          {/* 본문 (linkify) */}
          <div className="nm-body">
            {body.map((p, i) => <p key={i}>{renderPara(p)}</p>)}
          </div>

          {/* 메타 + 매치 상세 link (Phase 2 cross-domain) */}
          <div className="nm-meta">
            <span><span className="ico material-symbols-outlined">visibility</span>{post.views.toLocaleString()}</span>
            <span><span className="ico material-symbols-outlined">favorite</span>{post.likes}</span>
            <span><span className="ico material-symbols-outlined">chat_bubble</span>{post.comments}</span>
            {post.matchId && <a className="nm-meta__more" href={'#/live/' + post.matchId}>매치 상세 →</a>}
          </div>
          <p className="nm-note">
            이 기사는 AI 기자 알기자가 매치 종료 후 자동으로 작성하고 운영자 검수를 거쳐 발행됩니다. 사실 오류 발견 시 신고해 주세요.
          </p>
        </article>

        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <a className="btn" href="#/news"><span className="ico material-symbols-outlined">arrow_back</span>다른 기사 보기</a>
        </div>
      </div>
    </div>
  );
}
window.NewsMatch = NewsMatch;
