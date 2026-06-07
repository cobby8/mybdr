/* global React */
// ============================================================
// BDR v2.23 — CommunityDetail (CU2 · Phase 5B · 보강 · BC4 + BC2)
// 운영 박제 대상: /community/[id] (CommunityPostPage 보강)
// 진입: CU1 카드 클릭
//
// 보강:
//   CU2-A Hero band (title + 카테고리 + 메타)
//   CU2-C 좋아요 카드 (BC4 · community_post_likes)
//   CU2-D 댓글 시스템 (운영 comments 모델 확인 — commentable_type="CommunityPost")
//   CU2-E sidebar 추천 (작성자 다른 글 + 카테고리 다른 글)
//   CU2-F 본인 게시글 = 수정/삭제 CTA (is_mine 가드)
//   CU2-G 대회 알기자 = Phase 1A 대회 hero badge (BC2 cross-domain)
// A 등급
// ============================================================

function CommunityDetail() {
  const post = window.COMM_DETAIL;
  const [liked, setLiked] = React.useState(post.is_liked);
  const [likes, setLikes] = React.useState(post.likes_count);
  const isAlkija = post.category === 'news';

  const toggleLike = () => {
    setLiked(!liked);
    setLikes(likes + (liked ? -1 : 1));
  };

  return (
    <div className="comm-page">
      <div className="comm-with-aside">
        <window.CommunityAsideNav active={post.category} />

        <div className="comm-main">
          {/* breadcrumb */}
          <nav className="crumbs cu2-crumbs">
            <a href="cu1-community-list.html">홈</a>
            <span className="sep">›</span>
            <a href="cu1-community-list.html">{window.commCat(post.category).label}</a>
            <span className="sep">›</span>
            <span className="cur">글 상세</span>
          </nav>

          <div className="cu2-grid">
            <main className="cu2-main">
              {/* CU2-G — 대회 알기자 hero badge (BC2 cross-domain Phase 1A) */}
              {isAlkija && post.tournament && (
                <div className="cu2-alkija-hero">
                  <div className="cu2-alkija-hero__ico"><span className="ico material-symbols-outlined">emoji_events</span></div>
                  <div className="cu2-alkija-hero__body">
                    <div className="cu2-alkija-hero__lbl">BDR NEWS · 대회 연결</div>
                    <div className="cu2-alkija-hero__name">{post.tournament.name}</div>
                  </div>
                  <a className="cu2-alkija-hero__cta" href="ua2-tournament-detail.html">
                    대회 보기<span className="ico material-symbols-outlined">arrow_forward</span>
                  </a>
                </div>
              )}

              {/* CU2-A — article */}
              <article className="cu2-article">
                <header className="cu2-article__head">
                  <div className="cu2-article__badges">
                    <window.CategoryBadge cat={post.category} withIcon />
                    {post.is_pinned && <span className="cu-post__pin"><span className="ico material-symbols-outlined">push_pin</span>고정</span>}
                  </div>
                  <h1 className="cu2-article__title">{post.title}</h1>
                  <div className="cu2-article__meta">
                    <window.CommAuthor author={post.author} size={28} />
                    <span className="cu2-article__meta-sep">·</span>
                    <span>{window.commTime(post.created_at)}</span>
                    <span className="cu2-article__meta-sep">·</span>
                    <span className="cu2-article__meta-stat"><span className="ico material-symbols-outlined">visibility</span>{window.commNum(post.view_count)}</span>
                    <span className="cu2-article__meta-stat"><span className="ico material-symbols-outlined">favorite</span>{likes}</span>
                    <span className="cu2-article__meta-stat"><span className="ico material-symbols-outlined">chat_bubble</span>{post.comments_count}</span>
                  </div>
                </header>

                {/* CU2-B — body (이미지/영상/텍스트 분기) */}
                <div className="cu2-article__body">
                  {post.image_count > 0 && (
                    <div className="cu2-article__media">
                      <div className="cu2-article__media-note">
                        <span className="ico material-symbols-outlined">{post.type === 'video' ? 'play_circle' : 'photo_library'}</span>
                        {post.type === 'video' ? '영상' : post.image_count + '장 갤러리'} · 운영 image_url
                      </div>
                    </div>
                  )}
                  {post.body.map((para, i) => <p key={i} className="cu2-article__p">{para}</p>)}
                </div>

                {/* CU2-C — 좋아요 카드 (BC4) */}
                <div className="cu2-react">
                  <button className={'cu2-like' + (liked ? ' is-liked' : '')} onClick={toggleLike}>
                    <span className="ico material-symbols-outlined">{liked ? 'favorite' : 'favorite_border'}</span>
                    좋아요 {likes}
                  </button>
                  <button className="cu2-share"><span className="ico material-symbols-outlined">share</span>공유</button>
                  <button className="cu2-share" title="신고 준비 중" style={{ opacity: 0.55, cursor: 'not-allowed' }} disabled>
                    <span className="ico material-symbols-outlined">flag</span>신고
                  </button>
                </div>
              </article>

              {/* CU2-F — 본인 게시글 액션 (is_mine 가드) */}
              {post.is_mine && (
                <div className="cu2-owner-bar">
                  <span className="cu2-owner-bar__lbl"><span className="ico material-symbols-outlined">edit_note</span>내가 작성한 글</span>
                  <a className="btn btn--sm" href="cu4-community-edit.html"><span className="ico material-symbols-outlined">edit</span>수정</a>
                  <button className="btn btn--sm btn-reject"><span className="ico material-symbols-outlined">delete</span>삭제</button>
                </div>
              )}

              {/* CU2-D — 댓글 (운영 comments 모델) */}
              <section className="cu2-comments">
                <div className="cu2-comments__h">
                  <h3 className="cu2-comments__h-t">댓글</h3>
                  <span className="cu2-comments__h-n">{post.comments_count}</span>
                </div>
                <div className="cu2-cform">
                  <textarea className="cu2-cform__input" placeholder="댓글을 남겨보세요"></textarea>
                  <button className="btn btn--primary" style={{ alignSelf: 'flex-end' }}>등록</button>
                </div>
                <div className="cu2-clist">
                  {window.COMM_COMMENTS.map(c => (
                    <div key={c.id} className="cu2-comment">
                      <span className="cu2-comment__av">{c.avatar}</span>
                      <div className="cu2-comment__body">
                        <div className="cu2-comment__top">
                          <span className="cu2-comment__name">{c.nickname}</span>
                          {c.is_author && <span className="cu2-comment__author-tag">작성자</span>}
                          <span className="cu2-comment__time">{window.commTime(c.created_at)}</span>
                        </div>
                        <p className="cu2-comment__text">{c.body}</p>
                        <button className="cu2-comment__like"><span className="ico material-symbols-outlined">favorite_border</span>{c.likes}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            {/* CU2-E — sidebar 추천 */}
            <aside className="cu2-side">
              <div className="cu-side-card">
                <div className="cu2-author-card">
                  <span className="cu2-author-card__av">{post.author.avatar}</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="cu2-author-card__name">
                      {post.author.nickname}
                      {post.author.is_official && <span className="ico material-symbols-outlined comm-author__badge">verified</span>}
                    </div>
                    <div className="cu2-author-card__sub">BDR 공식 알기자</div>
                  </div>
                  <button className="btn btn--sm" style={{ marginLeft: 'auto' }}><span className="ico material-symbols-outlined">add</span>팔로우</button>
                </div>
              </div>

              <div className="cu-side-card">
                <h4 className="cu-side-card__h"><span className="ico material-symbols-outlined">article</span>이 작성자의 다른 글</h4>
                {window.COMM_RECO_AUTHOR.map(p => (
                  <a key={p.id} className="cu-reco-row" href="cu2-community-detail.html">
                    <div className="cu-reco-row__title">{p.title}</div>
                    <div className="cu-reco-row__meta">{window.commCat(p.category).label} · 조회 {window.commNum(p.view_count)}</div>
                  </a>
                ))}
              </div>

              <div className="cu-side-card">
                <h4 className="cu-side-card__h"><span className="ico material-symbols-outlined">forum</span>이 카테고리 다른 글</h4>
                {window.COMM_RECO_CATEGORY.map(p => (
                  <a key={p.id} className="cu-reco-row" href="cu2-community-detail.html">
                    <div className="cu-reco-row__title">{p.title}</div>
                    <div className="cu-reco-row__meta">{window.commCat(p.category).label} · 좋아요 {p.likes_count}</div>
                  </a>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

window.CommunityDetail = CommunityDetail;
