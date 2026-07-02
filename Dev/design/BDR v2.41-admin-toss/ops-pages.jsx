/* global React, window */
// ============================================================
// ops-pages.jsx — 대회 운영 워크스페이스(대회 운영.html)
//   요약 + 7패널(참가팀·대진표·일정·매치·정산·공개 사이트·운영 설정)
//   toss.css / admin-pages.css / toss-kit / admin-blocks 재사용.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Toggle, Modal, Empty, KpiGrid, DataTable, PageHead, AdSettings } = window;

  // ── 워크스페이스 스타일 1회 주입 ───────────────────────────
  if (!window.__wsInjected) {
    window.__wsInjected = true;
    const css = `
.ws-wrap { max-width: 100%; margin: 0; padding: 0; }
.ws-head { background: #fff; border: 1px solid var(--border); border-radius: 20px; padding: 22px 24px; box-shadow: var(--sh-sm); margin-bottom: 18px; }
.ws-head__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.ws-head__title { font-size: 25px; font-weight: 800; letter-spacing: -0.03em; color: var(--ink); display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ws-meta { display: flex; flex-wrap: wrap; gap: 8px 18px; margin-top: 14px; }
.ws-meta__i { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600; color: var(--ink-soft); }
.ws-meta__i .licon { color: var(--ink-dim); }
.ws-tabs { display: flex; gap: 4px; overflow-x: auto; scrollbar-width: none; border-bottom: 1px solid var(--border); margin-bottom: 24px; }
.ws-tabs::-webkit-scrollbar { display: none; }
.ws-tab { display: inline-flex; align-items: center; gap: 7px; padding: 13px 15px; border: 0; background: transparent; cursor: pointer; font-family: var(--ff); font-size: 14.5px; font-weight: 700; color: var(--ink-mute); border-bottom: 2.5px solid transparent; white-space: nowrap; transition: color .12s; }
.ws-tab:hover { color: var(--ink); }
.ws-tab[data-active="true"] { color: var(--primary); border-bottom-color: var(--primary); }
.ws-secttl { font-size: 16px; font-weight: 800; color: var(--ink); margin: 0 0 14px; }
.ws-card { background: #fff; border: 1px solid var(--border); border-radius: 18px; padding: 22px; box-shadow: var(--sh-sm); }
.ws-checkrow { display: flex; align-items: flex-start; gap: 13px; padding: 13px 0; border-top: 1px solid var(--border); }
.ws-checkrow:first-child { border-top: 0; }
.ws-checkrow__ico { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; flex: 0 0 auto; margin-top: 1px; }
.ws-checkrow__ico[data-st="done"] { background: var(--ok); color: #fff; }
.ws-checkrow__ico[data-st="current"] { background: var(--primary-weak); color: var(--primary); border: 2px solid var(--primary); }
.ws-checkrow__ico[data-st="todo"] { background: var(--grey-100); color: var(--ink-dim); }
.ws-checkrow__t { font-size: 14.5px; font-weight: 700; color: var(--ink); }
.ws-checkrow__s { font-size: 13px; color: var(--ink-mute); margin-top: 2px; }
.ws-info { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 0 24px; }
@media (max-width: 720px) { .ws-info { grid-template-columns: 1fr; } }
.ws-info__row { display: flex; gap: 14px; padding: 13px 0; border-top: 1px solid var(--border); }
.ws-info__k { font-size: 13px; font-weight: 700; color: var(--ink-mute); flex: 0 0 86px; }
.ws-info__v { font-size: 14px; font-weight: 600; color: var(--ink); min-width: 0; }
.ws-grid2 { display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; align-items: start; }
@media (max-width: 900px) { .ws-grid2 { grid-template-columns: 1fr; } }
/* 대진표 */
.ws-groups { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 16px; margin-bottom: 22px; }
@media (max-width: 720px) { .ws-groups { grid-template-columns: 1fr; } }
.ws-grp { background: #fff; border: 1px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: var(--sh-xs); }
.ws-grp__h { font-size: 13.5px; font-weight: 800; color: var(--ink); padding: 12px 16px; background: var(--grey-50); border-bottom: 1px solid var(--border); }
.ws-grp__row { display: grid; grid-template-columns: 22px 1fr 64px 52px; align-items: center; gap: 8px; padding: 11px 16px; border-top: 1px solid var(--border); font-size: 13.5px; }
.ws-grp__row:first-child { border-top: 0; }
.ws-grp__seed { font-family: var(--ff-mono); font-weight: 800; color: var(--ink-dim); font-size: 12px; }
.ws-grp__team { font-weight: 700; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-grp__wl { font-family: var(--ff-mono); font-weight: 700; color: var(--ink-soft); text-align: center; }
.ws-grp__pf { font-family: var(--ff-mono); color: var(--ink-mute); text-align: right; }
.ws-ko { display: flex; gap: 16px; overflow-x: auto; padding-bottom: 6px; }
.ws-ko__round { min-width: 220px; flex: 1; }
.ws-ko__rl { font-size: 12.5px; font-weight: 800; color: var(--ink-mute); margin-bottom: 10px; }
.ws-ko__m { background: #fff; border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; margin-bottom: 12px; box-shadow: var(--sh-xs); }
.ws-ko__side { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 4px 0; }
.ws-ko__nm { font-size: 13.5px; font-weight: 700; color: var(--ink); min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ws-ko__nm[data-dim="true"] { color: var(--ink-dim); font-weight: 600; }
.ws-ko__sc { font-family: var(--ff-mono); font-weight: 800; font-size: 14px; color: var(--ink); flex: 0 0 auto; }
.ws-ko__sc[data-win="true"] { color: var(--primary); }
/* 일정 */
.ws-day { margin-bottom: 22px; }
.ws-day__h { font-size: 14px; font-weight: 800; color: var(--ink); margin-bottom: 10px; }
.ws-slot { display: grid; grid-template-columns: 64px 72px 1fr 80px; align-items: center; gap: 12px; background: #fff; border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; margin-bottom: 8px; box-shadow: var(--sh-xs); }
@media (max-width: 720px) { .ws-slot { grid-template-columns: 56px 1fr; row-gap: 4px; } }
.ws-slot__time { font-family: var(--ff-mono); font-weight: 800; font-size: 14px; color: var(--primary); }
.ws-slot__court { font-size: 12.5px; font-weight: 700; color: var(--ink-mute); }
.ws-slot__match { font-size: 14px; font-weight: 700; color: var(--ink); min-width: 0; }
.ws-slot__div { font-size: 12px; color: var(--ink-mute); margin-top: 1px; }
/* 정산 요약 */
.ws-settle { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 14px; margin-bottom: 22px; }
@media (max-width: 900px) { .ws-settle { grid-template-columns: repeat(2, minmax(0,1fr)); } }
@media (max-width: 480px) { .ws-settle { grid-template-columns: 1fr; } }
.ws-stcard { background: #fff; border: 1px solid var(--border); border-radius: 16px; padding: 18px; box-shadow: var(--sh-xs); min-width: 0; }
.ws-stcard__l { font-size: 13px; font-weight: 600; color: var(--ink-mute); }
.ws-stcard__v { font-size: 21px; font-weight: 800; letter-spacing: -0.02em; margin-top: 8px; font-family: var(--ff-mono); }
.ws-stcard__h { font-size: 12px; color: var(--ink-dim); margin-top: 6px; }
/* 공개 사이트 */
.ws-pubrow { display: flex; align-items: center; gap: 14px; padding: 15px 0; border-top: 1px solid var(--border); }
.ws-pubrow:first-child { border-top: 0; }
.ws-pubrow__b { flex: 1; min-width: 0; }
.ws-pubrow__t { font-size: 14.5px; font-weight: 700; color: var(--ink); }
.ws-pubrow__d { font-size: 12.5px; color: var(--ink-mute); margin-top: 2px; }
.ws-urlbar { display: flex; align-items: center; gap: 10px; background: var(--grey-50); border: 1px solid var(--border); border-radius: 12px; padding: 12px 16px; margin-bottom: 18px; }
.ws-urlbar__u { flex: 1; min-width: 0; font-family: var(--ff-mono); font-weight: 700; font-size: 14px; color: var(--ink); overflow: hidden; text-overflow: ellipsis; }
`;
    const s = document.createElement('style');
    s.id = 'ws-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // ── 요약 ───────────────────────────────────────────────────
  function Summary({ go }) {
    const t = window.WS_TOUR;
    return (
      <div>
        <KpiGrid items={window.WS_KPI} />
        <div className="ws-grid2">
          <div className="ws-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div className="ws-secttl" style={{ margin: 0 }}>운영 진행 상태</div>
              <Badge tone="warn">1단계 확인 필요</Badge>
            </div>
            {window.WS_CHECKLIST.map((c, i) => (
              <div key={i} className="ws-checkrow">
                <span className="ws-checkrow__ico" data-st={c.st}>
                  <Icon name={c.st === "done" ? "check" : c.st === "current" ? "dot" : "circle"} size={c.st === "done" ? 15 : 8} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ws-checkrow__t">{c.t}</div>
                  <div className="ws-checkrow__s">{c.s}</div>
                </div>
                {c.st === "current" && <Btn size="sm" variant="secondary" onClick={() => go("matches")}>이동</Btn>}
              </div>
            ))}
          </div>
          <div className="ws-card">
            <div className="ws-secttl">최근 활동</div>
            <div className="ad-list">
              {window.WS_ACTIVITY.map((a) => (
                <div key={a.id} className="ad-listrow">
                  <span className="ad-listrow__icon" style={{ background: "var(--grey-100)" }}><Icon name={a.icon} size={16} color={window.adToneColor(a.tone)} /></span>
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

        <div className="ws-card" style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <div className="ws-secttl" style={{ margin: 0 }}>대회 정보</div>
            <Btn size="sm" variant="secondary" icon="edit-3" onClick={() => { location.href = "대회 수정.html"; }}>수정</Btn>
          </div>
          <div className="ws-info">
            {t.sections.map((s, i) => (
              <div key={i} className="ws-info__row" style={i < 2 ? { borderTop: 0 } : undefined}>
                <span className="ws-info__k">{s.k}</span>
                <span className="ws-info__v">{s.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 참가팀 ─────────────────────────────────────────────────
  function Teams() {
    const [f, setF] = useState("all");
    const rows = window.WS_TEAMS.filter((t) => f === "all" || t.status === f);
    const cols = [
      { key: "team", label: "팀", w: "minmax(0,1.8fr)" },
      { key: "div", label: "종별", w: "minmax(0,1fr)" },
      { key: "players", label: "인원", w: "70px", align: "center" },
      { key: "pay", label: "납부", w: "90px", align: "center" },
      { key: "coach", label: "코치", w: "80px", align: "center" },
      { key: "status", label: "상태", w: "150px", align: "right" },
    ];
    return (
      <div>
        <div className="ad-toolbar">
          <div className="ad-filters">{window.WS_TEAM_FILTERS.map(([id, l]) => (
            <button key={id} className="ts-chip" data-active={f === id ? "true" : "false"} onClick={() => setF(id)}>{l}</button>
          ))}</div>
          <div style={{ flex: 1 }} />
          <Btn variant="secondary" size="sm" icon="upload" onClick={() => window.adToast("CSV 가져오기 (시연)")}>가져오기</Btn>
          <Btn size="sm" icon="plus" onClick={() => window.adToast("참가팀 추가 (시연)")}>팀 추가</Btn>
        </div>
        <DataTable cols={cols} rows={rows} empty="해당 상태의 팀이 없습니다"
          render={(r, k) => {
            if (k === "team") return <div className="ad-cell-flex"><span className="ad-avatar-sm" style={{ background: r.color }}>{r.name.slice(0, 1)}</span><div style={{ minWidth: 0 }}><div className="ad-cell-strong">{r.name}</div><div className="ad-cell-sub">{r.captain} · 주장</div></div></div>;
            if (k === "div") return <span className="ad-cell-muted">{r.div}</span>;
            if (k === "players") return <span className="ad-cell-mono">{r.players}</span>;
            if (k === "pay") return <span className="ad-statusline"><span className="ad-dot" data-tone={r.payTone === "ok" ? "ok" : r.payTone === "warn" ? "warn" : "danger"} />{r.pay}</span>;
            if (k === "coach") return <span className="ad-cell-muted">{r.coach}</span>;
            if (k === "status") return (
              <span className="ad-rowact" style={{ justifyContent: "flex-end" }}>
                {r.status === "대기"
                  ? <><Btn size="sm" onClick={() => window.adToast(r.name + " 승인됨")}>승인</Btn><Btn size="sm" variant="danger" onClick={() => window.adToast(r.name + " 거절됨")}>거절</Btn></>
                  : <Badge tone={r.statusTone}>{r.status}</Badge>}
              </span>
            );
          }} />
      </div>
    );
  }

  // ── 대진표 ─────────────────────────────────────────────────
  function Bracket() {
    const B = window.WS_BRACKET;
    const [div, setDiv] = useState(B.divisions[0]);
    const pub = B.published[div];
    return (
      <div>
        <div className="ad-toolbar">
          <div className="ad-filters">{B.divisions.map((d) => (
            <button key={d} className="ts-chip" data-active={d === div ? "true" : "false"} onClick={() => setDiv(d)}>{d}</button>
          ))}</div>
          <div style={{ flex: 1 }} />
          <Badge tone={pub ? "ok" : "grey"}>{pub ? "발행됨" : "미발행"}</Badge>
          <Btn size="sm" variant={pub ? "secondary" : "primary"} icon={pub ? "rotate-cw" : "send"} onClick={() => window.adToast(pub ? "대진표 재생성 (시연)" : div + " 대진표 발행됨")}>{pub ? "재생성" : "발행"}</Btn>
        </div>

        {div === "오픈부" ? (
          <>
            <div className="ws-secttl">조별 예선</div>
            <div className="ws-groups">
              {B.groups.map((g) => (
                <div key={g.name} className="ws-grp">
                  <div className="ws-grp__h">{g.name}</div>
                  {g.rows.map((r, i) => (
                    <div key={i} className="ws-grp__row">
                      <span className="ws-grp__seed">{r.seed}</span>
                      <span className="ws-grp__team">{r.team}</span>
                      <span className="ws-grp__wl">{r.w}승 {r.l}패</span>
                      <span className="ws-grp__pf">{r.pf}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="ws-secttl">토너먼트</div>
            <div className="ws-ko">
              {B.knockout.map((rd) => (
                <div key={rd.round} className="ws-ko__round">
                  <div className="ws-ko__rl">{rd.round}</div>
                  {rd.matches.map((m, i) => (
                    <div key={i} className="ws-ko__m">
                      <div className="ws-ko__side">
                        <span className="ws-ko__nm" data-dim={m.home.includes("미정") ? "true" : "false"}>{m.home}</span>
                        <span className="ws-ko__sc" data-win={m.done && m.hs > m.as ? "true" : "false"}>{m.done ? m.hs : "–"}</span>
                      </div>
                      <div className="ws-ko__side">
                        <span className="ws-ko__nm" data-dim={m.away.includes("미정") ? "true" : "false"}>{m.away}</span>
                        <span className="ws-ko__sc" data-win={m.done && m.as > m.hs ? "true" : "false"}>{m.done ? m.as : "–"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : (
          <Empty icon="git-fork" title={div + " 대진표"} desc={pub ? "조별 + 토너먼트 대진이 생성되어 있습니다. (시연: 오픈부 상세 참고)" : "아직 대진표가 생성되지 않았습니다."}>
            {!pub && <Btn icon="zap" onClick={() => window.adToast(div + " 대진 자동 생성 (시연)")}>자동 생성</Btn>}
          </Empty>
        )}
      </div>
    );
  }

  // ── 일정 ───────────────────────────────────────────────────
  function Schedule() {
    return (
      <div>
        <div className="ad-toolbar">
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-mute)" }}>2코트 · 자동 편성 27경기</span>
          <div style={{ flex: 1 }} />
          <Btn variant="secondary" size="sm" icon="zap" onClick={() => window.adToast("일정 자동 재편성 (시연)")}>자동 편성</Btn>
          <Btn size="sm" icon="plus" onClick={() => window.adToast("경기 수동 추가 (시연)")}>경기 추가</Btn>
        </div>
        {window.WS_SCHEDULE.map((d) => (
          <div key={d.day} className="ws-day">
            <div className="ws-day__h">{d.day}</div>
            {d.slots.map((s, i) => (
              <div key={i} className="ws-slot">
                <span className="ws-slot__time">{s.time}</span>
                <span className="ws-slot__court">{s.court}</span>
                <div style={{ minWidth: 0 }}>
                  <div className="ws-slot__match">{s.home} <span style={{ color: "var(--ink-dim)" }}>vs</span> {s.away}</div>
                  <div className="ws-slot__div">{s.div}</div>
                </div>
                <span style={{ textAlign: "right" }}><Badge tone={s.stTone}>{s.st}</Badge></span>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── 매치 (+ ScoreModal) ────────────────────────────────────
  function Matches() {
    const [f, setF] = useState("all");
    const [score, setScore] = useState(null);
    const rows = window.WS_MATCHES.filter((m) => f === "all" || m.st === f);
    const cols = [
      { key: "title", label: "경기", w: "minmax(0,2.2fr)" },
      { key: "rec", label: "기록", w: "100px", align: "center" },
      { key: "ref", label: "심판", w: "100px", align: "center" },
      { key: "score", label: "스코어", w: "110px", align: "center" },
      { key: "st", label: "상태", w: "90px", align: "right" },
    ];
    return (
      <div>
        <div className="ad-toolbar">
          <div className="ad-filters">{window.WS_MATCH_FILTERS.map(([id, l]) => (
            <button key={id} className="ts-chip" data-active={f === id ? "true" : "false"} onClick={() => setF(id)}>{l}</button>
          ))}</div>
        </div>
        <DataTable cols={cols} rows={rows} onRow={(r) => setScore(r)} empty="해당 상태의 경기가 없습니다"
          render={(r, k) => {
            if (k === "title") return <div><div className="ad-cell-strong">{r.title}</div><div className="ad-cell-sub">{r.div} · {r.time}</div></div>;
            if (k === "rec") return <span className="ad-cell-muted">{r.rec}</span>;
            if (k === "ref") return r.ref === "미배정" ? <span className="ad-statusline"><span className="ad-dot" data-tone="danger" />미배정</span> : <span className="ad-cell-muted">{r.ref}</span>;
            if (k === "score") return <span className="ad-cell-mono" style={{ fontSize: 14 }}>{r.score}</span>;
            if (k === "st") return <span style={{ display: "block", textAlign: "right" }}><Badge tone={r.stTone}>{r.st}</Badge></span>;
          }} />

        <Modal open={!!score} onClose={() => setScore(null)} title={score ? score.title : ""} sub={score ? score.div + " · " + score.time : ""}
          foot={<><Btn variant="secondary" onClick={() => setScore(null)}>닫기</Btn><Btn icon="check" onClick={() => { setScore(null); window.adToast("스코어 저장됨 (시연)"); }}>저장</Btn></>}>
          {score && (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, padding: "8px 0 18px" }}>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>{score.title.split(" vs ")[0]}</div>
                  <input className="ts-input" defaultValue={score.score.split(":")[0].trim().replace("—", "")} style={{ textAlign: "center", fontFamily: "var(--ff-mono)", fontSize: 24, fontWeight: 800 }} />
                </div>
                <span style={{ fontSize: 20, fontWeight: 800, color: "var(--ink-dim)" }}>:</span>
                <div style={{ textAlign: "center", flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-soft)", marginBottom: 8 }}>{score.title.split(" vs ")[1]}</div>
                  <input className="ts-input" defaultValue={score.score.split(":")[1].trim().replace("—", "")} style={{ textAlign: "center", fontFamily: "var(--ff-mono)", fontSize: 24, fontWeight: 800 }} />
                </div>
              </div>
              <div className="ts-field">
                <label className="ts-field__label">기록 방식</label>
                <div className="ts-segment">
                  {["앱 기록", "수기 기록"].map((m) => <button key={m} className="ts-segment__btn" data-active={score.rec === m ? "true" : "false"}>{m}</button>)}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    );
  }

  // ── 정산 ───────────────────────────────────────────────────
  function Settle() {
    const S = window.WS_SETTLE;
    const toneC = { ok: "var(--ok)", danger: "var(--danger)", primary: "var(--primary)" };
    return (
      <div>
        <div className="ws-settle">
          {S.summary.map((c, i) => (
            <div key={i} className="ws-stcard">
              <div className="ws-stcard__l">{c.label}</div>
              <div className="ws-stcard__v" style={{ color: toneC[c.tone] }}>{c.value}</div>
              <div className="ws-stcard__h">{c.hint}</div>
            </div>
          ))}
        </div>
        <div className="ws-grid2">
          <div>
            <div className="ws-secttl">운영 지출</div>
            <DataTable
              cols={[{ key: "name", label: "항목", w: "minmax(0,1.8fr)" }, { key: "cat", label: "분류", w: "90px", align: "center" }, { key: "amount", label: "금액", w: "120px", align: "right" }, { key: "st", label: "상태", w: "100px", align: "right" }]}
              rows={S.expenses} empty="지출 내역이 없습니다"
              render={(r, k) => {
                if (k === "name") return <span className="ad-cell-strong">{r.name}</span>;
                if (k === "cat") return <span className="ad-cell-muted">{r.cat}</span>;
                if (k === "amount") return <span className="ad-cell-mono">{r.amount}</span>;
                if (k === "st") return <span style={{ display: "block", textAlign: "right" }}><Badge tone={r.stTone}>{r.st}</Badge></span>;
              }} />
          </div>
          <div>
            <div className="ws-secttl">참가비 수납</div>
            <DataTable
              cols={[{ key: "team", label: "팀", w: "minmax(0,1.4fr)" }, { key: "amount", label: "금액", w: "110px", align: "right" }, { key: "st", label: "상태", w: "90px", align: "right" }]}
              rows={S.pays} empty="수납 내역이 없습니다"
              render={(r, k) => {
                if (k === "team") return <span className="ad-cell-strong">{r.team}</span>;
                if (k === "amount") return <span className="ad-cell-mono">{r.amount}</span>;
                if (k === "st") return <span style={{ display: "block", textAlign: "right" }}><Badge tone={r.stTone}>{r.st}</Badge></span>;
              }} />
          </div>
        </div>
      </div>
    );
  }

  // ── 공개 사이트 ────────────────────────────────────────────
  function Site() {
    const P = window.WS_PUBLISH;
    const [on, setOn] = useState(() => P.sections.reduce((m, s) => (m[s.k] = s.on, m), {}));
    const count = Object.values(on).filter(Boolean).length;
    return (
      <div className="ws-grid2">
        <div className="ws-card">
          <div className="ws-secttl">발행 섹션 ({count}/{P.sections.length})</div>
          {P.sections.map((s) => (
            <div key={s.k} className="ws-pubrow">
              <div className="ws-pubrow__b">
                <div className="ws-pubrow__t">{s.label}</div>
                <div className="ws-pubrow__d">{s.desc}</div>
              </div>
              <Toggle on={on[s.k]} onChange={(v) => { setOn((o) => ({ ...o, [s.k]: v })); window.adToast(s.label + (v ? " 공개됨" : " 비공개됨")); }} />
            </div>
          ))}
        </div>
        <div className="ws-card">
          <div className="ws-secttl">공개 URL</div>
          <div className="ws-urlbar">
            <Icon name="globe" size={16} color="var(--ink-mute)" />
            <span className="ws-urlbar__u">{P.url}</span>
            <button className="ad-iconbtn" title="복사" onClick={() => window.adToast("URL 복사됨")}><Icon name="copy" size={15} /></button>
          </div>
          <Btn block iconRight="arrow-up-right" onClick={() => window.adToast("공개 사이트 미리보기 (시연)")}>사이트 미리보기</Btn>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 14, lineHeight: 1.6 }}>발행 전 섹션은 사이트에 노출되지 않습니다. 결과·기사 섹션은 대회 종료 후 공개를 권장합니다.</div>
        </div>
      </div>
    );
  }

  // ── 대회 관리자 콘솔 NAV (대회 관리자.html 과 동일 IA) ─────
  const OPS_NAV = [
    { label: "운영" },
    { id: "dash", icon: "layout-dashboard", text: "대시보드" },
    { id: "list", icon: "trophy", text: "대회 목록", badge: 6 },
    { label: "구성" },
    { id: "orgs", icon: "building-2", text: "단체·주최", badge: 5 },
    { id: "series", icon: "layers", text: "시리즈", badge: 5 },
    { id: "templates", icon: "layout-template", text: "템플릿", badge: 4 },
  ];
  const OPS_NAVIGATE = (id) => { location.href = "대회 관리자.html#" + id; };

  // ── 워크스페이스 셸 ────────────────────────────────────────
  window.TournamentOpsApp = function () {
    const t = window.WS_TOUR;
    const [tab, setTab] = useState((window.location.hash.replace("#", "")) || "summary");
    const go = (p) => { setTab(p); window.history.replaceState(null, "", "#" + p); window.scrollTo(0, 0); };

    let body;
    if (tab === "summary") body = <Summary go={go} />;
    else if (tab === "teams") body = <Teams />;
    else if (tab === "bracket") body = <Bracket />;
    else if (tab === "schedule") body = <Schedule />;
    else if (tab === "matches") body = <Matches />;
    else if (tab === "settle") body = <Settle />;
    else if (tab === "site") body = <Site />;
    else if (tab === "settings") body = <AdSettings eyebrow="대회 운영" title="운영 설정" sub="기록 방식·심판 배정·권한을 설정합니다." groups={window.WS_SETTINGS} />;
    else body = <Summary go={go} />;

    return (
      <window.AdminShell brand="MyBDR" brandSub="대회 관리자" nav={OPS_NAV} active="list" onNav={OPS_NAVIGATE}
        user={{ initial: "관", name: "BDR 농구문화", role: "대회 운영자" }}>
        <button className="ad-backlink" onClick={() => { location.href = "대회 관리자.html#list"; }}><Icon name="arrow-left" size={16} />대회 목록</button>
        <div className="ws-head">
          <div className="ws-head__top">
            <div style={{ minWidth: 0 }}>
              <div className="ws-head__title">{t.name}<Badge tone={t.statusTone}>{t.status}</Badge></div>
              <div className="ws-meta">
                <span className="ws-meta__i"><Icon name="building-2" size={15} />{t.org}</span>
                <span className="ws-meta__i"><Icon name="map-pin" size={15} />{t.venue} · {t.region}</span>
                <span className="ws-meta__i"><Icon name="calendar" size={15} />{t.date}</span>
                <span className="ws-meta__i"><Icon name="layers" size={15} />{t.series}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Btn variant="secondary" icon="edit-3" onClick={() => { location.href = "대회 수정.html"; }}>대회 수정</Btn>
              <Btn icon="arrow-up-right" onClick={() => go("site")}>공개 사이트</Btn>
            </div>
          </div>
        </div>

        <div className="ws-tabs">
          {window.WS_TABS.map((tb) => (
            <button key={tb.id} className="ws-tab" data-active={tab === tb.id ? "true" : "false"} onClick={() => go(tb.id)}>
              <Icon name={tb.icon} size={16} />{tb.label}
            </button>
          ))}
        </div>

        {body}
      </window.AdminShell>
    );
  };
})();
