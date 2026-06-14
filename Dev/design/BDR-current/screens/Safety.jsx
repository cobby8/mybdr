/* global React */
// BDR v2.31 — Safety (/safety · 자체 디자인 · 안전 가이드)
function Safety() {
  const guides = [
    { ico: 'health_and_safety', t: '경기 전 점검', d: '준비운동과 코트 상태를 확인하세요.',
      list: ['10분 이상 충분한 스트레칭', '바닥 미끄럼·파손 여부 확인', '골대 고정 상태 점검'] },
    { ico: 'medical_services', t: '부상 대응', d: '부상 시 즉시 경기를 멈추고 조치하세요.',
      list: ['무리한 경기 속행 금지', 'RICE(휴식·냉찜질·압박·거상) 응급처치', '응급실 위치 사전 확인'] },
    { ico: 'groups', t: '매너와 존중', d: '모두가 안전하게 즐길 수 있는 문화를 지켜요.',
      list: ['과격한 몸싸움·위험 플레이 자제', '심판·상대 판정 존중', '경기 후 매너 평가 참여'] },
    { ico: 'shield_person', t: '안전한 만남', d: '낯선 멤버와의 첫 만남은 신중하게.',
      list: ['공개된 코트에서 첫 경기 진행', '개인정보 과도 공유 주의', '이상 행동 발견 시 즉시 신고'] },
    { ico: 'thermostat', t: '날씨·환경', d: '실외 경기는 환경을 먼저 살피세요.',
      list: ['폭염·한파 시 경기 자제', '수분 충분히 섭취', '미세먼지 나쁨 시 실내 권장'] },
    { ico: 'verified_user', t: '검증된 코트', d: '인증 코트에서 더 안전하게 활동하세요.',
      list: ['BDR 인증 배지 코트 우선', '리뷰·평점 사전 확인', '예약제 코트로 혼잡 방지'] },
  ];
  return (
    <div className="page">
      <div className="page__inner">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">안전 가이드</span></div>
        <div className="sf-hero">
          <div className="sf-hero__eyebrow">SAFETY · 안전 가이드</div>
          <h1 className="sf-hero__title">모두가 안전하게 농구하는 법</h1>
          <p className="sf-hero__lead">전국 농구 매칭 플랫폼 MyBDR은 모든 멤버의 안전을 최우선으로 합니다. 경기 전후 점검부터 부상 대응, 안전한 만남까지 — 꼭 기억해 주세요.</p>
        </div>

        <div className="sf-grid" style={{ marginBottom: 30 }}>
          {guides.map((g, i) => (
            <div key={i} className="sf-card">
              <div className="sf-card__ico"><span className="ico material-symbols-outlined">{g.ico}</span></div>
              <div className="sf-card__t">{g.t}</div>
              <div className="sf-card__d">{g.d}</div>
              <ul className="sf-list">
                {g.list.map((x, j) => <li key={j}><span className="ico material-symbols-outlined">check_circle</span>{x}</li>)}
              </ul>
            </div>
          ))}
        </div>

        <h2 className="ex-sec__h">문제가 생겼을 때</h2>
        <div className="sf-report">
          <div className="sf-report__card">
            <div className="sf-report__ico sf-report__ico--red"><span className="ico material-symbols-outlined">report</span></div>
            <div>
              <div className="sf-report__t">신고하기</div>
              <div className="sf-report__d">위험·비매너·사기 행위를 발견하면 즉시 운영팀에 신고하세요. 24시간 내 검토합니다.</div>
            </div>
          </div>
          <div className="sf-report__card">
            <div className="sf-report__ico sf-report__ico--navy"><span className="ico material-symbols-outlined">support_agent</span></div>
            <div>
              <div className="sf-report__t">긴급 문의</div>
              <div className="sf-report__d">안전 관련 긴급 상황은 1:1 문의 또는 도움말 센터로 연락 주세요.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.Safety = Safety;
