/* global React, window */
// ============================================================
// admin-blocks.jsx — 관리자 공용 페이지 블록 (재사용)
//   SchemaList(검색+테이블) / AdBarPanel / AdListPanel / AdSettings / renderSchemaCell
//   백오피스·협력업체·심판 관리자 셸이 공통 사용.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Toggle, PageHead, KpiGrid, DataTable } = window;

  function toneColor(t) {
    return { ok: "var(--ok)", primary: "var(--primary)", warn: "var(--warn)", violet: "#6D5AE6", danger: "var(--danger)" }[t] || "var(--ink-soft)";
  }
  window.adToneColor = toneColor;

  // ── 행 → 상세 payload 빌드 ─────────────────────────────
  function plainVal(r, c) {
    const v = r[c.key];
    if (c.type === "badge") return r.badge != null ? r.badge : v;
    if (c.type === "status") return r.st || v;
    if (c.type === "title" || c.type === "avatar") return r.sub ? r.name + " · " + r.sub : r.name;
    return v;
  }
  function openDetail(r, schema, handlers) {
    const fields = schema.cols.filter(c => c.type !== "actions" && c.type !== "title" && c.type !== "avatar")
      .map(c => ({ label: c.label, value: plainVal(r, c) }));
    window.adDetail && window.adDetail({
      eyebrow: schema.head, title: r.name, sub: r.sub,
      badge: r.badge != null ? r.badge : (r.st || null), tone: r.tone || r.sttone,
      fields,
      onEdit: handlers && handlers.onEdit,
      onDelete: handlers && handlers.onDelete,
    });
  }
  window.adOpenDetail = openDetail;

  // ── 스키마 테이블 셀 렌더러 ────────────────────────────
  function renderSchemaCell(r, col, handlers) {
    const h = typeof handlers === "function" ? { onView: handlers } : (handlers || {});
    const v = r[col.key];
    switch (col.type) {
      case "title":
        return <div><div className="ad-cell-strong">{r.name}</div>{r.sub && <div className="ad-cell-sub">{r.sub}</div>}</div>;
      case "avatar":
        return <div className="ad-cell-flex"><span className="ad-avatar-sm" style={{ background: r.color }}>{r.name.slice(0, 1)}</span><div style={{ minWidth: 0 }}><div className="ad-cell-strong">{r.name}</div>{r.sub && <div className="ad-cell-sub">{r.sub}</div>}</div></div>;
      case "badge":
        return <Badge tone={r.tone || "grey"}>{r.badge != null ? r.badge : v}</Badge>;
      case "status":
        return <span className="ad-statusline"><span className="ad-dot" data-tone={r.sttone || "mute"} />{r.st || v}</span>;
      case "mono":
        return <span className="ad-cell-mono">{v}</span>;
      case "muted":
        return <span className="ad-cell-muted">{v}</span>;
      case "money":
        return <span className="ad-cell-mono" style={{ color: "var(--ink)" }}>{v}</span>;
      case "actions":
        return (
          <span className="ad-rowact">
            <button className="ad-iconbtn" title="상세 보기" onClick={(e) => { e.stopPropagation(); h.onView && h.onView(); }}><Icon name="eye" size={15} /></button>
            {h.editable && <button className="ad-iconbtn" title="수정" onClick={(e) => { e.stopPropagation(); h.onEdit && h.onEdit(); }}><Icon name="pencil" size={15} /></button>}
            {h.editable && <button className="ad-iconbtn" data-tone="danger" title="삭제" onClick={(e) => { e.stopPropagation(); h.onDelete && h.onDelete(); }}><Icon name="trash-2" size={15} /></button>}
          </span>
        );
      default:
        return <span className="ad-cell-muted">{v}</span>;
    }
  }
  window.renderSchemaCell = renderSchemaCell;

  // ── 스키마 기반 리스트 페이지 ──────────────────────────
  //   schema.rowHref: 문자열 또는 (row)=>url 이면 행 클릭 시 해당 페이지로 이동.
  //                   없으면 읽기전용 상세 드로어를 엽니다.
  //   schema.addHref: 추가 버튼이 토스트 대신 해당 페이지로 이동.
  window.SchemaList = function SchemaList({ schema, eyebrow }) {
    const [allRows, setAllRows] = useState(schema.rows);
    const [q, setQ] = useState("");
    const [form, setForm] = useState(null);       // { mode, value, row }
    const [confirm, setConfirm] = useState(null); // { row }
    // 스키마 전환(페이지 이동) 시 행 상태 재설정
    React.useEffect(() => { setAllRows(schema.rows); setQ(""); setForm(null); setConfirm(null); }, [schema]);

    const fields = window.deriveFormFields(schema);
    const needsColor = schema.cols.some(c => c.type === "avatar");
    const hasActions = schema.cols.some(c => c.type === "actions");
    const editable = !schema.rowHref && !schema.readOnly && (!!schema.addLabel || hasActions);

    const rows = allRows.filter(r => !q || (r.name && r.name.includes(q)) || (r.sub && r.sub.includes(q)));

    const openCreate = () => setForm({ mode: "create", value: window.blankRow(fields), row: null });
    const openEdit = (r) => setForm({ mode: "edit", value: window.rowToValues(r, fields), row: r });
    const askDelete = (r) => setConfirm({ row: r });
    const sameRow = (a, b) => a === b || (a.id != null && a.id === b.id);

    const save = (values) => {
      if (form.mode === "create") {
        const nr = window.applyForm({}, fields, values, needsColor);
        setAllRows([nr, ...allRows]);
        window.adToast && window.adToast(schema.head + " · 새 항목이 추가되었습니다");
      } else {
        const nr = window.applyForm(form.row, fields, values, needsColor);
        setAllRows(allRows.map(r => sameRow(r, form.row) ? nr : r));
        window.adToast && window.adToast((nr.name || "항목") + " · 변경사항이 저장되었습니다");
      }
      setForm(null);
    };
    const doDelete = () => {
      const r = confirm.row;
      setAllRows(allRows.filter(x => !sameRow(x, r)));
      window.adToast && window.adToast((r.name || "항목") + " · 삭제되었습니다");
      setConfirm(null);
    };

    const rowHandlers = (r) => ({
      onView: () => openDetail(r, schema, editable ? { onEdit: () => openEdit(r), onDelete: () => askDelete(r) } : null),
      onEdit: () => openEdit(r),
      onDelete: () => askDelete(r),
      editable,
    });
    const goRow = schema.rowHref
      ? (r) => { window.location.href = typeof schema.rowHref === "function" ? schema.rowHref(r) : schema.rowHref; }
      : (r) => openDetail(r, schema, editable ? { onEdit: () => openEdit(r), onDelete: () => askDelete(r) } : null);

    return (
      <div>
        <PageHead eyebrow={eyebrow || ""} title={schema.head} sub={schema.sub}
          actions={<>
            <Btn variant="secondary" icon="download" size="sm" onClick={() => window.adToast && window.adToast(schema.head + " 내보내기 (시연)")}>내보내기</Btn>
            {schema.addLabel && <Btn icon="plus" onClick={() => { if (schema.addHref) { window.location.href = schema.addHref; } else { openCreate(); } }}>{schema.addLabel}</Btn>}
          </>} />
        <div className="ad-toolbar">
          <div className="ad-search"><Icon name="search" size={18} /><input value={q} onChange={e => setQ(e.target.value)} placeholder={schema.head + " 검색"} /></div>
          <Btn variant="secondary" icon="sliders-horizontal" size="sm" onClick={() => window.adToast && window.adToast("필터 (시연)")}>필터</Btn>
        </div>
        <DataTable cols={schema.cols} rows={rows} onRow={goRow}
          render={(r, k) => renderSchemaCell(r, schema.cols.find(c => c.key === k), rowHandlers(r))}
          empty={q ? "검색 결과가 없습니다" : "데이터가 없습니다"} />

        {form && (
          <window.AdminForm open={!!form} mode={form.mode}
            title={form.mode === "create" ? (schema.addLabel || schema.head + " 추가") : (form.row.name || schema.head) + " 수정"}
            sub={form.mode === "create" ? schema.head + "에 새 항목을 추가합니다" : "항목 정보를 수정합니다"}
            fields={fields} value={form.value} onSave={save} onClose={() => setForm(null)} />
        )}
        {confirm && (
          <window.AdminConfirm open={!!confirm} danger confirmLabel="삭제"
            title="항목을 삭제할까요?"
            sub={(confirm.row.name || "이 항목") + " 을(를) 삭제합니다. 이 작업은 시연에서 되돌릴 수 없습니다."}
            onConfirm={doDelete} onClose={() => setConfirm(null)} />
        )}
      </div>
    );
  };

  // ── 막대 차트 패널 ─────────────────────────────────────
  window.AdBarPanel = function AdBarPanel({ title, badge, badgeTone, data }) {
    const max = Math.max(...data.map(c => c.v));
    return (
      <div className="ad-panel">
        <div className="ad-panel__head"><div className="ad-panel__title">{title}</div>{badge && <Badge tone={badgeTone || "primary"}>{badge}</Badge>}</div>
        <div className="ad-bars">
          {data.map(c => (
            <div key={c.m} className="ad-bar">
              <div className="ad-bar__col" data-soft={c.soft ? "true" : "false"} style={{ height: (c.v / max * 130) + "px" }} />
              <div className="ad-bar__lbl">{c.m}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── 리스트 패널 (처리대기 / 활동) ──────────────────────
  window.AdListPanel = function AdListPanel({ title, badge, badgeTone, items, bar }) {
    return (
      <div className="ad-panel">
        <div className="ad-panel__head"><div className="ad-panel__title">{title}</div>{badge && <Badge tone={badgeTone || "warn"}>{badge}</Badge>}</div>
        <div className="ad-list">
          {items.map(a => (
            <div key={a.id} className="ad-listrow">
              <span className="ad-listrow__icon" style={{ background: bar ? (a.color + "1A") : "var(--grey-100)" }}><Icon name={a.icon} size={17} color={bar ? a.color : toneColor(a.tone)} /></span>
              <div className="ad-listrow__body">
                <div className="ad-listrow__t">{a.t}</div>
                {bar
                  ? <div style={{ height: 6, borderRadius: 3, background: "var(--grey-100)", marginTop: 6, overflow: "hidden" }}><div style={{ height: "100%", width: a.v, background: a.color, borderRadius: 3 }} /></div>
                  : (a.s && <div className="ad-listrow__s">{a.s}</div>)}
              </div>
              <span className="ad-listrow__meta" style={bar ? { fontWeight: 800, color: "var(--ink)" } : null}>{bar ? a.v : a.time}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── 설정 페이지 ────────────────────────────────────────
  window.AdSettings = function AdSettings({ eyebrow, title, sub, groups }) {
    const [st, setSt] = useState(() => {
      const m = {}; groups.forEach(g => g.items.forEach(i => { if (i.type === "toggle") m[i.k] = i.on; })); return m;
    });
    return (
      <div>
        <PageHead eyebrow={eyebrow || ""} title={title} sub={sub} />
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
          {groups.map(g => (
            <div key={g.group} className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 14 }}>{g.group}</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {g.items.map((it, i) => (
                  <div key={it.k} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderTop: i ? "1px solid var(--border)" : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>{it.label}</div>
                      <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 3 }}>{it.desc}</div>
                    </div>
                    {it.type === "toggle"
                      ? <Toggle on={st[it.k]} onChange={v => setSt(s => ({ ...s, [it.k]: v }))} />
                      : <span style={{ fontSize: 14.5, fontWeight: 700, color: "var(--primary)", fontFamily: "var(--ff-mono)", whiteSpace: "nowrap" }}>{it.value}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div style={{ display: "flex", gap: 10 }}>
            <Btn icon="check" onClick={() => window.adToast && window.adToast("설정이 저장되었습니다 (시연)")}>변경사항 저장</Btn>
            <Btn variant="secondary" onClick={() => window.adToast && window.adToast("변경 취소")}>취소</Btn>
          </div>
        </div>
      </div>
    );
  };
})();
