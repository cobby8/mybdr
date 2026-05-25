/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminOrganizations.jsx — Admin-C 외부관리 · 단체 승인 관리 (v2.13 신규)
//   진입: setRoute('adminOrganizations')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → AdminDataTable EmptyState
//
// 운영 source: src/app/(admin)/admin/organizations/page.tsx (228줄)
// 패턴: AdminTournaments / AdminPartners prototype 재사용
// 차별화: 거절 사유 모달 (textarea) + 단체 = 외부 organization
// 위치: ADMIN_NAV 외부 관리 그룹 첫 항목 / icon `domain`
// =====================================================================

const ADMIN_ORG_DATA = [
{
  org_id: 'org_2026_seoul_united',
  name: '서울 유나이티드 농구회',
  region: '서울',
  status: 'pending',
  status_label: '대기',
  status_tone: 'warn',
  owner_name: '김선영',
  owner_email: 'sy.kim@united.kr',
  owner_user_id: 'u_2025_kimsunyoung',
  series_count: 0,
  member_count: 0,
  applied_at: '2026-05-13 09:14',
  reviewed_at: null,
  reviewer_name: null,
  reject_reason: null,
  summary: '서울 권역 자체 리그 운영 단체. 본인 인증 완료. 4 시리즈 운영 예정.'
},
{
  org_id: 'org_2026_mapo_arena',
  name: '마포 아레나 농구단',
  region: '서울 마포',
  status: 'pending',
  status_label: '대기',
  status_tone: 'warn',
  owner_name: '신민호',
  owner_email: 'mh.shin@mapo-arena.kr',
  owner_user_id: 'u_2025_shinminho',
  series_count: 0,
  member_count: 0,
  applied_at: '2026-05-12 14:22',
  reviewed_at: null,
  reviewer_name: null,
  reject_reason: null,
  summary: '마포 아레나 코트 부속 단체. 자체 시리즈 + 멤버 관리 요청.'
},
{
  org_id: 'org_2026_paint_ref',
  name: 'Paint Referees Co.',
  region: '서울',
  status: 'pending',
  status_label: '대기',
  status_tone: 'warn',
  owner_name: '한태영',
  owner_email: 'ty.han@paintref.kr',
  owner_user_id: 'u_2025_hantaeyoung',
  series_count: 0,
  member_count: 0,
  applied_at: '2026-05-10 16:08',
  reviewed_at: null,
  reviewer_name: null,
  reject_reason: null,
  summary: '심판 협력 단체. 자격 검증 진행중.'
},
{
  org_id: 'org_2025_seoul_3x3',
  name: '서울 3x3 위원회',
  region: '서울',
  status: 'approved',
  status_label: '승인',
  status_tone: 'ok',
  owner_name: '김선영',
  owner_email: 'sy.kim@seoul3x3.or.kr',
  owner_user_id: 'u_2024_kimsunyoung',
  series_count: 4,
  member_count: 18,
  applied_at: '2024-01-15 10:00',
  reviewed_at: '2024-01-17 09:42',
  reviewer_name: '김도훈',
  reject_reason: null,
  summary: '공식 협력 협회. 4 시리즈 운영중 (서머/윈터/스프링/오픈).'
},
{
  org_id: 'org_2025_kangnam_hoops',
  name: '강남 후프스',
  region: '서울 강남',
  status: 'approved',
  status_label: '승인',
  status_tone: 'ok',
  owner_name: '서민지',
  owner_email: 'mj.seo@knhoops.kr',
  owner_user_id: 'u_2024_seominji',
  series_count: 2,
  member_count: 11,
  applied_at: '2024-05-21 14:00',
  reviewed_at: '2024-05-22 11:18',
  reviewer_name: '이박재',
  reject_reason: null,
  summary: '강남 권역 클럽 단체. 2 시리즈 운영중.'
},
{
  org_id: 'org_2025_runngun',
  name: 'Run N Gun 동호회',
  region: '서울 마포',
  status: 'approved',
  status_label: '승인',
  status_tone: 'ok',
  owner_name: '오영진',
  owner_email: 'oyj@example.com',
  owner_user_id: 'u_2025_ohyeongjin',
  series_count: 1,
  member_count: 12,
  applied_at: '2024-03-14 18:42',
  reviewed_at: '2024-03-16 09:14',
  reviewer_name: '김도훈',
  reject_reason: null,
  summary: '자체 동호회 등록. 서머 오픈 시리즈 1건 운영중.'
},
{
  org_id: 'org_2026_haterstuff',
  name: 'HaterStuff Sports',
  region: '서울 광진',
  status: 'rejected',
  status_label: '거절',
  status_tone: 'err',
  owner_name: 'haterstuff',
  owner_email: 'hs@example.com',
  owner_user_id: 'u_2025_haterstuff',
  series_count: 0,
  member_count: 0,
  applied_at: '2026-04-22 02:11',
  reviewed_at: '2026-04-23 11:00',
  reviewer_name: '김도훈',
  reject_reason: '소유자 계정 신고 4건 누적. 단체 등록 부적격으로 판단.',
  summary: '단체 등록 신청 — 소유자 본인 신고 누적으로 거절.'
}];

