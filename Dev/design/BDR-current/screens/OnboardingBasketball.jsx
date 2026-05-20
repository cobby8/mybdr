/* global React, SegmentedControl, OnboardingStepHeader, OnboardingNav */
/**
 * OnboardingBasketball — 농구정보 (2/5)
 * 포지션 / 주력 손 / 키 / 경력 (입문 ~ L8)
 */
function OnboardingBasketball({ setRoute }) {
  const { useState } = React;
  const [pos,    setPos]    = useState('G');
  const [hand,   setHand]   = useState('R');
  const [height, setHeight] = useState(178);
  const [career, setCareer] = useState('L1');
  const [years,  setYears]  = useState(2);

  const positions = [
    { value: 'G',  label: '가드',     icon: '🏀', desc: '볼 핸들링·슈팅·플레이메이킹' },
    { value: 'F',  label: '포워드',   icon: '🔥', desc: '득점·리바운드·다재다능' },
    { value: 'C',  label: '센터',     icon: '🛡', desc: '포스트업·리바운드·블락' },
    { value: 'AR', label: '올라운드', icon: '✦',  desc: '여러 포지션 소화 가능' },
  ];
  const careers = [
    { v: 'B',  label: '입문',     y: '~ 1년',  desc: '룰을 배우는 단계' },
    { v: 'L1', label: 'L1',       y: '1~2년', desc: '기본기 습득' },
    { v: 'L2', label: 'L2',       y: '2~3년', desc: '픽업 정기 참여' },
    { v: 'L3', label: 'L3',       y: '3~5년', desc: '롤 수행 가능' },
    { v: 'L4', label: 'L4',       y: '5년+',  desc: '아마추어 대회 출전' },
    { v: 'L5', label: 'L5',       y: '5년+',  desc: '리그 경험·상대 분석' },
    { v: 'L6', label: 'L6',       y: '7년+',  desc: '전국 아마 대회 입상' },
    { v: 'L7', label: 'L7',       y: '7년+',  desc: '엘리트 출신·대학 농구' },
    { v: 'L8', label: 'L8',       y: '선출',  desc: '실업·프로 출신' },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <OnboardingStepHeader
        step={2}
        onBack={() => setRoute('onboardingIdentity')}
        onSkip={() => setRoute('onboardingEnvironment')}
      />
      <div className="page" style={{ maxWidth: 640, paddingTop: 24 }}>
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.015em' }}>
            농구정보
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
            매칭 정확도를 높여요. 입력하신 정보는 마이페이지에서 수정 가능합니다.
          </p>
        </header>

        {/* 포지션 */}
        <Section label="주포지션">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8,
          }}>
            {positions.map((p) => {
              const active = pos === p.value;
              return (
                <button key={p.value} onClick={() => setPos(p.value)} style={{
                  padding: '14px 14px', textAlign: 'left',
                  background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-card)',
                  border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-card)',
                  cursor: 'pointer', minHeight: 76,
                  display: 'flex', alignItems: 'center', gap: 12,
                }}>
                  <span style={{ fontSize: 22 }}>{p.icon}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--ink)' }}>{p.label}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{p.desc}</div>
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* 주력 손 — SegmentedControl */}
        <Section label="주력 손">
          <SegmentedControl
            value={hand}
            onChange={setHand}
            options={[
              { value: 'R', label: '오른손', icon: '✋' },
              { value: 'L', label: '왼손',   icon: '🤚' },
              { value: 'A', label: '양손',   icon: '✋🤚' },
            ]}
          />
        </Section>

        {/* 키 — slider */}
        <Section label={`신장 ${height}cm`}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)', padding: '20px 18px',
          }}>
            <input type="range" min="150" max="210" step="1"
              value={height} onChange={(e) => setHeight(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)',
              marginTop: 6,
            }}>
              <span>150</span><span>180</span><span>210</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: 'var(--ink-mute)' }}>
              {height < 175 ? '가드 · 윙' : height < 190 ? '포워드 · 윙' : '빅맨 · 센터'} 평균대
            </div>
          </div>
        </Section>

        {/* 경력 */}
        <Section label="경력 / 레벨">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          }}>
            {careers.map((c) => {
              const active = career === c.v;
              return (
                <button key={c.v} onClick={() => setCareer(c.v)} style={{
                  padding: '10px 6px', minHeight: 72,
                  background: active ? 'var(--cafe-blue)' : 'var(--bg-card)',
                  color: active ? '#fff' : 'var(--ink)',
                  border: `1px solid ${active ? 'var(--cafe-blue-deep)' : 'var(--border)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                }}>
                  <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 14 }}>{c.label}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, opacity: .85 }}>{c.y}</span>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 8, padding: '8px 12px',
            background: 'var(--bg-alt)', borderRadius: 6,
            fontSize: 12, color: 'var(--ink-soft)',
          }}>
            <b style={{ color: 'var(--ink)' }}>{(careers.find(c => c.v === career) || {}).label}</b>
            {' · '}
            <span style={{ color: 'var(--ink-mute)' }}>{(careers.find(c => c.v === career) || {}).desc}</span>
          </div>
        </Section>

        {/* 농구 시작 연차 */}
        <Section label={`농구 시작 ${years}년차`}>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)', padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <input type="range" min="0" max="30" step="1"
              value={years} onChange={(e) => setYears(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--accent)' }} />
            <span style={{
              fontFamily: 'var(--ff-mono)', fontWeight: 800, fontSize: 16,
              color: 'var(--accent)', minWidth: 56, textAlign: 'right',
            }}>{years === 0 ? '입문' : `${years}년`}</span>
          </div>
        </Section>

        <OnboardingNav
          onPrev={() => setRoute('onboardingIdentity')}
          onNext={() => setRoute('onboardingEnvironment')}
          nextLabel="다음 (활동환경)"
        />
      </div>
    </div>
  );
}

function Section({ label, children }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <div className="label" style={{ marginBottom: 8 }}>{label}</div>
      {children}
    </section>
  );
}

window.OnboardingBasketball = OnboardingBasketball;
