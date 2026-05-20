/* global React, AdminShell, AdminEmptyState */

// =====================================================================
// AdminTournamentRecorders.jsx — Admin-E · 기록원 관리 (v2.15 신규)
//   진입: setRoute('adminTournamentRecorders')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 2열 — 좌 기록원 list (활동 현황 + 평가) / 우 미배정 경기 + drag-assign mock
//   상태: active(활성) / on_duty(배정중) / inactive(휴면)
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx
// =====================================================================

const TREC_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TREC_DATA = [
{ recorder_id: 'r_001', name: '박기록', avatar_init: 'PR', email: 'park@bdr.kr', phone: '010-1111-2222',
  certified: true, rating: 4.8, total_games: 142, assigned_games: 4, completed_games: 1,
  status: 'on_duty', last_active: '오늘 13:00' },
{ recorder_id: 'r_002', name: '정현우', avatar_init: 'JH', email: 'jung@bdr.kr', phone: '010-2222-3333',
  certified: true, rating: 4.6, total_games: 88, assigned_games: 3, completed_games: 2,
  status: 'on_duty', last_active: '어제 21:00' },
{ recorder_id: 'r_003', name: '한주영', avatar_init: 'HJ', email: 'han@bdr.kr', phone: '010-3333-4444',
  certified: false, rating: 4.2, total_games: 24, assigned_games: 0, completed_games: 0,
  status: 'active', last_active: '5/12' },
{ recorder_id: 'r_004', name: '서민기', avatar_init: 'SM', email: 'seo@bdr.kr', phone: '010-4444-5555',
  certified: true, rating: 4.9, total_games: 210, assigned_games: 2, completed_games: 0,
  status: 'on_duty', last_active: '오늘 09:30' }];


const TREC_UNASSIGNED = [
{ game_id: 'g_2026_summer_4_b3', label: 'B조 3경기', when: '6/15 14:00', court: '잠실 1번 코트', teams: '강남 윙스 vs 서초 라이저' },
{ game_id: 'g_2026_summer_4_b4', label: 'B조 4경기', when: '6/15 15:30', court: '잠실 2번 코트', teams: '한양 메디컬 vs 용산 베어스' },
{ game_id: 'g_2026_summer_4_qa1', label: '준결 A', when: '6/21 14:00', court: '잠실 1번 코트', teams: 'TBD vs TBD' }];


const TREC_STATUS = {
  on_duty: { label: '배정중', tone: 'accent', icon: 'assignment_ind' },
  active: { label: '활성', tone: 'ok', icon: 'check_circle' },
  inactive: { label: '휴면', tone: 'mute', icon: 'do_not_disturb' }
};

