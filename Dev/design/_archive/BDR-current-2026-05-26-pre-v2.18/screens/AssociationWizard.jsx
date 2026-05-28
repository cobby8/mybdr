/* global React, WIZARD_USER, WIZARD_USER_CANDIDATES, WIZARD_FEE_GRID, WizardShell, WizardStepper, WizardFooter, WizardCard */

// =====================================================================
// AssociationWizard.jsx — 협회(Association) 분기 마법사
//   진입: /tournament-admin/wizard/association
//   복귀: setRoute('tournamentAdminWizard')
//   에러: 권한 부족 시 빈 상태 카드
//   접근 권한: super_admin 또는 association_admin
//
// 4단계: 협회 기본정보 / 사무국장 / 단가표 / (옵션) 심판 사전등록
// =====================================================================

const ASSOC_STEPS = [
{ key: 'info', title: '협회 기본정보', hint: '협회명 / 코드' },
{ key: 'admin', title: '사무국장', hint: 'AssociationAdmin' },
{ key: 'fees', title: '단가표', hint: 'FeeSetting' },
{ key: 'referee', title: '심판 등록', hint: '옵션 · 스킵 가능' }];


function MSA({ name, size = 16, style }) {
  return <span className="material-symbols-outlined" style={{ fontSize: size, verticalAlign: '-3px', ...style }}>{name}</span>;
}

function AssociationWizard({ setRoute, backRoute = 'tournamentAdminWizard', backLabel = '일반 대회 마법사로', shellMode = 'page' }) {
  // mock 권한 토글 — 권한 부족 빈 상태 박제용
  const [mockHasPermission, setMockHasPermission] = React.useState(true);

  const [step, setStep] = React.useState(0);
  const [completed, setCompleted] = React.useState([]);
  const [data, setData] = React.useState({
    association_name: '',
    association_code: '',
    region: '',
    logo: '',
    admins: [],
    candidate_query: '',
    fees: WIZARD_FEE_GRID.map((f) => ({ ...f })),
    referees: [],
    skip_referee: false
  });

  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const goNext = () => {
    setCompleted((c) => Array.from(new Set([...c, step])));
    setStep((s) => Math.min(s + 1, ASSOC_STEPS.length - 1));
  };
  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  // 권한 없음 빈 상태
  if (!mockHasPermission) {
    return (
      <WizardShell
        eyebrow="협회 마법사"
        title="협회 만들기"
        subtitle="협회를 새로 만들거나 사무국장 / 단가표를 설정합니다."
        onBack={() => setRoute(backRoute)}
        shellMode={shellMode}
        backLabel={backLabel}
        stepper={
        <div style={{ padding: 8, fontSize: 12, color: 'var(--ink-mute)' }}>
            <span style={{ display: 'block', fontWeight: 700, marginBottom: 6, color: 'var(--accent)' }}>MOCK</span>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
              <input
              type="checkbox"
              checked={mockHasPermission}
              onChange={(e) => setMockHasPermission(e.target.checked)} />

              권한 있음
            </label>
          </div>
        }>

        <WizardCard
          eyebrow="권한 부족"
          title="협회 사무국장 권한이 필요합니다"
          hint="이 마법사는 super_admin 또는 association_admin 만 사용할 수 있어요. 일반 대회 개설은 통합 마법사를 이용하세요.">

          <div style={{ padding: 18, background: 'var(--bg-alt)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
            <MSA name="lock" size={32} style={{ color: 'var(--ink-dim)' }} />
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>
              현재 로그인 계정의 권한:&nbsp;
              <code style={{ background: 'var(--bg-card)', padding: '1px 6px', borderRadius: 3 }}>tournament_admin</code>
              <br />협회 권한이 필요하면 super_admin 에게 요청하세요.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <button type="button" className="btn btn--primary" onClick={() => setRoute(backRoute)}>
              <MSA name="arrow_back" size={14} /> 일반 마법사로
            </button>
            <button type="button" className="btn" onClick={() => setRoute('help')}>
              <MSA name="help" size={14} /> 권한 안내
            </button>
          </div>
        </WizardCard>
      </WizardShell>);

  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return <AssocInfoStep data={data} set={set} />;
      case 1:
        return <AssocAdminStep data={data} set={set} />;
      case 2:
        return <AssocFeesStep data={data} set={set} />;
      case 3:
        return <AssocRefereeStep data={data} set={set} />;
      default:
        return null;
    }
  };

  const isLast = step === ASSOC_STEPS.length - 1;
  const nextLabel = isLast ?
  <>협회 생성하기 <MSA name="check" size={14} /></> :
  null;

  return (
    <WizardShell
      eyebrow="협회 마법사"
      title="협회 만들기"
      subtitle="협회 정보 → 사무국장 → 단가표 → 심판. 단계별로 협회 운영 데이터를 한 번에 등록해요."
      onBack={() => setRoute(backRoute)}
      shellMode={shellMode}
      backLabel={backLabel}
      stepper={
      <div>
          <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 12,
          padding: '6px 8px', background: 'var(--bg-alt)', borderRadius: 4,
          fontSize: 10, color: 'var(--ink-mute)', fontFamily: 'var(--ff-mono)',
          letterSpacing: '0.04em'
        }}>
            <span style={{ width: '100%', fontWeight: 700, color: 'var(--accent)', marginBottom: 2 }}>MOCK · 권한</span>
            <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}>
              <input
              type="checkbox"
              checked={mockHasPermission}
              onChange={(e) => setMockHasPermission(e.target.checked)} />

              권한 있음 (super_admin)
            </label>
          </div>
          <WizardStepper
          steps={ASSOC_STEPS}
          currentStep={step}
          completedSteps={completed}
          onJump={(i) => setStep(i)} />

        </div>
      }
      footer={
      <WizardFooter
        onPrev={goPrev}
        onNext={isLast ? () => alert('협회 생성 (시안 — 실제 저장 X)') : goNext}
        onDraft={() => alert('임시저장 (시안)')}
        nextLabel={nextLabel}
        isLast={isLast}
        prevDisabled={step === 0} />

      }>

      {renderStep()}
    </WizardShell>);

}

