/* global React, window */
// ============================================================
// admin-state.jsx — 관리자 Toss 상태 QA / 보강 시안 (v2.42)
//   8 상태: loading / empty / error / saving / saved /
//           permission / mobile / destructive
//   toss.css + toss-kit.jsx(Icon/Btn/Badge/Empty/Modal) 재사용.
// ============================================================
const { useState } = React;

// ── 보강 신규: Skeleton ──────────────────────────────────────
function Skel({ w = "100%", h = 14, r = 8, style }) {
  return <span className="st-skel" style={{ width: w, height: h, borderRadius: r, ...style }} />;
}
function SkelTable({ rows = 5 }) {
  return (
    <div className="ts-card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="st-skrow st-skrow--head"><Skel w="22%" h={12} /><Skel w="14%" h={12} /><Skel w="14%" h={12} /><Skel w="10%" h={12} /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="st-skrow">
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
            <Skel w={34} h={34} r={10} /><div style={{ flex: 1 }}><Skel w="46%" h={13} /><Skel w="28%" h={10} style={{ marginTop: 7 }} /></div>
          </div>
          <Skel w={54} h={13} /><Skel w={54} h={13} /><Skel w={64} h={26} r={8} />
        </div>
      ))}
    </div>);
}

// ── 보강 신규: Error / Permission ────────────────────────────
function ErrState({ title, desc, onRetry }) {
  return (
    <div className="st-state">
      <div className="st-state__ic st-state__ic--danger"><Icon name="cloud-off" size={28} /></div>
      <div className="st-state__t">{title}</div>
      <div className="st-state__x">{desc}</div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn variant="secondary" size="sm" icon="refresh-cw" onClick={onRetry}>다시 시도</Btn>
        <Btn variant="ghost" size="sm" icon="headset">문의하기</Btn>
      </div>
    </div>);
}
function PermState({ role = "스태프" }) {
  return (
    <div className="st-state">
      <div className="st-state__ic st-state__ic--lock"><Icon name="lock" size={26} /></div>
      <div className="st-state__t">접근 권한이 없습니다</div>
      <div className="st-state__x">이 화면은 <b>주최자·관리자</b>만 열람할 수 있어요. 현재 역할은 <Badge tone="grey">{role}</Badge> 입니다. 권한이 필요하면 주최자에게 요청하세요.</div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <Btn variant="primary" size="sm" icon="user-plus">권한 요청</Btn>
        <Btn variant="ghost" size="sm" icon="arrow-left">대시보드로</Btn>
      </div>
    </div>);
}

// ── 데모 카드 셸 ─────────────────────────────────────────────
function Demo({ panel, state, tone = "grey", children, note }) {
  const TONE = { loading: "grey", empty: "primary", error: "danger", saving: "warn", saved: "ok", permission: "grey", mobile: "primary", destructive: "danger" };
  return (
    <div className="st-demo">
      <div className="st-demo__bar">
        <span className="st-demo__panel"><Icon name="layout-panel-left" size={14} />{panel}</span>
        <Badge tone={TONE[state] || tone}>{state}</Badge>
      </div>
      <div className="st-demo__stage">{children}</div>
      {note && <div className="st-demo__note"><Icon name="info" size={13} />{note}</div>}
    </div>);
}

// ── 1. loading ───────────────────────────────────────────────
function LoadingDemos() {
  return (
    <div className="st-grid">
      <Demo panel="참가팀 패널" state="loading" note="행 단위 skeleton — 헤더/아바타/뱃지 자리 유지로 레이아웃 점프 방지">
        <SkelTable rows={4} />
      </Demo>
      <Demo panel="대회 요약 카드" state="loading" note="통계 카드 4개 skeleton + 스피너 인라인">
        <div className="st-statgrid">
          {[0,1,2,3].map(i => <div key={i} className="ts-card" style={{ padding: 16 }}><Skel w="40%" h={26} /><Skel w="58%" h={11} style={{ marginTop: 10 }} /></div>)}
        </div>
        <div className="st-spinrow"><span className="st-spin" />데이터 불러오는 중…</div>
      </Demo>
    </div>);
}

