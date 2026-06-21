# 작업 스크래치패드

## 현재 작업
- **요청**: 관리자 Toss 디자인시스템 전환 (Phase 0~4). 시안=`Dev/design/BDR-current/_handoff-admin-toss-P0/`
- **상태**: Phase 0/1/3 PR-A 완료(origin/dev 머지 #725·#726). **동시 2세션 운영 중** — 아래 세션별 블록(🅰️/🅱️) 참조.

> ⚠️ **세션 충돌 방지 규약 (2026-06-21, 사용자 결정 — 옵션3)**: 메인 worktree에서 2세션 동시 작업. ①각 세션은 **자기 블록(🅰️/🅱️)만 수정**, 상대 블록·공용 섹션(§0 대조표/완료Phase) 미수정. ②작업 로그는 **append만**(기존 줄 덮어쓰기 금지). ③코드는 **각자 영역 디렉토리만** 명시적 `git add <경로>`(전체 `git add .` 금지) → 커밋 격리. ④두 영역은 디렉토리 비중첩(A=admin 비대회 / B=tournaments+schema)이라 working tree 충돌 0.

### 🅰️ 세션 A — Phase 3 referee 리스킨 (이 세션)
- **코드 영역**: `src/app/(referee)/referee/*` (회원 + referee-admin). admin/* 비대회는 Phase2 완료·미접촉. tournaments/*·schema는 세션 B 소관.
- **상태**: ✅ **Toss 관리자 전환 Phase 0~3 전부 운영 완료**. Phase2 백오피스17(#728/#729·0b268ca)·Phase3 referee24(#732/#733·53e3397). 전 배치 tsc0·Material잔존0·기능회귀0·영역격리. 미푸시0(내 작업 전부 main). 세션A 디자인 트랙 종료.
  - **🔧 운영 트러블슈팅 — 마스터즈 대회 기록(2026-06-21, 운영 DB 단일대회 변경·승인·완료)**: 원인=경기 paper 모드라 플러터 앱 기록이 서버 차단(recording-mode.ts). 조치=6경기+대회 default→**flutter**, status→**in_progress**(임시스크립트·audit박제·정리완료). 결과=경기342 자동동기화(235 PBP·completed). **4강/결승 대진 생성**: 347(토파즈vs포티지 14:20)·349(피벗vs파란날개 15:20)·348(결승 16:30, 승자 자동진출). 상세 함정=errors.md 박제.
  - **➡️ 플러터 앱 관련 남은 작업 = 다른 세션 이관**(세션A 추적 종료): 예선 5경기 앱 재전송 / 자동전환 화이트리스트(`registration` 누락) / 종료 자동전환 — 전부 `/api/v1` Flutter 영역, **다른 세션 진행 중**.
  - **⚠️ Phase3 발견(해결됨)**: 3A 토큰갭(referee --color-background/--color-text-on-primary→[data-skin] 보강 4f9a405)·3B 아이콘오타(UsersX부재→user-x)·로컬build dev서버 DLL락→Vercel CI 의존(#729/#733 빌드결과 확인권장)·브랜치정책 변경(subin폐지·dev직접, 다음세션부터).
- **📦 Phase 3 배치**(referee 독립셸 referee-shell 사용·Phase1 셸 패턴): **3A 셸+회원(~14)**=referee-shell(크롬 data-skin)+공유3(empty-state·notification-bell)+layout+회원8화면(referee·profile(+edit)·certificates(+[id])·documents·assignments·applications·notifications·settlements) / **3B admin코어(~12)**=admin/layout+대시보드·assignments·announcements(+[id])·members(+new·[id]·[id]/documents)·pools / **3C admin정산(~9)**=bulk-register·bulk-verify·settlements(+new-batch·dashboard)·fee-settings·settings. referee-picker→3B(admin 배정용). 방식=셸 크롬에만 data-skin(children wrapper 미부착)+페이지 루트별 data-skin(미작업 admin 누수0)+Material→lucide·기능1:1·schema0. PR=회원/admin 분리.

### 🅱️ 세션 B — Phase 4 Track B 대회관리 리빌딩 (세션 B가 갱신)
- **코드 영역**: tournaments 리빌딩 + admin_categories schema(게이트). admin/* 비대회 화면·toss-admin.css 미접촉.
- **상태**: §0 대조완료·B-1 admin_categories(테이블+4종시드) 완료·커밋(367c1d8). **PM결정 5건 확정(2026-06-21, 권고안 일괄)**: ①cap=div_caps jsonb유지 ②경기별기록자=TournamentMatch.settings jsonb키 ③시드=완료(BDR-join복원검증) ④최소인원/게스트=토글OFF박제 ⑤format_presets=미도입. **→ 추가 스키마변경 0**. **Phase4 첫배치=종별마스터 관리화면 완료·커밋 50053a2**(신규4파일·tester+reviewer통과·IME가드). 다음 후보=②참가신청 3단계(로스터·WAITING) or ③대회생성+상세(대진통합) or 사이드바nav 링크(세션A 셸 소관). 충돌검증=referee worktree=.claude메타만. stash@{0}=gallery(무관).
- **📦 Phase 2 배치 계획**(미리스킨 admin 17화면, Phase1의 5·Phase4 tournaments/[id] 제외):
  - **2A 대시보드·계정·정산(8)**: `/admin`(대시보드)·`/admin/settings`·`/admin/logs`·`/admin/suggestions`·`/admin/season-awards`·`/admin/payments`·`/admin/teams`·`/admin/courts` → PR-2A
  - **2B 발송·분석·엔티티(6)**: `/admin/partners`·`/admin/plans`·`/admin/campaigns`·`/admin/notifications`(아이콘9)·`/admin/analytics`(7)·`/admin/game-reports`(13) → PR-2B
  - **2C 콘텐츠·NEWS·계정(3)**: `/admin/news`·`/admin/news/compose`·`/admin/me`(7컴포넌트) → PR-2C
  - **방식**(Phase1 패턴 동일): 각 화면 루트 div에 `data-skin="toss"` opt-in(토큰 리매핑은 toss-admin.css에 이미 완료) + Material Symbols→lucide `<Icon>` 키트 + 기능/컬럼/필터/문구/라우트/server action **1:1 유지·비주얼만**. schema0·신규route0·운영write0. 공유 `.admin-shell/.admin-main/__inner` data-skin **금지**(이미 미부착)
- **🚨 디자인 분기(절대)**: 관리자(admin/*·tournament-admin/*·partner-admin/*·referee/*)=**Toss**(toss-admin.css·라이트·lucide-react·#3182F6·24px). 사용자 프론트 `(web)/*`=**mybdr 기존 절대불변**(var토큰·다크·Material·AppNav). 참가신청서만 사용자용인데 Toss(예외). 네임스페이스 분리(`data-skin="toss"`/.admin-shell). CDN lucide injection 금지→lucide-react.
- **🔑 opt-in 아키텍처**: data-skin="toss"를 **셸 크롬(사이드바/헤더)+리스킨된 페이지 루트에만** 부착. 공유 `.admin-shell`/`.admin-main`/`.admin-main__inner` **금지**(Phase2 미스킨 자식 누수 차단). 토큰 리매핑=globals 베이스토큰을 `[data-skin="toss"]`+`[data-theme="dark"] [data-skin="toss"]` 둘 다 라이트Toss값으로 덮어 라이트 고정·다크 누수 0.
- **2트랙**: A 리스킨(대회관리 외 admin 전부 — 기능/컬럼/필터/문구/라우트 1:1 유지·비주얼만) / B 리빌딩(대회관리만 — admin_categories·참가신청 로스터조인·DivisionRule)
- **Phase**: 0 디자인시스템✅ / 1 AdminShell+5화면✅ / 2 나머지 백오피스 / 3 partner✅+referee / 4 대회관리 리빌딩
- **🚦 게이트(트랙B/P4)**: admin_categories·조인테이블 db push 전 승인. 트랙A는 schema 0
- **§8 미결(Phase4 진입 전 확인)**: ①출전 최소인원/게스트(토글 off) ②4종 시드 정확성 ④참가신청 라우트 위치
- **📌 Phase 3 referee 큐(보류해제, 트랙A 리스킨)**: 지시서=`관리자Toss전환-Phase3추가지시서`. 시안=`_handoff-admin-toss-P0/design-files/`(PartnerReferee.html·pr-screens.jsx·pr-data.jsx). 대표 6화면 패턴 레퍼런스 → **referee 전체26** 동일 키트 리스킨. 자체 셸 골격·기능·컬럼·문구·라우트 1:1 유지·비주얼만. mock 참고·실제 우선. schema0. PR 분리(referee회원 / referee-admin). 라우트: referee 회원(`/referee`·`/assignments`·`/settlements`·`/applications`·`/certificates`(+`/[id]`)·`/documents`·`/notifications`·`/profile`(+`/edit`)) / referee-admin(`/referee/admin`+assignments·members·settlements·announcements·pools·bulk-register·bulk-verify·fee-settings·settings)
- **스펙(매칭, 완료분)**: `Dev/matchmaking-CLI프롬프트-확정-M1toM5-2026-06-19.md` + `_handoff-matchmaking-M2-M5/DATA-BINDING.md`

### 🔒 §0 필드 대조표 (시안명→운영실제, 전 Phase 공통)
- 시간 `scheduled_at` / 길이 `duration_hours`(분아님) / 정원 `max_participants` / 승인참가수 `current_participants` / 참가비 `fee_per_person`(0=무료)
- 좌표=games에 없음→courts 조인 필요, 없으면 "가까운순"·"내동네" 칩 숨김
- 신청테이블 `game_applications` / 신청 status **Int** 0=신청완료·1=승인(확정)·2=거절·3=대기(M2)
- **game status**(`game-status.ts`): 1=모집중·2=확정·3=완료·4=취소
- 출석=`game_applications.attended_at`(DateTime) / 노쇼=`game_player_ratings.is_noshow`+출석파생
- 매너=`users.manner_score`Decimal+`manner_count`(숫자 화면 비노출, 등급 라벨만) / mvp_count·games_played=파생
- M2 컬럼: `waitlist_position`INT NULL / `promotion_deadline`TIMESTAMPTZ NULL
- game_type **Int**: 0픽업·1게스트·2연습경기

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관 — 다른 세션 작업물. 복원 시 `git stash pop` |
| ~~scrim 보낸취소 [id] 버그~~ | ✅ 이미 해결(068341b·main) — stale 정정 2026-06-21 |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 실진행/공지전용 백필 일부 완료, 잔여 대기 |

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능 신규테이블. 결정 5건 대기(`mock-data-absent-admin-plan-2026-06-14.md`)
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기
- **7f28 #301 결선 슬롯** — #301(pbp271 보존) "결승" 오생성 슬롯 잔존. 예선 #291(OT1동점 미종료)·#292(미기록) 대기
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능)
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만)

## 수정 요청 (미완료 후속·동작영향 minor)
| 대상 | 문제 | 상태 |
|------|------|------|
| **ct-create-tournament.tsx L531 + page.tsx L393 + service tournament.ts L154/486 (🔴차단·reviewer 2026-06-21)** | **후원사 추가 시 대회 생성 500 실패**. 새 폼은 `sponsors:{name,logoUrl}[]`(객체배열) 전송→route.ts L239 그대로 통과→createTournament `sponsors:input.sponsors??null`→Prisma `sponsors String? @db.VarChar`(schema L313)에 객체배열 INSERT 시도→**런타임 타입에러로 대회 생성 자체 500**. route에 zod 없어 tsc는 통과(body any)·후원사 0개면 우회되나 1개라도 추가하면 영구 실패. **수정안**: (A)page.tsx handleSubmitDraft에서 `sponsors`를 `JSON.stringify(payload.sponsors)` 문자열화 후 전송(String 컬럼 유지·기존 legacy `sponsors:string` 흐름과 정합) 또는 (B)sponsors 객체배열 전송 중단하고 이름만 `sponsors.map(s=>s.name).join(", ")` 문자열. logoUrl 보존이 필요하면 (A). **로고URL은 sponsors VarChar에 JSON으로만 보존 가능**(전용 컬럼 없음). 단순안=후원사명만 문자열(B) | ✅ **해결 (2026-06-22 developer, 권고B 채택)** — sponsors 소비처 실측: validation L79 `z.string()`·service L154/486 `string`·legacy폼 `useState("")`·**표시화면 `tournament-about.tsx` L42 `val.split(",").map(trim)`**=콤마구분 plain문자열 표준. JSON(A)은 `.split`이 못읽어 표시깨짐→**(B) 후원사명만 콤마 join 채택**. ct-create-tournament L531 `sponsors.map(s=>s.name.trim()).filter(Boolean).join(", ")`+payload타입 `string`화, page.tsx L393 배열`.length`분기→`payload.sponsors \|\| undefined`. 0/1/다수 안전(0→""→미전송·1→"A"·다수→"A, B"→split복원). 로고URL=전용컬럼부재로 1차미저장(후속). schema/createTournament시그니처/api/v1 미접촉. tsc EXIT0 |
| (web) join/page.tsx L148~150·439·263 (차단·reviewer) | 참가신청 대표자 입력칸+클라게이트 제거로 user.phone null 사용자(카카오/구글 가입자) 영구 제출 차단. 서버 joinSchema managerName/managerPhone `.min(1)` 필수인데 자동값 빈값→422·고칠 UI 없음. user_info 빈값 시 입력칸 노출+canNext 게이트 추가(택A) 또는 항상 편집칸(택B) | ✅ 해결 (2026-06-21 developer, 권고A: 조건부 입력칸+canNext trim 게이트·page.tsx 1파일·tsc0·route/schema diff0) |
| scrim-tabs.tsx L295 (critical) | 보낸취소가 URL[id]=from_team 전송→PATCH 400 | ✅ **이미 해결**(068341b /scrim 실데이터 연결 시 `patchStatus(r.counterpart.id, r.id, "cancelled")`+`disabled !counterpart?.id` 가드 반영·main 확인). 항목 stale였음(2026-06-21 검증) |
| scrim PATCH 가드(minor) | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속(설계 검토 — 결정 필요) |
| game.ts L49 | game_type=parseInt(type) | ✅ **실버그 아님**(2026-06-21 검증) — KindTab이 `?type=0\|1\|2` 숫자문자열만 전송→parseInt 정상. "all"=type삭제(분기 스킵). 영문 경로 없음. 방어하드닝 불요 |
| apply-panel.tsx L510/L536 (M2 minor) | 승인/거절 배지 background raw rgba 하드코딩(룰10 경미). color-mix(var(--ok/--danger))로 교체 권장. 시각영향0 | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |

## 완료 Phase (이력 압축)
- ✅ **관리자 Toss Phase 0/1/3 PR-A (2026-06-21)** — Phase0 디자인시스템 이식(toss-admin.css·admin-toss 키트, `[data-skin]` 격리)·Phase1 AdminShell 셸크롬+5화면(users/games/community/organizations/tournaments) 리스킨·Phase3 PR-A partner-admin 5파일 리스킨. 전부 비주얼만·기능 회귀0·schema0·신규route0. subin 커밋+푸시(8d67f85·69ea71f·aeb76c3). dev 미머지
- ✅ **매칭 고도화 M1~M6 (2026-06-19, 운영 main 반영 #717~#724)** — M1 성사코어+취소status정합·M2 대기열 백엔드+스키마(waitlist_position/promotion_deadline)·M3 출석확정 API+lazy종료·M4 평점유도+신뢰카드·M5 찾기UX(정렬·필터·빈상태)·M6 호스트콘솔(3구획 신청관리+승격+waiting탭+HostGameCard)
- ✅ **의뢰서 STAGE1/2 + 갭①② (2026-06-16)** — effectiveTournamentStatus·Admin S1~S3·팀검수·통합디스패처 + 팀 핵심정보 재검수·프로필 대회종료 표시. 전부 main
- ✅ **기록(Records) 3화면 + 출전시간 PBP 재계산 (2026-06-16, #707~714)** — 대회/선수/팀 기록. 출전시간 minutes-engine 공용추출(`match-minutes.ts`). 라이브 회귀 maxDiff=0
- ✅ **대회종료 후속 (2026-06-15)** — set-champion·auto-complete cron·Phase2/3 백필
- ✅ **PR-MOCK-TO-REAL ①②③ / Phase12 13화면 / LINEUP-V2 / Phase10 5시안 (2026-06-14)**
- ✅ **PR-RECORDER-AUDIT / 대회종료B안 / 9C / Phase1~9 / PR-PERM-DISPLAY** (이전)

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-22 | F-1 후원사로고·디비전날짜코트 settings jsonb 저장 (developer 세션B) | ✅ 변경 2파일(ct-create-tournament·page.tsx, +32/-0). ①`CtDraftPayload.settings?` 추가 ②publish() sponsorLogos(로고있는것만 `{name,logoUrl}`)·divSchedule(`{디비전명:{dateId,courtId}}` 둘다있을때만) 맵→비어있지않은것만 settings(`sponsor_logos`/`div_schedule` snake) ③page.tsx body `settings:payload.settings` 1줄. 빈값생략(둘다비면 undefined→미전송). sponsors콤마문자열·평면변환 전부보존·schema/route/tournament/api/v1 미접촉(createTournament settings 기존수신 round-trip). tsc EXIT0. 세션A셸 미접촉. 미커밋. |
| 2026-06-22 | 생성폼 후속(로고·디비전날짜코트) 저장위치 설계 (planner 세션B·읽기전용·코드/스키마 무변경) | ✅ **두 후속 모두 Tournament.settings jsonb로 무스키마 해결 = YES**. ①settings 무스키마=`settings Json?`(schema L326)·createTournament 수신경로 기존존재(tournament.ts L179·L524 round-trip)·route.ts L270 전달·단 page.tsx body·CtDraftPayload에 settings키만 추가 필요. ②로고=`settings.sponsor_logos`(`[{name,logoUrl}]`)·sponsors컬럼 콤마문자열 B안 현행유지. 🔑**소비처 정정**: errors.md L9 "tournament-about `.split(",")`=sponsors컬럼"은 오인(그건 description 'Sponsored By:' 파서)·실 컬럼소비처=수정wizard(plain·쉼표구분) + OBS스코어보드(molten/stiz 문자열필터)뿐→콤마문자열 정합·settings추가 무영향. ct는 이미 `Sponsor{logoUrl}` state+ImageUploader 완비(publish L541서 버림). ③디비전날짜코트=`settings.div_schedule`(`{디비전명:{dateId,courtId}}`)·DivisionItem 이미 dateId/courtId보유(ct-divisions L29)+입력UI완성·publish L515~518서 의도적 손실→맵구성 1블록 추가. **스키마 승인 불필요**(prisma무변경·api/v1무영향·createTournament 시그니처무변경). 변경파일=ct-create-tournament+page.tsx 2개(저장만)·소비처표시는 F-2 후속분리. 배치=F-1저장(2파일·tsc커밋) / F-2표시(about·디비전일정 역참조·선택). 미커밋. |
| 2026-06-22 | 새 대회 생성폼 B-4 reviewer 차단 1건 수정 + 권고①③ (developer 세션B·되돌림루프 1회차) | ✅ **차단(sponsors 500) 해결** — 소비처 실측(표시화면 `.split(",")` plain문자열 표준)→**권고B(이름만 콤마join) 채택**(JSON-A는 표시깨짐). ct-create-tournament L72 payload타입 `string`화·L531 `map(s=>s.name.trim()).filter().join(", ")` / page.tsx L393 `.length`분기→`\|\|undefined`. 0/1/다수 안전. 로고URL 1차미저장. **권고①** ct-divisions 배너 "종별규칙 자동생성"→"종별·디비전 구성 저장·세부규칙은 생성후 설정"(DivisionRule 미생성 오해제거). **권고③** 평면변환부 dateId/courtId 1차미저장 주석박제(createTournament 키부재·API/schema 확장금지·UI유지+사일런트손실 명시). schema/createTournament/api/v1/toss-admin.css/세션A셸 미접촉. tsc EXIT0. PM 소비처 재확인(tournament-about.tsx L42 `.split(",")` 정합). **B-2~B-4+수정 한커밋 567d142**(6파일·2402+/146-·subin·미푸시2). dev서버 stale=포트3001 PID179416만 종료 후 재기동. |
| 2026-06-21 | 새 대회 생성폼 B-2+B-3+B-4 검증 (tester 세션B) | ✅ **8/8 통과·차단이슈 0**. ①tsc EXIT0 재확인. ②페이지 렌더 스모크=wizard는 미들웨어 인증게이트로 307→`/login?callbackUrl=`(정상·미인증). ③payload정합=handleSubmitDraft가 categories평면변환(catRecord{종별:[디비전]}+divCaps+divFees)·places확장·scheduleDates(court_ids)·gameRules12키 POST body 배선·응답snake `data.redirect_url`접근 정합. route.ts L142~163 전 키 수신·L218~258 createTournament 전달 실측. ④회귀0=createTournament/route.ts/schema/`/api/v1` diff **비어있음**(B-4 백엔드 미접촉). legacy/prospectus/association 셸 보존. ⑤필수검증=submit()에서 대회명·정규대회선택·주최·주관·장소·일정·종별(totalDiv===0) 누락 시 toast차단·게시모달 미오픈. ⑥state계약=CategoryItem/DivisionItem/GameRules·shotClock=boolean·GAME_SETTINGS_DEFAULTS 정본 export→메인폼 import 일원화 일치. ⑦Toss격리=ct-page 루트·page.tsx data-skin="toss" 부모래퍼·Material실사용0(주석만)·하드코딩hex0(유니폼팔레트만 도메인예외)·lucide CDN0·toss-admin.css B-4추가분 `*/`조기종료0·중괄호균형. ⑧격리=세션A admin-shell/referee-shell 미접촉(생성폼 5파일 국한). ⚠️**비차단 환경이슈**: dev서버 3001이 globals.css Turbopack stale로 ROOT/`/tournaments`/`/login` **전 페이지 500**("Failed to write app endpoint·Caused by globals.css") — globals.css **미변경(이 작업 무관·마지막커밋6/19)**·toss-admin.css 조기종료0 → errors.md "Turbopack HMR stale" 함정. 코드회귀 아님. **dev서버 재시작 권장**(PM판단·종료금지룰). |
| 2026-06-21 | 새 대회 생성폼 B-4 마무리(우측 통합+게시모달+POST배선) (developer 세션B) | ✅ 수정2(ct-create-tournament·page.tsx)+toss-admin.css(게시모달 3클래스). **우측 stub2카드→실폼**: `<CtDivisions value={categories} onChange={setCategories} scheduleDates={변환} venues toast/>`+`<CtGameSettings value={gameRules} onChange={setGameRules}/>`. state추가=`categories:CategoryItem[]`·`gameRules:GameRules`(GAME_SETTINGS_DEFAULTS import 일원화·d state에서 game키 제거·로컬 defaults 삭제). **검증**=종별1개+(totalDiv===0 차단) 추가→통과시 게시모달 오픈. **PublishModal**(내부컴포넌트·신규파일0)=게시기간·참가신청기간(date2)·결제방법(계좌이체만 활성/간편·카드 준비중disabled)·은행select+계좌+예금주(`p.pays.includes("bank")`조건). **평면변환**=CategoryItem[]→`categories{종별명:[디비전명]}`+`divCaps{디비전명:cap}`+`divFees{디비전명:fee}`. **POST배선**(page.tsx handleSubmitDraft async)=`POST /api/web/tournaments` body=name·seriesId(정규시만)·organizer·host·sponsors·logoUrl(포스터)·startDate/endDate(게시기간)·registrationStartAt/EndAt(참가신청)·places·scheduleDates·gameRules·categories/divCaps/divFees·bankName/Account/Holder. 응답 snake `data.redirect_url`→성공 router.push·실패 showToast. saving=loading state 재사용(모달버튼 스피너ct-spin·진행중 닫기금지). **API/createTournament/route.ts/schema/`/api/v1` 미접촉**(전부 기존 수신키 실측확인: route.ts L147 categories/divCaps/divFees·L155 gameRules/scheduleDates·createTournament L136~173·502~504 div_caps/div_fees/game_rules/schedule_dates). 게시모달 클래스=`.ct-daterange/.ct-paygrid/.ct-paychip`(시안 toss.css 1:1·`[data-skin="toss"]`스코프·--warn/--warn-weak/--primary-weak 기존토큰). 미사용 courtsOf import 정리. lucide(trophy/check 실존)·Material0·hex0·IME가드(계좌/예금주)·dev서버미접촉. tsc EXIT0. git=대상2수정(ct-create-tournament untracked·page.tsx M)+toss-admin.css M·admin-shell/referee-shell 미접촉. 미커밋(PM). |
| 2026-06-21 | 새 대회 생성폼 B-3 우측 컬럼 2종 (developer 세션B) | ✅ 신규2(ct-divisions·ct-game-settings·controlled). **ct-divisions**=종별·디비전 제너레이터·props`{value:CategoryItem[];onChange;scheduleDates;venues;toast}`·`/api/web/admin/categories`GET실연동(snake `sort_order`·폴백 graceful)·DivisionGenerator모달4단계(성별·종별템플릿·디비전·연령·여성부w·곱집합)·디비전별cap/fee/dateId/courtId·venues→코트풀(`<venueId>_c<idx>`)read-only. 시안 `method`필드=계약(DivisionItem) 미존재로 제거(진행방식=DivisionRule소관). **ct-game-settings**=경기설정12키·props`{value:GameRules;onChange}`·유니폼16색picker(UniformModal·hex직접입력·휘도잉크)·프리셋4·Stepper·**shotClock=boolean**(SegSm 사용/미사용). **`GAME_SETTINGS_DEFAULTS`+`GameRules`타입 정본 export**(L37~50). 가드=page.tsx·ct-create-tournament·ct-schedule-venue·toss-admin.css·API·createTournament·schema·`/api/v1` 전부 미접촉(categories GET 읽기만). 재사용`.ct-*`(headicon/iconbtn/reqtag/banner/emptybox/stepper/segsm)만 클래스참조·우측전용 inline `var(--*)`·보라`#6D5AE6`→`var(--primary)`토큰화·lucide15종실존·Material0·hex0(유니폼팔레트 도메인예외)·IME가드·dev서버미접촉. tsc EXIT0(신규2 자체정합·전체에러0). git=신규2파일만stage(`A`)·B-2미접촉. 미커밋(PM). 통합위치=B-4(ct-create-tournament 우측 `.ct-stub` 2카드→CtDivisions/CtGameSettings 교체+state). |
| 2026-06-21 | 새 대회 생성폼 B-2 2컬럼 셸+좌측 컬럼 (developer 세션B) | ✅ 신규2(ct-create-tournament·ct-schedule-venue)+수정2(page.tsx quick탭 풀폭 early-return→CtCreateTournament·toss-admin.css `.ct-*` 70규칙+ctspin). **좌측 완성**=대회명(인라인검증)·정규대회(시리즈 `/api/web/series/my` 실연동+InlineSeriesForm)·주최·주관·후원사(ImageUploader)·포스터(ImageUploader)·일정장소(VenueSearch자동완성·코트Stepper1~8·명명SegSm·CalendarModal다중·날짜별코트배정·pruneCourts). **우측 stub**=`.ct-stub` 2카드(B-3). **제출 보류B-4**=검증후 onSubmitDraft→페이로드확인 토스트만(POST없음·payload는 B-1 places확장/scheduleDates `court_ids`/gameRules12키 변환완료). 가드=route/createTournament/Zod/schema/`/api/v1` 미접촉·prospectus/협회/draft 보존·lucide20종실존(ICON_ALIAS불요)·Material0·hex0(유니폼저지색 도메인예외)·IME가드·dev서버미접촉. `.ct-bar` lg `left:16rem`/모바일 `left:0`·720px 1컬럼. tsc EXIT0. git=대상4파일만(admin-shell/referee-shell 미접촉). 미커밋(PM). 잔여=B-3우측·B-4제출배선 |
| 2026-06-21 | 새 대회 생성폼 B-1 schema+POST 3필드 확장 (developer 세션B) | ✅ 🔴ALTER targeted 적용=`tournaments.schedule_dates jsonb DEFAULT '[]'`(`prisma db execute`·broad push 중단=diff에 live_scoreboards FK drift 혼입 확인). 사후실측 컬럼 정상·65행 보존. schema 1줄 ADD(places 인접). POST 확장=route.ts body분해 `gameRules,scheduleDates` 추가+createTournament 전달 / tournament.ts `CreateTournamentInput` 2필드+places타입확장(id/region/courtCount/naming)+createData game_rules/schedule_dates jsonb round-trip. **3필드 전부 optional**(미전송→`{}`/`[]` 기본값·회귀0). DivisionRule 미생성·시리즈 $transaction·status=draft 불변. prisma generate=DLL락→포트3001 PID78724만 종료 후 성공(개발서버 종료됨·재시작 PM판단). tsc EXIT0. tester 6항목 통과(차단0). git diff=대상3파일만(28+/1-). **커밋 478cf88**(subin·미푸시) |
| 2026-06-21 | 새 대회 생성폼 전면교체 실행계획 (planner 세션B·읽기전용·코드/스키마 무변경·PM확정 가나다 전제) | ✅ 🔴**스키마diff=ADD COLUMN 1개뿐**(`schedule_dates Json? @default("[]")`·NULL허용 무중단·승인후 targeted SQL). game_rules(L304 죽은컬럼)·places(L317 jsonb)·DivisionRule.settings(L3496)=전부 기존컬럼 활성/타입확장. (가)game_rules=시안 GAME_SETTINGS 12키 1:1 jsonb(camel그대로·Flutter무영향). (나)schedule_dates=`[{id,date,court_ids[]}]`·코트id=`<venueId>_c<idx>`·places[].courtCount/naming 파생(court테이블 신설❌). (다)전면교체=page.tsx(1849줄 Quick/Legacy/SUBTABS) **본문만 2컬럼교체**·라우트불변→외부링크0파손. **POST/createTournament 100%재사용**+3필드확장(route.ts L142분해+tournament.ts createData L460). ⚠️**DivisionRule 자동생성=createTournament 미수행**(grep0·categories jsonb만 저장·DivisionRule은 [id]/divisions 다운스트림)→시안"자동생성"=신규동작·1차 categories jsonb 권고. 배치4분해(B-1 schema+POST게이트 / B-2 좌측 / B-3 우측 / B-4 통합·게시모달). prospectus/협회마법사=보존·draft자동채움 유지. 시안 정규대회=시리즈·CATEGORY_MASTER=admin_categories실연동. 미커밋 |
| 2026-06-21 | 새 대회 생성폼 정합 조사 (planner 세션B·읽기전용·코드/스키마 무변경) | ✅ 🟢**Flutter 게이트=키변경 NO·충돌0**(match-sync.ts+sync route 전수정독=game_rules 미read·점수/스탯/PBP만 / `Tournament.game_rules`=dead column schema L304有·src grep 0). 시안 경기설정(유니폼·방식·파울·타임아웃) 서버 미저장=신규빈공간. 시안"GameRules 1:1정합"=Flutter앱 내부모델 정합이지 서버계약 아님. §2=시리즈/결제/admin_categories 재사용·신규0. 🔴**진짜신규=날짜↔코트 배정**(tournament_date·date_court grep 0·places는 평면 장소배열·courts/court_infos=픽업게임DB 무관)→jsonb확장 권고(places확장+schedule_dates·DivisionRule date/court는 settings흡수·무중단). 화면=시안 2컬럼단일폼 vs 기존 step위저드(Toss리스킨完)→**신규페이지 추가(병행) 권고**. PM결정3건(가:game_rules저장위치/나:날짜코트 jsonb vs정규테이블/다:리빌딩범위)·🚦schema게이트 대상. 미커밋 |
| 2026-06-21 | Track B 참가신청 3단계 후속 정리 (developer 세션B) | ✅ ①orphan 4파일 git rm(_v2/enroll-aside·poster·step-docs·step-payment·소스 import grep 0 확인·aside→poster 둘다삭제) ②dead CSS 제거(tournament-enroll.css 구 Material 구역 .te-h3/pay*/method*/bank*/bill*/success* 전량·615→308줄·약307줄·Toss .ts-*53규칙 유지) ③대표자/연락처 UI=값있으면span/없으면input 삼항→**항상 prefill input**(편집가능·canNext trim게이트 유지·빈값회귀 보존). route.ts/joinSchema/schema diff0·본인인증/주장가드/약관게이트/snake/adaptive 보존. tsc EXIT0. git=join영역만(삭제4·수정2). 미커밋(PM) |
| 2026-06-21 | Track B Phase4 후속 비차단 3건 수리 (developer) | ✅ ①B-a teams PATCH approvedCount조회 $transaction **내부 이동**(race강화·동시 paid시 cap초과 차단·cap값조회는 tx밖 유지·`{updated,promoted}`반환) ②B-d matches GET 가드 `requireTournamentAdmin`→`requireRecordersManageAccess`(recorder_admin 통과·PATCH와 정합·POST 미접촉) ③B-d recorders page `roundName/scheduledAt`→`round_name/scheduled_at` snake교정(**응답키 실측 확정**=apiSuccess→convertKeysToSnakeCase→snake). 가드조건/승격로직/멱등/teams_count 동기화 전부 동일. 스키마0·신규모델0·기능회귀0. tsc EXIT0. git=대상3파일만(teams API/matches API/recorders page). 미커밋(PM) |

## 기획설계 (planner-architect)

### 생성폼 후속(로고·디비전날짜코트) 저장위치 설계 (2026-06-22, 읽기전용·코드/스키마 무변경)

🎯 결론: **두 후속 모두 스키마 변경 0(Tournament.settings jsonb 활용)으로 가능 = YES**. 신규 컬럼·prisma 명령 불필요.

**1️⃣ settings 무스키마 가능 = ✅ YES (실측 확정)**
- `Tournament.settings Json? @default("{}")`(schema L326) 존재. createTournament가 `settings?: Record<string,unknown>` 인자 수신(tournament.ts L179)→`JSON.parse(JSON.stringify(input.settings))` round-trip 저장(L524~526, BigInt/readonly 안전). route.ts POST가 body의 `settings` 분해(L159)→`settings: settings && typeof === "object" ? settings : undefined`(L270) 전달.
- **다만 현재 page.tsx handleSubmitDraft body에 settings 키 미전송**(L387~413 확인)·CtDraftPayload에 settings 필드 없음 → **page.tsx·ct payload에 settings 1키 추가만 하면 끝**(route/service 무변경).
- 멀티키 merge 패턴 = decisions.md L492~512 표준(`{...(match.settings as Record), 신규키}`) 이미 확립. 1차 생성은 신규대회라 기존 settings 없음 → 단순 `{ sponsor_logos, div_schedule }` 객체 통째 전송이면 충분.

**2️⃣ 후원사 로고URL — 무스키마 설계 ✅**
- 🔑 **소비처 실측 정정(중요)**: errors.md L9·scratchpad L62가 "표시화면 tournament-about.tsx L42 `.split(",")` = sponsors 컬럼 표준"이라 했으나 **오인**. 그 split은 `description` 텍스트의 **"Sponsored By:" 라인 파서**(L40~42)이지 `Tournament.sponsors` **컬럼** 소비 아님. `Tournament.sponsors` 컬럼 소비처 전수(Explore 교차검증): ①편집 = 수정 wizard(`tournaments/[id]/wizard/page.tsx` L219 prefill·L728 textarea·L974 미리보기·L469 PATCH·placeholder "후원사 (쉼표 구분)"L731) ②**유일 렌더 표시 = OBS 스코어보드**(`obs/scoreboard/page.tsx` L190~196·`s.sponsors`에서 "molten"/"stiz" **문자열 필터**로 브랜드로고 2종만) ③공개 대회상세 about = **미사용**(description 파서만) ④GET /tournaments/[id] 응답 = sponsors 누락(TOURNAMENT_DETAIL_INCLUDE 미포함). → **콤마구분 plain 문자열이 정합 포맷**(수정wizard + OBS 둘 다 plain string 호환).
- **설계**: `sponsors`(String 콤마이름)는 **현행 유지**(B안·콤마 join 그대로·수정wizard 호환·회귀0). 로고URL은 **`settings.sponsor_logos`(jsonb `[{name,logoUrl}]`)에 별도 저장**. 무스키마 가능 = ✅.
- ct-create-tournament는 **이미 `Sponsor={id,name,logoUrl}` state + 로고 입력 UI(ImageUploader·L344~357) 완비** → publish()에서 logoUrl이 버려질 뿐. payload에 `sponsorLogos: sponsors.filter(s=>s.logoUrl).map(s=>({name,logoUrl}))` 1줄 추가.
- ⚠️ **읽어 표시하는 소비처 = 현재 0건**(컬럼·settings 양쪽). 로고를 화면에 띄우려면 **소비처 신규 필요**(대회 상세 about·admin 상세). 1차 = 저장만(write), 표시는 후속 배치로 분리 권장(저장↔표시 디커플). 표시 0이어도 데이터 무손실 보존이 목적이면 1차로 충분.

**3️⃣ 디비전별 날짜/코트 — 무스키마 설계 ✅**
- DivisionItem이 **이미 `dateId?`·`courtId?` 보유**(ct-divisions.tsx L29~30)+입력 UI 완성(L172~195). publish() 평면변환(ct-create-tournament L519~528)이 catRecord/divCaps/divFees 3종만 만들고 **dateId/courtId를 의도적으로 버림**(L515~518 사일런트손실 주석 박제).
- **설계**: `settings.div_schedule`(jsonb `{디비전명:{dateId,courtId}}`)에 저장. 평면변환부에 `divSchedule[dv.name]={dateId:dv.dateId,courtId:dv.courtId}`(dateId/courtId 둘 다 있을 때만) 맵 구성 1블록 추가 → payload→POST body settings에 흡수. DivisionRule 1차 미생성(PM결정 유지)이므로 Tournament.settings 흡수가 정합. 무스키마 = ✅.
- ⚠️ 소비처(디비전별 일정 표시)도 현재 0 → 1차 저장만. dateId=scheduleDates[].id 참조·courtId=`<venueId>_c<idx>` 참조라 표시 시 역참조 조인 필요(후속).

**4️⃣ 판정 + 최소 구현안**
- ① **settings 무스키마 = YES** / ② 로고=`settings.sponsor_logos`·디비전날짜코트=`settings.div_schedule` (둘 다 무스키마) / ③ 스키마 승인 **불필요**(prisma 무변경·api/v1 무영향·createTournament 시그니처 무변경).
- 📍 변경 파일 (3개·전부 생성폼 영역·세션B 소관):
  | 파일 | 변경 요지 | 신규/수정 |
  |------|----------|----------|
  | `ct-create-tournament.tsx` | CtDraftPayload에 `settings?:{sponsor_logos?,div_schedule?}` 1필드 추가 / publish()에서 sponsorLogos·divSchedule 맵 구성(L519~528·L539~542 인접) → payload.settings 채움 | 수정 |
  | `wizard/page.tsx` | handleSubmitDraft body에 `settings: payload.settings && Object.keys(payload.settings).length ? payload.settings : undefined` 1줄 추가(L387~413 body) | 수정 |
  | (소비처·후속분리) 대회상세 about / admin 상세 | settings.sponsor_logos·div_schedule 읽어 표시 | 신규(후속배치) |
  - route.ts·tournament.ts·schema·`/api/v1` = **전부 무변경**(settings 수신 경로 기존 존재).
- 🧩 배치 분해(작게):
  - **F-1 (저장만·코드2파일)**: ct payload `settings` 필드 + publish() 맵 구성 + page.tsx body 1줄. tsc만으로 커밋 가능(소규모). 로고·디비전날짜코트 둘 다 settings에 저장.
  - **F-2 (표시·후속·선택)**: 대회상세 about에 sponsor_logos 로고그리드 / 디비전 일정에 div_schedule 역참조 표시. 소비처 신규라 별도 배치.
- ⚠️ developer 주의: ①snake 함정 = settings는 jsonb 내부라 **자동 snake 변환 대상 아님**(키 그대로 round-trip). 응답에서 `data.settings.sponsor_logos` 그대로. 단 sponsors **컬럼**은 응답키 snake. ②sponsors 컬럼 B안(콤마 join) **현행 유지**(수정wizard 회귀 방지) — settings는 **추가**만. ③settings 빈객체면 미전송(`undefined`)해 기존 settings round-trip 무해. ④BigInt 직렬화=settings엔 BigInt 없음(문자열만)·안전. ⑤소비처 0 = 저장 후 화면 변화 없음(정상·F-2에서 표시). ⑥createTournament 시그니처 무변경·api/v1 무영향 확인(settings는 웹 전용·match-sync 미read).
- 📚 knowledge 승격 후보(PM): decisions.md → "생성폼 후속(로고·디비전날짜코트) = Tournament.settings jsonb 흡수·스키마0(sponsor_logos/div_schedule 키)" / errors.md 정정 → "Tournament.sponsors 컬럼 소비처 = 수정wizard 1곳(콤마 plain)·tournament-about의 split은 description 'Sponsored By:' 파서지 컬럼 아님(L9 오인 정정)".

### 🔒 Track B §0 스키마 대조 결과 (2026-06-21, 읽기전용 검증)

🎯 결론: 계약서(DATA-BINDING v2 / BDR-join-v1 flavor) "신규 5건" 중 **진짜 신규 = admin_categories 1건뿐**. 나머지는 전부 이미 존재 → 계약대로 따르면 중복테이블 생성·기존 대회시스템 파손. recorder_assignments(경기별)·is_waiting·format_presets·DivisionRule.cap·brackets/groups/matches 별도모델 = **박제 금지**.

**A. 확정 대조표** (계약 주장 | 실제 prisma | 판정 | 조치)
| 항목 | 계약 주장 | 실제 prisma (파일:라인) | 판정 | 조치 |
|------|----------|----------------------|------|------|
| admin_categories | 신규(복원) | **부재**(grep 0) | ✅진짜신규 | BigInt PK로 신규 추가 OK(아래 B-1) |
| DivisionRule.format | ALTER ADD | `format String?`(schema L3486) | 이미존재 | ADD 금지 |
| DivisionRule.settings | ALTER ADD | `settings Json? @default("{}")`(L3496) | 이미존재 | ADD 금지 |
| DivisionRule.feeKrw | ALTER ADD `fee_krw` | `feeKrw Int @default(0) @map("fee_krw")`(L3480) | 이미존재 | ADD 금지 |
| **DivisionRule.cap** | 기존 가정("cap/max_teams 유지") | **부재** — DivisionRule에 cap/max_teams 컬럼 없음 | ⚠️계약오류 | cap은 rule에 없음·아래 PM①참조 |
| TournamentTeamPlayer | 신규 조인테이블 | **존재**(L624~). tournamentTeamId/userId/jerseyNumber/position/player_name/birth_date/is_elite/isStarter 전부有(L626~637) | 이미존재 | 신규 CREATE 금지(치명·기존 로스터/기록 파손) |
| TournamentMatch brackets/groups/matches | 신규 3모델 | **단일 통합모델 TournamentMatch**(L689~). bracket_position(L698)/round_number(L695)/group_name(L697)/group_letter(L725)/next_match_id(L710)/quarterScores(L707)/round_name(L694)/match_code(L719)/category_letter(L721)/division_tier(L723) 전부有 | 이미존재 | brackets/groups/matches 별도모델 CREATE 금지. 조=group_name/group_letter 컬럼, 라운드=round_number, type=settings/format으로 흡수済 |
| TournamentTeam.is_waiting | boolean 추가 | **불필요** — `waiting_number Int?`(L579) + `status="waiting"` 값으로 대기판정 이미 구현(join/route.ts L346~400 maxWaiting+1) | 이미존재(다른방식) | is_waiting ADD 금지 |
| tournament_recorders | 신규 per-match recorder_assignments | **대회단위 풀 존재**(L2248 tournament_recorders: tournamentId/recorderId/assignedBy/isActive·@@unique[tournamentId,recorderId]). **경기별 배정은 부재** | 부분(풀有/경기별無) | PM② 결정필요 |
| Tournament.div_caps | (계약: rule.cap 권위·div_caps는 파생) | `div_caps Json? @default("{}")`(L333) + `div_fees`(L334) **정원판정 단일소스로 실사용**(join L349 divCaps[division]) | 이미존재·역할상충 | PM① 결정필요 |
| allow_waiting_list/waiting_list_cap | (계약 무언급) | `allow_waiting_list Boolean?`(L335)·`waiting_list_cap Int?`(L336) 존재·실사용(join L362,376) | 이미존재 | 활용 |
| payment_status | 시안 payment 그대로 | `payment_status String? @default("unpaid")`(L572). 값집합=**unpaid(default)/paid/refunded** (계약 "pending" default 오류) | 이미존재·default다름 | unpaid 기준 매핑(아래 D) |
| TournamentTeam.status | 4값 pending/approved/rejected/**paid** | 실제값=**pending/waiting/approved/rejected**(+completed系는 match전용). status에 paid 없음(paid는 payment_status) | 계약오류 | 아래 D 매핑 |
| format_presets | 선택 신규 | **부재**(grep 0). BDR-join-v1 tournament_presets는 계약 자체가 "고아·박제금지" | 진짜신규(선택) | PM⑤ 결정필요 |

**B. 진짜 필요한 마이그레이션 목록** (admin_categories 외 정말 필요한 것만)
- **B-1. admin_categories — 유일 필수 신규**. ⚠️계약 SQL은 `uuid PK`지만 **mybdr 표준=BigInt @id @default(autoincrement()) + @map snake**. 권고 모델: `model AdminCategory { id BigInt @id @default(autoincrement()); name String @db.VarChar; divisions Json @default("[]"); ages Json @default("[]"); sortOrder Int @default(0) @map("sort_order"); createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz(6); @@map("admin_categories") }`. 무중단 CREATE TABLE(기존 영향0). 시드는 PM③.
- **B-2. (옵션) DivisionRule.cap** — div_caps를 rule로 옮길지는 PM① 결정에 종속. **현행 div_caps 유지 권고 → 컬럼 ADD 불필요**.
- **B-3. (옵션) match_recorders 경기별 배정** — PM② 결정 시에만. 신규 시 BigInt PK·@map snake·tournamentMatchId FK.
- **그 외 계약 마이그레이션 7건(DivisionRule 3컬럼·TTP·brackets/groups/matches·is_waiting) = 전부 불필요·일부는 실행 시 파손**.

**C. PM 결정 필요 5건(§10) 권고안**
- **① 정원 cap 위치**: 권고=**현행 `Tournament.div_caps`(jsonb) 유지**. 사유=join/route.ts가 이미 div_caps 단일소스로 정원판정·운영 중. 계약의 "rule.cap 권위+div_caps 파생동기화"는 mybdr와 역방향이라 채택 시 정원로직 재작성+회귀위험. DivisionRule엔 cap 컬럼 자체가 없음(계약 가정 오류). → div_caps 유지·UI는 div_caps 읽기/쓰기.
- **② 경기별 기록자 배정**: 현행=대회단위 풀(tournament_recorders)만. 경기별 배정은 **부재**. 권고=시안 TnRecorders가 경기별 select를 요구하면 신규 `match_recorders`(또는 TournamentMatch.settings.recorder_id jsonb) 필요. **최소침습 옵션=settings jsonb 키**(스키마0). 정식 배정테이블은 자동배정/이력 필요 시. → PM이 시안 요구수준 확인 후 택1.
- **③ admin_categories 4종 시드 정확성**: 계약 시드=일반부 D3~D8 / 유청소년(하모니·i1~i4 + U8~U18) / 대학부 U1~U3 / 시니어 S1~S3(+40~+70). **사용자 실데이터 대조 필요**(BDR-join-v1 운영 DB 복원이 정확·없으면 시드). → PM이 4종 명칭·디비전 배열 사용자 확인.
- **④ 출전 최소인원/게스트 정책**: 계약=MIN_PLAYERS_GUARD/ALLOW_GUEST 토글 정책확정 후 on. 현행 join 흐름은 최소인원 가드 없음·게스트 개념 없음(team_members 기반). 권고=**토글 off로 박제**(정책 미정 → 후속). → PM 확인.
- **⑤ format_presets 도입**: 부재(진짜 신규). 권고=**보류**(운영 사용0·과투자·BDR-join 원본도 고아). 디비전별 format은 이미 DivisionRule.format/settings로 충분. → 미도입 권고.

**D. status/payment 배선 매핑 확정** (시안 4상태 → mybdr 실필드)
| 시안 status | mybdr status (실값) | payment_status (실값) | waiting_number | 비고 |
|-------------|--------------------|-----------------------|----------------|------|
| APPLIED(접수완료) | `pending` | `unpaid` | null | 계약의 payment "pending"=오류, 실제 default `unpaid` |
| WAITING(대기) | **`waiting`** (계약의 pending+is_waiting 아님!) | `unpaid` | N번(maxWaiting+1) | is_waiting 컬럼 불필요·status="waiting"+waiting_number로 판정 |
| CONFIRMED(확정) | `approved` | `paid` | null | 입금완료→approved 트리거는 운영 PATCH로 구현 |
| CANCELED(취소) | `rejected` | `unpaid`\|`refunded` | null | |
- ⚠️ 계약 §3 매핑(WAITING=pending+is_waiting / payment default=pending)은 **mybdr 실필드와 불일치**. 위 표가 실제 정합. is_waiting boolean 추가 금지.

📚 knowledge 승격 후보(PM 판단): 
- decisions.md → "Track B 계약(BDR-join flavor) vs mybdr 실스키마 대조 — 신규 1건뿐·중복생성 방지" / "정원 cap = div_caps jsonb 유지(rule.cap 미채택)"
- architecture.md → "대회 운영 도메인 = TournamentMatch 단일통합모델(brackets/groups/matches 흡수)·TTP 로스터조인 기존存·waiting_number 대기시스템 기존存·tournament_recorders 대회풀(경기별無)"
- errors.md → "외부 flavor 계약서의 '신규' 주장 ≠ 실스키마 — uuid PK/generic SQL/status값집합 1:1 대조 의무(BigInt PK·@map snake·status=waiting별도값)"

### 종별 마스터 관리 화면 설계 (2026-06-21, 읽기전용·코드/스키마 무변경)

🎯 목표: admin_categories(AdminCategory·BigInt PK·이미 테이블+4시드 완료) CRUD UI 1배치 — 종별 목록 조회 + 생성/수정/삭제 + divisions[]·ages[] 칩 편집 + sort_order 정렬. 시안=CategoryMaster.jsx. 관리자 Toss 스킨.

**1️⃣ 통합 위치 권고 = 신규 라우트 `/admin/categories` (설정 하위 탭 ❌)**
- **사유**: ① 기존 `/admin/settings/page.tsx`는 **"use client" + server action(점검모드/캐시) 2카드**만 — 탭 인프라 없음. 종별 CRUD(server 데이터조회 + 모달)를 끼우면 client/server 경계 꼬임(settings는 클라전용). ② 기존 admin 라우트 표준 = **독립 디렉토리 1폴더 = 1화면**(page.tsx + *-content.tsx). 종별은 자체 데이터·API·모달 가진 독립 기능 → 신규 라우트가 정합. ③ 시안 eyebrow="설정 · 종별 마스터"는 **소속 표기**(설정 내장 의미 아님). PLAN.md "설정(종별 마스터 통합)"=IA상 설정 그룹 소속 → 사이드바에서 설정 그룹에 링크 배치로 충족.
- **비유(건물 안내도)**: 설정 화면(작은 사무실)에 종별 관리(별도 창고+작업대)를 욱여넣지 말고, 같은 관리동 복도에 새 방(`/admin/categories`)을 내고 안내판(사이드바)만 설정 구역에 건다.
- ⚠️ 사이드바(AdminShell nav) 링크 추가 = **본 배치 범위 외**(세션A 셸 소관). 라우트만 신설·직접 URL 동작. nav 링크는 PM이 세션 충돌 확인 후 별도.

**2️⃣ API route 명세** (신규 `src/app/api/web/admin/categories/`)
공통: 모든 핸들러 `getWebSession()`+`isSuperAdmin(session)`→비통과 `apiError(403,"FORBIDDEN")`. 응답 `apiSuccess()`(⚠️키 자동 snake_case→프론트 접근자 snake). mutation 후 `adminLog(...)`. BigInt id `.toString()`. schema 0 / api/v1 미접촉.
| 경로 | 메서드 | 요청 body | 응답 | 비고 |
|------|--------|-----------|------|------|
| `/api/web/admin/categories` | GET | — | `{ categories:[{ id, name, divisions, ages, sort_order }] }` | `orderBy:[{sortOrder:"asc"},{id:"asc"}]`. divisions/ages=Json(string[]) 그대로 |
| `/api/web/admin/categories` | POST | `{ name, divisions?, ages?, sort_order? }` | `{ id, name, divisions, ages, sort_order }` | name 필수·미지정 배열→`[]`·sort 미지정→max+1 |
| `/api/web/admin/categories/[id]` | PATCH | `{ name?, divisions?, ages?, sort_order? }` | `{ id, name, divisions, ages, sort_order }` | 부분수정·1키+ |
| `/api/web/admin/categories/[id]` | DELETE | — | `{ id }` | 하드삭제(참조0, 5️⃣) |
- **route 2파일**: `categories/route.ts`(GET+POST) / `categories/[id]/route.ts`(PATCH+DELETE). suggestions/court-submissions 동형. (DATA-BINDING은 `PUT /[id]`라 했으나 mybdr 표준 부분수정=PATCH 채택)
- **Zod**(camelCase 코드, body는 snake 수신): `TagArr=z.array(z.string().trim().min(1).max(40)).max(50).refine(중복차단)` / create=name필수+나머지 optional / update=전부 optional+`.refine(키1개+)`.
- **name @unique 충돌**: create·name수정 PATCH 둘 다 P2002 try/catch→`apiError(409,"DUPLICATE_NAME")`. (시드 upsert가 name기준이라 unique 필수)
- **adminLog**: `category.create/update/delete`, resourceType="AdminCategory".
- **비유(주문 창구)**: 한 창구(`/categories`)에서 메뉴판 보기·등록, 옆 창구(`/[id]`)에서 수정·삭제.

**3️⃣ UI 컴포넌트 명세** (신규 `src/app/(admin)/admin/categories/`) — 기존 패턴(page.tsx 서버조회 + *-content.tsx 클라). ⚠️ settings처럼 page.tsx를 "use client"로 만들지 말 것(서버 prefetch 표준).
- **`page.tsx`(서버)**: ① 권한 가드(`getWebSession`+`isSuperAdmin`, admin layout 1차가드+페이지 방어) ② `prisma.adminCategory.findMany({ orderBy:[{sortOrder:"asc"},{id:"asc"}] })`(server=camel 그대로) ③ BigInt→string·Json 직렬화 후 `<CategoriesContent initial={...}/>`. ⚠️**prisma generate 의존**(5️⃣).
- **`categories-content.tsx`(클라)**: 루트 `<div data-skin="toss">`(라이트 고정). AdminPageHeader(eyebrow="ADMIN · 설정" title="종별 관리"). state=리스트+낙관갱신or refetch. 시안 1:1:
  - 새 종별 추가 카드(name input+추가→POST→append)
  - 종별 카드 리스트(각1카드): 헤더=name 인라인편집+Badge "N 디비전·M 연령"+삭제(trash-2,확인모달) / 2열 grid: **디비전** TagInput(칩+Enter+x) / **연령·옵션** TagInput(보라톤) → 변경 PATCH
  - 안내 푸터(시안 info 박스: admin_categories 연결·4종 복원시드)
- **편집 UX 권고**: 시안=인라인 즉시반영(로컬 mock)이나 운영은 **카드별 "변경사항 저장" 버튼**(name/divisions/ages 묶어 1 PATCH) 권고 — 칩 add/remove마다 호출(채터링) 회피. (또는 칩별 즉시 PATCH 단순안 — developer가 시안충실도 vs 호출수 판단)
- **Toss 매핑**(`@/components/admin-toss` Icon 키트 + `.ts-*`): Icon x/plus/trash-2/layout-grid/cake/info(cake 실존 확인·부재시 ICON_ALIAS 별칭 예 calendar) / Btn→`.btn`·`.btn--sm`or `.ts-btn`(Phase2 키트 정합) / Badge→`.ts-chip`·`.ts-badge` / `.ts-chip--tag/--age` toss-admin.css 재사용(신규 CSS 0 목표) / 색상=토큰만(`var(--primary)`/`var(--ink)`), 시안 `#6D5AE6` 보라는 토큰 부재시 toss 토큰 매핑(하드코딩 hex 금지).
- **비유(레고)**: 종별 카드=블록1개, TagInput=내부 부품 → 디비전·연령 두 곳 재사용.

**4️⃣ 변경/신규 파일**
| 경로 | 역할 | 신규/수정 |
|------|------|----------|
| `src/app/(admin)/admin/categories/page.tsx` | 서버 — 가드+adminCategory 조회+직렬화 | 신규 |
| `src/app/(admin)/admin/categories/categories-content.tsx` | 클라 — Toss 카드+TagInput+모달+CRUD fetch | 신규 |
| `src/app/api/web/admin/categories/route.ts` | GET+POST | 신규 |
| `src/app/api/web/admin/categories/[id]/route.ts` | PATCH+DELETE | 신규 |
| `src/components/admin-toss` ICON_ALIAS | cake 등 부재 아이콘 별칭(필요시) | 수정(선택) |
- prisma schema=수정0(AdminCategory L3514 기존). 사이드바 nav=범위 외.

**5️⃣ 주의·리스크 (developer)**
- **🔑 prisma generate 선행 1순위**: `prisma.adminCategory` 미generate(DB-1시 개발서버 락). page.tsx 컴파일 전 **포트3001 PID만 종료 후 `npx prisma generate`**(`taskkill //f //im node.exe` 금지).
- **name @unique 충돌**: create+name수정 P2002 try/catch→409 DUPLICATE_NAME.
- **divisions/ages 빈배열 허용**: 일반부/대학부 ages=[] 정상·미지정→`[]`·빈배열 저장 막지말것·UI "없음" 표기.
- **삭제 참조 무결성 = 가드 불필요(현재)**: AdminCategory FK 참조 모델 **0건**(grep `adminCategory`=사용처0·@relation 역참조 없음). 대회는 category를 **문자열명**으로만 보유(FK 아님·§0). 삭제해도 기존 대회 안깨짐(고아 문자열 무해). DELETE=단순 하드삭제. UX 안내모달 권고("기존 대회 영향 없으나 생성기 프리셋에서 사라짐"). 향후 FK 도입시 가드 추가.
- **응답 snake 함정**: GET/mutation `apiSuccess`가 sortOrder→`sort_order` 자동변환→content.tsx fetch 접근자 **snake**(`c.sort_order`). page.tsx server prisma는 **camel**(`c.sortOrder`) — 혼동(errors.md 재발6회). 신규필드 전 curl raw 1회.
- **Toss 규약**: 루트 div만 `data-skin="toss"`·공유셸 미부착·하드코딩 hex 금지·lucide-react만.
- **세션 충돌**: 코드영역=`admin/categories/*`+`api/web/admin/categories/*`(전부 신규·기존/세션A 비중첩). `git add` 신규 경로만 명시.

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | 포트별 서버종료+`npx prisma generate`(adminCategory client) | developer | 없음 |
| 2 | API route 2파일(CRUD+Zod+가드+P2002 409) | developer | 1 |
| 3 | page.tsx(서버조회)+categories-content.tsx(Toss UI·TagInput·CRUD) | developer | 1,2 |
| 4 | (필요시) ICON_ALIAS cake 등 별칭 | developer | 3 |
| 5 | tsc --noEmit+동작검증(GET 4행·CRUD·중복409) | tester | 3 |
| 6 | 리뷰(가드·snake정합·토큰·시안충실도) | reviewer (5와 병렬) | 3 |

⚠️ developer 주의: ①prisma generate 1순위(미완시 page.tsx 컴파일 불가)·포트3001 PID만 ②시안 setMaster 즉시반영=mock → 운영은 **실 API 연동**(fetch+에러+로딩), 더미흐름 박제 금지 ③칩 저장=카드별 저장버튼 권고(채터링 회피).

### 참가신청 3단계 설계 (2026-06-21, 읽기전용·코드/스키마 무변경)

🎯 목표: 시안 Apply.jsx(Toss 룩·3단계: ①참가팀선택+확인 ②종별/디비전(정원·대기) ③출전선수=로스터선택. 유니폼/명단입력 폐지)를 **기존 운영 참가신청 화면 리스킨+단순화**로 박제. ⚠️핵심 발견: **기존 화면이 이미 완전 구현됨** — 신규 화면이 아니라 **기존 page.tsx의 Toss 리스킨+단계 축소**. API/POST 로직은 **무변경 재사용**(시안 요구사항 100% 이미 처리).

**1️⃣ 라우트 위치 권고 = 기존 사용자 (web) 화면 리스킨 (admin 신설 ❌·신규 화면 ❌)**
- **기존 실측**: 화면=`src/app/(web)/tournaments/[id]/join/page.tsx`(use client·1292줄·v2 시안 박제 완료) + 조각 7개(`_v2/enroll-*.tsx`·`tournament-enroll.css`). API=`src/app/api/web/tournaments/[id]/join/route.ts`(GET 데이터·POST 제출, getWebUser 세션·본인인증 게이트·주장권한).
- **🔑 기존 POST가 시안 요구 전부 이미 처리**(route.ts L344~436): div_caps[division] 정원판정·`allow_waiting_list` 가드·`waiting_number=maxWaiting+1`·status `isWaiting?"waiting":(auto_approve?"approved":"pending")`·TournamentTeamPlayer createMany·payment_status default `unpaid`(스키마)·중복신청 409·주장 등번호 single-source(team_members 자동복사). → **POST route 변경 0**.
- **권고 = 기존 page.tsx UI만 Toss로 교체(시안 3단계로 축소)**. 사유: ①참가신청서=**사용자용인데 Toss 스킨 예외**(scratchpad 디자인 분기 §22 명시) — admin 라우트로 옮기면 권한(주장 vs admin)·세션·본인인증 게이트 다 깨짐. ②기존 화면이 이미 시안과 동일 데이터/흐름 → **신규 라우트 무의미·중복**. ③시안이 "사용자가 보게 될 화면"이라 명시(Apply.jsx L7,L70).
- **신규 vs 기존**: **기존 대체(리스킨)**. 신규 화면 아님. 다만 시안이 **단계를 5→3으로 축소**(유니폼step·서류step·결제step 일부 변경): 시안=①팀선택+확인 ②종별/디비전 ③로스터 → 제출 → 완료(입금안내). 기존=대회확인→[디비전]→로스터(+유니폼)→서류→결제. **축소 범위는 PM 확인 필요**(아래 5️⃣ 리스크 "서류/결제 step 처리").
- **비유(건물 리모델링)**: 이미 영업 중인 가게(join 화면)의 **인테리어만 Toss풍으로 교체**하고 동선(5칸→3칸)을 줄이는 것. 주방(POST API)·수도배관(세션/권한)은 손대지 않는다. 옆 건물(admin)에 새 가게를 내는 게 아니다.

**2️⃣ 3단계 UI 명세** (기존 page.tsx 내부 stage 분기 재구성 — StepDots 3칸)
| 단계 | 시안(Apply.jsx) | 컴포넌트·데이터 | 검증(다음 활성) | 기존 매핑 |
|------|----------------|----------------|----------------|----------|
| **①참가팀 선택+확인** | TeamCard 리스트+선택 후 InfoRow(팀명/대표자/연락처/지역/유니폼 **표시만**) | `data.my_teams`(GET join·주장팀만)·선택 시 대표자 자동(`user_info.name/phone`) | `!!selectedTeamId`(+대표자 자동채움이라 항상 채워짐) | 기존 stage="info" 팀선택+대표자 입력 → 시안은 **대표자 입력칸 제거**(InfoRow 표시만, 자동값 제출) |
| **②종별·디비전(정원/대기)** | 종별 chip(CATEGORY_MASTER) → 디비전 카드(`div_caps[d]` cap/current·만석시 "대기접수" Badge·`current>=cap` 판정) | `tournament.categories`(종별→디비전배열)·`div_caps`·`division_counts`(GET) | `!!category && !!division` | 기존 stage="division" 동일 로직(`getDivisionRemaining`·`isFull`·blocked) — 시안 룩으로 |
| **③출전 선수(로스터)** | 로스터 체크 리스트(`team.roster`)·전체선택토글·선출 Badge·선택수 Badge. **명단입력 UI 0**(이미 등록된 선수 선택만) | `selectedTeam.team_members`→players(체크) | (MIN_PLAYERS_GUARD OFF→) 항상 통과. 단 **서버 roster_min 가드 존속**(POST L257)→제출 실패 가능 | 기존 stage="roster"에서 **유니폼 color picker 제거**(시안=표시만)·jersey/position 입력 이미 없음(자동sync) |
| 제출 후 완료 | 입금계좌·금액 안내(isWaiting시 "대기 접수"·아니면 "신청 완료") | POST 응답(status·waiting_number) | — | 기존 EnrollSuccessHero 재사용 가능(Toss 룩 교체) |

- **종별·디비전 데이터 출처 주의**: 시안 Apply.jsx는 `master`(CATEGORY_MASTER=admin_categories)에서 종별→디비전을 가져옴. 그러나 **기존 운영 화면은 `tournament.categories`(대회별 jsonb: {부문명:[디비전]})를 단일소스로 사용**. → 권고=**기존 `tournament.categories` 유지**(대회마다 운영하는 종별/디비전이 다름·admin_categories는 마스터 프리셋일 뿐). admin_categories를 신청서에 끌어오면 대회별 실제 모집 디비전과 불일치. **시안의 master 참조는 mock 편의** → 운영은 categories 채택.
- **StepDots**: 기존 EnrollStepper(5/4단계 adaptive) → 시안 StepDots 3칸. `hasCategories=false`(부문 미설정 대회)면 ②단계 스킵 가능성 → **adaptive 유지**(부문 없으면 2단계). 기존 4-step 분기 로직 참고.
- **유니폼**: 시안=Step1 InfoRow에 색칩 **표시만**(L91~96·신청 시 미입력). 기존=stage roster에서 color picker로 **편집**(uniformHome/Away state→POST 전송). → 시안 따르면 **편집 제거·팀 색상 자동 전송**(`team.primary_color/secondary_color`를 POST `uniformHome/Away`로). POST는 optional이라 무해.
- **비유(레고)**: 팀카드·디비전카드·선수카드 = 블록 3종. 기존 블록을 Toss 색·모서리로 갈아끼우고, 유니폼 편집 블록만 빼낸다.

**3️⃣ API/액션 명세 — 기존 POST 재사용 (신규 0)**
- **재사용 범위(전부)**: `POST /api/web/tournaments/[id]/join`. 시안 요구 = 기존 구현이 이미 충족:
  - TournamentTeam create(status/waiting_number/payment) + TournamentTeamPlayer createMany(선택 로스터) = **트랜잭션(route.ts L387~436) 그대로**.
  - 정원충족 판정→status: `isWaiting?"waiting":(auto_approve_teams?"approved":"pending")`(L392). payment_status는 스키마 default `unpaid`(create에 미지정→default). waiting_number=maxWaiting+1(L368~381).
  - **변경 0**: route.ts·joinSchema 손대지 않음. 클라가 보내는 body(teamId/category/division/uniformHome/uniformAway/managerName/managerPhone/players[])는 기존 그대로.
- **클라 제출 변경(최소)**: 시안 단순화로 ①유니폼=팀 색상 자동(편집칸 제거) ②대표자=자동값(입력칸 제거). 둘 다 **POST body는 동일 형태로 채워 전송**(서버 무변경). `players`=선택분만 `{userId, playerName, birthDate, isElite}`(기존과 동일·jersey/position 미전송→서버 team_members 자동복사).
- **GET 재사용**: `GET /api/web/tournaments/[id]/join`(my_teams·div_caps·division_counts·user_info) 그대로. 시안 데이터(MY_TEAMS·DIVISION_CAPS) = 이 GET 응답에 1:1 대응.
- **MIN_PLAYERS_GUARD/ALLOW_GUEST OFF 박제**: 시안 토글 2개 모두 false 박제(④ PM 확정). ⚠️단 **서버는 roster_min 가드가 이미 존재**(POST L255~259·기본 5명)→선수 5명 미만 제출 시 서버 422. 클라는 시안대로 가드 UI 미노출하되, **제출 실패 에러는 표시**(기존 setError). 게스트 추가 버튼 미노출(ALLOW_GUEST=false).

**4️⃣ 변경/신규 파일** (전부 기존 (web) 화면 리스킨 — 신규 라우트/API 0)
| 경로 | 역할 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/tournaments/[id]/join/page.tsx` | stage 분기 3단계로 축소·Toss 룩(StepDots·ts-card·칩)·유니폼편집/대표자입력 제거·완료화면 | 수정 |
| `src/app/(web)/tournaments/[id]/join/_v2/enroll-stepper.tsx` | StepDots 3칸 스타일(또는 신규 ts-steps) | 수정 |
| `src/app/(web)/tournaments/[id]/join/_v2/tournament-enroll.css` | Toss 토큰 매핑(ts-* 클래스). ⚠️**(web) 다크 테마 충돌 주의**(아래 5️⃣) | 수정 |
| `src/app/(web)/tournaments/[id]/join/_v2/enroll-success-hero.tsx` | 완료(입금안내) Toss 룩 | 수정 |
| (기타 `_v2/enroll-step-docs.tsx`·`enroll-step-payment.tsx`) | 서류/결제 step 처리 결정에 따라 | PM 확정 후 |
- **API route.ts·[id]/route.ts·joinSchema·prisma schema = 수정 0**. admin/* 미접촉. admin_categories 미참조(categories 단일소스).

**5️⃣ 주의·리스크 (developer)**
- **🚨 단계 축소 범위 = PM 확정 필요(최우선)**: 시안 Apply.jsx는 3단계(팀→디비전→로스터)+완료. **서류(docs) step·결제 동의(약관 2종) step이 시안에서 사라짐**. 기존은 서류("준비중" 박제)+결제(약관동의 agreeRules/agreeMedia·입금안내)가 있음. → **약관 동의를 제거하면 기존 동의 흐름 손실**(운영 정책영향). 권고=**시안의 "완료=입금안내"는 기존 EnrollStepPayment의 입금안내를 완료화면으로 흡수**하되, **약관 동의 2종은 완료 직전 유지 검토**(PM 결정). 서류 step("준비중")은 폐지 무해.
- **🚨 (web) 다크 테마 vs Toss 라이트 충돌**: 참가신청서는 **사용자용이지만 Toss 예외 스킨**(디자인 분기). 그러나 (web)은 **다크 기본+var토큰+Material+AppNav 불변** 영역. Toss(라이트·#3182F6·lucide)를 (web) 안에 넣으면 ①AppNav/전역 다크 토큰과 시각 충돌 ②`data-skin="toss"` 토큰 리매핑이 admin용(globals→라이트)이라 (web)에서 동작 보장 안 됨. → **`tournament-enroll.css`에 Toss 토큰을 join 화면 루트 스코프로 격리**(ts-* 클래스 자체 정의·globals 의존 최소화). lucide는 **lucide-react**(CDN injection 금지·시안 toss-kit의 window.lucide 방식 박제 금지). **PM/디자인 확인**: (web)에 Toss 스킨 실제 적용 시 AppNav와의 시각 경계 처리.
- **div_caps 정원 동시성·WAITING race**: 기존 POST가 **제출 시점 서버 재판정**(count→cap 비교·트랜잭션 외부라 미세 race 잔존). 시안 Step2 표시(current/cap)는 **표시용**(클라). 동시 제출 시 waiting_number 충돌 가능하나 **기존 동작 그대로**(신규 리스크 아님·DATA-BINDING §5 "서버 재판정" 이미 구현). 변경 0이라 회귀 없음.
- **로스터 중복/정원**: 기존 POST가 등번호 중복 차단(L331~342·team_members 기준)·roster_min/max 가드(L255~262). 시안 ③단계는 선택만(입력 0)이라 중복 위험↓. 변경 0.
- **snake_case 함정(★재발6회)**: GET join 응답이 `apiSuccess` 경유 → `my_teams`·`div_caps`·`division_counts`·`user_info`·`is_registration_open` **전부 snake**. 기존 page.tsx 인터페이스도 snake로 정의됨(JoinData L89~96 확인). 리스킨 시 **접근자 snake 유지**(camel로 바꾸면 사일런트 undefined). POST 응답 `waiting_number`도 snake.
- **본인인증/주장권한 게이트 보존**: 기존 page.tsx 진입 시 me fetch→미인증 redirect(L165~173)·POST는 requireIdentityVerified+주장확인(route.ts L160,L213). **리스킨 시 이 가드 제거 금지**(보안). admin 라우트로 옮기면 다 깨짐 → (web) 유지 근거.
- **MIN_PLAYERS_GUARD/ALLOW_GUEST OFF 박제**: 클라 토글 2개 false 고정(④ 확정). 게스트 추가 버튼·최소인원 클라가드 UI 미노출. 단 **서버 roster_min 가드는 존속**(시안 주석대로 "추후 확정")—제출 실패 에러만 표시.
- **세션 충돌(2세션 규약)**: 코드영역=`(web)/tournaments/[id]/join/*`. 세션B(tournaments 리빌딩+schema) 소관이나 **세션A(referee)·admin/* 비중첩**. `git add (web)/tournaments/[id]/join/` 명시. schema0·api/v1 미접촉.

📋 실행 계획:
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | **단계 축소·서류/결제step·약관동의·(web)Toss스킨 허용 범위 PM 확정** | pm/사용자 | 없음 |
| 2 | tournament-enroll.css Toss 토큰 join 루트 스코프 격리(ts-* 자체정의·lucide-react) | developer | 1 |
| 3 | page.tsx stage 3단계 축소(팀→디비전→로스터)+Toss 룩·유니폼편집/대표자입력 제거·자동값 POST | developer | 1,2 |
| 4 | enroll-stepper(StepDots 3칸)·success-hero(입금안내 완료) Toss 리스킨 | developer | 3 |
| 5 | tsc+동작검증(GET 팀·정원/대기·제출 status·snake정합·다크충돌) | tester | 3,4 |
| 6 | 리뷰(POST 무변경·가드보존·snake·토큰격리·시안충실도) | reviewer (5와 병렬) | 3,4 |

⚠️ developer 주의: ①**POST route.ts/joinSchema/schema 절대 변경 0**(시안 요구 전부 이미 구현·재사용만) ②**snake_case 접근자 유지**(GET/POST 응답 전부 snake·camel 전환 금지) ③**본인인증·주장권한·다크redirect 가드 제거 금지**(보안) ④(web) 다크 vs Toss 라이트 충돌→join 루트 스코프 토큰 격리·lucide-react(CDN injection 금지) ⑤**1순위=PM이 단계축소/약관동의/Toss스킨 범위 확정 전 착수 보류**(설계 미결).

### 대회 생성+상세 설계 (2026-06-21, 읽기전용·코드/스키마 무변경) — Track B Phase4 마지막 배치

🎯 목표: 시안(TournamentAdmin = 대회 생성 3단계 위저드 + 대회 상세 통합 5탭 IA: 종별·디비전/참가팀/대진표/기록자/공개·완료)을 박제. ⚠️**핵심 발견: 운영 대회 관리 기능은 거의 전부 이미 완전 구현됨**. 위치=`(admin)/tournament-admin/tournaments/`(admin/tournaments 아님!). 따라서 이 배치는 **대부분 리스킨(Toss 비주얼 전환)+IA 재배치**이고, **진짜 신규 = 입금→자동확정 API + 경기별 기록자 settings 키 2건뿐**.

**1️⃣ 기존 vs 신규 판정** (Explore 3종 실측 — admin/* 아닌 `tournament-admin/tournaments/` 가 운영 대회관리 본진)

| 영역 | 기존 구현 | 위치 | Toss 리스킨? | 판정 |
|------|----------|------|------------|------|
| **대회 생성 위저드** | ✅ **완전** — QuickCreateForm(1-step) + LegacyWizardForm(3-step 기본/참가설정/확인) + DivisionGeneratorModal + 이전대회복사(TournamentCopyModal) + draft복구 + prospectus AI | `tournament-admin/tournaments/new/wizard/page.tsx` | ❌ Material/토큰tailwind | **리스킨**(신규 위저드 ❌·시안 3단계는 기존 Legacy 3-step과 거의 동형) |
| **대회 상세 대시보드** | ✅ **완전** — SetupChecklist 8항목+공개게이트(필수7 충족시 공개)+통계4카드 | `tournament-admin/tournaments/[id]/page.tsx` | ❌ | 리스킨 |
| **종별·디비전(DivisionGenerator)** | ✅ **완전** — format드롭다운(8enum)+settings(groupCount등) JSON편집+PATCH즉시저장+Advance | `[id]/divisions/page.tsx` + `_components/DivisionGenerateButton` | ❌ | 리스킨 |
| **참가팀 관리** | ✅ **거의완전** — 목록+상태별필터+status변경(pending→approved/rejected)+선수accordion+apply_token표 | `[id]/teams/page.tsx` | ❌ | 리스킨 + **입금자동확정만 신규**(아래) |
| **대진표** | ✅ **완전** — 진행방식분기+듀얼5섹션그룹핑+DualGroupAssignmentEditor+버전관리+종별generator | `[id]/bracket/page.tsx` | ❌ | 리스킨 |
| **기록자(풀)** | ✅ **완전** — 풀 추가/제거(email)+recorder_admin권한+감사로그 | `[id]/recorders/page.tsx` | ❌ | 리스킨 |
| **공개·완료** | ✅ **완전** — site발행(공개게이트)+completed정리hub | `[id]/site/page.tsx`+`[id]/completed/page.tsx` | ❌ | 리스킨 |
| **🆕 입금→자동확정 API** | ❌ **미구현** — payment_status PATCH 엔드포인트 없음·입금확정→approved 자동승격 없음·대기승격 자동화 없음 | (없음) | — | **진짜 신규**(API) |
| **🆕 경기별 기록자 배정** | ❌ **미구현** — 대회풀만 존재·경기별 select 없음 | (없음) | — | **진짜 신규**(settings.recorder_id PATCH — PM② 확정 settings jsonb 방식) |

- **결론**: 시안 "대회 생성/상세 리빌딩"의 실체 = **(가) `tournament-admin/tournaments/**` 전체 Toss 리스킨**(분량多·기능1:1) + **(나) 미구현 2건(입금자동확정·경기별기록자) 신규 API+UI**. 참가신청(별도 (web) join)처럼 "이미 구현됨"이 대부분.
- **⚠️ IA 충돌**: 시안=**통합 5탭**(한 화면 탭 전환). 운영=**분산 라우트**(`[id]/teams`, `[id]/bracket`...). → 통합 5탭으로 전면 재구성은 고위험·고비용(기존 7화면 server prefetch·SetupChecklist 깨짐). **권고=분산 라우트 유지 + 각 화면 Toss 리스킨**(IA 통합 ❌). 시안 5탭은 "대시보드 상단 탭 네비"로 흡수(SetupChecklist hub가 이미 그 역할). 전면 통합은 별도 대형 의뢰로.

**2️⃣ 하위 배치 분해 + 우선순위** (큰 범위 → 4개 독립 커밋 배치. 의존순)

| 배치 | 범위 | 신규/리스킨 | 독립커밋 | 우선 |
|------|------|-----------|---------|------|
| **B-a. 입금→자동확정 API + 참가팀화면 리스킨** | payment_status PATCH 신규 API(입금확정→approved 자동승격·환불) + `[id]/teams` Toss 리스킨(status/payment select·대기알림·DetailModal) | 신규 API 1 + 리스킨 1화면 | ✅ | **1순위**(시안 핵심차별점=입금자동확정·미구현 유일 기능적 신규) |
| **B-b. 대회 생성 위저드 Toss 리스킨** | QuickCreateForm + LegacyWizardForm(3-step) + DivisionGeneratorModal + 복사모달 Toss룩 | 리스킨(API 0) | ✅ | 2순위(시안 3단계=기존 Legacy와 동형·비주얼만) |
| **B-c. 대회 상세 나머지 리스킨** | 대시보드(SetupChecklist)+divisions+bracket+recorders(풀)+site+completed Toss 리스킨 | 리스킨(API 0) | ✅(화면별 더 쪼갤수 있음) | 3순위(분량多·기능1:1) |
| **B-d. 경기별 기록자 배정(settings.recorder_id)** | matches PATCH에 recorder_id settings키 + `[id]/matches`(또는 recorders 하위) 경기별 select UI + 자동배정 | 신규(settings jsonb·스키마0) | ✅ | 4순위(시안 TnRecorders 경기별·PM② settings 방식 확정) |

- **한 번에 다 못하면**: **B-a만 먼저**(유일한 기능적 신규+시안 핵심). B-b/B-c는 순수 리스킨이라 Phase2 admin 리스킨과 동일 작업·후속 안전. B-d는 독립.
- 각 배치 `git add` 경로 비중첩(B-a=teams+api / B-b=new/wizard / B-c=[id] 하위화면 / B-d=matches+api). 세션A(referee)·admin/* 비대회 미접촉.

**3️⃣ 각 배치 UI/API/파일 명세** (§0 실필드 바인딩)

**■ B-a. 입금→자동확정 API + 참가팀 리스킨** (1순위)
- **🆕 신규 API**: `PATCH /api/web/tournaments/[id]/teams/[teamId]` **확장**(기존 status PATCH 라우트에 payment_status 수용 추가) 또는 신규 `payment` 액션.
  - body: `{ payment_status?: "unpaid"|"paid"|"refunded", status?: ... }`. 가드=기존 canManageTournament 재사용.
  - **입금자동확정 로직(시안 §3 핵심)**: `payment_status="paid"` 수신 시 → 같은 트랜잭션에서 `status` 가 `pending`이면 `approved`로 자동승격(시안 "paid→CONFIRMED"). approved 전환 시 `current_participants`/`teams_count` 캐시 +1(기존 status PATCH의 teams_count 동기화 패턴 재사용). `refunded`→무승격.
  - **대기승격(선택)**: approved 정원초과/취소 시 waiting_number 최소 팀 자동승격 — 복잡·시안은 "대기알림 버튼"(수동 알림)만 → **권고=자동승격 미구현, 알림 버튼=createNotification 1회**(또는 토글OFF 박제). PM 확정.
  - adminLog: `team.payment`/`team.approve`. ⚠️**snake_case**: 응답 payment_status·waiting_number snake.
- **UI 리스킨** `[id]/teams/page.tsx`(+client): 시안 TnTeams 1:1 — StatusTabs(all/APPLIED/WAITING/CONFIRMED/CANCELED count) + 행별 status select·payment select(.ts-badge--tone) + WAITING행 대기알림 벨버튼 + DetailModal(PanelRow 팀정보+로스터 조인 표시) + CSV. **시안 status(APPLIED/WAITING/CONFIRMED/CANCELED)→mybdr 실값 매핑**(D표): APPLIED=`pending`/WAITING=`waiting`+waiting_number/CONFIRMED=`approved`/CANCELED=`rejected`. payment=`unpaid`/`paid`/`refunded` 그대로.

**■ B-b. 대회 생성 위저드 리스킨** (2순위)
- API 0(기존 `POST /api/web/tournaments` 재사용·div_caps/div_fees/categories 저장 이미 처리). 
- UI: `new/wizard/page.tsx`(QuickCreateForm·LegacyWizardForm) Material→Toss(.ts-card·.ts-segment·StepDots 3칸·Btn). **시안 3단계(기본/결제·경기방식/확인)=기존 Legacy 3-step(기본/참가설정/확인)과 동형** → 단계 재설계 ❌·비주얼만. 이전대회복사·DivisionGeneratorModal·draft배너 Toss룩 유지.

**■ B-c. 상세 나머지 리스킨** (3순위·화면별 분할 가능)
- API 0. `[id]/page.tsx`(SetupChecklist 8항목·공개게이트·통계카드) + `[id]/divisions`(format드롭다운·settings) + `[id]/bracket`(진행방식분기·DualGroupAssignmentEditor·버전) + `[id]/recorders`(풀) + `[id]/site` + `[id]/completed` → 전부 .ts-* + lucide. **기능/컬럼/필터/server action/라우트 1:1·비주얼만**(Phase2 리스킨 패턴 동일).

**■ B-d. 경기별 기록자 배정** (4순위·신규)
- **🆕 API**: 기존 `PATCH /api/web/tournaments/[id]/matches/[matchId]`(settings JSON 수정 가능 확인됨)에 **recorder_id를 settings jsonb 키로** 수정. body `{ settings: { recorder_id: <userId|null> } }`(기존 settings 키 보존 merge — division_code/timeouts 등 안깨지게 spread). **신규 테이블 0·스키마 0**(PM② 확정).
- 자동배정(시안 wand): 미배정 경기에 풀(tournament_recorders) 라운드로빈 → 각 매치 settings.recorder_id UPDATE batch. 신규 엔드포인트 `[id]/recorders/auto-assign`(선택).
- UI: 시안 TnRecorders(DataTable: 경기명·일시·코트·기록자select(풀에서)) — `[id]/recorders` 하위 탭 또는 `[id]/matches`에 컬럼 추가. select options=tournament_recorders 풀+`(미배정)`.

**4️⃣ 변경/신규 파일 목록**

| 경로 | 역할 | 신규/수정 | 배치 |
|------|------|----------|------|
| `src/app/api/web/tournaments/[id]/teams/[teamId]/route.ts` | PATCH에 payment_status 수용+입금→approved 자동승격 | 수정 | B-a |
| `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx`(+client) | Toss 리스킨(StatusTabs·select badge·대기알림·DetailModal·CSV) | 수정 | B-a |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx`(+ Quick/Legacy/Division/Copy 컴포넌트) | Toss 리스킨(StepDots·segment·card) | 수정 | B-b |
| `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx` + `_components/SetupChecklist.tsx` 등 | Toss 리스킨 | 수정 | B-c |
| `src/app/(admin)/tournament-admin/tournaments/[id]/{divisions,bracket,recorders,site,completed}/page.tsx`(+client) | Toss 리스킨 | 수정 | B-c |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | settings.recorder_id 수정 수용(merge) | 수정 | B-d |
| `src/app/api/web/tournaments/[id]/recorders/auto-assign/route.ts` | (선택) 경기별 자동배정 batch | 신규 | B-d |
| `src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx`(+client) | 풀 리스킨 + 경기별 select 추가 | 수정 | B-c+B-d |
| Toss CSS — `tournament-admin` 셸/페이지 data-skin 부착 (toss-admin.css 재사용·신규CSS 0 목표) | — | (확인) | 전배치 |
- prisma schema = **수정 0**(전 배치). admin/* 비대회·세션A 미접촉.

**5️⃣ 주의·리스크 (developer)**
- **🚨 TournamentMatch 단일모델 준수**: 대진=별도 brackets/groups/matches 모델 생성 **절대 금지**(§0). 조=group_name/group_letter, 라운드=round_number, type=settings/format. B-d recorder_id도 **TournamentMatch.settings jsonb 키**(신규 테이블 0).
- **🚨 settings jsonb merge 필수**: B-d에서 recorder_id 쓸 때 기존 settings(division_code/timeouts/period_format/recording_mode) **spread 보존**(통째 덮어쓰면 종별뱃지·기록모드 유실 — errors.md 2026-05-17 division_code 누락 동형).
- **div_caps 정원 단일소스**(PM① 확정): 정원=`Tournament.div_caps`(jsonb)만. DivisionRule.cap 도입 ❌. 참가팀 화면 정원표시·대기판정 div_caps 읽기.
- **status 매핑(D표 엄수)**: 시안 4상태≠mybdr 실값. APPLIED=`pending`/WAITING=`waiting`(+waiting_number, is_waiting 컬럼 ❌)/CONFIRMED=`approved`/CANCELED=`rejected`. payment=`unpaid`(default·계약 "pending" 오류)/`paid`/`refunded`. select option value를 실값으로.
- **입금자동확정 트랜잭션**: payment=paid→approved 승격은 **같은 $transaction**(payment_status UPDATE + status UPDATE + teams_count +1). 부분실패 방지. 기존 teams/[teamId] PATCH의 teams_count 동기화 패턴 재사용.
- **snake_case 함정(★재발6회)**: teams GET/PATCH 응답 `payment_status`·`waiting_number`·`current_participants` 전부 snake. client 접근자 snake. server prisma만 camel. 신규필드 전 curl raw 1회.
- **Toss 스킨(admin=data-skin toss)**: `tournament-admin/tournaments/**` 루트div에 `data-skin="toss"` opt-in(공유셸 미부착·Phase2 패턴). toss-admin.css 토큰 리매핑 재사용·하드코딩 hex 금지·lucide-react만(Material→lucide 1:1). **단 이 영역은 admin이라 (web) 다크충돌 없음**(참가신청서와 달리 순수 관리자).
- **세션 격리**: tournaments=세션B 소관·referee=세션A 비중첩. `git add` 각 배치 경로만 명시(전체 add 금지). 다른 세션 staged 점검(conventions.md).
- **추가 스키마 0**(전 배치): payment_status·status·waiting_number·div_caps·settings 전부 기존 컬럼. admin_categories(완료)·신규모델 0.
- **리스킨 회귀0**: 기능/컬럼/필터/server action/라우트/문구 1:1 유지·비주얼만(Phase1~2 admin 리스킨 룰 동일). git diff로 로직라인 변경0 실측.

📋 실행 계획 (B-a 우선·최대 7단계):
| 순서 | 작업 | 담당 | 선행 |
|------|------|------|------|
| 1 | **PM 확정 3건**: ①IA(분산라우트 유지 vs 통합5탭) ②대기승격 자동 vs 수동알림 ③배치 착수 순서(B-a만? 전체?) | pm/사용자 | 없음 |
| 2 | B-a API: teams/[teamId] PATCH에 payment_status+입금→approved 자동승격(트랜잭션·teams_count) | developer | 1 |
| 3 | B-a UI: [id]/teams Toss 리스킨(StatusTabs·select badge·대기알림·DetailModal·status매핑) | developer | 1,2 |
| 4 | tsc+동작검증(payment=paid→approved 승격·정원·snake·status매핑·회귀0) | tester | 2,3 |
| 5 | 리뷰(트랜잭션·가드·snake·토큰·시안충실도·TournamentMatch단일모델) | reviewer (4와 병렬) | 2,3 |
| 6 | B-b 위저드 리스킨(API0) | developer | (B-a 커밋 후) |
| 7 | B-c 상세 리스킨 + B-d 경기별기록자(settings) — 화면별 분할 | developer | (후속) |

⚠️ developer 주의: ①**B-a만 기능적 신규**(입금자동확정)·나머지는 순수 리스킨(API0·기능1:1) ②**TournamentMatch 단일모델·settings merge·div_caps 정원·status D표 매핑·snake 접근자** 엄수 ③신규모델/스키마 0 ④`tournament-admin/tournaments/` 가 본진(admin/tournaments 아님) ⑤시안 통합5탭 전면재구성 보류(분산라우트 리스킨 권고).

📚 knowledge 승격 후보(PM 판단):
- architecture.md → "운영 대회관리 본진 = `(admin)/tournament-admin/tournaments/[id]/{teams,divisions,bracket,recorders,site,completed,playoffs,matches}` 분산라우트(통합탭 아님)·생성=new/wizard(Quick/Legacy/prospectus)·전부 구현완료·Toss 미리스킨"
- decisions.md → "Track B Phase4 = 대부분 리스킨(기능 기구현)·진짜 신규=입금→자동확정 API + 경기별 기록자 settings.recorder_id 2건뿐·통합5탭IA 전면재구성 보류(분산라우트 유지)"

### 새 대회 생성폼 전면교체 실행계획 (읽기전용, 2026-06-21 planner)

🎯 목표: 시안 CreateTournament(2컬럼 단일폼·경기설정·날짜↔코트·게시모달)로 **기존 위저드 UI 전면교체**. 백엔드(POST·createTournament·검증)는 최대 보존·새 필드만 확장. PM확정 전제 (가)game_rules활성 (나)jsonb확장 (다)UI만 교체.

#### 🔴 1. 스키마 diff (승인용 — db push 절대 금지·텍스트만)

**1-A. (나) `schedule_dates` 신규 컬럼 — 무중단 NULL허용 ADD**
```prisma
// model Tournament 내부 (places 컬럼 L317 인접에 추가)
  schedule_dates  Json?  @default("[]")  @map("schedule_dates")
```
- 무중단 보장: NULL 허용 + `@default("[]")` → 기존 행 영향 0(ADD COLUMN ... NULL). prisma db push 시 단일 ADD COLUMN, DROP/ALTER 0. ⚠️ errors.md[06-19] 룰: broad push 금지 → push 전 `prisma migrate diff` 로 의도 ADD만인지 확인, 무관 drift(live_scoreboards 등) 보이면 중단·targeted `ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS schedule_dates jsonb DEFAULT '[]'` 적용.

**1-B. (나) `places` 컬럼 — 스키마 변경 0(타입만 확장)**
- 현재 `places Json?`(schema L317·이미 jsonb). createTournament 서비스 타입은 `{name,address}[]`(tournament.ts L158)인데 **DB는 자유 jsonb** → 컬럼 ADD 불필요. TS 타입만 확장:
```ts
// tournament.ts CreateTournamentData (L158 교체 — 스키마 무관·타입만)
places?: { id:string; name:string; region?:string; courtCount:number; naming:"num"|"alpha" }[];
```
- 코트는 places[].courtCount/naming 으로 표현(별도 court 테이블 신설 ❌·시안 코트=파생값). 운영 courts/court_infos 테이블=픽업게임 DB 무관(§1차조사).

**1-C. `schedule_dates` jsonb 데이터 구조 설계** (날짜↔코트 N:N)
```jsonc
// Tournament.schedule_dates = 날짜별 배정 코트(시안 dates[] 1:1)
[
  { "id":"dt1", "date":"2026-08-15", "court_ids":["v1_c0","v1_c1"] },
  { "id":"dt2", "date":"2026-08-16", "court_ids":["v1_c0"] }
]
// court_id 형식 = "<venueId>_c<index>" (시안 courtsOf 규칙·places[].id 파생).
// 코트 라벨(1코트/A코트)은 places[].naming 으로 런타임 파생(저장 ❌·중복방지).
```
- 다중일자=배열 길이 N. 코트 1~8=places[].courtCount. 명명=places[].naming("num"=1·2 / "alpha"=A·B).

**1-D. DivisionRule dateId/courtId 흡수 = `settings` jsonb (스키마 ADD 0)**
- TournamentDivisionRule.settings(schema L3496·이미 jsonb)에 흡수:
```jsonc
// 디비전별 경기일·코트 매칭(시안 div.dateId/courtId → settings)
"settings": { "date_id":"dt1", "court_id":"v1_c0", /* 기존 group_count 등 보존 */ }
```
- ⚠️ settings spread merge 필수(errors.md 2026-05-17 division_code 누락 동형). 단 **생성 시점엔 DivisionRule 행이 아직 없음**(아래 2-D 참조)—jsonb categories에 우선 박제 or POST 확장 시 createMany.

**1-E. (가) `game_rules` jsonb 저장 구조 — 죽은 컬럼 활성**
- `Tournament.game_rules Json? @default("{}")`(schema L304·이미 존재·src grep 0=완전 미사용). **시안 GAME_SETTINGS_DEFAULTS 12키 그대로 박제**(매핑 ❌·1:1):
```jsonc
// Tournament.game_rules = 시안 ct-game-settings.jsx GAME_SETTINGS_DEFAULTS 1:1
{
  "homeColor":"#FFFFFF", "awayColor":"#1B2A4A", "vestProvided":false,
  "quarterType":"4Q", "quarterMinutes":10, "clockMode":"dead", "shotClock":true,
  "foulLimit":5, "teamFoulBonus":5, "firstHalfTimeouts":2, "secondHalfTimeouts":3,
  "timeoutDuration":30
}
```
- camelCase 키 그대로 저장(jsonb는 변환 무관·apiSuccess snake변환은 응답 최상위 키만). Flutter 무영향 확정(§1차조사: match-sync.ts game_rules 미read).

**스키마 변경 총계: ADD COLUMN 1개(schedule_dates)뿐.** game_rules·places·DivisionRule.settings = 전부 기존 컬럼. 무중단.

#### 🟡 2. 기존 위저드 전면교체 영향 분석

**2-A. 대상 파일 구조(실측)**
| 파일 | 현재 역할 | 처리 |
|------|----------|------|
| `tournament-admin/tournaments/new/wizard/page.tsx`(1849줄) | `QuickCreateForm`(1-step)+`LegacyWizardForm`(3-step)+SUBTABS+draft배너 | **전면교체**(2컬럼 단일폼으로 본문 재작성·라우터 분기 제거 가능) |
| `new/wizard/prospectus/page.tsx` | PDF AI 분석 진입 | **보존**(시안 [PDF로 채우기]=보조 진입점·라우트 유지) |
| `_v2/wizard/association` | 협회 마법사 | **보존**(시안 [협회 마법사]=별도 라우트) |
| `components/tournament/division-generator-modal.tsx` | 종별 자동생성 모달 | 재사용 or 시안 DivisionGenerator로 교체 |
| `components/tournament/tournament-copy-modal.tsx` | 이전대회 복사 | 재사용(시안 [이전 대회 불러오기]=동일 기능) |
| `components/tournament/{schedule-form,registration-settings-form,team-settings-form,bracket-settings-form,game-time-input,game-ball-input}.tsx` | Legacy 폼 조각 | **교체대상**(시안 2컬럼이 흡수·orphan 정리 후속) |

**2-B. POST 엔드포인트·payload(실측)**: `POST /api/web/tournaments`(route.ts) → `createTournament()`(tournament.ts L216~). body 키=name·format·seriesId·places·categories·divCaps·divFees·gender·organizer·host·sponsors·entryFee·bank*·maxTeams·settings 등(route.ts L142~161 구조분해). **재사용 100%**. 응답=`{tournamentId, redirectUrl}`(snake변환→redirect_url).

**2-C. 재사용 백엔드 경계 + 확장지점**
- ✅ **그대로 재사용**: name필수검증·FORMAT_MAP·날짜파싱(L176~187)·seriesId 권한가드(requireSeriesOwner L204)·createTournament $transaction(시리즈카운터+1)·status="draft"·withWebAuth·hasCreatePermission(구독게이트).
- 🔧 **POST body 확장 3지점**(route.ts L142 분해 + L216 createTournament 호출 + tournament.ts createData L460~507):
  1. `gameRules` 신규 키 수신 → `createData.game_rules = input.gameRules ?? {}`. (route.ts 분해 + createTournament 타입/매핑 추가)
  2. `scheduleDates` 신규 키 수신 → `createData.schedule_dates = input.scheduleDates ?? []`.
  3. `places` 확장형 수용(courtCount/naming/region 포함) — DB jsonb라 코드만 타입확장(1-B). createData.places 이미 통과(L478).
- ⚠️ **DivisionRule 자동생성 = 현재 createTournament 미수행**(grep 0·divisionRule.create 0). 운영은 categories/divCaps/divFees를 **Tournament jsonb**로만 저장→DivisionRule은 `[id]/divisions` 다운스트림 생성(DivisionGenerateButton). **시안 "저장하면 종별규칙 N건 자동생성"=신규 동작**. **권고 = 1차는 기존대로 categories jsonb 저장**(div.dateId/courtId는 categories jsonb에 함께 박제·DivisionRule createMany는 후속배치)—전면교체 회귀 최소화. POST에 DivisionRule createMany 추가는 B-4 선택.

**2-D. 진입점 grep(전면교체 시 깨지는 곳)**: `new/wizard` 링크 참조처 = ①사이드바/대시보드 "새 대회" 버튼 ②QuickCreateForm 내부 self-link(`?legacy=1`·전면교체로 제거) ③prospectus가 draft저장 후 `/new/wizard` redirect(loadDraft 자동채움 의존). → **draft 자동채움(loadDraft) 보존 필요**(prospectus 흐름 안깨지게). 라우트 경로(`/tournament-admin/tournaments/new/wizard`) 자체는 **불변**(page.tsx 본문만 교체)→외부 링크 0 파손.

#### 🟢 3. 배치 분해 + 파일 목록 (B-4까지·1배치 1PR)

| 배치 | 범위 | 신규/수정 | 스키마 | 우선 |
|------|------|----------|--------|------|
| **B-1 schema+POST 확장** | schedule_dates ADD COLUMN(승인후 targeted SQL)+game_rules/scheduleDates/places확장형 POST 수용 | route.ts·tournament.ts 수정 | ADD 1 | 1순위(게이트) |
| **B-2 좌측 컬럼 폼** | 대회정보(이름·정규대회=시리즈·주최·주관·후원사·포스터)+일정·장소(VenueSearch·코트수1~8·명명·캘린더다중·날짜별코트) | page.tsx 본문 교체+신규 컴포넌트 | 0 | 2순위 |
| **B-3 우측 컬럼 폼** | 종별·디비전(DivisionGenerator·div별 cap/fee/dateId/courtId 매칭)+경기설정(CTGameSettings 12키·유니폼·프리셋·파울·타임아웃) | 신규 컴포넌트 | 0 | 3순위 |
| **B-4 통합·게시모달·검증** | 하단고정 생성바+PublishModal(게시/접수기간·결제=계좌만·입금계좌)+필수검증 토스트+POST 통합 submit+draft자동채움 보존 | page.tsx 통합 | 0 | 4순위 |

**변경/신규 파일**
| 경로 | 역할 | 신규/수정 | 배치 |
|------|------|----------|------|
| `prisma/schema.prisma` | Tournament.schedule_dates ADD(승인후) | 수정 | B-1 |
| `src/app/api/web/tournaments/route.ts` | POST body에 gameRules·scheduleDates·places확장 수신 | 수정 | B-1 |
| `src/lib/services/tournament.ts` | CreateTournamentData 타입+createData에 game_rules/schedule_dates/places확장 | 수정 | B-1 |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | 2컬럼 단일폼으로 본문 전면교체(Quick/Legacy/SUBTABS 제거·draft자동채움 보존) | 수정(전면) | B-2~4 |
| `.../new/wizard/_components/ct-*.tsx`(좌측·우측·게임설정·게시모달·캘린더·종별제너레이터) | 시안 CT 컴포넌트 운영 포팅(Toss키트·lucide) | 신규 | B-2~4 |
| `components/tournament/{schedule-form,registration-settings-form,team-settings-form,bracket-settings-form,game-*-input}.tsx` | Legacy orphan(전면교체로 미사용) | 정리 대상(후속) | B-4후속 |

**시안→운영 매핑(주의)**
- **정규대회(시안 isRegular/REGULAR_SERIES)** = 운영 **시리즈**(seriesId). 시안 REGULAR_SERIES mock→운영 `/api/web/series/my` 실연동(Quick폼 패턴 재사용). "새 정규대회 생성"=InlineSeriesForm 재사용.
- **종별 마스터(시안 CATEGORY_MASTER)** = 운영 **admin_categories**(Track B-1 완료·`/api/web/admin/categories` GET). DivisionGenerator 템플릿 소스를 mock→실 API.
- **METHODS(진행방식)** = 운영 FORMAT_OPTIONS 4종(group_stage_knockout/dual_tournament/single_elimination/full_league_knockout). div.method→DivisionRule.format or categories jsonb.
- **결제(시안 PublishModal pays)** = 계좌이체만 활성(간편/카드 "준비중" 박제·PG 미연동). bank/account/holder→bankName/bankAccount/bankHolder(POST 기존 키).
- **Toss 키트**: `@/components/admin-toss` Icon(lucide)·`.ts-*`·`data-skin="toss"` 루트 opt-in(공유셸 미부착·Phase2 패턴). 시안 `window.{Icon,Btn,Badge,Modal}`→운영 admin-toss 컴포넌트. 하드코딩 hex 금지(유니폼 16색 hex=도메인 데이터 예외).

⚠️ developer 주의:
- **prisma db push 절대 금지**(B-1 schedule_dates=수빈 승인후 targeted SQL `ADD COLUMN IF NOT EXISTS`). broad push→live_scoreboards drift 위험(errors.md[06-19]).
- **snake_case 함정**: game_rules/schedule_dates는 jsonb 내부 camelCase 그대로 저장(변환 무관). 단 POST 응답 `redirect_url`(snake)·GET 조회 시 최상위 키만 snake변환.
- **DivisionRule 자동생성 보류**: 1차는 categories jsonb 저장(기존 동작)·DivisionRule createMany는 B-4 선택(시안 "자동생성" 충실도 vs 회귀 trade-off→PM 판단).
- **draft 자동채움 보존**: prospectus→loadDraft 흐름 안깨지게(전면교체 시 useEffect loadDraft 유지).
- **places 코트=파생**: 별도 court 테이블 신설 ❌·places[].courtCount/naming jsonb로 표현.
- **세션격리**: tournaments=세션B 소관. `git add` new/wizard·route.ts·tournament.ts·schema만 명시(referee·admin비대회 0).

📚 knowledge 승격 후보:
- decisions.md → "새 대회 생성폼 전면교체 = UI만 교체·POST/createTournament 보존+3필드 확장(game_rules 죽은컬럼 활성·schedule_dates jsonb ADD·places 확장형). DivisionRule 자동생성은 createTournament 미수행(categories jsonb만·DivisionRule은 [id]/divisions 다운스트림)"
- architecture.md → "Tournament.game_rules(L304)·schedule_dates(신규) jsonb=대회 생성폼 경기설정·날짜코트 저장처. createTournament는 categories/divCaps/divFees를 jsonb로만 저장(DivisionRule 행 미생성)"

## 리뷰 결과 (reviewer)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

### [2026-06-21] 새 대회 생성폼 UI B-2+B-3+B-4 (ct-* 4파일 + page.tsx POST배선 + toss-admin.css) — reviewer

📊 종합 판정: **수정 필요 (🔴차단 1 / 🟡권고 3 / 🔵사소 3)**

✅ 잘된 점:
- **snake/camel 정합 정확(errors.md 재발5회 함정 회피)**: ① POST 응답 `data.redirect_url`(snake) 우선·`redirectUrl` 폴백 — apiSuccess 자동 snake 변환 대응 정확. ② categories GET 수신 `json.data.categories` + snake 키(`sort_order`) 정규화·폴백 graceful(ct-divisions L420~433). ③ scheduleDates `court_ids`(snake) 규격으로 변환 후 전송 — service 수신 타입(L173)과 1:1.
- **createTournament 수신키 정합 실측 일치**: categories/divCaps/divFees(route L147·service L502~504)·gameRules/scheduleDates(route L155·service L171/173)·organizer/host/logoUrl/bankName 전부 기존 수신키 — **API/route/schema/`/api/v1` 미접촉**(회귀안전 ✅). gameRules는 camelCase 12키 jsonb 그대로 저장(service L492 round-trip)·Flutter 무영향.
- **GAME_SETTINGS_DEFAULTS 일원화 정확**: ct-game-settings가 GameRules 타입+기본값 정본 export → 메인폼이 import(중복정의 0·drift 방지). shotClock=boolean 시안·B-1 jsonb 1:1 정합(ct-game-settings L27/44·SegSm 사용/미사용 매핑 L366).
- **controlled 패턴 + 불변갱신 정확**: ct-divisions/ct-game-settings 자체 state 0(부모 소유)·mutators 전부 map/filter 불변. pruneCourts(코트 삭제 시 무효배정 정리·메인폼 L426)·useEffect cleanup(`alive` 플래그·ct-divisions L416~444) 정상.
- **한글 IME 가드 일관**: 후원사·디비전명·hex·계좌·예금주·경기장검색 Enter 핸들러 전부 `e.nativeEvent.isComposing` 가드(CLAUDE.md i18n 룰 준수).
- **Toss 격리·토큰 준수**: `data-skin="toss"` 루트 opt-in(page L428)·하드코딩 hex는 유니폼 팔레트(도메인 예외)만·나머지 `var(--*)`·lucide-react만(Material 0)·게시모달 ct-* 클래스 toss-admin.css 스코프 정합 확인.

🔴 필수 수정 (차단):
- **[ct-create-tournament.tsx L531 / page.tsx L393 / service tournament.ts L154·486]** 후원사 1개라도 추가 시 **대회 생성 500 실패**. 새 폼은 `sponsors:{name,logoUrl}[]`(객체배열) 전송 → service `sponsors:input.sponsors??null` → Prisma `sponsors String? @db.VarChar`(schema L313)에 객체배열 INSERT → **런타임 타입에러**. route에 zod 없어 tsc 통과(body any)라 사일런트. 후원사 0개면 우회되나 추가 시 영구 실패. → **수정 요청 테이블 등재**. 수정안=(A)page.tsx에서 `JSON.stringify(payload.sponsors)` 문자열화 전송(로고 보존) 또는 (B)`sponsors.map(s=>s.name).join(", ")`(이름만·로고 버림).

🟡 권고 수정:
- **[ct-divisions L498 안내배너 문구]** "저장하면 종별 규칙 {N}건이 자동 생성됩니다 — …진행방식…" 문구가 **DivisionRule 자동생성을 약속**하나, planner 조사(scratchpad 작업로그)대로 **createTournament는 DivisionRule을 생성하지 않음**(categories/divCaps/divFees jsonb만 저장·DivisionRule은 [id]/divisions 다운스트림 수동). 사용자가 "규칙 자동생성"을 기대하고 다운스트림 미진행 시 혼동. 문구를 "종별·디비전 {N}건이 등록됩니다"로 완화 권고(과약속 제거). 동작영향 0(표시만).
- **[ct-create-tournament L491 / 게시모달 검증 공백]** submit 1차검증은 종별·장소·일정만 보고, **게시모달의 게시기간·참가신청기간·계좌는 빈값이어도 통과**(전부 optional 전송). 시안 의도가 게시기간 필수면 PublishModal onConfirm 전 가드 필요. 현 동작=빈 게시기간 대회 생성 가능(status=draft라 무해할 수 있음·PM 의도 확인). 동작영향 minor.
- **[ct-divisions L195·평면변환 publish L514~520 코트/날짜 매칭 미배선]** 디비전별 dateId/courtId 입력칸은 있으나, publish 평면변환이 **divCaps/divFees만 추출하고 dateId/courtId는 버림**(POST 미전송). service는 scheduleDates(대회단위)만 저장·디비전별 날짜코트 매칭은 미반영. 입력 UX가 저장으로 이어지지 않아 사용자 기대 어긋남(현 단계 범위 밖일 수 있음·PM 확인). 코트 옵션 폴백(L195 배정 없으면 전체 코트 노출)도 UX 모호.

🔵 사소:
- **[ct-schedule-venue.tsx courtsOf]** 메인폼은 `allCourts`만 import(L26~29)·courtsOf 미import → 정상. ct-schedule-venue 내부 courtsOf 사용(L404) 정상. 이슈 없음(확인 완료).
- **[LoadPreviousModal·PAST_TOURNAMENTS / PDF·협회 마법사 버튼 L566~571]** mockup/toast-only stub(백엔드 미연동)=의도된 후속(시안 1:1). 사용자에게 "준비 중" 인지 가능하면 OK.
- **[ct-divisions DivisionItem.method 부재]** 시안 진행방식 필드 제거(DivisionRule 소관)는 계약 우선 정당. 단 위 배너 과약속(권고1)과 맞물려 혼동 가능 — 문구완화로 해소.

### [2026-06-21] Track B Phase4 B-d 경기별 기록자 배정 (settings.recorder_id jsonb merge·3파일) — reviewer

📊 종합 판정: **통과 (차단 0 / 권고 2 / 사소 3)**

✅ 잘된 점:
- **IDOR 차단 정확**: PATCH가 `tournamentMatch.findFirst({ where:{ id:matchBigInt, tournamentId:id } })`로 URL [id]+matchId 동시 검증 → 타 대회 매치 조작 차단(부재 404). 풀 검증도 `tournament_recorders.findFirst({ tournamentId:id, recorderId, isActive:true })`로 동일 대회 활성 풀만 허용 → 풀 외 인원 400 RECORDER_NOT_IN_POOL. 두 가드 모두 tournamentId 스코프 일관.
- **권한 가드 동형 재사용**: requireRecordersManageAccess가 기존 recorders/route.ts 패턴 1:1 복제(recorder_admin 전역분기→tournament존재404 / fallback requireTournamentAdmin=organizer/TAM/super_admin). isRecorderAdmin은 super_admin 자동흡수. 우회 경로 없음.
- **jsonb merge 정합 — errors.md 2026-05-17 동형 방지 정확**: `prevSettings` null/array 방어 후 `{...prevSettings}` spread→recorder_id만 set/unset. division_code/recording_mode/timeouts 등 기존 키 보존·통째 덮어쓰기 0. 해제는 `delete nextSettings.recorder_id`(멱등). auto-assign도 `asRecord(m.settings)` spread 동일 패턴.
- **BigInt 직렬화 정확**: recorder_id는 `.toString()`로 string 저장(JSON BigInt 불가 회피)·응답도 string. parseBigIntParam 변환가드(matchId 실패→404, recorder_id 실패→400).
- **단일모델·스키마0 준수**: TournamentMatch.settings jsonb만 사용(PM② 확정). 신규 테이블/모델/컬럼 0. 기존 matches/[matchId] PATCH(점수/상태) 미접촉→라이브 회귀 0.
- **자동배정 견고**: 풀 빈→400, 매치0 또는 targets0→assigned_count:0 정상반환. overwrite 정책 명확(false=미배정만/true=전체). `pool[idx % pool.length]` 라운드로빈 정확. `$transaction(updates)` 배치 원자성(부분실패 방지). orderBy round_number→bracket_position→id로 순서 안정. 과설계 없음(편의기능 수준 적절).
- **컨벤션**: apiSuccess/apiError·snake_case 수신(body.recorder_id)·adminLog 감사(assign/unassign/auto_assign). UI snake 접근자(is_active/recorder_id) 정합·낙관갱신+실패시 재동기화·IME 가드(L227 isComposing).

🟡 권장(차단아님·후속):
- **[matches GET 권한 불일치 → recorder_admin UI 무용] matches/route.ts L11** — 경기목록 GET은 `requireTournamentAdmin`만 통과(recorder_admin 전역분기 없음). 반면 PATCH/auto-assign은 requireRecordersManageAccess(recorder_admin 통과). 결과: recorder_admin(본인 대회 아닌 전역 기록원 관리자)이 이 화면 열면 loadMatches가 403→빈 목록→배정 UI 무용. **보안 약화 아님**(organizer/TAM/super_admin은 정상). 기능 일관성 차원 후속(matches GET도 requireRecordersManageAccess로 통일 검토). 단 tournament-admin 화면 자체 접근이 recorder_admin에게 열려있는지는 layout 가드 의존→실사용 빈도 낮을 수 있음.
- **[UI camelCase 키 → 항상 undefined] recorders/page.tsx L30·33·334·335** — MatchRow.roundName/scheduledAt를 camelCase로 선언했으나 응답은 apiSuccess snake 변환으로 `round_name`/`scheduled_at`. → `m.roundName` 항상 undefined → roundLabel은 `라운드 N`(round_number fallback)로만 동작. scheduledAt/venue 미사용이라 표시영향 round_name 라벨뿐(경미). snake 접근자로 교정 권장(errors.md 2026-06-13 재발7 회피). 동작은 fallback으로 정상.

🟢 사소(무영향):
- requireRecordersManageAccess 가드가 3파일(recorders/route.ts·recorder/route.ts·auto-assign/route.ts)에 중복 복제. 공용 lib 추출 가능하나 add-only 격리 의도상 현행 OK.
- auto-assign adminLog resourceId 생략(Tournament uuid≠BigInt 컬럼)—주석 명시·정합.
- 낙관갱신 시 settings spread에 `recorder_id: recorderUserId || null`—서버는 키삭제(unassign)지만 클라는 null 유지. 표시(getMatchRecorderId가 null/""→null) 동일·실패시 loadMatches 재동기화로 정합.

🔴 필수 수정: **없음** → merge 가능. 권고2(특히 matches GET 권한 통일)는 후속 권장.

### [2026-06-21] Track B 종별 마스터 관리 화면 (admin_categories CRUD 신규4파일) — reviewer

📊 종합 판정: **통과 (차단 0 / 권고 3 / 사소 3)**

✅ 잘된 점:
- **가드 견고**: 4핸들러(GET/POST/PATCH/DELETE) 전부 getWebSession+isSuperAdmin→403, page.tsx도 페이지단위 방어가드(redirect /admin). 기존 `suggestions/[id]/respond` 패턴 동형. 단일 글로벌 리소스라 IDOR 소유자개념 없음·권한가드만으로 충분(정합).
- **snake_case 함정(★재발6회) 정확 회피**: apiSuccess가 sortOrder→sort_order 자동변환. content.tsx 접근자 snake(sort_order)·page.tsx 직렬화도 snake로 맞춤·server prisma만 camel(sortOrder). errors.md 2026-06-13 룰 준수.
- **P2002/P2025 분기 정확**: POST·PATCH name중복→409 DUPLICATE_NAME, PATCH·DELETE 대상부재→404 NOT_FOUND. try/catch race 안전(선조회-404 TOCTOU 갭 회피). 미인지 Prisma 에러는 throw 재던짐(500 위임).
- **Zod 완전성**: TagArr 각1~40자 trim·최대50개·중복 refine차단. name 1~80자. update 최소1키 refine. req.json() 파싱실패 400 가드. parseId BigInt 변환가드(숫자아닌 id→400).
- **Toss 규약 준수**: data-skin="toss"=page 루트div만(content DOM상속·공유셸 미부착). lucide-react import(CDN injection 0). 아이콘 8종(cake/layout-grid/trash-2/plus/x/info/save/circle-x) 전부 실존·빈폴백0. .ts-* 클래스·CSS변수 전부 [data-skin="toss"] 스코프 정의 확인. 신규 CSS 0.
- **편집 UX**: 칩 add/remove마다 PATCH(채터링) 회피→카드별 dirty판정 후 1 PATCH. 저장성공시 서버응답 재동기화(useEffect). 로딩/에러 상태 노출.
- **키트 props 정합**: Icon/Btn/Badge/Modal·AdminPageHeader 시그니처 사용법 전부 일치(타입오류 0). tsc EXIT0.

🟡 권장(차단아님·후속):
- **[한글 IME 가드 누락] categories-content.tsx TagInput L106·CategoriesContent L416** — `onKeyDown` Enter commit에 `e.nativeEvent.isComposing` 가드 없음. conventions.md [2026-05-07] 룰: 한글 입력가능 input의 Enter submit은 isComposing 가드 의무. 종별명/태그(한글 "하모니"·"일반부")를 Enter로 commit→마지막 글자 잘림/중복 위험. `if (e.nativeEvent.isComposing) return;` 첫줄 추가 권장.
- **[sort_order max+1 race] route.ts POST L99** — aggregate→create 2쿼리 사이 동시 POST 시 sort_order 충돌 가능. sort_order @unique 아니라 에러 안남(동률은 id 2차정렬 안정)→실해 경미. 단일 super_admin 운영이라 동시성 사실상 0.
- **[삭제 후 상태] categories-content.tsx L189** — disabled={deleting} 가드로 중복클릭 차단됨. 성공시 카드 언마운트라 무해. 사소.

🟢 사소(무영향):
- route.ts·[id]/route.ts TagArr·serialize 코드 중복(2파일). 공용추출 가능하나 가독성 양호로 현행 OK.
- PATCH adminLog changesMade=parsed.data 전체(snake키 포함)—로그표시용 무영향.
- 인라인 style 다수·#6D5AE6 1곳(연령라벨 color)—시안 .ts-chip--age 동일값 재현(신규 하드코딩 아님). 룰10 경미·시각영향0.

🔴 필수 수정: **없음** → merge 가능. 권고(특히 IME 가드)는 후속 권장.

### [2026-06-21] Track B 참가신청 3단계 (Toss 리스킨, (web) join 4파일) — reviewer

📊 종합 판정: **수정 필요 (차단 1 / 권고 3 / 사소 2)**

✅ 잘된 점:
- **POST/스키마/Prisma 0 변경 실측 확인**: `git diff --stat HEAD`로 route.ts·validation 빈 diff 확인. 클라 body(teamId/category/division/uniformHome/uniformAway/managerName/managerPhone/players[]) 형태 = joinSchema와 일치. players는 userId+playerName+birthDate+isElite만 전송, jersey/position 미전송→서버 team_members 자동복사(single source) 정합. 서버 회귀 0.
- **보안 가드 전부 보존**: ①본인인증 사전 redirect(page L179~183 me fetch→name_verified===false→/onboarding/identity) ②POST requireIdentityVerified(route L160) ③주장 가드(route L213~219 captainId 검증) ④중복신청 409(route L247~252) 전부 유지·미접촉. admin 라우트 이전 없이 (web) 유지로 세션/권한 게이트 보존.
- **snake_case 접근자 유지(★재발6회)**: my_teams/div_caps/division_counts/user_info/is_registration_open + POST 응답 waiting_number 전부 snake. JoinData 인터페이스 snake 정의·접근 일관. camel 전환 0.
- **Toss 격리 완전**: CSS 전 규칙이 `.te-enroll[data-skin="toss"]` 프리픽스 스코프. `:root`/html/body/태그 셀렉터 전역 누수 0(grep 확인). Toss 토큰(--primary 등) 루트 스코프 자체정의로 (web) 다크 globals 무의존·라이트 고정. lucide-react 직접 import(CDN/window.lucide 0). 인라인 #fff/#E31B23은 team color 데이터 폴백(테마토큰 아님)—룰10 비위반.
- **약관 게이트 견고**: canSubmit = !submitting && is_registration_open && agreeRules && agreeMedia && minOk (page L446~451). 약관 2종 미동의 시 제출 버튼 disabled·우회 경로 없음(handleSubmit는 버튼 onClick 단일 진입). adaptive 단계(hasCategories=false→2단계) 분기 정확.

🔴 필수 수정(차단·merge 전 해결):
- **[대표자 연락처 null → 영구 제출 차단] page.tsx L148~150·195~198·439·263~264** — 시안 단순화로 **대표자 입력칸 + 클라 게이트를 둘 다 제거**했는데, managerName/managerPhone을 user_info 자동값으로만 채우고 빈값이면 `""` 전송. 서버 joinSchema는 `managerName/managerPhone: z.string().min(1)` **필수**(route.ts L26~27). **카카오/구글 가입자 등 user.phone이 null인 사용자**(흔함)는 ①입력칸 없음 ②info단계 canNext가 `!!selectedTeamId`만 체크(대표자 게이트 없음, L439) ③제출 시 422 "대표자 연락처를 입력하세요" ④고칠 UI 없음 → **참가신청 영구 불가**. 이전 page.tsx는 입력칸(L683/698)+게이트(`!managerName||!managerPhone`)가 있어 이 케이스를 막았음 = 명백한 회귀. **수정안 택1**: (A) user_info.phone/name 빈값이면 ①단계에 대표자 이름·연락처 입력칸 노출(자동값 prefill·비면 직접입력)+canNext에 `!!managerName&&!!managerPhone` 추가, (B) 항상 입력칸 표시(자동prefill·편집가능). 시안 "표시만"은 user_info 완비 가정인데 운영 데이터는 phone null 다수→가정 불성립.

🟡 권장(차단아님·후속):
- **[orphan 파일/dead CSS] _v2/ + tournament-enroll.css L1~316** — 신규 page.tsx가 enroll-aside·enroll-poster·enroll-step-docs·enroll-step-payment 4파일을 더이상 import 안 함(grep: 자기들끼리만 참조). CSS .te-method/.te-success/.te-pay/.te-bank/.te-bill/.te-h3(L22~316 ≈300줄)도 enroll-step-payment.tsx(=orphan)에서만 사용→dead. 컴파일/동작 무해하나 혼동·번들 잔재. 후속 정리 권장(삭제는 developer·세션 충돌 확인 후).
- **[대표자 자동값 1회 prefill] page.tsx L194~198** — 데이터 로드 시 1회만 prefill, 이후 갱신 없음(신청 1회성이라 무해). 위 차단건 수정 시 함께 정리.
- **[선출 토글 a11y] page.tsx L925~960** — selrow 버튼 안 선출 배지가 role=button+tabIndex(중첩 인터랙티브). stopPropagation으로 동작 정상이나 button 안 button 경미. 시각/기능 영향 0.

🟢 사소(무영향):
- formatWon·feeForSelected 등 파생함수 컴포넌트 내 정의(매 렌더 재생성)—소규모 무영향.
- box-shadow rgba 1곳(.te-success L217·dead CSS 영역)—dead라 영향0.

🚦 차단 1건(대표자 연락처) → "수정 요청" 추가. 나머지는 merge 후 후속 가능.

### [2026-06-21] Track B Phase4 B-a 입금→자동확정 API + 참가팀 리스킨 (route.ts PATCH 확장 + teams/page.tsx Toss) — reviewer

📊 종합 판정: **통과 (차단 0 / 권고 3 / 사소 2)** → merge 가능

✅ 잘된 점:
- **권한 가드 보존**: PATCH/DELETE 둘 다 `requireTournamentAdmin(id)` 1차 진입가드 유지(L13·140)·우회 0. payment_status 변경은 동일 가드 통과자만→임의 변경 불가. canManageTournament 패턴(super_admin/주최자/위임관리자) 위임이라 IDOR 차단 정합.
- **자동승격 트리거 한정 정확**: `wantsAutoPromote = nextPayment==="paid" && status===undefined && (tt.status pending|waiting)`(L68~71). **status 키 동반 요청이면 미발동**(수동 승인/거절 우선)·이미 approved면 미발동. 클라 updateStatus는 `{status}`만·updatePayment는 `{payment_status}`만 전송→두 흐름 분리 정확. 기존 수동 status 전이(승인/거절/승인변경) 미손상.
- **정원 카운트 차이 = 의도적·정합**: join L353~359는 cap 카운트 `status in [pending,approved]`(신규신청은 미승인도 자리점유→보수적 대기열). 자동승격 L86~88은 `status:approved`만(이미 입금확인된 팀을 올릴 빈자리 판정)→approved만 세는 게 맞음. cap 미설정·division null이면 무제한 승격(join과 동일 정책). 자기자신 pending/waiting이라 카운트 미포함 정확.
- **멱등·트랜잭션 정합**: 팀 update+teams_count 동기화를 단일 `$transaction`(L102~131). becomingApproved=`(!wasApproved&&nowApproved)||promoted` 통합판정. teams_count는 approved 진입 시 +1·이탈(rejected/withdrawn) 시 -1·중복증가 가드(`!wasApproved`). approved_at은 미존재 시에만 기록(`becomingApproved&&!wasApproved`). paid 반복 PATCH=paid_at만 갱신·status 무변(멱등). DELETE도 approved일 때만 decrement(L158).
- **컨벤션**: apiSuccess/apiError·응답 snake(promote_reason)·payment enum 화이트리스트(unpaid/paid/refunded) 검증·snake/camel 양쪽 키 수용. **스키마 0**(payment_status/paid_at/approved_at/division 전부 기존 컬럼·신규 모델 0·TournamentMatch 미생성).
- **Toss 스킨**: 루트 div data-skin="toss" opt-in(loading 분기 포함)·공유셸 미부착. lucide-react `<Icon>` 키트 import(CDN 0). 아이콘(download/message-circle/volleyball/copy/printer/user-plus/trash-2/pencil/refresh-cw/clipboard-paste/x/chevron 등) 실존. 하드코딩 hex=team primaryColor 데이터 폴백 1곳(L598·테마토큰 아님)·#6D5AE6 0. 기능 1:1(PATCH body·toast·필터·모달 보존). updatePayment toast가 promoted/division_full 결과 정확 안내.

🟡 권장(차단아님·후속):
- **[자동승격 정원 race] route.ts L78~99** — div_caps SELECT + approvedCount count가 **트랜잭션 밖**, update만 트랜잭션 안. 동일 종별에 동시 paid PATCH 2건 시 둘 다 `approvedCount<cap` 통과→cap+1 초과 가능. 단 운영자 1인 수동 클릭이라 실질 race≈0. 엄밀히는 count+update를 같은 tx로 묶거나 cap-1까지만 자동승격이 안전. 종별 마스터 race 권고와 동류·경미.
- **[promote 시 division 무근거 가정] L82** — cap 판정에 `tt.division` 사용. division null이면 무제한 승격(cap 미적용)이라 division 미설정 팀은 정원 무관 자동승인. join도 동일 정책이라 회귀 아니나, division 없는 paid 팀이 정원 우회 승급되는 운영 케이스는 인지 필요(설계상 정상).
- **[teams_count baseline 신뢰] L124~127** — teams_count 증감은 정확하나, 기존 데이터에 teams_count drift가 있으면 누적 오차 지속(이번 변경이 만든 문제 아님·기존 구조). 후속 재계산 점검 권장.

🟢 사소(무영향):
- updatePayment 응답 `json` no-op일 때 generic toast 폴백(L273)—UX 무영향.
- promote_reason 외 reason 분기 없음(division_full만)—현재 충분.

🔴 필수 수정: **없음**. 운영 승인 로직이나 트리거 한정·정원 가드·트랜잭션·멱등 전부 견고. 정원 race는 단일운영자 컨텍스트라 차단 미해당(권고). merge 가능.

## 구현 기록 (developer)

### F-1 — 후원사 로고·디비전 날짜/코트 settings jsonb 저장 (2026-06-22, developer 세션B)

📝 구현: 생성폼 입력 UI(후원사 로고 / 디비전별 경기날짜·코트)가 publish() 에서 버려지던 두 데이터를 `Tournament.settings`(jsonb)에 무스키마 보존. schema/route.ts/tournament.ts/`/api/v1` 전부 미접촉(저장만).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `ct-create-tournament.tsx` | ①`CtDraftPayload`에 `settings?: Record<string,unknown>` 필드 추가 ②`publish()`에서 sponsorLogos(로고 있는 후원사만 `{name,logoUrl}`)·divSchedule(`{디비전명:{dateId,courtId}}` dateId·courtId 둘 다 있을 때만) 맵 구성 → 비어있지 않은 것만 settings에 담아 payload에 추가 | 수정 |
| `wizard/page.tsx` | POST body에 `settings: payload.settings` 1줄 추가(undefined면 자연 미전송) | 수정 |

🔑 settings 구조(snake 키·jsonb 내부라 자동 snake 변환 대상 아님):
```js
settings: {
  sponsor_logos: [{ name, logoUrl }, ...],                 // 로고 있는 것만
  div_schedule: { "디비전명": { dateId, courtId }, ... }    // dateId·courtId 둘 다 있을 때만
}
```

🔒 빈값 생략·기존 동작 보존: sponsorLogos 0건+divSchedule 0건 → settings `{}` → `undefined` 전송(기존 settings round-trip 무해). sponsors 콤마문자열(L542)·categories/divCaps/divFees 평면변환(L519~528) **전부 그대로**. createTournament 가 settings 인자 기존 수신(round-trip) → API/schema 확장 0.

💡 tester 참고:
- 테스트: 대회 생성 위저드(`/tournament-admin/tournaments/new/wizard`) → 후원사에 로고 첨부 + 디비전에 경기날짜·코트 지정 후 게시 → POST body `settings.sponsor_logos`/`settings.div_schedule` 확인. 표시 소비처는 0(F-2 후속) → 화면 변화 없음이 정상.
- 정상: 로고 없는 후원사·dateId/courtId 미지정 디비전은 settings에 미포함. 둘 다 비면 settings 키 자체 미전송.
- 주의 입력: 로고 1개+디비전 일정 1개만 채워도 settings 부분 저장(다른 키 생략). 디비전명 중복 시 마지막 값으로 덮어씀(div_schedule도 동일).

⚠️ reviewer 참고:
- settings 내부 키는 jsonb 내부라 snake 수동(`sponsor_logos`/`div_schedule`). sponsors **컬럼**만 응답키 snake.
- 로고URL은 sponsors 컬럼(String) 대신 settings 보존(전용 컬럼 부재). 표시 소비처 미구현(F-2).

🔎 검증: `npx tsc --noEmit` EXIT=0. `git diff --stat HEAD` = 대상 2파일만(+32/-0). 세션A admin-shell/referee-shell 미접촉. 미커밋(PM).

### 새 대회 생성폼 B-1 — schema ADD + POST 3필드 확장 (2026-06-21, developer 세션B)

📝 구현: 시안 새 대회 생성폼의 **백엔드 토대만**(UI는 B-2~B-4 소관). schema 컬럼 1개 ADD + POST 3필드(gameRules/scheduleDates/places확장) 수용. DivisionRule 미생성·기존 생성흐름 전부 보존.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `prisma/schema.prisma` | Tournament에 `schedule_dates Json? @default("[]") @map("schedule_dates")` 추가(places 인접) | 수정 |
| `src/app/api/web/tournaments/route.ts` | POST body 구조분해에 `gameRules, scheduleDates` 추가(+5줄) + createTournament 호출에 2필드 전달. places는 기존 수신 그대로(타입만 확장) | 수정 |
| `src/lib/services/tournament.ts` | `CreateTournamentInput`에 `gameRules?`/`scheduleDates?` 추가 + `places` 타입 확장(id/region/courtCount/naming) + createData에 `game_rules`/`schedule_dates` jsonb round-trip 매핑 | 수정 |

🔴 **ALTER 적용(운영 DB targeted)**: `prisma migrate diff` 결과 무관 drift(live_scoreboards FK DROP·updated_at DROP DEFAULT·admin_categories) 섞여나옴 확인 → **broad push 중단**(errors.md[06-19] 룰), `ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS schedule_dates jsonb DEFAULT '[]'::jsonb` 만 `prisma db execute`로 적용. **사후 실측**: information_schema 조회 = `schedule_dates / jsonb / DEFAULT '[]'::jsonb` 정상 생성·기존 65행 보존(데이터 손실 0). 임시 SQL/스크립트 즉시 삭제.

🔧 **prisma generate**: 1차 EPERM(query_engine DLL 락) → 포트3001 PID 78724만 `taskkill //f //pid`(im node.exe 금지)로 종료 → 재실행 성공(v6.19.2). ⚠️ **개발서버 종료됨** — B-1은 백엔드라 dev 서버 불필요하나 재시작은 PM/사용자 판단.

