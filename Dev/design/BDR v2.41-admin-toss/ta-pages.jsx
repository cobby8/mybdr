/* global React, window */
// ============================================================
// ta-pages.jsx — 대회 관리자 페이지들 (대시보드/목록/단체/정규대회/템플릿)
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Empty, PageHead, KpiGrid, DataTable } = window;

  // ── 대시보드 ───────────────────────────────────────────
  function Dashboard({ go }) {
    const max = Math.max(...window.TA_CHART.map(c => c.v));
    return (
      <div>
        <PageHead eyebrow="대회 관리자 · v2.41 (Toss)" title="대시보드"
          sub="운영 중인 대회 현황과 최근 활동을 한눈에 확인합니다."
          actions={<Btn icon="plus" onClick={() => { location.href = "대회 생성.html"; }}>새 대회 만들기</Btn>} />
        <KpiGrid items={window.TA_KPI} />
        <div className="ad-cols">
          <div className="ad-panel">
            <div className="ad-panel__head">
              <div className="ad-panel__title">월별 개최 대회</div>
              <Badge tone="primary">2026년</Badge>
            </div>
            <div className="ad-bars">
              {window.TA_CHART.map(c => (
                <div key={c.m} className="ad-bar">
                  <div className="ad-bar__col" data-soft={c.soft ? "true" : "false"} style={{ height: (c.v / max * 130) + "px" }} />
                  <div className="ad-bar__lbl">{c.m}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 16, fontSize: 12.5, color: "var(--ink-mute)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary)" }} />개최 완료</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--primary-weak)" }} />예정</span>
            </div>
          </div>
          <div className="ad-panel">
            <div className="ad-panel__head"><div className="ad-panel__title">최근 활동</div></div>
            <div className="ad-list">
              {window.TA_ACTIVITY.map(a => (
                <div key={a.id} className="ad-listrow">
                  <span className="ad-listrow__icon" style={{ background: "var(--grey-100)" }}><Icon name={a.icon} size={17} color={toneColor(a.tone)} /></span>
                  <div className="ad-listrow__body">
                    <div className="ad-listrow__t">{a.t}</div>
                    <div className="ad-listrow__s">{a.s}</div>
                  </div>
                  <span className="ad-listrow__meta">{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function toneColor(t) {
    return { ok: "var(--ok)", primary: "var(--primary)", warn: "var(--warn)", violet: "#6D5AE6", danger: "var(--danger)" }[t] || "var(--ink-soft)";
  }

  // ── 대회 목록 ──────────────────────────────────────────
  const STATUS_FILTERS = [["all", "전체"], ["진행중", "진행중"], ["접수중", "접수중"], ["준비중", "준비중"], ["종료", "종료"]];
  function TournamentList() {
    const [q, setQ] = useState("");
    const [f, setF] = useState("all");
    const rows = window.TA_TOURNAMENTS.filter(t =>
      (f === "all" || t.status === f) &&
      (!q || t.name.includes(q) || t.venue.includes(q) || t.org.includes(q)));
    const cols = [
      { key: "name", label: "대회명", w: "minmax(0,2.2fr)" },
      { key: "venue", label: "장소", w: "minmax(0,1.4fr)" },
      { key: "date", label: "개최일", w: "minmax(0,1fr)" },
      { key: "teams", label: "참가팀", w: "84px", align: "center" },
      { key: "status", label: "상태", w: "92px", align: "center" },
      { key: "act", label: "", w: "92px", align: "right" },
    ];
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="대회 목록"
          sub="등록된 모든 대회를 관리합니다. 행을 눌러 운영 워크스페이스로 이동합니다."
          actions={<><Btn variant="secondary" icon="download" size="sm" onClick={() => window.adToast && window.adToast("대회 목록 내보내기 (시연)")}>내보내기</Btn><Btn icon="plus" onClick={() => { location.href = "대회 생성.html"; }}>새 대회 만들기</Btn></>} />
        <div className="ad-toolbar">
          <div className="ad-search"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder="대회명 · 장소 · 단체 검색" /></div>
          <div className="ad-filters">{STATUS_FILTERS.map(([id, l]) => <button key={id} className="ts-chip" data-active={f === id ? "true" : "false"} onClick={() => setF(id)}>{l}</button>)}</div>
        </div>
        <DataTable cols={cols} rows={rows} empty="조건에 맞는 대회가 없습니다" onRow={() => { location.href = "대회 운영.html"; }}
          render={(r, k) => {
            if (k === "name") return <div><div className="ad-cell-strong">{r.name}</div><div className="ad-cell-sub">{r.series} · {r.org}</div></div>;
            if (k === "venue") return <div><div className="ad-cell-strong" style={{ fontWeight: 600 }}>{r.venue}</div><div className="ad-cell-sub">{r.region}</div></div>;
            if (k === "date") return <span className="ad-cell-mono">{r.date}</span>;
            if (k === "teams") return <span className="ad-cell-strong" style={{ fontFamily: "var(--ff-mono)" }}>{r.teams}<span style={{ color: "var(--ink-dim)", fontWeight: 600 }}>팀</span></span>;
            if (k === "status") return <Badge tone={r.statusTone}>{r.status}</Badge>;
            if (k === "act") return <span className="ad-rowact"><button className="ad-iconbtn" title="운영" onClick={(e) => { e.stopPropagation(); location.href = "대회 운영.html"; }}><Icon name="settings-2" size={16} /></button><button className="ad-iconbtn" title="사이트" onClick={(e) => { e.stopPropagation(); location.href = "토너먼트 사이트.html"; }}><Icon name="external-link" size={16} /></button></span>;
          }} />
      </div>
    );
  }

  // ── 단체·주최 ──────────────────────────────────────────
  function Orgs() {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="단체·주최 관리"
          sub="대회를 개최하는 단체와 주최사를 관리합니다."
          actions={<Btn icon="plus" onClick={() => window.adToast && window.adToast("단체 등록 (시연)")}>단체 등록</Btn>} />
        <div className="ad-cardgrid">
          {window.TA_ORGS.map(o => (
            <div key={o.id} className="ad-card">
              <div className="ad-card__head">
                <span className="ad-card__logo" style={{ background: o.color }}>{o.name.slice(0, 1)}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ad-card__title" style={{ display: "flex", alignItems: "center", gap: 6 }}>{o.name}{o.verified && <Icon name="badge-check" size={16} color="var(--primary)" />}</div>
                  <div className="ad-card__sub">{o.type}</div>
                </div>
              </div>
              <div className="ad-card__stats">
                <div><div className="ad-card__stat-v">{o.tournaments}</div><div className="ad-card__stat-l">대회</div></div>
                <div><div className="ad-card__stat-v">{o.admins}</div><div className="ad-card__stat-l">운영진</div></div>
                <div><div className="ad-card__stat-v">{o.members.toLocaleString()}</div><div className="ad-card__stat-l">회원</div></div>
              </div>
              <div className="ad-card__foot">
                <Btn variant="secondary" size="sm" block icon="settings-2" onClick={() => window.adToast && window.adToast(o.name + " 관리 (시연)")}>관리</Btn>
                <Btn variant="ghost" size="sm" icon="users" onClick={() => window.adToast && window.adToast("운영진 관리 (시연)")}>운영진</Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 정규대회 ─────────────────────────────────────────────
  function Series() {
    const cols = [
      { key: "name", label: "정규대회", w: "minmax(0,2fr)" },
      { key: "cadence", label: "주기", w: "100px", align: "center" },
      { key: "editions", label: "회차", w: "84px", align: "center" },
      { key: "next", label: "다음 대회", w: "minmax(0,1fr)" },
      { key: "status", label: "상태", w: "92px", align: "center" },
      { key: "act", label: "", w: "60px", align: "right" },
    ];
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="정규대회"
          sub="정기적으로 반복 개최하는 정규대회를 묶어 관리합니다."
          actions={<Btn icon="plus" onClick={() => window.adToast && window.adToast("정규대회 만들기 (시연)")}>정규대회 만들기</Btn>} />
        <DataTable cols={cols} rows={window.TA_SERIES} onRow={(r) => window.adToast && window.adToast(r.name + " 열기 (시연)")}
          render={(r, k) => {
            if (k === "name") return <div className="ad-cell-flex"><span className="ad-card__logo" style={{ background: r.color, width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>{r.name.slice(0, 1)}</span><div style={{ minWidth: 0 }}><div className="ad-cell-strong">{r.name}</div><div className="ad-cell-sub">{r.org}</div></div></div>;
            if (k === "cadence") return <Badge tone="grey">{r.cadence}</Badge>;
            if (k === "editions") return <span className="ad-cell-mono">{r.editions}회</span>;
            if (k === "next") return <span className="ad-cell-mono" style={{ color: r.next === "미정" ? "var(--ink-dim)" : "var(--ink-soft)" }}>{r.next}</span>;
            if (k === "status") return <span className="ad-statusline"><span className="ad-dot" data-tone={r.active ? "ok" : "mute"} />{r.active ? "운영중" : "중단"}</span>;
            if (k === "act") return <button className="ad-iconbtn" style={{ marginLeft: "auto" }}><Icon name="chevron-right" size={16} /></button>;
          }} />
      </div>
    );
  }

  // ── 템플릿 ─────────────────────────────────────────────
  function Templates() {
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="대회 템플릿"
          sub="자주 쓰는 대회 구성을 템플릿으로 저장해 새 대회를 빠르게 만듭니다."
          actions={<Btn icon="plus" onClick={() => window.adToast && window.adToast("템플릿 만들기 (시연)")}>템플릿 만들기</Btn>} />
        <div className="ad-cardgrid">
          {window.TA_TEMPLATES.map(t => (
            <div key={t.id} className="ad-card">
              <div className="ad-card__head">
                <span className="ad-card__logo" style={{ background: t.color }}><Icon name="layout-template" size={20} color="#fff" /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ad-card__title">{t.name}</div>
                  <div className="ad-card__sub">{t.desc}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge tone="primary">{t.format}</Badge>
                <Badge tone="grey">{t.divisions}종별</Badge>
              </div>
              <div className="ad-card__stats" style={{ alignItems: "center" }}>
                <div><div className="ad-card__stat-v">{t.used}<span style={{ fontSize: 13, color: "var(--ink-mute)", fontWeight: 600 }}>회</span></div><div className="ad-card__stat-l">사용됨</div></div>
              </div>
              <Btn variant="secondary" size="sm" block icon="copy-plus" onClick={() => { location.href = "대회 생성.html"; }}>이 템플릿으로 생성</Btn>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 앱 셸 ──────────────────────────────────────────────
  const NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "list", icon: "trophy", text: "대회 목록", badge: 6 },
    { label: "구성" },
    { id: "orgs", icon: "building-2", text: "단체·주최", badge: 5 },
    { id: "series", icon: "layers", text: "정규대회", badge: 5 },
    { id: "templates", icon: "layout-template", text: "템플릿", badge: 4 },
    { label: "우리 단체" },
    { href: "토너먼트 사이트.html?org=bdr-basketball", icon: "globe", text: "내 공개 사이트", blank: true },
  ];

  window.TournamentAdminApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    const P = { dash: <Dashboard go={go} />, list: <TournamentList />, orgs: <Orgs />, series: <Series />, templates: <Templates /> }[page] || <Dashboard go={go} />;
    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 콘솔" nav={NAV} active={page} onNav={go}
        footAction={<a href="토너먼트 사이트.html?org=bdr-basketball" target="_blank" rel="noopener" className="ts-cancelbtn" style={{ textDecoration: "none" }}><window.Icon name="globe" size={16} /><span>내 공개 사이트 열기</span></a>}
        user={{ initial: "관", name: "BDR 농구문화", role: "대회 운영자" }}>
        {P}
      </window.AdminShell>
    );
  };
})();
