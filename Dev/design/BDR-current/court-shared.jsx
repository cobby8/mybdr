/* global React */
// ============================================================
// BDR v2.28 — court-shared.jsx
// Phase 8 (코트·장소) 박제 공용 데이터 + mini components. 3 측 (사용자/파트너/super-admin).
// shared / profile / billing / org-shared 답습. Phase 6 numbers / 6.2 BU4 cross-domain.
//
// ★ Prisma 모델: court_infos / court_bookings (Phase 6.2 BU4 cross) / court_checkins /
//   court_reviews / court_reports / court_edit_suggestions / user_favorite_courts /
//   court_ambassadors / partners (캠페인).
// BV1 발견성 · BV2 예약(토스 BU2 답습) · BV3 리뷰·신고 · BV8 cross-domain Phase 1/2/5/6.2.
// ============================================================

// ============================================================
// 1) courts — 코트 list (VU1 · VU2 · VP1 · VA1 동일 source)
//    rating 5항목: 시설/접근성/관리/혼잡도/만족 평균
// ============================================================
window.COURTS = [
  { id: 'c-882', name: '장충체육관 2코트', city: '서울', district: '중구', addr: '서울 중구 동호로 241',
    type: 'indoor', surface: '우레탄', hoops: 4, rating: 4.8, reviews: 124, fee: 15000, fee_unit: 'hour',
    station: '동대입구역 5번 출구', lighting: true, parking: true, restroom: true,
    fav: true, ambassador: true, ambassador_name: '박수빈', active_checkins: 12, pickups: 3, verified: true,
    booking_mode: 'internal', partner: '장충스포츠', primary: '#1B3C87' },
  { id: 'c-905', name: '송파 다목적체육관 A', city: '서울', district: '송파구', addr: '서울 송파구 양재대로 932',
    type: 'indoor', surface: '마루', hoops: 2, rating: 4.6, reviews: 88, fee: 15000, fee_unit: 'hour',
    station: '잠실역 3번 출구', lighting: true, parking: true, restroom: true,
    fav: true, ambassador: false, active_checkins: 8, pickups: 2, verified: true,
    booking_mode: 'internal', partner: '송파시설관리', primary: '#1B3C87' },
  { id: 'c-771', name: '강동 실내코트', city: '서울', district: '강동구', addr: '서울 강동구 천호대로 1139',
    type: 'indoor', surface: '우레탄', hoops: 2, rating: 4.4, reviews: 56, fee: 14000, fee_unit: 'hour',
    station: '강동역 2번 출구', lighting: true, parking: false, restroom: true,
    fav: false, ambassador: false, active_checkins: 5, pickups: 1, verified: true,
    booking_mode: 'internal', partner: '강동스포츠클럽', primary: '#1B3C87' },
  { id: 'c-640', name: '잠실학생체육관 1코트', city: '서울', district: '송파구', addr: '서울 송파구 올림픽로 25',
    type: 'indoor', surface: '마루', hoops: 4, rating: 4.7, reviews: 102, fee: 16000, fee_unit: 'hour',
    station: '종합운동장역 6번', lighting: true, parking: true, restroom: true,
    fav: true, ambassador: true, ambassador_name: '김지훈', active_checkins: 9, pickups: 4, verified: true,
    booking_mode: 'internal', partner: '서울시설공단', primary: '#1B3C87' },
  { id: 'c-512', name: '마포 실내코트 B', city: '서울', district: '마포구', addr: '서울 마포구 월드컵로 212',
    type: 'indoor', surface: '우레탄', hoops: 2, rating: 4.2, reviews: 41, fee: 13000, fee_unit: 'hour',
    station: '마포구청역 1번', lighting: true, parking: true, restroom: false,
    fav: false, ambassador: false, active_checkins: 3, pickups: 0, verified: true,
    booking_mode: 'external', partner: '마포생활체육', primary: '#1B3C87' },
  { id: 'c-330', name: '한강 야외농구장', city: '서울', district: '영등포구', addr: '서울 영등포구 여의동로 330',
    type: 'outdoor', surface: '아스팔트', hoops: 6, rating: 4.5, reviews: 210, fee: 0, fee_unit: 'free',
    station: '여의나루역 2번', lighting: true, parking: true, restroom: true,
    fav: false, ambassador: true, ambassador_name: '이태우', active_checkins: 18, pickups: 5, verified: true,
    booking_mode: 'none', partner: null, primary: '#1B3C87' },
];

