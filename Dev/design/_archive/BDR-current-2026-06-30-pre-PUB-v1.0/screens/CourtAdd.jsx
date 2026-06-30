/* global React */
// BDR v2.31 — CourtAdd (/courts/submit · 자체 디자인 · 코트 등록 신청)
function CourtAdd() {
  const [amen, setAmen] = React.useState(['shower']);
  const toggle = (k) => setAmen(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k]);
  const amens = [
    ['shower', '샤워실', 'shower'], ['parking', '주차', 'local_parking'], ['indoor', '실내', 'home'],
    ['light', '야간 조명', 'lightbulb'], ['locker', '락커', 'lock'], ['rental', '용품 대여', 'sports_basketball'],
  ];
  return (
    <div className="page">
      <div className="page__inner page__inner--narrow">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><a>코트</a><span className="sep">›</span><span className="cur">코트 등록 신청</span></div>
        <div className="ex-head" style={{ marginBottom: 14 }}>
          <div>
            <div className="eyebrow">COURT · 코트 등록 신청</div>
            <h1 className="ex-head__title">새 코트 제보하기</h1>
            <p className="ex-head__sub">아직 등록되지 않은 코트를 제보해 주세요. 운영팀 검수 후 지도에 추가됩니다.</p>
          </div>
        </div>

        <div className="card fm-card">
          <div className="fm-step"><span className="fm-step__dot is-on" /><span className="fm-step__dot is-on" /><span className="fm-step__dot" /></div>

          <div className="fm-field">
            <label className="fm-label">코트 이름<span className="req">*</span></label>
            <input className="fm-input" placeholder="예: 장충체육관 보조경기장" />
          </div>
          <div className="fm-row">
            <div className="fm-field">
              <label className="fm-label">지역<span className="req">*</span></label>
              <select className="fm-select"><option>서울 중구</option><option>서울 송파구</option><option>서울 용산구</option><option>경기 하남시</option></select>
            </div>
            <div className="fm-field">
              <label className="fm-label">코트 유형<span className="req">*</span></label>
              <select className="fm-select"><option>실내 풀코트</option><option>실외 풀코트</option><option>하프코트 (3x3)</option></select>
            </div>
          </div>
          <div className="fm-field">
            <label className="fm-label">상세 주소<span className="req">*</span></label>
            <input className="fm-input" placeholder="도로명 주소를 입력하세요" />
          </div>
          <div className="fm-row">
            <div className="fm-field">
              <label className="fm-label">운영 시간</label>
              <input className="fm-input" placeholder="예: 06:00 – 22:00" />
            </div>
            <div className="fm-field">
              <label className="fm-label">이용료</label>
              <input className="fm-input" placeholder="예: 무료 / 시간당 5,000원" />
            </div>
          </div>
          <div className="fm-field">
            <label className="fm-label">편의시설</label>
            <div className="fm-checks">
              {amens.map(([k, l, ico]) => (
                <button key={k} type="button" className={'fm-check' + (amen.includes(k) ? ' is-on' : '')} onClick={() => toggle(k)}>
                  <span className="ico material-symbols-outlined">{ico}</span>{l}
                </button>
              ))}
            </div>
          </div>
          <div className="fm-field">
            <label className="fm-label">코트 사진</label>
            <div className="fm-upload"><span className="ico material-symbols-outlined">add_a_photo</span>사진을 끌어다 놓거나 클릭해 업로드 (최대 5장)</div>
          </div>
          <div className="fm-field">
            <label className="fm-label">추가 설명</label>
            <textarea className="fm-textarea" placeholder="바닥 상태, 골대 개수, 주차 안내 등 도움이 될 정보를 적어주세요."></textarea>
          </div>
          <div className="fm-note"><span className="ico material-symbols-outlined">info</span>제보해 주신 코트는 운영팀 검수(평균 2~3일) 후 등록되며, 등록 시 알림으로 안내드립니다.</div>

          <div className="fm-actions">
            <button className="btn">임시저장</button>
            <button className="btn btn--accent"><span className="ico material-symbols-outlined">send</span>제보 제출</button>
          </div>
        </div>
      </div>
    </div>
  );
}
window.CourtAdd = CourtAdd;
