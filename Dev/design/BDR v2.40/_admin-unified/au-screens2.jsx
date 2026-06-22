/* global React, window */
// =====================================================================
// au-screens2.jsx — 통합 콘솔 화면 (2/2)
//   커뮤니티·BDR NEWS · 시즌시상 · 신고 · 건의 · 결제 · 요금제 ·
//   캠페인 · 파트너 · 분석 · 종별 마스터 · 로그 · 알림 · 설정
// =====================================================================
(function () {
const { useState } = React;
const D2 = window.ADMIN;
const { PageHead, StatRow, Toolbar, DataTable, PrimaryCell, Drawer, DL, Panel, StatusBadge, useFilter } = window;
const { Icon, Btn, Badge, Toggle } = window;
const tabsFor = window.auTabsFor, won = window.auWon, ini = window.auIni;

// ── 커뮤니티 (게시글 + BDR NEWS 탭) ──────────────────────────────────
function AuCommunity({ go }) {
  const [view, setView] = useState('posts');
  const posts = useFilter(D2.POSTS, ['title', 'author', 'board']);
  const news = useFilter(D2.NEWS, ['title', 'author', 'cat']);
  const [sel, setSel] = useState(null);
  const postCols = [
    { key: 'title', label: '게시글', render: (r) => <PrimaryCell title={r.title} meta={`${r.board} · ${r.author}`} /> },
    { key: 'date', label: '작성일', w: '110px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'comments', label: '댓글', align: 'r', w: '64px', cls: 'au-cell--num' },
    { key: 'reports', label: '신고', align: 'r', w: '64px', hideSm: true, render: (r) => r.reports > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 700 }}>{r.reports}</span> : <span className="au-cell--mut">0</span> },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D2.POST_STATUS} value={r.status} /> },
  ];
  const newsCols = [
    { key: 'title', label: '기사', render: (r) => <PrimaryCell initials="📰" title={r.title} meta={`${r.cat} · ${r.author}`} /> },
    { key: 'views', label: '조회', align: 'r', w: '90px', cls: 'au-cell--num', render: (r) => r.views.toLocaleString() },
    { key: 'when', label: '게시일', w: '110px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'status', label: '상태', align: 'c', w: '92px', render: (r) => <StatusBadge map={D2.NEWS_STATUS} value={r.status} /> },
  ];
  const seg = view === 'posts' ? posts : news;
  return (
    <div>
      <PageHead eyebrow="사용자·커뮤니티" icon="message-square" title="커뮤니티"
        sub="게시글 검수와 BDR NEWS 콘텐츠를 관리합니다."
        actions={view === 'news' && <Btn variant="primary" icon="plus" size="sm" onClick={() => go('write-news')}>기사 작성</Btn>} />
      <div className="ts-segment" style={{ maxWidth: 280, marginBottom: 16 }}>
        <button className="ts-segment__btn" data-active={view === 'posts'} onClick={() => setView('posts')}>게시글</button>
        <button className="ts-segment__btn" data-active={view === 'news'} onClick={() => setView('news')}>BDR NEWS</button>
      </div>
      {view === 'posts' ? (
        <>
          <Toolbar search={posts.q} onSearch={posts.setQ} placeholder="제목·작성자·게시판 검색" tabs={tabsFor(D2.POSTS, D2.POST_STATUS)} active={posts.tab} onTab={posts.setTab} />
          <DataTable columns={postCols} rows={posts.filtered} onRow={(r) => go('post:' + r.id)} />
        </>
      ) : (
        <>
          <Toolbar search={news.q} onSearch={news.setQ} placeholder="기사 제목·카테고리 검색" tabs={tabsFor(D2.NEWS, D2.NEWS_STATUS)} active={news.tab} onTab={news.setTab} />
          <DataTable columns={newsCols} rows={news.filtered} onRow={(r) => go('news:' + r.id)} />
        </>
      )}
    </div>
  );
}

