/* global React, window */
// ============================================================
// workspace.jsx — TournamentWorkspace 셸 (Toss · 스텝 분할)
//   5 스텝: 대회정보 > 일정·장소 > 종별·디비전 > 경기설정 > 접수·공개
//   스텝별 이동(이전/다음 + 상단 segment). 저장 = mock.
//   function-lock-B1.md A 준수.
// ============================================================
(function () {
  const { useState, useMemo, useEffect } = React;
  const { Icon, Btn } = window;
  const WS = window.WS;

  const STEPS = [
    { id: "info", label: "대회정보", icon: "info" },
    { id: "schedule", label: "일정·장소", icon: "calendar-days" },
    { id: "divisions", label: "종별·디비전", icon: "layout-grid" },
    { id: "game", label: "경기설정", icon: "sliders-horizontal" },
    { id: "publish", label: "접수·공개", icon: "globe" },
  ];
  const IDX = { info: 0, schedule: 1, divisions: 2, game: 3, publish: 4, setup: 0, teams: 4, structure: 2, matches: 3, staff: 3 };

  function Field({ label, span2, children }) {
    return <label className={"ts-field" + (span2 ? " ct-span2" : "")} style={{ margin: 0 }}><span className="ts-field__label">{label}</span>{children}</label>;
  }
  function GroupTitle({ children, flush }) { return <div className={"ct-group-title" + (flush ? " ct-group-title--flush" : "")}>{children}</div>; }
  function PanelSummary({ stats, panels, open, toggle }) {
    return (
      <div className="ct-panel-summary">
        <div className="ct-panel-stats">{stats.map(([l, v]) => <div key={l} className="ct-metric"><div className="ct-metric__lbl">{l}</div><div className="ct-metric__val">{v}</div></div>)}</div>
        <div className="ct-panel-actions">{panels.map(([id, l]) => <Btn key={id} size="sm" variant={open.has(id) ? "primary" : "secondary"} onClick={() => toggle(id)}>{l}</Btn>)}</div>
      </div>
    );
  }
  const PANEL = { teams: "TeamsPanel", divisions: "DivisionsPanel", matches: "MatchesPanel", bracket: "BracketPanel", recorders: "RecordersPanel", site: "SitePanel", admins: "AdminsPanel" };
  function Embed({ id }) { const C = window[PANEL[id]]; return <div className="ct-panel-embed">{C ? <C /> : null}</div>; }

  window.TournamentWorkspace = function TournamentWorkspace({ mode = "edit" }) {
    const isCreate = mode === "create";
    const init = isCreate ? (WS.emptyForm || WS.form) : WS.form;
    const [step, setStep] = useState(0);
    const [openP, setOpenP] = useState(new Set(["divisions"]));
    const [form, setForm] = useState(init);
    const [saved, setSaved] = useState(init);
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState("idle");
    const s = WS.summary, ms = WS.matchStats;
    const pct = Math.round((s.progressCompleted / s.progressTotal) * 100);
    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

    const patch = (k, v) => { setState("idle"); setForm(f => ({ ...f, [k]: v })); };
    const toggle = (id) => setOpenP(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const go = (i) => { setStep(Math.max(0, Math.min(STEPS.length - 1, i))); window.history.replaceState(null, "", "#" + STEPS[Math.max(0, Math.min(4, i))].id); window.scrollTo({ top: 0, behavior: "smooth" }); };
    useEffect(() => { const raw = window.location.hash.replace("#", ""); if (raw in IDX) setStep(IDX[raw]); }, []);

    const save = () => {
      if (form.rosterMin > form.rosterMax) { setState("err"); return; }
      setSaving(true); setState("idle");
      setTimeout(() => { setSaving(false); setSaved(form); setState("ok"); }, 700);
    };
    const stateMsg = saving ? "저장 중입니다" : dirty ? "변경사항이 있습니다" : state === "ok" ? "저장되었습니다" : "변경사항 없음";
    const cur = STEPS[step];

    return (
      <div className="tw-shell">
        {/* 헤더 */}
        <div className="ts-ph" style={{ marginBottom: 16 }}>
          <div className="ts-ph__row">
            <div>
              <div className="ts-ph__eyebrow">{isCreate ? "새 대회 만들기 · v2.41 (Toss)" : "대회 수정 · v2.41 (Toss)"}</div>
              <div className="ts-ph__title">{isCreate ? "새 대회 만들기" : WS.tournament.name}</div>
              {!isCreate && <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                <span className="ct-pill" data-tone={s.statusTone}>{s.statusLabel}</span>
                <span className="ct-pill" data-tone={s.sitePublished ? "ok" : "mute"}>{s.sitePublished ? "공개 중" : "비공개"}</span>
                <span className="ct-pill" data-tone={s.missingCount ? "warn" : "ok"}>{s.missingCount ? `필수 ${s.missingCount}개 남음` : "공개 가능"}</span>
                <span className="ct-pill" data-tone="info">D-{WS.tournament.dDay}</span>
              </div>}
            </div>
            <Btn variant="secondary" size="sm" iconRight="arrow-up-right">사이트로</Btn>
          </div>
        </div>

        {/* 스텝 네비 */}
        <div className="tw-steps">
          {STEPS.map((x, i) => (
            <button key={x.id + "-" + (i === step ? "a" : i < step ? "d" : "n")} className={"tw-step" + (i === step ? " is-active" : "") + (i < step ? " is-done" : "")} onClick={() => go(i)}>
              <span className="tw-step__num">{i < step ? <Icon name="check" size={15} /> : i + 1}</span>
              <span className="tw-step__lbl">{x.label}</span>
            </button>
          ))}
        </div>
        <div className="ct-progress" style={{ marginBottom: 18 }}><div className="ct-progress__fill" style={{ width: ((step + 1) / STEPS.length * 100) + "%" }} /></div>

        {/* 스텝 본문 */}
        <section className="ts-card">
          <div className="ct-section__head"><span className="ct-headicon"><Icon name={cur.icon} size={18} /></span><div><h2 className="ct-section__title">{step + 1}단계 · {cur.label}</h2><p className="ct-section__sub">{STEP_SUB[cur.id]}</p></div></div>

          {cur.id === "info" && (
            <div className="ct-form">
              <div className="ct-form-grid"><GroupTitle flush>대회 정보</GroupTitle>
                <Field label="대회 이름" span2><input className="ts-input" value={form.name} onChange={e => patch("name", e.target.value)} /></Field>
                <Field label="주최"><input className="ts-input" value={form.organizer} onChange={e => patch("organizer", e.target.value)} /></Field>
                <Field label="주관"><input className="ts-input" value={form.host} onChange={e => patch("host", e.target.value)} /></Field>
                <div className="ct-span2"><span className="ts-field__label">후원사</span><div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>{form.sponsors.map(sp => <span key={sp.id} className="ct-sptile"><div className="ct-imgslot">{sp.logo ? "로고" : "+"}</div><div style={{ fontSize: 12, marginTop: 6 }}>{sp.name}</div></span>)}</div></div>
              </div>
              <div><GroupTitle>대회 소개</GroupTitle><Field label="대회 소개"><textarea className="ts-textarea" value={form.description} onChange={e => patch("description", e.target.value)} placeholder="대회 소개" /></Field></div>
              <details className="ct-details"><summary>대표 이미지 관리</summary><div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginTop: 10 }}><div className="ct-imgslot" style={{ aspectRatio: "1/1" }}>대회 로고 1:1</div><div className="ct-imgslot" style={{ aspectRatio: "16/9" }}>포스터/배너 16:9</div></div></details>
            </div>
          )}

          {cur.id === "schedule" && <window.ScheduleVenue form={form} patch={patch} />}

          {cur.id === "divisions" && (
            <div>
              <PanelSummary open={openP} toggle={toggle}
                stats={[["종별", s.divisionCount], ["대진 경기", s.matchCount]]}
                panels={[["divisions", "종별 운영 방식"], ["bracket", "대진 생성"]]} />
              {openP.has("divisions") && <Embed id="divisions" />}
              {openP.has("bracket") && <Embed id="bracket" />}
            </div>
          )}

          {cur.id === "game" && (
            <div>
              <div className="ct-form-grid" style={{ display: "grid", gap: 12, marginBottom: 12 }}>
                <Field label="공인구"><input className="ts-input" value={form.gameBall} onChange={e => patch("gameBall", e.target.value)} /></Field>
                <Field label="경기 인원"><input type="number" className="ts-input" value={form.teamSize} onChange={e => patch("teamSize", +e.target.value)} /></Field>
              </div>
              <div style={{ marginBottom: 12 }}><window.GameSettings rules={form.gameRules} patch={v => patch("gameRules", v)} /></div>
              <div className="ct-form" style={{ marginBottom: 12 }}><GroupTitle flush>운영 안내</GroupTitle>
                <Field label="대회 규칙"><textarea className="ts-textarea" value={form.rules} onChange={e => patch("rules", e.target.value)} /></Field>
                <Field label="상금/시상 안내"><textarea className="ts-textarea" style={{ minHeight: 72 }} value={form.prize} onChange={e => patch("prize", e.target.value)} /></Field>
              </div>
              <div className="ct-form-grid" style={{ display: "grid", gap: 12 }}>
                <GroupTitle flush>선수 구성</GroupTitle>
                <Field label="최소 선수"><input type="number" className="ts-input" value={form.rosterMin} onChange={e => patch("rosterMin", +e.target.value)} /></Field>
                <Field label="최대 선수"><input type="number" className="ts-input" value={form.rosterMax} onChange={e => patch("rosterMax", +e.target.value)} /></Field>
              </div>
            </div>
          )}

          {cur.id === "publish" && (
            <div>
              <div className="ct-form-grid">
                <GroupTitle flush>접수·결제</GroupTitle>
                <Field label="접수 시작"><input type="datetime-local" className="ts-input" value={form.regStart} onChange={e => patch("regStart", e.target.value)} /></Field>
                <Field label="접수 종료"><input type="datetime-local" className="ts-input" value={form.regEnd} onChange={e => patch("regEnd", e.target.value)} /></Field>
                <Field label="은행명"><input className="ts-input" value={form.bankName} onChange={e => patch("bankName", e.target.value)} /></Field>
                <Field label="계좌번호"><input className="ts-input" value={form.bankAccount} onChange={e => patch("bankAccount", e.target.value)} /></Field>
                <Field label="예금주"><input className="ts-input" value={form.bankHolder} onChange={e => patch("bankHolder", e.target.value)} /></Field>
                <Field label="참가비"><input type="number" className="ts-input" value={form.entryFee} onChange={e => patch("entryFee", +e.target.value)} /></Field>
                <Field label="참가 접수 안내" span2><textarea className="ts-textarea" style={{ minHeight: 64 }} value={form.feeNotes} onChange={e => patch("feeNotes", e.target.value)} /></Field>
                <label className="ct-checkrow ct-span2"><window.Check on={form.autoApprove} onChange={v => patch("autoApprove", v)} /><span>참가팀 자동 승인</span></label>
                <label className="ct-checkrow ct-span2"><window.Check on={form.allowWaiting} onChange={v => patch("allowWaiting", v)} /><span>대기 접수 허용</span></label>
              </div>
              <details className="ct-details" style={{ marginTop: 12 }}><summary style={{ textTransform: "none", fontSize: 13, color: "var(--ink)" }}>공개 체크리스트</summary>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>{["기본 정보", "종별 정의", "신청 정책", "사이트 설정", "기록 설정", "대진표 생성"].map((it, i) => <div key={it} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}><Icon name={i < 4 ? "circle-check" : "circle"} size={16} color={i < 4 ? "var(--ok)" : "var(--ink-dim)"} />{it}</div>)}</div>
              </details>
            </div>
          )}
        </section>

        {/* 스텝 푸터 */}
        <div className="tw-foot">
          <Btn variant="secondary" icon="chevron-left" onClick={() => go(step - 1)} {...(step === 0 ? { disabled: true } : {})}>이전</Btn>
          <div className="tw-foot__mid">
            <span className="ct-savebar__state" style={{ fontSize: 13 }}>{stateMsg}</span>
            {state === "err" && <span className="tw-msg" data-tone="err">최소 ≤ 최대 로스터</span>}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="secondary" onClick={save} {...(saving ? { disabled: true } : {})}>{saving ? "저장 중" : "저장"}</Btn>
            {step < STEPS.length - 1
              ? <Btn iconRight="chevron-right" onClick={() => go(step + 1)}>다음</Btn>
              : <Btn icon="check" onClick={save} {...(saving ? { disabled: true } : {})}>{isCreate ? "대회 생성" : "저장하고 완료"}</Btn>}
          </div>
        </div>
      </div>
    );
  };

  const STEP_SUB = {
    info: "대회 기본 정보와 소개를 입력합니다.",
    schedule: "본선 일정과 경기장·코트를 등록합니다.",
    divisions: "종별을 추가·수정·삭제하고 운영 방식·대진을 관리합니다.",
    game: "경기 규칙·기록 방식과 운영진을 설정합니다.",
    publish: "참가 접수, 팀 기준, 사이트 공개를 운영합니다.",
  };
})();
