/* global React */
// ============================================================
// AdminTournamentBracket.jsx — UD2 (보강)
//   /tournament-admin/tournaments/[id]/bracket
//
//   B5 publish 알림 체크박스 + 버전 히스토리 view
//   기존 시안 (대진표 생성 / DualGroup 에디터) 보존
// ============================================================

(function () {
  const { useState } = React;

  const TN = { name: 'BDR 서머 오픈 #4', team_count: 32 };

  const VERSIONS = [
    { v: 'v3', time: '2026-05-25 14:32', author: '박수빈', current: true,  msg: '1번 시드 변경 (강남BC → 서초파이브). 6/22 결승 추첨 결과 반영.', diff: '+1 -1' },
    { v: 'v2', time: '2026-05-23 09:15', author: '박수빈', current: false, msg: '아마추어 디비전 8강 매치업 재추첨', diff: '+8 -8' },
    { v: 'v1', time: '2026-05-20 18:40', author: '김운영', current: false, msg: '초기 대진 생성 (32팀 single elim)', diff: '+32' },
  ];

  window.AdminTournamentBracket = function AdminTournamentBracket() {
    const [notify, setNotify] = useState(true);

    return (
      <window.AdminShell active="bracket" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '대진표']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">UD2 / B5 보강</div>
                  <h1 className="admin-page__title">대진표 관리 · {TN.name}</h1>
                  <p className="admin-page__sub">대진 생성 / DualGroup 에디터 / publish 알림 / 변경 이력.</p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn"><span className="ico material-symbols-outlined">shuffle</span>재추첨</button>
                  <button className="btn"><span className="ico material-symbols-outlined">edit</span>편집 모드</button>
                </div>
              </div>
            </header>

            <div className="atb-grid">
              <div>
                {/* Bracket stage placeholder */}
                <div className="atb-stage">
                  <div className="atb-stage__placeholder">
                    <span className="ico material-symbols-outlined">account_tree</span>
                    <div style={{fontSize:14, fontWeight:700, color:'var(--ink-soft)'}}>대진표 에디터 (기존 박제 보존)</div>
                    <div style={{fontSize:12}}>DivisionGenerate · DualGroup · MatchCard 컴포넌트 = 운영 코드 변경 0</div>
                  </div>
                </div>

                {/* B5 — publish bar with notify checkbox */}
                <div className="atb-publish">
                  <div className="atb-publish__left">
                    <div className="atb-publish__title">
                      <span className="ico material-symbols-outlined" style={{verticalAlign:'middle', marginRight:6, fontFamily:'Material Symbols Outlined', fontSize:18}}>public</span>
                      대진표 공개 (publish)
                    </div>
                    <div className="atb-publish__sub">사용자 측 /tournaments/[id] bracket 탭에 즉시 반영.</div>
                  </div>
                  <div className="atb-publish__right">
                    <label className="atb-publish__check">
                      <input type="checkbox" checked={notify} onChange={e => setNotify(e.target.checked)} />
                      참가팀 {TN.team_count}명에게 변경 알림 보내기
                    </label>
                    <button className="btn btn--accent"><span className="ico material-symbols-outlined">publish</span>공개</button>
                  </div>
                </div>
              </div>

              {/* Version history panel */}
              <aside className="admin-card">
                <header className="admin-card__head">
                  <h3 className="admin-card__h">
                    <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18}}>history</span>
                    변경 이력
                    <span className="admin-new-chip">NEW</span>
                  </h3>
                  <span className="admin-card__sub">{VERSIONS.length}개</span>
                </header>

                <div className="atb-versions">
                  {VERSIONS.map(v => (
                    <div key={v.v} className={'atb-version' + (v.current ? ' is-current' : '')}>
                      <span className="atb-version__v">{v.v}</span>
                      <div className="atb-version__body">
                        <div className="atb-version__time">{v.time}</div>
                        <div className="atb-version__author">{v.author} · {v.current ? '현재 버전' : '이전'}</div>
                        <div className="atb-version__msg">{v.msg}</div>
                        <a className="atb-version__diff">diff {v.diff} 보기 →</a>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{marginTop:14, paddingTop:12, borderTop:'1px dashed var(--border)', fontSize:11.5, color:'var(--ink-mute)', lineHeight:1.55}}>
                  <b style={{color:'var(--ink-soft)'}}>참고</b> — 데이터 출처: <code style={{fontFamily:'var(--ff-mono)', background:'var(--bg-alt)', padding:'1px 5px', borderRadius:2}}>tournament_bracket_versions</code>.
                  diff view 는 본 시안 (UI만) — 운영 구현은 Phase 1C.
                </div>
              </aside>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
