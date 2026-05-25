/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminTeams.jsx — Admin-B 콘텐츠 그룹 · 팀 관리 (v2.9)
//   진입: setRoute('adminTeams')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: 멤버 칩 / 레이팅 / 활동 점수 게이지
// =====================================================================

const ADMIN_TEAMS_DATA = [
{
  team_id: 'tm_run_n_gun',
  name: 'Run N Gun',
  region: '서울 마포',
  organization_name: 'Run N Gun 동호회',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  member_count: 12,
  captain_name: '오영진',
  avg_rating: 1842,
  activity_score: 92,
  recent_games: 14,
  win_rate: 0.71,
  registered_at: '2024-03-14'
},
{
  team_id: 'tm_streetballers',
  name: 'Streetballers',
  region: '서울 강서',
  organization_name: '서울 3x3 위원회',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  member_count: 9,
  captain_name: '박하늘',
  avg_rating: 1755,
  activity_score: 86,
  recent_games: 11,
  win_rate: 0.55,
  registered_at: '2024-07-02'
},
{
  team_id: 'tm_jamsil_bc',
  name: '잠실 BC',
  region: '서울 송파',
  organization_name: '서울 3x3 위원회',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  member_count: 15,
  captain_name: '한지석',
  avg_rating: 1798,
  activity_score: 88,
  recent_games: 16,
  win_rate: 0.63,
  registered_at: '2023-11-08'
},
{
  team_id: 'tm_kangnam_wings',
  name: '강남 윙스',
  region: '서울 강남',
  organization_name: '강남 농구 클럽',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  member_count: 11,
  captain_name: '서민지',
  avg_rating: 1690,
  activity_score: 74,
  recent_games: 9,
  win_rate: 0.44,
  registered_at: '2024-05-21'
},
{
  team_id: 'tm_omega',
  name: 'OMEGA',
  region: '서울 서초',
  organization_name: null,
  status: 'dormant',
  status_label: '휴면',
  status_tone: 'mute',
  member_count: 6,
  captain_name: '윤재호',
  avg_rating: 1612,
  activity_score: 31,
  recent_games: 2,
  win_rate: 0.5,
  registered_at: '2023-06-30'
},
{
  team_id: 'tm_seocho_colossus',
  name: '서초 콜로서스',
  region: '서울 서초',
  organization_name: '서울 3x3 위원회',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  member_count: 13,
  captain_name: '강도현',
  avg_rating: 1721,
  activity_score: 81,
  recent_games: 12,
  win_rate: 0.58,
  registered_at: '2024-01-09'
},
{
  team_id: 'tm_sinchon_lions',
  name: '신촌 라이온스',
  region: '서울 서대문',
  organization_name: '서울 3x3 위원회',
  status: 'new',
  status_label: '신규',
  status_tone: 'info',
  member_count: 8,
  captain_name: '이수아',
  avg_rating: 1580,
  activity_score: 64,
  recent_games: 5,
  win_rate: 0.6,
  registered_at: '2026-04-12'
},
{
  team_id: 'tm_mapo_passers',
  name: '마포 패서스',
  region: '서울 마포',
  organization_name: null,
  status: 'new',
  status_label: '신규',
  status_tone: 'info',
  member_count: 7,
  captain_name: '김유라',
  avg_rating: 1545,
  activity_score: 58,
  recent_games: 4,
  win_rate: 0.5,
  registered_at: '2026-05-02'
},
{
  team_id: 'tm_gwangjin_hawks',
  name: '광진 호크스',
  region: '서울 광진',
  organization_name: null,
  status: 'suspended',
  status_label: '정지',
  status_tone: 'err',
  member_count: 10,
  captain_name: '정태우',
  avg_rating: 1670,
  activity_score: 22,
  recent_games: 1,
  win_rate: 0.0,
  registered_at: '2024-09-18'
}];

window.ADMIN_TEAMS_DATA = ADMIN_TEAMS_DATA;

function teamStatusTab(t) {
  return t.status; // active / dormant / new / suspended
}

function ratingTone(r) {
  if (r >= 1800) return 'ok';
  if (r >= 1700) return 'info';
  if (r >= 1600) return 'mute';
  return 'warn';
}

