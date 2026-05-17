# 작업 스크래치패드

## 현재 작업
- **요청**: 대회 hero 모바일 비율 사고 fix (Galaxy Z Fold 5 외부 344px 환경)
- **상태**: 박제 완료 (developer) / tsc 통과 / PM 검수 대기
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
| 2026-05-17 | **YouTube 다단어 팀명 fallback 매칭 박제** (옵션 E, YNC B 사고) | ✅ commit `8cdb481` / score-match.ts +44 LOC / vitest 21/21 (신규 7 + 회귀 14) / 5/10 swap-aware 정책 보존 / errors.md 룰 박제 |
| 2026-05-17 | **대회 hero 모바일 비율 사고 fix** (v2-tournament-hero.tsx column grid 분기) | ✅ < 480px = column / ≥ 480px = 기존 200px 보존 / 로고 max 140×196 / +30 LOC / tsc 0 error / 데스크탑 시각 변경 0 |
| 2026-05-17 | **5/17 예선1경기 종별 뱃지 누락 fix** (settings.division_code 1행 박제) | ✅ 매치 199 / `i3w-U12` jsonb merge UPDATE / 다른 settings 키 보존 / 사후 검증 19/19 박제 / 임시 script 2개 삭제 / errors.md 기록 |
| 2026-05-17 | score-sheet 임시번호 적용 + 부여 UI (No. cell 모달) | ✅ commit `87169a9` |
| 2026-05-17 | score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명 | ✅ commit `4829360` |
| 2026-05-17 | score-sheet 설명서 신규 3 섹션 (벤치T + Delay + i3 자동) | ✅ commit `fbd566c` |
| 2026-05-17 | score-sheet Delay = Extra periods 같은 행 통합 | ✅ commit `c649b5a` |
| 2026-05-17 | score-sheet Delay/벤치T 시인성 + Delay 위치 이동 | ✅ commit `f3d7b96` |
| 2026-05-17 | 🚨 i3w-U12 stale 매핑 영구 fix + 매치 205/207 복원 | ✅ division-advancement 가드 강화 / vitest 35/35 통과 |
| 2026-05-16 | score-sheet Bench Tech + Delay 박제 design 검토 | 🟡 Phase 1~6 (+1090 LOC / 18h / 3 PR 분해) / Q1~Q3 대기 |

## 미푸시 commit
- 직전 push 이후 미푸시 commit: **2건** (`8cdb481` youtube fallback fix + `37f7d3d` 5/17 division_code fix docs)

## 구현 기록 (developer — 2026-05-17 hero 모바일 fix)

📝 구현한 기능: 대회 상세 페이지 v2 hero 컴포넌트의 모바일 (< 480px) 비율 사고 fix.
Galaxy Z Fold 5 외부 (344px) 같은 좁은 viewport 에서 row grid (200px 1fr) 가
텍스트 영역을 ~84px 까지 압축 → 1~2글자 폭 줄바꿈 사고 → 모바일에서 column grid 로 전환.

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/(web)/tournaments/[id]/_components/v2-tournament-hero.tsx` | `className="v2-tournament-hero"` + `data-has-poster` attr 도입 / RSC 호환 `<style>` tag 로 `@media (max-width: 479px)` 룰 추가 (column grid + 로고 max 140×196 + 텍스트 영역 width 100%) | 수정 |

원리:
- inline style 안에서는 media query 못 씀 → className + `<style>` tag 조합 (RSC 호환, `<style jsx>` 불필요)
- 데스크탑 ≥ 480px = 기존 inline style (200px 1fr grid) 그대로 적용
- 모바일 < 480px = `!important` 로 inline style 오버라이드 (column / 1fr / 로고 140×196 / 텍스트 width 100%)
- 시안 13 룰 준수: 색상 토큰 변경 0 / pill 9999px 미사용 / lucide-react 미사용 / Material Symbols 보존

💡 tester 참고:
- 테스트 viewport (Chrome DevTools): 344px (Galaxy Z Fold 5 외부) / 375px (iPhone SE) / 414px (iPhone Plus) / 479px (모바일 경계) / 480px (데스크탑 경계) / 768px (태블릿) / 1024px+ (PC)
- 정상 동작:
  - **< 480px**: 로고 (140×196 max) 가 위, 텍스트 (제목/메타/뱃지) 가 아래. 제목이 1~2글자 폭 줄바꿈 없이 자연스럽게 표시
  - **≥ 480px**: 기존 row grid (200×280 로고 좌 + 텍스트 우) 시각 변경 0
- 주의할 입력: `bannerUrl` 또는 `logoUrl` 가 null 인 대회 (hasPoster=false) → 기존 1fr 그리드 그대로 (모바일 분기 룰 미적용, data-has-poster="false" 로 selector 회피 확인)

⚠️ reviewer 참고:
- 특별히 봐줬으면 하는 부분:
  1. `<style>` tag scoped — 클래스명 `v2-tournament-hero` 가 다른 곳에서 안 쓰이는지 (grep 결과 5 파일 중 본 컴포넌트만 hero 컴포넌트, 충돌 0)
  2. `!important` 사용 — inline style 우선순위 회피 목적. 모바일 분기에서만 적용, 의도된 사용
  3. 480px breakpoint — 시안 720px (태블릿) 와 다름. 모바일/소형 모바일 경계로 480px 채택 (Galaxy Z Fold 5 외부 344px 커버 + iPhone Plus 414px 커버 + 일반 모바일 표준)
- 회귀 검증: BDR-current/ 시안 폴더 hero 구조와 충돌 0 (시안 측 변경 0)


## 메모
- 어드민 수동 매치 추가 경로 `division_code` 박제 가드 → 후속 PR 안건
- scratchpad 자동 압축 룰: 100줄 이내 유지, 작업 로그 10건 초과 시 가장 오래된 항목 삭제
