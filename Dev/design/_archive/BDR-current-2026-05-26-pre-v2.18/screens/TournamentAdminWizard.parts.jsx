/* global React, WIZARD_ORGS, WIZARD_SERIES, WIZARD_LAST_EDITION, WizardCard */

// =====================================================================
// TournamentAdminWizard.parts.jsx
//
// 5개 step sub-component
//   - OrgStep        (Step 0 — 단체 선택)
//   - SeriesStep     (Step 1 — 시리즈 선택)
//   - InfoStep       (Step 2 — 대회 기본 정보)
//   - RegistrationStep (Step 3 — 참가 설정)
//   - ConfirmStep    (Step 4 — 확인 및 생성)
//
// 분기 / 에러 / prefill / empty·filled 4 상태군 모두 박제.
// =====================================================================

// 작은 헬퍼 — material symbols
function MS({ name, size = 16, style }) {
  return (
    <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, verticalAlign: '-3px', ...style }}>
      {name}
    </span>);

}

// =====================================================================
// OrgStep — Step 0 (단체 선택)
// =====================================================================
function OrgStep({ data, set, mockOrgCount, errors }) {
  // mockOrgCount: 0 | 1 | N 으로 분기 — TournamentAdminWizard 의 상태 토글에서 제어
  const orgs = WIZARD_ORGS.slice(0, mockOrgCount);
  const [createMode, setCreateMode] = React.useState(orgs.length === 0);
  const [skipOrg, setSkipOrg] = React.useState(false);

  // 분기 A — 0개 → 인라인 폼 default
  // 분기 B — 1개 → 자동 선택 + 변경 가능
  // 분기 C — N개 → 드롭다운/카드

  React.useEffect(() => {
    if (orgs.length === 1 && !data.organization_id) {
      set('organization_id', orgs[0].organization_id);
      set('organization_name', orgs[0].name);
    }
  }, [orgs.length]);

  // ---------- 분기 A : 0개 ----------
  if (orgs.length === 0 && !skipOrg) {
    return (
      <>
        <WizardCard
          eyebrow="STEP 1 / 5 · 단체"
          title="먼저 단체를 만들까요?"
          hint="대회는 보통 단체(클럽 / 협회) 명의로 개최됩니다. 1회성 대회라면 건너뛸 수 있어요.">

          <label className="label">단체명 *</label>
          <input
            className="input"
            placeholder="단체 이름 입력"
            value={data.org_new_name || ''}
            onChange={(e) => set('org_new_name', e.target.value)} />

          {errors?.org_new_name && (
            <div className="wizard-helper wizard-helper--err">
              <MS name="error" size={12} /> {errors.org_new_name}
            </div>)}


          <div style={{ height: 6 }}></div>
          <label className="label">단체 유형 *</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['클럽', '동호회', '협회', '기타'].map((t) =>
            <button
              key={t}
              type="button"
              className="btn btn--sm"
              onClick={() => set('org_new_type', t)}
              style={data.org_new_type === t ? { background: 'var(--accent)', color: '#fff', borderColor: 'var(--accent)' } : {}}>

                {t}
              </button>
            )}
          </div>

          <div style={{ height: 6 }}></div>
          <label className="label">지역</label>
          <input
            className="input"
            placeholder="지역 입력 (선택)"
            value={data.org_new_region || ''}
            onChange={(e) => set('org_new_region', e.target.value)} />


          <label className="label">한 줄 소개</label>
          <input
            className="input"
            placeholder="단체를 한 줄로 소개"
            value={data.org_new_desc || ''}
            onChange={(e) => set('org_new_desc', e.target.value)} />


          <div className="wiz-sub-actions">
            <button type="button" onClick={() => setSkipOrg(true)}>단체 없이 진행하기</button>
          </div>
        </WizardCard>
      </>);

  }

  // ---------- "단체 없이 진행" 선택 ----------
  if (skipOrg) {
    return (
      <WizardCard
        eyebrow="STEP 1 / 5 · 단체"
        title="단체 없이 진행"
        hint="1회성 대회로 등록됩니다. 시리즈도 만들 수 없어요."
        action={
        <button type="button" className="wizard-micro-action" onClick={() => setSkipOrg(false)}>
            <MS name="undo" size={12} /> 단체 만들기로
          </button>
        }>

        <div style={{ padding: 12, background: 'var(--bg-alt)', borderRadius: 6, fontSize: 13, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MS name="info" size={16} />
          <span>다음 단계에서 시리즈 선택은 자동으로 건너뜁니다.</span>
        </div>
      </WizardCard>);

  }

  // ---------- 분기 B : 1개 ----------
  if (orgs.length === 1 && !createMode) {
    const o = orgs[0];
    return (
      <WizardCard
        eyebrow="STEP 1 / 5 · 단체"
        title={`${o.name} 로 진행합니다`}
        hint="본인이 관리하는 단체가 자동 선택되었습니다.">

        <div className="wiz-choice" data-selected="true">
          <div className="wiz-choice__check"><MS name="check" size={14} /></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: o.logo_color, borderRadius: 6, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: 14 }}>
              {o.name.slice(0, 2)}
            </div>
            <div style={{ minWidth: 0 }}>
              <div className="wiz-choice__title">{o.name}</div>
              <div className="wiz-choice__meta">
                <span>{o.type}</span>
                <span>·</span>
                <span>{o.region}</span>
                <span>·</span>
                <span className="wiz-role-badge" data-role={o.my_role}>{o.my_role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="wiz-sub-actions">
          <button type="button" onClick={() => setCreateMode(true)}>다른 단체 만들기</button>
          <button type="button" onClick={() => setSkipOrg(true)}>단체 없이 진행</button>
        </div>
      </WizardCard>);

  }

  // ---------- 분기 C : N개 ----------
  return (
    <WizardCard
      eyebrow="STEP 1 / 5 · 단체"
      title="대회를 개최할 단체를 선택하세요"
      hint={`${orgs.length}개 단체에 권한이 있습니다. 카드를 눌러 선택하세요.`}>

      <div className="wiz-choice-grid">
        {orgs.map((o) =>
        <button
          key={o.organization_id}
          type="button"
          className="wiz-choice"
          data-selected={data.organization_id === o.organization_id ? 'true' : 'false'}
          onClick={() => {
            set('organization_id', o.organization_id);
            set('organization_name', o.name);
          }}>

            {data.organization_id === o.organization_id &&
          <div className="wiz-choice__check"><MS name="check" size={14} /></div>
          }
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, background: o.logo_color, borderRadius: 6, display: 'grid', placeItems: 'center', color: '#fff', fontFamily: 'var(--ff-mono)', fontWeight: 700, fontSize: 14 }}>
                {o.name.slice(0, 2)}
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="wiz-choice__title">{o.name}</div>
                <div className="wiz-choice__meta">
                  <span className="wiz-role-badge" data-role={o.my_role}>{o.my_role}</span>
                  <span>·</span>
                  <span>{o.type}</span>
                </div>
              </div>
            </div>
            <div className="wiz-choice__meta" style={{ paddingTop: 4 }}>
              <span><MS name="emoji_events" size={12} /> 대회 {o.tournaments_count}</span>
              <span><MS name="groups" size={12} /> 멤버 {o.member_count}</span>
            </div>
          </button>
        )}
      </div>

      <div className="wiz-sub-actions">
        <button type="button" onClick={() => setCreateMode(true)}>단체 만들기</button>
        <button type="button" onClick={() => setSkipOrg(true)}>단체 없이 진행</button>
      </div>
    </WizardCard>);

}

