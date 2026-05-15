# Admin 흐름 전면 점검 (Phase 0 / read-only)

> 작성: 2026-05-16 / planner-architect / 강남구협회장배 시나리오 우선
> 산출물 한계: read-only 분석 / 코드 수정 0 / 운영 DB SELECT 0 / 개선 설계 X (관찰만)

## §0. 핵심 발견 요약 (한 줄)

1. **마법사 (`/tournaments/new/wizard`) 의 산출물 = `tournament` row + 기본 메타 1건뿐**. 종별 / 운영방식 / 팀 / 대진표 모두 마법사 밖 — 결과적으로 운영자가 "마법사 끝" → "체크리스트 hub" 에서 직접 5~6 페이지 순회.
2. **종별 (`/divisions`) + 팀 (`/teams`) + 대진표 (`/bracket`) 단절** — 같은 종별 메타 (조 크기 / 본선 진출 수 / 팀 배정) 가 3 페이지에 흩어져 있고 단방향 의존만 있어 하나 바꾸면 다른 페이지 재방문 의무.
3. **순위전 (강남구 i3-U9 / U11 / U14 / U12w) generator 는 PR-G5 (eba655d) 로 박제 완료지만 운영자 trigger UI 가 `/divisions` 안 "진출 매핑 실행" 버튼 종별별 1회씩** — 4 종별 × 1 클릭 + 결과 검증 별도 페이지 (matches) 이동. 자연 흐름 = "예선 다 끝났습니다 → 다음" 단일 트리거 부재.

§4 영향도 H 건수: **8건** (단절 5 / 누락 3) / Phase 1 진입 권장 = **YES**.

---

## §1. 대회 생성 (마법사) 흐름 인벤토리

### 1-1. 라우트 구조

| URL | 파일 | 역할 |
|-----|-----|-----|
| `/tournament-admin/tournaments/new/wizard` | `new/wizard/page.tsx` | 신규 생성 (압축 1-step / `?legacy=1` 시 3-step) |
| `/tournament-admin/tournaments/[id]/wizard` | `[id]/wizard/page.tsx` | 편집 마법사 3-step |
| `/tournament-admin/wizard/association` | `wizard/association/page.tsx` | 협회 마법사 (BLOCKED Phase 6 시안) |
| `/tournament-admin/series/[id]/add-edition` | `add-edition/page.tsx` | 시리즈 회차 추가 (구 페이지 호환) |

### 1-2. QuickCreateForm (현 default — UI-2 `60dd37e`) 입력 항목

| 항목 | 필수 | 박제 위치 |
|-----|-----|---------|
| 대회 이름 | O | `tournament.name` |
| 시작일 | 선택 | `tournament.startDate` |
| 시리즈 dropdown | 선택 | `tournament.seriesId` |
| (인라인) 시리즈 생성 | 선택 | `tournamentSeries` row 신규 |

클라이언트 default 박제 (POST schema 변경 0):
- format=`single_elimination` / gender=`male` / maxTeams=16 / teamSize=5 / rosterMin=5 / rosterMax=12 / primaryColor=BDR Red / secondaryColor=BDR Navy

→ POST 후 redirect → `/tournament-admin/tournaments/[id]` (체크리스트 hub).

### 1-3. EditWizard (`[id]/wizard`) 3-step 구성

| Step | 라벨 | 박제 |
|------|-----|-----|
| 1 | 대회 정보 | name / status / description / organizer / host / sponsors / gender / rules / prizeInfo / 일정 + 장소 / 경기시간 / 경기볼 |
| 2 | 참가 설정 | maxTeams / entry_fee / divCaps (디비전 정원) / divFees (디비전 참가비) / 신청 정책 / TeamSettingsForm |
| 3 | 확인 및 저장 | 미리보기 + PATCH |

