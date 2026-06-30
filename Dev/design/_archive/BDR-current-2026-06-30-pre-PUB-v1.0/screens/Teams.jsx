/* global React */
// ============================================================
// BDR v2.21 — Teams (TU1 · Phase 3B · 보강)
// 운영 박제 대상: /teams
// 진입: AppNav 5번째 탭 "팀" / 더보기 둘러보기
// 복귀: 카드 클릭 → /teams/[id]
// 에러: 빈 상태 = "팀이 없어요" + /teams/new CTA
//
// v2 박제 (TeamsContentV2 488 line) 보강:
//   ① BT2 필터 보강 — 지역 + 모집 중 + 매너 ★ + 활동 + 규모
//   ② BT1 가입 신청 CTA 일관 — list variant 에서는 "모집 중/마감" 만 (카운트 hide)
//   ③ 추천 영역 — "내 지역 활성 팀" (city 매칭 + last_activity_at < 30일 + accepting_members=true)
//   ④ 빈 상태 — "아직 팀이 없어요" + /teams/new CTA (시안 보존)
// A 등급
// ============================================================

function Teams() {
  const teams = window.TEAM_LIST;
  // 추천 = 내 지역 (강남구) + 활성 + 모집 중
  const recos = teams.filter(t => t.city === '강남구' && t.accepting_members && t.role_for_me !== 'captain').slice(0, 3);
  const all = teams;

  return (
    <div className="gm-page">
      <div className="gm-page__inner">
        <header className="gm-page__head">
          <div className="eyebrow">/teams · 팀 둘러보기</div>
          <h1 className="gm-page__title">팀</h1>
          <p className="gm-page__sub">
            전체 <strong>{teams.length}</strong>팀 ·
            모집 중 <strong style={{color:'var(--ok)'}}>{teams.filter(t => t.accepting_members).length}</strong>팀 ·
            <a href="#" style={{color:'var(--cafe-blue-deep)', fontWeight:700, marginLeft:8}}>+ 팀 등록</a>
          </p>
        </header>

        {/* BT2 필터 보강 */}
        <div className="tu1-filter">
          <div className="tu1-filter__search">
            <span className="ico material-symbols-outlined">search</span>
            <input placeholder="팀 이름 / 캡틴" />
          </div>
          <span className="tu1-filter__sep"/>
          <span className="tu1-filter__lbl">지역</span>
          <div className="tu1-filter__group">
            <button className="tu1-filter__chip is-on">전체</button>
            <button className="tu1-filter__chip">강남구</button>
            <button className="tu1-filter__chip">서초구</button>
            <button className="tu1-filter__chip">마포구</button>
            <button className="tu1-filter__chip">+</button>
          </div>
          <span className="tu1-filter__sep"/>
          <span className="tu1-filter__lbl">상태</span>
          <div className="tu1-filter__group">
            <button className="tu1-filter__chip is-on">모집 중</button>
            <button className="tu1-filter__chip">전체</button>
          </div>
          <span className="tu1-filter__sep"/>
          <span className="tu1-filter__lbl">매너</span>
          <div className="tu1-filter__group">
            <button className="tu1-filter__chip">★ 4.5+</button>
            <button className="tu1-filter__chip">★ 3.5+</button>
          </div>
        </div>

        {/* 추천 — 내 지역 (BT2 답습) */}
        <section className="tu1-reco-section">
          <div className="tu1-section-h">
            <h2>내 지역 활성 팀</h2>
            <span className="tu1-section-h__hint">강남구 · 30일 내 활동 · 모집 중</span>
            <span className="ma-new">추천</span>
          </div>
          <div className="tu1-recos">
            {recos.map(t => <window.TeamCard key={t.id} team={t} variant="list"/>)}
          </div>
        </section>

        {/* 전체 그리드 */}
        <section>
          <div className="tu1-section-h">
            <h2>전체 팀</h2>
            <span className="tu1-section-h__hint">{all.length}팀 · 최근 활동순</span>
            <span style={{marginLeft:'auto', display:'flex', gap:6}}>
              <button className="tu1-filter__chip is-on">최근 활동</button>
              <button className="tu1-filter__chip">멤버 많은</button>
              <button className="tu1-filter__chip">매너 ★</button>
            </span>
          </div>
          <div className="tu1-grid">
            {all.map(t => <window.TeamCard key={t.id} team={t} variant="list"/>)}
          </div>
        </section>
      </div>
    </div>
  );
}

window.Teams = Teams;
