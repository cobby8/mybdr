# CLEANUP-MANIFEST.md — 구버전 레이어 삭제/교체 기준 (v2.42)

> 목적: 운영 코드에 섞인 과거 계층을 Codex CLI가 **무엇을 남기고 무엇을 지울지** 판단하도록 명시.
> 원칙: 대회 운영 화면은 **Toss(v2.41/42) 단일 계층**만 남긴다. 하이브리드 fallback·구버전 병존 금지.

판정: 🟥 삭제 · 🟧 교체(Toss로 대체) · 🟩 유지 · 🟦 조건부

---

## 1. 레이어별 처분

| 레이어 | 처분 | 근거 / 교체 대상 |
|---|---|---|
| **v2.41 Toss** (`ts-/ct-/amt-/sc-/bk-/op-/tw-`) | 🟩 유지 | canonical. 본 시안 기준 |
| **v2.40 `au-*`** (통합 콘솔 계층) | 🟧 교체 | 대회 운영 화면에선 Toss 패널로 대체. 전관리자 재구현(P2) 때 일괄 정리 |
| **기존 `admin-*`** (과거 카드/버튼/표) | 🟥 삭제 | `ts-card`/`Btn`/`amt-table`로 완전 대체. 대회 운영에서 잔존 금지 |
| **`tw-*`** (workspace 변형) | 🟦 조건부 | `tw-shell`만 유지(셸 컨테이너). 그 외 운영에서 변형된 `tw-*`는 시안 원본으로 재정렬 |
| **`ta-*`** (임시 보정 계층) | 🟥 삭제 | 최종 시안에 `ta-*` 없음. 운영의 `ta-*`는 Toss 클래스로 흡수 |
| **`components/ui`** (타 kit) | 🟧 교체 | `toss-kit.jsx`(Btn/Badge/Modal/Icon/Toggle/Check/StepDots/Empty)로 대체 |
| **Material Symbols** (관리자 영역) | 🟥 삭제 | 관리자는 **lucide(`Icon`)** 로 교체. (공개 사이트 영역은 🟩 유지 — BDR 룰) |

---

## 2. 시안 내부 정리 (박제 전 제거)

| 항목 | 처분 | 사유 |
|---|---|---|
| `panels-core.jsx` 의 `BracketPanel`(간이판) | 🟥 삭제 | `bracket.jsx`의 full `BracketPanel`이 동일 `window.BracketPanel`을 **덮어씀**. 로드 순서상 bracket.jsx가 이김 → 간이판은 dead code. 박제 시 **bracket.jsx만 채택** |
| `panels-core.jsx` 의 `DivisionsPanel` | 🟦 조건부 | 종별 편성 UI. 운영에서 종별 설정을 대회 수정/생성에 둘지, 운영 패널에 둘지 확정 후 한 곳만 유지 |
| `site-data.jsx` / `site-pages.jsx` / `토너먼트 사이트.html`(38팀) | 🟧 교체 | 공개 사이트 구버전. v2.42 통일본 `public-site-*`(44팀)로 대체 (PUBLIC-SITE-DATA-MAP.md §7) |

---

## 3. 아이콘 교체 매핑 (Material Symbols → lucide)

관리자 영역에서 발견되는 Material Symbols는 아래 lucide 이름으로 교체:

| 의미 | lucide(`Icon name`) |
|---|---|
| 참가팀 | `users` |
| 대진 | `git-merge` |
| 일정 | `calendar-clock` / `calendar-days` |
| 운영/권한 | `shield-check` / `shield` |
| 사이트 | `globe` |
| 정산 | `wallet` |
| 심판 | `flag` |
| 기록원 | `pencil` / `edit-3` |
| 검색 | `search` · 위치 `map-pin` · 추가 `plus` · 삭제 `trash-2`/`x` · 복사 `copy` |

> 운영의 `material-symbols` 폰트 링크/클래스(`material-symbols-outlined`)는 관리자 번들에서 제거. 공개 사이트 번들에는 유지.

---

## 4. 삭제 안전 체크 (회귀 방지)

박제 시 각 레이어 제거 전 확인:
- [ ] 제거할 `admin-*`/`ta-*`/`au-*` 클래스를 **참조하는 컴포넌트가 Toss 패널로 교체 완료**됐는지
- [ ] `components/ui` import 제거 후 동일 역할 `toss-kit` import로 1:1 교체됐는지
- [ ] Material Symbols 제거 후 깨진 아이콘(빈 네모) 없는지 — lucide 매핑 누락 점검
- [ ] `BracketPanel` 중복 정의 제거 후 대진 패널이 full 버전(조편성/시드/트리/듀얼/발행) 전체 기능 유지하는지
- [ ] 구 공개 사이트(38팀) 라우트가 v2.42 통일본으로 대체됐는지

---

## 5. 처분 요약 (한눈)

```
유지   : ts-/ct-/amt-/sc-/bk-/op-/tw-shell · toss-kit · lucide · 공개사이트 Material Symbols
교체   : au-* → Toss패널 · components/ui → toss-kit · 공개사이트 38팀 → 44팀 통일본
삭제   : admin-* · ta-* · 관리자 Material Symbols · panels-core BracketPanel(간이)
조건부 : tw-*(shell만) · DivisionsPanel(위치 확정 후 단일화)
```
