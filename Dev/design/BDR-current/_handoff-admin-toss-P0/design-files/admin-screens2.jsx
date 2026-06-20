/* global React, window, Icon, Btn, Badge, StatusTabs, FilterBar, DataTable, DetailModal, PanelStat, PanelRow, StatCard, MockToggle, PageHead, useTable, applySort */

// =====================================================================
// admin-screens2.jsx — 콘솔 Phase 2 (대시보드/결제/코트/팀/설정)
//   admin-screens.jsx 의 PageHead/useTable/applySort 재사용 (window 노출 필요)
// =====================================================================

const A2 = () => window.ADMIN;
const PER2 = 6;
const ph = (p) => window.__PH(p);

// ════════════════════════════════════════════════ 대시보드
function AdminDashboard({ go }) {
  const D = A2().DASH;
  const max = Math.max(...D.chart.map((c) => c.n));
  const sevColor = { ok: 'var(--ok)', warn: 'var(--warn)', danger: 'var(--danger)', primary: 'var(--primary)' };
  return (
    <div>
      {ph({ eyebrow: 'ADMIN · 대시보드', title: '관리자 대시보드', sub: '유저·대회·경기·팀 통계와 최근 활동을 한 눈에 확인합니다.',
        actions: <><window.Btn variant="secondary" icon="download">리포트</window.Btn><window.Btn icon="plus" onClick={() => go('tournaments')}>새 대회</window.Btn></> })}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 20 }}>
        {D.stats.map((s, i) => <StatCard key={i} {...s} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)', gap: 16 }} className="dash-grid">
        <div className="ts-card">
          <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>활동 추이</div>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 2, marginBottom: 20 }}>신규 가입 · 최근 7일</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180 }}>
            {D.chart.map((c, i) =>
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)' }}>{c.n}</span>
                <div style={{ width: '100%', maxWidth: 36, height: `${(c.n / max) * 130}px`, background: 'var(--primary)', borderRadius: 8 }} />
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-dim)' }}>{c.d}</span>
              </div>)}
          </div>
        </div>
        <div className="ts-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--ink)' }}>최근 활동</span>
            <button type="button" style={{ background: 'none', border: 0, color: 'var(--ink-mute)', fontSize: 13, cursor: 'pointer' }}>전체 →</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {D.logs.map((l) =>
              <div key={l.id} style={{ display: 'flex', gap: 10, padding: '11px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 50, background: sevColor[l.sev], flex: '0 0 auto', marginTop: 5 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)' }}>{l.action}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.desc}</div>
                </div>
                <div style={{ textAlign: 'right', flex: '0 0 auto' }}><div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{l.who}</div><div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{l.when}</div></div>
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}

// ════════════════════════════════════════════════ 결제
function AdminPayments() {
  const t = useTable({ key: 'when', dir: 'desc' });
  const D = A2();
  const counts = { all: D.PAYMENTS.length };
  Object.keys(D.PAY_STATUS).forEach((k) => counts[k] = D.PAYMENTS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.PAYMENTS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.ref.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER2, t.page * PER2);
  const revenue = D.PAYMENTS.filter((x) => x.status === 'paid').reduce((a, x) => a + x.amount, 0);
  const columns = [
    { key: 'ref', label: '거래', sortable: true, width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.ref}</span> },
    { key: 'type', label: '유형', sortable: true, width: 80, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 'amount', label: '금액', sortable: true, width: 110, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--ink)' }}>{r.amount.toLocaleString()}원</span> },
    { key: 'method', label: '수단', sortable: true, width: 90 },
    { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.PAY_STATUS[r.status].tone}>{D.PAY_STATUS[r.status].label}</Badge> },
    { key: 'when', label: '일시', sortable: true, width: 140, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when.slice(5)}</span> },
  ];
  return (
    <div>
      {ph({ eyebrow: 'ADMIN · 결제', title: '결제 관리', sub: '참가비·구독·예약·광고 결제 내역을 확인하고 환불을 처리합니다.',
        actions: <><MockToggle value={t.mock} onChange={t.setMock} /><Btn variant="secondary" icon="download">정산</Btn></> })}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 18 }}>
        <StatCard icon="trending-up" label="입금 완료 매출" value={`${(revenue / 10000).toLocaleString()}만원`} trend="up" />
        <StatCard icon="clock" label="입금 대기" value={`${counts.pending}건`} />
        <StatCard icon="x-circle" label="실패·환불" value={`${counts.failed + counts.refunded}건`} />
      </div>
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'paid', label: '완료', count: counts.paid }, { key: 'pending', label: '대기', count: counts.pending }, { key: 'refunded', label: '환불', count: counts.refunded }, { key: 'failed', label: '실패', count: counts.failed }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '거래 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER2, onChange: t.setPage }} emptyTitle="결제 내역이 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title="결제 상세"
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>{t.detail?.status === 'paid' && <Btn variant="danger">환불 처리</Btn>}</>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{t.detail.amount.toLocaleString()}원</div>
          <Badge tone={D.PAY_STATUS[t.detail.status].tone}>{D.PAY_STATUS[t.detail.status].label}</Badge>
          <div><PanelRow label="거래" value={t.detail.ref} /><PanelRow label="유형" value={t.detail.type} /><PanelRow label="수단" value={t.detail.method} /><PanelRow label="일시" value={t.detail.when} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 코트
