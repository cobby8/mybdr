# 결선(knockout) 자동 등록 + 중복 방지 설계 보고서

> 작성: 2026-06-14 / planner-architect / **read-only 설계 문서 (코드·DB 변경 0)**
> 계기: 제10회 BDR YOUNGMAN GAME (`53112aa5-c352-428a-954c-3d1f43580ad9`) 결선 9경기 중복 사고
> 참조: errors.md [2026-06-09] full_league_knockout 자동 4강 = 조 무시 / [2026-05-15] PR-G5 plan+generate 분리 + idempotent 가드

---

## (a) 사고 근본원인 — 코드 위치 확정

### 사고 재구성 (확정된 사실 기준)
- 대회: 6팀 2개조(A·B) 조별리그 + knockout, `format = full_league_knockout`
- 6/9: **정상 크로스 대진**(SF1=A1 YBC vs B2 슬로우 / SF2=B1 PRISM vs A2 우아한 / 결승) 수동 INSERT. `next_match_id`·`bracket_position` 연결됨.
- 6/12: knockout **자동 생성 재실행** → 조 무시 시드로 결승에 가능한 4조합 + 4강 2개 = 누적 6경기 박제 → 기존 3 + 신규 6 = **9경기 중복**.

### 근본원인 2축 (코드 위치 실측 확정)

**[원인 1] 조(group) 무시 시드 — `calculateLeagueRanking` + `buildKnockoutBracket`**
| 위치 | 코드 | 문제 |
|------|------|------|
| `tournament-seeding.ts:19` `calculateLeagueRanking` | `findMany` where 절에 `groupName` 조건/select 전혀 없음 (L21~42). 전체 팀을 승률→득실차→다득점으로만 시드 | 2개조인데 조를 무시하고 6팀 단일 순위 |
| `tournament-seeding.ts:128` `buildKnockoutBracket` | 표준 시드 `1 vs bracketSize, 2 vs bracketSize-1`(L148~165). 조 개념 없음 | 조1위끼리 상위시드·조2위끼리 하위시드 → **같은 조 4강 재대결** (B1 PRISM vs B2 슬로우) |

→ "조별리그+토너먼트" 의미 붕괴. NBA 시드(`nba-seed-knockout.ts`)도 동일하게 `seedNumber`만 보고 조 미반영.

**[원인 2] idempotent 가드가 6/9 수동 INSERT를 인식 못 함 — 가드 조건 불일치 + 우회 경로**

기존 가드(PR-G5 패턴)는 3곳 모두 동일 조건:
```ts
// tournament-seeding.ts:220 (generateKnockoutMatches)
// tournament-seeding.ts:349 (generateEmptyKnockoutSkeleton)
// nba-seed-knockout.ts:286 (generateNbaSeedKnockout)
const existing = await prisma.tournamentMatch.count({
  where: { tournamentId, round_number: { not: null } },  // ← 가드 키
});
if (existing > 0) throw new Error(`이미 ${existing}건의 토너먼트 경기가 존재합니다.`);
```

**왜 이 대회엔 안 먹혔나 — 3가지 가능 경로 (코드 레벨 확정, DB 미조회)**:

1. **6/9 수동 INSERT 매치의 `round_number`가 NULL이었다** (가장 유력)
   - 수동 INSERT를 누가/어떻게 했는지에 따라 `round_number`를 안 박았거나 다른 값을 줌.
   - 가드는 `round_number IS NOT NULL`만 카운트 → 수동 매치가 NULL이면 가드 카운트 0 → 재생성 통과. **가드 키와 수동 INSERT 컨벤션 불일치가 핵심 함정.**

2. **`POST /bracket` route 경로** (`bracket/route.ts:178~227`)
   - `full_league_knockout`이면 `generateEmptyKnockoutSkeleton` 호출(L197). 이 가드도 `round_number IS NOT NULL`. 1번과 동일 사유로 우회 가능.
   - 게다가 이 경로의 skeleton 생성은 **try/catch로 에러를 삼킴**(L202~204 `console.error`만) → 가드 throw가 발생해도 사용자에겐 round_robin 성공으로 보임 → 중복 인지 실패.

