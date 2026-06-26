# _qa/bake-fix-checklist-B1.md — B1 워크스페이스 BDR-current 역박제 체크리스트

> 작성 2026-06-26 · 출처: `source-request-B1-workspace-uploadable-2026-06-26.md`(B1 소스 직접 실측) + `reverse-bake-gap.md` P0-1~P0-4.
> 대상 baseline: in-project BDR-current = `uploads/BDR-phase10-FULL-delivery-2026-06-13/BDR-current/`.
> 산출 = **BDR-current 역박제 시안**(쇼케이스 `.jsx` + `admin.css`). 운영 `src/` 직접 수정 / API / Prisma / 라우트 제안 **전면 제외**(반영 시 reject).
> PM 결정(2026-06-26 **정정**): 관리자/운영자 워크스페이스는 **Toss 스타일을 공식 관리자 디자인 시스템으로 채택**. 역박제는 Toss→BDR 번역이 **아니라** 운영 src의 Toss 구조·컴포넌트·상태를 **그대로 시안화**. 스타일 잠금 = `admin-toss-style-lock-B1.md` · 기능 잠금 = `function-lock-B1.md`.

> 🔁 **2026-06-26 PM 정정 효력**: 본 문서 곳곳의 "⚠️ 변환"·"BDR 13룰 번역"·"lucide→Material"·"rounded-full→4px"·"Toss 토큰→BDR 토큰" 인라인 노트는 **전부 폐기**. 관리자 영역에서 lucide·Toss blue·`rounded-full`·`ts-*`/`admin-toss`는 **위반 아님(정식 허용)**. 아래 §2·§10은 정정본으로 교체됨. (AppNav frozen + 사용자 영역 §1~§8은 **사용자 공개 영역에만** 계속 적용.)

> ✅ **빌드 완료(2026-06-26)**: Toss 역박제본 = `Dev/design/BDR v2.41-admin-toss/`(`대회 운영 워크스페이스.html`). 셸+7패널+마법사 Toss 그대로 시안화 완료. 본 체크리스트는 빌드 검수 기준으로 사용.

---

## 0. 범위 / 비범위

**범위 (이번 B1)**
- 운영 `TournamentWorkspace.tsx`의 **구조·IA·상태 흐름**을 BDR-current 단일 시안으로 재구성.
- 부속 실측 컴포넌트(`SetupChecklist`·`setup-hub-mobile-sticky`·`recording-mode-*`·`NextStepCTA`·`admins-panel`)의 UI 패턴 박제.
- 패널 셸 통합 방식(lazy 토글·마운트 맵·props 계약)을 시안 상호작용으로 시연.

**비범위 (별도 batch / 차단)**
- ❌ 운영 src 코드 수정·PR 제안.
- ❌ API/Prisma/라우트 신설·변경 제안 (운영 `PATCH /api/web/...`, `/site/publish`, `/recording-mode/bulk` 등은 시안에서 **mock 상태 시연**만).
- ❌ `teams/divisions/matches/recorders/site` 패널 **내부** 정밀 박제 — 첨부 미수록(`bracket-panel` 절단 포함). 본 batch는 **패널 셸/마운트/토글/empty·loading 톤**까지만. 내부 정밀본은 각 패널 소스 추가 수령 후(B1.1).
- ❌ Toss 콘솔(`Dev/design/BDR v2.40/_admin-unified/*`) 리스킨(= `bake-fix-checklist.md` C-0, PM 확정 시).

---

## 1. 산출 파일 (BDR-current)

| 파일 | 신규/갱신 | 역할 |
|---|---|---|
| `screens/AdminTournamentWorkspace.jsx` | 🆕 신규 | B1 셸 — 요약 카드 + 5섹션 + 인라인 메가폼 + 7 패널 토글. `AdminTournamentSetupHub.jsx` 대체(hub는 `<details>` 공개 체크리스트로 흡수) |
| `ud3-admin-setup.html` | ✏️ 갱신 | 마운트 타깃을 `AdminTournamentSetupHub` → `AdminTournamentWorkspace`로 교체(또는 신규 `ud4-admin-workspace.html`) |
| `admin.css` | ✏️ 갱신 | `.atw-*`(워크스페이스) 클래스 신설. 기존 `.atsh-*`(toast/mobile-sticky/depends_on) **재사용**(이미 존재 — 중복 신설 금지) |
| `screens/AdminTournamentSetupHub.jsx` | ⚠️ 보존 | 삭제 금지. 공개 체크리스트 본문은 워크스페이스 `<details>`로 이식, 카드 모델은 참조 보존 |

