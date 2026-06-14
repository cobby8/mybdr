# 작업 스크래치패드

## 현재 작업
- **요청**: PR-MOCK-TO-REAL 버킷A 더미→실데이터 — **완료**
- **상태**: ①②③ main · **④ scrim `068341b`(머지 진행)** · ⑤ STOP(준비중 유지) · ⑥⑦ 이미 SV1/AW1서 처리. **PR-MOCK-TO-REAL 종료**
- **현재 담당**: pm

## 진행 현황표
| 작업 | 상태 |
|------|------|
| PR-MOCK-TO-REAL ④⑤ scrim/team-invite | ⏳ 진행 중(STOP가드: team_match_requests/team_join 의도 확인) |
| PR-MOCK-TO-REAL ⑥⑦ saved/awards | ⏳ 준비중 경계 정리(잔여) |
| PR-MOCK-TO-REAL ①②③ stats/calendar/about | ✅ main(`ee1a0c3`) |
| Phase12 Batch A/B 13화면 / PR-LINEUP-V2 / Phase10 5시안 | ✅ main 반영 |

## 기획설계 (planner-architect)
### 대회종료 후속 3종 통합설계 (2026-06-15, read-only)
- 🎯 ①우승팀 자동set ②Phase3 cron ③4차/열혈 결선흐름. 설계서=`Dev/tournament-completion-followup-plan-2026-06-15.md`. **코드·DB 0**.
- **우선순위/의존**: ①(中)→③(전제) / ②(小·독립·병렬) / ③(운영절차·코드0~소·①의존). 권장=①먼저+②병렬+③①머지후.
- **①핵심 실측**: `champion_team_id`=**Team.id** FK(schema L322/353)·SET코드 **0**(완전신규·회귀0) / `winner_team_id`=**TournamentTeam.id** FK(L746)→**tt.teamId 변환필수**(그대로넣으면 FK깨짐) / `finalizeMatchCompletion`(finalize-match-completion.ts L180)=모든 종료path5종 단일진입점→여기 통합(별도유틸/auto-complete내부❌). **옵션B채택**=신규 set-champion.ts(판정PURE+박제DB) + finalize서 autoComplete `updated:true`일때만 호출(낭비0). 포맷별: knockout계열(single_elim/full_league_knockout/group_stage_knockout/dual)=결승(roundName LIKE 결승/final/championship + next_match_id null폴백)승자 / round_robin·league=calculateLeagueRanking 1위 / group_stage다조=보류null. 멱등=이미있으면skip(권장·수동박제보호).
- **②핵심**: cron표준=Bearer CRON_SECRET+updateMany+admin_logs(stale-pending-fix 패턴 답습). WHERE=status NOT IN(TERMINAL completed/ended/closed/cancelled + NO_TIME_OVERRIDE draft/upcoming/final/preopen)+날짜경과(KST고정)+**매치0건(`matches:{none:{}}`)**★진짜대회 강제종료금지=생명선. ①과 교차0(매치0=우승없음·champion호출X). vercel.json `0 18 * * *`(KST03:00). 신규 `api/cron/auto-complete-tournaments/route.ts`.
- **③**: 코드0~소. ①머지후 4차결승#232(CBL vs ATLAS 0:0)/열혈SEASON2 결선 실경기를 **정규경로(score-sheet/Flutter sync)**로 박제→finalize자동→종료+champion자동. **직접DB UPDATE금지**(헬퍼우회=champion/standings/advance 누락 — errors.md sync우회 5회재발 패턴).
- **PM결재 7건**: ①-Q1멱등skip / ①-Q2 round_robin자동 / ①-Q3 group_stage다조보류 / ②-Q1주기03:00 / ②-Q2매치0한정확정 / ③-Q1운영일정 / 공통-진행순서(①+②병렬→③).

### 버킷B P1-a 코트 제보 승인 체계 실측+설계 (2026-06-15, read-only)
- 🎯 admin-plan §P1-a "court_submissions 신규" 정당성 + 기존 코트테이블 재사용 가능성 실측. 결과 = `Dev/court-submission-plan-2026-06-14.md`
- **결론: 신규 테이블 1개 ADD-only 필요(`court_submissions`)** — prefix-grep 함정 회피 위해 코트테이블 13개 전수 실측. 재사용 가능 테이블 없음(의도 불일치).
  - `court_edit_suggestions`(0행)·`court_reports`(0행) = **둘 다 court_info_id NOT NULL FK** → "아직 없는 코트" 못 가리킴. suggestion=기존코트 보정 / 제보=신규생성 = 반대방향. 억지매핑 시 FK위반. scrim(tmr 재사용)과 달리 **신규 테이블이 정답**.
  - **재사용 = 테이블 아닌 "흐름/코드"**: ① suggestions 승인 API(courts/[id]/suggestions/[sugId] PATCH)=pending→트랜잭션(court_infos반영+status+XP) **제보 승인 정확한 템플릿** ② /admin/courts에 **이미 수정제안·앰배서더 승인탭 완성** → "제보 검토" 4번째 동형탭 추가로 끝(신규화면0) ③ 승인INSERT=createCourtAction `court_infos.create` 패턴.
- **코트 메인 테이블 확정 = `court_infos`(672행 전부 active)**. `courts`(레거시)=**0행** 무시. 승인 시 court_infos.create.
- **schema diff**: court_submissions(name/region/court_type/address/operating_hours/fee_text/amenities[]/photos[]/description + status pending/approved/rejected + reviewed_by/at/note + approved_court_info_id) + User relation 2줄(submitter/reviewer — suggestion_submitter 선례 동형). CREATE1+INDEX2, ALTER/DROP 0, --accept-data-loss 불필요.
- **단계**: ①schema ADD(db diff 사용자검토후push) ②제출API POST/GET+폼실연결 ③승인큐 PATCH+admin탭 ④(선택)XP court_submit+알림 ⑤검증(tester+reviewer 병렬). 규모 中(+350~500). 위험 低.
- populated 실측: court_infos=672(active) / courts=0 / court_reports=0 / court_edit_suggestions=0. 임시 census script 작성→즉시삭제(가드3).

### PR-MOCK-TO-REAL ④/scrim ⑤/team-invite 실측+설계 (2026-06-15, read-only)
- 🎯 ④⑤ 더미→실데이터 연결 가능성 실측. 결과 = `Dev/scrim-teaminvite-realdata-plan-2026-06-14.md`
- **④ /scrim = 연결 가능(인프라 완성·데이터 0행)**: `team_match_requests`(L503) 실재+의도정합(from→to 친선/연습제안). 백엔드 GET(받은제안)/POST(생성+알림)/PATCH(수락·거절·취소) **완비**. **populated=0행** → mock복원❌·빈상태로 정직 와이어. 상대찾기탭만 모델부재=준비중. me/activity captainId패턴으로 내 운영팀 해소. 規模 中(+200~350). **사용자 결재 1건: (가)지금 인프라연결 vs (나)데이터 생길때 연결**.
- **⑤ /team-invite = STOP(억지매핑)**: `team_join_requests`(L2019) 238행 populated지만 **방향 반대**(유저→팀 가입신청 ≠ 시안 팀→유저 초대) + 토큰/만료/초대자/초대메시지 **필드 전무**. `TeamMemberRequest`(L3165) 6행=jersey/dormant/withdraw(초대무관). → 현행 준비중 유지가 정답. 연결=신규 TeamInvitation 테이블 필요(0스키마 위반·범위밖).
- populated 실측: tmr=0 / tjr=238(approved215/rej18/pend5) / tmreq=6. 임시 audit script 작성→삭제 완료(가드3).
(이전 완료 — 압축)

