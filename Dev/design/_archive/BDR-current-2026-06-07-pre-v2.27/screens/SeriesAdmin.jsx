/* global React */
// ============================================================
// BDR v2.22 — SeriesAdmin (OO3 · Phase 4A · 신규 · BO4)
// 운영 박제 대상: /tournament-admin/series/*
//   /series                       — 시리즈 list (본인 권한)
//   /series/new                   — 3-step 마법사 (PA3 답습 단순화)
//   /series/[id]                  — 시리즈 detail · 회차 list + "+ N회 추가" CTA
//   /series/[id]/edit             — 편집 form (new 와 동일 필드)
//   /series/[id]/add-edition      — 회차 추가 (date / venue / maxTeams) — 모달 형태
// 진입: OO1 단체 카드 → OO2 series tab → "시리즈 hub" / OO1 sidebar "시리즈"
// 복귀: 시리즈 생성 → /series/[id] / 회차 추가 → /tournaments/[id]/setup
// 에러: 빈 회차 = "첫 번째 회차 추가하기"
//
// PA3 답습 3-step (단순화):
//   STEP 1 — 시리즈 기본 (이름 + 소속 단체)
//   STEP 2 — 설명 + 로고 + 정기성
//   STEP 3 — 검토 + 첫 회차 모달 trigger
// E 등급 (Series Operator only — Site Operator badge ❌)
// ============================================================