> ⚠️ 패널 4개(teams/bracket/divisions/matches)는 기존 `AdminTournamentTeams/Bracket/Divisions/Matches.jsx` **콘텐츠 재사용** — 패널 프레임(`.atw-panel-embed`) 안에 렌더. 신규 작성 금지(중복).
> 신규 패널 3개(admins/recorders/site)는 본 batch에서 **admins만 정밀**(소스 실측), recorders/site는 셸+"준비 중" 톤.

---

## 2. Toss 스타일 = 공식 관리자 디자인 시스템 (그대로 박제)

> 🔁 **방향 전환(2026-06-26 PM 정정)**: 운영 코드의 Toss 스킨(`data-skin="toss"` · `ts-*`/`ct-*` · `--color-*` · lucide `admin-toss`)을 **그대로** 관리자 시안에 박제한다. 아래 §2-1·§2-2의 "운영(Toss)→BDR" 치환 표는 **전부 폐기** — 좌측 Toss 값이 정식 토큰이며, 우측(BDR)으로 바꾸면 **오히려 reject**. 토큰·클래스·아이콘 정본 카탈로그 = **`admin-toss-style-lock-B1.md`**. canonical 자산 = `Dev/design/BDR v2.40/_admin-unified/`(`toss.css`·`toss-kit.jsx`·`au-kit.jsx`) 재사용.

> 관리자 영역 허용(위반 아님): lucide 아이콘 · Toss blue(`--color-primary`) · `rounded-full`/9999px · `ts-*`/`admin-toss`/`ui/*` 키트 · `color-mix` 틴트 · 이모지(🎨🚀🏆). **사용자 공개 영역엔 종전 BDR 13룰 + AppNav frozen + §1~§8 그대로 유지.**

<details><summary>↓ (폐기) 구 Toss→BDR 번역 매핑 — 이력 보존용, 적용 금지</summary>

### 2-1. 토큰

| 운영(Toss) | BDR-current | 룰 |
|---|---|---|
| `--color-primary` / `--primary` | `var(--accent)` | 10 |
| `--color-info` | `var(--cafe-blue)` | 10 |
| `--color-success` | `var(--ok)` | 10 |
| `--color-error` | `var(--err)` | 10 |
| `--color-warning` | `var(--warn)`(없으면 `--trophy-ink`/신설) | 10 |
| `--color-accent`(진행 fill) | `var(--accent)` | 10 |
| `--color-card` | `var(--bg-card)` / `var(--bg-alt)` | 10 |
| `--color-elevated` | `var(--bg-alt)` | 10 |
| `--color-background` / `--bg` | `var(--bg)` | 10 |
| `--color-text-primary` / `--ink` | `var(--ink)` | 10 |
| `--color-text-secondary` | `var(--ink-soft)` | 10 |
| `--color-text-muted` / `--ink-mute` | `var(--ink-mute)` | 10 |
| `--color-on-primary` / 인라인 `#fff` | `var(--on-accent)`(`bake-fix-checklist.md` A-3 의존) | 10 |
| `--grey-50` / `--grey-100` | `var(--bg-alt)` / track용 `var(--border)` | 10 |
| `--radius-card` | 8px | 12 |
| `--radius-chip` | 4px(chip/dot 9999px는 유지 가능 — 버튼/카드만 금지) | 12 |

### 2-2. 아이콘 (lucide `@/components/admin-toss <Icon>` → Material Symbols Outlined) — 룰 11

