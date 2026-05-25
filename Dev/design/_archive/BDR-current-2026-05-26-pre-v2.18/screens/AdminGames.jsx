/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminGames.jsx — Admin-B 콘텐츠 그룹 · 경기 관리 (v2.9)
//   진입: setRoute('adminGames')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype (Phase B-1) 재사용
// 차별화: live tab 점멸 dot / 점수 라이브 표시 / 코트·시간 강조
// =====================================================================

// ----- mock data (snake_case) -----
const ADMIN_GAMES_DATA = [
{
  game_id: 'g_2026_0515_kart_a',
  name: 'BDR 챌린지 #8 · 8강 A',
  tournament_name: 'BDR 챌린지 #8',
  organization_name: '서울 3x3 위원회',
  division: '남자 오픈',
  status: 'live',
  status_label: '진행중',
  status_tone: 'info',
  scheduled_at: '2026-05-15 14:00',
  court: '올림픽공원 K-아트홀 1',
  team_a: 'Run N Gun',
  team_b: '한강 어택',
  score_a: 14,
  score_b: 11,
  period: 'Q2 · 06:42',
  host_name: '이박재',
  referee_count: 2
},
{
  game_id: 'g_2026_0515_kart_b',
  name: 'BDR 챌린지 #8 · 8강 B',
  tournament_name: 'BDR 챌린지 #8',
  organization_name: '서울 3x3 위원회',
  division: '남자 오픈',
  status: 'live',
  status_label: '진행중',
  status_tone: 'info',
  scheduled_at: '2026-05-15 14:00',
  court: '올림픽공원 K-아트홀 2',
  team_a: 'Streetballers',
  team_b: '잠실 BC',
  score_a: 7,
  score_b: 9,
  period: 'Q1 · 03:18',
  host_name: '이박재',
  referee_count: 2
},
{
  game_id: 'g_2026_0515_kart_c',
  name: 'BDR 챌린지 #8 · 8강 C',
  tournament_name: 'BDR 챌린지 #8',
  organization_name: '서울 3x3 위원회',
  division: '여자 오픈',
  status: 'scheduled',
  status_label: '예정',
  status_tone: 'ok',
  scheduled_at: '2026-05-15 15:30',
  court: '올림픽공원 K-아트홀 1',
  team_a: '강남 윙스',
  team_b: '마포 패서스',
  score_a: null,
  score_b: null,
  period: null,
  host_name: '이박재',
  referee_count: 2
},
{
  game_id: 'g_2026_0816_ja_a',
  name: 'BDR 서머 오픈 #4 · 예선 A',
  tournament_name: 'BDR 서머 오픈 #4',
  organization_name: '서울 3x3 위원회',
  division: '남자 오픈',
  status: 'scheduled',
  status_label: '예정',
  status_tone: 'ok',
  scheduled_at: '2026-08-15 10:00',
  court: '장충체육관 A',
  team_a: 'TBD',
  team_b: 'TBD',
  score_a: null,
  score_b: null,
  period: null,
  host_name: '김도훈',
  referee_count: 2
},
{
  game_id: 'g_2026_0511_done',
  name: '루키 컵 #3 · 결승',
  tournament_name: '루키 컵 #3',
  organization_name: '서울 3x3 위원회',
  division: 'U18',
  status: 'done',
  status_label: '완료',
  status_tone: 'mute',
  scheduled_at: '2026-05-11 16:00',
  court: '서울 학생체육관',
  team_a: '신촌 라이온스',
  team_b: '광진 호크스',
  score_a: 21,
  score_b: 18,
  period: '종료',
  host_name: '정세훈',
  referee_count: 2
},
{
  game_id: 'g_2026_0510_done',
  name: '루키 컵 #3 · 준결승 A',
  tournament_name: '루키 컵 #3',
  organization_name: '서울 3x3 위원회',
  division: 'U18',
  status: 'done',
  status_label: '완료',
  status_tone: 'mute',
  scheduled_at: '2026-05-10 14:00',
  court: '서울 학생체육관',
  team_a: '신촌 라이온스',
  team_b: '서초 콜로서스',
  score_a: 21,
  score_b: 15,
  period: '종료',
  host_name: '정세훈',
  referee_count: 2
},
{
  game_id: 'g_2026_0410_cancel',
  name: 'BDR 스프링 오픈 · 예선 C',
  tournament_name: 'BDR 스프링 오픈',
  organization_name: '강남 농구 클럽',
  division: '남자 오픈',
  status: 'cancelled',
  status_label: '취소',
  status_tone: 'err',
  scheduled_at: '2026-04-12 11:00',
  court: '강남구민체육센터',
  team_a: 'OMEGA',
  team_b: 'Run N Gun',
  score_a: null,
  score_b: null,
  period: '우천 취소',
  host_name: '김도훈',
  referee_count: 0
},
{
  game_id: 'g_2026_0816_jc_d',
  name: 'BDR 서머 오픈 #4 · 예선 D',
  tournament_name: 'BDR 서머 오픈 #4',
  organization_name: '서울 3x3 위원회',
  division: '여자 오픈',
  status: 'scheduled',
  status_label: '예정',
  status_tone: 'ok',
  scheduled_at: '2026-08-15 11:30',
  court: '장충체육관 B',
  team_a: 'TBD',
  team_b: 'TBD',
  score_a: null,
  score_b: null,
  period: null,
  host_name: '김도훈',
  referee_count: 2
}];

