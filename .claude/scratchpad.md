# 작업 스크래치패드

## 현재 작업
- **요청**: UI-2 신규 대회 wizard 압축 (3-step → 1-step + 즉시 draft 생성)
- **상태**: ✅ 구현 완료 (726 vitest 전수 통과 / tsc 0 / 회귀 0)
- **모드**: no-stop

## 구현 기록 (developer) — UI-2 wizard 압축 (3-step → 1-step) (2026-05-13)

📝 구현한 기능:
- 신규 대회 wizard `/tournament-admin/tournaments/new/wizard` 의 기본 = 압축 1-step 폼
- 필수 1 필드 (대회 이름) + 권장 2 필드 (시작일 / 시리즈) 만 받고 즉시 draft 생성 → 체크리스트 hub redirect
- `?legacy=1` 안전망 — 기존 3-step 폼 보존 (1주 운영 후 별도 PR 폐기)
- 클라이언트 측 default 박제로 POST schema 변경 0

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | default export = 라우터 (?legacy 분기) + QuickCreateForm (신규 압축 1-step) + LegacyWizardForm (기존 함수명 변경만) | 수정 |

🔍 시니어 판단:
- **POST API 변경 0** — route.ts 가 name 만 required, 그 외 default fallback (`single_elimination` / undefined → 서버 default) → 클라이언트가 일부 default 박아 보냄. zod schema 미수정
- **default 박제 값 선정** — `format=single_elimination` (route.ts FORMAT_MAP fallback 과 동일) / `maxTeams=16` (BDR 표준 16팀) / `teamSize=5` / `rosterMin=5` `rosterMax=12` / `gender=male` (BDR 운영 비율 우선) / `primaryColor/secondaryColor` = BDR 토큰 hex
- **InlineSeriesForm 재사용** — UI-1.2/1.3 의 공통 컴포넌트 그대로 사용 (코드 0 추가)
- **redirect 응답 키** — `data.redirect_url ?? data.redirectUrl` 폴백 (apiSuccess snake_case 변환 대비)
- **레거시 보존 룰** — 기존 LegacyWizardForm 코드 1185-700 = 485 LOC 거의 동일. `useRouter` 1줄만 본 함수 안으로 이동. ?legacy=1 진입 시 기존 동작 100% 유지
- **레거시 안전 출구** — QuickCreateForm 폼 하단 "예전 상세 폼으로 만들기" Link → ?legacy=1 (마음에 안 들면 즉시 롤백)

💡 tester 참고:
- **테스트 방법**:
  1. `/tournament-admin/tournaments/new/wizard` 진입 → 압축 1-step 폼 노출 (이름/시작일/시리즈 dropdown + 안내 박스)
  2. 대회 이름만 입력 → "대회 만들기" 클릭 → 즉시 POST → `/tournament-admin/tournaments/{id}` 체크리스트 hub redirect
  3. `?legacy=1` 추가 → 기존 3-step 폼 그대로 노출 (대회 정보 → 참가 설정 → 확인 생성)
  4. 시리즈 dropdown — 빈 상태 → "새 시리즈 만들기" 인라인 폼 → 단체 선택 + 이름 → 생성 시 자동 선택
  5. 시작일 미입력 → 서버에서 null 처리 (대시보드에서 나중에 설정 가능)
- **정상 동작**:
  - 대회 생성 후 체크리스트 hub 에서 종별/참가비/대진표 단계별 설정 가능
  - POST body 에 `format=single_elimination / maxTeams=16 / gender=male` 박제
  - DB tournaments 박제 후 추후 PATCH 로 모두 변경 가능 (편집 wizard 또는 dashboard inline)
- **주의할 입력**:
  - 대회 이름 공백만 입력 → "대회 이름을 입력하세요." 에러 + 버튼 disabled
  - 시리즈 선택 후 취소 → seriesId 잔존 (UX 정상)
  - `?legacy=1` 진입 후 다시 압축 폼 진입 = Link 클릭이 아니라 URL 직접 → 정상

