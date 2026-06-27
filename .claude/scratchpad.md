# 작업 스크래치패드

> 2026-06-27 정리: 262KB→압축. 과거 세션 상세(기획설계/리뷰/구현/테스트 섹션)는 작업 로그로 요약·제거. 상세 이력은 git log + knowledge/ 참조.

## 현재 작업
- **요청**: 관리자 영역 Toss 시안 박제 (admin-toss v2.41 정본). 단계 PR(PR-0~PR-5).
- **기준 패키지**: `Dev/design/BDR v2.41-admin-toss/` + 계약문서 `_PR0-CONTRACT-CONFIRMED.md`(PR-1~5 단일 참조점).
- **상태**: PR-0✅ → **PR-1 ✅완료**(셸 마이그레이션 합격 + 배치3 st-* 상태모듈 7a385f4). 코워크 육안 검증 합격(회귀0). **다음 = PR-2 대회 운영 워크스페이스**(착수 전 계획/분석 필요).
- **🔄 v2.45 재베이스라이닝(2026-06-27)**: 새 zip `BDR v2 (45)` → 정본 교체(design_handoff_admin → `Dev/design/BDR v2.41-admin-toss/`, 직전본 `_archive/...-pre45/`). **START-HERE·IMPLEMENTATION-PROMPT·screenshots 17장(시각 정본) 반입** → §1 치환표 폐기. 폐기 38팀 site-* 제거. 정본 교체 커밋 = design(sync). 계약문서 §v2.45 갱신.
- **★계정 배치 확정**: 정본=계정 **사이드바 푸터 UserChip**(데스크톱 topbar 없음). 사용자 "사이드 패널 유지"=계정을 사이드에. 배치1.5=ad-topbar 계정 제거+UserChip 푸터 이전(로그아웃 보존 필수).
- **배치2 모바일(900px)·배치3 st-* 상태모듈 = 후속**. (v2.42 신규: 8상태 QA·preview 6 검수하네스·공개사이트 44팀 통일→PR-5)
- **육안 확인(해소)**: 로컬 dev(3001 PID12460) 실제 정상(/=200·/admin=307·/login=200) — 직전 "500"은 자동화 브라우저 프레임 문제+인증리다이렉트 오인이었음. PM 자동화 브라우저(Browser1)는 미로그인+창 비가시라 캡처 불가 → **코워크에서 검증**(전달 프롬프트 `Dev/design/prompts/admin-toss-PR1-shell-verify-cowork-2026-06-27.md`). 결과 합격. 시각 기준=screenshots 17장.
- **운영**: 단독 운영(dev 직접 작업·subin 폐지). dev→main 머지=수빈 단독.

### 📋 admin-toss 단계 PR 계획
| PR | 내용 | 상태 |
|----|------|------|
| PR-0 | 패키지 배치 + §1치환 + §5스키마실측 + §6결정 | ✅ 93b90ef |
| PR-1 | 셸 ts-shell 통일(배치1 8a2dd89·1.5 a0276a1·2 fb0f943·코워크 합격) + 배치3 st-* 상태모듈 Banner/Spinner(7a385f4) | ✅ 완료 |
| PR-2 | 대회 운영 워크스페이스(operate 6메뉴+7패널)→/tournament-admin/tournaments/[id] | 대기 |
| PR-3 | 생성/수정 5단계 마법사(6-1: 단일화+prospectus/assoc 보존) | 대기 |
| PR-4 | 셸별 콘솔(대회관리자/백오피스18/협력/심판) + 6-2 /admin/tournaments 목록 제거 | 대기 |
| PR-5 | 공개 사이트(44팀/27경기 통일본) | 대기 |

**§6 결정(2026-06-27)**: 6-1 = 5단계 단일진입 + prospectus/association 코드 보존 / 6-2 = `/admin/tournaments` 목록 **완전 제거**(상세 [id] audit-log·transfer-organizer 유지).
**§5 핵심**: 전면신규=`tournament_expense` 1건뿐. #5 teams(coach_token=apply_token·로스터=TournamentTeamPlayer) 전부 기존→**바인딩만**. 나머지 NULL허용 무중단 ADD/JSON 확장.

## 진행 현황표 (대기/후속만)
| 작업 | 상태 |
|------|------|
| gallery P2 (news_photo 실연결) | ⏸️ `stash@{0}` 보관. 복원 시 `git stash pop` |
| 버킷B 관리자 잔여(시상/코치/갤러리/심판/샵/쪽지) | ⏸️ 결정 대기 `mock-data-absent-admin-plan-2026-06-14.md` |
| 대회상태 Phase2/3 후속 | ⏸️ 일부 백필 완료, 잔여 대기 |

## 보류 중 (재개 대기)
- **버킷 B 관리자 계획** — 데이터부재 7기능 신규테이블. 결정 5건 대기.
- **디자인 일관성 QA 패스** — Claude.ai 산출(bake-fix-checklist) 대기.
- **7f28 #301 결선 슬롯** — "결승" 오생성 슬롯 잔존. 예선 #291(OT1 동점 미종료)·#292(미기록) 대기.
- **KO Sprint2 (group_cross 자동등록)** — Sprint1로 사고 영구차단됨(편의 기능).
- **IA1 발행 알림 실발송** — createNotification 연동(현재 UI 체크박스만).

