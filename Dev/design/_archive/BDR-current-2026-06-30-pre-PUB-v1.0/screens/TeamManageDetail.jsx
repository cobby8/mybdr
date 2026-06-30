/* global React */
// ============================================================
// BDR v2.21 — TeamManageDetail (TU4 · Phase 3B · 신규 · 5+1 탭 통합)
// 운영 박제 대상: /teams/[id]/manage
// 진입: TU3 카드 / TU2 sidebar "팀 관리"
// 복귀: 각 처리 모달 → 큐 갱신 / 알림 발송 (BG1 답습)
// 에러: 빈 상태 = "신청이 없습니다"
//
// 신규 박제 (운영 2292 line 거대 페이지 · 6 sub-tab 통합):
//   탭 1 멤버 (기본)         · 멤버 list + 캡틴 강제 액션
//   탭 2 가입 신청 (BT1)     · ?tab=requests + Phase 2 UD1 알림 모달
//   탭 3 변경 신청 (BT2)     · ?tab=member-requests · jersey/dormant/withdraw
//   탭 4 권한 위임 (BT4)     · ?tab=officers (captain only) · TeamOfficerPermissions
//   탭 5 활동/유령 (BT3)     · ?tab=ghosts · last_activity_at 3개월+
//   탭 6 매치 신청 (BT5)     · ?tab=match-requests · team-match-request 답습
// A 등급
// ============================================================