> **주의 (UI-3 / UI-4 박제 후)**:
> - Step 1 에서 `format` select 제거 → `/divisions` 단일 source
> - Step 1 에서 `is_public` / `design_template` / 사이트 색상 제거 → `/site` 단일 source

### 1-4. 강남구협회장배 시나리오 처리 매핑

| 강남구 요구 | 마법사 처리 | 상태 |
|-----|-----|-----|
| 대회 이름 / 일정 / 장소 | EditWizard Step 1 | ✅ |
| 4 종별 (i3-U9 / i3-U11 / i3-U14 / i3w-U12) 등록 | DivisionGeneratorModal (Step 2 진입 안 트리거) | 🟡 부분 (UI 있음 / 주력 hub 가 `/divisions`) |
| 종별별 format (link_advancement / group_stage_with_ranking) | **마법사 0** → `/divisions` | ❌ 단절 |
| 종별별 조 크기·조 개수·본선 진출 수 | **마법사 0** → `/divisions` | ❌ 단절 |
| 팀 등록 + 종별 배정 + 코치 토큰 | **마법사 0** → `/teams` | ❌ 단절 |
| 예선 대진표 생성 | **마법사 0** → `/bracket` | ❌ 단절 |
| 매치 일정 입력 | **마법사 0** → `/matches` | ❌ 단절 |
| 순위전 자동 채움 trigger | **마법사 0** → `/divisions` 종별별 버튼 | ❌ 단절 |

**결과**: 마법사는 강남구 시나리오의 **약 10% (대회 row + 메타)** 만 처리. 나머지 90% 는 마법사 밖 5 페이지 순회.

### 1-5. wizard-regression-checklist Phase 진입 상태

| Phase | 상태 |
|-------|------|
| 1 (shared-types) | ✅ |
| 2 (Step 0 단체 UI) | 🚧 BLOCKED 시안 D1+D3 |
| 3 (Step 1 시리즈 UI) | 🚧 BLOCKED 시안 D1 |
| 4 (Step 2 prefill) | 🚧 BLOCKED 시안 D2 |
| 5 (last-edition + editions API + UNIQUE) | ✅ |
| 6 (Association 마법사) | 🚧 BLOCKED 시안 D4 |
| 7 (자동 검증) | 🟡 부분 |

→ Phase 2~4 완성되면 Step 0~Step 2 흡수 가능. **Phase 5~10 (종별·팀·대진표 흡수) 는 본 Phase 0 로드맵 밖** (위 §6 후보).

---

## §2. 대회 관리 (admin) 페이지 인벤토리

### 2-1. 책임·입력·출력·의존 표

| 페이지 | 책임 | 주 입력 | 주 출력 (DB) | 의존 (선행) |
|-----|-----|-----|-----|-----|
| `[id]/page.tsx` (대시보드) | 셋업 진행도 hub + 8 체크리스트 | 0 (read only) | 0 | tournament + relations |
| `[id]/wizard/page.tsx` (편집) | 메타 + 신청 정책 | name / 일정 / 장소 / fees 등 | `tournament.*` columns | basic 1 |
| `[id]/divisions/page.tsx` | 종별 운영 방식 + settings | format / group_size / advance_per_group | `tournamentDivisionRule.format / settings` | divisions 정의 (=마법사 / 종별 generator) |
| `[id]/teams/page.tsx` | 팀 신청 승인 + 선수 + 종별 배정 + 코치 토큰 | 신청 승인 / 시드 / 조 / 종별 / 코치 매니저 | `tournamentTeam.*` / `tournamentTeamPlayer.*` | divisions |
| `[id]/bracket/page.tsx` | 대진표 생성 + 듀얼 조 배정 + 매치 점수 | format 분기 / 듀얼 조 / 시드 / 점수 | `tournamentMatch.*` / settings.bracket | divisionRules + teams approved |
| `[id]/matches/matches-client.tsx` | 매치 일정 / 점수 / 기록 모드 | scheduledAt / venue / score / status / recording_mode | `tournamentMatch.*` + settings.recording_mode | bracket |
| `[id]/recorders/page.tsx` | 기록원 등록 (이메일) | email | `tournamentRecorder.*` | basic |
| `[id]/admins/page.tsx` | 관리자 등록 (이메일 + role) | email / role | `tournamentAdminMember.*` | basic |
| `[id]/site/page.tsx` | 공개 사이트 (서브도메인 / 색상 / 템플릿 / 공개여부) | subdomain / 색상 / 템플릿 | `tournamentSite.*` + `tournament.is_public` | basic |
| `_components/SetupChecklist.tsx` | 8 체크리스트 + 공개 게이트 | progress (계산값) | `/site/publish` POST | 7/8 항목 ✅ |

