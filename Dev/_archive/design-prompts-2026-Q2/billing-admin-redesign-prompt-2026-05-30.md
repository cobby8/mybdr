# 클로드 디자인 의뢰 — 결제·플랜 관리자 측 (Phase 6.2A · super-admin)

> **본 의뢰**: 2 시안 (BA1 + BA2) · super-admin (Site Operator)

---

## 0. 진입 표준 절차

Phase 6.1 admin 의뢰서 §0 답습.

---

## 1. 한 줄 요약

`/admin/payments` (BA1 결제 hub) + `/admin/plans` (BA2 멤버십 플랜 관리) = **2 시안**. Phase 4 OA1 + Phase 5 CA1 + Phase 6.1 PA1 답습.

---

## 2. 결재 룰

- ✅ Site Operator badge (Phase 4 OA1 답습)
- ✅ Phase 2 UD1 알림 모달 (환불 + 알림 ✅)
- ✅ 토스페이먼츠 = 운영 실연결 (refund API 활성)
- ❌ 새 라우트 ❌

---

## 3. 2 시안 사양

### BA1 — AdminPayments (결제 hub · 신규) · `/admin/payments`

**현황**: 66 line · 박제 ❌ (매우 작음)

**시안 (신규 · Phase 4 OA1 답습)**:
```
Hero band
  - "이달 결제 ₩ N · 누적 ₩ M · 환불 K · 실패 L"
  - Site Operator badge

[검색 + 필터]
  - 검색바 (사용자 / 결제 ID / 토스 결제 키)
  - 상태 filter (성공 / 실패 / 환불 / 대기)
  - 기간 filter (이번달 / 30 / 90 / 1년 / 전체)

[탭]
  - 탭 1 = 성공 (default)
  - 탭 2 = 실패
  - 탭 3 = 환불됨
  - 탭 4 = 환불 대기

[카드 list]
  - 결제 카드 (사용자 + 금액 + 항목 + 토스 결제 키 + 상태 + 시간)
  - 본인 (super-admin) 액션: 환불 모달 trigger (refund API)
```

**모달 (환불)**:
- Phase 2 UD1 답습
- 환불 금액 / 사유 / "사용자에게 알림" ✅ 기본
- "환불 + 알림" CTA → refund API

### BA2 — AdminPlans (멤버십 플랜 관리 · 신규) · `/admin/plans`

**현황**: 397 line · 박제 ❌

**시안 (신규)**:
```
Hero band
  - "전체 플랜 N · 활성 N · 구독자 합계 M"
  - Site Operator badge

[플랜 카드 grid]
  - 각 플랜 카드 (이름 + 가격 + 혜택 list + 구독자 수 + 활성/비활성 badge)
  - 본인 액션: "수정" / "복제" / "비활성화"

[하단 CTA]
  - "+ 새 플랜 생성" CTA → 모달 (이름 / 가격 / 혜택 / 활성/비활성)

[옵션 — 통계]
  - 플랜별 구독자 수 chart (recharts)
  - 월간 매출 chart (선택)
```

**모달 (플랜 생성/수정)**:
- form (이름 / 가격 / 혜택 textarea / 활성 토글)
- "저장" CTA

---

## 4. 양측 의존 검증

| BB | 본 의뢰 | 사용자 측 |
|----|---------|-----------|
| BB1 멤버십 | BA2 플랜 관리 | BU1 list + BU3 구독 |
| BB2 결제 | BA1 환불 모달 | BU3 결제 이력 |
| BB6 super-admin | BA1 + BA2 | - |

---

## 5. 13 룰 + carry-over

- ❌ 새 라우트 ❌ / Phase 1~6.1 carry-over
- ✅ Phase 4 OA1 + Phase 5 CA1 + Phase 6.1 PA1 답습 (Site Operator badge + Phase 2 UD1 알림 모달)
- ✅ 토스 refund API 실연결

---

## 6. 자체 검수

기본 12 + Phase 6.2 admin 특수 4:
- ✅ Site Operator badge 시각 일관
- ✅ 환불 모달 = Phase 2 UD1 답습 (알림 ✅)
- ✅ 결제 금액 천 단위 구분
- ✅ 플랜 카드 = 비활성 = 회색 + "비활성" badge

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 결제·플랜 관리자 (Phase 6.2A · BA1 + BA2)

이해: BA1 /admin/payments (Hero stat + 4 탭 + 환불 모달) + BA2 /admin/plans (플랜 carad grid + 생성·수정 모달).
양측 의존 = BB1/BB2/BB6.
Site Operator badge / Phase 4 OA1 + Phase 2 UD1 답습 / 토스 refund 실연결.
자체 검수: 06 §관리자 hub / 모달
작업 시작.
```

---

**의뢰서 끝.**
