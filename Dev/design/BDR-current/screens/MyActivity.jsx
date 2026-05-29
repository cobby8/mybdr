/* global React */
// ============================================================
// BDR v2.21 — MyActivity (Phase 3B · TU5 — "내 팀" 보강)
// 운영 박제 대상: /profile/activity
// 진입: AppNav 계정 / 우측 utility / 더보기 마이페이지
// 복귀: 카드 클릭 → 각 팀/대회/경기 상세
// 에러: 빈 상태 모두 시각 (내 팀 0 / 내 신청 0 / 휴면 예정 0 hide)
//
// Phase 1B (v2.18) "내 대회" + Phase 2 (v2.20) "내 경기" / "내 매너" carry-over.
// Phase 3 추가 (변경 ❌):
//   ① BT1+BT2 통합 — "내 신청" 섹션 (가입 / jersey / 휴면 / 탈퇴 4종 step indicator)
//   ② BT3 — "휴면 예정 D-N" 카드 (last_activity_at 60일+ 90일 미만)
//   ③ "내 팀" 섹션 (Phase 1B / 2 보강 위에 추가) — role + pending counts + match-requests
// 상단 카운트 = "내 대회 N · 내 경기 M · 내 팀 K · 평균 매너 X.Y"
// A 등급
// ============================================================

