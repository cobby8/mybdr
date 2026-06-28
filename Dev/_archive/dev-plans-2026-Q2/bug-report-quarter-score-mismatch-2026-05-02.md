# 📊 쿼터 점수 vs 매치 헤더 점수 불일치 — 원인 분석 + 서버 측 해결 방법 보고서

**작성일**: 2026-05-02
**관련 보고서**: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md` (올아웃 PBP 누락 — Flutter app fix 필요)
**목적**: Flutter app 수정 없이 서버 측만으로 처리 가능한 해결 방안 검토

---

## 1. 현상 (사용자 화면 기준)

```
헤더 점수: 피벗 24 vs SYBC 17  ← matchPlayerStat 합산 = 정확
쿼터별 합: 피벗 24 / SYBC 15   ← PBP 합산 = 부정확 (2점 차이)
```

→ **개인기록(matchPlayerStat)은 정확한데 PBP에 점수 이벤트 누락**.

---

## 2. 운영 DB 전수 조사 결과 (2026-05-02 진단)

| 항목 | 값 |
|------|-----|
| 조사 대상 매치 (status=live/completed + PBP 보유) | 18건 |
| **차이 발생 매치** | **10/18 (56%)** |
| `matchPlayerStat` 합 = 매치 헤더 일치율 | **18/18 (100%)** ✅ |
| 총 누락 점수 (헤더 − PBP 합) | 48점 |
| 매치당 평균 누락 | **4.8점** |
| 평균 PBP 건수 | 163.6건 |
| 평균 sub PBP 건수 | 20.2건 |

### 2-1. 차이 발생 매치 상세 (종료된 매치 기준)

| 매치 | 토너먼트 | 홈 헤더 vs PBP합 (gap) | 원정 헤더 vs PBP합 (gap) |
|------|---------|----------------------|------------------------|
| 102 | - | 43 vs 39 (gap **+4**) | 41 vs 37 (gap **+4**) |
| 103 | - | 60 vs 56 (gap **+4**) | 40 vs 38 (gap **+2**) |
| 104 | - | 39 vs 35 (gap **+4**) | 47 vs 45 (gap **+2**) |
| 99 | - | 37 vs 35 (gap **+2**) | 34 vs 34 (gap 0) |
| 100 | - | 46 vs 46 (gap 0) | 39 vs 37 (gap **+2**) |
| 120 | - | 74 vs 72 (gap **+2**) | 61 vs 61 (gap 0) |
| 98 | - | 66 vs 71 (gap **−5**) | 52 vs 54 (gap **−2**) |
| 92 (라이브) | - | 31 vs 31 (gap 0) | 31 vs 33 (gap **−2**) |
| 95 (라이브) | - | 0 vs 4 (gap **−4**) | 0 vs 8 (gap **−8**) |
| 96 (라이브) | - | 0 vs 0 | 0 vs 1 (gap **−1**) |

**관찰**:
- **양수 gap (header > PBP)**: 7 케이스 — **PBP 점수 누락** (사용자 우려 케이스)
- **음수 gap (header < PBP)**: 3 케이스 — 매치 헤더 미갱신 또는 PBP 중복
- 누락 점수 단위: **2점 / 4점 빈번** → 2점 슛 1~2건 또는 자유투 누락 패턴 추정

---

## 3. 개인기록 입력 ↔ PBP 누락 발생 시나리오 (Flutter app 추정)

서버 데이터에서 직접 추적 가능한 패턴 + Flutter app 의 일반적 UX 흐름 추정.

### 3-1. 정상 흐름 (PBP + matchPlayerStat 동시 생성)

```
운영자 액션: 선수 선택 → 슛 종류 (2pt/3pt) → made/missed
  ↓
