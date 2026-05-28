/* global React, TEAMS, GAMES, POSTS, Icon */

function MyPage({ setRoute }) {
  const team = TEAMS[0]; // RDM
  const user = {
    nickname: 'rdm_captain',
    realname: '김리딤',
    position: '가드',
    number: '#7',
    level: 'L.8',
    season: '2026 Spring',
    // Phase 12 본인인증 — 운영 DB 컬럼 적용 전 ?? false fallback
    name_verified: (true ?? false),
    pro: true,
  };

  // Tier 1 — 큰 카드 4종
  const tier1 = [
    {
      id: 'profile-edit',
      icon: '👤',
      title: '프로필',
      sub: null,
      route: 'editProfile',
      meta: [
        { label: '닉네임', value: user.nickname, mono: true },
        { label: '실명', value: user.realname },
        { label: '포지션·번호', value: `${user.position} · ${user.number}` },
        {
          label: '본인인증',
          value: user.name_verified
            ? <span className="badge badge--ok" style={{fontSize:10}}>✓ 인증완료</span>
            : <span className="badge badge--warn" style={{fontSize:10}}>미인증</span>
        },
      ],
      cta: '프로필 편집 →',
    },
    {
      id: 'basketball',
      icon: '🏀',
      title: '내 농구',
      sub: null,
      route: 'stats',
      tag: null,
      stats: [
        { label: 'PPG', value: '14.2' },
        { label: 'APG', value: '5.1' },
        { label: 'RPG', value: '3.8' },
        { label: 'RTG', value: '1,684' },
      ],
      cta: '경기 기록 →',
    },
    {
      id: 'growth',
      icon: '📈',
      title: '내 성장',
      sub: null,
      route: 'profileGrowth',
      tag: null,
      cta: '성장 추이 →',
    },
    {
      id: 'activity',
      icon: '⚡',
      title: '내 활동',
      sub: null,
      route: 'myActivity',
      tag: null,
      cta: '활동 타임라인 →',
    },
  ];

  // Tier 2 — 중간 카드 4종
  const tier2 = [
    { id: 'bookings',     icon: '📅', title: '예약 이력', meta: null, route: 'profileBookings' },
    { id: 'weekly',       icon: '📰', title: '주간 리포트', meta: null, route: 'profileWeekly', isNew: true },
    { id: 'notifications',icon: '🔔', title: '알림',       meta: null, route: 'notifications', count: 3 },
    { id: 'achievements', icon: '🏆', title: '배지·업적',  meta: null, route: 'achievements' },
  ];

  // Tier 3 — 작은 카드 2종
  const tier3 = [
    { id: 'settings', icon: '⚙', title: '설정', meta: '계정·알림·개인정보·공개', route: 'settings' },
    { id: 'billing',  icon: '💳', title: '결제·멤버십', meta: 'BDR+ PRO · 다음 결제 05.18', route: 'billing' },
  ];

  // 보조 정보
  const nextGame = GAMES[0];
  const nextDate = new Date(2026, 4, 4); // mock D-3
  const today = new Date(2026, 4, 1);
  const dDays = Math.round((nextDate - today) / 86400000);
  const recent = [
    { date: '04.22', tag: 'match', label: '대회 접수', target: 'BDR Challenge Spring 2026' },
    { date: '04.20', tag: 'win',   label: '경기 완료', target: '장충체육관 · 21–18 승' },
    { date: '04.18', tag: 'post',  label: '게시글',    target: '장충 픽업경기 후기' },
    { date: '04.17', tag: 'team',  label: '팀 합류',   target: 'REDEEM 정식 팀원' },
    { date: '04.12', tag: 'loss',  label: '경기 완료', target: '반포 3x3 · 15–21 패' },
  ];

  return (
    <div className="page mypage">
      {/* HERO STRIP — identity ribbon */}
      <header className="mypage__hero">
        <div className="mypage__hero-id">
          <div className="mypage__avatar"
               style={{
                 background:`linear-gradient(145deg, ${team.color}, color-mix(in srgb, ${team.color} 30%, var(--bg)))`,
                 color: team.ink
               }}>
            {team.tag}
          </div>
          <div className="mypage__id-text">
            <div className="eyebrow">MY PAGE · 마이페이지</div>
            <h1 className="mypage__name">
              {user.nickname}<span className="mypage__name-suffix"> 의 농구</span>
            </h1>
            <div className="mypage__id-meta">
              <span>{team.name}</span>
              <span className="mypage__dot"/>
              <span>{user.position} · {user.number}</span>
              <span className="mypage__dot"/>
              <span className="t-mono">{user.season}</span>
            </div>
            <div className="mypage__id-badges">
              <span className="badge badge--red">{user.level}</span>
              {user.pro && <span className="badge badge--soft">PRO 멤버</span>}
              {user.name_verified && <span className="badge badge--ok">✓ 본인인증</span>}
            </div>
          </div>
        </div>
        <div className="mypage__hero-actions">
          <button className="btn btn--sm" onClick={()=>setRoute('editProfile')}>프로필 편집</button>
          <button className="btn btn--sm" onClick={()=>setRoute('notifications')}>
            알림 <span className="mypage__count-pip">3</span>
          </button>
          <button className="btn btn--sm btn--primary" onClick={()=>setRoute('playerProfile')}>공개 프로필 →</button>
        </div>
      </header>

      {/* MAIN GRID: hub + aside */}
      <div className="mypage__grid">
        {/* HUB */}
        <div className="mypage-hub">
          <div className="mypage-hub__intro">
            <h2 className="mypage-hub__title">내 활동을 한곳에서</h2>
            <p className="mypage-hub__sub">프로필·농구·활동·설정·결제를 한곳에서 빠르게 관리하세요.</p>
          </div>

          {/* TIER 1 */}
          <section className="mypage-hub__tier mypage-hub__tier-1">
            {tier1.map(card => (
              <button key={card.id}
                      className="mypage-card mypage-card--lg"
                      onClick={()=>setRoute(card.route)}>
                <div className="mypage-card__head">
                  <span className="mypage-card__icon">{card.icon}</span>
                  <div className="mypage-card__heading">
                    <h3>{card.title}</h3>
                    {card.sub && <div className="mypage-card__sub">{card.sub}</div>}
                  </div>
                  {card.tag && <span className="mypage-card__tag">{card.tag}</span>}
                </div>

                {card.id === 'basketball' && (
                  <div className="mypage-card__statgrid">
                    {card.stats.map(s => (
                      <div key={s.label} className="mypage-card__stat">
                        <div className="mypage-card__stat-value">{s.value}</div>
                        <div className="mypage-card__stat-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {card.id === 'growth' && (
                  <Spark values={[2.1, 2.4, 2.0, 2.6, 2.8, 2.9, 3.1, 3.2, 3.0, 3.4, 3.6, 3.8]}/>
                )}

                {card.id === 'activity' && (
                  <div className="mypage-card__act-bars">
                    {[3, 5, 2, 7, 4, 6, 8, 3, 5, 9, 4, 7, 12].map((v, i) => (
                      <div key={i} className="mypage-card__act-bar"
                           style={{height: `${10 + v*4}px`}}/>
                    ))}
                  </div>
                )}

                {card.meta && (
                  <ul className="mypage-card__items">
                    {card.meta.map((m, i) => (
                      <li key={i}>
                        <span className="mypage-card__item-label">{m.label}</span>
                        <span className={`mypage-card__item-value${m.mono?' t-mono':''}`}>{m.value}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mypage-card__cta">{card.cta}</div>
              </button>
            ))}
          </section>

          {/* TIER 2 */}
          <section className="mypage-hub__tier mypage-hub__tier-2">
            {tier2.map(card => (
              <button key={card.id}
                      className="mypage-card mypage-card--md"
                      onClick={()=>setRoute(card.route)}>
                <div className="mypage-card__md-head">
                  <span className="mypage-card__icon">{card.icon}</span>
                  <h3>{card.title}</h3>
                  {card.count && <span className="mypage-card__pill">{card.count}</span>}
                  {card.isNew && <span className="badge badge--new" style={{marginLeft:'auto'}}>NEW</span>}
                </div>
                {card.meta && <div className="mypage-card__md-meta">{card.meta}</div>}
                <div className="mypage-card__md-arrow">→</div>
              </button>
            ))}
          </section>

          {/* TIER 3 */}
          <section className="mypage-hub__tier mypage-hub__tier-3">
            {tier3.map(card => (
              <button key={card.id}
                      className="mypage-card mypage-card--sm"
                      onClick={()=>setRoute(card.route)}>
                <span className="mypage-card__icon mypage-card__icon--sm">{card.icon}</span>
                <div className="mypage-card__sm-text">
                  <div className="mypage-card__sm-title">{card.title}</div>
                  {card.meta && <div className="mypage-card__sm-meta">{card.meta}</div>}
                </div>
                <div className="mypage-card__md-arrow">→</div>
              </button>
            ))}
          </section>

          {/* IA Footnote — 16 page index, collapsed */}
          <details className="mypage-index">
            <summary>전체 페이지 색인 (16 + 외부 5)</summary>
            <div className="mypage-index__grid">
              {[
                ['/profile', '대시보드'],
                ['/profile/edit', '프로필 편집'],
                ['/profile/settings', '설정 (6 섹션)'],
                ['/profile/activity', '내 활동'],
                ['/profile/bookings', '예약 이력'],
                ['/profile/billing', '결제 내역'],
                ['/profile/achievements', '업적·배지'],
                ['/profile/growth', '성장 추이'],
                ['/profile/weekly-report', '주간 리포트'],
                ['/profile/complete', '프로필 완성'],
                ['/profile/notification-settings', '알림 설정'],
                ['/profile/payments', '결제'],
                ['/profile/preferences', '선호'],
                ['/profile/subscription', '멤버십'],
                ['/profile/basketball', '농구 데이터'],
                ['/profile/complete/preferences', '취향'],
                ['/games/my-games', '내 신청 내역', 'ext'],
                ['/community/new', '글 작성', 'ext'],
                ['/safety', '안전·차단', 'ext'],
                ['/stats', '통계 분석', 'ext'],
                ['/refund', '환불 정책', 'ext'],
              ].map(([href, label, kind], i) => (
                <div key={i} className={`mypage-index__row${kind?' mypage-index__row--ext':''}`}>
                  <span className="t-mono">{href}</span>
                  <span>{label}</span>
                  {kind && <span className="badge" style={{fontSize:9}}>EXT</span>}
                </div>
              ))}
            </div>
          </details>
        </div>

        {/* ASIDE */}
        <aside className="mypage__aside">
          {/* Next game — D-N countdown */}
          <div className="card mypage-aside-card">
            <div className="mypage-aside-card__head">
              <span className="eyebrow" style={{fontSize:10}}>다음 경기</span>
            </div>
            <div className="mypage-next">
              <div className="mypage-next__d">D-{Math.max(0, dDays)}</div>
              <div className="mypage-next__body">
                <div className="mypage-next__title">{nextGame.title}</div>
                <div className="mypage-next__meta">{nextGame.court} · {nextGame.time}</div>
                <button className="btn btn--sm" style={{marginTop:8, width:'100%'}}
                        onClick={()=>setRoute('gameDetail')}>경기 상세 →</button>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="card mypage-aside-card">
            <div className="mypage-aside-card__head">
              <span className="eyebrow" style={{fontSize:10}}>소속 팀</span>
              <a className="mypage-aside-card__more" onClick={()=>setRoute('team')}>전체</a>
            </div>
            <div className="mypage-team" onClick={()=>setRoute('teamDetail')}>
              <span className="mypage-team__tag" style={{background:team.color, color:team.ink}}>{team.tag}</span>
              <div style={{flex:1, minWidth:0}}>
                <div className="mypage-team__name">{team.name}</div>
                <div className="mypage-team__rec t-mono">{team.wins}W {team.losses}L · {team.rating}</div>
              </div>
            </div>
          </div>

          {/* Recent activity (5) */}
          <div className="card mypage-aside-card">
            <div className="mypage-aside-card__head">
              <span className="eyebrow" style={{fontSize:10}}>최근 활동</span>
              <a className="mypage-aside-card__more" onClick={()=>setRoute('myActivity')}>전체</a>
            </div>
            <ul className="mypage-recent">
              {recent.map((r, i) => (
                <li key={i} className="mypage-recent__row">
                  <span className="mypage-recent__date t-mono">{r.date}</span>
                  <span className={`mypage-recent__tag mypage-recent__tag--${r.tag}`}/>
                  <span className="mypage-recent__label">{r.label}</span>
                  <span className="mypage-recent__target">{r.target}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Help */}
          <div className="card mypage-aside-card mypage-aside-card--help">
            <div style={{fontWeight:700, fontSize:13, marginBottom:6}}>도움이 필요하세요?</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
              계정 / 결제 / 환불 문의는 24시간 이내 답변드려요.
            </div>
            <div style={{display:'flex', gap:6}}>
              <button className="btn btn--sm" style={{flex:1}} onClick={()=>setRoute('help')}>도움말</button>
              <button className="btn btn--sm" style={{flex:1}} onClick={()=>setRoute('safety')}>안전·차단</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* Tiny inline sparkline used by the 내 성장 card */
function Spark({ values }) {
  const w = 220, h = 44, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const range = (max - min) || 1;
  const step = (w - pad*2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i*step;
    const y = h - pad - ((v - min) / range) * (h - pad*2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const lastX = pad + (values.length-1)*step;
  const lastY = h - pad - ((values[values.length-1] - min) / range) * (h - pad*2);
  return (
    <svg className="mypage-card__spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke="var(--accent)" strokeWidth="2"
                strokeLinejoin="round" strokeLinecap="round"/>
      <circle cx={lastX} cy={lastY} r="3" fill="var(--accent)"/>
    </svg>
  );
}

window.MyPage = MyPage;