⚠️ reviewer 참고:
- **컴포넌트 분리 = 함수 분리만** (별도 파일 X) — page.tsx 1185 LOC → 1465 LOC. 한 파일 안에서 default 라우터 / QuickCreateForm / LegacyWizardForm 3개 함수
- **인증 체크 useEffect 중복** — QuickCreateForm 과 LegacyWizardForm 양쪽에 동일 로직. 본 PR 의 목표 = 압축 폼 도입 + 레거시 보존. 공통화는 별 PR 에서 진행
- **`?legacy=1` 폐기 시점** — 1주 후 별 PR 로 LegacyWizardForm 제거 + 본 파일 ~700 LOC 감소 예상
- **default 박제 = "운영자 의도 추정"** — `gender=male` 은 BDR 운영 비율 우선 가정. 운영자가 여성부 만들고 싶으면 dashboard 에서 PATCH (편집 wizard 통해)
- **레거시 안전 출구 link** — QuickCreateForm 하단 1줄. 1주 후 폐기 시 본 Link 도 함께 제거

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. POST API 필수 필드 분석 (route.ts) | ✅ name 만 필수 / 그 외 default fallback |
| 2. default export 라우터 분기 (?legacy=1) | ✅ 완료 (useSearchParams null-safe) |
| 3. QuickCreateForm 압축 1-step | ✅ 완료 (이름/시작일/시리즈 + 인라인 생성) |
| 4. LegacyWizardForm 코드 보존 | ✅ 함수명만 변경 (코드 변경 0) |
| 5. 클라이언트 default 박제 | ✅ format/maxTeams/teamSize/gender/colors |
| 6. tsc --noEmit | ✅ 0 error |
| 7. 전체 vitest 회귀 (726/726) | ✅ 전수 PASS / 회귀 0 |
| 8. 회귀 grep (lucide / BigInt / 핑크) | ✅ 0건 |

---

## 구현 기록 (developer) — P2 dual 경고 + UI-1.5 step 점프 (2026-05-13)

📝 구현한 기능:
- **P2**: 양쪽 wizard (신규/편집) 의 BracketSettingsForm 아래 dual_tournament 16팀 정합성 경고/성공 카드 박제
- **UI-1.5**: 편집 wizard 가 `?step=N` (1-based) query 받으면 해당 step 으로 자동 진입 + 체크리스트 5번 카드 link 갱신
- **회귀 가드**: setup-status.test.ts 에 5번 카드 link `?step=2` 확인 1 케이스 신규

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | P2 — BracketSettingsForm 아래 dual 경고/성공 카드 조건부 박제 (~15 LOC) | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | P2 — 동일 + UI-1.5 useSearchParams import + initialStep 산출 (1-based → 0-based, 범위 가드) | 수정 |
| `src/lib/tournaments/setup-status.ts` | UI-1.5 — registration 카드 link `${base}/wizard` → `${base}/wizard?step=2` | 수정 |
| `src/__tests__/lib/tournaments/setup-status.test.ts` | 5번 카드 link `?step=2` 회귀 가드 1 케이스 | 수정 |

🔍 시니어 판단:
- **BracketSettingsForm 은 props 변경 0** — divCaps 를 컴포넌트 안으로 전달하기보다 wizard page.tsx 에서 직접 경고 박제 (totalDivCaps state 이미 존재 — 재계산 0)
- **divCaps 미입력(합산 0)은 경고 X** — 신규 wizard 초기 진입 시 노이즈 제거. 1팀 이상 입력하면 비로소 검증 시작
- **success 케이스도 표시 (16팀 정확)** — 운영자에게 "맞췄다" 라는 양의 피드백
- **initialStep 범위 가드** (`raw < 1 || raw > STEPS.length`) — 외부 링크 위변조(?step=99) 시 안전한 0 fallback
- **신규 wizard 는 UI-1.5 미적용** — PM 명세상 체크리스트는 편집 대회 대시보드에서만 노출 (신규 wizard 는 step 0 부터 시작이 자연스러움)

