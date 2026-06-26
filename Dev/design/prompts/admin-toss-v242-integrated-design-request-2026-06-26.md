# Admin Toss v2.42 Integrated Design Request

작성일: 2026-06-26
대상: Claude.ai / BDR 디자인 프로젝트
목적: 관리자 Toss v2.41 시안의 100% 운영 박제를 위한 추가 시안 통합 의뢰
우선순위: 대회 관련 관리자 화면 전체 → 이후 관리자 전페이지 Toss 재구현
추가 반영: `BDR v2 (40).zip`의 `_delta-v2.42-wiring`은 수령됨. 공개 사이트 데이터 기준은 38팀 fiction이 아니라 관리자와 동일한 44팀 / 27경기 / 4종별이다.

## 0. 첫 응답 형식

아래 형식으로 첫 응답해 주세요.

```text
BDR Admin Toss v2.42 통합 보강 시안 의뢰 확인

이해:
- 관리자 영역은 Toss 스타일 공식 유지
- 공개 사용자 영역은 BDR 13룰/AppNav frozen 유지
- 대회 운영 관련 화면을 먼저 100% 정합 대상으로 보강
- 일정/대진/경기/팀/사이트 발행은 UI뿐 아니라 시안에서 구현한 기능 흐름까지 명세
- API/Prisma/라우트 변경 제안 없이 UI 상태, 데이터 계약, 구현 핸드오프만 산출

산출:
- HANDOFF.md
- PARITY-MATRIX.md
- CLEANUP-MANIFEST.md
- TOURNAMENT-OPS-STATES.md
- tournament-ops-preview.html
- schedule-preview.html
- bracket-preview.html
- matches-preview.html
- teams-preview.html
- site-recorders-admins-preview.html
- 필요한 css/js/jsx 의존 파일

작업 시작.
```

## 1. 전제

| 구분 | 결정 |
|---|---|
| 관리자 디자인 시스템 | Toss 공식 채택. `lucide`, `Icon` wrapper, Toss blue, rounded pill/card, `ts-*`, `ct-*`, `amt-*`, `bk-*`, `sc-*` 허용 |
| 공개 사용자 영역 | BDR 13룰 유지. AppNav frozen 유지. Toss 스타일 침범 금지 |
| 공개 사이트 데이터 | v2(40) 델타 기준 적용. 관리자/workspace source에서 파생, 44팀 / 27경기 / 4종별 |
| 실제 공개 라우트 | 운영 소스 기준 `src/app/site-host`, 공개 API는 `src/app/api/web/tournaments/[id]/public-*` |
| 우선 구현 범위 | `/tournament-admin/tournaments/[id]` 대회 운영 화면과 7개 패널 |
| 다음 구현 범위 | `/tournament-admin/*`, `/admin/*` 전 관리자 화면 Toss 재구현 |
| 금지 | API/Prisma/라우트 변경 제안 금지 |
| 금지 | 운영에 없는 데이터를 저장 완료처럼 보이게 하는 mock 금지 |
| 금지 | Toss 관리자 UI를 BDR 스타일로 번역 금지 |
| 금지 | 하이브리드 fallback, 구버전 레이아웃 병존 금지 |

## 2. 현재 문제 인식

운영 구현에는 다음 계층이 섞여 있어 시안과 100% 정합이 되지 않습니다.

| 계층 | 상태 | 요청 |
|---|---|---|
| v2.41 Toss | 최신 기준 | canonical로 유지 |
| v2.40 `au-*` | 기존 통합 콘솔 계층 | 전 관리자 재구현 때 정리 기준 제시 |
| 기존 `admin-*` | 과거 관리자 카드/버튼/표 | 대회 운영 화면에서는 제거 기준 제시 |
| `tw-*` | v2.41 workspace 계열이나 운영에서 변형 | 원본 기준 재정렬 |
| `ta-*` | 최근 보정용 임시 계층 | 최종 시안 기준에서는 제거/흡수 기준 제시 |
| `components/ui` | 일부 패널에 남은 다른 kit | Toss kit 대체 기준 제시 |
| Material Symbols | 공개 영역은 유지, 관리자 영역은 제거 대상 | 관리자 Toss Icon으로 교체 기준 제시 |

