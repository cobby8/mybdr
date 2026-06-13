# 작업 스크래치패드

## 현재 작업
- **요청**: 제10회 YOUNGMAN GAME 결선 9경기 중복 정리 + 재발방지(KO Sprint1) + 다른 대회(7f287820) 동일 여부 진단
- **상태**: ✅ DB 정리 완료(트랜잭션) + KO Sprint1 커밋 `a9ebaf6` → **main 머지 진행 중** → 새 대회 진단 대기
- **현재 담당**: pm
- **KO Sprint1**: KO-1(결선판정 강화)·KO-2(2개조 자동생성 throw)·KO-3(silent catch)·KO-9(예선종료 오분류 차단). tester PASS8/8·reviewer APPROVE(min3). vitest55. Sprint2(group_cross 자동등록) 보류
- **병행 대기**: Phase 10 정보페이지 Claude.ai zip(BDR v2.30) 회신(수빈) / PR-PERM-DISPLAY는 이미 main 머지(`157116c`)

## 진행 현황표
| # | 작업 | 상태 |
|---|------|------|
| Phase 10 정보페이지 | About/News/Help/Reviews/AdminNews 5시안 | ⏸ Claude.ai paste 진행 (zip 회신 대기) |
| PR-PERM-DISPLAY | 권한/구독 2축 분리 (역할→구독등급/관리자→운영권한) | ✅ `e98e611` (미push) |
| PR-RECORDER-AUDIT | 기록원 감사로그 + admin_role 가시화 | ✅ #670(`77d014a`)+HOTFIX #672(`3db595c`) 운영 반영 |
| ③ | 대회종료 재구성 박제 (B안) | ✅ #667→#668(`4199d87`) 운영 반영 |
| ①-b | Phase 9C 박제 (9C-1/3/4·9C-2 스킵) | ✅ #667→#668 운영 반영 |
| ②·① | 대회상세 박제 / Phase 9 sync | ✅ #666 / `fb81e53` (이전 세션) |

## 기획설계 (planner-architect)
(완료 — 완료 Phase로 압축)

### 추가 이슈: 예선 종료 → 대회 종료 오분류 (2026-06-14, read-only)
🎯 원인 확정: 제10회 YOUNGMAN GAME 예선 종료 시 자동 종료된 건 **`auto-complete.ts` `checkAndAutoCompleteTournament`(자동 trigger)** 때문. errors.md [2026-06-08] "cron 없음·수동 추정"은 오기 → 자동 trigger 실재로 정정.
- **메커니즘**: 매 매치 종료 시 `finalizeMatchCompletion`이 auto-complete 호출 → `finished===total`이면 status='completed'. total은 결선 존재 무관 "현 DB 매치"만 셈 → **결선 0건이면 예선=전체로 오판**. `isLeagueComplete`도 예선(round_number NULL)만 봐 결선 0건이어도 true. admin PATCH route 순서 = finalize(auto-complete) → **그 다음** auto-knockout-gen(KO-3 silent catch) = 자동 종료가 결선 생성보다 먼저. auto-knockout-gen은 admin PATCH route에만 있음(Flutter/score-sheet 종료 시 결선 생성 안 함). 분기점=skeleton 유무(6/9 수동 대진=skeleton 우회→오분류).
- **방지책**: **KO-9(Sprint 1·XS·회귀0)** = auto-complete에 결선 미생성 가드(full_league_knockout인데 결선 0건이면 종료 차단) + KO-3(silent catch 가시화) 짝. **KO-10(Sprint 2·M)** = 예선 종료 시 결선 placeholder 보장. KO-9 Sprint 1 즉시 편입 권장.
- 산출: `Dev/knockout-auto-schedule-plan-2026-06-14.md` §추가 이슈 append / errors.md [2026-06-08] 보강. 코드·DB 0변경. DB 확정 SELECT 1회 PM 위임(skeleton 유무).

## 구현 기록 (developer)
(완료 — 완료 Phase로 압축)

### KO Sprint1 재발방지 (2026-06-14)