function AdminCourts() {
  const t = useTable({ key: 'name', dir: 'asc' });
  const D = A2();
  const counts = { all: D.COURTS.length };
  Object.keys(D.COURT_STATUS).forEach((k) => counts[k] = D.COURTS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.COURTS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.name.includes(t.search) || x.region.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER2, t.page * PER2);
  const columns = [
    { key: 'name', label: '코트', sortable: true, width: '1.8fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
    { key: 'region', label: '지역', sortable: true, width: 110 },
    { key: 'type', label: '유형', sortable: true, width: 70, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 'rate', label: '시간당', sortable: true, width: 100, align: 'right', render: (r) => r.rate > 0 ? <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.rate.toLocaleString()}원</span> : <span style={{ color: 'var(--ok)', fontWeight: 700, fontSize: 13 }}>무료</span> },
    { key: 'owner', label: '운영', sortable: true, width: '1.2fr' },
    { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.COURT_STATUS[r.status].tone}>{D.COURT_STATUS[r.status].label}</Badge> },
  ];
  return (
    <div>
      {ph({ eyebrow: 'ADMIN · 코트', title: '코트 관리', sub: '등록된 코트를 관리하고 신규 등록 신청을 승인합니다.', actions: <MockToggle value={t.mock} onChange={t.setMock} /> })}
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'active', label: '운영중', count: counts.active }, { key: 'pending', label: '승인대기', count: counts.pending }, { key: 'inactive', label: '중단', count: counts.inactive }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '코트 · 지역 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER2, onChange: t.setPage }} emptyTitle="코트가 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.name}
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>{t.detail?.status === 'pending' && <Btn icon="check">승인</Btn>}</>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}><Badge tone="grey">{t.detail.type}</Badge><Badge tone={D.COURT_STATUS[t.detail.status].tone}>{D.COURT_STATUS[t.detail.status].label}</Badge></div>
          <div><PanelRow label="지역" value={t.detail.region} /><PanelRow label="시간당 요금" value={t.detail.rate > 0 ? `${t.detail.rate.toLocaleString()}원` : '무료'} /><PanelRow label="운영 주체" value={t.detail.owner} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 팀
function AdminTeams() {
  const t = useTable({ key: 'members', dir: 'desc' });
  const D = A2();
  const counts = { all: D.TEAMS.length };
  Object.keys(D.TEAM_STATUS).forEach((k) => counts[k] = D.TEAMS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.TEAMS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.name.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER2, t.page * PER2);
  const columns = [
    { key: 'name', label: '팀명', sortable: true, width: '1.4fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
    { key: 'region', label: '지역', sortable: true, width: 110 },
    { key: 'members', label: '인원', sortable: true, width: 64, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.members}</span> },
    { key: 'org', label: '소속 단체', sortable: true, width: '1.4fr', render: (r) => r.org === '—' ? <span style={{ color: 'var(--ink-dim)' }}>—</span> : r.org },
    { key: 'tournaments', label: '대회', sortable: true, width: 64, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.tournaments}</span> },
    { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.TEAM_STATUS[r.status].tone}>{D.TEAM_STATUS[r.status].label}</Badge> },
  ];
  return (
    <div>
      {ph({ eyebrow: 'ADMIN · 팀', title: '팀 관리', sub: '등록된 팀과 소속 단체·대회 참가 현황을 관리합니다.', actions: <MockToggle value={t.mock} onChange={t.setMock} /> })}
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'active', label: '활성', count: counts.active }, { key: 'dormant', label: '휴면', count: counts.dormant }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '팀명 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER2, onChange: t.setPage }} emptyTitle="팀이 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.name}
        footer={<Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge tone={D.TEAM_STATUS[t.detail.status].tone}>{D.TEAM_STATUS[t.detail.status].label}</Badge>
          <div style={{ display: 'flex', gap: 8 }}><PanelStat label="인원" value={t.detail.members} /><PanelStat label="대회 참가" value={t.detail.tournaments} /></div>
          <div><PanelRow label="지역" value={t.detail.region} /><PanelRow label="소속 단체" value={t.detail.org} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 설정
function AdminSettings({ master, setMaster, toast }) {
  const [tab, setTab] = React.useState('category');
  return (
    <div>
      {ph({ eyebrow: 'ADMIN · 설정', title: '설정', sub: '종별 마스터·대표자·일반 설정을 관리합니다.' })}
      <div className="ts-segment" style={{ maxWidth: 380, marginBottom: 22 }}>
        {[['category', '종별 마스터'], ['general', '일반'], ['admins', '대표자']].map(([k, l]) =>
          <button key={k} type="button" className="ts-segment__btn" data-active={tab === k ? 'true' : 'false'} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === 'category' && <window.CategoryMaster master={master} setMaster={setMaster} toast={toast} embedded />}
      {tab === 'general' &&
        <div className="ts-card" style={{ maxWidth: 560 }}>
          <PanelRow label="서비스명" value="MyBDR" /><PanelRow label="기본 통화" value="KRW (원)" /><PanelRow label="대회 자동 마감" value="정원 도달 시 대기접수 전환" /><PanelRow label="입금 확인" value="입금완료 → 자동 참가확정" />
        </div>}
      {tab === 'admins' &&
        <div className="ts-card" style={{ maxWidth: 560 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['김도훈', 'super admin'], ['이박재', 'admin'], ['정세훈', 'tournament admin']].map(([n, r]) =>
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="ts-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{n.slice(0, 2)}</span>
                <span style={{ flex: 1, fontWeight: 700, color: 'var(--ink)' }}>{n}</span><Badge tone="grey">{r}</Badge>
              </div>)}
          </div>
        </div>}
    </div>);
}

Object.assign(window, { AdminDashboard, AdminPayments, AdminCourts, AdminTeams, AdminSettings });