3. **`assignTeamsToKnockout` 경로** (`tournament-seeding.ts:487`)
   - match PATCH의 auto-knockout-gen(`matches/[matchId]/route.ts:316~318`)이 `existingKnockout > 0`이면 `assignTeamsToKnockout` 호출.
   - 이 함수는 **idempotent 가드 자체가 없음**. 1라운드 빈 슬롯의 `settings.homeSlotLabel("N위")`를 파싱(L513~537)해서 팀을 채움 — `calculateLeagueRanking`(조 무시) 기반이라 **수동 크로스 배치를 덮어쓰지는 않지만**(NULL 슬롯만 UPDATE, L515), 표준 시드 라벨이 박힌 별개 skeleton 매치가 있었다면 그쪽에 잘못된 조합을 채움.

**결론**: 사고는 (원인1) 조 무시 시드 + (원인2) `round_number IS NOT NULL` 단일 가드가 "knockout 매치 존재"를 정확히 판정 못 하는 구조적 약점의 결합. 두 generator/skeleton/assign 경로가 서로의 산출물을 인지 못 함.

### 정확한 사고 경로 확정에 필요한 DB 실측 (PM에게 위임 — 본 설계는 read-only)
> 아래 SELECT 1회로 어느 경로였는지 확정 가능 (이미 운영 정리 완료라 현재 상태로는 불가, audit 로그/백업 필요할 수 있음):
```sql
-- 정리 전 상태였다면: round_number 분포로 경로 식별
SELECT round_number, "roundName", bracket_position, "homeTeamId", "awayTeamId", notes
FROM tournament_matches
WHERE tournament_id = '53112aa5-...' AND ("roundName" LIKE '%결승%' OR round_number IS NOT NULL)
ORDER BY round_number, bracket_position;
```

---

## (b) 재발 방지안 — PR 분해

### 방지 목표
- (방지 A) **중복 생성 차단**: knockout 매치가 이미 있으면(round_number 유무 무관) 재생성 throw.
- (방지 B) **2개조 조 무시 시드 차단**: 2개조+ 대회는 표준 시드 자동 생성을 막고 group-aware 크로스만 허용.

### PR 분해 (우선순위·규모·회귀위험)

| PR | 제목 | 내용 | 규모 | 회귀위험 | 우선순위 |
|----|------|------|------|----------|----------|
| **KO-1** | idempotent 가드 강화 | 가드 키를 `round_number IS NOT NULL` → **`isKnockoutMatch` 헬퍼**(roundName이 결승/준결승/N강 포함 OR round_number IS NOT NULL OR bracket_position 존재)로 교체. 3 generator + skeleton + assign 5곳 단일 헬퍼 통과 | S (~60 LOC, 신규 `isKnockoutMatch` + 5곳 치환) | 낮음 (가드만 강화, INSERT 로직 무변경) | ★★★★★ |
| **KO-2** | group-aware 가드 (자동 생성 차단) | `calculateLeagueRanking` 호출 전 **2개조+ 감지**(`TournamentTeam.groupName` distinct ≥ 2) → `generateKnockoutMatches`/`generateEmptyKnockoutSkeleton`/`assignTeamsToKnockout`/NBA가 `seedingMode !== "group_cross"`면 **throw + 운영자 안내 메시지**("2개조 대회는 group-aware 크로스 시드 필요. POST /bracket/knockout?mode=group_cross 사용") | S (~40 LOC, 공통 가드 함수 + 분기) | 낮음 (1개조 대회는 distinct=1 → 기존 동작 100% 보존) | ★★★★★ |
| **KO-3** | auto-knockout-gen try/catch 가시화 | `matches/[matchId]/route.ts:343` + `bracket/route.ts:202` 의 `console.error`만 하는 silent catch에 **warning 응답 박제**(skeletonWarning) → 운영자가 실패/중복 인지 가능 | XS (~15 LOC) | 없음 (응답 필드 추가만) | ★★★★ |
| **KO-4** | 운영 절차 가드 (문서) | (코드 외) `CLAUDE.md` 또는 `knowledge/conventions.md`에 "2개조+ knockout 수동 INSERT 표준" 박제: round_number 의무 + group_name 의무 + 크로스 검증 SELECT 1회 | XS (문서) | 없음 | ★★★ |

