/* global React */
// ============================================================
// BDR v2.23 — CommunityList (CU1 · Phase 5B · 보강 · BC2)
// 운영 박제 대상: /community (CommunityContent 보강)
// 진입: AppNav "커뮤니티" 탭
//
// 보강:
//   CU1-A 카테고리 chip row sticky (BC2)
//   CU1-B 카테고리별 카드 시각 분리 (cat-badge + type icon)
//   CU1-C "BDR NEWS(대회 알기자)" = Phase 1A 대회 cross-domain link 시각
//   CU1-D "글 쓰기" CTA → /community/new (CU3)
//   CU1-E sidebar — 이 주 인기 글 5 + 내 활동
// A 등급
// ============================================================

function CommunityList() {
  const [cat, setCat] = React.useState('all');
  const posts = window.COMM_POSTS;
  const filtered = (cat === 'all' ? posts : posts.filter(p => p.category === cat))
    .slice().sort((a, b) => (b.is_pinned - a.is_pinned) || (new Date(b.created_at) - new Date(a.created_at)));

  return (
    <div className="comm-page">
      <div className="comm-with-aside">
        <window.CommunityAsideNav active={cat} />

        <div className="comm-main">
          <header className="cu1-head">
            <div>
              <h1 className="cu1-head__title">커뮤니티</h1>
              <div className="cu1-head__sub">농구 이야기를 나누고, 팀원을 모집하고, 정보를 공유하세요</div>
            </div>
            <a className="comm-aside__write" style={{ width: 'auto', marginBottom: 0 }} href="cu3-community-new.html">
              <span className="ico material-symbols-outlined">edit_square</span>
              글 쓰기
            </a>
          </header>

          {/* BC2 — 카테고리 chip row sticky */}
          <div className="cu1-chips">
            {window.COMM_CATEGORIES.map(c => (
              <button key={c.key}
                className={'cu1-chip' + (cat === c.key ? ' is-on' : '') + (c.alkija ? ' is-alkija' : '')}
                onClick={() => setCat(c.key)}>
                <span className="ico material-symbols-outlined">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>

          <div className="cu1-grid">
            {/* post list */}
            <div className="cu1-list">
              {filtered.map(p => {
                const isAlkija = p.category === 'news';
                return (
                  <a key={p.id} href="cu2-community-detail.html"
                    className={'cu-post' + (p.is_pinned ? ' is-pinned' : '') + (isAlkija ? ' is-alkija' : '')}>
                    <div className="cu-post__body">
                      <div className="cu-post__top">
                        {p.is_pinned && <span className="cu-post__pin"><span className="ico material-symbols-outlined">push_pin</span>고정</span>}
                        <window.CategoryBadge cat={p.category} />
                        {isAlkija && p.tournament && (
                          <span className="cu-post__alkija"><span className="ico material-symbols-outlined">emoji_events</span>{p.tournament.org}</span>
                        )}
                      </div>
                      <h3 className="cu-post__title">{p.title}</h3>
                      <p className="cu-post__excerpt">{p.excerpt}</p>
                      <div className="cu-post__meta">
                        <window.CommAuthor author={p.author} size={22} />
                        {p.team && <><span className="cu-post__dot">·</span><span>{p.team.name}</span></>}
                        <span className="cu-post__dot">·</span>
                        <span>{window.commTime(p.created_at)}</span>
                        <span className="cu-post__dot">·</span>
                        <span className={'cu-post__meta-stat' + (p.view_count > 1500 ? ' is-hot' : '')}>
                          <span className="ico material-symbols-outlined">visibility</span>{window.commNum(p.view_count)}
                        </span>
                        <span className="cu-post__meta-stat"><span className="ico material-symbols-outlined">favorite</span>{p.likes_count}</span>
                        <span className="cu-post__meta-stat"><span className="ico material-symbols-outlined">chat_bubble</span>{p.comments_count}</span>
                      </div>
                    </div>
                    {p.image_count > 0 && (
                      <div className="cu-post__thumb">
                        <span className="ico material-symbols-outlined">{p.type === 'video' ? 'play_circle' : 'image'}</span>
                        {p.image_count > 1 && <span className="cu-post__thumb-n">+{p.image_count}</span>}
                      </div>
                    )}
                  </a>
                );
              })}
            </div>

            {/* CU1-E sidebar */}
            <aside className="cu1-side">
              <div className="cu-side-card">
                <h4 className="cu-side-card__h"><span className="ico material-symbols-outlined">local_fire_department</span>이 주 인기 글</h4>
                {window.COMM_HOT.map((p, i) => (
                  <a key={p.id} className="cu-hot-row" href="cu2-community-detail.html">
                    <span className="cu-hot-row__rank">{i + 1}</span>
                    <span className="cu-hot-row__title">{p.title}</span>
                    <span className="cu-hot-row__v">{window.commNum(p.view_count)}</span>
                  </a>
                ))}
              </div>
              <div className="cu-side-card">
                <h4 className="cu-side-card__h"><span className="ico material-symbols-outlined">person</span>내 활동</h4>
                <div className="cu-myact">
                  <div className="cu-myact__cell"><div className="cu-myact__num">7</div><div className="cu-myact__lbl">작성한 글</div></div>
                  <div className="cu-myact__cell"><div className="cu-myact__num">34</div><div className="cu-myact__lbl">받은 좋아요</div></div>
                  <div className="cu-myact__cell"><div className="cu-myact__num">12</div><div className="cu-myact__lbl">작성 댓글</div></div>
                  <div className="cu-myact__cell"><div className="cu-myact__num">5</div><div className="cu-myact__lbl">스크랩</div></div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CommunityList = CommunityList;
