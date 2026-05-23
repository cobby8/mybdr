# 점수 정합성 backfill — 기존 quarterScores=0/0 매치 정정 (Sprint 2 PR-6 DRY-RUN)

- 실행 시각: 2026-05-23T15:14:14.892Z
- DB: 운영 (Supabase / .env DATABASE_URL)
- 모드: ✅ DRY-RUN (SELECT only)
- 필터: status='completed' + QS=0/0 + (headerHome+headerAway)>0 + Flutter 모드 (paper 제외)

## 📊 후보 매치 (정정 신뢰도별)

| matchId | 토너먼트 | matchCode | 헤더 | 현재 QS | PBP 합 (제안 QS) | PBP 건수 | 신뢰도 |
|---------|---------|-----------|------|---------|------------------|----------|--------|
| 101 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-027 | 58/53 | 0/0 | 58/53 | 54 | ✅ PBP_MATCHES_HEADER |
| 110 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-009 | 63/33 | 0/0 | 63/33 | 48 | ✅ PBP_MATCHES_HEADER |
| 111 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-010 | 29/45 | 0/0 | 29/45 | 38 | ✅ PBP_MATCHES_HEADER |
| 269 | 2026년 6차 BDR 스타터스리그 | - | 18/28 | 0/0 | 18/28 | 22 | ✅ PBP_MATCHES_HEADER |
| 98 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-026 | 66/52 | 0/0 | 71/54 | 70 | ⚠️ PBP_PARTIAL |
| 99 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-028 | 37/34 | 0/0 | 35/34 | 40 | ⚠️ PBP_PARTIAL |
| 100 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-030 | 46/39 | 0/0 | 46/37 | 39 | ⚠️ PBP_PARTIAL |
| 102 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-031 | 43/41 | 0/0 | 39/37 | 41 | ⚠️ PBP_PARTIAL |
| 103 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-033 | 60/40 | 0/0 | 56/38 | 47 | ⚠️ PBP_PARTIAL |
| 104 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-029 | 39/47 | 0/0 | 35/45 | 45 | ⚠️ PBP_PARTIAL |
| 105 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-004 | 68/40 | 0/0 | 62/38 | 51 | ⚠️ PBP_PARTIAL |
| 106 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-005 | 32/41 | 0/0 | 30/37 | 36 | ⚠️ PBP_PARTIAL |
| 107 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-006 | 52/38 | 0/0 | 48/37 | 44 | ⚠️ PBP_PARTIAL |
| 108 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-007 | 34/25 | 0/0 | 34/23 | 34 | ⚠️ PBP_PARTIAL |
| 109 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-008 | 50/78 | 0/0 | 52/81 | 61 | ⚠️ PBP_PARTIAL |
| 112 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-011 | 53/44 | 0/0 | 53/36 | 50 | ⚠️ PBP_PARTIAL |
| 113 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-012 | 45/47 | 0/0 | 41/43 | 47 | ⚠️ PBP_PARTIAL |
| 114 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-013 | 48/46 | 0/0 | 40/46 | 46 | ⚠️ PBP_PARTIAL |
| 115 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-014 | 58/60 | 0/0 | 54/54 | 60 | ⚠️ PBP_PARTIAL |
| 116 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-015 | 43/53 | 0/0 | 41/53 | 49 | ⚠️ PBP_PARTIAL |
| 120 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-034 | 74/61 | 0/0 | 72/61 | 72 | ⚠️ PBP_PARTIAL |
| 121 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-032 | 68/63 | 0/0 | 70/63 | 72 | ⚠️ PBP_PARTIAL |
| 122 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-019 | 67/56 | 0/0 | 59/56 | 66 | ⚠️ PBP_PARTIAL |
| 123 | 열혈농구단 SEASON2 전국 최강전 | 26-GG-HJ02-020 | 43/70 | 0/0 | 41/66 | 62 | ⚠️ PBP_PARTIAL |
| 158 | 제21회 몰텐배 동호회최강전 | 26-GG-MD21-027 | 48/60 | 0/0 | 46/54 | 55 | ⚠️ PBP_PARTIAL |
| 270 | 2026년 6차 BDR 스타터스리그 | - | 41/17 | 0/0 | 37/15 | 28 | ⚠️ PBP_PARTIAL |
| 271 | 2026년 6차 BDR 스타터스리그 | - | 24/23 | 0/0 | 22/21 | 23 | ⚠️ PBP_PARTIAL |
| 272 | 2026년 6차 BDR 스타터스리그 | - | 25/37 | 0/0 | 21/37 | 32 | ⚠️ PBP_PARTIAL |
| 273 | 2026년 6차 BDR 스타터스리그 | - | 26/27 | 0/0 | 20/29 | 25 | ⚠️ PBP_PARTIAL |

