# 작업 스크래치패드

> 2026-06-27 정리: 262KB→압축. 과거 세션 상세(기획설계/리뷰/구현/테스트 섹션)는 작업 로그로 요약·제거. 상세 이력은 git log + knowledge/ 참조.

## 현재 작업
- **요청**: 관리자 영역 Toss 시안 박제 (admin-toss v2.41 정본). 단계 PR(PR-0~PR-5).
- **기준 패키지**: `Dev/design/BDR v2.41-admin-toss/` + 계약문서 `_PR0-CONTRACT-CONFIRMED.md`(PR-1~5 단일 참조점).
- **상태**: PR-0✅·PR-1✅·PR-2✅완료(전부 dev push·7daba99). **dev→main 릴리스 PR #773 생성·열림**(23커밋). 사용자 결정=**프리뷰 검토 후 수빈이 머지**(지금 머지 안 함). `tournament_expenses` 운영 DB 이미 반영→main 배포 시 마이그0. 머지 후 다음=PR-3(생성/수정 마법사).
- **🔎 프리뷰 검토 대기(수빈)**: PR-2 기능 런타임 확인 — 운영관리(공지 저장·series 칩)·일정(휴식)·정산(지출 추가/잔액). 이상없으면 PR #773 머지.
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
| PR-2 | 대회 운영. 시각박제 완료(전 패널 정합·0줄) + 기능4건 완료: 공지(e1a98e2)·series칩(31cdd79)·일정휴식(cabbef4)·지출 신규테이블(db push 완료). 런타임검증=프리뷰 | ✅ 완료 |
| PR-3 | 생성/수정 마법사. 수정=이미 정합(TournamentWorkspace). 실작업: 3-A 입구단일화(파일럿)·3-B SUBTABS제거·3-C 생성폼 5단계스텝화(결정필요)·3-D 수정 미세정합. 마이그0 | 🔄 진행 |
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

## 수정 요청
| 대상 | 문제 | 상태 |
|------|------|------|
| 🔴→✅ **빌드 실패**(expenses Zod) | `next build` 타입체크가 Zod3 `z.number({invalid_type_error})` reject(이 프로젝트 Zod4.3.6) → **PR-2 전체 프리뷰 미배포**(7daba99·715f7b2 ERROR). **이게 휴식/지출 "안보임" 진짜 원인**. ✅해결: 옵션 제거(프로젝트 패턴 `z.number().int().min()`). tsc EXIT0 |
| 🔴→✅ **일정 비어보임**(matches-panel snake) | API는 snake(`scheduled_at`/`home_team`/`round_name`)인데 패널이 camel(`scheduledAt`) 읽음→전 경기 "미배치"→코트/휴식/배치 안보임(snake함정 8회). 3-C는 무죄(inert). ✅해결: 읽기 접근자 snake 교정(PATCH body는 camel 유지) |
| 정산 모달 에러가시화 | POST 실패가 모달에 가려 "무반응"으로 보임 → 모달내 사유표시 보강(부수개선) | ✅ |
| (이하 기존 minor·비차단) | | |
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

> **PR-2(완료) 상세는 git + 작업 로그 참조.** 시각박제=전 패널 이미 정합(변경0). 기능4건: 2-1 참가팀 정합확인(0줄) / 3-A 공지 settings.notice(e1a98e2) / 3-B series 읽기칩+위임(31cdd79) / 3-C 일정 휴식삽입 클라오버레이(cabbef4) / 3-D 정산 지출 `tournament_expenses` 신규테이블+API+패널(db push 완료·8컬럼0행 검증).
> **PR-2 재사용/주의**: 신규 테이블 `tournament_expenses`(tournament_id uuid FK·amount Int·Cascade) 운영 반영됨. 지출 API=`/api/web/tournaments/[id]/expenses`. 공지=settings.notice. ⚠️로컬 Prisma 클라이언트는 dev서버 DLL 잠금으로 재생성 막힘→3-D 런타임은 프리뷰 빌드에서 검증(로컬 dev 서버 stale). ⚠️선택후속: matches-admin.css에 sc-break/sc-brkmin 박제(현재 인라인).