| lucide(운영) | Material Symbols | 위치 |
|---|---|---|
| `trophy` | `emoji_events` | `WorkspaceSection` 헤드아이콘 |
| `sliders-horizontal` | `tune` | 기록 모드 트리거/카드 |
| `gamepad-2` / `file-text` / `pencil` | `videogame_asset` / `description` / `edit` | 기록 모드 3택 |
| `circle-check` / `clock` / `circle` / `lock` | `check_circle` / `pending` / `radio_button_unchecked` / `lock` | 체크리스트 status |
| `globe` / `rocket` / `triangle-alert` / `info` / `link` / `chevron-right` / `x` / `arrow-right` | `public` / `rocket_launch` / `warning` / `info` / `link` / `chevron_right` / `close` / `arrow_forward` | 게이트/CTA/모달 |

### 2-3. 라운딩·터치·이모지 (룰 12·13·14)

- `rounded-[12px]/[14px]/[16px]/[24px]/full`(버튼·카드) → **4px 표준 / 카드 8px**. chip·dot의 `9999px`만 유지.
- `admins-panel`의 이모지 👥, `bracket`/empty 이모지 → **제거 또는 Material Symbols**(룰 11). 단 시안 검증된 이모지는 예외(룰 11).
- 모든 input 16px(iOS) / 버튼·터치 44px / 인라인 grid `repeat(N,1fr)` 사용 시 **720px 분기 필수**(룰 13).
- 영문 UI 금지(룰 14): 운영 코드 식별자(`homeTeamId` 등)는 무관하나, 화면 라벨에 HOME/AWAY/VS/STEP 노출 시 한글(홈/원정/N단계)로. bracket 패널 박제 시 특히 점검.

</details>

---

## 3. 셸 구조 체크리스트 (`AdminTournamentWorkspace.jsx`)

### 3-1. 요약 카드 (`.atw-summary`)
- [ ] 4 `OperationShortcut` 타일 — 참가팀(`teamCount/maxTeams`) · 종별 설정(`divisionCount개`) · 경기 운영(`matchStats.total경기`) · 공개 상태(`공개 중`/`공개 가능`/`N개 확인`). 각 타일 클릭 = `openPanelAndMove(section, panel)`(해당 섹션 스크롤 + 패널 자동 펼침).
- [ ] progress bar — `Math.round(completed/total*100)%`, fill `var(--accent)`, track `var(--bg-alt)`, h 8px, 라운드 4px.
- [ ] 보조문 "진행률 c/t · 공개 가능|N개 남음".
- [ ] lg 우측: `SectionNav`(segment) + 저장 inline. 모바일: 요약 아래 sticky `SectionNav`(top 고정).

### 3-2. 섹션 nav (`.atw-segment` = `ts-segment` 대응)
- [ ] 5탭: 기본 / 일정 / 종별 / 경기 / 접수·공개. `active` 상태 강조, `aria-current`.
- [ ] 클릭 = `moveTo(id)` = 스크롤(offset lg 96 / 모바일 118) + 해시 `replaceState`.
- [ ] 초기 진입 시 `location.hash` 읽어 `LEGACY_SECTION_MAP`(setup→info·teams→publish·structure→divisions·matches→game·staff→game) 변환 후 스크롤.

### 3-3. 2컬럼 그리드 (`.atw-grid`)
- [ ] 좌 컬럼: `info`(대회 정보) + `game`(경기 설정). 우 컬럼: `divisions`(종별·디비전) + `publish`(접수·공개).
- [ ] `min-width:0` + `box-sizing:border-box`, 내부 grid `minmax(0,1fr)`(룰 15 — 이탈 금지). 720px↓ 1컬럼.
- [ ] `schedule`는 info 섹션 **안** `ScheduleVenue` 블록 `id="schedule"`(별도 섹션 카드 아님). 일정 탭은 이 블록으로 스크롤.

