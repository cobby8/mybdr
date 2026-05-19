/* global React, GD_GAME, GD_APPLICANTS, GD_ME */
// ============================================================
// Concept A — 코트 라인업
// 농구 하프코트 위에 신청자를 포지션별로 배치, 빈 자리는 점선 슬롯.
// 우측 sticky 신청 패널 — 핵심 액션 (신청하기) 항상 가시.
// ============================================================

function GDConceptA() {
  const g = GD_GAME;
  const apps = GD_APPLICANTS;
  const filled = apps.length;
  const remain = g.spotsTotal - filled;
  const pct = Math.round((filled / g.spotsTotal) * 100);

  // 포지션별로 슬롯 배치 (코트 좌표 — % 기준)
  // PG (top), SG (top), SF (mid), PF (mid), C (low)
  // 10명 = 각 포지션 2명 + 가드 1 추가
  const slotsPlan = [
    { pos: 'PG', x: 32, y: 18 },
    { pos: 'PG', x: 68, y: 18 },
    { pos: 'SG', x: 18, y: 34 },
    { pos: 'SG', x: 82, y: 34 },
    { pos: 'SF', x: 28, y: 54 },
    { pos: 'SF', x: 72, y: 54 },
    { pos: 'PF', x: 38, y: 70 },
    { pos: 'PF', x: 62, y: 70 },
    { pos: 'C',  x: 42, y: 87 },
    { pos: 'C',  x: 58, y: 87 },
  ];

  // 신청자 → 슬롯 매칭 (포지션 기준)
  const slots = slotsPlan.map((s, i) => {
    // 같은 포지션의 신청자 중 아직 매칭 안 된 첫 사람
    const usedIds = slotsPlan.slice(0, i).map(prev => prev._applicantId).filter(Boolean);
    const match = apps.find(a => a.pos === s.pos && !usedIds.includes(a.id));
    if (match) s._applicantId = match.id;
    return { ...s, applicant: match || null };
  });

  return (
    <div style={A.page}>
      {/* 좌측 메인 컬럼 */}
      <div style={{display:'flex', flexDirection:'column', gap:16}}>
        {/* breadcrumb */}
        <div style={A.breadcrumb}>
          <span>경기</span> <span style={A.bcSep}>›</span> <span>모집 중</span> <span style={A.bcSep}>›</span>
          <span style={{color:'var(--ink)'}}>{g.shortTitle}</span>
        </div>

        {/* 헤더 카드 */}
        <div style={A.headerCard}>
          <div style={{display:'flex', gap:8, marginBottom:14}}>
            <span style={A.chipKind}>{g.kind}</span>
            <span style={A.chipStatus}>● {g.status}</span>
            <span style={A.chipMeta}>{g.countdown}</span>
            <span style={A.chipMeta}>{g.guest}</span>
          </div>
          <h1 style={A.title}>{g.title}</h1>

          <div style={A.metaRow}>
            <div style={A.metaCell}>
              <div style={A.metaLabel}>일시</div>
              <div style={A.metaVal}>{g.date}</div>
              <div style={A.metaSub}>{g.time}</div>
            </div>
            <div style={A.metaDiv}/>
            <div style={A.metaCell}>
              <div style={A.metaLabel}>장소</div>
              <div style={A.metaVal}>{g.court}</div>
              <div style={A.metaSub}>{g.area}</div>
            </div>
            <div style={A.metaDiv}/>
            <div style={A.metaCell}>
              <div style={A.metaLabel}>참가비</div>
              <div style={{...A.metaVal, color:'var(--ok)'}}>{g.fee}</div>
              <div style={A.metaSub}>대관보조 2만원</div>
            </div>
            <div style={A.metaDiv}/>
            <div style={A.metaCell}>
              <div style={A.metaLabel}>유니폼</div>
              <div style={{display:'flex', gap:8, alignItems:'center', marginTop:2}}>
                <span style={{...A.jersey, background:g.uniformHome}}>홈</span>
                <span style={{...A.jersey, background:g.uniformAway}}>원정</span>
              </div>
            </div>
          </div>
        </div>

        {/* 코트 라인업 — 핵심 비주얼 */}
        <div style={A.courtCard}>
          <div style={A.courtHead}>
            <div>
              <div style={A.eyebrow}>라인업</div>
              <h2 style={A.h2}>코트에 모인 사람들</h2>
            </div>
            <div style={A.courtCounter}>
              <span style={A.courtCounterNum}>{filled}</span>
              <span style={A.courtCounterDen}>/ {g.spotsTotal}</span>
              <span style={A.courtCounterTag}>{remain}자리 남음</span>
            </div>
          </div>

          {/* 농구 하프코트 SVG */}
          <div style={A.courtWrap}>
            <svg viewBox="0 0 400 480" style={{position:'absolute', inset:0, width:'100%', height:'100%'}}>
              {/* court bg */}
              <rect x="6" y="6" width="388" height="468" fill="#F2DEC0" stroke="#C09D6B" strokeWidth="2"/>
              {/* baseline */}
              <line x1="6" y1="6" x2="394" y2="6" stroke="#C09D6B" strokeWidth="2"/>
              {/* free-throw lane (key) */}
              <rect x="140" y="6" width="120" height="180" fill="#E8C896" stroke="#C09D6B" strokeWidth="2"/>
              {/* free-throw arc */}
              <path d="M 140 186 A 60 60 0 0 0 260 186" fill="none" stroke="#C09D6B" strokeWidth="2"/>
              <path d="M 140 186 A 60 60 0 0 1 260 186" fill="none" stroke="#C09D6B" strokeWidth="2" strokeDasharray="4 4"/>
              {/* hoop */}
              <circle cx="200" cy="42" r="9" fill="none" stroke="#C0392B" strokeWidth="2.5"/>
              <line x1="190" y1="22" x2="210" y2="22" stroke="#404040" strokeWidth="3"/>
              {/* three-point arc */}
              <path d="M 50 6 L 50 100 A 150 150 0 0 0 350 100 L 350 6" fill="none" stroke="#C09D6B" strokeWidth="2"/>
              {/* half-court line */}
              <line x1="6" y1="440" x2="394" y2="440" stroke="#C09D6B" strokeWidth="2"/>
              <circle cx="200" cy="440" r="50" fill="none" stroke="#C09D6B" strokeWidth="2"/>
            </svg>

            {/* 슬롯 마커 */}
            {slots.map((s, i) => {
              const isFilled = !!s.applicant;
              return (
                <div key={i} style={{
                  position:'absolute',
                  left:`${s.x}%`, top:`${s.y}%`,
                  transform:'translate(-50%, -50%)',
                  width:64,
                }}>
                  {isFilled ? (
                    <div style={A.filledSlot}>
                      <div style={{...A.slotAvatar, background:s.applicant.color}}>
                        {s.applicant.name[0]}
                      </div>
                      <div style={A.slotName}>{s.applicant.name}</div>
                      <div style={A.slotPos}>{s.applicant.pos} · {s.applicant.level}</div>
                    </div>
                  ) : (
                    <button style={A.emptySlot}>
                      <div style={A.emptySlotIcon}>+</div>
                      <div style={A.emptySlotPos}>{s.pos}</div>
                      <div style={A.emptySlotHint}>들어오기</div>
                    </button>
                  )}
                </div>
              );
            })}

            {/* 포지션 라벨 (코트 좌측) */}
            <div style={{position:'absolute', left:8, top:8, display:'flex', flexDirection:'column', gap:4, fontFamily:'var(--ff-mono)', fontSize:10, color:'rgba(60,40,20,.6)'}}>
              <div>GUARD</div>
              <div>WING</div>
              <div>POST</div>
            </div>
          </div>

          {/* progress bar */}
          <div style={{marginTop:18}}>
            <div style={A.progRow}>
              <span style={A.progLabel}>모집 진행</span>
              <span style={A.progNum}>{pct}%</span>
            </div>
            <div style={A.progBar}>
              <div style={{...A.progFill, width:`${pct}%`}}/>
              <div style={A.progMin}>최소 {g.spotsMin}명</div>
            </div>
          </div>
        </div>

        {/* 호스트 & 안내 */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div style={A.smallCard}>
            <div style={A.eyebrow}>호스트</div>
            <div style={{display:'flex', alignItems:'center', gap:12, marginTop:8}}>
              <div style={{...A.slotAvatar, width:48, height:48, fontSize:18, background:g.host.avatar}}>
                {g.host.name[0]}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700, fontSize:15}}>{g.host.name} <span style={{color:'var(--ink-mute)', fontWeight:400, fontSize:12}}>@{g.host.handle}</span></div>
                <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{g.host.team} · 호스트 평점 ★ {g.host.rating} · {g.host.games}경기</div>
              </div>
              <button style={A.btnGhost}>문의</button>
            </div>
          </div>
          <div style={A.smallCard}>
            <div style={A.eyebrow}>경기 룰</div>
            <ul style={{margin:'8px 0 0', padding:'0 0 0 18px', fontSize:13, color:'var(--ink-soft)', lineHeight:1.7}}>
              {g.rules.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
        </div>
      </div>

      {/* 우측 sticky 신청 패널 */}
      <aside>
        <div style={A.applyCard}>
          <div style={A.applyHead}>
            <div style={A.applyHeadEyebrow}>참가 신청</div>
            <div style={A.applyCountdown}>{g.countdown}</div>
          </div>

          <div style={A.applyMeta}>
            <div>
              <div style={A.applyMetaLbl}>참가비</div>
              <div style={{...A.applyMetaVal, color:'var(--ok)'}}>{g.fee}</div>
            </div>
            <div style={A.metaDiv}/>
            <div>
              <div style={A.applyMetaLbl}>남은 자리</div>
              <div style={A.applyMetaVal}>{remain}/{g.spotsTotal}</div>
            </div>
          </div>

          <div style={A.applyBody}>
            <div style={A.applyLbl}>내 프로필</div>
            <div style={A.applyMe}>
              <div style={{...A.slotAvatar, width:36, height:36, fontSize:14, background:'#1B3C87'}}>{GD_ME.name[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:700, fontSize:14}}>{GD_ME.name}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>{GD_ME.level} · {GD_ME.pos}</div>
              </div>
              <a style={{fontSize:11, color:'var(--cafe-blue)', textDecoration:'underline'}}>수정</a>
            </div>

            <div>
              <div style={A.applyLbl}>참가 포지션 (자동 추천: PG)</div>
              <div style={A.posPicker}>
                {['PG','SG','SF','PF','C'].map(p => (
                  <button key={p} style={{...A.posBtn, ...(p==='PG' ? A.posBtnOn : {})}}>{p}</button>
                ))}
              </div>
            </div>

            <div>
              <div style={A.applyLbl}>한마디 (선택)</div>
              <textarea defaultValue="오랜만에 농구입니다! 잘 부탁드려요" style={A.textarea}/>
            </div>

            <label style={A.checkboxRow}>
              <input type="checkbox" defaultChecked/>
              <span>취소 시 최소 3시간 전 통보에 동의</span>
            </label>
          </div>

          <button style={A.btnPrimary}>신청하기 · {g.fee}</button>
          <div style={A.applyFootRow}>
            <button style={A.applyFootBtn}>호스트 문의</button>
            <button style={A.applyFootBtn}>저장</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

const A = {
  page: {
    display:'grid', gridTemplateColumns:'minmax(0, 1fr) 340px', gap:20,
    padding:'28px 32px', background:'var(--bg)', minHeight:'100%',
    fontFamily:'var(--ff-body)', color:'var(--ink)',
  },
  breadcrumb: { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)' },
  bcSep: { color:'var(--ink-dim)' },

  headerCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:8, padding:'22px 26px',
    borderLeft:'4px solid var(--accent)',
  },
  title: { margin:'0 0 18px', fontSize:24, fontWeight:800, letterSpacing:'-0.01em', lineHeight:1.25 },

  chipKind: {
    display:'inline-flex', alignItems:'center',
    padding:'3px 10px', fontSize:11, fontWeight:800, letterSpacing:'.04em',
    background:'var(--accent)', color:'#fff', borderRadius:4,
  },
  chipStatus: {
    display:'inline-flex', alignItems:'center', gap:4,
    padding:'3px 10px', fontSize:11, fontWeight:700, letterSpacing:'.04em',
    background:'rgba(28,160,94,.12)', color:'var(--ok)', borderRadius:4,
  },
  chipMeta: {
    display:'inline-flex', alignItems:'center',
    padding:'3px 10px', fontSize:11, fontWeight:600,
    background:'var(--bg-alt)', color:'var(--ink-soft)', borderRadius:4,
  },

  metaRow: {
    display:'flex', alignItems:'stretch',
    background:'var(--bg-alt)', borderRadius:8, padding:'16px 18px', gap:0,
  },
  metaCell: { flex:1, minWidth:0, padding:'0 14px' },
  metaDiv: { width:1, background:'var(--border)' },
  metaLabel: { fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:6 },
  metaVal: { fontSize:15, fontWeight:700, color:'var(--ink)', lineHeight:1.3 },
  metaSub: { fontSize:12, color:'var(--ink-mute)', marginTop:2, fontFamily:'var(--ff-mono)' },
  jersey: {
    display:'inline-flex', alignItems:'center', justifyContent:'center',
    width:34, height:22, borderRadius:3, color:'#fff', fontWeight:800, fontSize:10, letterSpacing:'.04em',
  },

  courtCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:8, padding:'22px 24px 18px',
  },
  courtHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:16 },
  eyebrow: { fontSize:10, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase', color:'var(--accent)' },
  h2: { margin:'4px 0 0', fontSize:18, fontWeight:800, letterSpacing:'-0.01em' },
  courtCounter: { display:'flex', alignItems:'baseline', gap:6 },
  courtCounterNum: { fontFamily:'var(--ff-display)', fontWeight:900, fontSize:36, lineHeight:1, color:'var(--ink)' },
  courtCounterDen: { fontFamily:'var(--ff-display)', fontWeight:700, fontSize:18, color:'var(--ink-mute)' },
  courtCounterTag: { marginLeft:10, padding:'4px 8px', background:'var(--accent)', color:'#fff', borderRadius:4, fontSize:11, fontWeight:700 },

  courtWrap: {
    position:'relative', width:'100%', aspectRatio:'400 / 480',
    maxHeight:480, margin:'0 auto',
    background:'#F8E9CC', borderRadius:6, overflow:'hidden',
  },

  filledSlot: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:2,
    background:'rgba(255,255,255,.96)', backdropFilter:'blur(2px)',
    border:'1px solid rgba(0,0,0,.08)',
    padding:'6px 6px 7px', borderRadius:6,
    boxShadow:'0 2px 8px rgba(0,0,0,.12)',
  },
  slotAvatar: {
    width:28, height:28, borderRadius:'50%', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:12, fontFamily:'var(--ff-body)',
    flexShrink:0,
  },
  slotName: { fontSize:11, fontWeight:700, color:'#1A1E27', lineHeight:1.1, whiteSpace:'nowrap' },
  slotPos: { fontSize:9, color:'#6B7280', fontFamily:'var(--ff-mono)', letterSpacing:'.02em' },

  emptySlot: {
    display:'flex', flexDirection:'column', alignItems:'center', gap:1,
    background:'rgba(255,255,255,.5)',
    border:'2px dashed var(--accent)',
    padding:'8px 6px', borderRadius:6,
    cursor:'pointer', width:64,
    transition:'transform .15s, background .15s',
  },
  emptySlotIcon: { fontSize:18, fontWeight:700, color:'var(--accent)', lineHeight:1 },
  emptySlotPos: { fontSize:10, fontWeight:800, color:'var(--accent)', fontFamily:'var(--ff-mono)' },
  emptySlotHint: { fontSize:9, color:'var(--accent)', textTransform:'uppercase', letterSpacing:'.04em' },

  progRow: { display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 },
  progLabel: { fontSize:12, color:'var(--ink-mute)', fontWeight:600 },
  progNum: { fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:700 },
  progBar: { height:10, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden', position:'relative' },
  progFill: { height:'100%', background:'linear-gradient(90deg, var(--cafe-blue), var(--accent))', borderRadius:4 },
  progMin: { position:'absolute', left:'40%', top:-4, width:1, height:18, background:'var(--ink)', },

  smallCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'16px 18px' },
  btnGhost: {
    padding:'6px 10px', fontSize:12, fontWeight:600,
    background:'transparent', color:'var(--ink-soft)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
  },

  // sticky apply
  applyCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8,
    position:'sticky', top:24, overflow:'hidden',
    boxShadow:'0 6px 18px rgba(15,23,42,.06)',
  },
  applyHead: {
    background:'var(--cafe-blue)', color:'#fff',
    padding:'14px 18px', display:'flex', justifyContent:'space-between', alignItems:'center',
  },
  applyHeadEyebrow: { fontSize:11, fontWeight:800, letterSpacing:'.12em', textTransform:'uppercase' },
  applyCountdown: { fontFamily:'var(--ff-display)', fontSize:20, fontWeight:900, letterSpacing:'.04em' },

  applyMeta: { display:'flex', padding:'14px 18px', background:'var(--bg-alt)', borderBottom:'1px solid var(--border)' },
  applyMetaLbl: { fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:2 },
  applyMetaVal: { fontSize:18, fontWeight:800, fontFamily:'var(--ff-display)' },

  applyBody: { padding:'18px', display:'flex', flexDirection:'column', gap:14 },
  applyLbl: { fontSize:11, fontWeight:700, color:'var(--ink-soft)', letterSpacing:'.04em', marginBottom:6 },
  applyMe: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6,
    border:'1px solid var(--border)',
  },

  posPicker: { display:'flex', gap:4 },
  posBtn: {
    flex:1, padding:'8px 0', fontSize:12, fontWeight:700, fontFamily:'var(--ff-mono)',
    background:'var(--bg-elev)', color:'var(--ink-mute)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
  },
  posBtnOn: {
    background:'var(--accent)', color:'#fff', borderColor:'var(--bdr-red-ink)',
  },

  textarea: {
    width:'100%', minHeight:60, padding:'8px 10px',
    fontFamily:'var(--ff-body)', fontSize:13, color:'var(--ink)',
    background:'var(--bg-elev)', border:'1px solid var(--border-strong)', borderRadius:4,
    resize:'vertical', boxSizing:'border-box',
  },

  checkboxRow: { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--ink-soft)' },

  btnPrimary: {
    width:'calc(100% - 36px)', margin:'4px 18px 0',
    padding:'14px 16px', fontSize:15, fontWeight:800,
    background:'var(--accent)', color:'#fff',
    border:'0', borderRadius:6, cursor:'pointer',
    fontFamily:'var(--ff-body)',
  },
  applyFootRow: { display:'flex', gap:8, padding:'10px 18px 18px' },
  applyFootBtn: {
    flex:1, padding:'10px 0', fontSize:12, fontWeight:600,
    background:'var(--bg-elev)', color:'var(--ink-soft)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
  },
};

window.GDConceptA = GDConceptA;
