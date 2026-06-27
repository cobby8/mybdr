/* global React, window */
// ============================================================
// admin-shell.jsx — 관리자 공용 셸 (Toss)
//   사이드바 + 모바일 토픽바/드로어 + 페이지 헤더 + KPI/테이블 유틸
//   tournament-admin / 백오피스 양쪽이 nav 설정만 바꿔 재사용.
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Icon } = window;

  // nav 항목: { label } = 그룹 헤더 / { id, icon, text, badge } = 링크
  function Nav({ nav, active, onNav, onClose }) {
    return (
      <nav className="ts-sidebar__nav">
        {nav.map((it, i) =>
          it.label
            ? <div key={"l" + i} className="ts-sidebar__label">{it.label}</div>
            : <button key={it.id + (active === it.id ? "-a" : "")} className="ts-navlink" data-active={active === it.id ? "true" : "false"}
                onClick={() => { onNav(it.id); onClose && onClose(); }}>
                <Icon name={it.icon} size={19} />
                <span style={{ flex: 1 }}>{it.text}</span>
                {it.badge != null && <span className="ts-navlink__badge">{it.badge}</span>}
              </button>
        )}
      </nav>
    );
  }

  window.AdminShell = function AdminShell({ brand, brandSub, nav, active, onNav, user, children }) {
    const [drawer, setDrawer] = useState(false);
    const [toast, setToast] = useState(null);
    const [detail, setDetail] = useState(null);
    useEffect(() => { document.body.style.overflow = drawer ? "hidden" : ""; }, [drawer]);
    useEffect(() => {
      window.adToast = (msg) => { setToast(msg); clearTimeout(window.__adToastT); window.__adToastT = setTimeout(() => setToast(null), 2200); };
      window.adDetail = (payload) => setDetail(payload);
      return () => { delete window.adToast; delete window.adDetail; };
    }, []);
    const activeText = (nav.find(n => n.id === active) || {}).text || "";

    const Brand = (
      <a href="관리자 홈.html" className="ts-sidebar__brand" title="관리자 홈으로" style={{ textDecoration: "none", color: "inherit" }}>
        <span className="ts-sidebar__brand-dot">B</span>
        <div style={{ lineHeight: 1.2 }}>
          <div>{brand}</div>
          {brandSub && <div style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-mute)" }}>{brandSub}</div>}
        </div>
      </a>
    );
    const UserChip = user && (
      <button className="ts-userchip" onClick={() => window.adToast && window.adToast("계정 메뉴 (시연)")}>
        <span className="ts-avatar">{user.initial}</span>
        <div style={{ textAlign: "left", lineHeight: 1.3, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>{user.role}</div>
        </div>
        <Icon name="chevron-right" size={16} style={{ marginLeft: "auto", color: "var(--ink-dim)" }} />
      </button>
    );

    return (
      <div className="ts-shell">
        {/* 데스크톱 사이드바 */}
        <aside className="ts-sidebar">
          {Brand}
          <Nav nav={nav} active={active} onNav={onNav} />
          <div className="ts-sidebar__foot">{UserChip}</div>
        </aside>

        {/* 모바일 토픽바 */}
        <header className="ts-topbar">
          <button className="ts-mtoggle" onClick={() => setDrawer(true)}><Icon name="menu" size={20} /></button>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{activeText}</div>
        </header>

        {/* 모바일 드로어 */}
        {drawer && <div className="ts-overlay" onClick={() => setDrawer(false)} />}
        <aside className="ts-drawer" data-open={drawer ? "true" : "false"}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 12 }}>
            {Brand}
            <button className="ts-mtoggle" style={{ background: "transparent" }} onClick={() => setDrawer(false)}><Icon name="x" size={20} /></button>
          </div>
          <Nav nav={nav} active={active} onNav={onNav} onClose={() => setDrawer(false)} />
          <div className="ts-sidebar__foot">{UserChip}</div>
        </aside>

        <main className="ts-main">
          <div className="ts-main__inner">{children}</div>
        </main>

        {detail && (
          <>
            <div className="ad-drawer__scrim" onClick={() => setDetail(null)} />
            <aside className="ad-drawer" role="dialog" aria-label="상세">
              <div className="ad-drawer__top">
                <div style={{ minWidth: 0 }}>
                  <div className="ad-drawer__eyebrow">{detail.eyebrow || "상세 정보"}</div>
                  <div className="ad-drawer__title">{detail.title}</div>
                  {detail.sub && <div className="ad-drawer__sub">{detail.sub}</div>}
                </div>
                <button className="ad-iconbtn" onClick={() => setDetail(null)} title="닫기"><Icon name="x" size={18} /></button>
              </div>
              {detail.badge != null && <div style={{ padding: "0 22px 4px" }}><Badge tone={detail.tone || "grey"}>{detail.badge}</Badge></div>}
              <div className="ad-drawer__body">
                {detail.fields.map((f, i) => (
                  <div key={i} className="ad-drawer__field">
                    <span className="ad-drawer__k">{f.label}</span>
                    <span className="ad-drawer__v">{f.value == null || f.value === "" ? "—" : f.value}</span>
                  </div>
                ))}
              </div>
              <div className="ad-drawer__foot">
                <Btn variant="secondary" block icon="edit-3" onClick={() => window.adToast && window.adToast(detail.title + " 수정 (시연)")}>수정</Btn>
                <Btn block icon="check" onClick={() => { setDetail(null); window.adToast && window.adToast("처리 완료 (시연)"); }}>확인</Btn>
              </div>
            </aside>
          </>
        )}

        {toast && <div className="ts-toast"><Icon name="check" size={16} />{toast}</div>}
      </div>
    );
  };

  // ── 페이지 헤더 ──────────────────────────────────────────
  window.PageHead = function PageHead({ eyebrow, title, sub, actions }) {
    return (
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div>
            {eyebrow && <div className="ts-ph__eyebrow">{eyebrow}</div>}
            <div className="ts-ph__title">{title}</div>
            {sub && <div className="ts-ph__sub">{sub}</div>}
          </div>
          {actions && <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>}
        </div>
      </div>
    );
  };

  // ── KPI 카드 그리드 ─────────────────────────────────────
  window.KpiGrid = function KpiGrid({ items }) {
    return (
      <div className="ad-kpi-grid">
        {items.map((k) => (
          <div key={k.label} className="ad-kpi">
            <div className="ad-kpi__top">
              <span className="ad-kpi__icon" data-tone={k.tone || "primary"}><Icon name={k.icon} size={18} /></span>
              {k.delta != null && <span className="ad-kpi__delta" data-dir={k.delta >= 0 ? "up" : "down"}>{k.delta >= 0 ? "+" : ""}{k.delta}%</span>}
            </div>
            <div className="ad-kpi__val">{k.value}</div>
            <div className="ad-kpi__label">{k.label}</div>
          </div>
        ))}
      </div>
    );
  };

  // ── 테이블 (그리드 기반) ────────────────────────────────
  window.DataTable = function DataTable({ cols, rows, render, empty, onRow }) {
    const gt = cols.map(c => c.w || "1fr").join(" ");
    if (!rows.length) return <window.Empty icon="inbox" title={empty || "데이터가 없습니다"} />;
    return (
      <div className="ad-tablescroll">
        <div className="ts-table ad-table">
          <div className="ts-thead" style={{ gridTemplateColumns: gt }}>
            {cols.map(c => <div key={c.key} style={{ textAlign: c.align || "left" }}>{c.label}</div>)}
          </div>
          {rows.map((r, i) => (
            <div key={r.id || i} className="ts-trow" style={{ gridTemplateColumns: gt, cursor: onRow ? "pointer" : "default" }}
              onClick={onRow ? () => onRow(r) : undefined}>
              {cols.map(c => <div key={c.key} style={{ textAlign: c.align || "left", minWidth: 0 }}>{render(r, c.key)}</div>)}
            </div>
          ))}
        </div>
      </div>
    );
  };
})();
