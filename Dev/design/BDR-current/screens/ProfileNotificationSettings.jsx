/* global React, SettingsToggle, SettingsRow */

// ============================================================
// ProfileNotificationSettings — /profile/notification-settings (Phase F2)
//
// 푸시 / 이메일 채널 + 알림 카테고리 (경기 / 대회 / 메시지 / 시스템) 토글
// 알림 시간대 (오전/오후) DnD — 우선순위 정렬
// SettingsToggle / SettingsRow 재사용
// ============================================================

const { useState: useStatePNS } = React;

function ProfileNotificationSettings({ setRoute }) {
  // 카테고리별 채널 매트릭스
  const [matrix, setMatrix] = useStatePNS({
    game:    { push: true,  email: true,  inapp: true  },
    series:  { push: true,  email: false, inapp: true  },
    message: { push: true,  email: false, inapp: true  },
    system:  { push: false, email: true,  inapp: true  },
  });

  // 채널 마스터 토글
  const [push, setPush]     = useStatePNS(true);
  const [email, setEmail]   = useStatePNS(true);
  const [quiet, setQuiet]   = useStatePNS(true);

  // 알림 시간대 (DnD 우선순위)
  const [slots, setSlots] = useStatePNS([
    { id: 'morning', label: '오전 (06:00–12:00)', desc: '출근 전 빠른 요약' },
    { id: 'noon',    label: '점심 (12:00–14:00)', desc: '점심 알림 묶음' },
    { id: 'evening', label: '저녁 (18:00–22:00)', desc: '경기 임박 알림' },
    { id: 'night',   label: '야간 (22:00–06:00)', desc: '긴급만 (방해 금지)' },
  ]);
  const [drag, setDrag] = useStatePNS(null);

  const cats = [
    { id: 'game',    label: '경기',     desc: '신청 승인·리마인더·시작 30분 전' },
    { id: 'series',  label: '대회',     desc: '접수 마감·대진표·결과' },
    { id: 'message', label: '메시지',   desc: '쪽지·댓글·멘션·팀 소식' },
    { id: 'system',  label: '시스템',   desc: '결제·보안·공지' },
  ];

  const setMatrixVal = (cat, ch, val) => {
    setMatrix(prev => ({ ...prev, [cat]: { ...prev[cat], [ch]: val } }));
  };

  // DnD
  const onDragStart = (i) => setDrag(i);
  const onDragOver = (e) => { e.preventDefault(); };
  const onDrop = (i) => {
    if (drag === null || drag === i) return;
    const next = [...slots];
    const [moved] = next.splice(drag, 1);
    next.splice(i, 0, moved);
    setSlots(next);
    setDrag(null);
  };

  return (
    <div className="page" style={{maxWidth:880}}>
      {/* Breadcrumb */}
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>마이페이지</a><span>›</span>
        <span style={{color:'var(--ink)'}}>알림 설정</span>
      </div>

      {/* Hero */}
      <header style={{marginBottom:20}}>
        <div className="eyebrow">NOTIFICATIONS</div>
        <h1 style={{margin:'4px 0 4px', fontFamily:'var(--ff-display)', fontSize:'var(--fs-h1, 30px)', fontWeight:800, letterSpacing:'-0.015em'}}>
          알림 설정
        </h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>
          채널·카테고리·발송 시간대를 직접 정렬하세요
        </div>
      </header>

      {/* 채널 마스터 */}
      <div className="card" style={{padding:'22px 24px', marginBottom:14}}>
        <SubH>채널</SubH>
        <SettingsToggle
          checked={push}
          onChange={setPush}
          label="푸시 알림"
          desc="모바일 앱·브라우저 즉시 알림"
        />
        <SettingsToggle
          checked={email}
          onChange={setEmail}
          label="이메일 알림"
          desc="rdm_captain@bdr.kr — 일일 요약 + 중요 알림"
        />
        <SettingsToggle
          checked={quiet}
          onChange={setQuiet}
          label="방해 금지 시간 (22:00–06:00)"
          desc="긴급 알림만 통과 — 결제·보안·경기 시작 임박"
        />
      </div>

      {/* 카테고리 매트릭스 */}
      <div className="card" style={{padding:'22px 24px', marginBottom:14}}>
        <SubH>카테고리별 발송 채널</SubH>
        <div className="pns-matrix" style={{
          border:'1px solid var(--border)', borderRadius:6, overflow:'hidden', marginTop:6,
        }}>
          {/* head */}
          <div className="pns-matrix__head" style={{
            display:'grid', gridTemplateColumns:'minmax(0, 1fr) 88px 88px 88px',
            gap:8, padding:'10px 14px', background:'var(--bg-alt)',
            fontSize:11, color:'var(--ink-mute)', fontWeight:700,
            letterSpacing:'.06em', textTransform:'uppercase',
            borderBottom:'1px solid var(--border)',
          }}>
            <div>카테고리</div>
            <div style={{textAlign:'center'}}>푸시</div>
            <div style={{textAlign:'center'}}>이메일</div>
            <div style={{textAlign:'center'}}>인앱</div>
          </div>
          {cats.map((c, i) => (
            <div key={c.id} className="pns-matrix__row" style={{
              display:'grid', gridTemplateColumns:'minmax(0, 1fr) 88px 88px 88px',
              gap:8, padding:'14px', alignItems:'center',
              borderBottom: i < cats.length - 1 ? '1px solid var(--border)' : 0,
            }}>
              <div data-label="카테고리" style={{minWidth:0}}>
                <div style={{fontWeight:700, fontSize:14}}>{c.label}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{c.desc}</div>
              </div>
              {['push', 'email', 'inapp'].map(ch => (
                <div key={ch} data-label={ch === 'push' ? '푸시' : ch === 'email' ? '이메일' : '인앱'} style={{display:'flex', justifyContent:'center'}}>
                  <MiniToggle
                    on={matrix[c.id][ch]}
                    onChange={(v)=>setMatrixVal(c.id, ch, v)}
                    label={`${c.label} ${ch}`}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 시간대 DnD */}
      <div className="card" style={{padding:'22px 24px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:12}}>
          <SubH style={{margin:0, padding:0, border:0}}>알림 시간대 우선순위</SubH>
          <span style={{fontSize:11, color:'var(--ink-dim)'}}>드래그로 순서 변경</span>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {slots.map((s, i) => (
            <div
              key={s.id}
              draggable
              onDragStart={()=>onDragStart(i)}
              onDragOver={onDragOver}
              onDrop={()=>onDrop(i)}
              style={{
                display:'grid', gridTemplateColumns:'40px 36px 1fr auto', gap:12,
                padding:'14px 14px', minHeight:56,
                background: drag === i ? 'var(--bg-alt)' : 'var(--bg-card, var(--bg))',
                border:'1px solid var(--border)', borderRadius:6,
                cursor:'grab', alignItems:'center',
                opacity: drag === i ? 0.5 : 1,
              }}
            >
              <span style={{
                width:28, height:28, display:'grid', placeItems:'center',
                background:'var(--bg-alt)', borderRadius:4,
                fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:13, color:'var(--accent)',
              }}>{i + 1}</span>
              <span style={{fontSize:18, color:'var(--ink-dim)', textAlign:'center'}}>⋮⋮</span>
              <div style={{minWidth:0}}>
                <div style={{fontWeight:700, fontSize:14}}>{s.label}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{s.desc}</div>
              </div>
              <span style={{
                fontSize:10, fontFamily:'var(--ff-mono)', fontWeight:700,
                padding:'4px 8px', borderRadius:3, letterSpacing:'.06em',
                color: i === 0 ? 'var(--accent)' : 'var(--ink-dim)',
                background: i === 0 ? 'color-mix(in oklab, var(--accent) 12%, transparent)' : 'var(--bg-alt)',
                textTransform:'uppercase',
              }}>
                {i === 0 ? '최우선' : `우선 #${i + 1}`}
              </span>
            </div>
          ))}
        </div>
        <div style={{
          marginTop:14, padding:'12px 14px',
          background:'color-mix(in oklab, var(--cafe-blue) 6%, transparent)',
          border:'1px solid color-mix(in oklab, var(--cafe-blue) 30%, var(--border))',
          borderRadius:6,
          fontSize:12, color:'var(--ink-soft)', lineHeight:1.6,
        }}>
          상위 시간대일수록 푸시·이메일이 즉시 발송됩니다. 하위 시간대는 묶음 발송(다이제스트)으로 전환됩니다.
        </div>
      </div>

      <style>{`
        @media (max-width: 720px) {
          .pns-matrix__head { display: none !important; }
          .pns-matrix__row {
            grid-template-columns: 1fr 1fr 1fr !important;
            grid-template-rows: auto auto !important;
            gap: 8px !important;
          }
          .pns-matrix__row > [data-label="카테고리"] {
            grid-column: 1 / -1 !important;
          }
          .pns-matrix__row > [data-label]:not([data-label="카테고리"]) {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 4px !important;
            padding: 8px 0 !important;
            background: var(--bg-alt) !important;
            border-radius: 4px !important;
          }
          .pns-matrix__row > [data-label]:not([data-label="카테고리"])::before {
            content: attr(data-label);
            font-size: 10px;
            color: var(--ink-dim);
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: .06em;
          }
        }
      `}</style>
    </div>
  );
}

// 작은 토글 — 매트릭스 셀용
function MiniToggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={()=>onChange(!on)}
      style={{
        position:'relative', width:40, height:24, minWidth:40,
        padding:0, border:0, cursor:'pointer',
        background: on ? 'var(--cafe-blue)' : 'var(--bg-alt)',
        borderRadius:12,
        transition:'background .2s',
      }}
    >
      <span style={{
        position:'absolute', top:3, left:3,
        width:18, height:18, borderRadius:'50%',
        background:'#fff',
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition:'transform .2s',
        boxShadow:'0 1px 3px rgba(0,0,0,.25)',
      }}/>
    </button>
  );
}

function SubH({ children, style }) {
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

window.ProfileNotificationSettings = ProfileNotificationSettings;
