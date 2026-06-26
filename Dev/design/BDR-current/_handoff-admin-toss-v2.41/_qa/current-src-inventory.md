# _qa/current-src-inventory.md — 운영 src 변경 인벤토리 (slim manifest 기준)

> 🔁 **2026-06-26 PM 정정 — 관리자 영역은 Toss 스타일 공식 채택.** 본 문서 §1-2/§1-3/§1-4의 "BDR 13룰로 번역"·"혼재 통일"·"BDR 토큰/Material Symbols로 치환" 류 메모는 **관리자 워크스페이스에 한해 무효** — 거긴 Toss 그대로 시안화한다. 권위 문서 = `admin-toss-style-lock-B1.md`·`function-lock-B1.md`·`README-B1.md`. (사용자 공개 영역은 BDR 룰 그대로.)

> 작성 2026-06-25 · 작성 방식: **manifest 기반 초안**.
> ⚠️ 본 인벤토리는 운영 `src/` **원본 코드를 직접 열람하지 않고**, `current-src-reverse-bake-slim-manifest-2026-06-25.md`의 변경 축·변경 파일 목록과 in-project `BDR-current`(최신 = `uploads/BDR-phase10-FULL-delivery-2026-06-13/BDR-current/`, 2026-06-13) + `Dev/design/BDR v2.40/_admin-unified/`를 교차 대조해 작성했습니다.
> 원본 확인이 필요한 항목은 `_qa/source-request-list.md`로 분리 요청합니다.

---

## 0. 기준점

| 항목 | 값 |
|---|---|
| BDR-current 마지막 역박제 | `5dbc9b4` — 2026-06-23 18:03 |
| in-project BDR-current 실측 최신본 | `uploads/BDR-phase10-FULL-delivery-2026-06-13/BDR-current/` (2026-06-13) |
| 조사 범위 | `5dbc9b4` 이후 운영 UI/UX 관련 src 변경 (manifest 46개 파일) |
| 미보유 | 운영 `src/` 전체 zip (업로드 실패) → 본 인벤토리는 코드 미열람 추정 포함 |

**대응 판정 표기**
- ✅ 대응 있음 — BDR-current에 같은 화면/컴포넌트 존재
- 🟡 부분 대응 — 유사 화면 있으나 구조/카피가 오래됨(outdated)
- ❌ 대응 없음 — BDR-current에 화면/컴포넌트 자체가 없음(missing)
- ❔ 미상 — 코드 미열람으로 대응 여부 확정 불가 → source-request 대상

---

## 1. 대회 운영자 워크스페이스 (P0 · 재구성) — 🔬 코드 실측 갱신 2026-06-26

> 갱신 출처: `source-request-B1-workspace-uploadable-2026-06-26.md`(B1 소스 패키지) **직접 열람**.
> 본 §1은 더 이상 manifest 추정이 아니라 **실측본**. 단, 첨부는 `bracket-panel.tsx` 중간에서 절단 →
> `teams/divisions/matches/recorders/site` 5개 패널 **내부** 코드는 미수록(셸 통합 방식만 실측). 표 "실측" 열로 구분.

### 1-1. 실측 정정 (인벤토리 가정 → 실제)

