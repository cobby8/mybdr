// ============================================================
// ScoreSheet — RunningScore + Footer (Officials / Sigs / Period Scores / Final)
// ============================================================

// ------------------------------------------------------------
// RunningScore — 항상 16열 detail (mark | A | B | mark × 4 sections)
// Header = 8셀 (각 A/B 라벨이 2칸 span — mark+num 함께)
// Body = 16셀 (mark | A | B | mark)
// ------------------------------------------------------------
function SSRunningScore({ m }) {
  const ps = m.periodScores;
  const currentPeriod = m.currentPeriod;

  const stateFor = (side, score) => {
    const sp = ps[side];
    let max = 0;
    for (let q = 1; q <= 4; q++) {
      const v = sp[`Q${q}`];
      if (v != null) max = Math.max(max, v);
    }
    if (score > max) return { reached: false, periodEnd: false };
    const periodEnd = [1, 2, 3, 4].some(q => sp[`Q${q}`] === score && q < currentPeriod);
    return { reached: true, periodEnd };
  };

  // detail mark — Q3 진행 중 mock 시각화
  const markFor = (side, score) => {
    const st = stateFor(side, score);
    if (!st.reached) return '';
    if (score % 7 === 0) return '●○';
    if (score % 3 === 0) return '●';
    if (score % 5 === 0) return '·';
    return '';
  };

  // 헤더 8셀 (각 A/B 가 grid-column span 2 — body 의 2칸 차지)
  const headerCells = [];
  for (let section = 0; section < 4; section++) {
    const isLastSection = section === 3;
    headerCells.push(<div key={`hA${section}`}>A</div>);
    headerCells.push(<div key={`hB${section}`} data-section-end={!isLastSection ? "true" : "false"}>B</div>);
  }

  // 바디 16셀 = mark | A | B | mark per section × 40 rows
  const cells = [];
  for (let r = 0; r < 40; r++) {
    for (let section = 0; section < 4; section++) {
      const score = section * 40 + r + 1;
      const isLastSection = section === 3;
      const aSt = stateFor('A', score);
      const bSt = stateFor('B', score);

      cells.push(
        <div key={`r${r}-s${section}-mA`}
             className="ss-rs__cell"
             data-mark="true"
             data-side="A">
          {markFor('A', score) || '\u00A0'}
        </div>
      );
      cells.push(
        <div key={`r${r}-s${section}-A`}
             className="ss-rs__cell"
             data-side="A"
             data-reached={aSt.reached ? "true" : "false"}
             data-period-end={aSt.periodEnd ? "true" : "false"}>
          {score}
        </div>
      );
      cells.push(
        <div key={`r${r}-s${section}-B`}
             className="ss-rs__cell"
             data-side="B"
             data-reached={bSt.reached ? "true" : "false"}
             data-period-end={bSt.periodEnd ? "true" : "false"}>
          {score}
        </div>
      );
      cells.push(
        <div key={`r${r}-s${section}-mB`}
             className="ss-rs__cell"
             data-mark="true"
             data-side="B"
             data-section-end={!isLastSection ? "true" : "false"}>
          {markFor('B', score) || '\u00A0'}
        </div>
      );
    }
  }

  return (
    <div className="ss-rs">
      <div className="ss-rs__title">RUNNING SCORE</div>
      <div className="ss-rs__head">{headerCells}</div>
      <div className="ss-rs__grid">{cells}</div>
    </div>
  );
}

// ------------------------------------------------------------
// Officials (좌측 footer) — Scorer / Asst Scorer / Timer / Shot clock op
// ------------------------------------------------------------
function SSOfficials({ m }) {
  const rows = [
    { lbl: 'Scorer', v: m.scorer },
    { lbl: 'Assistant scorer', v: m.assistantScorer },
    { lbl: 'Timer', v: m.timer },
    { lbl: 'Shot clock operator', v: m.shotClockOperator },
  ];
  return (
    <div className="ss-officials">
      {rows.map(r => (
        <div key={r.lbl} className="ss-officials__row">
          <label className="pap-lbl">{r.lbl}</label>
          <div className="pap-u">{r.v}</div>
        </div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// 좌측 하단 sigs — Referee / Umpire 1+2 / Captain's signature
// ------------------------------------------------------------
function SSBottomLeftSigs({ m }) {
  return (
    <div className="ss-sigs">
      <div className="ss-sigs__row">
        <label className="pap-lbl" style={{minWidth: 60}}>Referee</label>
        <div className="pap-u">{m.referee}</div>
      </div>
      <div className="ss-sigs__row">
        <label className="pap-lbl" style={{minWidth: 60}}>Umpire 1</label>
        <div className="pap-u">{m.umpire1}</div>
        <label className="pap-lbl" style={{minWidth: 60, marginLeft: 12}}>Umpire 2</label>
        <div className="pap-u">{m.umpire2}</div>
      </div>
      <div className="ss-sigs__row">
        <label className="pap-lbl" style={{minWidth: 220}}>Captain's signature in case of protest</label>
        <div className="pap-u"></div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Period Scores 우측 footer — 5 rows + Final Score + Winner
// ------------------------------------------------------------
function SSPeriodScores({ m }) {
  const ps = m.periodScores;
  const fmt = (v) => v == null ? '' : String(v);

  const final = {
    A: Math.max(0, ...Object.values(ps.A).filter(v => v != null)),
    B: Math.max(0, ...Object.values(ps.B).filter(v => v != null)),
  };
  const gameEnded = ps.A.Q4 != null && ps.B.Q4 != null;
  const winner = gameEnded
    ? (final.A > final.B ? m.teamAName
        : final.B > final.A ? m.teamBName
        : '동점')
    : '';

  const rows = [
    { title: 'Scores', period: '① Period', qNum: '①', a: ps.A.Q1, b: ps.B.Q1 },
    { title: '',       period: '② Period', qNum: '②', a: ps.A.Q2, b: ps.B.Q2 },
    { title: '',       period: '③ Period', qNum: '③', a: ps.A.Q3, b: ps.B.Q3 },
    { title: '',       period: '④ Period', qNum: '④', a: ps.A.Q4, b: ps.B.Q4 },
    { title: '',       period: 'Extra periods', qNum: '',  a: ps.A.extra, b: ps.B.extra },
  ];

  return (
    <>
      <div className="ss-ps">
        {rows.map((r, i) => (
          <div key={i} className="ss-ps__row">
            <span className="ss-ps__title">{r.title}</span>
            <span className="ss-ps__period">
              {r.qNum && <span className="ss-circ">{r.qNum}</span>}
              {r.qNum ? 'Period' : r.period}
            </span>
            <span className="ss-ps__val">A &nbsp;{fmt(r.a)}</span>
            <span></span>
            <span className="ss-ps__val">B &nbsp;{fmt(r.b)}</span>
          </div>
        ))}
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
          <div className="ss-winner__v">{winner}</div>
        </div>
      </div>
    </>
  );
}

Object.assign(window, { SSRunningScore, SSOfficials, SSBottomLeftSigs, SSPeriodScores });
