/* global React */
// ============================================================
// BDR v2.21 — TeamDetail (TU2 · Phase 3B · 보강)
// 운영 박제 대상: /teams/[id]
// 진입: TU1 카드 / TU3 hub / TU5 "내 팀"
// 복귀: 가입 신청 → step indicator / 운영 액션 → cross-domain
// 에러: 라이브 0건 = livebar hidden / 로스터 0 = 빈 상태 카드
//
// v2 박제 (366 + _components_v2/ 8 컴포넌트) 보강:
//   ① TU2-A · sticky 라이브 띠 (Phase 2 BG7 답습) — 이 팀의 진행 중 경기 chip
//   ② TU2-B · sidebar "운영 액션" 카드 (캡틴/매니저만) — BT7 cross-domain
//      "이 팀으로 대회 참가" → /tournaments?team_id=
//      "이 팀 멤버 경기 신청" → /games?host_team_id=
//      "팀 매치 신청 받기" → /teams/[id]/manage?tab=match-requests
//   ③ TU2-C · sidebar "내 권한" 카드 (멤버 본인만) — BT4 TeamOfficerPermissions
//   ④ TU2-D · stats 탭 보강 — 우승 이력 (PA7 답습) + Team MVP (BG4 답습)
//   ⑤ TU2-E · "가입 신청" CTA = step indicator (BG1 답습) — 3 step
// A 등급
// ============================================================