### 2-2. SetupChecklist 8 항목 (`setup-status.ts`)

| # | key | 라벨 | 진입 링크 | required |
|---|-----|-----|--------|---------|
| 1 | basic | 기본 정보 | `/wizard` | O |
| 2 | series | 시리즈 연결 | `/wizard` | X |
| 3 | divisions | 종별 정의 | `/divisions` | O |
| 4 | divisionRules | 운영 방식 | `/divisions` | O |
| 5 | registration | 신청 정책 | `/wizard?step=2` | O |
| 6 | site | 사이트 설정 | `/site` | O |
| 7 | recording | 기록 설정 | `/matches` | O |
| 8 | bracket | 대진표 생성 | `/bracket` | O |

> 체크리스트 #3 + #4 가 같은 페이지 (`/divisions`) → 운영자 입장에서 "한 페이지 = 두 카드" 인지 혼란.
> 체크리스트 #1 + #5 가 같은 마법사 (#5 = `?step=2`) → 같은 마법사에 두 진입점 + Step 2 위치 외부 위변조 가능 (UI-1.5 가드 있음).

### 2-3. 사이드 nav (`tournament-admin-nav.tsx`)

| 항목 | href |
|-----|-----|
| 대시보드 | `/tournament-admin` |
| 단체 | `/tournament-admin/organizations` |
| 내 대회 | `/tournament-admin/tournaments` |
| 시리즈 | `/tournament-admin/series` |
| 템플릿 | `/tournament-admin/templates` |

→ **개별 대회 운영 메뉴 (divisions / teams / bracket / matches / site) 는 사이드 nav 에 없음** — `[id]/page.tsx` 의 SetupChecklist 카드 + 빠른 액션 4개 통해서만 진입 가능. 깊이 = "/내 대회" → 대회 클릭 → 카드 클릭 (3 클릭).

---

## §3. 강남구협회장배 사용자 시나리오 클릭 동선

> 강남구협회장배 = 4 종별 (i3-U9 link_advancement / i3-U11 group_stage_with_ranking / i3-U14 group_stage_with_ranking / i3w-U12 group_stage_with_ranking). 각 종별 ≈ 4팀 × 4조 / 본선 진출 / 순위전.

### 3-1. 11 단계 동선 (현 흐름)

