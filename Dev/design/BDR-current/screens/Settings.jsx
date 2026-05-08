/* global React, Icon, ThemeSwitch, SettingsToggle */

// ============================================================
// Phase D — Settings (환경 설정)
//
// 6 섹션 (의뢰서 정합):
//   1. 알림 (notify) — 이메일/푸시/카테고리별
//   2. 디스플레이 (display) — 다크모드 듀얼/단일 ThemeSwitch / 글자 크기 / 언어
//   3. 프라이버시 (privacy) — 검색·기록·DM 공개 범위
//   4. 안전·차단 (safety) — 차단 사용자, 신고 이력
//   5. 결제 (billing) — 멤버십, 결제수단, 영수증
//   6. 탈퇴 (danger) — 데이터 내보내기, 비활성화, 삭제
//
// 룰: var(--*) 토큰만 / SettingsToggle 사용 / 03 §2 ThemeSwitch 정합
// ============================================================

const { useState: useStateS } = React;

function Settings({ setRoute, theme, setTheme }) {
  const [section, setSection] = useStateS('notify');

  const sections = [
    { id: 'notify',  label: '알림',         sub: '이메일·푸시' },
    { id: 'display', label: '디스플레이',   sub: '테마·글자' },
    { id: 'privacy', label: '프라이버시',   sub: '공개 범위' },
    { id: 'safety',  label: '안전·차단',    sub: '차단·신고' },
    { id: 'billing', label: '결제·멤버십',  sub: 'BDR+ 구독' },
    { id: 'danger',  label: '탈퇴',         sub: '데이터·삭제' },
  ];

  return (
    <div className="page settings">
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>설정</span>
      </div>

      {/* Hero */}
      <header style={{marginBottom:20}}>
        <div className="eyebrow">SETTINGS</div>
        <h1 style={{margin:'4px 0 2px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1)', fontWeight:800, letterSpacing:'-0.015em'}}>
          환경 설정
        </h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>
          알림, 공개 범위, 결제 정보를 관리합니다
        </div>
      </header>

      <div className="settings__split" style={{
        display:'grid', gridTemplateColumns:'220px minmax(0, 1fr)',
        gap:20, alignItems:'flex-start',
      }}>
        {/* 좌측 nav */}
        <aside className="settings__nav" style={{
          position:'sticky', top:120,
          display:'flex', flexDirection:'column', gap:2,
        }}>
          {sections.map(s => (
            <button key={s.id} onClick={()=>setSection(s.id)} style={{
              textAlign:'left', padding:'12px 14px', minHeight:44,
              background: section === s.id ? 'var(--bg-alt)' : 'transparent',
              border: 0,
              borderLeft: section === s.id ? '3px solid var(--accent)' : '3px solid transparent',
              cursor:'pointer',
            }}>
              <div style={{
                fontSize:13, fontWeight: section === s.id ? 700 : 500,
                color: section === s.id ? 'var(--ink)' : 'var(--ink-soft)',
              }}>{s.label}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:1}}>{s.sub}</div>
            </button>
          ))}
        </aside>

        {/* 우측 본문 */}
        <div className="card" style={{padding:'24px 28px'}}>
          {section === 'notify'  && <NotifySection/>}
          {section === 'display' && <DisplaySection theme={theme} setTheme={setTheme}/>}
          {section === 'privacy' && <PrivacySection/>}
          {section === 'safety'  && <SafetySection/>}
          {section === 'billing' && <BillingSection setRoute={setRoute}/>}
          {section === 'danger'  && <DangerSection/>}
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .settings__split { grid-template-columns: 1fr !important; }
          .settings__nav { position: static !important; flex-direction: row !important; overflow-x: auto; gap: 4px !important; padding-bottom: 4px; }
          .settings__nav button { white-space: nowrap; border-left: 0 !important; border-bottom: 2px solid transparent; min-width: max-content; }
          .settings__nav button[style*="3px solid var(--accent)"] { border-left: 0 !important; border-bottom: 2px solid var(--accent) !important; }
        }
      `}</style>
    </div>
  );
}

// ============================================================
// 1. 알림
// ============================================================
function NotifySection() {
  return (
    <div>
      <SH title="알림 설정" desc="받을 알림 종류를 선택하세요"/>

      <SubHead>채널</SubHead>
      <SettingsToggle label="이메일 알림" desc="주요 알림을 이메일로 받음" defaultChecked/>
      <SettingsToggle label="푸시 알림" desc="모바일 앱 푸시" defaultChecked/>
      <SettingsToggle label="SMS 알림" desc="긴급 알림만 SMS로 발송"/>

      <SubHead style={{marginTop:24}}>경기·대회</SubHead>
      <SettingsToggle label="경기 신청 승인/거절" defaultChecked/>
      <SettingsToggle label="경기 시작 30분 전 리마인더" defaultChecked/>
      <SettingsToggle label="대회 접수 마감 D-3 알림" defaultChecked/>
      <SettingsToggle label="추천 게스트 모집글" desc="내 포지션·지역에 맞는 모집글" defaultChecked/>

      <SubHead style={{marginTop:24}}>커뮤니티</SubHead>
      <SettingsToggle label="댓글·답글" defaultChecked/>
      <SettingsToggle label="멘션·태그" defaultChecked/>
      <SettingsToggle label="좋아요"/>
      <SettingsToggle label="쪽지 수신" defaultChecked/>
      <SettingsToggle label="팀 소식" desc="소속 팀의 새 글·일정" defaultChecked/>

      <SubHead style={{marginTop:24}}>기타</SubHead>
      <SettingsToggle label="이벤트·프로모션" desc="신규 기능, 할인 이벤트"/>
      <SettingsToggle label="설문 참여 요청"/>
    </div>
  );
}

// ============================================================
// 2. 디스플레이 — 03 §2 ThemeSwitch 정합 (PC 듀얼 / 모바일 단일)
// ============================================================
function DisplaySection({ theme, setTheme }) {
  const [fontSize, setFontSize] = useStateS('regular');
  const [density, setDensity] = useStateS('comfort');
  const [lang, setLang] = useStateS('ko');

  return (
    <div>
      <SH title="디스플레이" desc="테마, 글자 크기, 언어를 변경합니다"/>

      <SubHead>테마</SubHead>
      <div style={{
        padding:'16px 0', borderBottom:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap',
      }}>
        <div style={{minWidth:0}}>
          <div style={{fontWeight:600, fontSize:14}}>다크 모드</div>
          <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>
            데스크톱은 듀얼 라벨, 모바일은 단일 아이콘으로 표시됩니다
          </div>
        </div>
        {/* 03 §2 frozen ThemeSwitch — PC 듀얼 / 모바일 단일 */}
        {theme && setTheme
          ? <ThemeSwitch theme={theme} setTheme={setTheme}/>
          : <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
              헤더 토글 동기화
            </span>
        }
      </div>

      <SubHead style={{marginTop:24}}>글자 크기</SubHead>
      <div style={{padding:'14px 0', borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
          {[
            { v:'small',   l:'작게',   px:'14px' },
            { v:'regular', l:'보통',   px:'16px' },
            { v:'large',   l:'크게',   px:'18px' },
            { v:'xlarge',  l:'아주 크게', px:'20px' },
          ].map(o => {
            const on = fontSize === o.v;
            return (
              <button key={o.v} onClick={()=>setFontSize(o.v)} style={{
                padding:'10px 14px', minHeight:44,
                background: on ? 'var(--accent)' : 'transparent',
                color: on ? '#fff' : 'var(--ink-soft)',
                border:`1px solid ${on ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius:6, cursor:'pointer',
                fontWeight: on ? 700 : 500,
              }}>
                <div style={{fontSize:13}}>{o.l}</div>
                <div style={{fontSize:10, opacity:.7, fontFamily:'var(--ff-mono)', marginTop:1}}>{o.px}</div>
              </button>
            );
          })}
        </div>
      </div>

      <SubHead style={{marginTop:24}}>밀도</SubHead>
      <div style={{padding:'14px 0', borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex', gap:6}}>
          {[
            { v:'compact', l:'컴팩트' },
            { v:'comfort', l:'기본' },
            { v:'spacious', l:'여유' },
          ].map(o => {
            const on = density === o.v;
            return (
              <button key={o.v} onClick={()=>setDensity(o.v)} style={{
                flex:1, padding:'12px 16px', minHeight:44,
                background: on ? 'var(--cafe-blue-soft)' : 'transparent',
                color: on ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                border:`1px solid ${on ? 'var(--cafe-blue-hair)' : 'var(--border)'}`,
                borderRadius:6, cursor:'pointer',
                fontSize:13, fontWeight: on ? 700 : 500,
              }}>
                {o.l}
              </button>
            );
          })}
        </div>
      </div>

      <SubHead style={{marginTop:24}}>언어</SubHead>
      <div style={{padding:'14px 0'}}>
        <select className="input" value={lang} onChange={e=>setLang(e.target.value)}
          style={{fontSize:16, minHeight:44, maxWidth:280}}>
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
      </div>
    </div>
  );
}