### PR-3 3-A — 대회 생성 입구 단일화 (§6-1·1파일·라우트 보존)
📝 대회관리자 목록 hero의 4옵션 진입 패널(quick/legacy/prospectus/association)을 제거하고 **단일 "새 대회 만들기" CTA → 5단계 마법사(`/tournament-admin/tournaments/new/wizard`) 직행**으로 단일화.
- **변경 1파일**: `tournaments/_components/admin-entry-cta.tsx` (-146/+26). `ENTRY_OPTIONS`·`aen-grid`/`aen-panel`/`aen-opt`·`panelOpen` 토글·`EntryOption` 제거 → `aen-hero` + 단일 `aen-hero__cta` Link.
- **라우트 보존(삭제 0)**: prospectus(`new/wizard/prospectus/page.tsx`)·association(`wizard/association/page.tsx`)·legacy(`?legacy=1`/`LegacyWizardForm`)·new/wizard 전부 실존 확인. **href만 입구에서 제거**, 5단계 마법사 내부에 prospectus·association 진입 안내가 이미 있어 경로 계속 도달 가능(§6-1 단일진입+보존).
- **부모 호환**: page.tsx가 `isSuperAdmin={isSuper}` 전달 → prop 시그니처 유지(단일화로 미사용 → `_isSuperAdmin` 가드). 부모 0접촉.
- **검증**: tsc EXIT0. 정적: 변경 admin-entry-cta만·ENTRY_OPTIONS/aen-grid/panel 코드 제거(주석만 잔존)·보존 라우트 3종 실존·LegacyWizardForm 보존·하드코딩 hex 0·데드링크 0(CTA→실존 wizard). Toss aen-hero/aen-hero__cta + lucide 유지.
- 🖥️ PM 육안: 대회목록 hero에 단일 "새 대회 만들기" 버튼 → 클릭 시 5단계 마법사 진입 / 마법사 내부에서 PDF요강·협회 경로 여전히 도달.

### PR-3 3-B — 생성 마법사 SUBTABS(4탭) 제거 (§6-1·1파일·라우트 보존)
📝 `new/wizard/page.tsx` QuickCreateForm의 진입점 SUBTABS(quick/legacy/prospectus/association 4탭) + 탭 전환 안내카드 + SUBTABS const 제거 → quick(CtCreateTournament) 단독 진입.
- **변경 1파일**: `new/wizard/page.tsx` (+4/-91). 제거: `SUBTABS` const·`<div role="tablist">` 4탭 nav·"전환 안내 카드"(TossCard+router.push 탭전환).
- **🔑 구조 발견**: 2026-06-21 B-2의 `if (subtab==="quick")` early-return 이후 **두 번째 return(SUBTABS셸)은 이미 도달 불가(dead)**였음 — quick이 항상 단독 렌더. 즉 SUBTABS는 이미 비노출 상태, 본 작업은 orphaned dead 코드 정리.
- **요강/협회 진입 보존**: 실제 진입은 **CtCreateTournament 자체 버튼**(L815 `onOpenProspectus`→/prospectus·L818 `onOpenAssociationWizard`→/wizard/association)에 살아있음 = "단일 보조 진입점 1개"는 그쪽이 충족. legacy=`?legacy=1`→`LegacyWizardForm`(L111-114) 분기 무변경. prospectus/association 라우트 파일 실존 확인(삭제 0).
- **⚠️ 의도적 보류**: 코디 "subtab state 제거" 중 **subtab state는 유지**. 이유=제거 시 early-return이 무조건화→두 번째 return 전체(195줄: 헤더 요강버튼·draft배너·협회카드)가 unreachable→통삭제 + draftMeta/showAssociationCard useEffect cascade 발생(고위험). 명시 타깃(SUBTABS nav/const/전환카드)만 정밀 제거하고 요강버튼/협회카드/배너는 보존(코디 "유지" 준수). subtab은 "quick" 단일값 vestigial — orphaned 두번째 return 통삭제는 별도 hygiene 후속 권장.
- **검증**: tsc EXIT0(미사용/unreachable 0). 정적: SUBTABS 코드 제거(주석만)·탭전환 제거·요강/협회/legacy/CtCreateTournament 진입 보존·보존 라우트 실존·하드코딩 hex 0·데드링크 0.
- 🖥️ PM 육안: `/new/wizard`→CtCreateTournament 바로(4탭 없음, 폼 내 요강/협회 버튼) / `?legacy=1`→LegacyWizardForm 여전히.