📝 구현: knockout 결선 9경기 중복 사고(제10회 YOUNGMAN GAME) 재발방지 3종 가드. 설계=`Dev/knockout-auto-schedule-plan-2026-06-14.md`(KO-1/2/3).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/lib/tournaments/tournament-seeding.ts | **[KO-1]** `countKnockoutMatches(tournamentId)` 신규(round_number OR bracket_position OR roundName 결승/N강/3·4위전 포함). **[KO-2]** PURE `assertSingleGroupForAutoKnockout(groupNames)`(distinct≥2 throw) + DB `guardAutoKnockoutGroups(tournamentId)` 신규. generator 3곳(generateKnockoutMatches/generateEmptyKnockoutSkeleton/assignTeamsToKnockout) 진입부 KO-2 가드 + 가드키 KO-1 치환 | 수정 |
| src/lib/tournaments/nba-seed-knockout.ts | KO-1/KO-2 import + generateNbaSeedKnockout 진입부 가드 삽입·치환 | 수정 |
| src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts | **[KO-1]** existingKnockout 카운트 → countKnockoutMatches 치환(동적 import 추가). **[KO-3]** auto-knockout-gen silent catch → console.warn + KO-2 사유 메시지 | 수정 |
| src/app/api/web/tournaments/[id]/bracket/route.ts | **[KO-3]** skeleton-gen silent catch → console.warn + KO-2 사유 메시지 | 수정 |
| src/__tests__/lib/tournaments/auto-knockout-guard.test.ts | **신규** KO-2 PURE 회귀게이트(1개조/무그룹/빈문자/trim 통과 6 + 2·3개조 throw 4 = 10) | 신규 |

- **검증**: tsc EXIT 0 / vitest KO-2 10건 + nba 회귀 9건 PASS. 전체 vitest 기존실패 4건(tournament-delete 3·running-score-helpers 1)은 **KO 변경 stash 후에도 동일 실패** = baseline 무관 확인. +128/-19 (4파일) + 신규 테스트
- **Stop conditions 준수**: schema 0 / api/v1 0 / 1개조 경로 보존(distinct≤1 통과·회귀게이트) / group_cross(S2) 미구현 / tsc·vitest(신규) 통과
- ⚠️ **순환import 없음 확인**: tournament-seeding.ts는 nba-seed-knockout.ts를 import 안 함 → nba가 seeding의 가드 단방향 import 안전
- ⚠️ **린터 revert 함정 2회**: Edit 직후 외부 린터가 seeding.ts/route 변경을 통째 revert(2회) → grep 재검증 후 전량 재적용으로 복구. 최종 grep으로 5곳 가드·3 헬퍼·2 catch 모두 확정

#### [KO-9] 결선 미생성 자동종료 오판 가드 (2026-06-14)

📝 버그: full_league_knockout/group_stage_knockout(예선후 결선 별도생성)이 결선 0건일 때 예선만 완료되면 auto-complete가 finished===total로 오판 → 대회 자동종료(completed). 결선 생성 전 종료 차단 가드 추가.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| src/lib/tournaments/auto-complete.ts | PURE `isKnockoutFormat(format)` 신규(KNOCKOUT_FORMATS=full_league_knockout/group_stage_knockout 포함판정). `checkAndAutoCompleteTournament`: findUnique select에 `format:true` 추가 + total>0 직후 `isKnockoutFormat && countKnockoutMatches===0`이면 early return `{updated:false, reason:"knockout-not-generated"}` + console.warn(종료 UPDATE 안 함). countKnockoutMatches는 KO-1 헬퍼 재사용(import, 중복구현0) | 수정 |
| src/__tests__/lib/tournaments/auto-complete-knockout-guard.test.ts | **신규** PURE isKnockoutFormat 7(knockout 2=true/round_robin·single_elimination·league_advancement·null·undefined=false) + 가드분기 3(결선0=차단/결선有=종료/비knockout=우회·count미호출) = 10 | 신규 |

- **검증**: tsc EXIT 0 / vitest 신규 10/10 + KO-2 10/10 + nba 22/22 PASS. auto-complete.ts +36/-1. 회귀안전=결선없는 format(round_robin/swiss/league_advancement/group_stage_with_ranking/single·double_elimination/dual_tournament)은 isKnockoutFormat=false → 가드 미적용·기존 종료경로 100% 보존(count조차 미호출 테스트로 확인)
- **Stop conditions 준수**: schema 0 / api/v1 0 / 결선없는 format 정상종료 회귀0 / tsc·vitest 통과
- ⚠️ countKnockoutMatches는 글로벌 prisma 사용(client 파라미터 없음) — 결선 카운트는 트랜잭션 미커밋 데이터 의존 안 해 무방. 테스트는 모듈 mock으로 대체(DB I/O 0)

💡 tester 참고(KO-9):
- 테스트: `npx vitest run src/__tests__/lib/tournaments/auto-complete-knockout-guard.test.ts` (10/10 PASS)
- 정상: 결선 format이라도 결선매치 생성 후엔 정상 종료 / 비knockout format은 가드 우회 정상 종료
- 주의: 운영 영향=결선 별도생성 2 format의 "예선만 완료" 시점만 (종료 보류). 결선 생성되면 다음 트리거에서 정상 종료

⚠️ reviewer 참고(KO-9):
- early return 위치가 total>0 직후·finished<total 분기 앞 → 결선 0건이면 finished/total 무관하게 항상 차단되는지
- isKnockoutFormat false인 format은 `&&` 단락평가로 countKnockoutMatches 호출조차 안 되는지(불필요 쿼리·회귀0)

