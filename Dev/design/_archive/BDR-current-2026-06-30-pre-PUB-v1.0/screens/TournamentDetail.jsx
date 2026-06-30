/* global React */
// ============================================================
// TournamentDetail.jsx — UA2 (부분수정)
//   진입: setRoute('tournamentDetail', { id })   /tournaments/[id]
//   복귀: setRoute('tournaments')
//   에러: setRoute('serverError')
//
// hero band (B7 status / B4 capacity)
//  + 종별 selector chip row (B2, sticky)
//  + 5 탭 (overview / schedule / bracket / teams / rules)
//  + sidebar 보강 (B1: MyRegistrationStatus / B7 운영자 미리보기)
//  + bracket 탭 = 버전 메타 (B5) + 본인 팀 하이라이트
//
// AppNav 03 frozen (preview HTML 에서 mount)
// ============================================================

(function () {
  const { useState, useMemo } = React;

  // ---- mock tournament (in-progress, multi-division) ----
  const T = {
    id: 'tn-2',
    name: 'BDR 서머 오픈 #4',
    edition: 'Vol.4',
    org: { name: 'BDR 운영팀', avatar: 'B' },
    starts_at: '2026-06-15',
    ends_at: '2026-06-21',
    venue: '장충체육관 · 잠실학생체육관',
    status: 'recruit',     // 모집 중
    teams_now: 18, teams_max: 32,
    apply_deadline: '2026-05-09',  // D-11
    divisions: ['오픈', '아마추어', 'U18'],
    fee_min: 40000, fee_max: 60000,
    poster_hue: 220,
    bracket: {
      version: 'v3',
      last_updated_min: 5,
      author: '박수빈',
      my_team_seed: 4,
      my_team_name: 'rdm 농구단',
    },
  };

  const MY_REG = {
    tn_name: T.name,
    division: '아마추어',
    team_name: 'rdm 농구단',
    status: 'approved',
    step_idx: 2,
    next_action: '결제 마감 D-2 (5/2)',
    pay_due: '2026-05-02',
  };

  const TABS = [
    { key: 'overview', label: '개요', ico: 'description' },
    { key: 'schedule', label: '일정', ico: 'event' },
    { key: 'bracket',  label: '대진표', ico: 'account_tree' },
    { key: 'teams',    label: '참가팀', ico: 'groups' },
    { key: 'rules',    label: '규정', ico: 'gavel' },
  ];

  function daysUntil(s) {
    const today = new Date('2026-04-28T00:00:00');
    return Math.ceil((new Date(s + 'T00:00:00') - today) / 86400000);
  }
  function fmtDate(s) {
    const d = new Date(s + 'T00:00:00');
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
  }

  // ---------- Hero ----------
  function Hero({ t }) {
    const d = daysUntil(t.apply_deadline);
    const pct = Math.min(100, Math.round((t.teams_now / t.teams_max) * 100));
    return (
      <div className="td-hero" style={{'--hue': t.poster_hue}}>
        <div className="td-hero__poster">
          <div className="td-hero__poster-grid" />
          <div className="td-hero__edition">{t.edition}</div>
          <div className="td-hero__name">{t.name}</div>
          <div className="td-hero__org">
            <span className="td-hero__org-av">{t.org.avatar}</span>
            <span>{t.org.name}</span>
          </div>
        </div>
        <div className="td-hero__info">
          <div className="td-hero__status-row">
            <span className="td-hero__status">
              <span className="td-hero__status-dot" />
              모집 중
            </span>
            <span className="td-hero__d">접수마감 D-{d}</span>
          </div>

          <dl className="td-hero__meta">
            <div className="td-mi">
              <dt><span className="ico material-symbols-outlined">event</span>대회 기간</dt>
              <dd>{fmtDate(t.starts_at)} – {fmtDate(t.ends_at)}</dd>
            </div>
            <div className="td-mi">
              <dt><span className="ico material-symbols-outlined">location_on</span>경기장</dt>
              <dd>{t.venue}</dd>
            </div>
            <div className="td-mi">
              <dt><span className="ico material-symbols-outlined">payments</span>참가비</dt>
              <dd>{t.fee_min.toLocaleString()}–{t.fee_max.toLocaleString()}원 <span className="td-mi__sub">(종별 상이)</span></dd>
            </div>
            <div className="td-mi">
              <dt><span className="ico material-symbols-outlined">category</span>종별</dt>
              <dd>{t.divisions.join(' · ')}</dd>
            </div>
          </dl>

          <div className="td-hero__cap">
            <div className="td-hero__cap-bar"><div className="td-hero__cap-fill" style={{width: pct+'%'}} /></div>
            <div className="td-hero__cap-meta">
              <span><b>{t.teams_now}</b>/{t.teams_max}팀 신청</span>
              <span className="td-hero__cap-pct">{pct}%</span>
            </div>
          </div>

          <div className="td-hero__cta">
            <button className="btn btn--accent btn--touch">참가 신청하기</button>
            <button className="btn btn--touch"><span className="ico material-symbols-outlined">share</span>공유</button>
            <button className="btn btn--touch"><span className="ico material-symbols-outlined">bookmark_border</span>저장</button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Division selector (B2) ----------
  function DivisionChips({ divisions, value, onChange }) {
    if (divisions.length <= 1) return null;
    return (
      <div className="td-divsel" role="tablist" aria-label="종별 선택">
        <span className="td-divsel__lbl">종별</span>
        <div className="td-divsel__chips">
          <button
            className={'td-divchip' + (value === '__all' ? ' is-on' : '')}
            onClick={() => onChange('__all')}>
            전체
          </button>
          {divisions.map(d => (
            <button key={d}
              className={'td-divchip' + (value === d ? ' is-on' : '')}
              onClick={() => onChange(d)}>
              {d}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ---------- Tabs ----------
  // td-redesign (BDR v2.29) 역박제 2026-06-10: 밑줄형 → pill 탭 + 활성 cafe-blue 강조.
  // 마크업(td-tabs/td-tab)은 유지하고 tournament-detail.css 의 .td-tabs/.td-tab 규칙만 pill 로 갱신.
  function TabBar({ active, onChange }) {
    return (
      <div className="td-tabs" role="tablist">
        {TABS.map(t => (
          <button key={t.key}
            role="tab"
            aria-selected={active === t.key}
            className={'td-tab' + (active === t.key ? ' is-active' : '')}
            onClick={() => onChange(t.key)}>
            <span className="ico material-symbols-outlined">{t.ico}</span>
            {t.label}
          </button>
        ))}
      </div>
    );
  }

  // ---------- Tab panes ----------
  function OverviewPane({ t, division }) {
    return (
      <div className="td-pane">
        <section className="td-section">
          <h2 className="td-h2">대회 소개</h2>
          <p className="td-p">
            BDR 서머 오픈 #4는 전국 단위 5x5 오픈 토너먼트입니다. 예선은 6/15–17, 본선은 6/20–21에 진행되며,
            오픈 / 아마추어 / U18 3개 종별로 운영됩니다.
            {division !== '__all' && <span className="td-p__filter"> · 현재 [{division}] 종별 정보 표시</span>}
          </p>
        </section>
        <section className="td-section">
          <h2 className="td-h2">시리즈</h2>
          <div className="td-series">
            <span className="td-series__ico">📚</span>
            <div>
              <div className="td-series__name">BDR 서머 오픈 시리즈</div>
              <div className="td-series__meta">Vol.1 (2023) · Vol.2 (2024) · Vol.3 (2025) · <b>Vol.4 (2026, 현재)</b></div>
            </div>
            <button className="btn btn--sm">시리즈 보기</button>
          </div>
        </section>
        <section className="td-section">
          <h2 className="td-h2">상금 / 시상</h2>
          <div className="td-prize">
            <div className="td-prize__row"><span className="td-prize__rank">🥇 우승</span><span className="td-prize__amount">₩3,000,000</span><span className="td-prize__extra">+ 트로피 · 굿즈</span></div>
            <div className="td-prize__row"><span className="td-prize__rank">🥈 준우승</span><span className="td-prize__amount">₩1,000,000</span></div>
            <div className="td-prize__row"><span className="td-prize__rank">🥉 3위 (2팀)</span><span className="td-prize__amount">₩500,000</span></div>
            <div className="td-prize__row"><span className="td-prize__rank">⭐ MVP</span><span className="td-prize__amount">₩300,000</span><span className="td-prize__extra">+ MVP 트로피</span></div>
          </div>
        </section>
      </div>
    );
  }

  function SchedulePane({ division }) {
    const schedule = [
      { date: '2026.06.15 (월)', label: '예선 1일차', games: 16, div: ['오픈', '아마추어'] },
      { date: '2026.06.16 (화)', label: '예선 2일차', games: 16, div: ['오픈', '아마추어', 'U18'] },
      { date: '2026.06.17 (수)', label: '예선 3일차', games: 12, div: ['U18'] },
      { date: '2026.06.20 (토)', label: '본선 8강·4강', games: 12, div: ['오픈', '아마추어', 'U18'] },
      { date: '2026.06.21 (일)', label: '결승', games: 6, div: ['오픈', '아마추어', 'U18'] },
    ];
    const list = division === '__all' ? schedule : schedule.filter(s => s.div.includes(division));
    return (
      <div className="td-pane">
        <h2 className="td-h2">전체 일정 {division !== '__all' && <span className="td-h2__chip">[{division}]</span>}</h2>
        <table className="td-table">
          <thead>
            <tr><th>날짜</th><th>구분</th><th>경기 수</th><th>종별</th><th></th></tr>
          </thead>
          <tbody>
            {list.map((s, i) => (
              <tr key={i}>
                <td className="td-table__date">{s.date}</td>
                <td><b>{s.label}</b></td>
                <td className="td-table__num">{s.games}경기</td>
                <td className="td-table__divs">{s.div.map(d => <span key={d} className="td-divtag">{d}</span>)}</td>
                <td className="td-table__action"><button className="btn btn--sm btn--ghost">상세</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  function BracketPane({ t, division }) {
    const b = t.bracket;
    return (
      <div className="td-pane">
        {/* B5 — version meta */}
        <div className="td-bracket-meta">
          <div className="td-bracket-meta__left">
            <span className="td-bracket-meta__chip">
              <span className="ico material-symbols-outlined">history</span>
              버전 {b.version}
            </span>
            <span className="td-bracket-meta__upd">
              마지막 갱신 {b.last_updated_min}분 전 · {b.author} 운영자
            </span>
          </div>
          <div className="td-bracket-meta__right">
            <span className="td-bracket-meta__my">
              <span className="td-bracket-meta__my-dot" />
              내 팀: <b>{b.my_team_name}</b> (#{b.my_team_seed} 시드)
            </span>
            <button className="btn btn--sm btn--ghost">
              <span className="ico material-symbols-outlined">notifications</span>
              변경 알림 받기
            </button>
          </div>
        </div>

        <h2 className="td-h2">{division === '__all' ? '아마추어 본선 토너먼트' : `[${division}] 본선 토너먼트`}</h2>

        {/* Mini bracket visualization */}
        <div className="td-bracket">
          {[
            { round: '16강', games: [
              { id: 'g1', a: 'rdm 농구단', b: '강남BC', mine: true, seed_a: 4, seed_b: 13 },
              { id: 'g2', a: '서초파이브', b: '용산레전드', seed_a: 5, seed_b: 12 },
              { id: 'g3', a: '마포드림', b: '동작볼러스', seed_a: 6, seed_b: 11 },
              { id: 'g4', a: '광진코프', b: '성동슈터', seed_a: 7, seed_b: 10 },
            ]},
            { round: '8강', games: [
              { id: 'g5', a: 'TBD (g1 승)', b: 'TBD (g2 승)', tbd: true },
              { id: 'g6', a: 'TBD (g3 승)', b: 'TBD (g4 승)', tbd: true },
            ]},
            { round: '4강', games: [
              { id: 'g7', a: 'TBD', b: 'TBD', tbd: true },
            ]},
            { round: '결승', games: [
              { id: 'g8', a: '???', b: '???', tbd: true },
            ]},
          ].map((col, ci) => (
            <div key={ci} className="td-br-col">
              <div className="td-br-col__h">{col.round}</div>
              {col.games.map(g => (
                <div key={g.id} className={'td-br-game' + (g.mine ? ' is-mine' : '') + (g.tbd ? ' is-tbd' : '')}>
                  <div className="td-br-team">
                    {!g.tbd && <span className="td-br-seed">{g.seed_a}</span>}
                    <span className="td-br-name">{g.a}</span>
                  </div>
                  <div className="td-br-team">
                    {!g.tbd && <span className="td-br-seed">{g.seed_b}</span>}
                    <span className="td-br-name">{g.b}</span>
                  </div>
                  {g.mine && <span className="td-br-mine">내 팀</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  function TeamsPane({ division }) {
    const teams = [
      { name: 'rdm 농구단', div: '아마추어', mine: true, captain: 'rdm_captain', roster: 8 },
      { name: '강남BC',      div: '오픈',    captain: 'gn_lee',      roster: 10 },
      { name: '서초파이브',  div: '오픈',    captain: 'sc_park',     roster: 9 },
      { name: '용산레전드',  div: '오픈',    captain: 'yong_kim',    roster: 8 },
      { name: '마포드림',    div: '아마추어', captain: 'mp_choi',    roster: 7 },
      { name: '동작볼러스',  div: 'U18',     captain: 'dj_jung',    roster: 8 },
      { name: '광진코프',    div: '아마추어', captain: 'gj_yang',    roster: 9 },
      { name: '성동슈터',    div: 'U18',     captain: 'sd_hong',    roster: 8 },
    ];
    const list = division === '__all' ? teams : teams.filter(t => t.div === division);
    return (
      <div className="td-pane">
        <h2 className="td-h2">참가팀 ({list.length})</h2>
        <div className="td-teams">
          {list.map(t => (
            <div key={t.name} className={'td-team-card' + (t.mine ? ' is-mine' : '')}>
              <div className="td-team-card__top">
                <span className="td-divtag td-divtag--lg">{t.div}</span>
                {t.mine && <span className="td-team-card__mine">내 팀</span>}
              </div>
              <div className="td-team-card__name">{t.name}</div>
              <div className="td-team-card__meta">
                <span>주장 <b>@{t.captain}</b></span>
                <span>· 엔트리 {t.roster}명</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function RulesPane() {
    return (
      <div className="td-pane">
        <h2 className="td-h2">대회 규정</h2>
        <ol className="td-rules">
          <li><b>경기 시간</b> — 예선 8분 4쿼터 / 본선 10분 4쿼터. 연장은 3분 1회.</li>
          <li><b>엔트리</b> — 팀당 최대 12명. 외국인 선수는 종별별 상이 (오픈 2명 / 아마추어 0명).</li>
          <li><b>파울 룰</b> — 5반칙 퇴장. 팀 파울 5회부터 자유투 2개.</li>
          <li><b>이의신청</b> — 경기 종료 후 30분 이내 운영본부에 서면 접수.</li>
          <li><b>유니폼</b> — 동일 색상 통일 의무. 등번호 0~99 중복 금지.</li>
          <li><b>실격</b> — 경기 지각 15분 시 자동 패배 처리. 두 번 실격 시 대회 출전권 박탈.</li>
        </ol>
      </div>
    );
  }

  // ---------- Sidebar (B1 + B7) ----------
  function Sidebar({ isAdmin, onTogglePreview, previewMode }) {
    return (
      <aside className="td-side">
        <window.MyRegistrationStatus reg={MY_REG} variant="sidebar" onOpenMy={() => {}} />

        {/* B7 — admin preview toggle (운영자만 보임) */}
        {isAdmin && (
          <div className="td-side__preview">
            <div className="td-side__preview-h">
              <span className="ico material-symbols-outlined">visibility</span>
              <span className="td-side__preview-title">운영자 화면 전환</span>
            </div>
            <p className="td-side__preview-desc">
              현재 publish 상태로 사용자가 어떻게 보는지 미리 확인합니다.
            </p>
            <div className="td-side__preview-toggle">
              <button
                className={'td-side__preview-btn' + (!previewMode ? ' is-on' : '')}
                onClick={() => onTogglePreview(false)}>
                관리자
              </button>
              <button
                className={'td-side__preview-btn' + (previewMode ? ' is-on' : '')}
                onClick={() => onTogglePreview(true)}>
                사용자 (미리보기)
              </button>
            </div>
          </div>
        )}

        <div className="td-side__contact">
          <h3 className="td-side__h">문의</h3>
          <ul className="td-side__contact-list">
            <li><span className="ico material-symbols-outlined">mail</span>support@bdr.kr</li>
            <li><span className="ico material-symbols-outlined">phone</span>02-1234-5678</li>
            <li><span className="ico material-symbols-outlined">chat</span>운영자 쪽지 보내기</li>
          </ul>
        </div>
      </aside>
    );
  }

  window.TournamentDetail = function TournamentDetail({ setRoute, isAdmin = false }) {
    const [tab, setTab] = useState('overview');
    const [div, setDiv] = useState('__all');
    const [previewMode, setPreviewMode] = useState(false);

    const pane = useMemo(() => {
      if (tab === 'overview') return <OverviewPane t={T} division={div} />;
      if (tab === 'schedule') return <SchedulePane division={div} />;
      if (tab === 'bracket')  return <BracketPane t={T} division={div} />;
      if (tab === 'teams')    return <TeamsPane division={div} />;
      return <RulesPane />;
    }, [tab, div]);

    return (
      <div className="td-page">
        <div className="td-page__inner">
          <window.Crumbs trail={['홈', '대회', T.name]} />
          <Hero t={T} />

          {/* Sticky bar: division selector + tab bar */}
          <div className="td-sticky">
            <DivisionChips divisions={T.divisions} value={div} onChange={setDiv} />
            <TabBar active={tab} onChange={setTab} />
          </div>

          <div className="td-body">
            <div className="td-body__main">
              {pane}
            </div>
            <Sidebar isAdmin={isAdmin} previewMode={previewMode} onTogglePreview={setPreviewMode} />
          </div>
        </div>

        {/* Mobile sticky bottom — "내 참가 현황" 펼침/접힘 */}
        <div className="td-mobile-sticky">
          <button className="td-mobile-sticky__btn">
            <span className="td-mobile-sticky__txt">
              <span className="td-mobile-sticky__title">내 참가: 결제 대기 (D-2)</span>
              <span className="td-mobile-sticky__sub">5/2까지 ₩40,000 결제 필요</span>
            </span>
            <span className="td-mobile-sticky__cta">결제하기</span>
          </button>
        </div>
      </div>
    );
  };
})();
