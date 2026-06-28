# 순위표 집계 근본 수정 설계서 (B안) — read-only 설계

- **작성일**: 2026-06-14
- **작성**: planner-architect
- **분류**: 설계 전용 (코드/DB 변경 0). 실측은 운영 DB SELECT only (영향 0, 스크립트 정리 완료)
- **대상 버그**: 5차 뉴비리그(7f287820) 결승 혼입 + stale 누락

---

## 0. 비유로 이해 (바이브 코더용)

순위표 집계는 **"성적표 자동 채점기"** 다.

- 예선 경기마다 점수를 더해서 팀별 성적표(`TournamentTeam.wins/losses/...` = **엑셀 셀에 박아둔 값**)에 적는다.
- 지금 채점기는 "이 대회의 끝난 경기 전부"를 더한다. 그런데 **결승전도 끝난 경기**라서, 결승까지 예선 성적에 더해버린다. → 오름이 결승 1승을 예선 성적표에 받아 **W3**(실제 W2)이 됨.
- 또 채점기는 **방금 끝난 경기의 두 팀만** 다시 채점한다. 그래서 #291(하늘공작단 승)이 채점 트리거를 못 받아 하늘공작단은 **W0**(실제 W1)로 멈춰 있음(stale).

고칠 점 2가지:
1. **결승/토너먼트 경기는 예선 성적표 채점에서 빼라** (결승제외).
2. **같은 조 경기만 더해라** (조별격리 — 안전망).

---

## 1. ★ DB 실측 결과 (운영 SELECT, 영향 0)

### 1-1. 전체 분포

| 항목 | 값 |
|------|-----|
| Tournament.format | round_robin 28 / single_elimination 12 / **(null) 7** / **full_league_knockout 6** / league 4 / dual_tournament 2 / round_robin\|single_elimination 1 / double_elimination 1 |
| division_rule 보유 대회 | **1건** (강남구 유소년부만) |
| 매치 group_name NOT NULL | 50 / 전체 155 |
| 팀 groupName NOT NULL | 66 / 전체 92 |
| 매치 settings.division_code NOT NULL | 59 (강남구만) |
| roundName "결승" 포함 매치 | 10건 / 그중 bracket 좌표 없음 8건 |
| bracket 좌표(round_number+bracket_position) 박제 | 30건 |

### 1-2. ★ 5차 뉴비리그(7f287820) 전수 — 진단 확정

- `format=full_league_knockout`, `division_rule=0`, `settings={}` (division_code 없음)
- 팀 6건: A조 3팀(스나이퍼/Gots/하늘공작단) + B조 3팀(오름/스위치/그로우업). **팀 groupName 박제됨**(A/B). category=NULL.
- 매치 7건: 예선 6건(매치 group_name A/B 박제) + 결승 #301(group_name=**NULL**, roundName="결승", bracket 좌표 없음, notes="결승 후보① A1위=스나이퍼 / B1위=오름")

**현재(버그) vs 수정후(정확) 박제값**:

| 팀 | 조 | 현재(버그) | 수정 후(정확) | 차이 원인 |
|----|----|-----------|--------------|----------|
| 스나이퍼 | A | W1 L0 PF82 PA86 | **W1 L1 PF90 PA83** | #291(하늘공작단전 48:49 패) 누락 |
| 하늘공작단 | A | **W0 L1** PF27 PA31 | **W1 L1 PF76 PA79** | #291(스나이퍼전 49:48 승) stale 누락 |
| Gots | A | W1 L1 PF65 PA69 | W1 L1 PF65 PA69 | 변화 없음 |
| 오름 | B | **W3** L0 PF126 PA106 | **W2 L0 PF74 PA66** | 결승 #301(스나이퍼전 52:40 승) 혼입 |
| 스위치 | B | W1 L1 PF60 PA61 | W1 L1 PF60 PA61 | 변화 없음 |
| 그로우업 | B | W0 L2 PF64 PA71 | W0 L2 PF64 PA71 | 변화 없음 |

→ 수정 시뮬레이션: 예선 6건만 집계 / 결승 #301 제외 / 조간 매치 0건(혼입 차단 불필요했으나 안전망 작동).

### 1-3. ★★ 회귀 분석표 — format별 영향

