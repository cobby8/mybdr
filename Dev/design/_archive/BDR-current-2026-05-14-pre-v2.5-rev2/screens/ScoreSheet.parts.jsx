// ============================================================
// ScoreSheet — main page (FIBA-paper 정합 시안)
// AppNav 미포함 (route group `(score-sheet)` 격리)
// ============================================================

function SSField({ label, value, grow = 1 }) {
  return (
    <div className="ss-field" data-grow={grow}>
      <label>{label}</label>
      <div className="ss-field__v">{value || "\u00A0"}</div>
    </div>
  );
}

// ------------------------------------------------------------
// Header — BDR 로고 + 3줄 타이틀 (FIBA 페이퍼 정합 구조 / BDR 자체 카피)
// ------------------------------------------------------------
function SSHeader() {
  return (
    <section className="ss-h">
      <div className="ss-h__logo">
        <div className="ss-h__logo-mark">
          <span className="material-symbols-outlined">sports_basketball</span>
        </div>
        <div className="ss-h__logo-text">
          <strong>BDR</strong>
          SCORE
        </div>
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
// Team Names strip — "Team A ___ Team B ___" 1줄 (페이퍼 정합)
// ------------------------------------------------------------
function SSNames({ teamA, teamB }) {
  return (
    <section className="ss-names">
      <div className="ss-names__cell">
        <label>Team A</label>
        <span>{teamA}</span>
      </div>
      <div className="ss-names__cell">
        <label>Team B</label>
        <span>{teamB}</span>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// Meta — Competition / Date / Time / Game No / Place / Referee / Umpire 1/2
// ------------------------------------------------------------
function SSMeta({ m }) {
  return (
    <section className="ss-meta">
      <div className="ss-meta__l">
        <div className="ss-meta__row">
          <SSField label="Competition" value={m.competitionName} grow={2}/>
          <SSField label="Date" value={m.date}/>
          <SSField label="Time" value={m.time}/>
        </div>
        <div className="ss-meta__row">
          <SSField label="Game No." value={m.gameNo}/>
          <SSField label="Place" value={m.place} grow={3}/>
        </div>
      </div>
      <div className="ss-meta__r">
        <div className="ss-meta__row">
          <SSField label="Referee" value={m.referee} grow={2}/>
        </div>
        <div className="ss-meta__row">
          <SSField label="Umpire 1" value={m.umpire1}/>
          <SSField label="Umpire 2" value={m.umpire2}/>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------
// TeamBox — Time-outs + Team fouls + Players(12) + Coach/Asst
// ------------------------------------------------------------
function SSTimeoutCells({ used }) {
  // FIBA 전반 timeout 2회
  return (
    <div className="ss-tbox__to-cells">
      {[0, 1].map(i => (
        <div key={i} className="ss-tbox__to-cell" data-used={i < used ? "true" : "false"}>
          {i < used ? "✓" : ""}
        </div>
      ))}
    </div>
  );
}

function SSTeamFoulRow({ pNumLeft, leftCount, pNumRight, rightCount }) {
  const renderCells = (count) => {
    return [1, 2, 3, 4].map(n => {
      const on = n <= count;
      const bonus = n === 5 || count >= 5;
      return (
        <div key={n}
             className="ss-tbox__tf-cell"
             data-on={on ? "true" : "false"}
             data-bonus={on && count >= 5 ? "true" : "false"}>
          {n}
        </div>
      );
    });
  };
  return (
    <div className="ss-tbox__tf-row">
      <div className="ss-tbox__tf-q">
        <span className="ss-tbox__tf-q-num">{pNumLeft}</span>
        <div className="ss-tbox__tf-cells">{renderCells(leftCount)}</div>
      </div>
      <div className="ss-tbox__tf-q">
        <span className="ss-tbox__tf-q-num">{pNumRight}</span>
        <div className="ss-tbox__tf-cells">{renderCells(rightCount)}</div>
      </div>
    </div>
  );
}

function SSTeamBoxHead({ label, name, timeoutsUsed, teamFouls }) {
  return (
    <>
      <div className="ss-tbox__head">
        <label>{label}</label>
        <span>{name}</span>
      </div>
      <div className="ss-tbox__tt">
        <div className="ss-tbox__to">
          <div className="ss-tbox__to-label">Time-outs</div>
          <SSTimeoutCells used={timeoutsUsed}/>
        </div>
        <div className="ss-tbox__tf">
          <div className="ss-tbox__tf-label">Team fouls</div>
          <div className="ss-tbox__tf-row">
            <span style={{font:'700 9px/1 var(--ff-display)', width:40}}>Period</span>
            <SSTeamFoulRow pNumLeft="①" leftCount={teamFouls.Q1} pNumRight="②" rightCount={teamFouls.Q2}/>
          </div>
          <div className="ss-tbox__tf-row">
            <span style={{font:'700 9px/1 var(--ff-display)', width:40}}>Period</span>
            <SSTeamFoulRow pNumLeft="③" leftCount={teamFouls.Q3} pNumRight="④" rightCount={teamFouls.Q4}/>
          </div>
          <div className="ss-tbox__tf-row" style={{marginTop:1}}>
            <span style={{font:'700 9px/1 var(--ff-display)'}}>Extra periods</span>
            <div className="ss-tbox__tf-cells">
              {[1,2,3,4].map(n => {
                const on = n <= teamFouls.extra;
                return <div key={n} className="ss-tbox__tf-cell" data-on={on?"true":"false"}>{n}</div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function SSPlayerHead() {
  return (
    <div className="ss-tbox__plyhead">
      <div>Licence<br/>no.</div>
      <div style={{justifyContent:'flex-start'}}>Players</div>
      <div>No.</div>
      <div>Player<br/>in</div>
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
  const fouledOut = p.fouls.filter(f => f).length >= 5;
  return (
    <div className="ss-tbox__plyrow" data-fouled-out={fouledOut ? "true" : "false"}>
      <div style={{justifyContent:'center', fontFamily:'var(--ff-mono)', fontSize:9, color:'var(--ss-paper-mute)'}}>{p.licenceNo || ""}</div>
      <div className="ss-c-name">{p.name}</div>
      <div className="ss-c-no">{p.no}</div>
      <div className="ss-c-pin">{p.playerIn || ""}</div>
      {p.fouls.map((f, i) => (
        <div key={i} className="ss-c-foul">{f}</div>
      ))}
    </div>
  );
}

function SSTeamBox({ label, name, players, coach, asst, timeoutsUsed, teamFouls }) {
  // pad to exactly 12 rows
  const rows = [...players];
  while (rows.length < 12) {
    rows.push({ licenceNo: "", name: "", no: "", playerIn: "", fouls: ["","","","",""] });
  }
  return (
    <div className="ss-tbox">
      <SSTeamBoxHead label={label} name={name} timeoutsUsed={timeoutsUsed} teamFouls={teamFouls}/>
      <SSPlayerHead/>
      <div className="ss-tbox__plybody">
        {rows.slice(0, 12).map((p, i) => <SSPlayerRow key={i} p={p}/>)}
      </div>
      <div className="ss-tbox__coach">
        <label>Coach</label>
        <div className="ss-tbox__coach-v">{coach}</div>
        <label>Asst. Coach</label>
        <div className="ss-tbox__coach-v">{asst}</div>
      </div>
    </div>
  );
}

Object.assign(window, { SSField, SSHeader, SSNames, SSMeta, SSTeamBox });