이번 의뢰는 단순 화면 보강이 아니라 **Codex CLI가 어떤 레이어를 남기고 어떤 레이어를 삭제해야 하는지 판단할 수 있는 구현 핸드오프**까지 포함해야 합니다.

## 3. Source of Truth

기존 v2.41 패키지를 기준으로 보강해 주세요.

```text
Dev/design/BDR-current/_handoff-admin-toss-v2.41/
├── toss.css
├── workspace.css
├── toss-kit.jsx
├── workspace.jsx
├── panels-core.jsx
├── panels-ops.jsx
├── schedule.jsx
├── bracket.jsx
├── data.jsx
├── DATA-CONSISTENCY-v39.md
└── _qa/
    ├── admin-toss-style-lock-B1.md
    ├── function-lock-B1.md
    └── bake-fix-checklist-B1.md

Dev/design/BDR-current/_delta-v2.42-wiring/
├── IMPLEMENTATION.md
├── PUBLIC-SITE-DATA-MAP.md
├── data.jsx
└── public-site-data.jsx
```

새 시안은 위 파일을 폐기하지 말고, **v2.42 보강판**으로 이어가야 합니다.

## 4. P0 - 대회 운영 Workspace 100% 정합

### 4-1. 필요한 화면

| 화면 | 요구 |
|---|---|
| 대회 수정 기본 상태 | 상단 Toss header, 상태 pill, progress, 5단계 nav, 저장 footer 정확히 제시 |
| 대회 생성 기본 상태 | 동일 shell에서 생성 모드가 어떻게 달라지는지 제시 |
| 모바일 390px | nav, footer, panel embed, modal, table overflow 정합 |
| tablet 1024px | 카드/셀 블록 여백, 2열/1열 전환 기준 제시 |
| desktop 1440px | 시안 기준 최대 폭, 카드 간격, 배경 여백 고정 |

### 4-2. 필수 명세

| 항목 | 요구 |
|---|---|
| class list | `ts-*`, `ct-*`, `tw-*`, `amt-*`, `bk-*`, `sc-*` 사용 목록 |
| 삭제 후보 | `ta-*`, old `admin-*`, `au-*`, `components/ui`, Material Symbols 중 대회 운영에서 제거할 것 |
| component map | 시안 컴포넌트 → 운영 파일 매핑 |
| state map | idle/dirty/saving/saved/error/permission/mobile 상태 |
| spacing map | 카드 padding, grid gap, cell block radius, button height, footer 위치 |

## 5. P0 - 일정 관리 Schedule

`schedule.jsx` 기능을 운영 박제 가능한 수준으로 보강해 주세요.

### 5-1. 필요한 상태

| 상태 | 설명 |
|---|---|
| 경기 없음 | 대진 생성 전. 일정 관리에서 무엇을 보여주고 어떤 CTA를 제공하는지 |
| 대진 반영됨 | 조별예선+토너먼트 경기 수가 반영된 상태 |
| 다중 날짜 | 날짜별 경기 배정 UI |
| 다중 체육관/코트 | 체육관별 lane, court count, court naming |
| 자동 배정 | 자동 배정 전/후, 미배치 경기 수, 충돌 표시 |
| 수동 배정 | drag/drop, 순서 변경, break 삽입/삭제 |
| 저장 성공/실패 | 저장 중/완료/실패 상태 |
| 모바일 | table이 카드/scroll로 바뀌는 기준 |

### 5-2. 필수 기능

- `sc-*` 클래스 전체 목록과 역할
- 자동 배정 버튼 위치와 비활성 조건
- 미배치 경기 pool UI
- lane/court/date별 경기 배치 UI
- drag/drop 가능한 행과 불가능한 행 구분
- 경기 시간/휴식 시간 수정 UI
- 경기장/코트 배정이 없는 경우 empty state
- 실제 DB 필드가 필요하면 "연동 필요 필드"로만 분리

## 6. P0 - 대진 생성 Bracket

`bracket.jsx` 기능을 운영 박제 가능한 수준으로 보강해 주세요.

### 6-1. 필요한 상태