// ── 시즌 시상 ─────────────────────────────────────────────────────────
function AuAwards() {
  const [add, setAdd] = useState(false);
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.AWARDS, ['category', 'winner', 'team', 'season']);
  const cols = [
    { key: 'category', label: '시상 부문', render: (r) => <PrimaryCell initials="🏅" title={r.category} meta={r.season} /> },
    { key: 'winner', label: '수상자', w: '120px', render: (r) => <span style={{ fontWeight: 700 }}>{r.winner}</span> },
    { key: 'team', label: '소속팀', w: '120px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D2.AWARD_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="사용자·커뮤니티" icon="trophy" title="시즌 시상" sub="MVP·득점왕·수비상 등 시즌 어워드를 직접 입력·공개합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>시상 추가</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="부문·수상자·시즌 검색" tabs={tabsFor(D2.AWARDS, D2.AWARD_STATUS)} active={tab} onTab={setTab} />
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="시상 추가" sub="시즌 어워드 수상 내역을 입력합니다." submitLabel="추가"
        fields={[{ type: 'select', label: '시즌', options: ['2026 봄시즌', '2025 가을시즌'] }, { type: 'text', label: '시상 부문', placeholder: '예: 정규리그 MVP' }, { type: 'text', label: '수상자', placeholder: '닉네임' }, { type: 'text', label: '소속팀', placeholder: '팀명' }]} />
      <DataTable columns={cols} rows={filtered} page={false} />
    </div>
  );
}

