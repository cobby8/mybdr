# Claude.ai 전달 패키지 — 디자인 일관성 QA 패스 v2.40 기준

> 작성 2026-06-23. 기존 2026-06-15 패키지를 v2.40/릴리스 완료 상태로 갱신.
> 본 패키지는 Claude.ai에 그대로 붙여 넣는 용도입니다.

---

## 첨부

| 첨부 | 경로 | 설명 |
|---|---|---|
| 의뢰서 | `Dev/design/prompts/design-consistency-qa-brief-2026-06-23.md` | 8축 점검/산출물/보존 룰 |
| baseline zip | `Dev/design/_zips/BDR-current-v2.40-QA-baseline-2026-06-23.zip` | 현재 `BDR-current/` 전체 압축본 |

zip에는 v2.40 관리자 콘솔 handoff, Toss P0, 매칭 M2~M5, 기존 tournament/detail/completed 시안이 함께 들어 있어야 합니다.

---

## paste 본문

```text
BDR 디자인 일관성 QA 패스 v2.40 기준으로 의뢰합니다.

첨부 2건:
1) design-consistency-qa-brief-2026-06-23.md
2) BDR-current-v2.40-QA-baseline-2026-06-23.zip

현재 기준:
- 운영 정합 완료: dev == main == fc72e9c
- 활성 시안 기준: Dev/design/BDR-current/
- 포함 handoff: v2.40 Admin Console, Toss P0, 매칭 M2~M5, 대회 상세/종료, 라인업/records 계열

요지:
- 신규 화면 제작이 아니라 기존 활성 시안 전체의 토큰/패턴/간격 정합 QA입니다.
- 카드/칩/버튼/empty/모달/Hero/표/필터바 표준형을 한 벌로 수렴해 주세요.
- 폐기 토큰, 하드코딩 hex, lucide/임의 SVG, pill 9999px, 모바일 720/16px/44px 위반을 찾아 주세요.
- 결과는 _qa/consistency-audit.md + _qa/bake-fix-checklist.md 중심으로 주세요.

보존 필수:
- AppNav frozen 변경 금지
- 사용자 결정 §1~§8 변경 금지
- 운영 API/Prisma/라우트 변경 금지
- 시안이 운영 src를 직접 수정하지 말고 CLI 적용용 체크리스트로 넘겨 주세요.

완료 후 회신 zip을 주시면 Cowork/Codex가 sync 후 bake-fix-checklist를 CLI 작업으로 분할 적용하고 tsc/회귀 검증으로 닫겠습니다.
```

---

## 회신 zip 도착 후 Codex 처리

| 단계 | 처리 |
|---|---|
| 1 | zip을 `Dev/design/_zips/` 보존 |
| 2 | `_qa/consistency-audit.md`, `_qa/bake-fix-checklist.md` 존재 확인 |
| 3 | BDR-current sync 여부 판단. AppNav/사용자결정 위반 시 reject |
| 4 | bake checklist를 축별 CLI 작업으로 분할 |
| 5 | 각 batch마다 `cmd /c npx tsc --noEmit` + 시각 회귀 표본 확인 |

