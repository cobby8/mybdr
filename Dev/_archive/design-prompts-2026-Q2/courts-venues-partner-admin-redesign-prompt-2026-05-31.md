# 클로드 디자인 의뢰 — 코트·장소 관리자 측 (Phase 8A · 파트너 + super-admin)

> **본 의뢰**: 4 시안 (VP1~VP3 + VA1) · 2 측 (Series Operator 답습 = Court Operator + Site Operator)

---

## 0. 진입 표준 절차

Phase 4/6.1/7 admin 의뢰서 §0 답습. ★ 2 측 badge 분리 — Court Operator (파트너) vs Site Operator (super-admin).

---

## 1. 한 줄 요약

`/partner-admin` (VP1 hub) + `/partner-admin/venue` (VP2) + `/partner-admin/campaigns + [id]` (VP3 통합) + `/admin/courts + /admin/partners` (VA1 통합) = **4 시안**.

---

## 2. 결재 룰

- ✅ Court Operator badge (파트너 · navy+silver — Phase 4 Series Operator 답습)
- ✅ Site Operator badge (super-admin · dark+gold — Phase 4 OA1 답습)
- ✅ Phase 2 UD1 알림 모달 + Phase 3 TA2 모달 + Phase 6.2 BA1 결제 모달 답습
- ❌ 새 라우트 ❌

---

## 3. 4 시안 사양

### VP1 — PartnerAdmin (파트너 hub · 신규) · `/partner-admin`

**현황**: 205 line · 박제 ❌

**시안 (신규 · Court Operator)**:
- Hero band — "내 코트 N · 이번달 예약 M · 매출 ₩ K · 평점 X.Y"
- Court Operator badge
- 본인 운영 코트 list 카드 (각 카드 + 예약 / 매출 / 평점 / 활성 status)
- "+ 새 코트 등록 신청" CTA → /courts/submit
- "캠페인 진입" CTA → VP3

### VP2 — PartnerVenue (venue 관리 · 신규) · `/partner-admin/venue`

**현황**: 259 line · 박제 ❌

**시안 (신규 · Phase 4 OO2 답습 4 sub-tab)**:
- 탭 1 = 기본 정보 (name/description/위치/사진)
- 탭 2 = 시간/가격 (영업 시간 / 가격 정책 / 휴무일)
- 탭 3 = 정책 (예약 정책 / 환불 정책 / 규정)
- 탭 4 = 통계 (예약 추세 + 매출 차트 + 평점 추세)

### VP3 — PartnerCampaigns (광고 캠페인 통합 · 신규) · `/partner-admin/campaigns` + `/[id]`

**현황**: 355 + 366 = 721 · 박제 ❌

**시안 (통합 · 작은 hub)**:
- VP3-A · list = 캠페인 카드 grid (각 + 노출 수 + 클릭 수 + 매출 + status)
- VP3-B · 상세 (모달 또는 별 화면 — partners 모델 활용)
- "+ 새 캠페인" CTA → 폼 모달 (예산 / 대상 / 기간 / 광고 자산)

### VA1 — AdminCourtsPartners (super-admin 통합) · `/admin/courts` + `/admin/partners`

**현황**: 132 + 279 = 411 · 박제 ❌

**시안 (통합 · Phase 4 OA1 + Phase 6.1 PA1 답습)**:
- Hero band — "전체 코트 N · 활성 N · 미승인 N · 파트너 M · 캠페인 K"
- Site Operator badge
- 탭 1 = 코트 list (활성/미승인/정지/신고됨)
- 탭 2 = 파트너 list (활성/검수 대기/정지)
- 탭 3 = 신고 처리 (court_reports)
- 탭 4 = 편집 제안 (court_edit_suggestions)
- 모달 (status 변경 / 신고 처리) = Phase 2 UD1 + Phase 4 OA1 답습 (알림 ✅ 기본)

---

## 4. 양측 의존 검증

| BV | 본 의뢰 | 사용자 측 | cross-domain |
|----|---------|----------|-------------|
| BV4 | VP1 hub | VU1 카드 | court_bookings 매출 |
| BV5 | VP2 venue | VU4 detail | courts.* + court_infos |
| BV6 | VP3 캠페인 | (없음) | partners + campaigns |
| BV7 | VA1 검수 | VU2 신고/편집 | court_reports + court_edit_suggestions |

---

## 5. 13 룰 + Phase 1~7 carry-over

- ❌ 새 라우트 ❌ / Phase 1~7 carry-over
- ✅ 2 측 badge (Court Operator = navy+silver / Site Operator = dark+gold)
- ✅ Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 답습

---

## 6. 자체 검수

기본 12 + 특수 4:
- ✅ 2 측 badge 시각 분리
- ✅ VP2 4 sub-tab = Phase 4 OO2 답습
- ✅ VA1 4 탭 = 코트 + 파트너 + 신고 + 편집
- ✅ 모달 = Phase 2 UD1 답습 (알림 ✅)

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 코트·장소 관리자 측 (Phase 8A · VP1~VP3 + VA1)

이해: VP1 파트너 hub + VP2 venue 4 sub-tab + VP3 캠페인 통합 + VA1 super-admin 통합 (코트+파트너+신고+편집).
양측 의존 = BV4/BV5/BV6/BV7.
2 측 badge 분리 (Court Operator vs Site Operator) / Phase 4 OA1 + 6.1 PA1 + 6.2 BA1 답습.
자체 검수: 06 §관리자 / 모달
작업 시작.
```

---

**의뢰서 끝.**
