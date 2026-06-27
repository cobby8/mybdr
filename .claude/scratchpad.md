# 작업 스크래치패드

> 2026-06-27 정리: 262KB→압축. 과거 세션 상세(기획설계/리뷰/구현/테스트 섹션)는 작업 로그로 요약·제거. 상세 이력은 git log + knowledge/ 참조.

## 현재 작업
- **요청**: 관리자 영역 Toss 시안 박제 (admin-toss v2.41 정본). 단계 PR(PR-0~PR-5).
- **기준 패키지**: `Dev/design/BDR v2.41-admin-toss/` + 계약문서 `_PR0-CONTRACT-CONFIRMED.md`(PR-1~5 단일 참조점).
- **상태**: PR-0✅ → **PR-1 셸 마이그레이션 완료**(배치1 데스크톱 8a2dd89·배치1.5 계정→사이드바 a0276a1·배치2 모바일 fb0f943). 잔여=배치3 st-* 상태모듈(선택). **⚠️ 전 배치 육안 미확인**(수빈 프리뷰 검증 필요·로컬 dev 깨짐).
- **🔄 v2.45 재베이스라이닝(2026-06-27)**: 새 zip `BDR v2 (45)` → 정본 교체(design_handoff_admin → `Dev/design/BDR v2.41-admin-toss/`, 직전본 `_archive/...-pre45/`). **START-HERE·IMPLEMENTATION-PROMPT·screenshots 17장(시각 정본) 반입** → §1 치환표 폐기. 폐기 38팀 site-* 제거. 정본 교체 커밋 = design(sync). 계약문서 §v2.45 갱신.
- **★계정 배치 확정**: 정본=계정 **사이드바 푸터 UserChip**(데스크톱 topbar 없음). 사용자 "사이드 패널 유지"=계정을 사이드에. 배치1.5=ad-topbar 계정 제거+UserChip 푸터 이전(로그아웃 보존 필수).
- **배치2 모바일(900px)·배치3 st-* 상태모듈 = 후속**. (v2.42 신규: 8상태 QA·preview 6 검수하네스·공개사이트 44팀 통일→PR-5)
- **⚠️ 육안 확인**: 로컬 dev(3001)=Turbopack DLL 500 환경이슈 / 프리뷰=미로그인(PM 불가). **이제 screenshots 17장이 시각 정합 기준**(developer가 PNG 대조). 실렌더 확인은 수빈이 프리뷰 로그인으로.
- **운영**: 단독 운영(dev 직접 작업·subin 폐지). dev→main 머지=수빈 단독.

### 📋 admin-toss 단계 PR 계획
| PR | 내용 | 상태 |
|----|------|------|
| PR-0 | 패키지 배치 + §1치환 + §5스키마실측 + §6결정 | ✅ 93b90ef |
| PR-1 | 셸 ts-shell 통일. 배치1 데스크톱✅(8a2dd89)·배치1.5 계정→사이드바✅(a0276a1)·배치2 모바일✅(fb0f943) / 배치3 st-* 상태모듈=선택 잔여 | ✅ 셸완료 |
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

