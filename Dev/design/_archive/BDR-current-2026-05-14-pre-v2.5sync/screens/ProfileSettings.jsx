/* global React, Icon */

/**
 * ProfileSettings — /profile/settings 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 7섹션 sticky nav + 우측 카드 (Settings v2.3 허브)
 *           account / feed / notify / bottomNav / billing / display / danger
 * 진입: 더보기 → 환경 설정 / Settings.jsx 에서 진입
 * 복귀: 좌측 nav 섹션 변경 (URL ?section=)
 *
 * 사용자 결정 7건 반영 (Phase A 2026-05-01):
 *  - feed = preferences 풀 흡수
 *  - profile 섹션 삭제 (편집은 /profile/edit 으로)
 *  - 9999px → 50% (정사각형 원형)
 */
function ProfileSettings({ setRoute }) {
  const [section, setSection] = React.useState('account');

  // 7섹션 정의 — 운영 정합 (resolveSection 기준)
  const SECTIONS = [
    { id:'account',   icon:'👤', label:'계정',     desc:'이메일·비밀번호·본인인증' },
    { id:'feed',      icon:'⚙️', label:'피드 설정', desc:'타임존·관심 지역·포지션' },
    { id:'notify',    icon:'🔔', label:'알림',     desc:'이메일·푸시·카카오톡' },
    { id:'bottomNav', icon:'📱', label:'바텀 네비', desc:'모바일 하단 메뉴 5개 편집' },
    { id:'billing',   icon:'💳', label:'결제',     desc:'멤버십·구독·결제 수단' },
    { id:'display',   icon:'🎨', label:'디스플레이', desc:'다크모드·언어' },
    { id:'danger',    icon:'⚠️', label:'위험 영역', desc:'계정 탈퇴' },
  ];

  return (
    <div className="page" style={{maxWidth:900, margin:'0 auto', padding:'0 16px 80px'}}>
      {/* 헤더 */}
      <div style={{marginBottom:20}}>
        <div className="eyebrow" style={{fontSize:11, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)'}}>SETTINGS · 환경 설정</div>
        <h1 style={{margin:'6px 0 2px', fontSize:28, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.015em'}}>환경 설정</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>
          계정·보안·알림·결제 등 시스템 설정. 프로필 콘텐츠 편집은 <a onClick={()=>setRoute('editProfile')} style={{color:'var(--cafe-blue)', textDecoration:'underline', cursor:'pointer'}}>프로필 편집</a>으로 이동.
        </div>
      </div>

      {/* 좌측 sticky nav + 우측 카드 (lg+ 2열, 모바일 1열) */}
      <div className="settings-grid" style={{display:'grid', gap:24, alignItems:'flex-start'}}>
        {/* 좌측 nav — lg+ sticky */}
        <nav className="settings-nav" style={{display:'flex', flexDirection:'column', gap:4}}>
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={()=>setSection(s.id)}
              className={section===s.id ? 'btn btn--primary' : 'btn btn--ghost'}
              style={{justifyContent:'flex-start', textAlign:'left', padding:'10px 14px', fontSize:13, fontWeight:section===s.id ? 700 : 500, height:'auto'}}
            >
              <span style={{marginRight:8}}>{s.icon}</span>{s.label}
            </button>
          ))}
        </nav>

        {/* 우측 카드 */}
        <div className="card" style={{padding:'24px 28px', minWidth:0}}>
          {SECTIONS.filter(s=>s.id===section).map(s => (
            <div key={s.id}>
              <h2 style={{margin:'0 0 4px', fontSize:18, fontWeight:800}}>{s.label}</h2>
              <p style={{margin:'0 0 18px', fontSize:13, color:'var(--ink-mute)'}}>{s.desc}</p>

              {/* 섹션별 mock 콘텐츠 */}
              {s.id === 'account' && (
                <div style={{display:'flex', flexDirection:'column', gap:14}}>
                  <Row label="이메일" value="snukobe@gmail.com" badge="인증됨" />
                  <Row label="이름" value="김수빈" badge="본인인증 완료" />
                  <Row label="비밀번호" value="••••••••" action="변경" />
                  <Row label="휴대폰" value="010-1234-5678" badge="인증됨" />
                </div>
              )}
              {s.id === 'feed' && (
                <div style={{display:'flex', flexDirection:'column', gap:12, fontSize:13}}>
                  <Row label="타임존" value="Asia/Seoul" />
                  <Row label="주 활동 지역" value="서울 중구, 송파구" action="편집" />
                  <Row label="포지션" value="가드 (G)" action="편집" />
                  <Row label="레벨" value="L.5" />
                </div>
              )}
              {s.id === 'notify' && (
                <div style={{display:'flex', flexDirection:'column', gap:10, fontSize:13}}>
                  <Toggle label="이메일 알림" on={true} />
                  <Toggle label="푸시 알림" on={true} />
                  <Toggle label="카카오톡 알림" on={false} />
                  <Toggle label="마케팅 정보 수신" on={false} />
                </div>
              )}
              {s.id === 'bottomNav' && (
                <div style={{fontSize:13, color:'var(--ink-mute)'}}>모바일 하단 5개 메뉴 순서를 드래그로 변경할 수 있습니다. (편집 UI mock)</div>
              )}
              {s.id === 'billing' && (
                <div style={{display:'flex', flexDirection:'column', gap:14}}>
                  <Row label="현재 플랜" value="BDR 프리미엄" badge="활성" />
                  <Row label="다음 결제" value="2026.06.08 · ₩9,900/월" />
                  <Row label="결제 수단" value="신용카드 •••• 4321" action="변경" />
                </div>
              )}
              {s.id === 'display' && (
                <div style={{display:'flex', flexDirection:'column', gap:10}}>
                  <Toggle label="다크 모드" on={true} />
                  <Row label="언어" value="한국어" action="변경" />
                </div>
              )}
              {s.id === 'danger' && (
                <div style={{padding:'14px 16px', border:'1px solid var(--err)', borderRadius:8, background:'color-mix(in srgb, var(--err) 8%, transparent)'}}>
                  <div style={{fontSize:13, fontWeight:700, color:'var(--err)', marginBottom:6}}>⚠ 계정 탈퇴</div>
                  <p style={{margin:'0 0 12px', fontSize:12, color:'var(--ink-mute)', lineHeight:1.6}}>
                    탈퇴 시 모든 데이터(매치 기록·팀 멤버십·구독)가 삭제되며 복구할 수 없습니다.
                  </p>
                  <button className="btn btn--sm" style={{borderColor:'var(--err)', color:'var(--err)'}}>계정 탈퇴 진행</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 반응형 분기 */}
      <style>{`
        .settings-grid { grid-template-columns: minmax(0, 1fr); }
        @media (min-width: 1024px) {
          .settings-grid { grid-template-columns: 220px minmax(0, 1fr); }
          .settings-nav { position: sticky; top: 80px; }
        }
      `}</style>
    </div>
  );
}

// 로컬 헬퍼 — 라벨/값 행
function Row({ label, value, badge, action }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)'}}>
      <div>
        <div style={{fontSize:11, color:'var(--ink-dim)', marginBottom:2}}>{label}</div>
        <div style={{fontSize:14, fontWeight:500}}>{value}</div>
      </div>
      <div style={{display:'flex', gap:8, alignItems:'center'}}>
        {badge && <span className="badge badge--ghost" style={{fontSize:10}}>{badge}</span>}
        {action && <button className="btn btn--ghost btn--sm">{action}</button>}
      </div>
    </div>
  );
}

// 로컬 헬퍼 — 토글 행
function Toggle({ label, on }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:'1px solid var(--border)'}}>
      <span style={{fontSize:13}}>{label}</span>
      <span style={{
        width:36, height:20, borderRadius:10,
        background: on ? 'var(--accent)' : 'var(--border)',
        position:'relative', display:'inline-block',
      }}>
        <span style={{
          position:'absolute', top:2, left: on ? 18 : 2,
          width:16, height:16, borderRadius:'50%', background:'#fff',
          transition:'left .2s',
        }}></span>
      </span>
    </div>
  );
}

window.ProfileSettings = ProfileSettings;