## 구현 기록 (developer)

### PR-AUTOCOMPLETE ② Phase3 cron 자동화 (2026-06-15, developer)

📝 구현: 종료일 경과 + **매치 0건** 대회를 매일 1회(KST 03:00) 자동으로 `status="completed"` 전환하는 cron. stale-pending-fix 패턴 답습(Bearer 가드 / findMany→updateMany 이중가드 / admin_logs audit / silent fail). schema 0 / api-v1 0 / champion·mvp 미접촉.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/api/cron/auto-complete-tournaments/route.ts` | GET — Bearer CRON_SECRET 가드 / `kstMidnightUtc()` PURE 경계 / findMany(매치0+status NOT IN) → 코드필터((endDate??startDate)<경계, 둘다null제외) → updateMany(status=completed, 매치0+status 재가드) / admin_logs createMany(action=auto_complete_tournament_cron, silent) | 신규 |
| `vercel.json` | crons 배열에 `{path:/api/cron/auto-complete-tournaments, schedule:"0 18 * * *"}` 추가(기존 10건 보존) | 수정 |
| `src/__tests__/cron/auto-complete-tournaments.test.ts` | kstMidnightUtc 5케이스(KST새벽/자정직후/자정직전/당일보호/어제처리) | 신규 |

★ **매치0 생명선(`tournamentMatches: { none: {} }`)**: findMany + updateMany **둘 다** 가드(race 방지). 진짜 경기 진행 대회는 절대 강제종료 안 함 — ①(우승팀 set)과 교차 0(매치0=우승 없음→champion 미호출).

★ **KST 경계 정확(당일 보호)**: `kstMidnightUtc(now)` = KST 오늘 00:00의 UTC 값. `(endDate ?? startDate) < 경계` = "어제(KST)까지 종료"만 대상. 당일 종료 대회는 미처리(보호). endDate/startDate 둘 다 null = 판단 불가→제외.

EXCLUDED_STATUSES = completed/ended/closed/cancelled(TERMINAL) + draft/upcoming(진행 전). champion_team_id/mvp_player_id는 updateMany data에 미포함 → 절대 미접촉. admin_logs.resource_id/target_id는 BigInt? 컬럼인데 tournament.id=UUID(String)라 null 처리, UUID는 changes_made.tournament_id에 박제(audit 추적 가능).

💡 tester 참고:
- 단위테스트: `npx vitest run src/__tests__/cron/auto-complete-tournaments.test.ts` → 5 PASS
- build: `npm run build` → ✓ Compiled successfully / 신규 route `ƒ /api/cron/auto-complete-tournaments` 등록 확인
- 정상: 매치0 + 종료일 어제경과 대회만 completed. 진짜 경기 대회(매치≥1)·당일종료·draft/upcoming은 미처리. 대상 0건→200 idle.
- 주의: Bearer 불일치→401. local 호출 시 `Authorization: Bearer $CRON_SECRET` 필요.

⚠️ reviewer 참고:
- ★ 매치0 가드(none:{})가 findMany+updateMany 둘 다 있는지(race) / champion·mvp 미접촉 확인.
- kstMidnightUtc 경계 — 당일 보호(< 비교) 정확성. SSR 23:59 버퍼 아닌 KST 자정 고정(Phase1 minor 지적 반영).
- 멀티세션 제약: cron route + vercel.json + 테스트만 접촉. finalize/auto-complete/set-champion(①)·디자인 미접촉.
- 참고: 동시 진행 중인 court-submission 세션이 `admin-courts-content.tsx`(SubmissionsReviewTab) 수정 중 — 본 작업과 무관(build 타이밍에 따라 그 파일 에러가 보일 수 있으나 ② 파일은 무영향).

### P1-a 코트제보 승인 체계 (2026-06-15, developer)

📝 구현: `/courts/submit` 정적폼(noop)→실제 제보 INSERT + `/admin/courts` "제보 검토" 탭(승인 시 court_infos 생성). 3단계 분리커밋. court_edit_suggestions 승인 패턴 답습.

| 파일 | 변경 | 신규/수정 | 단계 |
|------|------|----------|------|
| `prisma/schema.prisma` | court_submissions 모델 ADD + User relation 2줄(submitter/reviewer) | 수정 | [1] |
| `api/web/courts/submissions/route.ts` | POST(getWebSession+Zod→pending INSERT) / GET(본인내역+승인count, IDOR방지) | 신규 | [2] |
| `(web)/courts/submit/_form/court-submit-form.tsx` | noop alert→fetch POST+검토중 완료화면. 시안.fm-* 보존, court_type 한글→영문키 매핑 | 수정 | [2] |
| `api/web/admin/court-submissions/[subId]/route.ts` | PATCH super_admin. 승인=트랜잭션(court_infos.create+approved+reviewed_by/at+approved_court_info_id+XP)/반려=rejected+note | 신규 | [3] |
| `(admin)/admin/courts/page.tsx` | pending submissions 조회+직렬화 | 수정 | [3] |
| `(admin)/admin/courts/admin-courts-content.tsx` | "제보 검토" 4번째 탭(SubmissionsReviewTab) — 수정제안/앰배서더 동형 | 수정 | [3] |
| `lib/constants/gamification.ts` | XP_REWARDS.court_submit=10 | 수정 | [3] |

- schema diff: CREATE 1 + INDEX 2 + FK 2, ALTER/DROP 0(무중단). db push 완료·count 0 검증.
- 승인 INSERT 매핑: region→city/district 분리 / court_type 3x3→outdoor+court_size="3x3" / amenities→facilities(Json) / photos[0]→photo_url+나머지 metadata / 기본좌표 서울시청(관리자 보정 전제) / fee_text·operating_hours→metadata 보존.
- tsc 3단계 전부 PASS. 미푸시 커밋 3건.

💡 tester 참고:
- 테스트: 로그인 계정으로 /courts/submit 제보 제출→"제보가 접수되었습니다" 완료화면. super_admin으로 /admin/courts "제보 검토" 탭→승인 시 court_infos 생성+코트관리 탭에 노출+제보자 XP+10. 반려 시 court 생성0.
- 정상: POST 201(snake_case 응답 id/status) / 승인 후 router.refresh로 큐에서 사라짐 / 중복승인 차단(pending만 조회).
- 주의 입력: 비로그인 제출→401 인라인안내 / 빈 이름·주소→422 / court_type=3x3 승인→court_infos.court_type=outdoor+court_size=3x3 확인.

⚠️ reviewer 참고:
- 승인 트랜잭션 내 court_infos.create + submission.update + addXP 3개 원자성. adminLog만 트랜잭션 외(실패해도 승인 영향0).
- region 단순 split(첫토큰=city). "서울 중구"→city=서울/district=중구. 복합지역명 보정은 관리자 코트수정으로.
- 신규 API web전용(api/v1 0) / 신규 admin화면 0(탭 append) / 하드코딩hex·lucide·9999 0 / 기존 court 흐름 무변경.

### PR-CHAMPION ① 우승팀 자동 set 유틸 (2026-06-15, developer)

📝 구현: 대회 자동종료(checkAndAutoCompleteTournament updated:true) 순간에 우승팀을 산출해 `tournament.champion_team_id` 자동 박제. schema 0 / api-v1 0. 옵션B(신규 set-champion.ts + finalize 통합).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/set-champion.ts` | `isFinalsRound()` PURE + `resolveChampionTeamId()` + `setTournamentChampion()`(멱등) | 신규 |
| `src/lib/tournaments/finalize-match-completion.ts` | import 1줄 + autoComplete `updated:true` 분기에 setTournamentChampion 호출(try-catch 격리) | 수정 |
| `src/__tests__/lib/tournaments/set-champion.test.ts` | 11 케이스(isFinalsRound PURE·knockout결승→FK변환·roundName없음 폴백·round_robin 1위·다조 null·결승없음 null·멱등 skip·set·no-champion·not-found) | 신규 |

