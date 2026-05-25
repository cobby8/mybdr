/* global React, AdminShell, AdminInlineForm */

// =====================================================================
// AdminTournamentWizard1Step.jsx — Admin-E · 1-step 압축 대회 마법사 (v2.14 신규)
//   진입: setRoute('adminWizardTournament')  (운영 /tournament-admin/tournaments/new/wizard)
//   복귀: setRoute('adminTournamentAdminHome')
//
// 운영 5/14 commit 반영:
//   - 60dd37e UI-2: 5-step → 1-step 압축. 진입 즉시 draft 생성 → SetupHub redirect
//   - 71b0eaa UI-1.1~1.3: game_method 비고 + 시리즈 inline 생성
//   - e8adc1a UI-1.5: ?step=2 anchor 점프
//
// 패턴: 진입 시 가벼운 폼 (대회명 + 시리즈) + [draft 만들기] CTA → SetupHub
//   v2.6 5-step wizard 와 분리 — v2.6 = 시안 단독 미리보기 / 본 페이지 = 운영 박제
// =====================================================================

const W1S_SERIES_OPTIONS = [
{ id: 'sr_2026_summer', label: 'BDR 서머 오픈 시리즈', edition_next: 5 },
{ id: 'sr_2026_challenge', label: 'BDR 챌린지 시리즈', edition_next: 9 },
{ id: 'sr_2026_rookie', label: '루키 컵 시리즈', edition_next: 4 },
{ id: 'sr_2026_winter', label: '윈터 인비테이셔널', edition_next: 4 },
{ id: 'sr_2026_spring', label: '스프링 오픈', edition_next: 3 }];


