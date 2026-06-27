/* global React, window */
// ============================================================
// bo-pages.jsx — 백오피스 페이지 (공용 admin-blocks 재사용)
//   대시보드/분석/설정 + 스키마 테이블 16종
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Btn, PageHead, KpiGrid, SchemaList, AdBarPanel, AdListPanel, AdSettings } = window;
  const EB = "관리자 콘솔";

  const CONSOLES = [
    { href: "대회 관리자.html", icon: "trophy", t: "대회 콘솔", d: "대회 목록·단체·정규대회·템플릿" },
    { href: "심판 관리자.html", icon: "gavel", t: "심판 콘솔", d: "배정·검증·등급·수당 정산" },
    { href: "협력업체 콘솔.html", icon: "handshake", t: "협력업체 콘솔", d: "파트너 시설·츠페인·정산" },
  ];

  // 슈퍼 관리자: 단체별 공개 사이트 선택
  const PUBLIC_ORGS = [
    { name: "BDR 농구문화", slug: "bdr-basketball", type: "정식 주최사", verified: true, tourn: "12개" },
    { name: "한강 스포츠클럽", slug: "hanriver-sports", type: "제휴 단체", verified: true, tourn: "4개" },
    { name: "인천농구협회", slug: "incheon-bba", type: "지역 협회", verified: true, tourn: "7개" },
    { name: "강남 바스켓 크루", slug: "gangnam-crew", type: "동호회", verified: false, pending: true, tourn: "2개" },
  ];
  function PublicSite() {
    return (
      <div>
        <PageHead eyebrow={EB} title="공개 사이트"
          sub="각 단체의 외부 공개 사이트입니다. 단체를 선택해 발행된 사이트를 확인합니다." />
        <div className="bo-orgsite-note">
          <window.Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
          <span>슈퍼 관리자는 모든 단체의 공개 사이트를 열어볼 수 있습니다. 단체 운영자는 소속 단체 사이트로 바로 연결됩니다. 인증 대기 단체는 비공개 미리보기로 열립니다.</span>
        </div>
        <div className="bo-launchgrid">
          {PUBLIC_ORGS.map(o => (
            <a key={o.slug} href={"토너먼트 사이트.html?org=" + o.slug} target="_blank" rel="noopener" className="bo-launch">
              <span className="bo-launch__ic"><window.Icon name="globe" size={20} /></span>
              <span className="bo-launch__body">
                <span className="bo-launch__t">{o.name}</span>
                <span className="bo-launch__d">{o.type} · 주최 대회 {o.tourn}</span>
              </span>
              <span className="bo-chip" data-tone={o.pending ? "warn" : "ok"} style={{ flex: "0 0 auto" }}>{o.pending ? "인증 대기" : "공개중"}</span>
            </a>
          ))}
        </div>
      </div>
    );
  }

  function ConsoleLaunch() {
    return (
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink-mute)", letterSpacing: "0.02em", marginBottom: 12 }}>운영 콘솔 바로가기</div>
        <div className="bo-launchgrid">
          {CONSOLES.map(c => (
            <a key={c.href} href={c.href} className="bo-launch">
              <span className="bo-launch__ic"><window.Icon name={c.icon} size={20} /></span>
              <span className="bo-launch__body">
                <span className="bo-launch__t">{c.t}</span>
                <span className="bo-launch__d">{c.d}</span>
              </span>
              <window.Icon name="arrow-up-right" size={16} style={{ color: "var(--ink-dim)", flex: "0 0 auto" }} />
            </a>
          ))}
        </div>
      </div>
    );
  }

  function Dashboard({ go }) {
    return (
      <div>
        <PageHead eyebrow={"MyBDR · 전국 농구 매칭 플랫폼"} title="관리자 홈"
          sub="플랫폼 전체 지표·처리 대기 항목과 운영 콘솔을 한 곧에서 관리합니다."
          actions={<><Btn variant="secondary" icon="bar-chart-3" onClick={() => go("analytics")}>상세 분석</Btn><Btn variant="secondary" icon="download" onClick={() => window.adToast && window.adToast("리포트 내보내기 (시연)")}>리포트 내보내기</Btn></>} />
        <KpiGrid items={window.BO_KPI} />
        <div className="ad-cols">
          <AdBarPanel title="월별 신규 가입" badge="+8% MoM" badgeTone="ok" data={window.BO_SIGNUP} />
          <AdListPanel title="처리 대기" badge="23건" badgeTone="warn" items={window.BO_QUEUE} />
        </div>
        <ConsoleLaunch />
      </div>
    );
  }

  function Analytics({ go }) {
    const A = window.BO_ANALYTICS;
    return (
      <div>
        <button className="ad-backlink" onClick={() => go("dash")}><window.Icon name="arrow-left" size={16} />관리자 홈</button>
        <PageHead eyebrow={EB + " · 관리자 홈"} title="상세 분석" sub="사용 지표와 기능별 활동 비중을 분석합니다."
          actions={<Btn variant="secondary" icon="calendar" onClick={() => window.adToast && window.adToast("기간 선택 (시연)")}>최근 7개월</Btn>} />
        <KpiGrid items={A.kpi} />
        <div className="ad-cols">
          <AdBarPanel title="활성 사용자 추이" badge="MAU" badgeTone="primary" data={A.bars} />
          <AdListPanel title="기능별 활동 비중" items={A.breakdown} bar />
        </div>
      </div>
    );
  }

  // ── 콘솔 정의 (탭 내부 구성) ──
  const CONSOLE_DEFS = {
    userConsole: { name: "유저 콘솔", tabs: [
      { id: "users", label: "사용자", schema: "users" },
      { id: "teams", label: "팀", schema: "teams" },
      { id: "organizations", label: "단체", schema: "organizations" },
    ] },
    matchConsole: { name: "매칭 콘솔", tabs: [
      { id: "games", label: "경기", schema: "games" },
      { id: "game-reports", label: "경기 리포트", schema: "game-reports" },
      { id: "guest", label: "게스트 모집", schema: "guest" },
      { id: "pickup", label: "픽업 게임", schema: "pickup" },
      { id: "scrim", label: "연습 경기", schema: "scrim" },
    ] },
    communityConsole: { name: "커뮤니티 콘솔", tabs: [
      { id: "board-free", label: "자유게시판", schema: "board-free" },
      { id: "board-recruit", label: "팀원 모집", schema: "board-recruit" },
      { id: "board-review", label: "후기", schema: "board-review" },
      { id: "suggestions", label: "제안", schema: "suggestions" },
    ] },
    courtConsole: { name: "코트 콘솔", tabs: [
      { id: "court-indoor", label: "실내 코트", schema: "court-indoor" },
      { id: "court-outdoor", label: "야외 코트", schema: "court-outdoor" },
      { id: "court-partner", label: "제휴 코트", schema: "court-partner" },
    ] },
    marketingConsole: { name: "마케팅 콘솔", tabs: [
      { id: "campaigns", label: "캠페인", schema: "campaigns" },
    ] },
  };
  function ConsolePage({ name, tabs }) {
    const [tab, setTab] = useState(tabs[0].id);
    const active = tabs.find(t => t.id === tab) || tabs[0];
    return (
      <div>
        <div className="bo-constabs">
          {tabs.map(t => <button key={t.id} type="button" className="bo-constab" data-on={tab === t.id ? "true" : "false"} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
        <SchemaList schema={window.BO_PAGES[active.schema]} eyebrow={name} />
      </div>
    );
  }

  // ── 마이페이지 ──
  function MyPage() {
    const [prefs, setPrefs] = useState({ report: true, weekly: true, payErr: true, comment: false });
    const [twofa, setTwofa] = useState(true);
    const tp = (k) => setPrefs(p => ({ ...p, [k]: !p[k] }));
    const Field = ({ k, v, mono }) => <div className="bo-field"><span className="bo-field__k">{k}</span><span className="bo-field__v" style={mono ? { fontFamily: "var(--ff-mono)" } : null}>{v}</span></div>;
    const Toggle = ({ on, onClick, t, s }) => (
      <div className="bo-featrow"><div style={{ flex: 1, minWidth: 0 }}><div className="bo-featrow__t">{t}</div><div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>{s}</div></div><window.Toggle on={on} onChange={onClick} /></div>
    );
    return (
      <div>
        <PageHead eyebrow={EB} title="마이페이지" sub="내 계정 정보와 알림·보안 설정을 관리합니다."
          actions={<Btn variant="secondary" icon="log-out" onClick={() => window.adToast && window.adToast("로그아웃 (시연)")}>로그아웃</Btn>} />
        <div className="ts-card" style={{ marginBottom: 20 }}>
          <div className="bo-hero">
            <span className="bo-hero__av" data-round="true" style={{ background: "var(--primary)" }}>운</span>
            <div className="bo-hero__meta">
              <div className="bo-hero__name">플랫폼 운영자</div>
              <div className="bo-hero__sub">admin@mybdr.kr · 슈퍼 관리자</div>
              <div className="bo-hero__badges"><window.Badge tone="primary">슈퍼 관리자</window.Badge><window.Badge tone={twofa ? "ok" : "grey"}>2단계 인증 {twofa ? "ON" : "OFF"}</window.Badge></div>
            </div>
          </div>
          <div className="bo-statgrid">
            <div className="bo-stat"><div className="bo-stat__v">4년차</div><div className="bo-stat__k">운영 경력</div></div>
            <div className="bo-stat"><div className="bo-stat__v" data-tone="primary">1,284</div><div className="bo-stat__k">처리 작업</div></div>
            <div className="bo-stat"><div className="bo-stat__v">전체</div><div className="bo-stat__k">접근 권한</div></div>
            <div className="bo-stat"><div className="bo-stat__v">2개</div><div className="bo-stat__k">활성 세션</div></div>
          </div>
        </div>
        <div className="ad-cols">
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 8 }}>계정 정보</div>
            <Field k="이름" v="플랫폼 운영자" />
            <Field k="이메일" v="admin@mybdr.kr" mono />
            <Field k="연락처" v="010-0000-0000" mono />
            <Field k="역할" v="슈퍼 관리자" />
            <Field k="소속" v="MyBDR 운영팀" />
            <Field k="가입일" v="2022.03.02" mono />
            <Field k="최근 로그인" v="2026.06.27 08:40" mono />
            <Btn variant="secondary" icon="edit-3" block style={{ marginTop: 12 }} onClick={() => window.adToast && window.adToast("프로필 편집 (시연)")}>프로필 편집</Btn>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 6 }}>알림 설정</div>
              <Toggle on={prefs.report} onClick={() => tp("report")} t="신고 즉시 알림" s="신고 발생 시 푸시" />
              <Toggle on={prefs.weekly} onClick={() => tp("weekly")} t="주간 리포트 메일" s="운영 지표 요약 발송" />
              <Toggle on={prefs.payErr} onClick={() => tp("payErr")} t="결제 이상 알림" s="결제 실패·환불 요청" />
              <Toggle on={prefs.comment} onClick={() => tp("comment")} t="멘션·댓글 알림" s="내 작업에 달린 코멘트" />
            </div>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 6 }}>보안</div>
              <Toggle on={twofa} onClick={() => setTwofa(v => !v)} t="2단계 인증" s="로그인 시 OTP 확인" />
              <div className="bo-featrow"><div style={{ flex: 1 }}><div className="bo-featrow__t">비밀번호</div><div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>90일마다 변경 권장</div></div><Btn variant="secondary" size="sm" onClick={() => window.adToast && window.adToast("비밀번호 변경 (시연)")}>변경</Btn></div>
              <div className="bo-featrow"><div style={{ flex: 1 }}><div className="bo-featrow__t">활성 세션 2개</div><div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>Chrome · macOS / iPhone</div></div><Btn variant="danger" size="sm" onClick={() => window.adToast && window.adToast("다른 기기 로그아웃 (시연)")}>모두 로그아웃</Btn></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "관리자 홈" },
    { id: "logs", icon: "scroll-text", text: "활동 로그" },
    { label: "운영 콘솔" },
    { id: "userConsole", icon: "users", text: "유저 콘솔" },
    { href: "대회 관리자.html", icon: "trophy", text: "대회 콘솔" },
    { id: "matchConsole", icon: "swords", text: "매칭 콘솔" },
    { id: "communityConsole", icon: "message-square", text: "커뮤니티 콘솔" },
    { id: "courtConsole", icon: "map-pin", text: "코트 콘솔" },
    { href: "심판 관리자.html", icon: "gavel", text: "심판 콘솔" },
    { href: "협력업체 콘솔.html", icon: "handshake", text: "협력업체 콘솔" },
    { id: "marketingConsole", icon: "megaphone", text: "마케팅 콘솔" },
    { id: "publicsite", icon: "globe", text: "공개 사이트" },
    { label: "정산·플랜" },
    { id: "payments", icon: "credit-card", text: "결제", badge: 5 },
    { id: "plans", icon: "layers", text: "요금제" },
    { label: "시스템" },
    { id: "notifications", icon: "bell", text: "알림" },
    { id: "settings", icon: "settings", text: "설정" },
    { id: "mypage", icon: "user", text: "마이페이지" },
  ];

  window.BackofficeApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const [detail, setDetail] = useState(null); // { view, row }
    useEffect(() => {
      window.__boDetailNav = (view, row) => { setDetail({ view, row }); window.scrollTo(0, 0); };
      return () => { delete window.__boDetailNav; };
    }, []);
    const go = (p) => { setDetail(null); setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    const backToList = () => { setDetail(null); window.scrollTo(0, 0); };
    let body;
    if (detail && detail.view === "payment") body = <window.PaymentDetail row={detail.row} onBack={backToList} />;
    else if (detail && detail.view === "plan") body = <window.PlanEditor row={detail.row} onBack={backToList} />;
    else if (detail && detail.view === "user") body = <window.UserDetail row={detail.row} onBack={backToList} />;
    else if (detail && detail.view === "team") body = <window.TeamDetail row={detail.row} onBack={backToList} />;
    else if (detail && detail.view === "org") body = <window.OrgDetail row={detail.row} onBack={backToList} />;
    else if (page === "dash") body = <Dashboard go={go} />;
    else if (page === "publicsite") body = <PublicSite />;
    else if (page === "mypage") body = <MyPage />;
    else if (CONSOLE_DEFS[page]) body = <ConsolePage name={CONSOLE_DEFS[page].name} tabs={CONSOLE_DEFS[page].tabs} />;
    else if (page === "analytics") body = <Analytics go={go} />;
    else if (page === "settings") body = <AdSettings eyebrow={EB} title="설정" sub="서비스 운영 정책과 시스템 옵션을 설정합니다." groups={window.BO_SETTINGS} />;
    else if (window.BO_PAGES[page]) body = <SchemaList schema={window.BO_PAGES[page]} eyebrow={EB} />;
    else body = <Dashboard />;
    return (
      <window.AdminShell brand="MyBDR" brandSub="관리자 콘솔" nav={NAV} active={page} onNav={go} isHome={true}
        user={{ initial: "운", name: "플랫폼 운영자", role: "슈퍼 관리자" }}>
        {body}
      </window.AdminShell>
    );
  };
})();
