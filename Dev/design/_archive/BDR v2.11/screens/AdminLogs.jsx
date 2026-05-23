/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminLogs.jsx — Admin-D 시스템 그룹 · 활동 로그 (v2.11)
//   진입: setRoute('adminLogs')
//   복귀: setRoute('adminDashboard') · adminSettings
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: severity 4단계 (info/warn/error/critical) + 시스템 vs 운영자 액션 구분
// =====================================================================

const ADMIN_LOGS_DATA = [
{
  log_id: 'lg_20260515_184221',
  severity: 'critical',
  severity_label: 'CRIT',
  severity_tone: 'err',
  source: 'auth',
  source_label: '인증',
  actor_type: 'system',
  actor_name: '시스템',
  action: 'BRUTE_FORCE',
  message: '동일 IP 에서 5분간 42회 로그인 실패 — IP 차단 처리.',
  meta: { ip: '203.245.x.x', user_id: null },
  created_at: '2026-05-15 18:42:21'
},
{
  log_id: 'lg_20260515_142811',
  severity: 'error',
  severity_label: 'ERROR',
  severity_tone: 'err',
  source: 'payment',
  source_label: '결제',
  actor_type: 'system',
  actor_name: '시스템',
  action: 'PAYMENT_FAIL',
  message: '캠페인 cmp_2026_summer_pro — 신용카드 인증 실패 7건.',
  meta: { campaign_id: 'cmp_2026_summer_pro', fail_count: 7 },
  created_at: '2026-05-15 14:28:11'
},
{
  log_id: 'lg_20260515_112812',
  severity: 'info',
  severity_label: 'INFO',
  severity_tone: 'info',
  source: 'admin',
  source_label: '운영',
  actor_type: 'admin',
  actor_name: '김도훈',
  action: 'TOURNAMENT_CREATE',
  message: 'BDR 서머 오픈 #4 생성 — 종별 4개 / 정원 44팀.',
  meta: { tournament_id: 'tn_2026_summer_4' },
  created_at: '2026-05-15 11:28:12'
},
{
  log_id: 'lg_20260515_104412',
  severity: 'warn',
  severity_label: 'WARN',
  severity_tone: 'warn',
  source: 'report',
  source_label: '신고',
  actor_type: 'admin',
  actor_name: '이박재',
  action: 'REPORT_DEFERRED',
  message: '게시글 p_20260513_007 — 욕설 신고 3건 / 검토 보류.',
  meta: { report_id: 'r_20260513_2218' },
  created_at: '2026-05-15 10:44:12'
},
{
  log_id: 'lg_20260515_092218',
  severity: 'info',
  severity_label: 'INFO',
  severity_tone: 'info',
  source: 'user',
  source_label: '유저',
  actor_type: 'admin',
  actor_name: '김도훈',
  action: 'USER_ROLE_CHANGE',
  message: 'u_lee_park 에 tournament_admin 권한 부여.',
  meta: { target: 'u_lee_park', new_role: 'tournament_admin' },
  created_at: '2026-05-15 09:22:18'
},
{
  log_id: 'lg_20260514_220142',
  severity: 'warn',
  severity_label: 'WARN',
  severity_tone: 'warn',
  source: 'system',
  source_label: '시스템',
  actor_type: 'system',
  actor_name: '시스템',
  action: 'DB_SLOWQ',
  message: 'slow query 감지 — court_search > 2.4s (서울 강남, 6면).',
  meta: { query: 'court_search', duration_ms: 2412 },
  created_at: '2026-05-14 22:01:42'
},
{
  log_id: 'lg_20260514_183022',
  severity: 'info',
  severity_label: 'INFO',
  severity_tone: 'info',
  source: 'partner',
  source_label: '파트너',
  actor_type: 'admin',
  actor_name: '이박재',
  action: 'PARTNER_APPROVE',
  message: '마포 아레나 파트너 신청 승인.',
  meta: { partner_id: 'pt_mapo_arena' },
  created_at: '2026-05-14 18:30:22'
},
{
  log_id: 'lg_20260514_153012',
  severity: 'error',
  severity_label: 'ERROR',
  severity_tone: 'err',
  source: 'system',
  source_label: '시스템',
  actor_type: 'system',
  actor_name: '시스템',
  action: 'JOB_TIMEOUT',
  message: '랭킹 재계산 cron — 60s 타임아웃 발생 / 재시도 큐 등록.',
  meta: { job: 'rank_recalc', retry: 1 },
  created_at: '2026-05-14 15:30:12'
},
{
  log_id: 'lg_20260514_104412',
  severity: 'critical',
  severity_label: 'CRIT',
  severity_tone: 'err',
  source: 'auth',
  source_label: '인증',
  actor_type: 'admin',
  actor_name: '김도훈',
  action: 'USER_SUSPEND',
  message: 'thunderdunk 계정 정지 — 신고 4건 누적 + 욕설 확인.',
  meta: { target: 'u_2025_bannedguy' },
  created_at: '2026-05-14 10:44:12'
},
{
  log_id: 'lg_20260514_091812',
  severity: 'info',
  severity_label: 'INFO',
  severity_tone: 'info',
  source: 'content',
  source_label: '콘텐츠',
  actor_type: 'admin',
  actor_name: '정세훈',
  action: 'NEWS_PUBLISH',
  message: 'BDR 챌린지 #8 개막 기사 발행.',
  meta: { article_id: 'n_2026_challenge_open' },
  created_at: '2026-05-14 09:18:12'
}];

