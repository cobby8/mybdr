/* global React, window, Icon, Btn, Badge, StatusTabs, DataTable, StatCard */
// =====================================================================
// pr-screens.jsx — partner-admin · referee 화면 (Toss 재스킨)
// =====================================================================
const P = () => window.PR;
function H({ eyebrow, title, sub, actions }) {
  return <div className="ts-ph"><div className="ts-ph__row"><div><div className="ts-ph__eyebrow">{eyebrow}</div><h1 className="ts-ph__title">{title}</h1>{sub && <p className="ts-ph__sub">{sub}</p>}</div>{actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}</div></div>;
}
function Kpis({ items }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 14, marginBottom: 20 }}>{items.map((s, i) => <StatCard key={i} {...s} />)}</div>;
}
function tableState(rows, statusMap, key) {
  const [tab, setTab] = React.useState('all');
  const counts = { all: rows.length };
  if (statusMap) Object.keys(statusMap).forEach((k) => counts[k] = rows.filter((r) => r[key] === k).length);
  const filtered = tab === 'all' ? rows : rows.filter((r) => r[key] === tab);
  return { tab, setTab, counts, filtered };
}

// ── Partner ───────────────────────────────────────────────────────────
function PartnerHome({ go }) {
  const D = P();
  return (
    <div>
      <H eyebrow="PARTNER · 대시보드" title={`${D.PARTNER.name} 파트너`} sub="예약·정산·캠페인 현황을 확인합니다." actions={<Btn icon="plus" onClick={() => go('venue')}>코트 추가</Btn>} />
      <Kpis items={D.P_KPIS} />
      <div className="ts-card"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>오늘 예약</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[['09:00', 'A코트', '마포 슬램덩크'], ['14:00', 'B코트', '강남 픽업'], ['19:00', 'A코트', '슬로우 vs 런앤건']].map(([t, c, who], i) =>
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 14 }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 800, color: 'var(--primary)' }}>{t}</span><Badge tone="grey">{c}</Badge><span style={{ fontWeight: 600, color: 'var(--ink)' }}>{who}</span></div>)}
        </div></div>
    </div>);
}
function PartnerVenue() {
  const D = P(); const s = tableState(D.VENUES, D.V_STATUS, 'status');
  return (
    <div>
      <H eyebrow="PARTNER · 시설" title="코트 관리" sub="운영 코트와 시간대·요금을 관리합니다." actions={<Btn icon="plus">코트 추가</Btn>} />
      <StatusTabs current={s.tab} onChange={s.setTab} tabs={[{ key: 'all', label: '전체', count: s.counts.all }, ...Object.keys(D.V_STATUS).map((k) => ({ key: k, label: D.V_STATUS[k].label, count: s.counts[k] }))]} />
      <DataTable keyField="id" rows={s.filtered} columns={[
        { key: 'name', label: '코트', width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
        { key: 'type', label: '유형', width: 70, render: (r) => <Badge tone="grey">{r.type}</Badge> },
        { key: 'slots', label: '운영시간', width: 110 },
        { key: 'rate', label: '시간당', width: 100, align: 'right', render: (r) => r.rate ? <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.rate.toLocaleString()}원</span> : <span style={{ color: 'var(--ok)', fontWeight: 700, fontSize: 13 }}>무료</span> },
        { key: 'status', label: '상태', width: 90, render: (r) => <Badge tone={D.V_STATUS[r.status].tone}>{D.V_STATUS[r.status].label}</Badge> },
      ]} />
    </div>);
}
function PartnerCampaigns() {
  const D = P(); const s = tableState(D.P_CAMPAIGNS, D.PC_STATUS, 'status');
  return (
    <div>
      <H eyebrow="PARTNER · 캠페인" title="캠페인" sub="예약 유도 프로모션의 성과를 관리합니다." actions={<Btn icon="plus">새 캠페인</Btn>} />
      <StatusTabs current={s.tab} onChange={s.setTab} tabs={[{ key: 'all', label: '전체', count: s.counts.all }, ...Object.keys(D.PC_STATUS).map((k) => ({ key: k, label: D.PC_STATUS[k].label, count: s.counts[k] }))]} />
      <DataTable keyField="id" rows={s.filtered} columns={[
        { key: 'name', label: '캠페인', width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
        { key: 'period', label: '기간', width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.period}</span> },
        { key: 'views', label: '노출', width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.views.toLocaleString()}</span> },
        { key: 'bookings', label: '예약전환', width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--primary)' }}>{r.bookings}</span> },
        { key: 'status', label: '상태', width: 80, render: (r) => <Badge tone={D.PC_STATUS[r.status].tone}>{D.PC_STATUS[r.status].label}</Badge> },
      ]} />
    </div>);
}

