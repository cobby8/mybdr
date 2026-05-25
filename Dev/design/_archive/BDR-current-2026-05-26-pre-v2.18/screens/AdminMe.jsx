/* global React, AdminShell */

// =====================================================================
// AdminMe.jsx — Admin-D me · 운영자 마이페이지 (v2.13 재박제)
//   진입: setRoute('adminMe')
//   복귀: setRoute('adminDashboard')
//   에러: 없음
//
// 운영 source: src/app/(admin)/admin/me/page.tsx (251줄)
// 패턴: 7 카드 구조 (운영 그대로 박제)
//   1. 로그인 정보 (비번/2FA/세션 흡수)
//   2. 본인인증 상태 (mock / portone / null)
//   3. 알림 (본인 미확인)
//   4. 건의사항 (본인 배정 미처리)
//   5. 권한 매트릭스 7종
//   6. 관리 토너먼트 목록 (상태별)
//   7. 최근 admin 활동 (활동 통계 흡수)
// =====================================================================

const ADMIN_ME_PROFILE = {
  admin_id: 'a_kimdohun',
  name: '김도훈',
  email: 'dh.kim@mybdr.kr',
  phone: '010-****-2402',
  role_primary: 'super_admin',
  role_label: 'Super Admin',
  team: 'BDR 운영 / 콘텐츠',
  joined_at: '2024-01-15',
  last_login_at: '2026-05-15 18:42',
  last_login_ip: '203.245.x.x',
  two_factor_enabled: true,
  avatar_initials: 'DH',
  verification_status: 'portone' // mock / portone / null
};

const ADMIN_ME_NOTIFICATIONS = [
{ id: 'n1', icon: 'report', title: '긴급 신고 — thunderdunk 욕설', at: '5분 전', tone: 'err' },
{ id: 'n2', icon: 'check_circle', title: '대회 BDR 서머 오픈 #4 공개 처리됨', at: '1시간 전', tone: 'ok' },
{ id: 'n3', icon: 'handshake', title: '마포 아레나 파트너 신청', at: '오늘 14:22', tone: 'warn' },
{ id: 'n4', icon: 'lightbulb', title: '건의 — 코트 즐겨찾기 + 알림 제안', at: '어제 22:18', tone: 'info' },
{ id: 'n5', icon: 'domain', title: '단체 등록 — Paint Referees Co.', at: '5/10', tone: 'mute' }];


const ADMIN_ME_SUGGESTIONS = [
{ id: 's1', title: '경기 결과 자동 입력 — 스코어 시트 연동', tier: 'VVIP', upvote: 142, at: '5/14' },
{ id: 's2', title: '코트 즐겨찾기 + 알림', tier: 'VIP', upvote: 98, at: '5/13' },
{ id: 's3', title: '심판 매칭 — 후기 별점', tier: 'A', upvote: 67, at: '5/12' }];


const ADMIN_ME_PERMISSIONS = [
{ key: 'super_admin', label: 'Super Admin', desc: '전체 시스템 권한', held: true, icon: 'verified' },
{ key: 'site_admin', label: 'Site Admin', desc: '콘텐츠·사용자 관리', held: true, icon: 'verified' },
{ key: 'tournament_admin', label: 'Tournament Admin', desc: '대회 운영 권한', held: true, icon: 'emoji_events' },
{ key: 'tournament_assistant', label: 'TAM (보조 admin)', desc: '특정 대회 보조 관리', held: false, icon: 'manage_accounts' },
{ key: 'recorder', label: '기록원', desc: '경기 기록 입력', held: false, icon: 'edit_note' },
{ key: 'partner_member', label: 'Partner Member', desc: '협력업체 광고 관리', held: false, icon: 'storefront' },
{ key: 'org_owner', label: 'Organization Owner', desc: '단체 소유자', held: false, icon: 'domain' }];


