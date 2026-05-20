/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar */

// =====================================================================
// AdminTournamentTeams.jsx — Admin-E · 참가팀 관리 (v2.15 신규)
//   진입: setRoute('adminTournamentTeams')  (운영 /tournament-admin/tournaments/[id]/teams)
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: DataTable + 상태 탭 5 + 다중 선택 → bulk 승인/거절
//   상태: 대기(pending) / 승인(approved) / 거절(rejected) / 취소(withdrawn)
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx
// =====================================================================

const TT_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4', team_count: 38, team_max: 44 };

const TT_DATA = [
{ team_id: 't_001', name: '강남 윙스', captain: '김도훈', captain_phone: '010-1234-5678', members: 8, division: '오픈', applied_at: '2026-05-12 11:28', status: 'approved', status_label: '승인', status_tone: 'ok', fee_paid: true },
{ team_id: 't_002', name: '서초 라이저', captain: '오영진', captain_phone: '010-2345-6789', members: 7, division: '오픈', applied_at: '2026-05-11 19:14', status: 'approved', status_label: '승인', status_tone: 'ok', fee_paid: true },
{ team_id: 't_003', name: '한양 메디컬', captain: '이지원', captain_phone: '010-3456-7890', members: 6, division: 'U18', applied_at: '2026-05-13 22:00', status: 'pending', status_label: '대기', status_tone: 'warn', fee_paid: false },
{ team_id: 't_004', name: '용산 베어스', captain: '박찬호', captain_phone: '010-4567-8901', members: 8, division: '오픈', applied_at: '2026-05-14 09:30', status: 'pending', status_label: '대기', status_tone: 'warn', fee_paid: true },
{ team_id: 't_005', name: '신촌 ULSAN', captain: '최민수', captain_phone: '010-5678-9012', members: 5, division: 'U15', applied_at: '2026-05-10 14:55', status: 'approved', status_label: '승인', status_tone: 'ok', fee_paid: true },
{ team_id: 't_006', name: '잠실 토네이도', captain: '정재훈', captain_phone: '010-6789-0123', members: 8, division: '오픈', applied_at: '2026-05-09 20:18', status: 'rejected', status_label: '거절', status_tone: 'err', fee_paid: false, reject_reason: '대회 종별 부적합' },
{ team_id: 't_007', name: '관악 펠리컨', captain: '강승호', captain_phone: '010-7890-1234', members: 7, division: 'U18', applied_at: '2026-05-14 16:42', status: 'pending', status_label: '대기', status_tone: 'warn', fee_paid: true },
{ team_id: 't_008', name: '마포 호크스', captain: '윤성환', captain_phone: '010-8901-2345', members: 6, division: '오픈', applied_at: '2026-05-08 11:11', status: 'withdrawn', status_label: '취소', status_tone: 'mute', fee_paid: false },
{ team_id: 't_009', name: '성동 그리즐리', captain: '한지민', captain_phone: '010-9012-3456', members: 8, division: '오픈', applied_at: '2026-05-07 13:00', status: 'approved', status_label: '승인', status_tone: 'ok', fee_paid: true },
{ team_id: 't_010', name: '강동 샤크', captain: '서지혁', captain_phone: '010-0123-4567', members: 5, division: 'U15', applied_at: '2026-05-14 18:30', status: 'pending', status_label: '대기', status_tone: 'warn', fee_paid: true }];


