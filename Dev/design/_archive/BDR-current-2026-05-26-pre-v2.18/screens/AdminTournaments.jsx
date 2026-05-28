/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal, AdminEmptyState */

// =====================================================================
// AdminTournaments.jsx — Admin-B 콘텐츠 그룹 · 대회 관리 prototype
//   진입: setRoute('adminTournaments')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 "데이터 로드 실패" EmptyState
//
// 본 페이지 = Admin-B 5 페이지 패턴 검증 prototype.
// 신규 컴포넌트 AdminDataTable / AdminFilterBar 동작 검증 + 4 상태군 박제.
//
// 데이터 정책 (snake_case):
//   tournament_id / series_name / status / division_count / applied_teams /
//   max_teams / event_date / registration_close / venue / created_by /
//   organization_name 등
// =====================================================================

// ----- mock data (snake_case) -----
const ADMIN_TOURNAMENTS_DATA = [
{
  tournament_id: 't_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  series_name: 'BDR 서머 오픈',
  organization_name: '서울 3x3 위원회',
  status: 'open',
  status_label: '접수중',
  status_tone: 'ok',
  event_date: '2026-08-15',
  registration_close: '2026-08-01',
  division_count: 4,
  applied_teams: 32,
  max_teams: 44,
  venue: '장충체육관',
  created_by: '김도훈',
  created_at: '2026-05-12'
},
{
  tournament_id: 't_2026_challenge_8',
  name: 'BDR 챌린지 #8',
  series_name: 'BDR 챌린지',
  organization_name: '서울 3x3 위원회',
  status: 'live',
  status_label: '진행중',
  status_tone: 'info',
  event_date: '2026-05-15',
  registration_close: '2026-05-08',
  division_count: 6,
  applied_teams: 72,
  max_teams: 80,
  venue: '올림픽공원 K-아트홀',
  created_by: '이박재',
  created_at: '2026-04-02'
},
{
  tournament_id: 't_2026_rookie_3',
  name: '루키 컵 #3',
  series_name: '루키 컵',
  organization_name: '서울 3x3 위원회',
  status: 'open',
  status_label: '접수중',
  status_tone: 'ok',
  event_date: '2026-06-22',
  registration_close: '2026-06-10',
  division_count: 3,
  applied_teams: 12,
  max_teams: 28,
  venue: '서울 학생체육관',
  created_by: '정세훈',
  created_at: '2026-05-01'
},
{
  tournament_id: 't_2026_spring_open',
  name: 'BDR 스프링 오픈',
  series_name: null,
  organization_name: '강남 농구 클럽',
  status: 'done',
  status_label: '완료',
  status_tone: 'mute',
  event_date: '2026-04-12',
  registration_close: '2026-04-01',
  division_count: 2,
  applied_teams: 24,
  max_teams: 24,
  venue: '강남구민체육센터',
  created_by: '김도훈',
  created_at: '2026-02-18'
},
{
  tournament_id: 't_2026_challenge_7',
  name: 'BDR 챌린지 #7',
  series_name: 'BDR 챌린지',
  organization_name: '서울 3x3 위원회',
  status: 'done',
  status_label: '완료',
  status_tone: 'mute',
  event_date: '2025-11-02',
  registration_close: '2025-10-20',
  division_count: 6,
  applied_teams: 80,
  max_teams: 80,
  venue: '올림픽공원 K-아트홀',
  created_by: '이박재',
  created_at: '2025-09-15'
},
{
  tournament_id: 't_2026_friendly_1',
  name: '마포 친선 컵',
  series_name: null,
  organization_name: 'Run N Gun 동호회',
  status: 'review',
  status_label: '검토 대기',
  status_tone: 'warn',
  event_date: '2026-07-04',
  registration_close: '2026-06-25',
  division_count: 2,
  applied_teams: 0,
  max_teams: 16,
  venue: '마포구민체육센터',
  created_by: '오영진',
  created_at: '2026-05-14'
},
{
  tournament_id: 't_2026_winter_1',
  name: 'BDR 윈터 인비테이셔널',
  series_name: null,
  organization_name: '서울 3x3 위원회',
  status: 'archived',
  status_label: '보관',
  status_tone: 'mute',
  event_date: '2025-12-20',
  registration_close: '2025-12-10',
  division_count: 4,
  applied_teams: 18,
  max_teams: 32,
  venue: '잠실학생체육관',
  created_by: '김도훈',
  created_at: '2025-11-01'
},
{
  tournament_id: 't_2026_summer_3',
  name: 'BDR 서머 오픈 #3',
  series_name: 'BDR 서머 오픈',
  organization_name: '서울 3x3 위원회',
  status: 'done',
  status_label: '완료',
  status_tone: 'mute',
  event_date: '2025-08-17',
  registration_close: '2025-08-03',
  division_count: 4,
  applied_teams: 44,
  max_teams: 44,
  venue: '장충체육관',
  created_by: '김도훈',
  created_at: '2025-06-10'
}];

