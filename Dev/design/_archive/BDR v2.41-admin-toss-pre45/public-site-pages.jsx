/* global React, window */
// ============================================================
// public-site-pages.jsx — 공개 사이트 미리보기 (BDR 13룰 · Material Symbols)
//   발행상태 7단계에 따라 섹션 가시성(show/partial/prep/hide) 제어.
// ============================================================
const { useState } = React;
const P = window.PSITE;

function Ms({ name, style }) {
  return <span className="ms" style={style}>{name}</span>;
}

const STATUS_KO = { completed: "종료", in_progress: "진행", scheduled: "예정", pending: "대기" };
const STATUS_TONE = { completed: "mute", in_progress: "red", scheduled: "navy", pending: "mute" };

// ── 준비중 / 비공개 placeholder ──────────────────────────────
function Prep({ icon = "schedule", title, desc, src }) {
  return (
    <div className="s-prep">
      <div className="s-prep__ic"><Ms name={icon} /></div>
      <div className="s-prep__t">{title}</div>
      <div className="s-prep__x">{desc}</div>
      {src && <div className="s-prep__src">{src}</div>}
    </div>);
}

function SrcNote({ children }) {
  return <span className="s-srcnote"><Ms name="sync_alt" />{children}</span>;
}

// ── 홈 ──────────────────────────────────────────────────────
function HomePage({ st }) {
  const m = P.meta;
  const regOpen = st.id === "reg";
  const showTeamCount = st.sec.teams !== "hide";
  return (
    <div className="s-wrap">
      <div className="s-statusband">
        <span className={`s-chip s-chip--${st.tone === "ok" ? "ok" : st.tone === "warn" ? "red" : st.tone === "primary" ? "navy" : "mute"}`}>{st.statusLabel}</span>
        <SrcNote>관리자 → 발행 API → 공개</SrcNote>
      </div>

      {/* 통계 — 관리자 summary 파생 */}
      <div className="s-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
        <div className="s-stat"><div className="num">{showTeamCount ? m.teamCount : "—"}</div><div className="lab">참가팀{!showTeamCount && " (모집 전)"}</div></div>
        <div className="s-stat"><div className="num">{st.sec.schedule === "show" ? m.matchCount : "—"}</div><div className="lab">경기{st.sec.schedule !== "show" && " (발행 전)"}</div></div>
        <div className="s-stat"><div className="num">{m.divisionCount}</div><div className="lab">종별</div></div>
        <div className="s-stat"><div className="num" style={{ fontSize: 19, paddingTop: 6 }}>{m.period.split(" ~ ")[0].slice(3)}</div><div className="lab">개막일</div></div>
      </div>

      {/* 모집 상태 카드 */}
      {(st.id === "before" || st.id === "reg") && (
        <>
          <div className="s-sec"><h2>참가 모집</h2></div>
          <div className="s-card s-card--pad" style={{ display: "flex", flexWrap: "wrap", gap: 18, alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{regOpen ? "참가팀을 모집하고 있습니다" : "곧 참가 모집이 시작됩니다"}</div>
              <div style={{ color: "var(--s-mute)", fontSize: 13.5, marginTop: 4 }}>
                {regOpen ? `정원 ${m.maxTeams}팀 · 현재 ${m.teamCount}팀 신청 · 마감 ${m.regClose}` : `모집 시작 예정 · 참가비 ${m.entryFee}`}
              </div>
            </div>
            <a className="s-btn s-btn--primary" onClick={(e) => e.preventDefault()}><Ms name="how_to_reg" />{regOpen ? "참가 신청" : "알림 신청"}</a>
          </div>
        </>
      )}

      {/* 종별 — 관리자 divisionRules 파생 */}
      <div className="s-sec"><h2>종별 안내</h2><span style={{ fontSize: 13, color: "var(--s-mute)", fontWeight: 700 }}>총 {m.teamCount}팀 · {m.divisionCount}종별</span></div>
      <div className="s-grid" style={{ gridTemplateColumns: "repeat(2, minmax(0,1fr))" }}>
        {P.divisions.map((d) => (
          <div key={d.code} className="s-card s-divrow">
            <div className="s-divrow__bar" style={{ background: d.code === "open" ? "var(--s-navy)" : d.code === "ama" ? "var(--s-red)" : d.code === "u18" ? "#16a34a" : "#8B5CF6" }} />
            <div className="s-divrow__body">
              <div className="s-divrow__nm">{d.label}</div>
              <div className="s-divrow__fmt">{P.FORMAT_LABEL[d.format]} · {d.note}</div>
            </div>
            <div className="s-divrow__n">{showTeamCount ? `${d.teams.length}팀` : `정원 ${d.cap}`}</div>
          </div>
        ))}
      </div>

      {/* 공지 */}
      <div className="s-sec"><h2>대회 공지</h2></div>
      <div className="s-notice">
        <div className="s-notice__d">06.10</div>
        <div className="s-notice__body">
          <div className="s-notice__t">대회 요강 안내<span className="s-chip s-chip--navy">안내</span></div>
          <div className="s-notice__x">{m.name}는 {m.period} 기간 {m.venue}에서 {m.divisionCount}종별로 진행됩니다. 자세한 일정은 일정 탭에서 확인하세요.</div>
        </div>
      </div>
    </div>);
}

// ── 일정 ────────────────────────────────────────────────────
function SchedulePage({ st }) {
  const vis = st.sec.schedule;
  if (vis === "prep") return (
    <div className="s-wrap">
      <h1 className="s-page-h">경기 일정</h1>
      <p className="s-page-sub">발행된 경기만 공개됩니다.</p>
      <Prep icon="event_upcoming" title="일정 준비 중"
        desc={st.id === "drawn" ? "대진은 확정되었으나 아직 발행되지 않았습니다. 발행 후 27경기 일정이 공개됩니다." : "대진 추첨 후 경기 일정이 공개됩니다. 현재는 종별·정원 안내만 제공됩니다."}
        src="src: matches.published === false" />
    </div>);

  const showScore = st.id === "live" || st.id === "ended";
  return (
    <div className="s-wrap">
      <h1 className="s-page-h">경기 일정</h1>
      <p className="s-page-sub">총 {P.meta.matchCount}경기 · 발행된 경기 기준 {st.id === "live" ? "· 실시간 진행 중" : ""}</p>
      {P.schedule.map((day, i) => (
        <div key={i} className="s-day">
          <div className="s-day__h"><span className="d">{day.date}</span><span className="p">{day.phase} · {day.court}</span></div>
          <table className="s-gtable">
            <thead><tr><th style={{ width: 64 }}>시간</th><th style={{ width: 62 }}>코트</th><th style={{ width: 74 }}>종별</th><th>경기 (홈 · 원정)</th><th style={{ width: 92, textAlign: "right" }}>스코어</th><th style={{ width: 64, textAlign: "center" }}>상태</th></tr></thead>
            <tbody>
              {day.games.map((g, j) => {
                const done = g.status === "completed";
                const homeWin = done && g.hs > g.as;
                return (
                  <tr key={j}>
                    <td className="mono">{g.time}</td>
                    <td style={{ color: "var(--s-mute)", fontSize: 13 }}>{g.court}</td>
                    <td><span className="s-chip s-chip--mute" style={{ fontSize: 11 }}>{g.div}</span></td>
                    <td><div className="s-match"><span className={homeWin ? "win" : ""}>{g.home}</span><span className="vs">vs</span><span className={done && !homeWin ? "win" : ""}>{g.away}</span></div></td>
                    <td style={{ textAlign: "right" }}>{showScore && g.hs != null
                      ? <span className="s-score"><span className={homeWin ? "" : "lose"}>{g.hs}</span><span className="lose"> : </span><span className={!homeWin ? "" : "lose"}>{g.as}</span></span>
                      : <span style={{ color: "var(--s-dim)", fontSize: 13 }}>—</span>}</td>
                    <td style={{ textAlign: "center" }}>
                      {g.status === "in_progress"
                        ? <span className="s-chip s-chip--red"><span className="s-livedot" />진행</span>
                        : <span className={`s-chip s-chip--${STATUS_TONE[g.status]}`}>{STATUS_KO[g.status]}</span>}
                    </td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>);
}

// ── 대진 ────────────────────────────────────────────────────
function BracketPage({ st }) {
  const vis = st.sec.bracket;
  if (vis !== "show") return (
    <div className="s-wrap">
      <h1 className="s-page-h">대진표</h1>
      <p className="s-page-sub">오픈부 결선 토너먼트</p>
      <Prep icon="account_tree" title="대진 준비 중"
        desc={st.id === "drawn" ? "관리자에서 대진이 확정되었습니다. 발행되면 8강 토너먼트 대진이 공개됩니다." : "조별리그 종료 후 조 1·2위가 가려지면 결선 대진이 공개됩니다."}
        src="src: bracket.published === false" />
    </div>);
  const showScore = st.id === "live" || st.id === "ended";
  return (
    <div className="s-wrap">
      <h1 className="s-page-h">대진표</h1>
      <p className="s-page-sub">{P.bracket.div} 결선 — {P.bracket.note}</p>
      <div className="s-bracket">
        {P.bracket.rounds.map((rd, ri) => (
          <div key={ri} className="s-bcol">
            <div className="s-bcol__h"><span>{rd.name}</span></div>
            <div className="s-bcol__body">
              {rd.games.map((g, gi) => {
                const done = showScore && g.hs != null;
                const hw = done && g.hs > g.as;
                return (
                  <div key={gi} className="s-bcell"><div className="s-bgame">
                    <div className={`s-brow ${hw ? "s-brow--win" : ""}`}><span className="nm">{g.home}</span><span className="sc">{done ? g.hs : "–"}</span></div>
                    <div className={`s-brow ${done && !hw ? "s-brow--win" : ""}`}><span className="nm">{g.away}</span><span className="sc">{done ? g.as : "–"}</span></div>
                  </div></div>);
              })}
            </div>
          </div>
        ))}
      </div>
    </div>);
}

// ── 참가팀 ──────────────────────────────────────────────────
function TeamsPage({ st }) {
  const [div, setDiv] = useState("open");
  const vis = st.sec.teams;
  if (vis === "hide") return (
    <div className="s-wrap">
      <h1 className="s-page-h">참가팀</h1>
      <Prep icon="groups" title="참가팀 비공개"
        desc="모집이 시작되면 승인된 참가팀이 공개됩니다."
        src="src: status === 'before'" />
    </div>);
  const d = P.divisions.find((x) => x.code === div);
  const partial = vis === "partial";
  return (
    <div className="s-wrap">
      <h1 className="s-page-h">참가팀</h1>
      <p className="s-page-sub">승인 완료 {P.meta.teamCount}팀{partial ? " · 모집 중 (승인팀만 공개)" : " · 종별별"}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {P.divisions.map((x) => (
          <button key={x.code} className={`s-btn ${div === x.code ? "s-btn--primary" : "s-btn--outline"}`} style={{ minHeight: 40, padding: "8px 14px", fontSize: 13.5 }} onClick={() => setDiv(x.code)}>{x.label} <span style={{ opacity: .7, marginLeft: 4 }}>{x.teams.length}</span></button>
        ))}
      </div>
      <div className="s-teamgrid">
        {d.teams.map((t, i) => (
          <div key={i} className="s-team">
            <div className="s-team__seed">{t.seed}</div>
            <div className="s-team__body">
              <div className="s-team__nm">{t.name}</div>
              <div className="s-team__sub">{d.label}{t.group ? ` · ${t.group}조` : ""}</div>
            </div>
            <span className="s-chip s-chip--ok" style={{ fontSize: 11 }}>승인</span>
          </div>
        ))}
      </div>
    </div>);
}

// ── 결과 ────────────────────────────────────────────────────
function ResultsPage({ st }) {
  const vis = st.sec.results;
  if (vis === "hide") return (
    <div className="s-wrap">
      <h1 className="s-page-h">대회 결과</h1>
      <Prep icon="emoji_events" title="결과 집계 전"
        desc="경기가 시작되면 결과가 실시간으로 반영됩니다. 최종 순위는 대회 종료 후 확정됩니다."
        src="src: status !== 'ended'" />
    </div>);
  const r = P.finalResult;
  const live = vis === "partial";
  return (
    <div className="s-wrap">
      <h1 className="s-page-h">대회 결과</h1>
      <p className="s-page-sub">{live ? "진행 중 — 집계는 종료 후 확정됩니다" : "최종 순위 · 오픈부"}</p>
      {live ? (
        <div className="s-card s-card--pad" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="s-livedot" />
          <div><div style={{ fontWeight: 800 }}>경기 진행 중</div><div style={{ color: "var(--s-mute)", fontSize: 13.5, marginTop: 3 }}>완료 경기는 일정 탭에서 확인할 수 있습니다. 최종 순위·MVP는 대회 종료 후 발표됩니다.</div></div>
        </div>
      ) : (
        <>
          <div className="s-podium">
            <div className="s-pod"><div className="s-pod__r">준우승</div><div className="s-pod__t">{r.runnerUp}</div></div>
            <div className="s-pod s-pod--1"><div className="s-pod__r"><Ms name="trophy" style={{ fontSize: 15 }} /> 우승</div><div className="s-pod__t">{r.champion}</div></div>
            <div className="s-pod"><div className="s-pod__r">3위</div><div className="s-pod__t">{r.third}</div></div>
          </div>
          <div className="s-sec"><h2>대회 MVP</h2></div>
          <div className="s-card s-card--pad" style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div className="s-team__seed" style={{ width: 38, height: 38, fontSize: 16 }}><Ms name="star" style={{ fontSize: 20 }} /></div>
            <div><div style={{ fontWeight: 800, fontSize: 16 }}>{r.mvp.name}</div><div style={{ color: "var(--s-mute)", fontSize: 13 }}>{r.mvp.team}</div></div>
          </div>
          <div className="s-sec"><h2>기록 · 기사</h2></div>
          {r.hasStats ? null : (
            <Prep icon="article" title="공식 기록 준비 중"
              desc="대회 공식 스탯과 기사는 집계 후 게시됩니다. 준비되면 이 영역에 공개됩니다."
              src="src: hasStats === false (mock 기사 미생성)" />
          )}
        </>
      )}
    </div>);
}

// ── 셸 + 미리보기 ────────────────────────────────────────────
const TABS = [
  { id: "home", label: "홈", sec: "overview", Comp: HomePage },
  { id: "schedule", label: "일정", sec: "schedule", Comp: SchedulePage },
  { id: "bracket", label: "대진", sec: "bracket", Comp: BracketPage },
  { id: "teams", label: "참가팀", sec: "teams", Comp: TeamsPage },
  { id: "results", label: "결과", sec: "results", Comp: ResultsPage },
];

function PublicSitePreview() {
  const [stateId, setStateId] = useState(() => localStorage.getItem("pv.state") || "published");
  const [tab, setTab] = useState("home");
  const [navOpen, setNavOpen] = useState(false);
  const st = P.STATES.find((s) => s.id === stateId) || P.STATES[4];
  const m = P.meta;

  const pickState = (id) => { setStateId(id); localStorage.setItem("pv.state", id); const tabSec = TABS.find(t => t.id === tab)?.sec; const v = P.STATES.find(s => s.id === id).sec[tabSec]; if (v === "hide") setTab("home"); };
  const visibleTabs = TABS.filter((t) => t.sec === "overview" || st.sec[t.sec] !== "hide");
  const Active = (TABS.find((t) => t.id === tab) || TABS[0]).Comp;

  return (
    <div>
      {/* 미리보기 제어 바 */}
      <div className="pv-topbar">
        <div className="pv-in">
          <div className="pv-title"><Ms name="visibility" />발행 상태 미리보기 <span style={{ opacity: .5, fontWeight: 600 }}>· bdr-summer-4.mybdr.kr</span></div>
          <div className="pv-states">
            {P.STATES.map((s, i) => (
              <button key={s.id} className="pv-state" data-on={s.id === stateId} onClick={() => pickState(s.id)}>
                <span className="n">{String(i + 1).padStart(2, "0")}</span>{s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="pv-hint"><div className="pv-hint__in"><Ms name="info" /><span><b>{st.label}</b> — {st.hint}</span></div></div>

      {/* BDR 공개 사이트 */}
      <div className="site">
        <div className="s-topbar"><div className="s-topbar__in">
          <span className="s-topbar__sub">{m.subdomain}.mybdr.kr</span>
          <span className="s-topbar__links">{m.org} · {m.region}</span>
        </div></div>
        <nav className="s-nav"><div className="s-nav__in">
          <div className="s-brand"><div className="s-brand__mark">B</div><div><div>{m.name}</div><div className="s-brand__sub">{m.series}</div></div></div>
          <div className="s-tabs" data-open={navOpen}>
            {visibleTabs.map((t) => (
              <button key={t.id} className="s-tab" aria-current={t.id === tab} onClick={() => { setTab(t.id); setNavOpen(false); }}>{t.label}</button>
            ))}
          </div>
          <button className="s-burger" onClick={() => setNavOpen((o) => !o)}><Ms name={navOpen ? "close" : "menu"} /></button>
        </div></nav>

        {/* 히어로 (홈에서만) */}
        {tab === "home" && (
          <div className="s-hero"><div className="s-hero__in">
            <span className="s-hero__badge"><span className="dot" />{st.statusLabel}</span>
            <h1>{m.name}</h1>
            <p className="s-hero__tag">{m.tagline}</p>
            <div className="s-hero__meta">
              <div className="it"><span className="k">기간</span><span className="v">{m.period}</span></div>
              <div className="it"><span className="k">장소</span><span className="v">{m.venue}</span></div>
              <div className="it"><span className="k">규모</span><span className="v">{st.sec.teams !== "hide" ? `${m.teamCount}팀` : `정원 ${m.maxTeams}팀`} · {m.divisionCount}종별</span></div>
            </div>
          </div></div>
        )}

        <main className="s-main"><Active st={st} /></main>

        <footer className="s-foot"><div className="s-foot__in">
          <div><div className="s-foot__brand">{m.name}</div><div className="s-foot__sub">{m.org} · MyBDR — 전국 농구 매칭 플랫폼</div></div>
          <div className="s-foot__sp">{["BDR 농구문화", "장충체육관", "MyBDR"].map((s) => <span key={s}>{s}</span>)}</div>
        </div></footer>
      </div>
    </div>);
}

window.PublicSitePreview = PublicSitePreview;
