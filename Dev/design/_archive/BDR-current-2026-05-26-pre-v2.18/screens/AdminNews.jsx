/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminNews.jsx — Admin-B 콘텐츠 그룹 · BDR NEWS 관리 (v2.9)
//   진입: setRoute('adminNews')
//   복귀: setRoute('adminDashboard') · adminCommunity
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: 기사 미리보기 / 조회수 강조 / pinned 표시
// =====================================================================

const ADMIN_NEWS_DATA = [
{
  article_id: 'n_2026_summer_4',
  title: 'BDR 서머 오픈 #4 — 7월 1일 접수 시작',
  category: 'tournament',
  category_label: '대회',
  status: 'published',
  status_label: '발행중',
  status_tone: 'ok',
  author_name: '이박재',
  published_at: '2026-05-14 09:00',
  updated_at: '2026-05-14 09:00',
  view_count: 4218,
  comment_count: 24,
  is_pinned: true,
  excerpt: '올여름 가장 큰 3x3 대회가 돌아옵니다. 4종별 · 총상금 1,200만 원.'
},
{
  article_id: 'n_2026_challenge_open',
  title: 'BDR 챌린지 #8 개막 — 32팀 전국 본선',
  category: 'tournament',
  category_label: '대회',
  status: 'published',
  status_label: '발행중',
  status_tone: 'ok',
  author_name: '이박재',
  published_at: '2026-05-12 10:30',
  updated_at: '2026-05-13 14:18',
  view_count: 3142,
  comment_count: 18,
  is_pinned: false,
  excerpt: 'BDR 챌린지 시리즈 8번째 시즌이 5월 15일 개막합니다.'
},
{
  article_id: 'n_2026_referee_program',
  title: '2026년 BDR 심판 정기 교육 공고',
  category: 'notice',
  category_label: '공지',
  status: 'published',
  status_label: '발행중',
  status_tone: 'ok',
  author_name: '김도훈',
  published_at: '2026-05-10 16:00',
  updated_at: '2026-05-10 16:00',
  view_count: 1842,
  comment_count: 9,
  is_pinned: true,
  excerpt: '심판 자격 갱신 및 신규 자격 신청 일정을 안내드립니다.'
},
{
  article_id: 'n_2026_rookie_recap',
  title: '루키 컵 #3 결과 — 신촌 라이온스 우승',
  category: 'recap',
  category_label: '리캡',
  status: 'published',
  status_label: '발행중',
  status_tone: 'ok',
  author_name: '정세훈',
  published_at: '2026-05-12 18:30',
  updated_at: '2026-05-12 18:30',
  view_count: 982,
  comment_count: 12,
  is_pinned: false,
  excerpt: 'U18 부문에서 신촌 라이온스가 광진 호크스를 21-18로 꺾고 우승.'
},
{
  article_id: 'n_2026_interview_kim',
  title: '인터뷰 — 강도현, "다음 시즌은 더 강해진다"',
  category: 'interview',
  category_label: '인터뷰',
  status: 'draft',
  status_label: '작성중',
  status_tone: 'warn',
  author_name: '정세훈',
  published_at: null,
  updated_at: '2026-05-14 22:18',
  view_count: 0,
  comment_count: 0,
  is_pinned: false,
  excerpt: '서초 콜로서스의 에이스 강도현 인터뷰 — 시즌 회고와 다음 시즌 각오.'
},
{
  article_id: 'n_2026_facilities_update',
  title: '협력 코트 추가 — 5월 신규 등록 4곳',
  category: 'notice',
  category_label: '공지',
  status: 'draft',
  status_label: '작성중',
  status_tone: 'warn',
  author_name: '김도훈',
  published_at: null,
  updated_at: '2026-05-15 11:02',
  view_count: 0,
  comment_count: 0,
  is_pinned: false,
  excerpt: '서울 5개 구에 신규 협력 코트가 추가되었습니다. 예약 시 우대 사용료.'
},
{
  article_id: 'n_2025_winter_recap',
  title: '2025 윈터 인비테이셔널 결산',
  category: 'recap',
  category_label: '리캡',
  status: 'archived',
  status_label: '보관',
  status_tone: 'mute',
  author_name: '김도훈',
  published_at: '2025-12-22 14:00',
  updated_at: '2025-12-22 14:00',
  view_count: 5821,
  comment_count: 32,
  is_pinned: false,
  excerpt: '한 해를 마무리한 윈터 인비테이셔널 — 8팀 토너먼트 풀 결과.'
},
{
  article_id: 'n_2025_rule_change',
  title: '2026 시즌 룰 개정 안내',
  category: 'notice',
  category_label: '공지',
  status: 'archived',
  status_label: '보관',
  status_tone: 'mute',
  author_name: '김도훈',
  published_at: '2025-11-30 09:00',
  updated_at: '2025-11-30 09:00',
  view_count: 3402,
  comment_count: 41,
  is_pinned: false,
  excerpt: 'FIBA 3x3 룰 변경에 따른 BDR 2026 시즌 운영 룰 개정 사항.'
}];

window.ADMIN_NEWS_DATA = ADMIN_NEWS_DATA;

function newsStatusTab(n) {
  return n.status; // published / draft / archived
}

