# 작업 스크래치패드

## 현재 작업
- **요청**: 대진표 후속 큐 1~3 완료 + push 완료 / 4·5 보류 (운영 사용 0)
- **상태**: ✅ 종료 — push origin/subin (`eaccd54`)
- **현재 담당**: pm

## 진행 현황표 (대진표 후속 큐)
| # | PR | 상태 | LOC | commit |
|---|----|------|------|--------|
| 1 | PR-G5.5-followup-B 매치 PATCH 통합 | ✅ | +63 | `df96522` |
| 2 | PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator | ✅ | +900 | `b1e48b8` |
| 3 | PR-G5.2 dual-generator placeholder-helpers 통과 | ✅ | +302 | `eaccd54` |
| 4 | PR-G5.7 double_elim | 🔵 보류 | - | 운영 사용 0 |
| 5 | PR-G5.8 swiss | 🔵 보류 | - | 운영 사용 0 |

## 미푸시 commit
- **0건** (subin = origin/subin / `3a19fe6..eaccd54` push 완료)

## working tree (다른 트랙 보존)
- `src/app/(score-sheet)/score-sheet/[matchId]/_components/score-sheet-form.tsx` (M / score-sheet 트랙)
- `src/app/(score-sheet)/score-sheet/[matchId]/_hooks/use-score-sheet-input-state.ts` (?? / score-sheet 트랙)
- `bdr 디자인 시스템 관리/admin-design-2026-05-15/` (?? / 디자인 트랙)
- 본 대진표 트랙과 무관

## 후속 큐
- **PR-G5.7 double_elim / PR-G5.8 swiss**: 운영 진입 시점에 박제 (spec 변경 위험 + 검증 데이터 부재 → 후순위)
- **CLI 핸드오프 2차** ⭐ — admin 시각 확장 (AdminShell 채택 + sidebar 시각 + Dashboard 본문 + Admin-4-B/7-A/7-B 잔여 + 토큰 매핑 + 자동 검증)
- **AppNav utility 좌측 메뉴** (소개/요금제/도움말): 임시 숨김 (JSX 주석 보존)
- **AppNav SSR admin 메뉴 정합**: (web)/layout.tsx getAuthUser admin_role/association SELECT 확장
- **dev 브랜치 sync**: origin/dev = origin/main 보다 84+ commit stale → 다음 작업 시작 전 dev → main 동기화 권장
- Phase 6 PR3 / Phase 19 PR-T1~T5 / Phase 23 PR4 / Phase E 14 라우트 / GNBA 8팀
- recorder_admin Q1~Q6 결재 대기 (PR1~3 commit 완료)

## 수정 요청
| 요청자 | 대상 | 문제 | 상태 |
|--------|-----|-----|------|

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-16 | **PR-G5.2 dual-generator placeholder-helpers 통과 (옵션 B)** | ✅ commit `eaccd54` — 인라인 박제 12건 → buildSlotLabel 호출 / group_match_result kind 신규 / 5/2 adjacent BEFORE/AFTER 100% 일치 / vitest 227/227 PASS / 회귀 0 |
| 2026-05-16 | **PR-G5.5-NBA-seed 8강/4강 NBA 시드 generator (옵션 A opt-in)** | ✅ commit `b1e48b8` — 신규 파일 2건 + seed_number kind / 양분 트리 + 2^N 올림 + BYE / vitest 219/219 PASS (신규 25 케이스) / 기본 sequential 보존 회귀 0 |
| 2026-05-16 | **PR-G5.5-followup-B 매치 PATCH route 통합 (division_rule 분기)** ⭐ | ✅ commit `df96522` — Web PATCH + Flutter match-sync 양면 박제. 1차 사고 (developer 거짓 보고) → 되돌림 루프 1회 → PR2 부터 PM 직접 검증 모드 옵션 B 진입. lessons.md + conventions.md 박제 |
| 2026-05-16 | **recorder_admin 전역 흡수 + record01/02 강등** ⭐ | ✅ PR #531 main 머지 (`8a913ef`) — getMyTournaments/hasAccessToTournament 헬퍼 확장 + v1 5/6 라우트 분기 추가 / record01·record02 DB 강등 |
| 2026-05-16 | **4차 뉴비리그 apiToken 자동 발급 fix + Sub-B3 + score-sheet** | ✅ PR #527 main 머지 (`1bff83e`) — editions/route.ts 2 path apiToken: generateApiToken() 박제 / 4차 뉴비리그 1행 UPDATE NULL→64자 hex |
| 2026-05-15 | Admin-7-B Sub-B3 Wizard1Step + Sub-B2 EditWizard 박제 | ✅ commit `06069a4` + `efcc103` |
| 2026-05-15 | 본 세션 16 commit main 분리 머지 완료 | ✅ PR #517 + PR #519 |
| 2026-05-15 | 라이브 페이지 정리 (toolbar + 홈 버튼) | ✅ commit `5f1e768` + `599c64c` |
| 2026-05-15 | 조별 순위표 + bracket aside 종합 정리 | ✅ commit `0512fb5` + `ea43d41` + `4c7b9a5` + `e649c81` + `0144595` |
| 2026-05-15 | PR-G5.5-followup Tournament 단위 placeholder applier | ✅ commit `6d52a33` + `c78bbba` |
