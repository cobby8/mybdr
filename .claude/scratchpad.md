# 작업 스크래치패드

## 현재 작업
- **요청**: Phase 6.1 Auto Chain — v2.24 sync + Phase 6.1C 박제 6 PR (프로필 본체)
- **상태**: 🔵 진행 중 — sync v2.24 ✅ `29178b9` / 6.1C 6 PR 박제 진행
- **현재 담당**: pm → developer
- **의뢰서**: `Dev/design/prompts/phase-6.1-auto-chain-cli-prompt-2026-05-30.md`

### Phase 6.1C 진행 (6 PR / 운영 라우트 전부 존재 — _v2 고도화 상태)
| PR | 시안 → 운영 | 상태 |
|----|------|------|
| 6.1C-1 | PU4 Achievements → /profile/achievements | ✅ 박제(tsc0) — 커밋 대기 |
| 6.1C-2 | PU1 ProfileMain → /profile (보강) | ⏳ |
| 6.1C-3 | PU2 ProfileEdit → /profile/edit (보강) | ⏳ |
| 6.1C-4 | PU3 ProfileBasketball → /profile/basketball | ⏳ |
| 6.1C-5 | PA1 AdminUsers → /admin/users | ⏳ |
| 6.1C-6 | PU5 UserPublicProfile → /users/[id] | ⏳ |
- lock: BP1 publicView() privacy(PU1본인=PU5공개 동일 User, 이메일/연락처/결제 hide) / BP2 cross-domain mock 0 / BP4 결제=Phase6.2 link out "준비 중" / BP5 OA1 답습 본인 자기정지 가드

### Phase 5 (직전) — subin→dev #656 머지(`9619be8`) / dev→main 보류

### Phase 5C 진행 현황 (6/6 ✅)
| PR | 시안 → 운영 | commit |
|----|------|------|
| 5C-1+6 | CU4 Edit + CU3 New 공용 `community-wizard.tsx` (BC5) | `68fc5c3` |
| 5C-2 | CU1 CommunityList → /community (BC2) | `c058f6e` |
| 5C-3 | CU2 CommunityDetail → /community/[id] (BC4) | `70c6c6c` |
| 5C-4 | RU1 Rankings → /rankings (BC1/BC7) | `a2e01e0` |
| 5C-5 | CA1 AdminCommunity → /admin/community (OA1) | `3e3423f` |
- sync `7e2d0f1` / ledger `7ff69b6` / **PR #656** subin→dev / stop condition 발동 0

### Phase 5 lock (적용 결과)
- A1 댓글=운영 comments 실데이터 / A2 신고=hide / A4 cross-domain·MVP·핀 hide(mock 0)
- 데이터 패칭·서버액션·권한가드 0 변경 / 매 commit tsc0 / 회귀6 PASS / `/api/v1`·DB schema 0 / LOC<+2000
- globals.css cu1-/cu2-/ru1- prefix 충돌 0 / 시안 토큰→운영 토큰 치환

### 5C 핵심 hide 결정 (mock 0)
- 5C-1: news/notice 작성 제외(6종) / STEP4 cross-domain hide / type·images 미지원 안내
- 5C-2: team·is_official·image_count·tournament hide / 인기글 실데이터 파생 / mock 내활동 드롭
- 5C-3: 알기자 hero·mock 추천·신고 hide / 운영 댓글·좋아요·사이드바 컴포넌트 보존
- 5C-4: MVP Hero·매너·코트·titles hide / 팀 승수 리더=team모드 1위 실데이터
- 5C-5: 신고·핀·알림·복구 hide / deleted 탭 실데이터 / 동적 카테고리 / Hero stat 실측

## 🔜 다음 액션
- ⏸ **PR #656 머지 결재** (수빈 — subin→dev→main, #654/#655 답습)
- ⏸ Phase 6 영역 결재 (Cowork 별 의뢰)
- ☐ PR-1C-10 PA3 재설계 결정 (보류 중)

