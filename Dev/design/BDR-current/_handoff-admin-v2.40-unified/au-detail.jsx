/* global React, window */
// =====================================================================
// au-detail.jsx — 통합 콘솔 상세(드릴다운) 화면
//   유저 · 대회(참가팀·대진표·정산) · 경기 · 팀 · 단체 · 코트
//   목록 화면의 Drawer 에서 진입. 셸/사이드바는 그대로 유지.
// =====================================================================
(function () {
const { useState } = React;
const D = window.ADMIN;
const { PageHead, Panel, DL, StatusBadge, Icon, Btn, Badge } = window;
const won = window.auWon, ini = window.auIni;

// ── 공용: 상세 헤더 ───────────────────────────────────────────────────
function DetailHead({ go, back, eyebrow, eyebrowIcon, avatar, avatarGrey, title, sub, badges, actions }) {
  return (
    <div>
      <button type="button" className="au-back" onClick={() => go(back)}>
        <Icon name="arrow-left" size={16} /> 목록으로
      </button>
      <div className="au-dhead">
        {avatar != null && <div className={'au-dhead__avatar' + (avatarGrey ? ' au-dhead__avatar--grey' : '')}>{avatar}</div>}
        <div className="au-dhead__main">
          {eyebrow && <div className="au-dhead__eyebrow">{eyebrowIcon && <Icon name={eyebrowIcon} size={14} />}{eyebrow}</div>}
          <div className="au-dhead__title">{title}</div>
          {sub && <div className="au-dhead__sub">{sub}</div>}
          {badges && <div className="au-dhead__badges">{badges}</div>}
        </div>
        {actions && <div className="au-dhead__actions">{actions}</div>}
      </div>
    </div>
  );
}

// ── 공용: 탭 ──────────────────────────────────────────────────────────
function Tabs({ tabs, tab, onTab }) {
  return (
    <div className="au-dtabs">
      {tabs.map((t) => (
        <button key={t.id} type="button" className="au-dtab" data-active={tab === t.id ? 'true' : 'false'} onClick={() => onTab(t.id)}>
          {t.icon && <Icon name={t.icon} size={16} />}{t.label}{t.n != null && <span className="au-dtab__n">{t.n}</span>}
        </button>
      ))}
    </div>
  );
}

// ── 공용: 미니 통계 ───────────────────────────────────────────────────
function MiniStat({ items }) {
  return (
    <div className="au-ministat" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0,1fr))` }}>
      {items.map((s, i) => (
        <div className="au-ministat__cell" key={i}>
          <div className="au-ministat__v">{s.v}</div>
          <div className="au-ministat__l">{s.l}</div>
        </div>
      ))}
    </div>
  );
}

// =====================================================================
// 1. 유저 상세
// =====================================================================
function AuUserDetail({ id, go }) {
  const u = D.USERS.find((x) => x.id === id) || D.USERS[0];
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: '개요', icon: 'id-card' },
    { id: 'activity', label: '활동', icon: 'activity', n: D.U_TIMELINE.length },
    { id: 'games', label: '경기 기록', icon: 'volleyball', n: D.U_GAMES.length },
    { id: 'billing', label: '결제', icon: 'credit-card' },
  ];
  return (
    <div>
      <DetailHead go={go} back="users" eyebrow="유저 관리" eyebrowIcon="users"
        avatar={ini(u.nickname)} title={u.nickname}
        sub={`${u.email} · ${u.region}`}
        badges={<><Badge tone={D.TIER_TONE[u.tier]}>{u.tier} 등급</Badge><StatusBadge map={D.USER_STATUS} value={u.status} />{u.reports > 0 && <Badge tone="danger" icon="flag">신고 {u.reports}</Badge>}</>}
        actions={<><Btn variant="secondary" icon="message-square" size="sm">메시지</Btn><Btn variant="danger" icon="ban" size="sm">계정 정지</Btn></>} />
      <MiniStat items={[{ v: u.games, l: '누적 경기' }, { v: u.teams, l: '소속 팀' }, { v: u.tier, l: '등급' }, { v: u.reports, l: '신고 누적' }]} />
      <div style={{ height: 20 }} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <Panel title="회원 정보">
            <DL rows={[['닉네임', u.nickname], ['이메일', u.email], ['연락처', u.phone], ['지역', u.region], ['소속 팀', `${u.teams}개`], ['누적 경기', `${u.games}경기`], ['가입일', u.joined], ['최근 접속', u.lastSeen]]} />
          </Panel>
          <Panel title="운영 메모">
            <div style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.6 }}>특이사항 없음. 정상 활동 회원입니다.</div>
            <div style={{ marginTop: 16 }}><Btn variant="secondary" block icon="pencil">메모 추가</Btn></div>
          </Panel>
        </div>
      )}
      {tab === 'activity' && (
        <Panel title="활동 타임라인">
          <div className="au-feed">
            {D.U_TIMELINE.map((l, i) => (
              <div className="au-feed__row" key={i}>
                <span className="au-feed__dot" style={{ background: D.LOG_SEV[l.sev] || 'var(--ink-dim)' }} />
                <div className="au-feed__body">
                  <div className="au-feed__title">{l.action}</div>
                  <div className="au-feed__desc">{l.desc}</div>
                  <div className="au-feed__meta">{l.when}</div>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {tab === 'games' && (
        <Panel title="최근 경기 기록" pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th style={{ paddingLeft: 20 }}>경기</th><th>일자</th><th className="au-cell-r">득점</th><th className="au-cell-r">리바운드</th><th className="au-cell-r">어시스트</th><th className="au-cell-c" style={{ paddingRight: 20 }}>결과</th></tr></thead>
            <tbody>
              {D.U_GAMES.map((g) => (
                <tr key={g.id}>
                  <td className="au-sub__name" style={{ paddingLeft: 20 }}>{g.title}</td>
                  <td className="au-cell--mut">{g.when}</td>
                  <td className="au-cell-r" style={{ fontWeight: 700 }}>{g.pts}</td>
                  <td className="au-cell-r">{g.reb}</td>
                  <td className="au-cell-r">{g.ast}</td>
                  <td className="au-cell-c" style={{ paddingRight: 20 }}>{g.result === 'W' ? <Badge tone="ok">승</Badge> : g.result === 'L' ? <Badge tone="danger">패</Badge> : <Badge tone="grey">-</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {tab === 'billing' && (
        <div className="au-dgrid">
          <Panel title="결제 내역" pad={0} style={{ overflow: 'hidden' }}>
            <table className="au-sub" style={{ padding: 8 }}>
              <thead><tr><th style={{ paddingLeft: 20 }}>항목</th><th>일시</th><th className="au-cell-r" style={{ paddingRight: 20 }}>금액</th></tr></thead>
              <tbody>
                {D.PAYMENTS.slice(0, 4).map((p) => (
                  <tr key={p.id}><td className="au-sub__name" style={{ paddingLeft: 20 }}>{p.type}</td><td className="au-cell--mut">{p.when}</td><td className="au-cell-r" style={{ paddingRight: 20, fontWeight: 700 }}>{won(p.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          </Panel>
          <Panel title="현재 구독">
            <DL rows={[['요금제', 'PRO'], ['결제일', '매월 15일'], ['월 요금', won(9900)], ['상태', <Badge tone="ok">정상</Badge>]]} />
          </Panel>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 2. 대회 상세 (개요 · 참가팀 · 대진표 · 정산)
// =====================================================================
function AuTournamentDetail({ id, go, initialTab }) {
  const t = D.TOURNAMENTS.find((x) => x.id === id) || D.TOURNAMENTS[0];
  const [tab, setTab] = useState(initialTab || 'overview');
  const hasBracket = t.status === 'closed' || t.status === 'done';
  const tabs = [
    { id: 'overview', label: '개요', icon: 'clipboard-list' },
    { id: 'teams', label: '참가팀', icon: 'users', n: D.TN_TEAMS.length },
    { id: 'bracket', label: '대진표', icon: 'git-fork' },
    { id: 'settle', label: '정산', icon: 'calculator' },
  ];
  const settleTotal = D.TN_SETTLE.rows.reduce((s, r) => s + r[2], 0);
  const finalM = D.TN_BRACKET[D.TN_BRACKET.length - 1].matches[0];
  const champ = finalM.done ? (finalM.sa > finalM.sb ? finalM.a : finalM.b) : '미정';

  return (
    <div>
      <DetailHead go={go} back="tournaments" eyebrow="대회 관리" eyebrowIcon="trophy"
        avatar="🏆" title={t.name}
        sub={`${t.organizer} 주최 · ${t.start} 개최 · 종별 ${t.divisions}개`}
        badges={<><StatusBadge map={D.TN_STATUS} value={t.status} /><Badge tone="grey">{t.teams}/{t.cap}팀</Badge><Badge tone="primary">참가비 {won(t.fee)}</Badge></>}
        actions={<><Btn variant="secondary" icon="settings-2" size="sm">설정</Btn><Btn variant="primary" icon="bell" size="sm">참가팀 알림</Btn></>} />
      <MiniStat items={[{ v: `${t.teams}/${t.cap}`, l: '접수 팀' }, { v: t.divisions, l: '종별' }, { v: won(t.fee), l: '참가비' }, { v: `${Math.round((t.teams / t.cap) * 100)}%`, l: '접수율' }]} />
      <div style={{ height: 20 }} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="대회 정보">
              <DL rows={[['대회명', t.name], ['주최', t.organizer], ['개최일', t.start], ['종별 수', `${t.divisions}개`], ['정원', `${t.cap}팀`], ['참가비', won(t.fee)], ['상태', <StatusBadge map={D.TN_STATUS} value={t.status} />]]} />
            </Panel>
            <Panel title="접수 현황">
              <div className="au-hbar">
                <div className="au-hbar__row"><span className="au-cell--mut">접수</span><span className="au-hbar__track"><span className="au-hbar__fill" style={{ width: `${(t.teams / t.cap) * 100}%` }} /></span><span className="au-hbar__val">{t.teams}팀</span></div>
                <div className="au-hbar__row"><span className="au-cell--mut">잔여</span><span className="au-hbar__track"><span className="au-hbar__fill" style={{ width: `${((t.cap - t.teams) / t.cap) * 100}%`, background: 'var(--grey-300)' }} /></span><span className="au-hbar__val">{t.cap - t.teams}팀</span></div>
              </div>
            </Panel>
          </div>
          <Panel title="빠른 작업">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" className="ts-navlink" style={{ background: 'var(--grey-50)' }} onClick={() => setTab('teams')}><Icon name="users" size={18} />참가팀 관리<Icon name="chevron-right" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }} /></button>
              <button type="button" className="ts-navlink" style={{ background: 'var(--grey-50)' }} onClick={() => setTab('bracket')}><Icon name="git-fork" size={18} />대진표 편성<Icon name="chevron-right" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }} /></button>
              <button type="button" className="ts-navlink" style={{ background: 'var(--grey-50)' }} onClick={() => setTab('settle')}><Icon name="calculator" size={18} />정산 확인<Icon name="chevron-right" size={16} style={{ marginLeft: 'auto', color: 'var(--ink-dim)' }} /></button>
            </div>
          </Panel>
        </div>
      )}

      {tab === 'teams' && (
        <Panel title="참가팀" sub={`총 ${D.TN_TEAMS.length}팀 접수`} right={<Btn variant="secondary" icon="download" size="sm">명단 내보내기</Btn>} pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th className="au-cell-c" style={{ paddingLeft: 20, width: 56 }}>시드</th><th>팀 · 주장</th><th>종별</th><th className="au-hide-sm">지역</th><th className="au-cell-r">인원</th><th className="au-cell-c" style={{ paddingRight: 20 }}>입금</th></tr></thead>
            <tbody>
              {D.TN_TEAMS.map((e) => (
                <tr key={e.id}>
                  <td className="au-cell-c" style={{ paddingLeft: 20 }}><span className="au-num-pill">{e.seed}</span></td>
                  <td><div className="au-sub__name">{e.name}</div><div className="au-cell--mut" style={{ fontSize: 12.5 }}>{e.captain}</div></td>
                  <td className="au-cell--mut">{e.division}</td>
                  <td className="au-hide-sm au-cell--mut">{e.region}</td>
                  <td className="au-cell-r">{e.members}명</td>
                  <td className="au-cell-c" style={{ paddingRight: 20 }}><StatusBadge map={D.ENTRY_STATUS} value={e.paid} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}

      {tab === 'bracket' && (
        hasBracket ? (
          <Panel title="본선 대진표" sub="일반 1부 · 8강 토너먼트" right={<Btn variant="secondary" icon="shuffle" size="sm">재편성</Btn>}>
            <div className="au-bracket">
              {D.TN_BRACKET.map((r, ri) => (
                <div className="au-bracket__round" key={ri}>
                  <div className="au-bracket__rlabel">{r.round}</div>
                  {r.matches.map((m, mi) => (
                    <div className="au-bmatch" key={mi} data-tbd={m.done ? 'false' : 'true'}>
                      <div className="au-bteam" data-win={m.done && m.sa > m.sb ? 'true' : 'false'}>
                        <span className="au-bteam__name">{m.a}</span><span className="au-bteam__score">{m.done ? m.sa : '-'}</span>
                      </div>
                      <div className="au-bteam" data-win={m.done && m.sb > m.sa ? 'true' : 'false'}>
                        <span className="au-bteam__name">{m.b}</span><span className="au-bteam__score">{m.done ? m.sb : '-'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div className="au-bchamp">
                <div className="au-bchamp__cup"><Icon name="trophy" size={26} /></div>
                <div className="au-bchamp__lbl">우승</div>
                <div className="au-bchamp__name">{champ}</div>
              </div>
            </div>
          </Panel>
        ) : (
          <Panel><window.Empty icon="git-fork" title="대진 미편성" desc="접수 마감 후 대진표를 편성할 수 있습니다."><Btn variant="primary" icon="git-fork" size="sm">대진 편성</Btn></window.Empty></Panel>
        )
      )}

      {tab === 'settle' && (
        <div className="au-dgrid">
          <Panel title="정산 내역" sub="참가비 수입 및 운영 지출">
            {D.TN_SETTLE.rows.map((r, i) => (
              <div className="au-settle__row" key={i}>
                <div style={{ minWidth: 0 }}><div className="au-settle__lbl">{r[0]}</div><div className="au-settle__note">{r[1]}</div></div>
                <div className="au-settle__amt" data-dir={r[3]}>{r[2] > 0 ? '+' : ''}{won(r[2])}</div>
              </div>
            ))}
            <div className="au-settle__total"><span style={{ fontWeight: 700, color: 'var(--primary)' }}>최종 정산액</span><b>{won(settleTotal)}</b></div>
          </Panel>
          <Panel title="정산 상태">
            <DL rows={[['수입 합계', won(4480000)], ['지출 합계', won(2340000)], ['순이익', won(settleTotal)], ['정산 상태', <Badge tone="warn">정산 대기</Badge>]]} />
            <div style={{ marginTop: 16 }}><Btn variant="primary" block icon="check">정산 확정</Btn></div>
          </Panel>
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 3. 경기 상세
// =====================================================================
function AuGameDetail({ id, go }) {
  const g = D.GAMES.find((x) => x.id === id) || D.GAMES[0];
  const [tab, setTab] = useState('overview');
  const G = D.GAME_DETAIL;
  const totA = G.quarters.reduce((s, q) => s + q[1], 0);
  const totB = G.quarters.reduce((s, q) => s + q[2], 0);
  const finished = g.status === 'finished';
  const [tA, tB] = g.title.split(' vs ');
  const tabs = [{ id: 'overview', label: '개요', icon: 'info' }, { id: 'record', label: '기록', icon: 'list-checks' }];
  return (
    <div>
      <DetailHead go={go} back="games" eyebrow="경기 관리" eyebrowIcon="volleyball"
        avatar={g.type === 'match' ? '🆚' : '🏀'} title={g.title}
        sub={`${D.GAME_TYPE[g.type]} · ${g.court} · ${g.when}`}
        badges={<><StatusBadge map={D.GAME_STATUS} value={g.status} /><Badge tone="grey">{g.players}명 참가</Badge></>}
        actions={<Btn variant="secondary" icon="external-link" size="sm">사용자 화면</Btn>} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <div className="au-dstack">
            {finished && tB && (
              <Panel title="경기 결과">
                <div className="au-score">
                  <div className="au-score__team" data-win={totA > totB ? 'true' : 'false'}><div className="au-score__name">{tA}</div><div className="au-score__pts">{totA}</div></div>
                  <div className="au-score__vs">VS</div>
                  <div className="au-score__team" data-win={totB > totA ? 'true' : 'false'}><div className="au-score__name">{tB}</div><div className="au-score__pts">{totB}</div></div>
                </div>
                <table className="au-sub" style={{ marginTop: 16 }}>
                  <thead><tr><th>쿼터</th>{G.quarters.map((q) => <th key={q[0]} className="au-cell-c">{q[0]}</th>)}<th className="au-cell-c">합계</th></tr></thead>
                  <tbody>
                    <tr><td className="au-sub__name">{tA}</td>{G.quarters.map((q) => <td key={q[0]} className="au-cell-c">{q[1]}</td>)}<td className="au-cell-c" style={{ fontWeight: 800 }}>{totA}</td></tr>
                    <tr><td className="au-sub__name">{tB}</td>{G.quarters.map((q) => <td key={q[0]} className="au-cell-c">{q[2]}</td>)}<td className="au-cell-c" style={{ fontWeight: 800 }}>{totB}</td></tr>
                  </tbody>
                </table>
              </Panel>
            )}
            <Panel title="경기 정보">
              <DL rows={[['유형', D.GAME_TYPE[g.type]], ['코트', g.court], ['일시', g.when], ['참가 인원', `${g.players}명`], ['상태', <StatusBadge map={D.GAME_STATUS} value={g.status} />]]} />
            </Panel>
          </div>
          <Panel title="운영 작업">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Btn variant="secondary" block icon="users">참가자 명단</Btn>
              <Btn variant="secondary" block icon="flag">신고 확인</Btn>
              {g.status !== 'cancelled' && g.status !== 'finished' && <Btn variant="danger" block icon="x-circle">경기 취소</Btn>}
            </div>
          </Panel>
        </div>
      )}

      {tab === 'record' && (
        <div className="au-dgrid--wide au-dgrid">
          {[['lineupA', tA || '홈'], ['lineupB', tB || '원정']].map(([key, name]) => (
            <Panel title={`${name} 라인업`} key={key} pad={0} style={{ overflow: 'hidden' }}>
              <table className="au-sub" style={{ padding: 8 }}>
                <thead><tr><th className="au-cell-c" style={{ paddingLeft: 20, width: 52 }}>번호</th><th>선수</th><th>포지션</th><th className="au-cell-r" style={{ paddingRight: 20 }}>득점</th></tr></thead>
                <tbody>
                  {G[key].map((p) => (
                    <tr key={p.no}><td className="au-cell-c" style={{ paddingLeft: 20 }}><span className="au-num-pill">{p.no}</span></td><td className="au-sub__name">{p.name}</td><td className="au-cell--mut">{p.pos}</td><td className="au-cell-r" style={{ paddingRight: 20, fontWeight: 700 }}>{p.pts}</td></tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================================
// 4. 팀 상세
// =====================================================================
function AuTeamDetail({ id, go }) {
  const t = D.TEAMS.find((x) => x.id === id) || D.TEAMS[0];
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: '개요', icon: 'info' },
    { id: 'roster', label: '로스터', icon: 'users', n: D.TM_ROSTER.length },
    { id: 'results', label: '대회 전적', icon: 'trophy', n: D.TM_RESULTS.length },
  ];
  return (
    <div>
      <DetailHead go={go} back="teams" eyebrow="팀 관리" eyebrowIcon="users"
        avatar={ini(t.name)} title={t.name}
        sub={`${t.region} · ${t.org === '—' ? '무소속' : t.org}`}
        badges={<><StatusBadge map={D.TEAM_STATUS} value={t.status} /><Badge tone="grey">{t.members}명</Badge><Badge tone="primary">대회 {t.tournaments}회</Badge></>}
        actions={<Btn variant="secondary" icon="external-link" size="sm">사용자 화면</Btn>} />
      <MiniStat items={[{ v: t.members, l: '팀원' }, { v: t.tournaments, l: '참가 대회' }, { v: t.region, l: '연고지' }]} />
      <div style={{ height: 20 }} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <Panel title="팀 정보"><DL rows={[['팀명', t.name], ['연고지', t.region], ['소속 단체', t.org], ['팀원 수', `${t.members}명`], ['참가 대회', `${t.tournaments}회`], ['상태', <StatusBadge map={D.TEAM_STATUS} value={t.status} />]]} /></Panel>
          <Panel title="최근 전적">
            <DL rows={D.TM_RESULTS.slice(0, 3).map((r) => [r.tn, <span style={{ fontWeight: 700, color: r.result === '우승' ? 'var(--primary)' : 'var(--ink)' }}>{r.result}</span>])} />
          </Panel>
        </div>
      )}
      {tab === 'roster' && (
        <Panel title="로스터" sub={`${D.TM_ROSTER.length}명 등록`} pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th className="au-cell-c" style={{ paddingLeft: 20, width: 52 }}>번호</th><th>선수</th><th>포지션</th><th className="au-hide-sm">역할</th><th className="au-cell-r">경기</th><th className="au-cell-r" style={{ paddingRight: 20 }}>평균 득점</th></tr></thead>
            <tbody>
              {D.TM_ROSTER.map((m) => (
                <tr key={m.id}><td className="au-cell-c" style={{ paddingLeft: 20 }}><span className="au-num-pill">{m.no}</span></td><td className="au-sub__name">{m.name}</td><td className="au-cell--mut">{m.pos}</td><td className="au-hide-sm">{m.role === '주장' ? <Badge tone="primary">주장</Badge> : <span className="au-cell--mut">선수</span>}</td><td className="au-cell-r">{m.games}</td><td className="au-cell-r" style={{ paddingRight: 20, fontWeight: 700 }}>{m.pts}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {tab === 'results' && (
        <Panel title="대회 전적" pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th style={{ paddingLeft: 20 }}>대회</th><th>성적</th><th className="au-hide-sm">전적</th><th className="au-cell-r" style={{ paddingRight: 20 }}>시기</th></tr></thead>
            <tbody>
              {D.TM_RESULTS.map((r) => (
                <tr key={r.id}><td className="au-sub__name" style={{ paddingLeft: 20 }}>{r.tn}</td><td>{r.result === '우승' ? <Badge tone="primary">우승</Badge> : r.result === '준우승' ? <Badge tone="ok">준우승</Badge> : <Badge tone="grey">{r.result}</Badge>}</td><td className="au-hide-sm au-cell--mut">{r.record}</td><td className="au-cell-r au-cell--mut" style={{ paddingRight: 20 }}>{r.when}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

// =====================================================================
// 5. 단체 상세
// =====================================================================
function AuOrgDetail({ id, go }) {
  const o = D.ORGS.find((x) => x.id === id) || D.ORGS[0];
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: '개요', icon: 'info' },
    { id: 'teams', label: '소속 팀', icon: 'shield', n: D.ORG_TEAMS.length },
    { id: 'admins', label: '운영진', icon: 'user-cog', n: D.ORG_ADMINS.length },
  ];
  return (
    <div>
      <DetailHead go={go} back="orgs" eyebrow="단체 관리" eyebrowIcon="building-2"
        avatar={ini(o.name)} avatarGrey title={o.name}
        sub={`${o.type} · ${o.region}`}
        badges={<><StatusBadge map={D.ORG_STATUS} value={o.status} /><Badge tone="grey">팀 {o.teams}개</Badge><Badge tone="grey">회원 {o.members.toLocaleString()}명</Badge></>}
        actions={o.status === 'pending' ? <><Btn variant="danger" icon="x" size="sm">반려</Btn><Btn variant="primary" icon="check" size="sm">승인</Btn></> : <Btn variant="secondary" icon="external-link" size="sm">사용자 화면</Btn>} />
      <MiniStat items={[{ v: o.teams, l: '소속 팀' }, { v: o.members.toLocaleString(), l: '회원' }, { v: o.owner, l: '대표' }]} />
      <div style={{ height: 20 }} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <Panel title="단체 정보"><DL rows={[['단체명', o.name], ['유형', o.type], ['지역', o.region], ['소속 팀', `${o.teams}개`], ['회원 수', `${o.members.toLocaleString()}명`], ['대표', o.owner], ['상태', <StatusBadge map={D.ORG_STATUS} value={o.status} />]]} /></Panel>
          <Panel title="운영진"><DL rows={D.ORG_ADMINS.map((a) => [a.role, a.name])} /></Panel>
        </div>
      )}
      {tab === 'teams' && (
        <Panel title="소속 팀" sub={`${D.ORG_TEAMS.length}개 팀`} pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th style={{ paddingLeft: 20 }}>팀</th><th className="au-hide-sm">지역</th><th className="au-cell-r">인원</th><th className="au-cell-c" style={{ paddingRight: 20 }}>상태</th></tr></thead>
            <tbody>
              {D.ORG_TEAMS.map((tm) => (
                <tr key={tm.id}><td className="au-sub__name" style={{ paddingLeft: 20 }}>{tm.name}</td><td className="au-hide-sm au-cell--mut">{tm.region}</td><td className="au-cell-r">{tm.members}명</td><td className="au-cell-c" style={{ paddingRight: 20 }}>{tm.status === 'active' ? <Badge tone="ok">활성</Badge> : <Badge tone="grey">휴면</Badge>}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
      {tab === 'admins' && (
        <Panel title="운영진" pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th style={{ paddingLeft: 20 }}>이름</th><th>역할</th><th className="au-cell-r" style={{ paddingRight: 20 }}>연락처</th></tr></thead>
            <tbody>
              {D.ORG_ADMINS.map((a) => (
                <tr key={a.id}><td className="au-sub__name" style={{ paddingLeft: 20 }}>{a.name}</td><td>{a.role === '대표' ? <Badge tone="primary">대표</Badge> : <span className="au-cell--mut">{a.role}</span>}</td><td className="au-cell-r au-cell--mut" style={{ paddingRight: 20 }}>{a.phone}</td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

// =====================================================================
// 6. 코트 상세
// =====================================================================
function AuCourtDetail({ id, go }) {
  const c = D.COURTS.find((x) => x.id === id) || D.COURTS[0];
  const [tab, setTab] = useState('overview');
  const tabs = [
    { id: 'overview', label: '개요', icon: 'info' },
    { id: 'bookings', label: '예약 현황', icon: 'calendar', n: D.COURT_BOOKINGS.length },
  ];
  return (
    <div>
      <DetailHead go={go} back="courts" eyebrow="코트 관리" eyebrowIcon="map-pin"
        avatar={c.type === '실내' ? '🏟️' : '🛝'} avatarGrey title={c.name}
        sub={`${c.type} · ${c.region} · ${c.owner}`}
        badges={<><StatusBadge map={D.COURT_STATUS} value={c.status} /><Badge tone={c.rate === 0 ? 'ok' : 'grey'}>{c.rate === 0 ? '무료' : won(c.rate)}</Badge></>}
        actions={c.status === 'pending' ? <><Btn variant="danger" icon="x" size="sm">반려</Btn><Btn variant="primary" icon="check" size="sm">승인</Btn></> : <Btn variant="secondary" icon="external-link" size="sm">사용자 화면</Btn>} />
      <Tabs tabs={tabs} tab={tab} onTab={setTab} />

      {tab === 'overview' && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="코트 정보"><DL rows={[['코트명', c.name], ['유형', c.type], ['지역', c.region], ['운영주체', c.owner], ['대관료', c.rate === 0 ? '무료' : `${won(c.rate)} / 시간`], ['상태', <StatusBadge map={D.COURT_STATUS} value={c.status} />]]} /></Panel>
            <Panel title="편의시설"><div className="au-chips">{D.COURT_AMENITIES.map((a) => <span className="au-chips__item" key={a}><Icon name="check" size={14} />{a}</span>)}</div></Panel>
          </div>
          <Panel title="이번 주 예약">
            <DL rows={[['확정', `${D.COURT_BOOKINGS.filter((b) => b.status === 'confirmed').length}건`], ['대기', `${D.COURT_BOOKINGS.filter((b) => b.status === 'pending').length}건`], ['가동률', '78%']]} />
            <div style={{ marginTop: 16 }}><Btn variant="primary" block icon="calendar-plus">예약 추가</Btn></div>
          </Panel>
        </div>
      )}
      {tab === 'bookings' && (
        <Panel title="예약 현황" sub="이번 주 코트 예약" pad={0} style={{ overflow: 'hidden' }}>
          <table className="au-sub" style={{ padding: 8 }}>
            <thead><tr><th style={{ paddingLeft: 20 }}>예약자</th><th className="au-hide-sm">용도</th><th>날짜</th><th>시간</th><th className="au-cell-c" style={{ paddingRight: 20 }}>상태</th></tr></thead>
            <tbody>
              {D.COURT_BOOKINGS.map((b) => (
                <tr key={b.id}><td className="au-sub__name" style={{ paddingLeft: 20 }}>{b.who}</td><td className="au-hide-sm au-cell--mut">{b.use}</td><td className="au-cell--mut">{b.date}</td><td className="au-cell--mut">{b.time}</td><td className="au-cell-c" style={{ paddingRight: 20 }}><StatusBadge map={D.COURT_BOOK_STATUS} value={b.status} /></td></tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

Object.assign(window, { AuUserDetail, AuTournamentDetail, AuGameDetail, AuTeamDetail, AuOrgDetail, AuCourtDetail, AuDetailHead: DetailHead, AuTabs: Tabs, AuMiniStat: MiniStat });
})();
