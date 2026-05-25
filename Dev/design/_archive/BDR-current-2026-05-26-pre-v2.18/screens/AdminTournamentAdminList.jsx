/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar */

// =====================================================================
// AdminTournamentAdminList.jsx — Admin-E · 본인 운영 대회 목록 (v2.14 신규)
//   진입: setRoute('adminTournamentAdminList')  (운영 /tournament-admin/tournaments)
//   복귀: setRoute('adminTournamentAdminHome')
//   에러: state='error' → DataTable EmptyState
//
// 패턴: AdminTournaments (admin 영역) 와 다름 — 본인이 운영하는 대회만 표시.
//   상태 탭: 전체 / 작성중 / 신청중 / 진행중 / 완료 / 보관
//   각 row 클릭 → AdminTournamentSetupHub 진입
// 운영 source: src/app/(admin)/tournament-admin/tournaments/page.tsx
// =====================================================================

const TAL_DATA = [
{
  tournament_id: 'tn_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  series: 'BDR 서머 오픈 시리즈',
  edition: 4,
  status: 'live', status_label: '진행중', status_tone: 'ok',
  apply_start: '2026-05-01', apply_end: '2026-05-25',
  starts_at: '2026-06-15', ends_at: '2026-06-22',
  team_count: 38, team_max: 44,
  is_published: true,
  divisions: 4
},
{
  tournament_id: 'tn_2026_challenge_8',
  name: 'BDR 챌린지 #8',
  series: 'BDR 챌린지 시리즈',
  edition: 8,
  status: 'live', status_label: '진행중', status_tone: 'ok',
  apply_start: '2026-04-10', apply_end: '2026-05-10',
  starts_at: '2026-06-22', ends_at: '2026-06-29',
  team_count: 24, team_max: 32,
  is_published: true,
  divisions: 3
},
{
  tournament_id: 'tn_2026_rookie_4',
  name: '루키 컵 #4',
  series: '루키 컵 시리즈',
  edition: 4,
  status: 'apply', status_label: '신청중', status_tone: 'warn',
  apply_start: '2026-06-01', apply_end: '2026-06-30',
  starts_at: '2026-07-10', ends_at: '2026-07-12',
  team_count: 12, team_max: 16,
  is_published: true,
  divisions: 2
},
{
  tournament_id: 'tn_2026_winter_3',
  name: '윈터 인비테이셔널 #3',
  series: '윈터 인비테이셔널',
  edition: 3,
  status: 'apply', status_label: '신청중', status_tone: 'warn',
  apply_start: '2026-11-01', apply_end: '2026-12-10',
  starts_at: '2026-12-20', ends_at: '2026-12-22',
  team_count: 6, team_max: 16,
  is_published: false,
  divisions: 2
},
{
  tournament_id: 'tn_2026_q3_open',
  name: 'Q3 오픈 (제목 미정)',
  series: null,
  edition: null,
  status: 'draft', status_label: '작성중', status_tone: 'info',
  apply_start: null, apply_end: null,
  starts_at: null, ends_at: null,
  team_count: 0, team_max: 32,
  is_published: false,
  divisions: 0
},
{
  tournament_id: 'tn_2026_rookie_3',
  name: '루키 컵 #3',
  series: '루키 컵 시리즈',
  edition: 3,
  status: 'done', status_label: '완료', status_tone: 'mute',
  apply_start: '2026-03-01', apply_end: '2026-04-10',
  starts_at: '2026-04-22', ends_at: '2026-04-24',
  team_count: 16, team_max: 16,
  is_published: true,
  divisions: 2
},
{
  tournament_id: 'tn_2026_spring_2',
  name: '스프링 오픈 #2',
  series: '스프링 오픈',
  edition: 2,
  status: 'done', status_label: '완료', status_tone: 'mute',
  apply_start: '2026-02-01', apply_end: '2026-03-15',
  starts_at: '2026-03-30', ends_at: '2026-04-01',
  team_count: 32, team_max: 32,
  is_published: true,
  divisions: 4
},
{
  tournament_id: 'tn_2025_winter_2',
  name: '윈터 인비테이셔널 #2',
  series: '윈터 인비테이셔널',
  edition: 2,
  status: 'archived', status_label: '보관', status_tone: 'mute',
  apply_start: '2025-11-01', apply_end: '2025-12-10',
  starts_at: '2025-12-20', ends_at: '2025-12-22',
  team_count: 16, team_max: 16,
  is_published: true,
  divisions: 2
}];

