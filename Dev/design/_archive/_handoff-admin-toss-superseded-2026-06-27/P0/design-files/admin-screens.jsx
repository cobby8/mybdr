/* global React, window, Icon, Btn, Badge, StatusTabs, FilterBar, DataTable, DetailModal, PanelStat, PanelRow, MockToggle */

// =====================================================================
// admin-screens.jsx — 관리자 콘솔 5화면 (Toss 리스킨, 기능 유지)
//   사용자 / 대회 / 경기 / 커뮤니티 / 단체
// =====================================================================

const A = () => window.ADMIN;
const PER = 6;

function PageHead({ eyebrow, title, sub, actions }) {
  return (
    <div className="ts-ph">
      <div className="ts-ph__row">
        <div>
          <div className="ts-ph__eyebrow">{eyebrow}</div>
          <h1 className="ts-ph__title">{title}</h1>
          {sub && <p className="ts-ph__sub">{sub}</p>}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </div>);
}

function useTable(initialSort) {
  const [tab, setTab] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const [sort, setSort] = React.useState(initialSort);
  const [page, setPage] = React.useState(1);
  const [sel, setSel] = React.useState([]);
  const [detail, setDetail] = React.useState(null);
  const [mock, setMock] = React.useState('filled');
  return { tab, setTab, search, setSearch, sort, setSort, page, setPage, sel, setSel, detail, setDetail, mock, setMock };
}

function applySort(rows, sort) {
  if (!sort) return rows;
  return [...rows].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key];
    if (va == null) return 1; if (vb == null) return -1;
    if (va < vb) return sort.dir === 'asc' ? -1 : 1;
    if (va > vb) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });
}

// ════════════════════════════════════════════════ 사용자
function AdminUsers() {
  const t = useTable({ key: 'lastSeen', dir: 'desc' });
  const D = A();
  const counts = { all: D.USERS.length };
  Object.keys(D.USER_STATUS).forEach((k) => counts[k] = D.USERS.filter((u) => u.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.USERS;
  if (t.tab !== 'all') rows = rows.filter((u) => u.status === t.tab);
  if (t.search) { const q = t.search.toLowerCase(); rows = rows.filter((u) => u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER, t.page * PER);
  const ini = (s) => s.replace(/[^A-Za-z가-힣]/g, '').slice(0, 2).toUpperCase();

  const columns = [
    { key: 'nickname', label: '유저', sortable: true, width: '1.6fr', render: (r) =>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <span style={{ width: 34, height: 34, borderRadius: 50, background: 'var(--primary-weak)', color: 'var(--primary)', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, flex: '0 0 auto' }}>{ini(r.nickname)}</span>
        <span style={{ minWidth: 0 }}><span style={{ display: 'block', fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.nickname}</span><span style={{ fontSize: 12, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>{r.email}</span></span>
      </div> },
    { key: 'tier', label: '등급', sortable: true, width: 70, render: (r) => <Badge tone={D.TIER_TONE[r.tier]}>{r.tier}</Badge> },
    { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.USER_STATUS[r.status].tone}>{D.USER_STATUS[r.status].label}</Badge> },
    { key: 'region', label: '지역', sortable: true, width: 100 },
    { key: 'games', label: '경기', sortable: true, width: 70, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.games}</span> },
    { key: 'reports', label: '신고', sortable: true, width: 60, align: 'right', render: (r) => r.reports > 0 ? <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--danger)' }}>{r.reports}</span> : <span style={{ color: 'var(--ink-dim)' }}>—</span> },
    { key: 'lastSeen', label: '최근 활동', sortable: true, width: 130, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.lastSeen.split(' ')[0]}</span> },
  ];

  return (
    <div>
      <PageHead eyebrow="ADMIN · 사용자" title="유저 관리" sub="전체 유저의 상태·등급·활동을 관리하고 신고 누적 계정에 조치합니다."
        actions={<><MockToggle value={t.mock} onChange={t.setMock} /><Btn variant="secondary" icon="download">CSV</Btn></>} />
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'active', label: '활성', count: counts.active }, { key: 'new', label: '신규', count: counts.new }, { key: 'dormant', label: '휴면', count: counts.dormant }, { key: 'suspended', label: '정지', count: counts.suspended }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '닉네임 · 이메일 검색' }}
        onReset={() => { t.setSearch(''); t.setTab('all'); t.setPage(1); }}
        actions={t.sel.length > 0 && <><Btn variant="secondary" size="sm" icon="mail">메시지</Btn><Btn variant="danger" size="sm" icon="ban">정지</Btn></>} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort}
        selectable selected={t.sel} onSelectChange={t.setSel} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER, onChange: t.setPage }}
        emptyTitle="유저가 없습니다" emptyDesc="신규 가입자가 등록되면 표시됩니다." />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.nickname}
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn><Btn icon="external-link">프로필 보기</Btn></>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge tone={D.USER_STATUS[t.detail.status].tone}>{D.USER_STATUS[t.detail.status].label}</Badge>
            <Badge tone={D.TIER_TONE[t.detail.tier]}>{t.detail.tier}</Badge>
            {t.detail.reports > 0 && <Badge tone="danger" icon="flag">신고 {t.detail.reports}</Badge>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}><PanelStat label="경기수" value={t.detail.games} /><PanelStat label="소속 팀" value={t.detail.teams} /><PanelStat label="신고" value={t.detail.reports} tone={t.detail.reports ? 'danger' : ''} /></div>
          <div><PanelRow label="이메일" value={t.detail.email} /><PanelRow label="연락처" value={t.detail.phone} /><PanelRow label="지역" value={t.detail.region} /><PanelRow label="가입일" value={t.detail.joined} /><PanelRow label="최근 활동" value={t.detail.lastSeen} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 대회 (스타일만)
