# 작업 스크래치패드

## 현재 작업
- **요청**: FIBA SCORESHEET Phase 4 — Time-outs (전반2/후반3/연장1 + Article 18-19)
- **상태**: ✅ 완료 — tsc 0 / vitest 477/477 (+30 신규) / 회귀 0
- **모드**: no-stop

## 진행 현황표 (FIBA 양식)
| Phase | 범위 | 상태 |
|------|------|------|
| 1 | route group + minimal layout + 헤더 + 명단 | ✅ |
| 2 | Running Score 1-160 + Period 자동 + Final + Winner | ✅ |
| 3 | Player/Team Fouls + 5반칙 + 5+ FT toast | ✅ |
| 3.5 | 파울종류 (P/T/U/D) + Article 41 + 쿼터/경기 종료 + Licence 자동 | ✅ |
| 4 | Time-outs (전반2/후반3/연장1 + settings.timeouts JSON) | ✅ |
| 5 | 서명 + 노트 (확장) — 경기 종료만 3.5 선진입 | ⏳ |
| 6 | A4 세로 인쇄 PDF | ⏳ |

## 구현 기록 (developer) — FIBA 양식 Phase 4 Time-outs

📝 구현 범위: FIBA Article 18-19 (전반 2 / 후반 3 / OT 각각 1) + settings.timeouts JSON 박제 (Phase 1-A recording_mode 패턴 재사용)

### 변경 파일
| 파일 | 변경 | 신규/수정 | 줄수 |
|------|------|---------|-----|
| `src/lib/score-sheet/timeout-types.ts` | TimeoutMark / TimeoutsState / EMPTY_TIMEOUTS / GamePhase / TIMEOUTS_PER_PHASE | 신규 | 50 |
| `src/lib/score-sheet/timeout-helpers.ts` | getGamePhase / getUsedTimeouts / getRemainingTimeouts / canAddTimeout / addTimeout / removeLastTimeout | 신규 | 180 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | timeouts/onRequestAddTimeout/onRequestRemoveTimeout prop + TIME-OUTS placeholder 활성화 (5칸 기본 + OT 진입 시 동적 추가 + phase 잔여 표시) | 수정 | +95 |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | timeouts state + handleRequestAddTimeout/RemoveTimeout (Article 18-19 toast 분기) + draft 복원/저장 + buildSubmitPayload | 수정 | +50 |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | timeoutMarkSchema/timeoutsSchema + submitSchema.timeouts.optional() + settings JSON merge UPDATE + audit context 카운트 박제 | 수정 | +40 |
| `src/__tests__/score-sheet/timeout-helpers.test.ts` | 30 케이스 (getGamePhase 3 / Used 4 / Remaining 4 / canAdd 8 / addTimeout 7 / removeLast 3 / 전체경기시나리오 1) | 신규 | 250 |

### Article 18-19 룰 분기 (timeout-helpers.ts)
| 분기 | 조건 | 동작 |
|------|------|------|
| 전반 (Q1+Q2) | currentPeriod 1~2 | 팀당 2개 (합산) — 차단: "전반 타임아웃 모두 사용" |
| 후반 (Q3+Q4) | currentPeriod 3~4 | 팀당 3개 (합산) — 차단: "후반 타임아웃 모두 사용" |
| 연장 (각 OT) | currentPeriod 5+ | OT n 별로 1개씩 (별도 카운트) — 차단: "OT{n} 타임아웃 모두 사용" |

### settings JSON merge 패턴 (Phase 1-A 재사용)
- 기존 settings 객체 spread → `timeouts` 키만 set → 기존 `recording_mode` 등 키 보존
- `input.timeouts` 전송 시만 UPDATE (미전송 = 기존 settings 유지)
- match.settings 가 null/array/primitive 인 경우 → 빈 객체에서 시작 (방어)
- schema 변경 **0** / Prisma JSON 컬럼 활용

### UX 동작
- 빈 칸 클릭 → `canAddTimeout` 검증 → 통과 시 마킹 + toast "Team A 전반 타임아웃 1/2" / 차단 시 toast "Team A 전반 타임아웃 모두 사용 — 추가 불가"
- 마지막 마킹 칸 클릭 → 1건 해제 + toast "Team A 타임아웃 1건 해제"
- OT 진입 시 (currentPeriod≥5) 칸 동적 추가 (5+OT수 = 6/7/8칸)
- phase 잔여 표시 (헤더 우측 "전반 1/2" / "후반 2/3" / "OT1 0/1")
- 채운 칸 = text-primary 배경 (●) / 빈 칸 = text-muted 숫자

### 검증
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 (EXIT 0 / 출력 0) |
| vitest 신규 케이스 | 30/30 PASS |
| vitest 전체 회귀 | 477/477 PASS (이전 439 + 신규 30 + 누적 기타 8건) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt n) | 위반 0 |
| Flutter v1 영향 | 0 (api/web/score-sheet 단일) |
| schema 변경 | 0 (settings JSON 활용) |
| AppNav frozen | 0 영향 |
| 운영 DB 영향 | 0 (코드만) |

### tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/score-sheet/timeout-helpers.test.ts` — 30 케이스
  2. 수동 E2E (paper 모드 매치):
     - 전반 (Q1/Q2) — 빈 칸 2회 클릭 → 채워짐 + toast / 3번째 = 차단
     - 후반 (Q3/Q4) — 3개 가능 / 4번째 차단
     - OT1 진입 (쿼터 종료×4) — 새 6번째 칸 등장 / OT1 1개 / 2번째 차단
     - OT2 진입 — 7번째 칸 추가 / OT1 사용량 영향 0
     - 마지막 칸 클릭 = 해제 (toast)
     - 경기 종료 → submit BFF → DB `match.settings.timeouts` JSON 박제 검증 (`recording_mode` 키 보존)
- 정상 동작:
  - phase 잔여 헤더 우측 "전반 1/2" 류 실시간 표시
  - team A / team B 양면 독립 (한쪽 다 써도 다른 쪽 영향 0)
- 주의할 입력:
  - 같은 period 에서 2회 연속 (Q1 에서 2회) = 정상 허용 (FIBA = 합산 룰)
  - 전반 다 사용 후 Q3 진입 = 후반 3개 별도 리셋 (전반 사용량 영향 0)

