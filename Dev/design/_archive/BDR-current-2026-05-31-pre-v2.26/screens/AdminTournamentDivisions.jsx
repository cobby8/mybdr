/* global React */
// ============================================================
// AdminTournamentDivisions.jsx — C2 (Phase 1A 다중 종별 발견성)
//   /tournament-admin/tournaments/[id]/divisions
//
// 진입: 셋업 hub STEP 3 카드 / sidebar "종별"
// 복귀: AdminTournamentSetupHub
// 에러: 종별 0건 = empty state + 5 예시 / 권한 없음 = redirect
//
// S4 사각지대 해소: 종별 추가 hero CTA + 5 예시 + 멀티 종별 사용 안내.
// ============================================================

(function () {
  const TN = { name: 'BDR 서머 오픈 #4' };

  const DIVS = [
    {
      id: 'open', name: '오픈', format: '5x5 토너먼트',
      teams_now: 12, teams_max: 16, matches: 14,
      settings: ['남자 19+', 'FIBA 룰', '40분 (10분x4)'],
    },
    {
      id: 'amateur', name: '아마추어', format: '5x5 그룹+토너먼트',
      teams_now: 8, teams_max: 12, matches: 8,
      settings: ['남자 19+ · 등록선수 ❌', '4팀 x 2조 → 8강'],
    },
    {
      id: 'u18', name: 'U18', format: '5x5 토너먼트',
      teams_now: 6, teams_max: 8, matches: 0,
      settings: ['혼성 U18', '30분 (10분x3)', 'div TAM: 박지훈'],
    },
    {
      id: 'u14', name: 'U14', format: '3x3 라운드 로빈',
      teams_now: 4, teams_max: 6, matches: 0,
      settings: ['혼성 U14', '하프코트', '10분 단판'],
    },
  ];

  const EXAMPLES = [
    '3x3 男 오픈',
    '3x3 女 오픈',
    '5x5 남자 19+',
    '5x5 혼성 U16',
    '5x5 시니어 35+',
  ];

  window.AdminTournamentDivisions = function AdminTournamentDivisions() {
    const total_teams = DIVS.reduce((s, d) => s + d.teams_now, 0);
    const total_matches = DIVS.reduce((s, d) => s + d.matches, 0);
    const isEmpty = false; // demo flag (실제로는 DIVS.length === 0 분기)

    return (
      <window.AdminShell active="divs" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '종별']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">C2 · Phase 1A · 다중 종별 발견성</div>
                  <h1 className="admin-page__title">종별 운영 · {TN.name}</h1>
                  <p className="admin-page__sub">
                    {DIVS.length} 종별 · 총 {total_teams} 팀 신청 · {total_matches} 경기 박제됨
                  </p>
                </div>
              </div>
            </header>

            {/* Hero CTA — 발견성 강화 */}
            <div className="adv-hero">
              <div>
                <h2 className="adv-hero__h">하나의 대회에 여러 종별을 같이 운영할 수 있어요</h2>
                <p className="adv-hero__sub">
                  예: 강남구협회장배 = U10 + U12 + U14 + U16 동시 운영. 종별별로 다른 format · 다른 TAM · 다른 매치 일정.
                </p>
                <div className="adv-hero__examples">
                  {EXAMPLES.map((e, i) => <span key={i} className="adv-hero__example">{e}</span>)}
                </div>
              </div>
              <button className="adv-hero__cta">
                <span className="ico material-symbols-outlined">add_circle</span>
                종별 추가
              </button>
            </div>

            {isEmpty ? (
              <div className="adv-empty">
                <span className="adv-empty__icon ico material-symbols-outlined">category</span>
                <div className="adv-empty__h">첫 종별을 추가해보세요</div>
                <div className="adv-empty__sub">
                  종별 = 대회 안의 별도 운영 단위. 위의 5 예시 중 하나로 시작하거나 직접 박제할 수 있어요.
                </div>
                <button className="btn btn--accent">
                  <span className="ico material-symbols-outlined">add</span>
                  종별 추가
                </button>
              </div>
            ) : (
              <div className="adv-grid">
                {DIVS.map(d => (
                  <div key={d.id} className="adv-card">
                    <div className="adv-card__head">
                      <h3 className="adv-card__name">
                        <span style={{
                          fontFamily: 'var(--ff-mono)', fontSize: 10,
                          color: 'var(--cafe-blue-deep)', background: 'var(--cafe-blue-soft)',
                          padding: '2px 7px', borderRadius: 'var(--r-xs)',
                          letterSpacing: '0.04em',
                        }}>{d.id.toUpperCase()}</span>
                        {d.name}
                      </h3>
                      <span className="adv-card__chip">{d.format}</span>
                    </div>

                    <div className="adv-card__meta">
                      <div className="adv-card__metric">
                        <span className="adv-card__metric-v">{d.teams_now}<small style={{ color: 'var(--ink-mute)', fontSize: 13, fontWeight: 600 }}>/{d.teams_max}</small></span>
                        <span className="adv-card__metric-l">팀</span>
                      </div>
                      <div className="adv-card__metric">
                        <span className="adv-card__metric-v">{d.matches}</span>
                        <span className="adv-card__metric-l">경기</span>
                      </div>
                      <div style={{ flex: 1 }} />
                      <div className="adv-card__metric" style={{ alignItems: 'flex-end' }}>
                        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                          {Math.round(d.teams_now / d.teams_max * 100)}% 정원
                        </span>
                      </div>
                    </div>

                    <div className="adv-card__settings">
                      {d.settings.map((s, i) => <span key={i} className="adv-card__setting">{s}</span>)}
                    </div>

                    <div className="adv-card__actions">
                      <button className="btn btn--sm"><span className="ico material-symbols-outlined">edit</span>format</button>
                      <button className="btn btn--sm"><span className="ico material-symbols-outlined">groups</span>참가팀</button>
                      <button className="btn btn--sm"><span className="ico material-symbols-outlined">account_tree</span>대진</button>
                      <div style={{ flex: 1 }} />
                      <button className="btn btn--sm" style={{ color: 'var(--err)' }}>
                        <span className="ico material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
