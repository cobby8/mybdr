# 작업 스크래치패드

## 현재 작업
- **요청**: BDR v2.14 1차 박제 완료 + 4차 뉴비리그 운영 인프라 박제 / 차기 = **CLI 핸드오프 2차** (admin 디자인 시스템 시각 확장) — 새 세션 진입 대기
- **상태**: 본 세션 종료, 다음 세션 fresh context 권장 (Phase 1 회귀 위험 최고)
- **차기 의뢰서**: `bdr 디자인 시스템 관리/admin-design-2026-05-15/cli-handoff-round2.md` (사용자 paste 의뢰서)
- **차기 진행 권장**: §14-2 분할 (A: Phase 1+2 / B: Phase 3~6 / C: Phase 7 / D: Phase 8+9) — Phase 1 별 세션 권장

## 진행 현황표
| 단계 | 상태 |
|------|------|
| **BDR v2.14 1차 박제** | ✅ 100% main 박제 완료 (12 commit) |
| **4차 뉴비리그 운영 인프라** | ✅ PR #527 + #531 main 머지 완료 |
| **CLI 핸드오프 2차 (Phase 1~9)** | ⏳ 새 세션 대기 |

## 후속 큐 (별도 세션)
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장 (AdminShell 채택 + sidebar 시각 + Dashboard 본문 + Admin-4-B/7-A/7-B 잔여 + 토큰 매핑 + 자동 검증)
- **AppNav utility 좌측 메뉴** (소개/요금제/도움말): 임시 숨김 (JSX 주석 보존)
- **AppNav SSR admin 메뉴 정합**: (web)/layout.tsx getAuthUser admin_role/association SELECT 확장
- **PR-G5.5-followup-B**: 매치 PATCH route 통합 (status='completed' division_rule=0 → advanceTournamentPlaceholders)
- **PR-G5.5-NBA-seed**: 8강/4강 NBA 시드 표준 generator
- **dev 브랜치 sync**: origin/dev = origin/main 보다 84+ commit stale → 다음 작업 시작 전 dev → main 동기화 권장
- Phase 6 PR3 / Phase 19 PR-T1~T5 / Phase 23 PR4 / PR-G5.2 / PR-G5.7~8 / Phase E 14 라우트 / GNBA 8팀

## 미푸시 commit
- **0건** (subin = origin/subin / main `8a913ef` 본 세션 2 PR 박제 완료)

## working tree (다른 트랙 보존)
- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (M)
- `src/app/api/web/score-sheet/[matchId]/cross-check-audit/route.ts` (M)
- stash@{0}: score-sheet WIP + scratchpad (다른 트랙 변경 보존)
- → score-sheet 트랙 작업 중. 본 admin 박제와 무관

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** ⭐ | ✅ PR #531 main 머지 (`8a913ef`) — getMyTournaments/hasAccessToTournament 헬퍼 확장 + v1 5/6 라우트 분기 추가 (my-tournaments / full-data / matches/sync / batch-sync / teams/players) + record01@mybdr.kr / record02@mybdr.kr DB 강등 (isAdmin=true→false / admin_role=super_admin→recorder_admin) / tsc 0 / vitest auth 64/64 |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3 + score-sheet** | ✅ PR #527 main 머지 (`1bff83e`) — editions/route.ts 2 path (legacy + wizard) apiToken: generateApiToken() 박제 / `generateApiToken()` 헬퍼 분리 / 4차 뉴비리그 1행 UPDATE NULL→64자 hex (8a966a0a...) / errors.md 49번 박제 |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step 박제 + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` (Sub-B3 new/wizard AdminPageHeader 옵션 A) + `efcc103` (Sub-B2 [id]/wizard AdminPageHeader 패턴) / 모두 main 박제 완료 |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 (subin → dev → main 통합) + PR #519 (temp/session-merge → main 본 세션 2건 분리) |
| 2026-05-15 | 라이브 페이지 정리 (toolbar + 홈 버튼) | ✅ commit `5f1e768` + `599c64c` |
| 2026-05-15 | 조별 순위표 + bracket aside 종합 정리 (모든 대회) | ✅ commit `0512fb5` + `ea43d41` + `4c7b9a5` + `e649c81` + `0144595` |
| 2026-05-15 | wizard 일정 및 장소 legacy venue_name 표시 보강 | ✅ commit `baaf74f` |
| 2026-05-15 | 프론트 헤더 utility 정리 (관리자 진입 + 좌측 메뉴 숨김) | ✅ commit `ed42f1c` + `57d7029` + `d6cf751` |
| 2026-05-15 | wizard 저장 status enum mismatch fix (운영 DB legacy 17종 허용) | ✅ commit `ddb1dfc` + `b50f6aa` |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier (4차 BDR 뉴비리그 5/16 운영) | ✅ commit `6d52a33` + `c78bbba` |
