// ============================================================
// ScoreSheet — main page wrapper
// ============================================================

function ScoreSheet({ setRoute }) {
  const [mode, setMode] = React.useState('paper');
  const m = window.SCORESHEET_MOCK;

  return (
    <div className="ss-shell">
      {/* Toolbar — 시안 전용 (인쇄 시 hidden) */}
      <div className="ss-toolbar">
        <button className="ss-toolbar__back" onClick={() => setRoute && setRoute('home')}>
          <span className="material-symbols-outlined">arrow_back</span>
          메인
        </button>
        <div className="ss-toolbar__title">SCORESHEET · #{m.gameNo}</div>
        <div className="ss-toolbar__seg" role="tablist">
          <button data-active={mode === 'paper'} onClick={() => setMode('paper')}>
            페이퍼 정합 (A|B · 8)
          </button>
          <button data-active={mode === 'detail'} onClick={() => setMode('detail')}>
            상세 마킹 (16)
          </button>
        </div>
        <button className="ss-toolbar__print" onClick={() => window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        <button className="ss-toolbar__finish">
          <span className="material-symbols-outlined">flag</span>
          경기 종료
        </button>
      </div>

      {/* Paper — A4 portrait, 외곽 직각 2px solid */}
      <div className="ss-paper">
        <SSHeader/>
        <SSNames teamA={m.teamAName} teamB={m.teamBName}/>
        <SSMeta m={m}/>

        <section className="ss-body">
          <div className="ss-body__l">
            <SSTeamBox
              label="Team A"
              name={m.teamAName}
              players={m.teamAPlayers}
              coach={m.teamACoach}
              asst={m.teamAAssistant}
              timeoutsUsed={m.teamATimeoutsUsed}
              teamFouls={m.teamATeamFouls}
            />
            <SSTeamBox
              label="Team B"
              name={m.teamBName}
              players={m.teamBPlayers}
              coach={m.teamBCoach}
              asst={m.teamBAssistant}
              timeoutsUsed={m.teamBTimeoutsUsed}
              teamFouls={m.teamBTeamFouls}
            />
          </div>
          <div className="ss-body__r">
            <SSRunningScore mode={mode} m={m}/>
          </div>
        </section>

        <section className="ss-foot">
          <div className="ss-foot__l">
            <SSOfficials m={m}/>
            <SSBottomLeftSigs m={m}/>
          </div>
          <div className="ss-foot__r">
            <SSPeriodScores m={m}/>
          </div>
        </section>
      </div>
    </div>
  );
}

Object.assign(window, { ScoreSheet });
