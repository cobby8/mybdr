# 관리자 영역 Toss 시안 — IA 정합 + CLI 핸드오프

작성: 2026-06-27 · 기준 패키지: `Dev/design/BDR v2.41-admin-toss/` (업로드 `BDR v2 (44).zip`)
결정: **단계 PR** 방식 · 산출물: 본 문서 1개

> 목적: 업로드된 admin-toss 정본 패키지를 기준으로 (1) 진입점/IA 정합을 확정하고, (2) 구현 프롬프트의 불일치를 정리하고, (3) 신규 필드 9건을 운영 스키마와 대조하고, (4) Codex/Claude CLI가 단계 PR로 박제하도록 실행 계획을 제공.

---

## 0. 패키지 배치 (선행 작업)

업로드 패키지는 아직 운영 저장소에 없음. 저장소에는 **예전 버전** `Dev/design/BDR-current/_handoff-admin-toss-v2.41/`(+P0/+v2.40-unified)만 존재.

- 프롬프트가 기대하는 경로 = `Dev/design/BDR v2.41-admin-toss/` (정본 파일명 PARITY-MATRIX 등 그대로 들어있음)
- **권장**: 업로드 zip을 `Dev/design/BDR v2.41-admin-toss/`로 풀어 배치하고, 예전 `BDR-current/_handoff-admin-toss-*`는 `_archive/`로 이동(혼동 방지). 단일 source 1개만 남긴다.

---

## 1. 프롬프트 ↔ 패키지 불일치 (먼저 정리)

프롬프트는 "1순위로 읽을 것" 목록을 주지만 일부는 패키지에 없음. **CLI에 넘기기 전 아래로 치환**해야 헛읽기/대기 없음.

| 프롬프트 지칭 | 패키지 실재 | 처리 |
|---|---|---|
| `START-HERE.md` (§9 진입점 연결 맵) | **없음** | `README.md` + `HANDOFF.md §1` + `_qa/deadbutton-audit-B1.md §2`로 대체 |
| `screenshots/INDEX.md` + `*.png` | **없음** | 정합 기준 = 라이브 `*-preview.html` 6종 + 진입 HTML 9종 (스크린샷 아님) |
| `PARITY-MATRIX.md` | ✅ 있음 | 그대로 |
| `CLEANUP-MANIFEST.md` | ✅ 있음 | 그대로 |
| `DATA-CONTRACT.md` | ✅ 있음 | 그대로 (§11 신규 필드 9건) |
| `TOURNAMENT-OPS-STATES.md` | ✅ 있음 | 그대로 |
| `ADMIN-TOSS-STATE-QA.md` | ✅ 있음 | 그대로 |
| `RESPONSIVE-QA.md` | ✅ 있음 | 그대로 |
| 시안 src `Dev/design/BDR v2.41-admin-toss/` | (배치 후) ✅ | §0 배치 선행 |

**정합 기준 정정**: "스크린샷 픽셀 정합" → **HTML 시안(`npx serve` 후 preview/진입 HTML) 대비 정합**.

---

## 2. 정본 IA — 진입점/구조 (확정)

패키지가 내린 결정으로 기존 "불편한 구조"를 해소한다. 핵심: **대회 운영 = 단일 스크롤 워크스페이스, 두 셸은 역할로 분리, 옛 허브/분리 패널은 삭제.**

### 2-1. 8 셸/진입 화면 → 운영 라우트

| 진입 화면 (시안 HTML) | 정의 컴포넌트 | 운영 라우트(박제 대상) |
|---|---|---|
| 대회 운영 워크스페이스 | `operate.jsx` `OperateWorkspace` | `/tournament-admin/tournaments/[id]` |
| 대회 생성(5단계) | `panels-ops.jsx` 마법사 | `/tournament-admin/tournaments/new` (단일 진입) |
| 대회 수정 | 동 마법사(edit 모드) | `/tournament-admin/tournaments/[id]/edit` |
| 대회 관리자 셸 | `ta-pages.jsx` + `admin-shell.jsx` | `/tournament-admin/*` (목록/단체·주최/시리즈/템플릿) |
| 백오피스(18화면) | `bo-pages.jsx` + `admin-shell.jsx` | `/admin/*` |
| 협력업체 콘솔 | `partner-pages.jsx` | `partner-admin/*` |
| 심판 관리자(12화면) | `referee-pages.jsx` | `referee/*` |
| 공개 토너먼트 사이트 | `public-site-*`(44팀 통일본) | `(site)/*` 서브도메인 |
| 관리자 홈 | `AdminConsole`/대시보드 | `/admin` |

