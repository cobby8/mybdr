/* global React, AdminShell */

// =====================================================================
// PartnerAdminEntry.jsx — Admin-C 비즈니스 그룹 · 협력업체 관리 entry (v2.10)
//   진입: setRoute('partnerAdminEntry')
//   복귀: setRoute('adminDashboard') · adminPartners
//   에러: 없음 (entry landing)
//
// 패턴: 다른 admin 페이지와 달리 DataTable 없는 entry/gate 패턴
//   - 좌: 협력업체용 안내 (3 step + 혜택)
//   - 우: 로그인 카드 (협력업체 계정 / 신규 신청 분기)
//   - 운영자(super_admin) 가 보면 안내 + 신청 큐 미리보기
// =====================================================================

const PARTNER_ENTRY_BENEFITS = [
{ icon: 'analytics', title: '실시간 성과', desc: '캠페인 전환·ROI 를 시간 단위로 확인합니다.' },
{ icon: 'campaign', title: '캠페인 발행', desc: '직접 광고를 등록하고 채널별로 게재합니다.' },
{ icon: 'group', title: '유저 인사이트', desc: '내 캠페인에 반응한 유저층 분포를 확인합니다.' },
{ icon: 'payments', title: '정산 자동화', desc: '월간 매출과 정산 내역을 CSV 로 받습니다.' }];


const PARTNER_PENDING_PREVIEW = [
{ partner_id: 'pt_mapo_arena', name: '마포 아레나', category_label: '코트', applied_at: '2026-05-12' },
{ partner_id: 'pt_paint_ref', name: 'Paint Referees Co.', category_label: '협회', applied_at: '2026-05-10' }];


function PartnerAdminEntry({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');

  const isPartner = adminRole === 'partner_member';

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>ROLE</span>
        <select value={adminRole} onChange={(e) => setAdminRole(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="super_admin">super_admin</option>
          <option value="partner_member">partner_member</option>
          <option value="guest">guest</option>
        </select>
      </div>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">{isPartner ? 'HG' : 'DH'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>{isPartner ? 'HoopGear' : '김도훈'}</span>
          <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell
      route="partnerAdminEntry"
      setRoute={setRoute}
      eyebrow="ADMIN · 외부 관리"
      title="협력업체 관리"
      subtitle="코트·장비·스폰서·협회 파트너가 직접 캠페인을 관리하는 외부 admin 진입점입니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '외부 관리' },
      { label: '협력업체' }]
      }
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminPartners')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>handshake</span>
          파트너 관리로
        </button>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16 }}>
        {/* ─────── 좌 · 혜택 + 안내 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 헤더 카드 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', fontFamily: 'var(--ff-mono)', marginBottom: 8 }}>
              PARTNER ADMIN
            </div>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
              BDR 협력업체 전용 관리 페이지
            </h2>
            <p style={{ margin: '10px 0 0 0', color: 'var(--ink-mute)', fontSize: 14, lineHeight: 1.6 }}>
              파트너 등록이 승인되면 본인 회사 명의의 캠페인을 직접 등록하고 성과를 추적할 수 있습니다.
              운영진이 일괄 관리하는 <a onClick={() => setRoute('adminPartners')} style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>파트너 관리</a> 와 다른, 협력업체 전용 진입점입니다.
            </p>
          </section>

          {/* 혜택 4종 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>제공 기능</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PARTNER_ENTRY_BENEFITS.map((b) =>
              <div key={b.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 4, background: 'var(--bg-alt)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>{b.icon}</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)' }}>{b.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{b.desc}</div>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* 신청 절차 3 step */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>신청 절차</div>
            <ol style={{ display: 'flex', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
              {[
              { step: '01', title: '신청서 제출', desc: '회사·담당자·카테고리 입력' },
              { step: '02', title: '운영진 심사', desc: '평균 3 영업일' },
              { step: '03', title: '관리 페이지 발급', desc: '승인 시 계정 활성' }].
              map((s) =>
              <li key={s.step} style={{ flex: 1, padding: 14, background: 'var(--bg-alt)', borderRadius: 4 }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em' }}>{s.step}</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', marginTop: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{s.desc}</div>
                </li>
              )}
            </ol>
          </section>
        </div>

        {/* ─────── 우 · 로그인 / 신규 신청 / pending preview ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* 로그인 / 신청 카드 */}
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
            {isPartner ?
            <>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>로그인 됨</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 4, background: 'var(--accent)', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontFamily: 'var(--ff-display)' }}>HG</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>HoopGear</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>pt_hoopgear · GOLD</div>
                  </div>
                </div>
                <button type="button" className="btn btn--primary" style={{ width: '100%', marginTop: 14, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>
                  내 파트너 대시보드 열기
                </button>
                <button type="button" className="btn" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>campaign</span>
                  새 캠페인 등록
                </button>
              </> :

            <>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>협력업체 로그인</div>
                <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>이메일</span>
                    <input type="email" placeholder="partner@company.com" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14, background: 'var(--bg-alt)', color: 'var(--ink)' }} />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>비밀번호</span>
                    <input type="password" placeholder="••••••••" style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 14, background: 'var(--bg-alt)', color: 'var(--ink)' }} />
                  </label>
                  <button type="button" className="btn btn--primary" style={{ width: '100%', marginTop: 6, justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>login</span>
                    파트너 계정 로그인
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontSize: 10, color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>OR</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                </div>
                <button type="button" className="btn" style={{ width: '100%', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>person_add</span>
                  신규 파트너 신청
                </button>
                <a style={{ display: 'block', textAlign: 'center', marginTop: 10, fontSize: 11.5, color: 'var(--ink-mute)', cursor: 'pointer' }} onClick={() => setRoute('passwordReset')}>
                  비밀번호 찾기
                </a>
              </>
            }
          </section>

          {/* super_admin 일 때만 — 심사 큐 미리보기 */}
          {adminRole === 'super_admin' &&
          <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>심사 대기</div>
                <span className="admin-stat-pill" data-tone="warn">{PARTNER_PENDING_PREVIEW.length}건</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PARTNER_PENDING_PREVIEW.map((p) =>
              <button
                key={p.partner_id}
                type="button"
                onClick={() => setRoute('adminPartners')}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--bg-alt)', border: 0, borderRadius: 4, cursor: 'pointer', textAlign: 'left', width: '100%' }}>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)' }}>{p.category_label} · 신청 {p.applied_at}</div>
                    </div>
                    <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>chevron_right</span>
                  </button>
              )}
              </div>
              <button type="button" className="btn" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }} onClick={() => setRoute('adminPartners')}>
                전체 심사 큐 보기
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
              </button>
            </section>
          }

          {/* 도움 박스 */}
          <section style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 14, fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--ink-mute)', marginBottom: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>info</span>
              <span style={{ fontWeight: 600 }}>안내</span>
            </div>
            협력업체 계정은 별도의 <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)' }}>partner_member</code> 권한이 부여됩니다.
            운영진 권한 (super_admin) 과는 분리되어 자사 캠페인만 관리할 수 있습니다.
          </section>
        </div>
      </div>
    </AdminShell>);

}

window.PartnerAdminEntry = PartnerAdminEntry;
