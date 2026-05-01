/* global React */

function Privacy({ setRoute }) {
  const items = [
    { h:'1. 수집하는 개인정보 항목', body:'필수: 이메일, 휴대전화번호, 닉네임 / 선택: 프로필 사진, 포지션, 활동 지역, 신장·체중 / 자동 수집: 접속 IP, 쿠키, 기기 정보, 서비스 이용 기록' },
    { h:'2. 개인정보의 수집·이용 목적', body:'회원 식별·인증, 매치/대회 매칭, 알림 발송, 결제 처리, 부정 이용 방지, 통계·분석을 통한 서비스 개선' },
    { h:'3. 개인정보의 보유 및 이용 기간', body:'회원 탈퇴 시 즉시 파기. 단, 관계 법령에 따라 보존이 필요한 경우(전자상거래 5년, 통신비밀보호법 3개월 등)는 해당 기간 보관' },
    { h:'4. 개인정보의 제3자 제공', body:'원칙적으로 외부에 제공하지 않습니다. 다만 결제대행(토스페이먼츠), SMS 발송(NHN Cloud) 등 업무 위탁 시에는 별도 고지 후 처리' },
    { h:'5. 정보주체의 권리', body:'언제든지 개인정보 열람·정정·삭제·처리정지를 요구할 수 있으며, /profile/settings 에서 직접 관리하거나 이메일로 요청 가능' },
    { h:'6. 쿠키의 운용', body:'서비스 향상을 위해 쿠키를 사용하며, 브라우저 설정에서 거부할 수 있습니다. 일부 기능 이용에 제한이 있을 수 있습니다.' },
    { h:'7. 개인정보 보호책임자', body:'성명: 김원영 / 이메일: bdr.wonyoung@gmail.com / 부서: BDR 사무국' },
    { h:'8. 안전성 확보 조치', body:'개인정보 암호화 저장(AES-256), 접근권한 관리, 접속기록 보관, 정기 보안 점검 시행' },
  ];
  return (
    <div className="page" style={{maxWidth:880}}>
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a> › <span style={{color:'var(--ink)'}}>개인정보처리방침</span>
      </div>
      <div className="eyebrow">법적 고지 · PRIVACY POLICY</div>
      <h1 style={{margin:'6px 0 6px', fontSize:30, fontWeight:800, letterSpacing:'-0.02em'}}>개인정보처리방침</h1>
      <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:24, fontFamily:'var(--ff-mono)'}}>최종 개정 · 2026-04-19 · v2.1</div>

      <div className="card" style={{padding:'24px 28px', marginBottom:18}}>
        <p style={{margin:'0 0 18px', color:'var(--ink-soft)', fontSize:14, lineHeight:1.75}}>
          BDR 리그 사무국은 「개인정보 보호법」을 준수하여 이용자의 개인정보 보호 및 권익을 보호하고,
          개인정보와 관련한 고충을 원활하게 처리할 수 있도록 다음과 같은 처리방침을 두고 있습니다.
        </p>
        {items.map((s,i)=> (
          <div key={i} style={{marginBottom:i<items.length-1?20:0, paddingBottom:i<items.length-1?20:0, borderBottom:i<items.length-1?'1px solid var(--border)':0}}>
            <h3 style={{margin:'0 0 8px', fontSize:15, fontWeight:700}}>{s.h}</h3>
            <p style={{margin:0, color:'var(--ink-soft)', fontSize:14, lineHeight:1.75}}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

window.Privacy = Privacy;
