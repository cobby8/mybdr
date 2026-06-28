# Sprint 3 F4 옵션 A 안전 정정 후보 audit

- 실행 시각: 2026-05-25T13:25:16.360Z
- DB: 운영 (SELECT only)
- 룰: PBP 합 = 헤더 일치 = 안전 정정 (신뢰도 100%)

- 총 completed 매치: 139건

## 📊 통계

- skip 통계: paper=87 / no team=0 / 4 source OK=5
- 후보 (불일치 잔존): 47건
- ✅ 옵션 A 안전 정정 가능: 1건
- ⚠️ PARTIAL (옵션 A 범위 외): 46건

## ✅ 옵션 A 안전 정정 후보 매치

| matchId | 토너먼트 | code | 헤더 | QS | MPS | PBP | 정정 대상 |
|---------|---------|------|------|-----|-----|-----|----------|
| 257 | 제 2회 BDR W 대학동아리 농구대 | - | 5/45 | 0/0 | 5/45 | 5/45 | QS |

## ⚠️ PARTIAL 매치 (옵션 A 범위 외 / 보류)

> 46건 — 외부 source (종이 기록지 / 운영자 기억) 결재 필요 (Sprint 4 또는 보류).

---

## 🚨 EXECUTE 결과 (사용자 명시 결재 후 / 2026-05-25)

### matchId 257 UPDATE 성공

| 항목 | 값 |
|------|-----|
| 헤더 | 5/45 |
| 박제 전 QS | `{"Q4":{"away":45,"home":5},"current_quarter":4}` (Flutter legacy 형식 — sumQS() 미인식 → 0/0 계산) |
| 박제 후 QS | `{"home":{"q1":0,"q2":2,"q3":1,"q4":2,"ot":[]},"away":{"q1":11,"q2":7,"q3":12,"q4":15,"ot":[]}}` (nested 표준) |
| 사후 검증 QS 합 | 5/45 ✅ OK (헤더 정확 일치) |

**추가 발견 (errors.md 보강 필요)**:
- 옛 매치 중 일부 = `{Q4: {home, away}, current_quarter: N}` 형식의 Flutter legacy QS 박제
- 새 형식 = `{home: {q1, q2, q3, q4, ot:[]}, away: {...}}` (LIVE API + score-sheet BFF 표준)
- audit script 의 sumQS() = legacy 형식 미인식 → 0/0 계산 → 안전 정정 후보로 분류
- 매치 257 = legacy → nested 변환 정정 완료 (PBP 합 5/45 정확)
- 다른 매치도 같은 패턴 잔존 가능 (별도 audit 필요)

### Sprint 3 종료 결재

- 옵션 A 안전 정정 = 1건 (matchId 257) 완료
- PARTIAL 46건 = 외부 source 필요 / Sprint 4 또는 보류
- Sprint 1 + 2 + 3 전체 영구 fix 완료 (F1 본체 + backfill + F2 + F3-α/β + F5 + F4 옵션 A)
