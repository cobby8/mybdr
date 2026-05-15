# ?묒뾽 ?ㅽ겕?섏튂?⑤뱶

## ?꾩옱 ?묒뾽
- **?붿껌**: CLI 留덉뒪???몃뱶?ㅽ봽 ??admin ?붿옄???쒖뒪???댁쁺 諛뺤젣 (`admin-design-2026-05-15/cli-port-to-src.md` ?곕씪 Admin-1 ~ Admin-9 吏꾪뻾)
- **?곹깭**: Admin-1 吏꾩엯 ??components/admin/* 10 而댄룷?뚰듃 諛뺤젣 吏꾪뻾 以?(developer ?꾩엫)
- **寃곗옱 諛쏆쓬**:
  - Phase蹂?寃곗옱 諛⑹떇 (Admin-1 ??寃利???Admin-2 ... ?쒖감) ??  - src/ 誘몄빱諛?5 ?뚯씪 ??蹂꾨룄 WIP commit 遺꾨━ (`0853927`) ??  - `.git/index` ?먯긽 蹂듦뎄 + Phase 0~1 push ?꾨즺 (origin/subin = `d1290c0`) ??  - ?ㅻⅨ ?몄뀡 PR4-UI commit (d1290c0) ?먯뿰?ㅻ읇寃?蹂??몄뀡 commit ?꾩뿉 諛뺤젣 ??異⑸룎 0

## 吏꾪뻾 ?꾪솴??| ?④퀎 | ?곹깭 |
|------|------|
| Phase 0 ??`.git/index` 蹂듦뎄 | ???꾨즺 |
| Phase 0.5 ??src/ 誘몄빱諛?遺꾨━ commit (0853927) | ???꾨즺 |
| Phase 0.6 ??scratchpad ?뺣━ (726??0以? | ???꾨즺 |
| Phase 1 ??BDR-current v2.14 sync commit (d43704a) | ???꾨즺 (436 ?뚯씪 / +75866) |
| Phase 1.5 ??push to origin/subin | ???꾨즺 (4 commit fast-forward) |
| Phase 2 ??Admin-1 components/admin (?좉퇋 5 + admin.css) | ??commit `05caa04` (7 ?뚯씪 / +1830 / tsc 0 / 媛깆떊 5 蹂대쪟 ?ъ슜??寃곗옱) |
| **Phase 3 ??Admin-2 /admin/layout + Dashboard + 媛깆떊 5** | ??**諛뺤젣 ?꾨즺** (6 ?뚯씪 / +310/-265 / tsc 0 / vitest 921 PASS / ?몄텧泥?29 ?뚭? 0) ??commit ?湲?|
| Phase 4 ??Admin-3 wizard ??ㅽ겕由?| ??|
| Phase 5 ??Admin-4 Phase B 肄섑뀗痢?9 ?섏씠吏 | ??|
| Phase 6 ??Admin-5 Phase C ?ъ슜??鍮꾩쫰?덉뒪/?몃? 9 ?섏씠吏 | ??|
| Phase 7 ??Admin-6 Phase D ?쒖뒪??me 5 ?섏씠吏 | ??|
| Phase 8 ??Admin-7 Phase E 8 ?쇱슦??(UI-1~5 蹂댁〈) | ??|
| Phase 9 ??Admin-8 Phase F ?붿뿬 ?좏겙 留ㅽ븨 | ??|
| Phase 10 ??Admin-9 ?먮룞 寃利?| ??|

## ?꾩냽 ??(蹂꾨룄 ?몄뀡 / 蹂??섎ː ??
- **蹂??섎ː ?꾩냽**: Phase E ?붿뿬 14 ?쇱슦???쒖븞 諛뺤젣 (Claude.ai ?붿옄?? ??CLI 諛뺤젣
- recorder_admin Q1~Q6 寃곗옱 ?湲?(PR1~3 commit ?꾨즺 / ?ъ슜??寃利?+ PR4 ?댁쁺??UI ?듭뀡)
- Phase 6 PR3 ?묓쉶 留덈쾿??referee ?듭뀡 (PR2 ?꾨즺 ???꾩냽)
- PR-G5.2~G5.8 placeholder 諛뺤젣 generator 蹂??뺤옣 (PR-G5.1 commit ?꾨즺)
- **PR-G5.5-followup 상태**: 코드 박제 완료 / **tester+reviewer 병렬 검증 대기** — 4차 BDR 뉴비리그 (Tournament 443f23f8 / 5/16 시작) 단판 결승 매치 232 placeholder 박제 + advanceTournamentPlaceholders 신규 박제. 운영 적용 5/16 마감 (사용자 결재 후 scripts/_temp 실행)
- Phase 19 PR-T1~T5 / PR-S10.4 / PR-S10.7 / PR-S10.8 / PR-Stat1~Stat5 寃곗옱 ?湲?- Phase 23 PR4 / PR6 / Phase A.7 ?섎ː??- Phase 3.5 ?좎껌?뚮뀈 寃고빀 肄붾뱶 ?꾩냽 (parseDivisionCode + 諛깆썙???명솚)
- PR-S9 / UI-1.4 entry_fee / GNBA 8? 肄붿튂 ?덈궡

## 誘명뫖??commit (subin 釉뚮옖移?
- ?꾩옱 = **1** (`05caa04` Admin-1 諛뺤젣 / origin/subin = 2f7ab2f PR-Live1~Live4 by ?ㅻⅨ ?몄뀡)
- Admin-2 諛뺤젣 ?꾨즺 (6 ?뚯씪 / 寃利??듦낵) ??PM commit 吏꾪뻾 ??+1 commit
- push 寃곗옱 ?湲????ㅻⅨ ?몄뀡???숈떆 諛뺤젣 以묒씠??push ?쒖젏 ?ъ슜??寃곗옱 沅뚯옣
- 蹂??몄뀡 ?꾩쟻 = 3 commit 蹂??몄뀡 吏곸젒 諛뺤젣 (0853927 + d43704a + 05caa04). Admin-2 commit ??4 commit

## 기획설계 (planner-architect) — G5.5-followup (2026-05-15)

🎯 목표: 4차 BDR 뉴비리그 (Tournament 443f23f8 / 5/16 시작 / division_rule=0건) 단판 결승 매치 232 placeholder 박제 자동화 + Tournament 단위 applier 함수 신규 박제. 기존 G5.3/G5.4 generator 회귀 0 보장.

📍 신규 함수 시그니처 + 의도

| 항목 | 내용 |
|------|------|
| 위치 | `src/lib/tournaments/division-advancement.ts` (advanceDivisionPlaceholders 직후) |
| 함수명 | `advanceTournamentPlaceholders` (옵션 A — 신규 함수 / 회귀 0) |
| 시그니처 | `async function advanceTournamentPlaceholders(prisma: PrismaClient \| Prisma.TransactionClient, tournamentId: string): Promise<AdvanceResult>` |
| 의도 | division_code 무관 Tournament 단위 placeholder 채움. 4차 뉴비리그처럼 division_rule=0건이고 settings.division_code 가 없는 매치도 진입 가능. category=null + groupName="A"/"B" standings 만 기준 |
| 헬퍼 | `getTournamentStandings(prisma, tournamentId)` 신규 — getDivisionStandings 의 category 필터 제거 버전 (모든 TournamentTeam SELECT + groupName 그룹핑 + 동일 정렬 룰 wins/pd/pf/name) |
| placeholder fetch 조건 | `tournamentId 일치 + (homeTeamId IS NULL OR awayTeamId IS NULL)` (settings.division_code 필터 제거 — 본 함수 차별점) |
| 이미 채워진 슬롯 보호 | 기존 advanceDivisionPlaceholders 동일 룰 — `m.homeTeamId === null` 일 때만 UPDATE / 운영자 수동 변경 보호 |
| 정렬 룰 | wins desc → pd desc → pf desc → name asc (NBA 표준 + getDivisionStandings 동일) |

🔗 기존 코드 연결

- **placeholder-helpers.ts**: `buildSlotLabel({ kind: "group_rank", group: "A", rank: 1 })` + `buildPlaceholderNotes("A조 1위", "B조 1위")` 통과 의무 — 운영 매치 232 UPDATE SQL 가 호환 형식 박제
- **ADVANCEMENT_REGEX**: `/([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/` — 신규 함수는 기존 `parseAdvancement` 재사용
- **advanceAllDivisions** (기존): division_rule 기반 loop → division_rule=0건 케이스 진입 불가 → 4차 뉴비리그용 별도 applier 호출 필요
- **호출 시점 (Phase B)**: 별도 후속 PR 의 매치 PATCH route 통합. 본 PR 범위 = 함수 박제만

📋 실행 계획

| 순서 | 작업 | 담당 | 선행 조건 | 산출물 |
|------|------|------|----------|--------|
| 1 | `getTournamentStandings` + `advanceTournamentPlaceholders` 신규 박제 | developer | 본 설계 | division-advancement.ts +~80 LOC |
| 2 | vitest 케이스 박제 (최소 3 + 추가 1) | developer | 1 | `src/__tests__/lib/tournaments/tournament-advancement.test.ts` 신규 |
| 3 | 매치 232 UPDATE 스크립트 박제 (사용자 결재 후 실행) | developer | 1, 2 | `scripts/_temp/seed-newbie4-final-placeholder.ts` |
| 4 | 회귀 검증 (강남구 4 종별 영향 0) | tester + reviewer (병렬) | 1, 2 | 기존 vitest 통과 + division-placeholder-plan.test.ts 영향 0 |
| 5 | 사용자 결재 후 스크립트 실행 + 운영 DB UPDATE 232 | PM | 사용자 결재 | tournament_matches.id=232 row 검증 (count=1 / homeTeamId IS NULL / notes 호환) |
| 6 | decisions.md + 작업 로그 박제 | PM | 5 | 본 PR 박제 commit |

⚠️ developer 주의사항

1. **신규 함수 = 옵션 A 분리** — 기존 `advanceDivisionPlaceholders` 시그니처 변경 ❌. divisionCode 옵셔널 확장 (옵션 B) 회피
2. **idempotent 가드** — placeholder fetch where 절에 `OR: [{ homeTeamId: null }, { awayTeamId: null }]` + UPDATE 시 NULL slot 만 채움. 이미 실팀 박힌 row 보호
3. **standings 동률 처리** — wins/pd/pf 동률 시 teamName asc tie-breaker (`localeCompare`) — getDivisionStandings 동일 로직 카피 (분기 안전성)
4. **groupName=null 방어** — `t.groupName ?? "X"` 폴백 (getDivisionStandings 동일 패턴). 4차 뉴비리그는 A/B 명확 박제됨
5. **placeholder-helpers 통과 의무** — 매치 232 UPDATE SQL 의 notes 와 settings.homeSlotLabel/awaySlotLabel 은 buildSlotLabel + buildPlaceholderNotes 통과한 결과여야 함 (인라인 문자열 박제 ❌)
6. **Flutter v1 + DB schema 변경 0** — 새 함수만 박제. 호출처 = 0 (후속 PR 매치 PATCH route 통합 시 호출). schema migration 0

📋 매치 232 UPDATE SQL spec (Phase A — 즉시 / 5/16 전)

```typescript
// scripts/_temp/seed-newbie4-final-placeholder.ts
// 사용자 결재 후 실행. SELECT 1건 검증 → UPDATE → SELECT 1건 사후 검증.
import { PrismaClient } from "@prisma/client";
import { buildSlotLabel, buildPlaceholderNotes } from "@/lib/tournaments/placeholder-helpers";

const TOURNAMENT_ID = "443f23f8-0000-41d4-bcbd-1843f7e16e1f";
const MATCH_ID = 232n;

const prisma = new PrismaClient();
async function main() {
  // 1) 사전 검증 (SELECT — DESTRUCTIVE 아님 / 가드 0)
  const before = await prisma.tournamentMatch.findUnique({
    where: { id: MATCH_ID },
    select: { id: true, tournamentId: true, homeTeamId: true, awayTeamId: true, notes: true, settings: true, status: true },
  });
  if (!before) throw new Error(`match ${MATCH_ID} not found`);
  if (before.tournamentId !== TOURNAMENT_ID) throw new Error(`tournament mismatch`);
  if (before.homeTeamId !== null || before.awayTeamId !== null) {
    console.log("이미 실팀 박힘 — skip"); return;
  }

  // 2) placeholder-helpers 통과 — 인라인 문자열 박제 ❌
  const homeSlot = buildSlotLabel({ kind: "group_rank", group: "A", rank: 1 }); // "A조 1위"
  const awaySlot = buildSlotLabel({ kind: "group_rank", group: "B", rank: 1 }); // "B조 1위"
  const notes = buildPlaceholderNotes(homeSlot, awaySlot); // "A조 1위 vs B조 1위"

  // 3) settings 병합 (기존 키 보존 — settings 단일 UPDATE 통합 패턴)
  const baseSettings = (before.settings && typeof before.settings === "object" && !Array.isArray(before.settings))
    ? (before.settings as Record<string, unknown>) : {};
  const nextSettings = { ...baseSettings, homeSlotLabel: homeSlot, awaySlotLabel: awaySlot };

  // 4) UPDATE 1건
  const result = await prisma.tournamentMatch.update({
    where: { id: MATCH_ID },
    data: { notes, settings: nextSettings },
    select: { id: true, notes: true, settings: true },
  });

  // 5) 사후 검증 (실측)
  console.log("UPDATE result:", result);
  const regex = /([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/;
  if (!regex.test(result.notes ?? "")) throw new Error("ADVANCEMENT_REGEX 호환 실패");
}
main().finally(() => prisma.$disconnect());
```

📋 vitest 케이스 명세 (`tournament-advancement.test.ts`)

| # | 케이스 | 시나리오 | 기대 |
|---|--------|---------|------|
| 1 | 정상 — 단판 결승 (4차 뉴비리그) | groupName="A"/"B" 각 3팀 / wins+pd 박제 / 결승 1건 (NULL+notes "A조 1위 vs B조 1위") | updated=1 / skipped=0 / errors=0 / homeTeamId+awayTeamId 모두 A1+B1 row id |
| 2 | idempotent — 이미 채워짐 skip | 결승 1건 homeTeamId/awayTeamId 모두 NOT NULL | updated=0 / skipped=1 / errors=0 |
| 3 | standings 매핑 실패 — notes 형식 위반 | NULL placeholder + notes="결승전" (REGEX 불일치) | updated=0 / skipped=1 / errors=[{reason: "notes 파싱 실패"}] |
| 4 (보강) | 절반만 NULL — home NULL / away 실팀 | UPDATE 시 home 만 채우고 away 보존 | updated=1 / homeTeamId set / awayTeamId 기존 값 그대로 |

테스트 박제 패턴:
- vitest mock = PrismaClient mock 또는 in-memory fake (기존 `division-placeholder-plan.test.ts` 와 다름 — 본 함수는 DB 접근 → mock 필요)
- 또는 plan 함수 분리 패턴 도입 가능 (선택) — `planTournamentAdvancement(standings, placeholders): UpdateSpec[]` pure 함수 + `advanceTournamentPlaceholders` 가 plan 호출 + DB UPDATE. 시간 여유 시 분리 (lessons.md "plan/generate 분리 패턴")

📋 회귀 검증 명세 (강남구 4 종별 영향 0 증명)

| 검증 항목 | 방법 | 기대 |
|----------|------|------|
| 기존 `advanceDivisionPlaceholders` 호출 시그니처 변경 | grep `advanceDivisionPlaceholders\|advanceAllDivisions` | 호출처 2건 (advance-placeholders/route.ts) — 시그니처 변경 0 |
| 기존 vitest 통과 | `npx vitest run src/__tests__/lib/tournaments/` | 기존 division-placeholder-plan.test.ts + placeholder-helpers.test.ts 통과 (regression 0) |
| 강남구협회장배 (i3-U9 / i3-U11 / i3-U14 / i3w-U12) division_rule 기반 진입 보존 | advanceAllDivisions 가 본 함수 호출 ❌ (별 진입점) | division-code 분기 매치는 기존 함수, division-code=null 매치는 신규 함수 진입 |
| tsc + 전체 vitest | `npx tsc --noEmit` + `npx vitest run` | 0 에러 / 921+4 = 925/925 PASS (신규 케이스 추가만큼) |
| Flutter v1 영향 | `/api/v1/...` 변경 0 | api/v1 grep — 변경 0 |
| DB schema | prisma db push 미진입 | schema.prisma 변경 0 |

📋 후속 PR 큐 (본 PR 범위 ❌ / 명시만)

| PR | 내용 | 시점 |
|----|------|------|
| G5.5-followup-B | 매치 PATCH route 통합 — 매치 status="completed" 변경 시 (a) tournament 의 division_rule>0 → advanceAllDivisions / (b) division_rule=0 → advanceTournamentPlaceholders 자동 호출 분기 | 4차 뉴비리그 예선 6건 종료 직전 (5/16 D-Day or 5/17 분기 종료 직후) |
| G5.5-NBA-seed | 8강/4강 NBA 시드 표준 generator (교차 시드 알고리즘 — A1 vs B2, B1 vs A2 / 같은 조 1R 회피 / 2^N 올림 / bye 처리) | 운영 사용처 0 — 본 4차 뉴비리그는 결승 단판이라 시드 알고리즘 불필요. 후속 협회배 진입 시 |
| G5.7 | double_elimination generator | 운영 사용처 0 |
| G5.8 | swiss generator | 운영 사용처 0 |

📋 운영 적용 시점 (사용자 결재 후)

| Phase | 시점 | 작업 |
|-------|------|------|
| A (즉시 / 5/16 전) | 사용자 결재 후 | scripts/_temp/seed-newbie4-final-placeholder.ts 실행 → 매치 232 UPDATE (notes + slot labels) → 결승 매치 카드 "A조 1위 vs B조 1위" 표시 |
| B (예선 6건 종료 후) | 5/17 분기 종료 직후 | 매치 PATCH route 통합 (별 PR) 또는 운영자 manual `advanceTournamentPlaceholders()` trigger → standings 계산 → 매치 232 의 homeTeamId/awayTeamId UPDATE |

📋 산출물 위치

| 파일 | 변경 | LOC |
|------|------|-----|
| `src/lib/tournaments/division-advancement.ts` | `getTournamentStandings` + `advanceTournamentPlaceholders` 박제 | +~80 |
| `src/__tests__/lib/tournaments/tournament-advancement.test.ts` | vitest 4 케이스 박제 | +~180 |
| `scripts/_temp/seed-newbie4-final-placeholder.ts` | 매치 232 UPDATE 스크립트 (사용자 결재 후 1회성 실행) | +~70 |
| `.claude/knowledge/decisions.md` | Tournament 단위 applier 분리 결정 박제 | +1 항목 |

**총 신규 2 + 수정 2 / ~330 LOC** (이중 운영 DB UPDATE = 매치 232 row 1건만).

→ **developer 진입 대기**.


## 구현 기록 (developer) — G5.5-followup (2026-05-15)

📝 구현 요약: 4차 BDR 뉴비리그 (Tournament 443f23f8 / 5/16 시작 / division_rule=0건) 의 단판 결승 매치 232 placeholder 박제 인프라 박제. (1) `getTournamentStandings` + `advanceTournamentPlaceholders` 신규 export — 기존 advanceDivisionPlaceholders / getDivisionStandings 시그니처/동작 변경 0 (회귀 차단 옵션 A). (2) vitest 5 케이스 (getTournamentStandings 1 + advanceTournamentPlaceholders 4). (3) 운영 DB UPDATE 1회성 스크립트 박제 — PM 이 사용자 결재 후 실행 (본 PR 범위 X).

### 변경 파일 + LOC

| 파일 | 변경 | 신규/수정 | LOC |
|------|------|----------|----|
| `src/lib/tournaments/division-advancement.ts` | `getTournamentStandings` + `advanceTournamentPlaceholders` + `TournamentAdvanceResult` 타입 신규 export. 기존 함수 (advanceDivisionPlaceholders / getDivisionStandings / advanceAllDivisions / plan/generate G5.3/G5.4) 100% 보존 | 수정 | +172 / -0 |
| `src/__tests__/lib/tournaments/tournament-advancement.test.ts` | vitest 5 케이스 — getTournamentStandings 1 (groupName 분류 + 정렬 + groupRank 박제) + advanceTournamentPlaceholders 4 (정상/idempotent/notes 위반/절반 NULL). In-memory fake PrismaClient mock 패턴 (target=ES2017 호환 — BigInt(N) 호출) | 신규 | +247 |
| `scripts/_temp/seed-newbie4-final-placeholder.ts` | 매치 232 UPDATE 스크립트 (사용자 결재 후 1회성 실행). 5중 안전 가드 (tournamentId/idempotent/placeholder-helpers/settings 병합/사후 검증) | 신규 | +158 |

**합계**: 수정 1 + 신규 2 / 총 +577 LOC.

### 신규 함수 명세

| 함수 | 시그니처 | 의도 |
|------|---------|------|
| `getTournamentStandings(prisma, tournamentId)` | `Promise<DivisionStanding[]>` | category 무관 standings — getDivisionStandings 의 category 필터만 제거. groupName 기준 분류 + wins/pd/pf/name 정렬 룰 100% 동일 (분기 안전성) |
| `advanceTournamentPlaceholders(prisma, tournamentId)` | `Promise<TournamentAdvanceResult>` | division_code 무관 placeholder applier — settings.division_code 매칭 제거. NULL slot 만 UPDATE (운영자 수동 변경 보호) |
| `TournamentAdvanceResult` 타입 | `{ tournamentId, updated, skipped, errors, standings }` | AdvanceResult 와 차이 = divisionCode → tournamentId. 그 외 필드 100% 동일 |

### placeholder-helpers 통과 검증

| 위치 | buildSlotLabel | buildPlaceholderNotes | 결과 |
|------|---------------|----------------------|------|
| `scripts/_temp/seed-newbie4-final-placeholder.ts` L78~80 | `{ kind: "group_rank", group: "A", rank: 1 }` + `{ kind: "group_rank", group: "B", rank: 1 }` | `buildPlaceholderNotes(homeSlot, awaySlot)` | `notes = "A조 1위 vs B조 1위"` (ADVANCEMENT_REGEX 매칭 100%) |
| vitest 케이스 1/2/4 | (notes 직접 "A조 1위 vs B조 1위" 문자열로 검증) | (parseAdvancement 가 standings 매핑 동작 검증) | OK |
| 운영 매치 232 settings | (homeSlotLabel "A조 1위" / awaySlotLabel "B조 1위") | (대시보드 카드 표시용) | OK |

→ 인라인 문자열 박제 ❌ / placeholder-helpers 통과 100% (강남구 사고 영구 차단 룰 준수).

### 검증 결과

| # | 명령 | 결과 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** / 에러 0 |
| 2 | `npx vitest run src/__tests__/lib/tournaments/tournament-advancement.test.ts` | **5/5 PASS** (getTournamentStandings 1 + advanceTournamentPlaceholders 4) / 9ms |
| 3 | `npx vitest run` 전체 | **926/926 PASS** (기존 921 + 신규 5 정확 합산 / 회귀 0) / 4.5s |
| 4 | 기존 division-placeholder-plan.test.ts | PASS (변경 0) |
| 5 | 기존 placeholder-helpers.test.ts | PASS (변경 0) |
| 6 | Flutter v1 API 영향 | `src/app/api/v1/...` grep — 변경 0 |
| 7 | DB schema 변경 | prisma db push 미진입 / schema.prisma 변경 0 |
| 8 | 운영 DB UPDATE | 0건 (스크립트 작성만 / 실행 ❌ — PM 이 사용자 결재 후 처리) |

### 기존 함수 회귀 0 증명

| 항목 | 검증 |
|------|------|
| `advanceDivisionPlaceholders` 시그니처 | 변경 0 (3 인자 — prisma/tournamentId/divisionCode 그대로) |
| `getDivisionStandings` 시그니처 | 변경 0 (3 인자) |
| `advanceAllDivisions` 동작 | 변경 0 (division_rule 기반 loop — 본 함수 호출 안 함) |
| 호출처 (`advance-placeholders/route.ts` + `division-rules/[ruleId]/advance/route.ts` + `match-sync.ts`) | 변경 0 |
| 강남구협회장배 (i3-U9 / i3-U11 / i3-U14 / i3w-U12) 진입 경로 | division_code 분기 매치는 기존 함수 그대로 (회귀 0) |

### 안전 가드 ✅

| 가드 | 위치 | 검증 |
|------|------|------|
| placeholder-helpers 통과 의무 | scripts/_temp + (호출 시) generator | buildSlotLabel + buildPlaceholderNotes 통과 100% |
| idempotent — 이미 채워진 슬롯 보호 | advanceTournamentPlaceholders | NULL slot 만 UPDATE / 사후 SELECT 진입 차단 (where OR null) |
| 운영자 수동 변경 보호 | advanceTournamentPlaceholders (케이스 4) | home 만 NULL 일 때 home 만 UPDATE / away 보존 |
| notes 형식 위반 안전 fail | advanceTournamentPlaceholders (케이스 3) | parseAdvancement null → errors 박제 + skip / UPDATE 0 |
| 운영 DB 영향 = 매치 232 row 1건 | scripts/_temp/seed-newbie4-final-placeholder.ts | tournamentId UUID 일치 + MATCH_ID=232n 직접 박제 / 5중 가드 통과 시만 UPDATE |
| AppNav frozen 영향 | src/components/AppNav* 변경 0 | grep 0 |

💡 tester 참고:

- **테스트 방법**:
  1. `npx vitest run src/__tests__/lib/tournaments/tournament-advancement.test.ts` → 5/5 PASS 확인
  2. `npx vitest run` 전체 926/926 PASS 확인 (기존 921 + 신규 5)
  3. `npx tsc --noEmit` exit=0 확인
  4. `src/lib/tournaments/division-advancement.ts` import 무결성 검증 — grep `advanceDivisionPlaceholders\|advanceAllDivisions` 호출처 3개소 (advance-placeholders/route.ts / division-rules/[ruleId]/advance/route.ts / match-sync.ts) 변경 0 확인
  5. 운영 매치 232 SELECT 사전 확인 (현재 상태 = homeTeamId/awayTeamId NULL / notes NULL — 스크립트 실행 직전 SELECT 로 사전 점검)
- **정상 동작**:
  - 케이스 1 (정상): 매치 232 placeholder + A1/B1 standings → result.updated=1 / homeTeamId=100 / awayTeamId=200
  - 케이스 2 (idempotent): 이미 채워진 매치 → result.updated=0 / UPDATE 호출 0
  - 케이스 3 (notes 위반): notes="결승전" → errors 1건 + skip / UPDATE 0
  - 케이스 4 (절반 NULL): home=null/away=999n → homeTeamId 만 UPDATE / awayTeamId 보존
- **주의할 입력**:
  - groupName=null 케이스 → "X" 폴백 (getDivisionStandings 동일 룰)
  - standings 동률 (wins/pd/pf 모두 동일) → teamName localeCompare tie-breaker 작동
  - notes 위반 매치가 다수일 때 → 각각 errors 박제 + skip (UPDATE 0) — 안전 fail

⚠️ reviewer 참고:

- **회귀 0 핵심**: 기존 `advanceDivisionPlaceholders` / `getDivisionStandings` / `advanceAllDivisions` 함수 100% 보존 (옵션 A 분리). divisionCode 옵셔널 확장 (옵션 B) 회피 — 신규 함수 분리로 강남구 4 종별 진입 경로 변경 0 보장
- **fake PrismaClient 패턴**: target=ES2017 호환 위해 BigInt 리터럴 (`100n`) 대신 `BigInt(100)` 호출 사용 (기존 `admin-roles.test.ts` / `admin-guard.test.ts` 패턴 동일). vitest mock 보다 in-memory fake 가 가독성 + assertion 단순
- **standings 매핑 무결성**: parseAdvancement 재사용 (코드 중복 0) + standingsMap key = "그룹:랭크" 단순 패턴 (기존 advanceDivisionPlaceholders 와 100% 동일 — 검증 친화)
- **운영 DB UPDATE 스크립트**: 본 PR 에서는 **작성만** / 실행 ❌. PM 이 사용자 결재 후 `npx tsx scripts/_temp/seed-newbie4-final-placeholder.ts` 호출. 사후 정리 (파일 삭제) 의무 — 운영 credentials 노출 방지
- **후속 PR 큐 (본 PR 범위 X)**: G5.5-followup-B = 매치 PATCH route 통합 (status="completed" UPDATE 시 division_rule>0 ↔ division_rule=0 분기 자동 호출). 5/17 분기 종료 직전 진입.


## 테스트 결과 (tester) — G5.5-followup (2026-05-15)

### 자동 검증

| 항목 | 명령 | 결과 |
|------|------|------|
| tsc | `npx tsc --noEmit` | **exit=0** / 에러 0 |
| tournament-advancement.test.ts | `npx vitest run src/__tests__/lib/tournaments/tournament-advancement.test.ts` | **5/5 PASS** (9ms) |
| placeholder-helpers.test.ts (회귀) | `npx vitest run ...placeholder-helpers.test.ts` | **20/20 PASS** (회귀 0) |
| division-placeholder-plan.test.ts (회귀) | `npx vitest run ...division-placeholder-plan.test.ts` | **12/12 PASS** (회귀 0) |
| 전체 vitest | `npx vitest run` | **926/926 PASS** / 68 test files / 5.13s (기존 921 + 신규 5 정확 합산) |

### 코드 정합

| 검증 항목 | 결과 |
|----------|------|
| `advanceTournamentPlaceholders` NULL slot 만 UPDATE (운영자 수동 변경 보호) | ✅ L805~813 — `m.homeTeamId===null` 일 때만 `updateData.homeTeamId` set / `m.awayTeamId===null` 일 때만 `updateData.awayTeamId` set |
| placeholder-helpers 통과 의무 (인라인 문자열 박제 0) | ✅ `seed-newbie4-final-placeholder.ts` L85~87 `buildSlotLabel({kind:"group_rank",group:"A",rank:1})` + `buildPlaceholderNotes(homeSlot, awaySlot)` 통과 / 인라인 박제 0 |
| ADVANCEMENT_REGEX 호환 (`/([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위/`) | ✅ `node -e` 실측 검증 — "A조 1위 vs B조 1위" 매칭 / home=A1 / away=B1 추출 OK |
| 기존 `getDivisionStandings` 시그니처 변경 | ✅ 0 (3 인자 prisma/tournamentId/divisionCode 그대로) |
| 기존 `advanceDivisionPlaceholders` 시그니처 변경 | ✅ 0 (3 인자 그대로) |
| 기존 `advanceAllDivisions` 시그니처 변경 | ✅ 0 (2 인자 그대로 — 본 신규 함수 호출 0건) |
| `git diff src/lib/tournaments/division-advancement.ts` | ✅ add-only (+211 LOC line 626 부터 / 기존 0~625 라인 변경 0) |
| 호출처 4개 파일 영향 | ✅ `advance-placeholders/route.ts` / `division-rules/[ruleId]/advance/route.ts` / `match-sync.ts` / `placeholder-helpers.ts` 변경 0 |

### 운영 시뮬레이션

| 시나리오 | vitest 케이스 | 결과 |
|---------|--------------|------|
| 4차 뉴비리그 단판 결승 (A1+B1 매핑) | 케이스 1: 정상 | ✅ updated=1 / homeTeamId=100(A1) / awayTeamId=200(B1) / errors=[] |
| 이미 채워진 매치 (idempotent) | 케이스 2 | ✅ updated=0 / UPDATE 호출 0 (fetch 진입 자체 안 됨 — where OR null) |
| notes 형식 위반 ("결승전") | 케이스 3 | ✅ errors 1건 "notes 파싱 실패" / skipped=1 / UPDATE 0 (안전 fail) |
| 절반 NULL (운영자 수동 변경 보호) | 케이스 4 | ✅ homeTeamId 만 UPDATE / awayTeamId=999n 보존 |
| 강남구 4 종별 (division_code 있음) 진입 경로 | placeholder-helpers + division-placeholder-plan 32/32 PASS | ✅ 회귀 0 (기존 함수 그대로 / 신규 함수와 별 진입점) |

### 스크립트 안전 (`seed-newbie4-final-placeholder.ts`)

| 가드 | 위치 | 검증 |
|------|------|------|
| (1) tournamentId UUID 일치 | L59~62 `throw new Error("tournament mismatch")` | ✅ 잘못된 매치 보호 |
| (2) matchId 직접 박제 (`MATCH_ID=232n`) | L29 | ✅ 다른 매치 영향 0 |
| (3) idempotent — homeTeamId/awayTeamId 모두 NULL 검증 | L76~79 `if (homeTeamId !== null \|\| awayTeamId !== null) return` | ✅ 이미 실팀 박힌 row 보호 |
| (4) placeholder-helpers 통과 의무 | L85~87 buildSlotLabel + buildPlaceholderNotes | ✅ 인라인 문자열 박제 0 |
| (5) settings 병합 (기존 키 보존) | L98~106 baseSettings 방어 + spread | ✅ null/array/primitive 시 빈 객체 시작 / 기존 키 보존 |
| (6) 사후 검증 — ADVANCEMENT_REGEX 매칭 | L143~148 `regex.test(result.notes)` | ✅ 매칭 실패 시 throw |
| (7) 사후 검증 — settings.{homeSlotLabel/awaySlotLabel} 박제 확인 | L150~157 | ✅ 박제 누락 시 throw |
| (8) 사후 검증 — count=1 (운영 DB 영향 1건만) | L160~170 | ✅ count !== 1 시 throw |

### 종합 판정

| 항목 | 결과 |
|------|------|
| 자동 검증 5/5 | ✅ tsc 0 / 본 신규 5 PASS / 회귀 32 PASS / 전체 926 PASS |
| 코드 정합 8/8 | ✅ NULL slot UPDATE 가드 / placeholder-helpers 통과 / REGEX 호환 / 기존 시그니처 변경 0 / 호출처 4파일 영향 0 |
| 운영 시뮬레이션 5/5 | ✅ 4 케이스 vitest 커버 + 강남구 회귀 0 |
| 스크립트 안전 8/8 | ✅ 8 가드 박제 / 운영 DB 영향 = 매치 232 row 1건만 |

✅ **PR-G5.5-followup commit 진행 가능 / 운영 매치 232 UPDATE 사용자 결재 후 실행 가능**.

수정 요청 없음 (실패 0).


## 리뷰 결과 (reviewer) — G5.5-followup (2026-05-15)

### A. placeholder-helpers 통과
- seed-newbie4 notes 박제: ✅ — `scripts/_temp/seed-newbie4-final-placeholder.ts:87` `buildPlaceholderNotes(homeSlot, awaySlot)` 호출. 인라인 문자열 박제 0.
- seed-newbie4 slot label 박제: ✅ — `scripts/_temp/seed-newbie4-final-placeholder.ts:85~86` `buildSlotLabel({ kind: "group_rank", group: "A"|"B", rank: 1 })` 호출. 인라인 박제 0.

### B. 알고리즘 정합
- `getTournamentStandings` 정렬: ✅ 기존 동일 — `division-advancement.ts:687~695` 의 정렬 함수가 `getDivisionStandings` (`L83~91`) 와 100% 같은 비교 순서 (wins desc → point_difference desc → points_for desc → teamName localeCompare). null 폴백 (`?? 0`) + groupName null → "X" 처리도 동일.
- NULL slot 가드: ✅ 독립 — `L805~807` `if (m.homeTeamId === null) updateData.homeTeamId = ...` + `if (m.awayTeamId === null) updateData.awayTeamId = ...` 각각 별도 검사. 절반 NULL 케이스 정확 처리 (vitest 케이스 4 통과).
- standings 매핑 key 형식: ✅ `${groupName}:${groupRank}` (`L756`) — 기존 `advanceDivisionPlaceholders` (`L168`) 와 100% 동일.

### C. 회귀 보장
- 기존 함수 시그니처: 변경 0 ✅ — `getDivisionStandings(prisma, tournamentId, divisionCode)` / `advanceDivisionPlaceholders(prisma, tournamentId, divisionCode)` / `advanceAllDivisions(prisma, tournamentId)` 모두 인자 변경 없음. export 추가만 (옵션 A 분리 원칙 준수).
- 강남구 4 종별 진입 경로: 변경 0 ✅ — 호출처 3개소 (`advance-placeholders/route.ts` `L60,63` / `match-sync.ts` `L667` / `division-rules/[ruleId]/advance/route.ts`) 모두 `advanceDivisionPlaceholders` 또는 `advanceAllDivisions` 호출. 본 PR 신규 함수 호출처 0건 (정확히 옵션 A 의도). i3-U9 / i3-U11 / i3-U14 / i3w-U12 는 기존 진입 경로 그대로.

### D. 운영 스크립트 안전
- tournamentId: ✅ — `L28` `TOURNAMENT_ID = "443f23f8-0000-41d4-bcbd-1843f7e16e1f"` 박제 + `L59` 사전 검증 `before.tournamentId !== TOURNAMENT_ID` throw.
- 사전 검증: ✅ 3중 — (1) matchId=232 findUnique (`L40~52`) (2) tournamentId UUID 일치 (`L59`) (3) homeTeamId/awayTeamId 모두 NULL 확인 (`L76`).
- idempotent: ✅ — `L76~79` 이미 실팀 박혔으면 return (UPDATE 미진입). UPDATE `where: { id: MATCH_ID }` (`L117`) 만 사용해 그 외 row 영향 0.
- 사후 검증: ✅ 3중 — (1) `ADVANCEMENT_REGEX` 매칭 (`L143~148`) (2) settings.homeSlotLabel / awaySlotLabel 박제 확인 (`L150~157`) (3) count=1 검증 with id+tournamentId+notes contains (`L160~170`).
- 결재 메모: ✅ — `L5` `⚠️ 본 스크립트 실행 = 운영 DB UPDATE 1건. CLAUDE.md §DB 정책 따라 사용자 결재 후 실행` 상단 박제. 사후 정리 의무도 `L23` 명시.

### E. vitest 정합
- 5 케이스 cover: ✅ — `getTournamentStandings` 1 (정렬 + groupRank 박제 + category 필터 없음 검증 `L133~135`) + `advanceTournamentPlaceholders` 4 (정상 단판 결승 / idempotent / notes 위반 / 절반 NULL). 실측 통과 5/5 PASS (12ms).
- planner spec 4 케이스 + getTournamentStandings 1 케이스 = 명세 5 케이스 정확 cover.

### F. 코딩 컨벤션
- snake_case/camelCase: ✅ — DB select 는 `points_for`/`points_against`/`point_difference` snake_case (`L668~672`) / TS 반환 타입은 `pointsFor`/`pointsAgainst`/`pointDifference` camelCase (`L704~706`). `groupName` (camelCase TS) — schema.prisma `@map("group_name")` 가정 (기존 패턴 동일).
- BigInt 변환: ✅ — `standingsMap[key] = BigInt(s.tournamentTeamId)` (`L756`) 문자열 → bigint 안전 변환. vitest 도 `BigInt(100)` 호출 패턴 (ES2017 호환).
- Prisma TransactionClient: ✅ — `advanceTournamentPlaceholders(prisma: PrismaClient | Prisma.TransactionClient, ...)` (`L747`). caller 가 `prisma.$transaction(async (tx) => advanceTournamentPlaceholders(tx, ...))` 묶음 가능.

### G. 후속 PR 명시
- 매치 PATCH 통합 큐: ✅ (조건부) — scratchpad "구현 기록" (`L278`) + "기획설계" (`L162`) 에 G5.5-followup-B 명시. 단, **`division-advancement.ts` 코드 주석 자체에는 매치 PATCH 통합 후속 PR 명시 X** — 다른 후속 PR (G5.5 group_stage_knockout / G5.7 / G5.8) 만 박제. 권장 개선 ↓.

### 자체 실측 검증
- `npx vitest run src/__tests__/lib/tournaments/tournament-advancement.test.ts` → **5/5 PASS** (12ms).
- `npx tsc --noEmit` → **exit=0 / 에러 0**.
- 호출처 grep (`advanceDivisionPlaceholders|advanceAllDivisions|advanceTournamentPlaceholders`) — 신규 함수 호출처 0건 / 기존 함수 호출처 3개소 변경 0.

### 잠재 위험 / 개선 메모
- **(개선 권장 / 비-blocking)** `division-advancement.ts:627~640` PR-G5.5-followup 섹션 주석에 "호출처: 후속 PR (매치 PATCH route 통합 / status='completed' UPDATE 시 division_rule=0 분기)" 한 줄 추가 권장. 본 PR 에서는 caller 0건이므로 미래의 reviewer 가 "이 함수 호출 위치는?" 질문할 때 코드 자체로 답변 가능.
- **(향후 회귀 차단 / PM 작업)** `decisions.md` 에 "옵션 A 분리 — 본 PR 함수 박제 / 호출은 후속 PR G5.5-followup-B" 결정 박제 권장 (planner 계획에 이미 포함되어 있음).
- **(저우려 / 운영 결재 시 1회 확인)** `seed-newbie4-final-placeholder.ts:160~166` `count` 검증의 `notes: { contains: "A조 1위 vs B조 1위" }` — Prisma string filter contains 는 PostgreSQL `ILIKE`/`LIKE` 변환. NULL notes 인 row 는 매칭 안 되므로 안전. 정확.

### 종합 판정
✅ **PR-G5.5-followup commit 진행 가능**

핵심 검증 결과:
- placeholder-helpers 통과 의무 ✅ (강남구 사고 영구 차단 룰 준수)
- 기존 4 종별 (i3-U9/U11/U14 + i3w-U12) 진입 경로 변경 0 ✅
- 운영 DB 영향 = 매치 232 row 1건 (5중 안전 가드 통과 시만) ✅
- vitest 5/5 PASS (실측) + tsc 0 에러 (실측)
- DB schema 변경 0 / Flutter v1 영향 0

권장 후속 (비-blocking): division-advancement.ts:627~640 주석에 매치 PATCH 통합 후속 PR 한 줄 박제 — PM 이 본 PR commit 후 또는 G5.5-followup-B 진입 시 처리.


## 援ы쁽 湲곕줉 (developer)

### Admin-2 Phase 諛뺤젣 ??/admin/layout + Dashboard + 媛깆떊 5 (2026-05-15)

?뱷 援ы쁽 ?붿빟: ?쒖븞 v2.14 ??AdminShell + AdminDashboard ?⑦꽩???댁쁺 admin ?곸뿭 諛뺤젣. (1) `/admin/layout.tsx` 媛 `<AdminShell>` wrap ?쇰줈 媛덉븘?낆쓬 ??UserMenu ??topbarRight slot ?듯빀 (PC `hidden lg:flex`). (2) `/admin/page.tsx` Dashboard 媛 `admin-stat-grid + AdminStatCard / admin-chart / admin-log-card` ?쒖븞 ?⑦꽩 諛뺤젣 ??Prisma query 100% 蹂댁〈. (3) 媛깆떊 5 而댄룷?뚰듃 (sidebar / mobile-admin-nav / admin-page-header / admin-status-tabs / admin-detail-modal) ?쒓컖 媛깆떊 ??**props ?쒓렇?덉쿂 100% 蹂댁〈 (?몄텧泥?29 ?뚯씪 ?곹뼢 0)**.

#### 蹂寃??뚯씪 + LOC
| ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|------|------|----------|----|
| `src/app/(admin)/admin/layout.tsx` | AdminShell wrap. UserMenu ??topbarRight slot 諛뺤젣. 湲곗〈 Tailwind hidden lg:block / lg:ml-64 / mx-auto max-w-7xl 諛뺤젣 ??AdminShell ??admin.css ?대옒??(admin-shell / admin-main / admin-main__inner ?먮룞 泥섎━) | ?섏젙 | -45 / +35 |
| `src/app/(admin)/admin/page.tsx` | Dashboard UI ?쒖븞 ?⑦꽩 諛뺤젣 ??admin-stat-grid (4 AdminStatCard) + admin-dash-grid (admin-chart 7??李⑦듃 + admin-log-card 理쒓렐 5嫄?. Prisma query / raw SQL / catch 遺꾧린 100% 蹂댁〈. 湲곗〈 StatCard / CARD_CLASS ?몃씪????AdminStatCard / admin.css ?대옒??| ?섏젙 | -65 / +95 |
| `src/components/admin/admin-page-header.tsx` | JSX ???쒖븞 `.admin-pageheader / .admin-pageheader__body / .admin-pageheader__eyebrow / __title / __subtitle / __actions` ?대옒?? **props ?쒓렇?덉쿂 蹂댁〈** (title/subtitle/eyebrow/searchPlaceholder/searchName/searchDefaultValue/actions). breadcrumbs ?듭뀡 ?좉퇋 異붽? (admin-pageheader__breadcrumbs). 寃??form ? actions ?곸뿭??諛뺤젣 (22 ?몄텧泥?蹂댁〈) | ?섏젙 | -30 / +60 |
| `src/components/admin/admin-status-tabs.tsx` | JSX ???쒖븞 `.admin-status-tabs + .admin-status-tab + .admin-status-tab__count` ?대옒?? data-active / data-overflow ?띿꽦 諛뺤젣. count 99+ ?ㅻ쾭?뚮줈???쒖븞 諛뺤젣. **activeTab 紐낆묶 蹂댁〈** (?쒖븞 `current` 梨꾪깮 X / ?댁쁺 ?곗꽑) | ?섏젙 | -50 / +30 |
| `src/components/admin/sidebar.tsx` | JSX ???쒖븞 `.admin-aside / .admin-aside__logo / __logo-badge / __nav / __group / __title / __link / __foot / __foot-link` ?대옒?? data-active / data-child ?띿꽦 諛뺤젣. **roles: AdminRole[] ?쒓렇?덉쿂 蹂댁〈**. navStructure / filterStructureByRoles / Next.js Link/usePathname 100% 蹂댁〈 | ?섏젙 | -25 / +30 |
| `src/components/admin/mobile-admin-nav.tsx` | JSX ???쒖븞 `.admin-mobile-toggle / .admin-mobile-overlay [data-open] / .admin-mobile-drawer [data-open] / __head / __head-avatar / __head-name / __head-email / __body / __foot` ?대옒?? **roles / user ?쒓렇?덉쿂 蹂댁〈**. ESC / ?몃? ?대┃ / ?쇱슦???대룞 / body ?ㅽ겕濡??좉툑 100% 蹂댁〈. LogoutButton drawer-card variant ?좎? | ?섏젙 | -50 / +60 |
| `src/components/admin/admin-detail-modal.tsx` | **蹂?PR 誘몃?寃?寃곗젙** ???댁쁺 ?몄텧泥?7嫄댁쓽 `isOpen` ?쒓렇?덉쿂 蹂댁〈 + ?댁쁺 紐⑤컮???쒗듃 + ?곗뒪?ы넲 媛?대뜲 紐⑤떖 ?⑦꽩 = 紐⑤컮??UX ?곗꽑. ?쒖븞 ?곗륫 ?щ씪?대뱶???ν썑 ?섏씠吏蹂??듯듃??寃곗젙 ?ы빆 (admin-detail-modal.css ?대옒?ㅻ뒗 admin.css ???대? 諛뺤젣 ??`open` prop alias 異붽???蹂꾨룄 PR) | ??| 0 |

**?⑷퀎**: ?섏젙 6 ?뚯씪 / ?좉퇋 0 / ??+310 / -265 LOC.

#### ?몄텧泥??곹뼢 留ㅽ듃由?뒪 (props ?쒓렇?덉쿂 100% 蹂댁〈)
| 而댄룷?뚰듃 | ?몄텧泥?N | ?쒓렇?덉쿂 蹂寃?| ?뚭? |
|---------|---------|------------|------|
| AdminShell | 1 (layout.tsx ?좉퇋 ??Admin-1 諛뺤젣) | ??| 0 |
| AdminSidebar | 1 (layout.tsx) | 0 (roles 洹몃?濡? | 0 |
| AdminMobileNav | 1 (layout.tsx) | 0 (roles/user 洹몃?濡? | 0 |
| AdminPageHeader | 22 | breadcrumbs ?듭뀡 異붽? (default undefined / 湲곗〈 ?몄텧泥??곹뼢 0) | 0 |
| AdminStatusTabs | 7 | 0 (tabs/activeTab/onChange 洹몃?濡? | 0 |
| AdminDetailModal | 7 | 0 (蹂寃?0) | 0 |
| **?⑷퀎 ?몄텧泥?* | **39** | **0 breaking** | **0** |

#### Q 寃곗옱 ?ы빆 (PM/?ъ슜??寃곗옱 ??蹂?PR 吏꾪뻾 寃곗젙 ?섎ː??諛섏쁺)
- **?쒖븞 vs ?댁쁺 紐낆묶 異⑸룎 (`activeTab` vs `current`, `isOpen` vs `open`)**: ?댁쁺 蹂댁〈 (?몄텧泥?29 ?뚭? 0 ?곗꽑). ?쒖븞 紐낆묶 梨꾪깮 ???몄텧泥?29媛??쇨큵 蹂寃??꾩슂 ???댁쁺 ?곗꽑 寃곗젙
- **AdminDetailModal 紐⑤떖 ?뺥깭**: ?댁쁺 (紐⑤컮???쒗듃 + ?곗뒪?ы넲 媛?대뜲) 蹂댁〈. ?쒖븞 ?곗륫 ?щ씪?대뱶??admin.css ???대? ?대옒??諛뺤젣?????ν썑 ?섏씠吏蹂??듯듃??媛??- **AdminPageHeader breadcrumbs**: ?듭뀡 props ?좉퇋 異붽? (湲곗〈 ?몄텧泥??곹뼢 0). ?쒖븞 諛뺤젣 ?쇨???+ ?ν썑 wizard 吏꾩엯 ?섏씠吏?먯꽌 ?ъ슜 媛??- **layout.tsx UserMenu ?꾩튂**: AdminShell topbarRight slot ?듯빀 (PC `hidden lg:flex` ?쒖젙). 紐⑤컮?쇱? AdminMobileNav 媛 ?먯껜 泥섎━ (?쒕줈???곷떒 ?ъ슜??移대뱶)
- **sidebar.tsx Tailwind ??admin.css**: 湲곗〈 hidden lg:flex ??Tailwind ?띿꽦 紐⑤몢 ?쒓굅. admin.css ??`@media (max-width: 1024px)` 媛 display:none ?먮룞 泥섎━ ???쒓컖 ?숈씪 ?좎?

#### 寃利?寃곌낵
- `npx tsc --noEmit`: **0 ?먮윭 / 0 異쒕젰** (exitCode=0 / Lines=0)
- `npx vitest run` ?꾩껜: **921/921 PASS** (Admin-1 吏곹썑 918 ??+3 from PR-Live1~Live4 / ?뚭? 0)
- ?몄텧泥?grep ?뚭? ?뺤씤:
  - AdminStatusTabs `activeTab=` ?몄텧 7嫄????쒓렇?덉쿂 蹂댁〈 OK
  - AdminPageHeader `searchPlaceholder/searchName/searchDefaultValue` ?몄텧 ???쒓렇?덉쿂 蹂댁〈 OK
  - AdminDetailModal `isOpen/onClose/actions` ?몄텧 7嫄???蹂?PR 誘몃?寃?OK
  - AdminSidebar `roles=` / AdminMobileNav `roles=/user=` ??layout.tsx 1嫄?OK

#### ?쒓컖 寃利??곸뿭 (Admin-2 吏꾩엯 ??泥섏쓬 ?몄텧?섎뒗 ?좉퇋 ?쒓컖 ?⑦꽩)
- **?ъ씠?쒕컮**: BDR Red `--accent` 諛곌꼍 active ?쒖떆 (?쇱씠?? / inset 3px box-shadow active ?쒖떆 (?ㅽ겕). `.admin-aside__title` 洹몃９ ?ㅻ뜑 letter-spacing 0.12em uppercase 諛뺤젣
- **紐⑤컮???쒕줈??*: ?곗륫 ?щ씪?대뱶 ??data-open ?띿꽦 transition. ?곷떒 ?ъ슜??移대뱶 (?대땲???꾨컮? + ?대쫫 + ?대찓?? + 洹몃９??硫붾돱 + ?섎떒 ThemeSwitch + 留덉씠?섏씠吏 + ?ъ씠?몃줈 + 濡쒓렇?꾩썐
- **PageHeader**: `var(--ff-display)` Space Grotesk ??h1 + eyebrow uppercase letter-spacing 0.12em + subtitle var(--ink-mute)
- **StatusTabs**: 諛묒쨪 active + count 諭껋? (W=H ?먰삎 / 99+ ?ㅻ쾭?뚮줈???먮룞)
- **Dashboard StatCard**: 4 移대뱶 `.admin-stat-grid` ?먮룞 諛섏쓳??(紐⑤컮??1??/ 768+ 2??/ 1024+ 3??/ 1280+ 4????admin.css 誘몃뵒?댁옘由?. delta ?쇰꺼 誘몃컯??(?댁쁺 ?곗씠??誘몄〈?????ν썑 7d 利앷컧 諛뺤젣 ???쒖꽦)
- **Dashboard Chart**: ?쒖븞 `.admin-chart` 洹몃씪?곗씠??留됰?. 7??raw SQL 寃곌낵 蹂댁〈 + var(--accent) ?먮룞 ?ㅽ겕
- **Dashboard LogCard**: `.admin-log-row` data-severity ??(info/warning/error/success). ?댁쁺 admin_logs.severity ?먮룞 留ㅽ븨

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿**:
  (a) `/admin` 吏꾩엯 ??醫뚯륫 ?ъ씠?쒕컮 (lg+) admin-aside ?쒓컖 媛깆떊 ?뺤씤. ADMIN 諛곗? + 硫붾돱 洹몃９ ?ㅻ뜑 ?쒖떆
  (b) ?ъ씠?쒕컮 active 硫붾돱 `data-active="true"` ??accent-soft 諛곌꼍 (?쇱씠?? / accent inset shadow (?ㅽ겕)
  (c) ?곗긽??PC UserMenu ??topbar ?곗륫???듯빀 ?쒖떆 (`.admin-topbar` ??
  (d) 紐⑤컮??(<1024px) ??醫뚯긽???꾨쾭嫄?`.admin-mobile-toggle` ?대┃ ???곗륫 ?쒕줈???щ씪?대뱶. ?곷떒 ?ъ슜??移대뱶 + 洹몃９ 硫붾돱 + ?섎떒 ?명꽣
  (e) Dashboard 4 ?듦퀎 移대뱶 ??admin-stat-grid 諛섏쓳??(768/1024/1280 遺꾧린). ?대┃ 0 (delta 0 ???곗씠???놁쓣 ??誘몃컯??
  (f) Dashboard 李⑦듃 ??7??留됰? (admin_logs ?곗씠???놁쑝硫?紐⑤몢 0 ??理쒖냼 2% height fallback)
  (g) Dashboard 理쒓렐 5 ?쒕룞 ??admin_logs 理쒓렐 5嫄? severity ???됱긽 遺꾧린
  (h) ?몄텧泥?22 ?섏씠吏 ?뚭? ??`/admin/users` `/admin/tournaments` `/admin/games` ??媛??섏씠吏 吏꾩엯 ??AdminPageHeader / AdminStatusTabs / AdminDetailModal ?쒓컖 蹂寃?+ props ?숈옉 蹂댁〈
- **?뺤긽 ?숈옉**: admin ?곸뿭 ?쒓컖???쒖븞 v2.14 ?⑦꽩?쇰줈 ?듭씪?? 紐⑤뱺 admin ?섏씠吏 (29 ?뚯씪) ?뚭? 0 ??props ?쒓렇?덉쿂 蹂댁〈
- **二쇱쓽???낅젰**: (a) AdminPageHeader 寃??form ?ъ슜 ?섏씠吏 (`/admin/users` ??7嫄? ??寃???낅젰 + ?쒖텧 ??GET 荑쇰━ ?숈옉 洹몃?濡?(b) AdminStatusTabs ?ъ슜 ?섏씠吏 (`/admin/games` ??7嫄? ?????대┃ ??onChange ?뺤긽 ?몄텧 (c) AdminDetailModal ?ъ슜 ?섏씠吏 (`/admin/tournaments` ??7嫄? ??isOpen/onClose/actions ?숈옉 洹몃?濡?(蹂?PR 誘몃?寃?

?좑툘 reviewer 李멸퀬:
- **?댁쁺 蹂댁〈 ?곗꽑 寃곗젙**: ?쒖븞 v2.14 ??props 紐낆묶 (`current` / `open` / `footer`) vs ?댁쁺 (`activeTab` / `isOpen` / `actions`) ??**?댁쁺 ?곗꽑** 梨꾪깮. ?몄텧泥?29 ?뚭? 0 蹂댁옣 ?꾩닔 猷?- **AdminDetailModal 蹂?PR 誘몃?寃?寃곗젙**: ?댁쁺 ?몄텧泥?7嫄댁쓽 紐⑤컮???쒗듃 + ?곗뒪?ы넲 媛?대뜲 紐⑤떖 ?⑦꽩 = 紐⑤컮??UX 理쒖꽑. ?쒖븞 ?곗륫 ?щ씪?대뱶??admin.css ???대? 諛뺤젣?????ν썑 ?섏씠吏蹂??듯듃??媛?? 蹂?PR ?먯꽌???쒓컖 蹂寃?0 (?쒓렇?덉쿂 + ?숈옉 洹몃?濡?
- **?ъ씠?쒕컮 className 媛덉븘?롪린**: 湲곗〈 `.aside__link` (community-aside ? 怨듭쑀 湲濡쒕쾶 ?대옒?? ??`.admin-aside__link` (admin.css 諛뺤젣 ?대옒??. admin-news-content.tsx 媛 ?ъ쟾??`.aside__link` ?ъ슜 ??蹂?PR 誘몃?寃?(?ㅻⅨ ?섏씠吏 湲濡쒕쾶 ?대옒???섏〈 / ?뚭? 0)
- **AdminShell hideHeader ?듭뀡 ?ъ슜**: 紐⑤뱺 admin ?섏씠吏媛 ?먯껜 `<AdminPageHeader>` ?몄텧 ??AdminShell ???댁옣 ?ㅻ뜑??誘몄궗??(`hideHeader` props). children 留??뚮뜑留?- **紐⑤컮???꾨쾭嫄??꾩튂**: ?쒖븞 admin.css 媛 `top: 12px; left: 12px` 醫뚯긽??諛뺤젣 ???댁쁺 湲곗〈 ?곗긽??(top-3 right-3) ?먯꽌 蹂寃쎈맖. ?ъ슜??寃곗옱 ?꾩슂 ???꾩냽 commit ?쇰줈 ?곗긽??蹂듦? 媛??(admin.css L266 ?섏젙)
- **layout.tsx 留덉쭊 蹂寃?*: 湲곗〈 `lg:ml-64` ??64 (256px) ??admin.css `--admin-sidebar-width: 240px` ?쇰줈 誘몄꽭 李⑥씠. ?쒖븞 諛뺤젣媛?洹몃?濡??좎?
- **vitest 異붽? X**: ?쒓컖 諛뺤젣???⑥쐞 ?뚯뒪???대젮?. 湲곗〈 921 PASS ?뚭? 0 ?뺤씤?쇰줈 異⑸텇 (admin ?섏씠吏 ?듯빀 ?명봽??遺????湲곗〈 ?⑦꽩 洹몃?濡?

#### ?좎옱 ?꾪뿕 / 硫붾え
- **?ъ씠?쒕컮 ??admin-news-content ?대옒??遺꾧린**: admin-news-content.tsx 媛 ?ъ쟾??`.aside__link` (community-aside 怨듭쑀) ?ъ슜. admin ?곸뿭 ?덉뿉?????대옒?ㅺ? 怨듭〈 ???쒓컖 李⑥씠 諛쒖깮 媛?? ?꾩냽 ?ъ슜??寃곗옱 ??admin-news-content ??`.admin-aside__link` ?먮뒗 `.admin-status-tab` 濡??듭씪 媛??- **AdminShell topbarRight 紐⑤컮???щ’**: admin.css 媛 紐⑤컮??`.admin-topbar` 瑜??꾨쾭嫄??먮━濡??먯쑀 (`padding-left: 64px`). UserMenu ??`hidden lg:flex` 媛?쒕줈 紐⑤컮??鍮꾨끂異?蹂댁옣. AdminMobileNav ???쒕줈???곷떒 ?ъ슜??移대뱶媛 紐⑤컮??UserMenu ??븷
- **mx-auto max-w-7xl 諛뺤젣 蹂寃?*: 湲곗〈 layout.tsx ??`mx-auto max-w-7xl p-6 pt-16 lg:pt-2` 諛뺤젣 ??admin.css `.admin-main__inner` ??`max-width: var(--admin-main-maxw=1280px)` + padding 24px 諛뺤젣. 肄섑뀗痢??곸뿭 ?덈퉬 蹂??媛??(1280 ??1280 ?숈씪) / padding 24 ??24 ?숈씪. ?쒓컖 蹂??0 異붿젙
- **蹂?PR 誘명뫖??commit**: ?ㅻⅨ ?몄뀡??2f7ab2f (PR-Live1~Live4) ?꾩뿉 諛뺤젣. ?숈떆 諛뺤젣 異⑸룎 0 (admin ?곸뿭 vs score-sheet ?곸뿭 遺꾨━)

### PR4-UI 援ы쁽 (recorder_admin 諛쒓껄 寃쎈줈 諛뺤젣)

?뱷 援ы쁽 ?붿빟: recorder_admin/super_admin/?묓쉶 愿由ъ옄 ?ъ슜?먭? `/referee` 吏꾩엯 ??admin ?섏씠吏 諛쒓껄 寃쎈줈 0 (UX 媛? ?댁냼 ??(1) `/api/web/me` sentinel 12 permission ?먮룞 ?듦낵 fix + recorder_admin boolean ?꾨뱶 異붽? (2) referee ??쒕낫???곷떒 prominent CTA 移대뱶 (3) 鍮??꾨줈??遺꾧린 admin ?ъ슜???덈궡 蹂寃?(4) 紐⑤컮???섎떒 5踰덉㎏ ??"愿由ъ옄" 議곌굔遺 異붽?. DB 蹂寃?0 / Flutter v1 ?곹뼢 0. **PR3 遺??諛쒓껄 fix ?숇큺** ??sentinel role ??`PERMISSIONS[key].includes(admin.role)` ?꾪꽣?먯꽌 鍮?諛곗뿴 諛섑솚?섏뼱 super/recorder_admin ?ъ씠?쒕컮?먯꽌 permission 硫붾돱 李⑤떒?섎뜕 踰꾧렇.

#### 蹂寃??뚯씪 + LOC
| ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|------|------|----------|----|
| `src/app/api/web/me/route.ts` | (a) `SUPER_ADMIN_SENTINEL_ROLE` import + sentinel ??PERMISSIONS ?꾩껜 ???먮룞 遺??(b) `isRecorderAdmin` import + `recorder_admin: boolean` ?묐떟 ?꾨뱶 諛뺤젣 | ?섏젙 | +20 |
| `src/app/(referee)/referee/_components/referee-shell.tsx` | (a) `MeResponse` ???諛뺤젣 + `recorderAdmin` ?곹깭 遺꾨━ (b) `showAdminTab` ?먯젙 (c) 紐⑤컮??5踰덉㎏ ??"愿由ъ옄" 議곌굔遺 spread 諛뺤젣 | ?섏젙 | +30 |
| `src/app/(referee)/referee/page.tsx` | (a) `isRecorderAdmin` + `getAssociationAdmin` import (b) admin ?먯젙 Promise.all 蹂묐젹 (c) 鍮??꾨줈??遺꾧린 admin ?ъ슜???덈궡 蹂寃?(d) ?깅줉 ?곹깭?먯꽌???곷떒 CTA 移대뱶 ?몄텧 (e) `AdminEntryCard` 而댄룷?뚰듃 ?좉퇋 | ?섏젙 | +85 |

**?⑷퀎**: ?섏젙 3 ?뚯씪 / ?좉퇋 0 / ??135 LOC.

#### Q 寃곗옱 ?ы빆 (PM 異붿쿇 吏꾪뻾 ???ъ슜??寃利????뺤젙)
- **CTA ?꾩튂**: ??쒕낫???곷떒 (?ㅻ뜑 吏곹썑 + ?깅줉 ?곹깭/誘몃벑濡??곹깭 紐⑤몢 ?몄텧) ???묓쉶 留ㅼ묶 諛곕꼫蹂대떎 ??- **鍮??꾨줈??遺꾧린**: admin ?ъ슜??= "蹂몄씤 ?ы뙋 ?꾨줈???깅줉 (?좏깮)" ?덈궡濡??쇰꺼 蹂寃?+ ?곷떒 CTA 移대뱶 ?숈떆 ?몄텧 (?깅줉 媛뺤젣 X / ?듭뀡 ?덈궡)
- **紐⑤컮??*: 5踰덉㎏ ??"愿由ъ옄" 議곌굔遺 ?몄텧 (?꾨쾭嫄??????異붽? ???ъ씠?쒕컮 ?쇨???
- **API ?묐떟**: `/api/web/me` ??`recorder_admin: boolean` (snake_case 吏곸젒 諛뺤젣 ??`apiSuccess` ?먮룞 蹂???쇨? ?⑦꽩 ?곕씪媛?
- **PR3 sentinel fix ?숇큺**: `permissionKeys` ?꾪꽣?먯꽌 sentinel role 鍮?諛곗뿴 諛섑솚 踰꾧렇 ??12 permission ?꾩껜 ?먮룞 遺??(?뚭? 0 ???쇰컲 association_admin ?꾪꽣 洹몃?濡?

#### 寃利?寃곌낵
- `npx tsc --noEmit`: 0 ?먮윭 (湲곗〈 unrelated `wizard/association/page.tsx` Step type 1嫄??쒖쇅 ??蹂?PR 臾닿?)
- `npx vitest run` ?꾩껜: **918/918 PASS** (PR3 吏곹썑 873 ??洹????좉퇋 PR 異붽? 遺꾨웾 ?⑹궛 / ?뚭? 0)

#### ?뚭? 寃利?- **?쇰컲 user (鍮꾧?由ъ옄)**: `/referee` 吏꾩엯 ????鍮??꾨줈??遺꾧린 = 湲곗〈 EmptyState 洹몃?濡?/ 紐⑤컮??4??洹몃?濡?/ admin CTA ?몄텧 0 ??- **湲곗〈 ?묓쉶 愿由ъ옄**: 遺???④낵 = 蹂?PR ??admin CTA 移대뱶 ?몄텧 (?ъ씠?쒕컮 admin 硫붾돱 + 移대뱶 ?숈떆 ??諛쒓껄 寃쎈줈 媛뺥솕). isAdmin ?먯젙??`!!associationAdmin` 遺꾧린 諛뺤젣. ?ъ슜??寃곗옱 ?꾩슂 ??recorder_admin ?⑤룆?쇰줈 醫곹옄 ???덉쓬
- **湲곗〈 super_admin**: ?먮룞 ?≪닔 (`isRecorderAdmin` Q1 寃곗옱) ??admin CTA + 紐⑤컮??5踰덉㎏ ???몄텧 ??- **recorder_admin ?좉퇋**: ?ъ씠?쒕컮 (`/api/web/me` sentinel 12 permission ?듦낵) + ??쒕낫???곷떒 CTA + 鍮??꾨줈???덈궡 + 紐⑤컮??5踰덉㎏ ????4 諛쒓껄 寃쎈줈 紐⑤몢 ?몄텧 ??- **sentinel fix ?뚭? 媛??*: `admin-guard.test.ts` ??sentinel 12 permission 耳?댁뒪 (5)~(8) + (15)~(19) 紐⑤몢 PASS ??`/api/web/me` ?숈씪 猷?諛뺤젣濡??뺥빀 蹂댁옣

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿**: (a) recorder_admin 怨꾩젙 1 row UPDATE ??(b) `/referee` 吏꾩엯 ???곷떒??鍮④컙 醫뚯륫 border ??"愿由ъ옄 沅뚰븳???덉뒿?덈떎" 移대뱶 ?몄텧 ?뺤씤 (c) 移대뱶 ?대┃ ??`/referee/admin` 吏꾩엯 ?뺤씤 (d) ?ъ씠?쒕컮 (lg+) ??"愿由ъ옄" ?뱀뀡??9媛?admin ??ぉ ?몄텧 ?뺤씤 (e) 紐⑤컮??(< lg) ???섎떒 ??5媛??몄텧 (???꾨줈???먭꺽利??뺤궛/愿由ъ옄) (f) ?쇰컲 ?ъ슜??怨꾩젙 吏꾩엯 ??4??+ CTA 移대뱶 ?몄텧 0 (?뚭? 0 ?뺤씤)
- **?뺤긽 ?숈옉**: recorder_admin ???대뵒?쒕뱺 admin 吏꾩엯 媛??/ ?쇰컲 ?ъ슜???붾㈃ 蹂寃?0
- **二쇱쓽???낅젰**: 蹂몄씤 Referee ?꾨줈?꾩씠 **?녿뒗** recorder_admin ??湲곗〈 "?꾨줈???깅줉?섍린" ?붾㈃ ?꾩뿉 "蹂몄씤 ?ы뙋 ?꾨줈???깅줉 (?좏깮)" ?쇰꺼 + ?곷떒 admin CTA ?숈떆 ?몄텧 (admin 吏꾩엯 媛??紐낇솗 ?덈궡)

?좑툘 reviewer 李멸퀬:
- **sentinel fix ?섎룄**: `/api/web/me` ??`permissionKeys` ?꾪꽣媛 sentinel role ????鍮?諛곗뿴 諛섑솚 ??super/recorder_admin ?ъ씠?쒕컮?먯꽌 permission 硫붾돱 李⑤떒?섎뜕 PR3 遺??踰꾧렇. `hasPermission()` (admin-guard.ts L203) ??sentinel ?먮룞 ?듦낵 猷곌낵 ?뺥빀 諛뺤젣. ?뚭? 0 ???쇰컲 association_admin ? 湲곗〈 ?꾪꽣 洹몃?濡?
- **isAdmin ?먯젙 踰붿쐞**: recorder_admin OR ?묓쉶 愿由ъ옄 (`getAssociationAdmin() != null`). ?묓쉶 愿由ъ옄??admin CTA ?몄텧 = 遺???④낵 ???ъ슜??寃곗옱 ?꾩슂 ??recorder_admin ?⑤룆?쇰줈 醫곹옄 ???덉쓬 (?묓쉶 愿由ъ옄???대? ?ъ씠?쒕컮 諛쒓껄 寃쎈줈 ?덉쓬).
- **紐⑤컮??5??/ 6??遺꾧린**: showAdminTab = admin_info OR recorder_admin. 6??媛?μ꽦 ?놁쓬 (admin 1媛?異붽? / 5???곹븳). ?쇰컲 ?ъ슜?먮뒗 4??洹몃?濡?
- **AppNav frozen ?곹뼢 0**: referee ?뚮옯???낆옄 ????main AppNav 蹂寃??놁쓬.
- **API ?⑥묶 理쒖냼**: `/api/web/me` 1 ?꾨뱶 異붽? (recorder_admin) + 1 ?꾪꽣 fix (sentinel ?먮룞 ?듦낵). UI 諛뺤젣 + 1 ?쇱슦???묐떟 ??異붽?留?
- **vitest 異붽? X**: `/api/web/me` ?⑥쐞 ?뚯뒪?몃뒗 ?듯빀 ?명봽??遺?щ줈 ?ㅽ궢 (湲곗〈 ?⑦꽩 ??me route ?먯껜 ?뚯뒪???놁쓬). sentinel fix ??`admin-guard.test.ts` ??hasPermission sentinel 耳?댁뒪 (5)~(8) 濡??듭떖 猷?寃利앸맖.

#### ?좎옱 ?꾪뿕 / 硫붾え
- **遺???④낵 (?섎룄??**: ?묓쉶 愿由ъ옄??admin CTA 移대뱶 ?몄텧. 湲곗〈?먮뒗 ?ъ씠?쒕컮 硫붾돱留?諛쒓껄 寃쎈줈 ??移대뱶 異붽?濡?媛뺥솕. ?뚭? 0 (?ㅽ엳??UX 媛쒖꽑). ?ъ슜??寃곗옱 ?꾩슂 ??recorder_admin ?⑤룆?쇰줈 醫곹옄 ???덉쓬.
- **DB 0 異붽? ?쇱슫?쒗듃由?*: referee/page.tsx ??`getAssociationAdmin()` 異붽? (1 異붽? SELECT) ??`Promise.all` 蹂묐젹濡?referee 議고쉶? ?숈떆 ?ㅽ뻾 ??異붽? latency 0 (DB ?숈떆 泥섎━).
- **JWT 媛깆떊 ?꾩슂 (Q4 寃곗옱 ?좎?)**: recorder_admin 吏?????ъ슜??蹂몄씤 濡쒓렇?꾩썐?믪옱濡쒓렇???꾩슂 (湲곗〈 猷?洹몃?濡?. `isRecorderAdmin` ? session.admin_role ?됯? ??JWT 媛깆떊 ?꾧퉴吏 false 諛섑솚.

### PR4-FIX 吏꾨떒 + ?섏젙 (?ъ슜???쇰뱶諛?諛섏쁺 ??recorder_admin UI 寃고븿 3嫄?

?뱷 吏꾨떒 ?붿빟:
- 寃고븿 #1 (?ъ씠?쒕컮 鍮꾨끂異?: JWT stale ?⑥젙 ??`isRecorderAdmin(session)` 媛 JWT.admin_role 留??됯?. DB 諛뺤젣 ???щ줈洹몄씤 ???섎㈃ stale ??`getAssociationAdmin()` sentinel 誘몄쭊????me API admin=null ??adminInfo=null ???ъ씠?쒕컮 admin ?뱀뀡 0
- 寃고븿 #2 (Super Admin ?쇰꺼): 肄붾뱶 遺꾩꽍???뺥솗 (recorder_admin ?대㈃ "Recorder Admin" ?쒖떆?섏뼱????. 媛???먯씤 = stale JWT (怨쇨굅 isAdmin=true) ?먮뒗 ?ъ슜???몄슜 ?ㅻ쪟. fix = DB ground truth ?곗꽑 ?먯젙?쇰줈 stale JWT 臾닿? ?뺥솗 ?쒖떆
- 寃고븿 #3 (鍮좊Ⅸ 硫붾돱 遺議?: 肄붾뱶?먯꽌 ?뺤씤 ??quickLinks 諛곗뿴??2媛쒕쭔 諛뺤젣. 議댁옱?섎뒗 6 ?듭떖 admin ?섏씠吏 (諛곗젙/怨듦퀬/?쇱옄蹂??뺤궛/?④?/?쇨큵 ?깅줉) 誘몃컯??
#### 蹂寃??뚯씪 + LOC
| ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|------|------|---------|----|
| `src/app/api/web/me/route.ts` | (a) User select isAdmin/admin_role 異붽? (b) `recorderAdmin` DB ?대갚 (4 遺꾧린 OR) (c) `effectiveAdmin` 媛뺤젣 sentinel ??DB ground truth 媛 admin-like 硫?admin=null ?댁뼱??泥??쒖꽦 ?묓쉶 ?먮룞 ?좏깮 + sentinel role 諛뺤젣 (d) ?묐떟??`admin_role` ??異붽? | ?섏젙 | +35 |
| `src/app/(referee)/referee/admin/page.tsx` | (a) `prisma.user.findUnique` 異붽? (isAdmin/admin_role) (b) `superAdmin` / `recorderAdmin` ?먯젙 DB ?대갚 (OR 遺꾧린) (c) quickLinks 2 ??8 ?뺤옣 (諛곗젙/怨듦퀬/?쇱옄蹂??뺤궛/?④?/?쇨큵 ?깅줉 ?좉퇋 6) | ?섏젙 | +60 |

**?⑷퀎**: ?섏젙 2 ?뚯씪 / ?좉퇋 0 / ??95 LOC.

#### 吏꾨떒 寃곌낵 (?먯씤)
- **寃고븿 #1**: **JWT stale ?⑥젙** ??`is-recorder-admin.ts` L61~62 媛 `session.admin_role` JWT 留??됯?. JWT 留뚮즺 7???숈븞 DB 諛뺤젣 諛섏쁺 X. ?댁쁺 DB ?먯꽌 user_id=3431 ??admin_role="recorder_admin" ?뺤씤 (`scripts/_temp/check-user-3431.ts`) ?덉쑝???ъ슜??JWT ??諛뺤젣 ??諛쒓툒 ??stale ???ъ씠?쒕컮 admin 硫붾돱 0
- **寃고븿 #2**: **stale JWT 媛???먯씤** ??肄붾뱶 遺꾩꽍??entryRole 遺꾧린 ?뺥솗 (admin/page.tsx L60 = recorder_admin). ?ъ슜??蹂닿퀬 "Super Admin" ?쇰꺼? (a) stale JWT (b) ?몄슜 ?ㅻ쪟 ????媛?? fix = DB ground truth ?곗꽑 ?먯젙?쇰줈 stale JWT 臾닿? 蹂댁옣
- **寃고븿 #3**: **諛뺤젣 ?꾨씫** ??admin/page.tsx L158~171 quickLinks 諛곗뿴??2媛쒕쭔. ?섏씠吏??8 ?듭떖 admin ?쇱슦??紐⑤몢 議댁옱 (Glob ?뺤씤) ??鍮좊Ⅸ 硫붾돱 吏꾩엯 移대뱶 諛뺤젣 遺議?
#### Q 寃곗옱 ?ы빆 (debugger 沅뚭퀬 ??PM/?ъ슜??寃곗옱 ???뺤젙)
- **DB ?대갚 vs JWT 媛깆떊**: 蹂?fix = DB ?대갚 (利됱떆 + ?덉쟾). ?꾩냽 PR ??= JWT 媛뺤젣 留뚮즺 (admin_role 蹂寃????먮룞 ?щ줈洹몄씤 ???댁쁺 ?먮룞??
- **泥??쒖꽦 ?묓쉶 ?먮룞 ?좏깮**: me API ??`effectiveAdmin` 媛뺤젣 sentinel = admin-guard.ts ??sentinel 遺꾧린 (L144~167) ? ?숈씪 濡쒖쭅 移댄뵾 ??1李?source (admin-guard) 蹂寃?????(?뚭? ?꾪뿕 ?뚰뵾)
- **quickLinks 8媛?*: ?뺤궛 ??쒕낫??/ ?ㅼ젙 2媛쒕뒗 ?ъ씠?쒕컮留?諛뺤젣 (鍮좊Ⅸ 硫붾돱 誘몃컯????8 移대뱶 lg:grid-cols-2 = 4??媛吏??

#### 寃利?寃곌낵
- `npx tsc --noEmit`: **0 ?먮윭** (?뚭? 0)
- `npx vitest run`: **921/921 PASS** (PR4-UI 吏곹썑 921 ?숈씪 / ?뚭? 0)

#### ?뚭? 寃利?- **?쇰컲 user (鍮꾧?由ъ옄)**: DB.isAdmin=false / DB.admin_role=null ???대갚 遺꾧린 false ??湲곗〈 ?숈옉 洹몃?濡?(admin=null / adminInfo=null / recorder_admin=false / ?ъ씠?쒕컮 蹂몄씤 硫붾돱留? ??- **super_admin (DB.isAdmin=true)**: DB ?대갚?쇰줈 effectiveAdmin sentinel 梨꾩? 蹂댁옣 ??JWT stale ?댁뼱???ъ씠?쒕컮 admin ?뱀뀡 ?몄텧 + entryRole="super_admin" ??"Super Admin 沅뚰븳 吏꾩엯" ?뺥솗 ?쒖떆 ??- **recorder_admin (DB.admin_role="recorder_admin" / JWT stale)**: DB ?대갚?쇰줈 effectiveAdmin sentinel 梨꾩? + admin/page.tsx entryRole="recorder_admin" ??"Recorder Admin 沅뚰븳 吏꾩엯" ?뺥솗 ?쒖떆 + ?ъ씠?쒕컮 admin ?뱀뀡 12 permission ?몄텧 + 鍮좊Ⅸ 硫붾돱 8媛???- **?묓쉶 愿由ъ옄 (湲곗〈 association_admin)**: 湲곗〈 ?숈옉 蹂댁〈 ??`admin` 蹂?섍? ?뺤긽 梨꾩썙吏誘濡??대갚 遺꾧린 誘몄쭊?? sg/refchief/staff ??role 留ㅼ묶 洹몃?濡???
#### errors.md 諛뺤젣 ??ぉ
- `[2026-05-15] recorder_admin ?ъ씠?쒕컮 admin ?뱀뀡 鍮꾨끂異?= JWT stale ?⑥젙 (PR4-UI ?ъ슜??蹂닿퀬 fix)` ??JWT stale ?⑥젙 + DB ground truth ?대갚 ?쒖? + role 蹂寃????щ줈洹몄씤 ?덈궡 ?섎Т + JWT 媛뺤젣 留뚮즺 ?꾩냽 PR ??
#### ?ъ슜???꾩냽 寃利??ы빆
1. **濡쒓렇?꾩썐 ???щ줈洹몄씤 沅뚯옣**: 蹂?fix ??stale JWT ???듦낵?쒗궎?꾨줉 DB ?대갚 諛뺤젣. 洹몃윭???대┛ 寃利??꾪빐 user_id=3431 蹂몄씤????踰덉? 濡쒓렇?꾩썐?믪옱濡쒓렇??沅뚯옣 (JWT 媛깆떊 ??DB.admin_role 諛섏쁺)
2. **?ъ씠?쒕컮 寃利?* (lg+): /referee 吏꾩엯 ??醫뚯륫 ?ъ씠?쒕컮 = 蹂몄씤 7??ぉ + "愿由ъ옄" ?뱀뀡 + 9 admin ??ぉ (愿由ъ옄/諛곗젙 愿由?怨듦퀬 愿由??쇨큵 ?깅줉/?쇱옄蹂??댁쁺/?뺤궛 愿由??뺤궛 ??쒕낫??諛곗젙鍮??④?/?ㅼ젙) ?몄텧
3. **admin ?섏씠吏 ?쇰꺼 寃利?*: /referee/admin 吏꾩엯 ???곷떒 ?덈궡 諛뺤뒪 "**Recorder Admin** 沅뚰븳 吏꾩엯" ?쒖떆 (Super Admin ?꾨떂 ??DB ?대갚?쇰줈 蹂댁옣)
4. **鍮좊Ⅸ 硫붾돱 8媛?寃利?*: /referee/admin 吏꾩엯 ??"鍮좊Ⅸ 硫붾돱" ?곸뿭 8媛?移대뱶 ?몄텧 (?ы뙋 愿由?/ 諛곗젙 愿由?/ 怨듦퀬 愿由?/ ?쇱옄蹂??댁쁺 / ?뺤궛 愿由?/ 諛곗젙鍮??④? / ?쇨큵 ?깅줉 / Excel ?쇨큵 寃利?
5. **?뚭? 寃利?*: ?쇰컲 ?ъ슜??/ ?묓쉶 愿由ъ옄 / super_admin 吏꾩엯 ??湲곗〈 ?숈옉 蹂寃?0 ?뺤씤
6. **?꾩떆 ?ㅽ겕由쏀듃 ?뺣━**: `scripts/_temp/check-user-3431.ts` ??젣 (?댁쁺 DB credentials ?몄텧 諛⑹? ???댁쁺 ?덉쟾 猷?

## 援ы쁽 湲곕줉 (developer) ??PR-Live1~Live4 (?쇱씠釉?湲곕줉 吏꾩엯??+ ?쒕툝由???ㅽ겕由? ??2026-05-15

?뱷 援ы쁽 ?붿빟: ?쇱씠釉??섏씠吏 (/live/[matchId]) ?댁쁺??湲곕줉??諛쒓껄 寃쎈줈 諛뺤젣 + score-sheet ??ㅽ겕由??먮룞 吏꾩엯 + 紐낆떆 toggle 踰꾪듉. ?ъ슜??寃곗옱 Q1~Q7 沅뚭퀬??100% ?곸슜. Flutter v1 / DB schema 蹂寃?0. Phase 23 PR-RO + PR-EDIT ?곹뼢 0.

### PR 蹂?蹂寃??뚯씪 + LOC

| PR | ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|----|------|------|----------|----|
| **PR-Live1** | `src/app/api/web/tournaments/[id]/score-sheet-access/route.ts` | GET handler ??boolean 寃뚯씠??endpoint (super_admin / recorder_admin / organizer / TAM / recorder 5 遺꾧린 + 誘몃줈洹몄씤 silent 200) | ?좉퇋 | ~100 |
| **PR-Live2** | `src/app/live/[id]/page.tsx` | (a) `import Link from "next/link"` (b) `canRecord` state + useEffect fetch (c) toolbar ??"湲곕줉?섍린" Link 2嫄?(sm ?띿뒪???꾩씠肄?/ 紐⑤컮???꾩씠肄섎쭔) ??var(--color-primary) 媛뺤“ | ?섏젙 | +50 |
| **PR-Live3** | `src/app/(score-sheet)/_components/body-scroll-lock.tsx` | ?좉퇋 client 而댄룷?뚰듃 ??mount ??`body.style.overflow="hidden"` / cleanup ??蹂듭썝 / DOM 0 effect ?꾩슜 | ?좉퇋 | ~50 |
| **PR-Live3** | `src/app/(score-sheet)/layout.tsx` | (a) `BodyScrollLock` import + 留덉슫??(b) `export const viewport` ?좉퇋 (width device-width + initialScale 1 + viewportFit cover) | ?섏젙 | +15 |
| **PR-Live4** | `src/app/(score-sheet)/_components/fullscreen-toggle.tsx` | ?좉퇋 client 而댄룷?뚰듃 ??`document.fullscreenElement` state + `fullscreenchange` listener + onClick try-catch (iPhone silent fail) + Material Symbols `fullscreen` / `fullscreen_exit` 遺꾧린 | ?좉퇋 | ~80 |
| **PR-Live4** | `src/app/(score-sheet)/layout.tsx` | (a) `FullscreenToggle` import (b) header gap-1 (c) ThemeToggle 醫뚯륫??FullscreenToggle 留덉슫??| ?섏젙 | +5 |

**?⑷퀎**: ?좉퇋 3 + ?섏젙 2 / ??~300 LOC.

### ?좉퇋 endpoint 沅뚰븳 留ㅽ듃由?뒪 (PR-Live1)

| Role | canRecord | canEdit | 鍮꾧퀬 |
|------|-----------|---------|-----|
| super_admin | true | true | sentinel ?먮룞 ?듦낵 / DB 異붽? 議고쉶 skip |
| recorder_admin (?꾩뿭) | true | false | recorder ?먮룞 ?≪닔 ?섎????숈씪 ???섏젙 沅뚰븳 ??|
| tournament.organizerId | true | true | 蹂?????댁쁺??|
| tournament_admin_members (isActive=true) | true | true | TAM ?댁쁺吏?|
| tournament_recorders (isActive=true) | true | false | 湲곕줉?????섏젙 沅뚰븳 蹂댁닔????|
| 洹???/ 誘몃줈洹몄씤 | false | false | silent 200 (?쇱씠釉??섏씠吏 怨듦컻 猷??뺥빀) |

### ??ㅽ겕由?吏꾩엯 ?먮쫫 (PR-Live3 + PR-Live4)

| ?④퀎 | ?숈옉 | 而댄룷?뚰듃 |
|------|------|---------|
| (1) ?먮룞 吏꾩엯 | mount ??`body.style.overflow="hidden"` set (?묒떇 ???ㅽ겕濡?李⑤떒) | BodyScrollLock |
| (2) viewport ?뺥빀 | `viewport.viewportFit=cover` ??iOS Safari safe-area / ?덈뱶濡쒖씠??system bar ?곸뿭 ?뚯닔 媛??| layout.tsx export const viewport |
| (3) 紐낆떆 吏꾩엯 | thin bar ?곗긽??FullscreenToggle ?대┃ ??`documentElement.requestFullscreen()` (try-catch) | FullscreenToggle |
| (4) ?몃? 蹂??異붿쟻 | `fullscreenchange` listener ???꾩씠肄?/ aria-label ?먮룞 ?숆린??| FullscreenToggle |
| (5) ?댁젣 | ESC / 蹂?踰꾪듉 ?ы겢由?/ ?섏씠吏 ?좊궓 (cleanup) ??Q7 ?ъ슜??紐낆떆 猷?| FullscreenToggle + BodyScrollLock cleanup |
| (6) iPhone silent fail | Fullscreen API 誘몄?????try-catch silent fail (alert/console.error 0) | FullscreenToggle |

### 寃利?寃곌낵

| # | 紐낅졊 | 寃곌낵 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** / ?먮윭 0 (愿??unrelated ?먮윭 0) |
| 2 | `npx vitest run` | **921/921 PASS** / ?뚭? 0 |
| 3 | grep `score-sheet-access` in route + ?쇱씠釉?page | ???묒そ 留ㅼ튂 |
| 4 | grep `canRecord` in ?쇱씠釉?page | ??7 occurrences |
| 5 | grep `requestFullscreen` in FullscreenToggle | ??留ㅼ튂 |

### ?댁쁺 ?숈옉 蹂댁〈 (?뚭? 寃利?留ㅽ듃由?뒪)

| # | 耳?댁뒪 | 寃곌낵 |
|---|-------|------|
| 1 | ?쇰컲 ?뚯썝 / ?듬챸 | canRecord=false ??湲곕줉?섍린 踰꾪듉 誘몃끂異???|
| 2 | recorder | canRecord=true ??踰꾪듉 ?몄텧 + score-sheet 吏꾩엯 ?뺤긽 ??|
| 3 | super_admin / organizer / TAM / recorder_admin | 踰꾪듉 ?몄텧 + score-sheet 吏꾩엯 ?뺤긽 ??|
| 4 | ?쇱씠釉??섏씠吏 ?꾩떆踰덊샇 / ?ㅽ겕紐⑤뱶 / ?볤? / 諛뺤뒪?ㅼ퐫??/ YouTube ?꾨쿋??/ PIP | 蹂寃?0 ??|
| 5 | score-sheet layout ??thin bar / RotationGuard / ToastProvider | 蹂댁〈 (FullscreenToggle ??以?異붽?留? ??|
| 6 | ??ㅽ겕由??댁젣 ??ESC / 踰꾪듉 / ?섏씠吏 ?좊궓 cleanup | listener + unmount cleanup 蹂댁옣 ??|
| 7 | Flutter v1 API / DB schema | ?곹뼢 0 (?좉퇋 endpoint = web ?꾩슜 / schema 蹂寃?0) ??|
| 8 | Phase 23 PR-RO + PR-EDIT (commit fab2697 / 223f7f0) | ?곹뼢 0 (蹂꾨룄 沅뚰븳 ?ы띁 ??蹂?endpoint ? 臾닿?) ??|

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿**:
  1. recorder ?먮뒗 super_admin 怨꾩젙 濡쒓렇????`/live/{matchId}` 吏꾩엯 ??toolbar ??鍮④컙 "湲곕줉?섍린" 踰꾪듉 (?곗뒪?ы깙) / 鍮④컙 ?꾩씠肄섎쭔 (紐⑤컮?? ?몄텧 ?뺤씤
  2. 踰꾪듉 ?대┃ ??`/score-sheet/{matchId}` 吏꾩엯 ??thin bar ?곗긽??`fullscreen` ?꾩씠肄?+ `ThemeToggle` ?몄텧 ?뺤씤
  3. score-sheet ?섏씠吏 吏꾩엯 吏곹썑 body ?ㅽ겕濡??좉툑 (?묒떇 ???곸뿭 留덉슦?ㅽ쑀 / ?곗튂 ?ㅼ??댄봽 臾대컲?? ?뺤씤
  4. fullscreen 踰꾪듉 ?대┃ ????ㅽ겕由?吏꾩엯 + ?꾩씠肄?`fullscreen_exit` ?쇰줈 蹂寃??뺤씤
  5. ESC ??????ㅽ겕由??댁젣 + ?꾩씠肄?`fullscreen` ?쇰줈 蹂듦? ?뺤씤 (?몃? 蹂??listener 寃利?
  6. score-sheet ?섏씠吏 ?좊굹湲?(釉뚮씪?곗? ?ㅻ줈媛湲? ??body ?ㅽ겕濡?蹂듭썝 ?뺤씤 (cleanup 寃利?
  7. iPhone Safari 吏꾩엯 ????ㅽ겕由?踰꾪듉 ?대┃ ???먮윭 alert 0 / ?붾㈃ 蹂??0 (silent fail 寃利?
  8. ?쇰컲 ?ъ슜??/ 誘몃줈洹몄씤 ??`/live/{matchId}` 吏꾩엯 ??"湲곕줉?섍린" 踰꾪듉 ?몄텧 0 (canRecord:false 蹂댁옣)
- **?뺤긽 ?숈옉**: ?쇱씠釉??섏씠吏 = 湲곗〈 ?꾩떆踰덊샇 ?놁뿉 鍮④컯 媛뺤“ 踰꾪듉 / score-sheet = thin bar ?곗긽????ㅽ겕由??좉? + ?먮룞 body lock
- **二쇱쓽???낅젰**: paper 留ㅼ튂 + flutter 留ㅼ튂 ????踰꾪듉 ?몄텧 (Q4 mode 臾닿? ??score-sheet ?덈궡 ?붾㈃???먮룞 泥섎━). flutter 留ㅼ튂?먯꽌 ?대┃ ??score-sheet ?덈궡 ?섏씠吏濡??먮룞 遺꾧린.

?좑툘 reviewer 李멸퀬:
- **沅뚰븳 留ㅽ듃由?뒪 ?⑥씪 source**: 蹂?endpoint = `requireScoreSheetAccess` (require-score-sheet-access.ts) ??沅뚰븳 遺꾧린 猷곗쓣 洹몃?濡??몃씪??carry. throw ????(boolean 留?諛섑솚 / silent fail) ??admin-check ?⑦꽩 ?뺥빀.
- **DB ?쇱슫?쒗듃由??⑥쑉**: super_admin ?듦낵 ??DB 議고쉶 0 (sentinel ?먮룞) / 洹??몃뒗 tournament SELECT 1 + parallel(TAM + recorder) SELECT 1 = 理쒕? 2 ?쇱슫?쒗듃由?(admin-check 蹂대떎 1 異붽? ??recorder 寃利?.
- **camelCase ??snake_case 蹂??*: `apiSuccess({ canRecord, canEdit })` ???먮룞 蹂?섏쑝濡??대씪媛 `data.can_record / data.can_edit` ?묎렐. ?덉쟾 ?대갚 (`?? data.canRecord`) 異붽??섏뿬 raw ?묐떟 fallback ?뺥빀.
- **viewport meta override**: route group `(score-sheet)` ??`export const viewport` 媛 root layout ??viewport 瑜??먮룞 override (Next.js 14+ App Router 湲곕낯 ?숈옉). ?ㅻⅨ route ?곹뼢 0.
- **body overflow cleanup**: previous 媛?蹂댁〈 + unmount 蹂듭썝 (?ㅻⅨ inline ?ㅽ겕由쏀듃媛 ?ъ쟾??諛뺤? 媛??뺥빀). ?쇰컲?곸쑝濡?""濡?蹂듭썝??
- **FullscreenToggle silent fail**: try-catch 濡?iPhone / 沅뚰븳 嫄곕? / 鍮?user-gesture ?몄텧 紐⑤몢 silent 泥섎━. console.error / alert 0 (?댁쁺???낅젰 ?먮쫫 蹂댄샇).
- **AppNav frozen ?곹뼢 0**: score-sheet route group 寃⑸━ ??main AppNav 蹂寃??놁쓬. ?쇱씠釉??섏씠吏 toolbar = 湲곗〈 ?ㅻ뜑 ?곸뿭 (AppNav ? 蹂꾧컻).

#### ?좎옱 ?꾪뿕 / 硫붾え
- **paper 留ㅼ튂 vs flutter 留ㅼ튂 踰꾪듉 ?몄텧 ?쇨???*: Q4 寃곗옱 = mode 臾닿? ?몄텧. flutter 留ㅼ튂 ?대┃ ??score-sheet ?덈궡 ?섏씠吏媛 遺꾧린 泥섎━ ???ъ슜??UX ?쇨????곗꽑. ?꾩냽 寃곗옱濡?mode 遺꾧린 異붽? 媛??(媛꾨떒 ??`match.settings.recording_mode === "paper"` 遺꾧린 1以?.
- **canRecord vs canEdit ?묐떟 ??遺꾨━**: ?꾩옱 ?쇱씠釉??섏씠吏??`canRecord` 留??ъ슜. `canEdit` ? ?ν썑 ?쇱씠釉??섏씠吏?먯꽌 "?섏젙 紐⑤뱶" 踰꾪듉 ?몄텧 ???ъ슜 媛??(Phase 23 PR-EDIT ?먮쫫 ?뺥빀).
- **fullscreen 沅뚯옣 ?섍꼍**: iPad / Android ?쒕툝由??몃줈 ??Q6 RotationGuard 媛 媛濡?李⑤떒?쇰줈 媛뺤젣 ?뺥빀. iPhone = silent fail (UI 蹂??0).

## ?뚯뒪??寃곌낵 (tester)
(Phase 2 ?꾨즺 ???쒓컖 寃利?諛뺤젣)

## 由щ럭 寃곌낵 (reviewer)
(?꾩슂 ??諛뺤젣)

## ?섏젙 ?붿껌
| ?붿껌??| ???| 臾몄젣 | ?곹깭 |
|--------|-----|-----|------|

## ?묒뾽 濡쒓렇 (理쒓렐 10嫄?
| ?좎쭨 | ?묒뾽 | 寃곌낵 |
|------|------|------|
| 2026-05-15 | PR-G5.5-followup 코드 박제 — advanceTournamentPlaceholders + getTournamentStandings + vitest 5 + 매치 232 UPDATE 스크립트 | 신규 함수 2 (옵션 A 분리 — 기존 advanceDivisionPlaceholders 회귀 0) / vitest 5/5 PASS (case 1 정상 + case 2 idempotent + case 3 notes 위반 + case 4 절반 NULL + getTournamentStandings 1) / 전체 vitest 926/926 PASS / tsc 0 / 신규 2 + 수정 1 / ~577 LOC / 운영 DB UPDATE 0 (스크립트 작성만 — PM 결재 후 실행) / Flutter v1 영향 0 / schema 변경 0 / tester+reviewer 병렬 검증 대기 |
| 2026-05-15 | PR-G5.5-followup 기획설계 — 4차 BDR 뉴비리그 (Tournament 443f23f8 / 5/16) 단판 결승 매치 232 placeholder 박제 자동화 + Tournament 단위 applier 분리 결정 | 설계 완료 / developer 진입 대기. 신규 advanceTournamentPlaceholders + getTournamentStandings (옵션 A 분리) / 매치 232 UPDATE SQL spec + vitest 4 케이스 명세 + 회귀 검증 (강남구 4 종별 영향 0) / decisions.md +1 항목 / 후속 PR 큐 4건. 5/16 마감 |
| 2026-05-15 | PR-Live1~Live4 ?쇱씠釉?湲곕줉 吏꾩엯??+ ?쒕툝由??몃줈 ??ㅽ겕由?(Q1~Q7 沅뚭퀬?? | ???좉퇋 3 + ?섏젙 2 / ~300 LOC / tsc 0 / vitest 921/921 PASS / score-sheet-access endpoint (5 沅뚰븳 遺꾧린) + ?쇱씠釉?toolbar "湲곕줉?섍린" Link + score-sheet body overflow lock + FullscreenToggle 紐낆떆 踰꾪듉 / Flutter v1 ?곹뼢 0 / DB schema 蹂寃?0 / commit 寃곗옱 ?湲?|
| 2026-05-15 | Phase 7 A PR2+PR3 E2E ?쒕굹由ъ삤 2 (?뚯감 蹂듭젣) + ?쒕굹由ъ삤 3 (1?뚯꽦 ??? 諛뺤젣 | ???좉퇋 2 + ?섏젙 1 / ~418 LOC / tsc 0 / vitest 921/921 PASS / ?댁쁺 肄붾뱶 蹂寃?0 / ?댁쁺 DB ?곹뼢 0 (?ㅽ뻾? ?ъ슜??寃利? / fixtures ?쒕뱶 ?ы띁 2 ?뺤옣 / commit 寃곗옱 ?湲?|
| 2026-05-15 | Phase 23 PR-EDIT1~EDIT4 醫낅즺 留ㅼ튂 ?섏젙 紐⑤뱶 蹂꾨룄 湲곕뒫 (Q3~Q8 沅뚭퀬?? | ???섏젙 4 ?뚯씪 / +~370 LOC / tsc 0 / vitest 236/236 / canEdit (super/organizer/TAM) + isEditMode state + edit_mode body ?고쉶 + audit "completed_edit_resubmit" + ?섏젙 ?대젰 inline (Q7 ?듭뀡 A ??留ㅼ튂 ?곸꽭 ?섏씠吏 誘몄〈?щ줈 score-sheet ?몃씪?? / commit 寃곗옱 ?湲?|
| 2026-05-15 | Admin-1 Phase components/admin/* 10 而댄룷?뚰듃 諛뺤젣 (?쒖븞 v2.14) | ???좉퇋 6 + ?섏젙 1 / ~1744 LOC / tsc 0 / admin.css + ?좉퇋 5 而댄룷?뚰듃 / 媛깆떊 5 蹂대쪟 (?몄텧泥?29 ?뚯씪 蹂댁〈) / Admin-2 寃곗옱 ?湲?|
| 2026-05-15 | PR4-FIX recorder_admin UI 寃고븿 3嫄?吏꾨떒+?섏젙 (?ъ씠?쒕컮/Super Admin ?쇰꺼/鍮좊Ⅸ 硫붾돱) | ???섏젙 2 ?뚯씪 / +95 LOC / tsc 0 / vitest 921/921 PASS / DB ground truth ?대갚 諛뺤젣 (JWT stale ?⑥젙 ?곴뎄 李⑤떒) / ?뚭? 0 / errors.md 諛뺤젣 / commit 寃곗옱 ?湲?|
| 2026-05-15 | Phase 23 PR-RO1~RO4 醫낅즺 留ㅼ튂 read-only 李⑤떒 (5 怨꾩링 諛⑹뼱 諛뺤젣) | ???섏젙 7 ?뚯씪 / ~131 LOC / tsc 0 / vitest 236/236 PASS / ?댁쁺 ?숈옉 8 耳?댁뒪 蹂댁〈 / Q1~Q8 沅뚭퀬??諛뺤젣 / commit 寃곗옱 ?湲?|
| 2026-05-15 | `.git/index` ?먯긽 蹂듦뎄 + ?ㅻⅨ ?몄뀡 誘몄빱諛?5 ?뚯씪 WIP commit 遺꾨━ (0853927) | ??score-sheet + me + association-wizard 78 lines 諛뺤젣 / admin sync ??working tree clean ?뺣낫 / 蹂??섎ː 짠2 Phase 0 ?ㅼ젣 ?꾩슂?덉쓬 (?섎ː??媛??留욎쓬) |
| 2026-05-15 | Phase 6 PR2 ?묓쉶 留덈쾿??蹂몄껜 (Step 1~3 + WizardShell + sessionStorage + 吏꾩엯 移대뱶) | ??79e72de ??super_admin ?꾩슜 / Q4 寃곗옱 ?곸슜 |
| 2026-05-15 | Phase 6 PR1 ?묓쉶 留덈쾿??API 3 endpoint | ??39e7aab ??Association/Admin/FeeSetting 3 ?쇱슦??|
| 2026-05-15 | PR-G5 ?吏꾪몴 ?앹꽦湲?placeholder 諛뺤젣 ?먮룞??(媛뺣궓援??ш퀬 ?곴뎄 李⑤떒) | ??eba655d + 72b818b ??6 format 蹂닿컯 / ?ы띁 諛뺤젣 |

## 援ы쁽 湲곕줉 (developer) ??Phase 6 PR3 Referee Step 4 (2026-05-15)

?뱷 援ы쁽??湲곕뒫: ?묓쉶 留덈쾿??Step 4 (?듭뀡) Referee ?ъ쟾 ?깅줉 + `POST /api/web/admin/associations/[id]/referees` ?좉퇋. 諛곗튂 ?깅줉 (createMany skipDuplicates) / 鍮?諛곗뿴 ?덉슜 (skip 吏꾪뻾) / Q7 寃곗옱 = ?먭꺽踰덊샇 1李?誘멸?利?諛뺤젣. 留덈쾿??progress 4 step ??5 step ?뺤옣 (4=referee / 5=?뺤씤). 鍮?諛곗뿴????API ?몄텧 0 (?댁쁺 DB 遺??媛??.

| ?뚯씪 寃쎈줈 | 蹂寃??댁슜 | ?좉퇋/?섏젙 | LOC |
|----------|----------|----------|-----|
| `src/app/api/web/admin/associations/[id]/referees/route.ts` | POST 諛곗튂 ?깅줉 ??Zod referees[] (name min 2 / ?섎㉧吏 ?좏깮) + association 議댁옱 ?뺤씤 (404) + 鍮?諛곗뿴 skip (200) + createMany skipDuplicates + ?묐떟 created_count + ?쇰? 而щ읆 誘몃━蹂닿린 | ?좉퇋 | ~135 |
| `src/app/(admin)/.../wizard/association/_components/Step4RefereeRegister.tsx` | ?숈쟻 row 異붽? UI (諛곗뿴) ??鍮??곹깭 ?덈궡 + row 1嫄??⑥쐞 add/remove + 4 input (name ?꾩닔 / license/region/contact ?좏깮) + Q7 ?덈궡 諛뺤뒪 | ?좉퇋 | ~195 |
| `src/lib/tournaments/association-wizard-types.ts` | RefereeInput interface + AssociationWizardDraft.referees: RefereeInput[] + current_step 1\|2\|3\|4\|5 + AssociationRefereesCreateResponse | ?섏젙 | +35 |
| `src/lib/tournaments/association-wizard-constants.ts` | ASSOCIATION_WIZARD_STEPS 5 entries (4=sports / 5=check_circle) + INITIAL_DRAFT.referees: [] | ?섏젙 | +5 |
| `src/app/(admin)/.../wizard/association/page.tsx` | Step4RefereeRegister import + canProceedAtStep 5 step ?뺤옣 (Step 4: row 0 = ?듦낵 / row 1+ = 紐⑤뱺 name min 2) + handleNext/Prev 1~5 + handleSubmit 4踰덉㎏ referees POST (鍮?諛곗뿴 ??skip) + step 5 = WizardConfirm | ?섏젙 | +50 |
| `src/app/(admin)/.../wizard/association/_components/WizardShell.tsx` | currentStep prop 1\|2\|3\|4\|5 + isLastStep = currentStep === 5 (progress ?먮룞 5 column ??ASSOCIATION_WIZARD_STEPS map) | ?섏젙 | +3 |
| `src/app/(admin)/.../wizard/association/_components/WizardConfirm.tsx` | Step 4 Referee section 異붽? (draft.referees ?쒖떆 / 鍮?諛곗뿴 ??skip 硫붿떆吏 / ?깅줉 ??#/?대쫫/?먭꺽踰덊샇/吏??list) + ?덈궡 諛뺤뒪 ?숈쟻 (referees > 0 ??"?ы뙋 ?ъ쟾 ?깅줉" ?④퀎 異붽?) | ?섏젙 | +47 |
| `src/__tests__/api/association-wizard.test.ts` | PrismaMocks ??refereeCreateMany/refereeFindMany 異붽? + 耳?댁뒪 9 (?뺤긽 3嫄?/ createMany ?몄텧 寃利? + 耳?댁뒪 10 (鍮?諛곗뿴 / createMany ?몄텧 ???? + 耳?댁뒪 11 (association 遺????404) | ?섏젙 | +135 |

**珥??좉퇋 2 + ?섏젙 6 / ~605 LOC** (?덉긽 ~300 LOC ?鍮?+100% ??Step4 而댄룷?뚰듃 ? UI + ?묐떟 誘몃━蹂닿린 而щ읆 + vitest 3 耳?댁뒪 ? 而ㅻ쾭).

?썳截??곸슜??媛??
- **schema 蹂寃?0**: Referee 紐⑤뜽 (v3 user_id nullable / registered_name/license_number @unique / match_status default unmatched) ?대? ?댁쁺 諛뺤젣 ??`prisma db push` ?몄텧 0嫄?
- **Q7 1李?誘멸?利?*: createMany ??verifiedAt 而щ읆 誘몄〈????match_status="unmatched" + user_id=null + 寃利??뚮옒洹?0 諛뺤젣.
- **鍮?諛곗뿴 skip 媛??*: API ?쇱슦??+ 留덈쾿??page ?묐㈃ ??DB ?몄텧 0 (?댁쁺 遺??媛??/ errors.md 2026-04-17 ?⑥젙 ?듭뒿).
- **createMany P2002 ?덉쟾**: license_number @unique 異⑸룎 ??skipDuplicates=true ??throw ?뚰뵾 (1李?誘멸?利??섎룄).
- **BigInt ?덉쟾 蹂??*: `try { BigInt(...) } catch { 404 NOT_FOUND }` ??鍮??レ옄 route param 諛⑹뼱.
- **canProceed ?ъ쟾 媛??*: Step 4 row 1嫄??댁긽 ??紐⑤뱺 name min 2 媛뺤젣 ??422 ?ъ쟾 李⑤떒.
- **admin 鍮④컯 蹂몃Ц 湲덉? 猷?*: `var(--color-info)` + `--color-text-*` + `--color-elevated` ?좏겙留???`--color-primary` 蹂몃Ц 0.
- **AppNav frozen**: main tab / ?붾낫湲?蹂寃?0 ??Step4 異붽???留덈쾿???대?留?

??寃利?寃곌낵:
| ??ぉ | 寃곌낵 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (?뚭? 0) |
| `npx vitest run src/__tests__/api/association-wizard.test.ts` | **11/11 PASS** (371ms / PR1 8 + PR3 3) |
| `npx vitest run` (?꾩껜 ?뚭?) | **921/921 PASS** (PR2 吏곹썑 918 + PR3 ?좉퇋 3 = 921 / ?뚭? 0) |
| ?댁쁺 DB schema 蹂寃?| 0 |
| Flutter v1 ?곹뼢 | 0 (`/api/v1/...` 蹂寃?0) |
| ?ㅻⅨ ?몄뀡 諛뺤젣 ?먮?吏 | 0 (?뚯씪 ??append only) |
| working tree ?ㅻⅨ ?몄뀡 ?뚯씪 ?먮?吏 | 0 (蹂?PR 蹂寃?= ?좉퇋 2 + ?섏젙 6 only) |

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿** (?섏씠吏 ?뚮뜑 ?ъ슜??寃利?:
  1. super_admin 怨꾩젙 濡쒓렇????`/tournament-admin/wizard/association` 吏꾩엯.
  2. Step 1~3 ?듦낵 ??Step 4 (?ы뙋 ?ъ쟾 ?깅줉) 吏꾩엯 ?뺤씤 ??鍮??곹깭 ?덈궡 + "?ы뙋 異붽?" 踰꾪듉.
  3. **耳?댁뒪 A (skip)**: ?깅줉 ?놁씠 ?ㅼ쓬 ??Step 5 ?뺤씤 ?섏씠吏 = "?깅줉 ?놁씠 吏꾪뻾" ?쒖떆 ???앹꽦 ???묓쉶/?щТ援?옣/?④???3嫄?INSERT + Referee 0嫄?
  4. **耳?댁뒪 B (1嫄?**: "?ы뙋 異붽?" ??name "?띻만?? + license "TEST-001" + region "?쒖슱" ???ㅼ쓬 ??Step 5 = 1嫄?誘몃━蹂닿린 ???앹꽦 ??Referee 1嫄?INSERT.
  5. **耳?댁뒪 C (3嫄?**: 3 row 異붽? (媛?name ?낅젰) ???ㅼ쓬 ???앹꽦 ??Referee 3嫄?INSERT.
  6. **耳?댁뒪 D (寃利?**: row 異붽? + name 1?먮쭔 ?낅젰 ??"?ㅼ쓬" 踰꾪듉 鍮꾪솢???뺤씤.
  7. sessionStorage 蹂댁〈: Step 4 ?꾩쨷 ?덈줈怨좎묠 ??row + ?낅젰媛?蹂댁〈 ?뺤씤.
- **?뺤긽 ?숈옉**: 鍮?諛곗뿴 = API ?몄텧 0 / 1嫄??댁긽 = createMany 1??+ findMany 1???묐떟 / ?묐떟 ??created_count + referees[] (snake_case + BigInt ??string).
- **二쇱쓽???낅젰**:
  - license_number 以묐났 (?? ?ㅻⅨ ?묓쉶 ?대? 諛뺤젣) ??skipDuplicates=true 濡?skip (created_count 媛 ?낅젰 嫄댁닔蹂대떎 ?곸쓬 ??UI ?덈궡 ?놁쓬 / ?꾩냽 ?ъ슜??寃곗옱 ???덈궡 異붽?).
  - row 100嫄?珥덇낵 ??422 (Zod max 100).
  - name 50??珥덇낵 ??422 (Zod max 50).
  - ?꾩쨷 ?ㅽ뙣 ???묓쉶/?щТ援?옣/?④??????대? INSERT ?꾨즺 ???댁쁺???섎룞 ?뺤젙 (?쒖븞 spec).

?좑툘 reviewer 李멸퀬:
- **?밸퀎??遊먯ㄼ?쇰㈃ ?섎뒗 遺遺?*:
  - `createMany` + `findMany` 2 ?몄텧 ???묐떟???깅줉??row ?쇰? 而щ읆 誘몃━蹂닿린 諛뺤젣 ?섎룄 (UI 寃利?/ ?붾쾭源낆슜). ?⑥젏 = ?ㅻⅨ ?댁쁺???숈떆 ?묒뾽 ???쇰? mismatch 媛??(LIMIT N + ORDER BY created_at DESC). ???= createMany ??transaction `tx.referee.findMany` ???꾩냽 寃곗옱 ??寃??
  - `skipDuplicates: true` ??license_number @unique 異⑸룎 ??silent skip (1李?誘멸?利?諛뺤젣 Q7 ?섎룄). ?꾩냽 寃利?PR 吏꾩엯 ??紐낆떆 P2002 catch + ?ъ슜???덈궡濡?媛뺥솕 沅뚯옣.
  - canProceed Step 4 寃利? row 0 = ?듦낵 (skip ?섎룄) / row 1+ = 紐⑤뱺 name min 2 (Zod ?뺥빀). API ?몄텧 ?ъ쟾 李⑤떒.
  - WizardConfirm ?덈궡 諛뺤뒪 = `referees.length > 0` ???④퀎 ???숈쟻 ("???ы뙋 ?ъ쟾 ?깅줉" 異붽?) ???댁쁺???몄? 紐낇솗.
- **PR3 ?꾨즺 ???꾩냽**:
  1. Step 2 泥섎읆 user_id 留ㅼ묶 ???쒖꽦 ?ы뙋 ?먮쫫 = Phase 1-B "?ъ쟾 ?깅줉 user 留ㅼ묶" ?먮쫫 蹂꾨룄 PR (湲곗〈 ?먮쫫).
  2. ?먭꺽踰덊샇 寃利??꾩냽 (Q7) ??OCR / ?묓쉶 API ?곕룞 = 蹂꾨룄 ??
  3. ?묓쉶 ?곸꽭 ?섏씠吏 (`/admin/associations/[id]`) ?좉퇋 ??referees 紐⑸줉 / ?④????몄쭛 / admin 異붽? ??= 蹂꾨룄 PR.

### ?ъ슜???꾩냽 寃利??ы빆
1. **?섏씠吏 ?뚮뜑**: `npm run dev` (port 3001) ??super_admin 怨꾩젙 ???묓쉶 留덈쾿??Step 4 吏꾩엯 + row add/remove + Step 5 誘몃━蹂닿린.
2. **API ?숈옉**: Step 4 1嫄??댁긽 ?낅젰 ???앹꽦 ???댁쁺 DB `referees` ?뚯씠釉?row ?좉퇋 (registered_name + license_number + association_id 諛뺤젣 / match_status=unmatched / user_id=null).
3. **skip ?먮쫫**: Step 4 ?깅줉 ?놁씠 ?ㅼ쓬 ???묓쉶/?щТ援?옣/?④???3嫄대쭔 INSERT (referees 0嫄?.
4. **寃利??ㅽ뙣**: row 異붽? + name 誘몄엯?????ㅼ쓬 踰꾪듉 鍮꾪솢??/ row 100嫄?珥덇낵 ??422.
5. **license_number 以묐났**: ?숈씪 license_number 2嫄??숈떆 ?낅젰 ??skipDuplicates 濡?1嫄대쭔 INSERT (created_count=1).

## 援ы쁽 湲곕줉 (developer) ??Phase 23 PR-RO1~RO4 (醫낅즺 留ㅼ튂 read-only 李⑤떒)

?뱷 援ы쁽??湲곕뒫: 醫낅즺??留ㅼ튂 (status="completed") 吏꾩엯 ??紐⑤뱺 input/button/紐⑤떖 李⑤떒 (?ъ슜??寃곗옱 Q1~Q8 沅뚭퀬??諛뺤젣). ?대씪?댁뼵??4 PR (RO1~RO3) + BFF 1 PR (RO4) = 5 遺꾨━ 臾띠쓬 ?듯빀 諛뺤젣. ?댁쁺 ?숈옉 100% 蹂댁〈 = 吏꾪뻾 以?留ㅼ튂 (isCompleted=false) 蹂寃?0. ?몄뇙 / ??硫붿씤 / ?ㅽ겕紐⑤뱶 = ??긽 ?쒖꽦. Phase 22 PBP 蹂댁젙 / Phase 23 PR4 audit / Phase 19 PR-S/Stat ?먮쫫 ?곹뼢 0.

### 4 PR 臾띠쓬 ??蹂寃??뚯씪 + LOC

| PR | ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|----|------|------|----------|-----|
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/fiba-header.tsx` | `readOnly?: boolean` prop 異붽? ??SSFieldInput 3 input (Referee/Umpire 1/Umpire 2) readOnly wiring | ?섏젙 | +9 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/team-section.tsx` | `readOnly?: boolean` prop 異붽? ??Coach + Assistant Coach input readOnly wiring (button/cell ? 湲곗〈 disabled 洹몃?濡? | ?섏젙 | +9 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/footer-signatures.tsx` | `readOnly?: boolean` prop 異붽? ??frameless=true 遺꾧린 8 input readOnly wiring (Scorer/Asst/Timer/ShotClockOp/Referee/Umpire 1/2/Captain) + frameless=false 遺꾧린 SigInput 8 + Notes textarea (?뚭? ?덉쟾留? | ?섏젙 | +22 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/period-scores-section.tsx` | 蹂寃?0 (?대? `disabled?: boolean` prop 蹂댁쑀 ??OT 醫낅즺 鍮④컯 踰꾪듉 遺꾧린 洹몃?濡? | ??| 0 |
| RO1 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/running-score-grid.tsx` | `readOnly?: boolean` prop 異붽? ??handleCellClick early return 遺꾧린 (紐⑤떖 open / addMark / undoLastMark 李⑤떒) | ?섏젙 | +9 |
| RO1 | `stat-popover.tsx` / `quarter-end-modal.tsx` | 蹂寃?0 (RO2 form.tsx ?먯꽌 mount X ??open 媛뺤젣 false) | ??| 0 |
| RO2 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | (a) 12 ?몃뱾??isCompleted early return (handleAdvancePeriod/handleRetreatPeriod/handleEndPeriod/handleEndMatchFromQuarterEnd/handleContinueToOvertime/handleRequestAddFoul/handleRequestRemoveFoul/handleRequestAddTimeout/handleRequestRemoveTimeout/handleRequestOpenStatPopover/handleAddStat/handleRemoveStat/handleSelectFoulType/handleLineupConfirm) (b) 4醫?紐⑤떖 open 媛??(`!isCompleted && ctx !== null` ?⑦꽩 ??FoulTypeModal/StatPopover/QuarterEndModal/LineupSelectionModal) (c) ?먯떇 6 而댄룷?뚰듃 readOnly/disabled prop ?꾨떖 (FibaHeader/TeamSection횞2/FooterSignatures/RunningScoreGrid/PeriodScoresSection) (d) ?쇱씤???ㅼ떆 ?좏깮 button conditional render (isCompleted ??hidden) | ?섏젙 | +52 |
| RO3 | `src/app/(score-sheet)/_components/score-sheet-toolbar.tsx` | `hideEndMatch?: boolean` prop 異붽? ??寃쎄린 醫낅즺 button conditional render (?몄뇙 + ??硫붿씤 = ??긽 ?몄텧 / ?ъ슜??寃곗옱 Q2) | ?섏젙 | +12 |
| RO3 | `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` | ScoreSheetToolbar ?몄텧??`hideEndMatch={isCompleted}` + onEndMatch ??`if (isCompleted) return` ?댁쨷 諛⑹뼱 wiring (MatchEndButton hideTriggerButton 湲곗〈 hardcoded true 洹몃?濡????댁쁺 ?숈옉 蹂댁〈) | ?섏젙 | (RO2 ?⑹궛) |
| RO4 | `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | `match.status === "completed"` 嫄곕? 遺꾧린 (423 MATCH_LOCKED) ??getRecordingMode 媛??吏곸쟾 諛뺤젣 (L415 遺洹?. ?섏젙 紐⑤뱶 ?고쉶??蹂꾨룄 PR-EDIT3 ??| ?섏젙 | +18 |

**珥??섏젙 7 ?뚯씪 (period-scores-section / stat-popover / quarter-end-modal 蹂寃?0) / ?좉퇋 0 / ??131 LOC**.

### isCompleted 遺꾧린 ?곸슜 ?꾩튂 (諛⑹뼱 源딆씠)

| 怨꾩링 | ?꾩튂 | 李⑤떒 ?④낵 |
|---|---|---|
| 1李????몃뱾??媛??| score-sheet-form.tsx 14媛??몃뱾??泥?以?`if (isCompleted) return` | ?ъ슜???≪뀡 吏꾩엯??0 (setState 0) |
| 2李????먯떇 prop | 6 而댄룷?뚰듃??readOnly/disabled ?꾨떖 | HTML ?쒖? input/button ?쒓컖 李⑤떒 |
| 3李???紐⑤떖 open | 4 紐⑤떖 `!isCompleted && ctx` 遺꾧린 | 紐⑤떖 mount 0 (state 諛뺤젣?섎룄 ?뚮뜑 0) |
| 4李???toolbar hide | ScoreSheetToolbar hideEndMatch | 寃쎄린 醫낅즺 button DOM 0 |
| 5李???BFF 嫄곕? | submit/route.ts MATCH_LOCKED 423 | curl/肄섏넄 ?고쉶??BFF ?④퀎 李⑤떒 |

### 寃利?寃곌낵

| # | 寃利?| 寃곌낵 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** (?먮윭 0 / ?뚭? 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | **14 ?뚯씪 / 236/236 PASS** (?뚭? 0 / 1.20s) |
| 3 | grep `readOnly\?:` in ?먯떇 而댄룷?뚰듃 | 4 ?뚯씪 留ㅼ튂 (fiba-header/team-section/footer-signatures/running-score-grid ??period-scores-section ? ?섎ː?쒕?濡?蹂寃?0) |
| 4 | grep `isCompleted` 遺꾧린 in form.tsx | 23嫄?留ㅼ튂 (?몃뱾??14 + 紐⑤떖 open 4 + ?먯떇 prop 6 - ?쇰? 以묐났 = 23) |
| 5 | grep `MATCH_LOCKED` in submit/route.ts | 3嫄?(二쇱꽍 2 + apiError 肄붾뱶 1) |

### ?댁쁺 ?숈옉 蹂댁〈 寃利?
| # | 耳?댁뒪 | 寃利?寃곌낵 |
|---|------|------|
| 1 | status="draft" / in_progress 留ㅼ튂 吏꾩엯 | isCompleted=false ??紐⑤뱺 李⑤떒 遺꾧린 誘몄쭊?????댁쁺 ?숈옉 蹂寃?0 ??|
| 2 | status="completed" 留ㅼ튂 吏꾩엯 | 紐⑤뱺 input readOnly + button disabled + 4 紐⑤떖 mount X + ?몃? 諛곕꼫 ?좎? ??|
| 3 | ?몄뇙 / ??硫붿씤 / ?ㅽ겕紐⑤뱶 ?좉? | ?쒖꽦 ?좎? (toolbar hideEndMatch 留?李⑤떒 / ?몄뇙+硫붿씤+?ㅽ겕 = 遺꾧린 0) ??|
| 4 | 4醫?紐⑤떖 吏꾩엯??| 李⑤떒 (?몃뱾??媛??+ open 遺꾧린 媛???댁쨷 諛⑹뼱) ??|
| 5 | 5諛섏튃 李⑤떒 / Phase 17 ??/ Phase 19 PR-T/Stat / Phase 23 ?먮룞 濡쒕뱶 | ?곹뼢 0 (props prop drilling 留?異붽? / 鍮꾩쫰?덉뒪 濡쒖쭅 蹂寃?0) ??|
| 6 | BFF submit (status=draft/in_progress) | MATCH_LOCKED 遺꾧린 誘몄쭊?????듦낵 ??|
| 7 | ?쇱씠釉??섏씠吏 | ?곹뼢 0 (status 蹂寃?0 / 蹂?PR = score-sheet ?쒖젙) ??|
| 8 | Flutter v1 API | ?곹뼢 0 (paper 留ㅼ튂 BFF ?꾩슜 / `/api/v1/...` 蹂寃?0) ??|

### Q 寃곗옱 ?ы빆 (?ъ슜???ъ쟾 寃곗옱 ??Q1~Q8 沅뚭퀬??諛뺤젣)

| Q | 寃곗젙 | 蹂?PR ?곸슜 |
|---|------|------|
| Q1 | tester 蹂꾨룄 異붿쟻 | 蹂??묒뾽 踰붿쐞 ??(RO ?곸슜 ???먮룞 ?댁냼 寃利앹? tester ?? |
| Q2 | 醫낅즺 留ㅼ튂 = 紐⑤뱺 input/button/紐⑤떖 李⑤떒 (?몄뇙+硫붿씤 ?쒖쇅) | ???곸슜 ??5 怨꾩링 諛⑹뼱 |
| Q3~Q7 | EDIT1~EDIT4 (B ?곸뿭 ?꾩냽) | 蹂?PR 踰붿쐞 ??(RO4 = 嫄곕?留?/ EDIT3 = ?섏젙 紐⑤뱶 ?고쉶) |
| Q8 | BFF MATCH_LOCKED 423 + ?섏젙 紐⑤뱶 ?고쉶 遺꾧린 (?댁쨷 諛⑹뼱) | ??RO4 ?곸슜 ??嫄곕?留?(?고쉶??EDIT3 ?꾩냽) |

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿**:
  1. 吏꾪뻾 以?留ㅼ튂 (status="draft") 吏꾩엯 ??紐⑤뱺 input/button/紐⑤떖 ?뺤긽 ?숈옉 ?뺤씤 (?뚭? 0).
  2. 醫낅즺 留ㅼ튂 (status="completed") 吏꾩엯 ???몃? 諛곕꼫 ?몄텧 + Coach input ?대┃ ??readOnly (?낅젰 李⑤떒) + ?뚯슱 cell ?대┃ ??disabled (紐⑤떖 mount 0) + toolbar 寃쎄린 醫낅즺 踰꾪듉 hidden ?뺤씤.
  3. 醫낅즺 留ㅼ튂?먯꽌 ?몄뇙 ?대┃ ??window.print() ?뺤긽 ?몄텧 / ??硫붿씤 ?대┃ ??/admin ?대룞 / ?ㅽ겕紐⑤뱶 ?좉? ?뺤긽.
  4. curl/fetch 濡?醫낅즺 留ㅼ튂 submit POST ??423 MATCH_LOCKED ?묐떟 + "醫낅즺??留ㅼ튂???섏젙?????놁뒿?덈떎" 硫붿떆吏 ?뺤씤.
- **?뺤긽 ?숈옉**: status 遺꾧린 = 吏꾪뻾 留ㅼ튂 蹂寃?0 / 醫낅즺 留ㅼ튂 5 怨꾩링 李⑤떒. ?ㅽ겕紐⑤뱶 / ?몄뇙 / 硫붿씤 ?좎?.
- **二쇱쓽???낅젰**:
  - status="completed" + draft 媛 localStorage ???⑥븘?덈뒗 耳?댁뒪: ConfirmModal ?꾩슦??useEffect ??isCompleted 媛??誘명룷??(?ъ슜??寃곗옱 Q3 蹂꾨룄 ?먮쫫 / Phase 23 PR4 audit 留? ???섎룄???숈옉 (draft 鍮꾧탳???쒖떆留?/ ?ㅼ젣 ?섏젙? 紐⑤뱺 媛?쒕줈 李⑤떒).
  - ?쇱씤??誘몃컯??+ status="completed" ?숈떆 耳?댁뒪: LineupSelectionModal ?먮룞 open 李⑤떒 (open={!isCompleted && lineupModalOpen}) ???묒떇 誘몃젋??+ ?쇱씤???좏깮 ?닿린 踰꾪듉留??몄텧 (?쒕Ъ吏留??댁쁺???몄? 媛??.

?좑툘 reviewer 李멸퀬:
- **?밸퀎??遊먯ㄼ?쇰㈃ ?섎뒗 遺遺?*:
  - **諛⑹뼱 源딆씠 5 怨꾩링** ???ъ슜??寃곗옱 Q8 (?댁쨷 諛⑹뼱) 沅뚭퀬??異⑹떎 諛뺤젣. ?대씪?댁뼵??4 怨꾩링 (?몃뱾??prop/紐⑤떖/toolbar) + BFF 1 怨꾩링 (MATCH_LOCKED) = ?대뼡 ?고쉶 寃쎈줈??李⑤떒.
  - **MatchEndButton.hideTriggerButton** ???섎ː???쒗쁽 "controlled props ?ы솢??(PR-S2)" = ?대? hardcoded true (toolbar 媛 trigger ?≪닔). isCompleted 遺꾧린 蹂꾨룄 異붽? ????吏꾪뻾 留ㅼ튂 hideTriggerButton=false ?뚭?. 洹몃옒??湲곗〈 true ?좎? + toolbar hideEndMatch 留?遺꾧린 (?댁쨷 諛⑹뼱 異⑸텇).
  - **MatchEndButton.onSubmittedChange ??audit ?몄텧** ??Phase 23 PR4 ??completed_edit_resubmit audit endpoint ?몄텧 遺꾧린 蹂댁〈 (RO 李⑤떒?쇰줈 BFF 401 ?꾨떖 李⑤떒???곗꽑 ??audit ?몄텧? ?ъ떎??諛쒖깮 X but 肄붾뱶 ?뺥빀 蹂댁〈).
  - **dead path readOnly 異붽?** ??footer-signatures.tsx ??frameless=false 遺꾧린 (?ㅼ젣 吏꾩엯 0) ??readOnly wiring. ?뚭? ?덉쟾留?+ ?⑥쐞 ?뚯뒪??媛?μ꽦 ?꾪빐 ?숈떆 諛뺤젣.
- **API ?⑥묶 理쒖냼**: BFF 1 ?쇱슦??(submit/route.ts) 嫄곕? 遺꾧린 1媛?異붽? ??match.status SELECT ??access 媛?쒖뿉???대? fetch (異붽? DB ?쇱슫?쒗듃由?0).
- **DB 蹂寃?0**: schema / migration / prisma db push ?몄텧 0.
- **Flutter v1 ?곹뼢 0**: `/api/v1/...` 蹂寃?0 ??paper 留ㅼ튂 BFF (`/api/web/score-sheet/[matchId]/submit`) ?꾩슜.
- **AppNav frozen ?곹뼢 0**: score-sheet ?섏씠吏 = layout.tsx ??RotationGuard / no AppNav.

### ?좎옱 ?꾪뿕 / 硫붾え

- **?섏젙 紐⑤뱶 ?고쉶 (PR-EDIT1~EDIT4)** = 蹂?PR 踰붿쐞 ?? 醫낅즺 留ㅼ튂 ?섏젙???꾩슂??寃쎌슦 ?ъ슜?먭? 蹂꾨룄 PR-EDIT3 (`editMode: true` query param/body) ?쇰줈 吏꾩엯. 蹂?PR = 李⑤떒留?
- **MATCH_LOCKED ?묐떟 ??* = ?댁쁺 BFF 泥??꾩엯 肄붾뱶. Flutter v1 ?곹뼢 0 (`/api/web/...` BFF ?꾩슜). ?꾩냽 EDIT3 ?먯꽌 ?숈씪 肄붾뱶 ?ъ궗??媛??
- **cross-check-audit endpoint ?곹뼢 0** = Phase 23 PR4 ?먮쫫 洹몃?濡?(mount 1??entry audit + submit ??resubmit audit). RO 李⑤떒?쇰줈 submit ?꾨떖 0 = resubmit audit ?ㅼ젣 諛쒖깮 0 (?섎룄???숈옉 / 肄붾뱶 ?뺥빀 蹂댁〈).
- **PR 遺꾨━ commit ?꾨왂**: 4 PR 臾띠쓬 (RO1/RO2/RO3/RO4) ??commit 遺꾨━ ??RO1 ??RO2 ??RO3 ??RO4 ?쒖꽌 沅뚯옣 (RO2 媛 ?먯떇 prop ?섏〈). PM 寃곗옱 ???⑥씪 commit ?먮뒗 4 遺꾪븷 ?좏깮.

### ?ъ슜???꾩냽 寃利??ы빆

1. **醫낅즺 留ㅼ튂 ??吏꾩엯**: ?댁쁺 DB ??status="completed" 留ㅼ튂 1嫄??좏깮 ??/score-sheet/{matchId} 吏꾩엯 ???몃? 諛곕꼫 + 紐⑤뱺 input readOnly + 紐⑤뱺 button disabled + toolbar 寃쎄린 醫낅즺 hidden + 4醫?紐⑤떖 mount 0 ?뺤씤.
2. **吏꾪뻾 留ㅼ튂 ?뚭? 0**: status="draft" / in_progress 留ㅼ튂 吏꾩엯 ??紐⑤뱺 ?낅젰/踰꾪듉/紐⑤떖 ?뺤긽 ?숈옉 (5 怨꾩링 李⑤떒 誘몄쭊???뺤씤).
3. **curl ?고쉶 寃利?*: `curl -X POST /api/web/score-sheet/{completed_match_id}/submit -d '{...}'` ??423 MATCH_LOCKED ?묐떟 ?뺤씤.
4. **?몄뇙 + ??硫붿씤 + ?ㅽ겕紐⑤뱶**: 醫낅즺 留ㅼ튂 吏꾩엯 ??3 ?≪뀡 紐⑤몢 ?뺤긽 ?숈옉 ?뺤씤.
5. **commit 寃곗옱**: PM ?⑥씪 ?먮뒗 4 遺꾪븷 commit 寃곗젙 ???ъ슜??寃곗옱 諛쏆븘 push.

### Admin-1 Phase 諛뺤젣 ??components/admin/* 10 而댄룷?뚰듃 (2026-05-15)

?뱷 援ы쁽 ?붿빟: BDR-current v2.14 ?쒖븞 諛뺤젣 ??`admin.css` (1156以? ?좉퇋 + ?좉퇋 5 而댄룷?뚰듃 (admin-shell / admin-stat-card / admin-empty-state / admin-progress-bar / admin-checklist-card) 異붽?. 湲곗〈 5 而댄룷?뚰듃 (sidebar / mobile-admin-nav / admin-page-header / admin-status-tabs / admin-detail-modal) = **?몄텧泥?29 ?뚯씪 props ?쒓렇?덉쿂 100% 蹂댁〈**???꾪빐 蹂?PR ?쒓컖 媛깆떊 0 (Admin-2~Admin-7 吏꾩엯 ??layout.tsx ? ?④퍡 ?먯뿰 媛깆떊). DB 蹂寃?0 / Flutter v1 ?곹뼢 0 / ?댁쁺 ?섏씠吏 ?뚭? 0 (admin.css 異붽?留?+ import 1以?+ ?좉퇋 而댄룷?뚰듃??誘명샇異?= ?ъ슜???섏씠吏???몄텧 0).

#### 蹂寃??뚯씪 + LOC
| ?뚯씪 | 蹂寃?| ?좉퇋/?섏젙 | LOC |
|------|------|----------|-----|
| `src/styles/admin.css` | ?쒖븞 admin.css 1154以?諛뺤젣 + `--overlay` fallback + `data-tone="accent"` admin-stat-pill 1 猷?異붽? | ?좉퇋 | ~1180 |
| `src/components/admin/admin-shell.tsx` | AdminShell wrapper (sidebar + topbar + main + ?ㅻ뜑 ?먮룞) ??sidebarVariant 'default/hidden' + roles + user + topbar ?щ’ | ?좉퇋 | ~95 |
| `src/components/admin/admin-stat-card.tsx` | AdminStatCard ?듦퀎 移대뱶 ??label/value/icon/delta/trend + skeleton + onClick (button?봡iv ?먮룞) | ?좉퇋 | ~90 |
| `src/components/admin/admin-empty-state.tsx` | AdminEmptyState 鍮??곹깭 移대뱶 ??icon/title/description/ctaLabel+onCta | ?좉퇋 | ~55 |
| `src/components/admin/admin-progress-bar.tsx` | AdminProgressBar 吏꾪뻾??諛???completed/total/% + size sm/md + tone accent/ok/warn + isDone ?먮룞 ok | ?좉퇋 | ~115 |
| `src/components/admin/admin-checklist-card.tsx` | AdminChecklistCard 泥댄겕由ъ뒪??移대뱶 ??num/label/desc/icon/status (done/progress/idle/locked) + required + lockedReason + onClick | ?좉퇋 | ~205 |
| `src/app/layout.tsx` | `import "../styles/admin.css"` 1以?(globals.css 吏곹썑) ??admin.css ?쒖꽦??| ?섏젙 | +4 |

**珥??좉퇋 6 + ?섏젙 1 / ~1744 LOC** (?섎ː???덉긽 ~600 LOC ?鍮?1180以꾩씠 admin.css ?쒖븞 諛뺤젣 吏곸뭅??+ 5 而댄룷?뚰듃 295 LOC + import 4 LOC).

#### ?좏겙 留ㅽ븨 ?곸슜 寃곌낵 (?댁쁺 globals.css ???쒖븞 admin.css)
| ?쒖븞 ?좏겙 | ?댁쁺 ?좏겙 | 留ㅽ븨 寃곌낵 |
|---|---|---|
| `--bg` `--bg-elev` `--bg-card` `--bg-alt` `--bg-head` | ?숈씪 | ?댁쁺 globals.css L76~135 諛뺤젣 ??移섑솚 0嫄?|
| `--ink` `--ink-soft` `--ink-mute` `--ink-dim` `--ink-on-brand` | ?숈씪 | ?댁쁺 globals.css L84~141 諛뺤젣 ??移섑솚 0嫄?|
| `--border` `--border-strong` | ?숈씪 | ?댁쁺 globals.css L91~144 諛뺤젣 ??移섑솚 0嫄?|
| `--accent` `--accent-soft` | ?숈씪 | ?댁쁺 globals.css L104~155 諛뺤젣 ??移섑솚 0嫄?|
| `--ok` `--warn` `--danger` `--info` | ?숈씪 | ?댁쁺 globals.css L50~53 諛뺤젣 ??移섑솚 0嫄?|
| `--cafe-blue` `--cafe-blue-deep` `--cafe-blue-soft` `--cafe-blue-hair` | ?숈씪 | ?댁쁺 globals.css L96~149 諛뺤젣 ??移섑솚 0嫄?|
| `--ff-display` `--ff-body` `--ff-mono` | ?숈씪 | ?댁쁺 globals.css L45~47 諛뺤젣 ??移섑솚 0嫄?|
| `--overlay` | **誘몃컯??* | admin.css :root fallback 諛뺤젣 (rgba 0/0/0/0.45 light, 0.65 dark) ??globals.css ?곹뼢 0 |
| `--err` (?쒖븞 jsx 1嫄? | `--danger` 移섑솚 | AdminChecklistCard ?꾩닔 ?쒖떆 `*` ?됱긽 (?쒓컖 ?숈씪 鍮④컯) |

**?듭떖**: ?쒖븞 v2.14 媛 ?댁쁺 globals.css ?????좏겙 泥닿퀎? 100% sync ??移섑솚 嫄곗쓽 0嫄? 諛뺤젣 鍮꾩슜 = admin.css 移댄뵾 + 而댄룷?뚰듃 .tsx 蹂?섎쭔.

#### 寃利?寃곌낵
| ??ぉ | 寃곌낵 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (?먮윭 0 / ?뚭? 0) |
| ?댁쁺 DB schema 蹂寃?| 0 |
| Flutter v1 API ?곹뼢 | 0 (`/api/v1/...` 蹂寃?0) |
| 湲곗〈 admin ?섏씠吏 ?뚭? | 0 (湲곗〈 5 而댄룷?뚰듃 ?쒓렇?덉쿂 蹂댁〈 + admin.css 異붽?留?/ ?대옒??紐?異⑸룎 0 ??admin- prefix) |
| ?몄텧泥?29 ?뚯씪 ?곹뼢 | 0 (props ?쒓렇?덉쿂 蹂댁〈) |

#### 媛깆떊 5 而댄룷?뚰듃 = 蹂?PR 蹂대쪟 寃곗젙 (?ъ슜??寃곗옱 沅뚰븳 ?꾩엫)
| 而댄룷?뚰듃 | 蹂대쪟 ?ъ쑀 | ?꾩냽 |
|---|---|---|
| `sidebar.tsx` | Tailwind `aside__link / aside__title` + ?댁쁺 navStructure 洹몃?濡? ?쒖븞 `.admin-aside__*` ?대옒?ㅻ줈 ?꾪솚 ???몄텧泥?(admin/layout.tsx) 寃利??꾩슂 | Admin-2 吏꾩엯 ??layout.tsx ? 媛숈씠 媛깆떊 |
| `mobile-admin-nav.tsx` | `lg:hidden fixed top-3 right-3` Tailwind. ?쒖븞 `.admin-mobile-toggle` ?쇰줈 ?꾪솚 ??LogoutButton + user 移대뱶 wiring ?뚭? 寃利??꾩슂 | Admin-2 吏꾩엯 ??媛숈씠 媛깆떊 |
| `admin-page-header.tsx` | searchForm + actions ?щ’ ?쒓렇?덉쿂 ?몄텧泥?= (admin)/admin/users/page.tsx ???ㅼ닔. ?쒖븞 諛뺤젣??search ?놁쓬 ???몄텧泥??뚭? 媛?μ꽦 | Admin-2 吏꾩엯 ???몄텧泥?search ?몃? ?대룞 ??媛깆떊 |
| `admin-status-tabs.tsx` | activeTab key ?쒓렇?덉쿂 蹂댁〈 + ?쒖븞 `.admin-status-tabs` 諛뺤젣 = ?대옒?ㅻ쭔 媛깆떊 媛??(?먯쭊) | Admin-2 吏꾩엯 ??媛깆떊 |
| `admin-detail-modal.tsx` | ?쒖븞 = right slide-in (admin-detail-modal) vs ?댁쁺 = 以묒븰 紐⑤떖. UX ?먯껜 蹂寃????몄텧泥??ㅼ닔 (admin-users-table ?? ?숈옉 蹂寃??꾪뿕 | ?ъ슜??寃곗옱 + Admin-2 吏꾩엯 ??蹂꾨룄 PR |

#### ?몄텧泥??곹뼢 遺꾩꽍 (29 ?뚯씪 ??蹂?PR ?곹뼢 0)
- 蹂?PR 蹂寃?= `admin.css` ?좉퇋 + ?좉퇋 5 而댄룷?뚰듃 .tsx ?좉퇋 + layout.tsx import 1以?- 湲곗〈 而댄룷?뚰듃 ?쒓렇?덉쿂 蹂寃?0 ??29 ?뚯씪 ?곹뼢 0
- admin.css ?대옒??= `.admin-*` prefix ??鍮?admin ?곸뿭 ?곹뼢 0
- `--overlay` fallback = `:root` 諛뺤젣 ??admin ???섏씠吏?먯꽌 ?ъ슜 ????(?섎룄??isolation)

?뮕 tester 李멸퀬:
- **?쒓컖 寃利??섎Т ?곸뿭**:
  1. 湲곗〈 admin ?섏씠吏 (`/admin` ??쒕낫??/ `/admin/users` / `/admin/tournaments` ??29 ?섏씠吏) ??**?뚭? 0 ?뺤씤** (Tailwind ?대옒??洹몃?濡??숈옉 / admin.css 異붽???unused ??admin- prefix ?대옒??誘몄궗???섏씠吏?먯꽌 ?곹뼢 0)
  2. ?ㅽ겕紐⑤뱶 ?좉? ??admin.css ??`[data-theme="dark"]` ??됲꽣媛 ?댁쁺 猷?洹몃?濡?諛뺤젣 (border-strong + border-radius 0)
  3. ?좉퇋 而댄룷?뚰듃??蹂?PR?먯꽌 誘명샇異????쒓컖 0 寃利?(Admin-2 吏꾩엯 ??SetupHub ?섏씠吏?먯꽌 泥??뚮뜑)
- **?뚯뒪??諛⑸쾿**:
  - dev ?쒕쾭 (`npm run dev` port 3001) ?꾩슦怨?admin ?섏씠吏 吏꾩엯 ??湲곗〈 ?붾㈃ 100% 洹몃?濡??뺤씤
  - DevTools Network ??뿉??admin.css ?ㅼ슫濡쒕뱶 ?뺤씤 (200 OK / Content-Type text/css)
  - DevTools Elements ??뿉??`:root` 蹂??`--overlay` 諛뺤젣 ?뺤씤 (rgba(0,0,0,0.45))
- **?뺤긽 ?숈옉**: admin ?섏씠吏 = 100% ?뚭? 0 / ?좉퇋 而댄룷?뚰듃 = Admin-2 吏꾩엯 ??SetupHub 泥??뚮뜑 寃利?- **二쇱쓽???낅젰**: AdminChecklistCard `status="locked"` ??onClick ?몄텧 李⑤떒 / AdminProgressBar `total=0` ??NaN 媛??(0% ?쒖떆) / AdminStatCard skeleton=true ??head/value/delta ?먮━ pulse animation

?좑툘 reviewer 李멸퀬:
- **?밸퀎??遊먯ㄼ?쇰㈃ ?섎뒗 遺遺?*:
  1. **CSS 寃⑸━ ?꾨왂**: admin.css 蹂꾨룄 ?뚯씪 (globals.css 3195以꾩뿉 1154以?異붽? ?뚰뵾). admin- prefix ?대옒?ㅻ줈 鍮?admin ?곸뿭 寃⑸━ 100%. `--overlay` fallback = `:root` 諛뺤젣?댁?留?admin ???섏씠吏?먯꽌 誘몄궗??(?섎룄??isolation).
  2. **媛깆떊 蹂대쪟 寃곗젙**: ?섎ː??짠1 "媛깆떊 5 而댄룷?뚰듃" ??ぉ? ?몄텧泥?29 ?뚯씪 props 蹂댁〈 猷??곗꽑 ??蹂?PR 蹂대쪟. Admin-2 (layout 諛뺤젣) 吏꾩엯 ???④퍡 媛깆떊 ???몄텧泥??뚭? 0 蹂댁옣.
  3. **AdminShell ??mobileOpen ?곹깭**: ?쒖븞? ?먯껜 useState 蹂댁쑀 / ?댁쁺 mobile-admin-nav ???먯껜 useState 蹂댁쑀 ??蹂?Shell ??`_mobileOpen` ? 誘몄궗??placeholder (underscore prefix). Admin-2 吏꾩엯 ??mobile-admin-nav ??useState 瑜?Shell 濡??뚯뼱?щ━嫄곕굹 洹몃?濡??먮뒗 寃곗젙 ?꾩슂.
  4. **breadcrumbs prop 誘몄궗??*: AdminShell 諛뺤젣 ?쒓렇?덉쿂??breadcrumbs ?덉?留?AdminPageHeader ?댁쁺 ?쒓렇?덉쿂??breadcrumbs 誘명룷????蹂?PR underscore prefix (`_breadcrumbs`) 濡??명꽣?섏씠?ㅻ쭔 諛뺤젣. Admin-2 吏꾩엯 ??admin-page-header 媛깆떊怨??④퍡 wiring.
  5. **AdminChecklistCard ??`--err` 移섑솚**: ?쒖븞 jsx ??`var(--err)` ?좏겙 1嫄????댁쁺 `var(--danger)` 移섑솚 諛뺤젣 (?쒓컖 ?숈씪 鍮④컯). ?댁쁺 globals.css ??`--err` ?좏겙 誘몃컯?쒕줈 ?명븳 ?섎룄??留ㅽ븨.
  6. **admin-stat-pill `accent` tone 異붽?**: ?쒖븞 jsx `AdminChecklistCard` 媛 status=progress ??`data-tone="accent"` ?ъ슜 ??admin.css ??`accent` tone 1 猷?異붽? (`err` ? ?쒓컖 ?숈씪 / semantic 遺꾨━留?.
- **API ?⑥묶 0**: 蹂?PR ?쒓컖 諛뺤젣 only ??fetch/API/DB ?몄텧 0
- **Flutter v1 ?곹뼢 0**: `/api/v1/...` 蹂寃?0
- **AppNav frozen ?곹뼢 0**: admin ?곸뿭? main AppNav ?ъ슜 ????(?먯껜 AdminSidebar) ??frozen 猷?誘몄쟻??
#### ?좎옱 ?꾪뿕 / 硫붾え
- **admin.css ?ㅼ슫濡쒕뱶 臾닿쾶**: ~30KB (?뺤텞 ??~6KB) ??initial load 異붽?. ??admin ?섏씠吏 ???ъ슜?먭? admin- ?대옒???ъ슜 ???섎?濡??ъ떎???ъ슜???곸뿭 ?곹뼢 0 (CSS ?ㅼ슫濡쒕뱶留????곸슜 0).
- **`--overlay` fallback ?섎룄??寃⑸━**: globals.css ??異붽??섏? ?딄퀬 admin.css `:root` 諛뺤젣 ???ν썑 湲濡쒕쾶 ?쒖븞?먯꽌 `--overlay` ?좏겙 ?꾩엯 ???먯뿰?ㅻ읇寃?globals.css 媛 ?곗꽑 (admin.css 諛뺤젣??fallback ??븷). ?ν썑 conflict 0.
- **媛깆떊 5 而댄룷?뚰듃 ?꾩냽**: Admin-2 (layout + Dashboard 諛뺤젣) 吏꾩엯 ??而댄룷?뚰듃 ?쒓컖 媛깆떊 ?④퍡. tester 寃利????몄텧泥?29 ?뚯씪 ?뚭? ?꾩닔 ?뺤씤 (admin-page-header 媛 媛???꾪뿕 ??search form wiring).
- **?좉퇋 5 而댄룷?뚰듃 泥??몄텧**: Admin-2 SetupHub (E-3) 諛뺤젣 ??泥섏쓬 ?몄텧 ??蹂?PR ?⑤룆 ?쒓컖 寃利?遺덇? (mount ????. Admin-2 吏꾩엯 ??SetupHub ?섏씠吏?먯꽌 泥??뚮뜑 ?쒓컖 寃利?

### ?ъ슜???꾩냽 寃利??ы빆 (Admin-1)
1. **dev ?쒕쾭 ?ㅽ뻾**: `npm run dev` (port 3001) ??admin ?섏씠吏 吏꾩엯 ??湲곗〈 ?붾㈃ ?뚭? 0 ?뺤씤 (媛??以묒슂)
2. **DevTools ?ㅽ듃?뚰겕**: admin.css 200 OK / Content-Type text/css ?ㅼ슫濡쒕뱶 ?뺤씤
3. **DevTools Elements**: `:root` ??`--overlay` 諛뺤젣 ?뺤씤 (rgba(0,0,0,0.45))
4. **?ㅽ겕紐⑤뱶 ?좉?**: admin ?섏씠吏?먯꽌 ?ㅽ겕紐⑤뱶 ?좉? ??`[data-theme="dark"]` 猷??곸슜 ?뺤씤 (admin.css 諛뺤젣 猷???admin ?섏씠吏 ???곹뼢 0)
5. **Admin-2 寃곗옱**: 蹂?PR (Admin-1) 寃利???Admin-2 (layout + Dashboard 諛뺤젣 + 而댄룷?뚰듃 ?쒓컖 媛깆떊) 吏꾩엯 寃곗옱

## 援ы쁽 湲곕줉 (developer) ??Phase 7 A PR2+PR3 E2E ?쒕굹由ъ삤 2+3 (2026-05-15)

?뱷 援ы쁽??湲곕뒫: Phase 7 A 留덈쾿???먮룞 E2E ?쒕굹由ъ삤 2 (?뚯감 蹂듭젣 ??add-edition ?먮쫫) + ?쒕굹由ъ삤 3 (1?뚯꽦 ?????QuickCreateForm ?쒕━利?null 紐낆떆) ?좉퇋 諛뺤젣. `fixtures.ts` ???쒕뱶 ?ы띁 2媛?(seedSeries / seedTournamentWithRules) 異붽?. ?댁쁺 肄붾뱶 (src/) 蹂寃?0 / ?댁쁺 DB ?곹뼢 0 (E2E ?ㅽ뻾? ?ъ슜??寃利?.

| ?뚯씪 寃쎈줈 | 蹂寃??댁슜 | ?좉퇋/?섏젙 | LOC |
|----------|----------|----------|-----|
| `tests/e2e/wizard/fixtures.ts` | `seedSeries({organizerId, prefix})` (tournament_series 1嫄?INSERT ??uuid/name/slug/organizer_id/status="active") + `seedTournamentWithRules({seriesId, organizerId, prefix, ruleCount})` (Tournament edition_number=1 + DivisionRule N嫄?createMany + series.tournaments_count +1) 2 ?ы띁 異붽? | ?섏젙 | +118 |
| `tests/e2e/wizard/wizard-edition-copy.spec.ts` | ?쒕굹由ъ삤 2 ??beforeAll ?쒕뱶 (?쒕━利??뚯감1+猷?嫄? ??add-edition 吏꾩엯 ???좎쭨 +60?????쒖텧 ??redirect `?added=2` 寃利???DB ?ы썑 6 寃利?(?뚯감2 諛뺤젣 / series_id 留ㅽ븨 / status="registration_open" / organizerId / edition2 rules=0 (legacy ?먮룞蹂듭젣 誘몄닔???뺥빀) / edition1 rules=5 / tournaments_count=2) | ?좉퇋 | 168 |
| `tests/e2e/wizard/wizard-no-series.spec.ts` | ?쒕굹由ъ삤 3 ??me API ??wizard 吏꾩엯 ???대쫫 ?낅젰 ??select="" 紐낆떆 ???쒖텧 ??DB ?ы썑 6 寃利?(series_id=null ?듭떖 / edition_number=null / status="draft" / organizerId / format / maxTeams) | ?좉퇋 | 132 |

**珥??좉퇋 2 + ?섏젙 1 / ~418 LOC**.

?썳截??곸슜??媛??
- **prefix ?덉쟾 猷?*: ?쒕굹由ъ삤 2 = `e2e-test-{ts}-edition-copy` / ?쒕굹由ъ삤 3 = `e2e-test-{ts}-no-series-{rand}` ??cleanupByPrefix("e2e-test-") ?꾪꽣 ?먮룞 留ㅼ묶.
- **try-finally cleanup**: afterAll ?묐㈃ 媛??(beforeAll ?쒕뱶 ?ㅽ뙣?대룄 prefix ?붿〈 0).
- **BigInt ?덉쟾**: seriesId ??`.toString()` URL 諛뺤젣 / testUserId 鍮꾧탳 (errors.md 諛뺤젣 猷?.
- **snake_case ?묐떟**: me API user_id/userId ?대갚 (errors.md 5???ш퀬 猷?.
- **?댁쁺 ?숈옉 ?뺥빀**: legacy POST 遺꾧린 = division_rules ?먮룞 蹂듭젣 X ???뚯감 2 rules=0 寃利?(?섎ː??짠A ??"5嫄?蹂듭젣" ??留덈쾿??path ?쒖젙 ??蹂??쒕굹由ъ삤???뚭? 媛??紐⑹쟻 ?댁쁺 ?숈옉 洹몃?濡?.
- **?댁쁺 肄붾뱶 蹂寃?0**: src/ ?먮?吏 ?딆쓬 ???뚯뒪???뚯씪 + fixtures ?뺤옣留?

??寃利?寃곌낵:
| ??ぉ | 寃곌낵 |
|---|---|
| `npx tsc --noEmit` | **exit=0** (?뚭? 0) |
| `npx vitest run` (?꾩껜) | **921/921 PASS** (PR1 吏곹썑 ?숈씪 / ?뚭? 0) |
| ?댁쁺 DB schema 蹂寃?| 0 |
| Flutter v1 ?곹뼢 | 0 |
| ?ㅻⅨ ?몄뀡 諛뺤젣 ?뚯씪 ?먮?吏 | 0 (append-only ?좉퇋 ?뱀뀡留? |

?뮕 tester 李멸퀬:
- **?ъ슜???꾩냽 寃利?* (E2E ?ㅽ뻾):
  1. `.env.test.local` ??TEST_USER_EMAIL/PASSWORD 梨꾩? (super_admin/organizer 沅뚰븳 user).
  2. `npm run dev` (port 3001) 諛깃렇?쇱슫???ㅽ뻾 ?좎?.
  3. `npm run test:e2e:wizard` ???쒕굹由ъ삤 1+2+3 ?먮룞 ?ㅽ뻾 (?덉긽 1~2遺?/ setup 5珥?+ ?쒕굹由ъ삤 3嫄?.
  4. ?듦낵 ??紐⑤뱺 cleanup ?먮룞 (e2e-test-* prefix ?곗씠???붿〈 0).
- **?쒕굹由ъ삤 2 ???댁쁺 ?숈옉 硫붾え**: add-edition ?섏씠吏??"?댁쟾 ?뚯감 prefill" 誘멸뎄??(line 13~15 鍮?珥덇린媛? + legacy POST ??division_rules ?먮룞 蹂듭젣 誘멸뎄????蹂??쒕굹由ъ삤???댁쁺 ?숈옉 ?뺥빀 (?뚭? 媛??紐⑹쟻). ?ν썑 留덈쾿??path 吏꾩엯 ??蹂꾨룄 ?쒕굹由ъ삤 異붽?.

?좑툘 reviewer 李멸퀬:
- **?쒕굹由ъ삤 3 = ?쒕굹由ъ삤 1 ?숈튂 寃利?*: ?댁쁺 肄붾뱶 遺꾧린???숈씪 path (select value="" + ?쒕━利?0媛?= ?섎룄留??ㅻ쫫). ?뚭? 媛???덉쟾留?(?쒕━利??ㅼ닔 蹂댁쑀 ?댁쁺?먮룄 1?뚯꽦 諛뺤젣 ?뺤긽 ?숈옉 寃利?.
- **seedTournamentWithRules ??status="registration_open"** = legacy POST ?쇱슦??line 147 湲곕낯媛??뺥빀 ??schema default ("draft") ???꾨땶 ?쇱슦??諛뺤젣媛??쇱튂 ?섎룄.
- **edition_number=null 寃利?(?쒕굹由ъ삤 3)** = QuickCreateForm ??`series_id=null` 遺꾧린 諛뺤젣 ???쒕━利?誘몄뿰寃???梨꾨쾲 0 (?뚭? 媛??.

### ?ъ슜???꾩냽 寃利??ы빆 (PR2+PR3)
1. **TEST_USER ?먭꺽利앸챸 諛뺤젣**: `.env.test.local` ??placeholder 梨꾩? (super_admin ?먮뒗 organizer 沅뚰븳).
2. **dev ?쒕쾭 ?ㅽ뻾 ?뺤씤**: `npm run dev` ??port 3001 listening ?뺤씤 (CLAUDE.md 猷?.
3. **E2E ?ㅽ뻾**: `npm run test:e2e:wizard` ???쒕굹由ъ삤 1+2+3 ?듦낵 + cleanup ?붿〈 0 ?뺤씤.
4. **?댁쁺 DB ?붿〈 寃利?* (?덉쟾 媛??: ?ㅽ뻾 ??`SELECT count(*) FROM tournaments WHERE name LIKE 'e2e-test-%'` ??0嫄??뺤씤.
5. **commit 寃곗옱**: PR2 + PR3 ?듯빀 commit (`test(e2e): Phase 7 A PR2+PR3 ?쒕굹由ъ삤 2+3 諛뺤젣`) ??PM 吏곸젒 ?섑뻾.

## 援ы쁽 湲곕줉 (developer) ??Phase 23 PR-EDIT1~EDIT4 (?섏젙 紐⑤뱶 蹂꾨룄 湲곕뒫 / 2026-05-15)

?뱷 援ы쁽??湲곕뒫: 醫낅즺 留ㅼ튂 (status="completed") ?섏젙 紐⑤뱶 蹂꾨룄 吏꾩엯 湲곕뒫 (?ъ슜??寃곗옱 Q3~Q8 沅뚭퀬??諛뺤젣). PR-RO ??5怨꾩링 RO 李⑤떒 ?꾩뿉??沅뚰븳??(super/organizer/TAM) 媛 紐낆떆?곸쑝濡?confirm modal ?듦낵 ??李⑤떒 ?고쉶 + ?ъ젣異?+ audit 諛뺤젣. ?댁쁺 ?숈옉 100% 蹂댁〈 = isEditMode=false ??RO 李⑤떒 洹몃?濡? Flutter v1 / ?쇱씠釉??섏씠吏 ?곹뼢 0.

### 4 PR 臾띠쓬 ??蹂寃??뚯씪 + LOC

| PR | ?뚯씪 | 蹂寃??붿빟 | LOC |
|----|------|----------|-----|
| EDIT1 | `_components/score-sheet-toolbar.tsx` | canEdit / onEnterEditMode / isEditMode 3 props 異붽? + "?섏젙 紐⑤뱶" 踰꾪듉 (hideEndMatch && canEdit ???몄텧 / isEditMode ??鍮④컯 fill indicator) | +50 |
| EDIT1 | `_components/score-sheet-form.tsx` | (a) isEditMode useState (b) handleEnterEditMode() async ??confirmModal Promise + audit POST "completed_edit_mode_enter" + setIsEditMode(true) + toast (c) toolbar ?몄텧 ??props wiring | +80 |
| EDIT2 | `src/lib/auth/require-score-sheet-access.ts` | (a) requireScoreSheetEditAccess() ?좉퇋 export ??recorder ?쒖쇅 / canEdit ?꾨뱶 異붽? (b) checkScoreSheetEditAccess() boolean ?ы띁 ??page.tsx + submit/route.ts ?묐㈃ ?ъ궗??| +200 |
| EDIT2 | `score-sheet/[matchId]/page.tsx` | checkScoreSheetEditAccess import + canEdit ?곗텧 + ScoreSheetForm props wiring | +30 |
| EDIT3 | `_components/score-sheet-form.tsx` | (a) 14 ?몃뱾??`if (isCompleted && !isEditMode) return` 蹂寃?(b) 4 紐⑤떖 open `(!isCompleted \|\| isEditMode) && ctx` 蹂寃?(c) 6 ?먯떇 readOnly/disabled `isCompleted && !isEditMode` 蹂寃?(d) toolbar hideEndMatch ?숈씪 蹂寃?(e) ?쇱씤???ㅼ떆 ?좏깮 button conditional (f) ?몃? 諛곕꼫 ?쒓컖 遺꾧린 isEditMode 鍮④컯 fill (g) buildSubmitPayload edit_mode=true BFF ?좏샇 | +60 |
| EDIT3 | `src/app/api/web/score-sheet/[matchId]/submit/route.ts` | (a) checkScoreSheetEditAccess import (b) Zod edit_mode optional (c) MATCH_LOCKED 遺꾧린 = body parse ?댄썑濡??대룞 + edit_mode ?고쉶 遺꾧린 (沅뚰븳 ?듦낵 ???듦낵 / 誘명넻怨?= 403 EDIT_FORBIDDEN) (d) audit context prefix "[?섏젙 紐⑤뱶]" + changes.edit_mode_bypass 諛뺤젣 | +75 |
| EDIT4 | `score-sheet/[matchId]/page.tsx` | tournament_match_audits SELECT (context LIKE completed_edit*) ??理쒕? 20嫄?+ user IN 1 SELECT + editAuditLogs prop wiring (occurredAt = changedAt schema ?뺢퇋?? | +85 |
| EDIT4 | `_components/score-sheet-form.tsx` | (a) editAuditLogs prop ???(b) auditExpanded useState ?쇱묠 ?좉? (c) inline ?섏젙 ?대젰 UI (諛곕꼫 + ?쇱튂湲?/ ?꾧?/?몄젣/臾댁뾿 ??/ context 遺꾨쪟 吏꾩엯/?ъ젣異??섏젙紐⑤뱶吏꾩엯/湲고?) | +95 |

**珥??섏젙 4 ?뚯씪 / ?좉퇋 0 / ??675 LOC** (?덉긽 ~200 LOC ?鍮?+200% ??EDIT2 ?ы띁 200 LOC + EDIT4 inline UI + ?먯꽭???쒓뎅??二쇱꽍 + Q 寃곗옱 諛뺤젣 ?ы븿).

### canEdit / isEditMode 遺꾧린 ?곸슜 ?꾩튂 (5怨꾩링 ?고쉶 諛뺤젣)

| 怨꾩링 | ?꾩튂 | isEditMode ?고쉶 諛⑹떇 |
|---|---|---|
| 1李????몃뱾??媛??| form.tsx 14 ?몃뱾??泥?以?| `if (isCompleted && !isEditMode) return` |
| 2李????먯떇 prop | 6 而댄룷?뚰듃 readOnly/disabled | `isCompleted && !isEditMode` |
| 3李???紐⑤떖 open | 4 紐⑤떖 open prop | `(!isCompleted \|\| isEditMode) && ctx` |
| 4李???toolbar | hideEndMatch + canEdit ??"?섏젙 紐⑤뱶" 踰꾪듉 ?몄텧 | isEditMode ??醫낅즺 踰꾪듉 ?щ끂異?|
| 5李???BFF 嫄곕? | submit/route.ts MATCH_LOCKED 遺꾧린 | edit_mode body + 沅뚰븳 寃利??듦낵 ???고쉶 |

### audit 諛뺤젣 ?먮쫫 (吏꾩엯 / ?ъ젣異?

| ?쒖젏 | warning_type / context |
|---|---|
| 1. 醫낅즺 留ㅼ튂 mount 1??| `completed_edit_entry` (PR4 湲곗〈) |
| 2. ?섏젙 紐⑤뱶 吏꾩엯 紐낆떆 | `completed_edit_mode_enter` (EDIT1 ?좉퇋) |
| 3. ?ъ젣異???onSubmittedChange | `completed_edit_resubmit` (PR4 湲곗〈) |
| 4. BFF audit 諛뺤젣 | `[?섏젙 紐⑤뱶] completed_edit_resubmit ...` (EDIT3 ?좉퇋 prefix) |

EDIT4 inline ?쒖떆 = (1)~(4) 紐⑤몢 SELECT (context LIKE "completed_edit" OR "?섏젙 紐⑤뱶") ??context 遺꾨쪟 ?쇰꺼.

### Q 寃곗옱 ?ы빆 (?ъ슜???ъ쟾 寃곗옱 ??Q3~Q8 沅뚭퀬??諛뺤젣)

| Q | 寃곗젙 | ?곸슜 |
|---|------|------|
| Q3 | toolbar 踰꾪듉 + confirm modal (沅뚰븳?먮쭔) | ??EDIT1 ??ConfirmModal Promise |
| Q4 | super/organizer/TAM (recorder ?쒖쇅) | ??EDIT2 ??checkScoreSheetEditAccess |
| Q5 | completed ?좎? + audit only | ??EDIT3 ??audit prefix "[?섏젙 紐⑤뱶]" |
| Q6 | 臾댄븳 ?섏젙 + audit 異붿쟻 | ??EDIT3 ???잛닔 ?쒗븳 0 |
| Q7 | 留ㅼ튂 ?곸꽭 inline | ??EDIT4 ?듭뀡 A ??留ㅼ튂 ?곸꽭 ?섏씠吏 誘몄〈????score-sheet ?몃씪??|
| Q8 | MATCH_LOCKED + editMode ?고쉶 | ??EDIT3 ??Zod edit_mode + 沅뚰븳 寃利?|

### 寃利?寃곌낵

| # | 寃利?| 寃곌낵 |
|---|------|------|
| 1 | `npx tsc --noEmit` | **exit=0** (?뚭? 0) |
| 2 | `npx vitest run src/__tests__/score-sheet/ src/__tests__/lib/score-sheet/` | **14 ?뚯씪 / 236/236 PASS** (2.69s) |
| 3 | grep `isEditMode` in form.tsx | **49嫄?* |
| 4 | grep `requireScoreSheetEditAccess`/`checkScoreSheetEditAccess` | ?좉퇋 export + page.tsx (L26+L535) + submit/route.ts (L38) |
| 5 | grep `edit_mode`/`isEditModeBypass` in submit/route.ts | **14嫄?* |
| 6 | grep `completed_edit_resubmit` in form.tsx | **4嫄?* (PR4 湲곗〈 + EDIT4 遺꾨쪟 = 肄붾뱶 ?뺥빀) |

### ?댁쁺 ?숈옉 蹂댁〈 寃利?
| # | 耳?댁뒪 | 寃利?|
|---|------|------|
| 1 | status="draft"/in_progress | isCompleted=false ??isEditMode 遺꾧린 誘몄쭊????蹂寃?0 ??|
| 2 | completed + canEdit=false (recorder/?쇰컲) | "?섏젙 紐⑤뱶" 踰꾪듉 誘몃끂異?/ RO 李⑤떒 ?좎? ??|
| 3 | completed + canEdit=true + isEditMode=false | 踰꾪듉 ?몄텧 + ?몃? 諛곕꼫 + RO 李⑤떒 ?좎? / ?대┃ ??confirm ??|
| 4 | completed + isEditMode=true | 紐⑤뱺 李⑤떒 ?고쉶 + 鍮④컯 indicator + 寃쎄린 醫낅즺 ?щ끂異?+ audit ??|
| 5 | ?ъ젣異?status 泥섎━ | completed ?좎? + audit prefix "[?섏젙 紐⑤뱶]" ??|
| 6 | BFF MATCH_LOCKED + edit_mode ?고쉶 | edit_mode=true + 沅뚰븳 = ?듦낵 / 誘몃컯???먮뒗 沅뚰븳 ?놁쓬 = 423/403 ??|
| 7 | 4醫?紐⑤떖 / Phase 17 / Phase 19 PR-T/Stat / Phase 23 ?먮룞 濡쒕뱶 | ?곹뼢 0 ??|
| 8 | Flutter v1 / ?쇱씠釉?/ ?몄뇙 / ??硫붿씤 / ?ㅽ겕紐⑤뱶 | ?곹뼢 0 ??|

?뮕 tester 李멸퀬:
- **?뚯뒪??諛⑸쾿**:
  1. status="completed" 留ㅼ튂 + super_admin ???몃? 諛곕꼫 + "?섏젙 紐⑤뱶" 踰꾪듉 ?뺤씤.
  2. "?섏젙 紐⑤뱶" ?대┃ ??confirm modal "audit 諛뺤젣?⑸땲?? ?뺣쭚濡?".
  3. confirm ?숈쓽 ??諛곕꼫 鍮④컯 + 踰꾪듉 鍮④컯 fill + ?낅젰 ?쒖꽦 + 醫낅즺 踰꾪듉 ?щ끂異?+ toast.
  4. ?낅젰 ?섏젙 + 寃쎄린 醫낅즺 ??BFF ?듦낵 + audit "completed_edit_resubmit" 諛뺤젣.
  5. ?섏씠吏 ?덈줈怨좎묠 ??inline "?섏젙 ?대젰 N嫄? + ?쇱튂湲??쒖떆 ?뺤씤.
  6. completed + recorder 吏꾩엯 ??踰꾪듉 誘몃끂異?/ RO 李⑤떒 ?좎? (?뚭? 0).
  7. draft 留ㅼ튂 ??吏꾪뻾 ?숈옉 ?뺤긽 / ?뚭? 0.
- **二쇱쓽???낅젰**:
  - curl ?고쉶: edit_mode=true body + recorder ?몄뀡 ??403 EDIT_FORBIDDEN.
  - edit_mode ??誘몃컯??+ 醫낅즺 留ㅼ튂 = 423 (PR-RO4 ?숈옉 蹂댁〈).
  - audit ?대젰 20嫄?cap + ?쇱묠 ?좉? (DB 遺??0).

?좑툘 reviewer 李멸퀬:
- **5怨꾩링 ?고쉶 遺꾧린**: 4 ?대씪?댁뼵??+ 1 BFF = PR-RO 5怨꾩링 嫄곗슱 ?고쉶. ?대뼡 怨꾩링???고쉶 ?꾨씫 0.
- **沅뚰븳 留ㅽ듃由?뒪 蹂댁닔??*: Q4 = recorder ?쒖쇅. recorder_admin ???쒖쇅 (?섎ː????紐낆떆). ?ъ슜???꾩냽 寃곗옱 ????以?異붽?濡??뺤옣 媛??
- **EDIT4 ?꾩튂**: 留ㅼ튂 ?곸꽭 ?섏씠吏 誘몄〈????score-sheet inline 諛뺤젣 (?댁쁺??異붿쟻 ?⑥씪 source). ?ъ슜??寃곗옱 ??蹂꾨룄 ?섏씠吏 ?좎꽕 ??SELECT 濡쒖쭅留??대룞.
- **commit 寃곗옱**: 4 PR 遺꾨━ or ?듯빀 (PM 寃곗젙). EDIT1+EDIT3 = form.tsx ?숈떆 ?섏젙 ??遺꾨━ ??李⑤텇 commit ?꾩슂. EDIT2+EDIT4 = 蹂꾨룄 ?뚯씪 ???낅┰ 媛??

### ?ъ슜???꾩냽 寃利??ы빆
1. ?댁쁺 留ㅼ튂 ??吏꾩엯 ??completed + super_admin ??踰꾪듉 + 諛곕꼫 ?뺤씤.
2. confirm modal ???대┃ ??modal + audit ?덈궡.
3. 李⑤떒 ?고쉶 ???낅젰 + 醫낅즺 踰꾪듉 + 4醫?紐⑤떖 吏꾩엯 媛??
4. ?ъ젣異???BFF 423 ?뚰뵾 + audit DB SELECT 寃利?
5. inline ?대젰 ???ъ쭊????"?섏젙 ?대젰 N嫄? + ?쇱튂湲?
6. 沅뚰븳 ?뚭? ??recorder 吏꾩엯 ??踰꾪듉 誘몃끂異?(PR-RO 蹂댁〈).
7. curl ?고쉶 ??edit_mode + recorder = 403 EDIT_FORBIDDEN.
8. commit 寃곗옱 ??PM ?⑥씪/4遺꾪븷 寃곗젙 ??push.

---

## 구현 기록 (developer) — Admin-3 Phase 박제 (2026-05-15)

📝 구현: tournament-admin wizard 페이지 상단 헤더 박제 — 시안 `AdminWizardTournament.jsx` v2.8.1 패턴.

#### 시안 vs 의뢰서 갭 (사용자 결정 우선)
- 의뢰서: AdminShell sidebarVariant='hidden' wrap (풀스크린) + 좌상단 백 링크
- 실제 시안 (v2.8.1, 2026-05-15): sidebar 유지 + 좌상단 백 링크 ❌ + 우상단 × 종료 버튼
- **시안 v2.8.1 채택** (사용자 최종 결정). 시안 source line 9~13 주석 명시.

#### 변경 파일

| 파일 | 변경 | LOC |
|------|------|-----|
| `src/app/(admin)/tournament-admin/tournaments/new/wizard/page.tsx` | QuickCreateForm 상단 헤더 — eyebrow "대회 운영자 도구 · 마법사 진행 중" + 우상단 × 종료 버튼 | +30 / -6 |

#### 보존 검증
- 60dd37e UI-2 1-step 압축 + 즉시 draft: handleCreate/POST/state 변경 0
- 71b0eaa InlineSeriesForm: 보존
- e8adc1a UI-1.5 / 8478a24 UI-3+4: LegacyWizardForm 미변경

#### 룰 정합
- admin 빨강 본문 금지: eyebrow Navy `var(--color-info)` ✅
- pill 9999px ❌: `rounded-[4px]` ✅ / Material Symbols ✅

#### tsc: exit 0 (errors 0)

#### 시각 검증 영역 (tester)
- `/tournament-admin/tournaments/new/wizard` 진입 → eyebrow + × 종료 노출
- × 종료 → confirm → `/tournament-admin` 이동
- POST 동작 변경 0 / sidebar 정상

#### 잠재 위험
- v2.7 풀스크린 → v2.8.1 sidebar 유지로 사용자 결정 갱신. 의뢰서 cli-port-to-src.md §3 추후 갱신 필요 (PM 판단).
- `?legacy=1` 폼은 변경 0 (1주 후 폐기 예정 — skip 의도).

### Admin-4-A Phase 박제 — Tournament 영역 3 페이지 (2026-05-15)

📝 구현한 기능: CLI 마스터 핸드오프 Phase 5 — Admin-4 Tournament 영역 시각 박제 (시안 BDR v2.14)

#### 시안 vs 실제 갭 (사용자 결정 우선)
- 의뢰서 §4 = 4 페이지 박제 명시. 실제 운영에는 `/admin/tournaments/[id]/page.tsx` 라우트 **미존재** → detail 페이지 박제 스킵 (신규 라우트 박제 금지 룰 준수).
- 박제 대상 = 3 페이지 (tournaments-content / audit-log / transfer-organizer page).
- AdminDataTable 컴포넌트 박제 = 옵션 A (스킵). 기존 `<table className="admin-table">` 유지 → admin.css 가 시각 갱신.

#### 변경 파일 + LOC
| 파일 | LOC ± | 변경 내용 |
|------|------|----------|
| `src/app/(admin)/admin/tournaments/admin-tournaments-content.tsx` | +13 / -16 | STATUS_STYLE inline → STATUS_TONE / 상태·공개 뱃지 `.admin-stat-pill[data-tone]` |
| `src/app/(admin)/admin/tournaments/[id]/audit-log/page.tsx` | +28 / -22 | h1 → `<AdminPageHeader>` (eyebrow+breadcrumbs+actions) / severity → `.admin-stat-pill` |
| `src/app/(admin)/admin/tournaments/[id]/transfer-organizer/page.tsx` | +28 / -19 | h1 → `<AdminPageHeader>` (eyebrow+breadcrumbs+actions) |

총 LOC: +69 / -57 (3 파일).

#### 비즈 로직 보존 검증
- `grep -iE "prisma\.|fetch\(|useState|useEffect|server.*action|admin_logs|TournamentAdminMember"` = 0 매치 (코멘트 제외).
- Prisma findUnique/findMany/count 쿼리 보존.
- Server Action props (updateStatusAction / toggleVisibilityAction) 시그니처 보존.
- TransferOrganizerForm props 보존 (transfer-organizer-form.tsx = **미변경**).
- AuditLog formatUser / enrichDescription 헬퍼 보존.

#### 룰 정합
- 토큰: `--color-*` 는 globals.css alias → 신 토큰 자동 매핑 (admin.css 작성됨) ✅
- pill 9999px 금지: `admin-stat-pill` = admin.css 박제 (정사각형 dot 제외 9999px 미사용) ✅
- Material Symbols Outlined: arrow_back ✅ (lucide-react 미사용)
- AppNav: 변경 0 ✅
- 컴포넌트 신규 박제 0 (AdminPageHeader / AdminStatusTabs / admin-stat-pill = Admin-1+2 박제 재사용) ✅

#### tsc: exit 0 (errors 0)

#### 시각 검증 영역 (tester)
- `/admin/tournaments` 진입 → 상태 뱃지 (접수중=info / 진행중=ok / 준비중=mute / 종료=mute) admin-stat-pill 톤 노출. 공개=ok / 비공개=mute.
- `/admin/tournaments/[id]/audit-log` → AdminPageHeader breadcrumbs (ADMIN › 대회 관리 › [name] › 감사 로그) + eyebrow + 우측 actions "대회 관리" 버튼. severity 뱃지 = INFO / WARN / ERROR pill.
- `/admin/tournaments/[id]/transfer-organizer` → AdminPageHeader breadcrumbs + eyebrow. 폼 영역 (좌)·현재 정보 (위) 기존 그대로.
- 모달 (admin-tournaments-content `<AdminDetailModal>`) 미변경 — 모달 안 행정 액션 (대회 승인 / 운영자 변경 / 감사 로그) 기능 그대로 동작.

#### 잠재 위험
- AdminDataTable 미박제 = 의뢰서 §4 명시했으나 컴포넌트 자체 미박제 (Admin-1 신규 5에 미포함). 옵션 A 채택 → 시각 톤만 admin.css 가 처리. 의뢰서 §4 후속 컴포넌트 박제 필요 시 별 PR.
- `/admin/tournaments/[id]/page.tsx` (detail) 미존재 → Admin-4-B 또는 별 PR 에서 신규 라우트 생성 시 박제. 현재 운영에 detail 라우트 호출 없음 (모달 + sub-route 만 사용 패턴).
- transfer-organizer-form.tsx (클라이언트 컴포넌트) 미박제 = 이미 신 토큰 alias 자동 매핑 + 비즈 로직 복잡 (fetch / search / 액션 토글 / submit). 향후 Admin-4-B 또는 별 PR 에서 박제 가능.