### 코드 레벨 가드 핵심 (KO-1 신규 헬퍼 예시 — 설계만)
```ts
// placeholder-helpers.ts 또는 tournament-seeding.ts 신규
// "이 대회에 이미 결선 매치가 존재하는가" 를 round_number 유무에 의존하지 않고 판정
export async function countKnockoutMatches(prisma, tournamentId: string): Promise<number> {
  return prisma.tournamentMatch.count({
    where: {
      tournamentId,
      OR: [
        { round_number: { not: null } },
        { roundName: { in: ["결승", "준결승", "8강", "16강", "32강", "3/4위전"] } },
        { roundName: { contains: "강" } },  // "준준결승" 등
      ],
    },
  });
}
```

### 운영 절차 가드 (양면 방어)
1. **2개조+ 대회 = 자동 생성 UI 버튼 비활성화** (bracket page에서 groupName distinct ≥ 2면 "수동/크로스 전용" 안내)
2. **수동 INSERT 시 round_number 의무** (가드가 인식하도록)
3. **knockout 생성 후 검증**: 같은 조 매치가 1라운드에 있는지 `detectInvalidPlaceholderMatches` 패턴 확장으로 자동 경고

---

## (c) 대회 생성 시 결선 일정 자동 등록 — generator 설계

### 목표
대회 생성(또는 예선 확정) 시점에 결선(준결승/4강/결승)이 **placeholder로 모두 등록**되고 화면에 `"A조 1위 vs B조 2위"` / `"4강 1경기 승자 vs 4강 2경기 승자"`로 표시. 누락·중복 0.

### 현재 자산 재활용 (신규 최소화)
| 기존 자산 | 역할 | 재활용 방식 |
|----------|------|-----------|
| `placeholder-helpers.ts` `buildSlotLabel` | 슬롯 라벨 단일 source | `group_rank` kind 그대로 ("A조 1위") + `match_winner` kind ("4강 1경기 승자") |
| `placeholder-helpers.ts` `buildPlaceholderNotes` | ADVANCEMENT_REGEX 호환 notes | "A조 1위 vs B조 2위" 자동 생성 |
| `generateEmptyKnockoutSkeleton` | 빈 뼈대 생성 패턴 | **group-aware 버전으로 확장** (조 무시 "N위" → "A조 N위") |
| `next_match_id` 연결 | 승자 전진 (advanceWinner 기반) | 결승 먼저 INSERT → SF에 next_match_id 연결 (6/9 수동 패턴을 자동화) |
| `advanceTournamentPlaceholders` | notes 파싱 → 실팀 채움 | 예선 종료 시 자동 매핑 (group_rank 슬롯) |

### 신규 generator 설계: `generateGroupCrossKnockout` (group-aware)

**위치**: `src/lib/tournaments/group-cross-knockout.ts` (신규) — PR-G5 plan/generate 분리 패턴 답습

**옵션 (`settings.bracket.seedingMode`)**:
| mode | 동작 | 대상 |
|------|------|------|
| `sequential` (기존 default) | 1+N, 2+N-1 표준 시드 | 1개조 대회 (회귀 0) |
| `nba` (기존) | 양분 트리 1+8/4+5 | 1개조 NBA 시드 |
| **`group_cross` (신규)** | **A1 vs B2 / B1 vs A2 크로스** | **2개조 대회** |

**`group_cross` 알고리즘** (2개조 4강 케이스 = YOUNGMAN GAME 정확히 일치):
```
입력: groupCount=2, advancePerGroup=2 (조별 상위 2팀 진출 = 4강)
1) 결승(round_number=2, bracket_position=0) placeholder INSERT
   - homeSlotLabel="준결승 1경기 승자", awaySlotLabel="준결승 2경기 승자"
2) SF1(round_number=1, bracket_position=0): "A조 1위" vs "B조 2위", next_match_id=결승
3) SF2(round_number=1, bracket_position=1): "B조 1위" vs "A조 2위", next_match_id=결승
   → 크로스: 1위는 상대 조 2위와 (같은 조 재대결 원천 차단)
4) 모두 homeTeamId/awayTeamId=NULL + notes=buildPlaceholderNotes(...) + settings.homeSlotLabel
```

