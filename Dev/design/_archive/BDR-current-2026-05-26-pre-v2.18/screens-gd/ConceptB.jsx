/* global React, GD_GAME, GD_APPLICANTS, GD_ME */
// ============================================================
// Concept B — 10인 슬롯 보드
// 큰 5×2 슬롯 그리드. 신청자 = 풍부한 카드, 빈자리 = "이 자리에 들어오기" CTA.
// 상단 풀폭 정보 헤로 + 우측 sticky 신청 폼.
// 모집 게임의 본질("자리 채우기")을 가장 직관적으로 시각화.
// ============================================================

function GDConceptB() {
  const g = GD_GAME;
  const apps = GD_APPLICANTS;
  const filled = apps.length;
  const remain = g.spotsTotal - filled;
  const pct = Math.round((filled / g.spotsTotal) * 100);
  const reachedMin = filled >= g.spotsMin;

  // 10 슬롯 = filled 7 + empty 3
  const slots = [];
  for (let i = 0; i < g.spotsTotal; i++) {
    slots.push(apps[i] || null);
  }

  return (
    <div style={B.page}>
      {/* 풀폭 hero 헤더 */}
      <div style={B.hero}>
        <div style={B.heroLeft}>
          <div style={B.heroBreadcrumb}>
            <span>경기 모집</span> <span style={{opacity:.4}}>›</span> <span style={{opacity:.7}}>{g.kind}</span>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8, marginBottom:14}}>
            <span style={B.heroBadge}>{g.kind}</span>
            <span style={B.heroLive}>● {g.status}</span>
            <span style={B.heroCountdown}>{g.countdown} · 모집 마감 4월 25일 18:00</span>
          </div>
          <h1 style={B.heroTitle}>{g.title}</h1>

          <div style={B.heroMeta}>
            <div style={B.heroMetaItem}>
              <div style={B.heroMetaIcon}>📍</div>
              <div>
                <div style={B.heroMetaVal}>{g.court}</div>
                <div style={B.heroMetaSub}>{g.area}</div>
              </div>
            </div>
            <div style={B.heroMetaItem}>
              <div style={B.heroMetaIcon}>📅</div>
              <div>
                <div style={B.heroMetaVal}>{g.date}</div>
                <div style={B.heroMetaSub}>{g.time}</div>
              </div>
            </div>
            <div style={B.heroMetaItem}>
              <div style={B.heroMetaIcon}>💰</div>
              <div>
                <div style={{...B.heroMetaVal, color:'#fff'}}>{g.fee}</div>
                <div style={B.heroMetaSub}>대관보조 2만원</div>
              </div>
            </div>
            <div style={B.heroMetaItem}>
              <div style={B.heroMetaIcon}>🎯</div>
              <div>
                <div style={B.heroMetaVal}>{g.level}</div>
                <div style={B.heroMetaSub}>{g.guest}</div>
              </div>
            </div>
          </div>

          {/* 큰 진행 게이지 */}
          <div style={B.heroProgWrap}>
            <div style={B.heroProgRow}>
              <div>
                <div style={B.heroProgLbl}>모집 현황</div>
                <div style={B.heroProgVal}>
                  <span style={B.heroProgNum}>{filled}</span>
                  <span style={B.heroProgDen}>/ {g.spotsTotal} 명</span>
                </div>
              </div>
              <div style={B.heroProgRight}>
                <div style={B.heroProgLbl}>잔여</div>
                <div style={{...B.heroProgNum, color:'var(--accent)'}}>{remain}</div>
              </div>
            </div>
            <div style={B.heroProgBar}>
              <div style={{...B.heroProgFill, width:`${pct}%`}}/>
              <div style={{...B.heroProgMin, left:`${(g.spotsMin/g.spotsTotal)*100}%`}}>
                <div style={B.heroProgMinTick}/>
                <div style={B.heroProgMinLbl}>최소 {g.spotsMin}명 {reachedMin ? '✓' : ''}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={B.body}>
        {/* 좌측 — 10인 슬롯 그리드 */}
        <div style={{display:'flex', flexDirection:'column', gap:18}}>
          <div style={B.sectionHead}>
            <div>
              <div style={B.eyebrow}>로스터 · 10인</div>
              <h2 style={B.h2}>지금 모인 사람들</h2>
            </div>
            <div style={B.filterRow}>
              <button style={{...B.filterBtn, ...B.filterBtnOn}}>전체</button>
              <button style={B.filterBtn}>가드</button>
              <button style={B.filterBtn}>윙</button>
              <button style={B.filterBtn}>포스트</button>
            </div>
          </div>

          <div style={B.slotGrid}>
            {slots.map((a, i) => (
              <div key={i}>
                {a ? <FilledSlot a={a} num={i+1} host={i===0}/> : <EmptySlot num={i+1}/>}
              </div>
            ))}
          </div>

          {/* 경기 안내 + 룰 */}
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
            <div style={B.infoCard}>
              <div style={B.eyebrow}>경기 안내</div>
              <h3 style={B.h3}>호스트 메모</h3>
              <ul style={B.infoList}>
                {g.intro.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
            </div>
            <div style={B.infoCard}>
              <div style={B.eyebrow}>참가 룰</div>
              <h3 style={B.h3}>꼭 지켜주세요</h3>
              <ul style={B.infoList}>
                {g.rules.map((line, i) => <li key={i}>{line}</li>)}
              </ul>
              <div style={B.uniformRow}>
                <div>
                  <div style={B.uniformLbl}>홈 유니폼</div>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginTop:4}}>
                    <span style={{...B.uniformDot, background:g.uniformHome}}/>
                    <span style={B.uniformHex}>{g.uniformHome}</span>
                  </div>
                </div>
                <div>
                  <div style={B.uniformLbl}>원정 유니폼</div>
                  <div style={{display:'flex', alignItems:'center', gap:6, marginTop:4}}>
                    <span style={{...B.uniformDot, background:g.uniformAway}}/>
                    <span style={B.uniformHex}>{g.uniformAway}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측 sticky 신청 */}
        <aside>
          <div style={B.applyCard}>
            <div style={B.applyTopStrip}>
              <div>
                <div style={B.applyTopLbl}>참가비</div>
                <div style={B.applyTopFee}>{g.fee}</div>
              </div>
              <div style={B.applyTopDiv}/>
              <div>
                <div style={B.applyTopLbl}>남은 자리</div>
                <div style={B.applyTopFee}>
                  <span style={{color:'var(--accent)'}}>{remain}</span>
                  <span style={{fontSize:14, color:'var(--ink-mute)', fontWeight:600}}> / {g.spotsTotal}</span>
                </div>
              </div>
            </div>

            <div style={B.applyBody}>
              <div>
                <div style={B.applyLbl}>내 프로필 (자동 입력)</div>
                <div style={B.applyMe}>
                  <div style={B.applyMeAvatar}>{GD_ME.name[0]}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:14}}>{GD_ME.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:1}}>
                      {GD_ME.level} · {GD_ME.pos} · {GD_ME.games}경기
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div style={B.applyLbl}>참가 포지션</div>
                <div style={B.posGrid}>
                  {['PG','SG','SF','PF','C'].map((p, i) => (
                    <button key={p} style={{...B.posChip, ...(i===0 ? B.posChipOn : {})}}>{p}</button>
                  ))}
                </div>
              </div>

              <div>
                <div style={B.applyLbl}>한마디 (선택)</div>
                <textarea defaultValue="오랜만에 가는데 잘 부탁드립니다!" style={B.textarea}/>
              </div>

              <label style={B.checkboxRow}>
                <input type="checkbox" defaultChecked/>
                <span>취소 시 최소 3시간 전 통보 동의</span>
              </label>

              <button style={B.btnPrimary}>
                <span style={{fontSize:11, fontWeight:700, opacity:.8, letterSpacing:'.08em'}}>이 자리에 들어가기</span>
                <span style={{fontSize:16, fontWeight:800, marginTop:2}}>참가 신청 · {g.fee}</span>
              </button>
              <button style={B.btnGhostFull}>호스트에게 먼저 문의</button>
            </div>

            <div style={B.hostStrip}>
              <div style={B.applyMeAvatar} ><span style={{background:g.host.avatar, width:'100%', height:'100%', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center'}}>{g.host.name[0]}</span></div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:11, color:'var(--ink-mute)'}}>호스트</div>
                <div style={{fontSize:13, fontWeight:700}}>{g.host.name} · {g.host.team}</div>
              </div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-mute)'}}>★ {g.host.rating}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FilledSlot({ a, num, host }) {
  return (
    <div style={{...B.slot, ...B.slotFilled}}>
      <div style={B.slotNum}>{String(num).padStart(2,'0')}</div>
      {host && <div style={B.slotHostTag}>HOST</div>}
      <div style={{...B.slotAvatar, background:a.color}}>{a.name[0]}</div>
      <div style={B.slotName}>{a.name}</div>
      <div style={B.slotHandle}>@{a.handle}</div>
      <div style={B.slotMetaRow}>
        <span style={B.slotPos}>{a.pos}</span>
        <span style={B.slotLvl}>{a.level}</span>
        <span style={B.slotRating}>★ {a.rating}</span>
      </div>
      {a.badge && <div style={B.slotBadge}>{a.badge}</div>}
    </div>
  );
}

