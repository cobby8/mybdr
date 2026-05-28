/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminPartners.jsx — Admin-C 비즈니스 그룹 · 파트너 관리 (v2.10)
//   진입: setRoute('adminPartners')
//   복귀: setRoute('adminDashboard') · adminCampaigns
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 카테고리(코트/장비/스폰서/협회) + 등급 별 + 매출 KRW
// =====================================================================

const ADMIN_PARTNERS_DATA = [
{
  partner_id: 'pt_kn_base_court',
  name: '강남 베이스코트',
  category: 'court',
  category_label: '코트',
  category_icon: 'location_on',
  contact_name: '이상민',
  contact_email: 'sm.lee@knbase.kr',
  tier: 'GOLD',
  tier_tone: 'accent',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  revenue: 4820000,
  contract_starts_at: '2025-01-15',
  contract_ends_at: '2026-01-14',
  campaigns: 4,
  summary: '서울 강남 — 6면 실내 코트. 토너먼트 협력 4회.'
},
{
  partner_id: 'pt_hoopgear',
  name: 'HoopGear',
  category: 'gear',
  category_label: '장비',
  category_icon: 'sports_basketball',
  contact_name: '박지훈',
  contact_email: 'jh.park@hoopgear.com',
  tier: 'GOLD',
  tier_tone: 'accent',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  revenue: 6420000,
  contract_starts_at: '2024-06-01',
  contract_ends_at: '2026-05-31',
  campaigns: 8,
  summary: '농구화·볼·웨어 — BDR 공식 장비 파트너. 캠페인 8회.'
},
{
  partner_id: 'pt_seoul_3x3',
  name: '서울 3x3 위원회',
  category: 'association',
  category_label: '협회',
  category_icon: 'verified',
  contact_name: '김선영',
  contact_email: 'sy.kim@seoul3x3.or.kr',
  tier: 'PLATINUM',
  tier_tone: 'info',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  revenue: 0,
  contract_starts_at: '2024-01-01',
  contract_ends_at: '2026-12-31',
  campaigns: 0,
  summary: '공식 협력 협회 — 대회 인증·등급 부여. 비매출 협력.'
},
{
  partner_id: 'pt_zone_drinks',
  name: 'ZONE Drinks',
  category: 'sponsor',
  category_label: '스폰서',
  category_icon: 'local_drink',
  contact_name: '정유진',
  contact_email: 'yj.jeong@zonedrinks.co.kr',
  tier: 'SILVER',
  tier_tone: 'mute',
  status: 'active',
  status_label: '활성',
  status_tone: 'ok',
  revenue: 2400000,
  contract_starts_at: '2025-09-01',
  contract_ends_at: '2026-08-31',
  campaigns: 2,
  summary: '서머 오픈 #4 스폰서 — 음료 협찬 + 캠페인 2회.'
},
{
  partner_id: 'pt_mapo_arena',
  name: '마포 아레나',
  category: 'court',
  category_label: '코트',
  category_icon: 'location_on',
  contact_name: '신민호',
  contact_email: 'mh.shin@mapo-arena.kr',
  tier: 'SILVER',
  tier_tone: 'mute',
  status: 'pending',
  status_label: '심사중',
  status_tone: 'warn',
  revenue: 0,
  contract_starts_at: '2026-06-01',
  contract_ends_at: '2027-05-31',
  campaigns: 0,
  summary: '신규 신청 — 4면 실외 코트. 5/15 서류 검토중.'
},
{
  partner_id: 'pt_paint_ref',
  name: 'Paint Referees Co.',
  category: 'association',
  category_label: '협회',
  category_icon: 'verified',
  contact_name: '한태영',
  contact_email: 'ty.han@paintref.kr',
  tier: 'BRONZE',
  tier_tone: 'mute',
  status: 'pending',
  status_label: '심사중',
  status_tone: 'warn',
  revenue: 0,
  contract_starts_at: '2026-07-01',
  contract_ends_at: '2027-06-30',
  campaigns: 0,
  summary: '심판 매칭 협력 — 자격 검증 진행중.'
},
{
  partner_id: 'pt_oldsponsor',
  name: 'NorthStar Apparel',
  category: 'sponsor',
  category_label: '스폰서',
  category_icon: 'checkroom',
  contact_name: '오성근',
  contact_email: 'sg.oh@northstar.kr',
  tier: 'BRONZE',
  tier_tone: 'mute',
  status: 'suspended',
  status_label: '정지',
  status_tone: 'err',
  revenue: 800000,
  contract_starts_at: '2025-03-01',
  contract_ends_at: '2026-02-28',
  campaigns: 1,
  summary: '계약 위반 — 미정산 잔액 / 2026-04 정지 처분.'
}];