### 3-4. 인라인 메가폼 (단일 `form` state)
- [ ] **info**: 대회 이름 / 주최 · 주관 / `SponsorEditor`(후원사 추가 chip + 로고) / `ScheduleVenue`(일정·장소) / 대회 소개 textarea / `<details>` 대표 이미지(로고 1:1 + 배너 16:9).
- [ ] **game**: 경기 시간 · 사용구 · 경기 방식 / `CtGameSettings`(경기 규정) / 대회 규칙 · 상금 textarea.
- [ ] **publish**: 참가비 / 접수 시작·종료(datetime) / 은행 · 계좌 · 예금주 · 참가비 안내 / 최대 팀 · 경기 인원 · 최소·최대 선수 / 자동 승인 · 대기 접수(+대기 상한) 체크박스 / `<details>` 공개 체크리스트.
- [ ] **저장 UI 3종**: ① 요약 inline 버튼 ② lg sticky 하단 바(`.atw-savebar`, "변경사항 있음/저장됨/없음" + 저장) ③ 모바일 fixed 하단 바. `dirty`(`isFormDirty`)·`saving`·`saved`·`error` 상태 시연.
- [ ] **저장 동작 = mock**: `setTimeout`으로 saving→saved 시뮬레이션. 실제 fetch/PATCH 금지(비범위). 검증 메시지(예: "최소 로스터 ≤ 최대 로스터")만 클라이언트 시연.

### 3-5. 패널 마운트 맵 (lazy 토글 시연)
- [ ] **game** 섹션 `PanelSummary` — stats[전체 경기·기록 방식·기록앱·종이·진행중] / panels[경기 운영=matches · 기록원=recorders · 운영진=admins].
- [ ] **divisions** 섹션 — stats[종별·대진 경기] / panels[종별 운영 방식=divisions · 대진 생성=bracket].
- [ ] **publish** 섹션 — stats[참가팀·승인·대기접수·사이트·공개·공개 가능] / panels[참가팀 관리=teams · 사이트 공개=site] + `공개 사이트 보기` 링크(`{subdomain}.mybdr.kr`).
- [ ] `togglePanel`(Set) — 버튼 활성 시 패널 펼침/접힘. 펼침 전 `PanelLoading`("불러오는 중", `.atw-emptybox`).
- [ ] props 계약 시연: 6개 패널 propless(self-fetch 가정) / `matches`만 `{tournamentId, defaultMode, matchStats}` 전달.

---

## 4. 패널 박제 (이번 batch 수준)

| 패널 | 마운트 섹션 | 이번 batch | 비고 |
|---|---|---|---|
| `teams` | publish | 🔬 **B1.1 정밀**(소스 실측 §8-1) — 종별 배정·TeamDetailModal·일괄 import·CSV/카톡 | 기존 `AdminTournamentTeams.jsx` 확장 |
| `bracket` | divisions | 기존 `AdminTournamentBracket.jsx` 재배치 + `NextStepCTA` 푸터(Navy 4px) | 소스 절단 → 내부 정밀은 B1.2 |
| `divisions` | divisions | 🔬 **B1.1 정밀**(소스 실측 §8-2) — 종별 구성·룰 카드·조 설정·진출 매핑 | 기존 `AdminTournamentDivisions.jsx` 확장 |
| `matches` | game | 🔬 **B1.1**(§8-3) — 기록 모드 트리거 + 경기표. `matchStats` 5필드(manual 추가) | 경기표 내부는 B1.2 |
| `admins` | game | 🔬 **정밀 박제**(소스 실측, §5) | — |
| `recorders` | game | 🔬 **B1.1 부분**(§8-4) — 추가/목록 + 경기별 배정(절단) | 배정 UI 하반부 B1.2 |
| `site` | publish | 셸 + `summary.site*` 연동 표시 | 내부 미수록 — B1.2 |

---

