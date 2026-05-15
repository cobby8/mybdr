/* global React, TEAMS, Avatar, MemberPendingBadge, ForceActionModal */

function TeamManage({ setRoute }) {
  const [tab, setTab] = React.useState('roster');
  // Phase A.5 §9 — ForceActionModal mount state (jersey + withdraw 2 모드)
  const [forceModal, setForceModal] = React.useState(null);
  // dropdown 메뉴 열림 상태 (한 번에 하나만 열림 / 외부 클릭 시 닫힘)
  const [openMenuId, setOpenMenuId] = React.useState(null);
  React.useEffect(() => {
    const close = () => setOpenMenuId(null);
    if (openMenuId !== null) {
      document.addEventListener('click', close);
      return () => document.removeEventListener('click', close);
    }
  }, [openMenuId]);
  const team = TEAMS[0] || { name:'REDEEM', tag:'RDM', color:'#DC2626', ink:'#fff' };

  // 5/6 박제 — 본인(captain) jersey_change 신청 중 mock (운영 roster-tab-v2 좌하단 뱃지 정합)
  const roster = [
    { id:1, name:'rdm_captain', pos:'G', num:7,  role:'captain', joined:'2024.03', games:42, mvp:3, status:'active', isMe:true, pending:{ kind:'jersey_change', newJersey:8 } },
    { id:2, name:'rdm_sniper',  pos:'G', num:13, role:'vice',    joined:'2024.03', games:38, mvp:0, status:'active' },
    { id:3, name:'rdm_forward', pos:'F', num:23, role:'member',  joined:'2024.05', games:35, mvp:1, status:'active' },
    { id:4, name:'rdm_pivot',   pos:'C', num:44, role:'member',  joined:'2024.08', games:31, mvp:2, status:'active' },
    { id:5, name:'rdm_utility', pos:'F', num:3,  role:'member',  joined:'2025.01', games:22, mvp:0, status:'active' },
    { id:6, name:'rdm_bench1',  pos:'G', num:9,  role:'member',  joined:'2025.06', games:12, mvp:0, status:'active' },
    { id:7, name:'rdm_bench2',  pos:'F', num:21, role:'member',  joined:'2025.09', games:8,  mvp:0, status:'injured' },
    { id:8, name:'rdm_rookie',  pos:'C', num:55, role:'rookie',  joined:'2026.02', games:3,  mvp:0, status:'active' },
  ];

  const applicants = [
    { id:9,  name:'hoops_alex', pos:'G', lv:'L.5', msg:'주말 코트 자주 뵀던 분과 경기했을 때 팀 스타일이 좋아보였습니다. 꾸준히 참여할 수 있습니다.', when:'2시간 전' },
    { id:10, name:'threes_jk',  pos:'F', lv:'L.6', msg:'3점 위주 스팟업 슈터입니다. 매너 평가 5.0.', when:'6시간 전' },
    { id:11, name:'paint_bk',   pos:'C', lv:'L.4', msg:'센터 포지션 부족하다 들어서 지원합니다.', when:'1일 전' },
  ];

  const invites = [
    { id:1, code:'RDM-X9K2', created:'2026.04.20', uses:'2/5', expires:'2026.05.20' },
    { id:2, code:'RDM-P3MN', created:'2026.03.15', uses:'3/3', expires:'만료' },
  ];

  const tabs = [
    { id:'roster',   l:'로스터',     n: roster.length },
    { id:'applicants', l:'가입 신청', n: applicants.length },
    { id:'invite',   l:'초대 링크', n: invites.filter(i=>i.expires!=='만료').length },
    { id:'settings', l:'팀 설정',   n: 0 },
  ];

  const roleLabel = { captain:'팀장', vice:'부팀장', member:'팀원', rookie:'루키' };
  const roleColor = { captain:'var(--accent)', vice:'var(--cafe-blue)', member:'var(--ink-dim)', rookie:'var(--ok)' };

  return (
    <div className="page">
      <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
        <a onClick={()=>setRoute('team')} style={{cursor:'pointer'}}>팀</a><span>›</span>
        <a onClick={()=>setRoute('teamDetail')} style={{cursor:'pointer'}}>{team.name}</a><span>›</span>
        <span style={{color:'var(--ink)'}}>팀 관리</span>
      </div>

      <div style={{padding:'20px 24px', background:team.color, color:team.ink, borderRadius:8, marginBottom:20, display:'grid', gridTemplateColumns:'64px 1fr auto', gap:16, alignItems:'center'}}>
        <Avatar tag={team.tag} color="rgba(255,255,255,.2)" ink={team.ink} size={64} radius={6}/>
        <div>
          <div style={{fontSize:10, opacity:.85, fontWeight:800, letterSpacing:'.12em'}}>CAPTAIN VIEW · 팀 관리</div>
          <div style={{fontFamily:'var(--ff-display)', fontSize:26, fontWeight:900, letterSpacing:'-0.01em', marginTop:4}}>{team.name}</div>
          <div style={{fontSize:12, opacity:.85, fontFamily:'var(--ff-mono)', marginTop:2}}>멤버 {roster.length}명 · 신청 대기 {applicants.length}건</div>
        </div>
        <button className="btn btn--sm" style={{background:'rgba(255,255,255,.18)', color:team.ink, borderColor:'rgba(255,255,255,.35)'}} onClick={()=>setRoute('teamDetail')}>팀 페이지 보기</button>
      </div>

      {/* Tabs */}
      <div style={{display:'flex', gap:2, borderBottom:'1px solid var(--border)', marginBottom:20}}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'11px 18px', background:'transparent', border:0, cursor:'pointer', fontSize:13,
            fontWeight: tab===t.id?700:500,
            borderBottom: tab===t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab===t.id ? 'var(--ink)' : 'var(--ink-soft)', marginBottom:-1,
          }}>
            {t.l}
            {t.n > 0 && <span style={{marginLeft:6, fontFamily:'var(--ff-mono)', fontSize:11, background: tab===t.id?'var(--accent)':'var(--bg-alt)', color: tab===t.id?'#fff':'var(--ink-dim)', padding:'1px 7px', borderRadius:10, fontWeight:700}}>{t.n}</span>}
          </button>
        ))}
      </div>

      {tab === 'roster' && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
            <div style={{display:'flex', gap:6}}>
              <button className="btn btn--sm btn--primary">전체</button>
              <button className="btn btn--sm">활성 ({roster.filter(r=>r.status==='active').length})</button>
              <button className="btn btn--sm">부상자 ({roster.filter(r=>r.status==='injured').length})</button>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn--sm">CSV 내보내기</button>
              <button className="btn btn--sm btn--primary" onClick={()=>setTab('invite')}>+ 멤버 초대</button>
            </div>
          </div>
          <div className="card data-table" data-cols="roster" style={{padding:0, overflow:'hidden'}}>
            <div className="data-table__head" style={{display:'grid', gridTemplateColumns:'40px 50px 1fr 80px 100px 90px 90px 140px', gap:10, padding:'10px 16px', background:'var(--bg-alt)', fontSize:11, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.08em'}}>
              <div>#</div><div>POS</div><div>MEMBER</div><div>ROLE</div><div>JOINED</div><div>GAMES</div><div>MVP</div><div style={{textAlign:'right'}}>ACTIONS</div>
            </div>
            {roster.map(r => (
              <div key={r.id} className="data-table__row" style={{display:'grid', gridTemplateColumns:'40px 50px 1fr 80px 100px 90px 90px 140px', gap:10, padding:'12px 16px', borderTop:'1px solid var(--border)', alignItems:'center', fontSize:13, opacity: r.status==='injured'?0.6:1}}>
                <div data-label="#" style={{fontFamily:'var(--ff-mono)', fontWeight:800, color:'var(--ink-dim)'}}>{r.num}</div>
                <div data-label="POS" style={{fontFamily:'var(--ff-display)', fontWeight:900, fontSize:14, color: r.pos==='G'?'var(--cafe-blue)':r.pos==='F'?'#10B981':'var(--accent)'}}>{r.pos}</div>
                <div data-label="MEMBER" data-primary="true">
                  <div style={{display:'flex', gap:6, alignItems:'center', fontWeight:700}}>
                    {r.name}
                    {r.isMe && <span className="badge badge--soft" style={{fontSize:9}}>나</span>}
                    {r.status==='injured' && <span className="badge badge--red" style={{fontSize:9}}>부상</span>}
                  </div>
                  {/* 5/6 박제 — 본인 row 좌하단 신청 중 뱃지 (운영 member-pending-badge.tsx 정합) */}
                  {r.isMe && r.pending && <MemberPendingBadge kind={r.pending.kind} newJersey={r.pending.newJersey} toTeamName={r.pending.toTeamName} style={{marginTop:4, display:'inline-block'}}/>}
                </div>
                <div data-label="ROLE">
                  <span style={{fontSize:11, fontWeight:700, color:roleColor[r.role]}}>{roleLabel[r.role]}</span>
                </div>
                <div data-label="JOINED" style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)'}}>{r.joined}</div>
                <div data-label="GAMES" style={{fontFamily:'var(--ff-mono)', color:'var(--ink-soft)'}}>{r.games}</div>
                <div data-label="MVP" style={{fontFamily:'var(--ff-mono)', color: r.mvp>0?'var(--accent)':'var(--ink-dim)', fontWeight:700}}>{r.mvp > 0 ? '★'.repeat(r.mvp) : '−'}</div>
                <div data-actions="true" style={{display:'flex', gap:4, justifyContent:'flex-end', alignItems:'center', position:'relative', overflow:'visible'}}>
                  <button className="btn btn--sm" style={{padding:'4px 8px', fontSize:11}}>쪽지</button>
                  {/* Phase A.5 §9 — captain 본인 row 제외 ⋮ dropdown 운영진 액션 메뉴 (zip v2.5 박제) */}
                  {r.role !== 'captain' && (
                    <div style={{position:'relative'}} onClick={(e)=>e.stopPropagation()}>
                      <button
                        className="btn btn--sm"
                        aria-label="운영진 액션"
                        style={{padding:'4px 8px', fontSize:13, fontWeight:700, lineHeight:1}}
                        onClick={()=>setOpenMenuId(openMenuId===r.id ? null : r.id)}>⋮</button>
                      {openMenuId === r.id && (
                        <div role="menu" style={{
                          position:'absolute', right:0, top:'100%', marginTop:4,
                          minWidth:180, background:'var(--bg-card)', border:'1px solid var(--border)',
                          borderRadius:6, boxShadow:'0 8px 20px rgba(0,0,0,.35)', zIndex:50, overflow:'hidden',
                        }}>
                          {/* 등번호 강제 변경 — ForceActionModal jersey 모드 호출 */}
                          <button
                            role="menuitem"
                            onClick={()=>{ setOpenMenuId(null); setForceModal({mode:'jersey', member:r}); }}
                            style={{display:'block', width:'100%', textAlign:'left', padding:'10px 14px', background:'transparent', border:0, color:'var(--ink)', fontSize:13, cursor:'pointer'}}>
                            등번호 강제 변경
                          </button>
                          {/* 강제 탈퇴 — ForceActionModal withdraw 모드 호출 (err 컬러 + 굵게) */}
                          <button
                            role="menuitem"
                            onClick={()=>{ setOpenMenuId(null); setForceModal({mode:'withdraw', member:r}); }}
                            style={{display:'block', width:'100%', textAlign:'left', padding:'10px 14px', background:'transparent', border:'none', borderTop:'1px solid var(--border)', color:'var(--err)', fontSize:13, cursor:'pointer', fontWeight:600}}>
                            강제 탈퇴
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'applicants' && (
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          {applicants.map(a => (
            <div key={a.id} className="card" style={{padding:'18px 20px'}}>
              <div style={{display:'grid', gridTemplateColumns:'48px 1fr auto', gap:14, marginBottom:12}}>
                <Avatar tag={a.name.slice(0,2).toUpperCase()} color="#0F5FCC" ink="#fff" size={48} radius={6}/>
                <div>
                  <div style={{fontWeight:800, fontSize:15}}>{a.name}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', marginTop:2}}>{a.pos} · {a.lv} · 매너 4.7 · 신청 {a.when}</div>
                </div>
                <div style={{display:'flex', gap:6, alignItems:'center'}}>
                  <button className="btn btn--sm" style={{color:'var(--err)'}}>거절</button>
                  <button className="btn btn--sm">프로필</button>
                  <button className="btn btn--primary btn--sm">수락</button>
                </div>
              </div>
              <div style={{padding:'12px 14px', background:'var(--bg-alt)', borderRadius:4, fontSize:13, lineHeight:1.6, color:'var(--ink-soft)', borderLeft:'3px solid var(--accent)'}}>
                "{a.msg}"
              </div>
            </div>
          ))}
          {applicants.length === 0 && (
            <div className="card" style={{padding:'40px 20px', textAlign:'center', color:'var(--ink-dim)'}}>
              현재 가입 신청이 없습니다.
            </div>
          )}
        </div>
      )}

      {tab === 'invite' && (
        <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr) 320px', gap:18, alignItems:'flex-start'}}>
          <div>
            <div className="card" style={{padding:'20px 22px', marginBottom:14}}>
              <h3 style={{margin:'0 0 12px', fontSize:15, fontWeight:700}}>새 초대 링크 만들기</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14}}>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>사용 가능 횟수</label>
                  <select className="input"><option>1회</option><option>3회</option><option>5회</option><option>무제한</option></select>
                </div>
                <div>
                  <label style={{fontSize:12, fontWeight:700, color:'var(--ink-dim)', display:'block', marginBottom:6}}>유효 기간</label>
                  <select className="input"><option>7일</option><option>30일</option><option>90일</option></select>
                </div>
              </div>
              <button className="btn btn--primary">초대 링크 생성</button>
            </div>
            <h3 style={{margin:'0 0 12px', fontSize:14, fontWeight:700, color:'var(--ink-dim)', textTransform:'uppercase', letterSpacing:'.08em'}}>기존 링크</h3>
            <div className="card" style={{padding:0, overflow:'hidden'}}>
              {invites.map((iv, i) => (
                <div key={iv.id} style={{display:'grid', gridTemplateColumns:'1fr 80px 100px 100px 120px', gap:10, padding:'12px 16px', borderTop: i>0?'1px solid var(--border)':'none', alignItems:'center', fontSize:13, opacity: iv.expires==='만료'?0.5:1}}>
                  <div>
                    <div style={{fontFamily:'var(--ff-mono)', fontWeight:800}}>{iv.code}</div>
                    <div style={{fontSize:11, color:'var(--ink-dim)'}}>mybdr.app/invite/{iv.code}</div>
                  </div>
                  <div style={{fontSize:11, color:'var(--ink-dim)'}}>{iv.created}</div>
                  <div style={{fontFamily:'var(--ff-mono)'}}>{iv.uses}</div>
                  <div style={{fontSize:11, color: iv.expires==='만료'?'var(--err)':'var(--ink-soft)', fontFamily:'var(--ff-mono)'}}>{iv.expires}</div>
                  <div style={{display:'flex', gap:4, justifyContent:'flex-end'}}>
                    <button className="btn btn--sm" style={{padding:'4px 8px', fontSize:11}}>복사</button>
                    <button className="btn btn--sm" style={{padding:'4px 8px', fontSize:11, color:'var(--err)'}}>만료</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <aside className="card" style={{padding:'18px 20px', background:'var(--bg-alt)', position:'sticky', top:120}}>
            <div style={{fontSize:11, color:'var(--ink-dim)', fontWeight:800, letterSpacing:'.1em', marginBottom:8}}>💡 초대 링크란</div>
            <div style={{fontSize:12, lineHeight:1.7, color:'var(--ink-soft)'}}>
              링크를 받은 사람이 BDR 앱에서 열면 <b>팀 합류 화면</b>으로 바로 이동합니다. 승인 대기 없이 즉시 합류하므로 <b>믿을 만한 사람에게만</b> 공유하세요.
            </div>
          </aside>
        </div>
      )}

      {tab === 'settings' && (
        <div className="card" style={{padding:'24px 28px'}}>
          <h3 style={{margin:'0 0 16px', fontSize:15, fontWeight:700}}>팀 공개 설정</h3>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {[
              ['공개 범위', '전체 공개 — 검색·가입 신청 허용'],
              ['최소 실력', '초-중급 이상'],
              ['승인 방식', '팀장·부팀장 승인'],
              ['허용 연령', '만 16세 이상'],
              ['성별', '전체'],
            ].map(([l, v], i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'14px 0', borderTop: i>0?'1px solid var(--border)':'none', alignItems:'center'}}>
                <div>
                  <div style={{fontWeight:700, fontSize:13}}>{l}</div>
                  <div style={{fontSize:11, color:'var(--ink-dim)'}}>{v}</div>
                </div>
                <button className="btn btn--sm">변경</button>
              </div>
            ))}
          </div>
          <div style={{marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)'}}>
            <h3 style={{margin:'0 0 8px', fontSize:15, fontWeight:700, color:'var(--err)'}}>위험 구역</h3>
            <div style={{display:'flex', gap:8}}>
              <button className="btn btn--sm" style={{color:'var(--err)'}}>팀 이름 변경</button>
              <button className="btn btn--sm" style={{color:'var(--err)'}}>팀장 양도</button>
              <button className="btn btn--sm" style={{color:'var(--err)'}}>팀 해체</button>
            </div>
          </div>
        </div>
      )}

      {/* Phase A.5 §9 — ForceActionModal (jersey + withdraw 두 모드 공통 mount). zip v2.5 박제 */}
      <ForceActionModal
        open={!!forceModal}
        mode={forceModal?.mode}
        memberName={forceModal?.member?.name}
        onClose={()=>setForceModal(null)}
        onSubmit={async (payload)=>{
          // 데모: 운영 src/ 동기화 시 API 호출로 교체
          await new Promise(r => setTimeout(r, 400));
          console.log('[ForceAction]', forceModal?.mode, forceModal?.member?.name, payload);
        }}
      />
    </div>
  );
}

window.TeamManage = TeamManage;
