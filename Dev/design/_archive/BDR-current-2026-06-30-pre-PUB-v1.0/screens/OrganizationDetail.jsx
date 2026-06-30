/* global React */
// ============================================================
// BDR v2.22 — OrganizationDetail (OU2 · Phase 4B · 보강 · BO2 + BO7)
// 운영 박제 대상: /organizations/[slug]?tab=overview|teams|events|members
// 진입: OU1 카드 / 브레드크럼 (홈 → 단체)
// 복귀: 4탭 클릭 → ?tab= 동기화 / Hero "가입 신청" → 모달 (시안에서는 alert)
// 에러: org.status === archived 시 "보관된 단체" 안내 페이지
//
// 보강 (운영 211 line · OrgHeroV2 + OrgTabsV2 + 4 tab components) :
//   탭 1 overview  — 단체 소개 + 연락 정보 (BO1 신청 form 동일 필드)
//   탭 2 teams     — 소속 시리즈 참가 팀 (Phase 3 TeamCard 답습)
//   탭 3 events    — 시리즈 → 회차 위계 (BO2 답습 hierarchy crumb)
//   탭 4 members   — 단체 운영 멤버 list
//
// sidebar (BT7 답습 cross-domain · 본인 admin 일 때만 노출):
//   - 다음 회차 (BO8 cross-domain → Phase 1 대회 list)
//   - 시리즈 hub 진입
//   - 멤버 초대 (OO2)
// A 등급
// ============================================================

