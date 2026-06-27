# PARITY-MATRIX.md — 시안 → 운영 박제 매핑 (v2.42)

> 목적: Codex CLI가 각 운영 파일을 시안과 **100% 정합**으로 박제할 수 있도록, 시안 컴포넌트·클래스·함수 → 운영 파일 매핑을 1:1로 확정.
> 기준 시안: `Dev/design/BDR v2.41-admin-toss/` (v2.42 보강판). 모든 패널 = **Toss 키트 + ts-/ct-/amt-/sc-/bk-/op-/tw- 클래스**.

---

## 0. 시안 파일 → 역할 → 운영 경로

| 시안 파일 | 정의 컴포넌트(window.*) | 운영 박제 경로(권장) |
|---|---|---|
| `toss.css` | (디자인 토큰·ts-* 유틸) | `app/(admin)/_styles/toss.css` 또는 글로벌 admin css |
| `workspace.css` | (ct-/amt-/sc-/bk-/op-/tw- 클래스) | 동 admin css (workspace 영역) |
| `toss-kit.jsx` | `Icon Btn Badge Modal Toggle Check StepDots Empty` | `components/admin-toss/*` (공용 kit) |
| `operate.jsx` | `OperateWorkspace` `OpsManage` `Settle` | `tournament-admin/tournaments/[id]/page` (운영 셸) |
| `panels-core.jsx` | `TeamsPanel DivisionsPanel MatchesPanel` (+ `ScoreModal TeamModal ImportModal`) | 각 패널 컴포넌트 파일 |
| `bracket.jsx` | `BracketPanel` (+ `balancedRR dualGroupStages`) | 대진 패널 (**panels-core의 BracketPanel 폐기 후 이걸로**) |
| `schedule.jsx` | `SchedulePanel` (+ `AutoModal ManualModal buildLanes buildGames balancedRR`) | 일정 패널 |
| `panels-ops.jsx` | `RecordersPanel SitePanel AdminsPanel ScheduleVenue GameSettings` (+ `CalendarModal VenueSearch`) | 기록원/사이트/운영진 + 생성 마법사 |
| `data.jsx` | `window.WS` + 라벨맵 | **API/DB 바인딩 지점** (DATA-CONTRACT.md 참조) |

---

## 1. 워크스페이스 셸 (OperateWorkspace)

| 시안 요소 | class | 운영 매핑 |
|---|---|---|
| 상단 헤더(eyebrow/title/상태 pill) | `ts-ph` `ts-ph__row` `ts-ph__eyebrow` `ts-ph__title` `ct-pill` | 대회 헤더 컴포넌트 |
| 6 메뉴 탭 | `op-menu` `op-menu__item` | 운영 탭 네비 (teams/bracket/schedule/ops/site/settle) |
| 섹션 카드 | `ts-card` `ct-section__head` `ct-headicon` `ct-section__title/sub` | 패널 래퍼 |
| 본문 라우팅 | `CONTENT[menu]` map | 탭 → 패널 컴포넌트 스위치 |
| "대회 정보 수정" | `Btn iconRight="pencil"` → `대회 수정.html` | `/tournament-admin/tournaments/[id]/edit` 라우팅 |

> ⚠ 메뉴는 6개(참가팀·대진표·일정·운영관리·사이트·정산). "운영관리"(`OpsManage`) 안에 **AdminsPanel + RecordersPanel** 임베드. 즉 브리프의 "7패널" = 6메뉴 + 운영관리 내부 2패널.

---

## 2. 패널별 class / 컴포넌트 / 함수 매핑

### 2-1. 참가팀 (TeamsPanel · panels-core.jsx)
- 컴포넌트: `TeamsPanel` / `TeamModal` / `ImportModal`
- class: `ct-panel-stats` `ct-metric` `ct-metric__lbl/val` · `ct-pill[data-tone]` · `ts-chip[data-active]` · `ts-card--tight` · `amt-table`(선수 명단)
- 라벨맵: `VIA_LABEL` `TEAM_TONE` `TEAM_STATUS` `PAY_LABEL`
- 동작: `setStatus(승인/거절)` · `copy()`(토큰/카톡/링크) · `window.print()`(프린트)

### 2-2. 대진표 (BracketPanel · bracket.jsx — **full**)
- 컴포넌트: `BracketPanel` / 헬퍼 `balancedRR(L,size)` `dualGroupStages(L,size)`
- class: `bk-cfg-grid` `bk-subh` `bk-groups` `bk-group` `bk-group__name/games` `bk-slot` `bk-slot__lbl/team/assign` `bk-pick` `bk-dualrow` `bk-tree` `bk-round` `bk-round__name/body` `bk-cell` `bk-match` `bk-seedrow` `bk-fromnote`
- 상태: `phase` = `config | seeding | drawn` · `byDiv[code]` 종별 독립 상태
- 발행: `publish()` → `window.__BRACKET[code]` + `bracket:publish` 이벤트
- ⚠ `DivisionGenerateButton` 대응 = 종별 칩 + 추첨 버튼군 / `DualGroupAssignmentEditor` 대응 = `bk-dualrow` 조별 더블엘리미 렌더

