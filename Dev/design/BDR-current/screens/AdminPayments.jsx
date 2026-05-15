/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminPayments.jsx — Admin-C 비즈니스 그룹 · 결제 내역 (v2.10)
//   진입: setRoute('adminPayments')
//   복귀: setRoute('adminDashboard') · adminPlans
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 금액 monospace 강조 + 결제수단 아이콘 + 거래ID + KRW 단위 (mock)
// =====================================================================

const ADMIN_PAYMENTS_DATA = [
{
  payment_id: 'pay_2026051518421042',
  user_id: 'u_2025_ohyeongjin',
  user_nickname: '오영진',
  plan_id: 'pl_pro_y',
  plan_label: 'Pro 연간',
  amount: 99000,
  status: 'paid',
  status_label: '완료',
  status_tone: 'ok',
  method: 'card',
  method_label: '카드 (4242)',
  method_icon: 'credit_card',
  paid_at: '2026-05-15 18:42',
  approval_no: '24017812'
},
{
  payment_id: 'pay_2026051509180921',
  user_id: 'u_2025_hanjiseok',
  user_nickname: '한지석',
  plan_id: 'pl_pro_m',
  plan_label: 'Pro',
  amount: 9900,
  status: 'paid',
  status_label: '완료',
  status_tone: 'ok',
  method: 'kakaopay',
  method_label: '카카오페이',
  method_icon: 'account_balance_wallet',
  paid_at: '2026-05-15 09:18',
  approval_no: '24017804'
},
{
  payment_id: 'pay_2026051422144491',
  user_id: 'u_2025_kang_dohyun',
  user_nickname: '강도현',
  plan_id: 'pl_basic_m',
  plan_label: 'Basic',
  amount: 4900,
  status: 'paid',
  status_label: '완료',
  status_tone: 'ok',
  method: 'card',
  method_label: '카드 (8810)',
  method_icon: 'credit_card',
  paid_at: '2026-05-14 22:14',
  approval_no: '24017722'
},
{
  payment_id: 'pay_2026051509050322',
  user_id: 'u_2026_seominji',
  user_nickname: '서민지',
  plan_id: 'pl_basic_m',
  plan_label: 'Basic',
  amount: 4900,
  status: 'pending',
  status_label: '대기',
  status_tone: 'warn',
  method: 'bank',
  method_label: '계좌이체',
  method_icon: 'account_balance',
  paid_at: '2026-05-15 09:05',
  approval_no: null
},
{
  payment_id: 'pay_2026051420180719',
  user_id: 'u_2026_parkhanul',
  user_nickname: '박하늘',
  plan_id: 'pl_basic_m',
  plan_label: 'Basic',
  amount: 4900,
  status: 'failed',
  status_label: '실패',
  status_tone: 'err',
  method: 'card',
  method_label: '카드 (9911)',
  method_icon: 'credit_card',
  paid_at: '2026-05-14 20:18',
  approval_no: null,
  fail_reason: '한도 초과'
},
{
  payment_id: 'pay_2026051319284410',
  user_id: 'u_2025_chosanghyuk',
  user_nickname: '조상혁',
  plan_id: 'pl_pro_m',
  plan_label: 'Pro',
  amount: 9900,
  status: 'refunded',
  status_label: '환불',
  status_tone: 'mute',
  method: 'card',
  method_label: '카드 (7733)',
  method_icon: 'credit_card',
  paid_at: '2026-05-13 19:28',
  approval_no: '24017611',
  refunded_at: '2026-05-13 21:02'
},
{
  payment_id: 'pay_2026051112418802',
  user_id: 'u_2025_yoonjaeho',
  user_nickname: '윤재호',
  plan_id: 'pl_basic_m',
  plan_label: 'Basic',
  amount: 4900,
  status: 'failed',
  status_label: '실패',
  status_tone: 'err',
  method: 'kakaopay',
  method_label: '카카오페이',
  method_icon: 'account_balance_wallet',
  paid_at: '2026-05-11 12:41',
  approval_no: null,
  fail_reason: '잔액 부족'
},
{
  payment_id: 'pay_2026051008051100',
  user_id: 'u_2025_parkminsu',
  user_nickname: '박민수',
  plan_id: 'pl_pro_y',
  plan_label: 'Pro 연간',
  amount: 99000,
  status: 'paid',
  status_label: '완료',
  status_tone: 'ok',
  method: 'card',
  method_label: '카드 (1122)',
  method_icon: 'credit_card',
  paid_at: '2026-05-10 08:05',
  approval_no: '24017288'
}];

window.ADMIN_PAYMENTS_DATA = ADMIN_PAYMENTS_DATA;

const FMT_KRW = (n) => '₩' + n.toLocaleString();

