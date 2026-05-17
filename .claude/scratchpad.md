# 작업 스크래치패드

## 현재 작업
- **요청**: 강남구협회장배 대회 규정 (이미지 #183) `/tournaments/[id]?tab=rules` 박제
- **상태**: 박제 완료 (developer) / tsc 0 error / PM 검수 대기
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
| 2026-05-17 | **강남구협회장배 규정 4 섹션 박제** (`?tab=rules` / 이미지 #183) | ✅ 신규 `gnba-rules.tsx` (4 섹션: 경기방식 i2/i3U9/i3 + 로컬룰 공통/승점/동률 + 경기메뉴얼 + 시상 / +217 LOC) / `page.tsx` settings.points_rule==="gnba" 분기 + tournament.rules 자유텍스트 양립 보존 / 다른 대회 회귀 0 (기존 폴백 유지) / 13 룰 정합 (var(--color-*) / Material Symbols / radius 4px / 데스크탑 2×2 grid → 모바일 column) / tsc 0 error |
| 2026-05-17 | **🚨 강남구협회장배 한정 승점 룰 박제 + 영구 컬럼 + 종료 매치 백필** | ✅ 신규 헬퍼 `standings-points.ts` (calculateMatchPoints / i2=20/30 / i3=10/15 분기 / +85 LOC) / vitest 25/25 PASS (강남구 i2/i3/i3w + default + edge 9 케이스) / `TournamentTeam.win_points` 컬럼 ADD (NULL 허용 / 무중단) / `Tournament.settings.points_rule="gnba"` 강남구 박제 / update-standings + public-standings + public-bracket 정렬 1차키 = winPoints / GroupStandings + LeagueStandings P 컬럼 (강남구 한정) / v2-bracket-wrapper 4곳 pointsRule prop 전달 / 백필 LIVE 완료 31팀 (사후 검증 31/31 정합) / tsc 0 error / vitest 281/281 / 임시 script 정리 |
| 2026-05-17 | **대회 hero 모바일 비율 사고 fix** (v2-tournament-hero.tsx column grid 분기) | ✅ < 480px = column / ≥ 480px = 기존 200px 보존 / 로고 max 140×196 / +30 LOC / tsc 0 error / 데스크탑 시각 변경 0 |
| 2026-05-17 | **5/17 예선1경기 종별 뱃지 누락 fix** (settings.division_code 1행 박제) | ✅ 매치 199 / `i3w-U12` jsonb merge UPDATE / 다른 settings 키 보존 / 사후 검증 19/19 박제 / 임시 script 2개 삭제 / errors.md 기록 |
| 2026-05-17 | score-sheet 임시번호 적용 + 부여 UI (No. cell 모달) | ✅ commit `87169a9` |
| 2026-05-17 | score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명 | ✅ commit `4829360` |
| 2026-05-17 | score-sheet 설명서 신규 3 섹션 (벤치T + Delay + i3 자동) | ✅ commit `fbd566c` |
| 2026-05-17 | score-sheet Delay = Extra periods 같은 행 통합 | ✅ commit `c649b5a` |
| 2026-05-17 | score-sheet Delay/벤치T 시인성 + Delay 위치 이동 | ✅ commit `f3d7b96` |
## 미푸시 commit
- 직전 push 이후 미푸시 commit: **0건** (`8cdb481` + `16e27da` push 완료 — d681b5f..16e27da subin → subin)

## 구현 기록 (developer — 2026-05-17 강남구협회장배 규정 4 섹션 박제)

📝 구현한 기능: `/tournaments/[id]?tab=rules` 강남구협회장배 한정 규정 4 섹션 박제 (이미지 #183).
경기방식 (i2 6분4쿼터 / i3·i3U9 10분 전후반) / 로컬룰 (지역방어 ❌ 승점 i2 20·30 / i3 10·15 동률 득실차→득점순) / 경기메뉴얼 (참가 레벨·공정성·맨투맨·동일 기준) / 시상 (i2 트로피 / i3 메달+기념티).

| 파일 경로 | 변경 내용 | 신규/수정 | LOC |
|----------|----------|----------|----|
| `src/app/(web)/tournaments/[id]/_components/gnba-rules.tsx` | 4 섹션 박제 (sports_basketball 헤더 + 2×2 grid + var(--color-*) 토큰 + 데스크탑/모바일 분기 + footer 안내) | 신규 | +217 |
| `src/app/(web)/tournaments/[id]/page.tsx` | GnbaRules import + settings.points_rule==="gnba" 분기 + tournament.rules 양립 보존 (강남구 = GnbaRules + 추가 안내 카드 / 그 외 = 기존 텍스트 / 빈 상태 폴백 유지) | 수정 | +30 |

원리:
- pointsRule = `(tournament.settings as Record<string, unknown> | null)?.points_rule` 박제 (이미 직전 작업 `settings.points_rule="gnba"` DB 박제됨)
- 강남구 한정 하드코딩 (다른 대회 = DB 변경 0, 시각 변경 0)
- tournament.rules 자유텍스트가 있으면 GnbaRules 아래 별도 "추가 안내" 카드로 표시 → 운영자 입력 보존
- 시안 13 룰 정합: 모든 색상 var(--color-*) / Material Symbols Outlined (sports_basketball, schedule, rule, menu_book, emoji_events) / radius 4px (rounded-md) / line-height 1.6+ (leading-relaxed) / 데스크탑 2×2 grid → 모바일 1 column

💡 tester 참고:
- 검증 URL: `/tournaments/bd527531-3745-483a-a7d8-ebd77200480a?tab=rules` (강남구)
- 정상 동작: 강남구 = 4 섹션 박스 2×2 grid + footer 안내 노출. 다른 대회 = 기존 폴백 (tournament.rules 텍스트 또는 빈 상태 카드)
- 회귀 위험: 다른 대회 `?tab=rules` = settings.points_rule !== "gnba" → 기존 동작 (tournament.rules / 빈 상태)
- 모바일 (< 768px): 4 섹션 column stack / 데스크탑 (≥ 768px): 2×2 grid

⚠️ reviewer 참고:
- settings 타입 캐스팅 `(tournament.settings as Record<string, unknown> | null)?.points_rule` — tournament.settings 가 Prisma JsonValue 라서 직접 비교 불가 → 캐스팅 후 ?. 안전 접근 (NULL 안전)
- GnbaRules 컴포넌트 = 정적 시안 (props 0개) — 향후 운영자 입력 UI 도입 시 props 추가 또는 별도 컴포넌트 분리 필요
- 검수: 시안 13 룰 (var(--color-*) / Material Symbols / pill 9999px ❌ / 핑크·살몬·코랄 ❌) 자체 검수 완료
- tsc 0 error / 다른 대회 회귀 검증 = 분기 키 (settings.points_rule) 가 직전 작업과 동일 source

---

## 메모
- 직전 작업 (승점 룰 박제) 상세: 작업 로그 1줄 + 위 구현 기록 (규정 박제) 참조

- 어드민 수동 매치 추가 경로 `division_code` 박제 가드 → 후속 PR 안건
- scratchpad 자동 압축 룰: 100줄 이내 유지, 작업 로그 10건 초과 시 가장 오래된 항목 삭제
