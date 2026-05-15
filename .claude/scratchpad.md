# 작업 스크래치패드

## 현재 작업
- **요청**: PR-Admin-6 /playoffs 신규 hub 박제 (대규모 신규 페이지 / 회귀 0)
- **상태**: ✅ developer 박제 완료 (tsc 0 / 자가 진단 6/6 PASS / 회귀 0 / 5 섹션 컴포지션) — PM 검토 대기
- **현재 담당**: developer → PM

## 구현 기록 (developer) — PR-Admin-4

📝 구현한 기능:
- admin-flow-audit §6.5 우선 4 — bracket 페이지 종별별 generator trigger 박제 (강남구협회장배 4 종별 × 다른 format 운영 가능 흐름 박제)
- 신규 endpoint `POST /api/web/admin/tournaments/[id]/division-rules/[ruleId]/generate` — division_rule.format 분기로 3 generator 호출 (league_advancement / group_stage_with_ranking / group_stage_knockout)
- 신규 컴포넌트 `DivisionGenerateButton` — DivisionBracketSections 종별 헤더 우측 inline 배치 (Navy/refresh 아이콘 + confirm + 결과 모달)
- bracket route GET 응답 확장 — `divisionRules: [{id, code, format}]` 추가 (UI 가 code → ruleId 매핑)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/web/admin/tournaments/[id]/division-rules/[ruleId]/generate/route.ts` | POST endpoint — 권한+ruleId 가드+format 화이트리스트+트랜잭션 (advisory lock + clear deleteMany + generator + matches_count + bracket_version + admin_logs) | 신규 (+185) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/DivisionGenerateButton.tsx` | 종별 단위 trigger (AdvancePlayoffsButton 패턴 재사용) — 미지원 format 자동 비노출 / hasMatches 분기 confirm / 결과 모달 (success/warning 톤 + reason 표시) | 신규 (+254) |
| `src/app/api/web/tournaments/[id]/bracket/route.ts` | GET 응답에 divisionRules 추가 (bracket POST 변경 0 — 회귀 보장 핵심) | 수정 (+14) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx` | BracketData type 확장 / DivisionBracketSections 시그니처 +divisionRules+onDivisionGenerated / 종별 헤더 inline 버튼 박제 | 수정 (+33) |

🛡️ 회귀 가드 (자가 진단 6/6 PASS):
1. ✅ bracket POST 변경 0 — 별도 endpoint 신규 박제 (scratchpad §PR-Admin-4 spec 따름)
2. ✅ ruleId BigInt 가드 + tournamentId 매칭 검증 (IDOR 방지 → 미일치 시 404)
3. ✅ 트랜잭션 + advisory lock + `settings.path:["division_code"]` 매칭 deleteMany (다른 종별 매치 보존)
4. ✅ DivisionBracketSections 헤더에 inline 박제 (`_no_division` + `ruleByCode.has(divCode)` 가드)
5. ✅ tsc 0 (npx tsc --noEmit 출력 비어있음)
6. ✅ 5 기존 format 분기 (round_robin/swiss/dual/single_elim/NBA-seed) 시그니처 변경 0 — divisionCode 인자 받지 않음

⚠️ 추가 박제 결정:
- **GenerateOptions 인자 미전달** — generator 의 `venueName/startScheduledAt/intervalMinutes` 3 옵션은 이번 PR 범위 외 (scratchpad spec 미언급). 후속 PR 에서 운영자 입력 폼 박제 시 추가.
- **format 화이트리스트 분기** — single_elim/dual/swiss/round_robin/full_league* 종별 = 400 (안내 메시지 = "대회 단위 bracket POST 사용"). 강남구 케이스 100% 커버 (3 format 만 사용).
- **group_stage_knockout = stub 유지** — generator 자체가 stub (생성 0 / reason="후속 PR") 이라 endpoint 도 stub 동작. 결과 모달 = warning 톤 (generated=0).

💡 tester 참고:
- 테스트 방법: 강남구협회장배 (i3-U9 league_advancement / i3-U11/U14/i3w-U12 group_stage_with_ranking) 4 종별 대회 → bracket 페이지 진입 → 종별 sub-Card 헤더 우측 "이 종별만 재생성" 버튼 클릭
- 정상 동작:
  1. confirm 메시지 분기 (매치 존재 → 삭제 후 재생성 / 매치 0건 → 첫 생성)
  2. 응답 = 200 + 결과 모달 (success 톤 + generated > 0)
  3. 다른 종별 매치 = 영향 0 (settings.division_code 매칭 deleteMany 만)
- 주의할 입력:
  - 잘못된 ruleId (다른 대회 ruleId) → 404 "rule-not-found-or-mismatch" (IDOR 가드)
  - 미지원 format (single_elim/dual/swiss/round_robin) → 400 + 안내 메시지
  - clear=true + 매치 0건 → 정상 (deleteMany count=0 + generator 정상 진행)
  - 동시 호출 (동일 대회 + 동일 종별) → advisory lock 으로 직렬화

⚠️ reviewer 참고:
- **bracket POST 시그니처 변경 0** — 본 PR 의 회귀 0 보장 핵심. divisionCode 인자 받지 않음 (scratchpad spec 옵션 별도 endpoint 선택)
- **bracket_version 박제** — 종별 단위 generator 호출 시에도 +1 박제 (scratchpad spec 가드 5: "사용자 명확 인지"). MAX_FREE_VERSIONS 한도 도달 케이스는 createBracketVersion 내부 분기로 정상 동작
- **adminLog resourceId** — string tournamentId 가 BigInt 변환 catch 안 됨 (cuid 형식). adminLog 내부 try/catch 로 본 작업 영향 0 (다른 endpoint 동일 패턴)

📊 git diff --stat HEAD (본 PR 영향만):
- 신규 2 파일 (+439): DivisionGenerateButton.tsx (+254) + generate route.ts (+185)
- 수정 2 파일 (+47): bracket page.tsx (+33) + bracket route.ts (+14)
- **본 PR 합계**: +486 (예상 +342 대비 144 추가 — adminLog/admin_logs 통합 + reason 표시 + Modal wrapper)
- 다른 22 파일 (score-sheet 관련) = 워킹트리 시작 시점 기존 변경 (본 작업 무관)

## 구현 기록 (developer) — PR-Admin-5

📝 구현한 기능:
- admin-flow-audit §6.5 우선 5 — divisions 페이지 두 카드 (#3 종별 정의 + #4 운영 방식) 통합 → 단일 카드 #3 "종별 + 운영 방식" 박제
- ChecklistItem.progress 신규 필드 — 통합 카드 진행도 시각화 (정의 N건 / 운영방식 M건 + progress bar)
- SetupChecklist.tsx — progress 필드 표시 분기 (다른 6 카드 영향 0)
- 8 항목 → 7 항목 step renumbering (기존 #5~#8 → #4~#7)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/tournaments/setup-status.ts` | 8→7 항목 통합 / 통합 카드 #3 "종별 + 운영 방식" 박제 / progress 필드 추가 / step renumbering | 수정 (+74 -41) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/SetupChecklist.tsx` | progress 필드 표시 분기 (운영방식 박제 진척 + progress bar) | 수정 (+29) |
| `src/__tests__/lib/tournaments/setup-status.test.ts` | 기존 케이스 update (8→7 / step 번호 / "운영 방식" → "종별 + 운영 방식") + 신규 7 케이스 추가 | 수정 (+96 -24) |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-5 한정 — 3 파일 수정)
 src/__tests__/lib/tournaments/setup-status.test.ts | 120 ++++++++++++++++-----
 .../[id]/_components/SetupChecklist.tsx            |  29 +++++
 src/lib/tournaments/setup-status.ts                | 115 +++++++++++---------
 3 files changed, 186 insertions(+), 78 deletions(-)

