# 작업 스크래치패드

## 현재 작업
- **요청**: 관리자 Toss 디자인시스템 전환 (Phase 0~4). 시안=`Dev/design/BDR-current/_handoff-admin-toss-P0/`
- **상태**: Phase 0/1/3 PR-A 완료(origin/dev 머지 #725·#726). **동시 2세션 운영 중** — 아래 세션별 블록(🅰️/🅱️) 참조.

> ⚠️ **세션 충돌 방지 규약 (2026-06-21, 사용자 결정 — 옵션3)**: 메인 worktree에서 2세션 동시 작업. ①각 세션은 **자기 블록(🅰️/🅱️)만 수정**, 상대 블록·공용 섹션(§0 대조표/완료Phase) 미수정. ②작업 로그는 **append만**(기존 줄 덮어쓰기 금지). ③코드는 **각자 영역 디렉토리만** 명시적 `git add <경로>`(전체 `git add .` 금지) → 커밋 격리. ④두 영역은 디렉토리 비중첩(A=admin 비대회 / B=tournaments+schema)이라 working tree 충돌 0.

### 🅰️ 세션 A — Phase 3 referee 리스킨 (이 세션)
- **코드 영역**: `src/app/(referee)/referee/*` (회원 + referee-admin). admin/* 비대회는 Phase2 완료·미접촉. tournaments/*·schema는 세션 B 소관.
- **상태**: ✅ **Phase 3 referee 24화면 운영 반영 완료**(PR #732→dev·#733→main·53e3397). 3A(4f9a405)+3B(370c3dd)+3C(88c7648). referee 플랫폼 전체 Material 잔존0·tsc0·기능회귀0. Toss 관리자 전환 **Phase 0~3 전부 운영 완료**(남은 건 세션B Phase4 대회관리 리빌딩). 세션A 다음 작업 대기(미정).
  - **⚠️ 발견 문제(전부 해결/무영향)**: ①3A 토큰갭(--color-background/--color-text-on-primary 미커버→[data-skin] 보강, 해결) ②3B 아이콘 오타(UsersX 부재→user-x 교정, 해결) ③referee-picker title 툴팁 일부 span 이관(장식·기능0) ④로컬 build는 dev서버 DLL락으로 미실행→Vercel CI 빌드 의존(운영배포 빌드 결과 확인 권장) ⑤브랜치 정책 변경(subin폐지·dev직접)됐으나 이번 세션은 subin 사용·다음 세션부터 dev 적용 권장.
  - **✅ 3A 토큰 보강 완료(PM 결정)**: referee `--color-background`(→#F2F4F6)·`--color-text-on-primary`(→#FFFFFF)는 globals :root 별칭이 다크 고정 → toss-admin.css `[data-skin]` 결합셀렉터(258~)에 명시 추가. admin 미사용 토큰(grep0)이라 Phase1/2 회귀0. 커밋 4f9a405 포함.
  - **3A 변경 13파일**: _components(referee-shell·notification-bell·empty-state) + page·profile(+edit)·certificates(+[id])·documents·assignments·applications·notifications·settlements. layout.tsx=Material0→무변경. referee-picker=admin배정용 3B로 제외(미접촉). data-skin=셸 크롬 3곳(aside·header·하단nav, main미부착)+각 페이지 루트div(early-return 별도루트 포함). 아이콘=키트Icon만(lucide직접import0). 의미대체: sports(호루라기lucide부재)→flag·health_and_safety→heart-pulse·workspace_premium→award·account_balance→landmark·document_scanner→scan-text·more_horiz→ellipsis.
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
| 2026-06-21 | Track B Phase4 B-b 대회 생성 위저드 Toss 리스킨 (developer 세션B) | ✅ 4파일(new/wizard/page.tsx·prospectus·tournament-copy-modal·division-generator-modal) Material 35위치→lucide `<Icon>` 키트 교체 + data-skin="toss" 루트 opt-in(Quick/Legacy/prospectus 메인+early-return). 의미대체1(gradient→square)·volleyball(농구부재). rgba초록 tint→color-mix 토큰. **API/POST body/단계/DivisionGenerator 로직/이전대회복사 0 변경**(git diff 로직라인 실측). Icon 29종 lucide 실존검증. tsc EXIT=0. material 잔존0. git=대상4파일만M(referee/admin비대회/teams/schema 0). 미커밋 |
| 2026-06-21 | Track B Phase4 대회 생성+상세(대진통합) 설계 (planner, 읽기전용·코드/스키마 무변경) | ✅ 핵심발견=**운영 대회관리 거의 전부 기구현**(본진=`(admin)/tournament-admin/tournaments/`·admin/tournaments 아님). 생성위저드(Quick/Legacy3-step/복사/Division/prospectus)·상세(SetupChecklist+teams+divisions+bracket+recorders+site+completed)·대진(5포맷)·기록자풀 전부 完·Toss 미리스킨. **진짜 신규 2건뿐**=①입금→자동확정 API(payment_status PATCH 미구현·paid→approved 승격) ②경기별기록자(settings.recorder_id·PM② 확정 jsonb). 하위배치4분해: B-a(입금자동확정 API+teams리스킨·1순위·유일 기능신규) / B-b(생성위저드 리스킨) / B-c(상세나머지 리스킨) / B-d(경기별기록자 settings). 시안 통합5탭IA=분산라우트 유지 권고(전면재구성 보류). status D표 매핑(WAITING=waiting+waiting_number·is_waiting❌)·div_caps 정원·TournamentMatch 단일모델·settings merge·snake·스키마0. PM확정3건(IA·대기승격 자동vs수동·착수순서). 미커밋 |
| 2026-06-21 | Track B 참가신청 3단계 (Toss 리스킨) **검증** (tester, 세션B·정적) | ✅ 8항목 전부 통과·차단0. 🚨회귀0 확정(route.ts·schema.prisma·joinSchema diff 비어있음)·클라 POST body 동일(대표자/유니폼 자동값)·약관2종 게이트(canSubmit)·본인인증redirect+주장가드+snake접근자 보존·adaptive 2단계·Toss격리(전역셀렉터·:root 오염0·toss-admin.css 미import·lucide-react직접)·join 4파일 국한. tsc EXIT0. 후속minor1(GET bank_* 응답 런타임확인 권장, 표시용·제출영향0). 미커밋 |
| 2026-06-21 | Toss Phase 3 Batch 3B(referee-admin 코어 11파일) 리스킨 (developer 세션A, 본인+fork2병렬) | ✅ layout(AccessDenied 루트 data-skin+lock→lucide)·referee-picker(자체렌더루트 data-skin·search/x/star)·page대시보드(동적 stat/quickLinks icon값 lucide명화·shield-check/chevron-right)·assignments(루트 data-skin·circle-x/search/trophy×2/plus/info/circle-check)·announcements(+[id] 3루트)·members(+new/[id]2루트/[id]/documents)·pools. data-skin=AccessDenied루트+각 page루트+early-return별도루트(members[id]·documents·announcements[id])+referee-picker자체루트. Material79→키트Icon 전환·잔존0. 동적아이콘(DOC_CONFIGS·삼항 verified/pending) 정의부까지 치환. 의미대체=group_off→user-x(UsersX미존재→UserX)·pending→clock·print→printer·auto_fix_high→wand-sparkles·edit_note→file-pen·star_border→star(fill재현). lucide 전수실존검증(node require)·tsc EXIT0·material잔존0(3C 6파일만 잔존=미접촉정상)·git격리OK(3B 11파일만M·3A/toss-css/admin/tournaments/schema 0). 미커밋 |
| 2026-06-21 | Track B Phase4 참가신청 3단계 (Toss 리스킨) 구현 (developer, 세션 B) | ✅ 기존 (web) join 화면 4파일 리스킨(page+stepper+success-hero+css). 5→3단계 축소(팀선택+확인/종별·디비전/로스터+약관). 대표자입력칸·유니폼picker 폐지(자동값 POST)·약관2종 ③하단 제출게이트·서류/결제step 폐지·완료=입금안내흡수. Toss 토큰 `.te-enroll[data-skin="toss"]` 루트스코프 self-contained(toss-admin.css 무의존)·lucide-react 직접import. **POST route.ts/joinSchema/schema diff 0**(클라 body 동일). snake접근자·본인인증/주장가드 보존. MIN_PLAYERS/GUEST=false 고정. adaptive 2단계(부문없을시). tsc EXIT0. 미커밋 |
| 2026-06-21 | Track B 참가신청 3단계 설계 (planner, 읽기전용·코드/스키마 무변경) | ✅ 핵심발견=**기존 (web) join 화면 완전구현 존재**((web)/tournaments/[id]/join/page.tsx 1292줄+_v2 7조각). 라우트권고=**기존 사용자(web) 화면 리스킨**(admin신설❌·신규❌·Toss예외스킨). **기존 POST 무변경 재사용**(route.ts L344~436이 div_caps정원판정·waiting_number=maxWaiting+1·status"waiting"·TTP createMany·payment unpaid default·중복409·주장등번호 single-source 전부 이미처리). 신규파일0·schema0. 변경=page.tsx 3단계축소(팀→디비전→로스터)+유니폼/대표자입력 제거+Toss룩·_v2 4조각 리스킨만. 종별출처=**tournament.categories 유지**(admin_categories❌). 미결2(PM확정 선행): ①서류/약관동의 step 처리 ②(web)다크 vs Toss라이트 충돌→join루트 토큰격리. snake접근자유지·본인인증/주장가드 보존 명시 |
| 2026-06-21 | Toss Phase 3 Batch 3A(referee 셸+회원 13파일) 리스킨 (developer, 본인+fork 2병렬) | ✅ data-skin opt-in(셸 크롬 3곳·main미부착·페이지 루트별)+Material137→키트lucide Icon 전환. 기능/패칭/server action/라우트/탭/필터/모달/문구 1:1보존. 동적 아이콘헬퍼(iconForType·STATUS_META·DOC_CONFIGS 등) 전부 치환. 의미대체6종(sports→flag 등). lucide직접import0. tsc EXIT0·material잔존0·git격리OK(referee 13파일만 M·admin/toss-css/tournaments/schema 0). 🔧토큰보강 필요(--color-background·text-on-primary 미커버, PM결정 요망). 미커밋 |
| 2026-06-21 | Track B 종별 마스터 관리 화면 **검증+커밋** (tester+reviewer 병렬→IME가드 수정→PM) | ✅ tester 8항목 통과(snake정합·빈배열·에러매핑·회귀0)·reviewer 차단0(권고3/사소3). 한글 IME 조합가드 2핸들러 추가(reviewer 권고). **커밋 50053a2**(신규4파일+메타). tsc EXIT0. 미푸시2건. PM결정5건 decisions.md 승격 |
| 2026-06-21 | Track B 종별 마스터 관리 화면 구현 (developer) | ✅ 신규4파일(API route GET/POST·[id] PATCH/DELETE + page서버 + content클라). super_admin가드·Zod TagArr중복차단·P2002→409 DUPLICATE_NAME·P2025→404. UI=시안1:1 TagInput칩·dirty판정 카드별 1PATCH저장·삭제모달·에러배너. prisma generate 불필요(타입실존). snake정합(sort_order). Toss키트·신규CSS0·하드코딩hex0·data-skin 루트div만. schema0·시드0·세션비중첩. tsc EXIT0. 미커밋 |
| 2026-06-21 | Track B 종별 마스터 관리 화면 설계 (planner, 읽기전용·코드/스키마 무변경) | ✅ 통합위치=신규 라우트 `/admin/categories` 권고(설정탭❌·settings는 use client 2카드라 server조회 못끼움). API 2파일(GET목록/POST/PATCH/DELETE·super_admin가드·Zod TagArr중복차단·P2002→409 DUPLICATE_NAME). UI=page.tsx 서버조회(adminCategory.findMany)+categories-content.tsx 클라(data-skin toss·TagInput 디비전/연령 칩·카드별 저장버튼 권고). 삭제 참조무결성 가드=불필요(FK참조 0건·대회는 category 문자열명만 보유). prisma generate 선행 1순위(미generate 락). snake_case 응답함정·신규 4파일 세션비중첩 명시 |
| 2026-06-21 | Toss Phase 2 Batch 2C(마지막) 3화면 리스킨 (developer) | ✅ 11파일 M(news page+admin-news-content+compose-content / me page+_components 7). data-skin="toss"=3 page 루트(news page div·me page div·compose-content 루트div=page가 래퍼없이 직접렌더). 자식 content/카드는 DOM상속. Material→lucide(<Icon> 키트) 잔존0(grep news+me 트리=0). lucide 39종 실존 검증(빈span폴백0): open_in_new→external-link·arrow_back→arrow-left·edit_note→file-pen·format_bold→bold·format_italic→italic·format_list_bulleted→list·format_quote→quote·image→image·add_photo_alternate→image-plus·send→send·save→save·schedule→clock·visibility→eye·sports_basketball→volleyball(농구부재)·celebration→party-popper·campaign→megaphone·photo→image·hub→share-2·history→history·check_circle→circle-check·edit→pencil·close→x·verified→badge-check·info→info·warning→triangle-alert·tips_and_updates→lightbulb·event→calendar·shield_person→shield-user·expand_less/more→chevron-up/down·notifications_active→bell-ring·notifications→bell·error→circle-x·remove_circle_outline→circle-minus·feedback→message-square-text·task_alt→circle-check-big·key→key·mail→mail·link→link. news-photo-manager=Material 0(이모지만)→무수정. compose page.tsx=아이콘0·자체 root div 없음→무수정. .ico 래퍼 클래스·fontSize→size·color 인라인 1:1 이관. 기능/문구/server action/패칭 변경0. 2A·2B·Phase1·toss-admin.css·admin-toss·tournaments·schema 변경0. tsc EXIT0. 미커밋 |
| 2026-06-21 | Toss Phase 2 Batch 2B 6화면 리스킨 (developer) | ✅ partners·plans·campaigns·notifications·analytics·game-reports 6 page.tsx만 M(2A·Phase1·toss-admin.css·admin-toss·tournaments·schema 변경0). data-skin="toss"=6 page 루트 div. Material→lucide(<Icon> 키트) 잔존0(grep). lucide 33종 실존 검증(빈span폴백0). 표 외 추가분 0(전부 명세 표대로). notifications bell 미리보기=래퍼 span에 원형bg/정렬 보존+Icon 색상. tsc EXIT0 |
| 2026-06-21 | Track B-1 admin_categories 테이블+4행 시드 (developer) | ✅ schema 모델 추가(BigInt PK·name@unique)·**broad db push 중단**(live_scoreboards FK DROP 드리프트 섞임)→targeted `db execute` CREATE TABLE만 무중단 적용·raw SQL upsert 4행(일반부/유청소년/유U8~U18/대학부/시니어+40~+70)·실측 count=4·JSON정확·tsc0. ⚠️prisma generate 개발서버(3001 PID78724) 락으로 미완→후속 전 재시작 필요. 임시스크립트 정리. 미커밋 |
| 2026-06-21 | Toss Phase 2 Batch 2A 8화면 리스킨 (developer) | ✅ 12파일(page8+content3+admin-stat-card). data-skin=8 page루트 div만(content는 DOM상속). Material→lucide(<Icon> 키트) 잔존0: list_alt→list-checks·emoji_events→trophy·sports_basketball→volleyball(농구부재)·group/groups→users·add_circle→circle-plus·currency_exchange→arrow-left-right·add_location_alt→map-pin-plus·edit_note→file-pen·shield_person→shield-user·swap_horiz→arrow-left-right·delete→trash-2·check_circle→circle-check·arrow_forward→arrow-right·trending_flat→move-right. admin-stat-card(대시보드 전용 공유) 내부 교체 안전. 기능라인 변경0(prisma/fetch/action/href grep0)·tsc0·toss-admin.css/admin-toss/Phase1 변경0. 미보강0 |
| 2026-06-21 | Track B §0 스키마 대조 (planner, 읽기전용·코드/스키마 무변경) | ✅ 계약 "신규5건"→**진짜신규=admin_categories 1건뿐**. DivisionRule format/settings/feeKrw·TTP·brackets(=TournamentMatch통합)·is_waiting(=waiting_number+status"waiting")·tournament_recorders(대회풀) 전부 기존存→중복생성 금지(파손위험). PM결정5건 권고(cap=div_caps유지/경기별기록자 settings jsonb옵션/시드 사용자대조/최소인원·게스트 토글off/format_presets 보류). status매핑 확정(WAITING=status"waiting"·payment default=unpaid). 계약 §3·uuid PK·status값집합 mybdr 불일치 적시 |

## 기획설계 (planner-architect)

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

## 리뷰 결과 (reviewer)
(완료분은 작업 로그로 압축 — 신규 작업 시 기록)

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