★ FK 변환(핵심): `winner_team_id`/`calculateLeagueRanking.tournamentTeamId` = **TournamentTeam.id** → `tt.teamId`(=Team.id)로 변환 후 `champion_team_id`(Team.id FK)에 박제. 그대로 넣으면 FK 깨짐 — `tournamentTeamToTeamId()` 1단계 변환 강제.

포맷별 판정: knockout(single_elimination/full_league_knockout/group_stage_knockout/dual_tournament)=결승 roundName(isFinalsRound)+winner NOT NULL, scheduledAt desc 1순위 → 폴백 next_match_id null+round_number 최대 / round_robin·league=ranking rank===1 / group_stage 다조=null 보류.

멱등: setTournamentChampion 진입 시 champion_team_id NOT NULL → skip(수동 박제 보호). mvp_player_id 절대 미접촉. finalize 호출은 updated:true(방금 종료)일 때만 → 매 매치 호출 낭비 0. try-catch 격리로 우승팀 산출 실패가 종료 흐름 차단 0(console.error만).

💡 tester 참고:
- 단위테스트: `npx vitest run src/__tests__/lib/tournaments/set-champion.test.ts` → 11 PASS
- tsc: `npx tsc --noEmit` → EXIT 0
- 정상: knockout 대회 마지막 매치 종료 시 결승 승자(TournamentTeam) → 그 팀의 Team.id가 champion_team_id에 자동 박제. 이미 champion 박제된 대회 재종료 시 skip.
- 주의 입력: group_stage 다조 대회는 우승 보류(null) — 자동 박제 안 됨(의도). 결승 미정(winner null)도 null.

⚠️ reviewer 참고:
- ★ FK 변환 누락 여부 집중 검토: champion_team_id=Team.id인데 winner_team_id=TournamentTeam.id. resolveChampionTeamId 반환값이 항상 tt.teamId 경유인지.
- finalize 통합 위치: autoComplete `updated:true` 분기 내부(매 매치 호출 아님)·try-catch 격리(종료흐름 차단 0).
- 멀티세션 제약 준수: set-champion.ts/finalize/테스트만 접촉. cron route·vercel.json(②)·디자인 미접촉.

### PR-MOCK-TO-REAL ④ scrim (2026-06-15, developer)

📝 구현: /scrim 더미(OPEN_REQS/INCOMING/OUTGOING/HISTORY) 전량 제거 → team_match_requests 실데이터 와이어. 0스키마/0신규라우트(기존 API+모달 재사용).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `scrim/page.tsx` | server component 재작성: getWebSession 인증→내운영팀(captainId 1순위+role fallback)→받은(to=내팀)/보낸(from=내팀)/지난(accepted·rejected·cancelled) prisma 직접조회→ScrimTabs 전달. 빈상태 3분기(비로그인/운영팀없음/0건) | 수정 |
| `scrim/_components/scrim-tabs.tsx` | 신규 "use client" 4탭(받은=수락/거절 PATCH·보낸=취소 PATCH·지난=읽기·상대찾기=준비중+/teams). router.refresh 동기화. snake_case 접근(counterpart/primary_color/preferred_date) | 신규 |
| `globals.css` | `.sc-*` 27규칙 추가(시안 extras-pages.css 역박제, 토큰 var(--*), 쉼표 구분→조기종료0) | 수정 |

설계 차이: 상대찾기탭은 스크림 추천모델(레이팅 자동매칭) DB 부재 → 준비중+/teams 링크로 정직 와이어. 제안 보내기 자체는 팀상세 매치신청 모달(team-match-request-modal) 기존 경로 유지. 인터랙션 액션 경로 [id]=내팀(받은 수락/거절은 to_team=내팀, 보낸 취소는 from_team=내팀) — 기존 PATCH 권한가드 정합.

💡 tester 참고:
- 테스트: 로그인+운영팀 보유 계정으로 /scrim 접속. team_match_requests 0행이면 4탭 전부 빈상태(정상). 비로그인→로그인안내 / 운영팀없음→"팀 운영자만".
- 정상: 받은 제안 수락/거절·보낸 제안 취소 시 router.refresh로 즉시 지난기록 이동. tsc --noEmit PASS / postcss .sc-* 25규칙 파싱 에러0.
- 주의 입력: tmr 0행 환경 → 인터랙션은 더미생성 없이 빈상태만 검증 가능(MONKEYZ 더미 복원❌). 실제 PATCH 테스트는 행 생성 후.

⚠️ reviewer 참고:
- 내 운영팀 "1개 대표선택"(captainTeam findFirst→없으면 manager membership). 다팀 운영자는 첫 팀만 노출 — 의도(스크림=팀단위, 팀선택 UI는 범위밖).
- 지난기록 counterpart = "내가 아닌 쪽"(iAmReceiver 분기). 받은/보낸 모두 OR 조회 take:50.
- 신규 API 0 / api/v1 0 / 하드코딩hex·lucide·9999·폐기--color- 0.

### Phase 1 대회 상태 표시 레이어 (2026-06-15, developer)

📝 구현: DB status가 in_progress/published로 박제된 채 종료일만 지난 대회를 **라벨 표시 단계에서만** "종료"로 보정. DB/CTA(접수) 로직 0 변경.

