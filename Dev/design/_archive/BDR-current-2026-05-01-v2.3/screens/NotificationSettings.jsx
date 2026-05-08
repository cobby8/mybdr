/* global React */

function NotificationSettings({ setRoute }) {
  const [settings, setSettings] = React.useState({
    push: { games:true, gamesStart:true, tournaments:true, bracket:true, teams:true, messages:true, mentions:true, friends:false, marketing:false, digest:true },
    email:{ games:false, tournaments:true, bracket:false, teams:true, messages:false, mentions:false, friends:false, marketing:false, digest:true, receipt:true },
    sms:  { payment:true, security:true, urgent:true },
    quiet: { enabled:true, start:'23:00', end:'07:00' },
    language: 'ko',
    digestDay: 'mon',
  });

  const Toggle = ({ on, onChange }) => (
    <button onClick={onChange} style={{
      width:40, height:22, borderRadius:12, border:0, cursor:'pointer',
      background: on?'var(--accent)':'var(--border)', position:'relative', transition:'.2s', flexShrink:0,
    }}>
      <div style={{width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left: on?21:3, transition:'.2s'}}/>
    </button>
  );

  const toggle = (group, key) => setSettings({ ...settings, [group]: { ...settings[group], [key]: !settings[group][key] } });

  const Row = ({ label, desc, group, k, locked, badge }) => (
    <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:10, padding:'13px 0', borderTop:'1px solid var(--border)', alignItems:'center'}}>
      <div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span style={{fontWeight:700, fontSize:13}}>{label}</span>
          {badge && <span className={`badge badge--${badge.t||'ghost'}`}>{badge.l}</span>}
        </div>
        {desc && <div style={{fontSize:11, color:'var(--ink-dim)', marginTop:2}}>{desc}</div>}
      </div>
      {locked
        ? <span style={{fontSize:11, color:'var(--ink-dim)'}}>🔒 필수</span>
        : <Toggle on={settings[group][k]} onChange={()=>toggle(group, k)}/>
      }
    </div>
  );

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('settings')} style={{cursor:'pointer'}}>설정</a><span>›</span>
        <span style={{color:'var(--ink)'}}>알림</span>
      </div>

      <div style={{marginBottom:24}}>
        <div className="eyebrow">NOTIFICATION SETTINGS · 알림 설정</div>
        <h1 style={{margin:'6px 0 0', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>알림 설정</h1>
        <p style={{margin:'4px 0 0', color:'var(--ink-mute)', fontSize:13}}>어떤 알림을 어떤 경로로 받을지 세부 조정</p>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:18, alignItems:'flex-start'}}>
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* Push */}
          <div className="card" style={{padding:'22px 24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:4}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:700}}>📱 푸시 알림</h2>
              <button className="btn btn--sm">전체 끄기</button>
            </div>
            <p style={{margin:'0 0 8px', fontSize:12, color:'var(--ink-mute)'}}>모바일 앱에서 받는 실시간 알림</p>
            <Row label="새 경기 등록" desc="관심 지역 + 내 실력대 경기" group="push" k="games"/>
            <Row label="경기 시작 1시간 전" desc="내가 신청한 경기 리마인더" group="push" k="gamesStart"/>
            <Row label="대회 접수 시작·마감" desc="BDR Challenge, 챔피언스리그 등" group="push" k="tournaments"/>
            <Row label="내 팀 대진 업데이트" desc="결과·다음 상대 알림" group="push" k="bracket"/>
            <Row label="팀 공지·활동" desc="팀장 공지, 훈련 일정" group="push" k="teams"/>
            <Row label="쪽지·채팅" group="push" k="messages"/>
            <Row label="내 게시글 멘션·댓글" group="push" k="mentions"/>
            <Row label="친구 활동" desc="팀 합류, 대회 우승 등" group="push" k="friends"/>
            <Row label="BDR 이벤트·마케팅" desc="할인, 굿즈, 프로모션" badge={{l:'선택', t:'ghost'}} group="push" k="marketing"/>
            <Row label="주간 요약" desc="매주 월요일 아침" group="push" k="digest"/>
          </div>

          {/* Email */}
          <div className="card" style={{padding:'22px 24px'}}>
            <h2 style={{margin:'0 0 4px', fontSize:16, fontWeight:700}}>📧 이메일 알림</h2>
            <p style={{margin:'0 0 8px', fontSize:12, color:'var(--ink-mute)'}}>me@example.com</p>
            <Row label="새 경기 등록" group="email" k="games"/>
            <Row label="대회 접수·결과" group="email" k="tournaments"/>
            <Row label="내 팀 대진" group="email" k="bracket"/>
            <Row label="팀 공지" group="email" k="teams"/>
            <Row label="쪽지" group="email" k="messages"/>
            <Row label="멘션·댓글" group="email" k="mentions"/>
            <Row label="친구 활동" group="email" k="friends"/>
            <Row label="BDR 뉴스레터" group="email" k="marketing"/>
            <Row label="주간 요약 리포트" desc="내 스탯·활동 요약" group="email" k="digest"/>
            <Row label="결제·영수증" desc="결제 내역, 세금계산서" badge={{l:'필수', t:'ok'}} locked group="email" k="receipt"/>
          </div>

          {/* SMS */}
          <div className="card" style={{padding:'22px 24px'}}>
            <h2 style={{margin:'0 0 4px', fontSize:16, fontWeight:700}}>💬 SMS 알림</h2>
            <p style={{margin:'0 0 8px', fontSize:12, color:'var(--ink-mute)'}}>010-****-**89 · 중요한 건만</p>
            <Row label="결제 알림" desc="결제 성공·실패" group="sms" k="payment"/>
            <Row label="보안 알림" desc="로그인·비밀번호 변경" group="sms" k="security"/>
            <Row label="긴급 공지" desc="대회 취소 등" group="sms" k="urgent"/>
          </div>

          {/* Quiet hours */}
          <div className="card" style={{padding:'22px 24px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <div>
                <h2 style={{margin:0, fontSize:16, fontWeight:700}}>🌙 방해 금지 시간</h2>
                <p style={{margin:'4px 0 0', fontSize:12, color:'var(--ink-mute)'}}>이 시간에는 모든 푸시 알림이 음소거됩니다</p>
              </div>
              <Toggle on={settings.quiet.enabled} onChange={()=>setSettings({...settings, quiet:{...settings.quiet, enabled:!settings.quiet.enabled}})}/>
            </div>
            {settings.quiet.enabled && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>시작</label>
                  <input className="input" type="time" value={settings.quiet.start} onChange={e=>setSettings({...settings, quiet:{...settings.quiet, start:e.target.value}})}/>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>종료</label>
                  <input className="input" type="time" value={settings.quiet.end} onChange={e=>setSettings({...settings, quiet:{...settings.quiet, end:e.target.value}})}/>
                </div>
              </div>
            )}
          </div>
        </div>

        <aside style={{position:'sticky', top:120, display:'flex', flexDirection:'column', gap:14}}>
          <div className="card" style={{padding:'18px 20px', background:'var(--bg-alt)'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>💡 추천 설정</div>
            <div style={{fontSize:12, lineHeight:1.7, color:'var(--ink-soft)'}}>
              <b>자주 뛰는 사람</b>이라면 푸시는 켜고 이메일은 주간 요약만, SMS는 결제·보안만. 이게 가장 피곤하지 않게 주요 정보를 받는 조합입니다.
            </div>
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:6}}>디바이스 상태</div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0'}}>
              <span>iPhone 15 · Safari</span>
              <span style={{color:'var(--ok)', fontWeight:700}}>● 허용</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0'}}>
              <span>MacBook · Chrome</span>
              <span style={{color:'var(--ok)', fontWeight:700}}>● 허용</span>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0'}}>
              <span>iPad · Safari</span>
              <span style={{color:'var(--ink-dim)'}}>○ 차단</span>
            </div>
            <button className="btn btn--sm" style={{width:'100%', marginTop:8}}>디바이스 관리</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.NotificationSettings = NotificationSettings;
