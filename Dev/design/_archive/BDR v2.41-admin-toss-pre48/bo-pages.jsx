/* global React, window */
// ============================================================
// bo-pages.jsx — 백오피스 페이지 (공용 admin-blocks 재사용)
//   대시보드/분석/설정 + 스키마 테이블 16종
// ============================================================
(function () {
  const { useState } = React;
  const { Btn, PageHead, KpiGrid, SchemaList, AdBarPanel, AdListPanel, AdSettings } = window;
  const EB = "백오피스";

  function Dashboard() {
    return (
      <div>
        <PageHead eyebrow={EB + " · v2.41 (Toss)"} title="운영 대시보드"
          sub="플랫폼 전체 지표와 처리 대기 항목을 확인합니다."
          actions={<Btn variant="secondary" icon="download" onClick={() => window.adToast && window.adToast("리포트 내보내기 (시연)")}>리포트 내보내기</Btn>} />
        <KpiGrid items={window.BO_KPI} />
        <div className="ad-cols">
          <AdBarPanel title="월별 신규 가입" badge="+8% MoM" badgeTone="ok" data={window.BO_SIGNUP} />
          <AdListPanel title="처리 대기" badge="23건" badgeTone="warn" items={window.BO_QUEUE} />
        </div>
      </div>
    );
  }

  function Analytics() {
    const A = window.BO_ANALYTICS;
    return (
      <div>
        <PageHead eyebrow={EB} title="분석" sub="사용 지표와 기능별 활동 비중을 분석합니다."
          actions={<Btn variant="secondary" icon="calendar" onClick={() => window.adToast && window.adToast("기간 선택 (시연)")}>최근 7개월</Btn>} />
        <KpiGrid items={A.kpi} />
        <div className="ad-cols">
          <AdBarPanel title="활성 사용자 추이" badge="MAU" badgeTone="primary" data={A.bars} />
          <AdListPanel title="기능별 활동 비중" items={A.breakdown} bar />
        </div>
      </div>
    );
  }

  const NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "analytics", icon: "bar-chart-3", text: "분석" },
    { id: "logs", icon: "scroll-text", text: "활동 로그" },
    { label: "회원·팀" },
    { id: "users", icon: "users", text: "사용자", badge: "12.8K" },
    { id: "teams", icon: "shield", text: "팀", badge: "1.2K" },
    { id: "organizations", icon: "building-2", text: "단체" },
    { label: "대회·경기" },
    { id: "tournaments", icon: "trophy", text: "대회" },
    { id: "games", icon: "circle-dot", text: "경기" },
    { id: "game-reports", icon: "clipboard-list", text: "경기 리포트", badge: 3 },
    { label: "시설·제휴" },
    { id: "courts", icon: "map-pin", text: "코트" },
    { id: "partners", icon: "handshake", text: "협력업체" },
    { id: "campaigns", icon: "megaphone", text: "캠페인" },
    { label: "정산·플랜" },
    { id: "payments", icon: "credit-card", text: "결제", badge: 5 },
    { id: "plans", icon: "layers", text: "요금제" },
    { label: "커뮤니티" },
    { id: "community", icon: "message-square", text: "커뮤니티", badge: 1 },
    { id: "suggestions", icon: "lightbulb", text: "제안", badge: 9 },
    { label: "시스템" },
    { id: "notifications", icon: "bell", text: "알림" },
    { id: "settings", icon: "settings", text: "설정" },
  ];

  window.BackofficeApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    let body;
    if (page === "dash") body = <Dashboard />;
    else if (page === "analytics") body = <Analytics />;
    else if (page === "settings") body = <AdSettings eyebrow={EB} title="설정" sub="서비스 운영 정책과 시스템 옵션을 설정합니다." groups={window.BO_SETTINGS} />;
    else if (window.BO_PAGES[page]) body = <SchemaList schema={window.BO_PAGES[page]} eyebrow={EB} />;
    else body = <Dashboard />;
    return (
      <window.AdminShell brand="MyBDR" brandSub="백오피스" nav={NAV} active={page} onNav={go}
        user={{ initial: "운", name: "플랫폼 운영자", role: "슈퍼 관리자" }}>
        {body}
      </window.AdminShell>
    );
  };
})();
