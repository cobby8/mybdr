/* global React, GD_GAME, GD_APPLICANTS, GD_ME */
// ============================================================
// Concept C — 신청 현황 대시보드
// 신청자 정보를 데이터 시각화로: 도넛(인원), 막대(포지션), 분포(레벨), 타임라인.
// 정보가 가장 많이 들어가는 시안 — 모집이 어떻게 흘러가는지 한눈에.
// ============================================================

function GDConceptC() {
  const g = GD_GAME;
  const apps = GD_APPLICANTS;
  const filled = apps.length;
  const remain = g.spotsTotal - filled;
  const pct = (filled / g.spotsTotal);
  const reachedMin = filled >= g.spotsMin;

  // 포지션별 집계
  const posOrder = ['PG', 'SG', 'SF', 'PF', 'C'];
  const posCount = posOrder.map(p => ({
    pos: p, count: apps.filter(a => a.pos === p).length,
    ideal: 2,  // 5x5 표준 (각 2명)
  }));

  // 레벨별
  const levelOrder = ['초급','중급','상급'];
  const levelCount = levelOrder.map(l => apps.filter(a => a.level === l).length);
  const levelMax = Math.max(...levelCount, 1);

  // 타임라인 (가장 최근 5명, 임시 데이터)
  const timeline = [
    { who: '윤도현', when: '방금 전',  d: 0 },
    { who: '송수빈', when: '12분 전',  d: 12 },
    { who: '한기태', when: '38분 전',  d: 38 },
    { who: '정민호', when: '2시간 전', d: 120 },
    { who: '박재현', when: '5시간 전', d: 300 },
  ];

  // 도넛 차트 — SVG (radius 64, stroke 18)
  const R = 64, C = 2 * Math.PI * R;
  const dashFilled = C * pct;

  return (
    <div style={CC.page}>
      <div style={CC.breadcrumb}>
        <span>경기</span> <span style={CC.bcSep}>›</span>
        <span style={{color:'var(--ink)'}}>{g.shortTitle}</span>
      </div>

      {/* 헤더 — 컴팩트 메타 + 큰 타이틀 */}
      <div style={CC.headBlock}>
        <div style={CC.headLeft}>
          <div style={{display:'flex', gap:8, marginBottom:10, flexWrap:'wrap'}}>
            <span style={CC.chipKind}>{g.kind}</span>
            <span style={CC.chipStatus}>● {g.status}</span>
            <span style={CC.chipCountdown}>{g.countdown}</span>
            <span style={CC.chipMeta}>{g.guest}</span>
          </div>
          <h1 style={CC.title}>{g.title}</h1>
          <div style={CC.metaInline}>
            <span><b>{g.date}</b> · <span style={{fontFamily:'var(--ff-mono)'}}>{g.time}</span></span>
            <span style={CC.metaDot}/>
            <span><b>{g.court}</b> <span style={{color:'var(--ink-mute)'}}>{g.area}</span></span>
            <span style={CC.metaDot}/>
            <span>호스트 <b>{g.host.name}</b> · <span style={{fontFamily:'var(--ff-mono)', color:'var(--ink-mute)'}}>★{g.host.rating}·{g.host.games}경기</span></span>
          </div>
        </div>
      </div>

      {/* 본문 그리드 */}
      <div style={CC.body}>
        <div style={{display:'flex', flexDirection:'column', gap:16}}>
          {/* 상단 4개 stat — 도넛 + 3 카드 */}
          <div style={CC.statRow}>
            {/* 도넛 — 모집 진행률 */}
            <div style={CC.donutCard}>
              <div style={CC.eyebrow}>모집 진행률</div>
              <div style={CC.donutWrap}>
                <svg viewBox="0 0 160 160" style={{width:'100%', height:'auto'}}>
                  <circle cx="80" cy="80" r={R} stroke="var(--bg-alt)" strokeWidth="18" fill="none"/>
                  <circle cx="80" cy="80" r={R} stroke="var(--accent)" strokeWidth="18" fill="none"
                    strokeDasharray={`${dashFilled} ${C - dashFilled}`}
                    strokeDashoffset={C / 4}
                    transform="rotate(-90 80 80)"
                    strokeLinecap="round"/>
                  {/* 최소 인원 tick */}
                  <line x1="80" y1={80-R-12} x2="80" y2={80-R+12} stroke="var(--ink)" strokeWidth="2"
                    transform={`rotate(${(g.spotsMin/g.spotsTotal)*360 - 90} 80 80)`}/>
                </svg>
                <div style={CC.donutCenter}>
                  <div style={CC.donutNum}>{filled}<span style={CC.donutDen}>/{g.spotsTotal}</span></div>
                  <div style={CC.donutSub}>{Math.round(pct*100)}% 모집</div>
                </div>
              </div>
              <div style={CC.donutFootRow}>
                <span style={CC.donutFootDot('var(--accent)')}/>
                <span style={CC.donutFootLbl}>확정 {filled}명</span>
                <span style={CC.donutFootDot('var(--bg-alt)', true)}/>
                <span style={CC.donutFootLbl}>빈자리 {remain}명</span>
              </div>
              <div style={{
                marginTop:6, padding:'6px 10px', borderRadius:4,
                background: reachedMin ? 'rgba(28,160,94,.12)' : 'rgba(232,163,59,.14)',
                color: reachedMin ? 'var(--ok)' : 'var(--warn)',
                fontSize:11, fontWeight:700, textAlign:'center', letterSpacing:'.02em',
              }}>
                {reachedMin ? `✓ 최소 ${g.spotsMin}명 충족 — 경기 확정` : `${g.spotsMin - filled}명 더 필요 — 모집 중`}
              </div>
            </div>

            <div style={CC.statCol}>
              <div style={CC.statCard}>
                <div style={CC.eyebrow}>참가비</div>
                <div style={{...CC.statNum, color:'var(--ok)'}}>{g.fee}</div>
                <div style={CC.statSub}>대관 보조 2만원 (참가비 무료)</div>
              </div>
              <div style={CC.statCard}>
                <div style={CC.eyebrow}>마감까지</div>
                <div style={CC.statNum}>{g.countdown}<span style={CC.statSubInline}> · 12시간</span></div>
                <div style={CC.statSub}>모집 마감 04.25 18:00 자동 통보</div>
              </div>
              <div style={CC.statCard}>
                <div style={CC.eyebrow}>평균 레벨</div>
                <div style={CC.statNum}>중급</div>
                <div style={CC.statBarWrap}>
                  <div style={{...CC.statBar, left:'18%'}}>초급</div>
                  <div style={{...CC.statBar, left:'52%', background:'var(--accent)', color:'#fff'}}>중급</div>
                  <div style={{...CC.statBar, left:'80%'}}>상급</div>
                </div>
              </div>
            </div>
          </div>

          {/* 분포 차트 — 포지션 / 레벨 */}
          <div style={CC.distRow}>
            <div style={CC.distCard}>
              <div style={CC.distHead}>
                <div>
                  <div style={CC.eyebrow}>포지션 분포</div>
                  <div style={CC.distTitle}>밸런스 보기</div>
                </div>
                <div style={CC.distLegend}>
                  <span><span style={{...CC.distLegDot, background:'var(--accent)'}}/> 현재</span>
                  <span><span style={{...CC.distLegDot, background:'var(--border-strong)'}}/> 이상치 (각 2명)</span>
                </div>
              </div>
              <div style={CC.distChart}>
                {posCount.map(p => {
                  const cur = p.count;
                  const ideal = p.ideal;
                  const hasGap = cur < ideal;
                  return (
                    <div key={p.pos} style={CC.distRowItem}>
                      <div style={CC.distRowPos}>{p.pos}</div>
                      <div style={CC.distRowBarWrap}>
                        {/* ideal background */}
                        <div style={CC.distRowIdeal}>
                          {Array.from({length:ideal}).map((_, i) => (
                            <div key={i} style={CC.distRowIdealSlot}/>
                          ))}
                        </div>
                        {/* current filled */}
                        <div style={CC.distRowFilled}>
                          {Array.from({length:cur}).map((_, i) => (
                            <div key={i} style={{...CC.distRowFilledSlot, ...(i >= ideal ? {background:'var(--warn)'} : {})}}/>
                          ))}
                        </div>
                      </div>
                      <div style={CC.distRowNum}>
                        {cur} <span style={{color:'var(--ink-mute)', fontWeight:400, fontSize:11}}>/ {ideal}</span>
                        {hasGap && <span style={CC.distRowGap}>+{ideal-cur}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={CC.distFoot}>
                {posCount.filter(p => p.count < p.ideal).length > 0 ? (
                  <span>💡 <b>{posCount.filter(p => p.count < p.ideal).map(p=>p.pos).join(', ')}</b> 포지션이 부족해요. 해당 포지션 신청자에게 우선 알림 발송.</span>
                ) : (
                  <span>✓ 포지션 밸런스 양호</span>
                )}
              </div>
            </div>

            <div style={CC.distCard}>
              <div style={CC.distHead}>
                <div>
                  <div style={CC.eyebrow}>레벨 분포</div>
                  <div style={CC.distTitle}>실력 균형</div>
                </div>
              </div>
              <div style={CC.lvlChart}>
                {levelOrder.map((lv, i) => {
                  const cnt = levelCount[i];
                  const w = (cnt / levelMax) * 100;
                  return (
                    <div key={lv} style={CC.lvlRow}>
                      <div style={CC.lvlLbl}>{lv}</div>
                      <div style={CC.lvlBarWrap}>
                        <div style={{...CC.lvlBar, width:`${w}%`}}/>
                      </div>
                      <div style={CC.lvlCnt}>{cnt}명</div>
                    </div>
                  );
                })}
              </div>
              <div style={CC.uniformBox}>
                <div style={CC.uniformBoxLbl}>유니폼 (HOME / AWAY)</div>
                <div style={{display:'flex', gap:14, marginTop:8}}>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span style={{...CC.uniDot, background:g.uniformHome}}/>
                    <span style={{fontSize:11, fontFamily:'var(--ff-mono)'}}>홈 {g.uniformHome}</span>
                  </div>
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span style={{...CC.uniDot, background:g.uniformAway}}/>
                    <span style={{fontSize:11, fontFamily:'var(--ff-mono)'}}>원정 {g.uniformAway}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 신청자 리스트 + 타임라인 */}
          <div style={CC.rosterCard}>
            <div style={CC.distHead}>
              <div>
                <div style={CC.eyebrow}>참가자 명단 · {filled}명</div>
                <div style={CC.distTitle}>지금 모인 사람들</div>
              </div>
              <div style={CC.rosterToggle}>
                <button style={{...CC.rosterTab, ...CC.rosterTabOn}}>명단</button>
                <button style={CC.rosterTab}>신청순</button>
                <button style={CC.rosterTab}>포지션순</button>
              </div>
            </div>
            <div style={CC.rosterTable}>
              <div style={CC.rosterHead}>
                <div>참가자</div>
                <div>포지션</div>
                <div>레벨</div>
                <div>평점</div>
                <div>신청</div>
              </div>
              {apps.map((a, i) => (
                <div key={a.id} style={CC.rosterRow}>
                  <div style={CC.rosterUser}>
                    <div style={{...CC.rosterAvatar, background:a.color}}>{a.name[0]}</div>
                    <div>
                      <div style={{fontSize:13, fontWeight:700}}>
                        {a.name}
                        {i === 0 && <span style={CC.hostMark}>HOST</span>}
                        {a.badge && a.badge !== '호스트팀' && <span style={CC.rosterBadge}>{a.badge}</span>}
                      </div>
                      <div style={{fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)'}}>@{a.handle}</div>
                    </div>
                  </div>
                  <div style={CC.rosterPos}>{a.pos}</div>
                  <div style={CC.rosterLvl}>{a.level}</div>
                  <div style={CC.rosterRating}>★ {a.rating}</div>
                  <div style={CC.rosterTime}>{timeline[i % timeline.length].when}</div>
                </div>
              ))}
              {/* 빈자리 placeholder rows */}
              {Array.from({length: remain}).map((_, i) => (
                <div key={`e${i}`} style={{...CC.rosterRow, opacity:.55}}>
                  <div style={CC.rosterUser}>
                    <div style={{...CC.rosterAvatar, background:'transparent', border:'1.5px dashed var(--border-strong)', color:'var(--ink-mute)', fontSize:14, fontWeight:300}}>?</div>
                    <div>
                      <div style={{fontSize:13, fontWeight:600, color:'var(--ink-mute)'}}>빈자리 {filled + i + 1}</div>
                      <div style={{fontSize:11, color:'var(--ink-dim)'}}>모집 중</div>
                    </div>
                  </div>
                  <div style={{...CC.rosterPos, color:'var(--ink-dim)'}}>—</div>
                  <div style={{color:'var(--ink-dim)'}}>—</div>
                  <div style={{color:'var(--ink-dim)'}}>—</div>
                  <div style={{color:'var(--ink-dim)', fontSize:11}}>대기 중</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 우측 — sticky 신청 + 타임라인 */}
        <aside style={{display:'flex', flexDirection:'column', gap:14, position:'sticky', top:24, alignSelf:'start'}}>
          <div style={CC.applyCard}>
            <div style={CC.applyTitle}>참가 신청</div>
            <div style={CC.applySplit}>
              <div>
                <div style={CC.applyMetaLbl}>참가비</div>
                <div style={{...CC.applyMetaVal, color:'var(--ok)'}}>{g.fee}</div>
              </div>
              <div style={CC.applyDiv}/>
              <div>
                <div style={CC.applyMetaLbl}>남은</div>
                <div style={{...CC.applyMetaVal, color:'var(--accent)'}}>{remain}자리</div>
              </div>
            </div>

            <div style={{padding:'14px 16px', display:'flex', flexDirection:'column', gap:12}}>
              <div>
                <div style={CC.applyLbl}>참가 포지션</div>
                <div style={CC.posGrid}>
                  {posOrder.map((p, i) => {
                    const isSuggested = posCount.find(x=>x.pos===p && x.count < x.ideal);
                    return (
                      <button key={p} style={{
                        ...CC.posChip,
                        ...(i === 0 ? CC.posChipOn : {}),
                        ...(isSuggested && i !== 0 ? CC.posChipSuggest : {}),
                      }}>
                        {p}
                        {isSuggested && i !== 0 && <span style={CC.posChipDot}/>}
                      </button>
                    );
                  })}
                </div>
                <div style={{fontSize:10, color:'var(--ok)', marginTop:4, fontWeight:600}}>
                  · 점이 표시된 포지션은 부족해요
                </div>
              </div>

              <div>
                <div style={CC.applyLbl}>한마디</div>
                <textarea defaultValue="오랜만에 갑니다 잘 부탁드려요!" style={CC.textarea}/>
              </div>

              <label style={CC.checkboxRow}>
                <input type="checkbox" defaultChecked/>
                <span>취소 시 3시간 전 통보 동의</span>
              </label>

              <button style={CC.btnPrimary}>신청하기 · {g.fee}</button>
              <button style={CC.btnGhost}>호스트에게 문의</button>
            </div>
          </div>

          {/* 실시간 타임라인 */}
          <div style={CC.timelineCard}>
            <div style={CC.eyebrow}>실시간 신청</div>
            <div style={CC.timelineList}>
              {timeline.map((t, i) => (
                <div key={i} style={CC.timelineRow}>
                  <div style={CC.timelineDot}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:12, fontWeight:700}}>{t.who} <span style={{color:'var(--ink-mute)', fontWeight:400}}>참가</span></div>
                    <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:1}}>{t.when}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

const CC = {
  page: { background:'var(--bg)', minHeight:'100%', padding:'20px 32px 32px', fontFamily:'var(--ff-body)', color:'var(--ink)' },
  breadcrumb: { display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12 },
  bcSep: { color:'var(--ink-dim)' },

  headBlock: { marginBottom:16 },
  headLeft: {},
  chipKind: {
    display:'inline-flex', alignItems:'center',
    padding:'3px 10px', fontSize:11, fontWeight:800, letterSpacing:'.04em',
    background:'var(--accent)', color:'#fff', borderRadius:4,
  },
  chipStatus: {
    display:'inline-flex', alignItems:'center', gap:4,
    padding:'3px 10px', fontSize:11, fontWeight:700,
    background:'rgba(28,160,94,.12)', color:'var(--ok)', borderRadius:4,
  },
  chipCountdown: {
    display:'inline-flex', alignItems:'center',
    padding:'3px 10px', fontSize:11, fontWeight:800, fontFamily:'var(--ff-mono)', letterSpacing:'.04em',
    background:'var(--ink)', color:'var(--bg)', borderRadius:4,
  },
  chipMeta: {
    display:'inline-flex', alignItems:'center',
    padding:'3px 10px', fontSize:11, fontWeight:600,
    background:'var(--bg-alt)', color:'var(--ink-soft)', borderRadius:4,
  },
  title: { margin:'0 0 10px', fontSize:26, fontWeight:800, letterSpacing:'-0.015em', lineHeight:1.2 },
  metaInline: {
    display:'flex', alignItems:'center', flexWrap:'wrap', gap:10,
    fontSize:13, color:'var(--ink-soft)', fontWeight:500,
  },
  metaDot: { width:3, height:3, borderRadius:'50%', background:'var(--ink-dim)' },

  body: { display:'grid', gridTemplateColumns:'minmax(0, 1fr) 320px', gap:16 },

  eyebrow: { fontSize:10, fontWeight:800, letterSpacing:'.14em', textTransform:'uppercase', color:'var(--accent)' },

  // stat row
  statRow: { display:'grid', gridTemplateColumns:'minmax(0, 1.05fr) minmax(0, 1.5fr)', gap:14 },
  donutCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:8, padding:'18px 20px',
    display:'flex', flexDirection:'column', gap:8,
  },
  donutWrap: { position:'relative', width:170, margin:'4px auto 0' },
  donutCenter: { position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' },
  donutNum: { fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, color:'var(--ink)', lineHeight:1 },
  donutDen: { fontSize:14, color:'var(--ink-mute)', fontWeight:700, marginLeft:2 },
  donutSub: { fontSize:11, color:'var(--ink-mute)', marginTop:4, fontFamily:'var(--ff-mono)' },
  donutFootRow: { display:'flex', justifyContent:'center', alignItems:'center', gap:10, marginTop:4, fontSize:11 },
  donutFootDot: (color, isBg=false) => ({
    width:10, height:10, borderRadius:2, background:color,
    border: isBg ? '1px solid var(--border-strong)' : 'none', display:'inline-block',
  }),
  donutFootLbl: { color:'var(--ink-soft)', fontWeight:600 },

  statCol: { display:'grid', gridTemplateColumns:'1fr 1fr', gridTemplateRows:'1fr 1fr', gap:8 },
  statCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:6, padding:'14px 16px',
    display:'flex', flexDirection:'column', justifyContent:'space-between', gap:4,
  },
  statNum: { fontFamily:'var(--ff-display)', fontSize:24, fontWeight:900, color:'var(--ink)', lineHeight:1.05, letterSpacing:'-0.01em' },
  statSubInline: { fontSize:12, color:'var(--ink-mute)', fontWeight:600, fontFamily:'var(--ff-body)' },
  statSub: { fontSize:11, color:'var(--ink-mute)', lineHeight:1.4 },
  statBarWrap: { position:'relative', height:20, marginTop:8, background:'var(--bg-alt)', borderRadius:3 },
  statBar: {
    position:'absolute', top:1, transform:'translateX(-50%)',
    padding:'2px 6px', fontSize:9, fontWeight:700,
    background:'var(--bg-elev)', color:'var(--ink-mute)',
    border:'1px solid var(--border)', borderRadius:2,
  },

  // distribution
  distRow: { display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14 },
  distCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)',
    borderRadius:8, padding:'18px 20px',
  },
  distHead: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 },
  distTitle: { margin:'4px 0 0', fontSize:15, fontWeight:800 },
  distLegend: { display:'flex', gap:10, fontSize:10, color:'var(--ink-mute)', fontWeight:600 },
  distLegDot: { display:'inline-block', width:10, height:10, borderRadius:2, marginRight:4, verticalAlign:'middle' },

  distChart: { display:'flex', flexDirection:'column', gap:10 },
  distRowItem: { display:'grid', gridTemplateColumns:'36px 1fr 80px', gap:10, alignItems:'center' },
  distRowPos: { fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:800, color:'var(--ink)' },
  distRowBarWrap: { position:'relative', height:24 },
  distRowIdeal: { position:'absolute', inset:0, display:'flex', gap:3 },
  distRowIdealSlot: { flex:1, background:'var(--bg-alt)', borderRadius:3 },
  distRowFilled: { position:'absolute', inset:0, display:'flex', gap:3 },
  distRowFilledSlot: { flex:0, width:'calc((100% - 3px) / 2)', background:'var(--accent)', borderRadius:3 },
  distRowNum: { fontSize:12, color:'var(--ink-soft)', fontWeight:700, fontFamily:'var(--ff-mono)', textAlign:'right' },
  distRowGap: {
    marginLeft:6, padding:'2px 5px', fontSize:10, fontWeight:700,
    background:'var(--warn)', color:'#000', borderRadius:3,
  },
  distFoot: {
    marginTop:14, padding:'10px 12px', borderRadius:4,
    background:'var(--bg-alt)', fontSize:12, color:'var(--ink-soft)',
    lineHeight:1.5,
  },

  // level chart
  lvlChart: { display:'flex', flexDirection:'column', gap:8 },
  lvlRow: { display:'grid', gridTemplateColumns:'48px 1fr 36px', gap:10, alignItems:'center' },
  lvlLbl: { fontSize:12, fontWeight:600, color:'var(--ink-soft)' },
  lvlBarWrap: { height:14, background:'var(--bg-alt)', borderRadius:3, overflow:'hidden' },
  lvlBar: { height:'100%', background:'linear-gradient(90deg, var(--cafe-blue), var(--accent))', borderRadius:3 },
  lvlCnt: { fontSize:12, fontFamily:'var(--ff-mono)', fontWeight:700, color:'var(--ink-soft)', textAlign:'right' },

  uniformBox: { marginTop:14, paddingTop:14, borderTop:'1px dashed var(--border)' },
  uniformBoxLbl: { fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.06em', textTransform:'uppercase' },
  uniDot: { width:22, height:22, borderRadius:4, display:'inline-block', border:'1px solid rgba(0,0,0,.06)' },

  // roster
  rosterCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'18px 20px' },
  rosterToggle: { display:'flex', gap:4, background:'var(--bg-alt)', padding:3, borderRadius:4 },
  rosterTab: {
    padding:'4px 10px', fontSize:11, fontWeight:600,
    background:'transparent', color:'var(--ink-mute)',
    border:'0', borderRadius:3, cursor:'pointer', fontFamily:'var(--ff-body)',
  },
  rosterTabOn: { background:'var(--bg-elev)', color:'var(--ink)', boxShadow:'0 1px 2px rgba(0,0,0,.06)' },
  rosterTable: { display:'flex', flexDirection:'column' },
  rosterHead: {
    display:'grid', gridTemplateColumns:'minmax(0, 1.8fr) 60px 60px 60px 70px',
    padding:'8px 4px', borderBottom:'1px solid var(--border)',
    fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.06em', textTransform:'uppercase',
  },
  rosterRow: {
    display:'grid', gridTemplateColumns:'minmax(0, 1.8fr) 60px 60px 60px 70px',
    padding:'10px 4px', alignItems:'center',
    borderBottom:'1px solid var(--border)', fontSize:13,
  },
  rosterUser: { display:'flex', alignItems:'center', gap:10 },
  rosterAvatar: {
    width:32, height:32, borderRadius:'50%', color:'#fff',
    display:'flex', alignItems:'center', justifyContent:'center',
    fontWeight:800, fontSize:13, flexShrink:0,
  },
  hostMark: {
    marginLeft:6, padding:'1px 5px', fontSize:9, fontWeight:800,
    background:'var(--accent)', color:'#fff', borderRadius:2, letterSpacing:'.04em', verticalAlign:'middle',
  },
  rosterBadge: {
    marginLeft:6, padding:'1px 5px', fontSize:9, fontWeight:700,
    background:'var(--bg-alt)', color:'var(--ink-soft)',
    border:'1px solid var(--border)', borderRadius:2, verticalAlign:'middle',
  },
  rosterPos: { fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:800, color:'var(--cafe-blue-deep)' },
  rosterLvl: { fontSize:12, color:'var(--ink-soft)', fontWeight:600 },
  rosterRating: { fontSize:12, fontFamily:'var(--ff-mono)', color:'var(--ink-soft)', fontWeight:600 },
  rosterTime: { fontSize:11, color:'var(--ink-mute)', fontFamily:'var(--ff-mono)' },

  // apply (right rail)
  applyCard: {
    background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8,
    overflow:'hidden', boxShadow:'0 4px 12px rgba(15,23,42,.06)',
  },
  applyTitle: {
    padding:'14px 16px', fontSize:14, fontWeight:800, letterSpacing:'-0.01em',
    borderBottom:'1px solid var(--border)',
  },
  applySplit: {
    display:'flex', padding:'14px 16px', background:'var(--bg-alt)', borderBottom:'1px solid var(--border)',
  },
  applyMetaLbl: { fontSize:10, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:2 },
  applyMetaVal: { fontSize:18, fontWeight:800, fontFamily:'var(--ff-display)' },
  applyDiv: { width:1, background:'var(--border)', margin:'0 14px' },

  applyLbl: { fontSize:11, fontWeight:700, color:'var(--ink-soft)', letterSpacing:'.04em', marginBottom:6 },
  posGrid: { display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:4 },
  posChip: {
    padding:'8px 0', fontSize:11, fontWeight:700, fontFamily:'var(--ff-mono)',
    background:'var(--bg-elev)', color:'var(--ink-mute)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer',
    position:'relative',
  },
  posChipOn: { background:'var(--accent)', color:'#fff', borderColor:'var(--bdr-red-ink)' },
  posChipSuggest: {
    background:'rgba(28,160,94,.08)', borderColor:'var(--ok)', color:'var(--ok)',
  },
  posChipDot: {
    position:'absolute', top:3, right:3, width:5, height:5, borderRadius:'50%', background:'var(--ok)',
  },

  textarea: {
    width:'100%', minHeight:56, padding:'8px 10px',
    fontFamily:'var(--ff-body)', fontSize:13,
    background:'var(--bg-elev)', color:'var(--ink)',
    border:'1px solid var(--border-strong)', borderRadius:4,
    resize:'vertical', boxSizing:'border-box',
  },
  checkboxRow: { display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--ink-soft)' },

  btnPrimary: {
    width:'100%', padding:'12px', fontSize:14, fontWeight:800,
    background:'var(--accent)', color:'#fff',
    border:'0', borderRadius:4, cursor:'pointer', fontFamily:'var(--ff-body)',
  },
  btnGhost: {
    width:'100%', padding:'10px', fontSize:12, fontWeight:600,
    background:'var(--bg-elev)', color:'var(--ink-soft)',
    border:'1px solid var(--border-strong)', borderRadius:4, cursor:'pointer', fontFamily:'var(--ff-body)',
  },

  timelineCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, padding:'14px 16px' },
  timelineList: { display:'flex', flexDirection:'column', gap:10, marginTop:10, position:'relative' },
  timelineRow: { display:'flex', alignItems:'flex-start', gap:10 },
  timelineDot: {
    width:8, height:8, borderRadius:'50%', background:'var(--accent)',
    marginTop:4, flexShrink:0,
    boxShadow:'0 0 0 3px rgba(227,27,35,.12)',
  },
};

window.GDConceptC = GDConceptC;
