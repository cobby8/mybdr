/* global React, window */
// ============================================================
// schedule.jsx — 일정 패널 (대진표 생성 전에도 일정 작성 가능)
//   · 종별 경기 시간(분) · 코트별 시작 시간을 각각 설정
//   · 일정 자동 생성: 모달 — 일자/코트별 종별 + 예선/토너먼트 배정 (한 코트 2종별 가능)
//   · 직접 배치: 모달 — 종별·날짜·코트 선택 → 해당 종별 경기를 시간표에 드래그 배치
//   · 드래그앤드롭 순서 변경 · 휴식시간 삽입 · 시작시간 변경. 스코어/상태 없음.
//   · 경기번호 = 코트영문약어 + 날짜 + 순번. 대진 홈/어웨이 분리.
// ============================================================
(function () {
  const { useState, useMemo } = React;
  const { Icon, Btn, Modal } = window;
  const WS = window.WS;

  const CHO = ["G", "KK", "N", "D", "TT", "R", "M", "B", "PP", "S", "SS", "", "J", "JJ", "CH", "K", "T", "P", "H"];
  function choLatin(ch) {
    const code = ch.charCodeAt(0) - 0xac00;
    if (code < 0 || code > 11171) return ch.toUpperCase();
    return CHO[Math.floor(code / 588)] || "";
  }
  function venueAbbrev(name) {
    const cleaned = name.replace(/(학생체육관|국민체육센터|문화체육관|체육관|체육센터|초등학교|중학교|고등학교|대학교|학교|센터|관)$/, "");
    const syl = [...cleaned].filter(c => c >= "가" && c <= "힣").slice(0, 2);
    let ab = syl.map(s => (choLatin(s)[0] || "")).join("");
    if (!ab) ab = cleaned.slice(0, 2).toUpperCase();
    return ab.toUpperCase();
  }
  const addTime = (hhmm, addMin) => {
    const [h, m] = (hhmm || "09:00").split(":").map(Number);
    const t = h * 60 + m + addMin;
    return String(Math.floor(t / 60) % 24).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
  };
  const isGroup = (g) => (g.phase || "").indexOf("예선") >= 0 || (g.phase || "").indexOf("리그") >= 0;
  const phaseTag = (g) => isGroup(g) ? "예선" : "토너먼트";
  // 세부 태그: 조별예선은 "A조 1경기", 토너먼트는 라운드명(8강/4강/결승)
  const subTag = (g) => g.glabel ? g.glabel : (isGroup(g) ? "예선" : (g.phase || "토너먼트"));

  function buildLanes() {
    const venues = WS.form.venues, dates = WS.form.dates;
    const vmap = {}; venues.forEach(v => { vmap[v.id] = v; });
    const lanes = [];
    dates.forEach(d => {
      d.courtIds.forEach(cid => {
        const [vid, cpart] = cid.split("_c");
        const v = vmap[vid]; if (!v) return;
        const ci = +cpart;
        lanes.push({
          key: cid + "@" + d.id,
          date: d.date, mmdd: d.date.slice(5).replace("-", ""),
          venueName: v.name, courtNo: ci + 1, abbrev: venueAbbrev(v.name) + (ci + 1),
        });
      });
    });
    return lanes;
  }

  // 종별 경기/슬롯 — 대진표(window.__BRACKET) 발행분 우선, 없으면 조별 round-robin
  function buildGames(rule) {
    const bk = window.__BRACKET && window.__BRACKET[rule.code];
    if (bk && bk.games && bk.games.length) {
      const slotName = Object.assign({}, bk.slotName || {});
      return { games: bk.games.map(g => ({ gid: g.gid, home: g.home, away: g.away, code: rule.code, phase: g.phase, group: g.group, gnum: g.gnum, glabel: g.glabel })), slotName };
    }
    const approved = WS.teams.filter(t => t.category === rule.code && t.status === "approved");
    const names = approved.map(t => t.name);
    const groupCount = Math.max(rule.settings?.group_count || 1, 1);
    const n = Math.max(approved.length, groupCount * 2, 4);
    const perGroup = Math.max(Math.min(Math.ceil(n / groupCount), 4), 2);
    const games = []; const slotName = {}; let ti = 0;
    for (let g = 0; g < groupCount; g++) {
      const L = String.fromCharCode(65 + g);
      for (let s = 1; s <= perGroup; s++) { slotName[L + s] = names[ti] || null; ti++; }
      const rr = window.balancedRR ? window.balancedRR(L, perGroup) : [];
      rr.forEach((pr, k) => games.push({ gid: `${rule.code}-G-${L}-${k + 1}`, home: pr.home, away: pr.away, code: rule.code, phase: "조별예선", group: L, gnum: k + 1, glabel: `${L}조 ${k + 1}경기` }));
    }
    return { games, slotName };
  }

  window.SchedulePanel = function SchedulePanel() {
    const lanes = useMemo(buildLanes, []);
    const rules = WS.divisionRules;
    const ruleLabel = useMemo(() => Object.fromEntries(rules.map(r => [r.code, r.label])), [rules]);
    const [bkTick, setBkTick] = useState(0);
    React.useEffect(() => {
      const h = () => setBkTick(t => t + 1);
      window.addEventListener("bracket:publish", h);
      return () => window.removeEventListener("bracket:publish", h);
    }, []);

    const { allGames, slotMaps, gamesByDiv, countOf, fromBracket } = useMemo(() => {
      const ag = {}, sm = {}, gb = {}, co = {}, src = {};
      rules.forEach(r => {
        const { games, slotName } = buildGames(r);
        sm[r.code] = slotName; gb[r.code] = games; co[r.code] = games.length;
        src[r.code] = !!(window.__BRACKET && window.__BRACKET[r.code]);
        games.forEach(g => ag[g.gid] = g);
      });
      return { allGames: ag, slotMaps: sm, gamesByDiv: gb, countOf: co, fromBracket: src };
    }, [bkTick]);
    const bracketDivs = rules.filter(r => fromBracket[r.code]);

    // 종별 경기 시간(분) · 코트별 시작 시간
    const [divDur, setDivDur] = useState(() => Object.fromEntries(rules.map(r => [r.code, 40])));
    const [laneStart, setLaneStart] = useState(() => Object.fromEntries(lanes.map((l, i) => [l.key, i === 0 ? "09:00" : i === 1 ? "09:30" : "10:00"])));
    const durOf = (code) => divDur[code] || 40;

    const [assign, setAssign] = useState({});   // laneKey -> [{t:'g',gid,code}|{t:'b',min}]
    const [showName, setShowName] = useState(false);
    const [drag, setDrag] = useState(null);     // {kind:'row',lane,idx} | {kind:'pool',gid,code}
    const [autoOpen, setAutoOpen] = useState(false);
    const [manOpen, setManOpen] = useState(false);
    const [msg, setMsg] = useState(null);
    const toast = (m) => { setMsg(m); clearTimeout(window.__sc_t); window.__sc_t = setTimeout(() => setMsg(null), 2200); };

    const labelOf = (gid, slot) => {
      const g = allGames[gid]; if (!g) return slot;
      const nm = slotMaps[g.code]?.[slot];
      return showName && nm ? nm : slot;
    };

    // ── 드래그 이동 (행 재정렬 + 풀에서 삽입) ──
    const move = (toLane, toIdx) => {
      if (!drag) return;
      if (drag.kind === "pool") {
        setAssign(a => {
          const dst = [...(a[toLane] || [])];
          const idx = toIdx == null ? dst.length : toIdx;
          dst.splice(idx < 0 ? dst.length : idx, 0, { t: "g", gid: drag.gid, code: drag.code });
          return { ...a, [toLane]: dst };
        });
        setDrag(null); return;
      }
      setAssign(a => {
        const src = [...(a[drag.lane] || [])];
        const [item] = src.splice(drag.idx, 1);
        if (drag.lane === toLane) {
          let idx = toIdx == null ? src.length : toIdx;
          if (drag.idx < toIdx) idx -= 1;
          src.splice(idx < 0 ? src.length : idx, 0, item);
          return { ...a, [toLane]: src };
        }
        const dst = [...(a[toLane] || [])];
        const idx = toIdx == null ? dst.length : toIdx;
        dst.splice(idx < 0 ? dst.length : idx, 0, item);
        return { ...a, [drag.lane]: src, [toLane]: dst };
      });
      setDrag(null);
    };
    const insertBreak = (laneKey) => setAssign(a => ({ ...a, [laneKey]: [...(a[laneKey] || []), { t: "b", min: 10 }] }));
    const setBreakMin = (laneKey, idx, min) => setAssign(a => { const arr = [...a[laneKey]]; arr[idx] = { ...arr[idx], min }; return { ...a, [laneKey]: arr }; });
    const removeItem = (laneKey, idx) => setAssign(a => { const arr = [...a[laneKey]]; arr.splice(idx, 1); return { ...a, [laneKey]: arr }; });
    const clearAll = () => { setAssign({}); toast("일정 초기화"); };

    const placedGids = useMemo(() => {
      const s = new Set();
      Object.values(assign).forEach(arr => arr.forEach(it => { if (it.t === "g") s.add(it.gid); }));
      return s;
    }, [assign]);
    const placed = placedGids.size;
    const lanesWith = lanes.filter(l => (assign[l.key] || []).length);

    // ── 자동 생성 (모달에서 확정) ──
    const runAuto = (sel) => {
      // sel: laneKey -> [{code, phase:'all'|'group'|'ko'}]
      const next = {}; lanes.forEach(l => next[l.key] = []);
      let total = 0;
      rules.forEach(rule => {
        const games = gamesByDiv[rule.code] || [];
        ["group", "ko"].forEach(ph => {
          const targets = lanes.filter(l => (sel[l.key] || []).some(s => s.code === rule.code && (s.phase === "all" || s.phase === ph)));
          if (!targets.length) return;
          const gs = games.filter(g => (ph === "group" ? isGroup(g) : !isGroup(g)));
          gs.forEach((g, i) => { next[targets[i % targets.length].key].push({ t: "g", gid: g.gid, code: rule.code }); total++; });
        });
      });
      setAssign(next); setAutoOpen(false);
      toast(total ? `${total}경기 자동 생성(시연)` : "배정된 종별이 없습니다");
    };

    return (
      <div>
        {/* ── 설정 카드 ─────────────────────────────── */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          {bracketDivs.length > 0 && (
            <div className="bk-fromnote"><Icon name="git-merge" size={15} color="var(--primary)" /><span>대진표 반영됨 — {bracketDivs.map(r => `${r.label} ${countOf[r.code]}경기`).join(" · ")} (조별예선+토너먼트)</span></div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span className="ct-headicon"><Icon name="calendar-clock" size={18} /></span>
              <div><h3 style={{ fontSize: 14 }}>경기 시간 · 코트 시작 시간</h3><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>종별 경기 시간과 코트별 시작 시간을 정한 뒤 자동 생성하거나 직접 배치하세요</p></div>
            </div>
            <label className="ct-checkrow" style={{ margin: 0 }}><window.Check on={showName} onChange={setShowName} /><span style={{ fontSize: 13 }}>추첨 결과 반영(팀명 표기)</span></label>
          </div>

          {/* 종별 경기 시간 */}
          <span className="ts-field__label" style={{ display: "block", marginBottom: 6 }}>종별 경기 시간(분)</span>
          <div className="sc-durgrid">
            {rules.map(r => (
              <div key={r.code} className="sc-durcell">
                <span className="sc-durcell__lbl">{r.label}</span>
                <input className="ts-input" type="number" min={5} step={5} value={divDur[r.code]} onChange={e => setDivDur(d => ({ ...d, [r.code]: +e.target.value || 0 }))} />
                <span className="sc-durcell__cnt">{countOf[r.code]}경기</span>
              </div>
            ))}
          </div>

          {/* 코트별 시작 시간 */}
          <span className="ts-field__label" style={{ display: "block", margin: "14px 0 6px" }}>코트별 시작 시간</span>
          <div className="sc-durgrid">
            {lanes.map(l => (
              <div key={l.key} className="sc-durcell">
                <span className="sc-lane-court" style={{ flex: "0 0 auto" }}>{l.abbrev}</span>
                <input className="ts-input" type="time" value={laneStart[l.key]} onChange={e => setLaneStart(s => ({ ...s, [l.key]: e.target.value }))} />
                <span className="sc-durcell__cnt" style={{ whiteSpace: "nowrap" }}>{l.mmdd.slice(0, 2)}.{l.mmdd.slice(2)}</span>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>전체 {Object.values(countOf).reduce((a, b) => a + b, 0)}경기 · 코트 {lanes.length}면{placed ? ` · 배정 ${placed}경기` : ""}</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {placed > 0 && <Btn variant="secondary" size="sm" icon="rotate-ccw" onClick={clearAll}>초기화</Btn>}
              <Btn variant="secondary" size="sm" icon="hand" onClick={() => setManOpen(true)}>직접 배치</Btn>
              <Btn size="sm" icon="wand-2" onClick={() => setAutoOpen(true)}>일정 자동 생성</Btn>
            </div>
          </div>
        </div>

        {/* ── 코트별 일정표 ───────────────────────────── */}
        {placed === 0 ? (
          <div className="ct-emptybox">
            <Icon name="calendar-clock" size={36} color="var(--ink-dim)" />
            <b style={{ color: "var(--ink)" }}>아직 작성된 일정이 없습니다</b>
            <span><b>일정 자동 생성</b>으로 일자·코트별 종별을 배정하거나, <b>직접 배치</b>로 경기를 끌어 놓으세요.</span>
          </div>
        ) : lanesWith.map(l => {
          const arr = assign[l.key] || [];
          let cursor = laneStart[l.key]; let gameSeq = 0;
          const rows = arr.map((it, idx) => {
            const time = cursor;
            cursor = addTime(cursor, it.t === "g" ? durOf(it.code) : it.min);
            if (it.t === "g") {
              gameSeq++;
              const g = allGames[it.gid] || { home: "?", away: "?", code: it.code };
              const no = `${l.abbrev}-${l.mmdd}-${String(gameSeq).padStart(2, "0")}`;
              return { it, idx, time, no, g };
            }
            return { it, idx, time, brk: true };
          });
          return (
            <div key={l.key} style={{ marginBottom: 18 }}>
              <div className="sc-lane-head">
                <span className="sc-lane-court">{l.abbrev}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <b style={{ fontSize: 14 }}>{l.date} · {l.venueName} {l.courtNo}번 코트</b>
                  <span style={{ display: "block", fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{gameSeq}경기 · 시작 {laneStart[l.key]}</span>
                </div>
                <Btn variant="ghost" size="sm" icon="coffee" onClick={() => insertBreak(l.key)}>휴식</Btn>
              </div>
              <div className="amt-table-wrap"><table className="amt-table sc-table">
                <thead><tr>
                  <th style={{ width: 34 }}></th>
                  <th>경기번호</th>
                  <th style={{ width: 132 }}>종별</th>
                  <th style={{ width: 64 }}>시간</th>
                  <th style={{ textAlign: "right" }}>홈</th>
                  <th style={{ width: 26 }}></th>
                  <th style={{ textAlign: "left" }}>어웨이</th>
                  <th style={{ width: 34 }}></th>
                </tr></thead>
                <tbody>
                  {rows.map(({ it, idx, time, no, g, brk }) => brk ? (
                    <tr key={idx} draggable onDragStart={() => setDrag({ kind: "row", lane: l.key, idx })} onDragOver={e => e.preventDefault()} onDrop={() => move(l.key, idx)} className="sc-break">
                      <td className="sc-handle"><Icon name="grip-vertical" size={15} color="var(--ink-dim)" /></td>
                      <td colSpan={3} style={{ color: "var(--ink-mute)", fontWeight: 700, fontSize: 12.5 }}><Icon name="coffee" size={14} /> 휴식 {time}</td>
                      <td colSpan={3}>
                        <select className="sc-brkmin" value={it.min} onChange={e => setBreakMin(l.key, idx, +e.target.value)}>
                          {[5, 10, 15, 20, 30].map(m => <option key={m} value={m}>{m}분</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: "center" }}><button className="sc-del" onClick={() => removeItem(l.key, idx)}><Icon name="x" size={14} /></button></td>
                    </tr>
                  ) : (
                    <tr key={idx} draggable onDragStart={() => setDrag({ kind: "row", lane: l.key, idx })} onDragOver={e => e.preventDefault()} onDrop={() => move(l.key, idx)}
                      className={drag && drag.kind === "row" && drag.lane === l.key && drag.idx === idx ? "sc-dragging" : ""}>
                      <td className="sc-handle"><Icon name="grip-vertical" size={15} color="var(--ink-dim)" /></td>
                      <td className="amt-table__court" style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>{no}</td>
                      <td><span className="sc-divtag" data-ko={!isGroup(g)}>{ruleLabel[g.code]}<i>{subTag(g)}</i></span></td>
                      <td className="amt-table__time">{time}</td>
                      <td style={{ fontWeight: 600, textAlign: "right" }}>{labelOf(it.gid, g.home)}</td>
                      <td style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 12 }}>대</td>
                      <td style={{ fontWeight: 600, textAlign: "left" }}>{labelOf(it.gid, g.away)}</td>
                      <td style={{ textAlign: "center" }}><button className="sc-del" onClick={() => removeItem(l.key, idx)}><Icon name="x" size={14} /></button></td>
                    </tr>
                  ))}
                  <tr onDragOver={e => e.preventDefault()} onDrop={() => move(l.key, null)} className="sc-droptail">
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 12, padding: "8px" }}>여기로 끌어 이 코트 마지막에 배치</td>
                  </tr>
                </tbody>
              </table></div>
            </div>
          );
        })}

        {autoOpen && <AutoModal lanes={lanes} rules={rules} countOf={countOf} gamesByDiv={gamesByDiv} onClose={() => setAutoOpen(false)} onRun={runAuto} />}
        {manOpen && <ManualModal lanes={lanes} rules={rules} gamesByDiv={gamesByDiv} allGames={allGames} slotMaps={slotMaps} ruleLabel={ruleLabel}
          divDur={divDur} setDivDur={setDivDur} laneStart={laneStart} setLaneStart={setLaneStart}
          assign={assign} placedGids={placedGids} drag={drag} setDrag={setDrag} move={move} insertBreak={insertBreak} setBreakMin={setBreakMin} removeItem={removeItem}
          durOf={durOf} onClose={() => setManOpen(false)} />}
        {msg && <div className="ts-toast"><Icon name="check" size={16} />{msg}</div>}
      </div>
    );
  };

  // ── 자동 생성 모달 ──────────────────────────────────
  function AutoModal({ lanes, rules, countOf, gamesByDiv, onClose, onRun }) {
    const [sel, setSel] = useState({});  // laneKey -> [{code, phase}]
    const cyc = (laneKey, code) => setSel(s => {
      const cur = s[laneKey] || [];
      const ex = cur.find(x => x.code === code);
      let nextEntry;
      if (!ex) nextEntry = { code, phase: "all" };
      else if (ex.phase === "all") nextEntry = { code, phase: "group" };
      else if (ex.phase === "group") nextEntry = { code, phase: "ko" };
      else nextEntry = null;  // 해제
      const rest = cur.filter(x => x.code !== code);
      return { ...s, [laneKey]: nextEntry ? [...rest, nextEntry] : rest };
    });
    const hasKo = (code) => (gamesByDiv[code] || []).some(g => !isGroup(g));
    const total = lanes.reduce((s, l) => s + ((sel[l.key] || []).length), 0);
    const phaseLbl = { all: "전체", group: "예선", ko: "토너먼트" };

    return (
      <Modal open onClose={onClose} title="일정 자동 생성" sub="일자·코트별로 운영 종별과 예선/토너먼트를 배정하세요. 한 코트에 두 종별도 가능합니다."
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="wand-2" onClick={() => onRun(sel)} {...(total ? {} : { disabled: true })}>{total ? "배정 생성" : "종별 선택"}</Btn></>}>
        <div className="sc-automx">
          {lanes.map(l => (
            <div key={l.key} className="sc-autorow">
              <div className="sc-autorow__lane">
                <span className="sc-lane-court">{l.abbrev}</span>
                <div style={{ minWidth: 0 }}><b style={{ fontSize: 12.5 }}>{l.venueName} {l.courtNo}번</b><span style={{ display: "block", fontSize: 11, color: "var(--ink-mute)" }}>{l.date}</span></div>
              </div>
              <div className="sc-autorow__chips">
                {rules.map(r => {
                  const ex = (sel[l.key] || []).find(x => x.code === r.code);
                  return (
                    <button key={r.code} className="sc-divchip" data-on={!!ex} onClick={() => cyc(l.key, r.code)} title={hasKo(r.code) ? "클릭: 전체→예선→토너먼트→해제" : "클릭: 선택/해제"}>
                      {ex && <Icon name="check" size={12} />}{r.label}{ex && hasKo(r.code) ? <i style={{ fontStyle: "normal", opacity: .8, marginLeft: 4 }}>· {phaseLbl[ex.phase]}</i> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11.5, color: "var(--ink-dim)", marginTop: 10 }}>토너먼트가 있는 종별은 칩을 반복 클릭해 전체 → 예선만 → 토너먼트만 → 해제 순으로 전환됩니다.</p>
      </Modal>
    );
  }

  // ── 직접 배치 모달 ──────────────────────────────────
  function ManualModal({ lanes, rules, gamesByDiv, allGames, slotMaps, ruleLabel, divDur, setDivDur, laneStart, setLaneStart, assign, placedGids, drag, setDrag, move, insertBreak, setBreakMin, removeItem, durOf, onClose }) {
    const { Icon, Btn } = window;
    const [code, setCode] = useState(rules[0]?.code);
    const dates = useMemo(() => [...new Set(lanes.map(l => l.date))], [lanes]);
    const [date, setDate] = useState(dates[0]);
    const courts = lanes.filter(l => l.date === date);
    const [laneKey, setLaneKey] = useState(courts[0]?.key);
    React.useEffect(() => { const c = lanes.filter(l => l.date === date); if (!c.find(x => x.key === laneKey)) setLaneKey(c[0]?.key); }, [date]);
    const lane = lanes.find(l => l.key === laneKey);

    const pool = (gamesByDiv[code] || []).filter(g => !placedGids.has(g.gid));
    const arr = assign[laneKey] || [];
    let cursor = lane ? laneStart[lane.key] : "09:00"; let seq = 0;
    const rows = arr.map((it, idx) => {
      const time = cursor; cursor = addTime(cursor, it.t === "g" ? durOf(it.code) : it.min);
      if (it.t === "g") { seq++; const g = allGames[it.gid] || {}; return { it, idx, time, seq, g }; }
      return { it, idx, time, brk: true };
    });
    const nameOf = (gid, slot) => { const g = allGames[gid]; const nm = g && slotMaps[g.code]?.[slot]; return nm || slot; };

    return (
      <Modal open onClose={onClose} title="직접 배치" sub="종별·날짜·코트를 고르고, 경기를 시간표로 끌어 배치하세요." maxWidth={880}
        foot={<Btn onClick={onClose}>완료</Btn>}>
        {/* 선택 바 */}
        <div className="sc-manbar">
          <div><span className="ts-field__label">종별</span><div className="sc-manchips">{rules.map(r => <button key={r.code} className="sc-divchip" data-on={r.code === code} onClick={() => setCode(r.code)}>{r.code === code && <Icon name="check" size={12} />}{r.label}</button>)}</div></div>
          <div><span className="ts-field__label">날짜</span><div className="sc-manchips">{dates.map(d => <button key={d} className="sc-divchip" data-on={d === date} onClick={() => setDate(d)}>{d.slice(5)}</button>)}</div></div>
          <div><span className="ts-field__label">코트</span><div className="sc-manchips">{courts.map(l => <button key={l.key} className="sc-divchip" data-on={l.key === laneKey} onClick={() => setLaneKey(l.key)}>{l.abbrev}</button>)}</div></div>
        </div>
        {/* 사전 설정 */}
        <div className="sc-manset">
          <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">{ruleLabel[code]} 경기 시간(분)</span>
            <input className="ts-input" type="number" min={5} step={5} value={divDur[code]} onChange={e => setDivDur(d => ({ ...d, [code]: +e.target.value || 0 }))} /></label>
          <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">{lane?.abbrev} 시작 시간</span>
            <input className="ts-input" type="time" value={lane ? laneStart[lane.key] : ""} onChange={e => lane && setLaneStart(s => ({ ...s, [lane.key]: e.target.value }))} /></label>
        </div>

        <div className="sc-manwrap">
          {/* 좌: 미배치 경기 풀 */}
          <div className="sc-manpool">
            <h4 className="bk-subh">{ruleLabel[code]} 미배치 경기 ({pool.length})</h4>
            {pool.length === 0 ? <p style={{ fontSize: 12, color: "var(--ink-dim)", padding: "8px 2px" }}>모든 경기가 배치되었습니다.</p> : (
              <div className="sc-poollist">
                {pool.map(g => (
                  <div key={g.gid} className="sc-poolcard" draggable onDragStart={() => setDrag({ kind: "pool", gid: g.gid, code })}>
                    <Icon name="grip-vertical" size={14} color="var(--ink-dim)" />
                    <span className="sc-divtag" data-ko={!isGroup(g)} style={{ flex: "0 0 auto" }}><i>{subTag(g)}</i></span>
                    <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 0 }}>{nameOf(g.gid, g.home)} <b style={{ color: "var(--ink-dim)", fontWeight: 500 }}>대</b> {nameOf(g.gid, g.away)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* 우: 코트 시간표 (드롭) */}
          <div className="sc-manlane">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h4 className="bk-subh" style={{ margin: 0 }}>{lane?.abbrev} · {lane?.venueName} {lane?.courtNo}번 · {date.slice(5)}</h4>
              <Btn variant="ghost" size="sm" icon="coffee" onClick={() => insertBreak(laneKey)}>휴식</Btn>
            </div>
            <div className="sc-mandrop" onDragOver={e => e.preventDefault()} onDrop={() => move(laneKey, null)}>
              {rows.length === 0 && <div className="sc-manempty">좌측 경기를 여기로 끌어 놓으세요</div>}
              {rows.map(({ it, idx, time, seq, g, brk }) => brk ? (
                <div key={idx} className="sc-manitem sc-manitem--brk" draggable onDragStart={() => setDrag({ kind: "row", lane: laneKey, idx })} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); move(laneKey, idx); }}>
                  <Icon name="coffee" size={14} color="var(--ink-mute)" /><b style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>휴식 {time}</b>
                  <select className="sc-brkmin" value={it.min} onChange={e => setBreakMin(laneKey, idx, +e.target.value)} style={{ marginLeft: "auto" }}>{[5, 10, 15, 20, 30].map(m => <option key={m} value={m}>{m}분</option>)}</select>
                  <button className="sc-del" onClick={() => removeItem(laneKey, idx)}><Icon name="x" size={13} /></button>
                </div>
              ) : (
                <div key={idx} className="sc-manitem" draggable onDragStart={() => setDrag({ kind: "row", lane: laneKey, idx })} onDragOver={e => e.preventDefault()} onDrop={e => { e.stopPropagation(); move(laneKey, idx); }}>
                  <span className="sc-manitem__no">{lane.abbrev}-{lane.mmdd}-{String(seq).padStart(2, "0")}</span>
                  <span className="sc-manitem__time">{time}</span>
                  <span className="sc-divtag" data-ko={!isGroup(g)} style={{ flex: "0 0 auto" }}><i>{subTag(g)}</i></span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, minWidth: 0, flex: 1 }}>{nameOf(it.gid, g.home)} <b style={{ color: "var(--ink-dim)", fontWeight: 500 }}>대</b> {nameOf(it.gid, g.away)}</span>
                  <button className="sc-del" onClick={() => removeItem(laneKey, idx)}><Icon name="x" size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    );
  }
})();
