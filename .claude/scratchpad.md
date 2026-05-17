# 작업 스크래치패드

## 현재 작업
- **요청**: 강남구협회장배 한정 승점 룰 박제 + 영구 컬럼 + 종료 매치 백필
- **상태**: 박제 완료 (developer) / tsc 0 error / vitest 281/281 / 백필 LIVE 완료 / PM 검수 대기
- **현재 담당**: developer → pm

## 진행 현황
| 영역 | 상태 |
|------|------|
| 5/17 종별 뱃지 누락 fix | ✅ 완료 (매치 199 i3w-U12 박제) |
| score-sheet 임시번호 UI | ✅ 완료 (87169a9 외 4 commit) |
| Phase 1 admin 흐름 개선 6 PR | ✅ main 머지 완료 |
| Track B GNBA 유소년 INSERT | 🟡 spec 분석 완료, 결재 8 항목 대기 |
| score-sheet Bench Tech + Delay 박제 | 🟡 design 검토 완료, Q1~Q3 결재 대기 |
| score-sheet PBP 수정 모달 | 🟡 기획설계 완료, 박제 대기 |

## 작업 로그 (최근 10건)
| 날짜 | 작업 | 결과 |
|------|------|------|
| 2026-05-17 | **🚨 강남구협회장배 한정 승점 룰 박제 + 영구 컬럼 + 종료 매치 백필** | ✅ 신규 헬퍼 `standings-points.ts` (calculateMatchPoints / i2=20/30 / i3=10/15 분기 / +85 LOC) / vitest 25/25 PASS (강남구 i2/i3/i3w + default + edge 9 케이스) / `TournamentTeam.win_points` 컬럼 ADD (NULL 허용 / 무중단) / `Tournament.settings.points_rule="gnba"` 강남구 박제 / update-standings + public-standings + public-bracket 정렬 1차키 = winPoints / GroupStandings + LeagueStandings P 컬럼 (강남구 한정) / v2-bracket-wrapper 4곳 pointsRule prop 전달 / 백필 LIVE 완료 31팀 (사후 검증 31/31 정합) / tsc 0 error / vitest 281/281 / 임시 script 정리 |
| 2026-05-17 | **대회 hero 모바일 비율 사고 fix** (v2-tournament-hero.tsx column grid 분기) | ✅ < 480px = column / ≥ 480px = 기존 200px 보존 / 로고 max 140×196 / +30 LOC / tsc 0 error / 데스크탑 시각 변경 0 |
| 2026-05-17 | **5/17 예선1경기 종별 뱃지 누락 fix** (settings.division_code 1행 박제) | ✅ 매치 199 / `i3w-U12` jsonb merge UPDATE / 다른 settings 키 보존 / 사후 검증 19/19 박제 / 임시 script 2개 삭제 / errors.md 기록 |
| 2026-05-17 | score-sheet 임시번호 적용 + 부여 UI (No. cell 모달) | ✅ commit `87169a9` |
| 2026-05-17 | score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명 | ✅ commit `4829360` |
| 2026-05-17 | score-sheet 설명서 신규 3 섹션 (벤치T + Delay + i3 자동) | ✅ commit `fbd566c` |
| 2026-05-17 | score-sheet Delay = Extra periods 같은 행 통합 | ✅ commit `c649b5a` |
| 2026-05-17 | score-sheet Delay/벤치T 시인성 + Delay 위치 이동 | ✅ commit `f3d7b96` |
| 2026-05-17 | 🚨 i3w-U12 stale 매핑 영구 fix + 매치 205/207 복원 | ✅ division-advancement 가드 강화 / vitest 35/35 통과 |
## 미푸시 commit
- 직전 push 이후 미푸시 commit: **0건** (`8cdb481` + `16e27da` push 완료 — d681b5f..16e27da subin → subin)

## 구현 기록 (developer — 2026-05-17 강남구협회장배 승점 룰 박제)