| 상태 | 설명 |
|---|---|
| 팀 부족 | 대진 생성 불가 CTA/사유 |
| 조별리그 | 조 편성, 조별 순위, 본선 진출 설정 |
| 싱글 토너먼트 | seed slot, bracket tree, drag swap |
| 듀얼 토너먼트 16팀 | 4개 조, 조별 더블엘리미네이션, 최종전, 본선 진출 |
| 기존 경기 존재 | 재생성 경고, 버전 생성/확정 |
| 버전 3회 제한 | free version limit UI |
| 종별 다중 | division filter chip, 종별별 generate |

### 6-2. 필수 기능

- `bk-*` 클래스 전체 목록과 역할
- seed slot 배정/해제
- 조 자동 편성/수동 변경
- 본선 진출 매핑
- bracket version dots/history
- generate/regenerate/confirm 버튼 상태
- `DivisionGenerateButton`, `DualGroupAssignmentEditor`에 대응하는 UI 계약
- 기존 경기와 schedule 반영 사이의 연결 안내

## 7. P1 - 경기 관리 Matches

### 7-1. 필요한 상태

| 상태 | 설명 |
|---|---|
| 예정 | 점수 없음, 일정/코트 표시 |
| 진행 | 기록 방식 표시, 기록앱/전자기록지 CTA |
| 종료 | 스코어, 승자, 상태 badge |
| 필터 | 종별/체육관/상태 필터 |
| ScoreModal | 홈/원정, 점수, 상태, 승자, 일정, 장소, 기록 방식 |
| 삭제 | 삭제 confirm과 disabled 조건 |
| 모바일 | table → card 또는 horizontal scroll 기준 |

### 7-2. 필수 기능

- `amt-table` 정확한 컬럼/셀 블록
- ScoreModal layout
- 기록 방식 전환: 기록앱 / 전자기록지 / 수기
- 전자기록지 링크 CTA
- 변경 필드만 저장되는 UX
- error/saving/saved state

## 8. P1 - 팀 관리 Teams

### 8-1. 필요한 상태

| 상태 | 설명 |
|---|---|
| 승인 | 정상 등록팀 |
| 대기 | 대기 번호/정원 초과 |
| 거절 | 거절 상태와 복구 CTA |
| 코치 미입력 | coach_token flow |
| 납부 상태 | 미납/납부/환불 |
| 선수 없음 | import CTA |
| 선수 import 성공/오류 | 카톡 텍스트 parsing preview |
| 토큰 만료/재발급 | URL copy/reissue |

### 8-2. 필수 기능

- 등록경로 stat 4종
- division readiness card
- 필터 chip 5종
- 종별 그룹핑 카드
- TeamDetailModal
- ImportPlayersModal
- CSV download / Kakao copy
- print view 기준

## 9. P1 - Site / Recorders / Admins

### 9-1. Site

| 상태 | 요구 |
|---|---|
| 미생성 | template/color/subdomain wizard 시작 |
| 작성중 | 임시 저장 |
| 발행 완료 | 공개 URL, 비공개 전환, 수정 CTA |
| 서브도메인 중복 | error state |
| 공개 사이트 preview | 관리자 UI는 Toss, 공개 결과물은 BDR임을 분리 |

### 9-2. Recorders

| 상태 | 요구 |
|---|---|
| 기록원 없음 | 초대 CTA |
| 기록원 추가 | 이메일 입력/초대 실패 |
| 경기별 배정 | match row select |
| 자동 배정 | round-robin 결과 |
| 미배정 경기 | warning badge |

### 9-3. Admins

| 상태 | 요구 |
|---|---|
| 운영진 없음 | 초대 CTA |
| 역할 선택 | owner/admin/staff/scorer |
| 제거 | confirm/권한 조건 |
| 권한 부족 | disabled/error state |

## 10. P1 - 데이터 계약

운영 코드가 실제 DB/API 배선으로 박제할 수 있도록, 각 화면별 필드 계약을 작성해 주세요.

