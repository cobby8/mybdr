# 🐛 Flutter app 올아웃 기능 PBP 누락 버그 리포트

**작성일**: 2026-05-02
**대상**: 원영 (Flutter 앱 / 기록 시스템 담당)
**작성자**: 수빈 (mybdr 웹 담당)
**우선순위**: ⭐⭐⭐ 높음 (라이브 매치 데이터 무결성 영향)

---

## 1. 증상 요약

라이브 매치 132 (제21회 몰텐배 동호회최강전, 피벗 vs SYBC, 7분 4쿼터) 진행 중 다음 데이터 불일치 발견:

| 불일치 | 값 |
|--------|-----|
| 매치 헤더 점수 vs 쿼터 PBP 점수 합 | 2~5점 차이 (선수별 made_shot PBP 누락) |
| 양팀 출전시간(minutesPlayed) 합계 | **498초 차이 (8:18)** |
| quarterStatsJson 의 코트 출전 선수 수 | Q1 6~7명, Q2 7명, **Q3 8명** (정원 5명 위반) |

---

## 2. 근본 원인 — 올아웃 기능의 PBP 일괄 생성 일부 누락

### 2-1. 동작 시나리오

운영자가 Flutter app에서 다음 상황에서 **올아웃** 버튼 사용:
- 작전타임 (Q1 sec=97 같은 시점)
- 쿼터 종료 후 다음 쿼터 시작 시 (sec=420 시점)

올아웃 = 코트 5명 일괄 OUT + 새 5명 IN.

### 2-2. 정상 기대 동작

각 올아웃 마다 **5건의 substitution PBP** 가 일괄 생성되어야 함 (양팀 별도면 총 10건).

```
PBP[1]: action_type='substitution', subtype='in:X1,out:Y1'
PBP[2]: action_type='substitution', subtype='in:X2,out:Y2'
PBP[3]: action_type='substitution', subtype='in:X3,out:Y3'
PBP[4]: action_type='substitution', subtype='in:X4,out:Y4'
PBP[5]: action_type='substitution', subtype='in:X5,out:Y5'
```

### 2-3. 실제 동작 — 부분 누락

**매치 132 PBP substitution 분포** (총 31건):

| 시점 | sub PBP 건수 | 정상값 | 누락 |
|------|-------------|--------|------|
| Q1 sec=97 (작전타임 추정) | **3건** | 5건 (또는 양팀 10건) | 2~7건 |
| Q2 sec=420 (쿼터 시작 올아웃) | **2건** | 5건 (또는 10건) | 3~8건 |
| Q3 sec=420 (쿼터 시작 올아웃) | **3건** | 5건 (또는 10건) | 2~7건 |
| Q4 sec=420 (쿼터 시작 올아웃) | **2건** | 5건 (또는 10건) | 3~8건 |

→ **약 절반 이상의 sub PBP 누락**.

---

## 3. 검증 데이터

### 3-1. 코트 5명 정원 위반 (quarterStatsJson 분석)

각 선수의 quarterStatsJson 에서 `Q*.min > 0` 인 선수 수 = 그 쿼터 코트 출전 선수.

| 팀 | Q1 출전 | Q2 출전 | Q3 출전 |
|----|---------|---------|---------|
| 홈 (피벗) | 6명 | 7명 | **8명** ⚠️ |
| 원정 (SYBC) | 7명 | 7명 | **8명** ⚠️ |

농구 룰상 한 쿼터 코트 = 5명. 6~8명 출전은 **OUT 처리 누락**의 직접 흔적.

### 3-2. Q→Q 라인업 변화 비대칭

| 변화 | 홈 (피벗) | 원정 (SYBC) |
|------|----------|-------------|
| Q1→Q2 IN | 1명 | 1명 |
| Q1→Q2 OUT | **0명** ⚠️ | 1명 |
| Q2→Q3 IN | 1명 | 1명 |
| Q2→Q3 OUT | **0명** ⚠️ | **0명** ⚠️ |

→ IN만 있고 OUT 없음 = sub PBP 누락 흔적.

### 3-3. 매치 132 vs 매치 101 비교

| 매치 | substitution PBP | 진행 쿼터 | sub 평균/쿼터 |
|------|------------------|-----------|--------------|
| 132 (몰텐배 2026) | 31건 | Q4 sec=212 까지 | 약 3.5건 |
| 101 (BDR Challenge) | 46건 | 4쿼터 종료 | 약 11.5건 |

→ 매치 132만의 문제 X. **Flutter app 의 일관된 누락 패턴** 가능성.

---

## 4. 영향 범위

### 4-1. 직접 영향

| 표시 영역 | 영향 |
|----------|------|
| `/live/[id]` 매치 헤더 점수 | 정상 (matchPlayerStat 합산 = Flutter 내부 트래킹) |
| `/live/[id]` 쿼터별 점수 (PBP 기반 재계산) | **부정확** — 점수 PBP 누락 시 합계 X |
| 박스스코어 (matchPlayerStat) | 정상 (Flutter 내부 트래킹) |
| 선수 출전시간 (minutesPlayed) | **부정확** — Flutter 내부 트래킹도 부분 누락 |
| 타임라인 (PBP 기반) | **부정확** — 누락된 이벤트 표시 안 됨 |

### 4-2. 양팀 minutesPlayed 합계 차이 498초의 정량 분석

매치 132 진행 시점 (Q3 진행 중, lastClock=36):