**일반화** (조 수·진출 수 가변):
- `crossSeedPairs(groupCount, advancePerGroup)` PURE 함수 — 표준 크로스 룰: A1-B2, B1-A2 (2조) / 4조면 A1-D2, B1-C2... (8강 크로스)
- 본 PR 1차 범위 = **2조 4강** (YOUNGMAN 운영 케이스 100%), 4조+ 는 후속 PR 큐 (group_stage_knockout stub `division-advancement.ts:682` 와 통합 가능)

**예선 종료 시 자동 채움**:
- `notes`가 "A조 1위 vs B조 2위" 형식이면 `advanceTournamentPlaceholders`(`division-advancement.ts:839`)가 이미 파싱·매핑 가능.
- ⚠️ **단, 현재 `advanceTournamentPlaceholders`의 standingsMap 키는 `"그룹:랭크"`**(L849) — group_rank 기반이라 group_cross notes와 호환. **크로스라도 슬롯이 group_rank면 그대로 자동 채움 OK.**
- ⚠️ **`ADVANCEMENT_REGEX`(`division-advancement.ts:23`) 확인 필요**: `([A-Z])조\s*(\d+)위\s*vs\s*([A-Z])조\s*(\d+)위` — "A조 1위 vs B조 2위"는 매칭됨. 크로스는 rank만 다르고 형식 동일 → **regex·파서 수정 불필요**.

### 대회 생성 wizard 연동 (자동 등록 트리거)
| 트리거 시점 | 현재 | 설계 |
|------------|------|------|
| 대회 생성 직후 | knockout 없음 | (선택) `full_league_knockout`이면 wizard 저장 시 `generateGroupCrossKnockout`을 skeleton으로 호출 (예선 매치와 함께) |
| 예선(리그) 생성 시 | `POST /bracket`이 skeleton 생성(`bracket/route.ts:197`) | **group-aware 분기 추가**: groupName distinct ≥ 2 → `generateGroupCrossKnockout` skeleton / 1개조 → 기존 `generateEmptyKnockoutSkeleton` |
| 예선 종료 시 | auto-knockout-gen이 `assignTeamsToKnockout` | group_cross도 `advanceTournamentPlaceholders`로 통합 (slot label 파싱 기반, 조 무시 "N위" 파싱 폐기) |

### 화면 표시 (이미 지원됨 — 확인만)
- `bracket/route.ts:85` GET 응답에 `settings`(homeSlotLabel/awaySlotLabel) + `group_name` 포함 → UI가 팀 미확정 시 `settings.homeSlotLabel` 우선 표시. **추가 작업 불필요** (PR-G5.6 single_elim 슬롯 라벨과 동일 렌더 경로).

### 자동 등록 generator PR 분해
| PR | 제목 | 규모 | 회귀위험 | 우선순위 |
|----|------|------|----------|----------|
| **KO-5** | `crossSeedPairs` PURE + vitest | S (~80 LOC + 테스트) | 없음 (순수함수) | ★★★★ |
| **KO-6** | `generateGroupCrossKnockout` DB generator | M (~150 LOC, skeleton + next_match_id 2단계 UPDATE) | 낮음 (신규 mode opt-in, 기존 sequential/nba 무변경) | ★★★★ |
| **KO-7** | `POST /bracket` + `POST /bracket/knockout` group_cross 분기 | S (~50 LOC, seedingMode 분기 추가) | 낮음 (1개조 회귀 0) | ★★★ |
| **KO-8** | 예선 종료 auto-fill 통합 (assignTeamsToKnockout → advanceTournamentPlaceholders) | M (~80 LOC) | 중간 (auto-knockout-gen 경로 변경 — full_league_knockout 1개조 회귀 검증 필수) | ★★★ |

---

## (d) 우선순위 / 규모 / 회귀위험 종합

### 권장 실행 순서 (2 Sprint)

**Sprint 1 — 재발 방지 (긴급, 운영 안전)**
| 순서 | PR | 담당 | 선행 |
|------|-----|------|------|
| 1 | KO-1 (가드 강화 `countKnockoutMatches`) | developer | 없음 |
| 2 | KO-2 (group-aware 자동생성 차단) | developer | KO-1 |
| 3 | KO-3 (silent catch 가시화) | developer | 없음 (병렬 가능) |
| 4 | KO-4 (운영 절차 문서) | pm | 없음 |

→ Sprint 1만으로 **이번 사고(중복 + 조 무시)는 영구 차단**. KO-2가 자동 생성을 막으므로 group_cross generator 없어도 수동 크로스는 안전.

