/* global React, window */
// ============================================================
// BDR v2.33 — PlayerRecords (/users/[id] · 기록 섹션 · 신규 · P1 · C/D→A)
//
// 진입: 선수 공개 프로필(UserPublicProfile)의 기존 "시즌 기록" 카드 아래 — 보존 후 확장.
// 3단위 토글: 경기별(Game Log) / 대회별(groupBy) / 시즌별(요약+슛차트+박스평균).
// 행 클릭: 경기별 → 경기 상세 · 대회별 → /tournaments/[id] 기록실.
// 상태: 정상 / 미클레임(개인 연동 전) / 빈 기록 / 로딩 스켈레톤.
// 데이터: MatchPlayerStat · UserSeasonStat · ShotZoneStat (신규 DB 0).
// ============================================================
function PlayerRecords({ demoState = 'ok' }) {
  const R = window.RECORDS;
  const S = window.RecShared;
  const [unit, setUnit] = React.useState('game');           // game | tournament | season
  const [season, setSeason] = React.useState(2026);

  const segOptions = [
    { v: 'game', l: '경기별', ico: 'list_alt' },
    { v: 'tournament', l: '대회별', ico: 'emoji_events' },
    { v: 'season', l: '시즌별', ico: 'calendar_month' },
  ];

  // ── 표준 박스 컬럼(statCols)으로 세 단위 모두 동일 양식 ──
  const gameCols = [
    { key: 'date', label: '날짜', align: 'left', sticky: true, strong: true, render: r => r.date.slice(5).replace('-', '.'), sortVal: r => r.date },
    { key: 'opponent', label: '상대', align: 'left', render: r => <S.Lnk href={S.teamHref(r.opponent)}>{r.opponent}</S.Lnk> },
    { key: 'tournament', label: '대회', align: 'left', render: r => <span className="rec-dim">{r.tournament}</span> },
    ...S.statCols({ avg: false }),
    { key: 'result', label: '결과', align: 'right', sortable: false, render: r => <S.ResultBadge r={r.result} /> },
  ];

  const tnCols = [
    { key: 'tournament', label: '대회', align: 'left', sticky: true, strong: true, render: r => r.tournament },
    { key: 'period', label: '기간', align: 'left', sortable: false, render: r => <span className="rec-dim">{r.period}</span> },
    { key: 'g', label: 'G', align: 'right' },
    ...S.statCols({ avg: true }),
    { key: 'wl', label: '승–패', align: 'right', sortable: false, render: r => <span className="rec-wlrec">{r.wins}–{r.losses}</span> },
  ];

  const seasonCols = [
    { key: 'season_year', label: '시즌', align: 'left', sticky: true, strong: true, render: r => r.season_year + ' 시즌' },
    { key: 'g', label: 'G', align: 'right' },
    ...S.statCols({ avg: true }),
  ];

  function Body() {
    if (demoState === 'loading') return <S.RecLoading rows={6} cols={unit === 'game' ? 22 : 21} />;
    if (demoState === 'unclaimed') return <S.RecUnclaimed name="윙_상현" />;
    if (demoState === 'empty') return <S.RecEmpty icon="query_stats" title="아직 경기 기록이 없습니다" desc="첫 경기에 참가하면 박스스코어가 여기에 쌓입니다." />;

    if (unit === 'game') {
      return <S.RecTable columns={gameCols} rows={R.PLAYER_GAMELOG} getKey={r => r.match_id}
        onRowClick={() => { }} initialSort={{ key: 'date', dir: 'desc' }} />;
    }
    if (unit === 'tournament') {
      return <S.RecTable columns={tnCols} rows={R.PLAYER_BY_TOURNAMENT} getKey={r => r.tournament_id}
        onRowClick={() => { }} initialSort={{ key: 'ppg', dir: 'desc' }} />;
    }
    // 시즌별 = 시즌 박스 평균(슛차트·요약 인디케이터는 추후 다른 방식으로 구현 — 제거)
    return (
      <div className="rec-seasonview">
        <div className="rec-seasontable">
          <S.RecTable columns={seasonCols} rows={R.PLAYER_BY_SEASON} getKey={r => r.season_year}
            initialSort={{ key: 'season_year', dir: 'desc' }} />
        </div>
      </div>
    );
  }

  return (
    <section className="rec-card">
      <div className="rec-card__head">
        <h3 className="rec-card__h"><span className="ico material-symbols-outlined">leaderboard</span>기록</h3>
        <span className="rec-card__src">MatchPlayerStat · UserSeasonStat</span>
      </div>
      <p className="rec-card__lede">경기별 박스스코어 · 대회별 합계 · 시즌별 평균을 한 자리에서.</p>
      <div className="rec-toolbar">
        <S.RecSeg value={unit} onChange={setUnit} options={segOptions} />
        {unit === 'game' && <span className="rec-toolbar__note"><span className="ico material-symbols-outlined">touch_app</span>행을 누르면 경기 상세로</span>}
        {unit === 'tournament' && <span className="rec-toolbar__note"><span className="ico material-symbols-outlined">touch_app</span>행을 누르면 대회 기록실로</span>}
      </div>
      <Body />
    </section>
  );
}

window.PlayerRecords = PlayerRecords;