window.ADMIN_GAMES_DATA = ADMIN_GAMES_DATA;

function gameStatusTab(g) {
  if (g.status === 'live') return 'live';
  if (g.status === 'scheduled') return 'scheduled';
  if (g.status === 'done') return 'done';
  if (g.status === 'cancelled') return 'cancelled';
  return 'all';
}

// =====================================================================
function AdminGames({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [courtFilter, setCourtFilter] = React.useState('all');
  const [divFilter, setDivFilter] = React.useState('all');
  const [orgFilter, setOrgFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'scheduled_at', dir: 'asc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_GAMES_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => gameStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.court.toLowerCase().includes(q) ||
      r.team_a.toLowerCase().includes(q) ||
      r.team_b.toLowerCase().includes(q));
    }
    if (courtFilter !== 'all') rows = rows.filter((r) => r.court === courtFilter);
    if (divFilter !== 'all') rows = rows.filter((r) => r.division === divFilter);
    if (orgFilter !== 'all') rows = rows.filter((r) => r.organization_name === orgFilter);
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
  }, [statusTab, search, courtFilter, divFilter, orgFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_GAMES_DATA;
    const by = (k) => base.filter((r) => gameStatusTab(r) === k).length;
    return {
      all: base.length,
      live: by('live'),
      scheduled: by('scheduled'),
      done: by('done'),
      cancelled: by('cancelled')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const courts = ['all', ...new Set(ADMIN_GAMES_DATA.map((r) => r.court))];
  const divs = ['all', ...new Set(ADMIN_GAMES_DATA.map((r) => r.division))];
  const orgs = ['all', ...new Set(ADMIN_GAMES_DATA.map((r) => r.organization_name))];

  const columns = [
  { key: 'name', label: '경기명', sortable: true, width: '26%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>
          {r.tournament_name} · {r.division}
        </span>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 100,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>
        {r.status === 'live' &&
      <span style={{ width: 6, height: 6, borderRadius: 50, background: 'currentColor', animation: 'admin-pulse 1.4s ease-in-out infinite' }}></span>
      }
        {r.status_label}
      </span>
  },
  { key: 'scheduled_at', label: '일자 · 시각', sortable: true, width: 130,
    render: (r) => {
      const [d, t] = (r.scheduled_at || '').split(' ');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{d}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: r.status === 'live' ? 'var(--accent)' : 'var(--ink-soft)' }}>{t || '—'}</span>
        </div>);
    }
  },
  { key: 'court', label: '코트', width: 160,
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.court}</span>
  },
  { key: 'score', label: '점수', width: 140,
    render: (r) => {
      if (r.status === 'cancelled') {
        return <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{r.period || '취소'}</span>;
      }
      if (r.score_a == null) {
        return <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>대기</span>;
      }
      const aWin = r.score_a > r.score_b;
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 12.5, alignItems: 'baseline' }}>
            <span style={{ color: aWin ? 'var(--ink)' : 'var(--ink-mute)', fontWeight: aWin ? 600 : 400, maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team_a}</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: aWin ? 'var(--ink)' : 'var(--ink-mute)' }}>{r.score_a}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, fontSize: 12.5, alignItems: 'baseline' }}>
            <span style={{ color: !aWin ? 'var(--ink)' : 'var(--ink-mute)', fontWeight: !aWin ? 600 : 400, maxWidth: 86, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.team_b}</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: !aWin ? 'var(--ink)' : 'var(--ink-mute)' }}>{r.score_b}</span>
          </div>
          {r.status === 'live' && r.period &&
          <span style={{ fontSize: 10, fontFamily: 'var(--ff-mono)', color: 'var(--accent)' }}>{r.period}</span>
          }
        </div>);
    }
  },
  { key: 'host_name', label: '호스트', width: 70,
    render: (r) =>
    <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{r.host_name}</span>
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
      route="adminGames"
      setRoute={setRoute}
      eyebrow="ADMIN · 콘텐츠"
      title="경기 관리"
      subtitle="진행 중 / 예정 경기를 모니터링하고 점수판 · 라인업 · 심판 배정을 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '경기 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('createGame')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 경기 등록
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'live', label: '진행중', count: counts.live },
        { key: 'scheduled', label: '예정', count: counts.scheduled },
        { key: 'done', label: '완료', count: counts.done },
        { key: 'cancelled', label: '취소', count: counts.cancelled }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '경기명 · 코트 · 팀 검색' }}
        filters={[
        { key: 'court', label: '코트', value: courtFilter, onChange: (v) => { setCourtFilter(v); setPage(1); },
          options: courts.map((o) => ({ value: o, label: o === 'all' ? '전체 코트' : o })) },
        { key: 'div', label: '종별', value: divFilter, onChange: (v) => { setDivFilter(v); setPage(1); },
          options: divs.map((o) => ({ value: o, label: o === 'all' ? '전체 종별' : o })) },
        { key: 'org', label: '단체', value: orgFilter, onChange: (v) => { setOrgFilter(v); setPage(1); },
          options: orgs.map((o) => ({ value: o, label: o === 'all' ? '전체 단체' : o })) }]
        }
        onReset={() => { setSearch(''); setCourtFilter('all'); setDivFilter('all'); setOrgFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}개 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
              일정 변경
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>cancel</span>
              취소
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="game_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 경기가 없어요' : '조건에 맞는 경기가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '대회 마법사로 대회를 만들면 경기가 자동 생성됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대회 만들기' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminWizardTournament');
          else { setSearch(''); setCourtFilter('all'); setDivFilter('all'); setOrgFilter('all'); setStatusTab('all'); }
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
            {openDetail?.status === 'live' &&
            <button type="button" className="btn btn--primary" onClick={() => setRoute('liveResult')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_circle</span>
                점수판
              </button>
            }
            <button type="button" className="btn" onClick={() => setRoute('gameDetail')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              경기 페이지
            </button>
          </>
        }>

        {openDetail && <GameDetailPanel g={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function GameDetailPanel({ g, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span className="admin-stat-pill" data-tone={g.status_tone}>
          {g.status === 'live' && <span style={{ width: 6, height: 6, borderRadius: 50, background: 'currentColor' }}></span>}
          {g.status_label}
        </span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{g.game_id}</span>
      </div>

      {/* 점수 */}
      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{g.team_a}</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--ff-display)', lineHeight: 1, marginTop: 4 }}>
              {g.score_a ?? '—'}
            </div>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', textAlign: 'center', minWidth: 60 }}>
            <div style={{ fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>VS</div>
            {g.period && <div style={{ fontSize: 11, marginTop: 4, color: g.status === 'live' ? 'var(--accent)' : 'var(--ink-dim)' }}>{g.period}</div>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{g.team_b}</div>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: 'var(--ff-display)', lineHeight: 1, marginTop: 4 }}>
              {g.score_b ?? '—'}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>경기 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>대회</dt>
          <dd style={{ margin: 0 }}>{g.tournament_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>종별</dt>
          <dd style={{ margin: 0 }}>{g.division}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>일시</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{g.scheduled_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>코트</dt>
          <dd style={{ margin: 0 }}>{g.court}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>호스트</dt>
          <dd style={{ margin: 0 }}>{g.host_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>심판</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{g.referee_count}명 배정</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {g.status === 'live' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute('liveResult')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_circle</span>
              점수판 열기 (LIVE)
            </button>
          }
          {g.status === 'scheduled' &&
          <>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
                일정 변경
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_search</span>
                심판 배정
              </button>
            </>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute('gameEdit')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            경기 정보 수정
          </button>
          {g.status !== 'cancelled' && g.status !== 'done' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--danger)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
              경기 취소
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminGames = AdminGames;