## 5. `admins-panel` 정밀 박제 (실측)
- [ ] 헤더: 뒤로 "← 대회 관리" + 제목 "관리자 관리".
- [ ] 추가 폼 카드: 이메일 input(16px) + 역할 select(관리자/스태프/기록원) + 추가 버튼(44px). error=`var(--err)` / success=`var(--ok)` 메시지.
- [ ] 목록: 카드/행마다 아바타(이니셜, bg `var(--bg-alt)`, 글자 `var(--cafe-blue)` — 운영 빨강 본문 금지 룰) + 닉네임 + 이메일 + 역할 chip + 제거(`var(--err)`).
- [ ] empty: "추가된 관리자가 없습니다." (운영 👥 이모지 → Material `group` 아이콘 또는 제거).
- [ ] ROLE_LABEL: owner=주최자 / admin=관리자 / staff=스태프 / scorer=기록원.
- [ ] ⚠️ 번역: 운영 `rounded-full`/`rounded-16px` → 4px(카드 8px) / chip은 유지. 추가·제거 동작 = 로컬 상태 mock(실제 fetch 금지).

---

## 6. 공개 게이트 · 기록 모드 · 단계 CTA (부속 실측)
- [ ] **SetupChecklist**(publish `<details>` 내장): progress bar + 8카드(grid 720↑ 2열) + `PublishGate` + 잠금 toast(`.atsh-toast` 재사용, 2.4초) + `depends_on`("N단계 완료 후 진행"). status 아이콘 = Material(check_circle/pending/radio_button_unchecked/lock).
- [ ] **PublishGate** 4분기: 사이트 미생성(안내) / 공개 중(비공개 전환, `var(--err)` 테두리) / 게이트 통과(공개 버튼 `var(--accent)`) / 미통과(잠금 + 미충족 항목 목록 `var(--warn)`). 동작 mock.
- [ ] **모바일 sticky**(`.atsh-mobile-sticky` 재사용, `sm:hidden`): "공개까지 N개 남음" + 공개 버튼(public/lock). 720px↓만.
- [ ] **기록 모드**(트리거 버튼 + 플로팅 모달): 3택(기록앱/전자기록지/수기) + scope 3라디오(전체/미설정만/진행중 제외) + 사유 textarea(최소 5자) + confirm 모달(영향 N건 미리보기). 동작 mock. 수기 선택 시 안내 1줄.
- [ ] **NextStepCTA**: 단계간 카드 CTA, Navy `var(--cafe-blue)`, 4px, `arrow_forward`. 매핑 종별→팀→대진→경기(matches=null). disabled 시 lock + 사유.

---

## 7. 회귀 검증 (batch 후 — `bake-fix-checklist.md F` 준용)
- [ ] Toss 잔재 grep 0: `data-skin="toss"` · `ts-btn|ts-card|ts-input|ts-field|ts-segment` · `--color-(primary|card|elevated|text-)` · `lucide` → 시안에 미등장.
- [ ] 하드코딩 hex(예외 외) · lucide · 버튼/카드 `9999px` · 핑크/살몬/코랄 = grep 0(룰 10·11·12).
- [ ] Material Symbols Outlined만 사용(§2-2 매핑 적용)(룰 11).
- [ ] 영문 UI 라벨 0 — HOME/AWAY/VS/STEP/LIVE 한글화(룰 14). 코드 식별자·PDF/API 약어 예외.
- [ ] 카드/그리드 자식 `min-width:0`+`box-sizing:border-box`, 내부 `minmax(0,1fr)`, 가로 스크롤·이탈 0(룰 15).
- [ ] 720px 분기 / input 16px / 터치 44px 유지(룰 13).
- [ ] AppNav 무관(B1은 운영 콘솔 셸) — 단 `ud*` HTML 셸에 AppNav 포함 시 frozen 7룰·main bar 우측 5컨트롤 순서 불변 확인.
- [ ] API/Prisma/라우트 제안·운영 src 수정 **부재** 확인(있으면 reject).
- [ ] DB 미지원 패널(recorders/site)이 실기능처럼 보이지 않고 "준비 중" 톤 유지.

---

## 8. B1.1·B1.2 — 패널 내부 정밀 박제 (2026-06-26 소스 실측 반영)

> 출처: `B1-1`(teams·divisions) + `B1-2A/B/C`(site·recorders·matches-client·bracket·dual-editor). **7 패널 + 경기표 전부 실측 확보.** §2·§10 Toss→BDR 번역을 모든 항목에 선적용. 모든 fetch/PATCH/POST = **mock 상태 시연**(실 호출·API 제안 금지). CSV·클립보드·프린트·파싱은 클라이언트 동작 박제 OK.

