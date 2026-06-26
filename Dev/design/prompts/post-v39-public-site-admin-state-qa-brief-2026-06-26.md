# BDR v2.42 Follow-up Design Brief - Public Site Data Sync + Admin Toss State QA

> 전달 대상: Claude.ai BDR 디자인 프로젝트
> 작성일: 2026-06-26
> 현재 기준: `dev == main == a141a96`
> 최신 패키지 확인: `BDR v2 (39).zip`

## 0. 요약

이번 의뢰는 새 기능을 크게 늘리는 작업이 아니라, v2.41 관리자 Toss 시안이 안정적으로 운영에 정착되도록 남은 데이터/상태 갭을 닫는 후속 시안입니다.

핵심은 2개입니다.

| 우선순위 | 의뢰 | 목적 |
|---|---|---|
| P1 | 공개 대회 사이트와 관리자 데이터 기준 통일 | 관리자에서는 `44팀/27경기`인데 공개 사이트 mock은 `38팀 fiction`으로 분리되어 있어 운영 단일 데이터 흐름 기준을 제안 |
| P2 | 관리자 Toss 전페이지 상태 QA | loading/empty/error/saved/권한없음/모바일 상태가 화면별로 고르게 정의되었는지 점검하고 누락 상태 시안 작성 |

## 1. 현재 확인된 사실

| 항목 | 현재 상태 |
|---|---|
| 관리자 디자인 시스템 | Toss가 공식 관리자 디자인 시스템. lucide, Toss blue, rounded-full, `ts-*`, `ad-*` 허용 |
| 사용자 공개 영역 | BDR 13룰 유지. AppNav frozen 유지. Material Symbols 기준 |
| v39 데이터 보정 | 관리자/운영 mock 기준은 `BDR Summer Open #4 = 44팀 / 27경기` |
| 공개 사이트 mock | v39에서도 별도 fiction baseline. `38팀`, 다른 종별/팀명 사용 |
| 운영 src | API/Prisma/라우트 변경 없이 이미 DB/API 배선 기준. 시안에서는 운영 코드 직접 수정 금지 |

중요: 관리자 패널 UI는 Toss이고, 관리자가 발행한 공개 결과물/공개 사이트는 BDR 사용자 디자인입니다. 두 디자인 시스템을 섞지 마세요.

## 2. 작업 A - 공개 대회 사이트 데이터 통일 시안

### 2-1. 목표

공개 대회 사이트(`src/app/(site)` 계열 및 공개 대회 결과물)가 관리자 워크스페이스의 데이터와 같은 단일 source를 쓰는 것으로 보이도록 UX/IA/상태 흐름을 재정의합니다.

현재 v2.41/v39 기준에서 관리자 워크스페이스는 `44팀/27경기`인데, 공개 사이트는 `38팀 fiction`이라 시안과 운영 설명이 충돌합니다. 이 충돌을 해소할 수 있는 공개 사이트 화면/데이터 맵을 작성하세요.

### 2-2. 포함 범위

| 화면/영역 | 요구 |
|---|---|
| 공개 사이트 홈 | 대회명, 상태, 참가팀 수, 경기 수, 종별, 일정이 관리자 기준과 일치 |
| 공개 사이트 일정 | 관리자 경기표/브래킷에서 발행된 경기만 노출되는 상태 표현 |
| 공개 사이트 팀 | 승인팀 기준 `44팀`을 종별/조별로 표시하는 구조 |
| 공개 사이트 결과 | 종료 전/진행 중/종료 후 상태별로 표시 데이터가 바뀌는 구조 |
| 공개 사이트 미발행 상태 | 관리자가 아직 발행하지 않은 섹션은 숨김 또는 준비중 상태로 명확히 표시 |
| 데이터 출처 맵 | 관리자 입력 -> 저장 API -> 공개 API/site -> 공개 화면의 필드 대응표 |

### 2-3. 상태별 UX

아래 상태를 반드시 분리해 주세요.

| 상태 | 공개 사이트 표시 |
|---|---|
| 모집 전 | 대회 소개/일정 예정 중심, 팀/대진 숨김 |
| 모집 중 | 참가팀 수/정원/마감일 표시, 승인팀만 공개 여부 명시 |
| 대진 생성 전 | 팀 목록은 공개 가능, 대진은 준비중 |
| 대진 생성 후 미발행 | 공개 사이트에는 이전 공개본 유지 또는 준비중 |
| 대진 발행 후 | 27경기 기준 일정/대진 노출 |
| 진행 중 | 실시간/완료/예정 경기 상태 구분 |
| 종료 | 최종 순위, 우승팀, MVP, 스탯/기사 영역은 데이터 보유 여부에 따라 표시 |

### 2-4. 금지

- 운영 API/Prisma/라우트 신설 제안 금지. 필요한 필드는 "연동 필요 필드"로 분리만 합니다.
- 공개 사이트에 mock 데이터를 실제 운영 저장값처럼 보이게 하지 마세요.
- 공개 사이트에 Toss 스타일을 적용하지 마세요. 공개 영역은 BDR 13룰입니다.
- AppNav frozen 구조 변경 금지.

## 3. 작업 B - 관리자 Toss 전페이지 상태 QA

### 3-1. 목표

