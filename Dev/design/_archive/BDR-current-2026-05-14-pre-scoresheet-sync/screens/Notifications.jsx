/* global React, Icon */

function Notifications({ setRoute }) {
  const items = [
    { id:1, group:'today', type:'match', icon:'🏆', title:'BDR Challenge Spring 접수 마감 임박', sub:'지금까지 접수한 팀 · REDEEM 외 11팀', time:'방금 전', unread:true, action:'matchDetail' },
    { id:2, group:'today', type:'game', icon:'🏀', title:'하남미사 픽업 신청이 승인되었습니다', sub:'호스트 block · 2026.04.25 20:30', time:'15분 전', unread:true, action:'gameDetail' },
    { id:9, group:'today', type:'team', icon:'✉', title:'몽키즈 팀에서 회원님을 초대했습니다', sub:'팀장 hoop_master · 가드 포지션 제안', time:'30분 전', unread:true, action:'teamInvite' },
    { id:10, group:'today', type:'system', icon:'⚠', title:'BDR+ 정기결제가 실패했습니다', sub:'카드 한도 초과 · 결제수단을 업데이트해주세요', time:'1시간 전', unread:true, action:'pricingFail' },
    { id:3, group:'today', type:'comment', icon:'💬', title:'3POINT_슈님이 회원님 글에 댓글을 남겼습니다', sub:'"저도 그 코트 자주 가요. 다음에 같이..."', time:'1시간 전', unread:true, action:'post' },
    { id:11, group:'today', type:'system', icon:'✅', title:'BDR Challenge Spring 결제가 완료되었습니다', sub:'예약번호 BDR-T-00412 · ₩82,400', time:'2시간 전', unread:false, action:'pricingSuccess' },
    { id:4, group:'yesterday', type:'team', icon:'👥', title:'REDEEM에 새 팀원이 합류했습니다', sub:'pivot_mia 선수가 팀원 10명 → 11명', time:'어제 18:42', unread:false, action:'teamDetail' },
    { id:5, group:'yesterday', type:'rating', icon:'📈', title:'시즌 레이팅이 업데이트되었습니다', sub:'1645 → 1684 (+39) · 서울 12위', time:'어제 02:00', unread:false, action:'rank' },
    { id:6, group:'week', type:'like', icon:'❤', title:'회원님의 후기에 좋아요 12개가 추가되었습니다', sub:'"어제 장충체육관 픽업경기 후기..."', time:'2일 전', unread:false, action:'post' },
    { id:7, group:'week', type:'system', icon:'⚙', title:'4월 운영 점검 안내 (4/28 03:00 ~ 05:00)', sub:'해당 시간대 일부 서비스 중단', time:'2일 전', unread:false, action:'help' },
    { id:8, group:'week', type:'match', icon:'🏀', title:'Kings Cup Vol.07 접수가 시작되었습니다', sub:'2026.05.15 ~ 05.17 · 참가비 ₩160,000', time:'3일 전', unread:false, action:'matchDetail' },
  ];
  const [filter, setFilter] = React.useState('all');
  const unread = items.filter(i => i.unread).length;
  const shown = items.filter(i => filter === 'all' || (filter === 'unread' && i.unread) || filter === i.type);

  const groupOrder = [
    { key: 'today',     label: '오늘' },
    { key: 'yesterday', label: '어제' },
    { key: 'week',      label: '이번 주' },
  ];

  return (
    <div className="page">
      <div style={{maxWidth:780, margin:'0 auto'}}>
        <div style={{display:'flex', gap:6, fontSize:12, color:'var(--ink-mute)', marginBottom:12}}>
          <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a><span>›</span>
          <span style={{color:'var(--ink)'}}>알림</span>
        </div>

        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10}}>
          <div>
            <div className="eyebrow">알림 · NOTIFICATIONS</div>
            <h1 style={{margin:'6px 0 2px', fontSize:28, fontWeight:800, letterSpacing:'-0.015em'}}>
              알림 {unread > 0 && <span style={{color:'var(--accent)', marginLeft:6, fontSize:22, fontFamily:'var(--ff-mono)'}}>{unread}</span>}
            </h1>
            <div style={{fontSize:13, color:'var(--ink-mute)'}}>{unread > 0 ? `읽지 않은 알림 ${unread}건` : '모든 알림을 확인했어요'}</div>
          </div>
          <div style={{display:'flex', gap:6}}>
            <button className="btn btn--sm">모두 읽음</button>
            <button className="btn btn--sm" onClick={()=>setRoute('notificationSettings')}>알림 설정</button>
          </div>
        </div>

        <div style={{display:'flex', gap:6, marginBottom:16, flexWrap:'wrap'}}>
          {[['all','전체'],['unread','안읽음'],['match','대회'],['game','경기'],['comment','댓글'],['team','팀'],['system','시스템']].map(([k,l]) => (
            <button key={k} className="btn btn--sm" onClick={()=>setFilter(k)}
              style={filter===k ? {background:'var(--cafe-blue)', color:'#fff', borderColor:'var(--cafe-blue-deep)'} : {}}>{l}</button>
          ))}
        </div>

        {groupOrder.map(g => {
          const groupItems = shown.filter(n => n.group === g.key);
          if (groupItems.length === 0) return null;
          return (
            <section key={g.key} style={{marginBottom:18}}>
              <div style={{fontSize:11, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'.1em', textTransform:'uppercase', padding:'4px 4px 8px'}}>{g.label} <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontWeight:600, marginLeft:4}}>{groupItems.length}</span></div>
              <div className="card" style={{padding:0, overflow:'hidden'}}>
                {groupItems.map((n, i) => (
                  <div key={n.id} onClick={()=>setRoute(n.action)} style={{
                    display:'grid', gridTemplateColumns:'44px 1fr auto', gap:14, padding:'14px 20px',
                    borderBottom: i < groupItems.length-1 ? '1px solid var(--border)' : 0,
                    cursor:'pointer',
                    background: n.unread ? 'var(--cafe-blue-soft)' : 'transparent',
                    position:'relative',
                  }}>
                    {n.unread && <span style={{position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:6, height:6, borderRadius:'50%', background:'var(--accent)'}}/>}
                    <div style={{width:40, height:40, borderRadius:'50%', background:'var(--bg-alt)', border:'1px solid var(--border)', display:'grid', placeItems:'center', fontSize:18}}>{n.icon}</div>
                    <div style={{minWidth:0}}>
                      <div style={{fontWeight: n.unread ? 700 : 500, fontSize:14, lineHeight:1.4, marginBottom:3, color:'var(--ink)'}}>{n.title}</div>
                      <div style={{fontSize:12, color:'var(--ink-mute)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{n.sub}</div>
                    </div>
                    <div style={{fontSize:11, color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', whiteSpace:'nowrap'}}>{n.time}</div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {shown.length === 0 && (
          <div className="card" style={{padding:60, textAlign:'center', color:'var(--ink-dim)'}}>
            <div style={{fontSize:36, marginBottom:8}}>🔔</div>
            해당하는 알림이 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

window.Notifications = Notifications;
