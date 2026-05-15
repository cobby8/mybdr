/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminCommunity.jsx — Admin-B 콘텐츠 그룹 · 커뮤니티 관리 (v2.9)
//   진입: setRoute('adminCommunity')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: 게시판별 활성도 게이지 / 최근 글 미리보기
// =====================================================================

const ADMIN_COMMUNITY_DATA = [
{
  board_id: 'bd_free',
  name: '자유 게시판',
  slug: 'free',
  board_type: 'general',
  type_label: '일반',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  post_count: 4218,
  comment_count: 18643,
  recent_post_at: '2026-05-15 13:42',
  recent_post_title: '오늘 장충체육관 픽업 게임 모집',
  activity_score: 94,
  daily_posts_7d: 22,
  manager_name: '이박재',
  reports_pending: 2
},
{
  board_id: 'bd_recruit',
  name: '팀원 모집',
  slug: 'recruit',
  board_type: 'recruit',
  type_label: '모집',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  post_count: 2841,
  comment_count: 9842,
  recent_post_at: '2026-05-15 12:18',
  recent_post_title: '강남 윙스 새 멤버 1명 구합니다',
  activity_score: 88,
  daily_posts_7d: 18,
  manager_name: '이박재',
  reports_pending: 0
},
{
  board_id: 'bd_review',
  name: '경기 리뷰',
  slug: 'review',
  board_type: 'review',
  type_label: '리뷰',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  post_count: 1502,
  comment_count: 4218,
  recent_post_at: '2026-05-15 11:04',
  recent_post_title: 'BDR 챌린지 #8 1라운드 리뷰',
  activity_score: 76,
  daily_posts_7d: 9,
  manager_name: '정세훈',
  reports_pending: 0
},
{
  board_id: 'bd_qna',
  name: '질문 / 답변',
  slug: 'qna',
  board_type: 'qna',
  type_label: 'Q&A',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  post_count: 998,
  comment_count: 3210,
  recent_post_at: '2026-05-15 10:32',
  recent_post_title: '심판 자격증 어디서 따나요?',
  activity_score: 62,
  daily_posts_7d: 7,
  manager_name: '정세훈',
  reports_pending: 1
},
{
  board_id: 'bd_market',
  name: '중고 장터',
  slug: 'market',
  board_type: 'market',
  type_label: '거래',
  status: 'review',
  status_label: '검토중',
  status_tone: 'warn',
  post_count: 612,
  comment_count: 1822,
  recent_post_at: '2026-05-14 22:18',
  recent_post_title: '나이키 코비 11 280 새상품 판매',
  activity_score: 48,
  daily_posts_7d: 4,
  manager_name: '오영진',
  reports_pending: 5
},
{
  board_id: 'bd_referee',
  name: '심판 / 운영',
  slug: 'referee',
  board_type: 'staff',
  type_label: '운영',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  post_count: 412,
  comment_count: 1102,
  recent_post_at: '2026-05-14 18:44',
  recent_post_title: '2026년 심판 정기 교육 일정',
  activity_score: 54,
  daily_posts_7d: 3,
  manager_name: '김도훈',
  reports_pending: 0
},
{
  board_id: 'bd_archive',
  name: '아카이브 (2024)',
  slug: 'archive-2024',
  board_type: 'archive',
  type_label: '보관',
  status: 'inactive',
  status_label: '비활성',
  status_tone: 'mute',
  post_count: 8421,
  comment_count: 24108,
  recent_post_at: '2024-12-31 23:58',
  recent_post_title: '2024년 마지막 글 — 새해 인사',
  activity_score: 0,
  daily_posts_7d: 0,
  manager_name: '김도훈',
  reports_pending: 0
}];

window.ADMIN_COMMUNITY_DATA = ADMIN_COMMUNITY_DATA;

function boardStatusTab(b) {
  return b.status; // active / review / inactive
}

