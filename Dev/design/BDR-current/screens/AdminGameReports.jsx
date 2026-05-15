/* global React, AdminShell, AdminStatusTabs, AdminDataTable, AdminFilterBar, AdminDetailModal */

// =====================================================================
// AdminGameReports.jsx — Admin-C 사용자 그룹 · 신고 검토 (v2.12 · G3 rename)
//   진입: setRoute('adminGameReports')
//   복귀: setRoute('adminDashboard') · adminUsers
//   에러: state='error' → AdminDataTable 내부 EmptyState
//
// 운영 라우트 /admin/game-reports 와 키 일관성 (gap-audit 2026-05-15)
// 페이지 내용 변경 0 — 파일·함수·라우트 키만 리네이밍 (Reports → GameReports)
//
// 패턴: AdminTournaments prototype 재사용
// 차별화: 우선도(critical/high/normal/low) + 신고자수 + 신고 사유
// =====================================================================

const ADMIN_REPORTS_DATA = [
{
  report_id: 'r_20260514_1042',
  target_type: 'user',
  target_label: '유저',
  target_name: 'thunderdunk',
  target_id: 'u_2025_bannedguy',
  reason: 'abuse',
  reason_label: '욕설·비방',
  reporter_count: 4,
  priority: 'critical',
  priority_label: '긴급',
  priority_tone: 'err',
  status: 'open',
  status_label: '미처리',
  status_tone: 'err',
  assignee: null,
  reported_at: '2026-05-14 10:42',
  summary: '경기 종료 후 채팅창에서 상대팀 멤버 다수에게 반복적으로 욕설.'
},
{
  report_id: 'r_20260513_2218',
  target_type: 'post',
  target_label: '게시물',
  target_name: '판매글 · 농구화 SALE',
  target_id: 'p_20260513_007',
  reason: 'spam',
  reason_label: '상업·스팸',
  reporter_count: 7,
  priority: 'high',
  priority_label: '높음',
  priority_tone: 'warn',
  status: 'open',
  status_label: '미처리',
  status_tone: 'err',
  assignee: null,
  reported_at: '2026-05-13 22:18',
  summary: '자유게시판에 동일 판매 글 다회 게시. 외부 결제 링크 포함.'
},
{
  report_id: 'r_20260512_1830',
  target_type: 'user',
  target_label: '유저',
  target_name: 'no_chill',
  target_id: 'u_2025_trashtalk',
  reason: 'no_show',
  reason_label: '잠수·노쇼',
  reporter_count: 2,
  priority: 'normal',
  priority_label: '보통',
  priority_tone: 'info',
  status: 'in_review',
  status_label: '처리중',
  status_tone: 'warn',
  assignee: '김도훈',
  reported_at: '2026-05-12 18:30',
  summary: '예약된 게스트 경기 무단 불참 2회. 사전 통보 없음.'
},
{
  report_id: 'r_20260511_0912',
  target_type: 'team',
  target_label: '팀',
  target_name: 'OMEGA',
  target_id: 'tm_omega',
  reason: 'roster_fraud',
  reason_label: '로스터 부정',
  reporter_count: 1,
  priority: 'high',
  priority_label: '높음',
  priority_tone: 'warn',
  status: 'in_review',
  status_label: '처리중',
  status_tone: 'warn',
  assignee: '김도훈',
  reported_at: '2026-05-11 09:12',
  summary: '대회 출전 로스터에 등록되지 않은 선수 출전 의혹.'
},
{
  report_id: 'r_20260509_1430',
  target_type: 'court',
  target_label: '코트',
  target_name: '강남 베이스코트',
  target_id: 'ct_kn_base',
  reason: 'facility',
  reason_label: '시설 문제',
  reporter_count: 3,
  priority: 'normal',
  priority_label: '보통',
  priority_tone: 'info',
  status: 'resolved',
  status_label: '완료',
  status_tone: 'ok',
  assignee: '이박재',
  reported_at: '2026-05-09 14:30',
  resolved_at: '2026-05-11 18:00',
  summary: '코트 라인 마모 심함. 사진 첨부. → 시설 측 5/11 보수 완료.'
},
{
  report_id: 'r_20260507_1118',
  target_type: 'post',
  target_label: '게시물',
  target_name: '댓글 · 자유게시판 #3421',
  target_id: 'c_20260507_3421',
  reason: 'abuse',
  reason_label: '욕설·비방',
  reporter_count: 2,
  priority: 'normal',
  priority_label: '보통',
  priority_tone: 'info',
  status: 'resolved',
  status_label: '완료',
  status_tone: 'ok',
  assignee: '김도훈',
  reported_at: '2026-05-07 11:18',
  resolved_at: '2026-05-07 16:42',
  summary: '댓글 욕설 신고. → 댓글 삭제 + 작성자 경고 처리.'
},
{
  report_id: 'r_20260505_2010',
  target_type: 'user',
  target_label: '유저',
  target_name: 'salty_one',
  target_id: 'u_2025_saltyone',
  reason: 'false_report',
  reason_label: '허위 신고',
  reporter_count: 1,
  priority: 'low',
  priority_label: '낮음',
  priority_tone: 'mute',
  status: 'rejected',
  status_label: '반려',
  status_tone: 'mute',
  assignee: '이박재',
  reported_at: '2026-05-05 20:10',
  resolved_at: '2026-05-06 09:30',
  summary: '경기 결과 불만에 의한 보복성 신고로 판단. 반려.'
}];