### 2-2. 두 "대회" 영역 — 합치지 않고 역할 분리

- `/tournament-admin/*` = **대회 관리자(운영자) 셸** — 목록·생성·운영·정산. 일상 작업은 전부 여기.
- `/admin/*` = **플랫폼 백오피스(최고관리자)** — 사용자/결제/요금제/코트/분석 18화면 + `tournaments/[id]/audit-log`·`transfer-organizer` 같은 **감독 전용** 기능만.
- 즉 "대회 목록이 두 개"라는 혼란의 답 = **목록은 `/tournament-admin`에 일원화**, `/admin/tournaments[id]`는 감독(감사/주최자 이관) 전용으로 좁힌다. (HANDOFF P2 표: 두 그룹 모두 "교체", 별개 셸 유지)

### 2-3. 대회 운영 = 6메뉴 + 7패널 (단일 스크롤)

`op-menu` 6개: **참가팀 · 대진표 · 일정 · 운영관리 · 사이트 · 정산**. "운영관리"(`OpsManage`) 안에 **운영진(AdminsPanel) + 기록원(RecordersPanel)** 임베드 = 브리프의 "7패널".
패널 정의 파일: `panels-core.jsx`(teams/divisions/matches) · `bracket.jsx`(full BracketPanel) · `schedule.jsx` · `panels-ops.jsx`(recorders/site/admins + 생성 마법사) · `operate.jsx`(OperateWorkspace/OpsManage/Settle).

### 2-4. 진입점 연결 맵 (데드버튼 0)

```
관리자 홈 "새 대회"            → 대회 생성(5단계)
대회 관리자 목록 행 클릭        → 대회 운영 워크스페이스   ← (현재 무반응 = 수정 대상)
대회 관리자 행 액션 "운영"      → 대회 운영
대회 운영 "대회 정보 수정"      → 대회 수정
대회 운영 사이트 패널 발행      → 공개 토너먼트 사이트({subdomain}.mybdr.kr)
백오피스 대회 행               → 대회 운영
백오피스 협력업체 행           → 협력업체 콘솔
콘솔 브랜드(로고)             → 관리자 홈
```
그 외 서버 연동 동작 = `window.adToast`로 "(시연)" 토스트 통일. 화면 이동(생성/수정/운영)만 실 네비게이션.

---

## 3. 생성 입구 결정 — 4-method 폐기 → 5단계 단일

- **현재 운영 코드**: `tournament-admin/tournaments/_components/admin-entry-cta.tsx`의 4-method 패널 — Quick / Legacy(`?legacy=1`) / Prospectus(`/new/wizard/prospectus`) / Association(`/wizard/association`). 시안에는 **개념 자체가 없음.**
- **정본 결정**: "새 대회 만들기" → **단일 진입 → 대회 생성 5단계 마법사**(`대회 생성.html`). `admin-entry-cta`의 4-method 패널·헤더 버튼 이중 입구 **제거**.
- 단, **PDF 요강(prospectus)**, **협회 등록(association)** 기능이 실제로 쓰이는지 사용자 확인 필요 — 시안 미반영 기능을 코드에서 지울지/보존할지는 §6 결정 항목.
- 5단계 구성(v2.40-unified 정본): 기본 · 종별/정원 · 일정/장소 · 참가비/정산 · 검토. (생성 마법사 좌측 스텝 레일)

---

## 4. 레거시 제거 기준 (CLEANUP-MANIFEST 요약)

대회 운영 화면은 **Toss 단일 계층만** 남긴다. 하이브리드 fallback 금지.

```
🟩 유지   : ts-/ct-/amt-/sc-/bk-/op-/tw-shell · toss-kit · lucide · (공개사이트) Material Symbols
🟧 교체   : au-* → Toss패널 · components/ui → toss-kit · 공개사이트 38팀 → 44팀 통일본
🟥 삭제   : admin-* · ta-* · (관리자)Material Symbols · panels-core의 BracketPanel(간이판)
🟦 조건부 : tw-*(shell만 유지) · DivisionsPanel(위치 단일화 후)
```

