"use client";

import React from "react";
import type { DSNavSection, DSNavCtxEntry } from "./nav-ia";

/* ============================================================
 * DualSideNav — DS v4 좌측 2단 네비게이션 셸 (공개웹)
 *
 * 정본: Dev/design/BDR-current/dual-sidenav.jsx
 * CSS: src/app/globals.css [data-pub] .bdr-dsnav__* 정적 박제
 *      (FOUC/hydration 안전 — injectDualNavCss 런타임 주입 제거)
 *
 * Phase PUB-0b PR2
 * ============================================================ */

const RAIL_W = 76;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface DualSideNavProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  sections?: DSNavSection[];
  ctx?: Record<string, DSNavCtxEntry>;
  activeSection?: string;
  activeSub?: string;
  onNavSection?: (id: string) => void;
  onNavSub?: (id: string) => void;
  onHome?: () => void;
  brand?: string;
  brandFull?: React.ReactNode;
  railFooter?: React.ReactNode;
  panelFooter?: React.ReactNode;
  searchPlaceholder?: string;
  searchKbd?: string;
  onSearch?: (query: string) => void;
  children?: React.ReactNode;
}

export function DualSideNav({
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
  onSearch,
  children,
  style,
  ...rest
}: DualSideNavProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLButtonElement>(null);
  const drag = React.useRef({ on: false, startX: 0, startPos: 0, moved: false, pos: 0 });

  const isMobile = () =>
    typeof window !== "undefined" && window.matchMedia("(max-width: 920px)").matches;
  const panelW = () => Math.min(288, window.innerWidth - RAIL_W);

  const applyNav = React.useCallback((pos: number, animate: boolean) => {
    const root = rootRef.current;
    if (!root || !isMobile()) return;
    const pw = panelW();
    const mx = RAIL_W + pw;
    pos = clamp(pos, 0, mx);
    root.classList.toggle("is-navdrag", !animate);
    root.style.setProperty("--rail-x", clamp(pos, 0, RAIL_W) - RAIL_W + "px");
    const p2 = clamp((pos - RAIL_W) / pw, 0, 1);
    root.style.setProperty("--panel-x", -(RAIL_W + pw) * (1 - p2) + "px");
    root.style.setProperty("--handle-x", Math.min(pos, window.innerWidth - 28) + "px");
    root.style.setProperty("--bd-o", ((pos / mx) * 0.55).toFixed(3));
    root.classList.toggle("is-navopen", pos > 4);
    drag.current.pos = pos;
  }, []);

  const navState = (): "hidden" | "rail" | "dual" => {
    const pos = drag.current.pos;
    return pos <= 4 ? "hidden" : pos < RAIL_W + panelW() * 0.5 ? "rail" : "dual";
  };

  const goNav = React.useCallback(
    (state: "hidden" | "rail" | "dual") => {
      const p = state === "hidden" ? 0 : state === "rail" ? RAIL_W : RAIL_W + panelW();
      applyNav(p, true);
      if (rootRef.current) rootRef.current.setAttribute("data-nav", state);
    },
    [applyNav]
  );

  const snapNav = React.useCallback(() => {
    const pts: ["hidden" | "rail" | "dual", number][] = [
      ["hidden", 0],
      ["rail", RAIL_W],
      ["dual", RAIL_W + panelW()],
    ];
    let best: "hidden" | "rail" | "dual" = "hidden";
    let d = 1e9;
    pts.forEach(([s, p]) => {
      const dd = Math.abs(p - drag.current.pos);
      if (dd < d) { d = dd; best = s; }
    });
    goNav(best);
  }, [goNav]);

  const closeNav = React.useCallback(() => {
    if (isMobile()) goNav("hidden");
  }, [goNav]);

  // 모바일 드래그 핸들 — 정본 그대로
  React.useEffect(() => {
    const h = handleRef.current;
    if (!h) return;
    const down = (e: PointerEvent) => {
      if (!isMobile()) return;
      drag.current.on = true;
      drag.current.moved = false;
      drag.current.startX = e.clientX;
      drag.current.startPos = drag.current.pos;
      h.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      if (!drag.current.on) return;
      const dx = e.clientX - drag.current.startX;
      if (Math.abs(dx) > 4) drag.current.moved = true;
      applyNav(drag.current.startPos + dx, false);
    };
    const up = () => {
      if (!drag.current.on) return;
      drag.current.on = false;
      if (drag.current.moved) snapNav();
      else {
        const s = navState();
        goNav(s === "hidden" ? "rail" : "hidden");
      }
    };
    const cancel = () => {
      if (drag.current.on) { drag.current.on = false; snapNav(); }
    };
    h.addEventListener("pointerdown", down);
    h.addEventListener("pointermove", move);
    h.addEventListener("pointerup", up);
    h.addEventListener("pointercancel", cancel);

    const onResize = () => {
      const root = rootRef.current;
      if (!root) return;
      if (isMobile()) {
        applyNav(drag.current.pos, false);
        root.classList.remove("is-navdrag");
        root.setAttribute("data-nav", navState());
      } else {
        root.removeAttribute("data-nav");
        root.classList.remove("is-navopen", "is-navdrag");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobile()) goNav("hidden");
    };
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

  const handleSection = (id: string) => {
    const same = id === activeSection;
    onNavSection?.(id);
    if (isMobile()) {
      same && navState() !== "hidden" ? goNav("rail") : goNav("dual");
    }
  };
  const handleSub = (id: string) => { onNavSub?.(id); closeNav(); };
  const handleHome = () => { onHome?.(); closeNav(); };

  const c = activeSection ? ctx[activeSection] : undefined;

  return (
    <div className="bdr-dsnav" ref={rootRef} style={style} {...rest}>
      {/* 아이콘 레일 */}
      <aside className="bdr-dsnav__rail">
        <button type="button" className="bdr-dsnav__brand" onClick={handleHome} title="홈">
          {brand}
        </button>
        <div className="bdr-dsnav__railscroll">
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className="bdr-dsnav__item"
              data-on={s.id === activeSection ? "true" : undefined}
              onClick={() => handleSection(s.id)}
              title={s.label}
            >
              <span className="material-symbols-outlined">{s.icon}</span>
              <span className="rl">{s.label}</span>
              {s.dot && <span className="dot" />}
            </button>
          ))}
        </div>
        {railFooter && <div className="bdr-dsnav__railfoot">{railFooter}</div>}
      </aside>

      {/* 컨텍스트 패널 */}
      <aside className="bdr-dsnav__panel">
        <div className="bdr-dsnav__mhead">
          <button type="button" className="bdr-dsnav__mlogo" onClick={handleHome}>
            {brandFull ?? (
              <>
                MyBDR<span className="dot">.</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="bdr-dsnav__iconbtn"
            onClick={() => goNav("hidden")}
            title="닫기"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="bdr-dsnav__fixed">
          <label className="bdr-dsnav__search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder={searchPlaceholder}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const q = e.currentTarget.value.trim();
                  if (q && onSearch) {
                    onSearch(q);
                    e.currentTarget.value = "";
                  }
                }
              }}
            />
            {searchKbd && <kbd>{searchKbd}</kbd>}
          </label>
          <button
            type="button"
            className="bdr-dsnav__home"
            data-on={activeSection === "home" ? "true" : undefined}
            onClick={handleHome}
          >
            <span className="material-symbols-outlined">home</span>
            홈
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
              {(c.groups ?? []).map((g, gi) => (
                <React.Fragment key={gi}>
                  {g.title && <div className="bdr-dsnav__grouplbl">{g.title}</div>}
                  {g.items.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      className="bdr-dsnav__sublink"
                      data-on={it.id === activeSub ? "true" : undefined}
                      onClick={() => handleSub(it.id)}
                    >
                      <span className="material-symbols-outlined">{it.icon}</span>
                      <span className="lbl">{it.label}</span>
                      {it.count != null && <span className="cnt">{it.count}</span>}
                      {it.isNew && <span className="new">신규</span>}
                    </button>
                  ))}
                </React.Fragment>
              ))}
              {(!c.groups || !c.groups.length) && (
                <div className="bdr-dsnav__grouplbl">홈 대시보드</div>
              )}
            </>
          )}
        </nav>
        {panelFooter && <div className="bdr-dsnav__panelfoot">{panelFooter}</div>}
      </aside>

      {/* 모바일 백드롭 */}
      <div className="bdr-dsnav__bd" onClick={() => goNav("hidden")} />

      {/* 모바일 드래그 핸들 */}
      <button type="button" className="bdr-dsnav__handle" ref={handleRef} aria-label="메뉴">
        <span className="bdr-dsnav__grip" />
        <span className="material-symbols-outlined bdr-dsnav__chev">chevron_right</span>
      </button>

      {/* 메인 콘텐츠 */}
      <div className="bdr-dsnav__main">{children}</div>
    </div>
  );
}
