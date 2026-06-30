/* global React */
// ============================================================
// BDR v2.24 — UserPublicProfile (PU5 · Phase 6.1B · 신규 · BP1 ★★★★★)
// 운영: /users/[id] (769 line · 박제 ❌) — 공개 프로필 신규 핵심.
//
// 진입: 선수명단 / 팀 멤버 / 본인 "공개 프로필 미리보기"(PU1-G · ?preview=1)
// 복귀: PageBack
// BP1: PU1(본인) 과 동일 User 데이터 / privacy_settings 필터 / 비공개 필드(이메일·은행·결제) hide
// PU5-D: 본인 시야 = /profile redirect 또는 preview 모드 (혼동 ❌ — 본 시안 = preview)
// 신고 = 운영 Report 모델 미확인 → hide (준비 중)
// ============================================================
function UserPublicProfile() {
  const raw = window.USER_ME;
  const u = window.publicView(raw);       // BP1 — privacy_settings 필터링된 공개 객체
  const s = window.SEASON_STAT;
  const c = window.CAREER_STAT;
  const team = window.ME_TEAMS[0];

  return (
    <div className="pm-page">
      <div className="pm-page__inner">
        <window.PageBack />

        {/* PU5-D — preview 모드 안내 (본인이 보는 공개 시야) */}
        <div className="pm-preview-bar">
          <span className="ico material-symbols-outlined">visibility</span>
          <span><strong>공개 프로필 미리보기</strong> — 다른 사람에게 이렇게 보입니다. 비공개 필드(이메일·연락처·결제)는 가려집니다.</span>
          <a href="pu2-profile-edit.html"><span className="ico material-symbols-outlined">tune</span>공개 범위 설정</a>
        </div>

        {/* Hero (공개 시야 — PU1 과 동일 데이터, 다른 CTA) */}
        <header className="pm-hero pm-hero--public">
          <div className="pm-hero__row">
            <div className="pm-hero__av" style={{ background: team.color }}>{raw.avatar}</div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">{raw.nickname}</h1>
                <window.LevelBadge level={raw.level} />
                {raw.profile_completed && <span className="pm-hero__verified"><span className="ico material-symbols-outlined">verified</span></span>}
              </div>
              <div className="pm-hero__meta">
                <span><span className="ico material-symbols-outlined">sports_basketball</span>{raw.position} · {window.HAND_LABEL[raw.dominant_hand]}</span>
                {u.show_region && <span><span className="ico material-symbols-outlined">location_on</span>{raw.city} {raw.district}</span>}
                {u.show_height_weight && <span><span className="ico material-symbols-outlined">straighten</span>{raw.height}cm · {raw.weight}kg</span>}
                <span><span className="ico material-symbols-outlined">favorite</span>매너 {raw.evaluation_rating}</span>
              </div>
              {u.bio && <p className="pm-hero__bio">{u.bio}</p>}
            </div>
          </div>
          <div className="pm-hero__actions">
            {/* PU5-B — 본인이 아닐 시 CTA (preview 에선 비활성 안내) */}
            <button className="pm-hbtn pm-hbtn--primary" disabled style={{ opacity: .55, cursor: 'default' }}><span className="ico material-symbols-outlined">group_add</span>팀 초대</button>
            <button className="pm-hbtn" disabled style={{ opacity: .55, cursor: 'default' }}><span className="ico material-symbols-outlined">chat</span>1:1 메시지</button>
            {/* 신고 = 운영 Report 모델 미확인 → hide (준비 중) */}
          </div>
        </header>

        <div className="pm-grid">
          <div className="pm-main">
            {/* PU5-A — 공개 stat (PU3 와 동일 데이터 / privacy 필터) */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">leaderboard</span>{s.season} 시즌 기록</h2>
                <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>공개</span>
              </div>
              {u.show_season_stat ? (
                <div className="pm-stats">
                  <window.StatCard icon="sports_basketball" label="참가 경기" value={s.participated} />
                  <window.StatCard icon="add_circle" label="호스트" value={s.hosted} />
                  <window.StatCard icon="local_fire_department" tone="gold" label="이달의 MVP" value={s.mvp_month} cross />
                  <window.StatCard icon="favorite" tone="red" label="매너 평점" value={s.rating} />
                  <window.StatCard icon="military_tech" tone="blue" label="팀 전적" value={s.team_wins + '승'} cross />
                </div>
              ) : (
                <div className="pm-empty"><span className="ico material-symbols-outlined">lock</span><p>이 사용자가 시즌 기록을 비공개했습니다</p></div>
              )}
              <div className="pm-career" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 12 }}>
                <div className="pm-career__c"><div className="pm-career__v">{c.win_rate}%</div><div className="pm-career__l">승률</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.ppg}</div><div className="pm-career__l">PPG</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.rpg}</div><div className="pm-career__l">RPG</div></div>
                <div className="pm-career__c"><div className="pm-career__v">{c.apg}</div><div className="pm-career__l">APG</div></div>
              </div>
            </div>

            {/* PU5-C — 활동 미리보기 (최근 경기 5 · Phase 2 cross-domain) */}
            {u.show_activity && (
              <div className="pm-card">
                <div className="pm-card__head">
                  <h2 className="pm-card__h"><span className="ico material-symbols-outlined">history</span>최근 경기</h2>
                  <span className="pm-card__more" style={{ color: 'var(--ink-mute)', cursor: 'default' }}>최근 5</span>
                </div>
                <div className="pm-list">
                  {window.ME_RECENT_GAMES.map(g => (
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
              </div>
            )}

            {/* 업적 (공개) */}
            {u.show_achievements && (
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">military_tech</span>업적</h2>
                <div className="pm-badges pm-badges--mini">
                  {window.BADGE_RECENT.map(b => <window.BadgeTile key={b.type} badge={b} mini />)}
                </div>
              </div>
            )}
          </div>

          <aside className="pm-aside">
            {/* 소속 팀 (Phase 3 cross-domain) */}
            {u.show_teams && (
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 12 }}><span className="ico material-symbols-outlined">groups</span>소속 팀</h2>
                <div className="pm-list">
                  {window.ME_TEAMS.map(t => (
                    <a key={t.id} className="pm-team" href="tu2-team-detail.html">
                      <span className="pm-team__logo" style={{ background: t.color }}>{t.logo}</span>
                      <div className="pm-team__body"><div className="pm-team__name">{t.name}</div><div className="pm-team__sub">{t.city} · #{t.jersey}</div></div>
                      {t.role === 'captain' && <window.RoleBadge role="captain" small />}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* 소속 단체 (Phase 4 cross-domain) */}
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 12 }}><span className="ico material-symbols-outlined">apartment</span>소속 단체</h2>
              <div className="pm-list">
                {window.ME_ORGS.map(o => (
                  <a key={o.id} className="pm-team" href="ou2-organization-detail.html">
                    <span className="pm-team__logo" style={{ background: 'var(--bdr-navy)' }}>{o.avatar}</span>
                    <div className="pm-team__body"><div className="pm-team__name">{o.name}</div><div className="pm-team__sub">{o.role}</div></div>
                  </a>
                ))}
              </div>
            </div>

            {/* 비공개 필드 안내 (BP1 — hide 일관성 시각화) */}
            <div className="pm-card">
              <div className="pm-sec-title">비공개 항목 (본인만 표시)</div>
              <div className="pm-list">
                <div className="pm-list__row" style={{ cursor: 'default' }}>
                  <span className="pm-list__ico"><span className="ico material-symbols-outlined">mail</span></span>
                  <div className="pm-list__body"><div className="pm-list__title" style={{ color: 'var(--ink-mute)' }}>이메일</div></div>
                  <span className="pm-hidden"><span className="ico material-symbols-outlined">lock</span>비공개</span>
                </div>
                <div className="pm-list__row" style={{ cursor: 'default' }}>
                  <span className="pm-list__ico"><span className="ico material-symbols-outlined">call</span></span>
                  <div className="pm-list__body"><div className="pm-list__title" style={{ color: 'var(--ink-mute)' }}>연락처</div></div>
                  <span className="pm-hidden"><span className="ico material-symbols-outlined">lock</span>비공개</span>
                </div>
                <div className="pm-list__row" style={{ cursor: 'default' }}>
                  <span className="pm-list__ico"><span className="ico material-symbols-outlined">account_balance</span></span>
                  <div className="pm-list__body"><div className="pm-list__title" style={{ color: 'var(--ink-mute)' }}>결제·정산</div></div>
                  <span className="pm-hidden"><span className="ico material-symbols-outlined">lock</span>항상 비공개</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.UserPublicProfile = UserPublicProfile;
