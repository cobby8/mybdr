/* global React, OnboardingStepHeader */
/**
 * OnboardingSetup — 가입 완료 / 다음 단계 안내 (5/5)
 * 진행률 5/5 + 마이페이지 CTA + 추천 다음 액션
 */
function OnboardingSetup({ setRoute }) {
  const { useState, useEffect } = React;
  const [showCelebrate, setShowCelebrate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShowCelebrate(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <OnboardingStepHeader
        step={5}
        onBack={() => setRoute('onboardingPreferences')}
        hideSkip
      />
      <div className="page" style={{ maxWidth: 640, paddingTop: 16 }}>
        {/* 메인 카드 */}
        <div style={{
          padding: '40px 24px 32px',
          background: 'var(--bg-card)',
          border: '1px solid var(--ok)',
          borderLeft: '3px solid var(--ok)',
          borderRadius: 'var(--radius-card)',
          textAlign: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {showCelebrate && <ConfettiBg />}
          <div style={{
            position: 'relative', zIndex: 1,
            margin: '0 auto 14px', width: 72, height: 72, borderRadius: '50%',
            background: 'color-mix(in oklab, var(--ok) 18%, transparent)',
            color: 'var(--ok)', display: 'grid', placeItems: 'center',
            fontSize: 36, fontWeight: 900,
            animation: showCelebrate ? 'check-pop .35s cubic-bezier(.2,1.4,.4,1) both' : 'none',
          }}>✓</div>
          <h1 style={{ position: 'relative', zIndex: 1, margin: 0, fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 26, letterSpacing: '-0.015em' }}>
            가입 완료!
          </h1>
          <p style={{ position: 'relative', zIndex: 1, margin: '8px 0 0', fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.55 }}>
            취향에 맞는 매치·코트·팀이 이미 준비되어 있어요.
          </p>

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10, margin: '24px 0 8px',
            padding: '16px 0',
            borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
          }}>
            {[
              { v: 24, l: '추천 매치', c: 'var(--accent)' },
              { v: 8,  l: '내 지역 팀', c: 'var(--cafe-blue)' },
              { v: 12, l: '근처 코트', c: 'var(--ok)' },
            ].map((s, i) => (
              <div key={i}>
                <div style={{ fontFamily: 'var(--ff-display)', fontSize: 26, fontWeight: 900, color: s.c }}>{s.v}</div>
                <div style={{ fontSize: 11, color: 'var(--ink-dim)' }}>{s.l}</div>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes check-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
          `}</style>
        </div>

        {/* CTA */}
        <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
          <button className="btn btn--primary" onClick={() => setRoute('profile')}
            style={{ minHeight: 52, fontSize: 15, fontWeight: 700 }}>
            마이페이지로 →
          </button>
          <button className="btn" onClick={() => setRoute('games')}
            style={{ minHeight: 48 }}>
            매치 둘러보기
          </button>
        </div>

        {/* 추천 다음 액션 */}
        <section style={{ marginTop: 28 }}>
          <div className="label">추천 다음 단계</div>
          <div style={{ display: 'grid', gap: 8 }}>
            <NextStep
              icon="🏀" title="첫 매치 신청해보기"
              desc="강남 · 토 저녁 · L2 매치 (추천)"
              cta="보기"
              onClick={() => setRoute('games')} />
            <NextStep
              icon="👥" title="내 지역 팀 찾기"
              desc="강남구 활동 팀 8개"
              cta="둘러보기"
              onClick={() => setRoute('orgs')} />
            <NextStep
              icon="🔔" title="알림 설정"
              desc="매치·예약·팀 알림 받기"
              cta="설정"
              onClick={() => setRoute('settings')} />
            <NextStep
              icon="📷" title="프로필 사진 등록"
              desc="매칭 신뢰도 향상 (+12%)"
              cta="추가"
              onClick={() => setRoute('editProfile')} />
          </div>
        </section>

        {/* 진행 상태 요약 */}
        <section style={{ marginTop: 24, padding: 14, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>
            가입 정보 요약
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12 }}>
            {[
              { l: '본인인증',  v: '✓ 완료',   c: 'var(--ok)' },
              { l: '농구정보',  v: 'PG · L2', c: 'var(--ink)' },
              { l: '활동 지역', v: '강남구',   c: 'var(--ink)' },
              { l: '선호',     v: '혼성·균형', c: 'var(--ink)' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ color: 'var(--ink-mute)' }}>{r.l}</span>
                <span style={{ fontWeight: 600, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
          <button onClick={() => setRoute('editProfile')}
            style={{
              marginTop: 4, background: 'transparent', border: 0,
              color: 'var(--cafe-blue-deep)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', padding: '6px 0',
            }}>
            정보 수정 →
          </button>
        </section>
      </div>
    </div>
  );
}

function NextStep({ icon, title, desc, cta, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 14px', minHeight: 64,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-card)', cursor: 'pointer', textAlign: 'left',
    }}>
      <span style={{
        flex: '0 0 auto', width: 40, height: 40, borderRadius: 8,
        background: 'var(--bg-alt)', display: 'grid', placeItems: 'center',
        fontSize: 20,
      }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--ink)' }}>{title}</div>
        <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{desc}</div>
      </span>
      <span style={{
        padding: '6px 10px',
        background: 'var(--cafe-blue-soft)', color: 'var(--cafe-blue-deep)',
        borderRadius: 4, fontSize: 11.5, fontWeight: 700,
      }}>{cta} →</span>
    </button>
  );
}

function ConfettiBg() {
  return (
    <div aria-hidden="true" style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage:
        'radial-gradient(circle at 12% 22%, var(--accent) 2px, transparent 2.5px), ' +
        'radial-gradient(circle at 84% 32%, var(--cafe-blue) 2px, transparent 2.5px), ' +
        'radial-gradient(circle at 28% 78%, var(--ok) 2px, transparent 2.5px), ' +
        'radial-gradient(circle at 68% 84%, var(--accent) 2px, transparent 2.5px), ' +
        'radial-gradient(circle at 52% 12%, var(--cafe-blue) 2px, transparent 2.5px)',
      opacity: .35,
    }} />
  );
}

window.OnboardingSetup = OnboardingSetup;