// =====================================================================
function AdminTeams({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [orgFilter, setOrgFilter] = React.useState('all');
  const [ratingFilter, setRatingFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'avg_rating', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_TEAMS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => teamStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.captain_name.toLowerCase().includes(q));
    }
    if (regionFilter !== 'all') rows = rows.filter((r) => r.region === regionFilter);
    if (orgFilter !== 'all') {
      if (orgFilter === '__none') rows = rows.filter((r) => !r.organization_name);
      else rows = rows.filter((r) => r.organization_name === orgFilter);
    }
    if (ratingFilter !== 'all') {
      if (ratingFilter === '1800+') rows = rows.filter((r) => r.avg_rating >= 1800);
      else if (ratingFilter === '1700-1799') rows = rows.filter((r) => r.avg_rating >= 1700 && r.avg_rating < 1800);
      else if (ratingFilter === '1600-1699') rows = rows.filter((r) => r.avg_rating >= 1600 && r.avg_rating < 1700);
      else if (ratingFilter === '<1600') rows = rows.filter((r) => r.avg_rating < 1600);
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
  }, [statusTab, search, regionFilter, orgFilter, ratingFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_TEAMS_DATA;
    const by = (k) => base.filter((r) => teamStatusTab(r) === k).length;
    return {
      all: base.length,
      active: by('active'),
      new: by('new'),
      dormant: by('dormant'),
      suspended: by('suspended')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const regions = ['all', ...new Set(ADMIN_TEAMS_DATA.map((r) => r.region))];
  const orgs = ['all', '__none', ...new Set(ADMIN_TEAMS_DATA.map((r) => r.organization_name).filter(Boolean))];

  const columns = [
  { key: 'name', label: '팀명', sortable: true, width: '22%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: 'var(--cafe-blue)', color: '#fff',
        display: 'grid', placeItems: 'center',
        fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: 12,
        flex: '0 0 auto'
      }}>
          {r.name.slice(0, 2)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
            {r.organization_name || '무소속'} · 주장 {r.captain_name}
          </span>
        </div>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'region', label: '지역', sortable: true, width: 100,
    render: (r) => <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.region}</span>
  },
  { key: 'member_count', label: '멤버', sortable: true, width: 60, align: 'center',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600 }}>{r.member_count}</span>
  },
  { key: 'avg_rating', label: '레이팅', sortable: true, width: 90,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.avg_rating}</span>
        <span className="admin-stat-pill" data-tone={ratingTone(r.avg_rating)} style={{ fontSize: 10, padding: '1px 6px' }}>
          {r.avg_rating >= 1800 ? 'A' : r.avg_rating >= 1700 ? 'B' : r.avg_rating >= 1600 ? 'C' : 'D'}
        </span>
      </div>
  },
  { key: 'activity_score', label: '활동', sortable: true, width: 110,
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
      route="adminTeams"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="팀 관리"
      subtitle="등록된 팀의 멤버 / 레이팅 / 활동 점수를 검토하고 정지·해제를 처리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '팀 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('createTeam')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            팀 추가
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
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '팀명 · 지역 · 주장 검색' }}
        filters={[
        { key: 'region', label: '지역', value: regionFilter, onChange: (v) => { setRegionFilter(v); setPage(1); },
          options: regions.map((o) => ({ value: o, label: o === 'all' ? '전체 지역' : o })) },
        { key: 'org', label: '단체', value: orgFilter, onChange: (v) => { setOrgFilter(v); setPage(1); },
          options: orgs.map((o) => ({ value: o, label: o === 'all' ? '전체' : o === '__none' ? '무소속' : o })) },
        { key: 'rating', label: '레이팅', value: ratingFilter, onChange: (v) => { setRatingFilter(v); setPage(1); },
          options: [
          { value: 'all', label: '전체' },
          { value: '1800+', label: '1800+' },
          { value: '1700-1799', label: '1700–1799' },
          { value: '1600-1699', label: '1600–1699' },
          { value: '<1600', label: '<1600' }] }]

        }
        onReset={() => { setSearch(''); setRegionFilter('all'); setOrgFilter('all'); setRatingFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}개 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pause</span>
              정지
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
        keyField="team_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 팀이 없어요' : '조건에 맞는 팀이 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 팀 추가 버튼으로 첫 팀을 등록하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '팀 추가' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('createTeam');
          else { setSearch(''); setRegionFilter('all'); setOrgFilter('all'); setRatingFilter('all'); setStatusTab('all'); }
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
            <button type="button" className="btn btn--primary" onClick={() => setRoute('teamDetail')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              팀 페이지
            </button>
          </>
        }>

        {openDetail && <TeamDetailPanel t={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function TeamDetailPanel({ t, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="admin-stat-pill" data-tone={t.status_tone}>{t.status_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{t.team_id}</span>
      </div>

      {/* 핵심 지표 3개 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>레이팅</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{t.avg_rating}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>승률</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>
            {Math.round(t.win_rate * 100)}<span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>%</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>경기 (30일)</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{t.recent_games}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>기본 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>지역</dt>
          <dd style={{ margin: 0 }}>{t.region}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>소속 단체</dt>
          <dd style={{ margin: 0 }}>{t.organization_name || '무소속'}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>주장</dt>
          <dd style={{ margin: 0 }}>{t.captain_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>멤버</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{t.member_count}명</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>등록</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{t.registered_at}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>활동 점수</div>
        <div className="admin-progress" style={{ marginBottom: 4 }}>
          <div className="admin-progress__bar" style={{ height: 8 }}>
            <div className="admin-progress__fill" data-tone={t.activity_score >= 80 ? '' : t.activity_score >= 50 ? 'warn' : 'full'} style={{ width: `${t.activity_score}%`, height: '100%' }}></div>
          </div>
          <span className="admin-progress__label" style={{ fontWeight: 700, fontSize: 13 }}>{t.activity_score}</span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>최근 30일 경기 수 + 신청률 + 리뷰 가중치</div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {t.status === 'suspended' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
              정지 해제
            </button>
          }
          {t.status === 'new' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              팀 승인
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute('teamManage')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
            멤버 관리
          </button>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            팀 정보 수정
          </button>
          {t.status !== 'suspended' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pause</span>
              팀 정지
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminTeams = AdminTeams;
