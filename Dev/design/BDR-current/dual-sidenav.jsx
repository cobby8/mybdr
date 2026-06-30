/* DualSideNav — DS v4 컴포넌트 (소스 카피, babel 스크립트용: import/export 제거 + window 노출) */
let _injected = false;
function injectDualNavCss() {
  if (_injected || typeof document === "undefined") return;
  _injected = true;
  if (document.getElementById("bdr-dsnav-css")) return;
  const s = document.createElement("style");
  s.id = "bdr-dsnav-css";
  s.textContent = `
.bdr-dsnav { display:flex; min-height:100%; align-items:stretch; position:relative; font-family:var(--ff-body); }
/* 1) icon rail */
.bdr-dsnav__rail { flex:0 0 76px; width:76px; position:sticky; top:0; align-self:flex-start; height:100vh; background:var(--bg); border-right:1px solid var(--border); display:flex; flex-direction:column; align-items:center; padding:12px 0 10px; gap:4px; }
.bdr-dsnav__brand { width:44px; height:44px; flex:0 0 auto; margin-bottom:6px; display:inline-flex; align-items:center; justify-content:center; font-family:var(--ff-display); font-weight:900; font-size:19px; color:var(--ink); border-radius:var(--r-2); cursor:pointer; letter-spacing:-.04em; background:transparent; border:0; }
.bdr-dsnav__brand .dot { color:var(--primary); }
.bdr-dsnav__railscroll { flex:1; width:100%; display:flex; flex-direction:column; align-items:center; gap:2px; overflow-y:auto; overflow-x:hidden; }
.bdr-dsnav__railscroll::-webkit-scrollbar { width:0; }
.bdr-dsnav__item { position:relative; width:60px; padding:8px 0 6px; border:0; background:transparent; cursor:pointer; color:var(--mute); border-radius:var(--r-2); display:flex; flex-direction:column; align-items:center; gap:3px; font-family:var(--ff-body); }
.bdr-dsnav__item .material-symbols-outlined { font-size:23px; }
.bdr-dsnav__item .rl { font-size:10.5px; font-weight:700; letter-spacing:-.01em; white-space:nowrap; }
.bdr-dsnav__item:hover { background:var(--alt); color:var(--ink); }
.bdr-dsnav__item[data-on="true"] { color:var(--ink); background:var(--alt); }
.bdr-dsnav__item[data-on="true"]::before { content:""; position:absolute; left:0; top:8px; bottom:8px; width:3px; background:var(--primary); border-radius:0 2px 2px 0; }
.bdr-dsnav__item .dot { position:absolute; top:7px; right:12px; width:7px; height:7px; border-radius:50%; background:var(--primary); border:1.5px solid var(--bg); }
.bdr-dsnav__railfoot { width:100%; display:flex; flex-direction:column; align-items:center; gap:6px; padding-top:6px; border-top:1px solid var(--border); }
.bdr-dsnav__ava { width:38px; height:38px; border-radius:50%; background:var(--primary); color:var(--primary-on); font-weight:800; font-size:13px; display:inline-flex; align-items:center; justify-content:center; flex:0 0 auto; font-family:var(--ff-mono); cursor:pointer; }
[data-mode="dark"] .bdr-dsnav__ava { border-radius:9px; }
/* 2) context panel */
.bdr-dsnav__panel { flex:0 0 234px; width:234px; position:sticky; top:0; align-self:flex-start; height:100vh; background:var(--elev); border-right:1px solid var(--border); display:flex; flex-direction:column; }
.bdr-dsnav__mhead { display:none; align-items:center; justify-content:space-between; padding:12px 12px 8px; }
.bdr-dsnav__mlogo { font-family:var(--ff-display); font-weight:900; font-size:19px; color:var(--ink); cursor:pointer; background:transparent; border:0; }
.bdr-dsnav__mlogo .dot { color:var(--primary); }
.bdr-dsnav__fixed { padding:14px 12px 8px; flex:0 0 auto; }
.bdr-dsnav__search { display:flex; align-items:center; gap:8px; padding:9px 11px; margin-bottom:8px; border:1px solid var(--bstrong); border-radius:var(--r-2); background:var(--alt); color:var(--mute); cursor:text; }
.bdr-dsnav__search .material-symbols-outlined { font-size:18px; }
.bdr-dsnav__search input { border:0; background:transparent; color:var(--ink); font-size:16px; outline:none; width:100%; font-family:var(--ff-body); }
.bdr-dsnav__search kbd { font-family:var(--ff-mono); font-size:10px; color:var(--dim); border:1px solid var(--bstrong); border-radius:3px; padding:1px 4px; }
.bdr-dsnav__home { display:flex; align-items:center; gap:10px; width:100%; padding:9px 10px; border:0; cursor:pointer; text-align:left; font-size:13.5px; font-weight:700; color:var(--soft); background:transparent; border-radius:var(--r-2); font-family:var(--ff-body); }
.bdr-dsnav__home .material-symbols-outlined { font-size:20px; }
.bdr-dsnav__home:hover { background:var(--alt); color:var(--ink); }
.bdr-dsnav__home[data-on="true"] { background:var(--alt); color:var(--ink); box-shadow:inset 3px 0 0 var(--primary); }
.bdr-dsnav__div { height:1px; background:var(--border); margin:4px 12px; flex:0 0 auto; }
.bdr-dsnav__ctx { flex:1; overflow-y:auto; overflow-x:hidden; padding:8px 12px 14px; }
.bdr-dsnav__ctx::-webkit-scrollbar { width:8px; }
.bdr-dsnav__ctx::-webkit-scrollbar-thumb { background:var(--bstrong); border-radius:4px; }
.bdr-dsnav__ctxhead { display:flex; align-items:center; gap:8px; padding:4px 6px 10px; }
.bdr-dsnav__ctxhead .material-symbols-outlined { font-size:19px; color:var(--primary); flex:0 0 auto; }
.bdr-dsnav__ctxhead .t { font-family:var(--ff-display); font-weight:900; font-size:16px; color:var(--ink); letter-spacing:-.01em; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bdr-dsnav__grouplbl { font-size:10px; font-weight:800; letter-spacing:.1em; text-transform:uppercase; color:var(--dim); padding:12px 8px 5px; }
.bdr-dsnav__sublink { display:flex; align-items:center; gap:10px; width:100%; padding:8px 10px; border:0; background:transparent; cursor:pointer; text-align:left; font-size:13px; font-weight:600; color:var(--mute); border-radius:var(--r-2); font-family:var(--ff-body); min-width:0; margin-bottom:1px; }
.bdr-dsnav__sublink .material-symbols-outlined { font-size:19px; flex:0 0 auto; color:var(--dim); }
.bdr-dsnav__sublink .lbl { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.bdr-dsnav__sublink:hover { background:var(--alt); color:var(--ink); }
.bdr-dsnav__sublink:hover .material-symbols-outlined { color:var(--soft); }
.bdr-dsnav__sublink[data-on="true"] { background:var(--alt); color:var(--ink); font-weight:700; box-shadow:inset 3px 0 0 var(--primary); }
.bdr-dsnav__sublink[data-on="true"] .material-symbols-outlined { color:var(--primary); }
.bdr-dsnav__sublink .cnt { flex:0 0 auto; font-family:var(--ff-mono); font-size:11px; color:var(--dim); }
.bdr-dsnav__sublink .new { flex:0 0 auto; font-size:9px; font-weight:800; letter-spacing:.04em; color:var(--primary); border:1px solid var(--primary); border-radius:3px; padding:1px 4px; }
.bdr-dsnav__panelfoot { flex:0 0 auto; border-top:1px solid var(--border); padding:10px 12px; }
/* 3) main */
.bdr-dsnav__main { flex:1; min-width:0; }
.bdr-dsnav__iconbtn { position:relative; background:transparent; border:0; padding:7px; border-radius:var(--r-2); color:var(--soft); cursor:pointer; display:inline-flex; }
.bdr-dsnav__iconbtn:hover { background:var(--alt); color:var(--ink); }
.bdr-dsnav__iconbtn .material-symbols-outlined { font-size:21px; }
.bdr-dsnav__bd { position:fixed; inset:0; background:#000; opacity:0; pointer-events:none; z-index:98; transition:opacity .3s ease; }
.bdr-dsnav__handle { display:none; }
@media (prefers-reduced-motion:reduce){ .bdr-dsnav__rail,.bdr-dsnav__panel,.bdr-dsnav__handle,.bdr-dsnav__bd { transition:none !important; } }
/* mobile (<=920px) */
@media (max-width:920px) {
  .bdr-dsnav__rail { display:flex; position:fixed; top:0; left:0; bottom:0; height:100dvh; z-index:100; transform:translateX(var(--rail-x,-76px)); transition:transform .32s cubic-bezier(.32,.72,0,1); box-shadow:6px 0 24px rgba(0,0,0,.4); }
  .bdr-dsnav__panel { display:flex; position:fixed; top:0; left:76px; bottom:0; height:100dvh; width:min(288px,calc(100vw - 76px)); z-index:99; transform:translateX(var(--panel-x,calc(-100% - 76px))); transition:transform .32s cubic-bezier(.32,.72,0,1); box-shadow:12px 0 44px rgba(0,0,0,.5); border-right:0; }
  .bdr-dsnav__bd { opacity:var(--bd-o,0); }
  .bdr-dsnav.is-navopen .bdr-dsnav__bd { pointer-events:auto; }
  .bdr-dsnav__mhead { display:flex; }
  .bdr-dsnav__handle { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; position:fixed; left:var(--handle-x,0px); top:50%; margin-top:-34px; z-index:101; width:26px; height:68px; padding:0; background:var(--card); color:var(--soft); border:1px solid var(--bstrong); border-left:0; border-radius:0 12px 12px 0; cursor:pointer; touch-action:none; box-shadow:3px 0 14px rgba(0,0,0,.35); transition:left .32s cubic-bezier(.32,.72,0,1), background .15s, color .15s; }
  [data-mode="dark"] .bdr-dsnav__handle { border-radius:0 6px 6px 0; }
  .bdr-dsnav__handle:active { background:var(--alt); }
  .bdr-dsnav__grip { width:4px; height:22px; border-radius:2px; background:var(--dim); }
  .bdr-dsnav__chev { font-size:18px; transition:transform .3s ease; }
  .bdr-dsnav[data-nav="rail"] .bdr-dsnav__chev,
  .bdr-dsnav[data-nav="dual"] .bdr-dsnav__chev { transform:rotate(180deg); }
  .bdr-dsnav.is-navdrag .bdr-dsnav__rail,
  .bdr-dsnav.is-navdrag .bdr-dsnav__panel,
  .bdr-dsnav.is-navdrag .bdr-dsnav__handle,
  .bdr-dsnav.is-navdrag .bdr-dsnav__bd { transition:none !important; }
}`;
  document.head.appendChild(s);
}