// =====================================================================
function AdminPayments({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('all');
  const [planFilter, setPlanFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'paid_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_PAYMENTS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.user_nickname.toLowerCase().includes(q) ||
      r.payment_id.toLowerCase().includes(q) ||
      (r.approval_no || '').toLowerCase().includes(q));
    }
    if (methodFilter !== 'all') rows = rows.filter((r) => r.method === methodFilter);
    if (planFilter !== 'all') rows = rows.filter((r) => r.plan_id === planFilter);
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
  }, [statusTab, search, methodFilter, planFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_PAYMENTS_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return {
      all: base.length,
      paid: by('paid'),
      pending: by('pending'),
      refunded: by('refunded'),
      failed: by('failed')
    };
  }, [mockState]);

  const totalPaid = React.useMemo(() => {
    return (mockState === 'empty' ? [] : ADMIN_PAYMENTS_DATA).
    filter((r) => r.status === 'paid').
    reduce((sum, r) => sum + r.amount, 0);
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const methods = ['all', ...new Set(ADMIN_PAYMENTS_DATA.map((r) => r.method))];
  const plans = ['all', ...new Set(ADMIN_PAYMENTS_DATA.map((r) => r.plan_id))];

  const columns = [
  { key: 'paid_at', label: '결제일시', sortable: true, width: 130,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{r.paid_at.split(' ')[0]}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{r.paid_at.split(' ')[1]}</span>
      </div>
  },
  { key: 'user_nickname', label: '유저', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.user_nickname}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>{r.user_id}</span>
      </div>
  },
  { key: 'plan_label', label: '플랜', sortable: true, width: 90,
    render: (r) =>
    <span className="admin-stat-pill" data-tone="mute">{r.plan_label}</span>
  },
  { key: 'amount', label: '금액', sortable: true, width: 110, align: 'right',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13.5, fontWeight: 700, color: r.status === 'paid' ? 'var(--ink)' : r.status === 'refunded' ? 'var(--ink-dim)' : 'var(--ink-soft)', textDecoration: r.status === 'refunded' ? 'line-through' : 'none' }}>
        {FMT_KRW(r.amount)}
      </span>
  },
  { key: 'method', label: '결제수단', sortable: true, width: 130,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>{r.method_icon}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.method_label}</span>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'approval_no', label: '승인번호', sortable: false, width: 110,
    render: (r) =>
    r.approval_no ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{r.approval_no}</span> :
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
      route="adminPayments"
      setRoute={setRoute}
      eyebrow="ADMIN · 비즈니스"
      title="결제 내역"
      subtitle="유료 플랜 결제 거래·환불·실패 내역을 조회하고 정산합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '비즈니스' },
      { label: '결제' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminPlans')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>payments</span>
            요금제 관리
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            정산 CSV
          </button>
        </>
      }>

      {/* 매출 요약 카드 */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>총 매출 (완료)</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: 'var(--accent)', marginTop: 4 }}>{FMT_KRW(totalPaid)}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>거래 건수</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{counts.paid}</div>
        </div>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>실패 / 환불</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: counts.failed > 0 ? 'var(--err)' : 'inherit', marginTop: 4 }}>{counts.failed + counts.refunded}</div>
        </div>
      </section>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'paid', label: '완료', count: counts.paid },
        { key: 'pending', label: '대기', count: counts.pending },
        { key: 'refunded', label: '환불', count: counts.refunded },
        { key: 'failed', label: '실패', count: counts.failed }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '닉네임·거래ID·승인번호 검색' }}
        filters={[
        { key: 'method', label: '결제수단', value: methodFilter, onChange: (v) => { setMethodFilter(v); setPage(1); },
          options: methods.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'card' ? '카드' :
            o === 'kakaopay' ? '카카오페이' :
            o === 'bank' ? '계좌이체' : o
          })) },
        { key: 'plan', label: '플랜', value: planFilter, onChange: (v) => { setPlanFilter(v); setPage(1); },
          options: plans.map((o) => {
            const found = ADMIN_PAYMENTS_DATA.find((r) => r.plan_id === o);
            return { value: o, label: o === 'all' ? '전체' : found ? found.plan_label : o };
          }) }]
        }
        onReset={() => { setSearch(''); setMethodFilter('all'); setPlanFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="payment_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '결제 내역이 없어요' : '조건에 맞는 거래가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '결제가 발생하면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setMethodFilter('all'); setPlanFilter('all'); setStatusTab('all'); }
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
        title={openDetail ? `결제 · ${openDetail.user_nickname}` : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn" onClick={() => setRoute('adminUsers')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person</span>
              유저 보기
            </button>
            {openDetail?.status === 'paid' &&
            <button type="button" className="btn btn--primary" style={{ color: 'var(--err)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>currency_exchange</span>
                환불 처리
              </button>
            }
            {openDetail?.status === 'failed' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                재시도
              </button>
            }
          </>
        }>

        {openDetail && <PaymentDetailPanel p={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function PaymentDetailPanel({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={p.status_tone}>{p.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{p.plan_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{p.payment_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>금액</div>
        <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4, color: p.status === 'paid' ? 'var(--ink)' : 'var(--ink-mute)', textDecoration: p.status === 'refunded' ? 'line-through' : 'none' }}>
          {FMT_KRW(p.amount)}
        </div>
      </section>

      {p.fail_reason &&
      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12, borderLeft: '3px solid var(--err)' }}>
          <div style={{ fontSize: 11, color: 'var(--err)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>실패 사유</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink)' }}>{p.fail_reason}</div>
        </section>
      }

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>거래 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>유저</dt>
          <dd style={{ margin: 0 }}>{p.user_nickname} <span style={{ color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginLeft: 4 }}>{p.user_id}</span></dd>
          <dt style={{ color: 'var(--ink-mute)' }}>플랜</dt>
          <dd style={{ margin: 0 }}>{p.plan_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>결제수단</dt>
          <dd style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{p.method_icon}</span>
            {p.method_label}
          </dd>
          <dt style={{ color: 'var(--ink-mute)' }}>결제일시</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.paid_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>승인번호</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.approval_no || '—'}</dd>
          {p.refunded_at &&
          <>
              <dt style={{ color: 'var(--ink-mute)' }}>환불일시</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.refunded_at}</dd>
            </>
          }
        </dl>
      </section>
    </div>);

}

window.AdminPayments = AdminPayments;