1. PBP 생성 (action_type='made_shot', subtype='2pt', is_made=true, points_scored=2)
2. matchPlayerStat 갱신 (points +2, fieldGoalsMade +1, fieldGoalsAttempted +1)
3. sync 시 둘 다 서버 전송
```

### 3-2. 누락 발생 가능성 (시나리오별)

| # | 시나리오 | matchPlayerStat | PBP | 가능성 |
|---|---------|----------------|-----|--------|
| **A** | **빠른 점수 입력 단축 버튼** (선수 카드 +2/+3) | ✅ +N | ❌ 미생성 | ⭐⭐⭐ 높음 |
| **B** | **박스스코어 직접 편집** (운영자가 수동 점수 보정) | ✅ 수정 | ❌ 미수정 | ⭐⭐⭐ 높음 |
| **C** | **PBP 입력 → undo** (실수 후 취소) | matchPlayerStat 차감 누락 | PBP 삭제 | ⭐⭐ 중간 |
| **D** | **자유투 시퀀스** (3-shot 자유투) | ✅ 3건 | ⚠️ 일부만 (1~2건) | ⭐⭐ 중간 |
| **E** | **2점/3점 정정** (2점 입력 후 3점으로 변경) | ✅ +1 | ❌ PBP 미수정 | ⭐⭐ 중간 |
| **F** | **올아웃 후 점수 정정** | ✅ | ❌ PBP 미생성 | ⭐ 낮음 |
| **G** | **네트워크 끊김** (PBP 생성 도중 sync 실패) | 별도 sync 가능 | sync 큐에서 손실 | ⭐⭐ 중간 |
| **H** | **앱 crash** (PBP 생성 도중 종료) | 로컬 저장 시점 의존 | 로컬 미저장 | ⭐ 낮음 |

### 3-3. 서버 데이터에서 직접 검증된 패턴

**매치 132 임강휘 (jersey 43, SYBC) — 2점 누락 케이스**:
- matchPlayerStat: FG 1/4 (1 made + 3 missed) → PTS 2점
- PBP: missed_shot 2pt 1건 + missed_shot 3pt 1건 = 2건만
- **made_shot PBP 자체가 0건** → 시나리오 A 또는 B 가능성

→ "다른 이벤트(rebound, sub)는 정상 player_id 로 기록되었지만 made_shot 만 누락" = **단축 버튼/직접 편집 케이스 강력 추정**.

---

## 4. 서버 측 해결 방법 — 옵션 분석

### 옵션 1 — 응답 가공 (DB 안 건드림) ⭐⭐⭐

**방식**: `route.ts L482~` quarter_scores 계산 시 **PBP 합 + (헤더 − PBP합) 차이를 마지막 진행 쿼터에 분배**.

**알고리즘**:
```ts
1. quarterScores = PBP 기반 재계산 (현재 그대로)
2. teamPbpSum = quarterScores 의 home/away 별 합산
3. headerGap = match.{home,away}Score − teamPbpSum
4. if headerGap > 0:
     mostRecentQuarter = 가장 큰 quarter (PBP 가 있는)
     quarterScores[mostRecentQuarter][team] += headerGap
5. if headerGap < 0:
     (PBP 가 헤더보다 큰 경우 — 매치 헤더 갱신 누락 의심) — 그대로 두거나 무시
```

**효과**:
| 항목 | Before | After |
|------|--------|-------|
| 매치 헤더 = 쿼터 합 | ❌ 불일치 | ✅ 항상 일치 |
| 라이브 매치 적용 | - | ✅ 즉시 |

**부작용**:
- 마지막 쿼터 점수가 살짝 부풀려짐 (실제 분배는 추정)
- 타임라인은 변경 없음 (PBP 그대로)
- 매치 헤더 < PBP 인 케이스 처리 (현재 옵션 1 은 무시)

**구현 난이도**: 30~50줄, route.ts 단일 파일

---

### 옵션 2 — 자동 PBP INSERT (DB 보정) ⭐⭐

**방식**: 정기 cron 또는 sync 응답 트리거로 누락분만큼 가짜 PBP INSERT.

**알고리즘**:
```ts
for each 매치:
  for each 선수:
    statPoints = matchPlayerStat.points
    pbpPoints = sum(PBP.points_scored where pid=선수)
    gap = statPoints - pbpPoints

    if gap > 0:
      # 슛 종류 추정 (박스스코어 기반)
      missingFG = stat.fgm - sum(PBP made_shot count)
      missing3P = stat.tpm - sum(PBP made_shot 3pt count)
      missingFT = stat.ftm - sum(PBP free_throw made count)

      # 누락 슛 PBP 생성 (가짜 시점)
      INSERT play_by_plays (
        local_id: 'manual-fix-{matchId}-{pid}-auto-{ts}',
        action_type: 'made_shot' | 'free_throw',
        action_subtype: '2pt' | '3pt' | null,
        points_scored: 2 | 3 | 1,
        is_made: true,
        quarter: lastQuarter,
        game_clock_seconds: 0 (쿼터 끝),
        description: '[자동 보정] PBP 누락분 보충'
      )