// ============================================================
// 3. 프라이버시
// ============================================================
function PrivacySection() {
  return (
    <div>
      <SH title="프라이버시" desc="프로필·활동 정보의 공개 범위를 설정합니다"/>

      <SubHead>프로필 공개</SubHead>
      <SettingsToggle label="닉네임 검색 허용" desc="다른 사용자가 닉네임으로 나를 검색할 수 있음" defaultChecked/>
      <SettingsToggle label="프로필 페이지 공개" desc="비로그인 사용자도 프로필 열람 가능" defaultChecked/>
      <SettingsToggle label="활동 지역 표시" desc="시·구 단위까지" defaultChecked/>
      <SettingsToggle label="신장·체중 표시"/>
      <SettingsToggle label="실명 표시" desc="소속팀 페이지에 한정"/>

      <SubHead style={{marginTop:24}}>기록·이력</SubHead>
      <SettingsToggle label="경기 기록 공개" desc="다른 사용자가 스탯·전적 열람" defaultChecked/>
      <SettingsToggle label="활동 타임라인 공개" desc="최근 참여한 경기·대회 노출"/>
      <SettingsToggle label="매너 평가 공개" desc="받은 리뷰 평균과 개별 코멘트" defaultChecked/>

      <SubHead style={{marginTop:24}}>대화·연결</SubHead>
      <SettingsToggle label="DM 수신 허용" desc="모르는 사용자에게도 쪽지 받기" defaultChecked/>
      <SettingsToggle label="팔로우 알림 공개" desc="누가 나를 팔로우했는지 표시"/>
      <SettingsToggle label="온라인 상태 표시" desc="지금 접속 중인지 다른 사용자에게 보이기" defaultChecked/>
    </div>
  );
}

