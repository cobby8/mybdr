/* global React */
// ============================================================
// BDR v2.23 — Rankings (RU1 · Phase 5B · 보강 · BC1 + BC7)
// 운영 박제 대상: /rankings (RankingsContent v2 보강)
// 진입: AppNav "랭킹" 탭
//
// 보강 (운영 RankingsContent 답습 + Phase 2/3 cross-domain):
//   RU1-A 부문 chip row sticky (득점/리바운드/어시스트/매너)
//   RU1-B 이달의 MVP Hero (BC1 · Phase 2 games.final_mvp_user_id 30일 집계)
//   RU1-C 팀 wins 리더 (BC1 · Phase 3 Team.wins/losses/draws)
//   RU1-D 코트별 랭킹 진입 chip (cross-domain /courts/[id]/rankings)
//   RU1-E 데이터 출처 footer (부문별 데이터 흐름)
// A 등급
// ============================================================

function Rankings() {
  const [mode, setMode] = React.useState('team'); // team / player / bdr
  const [sort, setSort] = React.useState('points');

  const players = [...window.RANK_PLAYERS].sort((a, b) => b[sort] - a[sort]).map((p, i) => ({ ...p, rank: i + 1 }));
  const teams = window.RANK_TEAMS;
  const mvp = window.RANK_MVP;
  const leader = window.RANK_TEAM_LEADER;
  const sortDef = window.RANK_PLAYER_SORTS.find(s => s.key === sort);
  const podiumSrc = mode === 'player' ? players.slice(0, 3) : teams.slice(0, 3);

  return (
    <div className="ru1-page">
      <header className="ru1-head">
        <div style={{ minWidth: 0 }}>
          <div className="eyebrow">랭킹 · LEADERBOARD</div>
          <h1 className="ru1-head__title">2026 시즌 랭킹</h1>
          <div className="ru1-head__sub">공식전 · 프리시즌 반영 · 매주 월요일 갱신</div>
        </div>
        <div className="ru1-switch" role="group" aria-label="랭킹 모드">
          {[{ k: 'team', l: '팀' }, { k: 'player', l: '선수' }, { k: 'bdr', l: '외부BDR' }].map(m => (
            <button key={m.k} className="ru1-switch__btn" data-active={mode === m.k} onClick={() => setMode(m.k)}>{m.l}</button>
          ))}
        </div>
      </header>

      {/* BC1 — cross-domain hero (이달의 MVP + 팀 wins 리더) */}
      <div className="ru1-cross">
        <div className="ru1-mvp">
          <div className="ru1-mvp__av">{mvp.avatar}</div>
          <div className="ru1-mvp__body">
            <div className="ru1-mvp__lbl">🏆 이달의 MVP · {mvp.period}</div>
            <div className="ru1-mvp__name">{mvp.name}</div>
            <div className="ru1-mvp__stat">{mvp.team} · {mvp.points}득점 · {mvp.assists}어시 · 최근 MVP {mvp.mvp_count}회</div>
            <div className="ru1-mvp__src"><span className="ico material-symbols-outlined">sports_basketball</span>경기 결과 집계 (최근 30일)</div>
          </div>
        </div>
        <div className="ru1-leader">
          <div className="ru1-leader__logo">{leader.logo}</div>
          <div className="ru1-leader__body">
            <div className="ru1-leader__lbl">팀 승수 리더</div>
            <div className="ru1-leader__name">{leader.name}</div>
            <div className="ru1-leader__rec">{leader.wins}승 {leader.losses}패 {leader.draws}무 · 우승 {leader.titles}회</div>
            <div className="ru1-leader__src"><span className="ico material-symbols-outlined">groups</span>팀 전적 동기화</div>
          </div>
        </div>
      </div>

      {mode !== 'bdr' && (
        <>
          {/* RU1-D — 코트별 랭킹 진입 (cross-domain 코트 영역) */}
          <div className="ru1-court-cta">
            <span className="ico material-symbols-outlined">location_on</span>
            <span><b>코트별 랭킹</b> — 자주 뛰는 코트의 순위도 확인하세요</span>
            <div className="ru1-court-cta__chips">
              <span className="ru1-court-chip">잠실학생체육관</span>
              <span className="ru1-court-chip">장충체육관</span>
              <span className="ru1-court-chip">여의도 한강</span>
            </div>
          </div>

          {/* RU1-A — 부문 chip row sticky (선수 모드만) */}
          {mode === 'player' && (
            <div className="ru1-chips">
              {window.RANK_PLAYER_SORTS.map(s => (
                <button key={s.key} className={'ru1-chip' + (sort === s.key ? ' is-on' : '')} onClick={() => setSort(s.key)}>
                  {s.label}<span className="ru1-chip__unit">{s.unit}</span>
                </button>
              ))}
            </div>
          )}

          {/* podium */}
          <div className="ru1-podium">
            {[1, 0, 2].map(pos => {
              const it = podiumSrc[pos];
              if (!it) return <div key={pos} />;
              const rank = it.rank;
              const isPlayer = mode === 'player';
              return (
                <div key={pos} className={'ru1-pod ru1-pod--' + rank}>
                  <div className="ru1-pod__rank">{rank}</div>
                  <div className="ru1-pod__av" style={{ background: isPlayer ? 'var(--cafe-blue)' : it.color }}>{isPlayer ? it.avatar : it.logo}</div>
                  <div className="ru1-pod__name">{it.name}</div>
                  <div className="ru1-pod__team">{isPlayer ? it.team : it.city}</div>
                  <div className="ru1-pod__val">{isPlayer ? it[sort] : it.wins}<span className="ru1-pod__unit"> {isPlayer ? sortDef.unit : '승'}</span></div>
                </div>
              );
            })}
          </div>

          {/* board */}
          {mode === 'player' ? (
            <div className="ru1-board ru1-board--player">
              <div className="ru1-board__head">
                <div>순위</div><div>선수</div>
                <div style={{ textAlign: 'right' }}>{sortDef.label}</div>
                <div style={{ textAlign: 'right' }} className="ru1-hide-sm">경기</div>
                <div style={{ textAlign: 'right' }} className="ru1-hide-sm">매너</div>
              </div>
              {players.map(p => (
                <div key={p.id} className="ru1-board__row">
                  <div className={'ru1-board__rank' + (p.rank <= 3 ? ' is-top' : '')}>{p.rank}</div>
                  <div className="ru1-board__who">
                    <span className="ru1-board__av" style={{ background: 'var(--cafe-blue)' }}>{p.avatar}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ru1-board__name">{p.name}</div>
                      <div className="ru1-board__sub">{p.team}</div>
                    </div>
                  </div>
                  <div className="ru1-board__stat is-primary">{p[sort]}</div>
                  <div className="ru1-board__stat ru1-hide-sm">{p.games}</div>
                  <div className="ru1-board__stat ru1-hide-sm">{p.manner}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ru1-board ru1-board--team">
              <div className="ru1-board__head">
                <div>순위</div><div>팀</div>
                <div style={{ textAlign: 'right' }}>승</div>
                <div style={{ textAlign: 'right' }}>전적</div>
                <div style={{ textAlign: 'right' }} className="ru1-hide-sm">우승</div>
              </div>
              {teams.map(t => (
                <div key={t.id} className="ru1-board__row">
                  <div className={'ru1-board__rank' + (t.rank <= 3 ? ' is-top' : '')}>{t.rank}</div>
                  <div className="ru1-board__who">
                    <span className="ru1-board__av" style={{ background: t.color, borderRadius: 'var(--r-sm)' }}>{t.logo}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="ru1-board__name">{t.name}</div>
                      <div className="ru1-board__sub">{t.city}</div>
                    </div>
                  </div>
                  <div className="ru1-board__stat is-primary">{t.wins}</div>
                  <div className="ru1-board__wl"><b>{t.wins}</b>-{t.losses}-<s>{t.draws}</s></div>
                  <div className="ru1-board__stat ru1-hide-sm">{t.titles}</div>
                </div>
              ))}
            </div>
          )}

          {/* RU1-E / BC7 — 데이터 출처 footer */}
          <div className="ru1-source">
            <h4 className="ru1-source__h"><span className="ico material-symbols-outlined">info</span>데이터 출처</h4>
            <div className="ru1-source__row">
              <span className="ru1-source__tag ru1-source__tag--p2">경기</span>
              <span><b>개인 부문 / 이달의 MVP</b> — 공식전 경기 기록 + 최종 MVP 집계 (최근 30일).</span>
            </div>
            <div className="ru1-source__row">
              <span className="ru1-source__tag ru1-source__tag--p3">팀</span>
              <span><b>팀 부문 / 승수 리더</b> — 팀 전적(승·패·무) 동기화. 매주 월요일 갱신.</span>
            </div>
            <div className="ru1-source__row">
              <span className="ru1-source__tag">코트</span>
              <span><b>코트별 랭킹</b> — 코트별 누적 기록 기반 (코트 영역 연동).</span>
            </div>
          </div>
        </>
      )}

      {mode === 'bdr' && (
        <div className="ru1-source" style={{ marginTop: 0, textAlign: 'center', padding: '48px 24px' }}>
          <span className="ico material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 44, color: 'var(--ink-dim)', display: 'block', marginBottom: 10 }}>leaderboard</span>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 17, fontWeight: 800, marginBottom: 6 }}>외부 BDR 랭킹 (일반부 · 대학부)</div>
          <p style={{ fontSize: 13, color: 'var(--ink-mute)', lineHeight: 1.6, maxWidth: 440, margin: '0 auto' }}>
            BDR 자체 알고리즘 기반 외부 공인 랭킹. 시즌·검색·부(일반/대학) 전환은 운영 컴포넌트 그대로 carry-over됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

window.Rankings = Rankings;