| format | 대회수 | group_name 박제 | 결승제외 영향 | 조별격리 영향 | update-standings 사용 | 회귀 판정 |
|--------|-------|----------------|--------------|--------------|----------------------|----------|
| **full_league_knockout** | 6 | 팀 GN 박제 O | **6/6 대회 영향** (결승/4강이 예선에 혼입 중) | 0 (조간 예선 없음) | O | **★개선됨**(버그 수정) |
| round_robin | 28 | 일부 | 0 (결승 매치 없음) | 0 | O | 영향 0 |
| single_elimination | 12 | X(2팀) | 1 (테스트 대회만 "결승") | 0 | O(advanceWinner 위주) | 사실상 0 |
| league | 4 | — | 0 | 0 | O | 영향 0 |
| (null) 다종별 | 7 | — | 0 | 0 | 분기됨 | 영향 0 |
| **dual_tournament** | 2 | 매치 GN만(팀 GN=NULL) | bracket좌표 27건(몰텐배) | 0 | O(단계1 항상 호출) | **회귀 0**(아래 1-4) |
| double_elimination | 1 | — | — | — | — | 영향 0 |
| round_robin\|single_elim | 1 | — | — | — | — | 영향 0 |

**"결승/KO 제외" 시 standings 바뀌는 대회 = 6건** (모두 full_league_knockout, 전부 현재 결승이 예선에 혼입된 버그 상태 → 수정이 곧 개선).
대상 매치 예시:
- 6차 스타터스리그(e06eb068) #274"결승"
- 제2회 W 대학동아리(591f2289) #260"결승"
- 제10회 YOUNGMAN(53112aa5) #281"결승" #282"4강" #283"4강"
- 5차 뉴비리그(7f287820) #301"결승"
- 4차 뉴비리그(443f23f8): 결승 아직 미완료 → 영향 0 (예선만 박제 정상)

**"조별격리" 시 standings 바뀌는 대회 = 0건** — 모든 대회가 같은 조끼리만 예선을 치름(조간 예선 매치 0). 조별격리는 **5차 뉴비리그 #301 같은 결승(조간) 혼입의 2차 안전망**으로만 작동. 단독으로 깨질 대회 없음.

### 1-4. ★ dual_tournament 회귀 0 근거 (몰텐배 실측)

- 몰텐배(138b22d8) 팀 standings = **전부 W0 L0 PF0 PA0** → dual은 TournamentTeam standings를 **사용/박제 안 함** (대진 진행은 progressDualMatch + 매치 group_name 5섹션 그룹핑).
- 팀 groupName = 전부 NULL → 조별격리 무관.
- completed 27건 전부 bracket 좌표 보유 → "bracket 좌표 제외" 가드가 dual 풀리그 매치를 제외해도 어차피 standings 0 유지 → **영향 0**.
- finalize 단계1은 isDual 무관 항상 updateTeamStandings 호출하나, dual은 결과를 안 읽으므로 무해.

### 1-5. 강남구(division_code) 회귀 0 근거

- 강남구(bd527531): division_code 격리가 **이미 작동 중**(matchesWhere에 `settings.division_code` equals 필터). 결승/KO completed = 0(아직), 조간 예선 = 0.
- 본 수정은 divisionCode 분기를 건드리지 않고 그 **안쪽에 조별격리 + 결승제외만 추가** → 강남구 회귀 0.

---

## 2. update-standings.ts 수정안 (설계만)