## 이전 Phase (완료 이력)
- ✅ Phase 1C 15/16 박제+머지 (#650~#653) / PA3 SKIP 보류
- ✅ Auto Chain 25 PR (v2.22 sync + 2C/3C/4C) 운영 반영 (#654/#655 / main `6f22c02`)
- ✅ Phase 1~4 ⑭ 종료 마킹

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|------|------|------|

## 구현 기록 (developer) — Phase 6.1C

### 6.1C-1 · PU4 ProfileAchievements → /profile/achievements

📝 구현: 운영 `_v2` 업적 페이지 상단 평면 card 헤더를 **PU4 v2.24 Hero 배너**로 교체 (시각 토큰/레이아웃 정합). 데이터 패칭 0 변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/profile/achievements/_v2/achievements-content.tsx` | 평면 헤더 → 다크 그라디언트 Hero(`pf-achv-hero` · military_tech 골드 원형 + 획득/전체 카운트칩 + 요약 meta 3종 + 안내 카피). 기존 계산값(earnedItems/allBadges/achievementPct)만 사용 | 수정 |
| `src/app/globals.css` | `pf-achv-` prefix Hero CSS +66 line (다크 그라디언트는 ru1-leader 답습 리터럴, 라운딩 4/8/10px, 720px 분기) | 수정 |

정합 결과:
- 데이터 0 변경: page.tsx·badge-catalog.ts 미수정 / 신규 쿼리 0 / mock 0
- cross-domain hide: 시안 champion 카드·MVP 누적 StatCard 미배치 (page.tsx 미페칭 — 쿼리 추가 금지 준수)
- 운영 보존: 필터 칩·4열 그리드·최근획득4·달성률·tier/lock 로직 전부 유지
- prefix 충돌 0 (`pf-achv-` 신규) / `--r-lg` 등 시안 전용 토큰 미사용 → 운영 리터럴 치환

💡 tester 참고:
- 테스트: `/profile/achievements` 로그인 후 진입
- 정상: 상단 다크 군청 Hero 배너 + 골드 military_tech 아이콘 + "획득 N / 전체 M" 칩 + meta 3줄(배지 N개/전체 M종/달성률 P%) / 하단 필터·그리드 기존대로
- 주의: 배지 0건 계정(neewbie) → Hero 카운트 0/16, meta 0개/16종/0%, 최근획득 섹션 숨김 정상 / 비로그인 → 기존 로그인 유도 화면

⚠️ reviewer 참고:
- Hero 다크 그라디언트 리터럴 hex(#1A1E27 등) = 시안 pm-hero + 운영 ru1-leader Hero 동일 패턴(다크 밴드 한정 허용). 토큰 위반 아님
- 데이터 0 변경 확인 포인트: page.tsx·badge-catalog.ts diff 없음

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-31 | **Phase 6.1C-1** PU4 Achievements Hero 박제 | ✅ achievements-content.tsx Hero(`pf-achv-`)+globals.css +66 / tsc0 / 데이터0변경 / 커밋 대기 |
| 2026-05-31 | **Phase 5 chain 완료** (sync v2.23 + 5C 6 PR) | ✅ `7e2d0f1`·`68fc5c3`·`c058f6e`·`70c6c6c`·`a2e01e0`·`3e3423f`·`7ff69b6` push / PR #656 / ledger Phase5 ⑩⑪⑫ ✅ / stop 0 |
| 2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 | ✅ dev→subin(`0c61175`) / ledger 2/3/4 ⑬⑭ ✅ |
| 2026-05-29 | Auto Chain 25 PR 운영 반영 (#654→#655) | ✅ main=`6f22c02` / Vercel 배포 |
| 2026-05-29 | Phase 4C 완료 8/8 | ✅ `8ec6a54`~`fa7b63b` / OrgHierarchyCrumbs 공용 / Q2·Q3·Q4 lock |
| 2026-05-29 | Phase 3C 완료 6/6 | ✅ `50ee237`~`0b61922` / status·권한 BT1~6 / docs `b50b88e` |
| 2026-05-29 | Phase 2C 완료 10/10 | ✅ `13feb36`~`9292fe6` / game_applications.status Int / docs `283bcd3` |
| 2026-05-29 | Auto Chain 1단계 v2.22 sync (`dee2445`) | ✅ screens 33→46 / 회귀16 |