🔑 **회귀 0 근거**: 3필드 전부 optional. route.ts `gameRules || undefined`·tournament.ts `input.gameRules ? {...} : {}` → 미전송 시 schema @default(`{}`/`[]`)로 떨어져 기존 행과 동일. jsonb 내부는 camelCase 그대로 저장(apiSuccess snake 변환은 응답 최상위 키만). DivisionRule.create 미수행 동작·시리즈 $transaction·status="draft" 전부 불변.

🔎 검증: `npx tsc --noEmit` EXIT=0. `git diff --stat` = 대상 3파일만(28+/1-). schema/route/tournament 외 변경 0. 미커밋(PM).

### 새 대회 생성폼 B-4 — 우측 통합 + 게시 모달 + POST 배선 (2026-06-21, developer 세션B)

📝 구현: 메인 폼 우측 stub 2카드를 B-3 실폼으로 교체 + 시안 PublishModal(게시/결제 정보) 추가 + 게시 모달 확인 시 실제 `POST /api/web/tournaments` 배선. **API/createTournament/route.ts/schema/`/api/v1` 미접촉**(기존 수신 키만 활용 — B-1에서 이미 확장 완료).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `_components/ct-create-tournament.tsx` | ①우측 stub2→`<CtDivisions>`+`<CtGameSettings>` 교체 ②`categories:CategoryItem[]`·`gameRules:GameRules` state 추가(로컬 GAME_SETTINGS_DEFAULTS 삭제→ct-game-settings import 일원화·d state에서 game키 제거) ③필수검증에 `totalDiv===0` 종별 차단 추가 ④`submit`=검증→게시모달 오픈 / `publish`=평면변환+onSubmitDraft ⑤PublishModal 내부 컴포넌트 추가(신규파일0) ⑥CtDraftPayload에 categories(평면)+게시정보 확장 ⑦미사용 courtsOf import 정리 | 수정(untracked) |
| `wizard/page.tsx` | quick 분기 handleSubmitDraft를 stub토스트→실제 async POST 배선(payload 그대로 전송·snake `data.redirect_url`·성공 redirect·실패 showToast) + CtCreateTournament `saving={loading}` 전달(loading state 재사용) | 수정 |
| `src/styles/toss-admin.css` | 게시모달 3클래스 `.ct-daterange`/`.ct-paygrid`/`.ct-paychip`(+`__sep`/`__box`/`__lbl`/`__soon`) `[data-skin="toss"]` 스코프 추가(시안 toss.css 1:1) | 수정 |

