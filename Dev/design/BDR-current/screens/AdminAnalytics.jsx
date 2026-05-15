/* global React, AdminShell */

// =====================================================================
// AdminAnalytics.jsx — Admin-D 시스템 그룹 · 분석 (v2.11)
//   진입: setRoute('adminAnalytics')
//   복귀: setRoute('adminDashboard')
//   에러: 없음 (KPI 대시보드 — 통계만 표시)
//
// 패턴: DataTable 미사용. KPI 4 + 기간 셀렉터 + CSS bar 차트 + 채널 분포 + 상위 페이지
// 차별화: 외부 차트 라이브러리 0건. 인라인 SVG 라인 + CSS bar.
// =====================================================================

const ANALYTICS_KPI = {
  '7d': {
    mau: { value: 8421, delta: 312, trend: 'up' },
    revenue: { value: 14820000, delta: 1420000, trend: 'up' },
    new_users: { value: 312, delta: 42, trend: 'up' },
    conversion: { value: 0.041, delta: 0.003, trend: 'up' }
  },
  '30d': {
    mau: { value: 18243, delta: 842, trend: 'up' },
    revenue: { value: 62410000, delta: 4280000, trend: 'up' },
    new_users: { value: 1218, delta: -84, trend: 'down' },
    conversion: { value: 0.038, delta: -0.002, trend: 'down' }
  },
  '90d': {
    mau: { value: 42180, delta: 2842, trend: 'up' },
    revenue: { value: 184220000, delta: 18420000, trend: 'up' },
    new_users: { value: 3420, delta: 280, trend: 'up' },
    conversion: { value: 0.039, delta: 0.001, trend: 'up' }
  }
};

const ANALYTICS_DAU_7D = [
{ date: '05-09', dau: 1242, signup: 38 },
{ date: '05-10', dau: 1418, signup: 52 },
{ date: '05-11', dau: 982, signup: 31 },
{ date: '05-12', dau: 1521, signup: 48 },
{ date: '05-13', dau: 1684, signup: 64 },
{ date: '05-14', dau: 1842, signup: 41 },
{ date: '05-15', dau: 1532, signup: 38 }];


const ANALYTICS_CHANNEL = [
{ channel: '직접 유입', visitors: 4218, share: 0.42, color: 'var(--accent)' },
{ channel: '네이버 검색', visitors: 2841, share: 0.28, color: 'var(--ok)' },
{ channel: '인스타그램', visitors: 1421, share: 0.14, color: 'var(--cafe-blue, #1B3C87)' },
{ channel: '카카오', visitors: 982, share: 0.10, color: 'var(--ink-soft)' },
{ channel: '기타', visitors: 612, share: 0.06, color: 'var(--ink-mute)' }];


const ANALYTICS_TOP_PAGES = [
{ rank: 1, path: '/home', views: 18420, change: '+8%' },
{ rank: 2, path: '/court', views: 12180, change: '+12%' },
{ rank: 3, path: '/match', views: 9842, change: '−2%' },
{ rank: 4, path: '/tournament', views: 8421, change: '+24%' },
{ rank: 5, path: '/team', views: 6180, change: '+4%' }];


const FMT_KRW = (n) => '₩' + n.toLocaleString();
const FMT_PCT = (n) => (n * 100).toFixed(1) + '%';