| # | 운영자 액션 | 가는 페이지 | 자연스러움 / 단절 / 혼란 |
|---|-----|-----|-----|
| 1 | 대회 생성 (이름 / 시작일) | `/tournaments/new/wizard` (QuickCreateForm) | 자연 ✅ |
| 1.5 | (생성 직후) → redirect | `/tournaments/[id]` (셋업 hub) | 자연 ✅ |
| 2 | 종별 4건 등록 | `/divisions` (또는 wizard Step 2 안 DivisionGeneratorModal) | **혼란** — 두 진입점 / hub 카드 #3 = `/divisions` 인데 마법사 안에도 모달 |
| 3 | 종별마다 운영 방식 (format) 선택 | `/divisions` (드롭다운) | 자연 (단, 종별 N건 = N회 PATCH) |
| 3.5 | 조 크기 / 조 개수 / 본선 진출 수 / ranking_format | `/divisions` (GroupSettingsInputs 종별별) | 자연 |
| 4 | 종별 N건 = format / settings 박제 후 → 다음 단계? | hub 다시 가기 | **단절** — `/divisions` → 다음 카드 (`teams`) 직접 링크 0 |
| 5 | 팀 등록 (admin 직접 INSERT or 신청 승인) + 종별 카테고리 + 시드 + 조 | `/teams` | 자연 — 인라인 모달로 코치 토큰까지 |
| 5.5 | 코치 토큰 URL 복사 → 코치에게 전달 (외부 채널) | 외부 (카톡 등) | 자연 (운영자 외부 액션) |
| 6 | 코치 자가수정 (선수 명단) | 외부 URL `/team-apply/[token]/edit` | 운영자 손 떠남 |
| 7 | 예선 대진표 생성 | `/bracket` | **혼란** — 대진표 페이지가 종별 분기 인지 (다중 division 그룹핑 UI 있지만 generator trigger 는 단일 POST `bracket/route.ts`) |
| 7.5 | 종별별 generator 호출 결과 검증 | `/bracket` (다종별 시각 분리 후속 큐 G5.10 미박제) | **혼란** — 종별별 시각 분리 UI 미박제 |
| 8 | 매치 일정 입력 (각 종별 × N 매치) | `/matches` | 자연 (단, N 매치 = N회 PATCH) |
| 9 | 예선 진행 + 결과 입력 | `/matches` (또는 Flutter / score-sheet) | 자연 |
| 10 | 순위전 자동 채움 trigger | `/divisions` 종별별 "진출 매핑 실행" 버튼 × 4 | **단절** — matches 페이지에서 끝나고 divisions 로 다시 이동 / 4 종별 = 4 클릭 + 결과 검증 별도 |
| 10.5 | placeholder 매치 이상 점검 | `/matches` (수동 검증) | **누락** — "순위결정전 N건이 placeholder 가 아닙니다" 사전 배너 미박제 (G7 후속 큐) |
| 11 | 결승 진행 + 우승팀 결정 | `/matches` | 자연 |

### 3-2. 단절 / 혼란 핵심 3건

1. **§3 단계 4 → 5 (divisions → teams)**: `/divisions` 페이지 하단 `← 대회 관리` 만 있음. teams 직접 링크 0. 운영자가 "다음 단계 = teams" 인지 SetupChecklist 다시 봐야 알 수 있음.
2. **§3 단계 7 → 7.5 (bracket 종별 분기)**: `bracket/page.tsx` 의 `hasMultipleDivisions(matches)` 가 매치 단위 분기. 하지만 generator trigger 는 단일 POST `bracket/route.ts`. 종별별 trigger 안 됨 → 강남구 i3-U9 만 재생성하고 싶을 때 전체 생성 위험.
3. **§3 단계 10 (순위전 trigger 단일 액션 부재)**: `/divisions` 종별별 버튼 × 4 클릭 + 각 결과 다른 카드에 표시. "예선 다 끝났습니다 → 모든 종별 순위전 자동 진출" 단일 액션 부재.

### 3-3. 다른 시나리오 비교 (간단)

| 시나리오 | 차이 |
|-----|-----|
| 4차 뉴비리그 (`full_league_knockout` 단판 결승) | division_rule=0 → tournament 단위 advance (G5.5-followup) → `/divisions` 진출 매핑 버튼 미사용. matches 페이지에서 끝남. **상대적으로 자연** |
| GNBA 8팀 듀얼 | format=`dual_tournament` / 단일 division → `/bracket` DualGroupAssignmentEditor (UI 있음). divisions 페이지 우회 가능. **상대적으로 자연** |
| 1회성 single_elim | format=`single_elimination` / division 0 → wizard → bracket 직접. **자연** |