### reviewer 참고
- **settings JSON merge 패턴**: Phase 1-A `withRecordingMode` 와 동일 — 객체 spread + 키 set. 단 helper 함수 분리는 안 함 (BFF route 1회 사용 / 별도 export 필요 시 timeout-helpers.ts 로 이동 가능).
- **OT 분리 카운트**: `getUsedTimeouts(timeouts, "overtime", overtimePeriod)` 의 overtimePeriod 인자가 핵심. 미지정 시 모든 OT 합산 (호환성 fallback) — canAddTimeout 은 항상 currentPeriod 의 specific OT 만 전달.
- **칸 수 동적 산정**: `totalCells = currentPeriod <= 4 ? 5 : 5 + (currentPeriod - 4)` — currentPeriod 가 7 (OT3) 이면 8칸. 마킹 안 했어도 OT 진입 자체로 빈 칸 표시 (운영자 인지).
- **Q4 마지막 2분 룰 / Q2 마지막 2분 룰 미적용**: 시간 정보 없는 종이 기록 특성 — 합산 카운트만 검증 (FIBA 룰 단순화). 향후 시간 통합 시 보완 가능.

## 구현 기록 (developer) — FIBA 양식 Phase 3.5

📝 구현 범위: 파울 종류 (P/T/U/D) + FIBA Article 41 5반칙 룰 + 쿼터/경기 종료 + 라이센스 자동 fill (User.id)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|---------|
| `src/lib/score-sheet/foul-types.ts` | FoulType enum + FOUL_TYPE_LABEL + FoulMark.type + EjectionReason + EJECTION_REASON_LABEL | 수정 (+50) |
| `src/lib/score-sheet/foul-helpers.ts` | getPlayerFoulCountByType / getEjectionReason / addFoul Article 41 차단 / foulsToPBPEvents type 박제 / isPlayerEjected 위임 | 수정 (+90) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/foul-type-modal.tsx` | 4 종류 선택 모달 (60px+ 터치 + ESC + 백드롭 클릭) | 신규 (180) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/match-end-button.tsx` | 경기 종료 confirm modal + BFF POST + 라이브 페이지 Link | 신규 (240) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | 파울 칸 P/T/U/D 글자 + Licence Read-only (User.id) + 퇴장 사유 분기 라벨 + onRequestAddFoul/RemoveFoul 분리 prop | 수정 (+80) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | "쿼터 종료" 큰 버튼 + 종료된 Period 회색 + 체크 마크 | 수정 (+60) |
| `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | FoulTypeModal state + handleSelectFoulType + handleEndPeriod toast + buildSubmitPayload + MatchEndButton 마운트 | 수정 (+90) |
| `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | foulMarkSchema.type 추가 (default "P" 폴백) | 수정 (+3) |
| `src/__tests__/score-sheet/foul-helpers.test.ts` | Article 41 4사유 분기 + addFoul 차단 메시지 분기 + foulsToPBPEvents type 박제 (+18) | 수정 (+170) |

### FIBA Article 41 룰 분기 (우선순위)
1. D 1회 → "disqualifying" (즉시 퇴장)
2. T 2회 → "2_technical"
3. U 2회 → "2_unsportsmanlike"
4. P+T+U+D 합 ≥ 5 → "5_fouls"

### Licence 자동 fill source
- **TournamentTeamPlayer.users.id** (User.id 직접 박제) — Read-only display
- 미연결 (게스트) 선수 = "—" 표시
- RosterItem.userId 이미 page.tsx server prop 에서 전달 중 (변경 0)

### 경기 종료 흐름 (Phase 5 일부 선진입)
1. "경기 종료" 빨강 버튼 → confirm modal (점수 + Winner + ⚠️ 라이브 발행 안내)
2. "경기 종료 확인" → BFF POST `/api/web/score-sheet/{id}/submit` status="completed"
3. 응답 성공 → toast + 라이브 페이지 Link / 실패 → 모달 유지 재시도
- 응답 판정: `res.ok` 단일 source (errors.md 2026-04-17 함정 회피)

### 절대 룰 검증
| 룰 | 결과 |
|----|------|
| schema 변경 / Flutter v1 영향 / AppNav frozen | 0 / 0 / 0 |
| 디자인 토큰 / lucide-react / 핑크 | var(--*) / 0 / 0 |
| 빨강 본문 텍스트 | 0 (D 버튼 / 경기 종료 배경 빨강 = 위험 액션 예외) |
| 터치 영역 | 44px+ (FoulTypeModal 64px+) |
| BigInt n 리터럴 | 0건 |
| tsc | 0 에러 |
| vitest | 439/439 (+23 신규) |

### tester 참고
- 시나리오:
  1. 파울 빈 칸 클릭 → FoulTypeModal 4 종류 선택 → 마킹
  2. T 2회 / U 2회 / D 1회 = 즉시 퇴장 toast + 행 회색
  3. Licence (UID) = User.id 자동 표시 (입력 불가)
  4. "{Q} 종료" 버튼 → toast + 다음 Period
  5. "경기 종료" 빨강 → modal → BFF 제출 → 라이브 발행
- 회귀: Phase 1/2/3 (헤더 / Running Score / Period 자동 / Winner) 그대로

### reviewer 참고
- Article 41 우선순위 정합 (D > T2 > U2 > 5반칙 — 심각도 순)
- FoulType.default("P") 폴백 = 구 client (Phase 3 미마이그) draft 호환
- description 형식 "선수 N번 P3 파울" → "선수 N번 P" (period 정보는 quarter 필드에 박제 — PBP 검색 영향 0)

---

## 협회 연결 작업 (2026-05-12 — 보존)

## 협회 연결 작업 (2026-05-12)

### 진단
| 항목 | 값 |
|------|-----|
| 강남구농구협회 | id=3 / slug=`org-ny6os` / status=approved |
| 연결 시리즈 (해제 전) | **BDR 시리즈 (id=8)** 1개 |
| 시리즈 묶인 대회 | 12개 (BDR 자체 대회 — 협회와 무관했음) |
| 강남구협회장배 | "2026 강남구협회장배 농구대회 (유소년부)" / id=`bd527531...` / status=draft / series_id=NULL |

### UPDATE 결과
- `tournament_series.organization_id = NULL WHERE id = 8` → 1건 업데이트
- 강남구농구협회 events-tab 시뮬레이션: seriesCount = **0** ✅
- 12개 tournament 자체는 보존 (delete X, organization 연결만 해제)