// VU2 상세 — 5항목 평균 + 리뷰 (court_reviews v3 carry)
window.COURT_RATING_5 = [
  { key: 'facility', label: '시설', val: 4.9 },
  { key: 'access',   label: '접근성', val: 4.7 },
  { key: 'manage',   label: '관리 상태', val: 4.8 },
  { key: 'crowd',    label: '혼잡도', val: 4.4 },
  { key: 'satisfy',  label: '종합 만족', val: 4.8 },
];
window.COURT_REVIEWS = [
  { id: 'rv-1', user: '김지훈', avatar: '김', rating: 5, date: '2026-05-22', photo: true,
    text: '바닥 관리가 정말 잘 돼있어요. 우레탄이라 무릎에 부담도 적고 조명도 밝습니다. 주차도 편해요.' },
  { id: 'rv-2', user: '한지원', avatar: '한', rating: 5, date: '2026-05-18', photo: false,
    text: '동대입구역에서 가까워서 접근성 최고. 평일 저녁엔 픽업게임도 활발해요.' },
  { id: 'rv-3', user: '정성훈', avatar: '정', rating: 4, date: '2026-05-10', photo: true,
    text: '시설은 훌륭한데 주말엔 사람이 많아서 코트 잡기가 좀 어렵습니다. 예약 추천.' },
];

// VU3 예약 — 가능 시간 grid (court_sessions / court_bookings)
window.BOOKING_SLOTS = [
  { t: '09:00', avail: true, spots: 2 }, { t: '10:00', avail: true, spots: 4 },
  { t: '11:00', avail: false, spots: 0 }, { t: '12:00', avail: true, spots: 6 },
  { t: '14:00', avail: true, spots: 3 }, { t: '15:00', avail: true, spots: 5 },
  { t: '16:00', avail: false, spots: 0 }, { t: '17:00', avail: true, spots: 2 },
  { t: '19:00', avail: true, spots: 4 }, { t: '20:00', avail: true, spots: 1 },
  { t: '21:00', avail: true, spots: 6 }, { t: '22:00', avail: false, spots: 0 },
];

// ============================================================
// 2) 파트너 측 (VP1 · VP2 · VP3 — Court Operator)
// ============================================================
window.PARTNER = { name: '장충스포츠', role: 'owner', courts: 3, month_bookings: 142, month_revenue: 4260000, avg_rating: 4.7 };
window.PARTNER_COURTS = [
  { id: 'c-882', name: '장충체육관 2코트', city: '서울 중구', bookings: 86, revenue: 2580000, rating: 4.8, status: 'active', checkins: 412 },
  { id: 'c-905', name: '송파 다목적체육관 A', city: '서울 송파구', bookings: 41, revenue: 1230000, rating: 4.6, status: 'active', checkins: 198 },
  { id: 'c-512', name: '마포 실내코트 B', city: '서울 마포구', bookings: 15, revenue: 450000, rating: 4.2, status: 'pending', checkins: 67 },
];
window.CAMPAIGNS = [
  { id: 'cmp-1', title: '2026 봄 시즌 대관 프로모션', headline: '장충체육관 대관 30% 할인', status: 'approved',
    impressions: 24800, clicks: 612, revenue: 1840000, ctr: 2.47, budget: 500000, spent: 312000, start: '2026-05-01', end: '2026-06-30' },
  { id: 'cmp-2', title: '주말 게스트 매치 모집', headline: '송파 코트 주말 게스트 상시 모집', status: 'approved',
    impressions: 12400, clicks: 388, revenue: 920000, ctr: 3.13, budget: 300000, spent: 188000, start: '2026-05-10', end: '2026-06-10' },
  { id: 'cmp-3', title: '신규 코트 오픈 이벤트', headline: '마포 실내코트 B 오픈 — 첫 예약 무료', status: 'pending_review',
    impressions: 0, clicks: 0, revenue: 0, ctr: 0, budget: 200000, spent: 0, start: '2026-06-01', end: '2026-06-30' },
  { id: 'cmp-4', title: '겨울 시즌 종료 캠페인', headline: '겨울 리그 마감 할인', status: 'ended',
    impressions: 31200, clicks: 724, revenue: 2100000, ctr: 2.32, budget: 600000, spent: 600000, start: '2026-01-05', end: '2026-02-28' },
];
window.CAMPAIGN_STATUS = {
  draft:          { label: '임시저장', tone: 'mute' },
  pending_review: { label: '심사 대기', tone: 'warn' },
  approved:       { label: '게재 중',  tone: 'ok' },
  rejected:       { label: '반려',     tone: 'err' },
  paused:         { label: '일시정지', tone: 'mute' },
  ended:          { label: '종료',     tone: 'neutral' },
};

