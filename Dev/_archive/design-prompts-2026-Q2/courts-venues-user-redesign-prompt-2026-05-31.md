# 클로드 디자인 의뢰 — 코트·장소 사용자 측 (Phase 8B)

> **선행**: Phase 1~7 박제 완료
> **본 의뢰**: 4 시안 (VU1~VU4) · 사용자 측
> **★ Phase 6.2 BU4 예약 cross-domain 정합 / 토스 위젯 답습**

---

## 0. 진입 표준 절차

Phase 7 의뢰서 §0 답습. Phase 1~7 carry-over (변경 ❌).

---

## 1. 한 줄 요약

`/courts` (VU1 보강) + `/courts/[id]` (VU2 보강) + `/courts/[id]/booking` 통합 (VU3 신규 + payment-fail + checkin) + `/venues/[slug]` (VU4 보강) = **4 시안**.

---

## 2. 결재 룰

- ✅ **BV1 발견성** = VU1 검색/필터/지도 + 즐겨찾기 (user_favorite_courts) + 앰배서더 (court_ambassadors) 표시
- ✅ **BV2 예약 wizard** = VU3 = Phase 6.2 BU2 토스 위젯 답습 + booking + payment-fail + checkin 통합 3-step
- ✅ **BV3 리뷰 + 신고** = VU2 v3 carry-over + 5항목 평균 + court_reports 신고
- ✅ **BV8 cross-domain** = Phase 1 venue / Phase 2 court_id / Phase 5 랭킹 / Phase 6.2 BU4 예약 = 동일 source
- ❌ 새 라우트 ❌ / Phase 1~7 시안 변경 ❌

---

## 3. 4 시안 사양

### VU1 — Courts list (보강) · `/courts`

**현황**: 153 line · Phase 3 v2 박제 ✅ (CourtsContentV2)

**보강**:
- 검색 + 필터 (region/district + 가격대 + 평점 + 즐겨찾기만)
- 지도 보기 토글 (선택 / 모바일 list 우선)
- 카드 = 코트 logo + name + 평점 + 가격대 + 즐겨찾기 toggle (user_favorite_courts)
- "코트 등록 신청" CTA → /courts/submit
- 앰배서더 코트 = badge 강조 (court_ambassadors)
- Phase 5 RU1 cross-domain — "코트별 랭킹" link (/courts/[id]/rankings API)

### VU2 — CourtDetail (보강) · `/courts/[id]`

**현황**: 323 line · v3 박제 ✅ (ContextReviews + 5항목 평균 + ReviewForm 토글)

**보강**:
- Hero band — 코트 logo + name + 평점 + 즐겨찾기 + "예약하기" CTA (BV2 → VU3 진입)
- 4 탭 — overview / 리뷰 (5항목 carry) / 예약 가능 시간 / 신고·편집 제안
- 리뷰 = v3 carry / 5항목 평균 + 본인 리뷰 + 사진
- 신고 모달 (court_reports)
- 편집 제안 모달 (court_edit_suggestions)
- cross-domain - Phase 1 대회 (이 코트에서 진행 중/예정) + Phase 2 경기 (이 코트 경기 list) + Phase 5 랭킹 진입

### VU3 — CourtBooking (통합 신규) · `/courts/[id]/booking` + payment-fail + checkin

**현황**: booking (157) + payment-fail (236) + checkin (181) = 574 · 박제 ❌

**시안 (신규 통합 · 3-step wizard · Phase 6.2 BU2 토스 위젯 답습)**:
```
[Step 1] 시간 선택 — 가능 시간 grid (시간대 + 인원) + 가격 표시
[Step 2] 결제 — Phase 6.2 BU2 토스 위젯 임베드 (실 결제)
[Step 3] 사후 안내 — 성공 hero (예약 정보 + QR + CTA "체크인 페이지") / 실패 hero (Phase 6.2 BU5 답습)

[별 화면 · /checkin] 체크인 hero — QR 스캔 + 예약 정보 + "체크인 완료" CTA → court_checkins 기록
```

### VU4 — VenueDetail (보강) · `/venues/[slug]`

**현황**: 552 line · v2.2 P1-3 박제 ✅

**보강** (큰 carry-over · 작은 시각):
- Hero band — venue 정보 + 위치 지도
- 안 코트 list (이 venue 의 court 들 · cross-domain link → /courts/[id])
- cross-domain — Phase 1 대회 / Phase 2 경기 / Phase 5 랭킹

---

## 4. 양측 의존 검증

| BV | 본 의뢰 | cross-domain |
|----|---------|-------------|
| BV1 | VU1 발견성 | user_favorite_courts + court_ambassadors |
| BV2 | VU3 예약 통합 | Phase 6.2 BU2 토스 위젯 + court_bookings + court_checkins |
| BV3 | VU2 v3 carry | court_reviews + court_reports + court_edit_suggestions |
| BV8 | VU1/VU2/VU4 cross | Phase 1 venue / Phase 2 court_id / Phase 5 랭킹 / Phase 6.2 BU4 예약 |

---

## 5. 13 룰 + Phase 1~7 carry-over

- ❌ AppNav / 새 라우트 / Phase 1~7 시안 변경 ❌
- ✅ VU3 토스 위젯 = Phase 6.2 BU2 실 연결 답습 (mock 0)
- ✅ VU2 v3 / VU4 v2.2 carry-over (큰 시각 변경 ❌)

---

## 6. 자체 검수 — Phase 8 특수 4

기본 12 + 특수:
- ✅ VU3 3-step wizard = Phase 6.2 BU2 답습 시각 일관
- ✅ 즐겨찾기/앰배서더 badge 시각 분리
- ✅ 5항목 평균 = v3 carry / 시각 통일
- ✅ cross-domain link Phase 1/2/5/6.2 정합

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 코트·장소 사용자 측 (Phase 8B · VU1~VU4)

이해: VU1 발견성 + VU2 v3 carry + VU3 예약 wizard (토스 BU2 답습) + VU4 venue 보강.
양측 의존 = BV1/BV2/BV3/BV8.
Phase 1~7 carry-over / 토스 실연결 / cross-domain Phase 1/2/5/6.2.
자체 검수: 06 §사용자 / 위젯 / 리뷰
작업 시작.
```

---

**의뢰서 끝.**