🔑 **categories 평면변환** (시안 CategoryItem[] → createTournament 3개 Record):
```
입력: [{name:"남성 일반부", divisions:[{name:"D4",cap:16,fee:60000},{name:"D5",cap:16,fee:50000}]}]
→ categories: { "남성 일반부": ["D4","D5"] }
  divCaps:    { "D4":16, "D5":16 }
  divFees:    { "D4":60000, "D5":50000 }
```
⚠ 디비전명이 createTournament 단일 키 → 디비전명 중복 시 마지막 값으로 덮어씀(시안 가정 동일).

🔑 **게시 모달 필드 매핑**: 게시기간(postStart/End)→`startDate`/`endDate` · 참가신청기간(regStart/End)→`registrationStartAt`/`registrationEndAt` · 결제(계좌이체만 활성, 간편결제·카드는 disabled "준비 중")→`bankName`/`bankAccount`/`bankHolder`. 포스터→`logoUrl`(대표 이미지).

🔑 **검증 규칙**(submit 1차): 대회명·주최·주관·(정규대회 시)정규대회선택·장소·대회일정·**종별·디비전(totalDiv≥1, B-4 신규)** 누락 시 토스트+차단. 통과 시 게시 모달 오픈. 게시 모달 확인(publish)에서 평면변환 후 POST.

