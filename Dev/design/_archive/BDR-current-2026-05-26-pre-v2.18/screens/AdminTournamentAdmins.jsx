/* global React, AdminShell, AdminEmptyState */

// =====================================================================
// AdminTournamentAdmins.jsx — Admin-E · 대회 관리자 관리 (v2.15 신규)
//   진입: setRoute('adminTournamentAdmins')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 관리자 카드 grid (3열) + 우 inline 초대 폼 + 역할 dropdown
//   역할: owner(주최) / co_admin(공동) / leader(리더)
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/admins/page.tsx
// =====================================================================

const TADM_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TADM_ROLES = {
  owner: { label: '주최자', tone: 'accent', icon: 'workspace_premium', desc: '대회 전체 권한 · 양도/삭제 가능' },
  co_admin: { label: '공동 관리자', tone: 'info', icon: 'admin_panel_settings', desc: '설정·팀·기록 수정 가능' },
  leader: { label: '리더', tone: 'mute', icon: 'group', desc: '기록·경기 운영 제한 권한' }
};

const TADM_DATA = [
{ admin_id: 'a_001', user_id: 'u_001', name: '오영진', email: 'oh@mybdr.kr', phone: '010-2345-6789', role: 'owner', added_at: '2026-04-12', last_active: '오늘 14:22', avatar_init: 'OY' },
{ admin_id: 'a_002', user_id: 'u_002', name: '김도훈', email: 'kim@mybdr.kr', phone: '010-1234-5678', role: 'co_admin', added_at: '2026-04-20', last_active: '어제 18:00', avatar_init: 'KD' },
{ admin_id: 'a_003', user_id: 'u_003', name: '이지원', email: 'lee@mybdr.kr', phone: '010-3456-7890', role: 'leader', added_at: '2026-05-02', last_active: '3일 전', avatar_init: 'LJ' }];


function AdminTournamentAdmins({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [inviteRoleKey, setInviteRoleKey] = React.useState('co_admin');
  const [toast, setToast] = React.useState(null);

  const rows = mockState === 'empty' ? [] : TADM_DATA;

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleInvite = () => {
    if (!inviteEmail.includes('@')) return;
    showToast(`${inviteEmail} 에게 초대를 보냈습니다 (mock)`);
    setInviteEmail('');
    setInviteOpen(false);
  };

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled (3명)</option>
          <option value="empty">D · empty (본인만)</option>
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


  return (
    <AdminShell route="adminTournamentAdmins" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="관리자 관리"
      subtitle={`${TADM_TOURNAMENT.name} · ${rows.length}명 (주최 1 · 공동 ${rows.filter((r) => r.role === 'co_admin').length} · 리더 ${rows.filter((r) => r.role === 'leader').length})`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TADM_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '관리자' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentTransferOrganizer')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_horiz</span>
            주최자 양도
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setInviteOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
            관리자 초대
          </button>
        </>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      }

      {/* 좌 본문 + 우 사이드 (역할 안내 + 초대 inline) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 초대 inline (열렸을 때) */}
          {inviteOpen &&
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--accent)', borderRadius: 6, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>person_add</span>
                <span style={{ fontWeight: 700, fontSize: 14 }}>관리자 초대</span>
                <button type="button" onClick={() => setInviteOpen(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-mute)', padding: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: 8 }}>
                <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="이메일 주소"
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit' }} />
                <select value={inviteRoleKey} onChange={(e) => setInviteRoleKey(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, background: 'var(--bg)', color: 'var(--ink)', fontSize: 13, fontFamily: 'inherit' }}>
                  <option value="co_admin">공동 관리자</option>
                  <option value="leader">리더</option>
                </select>
                <button type="button" className="btn btn--primary" onClick={handleInvite}>초대 보내기</button>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: 11.5, color: 'var(--ink-mute)' }}>
                초대받은 사용자는 MyBDR 계정으로 가입 후 자동으로 권한이 부여됩니다.
              </p>
            </div>
          }

          {/* 관리자 카드 grid */}
          {rows.length === 0 ?
          <AdminEmptyState icon="manage_accounts" title="아직 다른 관리자가 없어요"
            description="공동 관리자를 초대하면 설정·팀·기록 작업을 함께 진행할 수 있습니다."
            ctaLabel="관리자 초대" onCta={() => setInviteOpen(true)} /> :


          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
              {rows.map((r) => {
              const role = TADM_ROLES[r.role];
              return (
                <div key={r.admin_id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 4, background: r.role === 'owner' ? 'var(--accent)' : 'var(--bg-alt)', color: r.role === 'owner' ? '#fff' : 'var(--ink-soft)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700 }}>
                        {r.avatar_init}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.email}</div>
                      </div>
                      <button type="button" style={{ background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--ink-mute)', padding: 4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>more_vert</span>
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className="admin-stat-pill" data-tone={role.tone}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{role.icon}</span>
                        {role.label}
                      </span>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-dim)' }}>since {r.added_at.slice(5)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--ink-mute)' }}>
                      <span>마지막 활동 · {r.last_active}</span>
                      <span style={{ fontFamily: 'var(--ff-mono)' }}>{r.phone.slice(-9)}</span>
                    </div>
                  </div>);

            })}
            </div>
          }
        </div>

        {/* 우 사이드 — 역할 안내 */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 10, alignSelf: 'flex-start' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>역할 안내</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(TADM_ROLES).map(([key, role]) =>
              <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{role.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{role.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{role.desc}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>info</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-soft)' }}>운영 팁</span>
            </div>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
              주최자는 양도만 가능하며 삭제할 수 없습니다. 종별이 많거나 1주일 이상 진행되는 대회는 공동 관리자 2명 이상 권장.
            </p>
          </div>
        </aside>
      </div>
    </AdminShell>);

}

window.AdminTournamentAdmins = AdminTournamentAdmins;
