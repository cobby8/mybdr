/* global React, AdminShell, AdminEmptyState */

// =====================================================================
// AdminTournamentBracket.jsx — Admin-E · 대진표 관리 (v2.15 신규)
//   진입: setRoute('adminTournamentBracket')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 종별 selector + 그룹 라운드 viewer + 결선 토너먼트 viewer
//   상태: not_generated / generated / locked / in_progress
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx
// =====================================================================

const TBR_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TBR_DIVISIONS = [
{ division_id: 'd_open', label: '오픈', teams: 16, generated: true, locked: false },
{ division_id: 'd_u18', label: 'U18', teams: 8, generated: true, locked: false },
{ division_id: 'd_u15', label: 'U15', teams: 6, generated: false, locked: false },
{ division_id: 'd_women', label: '여자부', teams: 8, generated: true, locked: true }];


const TBR_GROUPS = [
{ group: 'A', teams: ['강남 윙스', '서초 라이저', '용산 베어스', '강동 샤크'], played: 3, total: 6 },
{ group: 'B', teams: ['신촌 ULSAN', '한양 메디컬', '성동 그리즐리', '관악 펠리컨'], played: 2, total: 6 },
{ group: 'C', teams: ['마포 호크스', '잠실 토네이도', '용인 매버릭스', '수원 호빗'], played: 0, total: 6 },
{ group: 'D', teams: ['분당 캡틴', '안양 라이트닝', '인천 블레이저', '대전 호넷'], played: 0, total: 6 }];


const TBR_KNOCKOUT = [
{ round: '준결', matches: [
  { id: 'sf1', a: 'A1', b: 'B2', a_score: null, b_score: null, when: '6/21 14:00' },
  { id: 'sf2', a: 'C1', b: 'D2', a_score: null, b_score: null, when: '6/21 16:00' }] },

{ round: '결승', matches: [
  { id: 'f1', a: 'SF1 W', b: 'SF2 W', a_score: null, b_score: null, when: '6/22 16:00' }] },

{ round: '3·4위', matches: [
  { id: 't1', a: 'SF1 L', b: 'SF2 L', a_score: null, b_score: null, when: '6/22 14:00' }] }];