function AdminTournaments({ go }) {
  const t = useTable({ key: 'start', dir: 'desc' });
  const D = A();
  const counts = { all: D.TOURNAMENTS.length };
  Object.keys(D.TN_STATUS).forEach((k) => counts[k] = D.TOURNAMENTS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.TOURNAMENTS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.name.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER, t.page * PER);

  const columns = [
    { key: 'name', label: '대회명', sortable: true, width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
    { key: 'status', label: '상태', sortable: true, width: 90, render: (r) => <Badge tone={D.TN_STATUS[r.status].tone}>{D.TN_STATUS[r.status].label}</Badge> },
    { key: 'divisions', label: '종별', sortable: true, width: 64, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.divisions}</span> },
    { key: 'teams', label: '참가팀', sortable: true, width: 90, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)' }}><b style={{ color: 'var(--ink)' }}>{r.teams}</b><span style={{ color: 'var(--ink-dim)' }}>/{r.cap}</span></span> },
    { key: 'start', label: '시작일', sortable: true, width: 110, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.start}</span> },
    { key: 'organizer', label: '주최', sortable: true, width: 130 },
  ];
  return (
    <div>
      <PageHead eyebrow="ADMIN · 대회" title="대회 관리" sub="대회 목록과 접수 현황입니다. 상세 운영(종별·참가팀·대진)은 대회관리 리빌딩(Phase 4)에서 통합됩니다."
        actions={<><MockToggle value={t.mock} onChange={t.setMock} /><Btn icon="plus">새 대회</Btn></>} />
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'registering', label: '접수중', count: counts.registering }, { key: 'closed', label: '마감', count: counts.closed }, { key: 'draft', label: '작성중', count: counts.draft }, { key: 'done', label: '종료', count: counts.done }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '대회명 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER, onChange: t.setPage }} emptyTitle="대회가 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.name}
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn><Btn icon="settings" onClick={() => go && go('apply')}>운영 화면</Btn></>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Badge tone={D.TN_STATUS[t.detail.status].tone}>{D.TN_STATUS[t.detail.status].label}</Badge>
          <div style={{ display: 'flex', gap: 8 }}><PanelStat label="종별" value={t.detail.divisions} /><PanelStat label="참가팀" value={`${t.detail.teams}/${t.detail.cap}`} /><PanelStat label="참가비" value={`${(t.detail.fee / 10000)}만`} /></div>
          <div><PanelRow label="시작일" value={t.detail.start} /><PanelRow label="주최" value={t.detail.organizer} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 경기