window.ADMIN_TOURNAMENTS_DATA = ADMIN_TOURNAMENTS_DATA;

// ----- helpers -----
function formatDate(d) {
  if (!d) return '—';
  return d;
}

function tournamentStatusTab(t) {
  if (t.status === 'review') return 'pending';
  if (t.status === 'open') return 'open';
  if (t.status === 'live') return 'live';
  if (t.status === 'done') return 'done';
  if (t.status === 'archived') return 'archived';
  return 'all';
}

// =====================================================================
function AdminTournaments({ setRoute, theme, setTheme }) {
  // mock 4 상태군 토글
  const [mockState, setMockState] = React.useState('filled'); // 'filled' | 'empty' | 'loading' | 'error'
  const [adminRole, setAdminRole] = React.useState('super_admin');

  // 필터 / 검색 / 정렬 / 페이징
  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [orgFilter, setOrgFilter] = React.useState('all');
  const [seriesFilter, setSeriesFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'event_date', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  // 필터링 + 정렬
  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_TOURNAMENTS_DATA.slice();
    if (statusTab !== 'all') {
      rows = rows.filter((r) => tournamentStatusTab(r) === statusTab);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.venue.toLowerCase().includes(q) ||
      r.organization_name.toLowerCase().includes(q));
    }
    if (orgFilter !== 'all') rows = rows.filter((r) => r.organization_name === orgFilter);
    if (seriesFilter !== 'all') {
      if (seriesFilter === '__none') rows = rows.filter((r) => !r.series_name);
      else rows = rows.filter((r) => r.series_name === seriesFilter);
    }
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
  }, [statusTab, search, orgFilter, seriesFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_TOURNAMENTS_DATA;
    const by = (k) => base.filter((r) => tournamentStatusTab(r) === k).length;
    return {
      all: base.length,
      open: by('open'),
      live: by('live'),
      pending: by('pending'),
      done: by('done'),
      archived: by('archived')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const orgs = ['all', ...new Set(ADMIN_TOURNAMENTS_DATA.map((r) => r.organization_name))];
  const seriesList = ['all', ...new Set(ADMIN_TOURNAMENTS_DATA.map((r) => r.series_name).filter(Boolean))];

  // columns
  const columns = [
  { key: 'name', label: '대회명', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          {r.series_name ? `${r.series_name} · ${r.organization_name}` : `1회성 · ${r.organization_name}`}
        </span>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 100,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>
        {r.status === 'live' && <span style={{ width: 6, height: 6, borderRadius: 50, background: 'currentColor' }}></span>}
        {r.status_label}
      </span>
  },
  { key: 'event_date', label: '대회 일자', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{formatDate(r.event_date)}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-dim)' }}>마감 {formatDate(r.registration_close)}</span>
      </div>
  },
  { key: 'venue', label: '장소', width: 140,
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.venue}</span>
  },
  { key: 'division_count', label: '종별', sortable: true, width: 60, align: 'center',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600 }}>{r.division_count}</span>
  },
  { key: 'applied_teams', label: '신청', sortable: true, width: 140,
    render: (r) => {
      const pct = r.max_teams > 0 ? r.applied_teams / r.max_teams * 100 : 0;
      const tone = pct >= 100 ? 'full' : pct >= 80 ? 'warn' : 'default';
      return (
        <div className="admin-progress">
          <div className="admin-progress__bar">
            <div className="admin-progress__fill" data-tone={tone} style={{ width: `${Math.min(100, pct)}%` }}></div>
          </div>
          <span className="admin-progress__label">{r.applied_teams}/{r.max_teams}</span>
        </div>);
    }
  },
  { key: 'created_by', label: '담당', width: 70,
    render: (r) =>
    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.created_by}</span>
  },
  { key: '_actions', label: '', width: 40,
    render: (r) =>
    <button
      type="button"
      className="admin-row-stop"
      onClick={(e) => { e.stopPropagation(); setOpenDetail(r); }}
      style={{
        background: 'transparent', border: 0, padding: 6, cursor: 'pointer',
        color: 'var(--ink-mute)', borderRadius: 4
      }}
      aria-label="상세">

        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_horiz</span>
      </button>
  }];


  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{
      padding: '4px 10px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 4,
      display: 'flex', gap: 6, alignItems: 'center',
      fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)'
    }}>
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
      route="adminTournaments"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="대회 관리"
      subtitle="등록된 대회를 검토하고 상태를 변경하거나 새 대회를 생성합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '대회 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button
          type="button"
          className="btn btn--primary"
          onClick={() => setRoute('adminWizardTournament')}>

            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 대회 만들기
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'open', label: '접수중', count: counts.open },
        { key: 'live', label: '진행중', count: counts.live },
        { key: 'pending', label: '검토 대기', count: counts.pending },
        { key: 'done', label: '완료', count: counts.done },
        { key: 'archived', label: '보관', count: counts.archived }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{
          value: search,
          onChange: (v) => { setSearch(v); setPage(1); },
          placeholder: '대회명 · 장소 · 단체 검색'
        }}
        filters={[
        {
          key: 'org', label: '단체', value: orgFilter,
          onChange: (v) => { setOrgFilter(v); setPage(1); },
          options: orgs.map((o) => ({ value: o, label: o === 'all' ? '전체' : o }))
        },
        {
          key: 'series', label: '시리즈', value: seriesFilter,
          onChange: (v) => { setSeriesFilter(v); setPage(1); },
          options: [
          { value: 'all', label: '전체' },
          { value: '__none', label: '1회성' },
          ...seriesList.filter((s) => s !== 'all').map((s) => ({ value: s, label: s }))]

        }]
        }
        onReset={() => { setSearch(''); setOrgFilter('all'); setSeriesFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={
        selected.length > 0 &&
        <>
              <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>
                {selected.length}개 선택
              </span>
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
        keyField="tournament_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 대회가 없어요' : '조건에 맞는 대회가 없어요'}
        emptyDesc={statusTab === 'all' && !search ?
        '새 대회 만들기 버튼으로 첫 대회를 등록하세요.' :
        '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 대회 만들기' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminWizardTournament');else
          { setSearch(''); setOrgFilter('all'); setSeriesFilter('all'); setStatusTab('all'); }
        }}
        sort={sort}
        onSortChange={setSort}
        selectable
        selected={selected}
        onSelectChange={setSelected}
        onRowClick={(r) => setOpenDetail(r)}
        pagination={{
          page,
          total: filtered.length,
          perPage,
          onChange: setPage
        }} />


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
            <button type="button" className="btn btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              대회 페이지
            </button>
          </>
        }>

        {openDetail &&
        <TournamentDetailPanel t={openDetail} setRoute={setRoute} />
        }
      </AdminDetailModal>
    </AdminShell>);

}

