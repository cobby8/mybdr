/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminCampaigns.jsx — Admin-C 비즈니스 그룹 · 광고 캠페인 (v2.10)
//   진입: setRoute('adminCampaigns')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 채널 아이콘 + 전환률 % + ROI 배수 + 노출/클릭 KPI
// =====================================================================

const ADMIN_CAMPAIGNS_DATA = [
{
  campaign_id: 'cmp_2026_summer_pro',
  name: '서머 PRO 업그레이드 — 5월 한정',
  channel: 'instagram',
  channel_label: '인스타그램',
  channel_icon: 'photo_camera',
  partner_name: 'BDR 직영',
  status: 'live',
  status_label: '진행중',
  status_tone: 'ok',
  budget: 1500000,
  spent: 842000,
  impressions: 184220,
  clicks: 8841,
  conversions: 142,
  roi: 2.4,
  starts_at: '2026-05-01',
  ends_at: '2026-05-31'
},
{
  campaign_id: 'cmp_2026_tournament_4',
  name: '서머 오픈 #4 접수 — 트위터 광고',
  channel: 'twitter',
  channel_label: '트위터',
  channel_icon: 'forum',
  partner_name: 'BDR 직영',
  status: 'live',
  status_label: '진행중',
  status_tone: 'ok',
  budget: 800000,
  spent: 412000,
  impressions: 92410,
  clicks: 4128,
  conversions: 218,
  roi: 3.1,
  starts_at: '2026-05-05',
  ends_at: '2026-06-30'
},
{
  campaign_id: 'cmp_2026_naver_search',
  name: '네이버 검색 — 3x3 농구',
  channel: 'naver',
  channel_label: '네이버',
  channel_icon: 'search',
  partner_name: 'BDR 직영',
  status: 'live',
  status_label: '진행중',
  status_tone: 'ok',
  budget: 2400000,
  spent: 1842000,
  impressions: 412800,
  clicks: 18420,
  conversions: 412,
  roi: 1.8,
  starts_at: '2026-04-01',
  ends_at: '2026-05-31'
},
{
  campaign_id: 'cmp_2026_kakao_friend',
  name: '카카오 친구톡 — 신규 가입 유도',
  channel: 'kakao',
  channel_label: '카카오',
  channel_icon: 'chat',
  partner_name: 'BDR 직영',
  status: 'upcoming',
  status_label: '예정',
  status_tone: 'warn',
  budget: 1200000,
  spent: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  roi: null,
  starts_at: '2026-06-01',
  ends_at: '2026-06-30'
},
{
  campaign_id: 'cmp_2026_shoe_collab',
  name: '농구화 SALE — 협력 파트너',
  channel: 'instagram',
  channel_label: '인스타그램',
  channel_icon: 'photo_camera',
  partner_name: 'HoopGear',
  status: 'upcoming',
  status_label: '예정',
  status_tone: 'warn',
  budget: 600000,
  spent: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  roi: null,
  starts_at: '2026-05-20',
  ends_at: '2026-06-10'
},
{
  campaign_id: 'cmp_2026_april_pro',
  name: '4월 PRO 첫달 50%',
  channel: 'naver',
  channel_label: '네이버',
  channel_icon: 'search',
  partner_name: 'BDR 직영',
  status: 'ended',
  status_label: '종료',
  status_tone: 'mute',
  budget: 2000000,
  spent: 1988000,
  impressions: 392400,
  clicks: 17241,
  conversions: 388,
  roi: 1.5,
  starts_at: '2026-04-01',
  ends_at: '2026-04-30'
},
{
  campaign_id: 'cmp_2026_q3_brand',
  name: 'Q3 브랜드 광고 (초안)',
  channel: 'instagram',
  channel_label: '인스타그램',
  channel_icon: 'photo_camera',
  partner_name: 'BDR 직영',
  status: 'draft',
  status_label: '초안',
  status_tone: 'info',
  budget: 3000000,
  spent: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  roi: null,
  starts_at: '2026-07-01',
  ends_at: '2026-09-30'
}];

window.ADMIN_CAMPAIGNS_DATA = ADMIN_CAMPAIGNS_DATA;

const FMT_KRW = (n) => '₩' + n.toLocaleString();

