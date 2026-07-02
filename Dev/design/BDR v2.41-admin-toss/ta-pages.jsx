/* global React, window */
// ============================================================
// ta-pages.jsx — 대회 관리자 페이지들 (대시보드/목록/단체/시리즈/템플릿)
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
  const ORG_FIELDS = [
    { k: "name", label: "단체명", type: "text", required: true, placeholder: "예: BDR 농구문화" },
    { k: "type", label: "단체 유형", type: "select", options: ["정식 주최사", "제휴 단체", "지역 협회", "동호회"] },
    { k: "admins", label: "운영진 수", type: "number", mono: true, placeholder: "예: 6" },
    { k: "tournaments", label: "개최 대회", type: "number", mono: true, placeholder: "예: 12" },
    { k: "members", label: "소속 회원", type: "number", mono: true, placeholder: "예: 1840" },
    { k: "verified", label: "인증 단체", type: "toggle", hint: "사업자·협회 인증을 완료한 단체로 표시합니다." },
  ];
  function Orgs() {
    const [rows, setRows] = useState(window.TA_ORGS);
    const [form, setForm] = useState(null);
    const openCreate = () => setForm({ mode: "create", value: window.blankRow(ORG_FIELDS), row: null });
    const openEdit = (o) => setForm({ mode: "edit", value: window.rowToValues(o, ORG_FIELDS), row: o });
    const same = (a, b) => a === b || (a.id != null && a.id === b.id);
    const save = (v) => {
      if (form.mode === "create") { setRows([window.applyForm({}, ORG_FIELDS, v, true), ...rows]); window.adToast && window.adToast("단체가 등록되었습니다"); }
      else { const nr = window.applyForm(form.row, ORG_FIELDS, v, true); setRows(rows.map(r => same(r, form.row) ? nr : r)); window.adToast && window.adToast((nr.name || "단체") + " 정보가 저장되었습니다"); }
      setForm(null);
    };
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="단체·주최 관리"
          sub="대회를 개최하는 단체와 주최사를 관리합니다."
          actions={<Btn icon="plus" onClick={openCreate}>단체 등록</Btn>} />
        <div className="ad-cardgrid">
          {rows.map(o => (
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
                <div><div className="ad-card__stat-v">{Number(o.members || 0).toLocaleString()}</div><div className="ad-card__stat-l">회원</div></div>
              </div>
              <div className="ad-card__foot">
                <Btn variant="secondary" size="sm" block icon="pencil" onClick={() => openEdit(o)}>정보 수정</Btn>
                <Btn variant="ghost" size="sm" icon="users" onClick={() => window.adToast && window.adToast("운영진 관리 (시연)")}>운영진</Btn>
              </div>
            </div>
          ))}
        </div>
        {form && (
          <window.AdminForm open={!!form} mode={form.mode}
            title={form.mode === "create" ? "단체 등록" : (form.row.name || "단체") + " 수정"}
            sub={form.mode === "create" ? "새 주최 단체를 등록합니다" : "단체 정보를 수정합니다"}
            fields={ORG_FIELDS} value={form.value} onSave={save} onClose={() => setForm(null)} />
        )}
      </div>
    );
  }

  // ── 시리즈 ─────────────────────────────────────────────
  const SERIES_FIELDS = [
    { k: "name", label: "시리즈명", type: "text", required: true, placeholder: "예: BDR 오픈 시리즈" },
    { k: "org", label: "주최 단체", type: "text", placeholder: "예: BDR 농구문화" },
    { k: "cadence", label: "개최 주기", type: "select", options: ["월간", "분기", "시즌", "연간", "비정기"] },
    { k: "editions", label: "누적 회차", type: "number", mono: true, placeholder: "예: 4" },
    { k: "next", label: "다음 대회", type: "text", mono: true, placeholder: "예: 2026.09.14 / 미정" },
    { k: "active", label: "운영중", type: "toggle", hint: "끄면 ‘중단’ 상태로 표시됩니다." },
  ];
  function Series() {
    const [rows, setRows] = useState(window.TA_SERIES);
    const [form, setForm] = useState(null);
    const openCreate = () => setForm({ mode: "create", value: window.blankRow(SERIES_FIELDS), row: null });
    const openEdit = (s) => setForm({ mode: "edit", value: window.rowToValues(s, SERIES_FIELDS), row: s });
    const same = (a, b) => a === b || (a.id != null && a.id === b.id);
    const save = (v) => {
      if (form.mode === "create") { setRows([window.applyForm({}, SERIES_FIELDS, v, true), ...rows]); window.adToast && window.adToast("시리즈가 생성되었습니다"); }
      else { const nr = window.applyForm(form.row, SERIES_FIELDS, v, true); setRows(rows.map(r => same(r, form.row) ? nr : r)); window.adToast && window.adToast((nr.name || "시리즈") + " 정보가 저장되었습니다"); }
      setForm(null);
    };
    const cols = [
      { key: "name", label: "시리즈", w: "minmax(0,2fr)" },
      { key: "cadence", label: "주기", w: "100px", align: "center" },
      { key: "editions", label: "회차", w: "84px", align: "center" },
      { key: "next", label: "다음 대회", w: "minmax(0,1fr)" },
      { key: "status", label: "상태", w: "92px", align: "center" },
      { key: "act", label: "", w: "60px", align: "right" },
    ];
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="시리즈"
          sub="정기적으로 반복 개최하는 대회 시리즈를 묶어 관리합니다."
          actions={<Btn icon="plus" onClick={openCreate}>시리즈 만들기</Btn>} />
        <DataTable cols={cols} rows={rows} onRow={(r) => openEdit(r)}
          render={(r, k) => {
            if (k === "name") return <div className="ad-cell-flex"><span className="ad-card__logo" style={{ background: r.color, width: 38, height: 38, borderRadius: 11, fontSize: 14 }}>{r.name.slice(0, 1)}</span><div style={{ minWidth: 0 }}><div className="ad-cell-strong">{r.name}</div><div className="ad-cell-sub">{r.org}</div></div></div>;
            if (k === "cadence") return <Badge tone="grey">{r.cadence}</Badge>;
            if (k === "editions") return <span className="ad-cell-mono">{r.editions}회</span>;
            if (k === "next") return <span className="ad-cell-mono" style={{ color: r.next === "미정" ? "var(--ink-dim)" : "var(--ink-soft)" }}>{r.next}</span>;
            if (k === "status") return <span className="ad-statusline"><span className="ad-dot" data-tone={r.active ? "ok" : "mute"} />{r.active ? "운영중" : "중단"}</span>;
            if (k === "act") return <span className="ad-rowact"><button className="ad-iconbtn" title="수정" onClick={(e) => { e.stopPropagation(); openEdit(r); }}><Icon name="pencil" size={15} /></button></span>;
          }} />
        {form && (
          <window.AdminForm open={!!form} mode={form.mode}
            title={form.mode === "create" ? "시리즈 만들기" : (form.row.name || "시리즈") + " 수정"}
            sub={form.mode === "create" ? "반복 개최 대회를 묶는 시리즈를 만듭니다" : "시리즈 정보를 수정합니다"}
            fields={SERIES_FIELDS} value={form.value} onSave={save} onClose={() => setForm(null)} />
        )}
      </div>
    );
  }

  // ── 템플릿 ─────────────────────────────────────────────
  const TPL_FIELDS = [
    { k: "name", label: "템플릿명", type: "text", required: true, placeholder: "예: 3x3 오픈 토너먼트" },
    { k: "desc", label: "설명", type: "textarea", rows: 2, placeholder: "예: 조별예선 + 토너먼트 · 4종별 기본" },
    { k: "format", label: "대진 포맷", type: "select", options: ["조별리그+토너먼트", "풀리그", "듀얼토너먼트", "토너먼트"] },
    { k: "divisions", label: "종별 수", type: "number", mono: true, placeholder: "예: 4" },
    { k: "used", label: "사용 횟수", type: "number", mono: true, placeholder: "예: 0" },
  ];
  function Templates() {
    const [rows, setRows] = useState(window.TA_TEMPLATES);
    const [form, setForm] = useState(null);
    const openCreate = () => setForm({ mode: "create", value: window.blankRow(TPL_FIELDS), row: null });
    const openEdit = (t) => setForm({ mode: "edit", value: window.rowToValues(t, TPL_FIELDS), row: t });
    const same = (a, b) => a === b || (a.id != null && a.id === b.id);
    const save = (v) => {
      if (form.mode === "create") { setRows([window.applyForm({}, TPL_FIELDS, v, true), ...rows]); window.adToast && window.adToast("템플릿이 저장되었습니다"); }
      else { const nr = window.applyForm(form.row, TPL_FIELDS, v, true); setRows(rows.map(r => same(r, form.row) ? nr : r)); window.adToast && window.adToast((nr.name || "템플릿") + " 변경사항이 저장되었습니다"); }
      setForm(null);
    };
    return (
      <div>
        <PageHead eyebrow="대회 관리자" title="대회 템플릿"
          sub="자주 쓰는 대회 구성을 템플릿으로 저장해 새 대회를 빠르게 만듭니다."
          actions={<Btn icon="plus" onClick={openCreate}>템플릿 만들기</Btn>} />
        <div className="ad-cardgrid">
          {rows.map(t => (
            <div key={t.id} className="ad-card">
              <div className="ad-card__head">
                <span className="ad-card__logo" style={{ background: t.color }}><Icon name="layout-template" size={20} color="#fff" /></span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="ad-card__title">{t.name}</div>
                  <div className="ad-card__sub">{t.desc}</div>
                </div>
                <button className="ad-iconbtn" title="수정" onClick={() => openEdit(t)}><Icon name="pencil" size={15} /></button>
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
        {form && (
          <window.AdminForm open={!!form} mode={form.mode}
            title={form.mode === "create" ? "템플릿 만들기" : (form.row.name || "템플릿") + " 수정"}
            sub={form.mode === "create" ? "자주 쓰는 대회 구성을 템플릿으로 저장합니다" : "템플릿 구성을 수정합니다"}
            fields={TPL_FIELDS} value={form.value} onSave={save} onClose={() => setForm(null)} />
        )}
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
    { id: "series", icon: "layers", text: "시리즈", badge: 5 },
    { id: "templates", icon: "layout-template", text: "템플릿", badge: 4 },
  ];

  window.TournamentAdminApp = function () {
    const [page, setPage] = useState((window.location.hash.replace("#", "")) || "dash");
    const go = (p) => { setPage(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };
    const P = { dash: <Dashboard go={go} />, list: <TournamentList />, orgs: <Orgs />, series: <Series />, templates: <Templates /> }[page] || <Dashboard go={go} />;
    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 관리자" nav={NAV} active={page} onNav={go}
        user={{ initial: "관", name: "BDR 농구문화", role: "대회 운영자" }}>
        {P}
      </window.AdminShell>
    );
  };
})();
