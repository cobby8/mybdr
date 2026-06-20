/* global React */
/**
 * MyGames — /games/my-games (등급 A · 시안 E-2 · 호스트 대시보드 강화)
 *
 * Why: 참가자(신청내역)와 주최자(내가 만든 경기) 흐름을 한 화면에서. 호스트가 경기별
 *      신청현황·마감·확정·취소를 빠르게 운영. status 단일 출처(game-status.ts) 기준.
 * Pattern: 상단 참가자 신청내역(5탭, 대기 추가) 보존 + 하단 호스트 운영 카드 그리드.
 *
 * 상태 정본: game.status 1=모집중 / 2=확정 / 3=완료 / 4=취소
 *           registration.status 0=신청완료 / 1=승인(확정) / 2=거절 / 3=대기
 * 권한: 하단 호스트 카드 = me===organizer_id. (시안에선 mock 데이터로 표현)
 */

// ── game.status 정본 라벨/토큰 (단일 출처) ──────────────────────
const GAME_STATUS = {
  1: { label: '모집중', cls: 'badge--ok',    tone: 'var(--ok)' },
  2: { label: '확정',   cls: 'badge--soft',  tone: 'var(--cafe-blue)' },
  3: { label: '완료',   cls: 'badge--ghost', tone: 'var(--ink-mute)' },
  4: { label: '취소',   cls: 'badge--ghost', tone: 'var(--ink-dim)' },
};