- **가정(구):** "단일 워크스페이스+패널 전환 셸 / 좌측 패널 nav + 우측 패널 영역".
- **실제(실측):** `data-skin="toss"` **단일 스크롤 워크스페이스**. 구조 =
  1. **요약 카드** — 4 `OperationShortcut` 타일(참가팀 / 종별 설정 / 경기 운영 / 공개 상태) + progress bar(`--color-accent`) + `SectionNav`(`ts-segment` segmented control, lg 우측 / 모바일 sticky top).
  2. **5 섹션 anchor 스크롤** — `info`(기본)·`schedule`(일정)·`divisions`(종별)·`game`(경기)·`publish`(접수·공개). `moveTo()` = 스크롤 + `history.replaceState` 해시. (패널 swap 아님)
  3. **2-컬럼 그리드**(`ct-grid--workspace`): 좌 = info+game / 우 = divisions+publish. `schedule`는 info 섹션 **안** `ScheduleVenue embedded` 블록(`id="schedule"`).
  4. **인라인 메가폼** — `info`(이름/주최/주관/후원사/일정·장소/소개/이미지)·`game`(시간/사용구/방식/규정/규칙/상금)·`publish`(참가비/접수/은행/팀 기준). 단일 `form` state → `PATCH /api/web/tournaments/[id]`(`saveSetup`). 저장 UI 3종(요약 inline / lg sticky 하단 바 / 모바일 fixed 하단 바) + `dirty`/`saving`/`saved` 상태.
  5. **7 패널 = lazy 임베드** — `next/dynamic(ssr:false)`, `PanelLoading`("불러오는 중"). 1차 nav가 **아니라** 3개 섹션 안 `PanelSummary` 버튼 + `togglePanel(Set<PanelId>)`로 펼침. game→matches·recorders·admins / divisions→divisions·bracket / publish→teams·site.
- **하위 컴포넌트(실측):** `SponsorEditor`(`ct-sptile`)·`SectionNav`(`ts-segment`)·`OperationShortcut`·`WorkspaceSection`(`ct-headicon` trophy)·`Field`(`ts-field`)·`Metric`(`ct-metric`)·`PanelSummary`(`ct-panel-summary/-stats/-actions`)·`PanelFrame`(`ta-panel-embed`).
- **해시 backcompat(실측):** `LEGACY_SECTION_MAP` = `setup→info`·`teams→publish`·`structure→divisions`·`matches→game`·`staff→game`.

### 1-2. 파일별 실측 매트릭스

