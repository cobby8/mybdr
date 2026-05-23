/* global React, AdminShell */

// =====================================================================
// AdminMe.jsx — Admin-D me · 운영자 마이페이지 (v2.11)
//   진입: setRoute('adminMe')
//   복귀: setRoute('adminDashboard')
//   에러: 없음 (마이페이지)
//
// 패턴: 2 컬럼
//   좌: 프로필 카드 + 권한 + 가입일 + 최근 활동 7일 막대
//   우: 활동 통계 + 빠른 액션 (비밀번호/2FA/로그아웃) + 활성 세션 목록
// =====================================================================

const ADMIN_ME_PROFILE = {
  admin_id: 'a_kimdohun',
  name: '김도훈',
  email: 'dh.kim@mybdr.kr',
  phone: '010-****-2402',
  role: 'super_admin',
  role_label: 'Super Admin',
  team: 'BDR 운영 / 콘텐츠',
  joined_at: '2024-01-15',
  last_login_at: '2026-05-15 18:42',
  last_login_ip: '203.245.x.x',
  two_factor_enabled: true,
  avatar_initials: 'DH'
};

const ADMIN_ME_STATS = {
  actions_today: 24,
  actions_week: 142,
  approvals: 41,
  resolved_reports: 18
};

const ADMIN_ME_ACTIVITY_7D = [
{ date: '05-09', count: 12 },
{ date: '05-10', count: 18 },
{ date: '05-11', count: 8 },
{ date: '05-12', count: 22 },
{ date: '05-13', count: 28 },
{ date: '05-14', count: 30 },
{ date: '05-15', count: 24 }];


const ADMIN_ME_RECENT = [
{ id: 'r1', icon: 'emoji_events', action: 'BDR 서머 오픈 #4 생성', at: '오늘 11:28', route: 'adminTournaments' },
{ id: 'r2', icon: 'block', action: 'thunderdunk 계정 정지', at: '어제 10:44', route: 'adminUsers' },
{ id: 'r3', icon: 'group', action: 'u_lee_park 권한 변경', at: '어제 09:22', route: 'adminUsers' },
{ id: 'r4', icon: 'check_circle', action: '신고 r_20260507_1118 처리 완료', at: '5/13 16:42', route: 'adminReports' },
{ id: 'r5', icon: 'handshake', action: '마포 아레나 파트너 승인', at: '5/14 18:30', route: 'adminPartners' }];


const ADMIN_ME_SESSIONS = [
{ id: 's1', device: 'Chrome · macOS', location: '서울', ip: '203.245.x.x', last_at: '활성', current: true },
{ id: 's2', device: 'Safari · iOS', location: '서울', ip: '112.158.x.x', last_at: '2시간 전', current: false },
{ id: 's3', device: 'Chrome · macOS', location: '서울', ip: '203.245.x.x', last_at: '어제', current: false }];