function OrganizationDetail() {
  const org = window.ORG_LIST[0];  // 강남구농회농구협회
  const allSeries = window.SERIES_LIST.filter(s => s.org_id === org.id);
  const teams = window.TEAM_LIST.slice(0, 6);  // 단체 소속 팀 (mock — 시리즈 참가 팀 답습)
  const members = window.ORG_MEMBERS_MOCK;

  const [tab, setTab] = React.useState('overview');
  const isAdmin = org.my_role === 'owner' || org.my_role === 'admin';

  const breadcrumb = [
    { label: '홈', icon: 'home' },
    { label: '단체' },
    { label: org.name, current: true, icon: 'apartment' },
  ];

  return (
    <div className="ou2-page">
      <div className="ou2-page__crumbs">
        <window.OrgHierarchyCrumbs trail={breadcrumb}/>
      </div>

      <window.OrgHero org={org} isMember={!!org.my_role}/>

      {/* 4 tabs */}
      <div className="ou2-tabs">
        {[
          { v: 'overview', l: '개요',   ico: 'info' },
          { v: 'teams',    l: '소속 팀', ico: 'groups',          count: teams.length },
          { v: 'events',   l: '시리즈 · 대회', ico: 'collections_bookmark', count: allSeries.length },
          { v: 'members',  l: '운영 멤버', ico: 'shield_person', count: members.length },
        ].map(t => (
          <button key={t.v}
            className="ou2-tab"
            data-active={tab === t.v}
            onClick={()=>setTab(t.v)}>
            <span className="ico material-symbols-outlined">{t.ico}</span>
            {t.l}
            {t.count != null && <span className="ou2-tab__count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="ou2-grid">
        <div className="ou2-main">
          {/* ========== TAB 1: OVERVIEW ========== */}
          {tab === 'overview' && (
            <>
              <div className="ou2-card">
                <h2 className="ou2-card__h">
                  <span className="ico material-symbols-outlined">info</span>
                  단체 소개
                </h2>
                <p style={{fontSize:14, color:'var(--ink-soft)', lineHeight:1.7, margin:0}}>{org.description}</p>
              </div>

              <div className="ou2-card">
                <h2 className="ou2-card__h">
                  <span className="ico material-symbols-outlined">contact_mail</span>
                  연락 정보
                </h2>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">단체 소유자</span>
                  <span className="ou2-info-row__v">{org.owner.nickname}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">설립</span>
                  <span className="ou2-info-row__v">{org.founded_year}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">활동 지역</span>
                  <span className="ou2-info-row__v">{org.region}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">연락 이메일</span>
                  <span className="ou2-info-row__v">{org.contact_email}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">웹사이트</span>
                  <span className="ou2-info-row__v">
                    {org.website_url
                      ? <a href={org.website_url} style={{color:'var(--cafe-blue-deep)', textDecoration:'underline'}}>{org.website_url}</a>
                      : <span style={{color:'var(--ink-dim)'}}>미등록</span>}
                  </span>
                </div>
              </div>

              {/* 통계 카드 (요약) */}
              <div className="ou2-card">
                <h2 className="ou2-card__h">
                  <span className="ico material-symbols-outlined">monitoring</span>
                  단체 활동
                </h2>
                <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
                  <div className="ta2-activity">
                    <div className="ta2-activity__num">{org.series_count}</div>
                    <div className="ta2-activity__lbl">시리즈</div>
                  </div>
                  <div className="ta2-activity">
                    <div className="ta2-activity__num">{org.tournaments_count}</div>
                    <div className="ta2-activity__lbl">누적 대회</div>
                  </div>
                  <div className="ta2-activity">
                    <div className="ta2-activity__num">{org.teams_count}</div>
                    <div className="ta2-activity__lbl">참가 팀 (누적)</div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ========== TAB 2: TEAMS (소속 팀) ========== */}
          {tab === 'teams' && (
            <div className="ou2-card">
              <h2 className="ou2-card__h">
                <span className="ico material-symbols-outlined">groups</span>
                소속 시리즈 참가 팀
                <span style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-mute)'}}>최근 12개월 기준</span>
              </h2>
              <div className="ou2-teams-grid">
                {teams.map(t => (
                  <a key={t.id} className="team-card team-card--list" style={{padding:'12px 14px'}}>
                    <div className="team-card__head">
                      <window.JerseyAvatar logo={t.logo} color1={t.color_primary} color2={t.color_secondary} size={36}/>
                      <div className="team-card__head-text">
                        <div className="team-card__name" style={{fontSize:13.5}}>{t.name}</div>
                        <div className="team-card__sub">{t.city} · 캡틴 {t.captain.name}</div>
                      </div>
                    </div>
                    <div className="team-card__meta" style={{borderTop:0, padding:0, fontSize:11}}>
                      <span className="team-card__meta-item">
                        <span className="ico material-symbols-outlined">military_tech</span>
                        {t.wins}승 {t.losses}패
                      </span>
                      <span className="team-card__meta-item">
                        <window.MannerStars avg={t.manner_avg}/>
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* ========== TAB 3: EVENTS (시리즈 → 회차) — BO2 위계 ========== */}
          {tab === 'events' && (
            <>
              <div style={{marginBottom:6, fontSize:12.5, color:'var(--ink-mute)', display:'flex', gap:6, alignItems:'center'}}>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:14, color:'var(--accent)'}}>account_tree</span>
                위계: <b style={{color:'var(--ink)', fontFamily:'var(--ff-mono)', letterSpacing:'0.04em'}}>단체</b> → 시리즈 → 회차 → 대회 — BO2
              </div>
              {allSeries.map(s => {
                const fakeEditions = [
                  { id: s.id + '-e3', name: s.name + ' #' + s.tournaments_count, date: '2026-06-15', status: 'recruit', teams: 18, max: 24 },
                  { id: s.id + '-e2', name: s.name + ' #' + (s.tournaments_count - 1), date: '2025-09-12', status: 'completed', teams: 24, max: 24 },
                  { id: s.id + '-e1', name: s.name + ' #' + (s.tournaments_count - 2), date: '2025-03-08', status: 'completed', teams: 22, max: 24 },
                ];
                return (
                  <div key={s.id} className="ou2-series-block">
                    <div className="ou2-series-block__head">
                      <div className="ou2-series-block__logo" style={{background: s.color}}>{s.logo}</div>
                      <div className="ou2-series-block__body">
                        <div className="ou2-series-block__name">{s.name}</div>
                        <div className="ou2-series-block__count">
                          {s.tournaments_count}회 진행 · 누적 {s.teams_total}팀 · {s.description}
                        </div>
                      </div>
                      <a className="btn btn--sm btn--ghost" href="ou4-series.html">
                        시리즈 hub <span className="ico material-symbols-outlined">arrow_forward</span>
                      </a>
                    </div>
                    <div className="ou2-series-block__editions">
                      {fakeEditions.map(e => (
                        <a key={e.id} className="ou2-edition">
                          <div className="ou2-edition__name">{e.name}</div>
                          <div className="ou2-edition__meta">
                            <span><span className={'ou2-edition__status ou2-edition__status--' + e.status}>
                              {{ recruit:'모집중', ongoing:'진행중', completed:'종료' }[e.status]}
                            </span></span>
                            <span>{e.date}</span>
                            <span>{e.teams}/{e.max}팀</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ========== TAB 4: MEMBERS ========== */}
          {tab === 'members' && (
            <div className="ou2-card">
              <h2 className="ou2-card__h">
                <span className="ico material-symbols-outlined">shield_person</span>
                운영 멤버
                <span style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-mute)'}}>
                  관리자 {members.filter(m => m.role === 'owner' || m.role === 'admin').length} · 멤버 {members.filter(m => m.role === 'member').length}
                </span>
              </h2>
              <div className="ou2-member-grid">
                {members.map(m => (
                  <div key={m.id} className="ou2-member">
                    <div className="ou2-member__av">{m.avatar}</div>
                    <div className="ou2-member__body">
                      <div className="ou2-member__name">
                        {m.nickname}
                        <span className={'org-member-role org-member-role--' + m.role}>
                          {{ owner:'소유자', admin:'관리자', member:'멤버' }[m.role]}
                        </span>
                      </div>
                      <div className="ou2-member__since">SINCE {m.joined_at.slice(0, 7)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========== SIDEBAR ========== */}
        <aside className="ou2-side">
          {/* 다음 회차 (BO8 cross-domain → Phase 1 대회) */}
          <div className="ou2-card ou2-next-edition">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">event</span>
              다음 회차
            </h2>
            <div className="ou2-next-edition__date">2026-05-09 · 잠실학생체육관</div>
            <div className="ou2-next-edition__name">강남구협회장배 봄 농구대회</div>
            <a className="ou2-next-edition__cta" href="ua2-tournament-detail.html">
              대회 상세 → 신청
            </a>
          </div>

          {/* 운영 액션 (BT7 답습 cross-domain) — admin only */}
          {isAdmin && (
            <div className="ou2-card ou2-ops">
              <h2 className="ou2-card__h">
                <span className="ico material-symbols-outlined">admin_panel_settings</span>
                내 운영 액션
                <window.SeriesOperatorBadge/>
              </h2>
              <a className="ou2-ops__row" href="oo2-orgadmin-detail.html">
                <span className="ico material-symbols-outlined">dashboard</span>
                <div className="ou2-ops__row-body">
                  <div className="ou2-ops__row-title">단체 관리 대시보드</div>
                  <div className="ou2-ops__row-sub">멤버 · 시리즈 · 활동 이력</div>
                </div>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, color:'var(--ink-dim)'}}>arrow_forward</span>
              </a>
              <a className="ou2-ops__row" href="oo3-series-admin.html">
                <span className="ico material-symbols-outlined">add_circle</span>
                <div className="ou2-ops__row-body">
                  <div className="ou2-ops__row-title">새 시리즈 만들기</div>
                  <div className="ou2-ops__row-sub">3-step 마법사 (PA3 답습)</div>
                </div>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, color:'var(--ink-dim)'}}>arrow_forward</span>
              </a>
              <a className="ou2-ops__row">
                <span className="ico material-symbols-outlined">person_add</span>
                <div className="ou2-ops__row-body">
                  <div className="ou2-ops__row-title">운영 멤버 초대</div>
                  <div className="ou2-ops__row-sub">이메일 + role 지정 (owner / admin / member)</div>
                </div>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, color:'var(--ink-dim)'}}>arrow_forward</span>
              </a>
            </div>
          )}

          {/* 비-멤버 — 가입 신청 안내 */}
          {!isAdmin && !org.my_role && (
            <div className="ou2-card">
              <h2 className="ou2-card__h">
                <span className="ico material-symbols-outlined">person_add</span>
                멤버 가입
              </h2>
              <div style={{fontSize:12.5, color:'var(--ink-mute)', marginBottom:10, lineHeight:1.6}}>
                단체 소유자가 초대 메일을 보내면 멤버로 합류할 수 있습니다. 단체 운영에는 owner/admin 권한 필요.
              </div>
              <a className="btn btn--primary" style={{width:'100%', justifyContent:'center'}}>
                <span className="ico material-symbols-outlined">mail</span>
                초대 요청
              </a>
            </div>
          )}

          {/* 공유 */}
          <div className="ou2-card">
            <h2 className="ou2-card__h">
              <span className="ico material-symbols-outlined">share</span>
              공유
            </h2>
            <div style={{display:'flex', gap:6}}>
              <button className="btn btn--ghost" style={{flex:1, justifyContent:'center'}}>
                <span className="ico material-symbols-outlined">link</span>
                링크
              </button>
              <button className="btn btn--ghost" style={{flex:1, justifyContent:'center'}}>
                <span className="ico material-symbols-outlined">qr_code_2</span>
                QR
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.OrganizationDetail = OrganizationDetail;