// ── 신고 검토 ─────────────────────────────────────────────────────────
function AuReports({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.REPORTS, ['target', 'kind', 'reporter', 'reason']);
  const [sel, setSel] = useState(null);
  const cols = [
    { key: 'target', label: '신고 대상', render: (r) => <PrimaryCell initials="⚠️" title={r.target} meta={r.reason} /> },
    { key: 'kind', label: '유형', align: 'c', w: '90px', render: (r) => <Badge tone="grey">{r.kind}</Badge> },
    { key: 'reporter', label: '신고자', w: '100px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'when', label: '접수', w: '150px', hideSm: true, cls: 'au-cell--mut', render: (r) => r.when.slice(0, 10) },
    { key: 'status', label: '처리', align: 'c', w: '100px', render: (r) => <StatusBadge map={D2.REPORT_STATUS} value={r.status} /> },
  ];
  const pending = D2.REPORTS.filter((r) => r.status === 'pending').length;
  return (
    <div>
      <PageHead eyebrow="사용자·커뮤니티" icon="flag" title="신고 검토" sub={`미처리 ${pending}건 — 욕설·비매너·노쇼 신고를 검토합니다.`} />
      <Toolbar search={q} onSearch={setQ} placeholder="대상·유형·신고자 검색" tabs={tabsFor(D2.REPORTS, D2.REPORT_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={(r) => go('report:' + r.id)} page={false} />
      
    </div>
  );
}

// ── 건의사항 ──────────────────────────────────────────────────────────
function AuSuggestions() {
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.SUGGESTIONS, ['title', 'author', 'cat']);
  const cols = [
    { key: 'title', label: '제안', render: (r) => <PrimaryCell initials="💡" title={r.title} meta={`${r.cat} · ${r.author}`} /> },
    { key: 'votes', label: '추천', align: 'r', w: '90px', render: (r) => <span className="au-cell--num" style={{ color: 'var(--primary)', fontWeight: 700 }}>▲ {r.votes}</span> },
    { key: 'status', label: '상태', align: 'c', w: '100px', render: (r) => <StatusBadge map={D2.SUG_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="사용자·커뮤니티" icon="lightbulb" title="건의사항" sub="사용자 제안을 추천순으로 검토하고 반영 상태를 관리합니다." />
      <Toolbar search={q} onSearch={setQ} placeholder="제안·작성자 검색" tabs={tabsFor(D2.SUGGESTIONS, D2.SUG_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered.slice().sort((a, b) => b.votes - a.votes)} page={false} />
    </div>
  );
}

// ── 결제 ──────────────────────────────────────────────────────────────
function AuPayments({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.PAYMENTS, ['ref', 'type', 'method']);
  const total = D2.PAYMENTS.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const cols = [
    { key: 'ref', label: '거래', render: (r) => <PrimaryCell title={r.ref} meta={`${r.type} · ${r.method}`} /> },
    { key: 'when', label: '일시', w: '150px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'amount', label: '금액', align: 'r', w: '120px', cls: 'au-cell--num', render: (r) => won(r.amount) },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D2.PAY_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="비즈니스" icon="credit-card" title="결제" sub="참가비·구독·예약·광고 결제 내역을 관리합니다."
        actions={<Btn variant="secondary" icon="download" size="sm">정산 내보내기</Btn>} />
      <StatRow items={[
        { icon: 'won-sign', label: '결제 완료 합계', value: won(total), delta: '+12% / 7일', trend: 'up' },
        { icon: 'clock', label: '입금 대기', value: '1건', delta: '70,000원', trend: 'flat' },
        { icon: 'rotate-ccw', label: '환불', value: '1건', delta: '70,000원', trend: 'flat' },
        { icon: 'x-circle', label: '실패', value: '1건', delta: '카드 인증', trend: 'down' },
      ]} />
      <Toolbar search={q} onSearch={setQ} placeholder="거래·유형·수단 검색" tabs={tabsFor(D2.PAYMENTS, D2.PAY_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={(r) => go('payment:' + r.id)} page={false} />
    </div>
  );
}

// ── 요금제 ────────────────────────────────────────────────────────────
function AuPlans() {
  const [add, setAdd] = useState(false);
  return (
    <div>
      <PageHead eyebrow="비즈니스" icon="gem" title="요금제 관리" sub="구독 요금제와 가입자 현황을 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>요금제 추가</Btn>} />
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="요금제 추가" sub="새 구독 요금제를 만듭니다." submitLabel="추가"
        fields={[{ type: 'text', label: '요금제명', placeholder: '예: PRO+' }, { type: 'number', label: '월 요금', opt: '원', placeholder: '9900' }, { type: 'textarea', label: '포함 기능', placeholder: '줄바꿈으로 구분해 입력' }]} />
      <div className="au-plans">
        {D2.PLANS.map((p) => (
          <div className="au-plan" key={p.id} data-accent={p.accent ? 'true' : 'false'}>
            {p.accent && <div style={{ position: 'absolute', top: 18, right: 18 }}><Badge tone="primary">인기</Badge></div>}
            <div className="au-plan__name">{p.name}</div>
            <div className="au-plan__price">{p.price === 0 ? '무료' : <>{p.price.toLocaleString()}<small> 원/월</small></>}</div>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginTop: 8, fontWeight: 600 }}>가입자 {p.subs.toLocaleString()}명</div>
            <ul className="au-plan__feats">
              {p.feats.map((f, i) => <li key={i}><Icon name="check" size={16} />{f}</li>)}
            </ul>
            <div style={{ marginTop: 20 }}><Btn variant={p.accent ? 'primary' : 'secondary'} block icon="settings-2">설정</Btn></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 광고 캠페인 ───────────────────────────────────────────────────────
function AuCampaigns({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.CAMPAIGNS, ['name', 'type']);
  const cols = [
    { key: 'name', label: '캠페인', render: (r) => <PrimaryCell initials="📣" title={r.name} meta={`${r.type} · ${r.period}`} /> },
    { key: 'views', label: '노출', align: 'r', w: '100px', cls: 'au-cell--num', render: (r) => r.views.toLocaleString() },
    { key: 'clicks', label: '클릭', align: 'r', w: '90px', hideSm: true, cls: 'au-cell--num', render: (r) => r.clicks.toLocaleString() },
    { key: 'ctr', label: 'CTR', align: 'r', w: '72px', hideSm: true, cls: 'au-cell--mut', render: (r) => r.views ? ((r.clicks / r.views) * 100).toFixed(1) + '%' : '—' },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D2.CAMP_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="비즈니스" icon="megaphone" title="광고 캠페인" sub="배너·푸시 캠페인의 성과를 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => go('create-campaign')}>캠페인 생성</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="캠페인명·유형 검색" tabs={tabsFor(D2.CAMPAIGNS, D2.CAMP_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={(r) => go('campaign:' + r.id)} page={false} />
    </div>
  );
}

// ── 파트너 관리 ───────────────────────────────────────────────────────
function AuPartners({ go }) {
  const [add, setAdd] = useState(false);
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.PARTNERS, ['name', 'field', 'region', 'manager']);
  const cols = [
    { key: 'name', label: '파트너', render: (r) => <PrimaryCell initials={ini(r.name)} title={r.name} meta={`${r.field} · ${r.region}`} accent /> },
    { key: 'manager', label: '담당자', w: '110px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'status', label: '상태', align: 'c', w: '92px', render: (r) => <StatusBadge map={D2.PARTNER_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="비즈니스" icon="handshake" title="파트너 관리" sub="용품·시설·교육 파트너 계약을 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>파트너 등록</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="파트너명·분야·담당자 검색" tabs={tabsFor(D2.PARTNERS, D2.PARTNER_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={(r) => go('partner:' + r.id)} page={false} />
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="파트너 등록" sub="용품·시설·교육 파트너를 등록합니다." submitLabel="등록"
        fields={[{ type: 'text', label: '파트너명', placeholder: '예: 나이키 코리아' }, { type: 'pick', label: '분야', options: ['용품', '시설', '교육'] }, { type: 'select', label: '지역', options: D2.OPT_REGIONS }, { type: 'text', label: '담당자', placeholder: '이름' }]} />
    </div>
  );
}

// ── 분석 ──────────────────────────────────────────────────────────────
function AuAnalytics() {
  const A = D2.ANALYTICS;
  const maxR = Math.max(...A.region.map((r) => r[1]));
  return (
    <div>
      <PageHead eyebrow="시스템" icon="bar-chart-3" title="분석" sub="가입·참여·매출 핵심 지표를 분석합니다."
        actions={<Btn variant="secondary" icon="calendar" size="sm">최근 30일</Btn>} />
      <StatRow items={A.kpis} />
      <div className="au-grid-2">
        <Panel title="전환 퍼널" sub="방문 → 참가 확정까지의 전환율">
          <div className="au-hbar">
            {A.funnel.map(([label, v]) => (
              <div className="au-hbar__row" key={label}>
                <span className="au-cell--mut">{label}</span>
                <span className="au-hbar__track"><span className="au-hbar__fill" style={{ width: `${v}%` }} /></span>
                <span className="au-hbar__val">{v}%</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="지역 분포" sub="활동 회원 비중">
          <div className="au-hbar">
            {A.region.map(([label, v]) => (
              <div className="au-hbar__row" key={label}>
                <span className="au-cell--mut">{label}</span>
                <span className="au-hbar__track"><span className="au-hbar__fill" style={{ width: `${Math.round((v / maxR) * 100)}%` }} /></span>
                <span className="au-hbar__val">{v}%</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

// ── 종별 마스터 ───────────────────────────────────────────────────────
function AuCategories() {
  const { q, setQ, filtered } = useFilter(D2.CATEGORIES, ['name', 'code']);
  const [add, setAdd] = useState(false);
  const cols = [
    { key: 'name', label: '종별', render: (r) => <PrimaryCell initials={r.code.slice(0, 2)} title={r.name} meta={r.code} accent /> },
    { key: 'divisions', label: '디비전', render: (r) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{r.divisions.map((d) => <Badge tone="grey" key={d}>{d}</Badge>)}</div> },
    { key: 'ages', label: '연령', w: '120px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'teams', label: '팀', align: 'r', w: '72px', cls: 'au-cell--num' },
    { key: 'active', label: '사용', align: 'c', w: '84px', render: (r) => r.active ? <Badge tone="ok">사용</Badge> : <Badge tone="grey">중지</Badge> },
  ];
  return (
    <div>
      <PageHead eyebrow="시스템" icon="layout-grid" title="종별 관리" sub="대회 생성 시 선택하는 종별·디비전 마스터를 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>종별 추가</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="종별명·코드 검색" />
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="종별 추가" sub="대회 생성 시 선택하는 종별·디비전을 등록합니다." submitLabel="추가"
        fields={[{ type: 'text', label: '종별명', placeholder: '예: 일반부' }, { type: 'text', label: '코드', placeholder: 'OPEN' }, { type: 'text', label: '디비전', opt: '쉼표로 구분', placeholder: '1부, 2부, 3부' }, { type: 'text', label: '연령 제한', placeholder: '제한없음' }]} />
      <DataTable columns={cols} rows={filtered} page={false} />
    </div>
  );
}

// ── 활동 로그 ─────────────────────────────────────────────────────────
function AuLogs() {
  const { q, setQ, filtered } = useFilter(D2.LOGS, ['action', 'target', 'who']);
  return (
    <div>
      <PageHead eyebrow="시스템" icon="list" title="활동 로그" sub="관리자 활동 감사 로그입니다."
        actions={<Btn variant="secondary" icon="download" size="sm">내보내기</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="작업·대상·담당자 검색" />
      <Panel pad={8} style={{ marginTop: 0 }}>
        <div className="au-feed" style={{ padding: '0 16px' }}>
          {filtered.map((l) => (
            <div className="au-feed__row" key={l.id}>
              <span className="au-feed__dot" style={{ background: D2.LOG_SEV[l.sev] || 'var(--ink-dim)' }} />
              <div className="au-feed__body">
                <div className="au-feed__title">{l.action} <span style={{ color: 'var(--ink-mute)', fontWeight: 500 }}>· {l.target}</span></div>
                <div className="au-feed__meta">{l.who} · {l.when}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── 알림 ──────────────────────────────────────────────────────────────
function AuNotifications({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D2.NOTIS, ['title', 'target', 'channel']);
  const cols = [
    { key: 'title', label: '알림', render: (r) => <PrimaryCell initials="🔔" title={r.title} meta={`${r.target} · ${r.channel}`} /> },
    { key: 'sent', label: '발송', align: 'r', w: '100px', cls: 'au-cell--num', render: (r) => r.sent ? r.sent.toLocaleString() : '—' },
    { key: 'when', label: '일시', w: '150px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'status', label: '상태', align: 'c', w: '100px', render: (r) => <StatusBadge map={D2.NOTI_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="시스템" icon="bell" title="알림" sub="앱·SMS·이메일 알림을 발송하고 예약합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => go('compose-notification')}>알림 작성</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="제목·대상·채널 검색" tabs={tabsFor(D2.NOTIS, D2.NOTI_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} page={false} />
    </div>
  );
}

// ── 시스템 설정 ───────────────────────────────────────────────────────
function AuSettings() {
  const [s, setS] = useState({ signup: true, maintenance: false, autoApprove: false, sms: true });
  const set = (k) => (v) => setS((p) => ({ ...p, [k]: v }));
  const rows = [
    ['signup', '신규 가입 허용', '새 회원의 가입을 받습니다.'],
    ['autoApprove', '단체·코트 자동 승인', '신규 등록 단체와 코트를 검토 없이 자동 승인합니다.'],
    ['sms', 'SMS 알림 사용', '대기 접수·입금 안내를 SMS로 발송합니다.'],
    ['maintenance', '점검 모드', '활성화 시 일반 사용자 접근을 차단합니다.'],
  ];
  return (
    <div>
      <PageHead eyebrow="시스템" icon="settings" title="시스템 설정" sub="플랫폼 전역 동작을 설정합니다." />
      <Panel title="운영 설정">
        {rows.map(([k, t, d]) => (
          <div className="au-setrow" key={k}>
            <div style={{ minWidth: 0 }}>
              <div className="au-setrow__t">{t}{k === 'maintenance' && s.maintenance && <span style={{ marginLeft: 8 }}><Badge tone="danger">활성</Badge></span>}</div>
              <div className="au-setrow__d">{d}</div>
            </div>
            <Toggle on={s[k]} onChange={set(k)} />
          </div>
        ))}
      </Panel>
      <div style={{ height: 16 }} />
      <Panel title="플랫폼 정보">
        <DL rows={[['서비스명', 'MyBDR — 전국 농구 매칭 플랫폼'], ['도메인', 'mybdr.kr'], ['버전', 'v2.40 (관리자 통합)'], ['디자인시스템', 'Toss · toss.css']]} />
      </Panel>
    </div>
  );
}

Object.assign(window, { AuCommunity, AuAwards, AuReports, AuSuggestions, AuPayments, AuPlans, AuCampaigns, AuPartners, AuAnalytics, AuCategories, AuLogs, AuNotifications, AuSettings });
})();
