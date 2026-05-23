/* global React, WIZARD_USER, WIZARD_LAST_EDITION, WizardShell, WizardStepper, WizardFooter, WizardCard, OrgStep, SeriesStep, InfoStep, RegistrationStep, ConfirmStep */

// =====================================================================
// TournamentAdminWizard.jsx — 통합 마법사 메인
//   진입: /tournament-admin/tournaments/new/wizard
//   복귀: setRoute('home') / 생성 후 'gameDetail'
//   에러: 자체 EmptyState X — 각 step 내부에서 처리
//   특이: super_admin / association_admin 진입 시 상단에 협회 마법사 CTA 카드
//
// 4 상태군 박제 — mock 토글 (분기 / 에러 / prefill / empty·filled)
// =====================================================================

const STEPS = [
{ key: 'org', title: '단체', hint: '클럽 / 협회' },
{ key: 'series', title: '시리즈', hint: '회차 자동' },
{ key: 'info', title: '대회 정보', hint: '일정 / 장소' },
{ key: 'registration', title: '참가 설정', hint: '종별 / 결제' },
{ key: 'confirm', title: '확인', hint: '생성' }];


function TournamentAdminWizard({ setRoute, backRoute = 'home', backLabel = '뒤로', shellMode = 'page' }) {
  // ----- mock 상태 토글 (UI 박제용) -----
  const [mockOrgCount, setMockOrgCount] = React.useState(3);    // 0 | 1 | 3
  const [mockSeriesCount, setMockSeriesCount] = React.useState(3); // 0 | 1 | 3
  const [mockRole, setMockRole] = React.useState('tournament_admin'); // 'tournament_admin' | 'super_admin'
  const [mockState, setMockState] = React.useState('empty');    // 'empty' | 'filled' | 'errors' | 'prefill'

  // ----- 마법사 상태 -----
  const [step, setStep] = React.useState(0);
  const [completed, setCompleted] = React.useState([]);
  const [data, setData] = React.useState(() => initialData('empty'));
  const [errors, setErrors] = React.useState({});

  // mock 상태가 바뀌면 데이터 reset
  React.useEffect(() => {
    setData(initialData(mockState));
    setErrors(mockState === 'errors' ? mockErrors() : {});
    setStep(mockState === 'prefill' ? 2 : 0);
    setCompleted(mockState === 'empty' ? [] : [0, 1]);
  }, [mockState, mockOrgCount, mockSeriesCount]);

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));

  const goNext = () => {
    setCompleted((c) => Array.from(new Set([...c, step])));
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));
  const jumpTo = (i) => setStep(i);

  // prefill 데이터 (mock — 실 API 자리)
  const prefillResolved = React.useMemo(() => {
    if (!data.series_id || data.prefill_enabled === false) return null;
    const snap = WIZARD_LAST_EDITION[data.series_id];
    if (!snap) return { error: true };
    return { snapshot: snap };
  }, [data.series_id, data.prefill_enabled]);

  // 현재 step renderer
  const renderStep = () => {
    switch (step) {
      case 0:
        return <OrgStep data={data} set={set} mockOrgCount={mockOrgCount} errors={errors} />;
      case 1:
        return <SeriesStep data={data} set={set} mockSeriesCount={mockSeriesCount} errors={errors} />;
      case 2:
        return <InfoStep data={data} set={set} prefillResolved={prefillResolved} errors={errors} />;
      case 3:
        return <RegistrationStep data={data} set={set} prefillResolved={prefillResolved} />;
      case 4:
        return <ConfirmStep data={data} jumpTo={jumpTo} onCreate={() => setRoute('gameDetail')} />;
      default:
        return null;
    }
  };

  const isLast = step === STEPS.length - 1;
  const nextLabel = isLast ?
  <>대회 생성하기 <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span></> :
  null;

  return (
    <>
      <WizardShell
        shellMode={shellMode}
        backLabel={backLabel}
        eyebrow="대회 만들기"
        title="새 대회 만들기"
        subtitle="단체 → 시리즈 → 정보 → 참가설정 → 확인. 시리즈 선택 시 이전 회차 데이터로 시작할 수 있어요."
        onBack={() => setRoute(backRoute)}
        stepper={
        <div>
            <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12,
            padding: '6px 8px', background: 'var(--bg-alt)', borderRadius: 4,
            fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)',
            letterSpacing: '0.04em'
          }}>
              <span style={{ width: '100%', fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>MOCK · 시안 상태군</span>
              <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '3px 4px', width: '100%' }}>
                <option value="empty">D · 진입 직후 (empty)</option>
                <option value="filled">D · 입력 완료 (filled)</option>
                <option value="errors">B · 검증 실패 (errors)</option>
                <option value="prefill">C · prefill ON · InfoStep</option>
              </select>
              <select value={mockOrgCount} onChange={(e) => setMockOrgCount(+e.target.value)} style={{ fontSize: 11, padding: '3px 4px', width: '100%' }}>
                <option value={0}>A · 단체 0개</option>
                <option value={1}>A · 단체 1개</option>
                <option value={3}>A · 단체 3개</option>
              </select>
              <select value={mockSeriesCount} onChange={(e) => setMockSeriesCount(+e.target.value)} style={{ fontSize: 11, padding: '3px 4px', width: '100%' }}>
                <option value={0}>A · 시리즈 0개</option>
                <option value={1}>A · 시리즈 1개</option>
                <option value={3}>A · 시리즈 3개</option>
              </select>
              <select value={mockRole} onChange={(e) => setMockRole(e.target.value)} style={{ fontSize: 11, padding: '3px 4px', width: '100%' }}>
                <option value="tournament_admin">일반 대회관리자</option>
                <option value="super_admin">super_admin / association_admin</option>
              </select>
            </div>
            <WizardStepper
            steps={STEPS}
            currentStep={step}
            completedSteps={completed}
            onJump={jumpTo} />

          </div>
        }
        footer={
        <WizardFooter
          onPrev={goPrev}
          onNext={isLast ? () => setRoute('gameDetail') : goNext}
          onDraft={() => alert('임시저장 (시안 — 실제 저장 X)')}
          nextLabel={nextLabel}
          isLast={isLast}
          prevDisabled={step === 0}
          nextDisabled={false} />

        }>

        {/* super_admin / association_admin 진입 카드 (Step 0 상단) */}
        {step === 0 && (mockRole === 'super_admin') &&
        <div className="wiz-cta-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{
              width: 40, height: 40, background: 'var(--cafe-blue)',
              borderRadius: 6, display: 'grid', placeItems: 'center', color: '#fff',
              flex: '0 0 auto'
            }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>verified</span>
              </div>
              <div className="wiz-cta-card__body">
                <span className="wiz-cta-card__title">협회 관리자 권한이 감지되었습니다</span>
                <span className="wiz-cta-card__desc">협회를 새로 만들거나 사무국장 / 단가표를 설정하려면 협회 마법사로 이동하세요.</span>
              </div>
            </div>
            <button
            type="button"
            className="btn btn--primary"
            onClick={() => setRoute('associationWizard')}>

              협회 마법사로
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
            </button>
          </div>
        }

        {renderStep()}
      </WizardShell>
    </>);

}