// ── 2. empty ─────────────────────────────────────────────────
function EmptyDemos() {
  return (
    <div className="st-grid">
      <Demo panel="대진 패널" state="empty" note="다음 행동 CTA 명확 — 0건일 때 생성 진입점 제공">
        <Empty icon="git-fork" title="아직 생성된 대진이 없어요" desc="승인된 팀으로 대진을 자동 생성하거나 직접 편성할 수 있어요.">
          <Btn variant="primary" size="sm" icon="zap">대진 자동 생성</Btn>
          <Btn variant="secondary" size="sm" icon="pencil">직접 편성</Btn>
        </Empty>
      </Demo>
      <Demo panel="기록원 패널" state="empty" note="초대 흐름으로 연결되는 단일 CTA">
        <Empty icon="users" title="배정된 기록원이 없어요" desc="기록원을 초대하면 경기별로 배정할 수 있어요.">
          <Btn variant="primary" size="sm" icon="user-plus">기록원 초대</Btn>
        </Empty>
      </Demo>
    </div>);
}

// ── 3. error ─────────────────────────────────────────────────
function ErrorDemos() {
  const [n, setN] = useState(0);
  return (
    <div className="st-grid">
      <Demo panel="참가팀 패널" state="error" note="조회 실패 — 원인 + 재시도. 재시도 클릭 시 카운트 증가(시연)">
        <ErrState title="목록을 불러오지 못했어요" desc={`네트워크 오류로 참가팀을 가져오지 못했습니다. (재시도 ${n}회)`} onRetry={() => setN(n + 1)} />
      </Demo>
      <Demo panel="대회 설정 저장" state="error" note="저장 실패 — 인라인 경고 배너 + 입력값 보존 안내">
        <div className="st-banner st-banner--danger">
          <Icon name="alert-triangle" size={18} />
          <div><div style={{ fontWeight: 700 }}>저장에 실패했어요</div><div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>입력한 내용은 그대로 남아 있어요. 잠시 후 다시 저장해 주세요.</div></div>
          <Btn variant="danger" size="sm" icon="refresh-cw" style={{ marginLeft: "auto" }}>다시 저장</Btn>
        </div>
      </Demo>
    </div>);
}

// ── 4 & 5. saving / saved (인터랙티브) ───────────────────────
function SaveFlowDemo() {
  const [phase, setPhase] = useState("idle"); // idle/saving/saved
  const [dirty, setDirty] = useState(true);
  const save = () => { setPhase("saving"); setTimeout(() => { setPhase("saved"); setDirty(false); setTimeout(() => setPhase("idle"), 1800); }, 1100); };
  return (
    <Demo panel="대회 설정 — 저장 플로우" state={phase === "saving" ? "saving" : phase === "saved" ? "saved" : "saved"}
      note="저장 클릭 → disabled+pending(중복 submit 차단) → 성공 toast + dirty 해제">
      <div className="ts-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700 }}>경기 규정</div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 3, display: "flex", alignItems: "center", gap: 7 }}>
              {dirty ? <><span className="st-dirtydot" />저장되지 않은 변경 있음</> : <><Icon name="check-circle" size={14} color="var(--ok)" /><span style={{ color: "var(--ok)" }}>모든 변경 저장됨</span></>}
            </div>
          </div>
          <button className="ts-btn ts-btn--primary" disabled={phase === "saving" || !dirty} onClick={save}>
            {phase === "saving" ? <><span className="st-spin st-spin--sm" />저장 중…</> : phase === "saved" ? <><Icon name="check" size={16} />저장됨</> : "변경 저장"}
          </button>
        </div>
      </div>
      <button className="ts-btn ts-btn--ghost ts-btn--sm" style={{ marginTop: 10 }} onClick={() => { setDirty(true); setPhase("idle"); }}><Icon name="rotate-ccw" size={14} />변경 다시 발생</button>
      {phase === "saved" && <div className="st-toast"><Icon name="check-circle" size={17} />설정을 저장했어요</div>}
    </Demo>);
}