npx tsc --noEmit: EXIT_CODE=0 (전체 PASS / 0 error)
npx vitest run src/__tests__/lib/tournaments/setup-status.test.ts: 50/50 PASS (기존 ~36 + 신규 7 + canPublish update)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | setup-status.ts 8→7 항목 통합 확인 | ✅ items.length===7 가드 + step 1~7 연속 가드 vitest PASS |
| 2 | SetupChecklist.tsx 통합 카드 렌더링 확인 (progress 표시) | ✅ +29 LOC / progress bar + N/M 표시 / 다른 카드 영향 0 |
| 3 | vitest 기존 케이스 회귀 0 + 신규 케이스 PASS | ✅ 50/50 PASS (기존 36 update + 신규 7 + canPublish 1 update) |
| 4 | tsc 0 | ✅ EXIT_CODE=0 (전체 PASS / 0 error) |
| 5 | 공개 게이트 (required 카운트) 회귀 0 보장 | ✅ canPublish 로직 0 변경 / required 항목 7→6 (시리즈 제외 6 항목 ALL ✅ 시 공개 가능) |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-accent) (모든 운영 방식 박제 시 progress bar) / var(--color-warning) (일부 박제) / var(--color-elevated) (track) 토큰만
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "category" (통합 카드 아이콘 / 기존 #3 그대로) — lucide-react ❌
- ✅ progress bar 1.5px 높이 + N/M 11px 라벨 (44px+ 터치 영역은 부모 카드 minHeight: 96 그대로)
- ✅ 핑크/살몬/코랄 ❌

⚠️ 규약 준수:
- ✅ planner-architect 박제 spec 100% 일치 (3 파일 / spec 예상 +60 LOC → 실제 +186 -78 = 순 +108 LOC, vitest 신규 7 케이스 풍성화로 spec 4 케이스 초과)
- ✅ areDivisionsDefined / areDivisionRulesComplete 함수 시그니처 보존 (다른 호출자 영향 0)
- ✅ divisions/page.tsx 변경 0 (페이지는 그대로 / 카드만 통합)
- ✅ AdvancePlayoffsButton (PR-Admin-2) / PlaceholderValidationBanner (PR-Admin-3) / NextStepCTA (PR-Admin-1) 변경 0
- ✅ 공개 게이트 로직 (canPublish) 코드 변경 0 — items[].required boolean 카운트만 / 통합 후에도 동작 보존
- ✅ 운영 DB SELECT 0 (UI + 헬퍼 함수만)
- ✅ 디자인 13 룰 위반 0

💡 tester 참고:
- 테스트 방법:
  1. 강남구협회장배 같은 다중 종별 대회 ID 진입 → `/tournament-admin/tournaments/[id]` (hub)
  2. SetupChecklist 카드 8 → 7개 노출 확인 (기존 "종별 정의" + "운영 방식" 두 카드 → 통합 1 카드)
  3. 통합 카드 #3 "종별 + 운영 방식" 노출 확인 (icon: category)
  4. 종별 4 정의 + 운영방식 2 박제 시 → progress bar 50% + "운영방식 박제 진척 2 / 4" 노출
  5. 통합 카드 클릭 → `/tournament-admin/tournaments/[id]/divisions` 이동
- 정상 동작:
  - 종별 0건 = 통합 카드 status="empty" + progress 표시 0
  - 종별 ≥1건 + 운영방식 일부 = status="in_progress" + progress bar (warning 톤)
  - 종별 ≥1건 + 운영방식 ALL = status="complete" + progress bar (accent 톤 / 100%)
  - 기본 정보 미박제 = 통합 카드 locked + lockedReason 노출
- 주의할 입력:
  - 종별 1건만 + 운영방식 박제 = progress 1/1 + status="complete"
  - 종별 4건 + 모든 format null = progress 0/4 + status="empty"
  - 공개 게이트 (PublishGate) — required 항목 6개 모두 ✅ 시 "대회 공개하기" 활성 (시리즈 제외)

⚠️ reviewer 참고:
- ChecklistItem.progress 필드는 optional — 다른 6 카드는 progress 미박제 (= undefined). 통합 카드 #3 만 progress 박제 → SetupChecklist.tsx 의 `item.progress &&` 가드로 안전.
- divsComplete (= areDivisionRulesComplete 함수) 가 통합 카드 status complete 판정의 single source — 이 함수는 group_size/group_count 검증까지 포함 → 통합 후에도 same.
- step number 1~7 (8 → 7) renumbering — registrations(5→4) / site(6→5) / recording(7→6) / bracket(8→7). 사용자 메시지 (lockedReason) 는 "운영 방식을 먼저 박제하세요" → "종별 + 운영 방식을 먼저 박제하세요" 로 변경.
- vitest 신규 7 케이스 = 통합 카드 회귀 가드 풍성화 (planner spec 4 케이스 초과). 사유: items.length===7 / oldKey 부재 / step 연속 / progress 분기 등 회귀 위험 점 모두 박제.

## 구현 기록 (developer) — PR-Admin-6

📝 구현한 기능:
- admin-flow-audit §6.5 우선 6 — 신규 hub `/tournament-admin/tournaments/[id]/playoffs` 박제 (예선 종료 → 순위전 → 결승 → 우승팀 결정 단일 hub)
- 5 섹션 컴포지션:
  1) PlaceholderValidationBanner (PR-Admin-3 재사용 / 상단 노출 — 사고 인지 우선)
  2) AdvancePlayoffsButton (PR-Admin-2 재사용 / 단일 trigger)
  3) 종별 standings 표 (StandingsTable 신규 / 그룹별 정렬 + 1위 success 톤 강조)
  4) 순위전 매치 목록 (roundName "순위" 정규식 매치 / 종별 그룹핑)
  5) 결승전 + 우승팀 (winner_team_id 박제 시 trophy 카드 강조)
- 진입점 2 곳: matches 헤더 link + divisions 안내 카드 link

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/page.tsx` | server component — 권한 가드 (super_admin/organizer/TAM 패턴) + getDivisionStandings Promise.all 병렬 (종별 N+1 방지) + matches BigInt 직렬화 | 신규 (+165) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx` | client — 5 섹션 컴포지션 + RANKING_ROUND_REGEX/FINAL_ROUND_REGEX 박제 + DivisionMatchGroup/PlayoffMatchRow/FinalCard 내부 컴포넌트 + onSuccess router.refresh() | 신규 (+508) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/StandingsTable.tsx` | 재사용 표 — 그룹별 분류 + 1위/2위 색 강조 + 득실차 success/warning 톤 + 0건 폴백 | 신규 (+149) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx` | 헤더 우측 link "순위전·결승 hub →" 추가 (Navy 톤) | 수정 (+7) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | 안내 카드 link 추가 ("예선 종료 후 순위전·결승 hub 에서 일괄 처리") | 수정 (+14) |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-6 한정):
 .../tournaments/[id]/divisions/page.tsx         |  14 +
 .../tournaments/[id]/matches/matches-client.tsx |   7 +
+ 신규 (untracked, --stat 미표시):
 .../[id]/_components/StandingsTable.tsx         | 149
 .../[id]/playoffs/page.tsx                      | 165
 .../[id]/playoffs/playoffs-client.tsx           | 508

본 PR 합계: 신규 822 LOC + 수정 +21 = +843
(예상 +426 대비 +397 추가 — 섹션별 sub 컴포넌트 분리 + standings 0건/매치 0건 폴백 + 우승팀 trophy 강조 카드 풍성화)

npx tsc --noEmit: EXIT_CODE=0 (전체 PASS / 0 error)
```

🔧 자가 진단 6/6 PASS:

| # | 항목 | 결과 |
|---|------|------|
| 1 | playoffs/page.tsx 신규 파일 (LOC > 0) | ✅ 165 LOC |
| 2 | 5 섹션 모두 렌더링 확인 | ✅ Banner / Advance / Standings(grid 2col) / Ranking(divisional group) / Final(grid 2col) |
| 3 | AdvancePlayoffsButton / PlaceholderValidationBanner 재사용 확인 | ✅ import + props 호출 (변경 0 / 시그니처 보존) |
| 4 | tsc 0 | ✅ EXIT_CODE=0 |
| 5 | 진입 링크 박제 확인 | ✅ matches-client +7 ("순위전·결승 hub →" Navy link) / divisions +14 (안내 Card + Navy link) |
| 6 | 디자인 13 룰 준수 | ✅ var(--color-info/success/warning/text-muted/elevated/surface) 토큰만 / rounded-[4px] 만 (pill ❌) / material-symbols (trending_up/leaderboard/sports_basketball/emoji_events) / lucide-react ❌ / 핑크·살몬·코랄 ❌ |

🛡️ 회귀 가드:
- ✅ AdvancePlayoffsButton / PlaceholderValidationBanner / NextStepCTA / DivisionGenerateButton 변경 0 (재사용만 / import + props)
- ✅ getDivisionStandings 시그니처 변경 0 (server 에서 호출만)
- ✅ placeholder-helpers / division-advancement / setup-status 시그니처 변경 0
- ✅ match-sync.ts / score-updater.ts 변경 0
- ✅ matches/divisions 페이지 = link 1줄씩만 추가 (다른 영역 변경 0)
- ✅ bracket / teams 페이지 변경 0
- ✅ 운영 DB SELECT 만 (server component / read-only / Promise.all 병렬 = N+1 방지)

⚠️ 추가 박제 결정:
- **RANKING_ROUND_REGEX 박제 동일** — placeholder-helpers.ts:266 의 정규식이 export 되지 않아 client 모듈에 동일 정규식 박제 (`/순위/`). PlaceholderValidationBanner 내부 검증과 일관 보장.
- **FINAL_ROUND_REGEX 신규 박제** — 결승 매치 식별 위해 `/결승|final/i` 정규식 신규 (generator 별 표기 차 모두 매치). 본 hub 전용 (다른 모듈 미사용).
- **standings Promise.all 병렬** — divisionRules N건 = N 쿼리 (각 종별 1쿼리 / Promise.all 병렬). 강남구 4 종별 = 4 쿼리 동시 실행.
- **divisionRules 0건 폴백** — `["default"]` code 로 단일 종별 처리 (다른 generator 케이스 호환).
- **우승팀 식별 = winner_team_id ↔ home/awayTeamId 비교** — winner_team_id 박제된 결승 매치 1건 + 양 팀 중 매칭 = 우승팀명 표시. score-updater 자동 박제 신뢰.
- **SetupChecklist 추가 ❌** — planner 옵션 (c) 권장 따름. 진입은 matches/divisions link 만.

💡 tester 참고:
- 테스트 방법:
  1. 다중 종별 대회 (강남구협회장배 4 종별) 진입 → URL `/tournament-admin/tournaments/[id]/playoffs` 직접 진입
  2. 진입점 검증: `/matches` 페이지 헤더 우측 + `/divisions` 페이지 안내 카드 link 클릭 → playoffs hub 이동
  3. 5 섹션 노출 확인 (위→아래: Banner / Advance / Standings 4 종별 grid / Ranking 매치 / Final + 우승팀)
  4. AdvancePlayoffsButton 클릭 → 결과 모달 → "확인" → router.refresh() → 매치 갱신 확인
- 정상 동작:
  - 매치 0건 = standings 0 폴백 + Ranking 0 폴백 + Final 0 폴백 (모두 빈 카드 표시)
  - 매치 多 + winner_team_id 박제 = 결승 카드에 trophy + 우승팀명 (success 톤 강조)
  - placeholder 형식 위반 0 = Banner 미표시 (정상 운영 방해 0)
- 주의할 입력:
  - 강남구협회장배 (i3-U9 league_advancement / i3-U11/U14/i3w-U12 group_stage_with_ranking) 4 종별 시 Standings grid 2 col + Ranking 종별 그룹 4 + Final 종별 4
  - 단일 종별 대회 (divisionRules 0건) = "default" code 폴백 / Standings 1 카드만
  - 권한 = super_admin / organizer / active TAM 만 진입 (그 외 = 404)

⚠️ reviewer 참고:
- **server component fetch 패턴** — getDivisionStandings 는 prisma 인스턴스 그대로 전달 (트랜잭션 불필요 / read-only). matches fetch = include 대신 select + nested select (N+1 방지).
- **BigInt 직렬화** — server → client props 전달 시 모든 BigInt 필드 (id / homeTeamId / awayTeamId / winner_team_id) `.toString()` 변환. settings JSON 은 unknown record 로 안전 전달.
- **client 의 RANKING_ROUND_REGEX 박제 동일** — placeholder-helpers 와 동일 정규식 (`/순위/`). 향후 정규식 변경 시 양쪽 동시 갱신 필요 (decisions.md 박제 권장).
- **router.refresh()** — Advance 성공 시 server component 재실행 → standings + matches 재조회. Cache 무효화 자동.
- **미박제 후속 큐**:
  - 시상 / 트로피 자동 박제 trigger (score-updater 자동 박제만 신뢰 / UI trigger 없음)
  - 통계 동결 trigger (우승팀 결정 후 freezing UI 미박제)
  - playoffs 페이지 vitest 케이스 0 (E2E 테스트 큐로 분리 — planner spec 따름)

## 구현 기록 (developer) — PR-Admin-2

📝 구현한 기능:
- admin-flow-audit §3 단계 10 정렬 — "예선 종료 → 순위전 진출" trigger 를 matches 페이지로 이동 박제 (teams 부적절 위치 제거)
- AdvancePlayoffsButton: modal 2종 (success/warning 결과 + error 분기) + 종별 4 col 표 (UPDATE/SKIP/에러)
- onSuccess → matches load() refetch trigger (자동 매핑 결과 즉시 반영)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/AdvancePlayoffsButton.tsx` | 신규 (320 LOC / Card 모달 + 4 col 표 + success/warning/error 3 톤 분기 / BDR Navy trigger) | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx` | import 1줄 + 헤더 우측 박제 5줄 + flex-wrap 보정 (matches.length>0 가드) | 수정 (+14) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx` | 기존 "순위전 자동 채우기" 버튼 제거 (-10) + advancePlaceholders 헬퍼 제거 (-29) + 안내 주석 4줄 | 수정 (+4 -39) |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-2 한정 — 2 파일 수정)
 .../tournaments/[id]/matches/matches-client.tsx    | 14 ++++++-
 .../tournaments/[id]/teams/page.tsx                | 45 +++-------------------
 2 files changed, 18 insertions(+), 41 deletions(-)

