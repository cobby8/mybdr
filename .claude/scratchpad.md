# 작업 스크래치패드

> 2026-06-27 정리: 262KB→압축. 과거 세션 상세(기획설계/리뷰/구현/테스트 섹션)는 작업 로그로 요약·제거. 상세 이력은 git log + knowledge/ 참조.

## 현재 작업
- **요청**: 🔄 **전략 피벗(2026-06-27)** — 기존 코드 위 점진 박제(PR-0~5) 대신 **관리자 영역 전체 UI 그린필드 리빌딩**. 사유=레거시 섞임·snake/계약 데이터 처리 반복 꼬임. 사용자 결정: ①범위=관리자 전체 UI 신규(공개사이트 제외) ②백엔드 유지(API/Prisma/인증·오늘 추가분 재사용) ③그린필드(새 라우트/컴포넌트→영역별 검증 후 교체) ④**타입드 데이터 계층 포함**(snake↔camel 1곳·반복버그 근본차단=핵심실익).
- **기준 패키지**: `Dev/design/BDR v2.41-admin-toss/`(정본·screenshots 17) + `_PR0-CONTRACT-CONFIRMED.md`.
- **아키텍처 확정(2026-06-27)**: 그린필드 `src/app/(admin-v2)/` + `/v2/*` prefix 병행→영역별 **디렉토리 스왑** 교체(레거시 `_legacy-archive/`·북마크 보존). 데이터계층 `src/lib/admin-api/`(adminFetch: camel↔snake 1곳+핵심 Zod). canonical 디자인셋=admin-toss kit/console-kit/toss-admin.css/셸 재사용+admin-blocks 신규. **로드맵: M1 데이터계층→M2 토대셋(셸골격)→M3 파일럿=대회관리자 셸(5화면) end-to-end→이후 백오피스18/대회운영7/마법사/심판**. Zod=핵심필드만. ⚠️인증보호 위치(middleware 미발견) M1 점검.
- **🔄 2차 피벗(2026-06-28): 클린 슬레이트 재시작**. 1차 그린필드(M1~M3)는 **레거시 5133줄 `toss-admin.css`+레거시 셸 재사용**으로 시안 깔끔함 미달(수빈 육안 불합격). 사용자 결정: 관리자 전부 처음부터·**시안 HTML 충실 1:1 포팅**·데이터계층도 새로·**DB 보전 절대**(프론트만, Prisma/DB/API 0변경). 첫 영역=백오피스(최대).
- **현재: R4-A 대회운영 워크스페이스(셸+요약+참가팀) 진행 중(developer)**. 완료: R0✅·R1✅토대(`styles/admin-v2/` 정본CSS verbatim·`components/admin-v2/` kit/shell/blocks 1:1·`lib/admin-v2/data/`·쇼케이스 수빈합격)·**R2 백오피스 BO-0/1/3/4/5✅**(셸/유저콘솔/마케팅·결제·요금제/커뮤니티4탭/코트2탭·BO-2 매칭 보류)·**R3 대회관리자 5화면✅**(/v2/ta 별도콘솔셸·organizer-scoped·jsonb verbatim). 레거시 0의존·전부 서버Prisma직접 READ·tsc0·백오피스 회귀0.
- **★라우트 구조(R3)**: `(admin-v2)/v2/layout.tsx`=인증-only → 백오피스 `(backoffice)/`그룹(URL `/v2/*` 보존)·대회관리자 `/v2/ta`(자체 셸). 시각보정 완료(H1 타이포누수차단+빈상태/차트/text-rendering — 코워크QA: 토큰/CSS/컴포넌트 정본1:1, 깔끔함이슈=빈상태였음). dev캐시 함정=errors.md 2026-06-28(라우트재구성후 .next삭제·재시작).
- **로드맵 잔여**: R4 대회운영(R4-A 진행→대진표/일정/운영관리/사이트/정산 패널+모달5종)→R5 마법사/심판→영역별 컷오버. PaymentDetail/PlanEditor·news/anonymous·매칭(BO-2)·2FA = 후속 결정.
- **클린슬레이트 로드맵**: R1✅토대→**R2 백오피스**(BO-0/1먼저→5리스트→3커뮤니티/4코트는 결정후→2매칭 보류)→R3 대회관리자→R4 대회운영→R5 마법사/심판→영역별 컷오버(디렉토리 스왑·데이터/북마크 보존). 1차 M4 DB정합조사 유효(아래 갭6건).
- **정본 v46/v48 교체 완료(2026-06-28)**: repo `Dev/design/BDR v2.41-admin-toss/`=v46/v48(v48폴더+v46스크린샷17+START-HERE+IMPL+repo _PR0계약). 직전본 v45→`_archive/...-pre48/`. v46=3영역 대규모 갱신(백오피스 5콘솔재편·operate 3배·공개사이트). 대회관리자=시리즈→정규대회 용어확정.
- **★확정 로드맵(2026-06-28 범위 재산정)**: M2.5 셸갱신(home/isHome/footAction·BackRow·외부링크·toss-admin.css 3클래스)→M3 대회관리자 셸(시안확정·갭0)→M4 백오피스(BO-0셸/1유저/5마케팅 먼저→2매칭/3커뮤니티/4코트는 DB확인 후)→M5 대회운영(모달5종 배선·4정합/Notice확인)→PR-5 공개사이트(BDR 별도트랙). 백엔드 유지=대부분 배선작업.
- **★DB정합 갭 6건(M4/M5에서 결정·구현 전 확인필수)**: ①pickup·scrim·guest(매칭, 모델有 admin API無) ②board 3분할 카테고리값 ③court-partner 분류(DB無 가능→룰 저촉) ④MyPage 2FA/세션 ⑤Notice 공지저장처 ⑥PaymentDetail/PlanEditor 시안미완. **§결정: Payment/Plan=범위제외+Claude.ai 보완의뢰 병행(M4)**.
- **PR-0~5(완료·dev·빌드 통과)는 "현재 관리자"로 유지** — 그린필드가 영역별 교체할 때까지 살림. 백엔드 변경분(tournament_expenses+expenses API·settings.notice) 재사용. PR #773(dev→main)은 현 관리자 릴리스로 유지 가능(수빈 결정).
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
| PR-3 | 생성/수정 마법사. 3-A 입구단일화(b49c701)·3-B SUBTABS제거(7bc6db8)·3-C 생성폼 5단계스텝화 OptionA(8c75d2c)·3-D 수정폼 정합(9952966). 마이그0·로직보존. **코드완료·로컬 검증대기**(생성 1~5+제출) | 🔄 검증 |
| PR-4 | 셸별 콘솔. 진단=4영역(대회관리자/백오피스18/협력/심판) **이미 정합·박제0**. 4-A §6-2 목록 제거(redirect+sidebar 일원화·상세/audit/transfer 보존) | ✅ 완료 |
| PR-5 | 공개 사이트(BDR 13룰). 진단=발행가시성/실데이터/BDR분리 이미 정합. 5-A "준비중"카피(900488b)·5-B 대진 공개탭(2e2f472). 자동가시성 유지·Toss0·마이그0 | ✅ 완료 |

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

### PR-4 4-A — /admin/tournaments 목록 완전 제거·일원화 (§6-2·마이그 0)
📝 대회 목록을 `/tournament-admin/tournaments`로 일원화. 구 `/admin/tournaments` 목록 제거. **상세 [id]·audit-log·transfer-organizer는 유지**.
- **변경/삭제 3파일**: ①`admin/tournaments/page.tsx` 목록 렌더 제거→`redirect("/tournament-admin/tournaments")` 서버 컴포넌트(-169/+9) ②`admin-tournaments-content.tsx` **삭제**(-257·page.tsx 유일 import였음·잔존 import 0 확인) ③`sidebar.tsx` "대회 관리" base href `/admin/tournaments`→`/tournament-admin/tournaments`(전 역할 일원화·hrefByRole 무변경).
- **보존(§6-2)**: `[id]/page.tsx`·`[id]/audit-log/page.tsx`·`[id]/transfer-organizer/page.tsx` 미접촉·실존 확인. 직접 URL 도달 유지. 상세/audit/transfer의 "목록으로" back 링크(`/admin/tournaments`)는 redirect로 처리(데드링크 아님).
- **보고**: `app/actions/admin-tournaments.ts`(updateTournamentStatusAction/toggleTournamentVisibilityAction + revalidatePath) = 삭제된 content가 유일 소비처였어 **이제 미사용**. revalidatePath는 redirect 경로라 무해 → 코디 지시대로 **유지(미삭제)**, 보고만. 후속 정리 선택.
- **검증**: tsc EXIT0. 정적: page.tsx redirect만(prisma/content import 0)·content 삭제·sidebar href 변경·보존 3파일 실존·content import 0·데드링크 0(잔여 /admin/tournaments 링크는 redirect 처리 or 상세 [id] 정상).
- 🖥️ PM 육안: super/site/tournament admin "대회 관리" 클릭 → /tournament-admin/tournaments / 구 URL 직접 진입 시 리다이렉트 / 상세·감사로그·운영자이전 직접 URL 도달.

### PR-5 5-A — 공개 사이트 "준비중" 카피 정합 (BDR 13룰·마이그 0·소규모)
📝 공개 사이트 `classic.tsx`의 prep(준비중) placeholder 카피를 정본 정합. ⚠️공개=BDR 토큰(var(--color-*))·**Toss 0**.
- **격차 1건(보강)**: 운영은 `currentPage==="results"`에서 **항상 ResultsPage 렌더**(빈 상태 "완료된 경기가 없습니다") — results prep 분기 부재. 정본 public-site-pages.jsx는 "공식 기록 준비 중"(집계 후 게시) prep. → schedule prep과 동일 패턴으로 **results prep 분기 추가**(`visibility.sections.results === "prep"` → `SectionPlaceholder title="공식 기록 준비 중" desc="대회 공식 스탯과 기사는 집계 후 게시됩니다. 준비되면 이 영역에 공개됩니다."`).
- **bracket prep = N/A**: 운영 SITE_NAV 5페이지(home/teams/schedule/results/registration)에 bracket 페이지 없음 → 해당 prep 불필요. schedule prep은 이미 정본 정합("일정 준비 중") → 무변경.
- **변경 1파일**: `classic.tsx` (+7, 순수 추가). 기존 `SectionPlaceholder`(BDR var(--color-*)) 재사용·신규 컴포넌트 0.
- **보존**: `public-visibility.ts` 가시성 로직 0접촉(카피만)·실데이터 바인딩·서브도메인 라우팅 0변경·dark/minimal 스킨 동일(schedule prep과 같은 컴포넌트라 회귀 0)·**mock 기사/가짜데이터 0**("준비중" 안내만).
- **검증**: tsc EXIT0. 정적: 변경 classic.tsx만(+7)·**Toss(ts-/lucide/admin-toss/data-skin) 잔존 0**·BDR var(--color-*)·하드코딩 hex 0·public-visibility 미변경·3스킨(templateType) 분기 보존.
- 🖥️ PM 육안: 미발행/종료-미보유(results=prep) 상태 결과 탭 → "공식 기록 준비 중" 안내(mock 0) / show/partial 시 기존 ResultsPage / classic·dark·minimal 동일.

