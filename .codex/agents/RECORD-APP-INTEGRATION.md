# BDR Record App Integration

이 문서는 BDR 웹 서버와 기록앱 `bdr_stat_v3` 사이의 에이전트 소통 방식을 고정한다.

## 기준 저장소

| 항목 | 값 |
|---|---|
| 기록앱 repo | `https://github.com/cobby8/bdr_stat_v3.git` |
| 기준 브랜치 | `main` |
| 2026-06-25 확인 커밋 | `7676a1a` |
| 확인 태그 | `v0.1.10`, `v3.0.0-alpha.0` |
| 앱 버전 | `0.1.10+12` |
| 앱 스택 | Flutter, Riverpod, Dio, flutter_secure_storage, Drift SQLite |

## 현재 확인한 기록앱 계약

| 영역 | 기록앱 기준 |
|---|---|
| 인증 | `Authorization: Bearer <JWT>` |
| HTTP client | Dio |
| 토큰 저장 | `flutter_secure_storage` |
| 로컬 저장 | Drift SQLite |
| payload | snake_case |
| 중복 방지 | `client_event_id` |
| 주요 서버 경로 | `/api/v1/matches/:id/events`, `/events/batch`, `/events/:eventId/undo`, `/roster`, `/scoreboard`, `/status`, `/live-token`, `/scoreboard-url` |

## PM과 기록앱 에이전트 소통 방식

PM은 기록앱 영향 조건이 있으면 `record-app-liaison`에게 다음 패킷을 전달한다.

| 필드 | 내용 |
|---|---|
| 작업 요약 | 서버 변경의 목적 |
| 변경 파일 | 서버 repo의 파일 목록 |
| API 경로 | 영향받는 `/api/v1` 또는 web API |
| DB 모델 | 관련 Prisma 모델/테이블 |
| 응답 필드 | 추가/삭제/의미 변경 필드 |
| 기록앱 확인 범위 | `bdr_stat_v3`에서 봐야 할 파일/테스트 후보 |

`record-app-liaison`은 다음 패킷으로 응답한다.

| 필드 | 값 |
|---|---|
| 기록 앱 영향 | 없음 / 확인 필요 / 위험 |
| API 계약 변경 | 없음 / 필드 추가 / 필드 삭제 / 의미 변경 / 인증 변경 |
| 하위 호환성 | 유지 / 깨질 수 있음 / 확인 불가 |
| 기록앱 확인 요청 | 구체적인 화면, 플로우, 테스트 |
| 서버 검증 | curl, raw 응답, DB count/groupBy |
| 사용자 결정 필요 | 예/아니오 |

## 서버에서 동작시키는 방식

서버 런타임은 Codex `.toml` 에이전트를 그대로 실행하는 방식이 아니다. 서버에는 별도의 영향 분석 API를 둔다.

| 단계 | 구현 |
|---:|---|
| 1 | 규칙 기반 `record-app-impact` API |
| 2 | `AgentRun` 또는 유사 audit 테이블로 요청/응답 저장 |
| 3 | AI Gateway 또는 Gemini를 선택적으로 연결 |
| 4 | 관리자 화면에서 영향 보고 확인 |
| 5 | 필요 시 cron/queue로 정기 계약 점검 |

1차 MVP 구현 상태:

| 항목 | 값 |
|---|---|
| API | `POST /api/web/admin/agents/record-app-impact` |
| 상태 | 2026-06-25 규칙 기반 구현 완료 |
| 인증 | `getWebSession` + `super_admin` |
| 입력 | 작업 요약, 변경 파일, diff 요약, API 경로, DB 모델 |
| 출력 | 기록앱 영향 패킷 |
| 1차 판정 | 규칙 기반, 비용 0, DB 변경 0 |
| 2차 후보 | AI Gateway structured output |
| 저장 후보 | `AgentRun` 유사 audit 테이블 |

## 로컬 호출 도구

PM은 서버 변경 후 다음 스크립트로 기록앱 영향 패킷을 만들 수 있다.

| 용도 | 명령 |
|---|---|
| 현재 git 변경 파일 기준 payload 생성 | `node scripts/record-app-impact.mjs --summary "작업 요약"` |
| 응답 필드 삭제 위험 명시 | `node scripts/record-app-impact.mjs --summary "점수 필드 정리" --removed-field legacy_score` |
| 로컬 서버 API 호출 | `node scripts/record-app-impact.mjs --summary "작업 요약" --post --cookie "<super_admin session cookie>"` |

기본 실행은 네트워크 호출 없이 JSON payload만 출력한다. `--post`를 붙일 때만 `POST /api/web/admin/agents/record-app-impact`로 전송한다.

## 판단 규칙

| 변경 | 기본 판정 |
|---|---|
| `/api/v1/**` 파일 수정 | 확인 필요 |
| `event_type`, `client_event_id`, `quarter`, `game_time` 의미 변경 | 위험 |
| 응답 필드 추가 | 확인 필요, 대체로 하위 호환 유지 |
| 응답 필드 삭제/이름 변경 | 위험 |
| JWT/refresh/auth 변경 | 위험 |
| `match_events`, `MatchPlayerStat`, `TournamentMatch` 스코어/쿼터 변경 | 확인 필요 또는 위험 |
| web UI만 변경 | 영향 없음, 단 기록 UI/박스스코어 표시는 확인 필요 |

## 기록앱 repo 확인 키워드

- `ApiClient`
- `sync`
- `record_event`
- `build_match_stats_snapshot`
- `client_event_id`
- `event_type`
- `Authorization`
- `Bearer`
- `scoreboard`
- `roster`

## 금지

- 서버 변경과 기록앱 변경을 한 커밋에 섞지 않는다.
- 기록앱 repo를 사용자 승인 없이 수정하지 않는다.
- 서버 응답 필드 삭제를 "정리" 목적으로 진행하지 않는다.
- 기록앱 담당자가 공백인 상태에서 breaking change를 임의로 확정하지 않는다.
