# 클로드 디자인 의뢰 — 결제·구독·예약 사용자 측 (Phase 6.2B)

> **선행**: Phase 1~5 + Phase 6.1 박제 완료
> **본 의뢰**: 5 시안 (BU1~BU5) · 사용자 측

---

## 0. 진입 표준 절차

Phase 6.1 의뢰서 §0 답습. **★ Phase 1~6.1 carry-over (변경 ❌)** — BDR-current/ 안 51 jsx + 7 css + 5 shared (game/team/org/comm/profile).

---

## 1. 한 줄 요약

`/pricing` (BU1 멤버십 list) + `/pricing/checkout` (BU2 토스 위젯) + `/profile/billing` (BU3 구독+이력 hub) + `/profile/bookings` (BU4 예약) + `/pricing/success+fail` (BU5 결과) = **5 시안**. **토스페이먼츠 운영 활성 (mock 0 / 실 데이터)**.

---

## 2. 결재 룰

- ✅ **토스페이먼츠 = 운영 실연결** (운영 confirm/refund 라우트 활성) — Phase 2C UA3 BG5 "토스 미연결" 가정과 차이 / mock 0
- ✅ **BB1 멤버십** = plans + user_subscriptions 실 데이터 / 플랜 비교 카드 시각
- ✅ **BB2 결제 이력** = payments 실 데이터 / 영수증 다운로드
- ✅ **BB4 예약 cross-domain** = court_bookings + Phase 7 코트 영역 (본 의뢰는 사용자 본인 예약만)
- ✅ **BB7 PU2 link out** = Phase 6.1 carry-over (운영 박제 시 link 활성)
- ❌ 새 라우트 ❌ / Phase 1~6.1 시안 변경 ❌

---

## 3. 5 시안 사양

### BU1 — Pricing (멤버십 list · 신규 박제) · `/pricing`

**현황**: 41 line wrapper · 박제 ❌

**시안 (신규)**:
- Hero band — "MyBDR 멤버십"
- 플랜 카드 grid (free / basic / premium · plans 모델 기반)
- 각 플랜 = 가격 / 혜택 list / "선택" CTA → /pricing/checkout (BU2)
- 본인 현재 구독 = 카드 위 "현재 구독 중" badge (user_subscriptions)
- 비교 표 (선택 / 모바일 = horizontal scroll)

### BU2 — PricingCheckout (토스 위젯 · 신규) · `/pricing/checkout`

**현황**: 511 line · 박제 ❌

**시안 (신규)**:
- Hero band — 선택한 플랜 mini (이름 + 가격)
- 3 step indicator (플랜 선택 → 결제 정보 → 결제 완료)
- 결제 정보 form (이메일 / 결제 수단 chip — 토스 위젯 임베드)
- 토스페이먼츠 위젯 영역 (실 위젯 embed · 시각 박제만)
- 결제 약관 동의 (체크박스)
- "결제하기" CTA → 토스 confirm 흐름

### BU3 — ProfileBilling (구독+이력 hub · 신규) · `/profile/billing`

**현황**: 1039 line · 박제 ❌

**시안 (신규 · 3 sub-tab 통합)**:
```
[탭 1] 구독 (default)
  - 현재 구독 plan card + 다음 결제일 + 남은 기간
  - 결제 수단 (등록된 카드 / 토스 토큰)
  - "구독 변경" / "구독 취소" CTA
[탭 2] 결제 이력 (payments list)
  - 카드 list (날짜 / 항목 / 금액 / 상태 — 성공/실패/환불)
  - 영수증 다운로드 CTA
[탭 3] 환불 (별도 / 작음)
  - 환불 신청 폼 (운영 미확인 — 있으면 시안 / 없으면 hide)
```

### BU4 — ProfileBookings (예약 list · 보강) · `/profile/bookings`

**현황**: 231 line · v2 부분

**보강**:
- 4 탭 (진행 중 / 예정 / 종료 / 취소·환불)
- 카드 (코트명 + 날짜 + 시간 + 결제 금액 + 상태)
- "취소" CTA (court_bookings/[id]/payment-cancel · 환불 정책 모달)
- Phase 7 코트 cross-domain — 코트 상세 (`/courts/[id]`) link

### BU5 — PricingResult (success/fail · 신규) · `/pricing/success` + `/fail`

**현황**: success 227 + fail 288 · 박제 ❌

**시안 (신규 · 통합 패턴)**:
- success: 🎉 hero ("결제가 완료되었습니다") + 결제 정보 + "구독 보기" CTA → BU3
- fail: ⚠ hero ("결제에 실패했습니다") + 사유 (toss 에러 코드) + "다시 시도" CTA → BU2 또는 BU1

---

## 4. 양측 의존 검증

| BB | 사용자 측 (본 의뢰) | 관리자 측 (admin) | 데이터 |
|----|-------------------|-----------------|--------|
| BB1 | BU1 + BU3 구독 | BA2 플랜 관리 | plans + user_subscriptions |
| BB2 | BU3 결제 이력 | BA1 결제 list | payments |
| BB3 | BU5 결과 | - | (단독) |
| BB4 | BU4 예약 cross-domain | - | court_bookings + Phase 7 |
| BB5 | BU2 토스 위젯 | - | 운영 confirm API |
| BB7 | (Phase 6.1 PU2 link out 활성) | - | - |

---

## 5. 13 룰 + Phase 1~6.1 carry-over

- ❌ AppNav / 새 라우트 ❌ / Phase 1~6.1 시안 변경 ❌
- ✅ 토스페이먼츠 = 운영 실연결 / mock 0
- ✅ BB1/BB2 = plans + user_subscriptions + payments 실 데이터
- ✅ BB4 cross-domain Phase 7 (본 의뢰는 사용자 본인 예약만)

---

## 6. 자체 검수 (Phase 6.1 답습)

기본 12 + Phase 6.2 특수 4:
- ✅ 토스 위젯 시각 박제 (mock 0)
- ✅ 결제 금액 표시 = 천 단위 구분 (₩50,000 형식 통일)
- ✅ 결제 status = 색 분리 (성공=ok / 실패=err / 환불=neutral / 대기=warn)
- ✅ BU3 3 sub-tab = ?tab=subscription/history/refund 명확

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 결제·구독·예약 사용자 (Phase 6.2B · BU1~BU5)

이해: 토스페이먼츠 운영 실연결 / mock 0. 멤버십 list (BU1) + 토스 위젯 (BU2) + 구독+이력 hub (BU3 3 sub-tab) + 예약 (BU4 보강) + 결과 (BU5 success/fail).
양측 의존 = BB1~BB5/BB7.
사용자 결정 §1~§8 / AppNav / 13 룰 / Phase 1~6.1 carry-over.
자체 검수: 06 §결제 / 위젯 / 모달
작업 시작.
```

---

**의뢰서 끝.**
