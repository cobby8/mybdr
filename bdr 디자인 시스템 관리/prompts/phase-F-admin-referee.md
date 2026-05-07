# Phase F — admin / referee 토큰 일괄 매핑 (Cowork 전용 — 시안 박제 X)

> ⚠️ **본 Phase 는 클로드 디자인 작업 영역 외**.
> admin / referee / tournament-admin / partner-admin = E등급 (자체 셸 사용 / 시안 박제 대상 X — `04-page-inventory.md §5`).
> Cowork (저) 또는 Claude Code 가 src/ 영역 직접 작업 — 클로드 디자인에 의뢰할 항목 없음.

---

## 🎯 본 Phase 의 작업 범위

**클로드 디자인 작업 (시안 영역)**: ❌ **없음**
- E등급 영역은 시안 박제 대상이 아니며 (04 §5), 자체 셸 (`AdminSidebar`, `RefereeShell`, `TournamentAdminNav`, `PartnerAdminLayout`) 을 그대로 사용.
- 디자인 시안에서 admin / referee 페이지를 별도로 그리지 않음.
- 본 Phase 는 토큰만 BDR v2 로 일치 시키는 기계적 마이그레이션.

**Cowork (저) 또는 Claude Code 작업 (src/ 영역)**:
- src/app/(admin)/* — 49 파일 (admin 18 + tournament-admin 20 + admin sidebar/loading 11)
- src/app/(referee)/* — 28 파일
- src/app/(referee-public)/* — 3 파일
- src/app/(web)/partner-admin/* — 5 파일
- src/components/admin/* — 자체 셸 컴포넌트
- 합계 약 80 파일

---

## 📋 Cowork 의뢰 (PM 이 Cowork 와 진행)

Phase A~E 의 클로드 디자인 시안 작업 모두 완료 후, PM 이 Cowork 에게 다음 의뢰:

```
Phase F 진행해줘 — admin / referee 영역 폐기 토큰 일괄 매핑.

배경:
- Phase A~E 클로드 디자인 시안 완료 + src/ 마이그레이션 모두 완료 가정
- 본 Phase 는 시안 박제 X — E등급 자체 셸 영역만 토큰 일치
- 작업 후 grep "var(--color-" src/ → 0 달성 목표

작업 영역:
- src/app/(admin)/* (49)
- src/app/(referee)/* (28)
- src/app/(referee-public)/* (3)
- src/app/(web)/partner-admin/* (5)
- src/components/admin/* / src/components/referee/* (있으면)

매핑 (02 §9 그대로):
| 폐기 토큰 | 신규 토큰 |
|----------|----------|
| --color-primary / --color-accent | --accent |
| --color-card | --bg-card |
| --color-surface | --bg-elev |
| --color-surface-bright | --bg-alt |
| --color-border | --border |
| --color-text-muted | --ink-mute |
| --color-text-secondary | --ink-soft |
| --color-on-accent | --ink-on-brand |
| --color-success | --ok |
| --color-warning | --warn |
| --color-error | --danger |

진행 방식 (안전 가드):
1. 먼저 grep 결과를 보여줘 (어떤 파일에 무슨 토큰)
2. sed 일괄 명령 dry run (--echo-only) 보여줘
3. PM 승인 후 실행 — branch subin / commit 분리:
   * `refactor(admin): BDR v2 토큰 일괄 매핑 (Phase F-1)` (49 파일)
   * `refactor(referee): BDR v2 토큰 일괄 매핑 (Phase F-2)` (31 파일)
   * `refactor(partner-admin): BDR v2 토큰 일괄 매핑 (Phase F-3)` (5 파일)
4. 검증:
   * grep "var(--color-" 위 영역 → 0
   * grep "var(--color-" src/ 전체 → 0 (Phase A~F 누적)
   * tsc 0 errors / eslint 0 errors
5. 시각 검증 (PM): localhost:3001 admin / referee 대시보드 라이트/다크 검증

룰 인지:
- E등급 시안 박제 X — UI 마크업 변경 금지 (토큰만)
- AppNav: admin/referee 자체 셸 — 13 룰 영향 0
- tsx 안 Tailwind arbitrary value (text-[var(--color-*)]) 도 매핑 (별도 sed 패턴)
- 운영 DB 영향 0 (CSS 변경만)

자체 검수 (Phase F 완료 = 폐기 토큰 0 달성):
□ grep "var(--color-" src/ → 0
□ tsc 0 errors / eslint 0 errors
□ admin 대시보드 / referee 대시보드 시각 검증 (라이트 / 다크)
□ AppNav 변경 0
□ scratchpad.md 작업 로그 1줄: Phase F 완료 — admin/referee 80 파일 일괄 매핑 (전체 폐기 토큰 0 달성)

작업 시작.
```

---

## 📚 참조 (Cowork 가 자동 인지)

- `Dev/design/claude-project-knowledge/02-design-system-tokens.md` §9 매핑
- `Dev/design/claude-project-knowledge/04-page-inventory.md` §5 E등급 (시안 박제 X / 토큰만)
- `audit-2026-05-07.md` §2-1 영역별 파일 수
- `CLAUDE.md` §🗂️ Dev/design/ §6 (E등급 영역 = 토큰만 일치)

---

## ⚠️ 본 Phase 가 마지막인 이유 (재확인)

1. **시안 박제 X** — E등급 페이지는 자체 디자인 OK / 토큰만 정합. 클로드 디자인이 별도 시안 그릴 필요 없음.
2. **기계적 sed replace 가능** — 12 매핑을 정확히 적용. 시각 변형 0 (토큰값만 교체).
3. **위험 낮음** — 백오피스 영역 — 사용자 영향 0.
4. **마지막 정리 = 깔끔한 0** — Phase A~F 완료 후 전체 grep 결과가 0 으로 마무리.

→ 본 Phase 는 클로드 디자인 의뢰서가 필요 없음. PM 이 Cowork 와 직접 진행.
