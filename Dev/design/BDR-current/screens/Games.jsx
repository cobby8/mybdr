/* global React */
// ============================================================
// BDR v2.20 — Games (Phase 2B · UA1)
// 운영 박제 대상: /games
// 진입: AppNav '경기' / Home 추천 / 모집 알림
// 복귀: 카드 클릭 → /games/[id] (UA2) · LIVE chip → /live/[id] (UA5)
// 에러: LIVE_NOW 0건 = chip row hidden / 종료 카드는 우승/MVP 없으면 라인 hidden
//
// BG7 = Hero 자리 sticky LIVE chip row (UC2 Home 과 동일 컴포넌트)
// BG4 = 종료 카드 hero 자리에 "🏆 우승팀 · MVP" 1줄
// v2.16 GameCard 디자인 언어 보존
// A 등급 (AppNav 강제 / 13 룰 준수)
// ============================================================

function Games() {
  const [filter, setFilter] = React.useState('all');
  const liveItems = (window.LIVE_NOW || []);
  const FILTERS = [
    { k: 'all', l: '전체' },
    { k: 'open', l: '모집 중' },
    { k: 'live', l: '진행' },
    { k: 'completed', l: '종료' },
    { k: 'pickup', l: '픽업' },
    { k: 'guest', l: '게스트' },
    { k: 'scrimmage', l: '연습' },
  ];

  const KIND_KEYS = ['pickup', 'guest', 'scrimmage', 'tn'];
  const list = (window.GM_DATA?.list || []).filter(g => {
    if (filter === 'all') return true;
    if (KIND_KEYS.includes(filter)) return g.kind === filter;
    return g.status === filter;
  });

  return (
    <div className="gm-page" style={{padding:0}}>
      {/* BG7 — Hero 자리 sticky LIVE chip row */}
      <window.LiveChipRow items={liveItems} />

      <div className="gm-page__inner" style={{padding:'20px 24px 60px'}}>
        <header className="gm-page__head">
          <div className="eyebrow">/games · 전국 농구 매칭</div>
          <h1 className="gm-page__title">경기 둘러보기</h1>
          <p className="gm-page__sub">픽업 / 게스트 / 연습 / 대회 — 종별 + 상태 필터.</p>
        </header>

        {/* Filter row */}
        <div className="ga-filter">
          {FILTERS.map(f => (
            <button
              key={f.k}
              className={'ga-filter__chip' + (filter === f.k ? ' is-on' : '')}
              onClick={() => setFilter(f.k)}
            >
              {f.l}
            </button>
          ))}
          <div style={{marginLeft:'auto', display:'flex', gap:6, alignItems:'center'}}>
            <select className="ga-filter__sel">
              <option>최근 등록순</option>
              <option>마감 임박순</option>
              <option>거리순</option>
            </select>
          </div>
        </div>

        {/* Cards grid */}
        <div className="ga-grid">
          {list.map(g => <GameCard key={g.id} g={g} />)}
          {list.length === 0 && (
            <div style={{
              gridColumn:'1 / -1', padding:'40px 20px',
              textAlign:'center', color:'var(--ink-mute)', fontSize:13,
              background:'var(--bg-elev)', border:'1px dashed var(--border-strong)',
              borderRadius:'var(--r-md)',
            }}>해당 조건의 경기가 없습니다.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function GameCard({ g }) {
  const dateTile = { d: g.starts_at?.slice(8, 10), m: g.starts_at?.slice(5, 7) };
  const isCompleted = g.status === 'completed';
  const isLive = g.live || g.status === 'live';
  return (
    <a className={'ga-card' + (isCompleted ? ' is-completed' : '') + (isLive ? ' is-live' : '')} data-kind={g.kind}>
      <div className="ga-card__top">
        <div className="ga-card__date">
          <span className="ga-card__d">{dateTile.d}</span>
          <span className="ga-card__m">{dateTile.m}월</span>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div className="ga-card__chips">
            <window.GMKindBadge kind={g.kind} small />
            {isLive && <span className="ga-card__live"><window.LiveDot /> LIVE</span>}
            {!isLive && g.status === 'open' && <span className="ga-card__open">모집중</span>}
            {isCompleted && <span className="ga-card__done">종료</span>}
            <span className="ga-card__area">{g.area}</span>
          </div>
          <div className="ga-card__title">{g.title}</div>
          <div className="ga-card__meta">
            <span><span className="ico material-symbols-outlined">schedule</span> {g.time} · {g.duration}분</span>
            <span><span className="ico material-symbols-outlined">place</span> {g.court}</span>
          </div>
        </div>
      </div>

      {/* BG4 — 종료 카드 우승팀/MVP 라인 (hero 자리) */}
      {isCompleted && (g.champion || g.mvp) && (
        <div className="ga-card__champ">
          <span className="ga-card__champ-trophy">🏆</span>
          <span className="ga-card__champ-text">
            {g.champion && <strong>{g.champion} 우승</strong>}
            {g.champion && g.mvp && ' · '}
            {g.mvp && <>MVP <strong>{g.mvp}</strong></>}
            {g.final_score && <span className="ga-card__champ-score">{g.final_score}</span>}
          </span>
        </div>
      )}

      {/* LIVE 자리 — Q 스코어 */}
      {isLive && (
        <div className="ga-card__live-band">
          <window.LiveDot />
          <strong>{g.live_label}</strong>
          {g.tn_name && <span className="ga-card__live-tn">🏆 {g.tn_name}</span>}
        </div>
      )}

      <div className="ga-card__bottom">
        <div className="ga-card__host">
          <div className="ga-card__host-av">{g.host?.avatar}</div>
          <div>
            <div className="ga-card__host-name">{g.host?.name}</div>
            <div className="ga-card__host-fee">{g.fee > 0 ? `참가비 ${g.fee.toLocaleString()}원` : '무료'}</div>
          </div>
        </div>
        <div className="ga-card__spots">
          <div className="ga-card__spots-num">
            <strong>{g.spots_now}</strong>/{g.spots_max}
          </div>
          <div className="ga-card__spots-bar">
            <div style={{width: `${g.spots_now / g.spots_max * 100}%`}} />
          </div>
        </div>
      </div>
    </a>
  );
}

window.Games = Games;
