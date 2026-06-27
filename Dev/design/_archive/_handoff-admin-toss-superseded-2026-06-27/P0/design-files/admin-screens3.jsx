/* global React, window, Icon, Btn, Badge, StatusTabs, FilterBar, DataTable, DetailModal, StatCard, PanelRow, MockToggle */
// =====================================================================
// admin-screens3.jsx — 콘솔 잔여 8화면 (Toss)
//   분석 / 경기리포트 / 알림 / 캠페인 / 파트너 / 요금제 / 제안 / 로그
// =====================================================================
const A3 = () => window.ADMIN;
const PER3 = 6;
const ph3 = (p) => window.__PH(p);
const uT = (s) => window.useTable(s);
const sortBy = (r, s) => window.applySort(r, s);

function BarList({ data, max, unit, tone }) {
  const m = max || Math.max(...data.map((d) => d[1]));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {data.map(([label, v]) =>
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 84, fontSize: 13, color: 'var(--ink-soft)', fontWeight: 600, textAlign: 'right', flex: '0 0 auto' }}>{label}</span>
          <div style={{ flex: 1, height: 22, background: 'var(--grey-100)', borderRadius: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${Math.max((v / m) * 100, 3)}%`, background: tone || 'var(--primary)', borderRadius: 6 }} /></div>
          <span style={{ width: 56, fontSize: 12.5, fontFamily: 'var(--ff-mono)', color: 'var(--ink-mute)', flex: '0 0 auto' }}>{v}{unit || ''}</span>
        </div>)}
    </div>);
}

// ── 분석 ──────────────────────────────────────────────────────────────
function AdminAnalytics() {
  const D = A3().ANALYTICS;
  return (
    <div>
      {ph3({ eyebrow: 'ADMIN · 분석', title: '분석', sub: '가입·재방문·참가·매출 지표와 유입 퍼널을 확인합니다.', actions: <Btn variant="secondary" icon="download">리포트</Btn> })}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 18 }}>{D.kpis.map((s, i) => <StatCard key={i} {...s} />)}</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
        <div className="ts-card"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>지역별 참가 분포</div><div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 18 }}>시/도 기준 %</div><BarList data={D.region} unit="%" /></div>
        <div className="ts-card"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>유입 퍼널</div><div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 18 }}>방문 → 참가 확정</div><BarList data={D.funnel} max={100} unit="%" tone="var(--ok)" /></div>
      </div>
    </div>);
}

// 공통 테이블 화면 빌더
function TableScreen({ eyebrow, title, sub, dataKey, statusKey, statusMap, tabsOrder, columns, searchFields, searchPlaceholder, detailTitle, detailBody, actions }) {
  const t = uT(columns.find((c) => c.sortable)?.key ? { key: columns.find((c) => c.sortable).key, dir: 'desc' } : null);
  const D = A3();
  const all = D[dataKey];
  const counts = { all: all.length };
  if (statusMap) Object.keys(statusMap).forEach((k) => counts[k] = all.filter((x) => x[statusKey] === k).length);
  let rows = t.mock === 'empty' ? [] : all;
  if (statusMap && t.tab !== 'all') rows = rows.filter((x) => x[statusKey] === t.tab);
  if (t.search) rows = rows.filter((x) => searchFields.some((f) => String(x[f]).includes(t.search)));
  rows = sortBy(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER3, t.page * PER3);
  return (
    <div>
      {ph3({ eyebrow, title, sub, actions: <>{actions}<MockToggle value={t.mock} onChange={t.setMock} /></> })}
      {statusMap && <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, ...tabsOrder.map((k) => ({ key: k, label: statusMap[k].label, count: counts[k] }))]} />}
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: searchPlaceholder }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={detailBody ? t.setDetail : undefined}
        pagination={{ page: t.page, total: rows.length, perPage: PER3, onChange: t.setPage }} emptyTitle={`${title.replace(' 관리', '')} 내역이 없습니다`} />
      {detailBody && <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={detailTitle ? detailTitle(t.detail) : ''}
        footer={<Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>}>{t.detail && detailBody(t.detail)}</DetailModal>}
    </div>);
}

// ── 경기 리포트(신고) ─────────────────────────────────────────────────
function AdminReports() {
  const D = A3();
  return <TableScreen eyebrow="ADMIN · 신고" title="신고 · 리포트 관리" sub="유저·게시글·경기 신고를 검토하고 처리합니다."
    dataKey="REPORTS" statusKey="status" statusMap={D.REPORT_STATUS} tabsOrder={['pending', 'resolved', 'rejected']}
    searchFields={['target', 'reason', 'reporter']} searchPlaceholder="대상 · 사유 · 신고자"
    columns={[
      { key: 'target', label: '대상', sortable: true, width: '1.3fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.target}</span> },
      { key: 'kind', label: '유형', sortable: true, width: 80, render: (r) => <Badge tone="grey">{r.kind}</Badge> },
      { key: 'reason', label: '사유', width: '1.6fr', render: (r) => <span style={{ color: 'var(--ink-soft)' }}>{r.reason}</span> },
      { key: 'reporter', label: '신고자', sortable: true, width: 90 },
      { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.REPORT_STATUS[r.status].tone}>{D.REPORT_STATUS[r.status].label}</Badge> },
      { key: 'when', label: '일시', sortable: true, width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when.slice(5)}</span> },
    ]}
    detailTitle={(r) => `신고 · ${r.target}`} detailBody={(r) => <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><Badge tone={D.REPORT_STATUS[r.status].tone}>{D.REPORT_STATUS[r.status].label}</Badge><div><PanelRow label="대상" value={r.target} /><PanelRow label="유형" value={r.kind} /><PanelRow label="사유" value={r.reason} /><PanelRow label="신고자" value={r.reporter} /><PanelRow label="일시" value={r.when} /></div></div>} />;
}

// ── 알림 ──────────────────────────────────────────────────────────────
function AdminNotifications() {
  const D = A3();
  const [compose, setCompose] = React.useState(false);
  const [f, setF] = React.useState({ title: '', target: '전체', channel: '앱', when: 'now' });
  const setK = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <>
    <TableScreen eyebrow="ADMIN · 알림" title="알림 관리" sub="앱·SMS·이메일 알림을 발송하고 예약·임시저장을 관리합니다."
    dataKey="NOTIS" statusKey="status" statusMap={D.NOTI_STATUS} tabsOrder={['sent', 'scheduled', 'draft']}
    searchFields={['title']} searchPlaceholder="제목 검색" actions={<Btn icon="send" onClick={() => { setF({ title: '', target: '전체', channel: '앱', when: 'now' }); setCompose(true); }}>새 알림</Btn>}
    columns={[
      { key: 'title', label: '제목', sortable: true, width: '2.2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.title}</span> },
      { key: 'target', label: '대상', sortable: true, width: 100, render: (r) => <Badge tone="grey">{r.target}</Badge> },
      { key: 'channel', label: '채널', sortable: true, width: 80 },
      { key: 'sent', label: '발송수', sortable: true, width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.sent ? r.sent.toLocaleString() : '—'}</span> },
      { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.NOTI_STATUS[r.status].tone}>{D.NOTI_STATUS[r.status].label}</Badge> },
      { key: 'when', label: '일시', sortable: true, width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when === '—' ? '—' : r.when.slice(5)}</span> },
    ]} />
    <window.Modal open={compose} onClose={() => setCompose(false)} title="새 알림 작성" sub="대상과 채널을 선택해 알림을 발송하거나 예약합니다."
      foot={<><Btn variant="secondary" onClick={() => setCompose(false)} style={{ flex: 1 }}>임시저장</Btn><Btn icon={f.when === 'now' ? 'send' : 'clock'} disabled={!f.title.trim()} style={{ flex: 2, opacity: f.title.trim() ? 1 : .5 }} onClick={() => setCompose(false)}>{f.when === 'now' ? '발송' : '예약'}</Btn></>}>
      <div className="ts-field"><label className="ts-field__label">제목</label><input className="ts-input" autoFocus value={f.title} onChange={(e) => setK('title', e.target.value)} placeholder="알림 제목" /></div>
      <div className="ts-field"><label className="ts-field__label">대상</label><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{['전체', '대기팀', '미입금팀', '참가확정팀'].map((t) => <button key={t} type="button" className="ts-chip" data-active={f.target === t ? 'true' : 'false'} onClick={() => setK('target', t)}>{t}</button>)}</div></div>
      <div className="ts-field"><label className="ts-field__label">채널</label><div className="ts-segment" style={{ maxWidth: 280 }}>{['앱', 'SMS', '이메일'].map((c) => <button key={c} type="button" className="ts-segment__btn" data-active={f.channel === c ? 'true' : 'false'} onClick={() => setK('channel', c)}>{c}</button>)}</div></div>
      <div className="ts-field" style={{ marginBottom: 0 }}><label className="ts-field__label">발송 시점</label><div className="ts-segment" style={{ maxWidth: 200 }}>{[['now', '즉시 발송'], ['schedule', '예약']].map(([v, l]) => <button key={v} type="button" className="ts-segment__btn" data-active={f.when === v ? 'true' : 'false'} onClick={() => setK('when', v)}>{l}</button>)}</div></div>
    </window.Modal>
    </>);
}

// ── 캠페인 ────────────────────────────────────────────────────────────
function AdminCampaigns() {
  const D = A3();
  return <TableScreen eyebrow="ADMIN · 캠페인" title="캠페인 관리" sub="배너·푸시 캠페인의 노출·클릭 성과를 관리합니다."
    dataKey="CAMPAIGNS" statusKey="status" statusMap={D.CAMP_STATUS} tabsOrder={['active', 'scheduled', 'ended']}
    searchFields={['name']} searchPlaceholder="캠페인명" actions={<Btn icon="plus">새 캠페인</Btn>}
    columns={[
      { key: 'name', label: '캠페인', sortable: true, width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
      { key: 'type', label: '유형', sortable: true, width: 70, render: (r) => <Badge tone="grey">{r.type}</Badge> },
      { key: 'period', label: '기간', width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.period}</span> },
      { key: 'views', label: '노출', sortable: true, width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.views.toLocaleString()}</span> },
      { key: 'clicks', label: '클릭', sortable: true, width: 80, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.clicks.toLocaleString()}</span> },
      { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.CAMP_STATUS[r.status].tone}>{D.CAMP_STATUS[r.status].label}</Badge> },
    ]} />;
}

// ── 파트너 ────────────────────────────────────────────────────────────
function AdminPartners() {
  const D = A3();
  return <TableScreen eyebrow="ADMIN · 파트너" title="파트너 관리" sub="용품·시설·교육 파트너 계약을 관리합니다."
    dataKey="PARTNERS" statusKey="status" statusMap={D.PARTNER_STATUS} tabsOrder={['active', 'pending', 'ended']}
    searchFields={['name', 'field']} searchPlaceholder="파트너명 · 업종" actions={<Btn icon="plus">파트너 등록</Btn>}
    columns={[
      { key: 'name', label: '파트너', sortable: true, width: '1.8fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
      { key: 'field', label: '업종', sortable: true, width: 90, render: (r) => <Badge tone="grey">{r.field}</Badge> },
      { key: 'region', label: '지역', sortable: true, width: 120 },
      { key: 'manager', label: '담당자', sortable: true, width: 100 },
      { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.PARTNER_STATUS[r.status].tone}>{D.PARTNER_STATUS[r.status].label}</Badge> },
    ]} />;
}

// ── 제안 ──────────────────────────────────────────────────────────────
function AdminSuggestions() {
  const D = A3();
  return <TableScreen eyebrow="ADMIN · 제안" title="제안 관리" sub="유저 기능 제안을 검토하고 로드맵 반영 여부를 결정합니다."
    dataKey="SUGGESTIONS" statusKey="status" statusMap={D.SUG_STATUS} tabsOrder={['reviewing', 'planned', 'hold']}
    searchFields={['title', 'author']} searchPlaceholder="제목 · 작성자"
    columns={[
      { key: 'title', label: '제안', sortable: true, width: '2.4fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.title}</span> },
      { key: 'cat', label: '분류', sortable: true, width: 70, render: (r) => <Badge tone="grey">{r.cat}</Badge> },
      { key: 'author', label: '작성자', sortable: true, width: 90 },
      { key: 'votes', label: '추천', sortable: true, width: 80, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--primary)' }}>▲ {r.votes}</span> },
      { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.SUG_STATUS[r.status].tone}>{D.SUG_STATUS[r.status].label}</Badge> },
    ]} />;
}

// ── 요금제 (카드) ──────────────────────────────────────────────────────
function AdminPlans() {
  const D = A3();
  return (
    <div>
      {ph3({ eyebrow: 'ADMIN · 요금제', title: '요금제 관리', sub: '구독 요금제와 기능 구성을 관리합니다.', actions: <Btn icon="plus">요금제 추가</Btn> })}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {D.PLANS.map((p) =>
          <div key={p.id} className="ts-card" style={{ border: p.accent ? '2px solid var(--primary)' : '1px solid var(--border)', position: 'relative' }}>
            {p.accent && <span style={{ position: 'absolute', top: 16, right: 16 }}><Badge tone="primary">인기</Badge></span>}
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>{p.name}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '10px 0 16px' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: p.accent ? 'var(--primary)' : 'var(--ink)' }}>{p.price === 0 ? '무료' : `${p.price.toLocaleString()}`}</span>
              {p.price > 0 && <span style={{ fontSize: 13, color: 'var(--ink-mute)' }}>원/월</span>}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {p.feats.map((f) => <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--ink-soft)' }}><Icon name="check" size={15} color="var(--ok)" />{f}</div>)}
            </div>
            <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink-mute)' }}>구독자 <b style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{p.subs.toLocaleString()}</b></span>
              <Btn variant="secondary" size="sm" icon="pencil">수정</Btn>
            </div>
          </div>)}
      </div>
    </div>);
}

// ── 감사 로그 ──────────────────────────────────────────────────────────
function AdminLogs() {
  const D = A3();
  const [mock, setMock] = React.useState('filled');
  const [search, setSearch] = React.useState('');
  let rows = mock === 'empty' ? [] : D.LOGS;
  if (search) rows = rows.filter((l) => l.action.includes(search) || l.target.includes(search) || l.who.includes(search));
  return (
    <div>
      {ph3({ eyebrow: 'ADMIN · 로그', title: '감사 로그', sub: '관리자 운영 활동 이력을 추적합니다.', actions: <><Btn variant="secondary" icon="download">내보내기</Btn><MockToggle value={mock} onChange={setMock} /></> })}
      <FilterBar search={{ value: search, onChange: setSearch, placeholder: '액션 · 대상 · 관리자' }} onReset={() => setSearch('')} />
      <div className="ts-card" style={{ padding: 0 }}>
        {rows.length === 0 ? <div className="ts-empty"><div className="ts-empty__title">로그가 없습니다</div></div> :
          rows.map((l, i) =>
            <div key={l.id} style={{ display: 'flex', gap: 12, padding: '14px 20px', borderTop: i ? '1px solid var(--border)' : 0, alignItems: 'center' }}>
              <span style={{ width: 9, height: 9, borderRadius: 50, background: D.LOG_SEV[l.sev], flex: '0 0 auto' }} />
              <div style={{ flex: 1, minWidth: 0 }}><span style={{ fontWeight: 700, color: 'var(--ink)' }}>{l.action}</span><span style={{ fontSize: 13, color: 'var(--ink-mute)', marginLeft: 8 }}>{l.target}</span></div>
              <span style={{ fontSize: 13, color: 'var(--ink-soft)', flex: '0 0 auto' }}>{l.who}</span>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-dim)', flex: '0 0 auto', width: 130, textAlign: 'right' }}>{l.when.slice(5)}</span>
            </div>)}
      </div>
    </div>);
}

Object.assign(window, { AdminAnalytics, AdminReports, AdminNotifications, AdminCampaigns, AdminPartners, AdminSuggestions, AdminPlans, AdminLogs });
