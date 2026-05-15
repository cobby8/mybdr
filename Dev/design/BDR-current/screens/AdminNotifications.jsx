/* global React, AdminShell */

// =====================================================================
// AdminNotifications.jsx — Admin-D 시스템 · 알림 발송 (v2.13 신규)
//   진입: setRoute('adminNotifications')
//   복귀: setRoute('adminDashboard')
//   에러: state='error' → 발송 실패
//
// 운영 source: src/app/(admin)/admin/notifications/page.tsx (230줄)
// 패턴: 좌 60% 발송 폼 + 우 40% 미리보기 + 발송 이력
// 차별화: 발송 대상 4 종 (전체/일반/관리자/팀장) + 위험 액션 (전체 발송 시 더블 confirm)
// 위치: ADMIN_NAV 시스템 그룹 / icon `notifications_active`
// =====================================================================

const NOTIF_TARGETS = [
{ key: 'all_users', label: '전체 유저', desc: '관리자 포함 모든 가입자', count_estimate: 18420, icon: 'group', tone: 'err' },
{ key: 'normal_users', label: '일반 유저', desc: '관리자 제외 일반 회원', count_estimate: 18402, icon: 'group', tone: 'warn' },
{ key: 'admins', label: '관리자만', desc: 'super/site/tournament_admin', count_estimate: 18, icon: 'admin_panel_settings', tone: 'info' },
{ key: 'team_captains', label: '팀장', desc: '활성 팀의 captain 권한 유저', count_estimate: 412, icon: 'flag', tone: 'info' }];


const NOTIF_HISTORY = [
{ id: 'sn_2026_0514_1830', title: 'BDR 서머 오픈 #4 접수 시작!', target: 'all_users', sent_count: 18420, sent_at: '2026-05-14 18:30', status: 'sent', status_tone: 'ok' },
{ id: 'sn_2026_0512_1100', title: '5월 운영 정책 업데이트 안내', target: 'all_users', sent_count: 18415, sent_at: '2026-05-12 11:00', status: 'sent', status_tone: 'ok' },
{ id: 'sn_2026_0510_1428', title: '심판 자격 갱신 신청 — 관리자 안내', target: 'admins', sent_count: 18, sent_at: '2026-05-10 14:28', status: 'sent', status_tone: 'ok' },
{ id: 'sn_2026_0508_2200', title: '팀장 대상 — 게스트 모집 정책 변경', target: 'team_captains', sent_count: 408, sent_at: '2026-05-08 22:00', status: 'sent', status_tone: 'ok' },
{ id: 'sn_2026_0505_1042', title: '시스템 점검 안내 (5/6 02:00 ~ 04:00)', target: 'all_users', sent_count: 18380, sent_at: '2026-05-05 10:42', status: 'sent', status_tone: 'ok' }];


