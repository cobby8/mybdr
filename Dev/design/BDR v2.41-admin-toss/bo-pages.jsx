/* global React, window */
// ============================================================
// bo-pages.jsx — 백오피스(/admin/*) 페이지
//   ▸ 실소스 정합: src/app/(admin)/admin/* + sidebar.tsx
//   ▸ 대시보드 = admin/page.tsx 형태(4 count KPI + 활동추이 7일 + admin_logs)
//   ▸ NAV = BO_NAV(sidebar.tsx navStructure) · 역할 미리보기 스위처로 필터 시연
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, PageHead, KpiGrid, SchemaList, AdBarPanel, AdListPanel, AdSettings } = window;
  const EB = "백오피스";

  const sevColor = (s) => ({ error: "var(--danger)", warning: "var(--warn)", success: "var(--ok)", info: "var(--primary)" }[s] || "var(--ink-soft)");

  // ── 대시보드 (admin/page.tsx 형태) ─────────────────────────
  function Dashboard({ go }) {
    const acts = window.BO_ACTIVITY7;
    const max = Math.max(...acts.map((a) => a.count), 1);
    return (
      <div>
        <PageHead eyebrow={EB + " · v2.42 (Toss · 실데이터 정합)"} title="관리자 대시보드"
          sub="유저, 대회, 경기, 팀 현황과 최근 관리자 활동을 한눈에 확인합니다."
          actions={<Btn variant="secondary" icon="download" onClick={() => window.adToast && window.adToast("리포트 내보내기 (시연)")}>리포트 내보내기</Btn>} />

        <div className="ad-section-title" style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-mute)", margin: "0 0 12px" }}>통계 · 최근 7일</div>
        <KpiGrid items={window.BO_KPI} />

        <div className="ad-cols">
          {/* 활동 추이 — admin_logs 최근 7일 일별 건수 */}
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div className="ad-panel__title">활동 추이</div>
              <Badge tone="grey">관리자 활동 · 최근 7일</Badge>
            </div>
            <div className="ad-bars">
              {acts.map((a) => (
                <div key={a.day} className="ad-bar">
                  <div className="ad-bar__col" data-soft={a.count === 0 ? "true" : "false"}
                    style={{ height: Math.max(a.count / max * 130, 3) + "px" }} title={a.day + " · " + a.count + "건"} />
                  <div className="ad-bar__lbl">{a.day}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 활동 — admin_logs.findMany(take 5) */}
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div className="ad-panel__title">최근 활동</div>
              <button className="ad-cell-sub" style={{ background: "none", border: 0, cursor: "pointer", color: "var(--primary)", fontWeight: 700, fontSize: 13 }}
                onClick={() => go("logs")}>전체 보기</button>
            </div>
            <div className="ad-list">
              {window.BO_RECENT_LOGS.map((log, i) => (
                <div key={i} className="ad-listrow">
                  <span className="ad-listrow__icon" style={{ background: "var(--grey-100)" }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: sevColor(log.severity), display: "block" }} />
                  </span>
                  <div className="ad-listrow__body">
                    <div className="ad-listrow__t">{window.BO_ACTION_LABEL[log.action] || log.action}</div>
                    <div className="ad-listrow__s">{log.desc}</div>
                  </div>
                  <span className="ad-listrow__meta">{log.admin}<br />{log.at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── 분석 ───────────────────────────────────────────────────
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

  // ── 역할 미리보기 스위처 (sidebar.tsx filterStructureByRoles 시연) ──
  function RoleSwitch({ role, setRole }) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 20px", flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--ink-mute)", display: "inline-flex", alignItems: "center", gap: 5 }}>
          <Icon name="eye" size={15} />역할 미리보기
        </span>
        <div className="ts-segment" style={{ flexWrap: "wrap" }}>
          {window.BO_ROLES.map((r) => (
            <button key={r.id} className="ts-segment__btn" data-active={role === r.id ? "true" : "false"}
              style={{ flex: "0 0 auto", padding: "8px 12px" }} onClick={() => setRole(r.id)}>{r.label}</button>
          ))}
        </div>
      </div>
    );
  }

  window.BackofficeApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const [role, setRole] = useState("super_admin");
    const go = (p) => {
      if (p === "partner-admin") { location.href = "협력업체 콘솔.html"; return; }
      setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0);
    };

    let body;
    if (page === "dash") body = <Dashboard go={go} />;
    else if (page === "analytics") body = <Analytics />;
    else if (page === "settings") body = <AdSettings eyebrow={EB} title="시스템 설정" sub="서비스 운영 정책과 시스템 옵션을 설정합니다." groups={window.BO_SETTINGS} />;
    else if (window.BO_PAGES[page]) body = <SchemaList schema={window.BO_PAGES[page]} eyebrow={EB} />;
    else body = <Dashboard go={go} />;

    return (
      <window.AdminShell brand="MyBDR" brandSub="백오피스" nav={window.BO_NAV} active={page} onNav={go} roles={[role]}
        user={{ initial: "운", name: "플랫폼 운영자", role: (window.BO_ROLES.find((r) => r.id === role) || {}).label || "관리자" }}>
        <RoleSwitch role={role} setRole={setRole} />
        {body}
      </window.AdminShell>
    );
  };
})();
