# Claude.ai 추가 첨부 — B1 TournamentWorkspace 원본 패키지

> 목적: slim QA 산출물의 `source-request-list.md` 1순위(B1 워크스페이스) 대응.

---

## PM 결정

v2.40 통합 Admin Console의 Toss 별개 시스템은 장기 유지하지 않습니다.

| 항목 | 결정 |
|---|---|
| 방향 | **BDR 13룰로 단계적 리스킨** |
| 이유 | 운영자/사용자/관리자 화면이 같은 제품군으로 보여야 하며, README에도 BDR 리스킨 예정으로 기록됨 |
| 적용 순서 | P0 역박제 우선 → 콘솔 리스킨은 별도 batch |
| 현재 판정 | Toss 시스템은 “미결 예외”가 아니라 “리스킨 예정 부채(P1/P2)”로 기록 |

---

## 첨부

| 첨부 | 경로 |
|---|---|
| B1 원본 zip | `Dev/design/_zips/BDR-source-B1-tournament-workspace-2026-06-26.zip` |

---

## paste 본문

```text
BDR 역박제 QA source-request 1순위 — B1 TournamentWorkspace 원본을 첨부합니다.

PM 결정:
- v2.40 통합 Admin Console의 Toss 별개 시스템은 장기 유지하지 않습니다.
- 방향은 BDR 13룰 기반 단계적 리스킨입니다.
- 단, 지금은 P0 역박제(운영 src 최신 흐름 반영)를 먼저 하고, 콘솔 리스킨은 별도 batch로 분리해 주세요.
- 따라서 Toss 시스템은 “리스킨 예정 부채(P1/P2)”로 기록하고, P0 산출물과 섞지 말아 주세요.

첨부:
- BDR-source-B1-tournament-workspace-2026-06-26.zip

요청:
1. B1 통합 TournamentWorkspace + 7 panels 원본을 기준으로 `_qa/current-src-inventory.md`의 B1 항목을 코드 실측본으로 갱신해 주세요.
2. `BDR-current`의 구 AdminTournamentSetupHub/개별 화면 구조와 비교해 `_qa/reverse-bake-gap.md`의 P0 B1 항목을 구체화해 주세요.
3. CLI 박제용으로 `_qa/bake-fix-checklist-B1.md`를 작성해 주세요.
4. 신규 기능/API/Prisma/라우트 제안은 하지 말고, 운영 src에 이미 있는 화면 구조를 BDR-current에 역박제하는 범위로 제한해 주세요.

보존:
- AppNav frozen
- 사용자 결정 §1~§8
- Material Symbols / BDR tokens / 720px / input 16px / touch 44px
```

