/* global React */
// ============================================================
// BDR v2.28 — Courts (VU1 · Phase 8B · 보강 · BV1 ★★★★)
// 운영: /courts (153 · Phase 3 v2 CourtsContentV2) — 발견성 보강.
//
// 검색 + 필터 (지역/가격/평점/즐겨찾기) + 지도 토글 + 코트 카드 (즐겨찾기·앰배서더) +
// "코트 등록 신청" CTA + Phase 5 RU1 cross-domain (코트별 랭킹 link).
// ============================================================
function Courts() {
  const courts = window.COURTS;
  const [view, setView] = React.useState('list');
  const [favOnly, setFavOnly] = React.useState(false);
  const [district, setDistrict] = React.useState('전체');

  const districts = ['전체', ...Array.from(new Set(courts.map(c => c.district)))];
  let rows = courts;
  if (favOnly) rows = rows.filter(c => c.fav);
  if (district !== '전체') rows = rows.filter(c => c.district === district);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div className="eyebrow" style={{ marginBottom: 6 }}>코트 찾기 · COURTS</div>
        <h1 style={{ fontFamily: 'var(--ff-display)', fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: '0 0 16px', color: 'var(--ink)' }}>내 주변 농구장</h1>

        {/* toolbar */}
        <div className="cv-toolbar">
          <div className="cv-search">
            <span className="ico material-symbols-outlined">search</span>
            <input placeholder="코트명 · 지역 · 지하철역 검색" />
          </div>
          <div className="cv-viewtoggle">
            <button className={view === 'list' ? 'is-on' : ''} onClick={() => setView('list')}><span className="ico material-symbols-outlined">view_list</span>목록</button>
            <button className={view === 'map' ? 'is-on' : ''} onClick={() => setView('map')}><span className="ico material-symbols-outlined">map</span>지도</button>
          </div>
        </div>

        {/* filters */}
        <div className="cv-filters">
          <span className="cv-fchip"><span className="ico material-symbols-outlined">location_on</span>
            <select value={district} onChange={e => setDistrict(e.target.value)}>{districts.map(d => <option key={d}>{d}</option>)}</select>
          </span>
          <span className="cv-fchip"><span className="ico material-symbols-outlined">payments</span><select><option>가격 전체</option><option>무료</option><option>₩15,000 이하</option></select></span>
          <span className="cv-fchip"><span className="ico material-symbols-outlined">star</span><select><option>평점 전체</option><option>4.5 이상</option><option>4.0 이상</option></select></span>
          <button className={'cv-fchip' + (favOnly ? ' is-on' : '')} onClick={() => setFavOnly(f => !f)}>
            <span className="ico material-symbols-outlined">{favOnly ? 'favorite' : 'favorite_border'}</span>즐겨찾기만
          </button>
        </div>

        {/* submit CTA */}
        <div className="cv-submit-cta">
          <span className="ico material-symbols-outlined">add_location_alt</span>
          <div className="cv-submit-cta__body">
            <div className="cv-submit-cta__t">찾는 코트가 없나요?</div>
            <div className="cv-submit-cta__d">새 코트를 등록 신청하면 검수 후 추가됩니다.</div>
          </div>
          <a className="btn btn--primary" href="#"><span className="ico material-symbols-outlined">edit_location</span>코트 등록 신청</a>
        </div>

        {/* list / map */}
        <div className={'cv-layout' + (view === 'map' ? ' cv-layout--map' : '')}>
          <div className="cv-grid">
            {rows.map(c => <window.CourtCard key={c.id} c={c} />)}
          </div>
          {view === 'map' && (
            <div className="cv-map">
              <div className="cv-map__note">카카오맵 영역 · 운영 실연결</div>
              <div className="cv-map__pin" style={{ left: '30%', top: '34%' }}><span>sports_basketball</span></div>
              <div className="cv-map__pin" style={{ left: '58%', top: '52%' }}><span>sports_basketball</span></div>
              <div className="cv-map__pin" style={{ left: '44%', top: '68%' }}><span>sports_basketball</span></div>
            </div>
          )}
        </div>

        {/* cross-domain: Phase 5 ranking */}
        <a className="cv-xlink" href="ru1-rankings.html" style={{ marginTop: 18 }}>
          <span className="cv-xlink__ico" style={{ background: 'var(--accent-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>leaderboard</span></span>
          <div className="cv-xlink__body">
            <div className="cv-xlink__t">코트별 체크인 랭킹</div>
            <div className="cv-xlink__d">Phase 5 랭킹 cross-domain — 코트마다 TOP 플레이어를 확인하세요</div>
          </div>
          <span className="cv-xlink__arr ico material-symbols-outlined">chevron_right</span>
        </a>
      </div>
    </div>
  );
}

window.Courts = Courts;
