# BDR v2.5 — Phase 23 (ScoreSheet FIBA-paper pixel-perfect 정합)

> **Phase 23 — FIBA 표준 종이 기록지 시각 박제 (시안 신규)**
> 작업 일자: 2026-05-14
> 베이스: v2.4 (Phase A.6 — 5 페이지 운영 정합) + ScoreSheet 5 파일 추가
> 동기화: 2026-05-14 — zip "BDR v2 (1).zip" 의 `Dev/design/BDR v2.5/` 통째로 BDR-current/ 카피

---

## 1. 변경 범위 (v2.4 → v2.5)

신규 ScoreSheet 시안 5 파일 — `(score-sheet)` route group (AppNav 미포함, 인쇄 전용) 의 FIBA 표준 종이 기록지 시각 박제. 비즈니스 로직 / API / 모달 X. 운영 `src/app/(score-sheet)/` 와 짝을 이루는 시각 정합 source.

## 2. 변경 파일 (5 건 추가)

| # | 파일 | 줄수 | 변경 내용 |
|---|------|------|---------|
| 1 | `screens/ScoreSheet.jsx` | 82 | 메인 래퍼 — toolbar (페이퍼/상세 모드 토글 + 인쇄 + 경기 종료) + A4 portrait paper |
| 2 | `screens/ScoreSheet.parts.jsx` | 224 | SSHeader / SSNames / SSMeta / SSTimeoutCells / SSTeamFoulRow / SSTeamBoxHead / SSPlayerHead / SSPlayerRow / SSTeamBox |
| 3 | `screens/ScoreSheet.bottom.jsx` | 268 | SSRunningScore (mode='paper' A\|B·8 / mode='detail' 16 cols) / SSOfficials / SSBottomLeftSigs / SSPeriodScores |
| 4 | `screens/ScoreSheet.data.jsx` | 71 | mock 데이터 (양팀 12명 명단 / coach·asst / timeouts / teamFouls / periodScores Q1~Q4·extra) |
| 5 | `scoresheet.css` | 899 | `.ss-*` 클래스 전 영역 시각 박제 (A4 portrait pixel-perfect + 인쇄 전용 미디어 쿼리) |

## 3. 핵심 UX

- **모드 토글** — toolbar 의 두 모드:
  - `paper` (페이퍼 정합 A\|B · 8) — 양팀 점수 grid 만 표시. 종이 양식과 1:1 매칭.
  - `detail` (상세 마킹 16) — FIBA 표준 4 sub-column (`마킹A | 점수A | 점수B | 마킹B`) × 4 세트 = 16 cols.
- **점수 표기** — FIBA 정합: 1점 `·` / 2점 `●` / 3점 `●+○`
- **양팀 명단 12명** — licenceNo / name / no / playerIn (쿼터) / fouls (5 슬롯 P/T 마킹)
- **인쇄 (window.print)** — A4 portrait. `_phase17/` 의 인쇄 미디어 쿼리 보강.
- **경기 종료** — 단순 버튼 (시안에서는 작동 X — 운영의 match-end-button.tsx 가 실제 로직)

## 4. 운영 ↔ 시안 갭 (CLAUDE.md §🔄)

운영 `src/app/(score-sheet)/` 가 시안보다 앞서 있음 (Phase 1~18 완료):
- ✅ 운영 박제 / 시안 일치: fiba-header / team-section / running-score-grid (Phase 18 동일) / footer-signatures / period-scores-section
- ⚠️ 시안에 누락 (운영에는 있음): foul-type-modal / player-select-modal / lineup-selection-modal / quarter-end-modal / rotation-guard / period-color-legend (Phase 17 쿼터별 색)
- ⚠️ 운영에 누락 (시안에는 있음): 페이퍼/상세 모드 토글 / scoresheet.css 시각 디테일 (~600줄 갭 vs 운영 _print.css 301줄)

→ 후속 작업 (별도 폴더 `Dev/scoresheet-2026-05-14/`):
- Phase A.7 (역동기화) — 시안에 운영 모달 5종 박제 의뢰 (Claude.ai Project)
- Phase 19 (시안 → 운영 박제) — CSS 시각 디테일 + 페이퍼 모드 토글 운영 박제 (CLI)

## 5. 사용자 결정 §1~§8 보존

본 동기화는 ScoreSheet 5 파일 추가만 — §1~§8 (AppNav frozen / 더보기 5그룹 IA / 다크모드 brutalism / 720px 분기 등) 모두 v2.4 그대로 보존.

## 6. AppNav Frozen 7 룰 준수

ScoreSheet 는 `(score-sheet)` route group 으로 AppNav 미포함. 컴포넌트 `_phase17/` 영향 0. AppNav 7 룰 전체 보존.

## 7. 13 룰 준수 (06-self-checklist.md)

- ✅ §10 색상 — `.ss-*` 클래스의 모든 색상이 `var(--ss-paper-line)` 등 토큰. 핑크/살몬/코랄 0건.
- ✅ §11 아이콘 — Material Symbols Outlined (`arrow_back / print / flag`) + 점수 표기 유니코드 (`· ● ○`). lucide-react 0건.
- ✅ §12 라운딩 — A4 paper 외곽 직각 2px solid (FIBA 종이 정합) — pill 0건.
- ✅ §13 모바일 — 인쇄 전용이라 모바일 분기 별도 적용 (rotation-guard 는 운영 src/ 에).

## 8. _archive

이전 BDR-current/ (v2.4 베이스) 는 `_archive/BDR-current-2026-05-14-pre-scoresheet-sync/` 로 백업됨 (138 파일).

## 9. 폴더 구조 (현재)

```
Dev/design/BDR-current/
├── README.md                         (본 파일)
├── tokens.css / responsive.css / bottom-nav.css 등  (v2.4 카피)
├── components.jsx / components-global.jsx / data.jsx 등  (v2.4 카피)
├── MyBDR.html / _mobile_audit.html 등  (v2.4 카피)
├── scoresheet.css                    ⭐ Phase 23 신규 (899 lines)
└── screens/
    ├── (v2.4 의 모든 86 파일)
    ├── ScoreSheet.jsx                ⭐ Phase 23 신규
    ├── ScoreSheet.parts.jsx          ⭐ Phase 23 신규
    ├── ScoreSheet.bottom.jsx         ⭐ Phase 23 신규
    └── ScoreSheet.data.jsx           ⭐ Phase 23 신규
```