window.ADMIN_ORG_DATA = ADMIN_ORG_DATA;

function AdminOrganizations({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  // default = 'pending' (운영 명세)
  const [statusTab, setStatusTab] = React.useState('pending');
  const [search, setSearch] = React.useState('');
  const [regionFilter, setRegionFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'applied_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);
  const [rejectFor, setRejectFor] = React.useState(null);
  const [rejectReason, setRejectReason] = React.useState('');

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_ORG_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.owner_name.toLowerCase().includes(q) ||
      r.owner_email.toLowerCase().includes(q));
    }
    if (regionFilter !== 'all') rows = rows.filter((r) => r.region === regionFilter);
    rows.sort((a, b) => {
      const va = a[sort.key], vb = b[sort.key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, regionFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_ORG_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return { all: base.length, pending: by('pending'), approved: by('approved'), rejected: by('rejected') };
  }, [mockState]);

  const perPage = 6;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const regions = ['all', ...new Set(ADMIN_ORG_DATA.map((r) => r.region))];

  const columns = [
  { key: 'name', label: '단체', sortable: true, width: '24%',
    render: (r) =>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>domain</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
          <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.summary}</span>
        </div>
      </div>
  },
  { key: 'owner_name', label: '소유자', sortable: true, width: 140,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, color: 'var(--ink)' }}>{r.owner_name}</span>
        <span style={{ fontSize: 10.5, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>{r.owner_email}</span>
      </div>
  },
  { key: 'region', label: '지역', sortable: true, width: 110,
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.region}</span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'series_count', label: '시리즈', sortable: true, width: 70, align: 'right',
    render: (r) =>
    r.series_count > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{r.series_count}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'member_count', label: '멤버', sortable: true, width: 70, align: 'right',
    render: (r) =>
    r.member_count > 0 ?
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{r.member_count}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>—</span>
  },
  { key: 'applied_at', label: '신청일', sortable: true, width: 130,
    render: (r) => {
      const [d, t] = r.applied_at.split(' ');
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{d}</span>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{t}</span>
        </div>);

    }
  },
  { key: '_quick', label: '액션', width: 160,
    render: (r) =>
    r.status === 'pending' ?
    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn--sm btn--primary" onClick={() => { /* mock approve */ }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
            승인
          </button>
          <button type="button" className="btn btn--sm" onClick={() => { setRejectFor(r); setRejectReason(''); }} style={{ color: 'var(--err)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
            거절
          </button>
        </div> :
    r.status === 'rejected' ?
    <div style={{ display: 'flex', gap: 4 }} onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn--sm">재검토</button>
        </div> :

    <button type="button" className="btn btn--sm" onClick={(e) => { e.stopPropagation(); setOpenDetail(r); }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>visibility</span>
          상세
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
      route="adminOrganizations"
      setRoute={setRoute}
      eyebrow="ADMIN · 외부 관리"
      title="단체 관리"
      subtitle="단체 신청 승인/거절 및 전체 단체 목록을 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '외부 관리' },
      { label: '단체 관리' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV 내보내기
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'pending', label: '대기', count: counts.pending },
        { key: 'approved', label: '승인', count: counts.approved },
        { key: 'rejected', label: '거절', count: counts.rejected },
        { key: 'all', label: '전체', count: counts.all }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '단체명·소유자·이메일 검색' }}
        filters={[
        { key: 'region', label: '지역', value: regionFilter, onChange: (v) => { setRegionFilter(v); setPage(1); },
          options: regions.map((o) => ({ value: o, label: o === 'all' ? '전체' : o })) }]
        }
        onReset={() => { setSearch(''); setRegionFilter('all'); setStatusTab('pending'); setPage(1); }}
        actions={selected.length > 0 && statusTab === 'pending' &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}건 선택</span>
            <button type="button" className="btn btn--sm btn--primary">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              일괄 승인
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="org_id"
        state={mockState}
        emptyTitle={statusTab === 'pending' ? '대기 중인 신청이 없어요' : statusTab === 'all' && !search ? '등록된 단체가 없어요' : '조건에 맞는 단체가 없어요'}
        emptyDesc={statusTab === 'pending' ? '새 신청이 도착하면 이곳에 표시됩니다.' : statusTab === 'all' && !search ? '단체 등록 신청이 발생하면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'pending' ? '승인 완료 보기' : statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'pending') setStatusTab('approved');
          else if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setRegionFilter('all'); setStatusTab('pending'); }
        }}
        sort={sort}
        onSortChange={setSort}
        selectable={statusTab === 'pending'}
        selected={selected}
        onSelectChange={setSelected}
        onRowClick={(r) => setOpenDetail(r)}
        pagination={{ page, total: filtered.length, perPage, onChange: setPage }} />


      {/* 상세 모달 */}
      <AdminDetailModal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title={openDetail ? openDetail.name : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            {openDetail?.status === 'pending' &&
            <>
                <button type="button" className="btn" onClick={() => { setRejectFor(openDetail); setRejectReason(''); setOpenDetail(null); }} style={{ color: 'var(--err)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  거절
                </button>
                <button type="button" className="btn btn--primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                  승인
                </button>
              </>
            }
          </>
        }>

        {openDetail && <OrgDetailPanel o={openDetail} />}
      </AdminDetailModal>

      {/* 거절 사유 모달 */}
      <AdminDetailModal
        open={!!rejectFor}
        onClose={() => setRejectFor(null)}
        title={rejectFor ? `거절 — ${rejectFor.name}` : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setRejectFor(null)}>취소</button>
            <button
            type="button"
            className="btn btn--primary"
            disabled={rejectReason.trim().length < 10}
            style={{ background: rejectReason.trim().length >= 10 ? 'var(--err)' : 'var(--ink-dim)', borderColor: rejectReason.trim().length >= 10 ? 'var(--err)' : 'var(--ink-dim)', color: '#fff', opacity: rejectReason.trim().length >= 10 ? 1 : 0.5 }}>

              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
              거절 처리
            </button>
          </>
        }>

        {rejectFor &&
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: 12, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>{rejectFor.owner_name}</strong> 의 단체 등록 신청을 거절합니다. 거절 사유는 신청자에게 이메일로 발송되며, 감사 로그에 보관됩니다.
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                거절 사유 <span style={{ color: 'var(--err)' }}>*</span> <span style={{ textTransform: 'none', letterSpacing: 0, color: 'var(--ink-mute)' }}>(최소 10자)</span>
              </label>
              <textarea
              rows={4}
              placeholder="예: 단체 운영 계획서가 누락되었습니다. 재신청 시 첨부 부탁드립니다."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13.5, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />

              <div style={{ marginTop: 4, fontSize: 11, color: rejectReason.length >= 10 ? 'var(--ok)' : 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', textAlign: 'right' }}>
                {rejectReason.length} / 500
              </div>
            </div>
          </div>
        }
      </AdminDetailModal>
    </AdminShell>);

}

function OrgDetailPanel({ o }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={o.status_tone}>{o.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{o.region}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{o.org_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>소개</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{o.summary}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>시리즈</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{o.series_count}</div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>멤버</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4 }}>{o.member_count}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>소유자 / 심사</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>소유자</dt>
          <dd style={{ margin: 0 }}>{o.owner_name} <span style={{ color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginLeft: 4 }}>{o.owner_user_id}</span></dd>
          <dt style={{ color: 'var(--ink-mute)' }}>이메일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{o.owner_email}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>신청일</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{o.applied_at}</dd>
          {o.reviewed_at &&
          <>
              <dt style={{ color: 'var(--ink-mute)' }}>심사일</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{o.reviewed_at}</dd>
              <dt style={{ color: 'var(--ink-mute)' }}>심사자</dt>
              <dd style={{ margin: 0 }}>{o.reviewer_name}</dd>
            </>
          }
        </dl>
      </section>

      {o.reject_reason &&
      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14, borderLeft: '3px solid var(--err)' }}>
          <div style={{ fontSize: 11, color: 'var(--err)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>거절 사유</div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>{o.reject_reason}</p>
        </section>
      }
    </div>);

}

window.AdminOrganizations = AdminOrganizations;