### 흐름 점검 결과 (대회 → 단체 연결 운영자 UI)
| 발견 | 평가 |
|------|------|
| 데이터 모델 | `Tournament.series_id → tournament_series.organization_id → organizations.id` (Series가 중간 계층) |
| 대회 PATCH API | `series_id` 필드 부재 → 사후 연결 불가 |
| 운영자 흐름 | 단체 → 시리즈 생성 → 대회 신규 생성 (역순 강제). 기존 대회를 단체에 옮기는 UI/API 없음 |
| 강남구협회장배 현재 상태 | series_id=NULL → 어떤 단체에도 미연결. 강남구농구협회에 연결하려면 (1) 협회에 새 시리즈 생성 → (2) 대회의 series_id를 그 시리즈로 변경. **(2) 단계 UI 부재** |

### 권장 후속 작업 (사용자 결정 대기)
1. **Tournament PATCH 엔드포인트에 `series_id` 추가** + 권한 체크 (대회 organizer + 시리즈 organizer 일치)
2. **대회 설정 페이지에 "소속 시리즈 선택" UI** 추가 — 운영자가 자신의 시리즈 목록에서 선택
3. (선택) 단체 관리 페이지에서 "기존 대회 가져오기" 흐름 — 운영자가 자기 대회 중 미연결 대회를 시리즈에 흡수

---

## 기획설계 (planner-architect) — 대회-시리즈 연결 UI

목표: 운영자가 **이미 생성한 대회**를 본인 소유 단체(시리즈)에 사후 연결하는 UI/API 흐름을 제공한다. 단체 events 탭 노출 (`tournament.series_id → series.organization_id`) 을 운영자 셀프서비스로 가능하게 만든다.

### 비유로 이해
- 대회 = 책 한 권 / 시리즈 = 책 시리즈 묶음(예: 해리포터) / 단체 = 출판사 책장
- 현재는 "책장에 시리즈를 만들고 그 자리에서 책을 새로 만드는 것"만 됨. "이미 손에 있는 책을 그 자리로 옮기는" 동작이 없음

### 1. 옵션 비교 (UI 위치)

| 옵션 | 시작 위치 | 운영자 동선 | 장점 | 단점 | 클릭 수 |
|------|---------|-----------|------|------|--------|
| **A. 대회 설정 셀렉트** | 대회 wizard → "대회 정보" 스텝 | 대회 편집 중 "소속 시리즈" 드롭다운에서 본인 시리즈 선택 → 저장 | 기존 wizard 흐름에 자연스럽게 흡수. 새 페이지 0개. 대회 단위 결정이라 직관적 | 단체 측에서 "어떤 대회 흡수할까" 시점에는 보이지 않음 (역방향) | **3~4** |
| **B. 단체 모달 "내 대회 가져오기"** | `/tournament-admin/organizations/[orgId]` → 시리즈 카드 우측 버튼 | 단체 페이지에서 시리즈 선택 → "기존 대회 가져오기" 모달 → 본인 미연결 대회 목록 → 체크 → 일괄 흡수 | 단체 관점에서 events 라인업을 한눈에 구성. 다건 흡수 가능 | 신규 모달 + 신규 API. 단체에서 시리즈를 골라야 한다는 두 번의 선택 | **4~5** (다건 시 효율) |
| **C. 양쪽 제공** | A + B | 둘 다 가능 | UX 유연성 | 작업량 2배. 권한 검증 코드 중복 | — |

**추천: A 먼저 (PR1) → B 후행 (PR3, 선택)**
- 사유: A 만으로도 시나리오 100% 커버. wizard 가 이미 모든 대회 필드를 다루므로 series_id 추가 부담 최소. B 는 다건 흡수 needs 가 나오면 그때.
- 단체 페이지에서 "왜 대회가 없지?" 시 사용자가 곧장 대회 wizard 로 이동하도록 `/tournament-admin/organizations/[orgId]` 의 시리즈 카드에 **"이 시리즈에 대회 연결"** 안내 링크만 추가 (PR2, A 보강).

### 2. Phase 분해 (PR 단위)

| PR | 범위 | 파일 | 신규/수정 | LOC |
|----|------|------|---------|-----|
| **PR1** | API + zod schema (series_id PATCH 지원) | `src/lib/validation/tournament.ts` | 수정 | +5 |
| | | `src/app/api/web/tournaments/[id]/route.ts` | 수정 | +25 |
| | | `src/lib/auth/series-permission.ts` | 신규 (시리즈 권한 헬퍼) | +35 |
| | | `src/lib/services/tournament.ts` (series_id update + counter 동기화) | 수정 | +20 |
| | | `__tests__/api/tournament-series-link.test.ts` (vitest 6~8 케이스) | 신규 | +120 |
| **PR2** | UI: 대회 wizard "대회 정보" 스텝에 시리즈 드롭다운 + 운영자 본인 시리즈 GET | `src/app/api/web/series/my/route.ts` (GET 본인 시리즈 목록) | 신규 | +40 |
| | | `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | 수정 (드롭다운 추가) | +50 |
| | | (옵션) `/tournament-admin/organizations/[orgId]` 시리즈 카드 "대회 연결" 안내 링크 | 수정 | +10 |
| **PR3 (선택)** | 단체 모달 "내 대회 가져오기" (옵션 B) | `src/app/api/web/tournaments/my-unlinked/route.ts` (GET 본인 미연결 대회) | 신규 | +50 |
| | | `src/app/api/web/series/[id]/absorb-tournaments/route.ts` (POST 다건 흡수) | 신규 | +70 |
| | | `_components/AbsorbTournamentsModal.tsx` | 신규 | +180 |

총 PR1+PR2 ≈ **+305 LOC** / PR3 ≈ **+300 LOC** (선택)

### 3. API 변경 사항

**(a) PATCH `/api/web/tournaments/[id]`** — `series_id` 필드 추가

zod schema:
```ts
series_id: z.string().nullable().optional()  // "8" 같은 문자열 ID, null=분리, undefined=무변경
```

route.ts 처리 (의사 코드):
```
if (data.series_id !== undefined):
  if (data.series_id === null): updateData.series_id = null
  else:
    target_series = SELECT * FROM tournament_series WHERE id = data.series_id
    if (!target_series): apiError(404 "시리즈 없음")
    // 권한: 시리즈 organizer가 현재 로그인 유저인가
    if (target_series.organizer_id !== userId AND !isSuperAdmin): apiError(403)
    updateData.series_id = BigInt(data.series_id)
    // 카운터 동기화: 이전 시리즈 -1, 새 시리즈 +1
