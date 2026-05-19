/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminTournamentAuditLog.jsx — Admin-B · 대회 감사 로그 (v2.13 신규)
//   진입: setRoute('adminTournamentAuditLog')  (AdminTournamentDetail audit sub-tab → 전체보기)
//   복귀: setRoute('adminTournamentDetail')
//   에러: state='error' → AdminDataTable EmptyState
//
// 운영 source: src/app/(admin)/admin/tournaments/[id]/audit-log/page.tsx
// 패턴: admin_logs 필터링 (resource_type='Tournament' & resource_id=...) DataTable
// 차별화: changes_made JSON 펼치기 / 시간순 정렬 default
// =====================================================================

const ADMIN_TAL_DATA = [
{
  log_id: 'lg_t_2026_05_14_112812',
  at: '2026-05-14 11:28:12',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'admin', actor_name: '김도훈',
  action: 'TOURNAMENT_PUBLISH',
  description: '대회를 공개로 전환했습니다.',
  changes_made: { is_published: { before: false, after: true } }
},
{
  log_id: 'lg_t_2026_05_12_094200',
  at: '2026-05-12 09:42:00',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'admin', actor_name: '오영진',
  action: 'DIVISION_ADD',
  description: '"D · 시니어" 종별을 추가했습니다.',
  changes_made: { divisions: { added: { id: 'd4', label: 'D · 시니어', format: '리그전', max_teams: 8 } } }
},
{
  log_id: 'lg_t_2026_05_10_180000',
  at: '2026-05-10 18:00:00',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'system', actor_name: '시스템',
  action: 'AUTO_APPROVE_TEAM',
  description: 'Run N Gun 팀이 자동 승인되었습니다 (auto_approve_teams=true).',
  changes_made: { team: { id: 'tm_run_n_gun', name: 'Run N Gun', status: 'approved' } }
},
{
  log_id: 'lg_t_2026_05_08_141802',
  at: '2026-05-08 14:18:02',
  severity: 'warn', severity_label: 'WARN', severity_tone: 'warn',
  actor_type: 'admin', actor_name: '오영진',
  action: 'APPLY_END_AT_CHANGE',
  description: '신청 마감일을 5/22 → 5/25 로 연장했습니다.',
  changes_made: { apply_end_at: { before: '2026-05-22 23:59', after: '2026-05-25 23:59' } }
},
{
  log_id: 'lg_t_2026_05_05_103212',
  at: '2026-05-05 10:32:12',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'admin', actor_name: '오영진',
  action: 'VENUE_SET',
  description: '경기장을 "강남 베이스코트" 로 지정했습니다.',
  changes_made: { venue_name: { before: null, after: '강남 베이스코트' } }
},
{
  log_id: 'lg_t_2026_05_03_184422',
  at: '2026-05-03 18:44:22',
  severity: 'error', severity_label: 'ERROR', severity_tone: 'err',
  actor_type: 'system', actor_name: '시스템',
  action: 'TEAM_APPLY_FAIL',
  description: '서초 콜로서스 팀 신청 처리 실패 (DB 락 타임아웃). 1분 후 재시도 성공.',
  changes_made: { team_id: 'tm_seocho_colossus', error: 'DB_LOCK_TIMEOUT', retry: 1 }
},
{
  log_id: 'lg_t_2026_05_01_000000',
  at: '2026-05-01 00:00:00',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'system', actor_name: '시스템',
  action: 'APPLY_OPEN',
  description: '신청 기간이 자동 시작되었습니다.',
  changes_made: null
},
{
  log_id: 'lg_t_2026_04_28_142200',
  at: '2026-04-28 14:22:00',
  severity: 'info', severity_label: 'INFO', severity_tone: 'info',
  actor_type: 'admin', actor_name: '김도훈',
  action: 'TOURNAMENT_CREATE',
  description: '대회를 생성했습니다.',
  changes_made: { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4', organizer: 'u_2025_ohyeongjin' }
}];

window.ADMIN_TAL_DATA = ADMIN_TAL_DATA;

const TAL_TOURNAMENT_NAME = 'BDR 서머 오픈 #4';
const TAL_TOURNAMENT_ID = 'tn_2026_summer_4';

function AdminTournamentAuditLog({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [actorFilter, setActorFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_TAL_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.severity === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.description.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.actor_name.toLowerCase().includes(q));
    }
    if (actorFilter !== 'all') rows = rows.filter((r) => r.actor_type === actorFilter);
    rows.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, actorFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_TAL_DATA;
    const by = (k) => base.filter((r) => r.severity === k).length;
    return { all: base.length, info: by('info'), warn: by('warn'), error: by('error') };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const columns = [
  { key: 'at', label: '시각', sortable: true, width: 160,
    render: (r) => {
      const [d, t] = r.at.split(' ');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{d}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{t}</span>
        </div>);

    }
  },
  { key: 'severity', label: '레벨', sortable: true, width: 70,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.severity_tone} style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, letterSpacing: '0.04em', fontSize: 10 }}>{r.severity_label}</span>
  },
  { key: 'action', label: '액션', sortable: true, width: 200,
    render: (r) =>
    <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--bg-alt)', padding: '2px 6px', borderRadius: 3 }}>{r.action}</code>
  },
  { key: 'actor_name', label: '주체', sortable: true, width: 100,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
          {r.actor_type === 'system' ? 'memory' : 'person'}
        </span>
        <span style={{ fontSize: 12.5, color: r.actor_type === 'system' ? 'var(--ink-mute)' : 'var(--ink)' }}>{r.actor_name}</span>
      </div>
  },
  { key: 'description', label: '설명', sortable: false, width: '36%',
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.description}</span>
  },
  { key: 'changes_made', label: '변경', sortable: false, width: 50, align: 'right',
    render: (r) =>
    r.changes_made ?
    <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }} title="diff 있음">diff</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
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
      route="adminTournamentAuditLog"
      setRoute={setRoute}
      eyebrow={`ADMIN · 대회 관리 > ${TAL_TOURNAMENT_NAME} > 감사 로그`}
      title="대회 감사 로그"
      subtitle={`${TAL_TOURNAMENT_NAME} 의 시간순 admin 활동 로그입니다.`}
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 관리', onClick: () => setRoute('adminTournaments') },
      { label: TAL_TOURNAMENT_NAME, onClick: () => setRoute('adminTournamentDetail') },
      { label: '감사 로그' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentDetail')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
            대회 상세로
          </button>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            JSON 내보내기
          </button>
        </>
      }>

      {/* 대상 대회 ID 배너 */}
      <div style={{ background: 'var(--bg-alt)', padding: '8px 12px', borderRadius: 4, marginBottom: 14, fontSize: 12, color: 'var(--ink-mute)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>filter_list</span>
        필터: <code style={{ fontFamily: 'var(--ff-mono)', color: 'var(--accent)' }}>resource_type=Tournament</code> &amp;
        <code style={{ fontFamily: 'var(--ff-mono)', color: 'var(--accent)' }}>resource_id={TAL_TOURNAMENT_ID}</code>
      </div>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'info', label: 'INFO', count: counts.info },
        { key: 'warn', label: 'WARN', count: counts.warn },
        { key: 'error', label: 'ERROR', count: counts.error }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '액션·설명·주체 검색' }}
        filters={[
        { key: 'actor', label: '주체', value: actorFilter, onChange: (v) => { setActorFilter(v); setPage(1); },
          options: [
          { value: 'all', label: '전체' },
          { value: 'admin', label: '운영자' },
          { value: 'system', label: '시스템' }] }]


        }
        onReset={() => { setSearch(''); setActorFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="log_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '감사 로그가 없어요' : '조건에 맞는 로그가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '이 대회에서 발생한 admin/시스템 액션이 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대회 상세로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminTournamentDetail');
          else { setSearch(''); setActorFilter('all'); setStatusTab('all'); }
        }}
        sort={sort}
        onSortChange={setSort}
        onRowClick={(r) => setOpenDetail(r)}
        pagination={{ page, total: filtered.length, perPage, onChange: setPage }} />


      <AdminDetailModal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title={openDetail ? openDetail.action : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>content_copy</span>
              로그 복사
            </button>
          </>
        }>

        {openDetail && <AuditDetailPanel l={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function AuditDetailPanel({ l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={l.severity_tone} style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, letterSpacing: '0.04em' }}>{l.severity_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{l.log_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>설명</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{l.description}</p>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>이벤트</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>액션</dt>
          <dd style={{ margin: 0 }}><code style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--accent)' }}>{l.action}</code></dd>
          <dt style={{ color: 'var(--ink-mute)' }}>시각</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{l.at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>주체</dt>
          <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
              {l.actor_type === 'system' ? 'memory' : 'person'}
            </span>
            {l.actor_name}
          </dd>
        </dl>
      </section>

      {l.changes_made &&
      <section>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>변경 내역 (changes_made)</div>
          <pre style={{ margin: 0, padding: 12, background: 'var(--bg-alt)', borderRadius: 4, fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink-soft)', overflowX: 'auto', lineHeight: 1.5 }}>
{JSON.stringify(l.changes_made, null, 2)}
          </pre>
        </section>
      }
    </div>);

}

window.AdminTournamentAuditLog = AdminTournamentAuditLog;
