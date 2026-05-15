/* global React, AdminShell */

// =====================================================================
// AdminTournamentEditWizard.jsx — Admin-E · 대회 수정 wizard (v2.14 신규)
//   진입: setRoute('adminTournamentEditWizard')  (운영 /tournament-admin/tournaments/[id]/wizard)
//   복귀: setRoute('adminTournamentSetupHub')
//
// 운영 5/14 commit 8478a24 반영:
//   - UI-3: bracketSettings 영역 통합 (대진표 설정을 wizard 안으로)
//   - UI-4: 사이트 영역 제거 (site = 별도 페이지 / single source of truth)
//
// 패턴: 다중 섹션 폼 (좌 sticky ToC + 우 본문)
//   섹션: 기본 정보 / 종별 / 운영 방식 / 신청 정책 / 기록 설정 / 대진표 설정 (bracketSettings)
//   사이트 섹션 제거됨 — 안내 박스로 대체
// =====================================================================

const TEW_TOURNAMENT = {
  tournament_id: 'tn_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  series: 'BDR 서머 오픈 시리즈',
  edition: 4,
  starts_at: '2026-06-15',
  ends_at: '2026-06-22',
  apply_end: '2026-05-25',
  venue_name: '강남 베이스코트',
  max_teams: 44,
  entry_fee: 30000,
  auto_approve: false,
  recording_mode: 'score_sheet',
  bracket_format: 'group_then_knockout',
  group_size: 4,
  knockout_seed: 'group_rank',
  divisions: [
  { id: 'd1', label: 'A · 오픈', max_teams: 16 },
  { id: 'd2', label: 'B · U18', max_teams: 12 },
  { id: 'd3', label: 'C · 여성부', max_teams: 8 },
  { id: 'd4', label: 'D · 시니어', max_teams: 8 }]

};

const TEW_SECTIONS = [
{ id: 'basic', num: '1', label: '기본 정보', icon: 'info' },
{ id: 'divisions', num: '2', label: '종별', icon: 'category' },
{ id: 'format', num: '3', label: '운영 방식', icon: 'tune' },
{ id: 'apply', num: '4', label: '신청 정책', icon: 'how_to_reg' },
{ id: 'recording', num: '5', label: '기록 설정', icon: 'edit_note' },
{ id: 'bracket', num: '6', label: '대진표 설정', icon: 'account_tree', new_badge: 'UI-3' }];