const ADMIN_ME_TOURNAMENTS = {
  live: [
  { id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4', teams: '38/44', date: '2026-06-15' },
  { id: 'tn_2026_challenge_8', name: 'BDR 챌린지 #8', teams: '24/32', date: '2026-06-22' }],

  apply: [
  { id: 'tn_2026_rookie_4', name: '루키 컵 #4', teams: '12/16', date: '2026-07-10' },
  { id: 'tn_2026_winter_3', name: '윈터 인비테이셔널 #3', teams: '6/16', date: '2026-12-20' }],

  done: [
  { id: 'tn_2026_rookie_3', name: '루키 컵 #3', teams: '16/16', date: '2026-04-22' },
  { id: 'tn_2026_spring_2', name: '스프링 오픈 #2', teams: '32/32', date: '2026-03-30' }]

};

const ADMIN_ME_RECENT = [
{ id: 'r1', icon: 'emoji_events', action: 'BDR 서머 오픈 #4 생성', at: '오늘 11:28', route: 'adminTournaments' },
{ id: 'r2', icon: 'block', action: 'thunderdunk 계정 정지', at: '어제 10:44', route: 'adminUsers' },
{ id: 'r3', icon: 'group', action: 'u_lee_park 권한 변경', at: '어제 09:22', route: 'adminUsers' },
{ id: 'r4', icon: 'check_circle', action: '신고 r_20260507_1118 처리 완료', at: '5/13 16:42', route: 'adminGameReports' },
{ id: 'r5', icon: 'handshake', action: '마포 아레나 파트너 승인', at: '5/14 18:30', route: 'adminPartners' },
{ id: 'r6', icon: 'public', action: '대회 공개 전환', at: '5/14 11:28', route: 'adminTournaments' },
{ id: 'r7', icon: 'domain', action: 'Paint Referees 단체 거절', at: '5/14 09:14', route: 'adminOrganizations' },
{ id: 'r8', icon: 'edit', action: '신고 규정 업데이트', at: '5/13 18:22', route: 'adminSettings' }];


const ADMIN_ME_SESSIONS = [
{ id: 's1', device: 'Chrome · macOS', location: '서울', ip: '203.245.x.x', last_at: '활성', current: true },
{ id: 's2', device: 'Safari · iOS', location: '서울', ip: '112.158.x.x', last_at: '2시간 전', current: false },
{ id: 's3', device: 'Chrome · macOS', location: '서울', ip: '203.245.x.x', last_at: '어제', current: false }];


function AdminMe({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [mockState, setMockState] = React.useState('filled');
  const me = ADMIN_ME_PROFILE;

  const totalActionsWeek = 142;
  const verificationLabel = me.verification_status === 'portone' ? '본인인증 완료 (PortOne)' :
  me.verification_status === 'mock' ? 'Mock 인증 (개발용)' : '미인증';
  const verificationTone = me.verification_status === 'portone' ? 'ok' :
  me.verification_status === 'mock' ? 'warn' : 'err';

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
        <div className="admin-user__avatar">{me.avatar_initials}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{me.name}</span>
          <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell
      route="adminMe"
      setRoute={setRoute}
      eyebrow="ADMIN · 계정"
      title="내 정보"
      subtitle="내 운영자 계정 정보 · 알림 · 권한 · 관리 토너먼트 · 활동 로그를 확인합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '계정' },
      { label: '내 정보' }]
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 12 }}>
        {/* 카드 1 · 로그인 정보 (좌 4, 비번/2FA/세션 흡수) */}
        <section style={{ ...cardStyle, gridColumn: 'span 4' }}>
          <CardHeader num="1" label="로그인 정보" icon="account_circle" />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 50, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-display)', fontSize: 18, fontWeight: 700 }}>
              {me.avatar_initials}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{me.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{me.email}</div>
            </div>
          </div>

          <dl style={dlStyle}>
            <dt style={dtStyle}>UID</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)', fontSize: 11.5 }}>{me.admin_id}</dd>
            <dt style={dtStyle}>가입일</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{me.joined_at}</dd>
            <dt style={dtStyle}>최근 로그인</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{me.last_login_at}</dd>
            <dt style={dtStyle}>IP</dt>
            <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>{me.last_login_ip}</dd>
            <dt style={dtStyle}>2FA</dt>
            <dd style={{ ...ddStyle }}>
              {me.two_factor_enabled ?
              <span className="admin-stat-pill" data-tone="ok">
                  <span className="material-symbols-outlined" style={{ fontSize: 11 }}>verified_user</span>
                  활성
                </span> :

              <span className="admin-stat-pill" data-tone="err">미설정</span>
              }
            </dd>
          </dl>

          {/* 활성 세션 */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <div style={subLabelStyle}>활성 세션 ({ADMIN_ME_SESSIONS.length})</div>
              <button type="button" style={{ fontSize: 11, color: 'var(--err)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>모두 종료</button>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ADMIN_ME_SESSIONS.map((s) =>
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--bg-alt)', borderRadius: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>
                    {s.device.includes('iOS') ? 'phone_iphone' : 'computer'}
                  </span>
                  <span style={{ flex: 1, fontSize: 11.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.device}</span>
                  {s.current && <span className="admin-stat-pill" data-tone="ok" style={{ fontSize: 9.5 }}>현재</span>}
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-mute)' }}>{s.last_at}</span>
                </li>
              )}
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 12 }}>
            <button type="button" className="btn btn--sm" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>password</span>
              비밀번호 변경
            </button>
            <button type="button" className="btn btn--sm" style={{ justifyContent: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>shield</span>
              2FA 재설정
            </button>
            <button type="button" className="btn btn--sm" style={{ justifyContent: 'flex-start', color: 'var(--err)' }} onClick={() => setRoute('home')}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>logout</span>
              로그아웃
            </button>
          </div>
        </section>

        {/* 카드 2 · 본인인증 (중 4) */}
        <section style={{ ...cardStyle, gridColumn: 'span 4' }}>
          <CardHeader num="2" label="본인인증 상태" icon="badge" />
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <div style={{
              width: 64, height: 64, borderRadius: 50,
              background: verificationTone === 'ok' ? 'var(--ok)' : verificationTone === 'warn' ? 'var(--bg-alt)' : 'var(--bg-alt)',
              color: verificationTone === 'ok' ? '#fff' : 'var(--ink-mute)',
              display: 'grid', placeItems: 'center', margin: '0 auto'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
                {verificationTone === 'ok' ? 'verified_user' : verificationTone === 'warn' ? 'help' : 'priority_high'}
              </span>
            </div>
            <div style={{ marginTop: 12, fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{verificationLabel}</div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-mute)' }}>
              {verificationTone === 'ok' ? '본인 명의 휴대폰으로 인증되었습니다.' :
              verificationTone === 'warn' ? '개발 모드 인증입니다. 운영 전 portone 인증 필요.' :
              '본인인증이 필요합니다.'}
            </div>
          </div>
          {me.verification_status !== 'portone' &&
          <button type="button" className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>verified</span>
              본인 인증하기
            </button>
          }
          {me.verification_status === 'portone' &&
          <dl style={{ ...dlStyle, marginTop: 12 }}>
              <dt style={dtStyle}>인증 채널</dt>
              <dd style={ddStyle}>PortOne · KCB</dd>
              <dt style={dtStyle}>인증일</dt>
              <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>2024-01-15</dd>
              <dt style={dtStyle}>유효기간</dt>
              <dd style={{ ...ddStyle, fontFamily: 'var(--ff-mono)' }}>2027-01-15</dd>
            </dl>
          }
        </section>

        {/* 카드 3 · 알림 (우 4) */}
        <section style={{ ...cardStyle, gridColumn: 'span 4' }}>
          <CardHeader num="3" label="미확인 알림" icon="notifications" badge={ADMIN_ME_NOTIFICATIONS.length} />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ADMIN_ME_NOTIFICATIONS.map((n, i) =>
            <li key={n.id} style={{ padding: '10px 0', borderBottom: i < ADMIN_ME_NOTIFICATIONS.length - 1 ? '1px solid var(--border)' : 0, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 24, height: 24, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: n.tone === 'err' ? 'var(--err)' : n.tone === 'ok' ? 'var(--ok)' : n.tone === 'warn' ? 'var(--accent)' : 'var(--ink-soft)' }}>{n.icon}</span>
                </div>
                <span style={{ flex: 1, fontSize: 12.5, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{n.at}</span>
              </li>
            )}
          </ul>
          <button type="button" className="btn btn--sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setRoute('notifications')}>
            모두 보기
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        </section>

        {/* 카드 4 · 건의사항 본인 배정 미처리 (좌 6) */}
        <section style={{ ...cardStyle, gridColumn: 'span 6' }}>
          <CardHeader num="4" label="배정된 건의사항" icon="lightbulb" badge={ADMIN_ME_SUGGESTIONS.length} />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {ADMIN_ME_SUGGESTIONS.map((s) =>
            <li key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--bg-alt)', borderRadius: 4 }}>
                <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-card)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>{s.tier}</span>
                </div>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ok)' }}>👍 {s.upvote}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{s.at}</span>
              </li>
            )}
          </ul>
          <button type="button" className="btn btn--sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={() => setRoute('adminSuggestions')}>
            전체 건의사항 보기
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </button>
        </section>

        {/* 카드 5 · 권한 매트릭스 (우 6) */}
        <section style={{ ...cardStyle, gridColumn: 'span 6' }}>
          <CardHeader num="5" label="권한 매트릭스" icon="vpn_key" />
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {ADMIN_ME_PERMISSIONS.map((p) =>
            <li key={p.key} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px',
              background: p.held ? 'var(--bg-alt)' : 'transparent',
              border: `1px solid ${p.held ? 'var(--ok)' : 'var(--border)'}`,
              borderRadius: 4,
              opacity: p.held ? 1 : 0.55
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: p.held ? 'var(--ok)' : 'var(--ink-mute)' }}>
                  {p.held ? 'check_circle' : 'radio_button_unchecked'}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{p.label}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 1 }}>{p.desc}</div>
                </div>
              </li>
            )}
          </ul>
        </section>

        {/* 카드 6 · 관리 토너먼트 목록 (전체 12) */}
        <section style={{ ...cardStyle, gridColumn: 'span 12' }}>
          <CardHeader num="6" label="관리 토너먼트" icon="emoji_events" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
            <TournamentSection label="진행중" tone="ok" tournaments={ADMIN_ME_TOURNAMENTS.live} setRoute={() => setRoute('adminTournaments')} />
            <TournamentSection label="신청중" tone="warn" tournaments={ADMIN_ME_TOURNAMENTS.apply} setRoute={() => setRoute('adminTournaments')} />
            <TournamentSection label="완료" tone="mute" tournaments={ADMIN_ME_TOURNAMENTS.done} setRoute={() => setRoute('adminTournaments')} />
          </div>
        </section>

        {/* 카드 7 · 최근 admin 활동 (전체 12, 활동 통계 흡수) */}
        <section style={{ ...cardStyle, gridColumn: 'span 12' }}>
          <CardHeader num="7" label="최근 admin 활동" icon="history" />
          {/* 활동 통계 흡수 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 14 }}>
            <StatTile label="오늘 액션" value="24" icon="today" />
            <StatTile label="7일 액션" value={totalActionsWeek} icon="date_range" accent />
            <StatTile label="승인" value="41" icon="check_circle" />
            <StatTile label="신고 처리" value="18" icon="gavel" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <div style={subLabelStyle}>최근 10건</div>
            <button type="button" onClick={() => setRoute('adminLogs')} style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 로그 →</button>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
            {ADMIN_ME_RECENT.map((r, i) =>
            <li
              key={r.id}
              onClick={() => setRoute(r.route)}
              style={{
                padding: '10px 0',
                borderBottom: i < ADMIN_ME_RECENT.length - 1 ? '1px solid var(--border)' : 0,
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer'
              }}>

                <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{r.icon}</span>
                </div>
                <span style={{ flex: 1, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.action}</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{r.at}</span>
              </li>
            )}
          </ul>
        </section>
      </div>
    </AdminShell>);

}

// ─────── 헬퍼 ───────
const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const dlStyle = { display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: 6, columnGap: 12, margin: 0, fontSize: 12.5 };
const dtStyle = { color: 'var(--ink-mute)' };
const ddStyle = { margin: 0, color: 'var(--ink)' };
const subLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' };

function CardHeader({ num, label, icon, badge }) {
  return (
    <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 22, height: 22, borderRadius: 50, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, fontFamily: 'var(--ff-mono)', flexShrink: 0 }}>{num}</span>
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</span>
      {badge != null &&
      <span style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>{badge}</span>
      }
    </header>);

}

function TournamentSection({ label, tone, tournaments, setRoute }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span className="admin-stat-pill" data-tone={tone}>{label}</span>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{tournaments.length}건</span>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tournaments.map((t) =>
        <li key={t.id} onClick={setRoute} style={{ padding: 10, background: 'var(--bg-alt)', borderRadius: 4, cursor: 'pointer' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>
              <span>{t.teams}</span>
              <span>{t.date}</span>
            </div>
          </li>
        )}
      </ul>
    </div>);

}

function StatTile({ label, value, icon, accent }) {
  return (
    <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 10.5, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--ink-mute)' }}>{icon}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--ff-display)', color: accent ? 'var(--accent)' : 'var(--ink)', marginTop: 4 }}>{value}</div>
    </div>);

}

window.AdminMe = AdminMe;