💡 tester 참고:
- 테스트: `npx vitest run src/__tests__/lib/tournaments/auto-knockout-guard.test.ts` (10/10 PASS 확인)
- 정상: 1개조(또는 무그룹) 자동생성 통과 / 2개조+ 자동생성 시 한국어 throw → catch에서 console.warn 노출(메인 플로우 진행). DB 테스트 불필요(PURE만 게이트)
- 주의: 운영 영향은 **자동생성 경로만** (수동 INSERT 크로스 대진은 가드 무관·정상). 2개조 대회 예선완료 시 4강 자동생성이 이제 throw로 차단됨(설계 의도)

⚠️ reviewer 참고:
- countKnockoutMatches OR 조건이 1개조 정상 generator 산출물에 false positive 안 내는지(round_number 부여 매치는 기존과 동일 카운트)
- guardAutoKnockoutGroups가 generator 진입부 최상단(중복카운트·순위계산 전)에 위치해 2개조면 DB write 0으로 차단되는지
- KO-3 console.warn이 메인 플로우(경기완료/리그생성) 응답 성공을 막지 않는지

## 테스트 결과 (tester)
(완료 — 완료 Phase로 압축)

## 리뷰 결과 (reviewer)
(완료 — 완료 Phase로 압축)
- 실패 격리 OK — log.ts 전체 try-catch 내부 흡수, 호출부 await throw 0 → 메인 플로우 차단 없음.
- tsc --noEmit 통과(에러 0).

🟡 권장 수정(후속·동작영향 0, 필수 수정 없음):
- [recorders/route.ts L133] POST `tournamentForLog` 조회가 existing 분기 전 무조건 실행 — 409(이미 등록) 케이스는 adminLog 미실행이라 SELECT 1회 낭비. 드문 경로+1쿼리라 무해. 후속 미세 최적화.
- [recorders/route.ts L234] DELETE 대회명을 update 후 별도 findUnique. POST는 분기 전 조회 — 위치 비일관(minor). 동작/안전 영향 0.

## 수정 요청
| 요청자 | 대상 파일 | 문제 설명 | 상태 |
|--------|----------|----------|------|
| reviewer | tournament-completed-bracket.tsx (L274 qual 정렬) | [minor·후속] 조내 정렬 승수만 — 승점룰(gnba) 대회 미세 순위차 가능. 조별 동일경기수면 무해 | 후속 검토 |
| reviewer | admin/notifications/page.tsx | [minor·후속] `as FormEvent` 단언 안전하나 handleSubmit 시그니처 완화로 캐스팅 제거 가능. 동작 영향 0 | 후속 검토 |