🔑 **회귀/가드 0 근거**: createTournament가 categories/divCaps/divFees(L136~138·502~504 div_caps/div_fees jsonb)·gameRules/scheduleDates(L171·173·492~497 game_rules/schedule_dates) 이미 수신(B-1)·route.ts L147/L155 body 분해 존재 → **API/schema 확장 0**. POST 라우트는 Zod 강제 검증 없이 raw destructure+name만 필수 → 신규 키 422 위험 0. saving=loading 재사용(중복 제출 방지·진행 중 모달 닫기 금지). lucide(trophy/check 실존)·Material0·하드코딩 hex0(유니폼 팔레트는 B-3 도메인 예외·B-4 신규 hex 없음)·IME 가드(계좌번호/예금주)·`var(--*)` 토큰만(--warn/--warn-weak/--primary-weak 기존)·dev서버 미접촉.

💡 tester 참고:
- **테스트 방법**: `/tournament-admin/tournaments/new?subtab=quick`(또는 quick 탭) 진입 → 좌측(대회명·주최·주관·장소·일정) + 우측(종별 추가→디비전 생성, 경기 설정) 입력 → "대회 생성" → 게시 모달에서 게시/참가신청 기간·계좌 입력 → "대회 생성" → 성공 시 대시보드 redirect.
- **정상 동작**: 종별 0개면 "필수 입력 누락: 종별·디비전" 토스트로 차단(게시 모달 안 뜸). 게시 모달 "대회 생성" 클릭 시 버튼 스피너+잠금→성공 redirect / 실패 토스트.
- **주의할 입력**: ①디비전명 중복(다른 종별에 같은 디비전명) → divCaps/divFees 마지막 값 덮어씀(의도). ②간편결제·카드 버튼은 disabled(클릭 무반응 정상). ③게시기간/참가신청기간 미입력 가능(optional·미전송). ④실제 대회가 운영 DB에 생성됨(단일 DB 정책) — 테스트 생성분 정리 필요 여부 PM 확인.