| 운영 파일 | 라우트 | 화면 목적 | BDR-current 대응 | 판정 | 실측 |
|---|---|---|---|---|---|
| `…/[id]/_components/TournamentWorkspace.tsx` | `/tournament-admin/tournaments/[id]` | 5섹션 스크롤 워크스페이스 셸 + 인라인 메가폼 + 7 lazy 패널 | `AdminTournamentSetupHub.jsx`(8카드 hub) | 🟡 구조 전면 outdated | ✅ 전문 |
| `…/[id]/page.tsx` (server) | `…/[id]` | 상단 status 헤더 카드(`admin-stat-pill` ×3 / 사이트로·목록으로) + 워크스페이스 마운트·props 정규화 | hub 상단 헤더(부분) | 🟡 | ✅ 전문 |
| `_components/SetupChecklist.tsx` | publish 섹션 `<details>` 내장 | progress bar + 8카드 + `PublishGate` + 잠금 toast(`atsh-toast`)·`depends_on` | `AdminTournamentSetupHub.jsx`(`atsh-*` 이미 존재) | 🟡 hub→`<details>` 종속화 미반영 | ✅ 전문 |
| `_components/NextStepCTA.tsx` | bracket 패널 footer 등 | 단계간 CTA(Navy `--color-info`/4px/arrow-right) | 없음(hub 단계 이동만) | ❌ missing | ✅ 전문 |
| `_components/recording-mode-card.tsx` + `-trigger.tsx` | game 흐름 모달 | 기록 모드(기록앱/전자기록지/수기) 일괄 변경 카드 + 트리거 버튼·플로팅 모달 | 없음 | ❌ missing (신규) | ✅ 전문 |
| `_components/setup-hub-mobile-sticky.tsx` | 모바일 하단 | 공개 게이트 sticky("공개까지 N개 남음" + 공개) `sm:hidden` | `atsh-mobile-sticky`(이미 일부 존재) | 🟡 | ✅ 전문 |
| `_panels/admins-panel.tsx` | game 섹션 토글 | 운영진(관리자/스태프/기록원) 추가·목록·제거 | (hub 내 일부 추정) → 독립 시안 없음 | ❌ 독립 시안 없음 | ✅ 전문 |
| `_panels/bracket-panel.tsx` | divisions 섹션 토글 | 대진 생성/버전/듀얼 조배정/포맷 분기 | `AdminTournamentBracket.jsx`(독립 화면) | 🟡 패널화 미반영 | ✅ B1.2 전문 |
| `_panels/teams-panel.tsx` | publish 섹션 토글 | 참가팀 관리(propless self-fetch) | `AdminTournamentTeams.jsx`(독립 화면) | 🟡 패널화 미반영 | ✅ B1.1 전문 |
| `_panels/divisions-panel.tsx` | divisions 섹션 토글 | 종별 운영 방식(propless self-fetch) | `AdminTournamentDivisions.jsx`(독립 화면) | 🟡 패널화 미반영 | ✅ B1.1 전문 |
| `_panels/matches-panel.tsx` | game 섹션 토글 | 경기 운영(**유일하게 props** `tournamentId/defaultMode/matchStats`) | `AdminTournamentMatches.jsx`(독립 화면) | 🟡 패널화 미반영 | ✅ B1.2 전문(+`matches-client`) |
| `_panels/recorders-panel.tsx` | game 섹션 토글 | 기록원 + 경기별 기록자 배정(propless self-fetch) | 없음 | ❌ missing (신규) | ✅ B1.2 전문 |
| `_panels/site-panel.tsx` | publish 섹션 토글 | 공개 사이트 설정(propless self-fetch) | 없음 | ❌ missing (신규) | ✅ B1.2 전문 |
| `tournament-admin/layout.tsx` (server) | `/tournament-admin/*` | `AdminSidebar`(lg+) + `AdminMobileNav scope="tournament"` · `main lg:ml-64 max-w-[1600px]` · `ToastProvider` | ops-sidebar(쇼케이스 내장) | 🟡 셸 정합 | ✅ 전문(권한 가드 = UI 비대상) |
| `tournament-admin/page.tsx` + `tournaments/page.tsx` | `/tournament-admin` → 목록 | index→`/tournaments` redirect · 목록 = `AdminPageHeader` + `AdminTournamentList`(상태탭/검색/카드) | `AdminTournamentAdminList.jsx` | ✅ | ✅ 전문 |

> 핵심(정정): 운영은 **개별 화면 → 단일 스크롤 워크스페이스**로 재편. 패널은 1차 nav가 아니라 **섹션 내 lazy 토글**이며 6개는 propless self-fetch, `matches`만 props. BDR-current는 여전히 분리 화면(`ud1/ud2/ud3/pa5/pa6`) + 8카드 hub(`AdminTournamentSetupHub`) 모델이라 baseline을 왜곡함. **P0**.

> ⚠️ 디자인 시스템 실측: 운영 코드는 **v2.40 Toss 스킨**(`data-skin="toss"` · `ts-*/ct-*` 클래스 · `--color-*` Toss 토큰 · `@/components/admin-toss`의 **lucide** `<Icon>`). BDR-current 타깃은 BDR 토큰(`--accent/--cafe-blue/--ink-mute`) · Material Symbols · `admin.css` `atsh-*`. **PM 결정(2026-06-26): 구조·IA·상태만 BDR-current로 역박제(토큰/아이콘/라운딩을 13룰로 번역), Toss 토큰·lucide는 이관 금지. Toss 콘솔 풀 리스킨은 별도 후속 batch.**

### 1-3. B1.1 패널 내부 실측 (2026-06-26, `source-request-B1-1-panel-internals`)

> 출처 첨부 = teams·divisions·matches 전문 / recorders 절단(상반부) / **site 미첨부**. 아래는 직접 열람 실측.

