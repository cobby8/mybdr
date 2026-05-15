/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminUsers.jsx — Admin-C 사용자 그룹 · 유저 관리 (v2.10)
//   진입: setRoute('adminUsers')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: 등급 배지 (VVIP/VIP/A/B/C/D/F) + 가입일 + 마지막 활동
// =====================================================================

const ADMIN_USERS_DATA = [
{
  user_id: 'u_2025_ohyeongjin',
  nickname: '오영진',
  email: 'oyj@example.com',
  phone: '010-****-1248',
  tier: 'VVIP',
  tier_tone: 'accent',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  region: '서울 마포',
  team_count: 2,
  game_count: 184,
  last_seen: '2026-05-15 11:42',
  joined_at: '2024-03-14',
  reports: 0
},
{
  user_id: 'u_2025_hanjiseok',
  nickname: '한지석',
  email: 'hjs@example.com',
  phone: '010-****-2901',
  tier: 'VIP',
  tier_tone: 'info',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  region: '서울 송파',
  team_count: 1,
  game_count: 142,
  last_seen: '2026-05-15 09:18',
  joined_at: '2023-11-08',
  reports: 0
},
{
  user_id: 'u_2025_kang_dohyun',
  nickname: '강도현',
  email: 'kdh@example.com',
  phone: '010-****-4011',
  tier: 'A',
  tier_tone: 'info',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  region: '서울 서초',
  team_count: 1,
  game_count: 96,
  last_seen: '2026-05-14 22:14',
  joined_at: '2024-05-21',
  reports: 0
},
{
  user_id: 'u_2026_seominji',
  nickname: '서민지',
  email: 'smj@example.com',
  phone: '010-****-5023',
  tier: 'B',
  tier_tone: 'mute',
  status: 'new',
  status_label: '신규',
  status_tone: 'warn',
  region: '서울 강남',
  team_count: 1,
  game_count: 3,
  last_seen: '2026-05-15 08:30',
  joined_at: '2026-05-08',
  reports: 0
},
{
  user_id: 'u_2026_parkhanul',
  nickname: '박하늘',
  email: 'phn@example.com',
  phone: '010-****-3322',
  tier: 'B',
  tier_tone: 'mute',
  status: 'new',
  status_label: '신규',
  status_tone: 'warn',
  region: '서울 강서',
  team_count: 1,
  game_count: 5,
  last_seen: '2026-05-13 19:55',
  joined_at: '2026-04-30',
  reports: 0
},
{
  user_id: 'u_2024_yoonjaeho',
  nickname: '윤재호',
  email: 'yjh@example.com',
  phone: '010-****-9120',
  tier: 'C',
  tier_tone: 'mute',
  status: 'dormant',
  status_label: '휴면',
  status_tone: 'mute',
  region: '서울 서초',
  team_count: 1,
  game_count: 24,
  last_seen: '2025-11-12 14:01',
  joined_at: '2023-06-30',
  reports: 0
},
{
  user_id: 'u_2024_chosanghyuk',
  nickname: '조상혁',
  email: 'csh@example.com',
  phone: '010-****-6677',
  tier: 'C',
  tier_tone: 'mute',
  status: 'dormant',
  status_label: '휴면',
  status_tone: 'mute',
  region: '경기 분당',
  team_count: 0,
  game_count: 18,
  last_seen: '2025-12-04 21:18',
  joined_at: '2024-01-10',
  reports: 0
},
{
  user_id: 'u_2025_bannedguy',
  nickname: 'thunderdunk',
  email: 'td@example.com',
  phone: '010-****-1111',
  tier: 'F',
  tier_tone: 'err',
  status: 'suspended',
  status_label: '정지',
  status_tone: 'err',
  region: '서울 광진',
  team_count: 0,
  game_count: 8,
  last_seen: '2026-04-22 02:11',
  joined_at: '2024-09-04',
  reports: 4
},
{
  user_id: 'u_2025_trashtalk',
  nickname: 'no_chill',
  email: 'nc@example.com',
  phone: '010-****-2222',
  tier: 'D',
  tier_tone: 'err',
  status: 'suspended',
  status_label: '정지',
  status_tone: 'err',
  region: '서울 영등포',
  team_count: 0,
  game_count: 12,
  last_seen: '2026-05-02 23:48',
  joined_at: '2024-08-19',
  reports: 2
}];

window.ADMIN_USERS_DATA = ADMIN_USERS_DATA;

function usersStatusTab(u) {
  return u.status;
}