function AdminTournamentWizard1Step({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');

  const [name, setName] = React.useState('');
  const [seriesId, setSeriesId] = React.useState(''); // '' = 단독 / 'new' = 신규 inline / id = 기존
  const [seriesList, setSeriesList] = React.useState(W1S_SERIES_OPTIONS);
  const [gameMethod, setGameMethod] = React.useState('tournament_single');
  const [startDate, setStartDate] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const selectedSeries = seriesList.find((s) => s.id === seriesId);
  const editionPreview = selectedSeries ? `#${selectedSeries.edition_next}` : null;
  const canCreate = name.trim().length >= 2 && !creating;

  const handleCreate = () => {
    if (!canCreate) return;
    setCreating(true);
    // mock — 운영에선 즉시 draft 생성 API 호출 후 SetupHub redirect
    setTimeout(() => {
      setCreating(false);
      setRoute('adminTournamentSetupHub');
    }, 900);
  };

  const handleAddSeries = (label) => {
    const newId = 'sr_new_' + Date.now();
    setSeriesList([...seriesList, { id: newId, label, edition_next: 1 }]);
    setSeriesId(newId);
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


  return (
    <AdminShell
      route="adminTournamentNew"
      setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영"
      title="새 대회 만들기"
      subtitle="대회명을 입력하고 draft 를 만든 뒤, 설정 hub 에서 8 항목을 완성합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: '새 대회' }]
      }
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminTournamentAdminHome')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          취소
        </button>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, alignItems: 'flex-start' }}>
        {/* ─────── 좌 · 1-step 폼 ─────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* 운영 명세 안내 배너 */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: 14, background: 'var(--bg-alt)', borderRadius: 4,
            borderLeft: '3px solid var(--accent)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--accent)' }}>auto_awesome</span>
            <div style={{ flex: 1, fontSize: 12.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink)' }}>1-step 압축 마법사</strong> — 대회명만 입력하면 즉시 draft 가 만들어지고, 8 항목 설정 hub 로 이동합니다.
              <br />
              <span style={{ color: 'var(--ink-mute)' }}>나머지 정보 (종별 / 신청 정책 / 사이트 등) 는 hub 에서 단계별로 진행하세요.</span>
            </div>
          </div>

          {/* step 1 — 대회명 */}
          <Section anchor="step1" num="1" label="대회명" required>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 60))}
              placeholder="예: BDR 서머 오픈 #5"
              style={inputStyle} />

            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)', display: 'flex', justifyContent: 'space-between' }}>
              <span>대회를 식별하는 이름. 시리즈 회차가 자동 추가될 수 있습니다.</span>
              <span style={{ fontFamily: 'var(--ff-mono)', color: name.length >= 2 ? 'var(--ok)' : 'var(--ink-mute)' }}>{name.length}/60</span>
            </div>
          </Section>

          {/* step 2 — 시리즈 연결 (anchor jump 지원 — 운영 UI-1.5) */}
          <Section anchor="step2" num="2" label="시리즈 (선택)">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                <button
                  type="button"
                  onClick={() => setSeriesId('')}
                  style={pillBtnStyle(seriesId === '')}>

                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>circle</span>
                  단독 운영
                </button>
                <button
                  type="button"
                  onClick={() => setSeriesId(seriesId === '' || seriesId === 'new' ? W1S_SERIES_OPTIONS[0].id : seriesId)}
                  style={pillBtnStyle(seriesId !== '' && seriesId !== 'new')}>

                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>collections_bookmark</span>
                  기존 시리즈 연결
                </button>
              </div>

              {seriesId !== '' && seriesId !== 'new' &&
              <>
                  <select
                  value={seriesId}
                  onChange={(e) => setSeriesId(e.target.value)}
                  style={inputStyle}>

                    {seriesList.map((s) =>
                  <option key={s.id} value={s.id}>{s.label}{s.edition_next > 1 ? ` (다음 #${s.edition_next})` : ' (신규)'}</option>
                  )}
                  </select>
                  <AdminInlineForm
                  label="신규 시리즈 inline 추가"
                  placeholder="예: 서머 농구 시리즈"
                  icon="add"
                  onAdd={handleAddSeries}
                  ctaLabel="추가" />

                </>
              }

              {editionPreview &&
              <div style={{ marginTop: 4, padding: 10, background: 'var(--bg-alt)', borderRadius: 4, fontSize: 12, color: 'var(--ink-soft)' }}>
                  <span style={{ color: 'var(--ink-mute)' }}>회차 자동 부여:</span>{' '}
                  <strong style={{ color: 'var(--accent)', fontFamily: 'var(--ff-mono)' }}>{editionPreview}</strong>
                </div>
              }
            </div>
          </Section>

          {/* 보조 — 시작일 (선택) */}
          <Section anchor="step3" num="3" label="시작일 (선택)">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={inputStyle} />

            <div style={{ marginTop: 4, fontSize: 11, color: 'var(--ink-mute)' }}>
              나중에 hub 의 1. 기본 정보 에서 변경할 수 있습니다.
            </div>
          </Section>

          {/* 보조 — game_method 비고 (운영 UI-1.1) */}
          <Section anchor="step4" num="4" label="운영 방식 (참고용)">
            <select value={gameMethod} onChange={(e) => setGameMethod(e.target.value)} style={inputStyle}>
              <option value="tournament_single">싱글 토너먼트</option>
              <option value="tournament_double">더블 토너먼트</option>
              <option value="league_round_robin">리그전 (라운드 로빈)</option>
              <option value="group_then_knockout">조별 → 토너먼트</option>
            </select>
            <div style={{ marginTop: 6, padding: 10, background: 'var(--bg-alt)', borderRadius: 4, fontSize: 11.5, color: 'var(--ink-soft)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 13, verticalAlign: '-2px', marginRight: 4, color: 'var(--ink-mute)' }}>info</span>
              종별별로 다른 방식을 적용할 수도 있습니다. hub 의 4. 운영 방식 에서 종별 단위로 변경하세요.
            </div>
          </Section>

          {/* CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button type="button" className="btn" onClick={() => setRoute('adminTournamentAdminHome')}>취소</button>
            <button
              type="button"
              className="btn btn--primary"
              disabled={!canCreate}
              onClick={handleCreate}
              style={{ opacity: canCreate ? 1 : 0.5 }}>

              {creating ?
              <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>
                  draft 만드는 중…
                </> :

              <>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                  draft 만들고 hub 로 이동
                </>
              }
            </button>
          </div>
        </div>

        {/* ─────── 우 · 다음 단계 안내 ─────── */}
        <aside style={{ position: 'sticky', top: 80 }}>
          <div style={{ ...cardStyle, marginBottom: 12 }}>
            <div style={sectionLabelStyle}>이 마법사 이후</div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12.5 }}>
              <NextStep num="1" label="draft 자동 생성" desc="대회명만으로 draft 가 즉시 만들어집니다." />
              <NextStep num="2" label="설정 hub 진입" desc="8 항목 체크리스트가 표시됩니다." />
              <NextStep num="3" label="순서대로 채우기" desc="기본 → 종별 → 운영 → 신청 → 사이트 → 기록 → 대진표" />
              <NextStep num="4" label="공개하기" desc="필수 7항목 완료 시 공개 버튼 활성화" />
            </ol>
          </div>

          <div style={{ ...cardStyle, background: 'var(--bg-alt)', border: 0 }}>
            <div style={{ ...sectionLabelStyle, marginBottom: 6 }}>참고</div>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
              이 마법사는 운영 <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)' }}>5-step</code> 흐름을 <code style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--accent)' }}>1-step</code> 으로 압축한 버전입니다. 5-step 미리보기는 <button type="button" onClick={() => setRoute('tournamentAdminWizard')} style={{ background: 'transparent', border: 0, padding: 0, color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}>v2.6 시안</button>에서 확인하세요.
            </p>
          </div>
        </aside>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }' }} />
    </AdminShell>);

}

function Section({ anchor, num, label, required, children }) {
  return (
    <section id={anchor} style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ width: 22, height: 22, borderRadius: 50, background: 'var(--bg-alt)', color: 'var(--ink-mute)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700 }}>{num}</span>
        <span style={{ fontWeight: 600, fontSize: 13.5 }}>{label}</span>
        {required && <span style={{ color: 'var(--err)', fontSize: 12 }}>*</span>}
      </div>
      {children}
    </section>);

}

function NextStep({ num, label, desc }) {
  return (
    <li style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ width: 22, height: 22, borderRadius: 50, background: 'var(--bg-alt)', color: 'var(--accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{num}</span>
      <div>
        <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
      </div>
    </li>);

}

function pillBtnStyle(active) {
  return {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: 10,
    background: active ? 'var(--bg-alt)' : 'transparent',
    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
    color: active ? 'var(--ink)' : 'var(--ink-mute)',
    borderRadius: 4, cursor: 'pointer',
    fontSize: 12.5, fontWeight: active ? 600 : 400,
    fontFamily: 'inherit'
  };
}

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };
const sectionLabelStyle = { fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 };
const inputStyle = { padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 4, fontSize: 13.5, background: 'var(--bg-alt)', color: 'var(--ink)', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

window.AdminTournamentWizard1Step = AdminTournamentWizard1Step;
