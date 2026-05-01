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
- D-3 §02 Highlight (MatchPlayerStat 평점 시스템 연동 시 활성화) / D-3 §05 다음 주 추천 (추천 엔진 연동)
- ComingSoonBadge 공통 컴포넌트 격상 (다른 v3 페이지 재사용)

## 현재 작업

- **요청**: v3-rebake D-3 + 결정 받은 4 페이지 진행 + 종합 리포트 (Auto mode)
- **상태**: D-3 박제 완료 + Q1 결정 필요 + Q2/Q3/Q4 변경 0 → commit + push 진행
- **현재 담당**: PM
- **브랜치**: subin

### D-1~D-8 + Q1~Q4 진행 결과

| 단계 | 결과 |
|------|------|
| **D-1/8** ProfileGrowth | ✅ 85944e3 push |
| **D-2/8** ProfileBookings | ✅ 변경 0 (시안 1:1 박제 완벽) |
| **D-3/8** ProfileWeeklyReport | ✅ Hybrid 박제 (920→1125) — commit 대기 |
| **D-4/8** ProfileComplete | ✅ 변경 0 |
| **D-5/8** ProfileCompletePreferences | ✅ 변경 0 |
| **D-6/8** EditProfile | ✅ Hybrid 박제 (c3676ed push) |
| **D-7/8** MyActivity | ✅ 변경 0 |
| **D-8/8** Billing | ✅ 변경 0 |
| **ProfileShell 폐기** | ✅ 6e81996 push + 8d0f1f2 cleanup push |
| **Q1** Reviews + ContextReviews | ⏳ **결정 필요 (Q1-A/B/C 3건)** |
| **Q2** VenueDetail | ✅ 변경 0 (운영 우위 — JSON-LD/OG/recentReviews) |
| **Q3** GameEdit | ✅ 변경 0 (운영 시안 박제 + 4 edge case 풍부) |
| **Q4** PostEdit | ✅ 변경 0 (운영 시안 박제 + Server Action 보존) |

### Q1 Reviews + ContextReviews — 사용자 결정 필요

**시안 의도**: 4탭 통합 페이지(/reviews) → 1탭 (코트만 활성). ContextReviews 컴포넌트 신규로 코트/대회/플레이어 상세에 인라인 사용. 작업량 developer 6~8h.

**결정 3건**:
- **Q1-A**: 4탭 축소 시 비노출 vs 주석 (향후 복구 여지)
- **Q1-B**: ContextReviews 도입 범위 (코트만 우선 vs /tournaments + /users 동시)
- **Q1-C**: court-reviews.tsx 옛 토큰 (`var(--color-card)` 등) 정리 동시 처리 여부

**리스크**: ReviewForm 5항목 세부 평점 (facility/accessibility/surface/lighting/atmosphere) 보존 필수 / /reviews URL fragment 사용처 grep 필요

### 추후 큐 (사용자 결정 받은 것 / 보류)

- **Q1 Reviews 결정** (Q1-A/B/C 3건) → developer 6~8h
- Settings + BottomNavEditor (큰 구조 변경, 결정 4건 필요)
- HelpGlossary (옵션 C 보류)
- LiveResult (/games/[id] 흡수 검토)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 디자인 시안 박제 (Phase 9) | 36% (37/117) — D-1~D-8 + Q2/Q3/Q4 검증 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |
| ProfileShell 폐기 + cleanup | /profile/* sidebar 0 + 컴포넌트 삭제 | ✅ |
| 마이페이지 영역 박제 | D-1~D-8 8/8 (D-3/D-6 Hybrid + 6 변경 0) | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (커밋 대기) | **D-3/8 ProfileWeeklyReport Hybrid 박제 (developer)**: page.tsx 920→1125 (+205). 시안 v2.4 6 섹션 박제 + §04 TOP 3 코트 + §06 지난주 비교 운영 진짜 데이터 보존. KPI 4 라벨 + §02 Highlight + §05 다음 주 추천 = ComingSoonBadge (D-6 패턴 차용, 공통 격상 큐). SWR 패칭 0 변경. 인사이트 동적 카피 (streak/minutes_change) 보존. tsc + 13 룰 (hex 16건 합법) + 회귀 4 통과. tester 정적 검증 5/5 통과. knowledge 갱신: architecture(+1) / decisions(+1) / index. | ✅ |
| 2026-05-01 | (변경 0) | **Q1~Q4 4 페이지 일괄 분석 (planner)**: Q1 Reviews + ContextReviews = 분류 4 결정 필요 (4탭 → 1탭 / 신규 컴포넌트 / /courts/[id] 인라인). Q2 VenueDetail = 변경 0 (운영 JSON-LD/OG/recentReviews 우위). Q3 GameEdit = 변경 0 (운영 4 edge case + GameData fetch + parseRequirements 보존). Q4 PostEdit = 변경 0 (운영 useActionState Server Action + meId 권한 가드 우위). | ✅ |
| 2026-05-01 | 8d0f1f2 (push) | **chore(cleanup) ProfileShell + ProfileSideNav 컴포넌트 삭제**: 의존성 0 검증 후 2 파일 -280줄 삭제. tsc 통과. | ✅ |
| 2026-05-01 | c3676ed (push) | **D-6/8 EditProfile Hybrid 박제 (feat)**: page.tsx 1547→1233 + edit-profile.css 신규 603줄. 5탭 → 단일 스크롤 + Hero + 5섹션 (§5 추가 설정 신설로 환불계좌·회원탈퇴·중복확인·AI bio 흡수). 7 핸들러 + 7 API 100% 보존. tester+reviewer 통과. | ✅ |
| 2026-05-01 | 6e81996 (push) | **fix(profile) ProfileShell 제거 (Cowork 직접 patch)**: layout.tsx → `<>{children}</>`. v2.3 hub 시안 sidebar 0 정합. 사용자 dev server 발견. knowledge 4 파일 갱신. | ✅ |
| 2026-05-01 | cef0a2b (dev 머지) | **DEV 머지 — subin → dev fast-forward** (8aea145..cef0a2b, 7 commits) | ✅ |
| 2026-05-01 | 85944e3 (push) | **D-1/8 ProfileGrowth sync (BDR-current v2.4)**: 마일스톤 순서 + 6번째 "팀 멤버 추천" | ✅ |
| 2026-05-01 | a2c0636 (push) | **gitignore + .backup.jsx 3건 제거** | ✅ |
| 2026-05-01 | 22ce7f2 (push) | **v3-rebake P0 마이페이지 hub 박제** | ✅ |
| 2026-05-01 | f2df385+8a5cb7b+1bc549d (push) | **Dev/design/ 정리 + revert 7 commit + BDR-current 동기화** | ✅ |
<!-- 04-30 + 05-01 일부 절단 (10건 유지 — D-3 + Q분석 + cleanup 신규 추가로 인한 정리) -->
