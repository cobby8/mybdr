# 작업 스크래치패드

## 현재 작업
- **요청**: 기록(Records) 기능 CLI 박제 — 선수·팀·대회 3화면 + API 3종 + 공통컴포넌트. 시안=`Dev/design/BDR v2.33/_delivery-records-2026-06-16/`. 신규 DB 0(매치집계만)·공식가드 필수·API/데이터 유지+UI 추가.
- **상태**: planner-architect 실측+설계 **완료**(`Dev/records-feature-plan-2026-06-16.md`) → **PM 결재 7건(Q1~Q7) 대기** 후 developer 박제
- **현재 담당**: PM(결재 받기)

## 진행 현황표
| 작업 | 상태 |
|------|------|
| S3 AdminInboxState 구현 | ✅ raw DDL로 admin_inbox_state 테이블+unique idx 생성(db push/migrate 0 → DROP live_scoreboards 위험 회피). generate 완료. snooze API 신규 / inbox 목록 snoozed_until 주입+기본제외(include_snoozed=1 포함) / resolve markResolved upsert 6도메인. 사후검증 무영향0·tsc·build PASS. tester/reviewer 대기. 미커밋 |
| Admin Console S1-4 팀 검수 구현 | ✅ 8파일(team-status상수·생성pending_review·옵션2목록·상세가드·review API·overview/inbox/resolve teams연동). schema0·active소급0·tsc/build PASS. **tester 검증 7/7 통과(옵션2 회귀0 확정·DB실측 active93 소급0)**. reviewer 대기 |
| 버킷B P1-b 시즌시상 설계 | ✅ read-only 설계 완료(`Dev/season-awards-plan-2026-06-15.md` / schema diff 무중단 / PM결재 4건) |
| 버킷B P1-b 시즌시상 구현 | ✅ 3단계 박제(schema ADD+admin입력+/awards연결) 미push 3커밋. AW1 기본부 diff 0 실측·tsc·build PASS. tester/reviewer 대기 |
| PR-MOCK-TO-REAL ④⑤ scrim/team-invite | ⏳ 진행 중(STOP가드: team_match_requests/team_join 의도 확인) |
| PR-MOCK-TO-REAL ⑥⑦ saved/awards | ⏳ 준비중 경계 정리(잔여) |
| PR-MOCK-TO-REAL ①②③ stats/calendar/about | ✅ main(`ee1a0c3`) |
| Phase12 Batch A/B 13화면 / PR-LINEUP-V2 / Phase10 5시안 | ✅ main 반영 |

## 기획설계 (planner-architect)
### 기록(Records) 기능 CLI 박제 실측+설계 (2026-06-16, read-only)
- 🎯 선수·팀·대회 3화면 "기록" 탭 신설. 설계서=`Dev/records-feature-plan-2026-06-16.md`. **코드·DB·push 0**(임시스크립트 0·SELECT조차 안함·schema/시안 Read+Grep만).
- **★21컬럼 매핑 결과**: statCols 21개 중 **20개 MatchPlayerStat 실재(L794~845 전수확인)**·평점(rating) 1개만 **부재→null '–' 정직표기**(game_player_ratings=1~5 매너평가·매치연결끊김·척도다름 / UserSeasonStat.avg_rating=0행 cron미동작 / 둘 다 부적합·억지매핑 금지). season_year 컬럼 없음→scheduledAt.getFullYear() 파생(my-season-stats.ts 표준패턴).
- **★재사용 자산**: `stat-leaders.ts`(getStatLeaders=4부문 누적TOP3·확장필요 시안6종평균) / `my-season-stats.ts`(MatchPlayerStat findMany+JS가공·승패판정·상대팀명 로직 완비=헬퍼추출 재사용) / `official-match.ts`(officialMatchNestedFilter 매 집계 필수). 기존 종료뷰 `tournament-stat-leaders-card.tsx`(4종 누적) 보존.
- **★탭 실측**: 대회 tournament-tabs=?tab=지원·lazy SWR(records 4곳 추가) / 팀 team-tabs-v2=?tab=지원·**이미 "기록"라벨 stats탭 존재**(중복 결재Q2) / 선수 profile-tabs=**?tab=미지원 local state 2탭**(URL전환 결재Q3). `/api/v1/.../player-stats`=**JWT가드 공개아님**→대회기록실 재사용불가·웹신설.
- **API 결정**: 화면별 신설 `/api/web/{tournaments|users|teams}/[id]/records`(공개·공식가드·apiSuccess snake). 선수=서버직주입 대안(profile-tabs SSR prefetch). 팀=대회경기한정(친선/픽업 박스없음·TournamentTeam→ttp 경유).
- **단계**: [1]공통컴포넌트tsx+css반입 [2]집계헬퍼lib(21컬럼box PURE) [3]대회기록실API+탭(MVP·신규가치최대) [4]선수기록 [5]팀기록 [6]tester+reviewer병렬+역박제. [3][4][5]는[1][2]후 병렬가능. 규모 大(+1800~2300).
- **함정**: 공식가드누락(미래매치오집계) / snake_case(apiSuccess자동·★재발6회·서버컴포넌트는camel) / 평점억지매핑 / 강조색 var(--accent)빨강폴백→var(--cafe-blue)치환 / 시안목업박제금지(실API와이어) / jsx→tsx(window전역제거) / teamHref(name)→Team.id.
- **PM결재 7건(Q1~Q7)**: ①평점소스(권장 null표기) ②팀stats탭중복(권장 교체or통합) ③선수?tab=전환(권장 URL param) ④API vs 서버직주입(화면별혼합) ⑤리더보드6종확장(권장 확장) ⑥팀로스터기준(권장 TournamentTeam경유) ⑦박제순서(권장 대회MVP먼저).

### 버킷B P1-b 시즌 시상 고급필드 실측+설계 (2026-06-15, read-only)
- 🎯 admin-plan §P1-b "season_awards 신규". 설계서=`Dev/season-awards-plan-2026-06-15.md`. **코드·DB·push 0**(diff는 임시schema↔schema 미리보기·임시파일 즉시삭제 가드3).
- **(a)재사용 점검**: `*award*`/`*season*` grep → 명명 테이블 **부재**(UserSeasonStat=개인 누적통계만·시상 카테고리 없음). **community_posts(category=award) 재사용=기각**(user_id=작성자≠수상자·category 'news'전용 충돌·season_year 파싱취약 → 억지매핑). **신규 season_awards 정당**(P1-a court_edit_suggestions 못쓴 것과 동형 방향불일치).
- **(b)schema diff 실측**: CREATE TABLE 1+INDEX 3+FK 3 / **ALTER·DROP·DELETE 0 = 완전 무중단** / `--accept-data-loss 불필요`. court_submissions 패턴 동형. FK: user_id/team_id=SET NULL(수상자삭제시 행보존)·created_by=NO ACTION. User relation 2(recipient/creator)+Team relation 1(team) ADD.
- **(c)category enum**: 8종 `all_star_1st/all_star_2nd/coach_of_year/new_face/mvp_quote/best_defense/manner/rating_up`. **DB는 VarChar+코드 Zod 화이트리스트**(ALTER회피 컨벤션). user_id/team_id 둘다 nullable(현 8종 선수상·팀상 확장여지).
- **(d)단계**: [1]schema ADD(db diff 사용자검토후push·count0검증) [2]**관리자 직접 입력**(코트제보와 차이=승인큐❌·source가 관리자)=`/admin/season-awards` 폼+upsert/delete action+선수검색 autocomplete·super_admin가드 [3]/awards page.tsx **블록6 ADD**(기존5블록 보존)+DTO확장+awards-content 빈슬롯 채움 [4]tester+reviewer 병렬.
- **(e)★AW1 기본부 보존가드**: MVP/베스트5 득점·어시·리바/부문 득점·어시·리바왕/FinalsMVP/역대우승 = 이미 MatchPlayerStat·mvp_player_id 실연결 → **page.tsx L186~569 쿼리 1글자도 미수정**. 고급부는 **블록 ADD만**. awards-content는 **현 player:null 빈슬롯(best5 수비/신인 L70-71·cats 스틸/레이팅/매너 L84-86)만 교체**·실슬롯 미접촉. tester=`git diff awards/page.tsx` 기존블록 변경0 실측.
- **(f)규모 中(+450~650)·위험 低**. 함정: snake_case(apiSuccess응답/server prisma camel)·season_year↔series 매핑·빈슬롯만 교체·강조색 `var(--cafe-blue)`(빨강폴백 함정 errors06-10).
- **PM결재 4건**: ①season_year↔series 매핑(권장 (나)season_awards에 series_id? 추가) ②admin위치(권장 독립페이지) ③선수지정UI(권장 검색autocomplete) ④올스타/감독/코멘트 표시위치([3]시 Awards.jsx 확인후).

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

### Admin Console S3 — AdminInboxState 스누즈/처리상태 (2026-06-15, developer) — 미커밋

📝 구현: 통합 인박스에 항목별 메타 테이블 `admin_inbox_state` 연동. 스누즈(나중에 다시 보기) + 처리완료 흔적을 원본 테이블 미접촉으로 별도 보관. GET 목록은 기본적으로 스누즈 미만료·처리완료 항목 제외.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| (DB) admin_inbox_state | raw DDL CREATE TABLE + unique idx(ref_type,ref_id). db push/migrate 미사용 | 신규 |
| prisma/schema.prisma | AdminInboxState 모델 (이미 추가돼 있던 상태 — generate만 수행) | 기존 |
| inbox/route.ts | union 후 adminInboxState batch 조회 → snoozed_until 주입 / 기본 제외(snoozed_until>now OR resolved_at!=null) / `?include_snoozed=1` 시 포함 | 수정 |
| inbox/[id]/snooze/route.ts | POST {until:ISO8601} super_admin·Zod·upsert(refType_refId) → snoozedUntil | 신규 |
| inbox/[id]/resolve/route.ts | 6개 도메인 처리 성공 직후 markResolved() upsert(resolved_at/resolved_by/memo) best-effort | 수정 |

🔎 1단계 DB 사후검증: 테이블 생성O / 컬럼 9 / 인덱스 2(pkey+unique) / live_scoreboards count=0 무영향 / admin_inbox_state count=0 초기. 임시 스크립트 정리 완료.

💡 tester 참고:
- 테스트: super_admin 세션으로 (1) POST inbox/[id]/snooze {until: 미래ISO} → 200 + snoozed_until 반환 → GET inbox 기본목록에서 해당 항목 사라짐 → `?include_snoozed=1` 시 다시 보임 (2) POST inbox/[id]/resolve 정상 처리 → GET 기본목록에서 사라짐
- id 형식 = "<domain>:<refId>" (예: "court_submissions:12")
- 주의입력: until 비ISO8601 → 400 VALIDATION_ERROR / id에 ":" 없음 → 400 BAD_ITEM_ID / 비super_admin → 403
- resolve의 markResolved는 best-effort(try/catch) — 메타 upsert 실패해도 원본 처리는 성공 응답

⚠️ reviewer 참고:
- inbox/route.ts 제외 필터 in-place splice 역순 순회 (인덱스 안전)
- snooze는 resolved_by 미기록(스누즈≠처리) — 향후 감사 필요 시 별도 컬럼 분리 주석 남김
- resolved_by = session.sub(string). resolve는 BigInt(session.sub)를 원본 처리에 별도 사용

### Admin Console S1-4 팀 검수 (2026-06-15, developer) — 미커밋