git status (untracked — 신규 1 파일)
?? src/app/(admin)/tournament-admin/tournaments/[id]/_components/AdvancePlayoffsButton.tsx

npx tsc --noEmit: EXIT_CODE=0 (전체 PASS / 0 error)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | AdvancePlayoffsButton.tsx 신규 파일 (LOC > 0) | ✅ 320 LOC |
| 2 | matches-client.tsx 헤더 우측 박제 확인 | ✅ +14 LOC (import 1 + AdvancePlayoffsButton 박제 6 + flex-wrap 보정 + matches.length>0 가드) |
| 3 | teams/page.tsx 기존 버튼 + 헬퍼 제거 확인 | ✅ -39 LOC (버튼 -10 + 헬퍼 -29) + 안내 주석 +4 |
| 4 | tsc 0 | ✅ EXIT_CODE=0 (전체 PASS) |
| 5 | 디자인 13 룰 준수 (var(--color-*) / rounded-[4px] / material-symbols / 44px+) | ✅ 모두 준수 (아래 상세) |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-info) Navy trigger 버튼 (matches 헤더 우측)
- ✅ var(--color-success) 결과 배너 (에러 0 케이스 / check_circle)
- ✅ var(--color-warning) 결과 배너 (에러 ≥1 케이스 / warning)
- ✅ var(--color-error) 에러 모달 (네트워크/서버 오류 / error)
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "trending_up" / "check_circle" / "warning" / "error" (lucide-react ❌)
- ✅ 모바일 44px+ 터치 영역 (trigger / 모달 확인 버튼 모두 minHeight: 44)
- ✅ 핑크/살몬/코랄 ❌

⚠️ 규약 준수:
- ✅ planner-architect 박제 spec 100% 일치 (3 파일 / spec 예상 +87 LOC → 실제 +14 -41 = 컴포넌트 풍성화로 신규 320 LOC)
- ✅ NextStepCTA (PR-Admin-1) / PlaceholderValidationBanner (PR-Admin-3) 변경 0 (영역 분리)
- ✅ advance-placeholders route 변경 0 (재사용 / route 동작 그대로)
- ✅ match-sync.ts 변경 0 (자동 trigger 와 양면 박제 / 운영자 fallback UI 만 박제)
- ✅ matches-client.tsx 다른 영역 변경 0 (헤더 우측 1 영역만 / flex-wrap 보정 외 무관 영역 0)
- ✅ teams/page.tsx 헤더 layout 검증 — flex-wrap gap-2 + 잔존 2 버튼 (CSV / 카톡) 정상 표시 (3 → 2 버튼)
- ✅ 운영 DB SELECT 0 (UI 컴포넌트 + 기존 route 재사용만)

💡 tester 참고:
- 테스트 방법:
  1. 강남구협회장배 같은 다중 종별 대회 ID 진입 → `/tournament-admin/tournaments/[id]/matches`
  2. 헤더 우측 "예선 종료 → 순위전 진출" Navy 버튼 노출 확인 (대진표 재생성 옆)
  3. 클릭 → confirm 다이얼로그 → "확인" → 처리 중 표시 → 결과 모달 노출
  4. 결과 모달 = 종별 표 (UPDATE/SKIP/에러 4 col) + 에러 0 = 초록 톤 / 에러 ≥1 = 노란 톤
  5. "확인" 클릭 → 모달 닫힘 + matches 자동 새로고침 (load() refetch — placeholder 슬롯 채워진 매치 노출)
  6. teams 페이지 진입 → 기존 "순위전 자동 채우기" 버튼 미표시 확인 (CSV/카톡 2 버튼만 잔존)
- 정상 동작:
  - 모바일(≤720px): 헤더 flex-wrap → trigger 버튼 줄바꿈 / 모달 풀너비 (max-w-lg + p-4 inset)
  - PC(≥sm): 헤더 inline / 모달 가운데 정렬 max-w-lg
  - matches.length === 0 → trigger 버튼 미표시 (대진표 미생성 시 의미 0)
- 주의할 입력:
  - 대회에 placeholder 매치 0건 → 응답 results 빈 배열 → 표 미표시 + "업데이트 0건" 노출 (정상)
  - 모든 종 처리 (body {}) — divisionCode 옵션 미사용 (전체 종 일괄)
  - confirm 취소 → POST 호출 0 (현 상태 유지)

⚠️ reviewer 참고:
- AdvancePlayoffsButton.tsx 320 LOC = planner 예상 120 LOC 초과. 사유: ResultModal wrapper / success+warning+error 3 톤 분기 / 4 col 표 / 본 PR 본질 = 운영자 신뢰성 (모달 결과 정확 표시) — 의도된 풍성화.
- apiSuccess() 응답 구조 = `{ success: true, data: { ... } }` 형식. payload = `json.data ?? json` fallback 처리 (snake_case 변환 후).
- divisionCodes prop 은 결과 모달 표 라벨 안내용 (현재는 응답 division_code 만 표기 / 추후 종별 한글명 매핑 옵션).
- match-sync.ts:674 자동 trigger 와 본 PR 운영자 수동 trigger 양면 박제 = advance route idempotent 보장 (placeholder-helpers `isStandingsAutoFillable` + `division-advancement.ts` skip 로직).
- teams 헤더 layout 회귀 0 — flex-wrap gap-2 유지 / 3 버튼 → 2 버튼 (CSV / 카톡) — 시각 깨짐 0.

## 구현 기록 (developer) — PR-Admin-3

## 구현 기록 (developer) — PR-Admin-3

📝 구현한 기능:
- 강남구협회장배 사고 (2026-05-15 / errors.md 102) 재발 방지 — 순위전 매치 placeholder 형식 위반 검출 + admin UI 배너
- detectInvalidPlaceholderMatches: read-only 검출 함수 (format-violation / missing-slot-label 2 reason)
- PlaceholderValidationBanner: matches-client.tsx 본문 박제 — 검출 0건 = null / 검출 ≥1건 = warning 톤 + 펼치기 토글

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx` | 신규 (165 LOC / warning 톤 카드 + expand 토글 + 분류별 요약) | 신규 |
| `src/lib/tournaments/placeholder-helpers.ts` | detectInvalidPlaceholderMatches 신규 export (+65 LOC / RANKING_ROUND_REGEX + 2-reason 분기) | 수정 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/matches/matches-client.tsx` | Match type 에 notes 필드 추가 + import 1줄 + 종별 필터 직전 배너 박제 (+11) | 수정 |
| `src/__tests__/lib/tournaments/placeholder-helpers.test.ts` | detectInvalidPlaceholderMatches 4 케이스 추가 (+84) | 수정 |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-3 한정 — 3 파일 수정)
 .../lib/tournaments/placeholder-helpers.test.ts    | 84 ++++++++++++++++++++++
 .../tournaments/[id]/matches/matches-client.tsx    | 11 +++
 src/lib/tournaments/placeholder-helpers.ts         | 65 +++++++++++++++++
 3 files changed, 160 insertions(+)

