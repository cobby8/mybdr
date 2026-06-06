/* global React */
// ============================================================
// BDR v2.22 — OrgAdminDetail (OO2 · Phase 4A · 신규 · BO3 위임)
// 운영 박제 대상: /tournament-admin/organizations/[orgId]?tab=...
// 진입: OO1 카드 / OU2 sidebar "단체 관리 대시보드"
// 복귀: 각 액션 → 단체 상태 갱신 / 시리즈 생성 → OO3 wizard
// 에러: archive 단체 = 회색 표시 + "보관됨" 뱃지 + 복구 버튼
//
// 신규 박제 (운영 OO2 head 300 line + OO2b members 247 line · 거대 페이지 통합):
//   TAB 1 basic     — 단체 정보 (편집 가능) — OU3 신청 form 동일 필드 (BO1 일관)
//   TAB 2 members   — 멤버 list + 초대 form + role 변경 / 제거
//   TAB 3 series    — 단체 소속 시리즈 list + 새 시리즈 CTA → OO3 wizard
//   TAB 4 editions  — 회차 일정 통합 (BO2 위계 인지)
//   TAB 5 officers  — 권한 위임 (TU4 BT4 답습 — admin role permissions)
//   TAB 6 activity  — 활동 이력 (ORG_ACTIVITY_LOG)
//
// Series Operator only (Site Operator badge ❌)
// 거대 페이지 — TU4 답습 6 sub-tab 통합 패턴
// E 등급
// ============================================================

const OO2_TABS = [
  { v: 'basic',    l: '기본 정보', ico: 'info',                  bo: null },
  { v: 'members',  l: '멤버',     ico: 'group',                 bo: 'BO3' },
  { v: 'series',   l: '시리즈',   ico: 'collections_bookmark',  bo: 'BO2' },
  { v: 'editions', l: '회차',     ico: 'event',                 bo: 'BO2' },
  { v: 'officers', l: '권한 위임', ico: 'shield_person',         bo: 'BO3' },
  { v: 'activity', l: '활동 이력', ico: 'history',               bo: null },
];

