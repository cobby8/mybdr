/* global React, PlaceAutocomplete, OnboardingStepHeader, OnboardingNav */
/**
 * OnboardingEnvironment — 활동환경 (3/5)
 * 활동 지역 / 선호 시간대 / 빈도 (월 N회)
 */
function OnboardingEnvironment({ setRoute }) {
  const { useState } = React;
  const [places, setPlaces] = useState([
    { id: 'gangnam-gu', name: '강남구', region: '서울특별시', kind: '구' },
  ]);
  const [days,   setDays]   = useState(['Tue', 'Thu', 'Sat']);
  const [slots,  setSlots]  = useState(['evening']);
  const [count,  setCount]  = useState(8);
  const [indoor, setIndoor] = useState('any'); // any / indoor / outdoor

  const dayList = [
    { v: 'Mon', l: '월' }, { v: 'Tue', l: '화' }, { v: 'Wed', l: '수' },
    { v: 'Thu', l: '목' }, { v: 'Fri', l: '금' }, { v: 'Sat', l: '토' }, { v: 'Sun', l: '일' },
  ];
  const slotList = [
    { v: 'morning',   l: '오전',   s: '06–11' },
    { v: 'noon',      l: '낮',     s: '11–14' },
    { v: 'afternoon', l: '오후',   s: '14–18' },
    { v: 'evening',   l: '저녁',   s: '18–22' },
    { v: 'late',      l: '심야',   s: '22~' },
  ];

  const toggle = (arr, set, v) => arr.includes(v) ? set(arr.filter(x => x !== v)) : set([...arr, v]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <OnboardingStepHeader
        step={3}
        onBack={() => setRoute('onboardingBasketball')}
        onSkip={() => setRoute('onboardingPreferences')}
      />
      <div className="page" style={{ maxWidth: 640, paddingTop: 24 }}>
        <header style={{ marginBottom: 22 }}>
          <h1 style={{ margin: 0, fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.015em' }}>
            활동환경
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
            가까운 코트와 비슷한 시간대 매치를 우선 추천해드려요.
          </p>
        </header>

        {/* 활동 지역 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">활동 지역 (최대 3개)</div>
          <PlaceAutocomplete value={places} onChange={setPlaces} max={3}
            placeholder="동/구/지역명 입력 (예 강남구)" />
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--ink-dim)' }}>
            ⓘ 첫 번째 지역이 홈 그라운드로 설정됩니다
          </div>
        </section>

        {/* 요일 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">선호 요일 ({days.length}/7)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {dayList.map((d) => {
              const active = days.includes(d.v);
              const isWeekend = d.v === 'Sat' || d.v === 'Sun';
              return (
                <button key={d.v} onClick={() => toggle(days, setDays, d.v)} style={{
                  minHeight: 48, padding: '8px 0',
                  background: active ? 'var(--cafe-blue)' : 'var(--bg-card)',
                  color: active ? '#fff' : (isWeekend ? 'var(--accent)' : 'var(--ink)'),
                  border: `1px solid ${active ? 'var(--cafe-blue-deep)' : 'var(--border)'}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontWeight: 700, fontSize: 14,
                }}>{d.l}</button>
              );
            })}
          </div>
        </section>

        {/* 시간대 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">선호 시간대 ({slots.length}/{slotList.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {slotList.map((s) => {
              const active = slots.includes(s.v);
              return (
                <button key={s.v} onClick={() => toggle(slots, setSlots, s.v)} style={{
                  padding: '10px 14px', minHeight: 44,
                  background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-card)',
                  color: active ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                  border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border)'}`,
                  borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap',
                  display: 'inline-flex', alignItems: 'baseline', gap: 6,
                  fontWeight: active ? 700 : 600,
                }}>
                  <span style={{ fontSize: 13.5 }}>{s.l}</span>
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: active ? 'var(--cafe-blue)' : 'var(--ink-dim)' }}>{s.s}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 실내/실외 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">코트 유형</div>
          <SegmentedControl value={indoor} onChange={setIndoor}
            options={[
              { value: 'any',     label: '상관없음' },
              { value: 'indoor',  label: '실내', icon: '🏟' },
              { value: 'outdoor', label: '실외', icon: '☀' },
            ]}/>
        </section>

        {/* 빈도 */}
        <section style={{ marginBottom: 22 }}>
          <div className="label">월 빈도 — 한 달에 <b style={{ color: 'var(--accent)', fontFamily: 'var(--ff-mono)' }}>{count}회</b></div>
          <div style={{
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card)', padding: '20px 18px',
          }}>
            <input type="range" min="1" max="30" step="1"
              value={count} onChange={(e) => setCount(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)',
              marginTop: 6,
            }}>
              <span>1회</span><span>15회</span><span>30회+</span>
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--ink-mute)' }}>
              {count <= 4 ? '가벼운 참여 — 주말 위주 추천'
                : count <= 12 ? '주 1~3회 — 정기 픽업·팀 추천'
                : '주 3회+ — 리그·정기 매치 추천'}
            </div>
          </div>
        </section>

        <OnboardingNav
          onPrev={() => setRoute('onboardingBasketball')}
          onNext={() => setRoute('onboardingPreferences')}
          nextDisabled={places.length === 0 || days.length === 0 || slots.length === 0}
          nextLabel="다음 (선호도)"
        />
      </div>
    </div>
  );
}

window.OnboardingEnvironment = OnboardingEnvironment;