**Sprint 2 — 자동 등록 (편의·누락 방지)**
| 순서 | PR | 담당 | 선행 |
|------|-----|------|------|
| 5 | KO-5 (`crossSeedPairs` PURE + vitest) | developer | 없음 |
| 6 | KO-6 (`generateGroupCrossKnockout`) | developer | KO-5 |
| 7 | KO-7 (route 분기) | developer | KO-6 |
| 8 | KO-8 (auto-fill 통합) | developer | KO-6, KO-7 |
| 9 | 검증 | tester + reviewer (병렬) | 5~8 |

### 규모 총계
- Sprint 1: ~115 LOC (S×2 + XS×2) — 1일 이내
- Sprint 2: ~360 LOC (S×2 + M×2) + vitest — 2~3일

### 회귀위험 매트릭스
| 위험 영역 | 영향 PR | 완화책 |
|----------|---------|--------|
| 1개조 full_league_knockout 대회 (4차 뉴비리그 등) | KO-2, KO-8 | groupName distinct=1 분기 = 기존 경로 100% 보존. vitest로 1개조 회귀 게이트 |
| 강남구협회장배 division_rule 경로 | KO-1 가드 | division_rule 대회는 `advanceDivisionPlaceholders` 경로 별개 — knockout 가드 무관. 영향 0 |
| dual_tournament (27매치) | 전체 | format 분기로 격리됨. group_cross는 full_league_knockout 전용 |
| NBA seedingMode | KO-2, KO-7 | nba mode 유지, group_cross는 신규 mode. 충돌 0 |

### 핵심 설계 결정 (decisions.md 박제 대상)
1. **idempotent 가드 키 = `round_number IS NOT NULL` 단독 → knockout 판정 헬퍼**로 강화 (round_number 미박제 수동 매치도 인식)
2. **2개조+ 대회 자동 생성 = throw 차단**(opt-in group_cross만 허용) — 조 무시 시드 원천 봉쇄
3. **group_cross = 신규 seedingMode opt-in** — 기존 sequential/nba 회귀 0
4. **예선 종료 auto-fill = `advanceTournamentPlaceholders` 단일화**(조 무시 `assignTeamsToKnockout` "N위" 파싱 폐기 방향)

---

## 추가 이슈: 예선 종료 → 대회 종료 오분류 (2026-06-14 append)

> 계기: 사용자 보고 — "제10회 BDR YOUNGMAN GAME이 **예선(조별리그) 종료 시점에 '대회 종료'로 분류**됐다. 결선이 생성되지 않았기 때문으로 보인다."
> 단서: errors.md [2026-06-08] "대회 종료 표시 = status 필드 기반(날짜 무관)" (당시 '자동 cron 없음, 수동 종료 추정'이라 기록 → **본 분석으로 그 추정이 틀렸음을 확정**). errors.md [2026-06-09] "예선 완료 시 auto-knockout-gen이 try/catch로 실패 삼킴 → 4강 0건".
> **read-only 분석 — 코드·DB 변경 0. 정확한 실행 경로 1건 확정엔 audit/백업 SELECT 1회 필요(운영 정리 완료라 현재 DB로는 불가).**

### 과제 1 — 대회 status='completed' SET 모든 경로 (코드 실측)

| # | 경로 | status SET 방식 | 비고 |
|---|------|----------------|------|
| 1 | **`auto-complete.ts` `checkAndAutoCompleteTournament`** | **자동** — 모든 매치 종료(completed/cancelled/forfeit)면 `tournament.update({status:'completed'})` (L81~84) | ★**자동 오분류 주범**. 2026-05-12 도입(파일 헤더 명시). errors.md [2026-06-08] "cron 없음·수동 추정"은 **이 트리거를 못 봤던 것** — 재검증 결과 자동 trigger 실재 |
| 2 | `finalizeMatchCompletion`(매치종료 통합헬퍼) | 위 1을 **모든 종료 path에서 호출** (admin PATCH / match-sync / match.ts / batch-sync 4경로 단일화, 2026-05-16 통합) | 자동 종료가 매 매치 종료마다 멱등 실행됨 |
| 3 | 어드민 대회수정 PATCH (`tournaments/[id]/route.ts`) | 수동 — 운영자가 status 직접 변경 | 신고 시 후보였으나 본건은 자동 경로 |
| 4 | 대회 삭제(soft) (`route.ts` DELETE) | 수동 — status='cancelled' | 무관 |