→ **강남구 = 시스템에서 가장 복잡한 시나리오** (다종별 × 다포맷 × 순위전). 본 점검의 우선순위 1.

---

## §4. 단절 / 중복 / 혼란 / 누락 인벤토리

| # | 영역 | 분류 | 문제 | 영향 |
|---|-----|-----|-----|-----|
| 1 | 마법사 → 셋업 hub | 단절 | 마법사 산출물 = 대회 row 1건 + 메타. 종별 / 팀 / 대진표 모두 마법사 밖 | **H** |
| 2 | divisions ↔ teams | 단절 | divisions 페이지 → teams 페이지 직접 링크 0 (대시보드 거치기) | M |
| 3 | bracket ↔ divisions | 단절 | bracket 페이지에서 종별 변경 발견 시 divisions 다시 가기 → bracket 재생성 | M |
| 4 | matches ↔ divisions | 단절 | 예선 종료 후 순위전 trigger = divisions 페이지로 다시 이동 (matches 안 trigger 0) | **H** |
| 5 | divisions = #3 + #4 한 페이지 | 중복 | SetupChecklist 카드 2개가 같은 `/divisions` 진입 — "두 카드 = 한 페이지" 혼란 | M |
| 6 | wizard Step 1 + Step 5 (registration) 한 마법사 | 중복 | SetupChecklist #1 = `/wizard`, #5 = `/wizard?step=2` — 같은 마법사 두 진입점 | L |
| 7 | DivisionGeneratorModal vs `/divisions` 페이지 | 중복 | 종별 추가 진입점 2개 (마법사 안 모달 + 별도 페이지) | M |
| 8 | new/wizard QuickCreateForm + LegacyForm | 중복 | `?legacy=1` 안전망 — 1주 운영 후 폐기 예정이지만 코드 잔존 | L |
| 9 | format 박제 위치 분리 (UI-3) | 혼란 | tournament.format vs divisionRules.format 우선순위 운영자 인지 부재 | M |
| 10 | site 공개 vs is_public | 혼란 | `tournamentSite.isPublished` + `tournament.is_public` 동시 update (errors.md 강남구 누락 사고) — 이미 fix 됐지만 운영자에게는 여전히 별도 개념 | L |
| 11 | 시리즈 add-edition (구 페이지) vs new/wizard | 중복 | 시리즈 회차 추가 진입점 2개 (구 add-edition + new/wizard 시리즈 dropdown) | M |
| 12 | bracket 종별별 generator trigger 부재 | 누락 | 다종별 대회에서 1 종별만 재생성 불가 (bracket POST 단일) | **H** |
| 13 | 순위전 단일 trigger UI 부재 | 누락 | 전 종별 일괄 trigger 액션 없음 (`/divisions` 종별별 버튼 × N) | **H** |
| 14 | placeholder 매치 사전 검증 배너 부재 | 누락 | "순위결정전 N건이 placeholder 형식이 아닙니다" 사전 경고 (errors.md G7 후속 큐) | **H** |
| 15 | 종별별 매치 일정 일괄 입력 도구 부재 | 누락 | matches 페이지에서 매치 1건씩 PATCH (강남구 ≈ 60 매치 = 60 클릭) | M |
| 16 | 코치 토큰 발급 후 외부 전달 통합 부재 | 단절 | teams 페이지에서 토큰 URL 복사 → 카톡 직접 전달 (운영자 수동) | L |
| 17 | recording mode 7번 카드 진입 = matches | 혼란 | 셋업 카드 7번 "기록 설정" → matches 페이지 (= 카드 8번 다음 단계의 부분집합) | L |
| 18 | divisions 페이지 → 다음 단계 (teams) CTA 부재 | 단절 | "다음" 버튼 없음 — 운영자가 hub 로 다시 돌아가야 함 | **H** |

**영향도 H 합계: 8건** (단절 5 / 누락 3)

---

## §5. API 흐름 인벤토리