### 8-1. teams 패널 (`AdminTournamentTeams.jsx` 내부 확장 — 정밀)
- [ ] 헤더: ← 대회 관리 / 참가팀 관리 / "코치 토큰 공유 시 비로그인 입력" 안내.
- [ ] 툴바: **토큰 파일 받기(CSV·UTF-8 BOM)** + **카톡 문구 일괄 복사**(클립보드, alive 토큰 수 뱃지·disabled 가드).
- [ ] 등록경로 stat 4 칩(운영자/코치/본인/경로 미상) — accent 단일 톤(빨강 본문 금지).
- [ ] **종별 배정 현황**: 종별별 카드(전체/승인/정원, 준비·대기·정원 초과 배지) + **랜덤·시드 조편성** 버튼(승인 ≥2 가드, 미배정 경고). 동작 mock.
- [ ] 필터 chip 5(전체/대기/승인/거절/**코치 미입력**) + count. chip 4px·dot 9999px 허용.
- [ ] **종별 그룹핑** 팀 카드: 종별 헤더 + 카드(색 dot[원형 50% OK]·팀명·`ViaBadge`·`StatusBadge`·대기 N번·코치 입력 대기·선수 N명·신청/등록일·코치·신청자·**링크 복사**[alive/만료]·시드/조 input·status pill·승인/거절).
- [ ] **TeamDetailModal**: 종별 select·`PaymentBadge`+납부 select(미납/납부/환불)·코치 inline 편집(이름/전화·tel 링크)·조/시드 input·토큰 만료+**재발급**·URL 복사·승인/거절·**프린트**·선수 명단 table[#·이름·생년월일·학교·포지션·학부모·연락처]+모바일 카드·선수 추가 폼(이름/전화/등번호/포지션).
- [ ] **선수 일괄 입력 모달**: 카톡 텍스트 `이름/생년월일/등번호/포지션/학교/보호자/연락처` 파싱→오류 줄 안내→미리보기, overwrite·strict 체크. 파싱은 클라이언트 동작 박제.
- [ ] 우상단 toast(3초) · 프린트 전용 CSS(`#team-detail-printable`만 visible) · `NextStepCTA`(다음: 대진표).
- [ ] 배지 헬퍼 4종(`ViaBadge/StatusBadge/PaymentBadge/RosterProgressBadge`) BDR 토큰 색으로 박제. `color-mix(... var(--color-*) ...)` → BDR 토큰 틴트로 치환.

### 8-2. divisions 패널 (`AdminTournamentDivisions.jsx` 내부 확장 — 정밀)
- [ ] **종별 구성**: 마스터 카테고리 chip 토글 → 선택 디비전 행(디비전명·정원·참가비 input + **일정 select** + **체육관 select** + 삭제 44px) + 종별 저장 + 결과 배너(신규/갱신/삭제 N).
- [ ] **종별 룰 카드**: code 모노 칩(info 틴트) + 라벨 + 학년/참가비 + 날짜·코트 칩 + **진행 방식 select**(8 enum: 토너먼트/풀리그/조별+토너먼트/듀얼 등 `FORMAT_LABEL`).
- [ ] **조 설정 입력**(풀리그 계열일 때만): 조 크기·조 개수·**동순위전 방식**(풀리그/토너먼트, 2조 이하=단판 안내문)·**조별 본선 진출 팀 수** + 총 팀수·총 진출 계산. dual_tournament=고정값(조 크기 4·진출 2) 분기.
- [ ] **진출 매핑 실행** 버튼 + 결과 배너(갱신/제외 N). empty box(아이콘+안내, `ct-emptybox--tall`).

### 8-3. matches 패널 (B1.2 전문 — 정밀)
- [ ] 패널 = **기록 모드 트리거**(B1 §6) + **`MatchesClient` 경기표**. `matchStats` **5필드**(total/paper/flutter/**manual**/inProgress).
- [ ] 헤더: 경기 운영 + 대진표 생성/재생성 + `AdvancePlayoffsButton`(순위전 진출). `PlaceholderValidationBanner`(placeholder 매치 경고).
- [ ] **종별 필터 chip**·**체육관 필터 chip**(각 2개↑일 때만). 라운드 그룹핑.
- [ ] 데스크톱 **표**(`amt-table` — BDR `admin.css`에 이미 존재 → 재사용): 시간·코트·종별·대진·스코어·상태·#. 모바일 카드.
- [ ] **ScoreModal**: 홈/원정 팀 select·점수·상태·승자·일정·경기장·**기록 방식 토글**(기록앱/전자기록지 + "전자기록지 열기" `/score-sheet/[id]` 링크)·삭제/저장. 변경 필드만 저장(mock), 모드 전환 confirm + 사유 prompt(mock).
- [ ] ⚠️ 변환: `ts-*`·lucide(`x`/`map-pin`/`calendar-plus`)→Material Symbols, `rounded-[24px]` 모달→8px, "vs"→"대"(이미 일부 "대" 사용).

