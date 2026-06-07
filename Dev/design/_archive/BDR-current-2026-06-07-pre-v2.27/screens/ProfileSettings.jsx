/* global React */
// ============================================================
// BDR v2.26 — ProfileSettings (GU3 · Phase 6.3 · 보강 · BG3 ★★★★)
// 운영: /profile/settings (256 · v2.3 박제 ✅) — 7 섹션 + 좌측 sticky nav.
//
// GU3-A billing 섹션 = BU3 ProfileBilling link 활성 + 미리보기 (현재 구독)
// GU3-B bottomNav 편집기 · GU3-C danger zone (BDR Red + 2차 confirm 모달)
// GU3-D IdentityVerify 시각 강화 · GU3-E ?section= 매핑 (preferences/notify wrapper redirect 보존)
// ============================================================
function Toggle({ on, onClick }) {
  return <button className="pm-toggle" data-on={on} onClick={onClick} aria-label="토글"><span className="pm-toggle__h"></span></button>;
}

function SettingRow({ t, d, children }) {
  return (
    <div className="gw-srow">
      <div className="gw-srow__body"><div className="gw-srow__t">{t}</div>{d && <div className="gw-srow__d">{d}</div>}</div>
      {children}
    </div>
  );
}

function AccountSection() {
  const u = window.USER_ME;
  return (
    <div>
      <h2 className="gw-panel__h">계정·보안</h2>
      <p className="gw-panel__sub">이메일, 비밀번호, 본인인증을 관리합니다.</p>
      <SettingRow t="이메일" d={u.email}><button className="btn btn--sm">변경</button></SettingRow>
      <SettingRow t="비밀번호" d="마지막 변경 2026.02.10"><button className="btn btn--sm">변경</button></SettingRow>
      <SettingRow t="본인인증" d="실명·연령 인증 (대회 참가 시 필요)">
        <span className="gw-verify" data-ok="true"><span className="ico material-symbols-outlined">verified</span>인증 완료</span>
      </SettingRow>
      <SettingRow t="연결 계정" d="카카오 · 네이버 간편 로그인"><button className="btn btn--sm">관리</button></SettingRow>
    </div>
  );
}

function FeedSection() {
  const [a, setA] = React.useState(true);
  const [b, setB] = React.useState(true);
  return (
    <div>
      <h2 className="gw-panel__h">피드·선호</h2>
      <p className="gw-panel__sub">관심 지역·종별에 맞춰 홈 피드와 추천을 구성합니다. 상세 선호는 <a href="pu2-profile-edit.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>프로필 편집</a>에서.</p>
      <SettingRow t="내 지역 우선 노출" d="송파구 · 강남구 · 강동구"><Toggle on={a} onClick={() => setA(v => !v)} /></SettingRow>
      <SettingRow t="선호 종별 추천" d="오픈 · 아마추어 · 5x5"><Toggle on={b} onClick={() => setB(v => !v)} /></SettingRow>
      <SettingRow t="관심 게시판" d="팀원모집 · 정보공유"><button className="btn btn--sm">편집</button></SettingRow>
    </div>
  );
}

function NotifySection() {
  const [k, setK] = React.useState(true);
  const [e, setE] = React.useState(true);
  const [p, setP] = React.useState(false);
  return (
    <div>
      <h2 className="gw-panel__h">알림</h2>
      <p className="gw-panel__sub">경기·대회·결제 알림 수신 방법을 선택합니다.</p>
      <SettingRow t="카카오 알림톡" d="경기 확정 · 결제 · 신청 결과"><Toggle on={k} onClick={() => setK(v => !v)} /></SettingRow>
      <SettingRow t="이메일" d="주간 리포트 · 공지"><Toggle on={e} onClick={() => setE(v => !v)} /></SettingRow>
      <SettingRow t="앱 푸시" d="실시간 경기 알림"><Toggle on={p} onClick={() => setP(v => !v)} /></SettingRow>
    </div>
  );
}