핵심 = `effectiveTournamentStatus(status, startDate, endDate)` 신규 (tournament-status.ts).
- 규칙: ①종료/취소(TERMINAL) 원본보존 ②draft/upcoming/FINAL/PREOPEN 보정제외 ③그외 종료일(end??start) 당일 23:59:59 경과 시 "completed" ④날짜 둘다 null 원본보존. Invalid Date도 원본보존.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/constants/tournament-status.ts` | effectiveTournamentStatus + TERMINAL/NO_TIME_OVERRIDE 가드 추가 | 수정 |
| `_components/v2-tournament-list.tsx` | deriveV2Status 진입부 eff 적용 | 수정 |
| `[id]/_components/tournament-hero.tsx` | statusLabel/badge eff 적용(prop 기보유) | 수정 |
| `[id]/_components/v2-tournament-hero.tsx` | statusLabel eff 적용(prop 기보유) | 수정 |
| `[id]/_components/v2-registration-sidebar.tsx` | startDate/endDate prop 신규+statusLabel eff(CTA 미접촉) | 수정 |
| `[id]/page.tsx` L1051 | V2RegistrationSidebar에 start/end 전달 | 수정 |
| `components/tournaments/registration-sticky-card.tsx` | start/end **optional** prop+폴백(미렌더 컴포넌트) | 수정 |
| `_components/calendar-view.tsx` | 선택날짜 목록 라벨 eff 적용 | 수정 |
| `_components/week-view.tsx` | 칼럼 라벨 eff 적용 | 수정 |
| `site-templates/classic.tsx` | statusLabel()에 start/end 인자+2호출부 전달 | 수정 |
| `__tests__/lib/effective-tournament-status.test.ts` | 8케이스 단위테스트 | 신규 |

조사 vs 지시문 차이: tournament-hero / v2-tournament-hero는 이미 start/end prop 보유 → prop 추가 없이 적용만. v2-registration-sidebar만 prop 신규.
미수정(의도): profile tournaments-section(start/end 데이터 없음)·admin 화면(raw 유지).

💡 tester 참고:
- 단위테스트: `npx vitest run src/__tests__/lib/effective-tournament-status.test.ts` → 8 PASS
- build: `npm run build` → ✓ Compiled successfully (ads/heatmap dynamic-server 로그는 기존 무관)
- 정상: 종료일 지난 in_progress 대회 라벨이 목록/상세/캘린더/주간/site에서 "종료"로 표시. CTA 버튼 동작은 종전 그대로(isRegistrationOpen 미접촉).
- 주의 입력: 종료일 "오늘"인 대회는 보정 안 됨(당일 진행). draft/cancelled는 과거여도 라벨 유지.

⚠️ reviewer 참고:
- 시간 의존 유틸 — 테스트는 Date.now() 상대 오프셋으로 안정화(고정날짜 미하드코딩).
- classic.tsx statusLabel() 시그니처 변경(optional 인자) → 기존 2호출부만 영향, 외부 import 없음 확인.
- DB/prisma/schema 0. registration-sticky-card는 현재 미렌더(import만) — 안전.

(이전 — 압축)

## 테스트 결과 (tester)

### 버킷B P1-a 코트 제보 승인 체계 검증 (2026-06-15, tester) — 미push 3커밋(d86bbc5/a20cdd0/abef30c)

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1a. git diff --stat 3커밋 | ✅ 통과 | 7파일 842+/108- (schema+API2+폼+admin page/content+gamification). 변경파일=지시문 명세와 정합 |
| 1b. `npx tsc --noEmit` | ✅ 통과 | EXIT 0 (에러 0). taskkill node 미사용 |
| 2a. schema ADD-only(ALTER/DROP 0) | ✅ 통과 | diff 삭제(-)라인 0건. court_submissions CREATE1+INDEX2(status+created_at / user_id)+FK2(submitter/reviewer). User relation 2줄 추가(court_edit_suggestions 동형). 기존 court_infos/court_edit_suggestions/court_reports 모델 변경 0 |
| 2b. count 실측 | ✅ 통과 | court_submissions=**0**(정상) / court_infos=672(무영향) / court_edit_suggestions=0 / court_reports=0. byStatus=[]. 임시census script 작성→즉시삭제(가드3) |
| 3a. POST 가드(401/422/pending INSERT) | ✅ 통과 | getWebSession null→401 UNAUTHORIZED / Zod safeParse 실패→422 VALIDATION_ERROR(name/region/court_type enum/address min1) / 통과시 status=pending 기본값 INSERT. 응답 apiSuccess({id,status},201) |
| 3b. 본인 내역 GET + IDOR | ✅ 통과 | where:{user_id} 본인 한정. my_submissions(snake) + approved_count 병렬. 401 가드 |
| 3c. "검토 중" 안내 | ✅ 통과 | 폼 submitted state→"제보가 접수되었습니다"+"운영팀 검수(2~3일)" 완료화면. noop alert 제거→실제 fetch POST |
| 4a. 승인 트랜잭션 | ✅ 통과 | $transaction: court_infos.create + submission.update(approved+reviewed_by/at+approved_court_info_id) + addXP(court_submit=10). adminLog만 트랜잭션 외(승인영향0). 반환 court_info_id |
| 4b. 반려(court 0/XP 0) | ✅ 통과 | action=reject→update status=rejected+review_note만. court_infos.create 0 / addXP 0. adminLog reject |
| 4c. super_admin 가드 | ✅ 통과 | session.role!=="super_admin"→403 FORBIDDEN(suggestions/ambassadors 동일패턴) |
| 5. snake_case 정합 | ✅ 통과 | POST/GET 응답 apiSuccess 경유(키 snake 변환)·GET 응답키 my_submissions/approved_count snake. admin handleAction은 res.ok+err.error만 읽음(데이터필드 미접근)→snake함정 회피. body 요청키(action/review_note)는 route 기대키와 정합 |
| 6a. 중복 승인 차단 | ✅ 통과 | findFirst where:{id, status:"pending"}→이미 처리시 404 NOT_FOUND. admin page도 pending만 조회 |
| 6b. 3x3→outdoor 매핑 | ✅ 통과 | mapCourtType: indoor→indoor / 3x3→outdoor+court_size="3x3" / outdoor→outdoor. court_size schema 실존 |
| 7a. api/v1 변경 0 | ✅ 통과 | git diff src/app/api/v1/ = 0건 |
| 7b. 기존 admin courts 탭 무변경 | ✅ 통과 | 수정제안/앰배서더 탭 로직 무변경. "제보 검토" 4번째 탭 append(courts/submissions/suggestions/ambassadors) |
| 7c. lucide 0 | ✅ 통과 | 폼/admin 모두 Material Symbols Outlined만. lucide import 0 |
| 7d. court_infos 필드 정합 | ✅ 통과 | PATCH create 필드(city/district/lat/lng/court_type/facilities/status/photo_url/metadata/court_size 등) 전부 schema 실존(tsc 0 보증) |
| 8. count populated 증빙 | ✅ 통과 | 항목 2b 실측. court_submissions=0행이라 런타임 승인 미재현(0행=정상·박제전 상태) |

📊 종합: **18개 항목 전부 통과 / 0 실패**. schema ADD-only·count0·401/422/403 가드·승인트랜잭션·반려·중복차단·3x3매핑·snake정합·api-v1 0·기존탭 무변경 모두 정상.

⚠️ 참고(동작영향 0, 후속 권장):
- **하드코딩 #fff 3건**(admin-courts-content.tsx L543/732/889 승인버튼 color:"#fff"). baseline에 2건(L543/732) 선존재→신규 제보탭 L889가 동일패턴 답습. CLAUDE.md 하드코딩hex 금지엔 걸리나 기존 3버튼 일관성. 신규만의 신규위반 아님→토큰화 후속 검토.
- **런타임 승인 실거동 미재현**: court_submissions 0행이라 실제 POST→승인 트랜잭션(court_infos INSERT+XP) end-to-end 미실행. 코드/스키마 정합은 전수 확인. 1건 제출 후 승인 실거동 1회 확인 권장(0행 정상이므로 차단요소 아님).

### PR-MOCK-TO-REAL ④ scrim 실연결 검증 (2026-06-15, tester)

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. git diff 실변경 + 신규 라우트 0 | ✅ 통과 | src 변경 = scrim/page.tsx(수정) + scrim-tabs.tsx(신규) + globals.css(+33). scrim 하위 route.ts 0건(Glob) |
| 2. `npx tsc --noEmit` | ✅ 통과 | EXIT 0 (에러 0) |
| 3. mock 0 (더미상수 grep) | ✅ 통과 | OPEN_REQS/INCOMING/OUTGOING/MONKEYZ = **주석 내 제거설명만**. HISTORY_STATUSES는 status분류 상수(더미❌). 더미데이터 상수 0 |
| 3b. team_match_requests 0행→가짜0 아님 | ✅ 통과 | count **0** 실측. 0행이면 4탭 전부 빈상태로 정직 와이어(mock 복원❌) |
| 4. 빈상태 3분기 | ✅ 통과 | 비로그인→lock "로그인 필요"(L57) / 운영팀없음→groups "팀 운영자만"(L117) / 0건→탭별 EmptyState(받은inbox·보낸send·지난history·찾기handshake준비중) |
| 5. 인터랙션 API 재사용·신규라우트0 | ⚠️ 부분 | 수락/거절/취소=기존 PATCH match-request/[reqId] 재사용·router.refresh 갱신 ✅. 단 **보낸취소 [id] 불일치 잠재결함** (아래 수정요청) |
| 6. snake_case 정합 | ✅ 통과 | from_team/to_team/preferred_date/counterpart 정합. primaryColor=Prisma camel(@map primary_color)→응답 primary_color 정규화 정합 |
| 7. 강조색 cafe-blue·하드코딩0 | ✅ 통과 | ex-mono--blue=var(--cafe-blue). scrim/globals.css .sc블록 hex·lucide·9999·폐기--color 0 |
| 8. postcss 실파서 | ✅ 통과 | postcss.parse OK 1757규칙·.sc-* 25규칙 인식. `*/`조기종료0(errors06-14 재발0) |
| 9. count 실측 증빙 | ✅ 통과 | team_match_requests total **0** / by status []. 임시스크립트 작성→즉시삭제(가드3) |
| 10. 회귀(team-invite/api-v1/타페이지) | ✅ 통과 | src 변경 2파일뿐. team-invite·api/v1 diff 0. globals.css는 append만(.sc-* 신규클래스) |

📊 종합: **9 PASS / 1 부분(⚠️)** — 더미 전량 제거·실데이터 와이어·빈상태 3분기·0스키마·0신규라우트·tsc0·postcss0 모두 정상. 단 보낸제안 취소 경로 [id] 불일치 잠재결함 1건(0행이라 런타임 미재현·후속 확인 권장).

⚠️ 발견(검증항목 5) — **보낸 제안 취소 시 PATCH [id] 불일치 가능성**:
- scrim-tabs L295 `patchStatus(myTeamId, ...)` → 취소도 url `[id]=myTeamId(보낸팀=from_team)` 전달.
- 그러나 PATCH 라우트 [reqId]/route.ts **L85** `if (matchRequest.to_team_id !== toTeamIdFromUrl) return 400`. 보낸 제안은 to_team=상대팀이라 myTeamId(from_team)와 불일치 → **400 "경로가 올바르지 않습니다" 반환** 가능.
- 받은 제안(수락/거절)은 to_team=myTeam이라 정합 ✅. **취소 경로만** url에 to_team_id(상대팀)를 넣어야 L85 통과. team_match_requests 0행이라 런타임 재현 불가 → 행 생성 후 보낸제안 취소 실거동 확인 또는 라우트 L85 취소분기 예외처리 필요.

### Phase 1 대회 상태 표시 레이어 검증 (2026-06-15, tester)

| 테스트 항목 | 결과 | 비고 |
|-----------|------|------|
| `npm run build` (TS strict) | ✅ 통과 | `✓ Compiled successfully in 21.9s` / 158 페이지 생성. ads·heatmap dynamic-server 로그는 기존 무관 |
| 단위테스트 8케이스 (`effective-tournament-status.test.ts`) | ✅ 8/8 | published어제→completed / 내일→published / 오늘→published(당일미종료) / in_progress 2년전→completed / cancelled과거→cancelled / draft과거→draft / end null+start과거→completed / 둘다null→원본 |
| effectiveTournamentStatus 로직 (TERMINAL/NO_TIME_OVERRIDE 가드·end??start·23:59:59 경과·Invalid Date 폴백) | ✅ 통과 | 코드 L103~142 규칙1~4 + isNaN 폴백 확인. lower 비교로 대문자 FINAL/PREOPEN 포함 |
| ★ CTA 미접촉 (v2-registration-sidebar) | ✅ 통과 | CTA 분기는 `isRegistrationOpen` 그대로(L259/275). 보정 effStatus는 disabled 버튼 라벨 텍스트(L294)에만 사용. isRegistrationOpen 변경 0 |
| ★ admin 제외 | ✅ 통과 | `(admin)/` 디렉토리 내 effectiveTournamentStatus 적용 0건. 적용 9파일 전부 (web)/components/site-templates 측 |
| (c2) sticky-card optional+폴백 | ✅ 통과 | `startDate?/endDate?` optional, 미전달 시 둘다 null→원본 라벨 폴백. 미렌더 컴포넌트 |
| (d3) profile tournaments-section 미수정 | ✅ 통과 | git diff에 profile 변경 0 (raw 유지) |
| classic.tsx statusLabel() 시그니처 | ✅ 통과 | start/end optional 인자 추가, 2호출부(L547/711) 모두 전달. 외부 import 없음 |
| 회귀: 전체 vitest (1121 tests) | ✅ 통과(Phase1 무관 실패 제외) | 1117 pass / 4 fail. **4 fail은 Phase1 변경분 stash 후 baseline에서도 동일 재현 = 사전 존재 실패** (tournament-delete 3 + running-score-helpers 1, Phase1 변경파일과 무접점) |

📊 종합: 9개 항목 전부 통과 / 0 실패. Phase 1 변경(상태 라벨 보정 레이어)은 의도대로 동작하며 회귀 영향 0.

⚠️ 참고(Phase 1 무관): 전체 회귀 중 사전 존재 실패 2파일 4건 발견 — `tournament-delete.test.ts`(3), `running-score-helpers.test.ts`(1, team_side home/away 정합). Phase 1 변경분을 stash한 baseline에서도 동일 실패 → 본 작업 책임 아님. 별도 후속 처리 대상.

## 리뷰 결과 (reviewer)

### 버킷B P1-a 코트 제보 승인 체계 (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 3) — 미push 3커밋(d86bbc5 schema / a20cdd0 제출 / abef30c 승인큐)

✅ 잘된 점:
- **트랜잭션 원자성 정확**: 승인 = `$transaction(tx.court_infos.create + tx.court_submissions.update)` 두 핵심 쓰기가 tx 원자. court_infos 필수 NOT-NULL 컬럼(user_id/name/address/city/latitude/longitude/created_at/updated_at) **전부 매핑** → 누락 throw 0. court_type는 default 보유. adminLog는 트랜잭션 외(실패 격리) — 적정.
- **권한 가드(IDOR) 안전**: 제출 POST=getWebSession user_id 본인 강제(클라 신뢰 0) / GET=`where:{user_id}` 본인 내역만(IDOR 차단) / 승인 PATCH=`session.role !== "super_admin"` 403 — 기존 suggestions/[sugId] route와 동일 패턴. 남의 제보 조작·비인가 승인 불가.
- **snake_case 정합**: API 응답키 전부 snake(id/status/my_submissions/approved_count/court_info_id) → apiSuccess convertKeysToSnakeCase 멱등. apiError `{error}` ↔ 폼·admin `.error` 접근 일치. admin 탭은 GET API 미경유(page.tsx server camelCase props 직접) — 혼동 0.
- **schema 무중단**: court_submissions CREATE 1 + INDEX 2 + FK 2(submitter/reviewer NoAction). User relation 2줄(court_edit_suggestions 선례 동형). ALTER/DROP 0. 기존 테이블 영향 0. db push 완료·count 0 검증됨.
- **데이터 매핑 적정**: 3x3→outdoor+court_size="3x3" 보존 / amenities→facilities(Json) / photos[0]→photo_url+나머지 metadata / fee_text·operating_hours metadata 보존(손실 0) / 기본좌표 서울시청(관리자 보정 전제·명시 주석). region 첫토큰=city 단순화는 허용 범위(복합지역명은 관리자 코트수정 보정).
- **중복 승인 가드**: findFirst `status:"pending"` → 이미 처리된 건 404. 422 검증(Zod enum 화이트리스트 court_type/amenities, max 길이). 토큰 청결(하드코딩 hex `#fff`는 동파일 기존 SuggestionsTab/AmbassadorsTab L543/732와 동일 success버튼 패턴 = 기존 컨벤션 / lucide 0 / 9999 0). tsc --noEmit EXIT 0.

