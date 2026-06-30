/* global React, GAMES, TEAMS, Icon, WaitlistPromoteModal, CountdownText */
/**
 * GameDetail — /games/[id] (등급 A · M2·M3·M4)
 *
 * Why: 신청 → 대기열 → 승격, 호스트 출석 체크, 종료 후 평점 유도를 한 화면에 통합.
 * Pattern: 기존 정보/안내/참가자 카드 보존 + 신청 패널 상태머신 + 호스트 출석 섹션 + 평점 CTA.
 *
 * 진입: 경기 목록 카드 / 알림(자리 알림)
 * 복귀: breadcrumb / AppNav
 * 상태: 모집중·정원마감(대기신청)·대기중(대기 N번)·승격(확정 CTA+카운트다운)·확정 / 경기단계 모집중·당일·종료
 * 권한: 출석 체크는 호스트만 노출
 */

function GameDetail({ setRoute }) {
  const g = GAMES[0];
  const applicants = [
    { name: 'hoops_m', level: 'L.6', pos: '가드' },
    { name: 'ssg_pg', level: 'L.5', pos: '가드' },
    { name: 'kim_j', level: 'L.4', pos: '포워드' },
    { name: 'iron_c', level: 'L.7', pos: '센터' },
    { name: 'pivot_mia', level: 'L.5', pos: '포워드' },
    { name: 'block_k', level: 'L.4', pos: '가드' },
    { name: 'dawn_r', level: 'L.3', pos: '포워드' },
  ];

  // 시안 미리보기 상태 (실제 앱은 경기 status / 신청 status 로 자동 전환)
  const [phase, setPhase] = React.useState('recruit'); // recruit | gameday | ended
  const [applyState, setApplyState] = React.useState('open'); // open | full | waiting | promoted | confirmed
  const [isHost, setIsHost] = React.useState(true);
  const [rated, setRated] = React.useState(false);
  const [promoOpen, setPromoOpen] = React.useState(false);
  const [attendance, setAttendance] = React.useState({}); // name -> true(출석)/false(미출석)
  const [savingAtt, setSavingAtt] = React.useState(false);

  const setAtt = (name, present) => {
    setAttendance(a => ({ ...a, [name]: present }));
    setSavingAtt(true);
    setTimeout(() => setSavingAtt(false), 500);
  };
  const presentCount = applicants.filter(a => attendance[a.name] === true).length;
  const absentCount = applicants.filter(a => attendance[a.name] === false).length;

  const showAttendance = isHost && (phase === 'gameday' || phase === 'ended');
  const showHostPanel = isHost && phase !== 'ended';
  const showRatingBanner = phase === 'ended' && !rated;

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a>
        <span>›</span>
        <a onClick={()=>setRoute('games')} style={{cursor:'pointer'}}>경기</a>
        <span>›</span>
        <span style={{color:'var(--ink)'}}>{g.title}</span>
      </div>

      {/* 시안 상태 미리보기 바 */}
      <div style={{display:'flex', gap:14, alignItems:'center', flexWrap:'wrap', padding:'10px 14px', border:'1px dashed var(--border)', borderRadius:6, marginBottom:16, background:'var(--bg-alt)'}}>
        <span style={{fontSize:10, fontWeight:800, letterSpacing:'.1em', color:'var(--ink-dim)', whiteSpace:'nowrap'}}>시안 미리보기</span>
        <PreviewSeg label="경기단계" value={phase} setValue={setPhase} options={[['recruit','모집중'],['gameday','경기당일'],['ended','종료']]}/>
        <PreviewSeg label="신청상태" value={applyState} setValue={setApplyState} options={[['open','모집중'],['full','정원마감'],['waiting','대기중'],['promoted','승격'],['confirmed','확정']]}/>
        <label style={{display:'flex', gap:6, alignItems:'center', fontSize:12, color:'var(--ink-soft)', cursor:'pointer'}}>
          <input type="checkbox" checked={isHost} onChange={e=>setIsHost(e.target.checked)}/> 호스트 보기
        </label>
      </div>

      {/* 시안 D — 평점 CTA 배너 (종료 경기 한정, 미작성 시) */}
      {showRatingBanner && (
        <div className="card" style={{padding:'16px 20px', marginBottom:16, display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', borderLeft:'3px solid var(--accent)', background:'color-mix(in oklab, var(--accent) 7%, transparent)'}}>
          <div style={{fontSize:24}}>⭐</div>
          <div style={{flex:1, minWidth:160}}>
            <div style={{fontWeight:800, fontSize:15}}>오늘 같이 뛴 사람들, 어땠나요?</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>평점은 매너 점수에 반영됩니다 · 미작성 1건</div>
          </div>
          <button className="btn btn--primary" onClick={()=>setRoute('gameReport')}>평점 남기기 →</button>
        </div>
      )}

      <div className="gd-grid" style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 340px', gap:24, alignItems:'flex-start'}}>
        <div>
          <div className="card" style={{padding:'24px 28px', marginBottom:16}}>
            <div style={{display:'flex', gap:8, marginBottom:12, flexWrap:'wrap'}}>
              <span className="badge badge--soft">{g.kind === 'pickup' ? '픽업' : g.kind === 'guest' ? '게스트' : '스크림'}</span>
              {phase === 'ended' && <span className="badge badge--ghost">경기 종료</span>}
              {phase === 'gameday' && <span className="badge badge--ok">오늘 경기</span>}
              {g.tags.map(t => <span key={t} className="badge badge--ghost">{t}</span>)}
            </div>
            <h1 style={{margin:'0 0 14px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>{g.title}</h1>
            <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:14, padding:'18px 20px', background:'var(--bg-alt)', borderRadius:8}}>
              {[
                ['날짜', g.date], ['시간', g.time, true], ['장소', `${g.court}`],
                ['참가비', g.fee], ['수준', g.level], ['호스트', g.host],
              ].map(([k, v, mono]) => (
                <div key={k}>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'.04em'}}>{k}</div>
                  <div style={{fontWeight:700, marginTop:3, fontFamily: mono ? 'var(--ff-mono)' : 'inherit'}}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{padding:'22px 26px', marginBottom:16}}>
            <h2 style={{margin:'0 0 10px', fontSize:16, fontWeight:700}}>경기 안내</h2>
            <p style={{color:'var(--ink-soft)', margin:0, lineHeight:1.7, fontSize:14}}>
              매주 목요일 진행되는 미사강변체육관 정기 픽업입니다. 6:4 팀 분배, 21점 선취제로 진행되며 심판은 로테이션으로 돌아갑니다.
              주차장 무료 이용 가능하고, 실내 탈의실·샤워실 완비되어 있습니다. 참가비는 코트 대여료 충당용입니다.
              부상 방지를 위해 농구화 지참 필수입니다.
            </p>
          </div>

          {/* 시안 E-1 — 호스트 신청·대기열 관리 패널 (호스트 전용) */}
          {showHostPanel && <HostApplicationsPanel max={g.spots} setRoute={setRoute}/>}

          {/* 시안 C — 호스트 출석 체크 섹션 (호스트 전용) */}
          {showAttendance && (
            <div className="card" style={{padding:'22px 26px', marginBottom:16}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6, flexWrap:'wrap', gap:8}}>
                <h2 style={{margin:0, fontSize:16, fontWeight:700}}>출석 체크 <span style={{fontSize:11, fontWeight:700, color:'var(--accent)', marginLeft:6}}>호스트 전용</span></h2>
                <div style={{fontSize:12, color:'var(--ink-mute)', display:'flex', gap:10, alignItems:'center'}}>
                  <span style={{color:'var(--ok)', fontWeight:700}}>출석 {presentCount}</span>
                  <span style={{color:'var(--warn)', fontWeight:700}}>미출석 {absentCount}</span>
                  {savingAtt && <span style={{color:'var(--ink-dim)'}}>저장중…</span>}
                </div>
              </div>
              <p style={{margin:'0 0 14px', fontSize:12, color:'var(--ink-mute)'}}>
                {phase === 'gameday' ? '경기 당일 현장에서 출석을 확인하세요' : '미출석 처리된 참가자는 리포트에서 노쇼로 표시됩니다'}
              </p>
              <div style={{display:'flex', flexDirection:'column', gap:0}}>
                {applicants.map((a, i) => {
                  const v = attendance[a.name];
                  return (
                    <div key={a.name} style={{display:'grid', gridTemplateColumns:'40px 1fr auto', gap:12, alignItems:'center', padding:'10px 0', borderTop: i>0 ? '1px solid var(--border)' : 0}}>
                      <div style={{width:40, height:40, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700}}>{a.name.slice(0,2).toUpperCase()}</div>
                      <div style={{minWidth:0}}>
                        <div style={{fontWeight:700, fontSize:14}}>{a.name}</div>
                        <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{a.level} · {a.pos}</div>
                      </div>
                      <div className="att-toggle" role="group" aria-label={`${a.name} 출석`}>
                        <button type="button" onClick={()=>setAtt(a.name, true)} data-active={v===true} data-tone="present">출석</button>
                        <button type="button" onClick={()=>setAtt(a.name, false)} data-active={v===false} data-tone="absent">미출석</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="card" style={{padding:'22px 26px'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
              <h2 style={{margin:0, fontSize:16, fontWeight:700}}>참가자 <span style={{fontSize:12, color:'var(--ink-mute)', fontWeight:500, marginLeft:6}}>{applicants.length}/{g.spots}</span></h2>
              <span style={{fontSize:12, color:'var(--ink-dim)'}}>승인완료 {applicants.length}명 · 대기 {g.waitlist || 0}명</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:8}}>
              {applicants.map(a => (
                <div key={a.name} style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:10}}>
                  <div style={{width:32, height:32, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700}}>{a.name.slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:700, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{a.name}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{a.level} · {a.pos}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="gd-aside" style={{position:'sticky', top:120}}>
          <ApplyPanel g={g} phase={phase} applyState={applyState} setApplyState={setApplyState} onPromote={()=>setPromoOpen(true)} setRoute={setRoute}/>
        </aside>
      </div>

      {promoOpen && (
        <WaitlistPromoteModal
          reg={{ title:g.title, court:g.court, when:`${g.date.split(' ')[1] || ''} ${g.time.split(' ')[0]}` }}
          onConfirm={()=>{ setApplyState('confirmed'); setPromoOpen(false); }}
          onClose={()=>setPromoOpen(false)}/>
      )}

      <style>{`
        .att-toggle { display: inline-flex; border: 1px solid var(--border); border-radius: var(--radius-chip); overflow: hidden; }
        .att-toggle button {
          min-height: 44px; padding: 0 16px; background: transparent; border: 0; cursor: pointer;
          font-size: 13px; font-weight: 700; color: var(--ink-mute);
        }
        .att-toggle button + button { border-left: 1px solid var(--border); }
        .att-toggle button[data-active="true"][data-tone="present"] { background: var(--ok); color: var(--ink-on-brand); }
        .att-toggle button[data-active="true"][data-tone="absent"] { background: var(--warn); color: #000; }
        .hap-sec + .hap-sec { border-top: 1px solid var(--border); margin-top: 18px; padding-top: 18px; }
        .hap-row { display: grid; grid-template-columns: 40px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; }
        .hap-row + .hap-row { border-top: 1px solid var(--border); }
        .hap-actions { display: flex; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
        .hap-actions .btn { min-height: 36px; }
        @media (max-width: 720px) {
          .hap-row { grid-template-columns: 36px 1fr; }
          .hap-actions { grid-column: 1 / -1; justify-content: stretch; margin-top: 4px; }
          .hap-actions .btn { flex: 1 1 0; min-height: 44px; }
        }
        @media (max-width: 900px) { .gd-grid { grid-template-columns: 1fr !important; } .gd-aside { position: static !important; } }
        @media (max-width: 720px) { .att-toggle button { padding: 0 14px; } }
      `}</style>
    </div>
  );
}

function PreviewSeg({ label, value, setValue, options }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:6}}>
      <span style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, whiteSpace:'nowrap'}}>{label}</span>
      <div style={{display:'inline-flex', border:'1px solid var(--border)', borderRadius:'var(--radius-chip)', overflow:'hidden'}}>
        {options.map(([k, l]) => (
          <button key={k} onClick={()=>setValue(k)} style={{
            padding:'5px 9px', background: value===k ? 'var(--cafe-blue)' : 'transparent',
            color: value===k ? 'var(--ink-on-brand)' : 'var(--ink-soft)', border:0, cursor:'pointer',
            fontSize:11, fontWeight:700,
          }}>{l}</button>
        ))}
      </div>
    </div>
  );
}

function ApplyPanel({ g, phase, applyState, setApplyState, onPromote, setRoute }) {
  if (phase === 'ended') {
    return (
      <div className="card" style={{padding:'20px 22px', textAlign:'center'}}>
        <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>경기 종료</div>
        <div style={{fontSize:14, color:'var(--ink-soft)', marginBottom:14, lineHeight:1.6}}>경기가 끝났어요.<br/>함께한 사람들을 평가해 주세요.</div>
        <button className="btn btn--primary btn--xl" style={{width:'100%', marginBottom:8}} onClick={()=>setRoute('gameReport')}>평점 남기기 →</button>
        <button className="btn" style={{width:'100%'}} onClick={()=>setRoute('gameResult')}>경기 결과 보기</button>
      </div>
    );
  }

  const filled = applyState === 'full' || applyState === 'waiting' || applyState === 'promoted';
  const shownApplied = filled ? g.spots : g.applied;
  const remain = g.spots - shownApplied;

  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <div style={{padding:'18px 20px', borderBottom:'1px solid var(--border)'}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:10}}>
          <div style={{fontSize:11, color:'var(--accent)', fontWeight:800, letterSpacing:'.1em'}}>
            {applyState === 'confirmed' ? '참가 확정' : filled ? '대기 신청' : '참가 신청'}
          </div>
          <div style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700}}>
            {remain > 0 ? `${remain}자리 남음` : `정원 마감 · 대기 ${g.waitlist || 0}`}
          </div>
        </div>
        <div style={{height:8, background:'var(--bg-alt)', borderRadius:4, overflow:'hidden'}}>
          <div style={{width:`${Math.min(100,(shownApplied/g.spots)*100)}%`, height:'100%', background: remain>0 ? 'var(--cafe-blue)' : 'var(--ink-mute)'}}/>
        </div>
      </div>

      <div style={{padding:'18px 20px', display:'flex', flexDirection:'column', gap:12}}>
        {/* 확정 */}
        {applyState === 'confirmed' && (
          <div style={{textAlign:'center', padding:'8px 0'}}>
            <div style={{width:52, height:52, borderRadius:'50%', background:'color-mix(in oklab, var(--ok) 16%, transparent)', color:'var(--ok)', display:'grid', placeItems:'center', fontSize:28, fontWeight:900, margin:'0 auto 10px'}}>✓</div>
            <div style={{fontWeight:800, fontSize:16, marginBottom:4}}>참가 확정 완료</div>
            <div style={{fontSize:12, color:'var(--ink-mute)'}}>경기 3시간 전까지 취소 가능합니다</div>
          </div>
        )}

        {/* 승격 — 확정 CTA + 카운트다운 */}
        {applyState === 'promoted' && (
          <>
            <div style={{padding:'12px 14px', borderRadius:6, background:'color-mix(in oklab, var(--accent) 10%, transparent)', borderLeft:'3px solid var(--accent)'}}>
              <div style={{fontSize:11, fontWeight:800, color:'var(--accent)', letterSpacing:'.08em', marginBottom:4}}>🔔 자리가 났어요</div>
              <div style={{fontSize:13, color:'var(--ink-soft)', marginBottom:6}}>대기 1번 → 확정 가능</div>
              <div style={{fontSize:13, color:'var(--accent)'}}><CountdownText seconds={1790}/></div>
            </div>
            <button className="btn btn--primary btn--xl" onClick={onPromote}>참가 확정하기</button>
            <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>시간 초과 시 다음 순번에게 넘어갑니다</div>
          </>
        )}

        {/* 대기중 — 대기 N번 */}
        {applyState === 'waiting' && (
          <>
            <div style={{display:'flex', alignItems:'center', gap:12, padding:'14px', background:'var(--bg-alt)', borderRadius:6}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:34, fontWeight:900, color:'var(--warn)', lineHeight:1}}>2</div>
              <div>
                <div style={{fontWeight:800, fontSize:14}}>대기 2번</div>
                <div style={{fontSize:12, color:'var(--ink-mute)'}}>빈자리 발생 시 순서대로 알림</div>
              </div>
            </div>
            <button className="btn" onClick={()=>setApplyState('full')}>대기 취소</button>
            <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>알림을 받으면 30분 안에 확정해야 해요</div>
          </>
        )}

        {/* 정원 마감 — 대기 신청 */}
        {applyState === 'full' && (
          <>
            <div style={{fontSize:13, color:'var(--ink-soft)', lineHeight:1.6}}>정원이 찼어요. 대기를 걸어두면 빈자리가 생길 때 알려드려요.</div>
            <button className="btn btn--accent btn--xl" onClick={()=>setApplyState('waiting')}>대기 신청 · 현재 {g.waitlist || 0}명</button>
            <div style={{fontSize:11, color:'var(--ink-dim)', textAlign:'center'}}>대기는 무료이며 언제든 취소할 수 있어요</div>
          </>
        )}

        {/* 모집중 — 신청 */}
        {applyState === 'open' && (
          <>
            <div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:4}}>신청자 정보</div>
              <div style={{padding:'10px 12px', background:'var(--bg-alt)', borderRadius:6}}>
                <div style={{fontWeight:700, fontSize:13}}>rdm_captain</div>
                <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>L.8 · 가드</div>
              </div>
            </div>
            <div>
              <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:700, marginBottom:4}}>한마디 (선택)</div>
              <textarea className="input" rows={3} defaultValue="목요일 오랜만에 뛰러 갑니다!" style={{resize:'vertical'}}/>
            </div>
            <label style={{display:'flex', alignItems:'center', gap:8, fontSize:12}}>
              <input type="checkbox" defaultChecked/>
              <span>취소 시 최소 3시간 전 통보에 동의</span>
            </label>
            <button className="btn btn--primary btn--xl" onClick={()=>setApplyState('confirmed')}>신청하기 · {g.fee}</button>
          </>
        )}

        <div style={{display:'flex', gap:6}}>
          <button className="btn btn--sm" style={{flex:1}}>💬 호스트 문의</button>
          <button className="btn btn--sm" style={{flex:1}}>🔖 저장</button>
        </div>
      </div>
    </div>
  );
}

