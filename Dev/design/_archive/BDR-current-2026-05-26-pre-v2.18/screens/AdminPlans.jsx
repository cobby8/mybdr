/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminPlans.jsx — Admin-C 비즈니스 그룹 · 요금제 관리 (v2.10)
//   진입: setRoute('adminPlans')
//   복귀: setRoute('adminDashboard') · adminPayments
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 가격 강조 / 가입자수 / 갱신률 / 시작일·종료일
// =====================================================================

const ADMIN_PLANS_DATA = [
{
  plan_id: 'pl_free',
  name: 'Free',
  tier_level: 0,
  price_krw: 0,
  billing_cycle: 'monthly',
  billing_cycle_label: '월간',
  status: 'live',
  status_label: '운영중',
  status_tone: 'ok',
  subscribers: 4218,
  renewal_rate: null,
  started_at: '2024-01-01',
  ends_at: null,
  feature_count: 6,
  is_featured: false,
  summary: '경기·코트·팀 기본 기능. 광고 노출.'
},
{
  plan_id: 'pl_basic_m',
  name: 'Basic',
  tier_level: 1,
  price_krw: 4900,
  billing_cycle: 'monthly',
  billing_cycle_label: '월간',
  status: 'live',
  status_label: '운영중',
  status_tone: 'ok',
  subscribers: 1042,
  renewal_rate: 0.78,
  started_at: '2024-01-01',
  ends_at: null,
  feature_count: 12,
  is_featured: true,
  summary: '광고 제거 + 팀 통계 + 무제한 검색.'
},
{
  plan_id: 'pl_pro_m',
  name: 'Pro',
  tier_level: 2,
  price_krw: 9900,
  billing_cycle: 'monthly',
  billing_cycle_label: '월간',
  status: 'live',
  status_label: '운영중',
  status_tone: 'ok',
  subscribers: 412,
  renewal_rate: 0.84,
  started_at: '2024-01-01',
  ends_at: null,
  feature_count: 24,
  is_featured: false,
  summary: 'Basic + 코트 우선 예약 + 토너먼트 무제한 + 분석.'
},
{
  plan_id: 'pl_pro_y',
  name: 'Pro 연간',
  tier_level: 2,
  price_krw: 99000,
  billing_cycle: 'yearly',
  billing_cycle_label: '연간',
  status: 'live',
  status_label: '운영중',
  status_tone: 'ok',
  subscribers: 182,
  renewal_rate: 0.91,
  started_at: '2024-06-01',
  ends_at: null,
  feature_count: 24,
  is_featured: false,
  summary: '연간 결제 시 약 17% 할인.'
},
{
  plan_id: 'pl_team_m',
  name: 'Team',
  tier_level: 3,
  price_krw: 29000,
  billing_cycle: 'monthly',
  billing_cycle_label: '월간',
  status: 'upcoming',
  status_label: '예정',
  status_tone: 'warn',
  subscribers: 0,
  renewal_rate: null,
  started_at: '2026-06-01',
  ends_at: null,
  feature_count: 32,
  is_featured: false,
  summary: '팀 단위 관리 — 멤버 30명 + 협회 인증 + 전용 대시보드.'
},
{
  plan_id: 'pl_legacy_premium',
  name: 'Premium (구)',
  tier_level: 2,
  price_krw: 7900,
  billing_cycle: 'monthly',
  billing_cycle_label: '월간',
  status: 'ended',
  status_label: '종료',
  status_tone: 'mute',
  subscribers: 0,
  renewal_rate: null,
  started_at: '2023-09-01',
  ends_at: '2024-01-01',
  feature_count: 18,
  is_featured: false,
  summary: 'Pro 플랜으로 통합 — 2024년 1월 종료.'
}];

window.ADMIN_PLANS_DATA = ADMIN_PLANS_DATA;

const FMT_KRW = (n) => '₩' + n.toLocaleString();