### PR-3 3-C — 대회 생성폼 5단계 스텝화 (Option A·레이아웃만·로직 100% 보존)
📝 `ct-create-tournament.tsx` 2컬럼 단일 스크롤 폼을 정본 `대회 생성.html`처럼 **5단계 순차 스텝**으로 래핑. **섹션 내부·submit·PublishModal·draft·state 전부 무변경, 배치만 스텝화.**
- **변경 1파일**: `new/wizard/_components/ct-create-tournament.tsx` (+103/-20). ct-divisions/game/schedule-venue 내부·page.tsx 미접촉.
- **5스텝 매핑**: 1 대회정보(`<section ts-card>`)·2 일정장소(`<ScheduleVenue>`)·3 종별(`<CtDivisions>`)·4 경기설정(`<CtGameSettings>`)·5 접수·공개 검토(요약 ReviewRow+안내). 각 섹션 `{step===N && (…)}`로 감싸 현재 스텝만 노출.
- **네비**: 정본 `tw-steps`(클릭 점프·is-active/is-done) + `ct-progress`((step+1)/5) + `tw-foot`(이전/다음, 마지막=대회 생성). `ct-grid--2`/`ct-bar` 제거→단일 컬럼+tw-foot. CSS(tw-steps/tw-step/__num/__lbl/ct-progress/__fill/tw-foot/__mid/__actions) 실존.
- **🔒 로직 보존(회귀 0)**: `submit`·`publish`·`onSubmitDraft` payload·`PublishModal`·전 state·핸들러 **0변경**. "대회 생성"=마지막 스텝 **기존 submit 그대로**→검증→PublishModal→동일 POST. 다음=soft(차단0), 최종검증은 submit 기존대로(누락 토스트).
- **보존 진입점**: 헤더 요강(onOpenProspectus)·협회(onOpenAssociationWizard)·이전대회 그대로. draft=page.tsx 소관(미접촉). step=신규 로컬(0부터)—값 복구 기존대로·스텝은 1부터.
- **검증**: tsc EXIT0(JSX 균형). 정적: 변경 1파일·hex 0·ct-bar/2컬럼 제거·POST/submit/publish/PublishModal/요강/협회 grep 14건 보존·lucide/var(--*).
- 🖥️ PM 육안(중요): 생성 1→5 진행(다음/이전/스텝클릭)·5스텝 검토요약·"대회 생성"→게시 모달→실제 POST 동일 / 요강·협회·이전대회 도달.

