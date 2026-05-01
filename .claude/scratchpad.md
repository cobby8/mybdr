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

- **요청**: v3-rebake P1+P2 — BDR-current 디테일까지 모두 일치 (사용자 결정)
- **상태**: D-1/8 완료 / D-2/8 일치 / D-3 결정 필요 / 컨텍스트 한계
- **현재 담당**: PM
- **브랜치**: subin

### 진행 결과 (이번 세션)

| 단계 | 결과 |
|------|------|
| **P0** 마이페이지 hub | ✅ 22ce7f2 push |
| **gitignore + .backup.jsx** | ✅ a2c0636 push |
| **D-1/8** ProfileGrowth | ✅ 85944e3 push (마일스톤 순서 + 6번째 팀 멤버 추천) |
| **D-2/8** ProfileBookings | ✅ 시안 1:1 박제 완벽 — 변경 0 |
| **D-3/8** ProfileWeeklyReport | ⏳ **큰 구조 변경 결정 필요** |
| **D-4~8** | ⏳ 미진행 (컨텍스트 한계) |

### D-3 ProfileWeeklyReport — 사용자 결정 필요

| 항목 | v2.2 (운영 박제) | v2.4 (BDR-current) |
|------|---------------|-----------------|
| 섹션 | KPI 4 + TOP 3 코트 + 인사이트 3 + 이메일 footer | KPI 4 + **Highlight 베스트 1경기** + 인사이트 3 + **다음 주 추천 3** + footer |
| KPI | session_count / total_minutes / unique_courts / active_days / total_xp | 경기 / 평균 평점 / XP / 활동 시간 |
| Top 3 코트 | ✅ 운영 진짜 데이터 | ❌ 시안 제거 |
| Highlight | ❌ | ✅ 신규 (DB 미지원, 더미) |
| 다음 주 추천 | ❌ | ✅ 신규 (DB 미지원, 더미) |

→ 시안 v2.4 박제 시 진짜 데이터(TOP 3 코트) 손실 + 더미 추가. 사용자 결정 권장:
- **A. 시안 v2.4 그대로** (손실 감수)
- **B. Hybrid** (시안 KPI 4종 변경 + 옛 TOP 3 코트 보존)
- **C. 보류** (다른 페이지 sync 후 재고)

### 추후 큐 (사용자 결정 받은 것 / 보류)

