// ============================================================
// ScoreSheet — Header / Names / Meta / TeamBox parts
// FIBA paper 100% 시각 박제 (로고+타이틀 텍스트만 BDR 자체)
// ============================================================

// ------------------------------------------------------------
// Field helper — label + underline value
// ------------------------------------------------------------
function SSField({ label, value, grow = 1 }) {
  return (
    <div className="ss-field" data-grow={grow}>
      <label className="pap-lbl">{label}</label>
      <div className="pap-u">{value || "\u00A0"}</div>
    </div>
  );
}

// ------------------------------------------------------------
// §1 Header — BDR 로고 + 3줄 타이틀 (FIBA 페이퍼 정합 구조)
// ------------------------------------------------------------
function SSHeader() {
  return (
    <section className="ss-h">
      <div className="ss-h__logo">
        <div className="ss-h__logo-mark">
          <span className="material-symbols-outlined">sports_basketball</span>
        </div>
        <div className="ss-h__logo-brand">BDR</div>
        <div className="ss-h__logo-tag">We Play Basketball</div>
      </div>
      <div className="ss-h__title">
        <div className="ss-h__t1">BASKETBALL DAILY ROUTINE</div>
        <div className="ss-h__t2">MyBDR 공식 기록지</div>
        <div className="ss-h__t3">SCORESHEET</div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// §2 Team A / Team B name strip
// ------------------------------------------------------------
function SSNames({ teamA, teamB }) {
  return (
    <section className="ss-names">
      <div className="ss-names__cell">
        <label className="pap-lbl">Team A</label>
        <div className="pap-u">{teamA}</div>
      </div>
      <div className="ss-names__cell">
        <label className="pap-lbl">Team B</label>
        <div className="pap-u">{teamB}</div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// §3 Meta — 2×2 grid
//   row1: Competition / Date / Time    | Referee
//   row2: Game No. / Place             | Umpire 1 / Umpire 2
// ------------------------------------------------------------
function SSMeta({ m }) {
  return (
    <section className="ss-meta">
      <div className="ss-meta__cell">
        <SSField label="Competition" value={m.competitionName} grow={2}/>
        <SSField label="Date" value={m.date}/>
        <SSField label="Time" value={m.time}/>
      </div>
      <div className="ss-meta__cell">
        <SSField label="Referee" value={m.referee}/>
      </div>
      <div className="ss-meta__cell">
        <SSField label="Game No." value={m.gameNo}/>
        <SSField label="Place" value={m.place} grow={3}/>
      </div>
      <div className="ss-meta__cell">
        <SSField label="Umpire 1" value={m.umpire1}/>
        <SSField label="Umpire 2" value={m.umpire2}/>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Time-outs — 2+3 layout (1H 2개 / 2H 3개) — FIBA 5x5 정합
// ------------------------------------------------------------
function SSTimeoutCells({ used }) {
  // FIBA paper 정합 — 1행 2, 2행 3, 3행 2 = 총 7 cells
  const renderCell = (idx) => (
    <div key={idx} className="ss-tbox__to-cell" data-used={idx < used ? "true" : "false"}>
      {idx < used ? "✕" : ""}
    </div>
  );
  return (
    <div className="ss-tbox__to-grid">
      <div className="ss-tbox__to-row">{renderCell(0)}{renderCell(1)}</div>
      <div className="ss-tbox__to-row">{renderCell(2)}{renderCell(3)}{renderCell(4)}</div>
      <div className="ss-tbox__to-row">{renderCell(5)}{renderCell(6)}</div>
    </div>
  );
}

// ------------------------------------------------------------
// Team fouls — Period ①[1234] ②[1234] / Period ③[1234] ④[1234] / Extra periods
// ------------------------------------------------------------
function SSTeamFoulsCells({ count }) {
  return (
    <div className="ss-tbox__tf-cells">
      {[1, 2, 3, 4].map(n => {
        const on = n <= count;
        return (
          <div key={n}
               className="ss-tbox__tf-cell"
               data-on={on ? "true" : "false"}
               data-bonus={on && count >= 5 && n === 4 ? "true" : "false"}>
            {n}
          </div>
        );
      })}
    </div>
  );
}

function SSTeamFouls({ teamFouls }) {
  return (
    <div className="ss-tbox__tf">
      <div className="ss-tbox__tf-label">Team fouls</div>
      <div className="ss-tbox__tf-line">
        <span className="ss-tbox__tf-pname">Period</span>
        <div className="ss-tbox__tf-q">
          <span className="ss-tbox__tf-qnum">①</span>
          <SSTeamFoulsCells count={teamFouls.Q1}/>
        </div>
        <div className="ss-tbox__tf-q">
          <span className="ss-tbox__tf-qnum">②</span>
          <SSTeamFoulsCells count={teamFouls.Q2}/>
        </div>
      </div>
      <div className="ss-tbox__tf-line">
        <span className="ss-tbox__tf-pname">Period</span>
        <div className="ss-tbox__tf-q">
          <span className="ss-tbox__tf-qnum">③</span>
          <SSTeamFoulsCells count={teamFouls.Q3}/>
        </div>
        <div className="ss-tbox__tf-q">
          <span className="ss-tbox__tf-qnum">④</span>
          <SSTeamFoulsCells count={teamFouls.Q4}/>
        </div>
      </div>
      <div className="ss-tbox__tf-line" data-extra="true">
        <span className="ss-tbox__tf-pname">Extra periods</span>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Players table header — Licence no | Players | No | Player in | Fouls (1-5)
// ------------------------------------------------------------
function SSPlayerHead() {
  return (
    <div className="ss-tbox__plyhead">
      <div><span>Licence</span><span>no.</span></div>
      <div style={{alignItems:'flex-start', justifyContent:'flex-start', flexDirection:'row'}}>Players</div>
      <div>No.</div>
      <div><span>Player</span><span>in</span></div>
      <div className="ss-h-fouls">
        <div className="ss-h-fouls-top">Fouls</div>
        <div className="ss-h-fouls-nums">
          <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
        </div>
      </div>
    </div>
  );
}

function SSPlayerRow({ p }) {
  const fouledOut = (p.fouls || []).filter(f => f).length >= 5;
  return (
    <div className="ss-tbox__plyrow" data-fouled-out={fouledOut ? "true" : "false"}>
      <div className="ss-c-licence">{p.licenceNo || ""}</div>
      <div className="ss-c-name">{p.name || ""}</div>
      <div className="ss-c-no">{p.no || ""}</div>
      <div className="ss-c-pin">{p.playerIn || ""}</div>
      {p.fouls.map((f, i) => (
        <div key={i} className="ss-c-foul">{f}</div>
      ))}
    </div>
  );
}

// ------------------------------------------------------------
// TeamBox — full team panel
// ------------------------------------------------------------
function SSTeamBox({ label, name, players, coach, asst, timeoutsUsed, teamFouls }) {
  const rows = [...players];
  while (rows.length < 12) {
    rows.push({ licenceNo: "", name: "", no: "", playerIn: "", fouls: ["","","","",""] });
  }
  return (
    <div className="ss-tbox">
      <div className="ss-tbox__head">
        <label className="pap-lbl">{label}</label>
        <div className="pap-u">{name}</div>
      </div>
      <div className="ss-tbox__tt">
        <div className="ss-tbox__to">
          <div className="ss-tbox__to-label">Time-outs</div>
          <SSTimeoutCells used={timeoutsUsed}/>
        </div>
        <SSTeamFouls teamFouls={teamFouls}/>
      </div>
      <SSPlayerHead/>
      <div className="ss-tbox__plybody">
        {rows.slice(0, 12).map((p, i) => <SSPlayerRow key={i} p={p}/>)}
      </div>
      <div className="ss-tbox__coach">
        <label className="pap-lbl">Coach</label>
        <div className="pap-u">{coach}</div>
      </div>
      <div className="ss-tbox__coach">
        <label className="pap-lbl">Assistant Coach</label>
        <div className="pap-u">{asst}</div>
      </div>
    </div>
  );
}

Object.assign(window, { SSField, SSHeader, SSNames, SSMeta, SSTeamBox });