- **teams-panel** (가장 큼) — `data-skin="toss"`. ① 헤더(← 대회 관리 / 참가팀 관리 / 코치 토큰 안내) ② 툴바: **토큰 파일 받기(CSV·BOM)** + **카톡 문구 일괄 복사**(클립보드) ③ 등록경로 stat 4종 `ViaStatCard`(운영자/코치/본인/경로 미상) ④ **종별 배정 현황** 섹션(`divisionReadiness`: 준비/대기/정원 초과 배지 + **랜덤·시드 조편성** 버튼, 승인 ≥2 가드) ⑤ 필터 chip 5(전체/대기/승인/거절/**코치 미입력**) ⑥ **종별 그룹핑** 팀 카드(헤더 + 카드: 색 dot·팀명·`ViaBadge`·`StatusBadge`·대기 N번·코치 입력 대기·선수 N명·신청/등록일·코치·신청자·**링크 복사**(토큰 alive/만료)·시드/조 input·status pill·승인/거절) ⑦ **TeamDetailModal**(종별 select·`PaymentBadge`+납부 select 미납/납부/환불·코치 inline 편집·조/시드·토큰 만료/재발급·URL복사·승인/거절·**프린트**·선수 명단 table[#·이름·생년월일·학교·포지션·학부모·연락처]+모바일 카드·선수 추가 폼) ⑧ **ImportPlayersModal**(카톡 텍스트 `이름/생년월일/등번호/포지션/학교/보호자/연락처` 파싱→미리보기→일괄, overwrite·strict) ⑨ 우상단 toast ⑩ 프린트 전용 CSS ⑪ `NextStepCTA currentStep="teams"`. 배지 헬퍼: `ViaBadge/StatusBadge/PaymentBadge/RosterProgressBadge`.
- **divisions-panel** — `data-skin="toss"`. ① **종별 구성** 섹션: `masterCategories` chip 토글 → 선택 디비전마다 행(디비전명·정원·참가비 input + **일정 select** + **체육관 select** + 삭제) + 종별 저장 + 결과 배너 ② **종별 룰 카드**(code 모노 칩 + 라벨 + 학년/참가비 + 날짜·코트 칩 + **진행 방식 select**(`FORMAT_LABEL` 8 enum) + `GroupSettingsInputs`(조 크기/조 개수/**동순위전 방식**[풀리그·토너먼트, 2조 이하=단판 안내]/**조별 본선 진출 팀 수**, 총 팀수·총 진출 계산) + **진출 매핑 실행** + 결과 배너) ③ empty box(`ct-emptybox--tall`). dual_tournament 고정값 분기 다수.
- **matches-panel** — **thin wrapper**(20줄). `RecordingModeTriggerClient`(기록 모드 버튼+모달, B1 실측) + `MatchesClient`(실제 경기 표는 `matches/matches-client.tsx` = **별 파일·미첨부**). props `matchStats`는 **5필드**(total/paper/flutter/**manual**/inProgress) — B1 셸의 4필드보다 manual 추가.
- **recorders-panel** (절단) — `@/components/ui`의 `Card`/`Button`/`Image` 사용(ts-* 아님). ① 기록원 추가(이메일 POST) + 목록 ② **경기별 기록자 배정**(`MatchRow.settings.recorder_id` 매핑, 매치별 select + 자동 배정 버튼·`autoAssigning`). 렌더 절단 → 배정 UI 정밀은 하반부 필요.
- **site-panel** — **본 첨부 미수록**. 내부 미상 유지.

> 디자인 시스템 정합 메모: teams/divisions = `ts-*`·`--color-*`·lucide(Toss). recorders = `ui/Card·Button`(또 다른 키트). **혼재** → BDR 역박제 시 셋 다 BDR 토큰/Material Symbols/4px로 번역.

### 1-4. B1.2 패널/경기표/생성 마법사 내부 실측 (2026-06-26)

