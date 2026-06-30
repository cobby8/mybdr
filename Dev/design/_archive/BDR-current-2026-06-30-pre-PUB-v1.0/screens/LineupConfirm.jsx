/* global React */
// ============================================================
// BDR v2.31 — LineupConfirm (LC1 · Phase 11 · A 등급 신규)
// 운영 박제 대상: /lineup-confirm/[matchId]
//
// ★기록앱(bdr_stat_v3) roster_confirm_screen.dart 정합 재작성.
//   웹 /lineup-confirm = 팀장이 *본인 팀*만 사전 확정(상대팀 미노출 · frozen §).
//   기록앱 roster_confirm = 기록자가 양팀 확정(기록 시작 게이트). → 어휘·모델 동일,
//   레이아웃만 본인 팀 단일 컬럼 + 모바일 우선으로 적용.
//
// 앱 정합 모델 (lib/.../roster_confirm_screen.dart + roster_draft.dart):
//   · 역할 3상태: out(선택) → starter(선발) → bench(벤치) → out  (행 단일 탭 순환)
//       _cycleRole: out→선발=setAttending(t)+setStarter(t) / 선발→벤치=setStarter(f)
//                   / 벤치→out=setStarter(f)+setAttending(f)
//   · 정원: 선발 5(_kStarterMax) + 벤치 7(_kBenchMax) = 12명 등록
//   · 주장(isCaptain): 경기 단위 단일 토글 — 행의 C 버튼 (같은 팀 1명 단일강제 setCaptain)
//   · 코치(role=coach): 선수 명단에서 분리 → 코칭스태프 바(감독/코치 칩). 매니저 role 없음.
//   · 전체 해제(clearTeamEntry): 출석+선발만 비움(주장 플래그 미손댐)
//   · 실행취소(rosterDraft): 변경 직전 스냅샷 push → undo pop 재적용
//   · 게이트: 선발 5/5 충족 시 확정/기록 가능
//
// 진입: 대회 일정 / 내 경기 알림 라인업 확정 CTA · 직접 URL
// 복귀: 페이지헤더 "홈으로" (현행 동작 보존)
// ============================================================

const LC_ROLE = { out: 'out', starter: 'starter', bench: 'bench' }; // = _Role
const LC_STARTER_MAX = 5;  // _kStarterMax
const LC_BENCH_MAX = 7;    // _kBenchMax

