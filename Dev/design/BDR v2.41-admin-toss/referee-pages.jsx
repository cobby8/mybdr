/* global React, window */
// ============================================================
// referee-pages.jsx — 심판 관리자 페이지 + 앱 셸
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, PageHead, KpiGrid, SchemaList, AdBarPanel, AdListPanel, AdSettings } = window;
  const EB = "심판 관리자";

  function Dashboard() {
    return (
      <div>
        <PageHead eyebrow={EB + " · v2.41 (Toss)"} title="배정 대시보드"
          sub="심판 배정 현황과 처리 대기 항목을 확인합니다."
          actions={<Btn variant="secondary" icon="download" onClick={() => window.adToast && window.adToast("주간 리포트 내보내기 (시연)")}>주간 리포트</Btn>} />
        <KpiGrid items={window.RF_KPI} />
        <div className="ad-cols">
          <AdBarPanel title="요일별 배정" badge="이번주 86건" badgeTone="primary" data={window.RF_WEEK} />
          <AdListPanel title="처리 대기" badge="긴급 1건" badgeTone="warn" items={window.RF_QUEUE} />
        </div>
      </div>
    );
  }

  // 주간 배정 캘린더 보드
  function Calendar() {
    const C = window.RF_CAL;
    return (
      <div>
        <PageHead eyebrow={EB} title="배정 캘린더" sub="주간 경기 일정과 심판 배정 상태를 한눈에 봅니다."
          actions={<><Btn variant="secondary" icon="chevron-left" size="sm" onClick={() => window.adToast && window.adToast("이전 주 (시연)")}>이전</Btn><Btn variant="secondary" size="sm" onClick={() => window.adToast && window.adToast("이번 주로 이동 (시연)")}>이번주</Btn><Btn variant="secondary" icon="chevron-right" size="sm" onClick={() => window.adToast && window.adToast("다음 주 (시연)")}>다음</Btn></>} />
        <div className="rf-cal">
          {C.days.map((d, di) => {
            const evs = C.events.filter(e => e.day === di);
            return (
              <div key={di} className="rf-cal__col">
                <div className="rf-cal__day">{d}</div>
                <div className="rf-cal__slots">
                  {evs.length === 0
                    ? <div className="rf-cal__empty">—</div>
                    : evs.map((e, i) => (
                      <div key={i} className="rf-cal__ev" data-tone={e.tone}>
                        <div className="rf-cal__ev-time">{e.time}</div>
                        <div className="rf-cal__ev-t">{e.t}</div>
                        <div className="rf-cal__ev-crew"><Icon name="users" size={12} />{e.crew}</div>
                      </div>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 등급·수당 정책
  function Grades() {
    return (
      <div>
        <PageHead eyebrow={EB} title="등급·수당" sub="심판 등급별 배정 권한과 경기당 수당을 관리합니다."
          actions={<Btn icon="pencil" onClick={() => window.adToast && window.adToast("등급·수당 정책 수정 (시연)")}>정책 수정</Btn>} />
        <div className="ad-cardgrid">
          {window.RF_GRADES.map(g => (
            <div key={g.id} className="ad-card">
              <div className="rf-grade__top">
                <span className="rf-grade__badge" style={{ background: g.color }}>{g.grade}</span>
                <span className="rf-grade__count">{g.count}명</span>
              </div>
              <div className="rf-grade__pay">
                <div><div className="rf-grade__paylbl">주심</div><div className="rf-grade__payval">{g.main}</div></div>
                <div className="rf-grade__div" />
                <div><div className="rf-grade__paylbl">부심</div><div className="rf-grade__payval">{g.sub}</div></div>
              </div>
              <div className="rf-grade__note">{g.note}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "assign", icon: "clipboard-check", text: "배정 현황", badge: 3 },
    { id: "calendar", icon: "calendar-days", text: "배정 캘린더" },
    { label: "심판단" },
    { id: "refs", icon: "users", text: "심판 명단", badge: "142" },
    { id: "apps", icon: "inbox", text: "신청 관리", badge: 2 },
    { id: "verify", icon: "badge-check", text: "자격·서류 검증", badge: 2 },
    { label: "경기·평가" },
    { id: "requests", icon: "send", text: "배정 요청", badge: 1 },
    { id: "evals", icon: "star", text: "평가 리포트" },
    { label: "정산" },
    { id: "settle", icon: "wallet", text: "정산" },
    { id: "grades", icon: "layers", text: "등급·수당" },
    { label: "시스템" },
    { id: "noti", icon: "bell", text: "알림" },
    { id: "settings", icon: "settings", text: "설정" },
  ];

  window.RefereeApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    let body;
    if (page === "dash") body = <Dashboard />;
    else if (page === "assign") body = <SchemaList schema={window.RF_ASSIGN} eyebrow={EB} />;
    else if (page === "calendar") body = <Calendar />;
    else if (page === "refs") body = <SchemaList schema={window.RF_REFS} eyebrow={EB} />;
    else if (page === "apps") body = <SchemaList schema={window.RF_APPS} eyebrow={EB} />;
    else if (page === "verify") body = <SchemaList schema={window.RF_VERIFY} eyebrow={EB} />;
    else if (page === "requests") body = <SchemaList schema={window.RF_REQ} eyebrow={EB} />;
    else if (page === "evals") body = <SchemaList schema={window.RF_EVAL} eyebrow={EB} />;
    else if (page === "settle") body = <SchemaList schema={window.RF_SETTLE} eyebrow={EB} />;
    else if (page === "grades") body = <Grades />;
    else if (page === "noti") body = <SchemaList schema={window.RF_NOTI} eyebrow={EB} />;
    else if (page === "settings") body = <AdSettings eyebrow={EB} title="설정" sub="심판 배정·자격·정산 정책을 설정합니다." groups={window.RF_SETTINGS} />;
    else body = <Dashboard />;
    return (
      <window.AdminShell brand="MyBDR" brandSub="심판 콘솔" nav={NAV} active={page} onNav={go}
        user={{ initial: "심", name: "심판 배정 관리자", role: "심판 운영팀" }}>
        {body}
      </window.AdminShell>
    );
  };
})();