function TeamManageDetail() {
  const team = window.TEAM_DETAIL_MOCK;
  const [tab, setTab] = React.useState('members');
  const [showModal, setShowModal] = React.useState(false);

  const members = window.TEAM_MEMBERS_MOCK;
  const joinReqs = window.TEAM_JOIN_REQUESTS_MOCK;
  const memberReqs = window.TEAM_MEMBER_REQUESTS_MOCK;
  const officers = window.TEAM_OFFICER_PERMISSIONS_MOCK;
  const ghosts = window.TEAM_GHOST_CANDIDATES_MOCK;
  const matchReqs = window.TEAM_MATCH_REQUESTS_MOCK;
  const permLabels = window.PERMISSION_LABELS;

  return (
    <div className="tu4-page">
      <div className="tu4-page__inner">
        <div className="tu4-page__crumbs">
          <window.Crumbs trail={['홈', '팀 관리', team.name, '운영']}/>
        </div>

        {/* Mini hero */}
        <window.TeamMiniHero team={team} currentTab={tab}/>

        {/* 6 tabs */}
        <div className="tu4-tabs">
          <button className="tu4-tab" data-active={tab === 'members'} onClick={()=>setTab('members')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>group</span>
            멤버
            <span className="tu4-tab__count">{members.length}</span>
          </button>
          <button className="tu4-tab" data-active={tab === 'requests'} onClick={()=>setTab('requests')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>how_to_reg</span>
            가입 신청
            <span className="tu4-tab__count">{joinReqs.length}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'requests' ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>BT1</span>
          </button>
          <button className="tu4-tab" data-active={tab === 'member-requests'} onClick={()=>setTab('member-requests')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>edit_note</span>
            변경 신청
            <span className="tu4-tab__count">{memberReqs.length}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'member-requests' ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>BT2</span>
          </button>
          <button className="tu4-tab" data-active={tab === 'officers'} onClick={()=>setTab('officers')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>shield_person</span>
            권한 위임
            <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'officers' ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>BT4</span>
          </button>
          <button className="tu4-tab" data-active={tab === 'ghosts'} onClick={()=>setTab('ghosts')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>person_off</span>
            활동 / 유령
            <span className="tu4-tab__count">{ghosts.length}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'ghosts' ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>BT3</span>
          </button>
          <button className="tu4-tab" data-active={tab === 'match-requests'} onClick={()=>setTab('match-requests')}>
            <span className="ico material-symbols-outlined" style={{fontSize:15}}>handshake</span>
            매치 신청
            <span className="tu4-tab__count">{matchReqs.length}</span>
            <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'match-requests' ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>BT5</span>
          </button>
        </div>

        {/* ========== TAB 1: 멤버 ========== */}
        {tab === 'members' && (
          <section>
            <div className="tu1-section-h">
              <h2>활성 멤버 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--ink-mute)', marginLeft:6}}>{members.filter(m => m.status === 'active').length}명</span></h2>
              <span className="tu1-section-h__hint">jersey 변경 강제 · 휴면 강제 · 탈퇴 강제 (캡틴만)</span>
            </div>
            <div className="tu4-list">
              {members.map(m => (
                <div key={m.id} className={'tu4-row' + (m.status === 'dormant' ? ' tu4-row--dormant' : '')}>
                  <div className="tu4-row__jersey">#{m.jersey}</div>
                  <div className="tu4-row__av">{m.avatar}</div>
                  <div className="tu4-row__body">
                    <div className="tu4-row__name">
                      {m.name}
                      <window.RoleBadge role={m.role} small/>
                      {m.status === 'dormant' && <span style={{fontFamily:'var(--ff-mono)', fontSize:9.5, fontWeight:800, color:'var(--ink-mute)', background:'var(--bg-head)', padding:'2px 6px', borderRadius:'var(--r-xs)', letterSpacing:'0.06em'}}>휴면</span>}
                    </div>
                    <div className="tu4-row__sub">
                      <span><window.MannerStars avg={m.manner}/></span>
                      <span><span className="ico material-symbols-outlined" style={{fontSize:12}}>schedule</span> {m.last_activity_at?.slice(5)} 활동</span>
                    </div>
                  </div>
                  <div className="tu4-row__cta">
                    <button className="btn btn--sm btn--ghost"><span className="ico material-symbols-outlined">numbers</span> 번호</button>
                    <button className="btn btn--sm btn--ghost"><span className="ico material-symbols-outlined">bedtime</span> 휴면</button>
                    <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--err-soft)'}}><span className="ico material-symbols-outlined">person_remove</span></button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========== TAB 2: 가입 신청 (BT1) ========== */}
        {tab === 'requests' && (
          <section>
            {team.accepting_members && (
              <div className="tu4-auto-banner">
                <span className="ico material-symbols-outlined">info</span>
                <div style={{flex:1}}>
                  <strong>자동 승인 OFF</strong> — 캡틴이 직접 신청을 검토합니다. 켜면 매너 ★ 3.5 이상 자동 승인.
                </div>
                <button className="btn btn--sm btn--ghost">자동 승인 켜기</button>
              </div>
            )}
            <div className="tu1-section-h">
              <h2>가입 신청 큐 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--accent)', marginLeft:6}}>{joinReqs.length}건 대기</span></h2>
              <span className="tu1-section-h__hint">BT1 · team_join_requests · Phase 2 UD1 답습</span>
            </div>
            <div className="tu4-list">
              {joinReqs.map(r => (
                <div key={r.id} className="tu4-jreq">
                  <div className="tu4-jreq__head">
                    <div className="tu4-row__av">{r.user_avatar}</div>
                    <div className="tu4-jreq__body">
                      <div className="tu4-jreq__name">{r.user_name}</div>
                      <div className="tu4-jreq__meta">
                        <span>📍 {r.city}</span>
                        <span>실력 {r.skill_level === 'advanced' ? '★★★' : r.skill_level === 'intermediate' ? '★★' : '★'}</span>
                        <span>매너 <window.MannerStars avg={r.manner_avg}/></span>
                      </div>
                    </div>
                    <span className="tu4-jreq__time">{r.submitted_at.slice(5)}</span>
                  </div>
                  <div className="tu4-jreq__msg">"{r.message}"</div>
                  <div className="tu4-jreq__cta">
                    <button className="btn btn--sm btn--ghost">프로필 보기</button>
                    <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--border)'}} onClick={()=>setShowModal('reject')}>거절</button>
                    <button className="btn btn--sm btn--accent" onClick={()=>setShowModal('approve')}>승인</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Phase 2 UD1 답습 모달 — 시안 안 inline 미러 */}
            {showModal && (
              <div className="tu4-modal-shadow">
                <div className="tu4-modal-shadow__head">
                  {showModal === 'approve' ? '가입 신청 승인' : '가입 신청 거절'}
                  <button className="ta2-modal__close" onClick={()=>setShowModal(false)}><span className="ico material-symbols-outlined">close</span></button>
                </div>
                <div className="tu4-modal-shadow__body">
                  <div className="tu4-modal-shadow__row">
                    <strong>정성훈</strong> 님의 가입을 {showModal === 'approve' ? '승인' : '거절'}합니다.
                  </div>
                  {showModal === 'approve' && (
                    <div className="tu4-modal-shadow__row" style={{flexDirection:'column', alignItems:'flex-start', gap:6}}>
                      <label style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase'}}>Jersey 번호 (선택)</label>
                      <input type="text" placeholder="자동 배정" style={{padding:'8px 12px', border:'1px solid var(--border-strong)', borderRadius:'var(--r-sm)', fontSize:14, width:'100%'}}/>
                    </div>
                  )}
                  {showModal === 'reject' && (
                    <div className="tu4-modal-shadow__row" style={{flexDirection:'column', alignItems:'flex-start', gap:6}}>
                      <label style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase'}}>거절 사유</label>
                      <textarea placeholder="모집 마감" rows={2} style={{padding:'8px 12px', border:'1px solid var(--border-strong)', borderRadius:'var(--r-sm)', fontSize:13, width:'100%', resize:'vertical', fontFamily:'var(--ff-body)'}}/>
                    </div>
                  )}
                  {/* Phase 2 UD1 답습 — 알림 체크박스 ✅ 기본 ✅ */}
                  <label className="tu4-modal-shadow__notify">
                    <input type="checkbox" defaultChecked/>
                    <div>
                      <strong>사용자에게 알림 보내기</strong>
                      <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>
                        BG1 답습 — 신청자에게 결과 알림 발송 (기본 ✅)
                      </div>
                    </div>
                  </label>
                  <div className="tu4-modal-shadow__cta">
                    <button className="btn btn--ghost" onClick={()=>setShowModal(false)}>취소</button>
                    <button className={'btn ' + (showModal === 'approve' ? 'btn--accent' : '')} style={showModal === 'reject' ? {color:'#fff', background:'var(--err)', borderColor:'var(--err)'} : {}}>
                      {showModal === 'approve' ? '승인 + 알림' : '거절 + 알림'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ========== TAB 3: 변경 신청 (BT2) ========== */}
        {tab === 'member-requests' && (
          <section>
            <div className="tu1-section-h">
              <h2>멤버 변경 신청 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--ink-mute)', marginLeft:6}}>{memberReqs.length}건</span></h2>
              <span className="tu1-section-h__hint">BT2 · TeamMemberRequest · jersey / dormant / withdraw</span>
            </div>
            <div style={{display:'flex', gap:4, marginBottom:10}}>
              <button className="tu1-filter__chip is-on">전체 ({memberReqs.length})</button>
              <button className="tu1-filter__chip">jersey 변경 (1)</button>
              <button className="tu1-filter__chip">휴면 (1)</button>
              <button className="tu1-filter__chip">탈퇴 (1)</button>
            </div>
            <div className="tu4-list">
              {memberReqs.map(r => {
                const kindLabel = { jersey_change: 'Jersey 번호 변경', dormant: '휴면 신청', withdraw: '탈퇴 신청' }[r.kind];
                const kindIcon = { jersey_change: 'numbers', dormant: 'bedtime', withdraw: 'logout' }[r.kind];
                return (
                  <div key={r.id} className="tu4-jreq">
                    <div className="tu4-jreq__head">
                      <div className="tu4-row__av">{r.user_avatar}</div>
                      <div className="tu4-jreq__body">
                        <div className="tu4-jreq__name">
                          {r.user_name}
                          <span style={{marginLeft:8, display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:800, color:'var(--cafe-blue-deep)', background:'var(--cafe-blue-soft)', padding:'2px 7px', borderRadius:'var(--r-xs)', letterSpacing:'0.04em'}}>
                            <span className="ico material-symbols-outlined" style={{fontSize:12}}>{kindIcon}</span>
                            {kindLabel}
                          </span>
                        </div>
                        <div className="tu4-jreq__meta">
                          {r.kind === 'jersey_change' && <span>변경 #{r.payload.old} → <strong style={{color:'var(--accent)'}}>#{r.payload.new}</strong></span>}
                          {r.kind === 'dormant' && <span>기간 {r.payload.period} · 사유 "{r.payload.reason}"</span>}
                          {r.kind === 'withdraw' && <span>사유 "{r.payload.reason}"</span>}
                        </div>
                      </div>
                      <span className="tu4-jreq__time">{r.submitted_at.slice(5)}</span>
                    </div>
                    <div className="tu4-jreq__cta">
                      <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--border)'}}>거절</button>
                      <button className="btn btn--sm btn--accent">승인 + 알림</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========== TAB 4: 권한 위임 (BT4 · captain only) ========== */}
        {tab === 'officers' && (
          <section>
            <div className="tu4-auto-banner" style={{background:'var(--accent-soft)', borderColor:'var(--accent-hair)', color:'var(--accent-deep)'}}>
              <span className="ico material-symbols-outlined">shield</span>
              <div style={{flex:1}}>
                <strong>캡틴만 권한 위임 가능</strong> — 부캡틴 / 매니저에게 일부 운영 권한 위임. TeamOfficerPermissions 모델.
              </div>
            </div>
            <div className="tu1-section-h">
              <h2>임원 권한 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--ink-mute)', marginLeft:6}}>BT4 · Phase 4 PR12</span></h2>
            </div>
            {Object.entries(officers).map(([role, info]) => (
              <div key={role} className="tu4-officer">
                <div className="tu4-officer__head">
                  <div className="tu4-row__av">{info.name[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800, fontSize:14}}>{info.name}</div>
                    <window.RoleBadge role={role} small/>
                  </div>
                  <button className="btn btn--sm btn--ghost">권한 일괄 편집</button>
                </div>
                <div className="tu4-officer__perms">
                  {Object.entries(info.perms).map(([k, v]) => (
                    <label key={k} className="tu4-officer__perm" data-on={v}>
                      <span className="tu4-officer__perm-toggle" data-on={v}/>
                      <span className="tu4-officer__perm-lbl">{permLabels[k]}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ========== TAB 5: 활동 / 유령 (BT3) ========== */}
        {tab === 'ghosts' && (
          <section>
            <div className="tu4-auto-banner" style={{background:'var(--warn-soft)', borderColor:'var(--warn-hair)', color:'#8B5A0F'}}>
              <span className="ico material-symbols-outlined">schedule</span>
              <div style={{flex:1}}>
                <strong>휴면 룰 = 3개월 미활동 (last_activity_at 기준)</strong> — 캡틴 또는 ghostClassify 권한자만 접근. BT3 · Phase 5 PR15 답습.
              </div>
            </div>
            <div className="tu1-section-h">
              <h2>유령 후보 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'#8B5A0F', marginLeft:6}}>{ghosts.length}명</span></h2>
              <span className="tu1-section-h__hint">last_activity_at 90일+ 무활동</span>
            </div>
            <div className="tu4-list">
              {ghosts.map(g => (
                <div key={g.id} className="tu4-ghost-row">
                  <div className="tu4-ghost-row__days">
                    {g.days_since}
                    <small>일 무활동</small>
                  </div>
                  <div className="tu4-row__av">{g.user_avatar}</div>
                  <div className="tu4-row__body">
                    <div className="tu4-row__name">
                      #{g.jersey} {g.user_name}
                      {g.already_dormant && <span style={{fontFamily:'var(--ff-mono)', fontSize:9.5, fontWeight:800, color:'#8B5A0F', background:'var(--warn-soft)', padding:'2px 6px', borderRadius:'var(--r-xs)', letterSpacing:'0.06em'}}>이미 휴면</span>}
                    </div>
                    <div className="tu4-row__sub">
                      <span><span className="ico material-symbols-outlined" style={{fontSize:12}}>history</span> 마지막 활동: {g.last_action}</span>
                      <span>· {g.last_activity_at}</span>
                    </div>
                  </div>
                  <div className="tu4-row__cta">
                    {!g.already_dormant && <button className="btn btn--sm btn--ghost"><span className="ico material-symbols-outlined">notifications_active</span> 휴면 알림</button>}
                    <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--err-soft)'}}>강제 탈퇴</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{marginTop:14}}>
              <div className="tu1-section-h">
                <h2 style={{fontSize:14, color:'var(--ink-mute)'}}>탈퇴 멤버 이력</h2>
                <span className="tu1-section-h__hint">최근 12개월 · WithdrawnMembersSection</span>
              </div>
              <p style={{margin:0, padding:'12px 14px', background:'var(--bg-elev)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', fontSize:12.5, color:'var(--ink-mute)'}}>
                지난 12개월 동안 <strong>3명</strong>이 팀을 떠났습니다. <a href="#" style={{color:'var(--cafe-blue-deep)', fontWeight:700}}>이력 보기 →</a>
              </p>
            </div>
          </section>
        )}

        {/* ========== TAB 6: 매치 신청 (BT5) ========== */}
        {tab === 'match-requests' && (
          <section>
            <div className="tu4-auto-banner">
              <span className="ico material-symbols-outlined">info</span>
              <div style={{flex:1}}>
                팀 vs 팀 매치 신청 — 수락 시 자동으로 경기 (game) 생성. <strong>team-match-request-modal</strong> 답습.
              </div>
              <button className="btn btn--sm btn--ghost">내가 신청한 매치 →</button>
            </div>
            <div className="tu1-section-h">
              <h2>받은 매치 신청 <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color:'var(--accent)', marginLeft:6}}>{matchReqs.length}건</span></h2>
              <span className="tu1-section-h__hint">BT5 · /api/web/teams/[id]/match-request</span>
            </div>
            <div className="tu4-list">
              {matchReqs.map(r => (
                <div key={r.id} className="tu4-mreq">
                  <div className="tu4-mreq__head">
                    <window.JerseyAvatar logo={r.from_team.logo} color1="#0F5FCC" size={36}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:'var(--ff-display)', fontSize:15, fontWeight:800}}>{r.from_team.name}</div>
                      <span className="tu4-mreq__vs">vs {team.name}</span>
                    </div>
                    <span className="tu4-jreq__time">{r.submitted_at.slice(5)}</span>
                  </div>
                  <div className="tu4-mreq__info">
                    <span><span className="ico material-symbols-outlined">event</span>{r.proposed_date}</span>
                    <span><span className="ico material-symbols-outlined">place</span>{r.proposed_court}</span>
                  </div>
                  <div className="tu4-mreq__msg">"{r.message}"</div>
                  <div className="tu4-mreq__cta">
                    <button className="btn btn--sm btn--ghost">메시지 답장</button>
                    <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--border)'}}>거절</button>
                    <button className="btn btn--sm btn--accent"><span className="ico material-symbols-outlined">check</span> 수락 + 경기 생성</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

window.TeamManageDetail = TeamManageDetail;
