/* global React, AdminShell */

// =====================================================================
// AdminTournamentAdminHome.jsx — Admin-E · 대회 운영자 도구 홈 (v2.14 신규)
//   진입: setRoute('adminTournamentAdminHome')  (운영 /tournament-admin)
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → 본문 EmptyState
//
// 패턴: tournament_admin 권한 사용자 진입점.
//   - 상단 통계 카드 4 (진행중/신청중/완료/작성중)
//   - 빠른 액션 4 (새 대회 / 시리즈 / 단체 / 템플릿)
//   - 좌 최근 활동 / 우 곧 시작 대회 카드
// 운영 source: src/app/(admin)/tournament-admin/page.tsx
// =====================================================================

const TAH_STATS = {
  live: 2,
  apply: 3,
  done: 12,
  draft: 1
};

const TAH_TOURNAMENTS_NEXT = [
{ id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4', d_day: 31, teams: '38/44', status: 'live', status_label: '진행중', status_tone: 'ok', published: true },
{ id: 'tn_2026_challenge_8', name: 'BDR 챌린지 #8', d_day: 38, teams: '24/32', status: 'live', status_label: '진행중', status_tone: 'ok', published: true },
{ id: 'tn_2026_rookie_4', name: '루키 컵 #4', d_day: 56, teams: '12/16', status: 'apply', status_label: '신청중', status_tone: 'warn', published: true },
{ id: 'tn_2026_winter_3', name: '윈터 인비테이셔널 #3', d_day: 219, teams: '6/16', status: 'apply', status_label: '신청중', status_tone: 'warn', published: false }];


const TAH_RECENT = [
{ id: 'a1', icon: 'edit', action: 'BDR 서머 오픈 #4 설정 수정', at: '오늘 11:28', tournament: 'BDR 서머 오픈 #4' },
{ id: 'a2', icon: 'check_circle', action: '루키 컵 #4 신청 정책 완료', at: '어제 22:14', tournament: '루키 컵 #4' },
{ id: 'a3', icon: 'add', action: '강남 윙스 팀 승인', at: '어제 18:00', tournament: 'BDR 서머 오픈 #4' },
{ id: 'a4', icon: 'public', action: '챌린지 #8 공개 처리', at: '5/13 14:22', tournament: 'BDR 챌린지 #8' },
{ id: 'a5', icon: 'group_add', action: '윈터 #3 운영자 도구 진입', at: '5/12 09:14', tournament: '윈터 인비테이셔널 #3' }];


function AdminTournamentAdminHome({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty (대회 0)</option>
          <option value="loading">C · loading</option>
          <option value="error">B · error</option>
        </select>
      </div>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">OY</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
          <span className="admin-user__role">tournament admin</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  // empty 상태 — 운영 대회 0건
  if (mockState === 'empty') {
    return (
      <AdminShell route="adminTournamentAdminHome" setRoute={setRoute} eyebrow="ADMIN · 대회 운영" title="대회 운영자 도구"
        adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
        topbarRight={dashTopbarRight}
        breadcrumbs={[{ label: 'ADMIN', onClick: () => setRoute('adminDashboard') }, { label: '대회 운영자 도구' }]}>
        <div style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)', borderRadius: 6, padding: '64px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 80, height: 80, borderRadius: 50, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 40, color: 'var(--ink-mute)' }}>emoji_events</span>
          </div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>운영 중인 대회가 없어요</h2>
          <p style={{ margin: 0, color: 'var(--ink-mute)', fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>
            새 대회를 만들거나, 시리즈를 먼저 생성해서 회차로 운영을 시작하세요.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn--primary" onClick={() => setRoute('adminTournamentNew')}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
              새 대회 만들기
            </button>
            <button type="button" className="btn">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>collections_bookmark</span>
              시리즈 관리
            </button>
          </div>
        </div>
      </AdminShell>);

  }

  return (
    <AdminShell
      route="adminTournamentAdminHome"
      setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영"
      title="대회 운영자 도구"
      subtitle="내가 운영하는 대회·시리즈·단체를 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentAdminList')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>list</span>
            대회 목록
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('adminTournamentNew')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add_circle</span>
            새 대회 만들기
          </button>
        </>
      }>

      {/* 통계 4 카드 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
        <StatCard label="진행중" value={TAH_STATS.live} icon="play_circle" tone="ok" onClick={() => setRoute('adminTournamentAdminList')} />
        <StatCard label="신청중" value={TAH_STATS.apply} icon="edit_calendar" tone="warn" onClick={() => setRoute('adminTournamentAdminList')} />
        <StatCard label="완료" value={TAH_STATS.done} icon="check_circle" tone="mute" onClick={() => setRoute('adminTournamentAdminList')} />
        <StatCard label="작성중" value={TAH_STATS.draft} icon="edit_note" tone="info" onClick={() => setRoute('adminTournamentAdminList')} />
      </section>

      {/* 빠른 액션 4 */}
      <section style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>빠른 액션</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          <QuickAction icon="add_circle" label="새 대회 만들기" desc="1-step 압축 wizard" onClick={() => setRoute('adminTournamentNew')} primary />
          <QuickAction icon="collections_bookmark" label="시리즈 관리" desc="시리즈 + 회차" onClick={() => {}} />
          <QuickAction icon="domain" label="단체 관리" desc="내 단체 + 멤버" onClick={() => {}} />
          <QuickAction icon="auto_awesome" label="템플릿" desc="재사용 셋업" onClick={() => {}} />
        </div>
      </section>

      {/* 좌 최근 활동 / 우 곧 시작 대회 — 2 컬럼 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.2fr)', gap: 12 }}>
        {/* 좌 — 최근 활동 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={sectionLabelStyle}>최근 활동</div>
            <button type="button" onClick={() => setRoute('adminLogs')} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 →</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {TAH_RECENT.map((a, i) =>
            <li key={a.id} style={{ padding: '10px 0', borderBottom: i < TAH_RECENT.length - 1 ? '1px solid var(--border)' : 0, display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{a.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.action}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{a.tournament}</div>
                </div>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{a.at}</span>
              </li>
            )}
          </ul>
        </div>

        {/* 우 — 곧 시작 대회 */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={sectionLabelStyle}>곧 시작 / 진행중 대회</div>
            <button type="button" onClick={() => setRoute('adminTournamentAdminList')} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 →</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {TAH_TOURNAMENTS_NEXT.map((t) =>
            <li key={t.id}>
                <button
                type="button"
                onClick={() => setRoute('adminTournamentSetupHub')}
                style={{
                  width: '100%',
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: 12, background: 'var(--bg-alt)', borderRadius: 4,
                  border: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
                }}>

                  <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  width: 50, padding: '6px 4px',
                  background: t.d_day <= 30 ? 'var(--accent)' : 'var(--bg-card)',
                  color: t.d_day <= 30 ? '#fff' : 'var(--ink-mute)',
                  borderRadius: 4, flexShrink: 0
                }}>
                    <span style={{ fontSize: 9, fontFamily: 'var(--ff-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>D-</span>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--ff-display)' }}>{t.d_day}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      {!t.published &&
                    <span className="admin-stat-pill" data-tone="mute" style={{ fontSize: 9.5 }}>비공개</span>
                    }
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--ink-mute)' }}>
                      <span className="admin-stat-pill" data-tone={t.status_tone}>{t.status_label}</span>
                      <span style={{ fontFamily: 'var(--ff-mono)' }}>{t.teams} 팀</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>chevron_right</span>
                </button>
              </li>
            )}
          </ul>
        </div>
      </section>
    </AdminShell>);

}

// ─────── helpers ───────
function StatCard({ label, value, icon, tone, onClick }) {
  const toneColor = tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--accent)' : tone === 'info' ? 'var(--cafe-blue, var(--accent))' : 'var(--ink-soft)';
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${toneColor}`,
        borderRadius: 6, padding: 14,
        display: 'flex', flexDirection: 'column', gap: 6,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
      }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: toneColor }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'var(--ff-display)', color: 'var(--ink)' }}>{value}</div>
    </button>);

}

function QuickAction({ icon, label, desc, onClick, primary }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        padding: 14,
        background: primary ? 'var(--accent)' : 'var(--bg-card)',
        color: primary ? '#fff' : 'var(--ink)',
        border: `1px solid ${primary ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 6,
        cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit'
      }}>

      <span className="material-symbols-outlined" style={{ fontSize: 20, color: primary ? '#fff' : 'var(--accent)' }}>{icon}</span>
      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{label}</span>
      <span style={{ fontSize: 11, color: primary ? 'rgba(255,255,255,0.85)' : 'var(--ink-mute)' }}>{desc}</span>
    </button>);

}

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const sectionLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 };

window.AdminTournamentAdminHome = AdminTournamentAdminHome;