window.TAL_DATA = TAL_DATA;

function AdminTournamentAdminList({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [seriesFilter, setSeriesFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'starts_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = TAL_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      (r.series || '').toLowerCase().includes(q));
    }
    if (seriesFilter !== 'all') rows = rows.filter((r) => r.series === seriesFilter);
    rows.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, seriesFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : TAL_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return {
      all: base.length, draft: by('draft'), apply: by('apply'),
      live: by('live'), done: by('done'), archived: by('archived')
    };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const seriesOptions = ['all', ...new Set(TAL_DATA.filter((r) => r.series).map((r) => r.series))];

  const columns = [
  { key: 'name', label: '대회', sortable: true, width: '30%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          {!r.is_published &&
        <span className="admin-stat-pill" data-tone="mute" style={{ fontSize: 9.5 }}>비공개</span>
        }
        </div>
        {r.series ?
      <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{r.series} · #{r.edition}</span> :
      <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontStyle: 'italic' }}>시리즈 미연결</span>
      }
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'apply_end', label: '신청', sortable: true, width: 110,
    render: (r) =>
    r.apply_start ?
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink)' }}>{r.apply_start.slice(5)} ~ {r.apply_end.slice(5)}</span>
        </div> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'starts_at', label: '본선', sortable: true, width: 110,
    render: (r) =>
    r.starts_at ?
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink)' }}>{r.starts_at.slice(5)} ~ {r.ends_at.slice(5)}</span>
        </div> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'team_count', label: '참가팀', sortable: true, width: 100,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
          {r.team_count}<span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>/{r.team_max}</span>
        </span>
        <div style={{ height: 3, background: 'var(--bg-alt)', borderRadius: 2 }}>
          <div style={{ height: '100%', width: `${r.team_count / r.team_max * 100}%`, background: 'var(--accent)', borderRadius: 2 }} />
        </div>
      </div>
  },
  { key: 'divisions', label: '종별', sortable: true, width: 60, align: 'right',
    render: (r) =>
    r.divisions > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.divisions}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: '_actions', label: '', width: 90, align: 'right',
    render: () =>
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: 'var(--accent)', fontWeight: 600 }}>
        설정 hub
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>chevron_right</span>
      </span>
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
        <div className="admin-user__avatar">OY</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
          <span className="admin-user__role">tournament admin</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell
      route="adminTournamentAdminList"
      setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영"
      title="내 대회 목록"
      subtitle="내가 운영하는 모든 대회를 상태별로 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: '내 대회 목록' }]
      }
      actions={
      <button type="button" className="btn btn--primary" onClick={() => setRoute('adminTournamentNew')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
          새 대회 만들기
        </button>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'draft', label: '작성중', count: counts.draft },
        { key: 'apply', label: '신청중', count: counts.apply },
        { key: 'live', label: '진행중', count: counts.live },
        { key: 'done', label: '완료', count: counts.done },
        { key: 'archived', label: '보관', count: counts.archived }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '대회명·시리즈 검색' }}
        filters={[
        { key: 'series', label: '시리즈', value: seriesFilter, onChange: (v) => { setSeriesFilter(v); setPage(1); },
          options: seriesOptions.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setSeriesFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="tournament_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '운영 중인 대회가 없어요' : '조건에 맞는 대회가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 새 대회 만들기 버튼으로 첫 대회를 시작하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 대회 만들기' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminTournamentNew');
          else { setSearch(''); setSeriesFilter('all'); setStatusTab('all'); }
        }}
        sort={sort}
        onSortChange={setSort}
        onRowClick={() => setRoute('adminTournamentSetupHub')}
        pagination={{ page, total: filtered.length, perPage, onChange: setPage }} />

    </AdminShell>);

}

window.AdminTournamentAdminList = AdminTournamentAdminList;