## 완료 Phase (이력 압축)
- ✅ **PR-RECORDER-AUDIT 기록원 감사로그+admin_role 가시화 (2026-06-12, `a897b22`)** — 계기=수빈 "권한 해제" 의혹(실측 해제0·가시성 빈틈). 파트1: recorders/route.ts adminLog 3지점 add-only(assign신규/재활성화=info·remove=warning / 대회명·email 조회 / resourceId=tr.id·target=User / 응답shape불변). 파트2: /admin/users 관리자컬럼 admin_role 칩(recorder_admin="기록원관리자"/association_admin="협회관리자"/super_admin=ON중복생략) + select 2곳(page L98↔loadMore L278) drift0 + interface+getAdminRoleLabel. `admin-stat-pill data-tone="info"`. +92/-7. tester PASS5/5·reviewer APPROVE(c0/maj0/min2후속). 옵션 재배정=스킵(record01/02 이미 recorder_admin 전역권한). 역박제=skip(시안 구조 상이). minor2=route.ts 409 SELECT낭비·DELETE 조회위치 비일관(동작영향0)
- ✅ **①-b Phase 9C 운영 박제 (2026-06-12, `cb88c7a`+`8aeb050`+`b759d2d`)** — NU1/NU2/NA1 v2.29 박제 3PR(9C-2 search 스킵=이미 동등박제). 9C-1 nt-synced 동기화 배너(unreadCount 재사용·AppNav무변경) / 9C-3 messages "준비중" warn-soft 박스(mock·3컬럼·THREADS 0변경·DB미지원 carry) / 9C-4 admin 발송 UI(target 4chip·팀장=DB미지원 disabled 전송차단 2중가드·미리보기·확인모달·카테고리chip 생략·API/role/schema 0변경). +553/-141. tester PASS(정적·회귀10/10)·reviewer APPROVE(c0/maj0/min2). 팀장 전송차단·FormEvent 캐스팅 안전 판정. 잔여=3001 육안(미실행)
- ✅ **③ 대회종료 재구성 박제 B안 (2026-06-10~12, `ecca28d`+`7d6f89c`)** — 시안 v2(11) pill탭 완전재현. 신규5(stat-leaders.ts·stat-leaders-card·news-card·completed-bracket·operator-bar)+수정3(tournament-tabs +60·page.tsx종료분기 +180·completed.css +200)+역박제2. **격리전략=혼합**(탭/일정/팀/규정=TournamentTabs optional prop 재사용·NBA본선+예선=종료전용 신규복제). **진행중뷰 회귀0**(공유브래킷 diff0·진행중 호출부 무변경 3중확인). 0스키마·강조 cafe-blue·승자점수 bdr-red·배너 navy·mock0. NBA승자=winnerTeamId 직접비교+점수폴백(major1 해소). tester PASS·reviewer APPROVE
- ✅ **② 대회상세(진행중) 리스킨 (2026-06-10, `a9cb476`+`508325a`)** — pill탭·팀필터칩 cafe-blue·심판버튼제거·Hero compact. 강조색 7파일 cafe-blue 통일·승자점수 bdr-red 보존
- ✅ ① Phase 9 v2.29 sync (`fb81e53`) — 알림·메시지·검색 4시안 / carry-over diff0
- ✅ PR-MYBDR-SOCIAL (모바일 OAuth `72eb2df` PR#663) / Phase 8C (8시안) / Phase 1~7 (54시안)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-14 | **KO-9 결선 미생성 자동종료 오판 가드** (developer) | ✅ auto-complete.ts PURE isKnockoutFormat(full_league_knockout/group_stage_knockout) + checkAndAutoCompleteTournament에 format select·결선0건 early return(knockout-not-generated·console.warn). countKnockoutMatches(KO-1) 재사용. 신규 vitest 10/10·KO-2 10/10·nba 22/22·tsc0. +36/-1. 결선없는 format 회귀0(count미호출 검증). schema/v1 0 |
| 2026-06-14 | **KO Sprint1 결선중복방지 (KO-1/2/3)** (developer) | ✅ countKnockoutMatches(round_number/bracket_position/roundName OR) + assertSingleGroupForAutoKnockout(2개조 throw)/guardAutoKnockoutGroups. generator 4곳 가드·match route catch 가시화·bracket catch 가시화. 신규 vitest 10/10·nba회귀 9/9·tsc0. +128/-19 4파일+테스트. 기존실패4건=baseline무관(stash검증). schema/v1 0 |
| 2026-06-13 | **PR-PERM-DISPLAY 권한/구독 2축 분리** (pm) | ✅ `e98e611` admin-users-table 칼럼 라벨 역할→구독등급·관리자→운영권한(슈퍼관리자 err칩)·page 부제 4→MAX_SUPER_ADMINS(10). 옵션B·DB0·표시로직만·+12/-6·tsc0. 역박제skip·decisions+1. §0 lock 확인(transient·해소) |
| 2026-06-13 | **Phase 10 정보페이지 Claude.ai paste 준비 + 세션 정리** (pm) | ✅ 첨부4건 존재확인 + paste 메시지본체 추출. Claude.ai 1차 "첨부 미도착" 차단 → (A)실데이터 박제 결재 / drag-drop 4건 + 회신문구 제공. ③·9C·RECORDER 전부 머지 확인(미push0). scratchpad 정리 |
| 2026-06-13 | **PR-RECORDER-AUDIT 파트0 HOTFIX 기록원목록 snake_case 표시버그** (pm) | ✅ `e3d757e` tournament-admin recorders/page.tsx camelCase→snake_case 3곳(type/filter/제거). apiSuccess 변환함정 재발6회. tsc0·응답/body/route 무변경. +7/-5. errors+1 |
| 2026-06-12 | **PR-RECORDER-AUDIT 감사로그+admin_role 가시화** (dev/tester/reviewer/pm) | ✅ `a897b22`→#669→#670 main머지. recorders adminLog 3지점 + admin_role 칩. PASS5/5·APPROVE·lessons+1. +92/-7 |
| 2026-06-12 | **①-b Phase 9C 박제+검증+커밋** (developer/tester/reviewer/pm) | ✅ 9C-1/3/4 박제(9C-2 스킵)·tsc0·tester PASS·reviewer APPROVE·라우트별 3커밋(`cb88c7a`/`8aeb050`/`b759d2d`). 팀장 전송차단·mock유지·DB/api/role 0변경 |
| 2026-06-12 | **③ 대회종료 B안 박제 커밋** (pm) | ✅ `ecca28d`(feat 8파일 +1239/-53)+`7d6f89c`(역박제)+`4dbc833`(회고) |
| 2026-06-12 | **③ NBA 승자판정 견고화+재검증** (developer/tester·되돌림1회) | ✅ teamId 직접비교+점수폴백·major1 해소·진행중뷰 회귀0 |
