/* global React, Icon */

/**
 * TeamRequests — /teams/[id]/manage/requests 운영 정합 mock (역박제 5/9)
 *
 * 시안 룰: 색/폰트만 v2 유지 + 레이아웃 운영 정합
 * 운영 핵심: 옛 알림(2026-05-05~05-07 발송된 actionUrl) redirect 페이지
 *           서버 컴포넌트 → redirect("/teams/[id]/manage?tab=member-requests")
 *           → 통합 manage 페이지 "팀원 요청" 탭으로 자동 이동
 * 진입: 옛 알림 클릭 (notifications.action_url 잔재)
 * 복귀: /teams/[id]/manage?tab=member-requests (TeamManage.jsx)
 *
 * ※ 사용자가 직접 보는 시간이 짧음 — 시안에서는 안내 메시지 + 수동 이동 버튼 mock-up
 */
function TeamRequests({ setRoute }) {
  // mock — 자동 이동 카운트다운 (시안에서는 정적 표시)
  const [countdown] = React.useState(2);

  return (
    <div className="page" style={{minHeight:'50vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'40px 20px'}}>
      {/* 안내 아이콘 */}
      <div style={{
        width:80, height:80, borderRadius:'50%', display:'grid', placeItems:'center',
        background:'color-mix(in srgb, var(--cafe-blue) 12%, transparent)',
        marginBottom:18,
        fontSize:36, color:'var(--cafe-blue)',
      }}>↪</div>

      {/* 헤더 */}
      <div className="eyebrow" style={{fontSize:10, fontWeight:800, letterSpacing:'.14em', color:'var(--ink-dim)', marginBottom:6}}>NOTIFICATION REDIRECT</div>
      <h1 style={{margin:'0 0 8px', fontSize:22, fontWeight:800, fontFamily:'var(--ff-display)', letterSpacing:'-0.02em'}}>통합 관리 페이지로 이동합니다</h1>
      <p style={{margin:'0 0 6px', fontSize:13, color:'var(--ink-mute)', lineHeight:1.6, maxWidth:380}}>
        팀원 요청 페이지가 통합 운영 페이지로 옮겨졌습니다.
      </p>
      <p style={{margin:'0 0 20px', fontSize:12, color:'var(--ink-dim)', lineHeight:1.5, fontFamily:'var(--ff-mono)'}}>
        {countdown}초 후 자동 이동...
      </p>

      {/* 수동 이동 버튼 */}
      <button className="btn btn--primary" onClick={()=>setRoute('teamManage')}>
        지금 바로 이동
      </button>

      {/* 변경 안내 박스 */}
      <div className="card" style={{marginTop:32, padding:'14px 18px', textAlign:'left', maxWidth:420, width:'100%'}}>
        <div style={{fontSize:12, fontWeight:700, color:'var(--ink)', marginBottom:8, display:'flex', alignItems:'center', gap:6}}>
          <span style={{color:'var(--accent)'}}>ⓘ</span> 옛 알림 안내
        </div>
        <ul style={{margin:0, paddingLeft:18, fontSize:12, color:'var(--ink-mute)', lineHeight:1.7}}>
          <li>2026.05.05 ~ 05.07 사이 발송된 알림은 옛 경로(/manage/requests)를 가리킵니다</li>
          <li>이 페이지는 자동으로 통합 페이지(/manage?tab=member-requests)로 이동시킵니다</li>
          <li>새 알림은 정상 경로로 발송됩니다</li>
        </ul>
      </div>

      {/* 푸터 */}
      <p style={{marginTop:18, fontSize:11, color:'var(--ink-dim)'}}>
        문제가 지속되면 <a onClick={()=>setRoute('help')} style={{textDecoration:'underline', cursor:'pointer'}}>고객센터</a>로 문의해주세요.
      </p>
    </div>
  );
}

window.TeamRequests = TeamRequests;