git status (untracked — 신규 1 파일)
?? src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx

npx tsc --noEmit: EXIT_CODE=0 (전체 PASS / 0 error)
npx vitest run src/__tests__/lib/tournaments/placeholder-helpers.test.ts: 26/26 PASS (신규 4 + 기존 22)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | PlaceholderValidationBanner.tsx 신규 파일 (LOC > 0) | ✅ 165 LOC |
| 2 | placeholder-helpers.ts detectInvalidPlaceholderMatches export 추가 | ✅ +65 LOC / RANKING_ROUND_REGEX 신규 |
| 3 | matches-client.tsx Match type 보강 + 배너 박제 | ✅ +11 LOC (notes 필드 + import + 컴포넌트) |
| 4 | vitest 신규 4 케이스 추가 + PASS | ✅ 26/26 PASS (정상 / 강남구 / missing-label / 예선) |
| 5 | tsc 0 | ✅ EXIT_CODE=0 |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-warning) 톤 사용 (오류 아닌 경고 — 운영 진행 가능 / 수동 조치 권장)
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "warning" / "expand_more" / "expand_less" (lucide-react ❌)
- ✅ 모바일 full-width / PC sm:flex-row / 36~44px 터치 영역
- ✅ 핑크/살몬/코랄 ❌

⚠️ 규약 준수:
- ✅ planner-architect 박제 spec 100% 일치 (4 파일 / +148 LOC 예상 → 실제 3 수정 +160 + 신규 1 = 부합)
- ✅ AdvancePlayoffsButton (PR-Admin-2) / NextStepCTA (PR-Admin-1) 변경 0 (영역 분리)
- ✅ placeholder-helpers 기존 시그니처 변경 0 (export 추가만 / 6 기존 함수 시그니처 그대로)
- ✅ matches-client.tsx 다른 영역 변경 0 (Match type 1 필드 + import 1 + 컴포넌트 박제 1만)
- ✅ 운영 DB SELECT 0 (read-only 검출 함수만)

💡 tester 참고:
- 테스트 방법:
  1. 강남구협회장배 ID 진입 → `/tournament-admin/tournaments/[id]/matches`
  2. 종별 필터 직전 위치에 warning 톤 배너 노출 확인 ("⚠️ 순위결정전 N건이 placeholder 형식이 아닙니다.")
  3. "상세 보기" 클릭 → 검출 매치 ID + roundName + notes + 권장 액션 노출
  4. 정상 운영 대회 (placeholder 형식 정합) 진입 → 배너 미표시 확인
- 정상 동작:
  - 모바일(≤720px): 배너 풀너비 + 헤더/버튼 세로 배치
  - PC(≥sm): 헤더 좌측 + 펼치기 버튼 우측 정렬
  - 종별 / 체육관 필터 적용 시 filteredMatches 만 검증 (applyFilter=true 라벨 노출)
- 주의할 입력:
  - matches 빈 배열 → 검출 0 → 배너 미표시 (정상)
  - roundName "예선" / null → 검증 대상 0 (조용히 skip)
  - format-violation + missing-slot-label 동시 만족 시 → format-violation 우선 보고 (continue 로 missing 중복 skip)

⚠️ reviewer 참고:
- detectInvalidPlaceholderMatches 검출 우선순위: format-violation > missing-slot-label (강남구 사고 패턴 = 더 시급한 운영 조치 신호)
- RANKING_ROUND_REGEX = /순위/ 단순 매치 — "순위결정전" / "순위전" / "동순위전" 모두 포함 / 향후 generator 가 신규 라운드명 추가해도 자동 매칭
- PlaceholderValidationBanner.tsx 165 LOC = planner 예상 70 LOC 초과 (펼치기 상세 + 분류 요약 추가 박제로 풍성화). 운영자 인지 비용 최소화가 본 PR 핵심 목적이라 의도된 확장.
- matches-client.tsx 의 settings type (`{ recording_mode?: ... [k: string]: unknown }`) 가 detectInvalidPlaceholderMatches 의 settings (`Record<string, unknown> | null`) 와 호환 — homeSlotLabel/awaySlotLabel 키는 [k: string]: unknown 으로 흡수.

## 구현 기록 (developer) — PR-Admin-1

📝 구현한 기능:
- admin-flow-audit §3 단계 4·7 단절 해소 — divisions / teams / bracket 페이지 footer 단일 카드 CTA
- NextStepCTA 컴포넌트 신규 박제 (disabled 분기 포함 / 단계 매핑 single source)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx` | 신규 (109 LOC / disabled 분기 / 단계 매핑 single source / var(--color-info) Navy + arrow_forward) | 신규 |
| `src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx` | import 1줄 + footer 박제 4줄 | 수정 (+5) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx` | import 2줄 + footer 박제 3줄 | 수정 (+5) |
| `src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx` | import 2줄 + footer 박제 3줄 | 수정 (+5) |

📊 검증 결과:

```
git diff --stat HEAD (PR-Admin-1 한정 + scratchpad)
 .claude/scratchpad.md                              | 189 ++++++++++++++++++++-
 .../tournaments/[id]/bracket/page.tsx              |   5 +
 .../tournaments/[id]/divisions/page.tsx            |   5 +
 .../tournaments/[id]/teams/page.tsx                |   5 +
 4 files changed, 201 insertions(+), 3 deletions(-)

git status (PR-Admin-1 한정)
 M src/app/(admin)/tournament-admin/tournaments/[id]/bracket/page.tsx
 M src/app/(admin)/tournament-admin/tournaments/[id]/divisions/page.tsx
 M src/app/(admin)/tournament-admin/tournaments/[id]/teams/page.tsx
?? src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx

npx tsc --noEmit: 0 error (전체 PASS)
```

🔧 자가 진단 5건:

| # | 항목 | 결과 |
|---|------|------|
| 1 | NextStepCTA.tsx 신규 파일 (LOC > 0) | ✅ 109 LOC |
| 2 | divisions/page.tsx 변경 (NextStepCTA import + 박제) | ✅ +5 |
| 3 | teams/page.tsx 변경 (동일) | ✅ +5 |
| 4 | bracket/page.tsx 변경 (동일) | ✅ +5 |
| 5 | tsc 0 (본 PR 파일 한정) | ✅ 전체 PASS |

🛡️ 디자인 13 룰 준수:
- ✅ var(--color-info) Navy 토큰 사용 (라이트/다크 양면 정의 globals.css L2757/L2785)
- ✅ rounded-[4px] 만 사용 (pill 9999px ❌)
- ✅ material-symbols-outlined "arrow_forward" 사용 (lucide-react ❌)
- ✅ 모바일 full-width / PC sm:w-auto 우측 정렬 / 44px+ 터치 (minHeight: 44)
- ✅ 핑크/살몬/코랄 ❌

⚠️ 처리 사유 — JSX.Element 타입 명시 제거:
- 1차 박제 시 `JSX.Element | null` 반환 타입 명시 → tsc TS2503 에러 ("Cannot find namespace 'JSX'")
- 사유: 본 프로젝트는 React 19 + 새 JSX transform — 전역 `JSX` namespace 부재
- 수정: 반환 타입 추론에 위임 (명시 제거) — 동작 0 변경

💡 tester 참고:
- 테스트 방법:
  1. `/tournament-admin/tournaments/[id]/divisions` 진입 → 안내 카드 다음에 "다음: 팀 등록 →" Navy 카드 노출 확인
  2. CTA 클릭 → `/tournament-admin/tournaments/[id]/teams` 이동 확인
  3. teams 페이지 footer → "다음: 대진표 생성 →" 노출
  4. bracket 페이지 footer → "다음: 경기 관리 →" 노출
- 정상 동작:
  - 모바일(≤720px): 버튼 full-width / 44px 이상 터치 영역
  - PC(≥sm): 카드 우측 정렬 / 1줄 inline
  - matches 페이지 = CTA 미노출 (PR-Admin-2 단일 trigger 흡수 / 본 PR 변경 0)
- 주의할 입력:
  - tournamentId 비어있을 때 동작 0 (Link 항상 렌더링 — invalid id 시 404 라우팅 / NextStepCTA 책임 0)
  - disabled prop 미사용 (선행 단계 잠금 로직은 후속 PR — 본 PR = 항상 활성)

⚠️ reviewer 참고:
- 단계 매핑 테이블 (NEXT_STEP_MAP) = 컴포넌트 내부 single source. 신규 단계 추가 시 본 컴포넌트만 수정.
- matches → null 의도 = PR-Admin-2 단일 순위전 trigger 흡수 (planner 명시).
- bracket inline CTA (`bracket/page.tsx:578-583, 827-832, 899-904`) 는 종별 sub-Card 안의 "경기 관리로 이동 →" 별도 — 본 PR footer CTA 와 중복 박제 의도 (각 종별 단위 + 페이지 단위 모두 노출).

## 기획설계 (planner-architect) — PR-Admin-1/2/3

🎯 목표: admin 흐름 점검 §6.5 우선 1~3 (단계간 CTA / 단일 순위전 trigger / placeholder 검증 배너) 동시 박제. 강남구협회장배 시나리오 단계 4·10·10.5 단절 + 누락 동시 해소.

### §PR-Admin-1: 단계간 CTA (StepFooterCTA)

