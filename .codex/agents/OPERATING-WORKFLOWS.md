# BDR Operations Agent Workflows

이 문서는 BDR 사이트 운영 작업에서 어떤 에이전트를 어떤 순서로 호출할지 고정한다. 기본 원칙은 PM이 작업 범위를 정하고, 기록 앱 영향이 있으면 `record-app-liaison`을 반드시 거친 뒤 구현과 검증을 진행하는 것이다.

## 공통 게이트

| 게이트 | 조건 | 필수 에이전트 |
|---|---|---|
| 승인 | 코드/문서 파일 변경 전 | `pm` |
| DB 영향 | Prisma schema, SQL, 운영 DB 쓰기/변경 | `db-guardian` |
| 기록 앱 영향 | `/api/v1`, 경기 기록, PBP, 쿼터, 출전시간, 스탯, 모바일 JWT, snake_case 응답 | `record-app-liaison` |
| 디자인 영향 | BDR-current, AppNav, 토큰, 모바일 UI | `designer` |
| 릴리스 영향 | 커밋, push, PR, 배포 전 점검 | `release-manager` |
| 운영 장애 | 배포 후 오류, API 장애, 기록 앱 현장 중단 가능성 | `ops-monitor`, `debugger` |

## 1. 작은 코드 수정

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | 요청 범위와 금지 범위 정리 |
| 2 | `developer` | 승인된 파일만 수정 |
| 3 | `tester` | `npx tsc --noEmit` 중심 검증 |
| 4 | `pm` | 기록 갱신, 커밋, 미푸시 수 보고 |

리뷰어는 생략할 수 있다. 단, 인증/DB/API 계약 변경이 있으면 `reviewer`를 추가한다.

## 2. UI/디자인 수정

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | UI 변경 범위 승인 |
| 2 | `designer` | BDR-current, AppNav frozen, 토큰, 모바일 규칙 확인 |
| 3 | `developer` | 데이터 패칭 유지, 렌더링만 수정 |
| 4 | `tester` | 화면 렌더링, 모바일 폭, 콘솔 오류 확인 |
| 5 | `pm` | BDR-current 역동기화 필요 여부 기록 |

경기 기록 UI, 박스스코어, 선수/팀명 표시가 포함되면 `record-app-liaison`을 2단계 뒤에 추가한다.

## 3. 새 기능 또는 구조 변경

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | 작업을 설계/구현/검증 단위로 분리 |
| 2 | `planner-architect` | DB/API/UI/관리자/공개 화면 흐름 설계 |
| 3 | `db-guardian` | DB 영향과 승인 필요 여부 판단 |
| 4 | `developer` | 승인된 범위 구현 |
| 5 | `tester` + `reviewer` | 병렬 검증과 코드 리뷰 |
| 6 | `pm` | knowledge, scratchpad, 커밋 정리 |

기록 앱 영향 조건에 해당하면 2단계 뒤에 `record-app-liaison`을 반드시 추가한다.

## 4. `/api/v1` 또는 기록 앱 영향 작업

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | 기록 앱 영향 작업으로 분류 |
| 2 | `planner-architect` | API 계약, DB 흐름, 웹/모바일 영향 설계 |
| 3 | `record-app-liaison` | 기록 앱 영향, 하위 호환성, 확인 요청 정리 |
| 4 | `db-guardian` | 관련 테이블과 데이터 손실 위험 검토 |
| 5 | `developer` | 하위 호환성을 우선해 구현 |
| 6 | `tester` | raw 응답, snake_case, 모바일 인증, 회귀 체크 |
| 7 | `reviewer` | API 계약 파괴, 권한, 기록 앱 위험 리뷰 |
| 8 | `release-manager` | 릴리스 보고에 기록 앱 영향 상태 포함 |

`record-app-liaison`의 보고는 반드시 다음 형태를 포함한다.

| 항목 | 값 |
|---|---|
| 기록 앱 영향 | 없음 / 확인 필요 / 위험 |
| API 계약 변경 | 없음 / 필드 추가 / 필드 삭제 / 의미 변경 / 인증 변경 |
| 하위 호환성 | 유지 / 깨질 수 있음 / 확인 불가 |
| 확인 요청 | 구체적인 기록 앱 화면 또는 플로우 |
| 웹 쪽 테스트 | curl, raw 응답, DB 검증 |

## 5. 운영 DB 작업

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | DB 작업 여부와 사용자 승인 필요성 확인 |
| 2 | `db-guardian` | destructive 여부, schema diff, 사전 SELECT 검증 설계 |
| 3 | `planner-architect` | DB 변경이 화면/API 흐름에 미치는 영향 정리 |
| 4 | `developer` | 승인된 DB/API 변경만 수행 |
| 5 | `tester` | count/groupBy 등 사후 실측 검증 |
| 6 | `reviewer` | 데이터 손실, 권한, 누락 검증 리뷰 |

기록 앱 관련 테이블이면 `record-app-liaison`을 2단계 뒤에 추가한다.

## 6. 배포 전 점검

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | 이번 배포 범위와 미해결 리스크 정리 |
| 2 | `tester` | 필요한 타입/테스트/빌드 확인 |
| 3 | `ops-monitor` | 운영 관점 핵심 화면/API 점검 항목 정리 |
| 4 | `release-manager` | 커밋, 미푸시 수, push/PR 조건 확인 |

기록 앱 영향이 있었던 배포는 릴리스 보고에 `record-app-liaison`의 영향 상태를 반드시 넣는다.

## 7. 장애 또는 긴급 디버깅

| 단계 | 에이전트 | 역할 |
|---:|---|---|
| 1 | `pm` | 증상, 영향 범위, 긴급도 정리 |
| 2 | `ops-monitor` | 운영 화면/API/기록 앱 영향 범위 확인 |
| 3 | `debugger` | 원인, 해결, 예방 순서로 분석 |
| 4 | `developer` | 최소 수정 |
| 5 | `tester` | 재현 케이스와 회귀 검증 |
| 6 | `pm` | errors/lessons 기록 필요 여부 판단 |

`/api/v1` 실패, 기록 앱 저장 실패, 현장 기록 중단 가능성이 있으면 `record-app-liaison`을 2단계 직후 호출한다.

## 완료 보고 템플릿

| 항목 | 내용 |
|---|---|
| 한 것 | 변경/검증/기록 요약 |
| 다음 할 것 | 남은 확인 또는 후속 작업 |
| 기록 앱 영향 | 없음 / 확인 필요 / 위험 |
| 검증 | 실행한 명령과 결과 |
| 커밋 | 커밋 해시 또는 미커밋 사유 |
| 미푸시 커밋 | 숫자 |
