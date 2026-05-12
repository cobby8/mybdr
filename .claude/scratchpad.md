# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA Phase 20 — PTS 집계 + OT 점수 박제 + 여백 검증 (3 issue 통합 fix)
- **상태**: ✅ Issue 1 fix 완료 / Issue 2 진단 결과 = DB 정상 (UI 측 추가 확인 필요) / Issue 3 코드 검증 완료
- **모드**: no-stop

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

## 후속 큐 (미진입)
- UI-1.5 체크리스트 5 신청 정책 카드 → wizard step 2 anchor 점프 (~10분)
- UI-1.4 entry_fee 사용자 보고 재현 (커뮤니케이션 — 코드 0)
- **GNBA 8팀 코치 안내**: 자가수정 진입 시 본인 이름/전화 입력 = 자동 setup. 시드 이름 mismatch 시 401 → 운영자 수동 보정 필요