```

**(b) GET `/api/web/series/my`** (PR2 신규) — 본인 시리즈 드롭다운용

응답: `[{ id, name, organization: { id, name } | null }]` (자기 organizer_id 인 시리즈)

**(c) GET `/api/web/tournaments/my-unlinked`** (PR3 신규, 선택) — 옵션 B용

응답: `series_id IS NULL AND organizer_id = me AND status IN (draft, registration)` 대회 목록

### 4. 권한 정책 (결재 사항)

| 항목 | 권장 정책 | 사유 |
|------|---------|------|
| 운영자가 임의 시리즈에 자기 대회 연결 | ❌ 본인 소유 시리즈만 | `tournament_series.organizer_id === userId` 검증 |
| 운영자가 자기 대회를 타 운영자 시리즈에 연결 | ❌ 금지 | 위와 동일 검증으로 차단 |
| `series_id = NULL` (분리) | ✅ 허용 | 대회 organizer 본인 권한만 있으면 OK |
| 시리즈 organizer 변경 시 묶인 대회 자동 이관 | **별도 결정** (현 작업 범위 외) | 본 PR 에서는 다루지 않음 — 위험 사항에 명시 |
| super_admin | ✅ 전부 우회 | 기존 `requireTournamentAdmin` 패턴 일치 |
| 대회 status 별 제약 | **결재 필요** — 권장: draft/registration 만 허용, in_progress/completed 잠금 | 진행중 대회를 다른 시리즈로 이동 = 단체 events 데이터 일관성 위험 |

### 5. UX 흐름 (시나리오: 강남구협회장배 → 강남구농구협회 연결)

**옵션 A 흐름 (권장)**:
1. `/tournament-admin/organizations/3` 에서 "새 시리즈 만들기" → "강남구협회장배 시리즈" 생성 (이미 가능, 변경 0)
2. `/tournament-admin/tournaments/{bd527531...}/wizard` → "대회 정보" 스텝 → **소속 시리즈** 드롭다운에서 "강남구협회장배 시리즈 (강남구농구협회)" 선택
3. "저장" 클릭 → `PATCH /api/web/tournaments/[id]` `series_id = 새 시리즈 ID` → DB 업데이트
4. `/organizations/org-ny6os` events 탭에 자동 노출 검증
- **클릭 수 4** (시리즈 만들기 진입 + 저장 + 대회 wizard 진입 + 저장)

**옵션 B 흐름 (PR3 채택 시)**:
1. 시리즈 미리 생성 (옵션 A와 동일)
2. `/tournament-admin/organizations/3` → 시리즈 카드 → **"대회 가져오기"** 버튼 → 모달 오픈
3. 본인 미연결 draft 대회 체크 → "흡수" 클릭 → 일괄 처리
- **클릭 수 5** 이지만 다건 흡수 가능 (1번에 N개)

### 6. 위험 / 미해결

| 위험 | 평가 | 대응 |
|------|------|------|
| **published 후 시리즈 변경 허용?** | 단체 events 탭 데이터 일관성 깨짐 (이미 노출된 대회가 갑자기 사라지거나 다른 단체로 점프) | **권장: draft/registration 만 허용** — `if (tournament.status NOT IN [draft, registration]) apiError("진행 중인 대회는 시리즈 변경 불가, 분리만 가능")` |
| **시리즈 변경 = 단체도 함께 따라감 (이행적 변경)** | 운영자가 "시리즈만 바꿨는데 단체도 바뀌었네?" 혼란 | UI 드롭다운 라벨에 **"시리즈명 (단체명)"** 표기 강제 + 저장 직전 confirm 모달 ("강남구농구협회 events 탭에 노출됩니다. 진행하시겠어요?") |
| **DB FK constraint** | `tournament.series_id → tournament_series.id` FK 이미 존재 (nullable). 별도 마이그레이션 불필요 | schema 변경 0 — 운영 DB 영향 0 |
| **Flutter 앱 영향** | Flutter v1 `/api/v1/...` 가 series_id 를 사용하는지 확인 필요 | grep 결과 0 (대회 PATCH 는 admin/web 만). 그러나 **원영 사전 공지 권장** — Flutter 가 대회 상세에서 series 정보 표기 시 변경 가능성 |
| **카운터 정합성** | `tournament_series.tournaments_count`, `organizations.series_count` 자동 갱신 누락 시 표시 오류 | services/tournament.ts 에서 transaction 내 increment/decrement 명시 |
| **시리즈 organizer 변경 시 대회 자동 이관** | 본 작업 범위 외 — 현재 코드도 미구현 | scratchpad 후속 큐로 별도 결재 |

### 7. 운영자 결재 사항 (developer 진입 전)

| # | 결재 항목 | 권장 |
|---|---------|------|
| Q1 | 옵션 A / B / C 중 우선 채택 | **A 먼저 (PR1+PR2), B 는 후행 (PR3 보류)** |
| Q2 | 대회 status 별 변경 허용 범위 | **draft/registration 만 허용** (in_progress/completed 잠금. 분리는 항상 허용) |
| Q3 | published 사이트 (`tournamentSite.isPublished = true`) 대회 변경 허용? | **권장 ❌** — Q2 와 별개로 published 시 잠금 / 또는 Q2 만으로 충분히 안전하면 OK |
| Q4 | 시리즈 변경 시 confirm 모달 표시 | **권장 ✅** — "단체 X events 탭에 노출됩니다" 확인 |
| Q5 | super_admin 의 임의 시리즈 연결 허용? | **권장 ✅** — 기존 패턴 일치, 운영 fix 용 |
| Q6 | Flutter 원영 사전 공지 필요? | **권장 — 1회 공지 (메시지 1줄)** "대회 PATCH 에 series_id 추가, Flutter 영향 0 확인" |
| Q7 | PR3 (옵션 B) 구현 시점 | **PR1+PR2 사용자 반응 후 결정** |

### 8. 실행 계획 (PR1+PR2 기준)

| 순서 | 작업 | 담당 | 선행 조건 |
|------|------|------|---------|
| 1 | zod schema `series_id` 필드 추가 | developer | 없음 |
| 2 | `series-permission.ts` 헬퍼 신규 (organizer 검증) | developer | 없음 (1과 병렬) |
| 3 | PATCH route series_id 처리 + counter 동기화 + status 가드 | developer | 1, 2 |
| 4 | `/api/web/series/my` GET 신규 | developer | 없음 |
| 5 | wizard "대회 정보" 스텝 드롭다운 + 저장 시 series_id 전달 | developer | 3, 4 |
| 6 | vitest 회귀 가드 (권한/status/카운터 6~8 케이스) | tester | 3 (병렬: 5와 동시) |
| 7 | 운영 DB 시나리오 검증 (강남구협회장배 실제 연결 — events 탭 노출 확인) | PM | 5, 6 통과 후 |

⚠️ developer 주의사항:
- 응답 키 자동 snake_case 변환 (errors.md 재발 5회) — 프론트 인터페이스도 snake_case
- `series_id` 는 BigInt — JSON 직렬화 시 문자열 변환 필수 (`.toString()`)
- counter 동기화는 **transaction 내** (`prisma.$transaction`) — series.tournaments_count, organizations.series_count 별개로 카운트 안 함 (series_id 만 바꾸면 organization 자체는 안 바뀌므로 org.series_count 영향 0). **tournaments_count 만 -1/+1**
- super_admin 우회는 `isSuperAdmin(session)` 단일 source 사용 (tournament-auth.ts 패턴 따라)
- 운영 DB schema 변경 0 — `prisma db push` **불필요**

## 구현 기록 (developer) — 대회-시리즈 연결 API PR1

📝 구현한 기능: 운영자가 자신의 대회를 사후에 시리즈에 연결/분리할 수 있는 PATCH API + 권한 헬퍼 + status 가드 + 카운터 동기화. UI 는 PR2 별 turn.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/lib/validation/tournament.ts` | zod updateTournamentSchema 에 `series_id: z.union([z.string(), z.null()]).optional()` 추가 | 수정 |
| `src/lib/auth/series-permission.ts` | 신규 — `requireSeriesOwner(seriesId, userId, {allowSuperAdmin, session})` + `SeriesPermissionError(status)` (throw 패턴, 404/403 분기) | 신규 |
| `src/app/api/web/tournaments/[id]/route.ts` | PATCH 핸들러에 series_id 처리 블록 추가 — (1) 현재 대회 status/series_id 조회 (2) 새 series_id 파싱 (null/""/BigInt) (3) status 가드 (in_progress/completed → 이동 ❌, 분리 ✅) (4) requireSeriesOwner 권한 검증 (5) `prisma.$transaction` 안에서 이전 시리즈 -1 / 새 시리즈 +1 / tournament UPDATE 원자적 처리 | 수정 |
| `src/__tests__/api/tournament-series-link.test.ts` | 신규 — vitest 11 케이스 (route 8 + requireSeriesOwner 단위 3) | 신규 |

