/* global React, window */
// ============================================================
// operate.jsx — 대회 운영 워크스페이스 (Toss)
//   6 메뉴: 참가팀 · 대진표 · 일정 · 운영관리 · 사이트 · 정산
//   기존 패널 재사용 + 운영관리/정산 신규. mock 동작.
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Icon, Btn, Badge, Modal } = window;
  const WS = window.WS;
  const ORG_TYPES = ["정식 주최사", "제휴 단체", "지역 협회", "동호회"];
  const CYCLES = ["월간", "분기", "반기", "연간"];
  const RECORD_MODES = [
    { id: "full", label: "BDR full stat", tag: "앱", icon: "smartphone", desc: "기록앱(BDR full stat)으로 실시간 상세 기록 — 득점·리바운드·어시스트 등 전 스탯." },
    { id: "stat", label: "BDR stat", tag: "웹·전자기록지", icon: "tablet", desc: "웹·전자기록지(BDR stat)로 스코어와 기본 기록을 입력합니다." },
    { id: "manual", label: "수기", tag: "종이", icon: "pen-line", desc: "종이 기록지로 수기 기록 후 결과(스코어)만 등록합니다." },
  ];

  const MENUS = [
    { id: "teams", label: "참가팀", icon: "users", desc: "각 종별 참가신청·참가비 납부 현황" },
    { id: "bracket", label: "대진표", icon: "git-merge", desc: "각 종별 대진표 생성" },
    { id: "schedule", label: "일정", icon: "calendar-clock", desc: "대진표 기반 일정 관리" },
    { id: "ops", label: "운영관리", icon: "shield-check", desc: "운영진·심판·기록원·공지·경기 운영" },
    { id: "site", label: "사이트", icon: "globe", desc: "공개 사이트 개설·관리" },
    { id: "settle", label: "정산", icon: "wallet", desc: "참가비 입금·지출 현황" },
  ];

  // ── 정규대회 만들기 (+ 단체 생성 체인) ─────────────────
  function LeagueCreateModal({ orgs, onClose, onCreate }) {
    const [name, setName] = useState("");
    const [cycle, setCycle] = useState("연간");
    const [orgMode, setOrgMode] = useState(orgs.length ? "existing" : "new");
    const [orgId, setOrgId] = useState(orgs[0] ? orgs[0].id : "");
    const [org, setOrg] = useState({ name: "", type: "동호회", rep: "", phone: "", bizno: "" });
    const setO = (k, v) => setOrg(o => ({ ...o, [k]: v }));
    const canSubmit = name.trim() && (orgMode === "existing" ? orgId : org.name.trim());
    const submit = () => {
      if (!canSubmit) return;
      onCreate({ name: name.trim(), cycle, org: orgMode === "existing" ? { existingId: orgId } : { name: org.name.trim(), type: org.type, rep: org.rep, phone: org.phone, bizno: org.bizno } });
    };
    return (
      <Modal open onClose={onClose} maxWidth={600} title="새 정규대회 만들기"
        sub="정규대회를 만들고 이 대회를 연결하면 회차·랭킹이 누적됩니다."
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="check" onClick={submit} {...(canSubmit ? {} : { disabled: true })}>만들기 · 연결</Btn></>}>
        <label className="ts-field"><span className="ts-field__label">정규대회 이름 *</span>
          <input className="ts-input" value={name} onChange={e => setName(e.target.value)} placeholder="예: BDR 시티 리그" />
        </label>
        <label className="ts-field"><span className="ts-field__label">개최 주기</span>
          <div className="ts-segment">{CYCLES.map(c => <button key={c} type="button" className="ts-segment__btn" data-active={cycle === c} onClick={() => setCycle(c)}>{c}</button>)}</div>
        </label>
        <div className="ts-field" style={{ marginBottom: 8 }}><span className="ts-field__label">주최 단체 *</span>
          <div className="ts-segment">
            <button type="button" className="ts-segment__btn" data-active={orgMode === "existing"} onClick={() => setOrgMode("existing")} {...(orgs.length ? {} : { disabled: true })}>기존 단체</button>
            <button type="button" className="ts-segment__btn" data-active={orgMode === "new"} onClick={() => setOrgMode("new")}>새 단체 만들기</button>
          </div>
        </div>
        {orgMode === "existing" ? (
          orgs.length ? (
            <select className="ts-select" value={orgId} onChange={e => setOrgId(e.target.value)}>
              {orgs.map(o => <option key={o.id} value={o.id}>{o.name}{o.approved ? "" : " (승인 대기)"}</option>)}
            </select>
          ) : <div className="ct-emptybox" style={{ padding: 18 }}>등록된 단체가 없습니다. 새 단체를 만드세요.</div>
        ) : (
          <div>
            <div className="ops-orgnew">
              <label className="ts-field" style={{ margin: 0, gridColumn: "1 / -1" }}><span className="ts-field__label">단체명 *</span><input className="ts-input" value={org.name} onChange={e => setO("name", e.target.value)} placeholder="예: 강남 바스켓 크루" /></label>
              <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">유형</span><select className="ts-select" value={org.type} onChange={e => setO("type", e.target.value)}>{ORG_TYPES.map(t => <option key={t}>{t}</option>)}</select></label>
              <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">대표자</span><input className="ts-input" value={org.rep} onChange={e => setO("rep", e.target.value)} placeholder="이름" /></label>
              <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">연락처</span><input className="ts-input" value={org.phone} onChange={e => setO("phone", e.target.value)} placeholder="010-0000-0000" /></label>
              <label className="ts-field" style={{ margin: 0 }}><span className="ts-field__label">사업자번호 (선택)</span><input className="ts-input" value={org.bizno} onChange={e => setO("bizno", e.target.value)} placeholder="미입력 가능" /></label>
            </div>
            <div className="ops-note"><Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} /><span>단체는 <b>관리자 승인</b>이 필요합니다. 지금은 <b>임시(승인 전)</b> 상태로 생성되며 정규대회 연결·대회 생성은 가능하지만, <b>단체 승인 전에는 대회 공개(노출)가 제한</b>됩니다.</span></div>
          </div>
        )}
      </Modal>
    );
  }

  // ── 운영 인력 모달 (운영진 / 심판 / 기록원) ────────────
  function HrModal({ kind, onClose }) {
    if (kind === "admins") return <Modal open onClose={onClose} maxWidth={600} title="운영진 관리" sub="대회 운영 권한을 가진 인원을 관리합니다." foot={<Btn onClick={onClose}>닫기</Btn>}><window.AdminsPanel /></Modal>;
    if (kind === "recorders") return <Modal open onClose={onClose} maxWidth={760} title="기록원 배정" sub="기록원 풀과 경기별 배정을 관리합니다." foot={<Btn onClick={onClose}>닫기</Btn>}><window.RecordersPanel /></Modal>;
    // referees
    const refs = [{ n: "김심판", g: "1급" }, { n: "이심판", g: "2급" }, { n: "박심판", g: "2급" }];
    return (
      <Modal open onClose={onClose} maxWidth={520} title="심판 배정" sub="이 대회에 배정된 심판입니다."
        foot={<><Btn variant="secondary" onClick={onClose}>닫기</Btn><Btn iconRight="arrow-up-right" onClick={() => { location.href = "심판 관리자.html"; }}>심판 관리자에서 배정</Btn></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {refs.map(r => (
            <div key={r.n} className="ts-card ts-card--tight" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="ts-avatar" style={{ width: 32, height: 32, fontSize: 13, background: "var(--primary-weak)", color: "var(--primary)" }}>{r.n[0]}</span><b style={{ fontSize: 14 }}>{r.n}</b></div>
              <Badge tone="grey">{r.g}</Badge>
            </div>
          ))}
        </div>
      </Modal>
    );
  }

  // ── 공지 등록 모달 ──────────────────────────
  function NoticeModal({ onClose, onSubmit }) {
    const [text, setText] = useState("");
    const [push, setPush] = useState(true);
    return (
      <Modal open onClose={onClose} maxWidth={560} title="공지 등록" sub="참가팀에게 공지를 등록하고 푸시로 발송합니다."
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="send" onClick={() => onSubmit({ text: text.trim(), push })} {...(text.trim() ? {} : { disabled: true })}>{push ? "등록 · 푸시 발송" : "등록"}</Btn></>}>
        <label className="ts-field"><span className="ts-field__label">공지 내용 *</span>
          <textarea className="ts-textarea" style={{ minHeight: 120 }} value={text} onChange={e => setText(e.target.value)} placeholder="예: 2일차 경기장이 잠실학생체육관으로 변경되었습니다." />
        </label>
        <label className="ops-pushrow">
          <window.Check on={push} onChange={setPush} />
          <div><div className="ops-pushrow__t">참가팀 푸시 발송</div><div className="ops-pushrow__s">등록 즉시 전체 참가팀에게 푸시 알림을 보냅니다.</div></div>
        </label>
      </Modal>
    );
  }

  // ── 기록 모드 설정 모달 ──────────────────────
  function RecordModeModal({ value, onClose, onSubmit }) {
    const [sel, setSel] = useState(value);
    return (
      <Modal open onClose={onClose} maxWidth={560} title="기록 모드 설정" sub="대회 기본 기록 방식을 선택합니다. 매치별로 따로 변경할 수 있습니다."
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="check" onClick={() => onSubmit(sel)}>적용</Btn></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {RECORD_MODES.map(m => (
            <button key={m.id} type="button" className="ops-modeopt" data-on={sel === m.id ? "true" : "false"} onClick={() => setSel(m.id)}>
              <span className="ops-modeopt__ic"><Icon name={m.icon} size={18} /></span>
              <span className="ops-modeopt__body">
                <span className="ops-modeopt__t">{m.label}<span className="ops-modeopt__tag">{m.tag}</span></span>
                <span className="ops-modeopt__d">{m.desc}</span>
              </span>
              <span className="ops-modeopt__radio" data-on={sel === m.id ? "true" : "false"}>{sel === m.id && <Icon name="check" size={14} />}</span>
            </button>
          ))}
        </div>
      </Modal>
    );
  }

  // ── 운영관리 ────────────────────────────────────────────
  function OpsManage() {
    const [orgs, setOrgs] = useState([{ id: "o1", name: "BDR 농구문화", type: "정식 주최사", approved: true }]);
    const [leagues, setLeagues] = useState([
      { id: "l-summer", name: "BDR 서머 오픈 정규대회", cycle: "연간", orgId: "o1" },
      { id: "l-challenge", name: "BDR 챌린지 정규대회", cycle: "반기", orgId: "o1" },
    ]);
    const [linked, setLinked] = useState(null);
    const [leagueModal, setLeagueModal] = useState(false);
    const [hr, setHr] = useState(null);
    const [recordOpen, setRecordOpen] = useState(false);
    const [recordMode, setRecordMode] = useState("full");
    const [noticeOpen, setNoticeOpen] = useState(false);
    const [notices, setNotices] = useState([
      { id: "n1", text: "2일차(06.22) 일부 경기 코트가 변경되었습니다. 일정 탭에서 확인해 주세요.", push: true, at: "2026.06.20 14:10" },
      { id: "n2", text: "참가비 미납 팀은 06.18까지 입금 부탁드립니다.", push: true, at: "2026.06.15 09:30" },
      { id: "n3", text: "대회 요강이 일부 업데이트되었습니다.", push: false, at: "2026.06.10 17:00" },
    ]);
    const [show, setShow] = useState(null);
    const toast = (m) => { setShow(m); window.clearTimeout(window.__ops_t); window.__ops_t = setTimeout(() => setShow(null), 2600); };
    const addNotice = ({ text, push }) => { if (!text) return; setNotices(ns => [{ id: "n" + Date.now(), text, push, at: "방금" }, ...ns]); setNoticeOpen(false); toast(push ? "공지 등록 + 푸시 발송(시연)" : "공지 등록(시연)"); };

    const linkedLeague = leagues.find(l => l.id === linked);
    const orgOf = (l) => l && orgs.find(o => o.id === l.orgId);
    const linkedOrg = orgOf(linkedLeague);
    const exposureBlocked = !!(linkedOrg && !linkedOrg.approved);
    useEffect(() => { window.__exposureBlocked = exposureBlocked; }, [exposureBlocked]);

    const notifyOperator = () => toast("운영자에게 알림 발송 — 단체 승인 후 대회 노출 가능");
    const linkLeague = (id) => {
      setLinked(id);
      const o = orgOf(leagues.find(l => l.id === id));
      if (o && !o.approved) { notifyOperator(); } else { toast("정규대회 연결"); }
    };
    const createLeague = ({ name, cycle, org }) => {
      let orgId, approved;
      if (org.existingId) { orgId = org.existingId; approved = (orgs.find(o => o.id === orgId) || {}).approved; }
      else { orgId = "o" + Date.now(); approved = false; setOrgs(os => [...os, { id: orgId, name: org.name, type: org.type, approved: false, temp: true }]); }
      const id = "l" + Date.now();
      setLeagues(ls => [...ls, { id, name, cycle, orgId }]);
      setLinked(id);
      setLeagueModal(false);
      if (!approved) { notifyOperator(); } else { toast("정규대회 생성 · 연결 완료"); }
    };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 정규대회 연결 */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h">
            <div><h3>정규대회 연결</h3><p>연결하면 회차·랭킹이 누적됩니다.</p></div>
            {linkedLeague && <Btn variant="ghost" size="sm" onClick={() => { setLinked(null); toast("연결 해제"); }}>연결 해제</Btn>}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
            <button className="ts-chip" data-active={!linked} onClick={() => { setLinked(null); }}>미연결</button>
            {leagues.map(l => { const o = orgOf(l); return (
              <button key={l.id} className="ts-chip" data-active={linked === l.id} onClick={() => linkLeague(l.id)}>
                {l.name}{o && !o.approved && <Icon name="clock" size={13} />}
              </button>
            ); })}
            <button className="ts-chip" onClick={() => setLeagueModal(true)}><Icon name="plus" size={14} />새 정규대회</button>
          </div>
          {linkedLeague && (
            <div className="ops-linked">
              <Icon name="link" size={15} color="var(--primary)" />
              <b>{linkedLeague.name}</b>
              <span className="ct-pill" data-tone="info">{linkedLeague.cycle}</span>
              <span className="ct-pill" data-tone={linkedOrg && linkedOrg.approved ? "ok" : "warn"}>{linkedOrg ? linkedOrg.name : "단체 없음"} · {linkedOrg && linkedOrg.approved ? "승인" : "승인 대기"}</span>
            </div>
          )}
          {exposureBlocked && (
            <div className="ops-warn">
              <Icon name="alert-triangle" size={16} color="var(--warn)" style={{ flex: "0 0 auto", marginTop: 1 }} />
              <span><b>주최 단체 승인 대기</b> — 대회 생성·운영은 가능하지만 공개(노출)는 제한됩니다. 단체 승인 후 자동 노출되며, 대회운영자에게 알림이 발송되었습니다.</span>
            </div>
          )}
        </div>

        {/* 운영 인력 (컴팩트) */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h"><div><h3>운영 인력</h3><p>운영진 · 심판 · 기록원 배정</p></div></div>
          <div style={{ marginTop: 4 }}>
            {[["운영진", "shield", WS.admins.length, "admins"], ["심판", "flag", 3, "referees"], ["기록원", "pencil", WS.recorders.filter(r => r.active).length, "recorders"]].map(([l, ic, n, k]) => (
              <div key={k} className="ops-hrrow">
                <span className="ops-hrrow__ic"><Icon name={ic} size={16} /></span>
                <span className="ops-hrrow__nm">{l}</span>
                <span className="ops-hrrow__n">{n}명</span>
                <Btn variant="secondary" size="sm" onClick={() => setHr(k)}>관리</Btn>
              </div>
            ))}
          </div>
        </div>

        {/* 공지 목록 */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h">
            <div><h3>참가팀 공지</h3><p>등록된 공지 {notices.length}건</p></div>
            <Btn size="sm" icon="plus" onClick={() => setNoticeOpen(true)}>공지 등록</Btn>
          </div>
          <div style={{ marginTop: 6 }}>
            {notices.length ? notices.map(n => (
              <div key={n.id} className="ops-noticerow">
                <div className="ops-noticerow__body">
                  <div className="ops-noticerow__t">{n.text}</div>
                  <div className="ops-noticerow__m">{n.at}{n.push ? " · 푸시 발송됨" : ""}</div>
                </div>
                {n.push && <span className="ct-pill" data-tone="info">푸시</span>}
                <button className="ct-iconbtn" title="삭제" onClick={() => { setNotices(ns => ns.filter(x => x.id !== n.id)); toast("공지 삭제"); }}><Icon name="trash-2" size={15} /></button>
              </div>
            )) : <div className="ct-emptybox" style={{ padding: 18 }}>등록된 공지가 없습니다.</div>}
          </div>
        </div>

        {/* 기록 모드 */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h">
            <div><h3>경기 운영 · 기록 모드</h3><p>대회 기본: <b>{RECORD_MODES.find(m => m.id === recordMode).label}</b> ({RECORD_MODES.find(m => m.id === recordMode).tag}) · 매치별 변경 가능</p></div>
            <Btn variant="secondary" size="sm" icon="sliders-horizontal" onClick={() => setRecordOpen(true)}>설정</Btn>
          </div>
        </div>

        {leagueModal && <LeagueCreateModal orgs={orgs} onClose={() => setLeagueModal(false)} onCreate={createLeague} />}
        {hr && <HrModal kind={hr} onClose={() => setHr(null)} />}
        {noticeOpen && <NoticeModal onClose={() => setNoticeOpen(false)} onSubmit={addNotice} />}
        {recordOpen && <RecordModeModal value={recordMode} onClose={() => setRecordOpen(false)} onSubmit={(v) => { setRecordMode(v); setRecordOpen(false); toast(RECORD_MODES.find(m => m.id === v).label + " 기록 모드로 설정(시연)"); }} />}
        {show && <div className="ts-toast"><Icon name="check" size={16} />{show}</div>}
      </div>
    );
  }

  // ── 정산 ────────────────────────────────────────────────
  const EXP_CAT_KEY = "bdr_expense_cats";
  const DEFAULT_EXP_CATS = ["인건비", "대관비", "홍보비", "운영비", "시상"];
  const wonF = (n) => (Number(n) || 0).toLocaleString() + "원";

  function ExpenseModal({ cats, onAddCat, onClose, onSubmit }) {
    const [cat, setCat] = useState(cats[0]);
    const [label, setLabel] = useState("");
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [adding, setAdding] = useState(false);
    const [newCat, setNewCat] = useState("");
    const canSubmit = label.trim() && +amount > 0;
    const addCat = () => { const c = newCat.trim(); if (!c) return; onAddCat(c); setCat(c); setNewCat(""); setAdding(false); };
    return (
      <Modal open onClose={onClose} maxWidth={420} title="지출 추가" sub="대회 운영 지출을 분류별로 기록합니다."
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="check" onClick={() => onSubmit({ cat, label: label.trim(), amount: +amount, memo: memo.trim() })} {...(canSubmit ? {} : { disabled: true })}>지출 추가</Btn></>}>
        <label className="ts-field"><span className="ts-field__label">분류</span>
          <div style={{ display: "flex", gap: 8 }}>
            <select className="ts-select" style={{ flex: 1, minWidth: 0 }} value={cat} onChange={e => setCat(e.target.value)}>{cats.map(c => <option key={c}>{c}</option>)}</select>
            <Btn variant="secondary" icon={adding ? "x" : "plus"} onClick={() => setAdding(a => !a)}>분류</Btn>
          </div>
          {adding && (
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input className="ts-input" style={{ flex: 1, minWidth: 0 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="새 분류명 (예: 보험료)" onKeyDown={e => { if (!e.nativeEvent.isComposing && e.key === "Enter") addCat(); }} />
              <Btn onClick={addCat} {...(newCat.trim() ? {} : { disabled: true })}>추가</Btn>
            </div>
          )}
        </label>
        <label className="ts-field"><span className="ts-field__label">내용 *</span><input className="ts-input" value={label} onChange={e => setLabel(e.target.value)} placeholder="예: 체육관 대관료 (2일)" /></label>
        <label className="ts-field"><span className="ts-field__label">금액 *</span>
          <div style={{ position: "relative" }}>
            <input type="number" className="ts-input" style={{ paddingRight: 36, textAlign: "right" }} value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
            <span style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, fontWeight: 700, color: "var(--ink-mute)", pointerEvents: "none" }}>원</span>
          </div>
        </label>
        <label className="ts-field" style={{ marginBottom: 0 }}><span className="ts-field__label">메모</span><textarea className="ts-textarea" style={{ minHeight: 60 }} value={memo} onChange={e => setMemo(e.target.value)} placeholder="비고 (선택)" /></label>
      </Modal>
    );
  }

  function Settle() {
    const [pays, setPays] = useState(() => { const m = {}; WS.teams.forEach(t => { m[t.id] = t.paid; }); return m; });
    const [openDiv, setOpenDiv] = useState(null);
    const [expOpen, setExpOpen] = useState(false);
    const [expenses, setExpenses] = useState([
      { id: "e1", cat: "대관비", label: "체육관 대관료 (2일)", amount: 1600000, memo: "장충체육관 · 06.15·06.22" },
      { id: "e2", cat: "인건비", label: "심판 배정비", amount: 720000, memo: "심판 6명" },
      { id: "e3", cat: "인건비", label: "기록원 수당", amount: 400000, memo: "" },
      { id: "e4", cat: "시상", label: "트로피·메달", amount: 350000, memo: "" },
    ]);
    const [cats, setCats] = useState(() => {
      try { const s = JSON.parse(window.localStorage.getItem(EXP_CAT_KEY)); if (Array.isArray(s) && s.length) return s; } catch (e) {}
      return DEFAULT_EXP_CATS;
    });
    const [show, setShow] = useState(null);
    const toast = (m) => { setShow(m); window.clearTimeout(window.__set_t); window.__set_t = setTimeout(() => setShow(null), 2400); };
    const addCat = (c) => setCats(cs => { if (cs.includes(c)) return cs; const n = [...cs, c]; try { window.localStorage.setItem(EXP_CAT_KEY, JSON.stringify(n)); } catch (e) {} return n; });
    const addExpense = ({ cat, label, amount, memo }) => { setExpenses(es => [...es, { id: "e" + Date.now(), cat, label, amount, memo }]); setExpOpen(false); toast("지출 추가(시연)"); };

    const feeOf = (t) => { const r = WS.divisionRules.find(d => d.code === t.category); return r ? r.fee : 0; };
    const income = WS.teams.filter(t => pays[t.id] === "paid").reduce((s, t) => s + feeOf(t), 0);
    const out = expenses.reduce((s, e) => s + e.amount, 0);
    const divSummary = WS.divisionRules.map(r => {
      const dteams = WS.teams.filter(t => t.category === r.code);
      const paidTeams = dteams.filter(t => pays[t.id] === "paid");
      return { ...r, teams: dteams, total: dteams.length, paidN: paidTeams.length, sum: paidTeams.reduce((s, t) => s + feeOf(t), 0) };
    });
    const curDiv = openDiv ? divSummary.find(d => d.code === openDiv) : null;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="ct-panel-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {[["입금 합계", wonF(income), "ok"], ["지출 합계", wonF(out), "err"], ["잔액", wonF(income - out), income - out >= 0 ? "info" : "warn"]].map(([l, v, tone]) => (
            <div key={l} className="ts-card ts-card--flat" style={{ padding: 16 }}><div className="ct-metric__lbl">{l}</div><div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: tone === "err" ? "var(--danger)" : tone === "ok" ? "var(--ok)" : "var(--ink)" }}>{v}</div></div>
          ))}
        </div>

        {/* 종별 참가비 요약 — 카드 클릭 시 상세 */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h"><div><h3>참가비 입금 현황</h3><p>종별을 누르면 팀별 납부 현황을 확인·수정할 수 있습니다.</p></div></div>
          <div className="set-divgrid">
            {divSummary.map(r => (
              <button key={r.code} type="button" className="set-divcard" onClick={() => setOpenDiv(r.code)}>
                <div className="set-divcard__top"><span className="set-divcard__nm">{r.label}</span><Icon name="chevron-right" size={16} color="var(--ink-dim)" /></div>
                <div className="set-divcard__amt">{wonF(r.sum)}</div>
                <div className="set-divcard__sub">납부 {r.paidN}/{r.total}팀</div>
                <div className="set-divbar"><span style={{ width: (r.total ? r.paidN / r.total * 100 : 0) + "%" }} /></div>
              </button>
            ))}
          </div>
        </div>

        {/* 지출 현황 */}
        <div className="ts-card ts-card--flat">
          <div className="ops-card-h"><div><h3>지출 현황</h3><p>총 {expenses.length}건 · {wonF(out)}</p></div><Btn variant="secondary" size="sm" icon="plus" onClick={() => setExpOpen(true)}>지출 추가</Btn></div>
          <div style={{ marginTop: 6 }}>
            {expenses.length ? expenses.map(e => (
              <div key={e.id} className="set-exprow">
                <span className="ct-pill" data-tone="mute">{e.cat}</span>
                <div className="set-exprow__body">
                  <div className="set-exprow__t">{e.label}</div>
                  {e.memo && <div className="set-exprow__m">{e.memo}</div>}
                </div>
                <span className="set-exprow__amt">{wonF(e.amount)}</span>
                <button className="ct-iconbtn" title="삭제" onClick={() => { setExpenses(es => es.filter(x => x.id !== e.id)); toast("지출 삭제"); }}><Icon name="trash-2" size={15} /></button>
              </div>
            )) : <div className="ct-emptybox" style={{ padding: 18 }}>등록된 지출이 없습니다.</div>}
          </div>
        </div>

        {/* 종별 상세 모달 — 팀별 납부 수정 */}
        {curDiv && (
          <Modal open onClose={() => setOpenDiv(null)} maxWidth={620} title={curDiv.label + " 참가비"} sub={`납부 ${curDiv.paidN}/${curDiv.total}팀 · 입금 ${wonF(curDiv.sum)}`}
            foot={<Btn onClick={() => setOpenDiv(null)}>닫기</Btn>}>
            <div className="amt-table-wrap"><table className="amt-table"><thead><tr><th>팀</th><th>참가비</th><th>납부</th></tr></thead>
              <tbody>{curDiv.teams.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td className="amt-table__score">{wonF(feeOf(t))}</td>
                  <td><select className="ts-select" style={{ width: 108 }} value={pays[t.id]} onChange={e => { setPays(p => ({ ...p, [t.id]: e.target.value })); toast("납부 상태 변경(시연)"); }}>
                    <option value="unpaid">미납</option><option value="paid">납부</option><option value="refunded">환불</option>
                  </select></td>
                </tr>
              ))}</tbody></table></div>
          </Modal>
        )}
        {expOpen && <ExpenseModal cats={cats} onAddCat={addCat} onClose={() => setExpOpen(false)} onSubmit={addExpense} />}
        {show && <div className="ts-toast"><Icon name="check" size={16} />{show}</div>}
      </div>
    );
  }

  const CONTENT = {
    teams: () => <window.TeamsPanel />,
    bracket: () => <window.BracketPanel />,
    schedule: () => <window.SchedulePanel />,
    ops: () => <OpsManage />,
    site: () => <window.SitePanel />,
    settle: () => <Settle />,
  };

  const NAV = [
    { label: "운영 메뉴" },
    ...MENUS.map(m => ({ id: m.id, icon: m.icon, text: m.label })),
  ];

  window.OperateWorkspace = function OperateWorkspace() {
    const [menu, setMenu] = useState("teams");
    const cur = MENUS.find(m => m.id === menu);
    const Body = CONTENT[menu];
    const nav = NAV.map(n => n.id === "teams" ? { ...n, badge: WS.summary.teamCount } : n);
    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 운영" nav={nav} active={menu}
        onNav={(id) => { setMenu(id); window.scrollTo({ top: 0 }); }}
        user={{ initial: "운", name: "대회 운영자", role: "BDR 운영팀" }}>
        <div className="ts-ph" style={{ marginBottom: 16 }}>
          <div className="ts-ph__row">
            <div>
              <div className="ts-ph__eyebrow">대회 운영 워크스페이스 · v2.41 (Toss)</div>
              <div className="ts-ph__title">{WS.tournament.name}</div>
              <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span className="ct-pill" data-tone="ok">진행중</span>
                <span className="ct-pill" data-tone="info">D-{WS.tournament.dDay}</span>
                <span className="ct-pill" data-tone="mute">참가 {WS.summary.teamCount}팀 · {WS.summary.divisionCount}종별</span>
              </div>
            </div>
            <Btn variant="secondary" size="sm" iconRight="pencil" onClick={() => { location.href = "대회 수정.html"; }}>대회 정보 수정</Btn>
          </div>
        </div>

        <section className="ts-card">
          <div className="ct-section__head"><span className="ct-headicon"><Icon name={cur.icon} size={18} /></span><div><h2 className="ct-section__title">{cur.label}</h2><p className="ct-section__sub">{cur.desc}</p></div></div>
          <Body />
        </section>
      </window.AdminShell>
    );
  };
})();