### PR-3 3-D — 대회 수정폼(TournamentWorkspace) 정본 미세 정합 (PR-3 마지막)
📝 정본 workspace.jsx(mode=edit) + 07 스크린샷과 1:1 대조. **결과: 운영 거의 정합(과잉 변경 금지)** — 실제 격차 1건만 보강.
- **정합 확인(이미 일치)**: tw-shell·ts-ph·tw-badges·SectionNav(tw-steps)·ct-progress·tw-foot(이전/저장/다음·dirty/saving/saved·tw-msg)·SetupChecklist·PR-2 패널 dynamic import(teams/divisions/bracket/matches/recorders/admins/site) 전부 존재. **단일 스텝 표시 방식 동일**(정본=조건렌더 / 운영=전섹션 렌더 + `tw-shell[data-step] #other{display:none}` CSS + `.tw-body .ct-col{display:contents}` → 같은 UX).
- **격차 1건(보강)**: 정본 섹션 헤더 = per-step 아이콘(info/calendar-days/layout-grid/sliders-horizontal/globe) + "{N}단계 · {라벨}". 운영 `WorkspaceSection` = 고정 trophy 아이콘 + 단계번호 없음 → 07 대비 가시 차이. **SECTION_ICONS 맵 + WorkspaceSection 헤더만 보강**(trophy→단계 아이콘, 제목 앞 "{N}단계 ·"). SectionNav 번호와 일치.
- **변경 1파일**: `TournamentWorkspace.tsx` (+14/-2). saveSetup·PATCH·dirty/saving/saved·SectionNav·tw-foot·ct-progress·SetupChecklist·PR-2 패널 임베드 **0접촉**(self-diff = 보강분만).
- **검증**: tsc EXIT0. 정적: 변경 +14/-2·보강분 외 변경 0·하드코딩 hex 0·lucide 단계 아이콘 유효.
- 🖥️ PM 육안: 07 대비 각 스텝 헤더에 단계별 아이콘 + "1~5단계 ·" 표기 / 나머지(저장바·체크리스트·패널) 기존 동작 그대로. PR-3 전 배치(3-A~3-D) 완료.

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-27 | **PR-2 로컬 QA 추가 2건 해소 (지출 500·0원 폰트)** | ✅ ①지출추가 500 = **로컬 dev 서버 stale Prisma 클라이언트**(신규 tournament_expenses 미인식·DLL 잠금으로 generate 막혔던 것). 포트3001 PID12460 종료→`prisma generate`→재시작(새 PID63888)으로 해소(코드 무죄). ②금액 "0원" 슬래시제로(JetBrains Mono)→본문폰트+tabular-nums(d1c2d3e). **PR-2 로컬 검증 완료**(지출/일정/공지/series 동작). 교훈: 신규 모델 후 dev 서버 재시작+generate 필수. |
| 2026-06-27 | **PR-2 프리뷰 QA 버그 2건 수정 (되돌림 루프)** | ✅ ①빌드실패: expenses Zod3 `invalid_type_error`→Zod4(옵션 제거)·PR-2 전체 미배포 원인. ②일정 비어보임: matches-panel camel→snake 읽기 교정(snake함정8회·3-C 무죄). +정산 모달 에러가시화. **tsc EXIT0 직접확인**(3-D dev의 EXIT0은 캐시 오판이었음). errors.md 박제. **✅프리뷰 빌드 SUCCESS(d999cba READY)** — PR-2 기능 프리뷰 첫 배포. 수빈 재검토→PR #773 머지 대기. |
| 2026-06-27 | **admin-toss PR-2 3-D 정산 지출 + PR-2 완료** | ✅ `tournament_expenses` 신규테이블(tournament_id **uuid** FK 교정·amount Int·Cascade) db push 운영반영(무중단 CREATE·8컬럼0행·insert/delete 롤백검증). expenses API(GET/POST/PATCH/DELETE·requireTournamentAdmin·IDOR). settlement-panel 지출/잔액(입금−지출) KPI+모달, 기존 입금로직0접촉. tsc EXIT0. ⚠️로컬 Prisma 재생성 EPERM(dev서버 잠금·미킬)→런타임 프리뷰 검증. **PR-2 완료**. |
| 2026-06-27 | **admin-toss PR-2 기능 3-A·3-B·3-C (마이그0)** | ✅ 3-A 공지저장(settings.notice·e1a98e2) / 3-B series 읽기칩+위임링크(ops-panel+tournament.ts include 1줄·31cdd79) / 3-C 일정 휴식삽입(matches-panel 클라오버레이·DB0·정본동일). 전부 tsc EXIT0·하드코딩hex0·기존로직0접촉·snake 함정 회피(notice/series_id 단어키). 잔여=3-D 지출(승인됨). |
| 2026-06-27 | **admin-toss PR-2 파일럿 2-1 참가팀 정합** | ✅ **이미 정합·코드 변경 0**. 운영 teams-panel이 정본 TeamsPanel의 superset(납부/종별이동/로스터/토큰재발급 등 운영 우위)·최근 9040ff1로 정합완료. tsc EXIT0·하드코딩hex0·tt-*/amt-* CSS 실존·git diff 0줄. §5 #5 보존(apply_token·TournamentTeamPlayer 기존). 검증패널 일괄진단 착수. |
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
