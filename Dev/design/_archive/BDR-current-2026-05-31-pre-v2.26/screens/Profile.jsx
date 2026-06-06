/* global React */
// ============================================================
// BDR v2.24 — ProfileMain (PU1 · Phase 6.1B · 보강 · BP1 + BP6)
// 운영: /profile (831 line · Phase 13 박제) — 카운트 동기화 + 진입 다리 보강.
//
// 진입: AppNav 더보기 → 마이페이지 / 로그인 후
// 복귀: AppNav
// BP1: PU5 와 동일 User 데이터 (privacy_settings 분기). "공개 프로필 미리보기" → PU5 preview
// BP6: 상단 카운트 = UC1(/profile/activity) 카드 카운트 동일 source · "내 활동" 진입 CTA
// ============================================================
function ProfileMain() {
  const u = window.USER_ME;
  const s = window.SEASON_STAT;
  const isPro = u.subscription_status === 'active';

  // BP6 — UC1 활동 카드와 동일 source 카운트
  const counts = [
    { v: window.MY_TOURNAMENTS.length, l: '내 대회', href: 'uc1-my-activity.html' },
    { v: s.participated, l: '내 경기', href: 'uc1-my-activity.html' },
    { v: window.ME_TEAMS.length, l: '내 팀', href: 'uc1-my-activity.html' },
    { v: window.ME_ORGS.length, l: '내 단체', href: 'uc1-my-activity.html' },
    { v: u.evaluation_rating, l: '매너 평점', href: 'uc1-my-activity.html', accent: true },
  ];

  return (
    <div className="pm-page">
      <div className="pm-page__inner">
        {/* Hero (PU1-C — PU5 와 동일 데이터 / 본인 시야) */}
        <header className="pm-hero">
          <div className="pm-hero__row">
            <div className="pm-hero__av">{u.avatar}</div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">{u.nickname}</h1>
                <window.LevelBadge level={u.level} pro={isPro} />
                {u.profile_completed && <span className="pm-hero__verified" title="본인 인증"><span className="ico material-symbols-outlined">verified</span></span>}
              </div>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">sports_basketball</span>{u.position} · {window.HAND_LABEL[u.dominant_hand]}</span>
                <span><span className="ico material-symbols-outlined">location_on</span>{u.city} {u.district}</span>
                <span><span className="ico material-symbols-outlined">favorite</span>매너 {u.evaluation_rating} <em style={{ fontStyle: 'normal', opacity: .6 }}>({u.manner_count})</em></span>
              </div>
              <p className="pm-hero__bio">{u.bio}</p>
            </div>
          </div>
          <div className="pm-hero__actions">
            {/* PU1-D — 프로필 편집 → PU2 */}
            <a className="pm-hbtn pm-hbtn--accent" href="pu2-profile-edit.html"><span className="ico material-symbols-outlined">edit</span>프로필 편집</a>
            {/* PU1-G — 공개 프로필 미리보기 → PU5 preview */}
            <a className="pm-hbtn" href="pu5-user-public.html"><span className="ico material-symbols-outlined">visibility</span>공개 프로필 미리보기</a>
          </div>
        </header>

        {/* BP6 — 카운트 strip (UC1 동기화) */}
        <div className="pm-counts">
          {counts.map((c, i) => (
            <a key={i} className={'pm-count' + (c.accent ? ' pm-count--accent' : '')} href={c.href}>
              <div className="pm-count__v">{c.v}</div>
              <div className="pm-count__l">{c.l}</div>
            </a>
          ))}
        </div>

        <div className="pm-grid">
          <div className="pm-main">
            {/* PU1-B — 내 활동 진입 (BP6 → UC1) */}
            <a className="pm-card pm-card--link" href="uc1-my-activity.html">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">timeline</span>내 활동</h2>
                <span className="pm-card__more">전체 보기<span className="ico material-symbols-outlined">chevron_right</span></span>
              </div>
              <div className="pm-list">
                {window.ME_RECENT_GAMES.slice(0, 3).map(g => (
                  <div key={g.id} className="pm-list__row">
                    <span className="pm-list__ico"><span className="ico material-symbols-outlined">sports_basketball</span></span>
                    <div className="pm-list__body">
                      <div className="pm-list__title">{g.title}{g.mvp && <span className="pm-mvp-dot"> ★ MVP</span>}</div>
                      <div className="pm-list__sub">{g.date}</div>
                    </div>
                    <span className={'pm-list__right ' + (g.result[0] === 'W' ? 'pm-win' : 'pm-loss')}>{g.result}</span>
                  </div>
                ))}
              </div>
            </a>

            {/* PU1-E — 농구 정보 미니 (PU3 link) */}
            <a className="pm-card pm-card--link" href="pu3-profile-basketball.html">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">sports_basketball</span>내 농구</h2>
                <span className="pm-card__more">시즌 기록<span className="ico material-symbols-outlined">chevron_right</span></span>
              </div>
              <div className="pm-char" style={{ marginBottom: 14 }}>
                <div className="pm-char__item"><span className="pm-char__lbl">주 사용 손</span><span className="pm-char__v">{window.HAND_LABEL[u.dominant_hand]}</span></div>
                <div className="pm-char__item"><span className="pm-char__lbl">실력</span><window.SkillChip skill={u.skill_level} /></div>
                <div className="pm-char__item" style={{ flex: 1 }}>
                  <span className="pm-char__lbl">강점</span>
                  <div className="pm-strengths">
                    {u.strengths.slice(0, 3).map(st => <span key={st} className="pm-strength"><span className="ico material-symbols-outlined">bolt</span>{st}</span>)}
                  </div>
                </div>
              </div>
              <div className="pm-career">
                <div className="pm-career__c"><div className="pm-career__v">{s.participated}</div><div className="pm-career__l">참가 경기</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.hosted}</div><div className="pm-career__l">호스트</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.mvp_month}</div><div className="pm-career__l">이달 MVP</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{s.team_wins}-{s.team_losses}-{s.team_draws}</div><div className="pm-career__l">팀 전적</div></div>
              </div>
            </a>

            {/* PU1-F — 업적 미니 (PU4 link) */}
            <a className="pm-card pm-card--link" href="pu4-profile-achievements.html">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">military_tech</span>최근 업적</h2>
                <span className="pm-card__more">전체 {window.BADGE_EARNED.length}<span className="ico material-symbols-outlined">chevron_right</span></span>
              </div>
              <div className="pm-badges pm-badges--mini">
                {window.BADGE_RECENT.map(b => <window.BadgeTile key={b.type} badge={b} mini />)}
              </div>
            </a>
          </div>

          <aside className="pm-aside">
            {/* 소속 팀 */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">groups</span>소속 팀</h2>
                <a className="pm-card__more" href="tu1-teams.html">팀 찾기</a>
              </div>
              <div className="pm-list">
                {window.ME_TEAMS.map(t => (
                  <a key={t.id} className="pm-team" href="tu2-team-detail.html">
                    <span className="pm-team__logo" style={{ background: t.color }}>{t.logo}</span>
                    <div className="pm-team__body">
                      <div className="pm-team__name">{t.name}</div>
                      <div className="pm-team__sub">{t.city} · #{t.jersey}</div>
                    </div>
                    {t.role === 'captain' && <window.RoleBadge role="captain" small />}
                  </a>
                ))}
              </div>
            </div>

            {/* 최근 작성 글 */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">edit_note</span>내 게시글</h2>
                <a className="pm-card__more" href="cu1-community-list.html">커뮤니티</a>
              </div>
              <div className="pm-list">
                {window.ME_RECENT_POSTS.map(p => (
                  <a key={p.id} className="pm-list__row" href="cu2-community-detail.html">
                    <span className="pm-list__ico"><span className="ico material-symbols-outlined">article</span></span>
                    <div className="pm-list__body">
                      <div className="pm-list__title">{p.title}</div>
                      <div className="pm-list__sub">{p.date}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* 도움말 */}
            <div className="pm-card">
              <div style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>도움이 필요하세요?</div>
              <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 12, lineHeight: 1.5 }}>계정 · 결제 · 환불 문의는 24시간 이내 답변드려요.</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <a className="btn btn--sm" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>도움말</a>
                <a className="btn btn--sm" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>설정</a>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.ProfileMain = ProfileMain;