💡 tester 참고:
- **P2 수동 (양쪽 wizard)**:
  1. wizard Step 1 (대회 정보) → 대회 방식 = "듀얼토너먼트" 선택
  2. Step 2 (참가 설정) → D1=8팀, D2=8팀 입력 후 Step 1 복귀 → ✅ success "16팀 일치" 메시지
  3. D1=8, D2=4 만 입력 → Step 1 복귀 → ⚠️ warning "16팀 고정인데 12팀" 메시지
  4. divCaps 비우기 → 경고 미노출 (정상)
  5. 다른 format 선택 (single_elim) → 경고 미노출 (dual 한정)
- **UI-1.5 수동**:
  1. 운영자 대시보드 → 체크리스트 5번 "신청 정책" 카드 클릭
  2. `/wizard?step=2` 진입 → wizard 가 Step 2 (참가 설정) 부터 표시 (이전: Step 1 부터)
  3. URL 위변조 (`?step=99`) → Step 1 fallback (안전)
  4. query 없음 (`/wizard`) → Step 1 (기존 동작 그대로)
- **정상 동작**:
  - dual 경고 / success 모두 var(--color-warning) / var(--color-success) 토큰 박제 (디자인 룰 준수)
  - 편집 wizard 진입 시 `?step=2` 가 있으면 currentStep=1 로 시작 + 진행도 보존
- **주의**: tester 환경에서 query param test 시 SSR/CSR hydration 영향 0 (wizard 는 "use client" — useSearchParams 즉시 사용 가능)

⚠️ reviewer 참고:
- 경고 카드 마크업 = PM 명세 그대로 (`color-mix(in_srgb,var(--color-warning)_8%,transparent)`) — 디자인 토큰 룰 준수
- initialStep IIFE 패턴 — useEffect 대신 useState 초기값으로 사용 (마운트 시점 1회 산출 / 재계산 0)
- useSearchParams 가 null 일 수 있음 (`searchParams?.get`) — Next.js 15 App Router 환경에서 안전
- BracketSettingsForm 컴포넌트 자체는 변경 0 — 재사용 안전성 유지

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. P2 wizard (편집) dual 경고 카드 | ✅ 완료 |
| 2. P2 wizard (신규) dual 경고 카드 | ✅ 완료 |
| 3. UI-1.5 setup-status.ts link `?step=2` | ✅ 완료 |
| 4. UI-1.5 [id]/wizard useSearchParams + initialStep | ✅ 완료 (범위 가드 포함) |
| 5. vitest 회귀 가드 1 케이스 | ✅ setup-status 36 → 36+1 PASS |
| 6. tsc --noEmit | ✅ EXIT=0 |
| 7. 전체 vitest 회귀 (725 → 726) | ✅ 전수 PASS / 회귀 0 |
| 8. 회귀 grep (BigInt(N)n / lucide / 핑크) | ✅ 신규 변경분 0 |

---

## 구현 기록 (developer) — P0 GameTime 역파싱 + P1 divFees 입력 UI (2026-05-13)