// =====================================================================
// AssocInfoStep — Step 1
// =====================================================================
function AssocInfoStep({ data, set }) {
  return (
    <WizardCard
      eyebrow="STEP 1 / 4 · 협회 정보"
      title="협회 기본 정보"
      hint="협회명과 관할 지역, 협회 코드를 입력합니다.">

      <label className="label">협회명 *</label>
      <input
        className="input"
        placeholder="협회 이름 입력"
        value={data.association_name}
        onChange={(e) => set('association_name', e.target.value)} />


      <label className="label">협회 코드 *</label>
      <input
        className="input"
        placeholder="KBA-SEOUL"
        value={data.association_code}
        onChange={(e) => set('association_code', e.target.value)}
        style={{ fontFamily: 'var(--ff-mono)' }} />

      <div className="wizard-helper wizard-helper--mute">대문자 + 하이픈. 중복 불가.</div>

      <label className="label">관할 지역 *</label>
      <input
        className="input"
        placeholder="지역 입력"
        value={data.region}
        onChange={(e) => set('region', e.target.value)} />


      <label className="label">협회 로고</label>
      <div style={{
        height: 120,
        border: '1px dashed var(--border-strong)',
        borderRadius: 6,
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink-mute)',
        background: 'var(--bg-alt)',
        cursor: 'pointer'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 12 }}>
          <MSA name="image" size={28} />
          <span>로고 업로드</span>
          <span style={{ fontSize: 11, opacity: 0.7 }}>PNG · 정사각 권장</span>
        </div>
      </div>
    </WizardCard>);

}

// =====================================================================
// AssocAdminStep — Step 2 (사무국장 지정)
// =====================================================================
function AssocAdminStep({ data, set }) {
  const adminIds = new Set(data.admins.map((a) => a.user_id));
  const filtered = WIZARD_USER_CANDIDATES.filter((u) =>
  u.display_name.includes(data.candidate_query) ||
  u.email.includes(data.candidate_query));


  const add = (u) => {
    if (adminIds.has(u.user_id)) return;
    set('admins', [...data.admins, u]);
  };
  const remove = (id) => set('admins', data.admins.filter((a) => a.user_id !== id));

  return (
    <WizardCard
      eyebrow="STEP 2 / 4 · 사무국장"
      title="사무국장(AssociationAdmin) 지정"
      hint="협회 운영을 담당할 사무국장을 1명 이상 지정합니다. 추후 수정 가능.">

      <label className="label">사용자 검색</label>
      <input
        className="input"
        placeholder="이름 또는 이메일"
        value={data.candidate_query}
        onChange={(e) => set('candidate_query', e.target.value)} />


      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
        {filtered.map((u) =>
        <div key={u.user_id} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px', background: 'var(--bg-elev)',
          border: '1px solid var(--border)', borderRadius: 6, gap: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
              width: 32, height: 32, borderRadius: 50,
              background: 'var(--cafe-blue)', color: '#fff',
              display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 12,
              fontFamily: 'var(--ff-mono)'
            }}>
                {u.display_name.slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{u.display_name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)' }}>
                  {u.email} · {u.region} · 심판 {u.referee_level}
                </div>
              </div>
            </div>
            {adminIds.has(u.user_id) ?
          <button type="button" className="btn btn--sm" onClick={() => remove(u.user_id)}>
                <MSA name="remove" size={14} /> 해제
              </button> :

          <button type="button" className="btn btn--sm btn--primary" onClick={() => add(u)}>
                <MSA name="add" size={14} /> 지정
              </button>
          }
          </div>
        )}
      </div>

      <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 8 }}>
        지정된 사무국장 {data.admins.length}명
        {data.admins.length > 0 &&
        <span> · {data.admins.map((a) => a.display_name).join(', ')}</span>
        }
      </div>
    </WizardCard>);

}

