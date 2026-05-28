/* global React, AdminShell */

// =====================================================================
// AdminSettings.jsx — Admin-D 시스템 그룹 · 시스템 설정 (v2.11)
//   진입: setRoute('adminSettings')
//   복귀: setRoute('adminDashboard')
//   에러: 없음 (설정 폼)
//
// 패턴: 4 섹션 카드 + sticky 저장 바
//   1) 사이트 기본 정보 (텍스트 입력)
//   2) 운영 정책 (라디오 + 토글)
//   3) 알림 (체크박스 그룹)
//   4) 점검 모드 (위험 영역 — 빨강 borderLeft)
// =====================================================================

const DEFAULT_SETTINGS = {
  site_name: 'MyBDR',
  site_tagline: '전국 농구 매칭 플랫폼',
  contact_email: 'help@mybdr.kr',
  default_locale: 'ko-KR',
  signup_mode: 'open',
  review_threshold: 3,
  auto_match_radius: 10,
  allow_guest_apply: true,
  notify_new_report: true,
  notify_payment_fail: true,
  notify_new_signup: false,
  notify_partner_apply: true,
  maintenance_mode: false,
  maintenance_message: '시스템 점검 중입니다. 잠시 후 다시 시도해 주세요.'
};

function AdminSettings({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = React.useState(false);
  const [savedToast, setSavedToast] = React.useState(false);

  const set = (k, v) => {
    setSettings((s) => ({ ...s, [k]: v }));
    setDirty(true);
  };

  const save = () => {
    setDirty(false);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2200);
  };

  const reset = () => {
    setSettings(DEFAULT_SETTINGS);
    setDirty(false);
  };

  const dashTopbarRight =
  <button className="admin-user" type="button">
      <div className="admin-user__avatar">DH</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>김도훈</span>
        <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
    </button>;


  return (
    <AdminShell
      route="adminSettings"
      setRoute={setRoute}
      eyebrow="ADMIN · 시스템"
      title="시스템 설정"
      subtitle="사이트 정보·운영 정책·알림·점검 모드를 관리합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '시스템' },
      { label: '시스템 설정' }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminLogs')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>list_alt</span>
            활동 로그
          </button>
        </>
      }>

      {/* 점검 모드 ON 시 상단 배너 */}
      {settings.maintenance_mode &&
      <div style={{ background: 'var(--err)', color: '#fff', padding: '10px 14px', borderRadius: 4, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, fontWeight: 600 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>warning</span>
          점검 모드 활성화됨 — 일반 사용자에게 점검 페이지가 표시됩니다.
        </div>
      }

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 240px', gap: 16, alignItems: 'flex-start' }}>
        {/* 좌 · 섹션 폼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 80 }}>
          {/* 섹션 1 — 기본 정보 */}
          <SectionCard id="sec-basic" title="사이트 기본 정보" desc="유저에게 노출되는 사이트의 기본 표현입니다." icon="badge">
            <FormRow label="사이트 이름">
              <input type="text" value={settings.site_name} onChange={(e) => set('site_name', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="태그라인" hint="홈·about·meta 에 노출">
              <input type="text" value={settings.site_tagline} onChange={(e) => set('site_tagline', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="문의 이메일">
              <input type="email" value={settings.contact_email} onChange={(e) => set('contact_email', e.target.value)} style={inputStyle} />
            </FormRow>
            <FormRow label="기본 언어">
              <select value={settings.default_locale} onChange={(e) => set('default_locale', e.target.value)} style={inputStyle}>
                <option value="ko-KR">한국어 (ko-KR)</option>
                <option value="en-US">English (en-US)</option>
                <option value="ja-JP">日本語 (ja-JP)</option>
              </select>
            </FormRow>
          </SectionCard>

          {/* 섹션 2 — 운영 정책 */}
          <SectionCard id="sec-policy" title="운영 정책" desc="가입·매칭·게스트 관련 기본 정책입니다." icon="policy">
            <FormRow label="가입 모드">
              <RadioGroup
                name="signup_mode"
                value={settings.signup_mode}
                onChange={(v) => set('signup_mode', v)}
                options={[
                { v: 'open', label: '오픈 — 누구나 가입' },
                { v: 'invite', label: '초대 — 추천 코드 필요' },
                { v: 'closed', label: '닫힘 — 신규 가입 불가' }]
                } />

            </FormRow>
            <FormRow label="신고 자동 보류" hint="동일 대상에 N건 누적 시 자동 보류">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min="1" max="20" value={settings.review_threshold} onChange={(e) => set('review_threshold', parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 80 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>건 이상</span>
              </div>
            </FormRow>
            <FormRow label="자동 매칭 반경" hint="GPS 기반 매칭 기본값">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" min="1" max="100" value={settings.auto_match_radius} onChange={(e) => set('auto_match_radius', parseInt(e.target.value, 10))} style={{ ...inputStyle, width: 80 }} />
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>km</span>
              </div>
            </FormRow>
            <FormRow label="비회원 게스트 신청">
              <Toggle on={settings.allow_guest_apply} onChange={(v) => set('allow_guest_apply', v)} hint={settings.allow_guest_apply ? '허용 — 로그인 없이 신청 가능' : '비허용 — 로그인 필수'} />
            </FormRow>
          </SectionCard>

          {/* 섹션 3 — 운영진 알림 */}
          <SectionCard id="sec-notify" title="운영진 알림" desc="운영 이벤트 발생 시 이메일·푸시 알림 채널을 설정합니다." icon="notifications">
            <CheckboxRow checked={settings.notify_new_report} onChange={(v) => set('notify_new_report', v)} label="신고 접수 알림" hint="긴급 신고 발생 시 즉시 알림" />
            <CheckboxRow checked={settings.notify_payment_fail} onChange={(v) => set('notify_payment_fail', v)} label="결제 실패 알림" hint="결제 실패 / 환불 요청 발생 시" />
            <CheckboxRow checked={settings.notify_new_signup} onChange={(v) => set('notify_new_signup', v)} label="신규 가입 알림" hint="가입 시 1회 (일일 요약 권장)" />
            <CheckboxRow checked={settings.notify_partner_apply} onChange={(v) => set('notify_partner_apply', v)} label="파트너 신청 알림" hint="협력업체 신청 접수 시" />
          </SectionCard>

          {/* 섹션 4 — 점검 모드 (위험) */}
          <SectionCard id="sec-maint" title="점검 모드" desc="활성화 시 일반 사용자에게 점검 페이지가 표시됩니다." icon="construction" danger>
            <FormRow label="점검 모드">
              <Toggle danger on={settings.maintenance_mode} onChange={(v) => set('maintenance_mode', v)} hint={settings.maintenance_mode ? '⚠ 활성 — 사용자 사이트 접근 차단' : '비활성 — 정상 운영'} />
            </FormRow>
            <FormRow label="점검 메시지" hint="점검 페이지에 노출됩니다.">
              <textarea
                value={settings.maintenance_message}
                onChange={(e) => set('maintenance_message', e.target.value)}
                rows={2}
                style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }} />

            </FormRow>
          </SectionCard>
        </div>

        {/* 우 · 섹션 ToC (sticky) */}
        <aside style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>이 페이지</div>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
              { id: 'sec-basic', label: '사이트 기본 정보' },
              { id: 'sec-policy', label: '운영 정책' },
              { id: 'sec-notify', label: '운영진 알림' },
              { id: 'sec-maint', label: '점검 모드' }].
              map((t) =>
              <a
                key={t.id}
                href={`#${t.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById(t.id);
                  if (el) el.scrollIntoView ? null : null;
                  if (el && el.getBoundingClientRect) {
                    const y = el.getBoundingClientRect().top + window.pageYOffset - 72;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                  }
                }}
                style={{
                  padding: '6px 8px',
                  fontSize: 12.5,
                  color: 'var(--ink-soft)',
                  borderRadius: 4,
                  textDecoration: 'none',
                  cursor: 'pointer'
                }}>

                  {t.label}
                </a>
              )}
            </nav>
          </div>
        </aside>
      </div>

      {/* sticky 저장 바 */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        marginTop: 16,
        marginLeft: -24,
        marginRight: -24,
        padding: '12px 24px',
        background: 'var(--bg-card)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8
      }}>
        <div style={{ fontSize: 12.5, color: dirty ? 'var(--accent)' : 'var(--ink-mute)' }}>
          {savedToast ?
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--ok)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
              저장되었습니다
            </span> :
          dirty ?
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
              저장되지 않은 변경 사항이 있습니다
            </span> :

          <span>변경 사항 없음</span>
          }
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="btn" disabled={!dirty} onClick={reset}>되돌리기</button>
          <button type="button" className="btn btn--primary" disabled={!dirty} onClick={save}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>save</span>
            저장
          </button>
        </div>
      </div>
    </AdminShell>);

}

// ─────── 부속 컴포넌트 ───────
const inputStyle = {
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 4,
  fontSize: 13.5,
  background: 'var(--bg-alt)',
  color: 'var(--ink)',
  width: '100%',
  boxSizing: 'border-box'
};

function SectionCard({ id, title, desc, icon, danger, children }) {
  return (
    <section
      id={id}
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${danger ? 'var(--err)' : 'var(--border)'}`,
        borderLeft: danger ? '3px solid var(--err)' : '1px solid var(--border)',
        borderRadius: 6,
        padding: 18
      }}>

      <header style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20, color: danger ? 'var(--err)' : 'var(--accent)' }}>{icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: danger ? 'var(--err)' : 'var(--ink)' }}>{title}</h3>
          <p style={{ margin: '2px 0 0 0', fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{desc}</p>
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {children}
      </div>
    </section>);

}

function FormRow({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, alignItems: 'flex-start' }}>
      <div style={{ paddingTop: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 2, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>);

}

function Toggle({ on, onChange, hint, danger }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        style={{
          width: 38,
          height: 22,
          padding: 2,
          background: on ? danger ? 'var(--err)' : 'var(--accent)' : 'var(--bg-alt)',
          border: '1px solid var(--border)',
          borderRadius: 11,
          cursor: 'pointer',
          position: 'relative'
        }}>

        <span style={{
          display: 'block',
          width: 16,
          height: 16,
          borderRadius: 50,
          background: '#fff',
          transform: `translateX(${on ? 16 : 0}px)`,
          transition: 'transform .12s ease'
        }} />
      </button>
      {hint && <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>{hint}</span>}
    </div>);

}

function RadioGroup({ name, value, onChange, options }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {options.map((o) =>
      <label key={o.v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
          <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} style={{ accentColor: 'var(--accent)' }} />
          <span style={{ color: 'var(--ink)' }}>{o.label}</span>
        </label>
      )}
    </div>);

}

function CheckboxRow({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: 'flex', gap: 10, padding: '10px 12px', background: 'var(--bg-alt)', borderRadius: 4, cursor: 'pointer', alignItems: 'flex-start' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--accent)', marginTop: 2 }} />
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        {hint && <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', marginTop: 2 }}>{hint}</div>}
      </div>
    </label>);

}

window.AdminSettings = AdminSettings;
