# 작업 스크래치패드

## 현재 작업
- **요청**: 토너먼트 경기 종료 시 score sync 누락 버그 — 옵션 C 근본 해결
- **상태**: Phase B + Phase A + **Phase C 완료** — Phase D 결재 대기
- **모드**: no-stop

## 진행 현황표 (옵션 C 6 Phase)
| Phase | 범위 | 상태 |
|------|------|------|
| §B | live API fallback 3단 (playerStats + PBP) | ✅ 9793b7f |
| §A | PBP/playerStats source backfill 10건 UPDATE | ✅ DB 영구 박제 (audit) |
| §C | status route safety net (Flutter 영향 0) | ✅ PM 커밋 대기 |
| §D | recompute admin endpoint + UI | ⏳ |
| §E | 모니터링 cron | ⏳ |
| §F | Flutter 협의 (`/batch-sync` deprecate) | ⏳ |

## 진단 결과 박제 (매치 #132 실측)
| 저장소 | Phase A 전 | Phase A 후 |
|--------|----------|---------|
| PBP (play_by_plays) | ✅ 263행 / made 36 / 합 39:26 | (변경 0) |
| tournamentMatch.homeScore/awayScore | ⚠️ 0/0 | ✅ 39/26 |
| tournamentMatch.quarterScores JSON | ⚠️ `{current_quarter:1}` | ✅ Q1:15-10 Q2:6-6 Q3:5-2 Q4:13-8 |
| match_player_stats | ⚠️ 26행 모두 pts=0 (잔존) | (Phase A 미박제 — 별도) |
| winner_team_id | ✅ 245 (피벗) | (변경 0) |
| route.ts L1131 fallback | ❌ 2단까지 | ✅ 3단 (PBP까지) |

## Phase A apply 결과 (10/10 매치 UPDATE 성공)

| source | 매치 수 | 대표 |
|--------|--------|------|
| **playerStats** (Phase B 2단) | 9 | 열혈농구단 #98~#104, #120, #121 |
| **PBP** (Phase B 3단 신규) | 1 | 몰텐배 #132 (피벗 vs SYBC 39:26) |