// ── 6. permission ────────────────────────────────────────────
function PermDemos() {
  return (
    <div className="st-grid">
      <Demo panel="관리자 패널 (admins)" state="permission" note="역할 부족 — 깨진 화면 대신 권한 요청 흐름 제시">
        <PermState role="스태프" />
      </Demo>
      <Demo panel="대회 삭제 / 주최자 이전" state="permission" note="위험 액션은 권한 + 추가 확인 이중 게이트">
        <div className="st-banner st-banner--grey">
          <Icon name="shield-alert" size={18} />
          <div><div style={{ fontWeight: 700 }}>주최자 전용 작업</div><div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>대회 삭제·주최자 이전은 주최자 본인만 실행할 수 있어요.</div></div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button className="ts-btn ts-btn--danger" disabled><Icon name="trash-2" size={16} />대회 삭제</button>
          <span style={{ fontSize: 12.5, color: "var(--ink-mute)", alignSelf: "center" }}>권한 없음 — 비활성</span>
        </div>
      </Demo>
    </div>);
}

// ── 7. mobile (360 / 720 프레임) ─────────────────────────────
function MobileDemos() {
  return (
    <div className="st-grid">
      <Demo panel="참가팀 패널 — 360px" state="mobile" note="테이블 → 카드 리스트 전환. 가로 스크롤·이탈 없음">
        <div className="st-phone">
          {["송파 불스","마포 레이커스","용산 워리어스"].map((nm, i) => (
            <div key={i} className="st-mcard">
              <div className="st-mcard__top"><span className="st-mcard__nm">{nm}</span><Badge tone="ok">승인</Badge></div>
              <div className="st-mcard__meta"><span>오픈부 · {String.fromCharCode(65+i)}조</span><span>{7+i}명</span></div>
              <div className="st-mcard__act"><button className="ts-btn ts-btn--secondary ts-btn--sm" style={{ flex: 1 }}>상세</button><button className="ts-btn ts-btn--ghost ts-btn--sm" style={{ flex: 1 }}>시드</button></div>
            </div>
          ))}
        </div>
      </Demo>
      <Demo panel="설정 폼 모달 — 720px" state="mobile" note="모달 풀폭, input 16px(iOS 줌 방지), 버튼 44px 터치 타겟">
        <div className="st-phone st-phone--720">
          <div className="st-msheet">
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 14 }}>경기 시간 설정</div>
            <label className="st-flabel">쿼터 시간</label>
            <input className="st-finput" defaultValue="10분" />
            <label className="st-flabel" style={{ marginTop: 12 }}>작전 타임</label>
            <input className="st-finput" defaultValue="60초" />
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="ts-btn ts-btn--secondary" style={{ flex: 1 }}>취소</button>
              <button className="ts-btn ts-btn--primary" style={{ flex: 1 }}>저장</button>
            </div>
          </div>
        </div>
      </Demo>
    </div>);
}

