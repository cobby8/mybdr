"use client";

import { useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

/**
 * /obs/scoreboard?c=<court_key>&k=<read_key>&theme=<chroma|transparent|dark>
 *
 * OBS 브라우저소스가 여는 **공개 점수판 오버레이 페이지**.
 *
 * ── 시각 truth ─────────────────────────────────────────────────
 * 렌더/CSS/DOM 은 디자인 truth(scoreboard_overlay.html)를 1:1 유지한다.
 * 원본의 동기화 스텁(BroadcastChannel('bdr-scoreboard') + localStorage)만
 * **폴링 fetch 로 교체**했다. 그 외 마크업·스타일·render(s) 로직은 그대로.
 *
 * ── 폴링 ───────────────────────────────────────────────────────
 * 1.5초 간격으로 GET /api/v1/live/courts/${c}/scoreboard?key=${k} 호출.
 *   - 200 → payload(camelCase: scoreH/scoreA/period/clock/sc24/homeFouls/awayFouls/
 *           homeName/homeCode/awayName/awayCode/tTitle/tSub/sponsors 등) 렌더
 *   - 204(라이브 없음·쉬는시간) → 오버레이 숨김(투명)
 *   - 그 외 에러 → 직전 렌더값 유지(깜빡임 방지)
 *
 * ── theme ──────────────────────────────────────────────────────
 * URL theme 파라미터로 배경만 결정(render 는 동일):
 *   chroma=크로마키 그린(#00B140) · transparent=투명 · dark=어두운 배경(#000)
 */

const POLL_INTERVAL_MS = 1500;

// 디자인 truth(scoreboard_overlay.html)의 <style> 블록 1:1.
// (배경 모드 셀렉터는 data-bg 로 동일 유지 — theme 파라미터를 data-bg 로 매핑)
const OVERLAY_CSS = `
:root{
  --bdr-red:#E31B23; --primary:#0F5FCC; --warn:#E8A33B;
  --ink:#1A1E27; --ink-soft:#404755; --ink-mute:#6B7280; --ink-dim:#8C94A0;
  --bg-card:#FFFFFF; --border:#E3E7ED; --border-strong:#D0D5DD;
  --team-home:#E31B23; --team-away:#0F5FCC;
}
.obs-root *,.obs-root *::before,.obs-root *::after{box-sizing:border-box}
.obs-root{position:fixed;inset:0;margin:0;padding:0;font-family:"Pretendard","Apple SD Gothic Neo",sans-serif;font-feature-settings:"tnum";background:transparent;overflow:hidden}
/* 배경 모드 — OBS 합성용 */
.obs-root[data-bg="black"]{background:#000}
.obs-root[data-bg="chroma"]{background:#00B140}   /* 크로마키 그린 */

/* 스테이지 — 1920 폭 고정, 뷰포트 폭에 맞춰 스케일 (OBS 브라우저 소스 폭=출력 폭) */
.obs-root #stage{position:fixed;left:0;width:1920px;transform-origin:top left}
.obs-root #stage[data-pos="top"]{top:0}
.obs-root #stage[data-pos="bottom"]{bottom:0;transform-origin:bottom left}

/* ── 스코어보드 바 ── */
.obs-root .bar{position:relative;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;
  height:96px;background:var(--bg-card);border-bottom:2px solid var(--border-strong);
  box-shadow:0 6px 18px rgba(15,23,42,.10)}
.obs-root .bar::before,.obs-root .bar::after{content:"";position:absolute;top:0;bottom:0;width:6px}
.obs-root .bar::before{left:0;background:var(--team-home)}
.obs-root .bar::after{right:0;background:var(--team-away)}

/* 스폰서 (좌) */
.obs-root .sp{justify-self:start;align-self:center;display:flex;align-items:center;gap:26px;padding-left:34px}
.obs-root .sp:empty{display:none}
.obs-root .sp .mark{height:40px;background-color:var(--ink);
  -webkit-mask-position:left center;-webkit-mask-size:contain;-webkit-mask-repeat:no-repeat;
  mask-position:left center;mask-size:contain;mask-repeat:no-repeat}
.obs-root .sp .mark.molten{width:103px;-webkit-mask-image:url(/obs/assets/sponsor_molten_black.png);mask-image:url(/obs/assets/sponsor_molten_black.png)}
.obs-root .sp .mark.stiz{width:131px;-webkit-mask-image:url(/obs/assets/sponsor_stiz_black.png);mask-image:url(/obs/assets/sponsor_stiz_black.png)}

/* 센터 그룹 */
.obs-root .center-group{display:flex;align-items:center;gap:26px;justify-self:center}
.obs-root .team{display:flex;align-items:center;gap:18px}
.obs-root .team.away{flex-direction:row-reverse}
.obs-root .logo{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;
  font-family:"Archivo",sans-serif;font-weight:900;font-size:26px;letter-spacing:-0.01em;flex-shrink:0}
.obs-root .team.home .logo{background:#fff;color:var(--ink);border:3px solid var(--ink)}
.obs-root .team.away .logo{background:var(--ink);color:#fff;border:3px solid var(--ink)}
.obs-root .info{display:flex;flex-direction:column;gap:7px}
.obs-root .team.away .info{align-items:flex-end}
.obs-root .nm{font-family:"Pretendard";font-weight:800;font-size:26px;color:var(--ink);letter-spacing:-0.02em;line-height:1;white-space:nowrap}
.obs-root .fouls{display:flex;gap:5px}
.obs-root .team.away .fouls{flex-direction:row-reverse}
.obs-root .dot{width:9px;height:9px;border-radius:4px;background:var(--border-strong)}
.obs-root .dot.on{background:var(--ink-soft)}
.obs-root .dot.on.pen{background:var(--bdr-red)}

.obs-root .center{display:flex;align-items:center;gap:22px}
.obs-root .score{font-family:"Archivo",sans-serif;font-weight:900;font-size:58px;line-height:1;color:var(--ink);letter-spacing:-0.02em;min-width:74px;text-align:center}
.obs-root .clk-block{display:flex;flex-direction:column;align-items:center;gap:6px}
.obs-root .clk{font-family:"Archivo",sans-serif;font-weight:900;font-size:34px;line-height:1;color:var(--ink);letter-spacing:.01em}
.obs-root .meta-row{display:flex;align-items:center;gap:6px}
.obs-root .pill{font-family:"Archivo",sans-serif;font-weight:900;font-size:15px;line-height:1;padding:5px 9px;border-radius:6px;color:#fff;letter-spacing:.02em}
.obs-root .pill.period{background:var(--ink)}
.obs-root .pill.sc24{background:var(--warn)}

/* 대회 (우) */
.obs-root .tour{justify-self:end;align-self:center;text-align:right;display:flex;flex-direction:column;gap:5px;padding-right:34px}
.obs-root .tour .ttl{font-family:"Pretendard";font-weight:900;font-size:25px;color:var(--ink);letter-spacing:-0.02em;line-height:1.05;white-space:nowrap}
.obs-root .tour .sub{display:inline-flex;align-items:center;gap:11px;justify-content:flex-end;
  font-family:"Archivo",sans-serif;font-size:14px;font-weight:700;color:var(--ink-mute);letter-spacing:.04em}
.obs-root .tour .sub .sep{width:4px;height:4px;border-radius:50%;background:var(--ink-dim)}
.obs-root .tour .sub .live{display:inline-flex;align-items:center;gap:6px;color:var(--bdr-red);font-weight:900}
.obs-root .tour .sub .live::before{content:"";width:9px;height:9px;border-radius:50%;background:var(--bdr-red);animation:bdrpulse 1.4s ease-in-out infinite}
@keyframes bdrpulse{0%,100%{opacity:1}50%{opacity:.4}}

/* 연결 안내 (스냅샷 수신 전) */
.obs-root #wait{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);font-family:"Pretendard";font-weight:700;
  font-size:18px;color:#888;text-align:center;line-height:1.6}
.obs-root[data-bg="transparent"] #wait{color:#bbb}
.obs-root .bar.live #waitline{display:none}
`;

function OverlayInner() {
  const searchParams = useSearchParams();
  const c = searchParams.get("c") ?? "";
  const k = searchParams.get("k") ?? "";
  const theme = searchParams.get("theme") ?? "chroma";

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const waitRef = useRef<HTMLDivElement>(null);

  // theme → data-bg 매핑(배경만 결정·render 동일).
  //   chroma=크로마키 그린 · transparent=투명 · dark=검정
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bg =
      theme === "transparent" ? "transparent" : theme === "dark" ? "black" : "chroma";
    root.dataset.bg = bg;
  }, [theme]);

  // 1920 폭 → 뷰포트 폭에 맞춰 스케일 (OBS 소스 폭 = 출력 폭). 원본 fit() 1:1.
  useEffect(() => {
    function fit() {
      const stage = stageRef.current;
      if (!stage) return;
      const s = window.innerWidth / 1920;
      stage.style.transform = `scale(${s})`;
    }
    window.addEventListener("resize", fit);
    fit();
    return () => window.removeEventListener("resize", fit);
  }, []);

  // 폴링 + 렌더 (원본 render(s) 를 DOM 직접 조작으로 1:1 이식).
  useEffect(() => {
    if (!c || !k) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const $ = (id: string) =>
      rootRef.current?.querySelector<HTMLElement>(`#${id}`) ?? null;

    function dots(n: number, penAt5: boolean): string {
      let h = "";
      for (let i = 0; i < 5; i++) {
        const on = i < n;
        const pen = penAt5 && i === 4 && on;
        h += '<span class="dot' + (on ? " on" : "") + (pen ? " pen" : "") + '"></span>';
      }
      return h;
    }

    // 원본 render(s) 와 동일. payload 의 camelCase 키를 그대로 사용.
    function render(s: Record<string, unknown> | null) {
      if (!s) return;
      const text = (id: string, v: unknown) => {
        const el = $(id);
        if (el) el.textContent = v == null ? "" : String(v);
      };
      const num = (v: unknown, d = 0) => (typeof v === "number" ? v : d);

      text("scoreH", s.scoreH ?? "0");
      text("scoreA", s.scoreA ?? "0");
      text("clk", s.clock ?? "");
      text("period", s.period ?? "");
      text("sc24", s.sc24 ?? "");
      text("homeName", s.homeName ?? "홈");
      text("awayName", s.awayName ?? "원정");
      text("homeCode", s.homeCode ?? "");
      text("awayCode", s.awayCode ?? "");
      const hf = $("homeFouls");
      if (hf) hf.innerHTML = dots(num(s.homeFouls), true);
      const af = $("awayFouls");
      if (af) af.innerHTML = dots(num(s.awayFouls), true);

      // 스폰서 — 관리자 입력분만(molten/stiz)
      const sp = $("sp");
      if (sp) {
        sp.innerHTML = "";
        const sponsors = Array.isArray(s.sponsors) ? (s.sponsors as unknown[]) : [];
        sponsors.forEach((kk) => {
          if (kk === "molten" || kk === "stiz") {
            const m = document.createElement("div");
            m.className = "mark " + kk;
            sp.appendChild(m);
          }
        });
      }

      // 대회
      text("tTitle", s.tTitle ?? "");
      const sub = $("tSub");
      if (sub) {
        sub.innerHTML = "";
        const tSub = Array.isArray(s.tSub) ? (s.tSub as Array<Record<string, unknown>>) : [];
        tSub.forEach((p, i) => {
          if (i > 0) {
            const sep = document.createElement("span");
            sep.className = "sep";
            sub.appendChild(sep);
          }
          const el = document.createElement("span");
          if (p && p.live) el.className = "live";
          el.textContent = p && p.txt != null ? String(p.txt) : "";
          sub.appendChild(el);
        });
      }

      // 바 표시 / 대기문구 숨김
      const bar = barRef.current;
      if (bar) bar.style.display = "";
      const wait = waitRef.current;
      if (wait) wait.style.display = "none";
    }

    // 204(라이브 없음) → 오버레이 숨김(투명).
    function hideOverlay() {
      const bar = barRef.current;
      if (bar) bar.style.display = "none";
      const wait = waitRef.current;
      if (wait) wait.style.display = "";
    }

    async function poll() {
      try {
        const res = await fetch(
          `/api/v1/live/courts/${encodeURIComponent(c)}/scoreboard?key=${encodeURIComponent(k)}`,
          { cache: "no-store" }
        );
        if (res.status === 200) {
          const data = (await res.json()) as Record<string, unknown>;
          render(data);
        } else if (res.status === 204) {
          // 쉬는시간 — 오버레이 숨김(투명)
          hideOverlay();
        }
        // 그 외 상태(403/400/5xx 등)는 직전 렌더값 유지(깜빡임 방지) — 아무것도 안 함.
      } catch {
        // 네트워크 에러도 직전값 유지.
      } finally {
        if (!stopped) timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [c, k]);

  return (
    <>
      {/* 디자인 truth 폰트(Archivo + Pretendard) — 원본 <head> link 1:1 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
      />
      <style dangerouslySetInnerHTML={{ __html: OVERLAY_CSS }} />

      <div ref={rootRef} className="obs-root" data-bg="chroma">
        <div id="wait" ref={waitRef}>
          스코어보드 수신 대기 중…
          <br />
          <span style={{ fontSize: 13, color: "#aaa" }}>
            라이브 경기가 시작되면 자동으로 표시됩니다
          </span>
        </div>

        <div id="stage" ref={stageRef} data-pos="top">
          <div className="bar" id="bar" ref={barRef} style={{ display: "none" }}>
            <div className="sp" id="sp"></div>
            <div className="center-group">
              <div className="team home">
                <div className="logo" id="homeCode">
                  HK
                </div>
                <div className="info">
                  <div className="nm" id="homeName">
                    홈
                  </div>
                  <div className="fouls" id="homeFouls"></div>
                </div>
              </div>
              <div className="center">
                <span className="score" id="scoreH">
                  0
                </span>
                <div className="clk-block">
                  <span className="clk" id="clk">
                    10:00
                  </span>
                  <div className="meta-row">
                    <span className="pill period" id="period">
                      Q1
                    </span>
                    <span className="pill sc24" id="sc24">
                      24
                    </span>
                  </div>
                </div>
                <span className="score" id="scoreA">
                  0
                </span>
              </div>
              <div className="team away">
                <div className="logo" id="awayCode">
                  AW
                </div>
                <div className="info">
                  <div className="nm" id="awayName">
                    원정
                  </div>
                  <div className="fouls" id="awayFouls"></div>
                </div>
              </div>
            </div>
            <div className="tour">
              <div className="ttl" id="tTitle"></div>
              <div className="sub" id="tSub"></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ObsScoreboardPage() {
  // useSearchParams 는 Suspense 경계가 필요(Next.js App Router).
  return (
    <Suspense fallback={null}>
      <OverlayInner />
    </Suspense>
  );
}