// ---------- mock data factories ----------
function initialData(state) {
  if (state === 'filled' || state === 'prefill') {
    const snap = WIZARD_LAST_EDITION.ser_summer_open;
    return {
      organization_id: 'org_seoul_3x3',
      organization_name: '서울 3x3 위원회',
      series_id: 'ser_summer_open',
      series_name: 'BDR 서머 오픈',
      series_slug: 'summer-open',
      next_edition_number: 4,
      prefill_enabled: true,
      name: state === 'prefill' ? snap.name.replace('#3', '#4') : 'BDR 서머 오픈 #4',
      slug: 'summer-open-4',
      date: '2026-08-15',
      registration_close: '2026-08-01',
      venue: snap.venue,
      description: snap.description,
      division_rules: snap.division_rules.map((d) => ({ ...d })),
      account_holder: '서울 3x3 위원회',
      bank_name: '신한은행',
      account_number: '110-123-456789',
      require_team: true,
      require_verified: true,
      allow_late_apply: false
    };
  }
  // empty / errors
  return {
    prefill_enabled: true,
    division_rules: [],
    require_team: true
  };
}

function mockErrors() {
  return {
    org_new_name: '이미 존재하는 단체명입니다',
    series_new_name: '시리즈명은 필수입니다',
    name: '대회명은 필수입니다',
    date: '대회 일자를 선택하세요'
  };
}

window.TournamentAdminWizard = TournamentAdminWizard;