window.ADMIN_PARTNERS_DATA = ADMIN_PARTNERS_DATA;

const FMT_KRW = (n) => '₩' + n.toLocaleString();

// =====================================================================
function AdminPartners({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [categoryFilter, setCategoryFilter] = React.useState('all');
  const [tierFilter, setTierFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'revenue', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_PARTNERS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.contact_name.toLowerCase().includes(q));
    }
    if (categoryFilter !== 'all') rows = rows.filter((r) => r.category === categoryFilter);
    if (tierFilter !== 'all') rows = rows.filter((r) => r.tier === tierFilter);
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
  }, [statusTab, search, categoryFilter, tierFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_PARTNERS_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return {
      all: base.length,
      active: by('active'),
      pending: by('pending'),
      suspended: by('suspended')
    };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const categories = ['all', 'court', 'gear', 'sponsor', 'association'];
  const tiers = ['all', 'PLATINUM', 'GOLD', 'SILVER', 'BRONZE'];

  const columns = [
  { key: 'name', label: '파트너', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>{r.category_icon}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</span>
        </div>
      </div>
  },
  { key: 'category', label: '카테고리', sortable: true, width: 90,
    render: (r) =>
    <span className="admin-stat-pill" data-tone="mute">{r.category_label}</span>
  },
  { key: 'tier', label: '등급', sortable: true, width: 90,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.tier_tone}>{r.tier}</span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'revenue', label: '누적 매출', sortable: true, width: 120, align: 'right',
    render: (r) =>
    r.revenue > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: r.revenue >= 5000000 ? 'var(--accent)' : 'var(--ink)' }}>
          {FMT_KRW(r.revenue)}
        </span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'campaigns', label: '캠페인', sortable: true, width: 70, align: 'right',
    render: (r) =>
    r.campaigns > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.campaigns}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'contract_ends_at', label: '계약 만료', sortable: true, width: 110,
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>{r.contract_ends_at}</span>
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
      route="adminPartners"
      setRoute={setRoute}
      eyebrow="ADMIN · 비즈니스"
      title="파트너 관리"
      subtitle="코트·장비·스폰서·협회 파트너 계약과 매출 성과를 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '비즈니스' },
      { label: '파트너 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('partnerAdminEntry')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>storefront</span>
            협력업체 페이지
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 파트너
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'active', label: '활성', count: counts.active },
        { key: 'pending', label: '심사중', count: counts.pending },
        { key: 'suspended', label: '정지', count: counts.suspended }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '파트너명·담당자·내용 검색' }}
        filters={[
        { key: 'category', label: '카테고리', value: categoryFilter, onChange: (v) => { setCategoryFilter(v); setPage(1); },
          options: categories.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'court' ? '코트' :
            o === 'gear' ? '장비' :
            o === 'sponsor' ? '스폰서' :
            o === 'association' ? '협회' : o
          })) },
        { key: 'tier', label: '등급', value: tierFilter, onChange: (v) => { setTierFilter(v); setPage(1); },
          options: tiers.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setCategoryFilter('all'); setTierFilter('all'); setStatusTab('all'); setPage(1); }} />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="partner_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '등록된 파트너가 없어요' : '조건에 맞는 파트너가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 새 파트너 버튼으로 첫 협력사를 등록하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 파트너' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) {}
          else { setSearch(''); setCategoryFilter('all'); setTierFilter('all'); setStatusTab('all'); }
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
            <button type="button" className="btn" onClick={() => setRoute('adminCampaigns')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
              캠페인 보기
            </button>
            {openDetail?.status === 'pending' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                승인
              </button>
            }
            {openDetail?.status === 'suspended' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
                재활성
              </button>
            }
          </>
        }>

        {openDetail && <PartnerDetailPanel p={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function PartnerDetailPanel({ p }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={p.status_tone}>{p.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{p.category_label}</span>
        <span className="admin-stat-pill" data-tone={p.tier_tone}>{p.tier}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{p.partner_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>소개</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{p.summary}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>누적 매출</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-mono)', color: p.revenue >= 5000000 ? 'var(--accent)' : 'inherit', marginTop: 4 }}>
            {p.revenue > 0 ? FMT_KRW(p.revenue) : '—'}
          </div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>캠페인</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{p.campaigns}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>담당자 / 계약</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>담당자</dt>
          <dd style={{ margin: 0 }}>{p.contact_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>이메일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.contact_email}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>계약 시작</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.contract_starts_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>계약 만료</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{p.contract_ends_at}</dd>
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            계약 수정
          </button>
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upgrade</span>
            등급 변경
          </button>
          {p.status === 'active' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--err)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
              파트너 정지
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminPartners = AdminPartners;