const RAIL_W = 76;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/**
 * DualSideNav — 2-tier left navigation shell (v4). An icon **rail** (main
 * sections) + a **context panel** (per-section submenu with a fixed search/home
 * top and a footer slot), with `children` as the main content. On ≤920px the
 * rail+panel become a fixed overlay driven by a drag **handle** with three
 * snap stages (hidden → rail → dual) and 1:1 finger tracking.
 *
 * Data:
 *  - `sections`: `[{ id, label, icon, dot? }]` (the rail).
 *  - `ctx`: `{ [sectionId]: { label, icon, groups: [{ title?, items: [{ id,
 *    label, icon, count?, isNew? }] }] } }` (the panel submenu per section).
 *  Controlled via `activeSection` / `activeSub` + `onNavSection` / `onNavSub`.
 */
function DualSideNav({
  sections = [],
  ctx = {},
  activeSection,
  activeSub,
  onNavSection,
  onNavSub,
  onHome,
  brand = "B",
  brandFull,
  railFooter,
  panelFooter,
  searchPlaceholder = "검색",
  searchKbd = "/",
  children,
  style,
  ...rest
}) {
  injectDualNavCss();
  const rootRef = React.useRef(null);
  const handleRef = React.useRef(null);
  const drag = React.useRef({ on: false, startX: 0, startPos: 0, moved: false, pos: 0 });

  const isMobile = () => typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches;
  const panelW = () => Math.min(288, window.innerWidth - RAIL_W);

  const applyNav = React.useCallback((pos, animate) => {
    const root = rootRef.current;
    if (!root || !isMobile()) return;
    const pw = panelW(), mx = RAIL_W + pw;
    pos = clamp(pos, 0, mx);
    root.classList.toggle("is-navdrag", !animate);
    root.style.setProperty("--rail-x", clamp(pos, 0, RAIL_W) - RAIL_W + "px");
    const p2 = clamp((pos - RAIL_W) / pw, 0, 1);
    root.style.setProperty("--panel-x", -(RAIL_W + pw) * (1 - p2) + "px");
    root.style.setProperty("--handle-x", Math.min(pos, window.innerWidth - 28) + "px");
    root.style.setProperty("--bd-o", (pos / mx * 0.55).toFixed(3));
    root.classList.toggle("is-navopen", pos > 4);
    drag.current.pos = pos;
  }, []);

  const navState = () => {
    const pos = drag.current.pos;
    return pos <= 4 ? "hidden" : pos < RAIL_W + panelW() * 0.5 ? "rail" : "dual";
  };
  const goNav = React.useCallback((state) => {
    const p = state === "hidden" ? 0 : state === "rail" ? RAIL_W : RAIL_W + panelW();
    applyNav(p, true);
    if (rootRef.current) rootRef.current.setAttribute("data-nav", state);
  }, [applyNav]);
  const snapNav = React.useCallback(() => {
    const pts = [["hidden", 0], ["rail", RAIL_W], ["dual", RAIL_W + panelW()]];
    let best = "hidden", d = 1e9;
    pts.forEach(([s, p]) => { const dd = Math.abs(p - drag.current.pos); if (dd < d) { d = dd; best = s; } });
    goNav(best);
  }, [goNav]);
  const closeNav = React.useCallback(() => { if (isMobile()) goNav("hidden"); }, [goNav]);

  // mobile handle drag
  React.useEffect(() => {
    const h = handleRef.current;
    if (!h) return;
    const down = (e) => {
      if (!isMobile()) return;
      drag.current.on = true; drag.current.moved = false;
      drag.current.startX = e.clientX; drag.current.startPos = drag.current.pos;
      h.setPointerCapture(e.pointerId);
    };
    const move = (e) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      applyNav(drag.current.startPos + dx, false);
    };
    const up = () => {
      if (!drag.current.on) return;
      drag.current.on = false;
      if (drag.current.moved) snapNav();
      else { const s = navState(); goNav(s === "hidden" ? "rail" : "hidden"); }
    };
    const cancel = () => { if (drag.current.on) { drag.current.on = false; snapNav(); } };
    h.addEventListener("pointerdown", down);
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
    h.addEventListener("pointercancel", cancel);
    const onResize = () => {
      const root = rootRef.current; if (!root) return;
      if (isMobile()) { applyNav(drag.current.pos, false); root.classList.remove("is-navdrag"); root.setAttribute("data-nav", navState()); }
      else { root.removeAttribute("data-nav"); root.classList.remove("is-navopen", "is-navdrag"); }
    };
    const onKey = (e) => { if (e.key === "Escape" && isMobile()) goNav("hidden"); };
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey);
    if (isMobile()) goNav("hidden");
    return () => {
      h.removeEventListener("pointerdown", down);
      h.removeEventListener("pointermove", move);
      h.removeEventListener("pointerup", up);
      h.removeEventListener("pointercancel", cancel);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
    };
  }, [applyNav, goNav, snapNav]);

  const handleSection = (id) => {
    const same = id === activeSection;
    onNavSection && onNavSection(id);
    if (isMobile()) (same && navState() !== "hidden") ? goNav("rail") : goNav("dual");
  };
  const handleSub = (id) => { onNavSub && onNavSub(id); closeNav(); };
  const handleHome = () => { onHome && onHome(); closeNav(); };

  const c = ctx[activeSection];

  return (
    <div className="bdr-dsnav" ref={rootRef} style={style} {...rest}>
      {/* rail */}
      <aside className="bdr-dsnav__rail">
        <button type="button" className="bdr-dsnav__brand" onClick={handleHome} title="홈">{brand}</button>
        <div className="bdr-dsnav__railscroll">
          {sections.map((s) => (
            <button key={s.id} type="button" className="bdr-dsnav__item" data-on={s.id === activeSection} onClick={() => handleSection(s.id)} title={s.label}>
              <span className="material-symbols-outlined">{s.icon}</span>
              <span className="rl">{s.label}</span>
              {s.dot && <span className="dot" />}
            </button>
          ))}
        </div>
        {railFooter && <div className="bdr-dsnav__railfoot">{railFooter}</div>}
      </aside>

      {/* context panel */}
      <aside className="bdr-dsnav__panel">
        <div className="bdr-dsnav__mhead">
          <button type="button" className="bdr-dsnav__mlogo" onClick={handleHome}>{brandFull || <>MyBDR<span className="dot">.</span></>}</button>
          <button type="button" className="bdr-dsnav__iconbtn" onClick={() => goNav("hidden")} title="닫기"><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="bdr-dsnav__fixed">
          <label className="bdr-dsnav__search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder={searchPlaceholder} />
            {searchKbd && <kbd>{searchKbd}</kbd>}
          </label>
          <button type="button" className="bdr-dsnav__home" data-on={activeSection === "home"} onClick={handleHome}>
            <span className="material-symbols-outlined">home</span>홈
          </button>
        </div>
        <div className="bdr-dsnav__div" />
        <nav className="bdr-dsnav__ctx">
          {c && (
            <>
              <div className="bdr-dsnav__ctxhead">
                <span className="material-symbols-outlined">{c.icon}</span>
                <span className="t">{c.label}</span>
              </div>
              {(c.groups || []).map((g, gi) => (
                <React.Fragment key={gi}>
                  {g.title && <div className="bdr-dsnav__grouplbl">{g.title}</div>}
                  {g.items.map((it) => (
                    <button key={it.id} type="button" className="bdr-dsnav__sublink" data-on={it.id === activeSub} onClick={() => handleSub(it.id)}>
                      <span className="material-symbols-outlined">{it.icon}</span>
                      <span className="lbl">{it.label}</span>
                      {it.count != null && <span className="cnt">{it.count}</span>}
                      {it.isNew && <span className="new">신규</span>}
                    </button>
                  ))}
                </React.Fragment>
              ))}
              {(!c.groups || !c.groups.length) && <div className="bdr-dsnav__grouplbl">홈 대시보드</div>}
            </>
          )}
        </nav>
        {panelFooter && <div className="bdr-dsnav__panelfoot">{panelFooter}</div>}
      </aside>

      <div className="bdr-dsnav__bd" onClick={() => goNav("hidden")} />

      {/* mobile handle */}
      <button type="button" className="bdr-dsnav__handle" ref={handleRef} aria-label="메뉴">
        <span className="bdr-dsnav__grip" />
        <span className="material-symbols-outlined bdr-dsnav__chev">chevron_right</span>
      </button>

      {/* main content */}
      <div className="bdr-dsnav__main">{children}</div>
    </div>
  );
}

window.DualSideNav = DualSideNav;