🟡 권장 수정 (minor, 동작영향 낮음·전부 후속):
- **[XP 트랜잭션 밖 — 기존 패턴 답습]** `addXP(submission.user_id, ...)`가 `$transaction` 콜백 안에 있으나 **내부적으로 모듈 `prisma`(tx 아님) 사용**(gamification.ts L61) → XP 쓰기는 사실상 트랜잭션 외. 단 addXP는 자체 try/catch로 throw 0(유저 부재 시 null 반환)이라 court+submission 롤백 유발 0. **기존 court_edit_suggestions 승인 라우트(L99)도 100% 동일** → 본 PR 신규 결함 아닌 기존 컨벤션 답습. 영향: 승인은 원자, XP는 best-effort(낙오 시 코트는 생성됨). 엄밀 원자화하려면 addXP에 tx 주입 옵션 필요(전역 후속, 본 PR 범위밖).
- **[중복 승인 race(이론)]** `status:"pending"` findFirst 가드는 1차 방어. `approved_court_info_id`/status에 unique 제약 없어 **두 관리자 동시 승인 시 양쪽 findFirst 통과→court 2건 생성 이론상 가능**. super_admin 동시클릭 확률 극히 낮음·실해 적음(중복 코트는 관리자 삭제). 필요 시 update `where:{id, status:"pending"}` 조건부 1행 가드로 강화 가능(후속).
- **[GET 엔드포인트 미사용]** `/api/web/courts/submissions` GET(my_submissions/approved_count)은 현재 프론트 소비처 0(폼은 POST만). 향후 "내 제보 내역" UI용 선반영 — 데드코드 아님(의도). 지금은 검증 불가(소비처 생길 때 snake 접근 재확인).

