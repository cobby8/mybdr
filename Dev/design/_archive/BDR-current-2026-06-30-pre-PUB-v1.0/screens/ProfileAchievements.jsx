/* global React */
// ============================================================
// BDR v2.24 — ProfileAchievements (PU4 · Phase 6.1B · 보강 · BP3)
// 운영: /profile/achievements (105 line · 서버 user_badges) — 시각 보강.
//
// 진입: PU1 업적 카드 "전체" / AppNav 더보기 → 마이페이지
// 복귀: PageBack → PU1
// BP3 cross-domain: user_badges + Phase 1A PA7 우승 자동 (champion_team_id) +
//   Phase 2 BG4 MVP 누적 (final_mvp_user_id)
// ============================================================
function ProfileAchievements() {
  const s = window.SEASON_STAT;
  const earned = window.BADGE_EARNED.length;
  const total = window.BADGE_CATALOG.length;

  return (
    <div className="pm-page">
      <div className="pm-page__inner">
        <window.PageBack />

        {/* Hero summary */}
        <header className="pm-hero">
          <div className="pm-hero__row">
            <div className="pm-hero__av" style={{ background: '#B47A11', fontSize: 30 }}>
              <span className="ico material-symbols-outlined" style={{ fontSize: 38 }}>military_tech</span>
            </div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">업적</h1>
                <span className="pm-lvl__n">{earned} / {total}</span>
              </div>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">emoji_events</span>대회 우승 {window.ME_CHAMPIONS.filter(c => c.placed === '우승').length}</span>
                <span><span className="ico material-symbols-outlined">local_fire_department</span>MVP 누적 {s.mvp_total}회</span>
                <span><span className="ico material-symbols-outlined">workspace_premium</span>배지 {earned}개 획득</span>
              </div>
              <p className="pm-hero__bio">경기·대회·매너 활동으로 자동 적립됩니다. 대회 우승과 MVP는 기록 확정 시 즉시 반영돼요.</p>
            </div>
          </div>
        </header>

        <div className="pm-grid">
          <div className="pm-main">
            {/* 배지 grid (PU4-A) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">workspace_premium</span>획득 배지</h2>
                <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>{earned} / {total}</span>
              </div>
              <div className="pm-badges">
                {window.BADGE_CATALOG.map(b => <window.BadgeTile key={b.type} badge={b} />)}
              </div>
            </div>

            {/* 대회 우승 자동 (PU4-B · Phase 1A PA7 cross-domain) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">emoji_events</span>대회 입상 이력</h2>
                <a className="pm-card__more" href="ua1-tournaments.html">대회 찾기<span className="ico material-symbols-outlined">chevron_right</span></a>
              </div>
              {window.ME_CHAMPIONS.map(c => (
                <div key={c.id} className="pm-champ">
                  <span className="pm-champ__medal">{c.placed === '우승' ? '🥇' : c.placed === '준우승' ? '🥈' : '🥉'}</span>
                  <div className="pm-champ__body">
                    <div className="pm-champ__tn">{c.tn}</div>
                    <div className="pm-champ__meta">{c.division} · {c.team} · {c.date}</div>
                  </div>
                  <span className="pm-champ__place" data-p={c.placed}>
                    {c.placed}
                    {c.auto && <span className="pm-champ__auto">자동</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <aside className="pm-aside">
            {/* MVP 누적 (PU4-C · Phase 2 BG4 cross-domain) */}
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">local_fire_department</span>MVP 누적</h2>
              <div className="pm-stats pm-stats--4" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <window.StatCard icon="local_fire_department" tone="red" label="전체 MVP" value={s.mvp_total} sub="누적" cross />
                <window.StatCard icon="calendar_month" tone="gold" label="이달의 MVP" value={s.mvp_month} sub="최근 30일" cross />
              </div>
              <div className="pm-locked-note" style={{ marginTop: 12 }}>
                <span className="ico material-symbols-outlined">insights</span>
                <span>경기 영역 <strong>최종 MVP</strong> 기록에서 자동 집계됩니다.</span>
              </div>
            </div>

            {/* 시즌 stat 미니 (PU4-D · PU3 link) */}
            <a className="pm-card pm-card--link" href="pu3-profile-basketball.html">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">sports_basketball</span>시즌 기록</h2>
                <span className="pm-card__more">내 농구<span className="ico material-symbols-outlined">chevron_right</span></span>
              </div>
              <div className="pm-career">
                <div className="pm-career__c"><div className="pm-career__v">{s.participated}</div><div className="pm-career__l">참가</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.hosted}</div><div className="pm-career__l">호스트</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.rating}</div><div className="pm-career__l">평점</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.team_wins}승</div><div className="pm-career__l">팀 전적</div></div>
              </div>
            </a>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.ProfileAchievements = ProfileAchievements;