## 📋 통계 요약

- 후보 총: **29건**
  - ✅ PBP_MATCHES_HEADER (안전 정정 / EXECUTE 대상): 4건
  - ⚠️ PBP_PARTIAL (부분 / 검토 필요 / EXECUTE skip): 25건
  - ❌ PBP_MISMATCH (PBP 0건 또는 합 0 / EXECUTE skip): 0건

- skip 통계 (필터 제외):
  - paper 매치 (DB.QS SSOT 보존): 87건
  - QS already OK (이미 박제): 2건
  - 헤더 0/0 (X 분류 / stale 헤더): 14건
  - 팀 미배정 (homeTeamId/awayTeamId NULL): 0건

## 🎯 EXECUTE 대상 매치 변경안 (PBP_MATCHES_HEADER 만)

### matchId=269 (2026년 6차 BDR 스타터스리그 / -)
- 헤더: 18/28
- 현재 QS: 0/0 (0/0 박제 상태)
- 제안 QS (PBP 합):
  ```json
  {"home":{"q1":2,"q2":3,"q3":13,"q4":0,"ot":[]},"away":{"q1":6,"q2":8,"q3":9,"q4":5,"ot":[]}}
  ```

### matchId=110 (열혈농구단 SEASON2 전국 최강전 / 26-GG-HJ02-009)
- 헤더: 63/33
- 현재 QS: 0/0 (0/0 박제 상태)
- 제안 QS (PBP 합):
  ```json
  {"home":{"q1":17,"q2":19,"q3":11,"q4":16,"ot":[]},"away":{"q1":6,"q2":15,"q3":4,"q4":8,"ot":[]}}
  ```

### matchId=101 (열혈농구단 SEASON2 전국 최강전 / 26-GG-HJ02-027)
- 헤더: 58/53
- 현재 QS: 0/0 (0/0 박제 상태)
- 제안 QS (PBP 합):
  ```json
  {"home":{"q1":16,"q2":22,"q3":4,"q4":16,"ot":[]},"away":{"q1":10,"q2":15,"q3":12,"q4":16,"ot":[]}}
  ```

### matchId=111 (열혈농구단 SEASON2 전국 최강전 / 26-GG-HJ02-010)
- 헤더: 29/45
- 현재 QS: 0/0 (0/0 박제 상태)
- 제안 QS (PBP 합):
  ```json
  {"home":{"q1":14,"q2":6,"q3":3,"q4":6,"ot":[]},"away":{"q1":4,"q2":11,"q3":18,"q4":12,"ot":[]}}
  ```

## ℹ️ DRY-RUN 종료 — UPDATE 실행 X (운영 DB 영향 0)

실제 UPDATE 실행: `npx tsx scripts/_temp/backfill-quarter-scores.ts --execute`
**PM 사용자 결재 후 별도 실행 의무 (CLAUDE.md §DB 정책 §1.1)**.

---

## 🚨 EXECUTE 실행 결과 (사용자 결재 후 / 2026-05-23)

| matchId | 토너먼트 | 헤더 | 박제 전 QS | 박제 후 QS (PBP 합) | 결과 |
|---------|---------|------|-----------|---------------------|------|
| 101 | 열혈농구단 SEASON2 (26-GG-HJ02-027) | 58/53 | 0/0 | 58/53 | ✅ OK |
| 110 | 열혈농구단 SEASON2 (26-GG-HJ02-009) | 63/33 | 0/0 | 63/33 | ✅ OK |
| 111 | 열혈농구단 SEASON2 (26-GG-HJ02-010) | 29/45 | 0/0 | 29/45 | ✅ OK |
| 269 | 2026년 6차 BDR 스타터스리그 | 18/28 | 0/0 | 18/28 | ✅ OK |

**EXECUTE 결과**: 4/4 UPDATE 성공 / skip 0건 / 사후 검증 4/4 OK (헤더 = QS 정확 일치).

**운영 영향**: paper 매치 87건 SSOT 보존 / 헤더 변경 0 / standings 영향 0 / PBP/MPS 영향 0 / LIVE API 표시 즉시 정정 (다음 LIVE 페이지 조회 시 PBP 재계산 fallback 대신 DB.QS 직접 사용 가능).

**잔여 작업 (Sprint 3 F4 영역)**:
- PARTIAL 25건 (열혈 SEASON2 + 몰텐배 + 6차 스타터스리그) — PBP 합 ≠ 헤더 (STL 보정 / 시계 누락 / Flutter race 의심) → 매치별 외부 source 결재 필요