### 핵심 로직
- **status 허용 set**: `SERIES_CHANGE_ALLOWED_STATUSES = new Set(["draft", "registration_open"])`. zod schema 에 status enum 이 "registration_open" 으로 박제되어 있어 이 값이 정답 (planner 의 "registration" 표기 = 실제는 registration_open).
- **분리(null) 는 모든 status 허용** — Q2 결재.
- **services/tournament.ts 미변경** — updateTournament 는 단순 prisma.update wrapper 유지. series_id 변경은 route.ts 단일 진입점에서 $transaction 처리 (다른 호출자 side-effect 회피).
- **isSame 분기** — 같은 series_id 면 카운터 동기화 skip, 일반 update 흐름 합류.
- **빈 문자열 → null 취급** — UI 드롭다운 "선택 안 함" 옵션이 "" 보낼 가능성 대비.

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit | 0 에러 |
| vitest 신규 케이스 | 11/11 PASS |
| vitest 전체 회귀 | 416/416 PASS (이전 405 + 신규 11) |
| Flutter v1 series_id grep | 0 사용처 (영향 0 재확인) |
| prisma schema 변경 | 0 |
| BigInt literal 안티패턴 | 0 |
| 핑크/살몬/코랄 hardcode | 0 |
| lucide-react import | 0 |

### ⚠️ 위험 발견 — 카운터 정합성 (코드 결함 ❌ / 기존 데이터 이슈)
운영 DB SELECT 검증 결과 `tournament_series.tournaments_count` 불일치 1건:
- BDR 시리즈(id=8) stored=0 / actual=12 (diff +12)
- 사유: 본 PR 이전부터 카운터 미동기화 (대회 생성 시 +1 박제 누락 + 5/12 organization_id NULL UPDATE 영향 무관)
- 권장 후속: 카운터 일괄 backfill UPDATE (별도 turn — 사용자 승인 후 진행). 본 PR1 코드 자체는 정상 동작 (이전 +12 가 0 인 상태에서 본 PR이 +1 / -1 정상 박제)

### 💡 tester 참고
- 테스트 방법: `npx vitest run src/__tests__/api/tournament-series-link.test.ts`
- 11 케이스 시나리오:
  1. 자기/자기 → 200 + 카운터 +1
  2. 자기/타인 → 403
  3. 자기/없는 시리즈 → 404
  4. null 분리 (draft) → 200 + 카운터 -1
  5. in_progress + 다른 시리즈 이동 → 400 (status 가드)
  6. in_progress + null 분리 → 200 (분리는 항상 허용)
  7. 시리즈 변경 (8 → 9) → 카운터 양면 (-1 / +1)
  8. super_admin 우회 → 200
  9-11. requireSeriesOwner 단위 (404 / 403 / super_admin 우회)
- 정상 동작: 위 매트릭스 그대로
- 주의할 입력:
  - 빈 문자열 `""` → null 분리로 취급 (의도)
  - "abc" 같은 비 numeric string → BigInt() throw → 400 ("유효하지 않은 시리즈 ID")
  - 같은 series_id 로 PATCH (변경 없음) → carrier 일반 update 흐름 (transaction 진입 X)