📝 구현: 신규 팀 생성→`pending_review`(검수대기). 공개목록/상세는 옵션2(비로그인·타인=현행 active+public 회귀0 / 본인=내 검수대기 팀 OR 추가). super_admin review API(approve→active / reject→rejected). S2 인박스 union·overview count·resolve 디스패처에 teams 도메인 연동. **schema 0 / api-v1 0 / 디자인 0 / active 93건 소급 0**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/constants/team-status.ts` | TEAM_STATUS(active/pending_review/rejected) + teamReviewQueueWhere 헬퍼 | 신규 |
| `src/app/actions/teams.ts` | 팀 생성 status `"active"→TEAM_STATUS.PENDING_REVIEW`(L82) | 수정 |
| `src/app/api/web/teams/route.ts` | 공개목록 GET 옵션2 가시성 분기(getWebSession try-폴백 / 로그인=OR[active+public, pending+captainId나, pending+teamMembers.some.userId나]). where=AND배열(가시성+q+city 충돌방지). groupBy 도시목록은 active만 현행 유지 | 수정 |
| `src/app/(web)/teams/[id]/page.tsx` | 본조회 직후 가시성 가드(status!=="active" → 본인[captainId or active멤버]만, 그외 notFound) | 수정 |
| `src/app/api/web/admin/teams/[id]/review/route.ts` | POST {approve\|reject, reason?} super_admin·Zod. pending_review만→active\|rejected(INVALID_STATE 방어). reason→adminLog | 신규 |
| `src/app/api/web/admin/overview/route.ts` | queue.teams `0→prisma.team.count(teamReviewQueueWhere)` (Promise.all 추가) | 수정 |
| `src/app/api/web/admin/inbox/route.ts` | teams 소스 추가(severity blue·route /admin/teams·Team.createdAt 정렬·union 정규화) | 수정 |
| `src/app/api/web/admin/inbox/[id]/resolve/route.ts` | SUPPORTED_DOMAINS에 teams 추가 + 차단분기 제거 + switch teams case(review 로직 1:1 인라인 복제·라우트 import 0) | 수정 |

- **옵션2 회귀 0**: 비로그인/타인 where = `{status:active, is_public:true}` (현행 동일). 로그인만 OR 추가. teamMembers relation 필드명 `userId`(@map user_id)·captainId(BigInt @map captain_id) 스키마 실측 확인.
- **상세 가드**: teamMembers는 본조회에서 status:"active" include됨 → 멤버 판정 재사용(추가 쿼리 0). notFound는 무거운 집계 쿼리 전에 실행(낭비 차단).
- **resolve teams**: refId=Team.id.toString()(union 박제)→BigInt(refId)=pk 정합. court 동형으로 review 라우트 import 0(결합 0).
- tsc --noEmit EXIT 0 / `npm run build` ✓ EXIT 0 + 신규 `ƒ /api/web/admin/teams/[id]/review` 등록 확인.

💡 tester 참고:
- 정적: tsc EXIT 0 / build EXIT 0. super_admin curl 어려워 정적+build 대체.
- **회귀 검증(★)**: 비로그인으로 GET /api/web/teams → 기존과 동일 active+public 목록만(검수대기 팀 0 노출). 로그인 사용자는 본인 검수대기 팀이 추가로 보임.
- 팀 생성: 로그인→팀 생성→생성자 본인은 목록/상세에서 보임(pending_review). **타인/비로그인은 그 팀 목록·상세(URL직접) 모두 notFound/숨김**.
- review: super_admin으로 POST /api/web/admin/teams/[id]/review {action:approve}→active(공개 노출). reject→rejected(숨김 유지). pending_review 아니면 400 INVALID_STATE. 비super_admin→403.
- inbox/overview: super_admin GET overview queue.teams=검수대기 count / inbox items에 teams 항목(blue) 노출. resolve POST teams:refId {approve}→active.
- 주의: 기존 active 팀 93건은 pending_review 아니라 review API에서 INVALID_STATE(정상 — 소급 0).

⚠️ reviewer 참고:
- ★ 옵션2 회귀 0: 비로그인 visibilityWhere가 정확히 기존 `{status:active, is_public:true}`인지. where AND 배열이 q의 OR과 충돌 없는지.
- ★ 상세 가드: active 팀은 가드 통과(전원 공개)·검수대기/반려는 본인만. teamMembers include 재사용(userId === viewerId).
- ★ resolve teams case가 review 라우트와 동일 로직(pending_review만)·라우트 import 0(court 동형).
- snake_case: apiSuccess 자동변환. id BigInt→toString. teamReviewQueueWhere 단일 source(inbox/overview 동일 기준).
- 멀티세션: 명시 8파일만 접촉. schema/api-v1/디자인 0.

### P2 갤러리 (2026-06-15, developer) — 미push

📝 구현: 버킷B P2 — `/gallery` 더미(ITEMS/lightbox/SVG/이모지) 제거 상태에서 **news_photo(0스키마) 실연결**. server component 전환. 파일 1개. CSS 추가 0.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/gallery/page.tsx` | async server component 전환 + `prisma.news_photo.findMany`(url/caption/match.tournament) + 2건 이상 `.gl-grid` 실데이터 그리드 / 1건 이하 `.ex-empty` 빈상태 분기 | 수정 |

- **실측 news_photo count = 1**(소수) → 확정룰 "1건이면 빈상태가 정상, 가짜채움 금지" 준수. 현재 화면=빈상태 유지. **2건 이상부터 자동 그리드 노출**(`hasGrid = photos.length >= 2`).
- **클릭 링크**: match→tournament 있으면 `/tournaments/${tournament.id}`(실재 라우트, uuid param). 매치 단독 라우트 부재라 대회 상세로 위임. tournament 없으면 억지 링크 금지→`<div>`로 img만.
- **캡션 fallback**: caption→roundName→대회명→"경기 사진". 실 `<img src={url}>` + objectFit cover(inline, CSS 추가 0). 더미 SVG·lightbox·이모지 0.
- **CSS 추가 0**: 기존 `.gl-grid`/`.gl-item`/`.gl-item__cap`/`.ex-*` 재사용(globals.css 실재 확인). 토큰화 클래스만(하드코딩hex 0).
- 공개 정책 유지(세션 가드 0). `revalidate=30`. tsc --noEmit EXIT 0. 임시 census 스크립트 작성→삭제(가드3).

💡 tester 참고:
- 정적: `npx tsc --noEmit` EXIT 0(통과).
- DB: news_photo count=1 → /gallery 접속 시 **"갤러리 준비 중" 빈상태가 정상**(mock 0). 가짜 사진 노출되면 오류.
- 그리드 경로: news_photo 2건 이상 환경에서만 `.gl-grid` 노출. 각 타일 클릭→해당 대회 `/tournaments/[uuid]` 이동(실재 라우트). 현재 1행이라 런타임 그리드 미재현(1행도 빈상태 의도).
- 주의 입력: caption=null 사진(현 1건)은 roundName/대회명으로 캡션 표시. tournament 없는 고아 사진은 링크 없이 img만.

⚠️ reviewer 참고:
- 관계 경로 news_photo.match.tournament(tournamentId uuid)→/tournaments/[id] 실재 라우트 확인(매치 단독 라우트 없음→대회 상세 위임, 억지 링크 0).
- 임계값 `>= 2`(소수=1건 빈상태) — 확정 지시 "1건이면 빈상태가 정상" 반영.
- 멀티세션 제약: `src/app/(web)/gallery/page.tsx` 1파일만 접촉. schema/api/v1/CSS/다른 화면 미접촉.

### P1-b 시즌 시상 고급필드 (2026-06-15, developer) — 미push 3커밋

📝 구현: season_awards 신규 테이블 + admin 입력폼 + /awards 고급부 연결. 단계별 분리 커밋. P1-a 코트제보 동형 패턴.

| 단계 | 파일 | 변경 | 신규/수정 |
|------|------|------|----------|
| [1] | `prisma/schema.prisma` | season_awards 모델 ADD + User relation 2(recipient/creator) + Team 1(team) + tournament_series 1(series) | 수정 |
| [2] | `src/lib/awards/season-award-categories.ts` | 8종 카테고리 상수 + Zod 화이트리스트 + 라벨 + multi-slot | 신규 |
| [2] | `src/app/actions/admin-season-awards.ts` | upsert/delete server action(super_admin·adminLog·payload Json) | 신규 |
| [2] | `src/app/(admin)/admin/season-awards/page.tsx` | super_admin 가드 + series/시상 조회·직렬화 | 신규 |
| [2] | `.../admin-season-awards-content.tsx` | 시리즈 select+카테고리+선수검색 autocomplete+코멘트+목록/삭제 | 신규 |
| [2] | `src/components/admin/sidebar.tsx` | 콘텐츠 그룹 "시즌 시상" 메뉴(super_admin) | 수정 |
| [3] | `src/app/(web)/awards/page.tsx` | 블록7 season_awards 조회 ADD(기존 5블록 미수정) + DTO 8필드 확장 | 수정 |
| [3] | `.../awards-content.tsx` | best5 수비/신인·cats 스틸/레이팅/매너 빈슬롯 채움 + 올스타/감독/NEWFACE/MVP코멘트 신규섹션 | 수정 |

- **[1] schema diff 무중단**: CREATE TABLE 1 + INDEX 3((series_id,category)/(season_year)/(user_id)) + FK 4(user/team/series=SET NULL·created_by=NoAction). ALTER/DROP/DELETE 0. `--accept-data-loss` 불필요. db push 완료(--skip-generate→generate). count **0** 검증(임시스크립트→즉시삭제 가드3).
- **series_id**: PM 결재대로 BigInt? 추가(season_year Int?와 병행). /awards currentSeriesId(기존 L173 변수) 재사용.
- **★AW1 기본부 보존 실측**: `git diff page.tsx` = **120 insertions(+) / 0 deletions(-)**. 기존 5블록 쿼리 1글자도 미수정. 블록7은 champions try-catch 끝 다음 ADD만.
- **선수검색**: 신규 GET 불필요 — 기존 `/api/web/admin/users/search` 재사용(설계서 "신규 GET 1개"보다 절약).
- **빈슬롯만 교체**: leaders(scoring/assists/rebounds) 실슬롯 미접촉. Slot 정규화 타입으로 PlayerRefDTO/SeasonAwardPlayerDTO 둘 다 같은 셀 렌더.
- tsc 3단계 전부 EXIT 0. build ✓ 21.7s + 신규 `ƒ /admin/season-awards` 등록. 하드코딩hex 0(var(--color-error)/var(--cafe-blue)) / lucide 0.

💡 tester 참고:
- **★검증 1**: `git diff <step2커밋>..HEAD -- "src/app/(web)/awards/page.tsx"` 또는 step3 커밋 diff → 삭제(-) 라인 0 실측(AW1 기본부 회귀 0).
- DB: season_awards count=0(박제 전 정상). 빈 상태로 /awards 접속 시 best5 수비/신인·cats 스틸/레이팅/매너·올스타·감독·NEWFACE·MVP코멘트 전부 "준비 중/집계 중" 빈상태(mock 없음).
- admin: super_admin으로 /admin/season-awards 접속→시리즈 선택+카테고리+선수검색(닉네임 입력→드롭다운)→추가→목록 표시→삭제. super_admin 아니면 /admin?error=no_permission redirect.
- 실거동: season_awards 1행 입력 후 /awards에서 해당 카테고리 슬롯이 빈상태→실데이터로 채워지는지 1회 확인 권장(0행이라 런타임 미재현).
- 주의: category 8종 외 값→upsert 조용히 거부 / user·team·comment 전부 비면 거부.

⚠️ reviewer 참고:
- ★ page.tsx 블록7이 기존 5블록 쿼리/officialMatchWhere/DTO 필드 미접촉 — ADD-only(diff 0 delete) 확인.
- ★ FK SET NULL(user/team/series)·NoAction(created_by) 정합 / category VarChar+코드 화이트리스트(ALTER 회피).
- snake_case: season_awards.payload는 Json(comment/quote) — page.tsx server prisma는 camel 접근, admin user search 응답은 apiSuccess snake 변환(data.users).
- 강조색 var(--cafe-blue)(errors 06-10 빨강 폴백 함정 회피). 삭제버튼 var(--color-error).
- 멀티세션: awards 2파일 + admin season-awards 4파일 + schema + sidebar만 접촉. 다른 세션(Admin Console S2 등) 미접촉.

### Admin Console S1-5 — 통합 디스패처 (2026-06-15, developer) — 신규 1파일 미커밋

📝 구현: S2 인박스(union 목록) 항목을 도메인 가리지 않고 처리하는 단일 POST 엔드포인트. id="<domain>:<refId>" split→switch(domain) 직접 prisma+adminLog. isSuperAdmin 통합가드 403. schema 0 / api/v1 0 / 기존 6도메인 라우트·inbox(목록) 전부 미수정(신규 1파일만).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `api/web/admin/inbox/[id]/resolve/route.ts` | POST. isSuperAdmin가드→id split(":")→domain별 Zod 화이트리스트→switch 6분기 처리+adminLog. teams=400 UNSUPPORTED_DOMAIN | 신규 |

★ **6도메인 위임(검증 1:1 복제)**:
- game_reports {resolve\|dismiss, memo?}: submitted만→resolved\|dismissed(아니면 INVALID_STATE). memo→adminLog(컬럼부재).
- community_posts {hide\|restore, reason?}: status→hidden\|published. reason→adminLog.
- organizations {approve\|reject, reason?}: pending만→approved(approved_at/by)\|rejected. ★reject reason 필수(REASON_REQUIRED)+rejection_reason/at.
- court_submissions {approve\|reject, review_note?}: pending만 findFirst. ★(A) 디스패처 내부 트랜잭션 복제(court_infos.create+XP court_submit+approved_court_info_id). 기존 PATCH 라우트 import 0·무수정.
- payments {approve\|reject, reason?}: ★status-only. refund_status="requested"만→approved\|rejected(멱등·PG호출0·refund_amount/refunded_at/status 미접촉). adminLog severity:warning.
- teams: 400 UNSUPPORTED_DOMAIN(DB미지원 보류).

★ **공통**: refId 전 도메인 BigInt PK → 공통 BigInt 변환(인박스 union .toString() 박제와 정합). adminId=session!.sub(isSuperAdmin narrowing 안 함→non-null assertion·tsc 0). id 분해는 indexOf(":")(첫 콜론 기준·refId 콜론 포함 대비).

💡 tester 참고:
- 정적: `npx tsc --noEmit` EXIT 0 / `npm run build` ✓ 21.7s + 신규 `ƒ /api/web/admin/inbox/[id]/resolve` 등록.
- super_admin curl 어려워 **build+정적 대체**(지시문 허용). 런타임은 super_admin 로그인 후 POST 1회 권장.
- 정상: 비super_admin/비로그인→403 FORBIDDEN. id "domain:refId" 아니면→400 BAD_ITEM_ID. teams→400 UNSUPPORTED_DOMAIN. 미지원 domain→400 UNKNOWN_DOMAIN. body 화이트리스트 외→400 VALIDATION_ERROR. 없는 id→404. game_reports submitted/organizations pending/court pending/payments refund_status=requested 아니면→400 INVALID_STATE(organizations reject reason 누락→400 REASON_REQUIRED).
- 주의: payments는 refund_status만 전환(실제 환불 0). court approve는 court_infos 1건 생성+XP+10(트랜잭션·기존 PATCH와 동일 결과).

⚠️ reviewer 참고:
- ★ payments status-only — payments.update data에 refund_status/updated_at만(refund_amount·refunded_at·status 미포함) 확인. PG fetch 0.
- ★ court (A)복제 — 기존 court-submissions PATCH 라우트 import 0(결합 0)·트랜잭션 court_infos.create+update+addXP 원자성·adminLog 트랜잭션 외 동일.
- ★ organizations reject reason 필수(기존 reject 라우트 동일). approve는 canManageOrganizations 아닌 디스패처 표준 isSuperAdmin 가드(설계대로 통일).
- snake_case: apiSuccess 자동변환. id BigInt→toString. payments 응답키 refund_status.
- 멀티세션: 신규 1파일만 접촉. 기존 6도메인 라우트·inbox 목록·schema·api/v1 0.