→ **결론: 자동 cron은 아니지만 "매치 종료 hook"형 자동 trigger가 존재**. errors.md [2026-06-08]의 "수동 종료 추정"은 오기 — 본 섹션에서 정정.

### 과제 2 — "모든 매치 종료 = 대회 종료" 오판 로직 확정

```ts
// auto-complete.ts L57~84 (핵심)
const [total, finished] = await Promise.all([
  count({ where: { tournamentId } }),                              // ← 전체 매치
  count({ where: { tournamentId, status: { in: MATCH_FINAL } } }), // ← 종료 매치
]);
if (finished < total) return { updated:false };   // 미완료 1건+ 있으면 no-op
await tournament.update({ status:'completed' });   // 100% → 자동 종료
```

- `total`은 **format 무관, 결선 존재 여부 무관**으로 "현재 DB에 박제된 매치"만 셈.
- **full_league_knockout인데 결선 매치가 0건이면** → total = 예선 매치 수 → 예선 전부 완료 시 `finished === total` → **자동 종료 성립**. "예선 = 전체"로 오판하는 구조가 확정됨.
- 결정적 보강: `isLeagueComplete`(seeding.ts:547)는 `round_number IS NULL`(예선)만 보고 결선 0건이어도 true. 즉 시스템 어디에도 "결선이 아직 안 끝났다"를 auto-complete에 알리는 신호가 없음.

### 과제 3 — 결선 자동생성 실패(KO-3 silent catch)와의 인과 (확정)

**admin PATCH route(`matches/[matchId]/route.ts`) 실행 순서 — 결정적 함정**:
```
L263  if (status==='completed' && !alreadyCompleted) {
L265    await finalizeMatchCompletion(...)   // ← ① 이 안에서 checkAndAutoCompleteTournament 실행
                                             //    이 시점 DB 결선 = 0건 → total=예선 → 자동 종료 UPDATE 발생
L292    try { ... auto-knockout-gen ... }    // ← ② 결선 생성은 그 "다음"에 시도
L343    catch(e){ console.error(...) }        //    KO-3 silent catch — 실패해도 응답 성공
```
→ **순서 역전**: 자동 종료(①)가 결선 생성(②)보다 **먼저** 실행. 설령 ②가 성공해 결선이 생겨도 대회는 이미 종료됨. ②가 silent catch로 실패(errors.md [2026-06-09] 조 무시 throw / round_number NULL 우회)하면 **결선 0건 + 종료 확정** = 본 사고 모양 정확히 일치.

**경로별 분기 (중대 발견)**:
- **auto-knockout-gen은 admin PATCH route에만 존재.** `match-sync.ts`/`match.ts`/`batch-sync`(Flutter sync·score-sheet 경유) 종료 path에는 finalize(=auto-complete)만 있고 **결선 생성 로직 자체가 없음**.
- 따라서 **예선 마지막 매치가 Flutter/score-sheet로 완료되면** 결선은 생성 시도조차 안 되고 auto-complete만 돌아 **무조건 종료**.

**skeleton 존재 여부 = 분기점 (오분류 발생 조건 확정)**:
| 케이스 | 결선 skeleton(빈 뼈대) | auto-complete `total` | 결과 |
|--------|----------------------|----------------------|------|
| 정상 (bracket 생성 시 skeleton 생성됨, bracket/route.ts:197) | 있음(round_number 박제) | 예선 + 결선(미완료) | `finished<total` → **종료 안 됨** ✅ |
| **본 사고** (skeleton 우회 — 6/9 수동 INSERT 대회. errors [2026-06-09] "자동 trigger 미작동") | 없음 또는 round_number NULL | 예선만 | `finished===total` → **자동 종료** ❌ |

→ **인과 최종**: (a) skeleton 미생성/round_number NULL(6/9 수동 대진) → (b) 결선이 total에 안 잡힘 + auto-knockout-gen이 silent catch로 실패/우회 → (c) 예선 완료 = 100%로 auto-complete가 status='completed' SET. **KO-3 silent catch가 (b)의 우회를 가시화 못 한 게 오분류를 굳힘.**

