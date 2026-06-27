/* global React, window */
// ============================================================
// panels-core.jsx — teams / divisions / matches / bracket (Toss 역박제)
//   Toss 키트(Btn/Badge/Modal/Icon/Toggle/Check) + ts-*/ct-* 클래스.
//   모든 서버 액션 = mock 상태 시연. function-lock-B1.md B~E 준수.
// ============================================================
(function () {
  const { useState, useMemo } = React;
  const { Icon, Btn, Badge, Modal } = window;
  const WS = window.WS;

  function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => { setMsg(m); window.clearTimeout(window.__tw_t); window.__tw_t = window.setTimeout(() => setMsg(null), 2600); };
    const node = msg ? <div className="ts-toast"><Icon name="check" size={16} />{msg}</div> : null;
    return [show, node];
  }
  function copy(text, show, label) {
    try { navigator.clipboard.writeText(text); show(label); } catch (e) { show("복사 실패"); }
  }

  // ── B. TEAMS ────────────────────────────────────────────
  window.TeamsPanel = function TeamsPanel() {
    const [teams, setTeams] = useState(WS.teams);
    const [filter, setFilter] = useState("all");
    const [open, setOpen] = useState(null);     // 상세 모달 team
    const [importOpen, setImportOpen] = useState(false);
    const [show, toast] = useToast();
    const rules = WS.divisionRules;

    const isCoachPending = (t) => t.via === "admin" && t.players === 0;
    const counts = {
      all: teams.length,
      pending: teams.filter(t => t.status === "pending").length,
      approved: teams.filter(t => t.status === "approved").length,
      rejected: teams.filter(t => t.status === "rejected").length,
      coach_pending: teams.filter(isCoachPending).length,
    };
    const via = { admin: teams.filter(t => t.via === "admin").length, coach_token: teams.filter(t => t.via === "coach_token").length, self: teams.filter(t => t.via === "self").length, null: teams.filter(t => !t.via).length };
    const filtered = filter === "all" ? teams : filter === "coach_pending" ? teams.filter(isCoachPending) : teams.filter(t => t.status === filter);

    const readiness = rules.map(r => {
      const appr = teams.filter(t => t.category === r.code && t.status === "approved").length;
      const total = teams.filter(t => t.category === r.code).length;
      const over = r.cap != null && appr > r.cap;
      return { ...r, appr, total, over, ready: appr >= 2 && !over };
    });
    const groups = {};
    filtered.forEach(t => { (groups[t.category] = groups[t.category] || []).push(t); });

    const setStatus = (id, status) => { setTeams(ts => ts.map(t => t.id === id ? { ...t, status } : t)); show(status === "approved" ? "승인 처리(시연)" : "거절 처리(시연)"); };
    const labelOf = (code) => rules.find(r => r.code === code)?.label ?? "기타";

    return (
      <div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", marginBottom: 14 }}>
          <Btn variant="secondary" size="sm" icon="download" onClick={() => copy("팀명,코치,링크\n...", show, "토큰 파일 받기(시연)")}>토큰 파일 받기 ({teams.length})</Btn>
          <Btn size="sm" icon="message-circle" onClick={() => copy("[안내문]...", show, "카톡 문구 복사 완료")}>카톡 문구 복사</Btn>
        </div>

        {/* 등록경로 stat 4 */}
        <div className="ct-panel-stats" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 14 }}>
          {[["운영자 등록", via.admin, "briefcase"], ["코치 신청", via.coach_token, "id-card"], ["본인 신청", via.self, "user"], ["경로 미상", via.null, "circle-help"]].map(([l, v, ic]) => (
            <div key={l} className="ct-metric" style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name={ic} size={20} color="var(--primary)" />
              <div><div className="ct-metric__lbl">{l}</div><div className="ct-metric__val">{v}</div></div>
            </div>
          ))}
        </div>

        {/* 종별 현황 — 종별별 참가신청 팀 수 */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div><h3 style={{ fontSize: 14 }}>종별 현황</h3><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>종별별 참가신청 팀 수 · 대진 추첨은 대진표 탭에서</p></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 8 }}>
            {readiness.map(r => (
              <div key={r.code} style={{ background: "var(--grey-50)", borderRadius: 14, padding: "14px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <p style={{ fontWeight: 700, fontSize: 13.5, minWidth: 0 }}>{r.label}</p>
                  {r.over && <span className="ct-pill" data-tone="err">정원 초과</span>}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
                  <span style={{ fontSize: 26, fontWeight: 800, color: "var(--ink)" }}>{r.total}</span>
                  <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>팀 신청{r.cap != null ? ` / 정원 ${r.cap}` : ""}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 필터 */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {[["all", "전체"], ["pending", "대기"], ["approved", "승인"], ["rejected", "거절"], ["coach_pending", "코치 미입력"]].map(([k, l]) => (
            <button key={k} className="ts-chip" data-active={filter === k} onClick={() => setFilter(k)}>{l}<span style={{ fontSize: 11, background: "var(--grey-100)", padding: "1px 6px", borderRadius: 8 }}>{counts[k]}</span></button>
          ))}
        </div>

        {/* 종별 그룹 카드 */}
        {Object.keys(groups).sort((a, b) => (a === "기타" ? 1 : b === "기타" ? -1 : a.localeCompare(b))).map(cat => (
          <section key={cat} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <h3 style={{ fontSize: 13, color: "var(--primary)", textTransform: "uppercase", letterSpacing: ".04em" }}>{labelOf(cat)}</h3>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>({groups[cat].length}팀)</span>
              <div style={{ flex: 1, borderTop: "1px solid var(--border)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {groups[cat].map(t => (
                <div key={t.id} className="ts-card ts-card--tight" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, justifyContent: "space-between" }}>
                  <button onClick={() => setOpen(t)} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "transparent", cursor: "pointer", minWidth: 0, textAlign: "left", fontFamily: "var(--ff)" }}>
                    <span style={{ width: 38, height: 38, borderRadius: "50%", background: t.color, flex: "0 0 auto" }} />
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                        <b style={{ color: "var(--ink)" }}>{t.name}</b>
                        {t.via && <span className="ct-pill" data-tone="mute">{window.VIA_LABEL[t.via]}</span>}
                        <span className="ct-pill" data-tone={window.TEAM_TONE[t.status]}>{window.TEAM_STATUS[t.status]}</span>
                        {t.waiting && <span className="ct-pill" data-tone="warn">대기 {t.waiting}번</span>}
                        {isCoachPending(t) && <span className="ct-pill" data-tone="info">코치 입력 대기</span>}
                      </span>
                      <span style={{ display: "block", fontSize: 12, color: "var(--ink-mute)", marginTop: 3 }}>선수 {t.players}명 · {t.appliedAt} 신청{t.manager ? ` · 코치 ${t.manager}` : ""}</span>
                    </span>
                  </button>
                  <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
                    <Btn variant="secondary" size="sm" icon="copy" onClick={() => copy("https://mybdr.kr/apply/" + t.id, show, "링크 복사")}>링크</Btn>
                    {t.status === "pending" && <><Btn size="sm" onClick={() => setStatus(t.id, "approved")}>승인</Btn><Btn variant="danger" size="sm" onClick={() => setStatus(t.id, "rejected")}>거절</Btn></>}
                    {t.status === "approved" && <Btn variant="danger" size="sm" onClick={() => setStatus(t.id, "rejected")}>거절</Btn>}
                    {t.status === "rejected" && <Btn size="sm" onClick={() => setStatus(t.id, "approved")}>승인으로</Btn>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {open && <TeamModal team={open} rules={rules} onClose={() => setOpen(null)} onImport={() => { setOpen(null); setImportOpen(true); }} onStatus={setStatus} show={show} />}
        {importOpen && <ImportModal onClose={() => setImportOpen(false)} show={show} />}
        {toast}
      </div>
    );
  };

  function TeamModal({ team, rules, onClose, onImport, onStatus, show }) {
    const [pay, setPay] = useState(team.paid);
    const players = Array.from({ length: team.players }, (_, i) => ({ n: i + 1, name: `선수${i + 1}`, birth: "2010-0" + ((i % 9) + 1) + "-15", school: "○○중", pos: ["가드", "포워드", "센터"][i % 3], parent: "보호자", phone: "010-0000-0000" }));
    return (
      <Modal open onClose={onClose} maxWidth={760} title={team.name} sub={`${rules.find(r => r.code === team.category)?.label ?? ""} · ${team.appliedAt} 신청`}
        foot={<><Btn variant="secondary" onClick={() => window.print()} icon="printer">프린트</Btn><div style={{ flex: 1 }} />{team.status === "pending" ? <><Btn onClick={() => { onStatus(team.id, "approved"); onClose(); }}>승인</Btn><Btn variant="danger" onClick={() => { onStatus(team.id, "rejected"); onClose(); }}>거절</Btn></> : <Btn variant="secondary" onClick={onClose}>닫기</Btn>}</>}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <span className="ct-pill" data-tone={window.TEAM_TONE[team.status]}>{window.TEAM_STATUS[team.status]}</span>
          <span className="ct-pill" data-tone="mute">납부: {window.PAY_LABEL[pay]}</span>
          <select className="ts-select" style={{ width: "auto" }} value={pay} onChange={e => { setPay(e.target.value); show(e.target.value === "paid" ? "입금 확인 — 자동 승인(시연)" : "납부 상태 변경(시연)"); }}>
            <option value="unpaid">미납</option><option value="paid">납부</option><option value="refunded">환불</option>
          </select>
          <Btn variant="secondary" size="sm" icon="refresh-cw" onClick={() => show("토큰 재발급(시연)")}>토큰 재발급</Btn>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          <h3 style={{ fontSize: 14 }}>선수 명단 ({team.players}명)</h3>
          <div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" size="sm" icon="clipboard-paste" onClick={onImport}>일괄 입력</Btn><Btn size="sm" icon="user-plus" onClick={() => show("선수 추가 폼(시연)")}>선수 추가</Btn></div>
        </div>
        {team.players === 0 ? <p style={{ color: "var(--ink-mute)", fontSize: 13, padding: "16px 0" }}>등록된 선수가 없습니다.</p> : (
          <div className="amt-table-wrap"><table className="amt-table"><thead><tr><th>#</th><th>이름</th><th>생년월일</th><th>학교</th><th>포지션</th><th>보호자</th></tr></thead>
            <tbody>{players.map(p => <tr key={p.n}><td>{p.n}</td><td style={{ fontWeight: 600 }}>{p.name}</td><td className="amt-table__div">{p.birth}</td><td className="amt-table__div">{p.school}</td><td className="amt-table__div">{p.pos}</td><td className="amt-table__div">{p.parent}</td></tr>)}</tbody></table></div>
        )}
      </Modal>
    );
  }

  function ImportModal({ onClose, show }) {
    const [text, setText] = useState("");
    const [over, setOver] = useState(false);
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    return (
      <Modal open onClose={onClose} maxWidth={620} title="선수 일괄 입력" sub="한 줄에 한 명: 이름/생년월일/등번호/포지션/학교/보호자/연락처"
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn onClick={() => { show(`${lines.length}명 입력(시연)`); onClose(); }} {...(lines.length ? {} : { disabled: true })}>일괄 입력 실행 ({lines.length})</Btn></>}>
        <textarea className="ts-textarea" style={{ minHeight: 200, fontFamily: "var(--ff-mono)", fontSize: 13 }} value={text} onChange={e => setText(e.target.value)} placeholder={"홍길동/2017-05-16/7/가드/강남초/홍판서/010-1234-5678"} />
        <label className="ct-checkrow" style={{ marginTop: 12 }}><window.Check on={over} onChange={setOver} /><span>기존 명단 전체 삭제 후 입력</span></label>
      </Modal>
    );
  }

  // ── C. DIVISIONS ────────────────────────────────────────
  window.DivisionsPanel = function DivisionsPanel() {
    const [rules, setRules] = useState(WS.divisionRules);
    const [editCode, setEditCode] = useState(null);   // 인라인 수정 중인 종별
    const [newLabel, setNewLabel] = useState("");
    const [show, toast] = useToast();
    const showGroup = (f) => ["round_robin", "dual_tournament", "group_stage_knockout", "league_advancement", "group_stage_with_ranking"].includes(f);
    const showAdvance = (f) => ["group_stage_knockout", "dual_tournament"].includes(f);

    const patchRule = (code, p) => setRules(rs => rs.map(r => r.code === code ? { ...r, ...p } : r));
    const patchSettings = (code, p) => setRules(rs => rs.map(r => r.code === code ? { ...r, settings: { ...r.settings, ...p } } : r));
    const removeRule = (code, label) => { if (!confirm(`"${label}" 종별을 삭제할까요?\n해당 종별의 배정·대진 정보도 함께 제거됩니다.`)) return; setRules(rs => rs.filter(r => r.code !== code)); setEditCode(c => c === code ? null : c); show(`${label} 삭제(시연)`); };
    const slug = (s) => s.trim().toLowerCase().replace(/[^a-z0-9가-힣]+/g, "-").replace(/(^-|-$)/g, "") || ("div" + Date.now());
    const addRule = (label) => {
      const lab = label.trim(); if (!lab) return;
      if (rules.some(r => r.label === lab)) { show("이미 있는 종별입니다."); return; }
      let code = slug(lab); if (rules.some(r => r.code === code)) code += "-" + Math.random().toString(36).slice(2, 4);
      setRules(rs => [...rs, { code, label: lab, cap: 16, fee: 50000, format: "single_elimination", settings: {} }]);
      setNewLabel(""); setEditCode(code); show(`${lab} 추가(시연)`);
    };
    const MASTER = ["오픈부", "아마추어부", "U18", "U15", "U12", "U10", "여성부", "3x3"];

    return (
      <div>
        {/* 종별 구성 — 마스터 chip 토글(추가/삭제) + 직접 추가 */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}><span className="ct-headicon"><Icon name="layout-grid" size={18} /></span><div><h3 style={{ fontSize: 14 }}>종별 구성</h3><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>칩을 눌러 추가/삭제 · 카드에서 이름·정원·참가비 수정</p></div></div>
            <Btn size="sm" onClick={() => show("종별 저장(시연)")}>종별 저장</Btn>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
            {MASTER.map(d => { const on = rules.some(r => r.label === d); return (
              <button key={d} className="ts-chip" data-active={on} onClick={() => on ? removeRule(rules.find(r => r.label === d).code, d) : addRule(d)}>
                <Icon name={on ? "check" : "plus"} size={14} />{d}
              </button>
            ); })}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="ts-input" placeholder="직접 종별 추가 (예: U16 남자부)" value={newLabel} onChange={e => setNewLabel(e.target.value)} onKeyDown={e => { if (!e.nativeEvent.isComposing && e.key === "Enter") addRule(newLabel); }} />
            <Btn variant="secondary" icon="plus" onClick={() => addRule(newLabel)} {...(newLabel.trim() ? {} : { disabled: true })}>추가</Btn>
          </div>
        </div>

        {rules.length === 0 ? (
          <div className="ct-emptybox"><Icon name="layout-grid" size={40} color="var(--ink-dim)" /><b style={{ color: "var(--ink)" }}>등록된 종별이 없습니다</b><span>위에서 종별을 추가하세요.</span></div>
        ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }} className="ct-divgrid">
          {rules.map(r => {
            const editing = editCode === r.code;
            return (
            <article key={r.code} className="ts-card ts-card--flat" style={editing ? { boxShadow: "0 0 0 2px var(--primary)" } : {}}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                <div style={{ minWidth: 0, flex: "1 1 160px" }}>
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
                    <span style={{ fontFamily: "var(--ff-mono)", fontSize: 10, fontWeight: 800, color: "var(--primary)", background: "var(--primary-weak)", padding: "2px 6px", borderRadius: 6, textTransform: "uppercase" }}>{r.code}</span>
                    {editing ? <input className="ts-input" style={{ padding: "6px 10px", fontSize: 14 }} value={r.label} onChange={e => patchRule(r.code, { label: e.target.value })} /> : r.label}
                  </p>
                  {!editing && <p style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 4 }}>참가비 {r.fee.toLocaleString()}원 · 정원 {r.cap ?? "—"}</p>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "0 0 auto" }}>
                  <button className="ct-iconbtn" title={editing ? "완료" : "수정"} onClick={() => setEditCode(editing ? null : r.code)} style={editing ? { background: "var(--primary)", color: "#fff" } : {}}><Icon name={editing ? "check" : "pencil"} size={15} /></button>
                  <button className="ct-iconbtn" title="삭제" onClick={() => removeRule(r.code, r.label)}><Icon name="trash-2" size={15} /></button>
                </div>
              </div>

              {editing && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
                  <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">정원</span><input className="ts-input" type="number" min={0} value={r.cap ?? ""} onChange={e => patchRule(r.code, { cap: e.target.value === "" ? null : +e.target.value })} placeholder="제한 없음" /></label>
                  <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">참가비</span><input className="ts-input" type="number" min={0} step={1000} value={r.fee} onChange={e => patchRule(r.code, { fee: +e.target.value })} /></label>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <span className="ts-field__label">진행 방식</span>
                <select className="ts-select" value={r.format ?? ""} onChange={e => { patchRule(r.code, { format: e.target.value || null }); show("진행 방식 변경(시연)"); }}>
                  <option value="">대회 방식 사용</option>
                  {window.ALLOWED_FORMATS.map(f => <option key={f} value={f}>{window.FORMAT_LABEL[f]}</option>)}
                </select>
              </div>

              {showGroup(r.format) && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }} className="ct-div-edit3">
                  <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">조 크기</span><input className="ts-input" type="number" value={r.settings.group_size ?? ""} onChange={e => patchSettings(r.code, { group_size: e.target.value === "" ? undefined : +e.target.value })} placeholder="4" /></label>
                  <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">조 개수</span><input className="ts-input" type="number" value={r.settings.group_count ?? ""} onChange={e => patchSettings(r.code, { group_count: e.target.value === "" ? undefined : +e.target.value })} placeholder="4" /></label>
                  {showAdvance(r.format) && <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">조별 진출</span><input className="ts-input" type="number" value={r.settings.advance_per_group ?? 2} onChange={e => patchSettings(r.code, { advance_per_group: +e.target.value })} /></label>}
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>예선 순위 기준 순위전 자동 매핑</span>
                <Btn variant="secondary" size="sm" onClick={() => show(`${r.code} 진출 매핑(시연)`)}>진출 매핑 실행</Btn>
              </div>
            </article>
            );
          })}
        </div>
        )}
        {toast}
      </div>
    );
  };

  // ── D. MATCHES ──────────────────────────────────────────
  window.MatchesPanel = function MatchesPanel() {
    const [matches, setMatches] = useState(WS.matches);
    const [divFilter, setDivFilter] = useState(null);
    const [venueFilter, setVenueFilter] = useState(null);
    const [sel, setSel] = useState(null);
    const [modeOpen, setModeOpen] = useState(false);
    const [show, toast] = useToast();
    const ms = WS.matchStats;

    const divisions = [...new Set(matches.map(m => m.division))];
    const venues = [...new Set(matches.map(m => m.venue))];
    const filtered = matches.filter(m => (!divFilter || m.division === divFilter) && (!venueFilter || m.venue === venueFilter));
    const rounds = [...new Set(filtered.map(m => m.round))].sort((a, b) => a - b);

    return (
      <div>
        {/* 기록 모드 트리거 */}
        <div className="ts-card ts-card--flat" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
          <div><p style={{ fontSize: 11, fontWeight: 700, color: "var(--ink-mute)", textTransform: "uppercase", letterSpacing: ".04em" }}>기록 모드</p><p style={{ fontSize: 13, marginTop: 2 }}>대회 기본: <b>기록앱</b> <span style={{ color: "var(--ink-mute)" }}>· 총 {ms.total}건 (기록앱 {ms.flutter} / 전자기록지 {ms.paper}{ms.inProgress ? ` / 진행중 ${ms.inProgress}` : ""})</span></p></div>
          <Btn variant="secondary" size="sm" icon="sliders-horizontal" onClick={() => setModeOpen(true)}>기록 모드 설정</Btn>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
          <div><h3 style={{ fontSize: 15 }}>경기 운영</h3><p style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>일정, 점수, 기록 방식을 관리합니다.</p></div>
          <div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" size="sm" onClick={() => show("대진표 재생성(시연)")}>대진표 재생성</Btn><Btn size="sm" icon="trophy" onClick={() => show("순위전 진출(시연)")}>순위전 진출</Btn></div>
        </div>

        {divisions.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>종별:</span>
            <button className="ts-chip" data-active={!divFilter} onClick={() => setDivFilter(null)}>전체 ({matches.length})</button>
            {divisions.map(d => <button key={d} className="ts-chip" data-active={divFilter === d} onClick={() => setDivFilter(d)}>{d} ({matches.filter(m => m.division === d).length})</button>)}
          </div>
        )}
        {venues.length > 1 && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>체육관:</span>
            <button className="ts-chip" data-active={!venueFilter} onClick={() => setVenueFilter(null)}>전체</button>
            {venues.map(v => <button key={v} className="ts-chip" data-active={venueFilter === v} onClick={() => setVenueFilter(v)}><Icon name="map-pin" size={14} />{v} ({matches.filter(m => m.venue === v).length})</button>)}
          </div>
        )}

        {rounds.map(rn => {
          const rm = filtered.filter(m => m.round === rn);
          return (
            <div key={rn} style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-mute)", marginBottom: 8 }}>{rm[0]?.roundName ?? `라운드 ${rn}`}</h4>
              <div className="amt-table-wrap"><table className="amt-table"><thead><tr><th>시간</th><th>코트</th><th>종별</th><th>대진</th><th>스코어</th><th>상태</th><th>#</th></tr></thead>
                <tbody>{rm.map(m => (
                  <tr key={m.id} onClick={() => setSel(m)}>
                    <td className="amt-table__time">{m.at ? m.at.slice(5) : "미정"}</td>
                    <td className="amt-table__court">{m.venue}</td>
                    <td className="amt-table__div">{m.division}</td>
                    <td><span className="amt-table__teams"><b style={m.winner === "home" ? { color: "var(--ok)" } : {}}>{m.home}</b><span className="vs">대</span><b style={m.winner === "away" ? { color: "var(--ok)" } : {}}>{m.away}</b></span></td>
                    <td className="amt-table__score">{m.hs} : {m.as}</td>
                    <td><span className="ct-pill" data-tone={window.MATCH_TONE[m.status]}>{window.MATCH_STATUS[m.status]}</span></td>
                    <td className="amt-table__div">#{m.num}</td>
                  </tr>
                ))}</tbody></table></div>
            </div>
          );
        })}

        {sel && <ScoreModal match={sel} onClose={() => setSel(null)} onSave={(p) => { setMatches(ms2 => ms2.map(x => x.id === sel.id ? { ...x, ...p } : x)); setSel(null); show("저장(시연)"); }} />}
        {modeOpen && <Modal open onClose={() => setModeOpen(false)} title="기록 모드 설정" sub="대회 기본 + 매치별 override"
          foot={<><Btn variant="secondary" onClick={() => setModeOpen(false)}>취소</Btn><Btn onClick={() => { setModeOpen(false); show("모드 변경(시연)"); }}>변경 적용</Btn></>}>
          <div className="ts-segment" style={{ marginBottom: 12 }}>{["기록앱", "전자기록지", "수기"].map((m, i) => <button key={m} className="ts-segment__btn" data-active={i === 0}>{m}</button>)}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{["모든 매치 일괄 적용", "미설정 경기만 적용", "진행 중 경기 제외"].map((o, i) => <label key={o} className="ct-checkrow"><input type="radio" name="scope" defaultChecked={i === 2} /><span>{o}</span></label>)}</div>
          <label className="ts-field" style={{ marginTop: 12 }}><span className="ts-field__label">변경 사유 *</span><textarea className="ts-textarea" placeholder="결승은 전자기록지 운영" /></label>
        </Modal>}
        {toast}
      </div>
    );
  };

  function ScoreModal({ match, onClose, onSave }) {
    const [hs, setHs] = useState(match.hs); const [as, setAs] = useState(match.as);
    const [status, setStatus] = useState(match.status); const [mode, setMode] = useState("flutter");
    return (
      <Modal open onClose={onClose} maxWidth={620} title={`${match.roundName} #${match.num}`} sub={`${match.home} 대 ${match.away}`}
        foot={<><Btn variant="secondary" block onClick={onClose}>취소</Btn><Btn variant="danger" onClick={onClose}>삭제</Btn><Btn block onClick={() => onSave({ hs, as, status })}>저장</Btn></>}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 12, alignItems: "center", marginBottom: 14 }}>
          <input type="number" className="ts-input" style={{ textAlign: "center", fontSize: 22, fontWeight: 800 }} value={hs} onChange={e => setHs(+e.target.value)} />
          <span style={{ color: "var(--ink-mute)" }}>:</span>
          <input type="number" className="ts-input" style={{ textAlign: "center", fontSize: 22, fontWeight: 800 }} value={as} onChange={e => setAs(+e.target.value)} />
        </div>
        <label className="ts-field"><span className="ts-field__label">상태</span><select className="ts-select" value={status} onChange={e => setStatus(e.target.value)}><option value="scheduled">예정</option><option value="in_progress">진행 중</option><option value="completed">종료</option><option value="cancelled">취소</option></select></label>
        <label className="ts-field"><span className="ts-field__label">기록 방식</span><select className="ts-select" value={mode} onChange={e => setMode(e.target.value)}><option value="flutter">기록앱</option><option value="paper">전자기록지</option></select></label>
        {mode === "paper" && <Btn variant="secondary" size="sm" iconRight="arrow-right">전자기록지 열기</Btn>}
      </Modal>
    );
  }

  // ── E. BRACKET (종별 선택 → 참가팀 → 대진 추첨) ──────────
  window.BracketPanel = function BracketPanel() {
    const b = WS.bracket;
    const rules = WS.divisionRules;
    const [divCode, setDivCode] = useState(rules[0]?.code);
    const rule = rules.find(r => r.code === divCode) || rules[0];
    const [drawn, setDrawn] = useState({});       // divCode -> { mode, slots:[{slot,team}] }
    const [show, toast] = useToast();

    const teams = useMemo(() => WS.teams.filter(t => t.category === divCode && t.status === "approved"), [divCode]);
    const slotCount = Math.max(teams.length, 4);
    const slotLabels = Array.from({ length: slotCount }, (_, i) => "A" + (i + 1));
    const cur = drawn[divCode];

    const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const runDraw = (mode) => {
      const names = teams.map(t => t.name);
      while (names.length < slotCount) names.push(null);
      let ordered;
      if (mode === "random") ordered = shuffle(names);
      else { // 시드 반영 후 랜덤: 상위 2시드 고정, 나머지 셔플
        const seeded = names.slice(0, 2);
        ordered = [...seeded, ...shuffle(names.slice(2))];
      }
      setDrawn(d => ({ ...d, [divCode]: { mode, slots: slotLabels.map((s, i) => ({ slot: s, team: ordered[i] })) } }));
      toast(mode === "random" ? `${rule.label} 랜덤 추첨 완료(시연)` : `${rule.label} 시드 반영 추첨 완료(시연)`);
    };
    const reset = () => { setDrawn(d => { const n = { ...d }; delete n[divCode]; return n; }); toast("추첨 초기화"); };

    const nameOf = (slot) => { if (!cur) return slot; const f = cur.slots.find(x => x.slot === slot); return f && f.team ? f.team : slot; };
    const pairs = [];
    for (let i = 0; i < slotLabels.length; i += 2) pairs.push([slotLabels[i], slotLabels[i + 1]]);

    return (
      <div>
        {/* 종별 선택 */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: "var(--ink-mute)", marginRight: 2 }}>종별:</span>
          {rules.map(r => { const on = r.code === divCode; return (
            <button key={r.code + (on ? "-on" : "")} className="ts-chip" style={on ? { borderColor: "var(--primary)", background: "var(--primary-weak)", color: "var(--primary)" } : undefined} onClick={() => setDivCode(r.code)}>{r.label}{drawn[r.code] && <Icon name="check" size={13} />}</button>
          ); })}
        </div>

        {/* 생성 횟수 + 추첨 버튼 */}
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700 }}>{rule.label} · 참가 {teams.length}팀 · 생성 {b.currentVersion}/{b.maxFree}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
                {Array.from({ length: b.maxFree }).map((_, i) => <div key={i} style={{ height: 10, width: 28, borderRadius: 999, background: i < b.currentVersion ? "var(--primary)" : "var(--border)" }} />)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {cur && <Btn variant="secondary" size="sm" icon="rotate-ccw" onClick={reset}>초기화</Btn>}
              <Btn variant="secondary" size="sm" icon="shuffle" onClick={() => runDraw("random")} {...(teams.length < 2 ? { disabled: true } : {})}>랜덤 추첨</Btn>
              <Btn size="sm" icon="list-ordered" onClick={() => runDraw("seed")} {...(teams.length < 2 ? { disabled: true } : {})}>시드 배정 후 랜덤</Btn>
            </div>
          </div>
        </div>

        {/* 참가팀 카드 */}
        <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-mute)", marginBottom: 8 }}>참가팀 ({teams.length})</h4>
        {teams.length === 0 ? (
          <div className="ct-emptybox" style={{ marginBottom: 16 }}><Icon name="users" size={32} color="var(--ink-dim)" /><b style={{ color: "var(--ink)" }}>승인된 참가팀이 없습니다</b><span>참가팀 탭에서 신청을 승인하면 여기에 표시됩니다.</span></div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(150px,1fr))", gap: 8, marginBottom: 18 }}>
            {teams.map((t, i) => (
              <div key={t.id} className="ts-card ts-card--tight" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 32, height: 32, borderRadius: "50%", background: t.color, flex: "0 0 auto" }} />
                <div style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 13.5, display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</b>
                  <span style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>{cur ? (cur.slots.find(s => s.team === t.name)?.slot || "-") : `시드 ${i + 1}`}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 대진 — 추첨 전 A1 대 A2 / 추첨 후 팀명 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".04em", color: "var(--ink-mute)" }}>대진 {cur ? `· ${cur.mode === "random" ? "랜덤" : "시드 반영"} 추첨` : "· 추첨 전"}</h4>
          {!cur && <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>조 번호(A1·A2…)로 표기 — 추첨 시 팀명으로 배정</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 8 }}>
          {pairs.map(([h, a], i) => (
            <div key={i} className="ts-card ts-card--flat" style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px" }}>
              <span style={{ fontFamily: "var(--ff-mono)", fontSize: 11, color: "var(--ink-mute)", flex: "0 0 auto" }}>{i + 1}</span>
              <span style={{ flex: 1, textAlign: "right", fontWeight: 700, color: cur ? "var(--ink)" : "var(--ink-soft)", minWidth: 0 }}>{nameOf(h)}</span>
              <span style={{ fontSize: 11, color: "var(--ink-dim)", flex: "0 0 auto" }}>대</span>
              <span style={{ flex: 1, fontWeight: 700, color: cur ? "var(--ink)" : "var(--ink-soft)", minWidth: 0 }}>{a ? nameOf(a) : "부전승"}</span>
            </div>
          ))}
        </div>
        {toast}
      </div>
    );
  };
})();