function AdminGames() {
  const t = useTable({ key: 'when', dir: 'desc' });
  const D = A();
  const counts = { all: D.GAMES.length };
  Object.keys(D.GAME_STATUS).forEach((k) => counts[k] = D.GAMES.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.GAMES;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.title.includes(t.search) || x.court.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER, t.page * PER);
  const columns = [
    { key: 'title', label: '경기', sortable: true, width: '1.8fr', render: (r) => <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Icon name={r.type === 'match' ? 'swords' : 'users'} size={15} color="var(--ink-mute)" /><span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.title}</span></span> },
    { key: 'type', label: '유형', sortable: true, width: 70, render: (r) => <Badge tone="grey">{D.GAME_TYPE[r.type]}</Badge> },
    { key: 'court', label: '코트', sortable: true, width: '1fr' },
    { key: 'when', label: '일시', sortable: true, width: 140, render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12.5, color: 'var(--ink-mute)' }}>{r.when.slice(5)}</span> },
    { key: 'players', label: '인원', sortable: true, width: 64, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.players}</span> },
    { key: 'status', label: '상태', sortable: true, width: 84, render: (r) => <Badge tone={D.GAME_STATUS[r.status].tone}>{D.GAME_STATUS[r.status].label}</Badge> },
  ];
  return (
    <div>
      <PageHead eyebrow="ADMIN · 경기" title="경기 관리" sub="매치·픽업 경기의 일정과 진행 상태를 관리합니다."
        actions={<MockToggle value={t.mock} onChange={t.setMock} />} />
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'scheduled', label: '예정', count: counts.scheduled }, { key: 'live', label: '진행중', count: counts.live }, { key: 'finished', label: '종료', count: counts.finished }, { key: 'cancelled', label: '취소', count: counts.cancelled }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '경기 · 코트 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER, onChange: t.setPage }} emptyTitle="경기가 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.title}
        footer={<Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Badge tone={D.GAME_STATUS[t.detail.status].tone}>{D.GAME_STATUS[t.detail.status].label}</Badge>
          <div><PanelRow label="유형" value={D.GAME_TYPE[t.detail.type]} /><PanelRow label="코트" value={t.detail.court} /><PanelRow label="일시" value={t.detail.when} /><PanelRow label="참가 인원" value={`${t.detail.players}명`} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 커뮤니티
function AdminCommunity() {
  const t = useTable({ key: 'date', dir: 'desc' });
  const D = A();
  const counts = { all: D.POSTS.length };
  Object.keys(D.POST_STATUS).forEach((k) => counts[k] = D.POSTS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.POSTS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.title.includes(t.search) || x.author.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER, t.page * PER);
  const columns = [
    { key: 'title', label: '게시글', sortable: true, width: '2.2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{r.title}</span> },
    { key: 'board', label: '게시판', sortable: true, width: 100, render: (r) => <Badge tone="grey">{r.board}</Badge> },
    { key: 'author', label: '작성자', sortable: true, width: 90 },
    { key: 'comments', label: '댓글', sortable: true, width: 60, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)' }}>{r.comments}</span> },
    { key: 'reports', label: '신고', sortable: true, width: 60, align: 'right', render: (r) => r.reports > 0 ? <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: 'var(--danger)' }}>{r.reports}</span> : <span style={{ color: 'var(--ink-dim)' }}>—</span> },
    { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.POST_STATUS[r.status].tone}>{D.POST_STATUS[r.status].label}</Badge> },
  ];
  return (
    <div>
      <PageHead eyebrow="ADMIN · 커뮤니티" title="커뮤니티 관리" sub="게시글·댓글을 관리하고 신고된 콘텐츠를 검토·숨김 처리합니다."
        actions={<MockToggle value={t.mock} onChange={t.setMock} />} />
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'normal', label: '정상', count: counts.normal }, { key: 'reported', label: '신고', count: counts.reported }, { key: 'hidden', label: '숨김', count: counts.hidden }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '제목 · 작성자 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER, onChange: t.setPage }} emptyTitle="게시글이 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title="게시글 상세"
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>{t.detail?.reports > 0 && <Btn variant="danger" icon="eye-off">숨김 처리</Btn>}</>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>{t.detail.title}</div>
          <div style={{ display: 'flex', gap: 8 }}><Badge tone="grey">{t.detail.board}</Badge><Badge tone={D.POST_STATUS[t.detail.status].tone}>{D.POST_STATUS[t.detail.status].label}</Badge></div>
          <div><PanelRow label="작성자" value={t.detail.author} /><PanelRow label="작성일" value={t.detail.date} /><PanelRow label="좋아요" value={t.detail.likes} /><PanelRow label="댓글" value={t.detail.comments} /><PanelRow label="신고" value={t.detail.reports} /></div>
        </div>}
      </DetailModal>
    </div>);
}