// =====================================================================
function AdminCampaigns({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [channelFilter, setChannelFilter] = React.useState('all');
  const [partnerFilter, setPartnerFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'starts_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_CAMPAIGNS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.partner_name.toLowerCase().includes(q));
    }
    if (channelFilter !== 'all') rows = rows.filter((r) => r.channel === channelFilter);
    if (partnerFilter !== 'all') rows = rows.filter((r) => r.partner_name === partnerFilter);
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
  }, [statusTab, search, channelFilter, partnerFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_CAMPAIGNS_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return {
      all: base.length,
      live: by('live'),
      upcoming: by('upcoming'),
      ended: by('ended'),
      draft: by('draft')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const channels = ['all', ...new Set(ADMIN_CAMPAIGNS_DATA.map((r) => r.channel))];
  const partners = ['all', ...new Set(ADMIN_CAMPAIGNS_DATA.map((r) => r.partner_name))];

  const convRate = (r) => r.clicks > 0 ? r.conversions / r.clicks : null;

  const columns = [
  { key: 'name', label: '캠페인', sortable: true, width: '26%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.partner_name}</span>
      </div>
  },
  { key: 'channel', label: '채널', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>{r.channel_icon}</span>
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.channel_label}</span>
      </div>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'spent', label: '집행 / 예산', sortable: true, width: 150,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>
          {FMT_KRW(r.spent)} <span style={{ color: 'var(--ink-dim)' }}>/ {FMT_KRW(r.budget)}</span>
        </span>
        {r.budget > 0 &&
        <div style={{ height: 4, background: 'var(--bg-alt)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, r.spent / r.budget * 100)}%`, background: 'var(--accent)' }} />
          </div>
        }
      </div>
  },
  { key: 'clicks', label: '클릭', sortable: true, width: 80, align: 'right',
    render: (r) =>
    r.clicks > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.clicks.toLocaleString()}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'conversions', label: '전환률', sortable: true, width: 90, align: 'right',
    render: (r) => {
      const cr = convRate(r);
      return cr != null ?
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: cr >= 0.02 ? 'var(--ok)' : 'var(--ink)' }}>
            {(cr * 100).toFixed(2)}%
          </span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>
            {r.conversions}/{r.clicks}
          </span>
        </div> :
      <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>;
    }
  },
  { key: 'roi', label: 'ROI', sortable: true, width: 70, align: 'right',
    render: (r) =>
    r.roi != null ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: r.roi >= 2 ? 'var(--accent)' : r.roi >= 1 ? 'var(--ink)' : 'var(--err)' }}>
          {r.roi.toFixed(1)}×
        </span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'starts_at', label: '기간', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink)' }}>{r.starts_at}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>→ {r.ends_at}</span>
      </div>
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
      route="adminCampaigns"
      setRoute={setRoute}
      eyebrow="ADMIN · 비즈니스"
      title="광고 캠페인"
      subtitle="채널별 캠페인 집행과 전환·ROI 성과를 추적합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '비즈니스' },
      { label: '광고 캠페인' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>analytics</span>
            성과 리포트
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 캠페인
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'live', label: '진행중', count: counts.live },
        { key: 'upcoming', label: '예정', count: counts.upcoming },
        { key: 'ended', label: '종료', count: counts.ended },
        { key: 'draft', label: '초안', count: counts.draft }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '캠페인명·파트너 검색' }}
        filters={[
        { key: 'channel', label: '채널', value: channelFilter, onChange: (v) => { setChannelFilter(v); setPage(1); },
          options: channels.map((o) => {
            const found = ADMIN_CAMPAIGNS_DATA.find((r) => r.channel === o);
            return { value: o, label: o === 'all' ? '전체' : found ? found.channel_label : o };
          }) },
        { key: 'partner', label: '파트너', value: partnerFilter, onChange: (v) => { setPartnerFilter(v); setPage(1); },
          options: partners.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setChannelFilter('all'); setPartnerFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}건 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>pause</span>
              일시중지
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--ink-mute)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>archive</span>
              종료
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="campaign_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '캠페인이 없어요' : '조건에 맞는 캠페인이 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '+ 새 캠페인 버튼으로 첫 광고를 등록하세요.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '새 캠페인' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) {}
          else { setSearch(''); setChannelFilter('all'); setPartnerFilter('all'); setStatusTab('all'); }
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
            {openDetail?.status === 'live' &&
            <button type="button" className="btn btn--primary" style={{ color: 'var(--ink-mute)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>pause</span>
                일시중지
              </button>
            }
            {openDetail?.status === 'draft' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>play_arrow</span>
                게재 시작
              </button>
            }
          </>
        }>

        {openDetail && <CampaignDetailPanel c={openDetail} />}
      </AdminDetailModal>
    </AdminShell>);

}

function CampaignDetailPanel({ c }) {
  const cr = c.clicks > 0 ? c.conversions / c.clicks : null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={c.status_tone}>{c.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">
          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{c.channel_icon}</span>
          {c.channel_label}
        </span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{c.campaign_id}</span>
      </div>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>집행 / 예산</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ff-mono)', marginTop: 4 }}>
            {FMT_KRW(c.spent)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>/ {FMT_KRW(c.budget)}</div>
          {c.budget > 0 &&
          <div style={{ marginTop: 8, height: 4, background: 'var(--bg-card)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, c.spent / c.budget * 100)}%`, background: 'var(--accent)' }} />
            </div>
          }
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>ROI</div>
          <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--ff-display)', color: c.roi >= 2 ? 'var(--accent)' : 'inherit', marginTop: 4 }}>
            {c.roi != null ? `${c.roi.toFixed(1)}×` : '—'}
          </div>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>노출</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ff-mono)', marginTop: 4 }}>{c.impressions.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>클릭</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ff-mono)', marginTop: 4 }}>{c.clicks.toLocaleString()}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>전환</div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--ff-mono)', color: cr >= 0.02 ? 'var(--ok)' : 'inherit', marginTop: 4 }}>
            {c.conversions}
            {cr != null &&
            <span style={{ fontSize: 11, color: 'var(--ink-mute)', fontWeight: 400, marginLeft: 4 }}>
                ({(cr * 100).toFixed(1)}%)
              </span>
            }
          </div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>캠페인 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>채널</dt>
          <dd style={{ margin: 0 }}>{c.channel_label}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>파트너</dt>
          <dd style={{ margin: 0 }}>{c.partner_name}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>시작</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{c.starts_at}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>종료</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{c.ends_at}</dd>
        </dl>
      </section>
    </div>);

}

window.AdminCampaigns = AdminCampaigns;