> 출처 첨부 3분할: 2A(site·recorders 전문) / 2B(matches-client·bracket 전문, dual-group-editor 절단) / 2C(ct-schedule-venue·ct-game-settings·division-formats 전문).

- **site-panel** (2A) — `data-skin="toss"`, `ui/Button` + `btn` 혼재. ① **3-step 위자드**(템플릿/색상/발행) ② step indicator 원형(`rounded-full` 9999px) ③ `TEMPLATES` 3종(Classic/Dark/Minimal — 미리보기 **고정 hex 의도적**: 다크모드 무관 시뮬레이션) + `TemplateMockup`(미니 nav/hero/content) ④ `COLOR_PRESETS` 8색 원형 스와치(토스 블루/레드/BDR Red/그린/퍼플/골드/스카이/다크) ⑤ Step3 서브도메인 input + 요약 + 임시저장/공개 ⑥ **발행 완료 상태**(공개 중 카드 `subdomain.mybdr.kr`·방문/비공개 전환 + 수정 버튼 3[템플릿/색상/공지]). 이모지 🎨📄🚀.
- **recorders-panel** (2A 전문) — `data-skin="toss"` + `max-w-2xl`, `ui/Card·Button·Image`. ① 기록원 추가(이메일, bdr_stat 앱 안내) ② 목록(아바타[`rounded-full`]·닉네임·이메일·제거) ③ **경기별 기록자 배정** Card(자동 배정 버튼 + 경기 행마다 기록자 `select`[(미배정)+풀 인원], 미배정 N 안내, 낙관 갱신). `rounded-lg/full` 혼재.
- **matches-client** (2B 전문) — `data-skin="toss"`. ① 헤더(경기 운영 + 대진표 생성/재생성 + `AdvancePlayoffsButton`) ② `PlaceholderValidationBanner` ③ **종별 필터**·**체육관 필터** chip(2개↑일 때) ④ 라운드 그룹핑 → 모바일 카드 / 데스크톱 **표**(`amt-table`, `./matches-admin.css`) ⑤ **ScoreModal**(홈/원정 팀 select·점수·상태·승자·일정/경기장·**기록 방식 토글**[기록앱/전자기록지 + "전자기록지 열기" `/score-sheet/[id]`]·삭제/저장; 변경 필드만 PATCH; 모드 변경=별 endpoint + prompt 사유). empty 아이콘.
- **bracket-panel** (2B 전문) — `data-skin="toss"`, `ui/Card·Button`. ① **버전 현황**(`MAX_FREE_VERSIONS=3` dot + 확정/재생성 + 버전 히스토리) ② **1라운드 팀 배치 편집**(single elim만) ③ `DualGroupAssignmentEditor`(dual + 16팀 + 매치 0) ④ `DualBracketSections`(**5단계 collapsible**: 조별 미니 더블엘리미/조별 최종전/8강/4강/결승 — `DualGroupedMatches` A·B·C·D / `DualMatchCard`) ⑤ `DivisionBracketSections`(**다종별**: division 필터 chip + roundName sub-group + `DivisionGenerateButton`) ⑥ 전체 경기 목록(single/league) ⑦ empty 🏆. `rounded-full` chip·pill 다수. ⚠️ 영문 UI: "vs"·HOME/AWAY 주석(코드)·"BYE" 등 — 박제 시 한글화(대/홈/원정/부전승).
- **dual-group-assignment-editor** (2B 절단) — 4그룹×4슬롯 `select` + autoSeed(시드/등록순) + validate(16팀 unique) + save `settings.bracket.groupAssignment`+`semifinalPairing`. `ui/Card·Button`.
- **ct-schedule-venue** (2C 전문, 생성 마법사 §2) — `@/components/admin-toss`(Icon/Btn/Modal). `VENUE_DB` mock + **VenueSearch**(Kakao `/api/web/place-search` debounce 250ms + 직접 추가) + **CalendarModal**(다중 날짜) + **Stepper**(코트 1~8) + **SegSm**(숫자/알파벳 코트 명칭) + 장소·코트 행(지도/길안내 링크) + 날짜별 코트 배정 chip. court id `${venueId}_c${idx}`. `ct-*` 클래스(ct-vsearch/venuerow/dateblock/courtpick/cal/stepper/segsm).
- **ct-game-settings** (2C 전문, 생성 마법사 §2) — admin-toss kit. controlled(`GameRules`). **유니폼 규칙**(홈 밝은색/원정 어두운색·swap·조끼 제공) + `UNIFORM_PALETTE` **16색**(도메인 저지 hex = 토큰 예외) + `UniformModal`. **경기 구성**: 프리셋 칩 + 운영방식(논스톱/올데드) + 쿼터수(4쿼터/전후반) + 쿼터/연장/막판 정지/샷클락. `<details>` **파울·타임아웃**(개인/팀파울/타임아웃 전후반·시간) + **휴식 시간**(쿼터사이/하프/연장전/자동). `Stepper`/`SegSm`/`SetRow`/`RuleDetails`.
- **division-formats.ts** (2C) — `ALLOWED_FORMATS` **6 enum** + `FORMAT_LABEL`: 토너먼트/풀리그/듀얼토너먼트/조별리그+토너먼트/링크제/조별리그+동순위 순위결정전. 가드 `showGroupSettings`·`showRankingFormat`(group_stage_with_ranking)·`shouldShowAdvancePerGroup`(group_stage_knockout·dual_tournament) + `ADVANCE_PER_GROUP_DEFAULT=2` + `validateDivisionSettings`(1~32, advance≤group_size) + `calculateTotalTeams`. **divisions 패널 진행방식 select + 조 설정의 단일 source.**

