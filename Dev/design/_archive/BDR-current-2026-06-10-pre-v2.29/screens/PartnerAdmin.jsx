/* global React */
// ============================================================
// BDR v2.28 — PartnerAdmin (VP1 · Phase 8A · 신규 hub · BV4 ★★★)
// 운영: /partner-admin (205) · 박제 ❌ → Court Operator hub.
// 측: Court Operator (파트너 · navy+silver badge).
//
// Hero (내 코트 N · 이번달 예약 M · 매출 ₩ K · 평점) + Court Operator badge +
// 본인 운영 코트 list (예약/매출/평점/status) + "새 코트 등록 신청" + "캠페인" CTA.
// ============================================================
function PartnerAdmin() {
  const p = window.PARTNER;
  const courts = window.PARTNER_COURTS;

  return (
    <div className="pm-page">
      <div className="pm-page__inner bl-wide">
        {/* Hero */}
        <header className="cv-partner-hero">
          <div>
            <window.CourtOperatorBadge />
            <h1 className="cv-partner-hero__title">{p.name} 대시보드</h1>
            <div className="cv-partner-hero__sub">PARTNER · 코트 운영 현황</div>
          </div>
          <div className="cv-partner-hero__stats">
            <div><div className="cv-partner-hero__stat-num">{p.courts}</div><div className="cv-partner-hero__stat-lbl">내 코트</div></div>
            <div><div className="cv-partner-hero__stat-num">{p.month_bookings}</div><div className="cv-partner-hero__stat-lbl">이번달 예약</div></div>
            <div><div className="cv-partner-hero__stat-num">{window.wonRaw(p.month_revenue)}</div><div className="cv-partner-hero__stat-lbl">이번달 매출</div></div>
            <div><div className="cv-partner-hero__stat-num">{p.avg_rating.toFixed(1)}</div><div className="cv-partner-hero__stat-lbl">평균 평점</div></div>
          </div>
        </header>

        {/* quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          <a className="cv-submit-cta" href="#" style={{ marginBottom: 0 }}>
            <span className="ico material-symbols-outlined">add_location_alt</span>
            <div className="cv-submit-cta__body"><div className="cv-submit-cta__t">새 코트 등록 신청</div><div className="cv-submit-cta__d">검수 후 운영 코트에 추가됩니다</div></div>
          </a>
          <a className="cv-submit-cta" href="vp3-partner-campaigns.html" style={{ marginBottom: 0, background: '#FBF0D6', borderColor: '#E8D5A8' }}>
            <span className="ico material-symbols-outlined" style={{ color: '#B47A11' }}>campaign</span>
            <div className="cv-submit-cta__body"><div className="cv-submit-cta__t">광고 캠페인</div><div className="cv-submit-cta__d">노출·클릭·매출 관리</div></div>
          </a>
        </div>

        {/* 코트 list */}
        <div className="pm-card">
          <div className="pm-card__head">
            <h2 className="pm-card__h"><span className="ico material-symbols-outlined">stadium</span>내 운영 코트</h2>
            <a className="pm-card__more" href="vp2-partner-venue.html">대관 정보 관리<span className="ico material-symbols-outlined">chevron_right</span></a>
          </div>
          {courts.map(c => (
            <div key={c.id} className="cv-pcourt">
              <div style={{ minWidth: 0 }}>
                <div className="cv-pcourt__name">{c.name}</div>
                <div className="cv-pcourt__loc">{c.city} · 체크인 {c.checkins}</div>
              </div>
              <div className="cv-pcourt__stat"><div className="cv-pcourt__stat-v">{c.bookings}</div><div className="cv-pcourt__stat-l">예약</div></div>
              <div className="cv-pcourt__stat"><div className="cv-pcourt__stat-v">{window.wonRaw(c.revenue)}</div><div className="cv-pcourt__stat-l">매출</div></div>
              <div className="cv-pcourt__stat"><div className="cv-pcourt__stat-v">★ {c.rating.toFixed(1)}</div><div className="cv-pcourt__stat-l">평점</div></div>
              <window.CvStatusBadge status={c.status} />
            </div>
          ))}
        </div>

        {/* cross-domain note */}
        <div className="bl-refund-note" style={{ marginTop: 14 }}>
          <span className="ico material-symbols-outlined">hub</span>
          <div>
            <div className="bl-refund-note__t">예약·매출은 Phase 6.2 결제와 연동됩니다</div>
            <div className="bl-refund-note__d">코트 예약 결제(court_bookings)는 토스페이먼츠로 처리되며, 정산 내역은 매월 등록 계좌로 지급됩니다. 사용자 예약 화면은 <a href="vu3-court-booking.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>VU3 예약</a>과 동일 데이터입니다.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PartnerAdmin = PartnerAdmin;
