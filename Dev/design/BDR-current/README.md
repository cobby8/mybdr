# BDR v2.5 — Phase 23 (ScoreSheet FIBA-paper 정합) — rev2

> **Phase 23 rev2 — FIBA 종이 100% 시각 박제 + 단일 모드 + 토큰 단순화**
> 작업 일자: 2026-05-14 (rev2)
> 베이스: v2.4 (Phase A.6) + Phase 23 ScoreSheet (rev2 갱신)
> 동기화: 2026-05-14 — zip "BDR v2 (2).zip" 의 `Dev/design/BDR v2.5/` 통째로 BDR-current/ 카피

---

## 1. rev1 → rev2 핵심 변경 4가지

사용자가 디자인 fine-tuning 끝에 결정한 4가지 방향 전환:

| # | 영역 | rev1 (zip v1) | rev2 (zip v2) | 이유 |
|---|---|---|---|---|
| 1 | **모드 토글** | 페이퍼/상세 toolbar 토글 | **토글 자체 제거** | 단일 모드가 더 깔끔 + 운영 복잡도 ↓ |
| 2 | **RunningScore 컬럼** | mode='paper' 8열 / mode='detail' 16열 분기 | **항상 16열** (헤더만 8셀 — A\|B 가 span 2) | 종이 정합 + 디지털 마킹 동시 만족 |
| 3 | **CSS 토큰** | `--ss-paper-*` 15종 | `--pap-*` 5종 (`--pap-bg / --pap-ink / --pap-line / --pap-hair / --pap-fill / --pap-bonus`) | 토큰 단순화 |
| 4 | **로고 텍스트** | `BDR / SCORE` | `BDR / We Play Basketball` | 브랜드 tag 추가 |

또한:
- ✅ `ScoreSheet.html` 신규 (44줄) — 독립 미리보기 컨테이너 (운영 빌드 무관)
- ✅ `screens/Profile.jsx` 신규 (125줄) — Profile 작업 (스코어시트와 무관, 별도)
- ✅ `screenshots/` 7장 신규 (`scoresheet-paper / paper-v2 / detail / fiba-v3 / fix-v4 / fix-v5 / fix-v6`) — 작업 과정 추적

---

## 2. ScoreSheet 5 파일 줄수 변화 (rev1 → rev2)

| 파일 | rev1 | rev2 | 차이 | 변경 핵심 |
|---|---|---|---|---|
| `scoresheet.css` | 899 | 816 | **-83** | 토큰 15종 → 5종 단순화 |
| `screens/ScoreSheet.jsx` | 82 | 73 | **-9** | toolbar 토글 UI 제거 |
| `screens/ScoreSheet.parts.jsx` | 224 | 231 | **+7** | `.pap-lbl` / `.pap-u` 클래스 + 로고 변경 |
| `screens/ScoreSheet.bottom.jsx` | 268 | 205 | **-63** | mode 분기 제거 → 단일 16열 |
| `screens/ScoreSheet.data.jsx` | 71 | 71 | 0 | (변경 없음) |

---

## 3. 운영 영향 (CLI 박제 PR-S1~S5 와의 충돌)

### CLI 이미 박제 (commit 6개)
```
ef54e7a PR-S1 — 토큰 (--ss-paper-*)        ← rev2 에서 --pap-* 로 rename 필요
4416a91 PR-S2 — toolbar (페이퍼/상세 토글)  ← rev2 에서 토글 제거 (롤백)
1a37981 PR-S3 — mode prop wiring           ← rev2 에서 mode 자체 제거 (롤백)
1388eae PR-S4 — FibaHeader (.ss-h)         ← rev2 에서 .pap-lbl/.pap-u 도입
fe022c6 PR-S5 — PeriodScoresSection        ← 영향 없음
4e0a43d PR-S2 후속 — BFF 방어               ← 영향 없음
```

### rev2 적용 시 운영 작업 (사용자 결정 = 완전 롤백 + 시안 정합)
- **PR-S6 (롤백 + 단일화)** — toolbar 토글 제거 / mode prop 제거 / 항상 16열
- **PR-S7 (토큰 rename)** — `--ss-paper-*` → `--pap-*` (5종으로 압축)
- **PR-S8 (FibaHeader rev2)** — 로고 텍스트 변경 + `.pap-lbl/.pap-u` 클래스 적용

→ 자세한 CLI 박제 프롬프트는 `Dev/scoresheet-2026-05-14/04-cli-prompt-phase-19-rev2.md`

---

## 4. 사용자 결정 §1~§8 보존

본 동기화는 ScoreSheet 영역 변경 + Profile.jsx 신규만 — §1~§8 (AppNav frozen / 더보기 5그룹 IA / 다크모드 brutalism / 720px 분기 등) 모두 v2.4 그대로 보존.

## 5. AppNav Frozen 7 룰 준수

ScoreSheet 는 `(score-sheet)` route group 으로 AppNav 미포함. 컴포넌트 `_phase17/` 영향 0. AppNav 7 룰 전체 보존.

## 6. 13 룰 준수 (06-self-checklist.md)

- ✅ §10 색상 — `.pap-*` 토큰만 사용. `--pap-bonus` 의 `#E31B23` (BDR Red) = action 강조 예외 (toolbar 의 "경기 종료" 위험 버튼).
- ✅ §11 아이콘 — Material Symbols Outlined + 점수 표기 유니코드 (`· ● ◎`). lucide-react 0건.
- ✅ §12 라운딩 — A4 paper 외곽 직각 2px solid (FIBA 종이 정합) — pill 0건.
- ✅ §13 모바일 — 인쇄 전용 (rotation-guard 는 운영 src/ 에).

## 7. _archive

이전 BDR-current/ (rev1 베이스) 는 `_archive/BDR-current-2026-05-14-pre-v2.5-rev2/` 로 백업됨.

## 8. 폴더 구조 (현재)

```
Dev/design/BDR-current/
├── README.md                         (본 파일 — rev2)
├── tokens.css / responsive.css 등    (v2.4 카피)
├── components.jsx / components-global.jsx / data.jsx 등  (v2.4 카피)
├── MyBDR.html                        (v2.4 카피)
├── ScoreSheet.html                   ⭐ rev2 신규 (독립 미리보기 컨테이너 44줄)
├── scoresheet.css                    (rev2 갱신 — 816줄, 토큰 단순화)
├── _mobile_audit.html 등             (v2.4 카피)
└── screens/
    ├── (v2.4 의 모든 86 파일)
    ├── ScoreSheet.jsx                (rev2 — toolbar 토글 제거 73줄)
    ├── ScoreSheet.parts.jsx          (rev2 — .pap-* 클래스 + 로고 231줄)
    ├── ScoreSheet.bottom.jsx         (rev2 — mode 분기 제거, 단일 16열 205줄)
    ├── ScoreSheet.data.jsx           (rev1 와 동일 71줄)
    └── Profile.jsx                   ⭐ rev2 신규 (Profile 작업, 스코어시트 무관 125줄)
```
