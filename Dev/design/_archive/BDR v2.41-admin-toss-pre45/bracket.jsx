/* global React, window */
// ============================================================
// bracket.jsx — 대진표 패널 (full) · Toss 역박제
//   · 대회방식 / 조 수 / 조별 팀수 / 본선 진출 팀수 확인·수정
//   · 조편성: 완전 랜덤 추첨 | 시드 배정(특정 조·슬롯) 후 나머지 랜덤
//   · 조편성 → 대회방식 따라 토너먼트 트리 자동 생성(드래그 수정)
//   · "일정에 반영" → window.__BRACKET 발행 → 일정 패널이 소비
//   모든 동작 = mock 시연. function-lock-B1.md E 준수.
// ============================================================
(function () {
  const { useState, useMemo } = React;
  const { Icon, Btn, Badge } = window;
  const WS = window.WS;
  const FL = window.FORMAT_LABEL;

  function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => { setMsg(m); clearTimeout(window.__bk_t); window.__bk_t = setTimeout(() => setMsg(null), 2400); };
    return [show, msg ? <div className="ts-toast"><Icon name="check" size={16} />{msg}</div> : null];
  }
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const GL = (i) => String.fromCharCode(65 + i); // 0->A
  const roundName = (n) => ({ 2: "결승", 4: "4강", 8: "8강", 16: "16강", 32: "32강" }[n] || `${n}강`);

  // 조별 라운드로빈: 경우의 수를 순차(서클법)로 매긴 뒤, 홈/어웨이를
  // 같은 비율로 섞이도록 그리디 배정(홈 적은 팀이 홈). 1-indexed 슬롯.
  window.balancedRR = function balancedRR(L, size) {
    const m = size % 2 ? size + 1 : size;       // 홀수면 부전승(phantom) 추가
    const a = Array.from({ length: m }, (_, i) => i + 1);
    const pairings = [];
    for (let r = 0; r < m - 1; r++) {
      for (let i = 0; i < m / 2; i++) {
        const x = a[i], y = a[m - 1 - i];
        if (x <= size && y <= size) pairings.push([x, y]);
      }
      a.splice(1, 0, a.pop());                   // 1번 고정, 나머지 회전
    }
    const hc = {}; for (let t = 1; t <= size; t++) hc[t] = 0;
    return pairings.map(([x, y]) => {
      let home, away;
      if (hc[x] < hc[y]) { home = x; away = y; }
      else if (hc[y] < hc[x]) { home = y; away = x; }
      else if (Math.random() < 0.5) { home = x; away = y; }
      else { home = y; away = x; }
      hc[home]++;
      return { home: L + home, away: L + away };
    });
  };

  // 듀얼토너먼트 조별 미니 더블 엘리미네이션 (4팀 기준 5경기/조)
  //   1경기 L1대L4 · 2경기 L2대L3 · 승자전 · 패자전 · 조 최종전(2위 결정)
  //   승자전 승자 = 조 1위 / 최종전 승자 = 조 2위
  window.dualGroupStages = function dualGroupStages(L, size) {
    const g = [];
    g.push({ key: `${L}-1`, home: `${L}1`, away: `${L}${Math.min(size, 4)}`, stage: 1, label: `${L}조 1경기` });
    if (size >= 4) g.push({ key: `${L}-2`, home: `${L}2`, away: `${L}3`, stage: 1, label: `${L}조 2경기` });
    g.push({ key: `${L}-W`, home: `${L}조 1경기 승자`, away: `${L}조 2경기 승자`, stage: 1, label: `${L}조 승자전` });
    g.push({ key: `${L}-L`, home: `${L}조 1경기 패자`, away: `${L}조 2경기 패자`, stage: 1, label: `${L}조 패자전` });
    g.push({ key: `${L}-F`, home: `${L}조 승자전 패자`, away: `${L}조 패자전 승자`, stage: 2, label: `${L}조 최종전` });
    return g;
  };

  window.BracketPanel = function BracketPanel() {
    const rules = WS.divisionRules;
    const [divCode, setDivCode] = useState(rules[0]?.code);
    const rule = rules.find(r => r.code === divCode) || rules[0];
    const [toast, toastNode] = useToast();

    const teams = useMemo(() => WS.teams.filter(t => t.category === divCode && t.status === "approved"), [divCode]);

    // 종별별 상태 (설정 + 조편성 + 토너먼트)
    const [byDiv, setByDiv] = useState({});
    const st = byDiv[divCode];
    const patch = (p) => setByDiv(s => ({ ...s, [divCode]: { ...s[divCode], ...p } }));

    // 설정 초기값 (대회 생성에서 입력된 값 = rule.settings)
    const hasGroups = rule.format !== "single_elimination";
    const cfg = (st && st.cfg) || {
      format: rule.format,
      group_count: hasGroups ? Math.max(rule.settings?.group_count || 2, 1) : 1,
      group_size: rule.settings?.group_size || 4,
      advance_per_group: rule.settings?.advance_per_group || 2,
    };
    const setCfg = (p) => patch({ cfg: { ...cfg, ...p } });
    const grpCount = cfg.format === "single_elimination" ? 0 : cfg.group_count;
    const totalSlots = cfg.format === "single_elimination" ? Math.max(teams.length, 2) : cfg.group_count * cfg.group_size;

    // 슬롯 라벨: 조 모드 = A1,A2.../ 토너먼트 모드 = T1,T2...
    const slots = useMemo(() => {
      if (cfg.format === "single_elimination") return Array.from({ length: totalSlots }, (_, i) => "T" + (i + 1));
      const out = [];
      for (let g = 0; g < cfg.group_count; g++) for (let s = 1; s <= cfg.group_size; s++) out.push(GL(g) + s);
      return out;
    }, [cfg.format, cfg.group_count, cfg.group_size, totalSlots]);

    const phase = (st && st.phase) || "config";        // config | seeding | drawn
    const seeds = (st && st.seeds) || {};              // slot -> teamName
    const assign = (st && st.assign) || null;          // slot -> teamName (확정)
    const leaves = (st && st.leaves) || null;          // 토너먼트 1라운드 슬롯 라벨 배열

    // ── 조편성 ──────────────────────────────────────────
    const fillRandom = (keepSeeds) => {
      const used = keepSeeds ? new Set(Object.values(seeds)) : new Set();
      const pool = shuffle(teams.map(t => t.name).filter(n => !used.has(n)));
      const a = {}; let pi = 0;
      slots.forEach(sl => {
        if (keepSeeds && seeds[sl]) { a[sl] = seeds[sl]; return; }
        a[sl] = pool[pi++] || null;
      });
      patch({ assign: a, phase: "drawn", leaves: buildLeaves(a) });
      toast(keepSeeds ? "시드 반영 + 나머지 랜덤 추첨 완료" : "완전 랜덤 추첨 완료");
    };

    const leagueOnly = cfg.format === "round_robin";   // 리그전 마무리 — 본선 진출/토너먼트 없음
    const isDual = cfg.format === "dual_tournament";   // 조별 더블엘리미 → 8강/4강/결승
    const noAdvance = cfg.format === "single_elimination" || leagueOnly;
    const grpGameCount = isDual ? window.dualGroupStages("A", cfg.group_size).length : cfg.group_size * (cfg.group_size - 1) / 2;

    // 본선 진출 라벨 → 토너먼트 1라운드 슬롯 배열(교차 시딩)
    function buildLeaves(a) {
      if (leagueOnly) return [];                       // 풀리그 = 리그전으로 마무리
      let quals;
      if (cfg.format === "single_elimination") {
        quals = slots.slice();
      } else if (isDual) {
        // 듀얼: 각 조 1위 먼저, 그 다음 각 조 2위 → 표준 교차 시 같은 조 1·2위가 1라운드에서 안 만남
        const byRank = [];
        for (let g = 0; g < cfg.group_count; g++) byRank.push(`${GL(g)} 1위`);
        for (let g = 0; g < cfg.group_count; g++) byRank.push(`${GL(g)} 2위`);
        quals = byRank;
      } else {
        const adv = Math.min(cfg.advance_per_group, cfg.group_size);
        const byRank = [];
        for (let r = 1; r <= adv; r++) for (let g = 0; g < cfg.group_count; g++) byRank.push(`${GL(g)} ${r}위`);
        quals = byRank; // [A1위,B1위,...,A2위,B2위,...]
      }
      // 2의 거듭제곱으로 BYE 패딩
      let size = 2; while (size < quals.length) size *= 2;
      const padded = quals.slice(); while (padded.length < size) padded.push("부전승");
      // 표준 교차: i vs size-1-i
      const order = [];
      for (let i = 0; i < size / 2; i++) { order.push(padded[i]); order.push(padded[size - 1 - i]); }
      return order;
    }

    const reset = () => { setByDiv(s => { const n = { ...s }; delete n[divCode]; return n; }); toast("초기화"); };

    // 시드 슬롯 선택 UI
    const [pickSlot, setPickSlot] = useState(null);
    const assignSeed = (sl, name) => { patch({ seeds: { ...seeds, [sl]: name } }); setPickSlot(null); };
    const clearSeed = (sl) => { const n = { ...seeds }; delete n[sl]; patch({ seeds: n }); };
    const seededNames = new Set(Object.values(seeds));

    // ── 토너먼트 드래그 스왑 ─────────────────────────────
    const [drag, setDrag] = useState(null);
    const swapLeaf = (to) => {
      if (drag == null || drag === to) { setDrag(null); return; }
      const L = leaves.slice(); [L[drag], L[to]] = [L[to], L[drag]]; patch({ leaves: L }); setDrag(null);
    };

    // ── 일정 반영 ────────────────────────────────────────
    const publish = () => {
      const a = assign || {};
      const games = []; const slotName = { ...a };
      if (isDual) {
        for (let g = 0; g < cfg.group_count; g++) {
          const L = GL(g);
          window.dualGroupStages(L, cfg.group_size).forEach((dg, k) => {
            games.push({ gid: `${divCode}-D-${dg.key}`, home: dg.home, away: dg.away, phase: dg.stage === 2 ? "조 최종전" : "조별 더블엘리미", group: L, gnum: k + 1, glabel: dg.label });
          });
        }
      } else if (cfg.format !== "single_elimination") {
        for (let g = 0; g < cfg.group_count; g++) {
          const L = GL(g);
          window.balancedRR(L, cfg.group_size).forEach((pr, k) => {
            games.push({ gid: `${divCode}-G-${L}-${k + 1}`, home: pr.home, away: pr.away, phase: "조별예선", group: L, gnum: k + 1, glabel: `${L}조 ${k + 1}경기` });
          });
        }
      }
      // 토너먼트: leaves 기준 1라운드 + 상위 라운드 (라벨만)
      let cur = (leaves || []).slice();
      let rnd = 1;
      while (cur.length >= 2) {
        const rn = roundName(cur.length);
        for (let i = 0; i < cur.length; i += 2) {
          slotName[cur[i]] = a[cur[i]] || slotName[cur[i]] || cur[i];
          slotName[cur[i + 1]] = a[cur[i + 1]] || slotName[cur[i + 1]] || cur[i + 1];
          games.push({ gid: `${divCode}-KO${rnd}-${i / 2 + 1}`, home: cur[i], away: cur[i + 1], phase: rn });
        }
        cur = cur.filter((_, i) => i % 2 === 0).map((_, i) => `${rn} 승${i + 1}`);
        rnd++;
      }
      window.__BRACKET = window.__BRACKET || {};
      window.__BRACKET[divCode] = { games, slotName, label: rule.label };
      window.dispatchEvent(new CustomEvent("bracket:publish", { detail: { code: divCode, count: games.length } }));
      toast(`${rule.label} ${games.length}경기 일정 반영(시연)`);
    };

    // 토너먼트 라운드 구조 (렌더용)
    const rounds = useMemo(() => {
      if (!leaves) return [];
      const out = []; let cur = leaves.slice();
      while (cur.length >= 2) {
        const rn = roundName(cur.length);
        const ms = [];
        for (let i = 0; i < cur.length; i += 2) ms.push({ a: cur[i], b: cur[i + 1], ia: i, ib: i + 1, first: out.length === 0 });
        out.push({ name: rn, matches: ms });
        cur = ms.map((_, i) => `${rn} 승${i + 1}`);
      }
      return out;
    }, [leaves]);

    const nameOf = (label) => (assign && assign[label]) || label;

    return (
      <div>
        {/* 종별 선택 */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--ink-mute)", marginRight: 2 }}>종별:</span>
          {rules.map(r => { const on = r.code === divCode; const d = byDiv[r.code]; return (
            <button key={r.code + (on ? "-on" : "")} className="ts-chip" style={on ? { borderColor: "var(--primary)", background: "var(--primary-weak)", color: "var(--primary)" } : undefined} onClick={() => { setDivCode(r.code); setPickSlot(null); }}>{r.label}{d && d.phase === "drawn" && <Icon name="check" size={13} />}</button>
          ); })}
        </div>

        {/* 대회 방식 / 조 설정 (확인·수정) */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span className="ct-headicon"><Icon name="settings-2" size={18} /></span>
            <div><h3 style={{ fontSize: 14 }}>대회 방식 · 조 설정</h3><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>대회 생성 시 입력값 — 여기서 확인·수정할 수 있습니다</p></div>
          </div>
          <div className="bk-cfg-grid">
            <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">대회 방식</span>
              <select className="ts-select" value={cfg.format} onChange={e => setCfg({ format: e.target.value })}>
                {window.ALLOWED_FORMATS.map(f => <option key={f} value={f}>{FL[f]}</option>)}
              </select></label>
            <label className="ts-field" style={{ margin: 0, opacity: cfg.format === "single_elimination" ? .45 : 1 }}><span className="ts-field__label">조 수</span>
              <input className="ts-input" type="number" min={1} max={8} value={cfg.group_count} disabled={cfg.format === "single_elimination"} onChange={e => setCfg({ group_count: Math.max(+e.target.value || 1, 1) })} style={{ padding: "9px 11px" }} /></label>
            <label className="ts-field" style={{ margin: 0, opacity: cfg.format === "single_elimination" ? .45 : 1 }}><span className="ts-field__label">조별 팀수</span>
              <input className="ts-input" type="number" min={2} max={8} value={cfg.group_size} disabled={cfg.format === "single_elimination"} onChange={e => setCfg({ group_size: Math.max(+e.target.value || 2, 2) })} style={{ padding: "9px 11px" }} /></label>
            <label className="ts-field" style={{ margin: 0, opacity: (noAdvance || isDual) ? .55 : 1 }}><span className="ts-field__label">본선 진출(조별)</span>
              <input className="ts-input" type="number" min={1} max={cfg.group_size} value={leagueOnly ? "" : isDual ? 2 : cfg.advance_per_group} placeholder={leagueOnly ? "리그전" : undefined} disabled={noAdvance || isDual} onChange={e => setCfg({ advance_per_group: Math.max(+e.target.value || 1, 1) })} style={{ padding: "9px 11px" }} /></label>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
            <Badge tone="grey">{FL[cfg.format]}</Badge>
            <Badge tone="grey">참가 {teams.length}팀</Badge>
            <Badge tone="grey">슬롯 {totalSlots}{teams.length < totalSlots ? ` · 부전승 ${totalSlots - teams.length}` : ""}</Badge>
            {leagueOnly && <Badge tone="grey">리그전 마무리 · 본선 진출 없음</Badge>}
            {isDual && <Badge tone="grey">조별 더블엘리미(5경기/조) · 1·2위 진출</Badge>}
            {!noAdvance && !isDual && <Badge tone="grey">본선 진출 {Math.min(cfg.advance_per_group, cfg.group_size) * cfg.group_count}팀</Badge>}
            {isDual && <Badge tone="grey">본선 진출 {2 * cfg.group_count}팀</Badge>}
          </div>
        </div>

        {/* 조편성 컨트롤 */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div><p style={{ fontSize: 13, fontWeight: 700 }}>조편성</p><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{phase === "drawn" ? (leagueOnly ? "조편성 완료 — 리그전으로 진행됩니다" : "추첨 완료 — 토너먼트 트리를 드래그로 수정할 수 있습니다") : phase === "seeding" ? "시드 팀을 조·슬롯에 배정한 뒤 나머지를 랜덤 추첨하세요" : "완전 랜덤 또는 시드 배정 후 랜덤으로 추첨하세요"}</p></div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {phase === "drawn" && <Btn variant="secondary" size="sm" icon="rotate-ccw" onClick={reset}>초기화</Btn>}
            {phase !== "seeding" && <Btn variant="secondary" size="sm" icon="shuffle" onClick={() => fillRandom(false)} {...(teams.length < 2 ? { disabled: true } : {})}>완전 랜덤 추첨</Btn>}
            {phase !== "seeding" && <Btn size="sm" icon="list-ordered" onClick={() => patch({ phase: "seeding" })} {...(teams.length < 2 ? { disabled: true } : {})}>시드 배정</Btn>}
            {phase === "seeding" && <Btn variant="secondary" size="sm" icon="x" onClick={() => patch({ phase: "config" })}>시드 취소</Btn>}
            {phase === "seeding" && <Btn size="sm" icon="shuffle" onClick={() => fillRandom(true)}>시드 완료 → 랜덤 추첨</Btn>}
          </div>
        </div>

        {/* 시드 배정 모드 */}
        {phase === "seeding" && (
          <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
            <h4 className="bk-subh">시드 슬롯 — 클릭해 팀 배정 (예: A1·B1·C1·D1)</h4>
            <div className="bk-groups">
              {Array.from({ length: Math.max(grpCount, 1) }).map((_, g) => (
                <div key={g} className="bk-group">
                  <div className="bk-group__name">{cfg.format === "single_elimination" ? "토너먼트" : GL(g) + "조"}</div>
                  {(cfg.format === "single_elimination" ? slots : slots.filter(s => s[0] === GL(g))).map(sl => (
                    <div key={sl} className="bk-slot" data-seeded={!!seeds[sl]}>
                      <span className="bk-slot__lbl">{sl}</span>
                      {seeds[sl]
                        ? <><span className="bk-slot__team">{seeds[sl]}</span><button className="sc-del" onClick={() => clearSeed(sl)}><Icon name="x" size={13} /></button></>
                        : <button className="bk-slot__assign" onClick={() => setPickSlot(pickSlot === sl ? null : sl)}>{pickSlot === sl ? "팀 선택…" : "시드 배정"}</button>}
                      {pickSlot === sl && (
                        <div className="bk-pick">
                          {teams.filter(t => !seededNames.has(t.name)).map(t => (
                            <button key={t.id} onClick={() => assignSeed(sl, t.name)}><span style={{ width: 14, height: 14, borderRadius: "50%", background: t.color, flex: "0 0 auto" }} />{t.name}</button>
                          ))}
                          {teams.filter(t => !seededNames.has(t.name)).length === 0 && <span style={{ fontSize: 12, color: "var(--ink-dim)", padding: 8 }}>남은 팀 없음</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 10 }}>배정한 시드 {Object.keys(seeds).length}팀은 고정되고, "시드 완료 → 랜덤 추첨"으로 나머지 {teams.length - Object.keys(seeds).length}팀이 빈 슬롯에 랜덤 배정됩니다.</p>
          </div>
        )}

        {/* 조 편성 결과 */}
        {phase === "drawn" && cfg.format !== "single_elimination" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <h4 className="bk-subh" style={{ margin: 0 }}>조 편성{leagueOnly && <span style={{ fontWeight: 500, color: "var(--ink-dim)", textTransform: "none", letterSpacing: 0 }}> · 리그전</span>}</h4>
              {leagueOnly && <Btn size="sm" icon="calendar-plus" onClick={publish}>일정에 반영</Btn>}
            </div>
            <div className="bk-groups" style={{ marginBottom: 16 }}>
              {Array.from({ length: cfg.group_count }).map((_, g) => {
                const L = GL(g);
                return (
                  <div key={g} className="bk-group">
                    <div className="bk-group__name">{L}조</div>
                    {slots.filter(s => s[0] === L).map((sl, i) => {
                      return (
                        <div key={sl} className="bk-slot">
                          <span className="bk-slot__lbl">{sl}</span>
                          <span className="bk-slot__team" style={{ color: assign[sl] ? "var(--ink)" : "var(--ink-dim)" }}>{assign[sl] || "부전승"}</span>
                        </div>
                      );
                    })}
                    <div className="bk-group__games">{isDual ? `더블엘리미 ${grpGameCount}경기` : `조별 ${grpGameCount}경기`}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 조별 더블 엘리미네이션 (듀얼토너먼트) */}
        {phase === "drawn" && isDual && (
          <>
            <h4 className="bk-subh">조별 더블 엘리미네이션 <span style={{ fontWeight: 500, color: "var(--ink-dim)", textTransform: "none", letterSpacing: 0 }}>· 1·2경기 → 승자전/패자전 → 조 최종전</span></h4>
            <div className="bk-groups" style={{ marginBottom: 16 }}>
              {Array.from({ length: cfg.group_count }).map((_, g) => {
                const L = GL(g);
                return (
                  <div key={g} className="bk-group">
                    <div className="bk-group__name">{L}조</div>
                    {window.dualGroupStages(L, cfg.group_size).map(dg => (
                      <div key={dg.key} className="bk-dualrow" data-final={dg.stage === 2}>
                        <span className="bk-dualrow__lbl">{dg.label}</span>
                        <span className="bk-dualrow__vs"><b>{nameOf(dg.home)}</b><i>대</i><b>{nameOf(dg.away)}</b></span>
                      </div>
                    ))}
                    <div className="bk-group__games">승자전 승자 = 1위 · 최종전 승자 = 2위</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* 토너먼트 트리 */}
        {phase === "drawn" && rounds.length > 0 && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
              <h4 className="bk-subh" style={{ margin: 0 }}>토너먼트 트리 <span style={{ fontWeight: 500, color: "var(--ink-dim)", textTransform: "none", letterSpacing: 0 }}>· 칸을 드래그해 대진 교체</span></h4>
              <Btn size="sm" icon="calendar-plus" onClick={publish}>일정에 반영</Btn>
            </div>
            <div className="bk-tree">
              {rounds.map((rd, ri) => (
                <div key={ri} className="bk-round">
                  <div className="bk-round__name"><span>{rd.name}</span></div>
                  <div className="bk-round__body">
                    {rd.matches.map((m, mi) => (
                      <div key={mi} className="bk-cell">
                        <div className="bk-match">
                          <div className={"bk-seedrow" + (ri === 0 ? " bk-seedrow--drag" : "")} draggable={ri === 0} onDragStart={() => ri === 0 && setDrag(m.ia)} onDragOver={e => ri === 0 && e.preventDefault()} onDrop={() => ri === 0 && swapLeaf(m.ia)}>
                            {ri === 0 && <Icon name="grip-vertical" size={13} color="var(--ink-dim)" />}<span>{ri === 0 ? nameOf(m.a) : m.a}</span>
                          </div>
                          <div className={"bk-seedrow" + (ri === 0 ? " bk-seedrow--drag" : "")} draggable={ri === 0} onDragStart={() => ri === 0 && setDrag(m.ib)} onDragOver={e => ri === 0 && e.preventDefault()} onDrop={() => ri === 0 && swapLeaf(m.ib)}>
                            {ri === 0 && <Icon name="grip-vertical" size={13} color="var(--ink-dim)" />}<span>{ri === 0 ? nameOf(m.b) : m.b}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 추첨 전 안내 */}
        {phase === "config" && (
          <div className="ct-emptybox">
            <Icon name="git-merge" size={36} color="var(--ink-dim)" />
            <b style={{ color: "var(--ink)" }}>아직 조편성 전입니다</b>
            <span>위에서 대회 방식·조 설정을 확인한 뒤 <b>완전 랜덤 추첨</b> 또는 <b>시드 배정</b>을 진행하세요. 조편성 후 대회 방식에 따라 토너먼트 트리가 자동 생성됩니다.</span>
          </div>
        )}
        {toastNode}
      </div>
    );
  };
})();
