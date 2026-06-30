/* global React */
// ============================================================
// BDR v2.27 — auth-shared.jsx
// Phase 7 (온보딩·회원가입·인증) 공용. AU1~AU4 · 사용자 측만.
// shared / profile-shared 답습. AppNav 미적용 standalone.
//
// ★ Phase 12-5 IdentityVerifyButton mock 재사용 (AU2 step3 + PU2 + GU3 cross-domain).
// BA4 verified_* 컬럼 = AU4 결과 → PU2/GU3 success badge 자동.
// ============================================================

// OAuth provider 4종 (Kakao / Naver / Google / Apple)
window.OAUTH = [
  { key: 'kakao',  label: '카카오', cls: 'au-oa--kakao',  mark: 'K' },
  { key: 'naver',  label: '네이버', cls: 'au-oa--naver',  mark: 'N' },
  { key: 'google', label: 'Google', cls: 'au-oa--google', mark: 'G' },
  { key: 'apple',  label: 'Apple',  cls: 'au-oa--apple',  mark: '' },
];

// AU2 — 온보딩 step 메타
window.ONB_STEPS = [
  { key: 'basketball',  label: '농구 정보',  ico: 'sports_basketball' },
  { key: 'environment', label: '활동 환경',  ico: 'location_on' },
  { key: 'identity',    label: '본인 인증',  ico: 'verified_user' },
  { key: 'preferences', label: '선호',       ico: 'tune' },
  { key: 'setup',       label: '완료',       ico: 'check_circle' },
];
window.ONB_SKILL = [
  { v: 'beginner', l: '입문' }, { v: 'intermediate', l: '중급' },
  { v: 'advanced', l: '고급' }, { v: 'pro', l: '선출/프로' },
];
window.ONB_HAND = [{ v: 'left', l: '왼손' }, { v: 'right', l: '오른손' }, { v: 'both', l: '양손' }];
window.ONB_POSITION = ['PG', 'SG', 'SF', 'PF', 'C'];
window.ONB_CITY = ['서울', '경기', '인천', '부산', '대구', '대전', '광주'];
window.ONB_DISTRICT = ['송파구', '강남구', '강동구', '서초구', '광진구', '성동구', '마포구'];

// AU4 — 인증 결과 mock (verified_*)
window.VERIFIED = {
  name: '박수빈', phone: '010-2841-7793', birth: '1996-04-12', at: '2026-05-31',
};

// ============================================================
// Mini Components
// ============================================================

// Brand header
window.AuthBrand = function AuthBrand({ slogan = '전국 농구 매칭 플랫폼' }) {
  return (
    <div className="au-brand">
      <div className="au-brand__logo">MyBDR<span className="dot">.</span></div>
      <div className="au-brand__slogan">{slogan}</div>
    </div>
  );
};

// OAuth row (4 provider)
window.OAuthRow = function OAuthRow({ row = false }) {
  return (
    <div className={'au-oauth' + (row ? ' au-oauth--row' : '')}>
      {window.OAUTH.map(o => (
        <a key={o.key} className={'au-oa ' + o.cls} href="#" onClick={(e) => e.preventDefault()}>
          {o.key === 'apple'
            ? <span className="ico material-symbols-outlined" style={{ fontSize: 16 }}>tag</span>
            : o.key === 'google'
              ? <span className="au-oa__ico" style={{ background: 'var(--bg-head)', color: 'var(--cafe-blue-deep)' }}>{o.mark}</span>
              : <span className="au-oa__ico" style={{ background: 'rgba(0,0,0,.08)' }}>{o.mark}</span>}
          {o.label}
        </a>
      ))}
    </div>
  );
};

// Password visibility input
window.PwInput = function PwInput({ value, onChange, placeholder = '비밀번호' }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="au-input-wrap">
      <input className="au-input" type={show ? 'text' : 'password'} value={value} onChange={onChange} placeholder={placeholder} style={{ paddingRight: 40 }} />
      <button type="button" className="au-eye" onClick={() => setShow(s => !s)} aria-label="비밀번호 표시">
        <span className="ico material-symbols-outlined">{show ? 'visibility_off' : 'visibility'}</span>
      </button>
    </div>
  );
};

// Password strength meter (5단계: err→warn→ok)
window.pwStrength = function pwStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s; // 0~4
};
window.PwStrength = function PwStrength({ pw }) {
  const s = window.pwStrength(pw);
  const label = ['매우 약함', '약함', '보통', '강함', '매우 강함'][s];
  if (!pw) return null;
  return (
    <div className="au-strength" data-s={s}>
      <div className="au-strength__bars">
        {[0, 1, 2, 3].map(i => <div key={i} className={'au-strength__bar' + (i <= s - 1 ? ' is-fill' : '')}></div>)}
      </div>
      <div className="au-strength__lbl">{label}</div>
    </div>
  );
};

// Stepper (generic numbered)
window.AuStepper = function AuStepper({ steps, current }) {
  return (
    <ol className="au-stepper">
      {steps.map((st, i) => {
        const state = i < current ? 'done' : i === current ? 'on' : 'todo';
        return (
          <li key={i} className="au-sstep" data-s={state}>
            <span className="au-sstep__dot">{state === 'done' ? <span className="ico material-symbols-outlined">check</span> : i + 1}</span>
            <span className="au-sstep__lbl">{st.label || st}</span>
          </li>
        );
      })}
    </ol>
  );
};

// Chip toggle group (reuse pm-chip)
window.ChipGroup = function ChipGroup({ options, value, onChange, multi = false }) {
  const toggle = (v) => {
    if (multi) onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
    else onChange(v);
  };
  const isOn = (v) => multi ? value.includes(v) : value === v;
  return (
    <div className="au-chips">
      {options.map(opt => {
        const v = typeof opt === 'object' ? opt.v : opt;
        const l = typeof opt === 'object' ? opt.l : opt;
        return (
          <button key={v} type="button" className={'pm-chip' + (isOn(v) ? ' is-on' : '')} onClick={() => toggle(v)}>
            {isOn(v) && <span className="ico material-symbols-outlined">check</span>}{l}
          </button>
        );
      })}
    </div>
  );
};

// IdentityVerifyButton (Phase 12-5 mock · AU2 step3 / PU2 / GU3 cross-domain)
window.IdentityVerifyButton = function IdentityVerifyButton({ verified, onVerify }) {
  return (
    <div className={'au-idv' + (verified ? ' is-verified' : '')}>
      <span className="au-idv__ico"><span className="ico material-symbols-outlined">{verified ? 'verified' : 'fingerprint'}</span></span>
      <div className="au-idv__body">
        <div className="au-idv__t">{verified ? '본인 인증 완료' : '본인 인증 (실명·휴대폰)'}</div>
        <div className="au-idv__d">{verified ? window.VERIFIED.name + ' · ' + window.VERIFIED.phone : '대회 참가·매칭에 필요해요. 휴대폰으로 인증합니다.'}</div>
      </div>
      {verified
        ? <span className="gw-verify" data-ok="true"><span className="ico material-symbols-outlined">check</span>완료</span>
        : <button type="button" className="au-btn" style={{ width: 'auto', minHeight: 40, padding: '0 16px' }} onClick={onVerify}>인증하기</button>}
    </div>
  );
};
