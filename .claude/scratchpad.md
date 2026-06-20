# 작업 스크래치패드

## 현재 작업
- **요청**: 관리자 Toss 디자인시스템 전환 (Phase 0~4). 시안=`Dev/design/BDR-current/_handoff-admin-toss-P0/`
- **상태**: Phase 0/1/3 PR-A 완료(origin/dev 머지 #725·#726). **동시 2세션 운영 중** — 아래 세션별 블록(🅰️/🅱️) 참조.

> ⚠️ **세션 충돌 방지 규약 (2026-06-21, 사용자 결정 — 옵션3)**: 메인 worktree에서 2세션 동시 작업. ①각 세션은 **자기 블록(🅰️/🅱️)만 수정**, 상대 블록·공용 섹션(§0 대조표/완료Phase) 미수정. ②작업 로그는 **append만**(기존 줄 덮어쓰기 금지). ③코드는 **각자 영역 디렉토리만** 명시적 `git add <경로>`(전체 `git add .` 금지) → 커밋 격리. ④두 영역은 디렉토리 비중첩(A=admin 비대회 / B=tournaments+schema)이라 working tree 충돌 0.

### 🅰️ 세션 A — Phase 3 referee 리스킨 (이 세션)
- **코드 영역**: `src/app/(referee)/referee/*` (회원 + referee-admin). admin/* 비대회는 Phase2 완료·미접촉. tournaments/*·schema는 세션 B 소관.
- **상태**: Phase 2 백오피스 17화면 **운영 반영 완료**(PR #728→dev·#729→main·0b268ca). 🔨 **Phase 3 referee 리스킨 착수**(26화면, 범위 스캔 중→배치 계획 예정). 미푸시 0. 방식=Phase1~2 패턴 동일(data-skin opt-in+Material→lucide 키트·기능 1:1·schema0).

### 🅱️ 세션 B — Phase 4 Track B 대회관리 리빌딩 (세션 B가 갱신)
- **코드 영역**: tournaments 리빌딩 + admin_categories schema(게이트). admin/* 비대회 화면·toss-admin.css 미접촉.
- **상태**: §0 대조완료·B-1 admin_categories(테이블+4종시드) 완료·커밋(367c1d8). **PM결정 5건 확정(2026-06-21, 권고안 일괄)**: ①cap=div_caps jsonb유지 ②경기별기록자=TournamentMatch.settings jsonb키 ③시드=완료(BDR-join복원검증) ④최소인원/게스트=토글OFF박제 ⑤format_presets=미도입. **→ 추가 스키마변경 0**. 다음=Phase4 리빌딩 **첫배치=종별마스터 관리화면**(planner 설계중). 충돌검증=referee worktree=.claude메타만. stash@{0}=gallery(무관).
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
| scrim 보낸취소 [id] 버그 | ⏳ developer 재작업 (아래 수정요청) |
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
| scrim-tabs.tsx L295 (critical) | 보낸취소가 URL[id]=from_team 전송→PATCH(to_team 강제) 항상 400. `patchStatus(counterpart.id)` + null가드 필요 | ⏳ developer 재작업 |
| scrim PATCH 가드(minor) | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속 |
| game.ts L44 | game_type=parseInt(영문type)→NaN. 영문↔정수 매핑 필요(기존버그) | 후속 |
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
| 2026-06-21 | Track B 종별 마스터 관리 화면 구현 (developer) | ✅ 신규4파일(API route GET/POST·[id] PATCH/DELETE + page서버 + content클라). super_admin가드·Zod TagArr중복차단·P2002→409 DUPLICATE_NAME·P2025→404. UI=시안1:1 TagInput칩·dirty판정 카드별 1PATCH저장·삭제모달·에러배너. prisma generate 불필요(타입실존). snake정합(sort_order). Toss키트·신규CSS0·하드코딩hex0·data-skin 루트div만. schema0·시드0·세션비중첩. tsc EXIT0. 미커밋 |
| 2026-06-21 | Track B 종별 마스터 관리 화면 설계 (planner, 읽기전용·코드/스키마 무변경) | ✅ 통합위치=신규 라우트 `/admin/categories` 권고(설정탭❌·settings는 use client 2카드라 server조회 못끼움). API 2파일(GET목록/POST/PATCH/DELETE·super_admin가드·Zod TagArr중복차단·P2002→409 DUPLICATE_NAME). UI=page.tsx 서버조회(adminCategory.findMany)+categories-content.tsx 클라(data-skin toss·TagInput 디비전/연령 칩·카드별 저장버튼 권고). 삭제 참조무결성 가드=불필요(FK참조 0건·대회는 category 문자열명만 보유). prisma generate 선행 1순위(미generate 락). snake_case 응답함정·신규 4파일 세션비중첩 명시 |
| 2026-06-21 | Toss Phase 2 Batch 2C(마지막) 3화면 리스킨 (developer) | ✅ 11파일 M(news page+admin-news-content+compose-content / me page+_components 7). data-skin="toss"=3 page 루트(news page div·me page div·compose-content 루트div=page가 래퍼없이 직접렌더). 자식 content/카드는 DOM상속. Material→lucide(<Icon> 키트) 잔존0(grep news+me 트리=0). lucide 39종 실존 검증(빈span폴백0): open_in_new→external-link·arrow_back→arrow-left·edit_note→file-pen·format_bold→bold·format_italic→italic·format_list_bulleted→list·format_quote→quote·image→image·add_photo_alternate→image-plus·send→send·save→save·schedule→clock·visibility→eye·sports_basketball→volleyball(농구부재)·celebration→party-popper·campaign→megaphone·photo→image·hub→share-2·history→history·check_circle→circle-check·edit→pencil·close→x·verified→badge-check·info→info·warning→triangle-alert·tips_and_updates→lightbulb·event→calendar·shield_person→shield-user·expand_less/more→chevron-up/down·notifications_active→bell-ring·notifications→bell·error→circle-x·remove_circle_outline→circle-minus·feedback→message-square-text·task_alt→circle-check-big·key→key·mail→mail·link→link. news-photo-manager=Material 0(이모지만)→무수정. compose page.tsx=아이콘0·자체 root div 없음→무수정. .ico 래퍼 클래스·fontSize→size·color 인라인 1:1 이관. 기능/문구/server action/패칭 변경0. 2A·2B·Phase1·toss-admin.css·admin-toss·tournaments·schema 변경0. tsc EXIT0. 미커밋 |
| 2026-06-21 | Toss Phase 2 Batch 2B 6화면 리스킨 (developer) | ✅ partners·plans·campaigns·notifications·analytics·game-reports 6 page.tsx만 M(2A·Phase1·toss-admin.css·admin-toss·tournaments·schema 변경0). data-skin="toss"=6 page 루트 div. Material→lucide(<Icon> 키트) 잔존0(grep). lucide 33종 실존 검증(빈span폴백0). 표 외 추가분 0(전부 명세 표대로). notifications bell 미리보기=래퍼 span에 원형bg/정렬 보존+Icon 색상. tsc EXIT0 |
| 2026-06-21 | Track B-1 admin_categories 테이블+4행 시드 (developer) | ✅ schema 모델 추가(BigInt PK·name@unique)·**broad db push 중단**(live_scoreboards FK DROP 드리프트 섞임)→targeted `db execute` CREATE TABLE만 무중단 적용·raw SQL upsert 4행(일반부/유청소년/유U8~U18/대학부/시니어+40~+70)·실측 count=4·JSON정확·tsc0. ⚠️prisma generate 개발서버(3001 PID78724) 락으로 미완→후속 전 재시작 필요. 임시스크립트 정리. 미커밋 |
| 2026-06-21 | Toss Phase 2 Batch 2A 8화면 리스킨 (developer) | ✅ 12파일(page8+content3+admin-stat-card). data-skin=8 page루트 div만(content는 DOM상속). Material→lucide(<Icon> 키트) 잔존0: list_alt→list-checks·emoji_events→trophy·sports_basketball→volleyball(농구부재)·group/groups→users·add_circle→circle-plus·currency_exchange→arrow-left-right·add_location_alt→map-pin-plus·edit_note→file-pen·shield_person→shield-user·swap_horiz→arrow-left-right·delete→trash-2·check_circle→circle-check·arrow_forward→arrow-right·trending_flat→move-right. admin-stat-card(대시보드 전용 공유) 내부 교체 안전. 기능라인 변경0(prisma/fetch/action/href grep0)·tsc0·toss-admin.css/admin-toss/Phase1 변경0. 미보강0 |
| 2026-06-21 | Track B §0 스키마 대조 (planner, 읽기전용·코드/스키마 무변경) | ✅ 계약 "신규5건"→**진짜신규=admin_categories 1건뿐**. DivisionRule format/settings/feeKrw·TTP·brackets(=TournamentMatch통합)·is_waiting(=waiting_number+status"waiting")·tournament_recorders(대회풀) 전부 기존存→중복생성 금지(파손위험). PM결정5건 권고(cap=div_caps유지/경기별기록자 settings jsonb옵션/시드 사용자대조/최소인원·게스트 토글off/format_presets 보류). status매핑 확정(WAITING=status"waiting"·payment default=unpaid). 계약 §3·uuid PK·status값집합 mybdr 불일치 적시 |
| 2026-06-21 | Toss Phase 1 AdminShell+5화면 리스킨 (developer→tester→reviewer) | ✅ 13파일·통과(차단0). 토큰 리매핑(globals 베이스토큰→`[data-skin]` 라이트Toss값, admin.css `--color-*` 별칭 자동전파·마크업0변경)·Material→lucide(`<Icon>` 키트)·data-skin=셸크롬+5페이지 루트div만(공유래퍼 미부착 grep0). 기능 회귀0·라이트고정·tsc0·globals/admin.css diff0·partner/referee/(web) 변경0 |
| 2026-06-21 | Toss Phase 3 PR-A partner-admin 재스킨 (developer→tester→reviewer) | ✅ partner-admin/* 5파일(layout·page·venue·campaigns·[id]). 변경 3종(아이콘 lucide·className .ts-*·data-skin). 기능 회귀0(super_admin가드·SWR키·POST/PATCH body·filterTabs·statusConfig·VP2_TABS·isEditable diff0). navy hero→H+StatCard. toss-admin.css 신규규칙0. tsc0 |
| 2026-06-21 | Toss Phase 0 디자인시스템 이식 (developer→tester→reviewer) | ✅ 통과(차단0/후속). toss-admin.css(Toss토큰+.ts-* 전부 `[data-skin="toss"]` opt-in 격리·bare:root 0)·layout import1줄·admin-toss/(kit.tsx·data.tsx·index.ts). CDN createIcons 제거→lucide-react import. data-skin JSX 실적용0(Phase0 시각변화0). 보완: L237 잔여 `</invoke>` 삭제·a11y 기반박제·ICON_ALIAS(thunderdunk→Zap). schema0·프론트0 |
| 2026-06-19 | 매칭 M6(최종) 호스트콘솔 (developer→reviewer) | ✅ 통과(차단0). ①데드코드 삭제 ②host-applications 2→3구획(대기승인/확정/대기열 순번배지+승격=confirm POST 재사용) ③MyGames waiting탭+HostGameCard(현황칩+빠른액션·취소=DELETE 재사용). groupBy 1회 N+1회피. 보완: 수동 마감확정 API(/close status1→2)·취소알림 status[0,1,3]. schema0·신규route(close만)·tsc0 |
| 2026-06-19 | 매칭 M5 찾기UX 정렬·빠른필터·빈상태(시안A) (developer→reviewer) | ✅ 통과(차단0). sortOptions(soon/filling/latest, 가까운순=좌표0이라 제외)·chipOptions(today/weekend/filling/free+near는 로그인&preferred_regions時)·SortMenu(드롭다운↔시트)·빈상태 CTA. 기존 KindTab/FilterChipBar/clientFilters 별개레이어 AND 보존. take60 전체로드 메모리정렬. tsc0·schema0 |

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

## 구현 기록 (developer)

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