미수정 결정 타당성:
- 사진 업로드 미동작(photos=[] 전송) → dropzone UI 자리만, 시안 보존 = **타당**(업로드 인프라 후속).
- region 첫토큰=city 단순화("경기 하남시"→city=경기/district=하남시) → 복합지역은 관리자 보정 전제 = **타당**.
- 기본좌표 서울시청 → createCourtAction 패턴 답습·승인 후 지도 보정 전제 = **타당**.
- 신규 admin 화면 0(4번째 탭 append)·api/v1 0·기존 court 흐름 무변경 = **타당**.

(※ 본 항목은 P1-a 코트제보 한정. scrim/Phase1 항목과 무관)

### PR-MOCK-TO-REAL ④ /scrim (2026-06-15, reviewer)

📊 종합 판정: **CHANGES** (critical 1 / major 0 / minor 4)

✅ 잘된 점:
- 더미 전량 제거·실데이터 와이어 정직: OPEN_REQS/INCOMING/OUTGOING/HISTORY 복원 0. tmr 0행=4탭 전부 빈상태. MONKEYZ 등 가짜 복원 0. 상대찾기=레이팅모델 부재→준비중+/teams(억지매핑 0).
- snake_case 정합 정확: server prisma(camel: primaryColor/from_team)를 page.tsx 매핑부에서 명시적 snake(primary_color/counterpart)로 직렬화 → client 접근자 일치. 혼동 0. proposer relation(team_match_requests_proposer) schema L516 정합.
- IDOR 안전: 액션은 client 권한 신뢰 0 — 서버 PATCH가 captain/proposer 재검증. 빈상태 3분기(비로그인/운영팀없음/0건) + ScrimShell 공용 셸.
- 토큰/postcss 청결: .sc-* 전부 var(--*)·쉼표구분·조기종료 0. var(--danger)(L59)/--ink-dim/--ff-mono/--r-md/cafe-blue/ex-badge--*/ex-mono--* 전부 globals.css 실존. lucide/9999/하드코딩hex 0. tsc --noEmit PASS.
- 에러 핸들링: fetch try/catch + json parse catch + busyId finally 리셋. 중복클릭 busyId 가드.

