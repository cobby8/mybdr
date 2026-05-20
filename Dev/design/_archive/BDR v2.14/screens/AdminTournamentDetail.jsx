/* global React, AdminShell, AdminDetailModal */

// =====================================================================
// AdminTournamentDetail.jsx — Admin-B · 대회 admin 상세 (v2.13 신규)
//   진입: setRoute('adminTournamentDetail')  (AdminTournaments row 클릭)
//   복귀: setRoute('adminTournaments')
//   에러: state='error' → 본문에 EmptyState
//
// 운영 source: src/app/(admin)/admin/tournaments/[id]/page.tsx
// 패턴: 좌 정보 카드 + 우 액션 카드 + 본문 5 sub-tab (개요/참가팀/매치/종별/감사로그)
// 차별화: 운영자 이전 / 공개 토글 / 감사 로그 진입 (B-3 / B-4 와 연결)
// =====================================================================

const ADMIN_TD_MOCK = {
  tournament_id: 'tn_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  series_label: 'BDR 서머 오픈 시리즈',
  status: 'live',
  status_label: '진행중',
  status_tone: 'ok',
  is_published: true,
  apply_start_at: '2026-05-01 00:00',
  apply_end_at: '2026-05-25 23:59',
  starts_at: '2026-06-15',
  ends_at: '2026-06-22',
  venue_name: '강남 베이스코트',
  organizer_user_id: 'u_2025_ohyeongjin',
  organizer_name: '오영진',
  organizer_email: 'oyj@example.com',
  division_count: 4,
  team_count: 38,
  team_max: 44,
  match_count: 21,
  match_done: 14,
  reports_count: 0,
  created_at: '2026-04-20',
  last_updated_at: '2026-05-14 11:28'
};

const ADMIN_TD_TEAMS = [
{ team_id: 'tm_run_n_gun', name: 'Run N Gun', division: 'A · 오픈', captain: '오영진', members: 4, status: 'approved', status_label: '승인', status_tone: 'ok' },
{ team_id: 'tm_streetballers', name: 'Streetballers', division: 'A · 오픈', captain: '박하늘', members: 4, status: 'approved', status_label: '승인', status_tone: 'ok' },
{ team_id: 'tm_jamsil_bc', name: '잠실 BC', division: 'A · 오픈', captain: '한지석', members: 5, status: 'approved', status_label: '승인', status_tone: 'ok' },
{ team_id: 'tm_kangnam_wings', name: '강남 윙스', division: 'B · U18', captain: '서민지', members: 4, status: 'pending', status_label: '대기', status_tone: 'warn' },
{ team_id: 'tm_seocho_colossus', name: '서초 콜로서스', division: 'A · 오픈', captain: '강도현', members: 4, status: 'approved', status_label: '승인', status_tone: 'ok' }];


const ADMIN_TD_DIVISIONS = [
{ id: 'd1', label: 'A · 오픈', format: '32강 토너먼트', max_teams: 16, teams: 14 },
{ id: 'd2', label: 'B · U18', format: '16강 토너먼트', max_teams: 12, teams: 10 },
{ id: 'd3', label: 'C · 여성부', format: '8강 토너먼트', max_teams: 8, teams: 6 },
{ id: 'd4', label: 'D · 시니어', format: '리그전', max_teams: 8, teams: 8 }];


const ADMIN_TD_MATCHES = [
{ match_id: 'm_001', round: '예선 #1', home: 'Run N Gun', away: '잠실 BC', court: '강남 1코트', at: '2026-06-15 14:00', score: '21-18', status: 'done', status_tone: 'ok' },
{ match_id: 'm_002', round: '예선 #1', home: 'Streetballers', away: '서초 콜로서스', court: '강남 2코트', at: '2026-06-15 15:00', score: '21-16', status: 'done', status_tone: 'ok' },
{ match_id: 'm_003', round: '예선 #2', home: 'Run N Gun', away: 'Streetballers', court: '강남 1코트', at: '2026-06-16 14:00', score: '—', status: 'scheduled', status_tone: 'info' }];


const ADMIN_TD_AUDIT_PREVIEW = [
{ log_id: 'lg_t_001', at: '2026-05-14 11:28', actor: '김도훈', action: 'TOURNAMENT_PUBLISH', severity: 'info' },
{ log_id: 'lg_t_002', at: '2026-05-12 09:42', actor: '오영진', action: 'DIVISION_ADD', severity: 'info' },
{ log_id: 'lg_t_003', at: '2026-05-10 18:00', actor: '시스템', action: 'AUTO_APPROVE_TEAM', severity: 'info' }];


