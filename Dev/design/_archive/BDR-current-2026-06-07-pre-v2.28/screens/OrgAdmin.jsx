/* global React */
// ============================================================
// BDR v2.22 — OrgAdminList + New (OO1 · Phase 4A · 신규 · BO3)
// 운영 박제 대상: /tournament-admin/organizations + /new
// 진입: 단체 운영자 (Series Operator) AppNav "단체 운영" 진입점
// 복귀: 카드 클릭 → OO2 (단체 대시보드) · "새 단체 만들기" → /new
// 에러: 빈 상태 = "아직 소속된 단체가 없습니다"
//
// 신규 박제 (운영 224 line OO1 + 219 line OO1b):
//   PAGE 1 — list (/tournament-admin/organizations)
//     · 본인 소속 단체 카드 (role: owner/admin/member)
//     · "새 단체 만들기" CTA (DB 직접 생성 — OU3 신청과 다름, super-admin role 보유 시만)
//     · 보관된 단체 분리 섹션 (status === archived)
//   PAGE 2 — new form (/tournament-admin/organizations/new)
//     · 단체명 + slug + 소개 + 지역 + 로고 URL + 연락 + 웹사이트
//     · OU3 신청 form 동일 필드 (BO3 다리)
//
// 본 시안은 Series Operator (단체 운영자) 영역 — AdminShell ❌, ops-shell ✅
// E 등급
// ============================================================

// PAGE 1 — list
window.OrgAdminList = function OrgAdminList() {
  // 본인 소속 단체 (my_role 있는 것)
  const myOrgs = window.ORG_LIST.filter(o => o.my_role);
  const activeOrgs = myOrgs.filter(o => o.status !== 'archived');
  const archivedOrgs = myOrgs.filter(o => o.status === 'archived');

  return (
    <div>
      <div className="oo1-head">
        <h1 className="oo1-head__title">
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:24, color:'var(--accent)'}}>apartment</span>
          내 단체
        </h1>
        <a className="ou1-head__cta" href="oo1-orgadmin-list.html#new">
          <span className="ico material-symbols-outlined">add</span>
          새 단체 만들기
        </a>
      </div>

      {/* 활성 단체 */}
      {activeOrgs.length > 0 && (
        <div className="oo1-grid">
          {activeOrgs.map(o => (
            <window.OrgCard key={o.id} org={o} variant="admin"/>
          ))}
        </div>
      )}

      {/* 보관된 단체 */}
      {archivedOrgs.length > 0 && (
        <div style={{marginTop: 28}}>
          <div className="ou1-reco-section__head">
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, color:'var(--ink-mute)'}}>inventory_2</span>
            <h2 className="ou1-reco-section__h" style={{color:'var(--ink-mute)'}}>보관된 단체 ({archivedOrgs.length})</h2>
          </div>
          <div className="oo1-grid" style={{opacity: 0.7}}>
            {archivedOrgs.map(o => (
              <window.OrgCard key={o.id} org={o} variant="admin"/>
            ))}
          </div>
        </div>
      )}

      {/* 빈 상태 */}
      {myOrgs.length === 0 && (
        <div className="oo1-empty">
          <div className="oo1-empty__icon material-symbols-outlined">corporate_fare</div>
          <h2 style={{fontFamily:'var(--ff-display)', fontSize:18, fontWeight:800, margin:'0 0 6px'}}>아직 소속된 단체가 없습니다</h2>
          <p style={{fontSize:13, color:'var(--ink-mute)', margin:'0 0 18px'}}>단체를 만들거나 다른 단체 운영자에게 초대를 요청하세요.</p>
          <div style={{display:'flex', gap:8, justifyContent:'center'}}>
            <a className="btn btn--primary" href="oo1-orgadmin-list.html#new">단체 만들기</a>
            <a className="btn" href="ou1-organizations.html">단체 목록 보기</a>
          </div>
        </div>
      )}

      {/* About */}
      <div style={{
        marginTop: 24,
        padding: '14px 18px',
        background: 'var(--bg-elev)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--cafe-blue)',
        borderRadius: 'var(--r-sm)',
        display: 'flex', gap: 12, alignItems: 'flex-start',
        fontSize: 12.5,
      }}>
        <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, color:'var(--cafe-blue-deep)', flexShrink:0}}>info</span>
        <div style={{color:'var(--ink-soft)', lineHeight:1.55}}>
          <b style={{color:'var(--ink)'}}>단체 운영자 (Series Operator)</b>는 단체 내 시리즈와 회차를 만들 수 있습니다. 일반 사용자가 단체를 만들려면 <a href="ou3-organization-apply.html" style={{color:'var(--cafe-blue-deep)', textDecoration:'underline'}}>/organizations/apply</a> 에서 신청 (1-2일 검토). 사이트 운영자 (Site Operator) 권한이 있는 경우만 본 페이지에서 직접 생성 가능.
        </div>
      </div>
    </div>
  );
};