🔴 필수 수정 (critical — 행 생기면 100% 실패):
- **[scrim-tabs.tsx L295 보낸 제안 "취소" 버튼]** `patchStatus(myTeamId, r.id, "cancelled")` 호출이 URL `[id]=myTeamId(=from_team)`을 보냄. 그러나 PATCH route.ts **L85 경로검증은 status 무관하게 `URL[id] === to_team_id` 를 강제** → 보낸제안은 to_team=상대팀이므로 `to_team_id(상대) !== myTeamId(내팀)` → **400 "매치 신청 경로가 올바르지 않습니다."로 항상 실패**. (권한가드 L113~136은 from_team 기준이 맞으나 그 앞단 경로검증을 통과 못 함 — developer가 경로검증 단계를 놓침). **수정**: 취소 호출 [id]를 to_team(상대팀) id로 = `patchStatus(r.counterpart.id, r.id, "cancelled")`. outgoing.counterpart=to_team(page.tsx L220) 이므로 counterpart.id가 정답. (counterpart null 가드 추가 권장). ※ tmr 0행이라 런타임 미검출됐을 뿐, 행 생성 시 확정 재현.

🟡 권장 수정 (minor):
- [page.tsx L86~114 운영팀 식별 vs PATCH 가드] 받은제안 수락/거절 API 가드(L97~112)는 **team_members role="captain" active 만** 인정(captainId fallback 없음). page.tsx는 captainId 1순위로 운영팀 선택. 정상 팀생성은 트랜잭션으로 captainId+team_members captain 동시생성(actions/teams.ts L81/91)이라 일치하나, **팀장 위임(transfer/양도)으로 captainId만 갱신되고 team_members role 미동기 케이스 시** page는 운영팀으로 보이나 수락/거절이 403. vice/manager는 받은제안 수락/거절 자체 불가(API가 captain only) — page에선 버튼 노출되나 403. 후속: API 가드를 isCaptain 헬퍼(teams/[id]/route.ts L30, captainId OR role) 패턴으로 통일 검토.
- [scrim-tabs.tsx L184~188 errMsg] 탭 전환 시 errMsg 미클리어 → 한 탭 에러 후 다른 탭에 잔류. setTab에서 setErrMsg(null) 권장.
- [scrim-tabs.tsx L228~243 받은제안 거절 버튼] 로딩 텍스트 미표기(수락만 "처리 중"). 거절도 busyId일 때 표기 일관성(선택).
- [scrim-tabs.tsx L102~105] useState 초기값 주석("받은 제안 있으면 첫 탭")과 실제(항상 incoming 고정) 불일치 — 주석 정리(동작은 정상).

미수정 결정 타당성:
- 다팀 운영자 첫 팀만 노출(captainTeam findFirst orderBy id asc) → 스크림=팀단위, 팀선택 UI 범위밖 = **타당**.
- take:50 한도 → 지난기록 과다누적 방지, updated_at desc 최신순 = **타당**.
- 상대찾기 준비중 → 레이팅 추천모델 DB 부재, 제안은 팀상세 모달 경로 유지 = **타당**.
- 0신규라우트/0스키마 — 기존 PATCH/POST 재사용 확인 = **타당**.

(※ critical 1건은 ④ /scrim 항목 한정. Phase 1 항목과 무관)

### Phase 1 대회 상태 표시 레이어 (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

✅ 잘된 점:
- effectiveTournamentStatus 가드 정확: TERMINAL(completed/ended/closed/cancelled) + NO_TIME_OVERRIDE(draft/upcoming/final/preopen) 원본 보존, 그 외만 endDate??startDate 23:59:59 경과 시 completed. null/Invalid Date 모두 원본 폴백 — 안전.
- ★ CTA 무영향 확인: v2-sidebar isRegistrationOpen은 prop 값 그대로 사용(L76), effStatus는 statusLabel(L108)에만. CTA 분기(L112/259)는 isRegistrationOpen만 참조 → 신청 가능 대회 안 막힘.
- ★ admin raw 유지: 변경 9파일 모두 공개화면. admin/tournament-admin 미접촉 확인.
- 필드명 정합: 목록/캘린더/주간 snake(start_date/end_date) ↔ API 타입 일치. hero/v2-hero/classic/sidebar camel prop ↔ Prisma select(page.tsx L139-140 startDate/endDate) 일치. 신규 prop(v2-sidebar) 호출부(page.tsx L1062-63) 정확 전달.
- 회귀 안전: hero/v2-hero는 기존 start/end prop 재활용(formatDateRange 이미 사용) → 신규 데이터 흐름 0. 정상 대회(미래/진행중) 라벨 무영향. registration-sticky-card optional 폴백 — 미렌더 안전.
- 검증: 단위 8 PASS / tsc --noEmit 변경파일 에러 0.

🟡 권장 수정 (minor, 후속·동작영향 낮음):
- [tournament-status.ts L128] 타임존 경계: 23:59:59.999 비교가 **렌더 환경 로컬 TZ** 기준. SSR(hero/sidebar/classic)=서버 UTC vs 클라(calendar/week-view "use client")=브라우저 KST → 종료일 익일 최대 ~9h(KST 오전) 동안 SSR이 "진행중" 유지 가능. 23:59 버퍼가 보수적이라 원 문제(끝난 대회 며칠 진행중)는 해소. 엄밀히 하려면 KST 고정 비교 고려(후속).
- [calendar-view L322 / week-view L279] 라벨 JSX 내 IIFE `(() => {...})()` 패턴 — 동작 정상이나 useMemo 목록 가공부에서 eff 미리 계산해 두면 가독성↑(선택).