| 화면 | 필요한 필드 예시 |
|---|---|
| workspace | tournament status, dates, progress, publish gate, site state |
| schedule | date rows, venue rows, court rows, generated matches, assigned lane |
| bracket | division rules, teams, seeds, groups, generated matches, versions |
| matches | match id, status, teams, score, winner, venue, recording mode |
| teams | team status, division, roster, payment, coach token, seed/group |
| site | template, color, subdomain, publish status |
| recorders | users, recorder assignments |
| admins | admin role, invite status |

필드가 현재 운영 DB에 없을 가능성이 있으면 `NEW FIELD NEEDED`로 표시하고, 화면에서는 "저장 완료처럼 보이는 mock"을 금지해 주세요.

## 11. P2 - 관리자 전페이지 Toss 재구현 준비

대회 운영이 끝난 뒤 `/admin/*`, `/tournament-admin/*` 전페이지를 Toss로 맞추기 위한 범위표도 함께 주세요.

| 그룹 | 페이지 |
|---|---|
| 최고 관리자 | `/admin`, `/admin/tournaments`, `/admin/tournaments/[id]`, audit-log, transfer-organizer |
| 유저/조직 | users, organizations, teams |
| 운영 콘텐츠 | news, community, suggestions, partners |
| 비즈니스 | payments, plans, settings |
| 대회 관리자 | organizations, series, templates, tournaments list/new/detail |
| 기록앱 영향 | `/admin/agents`, logs 연결 |

각 페이지마다 다음을 표시해 주세요.

- 현재 시안 충분 여부
- 추가 시안 필요 여부
- Toss component mapping
- old `au-*` 유지/교체 판단
- mobile state 필요 여부

## 12. 산출물

아래 파일을 하나의 handoff package로 주세요.

| 파일 | 내용 |
|---|---|
| `HANDOFF.md` | 요약, PM 결정 사항, 우선순위, 적용 순서 |
| `PARITY-MATRIX.md` | 시안 파일/class/function → 운영 파일 매핑 |
| `CLEANUP-MANIFEST.md` | 삭제/교체할 구버전 레이어 목록 |
| `TOURNAMENT-OPS-STATES.md` | workspace/7패널 상태표 |
| `DATA-CONTRACT.md` | 화면별 필요한 필드와 mock 금지 기준 |
| `RESPONSIVE-QA.md` | 390/720/1024/1440 viewport 체크리스트 |
| `tournament-ops-preview.html` | 전체 대회 운영 진입 화면 |
| `schedule-preview.html` | 일정 관리 보강 화면 |
| `bracket-preview.html` | 대진 생성 보강 화면 |
| `matches-preview.html` | 경기 관리 보강 화면 |
| `teams-preview.html` | 팀 관리 보강 화면 |
| `site-recorders-admins-preview.html` | 사이트/기록원/운영진 보강 화면 |
| `*.css`, `*.jsx`, `*.js` | 필요한 의존 파일만 포함 |

## 13. 완료 전 자체 검수

| 검수 | 기준 |
|---|---|
| Toss 유지 | 관리자 영역에 BDR 4px/Material Symbols 강제 변환 없음 |
| 공개 영역 분리 | 공개 사이트 preview는 BDR 룰 유지 |
| 하이브리드 제거 | `ta-*`/old `admin-*`/`components/ui`/Material Symbols 제거 기준 명시 |
| 기능 흐름 | 일정/대진/경기/팀/사이트/기록원/운영진의 상태별 동작 명시 |
| 데이터 계약 | 운영에 없는 데이터는 `NEW FIELD NEEDED` 또는 hidden/disabled 처리 |
| 모바일 | 390px에서 텍스트/버튼/표/모달 겹침 없음 |
| 구현 가능성 | Codex CLI가 파일별로 바로 박제할 수 있게 class/function/state map 포함 |

## 14. 주의

- 이 의뢰는 새 랜딩 페이지 제작이 아닙니다.
- 대회 운영 화면을 먼저 완성하기 위한 **구현용 보강 시안**입니다.
- 예쁜 mock보다 중요한 것은 **실제 운영 상태별 UI, 기능 흐름, 삭제/교체 기준**입니다.
- 전체 src zip을 요구하지 말고, 필요한 원본이 있으면 `SOURCE-REQUEST.md`로 파일 단위 요청만 해 주세요.
