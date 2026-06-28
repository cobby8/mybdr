# 클로드 디자인 의뢰 — 사용자 검수 관리자 측 (Phase 6.1A · super-admin)

> **의뢰일**: 2026-05-30
> **본 의뢰**: 1 시안 (PA1) — super-admin (Site Operator)
> **차이 의뢰서**: `profile-user-redesign-prompt-2026-05-30.md` (Phase 6.1B · 사용자 5 시안)

---

## 0. 진입 표준 절차

→ Phase 4/5 admin 의뢰서 §0 답습.

---

## 1. 한 줄 요약

`/admin/users` (PA1 신규 박제 · BP5) = **1 시안**. Phase 4 OA1 (`/admin/organizations`) + Phase 5 CA1 (`/admin/community`) 답습 패턴.

---

## 2. 결재 룰

- ✅ Site Operator badge (Phase 4 OA1 답습)
- ✅ Phase 2 UD1 알림 모달 답습 (상태 변경 + 알림 ✅ 기본)
- ✅ Phase 3 TA2 / Phase 4 OA1 / Phase 5 CA1 모달 답습
- ❌ 새 라우트 ❌

---

## 3. 1 시안 사양

### PA1 — AdminUsers (super-admin 사용자 검수 hub · 신규) · `/admin/users`

**현황**: 152 line · 박제 ❌

**시안 (신규 · Phase 4 OA1 + Phase 5 CA1 답습)**:

```
Hero band
  - "전체 사용자 N · 활성 N · 정지 N · 봇/관리자 N · 신규 (이번달) N"
  - 우측 = Site Operator badge

[검색 + 필터 row]
  - 검색바 (nickname / email / public_id)
  - 상태 chip filter (active / suspended / 등)
  - 가입 일자 filter (이번달 / 최근 30 / 90 / 1년 / 전체)
  - 활동도 filter (last_login_at 7일 / 30일 / 90일+ / 무로그인)
  - 매너 ★ filter (4.5+ / 3.5~4.5 / 3.5-) — evaluation_rating

[탭]
  - 탭 1 = 활성 (default · status=active)
  - 탭 2 = 정지 (status=suspended)
  - 탭 3 = 관리자/봇 (isAdmin=true)
  - 탭 4 = 신규 가입 (createdAt 최근 7일)

[카드 list]
  - 사용자 카드 (profile_image + nickname + level + 매너 ★ + last_login_at + status badge)
  - 가입 일자 + 참가 경기 + 호스트 + 우승 (cross-domain Phase 2/3 stat)
  - 본인 (super-admin) 액션: status 변경 chip → 모달
```

**모달 (status 변경)**:
- Phase 2 UD1 답습
- 상태 (active → suspended / suspended → active)
- "사용자에게 알림 보내기" ✅ 체크박스 기본
- 정지 사유 (suspended_at + 별 필드 — 운영 미확인)
- "변경 + 알림" CTA

**가드**:
- 본인 = 정지 액션 ❌ (자기 자신 정지 막기)
- isAdmin=true 인 사용자 = 별 super-super-admin 가드 (현재 미확인 — Phase 6.1 외 별 의뢰)
- 사용자 결제 (subscription_*) / 은행 (bank_*) 필드 = read-only 표시만 (수정 ❌)

---

## 4. 양측 의존 검증

| BP | 본 의뢰 (super-admin) | 사용자 측 (PU1~PU5) | 데이터 |
|----|---------------------|-------------------|--------|
| BP5 | PA1 검수 모달 | (없음 — PU5 공개 프로필은 PA1 영향 X) | User.status / suspended_at |

---

## 5. 13 룰 + Phase 1~5 carry-over

- ❌ AppNav / 새 라우트 ❌
- ✅ Phase 4 OA1 + Phase 5 CA1 답습 (Site Operator badge + 모달)
- ✅ Phase 2 UD1 답습 (알림 ✅ 체크박스 + "변경 + 알림" CTA)
- ✅ Phase 3 TA2 답습 (모달)

---

## 6. 자체 검수

- ✅ Site Operator badge 시각 일관
- ✅ 본인 자기 정지 ❌ 가드
- ✅ 결제/은행 필드 read-only
- ✅ status 모달 = Phase 2 UD1 답습

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 사용자 검수 관리자 (Phase 6.1A · PA1)

이해: PA1 /admin/users 신규 (BP5). Hero stat + 4 탭 + 검색 필터 + 모달 (Phase 4 OA1 + Phase 5 CA1 답습).
Site Operator badge / 본인 자기 정지 ❌ / 결제·은행 read-only.
자체 검수: 06 §관리자 hub / 모달
작업 시작.
```

---

**의뢰서 끝.**
