/* global React */
// ============================================================
// BDR v2.21 — AdminTeams (TA1 · Phase 3A · super-admin 신규 hub)
//            + AdminTeamDetail (TA2 · 모달 옵션 A — TA1 카드 클릭 → side panel)
// 운영 박제 대상: /admin/teams (TA1) + 카드 클릭 모달 (TA2)
// 진입: super-admin 만 (Phase 1A PA3 답습 site operator badge)
// 복귀: 모달 status 변경 + 알림 ✅ 체크박스 (Phase 2 UD1 답습)
// 에러: 통계 카드 0건 = "데이터 없음" / 매너 통계 = 평균 + flag 종류만 (BG2 답습)
//
// 신규 박제 (운영 80 line · 옛 search + active/approve/suspend UX):
//   TA1 = Hero 상태 분포 + 4 탭 (활성 / 미승인 / 정지·해산 / 매너 통계 BG2)
//   TA2 = 5 탭 모달 (기본 / 멤버 / 활동 BT3 / 매너 BG2 / 이력) + 하단 super-admin CTA
// E 등급 · super-admin only
// ============================================================

function AdminTeams() {
  const [tab, setTab] = React.useState('active');
  const [openModal, setOpenModal] = React.useState(null);   // team id or null
  const [modalTab, setModalTab] = React.useState('basic');
  const [confirm, setConfirm] = React.useState(null);        // 'activate' | 'suspend' | 'dissolve' | 'transfer'

  const stats = window.ADMIN_TEAMS_STATS;
  const all = window.ADMIN_TEAMS_LIST;

  const filtered = tab === 'active' ? all.filter(t => t.status === 'active')
                 : tab === 'pending' ? all.filter(t => t.status === 'pending')
                 : tab === 'ban' ? all.filter(t => t.status === 'suspended' || t.status === 'dissolved')
                 : all.filter(t => t.manner_avg != null);  // manner tab

  const openTeam = all.find(t => t.id === openModal);

  return (
    <div className="ta1-page">
      <window.Crumbs trail={['관리자', '팀 검수']}/>

      {/* Hero band */}
      <div className="ta1-hero">
        <div>
          <h1 className="ta1-hero__title">
            <span className="ico material-symbols-outlined" style={{verticalAlign:-4, marginRight:6}}>groups</span>
            팀 검수
          </h1>
          <div className="ta1-hero__sub">/admin/teams · BT8 · super-admin only</div>
          <div style={{marginTop:8}}>
            <window.OperatorBadge/>
          </div>
        </div>
        <div className="ta1-hero__stats">
          <div className="ta1-hero__stat">
            <div className="ta1-hero__stat-num">{stats.total}</div>
            <div className="ta1-hero__stat-lbl">전체</div>
          </div>
          <div className="ta1-hero__stat">
            <div className="ta1-hero__stat-num ta1-hero__stat-num--active">{stats.active}</div>
            <div className="ta1-hero__stat-lbl">활성</div>
          </div>
          <div className="ta1-hero__stat">
            <div className="ta1-hero__stat-num ta1-hero__stat-num--pending">{stats.pending}</div>
            <div className="ta1-hero__stat-lbl">미승인</div>
          </div>
          <div className="ta1-hero__stat">
            <div className="ta1-hero__stat-num ta1-hero__stat-num--suspend">{stats.suspended}</div>
            <div className="ta1-hero__stat-lbl">정지</div>
          </div>
          <div className="ta1-hero__stat">
            <div className="ta1-hero__stat-num ta1-hero__stat-num--dissolve">{stats.dissolved}</div>
            <div className="ta1-hero__stat-lbl">해산</div>
          </div>
        </div>
      </div>

      {/* Filter row */}
      <div className="ta1-filter">
        <div className="tu1-filter__search">
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="팀 이름 / 캡틴 / 도시" />
        </div>
        <span className="tu1-filter__sep"/>
        <span className="tu1-filter__lbl">활동도</span>
        <div className="tu1-filter__group">
          <button className="tu1-filter__chip is-on">전체</button>
          <button className="tu1-filter__chip">30일 활동</button>
          <button className="tu1-filter__chip">60일 무활동</button>
          <button className="tu1-filter__chip">90일+ 무활동</button>
        </div>
        <span className="tu1-filter__sep"/>
        <span className="tu1-filter__lbl">매너</span>
        <div className="tu1-filter__group">
          <button className="tu1-filter__chip">★ 4.5+</button>
          <button className="tu1-filter__chip">3.5-4.5</button>
          <button className="tu1-filter__chip" style={{color:'var(--err)', fontWeight:700}}>★ 3.5-</button>
        </div>
      </div>

      {/* 4 tabs */}
      <div className="tu2-tabs">
        <button className="tu2-tab" data-active={tab === 'active'} onClick={()=>setTab('active')}>활성 ({stats.active})</button>
        <button className="tu2-tab" data-active={tab === 'pending'} onClick={()=>setTab('pending')}>미승인 ({stats.pending})</button>
        <button className="tu2-tab" data-active={tab === 'ban'} onClick={()=>setTab('ban')}>정지 / 해산 ({stats.suspended + stats.dissolved})</button>
        <button className="tu2-tab" data-active={tab === 'manner'} onClick={()=>setTab('manner')}>매너 통계 <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === 'manner' ? 'inherit' : 'var(--ink-dim)', marginLeft:3}}>BG2</span></button>
      </div>

      {/* Tab content */}
      {tab !== 'manner' && (
        <div className="ta1-grid">
          {filtered.slice(0, 8).map(t => (
            <div key={t.id} onClick={()=>{setOpenModal(t.id); setModalTab('basic');}}>
              <window.TeamCard team={t} variant="admin"/>
            </div>
          ))}
        </div>
      )}

      {tab === 'manner' && (
        <div>
          {/* BG2 답습 — 평균 + flag 종류만 / 개별 건수 ❌ */}
          <div className="tu4-auto-banner" style={{background:'var(--accent-soft)', borderColor:'var(--accent-hair)', color:'var(--accent-deep)'}}>
            <span className="ico material-symbols-outlined">info</span>
            <div style={{flex:1}}>
              <strong>BG2 사용자 결재 룰</strong> — 평균 평점 + 받은 flag 종류만 표시. 개별 평가 건수 / 평가자 명단 ❌.
            </div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:12, marginTop:12}}>
            <div className="gm-card">
              <h3 className="gm-card__h">전체 평균</h3>
              <div style={{textAlign:'center', padding:'16px 0'}}>
                <div style={{fontFamily:'var(--ff-display)', fontSize:48, fontWeight:900, color:'var(--ok)', lineHeight:1, letterSpacing:'-0.025em'}}>4.4</div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ink-mute)', marginTop:6, letterSpacing:'0.06em', textTransform:'uppercase'}}>전체 팀 평균 매너</div>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:4, marginTop:8}}>
                {[
                  { l: '★ 4.5+', n: 42, c: 'var(--ok)' },
                  { l: '★ 3.5-4.5', n: 28, c: 'var(--warn)' },
                  { l: '★ 3.5-', n: 8, c: 'var(--err)' },
                  { l: '평가 없음', n: 6, c: 'var(--ink-dim)' },
                ].map(d => (
                  <div key={d.l} style={{display:'flex', alignItems:'center', gap:8, fontSize:12.5}}>
                    <div style={{flex:1, fontFamily:'var(--ff-mono)', fontWeight:700, color:d.c}}>{d.l}</div>
                    <div style={{flex:2, height:6, background:'var(--bg-head)', borderRadius:3, overflow:'hidden'}}>
                      <div style={{height:'100%', width:(d.n/42*100)+'%', background:d.c}}/>
                    </div>
                    <div style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:12, minWidth:40, textAlign:'right'}}>{d.n}팀</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="gm-card">
              <h3 className="gm-card__h" style={{color:'var(--err)'}}>하위 매너 팀 <span style={{fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, color:'var(--ink-dim)', marginLeft:4}}>평균 3.5- 또는 flag 5+</span></h3>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {[
                  { name: '한남스타스', logo: '한', avg: 2.4, flags: ['no_show', 'bad_attitude'], color: '#404755' },
                  { name: '강북코프', logo: '강', avg: 3.4, flags: ['late_5min', 'rough_play'], color: '#404755' },
                  { name: '동작 챌린저스', logo: '동', avg: 3.8, flags: ['late'], color: '#B47A11' },
                ].map(t => (
                  <div key={t.name} style={{display:'flex', alignItems:'center', gap:10, padding:'8px 10px', background:'var(--bg-alt)', borderRadius:'var(--r-sm)'}}>
                    <window.JerseyAvatar logo={t.logo} color1={t.color} size={32}/>
                    <div style={{flex:1, fontWeight:700, fontSize:13}}>{t.name}</div>
                    <window.MannerStars avg={t.avg}/>
                    <div style={{display:'flex', gap:3}}>
                      {t.flags.map(f => {
                        const lab = window.MANNER_FLAG_LABELS[f] || { label: f, emoji:'⚠', tone:'warn' };
                        return <span key={f} className={'manner-flag manner-flag--' + lab.tone}>{lab.emoji} {lab.label}</span>;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========== TA2 Modal (옵션 A) — TA1 카드 클릭 시 ========== */}
      {openTeam && (
        <div className="ta2-modal-stage" onClick={()=>setOpenModal(null)}>
          <div className="ta2-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="ta2-modal__head">
              <window.JerseyAvatar logo={openTeam.logo} color1={openTeam.color_primary || '#404755'} color2={openTeam.color_secondary} size={48}/>
              <div className="ta2-modal__head-body">
                <h2 className="ta2-modal__title">
                  {openTeam.name}
                  <window.AdminTeamStatusBadge status={openTeam.status}/>
                </h2>
                <div className="ta2-modal__sub">
                  /admin/teams · {openTeam.id} · 검수 모달 (옵션 A · 새 라우트 ❌)
                </div>
              </div>
              <button className="ta2-modal__close" onClick={()=>setOpenModal(null)}>
                <span className="ico material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="ta2-modal__tabs">
              <button className="ta2-modal__tab" data-active={modalTab === 'basic'} onClick={()=>setModalTab('basic')}>기본 정보</button>
              <button className="ta2-modal__tab" data-active={modalTab === 'members'} onClick={()=>setModalTab('members')}>멤버</button>
              <button className="ta2-modal__tab" data-active={modalTab === 'activity'} onClick={()=>setModalTab('activity')}>활동 <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color:'var(--ink-dim)', marginLeft:3}}>BT3</span></button>
              <button className="ta2-modal__tab" data-active={modalTab === 'manner'} onClick={()=>setModalTab('manner')}>매너 통계 <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color:'var(--ink-dim)', marginLeft:3}}>BG2</span></button>
              <button className="ta2-modal__tab" data-active={modalTab === 'history'} onClick={()=>setModalTab('history')}>이력</button>
            </div>

            <div className="ta2-modal__body">
              {modalTab === 'basic' && (
                <div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">팀명</span><span className="ta2-info-row__v">{openTeam.name}</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">캡틴</span><span className="ta2-info-row__v">{openTeam.captain.name}</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">지역</span><span className="ta2-info-row__v">{openTeam.city} {openTeam.district}</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">홈 코트</span><span className="ta2-info-row__v">{openTeam.home_court || '미지정'}</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">멤버</span><span className="ta2-info-row__v">{openTeam.member_count}명</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">소개</span><span className="ta2-info-row__v">{openTeam.description || '—'}</span></div>
                  <div className="ta2-info-row"><span className="ta2-info-row__l">팀 색상</span>
                    <span className="ta2-info-row__v" style={{display:'inline-flex', gap:8, alignItems:'center'}}>
                      <span style={{display:'inline-block', width:18, height:18, borderRadius:4, background:openTeam.color_primary || '#404755', border:'1px solid var(--border)'}}/>
                      {openTeam.color_primary || '—'}
                      {openTeam.color_secondary && <>
                        <span style={{display:'inline-block', width:18, height:18, borderRadius:4, background:openTeam.color_secondary, border:'1px solid var(--border)'}}/>
                        {openTeam.color_secondary}
                      </>}
                    </span>
                  </div>
                  {openTeam.status === 'suspended' && openTeam.suspended_reason && (
                    <div className="ta2-info-row" style={{background:'var(--err-soft)', padding:'10px 12px', borderRadius:'var(--r-sm)', marginTop:8}}>
                      <span className="ta2-info-row__l" style={{color:'var(--err)'}}>정지 사유</span>
                      <span className="ta2-info-row__v" style={{color:'var(--err)'}}>{openTeam.suspended_reason} ({openTeam.suspended_at})</span>
                    </div>
                  )}
                </div>
              )}

              {modalTab === 'members' && (
                <div className="tu4-list">
                  <p style={{margin:'0 0 10px', fontSize:12, color:'var(--ink-mute)'}}>
                    <span className="ico material-symbols-outlined" style={{fontSize:14, verticalAlign:-3, marginRight:4}}>info</span>
                    read-only · 멤버 관리는 캡틴이 /teams/[id]/manage 에서 처리
                  </p>
                  {window.TEAM_MEMBERS_MOCK.slice(0, 5).map(m => (
                    <div key={m.id} className="tu4-row">
                      <div className="tu4-row__jersey">#{m.jersey}</div>
                      <div className="tu4-row__av">{m.avatar}</div>
                      <div className="tu4-row__body">
                        <div className="tu4-row__name">{m.name}<window.RoleBadge role={m.role} small/></div>
                        <div className="tu4-row__sub">
                          <span><window.MannerStars avg={m.manner}/></span>
                          <span>· {m.last_activity_at?.slice(5)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalTab === 'activity' && (
                <div>
                  <p style={{margin:'0 0 10px', fontSize:12, color:'var(--ink-mute)'}}>
                    BT3 · last_activity_at 기준 멤버 분포. TU4 유령 후보 / TU5 휴면 예정과 동일 룰.
                  </p>
                  <div className="ta2-activity-grid">
                    <div className="ta2-activity">
                      <div className="ta2-activity__num ta2-activity__num--ok">6</div>
                      <div className="ta2-activity__lbl">30일 활동</div>
                    </div>
                    <div className="ta2-activity">
                      <div className="ta2-activity__num ta2-activity__num--warn">1</div>
                      <div className="ta2-activity__lbl">60-90일</div>
                    </div>
                    <div className="ta2-activity">
                      <div className="ta2-activity__num ta2-activity__num--err">1</div>
                      <div className="ta2-activity__lbl">90일+ 무활동</div>
                    </div>
                  </div>
                  <p style={{margin:0, fontSize:12, color:'var(--ink-mute)', lineHeight:1.6}}>
                    팀 평균 last_activity_at = <strong>23일 전</strong>. 활동도 상위 30% 수준. 90일+ 무활동 1명은 캡틴이 유령 후보로 분류했습니다 (TU4 ?tab=ghosts).
                  </p>
                </div>
              )}

              {modalTab === 'manner' && (
                <div>
                  <p style={{margin:'0 0 10px', fontSize:12, color:'var(--ink-mute)'}}>
                    BG2 답습 · 평균 + flag 종류만 / 개별 평가 건수 ❌
                  </p>
                  <div className="manner-card" style={{padding:'14px 16px', background:'var(--bg-alt)'}}>
                    <div className="manner-card__body">
                      <div className="manner-card__score" style={{color: openTeam.manner_avg >= 4.5 ? 'var(--ok)' : openTeam.manner_avg >= 3.5 ? 'var(--warn)' : 'var(--err)'}}>
                        <span className="manner-card__big">{openTeam.manner_avg?.toFixed(1) || '—'}</span>
                        <span className="manner-card__den">/ 5.0</span>
                      </div>
                      <div className="manner-card__count">팀 전체 평균</div>
                    </div>
                    <div className="manner-card__flags-lbl">받은 평가 키워드 <span style={{color:'var(--ink-dim)', fontWeight:500}}>(종류만 / 건수 ❌)</span></div>
                    <div className="manner-card__flags-row">
                      <span className="manner-flag manner-flag--ok">👍 시간 약속 잘 지킴</span>
                      <span className="manner-flag manner-flag--ok">👍 팀 플레이 좋음</span>
                      {openTeam.manner_avg < 4.0 && <span className="manner-flag manner-flag--warn">⚠ 약속 시간 늦음</span>}
                    </div>
                  </div>
                </div>
              )}

              {modalTab === 'history' && (
                <div>
                  <p style={{margin:'0 0 10px', fontSize:12, color:'var(--ink-mute)'}}>
                    TeamMemberHistory event_type 변경 list (joined / left / transferred 등)
                  </p>
                  <div>
                    {[
                      { kind: 'approve', time: '2024-03-15', title: '팀 생성 — super_admin 승인', sub: '캡틴 박수빈 (당시 신청)' },
                      { kind: 'default', time: '2024-05-22', title: '멤버 5명 합류', sub: '강민호 / 이태우 / 김지훈 / 윤호석 / 박재현' },
                      { kind: 'default', time: '2025-01-10', title: 'jersey 일괄 재배정', sub: '캡틴 요청' },
                      { kind: 'transfer', time: '2025-08-04', title: '부캡틴 권한 위임', sub: '박수빈 → 강민호 (vice)' },
                      { kind: 'default', time: '2026-02-15', title: 'rdm_captain → 박수빈 닉 변경', sub: '본인 신청' },
                    ].map((h, i) => (
                      <div key={i} className="ta2-history-row" data-kind={h.kind}>
                        <span className="ta2-history-row__dot"/>
                        <span className="ta2-history-row__time">{h.time}</span>
                        <div className="ta2-history-row__body">
                          <div className="ta2-history-row__title">{h.title}</div>
                          <div className="ta2-history-row__sub">{h.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 하단 super-admin CTA — Phase 2 UD1 답습 (알림 체크박스 ✅) */}
            <div className="ta2-modal__foot">
              {!confirm && <>
                {openTeam.status === 'pending' && (
                  <button className="btn btn--accent" onClick={()=>setConfirm('activate')}><span className="ico material-symbols-outlined">check</span> 활성화</button>
                )}
                {openTeam.status === 'active' && <>
                  <button className="btn" style={{color:'var(--err)', borderColor:'var(--err-soft)'}} onClick={()=>setConfirm('suspend')}><span className="ico material-symbols-outlined">block</span> 정지</button>
                  <button className="btn" style={{color:'var(--ink-mute)'}} onClick={()=>setConfirm('dissolve')}><span className="ico material-symbols-outlined">delete</span> 해산</button>
                  <button className="btn btn--ghost" onClick={()=>setConfirm('transfer')}><span className="ico material-symbols-outlined">swap_horiz</span> 캡틴 이양</button>
                </>}
                {openTeam.status === 'suspended' && (
                  <button className="btn btn--accent" onClick={()=>setConfirm('activate')}><span className="ico material-symbols-outlined">restart_alt</span> 정지 해제</button>
                )}
              </>}
              {confirm && (
                <div style={{width:'100%', display:'flex', flexDirection:'column', gap:10}}>
                  <div style={{fontSize:13.5, fontWeight:800}}>
                    {confirm === 'activate' && (openTeam.status === 'pending' ? '팀 활성화 — pending → active' : '정지 해제 — suspended → active')}
                    {confirm === 'suspend' && '팀 정지 — active → suspended'}
                    {confirm === 'dissolve' && '팀 해산 — active → dissolved (되돌릴 수 없음)'}
                    {confirm === 'transfer' && '캡틴 이양'}
                  </div>
                  {(confirm === 'suspend' || confirm === 'dissolve') && (
                    <textarea placeholder="사유 (rejection_reason)" rows={2} style={{padding:'8px 12px', border:'1px solid var(--border-strong)', borderRadius:'var(--r-sm)', fontSize:13, fontFamily:'var(--ff-body)', resize:'vertical'}}/>
                  )}
                  {confirm === 'transfer' && (
                    <input placeholder="새 캡틴 user_id 또는 닉네임" style={{padding:'8px 12px', border:'1px solid var(--border-strong)', borderRadius:'var(--r-sm)', fontSize:14}}/>
                  )}
                  <label className="tu4-modal-shadow__notify" style={{margin:0}}>
                    <input type="checkbox" defaultChecked/>
                    <div>
                      <strong>사용자에게 알림 보내기</strong>
                      <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>
                        Phase 2 UD1 답습 — 팀 캡틴 + 전 멤버에게 결과 알림 발송 (기본 ✅)
                      </div>
                    </div>
                  </label>
                  <div style={{display:'flex', gap:6, justifyContent:'flex-end'}}>
                    <button className="btn btn--ghost" onClick={()=>setConfirm(null)}>취소</button>
                    <button className={'btn ' + (confirm === 'activate' ? 'btn--accent' : '')} style={confirm === 'suspend' || confirm === 'dissolve' ? {color:'#fff', background:'var(--err)', borderColor:'var(--err)'} : confirm === 'transfer' ? {color:'#fff', background:'var(--cafe-blue)', borderColor:'var(--cafe-blue-deep)'} : {}}>
                      {confirm === 'activate' ? '활성화 + 알림' : confirm === 'suspend' ? '정지 + 알림' : confirm === 'dissolve' ? '해산 + 알림' : '이양 + 알림'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminTeams = AdminTeams;