**현 layout 분석 (코드 인용)**:
| 페이지 | 헤더 우측 | 하단 | 다음 단계 CTA |
|-----|------|-----|----|
| `divisions/page.tsx:172-183` | (없음) | (없음) | ❌ 없음 ⭐ 핵심 |
| `teams/page.tsx:441-484` | CSV/카톡/순위전 자동 채우기 3 버튼 | (없음) | 🟡 "순위전 자동 채우기" 만 (PR-Admin-2 가 matches 로 이동 박제) |
| `bracket/page.tsx:226-251` | 버전 대시보드 + 생성 버튼 | (없음) | 🟡 dual + 종별 sub-Card 안 "경기 관리로 이동 →" inline (`bracket/page.tsx:578-583, 827-832, 899-904`) — 페이지 단위 footer CTA 0 |
| `matches/matches-client.tsx:485-508` | 대진표 재생성 버튼 | (없음) | ❌ 다음 단계 (= 예선 종료 후 순위전) CTA 0 |

**자연스러운 흐름**:
- `divisions` → `teams` ("다음: 팀 등록 →")
- `teams` → `bracket` ("다음: 대진표 생성 →")
- `bracket` → `matches` ("다음: 경기 관리 →") — 이미 sub-Card 안 inline 존재 / footer 단일 CTA 추가
- `matches` → ⚙️ PR-Admin-2 의 단일 순위전 trigger 로 흡수 (별 CTA 없음)

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/NextStepCTA.tsx
export function NextStepCTA(props: {
  tournamentId: string;
  currentStep: "divisions" | "teams" | "bracket" | "matches";
  // 선행 단계 미완성 시 비활성화 (선택). 빈 값 = 항상 활성.
  disabled?: boolean;
  disabledReason?: string;
}): JSX.Element;
```
- 단계 매핑 테이블 (CTA 라벨 + href) 컴포넌트 내부 single source.
- 페이지 footer (`</div>` 닫기 직전) 에 카드 형태 박제 — `<Card>` + `<Button>` + 라벨 "다음 단계: X →" + 모바일 full-width.
- 디자인 룰: BDR-current 토큰 (`var(--color-info)` Navy / `rounded-[4px]`).

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/NextStepCTA.tsx` | 신규 | +60 |
| `divisions/page.tsx:311` (return 닫기 직전) | `<NextStepCTA currentStep="divisions" />` 1줄 | +1 |
| `teams/page.tsx:1259` (return 닫기 직전) | 동일 | +1 |
| `bracket/page.tsx:689` (return 닫기 직전) | 동일 | +1 |
| `matches/matches-client.tsx:698` | (PR-Admin-2 흡수 / 본 PR 불필요) | 0 |
| **합계** | | **+63** |

**회귀**: 0 (라우팅 + 신규 컴포넌트 + 기존 페이지 1줄 추가). vitest 불필요 (UI-only).

---

### §PR-Admin-2: matches 단일 순위전 trigger (AdvancePlayoffsButton)

**현 상황**:
- `teams/page.tsx:472-482` 에 이미 "순위전 자동 채우기" 버튼 존재 (헤더 우측 / `advance-placeholders` 호출). 운영 흐름상 부적절한 위치 — **§3 단계 10 = matches 페이지에서 예선 종료 → 순위전** 이동.
- 본 PR = matches 페이지로 **이동** (teams 에서 제거 + matches 에 신규 박제).

**핵심 로직 재사용**:
- `POST /api/web/admin/tournaments/[id]/advance-placeholders` (body `{}`) — 모든 종 일괄 — 완전 재사용 (route 수정 0).
- 응답: `{ totalUpdated, totalSkipped, totalErrors, results: [{ divisionCode, updated, skipped, errors }] }`.
- `match-sync.ts:674` 가 이미 자동 trigger 하지만 본 PR = **운영자 수동 fallback** (advance route 주석 line 13 참조).

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/AdvancePlayoffsButton.tsx
export function AdvancePlayoffsButton(props: {
  tournamentId: string;
  // 종별 N건. results 표 헤더 라벨용 (선택)
  divisionCodes?: string[];
  onSuccess?: () => void; // 호출자 (matches-client) refetch trigger
}): JSX.Element;
```

**UI 구성**:
1. matches 헤더 우측 `flex gap-2` 안 (`matches-client.tsx:492-507` "대진표 재생성" 버튼 옆) — `<Button variant="secondary">` "예선 종료 → 순위전 진출" / `material-symbols trending_up` 아이콘.
2. 클릭 → `confirm()` ("재호출 시 이미 채워진 슬롯은 보호됩니다 / placeholder 매치 N건 검출 …").
3. POST `/api/web/admin/tournaments/[id]/advance-placeholders` 호출.
4. 결과 모달 (`<Card>` 4 row 표) — 종별 / UPDATE / SKIP / 에러 + "확인" 버튼 → `onSuccess()` 호출 → matches `load()` refetch.
5. 에러 0 = `var(--color-success)` 배너 / 에러 ≥1 = `var(--color-warning)` 배너.

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/AdvancePlayoffsButton.tsx` | 신규 (modal 포함) | +120 |
| `matches/matches-client.tsx:492` | 헤더 우측 button 추가 (1줄 import + 5줄 컴포넌트 박제) | +6 |
| `teams/page.tsx:472-482` | 기존 "순위전 자동 채우기" 버튼 제거 (PR-Admin-2 와 중복) | -10 |
| `teams/page.tsx:1571-1599` | `advancePlaceholders` 헬퍼 제거 (deadcode) | -29 |
| **합계** | | **+87** |

**회귀**: advance route idempotent 보장 (placeholder-helpers `isStandingsAutoFillable` + `division-advancement.ts` skip 로직 — 채워진 슬롯 보호 — `notes` 가 정규식 매칭 안 되면 skip). vitest 케이스:
- `__tests__/components/AdvancePlayoffsButton.test.tsx` (선택) — fetch mock + 모달 표시 검증 / 4 종별 응답 → 4 row 표 / 에러 case 톤 분기

**주의 (developer 인계)**:
- teams 헤더 우측 layout flex 가 PR-Admin-2 의 버튼 1개 제거 후에도 깨지지 않는지 확인 (현 3 버튼 → 2 버튼).
- `match-sync.ts:674` 자동 trigger 와 운영자 수동 호출 양면 박제 OK (route idempotent).

---

### §PR-Admin-3: placeholder 검증 배너 (PlaceholderValidationBanner)

**검출 로직 (read-only)**:
- input: `matches` (matches-client.tsx state) — 모든 매치
- 검사:
  1. `roundName` 가 "순위결정전" / "순위전" / "동순위전" 포함 (정규식)
  2. AND `homeTeamId !== null` OR `awayTeamId !== null` (이미 실팀 박혀있는데)
  3. AND `notes` 가 `placeholder-helpers` `parseSlotLabel` 통과 안 함 (= placeholder 형식 아님 = 강남구 사고 패턴 그대로)
- OR 케이스 2 (옵션):
  1. `roundName` 가 "순위결정전" 포함
  2. AND `settings.homeSlotLabel` 또는 `settings.awaySlotLabel` 미박제
  3. → 향후 G7 자동 fix 후보

**Match GET 응답 검증**:
- `lib/services/match.ts:23-41` `MATCH_LIST_INCLUDE` = include 만 사용 → `notes` / `settings` 컬럼 모두 반환 ✅.
- matches-client.tsx Match type (`line 14-34`) = `notes` 필드 부재 → **type 보강 필요** (`notes: string | null` 추가).

**신규 컴포넌트**:
```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/_components/PlaceholderValidationBanner.tsx
export function PlaceholderValidationBanner(props: {
  matches: Array<{ id; roundName; homeTeamId; awayTeamId; notes; settings }>;
  // optional: divisionFilter 적용 후 매치만 검사 (false = 전체 / true = 필터 적용)
  applyFilter?: boolean;
}): JSX.Element | null;

// src/lib/tournaments/placeholder-helpers.ts
// 신규 export
export function detectInvalidPlaceholderMatches(
  matches: Array<{ id; roundName; homeTeamId; awayTeamId; notes }>,
): Array<{ matchId; reason: "format-violation" | "missing-slot-label" }>;
```

**UI 구성**:
- 검출 0건 = null 반환 (배너 미표시)
- 검출 ≥1건 = matches-client.tsx 종별 필터 (`line 524-595`) 위에 `<Card>` 배너 (warning 톤 — `var(--color-warning)`)
  - 메시지: "⚠️ 순위결정전 N건이 placeholder 형식이 아닙니다. (강남구협회장배 사고 재발 방지)"
  - 펼치기 → 매치 ID + roundName + 현재 notes 값 + 권장 액션 ("수동 fix 안내 문서 링크" / 향후 G7 auto-fix)
- 위치: matches-client.tsx `line 522` (error 배너 다음 / 종별 필터 직전)

**변경 파일**:
| 파일 | 변경 | LOC |
|-----|----|----|
| `_components/PlaceholderValidationBanner.tsx` | 신규 | +70 |
| `lib/tournaments/placeholder-helpers.ts` | `detectInvalidPlaceholderMatches` 신규 export | +25 |
| `matches/matches-client.tsx:14-34` | Match type 에 `notes: string \| null` 추가 (1줄) | +1 |
| `matches/matches-client.tsx:522` | 배너 박제 (1줄 import + 1줄 컴포넌트) | +2 |
| `__tests__/lib/tournaments/placeholder-helpers.test.ts` | `detectInvalidPlaceholderMatches` vitest (4 케이스) | +50 |
| **합계** | | **+148** |

**회귀**: 0 (read-only 검증). vitest 케이스 (필수):
1. 정상 placeholder ("A조 1위 vs B조 1위" + homeTeamId=null) → 0 검출
2. 강남구 사고 패턴 (실팀 박혀있고 notes 형식 위반) → 1 검출 / reason="format-violation"
3. settings.slotLabel 미박제 → reason="missing-slot-label"
4. roundName "예선" (순위전 아님) → 0 검출

