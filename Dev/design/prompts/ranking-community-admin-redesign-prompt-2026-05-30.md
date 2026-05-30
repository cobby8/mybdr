# 클로드 디자인 의뢰 — 커뮤니티 관리자 측 (Phase 5A · super-admin)

> **의뢰일**: 2026-05-30
> **상위 계획서**: `ranking-community-user-admin-connectivity-plan-2026-05-30.md` (BC1~BC7)
> **본 의뢰 범위**: 1 시안 (CA1) — super-admin (Site Operator)
> **차이 의뢰서**: `ranking-community-user-redesign-prompt-2026-05-30.md` (Phase 5B · 사용자 5 시안)

---

## 0. 진입 표준 절차

→ Phase 4 org-admin 의뢰서 §0 답습.

---

## 1. 한 줄 요약

`/admin/community` (CA1 신규 박제 · super-admin · BC6 검수 hub) = **1 시안**. Phase 4 OA1 (`/admin/organizations`) 답습 패턴.

---

## 2. 결재 룰

- ✅ Site Operator badge (Phase 4 OA1 답습)
- ✅ Phase 2 UD1 알림 모달 답습 (상태 변경 + 알림 ✅ 기본)
- ✅ Phase 3 TA2 모달 답습 (정지 / 삭제 / 핀 모달)
- ❌ 새 라우트 ❌ (CA1 = `/admin/community` 기존)

---

## 3. 1 시안 사양

### CA1 — AdminCommunity (super-admin 커뮤니티 hub · 신규 박제) · `/admin/community`

**현황**: 91 line · 박제 ❌ (매우 작음)

**시안 (신규 박제 · Phase 4 OA1 답습 패턴)**:

```
Hero band
  - "전체 게시글 N · 핀 M · 신고 K · 삭제됨 L"
  - 우측 = Site Operator badge

[검색 + 필터 row]
  - 검색바 (title / content / author 닉네임)
  - 카테고리 chip filter (대회 알기자 / 자유 / Q&A / 갤러리 등)
  - 상태 chip filter (활성 / 핀 / 신고됨 / 삭제됨)

[탭]
  - 탭 1 = 활성 (default · is_deleted=false)
  - 탭 2 = 핀 (is_pinned=true)
  - 탭 3 = 신고됨 (운영 미확인 — 별 모델 있을 시 / 없으면 hide)
  - 탭 4 = 삭제됨 (is_deleted=true)

[카드 list]
  - 게시글 카드 (title + 카테고리 badge + author + view_count + like_count + created_at)
  - 본인 (super-admin) 액션: 핀 / 핀 해제 / 삭제 / 복구 모달 trigger
```

**모달 (상태 변경)**:
- Phase 2 UD1 / Phase 4 OA1 답습
- 변경 후 status + "사용자에게 알림 보내기" 체크박스 기본 ✅
- 삭제 사유 입력 (선택)

**가드**:
- 운영 데이터 미지원 항목 (신고 / Report 모델) = 카드 hide 또는 "준비 중" 안내
- pinned / deleted = `community_posts.is_pinned` / `is_deleted` 실 컬럼

---

## 4. 양측 의존 검증

| BC | 본 의뢰 (super-admin) | 사용자 측 (CU1~CU4) | 데이터 모델 |
|----|---------------------|-------------------|-----------|
| BC6 | CA1 검수 모달 | CU2 본인 게시글 보기 | community_posts.is_pinned/is_deleted |

---

## 5. 13 룰 + Phase 1~4 carry-over

- ❌ AppNav / 새 라우트 ❌
- ✅ Phase 4 OA1 답습 (Site Operator badge + 알림 모달)
- ✅ Phase 2 UD1 답습 ("처리 + 알림" CTA + 체크박스 ✅ 기본)
- ✅ Phase 3 TA2 답습 (모달)

---

## 6. 자체 검수

기본 12 케이스 + 본 의뢰 특수:
- ✅ Site Operator badge 시각 일관
- ✅ 상태 변경 모달 = Phase 2 UD1 답습
- ✅ 미지원 데이터 (신고 등) = hide

---

## 7. 첫 응답 형식

```
✅ BDR 디자인 의뢰 확인 — 커뮤니티 관리자 측 (Phase 5A · super-admin)

이해: CA1 /admin/community 신규 박제 (BC6 검수 hub). Hero stat + 4 탭 + 모달 (Phase 4 OA1 답습).
양측 의존 = BC6 (단독 — super-admin).
사용자 결정 §1~§8 / Phase 4 OA1 시각 답습 / Phase 2 UD1 알림 모달 답습.
자체 검수: 06 §관리자 hub / 모달
작업 시작.
```

---

**의뢰서 끝.**