// ── Referee ───────────────────────────────────────────────────────────
function RefHome({ go }) {
  const D = P();
  return (
    <div>
      <H eyebrow="REFEREE · 대시보드" title={`${D.REF.name} 심판`} sub={`${D.REF.grade} · 이번달 배정과 정산을 확인합니다.`} actions={<Btn variant="secondary" icon="calendar" onClick={() => go('assignments')}>배정 보기</Btn>} />
      <Kpis items={D.R_KPIS} />
      <div className="ts-card"><div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>다가오는 배정</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {D.ASSIGNMENTS.slice(0, 3).map((a) =>
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--grey-50)', borderRadius: 14 }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)', width: 90 }}>{a.when.slice(5, 16)}</span>
              <Badge tone="grey">{a.role}</Badge><span style={{ flex: 1, fontWeight: 600, color: 'var(--ink)' }}>{a.match}</span>
              <Badge tone={D.A_STATUS[a.status].tone}>{D.A_STATUS[a.status].label}</Badge></div>)}
        </div></div>
    </div>);
}
function RefAssignments({ toast }) {
  const D = P(); const s = tableState(D.ASSIGNMENTS, D.A_STATUS, 'status');
  return (
    <div>
      <H eyebrow="REFEREE · 배정" title="경기 배정" sub="배정된 경기를 수락하거나 거절합니다." />
      <StatusTabs current={s.tab} onChange={s.setTab} tabs={[{ key: 'all', label: '전체', count: s.counts.all }, ...Object.keys(D.A_STATUS).map((k) => ({ key: k, label: D.A_STATUS[k].label, count: s.counts[k] }))]} />
      <DataTable keyField="id" rows={s.filtered} columns={[
        { key: 'match', label: '경기', width: '1.6fr', render: (r) => <span><b style={{ color: 'var(--ink)' }}>{r.match}</b><span style={{ display: 'block', fontSize: 11.5, color: 'var(--ink-dim)' }}>{r.tn}</span></span> },
        { key: 'role', label: '역할', width: 80, render: (r) => <Badge tone="primary">{r.role}</Badge> },
        { key: 'court', label: '코트', width: '1fr' },
        { key: 'when', label: '일시', width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when.slice(5)}</span> },
        { key: 'status', label: '상태', width: 110, render: (r) => r.status === 'pending'
          ? <span style={{ display: 'flex', gap: 6 }}><Btn size="sm" onClick={() => toast('배정 수락')}>수락</Btn><Btn variant="ghost" size="sm" onClick={() => toast('배정 거절')}>거절</Btn></span>
          : <Badge tone={D.A_STATUS[r.status].tone}>{D.A_STATUS[r.status].label}</Badge> },
      ]} />
    </div>);
}
function RefSettlements() {
  const D = P();
  return (
    <div>
      <H eyebrow="REFEREE · 정산" title="정산 내역" sub="월별 배정 수당 정산 내역입니다." />
      <DataTable keyField="id" rows={D.SETTLEMENTS} columns={[
        { key: 'period', label: '정산월', width: '1fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--ff-mono)' }}>{r.period}</span> },
        { key: 'games', label: '경기수', width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.games}</span> },
        { key: 'amount', label: '금액', width: 120, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--ink)' }}>{r.amount.toLocaleString()}원</span> },
        { key: 'status', label: '상태', width: 100, render: (r) => <Badge tone={D.S_STATUS[r.status].tone}>{D.S_STATUS[r.status].label}</Badge> },
      ]} />
    </div>);
}

Object.assign(window, { PartnerHome, PartnerVenue, PartnerCampaigns, RefHome, RefAssignments, RefSettlements });