// VP2 venue 관리 — 운영 시간 / 가격 / 정책
window.VENUE_HOURS = [
  { day: '평일', open: '06:00', close: '23:00' },
  { day: '토요일', open: '08:00', close: '22:00' },
  { day: '일요일', open: '08:00', close: '21:00' },
  { day: '공휴일', open: '휴무', close: '' },
];
window.VENUE_PRICE = [
  { label: '주중 (평일)', price: 15000 },
  { label: '주말·공휴일', price: 20000 },
  { label: '야간 (20시 이후)', price: 18000 },
  { label: 'BDR+ 회원', price: 12000, badge: '할인' },
];

// ============================================================
// 3) super-admin 측 (VA1 — Site Operator)
// ============================================================
window.ADMIN_COURTS = [
  { id: 'c-882', name: '장충체육관 2코트', city: '서울 중구', type: 'indoor', status: 'active', reviews: 124, partner: '장충스포츠', created: '2025-11-02' },
  { id: 'c-905', name: '송파 다목적체육관 A', city: '서울 송파구', type: 'indoor', status: 'active', reviews: 88, partner: '송파시설관리', created: '2025-12-14' },
  { id: 'c-512', name: '마포 실내코트 B', city: '서울 마포구', type: 'indoor', status: 'pending', reviews: 41, partner: '마포생활체육', created: '2026-05-20' },
  { id: 'c-330', name: '한강 야외농구장', city: '서울 영등포구', type: 'outdoor', status: 'active', reviews: 210, partner: null, created: '2025-08-30' },
  { id: 'c-201', name: '관악 실내코트', city: '서울 관악구', type: 'indoor', status: 'reported', reviews: 33, partner: '관악스포츠', created: '2026-04-11' },
  { id: 'c-150', name: '폐쇄된 옥상코트', city: '서울 성동구', type: 'outdoor', status: 'suspended', reviews: 12, partner: null, created: '2025-06-20' },
];
window.ADMIN_PARTNERS = [
  { id: 'pt-1', name: '장충스포츠', courts: 3, campaigns: 4, status: 'active', contact: '김운영', joined: '2025-10-15' },
  { id: 'pt-2', name: '송파시설관리', courts: 2, campaigns: 1, status: 'active', contact: '이관리', joined: '2025-11-30' },
  { id: 'pt-3', name: '마포생활체육', courts: 1, campaigns: 1, status: 'review', contact: '박담당', joined: '2026-05-18' },
  { id: 'pt-4', name: '관악스포츠', courts: 1, campaigns: 0, status: 'suspended', contact: '정대표', joined: '2026-02-10' },
];
window.COURT_REPORTS = [
  { id: 'rp-1', court: '관악 실내코트', reporter: '한지원', reason: '시설 정보 불일치 (조명 없음)', date: '2026-05-28', status: 'pending' },
  { id: 'rp-2', court: '장충체육관 2코트', reporter: '서민재', reason: '주차 불가인데 가능으로 표시', date: '2026-05-25', status: 'pending' },
  { id: 'rp-3', court: '한강 야외농구장', reporter: '김지훈', reason: '폐쇄된 시간대 표시 오류', date: '2026-05-20', status: 'resolved' },
];
window.COURT_EDITS = [
  { id: 'ed-1', court: '강동 실내코트', user: '정성훈', field: '운영시간', from: '06:00–22:00', to: '06:00–23:00', date: '2026-05-27', status: 'pending' },
  { id: 'ed-2', court: '마포 실내코트 B', user: '한지원', field: '주차', from: '불가', to: '가능 (인근 공영)', date: '2026-05-24', status: 'pending' },
  { id: 'ed-3', court: '송파 다목적체육관 A', user: '이태우', field: '바닥재', from: '우레탄', to: '마루', date: '2026-05-19', status: 'approved' },
];