### PR-1 배치1 — ad-shell → ts-shell 마이그레이션 (파일럿)
📝 `/admin/*` 셸 크롬을 ad-*/Tailwind → 시안 ts-* 클래스로 swap (className만, 로직 0). 셸은 `admin/layout.tsx` 1곳 중앙화 / tournament-admin·partner-admin은 이미 ts라 무관.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/components/admin/admin-shell.tsx` | `ad-shell`→`ts-shell`, `ad-shell--hidden-aside`→`ts-shell--hidden-aside`, `ad-main`→`ts-main`, `ad-main__inner`→`ts-main__inner` | 수정 |
| `src/components/admin/sidebar.tsx` | 컨테이너 Tailwind`fixed w-64…`→`ts-sidebar`, 로고→`ts-sidebar__brand`(BDR 로고 Image 보존), nav→`ts-sidebar__nav overflow-y-auto`, 그룹헤더 `aside__title`→`ts-sidebar__label`, 링크3곳 `aside__link`→`ts-navlink`(메뉴·마이페이지·복귀), 푸터→`ts-sidebar__foot` | 수정 |

**보존 확인(회귀 0)**: `navStructure`(A1 IA 1독립+4그룹+외부관리) 항목 추가/삭제/이동 0 · `filterStructureByRoles`/`filterItemByRoles`(권한)·`children` 재귀 들여쓰기·`hrefByRole`·`data-active` active 로직·푸터(테마·마이페이지·복귀) 전부 그대로. git diff = className+주석 라인만(로직 토큰 0 변경).

**검증**: `npx tsc --noEmit --incremental false` = **EXIT 0**. 정적: 2파일 className 잔존 `ad-shell/ad-main/aside__link/aside__title` = 0(단 ⚠️아래 ad-topbar 예외) / swap한 ts-shell·ts-main·ts-sidebar·ts-navlink·ts-sidebar__label·ts-sidebar__foot·ts-main__inner = toss-admin.css 전부 실존(L245~270).

⚠️ **의도적 예외 / 후속 결정 필요**:
- `admin-shell.tsx` L49 **`ad-topbar` 유지**(미swap). 시안 `ts-topbar`는 `display:none@desktop`(모바일 전용 fixed bar)이라 swap 시 **데스크톱 우상단 UserMenu(계정메뉴)가 사라지는 회귀** 발생(시안은 계정을 ts-sidebar__foot ts-userchip에 둠). 회귀 0 우선 → 이번 배치 미처리. **권고 후속(배치 1.5)**: layout의 topbarRight UserMenu를 ts-sidebar__foot로 이전 후 ts-topbar 정합(layout.tsx 1파일 추가 필요 → 별도 결정).
- `ts-shell--hidden-aside`는 CSS 룰 부재(구 `ad-shell--hidden-aside .ad-main{margin-left:0}` 미대응). 단 hidden variant는 현재 호출처 0(layout=default)이라 무동작·잠재영향 0.
- ⚠️ 시각 미세: `ts-navlink` 내부 `<span>`(icon+label) 래퍼 유지 → ts-navlink gap이 span 1자식에만 적용돼 아이콘/라벨 간격이 다소 좁을 수 있음(구조 보존 우선). PM 육안 확인 후 필요시 후속.

🖥️ **PM 육안확인 필요 라우트(데스크톱 ≥1024px + 모바일 ≤768px)**: `/admin`(대시보드), `/admin/users`(테이블), `/admin/games`(콘텐츠) — 사이드바 렌더·active 상태·그룹헤더·푸터·BDR 로고·데스크톱 UserMenu 표시 / 모바일은 배치2(mobile-admin-nav) 전이라 기존 ad-mobile 유지(정상).

### PR-1 배치1.5 — 계정 우상단 topbar 제거 → 사이드바 푸터 UserChip 이전
📝 정본(v2.45) 데스크톱 topbar 부재 정합. 데스크톱 우상단 UserMenu 제거 + 계정을 ts-sidebar__foot UserChip 으로 이전. **로그아웃 보존(기능 손실 0)**.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(admin)/admin/layout.tsx` | `topbarRight={<UserMenu/>}` 배선 + UserMenu import 제거(user prop 전달 유지) | 수정 |
| `src/components/admin/admin-shell.tsx` | 데스크톱 `ad-topbar` div 제거 + `topbarLeft/topbarRight` props 제거 + `<AdminSidebar user={user}/>` 전달 | 수정 |
| `src/components/admin/sidebar.tsx` | 푸터 **UserChip 신설**(ts-userchip/ts-avatar 아바타+이름+역할+chevron-right→/admin/me) + **LogoutButton 추가**(로그아웃 보존) + getInitial/getRoleLabel + user prop | 수정 |