### ⚠️ reviewer 참고
- **services/tournament.ts 의 updateTournament 함수에 series_id 처리를 안 넣은 이유**: 단순 wrapper 보존 + 다른 호출자(생성/wizard) 에 카운터 +1/-1 side-effect 위험 회피. series_id 변경 유일한 진입점 = PATCH route 이므로 거기에 집중. 추후 wizard 생성 시점에도 series_id 박제 + 카운터 +1 동기화 정책 일관화 검토 필요 (별도 turn).
- **카운터 정합성 이슈**: stored=0/actual=12 불일치 = 본 PR 코드와 무관, 기존 데이터 누락. PR2 (wizard 드롭다운) 전 backfill 권장.
- **이전 시리즈 권한 미검증 (의도)**: case 7 처럼 운영자가 자기 대회를 "타인 시리즈 → 자기 시리즈" 로 이동하는 케이스 = 이전 시리즈 권한 검증 안 함 (어차피 자기 대회 organizerId 검증은 requireTournamentAdmin 이 통과시킨 상태 — 자기 대회를 자기 시리즈로 옮기는 정상 운영 시나리오). 단 운영상 발생 가능성 매우 낮음 (어떻게 타인 시리즈에 박혔는지? = 과거 super_admin 박제 케이스).

## 구현 기록 (developer) — 대회-시리즈 연결 UI PR2

📝 구현한 기능: 운영자가 대회 wizard "대회 정보" 스텝에서 본인 보유 시리즈 드롭다운으로 사후 연결/분리 가능. 라벨 "시리즈명 (단체명)" 강제, confirm 모달 (단체 events 탭 노출 영향 명시), status 가드 (draft/registration_open 외 변경 disabled). PR1 PATCH API 활용.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/series/my/route.ts` | 신규 — GET 본인 organizer_id + status=active 시리즈 목록. organization { id, name, slug } include. BigInt → 문자열 직렬화. withWebAuth 가드. | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` | 수정 — SeriesOption type + seriesId/seriesOptions/seriesLoaded state / loadTournament 에서 series_id 초기값 / useEffect GET /series/my / handleSeriesChange + confirmSeriesChange (메시지 4분기) / PATCH body 에 series_id 포함 / "기본 정보" 카드 status 아래 드롭다운 + status 가드 + confirm 모달 | 수정 |
| `src/__tests__/api/series-my.test.ts` | 신규 — vitest 5 케이스 (401 / where 절 검증 / organization 분기 / 빈 배열 / mock 직렬화 통과) | 신규 |

### 핵심 로직
- **드롭다운 라벨**: `{name} ({organization?.name ?? "단체 미연결"})` — JSX 단일 source. 모든 시리즈에 단체명 표기 강제.
- **status 가드**: `status === "draft" || "registration_open" || "registration"` 시만 활성. 외 상태는 disabled + 안내 텍스트. (PR1 API status 가드와 일치 — UI 단에서 1차 차단, 서버에서 2차 검증).
- **confirm 모달 메시지 4분기**:
  - null → 시리즈 (단체 연결): `'X 단체' events 탭에 노출됩니다.`
  - null → 시리즈 (단체 미연결): `선택한 시리즈 '시리즈명' 에 연결합니다 (단체 미연결).`
  - 시리즈 → null (단체 있었음): `현재 'X 단체' events 탭에서 사라집니다.`
  - 시리즈 → null (단체 없었음): `이 대회를 시리즈에서 분리합니다.`
  - 시리즈 → 시리즈: `선택한 시리즈가 'X 단체' 에 속해 있어요. 'X 단체' events 탭에 노출됩니다.`
- **PATCH 호출 흐름**: 드롭다운 onChange → handleSeriesChange (모달만 띄움, state 미반영) → 사용자 확인 → setSeriesId → wizard 저장 버튼에서 PATCH body 에 series_id 포함하여 일괄 전송. (즉시 PATCH 안 함 — wizard 패턴 통일성).
- **모달 디자인**: var(--color-*) 토큰만 / rounded-md / 44px+ 터치 영역 / 백드롭 클릭 = 취소 / Material Symbols `info` 아이콘. lucide-react 0.
- **에러 핸들링**: `/api/web/series/my` GET 실패 시 wizard 자체는 계속 사용 가능 — 드롭다운만 빈 상태 (cancelled flag 로 unmount race 방어).

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit (본 PR 파일) | 0 에러 (foul-helpers.test.ts 1건 = 본 PR 무관 / 기존 untracked) |
| vitest 신규 케이스 | 5/5 PASS |
| vitest 전체 회귀 | 439/439 PASS (이전 434 + 신규 5) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt N n) | 위반 0 |
| Flutter v1 영향 | 0 (admin 영역 wizard + 신규 GET API) |
| schema 변경 | 0 |
| 운영 DB 영향 | 0 (코드만) |

### 💡 tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/api/series-my.test.ts` — 5 케이스
  2. 수동 E2E: `/tournament-admin/tournaments/{draft-tournament-id}/wizard` → "대회 정보" → "소속 시리즈" 드롭다운 → 시리즈 선택 → confirm 모달 → 확인 → "변경사항 저장" → DB UPDATE 검증
- 정상 동작:
  - 드롭다운 옵션 1행 = "— 미연결 —" / 2행~ = 본인 시리즈 (단체명 라벨)
  - status=in_progress/completed 시 드롭다운 disabled + 안내 텍스트 노출
  - 시리즈 변경 시 confirm 모달 메시지가 분기에 맞게 노출 (단체명 동적 표시)
  - PATCH 응답 200 시 wizard 가 `/tournament-admin/tournaments/{id}` 로 리다이렉트
- 주의할 입력:
  - 본인 시리즈 0건 → 드롭다운 비어있음 + "보유한 시리즈가 없습니다" 안내
  - 단체 미연결 시리즈 선택 → 라벨 "(단체 미연결)" / 모달 카피도 분기
  - 시리즈 ID 가 "abc" 같은 비숫자 (수동 조작) → PR1 API 가 400 ("유효하지 않은 시리즈 ID")
  - 타인 시리즈 ID 수동 주입 → PR1 API 가 403

### ⚠️ reviewer 참고
- **PATCH 호출 시점**: 드롭다운 변경 즉시 X / wizard 최종 저장 시 일괄 — 기존 wizard 패턴 (모든 필드 한 번에 PATCH) 따름. 사용자가 confirm 후 다른 단계로 갔다가 저장 X 하고 wizard 이탈 시 변경 미적용 (의도).
- **status="registration" 폴백**: STATUS_OPTIONS 의 `value="registration"` 은 wizard 의 잘못된 enum 값 (실제 DB enum = `registration_open`). 본 PR 의 `seriesEditAllowed` 가드는 두 값 모두 허용 — wizard 자체 이슈 fix 는 별도 turn.
- **/series/my response unwrap**: `json.data?.data ?? json.data ?? []` — apiSuccess({ data }) 가 한 번 더 래핑하므로 더블 unwrap. 응답 구조 확정 후 단순화 가능.
- **status 가드 UI vs API**: UI 가 disabled 처리해도 클라이언트 조작으로 우회 가능 — PR1 API 의 status 가드가 최종 방어선. UI 는 UX 안내 위주.
- **카운터 정합성**: BDR 시리즈(id=8) stored=0/actual=12 불일치는 PR2 와 무관 (PR1 기록 §위험 발견 참조). 본 PR 이 카운터를 +1/-1 박제하면 그 baseline 위에서 정상 동작 — 모든 PR 후 일괄 backfill 권장.