⚠️ reviewer 참고:
- 평면변환 로직(publish 함수)·POST body 키 매핑(page.tsx handleSubmitDraft)이 createTournament 수신 키와 정합하는지 확인 권장.
- 미사용 courtsOf import 제거(B-2 잔재) — ct-schedule-venue export에는 영향 없음.

🔎 검증: `npx tsc --noEmit` EXIT=0(2회). git status = ct-create-tournament(untracked·B-2 신규)·page.tsx(M)·toss-admin.css(M)·B-3 ct-divisions/ct-game-settings(staged)·ct-schedule-venue(untracked). admin-shell/referee-shell(세션A) 미접촉. 미커밋(PM).

### 새 대회 생성폼 B-2 — 2컬럼 셸 + 좌측 컬럼 (2026-06-21, developer 세션B)

📝 구현: 시안 CreateTournament 의 **셸(2컬럼+헤더+하단 고정 생성바) + 좌측 컬럼 완성 + 우측 stub(B-3)**. quick 탭 본문을 풀폭 단일폼으로 전면교체. 제출(POST) 배선은 B-4 보류 — 좌측 입력·검증 UI까지.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `new/wizard/_components/ct-create-tournament.tsx` | 메인 폼 — 셸(ct-head 헤더·ct-grid--2·ct-bar 하단바)+좌측 대회정보(대회명·정규대회 시리즈 실연동·주최·주관·후원사·포스터)+우측 stub 2카드+state(d/venues/dates/sponsors)+submit 검증(누락 토스트)+B-1 payload(places확장·scheduleDates `court_ids`)+이전대회 불러오기 모달 | 신규 |
| `new/wizard/_components/ct-schedule-venue.tsx` | 일정·장소 블록 — VenueSearch(자동완성+직접추가)·코트수 Stepper(1~8)·명명 SegSm(숫자/알파벳)·코트칩·CalendarModal(다중일자)·날짜별 코트 배정칩. courtsOf/allCourts/ctUid 유틸(court id=`<venueId>_c<idx>`) | 신규 |
| `src/styles/toss-admin.css` | `.ct-*` 70여 규칙 `[data-skin="toss"]` 스코프 추가(레이아웃·venue·stepper·segsm·calendar·dateblock·sponsor·pastrow·bar·stub)+`@keyframes ctspin`+모바일 720px 분기. `.ct-bar` lg(min-w 1024) `left:16rem`(사이드바 256px)/모바일 `left:0` | 수정 |
| `new/wizard/page.tsx` | quick 탭 = 풀폭 early-return → `<CtCreateTournament>` 렌더(서브탭/AdminPageHeader 셸 숨김·focused)+토스트 state(showToast)+CtDraftPayload 핸들러(B-4 배선 전 페이로드 확인 토스트). legacy/prospectus/association 탭은 기존 셸 보존 | 수정 |

🟢 **좌측 완성도**: 대회명(필수·인라인 검증) / 정규대회 여부(일반·정규 세그먼트) / 정규대회 선택(`/api/web/series/my` 실연동 dropdown + InlineSeriesForm 신규생성 재사용) / 주최·주관(필수) / 후원사(이름+ImageUploader 로고) / 포스터(ImageUploader 3:4) / 일정·장소(VenueSearch·코트Stepper·명명·CalendarModal·날짜별 코트배정) — **전 항목 동작**. 시안 mockup(image-slot/REGULAR_SERIES)은 운영 컴포넌트(ImageUploader/series 실연동)로 대체.

🟡 **우측 stub**: 종별·디비전 / 경기 설정 = `.ct-stub` 안내 카드 2개("다음 단계 B-3에서 구현"). state.categories 는 빈 배열 보관(payload 미포함, B-3/B-4 연동).

🔴 **제출 배선 보류(B-4)**: "대회 생성" 클릭 = 좌측 필수값 검증(대회명/주최/주관/정규대회선택/장소/일정 누락 시 토스트) 후 `onSubmitDraft(payload)` → 현재는 **페이로드 확인 토스트만**(실제 POST 없음). payload 는 B-1 형태(places 확장·scheduleDates `[{id,date,court_ids[]}]`·gameRules 12키)로 변환 완료 → B-4 가 그대로 fetch.