### 2-1. 만질 위치

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/lib/tournaments/update-standings.ts` | `updateTeamStandings()` 내부 — (a)결승/KO 제외 필터 강화 (b)조별격리 가드 추가 | 수정 |

> **다른 파일 변경 0**. public-bracket route는 groupTeams가 박제 컬럼을 그대로 읽으므로 재박제만 하면 자동 반영. division-advancement.ts(getDivisionStandings)도 박제 컬럼 읽음 → 자동 반영.

### 2-2. 변경 ① — 결승/KO 제외 강화 (L140~146, L176~179)

현재(예선 후보 필터):
```ts
// completedMatches: 순위전만 제외
const completedMatches = rawCompletedMatches.filter(
  (m) => !m.roundName || !/순위/.test(m.roundName),
);
```

수정안 — **공통 헬퍼로 "예선 매치 판정"을 통일**:
```ts
// 예선(조별리그) 매치만 standings 에 합산. 결승/KO/순위전은 제외.
//   제외 조건 (OR):
//     1) roundName 가 "순위" 포함 (기존)
//     2) roundName 가 결승/준결승/4강/8강/16강/결승토너먼트 키워드 포함 (신규)
//     3) round_number != null && bracket_position != null = 토너먼트 트리 좌표 박제 (신규)
//   → 셋 중 하나라도 참이면 예선 아님 → standings 제외.
const isPrelimMatch = (m: {
  roundName: string | null;
  round_number?: number | null;
  bracket_position?: number | null;
}): boolean => {
  const rn = m.roundName ?? "";
  if (/순위/.test(rn)) return false;                       // 순위전 (기존)
  if (KNOCKOUT_ROUND_REGEX.test(rn)) return false;          // 결승/4강/8강 등 (신규)
  if (m.round_number != null && m.bracket_position != null) // 트리 좌표 (신규)
    return false;
  return true;
};
const completedMatches = rawCompletedMatches.filter(isPrelimMatch);
// drawMatches 도 동일 필터 적용
const drawMatches = rawDrawMatches.filter(isPrelimMatch);
```

신규 정규식(파일 상단 상수):
```ts
// 결승/녹아웃 라운드명 — 예선 standings 제외 키워드.
//   "순위" 는 별도 RANKING regex (기존) — 본 regex 와 분리.
const KNOCKOUT_ROUND_REGEX = /결승|준결승|준준결승|[0-9]+강|3[ \-]?4위|플레이오프|knockout|final|semi|quarter/i;
```

> **주의**: `rawCompletedMatches`/`rawDrawMatches` SELECT에 `round_number`, `bracket_position` 컬럼을 **추가**해야 함(현재 select에 없음 — L130~139, L166~174). roundName은 이미 select됨.

### 2-3. 변경 ② — 조별격리 가드 (L205~278 합산 loop)

현재: 모든 completedMatches 를 합산(조 무관). 수정안 — **두 팀의 groupName 이 다르면 skip**:

```ts
// 본 update-standings 가 처리하는 home/away 팀의 groupName 조회 (단건 추가 SELECT 또는 match SELECT 확장)
// → 각 합산 loop 매치도 두 팀 groupName 비교. 단, 단건 trigger 라 "homeId/awayId 팀의 조"만 알면 됨.
```

구현 방식 (단순안 — 폴백 포함):
```ts
// homeId/awayId 팀의 groupName 을 1회 SELECT (TournamentTeam.groupName)
const trigTeams = await prisma.tournamentTeam.findMany({
  where: { id: { in: [homeId, awayId] } },
  select: { id: true, groupName: true },
});
const groupOf = (id: bigint) => trigTeams.find((t) => t.id === id)?.groupName ?? null;

