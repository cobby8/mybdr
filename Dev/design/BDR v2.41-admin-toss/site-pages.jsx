/* global React, window */
// ============================================================
// site-pages.jsx — 공개 토너먼트 사이트 5페이지 + 셸
//   홈 / 일정 / 대진·결과 / 참가팀 / 참가신청
//   Material Symbols 아이콘, 디자인 토큰. mock 동작(토스트).
// ============================================================
(function () {
  const { useState, useEffect } = React;
  const S = window.SITE;

  // ── 단체 컨텍스트 (멀티테넌트) ────────────────────────
  //   ?org=<slug> 로 어느 단체의 공개 사이트인지 결정.
  //   primary(bdr-basketball)는 전체 콘텐츠, 그 외는 식별정보만 + 미리보기 상태.
  const ORG_DIRECTORY = {
    "hanriver-sports": { name: "한강 스포츠클럽", slug: "hanriver-sports", verified: true, founded: "2021", region: "서울 · 한강권역", tagline: "한강 일대 3x3·생활농구를 잇는 제휴 스포츠클럽" },
    "incheon-bba": { name: "인천농구협회", slug: "incheon-bba", verified: true, founded: "2008", region: "인천", tagline: "인천 지역 농구를 총괄하는 공식 협회" },
    "gangnam-crew": { name: "강남 바스켓 크루", slug: "gangnam-crew", verified: false, pending: true, founded: "2026", region: "서울 강남", tagline: "강남권 아마추어 농구 동호회" },
  };
  (function applyOrgContext() {
    try {
      const slug = new URLSearchParams(location.search).get("org");
      if (!slug || slug === S.org.slug) return; // primary → 전체 사이트
      const d = ORG_DIRECTORY[slug];
      if (!d) return; // 미등록 slug → primary 유지
      Object.assign(S.org, {
        name: d.name, slug: d.slug, verified: d.verified, tagline: d.tagline,
        founded: d.founded, region: d.region, about: d.tagline, mission: "",
        history: [], staff: [], notices: [], board: [], leagues: [], events: [],
        preview: true, pending: !!d.pending,
      });
    } catch (e) {}
  })();

  function Ico({ name, size = 20, style }) {
    return <span className="material-symbols-outlined" style={{ fontSize: size, lineHeight: 1, ...style }}>{name}</span>;
  }
  function EmptyNote({ children }) {
    return <div className="s-empty"><Ico name="inbox" size={22} style={{ color: "var(--s-dim)" }} />{children}</div>;
  }

  // ── 토스트 ──────────────────────────────────────────
  function useToast() {
    const [msg, setMsg] = useState(null);
    const show = (m) => { setMsg(m); clearTimeout(window.__sT); window.__sT = setTimeout(() => setMsg(null), 2200); };
    return [msg, show];
  }

  // ── 스코어 셀 ───────────────────────────────────────
  function Score({ hs, as }) {
    if (hs == null) return <span className="s-score lose">— : —</span>;
    const hw = hs > as, aw = as > hs;
    return <span className="s-score"><span className={hw ? "" : "lose"}>{hs}</span> : <span className={aw ? "" : "lose"}>{as}</span></span>;
  }
  function MatchNames({ home, away, hs, as }) {
    const hw = hs != null && hs > as, aw = hs != null && as > hs;
    return (
      <span className="s-match">
        <span className={hw ? "win" : ""}>{home}</span>
        <span className="vs">vs</span>
        <span className={aw ? "win" : ""}>{away}</span>
      </span>
    );
  }
  function statusChip(st) {
    if (st === "종료") return <span className="s-chip s-chip--mute">종료</span>;
    if (st === "예정") return <span className="s-chip s-chip--navy">예정</span>;
    if (st === "진행") return <span className="s-chip s-chip--red">진행중</span>;
    return <span className="s-chip s-chip--mute">{st}</span>;
  }

  // ════════════════════════════════════════════════════
  // 홈
  // ════════════════════════════════════════════════════
  function HomePage({ go, toast }) {
    const m = S.meta;
    const todayGames = S.schedule.find(d => d.games.some(g => g.status !== "종료")) || S.schedule[0];
    return (
      <>
        <div className="s-hero">
          <div className="s-hero__in">
            <span className="s-hero__badge"><span className="dot"></span>{m.status} · {m.series} {m.round}회</span>
            <h1>{m.name}</h1>
            <p className="s-hero__tag">{m.tagline}</p>
            <div className="s-hero__meta">
              <div className="it"><span className="k">기간</span><span className="v">{m.period}</span></div>
              <div className="it"><span className="k">장소</span><span className="v">{m.venue} · {m.region}</span></div>
              <div className="it"><span className="k">참가</span><span className="v">{m.teams} / {m.maxTeams}팀 · {m.divisions}종별</span></div>
            </div>
            <div className="s-hero__cta">
              <button className="s-btn s-btn--primary" onClick={() => go("reg")}><Ico name="how_to_reg" size={19} />참가 신청</button>
              <button className="s-btn s-btn--ghost" onClick={() => go("results")}><Ico name="account_tree" size={19} />대진·결과</button>
            </div>
          </div>
        </div>

        <div className="s-wrap">
          <div className="s-grid" style={{ gridTemplateColumns: "repeat(4, minmax(0,1fr))" }}>
            {[["groups", m.divisions, "종별"], ["diversity_3", m.teams, "참가 팀"], ["sports_basketball", m.games, "총 경기"], ["calendar_month", 7, "일간 진행"]].map(([ic, num, lab]) => (
              <div className="s-stat" key={lab} style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <span style={{ width: 42, height: 42, borderRadius: 9, background: "rgba(27,60,135,.08)", color: "var(--s-navy)", display: "grid", placeItems: "center", flex: "none" }}><Ico name={ic} size={23} /></span>
                <div style={{ minWidth: 0 }}><div className="num" style={{ fontSize: 24, whiteSpace: "nowrap" }}>{num}</div><div className="lab">{lab}</div></div>
              </div>
            ))}
          </div>

          <div className="s-sec"><h2>오늘의 경기 · {todayGames.date}</h2><a onClick={() => go("schedule")}>전체 일정 →</a></div>
          <table className="s-gtable">
            <thead><tr><th style={{ width: 64 }}>시간</th><th style={{ width: 80 }}>코트</th><th>대진</th><th style={{ width: 96 }}>종별</th><th style={{ width: 84, textAlign: "center" }}>스코어</th></tr></thead>
            <tbody>
              {todayGames.games.map(g => (
                <tr key={g.no}>
                  <td className="mono">{g.time}</td>
                  <td style={{ color: "var(--s-soft)" }}>{g.court}</td>
                  <td><MatchNames {...g} /></td>
                  <td><span className="s-chip s-chip--mute">{g.div}</span></td>
                  <td style={{ textAlign: "center" }}><Score hs={g.hs} as={g.as} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="s-sec"><h2>대회 공지</h2><a onClick={() => toast("공지 게시판 (시연)")}>전체 보기 →</a></div>
          {S.notices.map(n => (
            <div className="s-notice" key={n.id}>
              <span className="s-notice__d">{n.d}</span>
              <div className="s-notice__body">
                <div className="s-notice__t"><span className={"s-chip s-chip--" + (n.tone === "err" ? "red" : n.tone === "primary" ? "navy" : "ok")}>{n.tag}</span>{n.t}</div>
                <div className="s-notice__x">{n.body}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════
  // 일정
  // ════════════════════════════════════════════════════
  function SchedulePage() {
    const [div, setDiv] = useState("전체");
    const divs = ["전체", ...S.divisions.map(d => d.label)];
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">경기 일정</h1>
        <p className="s-page-sub">{S.meta.period} · {S.meta.venue}. 종별로 필터링할 수 있습니다.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {divs.map(d => (
            <button key={d} onClick={() => setDiv(d)} className={"s-chip " + (div === d ? "s-chip--navy" : "s-chip--mute")}
              style={{ cursor: "pointer", border: 0, fontSize: 13, padding: "7px 13px", fontFamily: "inherit" }}>{d}</button>
          ))}
        </div>
        {S.schedule.map(day => {
          const games = day.games.filter(g => div === "전체" || g.div === div);
          if (!games.length) return null;
          return (
            <div className="s-day" key={day.date}>
              <div className="s-day__h"><span className="d">{day.date}</span><span className="p">{day.phase}</span></div>
              <table className="s-gtable">
                <thead><tr><th style={{ width: 64 }}>시간</th><th style={{ width: 84 }}>코트</th><th>대진</th><th style={{ width: 110 }}>종별</th><th style={{ width: 84, textAlign: "center" }}>스코어</th><th style={{ width: 72, textAlign: "center" }}>상태</th></tr></thead>
                <tbody>
                  {games.map(g => (
                    <tr key={g.no}>
                      <td className="mono">{g.time}</td>
                      <td style={{ color: "var(--s-soft)" }}>{g.court}</td>
                      <td><MatchNames {...g} /></td>
                      <td><span className="s-chip s-chip--mute">{g.div}</span></td>
                      <td style={{ textAlign: "center" }}><Score hs={g.hs} as={g.as} /></td>
                      <td style={{ textAlign: "center" }}>{statusChip(g.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // 대진·결과
  // ════════════════════════════════════════════════════
  function ResultsPage() {
    const b = S.bracket;
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">대진 · 결과</h1>
        <p className="s-page-sub">조별 예선을 통과한 8팀의 본선 토너먼트 — {b.div}</p>
        <div className="s-card s-card--pad" style={{ marginBottom: 22 }}>
          <div className="s-bracket">
            {b.rounds.map(r => (
              <div className="s-bcol" key={r.name}>
                <div className="s-bcol__h"><span>{r.name}</span></div>
                <div className="s-bcol__body">
                  {r.games.map((g, i) => {
                    const hw = g.hs != null && g.hs > g.as, aw = g.hs != null && g.as > g.hs;
                    return (
                      <div className="s-bcell" key={i}>
                        <div className="s-bgame">
                          <div className={"s-brow" + (hw ? " s-brow--win" : "")}><span className="nm">{hw && <Ico name="check" size={15} />}{g.home}</span><span className="sc">{g.hs ?? "—"}</span></div>
                          <div className={"s-brow" + (aw ? " s-brow--win" : "")}><span className="nm">{aw && <Ico name="check" size={15} />}{g.away}</span><span className="sc">{g.as ?? "—"}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="s-sec"><h2>종별 진행 현황</h2></div>
        <div className="s-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))" }}>
          {S.divisions.map(d => (
            <div className="s-card s-card--pad" key={d.code}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flex: "none" }}></span>
                <span style={{ fontWeight: 700 }}>{d.label}</span>
              </div>
              <div style={{ fontSize: 13, color: "var(--s-mute)", display: "flex", justifyContent: "space-between" }}>
                <span>{d.format}</span><span className="mono" style={{ fontFamily: "var(--s-mono)", fontWeight: 700, color: "var(--s-soft)" }}>{d.teams}팀</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // 참가팀
  // ════════════════════════════════════════════════════
  function TeamsPage() {
    const [div, setDiv] = useState("전체");
    const divs = ["전체", ...S.divisions.map(d => d.label)];
    const teams = S.teamList.filter(t => div === "전체" || t.div === div);
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">참가 팀</h1>
        <p className="s-page-sub">총 {S.meta.teams}팀이 참가합니다. 종별로 필터링할 수 있습니다.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
          {divs.map(d => (
            <button key={d} onClick={() => setDiv(d)} className={"s-chip " + (div === d ? "s-chip--navy" : "s-chip--mute")}
              style={{ cursor: "pointer", border: 0, fontSize: 13, padding: "7px 13px", fontFamily: "inherit" }}>{d}</button>
          ))}
        </div>
        <div className="s-teamgrid">
          {teams.map(t => (
            <div className="s-team" key={t.id}>
              <span className="s-team__seed">{t.seed}</span>
              <div className="s-team__body">
                <div className="s-team__nm">{t.name}</div>
                <div className="s-team__sub">{t.region} · {t.div}</div>
              </div>
              <div style={{ textAlign: "right", flex: "none" }}>
                <div className="s-team__rec">{t.w}승 {t.l}패</div>
                <div style={{ marginTop: 4 }}><span className={"s-chip " + (["8강", "4강", "결승", "1위"].includes(t.status) ? "s-chip--ok" : "s-chip--mute")} style={{ fontSize: 11 }}>{t.status}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // 참가신청 — 로그인 + 내가 만든 팀 단위로만 신청 가능
  // ════════════════════════════════════════════════════
  function GateCard({ icon, title, body, primary, onPrimary, secondary, onSecondary }) {
    return (
      <div className="s-card s-gate">
        <span className="s-gate__icon"><Ico name={icon} size={30} /></span>
        <h2 className="s-gate__t">{title}</h2>
        <p className="s-gate__x">{body}</p>
        <div className="s-gate__cta">
          {primary && <button className="s-btn s-btn--primary" onClick={onPrimary}><Ico name="arrow_forward" size={18} />{primary}</button>}
          {secondary && <button className="s-btn s-btn--outline" onClick={onSecondary}>{secondary}</button>}
        </div>
      </div>
    );
  }

  function RegPage({ toast }) {
    const m = S.meta;
    const me = S.me;
    // 데모: 로그인 상태 미리보기 (실서비스에서는 세션 기반)
    const [demo, setDemo] = useState(me.loggedIn ? "teams" : "guest");
    const loggedIn = demo !== "guest";
    const myTeams = demo === "noteam" ? [] : me.teams;

    const [teamId, setTeamId] = useState(null);
    const [div, setDiv] = useState(null);
    const [agree, setAgree] = useState(false);

    const team = myTeams.find(t => t.id === teamId) || null;
    // 종별 자격: 팀 종목(3x3/5x5)이 일치 + 대표 권한 팀만 신청
    const eligibleDivs = team ? S.divisions.filter(d => d.label.includes(team.kind)) : [];
    const minMembers = team ? (team.kind === "3x3" ? 3 : 5) : 0;

    const selectTeam = (t) => {
      if (t.role !== "대표") { toast("팀 대표만 참가 신청할 수 있습니다"); return; }
      setTeamId(t.id);
      const elig = S.divisions.filter(d => d.label.includes(t.kind));
      setDiv(elig[0] ? elig[0].label : null);
    };
    const submit = (e) => {
      e.preventDefault();
      if (!team) { toast("신청할 팀을 선택해 주세요"); return; }
      if (!div) { toast("참가 종별을 선택해 주세요"); return; }
      if (team.members < minMembers) { toast(`최소 ${minMembers}명 이상 등록된 팀만 신청할 수 있습니다`); return; }
      if (!agree) { toast("참가 규정에 동의해 주세요"); return; }
      toast(`${team.name} · ${div} 참가 신청이 접수되었습니다 (시연)`);
    };

    const DemoBar = (
      <div className="s-demobar">
        <span className="s-demobar__lbl"><Ico name="visibility" size={16} />데모 미리보기</span>
        <div className="s-demobar__seg">
          {[["teams", "내 팀 보유"], ["noteam", "팀 없음"], ["guest", "미로그인"]].map(([v, l]) => (
            <button key={v} data-on={demo === v} onClick={() => { setDemo(v); setTeamId(null); setDiv(null); }}>{l}</button>
          ))}
        </div>
      </div>
    );

    return (
      <div className="s-wrap" style={{ maxWidth: 720 }}>
        <h1 className="s-page-h">참가 신청</h1>
        <p className="s-page-sub">{m.name} · 접수 마감 {m.regClose}</p>
        {DemoBar}

        <div className="s-callout" style={{ marginBottom: 22 }}>
          <Ico name="groups" size={20} style={{ color: "var(--s-navy)", flex: "none" }} />
          <span><b style={{ color: "var(--s-ink)" }}>팀 단위 신청만 가능합니다.</b> MyBDR 가입 후 <b style={{ color: "var(--s-ink)" }}>팀 생성을 완료한 팀의 대표</b>만 신청할 수 있으며, 개인·자유 팀명 신청은 받지 않습니다.</span>
        </div>

        {!loggedIn && (
          <GateCard icon="lock" title="로그인이 필요합니다"
            body="참가 신청은 MyBDR 회원만 가능합니다. 로그인 후 내 팀으로 신청해 주세요."
            primary="MyBDR 로그인" onPrimary={() => toast("MyBDR 로그인 (시연)")}
            secondary="회원가입" onSecondary={() => toast("회원가입 (시연)")} />
        )}

        {loggedIn && myTeams.length === 0 && (
          <GateCard icon="group_add" title="먼저 팀을 만들어 주세요"
            body={`${me.name}님은 아직 생성한 팀이 없습니다. 참가 신청은 팀 단위로만 가능합니다. 팀을 생성하고 팀원을 등록한 뒤 다시 신청해 주세요.`}
            primary="팀 만들기" onPrimary={() => toast("팀 생성 (시연)")} />
        )}

        {loggedIn && myTeams.length > 0 && (
          <form className="s-form" onSubmit={submit}>
            <div className="s-field">
              <label>신청할 내 팀 선택 *</label>
              <div className="s-teampick">
                {myTeams.map(t => {
                  const sel = teamId === t.id;
                  const canLead = t.role === "대표";
                  return (
                    <button type="button" key={t.id} className="s-teampick__card" data-sel={sel} data-disabled={!canLead}
                      onClick={() => selectTeam(t)}>
                      <span className="s-teampick__logo" style={{ background: t.color }}>{t.name.slice(0, 1)}</span>
                      <span className="s-teampick__body">
                        <span className="s-teampick__nm">{t.name}
                          {t.verified
                            ? <Ico name="verified" size={15} style={{ color: "var(--s-navy)", marginLeft: 4, verticalAlign: "-2px" }} />
                            : null}
                        </span>
                        <span className="s-teampick__sub">{t.kind} · {t.region} · 팀원 {t.members}명 · 내 역할 {t.role}</span>
                      </span>
                      <span className="s-teampick__radio" data-on={sel}>{sel && <Ico name="check" size={15} />}</span>
                      {!canLead && <span className="s-teampick__lock">대표만 신청</span>}
                    </button>
                  );
                })}
              </div>
              <p className="s-note">신청은 팀 <b>대표</b> 계정만 가능합니다. 팀 정보는 MyBDR 팀 관리에서 수정하세요.</p>
            </div>

            {team && (
              <>
                <div className="s-field">
                  <label>참가 종별 *</label>
                  {eligibleDivs.length > 0
                    ? <select className="s-select" value={div || ""} onChange={e => setDiv(e.target.value)}>
                        {eligibleDivs.map(d => <option key={d.code}>{d.label}</option>)}
                      </select>
                    : <div className="s-callout" style={{ background: "rgba(227,27,35,.05)", borderColor: "rgba(227,27,35,.16)" }}>
                        <Ico name="error" size={18} style={{ color: "var(--s-red)", flex: "none" }} />
                        <span>{team.name}은(는) <b>{team.kind}</b> 팀으로, 이 대회에 신청 가능한 {team.kind} 종별이 없습니다.</span>
                      </div>}
                  {eligibleDivs.length > 0 && <p className="s-note">{team.kind} 팀이므로 {team.kind} 종별에만 신청할 수 있습니다.</p>}
                </div>

                <div className="s-card s-card--pad" style={{ display: "grid", gap: 10 }}>
                  <div className="s-regrow"><span className="s-regrow__k">팀명</span><span className="s-regrow__v">{team.name}</span></div>
                  <div className="s-regrow"><span className="s-regrow__k">대표자</span><span className="s-regrow__v">{me.name}</span></div>
                  <div className="s-regrow"><span className="s-regrow__k">연락처</span><span className="s-regrow__v">{me.phone}</span></div>
                  <div className="s-regrow"><span className="s-regrow__k">등록 팀원</span>
                    <span className="s-regrow__v">{team.members}명
                      {team.members < minMembers
                        ? <span className="s-chip s-chip--red" style={{ marginLeft: 8 }}>최소 {minMembers}명 필요</span>
                        : <span className="s-chip s-chip--ok" style={{ marginLeft: 8 }}>참가 가능</span>}
                    </span>
                  </div>
                </div>

                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 13.5, color: "var(--s-soft)", cursor: "pointer", padding: "4px 0" }}>
                  <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} style={{ width: 18, height: 18, marginTop: 1, accentColor: "var(--s-navy)", flex: "none" }} />
                  <span>대회 참가 규정 및 개인정보 수집·이용에 동의합니다. (경기 영상·사진의 대회 홍보 활용 포함)</span>
                </label>
                <button type="submit" className="s-btn s-btn--primary s-btn--block" style={{ marginTop: 4 }}><Ico name="how_to_reg" size={19} />이 팀으로 참가 신청</button>
                <p className="s-note" style={{ textAlign: "center" }}>접수 후 입금 안내는 대표 연락처({me.phone})로 발송됩니다.</p>
              </>
            )}
          </form>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // 단체 홈 (org landing — 대회 사이트의 상위 단체 사이트)
  // ════════════════════════════════════════════════════
  function OrgHero({ org }) {
    return (
      <div className="s-orghero">
        <div className="s-orghero__in">
          <span className="s-orghero__logo">{org.name.slice(0, 1)}</span>
          <div className="s-orghero__txt">
            <span className="s-orghero__badge">{org.verified && <Ico name="verified" size={16} />}단체 사이트</span>
            <h1>{org.name}</h1>
            <p>{org.tagline}</p>
            <div className="s-orghero__meta">
              <span><b>{org.founded}</b> 설립</span>
              <span>{org.region}</span>
              <span>정규대회 <b>{org.leagues.length}</b></span>
              <span>일반대회 <b>{org.events.length}</b></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function OrgIntro({ org }) {
    return (
      <>
        <OrgHero org={org} />
        <div className="s-wrap">
          {org.mission && (
            <div className="s-callout" style={{ marginBottom: 24 }}>
              <Ico name="emoji_events" size={20} style={{ color: "var(--s-navy)", flex: "none" }} />
              <span><b style={{ color: "var(--s-ink)" }}>미션.</b> {org.mission}</span>
            </div>
          )}
          <div className="s-sec"><h2>단체 소개</h2></div>
          <div className="s-card s-card--pad" style={{ marginBottom: 26 }}><p style={{ margin: 0, color: "var(--s-soft)", lineHeight: 1.75 }}>{org.about}</p></div>
          <div className="s-sec"><h2>연혁</h2></div>
          {org.history.length ? (
            <div className="s-history">
              {org.history.map(h => (
                <div className="s-history__row" key={h.y}><span className="s-history__y">{h.y}</span><span className="s-history__t">{h.t}</span></div>
              ))}
            </div>
          ) : <EmptyNote>등록된 연혁이 없습니다.</EmptyNote>}
        </div>
      </>
    );
  }

  function OrgStructure({ org }) {
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">조직 구성</h1>
        <p className="s-page-sub">{org.name}를 운영하는 사람들입니다.</p>
        {org.staff.length ? (
          <div className="s-orgmembers">
            {org.staff.map(s => (
              <div className="s-member" key={s.name}>
                <span className="s-member__av" style={{ background: s.color }}>{s.name.slice(0, 1)}</span>
                <div style={{ minWidth: 0 }}><div className="s-member__nm">{s.name}</div><div className="s-member__role">{s.role}</div></div>
                <span className="s-member__since">{s.since}~</span>
              </div>
            ))}
          </div>
        ) : <EmptyNote>등록된 운영진 정보가 없습니다.</EmptyNote>}
      </div>
    );
  }

  function OrgNotice({ toast }) {
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">공지사항</h1>
        <p className="s-page-sub">{S.org.name}의 단체 공지와 안내사항입니다.</p>
        {S.org.notices.length ? S.org.notices.map(n => (
          <div className="s-notice" key={n.id} style={{ cursor: "pointer" }} onClick={() => toast(n.t + " (시연)")}>
            <span className="s-notice__d">{n.d.slice(5)}</span>
            <div className="s-notice__body">
              <div className="s-notice__t"><span className={"s-chip s-chip--" + (n.tone === "red" ? "red" : n.tone === "navy" ? "navy" : "ok")}>{n.tag}</span>{n.t}</div>
              <div className="s-notice__x">{n.body}</div>
            </div>
          </div>
        )) : <EmptyNote>등록된 공지가 없습니다.</EmptyNote>}
      </div>
    );
  }

  function OrgBoard({ toast }) {
    return (
      <div className="s-wrap">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 12, flexWrap: "wrap", marginBottom: 6 }}>
          <div><h1 className="s-page-h" style={{ marginBottom: 4 }}>자유게시판</h1><p className="s-page-sub" style={{ margin: 0 }}>회원들이 자유롭게 이야기하는 공간입니다.</p></div>
          <button className="s-btn s-btn--primary" onClick={() => toast("글쓰기 (시연)")}><Ico name="edit" size={18} />글쓰기</button>
        </div>
        {!S.org.board.length ? <EmptyNote>아직 게시글이 없습니다. 첫 글을 남겨보세요.</EmptyNote> :
        <table className="s-gtable s-board" style={{ marginTop: 18 }}>
          <thead><tr><th style={{ width: 60 }}>분류</th><th>제목</th><th style={{ width: 100 }}>작성자</th><th style={{ width: 64 }}>날짜</th><th style={{ width: 56, textAlign: "center" }}>댓글</th></tr></thead>
          <tbody>
            {S.org.board.map(p => (
              <tr key={p.id} onClick={() => toast(p.t + " (시연)")} style={{ cursor: "pointer" }}>
                <td><span className="s-chip s-chip--mute">{p.cat}</span></td>
                <td className="s-board__t">{p.t}{p.replies > 0 && <span className="s-board__rc">[{p.replies}]</span>}</td>
                <td style={{ color: "var(--s-soft)" }}>{p.author}</td>
                <td className="mono" style={{ color: "var(--s-mute)" }}>{p.date}</td>
                <td style={{ textAlign: "center", color: "var(--s-mute)" }}>{p.replies}</td>
              </tr>
            ))}
          </tbody>
        </table>}
      </div>
    );
  }

  function OrgEvents({ org, onTournament, onArchive, toast }) {
    const [tab, setTab] = useState("league");
    return (
      <div className="s-wrap">
        <h1 className="s-page-h">대회</h1>
        <p className="s-page-sub">{org.name}가 주최하는 정규대회와 일반대회입니다.</p>
        <div className="s-subtabs">
          <button data-on={tab === "league"} onClick={() => setTab("league")}><Ico name="workspace_premium" size={17} />정규대회</button>
          <button data-on={tab === "event"} onClick={() => setTab("event")}><Ico name="sports_basketball" size={17} />일반대회</button>
        </div>
        {tab === "league" ? (
          !org.leagues.length ? <EmptyNote>등록된 정규대회가 없습니다.</EmptyNote> :
          <div className="s-leagues">
            {org.leagues.map(lg => (
              <div className="s-league" key={lg.slug}>
                <div className="s-league__head">
                  <div style={{ minWidth: 0 }}>
                    <span className="s-league__badge"><Ico name="workspace_premium" size={14} />정규대회</span>
                    <h2>{lg.name}</h2>
                    <p>{lg.cadence} · {lg.since}년 출범 · 통산 <b>{lg.editions.length}회</b> 개최</p>
                  </div>
                  <span className="s-league__seal">{lg.editions.length}<span>회</span></span>
                </div>
                <div className="s-arch">
                  {lg.editions.map(e => (
                    <div className={"s-arch__row" + (e.current ? " is-current" : "")} key={e.round}
                      onClick={() => e.current ? onTournament() : onArchive(lg, e)}>
                      <span className="s-arch__no">{e.round}<i>회</i></span>
                      <div className="s-arch__body">
                        <div className="s-arch__nm">{e.current ? S.meta.name : e.name}{e.current && <span className="s-chip s-chip--red" style={{ marginLeft: 8 }}>{S.meta.status}</span>}</div>
                        <div className="s-arch__meta">{e.current ? S.meta.period : e.period} · {e.current ? S.meta.teams : e.teams}팀</div>
                      </div>
                      {e.current ? (
                        <span className="s-arch__go">바로가기 <Ico name="arrow_forward" size={15} /></span>
                      ) : (
                        <div className="s-arch__champ">
                          <Ico name="emoji_events" size={20} />
                          <div><span className="s-arch__champnm">{e.champion}</span><span className="s-arch__runner">준우승 {e.runnerup}</span></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          !org.events.length ? <EmptyNote>등록된 일반대회가 없습니다.</EmptyNote> :
          <div className="s-orgtlist">
            {org.events.map(t => (
              <button key={t.slug} className="s-orgtcard" onClick={() => toast(t.name + " 페이지는 준비 중입니다 (시연)")}>
                <div className="s-orgtcard__top"><span className={"s-chip s-chip--" + (t.tone === "red" ? "red" : t.tone === "navy" ? "navy" : "mute")}>{t.status}</span></div>
                <div className="s-orgtcard__nm">{t.name}</div>
                <div className="s-orgtcard__meta">{t.period} · {t.teams}팀</div>
                <div className="s-orgtcard__go">준비 중 <Ico name="arrow_forward" size={15} /></div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  // 셸
  // ════════════════════════════════════════════════════
  function archiveStandings(edition) {
    const pool = ["부평 코어", "송파 레인", "노원 윙스", "마포 게이트", "용산 피닉스", "구로 샤크스", "분당 하이츠", "수원 블룸"];
    const semis = pool.filter(n => n !== edition.champion && n !== edition.runnerup);
    return [
      { rank: 1, team: edition.champion, note: "우승" },
      { rank: 2, team: edition.runnerup, note: "준우승" },
      { rank: 3, team: semis[0], note: "공동 3위" },
      { rank: 4, team: semis[1], note: "공동 3위" },
    ];
  }

  function OrgArchive({ league, edition, onBack }) {
    const st = archiveStandings(edition);
    const finalScore = edition.finalScore || (league.slug === "bdr-league" ? "68 : 61" : "21 : 18");
    return (
      <div className="s-wrap">
        <button className="s-archback" onClick={onBack}><Ico name="arrow_back" size={16} />정규대회 아카이브</button>
        <div className="s-archhd">
          <span className="s-league__badge"><Ico name="workspace_premium" size={14} />{league.name} {edition.round}회</span>
          <h1>{edition.name}</h1>
          <p>{edition.period} · {edition.teams}팀 참가 · 종료</p>
        </div>
        <div className="s-champ">
          <Ico name="emoji_events" size={42} />
          <div className="s-champ__nm">{edition.champion}</div>
          <div className="s-champ__lb">우승</div>
          <div className="s-champ__sub">결승 {finalScore} · 준우승 {edition.runnerup}</div>
        </div>
        <div className="s-sec"><h2>최종 순위</h2></div>
        <table className="s-gtable">
          <thead><tr><th style={{ width: 60 }}>순위</th><th>팀</th><th style={{ width: 96 }}>결과</th></tr></thead>
          <tbody>{st.map(r => (
            <tr key={r.rank}><td><span className={"s-rankno" + (r.rank === 1 ? " gold" : r.rank === 2 ? " silver" : "")}>{r.rank}</span></td><td className="s-board__t">{r.team}</td><td><span className={"s-chip " + (r.rank === 1 ? "s-chip--ok" : "s-chip--mute")}>{r.note}</span></td></tr>
          ))}</tbody>
        </table>
        <div className="s-callout" style={{ marginTop: 22 }}><Ico name="history" size={18} style={{ color: "var(--s-navy)", flex: "none" }} /><span>지난 대회의 보존 기록입니다. 실시간 일정·대진·참가신청은 진행 중인 대회에서 제공됩니다.</span></div>
      </div>
    );
  }

  const TABS = [
    { id: "home", label: "홈" },
    { id: "schedule", label: "일정" },
    { id: "results", label: "대진·결과" },
    { id: "teams", label: "참가팀" },
    { id: "reg", label: "참가신청" },
  ];
  const ORG_TABS = [
    { id: "org-intro", label: "단체소개" },
    { id: "org-structure", label: "조직구성" },
    { id: "org-notice", label: "공지사항" },
    { id: "org-board", label: "자유게시판" },
    { id: "org-events", label: "대회" },
  ];

  function SiteApp() {
    const PREVIEW = !!S.org.preview;
    const [page, setPage] = useState(PREVIEW ? "org-intro" : "home"); // org-* | home|schedule|results|teams|reg
    const [menu, setMenu] = useState(false);
    const [arch, setArch] = useState(null);
    const [toast, showToast] = useToast();
    const m = S.meta; const org = S.org;
    const isOrg = page.indexOf("org-") === 0;
    const go = (p) => { setPage(p); setMenu(false); window.scrollTo({ top: 0 }); };
    const path = (isOrg || PREVIEW) ? `mybdr.kr/${org.slug}` : `mybdr.kr/${org.slug}/${m.slug}`;
    const navTabs = (isOrg || PREVIEW) ? ORG_TABS : TABS;

    const pages = {
      "org-intro": <OrgIntro org={org} />,
      "org-structure": <OrgStructure org={org} />,
      "org-notice": <OrgNotice toast={showToast} />,
      "org-board": <OrgBoard toast={showToast} />,
      "org-events": <OrgEvents org={org} onTournament={() => go("home")} onArchive={(lg, e) => { setArch({ lg, e }); go("org-archive"); }} toast={showToast} />,
      "org-archive": arch ? <OrgArchive league={arch.lg} edition={arch.e} onBack={() => go("org-events")} /> : <OrgIntro org={org} />,
      home: <HomePage go={go} toast={showToast} />,
      schedule: <SchedulePage />,
      results: <ResultsPage />,
      teams: <TeamsPage />,
      reg: <RegPage toast={showToast} />,
    };

    return (
      <div className="site">
        <div className="s-topbar">
          <div className="s-topbar__in">
            <span className="s-topbar__sub"><Ico name="lock" size={13} style={{ verticalAlign: "-2px", marginRight: 5 }} />{path}</span>
            <span className="s-topbar__links" style={{ display: "flex", gap: 16 }}>
              <a onClick={() => showToast("MyBDR 메인 (시연)")} style={{ cursor: "pointer" }}>MyBDR 메인</a>
              <a onClick={() => showToast("고객센터 (시연)")} style={{ cursor: "pointer" }}>도움말</a>
            </span>
          </div>
        </div>

        <nav className="s-nav">
          <div className="s-nav__in">
            <div className="s-brand" style={{ cursor: "pointer" }} onClick={() => go("org-intro")}>
              <span className="s-brand__mark">{org.name.slice(0, 1)}</span>
              <span>{org.name}{org.verified && <Ico name="verified" size={15} style={{ opacity: .9, marginLeft: 4, verticalAlign: "-2px" }} />}<div className="s-brand__sub">단체 사이트</div></span>
            </div>
            <div className="s-tabs" data-open={menu}>
              {navTabs.map(t => (
                <button key={t.id} className="s-tab" aria-current={page === t.id} onClick={() => go(t.id)}>{t.label}</button>
              ))}
            </div>
            <button className="s-burger" onClick={() => setMenu(o => !o)} aria-label="메뉴"><Ico name={menu ? "close" : "menu"} size={22} /></button>
          </div>
        </nav>

        {PREVIEW && (
          <div className="s-previewbar" data-pending={org.pending ? "true" : "false"}>
            <Ico name={org.pending ? "lock" : "visibility"} size={16} style={{ flex: "none" }} />
            <span>{org.pending
              ? "인증 대기 중 — 비공개 미리보기 (운영자·관리자 전용). 단체 인증 후 공개됩니다."
              : org.name + " 공개 사이트 미리보기 — 아직 등록된 대회가 없습니다."}</span>
          </div>
        )}

        {!isOrg && !PREVIEW && (
          <div className="s-crumb">
            <div className="s-crumb__in">
              <a onClick={() => go("org-intro")}>{org.name}</a>
              <Ico name="chevron_right" size={16} />
              <a onClick={() => go("org-events")}>{m.series}</a>
              <Ico name="chevron_right" size={16} />
              <span className="cur">{m.name} <i style={{ fontStyle: "normal", color: "var(--s-mute)", fontWeight: 600 }}>{m.round}회</i></span>
            </div>
          </div>
        )}

        <main className="s-main">{pages[page]}</main>

        <footer className="s-foot">
          <div className="s-foot__in">
            <div>
              <div className="s-foot__brand">{org.name}</div>
              <div className="s-foot__sub">{isOrg ? org.tagline : `${m.name} · 주최 ${org.name} · ${m.venue}`}</div>
            </div>
            <div className="s-foot__sp">
              {S.sponsors.map(s => <span key={s}>{s}</span>)}
            </div>
          </div>
        </footer>

        {toast && <div className="s-toast"><Ico name="check_circle" size={18} />{toast}</div>}
      </div>
    );
  }

  window.SiteApp = SiteApp;
})();