🔑 **가드 준수**: POST route·createTournament·Zod·schema·`/api/v1` 미접촉(UI만). prospectus/협회마법사 라우트·draft 자동채움(useEffect) 보존. lucide 키트 `<Icon>`(20종 전부 실존·ICON_ALIAS 추가 불요)·Material 잔존 0·하드코딩 hex 0(유니폼 저지색 #FFFFFF/#1B2A4A 는 도메인 데이터 예외)·rgba JSX 0(전부 CSS 이동). `data-skin="toss"` 루트 opt-in·공유셸 미부착. 한글 IME 가드(VenueSearch·SponsorField Enter). dev 서버 미접촉.

💡 tester 참고:
- **테스트 경로**: `/tournament-admin/tournaments/new/wizard` (quick 탭 = 기본). legacy 는 `?legacy=1`.
- **정상 동작**: 2컬럼(데스크탑)·1컬럼(720px↓). 장소 검색→등록→코트수 2↑ 시 명칭 세그먼트+코트칩. 일정선택→캘린더 다중→날짜별 코트칩 토글. "대회 생성"→누락 토스트 또는 페이로드 확인 토스트(POST 없음=정상, B-4 대기).
- **주의 입력**: 정규대회 선택 시 시리즈 dropdown 빈 상태(`/api/web/series/my` 무응답)·InlineSeriesForm 생성. 장소 0/일정 0 시 빈박스. 코트 삭제 시 dates 무효 courtId 자동 정리(pruneCourts).

🔎 검증: `npx tsc --noEmit` EXIT=0. lucide 20종 실존 확인. git=신규 2파일+수정 2파일(page.tsx/toss-admin.css)만. admin-shell/referee-shell 미접촉(세션A 영역). 미커밋(PM).

📋 잔여: B-3(우측 종별·디비전 빌더 + 경기 설정) / B-4(제출 POST 배선 + 게시 설정 모달).

💡 tester 참고:
- 테스트: 기존 대회 생성 흐름(3필드 미전송)이 회귀 없는지 — POST `/api/web/tournaments`로 name만 보내 200+redirectUrl 확인. 신규 3필드는 아직 UI 없음(B-2~4)이라 curl로 `gameRules:{...}`·`scheduleDates:[{id,date,court_ids}]` 전송 시 DB 저장 확인.
- 정상: 미전송 시 game_rules=`{}`·schedule_dates=`[]` 박제. 전송 시 jsonb 그대로 저장(camelCase 키 보존).
- 주의: 응답 키는 snake(`redirect_url`). DB 조회 시 game_rules/schedule_dates는 server prisma=camel, apiSuccess 응답=snake.

⚠️ reviewer 참고:
- 봐줬으면: ① jsonb round-trip 직렬화(`JSON.parse(JSON.stringify(...))`) — settings 기존 패턴 답습 ② places 타입 확장이 기존 `{name,address}` 호출부 깨지 않는지(address optional화) ③ ALTER가 targeted 1줄만 적용됐는지(drift 미혼입).

### 새 대회 생성폼 B-3 — 우측 컬럼 컴포넌트 2종 (2026-06-21, developer 세션B)

📝 구현: 시안 CreateTournament 의 **우측 컬럼 2 카드(controlled component)** — ① 종별·디비전 제너레이터 ② 경기 설정 12키. B-2 가 우측을 `.ct-stub` 안내카드로 비워둠 → 본 단계가 실폼 신규 작성. **통합(메인폼 배선)은 B-4 별도** — 본 단계는 신규 2파일만 생성(메인폼·page.tsx·toss-admin.css 미접촉).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `new/wizard/_components/ct-divisions.tsx` | 종별·디비전 제너레이터(controlled). props `{value:CategoryItem[]; onChange; scheduleDates; venues; toast}`. `/api/web/admin/categories` GET 실연동(종별 마스터·응답 snake `sort_order`)→DivisionGenerator 모달(성별·종별템플릿·디비전·연령 4단계·여성부 w접미·디비전×연령 곱집합)→디비전별 cap/fee/dateId/courtId 입력. venues→코트풀(`<venueId>_c<idx>`)·날짜 select read-only. CategoryCard/안내배너 | 신규 |
| `new/wizard/_components/ct-game-settings.tsx` | 경기 설정 12키(controlled). props `{value:GameRules; onChange; homeName?; awayName?}`. 유니폼 16색 picker(UniformModal·hex직접입력·휘도 대비잉크)·홈어웨이 색교체·조끼체크·경기방식 프리셋4·운영방식/쿼터수/쿼터시간/샷클락·파울/타임아웃 Stepper. **`GAME_SETTINGS_DEFAULTS` 정본 export**(L37~50·`GameRules` 타입 동반 export) | 신규 |

🔑 **props 인터페이스(계약 준수)**:
- `CategoryItem={id:string; name:string; divisions:DivisionItem[]}` / `DivisionItem={id; name; cap?; fee?; dateId?; courtId?}` — **계약 1:1**(시안의 `method` 필드는 계약에 없어 제거·진행방식은 DivisionRule 다운스트림 소관). `ScheduleDate={id; date; court_ids[]}` / `Venue={id;name;region;courtCount;naming}` = read-only 옵션(부모 좌측폼 소유). export 됨(통합 시 메인폼 import).
- `GameRules` = camelCase 12키(B-1 game_rules jsonb 1:1). **`shotClock: boolean`**(SegSm "사용"=true/"미사용"=false). export.

🔑 **shotClock boolean 반영**: 타입 `shotClock: boolean`, DEFAULTS `shotClock: true`, UI=`<SegSm options={["사용","미사용"]} index={d.shotClock?0:1} onSelect={(i)=>set("shotClock", i===0)} />`. 시안·B-2·B-1 정합(PM 승인).

🔑 **GAME_SETTINGS_DEFAULTS export 위치**: `ct-game-settings.tsx` L37~50(`export const GAME_SETTINGS_DEFAULTS: GameRules = {...}`). 통합(B-4) 시 메인폼(ct-create-tournament)이 자체 보유한 defaults 를 **이 export 로 교체·일원화** 예정.

🔑 **가드 준수**: 신규 2파일만 생성. page.tsx·ct-create-tournament·ct-schedule-venue·toss-admin.css **미접촉**(통합 배선 B-4). API·createTournament·schema·`/api/v1` 미접촉(categories GET 읽기만). 재사용 `.ct-*` 클래스(ct-headicon/ct-iconbtn/ct-reqtag/ct-banner/ct-emptybox(--tall)/ct-stepper/ct-segsm)만 클래스명 참조, 우측 전용(ct-cat/ct-dvn/ct-uni/ct-pal/ct-set 등)은 inline `var(--*)`. lucide 15종 전부 실존(ICON_ALIAS 불요)·Material 0·하드코딩 hex 0(유니폼 16색 팔레트만 도메인 예외)·시안 보라톤 `#6D5AE6`→`var(--primary)` 토큰화. 한글 IME 가드(디비전명·hex input Enter). dev 서버 미접촉.

💡 tester 참고:
- **통합 전이라 단독 렌더 불가** — 메인폼(B-4)이 `value`/`onChange` 배선해야 화면 표시. 본 단계 검증 = 타입 정합 + 컴파일.
- **자체 동작(B-4 배선 후)**: 종별 "추가"→모달(성별·종별템플릿 admin_categories 실연동·디비전·연령)→"종별 생성"→카드 append. 디비전별 정원/참가비/날짜/코트 select. 경기설정=유니폼 셀 클릭→16색 모달, 프리셋 칩, Stepper.
- **주의 입력**: ① `/api/web/admin/categories` 무응답 시 모달 2단계 "등록된 종별 마스터 없음"(빈배열 graceful) ② 날짜 미선택 시 코트 select=전체 풀, 날짜 선택 시 그 날짜 배정 코트만 ③ hex 직접입력 정규식 검증(`#RRGGBB`/`#RGB`).

🔎 검증: `npx tsc --noEmit` EXIT=0(신규 2파일 자체 정합·전체 에러 0). lucide 15종 실존 확인(layout-grid/trash-2/x/calendar/map-pin/info/plus/check/sliders-horizontal/shirt/clock/flag/minus/arrow-left-right/search). git=신규 2파일만 stage(`A`)·B-2 파일 미접촉. 미커밋(PM).

📋 통합 시 끼울 위치(B-4): `ct-create-tournament.tsx` 우측 컬럼 `.ct-stub` 2카드(L515~539)를 → `<CtDivisions value={categories} onChange={setCategories} scheduleDates={...} venues={venues} toast={toast} />` + `<CtGameSettings value={gameRules} onChange={setGameRules} />` 로 교체. state 추가: `categories: CategoryItem[]`(현재 빈배열 주석만)·`gameRules`는 d 분리 또는 별도 state. 메인폼 defaults→`GAME_SETTINGS_DEFAULTS` import 일원화. submit payload 에 categories(→DivisionRule 다운스트림)·gameRules 반영.

⚠️ reviewer 참고:
- 봐줬으면: ① 계약(DivisionItem)에 없는 시안 `method` 제거가 적절한지(진행방식은 DivisionRule 소관 — 본 폼은 cap/fee/날짜/코트만) ② categories GET 응답 파싱 폴백(`json?.data?.categories ?? json?.categories ?? []`)이 apiSuccess 표준과 정합인지 ③ 날짜 변경 시 courtId 초기화(`{dateId, courtId:undefined}`)로 무효 코트 잔존 방지.

### Track B 참가신청 3단계 후속 정리 — orphan/dead CSS/대표자 편집 (2026-06-21, developer)

📝 구현: reviewer 지적 후속 정리 3건. 영역 = `(web)/tournaments/[id]/join/*` 만. POST route.ts·joinSchema·prisma schema 변경 0.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `_v2/enroll-aside.tsx` | orphan(소스 import 0·자기들끼리만 참조) → git rm | 삭제 |
| `_v2/enroll-poster.tsx` | orphan(aside만 import·aside도 삭제) → git rm | 삭제 |
| `_v2/enroll-step-docs.tsx` | orphan(소스 import 0) → git rm | 삭제 |
| `_v2/enroll-step-payment.tsx` | orphan(소스 import 0·구 5단계 결제 step) → git rm | 삭제 |
| `_v2/tournament-enroll.css` | dead CSS 제거: 구 Material 구역(.te-h3/.te-pay*/.te-method*/.te-bank*/.te-bill*/.te-success*) 전량 삭제. 615→308줄(약 307줄). Toss 구역(.te-enroll[data-skin]+.ts-* 53규칙) 유지 | 수정 |
| `page.tsx` | 대표자/연락처 표시 = 값 있으면 span(수정불가)/없으면 input 삼항 → **항상 prefill input**(값 있어도 편집 가능). canNext trim 게이트(L446~447) 유지 | 수정 |

🔑 **orphan 삭제 안전성**: 소스(.ts/.tsx) 전체 grep(`from "...enroll-aside|poster|step-docs|step-payment"`) = 매치 1건뿐(enroll-aside→enroll-poster, 둘 다 삭제대상). page.tsx import = enroll-stepper·enroll-success-hero 2개만(orphan 0). 나머지 grep 매치는 전부 Dev/design 시안(.md/.jsx, 영역 외)·scratchpad 기록 → 런타임 참조 0.

🔑 **dead CSS 판정**: 구 Material 클래스(.te-h3/.te-pay*/.te-method*/.te-bank*/.te-bill*)는 **오직 삭제된 orphan enroll-step-payment.tsx에서만** className 사용. .te-success*는 어디서도 미사용(success-hero는 .ts-* 사용). page/stepper/success-hero가 쓰는 .te-enroll·.te-enroll__inner·.ts-* 는 전부 보존. 헤더 주석을 정리 사유로 교체.

🔑 **대표자 편집 UI**: 빈값 케이스(카카오/구글 가입자 user.phone null)는 기존에도 input이라 회귀수정 보존됨. 삼항 제거로 자동값이 틀려도 항상 수정 가능. 빈값 제출은 canNext(managerName/managerPhone trim 필수)+서버 joinSchema min(1)으로 계속 차단.

🔎 검증: `npx tsc --noEmit` EXIT=0(삭제 import 깨짐 0). route.ts/joinSchema/schema diff 0. 본인인증·주장가드·약관2종 게이트·snake접근자·adaptive 2단계 보존. git=join 영역만(삭제4 git rm·수정2). 미커밋(PM).

💡 tester 참고:
- 테스트: `/tournaments/[id]/join` 진입 → 팀 선택 후 "팀 정보 확인" 카드의 대표자/연락처가 입력칸으로 표시(자동값 prefill)되는지. 자동값 수정 후 다음/제출 시 수정값 POST 전송 확인.
- 정상: 값 있어도 input 편집 가능·빈값이면 다음 버튼 비활성(canNext). 완료 화면(success-hero)·종별/로스터 단계 변화 0. join 외 화면 영향 0.
- 주의 입력: managerName/Phone 공백만 입력 시 다음 버튼 비활성 유지돼야 함(trim 게이트).

⚠️ reviewer 참고:
- orphan 삭제 후 _v2/ 잔존 = enroll-stepper.tsx·enroll-success-hero.tsx·tournament-enroll.css 3건(전부 page.tsx 실사용).
- CSS 정리는 규칙 삭제만·살아있는 .ts-* 규칙 값 변경 0(시각 회귀 0).

### Track B Phase4 후속 비차단 이슈 3건 수리 (2026-06-21, developer)

📝 구현: Track B Phase4 reviewer 지적 비차단 3건(race 강화·권한 정합·snake 키 정합) 수리. 기능 회귀 0(가드 정렬·tx 이동·키 정합만). 영역=tournament-admin/tournaments + api/web/tournaments 만.

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/tournaments/[id]/teams/[teamId]/route.ts` | B-a: div_caps approvedCount 조회를 $transaction **내부**로 이동(read-modify-write 원자화). cap 값 조회는 tx 밖 유지(읽기 전용). promoted 판정을 tx 안에서 확정·`{updated,promoted}` 반환 | 수정 |
| `src/app/api/web/tournaments/[id]/matches/route.ts` | B-d: GET 가드를 `requireTournamentAdmin`→`requireRecordersManageAccess`(로컬 가드 추가)로 정렬. recorder_admin 통과. **POST는 requireTournamentAdmin 그대로 미접촉** | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx` | B-d: MatchRow 타입·접근자 `roundName`→`round_name`, `scheduledAt`→`scheduled_at` snake 교정 | 수정 |

🔑 **수정1 race 강화**: 기존엔 `prisma.tournamentTeam.count`(approvedCount)가 $transaction **밖**이라 동시 paid 처리 시 두 요청이 같은 count를 읽고 둘 다 승격→cap 초과 가능. count를 `tx.tournamentTeam.count`로 tx 내부 이동→동일 트랜잭션 격리 안에서 cap 비교. cap 값 자체(div_caps) 조회는 동시 변경 대상 아니라 tx 밖 유지(불필요한 tx 비대화 회피). 가드 조건·승격 로직·멱등·teams_count 동기화 **전부 동일**, 위치만 이동.

🔑 **수정2 권한 정합**: matches GET이 `requireTournamentAdmin`만→recorder_admin 403→경기목록 빈상태→B-d 배정 UI 무용. PATCH(`matches/[matchId]/recorder`)·auto-assign과 동일한 `requireRecordersManageAccess`(recorder_admin 전역/organizer/TAM/super_admin)로 정렬. 가드 함수는 recorder/route.ts·recorders/route.ts와 **동형 로컬 정의**(공유 모듈 추출은 영역 확대라 미실시). POST(경기 수동 생성)는 미접촉.

🔑 **수정3 응답 키 실측 결과(snake 확정)**: `matches/route.ts` GET = `apiSuccess(listMatches(id))`. `apiSuccess`(response.ts) = `NextResponse.json(convertKeysToSnakeCase(data))`. `listMatches`(services/match.ts:82)는 Prisma 객체 그대로 반환(Prisma 필드명 camel `roundName`/`scheduledAt`). → 응답 직렬화 시 **snake `round_name`/`scheduled_at`로 변환됨(camel 아님 확정)**. page.tsx가 `m.roundName`(camel)로 읽어 항상 fallback "라운드 N"으로만 동작 중이었음 → snake 교정. (reviewer 우려 = 정확. 응답이 실제 snake라 변경 적용함.)

🔎 검증: `npx tsc --noEmit` EXIT=0 · 스키마 0 · 신규 모델 0 · git status=대상 3파일만(teams API/matches API/recorders page). 미커밋(PM).

💡 tester 참고:
- 수정1: 같은 division에 cap=N 설정 후 N개 approved 상태에서 추가 팀(pending) paid 처리→승격 보류(`promote_reason:"division_full"`). 동시 2건 paid는 race라 실측 어려움(코드 리뷰로 tx 내부 count 확인).
- 수정2: recorder_admin 계정으로 `/tournament-admin/tournaments/[id]/recorders` 진입→경기목록 정상 로드(이전엔 403 빈상태). organizer/TAM도 기존대로 동작.
- 수정3: 경기에 roundName(예 "16강")이 있으면 라벨이 "16강"으로 표시(이전엔 "라운드 N" fallback). roundName 없으면 기존대로 "라운드 N".

⚠️ reviewer 참고:
- 수정1: cap 값(div_caps) 조회는 tx 밖·count만 tx 안 — 의도적 분리(읽기전용 메타 vs 경합 카운트).
- 수정2: 가드 함수가 3파일에 동형 중복(recorders/route.ts, recorder/route.ts, matches/route.ts). 공유 모듈 추출은 영역 확대(lib 신규)라 보류 — PM 판단.



📝 구현: 경기별 기록자 배정 = **TournamentMatch.settings jsonb 키 `recorder_id`**(PM② 확정·신규 테이블 0·스키마 0). 신규 전용 API 2종 + recorders 화면에 "경기별 기록자 배정" 섹션 추가(기존 풀 관리 1:1 보존).

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/tournaments/[id]/matches/[matchId]/recorder/route.ts` | PATCH — settings jsonb merge로 recorder_id set/unset. 풀 검증·가드·감사로그 | 신규 |
| `src/app/api/web/tournaments/[id]/recorders/auto-assign/route.ts` | POST — 풀 라운드로빈 자동배정(미배정만/overwrite옵션)·트랜잭션 batch | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/recorders/page.tsx` | "경기별 기록자 배정" Card 추가(경기목록+기록자 select+자동배정 버튼). 기존 풀 관리 무변경 | 수정 |

🔑 **settings jsonb merge 방식**(핵심): `{ ...prevSettings, recorder_id: userId.toString() }` — 기존 settings 키(division_code/recording_mode/timeouts 등) **spread 보존** 후 recorder_id만 set. 해제 시 `delete nextSettings.recorder_id`(키 제거). **통째 덮어쓰기 금지**(errors.md 2026-05-17 division_code 누락 동형 방지). prevSettings는 null/array 방어(typeof object && !Array) 후 Record 캐스팅. BigInt userId는 JSON 직렬화 불가 → **string 저장**.

🛡️ **풀 검증**: 배정 대상 recorder는 `tournament_recorders`(tournamentId+recorderId+isActive) 풀 내 활성 인원만 허용. 풀 외 인원→400 `RECORDER_NOT_IN_POOL`. 해제(null)는 풀 검증 skip. **가드**=`requireRecordersManageAccess`(풀 라우트 recorders/route.ts와 동형 — recorder_admin 전역 / organizer / TAM / super_admin). 매치는 tournamentId 일치 검증(IDOR 방지·findFirst where id+tournamentId).

⚙️ **자동배정**(선택·시안 wand): 풀 인원을 미배정 경기에 라운드로빈(`pool[idx % pool.length]`) 순환. 기본 미배정만(overwrite=false), overwrite=true면 전체 재배정. $transaction batch(부분실패 방지). 단순 순환(과설계 금지)·핵심은 수동 배정.

🧩 **멱등·트랜잭션**: PATCH는 같은 값 재배정/없던 키 해제 모두 무해. settings UPDATE 1건 $transaction. snake_case 응답(match_id/recorder_id). 감사로그 match.recorder.assign/unassign/auto_assign.

💡 tester 참고:
- 테스트: `/tournament-admin/tournaments/[id]/recorders` 진입 → 하단 "경기별 기록자 배정" 섹션. 풀에 기록원 추가 후 경기별 select로 배정/해제, "자동 배정" 버튼.
- 정상: select 변경 시 즉시 "배정: 닉네임" 라벨 갱신. (미배정) 선택 시 해제. 자동배정 후 미배정 0.
- 🚨 집중검증①(jsonb merge): recording_mode/division_code 설정된 경기에 기록자 배정 후 → 그 경기 settings에 recording_mode·division_code **유실 없이** recorder_id만 추가됐는지(matches 화면 종별뱃지·기록모드 보존). curl raw 응답 settings 확인.
- 🚨 집중검증②(풀 외 차단): 풀에 없는 userId를 직접 PATCH body로 보내면 400 RECORDER_NOT_IN_POOL(클라 select는 풀만 노출하지만 서버 직접 호출 가드).
- 주의 입력: recorder_id=null/""(해제)·존재하지 않는 matchId(404)·타 대회 matchId(404·tournamentId 불일치).

⚠️ reviewer 참고:
- settings spread merge로 기존 키 보존(통째 덮어쓰기 0) — prevSettings null/array 방어 적절성.
- 풀 외 인원 차단(서버 검증) + IDOR(매치 tournamentId 일치).
- 자동배정 $transaction batch / 라운드로빈 인덱싱.
- 기존 매치 PATCH 라우트(matches/[matchId]/route.ts) **미접촉**(점수/상태 흐름 회귀0) — recorder는 별도 경량 endpoint 격리(recording-mode 토글 선례 동일).

🔎 검증: `npx tsc --noEmit` EXIT=0 · 추가 스키마 0(settings 기존 jsonb·tournament_recorders 기존) · 신규 모델 0 · TournamentMatch 단일모델 준수 · git status=대상 3파일만(matches API route/teams/referee/schema 0). 미커밋(PM).

### Track B Phase4 B-b — 대회 생성 위저드 Toss 리스킨 (2026-06-21, developer 세션B)

📝 구현: 대회 생성 위저드(Quick 1-step + Legacy 3-step + 이전대회복사 + DivisionGenerator + prospectus) **순수 Toss 리스킨**. 변경 허용 = data-skin="toss" 루트 opt-in + Material→`<Icon>` lucide 키트 교체뿐. API/server action/POST body/단계/필드/문구/라우트/DivisionGenerator 로직/이전대회복사 0 변경.

| 파일 | 변경 | data-skin 부착처 | 신규/수정 |
|------|------|------------------|----------|
| `tournament-admin/tournaments/new/wizard/page.tsx` | Material 22 위치→Icon(SectionTitle/STEPS/SUBTABS/템플릿 동적 icon값 포함) + rgba초록 tint→color-mix 토큰 | Quick/Legacy 메인루트 + 각 unauthorized early-return | 수정 |
| `tournament-admin/tournaments/new/wizard/prospectus/page.tsx` | Material 3(lock·progress_activity·error)→Icon(animate-spin 보존) | 메인루트 + unauthorized early-return | 수정 |
| `components/tournament/tournament-copy-modal.tsx` | Material 2(content_copy·close)→Icon | 위저드 자식(루트 data-skin 상속·별도부착X) | 수정 |
| `components/tournament/division-generator-modal.tsx` | Material 8(layers·close·wc·category·tune·cake·check×2)→Icon, **로직 0** | 위저드 자식(상속) | 수정 |

🔁 Material→lucide kebab 매핑 (전부 lucide-react 실존 `node -e` 실측·빈span폴백0·직접 CDN/window.lucide 0):
add→plus · add_circle→circle-plus · arrow_forward→arrow-right · close→x · content_copy→copy · emoji_events→trophy · history→history · info→info · lock→lock · upload_file→file-up · calendar_month→calendar · category→layout-grid · edit_note→file-pen · fact_check→clipboard-check · groups→users · palette→palette · group_add→user-plus · check_circle→circle-check · description→file-text · flash_on→zap · list_alt→list-checks · photo_camera→camera · workspace_premium→award · domain→building-2 · progress_activity→loader-circle · error→circle-x · layers→layers · wc→venus-and-mars · tune→sliders-horizontal · cake→cake · check→check · image→image · badge→badge
🔁 의미대체 1건: **gradient(템플릿 기본형)→square** (lucide gradient 부재). sports_basketball→**volleyball**(농구부재·Phase2 선례 동일).

🎨 토큰: 위저드 page.tsx 활성탭 완료배경 raw `rgba(74,222,128,.15)`→`color-mix(in_srgb,var(--color-success)_15%,transparent)` 토큰화. 나머지 var(--color-*) 보존·신규 하드코딩 hex 0. **잔존(미변경·사유)**: division-generator-modal 공유모달의 `#fff`(primary 위 대비텍스트)·rgba 그림자/오버레이는 기존값이고 본 모달은 `[id]/wizard`(편집·B-c)와 공유 → "DivisionGenerator 로직 변경0" 준수 위해 비주얼 회귀 우려로 보존.

✅ 기능 변경 0 확인: git diff 로직라인 grep(fetch/router.push/JSON.stringify/body/POST/useState/seriesId/maxTeams/format 등)=변경 0(주석·icon값 라벨뿐). DivisionGenerator state/toggleDiv/toggleAge/handleCreate/buildYouthDivisionCodes=무변경 실측.

💡 tester 참고: ①`/tournament-admin/tournaments/new/wizard`(Quick) 진입→sub-tab 4종·draft배너·시리즈 dropdown·생성 POST 동작 동일 ②`?legacy=1`(3-step) 진입→3탭 인디케이터·종별추가 모달(DivisionGenerator STEP1~4 cross-product)·이전대회복사 모달·디자인 미리보기·생성 동작 동일 ③`/wizard/prospectus`→PDF업로드·분석 스피너·결과 동작 동일 ④모든 화면 아이콘 깨짐(빈칸) 0이면 정상.
⚠️ reviewer 참고: ①모달 2종이 위저드 루트 data-skin 상속(React 자식·포털 아님) 정상 여부 ②division-modal 공유모달 #fff/rgba 보존 판단 적절성 ③템플릿/STEPS/SUBTABS 동적 icon값 kebab 일치.

🔎 검증: `npx tsc --noEmit` EXIT=0 · 4파일 material-symbols 잔존 0 · Icon name 29종(static18+dynamic11) 전부 lucide 실존 · git status=대상 4파일만 M(referee/admin비대회/teams/schema 0). 미커밋(PM).

### Track B Phase4 B-c — 대회 상세 나머지 화면 Toss 리스킨 (2026-06-21, developer 세션B)

📝 구현: 대회 상세(`tournament-admin/tournaments/[id]/*`, teams=B-a·wizard=별도 제외) 미리스킨 화면 전수 **순수 Toss 리스킨**. 변경 허용 = data-skin="toss" 루트 opt-in + Material→`<Icon>` lucide 키트 교체뿐. **API/server action/POST body/필터/컬럼/문구/라우트/대진로직(TournamentMatch)/SetupChecklist/공개게이트 0 변경**(git diff 로직라인 grep=변경0, 주석·icon값·data-skin뿐).

| 파일 | Material→Icon | data-skin |
|------|--------------|-----------|
| `[id]/page.tsx`(대시보드) | arrow_back·public·emoji_events + secondaryActions 동적 icon(groups/admin_panel_settings/edit_note)·open_in_new | 루트 |
| `_components/SetupChecklist.tsx` | STATUS_ICON맵(check_circle/pending/radio_button_unchecked/lock)·info·public·rocket_launch·warning·chevron_right·link 등 10 | (대시보드 상속) |
| `_components/setup-hub-mobile-sticky.tsx` | public/lock 동적 | (상속) |
| `_components/NextStepCTA.tsx` | lock·arrow_forward | (상속) |
| `_components/DivisionGenerateButton.tsx` | refresh·error·check_circle/warning 동적 | (bracket 상속) |
| `_components/AdvancePlayoffsButton.tsx` | trending_up·error·check_circle/warning 동적 | (matches/playoffs 상속) |
| `_components/PlaceholderValidationBanner.tsx` | warning·expand_less/more 동적 | (상속) |
| `_components/recording-mode-card.tsx` | tune·MODE_ICON맵(videogame_asset/description)·warning | (matches 상속) |
| `_components/recording-mode-trigger.tsx` | tune·close | (matches 상속) |
| `divisions/page.tsx` | add_circle·category·add | 루트+loading |
| `bracket/page.tsx` | (아이콘0) | 루트+loading |
| `recorders/page.tsx` | (아이콘0) | 루트 |
| `site/page.tsx` | (아이콘0) | 3 return루트(loading/published/main) |
| `admins/page.tsx` | (아이콘0) | 루트+loading |
| `matches/page.tsx`(server wrap) | (아이콘0) | 루트(trigger+client 상속) |
| `matches/matches-client.tsx` | location_on | (matches/page 상속) |
| `playoffs/page.tsx` | (아이콘0) | 루트(client 상속) |
| `playoffs/playoffs-client.tsx` | SECTION_TABS동적(leaderboard/sports_basketball/emoji_events/edit_note)+인라인 leaderboard·trending_up·sports_basketball·emoji_events×3 | (playoffs/page 상속) |
| `completed/page.tsx` | arrow_back·checklist + cards[].icon 5종 lucide명화 | 루트 |
| `completed/admin-completed-card-grid.tsx` | 동적 c.icon·open_in_new·arrow_forward·schedule | (completed 상속) |

🔁 Material→lucide kebab 매핑(전부 `node -e` lucide-react 실존 실측·빈span폴백0·lucide-react 직접import·CDN/window.lucide 0): arrow_back→arrow-left · public→globe · emoji_events→trophy · groups→users · admin_panel_settings→shield-user · edit_note→file-pen · open_in_new→external-link · check_circle→circle-check · pending→clock · radio_button_unchecked→circle · lock→lock · info→info · rocket_launch→rocket · warning→triangle-alert · chevron_right→chevron-right · link→link · arrow_forward→arrow-right · refresh→refresh-cw · error→circle-x · expand_less/more→chevron-up/down · tune→sliders-horizontal · videogame_asset→gamepad-2 · description→file-text · close→x · add_circle→circle-plus · category→layout-grid · add→plus · location_on→map-pin · leaderboard→bar-chart-3 · trending_up→trending-up · checklist→list-checks · scoreboard→layout-dashboard · newspaper→newspaper · photo_library→images.
🔁 의미대체 1건: **sports_basketball→volleyball**(lucide 농구 부재·Phase2/3 선례 동일).

🎨 토큰: 신규 CSS 0·하드코딩 hex 추가 0. 기존 var(--color-*)/color-mix 보존. acp-card__icon 슬롯 클래스는 `<Icon className="acp-card__icon">`로 보존. site/page 미리보기 hex(TEMPLATES/COLOR_PRESETS)는 의도된 미리보기 시뮬값(주석 명시)·스킨토큰 아님→비변경.

🚨 단일모델·게이트 준수: TournamentMatch 단일모델(brackets/groups/matches 별도생성 0)·SetupChecklist 8항목/공개게이트(canPublish)/공개 site/publish 호출·div_caps 정원·status 매핑 전부 무변경. 신규모델/스키마 0·신규 API 0(B-c는 순수 리스킨).

💡 tester 참고: ①`[id]`(대시보드)→SetupChecklist 8카드·진행도바·공개버튼(게이트)·잠금toast·빠른액션 4링크 아이콘 정상 ②`/divisions`→종별 format select·진출매핑·NextStepCTA ③`/bracket`→대진 생성/재생성·DivisionGenerateButton 모달 ④`/recorders`→풀 추가/제거 ⑤`/site`→3상태(미발행/발행중/위저드) ⑥`/matches`→기록모드 트리거 모달·종별/체육관 필터·AdvancePlayoffsButton·ScoreModal ⑦`/playoffs`→4탭(순위표/순위전/결승/결과)·종별탭 ⑧`/completed`→5카드 hub+hero ⑨모든 화면 아이콘 깨짐(빈칸) 0이면 정상.
⚠️ reviewer 참고: ①공유 _components(NextStepCTA·DivisionGenerateButton·AdvancePlayoffsButton 등)는 teams(B-a 완료)·divisions·bracket·matches·playoffs 다중 사용처 — teams는 이미 data-skin 부착·기타 화면 루트도 본 배치서 부착이라 전 사용처 일관 ②matches/playoffs 클라루트는 부모 page 래퍼 data-skin DOM 상속(별도 부착X) — 정상 여부 ③sports_basketball→volleyball 의미대체 적절성.

🔎 검증: `npx tsc --noEmit` EXIT=0 · B-c 대상 19파일 material-symbols 잔존 0(JSDoc 토큰 참조도 lucide로 갱신) · Icon name 전부 lucide 실존 · git status=tournament-admin/[id] 19파일만 M(teams/wizard/schema/api/referee/admin비대회 0). 미커밋(PM).

### Phase 3 Batch 3C — referee-admin 정산·운영 Toss 재스킨 (2026-06-21, developer)

📝 구현: referee/admin 정산·운영 7화면 비주얼만 Toss 전환 (기능 100% 보존). 변경 허용 = data-skin opt-in + Material→`<Icon>` 키트 교체뿐. API/패칭/모달/로직/문구 0 변경.

| 파일 | 변경 | data-skin 부착처 |
|------|------|------------------|
| bulk-register/page.tsx | 아이콘 6 교체 | 루트 div(단일) |
| bulk-verify/page.tsx | 아이콘 5 교체 | 루트 div(단일) |
| settlements/page.tsx | 아이콘 6 교체(테이블+모바일+모달+ModalShell) | 루트 div(단일) |
| settlements/new-batch/page.tsx | 아이콘 0(없음)·data-skin만 | 루트 div(단일) |
| settlements/dashboard/page.tsx | STATUS_META icon값 lucide化 + StatCard/warning Icon | 루트 div(단일) |
| fee-settings/page.tsx | ROLE_INFO icon값 lucide化 + 렌더 Icon | 루트 div(단일) |
| settings/page.tsx | 아이콘 6 교체 | early-return 3곳(loading·error·메인) 각각 부착 |

🔁 교체 아이콘 매핑 (Material→lucide kebab, 전부 lucide 실존 `node -e` 실측 확인):
arrow_back→arrow-left · upload_file→file-up · download→download · check_circle→circle-check · task_alt→circle-check-big · list→list · refresh→refresh-cw · playlist_add→list-plus · insights→trending-up · warning→triangle-alert · close→x · functions→sigma · pending/schedule→clock · cancel→ban · undo→undo-2 · sports→flag · groups/group→users · edit_note→file-pen · timer→timer · person_add→user-plus · edit→pencil · delete→trash-2 · info→info · error→circle-x

⚠️ UsersX류 함정 회피 확인: 복수 user 의미는 `users`(Users 실존) 사용·`users-x` 미사용. 의심 아이콘(functions·cancel·undo·insights·task_alt·timer 등) 전부 실측 검증 후 매핑.

🎨 토큰: fontVariationSettings('FILL' 1) 제거(lucide는 fill 개념 무관·시각 동등). 기존 하드코딩 #fff(대비텍스트)·rgba 폴백·var(--color-*) 전부 보존. 신규 하드코딩 hex 0. **토큰 보강 필요 항목: 없음**(3A referee 토큰으로 전부 커버).

💡 tester 참고: 7화면 진입→아이콘 깨짐 없음·정산 상태변경/일괄생성/excel등록/검증/단가저장/관리자추가 동작 동일하면 정상.
⚠️ reviewer 참고: settings early-return 3곳 data-skin 누락 여부·title 속성 보존(서류 완비 툴팁=Icon 감싼 span으로 이관) 확인 권장.

🔎 검증: tsc --noEmit EXIT=0 · `git status --porcelain -- "src/app/(referee)/"`=3C 7파일만 M(3A·3B·기타 변경0) · referee 트리 전체 `material-symbols` 잔존 0.

### Track B-1: admin_categories 마이그레이션 + 시드 (진행 중)
- 옛 BDR-join-v1 DB 4행 확보(REST API·publishable key, 1회성). 구조=id(uuid)/name/divisions(json)/ages(json)/created_at/updated_at. 지시서 4종과 정확 일치.
- 복원 데이터(시드 박제용):
  - 일반부: divisions=["D3","D4","D5","D6","D7","D8"], ages=[]
  - 유청소년: divisions=["하모니","i1","i2","i3","i4"], ages=["U8","U9","U10","U11","U12","U13","U14","U15","U16","U17","U18"]
  - 대학부: divisions=["U1","U2","U3"], ages=[]
  - 시니어: divisions=["S1","S2","S3"], ages=["+40","+45","+50","+55","+60","+65","+70"]

#### 구현 결과 (2026-06-21, developer)
📝 구현: admin_categories 테이블 신규 + 4행 시드 (DB 토대 B-1)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| prisma/schema.prisma | AdminCategory 모델 추가(L3502 TournamentDivisionRule 직후) | 수정 |
| (운영 DB) admin_categories | CREATE TABLE + UNIQUE(name) + 4행 시드 | 신규 |

- **모델**: BigInt PK + @map snake (mybdr 표준). `name @unique`(시드 upsert 기준·중복 방지). divisions/ages Json @default("[]"). sortOrder(신규). created_at/updated_at Timestamptz(6). updatedAt=@updatedAt.
- **⚠️ broad db push 중단 → targeted SQL 우회**: `prisma migrate diff` 결과에 의도무관 destructive 2건 섞임(`live_scoreboards` FK DROP + updated_at DROP DEFAULT — errors.md 06-19 알려진 드리프트). broad `db push` 시 운영 FK 유실 위험 → 중단. `prisma db execute`로 **CREATE TABLE + CREATE UNIQUE INDEX만** targeted 실행(무중단·기존영향0). live_scoreboards FK 사전/사후 생존 확인.
- **시드**: raw SQL ON CONFLICT(name) upsert로 idempotent. 4행 INSERT 성공.
- **사후 검증(실측)**: count=4. id 1~4(sort 0~3) / divisions·ages JSON 정확 일치(한글 "하모니"·"+40" 포함 정상). 일반부 div6/ages0·유청소년 div5/ages11·대학부 div3/ages0·시니어 div3/ages7.
- **tsc**: `npx tsc --noEmit` EXIT=0 (새 모델 import 운영코드 0건).
- **⚠️ prisma generate 미완(개발서버 락)**: 포트3001 개발서버(PID 78724)가 query_engine DLL 잠가 generate EPERM. **시드는 raw SQL이라 generate 무의존으로 완료**. 후속 단계(adminCategory client 사용) 전 개발서버 재시작 후 `npx prisma generate` 필요. → PM/사용자 결정.
- 임시 스크립트(precheck/seed/verify/sql) 실행 후 즉시 삭제(credentials 노출 방지 룰).

💡 tester 참고:
- 테스트 방법: `SELECT * FROM admin_categories ORDER BY sort_order` 4행 확인. 시드 재실행해도 4행 유지(upsert idempotent).
- 정상 동작: count=4, divisions/ages JSON이 위 데이터와 1:1.
- 주의: prisma client 미generate 상태 — `prisma.adminCategory` 사용 코드는 generate 후에만 컴파일됨(현재 사용처 0).

⚠️ reviewer 참고:
- broad db push 회피 + targeted SQL 선택이 핵심(errors.md 06-19 룰 준수). live_scoreboards FK 미접촉 확인.
- name @unique 추가(권고 모델엔 없었음) — upsert idempotent 위해 필수 판단.

### Track B 종별 마스터 관리 화면 (admin_categories CRUD UI) — 2026-06-21 developer

📝 구현: admin_categories CRUD 1배치 (신규 4파일). API(GET목록/POST/PATCH/DELETE·super_admin가드·Zod·P2002→409) + Toss UI(page서버조회 + content클라 시안1:1·TagInput칩·카드별저장버튼·삭제모달).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/admin/categories/route.ts | GET 목록(sortOrder asc) + POST 생성(P2002→409·sort_order 미지정 max+1) | 신규 |
| src/app/api/web/admin/categories/[id]/route.ts | PATCH 부분수정(최소1키·P2002→409·P2025→404) + DELETE 하드삭제(P2025→404·severity warning) | 신규 |
| src/app/(admin)/admin/categories/page.tsx | 서버: super_admin 방어가드+findMany(camel sortOrder)+직렬화(snake sort_order)→루트 data-skin="toss" | 신규 |
| src/app/(admin)/admin/categories/categories-content.tsx | 클라: AdminPageHeader+새종별추가카드+CategoryCard리스트(TagInput칩·dirty판정·1PATCH저장)+삭제모달+info푸터+에러배너 | 신규 |

- **🔑 prisma generate 불필요**: `node_modules/.prisma/client/index.d.ts`에 `adminCategory` 타입 실존(개발서버 재시작 후 generate된 상태). 서버 미종료. tsc baseline EXIT0 선확인.
- **가드**: 4핸들러 전부 `getWebSession()`+`isSuperAdmin()`→403 FORBIDDEN(suggestions/respond 패턴 동형). page.tsx도 페이지단위 방어가드(미통과 redirect /admin).
- **Zod**: TagArr=`array(string.trim().min(1).max(40)).max(50)`+중복차단 refine(빈배열 허용). create=name필수+나머지 optional / update=전부 optional+최소1키 refine.
- **중복**: name @unique → `Prisma.PrismaClientKnownRequestError` code P2002 try/catch→409 DUPLICATE_NAME(POST+PATCH 둘 다). PATCH/DELETE 대상부재 P2025→404.
- **snake 정합**: apiSuccess가 sortOrder→sort_order 자동변환. content.tsx CategoryItem.sort_order(snake)·page.tsx 직렬화도 sort_order로 맞춤(혼동 차단). server prisma만 camel(sortOrder).
- **편집 UX**: 칩 add/remove마다 PATCH(채터링) 회피 → CategoryCard 로컬state로 편집→dirty 판정(name/divisions/ages JSON 비교)→"변경사항 저장" 버튼 1 PATCH. 저장성공시 서버응답으로 카드 재동기화.
- **Toss**: @/components/admin-toss(Icon/Btn/Badge/Modal)+.ts-* 재사용(신규 CSS 0). 아이콘 실존검증: cake/layout-grid/trash-2/plus/x/info/save/circle-x 전부 lucide-react 존재(빈span폴백0). 색상=토큰만(var(--primary)/--ink/--danger/--primary-weak), 연령 보라 #6D5AE6은 시안 .ts-chip--age와 동일값(라벨에만 인라인·하드코딩 신규hex 0). 루트 div만 data-skin·공유셸 미부착.
- **삭제**: FK참조0(§0)→하드삭제. 확인모달 "기존 대회 무영향·생성기 프리셋에서 사라짐" 안내.
- **세션 충돌**: 전부 신규경로(admin/categories/* + api/web/admin/categories/*)·세션A/기존 비중첩. schema0·시드0·api/v1 미접촉·사이드바nav 미접촉.
- **tsc**: `npx tsc --noEmit` EXIT=0.

💡 tester 참고:
- 테스트: super_admin 로그인 후 `/admin/categories` 직접 URL 접근(사이드바 링크는 범위외·미생성). GET 4행(일반부·유청소년·대학부·시니어) 카드 노출 → 새 종별 추가(POST) → 칩 add/remove 후 "변경사항 저장"(PATCH) → 삭제 모달(DELETE).
- 정상: 4종 카드+디비전/연령 칩 정확 표시. dirty시만 저장버튼 활성. 비-super_admin은 redirect /admin.
- 주의 입력: ①중복 name 생성 → 409 DUPLICATE_NAME(에러배너) ②칩 중복 → UI 선차단(서버Zod도 차단) ③빈 name 저장 → 버튼 비활성 ④divisions/ages 빈배열 정상("없음" 표기).

⚠️ reviewer 참고:
- P2002/P2025 try/catch 분기(POST·PATCH·DELETE)·snake_case 정합(page 직렬화 sort_order)·super_admin 가드 4핸들러+page 방어 확인.
- 카드별 저장 dirty 판정(JSON.stringify 비교)·useEffect 서버데이터 재동기화 로직.
- data-skin 루트div만·하드코딩 신규hex 0(#6D5AE6은 시안 기존값 재현)·신규 CSS 0.

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-21 | 한글 IME 가드 추가 — onKeyDown Enter commit 2핸들러(TagInput 칩추가 L106·새종별추가 L416)에 `if (e.nativeEvent.isComposing) return;` 선가드. 기능·문구·스킨 변경0, tsc EXIT=0 | categories-content.tsx | reviewer 요청: 한글 조합 중 Enter 시 마지막 글자 잘림(데이터 손상) — conventions.md [2026-05-07] IME 가드 룰 |

### Track B Phase4 참가신청 3단계 (Toss 리스킨) — 2026-06-21 developer (세션 B)

📝 구현: 기존 (web) 참가신청 화면을 **시안 Apply.jsx 3단계 Toss 룩으로 리스킨+단순화**. 신규 화면/라우트/API **0**. POST/route.ts/joinSchema/prisma schema **diff 0**(클라 body 형태 동일 유지).

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| (web)/tournaments/[id]/join/page.tsx | 5→3단계 축소(①팀선택+확인 ②종별·디비전 ③로스터+약관). 대표자 입력칸 폐지(user_info 자동값 state→POST)·유니폼 color picker 폐지(team color 자동값→POST)·약관2종 ③하단 제출게이트·서류/결제step 폐지·완료=입금안내흡수. 루트 `.te-enroll[data-skin="toss"]`. lucide 5종. MIN_PLAYERS_GUARD/ALLOW_GUEST=false 고정 | 수정 |
| (web)/.../_v2/enroll-stepper.tsx | 5-step 원+라벨+연결선 → StepDots N칸(점·현재칸 알약). StepDef 시그니처 보존 | 수정 |
| (web)/.../_v2/enroll-success-hero.tsx | Toss 완료화면(ts-done/ts-bankbox). 입금계좌 안내 흡수(bankName/Account/Holder/feeText props 추가)·status="waiting"→warn톤. lucide(Check/Clock/Copy/ArrowLeft/User) | 수정 |
| (web)/.../_v2/tournament-enroll.css | `.te-enroll[data-skin="toss"]` 루트스코프 self-contained Toss 토큰(--primary/--ink/--border/--warn/--ok/--grey-* 등)+클래스(ts-card/ts-chip/ts-btn/ts-badge/ts-check/ts-steps/ts-selrow/ts-inforow/ts-agree/ts-done/ts-bankbox) 직접 정의. iOS input 16px | 수정 |

- **POST diff 0 확인**: route.ts(API)·joinSchema·schema.prisma **git diff stat 비어있음**(검증 완료). 클라 POST body=기존과 동일(teamId/category/division/uniformHome/uniformAway/managerName/managerPhone/players[{userId,playerName,birthDate,isElite}]). jersey/position 미전송(서버 team_members 자동복사) 유지.
- **약관 동의 배치**: 시안엔 없으나 기존 운영 흐름 보존 위해 **③ 로스터 단계 하단**(약관 2종 체크박스)으로 이동. agreeRules/agreeMedia 둘 다 true여야 제출버튼 활성(canSubmit 게이트). 초기값 false(미동의 시작). 서류 step("준비중")은 폐지.
- **종별 출처**: `tournament.categories`(대회별 jsonb) 단일소스 유지. admin_categories 미참조(시안 master 참조는 mock 편의).
- **Toss 격리 방식**: (web)은 다크기본+toss-admin.css 미로드 → 의존 0. Toss 토큰+클래스를 `.te-enroll[data-skin="toss"]` **루트 스코프로 자체 선언**(globals/admin-css 무의존). (web) 전역 다크 토큰 미접촉·AppNav 등 (web) 레이아웃 미접촉(이 페이지 콘텐츠만 Toss). 아이콘=lucide-react 직접 import(CDN/window.lucide 0). ⚠️CSS 하단 .te-method/.te-success 구(舊) Material 규칙은 미렌더 dead CSS(잔존·무해).
- **adaptive**: 부문 미설정 대회(hasCategories=false)면 ② 스킵→2단계(StepDots 2칸).
- **보존**: 본인인증 사전 redirect(me fetch)·주장팀만 노출·접수기간 가드·이미신청 disabled 전부 유지. snake_case 접근자(my_teams/div_caps/division_counts/user_info/is_registration_open/waiting_number) 유지(camel 전환 0).
- **MIN_PLAYERS_GUARD/ALLOW_GUEST OFF**: 클라 토글 false 고정. 게스트버튼·최소인원 클라 차단가드 미노출. 서버 roster_min 가드는 존속→제출 실패 시 setError 표시(안내문구만 노출).
- **orphan 컴포넌트**: enroll-aside/poster/step-docs/step-payment 4건 = import 제거(미렌더). 파일은 디스크 잔존·diff 0(삭제 안 함).
- **tsc**: `npx tsc --noEmit` EXIT=0.
- **세션**: 코드영역 `(web)/tournaments/[id]/join/*` 4파일만 M. admin/*·referee/*(세션A)·schema·api/v1 미접촉. **미커밋**(PM 소관).

💡 tester 참고:
- 테스트: 본인인증 완료 사용자로 `/tournaments/{id}/join` 진입(미인증→identity redirect). ①주장팀 카드 선택→팀정보 표시(대표자/연락처/유니폼 자동) ②종별 칩→디비전 카드(정원 N/M팀·만석시 대기접수 배지) ③선수 체크(전체선택 토글·선출 배지)+약관 2종 체크→제출.
- 정상: 약관 둘 다 체크해야 제출버튼 활성. 제출 성공→완료화면(입금계좌+금액·대기시 warn톤). 부문없는 대회=2단계.
- 주의 입력: ①약관 미체크 제출 차단 ②선수 5명 미만(roster_min)→서버422→에러배너 노출(클라가드 OFF라 클라는 통과시킴) ③정원만석+대기불허 디비전=disabled ④이미 신청한 팀=disabled.

⚠️ reviewer 참고:
- POST route.ts/joinSchema/schema diff 0(재사용만)·snake_case 접근자 유지·본인인증/주장 가드 보존 확인.
- Toss 토큰 루트스코프 격리(.te-enroll[data-skin="toss"])가 (web) 다크 전역 토큰 누수 없는지·lucide-react만(CDN 0).
- 약관 2종 제출게이트(canSubmit) 로직·유니폼/대표자 자동값 POST 전송 정확성.
- CSS 하단 .te-method/.te-success 구 Material 규칙 dead CSS(미렌더)—제거 후속 권장(현재 무해).

#### 수정 이력: 대표자 null 차단 수정
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|
| 1차 | 2026-06-21 | 대표자/연락처 InfoRow를 **조건부 입력칸**으로 교체(prefill 값 있으면 표시·비어있으면 편집 input 노출, --bg-elev/--border 토큰·인라인 스타일·신규 CSS 0) + canNext(info 단계) 게이트에 `managerName.trim()`·`managerPhone.trim()` 필수 추가. prefill 1회 유지(user_info 수정값 미덮어씀). route.ts/joinSchema/schema diff 0·tsc EXIT0·page.tsx 1파일 한정 | (web)/tournaments/[id]/join/page.tsx | reviewer 차단: user.phone null(카카오/구글 가입자) 사용자가 자동값 빈값+입력칸 없음+게이트 미체크로 서버 min(1) 422 영구 제출불가(회귀). 권고 A 채택 |

### Track B Phase4 B-a — 입금→자동확정 API + 참가팀 화면 Toss 리스킨 — 2026-06-21 developer (세션 B)

📝 구현: ①참가팀 PATCH API에 payment_status 수용 + 입금→자동확정(paid→approved) 로직 신규 / ②참가팀 관리 화면(tournament-admin teams ~1600줄) Toss 리스킨(비주얼만). 추가 스키마 변경 0·신규모델 0·db push 0.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/app/api/web/tournaments/[id]/teams/[teamId]/route.ts | PATCH 확장: payment_status(snake/camel 양쪽 키) unpaid/paid/refunded 검증→400·paid 시 paid_at 기록·입금→자동확정(정원가드+멱등 단일 트랜잭션)·응답에 promoted/promote_reason 동봉 | 수정 |
| src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx | 루트+loading div `data-skin="toss"`·Material 17처→`<Icon>` lucide 키트·하드코딩hex 0·납부상태 인라인 select(paid 선택 시 자동확정 토스트)·updatePayment 핸들러 추가 | 수정 |

- **입금→자동확정 로직(핵심 신규)**: payment_status="paid" 수신 + 요청에 status 키 **없음** + 현재 status가 pending/waiting 일 때만 자동승격 시도(wantsAutoPromote). status 명시 변경 요청이 오면 그 요청 우선(자동승격 스킵).
- **정원 가드(필수)**: `Tournament.div_caps[tt.division]` cap 조회 → 현재 `status:"approved"` 카운트 < cap 일 때만 promoted=true. cap 미설정(또는 division null)이면 무제한 승격(기존 정책·join/route.ts 동일). 초과면 promoted=false·promote_reason="division_full"(payment만 paid 반영·status 유지). ⚠️ join 신청 카운트는 `[pending,approved]`지만 여기선 자기자신이 pending/waiting이라 **approved만** 카운트(자기 중복배제). div_caps는 join/route.ts와 동일 단일소스.
- **트랜잭션·멱등**: payment+status+teams_count 재계산을 단일 `$transaction`. becomingApproved=(명시승인 \|\| 자동승격) 통합 판정으로 teams_count +1 동기화·중복증가 차단. 이미 approved+paid면 wantsAutoPromote=false→promoted=false→teams_count 무변동·status 유지·paid_at만 갱신(부작용 없는 no-op 수준).
- **기존 보존**: status/seedNumber/groupName/division 전이·requireTournamentAdmin 권한가드·teams_count decrement(거절/취소)·DELETE 핸들러 전부 미변경. 자동승격은 **paid 트리거에만** 추가. §0 status 매핑 준수(approved/pending/waiting/rejected·is_waiting 컬럼 미사용·payment unpaid/paid/refunded). snake_case 응답(promote_reason).
- **Toss 리스킨**: `data-skin="toss"` 부착으로 toss-admin.css가 `var(--color-*)` 토큰을 라이트 Toss로 자동 리매핑(클래스 변경 최소화). Material 아이콘 17처→`<Icon>` 키트(lucide 19종 `node -e` 실존 검증·빈span폴백0): download·message-circle(chat)·volleyball(농구부재)·chevron-up/down·copy·link-2-off·x·pencil·refresh-cw·printer·clipboard-paste·user-plus·trash-2·briefcase·id-card·user·circle-help·check. 기능/컬럼/필터/문구/CSV/모달/토큰관리/시드 변경 0. 하드코딩 신규 hex 0.
- **납부 인라인 변경 UI**: 모달 헤더 PaymentBadge 옆에 select(미납/납부/환불) 추가(no-print). onChange→updatePayment→PATCH. paid 응답 promoted=true시 "자동 승인" 토스트·promote_reason="division_full"시 "정원 가득 자동승인 보류" 토스트. 기존 status 버튼(승인/거절/승인변경)은 1:1 보존.
- **tsc**: `npx tsc --noEmit` EXIT=0. git 격리 = 지정 2파일만 M(세션A/admin비대회/referee/schema 0).

💡 tester 참고:
- 테스트: super_admin/대회운영자 로그인 → `/tournament-admin/tournaments/[id]/teams` → 팀 카드 클릭(모달) → 납부 select "납부" 선택.
- 정상: ①pending/waiting 팀 + 정원 여유 → "참가 확정(승인)으로 자동 변경" 토스트 + status가 승인으로 바뀜 ②정원 가득(div_caps 설정+approved≥cap) → "정원 가득 자동승인 보류" 토스트·status 유지·납부만 paid ③div_caps 미설정 → 무제한 승격 ④이미 approved 팀에 paid 재설정 → teams_count 무변동(멱등).
- 주의 입력: payment_status에 unpaid/paid/refunded 외 값 → 400. status 키와 payment_status를 동시 전송 시 status 우선(자동승격 스킵).

⚠️ reviewer/tester 집중검증 메모:
- **정원 가드**: approved 카운트 기준 정확성(자기 자신 미포함)·cap 미설정 무제한·초과 시 status 유지+payment만 반영.
- **멱등**: 이미 approved+paid 재요청 시 teams_count 중복 증가 없는지(becomingApproved=false 확인).
- **status 전이 보존**: 기존 명시 status 변경(승인/거절/취소) 시 teams_count ±1 동기화가 자동승격 분기와 충돌 없이 1회만 적용되는지.

## 테스트 결과 (tester)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

### 새 대회 생성폼 B-1 — schema ADD + POST 3필드 확장 (2026-06-22, tester — 정적/타입 검증·세션B)

📊 종합: 6개 검증 전부 통과 / 차단 이슈 0 / 후속 minor 1건(B-1 무관·기존 코드)

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | ✅ 통과 | EXIT=0. places 타입 확장(address optional化)이 기존 호출부 미파괴(wizard·prospectus-to-draft `[{name,address}]` 통과). gameRules/scheduleDates 신규 필드 컴파일 정상 |
| 회귀 0 (3필드 전부 optional) | ✅ 통과 | route.ts `gameRules\|\|undefined`·`scheduleDates\|\|undefined` / tournament.ts `...(input.gameRules ? {game_rules:...} : {})` spread. **미전송 시 createData에서 키 자체가 빠져** schema @default(`{}`/`[]`)로 떨어짐 → 기존 행과 동일. 기존 생성 흐름(name만) 안전 |
| 기존 로직 보존 (git diff 검증) | ✅ 통과 | status="draft" default(L475)·$transaction(L533)·DivisionRule 미생성 라인 **이번 diff 미포함**(context로만 표시) = 미변경. diff=3파일 28+/1- 한정. createData 신규 매핑 2줄만 추가, 기존 로직 라인 무손상 |
| schema 정합 (DB 컬럼 실측·SELECT only) | ✅ 통과 | information_schema 조회: `schedule_dates`=jsonb DEFAULT `'[]'::jsonb`(신규 ADD 정상)·`game_rules`=jsonb DEFAULT `'{}'::jsonb`(기존 컬럼 재사용·이번 diff엔 schedule_dates만)·`places`=jsonb. prisma @map snake 정합. 운영 영향 0(SELECT만)·임시 스크립트 즉시 삭제 |
| snake 정합 (저장/응답) | ✅ 통과 | createData가 prisma 컬럼명 snake `game_rules`/`schedule_dates`로 매핑. jsonb **내부 값**은 `JSON.parse(JSON.stringify())` round-trip으로 camelCase 그대로 보존(apiSuccess snake 변환은 응답 최상위 키만·jsonb 내부 미변환). 응답 키 `redirect_url` snake |
| 격리 (3파일 국한·api/v1 미접촉) | ✅ 통과 | git diff=schema/route/tournament 3파일만. `src/app/api/v1/` diff 비어있음(Flutter 영역 미접촉). UI(B-2~4 소관) 미생성 정상 |

🔎 실제 런타임(POST 세션 인증 후 name만/3필드 전송 → DB 저장 SELECT 검증)은 개발서버 종료 상태로 미수행 — 정적/타입/diff/DB컬럼 실측으로 대체(작업 지시 정합). 본 라우트는 api/web(getWebSession)라 errors.md proxy PUBLIC_API_ROUTES(api/v1 전용) 함정 비해당.

⚠️ 후속 minor (차단 아님·B-1 무관): tournament.ts L500 `rules: input.rules ?? input.rules ?? null` 중복 `??` 표현 — 동작상 `input.rules ?? null`과 동일(무해). **이번 B-1 diff에 미포함된 기존 코드**라 B-1 통과에 영향 0. 차후 정리 권장 수준.

### Track B Phase4 B-d 경기별 기록자 배정 (settings.recorder_id jsonb) (2026-06-21, tester — 정적 검증·세션B)

📊 종합: 8개 검증 전부 통과 / 차단 이슈 0 / 후속 minor 1건

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | ✅ 통과 | EXIT=0 (신규 route 2종+page.tsx 컴파일 정상) |
| 🚨 settings jsonb merge 기존 키 보존 | ✅ 통과 | recorder/route.ts L130~142·auto-assign L103~108 둘 다 `{...prevSettings, recorder_id}` spread 후 set / 해제는 `delete nextSettings.recorder_id`(키만 제거). **통째 덮어쓰기 0** — division_code/recording_mode/timeouts 등 보존(errors.md 2026-05-17 division_code 누락 동형 회피). prevSettings는 null/array 방어(asRecord/typeof object) |
| 🚨 풀 검증 (RECORDER_NOT_IN_POOL) | ✅ 통과 | recorder PATCH: recorderUserId!=null 시 `tournament_recorders.findFirst({tournamentId,recorderId,isActive:true})` 없으면 400 RECORDER_NOT_IN_POOL → 풀 외 인원 차단. 해제(null)는 풀검증 skip(정상). auto-assign은 pool=isActive만 조회→순환이라 풀 내 인원만. 가드 requireRecordersManageAccess(recorder_admin/organizer/TAM/super_admin) 기존 recorders/route.ts와 동형 보존 |
| 🚨 IDOR / 멱등 | ✅ 통과 | match를 `findFirst({id:matchBigInt, tournamentId:id})`로 조회→URL[id]≠match.tournamentId면 404(IDOR 차단). 같은 값 재배정=update 멱등·없던 키 해제=delete 무해(멱등). $transaction 사용(recorder=update 1건/auto-assign=updates 배열 묶음). parseBigIntParam 실패→404·400 방어 |
| 자동배정 라운드로빈 | ✅ 통과 | `pool[idx % pool.length]` idx=targets 인덱스·pool.length 모듈로 → 과배정/무한루프 0. pool.length===0→400 차단·targets.length===0→assigned_count:0 정상반환. overwrite=false 미배정만 필터(recorder_id null/"")·true 전체. orderBy(round_number/bracket_position/id) 안정 순서. $transaction(updates) 부분실패 방지 |
| snake_case 정합 (UI 접근자) | ✅ 통과 | 응답 recorder_id/match_id snake. **GET /matches 응답 키 패턴=운영검증 matches-client.tsx Match 타입과 100% 동일**(roundName/scheduledAt/homeTeam=camel·round_number/match_number/venue_name=snake·settings.recorder_id=snake). 새 page.tsx MatchRow·getMatchRecorderId·recorderNameById 접근자 동일패턴→정합. PATCH body=recorder_id(snake) 송신 |
| 의존 헬퍼/스키마 시그니처 | ✅ 통과 | adminLog(action,resourceType,{resourceId:bigint·targetId·changesMade·severity})·apiError(msg,status,code)·apiSuccess·parseBigIntParam(string)→bigint\|null·isRecorderAdmin·requireTournamentAdmin 전부 일치. recorder_id BigInt→`.toString()`(JSON 직렬화 가드). auto-assign adminLog resourceId 생략(uuid≠BigInt 컬럼 의도적·주석 명시) |
| 회귀 0 / 격리 | ✅ 통과 | **schema.prisma 무변경·기존 matches route(점수/상태 PATCH·matches/route.ts) 무변경·풀 관리 recorders/route.ts 무변경**(diff 비어있음). 신규 모델 0·신규 스키마 0. B-d 변경물=신규 route 2디렉토리(matches/[matchId]/recorder·recorders/auto-assign)+recorders/page.tsx 3개뿐. (※git diff에 admin-shell/referee-shell 변경 잡히나 이는 세션A Toss 셸 전환물·B-d 무관) |

🔎 실제 런타임(세션 인증 후 PATCH 배정/해제·풀외 400·자동배정 순환·기존 settings 키 보존 SELECT) 검증은 세션 필요로 미수행 — 정적 검증으로 대체. 본 라우트는 api/web(getWebSession 경유)라 errors.md proxy PUBLIC_API_ROUTES(api/v1 전용) 함정 비해당.

⚠️ 후속 minor (차단 아님): GET /matches 응답 키 정합은 운영 matches-client 동일패턴 근거로 판정 — apiSuccess의 camel→snake 일관 동작 특성상 신규 필드 추가 시엔 curl raw 1회 확인 권장(errors.md 06-13 재발6회 함정). 현 B-d는 기존 검증된 동일 응답 재사용이라 위험 0.

### Track B 종별 마스터 관리 화면 (2026-06-21, tester — 정적 검증 위주)

📊 종합: 8개 검증 전부 통과 / 차단 이슈 0 / 후속 minor 1건

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | ✅ 통과 | EXIT=0 (신규 4파일 컴파일 정상·adminCategory client 타입 실존) |
| super_admin 가드 (4핸들러) | ✅ 통과 | GET/POST/PATCH/DELETE 전부 getWebSession+isSuperAdmin→403 FORBIDDEN. page.tsx도 페이지 방어가드(redirect /admin) |
| snake_case 정합 | ✅ 통과 | route serialize=camel(sortOrder)→apiSuccess가 sort_order 자동변환. content.tsx CategoryItem.sort_order(snake)·page.tsx 직렬화도 sort_order. server prisma만 camel(c.sortOrder). 함정 회피 정확 |
| Zod 빈배열 허용 | ✅ 통과 | TagArr=array(...).max(50).refine(중복차단) — min 제약 없음→빈배열([]) 통과. create=name필수+optional / update=전부optional+최소1키 refine |
| 에러 매핑 (P2002/P2025) | ✅ 통과 | POST·PATCH P2002→409 DUPLICATE_NAME / PATCH·DELETE P2025→404 NOT_FOUND. Prisma.PrismaClientKnownRequestError instanceof 분기 정확 |
| 편집 UX (dirty·1 PATCH) | ✅ 통과 | CategoryCard 로컬state→JSON.stringify dirty 판정→"변경사항 저장" 1 PATCH(채터링 회피). useEffect로 저장 후 서버데이터 재동기화 |
| 의존 헬퍼/키트 시그니처 | ✅ 통과 | adminLog(action,resourceType,opts)·apiError(msg,status,code)·apiSuccess·isSuperAdmin·Icon/Btn/Badge/Modal(BtnProps extends ButtonHTMLAttributes→style/disabled/onClick/aria-label 정합·BtnSize sm/lg·BadgeTone grey)·AdminPageHeader(eyebrow/subtitle/breadcrumbs) 전부 일치. CSS 클래스(ts-card--flat·ts-chip--age/tag·ts-field__label·ts-input) toss-admin.css 실존(신규 CSS 0) |
| 회귀 0 | ✅ 통과 | schema/api-v1/세션A(admin/me·news·toss-admin.css) diff 전부 비어있음. 신규 categories 디렉토리 2개만 untracked. data-skin 루트 div만·하드코딩 신규hex 0(#6D5AE6=시안 .ts-chip--age 기존값) |

🔎 실제 런타임(super_admin 세션 CRUD·중복409) 검증은 세션 필요로 미수행 — 정적 검증으로 대체. 단, errors.md 06-08/06-19 함정(신규 v1 라우트 proxy 화이트리스트 401)은 **본 라우트가 api/web(getWebSession 경유)라 비해당** — proxy PUBLIC_API_ROUTES 무관.

⚠️ 후속 minor (차단 아님): POST/PATCH Zod 실패 시 `apiError(...,400,"VALIDATION_ERROR")` 직접 사용(공용 `validationError()` 헬퍼는 422 반환). 설계 명세대로 400 채택·동작 정상이나, 프로젝트 다른 라우트와 status code 관례(422) 차이 — 통일 검토 여지. 동작 영향 0.

### Track B 참가신청 3단계 (Toss 리스킨) (2026-06-21, tester — 정적 검증 위주·세션B)

📊 종합: 8개 검증 전부 통과 / 차단 이슈 0 / 후속 minor 1건

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| tsc --noEmit | ✅ 통과 | EXIT=0 (4파일 컴파일 정상) |
| 🚨 POST/GET API 무변경(회귀0) | ✅ 통과 | `git diff --stat` — route.ts·prisma/schema.prisma·joinSchema(validation/) **diff 전부 비어있음**. 서버 회귀 0 확정 |
| 클라 POST body 정합 | ✅ 통과 | page.tsx L265~282 body 키=teamId/category/division/uniformHome/uniformAway/managerName/managerPhone/players[] 기존 동일. 대표자=user_info 자동값(L195~198 GET 응답→state)·유니폼=team primary/secondary_color 자동값(L215~216 handleTeamSelect)·players=jersey/position 미전송(서버 team_members 자동복사) |
| 약관 동의 게이트 | ✅ 통과 | canSubmit(L446~451)=`!submitting && is_registration_open && agreeRules && agreeMedia && minOk`. agreeRules/agreeMedia 둘 다 true여야 제출버튼 활성(L1083 disabled={!canSubmit}). 동의 없이 제출 불가 |
| 가드 보존 | ✅ 통과 | 클라=본인인증 사전 redirect(L179~183 name_verified===false→/onboarding/identity)·snake접근자 전부 유지(my_teams/div_caps/division_counts/user_info/is_registration_open/waiting_number — camel 전환 0). 서버=requireIdentityVerified(route L160)·주장 captainId 가드(L214~219 403)·중복409(L250)·roster_min(L257) 전부 존속 |
| adaptive 2단계 | ✅ 통과 | hasCategories=false(부문 미설정)면 steps=[참가팀,로스터] 2칸(L383~386)·stage 분기 step1→info/그외→roster(L390~398). StepDots도 steps.length만큼 N칸 렌더(stepper L29) |
| Toss 격리 안전성 | ✅ 통과 | tournament-enroll.css 전 규칙이 `.te-enroll[data-skin="toss"]` 루트 스코프(:root·html·body·`*` 전역 셀렉터 0건 grep 확인). toss-admin.css/admin-toss import 0·window.lucide CDN injection 0·lucide-react 직접 import만(page·success-hero). (web) AppNav 다크 테마 누수 차단 |
| 회귀 — 4파일 국한 | ✅ 통과 | `git status` join 트리=정확히 4파일 M(page+stepper+success-hero+css). admin/referee/세션A·api/v1·schema 미접촉(referee 변경은 세션A Phase3 별개 작업물·본 작업 무관) |

🔎 실제 제출 런타임(세션·대회데이터 필요·div_caps 정원판정·waiting_number 부여)은 미수행 — 정적 검증으로 대체. POST 무변경이라 기존 동작 그대로 재사용(회귀 위험 0).
🔎 코드 노트: `feeForSelected()`(L431 function 선언)가 완료화면 분기(L363)에서 호출되나 function 호이스팅으로 정상 — 동작 영향 0.

⚠️ 후속 minor (차단 아님): success-hero가 props로 받는 `bankName/bankAccount/bankHolder/feeText`는 page.tsx가 `tournament.bank_name` 등 GET 응답(snake)에서 정상 전달. 단 GET join route 응답에 bank_* 필드가 실제 포함되는지는 런타임 확인 권장(현 GET select 미확인·표시용이라 누락 시 입금안내 박스만 hide·제출 흐름 영향 0).

### Track B Phase4 B-a — 입금→자동확정 API + 참가팀 리스킨 (2026-06-21, tester — 정적 코드분석·세션B)

📊 종합: 8개 검증 전부 통과 / 차단 이슈 0 / 후속 minor 1건. 🚨자동승격(정원가드·off-by-one·멱등) 전부 정확.

| 검증 항목 | 결과 | 비고 |
|-----------|------|------|
| ① tsc --noEmit | ✅ 통과 | EXIT=0 (지정 2파일 컴파일 정상·Icon 키트 시그니처 정합) |
| ② 🚨 정원가드 정확성(off-by-one) | ✅ 통과 | route L84~94: cap=`div_caps[tt.division]`·`approvedCount`=`status:"approved"`만 count(L87). 승격대상은 pending/waiting(L71)이라 **자기자신 카운트 미포함**(중복배제 정확). `approvedCount<cap`만 승격(L89)→cap=8·approved=7→7<8 승격(=8 충족)·approved=8→8<8 거짓 보류. **off-by-one 0**. cap null(`if(cap)` L84 — 0/undefined 무제한)·division null(`tt.division?` L82→cap=undefined→무제한, join정책 동일). 초과시 promoted=false·promote_reason="division_full"·payment만 paid·status 유지(L92~93) |
| ③ 🚨 멱등성 | ✅ 통과 | 이미 approved+paid 팀 재paid: status가 pending/waiting 아님→wantsAutoPromote=false(L71)→promoted=false→becomingApproved=false(L104)→teams_count **무변동**(L124 가드). paid_at만 L117에서 갱신(의도된 no-op). 중복 +1 없음 |
| ④ 🚨 기존 status 전이 보존 | ✅ 통과 | status 키 명시 시 wantsAutoPromote=false(L70 `status===undefined` 조건)→수동전이 우선·자동승격 스킵. status/seedNumber/groupName/division 전이 L110~114 보존. `requireTournamentAdmin(id)`(L13) 권한가드 미변경. reject/withdrawn 시 teams_count -1(L126) 보존. DELETE 핸들러 미변경(L138~164) |
| ⑤ 트랜잭션 단일성 | ✅ 통과 | payment+status+teams_count 전부 단일 `$transaction`(L102~131). becomingApproved=(명시승인‖promoted) 통합판정(L104)→teams_count +1 **1회만**(L124~125). 부분적용 차단 |
| ⑥ status/payment 매핑·is_waiting 미사용 | ✅ 통과 | ALLOWED_PAYMENT=unpaid/paid/refunded(L49)·외 값→400(L54). status값 approved/pending/waiting/rejected 매핑 준수. is_waiting grep 0(§0 D표 정합). schema diff 비어있음(컬럼 paid_at/payment_status/approved_at/div_caps/teams_count 전부 기존存) |
| ⑦ snake_case 응답·프론트 정합 | ✅ 통과 | 응답 `promoted`/`promote_reason`(L134 snake로 명시). page.tsx updatePayment가 `json.promoted`/`json.promote_reason`·body `payment_status` snake 접근(diff 확인). camel/snake 양쪽 키 수신 가드(L48 `payment_status ?? paymentStatus`) |
| ⑧ 리스킨 회귀0·격리 | ✅ 통과 | page.tsx diff=Material 17처→`<Icon>` lucide 19종(node require 전수 실존)+data-skin 루트2(loading+main)+납부 select 추가+updatePayment 핸들러뿐. 기능/컬럼/필터/CSV/모달/토큰/통계탭 1:1. Icon 키트=lucide-react(kit.tsx)·CDN주입0. data-skin 루트div만(전역 :root/`*` 0). schema diff 비어있음·지정 2파일만 M(referee/admin비대회/세션A/api-v1 0) |

🔎 실제 런타임(super_admin 세션·실대회 div_caps 정원)은 세션 필요로 미수행 — 정적 코드분석으로 대체.

⚠️ 후속 minor (차단 아님): 정원가드 `count`(L86)가 트랜잭션 시작 전 블록(L78~99)에서 실행(트랜잭션 밖). 동일 종별 다수 paid가 거의 동시 입력 시 approvedCount race로 cap+1 승격 가능성 이론상 존재. 운영자 1건씩 수동처리라 실발생 희박. 후속 강화 시 count를 $transaction 내부 이동 또는 serializable 검토 권장.

### 새 대회 만들기 생성폼 정합 조사 (읽기전용, 2026-06-21 planner — 코드/스키마 무변경)

🎯 결론 요약 (Flutter 게이트 판정 = **🟢 키 변경 필요 NO / 충돌 0**):
- 시안 README가 "기록앱 GameRules 1:1 정합"이라 했으나, 이는 **Flutter 앱(bdr_stat_v3) 내부 `game_rules.dart` 모델**이지 mybdr 서버 DB와의 계약이 아님. **mybdr 서버는 시안의 경기설정(유니폼·방식·파울·타임아웃)을 현재 저장/사용하지 않음** = 신규 빈공간 → 충돌할 기존 키가 애초에 없음.
- **match-sync는 game_rules를 1바이트도 안 읽음**: `match-sync.ts`+`sync/route.ts` 전수 정독 결과 = 점수/status/quarter_scores/player_stats(22필드)/play_by_plays만 처리. 경기 룰(쿼터시간·파울한도·타임아웃·유니폼) **읽기 0**. Flutter는 자체 game_rules.dart로 현장 운영만 하고 서버엔 결과(점수·스탯·PBP)만 sync.
- **`Tournament.game_rules` 컬럼은 dead column**: schema L304에 `game_rules Json? @default("{}")` 실재하나, **`grep "game_rules"` src/ 전체 = 0건**(읽기·쓰기 코드 전무). validation/service/route 어디도 미사용. → 시안 경기설정을 여기 박제 시 **신규 활용**(기존 키 충돌 불가).

🔴 **조사1. match-sync game_rules 키 대조 (Flutter 게이트)**
| 시안 GAME_SETTINGS state 키 (ct-game-settings.jsx) | mybdr 서버 매핑 | 판정 |
|------|------|------|
| homeColor / awayColor (유니폼 hex) | **서버 미저장**(team primary/secondary_color 별개·매치 sync에 유니폼 없음) | 신규 빈공간 |
| vestProvided (조끼 제공) | 서버 미저장 | 신규 빈공간 |
| quarterType('4Q'/'HALF') / quarterMinutes | 서버 미저장(quarter_scores는 PBP 결과·룰 아님) | 신규 빈공간 |
| clockMode('nonstop'/'dead') / shotClock | 서버 미저장 (sync의 shot_clock_seconds=PBP **이벤트 값**·룰 무관) | 신규 빈공간 |
| foulLimit / teamFoulBonus | 서버 미저장 (sync의 personal_fouls=선수 **기록 결과**·룰 무관) | 신규 빈공간 |
| firstHalfTimeouts / secondHalfTimeouts / timeoutDuration | 서버 미저장 | 신규 빈공간 |
- ✅ **판정: 시안 경기설정 ↔ 기존 game_rules JSON 키 충돌 = 0. 키 추가/변경/삭제로 인한 Flutter 회귀 위험 = 없음**(Flutter는 이 값들을 서버에서 받지 않고 앱 내부 기본값+현장조정으로 운영). → 시안 GAME_SETTINGS_DEFAULTS를 `Tournament.game_rules`(dead column 활성화) 또는 `Tournament.settings.game_rules` jsonb에 **그대로 신규 박제** 가능. **저장 위치만 PM 결정 필요**(아래 권고).
- ⚠️ 단, "1:1 정합" 표현은 **시안 폼 항목 ↔ Flutter 앱 game_rules.dart 항목**의 정합(현장 기록 일관성용)이지 서버 연동 계약이 아님. 서버 박제는 **순수 신규 메타 저장**(현재 Flutter가 서버에서 읽지 않으므로 박제해도 즉시 효과 0 — 향후 Flutter가 대회설정 fetch 연동 시 활용될 준비값). → developer는 "이 값을 저장하면 Flutter 동작이 바뀐다"고 오해 금지.
- 💡 저장위치 권고: **`Tournament.game_rules`(L304 dead column) 활성화** 권고. 사유=의미상 정확(game_rules=경기 룰)·settings 오염 회피·snake 정합. validation/tournament.ts + service/tournament.ts에 `gameRules` 필드 추가 필요(현재 places처럼). 대안=`settings.game_rules` jsonb(스키마0이나 settings 비대). → PM 택1.

🟡 **조사2. §2 정합표 실측 검증 (중복 생성 방지)**
| 시안 영역 | 운영 실제 | 판정 |
|------|------|------|
| 정규대회(시리즈) seriesId/seriesName | `Tournament.series_id`(L282 BigInt?) + `tournament_series` 모델 존재 | ✅ 재사용·신규0 |
| 장소(venues) name/region | `Tournament.venue_name`(L306)·`venue_address`(L307)·`places`(L317 Json `{name,address}[]`·validation L84 실사용) | ⚠️ 부분(아래 코트 참조) |
| 결제(입금계좌) | `Tournament.settings`/bank 필드+`entry_fee`(L300)·종별 참가비=`div_fees`/`DivisionRule.feeKrw`(L3480) | ✅ 재사용·신규0 |
| admin_categories(종별마스터) | AdminCategory(L3504~ BigInt PK·4종 시드 완료) | ✅ **이미 완료**(확인만·B-1 커밋 367c1d8) |
- 🔴 **진짜 신규 후보 = 날짜↔코트 배정 구조 (시안의 핵심 신규)**:
  - **운영 schema에 날짜별 코트 배정 구조 = 전무**. grep `tournament_date`·`date_court`·`court_assign`·DivisionRule의 date/court 필드 = **전부 0건**.
  - 시안 데이터 모델(create-tournament.jsx 실측): `venues[].{name,region,courtCount,naming('num'/'alpha')}` → 코트 파생(`courtsOf`=venue별 N개 코트 id 생성) / `dates[].{id,date,courtIds[]}` (날짜 1개 ↔ 코트 N개 **N:N 토글 배정**) / `categories[].divisions[].{method,cap,fee,dateId,courtId}` (디비전 1개 = 날짜1+코트1 매칭).
  - 운영 현실: `Tournament.places`(Json `{name,address}[]`)는 **장소명/주소 평면 배열뿐 — 코트 수·명명규칙·날짜배정 개념 0**. `courts`/`court_infos` 테이블은 **사용자 픽업게임용 코트DB**(대회 일정배정과 무관·tournament FK 없음). `TournamentMatch.venue_id`(L703)는 courts FK지만 **매치 단위**(생성폼의 사전 날짜↔코트 배정과 다른 레이어).
  - **최소 신규안 (기존 구조 확장 우선)**: 신규 테이블 없이 **`Tournament.places` jsonb 스키마 확장**으로 흡수 권고. 예: `places=[{id,name,region,courtCount,naming,courts:[{id,full}]}]` + 신규 `Tournament.schedule_dates` jsonb(`[{id,date,courtIds[]}]`) 또는 settings 내 키. 정규 테이블(tournament_dates + date_courts 조인)은 **날짜별 코트 쿼리/통계 필요 시에만**(현재 미요구 → jsonb 권고·무중단·스키마 ADD COLUMN 1개 NULL허용).
- **`TournamentDivisionRule`에 dateId/courtId 필드 필요 여부**: 현재 DivisionRule에 date/court 컬럼 **없음**(code/label/birthYear/grade/feeKrw/sortOrder/format/settings만 L3472~3496). 시안은 디비전별 경기날짜+코트 매칭 요구 → **DivisionRule.settings jsonb에 `match_date_id`/`match_court_id` 키 흡수 권고**(스키마 ADD 0·settings는 이미 자유형 jsonb). 정식 FK 컬럼은 날짜/코트가 정규 테이블화될 때만.

🟢 **조사3. 시안 화면 구조 vs 기존 위저드 (리빌딩 범위 판단)**
- **시안 = 2컬럼 단일 페이지** (create-tournament.jsx L432~): 좌(대회정보: 명/정규여부/주최/주관/후원사/포스터 + 일정·장소: VenueSearch→코트수·명명 + CalendarModal 날짜다중선택 + 날짜블록별 코트칩 토글) / 우(종별·디비전 제너레이터 + 디비전별 정원·참가비·날짜·코트 + 경기설정 카드) + **하단 고정 [대회 생성] 바**(누락항목 토스트 차단) + 게시모달(게시·접수기간·결제수단·입금계좌).
- **기존 운영 = 다중 경로 위저드** (`tournament-admin/tournaments/new/wizard/`): Quick / Legacy 3-step / 이전대회복사(tournament-copy-modal) / Division 제너레이터 모달 / prospectus AI. **이미 Toss 리스킨 완료**(B-b 커밋 2f4e0f9). 단계 분할형(step-by-step) — 시안의 단일 2컬럼과 IA 상이.
- **리빌딩 범위 판단 = 🔶 신규 페이지 추가 권고(기존 위저드 교체 ❌·병행)**:
  - 사유 ①시안의 **날짜↔코트 배정·코트 명명·경기설정**은 기존 위저드에 **없는 신규 기능** → 기존 step UI에 끼우기보다 시안 2컬럼 단일폼이 정합. ②기존 위저드(Quick/Legacy/복사/prospectus)는 **각각 다른 진입 시나리오** 서비스 중 → 교체 시 4경로 회귀 위험 큼. ③신규 생성폼은 schema 확장(places jsonb·schedule_dates) 동반 → 기존 위저드 POST(`series/[id]/editions`·`tournaments` route)와 **payload 구조 다름** → 별도 라우트가 격리 안전.
  - 권고 라우트: `tournament-admin/tournaments/new/` 신규 단일폼 페이지(시안 2컬럼) + 기존 `/new/wizard`는 유지(또는 "간편 생성" 링크로 강등). **PM 결정 필요**(전면 교체 vs 병행 vs 기존 위저드에 경기설정·날짜코트 섹션만 증설).
  - 비유(주방 리모델링): 기존 위저드=여러 출입문 있는 식당(Quick=테이크아웃·Legacy=홀·복사=단골재주문). 시안 단일폼=새 메인홀 1개로 통합한 설계. 기존 출입문들을 다 막고 새 홀만 두면(전면교체) 단골 동선 끊김 → 새 메인홀을 **추가로 열고** 기존 문은 보조로 두는 게 안전.

📌 PM 결정 필요 (착수 전):
- **(가)** 경기설정 저장 위치 = `Tournament.game_rules`(dead column 활성·권고) vs `settings.game_rules` jsonb. → validation/service 필드 추가 동반.
- **(나)** 날짜↔코트 배정 저장 = `places` jsonb 확장 + `schedule_dates` jsonb 신규 컬럼(권고·무중단) vs 정규 테이블(tournament_dates+date_courts). DivisionRule date/court는 settings jsonb 흡수 권고.
- **(다)** 리빌딩 범위 = 신규 단일폼 페이지 추가(권고·병행) vs 기존 위저드 전면 교체 vs 기존 위저드에 섹션만 증설.
- ⚠️ 위 (가)(나)는 **schema 변경(ADD COLUMN NULL허용 무중단)** 동반 가능 → 🚦 게이트(db push 전 PM 승인) 적용 대상.

📚 knowledge 승격 후보(PM 판단):
- decisions.md → "시안 '기록앱 GameRules 1:1 정합' = Flutter 앱 내부 모델 정합이지 서버 연동 계약 아님 — match-sync는 game_rules 미사용·서버 경기룰 저장 0"
- errors.md → "`Tournament.game_rules` = dead column(schema有·코드 grep 0) — 시안 경기설정 박제 시 신규 활용이며 Flutter 회귀 0(서버 미read)"
- architecture.md → "대회 날짜↔코트 배정 구조 부재 — places(평면 장소배열)뿐·courts/court_infos는 픽업게임 코트DB·생성폼 날짜코트는 신규(jsonb 확장 권고)"
