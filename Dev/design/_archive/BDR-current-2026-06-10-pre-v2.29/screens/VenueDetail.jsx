/* global React */
// ============================================================
// BDR v2.28 — VenueDetail (VU4 · Phase 8B · 보강 · BV8 cross-domain)
// 운영: /venues/[slug] (552 · v2.2 P1-3 박제) — 공개 SEO 페이지 (비로그인 열람).
//
// Hero (venue 정보 + 위치) + 사진 갤러리 + 안 코트 list (cross-domain → VU2) +
// 리뷰 요약 + 비로그인 가입 CTA (→ AU1). 큰 carry-over · 작은 시각.
// ============================================================
function VenueDetail() {
  const c = window.COURTS[0];
  const venueCourts = window.COURTS.filter(x => x.partner === c.partner);

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        <div className="bl-crumb">
          <a href="p2-uc2-home.html">홈</a><span className="sep">›</span><a href="vu1-courts.html">코트</a><span className="sep">›</span><span>{c.city}</span><span className="sep">›</span><span className="cur">{c.partner}</span>
        </div>

        <div className="pm-grid">
          <div className="pm-main">
            {/* Hero */}
            <div className="cv-hero" style={{ marginBottom: 18 }}>
              <div className="cv-hero__photo" style={{ height: 220 }}>
                <div className="cv-hero__badges">
                  <span className="cv-card__type" style={{ position: 'static' }}>{c.type === 'indoor' ? '실내' : '야외'}</span>
                  <span className="cv-stat" data-tone="ok">대관 가능</span>
                  <span className="cv-stat" data-tone="neutral">★ {c.rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="cv-hero__body" style={{ display: 'block' }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>{c.city} · 체육관</div>
                <h1 className="cv-hero__name">{c.partner}</h1>
                <div className="cv-hero__loc"><span className="ico material-symbols-outlined">location_on</span>{c.addr}</div>
                <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.7, margin: '10px 0 0' }}>
                  {c.station} 인근 {c.type === 'indoor' ? '실내' : '야외'} 농구 전용 체육관. {c.surface} 바닥 · 골대 {c.hoops}개 · {c.parking ? '주차 가능' : '주차 불가'}. 픽업게임·게스트 매치·대관이 활발한 코트입니다.
                </p>
              </div>
            </div>

            {/* 사진 갤러리 */}
            <div className="pm-card">
              <div className="pm-sec-title" style={{ marginBottom: 12 }}>코트 사진</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{ aspectRatio: '1', borderRadius: 4, border: '1px solid var(--border)', display: 'grid', placeItems: 'center', color: 'var(--ink-dim)', fontSize: 10, fontFamily: 'var(--ff-mono)', background: 'repeating-linear-gradient(45deg, var(--bg-alt) 0 8px, var(--bg-head) 8px 16px)' }}>PHOTO {i}</div>
                ))}
              </div>
            </div>

            {/* 안 코트 list — cross-domain → VU2 */}
            <div className="pm-card">
              <h2 className="pm-card__h" style={{ marginBottom: 12 }}><span className="ico material-symbols-outlined">stadium</span>이 체육관의 코트 {venueCourts.length}</h2>
              {venueCourts.map(x => (
                <a key={x.id} className="cv-xlink" href="vu2-court-detail.html">
                  <span className="cv-xlink__ico" style={{ background: 'var(--cafe-blue-soft)' }}><span className="ico material-symbols-outlined" style={{ color: 'var(--cafe-blue-deep)' }}>sports_basketball</span></span>
                  <div className="cv-xlink__body">
                    <div className="cv-xlink__t">{x.name}</div>
                    <div className="cv-xlink__d">{x.surface} · 골대 {x.hoops}개 · {window.courtFee(x)}</div>
                  </div>
                  <window.StarRating value={x.rating} />
                </a>
              ))}
            </div>

            {/* 리뷰 요약 */}
            <div className="pm-card">
              <div className="pm-card__head">
                <h2 className="pm-card__h"><span className="ico material-symbols-outlined">reviews</span>리뷰 {c.reviews}</h2>
                <a className="pm-card__more" href="vu2-court-detail.html">전체 보기<span className="ico material-symbols-outlined">chevron_right</span></a>
              </div>
              {window.COURT_REVIEWS.slice(0, 2).map(r => (
                <div key={r.id} className="cv-review">
                  <div className="cv-review__head">
                    <span className="cv-review__av">{r.avatar}</span>
                    <div className="cv-review__who"><div className="cv-review__name">{r.user}</div><div className="cv-review__date">{r.date}</div></div>
                    <window.StarRating value={r.rating} showNum={false} />
                  </div>
                  <div className="cv-review__text">{r.text}</div>
                </div>
              ))}
            </div>
          </div>

          <aside className="pm-aside">
            {/* 정보 */}
            <div className="pm-card" style={{ padding: 18 }}>
              <div className="pm-sec-title" style={{ marginBottom: 10 }}>시설 정보</div>
              <div className="au-summary" style={{ border: 0 }}>
                <div className="au-summary__row" style={{ padding: '8px 0' }}><span className="au-summary__l">유형</span><span className="au-summary__v">{c.type === 'indoor' ? '실내' : '야외'} · {c.surface}</span></div>
                <div className="au-summary__row" style={{ padding: '8px 0' }}><span className="au-summary__l">조명 / 주차</span><span className="au-summary__v">{c.lighting ? '조명 O' : '조명 X'} · {c.parking ? '주차 O' : '주차 X'}</span></div>
                <div className="au-summary__row" style={{ padding: '8px 0' }}><span className="au-summary__l">최근역</span><span className="au-summary__v">{c.station}</span></div>
                <div className="au-summary__row" style={{ padding: '8px 0', borderBottom: 0 }}><span className="au-summary__l">대관료</span><span className="au-summary__v">{window.courtFee(c)}</span></div>
              </div>
            </div>

            {/* 위치 */}
            <div className="pm-card" style={{ padding: 16 }}>
              <div className="pm-sec-title" style={{ marginBottom: 10 }}>위치</div>
              <div className="cv-map" style={{ position: 'relative', height: 180 }}>
                <div className="cv-map__note">카카오맵</div>
                <div className="cv-map__pin" style={{ left: '46%', top: '42%' }}><span>place</span></div>
              </div>
            </div>

            {/* 비로그인 가입 CTA (공개 SEO → AU1) */}
            <div className="pm-card" style={{ padding: 20, background: 'linear-gradient(135deg, var(--accent-soft), transparent)' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', marginBottom: 8 }}>이 코트에서 더 많이 즐기려면</div>
              <ul style={{ margin: '0 0 14px', padding: '0 0 0 18px', fontSize: 12, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
                <li>진행 예정 픽업·게스트 모집 참여</li>
                <li>실시간 체크인 · 리뷰 작성</li>
                <li>코트 예약 · 대관</li>
              </ul>
              <a className="au-btn au-btn--accent" href="au1-login-signup.html" style={{ marginBottom: 8 }}>가입하고 시작 →</a>
              <a className="au-btn au-btn--ghost" href="au1-login-signup.html">이미 회원이에요</a>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

window.VenueDetail = VenueDetail;