function AdminAnalytics({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [period, setPeriod] = React.useState('30d');

  const kpi = ANALYTICS_KPI[period];
  const maxDau = Math.max(...ANALYTICS_DAU_7D.map((d) => d.dau));

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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
      route="adminAnalytics"
      setRoute={setRoute}
      eyebrow="ADMIN · 시스템"
      title="분석"
      subtitle="MAU·매출·전환률 등 사이트 핵심 지표를 기간별로 확인합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '시스템' },
      { label: '분석' }]
      }
      actions={
      <>
          {/* 기간 segmented */}
          <div role="tablist" style={{ display: 'flex', gap: 0, background: 'var(--bg-alt)', borderRadius: 4, padding: 2 }}>
            {[
            { k: '7d', label: '7일' },
            { k: '30d', label: '30일' },
            { k: '90d', label: '90일' }].
            map((p) =>
            <button
              key={p.k}
              type="button"
              onClick={() => setPeriod(p.k)}
              style={{
                padding: '6px 14px',
                background: period === p.k ? 'var(--bg-card)' : 'transparent',
                border: period === p.k ? '1px solid var(--border)' : '1px solid transparent',
                borderRadius: 4,
                fontSize: 12.5,
                fontWeight: period === p.k ? 600 : 400,
                color: period === p.k ? 'var(--ink)' : 'var(--ink-mute)',
                cursor: 'pointer'
              }}>

                {p.label}
              </button>
            )}
          </div>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            CSV
          </button>
        </>
      }>

      {/* KPI 4종 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <KpiCard label="MAU" value={kpi.mau.value.toLocaleString()} delta={`+${kpi.mau.delta.toLocaleString()}`} trend={kpi.mau.trend} period={period} icon="group" />
        <KpiCard label="매출" value={FMT_KRW(kpi.revenue.value)} delta={`+${FMT_KRW(kpi.revenue.delta)}`} trend={kpi.revenue.trend} period={period} icon="payments" accent />
        <KpiCard label="신규 가입" value={kpi.new_users.value.toLocaleString()} delta={`${kpi.new_users.delta > 0 ? '+' : ''}${kpi.new_users.delta}`} trend={kpi.new_users.trend} period={period} icon="person_add" />
        <KpiCard label="전환률" value={FMT_PCT(kpi.conversion.value)} delta={`${kpi.conversion.delta > 0 ? '+' : ''}${(kpi.conversion.delta * 100).toFixed(1)}%p`} trend={kpi.conversion.trend} period={period} icon="conversion_path" />
      </section>

      {/* 차트 + 분포 2 컬럼 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* DAU 라인 차트 (SVG) */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>최근 7일 · DAU</div>
            <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>peak {maxDau.toLocaleString()}</div>
          </div>
          <LineChart data={ANALYTICS_DAU_7D} />
        </div>

        {/* 채널 분포 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>유입 채널 분포</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ANALYTICS_CHANNEL.map((c) =>
            <div key={c.channel}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{c.channel}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                    {c.visitors.toLocaleString()} <span style={{ marginLeft: 4 }}>{FMT_PCT(c.share)}</span>
                  </span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-alt)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.share * 100}%`, background: c.color }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 상위 페이지 + 전환 깔때기 */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* 상위 5 페이지 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>상위 5 페이지</div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <tbody>
              {ANALYTICS_TOP_PAGES.map((p) => {
                const isUp = p.change.startsWith('+');
                return (
                  <tr key={p.rank} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 0', width: 30 }}>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{String(p.rank).padStart(2, '0')}</span>
                    </td>
                    <td style={{ padding: '10px 0' }}>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{p.path}</span>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right' }}>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink)' }}>{p.views.toLocaleString()}</span>
                    </td>
                    <td style={{ padding: '10px 0', textAlign: 'right', width: 60 }}>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: isUp ? 'var(--ok)' : 'var(--err)' }}>{p.change}</span>
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>

        {/* 전환 깔때기 */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>전환 깔때기</div>
          <Funnel steps={[
          { label: '방문', value: 10000, color: 'var(--ink-soft)' },
          { label: '회원가입', value: 1820, color: 'var(--ok)' },
          { label: '게임 1회', value: 942, color: 'var(--accent)' },
          { label: '유료 전환', value: 412, color: 'var(--cafe-blue, #1B3C87)' }]
          } />
        </div>
      </section>
    </AdminShell>);

}

function KpiCard({ label, value, delta, trend, period, icon, accent }) {
  const isUp = trend === 'up';
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--ff-mono)', color: isUp ? 'var(--ok)' : 'var(--err)' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{isUp ? 'trending_up' : 'trending_down'}</span>
        <span>{delta}</span>
        <span style={{ color: 'var(--ink-dim)', marginLeft: 2 }}>/ {period}</span>
      </div>
    </div>);

}

function LineChart({ data }) {
  const W = 600, H = 160, PADX = 28, PADY = 18;
  const max = Math.max(...data.map((d) => d.dau));
  const min = Math.min(...data.map((d) => d.dau));
  const range = max - min || 1;
  const stepX = (W - PADX * 2) / (data.length - 1);
  const ptY = (v) => H - PADY - (v - min) / range * (H - PADY * 2);
  const points = data.map((d, i) => [PADX + i * stepX, ptY(d.dau)]);
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = path + ` L${(PADX + (data.length - 1) * stepX).toFixed(1)},${H - PADY} L${PADX.toFixed(1)},${H - PADY} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width: '100%', height: 'auto', display: 'block' }} aria-label="DAU 라인 차트">
      {/* grid */}
      {[0.25, 0.5, 0.75].map((g) =>
      <line key={g} x1={PADX} x2={W - PADX} y1={PADY + g * (H - PADY * 2)} y2={PADY + g * (H - PADY * 2)} stroke="var(--border)" strokeDasharray="2 4" strokeWidth="1" />
      )}
      {/* area */}
      <path d={area} fill="var(--accent)" opacity="0.08" />
      {/* line */}
      <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* points + labels */}
      {points.map(([x, y], i) =>
      <g key={i}>
          <circle cx={x} cy={y} r="3.5" fill="var(--bg-card)" stroke="var(--accent)" strokeWidth="2" />
          <text x={x} y={H + 14} textAnchor="middle" fontSize="10" fill="var(--ink-mute)" fontFamily="var(--ff-mono)">{data[i].date}</text>
        </g>
      )}
    </svg>);

}

function Funnel({ steps }) {
  const max = steps[0].value;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {steps.map((s, i) => {
        const pct = s.value / max;
        const prev = i > 0 ? steps[i - 1].value : null;
        const dropRate = prev ? 1 - s.value / prev : null;
        return (
          <div key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: 'var(--ink)' }}>{s.label}</span>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                {s.value.toLocaleString()}
                {dropRate != null &&
                <span style={{ marginLeft: 6, color: 'var(--err)' }}>−{(dropRate * 100).toFixed(0)}%</span>
                }
              </span>
            </div>
            <div style={{ height: 22, background: 'var(--bg-alt)', borderRadius: 4, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
              <div style={{ height: '100%', width: `${pct * 100}%`, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, color: '#fff', fontSize: 10, fontFamily: 'var(--ff-mono)', fontWeight: 600 }}>
                {(pct * 100).toFixed(1)}%
              </div>
            </div>
          </div>);

      })}
    </div>);

}

window.AdminAnalytics = AdminAnalytics;
