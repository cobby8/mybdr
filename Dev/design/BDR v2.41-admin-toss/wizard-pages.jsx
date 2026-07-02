/* global React, window */
// ============================================================
// wizard-pages.jsx — 대회 생성(5단계 마법사) + 대회 수정(메가폼)
//   toss.css / toss-kit 재사용. 5섹션 = 기본정보·일정장소·참가규정·종별·공개설정.
//   window.TournamentCreateApp / window.TournamentEditApp
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Toggle, StepDots, Empty } = window;

  // ── 대회 관리자 콘솔 NAV (듀얼 사이드바 항상 노출) ─────────
  const WZ_NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "list", icon: "trophy", text: "대회 목록", badge: 6 },
    { label: "구성" },
    { id: "orgs", icon: "building-2", text: "단체·주최", badge: 5 },
    { id: "series", icon: "layers", text: "시리즈", badge: 5 },
    { id: "templates", icon: "layout-template", text: "템플릿", badge: 4 },
  ];
  const WZ_NAVIGATE = (id) => { location.href = "대회 관리자.html#" + id; };
  const WZ_USER = { initial: "관", name: "BDR 농구문화", role: "대회 운영자" };

  // ── 스타일 1회 주입 ────────────────────────────────────────
  if (!window.__wzInjected) {
    window.__wzInjected = true;
    const css = `
.wz-wrap { max-width: 760px; margin: 0 auto; padding: 0; }
.wz-head { margin-bottom: 22px; }
.wz-eyebrow { font-size: 13px; font-weight: 700; color: var(--primary); margin-bottom: 8px; }
.wz-title { font-size: 26px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); }
.wz-sub { font-size: 14.5px; color: var(--ink-mute); margin-top: 8px; line-height: 1.6; }
.wz-stepmeta { font-size: 12.5px; font-weight: 700; color: var(--ink-mute); margin-bottom: 8px; font-family: var(--ff-mono); }
.wz-card { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 26px; box-shadow: var(--sh-sm); }
.wz-card + .wz-card { margin-top: 18px; }
.wz-cardttl { font-size: 16px; font-weight: 800; color: var(--ink); margin-bottom: 4px; }
.wz-cardsub { font-size: 13px; color: var(--ink-mute); margin-bottom: 18px; }
.wz-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .wz-row2 { grid-template-columns: 1fr; } }
.wz-foot { display: flex; gap: 10px; margin-top: 24px; }
.wz-foot__sp { flex: 1; }
.wz-divrow { display: grid; grid-template-columns: 1.4fr 110px 90px 40px; gap: 10px; align-items: center; margin-bottom: 10px; }
@media (max-width: 600px) { .wz-divrow { grid-template-columns: 1fr 1fr; } }
.wz-pubrow { display: flex; align-items: center; gap: 14px; padding: 14px 0; border-top: 1px solid var(--border); }
.wz-pubrow:first-child { border-top: 0; }
.wz-pubrow__b { flex: 1; min-width: 0; }
.wz-pubrow__t { font-size: 14.5px; font-weight: 700; color: var(--ink); }
.wz-pubrow__d { font-size: 12.5px; color: var(--ink-mute); margin-top: 2px; }
.wz-review { display: flex; gap: 14px; padding: 13px 0; border-top: 1px solid var(--border); }
.wz-review:first-child { border-top: 0; }
.wz-review__k { font-size: 13px; font-weight: 700; color: var(--ink-mute); flex: 0 0 96px; }
.wz-review__v { font-size: 14px; font-weight: 600; color: var(--ink); min-width: 0; }
.wz-slug { display: flex; align-items: center; gap: 2px; }
.wz-slug__suffix { font-size: 14px; color: var(--ink-mute); font-family: var(--ff-mono); white-space: nowrap; }
`;
    const s = document.createElement('style');
    s.id = 'wz-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── 공용 필드 ──────────────────────────────────────────────
  function Field({ label, hint, children }) {
    return (
      <div className="ts-field">
        <label className="ts-field__label">{label}</label>
        {children}
        {hint && <div className="ts-field__hint">{hint}</div>}
      </div>
    );
  }
  function Text({ value, onChange, ...rest }) {
    return <input className="ts-input" value={value} onChange={(e) => onChange(e.target.value)} {...rest} />;
  }
  function Select({ value, onChange, options }) {
    return <select className="ts-select" value={value} onChange={(e) => onChange(e.target.value)}>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select>;
  }
  function Seg({ value, onChange, options }) {
    return <div className="ts-segment">{options.map((o) => <button key={o} type="button" className="ts-segment__btn" data-active={value === o ? "true" : "false"} onClick={() => onChange(o)}>{o}</button>)}</div>;
  }
  function ToggleRow({ label, desc, on, onChange }) {
    return (
      <div className="wz-pubrow">
        <div className="wz-pubrow__b"><div className="wz-pubrow__t">{label}</div><div className="wz-pubrow__d">{desc}</div></div>
        <Toggle on={on} onChange={onChange} />
      </div>
    );
  }

  const SERIES = ["BDR 오픈 시리즈", "BDR 정규리그", "한강 시리즈", "유스 디벨롭", "마스터즈", "시리즈 없음"];
  const ORGS = ["BDR 농구문화", "한강 스포츠클럽", "인천농구협회", "유스 디벨롭 센터"];
  const VENUES = ["장충체육관", "잠실학생체육관", "고양체육관", "올림픽공원 SK핸드볼", "인천삼산월드체육관"];
  const blankDiv = () => ({ name: "", format: "5x5", cap: "" });
  const defaultForm = () => ({
    name: "", series: SERIES[0], org: ORGS[0], desc: "",
    start: "", end: "", venue: VENUES[0], region: "", courts: "2",
    pmin: "8", pmax: "12", verify: true, fee: "",
    divs: [{ name: "오픈부", format: "5x5", cap: "16" }],
    slug: "", publishNow: false,
    sections: { overview: true, teams: true, bracket: true, schedule: false, results: false, news: false },
  });

  // ── 단계별 콘텐츠 ──────────────────────────────────────────
  function Step1({ v, set }) {
    return (
      <div className="wz-card">
        <div className="wz-cardttl">기본 정보</div>
        <div className="wz-cardsub">대회 이름과 주최 정보를 입력합니다.</div>
        <Field label="대회명" hint="공개 사이트와 참가 신청에 표시됩니다.">
          <Text value={v.name} onChange={(x) => set({ name: x })} placeholder="예: BDR 서머 오픈 #5" />
        </Field>
        <div className="wz-row2">
          <Field label="시리즈"><Select value={v.series} onChange={(x) => set({ series: x })} options={SERIES} /></Field>
          <Field label="주최 단체"><Select value={v.org} onChange={(x) => set({ org: x })} options={ORGS} /></Field>
        </div>
        <Field label="대회 소개">
          <textarea className="ts-input" rows={3} value={v.desc} onChange={(e) => set({ desc: e.target.value })} placeholder="대회 취지·참가 대상 등을 간단히 소개해주세요." style={{ resize: "vertical", lineHeight: 1.6 }} />
        </Field>
      </div>
    );
  }
  function Step2({ v, set }) {
    return (
      <div className="wz-card">
        <div className="wz-cardttl">일정 · 장소</div>
        <div className="wz-cardsub">개최 기간과 경기 장소를 지정합니다.</div>
        <div className="wz-row2">
          <Field label="개최 시작일"><Text value={v.start} onChange={(x) => set({ start: x })} placeholder="2026.08.01" /></Field>
          <Field label="개최 종료일"><Text value={v.end} onChange={(x) => set({ end: x })} placeholder="2026.08.02" /></Field>
        </div>
        <Field label="경기 장소"><Select value={v.venue} onChange={(x) => set({ venue: x })} options={VENUES} /></Field>
        <div className="wz-row2">
          <Field label="지역"><Text value={v.region} onChange={(x) => set({ region: x })} placeholder="예: 서울 중구" /></Field>
          <Field label="운영 코트 수" hint="일정 자동 편성에 사용됩니다."><Text value={v.courts} onChange={(x) => set({ courts: x })} placeholder="2" inputMode="numeric" /></Field>
        </div>
      </div>
    );
  }
  function Step3({ v, set }) {
    return (
      <div className="wz-card">
        <div className="wz-cardttl">참가 규정</div>
        <div className="wz-cardsub">팀 구성과 참가비 정책을 설정합니다.</div>
        <div className="wz-row2">
          <Field label="팀당 최소 인원"><Text value={v.pmin} onChange={(x) => set({ pmin: x })} inputMode="numeric" /></Field>
          <Field label="팀당 최대 인원"><Text value={v.pmax} onChange={(x) => set({ pmax: x })} inputMode="numeric" /></Field>
        </div>
        <Field label="참가비 (팀당)" hint="무료 대회는 0 또는 비워두세요."><Text value={v.fee} onChange={(x) => set({ fee: x })} placeholder="예: 200,000" inputMode="numeric" /></Field>
        <ToggleRow label="본인인증 필수" desc="참가 선수 전원 휴대폰 본인인증을 요구합니다." on={v.verify} onChange={(x) => set({ verify: x })} />
      </div>
    );
  }
  function Step4({ v, set }) {
    const upd = (i, patch) => set({ divs: v.divs.map((d, j) => j === i ? { ...d, ...patch } : d) });
    const add = () => set({ divs: [...v.divs, blankDiv()] });
    const rm = (i) => set({ divs: v.divs.filter((_, j) => j !== i) });
    return (
      <div className="wz-card">
        <div className="wz-cardttl">종별 구성</div>
        <div className="wz-cardsub">대회에서 운영할 종별(부)을 추가합니다.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 110px 90px 40px", gap: 10, fontSize: 12, fontWeight: 700, color: "var(--ink-mute)", marginBottom: 8 }} className="wz-divhead">
          <span>종별명</span><span>포맷</span><span>정원</span><span />
        </div>
        {v.divs.map((d, i) => (
          <div key={i} className="wz-divrow">
            <Text value={d.name} onChange={(x) => upd(i, { name: x })} placeholder="예: 오픈부" />
            <Select value={d.format} onChange={(x) => upd(i, { format: x })} options={["5x5", "3x3"]} />
            <Text value={d.cap} onChange={(x) => upd(i, { cap: x })} placeholder="16" inputMode="numeric" />
            <button className="ad-iconbtn" data-tone="danger" title="삭제" onClick={() => rm(i)} disabled={v.divs.length <= 1} style={{ opacity: v.divs.length <= 1 ? 0.4 : 1 }}><Icon name="trash-2" size={15} /></button>
          </div>
        ))}
        <Btn variant="secondary" size="sm" icon="plus" onClick={add} style={{ marginTop: 6 }}>종별 추가</Btn>
      </div>
    );
  }
  function Step5({ v, set }) {
    const SEC = [
      ["overview", "대회 개요", "일정·장소·종별·규정"], ["teams", "참가팀", "승인된 팀 명단"],
      ["bracket", "대진표", "조별·토너먼트 대진"], ["schedule", "경기 일정", "코트·시간표"],
      ["results", "경기 결과", "스코어·순위"], ["news", "BDR NEWS", "알기자 경기 기사"],
    ];
    return (
      <div className="wz-card">
        <div className="wz-cardttl">공개 설정</div>
        <div className="wz-cardsub">공개 사이트 주소와 노출 섹션을 설정합니다.</div>
        <Field label="공개 사이트 주소" hint="영문·숫자·하이픈만 사용할 수 있습니다.">
          <div className="wz-slug">
            <Text value={v.slug} onChange={(x) => set({ slug: x })} placeholder="summer-open-5" />
            <span className="wz-slug__suffix">.mybdr.kr</span>
          </div>
        </Field>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", margin: "10px 0 2px" }}>발행 섹션</div>
        {SEC.map(([k, label, desc]) => (
          <ToggleRow key={k} label={label} desc={desc} on={v.sections[k]} onChange={(x) => set({ sections: { ...v.sections, [k]: x } })} />
        ))}
        <div style={{ marginTop: 16 }}>
          <ToggleRow label="생성 즉시 공개" desc="끄면 비공개(초안)로 생성되어 나중에 발행할 수 있습니다." on={v.publishNow} onChange={(x) => set({ publishNow: x })} />
        </div>
      </div>
    );
  }

  const STEPS = [
    { t: "기본 정보", c: Step1 }, { t: "일정 · 장소", c: Step2 }, { t: "참가 규정", c: Step3 },
    { t: "종별 구성", c: Step4 }, { t: "공개 설정", c: Step5 },
  ];

  // ── 대회 생성 마법사 ───────────────────────────────────────
  window.TournamentCreateApp = function () {
    const [step, setStep] = useState(0);
    const [v, setV] = useState(defaultForm);
    const set = (patch) => setV((s) => ({ ...s, ...patch }));
    const Cur = STEPS[step].c;
    const last = step === STEPS.length - 1;
    const canNext = step !== 0 || v.name.trim().length > 0;

    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 관리자" nav={WZ_NAV} active="list" onNav={WZ_NAVIGATE} user={WZ_USER}>
        <div className="wz-wrap">
        <button className="ad-backlink" onClick={() => { location.href = "대회 관리자.html#list"; }}><Icon name="arrow-left" size={16} />대회 목록</button>
        <div className="wz-head">
          <div className="wz-eyebrow">대회 생성</div>
          <div className="wz-title">새 대회 만들기</div>
          <div className="wz-sub">5단계로 대회를 구성합니다. 생성 후 운영 워크스페이스에서 참가팀·대진·일정을 관리할 수 있어요.</div>
        </div>
        <StepDots step={step} total={STEPS.length} />
        <div className="wz-stepmeta">STEP {step + 1} / {STEPS.length} · {STEPS[step].t}</div>
        <Cur v={v} set={set} />
        <div className="wz-foot">
          {step > 0 && <Btn variant="secondary" icon="arrow-left" onClick={() => setStep(step - 1)}>이전</Btn>}
          <div className="wz-foot__sp" />
          {!last
            ? <Btn iconRight="arrow-right" disabled={!canNext} onClick={() => setStep(step + 1)}>다음</Btn>
            : <Btn icon="check" onClick={() => { window.__okToast = (v.name || "새 대회") + " 생성됨 — 운영 워크스페이스로 이동합니다"; setTimeout(() => { location.href = "대회 운영.html"; }, 700); showOk(); }}>대회 만들기</Btn>}
        </div>
        <OkToast />
        </div>
      </window.AdminShell>
    );
  };

  // ── 대회 수정 (메가폼 — 5섹션 한 화면) ─────────────────────
  window.TournamentEditApp = function () {
    const [v, setV] = useState(() => Object.assign(defaultForm(), {
      name: "BDR 서머 오픈 #4", series: "BDR 오픈 시리즈", org: "BDR 농구문화",
      desc: "전국 동호인 대상 4종별 오픈 토너먼트.", start: "2026.06.15", end: "2026.06.16",
      venue: "장충체육관", region: "서울 중구", courts: "2", pmin: "8", pmax: "12", fee: "200,000",
      divs: [
        { name: "오픈부", format: "5x5", cap: "16" }, { name: "아마추어부", format: "5x5", cap: "12" },
        { name: "U18부", format: "5x5", cap: "8" }, { name: "40+ 마스터즈", format: "3x3", cap: "8" },
      ],
      slug: "summer-open-4",
      sections: { overview: true, teams: true, bracket: true, schedule: false, results: false, news: false },
    }));
    const set = (patch) => setV((s) => ({ ...s, ...patch }));
    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 관리자" nav={WZ_NAV} active="list" onNav={WZ_NAVIGATE} user={WZ_USER}>
        <div className="wz-wrap">
        <button className="ad-backlink" onClick={() => { location.href = "대회 운영.html"; }}><Icon name="arrow-left" size={16} />대회 운영으로</button>
        <div className="wz-head">
          <div className="wz-eyebrow">대회 수정</div>
          <div className="wz-title" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>{v.name}<Badge tone="ok">진행중</Badge></div>
          <div className="wz-sub">대회 기본 정보를 수정합니다. 변경 사항은 공개 사이트에도 반영됩니다.</div>
        </div>
        <Step1 v={v} set={set} />
        <Step2 v={v} set={set} />
        <Step3 v={v} set={set} />
        <Step4 v={v} set={set} />
        <Step5 v={v} set={set} />
        <div className="wz-foot">
          <Btn variant="secondary" onClick={() => { location.href = "대회 운영.html"; }}>취소</Btn>
          <div className="wz-foot__sp" />
          <Btn icon="check" onClick={() => { window.__okToast = "변경사항이 저장되었습니다"; showOk(); setTimeout(() => { location.href = "대회 운영.html"; }, 800); }}>변경사항 저장</Btn>
        </div>
        <OkToast />
        </div>
      </window.AdminShell>
    );
  };

  // 간단 토스트 (마법사/수정 단독)
  let okSetter = null;
  function showOk() { if (okSetter) okSetter(window.__okToast || "완료"); }
  function OkToast() {
    const [msg, setMsg] = useState(null);
    React.useEffect(() => { okSetter = (m) => { setMsg(m); clearTimeout(window.__okT); window.__okT = setTimeout(() => setMsg(null), 2200); }; return () => { okSetter = null; }; }, []);
    if (!msg) return null;
    return <div className="ts-toast"><Icon name="check" size={16} />{msg}</div>;
  }
})();