> B1.2 키트 정합: site/matches/bracket = `ts-*`+`ui/*` 혼재 / recorders = `ui/*` / schedule-venue·game-settings = `admin-toss`(Btn/Modal/Icon=lucide). **세 키트 + `rounded-full`/9999px + 이모지(🎨🚀🏆) + 영문(vs/HOME/AWAY/BYE) 전부 BDR 13룰 변환 대상**(체크리스트 §2 매핑 + §10).

---

## 2. 대회 생성/관리 상세 흐름 (P0 · 신규 흐름)

| 운영 파일 | 라우트 | 화면 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `tournaments/new/wizard/_components/ct-create-tournament.tsx` | `/tournament-admin/tournaments/new/wizard` | 대회 생성 마법사(기본 정보) | `AdminTournamentWizard1Step.jsx` | 🟡 흐름 outdated |
| `…/_components/ct-divisions.tsx` | 〃 | 종별 설정 step | `AdminTournamentDivisions.jsx`(독립·생성흐름 분리) | 🟡 |
| `…/_components/ct-game-settings.tsx` | 〃 | 경기 규정·유니폼 규정 step | 없음 | ❌ missing (신규) |
| `…/_components/ct-schedule-venue.tsx` | 〃 | 종별 일정·경기장 step(Kakao 장소) | 없음 | ❌ missing (신규) |

> 운영 생성 마법사가 종별 일정/경기장/유니폼/자동 조편성까지 단계화됨. 시안은 1-step wizard 수준. **P0**.

---

## 3. 장소 / 길안내 UX (P1)

| 운영 파일 | 라우트/위치 | 화면 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `components/shared/place-autocomplete.tsx` | 공유 | Kakao 장소 검색 입력 | 없음 | ❌ missing (신규 공유 컴포넌트) |
| `lib/maps/navigation-links.ts` | lib | 경기장 길안내 링크 생성 | 없음(링크 로직) | ❔ 코드 확인 필요 |
| `components/tournament/schedule-form.tsx` | 운영 폼 | 일정/경기장 입력 폼 | 없음 discrete | ❌/❔ |
| `(web)/tournaments/[id]/_components/schedule-timeline.tsx` | `/tournaments/[id]` | 대회 상세 일정 타임라인 | `TournamentDetail.jsx` 내 일정 | 🟡 directions fallback 미반영 |
| `(web)/tournaments/[id]/_components/tournament-tabs.tsx` | `/tournaments/[id]` | 대회 상세 탭 구성 | `TournamentDetail.jsx` 탭 | 🟡 |