function AdminTournamentDetail({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [subTab, setSubTab] = React.useState('overview');
  const [isPublished, setIsPublished] = React.useState(ADMIN_TD_MOCK.is_published);

  const t = ADMIN_TD_MOCK;
  const teamFillPct = Math.round(t.team_count / t.team_max * 100);
  const matchProgressPct = Math.round(t.match_done / t.match_count * 100);

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


  // 에러 / 로딩 상태군
  if (mockState === 'error') {
    return (
      <AdminShell route="adminTournamentDetail" setRoute={setRoute} eyebrow="ADMIN · 콘텐츠" title="대회 admin 상세"
        adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
        topbarRight={dashTopbarRight}
        breadcrumbs={[{ label: 'ADMIN', onClick: () => setRoute('adminDashboard') }, { label: '대회 관리', onClick: () => setRoute('adminTournaments') }, { label: '상세' }]}>
        <div style={errorBoxStyle}>
          <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--err)' }}>error</span>
          <h3 style={{ margin: 0, fontSize: 16 }}>데이터를 불러올 수 없어요</h3>
          <button type="button" className="btn btn--primary" onClick={() => setMockState('filled')}>다시 시도</button>
        </div>
      </AdminShell>);

  }
  if (mockState === 'loading') {
    return (
      <AdminShell route="adminTournamentDetail" setRoute={setRoute} eyebrow="ADMIN · 콘텐츠" title="대회 admin 상세"
        adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
        topbarRight={dashTopbarRight}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} style={skeletonStyle} />)}
        </div>
      </AdminShell>);

  }

  return (
    <AdminShell
      route="adminTournamentDetail"
      setRoute={setRoute}
      eyebrow={`ADMIN · 대회 관리 > ${t.name}`}
      title={t.name}
      subtitle={`${t.series_label} · ${t.apply_start_at.split(' ')[0]} ~ ${t.apply_end_at.split(' ')[0]} 신청 · 본선 ${t.starts_at} ~ ${t.ends_at}`}
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '콘텐츠' },
      { label: '대회 관리', onClick: () => setRoute('adminTournaments') },
      { label: t.name }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentAuditLog')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
            감사 로그
          </button>
          <button type="button" className="btn btn--primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            수정
          </button>
        </>
      }>

      {/* 좌 정보 / 우 액션 — 2 컬럼 상단 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 12, marginBottom: 16 }}>
        {/* 좌 — 기본 정보 + KPI */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
            <span className="admin-stat-pill" data-tone={t.status_tone}>{t.status_label}</span>
            <span className="admin-stat-pill" data-tone={isPublished ? 'ok' : 'mute'}>
              <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{isPublished ? 'public' : 'lock'}</span>
              {isPublished ? '공개' : '비공개'}
            </span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{t.tournament_id}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <KpiTile label="종별" value={t.division_count} icon="category" />
            <KpiTile label="참가팀" value={`${t.team_count}/${t.team_max}`} sub={`${teamFillPct}% 채워짐`} icon="groups" accent />
            <KpiTile label="매치" value={`${t.match_done}/${t.match_count}`} sub={`${matchProgressPct}% 진행`} icon="sports_basketball" />
          </div>

          <dl style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 8, columnGap: 12, margin: '16px 0 0 0', fontSize: 13 }}>
            <dt style={dtStyle}>운영자</dt>
            <dd style={ddStyle}>{t.organizer_name} <span style={{ color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginLeft: 4 }}>{t.organizer_email}</span></dd>
            <dt style={dtStyle}>경기장</dt>
            <dd style={ddStyle}>{t.venue_name}</dd>
            <dt style={dtStyle}>신청 기간</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{t.apply_start_at} ~ {t.apply_end_at}</dd>
            <dt style={dtStyle}>본선</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{t.starts_at} ~ {t.ends_at}</dd>
            <dt style={dtStyle}>최종 수정</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{t.last_updated_at}</dd>
          </dl>
        </div>

        {/* 우 — 액션 카드 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...cardStyle, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>상태 / 공개</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13 }}>공개 게재</span>
              <button
                type="button"
                role="switch"
                aria-checked={isPublished}
                onClick={() => setIsPublished(!isPublished)}
                style={{
                  width: 38, height: 22, padding: 2,
                  background: isPublished ? 'var(--accent)' : 'var(--bg-alt)',
                  border: '1px solid var(--border)', borderRadius: 11,
                  cursor: 'pointer', position: 'relative'
                }}>

                <span style={{ display: 'block', width: 16, height: 16, borderRadius: 50, background: '#fff', transform: `translateX(${isPublished ? 16 : 0}px)`, transition: 'transform .12s ease' }} />
              </button>
            </div>
            <select style={{ ...inputStyle, marginTop: 6 }} defaultValue={t.status}>
              <option value="draft">초안</option>
              <option value="apply">신청중</option>
              <option value="live">진행중</option>
              <option value="done">완료</option>
              <option value="archived">보관</option>
            </select>
          </div>

          <div style={{ ...cardStyle, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>위험 액션</div>
            <button type="button" className="btn" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => setRoute('adminTournamentTransferOrganizer')}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--err)' }}>swap_horiz</span>
                운영자 이전
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>chevron_right</span>
            </button>
            <button type="button" className="btn" style={{ width: '100%', justifyContent: 'space-between', marginTop: 6, color: 'var(--err)' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>archive</span>
                대회 보관
              </span>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>chevron_right</span>
            </button>
          </div>
        </div>
      </section>

      {/* sub-tab nav */}
      <nav style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
        {[
        { k: 'overview', label: '개요', icon: 'info' },
        { k: 'teams', label: `참가팀 (${t.team_count})`, icon: 'groups' },
        { k: 'matches', label: `매치 (${t.match_count})`, icon: 'sports_basketball' },
        { k: 'divisions', label: `종별 (${t.division_count})`, icon: 'category' },
        { k: 'audit', label: '감사 로그', icon: 'history' }].
        map((tab) =>
        <button
          key={tab.k}
          type="button"
          onClick={() => setSubTab(tab.k)}
          style={{
            padding: '10px 14px',
            background: 'transparent',
            border: 0,
            borderBottom: subTab === tab.k ? '2px solid var(--accent)' : '2px solid transparent',
            color: subTab === tab.k ? 'var(--ink)' : 'var(--ink-mute)',
            fontWeight: subTab === tab.k ? 600 : 400,
            fontSize: 13.5,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'inherit'
          }}>

            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{tab.icon}</span>
            {tab.label}
          </button>
        )}
      </nav>

      {/* sub-tab 본문 */}
      {subTab === 'overview' && <OverviewTab t={t} />}
      {subTab === 'teams' && <TeamsTab teams={ADMIN_TD_TEAMS} />}
      {subTab === 'matches' && <MatchesTab matches={ADMIN_TD_MATCHES} />}
      {subTab === 'divisions' && <DivisionsTab divisions={ADMIN_TD_DIVISIONS} />}
      {subTab === 'audit' && <AuditPreviewTab logs={ADMIN_TD_AUDIT_PREVIEW} setRoute={setRoute} />}
    </AdminShell>);

}