📝 구현한 기능: 강남구협회장배 한정 승점 룰 박제 + 영구 컬럼 + 36건 종료 매치 백필.
승=3 / i2: 20점차↑=2 / 30점차↑=1 / i3·i3w: 10점차↑=2 / 15점차↑=1 / 패=0 룰 단일 source 박제.
사용자 결재 4건 정합 (Q1 i3w=i3 / Q2 영구 컬럼 / Q3 기본=3vs0 / Q4 백필 LIVE).

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|----|
| `src/lib/tournaments/standings-points.ts` | calculateMatchPoints 헬퍼 (i2 20/30 분기 + i3 10/15 분기 + default 3vs0 폴백) | 신규 | +85 |
| `src/__tests__/lib/tournaments/standings-points.test.ts` | vitest 25 케이스 (i2 7 + i3 6 + i3w 2 + default 4 + edge 6) | 신규 | +220 |
| `prisma/schema.prisma` | TournamentTeam.win_points Int? @default(0) ADD COLUMN | 수정 | +3 |
| `src/lib/tournaments/update-standings.ts` | tournament.settings.points_rule SELECT + winPoints in-memory 합산 + win_points SET | 수정 | +30 |
| `src/app/api/web/tournaments/[id]/public-standings/route.ts` | settings SELECT + winPoints 반환 + 정렬 1차키 = winPoints desc + pointsRule 응답 | 수정 | +20 |
| `src/app/api/web/tournaments/[id]/public-bracket/route.ts` | settings SELECT + groupTeams/leagueTeams winPoints 추가 + 정렬 변경 + pointsRule 응답 | 수정 | +15 |
| `src/app/(web)/tournaments/[id]/bracket/_components/group-standings.tsx` | pointsRule prop + showWinPoints 분기 + P 컬럼 + 승점 정렬 | 수정 | +35 |
| `src/app/(web)/tournaments/[id]/bracket/_components/league-standings.tsx` | pointsRule prop + showWinPoints 분기 + P 컬럼 + 공동순위 1차키 winPoints | 수정 | +40 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-wrapper.tsx` | GroupStandings/LeagueStandings 4 호출 모두 `pointsRule={d.pointsRule}` 전달 | 수정 | +4 |

DB 작업:
- `prisma db push` 운영 DB 적용 = 무중단 (NULL 허용 ADD COLUMN) — ✅ Done in 1.99s
- 임시 script `scripts/_temp/backfill-gnba-points.ts` 작성 → DRY_RUN 검증 → LIVE 실행 → 사후 검증 31/31 정합 → 정리 삭제
- 강남구 tournament (`bd527531-...`) `settings.points_rule="gnba"` 박제 완료 (기존 4 키 보존)

원리:
- pointsRule 분기 = tournament.settings.points_rule="gnba" 박제 시만 강남구 룰 적용 → 다른 대회 영향 0
- divisionCode prefix 매칭: `i2*` → 20/30 / `i3*` (i3w 포함) → 10/15 / 그 외 → 3
- 무승부 / NULL score = 0 vs 0 (FIBA 농구 = 무승부 미발생 / 안전 분기)
- win_points DB 박제 (vs 동적 산출) — update-standings SET 방식과 일관 + 정렬 키 단순화
- default 룰 대회 = winPoints = wins*3 자연 박제 → 정렬 1차키 변경에도 회귀 0 (승률 정렬과 동치)

💡 tester 참고:
- 테스트 URL: `/tournaments/bd527531-3745-483a-a7d8-ebd77200480a/bracket` (강남구 대진표 탭)
- 정상 동작:
  - 종별별 그룹 standings 에 "P" 컬럼 노출 (정렬 1차키 = 승점 desc → PD desc → PF desc)
  - 예: i2-U11 A조 = 스티즈강남 8점 (3승 1패: 1 승=3 + 1 승=3 + 1 승=2점차 가산 = 8) > 동탄SK 7점 > 원주와이키키 6점 > 성북삼성 5점 > YNC 0점
  - i3-U9 A조 = 분당SFA 6점 (2승 0패: 두 매치 모두 10점차↑ = 2+2 + ... 확인) > 분당정관장 3점 (1승 1패)
- 주의할 입력:
  - 강남구 외 대회 = pointsRule="default" → P 컬럼 hide / 정렬 변경 0 (승률 정렬과 동치)
  - 신규 매치 추가 후 종료 → update-standings.ts 가 자동 winPoints 박제
  - division_code 변경 → 다음 standings 업데이트 시 재계산

⚠️ reviewer 참고:
- 회귀 위험 0 가정:
  1. 강남구 외 대회: winPoints = wins * 3 → 승률 desc 정렬과 동치 → 시각 변경 0 검증
  2. update-standings.ts 의 SET 방식 idempotent — 재실행 안전 (errors.md PR-G5.5-followup-B 룰 보존)
  3. 무승부 매치 = winner_team_id NULL → calculateMatchPoints 미호출 (drawMatches 루프는 winPoints 0)
- 봐줬으면 하는 부분:
  1. divisionCode prefix 매칭 — `i3w` 가 startsWith("i3") 로 i3 룰 적용 (사용자 결재 받음 / vitest 검증)
  2. `t.win_points ?? 0` 폴백 — NULL 컬럼 안전 (prisma generate 후 타입 Int | null)
  3. 정렬 변경 — 다른 대회 (default 룰) 도 winPoints 정렬로 통일 (= wins*3 동치 → 시각 회귀 0)


## 메모
- 어드민 수동 매치 추가 경로 `division_code` 박제 가드 → 후속 PR 안건
- scratchpad 자동 압축 룰: 100줄 이내 유지, 작업 로그 10건 초과 시 가장 오래된 항목 삭제