function TournamentDetailPanel({ t, setRoute }) {
  const pct = t.max_teams > 0 ? t.applied_teams / t.max_teams * 100 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="admin-stat-pill" data-tone={t.status_tone}>{t.status_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{t.tournament_id}</span>
      </div>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>기본 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>시리즈</dt>
          <dd style={{ margin: 0 }}>{t.series_name || '1회성'}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>단체</dt>
          <dd style={{ margin: 0 }}>{t.organization_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>대회 일자</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{t.event_date}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>신청 마감</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{t.registration_close}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>장소</dt>
          <dd style={{ margin: 0 }}>{t.venue}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>담당</dt>
          <dd style={{ margin: 0 }}>{t.created_by}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>신청 현황</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)',
            alignItems: 'baseline'
          }}>
            <span>{t.applied_teams} <span style={{ color: 'var(--ink-mute)', fontSize: 14 }}>/ {t.max_teams}팀</span></span>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>{Math.round(pct)}%</span>
          </div>
          <div className="admin-progress">
            <div className="admin-progress__bar">
              <div className="admin-progress__fill" data-tone={pct >= 100 ? 'full' : pct >= 80 ? 'warn' : ''} style={{ width: `${Math.min(100, pct)}%` }}></div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{t.division_count}종별 · 평균 {Math.round(t.applied_teams / t.division_count)}팀/종별</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {t.status === 'review' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              승인하고 접수 시작
            </button>
          }
          {(t.status === 'open' || t.status === 'live') &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
              신청 마감 변경
            </button>
          }
          <button
            type="button"
            className="btn"
            onClick={() => setRoute('adminWizardTournament')}
            style={{ justifyContent: 'flex-start' }}>

            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            대회 정보 수정
          </button>
          {t.status !== 'archived' && t.status !== 'done' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>archive</span>
              보관
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
            삭제 (되돌릴 수 없음)
          </button>
        </div>
      </section>

      <div style={{
        padding: 10, background: 'var(--bg-alt)', borderRadius: 6,
        fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.55
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: '-3px', marginRight: 4 }}>info</span>
        Phase B 의뢰 박제 prototype — 5~6 탭 (개요 / 종별 / 신청 / 일정 / 정산 / 활동 로그) 으로 확장 예정.
      </div>
    </div>);

}

window.AdminTournaments = AdminTournaments;
