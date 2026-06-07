# BDR v2.28 — Phase 8 (코트·장소) 박제

> **박제일**: 2026-06-07
> **선행**: Phase 1~7 완료 carry-over
> **선행 의뢰**: `courts-venues-user-redesign-prompt` + `courts-venues-partner-admin-redesign-prompt` + `courts-venues-user-partner-admin-connectivity-plan` (2026-05-31)
> **특수**: ★ **3 측 stakeholder** (사용자 + 파트너 Court Operator + super-admin Site Operator) · 가장 큰 묶음 (8 시안 · ~3198 LOC)

---

## 1. Phase 8 박제 시안 = 8 (3 측)

### Phase 8B — 사용자 측 (VU1~VU4 · A 등급)

| ID | 화면 | 라우트 | 분류 | 주 갭 |
|----|------|--------|------|-------|
| VU1 | Courts | `/courts` | 보강 | BV1 ★★★★ (발견성 검색·필터·지도·즐겨찾기·앰배서더) |
| VU2 | CourtDetail | `/courts/[id]` | 보강 | BV3 ★★★★ (4탭·리뷰 5항목·신고·편집 모달) |
| VU3 | CourtBooking | `/courts/[id]/booking + payment-fail + checkin` | **통합 신규** | BV2 ★★★★★ (3-step·토스 BU2 답습·체크인) |
| VU4 | VenueDetail | `/venues/[slug]` | 보강 | BV8 (공개 SEO·안 코트 list cross-domain) |

### Phase 8A — 관리자 측 (VP1~VP3 + VA1 · E 등급 · 2 측)

| ID | 화면 | 라우트 | 측 | 주 갭 |
|----|------|--------|----|-------|
| VP1 | PartnerAdmin | `/partner-admin` | Court Operator | BV4 ★★★ (hub·매출·코트 list) |
| VP2 | PartnerVenue | `/partner-admin/venue` | Court Operator | BV5 ★★★ (4 sub-tab·OO2 답습) |
| VP3 | PartnerCampaigns | `/partner-admin/campaigns + /[id]` | Court Operator | BV6 ★★★ (캠페인 통합·모달) |
| VA1 | AdminCourtsPartners | `/admin/courts + /admin/partners` | Site Operator | BV7 ★★ (4탭·코트·파트너·신고·편집) |

---

## 2. BV 양측·cross-domain 의존 검증 ✅

| BV | 등급 | 의존 | 데이터 |
|----|------|------|--------|
| BV1 | ★★★★ | VU1 발견성 | user_favorite_courts + court_ambassadors |
| BV2 | ★★★★★ | VU3 예약 | Phase 6.2 BU2 토스 위젯 + court_bookings + court_checkins |
| BV3 | ★★★★ | VU2 리뷰·신고 | court_reviews(v3) + court_reports + court_edit_suggestions |
| BV4 | ★★★ | VP1 hub | court_bookings 매출 cross-domain |
| BV5 | ★★★ | VP2 venue | court_infos + 운영시간·가격·정책 |
| BV6 | ★★★ | VP3 캠페인 | partners + campaigns |
| BV7 | ★★ | VA1 검수 | court_reports + court_edit_suggestions (OA1 + PA1 답습) |
| BV8 | ★★★ | cross-domain | Phase 1 venue / Phase 2 court_id / Phase 5 랭킹 / Phase 6.2 BU4 예약 |

---

## 3. carry-over (변경 ❌)

### 파일 — v2.27 그대로
- `tokens.css` / `shell.css` / `shared.jsx` / `game·team·org·comm·profile·billing·growth·auth-shared.*` (OperatorBadge / SeriesOperatorBadge / oa1-* / ca1-tabs / bl-modal·widget / StepIndicator / GrowthSpark) / `admin.css`
- Phase 1~7 = 모든 wrapper + jsx + _baseline carry-over (운영 코드 변경 0)

### 신규 추가
- `court-shared.jsx` — Phase 8 mock (COURTS / COURT_RATING_5 / COURT_REVIEWS / BOOKING_SLOTS / PARTNER / PARTNER_COURTS / CAMPAIGNS / VENUE_HOURS·PRICE / ADMIN_COURTS / ADMIN_PARTNERS / COURT_REPORTS / COURT_EDITS) + mini components (StarRating / FavButton / AmbassadorBadge / CvStatusBadge / **CourtOperatorBadge** / CourtCard / courtFee)
- `court-shared.css` — Phase 8 전용 (.cv-* : stars / fav / amb / stat / court-operator-badge / toolbar / card / hero / tabbar / rate5 / review / slots / xlink / booking / qr / partner-hero / pcourt / vtabs / cmp / atable)
- `screens/Courts.jsx` (VU1) / `CourtDetail.jsx` (VU2) / `CourtBooking.jsx` (VU3) / `VenueDetail.jsx` (VU4) / `PartnerAdmin.jsx` (VP1) / `PartnerVenue.jsx` (VP2) / `PartnerCampaigns.jsx` (VP3) / `AdminCourtsPartners.jsx` (VA1)
- 8 wrapper HTML (vu1~vu4 / vp1~vp3 / va1)

---

## 4. 자체 검수 — 13 룰 + Phase 8 특수 4 통과 ✅

### 13 룰
- ✅ 하드코딩 색상 = 토큰만 (예외: 별점 #F5A623 = 평점 표준색 / Court Operator navy gradient = Series Operator 답습 / 앰배서더 gold = trophy 토큰)
- ✅ lucide-react = 0 · Material Symbols Outlined 만 · 9999px = 0 (원형 50%)
- ✅ 가짜링크 = 0 · button 4px / 카드 8px · placeholder 5단어 이내
- ✅ iOS input 16px (.cv-search input) / 버튼 44px / 720px 분기 (3 측 grid 모두)
- ✅ Pretendard + Archivo + JetBrains Mono 만
- ✅ AppNav frozen — 사용자 시안(VU1~4) active="court" · 파트너·super-admin은 자체 영역(AppNav 외)

### Phase 8 특수 4
- ✅ **VU3 3-step wizard = Phase 6.2 BU2 답습 시각 일관** (bl-widget / bl-pm / StepIndicator 재사용 · 토스 mock 0)
- ✅ **즐겨찾기/앰배서더 badge 시각 분리** (.cv-fav 빨강 fill / .cv-amb gold)
- ✅ **5항목 평균 = v3 carry / 시각 통일** (.cv-rate5 시설/접근성/관리/혼잡도/만족)
- ✅ **cross-domain link Phase 1/2/5/6.2 정합** (.cv-xlink — 대회/경기/랭킹/예약)
- ✅ **3 측 badge 시각 분리** — Court Operator(navy+silver) vs Site Operator(dark+gold) vs 사용자(badge 없음)

---

## 5. 회귀 방지 ✅
- ❌ Phase 1~7 시안 변경 = 0 · 새 라우트 = 0
- ✅ VA1 모달 = Phase 2 UD1 답습 (알림 ✅ 기본 체크)
- ✅ Phase 6.2 court_bookings = VU3 예약 + VP1 매출 + BU4 ProfileBookings 동일 source

---

**박제 끝.** v2.27 carry-over 위 신규 8 시안 + court-shared.jsx/css 추가. 운영 코드 변경 0.
가정: 지도 = 카카오맵 placeholder(운영 실연결) · 캠페인/예약 통계 = mock · 토스 위젯 시각 박제(mock 0).
