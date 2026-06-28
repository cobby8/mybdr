# Phase 6.2 — 결제·구독·예약 Claude.ai 의뢰 (단일 paste)

> **선행**: Phase 1~5 박제+운영 + Phase 6.1 박제 (v2.24 도착)
> **본 의뢰**: 7 시안 (사용자 5 + super-admin 2) · 토스페이먼츠 운영 실연결

---

## ⭐ 수빈 본인 액션 — 2 단계 (~2분)

### Step 1 — Claude.ai 세션 + 4 건 drag-drop

**첨부 zip**:
- `C:\0. Programing\mybdr\Dev\design\_zips\BDR-current-phase6.2-baseline-2026-05-30.zip` (444KB / 143 파일)
- v2.24 + `_phase62_operational_refs/` 9 운영 파일

**의뢰서 3 건**:
1. `billing-user-admin-connectivity-plan-2026-05-30.md` (BB1~BB7)
2. `billing-user-redesign-prompt-2026-05-30.md` (사용자 5 시안)
3. `billing-admin-redesign-prompt-2026-05-30.md` (super-admin 2 시안)

→ **★ 첨부 4건 모두 drag-drop 확인 후 paste**.

### Step 2 — 아래 §메시지 본체 paste

---

## 메시지 본체 (paste 용)

```
Phase 6.2 — 결제·구독·예약 리디자인 의뢰 (총 7 시안 + 양측 다리 7 BB) 시작합니다.

[선행]
- Phase 1~5 박제+운영 반영 완료 + Phase 6.1 박제 (v2.24 / 본체 6 시안 / sync ⏸ 대기)
- 첨부 zip = BDR v2.24 (BDR-current = 51 jsx + 7 css + 5 shared = profile-shared 포함)

[상위 계획서]
billing-user-admin-connectivity-plan-2026-05-30.md (BB1~BB7 = 7 갭)

[★ 본 Phase 특수성]
- 토스페이먼츠 = 운영 실연결 (route /payments/confirm + /[id]/refund 활성) → mock 0 / 실 데이터 박제
- Phase 2C UA3 BG5 "토스 미연결 disabled" 가정과 차이 — 본 Phase = 실연결 시안
- Phase 6.1 PU2 결제 섹션 "link out 준비 중" → 본 Phase 박제 후 link 활성

[의뢰서 2건 — 첨부]
1. billing-user-redesign-prompt-2026-05-30.md (사용자 5 = BU1+BU2+BU3+BU4+BU5)
2. billing-admin-redesign-prompt-2026-05-30.md (super-admin 2 = BA1+BA2)

[첨부 zip 안]
BDR-current/ — v2.24 Phase 1~6.1 박제 결과
_phase62_operational_refs/ — 9 운영 파일:
  - BU1 운영 (pricing wrapper)
  - BU2 운영 (checkout 511 head/tail)
  - BU3 운영 (billing 1039 head/tail)
  - BU4 운영 (bookings 231 full)
  - BU5 운영 (success/fail full)
  - BA1 운영 (admin payments 66 full)
  - BA2 운영 (admin plans 397 head/tail)
  - PRISMA_billing_models_spec.md (payments + plans + user_subscriptions + court_bookings)

[Phase 6.2 박제 시안 = 7]

사용자 측 (BU1~BU5 · A 등급):
- BU1 Pricing 신규 박제 /pricing · BB1 멤버십 list (free/basic/premium 카드 + 비교)
- BU2 PricingCheckout 신규 박제 /pricing/checkout · BB5 토스 위젯 + 3 step + 약관
- BU3 ProfileBilling 신규 박제 /profile/billing · BB1+BB2 구독+이력 3 sub-tab (subscription/history/refund)
- BU4 ProfileBookings 보강 /profile/bookings · BB4 예약 4 탭 (진행/예정/종료/취소) + Phase 7 코트 cross-domain
- BU5 PricingResult 신규 박제 /pricing/success + /fail · BB3 통합 hero (성공 🎉 / 실패 ⚠ + 다시 시도 CTA)

관리자 측 (BA1+BA2 · E 등급 · super-admin):
- BA1 AdminPayments 신규 박제 /admin/payments · BB2+BB6 Hero stat + 4 탭 + 환불 모달 (refund API 실연결)
- BA2 AdminPlans 신규 박제 /admin/plans · BB1 멤버십 플랜 carad grid + 생성·수정 모달

[2026-05-30 결재 룰]
- 토스페이먼츠 = 운영 실연결 / mock 0 (위젯 / confirm / refund 모두 실 데이터)
- BB1 = plans + user_subscriptions 실 데이터 (현재 구독 plan + 다음 결제일)
- BB2 = payments list 실 데이터 (성공/실패/환불 status)
- BB4 = court_bookings 실 데이터 (Phase 7 코트 cross-domain · 본 의뢰는 사용자 본인 예약만)
- BB7 = Phase 6.1 PU2 carry (link out 활성은 운영 박제 시점)
- 운영 미지원 (환불 form 별 컬럼 등) = hide + "준비 중" / mock 0
- AppNav / 새 라우트 ❌ / Phase 1~6.1 carry-over

[작업 흐름 요청]
1. 첫 응답 = 의뢰서 2건 §7 형식
   ✅ Phase 6.2B 사용자 (BU1~BU5)
   ✅ Phase 6.2A 관리자 (BA1+BA2)

2. 박제 순서:
   사용자: BU5 (작음 / success+fail) → BU1 → BU4 보강 → BU2 (토스 위젯) → BU3 (가장 큰 3 sub-tab hub)
   관리자: BA1 (작음) → BA2 (플랜)

3. 박제 완료 → 새 zip (BDR v2.25/ 예상)

4. 13 룰 위반 시 reject + 알림

[양측 의존 갭 검증]
- BB1: BU1 플랜 list = BU3 "현재 구독" = BA2 플랜 = 동일 plans 컬럼 (가격/혜택)
- BB2: BU3 결제 이력 = BA1 결제 list = 동일 payments 컬럼 (성공/실패/환불 status / 토스 결제 키)
- BB4: BU4 예약 = court_bookings + Phase 7 cross-domain
- BB5: BU2 토스 위젯 = 운영 confirm API (실 흐름)

[자체 검수 4 + 8 + Phase 6.2 특수 4]

4 frozen + 8 self — Phase 6.1 답습.

Phase 6.2 특수:
- ✅ 토스 위젯 시각 박제 = mock 0
- ✅ 결제 금액 = 천 단위 구분 통일 (₩50,000)
- ✅ status 색 분리 (성공=ok / 실패=err / 환불=neutral / 대기=warn)
- ✅ BU3 3 sub-tab = ?tab=subscription/history/refund

[질문/가정]
- 환불 form 컬럼 = 운영 미확인 (있으면 시안 / 없으면 hide)
- subscription 변경/취소 흐름 = 운영 흐름 답습 (mock 0)

시작해 주세요.
```

---

## 예상 첫 응답

```
✅ Phase 6.2B 사용자 (BU1~BU5) — 토스 실연결 / 멤버십 + 구독 + 결제 + 예약 + 결과
✅ Phase 6.2A 관리자 (BA1+BA2) — Site Operator hub + 플랜 관리
```

---

## zip 회신 후

```
☐ Cowork 에 "Phase 6.2 zip 도착"
```

→ Cowork 자동 sync + Phase 6.2C Auto Chain 의뢰서 작성.

---

**의뢰서 끝.**
