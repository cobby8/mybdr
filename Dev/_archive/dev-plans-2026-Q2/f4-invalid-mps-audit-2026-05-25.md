# Sprint 5 INVALID 25건 MPS 기준 확장 audit

- 실행 시각: 2026-05-25T13:57:01.184Z

## 📊 INVALID 25건 분석 결과

| matchId | 토너먼트 | code | mode | 헤더 | MPS | PBP | 정정 가능성 |
|---------|---------|------|------|------|-----|-----|------------|
| 109 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-008 | flutter | 50/78 | 50/78 | 52/81 | ⚠️ MPS_HEADER_ONLY |
| 226 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 34/55 | 32/45 | ❌ NONE |
| 228 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 57/14 | 53/12 | ❌ NONE |
| 84 | TEST | - | flutter | 0/0 | 0/3 | 0/3 | ❌ NONE |
| 230 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 33/49 | 29/49 | ❌ NONE |
| 93 | TEST | - | flutter | 0/0 | 0/0 | 0/0 | ✅ PBP_BASED |
| 88 | TEST | - | flutter | 0/0 | 2/6 | 2/6 | ❌ NONE |
| 86 | TEST | - | flutter | 0/0 | 0/5 | 0/5 | ❌ NONE |
| 83 | TEST | - | flutter | 0/0 | 0/3 | 0/3 | ❌ NONE |
| 151 | 제21회 몰텐배 동호회최강전 | 26-GG-MD21-020 | paper | 20/0 | 0/0 | 0/0 | ❌ NONE |
| 227 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 35/36 | 33/34 | ❌ NONE |
| 95 | TEST | - | flutter | 0/0 | 0/0 | 4/8 | ⚠️ MPS_HEADER_ONLY |
| 91 | TEST | - | flutter | 0/0 | 0/2 | 0/2 | ❌ NONE |
| 92 | TEST | - | flutter | 0/0 | 31/31 | 31/33 | ❌ NONE |
| 106 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-005 | flutter | 32/41 | 32/41 | 30/37 | ⚠️ MPS_HEADER_ONLY |
| 229 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 48/33 | 44/33 | ❌ NONE |
| 231 | 2026년 4차 BDR 뉴비리그 -  | - | flutter | 0/0 | 22/39 | 25/37 | ❌ NONE |
| 113 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-012 | flutter | 45/47 | 45/44 | 41/43 | ❌ NONE |
| 105 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-004 | flutter | 68/40 | 68/40 | 62/38 | ⚠️ MPS_HEADER_ONLY |
| 115 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-014 | flutter | 58/60 | 58/60 | 54/54 | ⚠️ MPS_HEADER_ONLY |
| 116 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-015 | flutter | 43/53 | 43/53 | 41/53 | ⚠️ MPS_HEADER_ONLY |
| 107 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-006 | flutter | 52/38 | 52/38 | 48/37 | ⚠️ MPS_HEADER_ONLY |
| 108 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-007 | flutter | 34/25 | 34/25 | 34/23 | ⚠️ MPS_HEADER_ONLY |
| 112 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-011 | flutter | 53/44 | 53/44 | 53/36 | ⚠️ MPS_HEADER_ONLY |
| 114 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-013 | flutter | 48/46 | 48/46 | 40/46 | ⚠️ MPS_HEADER_ONLY |

## 🎯 결론

- ✅ PBP_BASED (PBP 합 = 헤더 → NESTED 변환 안전 정정): **1건**
- ⚠️ MPS_HEADER_ONLY (MPS 합만 일치 / PBP 분포 부정확 → 보류 권장): 10건
- ❌ NONE (어느 source 도 헤더와 안 맞음): 14건

## 🎯 EXECUTE 권장 매치 변경안 (PBP_BASED)

#### matchId=93 (TEST)
- 헤더: 0/0
- 박제 후 QS: `{"home":{"q1":0,"q2":0,"q3":0,"q4":0,"ot":[]},"away":{"q1":0,"q2":0,"q3":0,"q4":0,"ot":[]}}`
