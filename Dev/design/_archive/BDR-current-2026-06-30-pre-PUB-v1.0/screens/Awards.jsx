/* global React */
// BDR v2.31 — Awards (/awards · 자체 디자인 · 시즌 시상)
function Awards() {
  const best5 = [
    { pos: 'PG', name: '김지훈', team: '강남BC', stat: '24.3 PPG · 8.0 APG', av: '김' },
    { pos: 'SG', name: '이태우', team: '서초파이브', stat: '21.0 PPG · 4.2 RPG', av: '이' },
    { pos: 'SF', name: '박재현', team: '강남BC', stat: '18.7 PPG · 5.5 RPG', av: '박' },
    { pos: 'PF', name: '정성훈', team: '용산레전드', stat: '16.2 PPG · 9.3 RPG', av: '정' },
    { pos: 'C', name: '윤호석', team: '서초파이브', stat: '14.0 PPG · 11.2 RPG', av: '윤' },
  ];
  const cats = [
    { ico: 'sports_score', label: '득점왕', name: '김지훈', sub: '강남BC', v: '24.3' },
    { ico: 'volunteer_activism', label: '어시스트왕', name: '김지훈', sub: '강남BC', v: '8.0' },
    { ico: 'open_with', label: '리바운드왕', name: '윤호석', sub: '서초파이브', v: '11.2' },
    { ico: 'bolt', label: '스틸왕', name: '정성훈', sub: '용산레전드', v: '2.6' },
    { ico: 'trending_up', label: '레이팅 상승', name: '서초유스', sub: '+212', v: '신인' },
    { ico: 'handshake', label: '매너상', name: 'rdm 농구단', sub: '평균 4.9', v: '★' },
  ];
  return (
    <div className="page">
      <div className="page__inner">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">시즌 시상</span></div>
        <div className="aw-hero">
          <div>
            <div className="sf-hero__eyebrow" style={{ opacity: .8 }}>AWARDS · 시즌 시상</div>
            <h1 className="aw-hero__t">2026 봄 시즌 어워드</h1>
            <p className="aw-hero__d">전국 코트에서 펼쳐진 한 시즌, 가장 빛난 선수와 팀을 기록합니다.</p>
          </div>
          <div className="aw-hero__season">2026 SPRING</div>
        </div>

        <h2 className="ex-sec__h">시즌 MVP</h2>
        <div className="card aw-mvp">
          <div className="aw-mvp__face">
            <div className="aw-mvp__av">김</div>
            <div className="aw-mvp__tag">MOST VALUABLE PLAYER</div>
          </div>
          <div className="aw-mvp__body">
            <div className="aw-mvp__name">김지훈</div>
            <div className="aw-mvp__team">강남BC · 가드 · 레이팅 1842</div>
            <div className="aw-mvp__stats">
              <div className="aw-mvp__stat"><div className="v">24.3</div><div className="k">PPG</div></div>
              <div className="aw-mvp__stat"><div className="v">8.0</div><div className="k">APG</div></div>
              <div className="aw-mvp__stat"><div className="v">63%</div><div className="k">승률</div></div>
              <div className="aw-mvp__stat"><div className="v">12</div><div className="k">경기</div></div>
            </div>
          </div>
        </div>

        <h2 className="ex-sec__h" style={{ marginTop: 30 }}>베스트 5</h2>
        <div className="aw-best5" style={{ marginBottom: 30 }}>
          {best5.map((p, i) => (
            <div key={i} className="aw-p">
              <div className="aw-p__pos">{p.pos}</div>
              <div className="aw-p__av">{p.av}</div>
              <div className="aw-p__name">{p.name}</div>
              <div className="aw-p__team">{p.team}</div>
              <div className="aw-p__stat">{p.stat}</div>
            </div>
          ))}
        </div>

        <h2 className="ex-sec__h">부문별 수상</h2>
        <div className="aw-cats">
          {cats.map((c, i) => (
            <div key={i} className="aw-cat">
              <div className="aw-cat__ico"><span className="ico material-symbols-outlined">{c.ico}</span></div>
              <div>
                <div className="aw-cat__label">{c.label}</div>
                <div className="aw-cat__name">{c.name}</div>
                <div className="aw-cat__sub">{c.sub}</div>
              </div>
              <div className="aw-cat__v">{c.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
window.Awards = Awards;