function EmptySlot({ num }) {
  return (
    <button style={{...B.slot, ...B.slotEmpty}}>
      <div style={{...B.slotNum, color:'var(--ink-dim)'}}>{String(num).padStart(2,'0')}</div>
      <div style={B.emptyIcon}>+</div>
      <div style={B.emptyTitle}>이 자리에<br/>들어오기</div>
      <div style={B.emptySub}>탭하여 신청</div>
    </button>
  );
}

const B = {
  page: { background:'var(--bg)', minHeight:'100%', fontFamily:'var(--ff-body)', color:'var(--ink)' },

  hero: {
    background:'linear-gradient(135deg, #0F2A52 0%, #1B3C87 60%, #2A4FA0 100%)',
    color:'#fff',
    padding:'32px 40px 24px',
    position:'relative', overflow:'hidden',
  },
  heroLeft: { position:'relative', zIndex:1 },
  heroBreadcrumb: { fontSize:12, opacity:.8, fontFamily:'var(--ff-mono)', letterSpacing:'.04em' },
  heroBadge: {
    display:'inline-flex', alignItems:'center',
    padding:'4px 12px', fontSize:11, fontWeight:800, letterSpacing:'.08em',
    background:'var(--accent)', color:'#fff', borderRadius:4,
  },
  heroLive: {
    display:'inline-flex', alignItems:'center', gap:4,
    padding:'4px 10px', fontSize:11, fontWeight:700,
    background:'rgba(16,185,129,.2)', color:'#5EEAA5',
    border:'1px solid rgba(16,185,129,.4)', borderRadius:4,
  },
  heroCountdown: {
    fontSize:11, fontWeight:600, fontFamily:'var(--ff-mono)',
    color:'rgba(255,255,255,.7)', letterSpacing:'.04em',
  },

  heroTitle: {
    margin:'0 0 22px', fontSize:32, fontWeight:900, letterSpacing:'-0.02em',
    fontFamily:'var(--ff-body)', lineHeight:1.2, maxWidth:680,
  },

  heroMeta: { display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:18, marginBottom:24 },
  heroMetaItem: { display:'flex', alignItems:'center', gap:10 },
  heroMetaIcon: { fontSize:20, opacity:.85, flexShrink:0 },
  heroMetaVal: { fontSize:14, fontWeight:700, color:'#fff', lineHeight:1.3 },
  heroMetaSub: { fontSize:11, color:'rgba(255,255,255,.65)', marginTop:1 },

  heroProgWrap: { background:'rgba(0,0,0,.18)', padding:'14px 18px', borderRadius:6, maxWidth:680 },
  heroProgRow: { display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  heroProgLbl: { fontSize:10, fontWeight:700, letterSpacing:'.12em', textTransform:'uppercase', opacity:.7 },
  heroProgVal: { display:'flex', alignItems:'baseline', gap:6, marginTop:2 },
  heroProgNum: { fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, lineHeight:1 },
  heroProgDen: { fontSize:14, fontWeight:600, opacity:.7 },
  heroProgRight: { textAlign:'right' },

  heroProgBar: { height:10, background:'rgba(255,255,255,.12)', borderRadius:5, position:'relative', overflow:'visible' },
  heroProgFill: { height:'100%', background:'linear-gradient(90deg, var(--accent), #FF6B6B)', borderRadius:5 },
  heroProgMin: { position:'absolute', top:0, height:'100%', transform:'translateX(-50%)' },
  heroProgMinTick: { width:2, height:18, background:'#fff', position:'absolute', top:-4, left:'50%', transform:'translateX(-50%)' },
  heroProgMinLbl: { position:'absolute', top:18, left:'50%', transform:'translateX(-50%)', fontSize:10, fontFamily:'var(--ff-mono)', opacity:.8, whiteSpace:'nowrap' },

  body: { display:'grid', gridTemplateColumns:'minmax(0, 1fr) 340px', gap:24, padding:'24px 40px 40px' },

  sectionHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-end' },
  eyebrow: { fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--accent)' },
  h2: { margin:'4px 0 0', fontSize:20, fontWeight:800, letterSpacing:'-0.01em' },
  h3: { margin:'4px 0 12px', fontSize:15, fontWeight:700 },

  filterRow: { display:'flex', gap:4 },
  filterBtn: {
    padding:'6px 12px', fontSize:12, fontWeight:600, fontFamily:'var(--ff-mono)',
    background:'var(--bg-elev)', color:'var(--ink-mute)',
    border:'1px solid var(--border)', borderRadius:4, cursor:'pointer',
  },
  filterBtnOn: { background:'var(--ink)', color:'var(--bg)', borderColor:'var(--ink)' },

  slotGrid: { display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:10 },
  slot: {
    aspectRatio:'1 / 1.18',
    borderRadius:8, padding:'14px 10px 12px',
    display:'flex', flexDirection:'column', alignItems:'center',
    position:'relative', textAlign:'center',
    transition:'transform .12s, box-shadow .12s',
    minHeight:170,
  },
  slotFilled: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    boxShadow:'0 1px 2px rgba(15,23,42,.04)',
  },
  slotEmpty: {
    background:'transparent',
    border:'2px dashed var(--border-strong)',
    cursor:'pointer', color:'var(--ink-mute)',
    fontFamily:'var(--ff-body)',
  },
  slotNum: {
    position:'absolute', top:6, left:8,
    fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700,
    color:'var(--ink-dim)', letterSpacing:'.04em',
  },
  slotHostTag: {
    position:'absolute', top:6, right:6,
    fontSize:9, fontWeight:800, padding:'2px 6px',
    background:'var(--accent)', color:'#fff', borderRadius:3, letterSpacing:'.06em',
  },
  slotAvatar: {
    width:48, height:48, borderRadius:'50%', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:18, marginTop:4, marginBottom:8,
  },
  slotName: { fontSize:13, fontWeight:800, color:'var(--ink)', lineHeight:1.1 },
  slotHandle: { fontSize:10, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', marginTop:1 },
  slotMetaRow: {
    display:'flex', gap:4, marginTop:8, flexWrap:'wrap', justifyContent:'center',
  },
  slotPos: {
    fontSize:10, fontWeight:800, padding:'2px 6px',
    background:'var(--cafe-blue-soft)', color:'var(--cafe-blue-deep)',
    borderRadius:3, fontFamily:'var(--ff-mono)',
  },
  slotLvl: {
    fontSize:10, fontWeight:700, padding:'2px 6px',
    background:'var(--bg-alt)', color:'var(--ink-soft)',
    borderRadius:3,
  },
  slotRating: {
    fontSize:10, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)', alignSelf:'center',
  },
  slotBadge: {
    position:'absolute', bottom:8, left:8, right:8,
    fontSize:9, fontWeight:700, padding:'2px 0',
    background:'rgba(15,95,204,.08)', color:'var(--cafe-blue-deep)',
    borderRadius:3, textAlign:'center', letterSpacing:'.04em',
  },

  emptyIcon: {
    width:42, height:42, borderRadius:'50%',
    background:'var(--bg-alt)',
    color:'var(--accent)', fontSize:24, fontWeight:300, lineHeight:'40px',
    marginTop:6, marginBottom:6,
  },
  emptyTitle: { fontSize:12, fontWeight:700, color:'var(--ink-soft)', lineHeight:1.25 },
  emptySub: { fontSize:10, color:'var(--ink-dim)', marginTop:6, fontFamily:'var(--ff-mono)' },

  infoCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'18px 20px' },
  infoList: {
    margin:0, padding:'0 0 0 18px',
    fontSize:13, color:'var(--ink-soft)', lineHeight:1.85,
  },

  uniformRow: { display:'flex', gap:24, marginTop:14, paddingTop:14, borderTop:'1px solid var(--border)' },
  uniformLbl: { fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' },
  uniformDot: { width:24, height:24, borderRadius:4, display:'inline-block' },
  uniformHex: { fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:600, color:'var(--ink-soft)' },

  // apply
  applyCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8,
    position:'sticky', top:24, overflow:'hidden',
    boxShadow:'0 6px 18px rgba(15,23,42,.06)',
  },
  applyTopStrip: {
    display:'flex', padding:'14px 18px',
    background:'var(--bg-alt)', borderBottom:'1px solid var(--border)',
  },
  applyTopLbl: { fontSize:10, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginBottom:3 },
  applyTopFee: { fontSize:18, fontWeight:800, fontFamily:'var(--ff-display)', color:'var(--ink)' },
  applyTopDiv: { width:1, background:'var(--border)', margin:'0 16px' },

  applyBody: { padding:'18px', display:'flex', flexDirection:'column', gap:14 },
  applyLbl: { fontSize:11, fontWeight:700, color:'var(--ink-soft)', letterSpacing:'.04em', marginBottom:6 },
  applyMe: {
    display:'flex', alignItems:'center', gap:10,
    padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6,
    border:'1px solid var(--border)',
  },
  applyMeAvatar: {
    width:36, height:36, borderRadius:'50%',
    background:'var(--cafe-blue)', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:14, flexShrink:0,
  },

  posGrid: { display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:4 },
  posChip: {
    padding:'8px 0', fontSize:12, fontWeight:700, fontFamily:'var(--ff-mono)',
    background:'var(--bg-elev)', color:'var(--ink-mute)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
  },
  posChipOn: { background:'var(--accent)', color:'#fff', borderColor:'var(--bdr-red-ink)' },

  textarea: {
    width:'100%', minHeight:64, padding:'10px',
    fontFamily:'var(--ff-body)', fontSize:13,
    background:'var(--bg-elev)', color:'var(--ink)',
    border:'1px solid var(--border-strong)', borderRadius:4,
    resize:'vertical', boxSizing:'border-box',
  },

  checkboxRow: { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--ink-soft)' },

  btnPrimary: {
    width:'100%', padding:'14px 16px',
    background:'var(--accent)', color:'#fff',
    border:'0', borderRadius:6, cursor:'pointer',
    display:'flex', flexDirection:'column', alignItems:'center', gap:0,
    fontFamily:'var(--ff-body)',
  },
  btnGhostFull: {
    width:'100%', padding:'10px',
    background:'transparent', color:'var(--ink-soft)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
    fontSize:12, fontWeight:600, fontFamily:'var(--ff-body)',
  },

  hostStrip: {
    display:'flex', alignItems:'center', gap:10,
    padding:'12px 18px', borderTop:'1px solid var(--border)',
    background:'var(--bg-alt)',
  },
};

window.GDConceptB = GDConceptB;