## 수정 요청 (미해결 minor·동작영향 경미·전부 비차단)
| 대상 | 문제 | 상태 |
|------|------|------|
| scrim PATCH 가드 | 수락/거절 captain only(vice/manager 없음)→isCaptain 헬퍼 통일 검토 | 후속 |
| apply-panel.tsx L510/L536 | 승인/거절 배지 raw rgba 하드코딩(룰10 경미)→color-mix 교체 권장·시각영향0 | 후속 |
| tournament-completed-bracket.tsx L274 | 조내 정렬 승수만(gnba 미세순위차) | 후속 |
| stats / lineup minor | server/client 마크업 중복·C버튼 a11y·badge라벨 | 후속 |
> 직전 🔴차단(F-2b div_schedule snake 재귀변환·F-2a sponsors 500·join 대표자 차단)은 **전부 ✅해결**(2026-06-22, git log 참조).

## 🔒 §0 공통 필드 대조표 (픽업/매칭 도메인 — 전 Phase 공통 reference)
- 시간 `scheduled_at` / 길이 `duration_hours`(분아님) / 정원 `max_participants` / 승인참가수 `current_participants` / 참가비 `fee_per_person`(0=무료)
- 좌표=games에 없음→courts 조인 필요. 신청테이블 `game_applications` / 신청 status **Int** 0=신청완료·1=승인·2=거절·3=대기(M2)
- **game status**(`game-status.ts`): 1=모집중·2=확정·3=완료·4=취소 / game_type **Int**: 0픽업·1게스트·2연습경기
- 출석=`game_applications.attended_at` / 노쇼=`game_player_ratings.is_noshow` / 매너=`users.manner_score`+`manner_count`(등급 라벨만 노출)
- M2 컬럼: `waitlist_position`INT NULL / `promotion_deadline`TIMESTAMPTZ NULL
> 대회(tournament) 도메인 필드 대조는 `Dev/design/BDR v2.41-admin-toss/_PR0-CONTRACT-CONFIRMED.md §5` 참조.

## 구현 기록 (developer)