### 8-4. recorders 패널 (B1.2 전문 — 정밀)
- [ ] `max-w-2xl` 단일 컬럼. ① 기록원 추가 Card(이메일 + 추가, "bdr_stat 앱 실시간 기록" 안내) ② 목록 Card(아바타[원형→`var(--bg-alt)` 50%]·닉네임·이메일·제거 `var(--err)`).
- [ ] **경기별 기록자 배정** Card: 헤더 + **자동 배정** 버튼(미배정 경기 라운드로빈, `unassignedCount` 안내) + 경기 행마다 기록자 `select`((미배정)+활성 풀) + 현재 배정 라벨. 배정/자동배정 = mock(낙관 갱신 시연). DB 미지원분 "준비 중" 톤 유지.
- [ ] ⚠️ 변환: `ui/Card·Button·Image`→BDR 카드/버튼, `rounded-lg/full`→4px(아바타만 원형 OK).

### 8-5. site 패널 (B1.2 전문 — 정밀)
- [ ] **3-step 위자드**: ① 템플릿 3종(Classic/Dark/Minimal) `TemplateMockup`(미니 nav/hero/content, **미리보기 고정 hex = 의도적 예외**) ② 색상 8 프리셋 원형 스와치(BDR Red 포함) + 미리보기 nav ③ 서브도메인 input(`.mybdr.kr`) + 요약 + 임시저장/공개.
- [ ] step indicator(원형 번호, 완료 ✓) — 원형은 9999px 허용(버튼/카드 아님).
- [ ] **발행 완료 상태**: 공개 중 카드(`{subdomain}.mybdr.kr`·방문/비공개 전환) + 수정 버튼 3(템플릿/색상/공지). 저장·발행 = mock.
- [ ] ⚠️ 변환: 이모지 🎨📄🚀 → Material Symbols(palette/description/rocket_launch) 또는 제거, `ui/Button`+`btn` 혼재 → BDR 버튼 통일.

### 8-6. dual-group-assignment-editor (bracket 종속)
- [ ] 4그룹(A/B/C/D)×4슬롯 `select` 그리드 + **자동 시드** 버튼(시드/등록순) + 검증(16팀 unique) + 저장(`settings.bracket.groupAssignment`+`semifinalPairing`, mock) + 매치 생성 트리거. dual + 16팀 + 매치 0건일 때만 노출.

## 9. B1.2 — 생성 마법사 내부 박제 (§2 생성/info 섹션 연계)

> `ct-schedule-venue`·`ct-game-settings`는 워크스페이스 info/game 섹션 + 생성 마법사 공용. `admin-toss`(Btn/Modal/Icon=lucide) → BDR 변환.