미수정 결정 타당성:
- d3 profile tournaments-section raw 유지 → start/end 데이터 자체 없음(보정 입력 부재) = **타당**.
- c2 registration-sticky-card optional 폴백 → 현재 미렌더(import만), optional 설계로 raw 폴백 = **타당**.

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능(코트제보/시상/코치/갤러리/심판/샵/쪽지) 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — 잘못생성 결승 8건 삭제완료·#301(pbp271 보존)은 "결승" 오생성 슬롯 잔존(실제 경기 의미 확정 후 재배치). 예선 #291(OT1동점 미종료)·#292(미기록) 실결과 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (후속·동작영향0)
| 대상 | 문제 | 상태 |
|------|------|------|
| **scrim-tabs.tsx L295 (critical)** | 보낸제안 취소가 URL[id]=from_team 전송→PATCH 경로검증(to_team 강제)에서 항상 400. `patchStatus(r.counterpart.id, ...)`로 to_team id 전달 필요(counterpart null 가드 동반) | **developer 재작업** |
| scrim PATCH 가드(minor) | 받은제안 수락/거절 API가 team_members captain only(captainId fallback·vice/manager 없음)→isCaptain 헬퍼 패턴 통일 검토 | 후속 |
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **PR-MOCK-TO-REAL ①②③ (2026-06-14, `ee1a0c3`)** — /stats(MatchPlayerStat 2375행 단일source+JS시즌가공·UserSeasonStat/ShotZoneStat 0행 우회)·/calendar(tournament일정357+court_events0빈배열·TODAY실제일)·/about(count 660/105/61·운영진§6보존). 0스키마. lessons "테이블존재≠populated" 강화
- ✅ **Phase 12 Batch A/B 13화면 v2.31 (2026-06-14)** — RI1+12라우트. A(RI1/SF1정적·CC1/GL1/SH1준비중·AW1실데이터) + B(ST1/CA1/SC1/TV1준비중·CV1정적폼·SV1실데이터보존diff0·SE1변경0). mock0·§0선택sync(②③보존). CSS `*/`조기종료 fix(postcss검증)
- ✅ **PR-LINEUP-V2 라인업 앱정합 (2026-06-14)** — 스키마(captain_ttp_id ADD)+API(벤치캡7/정원12/주장필수)+UI(3상태/슬롯/undo/포지션제거)+시안. 주장 필수 이중가드
- ✅ **원영 이탈 반영 (2026-06-14)** — 머지권한 수빈단독·Flutter/api-v1 담당공백·wonyoung 비활성 (CLAUDE.md/WORKFLOW.md/decisions)
- ✅ **Phase 10 정보페이지 5시안(`1d9f125`) / 대회삭제(`f2fecc7`) / KO Sprint1(`a9ebaf6`) / 순위표 근본수정 / sync역전차단 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT(`a897b22`) / ③대회종료(`ecca28d`) / ②대회상세(`a9cb476`) / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-15 | PR-AUTOCOMPLETE ② Phase3 cron 자동화 (developer) | ✅ 신규 auto-complete-tournaments/route.ts(Bearer가드·kstMidnightUtc PURE·findMany 매치0+status NOT IN→코드필터(end??start<경계)→updateMany 매치0+status 재가드·admin_logs silent). vercel.json `0 18 * * *`(KST03:00) 추가(기존10보존). ★매치0 생명선 findMany+updateMany 둘다·당일보호·champion/mvp 미접촉·schema0. vitest 5 PASS·build✓ route등록. 멀티세션 제약준수. 미푸시1 |
| 2026-06-15 | 버킷B P1-a 코트제보 승인체계 (reviewer) | ✅ APPROVE(c0/maj0/min3) — 트랜잭션 원자성(court_infos.create+submission.update, 필수컬럼 전매핑 throw0)·IDOR(제출 본인강제/GET where user_id/PATCH super_admin)·snake정합·schema무중단(CREATE1+IDX2·ALTER0)·매핑(3x3→outdoor+size·amenities→facilities·photos[0])·중복가드(pending findFirst)·tsc0. minor: XP트랜잭션밖(기존 suggestions 패턴 동일·throw0)·중복승인race이론·GET미소비처. 미push3 |
| 2026-06-15 | 버킷B P1-a 코트제보 승인체계 (developer) | ✅ 3단계 분리커밋. [1]court_submissions ADD(CREATE1+INDEX2·ALTER/DROP0·count0) [2]POST/GET API+폼실연결(noop→fetch·검토중화면) [3]admin "제보검토"탭+승인PATCH(트랜잭션 court_infos.create+approved+XP / 반려). region→city/district·3x3→outdoor+court_size·amenities→facilities. api-v1 0·신규화면0(탭append)·tsc 3단계PASS. 미푸시3 |
| 2026-06-15 | PR-CHAMPION ① 우승팀 자동set 유틸 (developer) | ✅ 신규 set-champion.ts(isFinalsRound PURE+resolveChampionTeamId+setTournamentChampion 멱등)·finalize 통합(updated:true분기 try-catch격리)·테스트11 PASS. ★FK변환(winner=TT.id→tt.teamId=champion Team.id). 포맷별(knockout결승/리그1위/다조null). schema0·api-v1 0·tsc0. 멀티세션 제약준수(cron·vercel.json 미접촉) |
| 2026-06-15 | 대회종료 후속3종 통합설계 (planner, read-only) | ✅ ①우승팀자동set(champion=Team.id/winner=TT.id변환·finalize L180통합·옵션B·포맷별판정) ②Phase3 cron(매치0가드 생명선·stale-pending패턴) ③결선흐름(코드0·①의존). 설계서 `Dev/tournament-completion-followup-plan-2026-06-15.md`. PM결재7건. 코드·DB0 |
| 2026-06-15 | Phase3 STEP2 공지전용47건 날짜종료 백필 (developer) | ✅ id IN[확정47] updateMany status=completed. 사전47==update47 / 사후 매치0경과미종료 잔여0 / completed 7→54 / champ·mvp미접촉 / 금지id(열혈·4차·날짜없음)무변경 / schema0. 임시스크립트2 정리(가드3) |
| 2026-06-15 | Phase2 STEP3 대회종료+우승팀 적용 (developer) | ✅ 5차(7f28)→completed/champion=338(오름)·6차(e06e)→completed/champion=330(YBC). auto-complete 7/7·mvp미접촉·schema0. status분포 published51/completed7. 임시스크립트3 정리(가드3) |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim 검증 (tester) | ⚠️ 9PASS/1부분 — 더미0·실연결·빈상태3분기·tsc0·postcss0·count0증빙. 보낸취소[id]불일치 잠재결함(reviewer crit과 일치) |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim 리뷰 (reviewer) | ⚠️ CHANGES(crit1/maj0/min4) — 보낸취소 URL[id]=from_team→PATCH경로검증 400 확정버그. snake정합·토큰·IDOR·tsc는 PASS |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim (developer) | ✅ 더미제거→team_match_requests 실연결·4탭·빈상태3분기·0스키마/0신규라우트·tsc0·postcss0 |
| 2026-06-15 | Phase 1 상태 레이어 리뷰 (reviewer) | ✅ APPROVE (c0/maj0/min2) — CTA/admin 무영향·필드정합·tsc0. TZ경계 minor |
| 2026-06-15 | Phase 1 대회 상태 표시 레이어 (developer) | ✅ effectiveTournamentStatus+10파일·테스트8 PASS·build ✓·DB0 |
| 2026-06-14 | PR-MOCK-TO-REAL ①②③ 머지 (pm) | ✅ main `ee1a0c3` stats/calendar/about |
| 2026-06-14 | PR-MOCK-TO-REAL ① stats (dev/tester/reviewer) | ✅ MPS단일source·0행우회·PASS9·APPROVE |
| 2026-06-14 | Phase12 Batch B 7화면 (dev/tester/reviewer) | ✅ 준비중/정적폼/SV1보존·CSS major fix·main |
</content>