// PAGE 2 — new form (DB 직접 생성)
window.OrgAdminNew = function OrgAdminNew() {
  const [form, setForm] = React.useState({
    name: '', slug: '', description: '', region: '',
    logo_url: '', contact_email: '', website_url: '',
  });
  const setF = (k, v) => setForm({...form, [k]: v});

  return (
    <div>
      <div className="oo1-head">
        <div>
          <a href="oo1-orgadmin-list.html" style={{display:'inline-flex', alignItems:'center', gap:4, fontSize:11.5, color:'var(--ink-mute)', textDecoration:'none', fontFamily:'var(--ff-mono)', fontWeight:700, marginBottom:4}}>
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:14}}>arrow_back</span>
            내 단체로 돌아가기
          </a>
          <h1 className="oo1-head__title" style={{marginTop:4}}>새 단체 만들기</h1>
        </div>
      </div>

      <div className="oo1-new">
        <div style={{marginBottom:14, padding:'10px 12px', background:'var(--warn-soft)', border:'1px solid var(--warn-hair)', borderRadius:'var(--r-sm)', fontSize:12, color:'#8B5A0F', display:'flex', gap:8}}>
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, flexShrink:0}}>shield</span>
          <div style={{lineHeight:1.55}}>
            본 페이지는 <b>Site Operator 권한</b>이 있는 경우만 사용 가능. 일반 사용자는 <a href="ou3-organization-apply.html" style={{color:'#8B5A0F', textDecoration:'underline', fontWeight:800}}>/organizations/apply</a> 에서 신청 (검토 후 승인).
          </div>
        </div>

        <div className="ou3-field">
          <label className="ou3-field__lbl">단체 이름<span className="ou3-field__lbl-req">*</span></label>
          <input className="ou3-input" value={form.name} onChange={e=>setF('name', e.target.value)} placeholder="강남구농구협회"/>
        </div>
        <div className="ou3-field">
          <label className="ou3-field__lbl">URL Slug <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택 · 자동)</span></label>
          <input className="ou3-input" value={form.slug} onChange={e=>setF('slug', e.target.value)} placeholder="gangnam-bba"/>
          <div className="ou3-help">영문 / 숫자 / 하이픈만 사용. 공개 페이지 URL에 사용.</div>
        </div>
        <div className="ou3-field">
          <label className="ou3-field__lbl">소개</label>
          <textarea className="ou3-textarea" value={form.description} onChange={e=>setF('description', e.target.value)} placeholder="단체를 소개해주세요"/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          <div className="ou3-field">
            <label className="ou3-field__lbl">활동 지역</label>
            <select className="ou3-select" value={form.region} onChange={e=>setF('region', e.target.value)}>
              <option value="">선택 안함</option>
              {['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '전국'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <div className="ou3-field">
            <label className="ou3-field__lbl">로고 URL</label>
            <input className="ou3-input" value={form.logo_url} onChange={e=>setF('logo_url', e.target.value)} placeholder="https://..."/>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          <div className="ou3-field">
            <label className="ou3-field__lbl">연락 이메일</label>
            <input className="ou3-input" type="email" value={form.contact_email} onChange={e=>setF('contact_email', e.target.value)} placeholder="contact@example.kr"/>
          </div>
          <div className="ou3-field">
            <label className="ou3-field__lbl">웹사이트</label>
            <input className="ou3-input" value={form.website_url} onChange={e=>setF('website_url', e.target.value)} placeholder="https://..."/>
          </div>
        </div>

        <div className="ou3-foot">
          <a className="btn" href="oo1-orgadmin-list.html">취소</a>
          <button className="btn btn--primary">
            <span className="ico material-symbols-outlined">save</span>
            단체 만들기
          </button>
        </div>
      </div>
    </div>
  );
};