window.ADMIN_REPORTS_DATA = ADMIN_REPORTS_DATA;

function reportsStatusTab(r) {
  return r.status;
}

const PRIORITY_ORDER = { critical: 4, high: 3, normal: 2, low: 1 };

// =====================================================================
function AdminGameReports({ setRoute, theme, setTheme }) {
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const [statusTab, setStatusTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [targetFilter, setTargetFilter] = React.useState('all');
  const [sort, setSort] = React.useState({ key: 'reported_at', dir: 'desc' });
  const [page, setPage] = React.useState(1);
  const [selected, setSelected] = React.useState([]);
  const [openDetail, setOpenDetail] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = ADMIN_REPORTS_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => reportsStatusTab(r) === statusTab);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) =>
      r.target_name.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      r.report_id.toLowerCase().includes(q));
    }
    if (priorityFilter !== 'all') rows = rows.filter((r) => r.priority === priorityFilter);
    if (targetFilter !== 'all') rows = rows.filter((r) => r.target_type === targetFilter);
    rows.sort((a, b) => {
      let va = a[sort.key]; let vb = b[sort.key];
      if (sort.key === 'priority') { va = PRIORITY_ORDER[va]; vb = PRIORITY_ORDER[vb]; }
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return sort.dir === 'asc' ? -1 : 1;
      if (va > vb) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
    return rows;
  }, [statusTab, search, priorityFilter, targetFilter, sort, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : ADMIN_REPORTS_DATA;
    const by = (k) => base.filter((r) => reportsStatusTab(r) === k).length;
    return {
      all: base.length,
      open: by('open'),
      in_review: by('in_review'),
      resolved: by('resolved'),
      rejected: by('rejected')
    };
  }, [mockState]);

  const perPage = 5;
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const priorities = ['all', 'critical', 'high', 'normal', 'low'];
  const targets = ['all', ...new Set(ADMIN_REPORTS_DATA.map((r) => r.target_type))];

  const columns = [
  { key: 'priority', label: '우선도', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.priority_tone}>{r.priority_label}</span>
  },
  { key: 'target_name', label: '대상', sortable: true, width: '28%',
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="admin-stat-pill" data-tone="mute" style={{ flexShrink: 0 }}>{r.target_label}</span>
          <span style={{ fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.target_name}</span>
        </div>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {r.summary}
        </span>
      </div>
  },
  { key: 'reason', label: '사유', sortable: true, width: 110,
    render: (r) =>
    <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>{r.reason_label}</span>
  },
  { key: 'reporter_count', label: '신고자', sortable: true, width: 70, align: 'right',
    render: (r) =>
    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 600, color: r.reporter_count >= 5 ? 'var(--err)' : 'var(--ink)' }}>
        {r.reporter_count}
      </span>
  },
  { key: 'status', label: '상태', sortable: true, width: 80,
    render: (r) =>
    <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
  },
  { key: 'assignee', label: '담당자', sortable: true, width: 80,
    render: (r) =>
    r.assignee ?
    <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{r.assignee}</span> :
    <span style={{ fontSize: 11, color: 'var(--ink-dim)' }}>미배정</span>
  },
  { key: 'reported_at', label: '접수', sortable: true, width: 110,
    render: (r) =>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink)' }}>{r.reported_at.split(' ')[0]}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{r.reported_at.split(' ')[1]}</span>
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
      route="adminGameReports"
      setRoute={setRoute}
      eyebrow="ADMIN · 사용자"
      title="신고 검토"
      subtitle="유저·게시물·팀·코트 신고를 우선도별로 검토하고 처리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '사용자' },
      { label: '신고 검토' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminUsers')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
            유저 관리로
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>rule</span>
            처리 규정
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'open', label: '미처리', count: counts.open },
        { key: 'in_review', label: '처리중', count: counts.in_review },
        { key: 'resolved', label: '완료', count: counts.resolved },
        { key: 'rejected', label: '반려', count: counts.rejected }]
        }
        current={statusTab}
        onChange={(k) => { setStatusTab(k); setPage(1); }} />


      <AdminFilterBar
        search={{ value: search, onChange: (v) => { setSearch(v); setPage(1); }, placeholder: '대상·내용·ID 검색' }}
        filters={[
        { key: 'priority', label: '우선도', value: priorityFilter, onChange: (v) => { setPriorityFilter(v); setPage(1); },
          options: priorities.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'critical' ? '긴급' :
            o === 'high' ? '높음' :
            o === 'normal' ? '보통' : '낮음'
          })) },
        { key: 'target', label: '대상유형', value: targetFilter, onChange: (v) => { setTargetFilter(v); setPage(1); },
          options: targets.map((o) => ({
            value: o,
            label: o === 'all' ? '전체' :
            o === 'user' ? '유저' :
            o === 'post' ? '게시물' :
            o === 'team' ? '팀' :
            o === 'court' ? '코트' : o
          })) }]
        }
        onReset={() => { setSearch(''); setPriorityFilter('all'); setTargetFilter('all'); setStatusTab('all'); setPage(1); }}
        actions={selected.length > 0 &&
        <>
            <span style={{ fontSize: 12, color: 'var(--ink-mute)', alignSelf: 'center' }}>{selected.length}건 선택</span>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person_add</span>
              나에게 배정
            </button>
            <button type="button" className="btn btn--sm">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              일괄 처리
            </button>
            <button type="button" className="btn btn--sm" style={{ color: 'var(--ink-mute)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
              반려
            </button>
          </>
        } />


      <AdminDataTable
        columns={columns}
        rows={paginated}
        keyField="report_id"
        state={mockState}
        emptyTitle={statusTab === 'all' && !search ? '신고가 없어요' : '조건에 맞는 신고가 없어요'}
        emptyDesc={statusTab === 'all' && !search ? '미처리 신고가 접수되면 이곳에 표시됩니다.' : '필터를 초기화하거나 다른 검색어를 입력하세요.'}
        emptyCtaLabel={statusTab === 'all' && !search ? '대시보드로' : '필터 초기화'}
        onEmptyCta={() => {
          if (statusTab === 'all' && !search) setRoute('adminDashboard');
          else { setSearch(''); setPriorityFilter('all'); setTargetFilter('all'); setStatusTab('all'); }
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
        title={openDetail ? `${openDetail.target_label} · ${openDetail.target_name}` : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            {openDetail?.target_type === 'user' &&
            <button type="button" className="btn" onClick={() => setRoute('adminUsers')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>group</span>
                유저 보기
              </button>
            }
            {openDetail?.status === 'open' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                나에게 배정
              </button>
            }
            {openDetail?.status === 'in_review' &&
            <button type="button" className="btn btn--primary">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                처리 완료
              </button>
            }
          </>
        }>

        {openDetail && <ReportDetailPanel r={openDetail} setRoute={setRoute} />}
      </AdminDetailModal>
    </AdminShell>);

}

function ReportDetailPanel({ r, setRoute }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, fontSize: 13.5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <span className="admin-stat-pill" data-tone={r.priority_tone}>{r.priority_label}</span>
        <span className="admin-stat-pill" data-tone={r.status_tone}>{r.status_label}</span>
        <span className="admin-stat-pill" data-tone="mute">{r.reason_label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{r.report_id}</span>
      </div>

      <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>신고 내용</div>
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{r.summary}</p>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>신고자</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', marginTop: 4, color: r.reporter_count >= 5 ? 'var(--err)' : 'inherit' }}>
            {r.reporter_count}<span style={{ fontSize: 12, fontWeight: 400, color: 'var(--ink-mute)', marginLeft: 4 }}>명</span>
          </div>
        </div>
        <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>대상 ID</div>
          <div style={{ fontSize: 13, fontFamily: 'var(--ff-mono)', marginTop: 6, color: 'var(--ink-soft)' }}>{r.target_id}</div>
        </div>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>처리 정보</div>
        <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0 }}>
          <dt style={{ color: 'var(--ink-mute)' }}>담당자</dt>
          <dd style={{ margin: 0 }}>{r.assignee || '미배정'}</dd>
          <dt style={{ color: 'var(--ink-mute)' }}>접수</dt>
          <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{r.reported_at}</dd>
          {r.resolved_at &&
          <>
              <dt style={{ color: 'var(--ink-mute)' }}>처리 완료</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{r.resolved_at}</dd>
            </>
          }
        </dl>
      </section>

      <section>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>운영 액션</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {r.status === 'open' &&
          <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
              나에게 배정
            </button>
          }
          {r.status === 'in_review' &&
          <>
              <button type="button" className="btn btn--primary" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span>
                처리 완료로
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                반려
              </button>
            </>
          }
          {(r.status === 'resolved' || r.status === 'rejected') &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>refresh</span>
              재오픈
            </button>
          }
          <button type="button" className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute(r.target_type === 'user' ? 'adminUsers' : r.target_type === 'team' ? 'adminTeams' : r.target_type === 'court' ? 'adminCourts' : 'adminCommunity')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
            대상 페이지 열기
          </button>
          {r.target_type === 'user' &&
          <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--err)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>block</span>
              대상 계정 정지
            </button>
          }
        </div>
      </section>
    </div>);

}

window.AdminGameReports = AdminGameReports;