/* ── 시안 E-1 · 호스트 신청·대기열 관리 패널 ──────────────────
 * status 정본: registration 0=신청완료(대기 승인) / 1=승인(확정) / 3=대기(waitlist)
 * 정책: 빈자리 발생 → 대기 1번 자동 알림 + promotion_deadline. 수동 강제 승격은 보조 액션.
 */
function HostApplicationsPanel({ max, setRoute }) {
  const [pending, setPending] = React.useState([
    { id:'a1', name:'hoops_m', level:'L.6', pos:'가드', guest:false },
    { id:'a2', name:'guest_jun', level:'L.5', pos:'포워드', guest:true, career:'동호인 3년', note:'목요일 자주 갑니다. 슛 좋아요!' },
    { id:'a3', name:'kim_j', level:'L.4', pos:'포워드', guest:false },
  ]);
  const [confirmed, setConfirmed] = React.useState([
    { id:'c1', name:'rdm_captain', level:'L.8', pos:'가드' },
    { id:'c2', name:'ssg_pg', level:'L.5', pos:'가드' },
    { id:'c3', name:'iron_c', level:'L.7', pos:'센터' },
    { id:'c4', name:'pivot_mia', level:'L.5', pos:'포워드' },
    { id:'c5', name:'block_k', level:'L.4', pos:'가드' },
    { id:'c6', name:'dawn_r', level:'L.3', pos:'포워드' },
  ]);
  const [waitlist, setWaitlist] = React.useState([
    { id:'w1', name:'late_kim', level:'L.5', pos:'가드', guest:false, notified:false },
    { id:'w2', name:'guest_min', level:'L.4', pos:'센터', guest:true, career:'입문 1년', note:'잘 부탁드립니다', notified:false },
  ]);
  const [saving, setSaving] = React.useState(false);
  const flash = () => { setSaving(true); setTimeout(()=>setSaving(false), 500); };

  const isFull = confirmed.length >= max;

  const approve = (a) => {
    if (confirmed.length >= max) return;
    setPending(p => p.filter(x => x.id !== a.id));
    setConfirmed(c => [...c, { id:a.id, name:a.name, level:a.level, pos:a.pos }]);
    flash();
  };
  const reject = (a) => { setPending(p => p.filter(x => x.id !== a.id)); flash(); };
  const notify = (w) => { // 빈자리 발생 → 대기 1번 알림 전송 (자동 정책의 수동 트리거)
    setWaitlist(list => list.map(x => x.id === w.id ? { ...x, notified:true } : x));
    flash();
  };
  const forcePromote = (w) => { // 보조: 수동 강제 승격
    setWaitlist(list => list.filter(x => x.id !== w.id));
    setConfirmed(c => [...c, { id:w.id, name:w.name, level:w.level, pos:w.pos }]);
    flash();
  };

  const Avatar = ({ name }) => (
    <div style={{width:40, height:40, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700}}>{name.slice(0,2).toUpperCase()}</div>
  );
  const Meta = ({ a }) => (
    <div style={{minWidth:0}}>
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2, flexWrap:'wrap'}}>
        <span style={{fontWeight:700, fontSize:14}}>{a.name}</span>
        {a.guest && <span className="badge badge--soft" style={{fontSize:10}}>GUEST</span>}
        {a.guest && a.career && <span style={{fontSize:11, color:'var(--ink-dim)'}}>{a.career}</span>}
      </div>
      <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{a.level} · {a.pos}</div>
      {a.guest && a.note && (
        <div style={{fontSize:12, color:'var(--ink-soft)', marginTop:4, paddingLeft:10, borderLeft:'2px solid var(--border)', lineHeight:1.5}}>"{a.note}"</div>
      )}
    </div>
  );
  const SecHead = ({ title, count, tone, extra }) => (
    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
      <h3 style={{margin:0, fontSize:13, fontWeight:800, letterSpacing:'.02em'}}>{title}</h3>
      <span style={{fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:700, color: tone || 'var(--ink-mute)'}}>{count}</span>
      {extra}
    </div>
  );

  return (
    <div className="card" style={{padding:'22px 26px', marginBottom:16}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6, flexWrap:'wrap', gap:8}}>
        <h2 style={{margin:0, fontSize:16, fontWeight:700}}>신청 관리 <span style={{fontSize:11, fontWeight:700, color:'var(--accent)', marginLeft:6}}>호스트 전용</span></h2>
        <div style={{fontSize:12, color:'var(--ink-mute)', display:'flex', gap:10, alignItems:'center'}}>
          <span style={{fontWeight:700, color: isFull ? 'var(--accent)' : 'var(--ink-soft)'}}>승인 {confirmed.length}/{max}</span>
          <span>대기 {waitlist.length}</span>
          {saving && <span style={{color:'var(--ink-dim)'}}>저장중…</span>}
        </div>
      </div>
      {isFull
        ? <div style={{fontSize:12, fontWeight:700, color:'var(--accent)', marginBottom:16, display:'flex', alignItems:'center', gap:6}}>● 정원 마감 · 확정</div>
        : <p style={{margin:'0 0 16px', fontSize:12, color:'var(--ink-mute)'}}>승인하면 참가 확정되고 정원이 차면 자동으로 경기가 확정됩니다</p>}

      {/* 1. 대기 승인 (status 0) */}
      <div className="hap-sec">
        <SecHead title="대기 승인" count={pending.length} tone="var(--warn)"
          extra={isFull && pending.length>0 ? <span style={{fontSize:11, color:'var(--ink-dim)'}}>정원 마감 — 승인 불가</span> : null}/>
        {pending.length === 0 ? (
          <div style={{fontSize:13, color:'var(--ink-dim)', padding:'10px 0'}}>새 신청이 없어요</div>
        ) : pending.map(a => (
          <div key={a.id} className="hap-row">
            <Avatar name={a.name}/>
            <Meta a={a}/>
            <div className="hap-actions">
              <button className="btn btn--sm btn--primary" disabled={isFull} onClick={()=>approve(a)}>승인</button>
              <button className="btn btn--sm" onClick={()=>reject(a)}>거절</button>
            </div>
          </div>
        ))}
      </div>

      {/* 2. 확정 참가자 (status 1) */}
      <div className="hap-sec">
        <SecHead title="확정 참가자" count={`${confirmed.length}/${max}`} tone="var(--ok)"
          extra={<button className="btn btn--sm btn--ghost" style={{marginLeft:'auto'}} onClick={()=>setRoute('gameReport')}>출석 체크 →</button>}/>
        {confirmed.length === 0 ? (
          <div style={{fontSize:13, color:'var(--ink-dim)', padding:'10px 0'}}>아직 확정된 참가자가 없어요</div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:8}}>
            {confirmed.map(a => (
              <div key={a.id} style={{padding:'8px 10px', background:'var(--bg-alt)', borderRadius:6, display:'flex', alignItems:'center', gap:8}}>
                <div style={{width:30, height:30, borderRadius:'50%', background:'var(--ink-soft)', color:'var(--bg)', display:'grid', placeItems:'center', fontFamily:'var(--ff-mono)', fontSize:10, fontWeight:700}}>{a.name.slice(0,2).toUpperCase()}</div>
                <div style={{minWidth:0}}>
                  <div style={{fontWeight:700, fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{a.name}</div>
                  <div style={{fontSize:10, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{a.level} · {a.pos}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. 대기열 (status 3) */}
      <div className="hap-sec">
        <SecHead title="대기열" count={waitlist.length} tone="var(--accent)"/>
        {waitlist.length === 0 ? (
          <div style={{fontSize:13, color:'var(--ink-dim)', padding:'10px 0'}}>대기 중인 신청자가 없어요</div>
        ) : waitlist.map((w, i) => (
          <div key={w.id} className="hap-row">
            <div style={{width:40, height:40, borderRadius:'50%', background:'color-mix(in oklab, var(--accent) 14%, transparent)', color:'var(--accent)', display:'grid', placeItems:'center', fontFamily:'var(--ff-display)', fontSize:17, fontWeight:900}}>{i+1}</div>
            <Meta a={w}/>
            <div className="hap-actions">
              {w.notified ? (
                <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2}}>
                  <span style={{fontSize:12, fontWeight:700, color:'var(--accent)'}}>알림 전송됨 · 응답 대기</span>
                  <span style={{fontSize:11, color:'var(--ink-mute)'}}><CountdownText seconds={1790}/></span>
                  <button className="btn btn--sm btn--ghost" style={{marginTop:2}} onClick={()=>forcePromote(w)}>수동 승격</button>
                </div>
              ) : (
                <button className="btn btn--sm" disabled={!isFull && confirmed.length < max ? false : false} onClick={()=>notify(w)}>승격 알림</button>
              )}
            </div>
          </div>
        ))}
        {waitlist.length > 0 && (
          <p style={{margin:'12px 0 0', fontSize:11, color:'var(--ink-dim)', lineHeight:1.5}}>
            빈자리가 생기면 대기 1번에게 자동으로 알림이 가고, 30분 안에 응답하지 않으면 다음 순번으로 넘어갑니다. 수동 승격은 즉시 확정 처리됩니다.
          </p>
        )}
      </div>
    </div>
  );
}

window.GameDetail = GameDetail;