// ============================================================
// 4) Helpers
// ============================================================
window.courtFee = function courtFee(c) {
  if (c.fee === 0 || c.fee_unit === 'free') return '무료';
  return '₩' + Number(c.fee).toLocaleString('ko-KR') + (c.fee_unit === 'hour' ? '/시간' : '');
};
window.CV_STATUS = {
  active:    { label: '활성',     tone: 'ok' },
  pending:   { label: '미승인',   tone: 'warn' },
  suspended: { label: '정지',     tone: 'mute' },
  reported:  { label: '신고됨',   tone: 'err' },
  review:    { label: '검수 대기', tone: 'warn' },
  resolved:  { label: '처리 완료', tone: 'ok' },
  approved:  { label: '반영됨',   tone: 'ok' },
};

// ============================================================
// 5) Mini Components
// ============================================================

// StarRating — 별점 (별 + 숫자)
window.StarRating = function StarRating({ value, size = 13, showNum = true }) {
  const full = Math.round(value);
  return (
    <span className="cv-stars" style={{ fontSize: size }}>
      <span className="cv-stars__on" style={{ width: (value / 5 * 100) + '%' }}>★★★★★</span>
      <span className="cv-stars__off">★★★★★</span>
      {showNum && <span className="cv-stars__num">{value.toFixed(1)}</span>}
    </span>
  );
};

// FavButton — 즐겨찾기 토글 (user_favorite_courts)
window.FavButton = function FavButton({ on, onClick, float = false }) {
  const [fav, setFav] = React.useState(on);
  return (
    <button className={'cv-fav' + (fav ? ' is-on' : '') + (float ? ' cv-fav--float' : '')}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFav(f => !f); onClick && onClick(); }}
      aria-label="즐겨찾기">
      <span className="ico material-symbols-outlined">{fav ? 'favorite' : 'favorite_border'}</span>
    </button>
  );
};

// AmbassadorBadge — 코트 앰배서더 (court_ambassadors)
window.AmbassadorBadge = function AmbassadorBadge({ name, compact = false }) {
  return (
    <span className={'cv-amb' + (compact ? ' cv-amb--compact' : '')}>
      <span className="ico material-symbols-outlined">workspace_premium</span>
      {compact ? '앰배서더' : (name ? name + ' 앰배서더' : '앰배서더 코트')}
    </span>
  );
};

// CvStatusBadge — 코트/파트너/캠페인 status
window.CvStatusBadge = function CvStatusBadge({ status, map }) {
  const m = (map || window.CV_STATUS)[status] || { label: status, tone: 'mute' };
  return <span className="cv-stat" data-tone={m.tone}>{m.label}</span>;
};

// CourtOperatorBadge — 파트너 (Court Operator · navy+silver · Series Operator 답습)
window.CourtOperatorBadge = function CourtOperatorBadge() {
  return (
    <span className="court-operator-badge">
      <span className="ico material-symbols-outlined">stadium</span>
      Court Operator
    </span>
  );
};

// CourtCard — VU1 코트 카드
window.CourtCard = function CourtCard({ c, href = 'vu2-court-detail.html' }) {
  return (
    <a className="cv-card" href={href}>
      <div className="cv-card__photo" data-type={c.type}>
        <span className="cv-card__type">{c.type === 'indoor' ? '실내' : '야외'}</span>
        <window.FavButton on={c.fav} float />
        {c.ambassador && <span className="cv-card__amb"><span className="ico material-symbols-outlined">workspace_premium</span></span>}
        <span className="ico material-symbols-outlined cv-card__photo-ico">sports_basketball</span>
      </div>
      <div className="cv-card__body">
        <div className="cv-card__name">{c.name}</div>
        <div className="cv-card__loc"><span className="ico material-symbols-outlined">location_on</span>{c.district} · {c.station}</div>
        <div className="cv-card__meta">
          <window.StarRating value={c.rating} />
          <span className="cv-card__rev">리뷰 {c.reviews}</span>
        </div>
        <div className="cv-card__foot">
          <span className="cv-card__fee" data-free={c.fee === 0}>{window.courtFee(c)}</span>
          {c.active_checkins > 0 && <span className="cv-card__live"><span className="cv-dot"></span>{c.active_checkins}명 이용 중</span>}
        </div>
      </div>
    </a>
  );
};