// =====================================================================
function AdminCommunity({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'activity_score', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_COMMUNITY_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => boardStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.slug.toLowerCase().includes(q) ||
      r.manager_name.toLowerCase().includes(q));
    }
    if (typeFilter !== 'all') rows = rows.filter((r) => r.board_type === typeFilter);
    rows.sort((a, b) => {
      const va = a[sort.key]; const vb = b[sort.key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, typeFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_COMMUNITY_DATA;
    const by = (k) => base.filter((r) => boardStatusTab(r) === k).length;
    return {
      all: base.length,
      active: by('active'),
      review: by('review'),
      inactive: by('inactive')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const types = ['all', ...new Set(ADMIN_COMMUNITY_DATA.map((r) => r.board_type))];

  const typeIcon = {
    general: 'forum', recruit: 'group_add', review: 'rate_review',
    qna: 'help', market: 'sell', staff: 'admin_panel_settings',
    archive: 'inventory_2'
  };

  const columns = [
  { key: 'name', label: '게시판', sortable: true, width: '28%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        color: 'var(--ink-soft)',
        display: 'grid', placeItems: 'center',
        flex: '0 0 auto'
      }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{typeIcon[r.board_type] || 'forum'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>/{r.slug}</span>
        </div>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 90,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
        <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
        {r.reports_pending > 0 &&
      <span style={{ fontSize: 10, color: 'var(--danger)', fontFamily: 'var(--ff-mono)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 11, verticalAlign: '-2px' }}>report</span>
            {' '}신고 {r.reports_pending}
          </span>
      }
      </div>
  },
  { key: 'post_count', label: '글', sortable: true, width: 70, align: 'right',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600 }}>{r.post_count.toLocaleString()}</span>
  },
  { key: 'recent_post_at', label: '최근 글', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--ink-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.recent_post_title}
        </span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{r.recent_post_at}</span>
      </div>
  },
  { key: 'activity_score', label: '활성도', sortable: true, width: 110,
    render: (r) => {
      const pct = r.activity_score;
      const tone = pct >= 80 ? '' : pct >= 50 ? 'warn' : 'full';
      return (
        <div className="admin-progress">
          <div className="admin-progress__bar">
            <div className="admin-progress__fill" data-tone={tone} style={{ width: `${Math.min(100, pct)}%` }}></div>
          </div>
          <span className="admin-progress__label">{pct}</span>
        </div>);
    }
  },
  { key: 'manager_name', label: '관리자', width: 70,
    render: (r) =>
    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.manager_name}</span>
  },
  { key: '_actions', label: '', width: 40,
    render: (r) =>
    <button
      type="button"
      className="admin-row-stop"
      onClick={(e) => { e.stopPropagation(); setOpenDetail(r); }}
      style={{ background: 'transparent', border: 0, padding: 6, cursor: 'pointer', color: 'var(--ink-mute)', borderRadius: 4 }}
      aria-label="상세">

        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_horiz</span>
      </button>
  }];


  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty</option>
          <option value="loading">C · loading</option>
          <option value="error">B · error</option>
        </select>
      </div>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">DH</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>김도훈</span>
          <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell
      route="adminCommunity"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="커뮤니티 관리"
      subtitle="게시판별 활동 / 신고를 모니터링하고 관리자 배정 · 카테고리 정렬을 처리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '커뮤니티 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminNews')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>newspaper</span>
            BDR NEWS
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            게시판 만들기
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'active', label: '활성', count: counts.active },
        { key: 'review', label: '검토중', count: counts.review },
        { key: 'inactive', label: '비활성', count: counts.inactive }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '게시판명 · 슬러그 · 관리자 검색' }}
        filters={[
        { key: 'type', label: '타입', value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); },
          options: types.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'general' ? '일반' :
            o === 'recruit' ? '모집' :
            o === 'review' ? '리뷰' :
            o === 'qna' ? 'Q&A' :
            o === 'market' ? '거래' :
            o === 'staff' ? '운영' :
            o === 'archive' ? '보관' : o
          })) }]
        }
        onReset={() => { setSearch(''); setTypeFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}개 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>archive</span>
              비활성화
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="board_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 게시판이 없어요' : '조건에 맞는 게시판이 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 게시판 만들기로 첫 게시판을 추가하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '게시판 만들기' : '필터 초기화'}
        onEmptyCta={() => { setSearch(''); setTypeFilter('all'); setStatusTab('all'); }}
        sort={sort}
        onSortChange={setSort}
        selectable
        selected={selected}
        onSelectChange={setSelected}
        onRowClick={(r) => setOpenDetail(r)}
        pagination={{ page, total: filtered.length, perPage, onChange: setPage }} />


      <AdminDetailModal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title={openDetail ? openDetail.name : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              수정
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setRoute('boardList')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              게시판 페이지
            </button>
          </>
        }>

        {openDetail && <BoardDetailPanel b={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function BoardDetailPanel({ b, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={b.status_tone}>{b.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{b.type_label}</span>
        {b.reports_pending > 0 &&
        <span className="admin-stat-pill" data-tone="err">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>report</span>
            신고 {b.reports_pending}
          </span>
        }
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>/{b.slug}</span>
      </div>

      {/* 핵심 지표 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>총 게시글</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{b.post_count.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>댓글</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{b.comment_count.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>7일 글/일</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{b.daily_posts_7d}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>최근 글</div>
        <div style={{ padding: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>{b.recent_post_title}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>{b.recent_post_at}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>활성도</div>
        <div className="admin-progress">
          <div className="admin-progress__bar" style={{ height: 8 }}>
            <div className="admin-progress__fill" data-tone={b.activity_score >= 80 ? '' : b.activity_score >= 50 ? 'warn' : 'full'} style={{ width: `${b.activity_score}%`, height: '100%' }}></div>
          </div>
          <span className="admin-progress__label" style={{ fontWeight: 700, fontSize: 13 }}>{b.activity_score}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>최근 7일 글 빈도 + 댓글 비율 + 활동 사용자 수</div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {b.reports_pending > 0 &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>report</span>
              신고 {b.reports_pending}건 검토
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
            관리자 변경 (현재 {b.manager_name})
          </button>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            게시판 정보 수정
          </button>
          {b.status === 'active' ?
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility_off</span>
              비활성화
            </button> :

          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>visibility</span>
              활성화
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminCommunity = AdminCommunity;
