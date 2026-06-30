/* global React */
// ============================================================
// BDR v2.23 — AdminCommunity (CA1 · Phase 5A · 신규 · BC6 · super-admin)
// 운영 박제 대상: /admin/community (91 line → Phase 4 OA1 답습 hub)
// 측: Site Operator (super-admin)
//
// 신규 박제 (Phase 4 OA1 답습):
//   Hero band — 전체 / 핀 / 신고 / 삭제됨 + Site Operator badge
//   검색 + 카테고리 chip filter
//   탭 — 활성 / 핀 / 삭제됨 (+ 신고 = 모델 미확인 → 준비 중)
//   카드 list — 게시글 (title + 카테고리 + author + 조회/좋아요/댓글 + 상태)
//   모달 — 핀/핀해제/삭제/복구 (Phase 3 TA2) + 알림 ✅ 체크박스 (Phase 2 UD1)
// E 등급
// ============================================================

// 운영 community_posts.status 매핑 (published / pinned / hidden / deleted)
function buildAdminPosts() {
  const base = window.COMM_POSTS.map(p => ({
    ...p,
    admin_status: p.is_pinned ? 'pinned' : 'published',
  }));
  // 운영 상태 예시 — 삭제됨 (is_deleted) / 숨김 (hidden)
  base.push({
    id: 'cp-301', public_id: 'spam-removed', category: 'marketplace', type: 'text',
    title: '[삭제됨] 외부 도박 사이트 홍보성 게시물',
    author: { id: 'u-99', nickname: 'user_8841', avatar: 'U', is_official: false },
    view_count: 42, likes_count: 0, comments_count: 0, image_count: 0,
    is_pinned: false, admin_status: 'deleted', created_at: '2026-05-26T03:10:00',
    delete_reason: '광고성 / 외부 홍보',
  });
  base.push({
    id: 'cp-302', public_id: 'hidden-dispute', category: 'general', type: 'text',
    title: '[숨김] 거래 분쟁 관련 비방 게시물',
    author: { id: 'u-87', nickname: 'baller_kim', avatar: 'B', is_official: false },
    view_count: 318, likes_count: 4, comments_count: 22, image_count: 0,
    is_pinned: false, admin_status: 'hidden', created_at: '2026-05-24T15:40:00',
  });
  return base;
}

const CA1_TABS = [
  { key: 'active',  lbl: '활성',   ico: 'check_circle' },
  { key: 'pinned',  lbl: '핀',     ico: 'push_pin' },
  { key: 'report',  lbl: '신고',   ico: 'flag', disabled: true },
  { key: 'deleted', lbl: '삭제됨', ico: 'delete' },
];