function LineupConfirm() {
  // 시안 데모 — 운영은 match.status + roster 길이로 분기
  const [demo, setDemo] = React.useState('edit'); // edit | locked | empty | noteam

  // 등록 명단 (player) — 코치(role=coach)는 코칭스태프 바로 분리, 매니저 role 없음
  const REGISTERED = [
    { id: 'p1', no: 4,  name: '김도윤', nick: null, role: 'player' },
    { id: 'p2', no: 7,  name: '이준호', nick: null, role: 'player' },
    { id: 'p3', no: 9,  name: '박서진', nick: null, role: 'player' },
    { id: 'p4', no: 11, name: '최민재', nick: null, role: 'player' },
    { id: 'p5', no: 23, name: '정우성', nick: null, role: 'player' },
    { id: 'p6', no: 5,  name: '한지훈', nick: null, role: 'player' },
    { id: 'p7', no: 8,  name: '오세욱', nick: null, role: 'player' },
    { id: 'p8', no: 14, name: '강태현', nick: null, role: 'player' },
    { id: 'p9', no: 21, name: '윤재호', nick: null, role: 'player' },
    { id: 'p10', no: 32, name: '임건우', nick: null, role: 'player' },
    { id: 'p11', no: 42, name: '신동하', nick: null, role: 'player' },
    { id: 'p12', no: null, name: '배수빈', nick: '수비왕', role: 'player' },
  ];
  const COACHES = { head: '서명석', asst: '김재원' }; // role=coach 분리 → 감독/코치
  const TEAM = { name: '호크스', registered: REGISTERED.length };

  const locked = demo === 'locked';
  const isOperator = false;

  // 상태: 역할 맵 + 주장 + 처리단계 + undo 스택
  const initRoles = () => {
    const m = {};
    REGISTERED.forEach((p, i) => { m[p.id] = i < 5 ? LC_ROLE.starter : i < 9 ? LC_ROLE.bench : LC_ROLE.out; });
    return m;
  };
  const [roles, setRoles] = React.useState(initRoles);
  const [captain, setCaptain] = React.useState('p1');
  const [confirmed, setConfirmed] = React.useState(true);
  const [phase, setPhase] = React.useState('idle'); // idle | saving | saved
  const [history, setHistory] = React.useState([]); // rosterDraft 스냅샷 스택

  const roleOf = (id) => roles[id] || LC_ROLE.out;
  const starters = REGISTERED.filter(p => roleOf(p.id) === LC_ROLE.starter);
  const benchers = REGISTERED.filter(p => roleOf(p.id) === LC_ROLE.bench);
  const starterCount = starters.length;
  const benchCount = benchers.length;
  const ready = starterCount === LC_STARTER_MAX;
  const untouched = starterCount === 0 && benchCount === 0;
  const canConfirm = ready && !locked && phase !== 'saving';

  // 변경 직전 스냅샷 push (rosterDraft.push)
  const snapshot = () => setHistory(h => [...h, { roles: { ...roles }, captain }]);
  const markDirty = () => { setConfirmed(false); setPhase('idle'); };

  // 행 탭 = 역할 순환 (_cycleRole)
  const cycleRole = (p) => {
    if (locked) return;
    const cur = roleOf(p.id);
    let next;
    if (cur === LC_ROLE.out) {
      if (starterCount >= LC_STARTER_MAX && benchCount >= LC_BENCH_MAX) return; // 정원 12 초과 차단
      next = starterCount < LC_STARTER_MAX ? LC_ROLE.starter : LC_ROLE.bench; // 선발 우선
    } else if (cur === LC_ROLE.starter) {
      next = benchCount < LC_BENCH_MAX ? LC_ROLE.bench : LC_ROLE.out; // 벤치 만석이면 바로 out
    } else { // bench → out
      next = LC_ROLE.out;
    }
    snapshot(); markDirty();
    setRoles(r => ({ ...r, [p.id]: next }));
    // 출전 해제 시 주장도 해제 (주장 ⊆ 출전)
    if (next === LC_ROLE.out && captain === p.id) setCaptain(null);
  };

  // C 버튼 = 주장 단일 토글 (setCaptain — 같은 팀 1명)
  const toggleCaptain = (p, e) => {
    e.stopPropagation();
    if (locked || roleOf(p.id) === LC_ROLE.out) return; // 주장은 출전 선수만
    snapshot(); markDirty();
    setCaptain(c => c === p.id ? null : p.id);
  };

  // 전체 해제 (clearTeamEntry — 출석+선발만 비움)
  const clearAll = () => {
    if (locked || untouched) return;
    snapshot(); markDirty();
    const m = {}; REGISTERED.forEach(p => { m[p.id] = LC_ROLE.out; });
    setRoles(m);
  };

  // 실행취소 (rosterDraft.undo)
  const undo = () => {
    if (!history.length || locked) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setRoles(prev.roles); setCaptain(prev.captain); markDirty();
  };

  const onConfirm = () => {
    if (!canConfirm) return;
    setPhase('saving');
    setTimeout(() => { setPhase('saved'); setConfirmed(true); setHistory([]); }, 700);
  };
  const onRelease = () => {
    if (locked) return;
    const m = {}; REGISTERED.forEach(p => { m[p.id] = LC_ROLE.out; });
    snapshot(); setRoles(m); setCaptain(null); setConfirmed(false); setPhase('idle');
  };

  const statusMap = {
    edit:   { key: 'ready',       label: '준비' },
    locked: { key: 'in_progress', label: '진행 중' },
    empty:  { key: 'scheduled',   label: '예정' },
    noteam: { key: 'scheduled',   label: '예정' },
  };
  const st = statusMap[demo];

  // 선발 5슬롯 (번호 채움순 = 선택 순서 대용)
  const starterSlots = Array.from({ length: 5 }, (_, i) => starters[i] || null);

  // 메시지 (앱 _needMsg / 게이트 정합)
  let msg;
  if (locked) msg = { tone: 'err', icon: 'lock', text: <span><strong>이미 시작된 경기입니다.</strong> 라인업을 변경할 수 없습니다.</span> };
  else if (phase === 'saved' && confirmed) msg = { tone: 'ok', icon: 'check_circle', text: <span><strong>라인업이 확정되었습니다.</strong> 경기 시작 전까지 재확정할 수 있습니다.</span> };
  else if (!captain && starterCount > 0) msg = { tone: 'warn', icon: 'info', text: <span>주장(C)을 지정해주세요.</span> };
  else if (starterCount < LC_STARTER_MAX) msg = { tone: 'warn', icon: 'info', text: <span>선발 {LC_STARTER_MAX - starterCount}명을 더 선택하세요. <strong>(현재 {starterCount}/5)</strong></span> };
  else msg = { tone: 'info', icon: 'task_alt', text: <span>선발 5명 확정 · 라인업을 확정할 수 있습니다.</span> };

  const confirmLabel = phase === 'saving' ? '처리중…' : (confirmed ? '라인업 재확정' : '라인업 확정');

  const DemoBar = (
    <div className="lc-demo">
      <div className="lc-demo__lbl">시안 데모 — 인터랙션 상태 (운영은 match.status / roster 분기)</div>
      <div className="lc-demo__btns">
        {[['edit', '정상 (준비)'], ['locked', '잠금 (진행 중)'], ['empty', '빈 명단'], ['noteam', '팀 미배정']].map(([k, l]) => (
          <button key={k} className={'lc-demo__btn' + (demo === k ? ' is-on' : '')} onClick={() => setDemo(k)}>{l}</button>
        ))}
      </div>
    </div>
  );

  const Header = (
    <React.Fragment>
      <div className="lc-backrow">
        <a className="lc-back" href="p2-uc2-home.html"><span className="ico material-symbols-outlined">arrow_back_ios_new</span>홈으로</a>
        <span className="lc-matchno">MATCH #BDR-S4-R16-03</span>
      </div>
      <div className="lc-meta">
        <div className="lc-meta__top">
          <span className="lc-meta__eyebrow">LINEUP · 라인업 확정</span>
          <span className={'lc-status lc-status--' + st.key}><span className="dot" />{st.label}</span>
          {isOperator && <span className="lc-opchip"><span className="ico material-symbols-outlined">shield_person</span>운영자 권한</span>}
        </div>
        <h1 className="lc-meta__title">BDR 서머 오픈 #4 · 16강</h1>
        <div className="lc-meta__rows">
          <span className="lc-meta__row"><span className="ico material-symbols-outlined">schedule</span><strong>2026.06.20 (토) 19:00</strong></span>
          <span className="lc-meta__row"><span className="ico material-symbols-outlined">place</span>잠실학생체육관 A코트</span>
        </div>
      </div>
    </React.Fragment>
  );

  // ----- 팀 미배정 / 빈 명단 분기 -----
  if (demo === 'noteam') {
    return (
      <div className="lc-page"><div className="lc-wrap">
        {DemoBar}{Header}
        <div className="gm-card">
          <div className="lc-msg lc-msg--warn" style={{ marginTop: 0 }}>
            <span className="ico material-symbols-outlined">warning</span>
            <span><strong>아직 팀이 배정되지 않은 경기입니다.</strong><br />대진 확정 후 다시 시도해주세요.</span>
          </div>
        </div>
      </div></div>
    );
  }
  if (demo === 'empty') {
    return (
      <div className="lc-page"><div className="lc-wrap">
        {DemoBar}{Header}
        <div className="gm-card">
          <div className="lc-state">
            <span className="ico material-symbols-outlined">group_off</span>
            <p className="lc-state__t">등록된 선수가 없습니다.</p>
            <p className="lc-state__d">팀 관리에서 선수를 먼저 등록해야 라인업을 확정할 수 있습니다.</p>
          </div>
        </div>
      </div></div>
    );
  }

  return (
    <div className="lc-page">
      <div className="lc-wrap">
        {DemoBar}
        {Header}

        {/* 선발 5슬롯 보드 (웹 강점 유지) */}
        <div className="gm-card" style={{ marginBottom: 14 }}>
          <div className="lc-board__head">
            <h3 className="lc-board__h">
              <span className="ico material-symbols-outlined">sports_basketball</span>
              {TEAM.name}
              <span className="lc-board__reg">{TEAM.registered}명 등록</span>
            </h3>
            {ready
              ? <span className="lc-board__badge lc-board__badge--ready"><span className="ico material-symbols-outlined">verified</span>{confirmed ? '팀장 확정' : '선발 완료'}</span>
              : <span className="lc-board__badge lc-board__badge--pend"><span className="ico material-symbols-outlined">edit_note</span>{untouched ? '선발 미지정' : '선발 진행중'}</span>}
          </div>

          {/* 카운터 sub: 선발 N/5 · 벤치 b/7 + hint / 전체해제 / 실행취소 */}
          <div className="lc-sub">
            <span className={'lc-count lc-count--starter ' + (ready ? 'is-full' : 'is-under')}>
              <span className="lc-count__lbl">선발</span>
              <span className="lc-count__n">{starterCount}</span>
              <span className="lc-count__lbl">/ 5</span>
            </span>
            <span className="lc-count__sep" />
            <span className="lc-count">
              <span className="lc-count__lbl">벤치</span>
              <span className="lc-count__n">{benchCount}</span>
              <span className="lc-count__lbl">/ 7</span>
            </span>
            {!ready && (
              <span className="lc-sub__hint"><span className="ico material-symbols-outlined">error</span>탭하면 선발 5명→벤치 순으로 지정</span>
            )}
            <span className="lc-sub__tools">
              <button className="lc-tool" onClick={undo} disabled={!history.length || locked}>
                <span className="ico material-symbols-outlined">undo</span>실행취소
              </button>
              <button className="lc-tool" onClick={clearAll} disabled={untouched || locked}>
                <span className="ico material-symbols-outlined">restart_alt</span>전체 해제
              </button>
            </span>
          </div>

          <div className="lc-slots">
            {starterSlots.map((p, i) => (
              <div key={i} className={'lc-slot' + (p ? '' : ' is-empty')}>
                <span className="lc-slot__no">{i + 1}</span>
                {p ? (
                  <React.Fragment>
                    <span className="lc-slot__avatar-wrap">
                      <span className="lc-slot__avatar">{p.name[0]}</span>
                      {p.no != null && <span className="lc-slot__jersey">{p.no}</span>}
                      {captain === p.id && <span className="lc-slot__cap">C</span>}
                    </span>
                    <span className="lc-slot__name">{p.name}</span>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <span className="lc-slot__avatar">+</span>
                    <span className="lc-slot__ph">빈자리</span>
                  </React.Fragment>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 코칭스태프 바 (role=coach 분리) */}
        <div className="lc-coachbar">
          <span className="lc-coachbar__lbl">코칭스태프</span>
          <span className={'lc-coachchip' + (COACHES.head ? '' : ' is-empty')}>
            <span className="ico material-symbols-outlined">badge</span>
            <span className="lc-coachchip__role">감독</span>{COACHES.head || '미지정'}
          </span>
          <span className={'lc-coachchip' + (COACHES.asst ? '' : ' is-empty')}>
            <span className="ico material-symbols-outlined">group</span>
            <span className="lc-coachchip__role">코치</span>{COACHES.asst || '미지정'}
          </span>
        </div>

        {/* 선수 명단 — 3상태 행 순환 */}
        <div className="gm-card">
          <div className="lc-rows">
            {REGISTERED.map(p => {
              const role = roleOf(p.id);
              const isCap = captain === p.id;
              const cls = 'lc-row' + (role === LC_ROLE.starter ? ' is-starter' : role === LC_ROLE.bench ? ' is-bench' : '') + (locked ? ' is-locked' : '');
              const toggle = role === LC_ROLE.starter
                ? { mod: 'starter', ico: 'check', lbl: '선발' }
                : role === LC_ROLE.bench
                  ? { mod: 'bench', ico: 'check', lbl: '벤치' }
                  : { mod: 'out', ico: 'add', lbl: '선택' };
              return (
                <button key={p.id} className={cls} onClick={() => cycleRole(p)} disabled={locked}>
                  <span className={'lc-row__num' + (p.no == null ? ' is-none' : '')}>{p.no != null ? p.no : '미정'}</span>
                  <span className="lc-row__name">
                    <span className="lc-row__nm">{p.name}</span>
                    {p.nick && <span className="lc-row__nick">{p.nick}</span>}
                    {isCap && <span className="lc-captag">주장</span>}
                  </span>
                  <span
                    className={'lc-capbtn' + (isCap ? ' is-on' : '')}
                    onClick={(e) => toggleCaptain(p, e)}
                    role="button"
                    aria-label="주장 지정"
                    aria-disabled={locked || role === LC_ROLE.out}
                  >C</span>
                  <span className={'lc-toggle lc-toggle--' + toggle.mod}>
                    <span className="ico material-symbols-outlined">{toggle.ico}</span>{toggle.lbl}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 메시지 */}
          <div className={'lc-msg lc-msg--' + msg.tone}>
            <span className="ico material-symbols-outlined">{msg.icon}</span>
            {msg.text}
          </div>

          {/* 데스크톱 액션 바 */}
          <div className="lc-actions">
            <button className="btn btn--accent btn--xl lc-actions__confirm" onClick={onConfirm} disabled={!canConfirm}>
              <span className="ico material-symbols-outlined">{phase === 'saving' ? 'hourglass_top' : 'how_to_reg'}</span>
              {confirmLabel}
            </button>
            {confirmed && !locked && (
              <button className="btn btn--ghost btn--xl" onClick={onRelease}>라인업 해제</button>
            )}
          </div>
        </div>

        {/* 모바일 하단 sticky 바 */}
        <div className="lc-sticky">
          <div className="lc-sticky__prog">
            <span>선발 {starterCount}/5</span>
            <span className="lc-sticky__bar">
              <span className={'lc-sticky__fill' + (ready ? ' is-full' : '')} style={{ width: (starterCount / 5 * 100) + '%' }} />
            </span>
            <span>벤치 {benchCount}/7</span>
          </div>
          <div className="lc-sticky__row">
            <button className="btn btn--accent btn--touch lc-actions__confirm" onClick={onConfirm} disabled={!canConfirm}>
              {confirmLabel}
            </button>
            {confirmed && !locked && (
              <button className="btn btn--ghost btn--touch" onClick={onRelease}>해제</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.LineupConfirm = LineupConfirm;
