/* global React */
// BDR v2.31 — SeriesDetail (/series/[slug] · 자체 디자인 · 시리즈 상세)
function SeriesDetail() {
  const rounds = [
    { no: 'Vol.7', t: '봄맞이 마포컵', meta: [['event', '2026.03.16'], ['place', '마포구민체육센터'], ['emoji_events', '우승 강남BC']], badge: ['ex-badge--soft', '종료'] },
    { no: 'Vol.6', t: '겨울 마포컵', meta: [['event', '2025.12.14'], ['place', '마포구민체육센터'], ['emoji_events', '우승 서초파이브']], badge: ['ex-badge--soft', '종료'] },
    { no: 'Vol.8', t: '여름 마포컵', meta: [['event', '2026.09.12'], ['place', '마포구민체육센터'], ['group', '16팀 모집']], badge: ['ex-badge--red', '모집 예정'] },
  ];
  const lead = [
    { r: 1, tag: 'GNB', name: '강남BC', pts: '320' },
    { r: 2, tag: 'SCP', name: '서초파이브', pts: '285' },
    { r: 3, tag: 'YSL', name: '용산레전드', pts: '240' },
    { r: 4, tag: 'RDM', name: 'rdm 농구단', pts: '198' },
    { r: 5, tag: 'MPC', name: '마포코프', pts: '176' },
  ];
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><a>시리즈</a><span className="sep">›</span><span className="cur">마포컵 시리즈</span></div>

        <div className="se-hero">
          <div className="se-hero__eyebrow">SERIES · 시리즈</div>
          <h1 className="se-hero__title">마포컵 시리즈</h1>
          <p className="se-hero__d">마포구체육회가 분기마다 여는 오픈 디비전 정기 대회. 누적 포인트로 시즌 챔피언을 가립니다.</p>
          <div className="se-hero__meta">
            <div><span className="v">7회</span><span className="k">개최 회차</span></div>
            <div><span className="v">42팀</span><span className="k">누적 참가</span></div>
            <div><span className="v">분기</span><span className="k">개최 주기</span></div>
            <div><span className="v">오픈</span><span className="k">디비전</span></div>
          </div>
        </div>

        <div className="se-2col">
          <div>
            <h2 className="ex-sec__h">회차 <span className="n">{rounds.length}</span></h2>
            <div className="se-round">
              {rounds.map((r, i) => (
                <div key={i} className="se-rcard">
                  <div className="se-rcard__no">{r.no}</div>
                  <div>
                    <div className="se-rcard__t">{r.t} <span className={'ex-badge ' + r.badge[0]} style={{ marginLeft: 4 }}>{r.badge[1]}</span></div>
                    <div className="se-rcard__meta">
                      {r.meta.map(([ico, l], j) => <span key={j}><span className="ico material-symbols-outlined">{ico}</span>{l}</span>)}
                    </div>
                  </div>
                  <button className="btn btn--sm">상세</button>
                </div>
              ))}
            </div>
          </div>

          <div className="card se-side">
            <h3 className="se-side__h">시즌 누적 순위</h3>
            {lead.map((t, i) => (
              <div key={i} className="se-lead">
                <span className={'se-lead__rank' + (t.r <= 3 ? ' top' : '')}>{t.r}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="se-lead__av">{t.tag}</span>
                  <span className="se-lead__name">{t.name}</span>
                </div>
                <span className="se-lead__pts">{t.pts}p</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
window.SeriesDetail = SeriesDetail;