// ============================================================
// 4. 안전·차단
// ============================================================
function SafetySection() {
  const blocked = [
    { id:'u1', name:'농구초보2023', date:'2026-03-15', reason:'반복 도배' },
    { id:'u2', name:'monkey_pgr', date:'2026-02-08', reason:'욕설·비방' },
    { id:'u3', name:'guest_999',   date:'2026-01-22', reason:'노쇼' },
  ];
  const reports = [
    { id:'r1', target:'스팸봇_***', date:'2026-04-02', status:'처리완료', reason:'홍보 도배' },
    { id:'r2', target:'rude_user1', date:'2026-03-28', status:'검토중',   reason:'비방·욕설' },
  ];

  return (
    <div>
      <SH title="안전·차단" desc="차단한 사용자와 신고 이력을 관리합니다"/>

      <SubHead>자동 보호</SubHead>
      <SettingsToggle label="모르는 사용자 쪽지 자동 보관함" desc="친구가 아닌 사용자의 쪽지를 별도 폴더에 보관" defaultChecked/>
      <SettingsToggle label="비속어 자동 가리기" desc="댓글·게시글의 비속어를 *로 표시" defaultChecked/>
      <SettingsToggle label="스팸 의심 게시글 숨김" defaultChecked/>

      <SubHead style={{marginTop:24}}>차단한 사용자 ({blocked.length})</SubHead>
      <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:8}}>
        {blocked.map(u => (
          <div key={u.id} style={{
            display:'grid', gridTemplateColumns:'1fr auto', gap:10,
            padding:'12px 14px', minHeight:44, alignItems:'center',
            background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6,
          }}>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:600, fontSize:13}}>{u.name}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                {u.date} · {u.reason}
              </div>
            </div>
            <button className="btn btn--sm" style={{minHeight:36}}>차단 해제</button>
          </div>
        ))}
      </div>

      <SubHead style={{marginTop:24}}>신고 이력 ({reports.length})</SubHead>
      <div style={{display:'flex', flexDirection:'column', gap:6, marginTop:8}}>
        {reports.map(r => (
          <div key={r.id} style={{
            display:'grid', gridTemplateColumns:'1fr auto', gap:10,
            padding:'12px 14px', alignItems:'center',
            background:'var(--bg-alt)', border:'1px solid var(--border)', borderRadius:6,
          }}>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:600, fontSize:13}}>{r.target}</div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>
                {r.date} · {r.reason}
              </div>
            </div>
            <span style={{
              fontSize:11, fontWeight:700, padding:'4px 10px',
              background: r.status === '처리완료'
                ? 'color-mix(in oklab, var(--ok) 14%, transparent)'
                : 'color-mix(in oklab, var(--cafe-blue) 14%, transparent)',
              color: r.status === '처리완료' ? 'var(--ok)' : 'var(--cafe-blue-deep)',
              borderRadius:'var(--radius-chip)',
            }}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 5. 결제·멤버십
// ============================================================
function BillingSection({ setRoute }) {
  return (
    <div>
      <SH title="결제·멤버십" desc="현재 구독 중인 플랜과 결제 정보"/>

      {/* BDR+ 카드 */}
      <div style={{
        padding:'18px 20px',
        background:'linear-gradient(135deg, var(--cafe-blue), var(--cafe-blue-deep))',
        color:'#fff', borderRadius:6, marginBottom:18,
      }}>
        <div style={{fontSize:11, letterSpacing:'.1em', fontWeight:800, opacity:.9}}>현재 플랜</div>
        <div style={{fontFamily:'var(--ff-display)', fontSize:26, fontWeight:900, margin:'4px 0'}}>BDR+</div>
        <div style={{fontSize:13, opacity:.9}}>₩4,900/월 · 다음 결제 2026.05.20</div>
        <div style={{display:'flex', gap:6, marginTop:14}}>
          <button className="btn btn--sm" onClick={()=>setRoute('pricing')}
            style={{background:'rgba(255,255,255,.18)', color:'#fff', borderColor:'rgba(255,255,255,.32)'}}>
            플랜 변경
          </button>
          <button className="btn btn--sm"
            style={{background:'transparent', color:'#fff', borderColor:'rgba(255,255,255,.28)'}}>
            구독 취소
          </button>
        </div>
      </div>

      <SubHead>결제수단</SubHead>
      <BRow label="기본 결제수단" value="카드 **** 8822 (현대)" action="변경"/>
      <BRow label="추가 결제수단" value="등록되지 않음" action="추가"/>
      <BRow label="자동 결제" value="활성 · 매월 20일" action="관리"/>

      <SubHead style={{marginTop:24}}>영수증·세금계산서</SubHead>
      <BRow label="결제 내역" value="최근 12개월" action="보기"/>
      <BRow label="현금영수증" value="자동 발급 (010-****-**89)" action="설정"/>
      <BRow label="세금계산서" value="사업자 미등록" action="등록"/>

      <SubHead style={{marginTop:24}}>알림</SubHead>
      <SettingsToggle label="결제 성공 알림" defaultChecked/>
      <SettingsToggle label="결제 실패·만료 알림" defaultChecked/>
      <SettingsToggle label="갱신 D-3 리마인더" defaultChecked/>
    </div>
  );
}

function BRow({ label, value, action }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'14px 0', borderBottom:'1px solid var(--border)', gap:12, flexWrap:'wrap',
    }}>
      <div style={{minWidth:0}}>
        <div style={{fontWeight:600, fontSize:14}}>{label}</div>
        <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{value}</div>
      </div>
      <button className="btn btn--sm" style={{minHeight:36}}>{action}</button>
    </div>
  );
}

