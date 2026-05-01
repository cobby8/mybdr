# 작업 스크래치패드

## ⚠️ 세션 분리 원칙 (2026-04-22 재정의)

> 일반 모드 / 카페 모드 분리 — 기존 룰 그대로

- **일반 모드**: mybdr 본 프로젝트 작업 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 쇼핑몰 작업 (`scratchpad-cafe-sync.md` 별도)

## 🚧 추후 구현 목록 (DB/API 확장 필요)

**미해결 ⏳**
- 슛존 성공률 (heatmap) / 스카우팅 리포트
- 프로필 시즌 통계 / VS 비교
- 커뮤니티 댓글 답글 / 좋아요 / 게시글 북마크
- waitlist / no-show / QR 티켓
- AppNav 쪽지 unread count 뱃지 (messages unread API 추가 시 prop 활성화)
- D-6 EditProfile §2 사용손/실력/강점 + §4 공개 7항목 → PATCH `/api/web/profile` 확장
- D-6 EditProfile §3 인스타·유튜브 (`instagram_url` / `youtube_url` 컬럼 추가 시 활성화)
- D-3 §02 Highlight (MatchPlayerStat 평점 시스템 연동) / §05 다음 주 추천 (추천 엔진 연동)
- ComingSoonBadge 공통 컴포넌트 격상 (다른 v3 페이지 재사용)
- Tournament.status 'published' 잔재 cleanup
- organizations 단체 생성 → 목록 노출 e2e 스모크 테스트 부재
- Q1 후속: `_components/` 11 파일 + `courts/[id]/page.tsx` 19건 옛 토큰 마이그
- Q1 후속: ContextReviews kind="series" /tournaments[id] + kind="player" /users[id] 도입
- Q1 후속: `/reviews?courtId=...` deep-link → onViewAll 활성화

## 현재 작업

- **요청**: v3-rebake 결정 큐 순차 진행 (Q1 채택 → 다음 큐) (Auto mode)
- **상태**: Q1 박제 완료 (tester+reviewer 통과) → commit + push 진행
- **현재 담당**: PM
- **브랜치**: subin

### D-1~D-8 + Q1~Q4 진행 결과

| 단계 | 결과 |
|------|------|
| **D-1~D-8** 마이페이지 8/8 | ✅ 완료 (D-1/D-3/D-6 박제 + 5건 변경 0) |
| **ProfileShell 폐기 + cleanup** | ✅ push (6e81996 + 8d0f1f2) |
| **organizations status fix** | ✅ push (08898cb + 5e21130 — Cowork 다른 세션) |
| **Q1** Reviews + ContextReviews | ✅ Hybrid 박제 (옵션 A/B/C 채택) — commit 대기 |
| **Q2** VenueDetail | ✅ 변경 0 (운영 우위) |
| **Q3** GameEdit | ✅ 변경 0 (운영 우위) |
| **Q4** PostEdit | ✅ 변경 0 (운영 우위) |

### 추후 큐 (사용자 결정 받은 것 / 보류)

- **다음 큐**: Settings + BottomNavEditor (큰 구조 변경, 결정 4건 필요) / LiveResult (/games/[id] 흡수 검토) / HelpGlossary (옵션 C 보류 유지 가능)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 디자인 시안 박제 | 38% (40+/117) — D-1~D-8 + Q1~Q4 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |
| ProfileShell 폐기 + cleanup | /profile/* sidebar 0 + 컴포넌트 삭제 | ✅ |
| 마이페이지 영역 박제 | D-1~D-8 8/8 | ✅ |
| Reviews 통합 | 4탭 → 1탭 + ContextReviews 신규 (Q1) | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (커밋 대기) | **Q1 Reviews + ContextReviews 박제 (developer)**: 시안 [Phase 16] 4탭 → 1탭(코트만) + ContextReviews 신규 351줄 (kind/targetName/reviews/summary/onWrite/onViewAll/maxVisible) + /courts/[id] 인라인 교체 (CourtReviewsSection 신규 251 + 옛 court-reviews 287 삭제). review-form/star-rating v3 토큰 동시 마이그 (Q1-C). 4탭 UI 깔끔 제거 (Q1-A). REVIEW_CATEGORIES 5항목 + SWR/POST/DELETE/mutate 100% 보존. tsc + 13 룰 + 회귀 4 + 작업 범위 외 침범 0. tester+reviewer 병렬 통과. knowledge: architecture(+1) / decisions(+1) / index. | ✅ |
| 2026-05-01 | 5e21130 (push) | **docs(knowledge) organizations status fix 기록 (Cowork 다른 세션)**: errors.md +1 / lessons.md / index.md 갱신 | ✅ |
| 2026-05-01 | 08898cb (push) | **fix(organizations) status 'active' → 'approved' (Cowork 다른 세션)**: page.tsx 1줄 fix. DB 동호회최강전 중복 2건 정리. | ✅ |
| 2026-05-01 | 7883ed3 (push) | **D-3/8 ProfileWeeklyReport Hybrid 박제**: page.tsx 920→1125. v2.4 6섹션 + TOP 3 코트 보존. ComingSoonBadge 신설. | ✅ |
| 2026-05-01 | 8d0f1f2 (push) | **chore(cleanup) ProfileShell + ProfileSideNav 컴포넌트 삭제**: -280줄. | ✅ |
| 2026-05-01 | c3676ed (push) | **D-6/8 EditProfile Hybrid 박제**: page.tsx 1547→1233 + edit-profile.css 603. 5탭 → 단일 스크롤 + Hero + 5섹션. | ✅ |
| 2026-05-01 | 6e81996 (push) | **fix(profile) ProfileShell 제거**: layout.tsx → `<>{children}</>`. v2.3 hub sidebar 0 정합. | ✅ |
| 2026-05-01 | cef0a2b (dev 머지) | DEV 머지 — subin → dev fast-forward (7 commits) | ✅ |
| 2026-05-01 | 85944e3 (push) | D-1/8 ProfileGrowth sync | ✅ |
| 2026-05-01 | 22ce7f2 (push) | v3-rebake P0 마이페이지 hub 박제 | ✅ |
<!-- 04-30 + 05-01 일부 절단 (10건 유지 — Q1 + cowork 2건 신규 추가로 인한 정리) -->