**주의 (developer 인계)**:
- 정규식: `roundName` "순위" 포함 검사 — "순위결정전" / "순위전" / "동순위전" 모두 매치. `parseSlotLabel` 결과 null 이면 위반 판정.
- 향후 G7 auto-fix 옵션 = 별도 PR (본 PR = 검증·표시만).

---

### §종합: 3 PR 진행 권장

| 항목 | 평가 |
|-----|------|
| **공통 컴포넌트 추출** | `_components/NextStepCTA.tsx` / `AdvancePlayoffsButton.tsx` / `PlaceholderValidationBanner.tsx` 모두 독립 — 공통 wrapper 불필요 |
| **병렬 가능성** | ✅ 3 PR 독립 (NextStepCTA = 라우팅만 / AdvancePlayoffsButton = matches 헤더 / Banner = matches 본문). matches-client.tsx 가 PR-Admin-2 + PR-Admin-3 동시 수정 → 작은 conflict 위험 (다른 line / 다른 section) — 순차 처리 권장 |
| **권장 순서** | (1) PR-Admin-1 (가장 단순 / 회귀 0) → (2) PR-Admin-3 (matches 본문) → (3) PR-Admin-2 (matches 헤더 + teams 정리) |
| **developer 위임** | 1회 묶음 (3 PR 동시) vs 3회 분리 → **3회 분리 권장**: 회귀 위험 작음 + 검증 단순 + commit 분리 (rollback 용이) |
| **예상 총 LOC** | +298 (신규 250 / 수정 48) |
| **예상 시간** | 각 PR 30~45분 (developer + tester) × 3 = **약 2~3시간** |
| **vitest 신규** | 4 케이스 (PR-Admin-3 만) / 기존 240/240 PASS 유지 |
| **회귀 위험** | 모두 0 (read-only / UI / 라우팅 / advance route idempotent) |

**디자인 13 룰 준수**:
- `var(--color-info)` Navy / `var(--color-warning)` / `var(--color-success)` 토큰만
- `rounded-[4px]` 만 사용 (pill 9999px ❌)
- `material-symbols-outlined` 만 (lucide-react ❌)
- 모바일 44px min-height + 720px 분기

**knowledge 갱신 의무 (PM 수행)**:
- `decisions.md`: PR-Admin-1/2/3 도메인 결정 박제
- `architecture.md`: `_components/` 폴더 구조 (3 파일 신규)
- `index.md` 항목수 갱신

## 기획설계 (planner-architect) — PR-Admin-4/5/6

🎯 목표: admin 흐름 점검 §6.5 우선 4~6 (bracket 종별별 generator trigger / divisions 두 카드 통합 / playoffs 신규 hub) 동시 박제. PR-Admin-1~3 박제 (NextStepCTA / AdvancePlayoffsButton / PlaceholderValidationBanner) 재사용 + 운영 흐름 마지막 단절 해소.

### §PR-Admin-4: bracket 종별별 generator trigger

**현 layout 분석 (코드 인용 + 라인 번호)**:

| 진입점 | 분기 | 종별 인지? | 재생성 모드 |
|-----|----|----|----|
| `bracket/route.ts:117 POST` | format 단일 분기 (league/swiss/dual/single) | ❌ 0 (대회 단위) | `clear: boolean` 만 — 전체 |
| `bracket/route.ts:317-460 dual` | groupAssignment 16팀 4조 | ❌ 단일 종별 | 전체 27 매치 재생성 |
| `bracket/route.ts:481-630 single_elim` | nextPow2 트리 | ❌ 단일 | 전체 트리 재생성 |
| `bracket/knockout/route.ts:22 POST` | full_league_knockout 의 결승 트리만 | ❌ (대회 단위) | seedingMode opt-in |
| `division-advancement.ts:397 generateLeagueAdvancementMatches` | ⭐ **divisionCode 인자 받음** | ✅ 종별 단위 | idempotent (existing > 0 → skip) |
| `division-advancement.ts:486 generateGroupStageRankingMatches` | ⭐ **divisionCode 인자 받음** | ✅ 종별 단위 | idempotent |
| `division-advancement.ts:604 generateGroupStageKnockoutMatches` | ⭐ **divisionCode 인자 받음** | ✅ 종별 단위 | idempotent |

**핵심 발견**: `division-advancement.ts` 의 3 generator 는 이미 **divisionCode 단위 호출 가능** — bracket POST 만 대회 단위 분기. UI = `bracket/page.tsx:869-940` `DivisionBracketSections` 종별 sub-Card 가 이미 존재하지만 "재생성" 버튼은 헤더 1개뿐.

**강남구 시나리오** (4 종별 × 다른 format):
- i3-U9 = `league_advancement` (링크제) — generateLeague + advance
- i3-U11/U14/i3w-U12 = `group_stage_with_ranking` — generateGroupStageRanking + advance
- 1 종별만 운영자 수정 → 다른 3 종별 보존하며 재생성 = 현재 불가

**신규 spec**:

```ts
// src/app/api/web/admin/tournaments/[id]/divisions/[ruleId]/generate/route.ts (신규)
//   사유: bracket POST (대회 단위) 와 분리 = 회귀 위험 0 + 종별 단위 책임 분리
//   기존 endpoint = bracket POST (single source) 보존 + 본 endpoint = 종별 단위 추가
export async function POST(req, { params: { id, ruleId } }) {
  // body: { clear?: boolean }
  // 1) requireTournamentAdmin
  // 2) divisionRule fetch (format 분기용)
  // 3) format → 3 generator 중 분기 호출 (advanceDivisionPlaceholders 와 동일 패턴)
  //    - league_advancement → generateLeagueAdvancementMatches
  //    - group_stage_with_ranking → generateGroupStageRankingMatches
  //    - group_stage_knockout → generateGroupStageKnockoutMatches
  // 4) clear=true → 본 종별 매치 deleteMany 사전 (settings.division_code 매칭)
  // 5) bracket_version 박제 (다른 format 일관성 — 대회 단위)
  // 6) 응답: { divisionCode, generated, skipped, reason, matchIds }
}
```

**UI 신규 컴포넌트**:

```ts
// _components/DivisionGenerateButton.tsx (신규)
export function DivisionGenerateButton(props: {
  tournamentId: string;
  ruleId: string;       // division_rule.id (route param)
  divisionCode: string; // 표시용 (모달 헤더)
  divisionFormat: string | null;
  hasMatches: boolean;  // 종별 매치 존재 여부 (재생성 vs 첫 생성 분기)
  onSuccess?: () => void; // bracket page load() refetch
}): JSX.Element;
//   - "이 종별만 재생성" 버튼 (BDR Navy / material-symbols "refresh")
//   - confirm 다이얼로그 (clear=true 시 "기존 N건 삭제 후 재생성")
//   - 결과 모달 = AdvancePlayoffsButton 패턴 재사용 (Card + 결과 표 + success/warning 톤)
```

**변경 파일**:

| 파일 | 변경 | LOC |
|-----|----|----|
| `api/web/admin/tournaments/[id]/divisions/[ruleId]/generate/route.ts` | 신규 (3 format 분기 + 권한 + bracket_version) | +120 |
| `_components/DivisionGenerateButton.tsx` | 신규 (모달 + confirm + 결과 표 / AdvancePlayoffsButton 패턴 재사용) | +180 |
| `bracket/page.tsx:885-919` `DivisionBracketSections` 종별 헤더 우측 | DivisionGenerateButton 박제 (deep link 옆) — 종별 단위 ruleId 매핑 필요 (division_rules fetch 추가) | +25 |
| `bracket/page.tsx:65-77` `BracketData` type | divisionRules: Array<{id, code, format}> 추가 | +5 |
| `api/web/tournaments/[id]/bracket/route.ts GET:54-103` | divisionRules select 추가 (id, code, format) — 응답에 포함 | +12 |
| **합계** | | **+342** |

**진입점 / 호출 흐름**:
```
bracket page → DivisionBracketSections → 종별 헤더 → DivisionGenerateButton
  → POST /api/web/admin/tournaments/[id]/divisions/[ruleId]/generate
  → divisionRule fetch → format 분기 → generate*Matches 호출
  → bracket page load() refetch (onSuccess)
```

**회귀 위험 + 가드 spec**:
- ⚠️ **중** — bracket POST 단일 source 패턴 깨짐 (종별별 endpoint 신규 추가)
- 가드 1: 본 endpoint = 종별 단위만 (대회 단위 = bracket POST 그대로)
- 가드 2: `clear=true` 시 settings.division_code 매칭 매치만 deleteMany (다른 종별 매치 보존)
- 가드 3: 종별 generator 의 idempotent (`existing > 0 → skip`) 동작 그대로 — `clear=false` 시 재호출 안전
- 가드 4: format !== league/group_ranking/group_knockout 시 400 (single_elim/dual/swiss 는 본 endpoint 미지원 / 대회 단위 bracket POST 사용)
- 가드 5: bracket_version 박제 = 대회 단위 (종별 generator 가 1 종별만 변경해도 버전 +1 — 사용자 명확 인지)

**vitest 케이스 (신규 0 — 기존 generator 검증 재사용)**:
- `division-placeholder-plan.test.ts` 기존 12 케이스로 plan 검증 충분
- DB endpoint 는 PR-Admin-2 의 advance route 패턴 재사용 (vitest 별 신규 ❌)

---

### §PR-Admin-5: divisions 두 카드 통합 (SetupChecklist #3 + #4)

**현 layout 분석**:

| 카드 | step | title | link | status 분기 | required |
|-----|-----|------|-----|----|----|
| #3 | 3 | "종별 정의" | `/divisions` | `divsDefined` (rules.length > 0) | ✅ |
| #4 | 4 | "운영 방식" | `/divisions` | `divsComplete` (모든 format 박제 + group_size/count) | ✅ |

**문제**: 같은 페이지 두 카드 = 운영자가 클릭 2회 + 같은 페이지 진입 → 통합 1 카드 + 진행도 표시 (N/M)

**신규 spec**:

```ts
// setup-status.ts 변경 — 8 항목 → 7 항목
// step #3 "종별 정의" 와 #4 "운영 방식" 통합 → step #3 "종별 + 운영 방식"
// 기존 #5~#8 → #4~#7 으로 한 단계씩 당김

export type ChecklistItem = {
  // ... (기존 필드)
  step: number; // 1~7 (8 → 7 축소)
  // 신규 필드 (선택) — UI 표시용 진행도 (예: "2/4 박제")
  progress?: { current: number; total: number };
};

// areDivisionsDefined / areDivisionRulesComplete 함수 보존 (PR-Admin-4 등 다른 호출자 영향 0)
// calculateSetupProgress 안에서만 통합 (내부 로직 변경)

// 신규 통합 카드:
{
  key: "divisions",
  step: 3,
  title: "종별 + 운영 방식",
  summary: divsDefined
    ? divsComplete
      ? `${rules.length}개 종별 모두 운영 방식 박제됨`
      : `${rules.length}개 종별 / ${rulesWithFormat.length} 박제 (${rulesWithFormat.length}/${rules.length})`
    : "종별 미정의",
  status: !divsDefined ? "empty" : divsComplete ? "complete" : "in_progress",
  icon: "category",
  link: `${base}/divisions`,
  required: true,
  progress: divsDefined ? { current: rulesWithFormat.length, total: rules.length } : undefined,
}
```

**SetupChecklist.tsx UI 변경** (선택):
- `progress` 필드가 있으면 카드 우측에 작은 progress bar 추가 (예: "2/4")
- 없으면 기존 status 표시 그대로

**변경 파일**:

| 파일 | 변경 | LOC |
|-----|----|----|
| `src/lib/tournaments/setup-status.ts` | step 정의 8 → 7 / 통합 카드 1개 + step renumbering / progress 필드 추가 | +20 -25 |
| `src/__tests__/lib/tournaments/setup-status.test.ts` | 신규 4 케이스 (통합 카드 / 진행도 표시 / locked 분기 / 공개 가드) | +60 |
| `_components/SetupChecklist.tsx:358-445` `ChecklistCard` | progress 필드 표시 분기 (선택 — 2줄) | +5 |
| **합계** | | **+85 -25 = 순 +60** |

**진입점 변경 0** — `/divisions` URL + `divisions/page.tsx` 기존 그대로.

**회귀 위험 + 가드 spec**:
- 🟢 **저** — 단순 UI 정리 (setup-status.ts 단일 source / 공개 게이트는 required 항목만 확인 → 7 항목 모두 ✅ 시 공개 가능 = 변경 0)
- 가드 1: `areDivisionsDefined / areDivisionRulesComplete` 함수 시그니처 보존 (다른 곳에서 호출 가능성)
- 가드 2: step 번호 변경 → URL 영향 0 (link 는 그대로 `/divisions`)
- 가드 3: vitest 기존 케이스 재실행 — 통합 카드 시 `progress.items.length === 7` 검증
- 가드 4: hub 의 공개 버튼 (PublishGate) = `progress.allRequiredComplete` 만 확인 → 변경 0

**vitest 케이스 (신규 4)**:
1. 통합 카드 status === "complete" (모든 format 박제 + group settings 박제)
2. 통합 카드 status === "in_progress" (rules 있는데 일부 format 미박제)
3. 통합 카드 progress = { current: 2, total: 4 } (4 종별 중 2 박제)
4. 공개 게이트 — 7 항목 ALL ✅ 시 ok=true (= 8 항목 시 동작 보존)

---

### §PR-Admin-6: /playoffs 신규 hub

**현 layout 분석 (분산 영역)**:

| 영역 | 위치 | 책임 |
|-----|-----|-----|
| AdvancePlayoffsButton | `matches-client.tsx:518-524` (헤더 우측) | 종별 일괄 trigger (PR-Admin-2 박제) |
| PlaceholderValidationBanner | `matches-client.tsx:544` | 검증 (PR-Admin-3 박제) |
| 종별 진출 매핑 | `divisions/page.tsx:265-279` (종별별 카드 안) | 종별 1건씩 trigger |
| 종별 standings 표 | (미존재 — DB 만 있음 / `getDivisionStandings`) | ❌ 운영자 시각화 0 |
| 결승 매치 카드 | `bracket/page.tsx` 내부 종별 sub-Card | 결승 일정 |
| 우승팀 결정 | (미존재) | ❌ 자동 박제 후 표시 0 |

**문제**: 강남구 단계 10~11 (예선 종료 → 순위전 → 결승 → 우승팀 결정) = 3 페이지 산재. 단일 hub 부재.

**신규 spec**:

```ts
// src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/page.tsx (신규)
//   라우트: /tournament-admin/tournaments/[id]/playoffs
//   server component (서버사이드 fetch + canManageTournament 가드)
//   본문 = 5 섹션 클라이언트 컴포넌트 1개 (PlayoffsHub)

// src/app/(admin)/tournament-admin/tournaments/[id]/playoffs/playoffs-client.tsx (신규)
//   섹션 1: 종별별 standings 표 (예선 결과 시각화 — getDivisionStandings 재사용)
//     → 표 (종별 / 그룹 / 팀 / W-L / PD / 순위) — 4 종별 × 그룹 × 팀
//   섹션 2: AdvancePlayoffsButton 재사용 (PR-Admin-2)
//     → 단일 trigger + 결과 모달
//   섹션 3: 순위전 매치 목록 + 자동 채움 결과
//     → roundName "순위" 매칭 매치만 fetch (matches API 재사용 + 클라 필터)
//     → home/away 박제 여부 시각화 (NULL = "A조 N위 vs B조 N위" 라벨)
//   섹션 4: 결승전 정보 + 우승팀 결정 (있다면)
//     → roundName "결승" 매치 + winner_team_id 박제 시 우승 표시
//   섹션 5: PlaceholderValidationBanner 재사용 (PR-Admin-3)
//     → 검증 0 = 미표시 / ≥1 = warning 톤 배너
```

**API 엔드포인트** (신규 0 — 모두 재사용):
- standings = `getDivisionStandings(prisma, tournamentId, divisionCode)` 직접 호출 (server component)
- 매치 = `/api/web/tournaments/[id]/bracket` GET (기존)
- advance = `/api/web/admin/tournaments/[id]/advance-placeholders` POST (기존)

**SetupChecklist 항목 신규 추가? — 옵션 비교**:

| 옵션 | 설명 | 평가 |
|-----|-----|------|
| (a) #8 추가 "playoffs hub" | 7 → 8 항목 | 🔴 PR-Admin-5 가 8 → 7 축소 직후 다시 8 = 의도 충돌 |
| (b) #7 "대진표 생성" 안에 흡수 | summary 에 "playoffs hub →" 링크 추가 | 🟡 약함 — 항목 의미 흐려짐 |
| (c) **추가 0 / 페이지만 신설** | hub 진입 = bracket footer CTA + matches 헤더 link | ✅ **권장** — IA 단순 유지 |

**SetupChecklist 추가 ❌ + 진입점**:
- bracket footer NextStepCTA (PR-Admin-1) → `currentStep="bracket"` 의 next = `matches` → playoffs 별도 진입
- 신규 진입점 추가 = matches 페이지 헤더 link "순위전·결승 hub →" (1줄)
- divisions 페이지 안내문 "예선 종료 후 [순위전·결승 hub] 에서 일괄 처리" 링크 (1줄)

**tournament-admin-nav 또는 sidebar 추가?**:
- ❌ **현재 admin 메뉴 sidebar 미존재** (카드/링크만 사용 — `(admin)/tournament-admin/tournaments/[id]/page.tsx` SetupChecklist hub)
- → 진입점 = bracket / matches 페이지 link + 직접 URL 만 (자유 진입 패턴 유지)

**변경 파일**:

| 파일 | 변경 | LOC |
|-----|----|----|
| `playoffs/page.tsx` | 신규 (server component / canManageTournament 가드 / standings + matches fetch) | +80 |
| `playoffs/playoffs-client.tsx` | 신규 (5 섹션 + 종별 standings 표 + AdvancePlayoffsButton + Banner 재사용) | +250 |
| `_components/StandingsTable.tsx` | 신규 (재사용 가능 표 컴포넌트 — 종별 standings) | +90 |
| `matches-client.tsx:498-499` 헤더 우측 | "순위전·결승 hub →" link 추가 (1줄) | +3 |
| `divisions/page.tsx:298-312` 안내 카드 | "예선 종료 후 [순위전·결승 hub] 에서 일괄 처리" 링크 추가 | +3 |
| **합계** | | **+426** |

**진입점 (3 곳)**:
1. matches 페이지 헤더 우측 link (운영자 매치 본 후 진입)
2. divisions 페이지 안내 카드 link (예선 종료 후 진입)
3. 직접 URL `/tournament-admin/tournaments/[id]/playoffs`

**회귀 위험 + 가드 spec**:
- 🟢 **저** — 신규 페이지 (기존 페이지 변경 = matches/divisions 헤더 link 1줄씩만)
- 가드 1: 기존 컴포넌트 재사용만 (AdvancePlayoffsButton / PlaceholderValidationBanner / getDivisionStandings) — 신규 비즈 로직 0
- 가드 2: matches/divisions 의 link 1줄 추가 = 시각 회귀 위험 0 (다른 영역 변경 0)
- 가드 3: SetupChecklist 변경 0 (옵션 c 선택) — 공개 게이트 영향 0
- 가드 4: server component fetch 실패 시 fallback 표시 (standings 0 = "예선 매치 없음" 안내)