function TeamDetail() {
  const team = window.TEAM_DETAIL_MOCK;
  const [tab, setTab] = React.useState('overview');
  // demo state — 본인 role 시뮬레이션 (실제로는 user.id ↔ team.members)
  // role: 'captain' (TU2-B 운영 액션 보임) / 'member' (TU2-C 내 권한) / null (가입 CTA + step)
  const [demoRole, setDemoRole] = React.useState('captain');
  const [demoApplied, setDemoApplied] = React.useState(true);

  const isOperator = demoRole === 'captain' || demoRole === 'manager' || demoRole === 'vice';
  const isMember = demoRole && !isOperator;
  const notMember = !demoRole;

  const live = team.live_games[0];

  return (
    <div>
      {/* TU2-A — sticky LIVE 띠 (BG7 답습) */}
      {live && (
        <div className="tu2-livebar">
          <span className="tu2-livebar__lbl">
            <window.LiveDot/>
            LIVE
          </span>
          <span className="tu2-livebar__round">🏆 {live.round}</span>
          <span className="tu2-livebar__title">{live.title}</span>
          <span className="tu2-livebar__score">
            <window.LiveDot/>
            {live.label}
          </span>
          <a className="tu2-livebar__cta" href="p2-ua5-live.html">중계 →</a>
        </div>
      )}

      <div className="gm-page">
        <div className="gm-page__inner">
          {/* Demo role toggle — 시안용만 */}
          <div className="ctrl" style={{marginTop:0, marginBottom:14}}>
            <div className="ctrl__group">
              <span className="ctrl__lbl">데모 · 본인 role</span>
              <div className="ctrl__btns">
                <button className={'ctrl__btn' + (demoRole === 'captain' ? ' is-on' : '')} onClick={()=>setDemoRole('captain')}>캡틴</button>
                <button className={'ctrl__btn' + (demoRole === 'manager' ? ' is-on' : '')} onClick={()=>setDemoRole('manager')}>매니저</button>
                <button className={'ctrl__btn' + (demoRole === 'member' ? ' is-on' : '')} onClick={()=>setDemoRole('member')}>멤버</button>
                <button className={'ctrl__btn' + (demoRole === null ? ' is-on' : '')} onClick={()=>setDemoRole(null)}>미가입</button>
              </div>
            </div>
            <div className="ctrl__group">
              <span className="ctrl__lbl">미가입 시 — 신청 상태</span>
              <div className="ctrl__btns">
                <button className={'ctrl__btn' + (demoApplied ? ' is-on' : '')} onClick={()=>setDemoApplied(true)}>신청 완료</button>
                <button className={'ctrl__btn' + (!demoApplied ? ' is-on' : '')} onClick={()=>setDemoApplied(false)}>미신청</button>
              </div>
            </div>
            <div className="ctrl__group">
              <span className="ctrl__lbl">탭</span>
              <div className="ctrl__btns">
                <button className={'ctrl__btn' + (tab === 'overview' ? ' is-on' : '')} onClick={()=>setTab('overview')}>개요</button>
                <button className={'ctrl__btn' + (tab === 'roster' ? ' is-on' : '')} onClick={()=>setTab('roster')}>로스터</button>
                <button className={'ctrl__btn' + (tab === 'stats' ? ' is-on' : '')} onClick={()=>setTab('stats')}>통계</button>
              </div>
            </div>
          </div>

          {/* Hero */}
          <div className="tu2-hero">
            <window.JerseyAvatar logo={team.logo} color1={team.color_primary} color2={team.color_secondary} size={72}/>
            <div className="tu2-hero__body">
              <h1 className="tu2-hero__title">
                {team.name}
                {team.accepting_members && (
                  <span style={{
                    fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800,
                    color:'var(--ok)', background:'var(--ok-soft)',
                    padding:'3px 8px', borderRadius:'var(--r-xs)', letterSpacing:'0.04em',
                  }}>모집 중</span>
                )}
              </h1>
              <div className="tu2-hero__sub">
                <span><span className="ico material-symbols-outlined">place</span> {team.city} {team.district}</span>
                <span><span className="ico material-symbols-outlined">person</span> 캡틴 {team.captain.name}</span>
                <span><span className="ico material-symbols-outlined">groups</span> {team.member_count}/{team.max_members}명</span>
                <span><window.MannerStars avg={team.manner_avg}/></span>
                <span><span className="ico material-symbols-outlined">place</span> {team.home_court}</span>
              </div>
              <p className="tu2-hero__desc">{team.description}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tu2-tabs">
            <button className="tu2-tab" data-active={tab === 'overview'} onClick={()=>setTab('overview')}>개요</button>
            <button className="tu2-tab" data-active={tab === 'roster'} onClick={()=>setTab('roster')}>로스터 <span style={{color:'var(--ink-dim)', fontWeight:600, marginLeft:3}}>{team.member_count}</span></button>
            <button className="tu2-tab" data-active={tab === 'recent'} onClick={()=>setTab('recent')}>최근 경기</button>
            <button className="tu2-tab" data-active={tab === 'stats'} onClick={()=>setTab('stats')}>통계</button>
          </div>

          {/* Grid */}
          <div className="tu2-grid">
            <div className="tu2-main">
              {tab === 'overview' && <>
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined">info</span>팀 소개</h3>
                  <p style={{margin:0, fontSize:13, color:'var(--ink-soft)', lineHeight:1.65}}>{team.description}</p>
                  <div className="gd-summary" style={{marginTop:14}}>
                    <div className="gd-summary__row"><span className="gd-summary__l">창단</span><span className="gd-summary__v">2024년 3월</span></div>
                    <div className="gd-summary__row"><span className="gd-summary__l">홈 코트</span><span className="gd-summary__v">{team.home_court}</span></div>
                    <div className="gd-summary__row"><span className="gd-summary__l">정기 활동</span><span className="gd-summary__v">매주 토 14:00, 평일 야간 비정기</span></div>
                    <div className="gd-summary__row"><span className="gd-summary__l">멤버 자격</span><span className="gd-summary__v">실력 무관 / 매너 ★ 3.5 이상 권장</span></div>
                  </div>
                </section>

                {/* TU2-D · Team MVP (BG4 답습) */}
                <section className="gm-card">
                  <h3 className="gm-card__h">
                    <span className="ico material-symbols-outlined" style={{color:'#B47A11'}}>military_tech</span>
                    팀 MVP <span style={{fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, color:'var(--ink-dim)', marginLeft:4}}>최근 6개월</span>
                  </h3>
                  <div className="tu2-mvp">
                    <div className="tu2-mvp__av">{team.team_mvp.avatar}</div>
                    <div style={{flex:1}}>
                      <div className="tu2-mvp__lbl">TEAM MVP</div>
                      <div className="tu2-mvp__name">{team.team_mvp.name}</div>
                      <div className="tu2-mvp__stat">{team.team_mvp.stat} · {team.team_mvp.games}경기</div>
                    </div>
                  </div>
                </section>

                {/* TU2-D · 우승 이력 (PA7 답습) */}
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined" style={{color:'#B47A11'}}>emoji_events</span>우승 이력</h3>
                  <div className="tu2-trophies">
                    {team.trophies.map(t => (
                      <div key={t.tn_id} className="tu2-trophy">
                        <span className="tu2-trophy__icon">{t.place === 1 ? '🏆' : t.place === 2 ? '🥈' : '🥉'}</span>
                        <div className="tu2-trophy__body">
                          <div className="tu2-trophy__title">{t.tn_name}</div>
                          <div className="tu2-trophy__sub">{t.year}년 · {t.place === 1 ? '우승' : t.place + '위'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>}

              {tab === 'roster' && <>
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined">groups</span>로스터 <span style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-mute)', marginLeft:4}}>{team.member_count}명</span></h3>
                  <div className="tu2-roster">
                    {team.roster_preview.map(m => (
                      <div key={m.name} className="tu2-roster__row">
                        <div className="tu2-roster__jersey">{m.jersey}</div>
                        <div style={{flex:1}}>
                          <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                            <span style={{fontWeight:700, fontSize:13.5}}>{m.name}</span>
                            <window.RoleBadge role={m.role} small/>
                          </div>
                        </div>
                        <window.MannerStars avg={m.manner}/>
                      </div>
                    ))}
                  </div>
                </section>
              </>}

              {tab === 'recent' && <>
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined">sports_basketball</span>최근 경기</h3>
                  <div style={{display:'flex', flexDirection:'column', gap:6}}>
                    {team.recent_games.map(g => (
                      <div key={g.id} style={{display:'flex', alignItems:'center', gap:12, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:'var(--r-sm)'}}>
                        <span style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-mute)', minWidth:60}}>{g.date.slice(5)}</span>
                        <window.GMKindBadge kind={g.kind} small/>
                        <span style={{flex:1, fontWeight:700, fontSize:13}}>vs {g.opponent}</span>
                        <span style={{
                          fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:13,
                          color: g.result === 'win' ? 'var(--ok)' : 'var(--err)',
                        }}>{g.score}</span>
                        <span style={{
                          fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:800,
                          color: g.result === 'win' ? 'var(--ok)' : 'var(--err)',
                          background: g.result === 'win' ? 'var(--ok-soft)' : 'var(--err-soft)',
                          padding:'2px 7px', borderRadius:'var(--r-xs)', letterSpacing:'0.04em',
                        }}>{g.result === 'win' ? 'W' : 'L'}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </>}

              {tab === 'stats' && <>
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined">leaderboard</span>팀 통계 <span style={{fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, color:'var(--ink-dim)', marginLeft:4}}>BT6 · BG6</span></h3>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8, marginBottom:14}}>
                    {[
                      { l: '승', v: team.wins, c: 'var(--ok)' },
                      { l: '패', v: team.losses, c: 'var(--err)' },
                      { l: '무', v: team.draws, c: 'var(--ink-mute)' },
                      { l: '대회', v: team.tournaments_count, c: 'var(--cafe-blue)' },
                    ].map(s => (
                      <div key={s.l} style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:'var(--r-sm)', textAlign:'center'}}>
                        <div style={{fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900, color:s.c, lineHeight:1}}>{s.v}</div>
                        <div style={{fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, color:'var(--ink-mute)', marginTop:4, letterSpacing:'0.06em', textTransform:'uppercase'}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="tu2-mvp">
                    <div className="tu2-mvp__av">{team.team_mvp.avatar}</div>
                    <div style={{flex:1}}>
                      <div className="tu2-mvp__lbl">TEAM MVP</div>
                      <div className="tu2-mvp__name">{team.team_mvp.name}</div>
                      <div className="tu2-mvp__stat">{team.team_mvp.stat}</div>
                    </div>
                  </div>
                </section>
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined" style={{color:'#B47A11'}}>emoji_events</span>우승 이력</h3>
                  <div className="tu2-trophies">
                    {team.trophies.map(t => (
                      <div key={t.tn_id} className="tu2-trophy">
                        <span className="tu2-trophy__icon">{t.place === 1 ? '🏆' : t.place === 2 ? '🥈' : '🥉'}</span>
                        <div className="tu2-trophy__body">
                          <div className="tu2-trophy__title">{t.tn_name}</div>
                          <div className="tu2-trophy__sub">{t.year}년 · {t.place === 1 ? '우승' : t.place + '위'}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>}
            </div>

            {/* Sidebar */}
            <div className="tu2-side">
              {/* TU2-B · 운영 액션 카드 (captain/manager/vice 만 — BT7) */}
              {isOperator && (
                <section className="gm-card tu2-ops">
                  <h3 className="tu2-ops__h">
                    <span className="ico material-symbols-outlined">tune</span>
                    운영 액션
                    <span className="tu2-ops__chip">BT7</span>
                  </h3>
                  <a className="tu2-ops__row" href="ua1-tournaments.html">
                    <span className="ico material-symbols-outlined">emoji_events</span>
                    <div className="tu2-ops__row-body">
                      <div className="tu2-ops__row-title">이 팀으로 대회 참가</div>
                      <div className="tu2-ops__row-sub">/tournaments?team_id={team.id}</div>
                    </div>
                    <span className="tu2-ops__row-arrow material-symbols-outlined">chevron_right</span>
                  </a>
                  <a className="tu2-ops__row" href="p2-ua1-games.html">
                    <span className="ico material-symbols-outlined">sports_basketball</span>
                    <div className="tu2-ops__row-body">
                      <div className="tu2-ops__row-title">이 팀 멤버 경기 신청</div>
                      <div className="tu2-ops__row-sub">/games?host_team_id={team.id}</div>
                    </div>
                    <span className="tu2-ops__row-arrow material-symbols-outlined">chevron_right</span>
                  </a>
                  <a className="tu2-ops__row" href="tu4-team-manage-detail.html">
                    <span className="ico material-symbols-outlined">handshake</span>
                    <div className="tu2-ops__row-body">
                      <div className="tu2-ops__row-title">팀 매치 신청 받기</div>
                      <div className="tu2-ops__row-sub">manage?tab=match-requests</div>
                    </div>
                    <span className="tu2-ops__row-arrow material-symbols-outlined">chevron_right</span>
                  </a>
                  <a className="tu2-ops__row" href="tu4-team-manage-detail.html">
                    <span className="ico material-symbols-outlined">settings</span>
                    <div className="tu2-ops__row-body">
                      <div className="tu2-ops__row-title">팀 관리</div>
                      <div className="tu2-ops__row-sub">/teams/{team.id}/manage</div>
                    </div>
                    <span className="tu2-ops__row-arrow material-symbols-outlined">chevron_right</span>
                  </a>
                </section>
              )}

              {/* TU2-C · 내 권한 카드 (멤버 본인만 — BT4) */}
              {(isOperator || isMember) && (
                <section className="gm-card">
                  <h3 className="gm-card__h"><span className="ico material-symbols-outlined">verified</span>내 권한</h3>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <window.RoleBadge role={demoRole}/>
                    <span style={{fontSize:12, color:'var(--ink-mute)', fontWeight:600}}>2024년 3월 가입 · 23개월차</span>
                  </div>
                  <div className="tu2-myperm__list">
                    {demoRole === 'captain' && [
                      '멤버 가입 승인 / 거절',
                      'jersey 번호 변경',
                      '유령(휴면) 분류',
                      '임원 권한 위임',
                      '강제 탈퇴',
                      '팀 정보 수정',
                    ].map(p => (
                      <div key={p} className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>{p}</div>
                    ))}
                    {demoRole === 'manager' && <>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>멤버 가입 승인</div>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>유령 분류</div>
                      <div className="tu2-myperm__row" data-off="true"><span className="ico material-symbols-outlined">block</span>강제 탈퇴 (캡틴만)</div>
                    </>}
                    {demoRole === 'vice' && <>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>멤버 가입 승인 / 거절</div>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>jersey 변경</div>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>팀 정보 수정</div>
                    </>}
                    {demoRole === 'member' && <>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>경기 / 대회 참가</div>
                      <div className="tu2-myperm__row"><span className="ico material-symbols-outlined">check_circle</span>jersey 변경 신청</div>
                      <div className="tu2-myperm__row" data-off="true"><span className="ico material-symbols-outlined">block</span>운영 권한 없음</div>
                    </>}
                  </div>
                </section>
              )}

              {/* TU2-E · 가입 신청 / step indicator (미가입 본인만 — BG1 답습) */}
              {notMember && (
                <section className="tu2-join">
                  <div className="tu2-join__head">
                    <h3 className="tu2-join__h">팀 가입</h3>
                    {team.accepting_members && <span className="tu2-join__open">모집 중</span>}
                  </div>
                  {!demoApplied && <>
                    <p style={{margin:'0 0 12px', fontSize:12.5, color:'var(--ink-mute)', lineHeight:1.55}}>
                      현재 {team.member_count}/{team.max_members}명. 캡틴 승인 후 멤버로 활동 가능.
                    </p>
                    <button className="btn btn--accent btn--touch" style={{width:'100%'}}>가입 신청</button>
                    <p style={{margin:'8px 0 0', fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-dim)', textAlign:'center'}}>
                      평균 응답 시간 1.2일 · BT1
                    </p>
                  </>}
                  {demoApplied && <>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:10}}>
                      <span className="tu2-join__pending-chip">
                        <span className="ico material-symbols-outlined" style={{fontSize:13}}>schedule</span>
                        승인 대기
                      </span>
                      <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-mute)', fontWeight:700}}>2일째 대기</span>
                    </div>
                    {/* Step indicator (BG1 — Phase 2 UA2 답습) */}
                    <window.ApplyStep
                      stepIdx={1}
                      status="pending"
                      applied_at="05-26 19:30"
                      compact
                    />
                    <p style={{margin:'8px 0 0', fontSize:11.5, color:'var(--ink-mute)'}}>
                      평균 응답 시간 1.2일 — 캡틴 ({team.captain.name})이 검토 중입니다.
                    </p>
                    <a className="gd-mine__link" href="p2-uc1-my-activity.html" style={{marginTop:8}}>
                      <span className="ico material-symbols-outlined">arrow_forward</span>
                      내 신청 모두 보기
                    </a>
                  </>}
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.TeamDetail = TeamDetail;