📝 구현한 기능:
- **P0 (Critical)**: GameTimeInput 마운트 시 value 역파싱 (parseGameTime export) — 운영자 저장값 덮어쓰기 차단
- **P1 (Major)**: RegistrationSettingsForm 디비전 행에 참가비(divFees) input 추가 — 안내문만 있고 입력란 부재 fix

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/components/tournament/game-time-input.tsx` | parseGameTime 헬퍼 export + state 초기값 value 기반 + useEffect skip 가드 (`next === value`) + isCustom 자동 분기 | 수정 |
| `src/components/tournament/registration-settings-form.tsx` | 디비전 행에 divFees input UI 추가 (팀수 input 옆 "원" 라벨, w-24) | 수정 |
| `src/__tests__/components/tournament/game-time-input.test.ts` | parseGameTime 6 케이스 (표준값/4쿼터·전후반/논스탑·올데드/빈문자열 null/비표준 null) | **신규** |
| `.claude/knowledge/errors.md` | P0/P1 원인+fix+재발방지룰 박제 (2건 추가) | 수정 |

🔍 시니어 판단 — P0 fix 4 핵심:
1. **parseGameTime 단일 정규식** — `^(\d+)분\s+(4쿼터|전후반)\s+(논스탑|올데드)$` 정확 매칭만 인정 / null 반환 시 isCustom 분기 (옛 데이터 보호)
2. **state 초기값 = parsed?.x ?? 기본값** — 하드코딩 `useState(7)` → `useState(parsed?.minutes ?? 7)`. 마운트 시점부터 value 동기화
3. **useEffect skip 가드** — `if (next === value) return;` — 마운트 직후 동일값 송신 차단 → 부모 state 덮어쓰기 사이클 끊음
4. **isCustom 자동 진입** — `useState(value !== "" && !parsed)` — 정규식 미매칭 옛 데이터는 자동 직접입력 모드

🔍 시니어 판단 — P1 fix 단순 배치:
- divFees 는 부모 wizard 양쪽 (new L130/222/430, edit L149/271/572) 에 이미 통합 — UI 만 단절된 미완 PR
- 디비전 행에 input 1개 추가 (props 변경 0). onChange: 빈 문자열 → key 삭제 / 0 포함 숫자 → 보존 (0=무료 명시)
- 스타일: `w-24` (6자리 숫자 여유) / 팀수 input(`w-16`) 과 동일 룩

💡 tester 참고:
- **P0 회귀 테스트 (vitest 자동 박제)**: `parseGameTime("10분 4쿼터 올데드")` → 정확 / `parseGameTime("7min Q4 nonstop")` → null / `parseGameTime("")` → null
- **P0 수동 (브라우저)**:
  1. 편집 wizard → 경기시간 "10분 4쿼터 올데드" 저장
  2. 새로고침 → 정상: 10분/4쿼터/올데드 pill 유지 (이전: "7분 4쿼터 논스탑" 덮어써졌음)
- **P1 수동**:
  1. wizard Step 2 → D3 디비전 추가 → 팀수 input 옆 "원" input 노출
  2. 50000 입력 → 저장 → DB `tournaments.div_fees = {"D3": 50000}` JSON 박제
- **주의**: 참가비 0 입력 = 무료 명시 (key 보존) / 빈 문자열 = 기본 entryFee 적용 (key 삭제)

⚠️ reviewer 참고:
- `parseGameTime` export — vitest 단위 검증용 (컴포넌트 마운트 없이 헬퍼만 검증)
- useEffect 의존성 `value` 추가 — skip 가드(`next === value`)에서 참조 필수. exhaustive-deps 위반 0
- divFees input 의 0 입력 분기 = `raw === ""` 체크 (Number 변환 전) — `if (!val)` 패턴은 0을 falsy 로 처리해 삭제하는 버그 회피

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. P0 parseGameTime + state 초기값 + useEffect skip | ✅ 완료 |
| 2. P1 divFees input UI (디비전 행) | ✅ 완료 |
| 3. vitest 6 케이스 신규 | ✅ 725/725 전수 통과 (719 → 725 회귀 0) |
| 4. tsc --noEmit | ✅ EXIT=0 |
| 5. 회귀 grep (lucide / 핑크 / 살몬) | ✅ 0 |
| 6. errors.md P0/P1 박제 | ✅ 2건 추가 |

## 구현 기록 (developer) — FIBA Phase 20 PTS/OT/여백 fix (2026-05-13)

📝 구현한 기능:
- **Issue 1 (PTS=0)**: score-sheet BFF 가 running_score + fouls → player_stats 자동 집계 → service 호출 시 인자 전달 → MatchPlayerStat upsert → 라이브 박스스코어 PTS 정상 표시
- **헬퍼 신규**: `buildPlayerStatsFromRunningScore` (export — vitest 단위 검증 가능)
- **회귀 vitest**: 10건 신규 (709 → 719 / 회귀 0)

### 진단 결과 (실측 운영 DB SELECT — read-only)

| 항목 | 매치 218 실측 | 진단 |
|------|--------------|------|
| `quarterScores.home` | q1=11/q2=12/q3=4/**q4=9**/ot=[3] | **OT 박제 정상** (사용자 보고 "OT=0" 불일치 — UI 표시 측 확인 필요) |
| `quarterScores.away` | q1=9/q2=8/q3=6/q4=13/ot=[2] | OT 박제 정상 |
| PBP count | 56건 (q1=14, q2=13, q3=12, q4=11, q5=6) | 정상 |
| PBP score by team×quarter | home Q4=9 + Q5=3 = 12 (사용자 보고 Q4=12 = 합산값?) | UI 표시 의심 |
| **MatchPlayerStat** | **0건** | **Issue 1 확정 원인** — 종료 매치는 stat.points source. 0 ⇒ PTS=0 |

### Issue 별 fix 매트릭스

| Issue | 원인 | Fix | 상태 |
|-------|------|-----|------|
| 1 (PTS=0) | BFF가 `player_stats: undefined` → MatchPlayerStat 0건 | BFF 자동 집계 헬퍼 + service 인자 | ✅ 완료 |
| 2 (OT=0) | DB는 OT 정상 (home=3 / away=2). client `toQuarterScoresJson` 도 OT 박제 정상 | **사용자 보고 vs DB 불일치** — UI 표시 측 또는 사용자 화면 이해 차이. 코드 변경 0 | 진단 완료 (DB OK) |
| 3 (여백) | Phase 19 commit `fbe64fe` 머지됨 | 코드 검증 OK / 사용자 시각 검증 대기 | 사용자 확인 대기 |

### 매트릭스 — BFF 변경 요약

| 위치 | 변경 |
|------|------|
| import | `PlayerStatInput` 타입 추가 |
| 헬퍼 export | `buildPlayerStatsFromRunningScore()` 신규 (~115 LOC / vitest source) |
| service 호출 인자 | `player_stats: undefined` → `player_stats: playerStats` (자동 집계 결과) |
| audit context | ` / Stat N명` 박제 |
| 응답 envelope | `player_stat_count` 추가 |
| docstring | Phase 20 사유 1줄 추가 |

### 박제 룰 (헬퍼)

- **points**: 1+2+3pt 모두 합산
- **field_goals_made**: 2pt + 3pt (1pt 자유투 제외 — NBA 표준)
- **two/three_pointers_made**: subtype 별 분리 카운트
- **free_throws_made**: 1pt 마킹 수
- **personal/technical/unsportsmanlike_fouls**: foul type 별 분리 ("D" → personal 분류)
- **attempted = made**: 종이 기록 = miss 미박제 → 100% FG/3P/FT 표시
- **fouled_out**: totalFouls (P + T + U) ≥ 5 자동 true
- **기타 (rebound/assist/steal/block/turnover)**: 0 (종이 기록 미박제)
- **idempotent**: 매번 전체 재계산 → service upsert (멱등)

### Flutter 영향 분석

- Flutter sync route = 자체적으로 player_stats 전송 (앱 boxscore 집계 결과) → **영향 0**
- 본 fix = score-sheet BFF path 만 — Flutter 호환성 변경 없음
- service syncSingleMatch = 인자만 추가 사용 (signature 변경 없음 — 기존 호환)

### 회귀 검증

| 검증 | 결과 |
|------|------|
| tsc --noEmit | ✅ 0 error |
| vitest 전수 | ✅ **719/719 PASS** (709 + 신규 10 / 회귀 0) |
| BigInt(N)n / lucide-react / pink | ✅ 0건 (route.ts + 신규 test) |

### 변경 파일

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | Phase 20 buildPlayerStatsFromRunningScore 헬퍼 + service player_stats 인자 + audit/응답 카운트 박제 (~120 LOC 추가) | 수정 |
| `src/__tests__/lib/score-sheet-player-stats-aggregation.test.ts` | 헬퍼 10 케이스 (빈/단일/multi-shot/팀분리/foul type/foul-out/통합/매치 218) | **신규** |

💡 tester 참고:
- **테스트 방법**:
  1. 임의 매치를 paper mode 전환 후 score-sheet 입력 + "경기 종료" 제출
  2. 라이브 페이지(`/live/{id}`) 박스스코어 → 선수별 PTS 표시 확인 (이전 = 0 / 이후 = 마킹 합산값)
  3. DB SELECT: `MatchPlayerStat WHERE tournamentMatchId=N` → row count > 0 + points 정확
  4. (Issue 2 확인) `quarterScores` JSON 의 `home.ot` / `away.ot` 배열 박제 여부
- **정상 동작**:
  - paper 매치 제출 후 MatchPlayerStat 자동 박제 (1선수 1row)
  - 라이브 박스스코어 PTS = 선수별 합산 정확
  - 응답 envelope 에 `player_stat_count` 포함
- **주의**:
  - 매치 218 기존 데이터 = 본 fix 이전 제출 (MatchPlayerStat 0건). 사후 재제출 또는 수동 backfill 필요
  - score-sheet 가 lineup 만 박제하고 마킹 0 = playerStats = undefined (skip — 정상)

⚠️ reviewer 참고:
- `buildPlayerStatsFromRunningScore` export — 단위 vitest 가능하도록 외부 노출 (route.ts 안 다른 코드는 사용 X / 안전)
- 종이 기록 22 stat 미박제 항목 = 0 (rebound/assist/steal/block/turnover/min) — 사용자 결재 Phase 2 §scope
- attempted = made (종이 기록 = miss 미박제) → 박스스코어 FG% / 3P% / FT% = 100% 표시. NBA 표준 표시 안 정합 — 향후 Phase 21+ 에서 시도 박제 추가 시 fix 필요. **현재는 PTS=0 fix 우선**
- Issue 2 (OT=0 사용자 보고) = DB 정상 박제 확인됨. 사용자에게 UI 화면 재확인 요청 보류 (별도 turn)

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. 운영 매치 218 실측 (read-only) | ✅ DB 정상 (OT 박제 OK) / MatchPlayerStat 0건 (PTS=0 원인) |
| 2. buildPlayerStatsFromRunningScore 헬퍼 | ✅ ~115 LOC / 22 stat 매핑 + foul type 분리 |
| 3. BFF route player_stats 인자 전달 | ✅ service syncSingleMatch 인자 4-3 추가 |
| 4. audit / 응답 카운트 박제 | ✅ player_stat_count |
| 5. vitest 10 케이스 | ✅ 전수 PASS |
| 6. tsc --noEmit | ✅ 0 error |
| 7. 전체 회귀 (719/719) | ✅ 회귀 0 |

## 구현 기록 (developer) — UI-1.1/1.2/1.3 wizard UX 보강 (2026-05-13)

📝 구현한 기능:
- UI-1.1: 양쪽 wizard (신규/편집) "경기 룰 (비고)" textarea 마운트 — game_method 저장 흐름 복원
- UI-1.2: 편집 wizard 빈 상태에서 새 시리즈 인라인 생성 — 운영자 동선 끊김 해소
- UI-1.3: 신규 wizard 시리즈 dropdown + 인라인 생성 — 대회 생성 동선 1단계 단축 (기존 2단계)
- 공통: `InlineSeriesForm` 신규 컴포넌트 + buildCreateSeriesPayload/resolveCreatedOrganization 헬퍼

| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/components/tournament/inline-series-form.tsx` | wizard 공통 인라인 시리즈 생성 폼 + 페이로드 빌더 헬퍼 (~190 LOC) | **신규** |
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | UI-1.1 게임 룰 비고 textarea + UI-1.3 시리즈 dropdown/인라인 + state/로드 useEffect/POST body.seriesId | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | UI-1.1 게임 룰 비고 textarea + UI-1.2 빈 상태 인라인 폼 + 단체 목록 로드 | 수정 |
| `src/__tests__/components/tournament/inline-series-form.test.ts` | 8 케이스 (페이로드 빌더 5 + 단체 매칭 3) | **신규** |

