# 작업 스크래치패드

> 2026-06-27 정리: 262KB→압축. 과거 세션 상세(기획설계/리뷰/구현/테스트 섹션)는 작업 로그로 요약·제거. 상세 이력은 git log + knowledge/ 참조.

## 현재 작업
- **요청**: 관리자 영역 Toss 시안 박제 (admin-toss v2.41 정본). 단계 PR(PR-0~PR-5).
- **기준 패키지**: `Dev/design/BDR v2.41-admin-toss/` + 계약문서 `_PR0-CONTRACT-CONFIRMED.md`(PR-1~5 단일 참조점).
- **상태**: ✅ **PR-0 완료(계약 확정·코드0·커밋 93b90ef)**. 다음 = **PR-1 공유 기반**(toss.css→components/admin-toss→admin-shell/admin-blocks·관리자 Material Symbols 제거·lucide).
- **운영**: 단독 운영(dev 직접 작업·subin 폐지). dev→main 머지=수빈 단독.

### 📋 admin-toss 단계 PR 계획
| PR | 내용 | 상태 |
|----|------|------|
| PR-0 | 패키지 배치 + §1치환 + §5스키마실측 + §6결정 | ✅ 93b90ef |
| PR-1 | 공유 기반: toss.css→admin-toss 키트→admin-shell/blocks | ⏭️ 다음 |
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

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-27 | **기록 모드 인증 뱃지 + 전자기록지 측정불가 항목 통계 제외 (3단계·developer×2·13파일·커밋 bbdaa72·미푸시)** | ✅ **tsc0·vitest 1153/1153**. ①`RecordingModeBadge` 신규(flutter=골드 'BDR full'/paper=실버 'BDR'/manual·기타 미표시·hex인라인=SiteOperatorBadge 정책·Material Symbols·radius4). ②**데이터레이어**(match-stat-aggregate·player-records·tournaments/teams records route): paper 매치 슈팅 시도(fga/tpa/fta)·성공률·+/- 를 **measured_games 분모로 비-paper만 집계**(made/리바운드/AST 유지·풀 전체 paper면 null·`getRecordingMode==="paper"` 판정), `recording_mode`/`default_recording_mode`/`paper_games`/`measured_games` 전파. ③**표시레이어** 뱃지 5곳(hero-scoreboard md·player-records-tab·tournament-records-tab 메타+로그·team-records-tab 경기/대회·recent-tab-v2)+통산 FG%/3P% **flutter-only**(users/[id]/page·profile/basketball·stats-detail-modal paperOnlyMinAgg 슈팅4필드). 라이브 박스스코어 기존 isPaperMatch hide 유지. || 2026-06-27 | **admin-toss PR-0 계약 확정** | ✅ 정본 패키지 배치(구버전 _archive 격리)·§1치환표·§5 스키마 실측 9건(전면신규=tournament_expense 1건·#5 teams 기존 바인딩만)·§6 결정. `_PR0-CONTRACT-CONFIRMED.md` 박제. 코드0. 커밋 93b90ef. |
| 2026-06-27 | **유스챌린지 2차 대회생성+순위전 자동배정+선수입력 (운영 DB)** | ✅ tournamentId=2b93e9bf…. Tournament(U11 round_robin·U12 group_stage_with_ranking)+Team6+TournamentTeam10+Match15. 순위전 자동배정 보정(category=division_code·home/away NULL 유지=advanceDivisionPlaceholders 자동박제). U11 4팀 33명 선수입력(auto_registered). 임시스크립트 정리·코드0. |
| 2026-06-23 | **v2.40 A5 캠페인 생성 보강** | ✅ `/admin/campaigns` 생성 모달+`POST /api/admin/campaigns`(ad_campaigns+ad_placements) 신설. 나머지 생성플로우는 기존 폼 재사용. tsc0. |
| 2026-06-23 | **v2.40 A4-2 단체·대회 상세 읽기요약** | ✅ 신규 상세라우트 `/admin/organizations/[id]`·`/admin/tournaments/[id]`(조직 요약·대회 4탭). read-only. tsc0. |
| 2026-06-23 | **v2.40 A4-1 드릴다운 상세 4종(user·team·court·game)** | ✅ 신규 상세라우트 4개+detail-kit. Prisma SELECT read-only·서버액션/write/schema/api 0변경. tsc0. |
| 2026-06-23 | **v2.40 A3-4 시스템5 키트(analytics·categories·notifications·logs·settings)** | ✅ 5파일. PageHead/StatRow/Panel/StatusBadge·조회/액션/CRUD 보존. tsc0. |
| 2026-06-23 | **v2.40 A3-3 비즈니스4 키트(payments·plans·campaigns·partners)** | ✅ 5파일. 환불·CRUD·승인/반려 fetch·폼/모달 보존. tsc0. |
| 2026-06-23 | **v2.40 A3-2 키트(suggestions·game-reports·users·community·season-awards) + tester/reviewer 병렬** | ✅ 통과·차단0. 목록/툴바/StatRow만 키트화·상세모달/차트/큐 보존. 데이터/액션/라우트/snake/schema/api 0변경. CSS 토큰 교정(--line/--surface 부재→--border/--card). tsc0. |
| 2026-06-22 | **v2.40 A3-1 키트(tournaments·games·teams·organizations·courts) + tester/reviewer 병렬** | ✅ 통과·차단0. AdminStatusTabs→Toolbar·table→DataTable·모달→Drawer. 삭제 이름게이트/신청현황/3탭 복잡동작 보존. git=해당 화면만. tsc0. |