- **불편의 핵심 원인 = 옛 허브/분리 패널** — `AdminTournamentSetupHub`(8카드 hub) + 분리 화면(ud1/ud2/ud3/pa5/pa6) + `SetupChecklist`(허브) → 단일 워크스페이스 + 발행 섹션 내 `<details>`로 강등. **삭제/흡수.**
- 관리자 영역 **Material Symbols 폰트/클래스 제거**(공개 사이트 번들에는 유지). 교체 매핑은 CLEANUP §3(참가팀=`users`, 대진=`git-merge`, 일정=`calendar-clock`, 정산=`wallet`, 심판=`flag` …).
- `BracketPanel` 중복: `bracket.jsx`의 full 버전만 채택, `panels-core.jsx` 간이판 삭제(로드 순서상 dead code).
- 삭제 전 회귀 체크: CLEANUP §4 4항목(교체 완료 확인 / toss-kit 1:1 / 깨진 아이콘 / 대진 full 기능 유지).

---

## 5. 신규 필드 9건 — 운영 스키마 실측 대조 (⚠ 중요)

DATA-CONTRACT §0 명시: **"신규 마이그레이션 지시 아님. 🔴 = 백엔드 확인 요청."** 시안의 "DB 미보유" 가정을 그대로 믿지 말 것 — **일부는 이미 운영 스키마에 존재**한다. 아래는 예비 판정(과거 schema 조사 기반), **CLI가 schema.prisma 1회 실측으로 확정**해야 한다.

| # | DATA-CONTRACT 🔴 항목 | 예비 판정 (실측 선검증) |
|---|---|---|
| 1 | `summary.progress*` 진행도 산식 | **신규 정의 필요**(저장 아님, 파생 산식) |
| 2 | schedule: `match_duration_min`/`court_start_time`/`schedule_slot` | **대체로 신규** — 단 `TournamentMatch.scheduledAt`·`court_number`·`venue_id` 기존. lane/order/break 배치 저장은 신규 |
| 3 | bracket: `bracket_seed {slot,teamId,locked}` | 신규 추정 — 단 `TournamentTeam.seedNumber` 기존(시드 고정엔 재사용 가능) |
| 4 | matches: `recording_mode`(매치별) + 변경 `reason` | **실측 필요** — `youtube_status` 유사 필드 존재. recording_mode 별도 여부 확인 |
| 5 | teams: `coach_token`, `player` 로스터 | **대부분 기존** — `TournamentTeam.apply_token`/`apply_token_expires_at` = 코치 토큰. `TournamentTeamPlayer`(player_name/birth_date/jersey/position) = 로스터. **신규 아님 가능성 큼** |
| 6 | recorders: `match_recorder` 배정 | 신규 추정(P0 DATA-BINDING도 `recorder_assignments` 신규로 명시) |
| 7 | site: 서브도메인 unique check, `publishedSections[]` | `TournamentSite.subdomain` unique 기존. `publishedSections[]`는 신규 |
| 8 | admins: `admin_invite.status`, role→permission | `TournamentAdminMember` 기존. 초대 상태/권한 매트릭스는 실측 필요 |
| 9 | settle: `tournament_expense` | 신규 추정(시안 하드코딩) |

→ **CLI 첫 작업에 "schema.prisma + 신규필드 9건 대조표" 포함**. 이미 있는 필드(특히 5번)는 신규 만들지 말고 바인딩만. errors.md의 snake_case 응답키 룰도 동일 적용(신규 필드 추가 시 curl 1회 raw 확인).

---

## 6. 사용자(수빈) 결정 필요 2건

1. **PDF 요강(prospectus) / 협회 등록(association) 기능 처분** — 시안에 없음. (a) 코드에서 제거 / (b) 별도 보존(생성 5단계와 공존) / (c) 5단계 마법사 안으로 흡수. → 실제 사용 빈도로 결정.
2. **`/admin/tournaments` 목록 처분** — `/tournament-admin`로 목록 일원화 시, `/admin/tournaments`(목록)은 (a) 제거 / (b) `/tournament-admin`로 리다이렉트 / (c) 감독용 읽기 목록으로 축소. (상세 `[id]`의 audit-log/transfer-organizer는 유지.)

