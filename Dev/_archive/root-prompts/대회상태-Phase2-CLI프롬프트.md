# Phase 2 — 실진행 대회 데이터 정합 (DB 종료 처리 + 우승팀) · CLI 프롬프트

> ⚠️ **운영 DB UPDATE 작업.** CLAUDE.md §DB 가드 필수: destructive 전 사용자 승인 + SELECT 사전검증 + 사후 count 검증.
> Phase 1(표시 레이어)이 끝나면 이 화면은 이미 "종료"로 보임. **Phase 2는 데이터(원시 status·우승팀)를 실제로 맞추는 작업** — awards/프로필/시리즈/관리자 종료 hub 가 raw status·champion 을 읽기 때문.

---

## 0. 대상 (실측 2026-06-14 기준)

**2A — 즉시 종료 후보 (경기 완료, 매치 7/팀 6):**
1. 2026 4차 BDR 뉴비리그 — published
2. 2026 5차 BDR 뉴비리그 — published (순위/결승 이미 정리됨)
3. 2026 6차 BDR 스타터스리그 — published

**2B — 보류 (결선 진행 대기):**
4. 열혈농구단 SEASON2 — in_progress, 종료일 2024-06-27. **방금 결선 생성됨 → 결선 경기 종료 전까지 종료 처리 ❌.** 결선 매치가 모두 기록되면 `finalize-match-completion.ts` 가 자동 종료. 그 후 우승팀만 수동 확인.

→ **이 프롬프트는 2A 3건만 처리.** 2B 는 결선 종료 후 별도.

---

## 1. 핵심 사실 (작업 전 인지)

- `champion_team_id`(우승팀)·`mvp_player_id`(MVP)를 **자동으로 set 하는 코드가 repo 에 없음**(전부 read-only). → 종료 처리만으로 우승팀이 안 채워짐. **결승 결과를 사람이 확인해 직접 넣어야** awards/프로필/시리즈에 우승 표시됨.
- status='completed' 플립은 **기존 안전 유틸 `checkAndAutoCompleteTournament(prisma, id)`**(`lib/tournaments/auto-complete.ts`) 재사용 우선. 멱등 + "모든 매치 종료" 검증 내장. raw UPDATE 는 그게 안 먹을 때(매치 미완료/포맷 가드)만, 원인 확인 후.
- 5차는 full_league_knockout(결승 #301 존재). 우승팀 = **결승 매치 승자**(standings 1위 아님 — KO 포맷). 4차·6차 포맷도 진단에서 확인.

---

## 2. STEP 1 — 진단 (SELECT 전용, 승인 불요)

`scripts/_temp/phase2-diagnose.ts` 작성·실행. 3개 대회 각각 출력:

```
- id / name / status / format / start_date / end_date
- 매치 상태 분포: status별 count (completed/scheduled/...) + 전체 매치 수
- 결승(KO) 매치: roundName "결승" 또는 bracket 최종 매치의 home/away/winner_team_id + 팀명
- 현재 champion_team_id / mvp_player_id (null 여부)
- standings 1위 팀(참고용): update-standings 결과 또는 public-standings 로직 재사용
- checkAndAutoCompleteTournament 가 종료시킬지 예측: total vs finished(MATCH_FINAL_STATUSES) + knockout 가드 해당 여부
```

출력만. UPDATE/DELETE 0. 실행 후 결과를 사용자(수빈)에게 보고.

---

## 3. STEP 2 — 사용자 확인 (수빈 결정)

진단 결과를 보고 **대회별로** 확정:
1. 종료 처리해도 되는가 (모든 경기 끝났는가)
2. **우승팀 = 어느 팀인가** (결승 승자 후보 제시 → 수빈 확정). MVP 는 있으면 같이, 없으면 null 유지.

미완료 매치가 있으면 종료 보류(데이터부터 정리). 승인 전 UPDATE 금지.

---

## 4. STEP 3 — 적용 (가드 걸고 UPDATE)

대회 **한 건씩** 처리:

1. **사전 SELECT 1건** — 현재 status/champion 재확인 (사용자 승인 받은 값과 일치 확인).
2. **status 플립**:
   - 우선 `checkAndAutoCompleteTournament(prisma, id)` 호출 → `updated:true` 면 완료.
   - `no-matches`/`incomplete`/`knockout-not-generated` 등으로 안 되면 **원인 보고 후** 수동 `prisma.tournament.update({ data:{ status:"completed" } })` 는 사용자 재승인 후에만.
3. **우승팀**: `prisma.tournament.update({ where:{id}, data:{ champion_team_id: <확정팀>, ...(mvp && { mvp_player_id }) } })`.
4. **사후 검증**: 같은 대회 재SELECT → status='completed' + champion_team_id set 확인. awards 쿼리(`champion_team_id: { not:null }`)에 노출되는지 count 1회.

3건 모두 끝나면 전체 재집계: `published 53→50, completed 5→8` 로 이동했는지 status 분포 SELECT.

---

## 5. 절대 금지 / 가드 재확인

- DROP/TRUNCATE/대량 DELETE·UPDATE ❌. 본 작업은 **3개 행 status+champion 만**.
- `prisma migrate reset` / `db push --accept-data-loss` ❌ (schema 변경 0).
- 작업 후 `scripts/_temp/` 정리.
- 2B(열혈) 손대지 말 것 — 결선 종료 후 별도.

---

## 6. 브랜치·기록

- 스크립트성 작업이라 코드 커밋은 진단 스크립트 정리로 최소화. 핵심은 DB 상태 변경.
- `.claude/scratchpad.md` 작업 로그 1줄 + `knowledge/errors.md`(자동종료 미작동 원인 발견 시).
- 우승팀 자동 set 부재는 **후속 개선 후보**(decisions.md): 종료 시 결승 승자 → champion_team_id 자동 박제 유틸 추가 검토.

---

## 7. 한눈에

| 대회 | 종료 처리 | 우승팀 | 시점 |
|---|---|---|---|
| 4차 뉴비리그 | checkAndAutoComplete | 결승 승자 확인 | 지금 |
| 5차 뉴비리그 | checkAndAutoComplete | 결승(#301) 승자 | 지금 |
| 6차 스타터스 | checkAndAutoComplete | 결승 승자 확인 | 지금 |
| 열혈 SEASON2 | 결선 종료 후 자동 | 결선 후 확인 | 보류 |
