# Phase 8 — 코트·장소 (Courts/Venues+Partner) 점검 리포트

> **작성일**: 2026-05-31
> **결재**: Phase 8 = **코트·장소** ✅
> **선행 박제**: Phase 1~7 완료
> **특수**: ★ **3 측 stakeholder** (사용자 + 파트너 + super-admin) · Phase 4 답습 / Phase 1/2/6.2 cross-domain

---

## 0. 영역 매핑

### 0-1. Phase 8 대상 (8 시안 통합)

| ID | 화면 | 라우트 | LOC | 박제 흔적 | 측 |
|----|------|--------|-----|----------|----|
| VU1 | Courts list (보강) | /courts | 153 | ✅ Phase 3 v2 (CourtsContentV2) | 사용자 |
| VU2 | CourtDetail (보강) | /courts/[id] | 323 | ✅ v3 (ContextReviews + 5항목) | 사용자 |
| VU3 | CourtBooking (통합 신규) | /courts/[id]/booking + payment-fail + checkin | 574 | ❌ | 사용자 |
| VU4 | VenueDetail (보강) | /venues/[slug] | 552 | ✅ v2.2 P1-3 | 사용자 |
| VP1 | PartnerAdmin (hub 신규) | /partner-admin | 205 | ❌ | 파트너 |
| VP2 | PartnerVenue (신규) | /partner-admin/venue | 259 | ❌ | 파트너 |
| VP3 | PartnerCampaigns (통합 신규) | /partner-admin/campaigns + [id] | 721 | ❌ | 파트너 |
| VA1 | AdminCourtsPartners (super-admin 통합) | /admin/courts + /admin/partners | 411 | ❌ | super-admin |

**총 LOC = ~3198** (Phase 4 단체 ~3370 비슷 규모).

### 0-2. Prisma 모델 (코트 영역 매우 풍부)

```
courts (line 1449) — 코트 본체
court_infos (1222) — 운영자 정보
court_bookings (1300) — 예약 (Phase 6.2 BU4 cross-domain)
court_checkins (1204) — 체크인
court_reviews (1334) — 리뷰
court_reports (1367) — 신고
court_edit_suggestions (1388) — 편집 제안
court_sessions (1426) — 세션
user_favorite_courts (2097) — 즐겨찾기
court_ambassadors (2313) — 코트 앰배서더
partners — 파트너 (광고/캠페인)
```

`venues` 모델 = 없음 — `/venues/[slug]` 는 별 routing 으로 큰 venue 처리.

### 0-3. cross-domain 다리

- Phase 1 대회 ↔ Tournament.venue / TournamentMatch.court_id
- Phase 2 경기 ↔ games.venue + court_id
- Phase 5 랭킹 ↔ /api/web/courts/[id]/rankings
- Phase 6.2 BU4 ↔ court_bookings 결제

---

## 1. 갭 식별 (BV1~BV8)

> **명명**: BV = "Bridge Venue/Court"

### BV1 — 코트 발견성 (★★★★)
사용자: VU1 list (검색/필터/지도) + VU4 venue cross / 즐겨찾기·앰배서더 표시.

### BV2 — 예약 흐름 (★★★★★)
사용자: VU3 booking + payment + checkin 통합 wizard (Phase 6.2 BU2 토스 위젯 답습).

### BV3 — 코트 상세 + 리뷰 + 신고 (★★★★)
사용자: VU2 v3 carry + 5항목 평균 + 본인 리뷰 + 신고 + 편집 제안.

### BV4 — 파트너 hub (★★★)
파트너: VP1 본인 코트 list / 통계 (예약/매출/체크인) / 캠페인 진입.

### BV5 — 파트너 venue 관리 (★★★)
파트너: VP2 venue 기본 정보 + 시간/가격 + 운영 정책 / Phase 4 OO2 답습 패턴.

### BV6 — 파트너 캠페인 (광고) (★★★)
파트너: VP3 campaigns 생성/관리 + 통계 + [id] 상세 / partners 모델.

### BV7 — super-admin 검수 (★★)
VA1 코트 승인 / 파트너 검수 / 신고 처리 (Phase 4 OA1 + Phase 6.1 PA1 답습).

### BV8 — Phase 1/2/5/6.2 cross-domain 정합 (★★★)
- Phase 1 venue / Phase 2 court_id / Phase 5 랭킹 / Phase 6.2 BU4 예약 = 동일 데이터 source

---

## 2. 의뢰 범위 — 8 시안 (3 측)

```
사용자 4: VU1 + VU2 + VU3 (예약 통합) + VU4
파트너 3: VP1 hub + VP2 venue + VP3 campaigns 통합
super-admin 1: VA1 통합
```

→ Phase 4 답습 = 의뢰서 2건 (사용자 + admin · 파트너 = admin 의뢰서 안 분리 표기).

또는 **의뢰서 3건** (사용자 + 파트너 + super-admin) — Phase 4 답습 패턴. 권장 = 2건 통합 (관리자 의뢰서 안 파트너 측 + super-admin 측 명확 분리).

---

**리포트 끝.**