---

## 7. 단계 PR 실행 계획 (CLI)

패키지 P2 표·PR 계획과 일치. 각 단계 = 구현 파일 / 시안 대비 차이 / 신규 필드·엔드포인트 요청 보고.

- **PR-0 사전**: §0 패키지 배치 + §1 불일치 치환 + §5 스키마 실측 대조표 + §6 결정 반영. (코드 변경 0, 계약 확정)
- **PR-1 공유 기반**: `toss.css` → `components/admin-toss`(Icon/Btn/Badge/Modal/Toggle/Check/StepDots/Empty) → `admin-shell`(AdminShell/PageHead/KpiGrid/DataTable) + `admin-blocks`(SchemaList 등). Material Symbols(관리자) 제거 + lucide 매핑.
- **PR-2 대회 운영 워크스페이스**: `operate.jsx` 6메뉴+7패널 박제 → `/tournament-admin/tournaments/[id]`. 옛 허브/분리패널/`admin-*`·`ta-*` 삭제. 데이터는 기존 API/DB 바인딩, mock 자리만 치환.
- **PR-3 생성/수정 마법사**: 5단계 단일 진입(`/new`, `/[id]/edit`). 4-method 패널 폐기(§6-1 결정 따름).
- **PR-4 셸별(콘솔)**: 대회 관리자 목록·시리즈·템플릿 / 백오피스 18 / 협력업체 / 심판 — `admin-shell`+`toss-kit` 재사용, 데드버튼 배선(`adToast`/`onRow`).
- **PR-5 공개 사이트**: `public-site-*`(44팀/27경기 통일본). 구 38팀본 대체. 발행 섹션 가시성.

각 PR 자가검수: 해당 `*-preview.html`와 나란히 비교 + 상태 8종(loading/empty/error/saving/saved/permission/mobile/destructive, ADMIN-TOSS-STATE-QA) + 반응형 390/720/1024/1440(RESPONSIVE-QA).

### PR-1 시작 프롬프트(붙여넣기용 골격)
```
역할: MyBDR 시니어 프론트엔드 엔지니어. 관리자 영역을 Toss 시안과 1:1 정합으로 박제.
기준 패키지: Dev/design/BDR v2.41-admin-toss/ (START-HERE 없음 → README.md + HANDOFF.md §1 + _qa/deadbutton-audit-B1.md §2 로 진입맵 파악)
범위: PR-1 공유 기반만. (1) toss.css 토큰 이식 (2) toss-kit → components/admin-toss (3) admin-shell/admin-blocks
규칙: CLEANUP-MANIFEST 처분표 준수(유지 ts-/교체 au-/삭제 admin-·ta-·관리자 Material Symbols). lucide만. 운영 src UI 외 비즈로직 변경 0.
선행 보고: schema.prisma 실측으로 DATA-CONTRACT §11 9필드 대조표 제출(특히 5번 coach_token=apply_token / 로스터=TournamentTeamPlayer 기존 여부) → 승인 후 코드 진행.
산출 보고: 구현 파일 / 시안(preview HTML) 대비 차이 / 신규 필드·엔드포인트 요청.
```

---

## 8. 리스크 / 주의

- 시안 = **mock 상태 시연**(실 API/Prisma/라우트 없음). 클라이언트 동작(필터·캘린더·import 파싱·토스트)만 실제. 백엔드 배선 시 mock 자리에만 실 데이터.
- **운영 DB 단일**(운영=개발 겸용). 신규 필드 추가 시 `prisma db push`는 schema diff 사용자 검토 후, NULL 허용 ADD COLUMN 같은 무중단 변경만. (CLAUDE.md §DB 정책)
- 두 디자인 시스템 분리 엄수: 관리자=Toss(lucide/Toss blue/rounded-full) · 공개=BDR 13룰(Material Symbols). 혼입 시 자동 reject.
- 범위 큼 — PR 단위로 끊어 회귀 검증. P2(전 관리자 페이지)는 대회 운영(PR-2) 박제 완료 후.