```

**효과**:
- 매치 헤더 = PBP 합 ✅
- 타임라인에 누락 이벤트 표시됨 ✅
- DB 영구 보정 ✅

**부작용**:
- 가짜 시점 (정확한 clock 모름)
- assist_player_id / rebound_player_id 등 부속 정보 추정 불가
- 박스스코어상 missed_shot 도 누락된 경우 검증 어려움
- Flutter sync 시 manual-fix 가드로 보호 필요 (이미 commit 1bec5c3 적용)

**구현 난이도**: 100줄+, cron 추가 또는 sync 응답에 통합

---

### 옵션 3 — 무결성 알림만 추가 ⭐

**방식**: sync 응답에 warning + 관리자 화면에 "데이터 무결성" 표시.

**효과**: 운영자 인지 → 추후 수동 보정 가능 (manual-fix 패턴)

**부작용**: 자동 보정 X — 일반 사용자 화면은 그대로 불일치

**구현 난이도**: 20~30줄

---

### 옵션 4 — 쿼터 점수 = matchPlayerStat 의 quarterStatsJson 점수 사용 ❌

**검토 결과**: ❌ **불가능**

**이유**: `matchPlayerStat.quarterStatsJson` 의 구조 확인 결과:
```json
{"Q1":{"min":420,"pm":5},"Q2":{"min":295,"pm":4}}
```

- **`min` (출전초) 와 `pm` (+/-) 만 보유**.
- **점수/리바운드/어시스트 같은 쿼터별 스탯 필드 없음**.
- → 쿼터별 점수의 유일한 소스는 PBP.

---

### 옵션 5 — 서버 측 임시 차감 (음수 gap 처리)

**방식**: 매치 헤더 < PBP 인 케이스 (3건 발견) 처리.

**원인 추정**:
- Flutter app이 PBP 만 갱신 + 매치 헤더 미동기화
- 또는 PBP 중복 INSERT (sync race)

**해결**:
- 매치 헤더를 PBP 합산으로 자동 갱신 (Flutter app 의 source of truth 가 무엇인지에 따라 다름)
- 또는 표시 시 max(헤더, PBP합) 로 정상화

**리스크**: Flutter app 의 매치 헤더 의도와 충돌 가능 → 운영자 확인 필요

---

## 5. 권장 조합

| 조합 | 효과 | 작업량 | 추천 |
|------|------|--------|------|
| **옵션 1 단독** | 사용자 화면 즉시 일관성 (가장 큰 사용자 가치) | 30~50줄 | ⭐⭐⭐ **최우선** |
| 옵션 1 + 3 | 화면 보정 + 운영자 알림 | +20줄 | ⭐⭐⭐ 균형 |
| 옵션 1 + 2 | 화면 보정 + 타임라인 정확 | 100줄+ | ⭐⭐ 종합 |
| 옵션 2 단독 | 타임라인 영구 보정 (DB) | 100줄+ | ⭐⭐ |
| 옵션 5 | 음수 gap 처리 | 별도 검토 | ⭐ |

---

## 6. 옵션 1 상세 설계 (권장)

### 6-1. 적용 위치

`src/app/api/live/[id]/route.ts` 의 quarter_scores 재계산 블록 (현재 L482~).

### 6-2. 의사 코드

```ts
// 1) 기존 PBP 기반 quarter_scores 재계산
const qs: QS = { home: {q1,q2,q3,q4,ot:[]}, away: {...} };
for (const p of allPbps) {
  if ((p.points_scored ?? 0) > 0) {
    const q = p.quarter ?? 1;
    const key = q <= 4 ? `q${q}` : 'ot';
    if (Number(p.tournament_team_id) === Number(homeTeamId)) {
      qs.home[key] += p.points_scored;
    } else if (...) qs.away[key] += p.points_scored;
  }
}

// 2) 매치 헤더 vs 쿼터 합 차이 보정 (2026-05-02 추가)
//    matchPlayerStat 합산이 매치 헤더와 일치하므로 headerScore = source of truth.
const homePbpSum = qs.home.q1 + qs.home.q2 + qs.home.q3 + qs.home.q4 + qs.home.ot.reduce((a,b)=>a+b,0);
const awayPbpSum = qs.away.q1 + qs.away.q2 + qs.away.q3 + qs.away.q4 + qs.away.ot.reduce((a,b)=>a+b,0);
const homeGap = (match.homeScore ?? 0) - homePbpSum;
const awayGap = (match.awayScore ?? 0) - awayPbpSum;

// 3) 양수 gap (header > PBP) 만 보정 — 누락된 점수만큼 마지막 쿼터에 분배.
//    음수 gap (header < PBP) 는 그대로 둠 (Flutter 매치 헤더 미갱신 케이스 — 옵션 5 별도).
if (homeGap > 0 || awayGap > 0) {
  // 마지막 진행 쿼터 = 가장 큰 quarter 값 (PBP 보유)
  const quartersWithPbp = new Set(allPbps.map(p => p.quarter ?? 0).filter(q => q >= 1));
  const lastQ = Math.max(...quartersWithPbp);
  const lastKey = lastQ <= 4 ? `q${lastQ}` : 'ot';

  if (homeGap > 0) qs.home[lastKey] += homeGap;
  if (awayGap > 0) qs.away[lastKey] += awayGap;
}

