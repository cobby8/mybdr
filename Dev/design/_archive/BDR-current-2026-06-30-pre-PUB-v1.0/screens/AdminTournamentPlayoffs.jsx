/* global React */
// ============================================================
// AdminTournamentPlayoffs.jsx — E1 (Phase 1A 순위전 hub — 신규)
//   /tournament-admin/tournaments/[id]/playoffs
//
// 진입: 셋업 hub 8 카드 진행 후 / sidebar "대진표" 내 "순위전" 탭
// 복귀: AdminTournamentSetupHub
// 에러: 예선 미완 = redirect to /matches / 권한 없음 = redirect
//
// G1 갭 해소: 5 섹션 (순위표 / 8강 / 4강 / 결승 / 결과 박제) 운영 패턴.
//   `AdvancePlayoffsButton` = standings 섹션 하단.
// ============================================================

(function () {
  const TN = { name: 'BDR 서머 오픈 #4' };

  const TABS = [
    { k: 'standings', lbl: '순위표', icon: 'leaderboard', count: 16 },
    { k: 'qf',  lbl: '8강', icon: 'looks_two', count: 4 },
    { k: 'sf',  lbl: '4강', icon: 'looks',     count: 2 },
    { k: 'final', lbl: '결승', icon: 'emoji_events', count: 1 },
    { k: 'result', lbl: '결과 박제', icon: 'edit_note', count: null },
  ];

  // 순위표 mock (4팀 x 2조 → 상위 4팀 진출)
  const STANDINGS = [
    { rank: 1, team: '강남BC',     w: 3, l: 0, pf: 245, pa: 187, pts: 9, q: true },
    { rank: 2, team: '서초파이브', w: 2, l: 1, pf: 213, pa: 198, pts: 6, q: true },
    { rank: 3, team: '용산레전드', w: 2, l: 1, pf: 198, pa: 192, pts: 6, q: true },
    { rank: 4, team: '강북코프',   w: 2, l: 1, pf: 201, pa: 199, pts: 6, q: true },
    { rank: 5, team: '마포웨이브', w: 1, l: 2, pf: 178, pa: 195, pts: 3 },
    { rank: 6, team: '동작유스',   w: 1, l: 2, pf: 174, pa: 190, pts: 3 },
    { rank: 7, team: '광진레인저', w: 0, l: 3, pf: 142, pa: 198, pts: 0 },
    { rank: 8, team: '성동가디언', w: 0, l: 3, pf: 138, pa: 191, pts: 0 },
  ];

  // 8강 매치 mock (4 경기)
  const QF = [
    { id: 'qf1', court: 'A1', time: '06-20 10:00', a: '강남BC', b: '강북코프',   sc: [null, null], status: 'sched' },
    { id: 'qf2', court: 'A1', time: '06-20 11:30', a: '서초파이브', b: '용산레전드', sc: [null, null], status: 'sched' },
    { id: 'qf3', court: 'B1', time: '06-20 10:00', a: '마포웨이브', b: '광진레인저', sc: [62, 58], status: 'live' },
    { id: 'qf4', court: 'B1', time: '06-20 11:30', a: '동작유스', b: '성동가디언', sc: [55, 47], status: 'done' },
  ];

  const SF = [
    { id: 'sf1', court: 'A1', time: '06-21 14:00', a: '강남BC', b: '용산레전드', sc: [null, null], status: 'sched' },
    { id: 'sf2', court: 'A1', time: '06-21 16:00', a: '서초파이브', b: '강북코프', sc: [null, null], status: 'sched' },
  ];

  function MatchCard({ m, big }) {
    const aWin = m.sc[0] != null && m.sc[0] > m.sc[1];
    const bWin = m.sc[1] != null && m.sc[1] > m.sc[0];
    return (
      <div className="apl-match">
        <div className="apl-match__head">
          <span className="apl-match__lbl">M-{m.id.toUpperCase()}</span>
          {m.status === 'live' && <span className="apl-match__live">LIVE</span>}
          {m.status !== 'live' && <span className="apl-match__court">{m.court}</span>}
        </div>
        <div className={'apl-match__row' + (aWin ? ' is-win' : '')}>
          <b>{m.a}</b>
          <span className="sc">{m.sc[0] != null ? m.sc[0] : '—'}</span>
        </div>
        <div className={'apl-match__row' + (bWin ? ' is-win' : '')}>
          <b>{m.b}</b>
          <span className="sc">{m.sc[1] != null ? m.sc[1] : '—'}</span>
        </div>
        <div className="apl-match__time">{m.time}</div>
      </div>
    );
  }

  window.AdminTournamentPlayoffs = function AdminTournamentPlayoffs() {
    const [tab, setTab] = React.useState('standings');

    return (
      <window.AdminShell active="bracket" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '순위전']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">E1 · Phase 1A · 순위전 hub (NEW · G1)</div>
                  <h1 className="admin-page__title">순위전 운영 · {TN.name}</h1>
                  <p className="admin-page__sub">예선 종료 후 진출 확정 → 8강 → 4강 → 결승 순서로 진행.</p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn"><span className="ico material-symbols-outlined">visibility</span>사용자 미리보기</button>
                </div>
              </div>
            </header>

            {/* 5 섹션 탭 */}
            <div className="apl-tabs" role="tablist">
              {TABS.map(t => (
                <button key={t.k}
                  className={'apl-tabs__tab' + (tab === t.k ? ' is-on' : '')}
                  onClick={() => setTab(t.k)}>
                  <span className="ico material-symbols-outlined" style={{ fontSize: 16 }}>{t.icon}</span>
                  {t.lbl}
                  {t.count != null && <span className="apl-tabs__num">{t.count}</span>}
                </button>
              ))}
            </div>

            {/* Section: standings */}
            {tab === 'standings' && (
              <div className="apl-section">
                <div className="apl-stands">
                  <div className="apl-stands__head">
                    <h3 className="apl-stands__t">조별 순위 · 상위 4팀 진출</h3>
                    <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
                      예선 12경기 완료
                    </span>
                  </div>
                  <table>
                    <thead>
                      <tr>
                        <th className="apl-stands__rank">#</th>
                        <th>팀</th>
                        <th style={{ textAlign: 'right' }}>승</th>
                        <th style={{ textAlign: 'right' }}>패</th>
                        <th style={{ textAlign: 'right' }}>득점</th>
                        <th style={{ textAlign: 'right' }}>실점</th>
                        <th style={{ textAlign: 'right' }}>승점</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STANDINGS.map(s => (
                        <tr key={s.team} className={s.q ? 'is-q' : ''}>
                          <td className="apl-stands__rank"><b>{s.rank}</b></td>
                          <td className="apl-stands__team">
                            {s.team}
                            {s.q && <span style={{ marginLeft: 8, fontFamily: 'var(--ff-mono)', fontSize: 10, fontWeight: 800, color: 'var(--ok)', background: '#fff', padding: '1px 5px', borderRadius: 'var(--r-xs)', letterSpacing: '0.04em' }}>Q</span>}
                          </td>
                          <td className="apl-stands__num">{s.w}</td>
                          <td className="apl-stands__num">{s.l}</td>
                          <td className="apl-stands__num">{s.pf}</td>
                          <td className="apl-stands__num">{s.pa}</td>
                          <td className="apl-stands__num"><b>{s.pts}</b></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="apl-stands__advance">
                  <div>
                    <div className="apl-stands__advance__t">예선 4팀 진출 확정</div>
                    <div className="apl-stands__advance__sub">강남BC · 서초파이브 · 용산레전드 · 강북코프 → 8강 대진 자동 생성됩니다.</div>
                  </div>
                  <button className="apl-stands__advance__btn">
                    <span className="ico material-symbols-outlined">arrow_forward</span>
                    8강 대진 생성
                  </button>
                </div>
              </div>
            )}

            {/* Section: QF */}
            {tab === 'qf' && (
              <div className="apl-section">
                <div className="apl-bracket" style={{ '--cols': 4 }}>
                  {QF.map(m => <MatchCard key={m.id} m={m} />)}
                </div>
              </div>
            )}

            {/* Section: SF */}
            {tab === 'sf' && (
              <div className="apl-section">
                <div className="apl-bracket" style={{ '--cols': 2 }}>
                  {SF.map(m => <MatchCard key={m.id} m={m} />)}
                </div>
              </div>
            )}

            {/* Section: Final */}
            {tab === 'final' && (
              <div className="apl-section">
                <div className="apl-final">
                  <div className="apl-final__team">
                    <b>강남BC</b>
                    <small>예선 1위 · 9승 0패</small>
                    <div className="apl-final__sub" style={{ marginTop: 12 }}>FINALIST</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div className="apl-final__sub">06·22 18:00 · A1</div>
                    <div className="apl-final__score">— : —</div>
                    <div className="apl-final__vs">VS</div>
                  </div>
                  <div className="apl-final__team">
                    <b>서초파이브</b>
                    <small>예선 2위 · 6승 1패</small>
                    <div className="apl-final__sub" style={{ marginTop: 12 }}>FINALIST</div>
                  </div>
                </div>
              </div>
            )}

            {/* Section: Result */}
            {tab === 'result' && (
              <div className="apl-section">
                <div className="acp-card" style={{ cursor: 'default' }}>
                  <div className="acp-card__head">
                    <span className="acp-card__icon ico material-symbols-outlined">emoji_events</span>
                    <div style={{ flex: 1 }}>
                      <h3 className="acp-card__title">결과 박제 · 우승 / 준우승 / 3위 결정전</h3>
                    </div>
                    <span className="acp-card__state acp-card__state--idle">결승 종료 후 입력</span>
                  </div>
                  <p className="acp-card__desc">
                    결승전 종료 시 자동으로 우승팀·준우승이 채워지고 3위 결정전 매치가 생성됩니다.
                    종료 후 D1 (종료 후 hub) 의 "결과 박제" 카드와 연동.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
