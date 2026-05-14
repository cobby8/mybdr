// ============================================================
// ScoreSheet — Running Score + Footer
// ============================================================

// ------------------------------------------------------------
// Running Score — 8-col paper / 16-col detail toggle
// ------------------------------------------------------------
function SSRunningScore({ mode, m }) {
  const ps = m.periodScores;
  const currentPeriod = m.currentPeriod;

  const stateFor = (side, score) => {
    const sp = ps[side];
    for (let q = 1; q < currentPeriod; q++) {
      const v = sp[`Q${q}`];
      if (v != null && v === score) return { state: 'period-end', q };
    }
    const curV = sp[`Q${currentPeriod}`];
    if (curV != null && curV === score) return { state: 'current' };

    let max = 0;
    for (let q = 1; q <= 4; q++) {
      const v = sp[`Q${q}`];
      if (v != null) max = Math.max(max, v);
    }
    if (score <= max) return { state: 'reached' };
    return { state: 'blank' };
  };

  // detail mode 마킹 — Q3 진행 중 (mock 자율 생성)
  // 1점 = · / 2점 = ● / 3점 = ●+○
  // 마지막 reached 점수 row에 표시 (구체적 슛 분포 mock 은 단순화)
  const markFor = (side, score) => {
    if (mode !== 'detail') return null;
    const st = stateFor(side, score);
    if (st.state === 'blank') return null;
    // 패턴 — 3점 간격으로 다양화
    if (score % 7 === 0) return '●○';   // 3점
    if (score % 3 === 0) return '●';    // 2점
    if (score % 5 === 0) return '·';    // 1점
    return '';
  };

  const cells = [];
  for (let r = 0; r < 40; r++) {
    for (let section = 0; section < 4; section++) {
      const score = section * 40 + r + 1;
      const isLastSection = section === 3;

      const aSt = stateFor('A', score);
      const bSt = stateFor('B', score);

      if (mode === 'detail') {
        // markA, A, B, markB
        cells.push(
          <div key={`r${r}-s${section}-mA`}
               className="ss-rs__cell ss-rs__mark"
               data-side="A"
               data-mark="true">
            {markFor('A', score) || '\u00A0'}
          </div>
        );
        cells.push(
          <div key={`r${r}-s${section}-A`}
               className="ss-rs__cell"
               data-side="A"
               data-state={aSt.state}
               data-q={aSt.q || ""}>
            {score}
          </div>
        );
        cells.push(
          <div key={`r${r}-s${section}-B`}
               className="ss-rs__cell"
               data-side="B"
               data-state={bSt.state}
               data-q={bSt.q || ""}>
            {score}
          </div>
        );
        cells.push(
          <div key={`r${r}-s${section}-mB`}
               className="ss-rs__cell ss-rs__mark"
               data-side="B"
               data-mark="true"
               data-section-end={isLastSection ? "false" : "true"}>
            {markFor('B', score) || '\u00A0'}
          </div>
        );
      } else {
        cells.push(
          <div key={`r${r}-s${section}-A`}
               className="ss-rs__cell"
               data-side="A"
               data-state={aSt.state}
               data-q={aSt.q || ""}>
            {score}
          </div>
        );
        cells.push(
          <div key={`r${r}-s${section}-B`}
               className="ss-rs__cell"
               data-side="B"
               data-state={bSt.state}
               data-q={bSt.q || ""}
               data-section-end={isLastSection ? "false" : "true"}>
            {score}
          </div>
        );
      }
    }
  }

  const headerCells = [];
  for (let section = 0; section < 4; section++) {
    if (mode === 'detail') {
      headerCells.push(<div key={`hmA${section}`}>{''}</div>);
      headerCells.push(<div key={`hA${section}`}>A</div>);
      headerCells.push(<div key={`hB${section}`}>B</div>);
      headerCells.push(<div key={`hmB${section}`}>{''}</div>);
    } else {
      headerCells.push(<div key={`hA${section}`}>A</div>);
      headerCells.push(<div key={`hB${section}`}>B</div>);
    }
  }

  return (
    <div className="ss-rs">
      <div className="ss-rs__title">
        RUNNING SCORE
        <span className="ss-rs__hint">
          {mode === 'paper'
            ? 'P1·1점 / ●=2점 / ●○=3점 마킹은 상세 모드에서'
            : '·=1점(자유투) ●=2점 ●○=3점'}
        </span>
      </div>
      <div className="ss-rs__head" data-mode={mode}>
        {headerCells}
      </div>
      <div className="ss-rs__grid" data-mode={mode}>
        {cells}
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Officials (좌측 footer) — Scorer / Asst Scorer / Timer / Shot clock op
// ------------------------------------------------------------
function SSOfficials({ m }) {
  return (
    <div className="ss-officials">
      <div className="ss-officials__row">
        <label>Scorer</label>
        <div className="ss-field__v">{m.scorer}</div>
      </div>
      <div className="ss-officials__row">
        <label>Assistant scorer</label>
        <div className="ss-field__v">{m.assistantScorer}</div>
      </div>
      <div className="ss-officials__row">
        <label>Timer</label>
        <div className="ss-field__v">{m.timer}</div>
      </div>
      <div className="ss-officials__row">
        <label>Shot clock operator</label>
        <div className="ss-field__v">{m.shotClockOperator}</div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// 최하단 left — Referee / Umpire1 Umpire2 / Captain's signature
// ------------------------------------------------------------
function SSBottomLeftSigs({ m }) {
  return (
    <div className="ss-sigs">
      <div className="ss-sigs__row">
        <label style={{font:'700 10px/1 var(--ff-display)', width:130}}>Referee</label>
        <div className="ss-field__v" style={{flex:1, borderBottom:'1px solid var(--ss-paper-line)', height:16, paddingBottom:1, display:'flex', alignItems:'flex-end', fontFamily:'var(--ff-body)', fontSize:11, color:'var(--ss-paper-soft)', fontWeight:500}}>{m.referee}</div>
      </div>
      <div className="ss-sigs__row">
        <label style={{font:'700 10px/1 var(--ff-display)', width:54}}>Umpire 1</label>
        <div className="ss-field__v" style={{flex:1, borderBottom:'1px solid var(--ss-paper-line)', height:16, paddingBottom:1, display:'flex', alignItems:'flex-end', fontFamily:'var(--ff-body)', fontSize:11, color:'var(--ss-paper-soft)', fontWeight:500}}>{m.umpire1}</div>
        <label style={{font:'700 10px/1 var(--ff-display)', width:54, marginLeft:8}}>Umpire 2</label>
        <div className="ss-field__v" style={{flex:1, borderBottom:'1px solid var(--ss-paper-line)', height:16, paddingBottom:1, display:'flex', alignItems:'flex-end', fontFamily:'var(--ff-body)', fontSize:11, color:'var(--ss-paper-soft)', fontWeight:500}}>{m.umpire2}</div>
      </div>
      <div className="ss-sigs__row">
        <label style={{font:'700 10px/1 var(--ff-display)', width:200}}>Captain's signature in case of protest</label>
        <div className="ss-field__v" style={{flex:1, borderBottom:'1px solid var(--ss-paper-line)', height:16, paddingBottom:1, display:'flex', alignItems:'flex-end', fontFamily:'var(--ff-body)', fontSize:11, color:'var(--ss-paper-soft)', fontWeight:500}}></div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Period Scores (우측 footer) + Final + Winner
// ------------------------------------------------------------
function SSPeriodScores({ m }) {
  const ps = m.periodScores;
  const final = {
    A: Math.max(...Object.values(ps.A).filter(v => v != null), 0),
    B: Math.max(...Object.values(ps.B).filter(v => v != null), 0),
  };
  const winner = m.currentPeriod >= 4 && ps.A.Q4 != null && ps.B.Q4 != null
    ? (final.A > final.B ? m.teamAName : final.B > final.A ? m.teamBName : '동점')
    : '—';

  const fmt = (v) => v == null ? '' : v;

  return (
    <>
      <div className="ss-ps">
        <div className="ss-ps__row">
          <span className="ss-ps__title">Scores</span>
          <span className="ss-ps__period" data-q="1"><span className="ss-circ">①</span>Period</span>
          <span className="ss-ps__val">A&nbsp;&nbsp;{fmt(ps.A.Q1)}</span>
          <span></span>
          <span className="ss-ps__val">B&nbsp;&nbsp;{fmt(ps.B.Q1)}</span>
        </div>
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period" data-q="2"><span className="ss-circ">②</span>Period</span>
          <span className="ss-ps__val">A&nbsp;&nbsp;{fmt(ps.A.Q2)}</span>
          <span></span>
          <span className="ss-ps__val">B&nbsp;&nbsp;{fmt(ps.B.Q2)}</span>
        </div>
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period" data-q="3"><span className="ss-circ">③</span>Period</span>
          <span className="ss-ps__val">A&nbsp;&nbsp;{fmt(ps.A.Q3)}</span>
          <span></span>
          <span className="ss-ps__val">B&nbsp;&nbsp;{fmt(ps.B.Q3)}</span>
        </div>
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period" data-q="4"><span className="ss-circ">④</span>Period</span>
          <span className="ss-ps__val">A&nbsp;&nbsp;{fmt(ps.A.Q4)}</span>
          <span></span>
          <span className="ss-ps__val">B&nbsp;&nbsp;{fmt(ps.B.Q4)}</span>
        </div>
        <div className="ss-ps__row">
          <span></span>
          <span className="ss-ps__period">Extra periods</span>
          <span className="ss-ps__val">A&nbsp;&nbsp;{fmt(ps.A.extra)}</span>
          <span></span>
          <span className="ss-ps__val">B&nbsp;&nbsp;{fmt(ps.B.extra)}</span>
        </div>
      </div>
      <div className="ss-final">
        <div className="ss-final__row">
          <span className="ss-ps__title">Final Score</span>
          <span className="ss-ps__teamlabel">Team A</span>
          <span className="ss-ps__val">{final.A || ''}</span>
          <span className="ss-ps__teamlabel">Team B</span>
          <span className="ss-ps__val">{final.B || ''}</span>
        </div>
        <div className="ss-winner">
          <label>Name of winning team</label>
          <div className="ss-winner__v">{winner === '—' ? '' : winner}</div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { SSRunningScore, SSOfficials, SSBottomLeftSigs, SSPeriodScores });
