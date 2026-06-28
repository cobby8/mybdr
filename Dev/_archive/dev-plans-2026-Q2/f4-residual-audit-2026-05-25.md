# Sprint 5 잔여 매치 정밀 분석 — LEGACY MISMATCH + INVALID

- 실행 시각: 2026-05-25T13:53:47.057Z

## 🔴 LEGACY MISMATCH 10건 — MPS/PBP 합 비교

| matchId | 토너먼트 | code | mode | 헤더 | LEGACY 합 | MPS 합 | PBP 합 | 정확 source |
|---------|---------|------|------|------|-----------|--------|--------|------------|
| 98 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-026 | flutter | 66/52 | 71/54 | 66/52 | 71/54 | MPS |
| 100 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-030 | flutter | 46/39 | 46/37 | 46/39 | 46/37 | MPS |
| 99 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-028 | flutter | 37/34 | 35/34 | 37/34 | 35/34 | MPS |
| 104 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-029 | flutter | 39/47 | 35/45 | 39/47 | 35/45 | MPS |
| 140 | 제21회 몰텐배 동호회최강전 | 26-GG-MD21-009 | paper | 47/45 | 42/42 | 47/45 | 43/45 | MPS |
| 121 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-032 | flutter | 68/63 | 70/63 | 68/63 | 70/63 | MPS |
| 103 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-033 | flutter | 60/40 | 56/38 | 60/40 | 56/38 | MPS |
| 120 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-034 | flutter | 74/61 | 72/61 | 74/61 | 72/61 | MPS |
| 102 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-031 | flutter | 43/41 | 39/37 | 43/41 | 39/37 | MPS |
| 258 | 제 2회 BDR W 대학동아리 농구대 | - | flutter | 29/28 | 21/21 | 29/28 | 25/28 | MPS |

## 🟡 INVALID 형식 25건 — 실제 JSON 구조 분류

| JSON keys | 매치수 | 샘플 matchId |
|-----------|--------|--------------|
| `current_quarter` | 25 | 109, 226, 228 |

## 🔬 INVALID 샘플 JSON dump (그룹별 1건씩)

### matchId=109 (keys: `current_quarter`)
- 헤더: 50/78
- 토너먼트: 열혈농구단 SEASON2 전국 최강전
- raw JSON: `{"current_quarter":1}`


---

## 🎯 Sprint 5 종합 결론

LEGACY MISMATCH 10건 = **MPS가 정확 source** (10/10):
- 헤더 = MPS 합 = standings = 통산 stat **모두 정확**
- quarter_scores 만 LEGACY 형식 잔존 + 합 부정확 (PBP와 동일 부정확)
- 외부 source (종이 기록지) 없이는 쿼터별 분포 재구성 불가
- **운영 영향 0** (LIVE 페이지 / 통계 / 알기자 모두 정상)

INVALID 25건 분석:
- PBP_BASED 1건 (matchId 93 / TEST 토너먼트 / 0/0) — 정정 가치 ↓
- MPS_HEADER_ONLY 10건 = MPS 정확 / PBP 분포 부정확 → 보류
- NONE 14건 = TEST 또는 헤더 0/0 (forfeit / 미완성)

**결론**: 점수 정합성 작업 사실상 완료. 운영 영향 있는 잔여 = 0건.