// 4) (선택) 응답에 무결성 메타 정보 포함 (옵션 3)
return apiSuccess({
  ...,
  quarter_scores: qs,
  data_integrity: {
    home_pbp_gap: homeGap,
    away_pbp_gap: awayGap,
    has_correction: homeGap > 0 || awayGap > 0,
  },
});
```

### 6-3. 회귀 검증

| 매치 | 변경 전 | 변경 후 |
|------|---------|---------|
| 매치 132 (gap 0) | 변경 X | 변경 X (안전) |
| 매치 102 (gap +4 / +4) | Q4 SYBC PBP=37 | Q4 SYBC = 41 (헤더 일치) |
| 매치 95 (gap -4 / -8) | 변경 X | 변경 X (음수 gap 미보정) |

---

## 7. 부작용 / 리스크 평가

| 항목 | 옵션 1 (응답 가공) | 옵션 2 (DB INSERT) |
|------|-------------------|---------------------|
| DB 무결성 | ✅ 영향 0 | ⚠️ 가짜 PBP 생성 |
| Flutter sync 영향 | 0 | manual-fix 가드 필요 (이미 적용) |
| 타임라인 정확도 | 변경 X (PBP 그대로) | 가짜 시점 표시됨 |
| 박스스코어 vs 쿼터합 | 일치 ✅ | 일치 ✅ |
| 라이브 매치 즉시 효과 | ✅ | cron 주기 의존 |
| 코드 복잡도 | 낮음 | 중간~높음 |
| 롤백 가능성 | 코드 revert만 | DB 데이터 정리 필요 |

---

## 8. Flutter app 측 fix (이전 보고서 참조)

서버 옵션 1/2/3 는 **모두 증상 완화**. 근본 fix 는 Flutter app:

| 시나리오 | Flutter app fix 방향 |
|---------|---------------------|
| 빠른 점수 입력 단축 (시나리오 A) | 단축 버튼 → made_shot PBP 자동 생성 |
| 박스스코어 직접 편집 (B) | 직접 편집 = matchPlayerStat 만 갱신은 운영 흐름상 정상이지만 PBP에 동기화하거나 편집 차단 |
| Undo 후 점수 복원 (C) | undo 시 matchPlayerStat 도 차감 |
| 자유투 시퀀스 (D) | 3-shot 모두 PBP 생성 보장 |
| 2점/3점 정정 (E) | PBP 도 update 또는 새 PBP 생성 |

자세한 사항: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md`

---

## 9. 결론

### 즉시 실행 가능 (서버만)

**옵션 1 — 응답 가공으로 쿼터 점수 = 매치 헤더 일치 보장**.
- 코드 변경 30~50줄
- DB 안 건드림 / Flutter sync 영향 0
- 라이브 매치 즉시 효과
- 마지막 쿼터에 잔여 점수 분배 (시각적 부정확 미미)

### 추가 권장

**옵션 1 + 3** — 응답 가공 + sync 응답에 무결성 warning 추가 → 운영자 인지.

### 서버로 처리 불가

| 항목 | 가능성 | 설명 |
|------|--------|------|
| **양팀 minutesPlayed 합 차이 보정** | ❌ | quarterStatsJson 자체 부정확 → 정보 부족 |
| **타임라인 정확 시점** | ❌ | 누락 PBP 의 시점/assist 등 추정 불가 |
| **PBP 무결성 근본 해결** | ❌ | Flutter app 입력 시점 fix 필수 |

**Flutter app 수정이 근본 fix**. 서버 옵션은 증상 완화 + 사용자 화면 일관성 보장.

---

## 10. 결정 대기

| 옵션 | 진행 여부 |
|------|----------|
| **옵션 1 단독 (응답 가공)** | 권장 ⭐⭐⭐ — 사용자 결정 |
| 옵션 1 + 3 (가공 + 알림) | 권장 ⭐⭐⭐ |
| 옵션 2 (DB INSERT) | 보조 — 결정 시 진행 |
| 옵션 5 (음수 gap 처리) | 별도 검토 |

---

## 11. 작성 정보

- **작성자**: 수빈 (mybdr 웹 담당)
- **검증 매치**: 매치 132, 101, 102, 103, 104, 98, 99, 100, 120 외 운영 DB 18 매치
- **관련 commit**:
  - `1bec5c3` — sync 가드 manual-fix 보존
  - `f0278b4` — quarter length 동적 추정
  - `8ccd4dd` — MIN B-2 라이브 매치 fix
- **관련 보고서**: `Dev/bug-report-flutter-allout-pbp-2026-05-02.md`
