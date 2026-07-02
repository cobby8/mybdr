# BDR 의뢰 — 운영 src 전수 점검 + BDR-current 역박제 QA

> Claude.ai (BDR 디자인 Project) 전달용. 작성 2026-06-25.
> 이번 작업은 단순 디자인 일관성 QA가 아니라 **운영 최신 화면 기준 역박제 갭 조사 → 일관성 QA**입니다.

---

## 0. 한 줄 요지

현재 운영 `src/` 화면이 `Dev/design/BDR-current/`보다 많이 앞서 있습니다.
따라서 BDR-current를 기준으로 QA하지 말고, 먼저 운영 src 전체를 전수 조사해 BDR-current에 빠진 최신 화면/컴포넌트를 역박제 대상으로 식별해 주세요.

---

## 1. 첨부 기준

| 첨부 | 설명 |
|---|---|
| `BDR-current-plus-src-reverse-QA-2026-06-25.zip` | 운영 `src/` 주요 UI 파일 + `Dev/design/BDR-current/` + 디자인 프로젝트 지식 |
| 본 의뢰서 | 조사 순서, 산출물, 금지 사항 |

zip 안에는 최소 다음 경로가 들어 있습니다.

- `src/app/(web)/`
- `src/app/(admin)/`
- `src/components/`
- `src/lib/`
- `prisma/schema.prisma`
- `Dev/design/BDR-current/`
- `Dev/design/claude-project-knowledge/`
- `AGENTS.md`

---

## 2. 현재 확인된 운영 변경 축

| 축 | 예시 |
|---|---|
| 대회 운영자 워크스페이스 | `TournamentWorkspace`, setup panels, matches/bracket/admins/recorders/site panels |
| 대회 생성/관리 | 종별 일정/경기장, 유니폼 규정, 자동 조편성, 대진 준비 현황 |
| 장소/길안내 | Kakao 장소 검색, 경기장 길안내 링크, 공개 일정 fallback directions |
| 기록앱 영향 관리자 UI | `/admin/agents`, impact panel, audit logs, PM report copy |
| 심판/경기원 라벨 | `referee`/`game_official`, KBA/FIBA 등급 라벨, association wizard 카피 |
| 유저/프로필 | 엘리트 선수 배지, profile/user hero 표시 |
| 멤버십/구독 | pricing/profile/admin users/plans의 권한/구독 표시 |

이 목록은 힌트입니다. 반드시 첨부된 `src/`를 기준으로 전수 확인해 주세요.

---

## 3. 진행 순서

1. 운영 `src/app/(web)` 전체 라우트와 주요 컴포넌트 인벤토리.
2. 운영 `src/app/(admin)/admin` 전체 라우트와 주요 컴포넌트 인벤토리.
3. 운영 `src/app/(admin)/tournament-admin` 전체 라우트와 주요 컴포넌트 인벤토리.
4. `src/components` 공유 UI 인벤토리.
5. `Dev/design/BDR-current` 대응 파일 존재 여부 비교.
6. stale/missing/outdated 항목을 역박제 갭으로 분류.
7. 역박제 우선순위 제안.
8. 역박제 후 기준으로 디자인 일관성 QA 수행.
9. CLI 적용용 체크리스트 산출.

---

## 4. 산출물

| 산출물 | 내용 |
|---|---|
| `_qa/current-src-inventory.md` | 운영 src 기준 실제 페이지/컴포넌트 목록. 라우트, 목적, 최신 변경 여부, BDR-current 대응 여부 |
| `_qa/reverse-bake-gap.md` | 운영에는 있는데 BDR-current에 없거나 오래된 항목. 화면/컴포넌트/변경 요지/우선순위/P0~P2 |
| `_qa/consistency-audit.md` | 역박제 갭 고려 후 토큰/컴포넌트/간격/라운딩/타이포/아이콘/모바일 정합 점검 |
| `_qa/bake-fix-checklist.md` | CLI가 실제 적용할 파일별 작업 목록. 자동 치환 가능/수동 수정 분리 |

---

## 5. 우선순위 기준

| 우선순위 | 기준 |
|---|---|
| P0 | 운영에 이미 노출된 새 화면/핵심 흐름이 BDR-current에 없음 |
| P1 | 운영과 시안이 크게 달라 다음 디자인 작업의 baseline을 왜곡함 |
| P2 | 카피/라벨/토큰/간격 등 시각 정합 부채 |

P0/P1을 먼저 역박제 대상으로 묶고, P2는 일관성 QA batch로 분리해 주세요.

---

## 6. 보존 / 금지

- AppNav frozen 구조 변경 금지.
- 사용자 결정 §1~§8 변경 금지.
- 운영 API/Prisma/라우트 변경 금지.
- 시안이 운영 `src/`를 직접 수정하지 말고 CLI 적용용 체크리스트로 넘길 것.
- DB 미보유 기능을 실제 기능처럼 추가하지 말 것.
- 하드코딩 hex, lucide-react, pill 9999px, 핑크/살몬/코랄 계열은 위반으로 기록.
- Material Symbols Outlined 기준 유지.
- 720px 모바일 분기, iOS input 16px, 터치 44px 기준 유지.

---

## 7. 완료 조건

회신 zip에는 최소 아래 4개 파일이 있어야 합니다.

- `_qa/current-src-inventory.md`
- `_qa/reverse-bake-gap.md`
- `_qa/consistency-audit.md`
- `_qa/bake-fix-checklist.md`

회신 zip을 받으면 Codex가 역박제 항목을 batch로 나눠 적용하고, 각 batch마다 `cmd /c npx tsc --noEmit` 및 회귀 검증으로 닫습니다.
