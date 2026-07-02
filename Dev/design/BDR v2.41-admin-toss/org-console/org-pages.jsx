/* global React, window */
// ============================================================
// org-pages.jsx — 단체 Self-Serve 운영 콘솔 (/org-console)
//   P1 상세: 대시보드 · 단체 정보
//   나머지: 레일 자리 + 골격(skeleton) + 잠금 컨셉 (ComingSoon)
//   admin-v2(Toss) 정본 컴포넌트 재사용 — AdminShell/PageHead/KpiGrid/Btn/Badge/Modal.
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Icon, Btn, Badge, PageHead, KpiGrid, AdListPanel } = window;
  const EB = "단체 콘솔 · " + window.ORG.name;
  const toast = (m) => window.adToast && window.adToast(m);
  const OC = window.orgColor(window.ORG.id);

  // ── 컨셉(준비중) 라벨 ───────────────────────────────────────
  function Concept({ tone, children = "준비중" }) {
    return <span className="oc-concept" data-tone={tone}><Icon name="sparkles" size={11} />{children}</span>;
  }

  // ── 인라인 에러 카드 ────────────────────────────────────────
  function ErrorCard({ onRetry }) {
    return (
      <div className="oc-error" style={{ marginBottom: 20 }}>
        <span className="oc-error__icon"><Icon name="wifi-off" size={20} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="oc-error__t">데이터를 불러오지 못했어요</div>
          <div className="oc-error__d">네트워크 연결을 확인한 뒤 다시 시도해주세요.</div>
        </div>
        <Btn variant="secondary" size="sm" icon="rotate-cw" onClick={onRetry}>다시 시도</Btn>
      </div>
    );
  }

  // ── 로딩 스켈레톤 조각 ──────────────────────────────────────
  const Ld = ({ w, h = 14, r, s }) => <div className="oc-ld" style={{ width: w, height: h, borderRadius: r, ...s }} />;

  // ════════════════════════════════════════════════════════════
  //  대시보드
  // ════════════════════════════════════════════════════════════
  function CertBanner() {
    return (
      <div className="oc-cert" style={{ background: `linear-gradient(120deg, ${OC.deep}, ${OC.base})` }}>
        <span className="oc-cert__icon"><Icon name="shield-check" size={26} color="#fff" /></span>
        <div className="oc-cert__body">
          <div className="oc-cert__eyebrow" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            단체 인증 <Concept>준비중</Concept>
          </div>
          <div className="oc-cert__title">인증을 마치면 공식 대회 개최·회비 출금이 열려요</div>
          <div className="oc-cert__desc">기본 기능은 인증 없이도 바로 쓸 수 있어요. 서류는 필요한 시점에 제출하면 됩니다.</div>
          <div className="oc-cert__prog">
            <div className="oc-cert__track"><div className="oc-cert__fill" style={{ width: "40%" }} /></div>
            <div className="oc-cert__pct"><span>인증 진행률</span><span>40%</span></div>
          </div>
        </div>
        <div className="oc-cert__act">
          <Btn iconRight="arrow-right" onClick={() => toast("단체 인증 신청 (컨셉 · 준비중)")}>인증 이어서 하기</Btn>
        </div>
      </div>
    );
  }

  function Onboarding({ go }) {
    const pill = { now: "지금 추천", soon: "필요할 때" };
    return (
      <div className="ad-panel">
        <div className="ad-panel__head">
          <div className="ad-panel__title">시작하기</div>
          <Badge tone="primary">1 / 4 완료</Badge>
        </div>
        <div className="oc-onb">
          {window.ORG_ONBOARD.map((o) => (
            <button key={o.id} className="oc-onbrow" data-state={o.state} onClick={() => go(o.to)}>
              <span className="oc-onbrow__mark">{o.state === "done" ? <Icon name="check" size={15} /> : <Icon name="circle" size={0} />}</span>
              <span className="oc-onbrow__body">
                <span className="oc-onbrow__t">
                  {o.label}
                  {o.state !== "done" && <span className="oc-pill" data-tone={o.state}>{pill[o.state]}</span>}
                  {o.concept && <Concept tone={o.state === "soon" ? "warn" : undefined}>컨셉</Concept>}
                </span>
                <span className="oc-onbrow__d">{o.desc}</span>
              </span>
              <span className="oc-onbrow__go"><Icon name="chevron-right" size={18} /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function DashSkeleton() {
    return (
      <div>
        <div style={{ marginBottom: 28 }}><Ld w="180px" h={13} /><Ld w="240px" h={26} s={{ marginTop: 10 }} /></div>
        <Ld w="100%" h={112} r={22} s={{ marginBottom: 24 }} />
        <div className="ad-kpi-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="ad-kpi"><Ld w="40px" h={40} r={12} /><Ld w="70%" h={26} s={{ marginTop: 16 }} /><Ld w="50%" h={13} s={{ marginTop: 8 }} /></div>
          ))}
        </div>
        <div className="ad-cols">
          <div className="ad-panel">{[0, 1, 2, 3].map((i) => <Ld key={i} w="100%" h={44} r={12} s={{ marginBottom: 8 }} />)}</div>
          <div className="ad-panel">{[0, 1, 2].map((i) => <Ld key={i} w="100%" h={40} r={12} s={{ marginBottom: 8 }} />)}</div>
        </div>
      </div>
    );
  }

  function Dashboard({ demo, go, onRetry }) {
    if (demo === "loading") return <DashSkeleton />;
    const empty = demo === "empty";
    const kpi = empty
      ? window.ORG_KPI.map((k) => ({ ...k, value: k.key === "verify" ? "0%" : "0", delta: null }))
      : window.ORG_KPI;
    return (
      <div>
        <PageHead eyebrow={EB} title={empty ? "환영해요, 서울농구협회 🏀" : "대시보드"}
          sub={empty ? "단체를 막 만들었어요. 아래 시작하기부터 하나씩 채워보세요." : "우리 단체의 멤버·대회·인증 현황을 한눈에 확인해요."}
          actions={<Btn icon="user-plus" onClick={() => toast("멤버 초대 링크가 복사되었어요")}>멤버 초대</Btn>} />
        {demo === "error" && <ErrorCard onRetry={onRetry} />}
        <CertBanner />
        <KpiGrid items={kpi} />
        <div className="ad-cols">
          <Onboarding go={go} />
          {empty
            ? <div className="ad-panel"><window.Empty icon="inbox" title="아직 활동이 없어요" desc="멤버를 초대하거나 대회를 열면 여기에 표시돼요." /></div>
            : <AdListPanel title="최근 활동" badge="실시간" badgeTone="primary" items={window.ORG_RECENT} />}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  단체 정보
  // ════════════════════════════════════════════════════════════
  function Branding({ onEdit }) {
    const O = window.ORG;
    return (
      <div className="oc-brand">
        <div className="oc-brand__banner" style={{ background: O.banner_url ? `url(${O.banner_url}) center/cover` : `linear-gradient(120deg, ${OC.deep}, ${OC.base})` }}>
          {!O.banner_url && <span className="oc-brand__bannerhint"><Icon name="image" size={15} />배너 이미지를 등록해보세요</span>}
          <button className="oc-brand__edit" onClick={onEdit}><Icon name="pencil" size={14} />브랜딩 편집</button>
        </div>
        <div className="oc-brand__row">
          <span className="oc-brand__logo" style={{ background: OC.base }}>
            {O.logo_url ? <img src={O.logo_url} alt="" /> : O.name.slice(0, 1)}
          </span>
          <div className="oc-brand__meta">
            <div className="oc-brand__name">{O.name}<Badge tone="grey">{O.type}</Badge></div>
            <div className="oc-brand__sub">브랜드 색상은 단체 ID로 자동 생성돼요 · 직접 지정하지 않아요</div>
          </div>
        </div>
      </div>
    );
  }

  function BrandingModal({ open, onClose }) {
    return (
      <window.Modal open={open} onClose={onClose} title="브랜딩 편집" sub="로고와 배너 이미지를 등록해요 (컨셉 · 준비중)" maxWidth={520}
        foot={<><Btn variant="secondary" onClick={onClose}>취소</Btn><Btn icon="check" onClick={() => { onClose(); toast("브랜딩이 저장되었어요 (컨셉)"); }}>저장</Btn></>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div className="ts-field__label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>단체 로고 <Concept tone="warn">준비중</Concept></div>
            <div className="oc-drop">
              <span className="oc-drop__icon"><Icon name="upload" size={20} /></span>
              <div className="oc-drop__t">로고 이미지를 끌어다 놓기</div>
              <div className="oc-drop__d">정사각형 · PNG/JPG · 최대 2MB</div>
            </div>
          </div>
          <div>
            <div className="ts-field__label" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>단체 배너 <Concept tone="warn">준비중</Concept></div>
            <div className="oc-drop">
              <span className="oc-drop__icon"><Icon name="image-plus" size={20} /></span>
              <div className="oc-drop__t">배너 이미지를 끌어다 놓기</div>
              <div className="oc-drop__d">가로형 3:1 권장 · PNG/JPG · 최대 4MB</div>
            </div>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--ink-mute)", display: "flex", gap: 8, alignItems: "flex-start" }}>
            <Icon name="info" size={15} style={{ flex: "0 0 auto", marginTop: 1 }} />
            브랜드 색상은 단체 고유 ID로 자동 생성돼요. 별도 색상 지정은 제공하지 않아요.
          </div>
        </div>
      </window.Modal>
    );
  }

  function InfoView({ onEdit }) {
    const O = window.ORG;
    const F = window.ORG_FIELDS;
    return (
      <div className="ad-panel">
        <div className="ad-panel__head">
          <div className="ad-panel__title">기본 정보</div>
          <Btn variant="secondary" size="sm" icon="pencil" onClick={onEdit}>편집</Btn>
        </div>
        <div className="oc-info">
          {F.map((f) => {
            const v = O[f.k];
            return (
              <div key={f.k} className="oc-inforow">
                <span className="oc-inforow__k">{f.label}</span>
                <span className="oc-inforow__v" data-empty={!v ? "true" : "false"}>{v || "미입력"}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function InfoEdit({ onCancel, onSave }) {
    const F = window.ORG_FIELDS;
    const [v, setV] = useState(() => { const m = {}; F.forEach((f) => (m[f.k] = window.ORG[f.k] || "")); return m; });
    const set = (k, val) => setV((s) => ({ ...s, [k]: val }));
    const missing = F.some((f) => f.required && !String(v[f.k]).trim());
    return (
      <div className="ad-panel">
        <div className="ad-panel__head"><div className="ad-panel__title">기본 정보 편집</div></div>
        <div className="ad-formgrid">
          {F.map((f) => (
            <div key={f.k} style={{ gridColumn: f.type === "textarea" ? "1 / -1" : "auto" }}>
              <div className="ts-field">
                <label className="ts-field__label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}> *</span>}</label>
                {f.type === "select" ? (
                  <select className="ts-select" value={v[f.k]} onChange={(e) => set(f.k, e.target.value)}>
                    {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea className="ts-input" rows={2} style={{ resize: "vertical", lineHeight: 1.5 }} value={v[f.k]} onChange={(e) => set(f.k, e.target.value)} />
                ) : (
                  <input className="ts-input" type="text" value={v[f.k]} onChange={(e) => set(f.k, e.target.value)} />
                )}
                {f.hint && <div className="ts-field__hint">{f.hint}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <Btn icon="check" disabled={missing} onClick={() => { Object.assign(window.ORG, v); onSave(); }}>변경사항 저장</Btn>
          <Btn variant="secondary" onClick={onCancel}>취소</Btn>
        </div>
      </div>
    );
  }

  function VerifyPanel() {
    const vk = window.ORG.verify;
    const V = window.ORG_VERIFY[vk];
    const ringColor = { grey: "var(--ink-dim)", warn: "var(--warn)", ok: "var(--ok)" }[V.tone];
    return (
      <div className="ad-panel">
        <div className="ad-panel__head">
          <div className="ad-panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>인증 · 서류 <Concept>준비중</Concept></div>
        </div>
        <div className="oc-verify__head">
          <span className="oc-verify__ring" style={{ background: ringColor }}><Icon name="shield" size={20} color="#fff" /></span>
          <div style={{ minWidth: 0 }}>
            <div className="oc-verify__t" style={{ display: "flex", alignItems: "center", gap: 8 }}>{V.label}<Badge tone={V.tone}>진행률 40%</Badge></div>
            <div className="oc-verify__d">{V.desc}</div>
          </div>
        </div>
        <div>
          {window.ORG_DOCS.map((d) => (
            <div key={d.id} className="oc-doc">
              <span className="oc-doc__icon"><Icon name="file-text" size={16} /></span>
              <div className="oc-doc__body">
                <div className="oc-doc__t">{d.label}</div>
                <div className="oc-doc__req">{d.req ? "필수 서류" : "선택 서류"}</div>
              </div>
              <Badge tone={d.tone}>{d.status}</Badge>
            </div>
          ))}
        </div>
        <Btn block icon="upload" style={{ marginTop: 16 }} onClick={() => toast("서류 제출 (컨셉 · 준비중)")}>서류 제출하기</Btn>
        <div style={{ fontSize: 12, color: "var(--ink-mute)", textAlign: "center", marginTop: 10, lineHeight: 1.5 }}>
          인증은 공식 대회 개최·회비 출금에만 필요해요. 지금은 안 해도 괜찮아요.
        </div>
      </div>
    );
  }

  function ProfileSkeleton() {
    return (
      <div>
        <div style={{ marginBottom: 28 }}><Ld w="180px" h={13} /><Ld w="220px" h={26} s={{ marginTop: 10 }} /></div>
        <Ld w="100%" h={220} r={22} s={{ marginBottom: 20 }} />
        <div className="ad-cols">
          <div className="ad-panel">{[0, 1, 2, 3, 4].map((i) => <Ld key={i} w="100%" h={40} r={10} s={{ marginBottom: 12 }} />)}</div>
          <div className="ad-panel">{[0, 1, 2].map((i) => <Ld key={i} w="100%" h={48} r={10} s={{ marginBottom: 12 }} />)}</div>
        </div>
      </div>
    );
  }

  function OrgProfile({ demo, onRetry }) {
    const [edit, setEdit] = useState(false);
    const [brandOpen, setBrandOpen] = useState(false);
    const [, force] = useState(0);
    useEffect(() => { setEdit(false); }, [demo]);
    if (demo === "loading") return <ProfileSkeleton />;
    return (
      <div>
        <PageHead eyebrow={EB} title="단체 정보" sub="단체 기본 정보와 브랜딩·인증 현황을 관리해요." />
        {demo === "error" && <ErrorCard onRetry={onRetry} />}
        <Branding onEdit={() => setBrandOpen(true)} />
        <div className="ad-cols">
          {edit
            ? <InfoEdit onCancel={() => setEdit(false)} onSave={() => { setEdit(false); force((n) => n + 1); toast("변경사항이 저장되었어요"); }} />
            : <InfoView onEdit={() => setEdit(true)} />}
          <VerifyPanel />
        </div>
        <BrandingModal open={brandOpen} onClose={() => setBrandOpen(false)} />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════
  //  레일 자리 — 준비중 / 잠금 (골격 skeleton + 안내 카드)
  // ════════════════════════════════════════════════════════════
  function SkelTable() {
    return (
      <div className="ad-panel" style={{ padding: 0 }}>
        <div style={{ display: "flex", gap: 10, padding: 16, borderBottom: "1px solid var(--border)" }}>
          <div className="oc-skelbar" style={{ flex: 1, height: 38, borderRadius: 12 }} />
          <div className="oc-skelbar" style={{ width: 90, height: 38, borderRadius: 12 }} />
        </div>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderTop: i ? "1px solid var(--border)" : "none" }}>
            <div className="oc-skelbar" style={{ width: 36, height: 36, borderRadius: 50 }} />
            <div style={{ flex: 1 }}><div className="oc-skelbar" style={{ width: "40%", height: 13 }} /><div className="oc-skelbar" style={{ width: "24%", height: 11, marginTop: 7 }} /></div>
            <div className="oc-skelbar" style={{ width: 64, height: 24, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    );
  }
  function SkelCards() {
    return (
      <div className="ad-cardgrid">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="ad-card">
            <div style={{ display: "flex", gap: 12 }}>
              <div className="oc-skelbar" style={{ width: 48, height: 48, borderRadius: 14 }} />
              <div style={{ flex: 1 }}><div className="oc-skelbar" style={{ width: "70%", height: 15 }} /><div className="oc-skelbar" style={{ width: "45%", height: 12, marginTop: 8 }} /></div>
            </div>
            <div className="oc-skelbar" style={{ width: "100%", height: 40, borderRadius: 12, marginTop: 4 }} />
          </div>
        ))}
      </div>
    );
  }

  function ComingSoon({ page }) {
    const M = window.ORG_RAILS[page];
    const locked = !!M.locked;
    return (
      <div>
        <PageHead eyebrow={EB} title={M.title} sub={M.sub} />
        <div className="oc-skel-wrap">
          <div className="oc-skel">{M.kind === "cards" ? <SkelCards /> : <SkelTable />}</div>
          <div className="oc-skel-mask">
            <div className="oc-lockcard">
              <span className="oc-lockcard__icon" style={{ background: locked ? "var(--danger-weak)" : "var(--primary-weak)", color: locked ? "var(--danger)" : "var(--primary)" }}>
                <Icon name={locked ? "lock" : "hammer"} size={26} />
              </span>
              <div className="oc-lockcard__t" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                {M.title}<Concept tone={locked ? "warn" : undefined}>{locked ? "잠금" : "준비중"}</Concept>
              </div>
              <div className="oc-lockcard__d">{M.note}</div>
              <div style={{ marginTop: 18 }}>
                {locked
                  ? <Btn variant="secondary" icon="shield-check" onClick={() => toast("단체 인증 신청 (컨셉 · 준비중)")}>인증하고 잠금 해제</Btn>
                  : <Btn variant="secondary" icon="bell" onClick={() => toast("출시되면 알려드릴게요")}>출시 알림 받기</Btn>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 레일 자리 정의 ──────────────────────────────────────────
  window.ORG_RAILS = {
    members:  { title: "멤버",      sub: "단체 멤버를 초대하고 등급·권한을 관리해요.", kind: "table", note: "멤버 초대·등급 관리 화면을 준비하고 있어요. 곧 자기 단체 멤버를 직접 관리할 수 있어요." },
    officers: { title: "임원",      sub: "회장·총무 등 임원을 직책으로 지정해요.",     kind: "table", note: "직책(텍스트)으로 임원을 지정하는 화면을 준비하고 있어요." },
    teams:    { title: "소속 팀",   sub: "우리 단체 소속 팀을 등록·관리해요.",        kind: "cards", note: "소속 팀 관리 화면을 준비하고 있어요." },
    apps:     { title: "회원 신청", sub: "가입 신청을 승인하거나 반려해요.",           kind: "table", note: "회원 가입 신청 처리 화면을 준비하고 있어요." },
    leagues:  { title: "대회 · 리그", sub: "우리 단체가 여는 대회·리그를 관리해요.",   kind: "cards", note: "대회·리그 개최 화면을 준비하고 있어요. 공식 대회 개최는 단체 인증 후 이용할 수 있어요." },
    suborgs:  { title: "하위 단체", sub: "지부·산하 단체를 1단계로 연결해요.",         kind: "cards", note: "하위 단체(1단계) 연결 화면을 준비하고 있어요." },
    notices:  { title: "공지",      sub: "멤버에게 공지를 발행해요.",                 kind: "table", note: "공지 작성·발행 화면을 준비하고 있어요." },
    billing:  { title: "회비 정산", sub: "회비 수납과 정산 내역을 확인해요.",          kind: "table", locked: true, note: "회비 수납·조회는 곧 제공돼요. 다만 정산 출금은 단체 인증을 완료해야 이용할 수 있어요." },
  };

  // ── 네비게이션 (듀얼네비 · {label} 섹션 구분) ────────────────
  const NAV = [
    { label: "운영", icon: "layout-dashboard" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "profile", icon: "building-2", text: "단체 정보" },
    { label: "회원·팀", icon: "users" },
    { id: "members", icon: "users", text: "멤버" },
    { id: "officers", icon: "contact-round", text: "임원" },
    { id: "teams", icon: "shield", text: "소속 팀" },
    { id: "apps", icon: "user-plus", text: "회원 신청" },
    { label: "경기·대회", icon: "trophy" },
    { id: "leagues", icon: "trophy", text: "대회·리그" },
    { id: "suborgs", icon: "network", text: "하위 단체" },
    { id: "notices", icon: "megaphone", text: "공지" },
    { label: "정산", icon: "wallet" },
    { id: "billing", icon: "wallet", text: "회비 정산" },
  ];

  // ── 상단 데모 상태 바 ───────────────────────────────────────
  function DemoBar({ demo, setDemo, page }) {
    const opts = [["normal", "정상"], ["loading", "로딩"], ["empty", "빈 상태"], ["error", "에러"]];
    const applies = page === "dash" || page === "profile";
    return (
      <div className="oc-demobar">
        <span className="oc-demobar__lbl"><Icon name="flask-conical" size={14} color="#C7D0DA" />상태 미리보기</span>
        <div className="oc-demobar__seg">
          {opts.map(([k, l]) => (
            <button key={k} className="oc-demobar__btn" data-active={demo === k ? "true" : "false"} onClick={() => setDemo(k)}>{l}</button>
          ))}
        </div>
        <span className="oc-demobar__hint">{applies ? "대시보드·단체 정보에 적용 · 성공 상태는 저장 시 토스트로 확인" : "정상/로딩/빈/에러는 대시보드·단체 정보 화면에서 확인하세요"}</span>
      </div>
    );
  }

  // ── 앱 셸 ──────────────────────────────────────────────────
  window.OrgApp = function OrgApp() {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const [demo, setDemo] = useState("normal");
    useEffect(() => { document.body.classList.add("oc-hasdemo"); }, []);
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };

    let body;
    if (page === "dash") body = <Dashboard demo={demo} go={go} onRetry={() => setDemo("normal")} />;
    else if (page === "profile") body = <OrgProfile demo={demo} onRetry={() => setDemo("normal")} />;
    else if (window.ORG_RAILS[page]) body = <ComingSoon page={page} />;
    else body = <Dashboard demo={demo} go={go} onRetry={() => setDemo("normal")} />;

    return (
      <>
        <DemoBar demo={demo} setDemo={setDemo} page={page} />
        <window.AdminShell brand={window.ORG.name} brandSub="단체 콘솔" nav={NAV} active={page} onNav={go}
          user={{ initial: window.ORG.name.slice(0, 1), name: window.ORG.name, role: window.ORG.role }}>
          {body}
        </window.AdminShell>
      </>
    );
  };
})();
