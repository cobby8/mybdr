/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminSuggestions.jsx — Admin-C 사용자 그룹 · 건의사항 (v2.10)
//   진입: setRoute('adminSuggestions')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 카테고리 + 추천수(좋아요/싫어요) + 채택 라벨
// =====================================================================

const ADMIN_SUGGESTIONS_DATA = [
{
  suggestion_id: 'sg_20260514_018',
  title: '경기 결과 자동 입력 — 스코어 시트 연동',
  category: 'feature',
  category_label: '기능 제안',
  status: 'open',
  status_label: '접수',
  status_tone: 'warn',
  upvote: 142,
  downvote: 3,
  comment_count: 24,
  author_name: '오영진',
  author_tier: 'VVIP',
  created_at: '2026-05-14 18:42',
  summary: '점수 시트가 자동으로 경기 결과 화면에 반영되면 좋겠습니다.'
},
{
  suggestion_id: 'sg_20260513_022',
  title: '코트 즐겨찾기 + 알림 — 예약 가능 시간 푸시',
  category: 'feature',
  category_label: '기능 제안',
  status: 'in_review',
  status_label: '검토중',
  status_tone: 'info',
  upvote: 98,
  downvote: 5,
  comment_count: 18,
  author_name: '한지석',
  author_tier: 'VIP',
  created_at: '2026-05-13 22:18',
  summary: '관심 코트에 빈 시간 생기면 푸시 알림 받고 싶어요.'
},
{
  suggestion_id: 'sg_20260512_009',
  title: '심판 매칭 — 후기 별점 시스템',
  category: 'feature',
  category_label: '기능 제안',
  status: 'in_review',
  status_label: '검토중',
  status_tone: 'info',
  upvote: 67,
  downvote: 8,
  comment_count: 12,
  author_name: '강도현',
  author_tier: 'A',
  created_at: '2026-05-12 11:30',
  summary: '심판 자격을 매기는 후기 시스템이 있으면 좋겠어요.'
},
{
  suggestion_id: 'sg_20260510_044',
  title: 'iOS 다크모드 — 일부 화면 콘트라스트 낮음',
  category: 'bug',
  category_label: '버그 리포트',
  status: 'accepted',
  status_label: '채택',
  status_tone: 'ok',
  upvote: 54,
  downvote: 0,
  comment_count: 9,
  author_name: '서민지',
  author_tier: 'B',
  created_at: '2026-05-10 16:00',
  summary: '다크 모드에서 토너먼트 상세 페이지 글자가 잘 안 보임.'
},
{
  suggestion_id: 'sg_20260508_011',
  title: '팀원 가입 — 카카오 친구 초대 링크',
  category: 'feature',
  category_label: '기능 제안',
  status: 'accepted',
  status_label: '채택',
  status_tone: 'ok',
  upvote: 88,
  downvote: 2,
  comment_count: 14,
  author_name: '박하늘',
  author_tier: 'B',
  created_at: '2026-05-08 09:00',
  summary: '카카오 친구로 팀원 초대할 수 있게 해주세요.'
},
{
  suggestion_id: 'sg_20260506_007',
  title: '광고 제거 유료 플랜 — 월 3,000원',
  category: 'business',
  category_label: '운영 제안',
  status: 'rejected',
  status_label: '반려',
  status_tone: 'mute',
  upvote: 12,
  downvote: 34,
  comment_count: 22,
  author_name: 'haterstuff',
  author_tier: 'C',
  created_at: '2026-05-06 21:18',
  summary: '광고만 제거하는 저가 플랜 추가 요청. → 기존 베이직/프로 플랜으로 커버.'
},
{
  suggestion_id: 'sg_20260504_002',
  title: '경기장 사진 — 360도 뷰',
  category: 'feature',
  category_label: '기능 제안',
  status: 'rejected',
  status_label: '반려',
  status_tone: 'mute',
  upvote: 28,
  downvote: 18,
  comment_count: 7,
  author_name: '윤재호',
  author_tier: 'C',
  created_at: '2026-05-04 14:30',
  summary: '코트 360도 사진 — 비용·운영 효과 대비 우선순위 낮음.'
}];

window.ADMIN_SUGGESTIONS_DATA = ADMIN_SUGGESTIONS_DATA;

function sugStatusTab(s) {
  return s.status;
}

