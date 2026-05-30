# Phase 6.2 — 결제·구독·예약 점검 리포트

> **작성일**: 2026-05-30
> **결재**: Phase 6.1 후속 = 6.2 결제·구독·예약 묶음
> **선행 박제**: Phase 1~5 + Phase 6.1 (본체) 박제 완료

---

## 0. 영역 매핑

### 0-1. Phase 6.2 대상 (7 시안)

| ID | 화면 | 라우트 | LOC | 박제 흔적 |
|----|------|--------|-----|----------|
| BU1 | Pricing (보강) | `/pricing` | 41 wrapper | ⚠ wrapper |
| BU2 | PricingCheckout (신규) | `/pricing/checkout` | 511 | ❌ |
| BU3 | ProfileBilling (신규) | `/profile/billing` | 1039 | ❌ |
| BU4 | ProfileBookings (보강) | `/profile/bookings` | 231 | ⚠ v2 부분 |
| BU5 | PricingResult (신규) | `/pricing/success` + `/fail` | 515 | ❌ |
| BA1 | AdminPayments (신규) | `/admin/payments` | 66 | ❌ |
| BA2 | AdminPlans (신규) | `/admin/plans` | 397 | ❌ |

**총 LOC = 2826** (Phase 4 단체와 비슷).

### 0-2. Prisma 모델

```
payments (line 1797)
  - 토스페이먼츠 운영 활성 (route.ts /payments/confirm + /[id]/refund 존재)
plans (line 2117)
  - 멤버십 플랜 (free/basic/premium 등)
user_subscriptions (line 2133)
  - 사용자 구독 상태
court_bookings (line 1300)
  - 코트 예약 (Phase 7 코트 영역 cross-domain)
```

### 0-3. 토스페이먼츠 연동 상태 = **운영 활성** (mock 0 박제)

운영 API:
- POST `/api/web/payments/confirm` — 결제 confirm
- POST `/api/web/payments/[id]/refund` — 환불
- POST `/api/web/payments/confirm/booking` — 예약 결제 confirm
- POST `/api/web/court-bookings/[id]/payment-cancel` — 예약 결제 취소

→ Phase 2C UA3 BG5 의 "토스 미연결 disabled" 가정과 차이 = **본 Phase 6.2 는 토스 실연결 시안** (실 데이터 사용).

---

## 1. 갭 식별 (BB1~BB7)

> **명명**: BB = "Bridge Billing" (결제 다리)

### BB1 — 멤버십 구독 (★★★★★)

**현황**: /pricing list (wrapper) + checkout (511) · plans + user_subscriptions

**갭**:
- BU1 = 플랜 list (free/basic/premium 등 · plans 모델) + 각 플랜 혜택 비교 카드
- BU2 = checkout 511 line · 토스 위젯 임베드 + 결제 confirm 흐름
- BU3 = 본인 구독 상태 + 다음 결제일 + 결제 수단 관리 + 구독 이력
- BA2 = super-admin 플랜 관리 (생성/수정/공개·비공개)

**의뢰 대상**: BU1 + BU2 + BU3 + BA2

### BB2 — 결제 이력 (★★★★)

**현황**: /profile/billing (1039) · payments 모델

**갭**:
- BU3 = 본인 payments list (성공/실패/환불) + 영수증 다운로드
- BA1 = super-admin 결제 list + 환불 처리 모달

**의뢰 대상**: BU3 + BA1

### BB3 — 결제 결과 (★★★)

**현황**: /pricing/success (227) + /pricing/fail (288)

**갭**:
- BU5 = success / fail 통합 hero + CTA (계속 결제 / 다시 시도 / 홈으로)

**의뢰 대상**: BU5

### BB4 — 코트 예약 결제 cross-domain (★★★)

**현황**: /profile/bookings (231 · v2 부분) · court_bookings 모델

**갭**:
- BU4 = 본인 예약 list (진행 중 / 종료 / 취소 / 환불) + 결제 cancel CTA
- Phase 7 (코트·장소) cross-domain — 본 영역에서는 사용자 본인 예약만

**의뢰 대상**: BU4

### BB5 — 토스 위젯 + confirm 흐름 (★★★★)

**현황**: 운영 confirm 라우트 활성

**갭**:
- BU2 checkout 안 토스 위젯 임베드 시각 박제 (운영 실연결)
- 결제 진행 step indicator (선택 → 결제 → confirm → success/fail)

**의뢰 대상**: BU2

### BB6 — super-admin 환불 / 정산 (★★)

**현황**: /admin/payments (66) + refund API

**갭**:
- BA1 super-admin 결제 list + 환불 모달 (Phase 4 OA1 답습)
- Site Operator badge + Phase 2 UD1 알림 모달

**의뢰 대상**: BA1

### BB7 — Phase 6.1 PU2 (편집) 결제 섹션 link out 정합 (★★)

**현황**: Phase 6.1 PU2 가 결제 섹션 = "준비 중" link out 으로 박제됨

**갭**:
- Phase 6.2 시안 박제 후 = PU2 link 활성화 (link 대상 = BU3 ProfileBilling)
- Phase 6.1 / 6.2 cross-domain 연결

**의뢰 대상**: PU2 보강 후속 (운영 박제 시점)

---

## 2. 의뢰 범위 — 7 시안

| ID | 화면 | 라우트 | 분류 |
|----|------|--------|------|
| BU1 | Pricing (멤버십 list) | /pricing | 신규 (보강) |
| BU2 | PricingCheckout (토스 위젯) | /pricing/checkout | **신규** |
| BU3 | ProfileBilling (구독+이력 hub) | /profile/billing | **신규** |
| BU4 | ProfileBookings (예약 list) | /profile/bookings | 보강 |
| BU5 | PricingResult (success/fail) | /pricing/success + /fail | **신규** |
| BA1 | AdminPayments (super-admin) | /admin/payments | **신규** |
| BA2 | AdminPlans (super-admin 플랜 관리) | /admin/plans | **신규** |

---

**리포트 끝.**