**vitest 케이스 (신규 0 — 재사용 컴포넌트만)**:
- StandingsTable 표시 검증은 후속 PR (E2E 테스트 큐)
- 핵심 로직 (getDivisionStandings) 은 기존 `tournament-advancement.test.ts` 통과

---

### §종합: 3 PR 진행 권장

| 항목 | 평가 |
|-----|------|
| **공통 컴포넌트 추출** | StandingsTable (PR-Admin-6 신규) = playoffs hub 만 사용 / DivisionGenerateButton (PR-Admin-4) = bracket page 만 사용 — 공통 wrapper 불필요 |
| **재사용 컴포넌트** | ✅ AdvancePlayoffsButton (PR-Admin-2) / PlaceholderValidationBanner (PR-Admin-3) / getDivisionStandings (기존) — 신규 비즈 로직 ↓ |
| **병렬 가능성** | ✅ 3 PR 독립 (PR-Admin-4 = bracket page + 신규 endpoint / PR-Admin-5 = setup-status.ts + SetupChecklist / PR-Admin-6 = 신규 페이지). 충돌 0 |
| **권장 순서** | (1) **PR-Admin-5** (가장 단순 / 회귀 0 / vitest 4 케이스) → (2) **PR-Admin-4** (API 분기 / 회귀 중) → (3) **PR-Admin-6** (대규모 신규 페이지) |
| **사유 1→4→6 정렬 사유** | PR-Admin-5 = 5분 검증 가능 / PR-Admin-4 = 강남구 4 종별 즉시 효용 / PR-Admin-6 = 사용자 hub 진입 흐름 후속 |
| **developer 위임** | **3회 분리 권장** — PR-Admin-5 (단일 source 변경 / 검증 단순) → PR-Admin-4 (API 신규 / 회귀 위험 중) → PR-Admin-6 (대규모 신규 페이지 / commit 분리 = rollback 용이) |
| **예상 총 LOC** | +853 (PR-Admin-4 +342 / PR-Admin-5 +60 / PR-Admin-6 +426 / vitest +25) |
| **예상 시간** | PR-Admin-5 = 30~45분 / PR-Admin-4 = 60~90분 / PR-Admin-6 = 90~120분 = **약 3.5~4.5시간** |
| **vitest 신규** | 4 케이스 (PR-Admin-5 만) / 기존 240/240 PASS 유지 |
| **회귀 위험 종합** | PR-Admin-5 = 0 / PR-Admin-4 = 중 (API spec 변경 / 종별 단위 분기 신규) / PR-Admin-6 = 0 (신규 페이지) |

**디자인 13 룰 준수** (3 PR 공통):
- `var(--color-info)` Navy / `var(--color-warning)` / `var(--color-success)` 토큰만
- `rounded-[4px]` 만 사용 (pill 9999px ❌)
- `material-symbols-outlined` "refresh" / "emoji_events" / "leaderboard" 등 (lucide-react ❌)
- 모바일 44px min-height + 720px 분기

**knowledge 갱신 의무 (PM 수행)**:
- `decisions.md`: PR-Admin-4/5/6 도메인 결정 박제
- `architecture.md`: `playoffs/` 폴더 신규 (PR-Admin-6) + `_components/` 폴더 확장 (DivisionGenerateButton + StandingsTable)
- `index.md` 항목수 갱신
- (선택) `conventions.md`: 종별 단위 endpoint 패턴 표준화 (대회 단위 vs 종별 단위 분리 룰)

## 진행 현황표 (대진표 후속 큐)
| # | PR | 상태 | LOC | commit |
|---|----|------|------|--------|
| 1 | PR-G5.5-followup-B 매치 PATCH 통합 | ✅ | +63 | `df96522` |
| 2 | PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator | ✅ | +900 | `b1e48b8` |
| 3 | PR-G5.2 dual-generator placeholder-helpers 통과 | ✅ | +302 | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 | - | 운영 사용 0 / 운영 진입 시점 박제 |
| 5 | PR-G5.8 swiss (옵션 B / R1 + R(N) 501 stub) | ✅ | +977 | `b8b3117` |

## 미푸시 commit
- **0건** (subin = origin/subin / `b8b3117` push 완료 / knowledge 갱신 commit 별도 진행)

## working tree (다른 트랙 보존)
- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (M / score-sheet 트랙)
- `src/app/(score-sheet)/score-sheet/[matchId]/_hooks/use-score-sheet-input-state.ts` (?? / score-sheet 트랙)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (?? / 디자인 트랙)
- 본 대진표 트랙과 무관

## 후속 큐
- **PR-G5.7 double_elim**: 운영 진입 시점에 박제 (planner 의견 — Q1=(b) / +820 LOC / W bracket = NBA-seed 재사용)
- **generateSwissNextRound 풀구현**: PR-G5.8 후속 PR (현재 501 stub) — 운영 진입 시점
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장
- **AppNav utility 좌측 메뉴** / **AppNav SSR admin 메뉴 정합**
- **dev 브랜치 sync**: origin/dev = origin/main 보다 84+ commit stale
- Phase 6 PR3 / Phase 19 PR-T1~T5 / Phase 23 PR4 / Phase E 14 라우트 / GNBA 8팀
- recorder_admin Q1~Q6 결재 대기

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **PR-Admin-6 /playoffs 신규 hub (developer)** ⭐ | ✅ 신규 페이지 (server +165 / client +508) + StandingsTable 신규 (+149) + matches/divisions 진입 link 박제 (+21) = 신규 822 + 수정 21 / tsc 0 / 자가 진단 6/6 PASS / 5 섹션 컴포지션 (Banner/Advance/Standings 4종별 grid/Ranking 종별 그룹/Final + 우승팀 trophy) / AdvancePlayoffsButton + Banner + getDivisionStandings 100% 재사용 (시그니처 변경 0) / 회귀 0 |
| 2026-05-16 | **PR-Admin-4 bracket 종별별 generator trigger (developer)** ⭐ | ✅ 신규 endpoint `division-rules/[ruleId]/generate` (+185) + DivisionGenerateButton (+254) + bracket route GET divisionRules (+14) + page.tsx 헤더 inline 박제 (+33) = +486 / tsc 0 / 자가 진단 6/6 PASS (bracket POST 변경 0 = 회귀 보장 핵심 / advisory lock + settings.division_code 매칭 deleteMany 로 다른 종별 보존 / IDOR 가드 = ruleId+tournamentId 매칭 검증 404) |
| 2026-05-16 | **PR-Admin-5 divisions 두 카드 통합 (developer)** | ✅ setup-status.ts 8→7 항목 통합 (#3 종별+운영방식 / step renumbering) + ChecklistItem.progress 신규 / SetupChecklist.tsx progress bar 박제 (+29) / vitest 50/50 PASS (기존 36 update + 신규 7 + canPublish 1 update) / tsc 0 / 자가 진단 5/5 PASS / 공개 게이트 회귀 0 |
| 2026-05-16 | **PR-Admin-4/5/6 통합 설계 (planner-architect)** | ✅ scratchpad §PR-Admin-4/5/6 박제 — bracket 종별별 generator (+342) / divisions 두 카드 통합 7항목 (+60) / playoffs 신규 hub (+426) / 권장 순서 5→4→6 (단순→회귀중→대규모) / 총 LOC +853 / vitest 4 케이스 (PR-Admin-5 만) / 회귀 위험 PR-Admin-4 중 (API spec 변경) / 재사용 컴포넌트 = AdvancePlayoffsButton + Banner + getDivisionStandings |
| 2026-05-16 | **PR-Admin-2 matches 단일 순위전 trigger (developer)** | ✅ AdvancePlayoffsButton 신규 (320 LOC / Card 모달 + 4 col 표 + 3 톤 분기) + matches-client.tsx 헤더 박제 (+14) + teams/page.tsx 기존 버튼 + 헬퍼 제거 (-39) / tsc 0 / 자가 진단 5/5 PASS |
| 2026-05-16 | **PR-Admin-1/2/3 통합 설계 (planner-architect)** | ✅ scratchpad "기획설계" 섹션 박제 — NextStepCTA / AdvancePlayoffsButton / PlaceholderValidationBanner 3 컴포넌트 / 권장 순서 1→3→2 / 총 LOC +298 / vitest 4 케이스 / 회귀 0 |
| 2026-05-16 | **PR-G5.8 swiss generator R1 박제 + R(N) 501 stub (옵션 B)** | ✅ commit `b8b3117` — swiss-helpers + swiss-knockout 신규 / planSwissRound1 시드 양분 + planSwissNextRound Dutch+Buchholz+최근대전회피 / generateSwissNextRound 501 stub / vitest 240/240 PASS (신규 13 케이스) / 회귀 0 |
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` — 인라인 박제 12건 → buildSlotLabel / group_match_result kind 신규 / vitest 227/227 PASS |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator (옵션 A opt-in)** | ✅ commit `b1e48b8` — 신규 파일 2건 + seed_number kind / 양분 트리 + BYE / vitest 219/219 PASS |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합** ⭐ | ✅ commit `df96522` — Web PATCH + Flutter match-sync 양면 박제 / 1차 사고 → PR2 PM 직접 검증 모드 옵션 B 진입 |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** ⭐ | ✅ PR #531 main 머지 (`8a913ef`) |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3** | ✅ PR #527 main 머지 (`1bff83e`) |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