**로그아웃 보존**: 제거된 UserMenu 로그아웃을 LogoutButton(drawer-card) 재사용으로 푸터 박제 — `POST /api/web/logout`+full reload 로직 무변경. 마이페이지(/admin/me)·사이트복귀(/)·로그아웃·계정진입 **전부 접근 가능**.
**보존(회귀 0)**: navStructure/filter/children 재귀/active 0변경(nav 토큰 20 동일). user 미전달 시 UserChip·로그아웃 미렌더(폴백).
**검증**: tsc **EXIT 0**. 정적: admin-shell.tsx ad-topbar/topbarRight 코드 잔존 0(주석만)·layout UserMenu 코드 잔존 0(주석만)·sidebar ts-userchip(CSS L258)·ts-avatar(L260)·LogoutButton·chevron-right 실존.
⚠️ **모바일 interim(배치2 해소)**: ad-topbar div 제거가 모바일에도 영향 — ts-main 모바일 `padding-top:56px`(ts-topbar 전제)라 현재 모바일 상단 56px 빈공간+플로팅 햄버거만. 배치2(mobile-admin-nav→ts-topbar/ts-drawer)에서 정합. AdminMobileNav 미변경.
ℹ️ `user-menu.tsx` 이제 미import(고아)지만 빌드 무해 — 삭제는 별도(범위 외).
🖥️ **PM 육안확인(배치1.5)**: 데스크톱 `/admin` 우상단 계정 **없음**(정본 정합) + 사이드바 푸터 UserChip(아바타+이름+역할)·로그아웃·클릭 동작 확인.

### PR-1 배치2 — 모바일 정합 (ad-mobile-* → ts-topbar/ts-drawer)
📝 배치1.5에서 데스크톱 topbar 제거로 어중간해진 모바일(상단 56px 빈공간+플로팅 햄버거)을 정본 ts-topbar/ts-drawer로 정합. **1파일 변경**(admin-shell은 배치1.5에서 이미 `user` 전달 → 추가 배선 불필요).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/components/admin/mobile-admin-nav.tsx` | ① **ts-topbar 신설**(햄버거 ts-mtoggle + 활성탭 제목 getActiveTitle) → ts-main 모바일 padding-top:56px 채움 ② 드로어 swap `ad-mobile-toggle/overlay/drawer/__*`·`ad-side-link/title`→`ts-overlay`/`ts-drawer`+인라인 head/`ts-sidebar__nav`/`ts-sidebar__foot`·`ts-navlink`/`ts-sidebar__label` ③ **드로어 푸터=데스크톱 사이드바 푸터 동등**: UserChip(ts-userchip/ts-avatar+역할)+테마+마이페이지+사이트복귀+로그아웃 | 수정 |

**기능 손실 0(모바일 유일 경로)**: LogoutButton(drawer-card, onBeforeLogout=close) 재사용=로그아웃 보존 / UserChip·마이페이지→/admin/me / 사이트복귀→/ / 테마 AdminThemeSwitch. 드로어 head=브랜드(로고)+닫기, 정체성은 푸터 UserChip 이전(정본 패턴).
**보존(회귀 0)**: filterStructureByRoles/renderMobileItem/children 재귀/getTournamentMobileStructure/active 0변경(className+자식 들여쓰기 inline화만). 자식 들여쓰기 data-child(ts-navlink CSS 부재)→inline paddingLeft:28(데스크톱 sidebar 동일).
**검증**: tsc **EXIT 0**. 정적: `ad-mobile-*`/`ad-side-*` 잔존 **0** / ts-topbar·ts-mtoggle·ts-overlay·ts-drawer·ts-navlink·ts-userchip·ts-avatar·ts-sidebar__nav/__label/__foot/__brand 전부 toss-admin.css 실존(임의 CSS 0). ⚠️`ts-drawer__head/__body/__foot`는 CSS 부재 → 정본 jsx대로 인라인 head+ts-sidebar__nav/__foot 사용.
🖥️ **PM 육안확인(배치2·모바일 ≤900px)**: 상단 ts-topbar(햄버거+페이지 제목)·56px 빈공간 해소 / 햄버거→드로어 슬라이드 / 드로어 푸터 UserChip·로그아웃·테마·마이페이지·복귀 동작 / 데스크톱(≥900px) ts-topbar 숨김·배치1.5 사이드바 유지(회귀 0).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
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
