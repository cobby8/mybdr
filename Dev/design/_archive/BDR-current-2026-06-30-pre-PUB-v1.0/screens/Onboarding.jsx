/* global React */
// ============================================================
// BDR v2.27 — Onboarding (AU2 · Phase 7 · 신규 통합 wizard · BA2 ★★★★)
// 운영: /onboarding/{basketball,environment,identity,preferences,setup} 5 page
//   → 통합 5-step wizard (Phase 1B UA3 + Phase 4 OU3 stepper 답습).
//
// step1 농구 · step2 환경 · step3 본인인증(IdentityVerifyButton Phase 12-5) ·
// step4 선호(8종 chip) · step5 완료 summary. 이전/다음/건너뛰기 일관.
// ============================================================
function Onboarding() {
  const [step, setStep] = React.useState(0);
  const [verified, setVerified] = React.useState(false);
  const [d, setD] = React.useState({
    skill: 'intermediate', hand: 'right', position: 'PG',
    city: '서울', regions: ['송파구', '강남구'],
    prefs: {},
  });
  const set = (k, v) => setD(s => ({ ...s, [k]: v }));
  const steps = window.ONB_STEPS;
  const next = () => setStep(s => Math.min(s + 1, 4));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const setPref = (key, v) => setD(s => ({ ...s, prefs: { ...s.prefs, [key]: v } }));

  return (
    <div className="au-page">
      <div className="au-wrap au-wrap--wide">
        <window.AuthBrand slogan="시작 전, 나에게 맞는 매칭을 위해 알려주세요" />

        <div className="au-card">
          <div className="au-card__body">
            <window.AuStepper steps={steps} current={step} />

            {/* STEP 1 — 농구 정보 */}
            {step === 0 && (
              <div>
                <div className="au-step-head">
                  <div className="au-step-eyebrow">STEP 1 / 5</div>
                  <h1 className="au-step-title">농구 정보</h1>
                  <p className="au-step-desc">포지션과 실력을 알려주시면 매칭 정확도가 올라갑니다.</p>
                </div>
                <div className="au-group">
                  <div className="au-group__lbl"><span className="ico material-symbols-outlined">trending_up</span>실력 수준</div>
                  <window.ChipGroup options={window.ONB_SKILL} value={d.skill} onChange={v => set('skill', v)} />
                </div>
                <div className="au-group">
                  <div className="au-group__lbl"><span className="ico material-symbols-outlined">back_hand</span>주 사용 손</div>
                  <window.ChipGroup options={window.ONB_HAND} value={d.hand} onChange={v => set('hand', v)} />
                </div>
                <div className="au-group">
                  <div className="au-group__lbl"><span className="ico material-symbols-outlined">directions_run</span>포지션</div>
                  <window.ChipGroup options={window.ONB_POSITION} value={d.position} onChange={v => set('position', v)} />
                </div>
              </div>
            )}

            {/* STEP 2 — 활동 환경 */}
            {step === 1 && (
              <div>
                <div className="au-step-head">
                  <div className="au-step-eyebrow">STEP 2 / 5</div>
                  <h1 className="au-step-title">활동 환경</h1>
                  <p className="au-step-desc">주로 활동하는 지역을 선택하세요. 가까운 코트·경기를 추천해 드려요.</p>
                </div>
                <div className="au-group">
                  <label className="au-label">활동 도시</label>
                  <select className="au-select" value={d.city} onChange={e => set('city', e.target.value)}>
                    {window.ONB_CITY.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="au-group">
                  <div className="au-group__lbl"><span className="ico material-symbols-outlined">location_on</span>활동 지역 (다중 선택)</div>
                  <window.ChipGroup options={window.ONB_DISTRICT} value={d.regions} onChange={v => set('regions', v)} multi />
                </div>
              </div>
            )}

            {/* STEP 3 — 본인 인증 */}
            {step === 2 && (
              <div>
                <div className="au-step-head">
                  <div className="au-step-eyebrow">STEP 3 / 5</div>
                  <h1 className="au-step-title">본인 인증</h1>
                  <p className="au-step-desc">대회 참가와 안전한 매칭을 위해 본인 인증을 권장합니다. 건너뛸 수 있어요.</p>
                </div>
                <window.IdentityVerifyButton verified={verified} onVerify={() => setVerified(true)} />
                {verified && (
                  <div className="au-verified" style={{ marginTop: 14 }}>
                    <div className="au-verified__bar"><span className="ico material-symbols-outlined">verified</span><span className="au-verified__bar-t">인증 완료</span></div>
                    <div className="au-verified__rows">
                      <div className="au-vrow"><span className="au-vrow__l">실명</span><span className="au-vrow__v">{window.VERIFIED.name}</span></div>
                      <div className="au-vrow"><span className="au-vrow__l">휴대폰</span><span className="au-vrow__v">{window.VERIFIED.phone}</span></div>
                    </div>
                  </div>
                )}
                <p className="au-hint" style={{ marginTop: 12 }}>본 인증 정보는 PU2 프로필 편집 · GU3 설정의 본인인증과 동일하게 연동됩니다.</p>
              </div>
            )}

            {/* STEP 4 — 선호 */}
            {step === 3 && (
              <div>
                <div className="au-step-head">
                  <div className="au-step-eyebrow">STEP 4 / 5 (선택)</div>
                  <h1 className="au-step-title">선호 설정</h1>
                  <p className="au-step-desc">관심 있는 종별·요일·시간을 선택하면 더 정확하게 추천해 드려요. 모두 선택 사항입니다.</p>
                </div>
                {window.PREFERRED.slice(0, 4).map(g => (
                  <div className="au-group" key={g.key}>
                    <div className="au-group__lbl"><span className="ico material-symbols-outlined">{g.ico}</span>{g.label}</div>
                    <window.ChipGroup options={g.options} value={d.prefs[g.key] || g.selected} onChange={v => setPref(g.key, v)} multi />
                  </div>
                ))}
              </div>
            )}

            {/* STEP 5 — 완료 */}
            {step === 4 && (
              <div>
                <div className="au-step-head">
                  <div className="au-step-eyebrow">STEP 5 / 5</div>
                  <h1 className="au-step-title">입력 확인</h1>
                  <p className="au-step-desc">아래 정보로 시작합니다. 모든 항목은 나중에 프로필에서 변경할 수 있어요.</p>
                </div>
                <div className="au-summary">
                  <div className="au-summary__row"><span className="au-summary__l">실력 · 포지션</span><span className="au-summary__v">{window.ONB_SKILL.find(x => x.v === d.skill).l} · {d.position} · {window.ONB_HAND.find(x => x.v === d.hand).l}</span></div>
                  <div className="au-summary__row"><span className="au-summary__l">활동 지역</span><span className="au-summary__v">{d.city} {d.regions.join(', ')}</span></div>
                  <div className="au-summary__row"><span className="au-summary__l">본인 인증</span><span className="au-summary__v">{verified ? '완료 ✓' : '건너뜀'}</span></div>
                </div>
              </div>
            )}

            {/* wizard nav */}
            <div className="au-wnav">
              {step > 0 && <button className="au-btn au-btn--ghost" onClick={prev}><span className="ico material-symbols-outlined">arrow_back</span>이전</button>}
              {step < 4
                ? <button className="au-btn au-btn--accent" onClick={next}>다음<span className="ico material-symbols-outlined">arrow_forward</span></button>
                : <a className="au-btn au-btn--accent" href="p2-uc2-home.html"><span className="ico material-symbols-outlined">check</span>완료하고 시작하기</a>}
            </div>
            {(step === 2 || step === 3) && (
              <div className="au-wnav__skip"><button onClick={next}>나중에 입력하기</button></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
