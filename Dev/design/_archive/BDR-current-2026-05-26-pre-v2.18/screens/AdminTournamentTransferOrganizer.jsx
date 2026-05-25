/* global React, AdminShell */

// =====================================================================
// AdminTournamentTransferOrganizer.jsx — Admin-B · 운영자 이전 (v2.13 신규)
//   진입: setRoute('adminTournamentTransferOrganizer')  (AdminTournamentDetail 위험 액션 카드)
//   복귀: setRoute('adminTournamentDetail')
//   에러: state='error' → 검색 실패 / 이전 실패
//
// 운영 source: src/app/(admin)/admin/tournaments/[id]/transfer-organizer/page.tsx
// 패턴: 페이지 + 좌 폼 / 우 위험 안내 카드. 4 상태군: empty / filled / error / loading
// 차별화: user_id autocomplete 검색 + 이전 사유 textarea + 더블 confirm
// =====================================================================

const TTO_TOURNAMENT = {
  tournament_id: 'tn_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  current_organizer_id: 'u_2025_ohyeongjin',
  current_organizer_name: '오영진',
  current_organizer_email: 'oyj@example.com',
  current_organizer_avatar: 'OY'
};

const TTO_SEARCH_RESULTS = [
{ user_id: 'u_2025_hanjiseok', nickname: '한지석', email: 'hjs@example.com', tier: 'VIP', has_admin: true, last_seen: '오늘 09:18', avatar: 'HJ' },
{ user_id: 'u_2025_kang_dohyun', nickname: '강도현', email: 'kdh@example.com', tier: 'A', has_admin: false, last_seen: '어제 22:14', avatar: 'KD' },
{ user_id: 'u_2025_parkhanul', nickname: '박하늘', email: 'phn@example.com', tier: 'B', has_admin: false, last_seen: '3시간 전', avatar: 'PH' }];