### PR-5 5-B — 공개 사이트 대진(bracket) 탭 추가 (BDR 13룰·실데이터·마이그 0)
📝 공개 토너먼트 사이트(`classic.tsx`)에 **대진 탭 + BracketPage 트리** 신설. 정본 BracketPage(public-site-pages.jsx) 밴드/연결선 레이아웃을 BDR 토큰으로 박제. 발행 가시성(`visibility.sections.bracket`) prep/show/hide 게이트.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/components/site-templates/bracket.module.css` | 정본 `.s-bracket` 밴드/연결선 트리 → BDR `var(--color-*)` 박제(셀 min-height 92px·승자강조 `--bk-primary`) | 신규 |
| `src/components/site-templates/classic.tsx` | import(CSSProperties+module)·MatchEntry에 round_number/bracket_position·BracketPage 신설·NAV_LINKS 대진 탭(일정·결과 사이)·템플릿 bracket prep/show 분기 | 수정 |
| `src/app/site-host/[[...path]]/page.tsx` | PAGE_SECTION에 `bracket:"bracket"` 게이트 1줄(hide=404·prep=placeholder·show=트리) | 수정 |

- **데이터 경로**: page.tsx가 이미 로드하는 `matches`(tournamentMatch — `round_number`/`bracket_position` scalar 포함) **재활용. 쿼리 변경 0** — MatchEntry 타입에 2필드만 선언. BracketPage가 `round_number!=null && bracket_position!=null` 필터→round_number 오름차순 그룹핑(8강/4강/결승)→bracket_position 정렬. 라운드명=roundName 우선·없으면 "N라운드". mock 0(실 매치 파생만).
- **visibility 게이트(소비만·0접촉)**: NAV `visibleNavLinks` 필터가 bracket==="hide"면 탭 숨김(before/reg). 탭 노출=prep(drawn)·show(published+). 템플릿: prep→"대진 준비 중"(정본 카피) / show→트리 / hide→page.tsx에서 404. showScore=state live/ended에서만 스코어 노출(정본 동일). 미발행→탭 hide/prep·발행→트리.
- **승자강조**: `--bk-primary` 인라인 커스텀 프로퍼티로 site primary 주입→CSS module이 color-mix/inset shadow에 사용(**하드코딩 hex 0**).
- **검증**: `cmd /c npx tsc --noEmit --incremental false` **EXIT0**. 정적: 대진 탭·BracketPage·게이트 존재 / Toss(ts-/lucide/admin-toss/data-skin) 잔존 0(유일 매치=정본 경로 주석) / BDR var(--color-*)·하드코딩 hex 0(box-shadow rgba=정본 동일 중립 그림자) / min-height 92px / 3스킨(templateType/isDark/minimal 9건) 보존 / public-visibility.ts 0접촉.
- 💡 tester 참고: 미발행/모집 상태→대진 탭 안 보임. 대진생성 후(drawn)→탭 보이고 "대진 준비 중". 발행(published)→8강/4강/결승 트리(스코어 "–"). 진행/종료(live/ended)→스코어+승자 강조. /bracket 직접 URL: hide 상태면 404.
- ⚠️ reviewer 참고: (1) 모바일 nav는 기존 `slice(0,4)` 유지 — 6탭 됐으나 ended 상태에서 모바일 상단은 홈/팀/일정/대진(결과 오버플로). "회귀 0" 위해 slice 로직 미변경(결과/참가신청은 기존에도 모바일 오버플로). (2) box-shadow rgba(16,24,40,…)=정본 s-bgame 그림자 그대로 박제(기존 classic/layout rgba 그림자 패턴과 동일). (3) `/schedule` 등 명시 라우트 파일이 catch-all을 shadow하나 `/bracket`은 명시 라우트 없어 catch-all→ClassicTemplate 도달(설계 의도).

### M1 — 관리자 타입드 데이터 계층 (`src/lib/admin-api/`·신규 7파일·백엔드 0변경)
📝 snake_case 5회 재발버그를 **fetch 1곳에서 구조 근절**하는 데이터 계층 신설. camel↔snake 변환을 adminFetch 안에서만 처리 → 호출부는 항상 camel 타입만 봄.

| 파일 | 내용 | 신규 |
|------|------|------|
| `admin-api/client.ts` | `adminFetch<TRes>`(★유일 변환지점) + `AdminApiError`. body camel→snake / 응답 snake→camel / apiError 메시지 추출 / Zod parse / abort | 신규 |
| `admin-api/types.ts` | camel 도메인 타입(AdminTournamentSummary/Detail·AdminExpense·Create/Delete) + `TOURNAMENT_RAW_JSON_KEYS` | 신규 |
| `admin-api/schemas.ts` | Zod4 응답 스키마(expense/list/delete·고위험 신규필드 우선) | 신규 |
| `admin-api/endpoints/expenses.ts` | list/create/delete (Zod 검증) | 신규 |
| `admin-api/endpoints/tournaments.ts` | list/getTournament(rawJsonKeys 보존) | 신규 |
| `admin-api/use-admin-query.ts` | 클라 훅 {data,loading,error,refetch}+abort | 신규 |
| `admin-api/index.ts` | barrel | 신규 |

🔑 **인증 보호 메커니즘(0번 점검 보고)**: 루트 `middleware.ts` **부재**(전수검색=`src/lib/api/middleware.ts`만, 이건 API withAuth 래퍼). 보호는 **라우트그룹 세그먼트 레이아웃 서버컴포넌트**가 담당 — `(admin)/admin/layout.tsx`=`getAuthUser()`+`getAdminRoles()`, `(admin)/tournament-admin/layout.tsx`=`getWebSession()`+membershipType>=3/super. `(admin)/layout.tsx` 공통 없음(각 세그먼트 독립). → 향후 `(admin-v2)/v2/*`도 **세그먼트 레이아웃에 동일 `getWebSession()`/`getAuthUser()`+역할체크+`buildLoginRedirect` 패턴 복제**하면 됨(루트 middleware 추가 불필요). M2에서 처리.
🔑 **응답 래핑(0번)**: `apiSuccess(data)`=`NextResponse.json(convertKeysToSnakeCase(data))` → **래퍼 없음**(body 자체가 snake 데이터). 언래핑=body 그대로. apiError=`{error,code?}` → 메시지 추출.
🔑 **jsonb F-2b 차단**: `rawJsonKeys` 옵션 → 지정 키(settings/scheduleDates/categories 등)는 값 verbatim 보존(키만 camel, 내부 변환 제외). self-trace 검증: scheduleDates 키 camel化되나 내부 `court_ids` raw 유지(courtIds 변환 안됨)·settings 내부키 raw. rawKeys 없으면 기존 `convertKeysToCamelCase` 그대로 재사용(중복구현 회피·동일동작).
🔑 **Zod4**: 옵션객체 금지·`z.number().int()` 패턴. parse 런타임 검증: list.parse OK / int위반 정상 reject(invalid_type).

💡 tester: tsc EXIT0(--incremental false). 변환/Zod self-trace 통과. 소비처 미배선(M3 파일럿에서 배선). 백엔드/레거시 0접촉.
⚠️ reviewer: ZodType<TRes> 변성(expenseListSchema→AdminExpense[]) tsc 통과. AdminApiError status=0=네트워크에러.

### M2 — 토대셋: admin-blocks 컴포넌트 + (admin-v2) 셸 골격/인증 (신규8파일·css append·레거시0접촉)
📝 그린필드 리빌딩 M2. ①정본 admin-blocks 박제(`src/components/admin-v2/blocks/`) ②`(admin-v2)/v2` 셸+인증 복제. M3 대회관리자 파일럿(5화면)이 이 위에 올라감.

| 파일 | 내용 | 신규 |
|------|------|------|
| `admin-v2/blocks/types.ts` | Schema/Col/Row/DetailPayload 타입(정본 동적객체 TS화) | 신규 |
| `admin-v2/blocks/page-head.tsx` | PageHead(정본 admin-shell.jsx, ts-ph 마크업·훅없음=서버공용) | 신규 |
| `admin-v2/blocks/schema-list.tsx` | SchemaList+renderSchemaCell+SchemaTable(정본 그리드 DataTable). rowHref/onRow/스키마셀 패턴 보존 | 신규 |
| `admin-v2/blocks/panels.tsx` | AdBarPanel/AdListPanel/adToneColor | 신규 |
| `admin-v2/blocks/settings.tsx` | AdSettings(토글/값 그룹) | 신규 |
| `admin-v2/blocks/index.ts` | barrel | 신규 |
| `app/(admin-v2)/v2/layout.tsx` | 인증복제(getWebSession+membershipType≥3/super+buildLoginRedirect)+AdminShell 마운트 | 신규 |
| `app/(admin-v2)/v2/page.tsx` | "v2 그린필드 셸 OK" 플레이스홀더 | 신규 |
| `src/styles/toss-admin.css` | 누락 ad-* 룰 32줄 append(scoped) | 수정 |

🔑 **PageHead/DataTable 결정**: admin-toss 키트엔 PageHead 없고 DataTable은 API 상이(columns/keyField) → 정본 admin-shell.jsx 정의(PageHead=ts-ph, DataTable=cols/rows/render(r,k)/onRow)를 blocks 내부에 TS 박제. Icon/Btn/Badge/Toggle/Empty는 admin-toss 재사용. SchemaTable 명명으로 admin-toss DataTable과 충돌 회피.
🔑 **하드코딩 hex 0**: 정본 toneColor violet `#6D5AE6`→`var(--primary)` 토큰. CSS append도 정본 `#fff`/`rgba`→`var(--card)`/`var(--border)`(기존 toss ad-table 패턴). 단 ad-avatar-sm `color:#fff`(아바타 흰 텍스트)는 기존 toss-admin.css(ts-table) 동일 패턴이라 유지. r.color/a.color+"1A"(알파)는 데이터 주입(컴포넌트 하드코딩 아님).
🔑 **CSS append(스코프)**: ad-cell-flex/avatar-sm/statusline/dot/panel*/list*/listrow*/bars/bar* 9그룹을 정본 admin-pages.css→`[data-skin="toss"]` 스코프로 말미 append(32줄, 삭제0). 기존 ad-cell-strong/sub/mono/muted/rowact/iconbtn/toolbar/search/table/ts-ph는 실존→재사용(중복0).
🔑 **인증 복제**: tournament-admin/layout.tsx 패턴 그대로 — getWebSession→미인증 buildLoginRedirect(x-pathname, proxy가 모든경로 무조건 주입), membershipType≥3 or super, 부족 시 no_permission. AdminShell roles=[super_admin?/tournament_admin?]→사이드바 nav 필터. data-skin="toss"는 AdminShell 루트 제공. ToastProvider wrap(M3 패널 대비).
🔑 **라우트 충돌 0**: `(admin-v2)`는 신규 route group(URL=/v2). 기존 /v2 라우트 부재 확인(glob 0). 레거시 /admin·/tournament-admin과 미겹침. proxy.ts 미접촉(x-pathname이 /v2 커버).

💡 tester: tsc EXIT0(--incremental false 클린). self-trace: 미인증 /v2→buildLoginRedirect(로그인), 인증+권한→AdminShell+플레이스홀더 렌더. 소비처 미배선(blocks는 M3에서 실데이터 배선). git diff=신규8+css append만(레거시 0접촉).
⚠️ reviewer: (1) SchemaList 진입=window.location.href(정본 1:1, Next router 미사용). (2) 내보내기/필터/저장/취소/더보기 = 정본 데모 토스트 제거→no-op(M3 배선). (3) panels `a.color+"1A"`=정본 8자리 hex 알파 1:1 보존(데이터 주입). (4) blocks barrel은 client/server 혼재(page-head는 서버공용)—플레이스홀더 page.tsx는 page-head 직접 import.

### 종별 디비전 연령 편집 Phase 3 — UI/PATCH end-to-end (A안·3파일·미커밋)
📝 종별·디비전 룰 카드에 **연령 입력 4개 + "연령 자동 채움" 버튼 + 저장**을 end-to-end 연결. Phase 1(매핑)·2(생성 시 채움) 위에 **편집 경로** 신설.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `.../division-rules/route.ts` (GET) | serializeRule에 `birth_year_min/max` 응답 추가(grade는 기존)·tournament `startDate` select+KST 연도→`tournament_year` 응답 | 수정 |
| `.../division-rules/[ruleId]/route.ts` (PATCH) | zod `birthYearMin/Max·gradeMin/Max`(int·nullable·optional) 추가·전달 필드만 update(부분)·응답 4필드 노출. **기존 format/settings·IDOR·canManageTournament 가드 0접촉** | 수정 |
| `divisions-panel.tsx` | DivisionRule에 birth_year_min/max·`tournamentYear` state·updateRule 연령 patch+낙관적 갱신·`AgeRangeInputs` 서브컴포넌트 신설(입력4+자동채움+저장)·룰 카드 렌더 | 수정 |

🔑 **ages 확보 방식**: 별도 fetch 0. GET이 이미 반환하는 `master_categories[].ages` + 룰의 `settings.category`(seed 박제)로 매칭. category 없는 옛 룰은 ages=[]→자동채움 버튼만 비활성(수동입력 정상).
🔑 **자동 채움 동작**: `computeAgeRangeForDivision(r.code, ages, tournamentYear)` → null(일반부/대학부)이면 버튼 disabled. 결과는 입력 state만 채움(저장 X)→운영자 확인 후 "연령 저장"=PATCH.
🔑 **snake/camel**: PATCH는 입력 변환 없는 raw zod → body는 camel(`birthYearMin`). 응답은 apiSuccess가 snake 변환 → 프론트는 `birth_year_min` 읽기.
💡 tester: tsc EXIT0·age-mapping 13/13. 자동채움(유청소년 U{N}/+{N} 디비전)→4입력 채워짐·저장 후 새로고침 유지 / 일반부·대학부=버튼 비활성·수동입력 저장 가능 / 빈 입력=null 저장.
⚠️ reviewer: 부분 업데이트(undefined 미반영)·null=제한 해제 의미. 기존 GroupSettings/진출매핑 0접촉.

### R2 시각 보정 — 코워크 QA 후속 4건 (admin-v2 4파일·미커밋)
📝 코워크 픽셀 QA 결론(토큰/CSS 정합·"깔끔함 부족"=빈상태 처리 미흡) 따라 admin-v2만 4건 보정. 백엔드/DB/레거시 0접촉.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `components/admin-v2/blocks.tsx` | ①AdListPanel `items.length===0`→정본 `Empty`(.ts-empty) "처리할 항목이 없습니다" 분기(빈 흰패널 제거) ②AdBarPanel 막대 height `Math.max((c.v/max)*130, 2)` 0값 2px baseline + `max=Math.max(...,1)` NaN차단 | 수정 |
| `app/(admin-v2)/v2/page.tsx` | 콘솔섹션 인라인라벨 → `.ad-section-label` 클래스 + 래퍼 marginTop 22→28 | 수정 |
| `styles/admin-v2/admin-pages.css` | `.ad-section-label` 신설(정본 동일값 13/800/ink-mute/.02em) | 수정 |
| `styles/admin-v2/toss.css` | L76 베이스 `[data-admin=v2]`에 `text-rendering: auto` 추가(globals.css optimizeLegibility 상속 차단) | 수정 |

💡 tester: tsc EXIT0. /v2 새로고침 → ①처리대기 0건 시 "처리할 항목이 없습니다" 빈상태(빈 패널 X) ②월별 신규가입 0값 달도 막대 2px 보임 ③"운영 콘솔 바로가기" 섹션 간격 통일(28px). 정본 계수 130 보존·실데이터 막대 영향0.
⚠️ reviewer: 신규 클래스 `.ad-section-label` 1개. Empty=kit.tsx 기존 컴포넌트 재사용(신규0). 하드코딩 hex 0. 레거시 0접촉(git diff=admin-v2 4파일).