### 9-1. 일정·경기장 (`ct-schedule-venue`)
- [ ] **VenueSearch**: 검색 input + 드롭다운(자동완성 = `VENUE_DB` mock + "직접 추가"). Kakao `/api/web/place-search`는 **호출 금지** → mock 자동완성만. 지도/길안내 링크 칩.
- [ ] **CalendarModal**: 다중 날짜 선택(월 이동·오늘 표시·선택 토글·N일 카운트). 모달 = BDR 모달 패턴.
- [ ] 장소 행: 코트 수 **Stepper(1~8)** + 코트 명칭 **SegSm(숫자/알파벳)** + 코트 칩. 날짜 블록: N일차 + 날짜별 코트 배정 chip(toggle).
- [ ] court id 규격 `${venueId}_c${idx}` 유지. `ct-*` 클래스 → BDR `admin.css` 신규(ct-vsearch/venuerow/dateblock/courtpick/cal/stepper/segsm 대응).

### 9-2. 경기 규정 (`ct-game-settings`)
- [ ] **유니폼 규칙**: 홈 밝은색/원정 어두운색 셀 + **swap** 버튼 + 조끼 제공 체크. `UNIFORM_PALETTE` **16색** 모달(`UniformModal`, 직접 hex 입력) — **저지 hex = 도메인 예외(하드코딩 허용)**.
- [ ] **경기 구성**: 프리셋 칩 + 운영방식 SegSm(논스톱/올데드) + 쿼터수(4쿼터/전후반) + 쿼터/연장/막판 정지 Stepper + 샷클락 SegSm.
- [ ] `<details>` **파울·타임아웃**(개인/팀파울/타임아웃 전후반·시간) + **휴식 시간**(쿼터 사이/하프/연장 전/자동 시작). controlled `GameRules` 객체 1개.
- [ ] ⚠️ 변환: admin-toss `Btn/Modal/Badge`·lucide → BDR. Stepper/SegSm/SetRow/RuleDetails는 `ct-*` 재사용.

### 9-3. 종별 진행방식 (`division-formats.ts`)
- [ ] **6 enum 라벨** 단일 source 박제: single_elimination=토너먼트 / round_robin=풀리그 / dual_tournament=듀얼토너먼트 / group_stage_knockout=조별리그+토너먼트 / league_advancement=링크제 / group_stage_with_ranking=조별리그+동순위 순위결정전.
- [ ] 가드 반영: 조 설정 노출(`showGroupSettings`) / 동순위전 방식(`showRankingFormat`=group_stage_with_ranking) / 조별 진출 수(`shouldShowAdvancePerGroup`=group_stage_knockout·dual) / `ADVANCE_PER_GROUP_DEFAULT=2`. divisions 패널(§8-2) + 종별 step이 이 라벨/가드 사용.

## 10. Toss 스타일 유지 점검 (관리자 영역 — 정정본)

> 구 "키트·룰 변환" 체크리스트는 폐기. 관리자 시안은 아래를 **유지**해야 통과(번역하면 reject).
- [ ] `data-skin="toss"` 루트 유지 · `ts-*`/`ct-*`/`admin-toss`/`ui/*` 클래스 그대로.
- [ ] **lucide 아이콘 유지**(Material Symbols로 치환 금지). `admin-toss <Icon>` 이름 그대로(map-pin/shirt/calendar-days 등).
- [ ] **Toss blue**(`--color-primary`) · `--color-info`(navy) · `--color-success/warning/error` 토큰 그대로.
- [ ] **`rounded-full`/9999px** 버튼·칩·스와치·step 번호 유지(4px 강제 금지).
- [ ] 이모지(🎨📄🚀🏆)·color-mix 틴트 유지.
- [ ] **도메인 hex 보존**: site `TEMPLATES` 미리보기 + `UNIFORM_PALETTE` 16 저지색 = 그대로.
- [ ] 영문 라벨: 운영 그대로(HOME/AWAY/vs 등도 Toss 원본 유지) — 단 한글 라벨 운영본은 한글 유지. **사용자 공개 영역만** 영문 금지.
- [ ] 기능/상태 계약은 `function-lock-B1.md` 대조 — 누락 0.
- [ ] (사용자 영역 분리) AppNav frozen 7룰 + 사용자 §1~§8 = 공개 영역에만 적용, 관리자 워크스페이스엔 비적용.