function AdminMe({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const me = ADMIN_ME_PROFILE;
  const maxAct = Math.max(...ADMIN_ME_ACTIVITY_7D.map((d) => d.count));

  const dashTopbarRight =
  <button className="admin-user" type="button">
      <div className="admin-user__avatar">{me.avatar_initials}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>{me.name}</span>
        <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
    </button>;


  return (
    <AdminShell
      route="adminMe"
      setRoute={setRoute}
      eyebrow="ADMIN · me"
      title="마이페이지"
      subtitle="내 운영자 계정 정보와 활동 내역을 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: 'me' },
      { label: '마이페이지' }]
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.4fr)', gap: 16 }}>
        {/* ─────── 좌 · 프로필 카드 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 헤더 카드 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 50, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-display)', fontSize: 20, fontWeight: 700 }}>
                {me.avatar_initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{me.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{me.email}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 14, flexWrap: 'wrap' }}>
              <span className="admin-stat-pill" data-tone="accent">{me.role_label}</span>
              <span className="admin-stat-pill" data-tone="mute">{me.team}</span>
              {me.two_factor_enabled &&
              <span className="admin-stat-pill" data-tone="ok">
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified_user</span>
                  2FA 활성
                </span>
              }
            </div>
            <button type="button" className="btn" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              프로필 수정
            </button>
          </section>

          {/* 계정 정보 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>계정 정보</div>
            <dl style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 8, columnGap: 12, margin: 0, fontSize: 13 }}>
              <dt style={{ color: 'var(--ink-mute)' }}>운영자 ID</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{me.admin_id}</dd>
              <dt style={{ color: 'var(--ink-mute)' }}>연락처</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{me.phone}</dd>
              <dt style={{ color: 'var(--ink-mute)' }}>가입일</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{me.joined_at}</dd>
              <dt style={{ color: 'var(--ink-mute)' }}>최근 로그인</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{me.last_login_at}</dd>
              <dt style={{ color: 'var(--ink-mute)' }}>접속 IP</dt>
              <dd style={{ margin: 0, fontFamily: 'var(--ff-mono)' }}>{me.last_login_ip}</dd>
            </dl>
          </section>

          {/* 빠른 액션 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>빠른 액션</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>password</span>
                비밀번호 변경
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{me.two_factor_enabled ? 'shield' : 'add_moderator'}</span>
                {me.two_factor_enabled ? '2FA 재설정' : '2FA 활성화'}
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start' }} onClick={() => setRoute('adminLogs')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>list_alt</span>
                내 활동 로그
              </button>
              <button type="button" className="btn" style={{ justifyContent: 'flex-start', color: 'var(--err)' }} onClick={() => setRoute('home')}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>logout</span>
                로그아웃
              </button>
            </div>
          </section>
        </div>

        {/* ─────── 우 · 통계 + 활동 + 세션 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 통계 4 */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            <StatTile label="오늘 액션" value={ADMIN_ME_STATS.actions_today} icon="today" />
            <StatTile label="7일 액션" value={ADMIN_ME_STATS.actions_week} icon="date_range" accent />
            <StatTile label="승인" value={ADMIN_ME_STATS.approvals} icon="check_circle" />
            <StatTile label="신고 처리" value={ADMIN_ME_STATS.resolved_reports} icon="gavel" />
          </section>

          {/* 7일 활동 차트 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>최근 7일 액션</div>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>총 {ADMIN_ME_ACTIVITY_7D.reduce((s, d) => s + d.count, 0)}건</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
              {ADMIN_ME_ACTIVITY_7D.map((d) => {
                const pct = d.count / maxAct;
                return (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-soft)' }}>{d.count}</span>
                    <div style={{ width: '100%', height: `${pct * 100}%`, minHeight: 4, background: 'var(--accent)', borderRadius: '4px 4px 0 0', opacity: 0.4 + pct * 0.6 }} />
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-dim)' }}>{d.date}</span>
                  </div>);

              })}
            </div>
          </section>

          {/* 최근 활동 5건 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>최근 활동</div>
              <button type="button" onClick={() => setRoute('adminLogs')} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 로그 →</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ADMIN_ME_RECENT.map((r, i) =>
              <li
                key={r.id}
                style={{
                  padding: '10px 0',
                  borderBottom: i < ADMIN_ME_RECENT.length - 1 ? '1px solid var(--border)' : 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer'
                }}
                onClick={() => setRoute(r.route)}>

                  <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{r.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.action}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{r.at}</span>
                </li>
              )}
            </ul>
          </section>

          {/* 활성 세션 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>활성 세션</div>
              <button type="button" style={{ fontSize: 11, color: 'var(--err)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>다른 기기 모두 로그아웃</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ADMIN_ME_SESSIONS.map((s) =>
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--bg-alt)', borderRadius: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>
                    {s.device.includes('iOS') || s.device.includes('Android') ? 'phone_iphone' : 'computer'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {s.device}
                      {s.current && <span className="admin-stat-pill" data-tone="ok">현재</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{s.location} · {s.ip}</div>
                  </div>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: s.current ? 'var(--ok)' : 'var(--ink-mute)' }}>{s.last_at}</span>
                  {!s.current &&
                <button type="button" style={{ background: 'transparent', border: 0, padding: 4, cursor: 'pointer', color: 'var(--ink-mute)' }} aria-label="세션 종료">
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                    </button>
                }
                </li>
              )}
            </ul>
          </section>
        </div>
      </div>
    </AdminShell>);

}

function StatTile({ label, value, icon, accent }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--ff-display)', color: accent ? 'var(--accent)' : 'var(--ink)' }}>{value}</div>
    </div>);

}

window.AdminMe = AdminMe;
