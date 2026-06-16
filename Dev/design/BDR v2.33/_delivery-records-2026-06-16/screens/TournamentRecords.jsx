/* global React, window */
// ============================================================
// BDR v2.33 — TournamentRecords (/tournaments/[id] 기록실 · 신규 · P1)
//
// 진입: 대회 상세 페이지 "기록실" 탭 · 선수/팀 기록의 "대회별" 행 → 이 화면.
// 한 대회 안 전수 집계 토글: [선수](리더보드) / [팀](집계) / [경기](로그).
// 행 클릭: 선수 → /users/[id] · 팀 → /teams/[id] · 경기 → 경기 상세.
// 데이터: MatchPlayerStat(대회 한정) · TournamentTeam · TournamentMatch (신규 DB 0).
// ============================================================
function TournamentRecords() {
  const R = window.RECORDS;
  const S = window.RecShared;
  const D = R.TOURNAMENT_REC;
  const [unit, setUnit] = React.useState('player');   // player | team | game
  const [leadCat, setLeadCat] = React.useState(null);  // 더보기로 펼친 스탯 카테고리

  const segOptions = [
    { v: 'player', l: '선수 기록', ico: 'person' },
    { v: 'team', l: '팀 기록', ico: 'groups' },
    { v: 'game', l: '경기', ico: 'sports_basketball' },
  ];

  // 선수 리더보드 — 표준 박스 컬럼(statCols)
  const playerCols = [
    {
      key: 'name', label: '선수', align: 'left', sticky: true, strong: true, sortVal: r => r.name,
      render: r => (
        <span className="rec-player">
          {r.claimed
            ? <S.Lnk href={S.userHref(r.user_id)} className="rec-player__name">{r.name}</S.Lnk>
            : <span className="rec-player__name">{r.player_name}</span>}
          <S.Lnk href={S.teamHref(r.team)} className="rec-tn-team">{r.team}</S.Lnk>
          {!r.claimed && <span className="rec-player__unlinked">미연동</span>}
          {r.claimed && <span className="ico material-symbols-outlined rec-player__go">chevron_right</span>}
        </span>
      ),
    },
    { key: 'g', label: 'G', align: 'right' },
    ...S.statCols({ avg: true }),
  ];

  // 팀 집계 — 표준 박스(statCols, MIN 제외) + 팀 순위 컬럼(승-패·실점·득실)
  const teamSc = S.statCols({ avg: true }).filter(c => c.key !== 'min');
  const teamCols = [
    { key: 'name', label: '팀', align: 'left', sticky: true, strong: true, render: r => <span className="rec-player"><S.Lnk href={S.teamHref(r.name)} className="rec-player__name">{r.name}</S.Lnk><span className="ico material-symbols-outlined rec-player__go">chevron_right</span></span> },
    { key: 'g', label: 'G', align: 'right' },
    { key: 'wl', label: '승–패', align: 'right', sortable: false, render: r => <span className="rec-wlrec">{r.w}–{r.l}</span> },
    { key: 'win', label: '승률', align: 'right', sortVal: r => r.w / r.g, render: r => Math.round(r.w / r.g * 100) + '%' },
    { ...teamSc[0], label: '득점' },
    { key: 'oppg', label: '실점', align: 'right', render: r => S.fmt1(r.oppg) },
    { key: 'diff', label: '득실', align: 'right', render: r => <span style={{ color: r.diff >= 0 ? 'var(--ok)' : 'var(--err)', fontWeight: 700 }}>{(r.diff >= 0 ? '+' : '') + S.fmt1(r.diff)}</span> },
    ...teamSc.slice(1),
  ];

  // 경기 로그
  const gameCols = [
    { key: 'date', label: '날짜', align: 'left', sticky: true, strong: true, render: r => r.date.slice(5).replace('-', '.'), sortVal: r => r.date },
    { key: 'round', label: '라운드', align: 'left', sortable: false, render: r => <span className="rec-dim">{r.round}</span> },
    { key: 'home', label: '홈', align: 'right', sortable: false, render: r => <S.Lnk href={S.teamHref(r.home)}><span style={{ fontWeight: r.hs > r.as ? 800 : 500, color: r.hs > r.as ? 'var(--ink)' : 'var(--ink-mute)' }}>{r.home}</span></S.Lnk> },
    { key: 'score', label: '스코어', align: 'right', sortable: false, render: r => <span className="rec-tn-score">{r.hs} : {r.as}</span> },
    { key: 'away', label: '원정', align: 'left', sortable: false, render: r => <S.Lnk href={S.teamHref(r.away)}><span style={{ fontWeight: r.as > r.hs ? 800 : 500, color: r.as > r.hs ? 'var(--ink)' : 'var(--ink-mute)' }}>{r.away}</span></S.Lnk> },
  ];

  // 스탯 리더 (카테고리별 TOP 3 + 더보기 → 전체)
  const LEAD_CATS = [
    { key: 'ppg', label: '득점', unit: 'PPG' },
    { key: 'rpg', label: '리바운드', unit: 'RPG' },
    { key: 'apg', label: '어시스트', unit: 'APG' },
    { key: 'spg', label: '스틸', unit: 'SPG' },
    { key: 'bpg', label: '블록', unit: 'BPG' },
    { key: 'tp_pct', label: '3점 성공률', unit: '3P%', pct: true, filter: r => r.tp_pct > 0 },
  ];
  const claimed = D.players.filter(p => p.claimed);
  const rankFor = (c) => claimed.filter(c.filter || (() => true)).slice().sort((a, b) => b[c.key] - a[c.key]);
  const leaders = (
    <div className="rec-leaders">
      {LEAD_CATS.map(c => {
        const full = rankFor(c);
        const list = full.slice(0, 3);
        const max = list.length ? list[0][c.key] : 1;
        return (
          <div className="rec-lead" key={c.key}>
            <div className="rec-lead__h"><span>{c.label}</span><span className="rec-lead__unit">{c.unit}</span></div>
            {list.map((p, i) => (
              <div className="rec-lead__row" key={p.user_id} title={p.name + ' · ' + p.team}>
                <span className={'rec-lead__rank' + (i === 0 ? ' is-top' : '')}>{i + 1}</span>
                <span className="rec-lead__name"><S.Lnk href={S.userHref(p.user_id)}>{p.name}</S.Lnk><S.Lnk href={S.teamHref(p.team)}><i>{p.team}</i></S.Lnk></span>
                <span className="rec-lead__bar"><b style={{ width: (p[c.key] / max * 100) + '%', background: i === 0 ? 'var(--accent)' : 'var(--cafe-blue)' }} /></span>
                <span className="rec-lead__val">{c.pct ? p[c.key].toFixed(1) + '%' : p[c.key].toFixed(1)}</span>
              </div>
            ))}
            <button className="rec-lead__more" onClick={() => setLeadCat(c.key)}>
              더보기 <span className="rec-lead__more-n">전체 {full.length}명</span>
            </button>
          </div>
        );
      })}
    </div>
  );

  // 더보기 모달 — 해당 스탯 전체 선수 순위
  const modalCat = LEAD_CATS.find(c => c.key === leadCat);
  const leaderModal = !modalCat ? null : (() => {
    const full = rankFor(modalCat);
    const max = full.length ? full[0][modalCat.key] : 1;
    return (
      <div className="rec-modal" onClick={() => setLeadCat(null)}>
        <div className="rec-modal__panel" onClick={e => e.stopPropagation()}>
          <div className="rec-modal__head">
            <h4><span className="ico material-symbols-outlined">emoji_events</span>{modalCat.label} 순위 <span className="rec-dim">{modalCat.unit} · 전체 {full.length}명</span></h4>
            <button className="rec-modal__x" onClick={() => setLeadCat(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
          </div>
          <div className="rec-modal__body">
            {full.map((p, i) => (
              <div className="rec-lead__row rec-modal__row" key={p.user_id}>
                <span className={'rec-lead__rank' + (i === 0 ? ' is-top' : '')}>{i + 1}</span>
                <span className="rec-lead__name"><S.Lnk href={S.userHref(p.user_id)}>{p.name}</S.Lnk><S.Lnk href={S.teamHref(p.team)}><i>{p.team}</i></S.Lnk></span>
                <span className="rec-lead__bar"><b style={{ width: (p[modalCat.key] / max * 100) + '%', background: i === 0 ? 'var(--accent)' : 'var(--cafe-blue)' }} /></span>
                <span className="rec-lead__val">{modalCat.pct ? p[modalCat.key].toFixed(1) + '%' : p[modalCat.key].toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  })();

  let body;
  if (unit === 'player') body = (
    <>
      <h4 className="rec-subh"><span className="ico material-symbols-outlined">emoji_events</span>스탯 리더 <span className="rec-dim">카테고리별 TOP 3 · 더보기로 전체</span></h4>
      {leaders}
      <h4 className="rec-subh" style={{ marginTop: 20 }}><span className="ico material-symbols-outlined">format_list_numbered</span>전체 선수 <span className="rec-dim">{claimed.length}명 · 기록 헤더 클릭 정렬</span></h4>
      <S.RecTable columns={playerCols} rows={D.players} getKey={r => r.user_id || r.player_name} onRowClick={() => { }} initialSort={{ key: 'pts', dir: 'desc' }} />
    </>
  );
  else if (unit === 'team') body = <S.RecTable columns={teamCols} rows={D.teams.map(t => ({ ...t, pts: t.ppg }))} getKey={r => r.team_id} onRowClick={() => { }} initialSort={{ key: 'win', dir: 'desc' }} />;
  else body = <S.RecTable columns={gameCols} rows={D.games} getKey={r => r.match_id} onRowClick={() => { }} initialSort={{ key: 'date', dir: 'desc' }} />;

  React.useEffect(() => {
    if (!leadCat) return;
    const h = (e) => { if (e.key === 'Escape') setLeadCat(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [leadCat]);

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h"><span className="ico material-symbols-outlined">leaderboard</span>대회 기록실</h3>
        <span className="rec-card__src">MatchPlayerStat · TournamentTeam · TournamentMatch</span>
      </div>
      <div className="rec-tnmeta">
        <span className="rec-tnmeta__pill">{D.status}</span>
        <span>{D.division}</span>
        <span><span className="ico material-symbols-outlined">groups</span>{D.teams_n}팀</span>
        <span><span className="ico material-symbols-outlined">sports_basketball</span>{D.games_n}경기</span>
        <span><span className="ico material-symbols-outlined">military_tech</span>MVP {D.mvp}</span>
      </div>

      <div className="rec-toolbar">
        <S.RecSeg value={unit} onChange={setUnit} options={segOptions} />
        {unit === 'player' && <span className="rec-toolbar__note"><span className="ico material-symbols-outlined">touch_app</span>선수 → 개인 기록</span>}
        {unit === 'team' && <span className="rec-toolbar__note"><span className="ico material-symbols-outlined">touch_app</span>팀 → 팀 페이지</span>}
        {unit === 'game' && <span className="rec-toolbar__note"><span className="ico material-symbols-outlined">touch_app</span>경기 → 박스스코어</span>}
      </div>

      {body}
      {leaderModal}

      <div className="rec-foot">
        <span className="ico material-symbols-outlined">info</span>
        <span>대회 한정 집계 — 참가 선수의 MatchPlayerStat(이 대회 매치)와 TournamentTeam·TournamentMatch 기준. 미연동 선수는 대회 명단 이름만 표시.</span>
      </div>
    </section>
  );
}

window.TournamentRecords = TournamentRecords;