> 공개 일정에 길안내 fallback(directions)이 추가됨. 사용자 상세 + 운영 폼 양쪽 영향. **P1**.

---

## 4. 기록앱 영향 관리자 UI (P1)

| 운영 파일 | 라우트 | 화면 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `(admin)/admin/agents/page.tsx` | `/admin/agents` | 기록앱 영향 분석 관리자 화면 | 없음 | ❌ missing (신규 화면군) |
| `(admin)/admin/agents/record-app-impact-panel.tsx` | `/admin/agents` | 기록앱 영향 패널 | 없음 | ❌ missing |
| `(admin)/admin/logs/page.tsx` | `/admin/logs` | 감사 로그(영향 분석 연결) | v2.40 통합 콘솔 "활동 로그"(`au-screens2.jsx`) | 🟡 영향-로그 연결 미반영 |
| `components/admin/sidebar.tsx` | 관리자 셸 | 관리자 사이드바(agents 진입 추가) | 통합 콘솔 sidebar | 🟡 agents nav 미반영 |

> `/admin/agents`는 BDR-current에 완전 부재. 감사 로그는 통합 콘솔에 골격만 있고 "기록앱 영향 → 로그" 연결이 빠짐. **P1**.

---

## 5. 심판 / 경기원 라벨 정리 (P1)

| 운영 파일 | 라우트/위치 | 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `wizard/association/_components/Step3FeeSettings.tsx` | `/tournament-admin/wizard/association` | 참가비·심판 배정비 설정 step | `AdminWizardAssociation.jsx`(pa3) | 🟡 카피/라벨 outdated |
| `…/Step4RefereeRegister.tsx` | 〃 | 심판/경기원 등록 step | `AdminWizardAssociation.jsx` 일부 | 🟡 |
| `…/WizardConfirm.tsx` | 〃 | 마법사 확인 step | `AdminWizardAssociation.jsx` 확인 | 🟡 |
| `lib/referee/official-roles.ts` | lib | 심판/경기원(`referee`/`game_official`) 역할·등급 라벨 | (시안 하드코딩 추정) | ❔ 코드 확인 필요 |
| `lib/validation/referee.ts` | lib | 심판 검증 메시지(UI 카피) | — | ❔ |

> `referee` ↔ `game_official` 라벨 및 KBA/FIBA 등급 표준화. UI 카피 직접 영향. **P1**(라벨 정합).

---

## 6. 엘리트 선수 배지 / 프로필 (P2)

| 운영 파일 | 라우트 | 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `(web)/users/[id]/_v2/player-hero.tsx` | `/users/[id]` | 유저 공개 히어로(엘리트 배지) | `UserPublicProfile.jsx`(`pu5`) | 🟡 배지 미반영 |
| `(web)/users/[id]/page.tsx` | `/users/[id]` | 유저 공개 프로필 | `UserPublicProfile.jsx` | 🟡 |
| `(web)/profile/page.tsx` | `/profile` | 본인 프로필(엘리트/구독 표시) | `Profile.jsx`(`pu1`) | 🟡 |
| `(web)/profile/basketball/page.tsx` | `/profile/basketball` | 농구 프로필(엘리트 선수 배지) | `ProfileBasketball.jsx`(`pu3`) | 🟡 |

> 엘리트 선수 배지 신규 표기. 시안은 배지 없음. **P2**(시각 정합).

---

## 7. 멤버십 / 구독 권한 표시 (P2)