function AdminCommunity() {
  const posts = React.useMemo(buildAdminPosts, []);
  const [tab, setTab] = React.useState('active');
  const [catFilter, setCatFilter] = React.useState('all');
  const [selected, setSelected] = React.useState(null);
  const [notify, setNotify] = React.useState(true);

  const counts = {
    total: posts.length,
    pinned: posts.filter(p => p.admin_status === 'pinned').length,
    deleted: posts.filter(p => p.admin_status === 'deleted').length,
  };

  let rows = posts;
  if (tab === 'active') rows = posts.filter(p => p.admin_status === 'published' || p.admin_status === 'pinned' || p.admin_status === 'hidden');
  else if (tab === 'pinned') rows = posts.filter(p => p.admin_status === 'pinned');
  else if (tab === 'deleted') rows = posts.filter(p => p.admin_status === 'deleted');
  if (catFilter !== 'all') rows = rows.filter(p => p.category === catFilter);

  const statusLabel = { published: '게시', pinned: '고정', hidden: '숨김', deleted: '삭제됨' };

  return (
    <div className="oa1-page">
      {/* Hero — Site Operator + stats */}
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>커뮤니티 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 콘텐츠 · COMMUNITY</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{counts.total}</div><div className="oa1-hero__stat-lbl">전체</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{counts.pinned}</div><div className="oa1-hero__stat-lbl">핀</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--archived">—</div><div className="oa1-hero__stat-lbl">신고</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--rejected">{counts.deleted}</div><div className="oa1-hero__stat-lbl">삭제됨</div></div>
        </div>
      </header>

      {/* filter row */}
      <div className="oa1-filter">
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, fontWeight: 800, color: 'var(--ink-dim)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingRight: 4 }}>카테고리</span>
        {[{ key: 'all', label: '전체' }, ...window.COMM_CATEGORIES.filter(c => c.key !== 'all')].map(c => (
          <button key={c.key} className={'tu1-filter__chip' + (catFilter === c.key ? ' is-on' : '')} onClick={() => setCatFilter(c.key)}>{c.label}</button>
        ))}
        <div style={{ flex: 1 }} />
        <div className="tu1-filter__search" style={{ minWidth: 200, maxWidth: 280 }}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="제목 / 작성자 닉네임" />
        </div>
      </div>

      {/* tabs */}
      <div className="ca1-tabs">
        {CA1_TABS.map(t => {
          const c = t.key === 'pinned' ? counts.pinned : t.key === 'deleted' ? counts.deleted : t.key === 'active' ? counts.total - counts.deleted : null;
          return (
            <button key={t.key}
              className={'ca1-tab' + (tab === t.key ? ' is-on' : '') + (t.disabled ? ' ca1-tab--disabled' : '')}
              data-active={tab === t.key}
              onClick={() => !t.disabled && setTab(t.key)}
              title={t.disabled ? '신고 모델 준비 중' : undefined}>
              <span className="ico material-symbols-outlined">{t.ico}</span>
              {t.lbl}
              {c !== null && <span className="ca1-tab__count">{c}</span>}
              {t.disabled && <span className="ico material-symbols-outlined" style={{ fontSize: 13, opacity: 0.6 }}>lock</span>}
            </button>
          );
        })}
      </div>

      {/* report tab placeholder (A2 — 신고 모델 미확인) */}
      {tab === 'report' ? (
        <div className="ca1-soon">
          <div className="ca1-soon__ico material-symbols-outlined">flag</div>
          <h3 className="ca1-soon__h">신고 처리 — 준비 중</h3>
          <p className="ca1-soon__p">신고(Report) 데이터 모델이 운영에 도입되면 활성화됩니다. 현재는 핀·숨김·삭제로 검수합니다.</p>
        </div>
      ) : (
        <div className="oa1-table">
          <div className="oa1-table__head ca1-table__head">
            <div>게시글</div><div>카테고리</div><div>작성자</div><div>지표</div><div>상태</div><div>액션</div>
          </div>
          {rows.map(p => (
            <div key={p.id} className="oa1-table__row ca1-table__row" onClick={() => setSelected(p)}>
              <div className="ca1-post-title">
                {p.admin_status === 'pinned' && <span className="ca1-post-pin material-symbols-outlined">push_pin</span>}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
              </div>
              <div data-label="카테고리"><window.CategoryBadge cat={p.category} /></div>
              <div data-label="작성자">
                <div className="oa1-table__col--owner-name">{p.author.nickname}</div>
                <div className="oa1-table__col--owner-email">user-{p.author.id.replace('u-', '')}</div>
              </div>
              <div data-label="지표" style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700 }}>
                조회 {window.commNum(p.view_count)} · ♥ {p.likes_count} · 💬 {p.comments_count}
              </div>
              <div data-label="상태"><span className="ca1-status" data-s={p.admin_status}>{statusLabel[p.admin_status]}</span></div>
              <div className="oa1-table__col--actions" data-label="액션">
                {p.admin_status === 'deleted'
                  ? <button className="btn btn--sm btn--primary">복구</button>
                  : (<>
                      <button className="btn btn--sm">{p.admin_status === 'pinned' ? '핀 해제' : '핀'}</button>
                      <button className="btn btn--sm btn-reject">삭제</button>
                    </>)}
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center', fontSize: 13, color: 'var(--ink-mute)' }}>해당 조건의 게시글이 없습니다</div>
          )}
        </div>
      )}

      {/* 상태 변경 모달 (Phase 3 TA2 답습 + Phase 2 UD1 알림 체크박스) */}
      {selected && (
        <section className="oa1-modal-stage" aria-modal="true">
          <div className="oa1-modal">
            <div className="oa1-modal__head">
              <div className="oa1-modal__head-body">
                <h3 className="oa1-modal__title">
                  게시글 검수
                  <span className="ca1-status" data-s={selected.admin_status}>{statusLabel[selected.admin_status]}</span>
                </h3>
                <div className="oa1-modal__sub">{window.commCat(selected.category).label} · {selected.author.nickname} · {window.commTime(selected.created_at)}</div>
              </div>
              <button className="oa1-modal__close" onClick={() => setSelected(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>

            <div className="oa1-modal__body">
              <div className="ou2-card" style={{ padding: 0, border: 0, marginBottom: 14 }}>
                <h4 className="ou2-card__h" style={{ margin: '0 0 8px' }}><span className="ico material-symbols-outlined">description</span>게시글 정보</h4>
                <div className="ou2-info-row"><span className="ou2-info-row__l">제목</span><span className="ou2-info-row__v" style={{ fontWeight: 700, color: 'var(--ink)' }}>{selected.title}</span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">작성자</span><span className="ou2-info-row__v">{selected.author.nickname} <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>· user-{selected.author.id.replace('u-', '')}</span></span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">지표</span><span className="ou2-info-row__v" style={{ fontFamily: 'var(--ff-mono)' }}>조회 {selected.view_count} · 좋아요 {selected.likes_count} · 댓글 {selected.comments_count}</span></div>
                {selected.delete_reason && (
                  <div className="ou2-info-row"><span className="ou2-info-row__l">삭제 사유</span><span className="ou2-info-row__v" style={{ color: 'var(--err)' }}>{selected.delete_reason}</span></div>
                )}
              </div>

              {selected.admin_status !== 'deleted' && (
                <div className="ou2-card" style={{ padding: 0, border: 0, marginBottom: 14 }}>
                  <h4 className="ou2-card__h" style={{ margin: '0 0 8px' }}><span className="ico material-symbols-outlined">gavel</span>처리 사유 <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--ink-dim)', fontWeight: 700 }}>(선택)</span></h4>
                  <input className="ou3-input" style={{ background: 'var(--bg-alt)' }} placeholder="삭제 / 숨김 사유 (사용자 안내용)" />
                </div>
              )}
            </div>

            {/* 알림 체크박스 (Phase 2 UD1 답습) + Footer CTA */}
            <div className="oa1-modal__foot">
              <div className="oa1-modal__notify">
                <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} id="ca1-notify" />
                <div>
                  <strong>처리 결과를 작성자에게 알림 발송</strong>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 2, letterSpacing: '0.02em' }}>
                    카카오 알림톡 + 이메일 ({selected.author.nickname})
                  </div>
                </div>
              </div>
              <div className="oa1-modal__cta">
                {selected.admin_status === 'deleted' ? (
                  <button className="btn btn--sm btn--primary"><span className="ico material-symbols-outlined">restart_alt</span>복구</button>
                ) : (<>
                  <button className="btn btn--sm">
                    <span className="ico material-symbols-outlined">push_pin</span>{selected.admin_status === 'pinned' ? '핀 해제' : '핀 고정'}
                  </button>
                  <button className="btn btn--sm btn-suspend">
                    <span className="ico material-symbols-outlined">visibility_off</span>숨김
                  </button>
                  <button className="btn btn--sm btn-reject">
                    <span className="ico material-symbols-outlined">delete</span>삭제
                  </button>
                </>)}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

window.AdminCommunity = AdminCommunity;
