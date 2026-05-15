/* global React, Icon */

/**
 * OrgApply — /organizations/apply 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 일반 유저가 단체 신청 (pending) → 관리자 승인 (approved)
 *           시리즈/대회 체계 운영 권한 획득
 * 진입: /organizations 빈 상태 / 더보기
 * 복귀: 신청 완료 → 홈으로 / 승인 시 /organizations/[slug]
 */
function OrgApply({ setRoute }) {
  // mock 폼 state
  const [form, setForm] = React.useState({
    name: '',
    description: '',
    region: '',
    contactEmail: '',
    websiteUrl: '',
    applyNote: '',
  });
  const [success, setSuccess] = React.useState(false);

  function update(k, v) { setForm(f => ({...f, [k]:v})); }

  // 신청 완료 화면
  if (success) {
    return (
      <div className="page" style={{maxWidth:520, margin:'0 auto', padding:'80px 20px', textAlign:'center'}}>
        <div style={{
          width:80, height:80, borderRadius:'50%', display:'grid', placeItems:'center',
          background:'color-mix(in srgb, var(--ok) 12%, transparent)',
          margin:'0 auto 18px', fontSize:36, color:'var(--ok)',
        }}>✓</div>
        <h1 style={{margin:'0 0 8px', fontSize:22, fontWeight:800, fontFamily:'var(--ff-display)'}}>신청이 완료되었습니다</h1>
        <p style={{margin:'0 0 20px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6}}>
          관리자 검토 후 승인되면 알림으로 알려드리겠습니다.<br/>보통 1~2일 내에 처리됩니다.
        </p>
        <button className="btn btn--primary" onClick={()=>setRoute('home')}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <div className="page" style={{maxWidth:520, margin:'0 auto', padding:'24px 20px 80px'}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('orgs')} style={{cursor:'pointer'}}>단체</a><span>›</span>
        <span style={{color:'var(--ink)'}}>단체 신청</span>
      </div>

      {/* 헤더 */}
      <div style={{marginBottom:20}}>
        <div className="eyebrow" style={{fontSize:11, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)'}}>ORGANIZATION · 신청</div>
        <h1 style={{margin:'6px 0 2px', fontSize:24, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>단체 신청</h1>
        <p style={{margin:0, fontSize:13, color:'var(--ink-mute)'}}>
          단체를 등록하면 시리즈와 대회를 체계적으로 관리할 수 있습니다.
        </p>
      </div>

      {/* 폼 카드 */}
      <div className="card" style={{padding:'24px 24px'}}>
        <form onSubmit={(e)=>{e.preventDefault(); setSuccess(true);}} style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* 단체 이름 (필수) */}
          <Field label="단체 이름" required>
            <input type="text" value={form.name} onChange={e=>update('name', e.target.value)} placeholder="예: 서울 농구 연합" required style={inputStyle} />
          </Field>

          {/* 단체 소개 */}
          <Field label="단체 소개">
            <textarea value={form.description} onChange={e=>update('description', e.target.value)} placeholder="활동 내용·목적을 간단히" rows={3} style={{...inputStyle, height:'auto', padding:'10px 12px', resize:'vertical'}} />
          </Field>

          {/* 활동 지역 */}
          <Field label="활동 지역">
            <input type="text" value={form.region} onChange={e=>update('region', e.target.value)} placeholder="예: 서울, 경기" style={inputStyle} />
          </Field>

          {/* 연락 이메일 */}
          <Field label="연락 이메일">
            <input type="email" value={form.contactEmail} onChange={e=>update('contactEmail', e.target.value)} placeholder="contact@example.com" style={inputStyle} />
          </Field>

          {/* 웹사이트 */}
          <Field label="웹사이트">
            <input type="text" inputMode="url" value={form.websiteUrl} onChange={e=>update('websiteUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
          </Field>

          {/* 신청 메모 */}
          <Field label="신청 메모">
            <textarea value={form.applyNote} onChange={e=>update('applyNote', e.target.value)} placeholder="등록 목적·관리자 전달 사항" rows={2} style={{...inputStyle, height:'auto', padding:'10px 12px', resize:'vertical'}} />
          </Field>

          {/* 제출 */}
          <button type="submit" className="btn btn--primary" disabled={!form.name.trim()} style={{marginTop:8, height:44, fontSize:14, fontWeight:700}}>
            단체 신청
          </button>
        </form>
      </div>

      {/* 안내 */}
      <p style={{marginTop:16, fontSize:11, color:'var(--ink-dim)', lineHeight:1.6, textAlign:'center'}}>
        승인된 단체는 시리즈를 만들고, 시리즈 산하 대회 회차를 운영할 수 있습니다.
      </p>
    </div>
  );
}

// 인라인 스타일 — 시안 토큰
const inputStyle = {
  width:'100%', height:38, padding:'0 12px', fontSize:13,
  border:'1px solid var(--border)', borderRadius:4,
  background:'var(--surface)', color:'var(--ink)',
  fontFamily:'inherit',
};

// 라벨 + children 래퍼
function Field({ label, required, children }) {
  return (
    <label style={{display:'flex', flexDirection:'column', gap:6}}>
      <span style={{fontSize:12, fontWeight:600, color:'var(--ink)'}}>
        {label}{required && <span style={{color:'var(--err)', marginLeft:3}}>*</span>}
      </span>
      {children}
    </label>
  );
}

window.OrgApply = OrgApply;
