/* global React */
// ============================================================
// BDR v2.22 — AdminOrganizations (OA1 · Phase 4A · 보강 · BO5 + BO1)
// 운영 박제 대상: /admin/organizations
// 진입: 사이트 운영 → 외부 관리 → 단체 관리
// 복귀: 승인/거절 → 알림 자동 발송 (UD1 답습) / 정지·해산 → 단체 상태 변경
//
// 보강 (운영 244 line 답습) — TA2 옵션 A 모달 (새 라우트 ❌) + UD1 알림 체크박스
//   상태 4분면: pending(대기) / approved(승인) / archived(보관) / rejected(거절)
//   pending 행 클릭 → 모달 표시 (브리핑 + 승인 / 거절 / 검토 메모)
//   approved 행 클릭 → 모달 표시 (정지 / 해산 — BO5)
// E 등급 (super-admin Site Operator)
// ============================================================

function AdminOrganizations() {
  const orgs = window.ORG_LIST;
  const [filter, setFilter] = React.useState('pending');
  const [selected, setSelected] = React.useState(orgs.find(o => o.status === 'pending'));
  const [rejecting, setRejecting] = React.useState(false);
  const [notify, setNotify] = React.useState(true);

  const stats = {
    pending: orgs.filter(o => o.status === 'pending').length,
    approved: orgs.filter(o => o.status === 'approved').length,
    archived: orgs.filter(o => o.status === 'archived').length,
    rejected: orgs.filter(o => o.status === 'rejected').length,
  };

  const filtered = filter === 'all' ? orgs : orgs.filter(o => o.status === filter);

  return (
    <div className="oa1-page">
      {/* Hero — Site Operator + 4 상태 분포 */}
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge/>
          <h1 className="oa1-hero__title" style={{marginTop:8}}>단체 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 외부 관리 · ORGANIZATIONS</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{stats.pending}</div>
            <div className="oa1-hero__stat-lbl">대기</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{stats.approved}</div>
            <div className="oa1-hero__stat-lbl">승인</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num oa1-hero__stat-num--archived">{stats.archived}</div>
            <div className="oa1-hero__stat-lbl">보관</div>
          </div>
          <div className="oa1-hero__stat">
            <div className="oa1-hero__stat-num oa1-hero__stat-num--rejected">{stats.rejected}</div>
            <div className="oa1-hero__stat-lbl">거절</div>
          </div>
        </div>
      </header>

      {/* Filter tabs */}
      <div className="oa1-filter">
        <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase', paddingRight:4}}>상태</span>
        {[
          { v: 'pending',  l: '대기',   c: stats.pending },
          { v: 'approved', l: '승인',   c: stats.approved },
          { v: 'archived', l: '보관',   c: stats.archived },
          { v: 'rejected', l: '거절',   c: stats.rejected },
          { v: 'all',      l: '전체',   c: orgs.length },
        ].map(t => (
          <button key={t.v}
            className={'tu1-filter__chip' + (filter === t.v ? ' is-on' : '')}
            onClick={()=>setFilter(t.v)}>
            {t.l} <span style={{opacity:0.6, marginLeft:3, fontFamily:'var(--ff-mono)', fontSize:11}}>{t.c}</span>
          </button>
        ))}
        <div style={{flex:1}}/>
        <div className="tu1-filter__search" style={{minWidth:200, maxWidth:280}}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="단체명 / 신청자"/>
        </div>
      </div>

      {/* Table */}
      <div className="oa1-table">
        <div className="oa1-table__head">
          <div>단체명</div>
          <div>지역</div>
          <div>신청자</div>
          <div>상태</div>
          <div>신청일</div>
          <div>액션</div>
        </div>
        {filtered.map(org => (
          <div key={org.id} className="oa1-table__row" onClick={()=>setSelected(org)}>
            <div className="oa1-table__col--name">
              <window.OrgLogo logo={org.logo} color={org.brand_color} size={36}/>
              <div className="oa1-table__col--name-body">
                <div className="oa1-table__col--name-title">{org.name}</div>
                {org.apply_note && (
                  <div className="oa1-table__col--name-note">메모: {org.apply_note.slice(0, 32)}{org.apply_note.length > 32 ? '…' : ''}</div>
                )}
              </div>
            </div>
            <div data-label="지역" style={{color:'var(--ink-soft)'}}>{org.region || '-'}</div>
            <div data-label="신청자">
              <div className="oa1-table__col--owner-name">{org.owner.nickname}</div>
              <div className="oa1-table__col--owner-email">{org.contact_email || '—'}</div>
            </div>
            <div data-label="상태">
              <window.OrgStatusBadge status={org.status}/>
            </div>
            <div data-label="신청일" style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)', fontWeight:700}}>
              {org.submitted_at}
            </div>
            <div className="oa1-table__col--actions" data-label="액션">
              {org.status === 'pending' && (
                <>
                  <button className="btn btn--sm btn-approve">승인</button>
                  <button className="btn btn--sm btn-reject">거절</button>
                </>
              )}
              {org.status === 'approved' && (
                <>
                  <button className="btn btn--sm btn-suspend">정지</button>
                  <button className="btn btn--sm btn-archive">해산</button>
                </>
              )}
              {(org.status === 'archived' || org.status === 'rejected') && (
                <button className="btn btn--sm btn--ghost">상세</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* TA2 답습 모달 stage — 옵션 A (새 라우트 ❌) */}
      {selected && (
        <section className="oa1-modal-stage" aria-modal="true">
          <div className="oa1-modal">
            <div className="oa1-modal__head">
              <window.OrgLogo logo={selected.logo} color={selected.brand_color} size={48}/>
              <div className="oa1-modal__head-body">
                <h3 className="oa1-modal__title">
                  {selected.name}
                  <window.OrgStatusBadge status={selected.status} small/>
                </h3>
                <div className="oa1-modal__sub">/{selected.slug} · {selected.region}</div>
              </div>
              <button className="oa1-modal__close" onClick={()=>setSelected(null)} aria-label="닫기">
                <span className="ico material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="oa1-modal__body">
              {/* BO1 — OU3 신청 form 필드 = OA1 승인 모달 표시 필드 (동일 organizations 컬럼) */}
              <div className="ou2-card" style={{padding:0, border:0, marginBottom:14}}>
                <h4 className="ou2-card__h" style={{margin:'0 0 8px'}}>
                  <span className="ico material-symbols-outlined">description</span>
                  신청 정보
                </h4>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">신청자</span>
                  <span className="ou2-info-row__v">{selected.owner.nickname} <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)'}}>· user-{selected.owner.id}</span></span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">소개</span>
                  <span className="ou2-info-row__v">{selected.description || '미입력'}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">활동 지역</span>
                  <span className="ou2-info-row__v">{selected.region}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">연락 이메일</span>
                  <span className="ou2-info-row__v">{selected.contact_email || '미입력'}</span>
                </div>
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">웹사이트</span>
                  <span className="ou2-info-row__v">{selected.website_url || '미입력'}</span>
                </div>
                {selected.apply_note && (
                  <div className="ou2-info-row">
                    <span className="ou2-info-row__l">신청 메모</span>
                    <span className="ou2-info-row__v" style={{lineHeight:1.6}}>{selected.apply_note}</span>
                  </div>
                )}
                <div className="ou2-info-row">
                  <span className="ou2-info-row__l">신청일</span>
                  <span className="ou2-info-row__v" style={{fontFamily:'var(--ff-mono)'}}>{selected.submitted_at}</span>
                </div>
                {selected.approved_at && (
                  <div className="ou2-info-row">
                    <span className="ou2-info-row__l">승인일</span>
                    <span className="ou2-info-row__v" style={{fontFamily:'var(--ff-mono)', color:'var(--ok)'}}>{selected.approved_at}</span>
                  </div>
                )}
              </div>

              {/* approved 일 때 — BO5 운영 통계 + 정지/해산 안내 */}
              {selected.status === 'approved' && (
                <div className="ou2-card" style={{padding:0, border:0, marginBottom:14}}>
                  <h4 className="ou2-card__h" style={{margin:'0 0 8px'}}>
                    <span className="ico material-symbols-outlined">monitoring</span>
                    운영 활동 (BO5)
                  </h4>
                  <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
                    <div className="ta2-activity">
                      <div className="ta2-activity__num ta2-activity__num--ok">{selected.series_count}</div>
                      <div className="ta2-activity__lbl">시리즈</div>
                    </div>
                    <div className="ta2-activity">
                      <div className="ta2-activity__num ta2-activity__num--ok">{selected.tournaments_count}</div>
                      <div className="ta2-activity__lbl">누적 대회</div>
                    </div>
                    <div className="ta2-activity">
                      <div className="ta2-activity__num">{selected.teams_count}</div>
                      <div className="ta2-activity__lbl">참가 팀</div>
                    </div>
                  </div>
                  <div style={{marginTop:10, padding:'10px 12px', background:'var(--bg-alt)', borderRadius:'var(--r-sm)', fontSize:12, color:'var(--ink-soft)', lineHeight:1.55}}>
                    <b style={{color:'var(--ink)'}}>정지</b> — 단체 페이지 비공개 + 신규 시리즈 생성 차단 (기존 회차 보존). <br/>
                    <b style={{color:'var(--ink)'}}>해산</b> — status=archived. 단체 row 보존 + 모든 시리즈 read-only.
                  </div>
                </div>
              )}

              {/* 거절 사유 입력 (rejecting 토글 시) */}
              {selected.status === 'pending' && (
                <div className="oa1-modal__reject-note" data-on={rejecting}>
                  <label style={{display:'block', fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--err)', letterSpacing:'0.04em', textTransform:'uppercase', marginBottom:6}}>거절 사유 (필수)</label>
                  <input className="ou3-input" style={{background:'#fff', borderColor:'var(--err-soft)'}} placeholder="단체 등록 요건 미충족"/>
                </div>
              )}
            </div>

            {/* 알림 체크박스 (UD1 답습) + Footer CTA */}
            <div className="oa1-modal__foot">
              <div className="oa1-modal__notify">
                <input type="checkbox" checked={notify} onChange={()=>setNotify(!notify)} id="oa1-notify"/>
                <div>
                  <strong>처리 결과를 신청자에게 알림 발송</strong>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-mute)', marginTop:2, letterSpacing:'0.02em'}}>
                    카카오 알림톡 + 이메일 ({selected.contact_email || selected.owner.nickname})
                  </div>
                </div>
              </div>
              <div className="oa1-modal__cta">
                {selected.status === 'pending' && (
                  <>
                    {!rejecting && (
                      <>
                        <button className="btn btn--sm btn-reject" onClick={()=>setRejecting(true)}>
                          <span className="ico material-symbols-outlined">close</span>
                          거절
                        </button>
                        <button className="btn btn--sm btn-approve">
                          <span className="ico material-symbols-outlined">check</span>
                          승인
                        </button>
                      </>
                    )}
                    {rejecting && (
                      <>
                        <button className="btn btn--sm" onClick={()=>setRejecting(false)}>취소</button>
                        <button className="btn btn--sm btn-reject">
                          <span className="ico material-symbols-outlined">block</span>
                          거절 확정
                        </button>
                      </>
                    )}
                  </>
                )}
                {selected.status === 'approved' && (
                  <>
                    <button className="btn btn--sm btn-suspend">
                      <span className="ico material-symbols-outlined">pause_circle</span>
                      정지
                    </button>
                    <button className="btn btn--sm btn-archive">
                      <span className="ico material-symbols-outlined">archive</span>
                      해산
                    </button>
                  </>
                )}
                {(selected.status === 'archived' || selected.status === 'rejected') && (
                  <button className="btn btn--sm btn--primary">
                    <span className="ico material-symbols-outlined">restart_alt</span>
                    복구
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

window.AdminOrganizations = AdminOrganizations;
