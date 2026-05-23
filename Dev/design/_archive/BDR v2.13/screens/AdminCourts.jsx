/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminCourts.jsx — Admin-B 콘텐츠 그룹 · 코트 관리 (v2.9)
//   진입: setRoute('adminCourts')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: 실내/실외 칩 / 시설 아이콘 / 평점 별
// =====================================================================

const ADMIN_COURTS_DATA = [
{
  court_id: 'ct_jangchung',
  name: '장충체육관',
  region: '서울 중구',
  type: 'indoor',
  type_label: '실내',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 4000,
  hourly_fee: 80000,
  rating: 4.7,
  review_count: 142,
  booking_count_30d: 28,
  facilities: ['샤워실', '주차', '관중석', '음수대'],
  registered_at: '2023-02-08'
},
{
  court_id: 'ct_kart_olympic',
  name: '올림픽공원 K-아트홀',
  region: '서울 송파',
  type: 'indoor',
  type_label: '실내',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 1200,
  hourly_fee: 60000,
  rating: 4.5,
  review_count: 88,
  booking_count_30d: 22,
  facilities: ['샤워실', '주차', '음수대'],
  registered_at: '2023-05-14'
},
{
  court_id: 'ct_student_gym',
  name: '서울 학생체육관',
  region: '서울 중구',
  type: 'indoor',
  type_label: '실내',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 600,
  hourly_fee: 35000,
  rating: 4.2,
  review_count: 56,
  booking_count_30d: 18,
  facilities: ['샤워실', '음수대'],
  registered_at: '2023-08-22'
},
{
  court_id: 'ct_kangnam_civic',
  name: '강남구민체육센터',
  region: '서울 강남',
  type: 'indoor',
  type_label: '실내',
  status: 'maintenance',
  status_label: '점검',
  status_tone: 'warn',
  capacity: 300,
  hourly_fee: 25000,
  rating: 4.0,
  review_count: 41,
  booking_count_30d: 4,
  facilities: ['샤워실', '주차'],
  registered_at: '2023-11-30'
},
{
  court_id: 'ct_mapo_civic',
  name: '마포구민체육센터',
  region: '서울 마포',
  type: 'indoor',
  type_label: '실내',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 250,
  hourly_fee: 22000,
  rating: 4.3,
  review_count: 33,
  booking_count_30d: 14,
  facilities: ['샤워실'],
  registered_at: '2024-01-12'
},
{
  court_id: 'ct_jamsil_student',
  name: '잠실학생체육관',
  region: '서울 송파',
  type: 'indoor',
  type_label: '실내',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 800,
  hourly_fee: 45000,
  rating: 4.4,
  review_count: 67,
  booking_count_30d: 16,
  facilities: ['샤워실', '주차', '관중석'],
  registered_at: '2023-09-04'
},
{
  court_id: 'ct_hangang_park',
  name: '한강공원 농구코트',
  region: '서울 영등포',
  type: 'outdoor',
  type_label: '실외',
  status: 'active',
  status_label: '운영중',
  status_tone: 'ok',
  capacity: 60,
  hourly_fee: 0,
  rating: 4.1,
  review_count: 124,
  booking_count_30d: 11,
  facilities: ['음수대'],
  registered_at: '2022-06-18'
},
{
  court_id: 'ct_seoul_forest',
  name: '서울숲 농구코트',
  region: '서울 성동',
  type: 'outdoor',
  type_label: '실외',
  status: 'pending',
  status_label: '등록 대기',
  status_tone: 'info',
  capacity: 40,
  hourly_fee: 0,
  rating: 0,
  review_count: 0,
  booking_count_30d: 0,
  facilities: ['음수대'],
  registered_at: '2026-05-10'
},
{
  court_id: 'ct_yangcheon_old',
  name: '양천구민체육관',
  region: '서울 양천',
  type: 'indoor',
  type_label: '실내',
  status: 'closed',
  status_label: '폐쇄',
  status_tone: 'err',
  capacity: 200,
  hourly_fee: 20000,
  rating: 3.5,
  review_count: 22,
  booking_count_30d: 0,
  facilities: ['샤워실'],
  registered_at: '2022-04-02'
}];

window.ADMIN_COURTS_DATA = ADMIN_COURTS_DATA;

function courtStatusTab(c) {
  return c.status; // active / maintenance / closed / pending
}

