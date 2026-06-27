/* global React, window */
// ============================================================
// partner-pages.jsx — 협력업체 콘솔 페이지 + 앱 셸
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, PageHead, KpiGrid, SchemaList, AdBarPanel, AdListPanel } = window;
  const EB = "협력업체 콘솔";

  function Dashboard() {
    return (
      <div>
        <PageHead eyebrow={EB + " · v2.41 (Toss)"} title="파트너 대시보드"
          sub="내 시설 예약과 캠페인 성과, 정산 현황을 한눈에 확인합니다."
          actions={<Btn variant="secondary" icon="download" onClick={() => window.adToast && window.adToast("월간 리포트 내보내기 (시연)")}>월간 리포트</Btn>} />
        <KpiGrid items={window.PT_KPI} />
        <div className="ad-cols">
          <AdBarPanel title="월별 예약 추이" badge="+12% MoM" badgeTone="ok" data={window.PT_BOOK} />
          <AdListPanel title="최근 활동" badge="실시간" badgeTone="primary" items={window.PT_RECENT} />
        </div>
      </div>
    );
  }

  function CampaignDetail({ onBack }) {
    const D = window.PT_CAMPAIGN_DETAIL;
    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />캠페인 목록</button>
        <PageHead eyebrow={EB} title={D.name} sub={D.meta}
          actions={<><Btn variant="secondary" icon="pencil" size="sm" onClick={() => window.adToast && window.adToast("캐페인 수정 (시연)")}>수정</Btn><Btn variant="secondary" icon="pause" size="sm" onClick={() => window.adToast && window.adToast("캐페인 일시중지 (시연)")}>일시중지</Btn></>} />
        <KpiGrid items={D.kpi} />
        <div className="ad-cols">
          <AdBarPanel title="주차별 노출" badge="누적 42.1K" badgeTone="violet" data={D.daily} />
          <AdListPanel title="노출 영역별 비중" items={D.slots} bar />
        </div>
      </div>
    );
  }

  function Campaigns({ onOpen }) {
    return (
      <div onClick={(e) => { if (e.target.closest(".ad-iconbtn, .ts-trow")) onOpen(); }}>
        <SchemaList schema={window.PT_CAMPAIGNS} eyebrow={EB} />
      </div>
    );
  }

  const NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "venues", icon: "map-pin", text: "내 시설", badge: 4 },
    { label: "마케팅" },
    { id: "campaigns", icon: "megaphone", text: "캠페인", badge: 2 },
    { label: "정산" },
    { id: "settle", icon: "wallet", text: "정산" },
  ];

  window.PartnerApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    let body;
    if (page === "dash") body = <Dashboard />;
    else if (page === "venues") body = <SchemaList schema={window.PT_VENUES} eyebrow={EB} />;
    else if (page === "campaigns") body = <Campaigns onOpen={() => go("campaign-detail")} />;
    else if (page === "campaign-detail") body = <CampaignDetail onBack={() => go("campaigns")} />;
    else if (page === "settle") body = <SchemaList schema={window.PT_SETTLE} eyebrow={EB} />;
    else body = <Dashboard />;

    // 드릴인 페이지는 nav active 를 부모로 표시
    const activeId = page === "campaign-detail" ? "campaigns" : page;
    return (
      <window.AdminShell brand="강남 스포츠" brandSub="협력업체 콘솔" nav={NAV} active={activeId} onNav={go}
        user={{ initial: "강", name: "강남 스포츠", role: "시설 운영사" }}>
        {body}
      </window.AdminShell>
    );
  };
})();
