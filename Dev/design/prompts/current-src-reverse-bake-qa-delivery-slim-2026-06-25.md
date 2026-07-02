# Claude.ai 전달 패키지 — 운영 src 역박제 QA slim

> 큰 src 전체 zip 업로드 실패 시 사용하는 경량 버전.

---

## 첨부

| 첨부 | 경로 | 설명 |
|---|---|---|
| 상세 의뢰서 | `Dev/design/prompts/current-src-reverse-bake-qa-brief-2026-06-25.md` | 역박제 QA 원칙 |
| slim manifest | `Dev/design/prompts/current-src-reverse-bake-slim-manifest-2026-06-25.md` | 변경 축/파일 목록 |
| slim zip | `Dev/design/_zips/BDR-reverse-QA-slim-context-2026-06-25.zip` | 의뢰서+manifest+디자인 핵심 규칙 |

---

## paste 본문

```text
BDR 운영 src 최신 화면 전수 점검 + BDR-current 역박제 QA를 slim 방식으로 의뢰합니다.

큰 src 전체 zip은 업로드가 되지 않아, 이번에는 경량 manifest 기반으로 진행합니다.
첨부한 manifest에는 BDR-current 마지막 역박제 이후 운영 UI/UX 변경 축과 주요 변경 파일 목록이 들어 있습니다.

첨부:
1) current-src-reverse-bake-qa-brief-2026-06-25.md
2) current-src-reverse-bake-slim-manifest-2026-06-25.md
3) BDR-reverse-QA-slim-context-2026-06-25.zip

진행 방식:
1. manifest 기준으로 운영 src 변경 축을 먼저 인벤토리화해 주세요.
2. BDR-current에 없거나 오래됐을 가능성이 높은 역박제 갭을 P0/P1/P2로 분류해 주세요.
3. 원본 소스 확인이 꼭 필요한 파일만 _qa/source-request-list.md에 우선순위로 요청해 주세요.
4. 지금 가능한 범위에서 _qa/current-src-inventory.md와 _qa/reverse-bake-gap.md 초안을 작성해 주세요.
5. 일관성 QA는 역박제 갭 우선순위가 잡힌 뒤 진행하는 것으로 분리해 주세요.

필수 산출:
- _qa/current-src-inventory.md
- _qa/reverse-bake-gap.md
- _qa/source-request-list.md

보존/금지:
- AppNav frozen 구조 변경 금지
- 사용자 결정 §1~§8 변경 금지
- 운영 API/Prisma/라우트 변경 금지
- 시안이 운영 src를 직접 수정하지 말 것
- DB 미보유 기능을 실제 기능처럼 추가하지 말 것
- 하드코딩 hex, lucide-react, pill 9999px, 핑크/살몬/코랄 계열은 위반으로 기록
- Material Symbols Outlined 기준 유지
- 720px 모바일 분기, iOS input 16px, 터치 44px 기준 유지

회신 zip을 받으면 Codex가 source-request-list 기준으로 필요한 파일만 추가 첨부하거나, 역박제 batch를 바로 나누겠습니다.
```