// ============================================================
// 6. 탈퇴
// ============================================================
function DangerSection() {
  return (
    <div>
      <SH title="탈퇴" desc="신중히 결정하세요 — 일부 작업은 되돌릴 수 없습니다"/>

      <div style={{
        padding:'16px 18px', borderRadius:6, marginBottom:10,
        border:'1px solid var(--border)', background:'var(--bg-alt)',
      }}>
        <div style={{fontWeight:700, fontSize:14, marginBottom:4}}>데이터 내보내기</div>
        <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          프로필·경기 기록·게시물 전체를 ZIP 파일로 받기 (3일 이내 발송)
        </div>
        <button className="btn btn--sm" style={{minHeight:44}}>요청하기</button>
      </div>

      <div style={{
        padding:'16px 18px', borderRadius:6, marginBottom:10,
        border:'1px solid var(--border)', background:'var(--bg-alt)',
      }}>
        <div style={{fontWeight:700, fontSize:14, marginBottom:4}}>계정 비활성화</div>
        <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          30일간 숨김 처리 · 다시 로그인하면 자동 복구됩니다
        </div>
        <button className="btn btn--sm" style={{minHeight:44}}>비활성화</button>
      </div>

      <div style={{
        padding:'16px 18px', borderRadius:6,
        border:'1px solid var(--accent)',
        background:'color-mix(in oklab, var(--accent) 6%, transparent)',
      }}>
        <div style={{fontWeight:700, fontSize:14, marginBottom:4, color:'var(--accent)'}}>
          ⚠ 계정 삭제 (영구)
        </div>
        <div style={{fontSize:12, color:'var(--ink-soft)', marginBottom:12, lineHeight:1.6}}>
          모든 데이터가 영구 삭제되며 복구할 수 없습니다.<br/>
          진행 중인 대회 참가 / BDR+ 구독은 자동 취소됩니다.
        </div>
        <button className="btn btn--sm" style={{
          minHeight:44, background:'var(--accent)', color:'#fff', borderColor:'var(--accent)',
        }}>
          계정 삭제
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 공통
// ============================================================
function SH({ title, desc }) {
  return (
    <div style={{marginBottom:18}}>
      <h2 style={{margin:0, fontSize:18, fontWeight:700, letterSpacing:'-0.01em'}}>{title}</h2>
      {desc && <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4}}>{desc}</div>}
    </div>
  );
}

function SubHead({ children, style }) {
  return (
    <div style={{
      fontSize:11, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase',
      color:'var(--ink-dim)', marginBottom:4, paddingBottom:6,
      borderBottom:'1px solid var(--border)',
      ...style,
    }}>
      {children}
    </div>
  );
}

window.Settings = Settings;
