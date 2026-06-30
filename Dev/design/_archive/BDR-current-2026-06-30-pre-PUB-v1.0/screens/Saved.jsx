/* global React */
// BDR v2.31 — Saved (/saved · 자체 디자인 · 보관함)
function Saved() {
  const [tab, setTab] = React.useState('all');
  const games = [
    { kind: '픽업', title: '강남 토요 저녁 픽업 5v5', date: '04.27 19:00', court: '장충체육관', fee: '5,000원', spots: '8/10', closing: true },
    { kind: '게스트', title: 'A팀 게스트 3명 모집', date: '04.30 20:00', court: '용산국민체육센터', fee: '8,000원', spots: '1/3' },
  ];
  const tns = [
    { name: '봄맞이 마포컵 Vol.8', status: 'OPEN', when: '2026.09.12' },
    { name: '한강 3x3 챌린지', status: '모집 중', when: '2026.05.25' },
  ];
  const teams = [
    { tag: 'MNK', cl: 'navy', name: 'MONKEYZ', rec: '18W 6L · 1812' },
    { tag: 'KGS', cl: 'blue', name: '킹스크루', rec: '14W 9L · 1705' },
    { tag: 'SWP', cl: 'accent', name: 'SWEEP', rec: '11W 12L · 1650' },
  ];
  const courts = [
    { name: '장충체육관', area: '중구', rating: '4.8', hours: '06–22', fee: '무료' },
    { name: '미사강변체육관', area: '하남시', rating: '4.7', hours: '06–22', fee: '5,000원' },
    { name: '용산국민체육센터', area: '용산구', rating: '4.6', hours: '08–21', fee: '8,000원' },
  ];
  const total = games.length + tns.length + teams.length + courts.length;
  const tabs = [['all', '전체', total], ['games', '경기', games.length], ['tn', '대회', tns.length], ['team', '팀', teams.length], ['court', '코트', courts.length]];
  const show = (k) => tab === 'all' || tab === k;
  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        <div className="ex-crumb"><a>홈</a><span className="sep">›</span><span className="cur">보관함</span></div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">SAVED · 보관함</div>
            <h1 className="ex-head__title">저장한 항목</h1>
            <p className="ex-head__sub">북마크한 경기, 대회, 팀, 코트를 한 곳에서 찾아보세요.</p>
          </div>
        </div>

        <div className="ex-tabs">
          {tabs.map(([k, l, n]) => (
            <button key={k} className={'ex-tab' + (tab === k ? ' is-on' : '')} onClick={() => setTab(k)}>{l}<span className="ex-tab__n">{n}</span></button>
          ))}
        </div>

        {show('games') && (
          <div className="ex-sec">
            {tab === 'all' && <h2 className="ex-sec__h">경기 <span className="n">{games.length}</span></h2>}
            <div className="sv-grid-2">
              {games.map((g, i) => (
                <div key={i} className="sv-tile">
                  <div className="sv-tile__top">
                    <span className="ex-badge ex-badge--navy">{g.kind}</span>
                    {g.closing && <span className="ex-badge ex-badge--red">마감임박</span>}
                    <span className="sv-tile__bm material-symbols-outlined">bookmark</span>
                  </div>
                  <div className="sv-tile__title">{g.title}</div>
                  <div className="sv-tile__meta">
                    <div><span className="k">일시 </span>{g.date}</div>
                    <div><span className="k">장소 </span>{g.court}</div>
                    <div><span className="k">참가비 </span>{g.fee}</div>
                    <div><span className="k">모집 </span>{g.spots}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {show('tn') && (
          <div className="ex-sec">
            {tab === 'all' && <h2 className="ex-sec__h">대회 <span className="n">{tns.length}</span></h2>}
            <div className="sv-grid-3">
              {tns.map((t, i) => (
                <div key={i} className="sv-tile">
                  <div className="sv-tile__top"><span className="ex-badge ex-badge--red">{t.status}</span><span className="sv-tile__bm material-symbols-outlined">bookmark</span></div>
                  <div className="sv-tile__title">{t.name}</div>
                  <div className="sv-tile__date"><span className="ico material-symbols-outlined">event</span>{t.when}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {show('team') && (
          <div className="ex-sec">
            {tab === 'all' && <h2 className="ex-sec__h">팀 <span className="n">{teams.length}</span></h2>}
            <div className="sv-grid-4">
              {teams.map((t, i) => (
                <div key={i} className="sv-tile sv-team">
                  <span className={'ex-mono ex-mono--' + t.cl + ' sv-team__av'}>{t.tag}</span>
                  <div className="sv-tile__title" style={{ marginBottom: 2 }}>{t.name}</div>
                  <div className="sv-court__rating" style={{ fontSize: 11 }}>{t.rec}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {show('court') && (
          <div className="ex-sec">
            {tab === 'all' && <h2 className="ex-sec__h">코트 <span className="n">{courts.length}</span></h2>}
            <div className="sv-grid-3">
              {courts.map((c, i) => (
                <div key={i} className="sv-tile">
                  <div className="sv-tile__top">
                    <div className="sv-tile__title" style={{ marginBottom: 0 }}>{c.name}</div>
                    <span className="sv-court__rating" style={{ marginLeft: 'auto' }}><span className="ico material-symbols-outlined">star</span>{c.rating}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginBottom: 8 }}>{c.area}</div>
                  <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
                    <span>{c.hours}</span><span>{c.fee}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
window.Saved = Saved;