- **ContextReviews 작업**: 코트 리뷰만 활성 + 대회/팀/심판 탭 보존 (주석). ContextReviews 컴포넌트 신규 + /courts/[id] 인라인. /reviews 4탭 → 1탭
- **Settings + BottomNavEditor**: 큰 구조 변경 (3 섹션 신규) — 결정 4건 필요
- **VenueDetail / GameEdit / PostEdit**: P2 sync 가능 (다음 세션)
- **HelpGlossary**: 옛 결정 보존 (옵션 C)
- **LiveResult**: /games/[id] 흡수 검토 후속 큐
- **D-4~8**: ProfileComplete / Preferences / Edit / MyActivity / Billing — 다음 세션

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
| 2026-05-01 | cef0a2b (dev 머지 push) | **DEV 머지 — subin → dev fast-forward** (8aea145..cef0a2b, 7 commits). dev preview 자동 배포 트리거. 이번 세션 마무리. | ✅ |
| 2026-05-01 | 85944e3 (push) | **D-1/8 ProfileGrowth sync (BDR-current v2.4)**: 마일스톤 순서 [누적/연속/평점/MVP/커뮤/순위] → [누적/평점/MVP/연속/커뮤/팀멤버추천]. 6번째 항목 "시즌 순위" → "팀 멤버 추천" (DB 미지원, 더미 + 준비 중). 옛 시즌 순위 코드 주석 보존. tsc 통과. | ✅ |
| 2026-05-01 | (변경 0) | **D-2/8 ProfileBookings 검증**: 시안 BDR-current vs 운영 BookingsListV2 1:1 박제 완벽 일치. sync 변경 0건. | ✅ |
| 2026-05-01 | a2c0636 (push) | **gitignore + .backup.jsx 3건 제거**: Profile/Settings/EditProfile.backup.jsx 제거. gitignore 패턴 추가 (다음 zip 동기화 자동 제외). | ✅ |
| 2026-05-01 | 22ce7f2 (push) | **v3-rebake P0 마이페이지 hub 박제 (PM 직접)**: BDR-current/screens/MyPage.jsx → src/app/(web)/profile/page.tsx 1:1 박제. Hero strip(아바타 76/56px + 닉네임 의 농구 + 팀·포지션·시즌 + L.N/PRO/✓본인인증 + 액션3) + Tier1 큰4(프로필/내 농구 PPG·APG·RPG·RTG/내 성장 SVG sparkline 12주/내 활동 13주 막대) + Tier2 중간4(예약·주간 NEW·알림 N건·배지·업적) + Tier3 작은2(설정/결제·멤버십) + aside 4(D-N 다음 경기/소속 팀/최근 활동 5건/도움말). mypage.css 948줄 1:1 카피. 8 쿼리 prefetch 보존 + setRoute → Link 10건 매핑. AppNav frozen(R-C-4) + more-groups 운영 이미 박제 — 변경 0. 13 룰 검수: hex 0(teamInk 토큰 fallback) / pink-salmon-coral 0 / lucide 0 / pill 0. 회귀 4 케이스 통과. tsc --noEmit 통과. _v2 6 컴포넌트 import 제거(미사용 dead code, P1 정리). | ✅ |
| 2026-05-01 | f2df385 + 8a5cb7b + 1bc549d (subin push 완료) | **Dev/design/ 정리 + 마이페이지 박제 7 commit revert + BDR-current 동기화 (PM)**: (1) profile/ 디렉토리 ad774d9 시점 복원 (23 files, -1109/+178). 운영 헤더 Phase 19 보존 검증. (2) Dev/design/{BDR v2, v2.2, v2.3, v2.4, audit-results, ui_breaking}/ → _archive/ 이동 (사용자 결정 B). 옛 prompt 21 .md → _archive/prompts/. 보존 3: DESIGN.md / README.md / v3-rebake-prompt-2026-05-01.md. (3) Downloads/BDR v2/Dev/design/BDR v2.3/ → BDR-current/ (87 screens / MyPage.jsx / Phase 13 README / BottomNavEditor 2건 검증 통과). Downloads BDR v2.2 → _archive/v2-original/. zip-root CLAUDE.md → _archive/v2-original/zip-root-CLAUDE.md. (4) Cowork 갱신 3 파일 검증 통과 (CLAUDE.md §Dev/design/ 폴더 구조 + Dev/design/README.md 단일 폴더 룰 + v3-rebake-prompt P0 가이드). (5) commit 2 분리: revert(profile) + design(폴더 정리 + BDR-current sync). push origin subin. 단일 폴더 룰 적용 — CLI 박제 작업의 모든 참조는 BDR-current/ 만 사용. | ✅ |
| 2026-04-30 | 749e9ba 외 6 (revert됨) | /profile v2.4 시안 1:1 완전 매칭 — 우측 aside SeasonStats 제거 / 큰 카드 2종(설정/결제·멤버십) / 다음 경기 D-N 빨간 박스 / 소속 팀 시안 톤 / 도움 영역 / 내 성장 SVG / Hero BDR Red fallback / 캡처 28-30 회귀 픽스. **2026-05-01 v3-rebake 진행으로 7 commit revert (f2df385)** | ✅↩️ |
| 2026-05-01 | (변경 0) | /profile 연결 페이지 7 영역(Growth/Activity/Bookings/WeeklyReport/Achievements/Settings/Billing) 시안 매칭 검증 — 모두 박제 완료 상태 | ✅ |
| 2026-05-01 | (커밋 3건 대기) | R-A + R-B' + R-C-4 통합 — v2.4 새 다운로드 재박제 (시안 7 / knowledge 3 / CLAUDE 1 / 운영 2) | ✅ |
| 2026-04-30 | (미커밋) | v2.4 풍부 디테일 통합 재박제 — HeroCard 96 그라디언트 + ActivityTimeline kind 5종 + _components → _archived 14 격리 | ✅↩️ |
| 2026-04-30 | (미커밋) | v2.4 마이페이지 hub 박제 — Hero 카드 + Tier 1 4 + Tier 2 quick 4 + 더보기 마이페이지 항목 | ✅↩️ |
| 2026-04-30 | 002aeae+2661542 (미푸시) | v2.4 진짜 변경 박제 4 영역 — RefereeInfo 215줄 재구성 + CourtAdd/SeriesCreate placeholder + Match 작업외 | ✅ |
| 2026-04-30 | (변경 0) | v2.4 Games.jsx 박제 검증 — v2.2/v2.3/v2.4 byte 일치 (`diff -w` 0) → 운영 변경 0 | ✅ |
| 2026-04-30 | (미커밋) | Phase C — AppNav frozen Phase 19 쪽지 아이콘 운영 동기화 — mail_outline + /messages + app-nav__icon-btn | ✅ |
| 2026-04-30 | (커밋 2건 대기) | v2.4 시안 자체 정리 Phase A + B 일괄 — AppNav frozen 카피 / moreGroups 가짜 4 제거 / 카피 룰 11/12/13 / 16 파일 | ✅ |