## 구현 기록 (developer) — 대회-시리즈 연결 흡수 모달 PR3

📝 구현한 기능: 단체 관리 페이지(`/tournament-admin/organizations/[orgId]`) 시리즈 카드에 "기존 대회 가져오기" 버튼 + 모달 — 운영자가 본인 미연결 draft/registration 대회를 다건 한 번에 시리즈에 흡수. PR1 의 권한/status/카운터 정책을 다건 + skip 패턴으로 확장.

### 변경 파일
| 파일 | 변경 내용 | 신규/수정 |
|------|----------|----------|
| `src/app/api/web/tournaments/my-unlinked/route.ts` | 신규 — GET `organizerId=ctx.userId AND series_id IS NULL AND status IN (draft/registration_open/registration)` 본인 미연결 대회 목록. withWebAuth / select 최소 필드 / Date ISO 직렬화. | 신규 |
| `src/app/api/web/series/[id]/absorb-tournaments/route.ts` | 신규 — POST 다건 흡수. zod tournament_ids min1 max50 + uuid 검증 / requireSeriesOwner (allowSuperAdmin) / IN 절 1회 후보 SELECT / 각 row 검증 (본인 소유 / 중복 시리즈 / status 가드) → absorbed/skipped 분리 / $transaction 안에서 이전 시리즈별 -count group by + 새 시리즈 +absorbed.length + updateMany. | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/_components/AbsorbTournamentsModal.tsx` | 신규 — 모달 컴포넌트. 마운트 시 GET my-unlinked / 전체 선택 + 개별 체크박스 / ESC 키 닫기 / confirm 다이얼로그 2단계 / 응답 absorbed/skipped 분리 메시지 / 결과 1.5초 표시 후 onSuccess. 디자인: var(--color-*) 토큰만 / Material Symbols / 44px+ 터치. | 신규 |
| `src/app/(admin)/tournament-admin/organizations/[orgId]/page.tsx` | 수정 — useEffect → useCallback loadOrg 추출 (모달 onSuccess 시 재호출). 시리즈 카드 우측에 "기존 대회 가져오기" 버튼 + 모달 마운트 (`absorbModalSeries` state). 시리즈 카드 컨테이너 Link → div + 좌측 Link / 우측 액션 영역으로 재구성. | 수정 |
| `src/__tests__/api/tournaments-absorb.test.ts` | 신규 — vitest 8 케이스 (401 / 자기-자기 200 / 혼합 skip / 타인 시리즈 403 / status 가드 skip / 카운터 양면 / zod 빈배열 + 비-uuid 400). | 신규 |

### 핵심 로직

**(1) skip 패턴 (전체 400 X)**
- 후보 N건 중 일부가 조건 위반해도 정상 row 만 absorbed, 위반 row 는 `skipped: [{id, reason}]` 응답
- 사유 4분기: "대회를 찾을 수 없습니다." / "본인 소유 대회가 아닙니다." / "이미 이 시리즈에 연결된 대회입니다." / "진행 중이거나 종료된 대회는 흡수 불가합니다."
- UI 는 absorbed=0 면 첫 사유 표시, 1건+ 성공이면 "N개 흡수 (M건 제외 — 사유 외)" 메시지

**(2) status 정책 정합 (PR1 + my-unlinked + absorb 3개 API 일관)**
- 허용: `draft / registration_open / registration` (registration 은 wizard 잘못된 enum 폴백)
- 본인 소유 검증은 super_admin 도 우회 X — 시리즈 권한만 우회 (PR1 PATCH 와 정책 다름: 시리즈 단에서 임의 대회 흡수 차단 위해)

**(3) 카운터 동기화 ($transaction)**
- 이전 series_id 별 group by → `prevSeriesDecrement` Map 으로 누적 → 시리즈별 -count
- 새 시리즈 +absorbed.length (1회 호출)
- `tournament.updateMany({ where: { id: { in: absorbed } }, data: { series_id } })` 일괄 UPDATE
- absorbed=0 이면 $transaction 진입 X (early return)

**(4) UI 동선 (4 단계)**
- 단체 대시보드 진입 → 시리즈 카드 "기존 대회 가져오기" 클릭 → 모달 (체크박스 다건) → 흡수 confirm → 결과 inline 표시 → 1.5초 후 onSuccess → 페이지 refresh

### 검증 결과
| 항목 | 결과 |
|------|------|
| tsc --noEmit (본 PR 파일) | 0 에러 (잔존 score-sheet/team-section timeouts 2건 = FIBA Phase 4 작업 / 본 PR 무관) |
| vitest 신규 케이스 | 8/8 PASS |
| vitest 전체 회귀 | 477/477 PASS (이전 469 + 신규 8) |
| Flutter v1 series_id/my-unlinked/absorb grep | 0 사용처 |
| schema 변경 | 0 |
| 운영 DB 영향 | 0 (코드만, _temp 미사용) |
| 디자인 13 룰 (lucide-react / 핑크코랄 / BigInt n) | 위반 0 |

### 💡 tester 참고
- 테스트 방법:
  1. `npx vitest run src/__tests__/api/tournaments-absorb.test.ts` — 8 케이스
  2. 수동 E2E:
     - 강남구농구협회 단체 페이지(`/tournament-admin/organizations/{orgId}`) 진입
     - BDR 시리즈 또는 새 시리즈 카드 우측 "기존 대회 가져오기" 클릭
     - 모달: 본인 미연결 대회 목록 (현재 강남구협회장배 1건 + BDR 12건이 series_id 연결 상태라면 0건)
     - 체크 + "N개 흡수" → confirm → "흡수" → 결과 메시지 → 페이지 refresh 시 시리즈 카드 카운터 +N
- 정상 동작:
  - 모달 진입 시 GET /api/web/tournaments/my-unlinked 자동 호출
  - 전체 선택 토글 + 개별 체크 동작
  - 흡수 성공 시 카드의 "대회 N개" 텍스트 갱신 (loadOrg refresh)
  - skip 케이스: in_progress 대회는 목록에 안 나오므로 skip 경로는 동시 흡수 중 status 변경 race 외엔 발생 0
- 주의할 입력:
  - 빈 배열 / 비-uuid → 400 (zod 가드)
  - 미연결 대회 0건 → "현재 미연결 대회가 없습니다" 안내
  - 51건 이상 → 400 (zod max 50)
  - 타인 시리즈 ID 수동 URL 조작 → 403

### ⚠️ reviewer 참고
- **super_admin 우회 정책 다름 (PR1 vs PR3)**: PR1 PATCH 는 wizard 진입자 = 대회 organizer = 본인 (requireTournamentAdmin 통과). PR3 는 단체 페이지에서 시리즈 단위 진입 — 시리즈 권한만 우회 허용하고 대회 소유는 본인 일관성 유지 (super_admin 도 본인 소유 대회만 흡수). 보안상 보수적 선택.
- **카운터 동기화 group by**: 이전 시리즈가 N개 다른 시리즈에 분산돼 있을 수 있어 Map<seriesIdStr, count> 로 누적 → 시리즈별 1회 update. updateMany 와 분리한 이유 = decrement 는 increment 와 별도 row 대상.
- **응답 unwrap 패턴**: 모달은 `json?.data?.data ?? json?.data ?? []` 더블 unwrap (apiSuccess({ data }) 더블 래핑 회피 — PR2 와 동일). absorb POST 응답은 `json?.data ?? json` 단일 unwrap (apiSuccess({ absorbed, skipped }) 형태).
- **resultMessage 1.5초 setTimeout**: 사용자가 결과 메시지 (N개 흡수) 읽을 시간 확보 — toast 시스템 미도입 (단체 페이지는 ToastProvider 미사용) 단순 inline 메시지.
- **카운터 정합성**: BDR 시리즈(id=8) stored=0/actual=12 불일치 (PR1 §위험 발견 동일) — PR3 코드 자체는 정상 (-N/+N 박제 OK), backfill 별도 후속.
- **시리즈 카드 Link → div 재구성**: 기존 카드 전체가 Link 였으나, 버튼 클릭 시 시리즈 진입을 막아야 해서 좌측 정보 Link + 우측 액션 영역 (button + chevron Link) 으로 재구성. `e.preventDefault() + stopPropagation()` 으로 nested click 안전.

---

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 4]** Time-outs Article 18-19 (전반2/후반3/OT각1) + timeout-types/helpers 신규 + team-section TIME-OUTS 활성화 + score-sheet-form state/handler + BFF settings.timeouts JSON merge UPDATE (recording_mode 키 보존). tsc 0 / vitest 477/477 (+30). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 흡수 모달 PR3]** GET /api/web/tournaments/my-unlinked (본인 미연결 draft/reg 대회) + POST /api/web/series/[id]/absorb-tournaments (다건 흡수 skip 패턴 / $transaction 카운터 group by) + AbsorbTournamentsModal (체크박스 다건 + 2단계 confirm + var(--*) 토큰 + Material Symbols + 44px+) + 단체 페이지 시리즈 카드 "기존 대회 가져오기" 버튼. vitest 477/477 (+8). tsc 0. 디자인 13 룰 위반 0. Flutter v1 영향 0. schema 변경 0. 운영 DB 영향 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 3.5]** 파울종류 P/T/U/D + Article 41 4사유 분기 + 쿼터/경기 종료 + Licence 자동 fill (User.id). FoulTypeModal + MatchEndButton 신규. tsc 0 / vitest 439/439 (+23). 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 UI PR2]** GET /api/web/series/my (organization include / BigInt 직렬화 / withWebAuth) + wizard "대회 정보" 스텝 소속 시리즈 드롭다운 ("시리즈명 (단체명)" 라벨 / status 가드 / confirm 모달 4분기) + PATCH body series_id 포함. vitest 439/439 (+5). tsc 0. 디자인 13 룰 위반 0. Flutter v1 영향 0. schema 변경 0. 운영 DB 영향 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[대회-시리즈 연결 API PR1]** zod series_id 추가 / series-permission 헬퍼 (404/403 throw) / PATCH route series_id 분기 + status 가드 (draft/reg_open만 이동 / null 분리는 항상 허용) + $transaction 카운터 동기화. vitest 416/416 (+11). tsc 0. Flutter v1 영향 0. **위험**: BDR 시리즈(id=8) tournaments_count stored=0/actual=12 불일치 = 기존 데이터 이슈 (PR 무관, backfill 후속 큐). | ✅ |
| 2026-05-12 | (기획만 / 코드 0) | **[대회-시리즈 연결 UI 기획설계]** 옵션 A/B/C 비교 → A 권장(PR1+PR2 약 305 LOC). zod series_id 추가 / series-permission 헬퍼 / `/series/my` GET / wizard 드롭다운. 권한 = 본인 시리즈만, status = draft/registration만 변경 허용 권장. 결재 7건 정리 (Q1~Q7). | ✅ |
| 2026-05-12 | (DB만 / 코드 0) | **[강남구협회 연결 초기화]** BDR 시리즈(id=8) organization_id=NULL UPDATE 1건. 12 대회 events-tab 미노출 검증. 강남구협회장배(draft, series_id=NULL) 연결 흐름 분석 — Tournament PATCH series_id 부재로 사후 연결 UI 없음. _temp 정리. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA 종이 기록지 Phase 3]** Player Fouls 1-5 + Team Fouls 자동 + 5반칙 회색·"퇴장" + 5+ FT toast. BFF fouls + PBP foul event. vitest 405/405 (+24). | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA 종이 기록지 Phase 2]** Running Score 1-160 + PlayerSelectModal + PeriodScoresSection + BFF running_score → PaperPBP. vitest 381/381 (+31). | ✅ |
| 2026-05-11 | (커밋 대기) | **[FIBA 종이 기록지 Phase 1]** `(score-sheet)` route group + minimal layout + RotationGuard + FibaHeader + TeamSection. 기존 `(web)/score-sheet/` 6 파일 폐기. vitest 350/350 (+9). | ✅ |
| 2026-05-11 | (기획만) | **[FIBA 재기획]** 6 Phase + 사용자 결재 7건 + 컴포넌트 트리 + DB 매핑 12 영역. | ✅ |