function MyGames({ setRoute }) {
  // ── 상단: 참가자 신청내역 (대기 탭 추가) ──
  const [tab, setTab] = React.useState('confirmed');
  const myRegs = [
    { status:'confirmed', kind:'🏀', title:'목요일 저녁 하남미사 픽업 · 6:4', court:'미사강변체육관', when:'목 20:30', meta:'참가 확정' },
    { status:'confirmed', kind:'🤝', title:'성동구민체육관 게스트', court:'성동구민체육관', when:'일 13:00', meta:'게스트 확정' },
    { status:'pending',   kind:'🏀', title:'반포 주말 오전 3x3', court:'반포종합사회복지관', when:'토 09:00', meta:'승인 대기' },
    { status:'waiting',   kind:'🤝', title:'IRON WOLVES 주말 연습경기 게스트', court:'용산국민체육센터', when:'토 14:00', meta:'대기 3번' },
    { status:'completed', kind:'🏀', title:'올림픽공원 5v5', court:'올림픽공원 농구장', when:'1주 전', meta:'24-19 승 · 평점 미작성' },
    { status:'cancelled', kind:'🏀', title:'한강 농구코트 픽업', court:'반포한강공원', when:'어제', meta:'주최자 취소 · 환불 완료' },
  ];
  const regTabs = [
    { id:'confirmed', label:'확정' },
    { id:'pending',   label:'검토중' },
    { id:'waiting',   label:'대기' },
    { id:'completed', label:'완료' },
    { id:'cancelled', label:'취소' },
  ];
  const regBadge = {
    confirmed:{ label:'확정', cls:'badge--ok' }, pending:{ label:'검토중', cls:'badge--warn' },
    waiting:{ label:'대기중', cls:'badge--soft' }, completed:{ label:'완료', cls:'badge--ghost' },
    cancelled:{ label:'취소', cls:'badge--ghost' },
  };
  const regShown = myRegs.filter(r => r.status === tab);
  const regCount = (id) => myRegs.filter(r => r.status === id).length;

  // ── 하단: 호스트 경기 (내가 만든 경기) ──
  const [games, setGames] = React.useState([
    { id:'h1', kind:'pickup', title:'목요일 저녁 하남미사 픽업 · 6:4', court:'미사강변체육관', area:'하남시', when:'04.25 (목) 20:30', status:1, max:10, approved:7, pending:2, waiting:0 },
    { id:'h2', kind:'guest',  title:'주말 게스트 모집 · 3v3 빠른 경기', court:'성동구민체육관', area:'성동구', when:'04.27 (일) 13:00', status:2, max:6, approved:6, pending:0, waiting:2 },
    { id:'h3', kind:'pickup', title:'반포 주말 오전 픽업 (정원 미달)', court:'반포종합사회복지관', area:'서초구', when:'04.26 (토) 09:00', status:1, max:12, approved:5, pending:1, waiting:0 },
    { id:'h4', kind:'scrimmage', title:'3POINT 내부 스크림', court:'장충체육관', area:'중구', when:'04.18 (목) 20:00', status:3, max:10, approved:10, pending:0, waiting:0 },
  ]);
  const [cancelTarget, setCancelTarget] = React.useState(null);
  const [toast, setToast] = React.useState('');

  const kindLabel = { pickup:'픽업', guest:'게스트', scrimmage:'스크림' };
  const kindColor = { pickup:'var(--cafe-blue)', guest:'var(--accent)', scrimmage:'var(--ok)' };

  const summary = {
    recruiting: games.filter(g => g.status === 1).length,
    confirmed:  games.filter(g => g.status === 2).length,
    done:       games.filter(g => g.status === 3).length,
  };

  const confirmGame = (id) => { // 모집중 → 확정 (수동 마감·확정)
    setGames(gs => gs.map(g => g.id === id ? { ...g, status: 2 } : g));
    setToast('경기를 확정했습니다 · 신청자에게 알림 전송');
    setTimeout(() => setToast(''), 2200);
  };
  const doCancel = () => {
    setGames(gs => gs.map(g => g.id === cancelTarget.id ? { ...g, status: 4 } : g));
    setToast('경기를 취소했습니다 · 신청자에게 알림 전송');
    setCancelTarget(null);
    setTimeout(() => setToast(''), 2200);
  };

  return (
    <div className="page">
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('profile')} style={{cursor:'pointer'}}>프로필</a> › <span style={{color:'var(--ink)'}}>내 경기</span>
      </div>

      <div style={{marginBottom:20}}>
        <div className="eyebrow">내 경기 · MY GAMES</div>
        <h1 style={{margin:'6px 0 4px', fontSize:28, fontWeight:800, letterSpacing:'-0.02em'}}>내 경기</h1>
        <div style={{fontSize:13, color:'var(--ink-mute)'}}>신청한 경기와 내가 개최한 경기를 한 화면에서 관리하세요</div>
      </div>

      {/* ═══ 상단: 참가자 신청내역 ═══ */}
      <section style={{marginBottom:32}}>
        <h2 style={{margin:'0 0 12px', fontSize:16, fontWeight:700}}>신청 내역</h2>
        <div className="mg-tabs" style={{display:'flex', gap:8, marginBottom:14, flexWrap:'wrap'}}>
          {regTabs.map(t => (
            <button key={t.id} className="btn btn--sm" onClick={()=>setTab(t.id)}
              style={tab===t.id ? {background:'var(--cafe-blue)', color:'var(--ink-on-brand)', borderColor:'var(--cafe-blue)'} : {}}>
              {t.label} <span style={{fontFamily:'var(--ff-mono)', opacity:.7, marginLeft:4}}>{regCount(t.id)}</span>
            </button>
          ))}
        </div>
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          {regShown.map((r, i) => (
            <div key={i} className="mg-reg-row" onClick={()=>setRoute('gameDetail')} style={{
              display:'grid', gridTemplateColumns:'40px 1fr auto', gap:14, alignItems:'center',
              padding:'14px 18px', borderBottom: i<regShown.length-1 ? '1px solid var(--border)' : 0, cursor:'pointer',
            }}>
              <div style={{fontSize:22}}>{r.kind}</div>
              <div style={{minWidth:0}}>
                <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:4}}>
                  <span className={`badge ${regBadge[r.status].cls}`}>{regBadge[r.status].label}</span>
                  <span style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{r.when}</span>
                </div>
                <div style={{fontWeight:700, fontSize:15, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.title}</div>
                <div style={{fontSize:13, color:'var(--ink-mute)'}}>{r.court} · {r.meta}</div>
              </div>
              <button className="btn btn--sm" onClick={(e)=>e.stopPropagation()}>상세</button>
            </div>
          ))}
          {regShown.length === 0 && (
            <div style={{padding:'48px 20px', textAlign:'center', color:'var(--ink-mute)', fontSize:14}}>
              해당 상태의 신청이 없어요
            </div>
          )}
        </div>
      </section>

      {/* ═══ 하단: 호스트 운영 ═══ */}
      <section>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:10}}>
          <h2 style={{margin:0, fontSize:16, fontWeight:700}}>
            내가 만든 경기 <span style={{fontSize:11, fontWeight:700, color:'var(--accent)', marginLeft:6}}>호스트</span>
          </h2>
          <button className="btn btn--primary btn--sm" onClick={()=>setRoute('createGame')}>+ 경기 만들기</button>
        </div>

        {/* 요약 stat */}
        <div className="mg-summary" style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom:18}}>
          {[
            { n:summary.recruiting, lbl:'모집중', tone:'var(--ok)' },
            { n:summary.confirmed,  lbl:'확정',   tone:'var(--cafe-blue)' },
            { n:summary.done,       lbl:'완료',   tone:'var(--ink-mute)' },
          ].map((c,i)=>(
            <div key={i} className="card" style={{padding:'14px 16px', borderTop:`3px solid ${c.tone}`}}>
              <div style={{fontFamily:'var(--ff-display)', fontSize:32, fontWeight:900, lineHeight:1, color:c.tone}}>{c.n}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:4}}>{c.lbl}</div>
            </div>
          ))}
        </div>

        {/* 호스트 경기 카드 그리드 */}
        {games.length > 0 ? (
          <div className="mg-host-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:14}}>
            {games.map(g => {
              const st = GAME_STATUS[g.status];
              const kc = kindColor[g.kind];
              const cancelled = g.status === 4;
              const done = g.status === 3;
              const recruiting = g.status === 1;
              const confirmed = g.status === 2;
              return (
                <div key={g.id} className="card" style={{padding:0, overflow:'hidden', display:'flex', flexDirection:'column', opacity: cancelled ? .6 : 1}}>
                  <div style={{height:3, background: cancelled ? 'var(--ink-dim)' : kc}}/>
                  <div style={{padding:'16px 18px 14px', display:'flex', flexDirection:'column', flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap'}}>
                      <span className="badge" style={{background: kc, color:'var(--ink-on-brand)', borderColor: kc}}>{kindLabel[g.kind]}</span>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      <span style={{fontSize:12, fontWeight:700, fontFamily:'var(--ff-mono)', color:'var(--cafe-blue)', marginLeft:'auto', whiteSpace:'nowrap'}}>{g.area}</span>
                    </div>
                    <div style={{fontWeight:700, fontSize:15, lineHeight:1.4, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{g.title}</div>
                    <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:12}}>{g.court} · <span style={{fontFamily:'var(--ff-mono)'}}>{g.when}</span></div>

                    {/* 신청 현황 */}
                    <div style={{display:'flex', gap:8, marginBottom:14, flexWrap:'wrap'}}>
                      <span style={{fontSize:12, padding:'4px 10px', borderRadius:'var(--radius-chip)', background:'var(--bg-alt)', fontFamily:'var(--ff-mono)', fontWeight:700}}>
                        승인 <span style={{color: g.approved>=g.max ? 'var(--accent)' : 'var(--ink)'}}>{g.approved}/{g.max}</span>
                      </span>
                      {g.pending > 0 && !cancelled && !done && (
                        <span style={{fontSize:12, padding:'4px 10px', borderRadius:'var(--radius-chip)', background:'color-mix(in oklab, var(--warn) 14%, transparent)', color:'var(--warn)', fontFamily:'var(--ff-mono)', fontWeight:700}}>
                          승인 대기 {g.pending}
                        </span>
                      )}
                      {g.waiting > 0 && !cancelled && !done && (
                        <span style={{fontSize:12, padding:'4px 10px', borderRadius:'var(--radius-chip)', background:'color-mix(in oklab, var(--accent) 12%, transparent)', color:'var(--accent)', fontFamily:'var(--ff-mono)', fontWeight:700}}>
                          대기열 {g.waiting}
                        </span>
                      )}
                    </div>

                    {/* 빠른 액션 */}
                    <div className="mg-actions" style={{display:'flex', gap:6, marginTop:'auto', flexWrap:'wrap'}}>
                      {!cancelled && !done && (
                        <button className="btn btn--sm btn--primary" style={{flex:'1 1 auto'}} onClick={()=>setRoute('gameDetail')}>
                          신청 관리{g.pending>0 ? ` · ${g.pending}` : ''}
                        </button>
                      )}
                      {recruiting && (
                        <button className="btn btn--sm" style={{flex:'0 1 auto'}} onClick={()=>confirmGame(g.id)}>
                          {g.approved>=g.max ? '확정' : '마감·확정'}
                        </button>
                      )}
                      {!cancelled && !done && (
                        <button className="btn btn--sm" style={{flex:'0 1 auto'}} onClick={()=>setRoute('createGame')}>수정</button>
                      )}
                      {!cancelled && !done && (
                        <button className="btn btn--sm btn--ghost" style={{flex:'0 1 auto', color:'var(--err)'}} onClick={()=>setCancelTarget(g)}>취소</button>
                      )}
                      {done && (
                        <button className="btn btn--sm" style={{flex:'1 1 auto'}} onClick={()=>setRoute('gameResult')}>경기 결과 · 리포트</button>
                      )}
                      {cancelled && (
                        <span style={{fontSize:12, color:'var(--ink-dim)', padding:'6px 0'}}>취소된 경기 · 신청자 알림 완료</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{padding:'56px 20px', textAlign:'center'}}>
            <div style={{fontSize:40, marginBottom:12}}>🏀</div>
            <div style={{fontWeight:800, fontSize:16, marginBottom:6}}>아직 만든 경기 없음</div>
            <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:18}}>직접 경기를 열고 멤버를 모아보세요</div>
            <button className="btn btn--primary" onClick={()=>setRoute('createGame')}>경기 만들기</button>
          </div>
        )}
      </section>

      {/* 취소 확인 모달 */}
      {cancelTarget && (
        <div role="dialog" aria-modal="true" onClick={()=>setCancelTarget(null)}
          style={{position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,.55)', display:'grid', placeItems:'center', padding:16}}>
          <div onClick={e=>e.stopPropagation()} className="card" style={{width:'100%', maxWidth:400, padding:0, overflow:'hidden'}}>
            <div style={{padding:'20px 22px', borderBottom:'1px solid var(--border)'}}>
              <div style={{fontSize:11, fontWeight:800, letterSpacing:'.12em', color:'var(--err)', marginBottom:6}}>경기 취소</div>
              <div style={{fontWeight:800, fontSize:17, letterSpacing:'-0.01em'}}>{cancelTarget.title}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:3}}>{cancelTarget.court} · {cancelTarget.when}</div>
            </div>
            <div style={{padding:'20px 22px'}}>
              <p style={{margin:'0 0 16px', fontSize:13, color:'var(--ink-soft)', lineHeight:1.6}}>
                취소하면 신청자에게 취소 알림이 갑니다. 확정·대기 인원 모두에게 통보되며 되돌릴 수 없습니다.
              </p>
              {(cancelTarget.approved + cancelTarget.waiting) > 0 && (
                <div style={{padding:'10px 14px', background:'var(--bg-alt)', borderRadius:6, marginBottom:16, fontSize:13, color:'var(--ink-soft)'}}>
                  알림 대상 <b style={{color:'var(--ink)'}}>{cancelTarget.approved + cancelTarget.waiting}명</b> (확정 {cancelTarget.approved} · 대기 {cancelTarget.waiting})
                </div>
              )}
              <button className="btn btn--xl" style={{width:'100%', marginBottom:8, background:'var(--err)', color:'var(--ink-on-brand)', borderColor:'var(--err)'}} onClick={doCancel}>경기 취소하기</button>
              <button className="btn" style={{width:'100%'}} onClick={()=>setCancelTarget(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 저장 토스트 */}
      {toast && (
        <div style={{position:'fixed', left:'50%', bottom:32, transform:'translateX(-50%)', zIndex:210, background:'var(--ink)', color:'var(--bg)', padding:'12px 20px', borderRadius:8, fontSize:13, fontWeight:700, boxShadow:'var(--sh-md)'}}>
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 720px) {
          .mg-summary { grid-template-columns: repeat(3, 1fr); }
          .mg-host-grid { grid-template-columns: 1fr !important; }
          .mg-tabs { overflow-x: auto; flex-wrap: nowrap; -webkit-overflow-scrolling: touch; }
          .mg-tabs .btn { flex: 0 0 auto; }
          .mg-actions .btn { flex: 1 1 100% !important; min-height: 44px; }
        }
      `}</style>
    </div>
  );
}

window.MyGames = MyGames;