function AdminTournamentRecorders({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [selectedRecorder, setSelectedRecorder] = React.useState('r_001');
  const [toast, setToast] = React.useState(null);

  const rows = mockState === 'empty' ? [] : TREC_DATA;
  const unassigned = mockState === 'empty' ? [] : TREC_UNASSIGNED;
  const selected = rows.find((r) => r.recorder_id === selectedRecorder);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleAssign = (game) => {
    if (!selected) {
      showToast('먼저 기록원을 선택하세요');
      return;
    }
    showToast(`${selected.name}님께 [${game.label}] 배정 (mock)`);
  };

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty</option>
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


  const totalAssigned = rows.reduce((s, r) => s + r.assigned_games, 0);
  const totalCompleted = rows.reduce((s, r) => s + r.completed_games, 0);

  return (
    <AdminShell route="adminTournamentRecorders" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="기록원 관리"
      subtitle={`${TREC_TOURNAMENT.name} · 기록원 ${rows.length}명 · 배정 ${totalCompleted}/${totalAssigned} 완료 · 미배정 ${unassigned.length}경기`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TREC_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '기록원' }]
      }
      actions={
      <button type="button" className="btn btn--primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
          기록원 초대
        </button>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      }

      {rows.length === 0 ?
      <AdminEmptyState icon="edit_note" title="아직 기록원이 없어요"
        description="기록원을 초대하면 경기별 배정과 점수 시트 입력이 가능합니다."
        ctaLabel="기록원 초대" onCta={() => {}} /> :


      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 12 }}>
          {/* 좌 — 기록원 list */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>기록원 목록</span>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>{rows.length}명</span>
            </div>
            <div>
              {rows.map((r) => {
              const st = TREC_STATUS[r.status];
              const isSelected = r.recorder_id === selectedRecorder;
              return (
                <button
                  key={r.recorder_id}
                  type="button"
                  onClick={() => setSelectedRecorder(r.recorder_id)}
                  style={{
                    width: '100%', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: isSelected ? 'var(--bg-alt)' : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                    borderTop: 0, borderRight: 0, borderBottom: '1px solid var(--border)',
                    cursor: 'pointer', fontFamily: 'inherit'
                  }}>

                    <div style={{ width: 40, height: 40, borderRadius: 4, background: 'var(--bg)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 13, fontWeight: 700, color: 'var(--ink-soft)' }}>
                      {r.avatar_init}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{r.name}</span>
                        {r.certified &&
                      <span className="material-symbols-outlined" title="인증 기록원" style={{ fontSize: 13, color: 'var(--accent)' }}>verified</span>
                      }
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 12, color: '#f5a623' }}>star</span>
                        <span style={{ fontFamily: 'var(--ff-mono)' }}>{r.rating}</span>
                        <span>·</span>
                        <span>총 {r.total_games}경기</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <span className="admin-stat-pill" data-tone={st.tone}>
                        <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{st.icon}</span>
                        {st.label}
                      </span>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-dim)' }}>
                        {r.completed_games}/{r.assigned_games} 완료
                      </span>
                    </div>
                  </button>);

            })}
            </div>
          </div>

          {/* 우 — 선택한 기록원 상세 + 미배정 경기 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* 선택한 기록원 상세 */}
            {selected &&
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 12 }}>선택한 기록원</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 4, background: 'var(--accent)', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 14, fontWeight: 700 }}>{selected.avatar_init}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.name}</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>{selected.phone}</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, marginBottom: 10 }}>
                  <Stat label="배정" value={selected.assigned_games} unit="경기" />
                  <Stat label="완료" value={selected.completed_games} unit="경기" />
                  <Stat label="평점" value={selected.rating} unit="/5" />
                </div>
                <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>schedule</span>
                  배정 일정 보기
                </button>
              </div>
          }

            {/* 미배정 경기 */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>미배정 경기</span>
                <span className="admin-stat-pill" data-tone={unassigned.length > 0 ? 'warn' : 'ok'}>
                  {unassigned.length}건
                </span>
              </div>
              {unassigned.length === 0 ?
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 12 }}>
                  모든 경기에 기록원이 배정되었습니다.
                </div> :

            <div>
                  {unassigned.map((g) =>
              <div key={g.game_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{g.label}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>{g.when} · {g.court}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--ink-dim)' }}>{g.teams}</div>
                      </div>
                      <button type="button" className="btn btn--sm" onClick={() => handleAssign(g)}>
                        <span className="material-symbols-outlined" style={{ fontSize: 13 }}>arrow_back</span>
                        배정
                      </button>
                    </div>
              )}
                </div>
            }
            </div>
          </div>
        </div>
      }
    </AdminShell>);

}

function Stat({ label, value, unit }) {
  return (
    <div style={{ background: 'var(--bg-alt)', borderRadius: 4, padding: '8px 10px' }}>
      <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ marginTop: 2, display: 'flex', alignItems: 'baseline', gap: 2 }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{value}</span>
        <span style={{ fontSize: 10, color: 'var(--ink-mute)' }}>{unit}</span>
      </div>
    </div>);

}

window.AdminTournamentRecorders = AdminTournamentRecorders;