### 5-1. admin 전용 endpoint (`/api/web/admin/tournaments/[id]/...`)

| Endpoint | 호출 페이지 | 책임 |
|----------|----------|-----|
| `division-rules` GET / PATCH | `/divisions` | 종별 룰 + format / settings |
| `division-rules/[ruleId]/advance` POST | `/divisions` | 종별별 순위전 placeholder 채움 |
| `team-applications` GET / POST | `/teams` | 팀 신청 + 토큰 발급 |
| `teams/[ttId]/category` PATCH | `/teams` | 팀 → 종별 배정 |
| `teams/[ttId]/import-players` POST | `/teams` | 선수 일괄 import |
| `teams/[ttId]/manager` PATCH | `/teams` | 코치 정보 박제 |
| `teams/[ttId]/reissue-token` POST | `/teams` | 토큰 재발급 |
| `eligible-users` GET | `/teams` | 선수 검색 |
| `admins` GET / POST | `/admins` | 관리자 등록 |
| `recording-mode/bulk` POST | `/matches` | 기록모드 일괄 변경 |
| `swiss/next-round` POST (501 stub) | (미진입) | swiss 라운드 (G5.8) |
| `advance-placeholders` POST | (운영자 직접 호출) | tournament 단위 advance (G5.5-followup) |
| `transfer-organizer` POST | `/page` | 주최자 이전 |

### 5-2. 비-admin endpoint (admin 페이지에서도 호출)

| Endpoint | 호출 페이지 | 책임 |
|----------|----------|-----|
| `/api/web/tournaments` POST | `new/wizard` | 대회 생성 |
| `/api/web/tournaments/[id]` PATCH | `[id]/wizard` | 대회 메타 update |
| `/api/web/tournaments/[id]/teams` GET | `/teams` | 팀 목록 |
| `/api/web/tournaments/[id]/bracket` GET / POST | `/bracket` | 대진표 조회 / 생성 |
| `/api/web/tournaments/[id]/bracket/knockout` POST | `/bracket` | NBA-seed 8강/4강 |
| `/api/web/tournaments/[id]/matches` GET | `/matches` | 매치 목록 |
| `/api/web/tournaments/[id]/matches/[matchId]` GET / PATCH | `/matches` | 매치 update |
| `/api/web/tournaments/[id]/site/publish` POST | `[id]/page` (SetupChecklist) | 공개 가드 |
| `/api/web/tournaments/[id]/admins` GET / POST | `/admins` | (admin 페이지가 비-admin 라우트 호출 — 단일 source) |
| `/api/web/tournaments/[id]/recorders` GET / POST | `/recorders` | (동일) |
| `/api/web/series/[id]/editions` POST | `add-edition` + `new/wizard` | 시리즈 회차 |

### 5-3. API 흐름 관찰

- **bracket POST = 단일 호출 / 종별별 분기 0** — 강남구처럼 종별별 generator 호출이 필요한 케이스에서 진입점 1개. (G5.6 single_elim 슬롯 라벨 / G5.4 group_stage_with_ranking 등 generator 는 박제됐지만 운영자가 종별 단위 trigger 불가능)
- **division-rules PATCH = 종별 1건씩 PATCH** — 4 종별 = 4회 호출 (debounce 없이 onBlur 마다)
- **endpoint 분포 = `/api/web/admin/...` (12) + `/api/web/tournaments/...` (8)** 두 prefix 혼용. admin 권한 체크는 양쪽 모두 `canManageTournament` 단일 source (잘 됨).

---

## §6. 개선 후보 관찰 (Phase 1 큐 — 본 보고서 설계 X)

### 6-1. 통합 후보