// =====================================================================
function AdminSuggestions({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'upvote', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_SUGGESTIONS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => sugStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') rows = rows.filter((r) => r.category === categoryFilter);
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
  }, [statusTab, search, categoryFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_SUGGESTIONS_DATA;
    const by = (k) => base.filter((r) => sugStatusTab(r) === k).length;
    return {
      all: base.length,
      open: by('open'),
      in_review: by('in_review'),
      accepted: by('accepted'),
      rejected: by('rejected')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const categories = ['all', ...new Set(ADMIN_SUGGESTIONS_DATA.map((r) => r.category))];

  const columns = [
  { key: 'title', label: '제안', sortable: true, width: '32%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</span>
      </div>
  },
  { key: 'category', label: '카테고리', sortable: true, width: 100,
    render: (r) =>
    <span className="admin-stat-pill" data-tone="mute">{r.category_label}</span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'upvote', label: '추천', sortable: true, width: 90,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--ff-mono)', fontSize: 12.5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--ok)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>thumb_up</span>
          {r.upvote}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--ink-dim)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 13 }}>thumb_down</span>
          {r.downvote}
        </span>
      </div>
  },
  { key: 'comment_count', label: '댓글', sortable: true, width: 60, align: 'right',
    render: (r) =>
    r.comment_count > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.comment_count}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'author_name', label: '작성자', sortable: true, width: 100,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{r.author_name}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>{r.author_tier}</span>
      </div>
  },
  { key: 'created_at', label: '접수', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{r.created_at.split(' ')[0]}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{r.created_at.split(' ')[1]}</span>
      </div>
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
      route="adminSuggestions"
      setRoute={setRoute}
      eyebrow="ADMIN · 사용자"
      title="건의사항"
      subtitle="유저가 제안한 기능·버그·운영 건의를 검토하고 채택 여부를 결정합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '사용자' },
      { label: '건의사항' }]
      }
      actions={
      <button type="button" className="btn">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
          CSV 내보내기
        </button>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'open', label: '접수', count: counts.open },
        { key: 'in_review', label: '검토중', count: counts.in_review },
        { key: 'accepted', label: '채택', count: counts.accepted },
        { key: 'rejected', label: '반려', count: counts.rejected }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '제목·내용 검색' }}
        filters={[
        { key: 'category', label: '카테고리', value: categoryFilter, onChange: (v) => { setCategoryFilter(v); setPage(1); },
          options: categories.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'feature' ? '기능 제안' :
            o === 'bug' ? '버그 리포트' :
            o === 'business' ? '운영 제안' : o
          })) }]
        }
        onReset={() => { setSearch(''); setCategoryFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}건 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              채택
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--ink-mute)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              반려
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="suggestion_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '건의사항이 없어요' : '조건에 맞는 건의가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '유저가 제안하면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setCategoryFilter('all'); setStatusTab('all'); }
        }}
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
        title={openDetail ? openDetail.title : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            {(openDetail?.status === 'open' || openDetail?.status === 'in_review') &&
            <>
                <button type="button" className="btn">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  반려
                </button>
                <button type="button" className="btn btn--primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  채택
                </button>
              </>
            }
          </>
        }>

        {openDetail && <SuggestionDetailPanel s={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function SuggestionDetailPanel({ s }) {
  const score = s.upvote - s.downvote;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={s.status_tone}>{s.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{s.category_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{s.suggestion_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>내용</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{s.summary}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>좋아요</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: 'var(--ok)', marginTop: 4 }}>{s.upvote}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>싫어요</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: 'var(--ink-dim)', marginTop: 4 }}>{s.downvote}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>점수</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: score >= 50 ? 'var(--accent)' : 'inherit', marginTop: 4 }}>
            {score > 0 ? '+' : ''}{score}
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>제안 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>작성자</dt>
          <dd style={{ margin: 0 }}>{s.author_name} <span style={{ color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginLeft: 4 }}>{s.author_tier}</span></dd>
          <dt style={{ color: 'var(--ink-mute)' }}>카테고리</dt>
          <dd style={{ margin: 0 }}>{s.category_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>접수</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{s.created_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>댓글</dt>
          <dd style={{ margin: 0 }}>{s.comment_count}개</dd>
        </dl>
      </section>
    </div>);

}

window.AdminSuggestions = AdminSuggestions;
