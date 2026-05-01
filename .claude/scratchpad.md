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

## 현재 작업

- **요청**: Dev/design/ 정리 + 마이페이지 박제 7 commit revert + BDR-current 동기화 — **완료**
- **상태**: 커밋 2건 push 완료
- **현재 담당**: PM
- **브랜치**: subin

### 결과 요약

| 단계 | 결과 |
|------|------|
| Step 0 환경 점검 | ✅ remote / branch / .env / ad774d9 모두 통과 |
| Step 1 profile revert | ✅ 23 files / -1109 / +178 (ad774d9 시점) |
| Step 2 _archive/ 옛 BDR 4 폴더 + audit-results + ui_breaking 이동 | ✅ 6 폴더 |
| Step 3 옛 prompts 21 .md → _archive/prompts/ | ✅ 21건 (보존 3: DESIGN/README/v3-rebake) |
| Step 4 BDR-current/ 87 screens + v2-original/BDR v2.2 + zip-root-CLAUDE.md | ✅ |
| Step 5 Cowork 갱신 3 파일 검증 | ✅ CLAUDE 1 / README 5 / BDR-current 10 / v3 P0 1 |
| Step 6 git 최종 status | ✅ 852 files staged (+39159/-1109) |
| Step 7 commit 2건 + push | ✅ f2df385 (revert) + 8a5cb7b (design) → origin/subin |

### 주요 결정 (사용자 승인)

- profile 14 commit ≠ 실제 7 commit → 7 commit revert
- audit-results/ + ui_breaking/ → _archive/ 이동 (B안)
- Cowork 미커밋 3 파일 (CLAUDE.md / Dev/design/README.md / v3-rebake) → Step 7 commit 2 함께

### 다음 액션

- v3-rebake-prompt-2026-05-01.md P0 (마이페이지 hub) 박제 시작 — 별도 세션
- BDR-current/ 단일 source 룰 (CLI 박제 작업의 모든 참조)

## 진행 현황표

| 영역 | 작업 | 상태 |
|------|------|------|
| Dev/design/ 단일 폴더 룰 적용 | _archive/ + BDR-current/ + 보존 3 파일 | ✅ |
| 마이페이지 박제 revert | 7 commit ad774d9 시점 복원 | ✅ |
| 디자인 시안 박제 (Phase 9) | 31% (32/117) — v3 P0 박제 대기 | ⏳ |
| Phase 10 운영 DB | 4 테이블 적용 | ✅ |
| Phase 12 (시즌 통계 + Portone) | schema/SQL/API/UI 4단계 | ✅ |
| 헤더 구조 정리 | 더보기 가짜 4건 제거 + Phase 19 쪽지 | ✅ |

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 | 결과 |
|------|------|------|------|
| 2026-05-01 | f2df385 + 8a5cb7b (subin push 완료) | **Dev/design/ 정리 + 마이페이지 박제 7 commit revert + BDR-current 동기화 (PM)**: (1) profile/ 디렉토리 ad774d9 시점 복원 (23 files, -1109/+178). 운영 헤더 Phase 19 보존 검증. (2) Dev/design/{BDR v2, v2.2, v2.3, v2.4, audit-results, ui_breaking}/ → _archive/ 이동 (사용자 결정 B). 옛 prompt 21 .md → _archive/prompts/. 보존 3: DESIGN.md / README.md / v3-rebake-prompt-2026-05-01.md. (3) Downloads/BDR v2/Dev/design/BDR v2.3/ → BDR-current/ (87 screens / MyPage.jsx / Phase 13 README / BottomNavEditor 2건 검증 통과). Downloads BDR v2.2 → _archive/v2-original/. zip-root CLAUDE.md → _archive/v2-original/zip-root-CLAUDE.md. (4) Cowork 갱신 3 파일 검증 통과 (CLAUDE.md §Dev/design/ 폴더 구조 + Dev/design/README.md 단일 폴더 룰 + v3-rebake-prompt P0 가이드). (5) commit 2 분리: revert(profile) + design(폴더 정리 + BDR-current sync). push origin subin. 단일 폴더 룰 적용 — CLI 박제 작업의 모든 참조는 BDR-current/ 만 사용. | ✅ |
| 2026-04-30 | 749e9ba 외 6 (revert됨) | /profile v2.4 시안 1:1 완전 매칭 — 우측 aside SeasonStats 제거 / 큰 카드 2종(설정/결제·멤버십) / 다음 경기 D-N 빨간 박스 / 소속 팀 시안 톤 / 도움 영역 / 내 성장 SVG / Hero BDR Red fallback / 캡처 28-30 회귀 픽스. **2026-05-01 v3-rebake 진행으로 7 commit revert (f2df385)** | ✅↩️ |
| 2026-05-01 | (변경 0) | /profile 연결 페이지 7 영역(Growth/Activity/Bookings/WeeklyReport/Achievements/Settings/Billing) 시안 매칭 검증 — 모두 박제 완료 상태 | ✅ |
| 2026-05-01 | (커밋 3건 대기) | R-A + R-B' + R-C-4 통합 — v2.4 새 다운로드 재박제 (시안 7 / knowledge 3 / CLAUDE 1 / 운영 2) | ✅ |
| 2026-04-30 | (미커밋) | v2.4 풍부 디테일 통합 재박제 — HeroCard 96 그라디언트 + ActivityTimeline kind 5종 + _components → _archived 14 격리 | ✅↩️ |
| 2026-04-30 | (미커밋) | v2.4 마이페이지 hub 박제 — Hero 카드 + Tier 1 4 + Tier 2 quick 4 + 더보기 마이페이지 항목 | ✅↩️ |
| 2026-04-30 | 002aeae+2661542 (미푸시) | v2.4 진짜 변경 박제 4 영역 — RefereeInfo 215줄 재구성 + CourtAdd/SeriesCreate placeholder + Match 작업외 | ✅ |
| 2026-04-30 | (변경 0) | v2.4 Games.jsx 박제 검증 — v2.2/v2.3/v2.4 byte 일치 (`diff -w` 0) → 운영 변경 0 | ✅ |
| 2026-04-30 | (미커밋) | Phase C — AppNav frozen Phase 19 쪽지 아이콘 운영 동기화 — mail_outline + /messages + app-nav__icon-btn | ✅ |
| 2026-04-30 | (커밋 2건 대기) | v2.4 시안 자체 정리 Phase A + B 일괄 — AppNav frozen 카피 / moreGroups 가짜 4 제거 / 카피 룰 11/12/13 / 16 파일 | ✅ |