v2.41 관리자 Toss 리스킨이 실제 운영 화면에서 안정적으로 보이도록 상태 누락을 전수 점검합니다. 이미 리스킨된 화면을 다시 갈아엎는 작업이 아니라, 상태/모바일/권한/에러 시안을 보강하는 작업입니다.

### 3-2. 점검 대상

| 그룹 | 대상 |
|---|---|
| 최고관리자 | `/admin/tournaments`, `/admin/tournaments/[id]`, audit-log, transfer-organizer, users, partners |
| 대회 관리자 | `/tournament-admin`, organizations, series, tournament workspace, 7 panels |
| 생성/수정 플로우 | organization new, series new, tournament creation wizard, schedule/venue, game settings |
| 운영 패널 | teams, divisions, matches, bracket, recorders, site, admins |

### 3-3. 상태 매트릭스

각 화면마다 아래 상태가 있는지 표로 판정하고, 누락 시 보강 시안을 만드세요.

| 상태 | 확인 기준 |
|---|---|
| loading | 서버 데이터 대기 중 skeleton/spinner가 Toss 스타일로 자연스러운가 |
| empty | 데이터 0건일 때 다음 행동 CTA가 명확한가 |
| error | 저장/조회 실패 시 원인과 재시도 행동이 있는가 |
| saving | 버튼 disabled, pending text, 중복 submit 방지가 있는가 |
| saved | 저장 성공 후 toast/badge/dirty reset 표현이 있는가 |
| permission denied | 권한 없음/역할 부족 상태가 과하게 깨지지 않는가 |
| mobile | 360px~720px에서 테이블/폼/모달/토글이 넘치지 않는가 |
| destructive | 삭제/초기화/발행 취소는 확인 모달과 위험 색상이 일관적인가 |

### 3-4. Toss 유지 규칙

관리자 영역은 Toss 스타일이 정답입니다.

| 허용 | 금지 |
|---|---|
| lucide icon, `Icon` wrapper | Material Symbols로 변환 |
| Toss blue `#3182F6` 계열 | BDR red로 관리자 전체 리스킨 |
| `ts-*`, `ad-*`, `ct-*`, `amt-*` | 사용자 공개 BDR 컴포넌트 강제 적용 |
| rounded-full / 24px / 16px / 12px | BDR 4px 규칙으로 관리자 전체 치환 |

단, 관리자가 발행한 공개 사이트 미리보기는 BDR 규칙을 따릅니다.

## 4. 산출물

아래 파일을 패키지에 포함해 주세요.

| 파일 | 내용 |
|---|---|
| `HANDOFF.md` | 변경 요약, PM 결정 필요 항목, 반영 우선순위 |
| `PUBLIC-SITE-DATA-MAP.md` | 관리자 데이터와 공개 사이트 표시 필드 대응표 |
| `ADMIN-TOSS-STATE-QA.md` | 화면별 상태 매트릭스와 누락 보강 제안 |
| `public-site-preview.html` | 공개 사이트 실데이터 통일 시안 진입점 |
| `admin-state-preview.html` | 관리자 Toss 상태 QA/보강 시안 진입점 |
| 필요한 css/js/jsx | 변경 파일만 포함. 전체 src 복사 금지 |

## 5. PM 결정 필요 항목

아래는 질문으로 남기지 말고, 권장안과 대안을 함께 제시해 주세요.

| 결정 | 권장안 |
|---|---|
| 공개 사이트 38팀 fiction 유지 여부 | 폐기. 관리자 `44팀/27경기` 기준으로 통일 |
| 공개 사이트에 발행 전 데이터를 노출할지 | 기본 비노출. 발행된 섹션만 표시 |
| 종료 후 스탯/기사 데이터가 없을 때 | 영역 숨김 또는 "공식 기록 준비중" 상태. mock 기사로 채우지 않음 |
| 관리자 상태 QA 적용 범위 | 대회 관련 화면 우선, 그 다음 최고관리자/조직/시리즈 화면 |

## 6. 첫 응답 형식

아래 형식으로 응답해 주세요.

```text
BDR v2.42 후속 시안 의뢰 확인 - Public Site Data Sync + Admin Toss State QA

이해:
- 관리자 Toss는 공식 관리자 디자인 시스템으로 유지
- 공개 사이트/사용자 영역은 BDR 13룰과 AppNav frozen 유지
- v39 기준 관리자 baseline은 44팀/27경기
- 공개 사이트 38팀 fiction은 통일 후보로 검토
- 운영 API/Prisma/라우트 변경 없이 시안/데이터 맵/상태 QA만 산출

산출:
- PUBLIC-SITE-DATA-MAP.md
- ADMIN-TOSS-STATE-QA.md
- public-site-preview.html
- admin-state-preview.html
- HANDOFF.md

작업 시작.
```

## 7. 완료 전 자체 검수

| 검수 | 기준 |
|---|---|
| 공개 영역 | BDR 13룰, AppNav frozen, Material Symbols, 토큰 사용 |
| 관리자 영역 | Toss 스타일 유지, lucide/Icon wrapper, `ts-*`/`ad-*` 유지 |
| 데이터 | 44팀/27경기 기준 충돌 없음 |
| mock | 운영 저장 완료처럼 보이는 mock 금지 |
| 모바일 | 360px, 720px, desktop에서 주요 화면 확인 |
| 산출물 | 변경 파일만 압축, 전체 src 복사 금지 |