// =====================================================================
// SeriesStep — Step 1 (시리즈 선택)
// =====================================================================
function SeriesStep({ data, set, mockSeriesCount, errors }) {
  const allSeries = WIZARD_SERIES.slice(0, mockSeriesCount);
  const [createMode, setCreateMode] = React.useState(false);
  const [skipSeries, setSkipSeries] = React.useState(false);

  // ---------- 시리즈 없이 1회성 ----------
  if (skipSeries) {
    return (
      <WizardCard
        eyebrow="STEP 2 / 5 · 시리즈"
        title="1회성 대회로 등록"
        hint="시리즈에 속하지 않는 단발성 대회입니다. 회차 번호 자동 채번 X."
        action={
        <button type="button" className="wizard-micro-action" onClick={() => setSkipSeries(false)}>
            <MS name="undo" size={12} /> 시리즈 선택으로
          </button>
        }>

        <div style={{ padding: 12, background: 'var(--bg-alt)', borderRadius: 6, fontSize: 13, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MS name="event" size={16} />
          <span>다음 단계에서 모든 정보를 수동 입력합니다.</span>
        </div>
      </WizardCard>);

  }

  // ---------- 분기 A : 0개 → 인라인 폼 ----------
  if (allSeries.length === 0 || createMode) {
    return (
      <WizardCard
        eyebrow="STEP 2 / 5 · 시리즈"
        title={createMode ? "신규 시리즈 만들기" : "첫 시리즈를 만들까요?"}
        hint="시리즈는 매년 / 매월 반복 개최되는 대회 묶음입니다. 회차 번호가 자동으로 매겨집니다."
        action={createMode ?
        <button type="button" className="wizard-micro-action" onClick={() => setCreateMode(false)}>
              <MS name="undo" size={12} /> 시리즈 선택으로
            </button> :
        null
        }>

        <label className="label">시리즈명 *</label>
        <input
          className="input"
          placeholder="시리즈 이름 입력"
          value={data.series_new_name || ''}
          onChange={(e) => set('series_new_name', e.target.value)} />

        {errors?.series_new_name &&
        <div className="wizard-helper wizard-helper--err">
            <MS name="error" size={12} /> {errors.series_new_name}
          </div>
        }

        <label className="label">시리즈 슬러그 *</label>
        <input
          className="input"
          placeholder="summer-open"
          value={data.series_new_slug || ''}
          onChange={(e) => set('series_new_slug', e.target.value)}
          style={{ fontFamily: 'var(--ff-mono)' }} />


        <label className="label">시리즈 설명</label>
        <textarea
          className="textarea"
          rows={2}
          placeholder="한 줄 설명"
          value={data.series_new_desc || ''}
          onChange={(e) => set('series_new_desc', e.target.value)} />


        <div className="wiz-sub-actions">
          <button type="button" onClick={() => setSkipSeries(true)}>시리즈 없이 1회성 대회</button>
        </div>
      </WizardCard>);

  }

  // ---------- 분기 B : N개 → 카드 그리드 ----------
  const selected = allSeries.find((s) => s.series_id === data.series_id);
  return (
    <WizardCard
      eyebrow="STEP 2 / 5 · 시리즈"
      title="이 대회가 속할 시리즈를 선택하세요"
      hint="기존 시리즈를 선택하면 회차 번호가 자동으로 매겨지고 이전 회차 데이터로 채울 수 있어요.">

      <div className="wiz-choice-grid">
        {allSeries.map((s) =>
        <button
          key={s.series_id}
          type="button"
          className="wiz-choice"
          data-selected={data.series_id === s.series_id ? 'true' : 'false'}
          onClick={() => {
            set('series_id', s.series_id);
            set('series_name', s.name);
            set('series_slug', s.slug);
            set('next_edition_number', s.last_edition_number + 1);
          }}>

            {data.series_id === s.series_id &&
          <div className="wiz-choice__check"><MS name="check" size={14} /></div>
          }
            <div className="wiz-choice__title">{s.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{s.description}</div>
            <div className="wiz-choice__meta" style={{ paddingTop: 4 }}>
              <span><MS name="event_repeat" size={12} /> {s.edition_count}회차 진행</span>
              <span><MS name="calendar_month" size={12} /> 최근 {s.last_edition_date}</span>
            </div>
          </button>
        )}
      </div>

      {selected &&
      <div style={{ padding: 12, background: 'var(--accent-soft)', border: '1px solid var(--accent)', borderRadius: 6, fontSize: 13, color: 'var(--ink)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MS name="auto_awesome" size={16} style={{ color: 'var(--accent)' }} />
            <span><b>{selected.name}</b>의 <b>#{selected.last_edition_number + 1}</b> 회차를 만듭니다.</span>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
            <input
            type="checkbox"
            checked={data.prefill_enabled !== false}
            onChange={(e) => set('prefill_enabled', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />

            <span>이전 회차(#{selected.last_edition_number}) 데이터로 시작하기 — 종별 / 참가비 / 룰 자동 채움</span>
          </label>
        </div>
      }

      <div className="wiz-sub-actions">
        <button type="button" onClick={() => setCreateMode(true)}>신규 시리즈 만들기</button>
        <button type="button" onClick={() => setSkipSeries(true)}>시리즈 없이 1회성 대회</button>
      </div>
    </WizardCard>);

}

// =====================================================================
// InfoStep — Step 2 (대회 기본 정보)
// =====================================================================
function InfoStep({ data, set, prefillResolved, errors }) {
  const isPrefilled = data.prefill_enabled !== false && data.series_id;
  const fillFromLast = prefillResolved?.snapshot;

  const prefillBadge = (field) => {
    if (!isPrefilled || !fillFromLast) return null;
    // 날짜 / 슬러그 제외
    if (['date', 'registration_close', 'slug'].includes(field)) return null;
    return (
      <button
        type="button"
        className="wizard-micro-action"
        onClick={() => set(field, '')}
        title="이 필드를 비우기">

        <MS name="auto_fix_high" size={12} /> 이전 회차에서 채움 · ↺ 초기화
      </button>);

  };

  return (
    <WizardCard
      eyebrow="STEP 3 / 5 · 대회 정보"
      title="대회 기본 정보"
      hint={isPrefilled ? "이전 회차 데이터로 미리 채워졌습니다. 필드별로 초기화 가능." : "대회의 일정 / 장소 / 소개를 입력합니다."}
      action={isPrefilled &&
      <span className="wizard-prefill-chip">
            <MS name="auto_fix_high" size={12} /> 이전 회차에서 채움
          </span>
      }>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="label">대회명 *</label>
          {prefillBadge('name')}
        </div>
        <input
          className="input"
          placeholder="대회 이름 입력"
          value={data.name || ''}
          onChange={(e) => set('name', e.target.value)} />

        {errors?.name &&
        <div className="wizard-helper wizard-helper--err"><MS name="error" size={12} /> {errors.name}</div>
        }
      </div>

      <div>
        <label className="label">슬러그 *</label>
        <input
          className="input"
          placeholder="auto-generated"
          value={data.slug || ''}
          onChange={(e) => set('slug', e.target.value)}
          style={{ fontFamily: 'var(--ff-mono)' }} />

        <div className="wizard-helper wizard-helper--mute">
          {data.series_slug ?
          `시리즈 슬러그 기반: ${data.series_slug}-${data.next_edition_number || 1}` :
          "1회성 대회 — 직접 입력하세요"}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        <div>
          <label className="label">대회 일자 *</label>
          <input
            className="input"
            type="date"
            value={data.date || ''}
            onChange={(e) => set('date', e.target.value)} />

          {errors?.date &&
          <div className="wizard-helper wizard-helper--err"><MS name="error" size={12} /> {errors.date}</div>
          }
        </div>
        <div>
          <label className="label">신청 마감 *</label>
          <input
            className="input"
            type="date"
            value={data.registration_close || ''}
            onChange={(e) => set('registration_close', e.target.value)} />

        </div>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="label">경기 장소 *</label>
          {prefillBadge('venue')}
        </div>
        <input
          className="input"
          placeholder="장소명 입력"
          value={data.venue || ''}
          onChange={(e) => set('venue', e.target.value)} />

      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label className="label">대회 소개</label>
          {prefillBadge('description')}
        </div>
        <textarea
          className="textarea"
          rows={3}
          placeholder="대회 한 줄 소개 또는 상세"
          value={data.description || ''}
          onChange={(e) => set('description', e.target.value)} />

      </div>

      <div>
        <label className="label">대표 이미지</label>
        <div style={{
          height: 100,
          border: '1px dashed var(--border-strong)',
          borderRadius: 6,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ink-mute)',
          fontSize: 12,
          background: 'var(--bg-alt)',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <MS name="add_photo_alternate" size={24} />
            <span>이미지 업로드</span>
          </div>
        </div>
      </div>

      {prefillResolved?.error &&
      <div className="wizard-helper wizard-helper--warn" style={{ padding: 10, background: 'rgba(232,163,59,0.08)', borderLeft: '3px solid var(--warn)', borderRadius: 4 }}>
          <MS name="warning" size={12} /> 이전 회차 조회 실패 — 1회차로 진행됩니다.
        </div>
      }
    </WizardCard>);

}

// =====================================================================
// RegistrationStep — Step 3 (참가 설정)
// =====================================================================
function RegistrationStep({ data, set, prefillResolved }) {
  const isPrefilled = data.prefill_enabled !== false && data.series_id;
  const divisions = data.division_rules || [];

  const addDivision = () => {
    set('division_rules', [...divisions, { division_name: '', entry_fee: 0, max_teams: 8, min_age: null, max_age: null }]);
  };
  const updateDivision = (i, field, val) => {
    const next = [...divisions];
    next[i] = { ...next[i], [field]: val };
    set('division_rules', next);
  };
  const removeDivision = (i) => {
    set('division_rules', divisions.filter((_, idx) => idx !== i));
  };

  return (
    <>
      <WizardCard
        eyebrow="STEP 4 / 5 · 참가 설정"
        title="종별 (Division)"
        hint="각 종별의 참가비 / 정원 / 자격 룰을 정의합니다."
        action={
        <button type="button" className="btn btn--sm" onClick={addDivision}>
            <MS name="add" size={14} /> 종별 추가
          </button>
        }>

        {isPrefilled && divisions.length > 0 &&
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
            <span className="wizard-prefill-chip">
              <MS name="auto_fix_high" size={12} /> 이전 회차 종별 {divisions.length}개 복제됨
            </span>
            <button type="button" className="wizard-micro-action" onClick={() => set('division_rules', [])}>
              <MS name="undo" size={12} /> 초기화
            </button>
          </div>
        }

        {divisions.length === 0 ?
        <div style={{ padding: 24, textAlign: 'center', background: 'var(--bg-alt)', borderRadius: 6, color: 'var(--ink-mute)', fontSize: 13 }}>
            <MS name="category" size={24} />
            <div style={{ marginTop: 6 }}>아직 종별이 없어요. 위에서 추가하세요.</div>
          </div> :

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {divisions.map((d, i) =>
          <div key={i} style={{
            padding: 12,
            background: 'var(--bg-elev)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            display: 'grid',
            gridTemplateColumns: 'minmax(160px, 2fr) 1fr 90px auto',
            gap: 10,
            alignItems: 'end'
          }} className="wiz-div-row">

                <div>
                  <label className="label">종별명</label>
                  <input
                className="input"
                value={d.division_name}
                onChange={(e) => updateDivision(i, 'division_name', e.target.value)}
                placeholder="예 남자 오픈" />

                </div>
                <div>
                  <label className="label">참가비</label>
                  <input
                className="input"
                type="number"
                value={d.entry_fee}
                onChange={(e) => updateDivision(i, 'entry_fee', +e.target.value)} />

                </div>
                <div>
                  <label className="label">정원</label>
                  <input
                className="input"
                type="number"
                value={d.max_teams}
                onChange={(e) => updateDivision(i, 'max_teams', +e.target.value)} />

                </div>
                <button
              type="button"
              onClick={() => removeDivision(i)}
              style={{ background: 'transparent', border: 0, color: 'var(--ink-mute)', cursor: 'pointer', padding: 4 }}
              title="삭제">

                  <MS name="delete" size={18} />
                </button>
              </div>
          )}
          </div>
        }
      </WizardCard>

      <WizardCard
        eyebrow="STEP 4 / 5 · 결제"
        title="결제 계좌"
        hint="참가비 입금을 받을 계좌입니다. 이전 회차에서 복제되지 않습니다.">

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <div>
            <label className="label">예금주명</label>
            <input
              className="input"
              value={data.account_holder || ''}
              onChange={(e) => set('account_holder', e.target.value)}
              placeholder="이름 입력" />

          </div>
          <div>
            <label className="label">은행명</label>
            <input
              className="input"
              value={data.bank_name || ''}
              onChange={(e) => set('bank_name', e.target.value)}
              placeholder="은행 선택" />

          </div>
          <div>
            <label className="label">계좌번호</label>
            <input
              className="input"
              value={data.account_number || ''}
              onChange={(e) => set('account_number', e.target.value)}
              placeholder="숫자만 입력"
              style={{ fontFamily: 'var(--ff-mono)' }} />

          </div>
        </div>
      </WizardCard>

      <WizardCard
        eyebrow="STEP 4 / 5 · 자격 룰"
        title="참가 자격"
        hint="대회 전체에 적용되는 룰. 종별마다 다른 룰은 위 종별 카드에서 설정.">

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.require_team !== false}
            onChange={(e) => set('require_team', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />

          <span>팀 단위 신청만 허용</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.require_verified}
            onChange={(e) => set('require_verified', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />

          <span>본인 인증 완료 선수만</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={data.allow_late_apply}
            onChange={(e) => set('allow_late_apply', e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />

          <span>마감 후에도 대기열 신청 허용</span>
        </label>
      </WizardCard>
    </>);

}

// =====================================================================
// ConfirmStep — Step 4 (확인 및 생성)
// =====================================================================
function ConfirmStep({ data, jumpTo, onCreate, creating }) {
  const seriesPart = data.series_id ?
  `${data.series_name} · #${data.next_edition_number}` :
  data.series_new_name ?
  `신규: ${data.series_new_name}` :
  "시리즈 없이 1회성";

  const orgPart = data.organization_name ||
  (data.org_new_name ? `신규: ${data.org_new_name}` : "단체 없이");

  const divisions = data.division_rules || [];

  return (
    <>
      <WizardCard
        eyebrow="STEP 5 / 5 · 확인"
        title="대회 생성 직전 확인"
        hint="수정할 카드의 우측 [수정 →] 버튼을 누르면 해당 step 으로 이동합니다.">

      </WizardCard>

      <SummaryCard title="단체" onEdit={() => jumpTo(0)}>
        <dl className="wiz-summary">
          <dt>단체</dt>
          <dd>{orgPart}</dd>
          {data.org_new_type && <><dt>유형</dt><dd>{data.org_new_type}</dd></>}
          {data.org_new_region && <><dt>지역</dt><dd>{data.org_new_region}</dd></>}
        </dl>
      </SummaryCard>

      <SummaryCard title="시리즈" onEdit={() => jumpTo(1)}>
        <dl className="wiz-summary">
          <dt>시리즈</dt>
          <dd>{seriesPart}</dd>
          {data.prefill_enabled !== false && data.series_id &&
          <><dt>prefill</dt><dd><span className="wizard-prefill-chip">이전 회차 데이터 사용</span></dd></>
          }
        </dl>
      </SummaryCard>

      <SummaryCard title="대회 정보" onEdit={() => jumpTo(2)}>
        <dl className="wiz-summary">
          <dt>대회명</dt><dd style={{ fontWeight: 600 }}>{data.name || '—'}</dd>
          <dt>슬러그</dt><dd style={{ fontFamily: 'var(--ff-mono)' }}>{data.slug || '—'}</dd>
          <dt>대회 일자</dt><dd>{data.date || '—'}</dd>
          <dt>신청 마감</dt><dd>{data.registration_close || '—'}</dd>
          <dt>경기 장소</dt><dd>{data.venue || '—'}</dd>
          {data.description && <><dt>소개</dt><dd>{data.description}</dd></>}
        </dl>
      </SummaryCard>

      <SummaryCard title="참가 설정" onEdit={() => jumpTo(3)}>
        <dl className="wiz-summary">
          <dt>종별</dt>
          <dd>
            {divisions.length === 0 ? '—' :
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {divisions.map((d, i) =>
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 500 }}>{d.division_name || '(이름 없음)'}</span>
                    <span style={{ color: 'var(--ink-mute)' }}>
                      ₩{d.entry_fee.toLocaleString()} · {d.max_teams}팀
                    </span>
                  </div>
              )}
              </div>
            }
          </dd>
          <dt>결제 계좌</dt>
          <dd>{data.account_holder ? `${data.account_holder} · ${data.bank_name || ''} ${data.account_number || ''}` : '—'}</dd>
          <dt>자격 룰</dt>
          <dd style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.require_team !== false && <span className="badge">팀 신청만</span>}
            {data.require_verified && <span className="badge">본인 인증 필수</span>}
            {data.allow_late_apply && <span className="badge">대기열 허용</span>}
          </dd>
        </dl>
      </SummaryCard>

      <SummaryCard title="자동 생성될 데이터" subtitle="시스템 자동값" muted>
        <dl className="wiz-summary">
          {data.series_id &&
          <><dt>회차 번호</dt><dd style={{ fontFamily: 'var(--ff-mono)' }}>#{data.next_edition_number}</dd></>
          }
          <dt>TournamentDivisionRule</dt>
          <dd style={{ fontFamily: 'var(--ff-mono)' }}>{divisions.length}건 자동 생성</dd>
          <dt>대회 슬러그</dt>
          <dd style={{ fontFamily: 'var(--ff-mono)' }}>{data.slug || '미정'}</dd>
          <dt>생성 일시</dt>
          <dd style={{ fontFamily: 'var(--ff-mono)' }}>(생성 시점)</dd>
        </dl>
      </SummaryCard>
    </>);

}

function SummaryCard({ title, subtitle, onEdit, muted, children }) {
  return (
    <WizardCard
      eyebrow={muted ? "자동" : "요약"}
      title={title}
      hint={subtitle}
      action={onEdit &&
      <button
        type="button"
        className="btn btn--sm"
        onClick={onEdit}
        style={{ background: 'transparent' }}>

            <MS name="edit" size={14} /> 수정
          </button>
      }>

      {children}
    </WizardCard>);

}

Object.assign(window, { OrgStep, SeriesStep, InfoStep, RegistrationStep, ConfirmStep });
