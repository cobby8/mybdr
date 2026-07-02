/* global React, window */
// ============================================================
// hub-pages.jsx — 관리자 콘솔 홈(관리자 홈.html) 페이지
//   ▸ 듀얼 사이드바(admin-shell) flatPanel=false → 레일 섹션 전환형.
//   ▸ 콘솔별 하위 페이지는 SchemaList 재사용, 대회/심판/협력업체는
//     전용 콘솔 앱으로 여는 안내 바(ext) 포함.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, PageHead, KpiGrid, AdBarPanel, SchemaList, AdSettings, Empty } = window;
  const EB = "관리자 콘솔";

  // ── 허브 전용 스타일 1회 주입 ──────────────────────────────
  if (!window.__hubInjected) {
    window.__hubInjected = true;
    const css = `
.hub-section-title { font-size: 13px; font-weight: 700; color: var(--ink-mute); margin: 28px 0 12px; }
.hub-shortcuts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.hub-card { display: flex; align-items: center; gap: 14px; padding: 18px; background: var(--bg-card, #fff);
  border: 1px solid var(--border); border-radius: 16px; text-decoration: none; min-width: 0;
  box-sizing: border-box; transition: transform .12s, border-color .12s, box-shadow .12s; }
.hub-card:hover { transform: translateY(-2px); border-color: var(--primary); box-shadow: 0 10px 30px -16px var(--shadow, rgba(20,30,55,.25)); }
.hub-card__icon { width: 44px; height: 44px; border-radius: 12px; background: var(--primary-weak);
  color: var(--primary); display: grid; place-items: center; flex: 0 0 auto; }
.hub-card__t { font-size: 15.5px; font-weight: 800; color: var(--ink); }
.hub-card__s { font-size: 12.5px; color: var(--ink-mute); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hub-extbar { display: flex; align-items: center; gap: 12px; padding: 13px 16px; margin: 0 0 18px;
  background: var(--primary-weak); border: 1px solid var(--border); border-radius: 12px; box-sizing: border-box; }
.hub-extbar__t { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 600; color: var(--ink-soft); }
@media (max-width: 720px) { .hub-shortcuts { grid-template-columns: minmax(0, 1fr); } }
`;
    const s = document.createElement('style');
    s.id = 'hub-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── 대시보드 (관리자 홈) ───────────────────────────────────
  function Dashboard() {
    return (
      <div>
        <PageHead eyebrow={EB + " · 전국 농구 매칭 플랫폼"} title="관리자 홈"
          sub="플랫폼 전체 지표·처리 대기 항목과 운영 콘솔을 한 곳에서 관리합니다."
          actions={<Btn variant="secondary" icon="bar-chart-3" onClick={() => window.adToast && window.adToast("상세 분석 (시연)")}>상세 분석</Btn>} />

        <KpiGrid items={window.HUB_KPI} />

        <div className="ad-cols">
          <AdBarPanel title="월별 신규 가입" badge="최근 6개월" badgeTone="ok" data={window.HUB_SIGNUP} />
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div className="ad-panel__title">처리 대기</div>
              <Badge tone="warn">0</Badge>
            </div>
            <Empty icon="inbox" title="처리할 항목이 없습니다" />
          </div>
        </div>

        <div className="hub-section-title">운영 콘솔 바로가기</div>
        <div className="hub-shortcuts">
          {window.HUB_SHORTCUTS.map((s) => (
            <a key={s.id} className="hub-card" href={s.href}>
              <span className="hub-card__icon"><Icon name={s.icon} size={22} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="hub-card__t">{s.title}</div>
                <div className="hub-card__s">{s.sub}</div>
              </div>
              <Icon name="arrow-up-right" size={18} style={{ color: "var(--ink-dim)", flex: "0 0 auto" }} />
            </a>
          ))}
        </div>
      </div>
    );
  }

  // ── 콘솔 하위 페이지 (스키마 리스트 + ext 안내 바) ──────────
  function HubPage({ id }) {
    const schema = window.HUB_PAGES[id];
    if (!schema) return <div><PageHead eyebrow={EB} title="준비 중" sub="곧 제공될 페이지입니다." /><Empty icon="inbox" title="준비 중인 페이지입니다" /></div>;
    return (
      <div>
        {schema.ext && (
          <div className="hub-extbar">
            <Icon name="info" size={18} style={{ color: "var(--primary)", flex: "0 0 auto" }} />
            <span className="hub-extbar__t">전용 콘솔에서 전체 기능을 운영할 수 있습니다.</span>
            <Btn size="sm" iconRight="arrow-up-right" onClick={() => { window.location.href = schema.ext.href; }}>{schema.ext.label}</Btn>
          </div>
        )}
        <SchemaList schema={schema} eyebrow={EB} />
      </div>
    );
  }

  window.AdminHubApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "home");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };

    let body;
    if (page === "home") body = <Dashboard />;
    else if (page === "settings") body = <AdSettings eyebrow={EB} title="설정" sub="서비스 운영 정책과 시스템 옵션을 설정합니다." groups={window.HUB_SETTINGS} />;
    else if (window.HUB_PAGES[page]) body = <HubPage id={page} />;
    else body = <Dashboard />;

    return (
      <window.AdminShell brand="MyBDR" brandSub="관리자 콘솔" nav={window.HUB_NAV} active={page} onNav={go} flatPanel={false}
        user={{ initial: "B", name: "BDR_Admin master", role: "최고 관리자" }}>
        {body}
      </window.AdminShell>
    );
  };
})();