window.OrgAdminDetail = function OrgAdminDetail({ initialTab = 'basic' }) {
  const org = window.ORG_LIST[0];  // 강남구농구협회
  const members = window.ORG_MEMBERS_MOCK;
  const series = window.SERIES_LIST.filter(s => s.org_id === org.id);
  const activityLog = window.ORG_ACTIVITY_LOG;

  const [tab, setTab] = React.useState(initialTab);
  const [edit, setEdit] = React.useState(false);
  const [form, setForm] = React.useState({
    name: org.name,
    description: org.description,
    region: org.region,
    contact_email: org.contact_email,
    website_url: org.website_url || '',
  });
  const setF = (k, v) => setForm({...form, [k]: v});

  return (
    <div>
      {/* Crumbs */}
      <div style={{marginBottom:8}}>
        <window.OrgHierarchyCrumbs trail={[
          { label: '단체 운영', icon: 'home' },
          { label: '내 단체' },
          { label: org.name, current: true, icon: 'apartment' },
        ]}/>
      </div>

      {/* Mini hero */}
      <div className="oo2-mini-hero">
        <window.OrgLogo logo={org.logo} color={org.brand_color} size={56}/>
        <div className="oo2-mini-hero__body">
          <div className="oo2-mini-hero__title">
            {org.name}
            <window.OrgStatusBadge status={org.status} small/>
            {org.my_role && (
              <span className={'org-member-role org-member-role--' + org.my_role}>
                {{ owner:'소유자', admin:'관리자', member:'멤버' }[org.my_role]}
              </span>
            )}
          </div>
          <div className="oo2-mini-hero__meta">
            <span>{org.region}</span>
            <span style={{margin:'0 6px', color:'var(--ink-dim)'}}>·</span>
            <span>멤버 <b style={{color:'var(--ink)'}}>{members.length}</b>명</span>
            <span style={{margin:'0 6px', color:'var(--ink-dim)'}}>·</span>
            <span>시리즈 <b style={{color:'var(--ink)'}}>{series.length}</b>개</span>
            <span style={{margin:'0 6px', color:'var(--ink-dim)'}}>·</span>
            <span>대회 <b style={{color:'var(--ink)'}}>{org.tournaments_count}</b>회</span>
          </div>
        </div>
        <div className="oo2-mini-hero__cta">
          <a className="btn btn--ghost" href="ou2-organization-detail.html" target="_blank">
            <span className="ico material-symbols-outlined">open_in_new</span>
            공개 페이지
          </a>
        </div>
      </div>

      {/* 6 tabs */}
      <div className="oo2-tabs">
        {OO2_TABS.map(t => (
          <button key={t.v}
            className="oo2-tab"
            data-active={tab === t.v}
            onClick={()=>setTab(t.v)}>
            <span className="ico material-symbols-outlined">{t.ico}</span>
            {t.l}
            {t.v === 'members'  && <span className="oo2-tab__count">{members.length}</span>}
            {t.v === 'series'   && <span className="oo2-tab__count">{series.length}</span>}
            {t.v === 'editions' && <span className="oo2-tab__count">{org.tournaments_count}</span>}
            {t.bo && <span style={{fontFamily:'var(--ff-mono)', fontSize:9, fontWeight:700, color: tab === t.v ? 'rgba(255,255,255,.6)' : 'var(--ink-dim)'}}>{t.bo}</span>}
          </button>
        ))}
      </div>

      {/* ========== TAB 1: BASIC ========== */}
      {tab === 'basic' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">단체 정보</h2>
            <span className="oo2-section__hint">OU3 신청 form 동일 필드 — BO1 다리</span>
            <div className="oo2-section__cta">
              {!edit && <button className="btn btn--sm" onClick={()=>setEdit(true)}><span className="ico material-symbols-outlined">edit</span> 편집</button>}
              {edit && (
                <div style={{display:'flex', gap:6}}>
                  <button className="btn btn--sm" onClick={()=>setEdit(false)}>취소</button>
                  <button className="btn btn--sm btn--primary" onClick={()=>setEdit(false)}>
                    <span className="ico material-symbols-outlined">save</span> 저장
                  </button>
                </div>
              )}
            </div>
          </div>

          {!edit && (
            <div className="ou2-card">
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">단체명</span>
                <span className="ou2-info-row__v"><b>{org.name}</b></span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">Slug</span>
                <span className="ou2-info-row__v" style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>/{org.slug}</span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">소개</span>
                <span className="ou2-info-row__v">{org.description}</span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">활동 지역</span>
                <span className="ou2-info-row__v">{org.region}</span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">상태</span>
                <span className="ou2-info-row__v">
                  <window.OrgStatusBadge status={org.status} small/>
                  <span style={{marginLeft:8, fontSize:12, color:'var(--ink-mute)'}}>{org.is_public ? '공개' : '비공개'}</span>
                </span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">연락 이메일</span>
                <span className="ou2-info-row__v" style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>{org.contact_email}</span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">웹사이트</span>
                <span className="ou2-info-row__v">
                  {org.website_url
                    ? <a style={{color:'var(--cafe-blue-deep)', textDecoration:'underline', fontFamily:'var(--ff-mono)', fontSize:12.5}}>{org.website_url}</a>
                    : <span style={{color:'var(--ink-dim)'}}>미입력</span>}
                </span>
              </div>
              <div className="ou2-info-row">
                <span className="ou2-info-row__l">소유자</span>
                <span className="ou2-info-row__v">{org.owner.nickname} <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)'}}>· user-{org.owner.id}</span></span>
              </div>
            </div>
          )}

          {edit && (
            <div className="ou2-card">
              <div className="ou3-field">
                <label className="ou3-field__lbl">단체명<span className="ou3-field__lbl-req">*</span></label>
                <input className="ou3-input" value={form.name} onChange={e=>setF('name', e.target.value)}/>
              </div>
              <div className="ou3-field">
                <label className="ou3-field__lbl">소개</label>
                <textarea className="ou3-textarea" value={form.description} onChange={e=>setF('description', e.target.value)}/>
              </div>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div className="ou3-field">
                  <label className="ou3-field__lbl">활동 지역</label>
                  <input className="ou3-input" value={form.region} onChange={e=>setF('region', e.target.value)}/>
                </div>
                <div className="ou3-field">
                  <label className="ou3-field__lbl">연락 이메일</label>
                  <input className="ou3-input" type="email" value={form.contact_email} onChange={e=>setF('contact_email', e.target.value)}/>
                </div>
              </div>
              <div className="ou3-field" style={{marginBottom:0}}>
                <label className="ou3-field__lbl">웹사이트</label>
                <input className="ou3-input" value={form.website_url} onChange={e=>setF('website_url', e.target.value)}/>
              </div>
            </div>
          )}

          {/* owner only — 보관 / 해산 */}
          {org.my_role === 'owner' && (
            <div className="ou2-card" style={{marginTop:14, borderColor:'var(--err-soft)'}}>
              <h3 style={{fontFamily:'var(--ff-display)', fontSize:14, fontWeight:800, color:'var(--err)', margin:'0 0 8px'}}>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:17, verticalAlign:'-4px', marginRight:6}}>warning</span>
                위험 영역 — owner only
              </h3>
              <div style={{fontSize:12.5, color:'var(--ink-mute)', marginBottom:12, lineHeight:1.6}}>
                단체 <b>보관</b> 시 단체 페이지 비공개 + 신규 시리즈 차단 (기존 회차 보존, 복구 가능). 사이트 운영자의 <b>해산</b>은 OA1 모달에서 처리.
              </div>
              <div style={{display:'flex', gap:6}}>
                <button className="btn btn--sm btn-archive">
                  <span className="ico material-symbols-outlined">archive</span>
                  단체 보관
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ========== TAB 2: MEMBERS ========== */}
      {tab === 'members' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">멤버 — {members.length}명</h2>
            <span className="oo2-section__hint">owner / admin / member · 이메일 초대 — BO3 다리</span>
          </div>

          {/* Invite form */}
          <div className="ou2-card" style={{marginBottom:12}}>
            <h3 style={{fontFamily:'var(--ff-display)', fontSize:13, fontWeight:800, margin:'0 0 8px'}}>
              <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, verticalAlign:'-3px', marginRight:5, color:'var(--cafe-blue)'}}>person_add</span>
              멤버 초대
            </h3>
            <div style={{display:'flex', gap:6, alignItems:'center'}}>
              <input className="ou3-input" type="email" placeholder="이메일 주소" style={{flex:1}}/>
              <select className="ou3-select" defaultValue="member" style={{width:120, flex:'none'}}>
                <option value="member">멤버</option>
                <option value="admin">관리자</option>
              </select>
              <button className="btn btn--primary">
                <span className="ico material-symbols-outlined">send</span>
                초대
              </button>
            </div>
          </div>

          {/* Members list */}
          <div className="tu4-list">
            {members.map(m => (
              <div key={m.id} className="tu4-row">
                <div className="tu4-row__av">{m.avatar}</div>
                <div className="tu4-row__body">
                  <div className="tu4-row__name">
                    {m.nickname}
                    <span className={'org-member-role org-member-role--' + m.role}>
                      {{ owner:'소유자', admin:'관리자', member:'멤버' }[m.role]}
                    </span>
                  </div>
                  <div className="tu4-row__sub">
                    <span>{m.email}</span>
                    <span><span className="ico material-symbols-outlined" style={{fontSize:12}}>schedule</span> SINCE {m.joined_at.slice(0, 7)}</span>
                  </div>
                </div>
                <div className="tu4-row__cta">
                  {m.role !== 'owner' && (
                    <>
                      <button className="btn btn--sm btn--ghost"><span className="ico material-symbols-outlined">manage_accounts</span> role</button>
                      <button className="btn btn--sm" style={{color:'var(--err)', borderColor:'var(--err-soft)'}}>
                        <span className="ico material-symbols-outlined">person_remove</span>
                      </button>
                    </>
                  )}
                  {m.role === 'owner' && <span style={{fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'0.04em'}}>제거 불가</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========== TAB 3: SERIES ========== */}
      {tab === 'series' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">시리즈 — {series.length}개</h2>
            <span className="oo2-section__hint">단체 → 시리즈 → 회차 위계 — BO2 다리</span>
            <div className="oo2-section__cta">
              <a className="btn btn--sm btn--primary" href="oo3-series-admin.html#new">
                <span className="ico material-symbols-outlined">add</span>
                새 시리즈 만들기
              </a>
            </div>
          </div>
          <div className="oo3-list">
            {series.map(s => (
              <a key={s.id} className="oo3-list-row" href="oo3-series-admin.html#detail">
                <div className="oo3-list-row__num" style={{background: s.color}}>{s.logo}</div>
                <div className="oo3-list-row__body">
                  <div className="oo3-list-row__name">{s.name}</div>
                  <div className="oo3-list-row__sub">{s.description}</div>
                </div>
                <div className="oo3-list-row__count">
                  <b>{s.tournaments_count}</b>
                  회 진행
                </div>
                <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:20, color:'var(--ink-dim)'}}>chevron_right</span>
              </a>
            ))}
            {series.length === 0 && (
              <div className="oo1-empty">
                <div className="oo1-empty__icon material-symbols-outlined">collections_bookmark</div>
                <h3 style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:800, margin:'0 0 6px'}}>아직 시리즈가 없습니다</h3>
                <p style={{fontSize:13, color:'var(--ink-mute)', margin:'0 0 14px'}}>3-step 마법사로 첫 시리즈를 만들어보세요.</p>
                <a className="btn btn--primary" href="oo3-series-admin.html#new">새 시리즈 만들기</a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========== TAB 4: EDITIONS ========== */}
      {tab === 'editions' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">회차 일정 — {org.tournaments_count}회 누적</h2>
            <span className="oo2-section__hint">모든 시리즈의 회차 통합 보기 — BO2 위계</span>
          </div>
          <div style={{marginBottom:10, padding:'10px 14px', background:'var(--cafe-blue-soft)', border:'1px solid var(--cafe-blue-hair)', borderRadius:'var(--r-sm)', fontSize:12.5, color:'var(--cafe-blue-deep)', display:'flex', gap:8, alignItems:'flex-start'}}>
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, flexShrink:0}}>info</span>
            <div style={{lineHeight:1.55}}>회차 row 클릭 → <b style={{fontFamily:'var(--ff-mono)'}}>/tournaments/[id]</b> 셋업 hub (Phase 1A PA4 답습). 시리즈별 단순 보기는 시리즈 탭 → 시리즈 detail.</div>
          </div>
          <div className="ou4-editions">
            {series.flatMap(s => [
              { id: s.id + '-cur', edition: s.tournaments_count, name: s.name + ' #' + s.tournaments_count, date: '2026-06-15', venue: '장충체육관', status: 'recruit',   teams: 18, max: 32, series_name: s.name, color: s.color },
              { id: s.id + '-p1',  edition: s.tournaments_count - 1, name: s.name + ' #' + (s.tournaments_count - 1), date: '2025-06-20', venue: '장충체육관', status: 'completed', teams: 32, max: 32, series_name: s.name, color: s.color },
            ]).map(e => (
              <a key={e.id} className="ou4-edition-row">
                <div className={'ou4-edition-row__num' + (e.status === 'recruit' ? ' ou4-edition-row__num--cur' : '')} style={e.status === 'recruit' ? {} : {background: e.color, color:'#fff', borderColor: e.color}}>
                  <b>{e.edition}</b>
                  <small>회</small>
                </div>
                <div className="ou4-edition-row__body">
                  <div className="ou4-edition-row__name">
                    {e.name}
                    {' '}
                    <span className={'ou2-edition__status ou2-edition__status--' + e.status} style={{marginLeft:4}}>
                      {{ recruit:'모집중', ongoing:'진행중', completed:'종료' }[e.status]}
                    </span>
                  </div>
                  <div className="ou4-edition-row__meta">
                    <span style={{fontFamily:'var(--ff-mono)'}}>{e.series_name}</span>
                    <span>{e.date}</span>
                    <span>{e.venue}</span>
                    <span>{e.teams}/{e.max}팀</span>
                  </div>
                </div>
                <div className="ou4-edition-row__cta">셋업 hub →</div>
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ========== TAB 5: OFFICERS (권한 위임 — BO3 / TU4 BT4 답습) ========== */}
      {tab === 'officers' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">권한 위임 — Series Operator 안 admin role</h2>
            <span className="oo2-section__hint">TU4 BT4 답습 — owner 만 위임 가능</span>
          </div>
          <div style={{marginBottom:10, padding:'10px 14px', background:'var(--accent-soft)', border:'1px solid var(--accent-hair)', borderRadius:'var(--r-sm)', fontSize:12.5, color:'var(--accent)', display:'flex', gap:8, alignItems:'flex-start'}}>
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, flexShrink:0}}>shield</span>
            <div style={{lineHeight:1.55, color:'var(--ink)'}}>
              <b>owner</b> = 모든 권한 (단체 보관 / 해산 포함). <b>admin</b> = 시리즈 생성 / 멤버 초대 / 회차 추가. <b>member</b> = read-only.
            </div>
          </div>
          {members.filter(m => m.role === 'admin').map(m => (
            <div key={m.id} className="tu4-officer">
              <div className="tu4-officer__head">
                <div className="tu4-row__av">{m.avatar}</div>
                <div style={{flex:1}}>
                  <div className="tu4-row__name">
                    {m.nickname}
                    <span className="org-member-role org-member-role--admin">관리자</span>
                  </div>
                  <div className="tu4-row__sub" style={{marginTop:2}}>SINCE {m.joined_at}</div>
                </div>
                <button className="btn btn--sm btn--ghost">
                  <span className="ico material-symbols-outlined">manage_accounts</span>
                  role 변경
                </button>
              </div>
              <div className="tu4-officer__perms">
                {[
                  { k:'create_series',  l:'시리즈 생성',     on:true },
                  { k:'add_edition',    l:'회차 추가',       on:true },
                  { k:'invite_members', l:'멤버 초대',       on:true },
                  { k:'edit_org',       l:'단체 정보 수정',  on: m.role === 'admin' ? (m.id === 'om-2') : false },
                  { k:'archive_org',    l:'단체 보관',       on:false },
                  { k:'transfer_owner', l:'소유권 이양',     on:false },
                ].map(p => (
                  <div key={p.k} className="tu4-officer__perm" data-on={p.on}>
                    <div className="tu4-officer__perm-toggle" data-on={p.on}></div>
                    <span className="tu4-officer__perm-lbl">{p.l}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ========== TAB 6: ACTIVITY ========== */}
      {tab === 'activity' && (
        <section className="oo2-section">
          <div className="oo2-section__head">
            <h2 className="oo2-section__h">활동 이력 — 최근 30일</h2>
            <span className="oo2-section__hint">단체 + 시리즈 + 멤버 액션 통합</span>
          </div>
          <div className="oo2-log">
            {activityLog.map(l => (
              <div key={l.id} className="oo2-log-row">
                <div className="oo2-log-row__time">{l.at}</div>
                <div>
                  <span className={'oo2-log-row__kind oo2-log-row__kind--' + l.kind}>
                    {{
                      series_create:'시리즈',
                      member_invite:'멤버',
                      tournament_complete:'대회',
                      org_edit:'단체',
                      super_admin:'운영자',
                    }[l.kind]}
                  </span>
                </div>
                <div className="oo2-log-row__body">
                  <b>{l.actor}</b> · {l.body}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
