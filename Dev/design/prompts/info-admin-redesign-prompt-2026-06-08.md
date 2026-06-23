# 클로드 디자인 의뢰 — 뉴스 관리자 측 (Phase 10A · super-admin)

> **본 의뢰**: 1 시안 (IA1) · Site Operator

---

## 0. 진입 표준 절차

Phase 4 OA1 + Phase 6.1 PA1 + Phase 6.2 BA1 + Phase 8 VA1 + Phase 9 NA1 답습.

---

## 1. 한 줄 요약

`/admin/news` (IA1 신규 · BDR NEWS 발행 hub) = **1 시안**.

---

## 2. 결재 룰

- ✅ Site Operator badge
- ✅ Phase 4 OA1 답습 (Hero stat + 발행 form + 이력 + 모달)
- ✅ Phase 2 UD1 알림 모달 (발행 + 알림 ✅ 기본)
- ❌ 새 라우트 ❌

---

## 3. 1 시안 사양

### IA1 — AdminNews (BDR NEWS 발행 hub · 신규) · `/admin/news`

**현황**: 163 line · 박제 ❌

**시안 (신규)**:
```
Hero band
  - "전체 뉴스 N · 발행됨 N · 임시저장 K · 이달 발행 M"
  - Site Operator badge

[작성 form]
  - 카테고리 chip (매거진 / 매치 단신 / 공지 / 이벤트)
  - 제목 + 본문 (rich text) + 대표 이미지
  - 매치 단신 시 = Phase 1/2 cross-domain (대회·경기 선택 → 자동 연결)
  - 발행 / 임시저장 / 예약 발행 옵션
  - 미리보기 (모바일 + PC)

[발행 이력]
  - 카드 list (제목 + 카테고리 + 조회수 + 상태 + 발행 시간 + 발행자)
  - 수정 / 비공개 / 삭제 모달

[모달 (발행 확인)]
  - "사용자 알림 보내기" ✅ 체크박스 기본 (NU1 연결)
  - "발행 + 알림" CTA
```

---

## 4. 양측 의존 검증

| BI | 본 의뢰 | 사용자 측 |
|----|---------|-----------|
| BI2 | IA1 발행 | IU2 News 매거진 자동 표시 |
| BI5 | IA1 알림 발송 | NU1 Notifications 수신 |

---

## 5. 13 룰 + carry-over

- ❌ 새 라우트 ❌
- ✅ Phase 4 OA1 / Phase 6.1 PA1 / Phase 6.2 BA1 / Phase 8 VA1 / Phase 9 NA1 답습

---

## 6. 자체 검수

기본 12 + 특수 3:
- ✅ Site Operator badge
- ✅ 카테고리 chip 4 종 시각 분리 (매거진/단신/공지/이벤트)
- ✅ 발행 모달 = 알림 ✅ 기본 (NU1 동기화)

---

## 7. 첫 응답

```
✅ BDR 디자인 의뢰 확인 — 뉴스 관리자 (Phase 10A · IA1)

이해: IA1 /admin/news 신규 (Hero stat + 발행 form + 이력 + 모달).
Site Operator + Phase 1/2 cross-domain (매치 단신) + NU1 알림 동기화.
자체 검수: 06 §관리자 / 발행
작업 시작.
```

---

**의뢰서 끝.**