### 과제 4 — 방지책 + Sprint 우선순위

**핵심 방지 원칙**: 결선 format(full_league_knockout 등) 대회는 **결선이 완료되기 전엔 auto-complete 금지**. + 예선 종료 시 결선 placeholder가 항상 존재하도록 보장해 "다음 단계 부재"를 차단.

| 신규 PR | 내용 | 규모 | 회귀위험 | Sprint |
|---------|------|------|----------|--------|
| **KO-9** ★★★★★ | `checkAndAutoCompleteTournament`에 **결선 미생성 가드** 추가: `format==='full_league_knockout'`(또는 결선 포함 format)인데 **결선 매치(round_number IS NOT NULL / KO-1 `countKnockoutMatches`)가 0건**이면 `updated:false, reason:'knockout-not-generated'`로 **자동 종료 차단**. 예선만으로는 절대 종료 안 됨 | XS (~12 LOC, count 1회 + 분기) | 낮음 (1라운드 elimination·dual·일반 리그는 결선 개념 무관 → format 가드로 격리. 결선 정상 생성 대회는 결선 미완료라 어차피 막힘) | **Sprint 1** |
| **KO-3** (기존) | auto-knockout-gen silent catch 가시화 (warning 응답) | XS | 없음 | Sprint 1 |
| **KO-10** ★★★ | **예선 종료 시 결선 placeholder 보장**: auto-knockout-gen을 admin PATCH 외 모든 종료 path(finalize 통합)로 이동 OR 최소한 skeleton 부재 시 `generateEmptyKnockoutSkeleton`(group-aware=KO-6) 호출해 "다음 단계 부재" 원천 차단 | M (~80 LOC, finalize 통합) | 중간 (Flutter/score-sheet 종료 path 변경 — 1개조 회귀 검증 필수) | **Sprint 2** (KO-6 group_cross 의존) |

**Sprint 배정 판단**:
- **KO-9는 Sprint 1(재발방지)에 즉시 편입** — XS·회귀 거의 0이고, 이 한 줄 가드만으로 "예선 종료 → 대회 종료 오분류"가 **format 레벨에서 영구 차단**됨. 결선 생성 성공 여부와 독립적으로 안전(결선 0건이면 종료 자체를 막으므로). KO-3(가시화)와 짝.
- **KO-10(결선 placeholder 보장)은 Sprint 2** — 근본 편의 개선이지만 종료 path 변경이라 회귀위험 중간, group_cross generator(KO-6) 선행 필요. KO-9가 이미 "잘못된 종료"를 막으므로 긴급도는 낮음(누락 시 운영자가 수동 결선 생성으로 진행 가능, 대회가 잘못 종료되진 않음).

**KO-9 코드 핵심 (설계만)**:
```ts
// auto-complete.ts checkAndAutoCompleteTournament 내, total/finished 카운트 직후
// 결선 포함 format인데 결선 매치 0건이면 종료 보류 (예선=전체 오판 차단)
const KNOCKOUT_FORMATS = ["full_league_knockout"]; // dual_tournament은 자체 진행로직
if (KNOCKOUT_FORMATS.includes(tournament.format ?? "")) {
  const knockoutCount = await client.tournamentMatch.count({
    where: { tournamentId, round_number: { not: null } }, // KO-1 후 countKnockoutMatches로 교체
  });
  if (knockoutCount === 0) {
    return { updated:false, reason:"knockout-not-generated", finished, total };
  }
}
```
※ `auto-complete.ts`는 현재 `tournament.format`을 select 안 함(status만) → KO-9 시 select에 `format` 추가 필요(L46~49).

### 운영 데이터 확정에 필요한 SELECT (PM 위임 — read-only 설계 범위 외)
```sql
-- 본 대회가 어느 경로로 종료됐는지 + skeleton 유무 확정 (정리 전 상태/audit 필요)
SELECT round_number IS NOT NULL AS is_knockout, status, count(*)
FROM tournament_matches
WHERE tournament_id = '53112aa5-c352-428a-954c-3d1f43580ad9'
GROUP BY 1, 2;
-- is_knockout=true 행이 0이면 → skeleton 미생성 = 본 분석의 '본 사고' 케이스 확정
```