🔍 시니어 판단 — GameMethodInput 컴포넌트 미사용:
- 기존 `src/components/tournament/game-method-input.tsx` 는 **FORMAT_OPTIONS 4종 pill + 직접입력** 구조 (제목 = "대회 방식 상세")
- wizard 에 이미 FORMAT_OPTIONS 4종 select 가 존재 → 중복 + 사용자 의도 (비고/룰 입력) 불일치
- PM 의도 = `game_method` DB 컬럼에 비고/룰 저장. 단순 textarea 로 대체 마운트 (라벨 "경기 룰 (비고)" / placeholder "예: 올데드 / 자유 교체 / 5반칙 제외 등")
- 저장 흐름 = 기존 그대로 (POST body.gameMethod / PATCH body.game_method) — API 변경 0

💡 tester 참고:
- **테스트 방법**:
  1. (UI-1.1 신규) `/tournament-admin/tournaments/new/wizard` → Step 1 경기 설정 섹션 "경기 룰 (비고)" textarea 노출 확인
  2. (UI-1.1 편집) `/tournament-admin/tournaments/[id]/wizard` → Step 1 경기 설정에 동일 textarea + 기존 game_method 값 복원
  3. (UI-1.2) 편집 wizard, 시리즈 0개 보유 운영자 진입 → "새 시리즈 만들기" 버튼 노출 → 클릭 → 단체/이름 입력 → 생성 → dropdown 자동 선택
  4. (UI-1.3) 신규 wizard 진입 → Step 1 기본정보 아래 "소속 시리즈 (선택)" dropdown 노출 → 시리즈 선택 후 대회 생성 → DB tournaments.series_id 연결 확인
  5. (단체 미선택 시리즈) 인라인 폼에서 단체 dropdown "개인 시리즈" 선택 → 생성 → organizations.series_count 증가 0 / tournament_series.organization_id = NULL