const NAV_ITEMS = [
  { ico: 'home', label: '홈' }, { ico: 'sports_basketball', label: '경기' },
  { ico: 'emoji_events', label: '대회' }, { ico: 'groups', label: '팀' }, { ico: 'person', label: '마이' },
];
function BottomNavSection() {
  return (
    <div>
      <h2 className="gw-panel__h">하단 메뉴</h2>
      <p className="gw-panel__sub">모바일 하단 빠른 메뉴를 편집합니다. 드래그로 순서를 바꿀 수 있어요.</p>
      <div className="gw-navedit">
        {NAV_ITEMS.map((it, i) => (
          <div key={i} className="gw-navedit__item">
            <span className="gw-navedit__grip ico material-symbols-outlined">drag_indicator</span>
            <span className="gw-navedit__ico ico material-symbols-outlined">{it.ico}</span>
            <span className="gw-navedit__t">{it.label}</span>
            <Toggle on={true} onClick={() => {}} />
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingSection() {
  const s = window.MY_SUBSCRIPTION;
  return (
    <div>
      <h2 className="gw-panel__h">결제·구독</h2>
      <p className="gw-panel__sub">현재 멤버십과 결제 수단을 확인합니다.</p>
      {/* GU3-A — BU3 link 활성 + 미리보기 */}
      <div className="gw-billing" style={{ marginBottom: 14 }}>
        <span className="gw-billing__ico"><span className="ico material-symbols-outlined">workspace_premium</span></span>
        <div className="gw-billing__body">
          <div className="gw-billing__plan">{s.plan_name}</div>
          <div className="gw-billing__meta">{window.wonRaw(s.price)}/월 · 다음 결제 {window.dateK(s.next_billing).slice(0, 10)}</div>
        </div>
      </div>
      <SettingRow t="결제 수단" d={s.method_brand + ' •••• ' + s.method_last4}><button className="btn btn--sm">변경</button></SettingRow>
      <div style={{ marginTop: 16 }}>
        <a className="btn btn--primary" href="bu3-profile-billing.html" style={{ width: '100%' }}><span className="ico material-symbols-outlined">credit_card</span>결제·구독 관리</a>
      </div>
    </div>
  );
}

function DisplaySection() {
  const [dark, setDark] = React.useState(true);
  return (
    <div>
      <h2 className="gw-panel__h">화면·테마</h2>
      <p className="gw-panel__sub">테마와 글자 크기를 설정합니다.</p>
      <SettingRow t="다크 모드" d="시스템 기본 따름 해제 시 수동"><Toggle on={dark} onClick={() => setDark(v => !v)} /></SettingRow>
      <SettingRow t="글자 크기" d="보통">
        <select className="pm-select" style={{ width: 120 }}><option>작게</option><option selected>보통</option><option>크게</option></select>
      </SettingRow>
    </div>
  );
}

function DangerSection({ onDelete }) {
  return (
    <div>
      <h2 className="gw-panel__h">계정 삭제</h2>
      <p className="gw-panel__sub">계정을 영구 삭제합니다. 되돌릴 수 없어요.</p>
      <div className="gw-danger">
        <div className="gw-danger__bar"><span className="ico material-symbols-outlined">warning</span><span className="gw-danger__bar-t">위험 구역</span></div>
        <div className="gw-danger__body">
          <p className="gw-danger__d">계정을 삭제하면 경기·팀·대회 기록, 결제 내역, 활동 데이터가 모두 영구 삭제됩니다. 진행 중인 구독이 있으면 먼저 해지해 주세요.</p>
          <button className="gw-danger__btn" onClick={onDelete}><span className="ico material-symbols-outlined">delete_forever</span>계정 삭제</button>
        </div>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const [section, setSection] = React.useState('account');
  const [delOpen, setDelOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const secs = window.SETTINGS_SECTIONS;

  const renderSection = () => {
    switch (section) {
      case 'account': return <AccountSection />;
      case 'feed': return <FeedSection />;
      case 'notify': return <NotifySection />;
      case 'bottomNav': return <BottomNavSection />;
      case 'billing': return <BillingSection />;
      case 'display': return <DisplaySection />;
      case 'danger': return <DangerSection onDelete={() => { setDelOpen(true); setReason(''); }} />;
      default: return null;
    }
  };

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <window.PageBackBilling />
        <div className="eyebrow" style={{ marginBottom: 6 }}>SETTINGS · 환경 설정</div>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--ink)' }}>환경 설정</h1>
        <div style={{ fontSize: 13, color: 'var(--ink-mute)', marginBottom: 18 }}>계정·보안·알림·결제 등 시스템 설정. 프로필 콘텐츠 편집은 <a href="pu2-profile-edit.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>프로필 편집</a>에서.</div>

        {/* mobile section tabs */}
        <div className="gw-stabs">
          {secs.map(s => (
            <button key={s.key} className={'gw-stab' + (section === s.key ? ' is-on' : '')} onClick={() => setSection(s.key)} style={s.danger ? { color: section === s.key ? undefined : 'var(--accent)' } : {}}>
              <span className="ico material-symbols-outlined">{s.ico}</span>{s.label}
            </button>
          ))}
        </div>

        <div className="gw-settings">
          {/* 좌측 sticky nav */}
          <nav className="gw-snav">
            {secs.map(s => (
              <button key={s.key} className={'gw-snav__item' + (section === s.key ? ' is-on' : '')} data-danger={s.danger ? 'true' : 'false'} onClick={() => setSection(s.key)}>
                <span className="gw-snav__ico"><span className="ico material-symbols-outlined">{s.ico}</span></span>
                <span className="gw-snav__body"><span className="gw-snav__t">{s.label}</span><span className="gw-snav__d">{s.desc}</span></span>
              </button>
            ))}
          </nav>

          {/* 우측 패널 */}
          <div className="gw-panel">{renderSection()}</div>
        </div>
      </div>

      {/* GU3-C — 계정 삭제 2차 confirm 모달 (BDR Red) */}
      {delOpen && (
        <div className="bl-modal-stage" onClick={() => setDelOpen(false)}>
          <div className="bl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>delete_forever</span>계정을 삭제할까요?</h3>
              <button className="bl-modal__close" onClick={() => setDelOpen(false)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="gw-ph" style={{ background: 'var(--accent-soft)', borderColor: 'var(--accent-hair)', marginBottom: 16 }}>
                <span className="gw-ph__ico ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>error</span>
                <div className="gw-ph__body">
                  <div className="gw-ph__t" style={{ color: 'var(--accent-deep)' }}>되돌릴 수 없습니다</div>
                  <div className="gw-ph__d" style={{ color: 'var(--accent-deep)' }}>경기·팀·대회·결제 기록이 모두 영구 삭제됩니다.</div>
                </div>
              </div>
              <div className="pm-field" style={{ marginBottom: 12 }}>
                <label className="pm-field__l">삭제 사유 (선택)</label>
                <select className="pm-select"><option>이용하지 않아요</option><option>다른 서비스를 사용해요</option><option>개인정보가 걱정돼요</option><option>기타</option></select>
              </div>
              <div className="pm-field" style={{ marginBottom: 0 }}>
                <label className="pm-field__l">확인을 위해 <strong style={{ color: 'var(--accent)' }}>삭제합니다</strong>를 입력하세요</label>
                <input className="pm-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="삭제합니다" />
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setDelOpen(false)}>취소</button>
              <button className="btn btn-reject" disabled={reason !== '삭제합니다'} style={reason !== '삭제합니다' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}><span className="ico material-symbols-outlined">delete_forever</span>영구 삭제</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.ProfileSettings = ProfileSettings;