### 구현 기록 (developer) — R2-B 백오피스 BO-5 (마케팅/결제/요금제 리스트·신규3+셸1·미커밋)
📝 정본 bo-pages 의 3 리스트(마케팅 콘솔·결제·요금제)를 R2-A 패턴(서버컴포넌트 Prisma 직접 READ → SchemaList)으로 박제. 백엔드/DB/Prisma 0변경. 상세(PaymentDetail/PlanEditor)는 시안 미완 → 미배선(리스트만).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/marketing-console/page.tsx` | `ad_campaigns`+partner.name+`_count.placements`. 정본 campaigns 컬럼(캠페인/기간/클릭률/상태). 단일탭(캠페인) 정적 bo-constabs. status/period/ctr 매핑 | 신규 |
| `(admin-v2)/v2/payments/page.tsx` | `payments`+users(nickname/name) take50 `.catch(()=>[])`. 정본 컬럼(내역/수단/금액/일시/상태). 0건→SchemaList Empty 빈상태. method 한글맵·KST datetime·₩금액 | 신규 |
| `(admin-v2)/v2/plans/page.tsx` | `plans`+`_count.user_subscriptions`. 정본 컬럼(요금제/월요금/가입자/상태). 0원→무료·is_active→운영중/비공개(status dot) | 신규 |
| `(admin-v2)/v2/_shell.tsx` | TARGET 3건 soon→실라우트(marketing-console/payments/plans)·active 계산 3분기 추가 | 수정 |

🔑 데이터 소스(레거시 동일): 마케팅=`ad_campaigns`(레거시 /admin/campaigns 와 동일 모델·partner 조인) / 결제=`payments`+users(레거시 payments page.tsx 와 동일 서버 Prisma·0건 가능) / 요금제=`plans`(레거시 /admin/plans). snake→표시값 변환은 각 서버 컴포넌트 단일 매핑(snake 함정 차단). raw fetch 0(전부 Prisma 직접).
💡 tester: /v2/marketing-console·/payments·/plans 인증→리스트 렌더. 결제 0건이면 "데이터가 없습니다" Empty. 요금제 4건 가입자수 실집계. 행 클릭=기본 읽기 드로어(커스텀 상세 미배선). _shell nav 3항목 soon→실화면.
⚠️ reviewer: 상세 미배선=onRow/rowHref 없음→SchemaList 기본 openDetail(읽기 드로어)·PaymentDetail/PlanEditor 커스텀 0. plans subs=user_subscriptions 전체 count(active 필터 없음·실데이터). 하드코딩hex0·레거시/백엔드/DB 0접촉. tsc EXIT0.

### 구현 기록 (developer) — R2-C 백오피스 BO-3 커뮤니티 + BO-4 코트 콘솔 (신규4+types+_shell·미커밋)
📝 정본 bo-pages communityConsole/courtConsole 을 R2-A/B 패턴(서버컴포넌트 Prisma 직접 READ → SchemaList)으로 박제. 백엔드/DB/Prisma 0변경.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/community-console/page.tsx` | `community_posts`(general/recruit/review·3쿼리)+`suggestions`(.catch([])) 병렬. snake→표시 단일매핑(status/engage/category). 정본 _board·suggestions 컬럼 | 신규 |
| `(admin-v2)/v2/community-console/_console.tsx` | 4탭(자유/모집/후기/제안) bo-constabs + 탭별 SchemaList. 게시판=name/engage/status, 제안=name/category/status | 신규 |
| `(admin-v2)/v2/court-console/page.tsx` | `court_infos` where court_type indoor/outdoor 병렬+`_count.court_bookings`. status/region/주소 매핑·AV 색주입 | 신규 |
| `(admin-v2)/v2/court-console/_console.tsx` | 2탭(실내/야외) bo-constabs + SchemaList. 정본 _court 컬럼(코트/지역/월예약/상태) | 신규 |
| `lib/admin-v2/data/types.ts` | AdminBoPostRow/AdminBoSuggestionRow/AdminBoCourtRow 표시 행 타입 3종 추가 | 수정 |
| `(admin-v2)/v2/_shell.tsx` | TARGET communityConsole/courtConsole soon→실라우트·active 2분기 추가 | 수정 |

🔑 **매핑(확정·실값 기반)**: 커뮤니티 자유=`category:"general"`(438)/모집=`recruit`(211)/후기=`review`(396), 건의=`suggestions` 모델. 코트 실내=`court_type:"indoor"`(217)/야외=`outdoor`(429). snake→표시 변환은 각 서버 컴포넌트 단일매핑(snake 함정 차단)·raw fetch 0.
🔑 **시안 회피(룰 준수)**: partner 코트 탭 제외(DB 미지원=court_type partner 0건·partners 0건)·커뮤니티 news(135)/anonymous(141) UI 미추가(정본 4탭만).
⚠️ **데이터 갭(보고)**: ①건의 정본 votes(추천) 컬럼 = suggestions 모델에 추천/투표 데이터 없음 → **컬럼 제외**(빈컬럼 회피·정본 나머지 name/category/status 유지) ②코트 정본 "월 예약" = DB 월분할 데이터 없어 court_bookings **전체 예약수**로 대체(대부분 0=예약기능 신규) ③suggestions.category = 원값 passthrough(라벨 매핑 미정).
💡 tester: /v2 커뮤니티/코트 인증→탭 전환 시 리스트. 데이터 0건→SchemaList "데이터가 없습니다" Empty. 행 클릭=기본 읽기 드로어(커스텀 상세 미배선). _shell nav 2항목 soon→실화면.
⚠️ reviewer: 상세 미배선=onRow/rowHref 없음→기본 openDetail. 하드코딩hex=AV 색(데이터 주입·룰10 허용). 레거시/백엔드/DB 0접촉. tsc EXIT0.

### 구현 기록 (developer) — R3 대회관리자 콘솔 (별도 콘솔·5화면·라우트그룹 분리·미커밋)
📝 정본 ta-pages 1:1. **별도 콘솔 셸**(자체 NAV·brandSub="대회 콘솔")을 백오피스와 분리. 백엔드/DB/Prisma 0변경. organizer-scoped 서버 Prisma 직접 READ. 레거시 0 import.

**★아키텍처 — 라우트그룹 분리(백오피스 무영향 최우선)**: `/v2/layout.tsx`가 모든 자식을 V2Shell로 감싸므로, /v2/ta가 별도 셸을 가지려면 부모는 셸을 마운트하면 안 됨 → 부모를 **인증-only**로 리팩터하고 셸 마운트를 자식 그룹 레이아웃으로 이전.
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/layout.tsx` | 인증게이트+CSS만 유지·V2Shell 마운트 제거→`<>{children}</>` | 수정 |
| `(admin-v2)/v2/(backoffice)/layout.tsx` | 백오피스 V2Shell 마운트 이전(인증은 부모) | 신규 |
| `(admin-v2)/v2/_admin-user.ts` | 셸 표시용 user 빌더(양 콘솔 공용) | 신규 |
| 백오피스 페이지 14파일 | `(backoffice)/`로 **이동만**(git rename·내용0·route group=URL 불변) | 이동 |
| `(admin-v2)/v2/_shell.tsx` | "대회 콘솔" href `/tournament-admin`→`/v2/ta`(1줄) | 수정 |
| `(admin-v2)/v2/(backoffice)/page.tsx` | LAUNCH "대회 콘솔" href→`/v2/ta`(1줄) | 수정 |
| `ta/layout.tsx`·`_ta-shell.tsx`·`_logout-button.tsx` | 대회콘솔 TaShell(운영/구성 NAV·brandSub="대회 콘솔") | 신규 |
| `ta/_helpers.ts` | tournamentStatus/fmtDate(KST)/AV색 | 신규 |
| `ta/page.tsx`+`_dashboard.tsx` | 대시보드: KPI(운영중/이번달참가팀/접수대기/등록단체)+월별개최막대+최근활동(실집계·mock0) | 신규 |
| `ta/tournaments/page.tsx`+`_list.tsx` | 대회목록: 검색+상태필터칩+DataTable(정본컬럼) | 신규 |
| `ta/series/page.tsx`+`_series.tsx` | 정규대회(series·organizer_id scoped): 주기/회차/다음대회/상태 | 신규 |
| `ta/organizations/page.tsx`+`_orgs.tsx` | 단체: 멤버십기반 카드그리드(대회/운영진/회원) | 신규 |
| `ta/templates/page.tsx` | 템플릿: 백엔드모델부재→정본 Empty "준비 중"(mock0·순수서버) | 신규 |

🔑 **데이터(레거시 동일·organizer-scoped)**: 대회목록=`tournament`(super=전체/else `organizer_id` OR `adminMembers.some active`)·M3 viewer-aware 갭 교정. 정규대회=`tournament_series.organizer_id`. 단체=`organization_members(user_id+is_active)` 멤버십. 대시보드=동일 scope count/aggregate.
🔑 **jsonb verbatim(F-2b 차단)**: 서버 컴포넌트 스칼라+관계명만 select(settings/divisions/schedule_dates 미접촉). series 주기만 `settings.cadence` 단일키 verbatim 참조(재귀변환 0).
🔑 **셸 함수 직렬화**: PageHead actions/DataTable render·onRow=함수 → 서버→클라 전달불가 → 5화면 각 server page(Prisma)+client `_*.tsx`(UI) 분리(R2 패턴 동일). 템플릿만 함수 0 → 순수 서버.
⚠️ **갭/미배선(보고)**: ①주기=DB필드 부재→`settings.cadence` 있으면 표시·없으면 "—" ②단체 "대회" 통계=`_count.series`(정규대회 수·정본 라벨 유지) ③템플릿=모델 부재 Empty ④create/operate/export/site 버튼=R4/R5 스코프→준비 중 토스트(mock 0) ⑤정본 6번째 nav "내 공개 사이트"=단일 org 공개 URL 부재→생략(데드링크 0) ⑥KPI delta=과거 스냅샷 부재→생략.
💡 tester: `/v2/ta` 인증→대시보드. NAV 5화면 전환(셸 brandSub "대회 콘솔"). 대회목록 검색/상태필터. organizer 본인 대회만(super=전체). 템플릿=준비 중. 백오피스 `/v2`·`/v2/user-console`·`/v2/payments` 등 기존대로(셸/NAV 동일).
⚠️ reviewer: 백오피스 변경=rename(내용0)+href 2줄+layout 인증-only 리팩터뿐(git -M 확인). 라우트그룹 `(backoffice)` URL 비가시→URL 보존. 하드코딩hex=AV색+ad-card__logo(데이터/정본 주입·룰10). tsc EXIT0. 레거시/백엔드/DB/Prisma 0접촉.

### 구현 기록 (developer) — 라이브 유튜브 매치별 시작 타임스탬프 연결 (4파일·미커밋)
📝 박제된 `settings.youtube_start_seconds`(정수 초)를 라이브/종료 페이지 유튜브 임베드에 연결 → 영상이 매치별 시작 지점부터 재생. DB/schema 0변경(데이터는 이미 박제).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `live/[id]/_v2/youtube-embed.tsx` | `startSeconds?: number` prop 추가. `>0`이면 embedUrl에 `&start=${Math.floor(n)}` 부착(기존 autoplay/mute/modestbranding/rel 유지) | 수정 |
| `api/live/[id]/route.ts` (1472 근처) | `youtubeStartSeconds` 응답 추가(`settings.youtube_start_seconds` 숫자면 노출·아니면 0). settings 이미 select됨(period_format 등 사용 중) | 수정 |
| `live/[id]/page.tsx` | MatchDataV2에 `youtube_start_seconds?: number\|null` 추가 + 임베드 호출부 2곳(진행중 일반/PIP)에 `startSeconds={match.youtube_start_seconds ?? 0}` 전달 | 수정 |
| `live/[id]/_v2/game-result.tsx` | 인터페이스에 동일 필드 추가 + 종료후 임베드 호출부 1곳에 `startSeconds` 전달 | 수정 |

🔑 snake/camel: API 응답키 `youtubeStartSeconds`→apiSuccess 자동변환→프론트는 `youtube_start_seconds` 읽기(기존 youtube_video_id 패턴 동일). settings는 `Record<string,unknown>` 캐스팅으로 숫자 검사 후 추출.
💡 tester: youtube_video_id 박제된 매치 라이브/종료 페이지 진입 → start_seconds>0(예 U12 #2=2400)이면 영상 40:00 지점부터 재생·0이면 처음부터. VOD는 정확, 라이브(DVR)는 방송 설정에 따라 seek. 영상 미등록 매치는 임베드 영역 hidden(기존 동작 유지).
⚠️ reviewer: start 파라미터는 정수만 허용→Math.floor. startSeconds 미전달/0/음수면 부착 안 함(기존 URL 동일=회귀0). tsc EXIT0.

### 구현 기록 (developer) — R4-A 대회운영 워크스페이스 1차 (셸+요약+참가팀·신규5+수정2·미커밋)
📝 정본 operate.jsx OperateWorkspace 1:1. 특정 대회 운영 화면(자체 AdminShell·6메뉴). R4-A=셸+요약헤더+**참가팀 패널**만. 나머지5메뉴=준비중. 백엔드/DB/Prisma 0변경·레거시 0 import.

**★라우팅 — 셸 중첩 회피**: `/v2/layout`=인증only·`/v2/ta/layout`=TaShell. 운영워크스페이스는 정본=독립 AdminShell(brandSub="대회 운영")이라 TaShell 중첩 피해 **`/v2/operate/[id]`**(ta layout 밖·v2 auth 안)에 배치→자체 OperateShell 마운트.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/operate/[id]/page.tsx` | 서버: 대회별 `canManageTournament` 권한체크(미권한→`/v2/ta/tournaments` redirect·없음→notFound)+Prisma 직접 READ(tournament/teams/divisionRules/matchCount)+snake→도메인 단일매핑 | 신규 |
| `(admin-v2)/v2/operate/[id]/_operate-shell.tsx` | OperateShell(AdminShell 6메뉴 nav·client state·요약헤더 ts-ph·섹션카드 ct-section). teams=패널·나머지5=정본 Empty "준비중". 대회정보수정=R5 stub토스트 | 신규 |
| `(admin-v2)/v2/operate/[id]/_teams-panel.tsx` | 정본 TeamsPanel 1:1(종별그룹/필터칩/상태·납부·경로 ct-pill/종별현황 readiness/상세모달). 승인·거절·납부=adminFetch PATCH 기존 `/teams/[teamId]`(camel→snake·낙관적+router.refresh). 모달 선수명단=실 GET `/teams/[teamId]/players`(mock 명단 미사용) | 신규 |
| `(admin-v2)/v2/operate/[id]/_logout-button.tsx` | 셸 푸터 로그아웃(ta 복제·콘솔결합 회피) | 신규 |
| `styles/admin-v2/workspace.css` | 정본 workspace.css 중 R4-A 필요분(ct-section/headicon·ct-pill·ct-emptybox·amt-table) verbatim `[data-admin=v2]` 스코프 이식 | 신규 |
| `(admin-v2)/v2/layout.tsx` | workspace.css import 1줄 | 수정 |
| `ta/tournaments/_list.tsx` | 행클릭/운영버튼 stub토스트 → `router.push('/v2/operate/[id]')` 배선(사이트버튼=R5 토스트 유지) | 수정 |