| 항목 | 정상 합계 | 실제 합계 | 부족분 |
|------|----------|-----------|--------|
| 코트 5명 × 진행 시간 (Q1+Q2+Q3 일부) | 6,120초 | - | - |
| 홈팀 합계 | 6,120 | **4,621** | -1,499 |
| 원정팀 합계 | 6,120 | **5,119** | -1,001 |
| 양팀 차이 | 0 | **498** | - |

→ 양팀 모두 정상 미달. 차이는 **올아웃 PBP 누락 빈도가 양팀에 비대칭** 반영된 결과.

---

## 5. 권장 fix 방향 (Flutter app)

### 5-1. 우선순위 1 — 올아웃 버튼 PBP 일괄 생성 보장 ⭐

```
[운영자 클릭: 올아웃]
  ↓
1. 현재 코트 5명 (out_player_ids[]) 추출
2. 새 5명 (in_player_ids[]) 추출
3. for i in 0..4:
     PBP 생성 (substitution, subtype: f'in:{in[i]},out:{out[i]}', clock: 현재시점)
4. 5건 모두 sync 큐에 push
```

**검증 포인트**:
- 5건 생성 중 1건이라도 실패 시 전체 rollback (또는 재시도)
- 네트워크 끊김 시 로컬 큐에 보관 후 재 sync 시 모두 push

### 5-2. 우선순위 2 — 작전타임 sub 다중 생성 보장

작전타임 후 일괄 sub 도 동일 패턴 적용. 1건씩 들어가는 게 아니라 한 번에 N건.

### 5-3. 우선순위 3 — quarterStatsJson 무결성 검사 (앱 내부)

각 선수 quarterStatsJson 갱신 시:
- 코트 5명 정원 검증 (Q* min>0 인 선수 = 정확히 5명)
- 위반 시 디버그 로그 + 운영자 경고 (예: "코트에 6명 등록됨, sub 확인 필요")

---

## 6. 서버 측 보강 제안 (참고용)

서버는 Flutter 데이터 그대로 표시하므로 결함 0. 하지만 무결성 검사를 sync 응답에 포함 가능:

| 옵션 | 동작 |
|------|------|
| sync 응답 warning | 양팀 minutesPlayed 합 차이 > 60초 → "출전시간 합 불일치 X초" |
| sync 응답 warning | matchPlayerStat.points 합 vs PBP 점수 합 차이 → "점수 PBP 누락 N점" |
| 매치 종료 자동 검사 | 종료 시점 합계 검증 + 운영자 알림 |

→ Flutter app fix 가 우선. 서버 측은 fallback 알림 정도.

---

## 7. 재현 방법

1. Flutter bdr_stat 앱에서 라이브 매치 시작
2. 매치 진행 중 작전타임 → 5명 일괄 교체 (올아웃)
3. 또는 쿼터 종료 후 다음 쿼터 시작 시 5명 일괄 교체
4. 서버 sync 후 mybdr.kr/live/[matchId] 확인
5. 다음 비교:
   - 매치 헤더 점수 vs 쿼터별 점수 합
   - 박스스코어 minutesPlayed 양팀 합
   - quarterStatsJson 의 Q* 출전 선수 수 (정원 5명 검증)

---

## 8. 빠른 검증 — 운영 DB 직접 진단 스크립트 (수빈 작성)

원영이 매치 132 데이터 직접 보고 싶을 시:

```sql
-- 쿼터 시작 시점 (sec >= 415) sub PBP 분포
SELECT quarter, game_clock_seconds, action_subtype, COUNT(*)
FROM play_by_plays
WHERE tournament_match_id = 132
  AND action_type = 'substitution'
  AND game_clock_seconds >= 415
GROUP BY quarter, game_clock_seconds, action_subtype
ORDER BY quarter, game_clock_seconds DESC;

-- 코트 5명 정원 검증 (각 쿼터 출전 선수 수)
SELECT
  CAST(jsonb_object_keys(quarter_stats_json::jsonb) AS TEXT) AS quarter,
  COUNT(*) FILTER (WHERE (quarter_stats_json::jsonb -> jsonb_object_keys(quarter_stats_json::jsonb) ->> 'min')::int > 0) AS players_with_min
FROM match_player_stat
WHERE tournament_match_id = 132
GROUP BY quarter;
```

---

## 9. 관련 commit / 파일

- 서버 fallback 보강: `src/app/api/live/[id]/route.ts` (commit f0278b4 — quarter length 동적 추정)
- sync 가드: `src/app/api/v1/tournaments/[id]/matches/sync/route.ts` (commit 1bec5c3 — manual-fix 보존)
- 운영자 수동 INSERT 패턴: `local_id` startsWith `manual-fix-` + `description` startsWith `[수동 보정]`

---

## 10. 결론

**Flutter app 의 올아웃 기능에서 PBP 일괄 생성이 부분 누락되는 것이 매치 132 의 양팀 출전시간 차이(498초) + 매치 헤더 vs 쿼터 점수 차이(2~5점)의 공통 근본 원인**입니다.

서버 측 결함 0. **Flutter app 측 fix 필수**.

빠른 fix 우선순위:
1. ⭐ 올아웃 버튼 → 5건 PBP 일괄 생성 보장 (실패 시 rollback/재시도)
2. 작전타임 다중 sub 동일 적용
3. quarterStatsJson 코트 정원 5명 검증 로그 추가

문의는 수빈에게 (snukobe@gmail.com).