### 2-3. 일정 (SchedulePanel · schedule.jsx)
- 컴포넌트: `SchedulePanel` / `AutoModal` / `ManualModal` / 헬퍼 `buildLanes` `buildGames` `venueAbbrev` `addTime`
- class: `sc-durgrid` `sc-durcell` `sc-durcell__lbl/cnt` · `sc-lane-court` `sc-lane-head` · `sc-table`(+amt-table) `sc-divtag` `sc-handle` `sc-del` `sc-break` `sc-dragging` `sc-droptail` `sc-brkmin` · `sc-automx` `sc-autorow` `sc-autorow__lane/chips` `sc-divchip` · `sc-manbar` `sc-manchips` `sc-manset` `sc-manwrap` `sc-manpool` `sc-poollist` `sc-poolcard` `sc-manlane` `sc-mandrop` `sc-manitem` `sc-manempty`
- 데이터 소스: `window.__BRACKET` 발행분 우선 → 없으면 조별 round-robin 생성
- 경기번호: `코트약어 + MMDD + 순번`

### 2-4. 경기 (MatchesPanel · panels-core.jsx)
- 컴포넌트: `MatchesPanel` / `ScoreModal`
- class: `amt-table` `amt-table-wrap` `amt-table__time/court/div/score/teams` `vs` · `ts-segment` `ts-segment__btn` · `ct-pill[data-tone]` · `ct-checkrow`
- 라벨맵: `MATCH_TONE` `MATCH_STATUS`
- 통계: `WS.matchStats`(total/flutter/paper/inProgress)

### 2-5. 운영관리 (OpsManage · operate.jsx)
- class: `ops-role-grid` `ct-metric` `ts-card--flat` `ct-checkrow` `ts-textarea`
- 임베드: `<window.AdminsPanel/>` + `<window.RecordersPanel/>`

### 2-6. 기록원 (RecordersPanel · panels-ops.jsx)
- class: `ts-card--flat` `ts-avatar` `ts-select` · 인라인 행 스타일
- 동작: `add`(이메일) · 경기 select 배정 · `자동 배정`(round-robin %) · 미배정 카운트

### 2-7. 사이트 (SitePanel · panels-ops.jsx)
- 컴포넌트: `SitePanel` / `Mock`(템플릿 미리보기)
- class: `StepDots` 위자드 · `ts-field` `ts-field__label/hint` · `ts-card--tight`
- 상태: `step`(1 템플릿 / 2 색상 / 3 발행) · `published` 분기(공개 URL + 비공개 전환)

### 2-8. 운영진 (AdminsPanel · panels-ops.jsx)
- class: `ts-card--tight` `ts-avatar` `Badge` · `ROLE_LABEL`
- 동작: `add`(이메일+role) · 제거(owner 제외)

### 2-9. 정산 (Settle · operate.jsx)
- class: `ct-panel-stats` `ct-metric__lbl` · `amt-table` · 인라인 지출 행

### 2-10. 생성 마법사 (panels-ops.jsx)
- `ScheduleVenue`: `ct-embedded-block` `ct-venuerow` `ct-dateblock` `ct-courtpick` `ct-adddate` `ct-cal__*`(CalendarModal) `ct-vsearch__opt`(VenueSearch) `ct-stepper`(Stepper) `ct-segsm`(SegSm)
- `GameSettings`: `ct-headicon` `ct-rule-top` `ct-checkrow` `ct-details` + `Stepper`/`SegSm` + `WS.gamePresets`

---

## 3. Toss 키트 ↔ 운영 컴포넌트

| 시안 | props | 운영 컴포넌트 |
|---|---|---|
| `Icon name size color` | lucide 이름 | `<Icon>`(lucide-react wrapper) |
| `Btn variant size icon iconRight block disabled` | primary/secondary/danger/ghost | `<Button>` |
| `Badge tone` | primary/grey/ok/warn/err | `<Badge>` |
| `Modal open onClose title sub foot maxWidth` | — | `<Modal>` |
| `Toggle` / `Check on onChange` | — | `<Switch>` / `<Checkbox>` |
| `StepDots step total` | — | `<StepDots>` |
| `Empty` | — | `<EmptyState>` |

---

## 4. 미리보기 파일 ↔ 패널 (검수 진입점)

| 미리보기 HTML | 마운트 | 검수 대상 |
|---|---|---|
| `tournament-ops-preview.html` | `OperateWorkspace` | 셸 + 6메뉴 + 반응형 |
| `teams-preview.html` | `TeamsPanel` | 팀 9상태 |
| `bracket-preview.html` | `BracketPanel` | 대진 9상태 |
| `schedule-preview.html` | `SchedulePanel` | 일정 9상태 |
| `matches-preview.html` | `MatchesPanel` | 경기 + ScoreModal |
| `site-recorders-admins-preview.html` | `SitePanel`+`RecordersPanel`+`AdminsPanel` | 사이트/기록원/운영진 |
| `admin-state-preview.html` | (상태 갤러리) | loading/empty/error/saving/saved/permission/mobile/destructive |

공용 셸: `preview-shell.jsx` + `preview.css` (viewport 390/720/1024/1440/full 전환 + 상태 가이드). **운영 박제 대상 아님 — 검수 전용.**