🔑 **데이터(레거시 동일·Prisma 직접 READ)**: 참가팀=`tournamentTeam`(team relation name/logoUrl/primaryColor·`_count.players`·status/payment_status/category/manager_name/waiting_number/applied_via/applied_at). 종별=`tournamentDivisionRule`(code/label/feeKrw). 정원 cap=`tournament.div_caps` jsonb **verbatim 스칼라 lookup**(F-2b 재귀변환 0). matchCount=`tournamentMatch.count`. 권한=`canManageTournament`(organizer/adminMember active/super).
🔑 **snake→도메인 단일매핑**(서버 page.tsx): status 비표준("waiting"등)→pending 정규화(대기칩 별도), payment/via 화이트리스트, appliedAt=KST ISO, 색=primaryColor‖팔레트. 칩 톤=ct-pill(ok/info/mute/err) 매핑.
🔑 **mutation=adminFetch only**(raw fetch 0): 기존 PATCH `/teams/[teamId]`가 `payment_status`/`status` 수용→adminFetch camel→snake(`paymentStatus`→`payment_status`)·0백엔드. 자동승격 등 부수효과는 router.refresh 재조회로 정합(props→state useEffect 동기화).
⚠️ **미배선(보고·R4-B~)**: ①5메뉴(대진표/일정/운영관리/사이트/정산)=정본 nav 노출+클릭 시 Empty "준비중"(mock 0) ②토큰 파일받기/재발급·선수 일괄입력/추가=준비중 토스트(엔드포인트 배선 후속) ③대회정보수정=R5(생성/수정 마법사)→stub토스트 ④사이트 버튼(목록)=공개사이트 트랙→토스트 유지.
💡 tester: 대회목록 행클릭/운영→`/v2/operate/[id]`(권한체크). 요약헤더(이름/기간/장소/상태/팀수·종별/경기수)+참가팀 패널(종별그룹·필터·승인/거절·납부변경·상세모달 실명단). 0팀→정본 Empty. 5메뉴 클릭=준비중. 권한없는 대회 직접URL→목록 redirect. 백오피스/ta 셸/목록 기존대로(_list만 배선).
⚠️ reviewer: tsc EXIT0. 셸 중첩0(operate=ta layout 밖). workspace.css 전셀렉터 [data-admin=v2] 스코프(레거시 충돌0)·하드코딩hex=팔레트 폴백(데이터 주입). 모달 inline(portal X)→data-admin 스코프 내. 회귀=백오피스/ta 무접촉·_list 배선+layout css 1줄+신규5. 백엔드/DB/Prisma 0변경·레거시 0 import.

### 구현 기록 (developer) — R4-B 대회운영 대진표 패널 (신규1+수정4·미커밋)
📝 정본 `bracket.jsx`(window.BracketPanel · full) 1:1 포팅. R4-A 운영 워크스페이스 "대진표" 메뉴(준비중)→실 BracketPanel 교체. **정본은 전부 클라 mock**(WS 인메모리·`window.__BRACKET` 이벤트)이지만 **실 백엔드 엔드포인트 전부 실존** → 실데이터 READ(Prisma 직접) + 실 mutation 배선. 백엔드/DB/Prisma 0변경·레거시 0 import.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `operate/[id]/_bracket-panel.tsx` | 정본 BracketPanel 포팅. 상태(config/seeding/grouped/drawn)=실데이터 파생·종별칩·대회방식조설정카드(읽기전용)·조편성컨트롤·시드배정UI·조편성결과(실 group)·토너먼트트리(실 matches·bk-* 92px/연결선)·Empty | 신규 |
| `operate/[id]/page.tsx` | READ 확장: tournament.format·team seed/group 필드·ruleRows(id/format/settings)·matchRows(트리·homeTeam/awayTeam 이름·settings verbatim)·bracket_versions count. snake→도메인 camel 단일매핑+jsonb 스칼라 lookup(F-2b) | 수정 |
| `operate/[id]/_operate-shell.tsx` | bracketData prop·menu==="bracket"→BracketPanel 배선(나머지 4메뉴 Empty 유지) | 수정 |
| `lib/admin-v2/data/client.ts` | adminFetch `rawBody` 옵션 추가(camelCase 계약 엔드포인트용 body 변환 우회·additive·기존 호출부 무영향) | 수정 |
| `styles/admin-v2/workspace.css` | 정본 bk-*(트리/연결선/조/슬롯/시드/듀얼)+sc-del verbatim `[data-admin=v2]` 스코프 append(셀 92px·`#fff`→var(--card) M2선례·rgba 그림자 유지) | 수정 |

🔑 **데이터 source(레거시 동일·Prisma 직접)**: 종별=`tournamentDivisionRule`(format·settings.group_count/group_size/advance_per_group jsonb 스칼라). 팀시드=`tournamentTeam`(seedNumber/groupName/group_order·status=approved). 트리=`tournamentMatch`(round_number/bracket_position/group_name/next 없이 round 그룹핑·homeTeam/awayTeam.team.name·winner_team_id·settings.division_code). 종별↔매치 매핑=`settings.division_code===code`(단일룰=전체 폴백·레거시 matchesForRule 동일). 버전=`tournament_bracket_versions.count`(maxFree=3).
🔑 **재사용 mutation 엔드포인트(실존·계약확인·신규0)**: 추첨/시딩=`POST /api/web/admin/tournaments/[id]/division-draw`(**camelCase zod** divisionCode/groupCount/groupSize/mode/seedAssignments[{teamId,slot}] → adminFetch `rawBody:true` 로 snake 변환 우회). 발행(일정반영)/재생성=`POST /.../division-rules/[ruleId]/generate`({clear} — 단어1개라 변환무해·일반 adminFetch). 둘 다 성공 후 `router.refresh()`(실데이터 재조회→상태 자동 전환).
⚠️ **snake/camel 역함정(해소·중요)**: division-draw zod는 **camelCase** body 요구인데 adminFetch는 camel→snake 자동변환→그대로면 `division_code`로 보내 parse 실패. 데이터계층(client.ts)에 `rawBody` 우회옵션 추가로 흡수(raw fetch 0 유지). 일반 web API(snake 계약)는 평소대로.
⚠️ **의도적 deviation(보고)**: ①config 카드=읽기전용 표시(format/조설정 편집=생성/수정 마법사 R3/R5 스코프. 편집 시 draw/generate 설정 불일치 방지). ②실 트리 드래그 스왑 미배선(정본 mock 전용·실 재배치 엔드포인트 없음→'다시 추첨'/'다시 생성'으로 대체). ③single_elimination 시드배정 UI 생략(조 슬롯 부재·랜덤만). ④듀얼 전용 bk-dualrow 시각=실 매치는 일반 조카드+트리로 렌더(정본 dualrow는 mock 전용).
💡 tester: `/v2/operate/[id]` 대진표 메뉴→종별칩 전환. **미생성**(조·매치 없음)→config 카드+Empty "아직 조편성 전입니다"(2팀 미만이면 안내). **완전 랜덤 추첨**→division-draw→조 편성 결과(실 group). **일정에 반영**→generate→토너먼트 트리(실 matches·8강/4강/결승·완료매치 스코어/승자강조). 시드배정(조포맷)→슬롯 클릭 팀배정→시드완료. 재추첨/다시생성. 권한없는 대회 직접URL→목록 redirect(R4-A). 참가팀/요약/다른 4메뉴 기존대로.
⚠️ reviewer: tsc EXIT0. bk-* 전셀렉터 [data-admin=v2] 스코프·셀 92px·하드코딩hex0(rgba 그림자=정본 중립). client.ts rawBody=additive(teams-panel 등 기존 호출부 무영향). 회귀=R4-A page.tsx READ 확장(matchCount=count()→matchRows.length 동일값·나머지 additive)·셸 배선만. 레거시/백엔드/DB/Prisma 0변경·raw fetch 0.

### 구현 기록 (developer) — R4-C 대회운영 일정 패널 (신규1+수정3·미커밋)
📝 정본 `schedule.jsx`(window.SchedulePanel) 1:1 포팅. R4-A 운영 워크스페이스 "일정" 메뉴(준비중)→실 SchedulePanel 교체. **정본은 전부 클라 mock**(WS.form.venues/dates·`window.__BRACKET`·round-robin)이지만 실 백엔드 데이터 존재 → 실데이터 READ(Prisma 직접) + 정본 sc-* 마크업/CSS 1:1. **★snake함정 8회 영역**: 일정 데이터=서버 Prisma 직접 READ로 apiSuccess(snake) 미경유 → 함정 원천 차단.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `operate/[id]/_schedule-panel.tsx` | 정본 SchedulePanel 포팅. 코트×날짜 레인·종별경기시간/코트시작시간 그리드·일정표(amt-table sc-table·드래그/휴식/드롭테일)·AutoModal(자동배치)·ManualModal(직접배치·풀+드롭). 실 matches 시드 | 신규 |
| `operate/[id]/page.tsx` | matchRows select에 `scheduledAt/court_number/venue_name` **3필드 additive**+tournament `places/schedule_dates`. ScheduleData 매핑(scheduledAt→KST date/time 파생·places/schedule_dates 정규화) | 수정 |
| `operate/[id]/_operate-shell.tsx` | scheduleData prop·menu==="schedule"→SchedulePanel 배선(나머지 3메뉴 Empty 유지) | 수정 |
| `styles/admin-v2/workspace.css` | 정본 sc-*(레인/durgrid/일정표/divtag/divchip/automx/manbar/manwrap/poolcard/manitem) `[data-admin=v2]` 스코프 append(sc-del 중복제외·`#fff`→var(--card)) | 수정 |

