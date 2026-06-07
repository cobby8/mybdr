/* global React */
// ============================================================
// BDR v2.28 — CourtDetail (VU2 · Phase 8B · 보강 · BV3 ★★★★)
// 운영: /courts/[id] (323 · v3 ContextReviews + 5항목 평균 + ReviewForm) — 보강.
//
// Hero band (코트 + 평점 + 즐겨찾기 + 예약 CTA → VU3) + 4 탭
//   (overview / 리뷰 5항목 / 예약 가능 시간 / 신고·편집) + 신고 모달(court_reports)
//   + 편집 제안 모달(court_edit_suggestions). cross-domain Phase 1/2/5.
// ============================================================
const VU2_TABS = [
  { key: 'overview', lbl: '개요', ico: 'info' },
  { key: 'reviews',  lbl: '리뷰', ico: 'reviews' },
  { key: 'slots',    lbl: '예약 가능 시간', ico: 'schedule' },
  { key: 'report',   lbl: '신고·편집', ico: 'flag' },
];

function CourtDetail() {
  const c = window.COURTS[0];
  const [tab, setTab] = React.useState('overview');
  const [modal, setModal] = React.useState(null); // 'report' | 'edit'

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div className="bl-crumb">
          <a href="vu1-courts.html">코트</a><span className="sep">›</span><span>{c.city}</span><span className="sep">›</span><span className="cur">{c.name}</span>
        </div>

        {/* Hero */}
        <div className="cv-hero">
          <div className="cv-hero__photo">
            <div className="cv-hero__badges">
              <span className="cv-card__type" style={{ position: 'static' }}>{c.type === 'indoor' ? '실내' : '야외'}</span>
              {c.ambassador && <window.AmbassadorBadge name={c.ambassador_name} />}
              {c.verified && <span className="cv-stat" data-tone="ok">검증됨</span>}
            </div>
          </div>
          <div className="cv-hero__body">
            <div style={{ minWidth: 0 }}>
              <h1 className="cv-hero__name">{c.name}</h1>
              <div className="cv-hero__loc"><span className="ico material-symbols-outlined">location_on</span>{c.addr} · {c.station}</div>
              <div className="cv-hero__meta">
                <window.StarRating value={c.rating} size={15} />
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-mute)' }}>리뷰 {c.reviews}</span>
                <span className="cv-card__live"><span className="cv-dot"></span>{c.active_checkins}명 이용 중</span>
                <span style={{ fontFamily: 'var(--ff-display)', fontSize: 16, fontWeight: 800 }}>{window.courtFee(c)}</span>
              </div>
            </div>
            <div className="cv-hero__actions">
              <window.FavButton on={c.fav} />
              <a className="btn btn--primary" href="vu3-court-booking.html" style={{ minHeight: 44 }}><span className="ico material-symbols-outlined">event_available</span>예약하기</a>
            </div>
          </div>
        </div>

        {/* tabs */}
        <div className="cv-tabbar">
          {VU2_TABS.map(t => (
            <button key={t.key} className={'cv-tab' + (tab === t.key ? ' is-on' : '')} onClick={() => setTab(t.key)}>
              <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="pm-grid">
            <div className="pm-main">
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">tune</span>시설 정보</h2>
                <div className="cv-infogrid">
                  <div className="cv-info"><div className="cv-info__l">바닥재</div><div className="cv-info__v">{c.surface}</div></div>
                  <div className="cv-info"><div className="cv-info__l">골대</div><div className="cv-info__v">{c.hoops}개</div></div>
                  <div className="cv-info"><div className="cv-info__l">조명</div><div className="cv-info__v"><span className="ico material-symbols-outlined">{c.lighting ? 'check' : 'close'}</span>{c.lighting ? '있음' : '없음'}</div></div>
                  <div className="cv-info"><div className="cv-info__l">주차</div><div className="cv-info__v"><span className="ico material-symbols-outlined">{c.parking ? 'check' : 'close'}</span>{c.parking ? '가능' : '불가'}</div></div>
                  <div className="cv-info"><div className="cv-info__l">화장실</div><div className="cv-info__v"><span className="ico material-symbols-outlined">{c.restroom ? 'check' : 'close'}</span>{c.restroom ? '있음' : '없음'}</div></div>
                  <div className="cv-info"><div className="cv-info__l">최근역</div><div className="cv-info__v" style={{ fontSize: 12.5 }}>{c.station}</div></div>
                  <div className="cv-info"><div className="cv-info__l">운영</div><div className="cv-info__v" style={{ fontSize: 12.5 }}>{c.partner || '공공'}</div></div>
                  <div className="cv-info"><div className="cv-info__l">이용료</div><div className="cv-info__v">{window.courtFee(c)}</div></div>
                </div>
              </div>
              {/* map */}
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 14 }}><span className="ico material-symbols-outlined">map</span>위치</h2>
                <div className="cv-map" style={{ position: 'relative', height: 240 }}>
                  <div className="cv-map__note">카카오맵 · {c.addr}</div>
                  <div className="cv-map__pin" style={{ left: '46%', top: '44%' }}><span>sports_basketball</span></div>
                </div>
              </div>
            </div>
            <aside className="pm-aside">
              {/* cross-domain */}
              <div className="pm-card" style={{ padding: 16 }}>
                <div className="pm-sec-title" style={{ marginBottom: 10 }}>이 코트에서</div>
                <a className="cv-xlink" href="ua1-tournaments.html">
                  <span className="cv-xlink__ico" style={{ background: 'var(--accent-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>emoji_events</span></span>
                  <div className="cv-xlink__body"><div className="cv-xlink__t">예정 대회 2건</div><div className="cv-xlink__d">Phase 1 대회</div></div>
                  <span className="cv-xlink__arr ico material-symbols-outlined">chevron_right</span>
                </a>
                <a className="cv-xlink" href="p2-ua1-games.html">
                  <span className="cv-xlink__ico" style={{ background: 'var(--cafe-blue-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>sports_basketball</span></span>
                  <div className="cv-xlink__body"><div className="cv-xlink__t">이 코트 경기 5건</div><div className="cv-xlink__d">Phase 2 경기</div></div>
                  <span className="cv-xlink__arr ico material-symbols-outlined">chevron_right</span>
                </a>
                <a className="cv-xlink" href="ru1-rankings.html" style={{ marginBottom: 0 }}>
                  <span className="cv-xlink__ico" style={{ background: '#FBF0D6' }}><span className="ico material-symbols-outlined" style={{ color: '#B47A11' }}>leaderboard</span></span>
                  <div className="cv-xlink__body"><div className="cv-xlink__t">코트 랭킹</div><div className="cv-xlink__d">Phase 5 랭킹</div></div>
                  <span className="cv-xlink__arr ico material-symbols-outlined">chevron_right</span>
                </a>
              </div>
            </aside>
          </div>
        )}

        {/* REVIEWS — 5항목 평균 (v3 carry) */}
        {tab === 'reviews' && (
          <div className="pm-grid">
            <div className="pm-main">
              <div className="pm-card">
                <div className="pm-card__head">
                  <h2 className="pm-card__h"><span className="ico material-symbols-outlined">reviews</span>리뷰 {c.reviews}</h2>
                  <button className="btn btn--sm btn--primary"><span className="ico material-symbols-outlined">edit</span>리뷰 작성</button>
                </div>
                {window.COURT_REVIEWS.map(r => (
                  <div key={r.id} className="cv-review">
                    <div className="cv-review__head">
                      <span className="cv-review__av">{r.avatar}</span>
                      <div className="cv-review__who"><div className="cv-review__name">{r.user}</div><div className="cv-review__date">{r.date}</div></div>
                      <window.StarRating value={r.rating} showNum={false} />
                    </div>
                    <div className="cv-review__text">{r.text}</div>
                    {r.photo && <div className="cv-review__photo">PHOTO</div>}
                  </div>
                ))}
              </div>
            </div>
            <aside className="pm-aside">
              <div className="pm-card">
                <h2 className="pm-card__h" style={{ marginBottom: 6 }}><span className="ico material-symbols-outlined">analytics</span>항목별 평점</h2>
                <div style={{ textAlign: 'center', padding: '8px 0 14px' }}>
                  <div style={{ fontFamily: 'var(--ff-display)', fontSize: 40, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{c.rating.toFixed(1)}</div>
                  <window.StarRating value={c.rating} showNum={false} size={16} />
                </div>
                <div className="cv-rate5">
                  {window.COURT_RATING_5.map(r => (
                    <div key={r.key} className="cv-rate-row">
                      <span className="cv-rate-row__l">{r.label}</span>
                      <span className="cv-rate-row__track"><span className="cv-rate-row__fill" style={{ width: (r.val / 5 * 100) + '%' }}></span></span>
                      <span className="cv-rate-row__v">{r.val.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* SLOTS */}
        {tab === 'slots' && (
          <div className="pm-card">
            <div className="pm-card__head">
              <h2 className="pm-card__h"><span className="ico material-symbols-outlined">schedule</span>오늘 예약 가능 시간</h2>
              <a className="btn btn--sm btn--primary" href="vu3-court-booking.html">예약 진행</a>
            </div>
            <div className="cv-slots">
              {window.BOOKING_SLOTS.map(s => (
                <button key={s.t} className="cv-slot" disabled={!s.avail}>
                  <div className="cv-slot__t">{s.t}</div>
                  <div className="cv-slot__s">{s.avail ? s.spots + '자리' : '마감'}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* REPORT/EDIT */}
        {tab === 'report' && (
          <div className="pm-card">
            <h2 className="pm-card__h" style={{ marginBottom: 6 }}><span className="ico material-symbols-outlined">fact_check</span>정보가 정확한가요?</h2>
            <p style={{ fontSize: 13, color: 'var(--ink-mute)', margin: '0 0 16px' }}>잘못된 정보를 신고하거나, 코트 정보 수정을 제안할 수 있어요. 검수 후 반영됩니다.</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn" onClick={() => setModal('report')}><span className="ico material-symbols-outlined">flag</span>잘못된 정보 신고</button>
              <button className="btn" onClick={() => setModal('edit')}><span className="ico material-symbols-outlined">edit_note</span>정보 수정 제안</button>
            </div>
          </div>
        )}
      </div>

      {/* 신고 모달 (court_reports) */}
      {modal === 'report' && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--accent)' }}>flag</span>잘못된 정보 신고</h3>
              <button className="bl-modal__close" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="pm-field" style={{ marginBottom: 12 }}>
                <label className="pm-field__l">신고 유형</label>
                <select className="pm-select"><option>시설 정보 불일치</option><option>운영시간 오류</option><option>폐쇄된 코트</option><option>기타</option></select>
              </div>
              <div className="pm-field" style={{ marginBottom: 0 }}>
                <label className="pm-field__l">상세 내용</label>
                <textarea className="pm-input" rows={3} placeholder="어떤 정보가 잘못됐는지 알려주세요"></textarea>
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setModal(null)}>취소</button>
              <button className="btn btn--primary" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">send</span>신고 접수</button>
            </div>
          </div>
        </div>
      )}

      {/* 편집 제안 모달 (court_edit_suggestions) */}
      {modal === 'edit' && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal" onClick={e => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>edit_note</span>정보 수정 제안</h3>
              <button className="bl-modal__close" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="pm-field" style={{ marginBottom: 12 }}>
                <label className="pm-field__l">수정할 항목</label>
                <select className="pm-select"><option>운영시간</option><option>주차</option><option>바닥재</option><option>이용료</option></select>
              </div>
              <div className="pm-field" style={{ marginBottom: 0 }}>
                <label className="pm-field__l">올바른 정보</label>
                <input className="pm-input" placeholder="예: 06:00–23:00" />
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn" onClick={() => setModal(null)}>취소</button>
              <button className="btn btn--primary" onClick={() => setModal(null)}><span className="ico material-symbols-outlined">check</span>제안 제출</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.CourtDetail = CourtDetail;