### Admin Console S1 — 처리 뮤테이션 1~3 (2026-06-15, developer)

📝 구현: admin 콘솔 큐 항목 처리(action) 3 엔드포인트(POST). 셋 다 getWebSession+isSuperAdmin 403가드·Zod·adminLog·apiSuccess(snake자동)·schema 0·api/v1 미접촉. court-submissions/organizations approve 동형 패턴. notify=(A)보류(수신만·발송0).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `api/web/admin/game-reports/[id]/resolve/route.ts` | POST Zod{action:resolve\|dismiss,memo?,notify?}. game_reports submitted만→resolved\|dismissed. **memo=컬럼부재(실측)→adminLog changesMade에만 박제**. adminLog(game_report.resolve\|dismiss) | 신규 |
| `api/web/admin/suggestions/[id]/respond/route.ts` | POST Zod{status:in_progress\|resolved\|dismissed,admin_response?,notify?}. status+admin_response+responded_by_id=session.sub+responded_at=now. adminLog(suggestion.respond) | 신규 |
| `api/web/admin/community/[id]/moderate/route.ts` | POST Zod{action:hide\|restore,reason?}. community_posts status→hidden\|published(default published). reason→adminLog. **기존 community admin status변경 미지원 실측→신규** | 신규 |

★ **notify (A)보류**: Zod로 파라미터는 받되 createNotification 호출 **0**. "후속 NotificationType 정비 시 발송" 주석 위치 박제. 승인된 방향.
★ **memo/reason DB 저장 안 함**: game_reports에 memo 컬럼 부재(실측 schema L1680~1700) / community_posts moderation reason 컬럼 부재 → 둘 다 adminLog.changesMade에만 박제(감사 추적). status 컬럼만 update.
★ **suggestions**: status/admin_response/responded_by_id(BigInt?)/responded_at(DateTime?) 전부 실재 컬럼(L2042~2058) → DB 직접 갱신.
★ 상태 가드: game_reports=submitted만 처리(중복방어 INVALID_STATE). suggestions/community=존재만 확인(상태 무관 전환 허용).
★ session narrowing: isSuperAdmin(session) 통과 후 session!.sub(non-null assertion) — 헬퍼가 TS narrowing 안 해서 명시. tsc EXIT 0 확인.

💡 tester 참고:
- 정적: `npx tsc --noEmit` EXIT 0 / `npm run build` ✓ Compiled 22.1s + 신규 3라우트 등록(`ƒ /api/web/admin/game-reports/[id]/resolve`·`suggestions/[id]/respond`·`community/[id]/moderate`).
- super_admin 세션 curl 어려워 **build+정적검증 대체**(지시문 허용). 런타임 실호출은 super_admin 로그인 후 POST 1회 권장.
- 정상: 비super_admin/비로그인→403 FORBIDDEN. body 화이트리스트 외 값→400 VALIDATION_ERROR. 없는 id→404. game_reports submitted 아니면→400 INVALID_STATE.
- 주의: memo/reason은 DB 미저장(adminLog만) — game_reports/community 응답엔 id+status만. notify=true 줘도 알림 발송 0(의도).
- DB 안전: status update 1건씩만(트랜잭션 불요). destructive 0.

⚠️ reviewer 참고:
- ★ notify (A)보류 — createNotification import·호출 0인지(주석만) 확인. memo/reason adminLog 외 누수 0.
- ★ game_reports submitted 가드(중복처리 방어) / suggestions responded_by_id=BigInt(session.sub) 정합.
- snake_case: apiSuccess 자동변환(id/status). 응답 id=BigInt→toString.
- 멀티세션 제약: 신규 3라우트 + architecture.md만 접촉. 다른 파일(S2·season-awards 등) 미접촉. schema/api-v1 0.

### Admin Console S2 — overview/inbox 2 API (2026-06-15, developer)