🔑 **★snake 필드 매핑(camel/snake 혼재 — 정확 처리)**: page.tsx Prisma 직접 READ → 모델 TS 필드명 그대로 읽음 = `m.scheduledAt`(**camel** @map scheduled_at)·`m.court_number`(**snake** TS필드)·`m.venue_name`(**snake**)·`m.round_number`/`m.match_number`/`m.group_name`(snake)·`m.roundName`(camel). 서버에서 camel 도메인(`scheduledDate`/`scheduledTime`/`courtNumber`/`venueName`)으로 **단일 매핑**→패널은 camel만 봄. 과거 matches-panel처럼 apiSuccess 응답(snake)을 camel 오접근하던 함정 = 본 경로엔 부재(Prisma 직접). self-trace: scheduledAt 있는 경기→KST date 파생→레인 생성+assign 시드→레인 표시(미배치 오판 0). ✅
🔑 **데이터 source(Prisma 직접·신규쿼리0)**: 경기=기존 `matchRows`(R4-B와 동일 쿼리·3필드만 additive). 장소=`tournament.places`(jsonb `[{id,name,courtCount,naming}]`→레거시 normalizeVenues 패턴). 일정=`tournament.schedule_dates`(jsonb `[{id,date,courtIds[]}]`·courtIds/court_ids 호환). 종별=`ruleRows`(code/label). 레인=설정(places×schedule_dates) ∪ 실 배치경기 좌표(date·venue·court)→배치경기 항상 표시.
⚠️ **mutation 재사용/미배선(보고)**: 일정 영속화 = **미배선(stub)**. **bulk 일정저장 엔드포인트 부재**(DATA-CONTRACT §2 🔴: divDur/laneStart/assign 저장필드 없음). 정본도 저장 없음(전부 "시연" 토스트). per-match PATCH `/api/web/tournaments/[id]/matches/[matchId]`는 **실존**(zod 없이 req.json 직접 구조분해·**혼합케이스** `scheduledAt`camel+`venue_name`/`court_number`snake → 배선 시 반드시 `rawBody:true`+정확키)하나, 정본의 "시작시간+종별시간 파생" bulk 모델에 매핑 시 기존 scheduledAt **손실(lossy)** → R4-B 드래그 미배선과 동일 판단으로 미배선. 계획 조작(자동/수동/드래그/휴식/시간)=클라 미리보기. 패널에 "저장 연동 준비 중·개별 경기는 경기관리에서 수정" 안내 명시.
⚠️ **의도적 deviation(보고)**: ①영속화 미배선(위). ②정본 "추첨결과 반영(팀명 표기)" 토글 생략 — 실 매치는 실 팀명 보유(슬롯라벨 개념 없음·미정="미정" 상시표기). ③레인 식별=정본 cid 합성키(`v_1_c0@dt`) 대신 실 좌표(date·venue·court) — 실 court_number/venue_name이 합성키와 무관하므로(데이터 로직 적응·마크업/className 1:1 유지).
💡 tester: `/v2/operate/[id]` 일정 메뉴→경기시간/코트시작 그리드. **배치경기 있으면**(scheduledAt 보유)→코트별 일정표에 자동 표시(시간·종별·홈/어웨이·경기번호). **미배치**→"아직 배치된 일정이 없습니다"+자동/직접 배치. **일정 자동 배치**→모달서 코트별 종별·예선/토너먼트 배정→배치(미리보기). **직접 배치**→종별/날짜/코트 선택+미배치 풀 드래그. 휴식 삽입/드래그 재정렬/초기화. ★새로고침 시 계획 초기화(영속화 미배선·정본 mock 동일)·실 배치경기는 항상 재표시. 참가팀/대진표/요약·다른 메뉴 회귀0.
⚠️ reviewer: tsc EXIT0. sc-* 전셀렉터 [data-admin=v2] 스코프·sc-del 중복0·하드코딩hex0(#fff→var(--card)). page.tsx=matchRows 3필드+tournament 2필드 additive(R4-A/B READ 무영향·matchCount 동일). 레인 fallback("장소 미지정"/"1") 3곳(lanes/laneStart/assign 시드) 일치. 백엔드/DB/Prisma 0변경·레거시0 import·raw fetch0.

### 구현 기록 (developer) — R4-D 대회운영 운영관리+사이트+정산 (신규3+수정3·미커밋·R4 완료)
📝 정본 operate.jsx(OpsManage/Settle)·panels-ops.jsx(SitePanel) 1:1 포팅. 운영 워크스페이스 "운영관리/사이트/정산" 메뉴(준비중)→실 패널 교체 = **R4 대회운영 6메뉴 완성**. 정본 전부 클라 mock이나 실 백엔드 전부 실존 → 실데이터 READ(Prisma 직접)+실 mutation(adminFetch 기존 엔드포인트). 백엔드/DB/Prisma 0변경·레거시 0 import·raw fetch 0.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `operate/[id]/_ops-panel.tsx` | OpsManage 1:1. 정규대회연결(읽기+위임)/운영인력(운영진·기록원·심판)/공지(단건)/기록모드. 모달=HrModal(AdminsManager·RecordersManager·심판위임)/NoticeModal/RecordModeModal | 신규 |
| `operate/[id]/_settle-panel.tsx` | Settle 1:1. 입금/지출/잔액 KPI·종별 참가비카드(set-divcard)·지출현황(set-exprow)·종별상세모달(팀별 납부)·ExpenseModal | 신규 |
| `operate/[id]/_site-panel.tsx` | SitePanel(Toss 관리화면). 발행상태 배너·방문하기·주소(subdomain)·대표색(color input)·설정저장·공개/비공개 | 신규 |
| `operate/[id]/page.tsx` | READ 확장: tournament.settings(notice/default_recording_mode verbatim 스칼라)·series_id+tournament_series.name·tournament_expense findMany·tournamentSite findFirst. OpsData/SettleData/SiteData 매핑 | 수정 |
| `operate/[id]/_operate-shell.tsx` | opsData/settleData/siteData prop·ops/site/settle 메뉴→실 패널 배선(Empty 제거) | 수정 |
| `styles/admin-v2/workspace.css` | 정본 ops-*/set-* + ts-textarea(미정의분) `[data-admin=v2]` 스코프 append(#fff→var(--card)) | 수정 |

🔑 **재사용 mutation 엔드포인트(실존·계약확인·신규0)**: 운영진=`/api/web/tournaments/[id]/admins` GET/POST`{email,role}`/DELETE`[adminId]`(requireTournamentAdmin=organizer접근·**/admin/admins는 super-only라 회피**). 기록원=`/api/web/tournaments/[id]/recorders` GET/POST`{email}`/DELETE`{recorderId}`(**rawBody:true**·route가 body.recorderId raw읽음)/auto-assign POST`{overwrite}`. 기록모드=`/api/web/admin/tournaments/[id]/recording-mode/bulk` POST`{mode,scope:"new_only",reason}`(canManageTournament·mode flutter/paper/manual·reason필수). 공지=PATCH`/api/web/tournaments/[id]`{settings:{notice}}(단일string). 지출=`/api/web/tournaments/[id]/expenses` GET(서버READ)/POST`{label,amount,category,memo}`/DELETE`[expenseId]`. 사이트=PATCH`/api/web/tournaments/[id]/site`{subdomain,primaryColor}(**rawBody:true**·route가 body.primaryColor camel raw읽음)·발행 POST`/site/publish`{publish}.
🔑 **데이터 source(Prisma 직접·신규쿼리 additive)**: 공지/기본기록모드=`tournament.settings` jsonb 스칼라 lookup(notice/default_recording_mode·F-2b 재귀변환0). 정규대회=`series_id`+`tournament_series.name`. 지출=`tournament_expense`(PR-2 테이블). 사이트=`tournamentSite`(subdomain/isPublished/primaryColor/site_name/siteTemplateId). 입금=기존 teams(paid)×rules(feeKrw).
🔑 **기록모드 매핑**: 정본 full/stat/manual → 실 enum flutter/paper/manual(id=실enum·라벨/태그/아이콘 정본 verbatim). scope="new_only"(기본값 변경+override없는 매치만=정본 "기본설정·매치별변경" 의미보존).
⚠️ **의도적 deviation(보고)**: ①정규대회 연결=읽기칩+위임(연결변경/생성은 series-admin 단일진실=레거시 ops-panel 동일). **LeagueCreateModal(정본 org+league 생성체인)=운영워크스페이스용 백엔드 부재→미배선·위임**(mock금지). ②공지=settings.notice 단일string(배열아님)→등록시 교체. **푸시발송=백엔드 미구현→비활성 안내**(레거시 동일). ③**심판=대회별 배정모델/엔드포인트 부재→"심판관리자에서 배정" 위임 모달**(읽기). ④사이트 **템플릿 갤러리=실 카탈로그 엔드포인트 부재→생략**(핵심 주소/색/발행/방문만 실배선)·색=네이티브 color input(실 primaryColor·하드코딩 팔레트 회피·DEFAULT_COLOR `#E53E3E`=primary_color 스키마 기본값). 발행게이트 실패=서버 메시지표시(누락항목 상세는 adminFetch extra 미추출). ⑤정본 org승인 노출차단(window.__exposureBlocked)=실 org승인 게이트 부재→생략. ⑥기록원 경기별 개별배정 select=실 per-match 엔드포인트(/matches/[id]/recorder) 존재하나 R4-D 스코프外→자동배정만 배선(개별=경기관리 안내·보고).
💡 tester: `/v2/operate/[id]` 운영관리→운영진/기록원 추가·제거(실 이메일)·자동배정·심판위임·공지 등록/수정/삭제·기록모드 설정. 정산→입금/지출/잔액 KPI·종별카드 클릭 팀별 납부변경·지출 추가/삭제. 사이트→주소/색 설정저장·공개/비공개·방문하기(미발행시 게이트 메시지). 권한없는 대회 직접URL→목록 redirect(R4-A). 참가팀/대진표/일정/요약·백오피스/ta 회귀0.
⚠️ reviewer: tsc EXIT0. ops-*/set-*/ts-textarea [data-admin=v2] 스코프·#fff→var(--card). raw fetch0(전부 adminFetch/Prisma)·레거시0 import(정본경로는 주석만). 하드코딩hex=DEFAULT_COLOR 1건(스키마 기본값·문서화). rawBody:true=recorders DELETE·site PATCH(camel계약 2곳). 회귀=page.tsx READ additive·셸 배선만(teams/bracket/schedule 무접촉). **R4 대회운영 완료**(6메뉴 전 실패널).

### 구현 기록 (developer) — R5-A 대회 생성 마법사 (신규2+수정2·미커밋)
📝 정본 workspace.jsx(TournamentWorkspace mode="create") 5단계 마법사 박제. R3 "새 대회 만들기" stub→실 마법사 배선. **백엔드/DB/Prisma 0변경 — 기존 생성 엔드포인트 `POST /api/web/tournaments` 재사용**(레거시 wizard 와 동일). 레거시 0 import.

**★생성 API 계약(실측·신규0)**: `POST /api/web/tournaments`(route.ts 141~279·withWebAuth). body=**camelCase**(raw destructure·**zod 없음**)·**필수=`name`만**(나머지 미전송=서버 default). 키: name/format/organizer/host/sponsors/description/startDate/endDate/registrationStartAt/registrationEndAt/places/scheduleDates/gameRules/categories/divCaps/divFees/entryFee/bank*/feeNotes/autoApproveTeams/allowWaitingList/teamSize/rosterMin/rosterMax/rules/prizeInfo/gameBall/settings/seriesId. 응답=`apiSuccess({success,tournamentId,redirectUrl})`→snake `{success,tournament_id,redirect_url}`. **→ adminFetch `rawBody:true`(camel 계약·R4-B 선례)로 verbatim 전송, 응답은 자동 snake→camel(`tournamentId`/`redirectUrl`)**. 종별 계약(division-rule-sync.ts): categories `{종별명:[종별명]}`·divCaps/divFees `{종별명:n}`·tournament-level `format` 1개를 전 종별에 적용.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/ta/tournaments/new/_create-wizard.tsx` | 정본 5단계(info/schedule/divisions/game/publish) 클라 마법사. tw-steps 네비+ct-progress+ts-card 폼+tw-foot. 종별 CRUD·장소/일정 입력·gameRules 컴팩트·검토요약. 제출=adminFetch POST(rawBody)→성공 시 `/v2/operate/[newId]` | 신규 |
| `(admin-v2)/v2/ta/tournaments/new/page.tsx` | 서버 래퍼(인증=부모 v2/ta layout·데이터0)→`<CreateWizard/>` | 신규 |
| `styles/admin-v2/workspace.css` | 정본 생성폼 클래스(ct-progress/tw-steps/tw-step/ct-form/ct-form-grid/ct-group-title/ct-checkrow/ct-stepper/ct-segsm/ct-venuerow/ct-courtpick/ct-dateblock/ct-adddate/ct-divgrid/tw-foot/tw-msg) `[data-admin=v2]` 스코프 append(#fff→var(--card)) | 수정 |
| `(admin-v2)/v2/ta/tournaments/_list.tsx` | "새 대회 만들기" stub토스트 → `router.push('/v2/ta/tournaments/new')`(1줄) | 수정 |

⚠️ **의도적 deviation(보고·mock 금지 룰 준수)**: ①정본 ScheduleVenue **하드코딩 체육관 DB**(장충체육관 등)·CalendarModal=mock→**실 입력**(장소명 직접 입력·date 입력)으로 대체. ②정본 CategoryModal **성별/종별 템플릿/연령 자동채움**(mock 템플릿 의존)·GameSettings **프리셋(localStorage)**·**대회복사(copyableTournaments)**=mock→미포팅. 종별=직접 추가(종별명/정원/참가비)·**각 종별 독립**(category=label·그룹핑 생략). ③정본은 자체 AdminShell+사이드바 step nav(brandSub="새 대회 만들기")이나 ta 콘솔 셸 안이라 **2차 셸 미사용**(중첩0)→tw-steps 인라인 네비+ct-progress(PM의 StepDots 의도 충족·정본 step nav와 1:1). ④format=**tournament-level 1개**(divisions 단계 상단 select·6 enum)→전 종별 적용(정본 per-division override=생성 후 operate 스코프). ⑤maxTeams/대표이미지/후원사 로고=미수집(서버 default·로고 백엔드 부재).
🔑 **mutation=adminFetch only(raw fetch 0)**·jsonb verbatim: places=camel `courtCount`(operate R4-C 읽기 정합)·scheduleDates=`court_ids` snake(정본 ct-create 계약·operate court_ids/courtIds 호환). rawBody:true라 키 verbatim.
💡 tester: `/v2/ta/tournaments`→"새 대회 만들기"→마법사. 5단계(이전/다음/스텝클릭)·종별 0개면 검토단계 경고+생성 차단. 대회명만 필수. 생성→`/v2/operate/[newId]`. **실제 생성은 사용자 테스트**(계약 self-check만·운영DB 깨진 대회 방지). 권한=POST hasCreatePermission 서버 재검증.
⚠️ reviewer: tsc EXIT0. 신규 CSS [data-admin=v2] 스코프(레거시 충돌0·#fff→var(--card)). 회귀=_list 배선1줄+CSS append+신규2(백오피스/operate/ta 무접촉). 백엔드/DB/Prisma/API 0변경·레거시0 import·raw fetch0. 다음=R5-B 수정 마법사(workspace.jsx mode=edit·operate "대회정보수정" stub 배선)·심판.

### 구현 기록 (developer) — R5-B 대회 수정 마법사 (신규2+수정3·미커밋)
📝 정본 `대회 수정.html`(TournamentWorkspace mode="edit") 5단계 마법사 박제. R4 operate "대회 정보 수정" stub토스트→실 edit 마법사 배선. **백엔드/DB/Prisma/API 0변경 — 기존 PATCH/DELETE `/api/web/tournaments/[id]` 재사용**. R5-A 생성폼 프리미티브/타입/CSS 전면 재사용. 레거시 0 import.

**★PATCH 계약(실측·신규0·★혼합 케이스★)**: `PATCH /api/web/tournaments/[id]` = `updateTournamentSchema`(Zod·`.partial()`). 키 케이스 **혼합** — **camel**: name/format/startDate/endDate/organizer/host/sponsors/categories / **snake**: venue_*/team_size/roster_min·max/entry_fee/registration_start·end_at/prize_info/is_public/auto_approve_teams/div_caps/div_fees/allow_waiting_list/bank_*/fee_notes/game_ball/game_rules/places/schedule_dates/settings/series_id. **→ blanket camel→snake 금지(혼합이라 깨짐)** → adminFetch `rawBody:true` 로 정확 키 verbatim 전송. 응답=updated row(snake→camel 자동·미사용). **DELETE**=soft(status=cancelled·requireTournamentAdmin)·hard(`?hard=1` super). 확인모달+실 endpoint 배선.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/v2/ta/tournaments/[id]/edit/_edit-wizard.tsx` | 정본 mode=edit 5단계 클라 마법사. prefill 폼+dirty(JSON 비교 baseline)+저장바(저장/취소/저장하고완료)+삭제 확인모달. buildPatchBody=★혼합 케이스 정확 매핑(rawBody). 저장=PATCH→성공 시 saved 갱신/operate 복귀. 삭제=DELETE soft. R5-A 프리미티브(Field/Stepper/SegSm/VenueAdd/DateAdd/ReviewRow/FORMAT_LABEL/fmtDate/won/타입) import 재사용 | 신규 |
| `(admin-v2)/v2/ta/tournaments/[id]/edit/page.tsx` | 서버 컴포넌트. canManageTournament 대회단위 권한+Prisma 직접 READ(jsonb verbatim)→FormState prefill 매핑(categories→divisions·places→venues·schedule_dates→dates·game_rules camel→5필드·reg datetime UTC slice). rawPlacesById/rawGameRules 원본 전달(저장 시 보존) | 신규 |
| `(admin-v2)/v2/ta/tournaments/new/_create-wizard.tsx` | 재사용 프리미티브/타입/상수에 `export` 추가(**additive·로직 0변경**·생성폼 회귀0) | 수정 |
| `(admin-v2)/v2/operate/[id]/_operate-shell.tsx` | EditTournamentButton: toast stub → `router.push('/v2/ta/tournaments/[id]/edit')`(useRouter 추가·useAdminShell 미사용 import 정리). 그 외 셸/패널 무접촉 | 수정 |

🔑 **데이터 보존(운영 대회 깨짐 방지)**: ①places=폼 미수집 원본필드(lat/lng/address/mapUrl/provider)를 id 매칭 spread 보존 후 편집필드 오버레이 ②game_rules=원본 jsonb 위 5편집필드만 오버레이(clockMode/shotClock/타임아웃 등 고급필드 보존·서버 normalizeGameRules 명시값 우선) ③venue/date jsonb id 보존(court id `${id}_c${n}` 참조 무결성) ④reg datetime=UTC slice(라운드트립 정확·미변경 저장 시 시간 안 밀림) ⑤status/series_id/색상/이미지/maxTeams=5스텝 범위 밖→미전송(기존값 보존).
💡 tester: operate "대회 정보 수정"→`/v2/ta/tournaments/[id]/edit`(기존값 prefill)→수정→저장(PATCH)/저장하고완료(operate 복귀)·삭제(확인모달→soft cancelled). dirty="변경사항 있음/없음". **실 저장/삭제는 사용자 테스트**(계약 self-check만·운영 대회 손상 방지). 권한=PATCH/DELETE requireTournamentAdmin 서버 재검증.
⚠️ reviewer: tsc EXIT0. 회귀=create-wizard export만(로직0)+operate 버튼 배선1곳. 백엔드/DB/Prisma/API 0변경·레거시0 import·raw fetch0(adminFetch only). **알려진 한계**: 폼 venue/division 모델=R5-A 단순화(정본 ScheduleVenue/CategoryModal mock 제외 동일)→레거시 리치 종별룰(연령/디비전 tier)은 PATCH가 categories/div_caps/div_fees jsonb만 갱신(tournamentDivisionRule row 미변경=PATCH 엔드포인트 기존 동작). 다음=심판/협력업체.

### 구현 기록 (developer) — R5-A 보강: 종별 템플릿/연령 자동채움 + 대회 복사 (신규2+수정4·미커밋)
📝 R5-A 신고 2건 해소: ①종별 단순화(종별명/정원/참가비 평면) → **레거시 ct-divisions.tsx 충실 포팅**(AdminCategory 템플릿·연령코드·곱집합 생성) ②대회 복사 부재 → **서버 ?copyFrom prefill**. **백엔드/DB/Prisma/API 0변경**(기존 생성계약·AdminCategory GET 재사용·새 API 0). 레거시 0 import.

**★연령 자동채움 계약(실측·핵심)**: 생성 POST는 연령(출생연도/학년)을 **직접 받지 않음**. `createTournament`(tournament.ts L591~644)가 `AdminCategory.ages`를 읽어 `computeAgeRangeForDivision`으로 **생성 트랜잭션에서 자동 계산·`tournamentDivisionRule`에 저장**. 조건=①종별명이 AdminCategory.name과 매칭(서버가 "남성/여성 " 접두 제거)·②디비전명에 연령코드(U12 등) 토큰 포함. **→ 그린필드가 연령을 잃은 진짜 원인=`categories[label]=[label]` 평면구조(AdminCategory 매칭 실패)**. 명시적 출생연도/학년 입력+자동채움 버튼은 **생성 후 EDIT 패널**(`[ruleId]` PATCH·divisions-panel.tsx) 기능(생성 계약엔 연령 필드 없음→생성마법사는 구조만 정확히 보내면 서버가 채움).

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `new/_divisions-editor.tsx` | **DivisionGenerator**(성별/AdminCategory템플릿/디비전/연령코드 4단계·여성 w접미·디비전×연령 곱집합→디비전명 "i3 U12"·종별명 "남성 유청소년")+**DivisionsEditor**(종별 그룹카드·직접/템플릿 추가). 템플릿=`adminFetch GET /api/web/admin/categories`(super-only·비-super는 빈목록+직접추가 폴백). 양 마법사 공용 | 신규 |
| `new/_form-prefill.ts` | 서버 헬퍼: `divisionsFromTournament`(categories jsonb→디비전 **그룹 펼침**·category 태깅)+`buildCopyForm`(대회→복사폼·이름/일정/접수기간 비움) | 신규 |
| `new/_create-wizard.tsx` | DivisionRow+`category?`·DivisionsEditor 사용·**페이로드 종별 그룹핑**(category→categories={종별명:[디비전]})·복사 props(initialForm/copyableList/copiedFromName)+복사 피커 모달+안내배너 | 수정 |
| `[id]/edit/_edit-wizard.tsx` | DivisionsEditor 사용(addDivision 등 제거)·PATCH 페이로드 종별 그룹핑(생성과 동일) | 수정 |
| `[id]/edit/page.tsx` | 종별 prefill = `divisionsFromTournament`(그룹 펼침·헬퍼). entry_fee Decimal→Number() 정규화(pre-existing 타입오류 동반 수정) | 수정 |
| `new/page.tsx` | 서버: organizer-scoped 복사목록(Prisma 스칼라)+`?copyFrom` 1건 READ(canManageTournament 권한)→buildCopyForm prefill→CreateWizard props | 수정 |

🔑 **종별 라운드트립 보존**: 구 그린필드 `{디비전명:[디비전명]}`(category=undefined·solo)·레거시 `{종별명:[디비전,...]}`(category 태깅) 둘 다 그룹 펼침→편집→재그룹핑으로 동일 복원. 레거시 그룹 대회가 그린필드 edit에서 1디비전으로 잘못 보이던 **잠복버그도 동반 수정**(개선).
🔑 **대회 복사 동작(0 새 API)**: 클라 복사버튼→피커(copyableList)→`router.push(?copyFrom=id)`→서버 재진입→Prisma READ+권한검증→buildCopyForm(이름/일정/접수 비움·종별/경기설정/장소/접수설정 복사)→폼 prefill. 레거시 `tournament-copy-modal.tsx`는 의존 API 부재로 작동불가였음(미사용).
⚠️ **한계/보고**: ①AdminCategory GET=super_admin 전용(레거시 동일 제약)→비-super 운영자는 템플릿 빈목록+직접추가만(연령 자동채움도 super 운영자 경로). ②per-디비전 경기날짜/코트 매칭(레거시 settings.div_schedule)=미포팅(운영 워크스페이스 일정에서 처리·스코프 집중). ③명시적 연령 미세조정=생성 후 division-rules EDIT 패널(별도·R4 operate 잔여).
💡 tester: `/v2/ta/tournaments/new`→**템플릿 추가**(성별/종별/디비전/연령 선택·연령은 ages 있는 종별만)→곱집합 디비전 생성·그룹카드. **직접 추가**=단독 디비전. **기존 대회 복사** 버튼→피커 선택→설정 prefill(이름/일정 비움). 수정 마법사도 동일 종별 에디터. **실 생성/연령 저장은 사용자 테스트**(계약 self-check만·운영DB 보호). 회귀=생성/수정 종별 라운드트립·복사 prefill.
⚠️ reviewer: `cmd /c npx tsc --noEmit --incremental false` **EXIT0**(PM 재확인). raw fetch0(adminFetch/Prisma only)·레거시0 import(ct-divisions는 읽고 새작성)·백엔드/DB/Prisma/API 0변경. CSS 신규0(기존 ts-segment/ts-chip/ct-* admin-v2 재사용). 하드코딩hex0.

### 구현 기록 (developer) — R6-A 협력업체 콘솔 (대시보드/내시설/캠페인·신규13·미커밋)
📝 정본 `협력업체 콘솔.html`/`partner-pages.jsx`/`partner-data.jsx`(PartnerApp) 1:1. 파트너 페르소나 3화면(정산 제외). **백엔드/DB/Prisma/API 0변경 · 레거시 0 import · raw fetch 0**(mutation 0=정본 시연 전부 준비중 토스트).

🔑 **★아키텍처 결정(인증)**: 파트너 인증=`partner_members`(is_active) — **tournament-admin 아님**. `/v2/layout.tsx`(membershipType≥3/super 게이트)에 올리면 진짜 파트너 차단 → **별도 라우트 `(admin-v2)/partner/`**(URL `/partner`·충돌0·레거시는 `/partner-admin`) + **자체 파트너 인증 layout**. CSS도 partner/layout에서 admin-v2 import(세그먼트 스코프). 권한=파트너 본인(partner_members) OR super bypass·미소속 비-super→no_permission redirect.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `(admin-v2)/partner/layout.tsx` | 파트너 인증(getWebSession+partner_members is_active+super)+buildLoginRedirect+admin-v2 CSS import+PartnerShell+nav 배지 실카운트 | 신규 |
| `partner/_partner-shell.tsx` | PartnerShell(AdminShell 협력 NAV·route 기반·운영/마케팅/정산·brandSub="협력업체 콘솔") | 신규 |
| `partner/_partner-data.ts` | getPartnerContext(partnerId/ownerId 스코프)+표시헬퍼(fmtDate/Period/campaignStatus/placementLabel/courtType·Status/operatingHours/ctrPct) | 신규 |
| `partner/_logout-button.tsx` | 로그아웃(복제·자기완결) | 신규 |
| `partner/page.tsx`+`_dashboard.tsx` | 대시보드: Prisma 집계 KPI4(등록시설/운영캠페인/캠페인노출/평균CTR)+월별신규캠페인 막대+최근활동. **과금·정산·delta 제외** | 신규 |
| `partner/venues/page.tsx`+`_venues.tsx` | 내 시설: court_infos(user_id==owner_id) READ→SchemaList(정본 PT_VENUES)·읽기 드로어 | 신규 |
| `partner/campaigns/page.tsx`+`_campaigns.tsx` | 캠페인: ad_campaigns(partner_id) READ→SchemaList(정본 PT_CAMPAIGNS·노출/클릭률)·행→상세 | 신규 |
| `partner/campaigns/[id]/page.tsx`+`_detail.tsx` | 캠페인 상세: IDOR(partner_id==ctx or super)+KPI3(노출/클릭/CTR·과금제외)+placements 패널 | 신규 |
| `partner/settle/page.tsx` | 정산 준비중 Empty(R6-C 대기·정본 mock 박제 금지) | 신규 |

🔑 **데이터 source**: 대시보드/시설/캠페인 전부 서버 Prisma 직접 READ(stats API 미경유=snake 함정 원천차단). operating_hours=jsonb verbatim(string만 읽음). 데이터 0행→0/빈막대/SchemaList Empty(mock0). 과금(budget/spent/pricing)=통계만, 표시0.
⚠️ **갭/미배선(보고)**: ①내시설 월예약/가동률=예약 집계 미배선→"—" ②시설 편집=PATCH venue 엔드포인트 실재나 정본 협력콘솔에 폼 없음(레거시 별도)→읽기+드로어(R6 후속) ③캠페인 생성/수정/일시중지=정본 시연→준비중 토스트 ④상세 주차별 노출 막대=시계열 부재→placements만 ⑤정산=R6-C ⑥시설등록 addLabel 생략(자가등록 불가) ⑦super 무소속=빈 컨텍스트.
💡 tester: `/partner` 대시보드·`/partner/venues`·`/partner/campaigns`(행→상세)·`/partner/settle`(준비중). 파트너 미소속 비-super→로그인. 데이터0→빈상태(정상). 백오피스/ta/operate/마법사 회귀0.
⚠️ reviewer: tsc EXIT0(PM 재확인). git=신규13파일만(기존 src 수정0=구조적 회귀0)·raw fetch0(Prisma·logout만 예외=기존패턴)·레거시0·백엔드/DB/Prisma/API 0변경·하드코딩hex0(AV=데이터주입). 다음=R6-B 심판·R6-C 정산 신규모델.

### 구현 기록 (developer) — R6-B 심판 콘솔 (글로벌 super·6화면·신규22·미커밋)
📝 정본 `referee-pages.jsx`/`referee-data.jsx`(RefereeApp·12 nav) 1:1. **글로벌 super-admin 페르소나**(레거시 협회별 심판 admin과 별개). 백엔드/DB/Prisma/API 0변경·레거시 0 import·raw fetch 0(logout만 예외=기존패턴).

**★아키텍처 — 라우트 URL(중요)**: 프롬프트 예시 `/referee`는 **레거시 `(referee)/referee/`가 점유 → 빌드 충돌** → `(admin-v2)/referee-console/` URL **`/referee-console`** 채택(R6-A `/partner`와 동일 별도 라우트·CSS 세그먼트 스코프). 인증=`getWebSession`→`isSuperAdmin(session)` only(전역·협회 멤버십 불요). 비-super→`/login?error=no_permission`(협회 admin은 레거시 `/referee/admin` 유지).

| 파일 | 변경 | 신규 |
|------|------|------|
| `referee-console/layout.tsx` | 글로벌 super 인증+buildLoginRedirect+admin-v2 CSS import+RefereeShell+nav badge 실카운트(배정/검증/정산 전역) | 신규 |
| `referee-console/_referee-shell.tsx` | RefereeShell(AdminShell 12 nav·route기반·brandSub="심판 콘솔") | 신규 |
| `referee-console/_referee-data.ts` | getRefereeAdminContext(협회 스코프 키 없음=전역)+표시헬퍼(level/status/role/assign/settle/cert/ocr 배지·fmtDate/DateTime/won/region) | 신규 |
| `referee-console/_logout-button.tsx` | 로그아웃(복제·자기완결) | 신규 |
| `referee-console/_soon.tsx` | 미배선 공용 "준비 중" placeholder | 신규 |
| `page.tsx`+`_dashboard.tsx` | 대시보드: Prisma 집계 KPI4(이번달배정/활동심판/정산대기₩/미검증자격)+월별배정 막대+처리대기(실카운트 파생·mock0) | 신규 |
| `assignments/page.tsx`+`_assignments.tsx` | 배정현황: refereeAssignment 전역 READ→SchemaList(심판/경기/일시/코트/상태). 경기정보=tournamentMatch 2차배치조회 보강(관계선언 없음). **읽기 드로어만**(mutation 후속·PM결정) | 신규 |
| `members/page.tsx`+`_members.tsx` | 심판명단: referee 전역 READ→SchemaList(등급=level/지역/배정수/상태). READ | 신규 |
| `settlements/page.tsx`+`_settlements.tsx` | 정산: refereeSettlement 전역 READ→SchemaList+**상태변경 모달**(adminFetch PATCH settlements/[id]/status·2단계확인·에러가시화) | 신규 |
| `verify/page.tsx`+`_verify.tsx` | 자격검증: refereeCertificate 전역 READ→SchemaList+**검증토글 모달**(adminFetch PATCH admin/referee-certificates/[id]/verify·확인·에러가시화) | 신규 |
| `settings/page.tsx` | 설정: 정본 RF_SETTINGS 정책 AdSettings 표시(협회별 저장처 없음→저장 no-op·보고) | 신규 |
| `calendar/apps/requests/evals/grades/noti/page.tsx` | 미배선 6 준비중 placeholder(RefereeSoon·평가=R6-C·mock0) | 신규 |

🔑 **글로벌 스코프(협회필터 제거)**: 레거시는 `getAssociationAdmin().associationId` where 필터(`referee:{association_id}`)지만, super는 **Prisma 직접 READ에 협회 필터 0**(전 협회 통합). 전부 서버 Prisma 직접(snake 함정 원천차단·stats API 미경유).
🔑 **mutation 2종(재사용·케이스확인)**: 정산상태=`PATCH /referee-admin/settlements/[id]/status {status}`(snake단일·전이 화이트리스트 UI복제) / 자격검증=`PATCH /admin/referee-certificates/[id]/verify {verified}`(boolean단일). 둘 다 adminFetch camel→snake(단일단어라 동일)·**위험액션 2단계 확인모달·실패 사유 모달 가시화**(errors.md 정산모달 패턴).
⚠️ **cross-association 403 한계(보고·수용)**: 두 엔드포인트 IDOR 가드(`referee.association_id !== admin.associationId`)+super는 `getAssociationAdmin()`이 **첫 활성 협회 1개만 자동선택** → 타 협회 건 mutation 시 403. 백엔드 0변경 유지(IDOR 미수정)·데이터 ~0행이라 수용·**403도 모달에 사유 노출**.
⚠️ **정본 적응(보고)**: ①배정=정본 경기중심(crew요약 데모)이나 실모델은 (심판1×경기1) → 심판 단위 행 매핑 ②심판명단 "평점" col·평가리포트=`RefereeEvaluation` 부재 → 제외/R6-C ③등급=`referee.level`(DB enum 입문/중급/상급/국제) 직접 매핑(정본 1/2/3급은 cert_grade 데모) ④설정 저장=협회 스코프라 전역 단일 저장처 없음→AdSettings 데모 no-op ⑤서류 OCR 확정=verify 화면 자격증에 집중·문서 OCR 후속.
🔑 **`/api/v1` 심판 라우트 없음**(Explore 실측) — 건드릴 것 0.

💡 tester: `/referee-console` super 로그인→대시보드(0건 빈상태). NAV 12(배선6+준비중6). 정산/자격 행클릭→상태/검증 모달(2단계 확인). super 첫협회 외 mutation→403 모달 가시. 비-super→no_permission. 백오피스/ta/operate/마법사/협력 회귀0(신규22파일만·기존 src 0수정).
⚠️ reviewer: tsc EXIT0(PM 재확인). git=신규22파일만(referee-console/·기존 src 0수정=구조적 회귀0)·raw fetch0(Prisma·logout만 예외)·레거시0·백엔드/DB/Prisma/API 0변경·하드코딩hex0(AV=데이터주입). 다음=R6-C(평가/정산 신규모델·등급수당·신청관리 정합).

### 구현 기록 (developer) — R6-C 평가/정산 마무리 (신규4+수정4·미커밋·그린필드 완료)
📝 db push 완료 신규 테이블 2개(`RefereeEvaluation`·`PartnerSettlement`)로 "준비 중" placeholder 2화면을 실 화면 교체. 신규 API 2개만 신설(나머지 기존 API/Prisma/스키마 0변경). 기존 settlements/venues 화면이 동일 패턴 템플릿이라 1:1 재사용.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `referee-console/evals/page.tsx` | RefereeSoon→`refereeEvaluation` 전역 READ(협회필터0·평가경기 평문FK→"경기 #id"·Decimal→toFixed1·evaluator_label) | 수정 |
| `referee-console/evals/_evals.tsx` | SchemaList(정본 RF_EVAL cols 1:1)+상태변경 모달(2단계 확인·에러 가시화) | 신규 |
| `referee-console/_referee-data.ts` | `evalStatusBadge` 헬퍼(submitted/confirmed/review_needed) 추가 | 수정 |
| `partner/settle/page.tsx` | placeholder→`partnerSettlement` 본인스코프(partner_id) READ·월별·금액 won | 수정 |
| `partner/settle/_settle.tsx` | SchemaList(정본 PT_SETTLE cols 1:1)+입금완료 모달(danger 2단계 확인) | 신규 |
| `partner/_partner-data.ts` | `won`·`periodLabel`·`settlementStatusBadge`(pending/paid/cancelled) 헬퍼 추가 | 수정 |
| `api/web/admin/referee-evaluations/[id]/status/route.ts` | **신규 API** PATCH super가드·Zod4 `z.enum([confirmed,review_needed])`·전이 화이트리스트 | 신규 |
| `api/web/partner/settlements/[id]/route.ts` | **신규 API** PATCH 파트너 IDOR(super bypass)·Zod4 `z.enum([paid,cancelled])`·pending→paid(paid_at) | 신규 |

🔑 **신규 API 2개(최소)**: ①평가상태=super 전역가드(협회 IDOR 불요·`getWebSession`+`isSuperAdmin`)·submitted→confirmed/review_needed·review_needed→confirmed 전이맵 / ②파트너정산=로그인+IDOR(`partner_members` is_active·partner_id 일치·super bypass)·pending에서만 paid/cancelled·paid시 paid_at=now. 둘 다 `apiSuccess`/`apiError`/`validationError`·Zod4 옵션객체 0·동일상태 거부·전이불가 400.
🔑 **mutation 배선**: `adminFetch` PATCH body `{status}`(단일단어=camel/snake 동일)·성공→`router.refresh()`·실패→모달 사유 가시화(AdminApiError.message). 0행→SchemaList Empty(mock 0).
💡 tester: tsc EXIT0(--incremental false). self-trace=evals/settle 진입→0행 빈상태·행클릭→상태변경 모달(평가=확정/검토필요·정산=입금완료 danger 2단계). 신규 API curl=super/파트너 가드·Zod reject·전이불가 400 확인 권장(0행이라 UI 무영향).
⚠️ reviewer: tsc EXIT0(PM 재확인). 신규 API 2개만·기존 API/Prisma/스키마 0변경·파괴적0. 레거시0 import·서버 Prisma 직접 READ·hex0(AV 데이터주입). 회귀0(백오피스/ta/operate/마법사/협력/심판 타화면 미접촉·신규4파일+기존4파일 헬퍼 additive). 한계=평가경기명 평문FK라 "경기 #id"(관계 미선언·mock 회피).
🎯 **R6/그린필드 리빌딩 완료**: R1 토대→R2 백오피스→R3 대회관리자→R4 대회운영→R5 마법사→R6-A 협력/R6-B 심판/**R6-C 평가·정산** 마무리. 클린 슬레이트 전 영역 박제 완료(커밋·컷오버=PM).

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-06-28 | **R6-C 평가/정산 마무리(신규4+수정4·미커밋·그린필드 완료)** | ✅ tsc EXIT0·백오피스/ta/operate/마법사/협력/심판 타화면 회귀0. db push 신규테이블 2개(RefereeEvaluation·PartnerSettlement)로 "준비중" 2화면 실화면 교체. **신규 API 2개만**=①`/api/web/admin/referee-evaluations/[id]/status`(super 전역가드·Zod4 z.enum[confirmed,review_needed]·전이맵 submitted→confirmed/review_needed) ②`/api/web/partner/settlements/[id]`(로그인+파트너 IDOR `partner_members` is_active·super bypass·Zod4 z.enum[paid,cancelled]·pending→paid시 paid_at). 평가=referee-console/evals(전역 READ 협회필터0·정본 RF_EVAL 1:1·상태변경 모달2단계)·정산=partner/settle(본인 partner_id 스코프 READ·정본 PT_SETTLE 1:1·입금완료 danger 모달). adminFetch PATCH `{status}`·성공 router.refresh·실패 모달 사유가시화·0행 Empty(mock0). 헬퍼 additive(evalStatusBadge·won/periodLabel/settlementStatusBadge). 기존 API/Prisma/스키마 0변경·파괴적0·레거시0·서버 Prisma 직접·hex0. 한계=평가경기명 평문FK→"경기 #id". **R6/그린필드 클린슬레이트 전영역 완료**(커밋·컷오버=PM). |
| 2026-06-28 | **R6-B 심판 콘솔(글로벌 super·6화면·신규22·미커밋)** | ✅ tsc EXIT0·백오피스/ta/operate/마법사/협력 회귀0(신규22파일만·기존 src 0수정). 정본 referee-pages 1:1(12 nav). **★URL=`/referee-console`**(레거시 `/referee` 점유→충돌회피·`(admin-v2)/referee-console/`). 인증=글로벌 super(`isSuperAdmin` only·협회 멤버십 불요·비-super→no_permission). READ=서버 Prisma 직접 **협회필터 0**(전 협회 통합·snake함정 원천차단). 6배선=대시보드(KPI4+월별막대+처리대기 실집계)/배정현황(refereeAssignment+match 2차조회·읽기드로어)/심판명단(referee level/지역/배정)/정산(+상태변경 모달)/자격검증(+검증토글 모달)/설정(정책 AdSettings). **mutation 2종**=정산상태(settlements/[id]/status)·자격검증(referee-certificates/[id]/verify)=adminFetch+2단계 확인모달+**에러 사유 가시화**. ⚠️cross-association 403 한계(super 첫협회 외)=백엔드 0변경 수용·모달 노출·데이터~0행. 미배선6=캘린더/신청/요청/평가(R6-C)/등급/알림 준비중(mock0). `/api/v1` 심판 없음 확인. 백엔드/DB/Prisma/API 0변경·레거시0·raw fetch0·hex0. 다음=R6-C 평가/정산 신규모델. |
| 2026-06-28 | **R6-A 협력업체 콘솔(대시보드/내시설/캠페인·신규13·미커밋)** | ✅ tsc EXIT0·백오피스/ta/operate/마법사 회귀0(신규13파일만·기존 src 수정0). 정본 partner-pages 1:1(정산 제외). **★인증=별도 라우트 `(admin-v2)/partner/`**(파트너 인증=partner_members is_active+super·tournament-admin 아니라 /v2 게이트 못씀·URL `/partner`). 대시보드=Prisma 집계 KPI4(시설/캠페인/노출/CTR·과금·정산·delta 제외)+월별캠페인 막대+활동. 내시설=court_infos(owner 스코프) SchemaList. 캠페인=ad_campaigns(partner) SchemaList+상세(IDOR·placements·과금제외). 정산=준비중(R6-C). 전부 서버 Prisma 직접 READ(snake함정 원천차단)·mutation0(정본 시연=준비중 토스트). 백엔드/DB/Prisma/API 0변경·레거시0·raw fetch0·hex0. 미배선=월예약/가동률("—")·시설편집폼(정본 부재→R6후속)·캠페인 생성/수정. |
| 2026-06-28 | **R5-A 보강: 종별 템플릿/연령 자동채움 + 대회 복사(신규2+수정4·미커밋)** | ✅ tsc EXIT0·생성/수정/operate/백오피스/ta 회귀0. 신고2건 해소. ①종별=레거시 ct-divisions.tsx 충실 포팅(`_divisions-editor.tsx`: DivisionGenerator 성별/AdminCategory템플릿/디비전/연령코드 4단계·여성w·곱집합·종별명 "남성 유청소년"/디비전 "i3 U12"). **연령 자동채움=생성 계약상 서버 자동**(createTournament가 AdminCategory.ages+computeAgeRangeForDivision으로 생성시 division-rule에 채움·구조만 정확히 보내면 됨). 페이로드 category 그룹핑(create+edit). ②대회 복사=`?copyFrom` 서버 prefill(`_form-prefill.buildCopyForm`·이름/일정/접수 비움·organizer-scoped 목록 피커·0 새 API). 종별 라운드트립 보존+레거시 그룹 잠복버그 동반수정. entry_fee Decimal→Number 동반수정. 한계=AdminCategory GET super-only(레거시동일)·div_schedule 미포팅. 백엔드/DB/Prisma/API 0변경·레거시0·raw fetch0. 실생성/연령=사용자테스트. |
| 2026-06-28 | **R5-B 대회 수정 마법사(신규2+수정3·미커밋)** | ✅ tsc EXIT0·생성마법사/operate/백오피스/ta 회귀0. 정본 `대회 수정.html`(mode=edit) 5단계 박제. **기존 PATCH/DELETE `/api/web/tournaments/[id]` 재사용**(★PATCH=updateTournamentSchema 혼합케이스: camel name/startDate/maxTeams/organizer/categories + snake venue_*/entry_fee/roster_*/registration_*_at/div_*/bank_*/game_rules/places/schedule_dates → **rawBody:true verbatim**·blanket변환 금지). _edit-wizard=prefill+dirty(JSON baseline)+저장바+삭제 확인모달·R5-A 프리미티브 import 재사용. page=canManageTournament 권한+Prisma READ→FormState prefill(jsonb verbatim·UTC slice datetime). 데이터보존=places 지도메타/game_rules 고급필드 spread 오버레이·jsonb id 무결성. operate "대회정보수정" stub→edit 배선. create-wizard export additive(로직0). 실저장/삭제=사용자테스트. 다음=심판/협력업체. |
| 2026-06-28 | **R5-A 대회 생성 마법사(신규2+수정2·미커밋)** | ✅ tsc EXIT0·백오피스/operate/ta 회귀0. 정본 workspace.jsx(create) 5단계(info/schedule/divisions/game/publish) 박제. **기존 생성 API `POST /api/web/tournaments` 재사용**(camelCase·zod없음·필수=name만·신규백엔드0)→adminFetch rawBody:true(verbatim)→응답 snake→camel(tournamentId)→`/v2/operate/[newId]` redirect. _create-wizard(tw-steps+ct-progress+종별CRUD+검토)·page서버래퍼·workspace.css 생성폼클래스 [data-admin=v2] 이식·_list CTA배선1줄. deviation(mock금지)=체육관DB/CalendarModal/종별템플릿·연령/프리셋/대회복사 미포팅→실입력 대체·format tournament-level1개·종별독립(category=label). 실생성=사용자테스트. 다음=R5-B 수정마법사·심판. |
| 2026-06-28 | **R4-D 대회운영 운영관리+사이트+정산(신규3+수정3·미커밋·R4완료)** | ✅ tsc EXIT0·R4-A/B/C·백오피스·ta 회귀0. 정본 operate.jsx OpsManage/Settle·panels-ops.jsx SitePanel 1:1(클라 mock→실데이터/실mutation). _ops-panel=정규대회연결(읽기위임)/운영인력(운영진·기록원 실CRUD·심판위임)/공지(settings.notice 단건)/기록모드(bulk). _settle-panel=입금(teams paid×feeKrw)/지출(tournament_expense 실API)/잔액 KPI·종별카드·ExpenseModal·팀별납부(teams PATCH). _site-panel=TournamentSite 주소/색/발행(publish API)/방문하기. 재사용 엔드포인트=admins·recorders(rawBody)·recording-mode/bulk·expenses·site(rawBody)·teams PATCH 전부 실존(신규0). page.tsx READ additive(settings/series/expenses/site). ops-*/set-*/ts-textarea CSS 이식. deviation=LeagueCreate/템플릿갤러리/푸시/심판배정=백엔드부재 위임·미배선(mock금지·보고). 백엔드/DB/Prisma 0변경·레거시0·raw fetch0. **R4 대회운영 6메뉴 완성**. 다음=R5 마법사/심판. |
| 2026-06-28 | **R4-C 대회운영 일정 패널(신규1+수정3·미커밋)** | ✅ tsc EXIT0·R4-A/B/백오피스/ta 회귀0. 정본 schedule.jsx SchedulePanel 1:1(클라 mock→실데이터 READ). _schedule-panel 신규=코트×날짜 레인·종별시간/코트시작 그리드·일정표(sc-table 드래그/휴식/드롭테일)·자동배치/직접배치 모달. ★snake함정 영역: page.tsx Prisma 직접 READ(`m.scheduledAt`camel·`m.court_number`/`m.venue_name`snake 모델필드명 그대로)→camel 도메인 단일매핑(apiSuccess 미경유=함정0). 레인=places×schedule_dates ∪ 실배치경기 좌표(배치경기 항상표시·self-trace 미배치오판0). source=기존 matchRows(3필드 additive)+tournament.places/schedule_dates(jsonb 정규화). **영속화 미배선(stub·보고)**: bulk 일정저장 엔드포인트 부재(DATA-CONTRACT 🔴)+정본 저장없음. per-match PATCH(혼합케이스 scheduledAt camel+court/venue snake·rawBody필요)는 실존하나 파생시간 bulk=lossy→R4-B 드래그미배선과 동일판단. 계획=클라 미리보기+안내명시. deviation=팀명토글생략/레인실좌표키. 백엔드/DB/Prisma 0변경·레거시0. 다음=R4-D 운영관리/사이트/정산. |
| 2026-06-28 | **R4-B 대회운영 대진표 패널(신규1+수정4·미커밋)** | ✅ tsc EXIT0·R4-A/백오피스/ta 회귀0. 정본 bracket.jsx BracketPanel 1:1(클라 mock→실데이터/실mutation). _bracket-panel 신규=config/seeding/grouped/drawn 상태(실데이터 파생)·종별칩·대회방식조설정(읽기전용)·시드배정UI·조편성결과(실group)·토너먼트트리(실matches·bk-* 92px/연결선). page.tsx READ 확장=team seed/group·rule format/settings·matchRows(트리·팀명·settings verbatim)·versions count(jsonb 스칼라 F-2b·종별↔매치=settings.division_code). 재사용 mutation=division-draw(추첨/시딩·**camelCase zod**→adminFetch `rawBody:true` 우회)·generate(발행/재생성·{clear}). client.ts rawBody 옵션 additive(snake역함정 흡수·raw fetch0). bk-*/sc-del [data-admin=v2] 스코프 이식. deviation=config읽기전용/트리드래그미배선/단일토너먼트시드생략(보고). 백엔드/DB/Prisma 0변경·레거시0. 다음=R4-C 일정 패널(snake함정 주의·matchRows scheduled_at). |
| 2026-06-28 | **R4-A 대회운영 워크스페이스 1차(셸+요약+참가팀·신규5+수정2·미커밋)** | ✅ tsc EXIT0·백오피스/ta 회귀0. 정본 operate.jsx 1:1. 셸중첩 회피=`/v2/operate/[id]`(ta layout 밖·자체 AdminShell brandSub="대회 운영"·6메뉴 nav). page.tsx=대회별 canManageTournament 권한체크+Prisma 직접 READ(teams/rules/matchCount)+snake→도메인 단일매핑(div_caps jsonb verbatim). _teams-panel=정본 TeamsPanel(종별그룹/필터/ct-pill 상태·납부·경로/readiness/상세모달 실명단 GET). 승인·거절·납부=adminFetch PATCH 기존 엔드포인트(camel→snake·0백엔드·낙관적+router.refresh). 5메뉴=Empty 준비중. workspace.css 필요분 [data-admin=v2] 스코프 이식. _list 행클릭/운영→router.push 배선. 미배선=5메뉴/토큰/선수입력/대회수정(R4-B~/R5). 백엔드/DB/Prisma 0변경·레거시 0 import. |
| 2026-06-28 | **R3 대회관리자 콘솔(별도 콘솔·5화면·라우트그룹 분리·미커밋)** | ✅ tsc EXIT0·백오피스 회귀0. 정본 ta-pages 1:1. `/v2/layout`을 인증-only로 리팩터+백오피스 14파일을 `(backoffice)/` route group으로 **이동만**(URL 불변·내용0)+백오피스 셸 마운트를 `(backoffice)/layout`으로 이전→`/v2/ta`에 자체 **TaShell**(대회콘솔 NAV·brandSub="대회 콘솔") 마운트(셸 중첩0). 5화면=대시보드(KPI4+월별막대+활동 실집계)/대회목록(검색+상태필터)/정규대회(series organizer_id)/단체(멤버십 카드)/템플릿(Empty 준비중). organizer-scoped(`organizer_id` OR `adminMembers active`·M3 갭 교정). jsonb verbatim(스칼라만 select·cadence 단일키). 미배선=create/operate/template(R4/R5)→준비중 토스트. 백오피스 href 2줄(대회콘솔→/v2/ta). 레거시/백엔드/DB 0변경. |
| 2026-06-28 | **R2-C 백오피스 BO-3 커뮤니티 + BO-4 코트 콘솔 (신규4+types+_shell·미커밋)** | ✅ tsc EXIT0·레거시0접촉. 정본 bo-pages community/court 콘솔을 R2-A/B 패턴(서버 Prisma직접 READ→SchemaList) 박제. 커뮤니티 4탭=자유/모집/후기(`community_posts.category` general/recruit/review)+건의(`suggestions` 모델). 코트 2탭=실내/야외(`court_infos.court_type`). **partner 탭 제외(DB 미지원)·news/anonymous UI 미추가**(정본 회피). 갭보고: 건의 votes컬럼 제외(DB없음)·코트 "월예약"=court_bookings 전체수(0대부분). snake→표시 단일매핑·raw fetch0. 백엔드/DB/Prisma 0변경. |
| 2026-06-28 | **R2-B 백오피스 BO-5 — 마케팅/결제/요금제 리스트(신규3+_shell·미커밋)** | ✅ tsc EXIT0·git diff=admin-v2 4파일(레거시0). 정본 bo-pages 3리스트를 R2-A 패턴(서버컴포넌트 Prisma직접 READ→SchemaList) 박제. 소스=마케팅 `ad_campaigns`+partner+`_count.placements` / 결제 `payments`+users(take50·0건→Empty) / 요금제 `plans`+`_count.user_subscriptions`. snake→표시 단일매핑(raw fetch0). 상세(PaymentDetail/PlanEditor)=시안미완→미배선(리스트만·기본 읽기드로어). _shell TARGET 3건 soon→실라우트+active 3분기. 백엔드/DB/Prisma 0변경. |
| 2026-06-28 | **R2 시각 보정 — 코워크 QA 후속 4건(admin-v2 4파일·미커밋)** | ✅ tsc EXIT0·git diff=admin-v2 4파일. ①AdListPanel 빈상태=정본 Empty(.ts-empty) "처리할 항목이 없습니다"(빈 흰패널 제거) ②AdBarPanel 0값 막대 `Math.max((c.v/max)*130, 2)` 2px baseline+max NaN차단(정본 130 보존) ③page.tsx 콘솔섹션 인라인라벨→`.ad-section-label` 클래스·marginTop 22→28 ④toss.css L76 `text-rendering:auto`(globals optimizeLegibility 상속 차단). 신규클래스1·hex0·레거시/백엔드/DB 0접촉. |
| 2026-06-28 | **R2 시각 보정 — /v2 백오피스 전역 타이포 누수 차단(2파일·미커밋)** | ✅ tsc EXIT0·2파일만 변경. **H1**(★80%): `styles/admin-v2/toss.css` 베이스 `[data-admin=v2]`에 `font-size:16px;line-height:normal;font-feature-settings:normal` 추가 → globals.css body(var(--fs-body)/var(--lh-body)/"tnum","ss01") 상속누수 차단·정본 데모 기본값 복원(데모 촘촘함). **M1**: `(admin-v2)/v2/page.tsx` 전체회원/활성팀 KPI에 전월말(이번달1일 이전 createdAt) 누적 대비 성장률 `delta` 실집계(growthPct·SELECT count 2개 추가·prev≤0→pill생략). 인증대기/정지=상태스냅샷 무의미→생략(mock금지). **L1**: `.ts-shell` self 셀렉터(`[data-admin=v2].ts-shell`) 병기(shell.tsx:241 동일엘리먼트). **L2**: `[data-admin=v2] ::selection`(primary-weak)·`a:hover{none}` 정본톤 차단. 레거시0접촉·백엔드/DB/Prisma 0변경. |
| 2026-06-28 | **종별 디비전 연령 자동 채움 Phase 2 (서버 연결·2파일·미커밋)** | ✅ tsc EXIT0·age-mapping 13/13·tournaments 317/317. Phase1 `computeAgeRangeForDivision` 연결. ①`division-rule-sync.ts`: DivisionRuleSeed 연령 4필드(optional)+build 함수 `categoryAges?`/`tournamentYear?` 파라미터→디비전별 연령 계산 채움(미전달 시 skip=회귀0). ②`tournament.ts createTournament`: tournamentYear=startDate 연도(KST·+9h)·AdminCategory 조회→input.categories 키 성별접두(`/^(남성\|여성)\s+/`) 제거→name 매칭→ages 맵·createMany 연령4필드 명시 insert. 일반부/대학부(ages=[])→토큰매칭 실패→null 유지. DB/schema 변경0(컬럼 기존). |
| 2026-06-28 | **시간 표시 KST 전수 점검 + UTC 노출 9파일 교정 (표시 변환만·DB/저장 0변경·미커밋)** | ✅ tsc EXIT0. 핵심=서버 컴포넌트(Vercel UTC)에서 tz없이 포맷한 지점만 UTC 누출(클라 "use client"는 브라우저=KST라 정상·score-sheet 기록시각/matches-panel은 이미 Asia/Seoul). 수정: ①audit-log L177 ②detail-kit formatDate/formatDateTime(admin 상세 다수) ③news/match 게시시각 ④site-host/schedule 일정날짜+경기시각 ⑤site-host/results 날짜 = `timeZone:"Asia/Seoul"` 추가 / ⑥venues 픽업경기시각 ⑦next-tournament-match-card ⑧upcoming-games ⑨lineup-confirm = `getHours()`→UTC+9h 보정 후 `getUTC*`(한국 DST 없음). 클라엔 무회귀·서버엔 교정. |
| 2026-06-28 | **8차 스타터스리그 기록 진단 + 더미 결승 9건 정리 (운영 DB)** | 진단=기록시스템 정상, "안 된 것처럼 보인" 원인=①더미 결승 9건(329~337 전부 scheduled·0-0·기록0·대진로직 오류 양산, 7차와 동일) ②리그 진행중(예선 2/6완료). 9건 삭제(next참조0·기록0 확인)·matches_count 15→6 정정. 예선6(완료2·진행1·미실시3) 기록 보존(324:194·325:246·327:269). 코드변경0. |
| 2026-06-28 | **7차 스타터스리그 더미 결승 8경기 삭제 (운영 DB·검증)** | ✅ 대회 40bc82b9. 결승 9건 중 실제 1건(319 완료43-41·기록266) 제외 **8건(314·5·6·7·8·320·1·2) 삭제**(전부 scheduled·0-0·기록0·next참조0=대진로직 수정 전 라운드로빈식 오생성). matchLineup/pbp/stat 선삭제(0행)→deleteMany. matches_count 15→7 정정. 사전/사후검증(예선6·결승319 보존). 코드변경0. |
| 2026-06-28 | **운영 DB 중복/데모 대회 4건 삭제 (사용자 요청·검증)** | ✅ 빈 대회 3건(남양주시클럽리그 d50fd96a·남동&부평 추가팀모집 7e01d5ff·강남구협회장배 빈중복 acd00c5a) + 데모 1건(열혈농구단 결승데모 96adad01). 데모는 자식(2팀/1경기/기록원3/운영진3) FK NoAction이라 **route.ts Hard DELETE cascade 7스텝 복제**(pbp/스탯/라인업→매치→ttp/팀→사이트→운영진/대진/종별→대회). 보존: 강남구 유소년부36팀/일반부D5·SEASON2·실제 클럽(제이크루·펜타곤). 사전/사후 검증. 코드변경0. |
| 2026-06-27 | **그린필드 M2 — 토대셋: admin-blocks 박제 + (admin-v2) 셸 골격/인증(신규8파일·css append32줄·레거시0접촉)** | ✅ tsc EXIT0. ①`components/admin-v2/blocks/`(SchemaList/renderSchemaCell/AdBarPanel/AdListPanel/AdSettings/PageHead/SchemaTable) 정본 admin-blocks.jsx 1:1 TS화·Icon/Btn/Badge/Toggle/Empty=admin-toss 재사용. ②`app/(admin-v2)/v2/`(layout=tournament-admin 인증복제 getWebSession+membershipType≥3/super+buildLoginRedirect+AdminShell 마운트, page=플레이스홀더). ③toss-admin.css ad-panel/list/bars/dot/statusline/avatar 9그룹 [data-skin=toss] 스코프 append(삭제0). 하드코딩hex0(violet#6D5AE6→var(--primary)). 라우트충돌0(/v2 신규). 소비처 미배선(M3). |
| 2026-06-27 | **그린필드 M1 — 관리자 타입드 데이터 계층(`src/lib/admin-api/` 신규7파일·백엔드0)** | ✅ tsc EXIT0. adminFetch=snake↔camel 변환 ★유일지점(5회 재발버그 구조근절)+AdminApiError+Zod parse. jsonb rawJsonKeys 보존(F-2b 차단·self-trace court_ids raw 유지). 인증보호=루트 middleware 부재→세그먼트 레이아웃(getAuthUser/getWebSession) 담당(v2도 동일패턴 복제). apiSuccess=래퍼없는 raw snake body. Zod4(int reject 검증). endpoints=expenses(list/create/delete)+tournaments(list/get). useAdminQuery 훅. 소비처 미배선(M3). |
| 2026-06-27 | **admin-toss PR-5 5-B 공개 사이트 대진 탭 추가 (BDR 13룰·실데이터·마이그0)** | ✅ tsc EXIT0. classic.tsx에 대진 탭(일정·결과 사이)+BracketPage 트리 신설(정본 .s-bracket 밴드/연결선→`bracket.module.css` BDR 토큰 박제·셀 min-height 92px). 데이터=기존 matches 재활용(round_number/bracket_position·쿼리 변경0). visibility.sections.bracket prep/show/hide 게이트(public-visibility 0접촉). page.tsx PAGE_SECTION bracket 1줄. Toss잔존0·하드코딩hex0·3스킨 보존. 승자강조=--bk-primary 인라인. |
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
| 2026-06-22 | **v2.40 A3-1 키트(tournaments·games·teams·organizations·courts) + tester/reviewer 병렬** | ✅ 통과·차단0. AdminStatusTabs→Toolbar·table→DataTable·모달→Drawer. 삭제 이름게이트/신청현황/3탭 복잡동작 보존. git=해당 화면만. tsc0. |
