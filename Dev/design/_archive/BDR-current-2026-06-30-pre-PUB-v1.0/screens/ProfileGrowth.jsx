/* global React */
// ============================================================
// BDR v2.26 — ProfileGrowth (GU1 · Phase 6.3 · 보강 · BG1 ★★★)
// 운영: /profile/growth (835 · v2.2 P1-1 박제 ✅) — 게이미피케이션 보강.
//
// GU1-A Hero 레벨·XP = PU1 시각 일관 · GU1-B 마일스톤 6 = PU4 user_badges 정합
// GU1-C 다음 목표 progress + CTA · GU1-D DB 미지원 = "준비 중"(warn-soft).
// ============================================================
function ProfileGrowth() {
  const g = window.GROWTH;
  const u = window.USER_ME;
  const xpPct = window.gwXpPct();

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <window.PageBackBilling />
        <div className="bl-crumb">
          <a href="pu1-profile.html">프로필</a><span className="sep">›</span><span className="cur">내 성장</span>
        </div>

        {/* GU1-A — Hero (게이미피케이션 · PU1 시각 일관) */}
        <header className="pm-hero">
          <div className="pm-hero__row">
            <div className="pm-hero__av" style={{ background: 'rgba(255,255,255,.14)', fontSize: 38 }}>{g.emoji}</div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">내 성장</h1>
                <window.LevelBadge level={g.level} pro={u.subscription_status === 'active'} />
              </div>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">military_tech</span>{g.title}</span>
                <span><span className="ico material-symbols-outlined">local_fire_department</span>{g.streak}주 연속</span>
              </div>
              {/* XP progress */}
              <div style={{ marginTop: 14, maxWidth: 460 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.8)', marginBottom: 5 }}>
                  <span>{g.xp.toLocaleString('ko-KR')} XP</span>
                  <span>다음 레벨 {g.next_level_xp.toLocaleString('ko-KR')} XP</span>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,.16)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: xpPct + '%', height: '100%', background: 'var(--accent)', borderRadius: 4 }}></div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="pm-grid">
          <div className="pm-main">
            {/* GU1-D — 12주 추이 (DB 미지원 → 준비 중) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">show_chart</span>최근 12주 추이</h2>
                <window.ComingSoon />
              </div>
              <div className="gw-trend">
                <div>
                  <div className="pm-sec-title">주간 경기 수</div>
                  <window.GrowthSpark data={g.weekly_games} />
                </div>
                <div>
                  <div className="pm-sec-title">주간 평균 평점</div>
                  <window.GrowthLine data={g.weekly_ratings} />
                </div>
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--ink-dim)', margin: '10px 0 0' }}>주간 집계는 준비 중이며, 현재는 예시 추이를 표시합니다. 실제 데이터 연동 시 자동 갱신됩니다.</p>
            </div>

            {/* GU1-B — 마일스톤 6 (PU4 user_badges 정합) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">flag</span>마일스톤</h2>
                <a className="pm-card__more" href="pu4-profile-achievements.html">업적 배지 보기<span className="ico material-symbols-outlined">chevron_right</span></a>
              </div>
              <div className="gw-miles">
                {g.milestones.map((m, i) => <window.MilestoneTile key={i} m={m} />)}
              </div>
              <div className="pm-locked-note" style={{ marginTop: 12 }}>
                <span className="ico material-symbols-outlined">hub</span>
                <span><strong>cross-domain</strong> — 마일스톤은 업적(<a href="pu4-profile-achievements.html">PU4 user_badges</a>) · 시즌 stat(<a href="pu3-profile-basketball.html">PU3</a>)과 동일 데이터를 공유합니다.</span>
              </div>
            </div>
          </div>

          <aside className="pm-aside">
            {/* GU1-C — 다음 목표 + CTA */}
            <div className="gw-goal">
              <span className="gw-goal__ico ico material-symbols-outlined">flag_circle</span>
              <div className="gw-goal__body">
                <div className="gw-goal__t">다음 목표 — {g.next_goal.label2}</div>
                <div className="gw-goal__d">{g.next_goal.remaining2}경기 남았어요. 이번 주 추천 경기로 마일스톤을 채워보세요.</div>
              </div>
              <a className="pm-hbtn pm-hbtn--accent" href="p2-ua1-games.html" style={{ width: '100%' }}><span className="ico material-symbols-outlined">search</span>경기 찾기</a>
            </div>

            {/* 주간 리포트 link */}
            <a className="pm-card pm-card--link" href="gu2-weekly-report.html">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="pm-list__ico" style={{ background: 'var(--cafe-blue-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>mail</span></span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)' }}>주간 운동 리포트</div>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', marginTop: 2 }}>매주 월요일 오전 9시 발송</div>
                </div>
                <span className="ico material-symbols-outlined" style={{ color: 'var(--ink-dim)' }}>chevron_right</span>
              </div>
            </a>

            {/* GU1-D — 준비 중 (구간별 상세 분석) */}
            <div className="gw-ph">
              <span className="gw-ph__ico ico material-symbols-outlined">analytics</span>
              <div className="gw-ph__body">
                <div className="gw-ph__t">구간별 상세 분석 <window.ComingSoon /></div>
                <div className="gw-ph__d">포지션별 · 코트별 · 시간대별 분석이 곧 추가됩니다.</div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.ProfileGrowth = ProfileGrowth;
