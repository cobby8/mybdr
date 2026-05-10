# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

## 🚨 5/10 결승 영상 매핑 오류 fix (긴급 처리)

**증상**: /live/158 (결승, 슬로우 vs 아울스, 4쿼터 진행 중) 가 video_id `zIU3_RDRKuk` (4강 #157 영상 "아울스 vs 업템포") 잘못 재생.

**근본 원인 (audit log 기반 100% 확정)**:
- audit `auto_register_youtube_video` (PR-B `/api/web/match-stream/auto-register/[matchId]`) 가 score=120 으로 박음 (home_team 30 + away_team 30 + time 60)
- 알고리즘 결함 2건:
  1. **auto-register 1:1 매핑 가드 부재** — 다른 매치에 이미 박힌 video_id 가 후보 pool 에 남음 (cron 5분 폴링은 `usedSet` 가드 보유 / auto-register 누락)
  2. **score-match.ts haystack 단순 substring 매칭** — 영상 "아울스 vs 업템포" + 매치 "슬로우 vs 아울스" 에서 "아울스" 1팀 매칭 + description 토큰 hit 으로 30+30 부여 가능 (cron 의 v3 `extractTeamsFromTitle` swap-aware 알고리즘 미적용)

**1단계 fix (DB UPDATE)**:
- 매치 158 `youtube_video_id` zIU3_RDRKuk → NULL / `youtube_status` auto_pending → NULL / `youtube_verified_at` NULL
- admin_logs `manual_clear_youtube_video` (severity=warning) 박제
- 사후 검증: SELECT count=1 NULL 확인 ✅

**2단계 fix (재발 방지 — code change)**:
- `src/app/api/web/match-stream/auto-register/[matchId]/route.ts` 에 cron `usedSet` 가드 백포트 (Step 9-1): `youtube_video_id IS NOT NULL` SELECT → Set → `availableVideos` 필터링 → top 1건 후보 pool 에서 제외
- 동일 video_id 가 다른 매치에 박혀 있으면 자동 제외 → 158 NULL 해제 후 재매핑 차단

**남은 위험 (후속 PR 권고)**:
- `score-match.ts` 의 home/away swap 인식 부재 — cron v3 `extractTeamsFromTitle` 알고리즘 백포트 권장
- 1팀 부분 매칭만으로 30+30 부여 케이스 — `home_team + away_team = 60` 만으로는 80 미달이지만 `time=60` 만 추가되면 통과 (다른 시간대 운영자 영상이 동시에 publish 시 위험)

**3단계 fix (5/10 후속 — score-match swap-aware 백포트 / 본 turn 완료)**:
- `src/lib/youtube/score-match.ts` 에 `extractTeamsFromTitle` + `normalizeTeamName` 헬퍼 export 추가 (cron v3 동일)
- `scoreMatch()` home/away 점수 부여 로직 = 단순 substring 매칭 → swap-aware 정확/swap 일치만 30+30 부여 (반쪽 매칭 0점)
- cron route 가 score-match.ts 헬퍼 import — 단일 source 통합 (cron 점수 체계 v3 25+25+20+20+10 별도 유지 / 팀명 토큰 추출만 공용)
- 회귀 방지 vitest 14건 추가 (`src/__tests__/youtube/score-match.test.ts`) — 5/10 사고 시나리오 직접 재현 차단
- 검증: tsc 0 에러 / vitest 217/217 PASS (minutes-engine 21/21 회귀 0)

**main 머지 권한**: 본 fix 는 dev → main 머지 필요 (수빈/원영). 사용자 결재 대기.

---

**[5/9 D-day 종료 — 알기자 시스템 4 fix + 운영 5건 처리]**

main 최종 = `86c6d93` (PR #304). subin = dev = main 동기화. 미푸시 0.

### D-day 운영 처리 (DB 작업)
- ✅ 박찬웅 MZ #7 긴급 등록 (userId=3000 / ttpId=2847) — 충돌 없음 검증 (라이징이글스 = SEASON2 별 대회)
- ✅ 이현승 (블랙라벨 #27) 선출 처리
- ✅ MZ 3인 (이용기 #5 / 박찬웅 #7 / 곽용성 #41) 선출 일괄 처리
- ✅ #20 슬로우 vs MI = MI 기권 처리 (FIBA 5x5 Art.21 forfeit 20-0) + notes "부상 등 인원부족" + 진출 (블랙라벨 vs 슬로우 8강 자동 채워짐)
- ✅ 5/9 알기자 수동 발행 5건 (post#1380~1385) — Flutter sync path trigger fix 운영 반영 전 종료 매치 보강

### 알기자 시스템 fix 4 PR (오늘 핵심)
| PR | 머지 | fix |
|----|------|------|
| #286 (1e2272d) | dev→main | community draft 노출 차단 (prefetchCommunity + getPost status published) |
| #297→#299 (adb0308) | dev→main | **Flutter sync path trigger 추가 — 자동 발행 미작동 근본 원인** (sync/batch-sync 가 updateMatchStatus 헬퍼 우회 발견) |
| #302 (eff595e) | dev→main 통합 | forfeit 매치 = auto-publish notes 감지 LLM 우회 + 사전 정의 카피 / 라이브 [Headline]/Stats 점수차·압승 라벨 → "기권승 (FIBA Art.21)" |
| #303→#304 (86c6d93) | dev→main 통합 | dual_tournament LLM 인지 — brief route 가 tournament.format + roundContext + advancement 자동 LLM 입력 / prompts 양쪽 (Phase 1 + 2) "1위/우승" 추측 차단 가이드 |

### 발견된 회귀 패턴 (knowledge 박제 완료)
- Flutter 기록앱이 `/api/v1/matches/[id]/status` 가 아닌 `sync` / `batch-sync` 라우트 사용 → updateMatchStatus 헬퍼 우회 → 5/4 PR 부터 누적 자동 발행 0건. 진단 = audit 테이블 status 변경 audit 0건 + news_publish_attempts 0건 패턴.

---

## 🎯 다음 세션 진입점 (5/10 결승전 D-day)

### 🚀 1순위 — 5/10 4강 + 결승 진행
- 4강 #25 (12:00) / 4강 #26 (13:00) / 결승 #27 (14:30 KST)
- **Flutter sync path trigger 적용 = 자동 발행 첫 운영 검증** (5/9 fix 후 첫 매치 종료 시점)
- forfeit + dual 가이드 활성 = 결승 매치는 토너먼트 단계라 "결승전 = 우승" 정확 표기 자동 적용

### 🟡 보류
- Flutter PR6 (`Dev/lineup-pr6-flutter-prompt-2026-05-10.md` §2 — 사용자 별도 세션)
- 기존 draft 알기자 검수 publish 결정 (post#1380~1385 / admin 결정 — 1위 수성 류 교체 필요 시 admin/news 의 "재생성" 액션)
- PortOne 본인인증 운영 활성화 (`NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가)
- PlayerMatchCard 글로벌 재사용 확장
- Phase 3 cron (UserSeasonStat / Splits / ShotZoneStat)

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 알기자 자동 발행 (waitUntil + sync trigger + draft 차단 + forfeit + dual) | ✅ main 배포 |
| 라이브 페이지 forfeit 매치 표시 (Headline/Stats 분기) | ✅ main 배포 |
| YouTube 자동 매칭 cron 5분 | ✅ main 배포 |
| 사전 라인업 PR1~5 (web) | ✅ main / PR6 (Flutter) ⏳ 사용자 |
| PlayerLink/TeamLink 1~3-A + 후속 4 단계 | ✅ main 배포 |
| 모바일 박스스코어 PDF | ✅ main 배포 |
| 본 대회 (제21회 몰텐배) D-day 운영 | ✅ 5/9 8강·4강 일부 종료 / 5/10 4강·결승 예정 |

---

### 구현 기록 (5/10 통산 스탯 3 결함 fix)

📝 구현한 기능: 통산 스탯 정합성 3 결함 일괄 fix (mpg 모달 회귀 + 승률 source 일치 + FG%/3P% NBA 표준 sum/sum)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/(web)/users/[id]/page.tsx | statAgg `_avg` → `_sum` 전환 (FG/3P/FT made/attempted) + allStatsForModal select 확장 (made/attempted + winner_team_id) + 시즌 stats sum/sum 계산 + allStatsRows 변환 (minutes /60 + won winner_team_id 기반 + raw made/attempted 전달) | 수정 |
| src/app/(web)/profile/basketball/page.tsx | 동일 패턴 카피 (statAgg + allStatsForModal + careerStats + allStatsRows) | 수정 |
| src/app/(web)/users/[id]/_v2/stats-detail-modal.tsx | AllStatsRow 타입 — `fgPct/threePct` 단순 % → `fgMade/fgAttempted/threeMade/threeAttempted/ftMade/ftAttempted` 확장 + buildRow sum/sum NBA 표준 계산 | 수정 |

💡 tester 참고:
- 테스트 방법: 정환조 (userId=3107) `/users/3107` + (본인 로그인 시) `/profile/basketball` 진입 → 통산 카드 + "더보기 →" 모달 비교
- 정상 동작: 경기 5 / 승률 100% / PPG 5.2 / MIN 13.2분 (모달 동일) / FG% 31.0% / 3P% 8.3%
- 주의할 입력: 라이브 매치 (winner_team_id=null) 보유 사용자 → 모달 won 카운트 0 처리 일관 / 시도 0 매치 보유 사용자 → 매치별 % 평균 X (sum/sum 으로 0 가중치 0)

⚠️ reviewer 참고:
- `users/[id]/page.tsx` allStatsRows 변환 `won = m.winner_team_id !== null && matchTtId !== null && winner === matchTtId` — 라이브 매치 분자 0 + 분모는 모달 buildRow 내부 `rows.length` 기반 (미세 왜곡 케이스 발생 가능 — 사용자 결재 = 페이지 상단 winRate 와 일관 우선)
- AllStatsRow 타입 변경 (breaking) — 같은 타입 import 한 페이지 2개만 변경 영향 (검증 완료 — tsc --noEmit 0 에러)
- Flutter v1 (`api/v1/players/[id]/stats/route.ts` line 89) 잔존 — 원영 사전 공지 룰 (별도 결재)

#### 검증
- `npx tsc --noEmit` 0 에러 ✅
- DB schema 변경 0 ✅
- Flutter v1 영향 0 ✅
- 박스스코어 (formatGameClock) 영향 0 (초 그대로 사용 유지) ✅

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 매핑 swap-aware 백포트 (3차 fix)** — score-match.ts 에 cron v3 `extractTeamsFromTitle` + `normalizeTeamName` export 추가. `scoreMatch()` home/away 점수 = 단순 substring → swap-aware 정확/swap 일치만 30+30 부여 (반쪽 매칭 0점). cron route 가 헬퍼 import — 단일 source 통합. 회귀 방지 vitest 14 케이스 추가 (5/10 사고 직접 재현 차단). tsc 0 에러 / vitest 217/217 PASS (minutes-engine 21/21 회귀 0). 변경 3 파일. | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **[live] 5/10 결승 영상 매핑 오류 긴급 fix** — /live/158 결승 (슬로우 vs 아울스, 4쿼터 진행) 가 video_id zIU3_RDRKuk (= 4강 #157 "아울스 vs 업템포") 잘못 재생. 진단 = audit log score=120 (home_team:30+away_team:30+time:60) → 알고리즘 결함 2건 (auto-register 1:1 가드 부재 + score-match swap-aware 미적용). 1단계 = 158 youtube_video_id NULL UPDATE + admin_logs warning 박제. 2단계 = auto-register/[matchId]/route.ts Step 9-1 추가 (cron `usedSet` 가드 백포트). tsc 0 에러. 후속 = score-match.ts cron v3 extractTeamsFromTitle 백포트 (별도 PR). | ✅ |
| 2026-05-10 | (PM 커밋 대기) | **통산 스탯 3 결함 일괄 fix** (진단→fix 통합) — 정환조(3107) 5경기 raw 검증. (1) 모달 mpg `/60` 변환 (page.tsx 2 + AllStatsRow buildRow 단위 일관) (2) 승률 source 일치 (모달 won = winner_team_id 기반 — 상단 통산 100% 와 일관 / 라이브 매치 분모 제외) (3) FG%/3P% NBA 표준 sum/sum (statAgg _sum + AllStatsRow made/attempted + buildRow 누적 — 매치별 % 산술평균 39.8% → 31.0%). 3 파일 변경. tsc 통과. errors.md fix 결과 박제. Flutter v1 잔존 (원영 결재). | ✅ |
| 2026-05-09 | main `86c6d93` (PR #304) | **알기자 forfeit + dual_tournament 통합 fix** — auto-publish forfeit 카피 / 라이브 [Headline]·Stats 분기 / brief route roundContext+advancement / prompts Phase 1+2 가이드. notes 표준 "{팀} 기권 (사유: ...) — FIBA 5x5 Art.21 forfeit {점수}" 형식 박제. | ✅ |
| 2026-05-09 | main `adb0308` (PR #299) | **Flutter sync path 알기자 trigger 추가 (근본 fix)** — sync/route.ts + batch-sync/route.ts 의 prisma.tournamentMatch.update 직후 `waitUntil(triggerMatchBriefPublish)` 추가. updateMatchStatus 헬퍼 우회 path 보강. 멱등 가드 내장. errors.md 박제. | ✅ |
| 2026-05-09 | main `1e2272d` (PR #286) | **알기자 draft 사이트 노출 차단** — prefetchCommunity (`where: {}` → status="published") + getPost (findUnique → findFirst+status). /community SSR 진입 + 직접 URL 양쪽 차단. | ✅ |
| 2026-05-09 | DB 작업 (commit 무관) | **D-day 운영 5건** — 박찬웅 MZ #7 등록 (userId=3000) / 이현승 (블랙라벨 #27) + MZ 3인 (이용기·박찬웅·곽용성) 선출 / #20 MI 기권 FIBA forfeit 20-0 (notes "부상 등 인원부족") + 진출 자동 / 알기자 수동 발행 5건 (post#1380~1385 — sync trigger fix 운영 전 종료 매치). | ✅ |
| 2026-05-10 | main 시리즈 (#291~#301) | **PlayerLink/TeamLink 박제 시리즈 5 단계** — 1단계 글로벌 컴포넌트 (`b4e437d`) / 2단계 라이브 페이지 (`ec3f4ff`) / 3-A 대회 페이지 (`a5d5e37`) / 후속 A+B+C+D 일괄 (`b735db5`) — TeamLink 24 + PlayerLink 17 누적 마이그. children + onClick 확장 패턴 (nested anchor 회피). | ✅ |
| 2026-05-10 | main 시리즈 (#266~#290) | **모바일 박스스코어 PDF 시리즈 11 PR** — Fix A→D html2canvas+jspdf 근본 해결 / 양식 PC 프린트 동등 / globals.css single source / errors.md 박제 ("모바일 print = window.print 금지") | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 / 5/6 PR1e DROP COLUMN + UI fix 13건 / 5/7 main 21회 신기록 Onboarding 10단계 + PortOne V2 + Phase A.5 / 5/8 main 7회 PR3 mock + PhoneInput + 시안 11 commit / 5/9 main 9회 알기자 시스템 4 fix + 운영 5건 / 5/10 PR #246+#247 scoreMatch+Live.jsx 시안 박제 / PR #248+#249 자동 트리거+PR4+Tailwind 3차 / 5/10 아울스 #64 + 이하성 sync + stale pending 3건 정정) — 복원: git log -- .claude/scratchpad.md -->