> **PR-1(완료) 상세는 git + 작업 로그 참조.** 배치1 셸/사이드바 ts-shell swap(8a2dd89)·1.5 계정→사이드바 푸터 UserChip+로그아웃(a0276a1)·2 모바일 ts-topbar/ts-drawer(fb0f943)·3 상태모듈 Banner/Spinner 신설(7a385f4). 전부 tsc0·회귀0·코워크 합격.
> **PR-1 재사용 자산(PR-2가 활용)**: 셸=ts-shell/ts-sidebar/ts-navlink·계정=ts-userchip+LogoutButton·모바일=ts-topbar/ts-drawer·상태=admin-toss/kit.tsx(Skel/SkelTable/ErrState/PermState/Modal/Empty/Banner/Spinner)·토스트=ts-toast. st-mcard(모바일 카드)는 미박제→PR-2 필요 시 신설.
> PR-2 착수 시 이 섹션에 신규 구현 기록.

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-27 | **admin-toss PR-1 배치3 — st-* 상태 공유모듈 (PR-1 완료)** | ✅ 정본 admin-state.jsx 대조: Skel/SkelTable/ErrState/PermState/Modal/Empty + st-* CSS 전부 기존재(v2.42) → **Banner/Spinner 2개만 신설·신규 CSS 0**. st-toast=ts-toast 재사용·데모하네스 미박제. 소비처 미배선(PR-2 인프라). tsc EXIT0. 7a385f4. **PR-1 전 배치 완료**. |
| 2026-06-27 | **admin-toss PR-1 셸 마이그레이션 육안 검증 (코워크)** | ✅ **합격·회귀 0** (데스크톱+모바일+극단 narrow). 정본 정합: 우상단 계정 없음·사이드바 푸터 UserChip/로그아웃·모바일 햄버거+제목/드로어. 오탐 정리: 플로팅 N버튼=외부 확장(Gemini) 위젯·앱 무관 / 사이드바 그룹 라벨 정본과 차이=의도된 A1 IA 보존(§5). 전달 프롬프트 `Dev/design/prompts/admin-toss-PR1-shell-verify-cowork-2026-06-27.md`. 로컬 dev(3001)는 실제 정상이었음(직전 500은 자동화 브라우저 오인). |
| 2026-06-27 | **admin-toss 정본 v2.45 교체 + PR-1 배치1.5·배치2 (재베이스라이닝)** | ✅ 새 zip(45)→정본 교체(screenshots 17장·START-HERE 반입, 38팀 site-* 폐기, §1 치환표 폐기). 배치1.5 계정 topbar→사이드바 푸터 UserChip 이전(로그아웃 보존·a0276a1). 배치2 모바일 ad-mobile→ts-topbar/ts-drawer(56px 빈공간 해소·드로어 계정/로그아웃 동등·fb0f943). 전부 tsc EXIT0·nav 로직 0변경·임의 CSS 0. **PR-1 셸 마이그레이션 완료**(육안 미확인). user-menu.tsx 고아(별도 정리). |
| 2026-06-27 | **admin-toss PR-1 배치1 — ad-shell→ts-shell 데스크톱 셸/사이드바 (developer)** | ✅ 2파일 className swap(admin-shell·sidebar). navStructure(A1 IA)·권한필터·children 재귀·푸터 로직 100% 보존. tsc EXIT0·swap 클래스 toss-admin.css 실존·partner-admin 운영증명. ad-topbar 1건 의도보류(데스크톱 UserMenu 보존=배치1.5). 커밋 8a2dd89(공유 push). **육안 미확인**(로컬 Turbopack DLL 500·프리뷰 미로그인). 배치1.5/2 = 사이드패널 유지 결정·시안 재생성 대기로 보류. |
| 2026-06-27 | **기록 모드 인증 뱃지 + 전자기록지 측정불가 항목 통계 제외 (3단계·developer×2·13파일·커밋 bbdaa72·미푸시)** | ✅ **tsc0·vitest 1153/1153**. ①`RecordingModeBadge` 신규(flutter=골드 'BDR full'/paper=실버 'BDR'/manual·기타 미표시·hex인라인=SiteOperatorBadge 정책·Material Symbols·radius4). ②**데이터레이어**(match-stat-aggregate·player-records·tournaments/teams records route): paper 매치 슈팅 시도(fga/tpa/fta)·성공률·+/- 를 **measured_games 분모로 비-paper만 집계**(made/리바운드/AST 유지·풀 전체 paper면 null·`getRecordingMode==="paper"` 판정), `recording_mode`/`default_recording_mode`/`paper_games`/`measured_games` 전파. ③**표시레이어** 뱃지 5곳(hero-scoreboard md·player-records-tab·tournament-records-tab 메타+로그·team-records-tab 경기/대회·recent-tab-v2)+통산 FG%/3P% **flutter-only**(users/[id]/page·profile/basketball·stats-detail-modal paperOnlyMinAgg 슈팅4필드). 라이브 박스스코어 기존 isPaperMatch hide 유지. || 2026-06-27 | **admin-toss PR-0 계약 확정** | ✅ 정본 패키지 배치(구버전 _archive 격리)·§1치환표·§5 스키마 실측 9건(전면신규=tournament_expense 1건·#5 teams 기존 바인딩만)·§6 결정. `_PR0-CONTRACT-CONFIRMED.md` 박제. 코드0. 커밋 93b90ef. |
| 2026-06-27 | **유스챌린지 2차 대회생성+순위전 자동배정+선수입력 (운영 DB)** | ✅ tournamentId=2b93e9bf…. Tournament(U11 round_robin·U12 group_stage_with_ranking)+Team6+TournamentTeam10+Match15. 순위전 자동배정 보정(category=division_code·home/away NULL 유지=advanceDivisionPlaceholders 자동박제). U11 4팀 33명 선수입력(auto_registered). 임시스크립트 정리·코드0. |
| 2026-06-23 | **v2.40 A5 캠페인 생성 보강** | ✅ `/admin/campaigns` 생성 모달+`POST /api/admin/campaigns`(ad_campaigns+ad_placements) 신설. 나머지 생성플로우는 기존 폼 재사용. tsc0. |
| 2026-06-23 | **v2.40 A4-2 단체·대회 상세 읽기요약** | ✅ 신규 상세라우트 `/admin/organizations/[id]`·`/admin/tournaments/[id]`(조직 요약·대회 4탭). read-only. tsc0. |
| 2026-06-23 | **v2.40 A4-1 드릴다운 상세 4종(user·team·court·game)** | ✅ 신규 상세라우트 4개+detail-kit. Prisma SELECT read-only·서버액션/write/schema/api 0변경. tsc0. |
| 2026-06-23 | **v2.40 A3-4 시스템5 키트(analytics·categories·notifications·logs·settings)** | ✅ 5파일. PageHead/StatRow/Panel/StatusBadge·조회/액션/CRUD 보존. tsc0. |
| 2026-06-23 | **v2.40 A3-3 비즈니스4 키트(payments·plans·campaigns·partners)** | ✅ 5파일. 환불·CRUD·승인/반려 fetch·폼/모달 보존. tsc0. |
| 2026-06-23 | **v2.40 A3-2 키트(suggestions·game-reports·users·community·season-awards) + tester/reviewer 병렬** | ✅ 통과·차단0. 목록/툴바/StatRow만 키트화·상세모달/차트/큐 보존. 데이터/액션/라우트/snake/schema/api 0변경. CSS 토큰 교정(--line/--surface 부재→--border/--card). tsc0. |
| 2026-06-22 | **v2.40 A3-1 키트(tournaments·games·teams·organizations·courts) + tester/reviewer 병렬** | ✅ 통과·차단0. AdminStatusTabs→Toolbar·table→DataTable·모달→Drawer. 삭제 이름게이트/신청현황/3탭 복잡동작 보존. git=해당 화면만. tsc0. |
