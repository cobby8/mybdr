/* global React */

function Terms({ setRoute }) {
  const sections = [
    { h:'제1조 (목적)', body:'본 약관은 BDR 리그 사무국(이하 “회사”)이 제공하는 MyBDR 서비스(이하 “서비스”)의 이용 조건과 절차, 회원과 회사의 권리·의무·책임 사항을 규정함을 목적으로 합니다.' },
    { h:'제2조 (용어의 정의)', body:'“회원”은 본 약관에 동의하고 서비스 이용 자격을 부여받은 자를 말하며, “게시물”은 회원이 서비스에 게시한 글·사진·영상 등 일체의 정보를 의미합니다.' },
    { h:'제3조 (약관의 효력 및 변경)', body:'본 약관은 서비스 화면에 게시함으로써 효력이 발생하며, 회사는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.' },
    { h:'제4조 (회원가입)', body:'회원가입은 가입 신청자가 약관에 동의한 후 회사가 정한 절차에 따라 정보를 기재함으로써 성립됩니다. 만 14세 미만은 가입할 수 없습니다.' },
    { h:'제5조 (서비스의 제공)', body:'회사는 픽업 게임 매칭, 대회 개최·참가, 팀 운영, 커뮤니티 등의 서비스를 제공합니다. 정기 점검, 시스템 장애 등 사유로 일시 중단될 수 있습니다.' },
    { h:'제6조 (회원의 의무)', body:'회원은 타인의 개인정보 도용, 스팸·광고성 게시, 욕설·차별·혐오 표현, 불법 정보 게시 등을 하여서는 안 됩니다.' },
    { h:'제7조 (게시물의 관리)', body:'회사는 관련 법령 위반 또는 본 약관을 위반한 게시물에 대해 사전 통보 없이 삭제·이동·블라인드 처리할 수 있습니다.' },
    { h:'제8조 (유료 서비스)', body:'프리미엄 요금제, 대회 참가비 등 유료 결제는 결제대행사(토스페이먼츠 등)를 통해 처리되며, 환불은 관련 법령 및 별도 정책에 따릅니다.' },
    { h:'제9조 (책임의 제한)', body:'회사는 천재지변, 회원 귀책 사유로 인한 손해에 대해서는 책임을 지지 않으며, 오프라인 경기 중 발생한 부상에 대해서도 책임이 제한됩니다.' },
    { h:'제10조 (분쟁해결)', body:'본 약관과 관련된 분쟁은 대한민국 법령에 따르며, 관할 법원은 민사소송법상의 관할법원으로 합니다.' },
  ];
  return (
    <div className="page" style={{maxWidth:880}}>
      <div style={{fontSize:12, color:'var(--ink-mute)', marginBottom:10}}>
        <a onClick={()=>setRoute('home')} style={{cursor:'pointer'}}>홈</a> › <span style={{color:'var(--ink)'}}>이용약관</span>
      </div>
      <div className="eyebrow">법적 고지 · TERMS OF SERVICE</div>
      <h1 style={{margin:'6px 0 6px', fontSize:30, fontWeight:800, letterSpacing:'-0.02em'}}>이용약관</h1>
      <div style={{fontSize:13, color:'var(--ink-mute)', marginBottom:24, fontFamily:'var(--ff-mono)'}}>최종 개정 · 2026-04-19 · v2.1</div>

      <div className="card" style={{padding:'24px 28px'}}>
        {sections.map((s,i)=> (
          <div key={i} style={{marginBottom:i<sections.length-1?22:0, paddingBottom:i<sections.length-1?22:0, borderBottom:i<sections.length-1?'1px solid var(--border)':0}}>
            <h3 style={{margin:'0 0 8px', fontSize:15, fontWeight:700}}>{s.h}</h3>
            <p style={{margin:0, color:'var(--ink-soft)', fontSize:14, lineHeight:1.75}}>{s.body}</p>
          </div>
        ))}
      </div>

      <div style={{marginTop:20, padding:'14px 16px', background:'var(--bg-alt)', borderRadius:'var(--radius-chip)', fontSize:13, color:'var(--ink-mute)'}}>
        문의: bdr.wonyoung@gmail.com · 본 약관에 동의하지 않으시면 서비스 이용이 제한될 수 있습니다.
      </div>
    </div>
  );
}

window.Terms = Terms;
