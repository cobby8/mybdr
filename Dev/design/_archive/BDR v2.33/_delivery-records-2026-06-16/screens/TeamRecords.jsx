/* global React, window */
// ============================================================
// BDR v2.33 — TeamRecords (/teams/[id]?tab=records · "기록" 탭 · 신규 · P1)
//
// 진입 명칭 = "기록". 경기별/대회별은 먼저 목록(경기·대회)을 보여주고,
//   항목 클릭 → 해당 경기/대회의 팀 전체 기록(선수별 박스)으로 드릴다운.
// 시즌별 = 시즌 스코프 로스터 집계 + 팀 평균 행 고정.
// 선수명 = 개인 페이지 링크, 팀/상대명 = 팀 페이지 링크.
// ⚠ 백엔드 실측(2026-06-16): 박스스코어(MatchPlayerStat)는 tournament_match_id 에만 연결 →
//   팀/선수 "경기별"은 대회 경기(TournamentMatch) 한정. 친선·픽업(games)은 박스 없음.
//   조인: Team.id → TournamentTeam.team_id → TournamentMatch → MatchPlayerStat.
// ============================================================
function TeamRecords() {
  const R = window.RECORDS;
  const S = window.RecShared;
  const T = R.TEAM_ROSTER;
  const [unit, setUnit] = React.useState('game');     // game | tournament | season
  const [season, setSeason] = React.useState(2026);
  const [selGame, setSelGame] = React.useState(null); // match_id | null
  const [selTn, setSelTn] = React.useState(null);     // tn id | null

  const segOptions = [
    { v: 'game', l: '경기별', ico: 'list_alt' },
    { v: 'tournament', l: '대회별', ico: 'emoji_events' },
    { v: 'season', l: '시즌별', ico: 'calendar_month' },
  ];
  const tnOptions = R.TOURNAMENTS.filter(t => t.id !== 'tn-winter');
  const switchUnit = (v) => { setUnit(v); setSelGame(null); setSelTn(null); };

  const r1 = (n) => Math.round(n * 10) / 10;

  // 선수 이름 셀 (개인 페이지 링크) — 팀 평균 행은 별도 라벨
  const nameCell = (r) => (r._team ? (
    <span className="rec-player rec-player--team">
      <span className="ico material-symbols-outlined rec-player__teamico">groups</span>
      <span className="rec-player__name">{T.name} 평균</span>
      <span className="rec-player__teamtag">팀 전체</span>
    </span>
  ) : (
    <span className="rec-player">
      <span className="rec-player__jersey">{r.jersey}</span>
      {r.claimed
        ? <S.Lnk href={S.userHref(r.user_id)} className="rec-player__name">{r.name}</S.Lnk>
        : <span className="rec-player__name">{r.player_name}</span>}
      {!r.claimed && <span className="rec-player__unlinked">미연동</span>}
      {r.claimed && <span className="ico material-symbols-outlined rec-player__go">chevron_right</span>}
    </span>
  ));
  const nameCol = { key: 'name', label: '선수', align: 'left', sticky: true, strong: true, sortVal: r => r.name, render: nameCell };
  const gCol = { key: 'g', label: 'G', align: 'right', sortVal: r => (r.g == null ? -1 : r.g), render: r => (r.g == null ? <span className="rec-na">–</span> : r.g) };

  const aggCols = [nameCol, gCol, ...S.statCols({ avg: true })];   // 집계(평균)
  const boxCols = [nameCol, ...S.statCols({ avg: false })];        // 단일 경기(raw)

  // 팀 평균 행 (집계용) / 팀 합계 행 (단일 경기용)
  const teamLine = (memberRows, avg) => {
    const cs = memberRows.filter(r => r.claimed && (avg ? r.g != null : true));
    if (!cs.length) return null;
    const sum = (k) => cs.reduce((a, r) => a + (r[k] || 0), 0);
    const t = { _team: true };
    ['fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'oreb', 'dreb', 'ast', 'stl', 'blk', 'tov', 'pf'].forEach(k => { t[k] = r1(sum(k)); });
    t.pts = r1(2 * t.fgm + t.tpm + t.ftm);
    t.reb = r1(t.oreb + t.dreb);
    t.fg_pct = R.pct(sum('fgm'), sum('fga'));
    t.tp_pct = R.pct(sum('tpm'), sum('tpa'));
    t.ft_pct = R.pct(sum('ftm'), sum('fta'));
    t.rating = r1(sum('rating') / cs.length);
    t.pm = r1(sum('pm') / cs.length);
    if (avg) { t.g = Math.max(...cs.map(r => r.g)); t.min = null; }
    else { t.min = null; }
    return t;
  };

  // 스코프 로스터 행 (시즌/대회 집계)
  const rosterRows = (pick) => T.members.map(m => {
    const stat = pick(m);
    return { ...m, ...(stat || {}), g: stat ? stat.g : null, _noClick: !m.claimed };
  });

  let body;
  if (unit === 'season') {
    const rows = rosterRows(m => (m.claimed ? m[season] : null));
    body = (
      <>
        <div className="rec-scope" style={{ marginBottom: 12 }}>
          {T.seasons.map(y => <button key={y} className={'rec-chip' + (season === y ? ' is-on' : '')} onClick={() => setSeason(y)}>{y}</button>)}
        </div>
        <S.RecTable columns={aggCols} rows={rows} getKey={r => r.jersey + '-' + (r.user_id || r.player_name)}
          initialSort={{ key: 'pts', dir: 'desc' }} pinnedRows={(() => { const t = teamLine(rows, true); return t ? [t] : []; })()} />
      </>
    );
  } else if (unit === 'tournament') {
    if (selTn) {
      const tnMeta = tnOptions.find(t => t.id === selTn);
      const rows = rosterRows(m => (m.claimed ? m.tn[selTn] : null));
      body = (
        <>
          <button className="rec-back" onClick={() => setSelTn(null)}><span className="ico material-symbols-outlined">arrow_back</span>대회 목록</button>
          <h4 className="rec-drillhead"><span className="ico material-symbols-outlined">emoji_events</span>{tnMeta ? tnMeta.name : ''} <span className="rec-dim">팀 전체 기록</span></h4>
          <S.RecTable columns={aggCols} rows={rows} getKey={r => r.jersey + '-' + (r.user_id || r.player_name)}
            initialSort={{ key: 'pts', dir: 'desc' }} pinnedRows={(() => { const t = teamLine(rows, true); return t ? [t] : []; })()} />
        </>
      );
    } else {
      body = (
        <div className="rec-list">
          {tnOptions.map(t => (
            <button key={t.id} className="rec-listrow" onClick={() => setSelTn(t.id)}>
              <span className="ico material-symbols-outlined" style={{ color: 'var(--accent)', fontSize: 20 }}>emoji_events</span>
              <span className="rec-listrow__main">
                <span className="rec-listrow__title">{t.name}</span>
                <span className="rec-listrow__sub">대회 전체 기록 보기</span>
              </span>
              <span className="ico material-symbols-outlined rec-listrow__go">chevron_right</span>
            </button>
          ))}
        </div>
      );
    }
  } else { // game
    if (selGame) {
      const gm = T.games.find(g => g.match_id === selGame);
      body = (
        <>
          <button className="rec-back" onClick={() => setSelGame(null)}><span className="ico material-symbols-outlined">arrow_back</span>경기 목록</button>
          <h4 className="rec-drillhead">
            <span>{gm.date.slice(5).replace('-', '.')} vs <S.Lnk href={S.teamHref(gm.opp)}>{gm.opp}</S.Lnk></span>
            <span className={'rec-wl rec-wl--' + (gm.result === 'W' ? 'w' : 'l')}>{gm.result}</span>
            <span className="rec-drillhead__score">{gm.hs} : {gm.as}</span>
            <span className="rec-dim">팀 전체 기록</span>
          </h4>
          <S.RecTable columns={boxCols} rows={gm.box} getKey={r => r.user_id}
            initialSort={{ key: 'pts', dir: 'desc' }} pinnedRows={(() => { const t = teamLine(gm.box, false); return t ? [t] : []; })()} />
        </>
      );
    } else {
      body = (
        <div className="rec-list">
          {T.games.map(g => (
            <button key={g.match_id} className="rec-listrow" onClick={() => setSelGame(g.match_id)}>
              <span className="rec-listrow__date">{g.date.slice(5).replace('-', '.')}</span>
              <span className="rec-listrow__main">
                <span className="rec-listrow__title">vs {g.opp}</span>
                <span className="rec-listrow__sub">{g.tournament}</span>
              </span>
              <span className={'rec-wl rec-wl--' + (g.result === 'W' ? 'w' : 'l')}>{g.result}</span>
              <span className="rec-listrow__score">{g.hs} : {g.as}</span>
              <span className="ico material-symbols-outlined rec-listrow__go">chevron_right</span>
            </button>
          ))}
        </div>
      );
    }
  }

  const claimedN = T.members.filter(m => m.claimed).length;
  const listMode = (unit === 'game' && !selGame) || (unit === 'tournament' && !selTn);

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h"><span className="ico material-symbols-outlined">groups</span>기록</h3>
        <span className="rec-card__src">Team 로스터 × MatchPlayerStat</span>
      </div>
      <p className="rec-card__lede">
        {listMode
          ? (unit === 'game'
            ? '대회 경기를 선택하면 해당 경기의 팀 전체 기록(선수별 박스)을 봅니다. · 박스스코어는 대회 경기에서만 기록됩니다.'
            : '대회를 선택하면 해당 대회의 팀 전체 기록을 봅니다.')
          : '팀 소속 ' + T.members.length + '명 · 연동 ' + claimedN + '명. 선수를 누르면 개인 기록으로 이동합니다.'}
      </p>

      <div className="rec-toolbar">
        <S.RecSeg value={unit} onChange={switchUnit} options={segOptions} />
      </div>

      {body}

      <div className="rec-foot">
        <span className="ico material-symbols-outlined">info</span>
        <span>미연동 선수는 대회 명단의 이름만 표시됩니다. 계정 클레임 후 개인 박스 기록이 합산됩니다. · 경기별 기록은 대회 경기(TournamentMatch) 한정 — 친선·픽업은 박스스코어 없음. · 팀 집계는 글로벌 Team 로스터 기준.</span>
      </div>
    </section>
  );
}

window.TeamRecords = TeamRecords;
