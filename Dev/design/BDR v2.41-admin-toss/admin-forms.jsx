/* global React, window */
// ============================================================
// admin-forms.jsx — 관리자 공용 폼 엔진 (생성 · 수정 · 삭제)
//   ▸ SchemaList 의 행 데이터를 실제로 추가/수정/삭제하는 인메모리 CRUD 시연.
//   ▸ window.AdminForm        : 스키마 기반 모달 폼 (텍스트/숫자/금액/선택/토글/메모/날짜)
//   ▸ window.deriveFormFields : page schema(cols+rows) → 폼 필드 자동 도출 (form 미지정 시)
//   ▸ window.blankRow / applyForm / adConfirm : 행 생성·반영·삭제확인 헬퍼
//   토스 토큰/컴포넌트(Modal·Btn·Icon·Toggle) 그대로 사용. 신규 색상 없음.
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const { Icon, Btn, Modal, Toggle } = window;

  const AV = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];
  const distinct = (arr) => arr.filter((v, i) => v != null && v !== "" && arr.indexOf(v) === i);

  // ── form 필드 자동 도출 (schema.form 없으면 cols+rows 로 추론) ──
  function deriveFormFields(schema) {
    if (schema.form) return schema.form;
    const fields = [];
    let nameDone = false;
    schema.cols.forEach((c) => {
      if (c.type === "actions") return;
      if ((c.type === "title" || c.type === "avatar") && !nameDone) {
        nameDone = true;
        fields.push({ k: "name", label: c.label, type: "text", required: true });
        fields.push({ k: "sub", label: c.label + " 설명", type: "text", placeholder: "부가 설명 (선택)" });
        return;
      }
      if (c.type === "badge") {
        const vals = distinct(schema.rows.map((r) => (r.badge != null ? r.badge : r[c.key])));
        const tones = {};
        schema.rows.forEach((r) => { const v = r.badge != null ? r.badge : r[c.key]; if (v != null) tones[v] = r.tone || "grey"; });
        fields.push({ k: c.key, label: c.label, type: "select", bind: "badge", options: vals, tones });
        return;
      }
      if (c.type === "status") {
        const vals = distinct(schema.rows.map((r) => (r.st != null ? r.st : r[c.key])));
        const tones = {};
        schema.rows.forEach((r) => { const v = r.st != null ? r.st : r[c.key]; if (v != null) tones[v] = r.sttone || "mute"; });
        fields.push({ k: c.key, label: c.label, type: "select", bind: "status", options: vals, tones });
        return;
      }
      fields.push({ k: c.key, label: c.label, type: c.type === "money" ? "money" : "text", mono: c.type === "mono" || c.type === "money" });
    });
    return fields;
  }
  window.deriveFormFields = deriveFormFields;

  // ── 행 → 폼 초기값 ─────────────────────────────────────
  function rowToValues(row, fields) {
    const v = {};
    fields.forEach((f) => {
      if (f.bind === "badge") v[f.k] = row.badge != null ? row.badge : row[f.k];
      else if (f.bind === "status") v[f.k] = row.st != null ? row.st : row[f.k];
      else v[f.k] = row[f.k];
      if (f.type === "toggle") v[f.k] = !!v[f.k];
      if (v[f.k] == null) v[f.k] = f.type === "toggle" ? false : (f.type === "select" && f.options ? f.options[0] : "");
    });
    return v;
  }
  window.rowToValues = rowToValues;
  // ── 빈(신규) 행 값 ─────────────────────────────────────
  function blankValues(fields) {
    const v = {};
    fields.forEach((f) => { v[f.k] = f.type === "toggle" ? !!f.default : (f.type === "select" && f.options ? (f.default || f.options[0]) : (f.default || "")); });
    return v;
  }
  window.blankRow = blankValues;

  // ── 폼 값 → 행 반영 (badge/status 토큰쌍 자동 세팅) ──────
  function applyForm(base, fields, values, needsColor) {
    const row = Object.assign({}, base);
    fields.forEach((f) => {
      const val = values[f.k];
      if (f.bind === "badge") { row.badge = val; row.tone = (f.tones && f.tones[val]) || row.tone || "grey"; }
      else if (f.bind === "status") { row.st = val; row.sttone = (f.tones && f.tones[val]) || row.sttone || "mute"; }
      else row[f.k] = val;
    });
    if (row.id == null) row.id = "n" + Date.now() + Math.floor(Math.random() * 1000);
    if (needsColor && !row.color) row.color = AV[Math.floor(Math.random() * AV.length)];
    return row;
  }
  window.applyForm = applyForm;

  // ── 단일 필드 렌더 ─────────────────────────────────────
  function Field({ f, value, onChange }) {
    if (f.type === "toggle") {
      return (
        <div className="ts-field" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="ts-field__label" style={{ marginBottom: f.hint ? 4 : 0 }}>{f.label}</div>
            {f.hint && <div className="ts-field__hint" style={{ marginTop: 0 }}>{f.hint}</div>}
          </div>
          <Toggle on={!!value} onChange={onChange} />
        </div>
      );
    }
    if (f.type === "select") {
      const opts = f.options || [];
      const seg = opts.length <= 4;
      return (
        <div className="ts-field">
          <label className="ts-field__label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}> *</span>}</label>
          {seg ? (
            <div className="ts-segment" style={{ flexWrap: "wrap", width: "100%" }}>
              {opts.map((o) => (
                <button key={o} type="button" className="ts-segment__btn" data-active={value === o ? "true" : "false"}
                  style={{ flex: "1 1 auto", padding: "10px 12px" }} onClick={() => onChange(o)}>{o}</button>
              ))}
            </div>
          ) : (
            <select className="ts-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
              {opts.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          )}
          {f.hint && <div className="ts-field__hint">{f.hint}</div>}
        </div>
      );
    }
    if (f.type === "textarea") {
      return (
        <div className="ts-field">
          <label className="ts-field__label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}> *</span>}</label>
          <textarea className="ts-input" rows={f.rows || 3} style={{ resize: "vertical", lineHeight: 1.5 }}
            value={value || ""} placeholder={f.placeholder || ""} onChange={(e) => onChange(e.target.value)} />
          {f.hint && <div className="ts-field__hint">{f.hint}</div>}
        </div>
      );
    }
    // text / money / number / date
    const isMoney = f.type === "money";
    return (
      <div className="ts-field">
        <label className="ts-field__label">{f.label}{f.required && <span style={{ color: "var(--danger)" }}> *</span>}</label>
        <div style={{ position: "relative" }}>
          {isMoney && <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "var(--ink-mute)", fontWeight: 700, fontFamily: "var(--ff-mono)" }}>₩</span>}
          <input className="ts-input" type="text"
            inputMode={f.type === "number" ? "numeric" : undefined}
            style={Object.assign({}, isMoney ? { paddingLeft: 30 } : null, f.mono ? { fontFamily: "var(--ff-mono)" } : null)}
            value={value == null ? "" : value} placeholder={f.placeholder || ""}
            onChange={(e) => onChange(e.target.value)} />
        </div>
        {f.hint && <div className="ts-field__hint">{f.hint}</div>}
      </div>
    );
  }

  // ── 스키마 폼 모달 (생성/수정 공용) ────────────────────
  //   mode: 'create' | 'edit' · fields: deriveFormFields 결과
  window.AdminForm = function AdminForm({ open, mode, title, sub, fields, value, onSave, onClose }) {
    const [v, setV] = useState(value || {});
    const [touched, setTouched] = useState(false);
    useEffect(() => { setV(value || {}); setTouched(false); }, [value, open]);
    if (!open) return null;

    const missing = fields.filter((f) => f.required && (v[f.k] == null || String(v[f.k]).trim() === ""));
    const setField = (k, val) => setV((s) => Object.assign({}, s, { [k]: val }));
    const submit = () => { if (missing.length) { setTouched(true); return; } onSave(v); };

    return (
      <Modal open={open} onClose={onClose} title={title} sub={sub} maxWidth={560}
        foot={<>
          <Btn variant="secondary" onClick={onClose}>취소</Btn>
          <Btn icon={mode === "create" ? "plus" : "check"} onClick={submit}>{mode === "create" ? "추가하기" : "변경 저장"}</Btn>
        </>}>
        {touched && missing.length > 0 && (
          <div className="ad-formwarn"><Icon name="alert-circle" size={15} />필수 항목을 입력해주세요 — {missing.map((m) => m.label).join(", ")}</div>
        )}
        <div className="ad-formgrid">
          {fields.map((f) => (
            <div key={f.k} style={{ gridColumn: f.full || f.type === "textarea" || f.type === "toggle" ? "1 / -1" : "auto" }}>
              <Field f={f} value={v[f.k]} onChange={(val) => setField(f.k, val)} />
            </div>
          ))}
        </div>
      </Modal>
    );
  };

  // ── 삭제 확인 모달 ─────────────────────────────────────
  window.AdminConfirm = function AdminConfirm({ open, title, sub, danger, confirmLabel, onConfirm, onClose }) {
    if (!open) return null;
    return (
      <Modal open={open} onClose={onClose} title={title} sub={sub} maxWidth={400}
        foot={<>
          <Btn variant="secondary" onClick={onClose}>취소</Btn>
          <button type="button" className="ts-btn" style={{ background: danger ? "var(--danger)" : "var(--primary)", color: "#fff" }} onClick={onConfirm}>
            <Icon name={danger ? "trash-2" : "check"} size={17} />{confirmLabel || "확인"}
          </button>
        </>} />
    );
  };

  // ── 폼/확인 스타일 1회 주입 ────────────────────────────
  if (!window.__adFormInjected) {
    window.__adFormInjected = true;
    const css = `
.ad-formgrid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
.ad-formgrid .ts-field { margin-bottom: 14px; }
.ad-formwarn { display: flex; align-items: center; gap: 7px; font-size: 13px; font-weight: 600;
  color: var(--danger); background: var(--danger-weak, rgba(240,68,82,.1)); border-radius: 10px;
  padding: 10px 12px; margin-bottom: 16px; }
.ad-rowact .ad-iconbtn[data-tone="danger"]:hover { background: var(--danger-weak, rgba(240,68,82,.12)); color: var(--danger); }
@media (max-width: 560px) { .ad-formgrid { grid-template-columns: 1fr; } }
`;
    const s = document.createElement("style");
    s.id = "ad-form-style";
    s.textContent = css;
    document.head.appendChild(s);
  }
})();
