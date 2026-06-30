/* global React */
// ============================================================
// TournamentCompleted.jsx — '대회 종료' 재구성 v2-11 (역박제 / 운영 src 정합)
//   진입: setRoute('tournamentDetail', { id }) — same route, status 분기
//   복귀: setRoute('tournaments')
//
//   대회 상세 재구성 UI(tdr-*) + 첫 탭 '대회결과'(구 '대회소개').
//   pill 탭 5개(대회결과/경기일정/대진표/참가팀/규정) + 운영자 컴팩트 바 +
//   스탯 리더 + 대회 기사(2열) + NBA 본선 브래킷 + 예선 조별 + 네이비 배너.
//
//   강조색: 강조 = var(--cafe-blue) (운영 정합) / 승자점수 = var(--bdr-red) /
//          승자행 inset.세그.배너 = var(--bdr-navy).
//   AppNav frozen mount. 운영 데이터/라우트 0 변경 (정적 시안).
// ============================================================
(function () {
  const { useState } = React;

  const TC = {
    name: '봄맞이 마포컵', edition: 'Vol.7',
    date: '2026-03-16', venue: '마포구민체육센터', division: '오픈',
    champion: { name: '강남BC', logo: '강' },
    stats: [['8', '엔트리'], ['7', '경기 무패'], ['68.2', '평균 득점'], ['+12.4', '평균 마진']],
  };
  const C_TEAMS = [
    { name: '강남BC', abbr: '강', tone: 4, place: 1 },
    { name: '서초파이브', abbr: '서', tone: 210, place: 2 },
    { name: '용산레전드', abbr: '용', tone: 150, place: 3 },
    { name: '강북코프', abbr: '강', tone: 270, place: 3 },
    { name: '광진코프', abbr: '광', tone: 35, place: 0 },
    { name: '성동슈터', abbr: '성', tone: 190, place: 0 },
    { name: '마포드림', abbr: '마', tone: 120, place: 0 },
    { name: '동작볼러스', abbr: '동', tone: 300, place: 0 },
  ];
  const C_TEAM_BY = Object.fromEntries(C_TEAMS.map(t => [t.name, t]));
  const C_SCHED = [
    { phase: '8강', date: '2026.03.14 (토)', games: [
      { time: '10:00', a: '강남BC', sa: 82, b: '동작볼러스', sb: 55, win: 'a' },
      { time: '11:00', a: '서초파이브', sa: 75, b: '마포드림', sb: 58, win: 'a' },
      { time: '12:00', a: '강북코프', sa: 68, b: '성동슈터', sb: 64, win: 'a' },
      { time: '13:00', a: '광진코프', sa: 60, b: '용산레전드', sb: 71, win: 'b' },
    ]},
    { phase: '4강', date: '2026.03.15 (일)', games: [
      { time: '14:30', a: '강남BC', sa: 80, b: '용산레전드', sb: 66, win: 'a' },
      { time: '15:30', a: '강북코프', sa: 62, b: '서초파이브', sb: 70, win: 'b' },
    ]},
    { phase: '결승', date: '2026.03.15 (일)', games: [
      { time: '17:00', a: '강남BC', sa: 74, b: '서초파이브', sb: 70, win: 'a' },
    ]},
  ];
  const C_STANDINGS = [
    { label: '🥇 우승', team: '강남BC', win: true },
    { label: '🥈 준우승', team: '서초파이브' },
    { label: '🥉 공동 3위', team: '용산레전드' },
    { label: '🥉 공동 3위', team: '강북코프' },
  ];
  const C_MVP = { name: '김지훈', team: '강남BC', stat: '평균 24.3득점 · 8어시' };
  const C_BEST5 = [
    { pos: 'PG', name: '김지훈', team: '강남BC', stat: '24.3pt · 8as' },
    { pos: 'SG', name: '이태우', team: '서초파이브', stat: '21.0pt · 4.2rb' },
    { pos: 'SF', name: '박재현', team: '강남BC', stat: '18.7pt · 5.5rb' },
    { pos: 'PF', name: '정성훈', team: '용산레전드', stat: '16.2pt · 9.3rb' },
    { pos: 'C', name: '윤호석', team: '서초파이브', stat: '14.0pt · 11.2rb' },
  ];
  const C_STATS = [
    { k: '참가팀', v: '8', sub: '조별 예선 + 본선' },
    { k: '경기완료', v: '19', sub: '/ 19경기' },
    { k: '우승', v: '강남BC', sub: '본선 무패' },
    { k: 'MVP', v: '김지훈', sub: '24.3pt' },
    { k: '우승상금', v: '₩300만', sub: '+ 트로피' },
  ];
  const C_GROUPS = [
    { name: 'A조', rows: [
      { seed: 'A1', team: '강남BC', w: 3, l: 0, pf: 228, pa: 170 },
      { seed: 'A2', team: '용산레전드', w: 2, l: 1, pf: 201, pa: 188 },
      { seed: 'A3', team: '성동슈터', w: 1, l: 2, pf: 182, pa: 195 },
      { seed: 'A4', team: '마포드림', w: 0, l: 3, pf: 171, pa: 209 },
    ]},
    { name: 'B조', rows: [
      { seed: 'B1', team: '서초파이브', w: 3, l: 0, pf: 221, pa: 175 },
      { seed: 'B2', team: '강북코프', w: 2, l: 1, pf: 198, pa: 184 },
      { seed: 'B3', team: '광진코프', w: 1, l: 2, pf: 179, pa: 197 },
      { seed: 'B4', team: '동작볼러스', w: 0, l: 3, pf: 168, pa: 206 },
    ]},
  ];
  const C_BR2 = {
    rounds: [
      { key: 'qf', label: '8강', games: [
        { a: { t: '강남BC', seed: 'A1', s: 82 }, b: { t: '동작볼러스', seed: 'B4', s: 55 }, win: 'a' },
        { a: { t: '용산레전드', seed: 'A2', s: 71 }, b: { t: '광진코프', seed: 'B3', s: 60 }, win: 'a' },
        { a: { t: '강북코프', seed: 'B2', s: 68 }, b: { t: '성동슈터', seed: 'A3', s: 64 }, win: 'a' },
        { a: { t: '서초파이브', seed: 'B1', s: 75 }, b: { t: '마포드림', seed: 'A4', s: 58 }, win: 'a' },
      ]},
      { key: 'sf', label: '4강', games: [
        { a: { t: '강남BC', seed: 'A1', s: 80 }, b: { t: '용산레전드', seed: 'A2', s: 66 }, win: 'a' },
        { a: { t: '강북코프', seed: 'B2', s: 62 }, b: { t: '서초파이브', seed: 'B1', s: 70 }, win: 'b' },
      ]},
      { key: 'f', label: '결승', games: [
        { a: { t: '강남BC', seed: 'A1', s: 74 }, b: { t: '서초파이브', seed: 'B1', s: 70 }, win: 'a' },
      ]},
    ],
    champ: '강남BC',
  };
  const C_LEADERS = [
    { cat: '득점', unit: 'PPG', rows: [
      { name: '김지훈', team: '강남BC', v: '24.3' },
      { name: '이태우', team: '서초파이브', v: '21.0' },
      { name: '박재현', team: '강남BC', v: '18.7' },
    ]},
    { cat: '리바운드', unit: 'RPG', rows: [
      { name: '윤호석', team: '서초파이브', v: '11.2' },
      { name: '정성훈', team: '용산레전드', v: '9.3' },
      { name: '한승우', team: '강북코프', v: '8.1' },
    ]},
    { cat: '어시스트', unit: 'APG', rows: [
      { name: '김지훈', team: '강남BC', v: '8.0' },
      { name: '이태우', team: '서초파이브', v: '5.4' },
      { name: '조민기', team: '용산레전드', v: '4.8' },
    ]},
    { cat: '3점', unit: '3PM', rows: [
      { name: '박재현', team: '강남BC', v: '3.4' },
      { name: '백현수', team: '성동슈터', v: '3.1' },
      { name: '이태우', team: '서초파이브', v: '2.9' },
    ]},
  ];
  const C_ARTICLES = [
    { id: 5, date: '2026.03.15', tag: '결승전 리포트', title: '강남BC, 마포컵 Vol.7 정상에 서다',
      lead: '봄맞이 마포컵 Vol.7이 강남BC의 본선 전승 우승으로 막을 내렸다. 결승에서 서초파이브를 74-70으로 꺾으며 무패 행진을 완성했다.' },
    { id: 4, date: '2026.03.15', tag: 'MVP', title: "MVP 김지훈, 결승서 24.3점 8어시 '코트의 지배자'" },
    { id: 3, date: '2026.03.15', tag: '4강', title: '서초파이브, 강북코프 꺾고 결승 진출... 70-62' },
    { id: 2, date: '2026.03.14', tag: '8강', title: '예선 1위 4팀 전원 본선 안착, 8강 이변 없었다' },
    { id: 1, date: '2026.03.13', tag: '프리뷰', title: '봄맞이 마포컵 Vol.7 개막, 8개 팀 본선 경쟁 돌입' },
  ];

  const TABS = [
    { key: 'result', label: '대회결과' },
    { key: 'schedule', label: '경기일정' },
    { key: 'bracket', label: '대진표' },
    { key: 'teams', label: '참가팀' },
    { key: 'rules', label: '규정' },
  ];
  const I = ({ n }) => <span className="ico">{n}</span>;
  const won = (m, s) => m.win === s;
  function TeamDot({ name, size = 36 }) {
    const t = C_TEAM_BY[name] || { abbr: (name || '?')[0], tone: 220 };
    return <span className="tdr-dot" style={{ width: size, height: size, fontSize: size * 0.42,
      background: `linear-gradient(140deg, hsl(${t.tone} 30% 90%), hsl(${t.tone} 30% 82%))`, color: `hsl(${t.tone} 45% 32%)` }}>{t.abbr}</span>;
  }

  function NextBanner() {
    return (
      <div className="tdc-nextbanner">
        <div className="tdc-nextbanner__l">
          <span className="tdc-nextbanner__lbl">다음 회차</span>
          <span className="tdc-nextbanner__d">D-117</span>
          <div className="tdc-nextbanner__meta"><b>봄맞이 마포컵 Vol.8</b><span>2026.09.12 시작 · 마포구민체육센터</span></div>
        </div>
        <button className="tdc-nextbanner__cta"><I n="notifications_active" />알림 받기</button>
      </div>
    );
  }

  function ResultPane() {
    return (
      <div className="tdr-pane tdc-result">
        <div className="tc-page"><div className="tc-inner">
          <div className="tc-hero">
            <div className="tc-hero__bg" /><div className="tc-hero__pattern" />
            <div className="tc-hero__content">
              <div className="tc-hero__eyebrow"><span className="tc-hero__trophy">🏆</span><span>{TC.name} · {TC.edition} CHAMPION</span></div>
              <div className="tc-hero__team"><div className="tc-hero__logo">{TC.champion.logo}</div><h1 className="tc-hero__name">{TC.champion.name}</h1></div>
              <div className="tc-hero__meta"><span>{TC.date}</span><span className="tc-hero__sep">·</span><span>{TC.venue}</span><span className="tc-hero__sep">·</span><span>{TC.division}</span></div>
              <div className="tc-hero__stats">
                {TC.stats.map(([v, l]) => <div key={l} className="tc-hero__stat"><span className="tc-hero__stat-v">{v}</span><span className="tc-hero__stat-l">{l}</span></div>)}
              </div>
            </div>
          </div>
          <div className="tc-grid">
            <article className="tc-card tc-card--standings">
              <header className="tc-card__head"><span className="tc-card__num">01</span><h2 className="tc-card__h">최종 순위</h2><span className="tc-card__sub">{TC.division} 종별</span></header>
              <ol className="tc-stand">
                {C_STANDINGS.map((s, i) => (
                  <li key={i} className={'tc-stand__row' + (s.win ? ' is-champ' : '')}>
                    <span className="tc-stand__label">{s.label}</span><span className="tc-stand__logo">{(C_TEAM_BY[s.team] || {}).abbr}</span><span className="tc-stand__team">{s.team}</span>
                  </li>
                ))}
              </ol>
            </article>
            <article className="tc-card tc-card--mvp">
              <header className="tc-card__head"><span className="tc-card__num">02</span><h2 className="tc-card__h">MVP · 베스트5</h2></header>
              <div className="tc-mvp">
                <div className="tc-mvp__av">⭐</div>
                <div className="tc-mvp__body"><div className="tc-mvp__title">MVP {C_MVP.name}</div><div className="tc-mvp__team">{C_MVP.team}</div><div className="tc-mvp__stat">{C_MVP.stat}</div></div>
              </div>
              <div className="tc-best5">
                {C_BEST5.map(p => (
                  <div key={p.name} className="tc-best5__row"><span className="tc-best5__pos">{p.pos}</span><span className="tc-best5__name">{p.name}</span><span className="tc-best5__team">{p.team}</span><span className="tc-best5__stat">{p.stat}</span></div>
                ))}
              </div>
            </article>

            {/* 03 스탯 리더 */}
            <article className="tc-card tc-card--leaders">
              <header className="tc-card__head"><span className="tc-card__num">03</span><h2 className="tc-card__h">스탯 리더</h2><span className="tc-card__sub">대회 누적 · 부문별 TOP 3</span></header>
              <div className="tdc-leaders">
                {C_LEADERS.map(cat => (
                  <div key={cat.cat} className="tdc-leadcat">
                    <div className="tdc-leadcat__h"><span className="tdc-leadcat__cat">{cat.cat}</span><span className="tdc-leadcat__unit">{cat.unit}</span></div>
                    <ol className="tdc-leadlist">
                      {cat.rows.map((r, i) => (
                        <li key={r.name + i} className={'tdc-leadrow' + (i === 0 ? ' is-top' : '')}>
                          <span className="tdc-leadrow__rk">{i + 1}</span>
                          <TeamDot name={r.team} size={i === 0 ? 30 : 24} />
                          <span className="tdc-leadrow__id"><b>{r.name}</b><small>{r.team}</small></span>
                          <span className="tdc-leadrow__v">{r.v}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </article>

            {/* 04 대회 기사 (2열) */}
            <article className="tc-card tc-card--article">
              <header className="tc-card__head"><span className="tc-card__num">04</span><h2 className="tc-card__h">대회 기사</h2><span className="tc-card__sub">{C_ARTICLES[0].date} 업데이트</span></header>
              <div className="tdc-news">
                <a className="tdc-news__feat" href="#">
                  <div className="tdc-news__media" role="img" aria-label="결승전 사진 자리"><span className="tdc-news__ph">결승전 사진<br />1200 × 800</span></div>
                  <span className="tdc-news__tag tdc-news__tag--feat">{C_ARTICLES[0].tag}</span>
                  <h3 className="tdc-news__title">{C_ARTICLES[0].title}</h3>
                  <p className="tdc-news__lead">{C_ARTICLES[0].lead}</p>
                  <div className="tdc-news__by">MyBDR 매치 리포트 · {C_ARTICLES[0].date}</div>
                </a>
                <div className="tdc-news__list">
                  <div className="tdc-news__listh"><b>전체 기사</b><span>{C_ARTICLES.length}건 · 최신순</span></div>
                  {C_ARTICLES.map((a, i) => (
                    <a key={a.id} href="#" className={'tdc-newsrow' + (i === 0 ? ' is-active' : '')}>
                      <div className="tdc-newsrow__meta"><span className="tdc-news__tag">{a.tag}</span><span className="tdc-newsrow__date">{a.date}</span></div>
                      <div className="tdc-newsrow__title">{a.title}</div>
                    </a>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <NextBanner />
        </div></div>
      </div>
    );
  }

  function MatchCard({ m }) {
    return (
      <div className="tdr-match">
        <div className="tdr-match__top"><span className="tdr-match__phase">{m.phase}<span className="tdr-match__sep">|</span>{m.time}</span><span className="tdr-match__done">종료</span></div>
        <div className="tdr-match__body">
          <div className="tdr-mteam tdr-mteam--l"><TeamDot name={m.a} /><span className="tdr-mteam__n">{m.a}</span></div>
          <div className="tdr-mscore"><b className={won(m, 'a') ? 'win' : ''}>{m.sa}</b><i>:</i><b className={won(m, 'b') ? 'win' : ''}>{m.sb}</b></div>
          <div className="tdr-mteam tdr-mteam--r"><span className="tdr-mteam__n">{m.b}</span><TeamDot name={m.b} /></div>
        </div>
      </div>
    );
  }
  function SchedulePane() {
    return (
      <div className="tdr-pane">
        <div className="tdr-pane-head"><h3 className="tdr-pane-head__h">경기일정</h3><span className="tdr-pane-head__c">7경기 · 종료</span></div>
        {C_SCHED.map(blk => (
          <div className="tdr-schgroup" key={blk.phase}>
            <div className="tdr-datehead"><I n="calendar_month" /><b>{blk.date}</b><span className="tdr-phasetag">{blk.phase}</span><span className="tdr-datehead__c">{blk.games.length}경기</span></div>
            <div className="tdr-matches">{blk.games.map((g, i) => <MatchCard key={i} m={{ ...g, phase: blk.phase }} />)}</div>
          </div>
        ))}
      </div>
    );
  }

  function NbaRow({ side, win }) {
    return (
      <div className={'nba-row' + (win ? ' is-win' : '')}>
        <span className="nba-row__seed">{side.seed}</span>
        <TeamDot name={side.t} size={22} />
        <span className="nba-row__name">{side.t}</span>
        <span className="nba-row__score">{side.s}</span>
      </div>
    );
  }
  function NbaGame({ g }) {
    return (
      <div className="nba-game">
        <NbaRow side={g.a} win={g.win === 'a'} />
        <NbaRow side={g.b} win={g.win === 'b'} />
      </div>
    );
  }
  function NbaRound({ label, games }) {
    return (
      <div className="nba-col nba-round">
        <div className="nba-col__title">{label}</div>
        <div className="nba-col__body">{games.map((g, i) => <NbaGame key={i} g={g} />)}</div>
      </div>
    );
  }
  function NbaConn({ pairs, single }) {
    return (
      <div className={'nba-col nba-conn' + (single ? ' nba-conn--single' : '')}>
        <div className="nba-col__title" />
        <div className="nba-col__body">
          {Array.from({ length: pairs }).map((_, i) => (
            <div key={i} className="nba-conn__cell">{single ? <span className="nba-conn__line" /> : <span className="nba-conn__br" />}</div>
          ))}
        </div>
      </div>
    );
  }
  function NbaBracket() {
    const [qf, sf, f] = C_BR2.rounds;
    return (
      <div className="nba-bracket">
        <NbaRound label={qf.label} games={qf.games} />
        <NbaConn pairs={2} />
        <NbaRound label={sf.label} games={sf.games} />
        <NbaConn pairs={1} />
        <NbaRound label={f.label} games={f.games} />
        <NbaConn pairs={1} single />
        <div className="nba-col nba-champ-col">
          <div className="nba-col__title">우승</div>
          <div className="nba-col__body">
            <div className="nba-champ">
              <span className="nba-champ__trophy">🏆</span>
              <TeamDot name={C_BR2.champ} size={40} />
              <span className="nba-champ__team">{C_BR2.champ}</span>
              <span className="nba-champ__lbl">CHAMPION</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function QualGroup({ g }) {
    return (
      <div className="qual">
        <div className="qual__h"><b>{g.name}</b><span>예선 리그 · 3경기</span></div>
        <div className="qual__head"><span>순위</span><span>팀</span><span>전적</span><span>득실</span></div>
        {g.rows.map((r, i) => {
          const diff = r.pf - r.pa;
          return (
            <div key={r.team} className={'qual__row' + (i < 2 ? ' is-adv' : '')}>
              <span className="qual__seed">{r.seed}</span>
              <span className="qual__team"><TeamDot name={r.team} size={26} /><b>{r.team}</b></span>
              <span className="qual__rec">{r.w}<i>승</i> {r.l}<i>패</i></span>
              <span className={'qual__diff' + (diff >= 0 ? ' pos' : ' neg')}>{diff >= 0 ? '+' : ''}{diff}</span>
            </div>
          );
        })}
      </div>
    );
  }

  function BracketPane() {
    return (
      <div className="tdr-pane">
        <div className="tdr-statstrip">
          {C_STATS.map(s => <div key={s.k} className="tdr-stat"><span className="tdr-stat__k">{s.k}</span><span className="tdr-stat__v">{s.v}</span><span className="tdr-stat__s">{s.sub}</span></div>)}
        </div>
        <div className="tdr-stcard">
          <h3 className="tdr-stcard__h"><span className="tdr-stcard__bar" />예선 결과 <small>(조별 리그 · 본선 시드 결정)</small></h3>
          <div className="qual-grid">
            {C_GROUPS.map(g => <QualGroup key={g.name} g={g} />)}
          </div>
          <div className="qual-legend"><span className="qual-legend__dot" />상위 2팀 = 본선 상위 시드 · <b>전 팀 8강 진출</b> (조 순위로 대진 배정)</div>
        </div>
        <div className="tdc-flowmark"><span>예선 리그</span><span className="tdc-flowmark__arr">↓</span><span className="on">본선 토너먼트</span></div>
        <div className="tdr-stcard tdr-brcard">
          <h3 className="tdr-stcard__h"><span className="tdr-stcard__bar" />본선 토너먼트 <small>(8강 단판 · 최종 결과)</small></h3>
          <div className="tdr-brscroll"><NbaBracket /></div>
        </div>
      </div>
    );
  }

  const RANK = { 1: ['🥇 우승', '1'], 2: ['🥈 준우승', '2'], 3: ['🥉 공동 3위', '3'] };
  function TeamsPane() {
    return (
      <div className="tdr-pane">
        <div className="tdr-pane-head"><h3 className="tdr-pane-head__h">참가팀</h3><span className="tdr-pane-head__c">{C_TEAMS.length}팀</span></div>
        <div className="tdr-teamcards">
          {C_TEAMS.map(t => {
            const r = RANK[t.place];
            return (
              <div key={t.name} className={'tdr-teamcard' + (t.place === 1 ? ' tdc-teamcard--champ' : '')}>
                <div className="tdr-teamcard__top">
                  <span className="tdr-teamcard__logo" style={{ background: `linear-gradient(140deg, hsl(${t.tone} 18% 24%), hsl(${t.tone} 20% 14%))` }}>{t.abbr}</span>
                  <div className="tdr-teamcard__meta"><b>{t.name}</b><span style={{ marginTop: 4, display: 'inline-block' }}><span className={'tdc-rank tdc-rank--' + (r ? r[1] : '0')}>{r ? r[0] : '8강'}</span></span></div>
                </div>
                <button className="tdr-teamcard__btn">상세 보기</button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function RulesPane() {
    const rules = [['경기 시간', '예선 8분 4쿼터 · 본선 10분 4쿼터. 연장 3분 1회.'], ['엔트리', '팀당 최대 12명. 경기 시작 전 로스터 확정.'], ['파울 룰', '5반칙 퇴장. 팀 파울 5회부터 자유투 2개.'], ['순위 결정', '단판 토너먼트 · 동점 시 연장.'], ['이의신청', '경기 종료 후 30분 이내 운영본부 서면 접수.']];
    return (
      <div className="tdr-pane">
        <div className="tdr-pane-head"><h3 className="tdr-pane-head__h">규정</h3></div>
        <ol className="tdr-rules">{rules.map(([k, v], i) => <li key={i}><span className="tdr-rules__n">{i + 1}</span><div><b>{k}</b><p>{v}</p></div></li>)}</ol>
      </div>
    );
  }

  function Pane({ tab }) {
    if (tab === 'result') return <ResultPane />;
    if (tab === 'schedule') return <SchedulePane />;
    if (tab === 'bracket') return <BracketPane />;
    if (tab === 'teams') return <TeamsPane />;
    return <RulesPane />;
  }

  function OperatorBar() {
    const [mode, setMode] = useState('admin');
    return (
      <div className="tdc-opbar">
        <div className="tdc-opbar__l"><I n="visibility" /><b>운영자 화면 전환</b><span className="tdc-opbar__d">publish 상태로 사용자 화면을 미리 확인합니다.</span></div>
        <div className="tdc-opbar__seg"><button className={mode === 'admin' ? 'on' : ''} onClick={() => setMode('admin')}>관리자</button><button className={mode === 'user' ? 'on' : ''} onClick={() => setMode('user')}>사용자 (미리보기)</button></div>
      </div>
    );
  }

  const STEPPER = ['대회 목록', '대회 상세', '대회 신청', '대회 종료'];

  // 운영 src 는 같은 라우트 status 분기 — BDR-current 도 동일 시그니처 유지 (setRoute).
  window.TournamentCompleted = function TournamentCompleted() {
    const [tab, setTab] = useState('result');
    return (
      <div className="tdr tc-completed-root" data-density="compact" style={{ '--cta': '#0F5FCC', '--hue': 4 }}>
        <div className="tdr__wrap">
          <div className="tdr__crumbs">홈 <span className="sep">›</span> 대회 <span className="sep">›</span> <b>{TC.name} {TC.edition}</b></div>

          <div className="tdc-statusline">
            <span className="tdc-statusline__badge"><I n="flag" />종료된 대회</span>
            <span className="tdc-statusline__name">{TC.name} <b>{TC.edition}</b></span>
            <span className="tdc-statusline__meta">{TC.date} · {TC.venue}</span>
          </div>

          <OperatorBar />

          <div className="tdr-pilltabs">
            {TABS.map(t => <button key={t.key} className={'tdr-pill' + (tab === t.key ? ' on' : '')} onClick={() => setTab(t.key)}>{t.label}</button>)}
          </div>

          <div className="tdc-1col">
            <Pane tab={tab} />
            <div className="tdc-stepper">
              {STEPPER.map((s, i) => (
                <React.Fragment key={s}>
                  {i > 0 && <span className="tdc-step__arrow"><I n="chevron_right" /></span>}
                  <span className={'tdc-step' + (i === STEPPER.length - 1 ? ' cur' : '')}><span className="tdc-step__n">{i + 1}</span>{s}</span>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };
})();