| 운영 파일 | 라우트 | 목적 | BDR-current 대응 | 판정 |
|---|---|---|---|---|
| `(web)/pricing/page.tsx` | `/pricing` | 멤버십 플랜 | `Pricing.jsx`(`bu1`) | 🟡 권한/구독 카피 outdated |
| `(web)/layout.tsx` | `/(web)/*` | 웹 셸(멤버십 뱃지 노출) | AppNav frozen + 셸 | 🟡 ⚠️ AppNav frozen 주의 |
| `(admin)/admin/plans/page.tsx` | `/admin/plans` | 관리자 플랜 관리 | `AdminPlans.jsx` + 통합 콘솔 plans | 🟡 |
| `(admin)/admin/users/[id]/page.tsx` | `/admin/users/[id]` | 유저 상세(구독 권한) | `AdminUsers.jsx`(상세 drawer) | 🟡 |
| `(admin)/admin/users/admin-users-table.tsx` | `/admin/users` | 유저 테이블(구독 컬럼) | `AdminUsers.jsx` | 🟡 |
| `(admin)/admin/tournaments/[id]/page.tsx` | `/admin/tournaments/[id]` | 사이트 관리자 대회 상세 | (운영자측 시안과 별개) | ❔ |
| `lib/membership/entitlements.ts` | lib | 권한/구독 entitlement 로직 | — | ❔ 코드 확인 필요 |

> 구독 권한/뱃지 카피 정합. **P2**.

---

## 8. AppNav / 공유 — frozen 주의 영역 ⚠️

| 운영 파일 | 위치 | 메모 |
|---|---|---|
| `components/bdr-v2/app-nav.tsx` | AppNav 본체 | **frozen 7룰 대상**. 운영 변경이 구조 변경이면 역박제 금지, **라벨/뱃지 추가만** 허용. 원본 확인 필요 → source-request |
| `components/shared/user-dropdown.tsx` | utility bar 계정 dropdown | 멤버십 뱃지 추가 가능성. frozen 인접 — main bar에 아바타/드롭다운 trigger 추가 금지 룰 확인 |

---

## 9. 로직 전용(lib·prisma) — UI 비직접 / 데이터

| 운영 파일 | 성격 | UI 영향 | 비고 |
|---|---|---|---|
| `prisma/schema.prisma` | 데이터 모델 | 간접 | 엘리트/entitlement/official 필드 확인용 |
| `lib/services/tournament.ts` | 서비스 | 낮음 | 역박제 비대상(데이터 흐름) |
| `lib/tournaments/division-advancement.ts` | 로직 | 낮음 | 자동 조편성/승급 — 패널 상태 간접 |
| `lib/tournaments/division-rule-sync.ts` | 로직 | 낮음 | 종별 규칙 동기화 |
| `lib/tournaments/game-rules.ts` | 규칙 기본값 | 중 | `ct-game-settings` UI 기본값 구동 → 확인 권장 |
| `lib/tournaments/setup-status.ts` | 셋업 상태 | 중 | 워크스페이스 패널 완료/잠금 상태 구동 → 확인 권장 |
| `lib/validation/tournament.ts` | 검증 메시지 | 중 | 생성 폼 UI 카피 |

---

## 10. 요약 카운트

| 판정 | 개수(대략) | 의미 |
|---|---|---|
| ❌ missing(신규) | 6~8 | agents 2 · recorders/site/ct-game-settings/ct-schedule-venue/place-autocomplete |
| 🟡 outdated | 20+ | 워크스페이스 패널화 · 생성 흐름 · 라벨 · 배지 · 구독 |
| ✅ 대응 | 1~2 | 운영자 진입(page.tsx) 등 |
| ❔ 미상(원본 필요) | 9 | lib 로직 · app-nav · site-admin 대회 상세 등 |

다음: `_qa/reverse-bake-gap.md`(우선순위) → `_qa/source-request-list.md`(원본 요청).