function AdminTournamentBracket({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [divId, setDivId] = React.useState('d_open');
  const [toast, setToast] = React.useState(null);
  const [confirmGen, setConfirmGen] = React.useState(false);

  const division = TBR_DIVISIONS.find((d) => d.division_id === divId);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  };

  const handleGenerate = () => {
    showToast(`${division.label} 대진표를 생성했습니다 (mock)`);
    setConfirmGen(false);
  };

  const dashTopbarRight =
  <button className="admin-user" type="button">
      <div className="admin-user__avatar">OY</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
        <span className="admin-user__role">tournament admin</span>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
    </button>;


  return (
    <AdminShell route="adminTournamentBracket" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="대진표 관리"
      subtitle={`${TBR_TOURNAMENT.name} · 종별 ${TBR_DIVISIONS.length}개 중 ${TBR_DIVISIONS.filter((d) => d.generated).length}개 생성 완료`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TBR_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '대진표' }]
      }
      actions={
      <>
          <button type="button" className="btn" disabled={!division.generated}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            PDF 내보내기
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setConfirmGen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
            {division.generated ? '재생성' : '대진표 생성'}
          </button>
        </>
      }>

      {toast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toast}</span>
        </div>
      }

      {/* 재생성 확인 modal */}
      {confirmGen &&
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'grid', placeItems: 'center' }}
      onClick={() => setConfirmGen(false)}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 6, padding: 24, width: '90%', maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color: 'var(--accent)' }}>warning</span>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{division.generated ? '대진표 재생성' : '대진표 생성'}</h3>
            </div>
            <p style={{ margin: '0 0 16px 0', fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              {division.label} 종별 {division.teams}팀에 대해 자동으로 대진표를 생성합니다.
              {division.generated && ' 기존 대진과 입력된 경기 결과가 모두 초기화됩니다.'}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button type="button" className="btn" onClick={() => setConfirmGen(false)}>취소</button>
              <button type="button" className="btn btn--primary" onClick={handleGenerate}>생성하기</button>
            </div>
          </div>
        </div>
      }

      {/* 종별 selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {TBR_DIVISIONS.map((d) =>
        <button
          key={d.division_id} type="button"
          onClick={() => setDivId(d.division_id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px',
            border: divId === d.division_id ? '1px solid var(--accent)' : '1px solid var(--border)',
            background: divId === d.division_id ? 'var(--bg-card)' : 'var(--bg-alt)',
            borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12.5, color: 'var(--ink)', fontWeight: divId === d.division_id ? 600 : 500
          }}>

            <span>{d.label}</span>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{d.teams}팀</span>
            {d.generated &&
          <span className="material-symbols-outlined" style={{ fontSize: 12, color: d.locked ? 'var(--ok)' : 'var(--accent)' }}>{d.locked ? 'lock' : 'check'}</span>
          }
          </button>
        )}
      </div>

      {/* 대진표 영역 */}
      {!division.generated ?
      <AdminEmptyState icon="account_tree" title={`${division.label} 대진표가 아직 생성되지 않았어요`}
        description={`${division.teams}팀이 등록되었습니다. 운영 방식에 따라 자동으로 그룹·결선을 구성합니다.`}
        ctaLabel="대진표 생성" onCta={() => setConfirmGen(true)} /> :


      <>
          {/* 상태 헤더 */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>현재 종별</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginTop: 2 }}>{division.label}</div>
            </div>
            <Divider />
            <Pill label="형식" value="조별예선 → 결선 토너먼트" />
            <Pill label="조" value="4조" />
            <Pill label="조별 경기" value="6×4 = 24경기" />
            <Pill label="결선" value="4경기" />
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="admin-stat-pill" data-tone={division.locked ? 'ok' : 'warn'}>
                <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{division.locked ? 'lock' : 'lock_open'}</span>
                {division.locked ? '확정됨' : '수정 가능'}
              </span>
            </div>
          </div>

          {/* 조별 예선 */}
          <section style={{ marginBottom: 14 }}>
            <SectionHeader icon="groups" title="조별 예선" subtitle="각 조 4팀 풀리그" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {TBR_GROUPS.map((g) =>
            <div key={g.group} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-alt)', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{g.group}조</span>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)' }}>{g.played}/{g.total}</span>
                  </div>
                  <div>
                    {g.teams.map((t, i) =>
                <div key={t} style={{ padding: '8px 12px', borderBottom: i < g.teams.length - 1 ? '1px solid var(--border)' : 0, fontSize: 12, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 14, height: 14, borderRadius: 2, background: 'var(--bg-alt)', fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-mute)', display: 'grid', placeItems: 'center' }}>{i + 1}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t}</span>
                      </div>
                )}
                  </div>
                </div>
            )}
            </div>
          </section>

          {/* 결선 토너먼트 */}
          <section>
            <SectionHeader icon="emoji_events" title="결선 토너먼트" subtitle="각 조 1·2위 진출 · 8강 → 4강 → 결승 + 3·4위전" />
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {TBR_KNOCKOUT.map((r) =>
            <div key={r.round}>
                  <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 8 }}>{r.round}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {r.matches.map((m) =>
                <div key={m.id} style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{m.a}</span>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, fontWeight: 700, color: m.a_score == null ? 'var(--ink-dim)' : 'var(--ink)' }}>{m.a_score ?? '—'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px' }}>
                          <span style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{m.b}</span>
                          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, fontWeight: 700, color: m.b_score == null ? 'var(--ink-dim)' : 'var(--ink)' }}>{m.b_score ?? '—'}</span>
                        </div>
                        <div style={{ padding: '4px 10px', background: 'var(--bg)', fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-mute)', borderTop: '1px solid var(--border)' }}>
                          {m.when}
                        </div>
                      </div>
                )}
                  </div>
                </div>
            )}
            </div>
          </section>
        </>
      }
    </AdminShell>);

}

function Pill({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 1 }}>{value}</div>
    </div>);

}
function Divider() {
  return <span style={{ width: 1, height: 24, background: 'var(--border)' }} />;
}
function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>{icon}</span>
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>{title}</h3>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)' }}>{subtitle}</div>
      </div>
    </div>);

}

window.AdminTournamentBracket = AdminTournamentBracket;
