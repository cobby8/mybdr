/* global React, window */
// ============================================================
// panels-ops.jsx — recorders / site / admins + 생성 마법사(schedule/game)
//   Toss 키트 + ts-*/ct-* 클래스. mock 동작. function-lock-B1.md F~H 준수.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Modal, Toggle, Check } = window;
  const WS = window.WS;

  function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => { setMsg(m); window.clearTimeout(window.__tw_o); window.__tw_o = window.setTimeout(() => setMsg(null), 2400); };
    return [show, msg ? <div className="ts-toast"><Icon name="check" size={16} />{msg}</div> : null];
  }

  // ── F. RECORDERS ────────────────────────────────────────
  window.RecordersPanel = function RecordersPanel() {
    const [recs, setRecs] = useState(WS.recorders);
    const [email, setEmail] = useState("");
    const [matches, setMatches] = useState(WS.matches.map(m => ({ ...m, recorder: null })));
    const [show, toast] = useToast();
    const active = recs.filter(r => r.active);
    const unassigned = matches.filter(m => !m.recorder).length;
    const add = () => { if (!email.trim()) return; setRecs(r => [...r, { id: "r" + Date.now(), uid: "u" + Date.now(), name: email.split("@")[0], email: email.trim(), active: true }]); setEmail(""); show("기록원 추가(시연)"); };
    const nameOf = (uid) => active.find(r => r.uid === uid)?.name ?? "미배정";

    return (
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 6 }}>기록원 추가</h3>
          <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 10 }}>mybdr 회원 이메일로 기록원을 지정합니다. bdr_stat 앱으로 실시간 기록 가능.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input className="ts-input" type="email" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => { if (!e.nativeEvent.isComposing && e.key === "Enter") add(); }} />
            <Btn onClick={add} {...(email.trim() ? {} : { disabled: true })}>추가</Btn>
          </div>
        </div>

        <div className="ts-card ts-card--flat">
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>현재 기록원 ({active.length}명)</h3>
          {active.length === 0 ? <p style={{ fontSize: 13, color: "var(--ink-mute)" }}>등록된 기록원이 없습니다.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {active.map(r => (
                <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "var(--grey-50)", borderRadius: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}><span className="ts-avatar" style={{ width: 32, height: 32, fontSize: 13 }}>{r.name[0]}</span><div><p style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</p><p style={{ fontSize: 12, color: "var(--ink-mute)" }}>{r.email}</p></div></div>
                  <button style={{ border: 0, background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => { setRecs(rs => rs.map(x => x.id === r.id ? { ...x, active: false } : x)); show("제거(시연)"); }}>제거</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ts-card ts-card--flat">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
            <h3 style={{ fontSize: 14 }}>경기별 기록자 배정</h3>
            <Btn variant="secondary" size="sm" onClick={() => { setMatches(ms => ms.map((m, i) => ({ ...m, recorder: active[i % active.length]?.uid ?? null }))); show("자동 배정(시연)"); }} {...(active.length && unassigned ? {} : { disabled: true })}>자동 배정</Btn>
          </div>
          <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 10 }}>위 풀의 기록원을 각 경기에 지정합니다.{unassigned ? ` 미배정 ${unassigned}경기.` : ""}</p>
          {active.length === 0 ? <p style={{ fontSize: 13, color: "var(--ink-mute)" }}>먼저 기록원 풀에 인원을 추가하세요.</p> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {matches.map(m => (
                <div key={m.id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 8, padding: 12, background: "var(--grey-50)", borderRadius: 14 }}>
                  <div style={{ minWidth: 0 }}><p style={{ fontSize: 14, fontWeight: 600 }}>{m.roundName} · #{m.num}</p><p style={{ fontSize: 12, color: "var(--ink-mute)" }}>{m.home} 대 {m.away} · 배정: <span style={m.recorder ? { color: "var(--primary)" } : {}}>{nameOf(m.recorder)}</span></p></div>
                  <select className="ts-select" style={{ width: 180 }} value={m.recorder ?? ""} onChange={e => { setMatches(ms => ms.map(x => x.id === m.id ? { ...x, recorder: e.target.value || null } : x)); }}>
                    <option value="">(미배정)</option>
                    {active.map(r => <option key={r.uid} value={r.uid}>{r.name}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
        {toast}
      </div>
    );
  };

  // ── G. SITE (3-step 위자드) ─────────────────────────────
  window.SitePanel = function SitePanel() {
    const [step, setStep] = useState(1);
    const [tpl, setTpl] = useState(WS.site.template);
    const [color, setColor] = useState(WS.site.color);
    const [sub, setSub] = useState(WS.site.subdomain);
    const [published, setPublished] = useState(WS.site.published);
    const [show, toast] = useToast();
    const T = WS.siteTemplates;

    if (published) {
      return (
        <div>
          <div className="ts-card ts-card--flat" style={{ borderColor: "var(--ok)", marginBottom: 14 }}>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div><p style={{ fontSize: 13, fontWeight: 700, color: "var(--ok)" }}>● 사이트 공개 중</p><p style={{ fontFamily: "var(--ff-mono)", fontWeight: 700, marginTop: 2 }}>{sub}.mybdr.kr</p></div>
              <div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" size="sm" iconRight="arrow-up-right" onClick={() => { window.location.href = "토너먼트 사이트.html"; }}>방문하기</Btn><Btn variant="danger" size="sm" onClick={() => { setPublished(false); show("비공개 전환(시연)"); }}>비공개 전환</Btn></div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
            {[["palette", "템플릿 변경", T.find(t => t.slug === tpl)?.name], ["circle", "색상 변경", color], ["file-text", "공지 페이지", "공지사항 작성"]].map(([ic, t, d]) => (
              <button key={t} className="ts-card ts-card--tight" style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }} onClick={() => setStep(t.includes("템플릿") ? 1 : t.includes("색상") ? 2 : 0)}>
                <Icon name={ic} size={22} color="var(--primary)" /><p style={{ fontWeight: 700, marginTop: 8 }}>{t}</p><p style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>{d}</p>
              </button>
            ))}
          </div>
          {toast}
        </div>
      );
    }

    return (
      <div>
        <window.StepDots step={step - 1} total={3} />
        <div style={{ display: "flex", gap: 16, marginBottom: 20, fontSize: 13 }}>
          {["템플릿", "색상", "발행"].map((l, i) => <span key={l} style={{ fontWeight: step === i + 1 ? 700 : 500, color: step === i + 1 ? "var(--ink)" : "var(--ink-mute)" }}>{i + 1}. {l}</span>)}
        </div>

        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>템플릿 선택</h3>
            <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 14 }}>대회 사이트의 전체 스타일. 언제든 변경 가능.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12 }}>
              {T.map(t => (
                <button key={t.slug} onClick={() => setTpl(t.slug)} style={{ textAlign: "left", padding: 12, borderRadius: 16, cursor: "pointer", background: "#fff", border: tpl === t.slug ? "2px solid var(--primary)" : "2px solid var(--border)" }}>
                  <Mock t={t} accent={color} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}><b>{t.name}</b>{tpl === t.slug && <span style={{ fontSize: 12, color: "var(--ok)", fontWeight: 700 }}>선택됨 ✓</span>}</div>
                  <p style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 2 }}>{t.desc}</p>
                </button>
              ))}
            </div>
            <div style={{ textAlign: "right", marginTop: 18 }}><Btn onClick={() => setStep(2)}>다음: 색상 선택 →</Btn></div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>대표 색상 선택</h3>
            <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 14 }}>사이트 네비게이션과 강조 색상.</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
              {WS.colorPresets.map(c => (
                <button key={c.hex} onClick={() => setColor(c.hex)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, border: 0, background: "transparent", cursor: "pointer" }}>
                  <span style={{ width: 56, height: 56, borderRadius: "50%", background: c.hex, boxShadow: "var(--sh-sm)", outline: color === c.hex ? "3px solid var(--primary)" : "none", outlineOffset: 3, display: "grid", placeItems: "center", color: "#fff", fontWeight: 800 }}>{color === c.hex ? "✓" : ""}</span>
                  <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{c.name}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18 }}><Btn variant="ghost" onClick={() => setStep(1)}>← 이전</Btn><Btn onClick={() => setStep(3)}>다음: 주소 설정 →</Btn></div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 16, marginBottom: 4 }}>주소 설정 및 발행</h3>
            <p style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 14 }}>URL 설정 후 공개하거나 임시 저장.</p>
            <label className="ts-field"><span className="ts-field__label">사이트 주소 *</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><input className="ts-input" value={sub} onChange={e => setSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="my-tournament" /><span style={{ fontSize: 14, color: "var(--ink-mute)", whiteSpace: "nowrap" }}>.mybdr.kr</span></div>
              {sub && <span className="ts-field__hint">https://<b style={{ color: "var(--primary)" }}>{sub}</b>.mybdr.kr</span>}
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 10, marginTop: 16 }}>
              <Btn variant="ghost" onClick={() => setStep(2)}>← 이전</Btn>
              <div style={{ display: "flex", gap: 8 }}><Btn variant="secondary" onClick={() => show("임시 저장(시연)")} {...(sub.trim() ? {} : { disabled: true })}>임시 저장</Btn><Btn onClick={() => { setPublished(true); show("공개(시연)"); }} {...(sub.trim() ? {} : { disabled: true })}>🚀 공개하기</Btn></div>
            </div>
          </div>
        )}
        {toast}
      </div>
    );
  };
  function Mock({ t, accent }) {
    const nav = t.slug === "minimal-white" ? "#FFFFFF" : accent;
    const navTx = t.slug === "minimal-white" ? accent : "#FFFFFF";
    return (
      <div style={{ borderRadius: 10, overflow: "hidden", background: t.bg, height: 110 }}>
        <div style={{ display: "flex", height: 24, alignItems: "center", gap: 4, padding: "0 8px", background: nav }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: navTx, opacity: .6 }} /><span style={{ width: 30, height: 5, borderRadius: 9, background: navTx, opacity: .8 }} /><span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>{[1, 2, 3].map(i => <span key={i} style={{ width: 14, height: 5, borderRadius: 9, background: navTx, opacity: .5 }} />)}</span>
        </div>
        <div style={{ margin: "8px", height: 18, borderRadius: 8, background: accent, opacity: .15, display: "grid", placeItems: "center" }}><span style={{ width: 60, height: 5, borderRadius: 9, background: accent, opacity: .7 }} /></div>
        <div style={{ margin: "0 8px", display: "flex", flexDirection: "column", gap: 5 }}>{[80, 60, 45].map((w, i) => <span key={i} style={{ height: 7, borderRadius: 9, background: t.cardBg, width: w + "%" }} />)}</div>
      </div>
    );
  }

  // ── ADMINS ──────────────────────────────────────────────
  window.AdminsPanel = function AdminsPanel() {
    const [admins, setAdmins] = useState(WS.admins);
    const [email, setEmail] = useState(""); const [role, setRole] = useState("admin");
    const [show, toast] = useToast();
    const add = () => { if (!email.trim()) return; setAdmins(a => [...a, { id: "a" + Date.now(), name: email.split("@")[0], email: email.trim(), role }]); setEmail(""); show("운영진 추가(시연)"); };
    return (
      <div>
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <h3 style={{ fontSize: 14, marginBottom: 10 }}>운영진 추가</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <input className="ts-input" style={{ flex: "1 1 200px" }} type="email" placeholder="이메일 주소" value={email} onChange={e => setEmail(e.target.value)} />
            <select className="ts-select" style={{ width: "auto" }} value={role} onChange={e => setRole(e.target.value)}><option value="admin">관리자</option><option value="staff">스태프</option><option value="scorer">기록원</option></select>
            <Btn onClick={add} {...(email.trim() ? {} : { disabled: true })}>추가</Btn>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {admins.map(a => (
            <div key={a.id} className="ts-card ts-card--tight" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}><span className="ts-avatar" style={{ background: "var(--primary-weak)", color: "var(--primary)" }}>{a.name[0].toUpperCase()}</span><div><p style={{ fontWeight: 600 }}>{a.name}</p><p style={{ fontSize: 12, color: "var(--ink-mute)" }}>{a.email}</p></div></div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}><Badge tone="grey">{window.ROLE_LABEL[a.role]}</Badge>{a.role !== "owner" && <button style={{ border: 0, background: "transparent", color: "var(--danger)", fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => { setAdmins(x => x.filter(y => y.id !== a.id)); show("제거(시연)"); }}>제거</button>}</div>
            </div>
          ))}
        </div>
        {toast}
      </div>
    );
  };

  // ── H. 마법사: Stepper / SegSm ──────────────────────────
  function Stepper({ value, unit, min, max, onChange }) {
    return (<div className="ct-stepper">
      <button disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}><Icon name="minus" size={16} /></button>
      <span className="ct-stepper__val">{value}{unit && <span className="u">{unit}</span>}</span>
      <button disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}><Icon name="plus" size={16} /></button>
    </div>);
  }
  function SegSm({ options, index, onSelect }) {
    return <div className="ct-segsm">{options.map((o, i) => <button key={o} data-active={i === index} onClick={() => onSelect(i)}>{o}</button>)}</div>;
  }
  window.TW_Stepper = Stepper; window.TW_SegSm = SegSm;

  // ── H1. 일정·장소 (schedule-venue) ─────────────────────
  window.ScheduleVenue = function ScheduleVenue({ form, patch }) {
    const [calOpen, setCalOpen] = useState(false);
    const courts = form.venues.flatMap(v => v.courtCount <= 1 ? [{ id: v.id + "_c0", full: v.name }] : Array.from({ length: v.courtCount }, (_, i) => ({ id: `${v.id}_c${i}`, full: `${v.name} ${v.naming === "alpha" ? String.fromCharCode(65 + i) : i + 1}코트` })));
    const fmtDate = (s) => { const d = new Date(s + "T00:00:00"); return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${["일", "월", "화", "수", "목", "금", "토"][d.getDay()]})`; };
    const setVenue = (id, p) => patch("venues", form.venues.map(v => v.id === id ? { ...v, ...p } : v));
    const removeVenue = (id) => patch("venues", form.venues.filter(v => v.id !== id));
    const toggleCourt = (did, cid) => patch("dates", form.dates.map(d => d.id === did ? { ...d, courtIds: d.courtIds.includes(cid) ? d.courtIds.filter(x => x !== cid) : [...d.courtIds, cid] } : d));
    return (
      <div className="ct-embedded-block">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}><span className="ct-headicon"><Icon name="calendar-days" size={18} /></span><span style={{ fontSize: 15, fontWeight: 800 }}>대회 일정 · 장소</span></div>
        <div className="ts-field">
          <span className="ts-field__label">장소 · 코트 *</span>
          <VenueSearch onAdd={(name) => patch("venues", [...form.venues, { id: "v" + Date.now(), name, region: "", courtCount: 1, naming: "num" }])} />
          {form.venues.length === 0 ? <div className="ct-emptybox"><Icon name="map-pin-off" size={22} /><span>등록된 장소가 없습니다</span></div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{form.venues.map(v => (
              <div key={v.id} className="ct-venuerow">
                <div className="ct-venuerow__top"><Icon name="map-pin" size={15} color="var(--primary)" /><span className="ct-venuerow__nm">{v.name}</span>{v.region && <span className="ct-venuerow__rg">{v.region}</span>}<button className="ct-iconbtn" style={{ marginLeft: "auto" }} onClick={() => removeVenue(v.id)}><Icon name="x" size={15} /></button></div>
                <div className="ct-venuerow__ctrl"><span className="ct-venuerow__lbl">코트 수</span><Stepper value={v.courtCount} unit="개" min={1} max={8} onChange={n => setVenue(v.id, { courtCount: n })} />
                  {v.courtCount >= 2 && <><span className="ct-venuerow__lbl">명칭</span><SegSm options={["숫자", "알파벳"]} index={v.naming === "alpha" ? 1 : 0} onSelect={i => setVenue(v.id, { naming: i ? "alpha" : "num" })} /></>}
                </div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="ts-field">
          <span className="ts-field__label">대회 일정 *</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>{form.dates.map((dt, i) => (
            <div key={dt.id} className="ct-dateblock">
              <div className="ct-dateblock__head"><span className="ct-daterow__idx">{i + 1}일차</span><span className="ct-daterow__label">{fmtDate(dt.date)}</span><span className="ct-dateblock__n">{dt.courtIds.length}코트</span><button className="ct-iconbtn" onClick={() => patch("dates", form.dates.filter(x => x.id !== dt.id))}><Icon name="x" size={15} /></button></div>
              {courts.length > 0 && <div className="ct-courtpick">{courts.map(c => <button key={c.id} className="ct-courtpick__chip" data-on={dt.courtIds.includes(c.id)} onClick={() => toggleCourt(dt.id, c.id)}>{dt.courtIds.includes(c.id) && <Icon name="check" size={12} />}{c.full}</button>)}</div>}
            </div>
          ))}</div>
          <button className="ct-adddate" onClick={() => setCalOpen(true)}><Icon name="calendar-plus" size={16} />일정 선택{form.dates.length ? ` · ${form.dates.length}일` : ""}</button>
        </div>
        {calOpen && <CalendarModal selected={form.dates.map(d => d.date)} onClose={() => setCalOpen(false)} onConfirm={(ds) => { patch("dates", ds.sort().map(date => form.dates.find(x => x.date === date) || { id: "d" + date, date, courtIds: [] })); setCalOpen(false); }} />}
      </div>
    );
  };
  function VenueSearch({ onAdd }) {
    const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
    const DB = ["장충체육관", "잠실학생체육관", "올림픽공원 핸드볼경기장", "목동 실내체육관", "강남구민체육관", "서초구민체육관"];
    const res = q.trim() ? DB.filter(d => d.includes(q.trim())) : [];
    return (
      <div style={{ position: "relative", marginBottom: 10 }}>
        <div className="ts-input" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px" }}>
          <Icon name="search" size={18} color="var(--ink-dim)" />
          <input value={q} placeholder="경기장명·주소 검색" onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 160)} onKeyDown={e => { if (!e.nativeEvent.isComposing && e.key === "Enter" && q.trim()) { onAdd(q.trim()); setQ(""); } }} style={{ flex: 1, border: 0, background: "transparent", outline: "none", fontSize: 15, fontFamily: "var(--ff)" }} />
        </div>
        {open && (res.length > 0 || q.trim()) && (
          <div className="ts-card" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 5, marginTop: 4, padding: 6 }}>
            {res.map(v => <button key={v} className="ct-vsearch__opt" onMouseDown={e => e.preventDefault()} onClick={() => { onAdd(v); setQ(""); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", border: 0, background: "transparent", padding: "9px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "var(--ff)", fontSize: 14 }}><Icon name="map-pin" size={16} color="var(--primary)" />{v}</button>)}
            {q.trim() && <button onMouseDown={e => e.preventDefault()} onClick={() => { onAdd(q.trim()); setQ(""); setOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", border: 0, background: "transparent", padding: "9px 10px", borderRadius: 10, cursor: "pointer", fontFamily: "var(--ff)", fontSize: 14, color: "var(--primary)", fontWeight: 700 }}><Icon name="plus" size={16} />"{q.trim()}" 직접 추가</button>}
          </div>
        )}
      </div>
    );
  }
  function CalendarModal({ selected, onClose, onConfirm }) {
    const [sel, setSel] = useState(new Set(selected));
    const base = selected[0] ? new Date(selected[0] + "T00:00:00") : new Date();
    const [cur, setCur] = useState({ y: base.getFullYear(), m: base.getMonth() });
    const WK = ["일", "월", "화", "수", "목", "금", "토"];
    const dkey = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const startWd = new Date(cur.y, cur.m, 1).getDay(); const days = new Date(cur.y, cur.m + 1, 0).getDate();
    const cells = []; for (let i = 0; i < startWd; i++) cells.push(null); for (let d = 1; d <= days; d++) cells.push(d);
    const toggle = (d) => { const k = dkey(cur.y, cur.m, d); const ns = new Set(sel); ns.has(k) ? ns.delete(k) : ns.add(k); setSel(ns); };
    const move = (dl) => { let m = cur.m + dl, y = cur.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } setCur({ y, m }); };
    return (
      <Modal open onClose={onClose} maxWidth={440} title="대회 일정 선택" sub="여러 날 선택 가능. 다시 누르면 해제."
        foot={<><Btn variant="secondary" block onClick={onClose}>취소</Btn><Btn block icon="check" onClick={() => onConfirm([...sel])}>선택 완료 ({sel.size}일)</Btn></>}>
        <div className="ct-cal__nav"><button onClick={() => move(-1)}><Icon name="chevron-left" size={18} /></button><span className="ct-cal__title">{cur.y}년 {cur.m + 1}월</span><button onClick={() => move(1)}><Icon name="chevron-right" size={18} /></button></div>
        <div className="ct-cal__wk">{WK.map(w => <span key={w}>{w}</span>)}</div>
        <div className="ct-cal__grid">{cells.map((d, i) => d === null ? <span key={"e" + i} className="ct-cal__pad" /> : <button key={d} className="ct-cal__day" data-on={sel.has(dkey(cur.y, cur.m, d))} onClick={() => toggle(d)}>{d}</button>)}</div>
        {sel.size > 0 && <div className="ct-cal__count"><Icon name="calendar-check" size={14} />{sel.size}일 선택됨</div>}
      </Modal>
    );
  }

  // ── H2. 경기 규정 (game-settings) ───────────────────────
  window.GameSettings = function GameSettings({ rules, patch }) {
    const [uniOpen, setUniOpen] = useState(null);
    const set = (k, v) => patch({ ...rules, [k]: v });
    const lum = (hex) => { const s = hex.replace("#", ""); return 0.299 * parseInt(s.slice(0, 2), 16) + 0.587 * parseInt(s.slice(2, 4), 16) + 0.114 * parseInt(s.slice(4, 6), 16); };
    return (
      <section className="ts-card ts-card--flat">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><span className="ct-headicon"><Icon name="sliders-horizontal" size={18} /></span><span style={{ fontSize: 15, fontWeight: 800 }}>경기 설정</span><Badge tone="primary">기록앱 정합</Badge></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }} className="ct-rule-top">
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="shirt" size={15} color="var(--ink-mute)" />유니폼 규칙</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[["홈", "homeColor", rules.homeColor], ["원정", "awayColor", rules.awayColor]].map(([l, key, hex]) => (
                <div key={l} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6, padding: 12, background: "var(--grey-50)", border: "1px solid var(--border)", borderRadius: 14 }}>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{l}</span>
                  <SegSm options={["밝은색", "어두운색"]} index={lum(hex) > 165 ? 0 : 1} onSelect={i => set(key, i === 0 ? "#FFFFFF" : "#1A1E27")} />
                </div>
              ))}
            </div>
            <button onClick={() => patch({ ...rules, homeColor: rules.awayColor, awayColor: rules.homeColor })} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, padding: "7px 11px", background: "var(--grey-100)", border: 0, borderRadius: 10, fontSize: 12.5, fontWeight: 700, color: "var(--ink-soft)", cursor: "pointer", fontFamily: "var(--ff)" }}><Icon name="arrow-left-right" size={16} />홈 · 원정 색 교체</button>
            <label className="ct-checkrow" style={{ marginTop: 9 }}><Check on={rules.vestProvided} onChange={v => set("vestProvided", v)} /><span>팀 조끼(번호 조끼) 제공</span></label>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}><Icon name="clock" size={15} color="var(--ink-mute)" />경기 구성</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>{WS.gamePresets.map(p => <button key={p.label} className="ts-chip" data-active={rules.quarterType === p.quarterType && rules.quarterMinutes === p.quarterMinutes} onClick={() => patch({ ...rules, quarterType: p.quarterType, quarterMinutes: p.quarterMinutes })}>{p.label}</button>)}</div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          {[["운영 방식", <SegSm options={["논스톱", "올데드"]} index={rules.clockMode === "nonstop" ? 0 : 1} onSelect={i => set("clockMode", i === 0 ? "nonstop" : "dead")} />],
            ["쿼터 수", <SegSm options={["4쿼터", "전후반"]} index={rules.quarterType === "HALF" ? 1 : 0} onSelect={i => set("quarterType", i === 1 ? "HALF" : "4Q")} />],
            ["쿼터 시간", <Stepper value={rules.quarterMinutes} unit="분" min={1} max={20} onChange={v => set("quarterMinutes", v)} />],
            ["연장 시간", <Stepper value={rules.overtimeMinutes} unit="분" min={1} max={20} onChange={v => set("overtimeMinutes", v)} />],
            ["샷클락", <SegSm options={["사용", "미사용"]} index={rules.shotClockEnabled ? 0 : 1} onSelect={i => set("shotClockEnabled", i === 0)} />]].map(([name, ctrl]) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, fontWeight: 700 }}>{name}</div></div>{ctrl}
            </div>
          ))}
        </div>

        <details className="ct-details" style={{ marginTop: 12 }} open>
          <summary><Icon name="flag" size={15} style={{ marginRight: 6 }} />파울 · 타임아웃 — 개인 {rules.foulLimit} · 팀 {rules.teamFoulBonus} · 타임아웃 {rules.firstHalfTimeouts}/{rules.secondHalfTimeouts}</summary>
          <div style={{ marginTop: 8 }}>{[["개인 파울 한도", "foulLimit", 4, 6, "파울"], ["팀파울 보너스", "teamFoulBonus", 3, 7, "파울"], ["타임아웃 · 전반", "firstHalfTimeouts", 0, 4, "회"], ["타임아웃 · 후반", "secondHalfTimeouts", 0, 4, "회"]].map(([n, k, mn, mx, u]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}><div style={{ flex: 1, fontSize: 13.5, fontWeight: 700 }}>{n}</div><Stepper value={rules[k]} unit={u} min={mn} max={mx} onChange={v => set(k, v)} /></div>
          ))}</div>
        </details>

      </section>
    );
  };
})();
