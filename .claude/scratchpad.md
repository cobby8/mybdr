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
- D-6 EditProfile §2 사용손/실력/강점 + §4 공개 7항목 → PATCH `/api/web/profile` 확장 (DB 컬럼 추가)
- D-6 EditProfile §3 인스타·유튜브 (`instagram_url` / `youtube_url` 컬럼 추가 결정 시 활성화)

## 현재 작업

- **요청**: v3-rebake D-4~D-8 sync — D-3 보류 (Auto mode)
- **상태**: D-6 박제 + ProfileShell 폐기 완료 → commit 2건 대기 (fix + feat) → push
- **현재 담당**: PM
- **브랜치**: subin

### 진행 결과 (이번 세션)

| 단계 | 결과 |
|------|------|
| **D-3/8** ProfileWeeklyReport | ⏳ 큰 구조 변경 결정 필요 (보류) |
| **D-4/8** ProfileComplete | ✅ 변경 0 (시안 1:1 박제 완벽) |
| **D-5/8** ProfileCompletePreferences | ✅ 변경 0 (시안 1:1 박제 완벽) |
| **D-6/8** EditProfile | ✅ Hybrid 박제 완료 (page.tsx 1547→1233 / edit-profile.css 신규 603줄) — commit 대기 |
| **D-7/8** MyActivity | ✅ 변경 0 권장 (운영 탭/카운터/카드 우위) |
| **D-8/8** Billing | ✅ 변경 0 권장 (운영 탭 분리 + 진짜 기능 풍부) |
| **ProfileShell 폐기** | ✅ Cowork 직접 patch (layout.tsx) — commit 대기 |

### D-3 ProfileWeeklyReport — 사용자 결정 보류

| 항목 | v2.2 (운영 박제) | v2.4 (BDR-current) |
|------|---------------|-----------------|
| 섹션 | KPI 4 + TOP 3 코트 + 인사이트 3 + 이메일 footer | KPI 4 + Highlight 베스트 1경기 + 인사이트 3 + 다음 주 추천 3 + footer |
| Top 3 코트 | ✅ 운영 진짜 데이터 | ❌ 시안 제거 |

→ A. 시안 그대로 / **B. Hybrid (권장)** / C. 보류 — 다른 페이지 sync 후 재고

### 추후 큐 (사용자 결정 받은 것 / 보류)

- ContextReviews 작업 / Settings + BottomNavEditor / VenueDetail / GameEdit / PostEdit / HelpGlossary / LiveResult
- D-3 ProfileWeeklyReport 결정 / 후속 cleanup commit (`profile-shell.tsx` 삭제)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 디자인 시안 박제 (Phase 9) | 31% (32/117) — D-1~D-8 일부 진행 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |
| ProfileShell 폐기 | /profile/* 깊은 페이지 sidebar 0 | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | (커밋 대기) | **ProfileShell 폐기 (Cowork 직접 patch)**: layout.tsx → `<>{children}</>` passthrough. v2.3 시안 sidebar 0 원칙 정합. ProfileShell의 isHubRoot 분기가 hub root만 hide / sub 페이지 220px aside 노출 → 사용자 dev server 발견. ad774d9 revert 시 옛 wrap 잔재. tsc 통과 + grep 의존성 0 (정의 파일만 잔존, 후속 cleanup commit 대상). knowledge 4 파일 갱신: architecture(+1) / decisions(+1) / lessons(+1) / index. | ✅ |
| 2026-05-01 | (커밋 대기) | **D-6/8 EditProfile Hybrid 박제 (developer)**: page.tsx 1547→1233 (-314), edit-profile.css 신규 603줄. 5탭 사이드 + 6 sub-tab 제거 → 단일 스크롤 + Hero(아바타+카메라 = upload-image API 흡수) + 5섹션(기본/플레이/연락/공개/**추가-신설**). §5 추가 설정 = 환불계좌(BANKS) + Danger Zone 회원 탈퇴 흡수 — 정보 손실 0. 7 핸들러 + 7 API 호출 100% 보존. 시안 §2 사용손/실력/강점 + §4 공개 7항목 시각 박제 (DB 미저장, placeholder + "곧 제공"). hex 6건 합법 (소셜 브랜드 4 + #fff fallback 2). lucide 0 / pink-salmon-coral 0 / pill 0. tsc 통과. tester+reviewer 병렬 검증 통과 (수정 요청 0). reviewer 후속 큐 3건: chip BEM 격리 / §2 priv-note / §3 "준비 중" 안내. knowledge 갱신: architecture(+1) / decisions(+1) / index. | ✅ |
| 2026-05-01 | (변경 0) | **D-4~D-8 일괄 분석 (planner-architect)**: 시안 BDR-current 5개 ↔ 운영 5개 1:1 비교. D-4/D-5/D-7/D-8 변경 0 (시안 박제 완벽 또는 운영 사이트 컨벤션·진짜 데이터 우위). D-6 결정 필요 (D-3급) → B. Hybrid 채택. | ✅ |
| 2026-05-01 | cef0a2b (dev 머지 push) | **DEV 머지 — subin → dev fast-forward** (8aea145..cef0a2b, 7 commits). dev preview 자동 배포 트리거. | ✅ |
| 2026-05-01 | 85944e3 (push) | **D-1/8 ProfileGrowth sync (BDR-current v2.4)**: 마일스톤 순서 + 6번째 "팀 멤버 추천". tsc 통과. | ✅ |
| 2026-05-01 | (변경 0) | **D-2/8 ProfileBookings 검증**: 시안 BDR-current vs 운영 BookingsListV2 1:1 박제 완벽. sync 변경 0건. | ✅ |
| 2026-05-01 | a2c0636 (push) | **gitignore + .backup.jsx 3건 제거**: gitignore 패턴 추가 (다음 zip 동기화 자동 제외). | ✅ |
| 2026-05-01 | 22ce7f2 (push) | **v3-rebake P0 마이페이지 hub 박제**: BDR-current/screens/MyPage.jsx → /profile/page.tsx 1:1 박제. Hero strip + 3-tier hub + aside 4 카드. mypage.css 948줄 카피. 8 쿼리 prefetch 보존. AppNav frozen(R-C-4). 13 룰 통과. | ✅ |
| 2026-05-01 | f2df385 + 8a5cb7b + 1bc549d (push) | **Dev/design/ 정리 + 박제 7 commit revert + BDR-current 동기화**: profile/ ad774d9 복원 + _archive/ 이관 + BDR-current/ 동기화 + Cowork 갱신. 단일 폴더 룰 적용. | ✅ |
| 2026-04-30 | 749e9ba 외 6 (revert) | /profile v2.4 시안 1:1 매칭 — 7 commit revert (f2df385). | ✅↩️ |
<!-- 04-30 일부 + 05-01 R-A/R-B'/R-C-4 절단 (10건 유지 — D-6 + ProfileShell 신규 추가로 인한 정리) — 필요 시 git log로 복원 -->
