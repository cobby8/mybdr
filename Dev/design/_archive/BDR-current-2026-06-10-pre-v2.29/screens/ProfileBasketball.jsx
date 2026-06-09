/* global React */
// ============================================================
// BDR v2.24 — ProfileBasketball (PU3 · Phase 6.1B · 신규 · BP2 ★★★★)
// 운영: /profile/basketball (1068 line · 박제 ❌) — 신규 핵심.
//
// 진입: PU1 "내 농구" 카드 / 더보기
// 복귀: PageBack → PU1
// BP2 cross-domain: UserSeasonStat + Phase 2 BG4 (final_mvp 30일) +
//   Phase 3 BT6 (팀 wins/losses/draws) + Phase 1A PA7 (우승)
// 신규 컴포넌트: 농구 캐릭터 / 시즌 stat 5종 / 선호 chip 8종 / 우승 이력
// ============================================================
function PreferredGroup({ group }) {
  const [sel, setSel] = React.useState(group.selected);
  const toggle = (opt) => setSel(s => s.includes(opt) ? s.filter(x => x !== opt) : [...s, opt]);
  return (
    <div className="pm-pref__group">
      <div className="pm-pref__head">
        <span className="ico material-symbols-outlined">{group.ico}</span>
        <span className="pm-pref__lbl">{group.label}</span>
        <span className="pm-pref__count">{sel.length} 선택</span>
      </div>
      <div className="pm-pref__chips">
        {group.options.map(opt => {
          const on = sel.includes(opt);
          return (
            <button key={opt} className={'pm-chip' + (on ? ' is-on' : '')} onClick={() => toggle(opt)}>
              {on && <span className="ico material-symbols-outlined">check</span>}{opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProfileBasketball() {
  const u = window.USER_ME;
  const s = window.SEASON_STAT;
  const c = window.CAREER_STAT;
  const team = window.ME_TEAMS[0];

  return (
    <div className="pm-page">
      <div className="pm-page__inner">
        <window.PageBack />

        {/* Hero */}
        <header className="pm-hero">
          <div className="pm-hero__row">
            <div className="pm-hero__av">{u.avatar}</div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">내 농구</h1>
                <window.LevelBadge level={u.level} pro={u.subscription_status === 'active'} />
              </div>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">back_hand</span>{window.HAND_LABEL[u.dominant_hand]}</span>
                <span><span className="ico material-symbols-outlined">trending_up</span>{window.SKILL_LABEL[u.skill_level]}</span>
                <span><span className="ico material-symbols-outlined">straighten</span>{u.height}cm · {u.weight}kg</span>
                <span><span className="ico material-symbols-outlined">groups</span>{team.name}</span>
              </div>
            </div>
            <div className="pm-hero__jersey">
              <div className="pm-hero__jersey-n">#{team.jersey}</div>
              <div className="pm-hero__jersey-l">JERSEY</div>
            </div>
          </div>
        </header>

        <div className="pm-grid">
          <div className="pm-main">
            {/* PU3-A — 농구 캐릭터 카드 */}
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">badge</span>농구 캐릭터</h2>
              <div className="pm-char" style={{ marginBottom: 16 }}>
                <div className="pm-char__item"><span className="pm-char__lbl">주 사용 손</span><span className="pm-char__v">{window.HAND_LABEL[u.dominant_hand]}</span></div>
                <div className="pm-char__item"><span className="pm-char__lbl">포지션</span><span className="pm-char__v">{u.position}</span></div>
                <div className="pm-char__item"><span className="pm-char__lbl">실력 수준</span><window.SkillChip skill={u.skill_level} /></div>
              </div>
              <div className="pm-sec-title">강점 (strengths)</div>
              <div className="pm-strengths">
                {u.strengths.map(st => <span key={st} className="pm-strength"><span className="ico material-symbols-outlined">bolt</span>{st}</span>)}
              </div>
            </div>

            {/* PU3-B — 시즌 stat 5종 grid */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">leaderboard</span>{s.season} 시즌 기록</h2>
                <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>UserSeasonStat</span>
              </div>
              <div className="pm-stats">
                <window.StatCard icon="sports_basketball" label="참가 경기" value={s.participated} sub="total" />
                <window.StatCard icon="add_circle" label="호스트" value={s.hosted} sub="주최" />
                <window.StatCard icon="local_fire_department" tone="gold" label="이달의 MVP" value={s.mvp_month} sub="최근 30일" cross />
                <window.StatCard icon="favorite" tone="red" label="매너 평점" value={s.rating} sub={u.manner_count + '회'} />
                <window.StatCard icon="military_tech" tone="blue" label="팀 전적" value={s.team_wins + '승'} sub={s.team_losses + '패 ' + s.team_draws + '무'} cross />
              </div>
              <div className="pm-locked-note" style={{ marginTop: 12 }}>
                <span className="ico material-symbols-outlined">hub</span>
                <span><strong>cross-domain</strong> — 이달의 MVP는 경기 영역, 팀 전적은 소속 팀({team.name}) 영역에서 자동 동기화됩니다.</span>
              </div>
            </div>

            {/* 통산 기록 (Phase 1 8열) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">query_stats</span>통산 평균</h2>
                <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>공식 기록 {c.games}경기</span>
              </div>
              <div className="pm-career" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="pm-career__c"><div className="pm-career__v">{c.win_rate}%</div><div className="pm-career__l">승률</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.ppg}</div><div className="pm-career__l">PPG</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.rpg}</div><div className="pm-career__l">RPG</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.apg}</div><div className="pm-career__l">APG</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.mpg}</div><div className="pm-career__l">MIN</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.fg}%</div><div className="pm-career__l">FG%</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.tp}%</div><div className="pm-career__l">3P%</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.participated}</div><div className="pm-career__l">총 경기</div></div>
              </div>
            </div>

            {/* PU3-C — 선호 정보 chip 8종 */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">tune</span>선호 정보</h2>
                <a className="pm-card__more" href="pu2-profile-edit.html">편집<span className="ico material-symbols-outlined">chevron_right</span></a>
              </div>
              <div className="pm-pref">
                {window.PREFERRED.map(g => <PreferredGroup key={g.key} group={g} />)}
              </div>
            </div>
          </div>

          <aside className="pm-aside">
            {/* PU3-D — 우승 이력 (Phase 1A cross-domain) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">emoji_events</span>입상 이력</h2>
                <a className="pm-card__more" href="pu4-profile-achievements.html">업적</a>
              </div>
              {window.ME_CHAMPIONS.map(ch => (
                <div key={ch.id} className="pm-champ">
                  <span className="pm-champ__medal">{ch.placed === '우승' ? '🥇' : ch.placed === '준우승' ? '🥈' : '🥉'}</span>
                  <div className="pm-champ__body">
                    <div className="pm-champ__tn">{ch.tn}</div>
                    <div className="pm-champ__meta">{ch.team} · {ch.date}</div>
                  </div>
                  <span className="pm-champ__place" data-p={ch.placed}>{ch.placed}</span>
                </div>
              ))}
            </div>

            {/* 진행 중 신청 (운영 PU3 MyPendingRequestsCard 답습) */}
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 12 }}><span className="ico material-symbols-outlined">hourglass_top</span>진행 중 신청</h2>
              <div className="pm-list">
                <a className="pm-list__row" href="tu2-team-detail.html">
                  <span className="pm-list__ico"><span className="ico material-symbols-outlined">group_add</span></span>
                  <div className="pm-list__body"><div className="pm-list__title">송파 새벽런 — 이적 승인</div><div className="pm-list__sub">양 팀장 승인 대기</div></div>
                  <span className="pm-list__right" style={{ color: 'var(--warn)' }}>대기</span>
                </a>
                <a className="pm-list__row" href="ua2-tournament-detail.html">
                  <span className="pm-list__ico"><span className="ico material-symbols-outlined">emoji_events</span></span>
                  <div className="pm-list__body"><div className="pm-list__title">BDR 서머 오픈 #4</div><div className="pm-list__sub">결제 마감 D-2</div></div>
                  <span className="pm-list__right" style={{ color: 'var(--accent)' }}>결제</span>
                </a>
              </div>
            </div>

            {/* 다음 대회 매치 (운영 NextTournamentMatchCard 답습) */}
            <div className="pm-card" style={{ background: 'linear-gradient(180deg, var(--cafe-blue-soft) 0%, var(--bg-elev) 60%)', borderColor: 'var(--cafe-blue-hair)' }}>
              <div className="pm-sec-title" style={{ color: 'var(--cafe-blue-deep)' }}>다음 대회 매치</div>
              <div style={{ fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 800, color: 'var(--ink)' }}>BDR 서머 오픈 #4 · 8강</div>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11.5, color: 'var(--ink-mute)', fontWeight: 700, marginTop: 4 }}>06.15 (일) 14:00 · 장충체육관 2코트</div>
              <a className="pm-hbtn pm-hbtn--primary" style={{ marginTop: 12, width: '100%' }} href="ua2-tournament-detail.html"><span className="ico material-symbols-outlined">calendar_month</span>대회 보기</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.ProfileBasketball = ProfileBasketball;
