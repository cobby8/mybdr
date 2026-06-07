# 클로드 디자인 의뢰 — 알림 관리자 측 (Phase 9A · super-admin)

> **본 의뢰**: 1 시안 (NA1) · Site Operator

---

## 0. 진입 표준 절차

Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 + Phase 8 VA1 답습.

---

## 1. 한 줄 요약

`/admin/notifications` (NA1 신규) = **1 시안**. 관리자 시스템 알림 발송 hub.

---

## 2. 결재 룰

- ✅ Site Operator badge
- ✅ Phase 2 UD1 답습 (target 분리 + 알림 작성 + "발송 + 확인")
- ❌ 새 라우트 ❌

---

## 3. 1 시안 사양

### NA1 — AdminNotifications (신규) · `/admin/notifications`

**현황**: 251 line · 박제 ❌

**시안 (신규 · Phase 4 OA1 답습)**:
```
Hero band
  - "발송 이력 N · 이달 발송 M · 수신자 합계 K"
  - Site Operator badge

[작성 form]
  - target chip (전체 / 일반유저 / 팀장 / 관리자)
  - 제목 + 본문 + 카테고리 (NotifCategory)
  - 미리보기 (모바일 + PC 분기)
  - "발송하기" CTA

[발송 이력]
  - 카드 list (제목 + target + 수신자 수 + 시간 + 발송자)
  - 재발송 CTA (모달 confirm)

[모달 (발송 확인)]
  - "X명에게 발송하시겠습니까?"
  - "발송" CTA → POST /api/web/admin/notifications
```

---

## 4. 양측 의존 검증

| BN | 본 의뢰 | 사용자 측 |
|----|---------|-----------|
| BN4 | NA1 발송 | NU1 수신 (notifications.* 표시) |

---

## 5. 13 룰 + Phase 1~8 carry-over

- ❌ 새 라우트 ❌
- ✅ Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 + Phase 8 VA1 답습 (Site Operator + 모달 + 알림 ✅ 기본)

---

## 6. 자체 검수

기본 12 + 특수 3:
- ✅ Site Operator badge
- ✅ target chip 4 종 시각 일관
- ✅ 발송 모달 = confirm "X명에게 발송" (실수 방지)

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 알림 관리자 (Phase 9A · NA1)

이해: NA1 /admin/notifications 신규 (Hero stat + 작성 form + 발송 이력 + 모달).
Site Operator badge / Phase 4 OA1 답습.
자체 검수: 06 §관리자
작업 시작.
```

---

**의뢰서 끝.**