- **정상 동작**:
  - 시리즈 생성 → seriesOptions 즉시 갱신 + 자동 선택 + 폼 닫힘
  - 신규 wizard POST 시 seriesId 가 body 에 포함 (개인 대회면 undefined → 서버 null 처리)
  - 편집 wizard 의 status 가드 (in_progress/completed) 는 dropdown 만 disabled — 인라인 생성 버튼도 함께 숨김 (seriesEditAllowed 가드)

- **주의할 입력**:
  - 시리즈 이름 공백만 입력 → "시리즈 이름을 입력하세요." 에러
  - 단체 dropdown 옵션 없음 (myOrgs 빈 배열) → 단체 dropdown 자체 미노출 (개인 시리즈만 생성 가능)
  - 비로그인 → /api/web/series/my 가 401 → seriesLoaded=true 로 그냥 마침 (wizard 자체 진입은 인증 가드)

⚠️ reviewer 참고:
- `buildCreateSeriesPayload` / `resolveCreatedOrganization` 헬퍼 export — 컴포넌트의 페이로드 변환을 vitest 단위 검증 가능하게 분리
- POST /api/web/series 응답이 organization 객체를 안 내려주는 점 → 클라이언트에서 myOrgs 매칭으로 보충 (slug=""로 채움 — dropdown 라벨만 쓰므로 무해)
- POST /api/web/tournaments 의 `seriesId` 키 (camelCase) — route.ts L160 박제됨. 신규 wizard body 에 그대로 박음
- 편집 wizard 는 PATCH body.series_id (snake_case) 그대로 유지 — 기존 PR2 박제 그대로