function AdminNotifications({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [mockState, setMockState] = React.useState('filled');

  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [target, setTarget] = React.useState('admins');
  const [actionUrl, setActionUrl] = React.useState('');
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [sentToast, setSentToast] = React.useState(null);

  const selectedTarget = NOTIF_TARGETS.find((t) => t.key === target);
  const isDanger = target === 'all_users' || target === 'normal_users';

  const canSend = title.trim().length >= 4 && title.length <= 100 && body.length <= 500;

  const handleSendClick = () => {
    if (!canSend) return;
    if (isDanger) setConfirmOpen(true);
    else doSend();
  };

  const doSend = () => {
    setConfirmOpen(false);
    setSentToast({ count: selectedTarget.count_estimate, at: new Date().toLocaleTimeString('ko-KR') });
    setTitle('');
    setBody('');
    setActionUrl('');
    setTimeout(() => setSentToast(null), 3500);
  };

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty (이력 없음)</option>
          <option value="loading">C · loading (발송 중)</option>
          <option value="error">B · error (발송 실패)</option>
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


  const historyToShow = mockState === 'empty' ? [] : NOTIF_HISTORY;

  return (
    <AdminShell
      route="adminNotifications"
      setRoute={setRoute}
      eyebrow="ADMIN · 시스템"
      title="알림 발송"
      subtitle="시스템 알림을 대상별로 발송합니다. 일반 유저 대상 발송은 신중히 진행하세요."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '시스템' },
      { label: '알림 발송' }]
      }
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminLogs')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>list_alt</span>
          활동 로그
        </button>
      }>

      {/* 성공 toast */}
      {sentToast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{sentToast.count.toLocaleString()}명에게 알림을 발송했습니다.</div>
            <div style={{ fontSize: 11, opacity: 0.85, fontFamily: 'var(--ff-mono)', marginTop: 2 }}>발송 시각 {sentToast.at}</div>
          </div>
        </div>
      }

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* ─────── 좌 · 발송 폼 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 발송 대상 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>발송 대상 <span style={{ color: 'var(--err)' }}>*</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {NOTIF_TARGETS.map((t) =>
              <button
                key={t.key}
                type="button"
                onClick={() => setTarget(t.key)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: 12,
                  background: target === t.key ? 'var(--bg-alt)' : 'transparent',
                  border: `1px solid ${target === t.key ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 4, cursor: 'pointer', textAlign: 'left'
                }}>

                  <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: t.tone === 'err' ? 'var(--err)' : t.tone === 'warn' ? 'var(--accent)' : 'var(--ink-soft)' }}>{t.icon}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</span>
                      {t.tone === 'err' && <span className="admin-stat-pill" data-tone="err" style={{ fontSize: 9.5 }}>위험</span>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{t.desc}</div>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: target === t.key ? 'var(--accent)' : 'var(--ink-mute)', fontWeight: 700, marginTop: 4 }}>
                      ≈ {t.count_estimate.toLocaleString()}명
                    </div>
                  </div>
                  {target === t.key &&
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>check_circle</span>
                }
                </button>
              )}
            </div>
          </section>

          {/* 제목 / 내용 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>알림 내용</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>제목 <span style={{ color: 'var(--err)' }}>*</span> <span style={{ color: 'var(--ink-dim)' }}>(최소 4자, 최대 100자)</span></span>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 100))}
                  placeholder="예: BDR 서머 오픈 #4 접수 시작!"
                  style={inputStyle} />

                <span style={{ alignSelf: 'flex-end', fontSize: 11, fontFamily: 'var(--ff-mono)', color: title.length > 100 ? 'var(--err)' : title.length >= 4 ? 'var(--ok)' : 'var(--ink-mute)' }}>{title.length} / 100</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>본문 <span style={{ color: 'var(--ink-dim)' }}>(선택, 최대 500자)</span></span>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value.slice(0, 500))}
                  placeholder="예: 7월 1일 접수 시작. 종별 4종, 총 상금 1,200만원. 자세한 내용은 BDR NEWS 에서 확인하세요."
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

                <span style={{ alignSelf: 'flex-end', fontSize: 11, fontFamily: 'var(--ff-mono)', color: body.length > 500 ? 'var(--err)' : 'var(--ink-mute)' }}>{body.length} / 500</span>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>액션 URL <span style={{ color: 'var(--ink-dim)' }}>(선택)</span></span>
                <input
                  type="text"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  placeholder="예: /tournaments/tn_2026_summer_4"
                  style={{ ...inputStyle, fontFamily: 'var(--ff-mono)', fontSize: 12.5 }} />

                <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>알림 클릭 시 이동할 경로. 비워두면 알림 센터만 열림.</span>
              </label>
            </div>
          </section>

          {/* 액션 버튼 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn" onClick={() => { setTitle(''); setBody(''); setActionUrl(''); }}>
              초기화
            </button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canSend}
              onClick={handleSendClick}
              style={{
                background: !canSend ? 'var(--ink-dim)' : isDanger ? 'var(--err)' : 'var(--accent)',
                borderColor: !canSend ? 'var(--ink-dim)' : isDanger ? 'var(--err)' : 'var(--accent)',
                color: '#fff',
                opacity: canSend ? 1 : 0.5
              }}>

              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
              {isDanger ? '발송 (위험)' : '발송하기'}
            </button>
          </div>
        </div>

        {/* ─────── 우 · 미리보기 + 이력 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>
          {/* 발송 미리보기 */}
          <section style={cardStyle}>
            <div style={sectionLabelStyle}>발송 미리보기</div>
            <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 50, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sports_basketball</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>MyBDR</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>지금</div>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)', lineHeight: 1.4, marginBottom: 4 }}>
                {title || <span style={{ color: 'var(--ink-dim)' }}>(제목이 여기에 표시됩니다)</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.5 }}>
                {body || <span style={{ color: 'var(--ink-dim)' }}>(본문이 여기에 표시됩니다)</span>}
              </div>
              {actionUrl &&
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                  <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--accent)' }}>{actionUrl}</code>
                </div>
              }
            </div>
            <div style={{ marginTop: 10, padding: 10, background: 'var(--bg-alt)', borderRadius: 4, fontSize: 11.5, color: 'var(--ink-soft)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-mute)' }}>대상</span>
                <span style={{ fontWeight: 600 }}>{selectedTarget.label}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--ink-mute)' }}>예상 수신자</span>
                <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 700, color: isDanger ? 'var(--err)' : 'var(--accent)' }}>
                  ≈ {selectedTarget.count_estimate.toLocaleString()}명
                </span>
              </div>
            </div>
          </section>

          {/* 발송 이력 */}
          <section style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
              <div style={sectionLabelStyle}>최근 발송 (5건)</div>
              {historyToShow.length > 0 &&
              <button type="button" style={{ fontSize: 11, color: 'var(--accent)', background: 'transparent', border: 0, cursor: 'pointer', fontFamily: 'inherit' }}>전체 →</button>
              }
            </div>
            {historyToShow.length === 0 ?
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--ink-mute)', fontSize: 12.5, background: 'var(--bg-alt)', borderRadius: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--ink-dim)' }}>inbox</span>
                <div style={{ marginTop: 6 }}>발송 이력이 없어요</div>
              </div> :

            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 0 }}>
                {historyToShow.map((h, i) =>
              <li key={h.id} style={{ padding: '10px 0', borderBottom: i < historyToShow.length - 1 ? '1px solid var(--border)' : 0 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 11, color: 'var(--ink-mute)' }}>
                      <span>
                        {NOTIF_TARGETS.find((t) => t.key === h.target)?.label}
                        <span style={{ fontFamily: 'var(--ff-mono)', marginLeft: 4, color: 'var(--ink-soft)' }}>· {h.sent_count.toLocaleString()}명</span>
                      </span>
                      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5 }}>{h.sent_at.replace(' ', ' · ')}</span>
                    </div>
                  </li>
              )}
              </ul>
            }
          </section>
        </div>
      </div>

      {/* 위험 확인 모달 */}
      {confirmOpen &&
      <div style={{ position: 'fixed', inset: 0, background: 'var(--overlay)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--err)', borderLeft: '4px solid var(--err)', borderRadius: 6, padding: 24, width: 'min(90vw, 480px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--err)' }}>warning</span>
              <h2 style={{ margin: 0, fontSize: 16, color: 'var(--err)' }}>위험 — 대량 발송 확인</h2>
            </div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>
              <strong>{selectedTarget.label}</strong> 대상으로 알림을 발송합니다.
              <br />
              예상 수신자: <strong style={{ color: 'var(--err)', fontFamily: 'var(--ff-mono)' }}>≈ {selectedTarget.count_estimate.toLocaleString()}명</strong>.
              <br /><br />
              발송 후에는 취소할 수 없습니다. 정말 발송하시겠습니까?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
              <button type="button" className="btn" onClick={() => setConfirmOpen(false)}>취소</button>
              <button type="button" className="btn btn--primary" onClick={doSend} style={{ background: 'var(--err)', borderColor: 'var(--err)', color: '#fff' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>send</span>
                발송 확정
              </button>
            </div>
          </div>
        </div>
      }
    </AdminShell>);

}

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const sectionLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, fontWeight: 600 };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13.5, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

window.AdminNotifications = AdminNotifications;
