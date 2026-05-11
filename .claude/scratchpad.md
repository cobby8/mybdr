# 작업 스크래치패드

## 현재 작업
- **요청**: 토너먼트 경기 종료 시 score sync 누락 버그 — 옵션 C 근본 해결
- **상태**: Phase B + Phase A 완료 — Phase C 진입 결재 대기
- **모드**: no-stop

## 진행 현황표 (옵션 C 6 Phase)
| Phase | 범위 | 상태 |
|------|------|------|
| §B | live API fallback 3단 (playerStats + PBP) | ✅ 9793b7f |
| §A | PBP/playerStats source backfill 10건 UPDATE | ✅ DB 영구 박제 (audit) |
| §C | status route safety net (Flutter 영향 0) | ⏳ 결재 대기 |
| §D | recompute admin endpoint + UI | ⏳ |
| §E | 모니터링 cron | ⏳ |
| §F | Flutter 협의 (`/batch-sync` deprecate) | ⏳ |

## 진단 결과 박제 (매치 #132 실측)
| 저장소 | Phase A 전 | Phase A 후 |
|--------|----------|---------|
| PBP (play_by_plays) | ✅ 263행 / made 36 / 합 39:26 | (변경 0) |
| tournamentMatch.homeScore/awayScore | ⚠️ 0/0 | ✅ 39/26 |
| tournamentMatch.quarterScores JSON | ⚠️ `{current_quarter:1}` | ✅ Q1:15-10 Q2:6-6 Q3:5-2 Q4:13-8 |
| match_player_stats | ⚠️ 26행 모두 pts=0 (잔존) | (Phase A 미박제 — 별도) |
| winner_team_id | ✅ 245 (피벗) | (변경 0) |
| route.ts L1131 fallback | ❌ 2단까지 | ✅ 3단 (PBP까지) |

## Phase A apply 결과 (10/10 매치 UPDATE 성공)

| source | 매치 수 | 대표 |
|--------|--------|------|
| **playerStats** (Phase B 2단) | 9 | 열혈농구단 #98~#104, #120, #121 |
| **PBP** (Phase B 3단 신규) | 1 | 몰텐배 #132 (피벗 vs SYBC 39:26) |

- TEST 2건 (#95 #96) 제외 (의도)
- winner 신규 부여: 5건 / 동일 유지: 5건
- audit: 10건 `source=system / context=backfill-pbp-2026-05-11` 박제
- 사후 검증: 10/10 SELECT 일치

## Phase B 구현 요약 (커밋 9793b7f)

| 파일 | LOC | 핵심 |
|------|-----|------|
| `src/lib/tournaments/score-from-pbp.ts` | +92 | `computeScoreFromPbp()` 순수 함수 (Phase A/C/D 단일 source) |
| `src/__tests__/lib/tournaments/score-from-pbp.test.ts` | +173 | 8 케이스 (매치 #132 실측 포함) |
| `src/app/api/live/[id]/route.ts` | +20/-4 | 3단 fallback (homeScore>0 → playerStats>0 → PBP) |

- tsc 0 / vitest 320/320 PASS / 회귀 0

## 기획설계 핵심 (planner-architect 2026-05-11) — 압축

- **A. sync 흐름**: Flutter `/api/v1/matches/[id]/*` 8 endpoint 분산 / `/tournaments/[id]/matches/sync` 가 완전 path / `/batch-sync` 가 부분 sync (deprecate 후보)
- **B. 추정 원인 #132**: Flutter app 이 `/sync` 미호출 + `/stats` 미호출 + `/events` PBP 만 박제 시나리오
- **C. 결재 5건 결정**: source-of-truth=PBP / 멱등 sync / recompute admin endpoint 추가 / backfill 전체 일괄 / DB trigger ❌
- **D. 원영 협의**: Phase C 머지 후 fyi 공지 / `/batch-sync` deprecate 는 Phase F 협의
- **knowledge 박제 후보**: `errors.md` (sync 누락 패턴) / `decisions.md` (PBP source-of-truth) / `architecture.md` (4 저장소 + 4 sync 채널)

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A apply]** PBP/playerStats source 10건 운영 DB UPDATE + audit (system/backfill-pbp-2026-05-11). #132 + 열혈농구단 9건 영구 복구. TEST 2건 제외. | ✅ |
| 2026-05-11 | (커밋 ❌ scripts/_temp) | **[옵션 C Phase A DRY-RUN]** 12 매치 SELECT + PBP 재계산 JSON 출력. UPDATE 0건. | ✅ |
| 2026-05-11 | 9793b7f | **[옵션 C Phase B]** score-from-pbp 헬퍼 + live API L1131 fallback 3단 강화. vitest 320/320 PASS. | ✅ |
| 2026-05-11 | (기획만) | **[옵션 C 기획설계]** 6 Phase + 5 결재 + 원영 협의 4 + knowledge 박제 후보. 코드 변경 0. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-B + 3 + rbac]** admin-guard sentinel + referee layout + RoleMatrixCard 8행. vitest 312/312. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[권한 시스템 Phase 1-A + 1-C + 2]** isSuperAdmin 단일 source + partner-admin 우회. vitest 296/296. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 3]** 알림 + 건의사항 + 비번 변경. ~+523 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[admin 마이페이지 Phase 2]** 관리 토너먼트 + 본인인증. ~+1,025 LOC. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1 강남구협회장배 유소년]** schema TT +3 / TTP +11. vitest 275/277. | ✅ |
| 2026-05-11 | (PM 커밋 대기) | **[Phase 1-B-2 종이 기록지 폼]** 14 파일 / +2,053. vitest 267/267. | ✅ |