| 후보 | 사유 | 위험 |
|-----|-----|-----|
| `/divisions` SetupChecklist #3 + #4 한 카드로 통합 | 같은 페이지 두 카드 → 한 카드 + "정의 N건 / 운영방식 N건 ✅" 진행도 표시 | 작음 |
| `divisions` 페이지에 "다음 → 팀 등록" CTA 추가 | §4 #18 단절 해소 (라우팅만 / 비즈 0) | 매우 작음 |
| `matches` 예선 종료 후 단일 trigger ("모든 종별 순위전 자동 진출") | §4 #4 + #13 단절 + 누락 동시 해소 | 중 (G5.5-followup advance 함수 재사용 가능) |
| `bracket` 종별별 generator trigger UI | §4 #12 누락 해소 — 강남구 4 종별 독립 재생성 가능 | 중 (API 분기 추가) |
| placeholder 매치 검증 배너 (G7 후속 큐 박제) | §4 #14 누락 해소 — placeholder-helpers 재사용 | 작음 |

### 6-2. 분리 후보

| 후보 | 사유 |
|-----|-----|
| `wizard` Step 1 (메타) vs Step 2 (신청 정책) → 별도 진입점 | SetupChecklist #1 + #5 가 같은 마법사 두 진입점 — 카드 = 페이지 1:1 매핑 회복 |
| 시리즈 회차 추가 진입점 단일화 | `add-edition` 폐기 + `new/wizard` 만 (wizard-checklist §39 결정 2 = 호환 보존) — 보류 정당 |

### 6-3. 마법사 확장 후보 (Phase 2~4 BLOCKED 시안 도착 후)

| 후보 | 시안 의존 |
|-----|-----|
| Step 0 단체 선택 / 인라인 생성 | D1 + D3 |
| Step 1 시리즈 선택 / 인라인 생성 (+ prefill) | D1 |
| Step 2 회차 메타 prefill (마지막 회차 복제) | D2 |
| Step 6 협회 마법사 (단체 + 사무국장 + 배정비) | D4 |

### 6-4. 신규 페이지 후보

- **`/tournaments/[id]/setup`** = 셋업 단계별 stepper (현 SetupChecklist hub 의 다음 진화). 카드 8개를 stepper 1개로 묶으면 "다음 단계" 자연 흐름 박제 가능. 단, hub 패턴 (자유 진입) 의 장점도 있어 결정 필요.
- **`/tournaments/[id]/playoffs`** = 순위전·결승 전용 hub. divisions 의 advance 버튼 + matches 의 결승 일정 + bracket 의 placeholder 검증 통합. 강남구 시나리오 단계 10~11 대응.

### 6-5. 후속 Phase 우선순위 (관찰 — 결정은 Phase 1)

| 우선 | 작업 | 영향도 |
|-----|-----|-----|
| 1 | divisions → teams 등 단계간 CTA 추가 | H (단순 라우팅 / 즉시 가능) |
| 2 | matches 단일 trigger ("순위전 자동 진출") | H |
| 3 | placeholder 검증 배너 | H |
| 4 | bracket 종별별 generator trigger | H (API 분기 필요) |
| 5 | divisions 두 카드 통합 | M |
| 6 | playoffs 신규 hub | M |
| 7 | wizard Phase 2~4 시안 진입 | (BLOCKED) |
| 8 | wizard 종별·팀·대진표 흡수 (Phase 5~10) | (대규모 / Phase 1 결정) |

---

## §7. 부록 — 참조 파일

- `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` (QuickCreate / LegacyForm)
- `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx` (셋업 hub)
- `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` (편집 마법사)
- `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` (종별 + 운영방식)
- `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx` (팀 + 토큰)
- `src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx` (대진표)
- `src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx` (매치)
- `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx`
- `src/lib/tournaments/setup-status.ts` (8 항목 정의)
- `src/lib/tournaments/division-formats.ts` (8 enum)
- `src/lib/tournaments/placeholder-helpers.ts` (PR-G5 박제)
- `.claude/knowledge/wizard-regression-checklist.md`
- `.claude/knowledge/errors.md` §[2026-05-15] 강남구협회장배 사고 102~124행