// PAGE 1 — Series LIST
window.SeriesAdminList = function SeriesAdminList() {
  const series = window.SERIES_LIST;  // 본인 권한 시리즈 전체

  return (
    <div>
      <div className="oo1-head">
        <h1 className="oo1-head__title">
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:24, color:'var(--accent)'}}>collections_bookmark</span>
          내 시리즈
          <span style={{fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:700, color:'var(--ink-mute)', marginLeft:6}}>
            {series.length}개
          </span>
        </h1>
        <a className="ou1-head__cta" href="oo3-series-admin.html#new">
          <span className="ico material-symbols-outlined">add</span>
          새 시리즈 만들기
        </a>
      </div>

      <div className="oo3-list">
        {series.map(s => (
          <a key={s.id} className="oo3-list-row" href="oo3-series-admin.html#detail">
            <div className="oo3-list-row__num" style={{background: s.color}}>{s.logo}</div>
            <div className="oo3-list-row__body">
              <div className="oo3-list-row__name">{s.name}</div>
              <div className="oo3-list-row__sub">
                {s.org_name} · 설립 {s.founded_year} · 누적 {s.teams_total}팀
              </div>
            </div>
            <div className="oo3-list-row__count">
              <b>{s.tournaments_count}</b>
              회 진행
            </div>
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:20, color:'var(--ink-dim)'}}>chevron_right</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// PAGE 2 — New (3-step PA3 답습)
window.SeriesAdminNew = function SeriesAdminNew({ initialStep = 1 }) {
  const [step, setStep] = React.useState(initialStep);
  const [form, setForm] = React.useState({
    name: 'BDR 가을 슈터즈컵',
    org_id: 'org-2',  // BDR 운영팀
    description: '동절기 슈팅 정확도 중심 단판 토너먼트',
    logo: 'S', color: '#0F5FCC',
    periodicity: 'quarterly',
    create_first_edition: true,
  });
  const setF = (k, v) => setForm({...form, [k]: v});
  const orgs = window.ORG_LIST.filter(o => o.my_role === 'owner' || o.my_role === 'admin');

  return (
    <div className="oo3-wizard">
      <div style={{marginBottom:6}}>
        <a href="oo3-series-admin.html" style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--ink-mute)', textDecoration:'none', fontFamily:'var(--ff-mono)', fontWeight:700}}>
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:14}}>arrow_back</span>
          시리즈 목록
        </a>
      </div>
      <h1 className="oo1-head__title" style={{marginBottom:12}}>새 시리즈 만들기</h1>

      {/* 3-step indicator (PA3 답습 — 단순화) */}
      <div className="oo3-wizard__steps">
        {[
          { id: 1, l: '기본' },
          { id: 2, l: '설명 · 로고' },
          { id: 3, l: '검토 · 첫 회차' },
        ].map(s => (
          <div key={s.id} className="oo3-wizard__step"
            data-active={s.id === step}
            data-done={s.id < step}>
            {s.id < step ? '✓ ' : s.id + '. '}{s.l}
          </div>
        ))}
      </div>

      {step === 1 && (
        <>
          <h2 className="ou3-card__h">STEP 1 · 시리즈 기본 정보</h2>
          <p className="ou3-card__sub">시리즈 이름과 소속 단체를 지정합니다. 단체 미연결 = 개인 시리즈 (운영팀 직접 관리).</p>
          <div className="ou3-field">
            <label className="ou3-field__lbl">시리즈 이름<span className="ou3-field__lbl-req">*</span></label>
            <input className="ou3-input" value={form.name} onChange={e=>setF('name', e.target.value)} placeholder="BDR 서울 올스타전"/>
            <div className="ou3-help">URL: <b style={{color:'var(--ink)'}}>mybdr.kr/series/bdr-seoul-allstar-xxxxx</b></div>
          </div>
          <div className="ou3-field">
            <label className="ou3-field__lbl">소속 단체 <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택)</span></label>
            <select className="ou3-select" value={form.org_id} onChange={e=>setF('org_id', e.target.value)}>
              <option value="">단체 미연결 (개인 시리즈)</option>
              {orgs.map(o => (
                <option key={o.id} value={o.id}>{o.name} ({o.my_role === 'owner' ? '소유자' : '운영자'})</option>
              ))}
            </select>
            <div className="ou3-help">owner / admin 권한 단체만 노출 — member 는 시리즈 생성 불가</div>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="ou3-card__h">STEP 2 · 설명 / 로고 / 정기성</h2>
          <p className="ou3-card__sub">시리즈 페이지에 노출되는 정보입니다. 모두 추후 수정 가능.</p>
          <div className="ou3-field">
            <label className="ou3-field__lbl">한 줄 설명</label>
            <input className="ou3-input" value={form.description} onChange={e=>setF('description', e.target.value)} placeholder="매분기 진행되는 BDR 정기 대회"/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
            <div className="ou3-field">
              <label className="ou3-field__lbl">로고 (한 글자)</label>
              <div style={{display:'flex', gap:10, alignItems:'center'}}>
                <input className="ou3-input" value={form.logo} onChange={e=>setF('logo', e.target.value.slice(0, 2))} maxLength={2} style={{flex:1}}/>
                <div className="ou3-region-grid" style={{display:'inline-grid', gridTemplateColumns:'repeat(6, 28px)', gap:2, margin:0}}>
                  {['☀','❄','🌸','🍂','3','5','S','컵'].map(l => (
                    <div key={l} onClick={()=>setF('logo', l)}
                      className={'ou3-region' + (form.logo === l ? ' is-on' : '')}
                      style={{padding:'4px 0', fontSize:13, height:28}}>{l}</div>
                  ))}
                </div>
              </div>
              <div className="ou3-help">시리즈 카드 · spotlight 의 컬러 박스에 표시</div>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">테마 색상</label>
              <div style={{display:'flex', gap:6, alignItems:'center'}}>
                <input type="color" value={form.color} onChange={e=>setF('color', e.target.value)} style={{width:48, height:38, border:'1px solid var(--border)', borderRadius:'var(--r-sm)', background:'transparent', cursor:'pointer'}}/>
                <input className="ou3-input" value={form.color} onChange={e=>setF('color', e.target.value)} style={{flex:1, fontFamily:'var(--ff-mono)'}}/>
              </div>
            </div>
          </div>
          <div className="ou3-field">
            <label className="ou3-field__lbl">정기성</label>
            <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
              {[
                { v: 'quarterly', l: '분기 (3개월)' },
                { v: 'biannual',  l: '반기 (6개월)' },
                { v: 'annual',    l: '연간' },
                { v: 'irregular', l: '비정기' },
              ].map(p => (
                <button key={p.v}
                  className={'tu1-filter__chip' + (form.periodicity === p.v ? ' is-on' : '')}
                  onClick={()=>setF('periodicity', p.v)}>
                  {p.l}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <h2 className="ou3-card__h">STEP 3 · 검토 · 첫 회차 만들기</h2>
          <p className="ou3-card__sub">시리즈를 만들고 곧바로 첫 회차(1회)도 추가할 수 있습니다.</p>
          <div className="ou3-review">
            <div className="ou3-review__row">
              <span className="ou3-review__l">이름</span>
              <span className="ou3-review__v"><b>{form.name}</b></span>
            </div>
            <div className="ou3-review__row">
              <span className="ou3-review__l">소속 단체</span>
              <span className="ou3-review__v">
                {form.org_id ? orgs.find(o => o.id === form.org_id)?.name : '단체 미연결 (개인 시리즈)'}
              </span>
            </div>
            <div className="ou3-review__row">
              <span className="ou3-review__l">설명</span>
              <span className={'ou3-review__v' + (!form.description ? ' ou3-review__v--empty' : '')}>{form.description || '미입력'}</span>
            </div>
            <div className="ou3-review__row">
              <span className="ou3-review__l">로고 · 색상</span>
              <span className="ou3-review__v">
                <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
                  <span style={{width:24, height:24, background:form.color, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-xs)', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:11}}>{form.logo}</span>
                  <span style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{form.color}</span>
                </span>
              </span>
            </div>
            <div className="ou3-review__row">
              <span className="ou3-review__l">정기성</span>
              <span className="ou3-review__v">
                {{ quarterly: '분기 (3개월)', biannual: '반기 (6개월)', annual: '연간', irregular: '비정기' }[form.periodicity]}
              </span>
            </div>
          </div>
          <label style={{display:'flex', gap:8, alignItems:'flex-start', padding:'11px 14px', background:'var(--cafe-blue-soft)', border:'1px solid var(--cafe-blue-hair)', borderRadius:'var(--r-sm)', cursor:'pointer'}}>
            <input type="checkbox" checked={form.create_first_edition} onChange={e=>setF('create_first_edition', e.target.checked)} style={{marginTop:2, accentColor:'var(--cafe-blue)'}}/>
            <div>
              <strong style={{color:'var(--cafe-blue-deep)', fontSize:13}}>첫 회차 (1회)도 같이 만들기</strong>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-mute)', marginTop:2, lineHeight:1.5}}>
                생성 후 add-edition 모달이 열립니다 (date · venue · maxTeams)
              </div>
            </div>
          </label>
        </>
      )}

      <div className="ou3-foot">
        <button className="btn"
          onClick={()=>setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          style={{opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer'}}>
          <span className="ico material-symbols-outlined">arrow_back</span>
          이전
        </button>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)', fontWeight:700}}>{step}/3 단계</span>
          {step < 3 && (
            <button className="btn btn--primary" onClick={()=>setStep(step + 1)}>
              다음
              <span className="ico material-symbols-outlined">arrow_forward</span>
            </button>
          )}
          {step === 3 && (
            <button className="btn btn--primary">
              <span className="ico material-symbols-outlined">save</span>
              시리즈 만들기
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// PAGE 3 — Series DETAIL (admin) + add-edition modal
window.SeriesAdminDetail = function SeriesAdminDetail({ showAddEdition = false }) {
  const s = window.SERIES_LIST[0];  // BDR 서머 오픈
  const editions = [
    { id: 'ed-4', edition: 4, name: s.name + ' #4', date: '2026-06-15', venue: '장충체육관', status: 'recruit',   teams: 18, max: 32 },
    { id: 'ed-3', edition: 3, name: s.name + ' #3', date: '2025-06-20', venue: '장충체육관', status: 'completed', teams: 32, max: 32 },
    { id: 'ed-2', edition: 2, name: s.name + ' #2', date: '2024-07-15', venue: '잠실학생체육관', status: 'completed', teams: 28, max: 32 },
    { id: 'ed-1', edition: 1, name: s.name + ' #1', date: '2023-06-25', venue: '장충체육관', status: 'completed', teams: 24, max: 32 },
  ];
  const nextEdition = s.tournaments_count + 1;
  const totalTeams = editions.reduce((sum, e) => sum + e.teams, 0);

  return (
    <div>
      <div style={{marginBottom:6}}>
        <a href="oo3-series-admin.html" style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--ink-mute)', textDecoration:'none', fontFamily:'var(--ff-mono)', fontWeight:700}}>
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:14}}>arrow_back</span>
          시리즈 목록
        </a>
      </div>

      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, marginBottom:18}}>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <div style={{width:56, height:56, background:s.color, color:'#fff', display:'inline-flex', alignItems:'center', justifyContent:'center', borderRadius:'var(--r-md)', fontFamily:'var(--ff-display)', fontWeight:900, fontSize:24}}>{s.logo}</div>
          <div>
            <h1 className="oo1-head__title" style={{margin:'0 0 4px'}}>{s.name}</h1>
            <div style={{fontSize:12.5, color:'var(--ink-mute)'}}>{s.description}</div>
          </div>
        </div>
        <div style={{display:'flex', gap:6}}>
          <button className="btn btn--sm">
            <span className="ico material-symbols-outlined">edit</span>
            편집
          </button>
          <button className="btn btn--sm">
            <span className="ico material-symbols-outlined">link</span>
            공유
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:18}}>
        <div className="ou2-card" style={{textAlign:'center', padding:'16px'}}>
          <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--ink)'}}>{s.tournaments_count}</div>
          <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:4}}>총 회차</div>
        </div>
        <div className="ou2-card" style={{textAlign:'center', padding:'16px'}}>
          <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--ink)'}}>{totalTeams}</div>
          <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-mute)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:4}}>누적 참가팀</div>
        </div>
        <div className="ou2-card" style={{textAlign:'center', padding:'16px', background:'var(--accent-soft)', borderColor:'var(--accent-hair)'}}>
          <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--accent)'}}>{nextEdition}회</div>
          <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--accent)', letterSpacing:'0.06em', textTransform:'uppercase', marginTop:4}}>다음 회차</div>
        </div>
      </div>

      {/* Editions list */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
        <h2 style={{fontFamily:'var(--ff-display)', fontSize:16, fontWeight:800, letterSpacing:'-0.005em', margin:0}}>회차 목록</h2>
        <button className="btn btn--primary btn--sm">
          <span className="ico material-symbols-outlined">add</span>
          {nextEdition}회 추가
        </button>
      </div>
      <div className="ou4-editions">
        {editions.map(e => (
          <a key={e.id} className="ou4-edition-row" href="ud3-admin-setup.html">
            <div className={'ou4-edition-row__num' + (e.status === 'recruit' ? ' ou4-edition-row__num--cur' : '')}>
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
                <span>{e.date}</span>
                <span>{e.venue}</span>
                <span>{e.teams}/{e.max}팀</span>
              </div>
            </div>
            <div className="ou4-edition-row__cta">셋업 hub →</div>
          </a>
        ))}
      </div>

      {/* add-edition modal (inline stage) */}
      {showAddEdition && (
        <section className="oa1-modal-stage" style={{marginTop:18, background:'rgba(15, 23, 42, 0.4)', padding:24}}>
          <div className="oo3-add-edition">
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14}}>
              <h3 style={{fontFamily:'var(--ff-display)', fontSize:17, fontWeight:800, margin:0}}>새 회차 추가 — <span style={{color:'var(--accent)'}}>{nextEdition}회</span></h3>
              <button className="oa1-modal__close" aria-label="닫기" style={{background:'var(--bg-head)'}}>
                <span className="ico material-symbols-outlined" style={{color:'var(--ink-mute)'}}>close</span>
              </button>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">대회 날짜<span className="ou3-field__lbl-req">*</span></label>
              <input className="ou3-input" type="date" defaultValue="2026-09-12"/>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">장소 <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택)</span></label>
              <input className="ou3-input" defaultValue="장충체육관" placeholder="예: 강남구민체육센터"/>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">최대 참가 팀 수</label>
              <input className="ou3-input" type="number" defaultValue={32} min={2} max={64}/>
              <div className="ou3-help">기본값 8팀, 최대 64팀</div>
            </div>
            <div className="ou3-foot">
              <button className="btn">취소</button>
              <button className="btn btn--primary">
                <span className="ico material-symbols-outlined">add</span>
                회차 추가하기
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
