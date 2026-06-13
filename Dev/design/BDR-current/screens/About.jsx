/* global React */
// ============================================================
// BDR v2.30 — About (IU1 · Phase 10B · 신규 · BI1 ★★★)
// 운영: /about (304 · 박제 ❌) → 신규.
//
// Hero 슬로건 + 통계 4(cross-domain 집계 · 운영 시점 연동) + "우리가 만드는 것" 6 +
// ★ 운영진 섹션(§6 실명 ❌ · 일반 팀 라벨 보존) + 파트너 8 + FAQ 미니(→ IU3) + CTA.
// ============================================================
function About() {
  const stats = window.ABOUT_STATS;
  const values = window.ABOUT_VALUES;
  const team = window.ABOUT_TEAM;
  const partners = window.ABOUT_PARTNERS;

  return (
    <div className="page">
      <div className="ab-wrap">
        {/* Hero */}
        <header className="info-hero">
          <div className="eyebrow">소개 · ABOUT</div>
          <h1 className="info-hero__title" style={{ fontSize: 42 }}>농구를 더 가깝게</h1>
          <p className="info-hero__lead">
            MyBDR은 다음카페 시절부터 20년을 이어온 <b style={{ color: 'var(--ink)' }}>전국 농구 매칭 플랫폼</b>입니다.
            흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모아 누구나 쉽게 뛸 수 있는 환경을 만듭니다.
          </p>
        </header>

        {/* 통계 4 — cross-domain 집계 */}
        <div className="ab-stats">
          {stats.map(s => (
            <div key={s.k} className="ab-stat">
              <div className="ab-stat__v t-display">{s.v}</div>
              <div className="ab-stat__k">{s.k}</div>
              <div className="ab-stat__src">{s.src}</div>
            </div>
          ))}
        </div>
        <div className="ab-note">
          <span className="ico material-symbols-outlined">sync</span>
          전 Phase(사용자·팀·대회·코트) 집계 — 운영 시점에 실데이터로 연동됩니다.
        </div>

        {/* 우리가 만드는 것 */}
        <section className="ab-section">
          <h2 className="ab-section__h">우리가 만드는 것</h2>
          <div className="ab-make">
            {values.map(v => (
              <div key={v.t} className="ab-make-card">
                <div className="ab-make-card__icon">{v.icon}</div>
                <div className="ab-make-card__t">{v.t}</div>
                <div className="ab-make-card__d">{v.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 운영진 — ★ §6 실명 ❌ */}
        <section className="ab-section">
          <h2 className="ab-section__h">운영진</h2>
          <div className="ab-team">
            {team.map(m => (
              <div key={m.name} className="ab-team-card">
                <div className="ab-team-card__avatar">{m.name[0]}</div>
                <div className="ab-team-card__name">{m.name}</div>
                <div className="ab-team-card__role">{m.role}</div>
                <div className="ab-team-card__since">since {m.since}</div>
              </div>
            ))}
          </div>
          <div className="ab-guard">
            <span className="ico material-symbols-outlined">verified_user</span>
            운영진은 개인정보 보호를 위해 일반 팀 라벨로 표기합니다 (실명 비공개 · 사용자 결정 §6 보존).
          </div>
        </section>

        {/* 파트너 8 */}
        <div className="ab-partners-wrap">
          <h2 className="ab-section__h" style={{ marginBottom: 4 }}>함께하는 파트너</h2>
          <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 16 }}>MyBDR의 대회·활동을 지원하는 브랜드들 (예시)</div>
          <div className="ab-partners">
            {partners.map(p => <div key={p} className="ab-partner">{p}</div>)}
          </div>
        </div>

        {/* FAQ 미니 → IU3 */}
        <div className="ab-faq">
          <div>
            <h3 className="ab-faq__t">궁금한 점이 있으신가요?</h3>
            <p className="ab-faq__d">자주 묻는 질문·용어 사전·정책을 도움말에서 한 번에 확인하세요.</p>
          </div>
          <a className="btn btn--primary" href="iu3-help.html"><span className="ico material-symbols-outlined">help</span>도움말 보기</a>
        </div>

        {/* CTA */}
        <div className="ab-cta">
          <h2 className="ab-cta__h">오늘, 농구할 수 있어요</h2>
          <div className="ab-cta__d">가까운 코트에서 당신을 기다리는 사람들이 있습니다</div>
          <div className="ab-cta__btns">
            <a className="btn btn--accent btn--xl" href="au1-login-signup.html">지금 가입하기</a>
            <a className="btn btn--xl" href="p2-ua1-games.html">경기 둘러보기</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.About = About;