function MyActivity() {
  const myTn = window.MY_TOURNAMENTS || [];
  const myGames = window.MY_GAMES || [];
  const myTeams = window.MY_TEAMS || [];
  const myRequests = window.MY_TEAM_REQUESTS || [];
  const myDormantPending = window.MY_DORMANT_PENDING || [];
  const manner = window.MY_MANNER;

  const order = { pending: 0, approved: 1, live: 2, completed: 3, rejected: 4 };
  const sortedGames = [...myGames].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

  return (
    <div className="gm-page">
      <div className="gm-page__inner" style={{maxWidth:1100}}>
        <header className="gm-page__head">
          <div className="eyebrow">/profile/activity · 내 활동</div>
          <h1 className="gm-page__title">내 활동</h1>
          <p className="gm-page__sub">
            내 대회 <strong>{myTn.length}건</strong> ·
            내 경기 <strong>{myGames.length}건</strong> ·
            내 팀 <strong style={{color:'var(--accent)'}}>{myTeams.length}팀</strong> ·
            평균 매너 <strong style={{color: manner.avg >= 4.5 ? 'var(--ok)' : manner.avg >= 3.0 ? 'var(--warn)' : 'var(--err)'}}>
              {manner.avg.toFixed(1)} / 5
            </strong>
          </p>
        </header>

        <div className="ma-stack">

          {/* Phase 3 신규 — 내 팀 (BT1/BT2/BT3/BT4 진입점) */}
          <section className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined" style={{color:'var(--accent)'}}>groups</span>
              내 팀
              <span className="ma-new">NEW · Phase 3</span>
              <span className="ma-count">{myTeams.length}팀</span>
              <a className="ma-more" href="tu3-team-manage.html">팀 관리 →</a>
            </h3>
            <div className="ma-list">
              {myTeams.map(t => {
                const isOperator = t.role_for_me === 'captain' || t.role_for_me === 'manager' || t.role_for_me === 'vice';
                const pendingMembers = isOperator ? t.pending_apps : 0;  // BT1
                const pendingChanges = isOperator && t.id === 'tm-1' ? 3 : 0;  // BT2 demo
                const pendingMatch = isOperator && t.id === 'tm-1' ? 2 : 0;  // BT5 demo
                return (
                  <div key={t.id} className="tu5-myteam-row">
                    <window.JerseyAvatar logo={t.logo} color1={t.color_primary} color2={t.color_secondary} size={40}/>
                    <div className="tu5-myteam-row__body">
                      <div className="tu5-myteam-row__title">
                        {t.name}
                        <window.RoleBadge role={t.role_for_me} small/>
                      </div>
                      <div className="tu5-myteam-row__meta">
                        <span><span className="ico material-symbols-outlined">place</span>{t.city}</span>
                        <span><span className="ico material-symbols-outlined">groups</span>{t.member_count}명</span>
                        <span><window.MannerStars avg={t.manner_avg}/></span>
                        <span><span className="ico material-symbols-outlined">schedule</span>{t.last_activity_at?.slice(5)} 활동</span>
                      </div>
                      {(pendingMembers > 0 || pendingChanges > 0 || pendingMatch > 0) && (
                        <div className="tu5-myteam-row__chips">
                          {pendingMembers > 0 && (
                            <span className="tu5-myteam-row__chip">
                              <span className="ico material-symbols-outlined">how_to_reg</span>
                              가입 {pendingMembers}건
                            </span>
                          )}
                          {pendingChanges > 0 && (
                            <span className="tu5-myteam-row__chip tu5-myteam-row__chip--blue">
                              <span className="ico material-symbols-outlined">edit_note</span>
                              변경 {pendingChanges}건
                            </span>
                          )}
                          {pendingMatch > 0 && (
                            <span className="tu5-myteam-row__chip tu5-myteam-row__chip--blue">
                              <span className="ico material-symbols-outlined">handshake</span>
                              매치 {pendingMatch}건
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <a className="btn btn--sm btn--ghost" href={isOperator ? "tu4-team-manage-detail.html" : "tu2-team-detail.html"}>
                      {isOperator ? '관리 →' : '상세 →'}
                    </a>
                  </div>
                );
              })}
              {myTeams.length === 0 && (
                <div className="ma-empty">
                  아직 가입한 팀이 없습니다.
                  <a className="btn btn--sm btn--accent" href="tu1-teams.html">팀 둘러보기 →</a>
                </div>
              )}
            </div>
          </section>

          {/* Phase 3 신규 — 내 신청 (BT1 + BT2 통합) */}
          {myRequests.length > 0 && (
            <section className="gm-card">
              <h3 className="gm-card__h">
                <span className="ico material-symbols-outlined" style={{color:'var(--cafe-blue)'}}>how_to_reg</span>
                내 신청
                <span className="ma-new">NEW · BT1+BT2</span>
                <span className="ma-count">{myRequests.length}건</span>
              </h3>
              <div className="ma-list">
                {myRequests.map(r => {
                  const kindLabel = { join: '팀 가입', jersey_change: 'jersey 변경', dormant: '휴면 신청', withdraw: '탈퇴 신청' }[r.kind];
                  return (
                    <div key={r.id} className="tu5-req-row">
                      <window.JerseyAvatar logo={r.team_logo} color1="#1B3C87" size={36}/>
                      <div style={{flex:1, minWidth:0}}>
                        <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:4}}>
                          <span className={'tu5-req-row__kind tu5-req-row__kind--' + (r.kind === 'join' ? 'join' : r.kind === 'jersey_change' ? 'jersey' : r.kind === 'dormant' ? 'dormant' : 'withdraw')}>{kindLabel}</span>
                          <span style={{fontWeight:700, fontSize:13}}>{r.team_name}</span>
                        </div>
                        <div style={{fontSize:11.5, color:'var(--ink-mute)', marginBottom:6}}>
                          {r.kind === 'join' && '"' + r.message + '"'}
                          {r.kind === 'jersey_change' && '#' + r.payload.old + ' → #' + r.payload.new}
                          {r.kind === 'dormant' && '기간 ' + r.payload.period + ' · "' + r.payload.reason + '"'}
                        </div>
                        <window.ApplyStep
                          stepIdx={r.step_idx}
                          status={r.status}
                          applied_at={r.submitted_at?.slice(5)}
                          approved_at={r.approved_at?.slice(5)}
                          compact
                        />
                      </div>
                      <window.GMStatusBadge
                        status={r.status}
                        label={{ pending:'대기', approved:'승인', rejected:'거절' }[r.status]}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Phase 3 신규 — 휴면 예정 (BT3 — 60일+ 90일 미만) */}
          {myDormantPending.length > 0 && (
            <section>
              <div className="tu1-section-h" style={{marginBottom:8}}>
                <h2 style={{fontSize:15, color:'#8B5A0F', display:'inline-flex', alignItems:'center', gap:6}}>
                  <span className="ico material-symbols-outlined" style={{color:'#8B5A0F'}}>schedule</span>
                  휴면 예정
                </h2>
                <span className="tu1-section-h__hint">BT3 · last_activity_at 60일+ · 활동 시 갱신</span>
                <span className="ma-new">NEW</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:8}}>
                {myDormantPending.map(d => (
                  <div key={d.team_id} className="tu5-dormant-card">
                    <div className="tu5-dormant-card__days">
                      D-{d.days_until_dormant}
                      <small>휴면까지</small>
                    </div>
                    <window.JerseyAvatar logo={d.team_logo} color1="#E31B23" size={36}/>
                    <div className="tu5-dormant-card__body">
                      <div className="tu5-dormant-card__title">{d.team_name}</div>
                      <div className="tu5-dormant-card__sub">마지막 활동 {d.last_activity_at} · {d.last_action}</div>
                      <div className="tu5-dormant-card__hint">📌 경기/매니저 활동 시 last_activity_at 자동 갱신</div>
                    </div>
                    <a className="btn btn--sm btn--accent" href="tu2-team-detail.html">활동하기 →</a>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Phase 1B 보존 — 내 대회 */}
          <section className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined">military_tech</span>
              내 대회
              <span className="ma-count">{myTn.length}건</span>
              <a className="ma-more" href="ua1-tournaments.html">전체 보기 →</a>
            </h3>
            <div className="ma-list">
              {myTn.slice(0, 3).map(t => (
                <div key={t.id} className="ma-row">
                  <div className="ma-row__date">
                    <span className="ma-row__d">{t.submitted_at?.slice(8, 10)}</span>
                    <span className="ma-row__m">{t.submitted_at?.slice(5, 7)}월</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="ma-row__title">{t.tn_name}</div>
                    <div className="ma-row__sub">{t.division} · {t.team_name}</div>
                    <div className="ma-row__next">{t.next_action}</div>
                  </div>
                  <window.GMStatusBadge
                    status={t.status}
                    label={
                      { pending:'승인 대기', approved:'결제 대기', in_progress:'진행 중', completed:'종료', rejected:'거절' }[t.status] || t.status
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Phase 2 보존 — 내 경기 (BG6) */}
          <section className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined" style={{color:'var(--accent)'}}>sports_basketball</span>
              내 경기
              <span className="ma-count">{myGames.length}건</span>
              <a className="ma-more" href="p2-ua1-games.html">전체 보기 →</a>
            </h3>
            <div className="ma-list">
              {sortedGames.slice(0, 3).map(g => (
                <div key={g.id} className={'ma-row ma-row--game ma-row--' + g.status}>
                  <div className="ma-row__date">
                    <span className="ma-row__d">{g.starts_at?.slice(8, 10)}</span>
                    <span className="ma-row__m">{g.starts_at?.slice(5, 7)}월</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:3, flexWrap:'wrap'}}>
                      <window.GMKindBadge kind={g.kind} small/>
                      <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-dim)', fontWeight:700}}>{g.time}</span>
                    </div>
                    <div className="ma-row__title">{g.title}</div>
                    <div className="ma-row__sub">{g.host} · {g.court}</div>
                    {g.status !== 'completed' && (
                      <div style={{marginTop:8}}>
                        <window.ApplyStep
                          stepIdx={g.step_idx}
                          status={g.status === 'pending' ? 'pending' : g.status === 'rejected' ? 'rejected' : 'approved'}
                          applied_at={g.applied_at?.slice(5)}
                          approved_at={g.approved_at?.slice(5)}
                          rejected_at={g.rejected_at?.slice(5)}
                          reject_reason={g.reject_reason}
                          compact
                        />
                      </div>
                    )}
                  </div>
                  <window.GMStatusBadge
                    status={g.status}
                    label={
                      { pending:'승인 대기', approved:'참가 확정', live:'진행 중', completed:'종료', rejected:'거절' }[g.status]
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          {/* Phase 2 보존 — 내 매너 */}
          <section>
            <window.MannerCard data={manner} />
          </section>
        </div>
      </div>
    </div>
  );
}

window.MyActivity = MyActivity;