📝 구현: admin 콘솔 메인 집계 2 엔드포인트. 둘 다 getWebSession+isSuperAdmin 403가드·apiSuccess(snake자동)·읽기전용·schema 0·api/v1 미접촉.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/api/web/admin/overview/route.ts` | GET → `{kpis,queue}`. KPI 4(new_users·active_games·month_revenue·recruiting_tournaments) Promise.all 병렬 + 큐 6 count. KST 자정/월초 PURE 유틸 내장 | 신규 |
| `src/app/api/web/admin/inbox/route.ts` | GET → `{items,next_cursor}`. 6소스 union→정규화→정렬(priority/age)→slice 50. domain/severity 필터·인덱스 커서 | 신규 |

★ KPI 매핑(확정대로): new_users=User.createdAt≥KST오늘0시(delta 어제대비·trend 7일 day-bucket) / active_games=games.status in[1,2](delta null) / month_revenue=payments paid+paid_at≥KST이번달1일 _sum.final_amount(**Decimal→Number**·delta null) / recruiting=Tournament.status in[6종 화이트리스트](delta null).
★ 큐 6: game_reports(submitted)/community_posts(draft)/teams=**0 DB미지원**/payments(refund_status=requested)/court_submissions(pending)/organizations(pending).
★ inbox severity: reports·payments=err / community=warn / courts·orgs=blue. priority err0<warn1<blue2. title: reports="경기 평가 #id"/community=title/courts·orgs=name. cursor=정렬후 인덱스(union이라 단일 BigInt키 부재).
★ 함정: final_amount Decimal→Number / id BigInt→toString / name·title null폴백 / 7일trend DB date캐스팅 회피=코드 day-bucket(KST키).

💡 tester 참고:
- 정적검증: `npx tsc --noEmit` EXIT 0 / `npm run build` ✓ Compiled 25.1s + 신규 `ƒ /api/web/admin/overview`·`ƒ /api/web/admin/inbox` 등록.
- super_admin 세션 curl 어려워 **build+정적검증 대체**(지시문 허용). 런타임 실호출은 super_admin 로그인 후 GET 1회 권장.
- 정상: 비super_admin/비로그인→403 FORBIDDEN. overview 응답 kpis/queue snake. inbox items[].id="<domain>:<refId>"·next_cursor(정렬후 인덱스 or null).
- 주의: month_revenue paid 0건이면 0. 큐 각 소스 0건이면 inbox items=[]. domain=court_submissions 필터 시 그 소스만 조회.

⚠️ reviewer 참고:
- KST 경계 유틸(kstMidnightUtc/kstMonthStartUtc) UTC+9 보정 정확성. payments Decimal→Number 변환 누락 여부.
- inbox 6소스 union 정렬·인덱스 커서 경계(start>0·next_cursor null 조건). teams=0 고정(주석).
- 멀티세션 제약: 신규 2라우트 + architecture.md만 접촉. 다른 파일 미접촉.

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

### Admin Console S3 — AdminInboxState 스누즈/처리상태 검증 (2026-06-15, tester) — 미커밋

정적+build+DB(읽기전용) 실측 전부 통과. 6개 검증항목 0실패.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. build·tsc0·라우트등록·generate | ✅ 통과 | `tsc --noEmit` EXIT 0 / `npm run build` EXIT 0 / 신규 `ƒ /api/web/admin/inbox/[id]/snooze` 등록(+`/inbox`·`/inbox/[id]/resolve` 동시 등록). `prisma generate` ✓ v6.19.2 — `adminInboxState` 모델 client 노출 확인(DB count 호출 성공) |
| 2. ★snooze 제외 로직 | ✅ 통과 | inbox/route.ts: union 후 `adminInboxState.findMany`(refType IN & refId IN batch)→Map 매칭으로 각 item `snoozed_until` 주입. 기본 모드(`!includeSnoozed`): `snoozedUntil>now`(미만료 스누즈) OR `resolvedAt!=null`(처리완료) item을 excluded Set 구성 후 **역순 splice**(인덱스 안전)로 제거. `?include_snoozed=1`→제외 끔(전부 노출). batch 조회는 화면 union 상한 내 소량(refType/refId 각 distinct IN) |
| 3. snooze API 가드·Zod·upsert | ✅ 통과 | `isSuperAdmin(session)` 비통과→403 FORBIDDEN. body `{until: z.string().datetime()}`(ISO8601)·위반→400 VALIDATION_ERROR. id `indexOf(":")` 분해·":"없음/빈refType·refId→400 BAD_ITEM_ID. body JSON 파싱 실패→400 BAD_REQUEST. `adminInboxState.upsert({where:{refType_refId:{refType,refId}}, update:{snoozedUntil}, create:{...}})` 복합 unique 키. resolved_by 미기록(스누즈≠처리·주석 명시). 응답 snake `{id, snoozed_until}` |
| 4. resolve markResolved best-effort | ✅ 통과 | resolve/route.ts 6도메인(game_reports/community_posts/organizations/court_submissions/payments/teams) 처리 성공 직후 각 case에서 `markResolved(domain, refId, session!.sub, memo, now)` 호출. markResolved=`adminInboxState.upsert`(update resolvedAt/resolvedBy/memo · create 동일)를 **try/catch로 감싸** 실패해도 원본 처리 응답 미차단(best-effort 감사). 각 도메인 memo 매핑: report=memo / community·org·payment=reason / court=review_note / team=reason |
| 5. ★DB 안전(CREATE만·무영향) | ✅ 통과 | **읽기전용 census**(_temp 스크립트→즉시삭제 가드3): admin_inbox_state count=**0**(초기) / 컬럼 9(id,ref_type,ref_id,snoozed_until,resolved_at,resolved_by,memo,created_at,updated_at — 스키마 정합) / 인덱스 2(`_pkey`+`_ref_type_ref_id_key` unique). **live_scoreboards count=0 무영향**. db push/migrate 미사용(raw DDL)→다른 테이블 DROP/ALTER 0. ⚠️참고: `@@unique`는 unique **index**로 잡힘(pg_constraint의 unique constraint 0건). prisma upsert는 unique index만으로 동작 정상 |
| 6. 기존 inbox 회귀 0·snake/직렬화 | ✅ 통과 | snooze 없는 item: stateMap 미매칭→`snoozed_until:null` 유지·excluded 미포함→정상 노출. S2 union/정렬(priority err0<warn1<blue2)/severity·domain 필터/cursor 페이지네이션 로직 무변경(S3는 union 후 주입+제외만 ADD). apiSuccess 자동 snake 변환. id BigInt→`.toString()`·refId `slice(indexOf(":")+1)`로 item.id와 동일 키 형식 매칭 |

📊 종합: 6개 중 6개 통과 / 0개 실패

특이사항(수정요청 아님·참고):
- **런타임 super_admin POST 미수행**: super_admin 세션 curl 어려움 + **운영 DB 쓰기(upsert/delete) 샌드박스 차단**(정당 — 운영 DB 테스트 행 INSERT 위험)으로 snooze/resolve 실호출 미검증. 정적+build+DB 읽기실측 대체(지시문 허용). upsert 동작은 스키마 복합 unique 키 정의+tsc 통과로 정적 검증. **super_admin 로그인 후 1회 스모크 권장**: ①POST snooze {until:미래ISO}→GET 기본목록서 해당 item 사라짐→`?include_snoozed=1`서 재노출 ②POST resolve→기본목록서 사라짐.
- unique constraint vs unique index: raw DDL이 `CREATE UNIQUE INDEX`로 만들어 pg_constraint엔 unique constraint 미등록(index만 존재). prisma `@@unique` upsert는 index 기반이라 정상 동작 — **수정 불요**(참고용).
- `scripts/_temp/`에 다른 세션 산물 `count-news-photo.mjs` 잔존(S3 무관·미접촉).

### Admin Console S1-4 — 팀 검수(옵션2) 검증 (2026-06-15, tester) — 8파일 미커밋(team-status.ts·review/route.ts untracked)

정적+build+스키마/DB 실측 전부 통과. 7개 검증항목 0실패. ★옵션2 회귀 0 확정.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. build·tsc0·review 라우트 등록 | ✅ 통과 | `tsc --noEmit` EXIT 0 / `npm run build` EXIT 0 / 신규 `ƒ /api/web/admin/teams/[id]/review` 등록 확인(+`/api/web/admin/inbox`·`/inbox/[id]/resolve`·`/api/web/admin/overview`·`/admin/teams` 동시 등록). 신규 디렉토리 `admin/teams/`는 git untracked(route.ts 3820B 디스크 존재·build 등록=정상) |
| 2. ★★옵션2 회귀 0 | ✅ 통과 | **비로그인/타인** visibilityWhere=`{status:"active", is_public:true}` — HEAD(변경전 `5391b79`) `where={status:"active",is_public:true}`와 **100% 동일**. 검수대기 팀 0 노출. **로그인** 시 OR[active+public, pending_review+captainId나, pending_review+teamMembers.some.userId나] 추가만. 구조 변경(플랫→`{AND:[visibilityWhere,{OR:q},{city}]}`)은 q OR과 visibility OR 충돌 방지=**개선**(결과집합 동일). groupBy 도시목록 active만 현행 유지. 상세 page.tsx: `team.status!=="active"`→본인(captainId or active멤버)만, 그외/비로그인 notFound. notFound가 무거운 집계 쿼리 전 실행 |
| 3. 팀 생성 status→pending_review | ✅ 통과 | actions/teams.ts L86 `status: TEAM_STATUS.PENDING_REVIEW`(="pending_review") create data. team-applications/team_join 등 타 흐름 미접촉(active 유지) |
| 4. review API 가드·Zod·전이·adminLog | ✅ 통과 | `isSuperAdmin(session)` 비통과→403 FORBIDDEN. Zod `{action:approve\|reject, reason?(max2000)}`·위반→400 VALIDATION_ERROR. `status!=="pending_review"`→400 INVALID_STATE(active 93건 방어). approve→active/reject→rejected. id BigInt 변환 실패→400 BAD_ITEM_ID·없는 id→404. reason→adminLog.changesMade(teams 전용컬럼 부재). 본문 잘못→400 BAD_REQUEST |
| 5. teams 큐 활성(overview·inbox·resolve) | ✅ 통과 | overview queue.teams=`prisma.team.count({where:teamReviewQueueWhere})`(0고정→실측 Promise.all 추가). inbox teams 소스=teamReviewQueueWhere·severity **blue**·route `/admin/teams`·Team.createdAt asc 정렬·union 정규화(`teams:<id>`). resolve switch teams case=review 라우트 **1:1 인라인**(pending_review만→active\|rejected·INVALID_STATE 방어·adminLog·라우트 import 0). overview/inbox 모두 `teamReviewQueueWhere` **단일 source**(큐 숫자↔목록 일치 보장) |
| 6. ★S2 3파일 타 도메인 회귀 0 | ✅ 통과 | overview: 기존 KPI4(new_users/active_games/month_revenue/recruiting)·큐5(game_reports/community/payments/court/orgs) 로직 무변경, teams count만 Promise.all에 ADD. inbox: 기존 5소스(reports/posts/courts/orgs/refunds) 무변경, teams 6번째 소스 ADD(severity priority err0<warn1<blue2 정렬 유지). resolve: 기존 6분기(game_reports/community/orgs/court/payments + UNSUPPORTED였던 teams) 무변경, teams는 400 UNSUPPORTED→정상 처리로 전환만 |
| 7. 스키마0·api/v1 0·active 소급0·실측필드 | ✅ 통과 | `git diff prisma/schema.prisma`=**빈값**(schema 0). api/v1 내 TEAM_STATUS/team-status/teamReviewQueueWhere grep=0. **DB 실측**(읽기전용 census→즉시삭제 가드3): status 분포=active 93·inactive 8·merged 2·dissolved 2·**pending_review/rejected 0**→active 93건 review/resolve에서 INVALID_STATE(소급 0 확정). 스키마 실측: `Team.captainId` BigInt non-null(@map captain_id)·`Team.status` String? default "active"·`Team.is_public` Boolean? default true·`Team.createdAt`(@map created_at)·`TeamMember.userId` BigInt(@map user_id) — page.tsx `captainId===viewerId`/`m.userId===viewerId` BigInt 비교 정합 |

📊 종합: 7개 중 7개 통과 / 0개 실패

특이사항(수정요청 아님·참고):
- S1-4 8파일 외 `gallery/page.tsx`·`architecture.md`는 다른 세션(P2 갤러리/문서) 산물 — S1-4 무관.
- 런타임 super_admin 세션 curl 어려워 review/resolve POST·overview/inbox GET 실호출은 미수행(정적+build+DB실측 대체·지시문 허용). super_admin 로그인 후 1회 스모크 권장(특히 옵션2 로그인 사용자 본인 pending_review 팀 노출).
- inbox/overview teams 큐가 동일 `teamReviewQueueWhere` 사용 → 숫자/목록 불일치 위험 0(단일 source 설계 양호).

### Admin Console S1-5 — 통합 디스패처 검증 (2026-06-15, tester) — 신규 1파일 미커밋(untracked)

정적+build+스키마/기존라우트 실측 전부 통과. 7개 검증항목 0실패.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. build·tsc0·라우트 등록 | ✅ 통과 | `tsc --noEmit` EXIT 0 / `npm run build` EXIT 0 / 매니페스트 등록 확인(`.next/server/app/api/web/admin/inbox/[id]/resolve/route.js` 생성 + app-paths-manifest `/api/web/admin/inbox/[id]/resolve/route`) |
| 2. ★가드 isSuperAdmin 403·id 첫콜론 split | ✅ 통과 | 진입부 `if(!isSuperAdmin(session)) return apiError(...,403,"FORBIDDEN")`(role OR admin_role·session null→403). id 분해=`indexOf(":")`(첫 콜론 기준·refId 콜론 포함 대비)→`slice(0,sep)`/`slice(sep+1)`. sep<0 또는 refId 빈값→400 BAD_ITEM_ID |
| 3. 6도메인 Zod 화이트리스트+상태가드 | ✅ 통과 | game_reports `status!=="submitted"`→400 INVALID_STATE / community findUnique 존재만 / organizations `status!=="pending"`→INVALID_STATE·reject reason 누락→400 REASON_REQUIRED / court findFirst(status:pending)·아니면 404 / payments `refund_status!=="requested"`→INVALID_STATE / teams→400 UNSUPPORTED_DOMAIN. 각 도메인 Zod enum 위반→400 VALIDATION_ERROR |
| 4. ★★payments status-only·멱등·PG 0 | ✅ 통과 | update data=`{refund_status, updated_at}` **단 2필드** — refund_amount/refunded_at/status **미포함**(스키마 L1896~1898 컬럼 실재하나 미접촉). PG fetch grep=0. 멱등=`refund_status==="requested"`만 처리. adminLog `severity:"warning"`(log.ts L15 타입 정합) |
| 5. ★court (A)내부복제=기존PATCH 동일·import0 | ✅ 통과 | 기존 PATCH(`court-submissions/[subId]/route.ts`)와 1:1 대조: mapCourtType(indoor/3x3/outdoor)·region split·court_infos.create 전필드(좌표 37.5665/126.978)·submission.update(approved_court_info_id)·addXP(court_submit=10)·adminLog 전부 동일. resolve는 자체 mapCourtType 보유→기존 라우트 import/수정 0 |
| 6. 기존 라우트·schema·api/v1 미수정 | ✅ 통과 | `git status --porcelain`=오직 `?? inbox/[id]/`(신규 resolve 1건). 기존 game-reports/community/organizations/court-submissions PATCH·inbox 목록(route.ts)·prisma/schema.prisma·api/v1 전부 무변경. inbox 목록과 id 형식 정합(`<domain>:<refId>`·refId=BigInt.toString()↔BigInt(refId) 역변환) |
| 7. adminLog 각 도메인·snake/BigInt | ✅ 통과 | 6분기 각 adminLog(game_report.{action}·community.{action}·organization.{approve\|reject}·court.submission.{approve\|reject}·payment.refund.{action}). memo/reason 컬럼부재→changesMade에만 박제(game_reports/community 정합). apiSuccess 자동 snake 변환·응답 id=`.toString()`. adminId=`BigInt(session!.sub)`·addXP/apiError/apiSuccess 시그니처 전부 실측 정합 |

📊 종합: **7개 항목 전부 통과 / 0 실패**. isSuperAdmin 403(첫콜론 split)·6도메인 Zod+상태가드·payments status-only(refund_amount/refunded_at/status 미접촉·PG 0·멱등)·court 내부복제(기존 PATCH 1:1 동일·import 0)·기존 라우트/schema/api-v1 무수정·adminLog 각 도메인 모두 의도대로.

검증 명령: `tsc --noEmit`→EXIT 0 / `npm run build`→EXIT 0 + 매니페스트 라우트 등록 / `git status`→신규 1파일만 / 스키마 5모델 컬럼 실측(game_reports·community_posts·organizations·court_submissions·payments) / 기존 court PATCH 1:1 대조 / inbox 목록 id형식 정합. 수정 요청 없음.

⚠️ 참고(동작영향 0):
- **런타임 super_admin curl 미재현**: super_admin 세션 쿠키 확보 제약으로 HTTP 실호출 대신 build+정적+스키마/기존라우트 실측으로 대체(지시문 허용·S1~S2와 동일 방침). 403/Zod/상태가드/payments status-only는 코드 경로 전수 확인. super_admin 로그인 후 POST 1회 실확인 권장(차단요소 아님·런타임 미재현 = 0행/단일세션 한계).
- court 가드 미세차이(동작영향 0): 기존 PATCH=`session.role!=="super_admin"` / resolve=`isSuperAdmin()`(role OR admin_role). resolve가 admin_role도 인정하나 설계서 "콘솔 표준 isSuperAdmin 통일" 의도 반영·더 넓게 허용일 뿐 권한 약화 아님.
- payments는 status 컬럼(payments.status='paid' 등)과 무관하게 refund_status만 전환 — 실제 환불은 후속 PG 연동 시. 현재 메타 전환만(설계 (A) status-only 정합).

### Admin Console S1 — 처리 뮤테이션 1~3 검증 (2026-06-15, tester) — 신규 3파일 미커밋(untracked)

정적+build+스키마 실측 전부 통과. 8개 검증항목 0실패.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. tsc0·build·3라우트 등록 | ✅ 통과 | `tsc --noEmit` EXIT 0 / `build` ✓ Compiled 18.8s / 신규 `ƒ` 3개 등록(`game-reports/[id]/resolve`·`suggestions/[id]/respond`·`community/[id]/moderate`). ads/heatmap dynamic-server 로그는 기존 무관 |
| 2. ★403 가드(getWebSession+isSuperAdmin) | ✅ 통과 | **셋 다** 진입부 `if(!isSuperAdmin(session)) return apiError(...,403,"FORBIDDEN")`. is-super-admin.ts L48 session null→false→403(비로그인). super_admin만 통과 |
| 3. ★Zod 화이트리스트·옵션필드 | ✅ 통과 | resolve `action:enum[resolve,dismiss]`+memo?(max2000)+notify?(bool) / respond `status:enum[in_progress,resolved,dismissed]`+admin_response?(max5000)+notify? / moderate `action:enum[hide,restore]`+reason?(max2000). enum 위반→safeParse 실패→400 VALIDATION_ERROR. body 파싱실패→400 BAD_REQUEST |
| 4. status 전이 안전 | ✅ 통과 | game_reports=`status!=="submitted"`→400 INVALID_STATE(중복처리 방어) / suggestions=존재만 확인 후 status+admin_response+responded_by_id(session.sub)+responded_at(now) 갱신 / community=hide→hidden·restore→published(STATUS_BY_ACTION). 없는 id→404 NOT_FOUND(3종 공통) |
| 5. adminLog 3종·memo/reason은 로그만 | ✅ 통과 | `game_report.{action}`·`suggestion.respond`·`community.{action}` 각 기록. memo/reason→changesMade에만 박제. **스키마 실측**: game_reports(L1680~1700)에 memo 컬럼 부재·community_posts(L1102~)에 reason 컬럼 부재 → DB update는 status만(정합). suggestions admin_response/responded_by_id(BigInt?)/responded_at(DateTime?)는 실재 컬럼(L2051~2053)→DB 직접 갱신 |
| 6. ★notify (A)보류·createNotification 0 | ✅ 통과 | grep `createNotification`=**주석 2건만**(resolve/respond), import·호출 **0**. notify 파라미터는 Zod로 수신만, 발송 경로 부재 |
| 7. snake_case·BigInt·schema0·api/v1 0·단건update | ✅ 통과 | apiSuccess 자동 snake 변환 / 응답 id=`report.id.toString()` 등 BigInt→string. adminLog resourceId도 id.toString(). `git status prisma/`=schema 변경 0. api/v1 grep=0(미접촉). 전부 update 1건(트랜잭션·대량 0) |
| 8. 회귀(신규만·기존 영향0) | ✅ 통과 | `git status` 3파일 전부 `??`(untracked 신규). 기존 game-reports/route.ts·stats 무변경(추적 파일). src/ 내 다른 변경은 gallery/page.tsx(별도 P2 세션, S1 무관) |

📊 종합: **8개 항목 전부 통과 / 0 실패**. 403가드(셋 다)·Zod 화이트리스트(enum 위반 400)·status 전이 안전(game_reports submitted 가드/suggestions DB갱신/community hidden·published)·adminLog 3종(memo·reason 컬럼부재→로그만 정합)·notify (A)보류(createNotification 호출0)·snake/BigInt/schema0/api-v1 0/단건update·회귀0 모두 의도대로.

검증 명령: `tsc --noEmit`→EXIT 0 / `build`→✓ 18.8s + 신규 3라우트 등록 / createNotification grep→주석만 / api/v1 grep→0 / schema git status→변경0 / 스키마 컬럼 실측(game_reports·community_posts·suggestions). 수정 요청 없음.

⚠️ 참고(동작영향 0):
- **런타임 super_admin curl 미재현**: super_admin 세션 쿠키 확보 제약으로 HTTP 실호출 대신 build+정적+스키마 실측으로 대체(지시문 허용·S2와 동일 방침). 403/Zod/status 전이 가드는 코드 경로 전수 확인. super_admin 로그인 후 POST 1회 실확인 권장(차단요소 아님).
- community_posts.status는 String?(nullable)이나 STATUS_BY_ACTION이 항상 non-null(hidden/published) set → null 잔존 위험 0.

### 버킷B P1-b 시즌 시상 고급필드 검증 (2026-06-15, tester) — 미push 3커밋(78f087c/544a1ba/da281aa)

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1a. git diff --stat 3커밋 | ✅ 통과 | 8파일 986+/35-. schema+admin(page/content/action/상수/sidebar)+awards(page/content). 명세 정합 |
| 1b. `npx tsc --noEmit` | ✅ 통과 | EXIT 0. taskkill node 미사용 |
| 2. schema ADD-only | ✅ 통과 | season_awards CREATE1+INDEX3((series_id,category)/(season_year)/(user_id))+FK4(user/team/series=SetNull·created_by=NoAction). 기존모델 ALTER/DROP 0(User/Team/tournament_series는 relation줄 ADD만). series_id **BigInt?** 포함. category **VarChar**+Zod 8종 화이트리스트(season-award-categories.ts) |
| 3. ★AW1 기본부 회귀(핵심) | ✅ 통과 | `git diff` page.tsx 3커밋 전체 **삭제(-)라인 0** 실측. hunk 헤더=DTO확장(L93/L105)+블록7 ADD(L568 **다음**)+반환객체확장(L579). 기존블록 L186~569 영역 hunk 미진입=1글자도 미접촉. officialMatchWhere grep 매치0(미접촉) |
| 4a. admin super_admin 가드 | ✅ 통과 | page.tsx `isSuperAdmin(session)` false→`/admin?error=no_permission` redirect. action requireSuperAdmin(role!=="super_admin"→throw). sidebar 메뉴 roles=["super_admin"] |
| 4b. INSERT/수정·선수검색 재사용·신규라우트0 | ✅ 통과 | upsert=id有 update/id無 create(payload comment·quote 조립). 선수검색=기존 `/api/web/admin/users/search` fetch(L104) 재사용. **신규 route.ts 0건** 실측 |
| 4c. 카테고리 8종 화이트리스트 | ✅ 통과 | isSeasonAwardCategory 8종(all_star_1st/2nd·coach_of_year·new_face·mvp_quote·best_defense·manner·rating_up). 8종 외→조용히 return. user·team·payload 전부 비면→거부 |
| 5. /awards 고급부 빈슬롯·"집계 중" | ✅ 통과 | 블록7 try-catch 격리, currentSeriesId 기준 findMany→카테고리별 분류(8종 DTO). best5 수비/신인·cats 스틸·올스타/감독/MVP코멘트/매너/레이팅 빈슬롯. 미입력→null/빈배열→"집계 중"/"준비 중"/빈상태. **mock 금지 주석 다수**(더미 0) |
| 6. snake_case 정합 | ✅ 통과 | content 선수검색 `json.data.users`(apiSuccess snake 변환 인지). page.tsx server prisma는 camel 접근. payload Json comment/quote 안전추출 |
| 7. 강조색·하드코딩hex·lucide·9999·api/v1 | ✅ 통과 | 강조색 `var(--cafe-blue)`(빨강폴백 함정 회피 주석). 하드코딩hex **0**·lucide **0**·9999 **0**·api/v1 변경 **0** 실측 |
| 8. count 실측(season_awards 0행) | ✅ 통과 | `prisma.season_awards.count()`=**0**(박제 전 정상). 임시스크립트→즉시삭제(가드3) |

📊 종합: **11개 항목 전부 통과 / 0 실패**. schema ADD-only(series_id BigInt?·category VarChar 8종)·★AW1 기본부 삭제라인0·super_admin 가드·신규라우트0(선수검색 재사용)·8종 화이트리스트·빈슬롯 "집계 중"(mock 0)·snake정합·cafe-blue·하드코딩0·count0 모두 정상.

⚠️ 참고(동작영향 0): season_awards 0행이라 admin 입력→/awards 채움 end-to-end 런타임 미재현(코드/스키마 정합 전수 확인). 1행 입력 후 빈슬롯→실데이터 1회 확인 권장(0행=정상·차단요소 아님).

### Admin Console S2 — overview/inbox 2 API 검증 (2026-06-15, tester)

정적+build+운영DB 실측 전부 통과. 읽기전용·schema0·snake·KST경계·403가드 모두 정상.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1a. `npx tsc --noEmit` | ✅ 통과 | EXIT 0 (에러 0) |
| 1b. `npm run build` + 라우트 등록 | ✅ 통과 | `✓ Compiled successfully in 22.5s` / 신규 `ƒ /api/web/admin/overview`·`ƒ /api/web/admin/inbox` 둘 다 등록. ads/heatmap dynamic-server 로그는 기존 무관 |
| 2. ★403 가드(getWebSession+isSuperAdmin) | ✅ 통과 | 두 라우트 모두 진입부 `if(!isSuperAdmin(session)) return apiError(...,403,"FORBIDDEN")`. is-super-admin.ts L49=`role==="super_admin"||admin_role==="super_admin"`. 비로그인(session null)→isSuperAdmin false→403. super_admin만 통과 |
| 3. ★snake_case(apiSuccess 자동변환) | ✅ 통과 | response.ts L6 `apiSuccess=convertKeysToSnakeCase`. 응답키 kpis/queue/new_users/month_revenue·items/next_cursor 전부 snake. id BigInt→`.toString()`(4모델 id 전부 BigInt 확인) / final_amount Decimal→`Number(..??0)` / title·name `|| 폴백` |
| 4a. overview KPI 매핑 | ✅ 통과 | new_users=User.createdAt≥KST오늘0시(+어제대비 delta+7일 day-bucket trend) / active_games=games.status in[1,2](games.status=Int 정합) / month_revenue=payments status=paid+paid_at≥KST월초 _sum.final_amount→Number / recruiting=tournament.status in[6종 화이트리스트] |
| 4b. overview queue 6종 | ✅ 통과 | game_reports(submitted)/community_posts(draft)/teams=**0 고정(DB미지원 주석)**/payments(refund_status=requested)/court_submissions(pending)/organizations(pending). 5종 실count+teams 0 |
| 4c. ★KST 경계 실측(UTC+9) | ✅ 통과 | 운영DB 실행: todayStart=`2026-06-14T15:00Z`=KST 6/15 00:00 ✓ / monthStart=`2026-05-31T15:00Z`=KST 6/1 00:00 ✓. kstMidnightUtc/kstMonthStartUtc 9h 보정 정확 |
| 4d. overview 실데이터 동작 | ✅ 통과 | 운영DB 실측: new_users=0·active_games=158·month_revenue=0·recruiting=4 / queue game_reports=0·community(draft)=88·payments=0·court_submissions=0·organizations=0. month_revenue paid 0건→0 폴백 정상 |
| 5a. inbox 6소스 union·item 구조 | ✅ 통과 | reports/posts/courts/orgs/refunds 5소스 findMany(소스별 take 200)+teams 0. item={id:`<domain>:<refId>`,domain,route,severity,priority,title,sub,created_at,snoozed_until:null} |
| 5b. inbox severity(err/warn/blue) | ✅ 통과 | game_reports·payments=err(0) / community_posts=warn(1) / court_submissions·organizations=blue(2). SEVERITY_PRIORITY 가중치 정합 |
| 5c. inbox 정렬·take50·next_cursor | ✅ 통과 | priority: severity 가중치 asc→동일시 created_at asc / age: created_at asc. slice(start,start+50). next_cursor=start+50<len?start+50:null. **community draft 88건>50→items 채워지고 next_cursor 발생 경로 실데이터로 활성** |
| 5d. inbox domain/severity 필터 | ✅ 통과 | `want(d)=!domainFilter||domainFilter===d`로 소스별 조회 절감. severityFilter는 정규화 후 filter |
| 6. ★읽기전용·schema0 | ✅ 통과 | grep: update/updateMany/delete/deleteMany/create/createMany/upsert/$executeRaw/$queryRaw **0건**(count/aggregate/findMany만). `git status prisma/`=변경0(신규 모델 0) |
| 7. api/v1 미접촉·기존 보존 | ✅ 통과 | 변경=신규 2파일뿐. 기존 모델 무변경. apiError 시그니처 정합(overview L180 code 생략=정상) |

📊 종합: **15개 항목 전부 통과 / 0 실패**. 403가드·snake·KPI4/queue6 매핑·KST경계(UTC+9 실측)·inbox union/severity/정렬/페이지네이션·읽기전용(쓰기0)·schema0 모두 의도대로 동작. 운영DB 실측으로 KPI/queue/inbox(draft88건) 실데이터 경로까지 확인.

검증 명령: `tsc --noEmit`→EXIT 0 / `build`→✓ 22.5s + 신규 2라우트 등록 / 쓰기작업 grep→0건 / 운영DB count 실측(임시스크립트 작성→즉시삭제 가드3). 수정 요청 없음.

⚠️ 참고(동작영향 0):
- **런타임 super_admin curl 미재현**: super_admin 세션 쿠키 확보 제약으로 HTTP 실호출 대신 build+정적+운영DB count로 대체(지시문 허용). 403 가드는 코드 경로 전수 확인. super_admin 로그인 후 GET 1회 실확인 권장(차단요소 아님).
- inbox 소스별 `take:200` 상한 — union 후 정렬/페이지네이션 대상. 단일 소스가 200건 초과 시 최신순 누락 가능하나 현 운영 규모(최대 draft 88)에선 무영향. 대량 누적 시 cursor 전략 재검토 후속.

### PR-AUTOCOMPLETE ②cron + PR-CHAMPION ①우승팀유틸 검증 (2026-06-15, tester)

정적+vitest+build 전부 통과. 멀티세션(court) 무관 에러 0.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| 1. tsc + set-champion 11 PASS | ✅ 통과 | `tsc --noEmit` EXIT 0 / vitest set-champion **11 PASS** |
| 2. ★FK 변환 강제 (tt.id 직접 set 없음) | ✅ 통과 | knockout결승(L118)·폴백(L131)·리그1위(L145) 전 경로가 `tournamentTeamToTeamId()` 경유→tt.teamId 반환. champion_team_id에 winner_team_id/tt.id 직접 박제 0. 테스트가 winner=999→teamId=42 단언 |
| 3. 포맷판정 (knockout결승/리그1위/다조null) | ✅ 통과 | KNOCKOUT 4종=isFinalsRound(결승/final/finals/championship)+next_match_id null 폴백(round_number 최대) / LEAGUE 2종=rank===1 / group_stage 다조=즉시 null(매치조회조차 안 함) |
| 4. 멱등 (champion 있으면 skip·mvp 미접촉) | ✅ 통과 | L184 champion_team_id!==null→skip. update data={champion_team_id}만(mvp 미포함). 테스트 "이미 champion→update 미호출" 단언 |
| 5. ★finalize 통합 (updated:true 분기·try-catch 격리) | ✅ 통과 | L238 `updated===true` 분기 **내부**에서만 setTournamentChampion 호출(매 매치 아님). L252~265 try-catch 격리→catch는 console.error만(종료흐름 차단 0, warnings 미추가) |
| 6. 회귀 (결승없는 포맷 안전·종료흐름 영향0) | ✅ 통과 | 결승미정/다조=null→no-op(update 미호출). 산출/박제 실패가 finalize return 차단 0 |
| 7. build + cron 5 PASS | ✅ 통과 | `npm run build` ✓ Compiled successfully 25.1s / vitest cron **5 PASS**(KST 새벽·자정직후·자정직전·당일보호·어제처리) |
| 8. ★★매치0 가드 (findMany+updateMany 둘다 none:{}) | ✅ 통과 | findMany(L126) + updateMany(L163) **둘 다** `tournamentMatches:{none:{}}`(race 재가드). 진짜 경기 대회(매치≥1) 강제종료 불가=생명선 |
| 9. Bearer 401 / champion·mvp 미접촉 / KST 당일보호 | ✅ 통과 | L111 `Bearer ${CRON_SECRET}` 불일치→401. updateMany data=status만(champion/mvp 0). `effectiveDate < boundary`(L142)=어제까지만, 당일 보호 |
| 10. vercel.json 기존 보존 + 신규1 | ✅ 통과 | 기존 cron 10건 그대로 + `auto-complete-tournaments` `"0 18 * * *"`(KST03:00) 1건 추가(L47~50). 총 11건 |

📊 종합: **10개 항목 전부 통과 / 0 실패**. ①우승팀 유틸(FK 변환 강제·포맷별 판정·멱등·finalize 격리통합) + ②cron(매치0 이중가드·Bearer·KST 당일보호·vercel.json 보존) 모두 의도대로 동작.

검증 명령: `tsc --noEmit`→EXIT 0 / `vitest set-champion+auto-complete`→**16 PASS**(11+5) / `build`→✓ 25.1s + 신규 `ƒ /api/cron/auto-complete-tournaments` 등록. 멀티세션 court-submission(admin-courts-content.tsx)發 에러 0. ads/heatmap dynamic-server 로그는 기존 무관. 수정 요청 없음.

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

### Admin Console S3 — AdminInboxState snooze/resolve (2026-06-15, reviewer) — 미커밋

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

실측 근거: snooze/route.ts·inbox/route.ts·resolve/route.ts 전문 정독 · schema.prisma AdminInboxState L3531~3544 실측(9컬럼·snake @map·@@unique([refType,refId])) · **DB 실측**(information_schema: 컬럼 9개·data_type·nullable 모델과 일치 / 인덱스 2=pkey+ref_type_ref_id_key / live_scoreboards count=0 무영향 / admin_inbox_state count=0) · isSuperAdmin 헬퍼(narrowing 안 함→non-null 단언 정당) · apiSuccess/apiError 시그니처 정합.

✅ 잘된 점:
- **★DB 안전 만점**: raw DDL CREATE만(db push 미사용)→live_scoreboards DROP 위험 회피 성공(count=0 실측). 테이블 구조가 schema 모델과 100% 일치(9컬럼·snake_case @map·복합 unique idx). 단일 DB 정책 가드 준수.
- **★snooze 제외 로직 정확**: `snoozedActive(snoozed_until>now) || resolved(resolved_at!=null)` 제외 — 만료된 스누즈는 자동 복귀(>now 비교). include_snoozed=1 분기로 재확인 경로 보장. batch 조회(refType IN ∪ refId IN → Map 정확매칭)로 **N+1 없음**. 교차곱 IN 후보를 stateMap.get(it.id) 정확 키로 좁혀 위양성 0.
- **★snooze API 견고**: isSuperAdmin 403 가드·Zod datetime(ISO8601)·upsert 복합키(refType_refId)로 리소스당 상태 1건 보장(중복 snooze 불가). id 위변조=세션 기반, refId는 단순 보관(권한 우회 경로 없음).
- **★markResolved best-effort**: try/catch로 메타 upsert 실패해도 원본 처리 차단 0(응답 정상). resolved_by=session.sub 일관. 6도메인(game_reports/community/orgs/court/payments/teams) 전부 처리 성공 직후 markResolved 호출(누락 0).
- **★id 파싱 일관**: snooze=indexOf(":") slice / resolve=indexOf(":") slice / 목록=indexOf(":")+1 slice — 첫 콜론 기준 3곳 동일 규칙(refId 콜론 포함 대비). union 박제 키와 정합.
- **회귀 0**: snooze/resolve 메타 없으면 stateMap.get=undefined→기존 동작 그대로(snoozed_until=null·제외 0). in-place splice는 역순 순회(인덱스 안전). snake(apiSuccess 자동변환)·BigInt→toString 정합.

🟡 권장 수정 (minor, 동작 차단 0):
- [snooze/route.ts L42·L85] `adminId = session!.sub` 추출 후 `void adminId`로 미사용 처리 — 스누즈 행위자 미기록(주석에 "감사 필요 시 별도 컬럼" 명시). 의도된 보류·동작 무관. 향후 snoozed_by 컬럼 추가 시 활용 여지.
- [resolve/markResolved] community_posts resolve는 **상태 무관 처리**(findUnique만, status 가드 없음) — 기존 S1-5 설계 답습(community는 hide/restore 양방향이라 정상). 본 S3 변경(markResolved 호출 추가)은 거기에 영향 0. 기록만.

ℹ️ 참고(수정 불요):
- raw DDL이라 DB 레벨 `id`/`updated_at` default 부재 실측 — 단 `@default(cuid())`/`@updatedAt`은 **Prisma 앱 레이어** 처리라 prisma.adminInboxState 경유 시 정상 채워짐(코드 전부 Prisma 경유=안전). 향후 raw SQL INSERT 직접 시에만 주의(현재 경로 없음).
- snooze는 미래/과거 시각 모두 허용(과거=즉시 만료=노출 유지). 의도된 유연성.

→ **수정 요청 테이블 등록 안 함**(필수 0). APPROVE 그대로 머지 가능.

### Admin Console S1-4 팀 검수 (옵션2) (2026-06-15, reviewer) — 8파일 미커밋

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 3)

실측 근거: 변경 8파일 전문 정독 · schema.prisma 실측(Team L402~483 / TeamMember L532~546) · Team.captainId BigInt @map captain_id L418 · is_public Boolean? L421 · TeamMember.userId @map user_id L535 · status 인덱스 L480 + (status,city) 복합 L481 실재 · 옵션2 OR 분기 ↔ groupBy active-only 대조 · review 라우트 ↔ resolve teams case 1:1 대조 · teamReviewQueueWhere 단일 source 3파일(overview/inbox/team-status) 정합.

✅ 잘된 점:
- **★★옵션2 가시성 보안 정확(회귀 0)**: 비로그인/타인 visibilityWhere = `{status:active, is_public:true}` — 기존과 100% 동일. 로그인 시에만 OR 3분기 추가(active+public / pending+captainId나 / pending+teamMembers.some.userId나). **OR 첫 항목이 비로그인 조건과 동일** → 비공개 active 팀은 로그인 전후 모두 동일 노출(회귀 0). 타인 pending은 어느 분기에도 안 걸림(절대 숨김).
- **★본인 식별 위변조 불가**: myId=`BigInt(session.sub)`(세션 기반·클라 입력 0). captainId/teamMembers.userId 둘 다 세션 sub와 비교 → 위조 경로 없음. getWebSession try-catch 폴백으로 세션 실패 시 비로그인 취급(공개 API 보장·열림 0).
- **★상세 가드 정확**: 본조회 직후 `status!=="active"`면 본인(captainId===viewerId OR active멤버)만 통과·그외 notFound. teamMembers는 본조회 `status:"active"` include 재사용(추가 쿼리 0). **notFound가 무거운 집계(tournamentTeam 등 L126~) 전에 실행**(낭비 차단). active 팀은 가드 무통과=전원 공개(현행 유지).
- **★where AND 배열 충돌 방지**: 가시성 OR + q OR + city를 최상위 `AND:[...]` 로 묶음 → 같은 OR 키 덮어쓰기 버그 회피. 정렬 화이트리스트(wins/newest/members) 유지.
- **팀 생성 pending_review 전환 안전**: actions/teams L86 status만 PENDING_REVIEW로 교체·나머지 흐름(트랜잭션 team.create+teamMember.create captain) 무변경. 생성 직후 본인은 captainId 분기로 목록·상세 모두 노출(끊김 0). team-applications 흐름 미접촉.
- **review API 견고**: getWebSession+isSuperAdmin→403. Zod{action,reason?}. BigInt(id) try-catch→400. **pending_review만 처리**(active 93건 소급→INVALID_STATE 정상). reason→adminLog(컬럼 부재). resolve teams case와 로직 1:1 동일(라우트 import 0=결합 0).
- **S2 3파일 회귀 0**: overview는 qTeamsReview만 Promise.all에 추가(kpi/타 큐 무영향)·inbox는 teams 소스 push만 추가(타 5소스 무변경)·resolve는 teams case 추가+기존 UNSUPPORTED 분기 제거. **teamReviewQueueWhere 단일 source**로 overview count ↔ inbox 목록 기준 일관. groupBy 도시목록은 active-only 유지(검수대기 팀이 도시 필터 오염 안 함).
- **스키마/성능 정합**: schema 0·api/v1 0·디자인 0. id BigInt→toString. snake(apiSuccess 자동변환). 목록 OR 쿼리는 status 인덱스 L480 활용 가능.

🟡 권장 수정 (minor, 동작 차단 0):
- [teams/route.ts] **OR 분기 미들 항목 `is_public` 미지정** — pending+captainId / pending+teamMembers 분기에 is_public 조건 없음(의도적·본인은 비공개라도 자기 검수대기 팀 봐야 함=정상). 다만 본인의 active **비공개** 팀은 OR 첫 항목(active+public)에서 제외돼 목록에 안 나옴 — **이건 기존 동작이고 본 변경 범위 밖**(회귀 0). 기록만.
- [중복 로직] review 라우트 ↔ resolve teams case가 **수동 1:1 복제**(S1-5 court와 동형 트레이드오프). 향후 팀 검수 로직 변경 시 양쪽 동시 수정 필요(drift 위험). 공통 유틸 추출은 범위밖 후속.
- [teams/route.ts] **switch/update 류 아닌 findMany는 .catch(()=>[]) 폴백** 있으나 session OR 분기에서 teamMembers.some 중첩 쿼리 비용 — pending_review 건수가 적어(큐 대상) 실무 영향 0. 인덱스로 충분.

ℹ️ 참고(수정 불요):
- 상세 가드의 본인 멤버 판정은 `status:"active"` 멤버만(휴면/탈퇴 멤버는 본인이어도 상세 못 봄) — 검수대기 팀은 보통 생성 직후라 captain만 존재·실무 무해. 의도된 보수적 가드.
- 팀 생성 직후 pending_review 동안 타 기능(팀 상세 탭/대회 신청 등)에서 노출 경로가 있는지는 본 8파일 범위 밖(목록·상세·검수만 검증). 별도 도메인 노출은 후속 census 여지.

→ **수정 요청 테이블 등록 안 함**(전부 권장/후속, 필수 0). APPROVE 그대로 머지 가능.

### Admin Console S1-5 — 통합 디스패처 (2026-06-15, reviewer) — 신규 1파일 미커밋

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 3)

실측 근거: `inbox/[id]/resolve/route.ts` 전문 정독 · 기존 court-submissions PATCH(`[subId]/route.ts`)·organizations approve/reject route 와 1:1 대조 · schema.prisma 6모델 컬럼 실측(court_submissions L1451·organizations L2519·payments L1868·game_reports L1680·community_posts L1102) · `is-super-admin.ts`/`admin/log.ts`/`org-permission.ts` 의존성 시그니처 확인 · inbox(목록) 큐 조건과 디스패처 처리 조건 정합 대조.

✅ 잘된 점:
- **★보안 가드·id 파싱 견고**: 첫 줄 `getWebSession()`+`isSuperAdmin(session)`→비통과 403. id 분해는 `indexOf(":")`(첫 콜론 기준→refId에 콜남아도 안전)+`sep<0`/빈 refId 둘 다 400 BAD_ITEM_ID. domain 화이트리스트 2중(teams 명시 400 UNSUPPORTED_DOMAIN + SUPPORTED_DOMAINS includes 검증→UNKNOWN_DOMAIN). **BigInt(refId) try-catch로 감싸 악의적 비숫자 refId→400 BAD_ITEM_ID**(S1 minor였던 BigInt unhandled 500을 여기선 방어함=개선). req.json() 파싱 실패도 try-catch 400.
- **★★payments 금전 안전 완벽**: update data=`refund_status`+`updated_at`만(refund_amount/refunded_at/payments.status **미포함** 실측). PG fetch 0. `refund_status==="requested"` 인 건만 처리→재처리 시 INVALID_STATE 차단(멱등). adminLog severity:"warning"(금전 강조). inbox 큐 조건(refund_status=requested)과 정확히 정합.
- **★court (A)내부복제 정확(1:1 실측)**: 기존 PATCH route 와 mapCourtType·region split(첫토큰 city)·photos 폴백·트랜잭션 3단(court_infos.create+submission.update+addXP)·기본좌표(37.5665/126.978)·metadata(source/submission_id/fee_text/operating_hours_text/photos)·adminLog(트랜잭션 외)·반환객체(court_info_id) **전부 동일**. import 0(결합 0·회귀 0). pending findFirst 멱등.
- **organizations 정합**: reject `reason?.trim()` 비면 REASON_REQUIRED 400(기존 reject route 동일). approve/reject 둘 다 pending 가드(INVALID_STATE). 컬럼 approved_at/approved_by·rejection_reason/rejection_at 실측 정합.
- **game_reports**: submitted만 처리(중복 INVALID_STATE). memo→adminLog(컬럼 부재 실측 정합). community: hide→hidden/restore→published.
- **공통 직렬화·adminLog 정합**: 응답 id 전부 `.toString()`(apiSuccess 자동 snake). adminLog resourceId=숫자형 toString→내부 BigInt() 재변환 안전. `session!.sub`은 isSuperAdmin 통과 후라 안전. schema 0/api/v1 0/기존 6도메인 route·inbox 목록 미수정(신규 1파일만·회귀 0).

🟡 권장 수정 (minor, 동작 차단 0):
- [resolve route] **switch 본문 update에 try-catch 부재** — id 파싱/json은 try-catch 있으나 prisma update·$transaction·addXP DB 장애 시 unhandled→Next 기본 500. 동작 무해(클라 500)하나 inbox(목록 route)는 try-catch로 500 apiError 래핑함 → 일관성 위해 switch 전체 try-catch+apiError("...",500) 여지. court approve의 addXP 실패는 트랜잭션 내라 롤백되나 클라엔 500 노출. 정상 입력 환경 미재현.
- [organizations] **가드가 기존 route 보다 좁음(canManageOrganizations→isSuperAdmin)** — 기존 approve/reject route 는 `canManageOrganizations`(super_admin OR org_admin) 허용. 디스패처는 super_admin만. org_admin 은 디스패처로 단체 처리 불가. **단 inbox 목록 자체가 isSuperAdmin 가드라 org_admin은 인박스 진입 불가→일관**(권한 축소=더 엄격·보안 위험 0). developer 노트의 "디스패처 표준 isSuperAdmin 통일" 의도와 일치. 향후 org_admin 운영 도입 시 재검토.
- [community_posts] **큐 의미(draft)↔액션 의미(hide/restore) 어긋남** — inbox 큐는 `status:"draft"`("검수 대기")인데 디스패처는 hide→hidden/restore→published만. draft 항목에 restore=발행 승인, hide=숨김으로 동작은 안전(상태 전환만)하나 의미가 직관과 다름. 상태 가드 없음(draft 외 상태도 전환 가능)=의도 범위. 라벨/액션명 정합은 후속 UI 단계 정리 여지.

ℹ️ 참고(수정 불요):
- court 트랜잭션이 기존 PATCH 와 **수동 복제**라 향후 PATCH 변경 시 동기화 누락(drift) 위험 존재 — (A)채택의 알려진 트레이드오프(결합 0 대가). court 승인 로직 변경 시 양쪽(디스패처+PATCH) 동시 수정 필요. 공통 유틸 추출은 범위밖 후속.
- court approve 가드는 기존 PATCH(`session.role!=="super_admin"`, admin_role 미고려)보다 디스패처가 살짝 넓음(isSuperAdmin=role OR admin_role). 실사용 admin_role=super_admin 케이스 한정이라 무해.

→ **수정 요청 테이블 등록 안 함**(전부 권장/후속, 필수 0). APPROVE 그대로 머지 가능.

### Admin Console S1 — 처리 뮤테이션 1~3 (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

실측 근거: 신규 3 route.ts 전문 정독 · `is-super-admin.ts`/`admin/log.ts`/`api/response.ts` 의존성 시그니처 확인 · schema.prisma game_reports(L1680)/suggestions(L2042)/community_posts(L1102) 컬럼 실측.

✅ 잘된 점:
- **보안 가드 견고(★)**: 셋 다 첫 줄 `getWebSession()`+`isSuperAdmin(session)` → 비통과 403 FORBIDDEN. isSuperAdmin은 null/undefined 안전(미로그인 false) + role/admin_role 둘 다 평가. 비super_admin·비로그인 모두 차단. admin 전역 처리라 IDOR 무관(대상은 findUnique 존재검증 후 처리).
- **입력 Zod 화이트리스트 견고**: action/status 전부 `z.enum`(resolve|dismiss / in_progress|resolved|dismissed / hide|restore) — 화이트리스트 외 값 400 VALIDATION_ERROR. memo/admin_response/reason은 `.trim().max()` 제한. req.json() 파싱 실패도 try-catch로 400 BAD_REQUEST 분리. BigInt(id) 변환은 잘못된 id 시 throw→500이나 동작상 무해(아래 minor).
- **status 전이 멱등/가드 정합**: game_reports=`submitted`만 처리(이미 처리된 건 INVALID_STATE 400 재처리 차단)★. suggestions/community는 존재만 확인 후 전환(상태 무관 전환 허용=의도). community default published 정합(restore→published).
- **위변조 불가**: suggestions `responded_by_id=BigInt(session!.sub)` — 클라 입력 아닌 세션에서 박제. `session!` non-null은 isSuperAdmin 통과 후라 안전(narrowing 헬퍼 미지원분 명시적 보강).
- **스키마 실측 정합(★)**: game_reports에 `memo` 컬럼 **부재** 확인(comment만 존재) → adminLog.changesMade 박제 타당. suggestions status/admin_response/responded_by_id(BigInt?)/responded_at(DateTime?) **4컬럼 전부 실재** → DB 직접 갱신 정합. community_posts status(default published) 실재. community reason 컬럼 부재 → adminLog 박제 타당.
- **adminLog 적절**: action명(`game_report.resolve`/`suggestion.respond`/`community.hide` 등 도메인.동작)·resourceType(GameReport/Suggestion/CommunityPost)·resourceId(id.toString()→adminLog 내부 BigInt() 재변환 정합)·changesMade(status+memo/reason/admin_response). adminLog 내부 try-catch로 로깅 실패가 메인 플로우 차단 0.
- **notify (A)보류 정합**: Zod로 notify 파라미터 수신만, createNotification import·호출 **0**(주석으로 후속 위치만 박제). snake/BigInt 직렬화 정합(apiSuccess 자동 snake + id.toString()). schema 0 / api/v1 0 / 신규 라우트만(회귀 0). apiSuccess/apiError 시그니처 일관(message,status,code).

🟡 권장 수정 (minor, 동작 차단 0):
- [3개 route 공통] **메인 update에 try-catch 부재** — `req.json()` 파싱은 try-catch 있으나, `BigInt(id)`(잘못된 id 문자열) 및 `prisma.update`(DB 장애) 실패 시 unhandled→Next.js 기본 500. 동작상 무해(클라엔 500 반환)하나, 다른 라우트와 일관성 위해 500 catch + apiError("...",500,"INTERNAL_ERROR") 래핑 여지. 0행/정상 입력 환경에선 미재현.
- [game-reports/suggestions] **resourceType 표기 vs S2 컨벤션** — resourceType="GameReport"/"Suggestion"(PascalCase). adminLog 다른 호출부와 표기 통일됐는지 1회 확인 권장(기능 영향 0, 감사 필터 일관성용).

ℹ️ 참고(수정 불요):
- community moderate는 상태 무관 전환(hide된 글 재hide 가능) — 멱등 아니나 결과 동일(idempotent in effect)·감사 로그만 중복. 의도 범위.
- BigInt(id) 변환 실패(비숫자 id)는 라우트 매칭상 거의 없음([id] 세그먼트). 위 minor 1에 포함.

→ **수정 요청 테이블 등록 안 함**(전부 권장/후속, 필수 0). APPROVE 그대로 머지 가능.

### 버킷B P1-b 시즌 시상 고급필드 (2026-06-15, reviewer) — 미push 3커밋(78f087c/544a1ba/da281aa)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 2)

실측 근거: 3커밋 diff 전수 정독(986+/35-) · `git diff origin/subin..HEAD -- awards/page.tsx` 삭제라인 **0** 실측 · schema diff(ALTER/DROP 0) · `--cafe-blue`/`--ink-mute` globals.css 라이트/다크 양쪽 정의 grep · `npx tsc --noEmit` **EXIT 0**.

✅ 잘된 점:
- **★AW1 기본부 보존 완벽**: awards/page.tsx = **120 insertions / 0 deletions** 실측. 기존 5블록(MVP·득점/어시/리바 leaders·우승팀) 쿼리·officialMatchWhere·DTO 필드 1글자도 미접촉. 블록7(season_awards)은 champions try-catch 다음 순수 ADD. DTO 8필드 확장도 기존 필드 위에 append만.
- **빈슬롯 교체 안전(핵심)**: leaders 실슬롯(득점/어시/리바)=`fromLeader`로 기존 데이터 그대로 / 빈슬롯(수비·신인·스틸→레이팅·매너)만 `fromAward`로 season_awards 채움. `Slot` 정규화 타입으로 PlayerRefDTO·SeasonAwardPlayerDTO 둘 다 같은 셀 렌더 — 타입 정합(tsc 0). 미입력 시 전부 null→"집계 중" 빈상태(mock 0).
- **schema ADD-only 무중단**: CREATE TABLE 1 + relation 4(User 2·Team 1·tournament_series 1 양방향) + INDEX 3. ALTER/DROP/DELETE 0. FK = user/team/series SET NULL(수상자·팀·시즌 삭제돼도 행 보존), created_by NoAction(관리자 기록 보존) — 정합. category=VarChar+코드 Zod 화이트리스트(enum ALTER 회피 컨벤션).
- **권한 가드 견고**: admin action upsert/delete 둘 다 첫 줄 `requireSuperAdmin()`(role!=="super_admin"→throw). page.tsx `isSuperAdmin` 가드+redirect. sidebar 메뉴 roles:["super_admin"] 한정. created_by=session.sub 박제. super_admin 전역관리 권한이라 타인 시상 수정/삭제는 IDOR 아님(의도).
- **선수검색 신규 라우트 0**: 기존 `/api/web/admin/users/search` 재사용. 응답 `json?.data?.users`(apiSuccess snake 변환) + `json?.users` 폴백 — snake_case 함정 회피.
- **null 가드 정합**: user_id/team_id 둘 다 null이고 payload(comment/quote)도 비면 upsert 조용히 거부(L80). page.tsx toDTO에서 recipient/team null 안전 폴백. 강조색 var(--cafe-blue)(빨강 폴백 함정 회피)·삭제 var(--color-error)·하드코딩hex 0·lucide 0.

🟡 권장 수정 (minor, 동작 차단 0):
- [awards-content.tsx best5 "수비" + catSlots "스틸왕"] **bestDefense 중복 매핑** — `data.bestDefense`가 베스트5 "수비" 슬롯과 부문별 "스틸왕" 슬롯 **양쪽에 동시 렌더**. season_awards에 best_defense 1행 입력 시 같은 수상자가 2곳 표시. 의도(수비=스틸 동일 카테고리 공유)면 OK, 아니면 스틸왕용 별도 카테고리 필요. 0행이라 런타임 미재현·동작 차단 0. → 표시 의도 1회 확인 권장.
- [page.tsx 블록7 where] **series 미지정(전체) 시 series_id 무관 전체 조회** — `currentSeriesId ? {series_id} : {}`. "전체 시즌" 보기에서 모든 시즌 시상이 카테고리별로 섞여 첫 행만 노출(coachOfYear 등 단일 카테고리는 `?? dto`로 첫 행 고정). 여러 시즌 누적 후 "전체"에서 어느 시즌 감독이 뜰지 불확정. 현재 0행·단일시즌이라 무해. → season_year/series 필터 우선순위 후속 정리 여지(설계 결재대로 series 1순위라 의도 범위).

ℹ️ 참고(수정 불요):
- page.tsx 블록7 try-catch가 빈 catch(에러 미로깅)→전부 빈상태 폴백. 기본부 영향 0 관점 안전(S2 라우트 컨벤션 동일).
- admin update가 `where:{id}`만(소유 검증 없음) — super_admin 전역관리 의도라 IDOR 아님. created_by는 create 시에만 박제(update 시 미변경=원입력자 보존, 정합).

→ **수정 요청 테이블 등록 안 함**(전부 권장/후속, 필수 0). APPROVE 그대로 머지 가능. minor 2건은 0행·단일시즌 환경에선 미재현.

### Admin Console S2 — overview/inbox 2 API (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 3)

실측 근거: schema 8모델 status/필드 타입 직접 grep / is-super-admin.ts·response.ts·case.ts 정독 / 인덱스 보유 실측. (런타임 curl은 super_admin 세션 제약으로 build+정적검증 대체 — developer/tester 증빙 채택)

✅ 잘된 점:
- **보안 가드 견고**: `isSuperAdmin(session)` = role OR admin_role "super_admin" + null/undefined 방어(미로그인 false). 비-super(association_admin 등) 전부 403 FORBIDDEN. 두 라우트 모두 본문 진입 전 가드. 전역 집계라 IDOR 무관(특정 유저 리소스 접근 0).
- **직렬화 안전(핵심)**: inbox 모든 id(game_reports/community_posts/court_submissions/organizations/payments = 전부 **BigInt**) `.toString()` 처리. overview month_revenue = `Number(Decimal ?? 0)` 변환(Decimal 객체 그대로 넘기면 convertKeysToSnakeCase가 key 순회하다 깨지는데 회피). apiSuccess→convertKeysToSnakeCase가 Date→ISO/BigInt→toString 재귀 폴백까지 이중 안전. JSON 직렬화 에러 0.
- **매핑 정확(실측 일치)**: games.status=Int → `[1,2]` Int 비교 정합 / payments.status="paid"+paid_at·final_amount Decimal / refund_status="requested" / organizations.status pending(주석 워크플로 일치) / game_reports "submitted"(@@index) / community_posts "draft"(status nullable·기본 published인데 where:"draft"가 null 제외 정확) / court_submissions "pending". Tournament.status 화이트리스트 6종 String?(@@index 보유).
- **KST 경계 정확**: kstMidnightUtc/kstMonthStartUtc PURE(UTC+9h→Date.UTC→-9h). 7일 trend = 코드 day-bucket(KST 키 `Y-M-D`), DB date 캐스팅 회피 — 0포함 7칸 보장. todayStart/yesterdayStart/monthStart 경계 정합.
- **읽기전용·schema 0**: count/aggregate/findMany만. 모델 변경 0. api/v1 미접촉.
- **inbox union 정합**: 5소스(+teams 0 주석) Promise.all 병렬 → 정규화 push → severity 필터 → 정렬(priority err0<warn1<blue2, 동순위 created_at asc / age는 created_at 단일) → slice(start, start+50). next_cursor = `start+50 < length ? start+50 : null` 경계 정확. domain 필터 시 `want()`로 불필요 소스 쿼리 스킵(절감). 소스별 take:200 상한으로 폭주 방지.

🟡 권장 수정 (minor, 동작 차단 0):
- [inbox/route.ts:118-124] **payments.refund_status 인덱스 부재** — payments는 status/paid_at/created_at 등 인덱스 다수지만 `refund_status` 단독 인덱스 없음(schema L1906~1914 실측). overview L125 count + inbox findMany 둘 다 refund_status="requested" where → 환불요청 조회가 풀스캔. 현재 payments 행수에선 무해하나, 증가 시 가장 먼저 느려질 지점. → 후속: `@@index([refund_status])` 또는 `@@index([refund_status, created_at])` ADD(무중단). 본 PR 범위(schema 0) 밖이므로 별도 처리 권장.
- [inbox/route.ts:82] **소스별 take:200 silent 상한** — pending/submitted/draft가 한 소스에서 200 초과 시 오래된 201번째부터 union/페이지네이션에서 누락(정렬은 created_at asc라 최신이 잘림). 운영 큐 특성상 pending이 200 넘는 일은 드물지만, 넘으면 next_cursor로도 도달 불가. 현재 안전하나 인지 필요(주석에 "소스별 상한" 명시는 되어 있음).
- [overview/route.ts:159-167] **delta: null 3종** — active_games/month_revenue/recruiting_tournaments는 비교 기준 부재로 null(의도, 주석 명시). new_users만 어제 대비 delta 산출. 디자인 스펙이 이 3종 delta를 요구하지 않으면 그대로 OK. 추후 월초 대비 등 기준 생기면 확장 여지(현 상태 문제 아님).

ℹ️ 참고(수정 불요):
- catch 블록이 빈 catch(에러 객체 미로깅) — apiError 500만 반환. 디버깅 시 원인 추적 어려울 수 있으나, 민감정보 노출 0 관점에선 안전. 기존 라우트 컨벤션과 동일하면 유지.
- inbox cursor = "정렬 후 인덱스" 방식 — union이라 단일 BigInt 키 부재로 불가피한 선택. 폴링 사이 데이터 변동 시 페이지 경계가 흔들릴 수 있으나(인덱스 기반 공통 한계), 운영 큐 용도엔 충분.

→ **수정 요청 테이블 등록 안 함**(전부 권장/후속, 필수 0). APPROVE 그대로 머지 가능.

### PR-CHAMPION ① 우승팀 자동set + PR-AUTOCOMPLETE ② cron (2026-06-15, reviewer)

📊 종합 판정: **APPROVE** (critical 0 / major 0 / minor 3)

검증 실측 근거: schema FK 4개 직접 grep / 운영 DB status 분포 실측(임시스크립트→즉시삭제 가드3) / vitest 16 PASS(set-champion 11 + cron 5) / tsc 변경3파일 에러0.

✅ 잘된 점:
**① set-champion.ts**
- ★ FK 변환 정확(핵심 무결): champion_team_id=Team.id(schema L356) ← winner_team_id=TournamentTeam.id(L749) / calculateLeagueRanking.tournamentTeamId=TournamentTeam.id(L9·177). 모든 반환 경로(knockout 1차/2차폴백·리그)가 `tournamentTeamToTeamId()` 1단계 변환 경유 → tt.teamId(=Team.id L603) 박제. 변환 누락 경로 0. 테스트가 winner(999)≠teamId(42) 단언으로 회귀가드.
- 포맷 판정 정합: isFinalsRound PURE(결승/final/finals/championship 소문자 포함) + winner NOT NULL + scheduledAt desc 1순위 → next_match_id null+round_number 최대 폴백 2차. round_robin/league=rank===1. group_stage 다조=즉시 null(매치조회 안 함). 필드명 전부 schema 일치(roundName@round_name·round_number·next_match_id·winner_team_id·scheduledAt).
- 멱등 견고: champion_team_id NOT NULL → skip(수동 박제 보호)·update 미호출·매치조회도 안 함. mvp_player_id는 select·data 어디에도 미등장 = 절대 미접촉. not-found까지 4상태 구분.
- finalize 통합 위치 정확: autoComplete `updated:true` 분기 내부에서만 호출(L248~265) → 매 매치 호출 낭비 0. **try-catch 격리**(L252~265)로 산출/박제 실패가 종료 흐름 차단 0(console.error만·warnings 미추가). add-only(기존 5종료path 본문 무변경) → 회귀 0.

**② auto-complete-tournaments cron**
- ★★ 매치0 생명선 견고: `tournamentMatches:{none:{}}`가 findMany(L126) + updateMany(L163) **둘 다** 존재 → race 방지. relation명 정합(Tournament.tournamentMatches L348). 진짜 대회 강제종료 위험 0. ①과 교차0(매치0=결승없음=champion 미호출).
- CRON_SECRET Bearer 가드 견고(L110~113, 불일치→401). stale-pending-fix 패턴 정확 답습(findMany→코드필터→updateMany 재가드→admin_logs silent→200 idle).
- KST 경계 정확(당일보호): kstMidnightUtc PURE(Date.UTC·로컬TZ영향0). `(endDate??startDate)<boundary`=어제까지만·당일 보호·둘다 null 제외. 테스트 5케이스(당일제외·어제포함) PASS.
- champion/mvp 미접촉(updateMany data=status만). admin_logs resource_id/target_id=null(UUID는 changes_made.tournament_id 박제). vercel.json 기존 10건 보존+1줄 append(`0 18 * * *`=KST03:00).
- 보안: cron 외부호출 Bearer 차단. 응답 민감정보 없음(id/name/count만).

🟡 권장 수정 (minor — 동작영향 현재 0, 방어적 정합):
- **[route.ts L41~48 EXCLUDED_STATUSES — 설계 가드와 불일치]** 설계서 §②(L120·132)와 표시레이어 `NO_TIME_OVERRIDE`(tournament-status.ts L75~80)는 `final`/`preopen`도 자동종료 제외로 규정하나, cron EXCLUDED는 6개만(completed/ended/closed/cancelled/draft/upcoming) — `final`/`preopen` 누락. **실측 영향 0**(운영 status=draft/completed/in_progress/cancelled/published 5종뿐, final/preopen 0건·매치0+final/preopen 갭 0건). 향후 final/preopen 도입 시 매치0 대회 의도외 강제 completed 소지 → EXCLUDED에 2개 추가 권장(NO_TIME_OVERRIDE 가드 통일).
- [finalize L253 await] setTournamentChampion `await`라 종료응답 직전 1~2쿼리 동기 대기. 격리 try-catch 완료·실패 차단0이나 응답 지연 minor(updated:true 1회뿐→무시 가능). 현행 안전.
- [route.ts L139~143 코드필터] (endDate??startDate)<boundary를 DB where 아닌 JS 필터로(prisma ?? 표현 한계). 매치0 후보만이라 N 소량(실측 3건)→성능 영향 0. 타당.

미수정 결정 타당성:
- ① group_stage 다조 null(조 우승 다수 모호)=①-Q3(가) 정합·② 매치0 한정=②-Q2 정합(두 종료경로 분리)·① 멱등 skip=①-Q1(가) 정합. 전부 **타당**.

(※ 본 항목 ①② 한정. 기존 ④/scrim·Phase1·P1-a 항목과 무관)

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
| 2026-06-15 | Admin Console S1-5 통합 디스패처 리뷰 (reviewer) | ✅ **APPROVE**(c0/maj0/min3). ★id파싱견고(indexOf콜론+BigInt try-catch로 악의 refId 400방어=S1대비 개선·sep<0/빈refId 400·domain 2중화이트리스트)·★★payments 금전안전(update=refund_status+updated_at만·refund_amount/refunded_at/status·PG호출 0·requested 멱등·severity warning)·★court(A)복제 기존PATCH와 1:1실측동일(mapCourtType/region split/트랜잭션3단/좌표/metadata/adminLog/반환 전부일치·import0회귀0)·org reject reason필수·pending가드·컬럼실측정합·inbox큐조건↔처리조건 정합·schema0/api-v1 0/기존6route+inbox 미수정. minor: switch update try-catch부재(inbox목록은 있음·일관성)·org가드 canManage→isSuperAdmin로 좁힘(inbox도 super가드라 일관·더엄격)·community draft큐↔hide/restore 의미어긋남(동작안전). court수동복제 drift위험=참고(A 트레이드오프). 수정요청 0 |
| 2026-06-15 | 버킷B P1-b 시즌시상 고급필드 리뷰 (reviewer) | ✅ **APPROVE**(c0/maj0/min2). ★AW1 기본부 보존 완벽(page.tsx 120+/0-·기존5블록·officialMatchWhere·DTO 미접촉·블록7 순수ADD)·빈슬롯만 season_awards 교체(Slot 정규화 타입정합)·schema ADD-only(CREATE1+rel4+IDX3·ALTER/DROP0·FK SET NULL/NoAction)·권한가드(upsert/delete requireSuperAdmin·page isSuperAdmin·sidebar super한정)·선수검색 기존API재사용(snake정합)·null가드(user/team/payload 다비면거부)·cafe-blue/색토큰0. tsc EXIT0. minor: bestDefense 베스트5수비+스틸왕 중복매핑(0행미재현)·전체시즌 series무관 누적혼재(단일시즌 무해). 수정요청 0 |
| 2026-06-15 | Admin Console S2 overview/inbox 리뷰 (reviewer) | ✅ **APPROVE**(c0/maj0/min3). 보안가드(role/admin_role+null방어·비super403·IDOR무관)·직렬화안전(inbox id BigInt→toString 전부·month_revenue Decimal→Number)·매핑실측일치(games Int[1,2]/payments paid·refund requested/orgs·courts pending/reports submitted/community draft nullable안전/Tournament status화이트6종@@index)·KST경계·7일trend day-bucket·schema0·union정렬/cursor경계 전부 PASS. minor: payments.refund_status 인덱스부재(풀스캔·후속ADD권장)·소스별take200 silent상한·delta null 3종(의도). 수정요청 0 |
| 2026-06-15 | PR-CHAMPION ① + PR-AUTOCOMPLETE ② 리뷰 (reviewer) | ✅ **APPROVE**(c0/maj0/min3). ★FK변환 무결(winner=TT.id→tt.teamId=champion Team.id 전경로)·멱등·mvp미접촉·try-catch격리·★★매치0 생명선 findMany+updateMany 둘다·Bearer·KST당일보호 전부 PASS. schema FK 4개 grep+운영status 실측(final/preopen 0건→갭영향0)+vitest16 PASS+tsc0. minor: EXCLUDED에 final/preopen 누락(영향0·방어권장)·await지연·JS필터 |
| 2026-06-15 | PR-AUTOCOMPLETE ② Phase3 cron 자동화 (developer) | ✅ 신규 auto-complete-tournaments/route.ts(Bearer가드·kstMidnightUtc PURE·findMany 매치0+status NOT IN→코드필터(end??start<경계)→updateMany 매치0+status 재가드·admin_logs silent). vercel.json `0 18 * * *`(KST03:00) 추가(기존10보존). ★매치0 생명선 findMany+updateMany 둘다·당일보호·champion/mvp 미접촉·schema0. vitest 5 PASS·build✓ route등록. 멀티세션 제약준수. 미푸시1 |
| 2026-06-15 | Admin Console S1-4 팀 검수(옵션2) 리뷰 (reviewer) | ✅ **APPROVE**(c0/maj0/min3). ★★옵션2 가시성 회귀0(비로그인/타인=기존 active+is_public 동일·로그인만 OR3분기 첫항목=비로그인조건 동일→비공개 active 회귀0·타인pending 절대숨김)·★본인식별 위변조불가(myId=BigInt(session.sub)·captainId/teamMembers.userId 세션비교·클라입력0)·★상세가드 정확(active아니면 본인[captain or active멤버]만·notFound가 집계전 실행·teamMembers include재사용)·where AND배열 OR충돌방지·팀생성 pending전환 흐름안전·review API(super403·Zod·BigInt try-catch·pending만·active93건 INVALID_STATE)·S2 3파일 회귀0(teamReviewQueueWhere 단일source·groupBy active-only)·schema0/api-v1 0. schema실측(Team L402~/status인덱스L480/TeamMember.userId L535). minor: review↔resolve teams case 수동복제 drift·OR미들항목 is_public생략(의도). 수정요청 0 |
| 2026-06-15 | Admin Console S1 처리뮤테이션1~3 (reviewer) | ✅ APPROVE(c0/maj0/min2) — isSuperAdmin가드403·Zod enum화이트리스트·game_reports submitted멱등가드·suggestions responded_by_id=session.sub위변조불가·스키마실측(memo/reason컬럼부재→adminLog박제 타당·suggestions4컬럼실재)·notify(A)보류(createNotification 0)·snake/BigInt직렬화·schema0/api-v1 0/신규3라우트만. minor: 메인update try-catch부재(Next기본500·무해)·resourceType표기일관 |
| 2026-06-15 | 버킷B P1-a 코트제보 승인체계 (reviewer) | ✅ APPROVE(c0/maj0/min3) — 트랜잭션 원자성(court_infos.create+submission.update, 필수컬럼 전매핑 throw0)·IDOR(제출 본인강제/GET where user_id/PATCH super_admin)·snake정합·schema무중단(CREATE1+IDX2·ALTER0)·매핑(3x3→outdoor+size·amenities→facilities·photos[0])·중복가드(pending findFirst)·tsc0. minor: XP트랜잭션밖(기존 suggestions 패턴 동일·throw0)·중복승인race이론·GET미소비처. 미push3 |
| 2026-06-15 | 버킷B P1-a 코트제보 승인체계 (developer) | ✅ 3단계 분리커밋. [1]court_submissions ADD(CREATE1+INDEX2·ALTER/DROP0·count0) [2]POST/GET API+폼실연결(noop→fetch·검토중화면) [3]admin "제보검토"탭+승인PATCH(트랜잭션 court_infos.create+approved+XP / 반려). region→city/district·3x3→outdoor+court_size·amenities→facilities. api-v1 0·신규화면0(탭append)·tsc 3단계PASS. 미푸시3 |
| 2026-06-15 | PR-CHAMPION ① 우승팀 자동set 유틸 (developer) | ✅ 신규 set-champion.ts(isFinalsRound PURE+resolveChampionTeamId+setTournamentChampion 멱등)·finalize 통합(updated:true분기 try-catch격리)·테스트11 PASS. ★FK변환(winner=TT.id→tt.teamId=champion Team.id). 포맷별(knockout결승/리그1위/다조null). schema0·api-v1 0·tsc0. 멀티세션 제약준수(cron·vercel.json 미접촉) |
| 2026-06-15 | 대회종료 후속3종 통합설계 (planner, read-only) | ✅ ①우승팀자동set(champion=Team.id/winner=TT.id변환·finalize L180통합·옵션B·포맷별판정) ②Phase3 cron(매치0가드 생명선·stale-pending패턴) ③결선흐름(코드0·①의존). 설계서 `Dev/tournament-completion-followup-plan-2026-06-15.md`. PM결재7건. 코드·DB0 |
| 2026-06-15 | Phase3 STEP2 공지전용47건 날짜종료 백필 (developer) | ✅ id IN[확정47] updateMany status=completed. 사전47==update47 / 사후 매치0경과미종료 잔여0 / completed 7→54 / champ·mvp미접촉 / 금지id(열혈·4차·날짜없음)무변경 / schema0. 임시스크립트2 정리(가드3) |
| 2026-06-15 | Phase2 STEP3 대회종료+우승팀 적용 (developer) | ✅ 5차(7f28)→completed/champion=338(오름)·6차(e06e)→completed/champion=330(YBC). auto-complete 7/7·mvp미접촉·schema0. status분포 published51/completed7. 임시스크립트3 정리(가드3) |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim 검증 (tester) | ⚠️ 9PASS/1부분 — 더미0·실연결·빈상태3분기·tsc0·postcss0·count0증빙. 보낸취소[id]불일치 잠재결함(reviewer crit과 일치) |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim 리뷰 (reviewer) | ⚠️ CHANGES(crit1/maj0/min4) — 보낸취소 URL[id]=from_team→PATCH경로검증 400 확정버그. snake정합·토큰·IDOR·tsc는 PASS |
| 2026-06-15 | Admin Console S3 snooze 리뷰 (reviewer) | ✅ APPROVE (c0/maj0/min2) — DB구조 실측 모델일치·live_scoreboards0·snooze제외/batch N+1없음·markResolved best-effort·id파싱일관 |
| 2026-06-15 | PR-MOCK-TO-REAL ④ scrim (developer) | ✅ 더미제거→team_match_requests 실연결·4탭·빈상태3분기·0스키마/0신규라우트·tsc0·postcss0 |
| 2026-06-15 | Phase 1 상태 레이어 리뷰 (reviewer) | ✅ APPROVE (c0/maj0/min2) — CTA/admin 무영향·필드정합·tsc0. TZ경계 minor |
| 2026-06-15 | Phase 1 대회 상태 표시 레이어 (developer) | ✅ effectiveTournamentStatus+10파일·테스트8 PASS·build ✓·DB0 |
</content>