- TEST 2건 (#95 #96) 제외 (의도)
- winner 신규 부여: 5건 / 동일 유지: 5건
- audit: 10건 `source=system / context=backfill-pbp-2026-05-11` 박제
- 사후 검증: 10/10 SELECT 일치

## Phase B 구현 요약 (커밋 9793b7f)

| 파일 | LOC | 핵심 |
|------|-----|------|
| `src/lib/tournaments/score-from-pbp.ts` | +92 | `computeScoreFromPbp()` 순수 함수 (Phase A/C/D 단일 source) |
| `src/__tests__/lib/tournaments/score-from-pbp.test.ts` | +173 | 8 케이스 (매치 #132 실측 포함) |
| `src/app/api/live/[id]/route.ts` | +20/-4 | 3단 fallback (homeScore>0 → playerStats>0 → PBP) |

- tsc 0 / vitest 320/320 PASS / 회귀 0

## 구현 기록 (developer) — admin 디자인 13 룰 fix

📝 구현 범위: Critical 11건 (빨강 본문 → accent/text-primary/success) + Major 4건 (hardcode → 상수화 + 팔레트 이름 fix) + conventions.md 박제

### 변경 파일 (13건)

| # | 파일 | 변경 | 신규/수정 |
|---|------|------|----------|
| 1 | `src/lib/constants/colors.ts` | BDR_PRIMARY_HEX / BDR_SECONDARY_HEX 신규 | 신규 |
| 2 | `src/app/(admin)/admin/analytics/page.tsx` (L163) | 월별 차트 숫자 primary → accent | 수정 |
| 3 | `src/app/(admin)/tournament-admin/_components/tournament-admin-nav.tsx` (L22, L29) | 헤더 타이틀 → text-primary / 활성 탭 → accent | 수정 |
| 4 | `src/app/(admin)/tournament-admin/series/[id]/page.tsx` (L82) | 다음 회차 통계 → accent | 수정 |
| 5 | `src/app/(admin)/tournament-admin/tournaments/[id]/page.tsx` (L142, L165) | D-Day 뱃지 → accent / 빠른 통계 4건 → accent | 수정 |
| 6 | `src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx` (L485, L518, L532) | 승인팀 → text-primary font-semibold / 승자 팀명 홈+원정 → success font-bold | 수정 |
| 7 | `src/app/(admin)/tournament-admin/tournaments/page.tsx` (L65) | 새 대회 만들기 링크 → accent | 수정 |
| 8 | `src/app/(admin)/tournament-admin/organizations/[orgId]/members/page.tsx` (L227) | hover 액션 → accent | 수정 |
| 9 | `src/app/(admin)/tournament-admin/tournaments/[id]/admins/page.tsx` (L136) | 아바타 이니셜 → accent | 수정 |
| 10 | `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` (import + L175~176) | BDR_PRIMARY_HEX / BDR_SECONDARY_HEX import + 초기값 | 수정 |
| 11 | `src/app/(admin)/tournament-admin/tournaments/[id]/wizard/page.tsx` (import + L190~191 + L271~272) | 상수 import + 초기값 + DB 폴백 4건 | 수정 |
| 12 | `src/app/(admin)/tournament-admin/tournaments/[id]/site/page.tsx` (L4 import + L10 + L37) | BDR_PRIMARY_HEX import + TEMPLATES 미리보기 컨텍스트 주석 + COLOR_PRESETS "오렌지" → "BDR Red" 라벨 정정 | 수정 |
| 13 | `.claude/knowledge/conventions.md` + `index.md` | 신규 항목 박제 (44 → 45) | 수정 |

### color-success 사용 결정 (C8 매치 승자)
- 토큰 정의: globals.css L2768 `--color-success = var(--ok) = #1CA05E` (그린)
- 시맨틱 일치: 승리 = 긍정 결과 → success 토큰 의미 일치
- font-bold 추가 (기존 font-semibold 옆에) → 승자 시각 강조

### BDR_PRIMARY_HEX 위치 결정
- 파일: `src/lib/constants/colors.ts` **신규**
- 사유: 기존 9 상수 파일 패턴 일치 (banks.ts / divisions.ts / regions.ts 등 도메인 분리)
- 정의 2건: `BDR_PRIMARY_HEX = "#E31B23"` / `BDR_SECONDARY_HEX = "#E76F51"`
- 사용 범위: DB 박제 / 사용자 선택 미리보기 등 hex 그대로 저장이 필요한 곳 전용. 컴포넌트 CSS 는 `var(--accent)` 토큰

### 검증
- `npx tsc --noEmit` ✅ 0 에러
- `npx vitest run` ✅ 26 파일 / 341/341 PASS (회귀 0)
- 잔여 `text-[var(--color-primary)]` admin grep: **1건** (`tournament-admin/organizations/new/page.tsx:94` `<span>*</span>` = 필수 입력 표시 — 허용 케이스)
- 잔여 `#E31B23` admin grep: **0건** (site/page.tsx 의 주석 텍스트만 잔존 — 코드 0건)

💡 tester 참고:
- **테스트 방법**:
  1. admin 영역 13 페이지 방문 → 빨간 본문 텍스트 0건 확인
  2. tournament-admin 헤더 클릭 → 활성 탭 accent (BDR Red) 강조 / 비활성 muted 유지
  3. /tournament-admin/tournaments/[id] 진입 → D-Day 뱃지 + 빠른 통계 4건 모두 accent
  4. /tournament-admin/tournaments/[id]/matches 진입 → 승자 팀명 그린 (success) 강조
  5. /tournament-admin/tournaments/new/wizard → primary_color picker 초기값 #E31B23 / secondary_color #E76F51
  6. /tournament-admin/tournaments/[id]/site → 색상 팔레트 "BDR Red" 라벨 표시 (기존 "오렌지" 정정)
- **정상 동작**: 빨강 본문 0건 + accent 통계 통일 + 승자 성공 그린
- **주의할 입력**: dark mode 진입 시에도 텍스트 가독성 유지 (CSS 변수가 라이트/다크 자동 대응)

⚠️ reviewer 참고:
- `--color-success` / `--color-accent` 가 02-design-system-tokens.md §9 폐기 토큰 목록에 있으나, globals.css 에서 backward compat alias 로 잔존 (L2763~2768). admin 영역 잔존 마이그 대상 320 파일과 일관성 위해 본 토큰 사용. 향후 admin 영역 전체 마이그 (`--accent` / `--ink` / `--ok` 등 신규 토큰으로) 시 일괄 교체.
- C8 매치 승자 = success 토큰 단독 사용 (font-bold 추가). PM 옵션 1 채택 (옵션 2 = text-primary font-bold 는 강조 부족).
- COLOR_PRESETS "오렌지" 라벨 fix 는 사용자 인지 영향 0 (hex 값 동일) — 라벨만 정정.
- 잔여 `text-[var(--color-primary)]` 1건 (organizations/new/page.tsx 필수 입력 `*`) 은 conventions.md 허용 케이스 — 변경 0.

## 구현 기록 (developer) — Phase C: status route safety net

📝 구현한 기능: status="completed" 전환 시 score 자동 보정 (Flutter sync 누락 자동 복구)

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/lib/services/match-score-recompute.ts` | `computeRecomputedScore()` + `applyScoreSafetyNet()` 헬퍼 (3단 fallback 단일 source) | 신규 |
| `src/__tests__/lib/services/match-score-recompute.test.ts` | 8 케이스 (#132 실측 + 멱등성 + audit 박제 검증) | 신규 |
| `src/app/api/v1/matches/[id]/status/route.ts` | `updateMatchStatus()` 직후 status=="completed" 때 safety net 트리거 | 수정 |

### 핵심 시그니처

```ts
// read-only — 어느 source 사용할지 + 변경 필요 필드 판단
computeRecomputedScore(tx, matchId) → RecomputeResult | null
// UPDATE + audit 박제 (status=completed hook 용, 멱등)
applyScoreSafetyNet(tx, matchId, context) → RecomputeResult | null
```

3단 우선순위 (Phase B fallback 일관):
1. `homeScore > 0` → `source="skip"` (이미 박제 / 멱등성 보장)
2. `playerStats` 팀별 합 > 0 → `source="playerStats"` (열혈농구단 #98 패턴)
3. PBP made shot 합 → `source="pbp"` (몰텐배 #132 패턴) — `computeScoreFromPbp` 재사용

### status route 통합 카피

`updateMatchStatus()` 메인 트랜잭션 (status/winner/진출/audit 박제) 커밋 **후** 별도 트랜잭션으로 safety net 트리거. status="completed" 분기에서만 진입.

```ts
if (status === "completed") {
  try {
    await prisma.$transaction(async (tx) => {
      await applyScoreSafetyNet(tx, matchId, "status-completed-safety-net");
    });
  } catch (safetyErr) {
    console.error(...);  // status 변경 유지 + 로그
  }
}
```

### 트랜잭션 정책 (옵션 A vs B 의사결정)

기획서의 "옵션 A (rollback 우선) vs B (운영 우선)" 중 **B 선택** — 이유:
- `updateMatchStatus()` 가 자체 트랜잭션 안에서 status + winner 진출 + audit + dual_tournament 진출까지 처리 중 → 이를 외부 트랜잭션으로 wrap 하려면 함수 시그니처 변경 필요 (영향 큼).
- safety net 은 "score 누락 보정"이라 status 변경 자체와는 독립적. safety net 실패 → status 만 변경되고 score 는 0 그대로 유지 → 운영자가 Phase D admin recompute UI 로 수동 복구 가능 (Phase A apply 와 동일 경로).
- safety net 자체는 `prisma.$transaction` 안에서 SELECT+UPDATE+audit 박제를 atomic 하게 처리 → safety net 내부 무결성은 보장됨.
- 결과: **status 변경은 무조건 성공 + safety net 은 best-effort + 실패 시 로그만**. Flutter app 영향 0.

### 검증 결과

| 항목 | 결과 |
|------|------|
| `npx tsc --noEmit` | ✅ 0 에러 |
| `npx vitest run` (전체) | ✅ 26 파일 / **341 / 341 PASS** (320 기존 + 8 신규 + 13 추가 회귀 0) |
| `npx vitest run match-score-recompute.test.ts` | ✅ 8/8 (9ms) |
| BigInt `Nn` 리터럴 | ✅ 0건 (BigInt() 생성자 사용) |
| lucide-react / 핑크 hardcode | ✅ 0건 (서버 코드 무관) |
| 응답 schema 변경 | ✅ 0 (Flutter app 영향 0) |

### 멱등성 / 안전성 검증 (테스트 케이스)

- Case 2: `homeScore=39` 이미 박제 → `source="skip"` / `changed` 모두 false → UPDATE 진입 ❌
- Case 5: PBP=0 + playerStats=0 → 모든 값 0 + 기존 winner=null 과 같음 → `changed` 모두 false → UPDATE 진입 ❌
- 즉 "이미 박제된 매치 재호출" 또는 "복구 불가 매치 (PBP/stats 둘 다 없음)" 시 변경 0.

💡 tester 참고:
- **테스트 방법** (수동 시나리오):
  1. dev 환경에서 매치 종료 시뮬레이션 — `PATCH /api/v1/matches/{id}/status` body `{status:"completed"}`
  2. status="completed" 만 트리거 — `in_progress` / `cancelled` 는 safety net 진입 ❌
  3. 기존 매치 (homeScore>0) 재요청 → DB 변경 0 (멱등성)
  4. sync 누락 시뮬레이션 — 운영자가 매치 PBP 만 박제하고 `/status` PATCH completed → 자동 보정
- **정상 동작**:
  - 응답 schema 동일 (updateMatchStatus 결과 그대로 — `apiSuccess(updated)`)
  - `tournament_match_audits` 에 `source="system" / context="status-completed-safety-net"` row 추가됨
  - score=0 케이스만 보정 (이미 정상 박제된 매치는 skip)
- **주의할 입력**:
  - status="cancelled" → safety net 진입 ❌ (분기 가드)
  - PBP=0 + playerStats=0 → 변경 0 (audit row 생성 ❌)
  - homeTeamId 또는 awayTeamId NULL → source 결정 불가 → skip

⚠️ reviewer 참고:
- **별도 트랜잭션 분리** 결정 (옵션 B) — 이유는 위 "트랜잭션 정책" 섹션. `updateMatchStatus` 시그니처 변경 시 영향 큼. 추후 리팩토링 가능하나 본 Phase 범위 외.
- `Prisma.TournamentMatchUpdateInput` 에 `winner_team_id` 가 직접 타입 멤버 X (relation 경유 input) → `Record<string, unknown>` 캐스팅으로 raw field 박제 (`as Record<string, unknown>).winner_team_id = ...`). updateMatch / updateMatchStatus 기존 코드 패턴과 다름 — Prisma 가 schema mapping 없이 raw column 인 `winner_team_id` 를 그대로 받음 (검증: tsc 0 + 기존 코드 L152 동일 패턴).
- `audit` `TRACKED_FIELDS` 에 `quarterScores` 없음 — 의도적. quarterScores 변경은 result 반환값으로 호출자가 인지 (UI 박제 등에 사용 가능).
- safety net 실패 시 console.error 만 — Phase D 모니터링 cron 또는 Phase E 알림 추가 시 강화 후보.

## 기획설계 핵심 (planner-architect 2026-05-11) — 압축

- **A. sync 흐름**: Flutter `/api/v1/matches/[id]/*` 8 endpoint 분산 / `/tournaments/[id]/matches/sync` 가 완전 path / `/batch-sync` 가 부분 sync (deprecate 후보)
- **B. 추정 원인 #132**: Flutter app 이 `/sync` 미호출 + `/stats` 미호출 + `/events` PBP 만 박제 시나리오
- **C. 결재 5건 결정**: source-of-truth=PBP / 멱등 sync / recompute admin endpoint 추가 / backfill 전체 일괄 / DB trigger ❌
- **D. 원영 협의**: Phase C 머지 후 fyi 공지 / `/batch-sync` deprecate 는 Phase F 협의
- **knowledge 박제 후보**: `errors.md` (sync 누락 패턴) / `decisions.md` (PBP source-of-truth) / `architecture.md` (4 저장소 + 4 sync 채널)

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (PM 커밋 대기) | **[admin 디자인 13 룰 fix]** Critical 11건 (빨강 본문 → accent/text-primary/success) + Major 4건 (hardcode → `src/lib/constants/colors.ts` 신규 + site 팔레트 "오렌지" → "BDR Red" 라벨) + conventions.md 박제 (44 → 45). 13 파일 수정. tsc 0 / vitest 341/341. 잔여 빨강 grep = 1건 (필수표시 `*` 허용 케이스). | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[옵션 C Phase C]** status route safety net — `match-score-recompute.ts` 헬퍼 + 8 신규 케이스 + `/api/v1/matches/[id]/status` 통합. status="completed" 시 자동 score 보정 (3단 fallback 멱등). vitest 341/341 PASS. Flutter app 영향 0. | ✅ |
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A apply]** PBP/playerStats source 10건 운영 DB UPDATE + audit (system/backfill-pbp-2026-05-11). #132 + 열혈농구단 9건 영구 복구. TEST 2건 제외. | ✅ |
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A DRY-RUN]** 12 매치 SELECT + PBP 재계산 JSON 출력. UPDATE 0건. | ✅ |
| 2026-05-11 | 9793b7f | **[옵션 C Phase B]** score-from-pbp 헬퍼 + live API L1131 fallback 3단 강화. vitest 320/320 PASS. | ✅ |
| 2026-05-11 | (기획만) | **[옵션 C 기획설계]** 6 Phase + 5 결재 + 원영 협의 4 + knowledge 박제 후보. 코드 변경 0. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-B + 3 + rbac]** admin-guard sentinel + referee layout + RoleMatrixCard 8행. vitest 312/312. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-A + 1-C + 2]** isSuperAdmin 단일 source + partner-admin 우회. vitest 296/296. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 3]** 알림 + 건의사항 + 비번 변경. ~+523 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 2]** 관리 토너먼트 + 본인인증. ~+1,025 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1 강남구협회장배 유소년]** schema TT +3 / TTP +11. vitest 275/277. | ✅ |
