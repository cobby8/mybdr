/* global React, window */
// ============================================================
// operate.jsx — 대회 운영 워크스페이스 (Toss)
//   6 메뉴: 참가팀 · 대진표 · 일정 · 운영관리 · 사이트 · 정산
//   기존 패널 재사용 + 운영관리/정산 신규. mock 동작.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge } = window;
  const WS = window.WS;

  const MENUS = [
    { id: "teams", label: "참가팀", icon: "users", desc: "각 종별 참가신청·참가비 납부 현황" },
    { id: "bracket", label: "대진표", icon: "git-merge", desc: "각 종별 대진표 생성" },
    { id: "schedule", label: "일정", icon: "calendar-clock", desc: "대진표 기반 일정 관리" },
    { id: "ops", label: "운영관리", icon: "shield-check", desc: "운영진·심판·기록원·공지·경기 운영" },
    { id: "site", label: "사이트", icon: "globe", desc: "공개 사이트 개설·관리" },
    { id: "settle", label: "정산", icon: "wallet", desc: "참가비 입금·지출 현황" },
  ];

  // ── 운영관리 ────────────────────────────────────────────
  function OpsManage() {
    const [series, setSeries] = useState("none");
    const [notice, setNotice] = useState("");
    const [push, setPush] = useState(true);
    const [show, setShow] = useState(null);
    const toast = (m) => { setShow(m); setTimeout(() => setShow(null), 2400); };
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>정규대회 연결</h3>
          <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 10 }}>이 대회를 정규 시리즈에 연결하면 회차·랭킹이 누적됩니다.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[["none", "미연결"], ["bdr-summer", "BDR 서머 오픈 시리즈"], ["bdr-challenge", "BDR 챌린지 시리즈"]].map(([k, l]) => (
              <button key={k} className="ts-chip" data-active={series === k} onClick={() => { setSeries(k); toast("정규대회 연결(시연)"); }}>{l}</button>
            ))}
          </div>
        </div>

        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>운영진 · 심판 · 기록원</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }} className="ops-role-grid">
            {[["운영진", "shield_person", WS.admins.length], ["심판", "whistle", 3], ["기록원", "edit-3", WS.recorders.filter(r => r.active).length]].map(([l, ic, n]) => (
              <div key={l} className="ct-metric" style={{ display: "flex", alignItems: "center", gap: 8 }}><Icon name={ic === "shield_person" ? "shield" : ic === "whistle" ? "flag" : "pencil"} size={18} color="var(--primary)" /><div><div className="ct-metric__lbl">{l}</div><div className="ct-metric__val">{n}명</div></div></div>
            ))}
          </div>
          <window.AdminsPanel />
          <div style={{ borderTop: "1px solid var(--border)", margin: "14px 0" }} />
          <window.RecordersPanel />
        </div>

        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 8 }}>참가팀 공지사항</h3>
          <textarea className="ts-textarea" value={notice} onChange={e => setNotice(e.target.value)} placeholder="공지 내용을 입력하세요. (예: 2일차 경기장 변경 안내)" />
          <label className="ct-checkrow" style={{ marginTop: 10 }}><window.Check on={push} onChange={setPush} /><span>참가팀에게 푸시 발송</span></label>
          <div style={{ textAlign: "right", marginTop: 10 }}><Btn icon="send" onClick={() => toast(push ? "공지 등록 + 푸시 발송(시연)" : "공지 등록(시연)")} {...(notice.trim() ? {} : { disabled: true })}>공지 등록{push ? " · 푸시" : ""}</Btn></div>
        </div>

        <div className="ts-card ts-card--flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div><h3 style={{ fontSize: 14 }}>경기 운영 · 기록 모드</h3><p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>대회 기본: <b>기록앱</b> · 매치별 override 가능</p></div>
            <Btn variant="secondary" size="sm" icon="sliders-horizontal" onClick={() => toast("기록 모드 설정(시연)")}>기록 모드 설정</Btn>
          </div>
        </div>
        {show && <div className="ts-toast"><Icon name="check" size={16} />{show}</div>}
      </div>
    );
  }

  // ── 정산 ────────────────────────────────────────────────
  function Settle() {
    const teams = WS.teams;
    const paid = teams.filter(t => t.paid === "paid");
    const income = paid.reduce((s, t) => s + (WS.divisionRules.find(r => r.code === t.category)?.fee ?? 0), 0);
    const expenses = [
      { id: "e1", label: "체육관 대관료 (2일)", amount: 1600000 },
      { id: "e2", label: "심판 배정비", amount: 720000 },
      { id: "e3", label: "기록원 수당", amount: 400000 },
      { id: "e4", label: "트로피·메달", amount: 350000 },
    ];
    const out = expenses.reduce((s, e) => s + e.amount, 0);
    const won = (n) => n.toLocaleString() + "원";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="ct-panel-stats" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
          {[["입금 합계", won(income), "ok"], ["지출 합계", won(out), "err"], ["잔액", won(income - out), income - out >= 0 ? "info" : "warn"]].map(([l, v, tone]) => (
            <div key={l} className="ts-card ts-card--flat" style={{ padding: 16 }}><div className="ct-metric__lbl">{l}</div><div style={{ fontSize: 20, fontWeight: 800, marginTop: 4, color: tone === "err" ? "var(--danger)" : tone === "ok" ? "var(--ok)" : "var(--ink)" }}>{v}</div></div>
          ))}
        </div>

        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>참가비 입금 현황 ({paid.length}/{teams.length}팀)</h3>
          <div className="amt-table-wrap"><table className="amt-table"><thead><tr><th>팀</th><th>종별</th><th>참가비</th><th>납부</th></tr></thead>
            <tbody>{teams.map(t => { const fee = WS.divisionRules.find(r => r.code === t.category)?.fee ?? 0; return (
              <tr key={t.id}><td style={{ fontWeight: 600 }}>{t.name}</td><td className="amt-table__div">{WS.divisionRules.find(r => r.code === t.category)?.label ?? "-"}</td><td className="amt-table__score">{won(fee)}</td><td><span className="ct-pill" data-tone={t.paid === "paid" ? "ok" : t.paid === "refunded" ? "mute" : "warn"}>{window.PAY_LABEL[t.paid]}</span></td></tr>
            ); })}</tbody></table></div>
        </div>

        <div className="ts-card ts-card--flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <h3 style={{ fontSize: 14 }}>지출 현황</h3><Btn variant="secondary" size="sm" icon="plus">지출 추가</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {expenses.map(e => <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--grey-50)", borderRadius: 12 }}><span style={{ fontSize: 14 }}>{e.label}</span><span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>{won(e.amount)}</span></div>)}
          </div>
        </div>
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

  window.OperateWorkspace = function OperateWorkspace() {
    const [menu, setMenu] = useState("teams");
    const cur = MENUS.find(m => m.id === menu);
    const Body = CONTENT[menu];
    return (
      <div className="tw-shell">
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

        {/* 6 메뉴 탭 */}
        <div className="op-menu">
          {MENUS.map(m => { const on = menu === m.id; return (
            <button key={m.id + (on ? "-on" : "-off")} className="op-menu__item" style={on ? { borderColor: "var(--primary)", background: "var(--primary-weak)", color: "var(--primary)" } : undefined} onClick={() => { setMenu(m.id); window.scrollTo({ top: 0 }); }}>
              <Icon name={m.icon} size={18} /><span>{m.label}</span>
            </button>
          ); })}
        </div>

        <section className="ts-card">
          <div className="ct-section__head"><span className="ct-headicon"><Icon name={cur.icon} size={18} /></span><div><h2 className="ct-section__title">{cur.label}</h2><p className="ct-section__sub">{cur.desc}</p></div></div>
          <Body />
        </section>
      </div>
    );
  };
})();