// 합산 loop 안에서: 매치의 두 팀이 "본 trigger 팀"과 합산될 때,
//   loop 매치의 상대 팀 groupName 도 알아야 cross-group 판정 가능.
//   → completedMatches SELECT 에 homeTeam/awayTeam.groupName 포함 필요.
```

**더 단순한 구현 (권장)** — 합산 loop 매치 SELECT에 양 팀 groupName 포함 후, **매치의 home/away groupName 이 서로 다르면 그 매치는 조간 매치 → skip**:
```ts
for (const m of completedMatches) {
  // 조별격리: 두 팀 groupName 모두 NOT NULL 이고 서로 다르면 = 조간 매치 → skip (예선 아님)
  //   폴백: groupName 하나라도 NULL = 그룹 미지정 대회(round_robin 등) → 격리 안 함(전체 1조 취급, 기존 동작 보존)
  const hg = m.homeTeam?.groupName ?? null;
  const ag = m.awayTeam?.groupName ?? null;
  if (hg != null && ag != null && hg !== ag) continue;  // 조간 매치 제외
  // ... 기존 합산 로직 ...
}
// drawMatches 도 동일
```
이 방식은 `homeId/awayId 팀의 groupName` 별도 조회가 불필요(매치 자체의 양 팀 groupName만 보면 됨). SELECT 확장만 필요.

> **주의**: `completedMatches`/`drawMatches` SELECT에 `homeTeam: { select: { groupName: true } }`, `awayTeam: { select: { groupName: true } }` 추가 필요.

### 2-4. 폴백 안전성 (회귀 차단 핵심)

| 케이스 | 동작 | 회귀 |
|--------|------|------|
| groupName 둘 다 NULL (round_robin 단일 풀리그) | 격리 안 함 = 전체 1조 = 기존 동작 | 0 |
| groupName 한쪽만 NULL | 격리 안 함(둘 다 NOT NULL일 때만 비교) | 0 |
| roundName 결승/KO 없는 순수 풀리그 | 결승제외 무발동 | 0 |
| bracket 좌표 없는 예선 매치 | 좌표 제외 무발동 | 0 |
| dual_tournament | standings 미사용 → 무해 | 0 |
| 강남구 division_code | divisionCode 분기 안쪽에서 추가 격리(이중) | 0 |

---

## 3. 재박제 방법 (5차 뉴비리그만, DB UPDATE는 PM 승인 후)

### 3-1. 방법 비교

| 방법 | 설명 | 안전성 | 권장 |
|------|------|--------|------|
| A. updateTeamStandings 재호출 | 수정 머지 후 5차 뉴비리그 6팀 각각 트리거(예선 매치 1건씩 호출) | SET 방식이라 idempotent. 단 6팀 모두 트리거되게 매치 6건 호출 | △ |
| **B. 전용 재집계 스크립트** | scripts/_temp/recalc-newbie5.ts — 수정된 isPrelimMatch+조별격리 로직으로 6팀 SET UPDATE 1회 | 단일 트랜잭션, tournamentId 하드코딩으로 범위 한정, 사전 SELECT 검증 | **O** |

권장 = **B**. 사유: A는 모든 팀이 "최근 트리거" 받았는지 보장 어렵고(하늘공작단 stale 재발 가능), B는 6팀 전부 명시적 SET.

### 3-2. 재박제 스크립트 설계 (B — 승인 후 작성/실행)

```
대상: tournamentId = 7f287820-... (하드코딩)
1) 예선 매치 SELECT (status=completed, winner NOT NULL, isPrelimMatch=true, 같은조)
2) 6팀 in-memory 합산 (update-standings 수정 로직과 동일)
3) 사전 검증 SELECT: 현재 박제값 출력 (오름 W3 등 확인)
4) [PM 승인] → TournamentTeam.updateMany 6건 SET (wins/losses/draws/points_for/points_against/point_difference/win_points)
5) 사후 검증 SELECT: 오름 W2 / 하늘공작단 W1 확인
6) 스크립트 즉시 삭제
```

### 3-3. 예상 결과 (재박제 후)

| 조 | 순위 | 팀 | W-L | PD |
|----|------|----|----|----|
| A | 1 | 스나이퍼 | 1-1 | +7 |
| A | 2 | 하늘공작단 | 1-1 | -3 |
| A | 3 | Gots | 1-1 | -4 |
| B | 1 | 오름 | 2-0 | +8 |
| B | 2 | 스위치 | 1-1 | -1 |
| B | 3 | 그로우업 | 0-2 | -7 |

> win_points: default 룰 = wins×3. 스나이퍼/하늘/Gots/스위치=3, 오름=6, 그로우업=0.

---

## 4. #301 결승 좌표 부여 (대진표 트리 표시)

### 4-1. 현재 상태 / 문제

- #301: roundName="결승", round_number=**NULL**, bracket_position=**NULL**, bracket_level=NULL.
- public-bracket route L366: `bracketOnlyMatches = matches.filter(m.round_number != null && m.bracket_position != null)` → #301 좌표 NULL이라 **트리에서 빠짐**.
- 결과: 결승전이 대진표 트리에 안 보이고 leagueMatches(시간순 리스트)에만 노출됨.

### 4-2. 좌표 부여 값 제안

5차 뉴비리그는 예선(풀리그) 후 결승 1경기 구조. 결승만 트리에 표시하려면 **1라운드 1매치 트리**가 되도록:

| 필드 | 제안 값 | 사유 |
|------|--------|------|
| `round_number` | **1** | bracketOnlyMatches가 1라운드만 가지면 단일 매치 트리. buildRoundGroups가 round_number로 그룹핑 → 1개 그룹. |
| `bracket_position` | **0** | 그룹 내 첫(유일) 매치. bracket-builder가 bracket_position asc 정렬. |
| `bracket_level` | **0** (또는 1) | bracket-builder는 bracket_level 사용 안 함(round_number 기반 레이아웃) → 표시 영향 없음. 0 권장. |

→ buildRoundGroups → 1라운드 1매치(스나이퍼 vs 오름, 오름 승) 단일 트리 표시. finalsDate도 maxRound=1의 #301 scheduledAt으로 채워짐.

### 4-3. ★★ 충돌 검증 — 좌표 부여가 standings를 다시 깨지 않는가

- **수정 ① 결승제외**가 `round_number != null && bracket_position != null` 도 제외하므로, #301에 좌표(1,0)를 박아도 standings에서 자동 제외됨. roundName="결승"도 KNOCKOUT regex로 제외. **이중 안전** → standings 재혼입 0.
- 즉 **반드시 update-standings 수정(2-2)을 먼저 머지/재박제한 뒤** #301 좌표를 부여해야 함. (순서 역전 시 좌표 부여가 좌표제외 가드를 트리거해 또 재집계 필요 — 단 수정 후엔 무해)

### 4-4. 좌표 부여 방법

- 별도 1회 UPDATE 스크립트(scripts/_temp) 또는 admin UI. 매치 1건 UPDATE(round_number=1, bracket_position=0, bracket_level=0). DB 변경이므로 PM 승인 후.
- group_name은 NULL 유지(결승은 조 없음 — 트리 표시에 불필요).

---

## 5. 실행 계획

| 순서 | 작업 | 담당 | 선행 | 비고 |
|------|------|------|------|------|
| 1 | update-standings.ts 수정 (결승제외 강화 + 조별격리 + SELECT 확장) | developer | 없음 | 핵심. 폴백 필수 |
| 2 | vitest update-standings.test.ts 회귀 + 신규 케이스 | tester | 1 | 결승제외/조별격리/폴백 단위 |
| 3 | 재박제 스크립트(B) 작성 + 사전 SELECT 검증 | developer | 1 | DB UPDATE 전 PM 승인 |
| 4 | [PM 승인] 5차 뉴비리그 재박제 실행 + 사후 검증 | PM | 3 | 오름 W2/하늘 W1 확인 |
| 5 | #301 좌표 부여(round=1,bp=0) 스크립트 + [PM 승인] 실행 | developer→PM | 4 | 반드시 4 이후 |
| 6 | 공개 대진표 탭 육안 확인(결승 트리 표시 + 순위표 정확) | tester | 5 | 프리뷰 |
| 7 | 임시 스크립트 정리 + decisions.md/architecture.md 기록 | PM | 6 | |

> 1~2는 코드(회귀 안전), 3~5는 DB(승인 게이트). 2와 3은 병렬 가능.

---

## 6. 위험도 / 규모 평가

| 항목 | 평가 | 근거 |
|------|------|------|
| 코드 변경 규모 | **낮음** | update-standings.ts 1파일, +20~30 LOC(필터 헬퍼+격리 가드+SELECT 2필드×2쿼리) |
| 회귀 위험 | **낮음** | 폴백(groupName NULL=격리안함) + 결승제외는 버그 수정 방향. round_robin 28/league 4 영향 0 실측 |
| DB 재박제 위험 | **중** | 운영 DB UPDATE 6행. tournamentId 한정 + 사전/사후 SELECT 검증 + PM 승인 게이트로 통제 |
| dual/강남구 회귀 | **0** | dual standings 미사용(실측) / 강남구 division_code 격리 유지(분기 안쪽 추가) |
| #301 좌표 부여 | **낮음** | 1행 UPDATE. 수정 ① 머지 후라 standings 재혼입 0(이중 가드) |

**종합**: 코드 수정은 저위험(폴백 견고, 영향 대회 6건 모두 버그 상태→개선). DB 작업은 PM 승인 게이트 2곳(재박제, 좌표부여)으로 통제. 근본 원인(전체 합산 + 결승 미제외)을 update-standings.ts에서 차단하므로 향후 full_league_knockout 신규 대회도 자동으로 정상 집계됨.

---

## 7. PM 확인 필요 사항

1. **결승제외 판정 기준** — 3중 OR(순위 키워드 / KO 키워드 / bracket 좌표) 채택 여부. (권장: 3중 모두 — 어느 하나만으로는 누락 가능. #301은 현재 좌표 NULL이라 KO 키워드로 잡고, 좌표 부여 후엔 좌표로도 잡힘)
2. **조별격리 채택 여부** — 실측상 단독 영향 0(안전망 역할). 추가해두면 향후 조간 예선 박제 실수 방어. (권장: 추가)
3. **재박제 범위** — 5차 뉴비리그만 vs 영향 6개 대회 전부. 다른 5개도 현재 결승 혼입 버그 상태. (권장: 우선 5차만 검증 후 나머지 5개 동일 스크립트로 일괄 — 단 completed 대회는 이미 시즌 종료라 영향 체감 적음)
