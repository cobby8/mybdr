/* global React, window */
// =====================================================================
// au-screens.jsx — 통합 콘솔 화면 (1/2)
//   대시보드 · 유저 · 대회 · 경기 · 팀 · 단체 · 코트
// =====================================================================
(function () {
const { useState } = React;
const D = window.ADMIN;
const { PageHead, StatRow, Toolbar, DataTable, PrimaryCell, Drawer, DL, Panel, StatusBadge, useFilter } = window;
const { Icon, Btn, Badge } = window;
const won = (n) => n.toLocaleString('ko-KR') + '원';
const ini = (s) => (s || '?').replace(/[^가-힣A-Za-z]/g, '').slice(0, 2) || (s || '?').slice(0, 2);

// 상태맵 → 필터 탭 (전체 + 각 상태 카운트)
function tabsFor(rows, map, key = 'status') {
  return [{ id: 'all', label: '전체', n: rows.length },
    ...Object.entries(map).map(([k, v]) => ({ id: k, label: v.label, n: rows.filter((r) => r[key] === k).length }))];
}

// ── 대시보드 ──────────────────────────────────────────────────────────
function AuDashboard({ go }) {
  const maxN = Math.max(...D.DASH.chart.map((c) => c.n));
  const quick = [
    { icon: 'trophy', label: '대회 만들기', to: 'tournaments' },
    { icon: 'user-cog', label: '유저 관리', to: 'users' },
    { icon: 'flag', label: '신고 검토', to: 'reports' },
    { icon: 'megaphone', label: '알림 발송', to: 'notifications' },
  ];
  return (
    <div>
      <PageHead eyebrow="운영 현황" icon="layout-dashboard" title="대시보드"
        sub="MyBDR 전체 운영 지표를 한눈에 확인합니다."
        actions={<Btn variant="secondary" icon="download" size="sm">리포트</Btn>} />
      <StatRow items={D.DASH.stats} />
      <div className="au-grid-2">
        <Panel title="최근 7일 신규 가입" sub="일자별 가입자 수">
          <div className="au-bars">
            {D.DASH.chart.map((c) => (
              <div className="au-bars__col" key={c.d}>
                <div className="au-bars__bar" style={{ height: `${Math.round((c.n / maxN) * 100)}%` }} title={`${c.n}명`} />
                <div className="au-bars__lbl">{c.d.slice(3)}</div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="빠른 작업">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {quick.map((q) => (
              <button key={q.to} type="button" className="ts-navlink" style={{ background: 'var(--grey-50)' }} onClick={() => go(q.to)}>
                <Icon name={q.icon} size={18} />{q.label}
                <Icon name="chevron-right" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
      <div style={{ height: 16 }} />
      <Panel title="최근 활동 로그" right={<Btn variant="ghost" size="sm" iconRight="arrow-right" onClick={() => go('logs')}>전체</Btn>}>
        <div className="au-feed">
          {D.DASH.logs.map((l) => (
            <div className="au-feed__row" key={l.id}>
              <span className="au-feed__dot" style={{ background: D.LOG_SEV[l.sev] || 'var(--ink-dim)' }} />
              <div className="au-feed__body">
                <div className="au-feed__title">{l.action}</div>
                <div className="au-feed__desc">{l.desc}</div>
                <div className="au-feed__meta">{l.who} · {l.when}</div>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

// ── 유저 관리 ─────────────────────────────────────────────────────────
function AuUsers({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.USERS, ['nickname', 'email', 'region']);
  const [sel, setSel] = useState(null);
  const [add, setAdd] = useState(false);
  const cols = [
    { key: 'u', label: '유저', render: (r) => <PrimaryCell initials={ini(r.nickname)} title={r.nickname} meta={r.email} accent={r.tier === 'VVIP' || r.tier === 'VIP'} /> },
    { key: 'tier', label: '등급', align: 'c', w: '84px', render: (r) => <Badge tone={D.TIER_TONE[r.tier]}>{r.tier}</Badge> },
    { key: 'region', label: '지역', w: '120px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'games', label: '경기', align: 'r', w: '72px', hideSm: true, cls: 'au-cell--num' },
    { key: 'lastSeen', label: '최근 접속', w: '150px', align: 'r', hideSm: true, cls: 'au-cell--mut', render: (r) => r.lastSeen.slice(0, 10) },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D.USER_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="사용자" icon="users" title="유저 관리" sub={`전체 ${D.USERS.length.toLocaleString()}명 · 신규·휴면·정지 회원을 관리합니다.`}
        actions={<><Btn variant="secondary" icon="download" size="sm">내보내기</Btn><Btn variant="primary" icon="user-plus" size="sm" onClick={() => setAdd(true)}>초대</Btn></>} />
      <Toolbar search={q} onSearch={setQ} placeholder="닉네임·이메일·지역 검색" tabs={tabsFor(D.USERS, D.USER_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.nickname} sub={sel?.email}
        foot={<><Btn variant="secondary" block>메시지</Btn><Btn variant="danger" block>계정 정지</Btn></>}>
        {sel && <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <Badge tone={D.TIER_TONE[sel.tier]}>{sel.tier} 등급</Badge>
            <StatusBadge map={D.USER_STATUS} value={sel.status} />
            {sel.reports > 0 && <Badge tone="danger" icon="flag">신고 {sel.reports}</Badge>}
          </div>
          <Btn variant="secondary" block icon="arrow-up-right" onClick={() => go('user:' + sel.id)}>상세 페이지 열기</Btn>
          <div style={{ height: 18 }} />
          <DL rows={[['연락처', sel.phone], ['지역', sel.region], ['소속 팀', `${sel.teams}개`], ['누적 경기', `${sel.games}경기`], ['가입일', sel.joined], ['최근 접속', sel.lastSeen]]} />
        </>}
      </Drawer>
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="유저 초대" sub="이메일로 가입 초대를 발송합니다." submitLabel="초대 발송"
        fields={[{ type: 'text', label: '이메일', placeholder: 'name@example.com' }, { type: 'select', label: '부여 권한', options: ['일반 회원', '대회 운영자', '심판', '관리자'] }, { type: 'text', label: '초대 메시지', opt: '선택', placeholder: '함께 해요!' }]} />
    </div>
  );
}

// ── 대회 관리 ─────────────────────────────────────────────────────────
function AuTournaments({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.TOURNAMENTS, ['name', 'organizer']);
  const [sel, setSel] = useState(null);
  const cols = [
    { key: 'name', label: '대회', render: (r) => <PrimaryCell initials="🏆" title={r.name} meta={`${r.organizer} · 종별 ${r.divisions}`} /> },
    { key: 'start', label: '개최일', w: '120px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'teams', label: '참가팀', align: 'r', w: '110px', render: (r) => <span className="au-cell--num">{r.teams}<span style={{ color: 'var(--ink-dim)' }}>/{r.cap}</span></span> },
    { key: 'fee', label: '참가비', align: 'r', w: '110px', hideSm: true, cls: 'au-cell--num', render: (r) => won(r.fee) },
    { key: 'status', label: '상태', align: 'c', w: '92px', render: (r) => <StatusBadge map={D.TN_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="콘텐츠 운영" icon="trophy" title="대회 관리" sub="대회 생성·접수·대진·정산을 관리합니다."
        actions={<><Btn variant="secondary" icon="settings-2" size="sm" onClick={() => go && go('categories')}>종별</Btn><Btn variant="primary" icon="plus" size="sm" onClick={() => go('create-tournament')}>새 대회</Btn></>} />
      <Toolbar search={q} onSearch={setQ} placeholder="대회명·주최 검색" tabs={tabsFor(D.TOURNAMENTS, D.TN_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} sub={sel ? `${sel.organizer} 주최` : ''}
        foot={<><Btn variant="secondary" block icon="users" onClick={() => sel && go && go('tournament:' + sel.id + ':teams')}>참가팀</Btn><Btn variant="primary" block icon="git-fork" onClick={() => sel && go && go('tournament:' + sel.id + ':bracket')}>대진표</Btn></>}>
        {sel && <>
          <div style={{ marginBottom: 18 }}><StatusBadge map={D.TN_STATUS} value={sel.status} /></div>
          <Btn variant="secondary" block icon="arrow-up-right" onClick={() => go('tournament:' + sel.id)}>상세 페이지 열기</Btn>
          <div style={{ height: 18 }} />
          <DL rows={[['개최일', sel.start], ['종별 수', `${sel.divisions}개`], ['참가팀', `${sel.teams} / ${sel.cap}팀`], ['참가비', won(sel.fee)], ['주최', sel.organizer]]} />
        </>}
      </Drawer>
    </div>
  );
}

// ── 경기 관리 ─────────────────────────────────────────────────────────
function AuGames({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.GAMES, ['title', 'court']);
  const [sel, setSel] = useState(null);
  const [add, setAdd] = useState(false);
  const cols = [
    { key: 'title', label: '경기', render: (r) => <PrimaryCell initials={r.type === 'match' ? '🆚' : '🏀'} title={r.title} meta={`${D.GAME_TYPE[r.type]} · ${r.court}`} /> },
    { key: 'when', label: '일시', w: '150px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'players', label: '인원', align: 'r', w: '72px', cls: 'au-cell--num' },
    { key: 'status', label: '상태', align: 'c', w: '92px', render: (r) => <StatusBadge map={D.GAME_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="콘텐츠 운영" icon="volleyball" title="경기 관리" sub="매치·픽업 경기의 진행 상태를 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>경기 등록</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="경기명·코트 검색" tabs={tabsFor(D.GAMES, D.GAME_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.title} sub={sel ? D.GAME_TYPE[sel.type] : ''}
        foot={<Btn variant="secondary" block icon="external-link" onClick={() => sel && go('game:' + sel.id)}>경기 상세</Btn>}>
        {sel && <>
          <div style={{ marginBottom: 18 }}><StatusBadge map={D.GAME_STATUS} value={sel.status} /></div>
          <DL rows={[['유형', D.GAME_TYPE[sel.type]], ['코트', sel.court], ['일시', sel.when], ['참가 인원', `${sel.players}명`]]} />
        </>}
      </Drawer>
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="경기 등록" sub="매치 또는 픽업 경기를 등록합니다." submitLabel="등록"
        fields={[{ type: 'text', label: '경기명', placeholder: '예: 주말 3대3' }, { type: 'pick', label: '유형', options: ['매치', '픽업'] }, { type: 'select', label: '코트', options: D.COURTS.map((c) => c.name) }, { type: 'text', label: '일시', placeholder: '2026-06-25 19:00' }]} />
    </div>
  );
}

// ── 팀 관리 ───────────────────────────────────────────────────────────
function AuTeams({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.TEAMS, ['name', 'region', 'org']);
  const [sel, setSel] = useState(null);
  const cols = [
    { key: 'name', label: '팀', render: (r) => <PrimaryCell initials={ini(r.name)} title={r.name} meta={r.org === '—' ? '무소속' : r.org} accent /> },
    { key: 'region', label: '지역', w: '120px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'members', label: '인원', align: 'r', w: '72px', cls: 'au-cell--num' },
    { key: 'tournaments', label: '대회', align: 'r', w: '72px', hideSm: true, cls: 'au-cell--num' },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D.TEAM_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="콘텐츠 운영" icon="users" title="팀 관리" sub={`등록 팀 ${D.TEAMS.length}개 · 소속·활동 현황을 관리합니다.`} />
      <Toolbar search={q} onSearch={setQ} placeholder="팀명·지역·소속 검색" tabs={tabsFor(D.TEAMS, D.TEAM_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} sub={sel?.region}
        foot={<Btn variant="secondary" block icon="external-link" onClick={() => sel && go('team:' + sel.id)}>팀 상세</Btn>}>
        {sel && <>
          <div style={{ marginBottom: 18 }}><StatusBadge map={D.TEAM_STATUS} value={sel.status} /></div>
          <DL rows={[['지역', sel.region], ['소속', sel.org], ['팀원', `${sel.members}명`], ['참가 대회', `${sel.tournaments}회`]]} />
        </>}
      </Drawer>
    </div>
  );
}

// ── 단체 관리 ─────────────────────────────────────────────────────────
function AuOrgs({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.ORGS, ['name', 'region', 'owner']);
  const [sel, setSel] = useState(null);
  const cols = [
    { key: 'name', label: '단체', render: (r) => <PrimaryCell initials={ini(r.name)} title={r.name} meta={`${r.type} · ${r.region}`} /> },
    { key: 'teams', label: '팀', align: 'r', w: '72px', cls: 'au-cell--num' },
    { key: 'members', label: '회원', align: 'r', w: '90px', hideSm: true, cls: 'au-cell--num', render: (r) => r.members.toLocaleString() },
    { key: 'owner', label: '대표', w: '110px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'status', label: '상태', align: 'c', w: '84px', render: (r) => <StatusBadge map={D.ORG_STATUS} value={r.status} /> },
  ];
  const pending = D.ORGS.filter((o) => o.status === 'pending').length;
  return (
    <div>
      <PageHead eyebrow="콘텐츠 운영" icon="building-2" title="단체 관리"
        sub={pending > 0 ? `승인 대기 ${pending}건 — 협회·연맹·동호회를 관리합니다.` : '협회·연맹·동호회를 관리합니다.'} />
      <Toolbar search={q} onSearch={setQ} placeholder="단체명·지역·대표 검색" tabs={tabsFor(D.ORGS, D.ORG_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} sub={sel?.type}
        foot={sel?.status === 'pending'
          ? <><Btn variant="danger" block>반려</Btn><Btn variant="primary" block icon="check">승인</Btn></>
          : <Btn variant="secondary" block icon="external-link" onClick={() => sel && go('org:' + sel.id)}>단체 상세</Btn>}>
        {sel && <>
          <div style={{ marginBottom: 18 }}><StatusBadge map={D.ORG_STATUS} value={sel.status} /></div>
          <DL rows={[['유형', sel.type], ['지역', sel.region], ['소속 팀', `${sel.teams}개`], ['회원 수', `${sel.members.toLocaleString()}명`], ['대표', sel.owner]]} />
        </>}
      </Drawer>
    </div>
  );
}

// ── 코트 관리 ─────────────────────────────────────────────────────────
function AuCourts({ go }) {
  const { q, setQ, tab, setTab, filtered } = useFilter(D.COURTS, ['name', 'region', 'owner']);
  const [sel, setSel] = useState(null);
  const [add, setAdd] = useState(false);
  const cols = [
    { key: 'name', label: '코트', render: (r) => <PrimaryCell initials={r.type === '실내' ? '🏟️' : '🛝'} title={r.name} meta={`${r.type} · ${r.region}`} /> },
    { key: 'owner', label: '운영주체', w: '150px', hideSm: true, cls: 'au-cell--mut' },
    { key: 'rate', label: '대관료', align: 'r', w: '110px', cls: 'au-cell--num', render: (r) => r.rate === 0 ? <span style={{ color: 'var(--ok)' }}>무료</span> : won(r.rate) },
    { key: 'status', label: '상태', align: 'c', w: '92px', render: (r) => <StatusBadge map={D.COURT_STATUS} value={r.status} /> },
  ];
  return (
    <div>
      <PageHead eyebrow="콘텐츠 운영" icon="map-pin" title="코트 관리" sub="실내·실외 코트 등록과 대관 상태를 관리합니다."
        actions={<Btn variant="primary" icon="plus" size="sm" onClick={() => setAdd(true)}>코트 등록</Btn>} />
      <Toolbar search={q} onSearch={setQ} placeholder="코트명·지역·운영주체 검색" tabs={tabsFor(D.COURTS, D.COURT_STATUS)} active={tab} onTab={setTab} />
      <DataTable columns={cols} rows={filtered} onRow={setSel} />
      <Drawer open={!!sel} onClose={() => setSel(null)} title={sel?.name} sub={sel?.region}
        foot={sel?.status === 'pending'
          ? <><Btn variant="danger" block>반려</Btn><Btn variant="primary" block icon="check">승인</Btn></>
          : <Btn variant="secondary" block icon="external-link" onClick={() => sel && go('court:' + sel.id)}>코트 상세</Btn>}>
        {sel && <>
          <div style={{ marginBottom: 18 }}><StatusBadge map={D.COURT_STATUS} value={sel.status} /></div>
          <DL rows={[['유형', sel.type], ['지역', sel.region], ['운영주체', sel.owner], ['대관료', sel.rate === 0 ? '무료' : won(sel.rate)]]} />
        </>}
      </Drawer>
      <window.AuAddModal open={add} onClose={() => setAdd(false)} title="코트 등록" sub="실내·실외 코트를 등록합니다. 등록 후 승인 대기 상태가 됩니다." submitLabel="등록 요청"
        fields={[{ type: 'text', label: '코트명', placeholder: '예: 망원 체육관' }, { type: 'pick', label: '유형', options: ['실내', '실외'] }, { type: 'select', label: '지역', options: D.OPT_REGIONS }, { type: 'text', label: '운영주체', placeholder: '예: 마포구민체육센터' }, { type: 'number', label: '대관료', opt: '시간당 · 원 (무료 0)', placeholder: '0' }]} />
    </div>
  );
}

Object.assign(window, { AuDashboard, AuUsers, AuTournaments, AuGames, AuTeams, AuOrgs, AuCourts, auTabsFor: tabsFor, auWon: won, auIni: ini });
})();