function AdminTournamentTransferOrganizer({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [search, setSearch] = React.useState('');
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [confirmText, setConfirmText] = React.useState('');
  const [step, setStep] = React.useState('select'); // select / confirm

  const t = TTO_TOURNAMENT;

  const searchResults = React.useMemo(() => {
    if (mockState === 'empty') return [];
    if (!search) return TTO_SEARCH_RESULTS;
    const q = search.toLowerCase();
    return TTO_SEARCH_RESULTS.filter((u) => u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.user_id.toLowerCase().includes(q));
  }, [search, mockState]);

  const canProceed = selectedUser && reason.trim().length >= 10;
  const canSubmit = canProceed && confirmText === t.name;

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty (검색 결과 0)</option>
          <option value="loading">C · loading (이전 처리)</option>
          <option value="error">B · error (이전 실패)</option>
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


  return (
    <AdminShell
      route="adminTournamentTransferOrganizer"
      setRoute={setRoute}
      eyebrow={`ADMIN · 대회 관리 > ${t.name} > 운영자 이전`}
      title="운영자 이전"
      subtitle="대회의 운영 권한을 다른 사용자에게 영구 이전합니다. 되돌릴 수 없습니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 관리', onClick: () => setRoute('adminTournaments') },
      { label: t.name, onClick: () => setRoute('adminTournamentDetail') },
      { label: '운영자 이전' }]
      }
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminTournamentDetail')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          취소하고 돌아가기
        </button>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* ─────── 좌 · 폼 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 현재 운영자 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>현재 운영자</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, background: 'var(--bg-alt)', borderRadius: 4 }}>
              <div style={{ width: 40, height: 40, borderRadius: 50, background: 'var(--bg-card)', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-display)', fontSize: 14, fontWeight: 700 }}>
                {t.current_organizer_avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{t.current_organizer_name}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{t.current_organizer_email}</div>
              </div>
              <span className="admin-stat-pill" data-tone="mute">읽기 전용</span>
            </div>
          </section>

          {/* 새 운영자 검색 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>새 운영자 선택</div>
            <input
              type="text"
              placeholder="닉네임 · 이메일 · UID 로 검색…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedUser(null); }}
              style={{ ...inputStyle, marginBottom: 8 }} />


            {/* 검색 결과 리스트 */}
            {searchResults.length === 0 ?
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13, background: 'var(--bg-alt)', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--ink-dim)' }}>person_search</span>
                <div style={{ marginTop: 6 }}>일치하는 사용자가 없어요</div>
              </div> :

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {searchResults.map((u) =>
              <li key={u.user_id}>
                    <button
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  style={{
                    width: '100%',
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: 10,
                    background: selectedUser?.user_id === u.user_id ? 'var(--bg-alt)' : 'transparent',
                    border: `1px solid ${selectedUser?.user_id === u.user_id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 4, cursor: 'pointer', textAlign: 'left'
                  }}>

                      <div style={{ width: 32, height: 32, borderRadius: 50, background: 'var(--bg-alt)', color: 'var(--ink-soft)', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>{u.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{u.nickname}</span>
                          <span className="admin-stat-pill" data-tone="mute" style={{ fontSize: 10 }}>{u.tier}</span>
                          {u.has_admin &&
                      <span className="admin-stat-pill" data-tone="ok" style={{ fontSize: 10 }}>
                              <span className="material-symbols-outlined" style={{ fontSize: 10 }}>verified_user</span>
                              admin 경험
                            </span>
                      }
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>{u.email}</div>
                      </div>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-dim)' }}>{u.last_seen}</span>
                      {selectedUser?.user_id === u.user_id &&
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--accent)' }}>check_circle</span>
                  }
                    </button>
                  </li>
              )}
              </ul>
            }
          </section>

          {/* 이전 사유 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>이전 사유 <span style={{ color: 'var(--err)' }}>*</span> <span style={{ color: 'var(--ink-mute)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(최소 10자)</span></div>
            <textarea
              rows={4}
              placeholder="예: 운영자 본인 사정으로 대회 운영을 인계합니다."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

            <div style={{ marginTop: 4, fontSize: 11, color: reason.length >= 10 ? 'var(--ok)' : 'var(--ink-mute)', fontFamily: 'var(--ff-mono)', textAlign: 'right' }}>
              {reason.length} / 500
            </div>
          </section>

          {/* 확인 텍스트 + 제출 */}
          {step === 'confirm' &&
          <section style={{ ...cardStyle, border: '1px solid var(--err)', borderLeft: '3px solid var(--err)' }}>
              <div style={{ ...sectionLabelStyle, color: 'var(--err)' }}>최종 확인</div>
              <p style={{ margin: '0 0 10px 0', fontSize: 13, lineHeight: 1.6, color: 'var(--ink)' }}>
                이전을 완료하려면 대회 이름을 정확히 입력해주세요:
                <code style={{ display: 'block', marginTop: 6, padding: '6px 10px', background: 'var(--bg-alt)', borderRadius: 4, fontFamily: 'var(--ff-mono)', fontSize: 13, color: 'var(--err)' }}>
                  {t.name}
                </code>
              </p>
              <input
              type="text"
              placeholder="대회 이름을 정확히 입력하세요"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              style={{ ...inputStyle, borderColor: confirmText === t.name ? 'var(--ok)' : 'var(--err)' }} />

            </section>
          }

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            {step === 'select' ?
            <>
                <button type="button" className="btn" onClick={() => setRoute('adminTournamentDetail')}>취소</button>
                <button type="button" className="btn btn--primary" disabled={!canProceed} onClick={() => setStep('confirm')} style={{ opacity: canProceed ? 1 : 0.5 }}>
                  계속
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </button>
              </> :

            <>
                <button type="button" className="btn" onClick={() => setStep('select')}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
                  이전
                </button>
                <button type="button" className="btn btn--primary" disabled={!canSubmit} style={{ background: canSubmit ? 'var(--err)' : 'var(--ink-dim)', borderColor: canSubmit ? 'var(--err)' : 'var(--ink-dim)', color: '#fff', opacity: canSubmit ? 1 : 0.5 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>swap_horiz</span>
                  운영자 이전 실행
                </button>
              </>
            }
          </div>
        </div>

        {/* ─────── 우 · 위험 안내 ─────── */}
        <aside style={{ position: 'sticky', top: 80 }}>
          <section style={{ ...cardStyle, border: '1px solid var(--err)', borderLeft: '3px solid var(--err)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--err)' }}>warning</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--err)' }}>되돌릴 수 없는 액션</span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.7 }}>
              <li>이전 후 <strong>{t.current_organizer_name}</strong> 은 더 이상 이 대회를 관리할 수 없습니다.</li>
              <li>새 운영자에게 모든 권한 (참가팀 / 매치 / 종별 / 공개 / 보관) 이 즉시 이양됩니다.</li>
              <li>이전 기록은 감사 로그에 영구 보존됩니다.</li>
              <li>되돌리려면 새 운영자가 직접 다시 이전 액션을 수행해야 합니다.</li>
              <li>대회가 <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}>live</code> / <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11 }}>done</code> 상태일 경우 super_admin 만 가능.</li>
            </ul>
          </section>

          <section style={{ ...cardStyle, marginTop: 12 }}>
            <div style={sectionLabelStyle}>현재 단계</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              <StepRow num="1" label="새 운영자 선택" done={!!selectedUser} active={step === 'select' && !selectedUser} />
              <StepRow num="2" label={`이전 사유 입력 (${reason.length}/10+)`} done={reason.length >= 10} active={step === 'select' && !!selectedUser && reason.length < 10} />
              <StepRow num="3" label="대회 이름 확인" done={confirmText === t.name} active={step === 'confirm' && confirmText !== t.name} />
              <StepRow num="4" label="이전 실행" done={false} active={canSubmit} />
            </ol>
          </section>
        </aside>
      </div>
    </AdminShell>);

}

function StepRow({ num, label, done, active }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 8, color: done ? 'var(--ink)' : active ? 'var(--accent)' : 'var(--ink-mute)' }}>
      <span style={{
        width: 20, height: 20, borderRadius: 50,
        background: done ? 'var(--ok)' : active ? 'var(--accent)' : 'var(--bg-alt)',
        color: done || active ? '#fff' : 'var(--ink-mute)',
        display: 'grid', placeItems: 'center',
        fontSize: 11, fontWeight: 700, fontFamily: 'var(--ff-mono)',
        flexShrink: 0
      }}>
        {done ? <span className="material-symbols-outlined" style={{ fontSize: 13 }}>check</span> : num}
      </span>
      {label}
    </li>);

}

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const sectionLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13.5, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

window.AdminTournamentTransferOrganizer = AdminTournamentTransferOrganizer;
