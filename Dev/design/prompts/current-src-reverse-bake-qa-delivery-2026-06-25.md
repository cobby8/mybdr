# Claude.ai 전달 패키지 — 운영 src 전수 점검 + BDR-current 역박제 QA

> 작성 2026-06-25. 기존 v2.40 일관성 QA 의뢰를 대체하는 최신 운영 기준 의뢰입니다.

---

## 첨부

| 첨부 | 경로 | 설명 |
|---|---|---|
| 상세 의뢰서 | `Dev/design/prompts/current-src-reverse-bake-qa-brief-2026-06-25.md` | 전수 점검/역박제/QA 순서 |
| 기준 zip | `Dev/design/_zips/BDR-current-plus-src-reverse-QA-2026-06-25.zip` | 운영 src + BDR-current + 디자인 지식 |

---

## paste 본문

```text
BDR 운영 src 최신 화면 전수 점검 + BDR-current 역박제 QA를 의뢰합니다.

이번 작업은 단순 디자인 일관성 QA가 아닙니다.
현재 운영 src/ 화면이 BDR-current 시안보다 많이 앞서 있으므로, 먼저 운영 코드 기준 전체 화면을 전수 조사하고, BDR-current에 빠진 최신 운영 변경을 역박제 대상으로 식별해 주세요.

첨부 2건:
1) current-src-reverse-bake-qa-brief-2026-06-25.md
2) BDR-current-plus-src-reverse-QA-2026-06-25.zip

목표:
1. 운영 src/app/(web), src/app/(admin), src/components 기준 현재 실제 화면/컴포넌트 전수 인벤토리 작성
2. Dev/design/BDR-current와 비교해 stale/missing/outdated 시안 식별
3. 최신 운영 화면을 기준으로 BDR-current에 역박제해야 할 항목 분류
4. 그 다음 디자인 일관성 QA를 수행해 토큰/패턴/간격/컴포넌트 정합 체크리스트 작성

현재 확인된 최신 운영 변경 축:
- 대회 운영자 워크스페이스 재구성 및 레이아웃 안정화
- 대회 생성/관리의 종별 일정, 경기장, 유니폼 규정, 자동 조편성 흐름
- 카카오 장소 검색, 경기장 길안내, 공개 일정 fallback directions
- 기록앱 영향 분석 관리자 UI 및 감사 로그 연결
- 심판/경기원 라벨 정리
- 엘리트 선수 배지 및 프로필/유저 히어로 표시
- 멤버십/구독 권한 표시 정합

전수 대상:
- src/app/(web) 전체 page.tsx, 주요 _components, _v2 컴포넌트, CSS
- src/app/(admin)/admin 전체
- src/app/(admin)/tournament-admin 전체
- src/components/admin, src/components/bdr-v2, src/components/shared, src/components/tournament
- Dev/design/BDR-current 전체

산출물:
1. _qa/current-src-inventory.md
   - 운영 src 기준 실제 페이지/컴포넌트 목록
   - 라우트, 화면 목적, 최신 변경 여부, BDR-current 대응 파일 여부

2. _qa/reverse-bake-gap.md
   - 운영 src에는 있는데 BDR-current에 없거나 오래된 항목
   - 화면/컴포넌트/변경 요지/우선순위/P0~P2
   - 역박제 필요 여부

3. _qa/consistency-audit.md
   - 역박제 후 기준으로 토큰/컴포넌트/간격/라운딩/타이포/아이콘/모바일 정합 점검

4. _qa/bake-fix-checklist.md
   - CLI가 실제 반영할 수 있는 파일별 작업 목록
   - 자동 치환 가능 항목과 수동 수정 항목 분리

중요한 진행 순서:
1. 먼저 운영 src 전수 인벤토리
2. BDR-current와 비교해 역박제 갭 산출
3. 역박제 우선순위 제안
4. 그 다음 일관성 QA
5. 최종적으로 CLI 적용용 체크리스트 산출

보존/금지:
- AppNav frozen 구조 변경 금지
- 사용자 결정 §1~§8 변경 금지
- 운영 API/Prisma/라우트 변경 금지
- 시안이 운영 src를 직접 수정하지 말 것
- DB 미보유 기능을 실제 기능처럼 추가하지 말 것
- 하드코딩 hex, lucide-react, pill 9999px, 핑크/살몬/코랄 계열은 위반으로 기록
- Material Symbols Outlined 기준 유지
- 720px 모바일 분기, iOS input 16px, 터치 44px 기준 유지

완료 후 zip에는 최소 아래 파일을 포함해 주세요:
- _qa/current-src-inventory.md
- _qa/reverse-bake-gap.md
- _qa/consistency-audit.md
- _qa/bake-fix-checklist.md

회신 zip을 받으면 Codex가 역박제 항목을 batch로 나눠 적용하고, 각 batch마다 tsc --noEmit 및 회귀 검증으로 닫겠습니다.
```