// =====================================================================
function AdminUsers({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [tierFilter, setTierFilter] = React.useState('all');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'last_seen', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_USERS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => usersStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.nickname.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.user_id.toLowerCase().includes(q));
    }
    if (tierFilter !== 'all') rows = rows.filter((r) => r.tier === tierFilter);
    if (regionFilter !== 'all') rows = rows.filter((r) => r.region === regionFilter);
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
  }, [statusTab, search, tierFilter, regionFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_USERS_DATA;
    const by = (k) => base.filter((r) => usersStatusTab(r) === k).length;
    return {
      all: base.length,
      active: by('active'),
      new: by('new'),
      dormant: by('dormant'),
      suspended: by('suspended')
    };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const tiers = ['all', ...new Set(ADMIN_USERS_DATA.map((r) => r.tier))];
  const regions = ['all', ...new Set(ADMIN_USERS_DATA.map((r) => r.region))];

  const initials = (s) => s.replace(/[^A-Za-z가-힣]/g, '').slice(0, 2).toUpperCase();

  const columns = [
  { key: 'nickname', label: '유저', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 50, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', flexShrink: 0 }}>
          {initials(r.nickname)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nickname}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</span>
        </div>
      </div>
  },
  { key: 'tier', label: '등급', sortable: true, width: 70,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.tier_tone}>{r.tier}</span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'region', label: '지역', sortable: true, width: 110,
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.region}</span>
  },
  { key: 'game_count', label: '경기', sortable: true, width: 70, align: 'right',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--ink)' }}>{r.game_count}</span>
  },
  { key: 'reports', label: '신고', sortable: true, width: 60, align: 'right',
    render: (r) =>
    r.reports > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, fontWeight: 700, color: 'var(--err)' }}>{r.reports}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'last_seen', label: '최근 활동', sortable: true, width: 130,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{r.last_seen.split(' ')[0]}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{r.last_seen.split(' ')[1]}</span>
      </div>
  },
  { key: 'joined_at', label: '가입', sortable: true, width: 100,
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>{r.joined_at}</span>
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
      route="adminUsers"
      setRoute={setRoute}
      eyebrow="ADMIN · 사용자"
      title="유저 관리"
      subtitle="전체 유저의 상태·등급·활동을 관리하고 신고 누적 계정에 조치합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '사용자' },
      { label: '유저 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('adminGameReports')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>report</span>
            신고 검토로
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'active', label: '활성', count: counts.active },
        { key: 'new', label: '신규', count: counts.new },
        { key: 'dormant', label: '휴면', count: counts.dormant },
        { key: 'suspended', label: '정지', count: counts.suspended }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '닉네임 · 이메일 · ID 검색' }}
        filters={[
        { key: 'tier', label: '등급', value: tierFilter, onChange: (v) => { setTierFilter(v); setPage(1); },
          options: tiers.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) },
        { key: 'region', label: '지역', value: regionFilter, onChange: (v) => { setRegionFilter(v); setPage(1); },
          options: regions.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setTierFilter('all'); setRegionFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}명 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>mail</span>
              메시지
            </button>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>upgrade</span>
              등급 변경
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--err)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>block</span>
              정지
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="user_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 유저가 없어요' : '조건에 맞는 유저가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '신규 가입자가 등록되면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setTierFilter('all'); setRegionFilter('all'); setStatusTab('all'); }
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
        title={openDetail ? openDetail.nickname : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn" onClick={() => setRoute('playerProfile')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              프로필 보기
            </button>
            {openDetail?.reports > 0 &&
            <button type="button" className="btn btn--primary" onClick={() => setRoute('adminGameReports')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>report</span>
                신고 보기 ({openDetail.reports})
              </button>
            }
          </>
        }>

        {openDetail && <UserDetailPanel u={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function UserDetailPanel({ u, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={u.status_tone}>{u.status_label}</span>
        <span className="admin-stat-pill" data-tone={u.tier_tone}>{u.tier}</span>
        {u.reports > 0 &&
        <span className="admin-stat-pill" data-tone="err">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>report</span>
            신고 {u.reports}
          </span>
        }
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{u.user_id}</span>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>경기수</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{u.game_count}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>소속 팀</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{u.team_count}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>신고</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: u.reports > 0 ? 'var(--err)' : 'inherit', marginTop: 4 }}>{u.reports}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>계정 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>이메일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{u.email}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>연락처</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{u.phone}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>지역</dt>
          <dd style={{ margin: 0 }}>{u.region}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>가입일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{u.joined_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>최근 활동</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{u.last_seen}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail</span>
            메시지 보내기
          </button>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upgrade</span>
            등급 변경
          </button>
          {u.status === 'active' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--err)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
              계정 정지
            </button>
          }
          {u.status === 'suspended' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock_open</span>
              정지 해제
            </button>
          }
          {u.status === 'dormant' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              휴면 해제
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminUsers = AdminUsers;
