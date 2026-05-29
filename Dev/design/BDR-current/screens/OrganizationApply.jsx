/* global React */
// ============================================================
// BDR v2.22 — OrganizationApply (OU3 · Phase 4B · 신규 · BO1)
// 운영 박제 대상: /organizations/apply (Phase 1A PA3 답습 단순화)
// 진입: OU1 우상단 "단체 등록" CTA
// 복귀: 제출 → "1-2일 검토 안내" 화면 → 홈
// 에러: 단체명 빈값 시 step 1 차단 / 거절 시 OA1 알림 발송
//
// 신규 박제 (운영 230 line 단일 form → 5-step 마법사):
//   STEP 1 — 단체 기본 (이름 + slug 자동)
//   STEP 2 — 활동 지역 + 공개 여부
//   STEP 3 — 연락 정보 (이메일 + 웹사이트)
//   STEP 4 — 신청 메모 (운영자 검토용)
//   STEP 5 — 검토 + 제출
//   → 성공 화면 (organizations.status='pending' 박제)
// A 등급
// ============================================================

const STEPS = [
  { id: 1, key: 'basic',   lbl: '단체 기본',  ico: 'apartment' },
  { id: 2, key: 'region',  lbl: '지역 · 공개', ico: 'place' },
  { id: 3, key: 'contact', lbl: '연락',       ico: 'contact_mail' },
  { id: 4, key: 'note',    lbl: '검토 메모',   ico: 'edit_note' },
  { id: 5, key: 'review',  lbl: '검토 · 제출', ico: 'check_circle' },
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주', '전국'];

function OrganizationApply({ initialStep = 2, success = false }) {
  const [step, setStep] = React.useState(initialStep);
  const [form, setForm] = React.useState({
    name: '송파농구연맹',
    slug: 'songpa-bba',
    description: '송파 동호회 연합. 평일 야간 리그 운영.',
    region: '서울',
    is_public: true,
    contact_email: 'songpa-bba@example.kr',
    website_url: '',
    apply_note: '송파 지역 동호회 5팀 연합. 6월 첫 리그 개막 예정.',
  });

  // Success state
  if (success) {
    return (
      <div className="ou3-page">
        <div className="ou3-success">
          <div className="ou3-success__icon material-symbols-outlined">check_circle</div>
          <h2 className="ou3-success__h">신청이 완료되었습니다</h2>
          <p className="ou3-success__sub">
            <b style={{color:'var(--ink)'}}>송파농구연맹</b> 등록 신청 접수 완료.<br/>
            사이트 운영자(Site Operator) 검토 후 승인 결과를 <b style={{color:'var(--ink)'}}>{form.contact_email}</b> + 카카오톡 알림으로 알려드립니다.<br/>
            보통 <b style={{color:'var(--ink)'}}>1-2일</b> 내에 처리됩니다.
          </p>
          <div className="ou3-success__cta">
            <a className="btn" href="ou1-organizations.html">
              <span className="ico material-symbols-outlined">arrow_back</span>
              단체 목록
            </a>
            <a className="btn btn--primary" href="index.html">
              홈으로 돌아가기
            </a>
          </div>
          <div style={{marginTop:22, padding:'12px 14px', background:'var(--cafe-blue-soft)', border:'1px solid var(--cafe-blue-hair)', borderRadius:'var(--r-sm)', textAlign:'left', fontSize:12, color:'var(--cafe-blue-deep)', display:'flex', gap:10, alignItems:'flex-start', maxWidth:520, margin:'22px auto 0'}}>
            <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:18, flexShrink:0}}>schedule</span>
            <div style={{lineHeight:1.6}}>
              <b>승인 후</b>: 자동으로 organizations.status = approved. 단체 페이지가 공개되고 시리즈를 만들 수 있습니다.<br/>
              <b>거절 시</b>: 거절 사유와 함께 안내됩니다. 보완 후 재신청 가능.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = STEPS.find(s => s.id === step);
  const setF = (k, v) => setForm({...form, [k]: v});
  const slugify = (name) => name.toLowerCase().replace(/[^a-z0-9가-힣ㄱ-ㅎ]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return (
    <div className="ou3-page">
      <header className="ou3-head">
        <div className="eyebrow">단체 등록 · ORGANIZATIONS / APPLY</div>
        <h1 className="ou3-head__title">단체를 등록합니다</h1>
        <p className="ou3-head__sub">
          5단계로 단체 정보를 입력하면 사이트 운영자 검토 후 승인됩니다 (1-2일 소요).
        </p>
      </header>

      {/* Step indicator */}
      <div className="ou3-steps">
        {STEPS.map(s => (
          <div key={s.id} className="ou3-step"
            data-active={s.id === step}
            data-done={s.id < step}>
            <div className="ou3-step__num">{s.id < step ? '✓' : s.id}</div>
            <div className="ou3-step__lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Step card */}
      <div className="ou3-card">
        <h2 className="ou3-card__h">
          <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', verticalAlign:'-4px', marginRight:6, fontSize:22, color:'var(--accent)'}}>{cur.ico}</span>
          STEP {step} · {cur.lbl}
        </h2>

        {step === 1 && (
          <>
            <div className="ou3-card__sub">단체 이름과 URL slug 를 입력합니다. slug 는 비워두면 이름으로부터 자동 생성됩니다.</div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">단체 이름<span className="ou3-field__lbl-req">*</span></label>
              <input className="ou3-input"
                value={form.name}
                onChange={e=>{ setF('name', e.target.value); setF('slug', slugify(e.target.value) || form.slug); }}
                placeholder="송파농구연맹"/>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">URL Slug <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택 · 자동)</span></label>
              <input className="ou3-input"
                value={form.slug}
                onChange={e=>setF('slug', e.target.value)}
                placeholder="songpa-bba"/>
              <div className="ou3-help">공개 페이지 URL: <b style={{color:'var(--ink)'}}>mybdr.kr/organizations/{form.slug || 'slug'}</b></div>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">한 줄 소개 <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택)</span></label>
              <textarea className="ou3-textarea"
                value={form.description}
                onChange={e=>setF('description', e.target.value)}
                placeholder="송파 지역 동호회 5팀 연합"/>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="ou3-card__sub">활동 지역을 선택하고 단체 페이지 공개 여부를 결정합니다.</div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">활동 지역<span className="ou3-field__lbl-req">*</span></label>
              <div className="ou3-region-grid">
                {REGIONS.map(r => (
                  <div key={r}
                    className={'ou3-region' + (form.region === r ? ' is-on' : '')}
                    onClick={()=>setF('region', r)}>
                    {r}
                  </div>
                ))}
              </div>
              <div className="ou3-help">필요 시 단체 페이지 안 "활동 지역" 에서 상세 구·동 추가 가능</div>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">단체 페이지 공개</label>
              <div style={{display:'flex', gap:8}}>
                <label className={'ou3-region' + (form.is_public ? ' is-on' : '')} style={{flex:1, padding:'12px 8px', cursor:'pointer'}}
                  onClick={()=>setF('is_public', true)}>
                  <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, marginRight:4, verticalAlign:'-3px'}}>visibility</span>
                  공개
                </label>
                <label className={'ou3-region' + (!form.is_public ? ' is-on' : '')} style={{flex:1, padding:'12px 8px', cursor:'pointer'}}
                  onClick={()=>setF('is_public', false)}>
                  <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, marginRight:4, verticalAlign:'-3px'}}>visibility_off</span>
                  비공개
                </label>
              </div>
              <div className="ou3-help">비공개 시 단체 페이지가 검색되지 않습니다. 추후 변경 가능.</div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="ou3-card__sub">단체 운영자 연락 정보. 사이트 운영자 검토 + 향후 사용자 문의용으로 사용됩니다.</div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">연락 이메일<span className="ou3-field__lbl-req">*</span></label>
              <input className="ou3-input" type="email"
                value={form.contact_email}
                onChange={e=>setF('contact_email', e.target.value)}
                placeholder="contact@example.kr"/>
              <div className="ou3-help">검토 결과 / 승인 알림이 이 이메일로 발송됩니다</div>
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">웹사이트 <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택)</span></label>
              <input className="ou3-input" inputMode="url"
                value={form.website_url}
                onChange={e=>setF('website_url', e.target.value)}
                placeholder="https://..."/>
              <div className="ou3-help">단체 홈페이지 / SNS 링크 (있다면)</div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="ou3-card__sub">사이트 운영자 검토용 메모. 단체 활동 내용, 운영 계획, 참고할 점을 자유롭게 작성하세요.</div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">검토 메모 <span style={{color:'var(--ink-dim)', fontSize:9.5}}>(선택 · 공개 X)</span></label>
              <textarea className="ou3-textarea"
                style={{minHeight: 140}}
                value={form.apply_note}
                onChange={e=>setF('apply_note', e.target.value)}
                placeholder="단체 활동 내용 / 운영 계획 / 기존 대회 이력"/>
              <div className="ou3-help">이 메모는 사이트 운영자만 볼 수 있습니다. 단체 페이지에 노출되지 않음.</div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="ou3-card__sub">입력 내용을 확인하고 제출합니다. 제출 후 사이트 운영자 검토를 거쳐 승인됩니다.</div>
            <div className="ou3-review">
              <div className="ou3-review__row">
                <span className="ou3-review__l">단체 이름</span>
                <span className="ou3-review__v"><b>{form.name}</b></span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">Slug</span>
                <span className="ou3-review__v" style={{fontFamily:'var(--ff-mono)', fontSize:12}}>/{form.slug}</span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">소개</span>
                <span className={'ou3-review__v' + (!form.description ? ' ou3-review__v--empty' : '')}>
                  {form.description || '미입력'}
                </span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">활동 지역</span>
                <span className="ou3-review__v">{form.region}</span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">공개</span>
                <span className="ou3-review__v">{form.is_public ? '공개' : '비공개'}</span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">연락 이메일</span>
                <span className="ou3-review__v" style={{fontFamily:'var(--ff-mono)', fontSize:12}}>{form.contact_email}</span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">웹사이트</span>
                <span className={'ou3-review__v' + (!form.website_url ? ' ou3-review__v--empty' : '')}>
                  {form.website_url || '미입력'}
                </span>
              </div>
              <div className="ou3-review__row">
                <span className="ou3-review__l">검토 메모</span>
                <span className={'ou3-review__v' + (!form.apply_note ? ' ou3-review__v--empty' : '')}>
                  {form.apply_note || '미입력'}
                </span>
              </div>
            </div>
            <div style={{padding:'10px 12px', background:'var(--warn-soft)', border:'1px solid var(--warn-hair)', borderRadius:'var(--r-sm)', fontSize:12, color:'#8B5A0F', display:'flex', gap:8}}>
              <span className="ico material-symbols-outlined" style={{fontFamily:'Material Symbols Outlined', fontSize:16, flexShrink:0}}>info</span>
              <div style={{lineHeight:1.55}}>제출 후 status=<b>pending</b> 으로 박제됩니다. 단체 페이지는 승인 전까지 공개되지 않으며, 시리즈 / 회차 생성도 차단됩니다.</div>
            </div>
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
            <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)', fontWeight:700}}>
              {step}/5 단계
            </span>
            {step < 5 && (
              <button className="btn btn--primary"
                onClick={()=>setStep(Math.min(5, step + 1))}
                disabled={step === 1 && !form.name.trim()}>
                다음
                <span className="ico material-symbols-outlined">arrow_forward</span>
              </button>
            )}
            {step === 5 && (
              <button className="btn btn--primary">
                <span className="ico material-symbols-outlined">send</span>
                신청 제출
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.OrganizationApply = OrganizationApply;