// ── 8. destructive (모달) ────────────────────────────────────
function DestructiveDemo() {
  const [open, setOpen] = useState(false);
  const [open2, setOpen2] = useState(false);
  return (
    <div className="st-grid">
      <Demo panel="대진 삭제" state="destructive" note="삭제 = 확인 모달 + danger 색상 + 영향 범위 명시">
        <div className="ts-card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700 }}>오픈부 대진 v1</div><div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>8강 · 4강 · 결승 · 7경기</div></div>
          <Btn variant="danger" size="sm" icon="trash-2" onClick={() => setOpen(true)}>삭제</Btn>
        </div>
      </Demo>
      <Demo panel="발행 취소" state="destructive" note="공개 사이트 영향 액션 — 결과 경고 후 실행">
        <div className="ts-card" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div><div style={{ fontWeight: 700 }}>공개 사이트 발행됨</div><div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>bdr-summer-4.mybdr.kr</div></div>
          <Btn variant="secondary" size="sm" icon="globe-lock" onClick={() => setOpen2(true)}>발행 취소</Btn>
        </div>
      </Demo>

      <Modal open={open} onClose={() => setOpen(false)} title="대진을 삭제할까요?" sub="이 작업은 되돌릴 수 없어요."
        foot={<><Btn variant="ghost" onClick={() => setOpen(false)}>취소</Btn><Btn variant="danger" icon="trash-2" onClick={() => setOpen(false)}>삭제</Btn></>}>
        <div className="st-banner st-banner--danger" style={{ marginBottom: 4 }}>
          <Icon name="alert-triangle" size={18} />
          <div style={{ fontSize: 13.5 }}>오픈부 대진과 연결된 <b>7경기 일정</b>이 함께 삭제됩니다. 기록된 결과가 있으면 복구할 수 없어요.</div>
        </div>
      </Modal>
      <Modal open={open2} onClose={() => setOpen2(false)} title="발행을 취소할까요?" sub="공개 사이트가 비공개로 전환됩니다."
        foot={<><Btn variant="ghost" onClick={() => setOpen2(false)}>닫기</Btn><Btn variant="danger" icon="globe-lock" onClick={() => setOpen2(false)}>발행 취소</Btn></>}>
        <div style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.6 }}>발행을 취소하면 <b>bdr-summer-4.mybdr.kr</b> 접속 시 일정·대진·결과가 더 이상 보이지 않습니다. 다시 발행하면 즉시 복구돼요.</div>
      </Modal>
    </div>);
}

// ── 갤러리 셸 ────────────────────────────────────────────────
const SECTIONS = [
  { id: "loading", n: "01", label: "loading", ko: "로딩", desc: "서버 대기 중 skeleton/스피너 — 레이아웃 점프 없이", Comp: LoadingDemos },
  { id: "empty", n: "02", label: "empty", ko: "빈 상태", desc: "데이터 0건 — 다음 행동 CTA 명확", Comp: EmptyDemos },
  { id: "error", n: "03", label: "error", ko: "에러", desc: "조회/저장 실패 — 원인 + 재시도", Comp: ErrorDemos },
  { id: "save", n: "04·05", label: "saving · saved", ko: "저장 중 · 저장됨", desc: "disabled·pending·중복 차단 → toast·dirty 해제", Comp: () => <div className="st-grid"><SaveFlowDemo /></div> },
  { id: "permission", n: "06", label: "permission denied", ko: "권한 없음", desc: "역할 부족 — 깨짐 없이 권한 요청 흐름", Comp: PermDemos },
  { id: "mobile", n: "07", label: "mobile", ko: "모바일", desc: "360·720px — 테이블/폼/모달 이탈 없음", Comp: MobileDemos },
  { id: "destructive", n: "08", label: "destructive", ko: "위험 작업", desc: "삭제/발행취소 — 확인 모달 + danger 일관", Comp: DestructiveDemo },
];

function AdminStatePreview() {
  const [active, setActive] = useState("loading");
  const Sec = SECTIONS.find((s) => s.id === active) || SECTIONS[0];
  return (
    <div className="st-app">
      <header className="st-head">
        <div className="st-head__in">
          <div className="st-head__brand">
            <span className="st-head__mark">T</span>
            <div><div className="st-head__t">관리자 상태 QA — Toss</div><div className="st-head__s">v2.42 · loading / empty / error / saving / saved / permission / mobile / destructive</div></div>
          </div>
          <Badge tone="primary" icon="check-circle">8 상태 보강 시안</Badge>
        </div>
        <nav className="st-tabs">
          {SECTIONS.map((s) => (
            <button key={s.id} className="st-tab" data-on={s.id === active} onClick={() => setActive(s.id)}>
              <span className="st-tab__n">{s.n}</span>{s.ko}
            </button>
          ))}
        </nav>
      </header>
      <main className="st-main">
        <div className="st-sechead">
          <div><h2 className="st-sechead__t"><span className="st-sechead__n">{Sec.n}</span>{Sec.label}</h2><p className="st-sechead__x">{Sec.desc}</p></div>
        </div>
        <Sec.Comp />
      </main>
    </div>);
}

window.AdminStatePreview = AdminStatePreview;