// =====================================================================
function AdminPlans({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [cycleFilter, setCycleFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'tier_level', dir: 'asc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_PLANS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q));
    }
    if (cycleFilter !== 'all') rows = rows.filter((r) => r.billing_cycle === cycleFilter);
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
  }, [statusTab, search, cycleFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_PLANS_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return {
      all: base.length,
      live: by('live'),
      upcoming: by('upcoming'),
      ended: by('ended')
    };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const cycles = ['all', 'monthly', 'yearly'];

  const columns = [
  { key: 'name', label: '플랜', sortable: true, width: '26%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {r.is_featured &&
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }} title="추천">star</span>
        }
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</span>
      </div>
  },
  { key: 'price_krw', label: '가격', sortable: true, width: 120,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 14, fontWeight: 700, color: r.price_krw === 0 ? 'var(--ink-mute)' : 'var(--ink)' }}>
          {r.price_krw === 0 ? '무료' : FMT_KRW(r.price_krw)}
        </span>
        <span style={{ fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>/{r.billing_cycle_label}</span>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'subscribers', label: '가입자', sortable: true, width: 90, align: 'right',
    render: (r) =>
    r.subscribers > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: r.subscribers >= 1000 ? 'var(--accent)' : 'var(--ink)' }}>
          {r.subscribers.toLocaleString()}
        </span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'renewal_rate', label: '갱신률', sortable: true, width: 80, align: 'right',
    render: (r) =>
    r.renewal_rate != null ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: r.renewal_rate >= 0.8 ? 'var(--ok)' : 'var(--ink-soft)' }}>
          {(r.renewal_rate * 100).toFixed(0)}%
        </span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'feature_count', label: '기능', sortable: true, width: 70, align: 'right',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.feature_count}</span>
  },
  { key: 'started_at', label: '시작', sortable: true, width: 110,
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>{r.started_at}</span>
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
      route="adminPlans"
      setRoute={setRoute}
      eyebrow="ADMIN · 비즈니스"
      title="요금제 관리"
      subtitle="유료·무료 플랜의 가격·기능·가입자 추이를 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '비즈니스' },
      { label: '요금제 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminPayments')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>credit_card</span>
            결제 내역
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 플랜 등록
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'live', label: '운영중', count: counts.live },
        { key: 'upcoming', label: '예정', count: counts.upcoming },
        { key: 'ended', label: '종료', count: counts.ended }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '플랜명·설명 검색' }}
        filters={[
        { key: 'cycle', label: '결제주기', value: cycleFilter, onChange: (v) => { setCycleFilter(v); setPage(1); },
          options: cycles.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' : o === 'monthly' ? '월간' : '연간'
          })) }]
        }
        onReset={() => { setSearch(''); setCycleFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="plan_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 플랜이 없어요' : '조건에 맞는 플랜이 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 새 플랜 등록 버튼으로 첫 플랜을 추가하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 플랜 등록' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) {} // open form
          else { setSearch(''); setCycleFilter('all'); setStatusTab('all'); }
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
            <button type="button" className="btn btn--primary" onClick={() => setRoute('pricing')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
              요금제 보기
            </button>
          </>
        }>

        {openDetail && <PlanDetailPanel p={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function PlanDetailPanel({ p }) {
  const monthlyRevenue = p.price_krw * p.subscribers;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={p.status_tone}>{p.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{p.billing_cycle_label}</span>
        {p.is_featured &&
        <span className="admin-stat-pill" data-tone="info">
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>star</span>
            추천
          </span>
        }
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{p.plan_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>가격</div>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>
          {p.price_krw === 0 ? '무료' : FMT_KRW(p.price_krw)}
          {p.price_krw > 0 &&
          <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 6 }}>/ {p.billing_cycle_label}</span>
          }
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>가입자</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{p.subscribers.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>갱신률</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: p.renewal_rate >= 0.8 ? 'var(--ok)' : 'inherit', marginTop: 4 }}>
            {p.renewal_rate != null ? `${(p.renewal_rate * 100).toFixed(0)}%` : '—'}
          </div>
        </div>
      </section>

      {p.price_krw > 0 && p.subscribers > 0 &&
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>예상 매출 / {p.billing_cycle_label}</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ff-mono)', marginTop: 4, color: 'var(--accent)' }}>
            {FMT_KRW(monthlyRevenue)}
          </div>
        </section>
      }

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>플랜 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>기능 수</dt>
          <dd style={{ margin: 0 }}>{p.feature_count}개</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>결제 주기</dt>
          <dd style={{ margin: 0 }}>{p.billing_cycle_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>시작일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.started_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>종료일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.ends_at || '—'}</dd>
        </dl>
      </section>
    </div>);

}

window.AdminPlans = AdminPlans;