// ─────── sub-tab 본문들 ───────
function OverviewTab({ t }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>일정</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
          <li style={{ display: 'flex', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--accent)' }}>edit_calendar</span>
            <div>
              <div style={{ fontWeight: 600 }}>신청 기간</div>
              <div style={{ color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginTop: 2 }}>{t.apply_start_at} ~ {t.apply_end_at}</div>
            </div>
          </li>
          <li style={{ display: 'flex', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ok)' }}>play_circle</span>
            <div>
              <div style={{ fontWeight: 600 }}>본선</div>
              <div style={{ color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', fontSize: 11, marginTop: 2 }}>{t.starts_at} ~ {t.ends_at}</div>
            </div>
          </li>
        </ul>
      </div>
      <div style={cardStyle}>
        <div style={sectionLabelStyle}>최근 변경</div>
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
          {ADMIN_TD_AUDIT_PREVIEW.map((l) =>
          <li key={l.log_id} style={{ display: 'flex', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: 50, background: 'var(--ok)', marginTop: 7 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)' }}>{l.action}</code>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{l.at.split(' ')[0]}</span>
                </div>
                <div style={{ color: 'var(--ink-mute)', fontSize: 11 }}>{l.actor}</div>
              </div>
            </li>
          )}
        </ul>
      </div>
    </div>);

}

function TeamsTab({ teams }) {
  return (
    <div style={cardStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={thStyle}>팀명</th>
            <th style={thStyle}>종별</th>
            <th style={thStyle}>캡틴</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>멤버</th>
            <th style={thStyle}>상태</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((tm) =>
          <tr key={tm.team_id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={tdStyle}><span style={{ fontWeight: 600 }}>{tm.name}</span></td>
              <td style={{ ...tdStyle, color: 'var(--ink-soft)' }}>{tm.division}</td>
              <td style={{ ...tdStyle, color: 'var(--ink-soft)' }}>{tm.captain}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--ff-mono)' }}>{tm.members}</td>
              <td style={tdStyle}><span className="admin-stat-pill" data-tone={tm.status_tone}>{tm.status_label}</span></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

function MatchesTab({ matches }) {
  return (
    <div style={cardStyle}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={thStyle}>라운드</th>
            <th style={thStyle}>대진</th>
            <th style={thStyle}>코트</th>
            <th style={thStyle}>일시</th>
            <th style={{ ...thStyle, textAlign: 'right' }}>점수</th>
            <th style={thStyle}>상태</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) =>
          <tr key={m.match_id} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ ...tdStyle, color: 'var(--ink-soft)' }}>{m.round}</td>
              <td style={tdStyle}><span style={{ fontWeight: 600 }}>{m.home}</span> <span style={{ color: 'var(--ink-mute)' }}> vs </span> <span style={{ fontWeight: 600 }}>{m.away}</span></td>
              <td style={{ ...tdStyle, color: 'var(--ink-soft)' }}>{m.court}</td>
              <td style={{ ...tdStyle, fontFamily: 'var(--ff-mono)', fontSize: 11.5 }}>{m.at}</td>
              <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'var(--ff-mono)', fontWeight: 700 }}>{m.score}</td>
              <td style={tdStyle}><span className="admin-stat-pill" data-tone={m.status_tone}>{m.status === 'done' ? '완료' : m.status === 'scheduled' ? '예정' : m.status}</span></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>);

}

function DivisionsTab({ divisions }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
      {divisions.map((d) =>
      <div key={d.id} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{d.label}</span>
            <span className="admin-stat-pill" data-tone="mute">{d.format}</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--ff-mono)' }}>{d.teams}/{d.max_teams}</span> 팀
          </div>
          <div style={{ height: 4, background: 'var(--bg-alt)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${d.teams / d.max_teams * 100}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      )}
    </div>);

}

function AuditPreviewTab({ logs, setRoute }) {
  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <div style={sectionLabelStyle}>최근 감사 로그 (3건 미리보기)</div>
        <button type="button" onClick={() => setRoute('adminTournamentAuditLog')} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 로그 →</button>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {logs.map((l, i) =>
        <li key={l.log_id} style={{ padding: '12px 0', borderBottom: i < logs.length - 1 ? '1px solid var(--border)' : 0, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ width: 6, height: 6, borderRadius: 50, background: l.severity === 'error' ? 'var(--err)' : l.severity === 'warn' ? 'var(--warn, var(--accent))' : 'var(--ok)' }} />
            <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--accent)', flex: '0 0 200px' }}>{l.action}</code>
            <span style={{ fontSize: 12.5, color: 'var(--ink-soft)', flex: 1 }}>{l.actor}</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{l.at}</span>
          </li>
        )}
      </ul>
    </div>);

}

// ─────── 스타일 헬퍼 ───────
const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const sectionLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 };
const dtStyle = { color: 'var(--ink-mute)' };
const ddStyle = { margin: 0, color: 'var(--ink)' };
const thStyle = { textAlign: 'left', padding: '10px 0', fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 };
const tdStyle = { padding: '12px 0', color: 'var(--ink)' };
const inputStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };
const errorBoxStyle = { background: 'var(--bg-card)', border: '1px dashed var(--border-strong, var(--border))', borderRadius: 6, padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 };
const skeletonStyle = { height: 80, background: 'var(--bg-alt)', borderRadius: 6 };

function KpiTile({ label, value, sub, icon, accent }) {
  return (
    <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ff-display)', color: accent ? 'var(--accent)' : 'var(--ink)', marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{sub}</div>}
    </div>);

}

window.AdminTournamentDetail = AdminTournamentDetail;
