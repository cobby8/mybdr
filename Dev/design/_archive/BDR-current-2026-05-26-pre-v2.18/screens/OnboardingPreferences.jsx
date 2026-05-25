/* global React, SegmentedControl, OnboardingStepHeader, OnboardingNav */
/**
 * OnboardingPreferences — 매칭 선호도 + 점수 시스템 인지 (4/5)
 * 성별 / 연령대 / 레벨 분포 / 운영 점수 시스템 안내 (PR4)
 */
function OnboardingPreferences({ setRoute }) {
  const { useState } = React;
  const [genderMix, setGenderMix] = useState('any');     // any / male / female / mixed
  const [ageRange,  setAgeRange]  = useState(['20s', '30s']);
  const [levelMix,  setLevelMix]  = useState('similar'); // similar / open / strong
  const [intensity, setIntensity] = useState('balanced');// fun / balanced / serious
  const [scoreOptIn, setScoreOptIn] = useState(true);

  const ages = [
    { v: 'teens', l: '10대' },
    { v: '20s',   l: '20대' },
    { v: '30s',   l: '30대' },
    { v: '40s',   l: '40대' },
    { v: '50s+',  l: '50대+' },
  ];
  const toggleAge = (v) => setAgeRange(ageRange.includes(v) ? ageRange.filter(x => x !== v) : [...ageRange, v]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <OnboardingStepHeader
        step={4}
        onBack={() => setRoute('onboardingEnvironment')}
        onSkip={() => setRoute('onboardingSetup')}
      />
      <div className="page" style={{ maxWidth: 640, paddingTop: 24 }}>
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.015em' }}>
            매칭 선호도
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
            누구와 어떤 분위기로 뛰고 싶은지 — 매칭 알고리즘이 우선 고려해요.
          </p>
        </header>

        {/* 성별 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">성별 매칭</div>
          <SegmentedControl value={genderMix} onChange={setGenderMix}
            options={[
              { value: 'any',    label: '상관없음' },
              { value: 'mixed',  label: '혼성 환영' },
              { value: 'same',   label: '동성만' },
            ]}/>
        </section>

        {/* 연령대 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">연령대 ({ageRange.length}/{ages.length})</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6 }}>
            {ages.map((a) => {
              const active = ageRange.includes(a.v);
              return (
                <button key={a.v} onClick={() => toggleAge(a.v)} style={{
                  minHeight: 48, padding: '8px 0',
                  background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-card)',
                  color: active ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                  border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontWeight: active ? 700 : 600, fontSize: 13.5,
                }}>{a.l}</button>
              );
            })}
          </div>
        </section>

        {/* 레벨 분포 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">레벨 분포</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {[
              { v: 'similar', t: '비슷한 레벨만',     d: '내 레벨 ±1 단계 — 균형 잡힌 경기' },
              { v: 'open',    t: '레벨 무관',         d: '실력 차이 있어도 OK — 즐기는 분위기' },
              { v: 'strong',  t: '나보다 위주로',     d: '도전적 매치 — 실력 향상 목적' },
            ].map((o) => {
              const active = levelMix === o.v;
              return (
                <button key={o.v} onClick={() => setLevelMix(o.v)} style={{
                  padding: '14px 16px', textAlign: 'left',
                  background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-card)',
                  border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-card)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 12, minHeight: 64,
                }}>
                  <span style={{
                    width: 20, height: 20, borderRadius: '50%',
                    border: `2px solid ${active ? 'var(--cafe-blue)' : 'var(--border-strong)'}`,
                    background: active ? 'var(--cafe-blue)' : 'transparent',
                    boxShadow: active ? 'inset 0 0 0 3px var(--bg-card)' : 'none',
                    flex: '0 0 auto',
                  }}/>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{o.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{o.d}</div>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 강도 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">분위기 / 강도</div>
          <SegmentedControl value={intensity} onChange={setIntensity}
            options={[
              { value: 'fun',      label: '즐겜' },
              { value: 'balanced', label: '균형' },
              { value: 'serious',  label: '진지' },
            ]}/>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-mute)' }}>
            {intensity === 'fun'      && '재미·운동 위주 · 점수 가벼움'
              || intensity === 'balanced' && '경기는 진지하되 분위기는 화기애애'
              || '승부 집중 · 페어플레이 강조'}
          </div>
        </section>

        {/* 점수 시스템 (PR4) */}
        <section style={{ marginBottom: 22 }}>
          <div className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>BDR 점수 시스템</span>
            <span className="badge" style={{ background: 'var(--accent)', color: '#fff', borderColor: 'transparent', fontSize: 9 }}>PR4</span>
          </div>
          <div style={{
            padding: 16, background: 'var(--bg-card)',
            border: '1px solid var(--cafe-blue-hair)',
            borderLeft: '3px solid var(--cafe-blue)',
            borderRadius: 'var(--radius-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'var(--cafe-blue-soft)', color: 'var(--cafe-blue-deep)',
                display: 'grid', placeItems: 'center',
                fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 14,
              }}>BDR</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>매너·실력 종합 점수</div>
                <div style={{ fontSize: 12, color: 'var(--ink-mute)' }}>참여·시간 약속·매너 평가로 산정 (운영 검증)</div>
              </div>
            </div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8, marginBottom: 12,
            }}>
              {[
                { l: '신뢰', v: '85%', c: 'var(--ok)' },
                { l: '매너', v: 'A',   c: 'var(--cafe-blue)' },
                { l: '레벨', v: 'L2',  c: 'var(--accent)' },
              ].map((m, i) => (
                <div key={i} style={{
                  padding: 10, textAlign: 'center',
                  background: 'var(--bg-alt)', borderRadius: 6,
                }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 18, color: m.c }}>{m.v}</div>
                  <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', marginTop: 2 }}>{m.l}</div>
                </div>
              ))}
            </div>
            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
              padding: '10px 12px', background: 'var(--bg-alt)', borderRadius: 6,
            }}>
              <input type="checkbox" checked={scoreOptIn}
                onChange={(e) => setScoreOptIn(e.target.checked)}
                style={{ marginTop: 2, accentColor: 'var(--accent)', width: 18, height: 18 }} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--ink)' }}>점수 시스템 참여</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>
                  매치 후 상호 평가에 참여하고 점수 변동을 받습니다. 언제든 설정에서 끌 수 있어요.
                </div>
              </span>
            </label>
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--ink-dim)' }}>
              ⓘ 본 기능은 운영 검증 단계 — 정식 출시 전 점수는 베타 표시 됩니다
            </div>
          </div>
        </section>

        <OnboardingNav
          onPrev={() => setRoute('onboardingEnvironment')}
          onNext={() => setRoute('onboardingSetup')}
          nextDisabled={ageRange.length === 0}
          nextLabel="다음 (완료)"
        />
      </div>
    </div>
  );
}

window.OnboardingPreferences = OnboardingPreferences;
