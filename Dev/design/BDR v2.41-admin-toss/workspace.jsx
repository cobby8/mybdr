/* global React, window */
// ============================================================
// workspace.jsx — TournamentWorkspace 셸 (Toss · 스텝 분할)
//   5 스텝: 대회정보 > 일정·장소 > 종별·디비전 > 경기설정 > 접수·공개
//   스텝별 이동(이전/다음 + 상단 segment). 저장 = mock.
//   function-lock-B1.md A 준수.
// ============================================================
(function () {
  const { useState, useMemo, useEffect } = React;
  const { Icon, Btn, Modal } = window;
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

  function CopyTournamentModal({ onClose, onApply }) {
    const [q, setQ] = useState("");
    const list = (WS.copyableTournaments || []).filter(t => !q || t.name.includes(q) || t.org.includes(q));
    return (
      <Modal open onClose={onClose} maxWidth={560} title="대회 복사" sub="내가 만든 대회·같은 단체 대회를 선택하면 모든 설정을 새 대회로 복사합니다."
        foot={<Btn variant="secondary" onClick={onClose}>닫기</Btn>}>
        <div className="ad-search" style={{ marginBottom: 12 }}><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="대회명·단체 검색" /></div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {list.length ? list.map(t => (
            <button key={t.id} type="button" className="ct-copyrow" onClick={() => onApply(t)}>
              <span className="ct-copyrow__ic"><Icon name="copy" size={18} /></span>
              <span className="ct-copyrow__body">
                <span className="ct-copyrow__nm">{t.name}<span className="ct-copychip" data-mine={t.mine ? "true" : "false"}>{t.tag}</span></span>
                <span className="ct-copyrow__meta">{t.org} · {t.date} · {t.teams}팀</span>
              </span>
              <Icon name="chevron-right" size={16} style={{ color: "var(--ink-dim)", flex: "0 0 auto" }} />
            </button>
          )) : <div className="ct-emptybox" style={{ padding: 20 }}>검색 결과가 없습니다.</div>}
        </div>
      </Modal>
    );
  }

  window.TournamentWorkspace = function TournamentWorkspace({ mode = "edit" }) {
    const isCreate = mode === "create";
    const init = isCreate ? (WS.emptyForm || WS.form) : WS.form;
    const [step, setStep] = useState(0);
    const [openP, setOpenP] = useState(new Set(["divisions"]));
    const [form, setForm] = useState(init);
    const [saved, setSaved] = useState(init);
    const [saving, setSaving] = useState(false);
    const [state, setState] = useState("idle");
    const [delOpen, setDelOpen] = useState(false);
    const [copyOpen, setCopyOpen] = useState(false);
    const s = WS.summary, ms = WS.matchStats;
    const pct = Math.round((s.progressCompleted / s.progressTotal) * 100);
    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

    // 종별별 참가비
    const [feeOpen, setFeeOpen] = useState(false);
    const [note, setNote] = useState(null);
    const divList = WS.divisionRules || [];
    const [divFees, setDivFees] = useState(() => { const m = {}; divList.forEach(r => { m[r.code] = r.fee; }); return m; });
    const [draftFees, setDraftFees] = useState(divFees);
    const won = (n) => (Number(n) || 0).toLocaleString() + "원";
    const tieredCount = divList.filter(r => (divFees[r.code] != null ? divFees[r.code] : form.entryFee) !== form.entryFee).length;
    const openFee = () => { setDraftFees(divFees); setFeeOpen(true); };
    const applyFees = () => { setDivFees(draftFees); setFeeOpen(false); setNote("종별별 참가비를 적용했습니다"); setTimeout(() => setNote(null), 2400); };

    const patch = (k, v) => { setState("idle"); setForm(f => ({ ...f, [k]: v })); };
    const toggle = (id) => setOpenP(c => { const n = new Set(c); n.has(id) ? n.delete(id) : n.add(id); return n; });
    const go = (i) => { setStep(Math.max(0, Math.min(STEPS.length - 1, i))); window.history.replaceState(null, "", "#" + STEPS[Math.max(0, Math.min(4, i))].id); window.scrollTo({ top: 0, behavior: "smooth" }); };
    useEffect(() => { const raw = window.location.hash.replace("#", ""); if (raw in IDX) setStep(IDX[raw]); }, []);

    const save = () => {
      if (form.rosterMin > form.rosterMax) { setState("err"); return; }
      setSaving(true); setState("idle");
      setTimeout(() => { setSaving(false); setSaved(form); setState("ok"); }, 700);
    };
    // 마지막 단계 완료 → 대회 목록으로 복귀
    const complete = () => {
      if (form.rosterMin > form.rosterMax) { setState("err"); return; }
      setSaving(true); setState("idle");
      setTimeout(() => { setSaving(false); setSaved(form); window.location.href = "대회 관리자.html#list"; }, 700);
    };
    const stateMsg = saving ? "저장 중입니다" : dirty ? "변경사항이 있습니다" : state === "ok" ? "저장되었습니다" : "변경사항 없음";
    const cur = STEPS[step];
    const cancelCreate = () => { if (window.confirm("대회 생성을 취소할까요? 입력한 내용은 저장되지 않습니다.")) window.history.back(); };
    const confirmDelete = () => { setDelOpen(false); window.location.href = "대회 관리자.html#list"; };
    const applyCopy = (t) => { setForm(f => ({ ...f, ...t.form })); setCopyOpen(false); setNote(`'${t.name}' 설정을 복사했습니다`); setTimeout(() => setNote(null), 2400); };
    const stepNav = [{ label: isCreate ? "생성 단계" : "수정 단계" }, ...STEPS.map((x, i) => ({ id: x.id, icon: x.icon, text: `${i + 1}. ${x.label}` }))];
    const footAction = isCreate
      ? <button type="button" className="ts-cancelbtn" onClick={cancelCreate}><Icon name="x" size={16} /><span>생성 취소</span></button>
      : <button type="button" className="ts-cancelbtn" data-danger="true" onClick={() => setDelOpen(true)}><Icon name="trash-2" size={16} /><span>대회 삭제</span></button>;

    return (
      <window.AdminShell brand="MyBDR" brandSub={isCreate ? "새 대회 만들기" : "대회 수정"}
        nav={stepNav} active={cur.id} onNav={(id) => go(IDX[id] != null ? IDX[id] : 0)} footAction={footAction}>
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
            {isCreate
              ? <Btn variant="secondary" size="sm" icon="copy" onClick={() => setCopyOpen(true)}>대회 복사</Btn>
              : <Btn variant="secondary" size="sm" iconRight="arrow-up-right">사이트로</Btn>}
          </div>
        </div>

        {/* 스텝 진행률 (스텝 네비는 좌측 사이드패널) */}
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
                panels={[["divisions", "종별 운영 방식"]]} />
              {openP.has("divisions") && <Embed id="divisions" />}
              <div className="ops-note" style={{ marginTop: 12 }}><Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} /><span>대진 생성·일정·경기 운영은 대회 생성 후 <b>대회 운영 워크스페이스</b>에서 처리합니다.</span></div>
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
                <Field label="참가비 (기본)">
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="number" className="ts-input" style={{ flex: 1, minWidth: 0 }} value={form.entryFee} onChange={e => patch("entryFee", +e.target.value)} />
                    <Btn variant="secondary" icon="layers" onClick={openFee}>종별별</Btn>
                  </div>
                  {tieredCount > 0 && <div className="ts-field__hint" style={{ color: "var(--primary)", fontWeight: 700 }}>종별 차등 참가비 {tieredCount}개 설정됨</div>}
                </Field>
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
              : <Btn icon="check" onClick={complete} {...(saving ? { disabled: true } : {})}>{isCreate ? "대회 생성" : "저장하고 완료"}</Btn>}
          </div>
        </div>

        {/* 종별별 참가비 모달 */}
        <Modal open={feeOpen} onClose={() => setFeeOpen(false)} title="종별 참가비 설정"
          sub="생성한 종별별로 참가비를 다르게 설정합니다. 미설정 종별은 기본 참가비를 적용합니다."
          foot={<>
            <Btn variant="secondary" onClick={() => setFeeOpen(false)}>취소</Btn>
            <Btn icon="check" onClick={applyFees}>적용</Btn>
          </>}>
          {divList.length ? (
            <div>
              <button type="button" className="ct-feeapply" onClick={() => setDraftFees(() => { const m = {}; divList.forEach(r => { m[r.code] = form.entryFee; }); return m; })}>
                <Icon name="copy" size={15} />기본 참가비 일괄 적용 · {won(form.entryFee)}
              </button>
              {divList.map(d => (
                <div key={d.code} className="ct-feerow">
                  <div className="ct-feerow__nm">{d.label}<span className="ct-feerow__cap">정원 {d.cap}팀 · {window.FORMAT_LABEL[d.format] || d.format}</span></div>
                  <div className="ct-feerow__in">
                    <input type="number" className="ts-input" value={draftFees[d.code] != null ? draftFees[d.code] : ""} onChange={e => setDraftFees(f => ({ ...f, [d.code]: +e.target.value }))} />
                    <span className="ct-feerow__won">원</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="ct-emptybox"><b>종별·디비전</b> 단계에서 종별을 먼저 추가하세요.</div>
          )}
        </Modal>
        {copyOpen && <CopyTournamentModal onClose={() => setCopyOpen(false)} onApply={applyCopy} />}
        {note && <div className="ts-toast"><Icon name="check" size={16} />{note}</div>}
        {delOpen && (
          <Modal open onClose={() => setDelOpen(false)} title="대회를 삭제할까요?" sub={WS.tournament ? WS.tournament.name : ""}
            foot={<><Btn variant="secondary" onClick={() => setDelOpen(false)}>취소</Btn><Btn variant="danger" icon="trash-2" onClick={confirmDelete}>영구 삭제</Btn></>}>
            <div className="ops-warn" style={{ marginBottom: 4 }}><Icon name="alert-triangle" size={18} color="var(--warn)" style={{ flex: "0 0 auto", marginTop: 1 }} /><span>대회와 연결된 <b>참가팀·대진·일정·정산 기록</b>이 모두 삭제됩니다. 이 작업은 되돌릴 수 없습니다.</span></div>
          </Modal>
        )}
      </div>
      </window.AdminShell>
    );
  };

  const STEP_SUB = {
    info: "대회 기본 정보와 소개를 입력합니다.",
    schedule: "본선 일정과 경기장·코트를 등록합니다.",
    divisions: "종별을 추가·수정·삭제하고 운영 방식을 관리합니다.",
    game: "경기 규칙·기록 방식과 운영진을 설정합니다.",
    publish: "참가 접수, 팀 기준, 사이트 공개를 운영합니다.",
  };
})();