function AdminTournamentTeams({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [divFilter, setDivFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'applied_at', dir: 'desc' });
  const [selected, setSelected] = React.useState(new Set());
  const [toast, setToast] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = TT_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.captain.includes(search));
    }
    if (divFilter !== 'all') rows = rows.filter((r) => r.division === divFilter);
    rows.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, divFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : TT_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return { all: base.length, pending: by('pending'), approved: by('approved'), rejected: by('rejected'), withdrawn: by('withdrawn') };
  }, [mockState]);

  const toggleSelect = (id) => {
    const n = new Set(selected);
    n.has(id) ? n.delete(id) : n.add(id);
    setSelected(n);
  };
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((r) => r.team_id)));
  };

  const showToast = (msg, tone = 'ok') => {
    setToast({ msg, tone });
    setTimeout(() => setToast(null), 2400);
  };

  const handleBulk = (action) => {
    if (selected.size === 0) return;
    const label = action === 'approve' ? '승인' : '거절';
    showToast(`${selected.size}팀 ${label} 처리되었습니다 (mock)`, action === 'approve' ? 'ok' : 'err');
    setSelected(new Set());
  };

  const columns = [
  { key: '_sel', label:
    <input type="checkbox" checked={filtered.length > 0 && selected.size === filtered.length}
      onChange={toggleAll} onClick={(e) => e.stopPropagation()} />,
    width: 36,
    render: (r) =>
    <input type="checkbox" checked={selected.has(r.team_id)}
      onChange={() => toggleSelect(r.team_id)} onClick={(e) => e.stopPropagation()} />
  },
  { key: 'name', label: '팀명', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)' }}>
          {r.name.charAt(0)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{r.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{r.members}명</span>
        </div>
      </div>
  },
  { key: 'division', label: '종별', sortable: true, width: 80,
    render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-soft)' }}>{r.division}</span> },
  { key: 'captain', label: '캡틴', width: 130,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{r.captain}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{r.captain_phone}</span>
      </div>
  },
  { key: 'applied_at', label: '신청', sortable: true, width: 110,
    render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-soft)' }}>{r.applied_at.slice(5)}</span> },
  { key: 'fee_paid', label: '참가비', width: 70,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.fee_paid ? 'ok' : 'mute'}>
        {r.fee_paid ? '완납' : '미납'}
      </span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
        <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
        {r.reject_reason && <span style={{ fontSize: 10, color: 'var(--err)' }}>{r.reject_reason}</span>}
      </div>
  },
  { key: '_a', label: '', width: 60, align: 'right',
    render: () => <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>chevron_right</span> }];


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
    <AdminShell route="adminTournamentTeams" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="참가팀 관리"
      subtitle={`${TT_TOURNAMENT.name} · ${TT_TOURNAMENT.team_count}/${TT_TOURNAMENT.team_max}팀`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TT_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '참가팀' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            팀 직접 추가
          </button>
        </>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: toast.tone === 'ok' ? 'var(--ok)' : 'var(--err)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast.msg}</span>
        </div>
      }

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'pending', label: '대기', count: counts.pending },
        { key: 'approved', label: '승인', count: counts.approved },
        { key: 'rejected', label: '거절', count: counts.rejected },
        { key: 'withdrawn', label: '취소', count: counts.withdrawn }]
        }
        current={statusTab} onChange={(k) => { setStatusTab(k); setSelected(new Set()); }} />


      {/* bulk action bar — 선택 있을 때만 */}
      {selected.size > 0 &&
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 4, padding: '10px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--accent)' }}>
            <span style={{ fontFamily: 'var(--ff-mono)' }}>{selected.size}</span>팀 선택됨
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn--sm" onClick={() => handleBulk('approve')}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>선택 승인
            </button>
            <button type="button" className="btn btn--sm" onClick={() => handleBulk('reject')}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>선택 거절
            </button>
            <button type="button" className="btn btn--sm" onClick={() => setSelected(new Set())}>해제</button>
          </div>
        </div>
      }

      <AdminFilterBar
        search={{ value: search, onChange: setSearch, placeholder: '팀명·캡틴 검색' }}
        filters={[
        { key: 'division', label: '종별', value: divFilter, onChange: setDivFilter,
          options: [
          { value: 'all', label: '전체' },
          { value: '오픈', label: '오픈' },
          { value: 'U18', label: 'U18' },
          { value: 'U15', label: 'U15' }] }]

        }
        onReset={() => { setSearch(''); setDivFilter('all'); setStatusTab('all'); }} />


      <AdminDataTable
        columns={columns}
        rows={filtered}
        keyField="team_id"
        state={mockState}
        emptyTitle="아직 신청한 팀이 없어요"
        emptyDesc="공개 후 신청을 받거나, 운영자가 팀을 직접 추가할 수 있습니다."
        emptyCtaLabel="팀 직접 추가"
        onEmptyCta={() => {}}
        sort={sort} onSortChange={setSort}
        onRowClick={() => {}} />

    </AdminShell>);

}

window.AdminTournamentTeams = AdminTournamentTeams;