function AdminTournamentEditWizard({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [data, setData] = React.useState(TEW_TOURNAMENT);
  const [dirty, setDirty] = React.useState(false);
  const [savedToast, setSavedToast] = React.useState(false);

  const set = (k, v) => { setData((d) => ({ ...d, [k]: v })); setDirty(true); };

  const save = () => {
    setDirty(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el?.getBoundingClientRect) {
      const y = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
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
    <AdminShell
      route="adminTournamentEditWizard"
      setRoute={setRoute}
      eyebrow={`ADMIN · 대회 수정 > ${data.name}`}
      title="대회 수정 wizard"
      subtitle="기존 대회의 설정을 일괄 수정합니다. 사이트 설정은 별도 페이지에서 관리합니다 (UI-4)."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: data.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '수정 wizard' }]
      }
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminTournamentSetupHub')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          설정 hub 로
        </button>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: '240px minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* 좌 — 섹션 ToC (sticky) */}
        <aside style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, fontWeight: 600 }}>섹션</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {TEW_SECTIONS.map((s) =>
              <button
                key={s.id}
                type="button"
                onClick={() => scrollTo(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 0, borderRadius: 4,
                  cursor: 'pointer', textAlign: 'left',
                  fontFamily: 'inherit', fontSize: 12.5,
                  color: 'var(--ink-soft)'
                }}>

                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', minWidth: 14 }}>{s.num}</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>{s.icon}</span>
                  <span style={{ flex: 1 }}>{s.label}</span>
                  {s.new_badge &&
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, fontWeight: 700, color: 'var(--accent)', padding: '2px 4px', background: 'var(--bg-alt)', borderRadius: 2 }}>{s.new_badge}</span>
                }
                </button>
              )}
            </nav>
          </div>

          {/* 사이트 분리 안내 (UI-4) */}
          <div style={{ background: 'var(--bg-alt)', borderRadius: 6, padding: 12, marginTop: 10, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--accent)' }}>info</span>
              <span style={{ fontWeight: 700, fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>UI-4</span>
            </div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              <strong>사이트 설정 제거됨</strong> — 공개 사이트·서브도메인은 hub 의{' '}
              <button type="button" onClick={() => setRoute('adminTournamentSetupHub')} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>6. 사이트 설정</button>에서 별도 관리합니다.
            </p>
          </div>
        </aside>

        {/* 우 — 섹션 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 100 }}>
          {/* 1. 기본 정보 */}
          <SectionCard id="basic" num="1" label="기본 정보" icon="info">
            <FormRow label="대회명">
              <input type="text" value={data.name} onChange={(e) => set('name', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="시리즈 / 회차">
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="text" value={data.series} onChange={(e) => set('series', e.target.value)} style={inputStyle} />
                <input type="number" value={data.edition} onChange={(e) => set('edition', parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 80 }} />
              </div>
            </FormRow>
            <FormRow label="본선 시작">
              <input type="date" value={data.starts_at} onChange={(e) => set('starts_at', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="본선 종료">
              <input type="date" value={data.ends_at} onChange={(e) => set('ends_at', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="경기장">
              <input type="text" value={data.venue_name} onChange={(e) => set('venue_name', e.target.value)} style={inputStyle} />
            </FormRow>
          </SectionCard>

          {/* 2. 종별 */}
          <SectionCard id="divisions" num="2" label="종별" icon="category">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {data.divisions.map((d, i) =>
              <div key={d.id} style={{ display: 'flex', gap: 6, alignItems: 'center', padding: 8, background: 'var(--bg-alt)', borderRadius: 4 }}>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>#{i + 1}</span>
                  <input type="text" value={d.label} readOnly style={{ ...inputStyle, flex: 1, background: 'transparent' }} />
                  <input type="number" value={d.max_teams} readOnly style={{ ...inputStyle, width: 70, background: 'transparent' }} />
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)' }}>팀</span>
                </div>
              )}
              <button type="button" className="btn btn--sm" style={{ alignSelf: 'flex-start', marginTop: 4 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>
                종별 추가
              </button>
            </div>
          </SectionCard>

          {/* 3. 운영 방식 */}
          <SectionCard id="format" num="3" label="운영 방식" icon="tune">
            <FormRow label="형식">
              <select value={data.bracket_format} onChange={(e) => set('bracket_format', e.target.value)} style={inputStyle}>
                <option value="tournament_single">싱글 토너먼트</option>
                <option value="tournament_double">더블 토너먼트</option>
                <option value="league_round_robin">리그전 (라운드 로빈)</option>
                <option value="group_then_knockout">조별 → 토너먼트</option>
              </select>
            </FormRow>
          </SectionCard>

          {/* 4. 신청 정책 */}
          <SectionCard id="apply" num="4" label="신청 정책" icon="how_to_reg">
            <FormRow label="최대 팀 수">
              <input type="number" value={data.max_teams} onChange={(e) => set('max_teams', parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 100 }} />
            </FormRow>
            <FormRow label="참가비">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={data.entry_fee} onChange={(e) => set('entry_fee', parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 140 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>원 / 팀</span>
              </div>
            </FormRow>
            <FormRow label="신청 마감">
              <input type="date" value={data.apply_end} onChange={(e) => set('apply_end', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="자동 승인">
              <Toggle on={data.auto_approve} onChange={(v) => set('auto_approve', v)} hint={data.auto_approve ? '신청 즉시 자동 승인' : '운영자 수동 승인 필요'} />
            </FormRow>
          </SectionCard>

          {/* 5. 기록 설정 */}
          <SectionCard id="recording" num="5" label="기록 설정" icon="edit_note">
            <FormRow label="기본 기록 방식">
              <RadioGroup
                name="recording_mode"
                value={data.recording_mode}
                onChange={(v) => set('recording_mode', v)}
                options={[
                { v: 'score_sheet', label: '점수 시트 (수기 입력)', desc: '경기 후 시트 사진 + 점수 입력' },
                { v: 'app_live', label: '앱 실시간 입력', desc: '기록원이 앱으로 quarter/foul 등 입력' },
                { v: 'app_final_only', label: '앱 — 최종 점수만', desc: '경기 종료 후 최종 점수만 입력' }]
                } />

            </FormRow>
          </SectionCard>

          {/* 6. 대진표 설정 — UI-3 */}
          <SectionCard id="bracket" num="6" label="대진표 설정" icon="account_tree" badge="UI-3 통합">
            <div style={{ marginBottom: 10, padding: 10, background: 'var(--bg-alt)', borderRadius: 4, fontSize: 11.5, color: 'var(--ink-soft)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: '-2px', marginRight: 4, color: 'var(--accent)' }}>info</span>
              <strong>UI-3 통합</strong> — 대진표 설정 (bracketSettings) 이 wizard 안으로 들어왔습니다. 별도 페이지에서 분리 관리하지 않습니다.
            </div>
            <FormRow label="조 크기 (조별 → 토너먼트 시)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={data.group_size} onChange={(e) => set('group_size', parseInt(e.target.value, 10))} min="2" max="8" style={{ ...inputStyle, width: 80 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>팀 / 조</span>
              </div>
            </FormRow>
            <FormRow label="결선 시드 방식">
              <RadioGroup
                name="knockout_seed"
                value={data.knockout_seed}
                onChange={(v) => set('knockout_seed', v)}
                options={[
                { v: 'group_rank', label: '조별 순위 기준', desc: '1조 1위 vs 2조 2위 식 교차' },
                { v: 'random', label: '랜덤 추첨', desc: '결선 진출팀 무작위 매치' },
                { v: 'manual', label: '수동 배정', desc: '운영자가 직접 대진 설정' }]
                } />

            </FormRow>
            <FormRow label="3·4위전">
              <Toggle on={true} onChange={() => {}} hint="결승 진출 실패 두 팀의 3·4위 결정전 진행" />
            </FormRow>
          </SectionCard>

          {/* 사이트 영역 — UI-4 제거 안내 (필러로 대체) */}
          <div style={{ background: 'var(--bg-alt)', border: '1px dashed var(--border)', borderRadius: 6, padding: 18, textAlign: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--ink-dim)' }}>delete_sweep</span>
            <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--ink-mute)' }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)' }}>UI-4</span> — 사이트 영역 제거됨
            </div>
            <div style={{ marginTop: 4, fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>
              공개 사이트·서브도메인·메타데이터는 별도 페이지에서 관리합니다.
              <br />
              <button type="button" onClick={() => setRoute('adminTournamentSetupHub')} style={{ marginTop: 6, background: 'transparent', border: 0, padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>
                hub 의 6. 사이트 설정 으로 이동 →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* sticky 저장 바 */}
      <div style={{
        position: 'sticky', bottom: 0,
        marginTop: 16, marginLeft: -24, marginRight: -24,
        padding: '12px 24px',
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
        zIndex: 10
      }}>
        <div style={{ fontSize: 12.5, color: dirty ? 'var(--accent)' : 'var(--ink-mute)' }}>
          {savedToast ?
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              저장되었습니다
            </span> :
          dirty ?
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              저장되지 않은 변경 사항이 있습니다
            </span> :

          <span>변경 사항 없음</span>
          }
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn" onClick={() => { setData(TEW_TOURNAMENT); setDirty(false); }} disabled={!dirty}>되돌리기</button>
          <button type="button" className="btn btn--primary" disabled={!dirty} onClick={save}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            저장
          </button>
        </div>
      </div>
    </AdminShell>);

}

// ─────── helpers ───────
function SectionCard({ id, num, label, icon, badge, children }) {
  return (
    <section id={id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 24, height: 24, borderRadius: 50, background: 'var(--bg-alt)', color: 'var(--ink-mute)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{num}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, flex: 1 }}>{label}</span>
        {badge &&
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', padding: '3px 6px', background: 'var(--bg-alt)', borderRadius: 3, letterSpacing: '0.04em' }}>{badge}</span>
        }
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>{children}</div>
    </section>);

}

function FormRow({ label, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ paddingTop: 8, fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
      <div>{children}</div>
    </div>);

}

function Toggle({ on, onChange, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        style={{
          width: 38, height: 22, padding: 2,
          background: on ? 'var(--accent)' : 'var(--bg-alt)',
          border: '1px solid var(--border)', borderRadius: 11,
          cursor: 'pointer'
        }}>

        <span style={{
          display: 'block', width: 16, height: 16, borderRadius: 50, background: '#fff',
          transform: `translateX(${on ? 16 : 0}px)`, transition: 'transform .12s ease'
        }} />
      </button>
      {hint && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{hint}</span>}
    </div>);

}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map((o) =>
      <label key={o.v} style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        padding: 10,
        background: value === o.v ? 'var(--bg-alt)' : 'transparent',
        border: `1px solid ${value === o.v ? 'var(--accent)' : 'var(--border)'}`,
        borderRadius: 4, cursor: 'pointer'
      }}>
          <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} style={{ accentColor: 'var(--accent)', marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{o.label}</div>
            {o.desc && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{o.desc}</div>}
          </div>
        </label>
      )}
    </div>);

}

const inputStyle = { padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

window.AdminTournamentEditWizard = AdminTournamentEditWizard;