// =====================================================================
function AdminCourts({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [feeFilter, setFeeFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'booking_count_30d', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_COURTS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => courtStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q));
    }
    if (regionFilter !== 'all') rows = rows.filter((r) => r.region === regionFilter);
    if (typeFilter !== 'all') rows = rows.filter((r) => r.type === typeFilter);
    if (feeFilter === 'free') rows = rows.filter((r) => r.hourly_fee === 0);
    else if (feeFilter === 'paid') rows = rows.filter((r) => r.hourly_fee > 0);
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
  }, [statusTab, search, regionFilter, typeFilter, feeFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_COURTS_DATA;
    const by = (k) => base.filter((r) => courtStatusTab(r) === k).length;
    return {
      all: base.length,
      active: by('active'),
      maintenance: by('maintenance'),
      closed: by('closed'),
      pending: by('pending')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const regions = ['all', ...new Set(ADMIN_COURTS_DATA.map((r) => r.region))];

  const columns = [
  { key: 'name', label: '코트명', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: r.type === 'indoor' ? 'var(--cafe-blue)' : 'var(--accent)',
        color: '#fff',
        display: 'grid', placeItems: 'center',
        flex: '0 0 auto'
      }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{r.type === 'indoor' ? 'business' : 'park'}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            {r.region} · 수용 {r.capacity}석
          </span>
        </div>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 90,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'type', label: '타입', sortable: true, width: 70,
    render: (r) =>
    <span className="admin-stat-pill" data-tone="mute">{r.type_label}</span>
  },
  { key: 'hourly_fee', label: '사용료', sortable: true, width: 100,
    render: (r) =>
    r.hourly_fee === 0 ?
    <span className="admin-stat-pill" data-tone="ok" style={{ fontSize: 10 }}>무료</span> :

    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink)' }}>
          ₩{r.hourly_fee.toLocaleString()}<span style={{ color: 'var(--ink-dim)', fontSize: 10 }}>/시</span>
        </span>

  },
  { key: 'rating', label: '평점', sortable: true, width: 100,
    render: (r) => {
      if (r.review_count === 0) {
        return <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>;
      }
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }}>star</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 600, fontSize: 13 }}>{r.rating.toFixed(1)}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>({r.review_count})</span>
        </div>);
    }
  },
  { key: 'booking_count_30d', label: '예약(30일)', sortable: true, width: 100, align: 'center',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: r.booking_count_30d > 20 ? 'var(--accent)' : 'var(--ink)' }}>
        {r.booking_count_30d}
      </span>
  },
  { key: 'registered_at', label: '등록일', sortable: true, width: 100,
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink-mute)' }}>{r.registered_at}</span>
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
      route="adminCourts"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="코트 관리"
      subtitle="실내 / 실외 코트의 운영 상태 · 사용료 · 시설을 관리하고 등록 대기를 승인합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '코트 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('courtAdd')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            코트 등록
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'active', label: '운영중', count: counts.active },
        { key: 'maintenance', label: '점검', count: counts.maintenance },
        { key: 'closed', label: '폐쇄', count: counts.closed },
        { key: 'pending', label: '등록 대기', count: counts.pending }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '코트명 · 지역 검색' }}
        filters={[
        { key: 'region', label: '지역', value: regionFilter, onChange: (v) => { setRegionFilter(v); setPage(1); },
          options: regions.map((o) => ({ value: o, label: o === 'all' ? '전체 지역' : o })) },
        { key: 'type', label: '타입', value: typeFilter, onChange: (v) => { setTypeFilter(v); setPage(1); },
          options: [
          { value: 'all', label: '전체' },
          { value: 'indoor', label: '실내' },
          { value: 'outdoor', label: '실외' }] },

        { key: 'fee', label: '사용료', value: feeFilter, onChange: (v) => { setFeeFilter(v); setPage(1); },
          options: [
          { value: 'all', label: '전체' },
          { value: 'free', label: '무료' },
          { value: 'paid', label: '유료' }] }]

        }
        onReset={() => { setSearch(''); setRegionFilter('all'); setTypeFilter('all'); setFeeFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}개 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>build</span>
              점검 전환
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
        keyField="court_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 코트가 없어요' : '조건에 맞는 코트가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 코트 등록 버튼으로 첫 코트를 추가하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '코트 등록' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('courtAdd');
          else { setSearch(''); setRegionFilter('all'); setTypeFilter('all'); setFeeFilter('all'); setStatusTab('all'); }
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
        title={openDetail ? openDetail.name : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              수정
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setRoute('courtDetail')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              코트 페이지
            </button>
          </>
        }>

        {openDetail && <CourtDetailPanel c={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function CourtDetailPanel({ c, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="admin-stat-pill" data-tone={c.status_tone}>{c.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{c.type_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{c.court_id}</span>
      </div>

      {/* 핵심 지표 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>평점</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4, display: 'flex', alignItems: 'baseline', gap: 4 }}>
            {c.review_count > 0 ? c.rating.toFixed(1) : '—'}
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>({c.review_count})</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>예약(30일)</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{c.booking_count_30d}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>사용료</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>
            {c.hourly_fee === 0 ? '무료' : `₩${(c.hourly_fee / 1000).toFixed(0)}k`}
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>기본 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>지역</dt>
          <dd style={{ margin: 0 }}>{c.region}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>타입</dt>
          <dd style={{ margin: 0 }}>{c.type_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>수용</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{c.capacity.toLocaleString()}석</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>사용료</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>
            {c.hourly_fee === 0 ? '무료' : `₩${c.hourly_fee.toLocaleString()}/시간`}
          </dd>
          <dt style={{ color: 'var(--ink-mute)' }}>등록</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{c.registered_at}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>시설</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {c.facilities.map((f) =>
          <span key={f} className="admin-stat-pill" data-tone="mute" style={{ fontSize: 11 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
              {f}
            </span>
          )}
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {c.status === 'pending' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              등록 승인
            </button>
          }
          {c.status === 'maintenance' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
              점검 해제
            </button>
          }
          {c.status === 'active' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>build</span>
              점검 전환
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            코트 정보 수정
          </button>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
            예약 가능 시간 설정
          </button>
          {c.status !== 'closed' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
              폐쇄
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminCourts = AdminCourts;
