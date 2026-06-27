/* global React, window */
// ============================================================
// bo-detail-2.jsx — 백오피스 Phase 2 상세 화면 (Batch 2: 회원·팀·단체)
//   UserDetail(회원 상세 + 계정 정지) · TeamDetail(팀 상세 + 선수 명단)
//   OrgDetail(단체 상세 + 인증 처리/서류)
//   bo-detail.jsx 컨벤션 그대로. 목록 → 상세 전환, "← 목록" 복귀.
//   모든 서버 동작 = mock 토스트. toss-kit / admin-pages.css 재사용.
// ============================================================
(function () {
  const { useState } = React;
  const { Icon, Btn, Badge, Toggle, Modal } = window;
  const av = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];
  const toast = (m) => window.adToast && window.adToast(m);

  function Field({ k, children, mono }) {
    return (
      <div className="bo-field">
        <span className="bo-field__k">{k}</span>
        <span className="bo-field__v" style={mono ? { fontFamily: "var(--ff-mono)" } : null}>{children}</span>
      </div>
    );
  }
  function Stat({ k, v, tone }) {
    return (
      <div className="bo-stat">
        <div className="bo-stat__v" data-tone={tone || ""}>{v}</div>
        <div className="bo-stat__k">{k}</div>
      </div>
    );
  }
  function Timeline({ items }) {
    return (
      <div className="bo-tl">
        {items.map((s, i) => (
          <div key={i} className="bo-tl__row">
            <div className="bo-tl__rail">
              <span className="bo-tl__dot" data-on={s.on === false ? "false" : "true"} data-tone={s.tone || "primary"} />
              <span className="bo-tl__line" />
            </div>
            <div className="bo-tl__body">
              <div className="bo-tl__t">{s.t}</div>
              <div className="bo-tl__time">{s.time}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── 상세 mock 데이터 (행 id 기준 보강, 없으면 derive) ─────────
  const UD = {
    1: { phone: "010-2841-5566", lastSeen: "2026.06.27 08:12", plan: "프리미엄", planTone: "primary", path: "카카오 간편가입", tourns: 6, paid: "₩412,000", reports: 0,
      teams: [{ name: "송파 불스", role: "주장", kind: "5x5", color: av[0] }, { name: "강남 새벽 크루", role: "멤버", kind: "3x3", color: av[2] }],
      tl: [{ t: "코트 예약 결제 — ₩45,000", time: "2026.06.26 11:08" }, { t: "픽업 게임 호스트 — 강남 5x5", time: "2026.06.24 19:30" }, { t: "BDR 서머 오픈 #4 참가 신청", time: "2026.06.15 10:02" }, { t: "회원 가입", time: "2025.03.11", tone: "ok" }] },
    2: { phone: "010-3920-1147", lastSeen: "2026.06.26 21:40", plan: "베이직", planTone: "grey", path: "이메일 가입", tourns: 2, paid: "₩75,000", reports: 0,
      teams: [{ name: "마포 레이커스", role: "멤버", kind: "5x5", color: av[1] }],
      tl: [{ t: "코트 예약 결제 실패 — 카드 거절", time: "2026.06.24 20:15", tone: "danger" }, { t: "용산 야간 픽업 참여", time: "2026.06.26 21:00" }, { t: "회원 가입", time: "2025.05.02", tone: "ok" }] },
    3: { phone: "010-7714-8820", lastSeen: "2026.06.27 07:55", plan: "팀 프로", planTone: "primary", path: "카카오 간편가입", tourns: 11, paid: "₩980,000", reports: 0,
      teams: [{ name: "성동 썬더", role: "주장", kind: "3x3", color: av[2] }, { name: "송파 불스", role: "멤버", kind: "5x5", color: av[0] }, { name: "직장인 농구회", role: "총무", kind: "5x5", color: av[5] }],
      tl: [{ t: "경기 리포트 제출 — B조 2경기", time: "2026.06.26 16:20" }, { t: "팀 운영 정산 — ₩120,000", time: "2026.06.20 14:00" }, { t: "회원 가입", time: "2024.11.20", tone: "ok" }] },
    4: { phone: "010-5562-3301", lastSeen: "2026.03.02 13:18", plan: "베이직", planTone: "grey", path: "애플 간편가입", tourns: 0, paid: "₩0", reports: 0,
      teams: [],
      tl: [{ t: "최근 90일 접속 없음 — 휴면 전환", time: "2026.06.01", tone: "warn" }, { t: "회원 가입", time: "2026.01.08", tone: "ok" }] },
    5: { phone: "010-2207-9954", lastSeen: "2026.06.22 22:03", plan: "베이직", planTone: "grey", path: "이메일 가입", tourns: 3, paid: "₩150,000", reports: 3,
      teams: [{ name: "해운대 게이트", role: "멤버", kind: "5x5", color: av[4] }],
      tl: [{ t: "계정 정지 — 약관 위반 신고 누적 3건", time: "2026.06.26 15:02", tone: "danger" }, { t: "비방성 댓글 신고 접수", time: "2026.06.20 18:40", tone: "warn" }, { t: "회원 가입", time: "2025.08.17", tone: "ok" }] },
    6: { phone: "010-8841-2276", lastSeen: "2026.06.27 09:10", plan: "프리미엄", planTone: "primary", path: "카카오 간편가입", tourns: 5, paid: "₩320,000", reports: 0,
      teams: [{ name: "수성 호크스", role: "주장", kind: "5x5", color: av[5] }, { name: "대구 주말 크루", role: "멤버", kind: "3x3", color: av[1] }],
      tl: [{ t: "프리미엄 구독 결제 — ₩9,900", time: "2026.06.25 09:30" }, { t: "코트 예약 — 수성 실내체육관", time: "2026.06.23 18:00" }, { t: "회원 가입", time: "2025.12.30", tone: "ok" }] },
  };
  function deriveUser(r) {
    return UD[r.id] || { phone: "비공개", lastSeen: "-", plan: "베이직", planTone: "grey", path: "이메일 가입", tourns: 0, paid: "₩0", reports: 0, teams: [], tl: [{ t: "회원 가입", time: r.joined, tone: "ok" }] };
  }

  const TD = {
    1: { captain: "박지호", avgAge: "27세", founded: "2023.04", win: 18, loss: 6, manner: "4.8", tourns: 7,
      roster: [{ name: "박지호", pos: "가드", role: "주장", color: av[2] }, { name: "김도윤", pos: "포워드", role: "부주장", color: av[0] }, { name: "정하준", pos: "센터", role: "멤버", color: av[4] }, { name: "강시우", pos: "가드", role: "멤버", color: av[5] }, { name: "이서준", pos: "포워드", role: "멤버", color: av[1] }],
      games: [{ t: "마포 레이커스", s: "68 : 61", w: true, time: "06.26" }, { t: "성동 썬더", s: "55 : 49", w: true, time: "06.20" }, { t: "용산 워리어스", s: "52 : 60", w: false, time: "06.14" }] },
    2: { captain: "최민재", avgAge: "29세", founded: "2022.07", win: 22, loss: 9, manner: "4.6", tourns: 9,
      roster: [{ name: "최민재", pos: "센터", role: "주장", color: av[3] }, { name: "이서준", pos: "가드", role: "멤버", color: av[1] }, { name: "한지훈", pos: "포워드", role: "멤버", color: av[6] }],
      games: [{ t: "송파 불스", s: "61 : 68", w: false, time: "06.26" }, { t: "노원 클리퍼스", s: "70 : 58", w: true, time: "06.18" }] },
    3: { captain: "박지호", avgAge: "24세", founded: "2024.02", win: 8, loss: 5, manner: "4.9", tourns: 3,
      roster: [{ name: "박지호", pos: "가드", role: "주장", color: av[2] }, { name: "강시우", pos: "포워드", role: "멤버", color: av[5] }, { name: "윤재호", pos: "가드", role: "멤버", color: av[7] }],
      games: [{ t: "용산 워리어스", s: "49 : 55", w: false, time: "06.21" }, { t: "은평 제트", s: "60 : 47", w: true, time: "06.12" }] },
    4: { captain: "최민재", avgAge: "31세", founded: "2021.09", win: 15, loss: 11, manner: "4.4", tourns: 8,
      roster: [{ name: "최민재", pos: "포워드", role: "주장", color: av[3] }, { name: "오태양", pos: "센터", role: "멤버", color: av[0] }],
      games: [{ t: "성동 썬더", s: "60 : 52", w: true, time: "06.14" }] },
    5: { captain: "김도윤", avgAge: "26세", founded: "2023.11", win: 11, loss: 8, manner: "4.7", tourns: 4,
      roster: [{ name: "김도윤", pos: "가드", role: "주장", color: av[0] }, { name: "정하준", pos: "포워드", role: "멤버", color: av[4] }],
      games: [{ t: "은평 제트", s: "47 : 60", w: false, time: "06.12" }] },
  };
  function deriveTeam(r) {
    return TD[r.id] || { captain: "-", avgAge: "-", founded: "-", win: 0, loss: 0, manner: "-", tourns: 0, roster: [], games: [] };
  }

  const OD = {
    1: { bizno: "214-87-66201", rep: "한승우", phone: "02-558-7700", reg: "2023.01.15", members: "1,420", settle: "₩86.4M",
      staff: [{ name: "한승우", role: "대표 운영자", color: av[0] }, { name: "김도윤", role: "대회 운영", color: av[1] }, { name: "이서준", role: "정산 담당", color: av[2] }],
      docs: [{ t: "사업자등록증", st: "확인됨", tone: "ok" }, { t: "통장 사본", st: "확인됨", tone: "ok" }, { t: "주최 실적 증빙", st: "확인됨", tone: "ok" }] },
    2: { bizno: "129-81-44120", rep: "정수민", phone: "02-336-1192", reg: "2025.02.20", members: "320", settle: "₩12.8M",
      staff: [{ name: "정수민", role: "대표 운영자", color: av[1] }, { name: "박지호", role: "대회 운영", color: av[2] }],
      docs: [{ t: "제휴 계약서", st: "확인됨", tone: "ok" }, { t: "사업자등록증", st: "확인됨", tone: "ok" }] },
    3: { bizno: "공공기관 (협회)", rep: "오정환", phone: "032-771-2200", reg: "2024.06.10", members: "880", settle: "₩31.2M",
      staff: [{ name: "오정환", role: "협회 사무국장", color: av[2] }, { name: "최민재", role: "대회 운영", color: av[3] }, { name: "강시우", role: "심판 배정", color: av[5] }],
      docs: [{ t: "협회 등록증", st: "확인됨", tone: "ok" }, { t: "임원 명부", st: "확인됨", tone: "ok" }] },
    4: { bizno: "미등록 (개인 동호회)", rep: "윤재호", phone: "010-4471-8830", reg: "2026.06.20", members: "64", settle: "₩0",
      staff: [{ name: "윤재호", role: "대표 운영자", color: av[3] }, { name: "한지훈", role: "총무", color: av[6] }],
      docs: [{ t: "신분증 사본", st: "확인됨", tone: "ok" }, { t: "사업자등록증", st: "미제출", tone: "warn" }, { t: "활동 실적 증빙", st: "검토중", tone: "warn" }] },
  };
  function deriveOrg(r) {
    return OD[r.id] || { bizno: "-", rep: "-", phone: "-", reg: "-", members: "-", settle: "₩0", staff: [], docs: [] };
  }

  // 공통 헤더
  function DetailHead({ eyebrow, title, sub, txid, actions }) {
    return (
      <div className="bo-detail-head">
        <div style={{ minWidth: 0 }}>
          <div className="ts-ph__eyebrow">{eyebrow}</div>
          <div className="ts-ph__title">{title}</div>
          {sub && <div className="ts-ph__sub">{sub}</div>}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{actions}</div>
      </div>
    );
  }

  // ── 회원 상세 ────────────────────────────────────────────
  window.UserDetail = function UserDetail({ row, onBack }) {
    const d = deriveUser(row);
    const [status, setStatus] = useState(row.badge);
    const [tone, setTone] = useState(row.tone);
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [reason, setReason] = useState("약관 위반 신고 누적");
    const suspended = status === "정지";

    const doSuspend = () => { setSuspendOpen(false); setStatus("정지"); setTone("danger"); toast(row.name + " 계정을 정지했습니다 (시연)"); };
    const unsuspend = () => { setStatus("활성"); setTone("ok"); toast(row.name + " 계정 정지를 해제했습니다 (시연)"); };

    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />사용자 목록</button>
        <DetailHead eyebrow="백오피스 · 회원 관리" title={row.name}
          sub={<>{row.sub} · 가입 <b style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-soft)" }}>{row.joined}</b></>}
          actions={<>
            <Btn variant="secondary" icon="mail" onClick={() => toast("쪽지 보내기 (시연)")}>쪽지</Btn>
            {suspended
              ? <Btn icon="rotate-ccw" onClick={unsuspend}>정지 해제</Btn>
              : <Btn variant="danger" icon="ban" onClick={() => setSuspendOpen(true)}>계정 정지</Btn>}
          </>} />

        {/* 신원 + 지표 */}
        <div className="ts-card" style={{ marginBottom: 20 }}>
          <div className="bo-hero">
            <span className="bo-hero__av" data-round="true" style={{ background: row.color }}>{row.name.slice(0, 1)}</span>
            <div className="bo-hero__meta">
              <div className="bo-hero__name">{row.name}</div>
              <div className="bo-hero__sub">{row.region} · {d.plan}</div>
              <div className="bo-hero__badges">
                <Badge tone={tone || "grey"}>{status}</Badge>
                <Badge tone={d.planTone}>{d.plan}</Badge>
              </div>
            </div>
          </div>
          <div className="bo-statgrid">
            <Stat k="소속 팀" v={String(d.teams.length) + "팀"} />
            <Stat k="참가 대회" v={d.tourns + "회"} />
            <Stat k="누적 결제" v={d.paid} tone="primary" />
            <Stat k="신고 누적" v={d.reports + "건"} tone={d.reports ? "danger" : ""} />
          </div>
        </div>

        <div className="ad-cols">
          {/* 계정 정보 */}
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 8 }}>계정 정보</div>
            <Field k="이메일" mono>{row.sub}</Field>
            <Field k="연락처" mono>{d.phone}</Field>
            <Field k="활동 지역">{row.region}</Field>
            <Field k="요금제">{d.plan}</Field>
            <Field k="가입 경로">{d.path}</Field>
            <Field k="가입일" mono>{row.joined}</Field>
            <Field k="최근 접속" mono>{d.lastSeen}</Field>
          </div>

          {/* 소속 팀 + 활동 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ad-panel">
              <div className="ad-panel__head"><div className="ad-panel__title">소속 팀</div><Badge tone="grey">{d.teams.length}</Badge></div>
              {d.teams.length ? (
                <div className="bo-roster">
                  {d.teams.map((t, i) => (
                    <div key={i} className="bo-rowitem">
                      <span className="bo-rowitem__av" data-square="true" style={{ background: t.color }}>{t.name.slice(0, 1)}</span>
                      <div className="bo-rowitem__body">
                        <div className="bo-rowitem__t">{t.name}</div>
                        <div className="bo-rowitem__s">{t.kind}</div>
                      </div>
                      <span className="bo-chip" data-tone={t.role === "주장" ? "primary" : ""}>{t.role}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>소속된 팀이 없습니다.</div>}
            </div>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 14 }}>최근 활동</div>
              <Timeline items={d.tl} />
            </div>
          </div>
        </div>

        <Modal open={suspendOpen} onClose={() => setSuspendOpen(false)} title="계정 정지" sub={row.name + " · " + row.sub}
          foot={<>
            <Btn variant="secondary" onClick={() => setSuspendOpen(false)}>취소</Btn>
            <Btn variant="danger" icon="ban" onClick={doSuspend}>정지 확정</Btn>
          </>}>
          <div className="ts-field">
            <label className="ts-field__label">정지 사유</label>
            <select className="ts-select" value={reason} onChange={e => setReason(e.target.value)}>
              <option>약관 위반 신고 누적</option>
              <option>비방·욕설 게시</option>
              <option>노쇼·매너 점수 미달</option>
              <option>결제 사기 의심</option>
              <option>기타</option>
            </select>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--danger-weak)", borderRadius: 12, alignItems: "flex-start" }}>
            <Icon name="alert-triangle" size={17} color="var(--danger)" style={{ marginTop: 1, flex: "0 0 auto" }} />
            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>정지 시 즉시 로그인·매칭·결제가 차단됩니다. 정지 해제 전까지 모든 활동이 제한됩니다.</div>
          </div>
        </Modal>
      </div>
    );
  };

  // ── 팀 상세 ──────────────────────────────────────────────
  window.TeamDetail = function TeamDetail({ row, onBack }) {
    const d = deriveTeam(row);
    const [st, setSt] = useState(row.st);
    const [stTone, setStTone] = useState(row.sttone);
    const total = d.win + d.loss;
    const winPct = total ? Math.round(d.win / total * 100) : 0;
    const dormant = st === "휴면";

    const toggleDorm = () => {
      if (dormant) { setSt("운영중"); setStTone("ok"); toast(row.name + " 팀을 운영중으로 전환했습니다 (시연)"); }
      else { setSt("휴면"); setStTone("mute"); toast(row.name + " 팀을 휴면 처리했습니다 (시연)"); }
    };

    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />팀 목록</button>
        <DetailHead eyebrow="백오피스 · 팀 관리" title={row.name}
          sub={<>{row.sub} · 활동 지역 <b style={{ color: "var(--ink-soft)" }}>{row.region}</b></>}
          actions={<>
            <Btn variant="secondary" icon="mail" onClick={() => toast("팀 대표에게 쪽지 (시연)")}>쪽지</Btn>
            <Btn variant={dormant ? "primary" : "secondary"} icon={dormant ? "play" : "pause"} onClick={toggleDorm}>{dormant ? "운영 재개" : "휴면 처리"}</Btn>
          </>} />

        <div className="ts-card" style={{ marginBottom: 20 }}>
          <div className="bo-hero">
            <span className="bo-hero__av" style={{ background: row.color }}>{row.name.slice(0, 1)}</span>
            <div className="bo-hero__meta">
              <div className="bo-hero__name">{row.name}</div>
              <div className="bo-hero__sub">{row.region} · 주장 {d.captain}</div>
              <div className="bo-hero__badges">
                <Badge tone={stTone === "mute" ? "grey" : "ok"}>{st}</Badge>
                <Badge tone={row.tone || "grey"}>{row.badge}</Badge>
              </div>
            </div>
          </div>
          <div className="bo-statgrid">
            <Stat k="선수" v={row.members} />
            <Stat k="참가 대회" v={d.tourns + "회"} />
            <Stat k="전적 (승-패)" v={d.win + "-" + d.loss} tone="primary" />
            <Stat k="매너 점수" v={d.manner} tone="ok" />
          </div>
        </div>

        <div className="ad-cols">
          {/* 선수 명단 */}
          <div className="ad-panel">
            <div className="ad-panel__head"><div className="ad-panel__title">선수 명단</div><Badge tone="grey">{d.roster.length}명</Badge></div>
            {d.roster.length ? (
              <div className="bo-roster">
                {d.roster.map((p, i) => (
                  <div key={i} className="bo-rowitem">
                    <span className="bo-rowitem__av" style={{ background: p.color }}>{p.name.slice(0, 1)}</span>
                    <div className="bo-rowitem__body">
                      <div className="bo-rowitem__t">{p.name}</div>
                      <div className="bo-rowitem__s">{p.pos}</div>
                    </div>
                    <span className="bo-chip" data-tone={p.role === "주장" ? "primary" : ""}>{p.role}</span>
                  </div>
                ))}
              </div>
            ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>등록된 선수가 없습니다.</div>}
          </div>

          {/* 팀 정보 + 최근 경기 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 8 }}>팀 정보</div>
              <Field k="창단" mono>{d.founded}</Field>
              <Field k="종별">{row.sub.split("· ").pop()}</Field>
              <Field k="주장">{d.captain}</Field>
              <Field k="평균 연령">{d.avgAge}</Field>
              <Field k="승률" mono>{winPct}%</Field>
              <div style={{ marginTop: 4 }}>
                <div className="bo-wl">
                  <span className="bo-wl__w" style={{ width: winPct + "%" }} />
                  <span className="bo-wl__l" style={{ width: (100 - winPct) + "%" }} />
                </div>
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 6 }}>최근 경기</div>
              {d.games.length ? (
                <div className="bo-roster">
                  {d.games.map((g, i) => (
                    <div key={i} className="bo-rowitem">
                      <span className="bo-chip" data-tone={g.w ? "ok" : "warn"}>{g.w ? "승" : "패"}</span>
                      <div className="bo-rowitem__body">
                        <div className="bo-rowitem__t">{g.t}</div>
                        <div className="bo-rowitem__s">{g.time}</div>
                      </div>
                      <span className="bo-rowitem__meta">{g.s}</span>
                    </div>
                  ))}
                </div>
              ) : <div className="ad-cell-muted" style={{ padding: "10px 0", fontWeight: 600 }}>경기 기록이 없습니다.</div>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── 단체 상세 ────────────────────────────────────────────
  window.OrgDetail = function OrgDetail({ row, onBack }) {
    const d = deriveOrg(row);
    const [badge, setBadge] = useState(row.badge);
    const [tone, setTone] = useState(row.tone);
    const [verifyOpen, setVerifyOpen] = useState(false);
    const pending = badge === "대기";

    const approve = () => { setVerifyOpen(false); setBadge("인증됨"); setTone("primary"); toast(row.name + " 단체를 인증 처리했습니다 (시연)"); };
    const reject = () => { setVerifyOpen(false); toast(row.name + " 인증 요청을 반려했습니다 (시연)"); };
    const revoke = () => { setBadge("대기"); setTone("warn"); toast(row.name + " 인증을 취소했습니다 (시연)"); };

    return (
      <div>
        <button className="ad-backlink" onClick={onBack}><Icon name="arrow-left" size={16} />단체 목록</button>
        <DetailHead eyebrow="백오피스 · 단체 관리" title={row.name}
          sub={<>{row.type} · 주최 대회 <b style={{ color: "var(--ink-soft)" }}>{row.tourn}</b></>}
          actions={<>
            <Btn variant="secondary" icon="file-text" onClick={() => toast("등록 서류 보기 (시연)")}>서류</Btn>
            {pending
              ? <Btn icon="badge-check" onClick={() => setVerifyOpen(true)}>인증 처리</Btn>
              : <Btn variant="danger" icon="shield-off" onClick={revoke}>인증 취소</Btn>}
          </>} />

        <div className="ts-card" style={{ marginBottom: 20 }}>
          <div className="bo-hero">
            <span className="bo-hero__av" style={{ background: row.color }}><Icon name="building-2" size={28} color="#fff" /></span>
            <div className="bo-hero__meta">
              <div className="bo-hero__name">{row.name}</div>
              <div className="bo-hero__sub">{row.type} · {row.sub}</div>
              <div className="bo-hero__badges">
                <Badge tone={tone || "grey"}>{badge === "인증됨" ? "인증됨" : "인증 대기"}</Badge>
                <Badge tone="grey">{row.type}</Badge>
              </div>
            </div>
          </div>
          <div className="bo-statgrid">
            <Stat k="주최 대회" v={row.tourn} />
            <Stat k="소속 회원" v={d.members} />
            <Stat k="운영진" v={d.staff.length + "명"} />
            <Stat k="누적 정산" v={d.settle} tone="primary" />
          </div>
        </div>

        <div className="ad-cols">
          {/* 단체 정보 */}
          <div className="ad-panel">
            <div className="ad-panel__title" style={{ marginBottom: 8 }}>단체 정보</div>
            <Field k="유형">{row.type}</Field>
            <Field k="사업자번호" mono>{d.bizno}</Field>
            <Field k="대표자">{d.rep}</Field>
            <Field k="연락처" mono>{d.phone}</Field>
            <Field k="등록일" mono>{d.reg}</Field>
            <Field k="인증 상태">{badge === "인증됨" ? "인증 완료" : "인증 검토 대기"}</Field>
          </div>

          {/* 운영진 + 인증 서류 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="ad-panel">
              <div className="ad-panel__head"><div className="ad-panel__title">운영진</div><Badge tone="grey">{d.staff.length}</Badge></div>
              <div className="bo-roster">
                {d.staff.map((s, i) => (
                  <div key={i} className="bo-rowitem">
                    <span className="bo-rowitem__av" style={{ background: s.color }}>{s.name.slice(0, 1)}</span>
                    <div className="bo-rowitem__body"><div className="bo-rowitem__t">{s.name}</div></div>
                    <span className="bo-chip" data-tone={i === 0 ? "primary" : ""}>{s.role}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-panel__title" style={{ marginBottom: 6 }}>인증 서류</div>
              <div className="bo-roster">
                {d.docs.map((doc, i) => (
                  <div key={i} className="bo-rowitem">
                    <span className="bo-rowitem__av" data-square="true" style={{ background: "var(--grey-100)" }}><Icon name="file-text" size={17} color="var(--ink-mute)" /></span>
                    <div className="bo-rowitem__body"><div className="bo-rowitem__t">{doc.t}</div></div>
                    <span className="bo-chip" data-tone={doc.tone}>{doc.st}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Modal open={verifyOpen} onClose={() => setVerifyOpen(false)} title="단체 인증 처리" sub={row.name + " · " + row.type}
          foot={<>
            <Btn variant="danger" icon="x" onClick={reject}>반려</Btn>
            <Btn icon="badge-check" onClick={approve}>인증 승인</Btn>
          </>}>
          <div style={{ marginBottom: 14 }}>
            {d.docs.map((doc, i) => (
              <div key={i} className="bo-featrow">
                <span className="bo-featrow__t">{doc.t}</span>
                <span className="bo-chip" data-tone={doc.tone}>{doc.st}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--primary-weak)", borderRadius: 12, alignItems: "flex-start" }}>
            <Icon name="info" size={17} color="var(--primary)" style={{ marginTop: 1, flex: "0 0 auto" }} />
            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>승인 시 단체에 대회 주최·정산 권한이 부여됩니다. 미제출 서류가 있으면 반려 후 보완을 요청하세요.</div>
          </div>
        </Modal>
      </div>
    );
  };
})();