// ════════════════════════════════════════════════ 단체
function AdminOrgs() {
  const t = useTable({ key: 'members', dir: 'desc' });
  const D = A();
  const counts = { all: D.ORGS.length };
  Object.keys(D.ORG_STATUS).forEach((k) => counts[k] = D.ORGS.filter((x) => x.status === k).length);
  let rows = t.mock === 'empty' ? [] : D.ORGS;
  if (t.tab !== 'all') rows = rows.filter((x) => x.status === t.tab);
  if (t.search) rows = rows.filter((x) => x.name.includes(t.search));
  rows = applySort(rows, t.sort);
  const paged = rows.slice((t.page - 1) * PER, t.page * PER);
  const columns = [
    { key: 'name', label: '단체명', sortable: true, width: '2fr', render: (r) => <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{r.name}</span> },
    { key: 'type', label: '유형', sortable: true, width: 80, render: (r) => <Badge tone="grey">{r.type}</Badge> },
    { key: 'region', label: '지역', sortable: true, width: 110 },
    { key: 'teams', label: '팀', sortable: true, width: 60, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.teams}</span> },
    { key: 'members', label: '회원', sortable: true, width: 80, align: 'right', render: (r) => <span style={{ fontFamily: 'var(--ff-mono)', color: 'var(--ink)' }}>{r.members}</span> },
    { key: 'status', label: '상태', sortable: true, width: 80, render: (r) => <Badge tone={D.ORG_STATUS[r.status].tone}>{D.ORG_STATUS[r.status].label}</Badge> },
  ];
  return (
    <div>
      <PageHead eyebrow="ADMIN · 단체" title="단체 관리" sub="협회·동호회·연맹을 관리하고 신규 단체 등록 신청을 승인합니다."
        actions={<MockToggle value={t.mock} onChange={t.setMock} />} />
      <StatusTabs current={t.tab} onChange={(k) => { t.setTab(k); t.setPage(1); }}
        tabs={[{ key: 'all', label: '전체', count: counts.all }, { key: 'approved', label: '승인', count: counts.approved }, { key: 'pending', label: '대기', count: counts.pending }]} />
      <FilterBar search={{ value: t.search, onChange: (v) => { t.setSearch(v); t.setPage(1); }, placeholder: '단체명 검색' }} onReset={() => { t.setSearch(''); t.setTab('all'); }} />
      <DataTable columns={columns} rows={paged} keyField="id" state={t.mock} sort={t.sort} onSortChange={t.setSort} onRowClick={t.setDetail}
        pagination={{ page: t.page, total: rows.length, perPage: PER, onChange: t.setPage }} emptyTitle="단체가 없습니다" />
      <DetailModal open={!!t.detail} onClose={() => t.setDetail(null)} title={t.detail?.name}
        footer={<><Btn variant="secondary" onClick={() => t.setDetail(null)}>닫기</Btn>{t.detail?.status === 'pending' && <><Btn variant="danger">반려</Btn><Btn icon="check">승인</Btn></>}</>}>
        {t.detail && <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 8 }}><Badge tone="grey">{t.detail.type}</Badge><Badge tone={D.ORG_STATUS[t.detail.status].tone}>{D.ORG_STATUS[t.detail.status].label}</Badge></div>
          <div style={{ display: 'flex', gap: 8 }}><PanelStat label="소속 팀" value={t.detail.teams} /><PanelStat label="회원" value={t.detail.members} /></div>
          <div><PanelRow label="지역" value={t.detail.region} /><PanelRow label="대표" value={t.detail.owner} /></div>
        </div>}
      </DetailModal>
    </div>);
}

Object.assign(window, { AdminUsers, AdminTournaments, AdminGames, AdminCommunity, AdminOrgs });
// shared helpers for admin-screens2.jsx (separate Babel scope)
window.useTable = useTable;
window.applySort = applySort;
window.__PH = (p) => <PageHead {...p} />;