// =====================================================================
// AssocFeesStep — Step 3 (단가표)
// =====================================================================
function AssocFeesStep({ data, set }) {
  const updateFee = (i, k, v) => {
    const next = [...data.fees];
    next[i] = { ...next[i], [k]: +v };
    set('fees', next);
  };
  const addRow = () => {
    set('fees', [...data.fees, { division: '', grade: 'A', duration: '40분', referee_fee: 0, recorder_fee: 0 }]);
  };

  return (
    <WizardCard
      eyebrow="STEP 3 / 4 · 단가표"
      title="심판 / 기록원 단가"
      hint="종별 × 등급 × 시간 별 단가표. 협회 산하 모든 대회에 자동 적용됩니다."
      action={
      <button type="button" className="btn btn--sm" onClick={addRow}>
          <MSA name="add" size={14} /> 행 추가
        </button>
      }>

      <div style={{ overflowX: 'auto' }}>
        <table className="wiz-fee-grid">
          <thead>
            <tr>
              <th>종별</th>
              <th>등급</th>
              <th>시간</th>
              <th>심판비</th>
              <th>기록원비</th>
            </tr>
          </thead>
          <tbody>
            {data.fees.map((f, i) =>
            <tr key={i}>
                <td>{f.division}</td>
                <td>{f.grade}</td>
                <td>{f.duration}</td>
                <td>
                  <input
                  className="input"
                  type="number"
                  value={f.referee_fee}
                  onChange={(e) => updateFee(i, 'referee_fee', e.target.value)} />

                </td>
                <td>
                  <input
                  className="input"
                  type="number"
                  value={f.recorder_fee}
                  onChange={(e) => updateFee(i, 'recorder_fee', e.target.value)} />

                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="wizard-helper wizard-helper--mute">
        <MSA name="info" size={12} /> 단위: 원(₩) / 회당. 변경 시 진행 중인 대회에는 즉시 적용되지 않습니다.
      </div>
    </WizardCard>);

}

// =====================================================================
// AssocRefereeStep — Step 4 (옵션)
// =====================================================================
function AssocRefereeStep({ data, set }) {
  if (data.skip_referee) {
    return (
      <WizardCard
        eyebrow="STEP 4 / 4 · 심판 (스킵됨)"
        title="심판 사전등록 건너뜀"
        hint="협회 생성 후 심판 메뉴에서 추가할 수 있어요."
        action={
        <button type="button" className="wizard-micro-action" onClick={() => set('skip_referee', false)}>
            <MSA name="undo" size={12} /> 다시 추가
          </button>
        }>

        <div style={{ padding: 12, background: 'var(--bg-alt)', borderRadius: 6, fontSize: 13, color: 'var(--ink-soft)' }}>
          심판 등록 없이 협회 생성을 완료할 수 있습니다.
        </div>
      </WizardCard>);

  }

  return (
    <WizardCard
      eyebrow="STEP 4 / 4 · 심판 (옵션)"
      title="심판 사전등록"
      hint="협회 산하 정기 심판을 미리 등록합니다. 건너뛸 수 있어요."
      action={
      <button type="button" className="wizard-micro-action" onClick={() => set('skip_referee', true)}>
          <MSA name="skip_next" size={12} /> 건너뛰기
        </button>
      }>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {WIZARD_USER_CANDIDATES.map((u) => {
          const picked = data.referees.includes(u.user_id);
          return (
            <button
              key={u.user_id}
              type="button"
              className="wiz-choice"
              data-selected={picked ? 'true' : 'false'}
              onClick={() => {
                set('referees', picked ?
                data.referees.filter((id) => id !== u.user_id) :
                [...data.referees, u.user_id]);

              }}>

              {picked &&
              <div className="wiz-choice__check"><MSA name="check" size={12} /></div>
              }
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, background: 'var(--accent)', color: '#fff',
                  borderRadius: 50, display: 'grid', placeItems: 'center',
                  fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: 12
                }}>
                  {u.display_name.slice(0, 2)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="wiz-choice__title" style={{ fontSize: 14 }}>{u.display_name}</div>
                  <div className="wiz-choice__meta">
                    <span>심판 {u.referee_level}</span>
                    <span>·</span>
                    <span>{u.region}</span>
                  </div>
                </div>
              </div>
            </button>);

        })}
      </div>

      <div className="wizard-helper wizard-helper--mute">
        선택된 심판 {data.referees.length}명 — 협회 생성 후 RefereeBoard 에 자동 추가됩니다.
      </div>
    </WizardCard>);

}

window.AssociationWizard = AssociationWizard;