window.ADMIN_LOGS_DATA = ADMIN_LOGS_DATA;

const SEVERITY_ORDER = { critical: 4, error: 3, warn: 2, info: 1 };

function AdminLogs({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [sourceFilter, setSourceFilter] = React.useState('all');
  const [actorFilter, setActorFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'created_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_LOGS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.severity === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.message.toLowerCase().includes(q) ||
      r.action.toLowerCase().includes(q) ||
      r.log_id.toLowerCase().includes(q));
    }
    if (sourceFilter !== 'all') rows = rows.filter((r) => r.source === sourceFilter);
    if (actorFilter !== 'all') rows = rows.filter((r) => r.actor_type === actorFilter);
    rows.sort((a, b) => {
      let va = a[sort.key]; let vb = b[sort.key];
      if (sort.key === 'severity') { va = SEVERITY_ORDER[va]; vb = SEVERITY_ORDER[vb]; }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, sourceFilter, actorFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_LOGS_DATA;
    const by = (k) => base.filter((r) => r.severity === k).length;
    return {
      all: base.length,
      info: by('info'),
      warn: by('warn'),
      error: by('error'),
      critical: by('critical')
    };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const sources = ['all', ...new Set(ADMIN_LOGS_DATA.map((r) => r.source))];
  const actors = ['all', 'admin', 'system'];

  const columns = [
  { key: 'created_at', label: '시간', sortable: true, width: 160,
    render: (r) => {
      const [d, t] = r.created_at.split(' ');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{d}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{t}</span>
        </div>);

    }
  },
  { key: 'severity', label: '레벨', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.severity_tone} style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '0.04em', fontWeight: 700 }}>
        {r.severity_label}
      </span>
  },
  { key: 'source', label: '출처', sortable: true, width: 80,
    render: (r) =>
    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.source_label}</span>
  },
  { key: 'actor_name', label: '주체', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
          {r.actor_type === 'system' ? 'memory' : 'person'}
        </span>
        <span style={{ fontSize: 12.5, color: r.actor_type === 'system' ? 'var(--ink-mute)' : 'var(--ink)' }}>{r.actor_name}</span>
      </div>
  },
  { key: 'action', label: '액션', sortable: true, width: 150,
    render: (r) =>
    <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)', background: 'var(--bg-alt)', padding: '2px 6px', borderRadius: 3 }}>{r.action}</code>
  },
  { key: 'message', label: '메시지', sortable: false, width: '36%',
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.message}</span>
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
      route="adminLogs"
      setRoute={setRoute}
      eyebrow="ADMIN · 시스템"
      title="활동 로그"
      subtitle="시스템 이벤트와 운영진 액션의 시계열 로그를 확인합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '시스템' },
      { label: '활동 로그' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminSettings')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>settings</span>
            시스템 설정
          </button>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            JSON 내보내기
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'info', label: 'INFO', count: counts.info },
        { key: 'warn', label: 'WARN', count: counts.warn },
        { key: 'error', label: 'ERROR', count: counts.error },
        { key: 'critical', label: 'CRIT', count: counts.critical }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '메시지·액션·로그 ID 검색' }}
        filters={[
        { key: 'source', label: '출처', value: sourceFilter, onChange: (v) => { setSourceFilter(v); setPage(1); },
          options: sources.map((o) => {
            const found = ADMIN_LOGS_DATA.find((r) => r.source === o);
            return { value: o, label: o === 'all' ? '전체' : found ? found.source_label : o };
          }) },
        { key: 'actor', label: '주체', value: actorFilter, onChange: (v) => { setActorFilter(v); setPage(1); },
          options: actors.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' : o === 'admin' ? '운영자' : '시스템'
          })) }]
        }
        onReset={() => { setSearch(''); setSourceFilter('all'); setActorFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="log_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '로그가 없어요' : '조건에 맞는 로그가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '시스템·운영 이벤트가 발생하면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setSourceFilter('all'); setActorFilter('all'); setStatusTab('all'); }
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

        {openDetail && <LogDetailPanel l={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function LogDetailPanel({ l }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={l.severity_tone} style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, letterSpacing: '0.04em' }}>{l.severity_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{l.source_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{l.log_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>메시지</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{l.message}</p>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>이벤트</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>액션</dt>
          <dd style={{ margin: 0 }}>
            <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--accent)' }}>{l.action}</code>
          </dd>
          <dt style={{ color: 'var(--ink-mute)' }}>시간</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{l.created_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>출처</dt>
          <dd style={{ margin: 0 }}>{l.source_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>주체</dt>
          <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
              {l.actor_type === 'system' ? 'memory' : 'person'}
            </span>
            {l.actor_name}
          </dd>
        </dl>
      </section>

      {l.meta &&
      <section>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>메타데이터</div>
          <pre style={{ margin: 0, padding: 12, background: 'var(--bg-alt)', borderRadius: 4, fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink-soft)', overflowX: 'auto', lineHeight: 1.5 }}>
{JSON.stringify(l.meta, null, 2)}
          </pre>
        </section>
      }
    </div>);

}

window.AdminLogs = AdminLogs;
