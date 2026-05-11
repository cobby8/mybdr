# 작업 스크래치패드

## 현재 작업
- **요청**: 운영 검증 6 issue (이미지 29~34) 옵션 A — 작은 fix 4건 본 세션
- **상태**: ✅ 3건 완료 / 33+34 별 PR 보류
- **모드**: no-stop (자동 머지 위임)

## 진행 현황표 (옵션 A — 본 세션)
| # | 이슈 | 작업 | 상태 |
|---|------|------|------|
| 31 | 빨강 버튼 디자인 위반 | organizations 2 페이지 6 토큰 → btn--primary / accent / info | ✅ |
| 30/32 | 단체 페이지 흐름 | snukobe org_members admin INSERT (강남구농구협회 orgId=3) | ✅ |
| 29 | 대회 자동 종료 로직 | auto-complete.ts + match-sync 통합 + vitest +8 + 운영 1건 backfill | ✅ |
| 32-추가 | 단체 관리/페이지 관리 메뉴 | 단체 상세 추가 메뉴 link 보강 | 보류 (별 PR) |
| 33 | 대진표 고도화 | dual_tournament rounds/brackets 매핑 강화 | 보류 (별 PR) |
| 34 | 권한 자동 부여 | 단체 admin → 대회 운영자 자동 부여 (헬퍼 또는 트리거) | 보류 (별 PR) |

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 7.1]** LineupSelectionModal 확장 — 전체 선택/해제 + FIBA 12명 cap (Article 4.2.2) + 13번째 차단 + applyRosterCap 헬퍼 + isLineupSelectionValid 12명 상한. tsc 0 / vitest 533/533 (+7). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | d89f600 | **[live]** score-match swap-aware 백포트 — 5/10 결승 영상 사고 2차 fix | ✅ |
| 2026-05-12 | ff190a7 | **[live]** 결승 영상 매핑 오류 fix — auto-register 1:1 매핑 가드 백포트 | ✅ |
| 2026-05-12 | 32b8ec9 | **[live]** TeamLink href 404 — TournamentTeam.id → Team.id 분리 | ✅ |
| 2026-05-12 | eead692 | **[stats]** 통산 스탯 3 결함 일괄 — mpg 모달 회귀 + 승률 source + FG%/3P% NBA 표준 | ✅ |
| 2026-05-12 | 714eda3 | **[stats]** 통산 mpg 단위 변환 — DB 초 → 표시 분 (사용자 보고) | ✅ |
| 2026-05-12 | eba91f9 | **[fix]** middleware.ts 삭제 — Next.js 16 proxy 단일 source 통합 | ✅ |
| 2026-05-12 | (다건) | **[FIBA Phase 7]** 디자인 PDF 1:1 + LineupSelectionModal + QuarterEndModal (Q4/OT 분기) | ✅ |
| 2026-05-12 | (다건) | **[강남구협회장배]** 36팀 + 59경기 + 종별 룰 + 토큰 + 모달 (Phase 1~4-B) | ✅ |
| 2026-05-12 | (다건) | **[admin]** 운영자 관리 통합 (transfer + add) + 소속 단체 한정 검색 + 기록모드 모달 압축 | ✅ |

## 구현 기록 (developer) — FIBA Phase 7.1 라인업 모달 확장

📝 구현 범위: 전체 선택/해제 + FIBA 12명 룰 (Article 4.2.2)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `_components/lineup-selection-modal.tsx` | `MAX_ROSTER_PER_TEAM`(=12) + `applyRosterCap` 헬퍼 신규 / TeamLineupPanel `onToast` prop + [전체 선택]/[전체 해제] 버튼 + 13번째 수동 체크 차단 + `lineupCount > MAX` 안전망 (isLineupSelectionValid) | 수정 |
| `_components/score-sheet-form.tsx` | LineupSelectionModal 마운트에 `onToast={showToast}` 주입 (1줄) | 수정 |
| `__tests__/score-sheet/lineup-selection-modal.test.ts` | applyRosterCap 5 케이스 + 13명 무효 1 케이스 + MAX 상수 검증 1 케이스 (총 +7) | 수정 |

### applyRosterCap 동작
- ≤ 12명 → 전체 체크 + overflowed=false
- > 12명 → 앞 12명 + overflowed=true (caller toast 경고 trigger)
- 빈 배열 / maxCount ≤ 0 안전망

### UX 흐름
- [전체 선택] 버튼 → applyRosterCap 호출 → 12명 cap 적용 + (overflowed 시) toast "FIBA 룰 최대 12명 — 앞 12명 자동 체크"
- [전체 해제] 버튼 → starters/substitutes 모두 [] (불일치 방지)
- 13번째 수동 체크 시도 → 차단 + toast "출전 명단 최대 12명 (FIBA 룰). 추가 불가"
- isLineupSelectionValid 안전망 = 출전 5~12 + 선발 = 5 + 중복 0

### 디자인
- 헤더 우측 2 버튼 (전체 선택/해제) = 36px 터치 영역 + `var(--color-accent)` / `var(--color-text-muted)` 텍스트
- Material Symbols `select_all` / `deselect` (lucide-react ❌)
- 카운트 표시 = 출전 N/12명 (cap 가시화)

### 검증
- tsc 0 에러 / vitest 533/533 PASS (기존 526 + 신규 7) / 회귀 0
- BigInt n literal 0 / lucide-react 0 / 핑크-빨강 본문 0
- schema 변경 0 / Flutter v1 영향 0 / AppNav 영향 0

### 💡 tester 참고
- 테스트 방법: 13명 이상 팀이 있는 매치 score-sheet 진입 → LineupSelectionModal 열림 → [전체 선택] 클릭 → 앞 12명 자동 체크 + info toast 표시 / 13번째 수동 체크 시도 → 차단 + error toast / [전체 해제] → 모든 체크 + 선발 해제
- 정상: tsc 0 / vitest 533 PASS / cap 12 (FIBA 표준)
- 주의: 12명 정확히 인 팀은 overflowed=false (경계 케이스 = 정상)