// =====================================================================
function AdminNews({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [authorFilter, setAuthorFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'updated_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_NEWS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => newsStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.title.toLowerCase().includes(q) ||
      r.excerpt.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') rows = rows.filter((r) => r.category === categoryFilter);
    if (authorFilter !== 'all') rows = rows.filter((r) => r.author_name === authorFilter);
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
  }, [statusTab, search, categoryFilter, authorFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_NEWS_DATA;
    const by = (k) => base.filter((r) => newsStatusTab(r) === k).length;
    return {
      all: base.length,
      published: by('published'),
      draft: by('draft'),
      archived: by('archived')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const categories = ['all', ...new Set(ADMIN_NEWS_DATA.map((r) => r.category))];
  const authors = ['all', ...new Set(ADMIN_NEWS_DATA.map((r) => r.author_name))];

  const columns = [
  { key: 'title', label: '제목', sortable: true, width: '34%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {r.is_pinned &&
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }} title="고정">push_pin</span>
        }
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.excerpt}
        </span>
      </div>
  },
  { key: 'category', label: '카테고리', sortable: true, width: 90,
    render: (r) =>
    <span className="admin-stat-pill" data-tone="mute">{r.category_label}</span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'published_at', label: '발행', sortable: true, width: 110,
    render: (r) =>
    r.published_at ?
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>
            {r.published_at.split(' ')[0]}
          </span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>
            {r.published_at.split(' ')[1]}
          </span>
        </div> :

    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>미발행</span>

  },
  { key: 'view_count', label: '조회', sortable: true, width: 80, align: 'right',
    render: (r) =>
    r.view_count > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: r.view_count >= 3000 ? 'var(--accent)' : 'var(--ink)' }}>
          {r.view_count.toLocaleString()}
        </span> :

    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>

  },
  { key: 'comment_count', label: '댓글', sortable: true, width: 60, align: 'right',
    render: (r) =>
    r.comment_count > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.comment_count}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'author_name', label: '작성자', sortable: true, width: 70,
    render: (r) =>
    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.author_name}</span>
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
      route="adminNews"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="BDR NEWS"
      subtitle="대회 / 공지 / 리캡 / 인터뷰 기사를 작성·발행하고 고정 기사를 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '커뮤니티', onClick: () => setRoute('adminCommunity') },
      { label: 'BDR NEWS' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('postWrite')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            새 기사 작성
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'published', label: '발행중', count: counts.published },
        { key: 'draft', label: '작성중', count: counts.draft },
        { key: 'archived', label: '보관', count: counts.archived }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '제목 · 발췌 검색' }}
        filters={[
        { key: 'category', label: '카테고리', value: categoryFilter, onChange: (v) => { setCategoryFilter(v); setPage(1); },
          options: categories.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'tournament' ? '대회' :
            o === 'notice' ? '공지' :
            o === 'recap' ? '리캡' :
            o === 'interview' ? '인터뷰' : o
          })) },
        { key: 'author', label: '작성자', value: authorFilter, onChange: (v) => { setAuthorFilter(v); setPage(1); },
          options: authors.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setCategoryFilter('all'); setAuthorFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}개 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>push_pin</span>
              고정
            </button>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>archive</span>
              보관
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>delete</span>
              삭제
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="article_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '발행된 기사가 없어요' : '조건에 맞는 기사가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 새 기사 작성 버튼으로 첫 기사를 등록하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 기사 작성' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('postWrite');
          else { setSearch(''); setCategoryFilter('all'); setAuthorFilter('all'); setStatusTab('all'); }
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
            <button type="button" className="btn" onClick={() => setRoute('postEdit')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              수정
            </button>
            {openDetail?.status === 'published' &&
            <button type="button" className="btn btn--primary" onClick={() => setRoute('postDetail')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                기사 보기
              </button>
            }
          </>
        }>

        {openDetail && <NewsDetailPanel n={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function NewsDetailPanel({ n, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={n.status_tone}>{n.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{n.category_label}</span>
        {n.is_pinned &&
        <span className="admin-stat-pill" data-tone="info">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>push_pin</span>
            고정
          </span>
        }
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{n.article_id}</span>
      </div>

      {/* 미리보기 */}
      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>발췌</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
          {n.excerpt}
        </p>
      </section>

      {n.status === 'published' &&
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>조회수</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{n.view_count.toLocaleString()}</div>
          </div>
          <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>댓글</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{n.comment_count}</div>
          </div>
        </section>
      }

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>기사 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>카테고리</dt>
          <dd style={{ margin: 0 }}>{n.category_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>작성자</dt>
          <dd style={{ margin: 0 }}>{n.author_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>발행</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{n.published_at || '미발행'}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>최종 수정</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{n.updated_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>고정</dt>
          <dd style={{ margin: 0 }}>{n.is_pinned ? '예' : '아니오'}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {n.status === 'draft' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>publish</span>
              발행하기
            </button>
          }
          {n.status === 'published' && !n.is_pinned &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>push_pin</span>
              상단 고정
            </button>
          }
          {n.status === 'published' && n.is_pinned &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>keep_off</span>
              고정 해제
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute('postEdit')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            본문 수정
          </button>
          {n.status === 'published' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>archive</span>
              보관
            </button>
          }
          {n.status === 'archived' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>unarchive</span>
              보관 해제
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            기사 삭제
          </button>
        </div>
      </section>
    </div>);

}

window.AdminNews = AdminNews;