## 진행 현황표
| 단계 | 결과 |
|------|------|
| 1. UI-1.1 GameMethodInput 재투입 (textarea) | ✅ 양쪽 wizard 완료 |
| 2. UI-1.2 편집 wizard 빈 상태 인라인 폼 | ✅ 완료 (단체 dropdown 포함) |
| 3. UI-1.3 신규 wizard 시리즈 dropdown + 인라인 | ✅ 완료 (POST body.seriesId 박제) |
| 4. InlineSeriesForm 공통 컴포넌트 | ✅ 신규 (헬퍼 export 분리) |
| 5. vitest 8 케이스 | ✅ 전수 통과 (709/709 회귀 0) |
| 6. tsc --noEmit | ✅ 0 error |
| 7. 회귀 grep (BigInt(N)n / lucide / 핑크) | ✅ 0 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-13 | UI-2 wizard 압축 (3-step → 1-step) + ?legacy=1 안전망 (1 file) | ✅ tsc 0 / vitest 726 / 미커밋 |
| 2026-05-13 | P2 dual 정합성 경고 + UI-1.5 ?step=2 anchor (4 files) | ✅ tsc 0 / vitest 726 / 미커밋 |
| 2026-05-13 | P0 GameTime 역파싱 + P1 divFees 입력 UI 핫픽스 (4 files) | ✅ tsc 0 / vitest 725 / 미커밋 |
| 2026-05-13 | FIBA Phase 20 PTS 자동 집계 (2 files) — score-sheet BFF running_score → MatchPlayerStat 박제 | ✅ tsc 0 / vitest 719 / 미커밋 |
| 2026-05-13 | UI-1.1/1.2/1.3 wizard UX 보강 패키지 (4 files) | ✅ tsc 0 / vitest 709 / 미커밋 |
| 2026-05-13 | 코치 자가수정 — 최초 1회 setup 흐름 추가 (4-분기) | ✅ commit `7689e3f` (4 files, +95 -24) — 미푸시 |
| 2026-05-13 | 대회 개최 흐름 IA 재설계 기획 (옵션 B = Wizard 압축 + Dashboard 체크리스트 hub) | ✅ planner-architect 분석 완료 / 5단 점진 진입 (UI-1 ~ UI-5) / 코드 변경 0 |
| 2026-05-12 | FIBA Phase 17.1 Team Fouls 박스 글자 색 충돌 fix | ✅ commit `07089a7` |
| 2026-05-12 | FIBA Phase 17 쿼터별 색상 + Legend | ✅ commit `2412b80` |
| 2026-05-12 | divisions 조별 본선 진출 팀 수 (advance_per_group) 설정 추가 | ✅ commit `75632b1` |
| 2026-05-11 | FIBA Phase 16 검증 5 issue 통합 fix | ✅ commit `a7eb111` |
| 2026-05-11 | divisions 한국 생활체육 농구 표준 용어 + group_count 조건부 UI | ✅ commit `f4c937a` |

## 미푸시 commit (subin 브랜치)
- `7689e3f` fix(team-apply): 코치 자가수정 — 최초 1회 setup 흐름 추가
- (예정) feat(wizard): UI-1.1/1.2/1.3 wizard UX 보강 — PM 커밋 대기
- (예정) feat(score-sheet): FIBA Phase 20 PTS 자동 집계 — PM 커밋 대기
- (예정) fix(wizard): P0 GameTime 역파싱 + P1 divFees 입력 UI — PM 커밋 대기
- (예정) feat(wizard): P2 dual 경고 + UI-1.5 ?step=2 anchor — PM 커밋 대기
- (예정) feat(wizard): UI-2 신규 대회 wizard 압축 (3-step → 1-step) — PM 커밋 대기

## 후속 큐 (미진입)
- UI-1.4 entry_fee 사용者 보고 재현 (커뮤니케이션 — 코드 0)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup. 시드 이름 mismatch 시 401 → 운영자 수동 보정 필요
