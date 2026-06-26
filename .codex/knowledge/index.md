# Knowledge Index

- 2026-06-26 admin: v2.41 Toss package KPI rows use `ad-kpi-*` classes; browser QA needs DB pooler connectivity.
- 2026-06-26 admin: shared DataTable wrappers use v2.41 `ad-tablescroll`/`ad-table` classes.
- 2026-06-26 admin: shared PageHead/Toolbar use v2.41 `ts-ph` and `ad-toolbar` structures.
- 2026-06-26 admin: `/admin/tournaments` top area uses v2.41 PageHead, search toolbar, and clean KPI labels.
- 2026-06-26 theme: `--color-on-primary` is defined as white so red primary buttons do not inherit black text.
- 2026-06-26 live: box score now has a per-team `기본/고급` toggle, advanced-stat help, and game-wide PIE denominator wiring.
- 2026-06-26 tournament-admin: match-level manual recording mode is now a real non-record-system mode instead of Flutter fallback.
- 2026-06-26 record-app: separated game-rule time presets from nonstop/all-dead clock mode.

Updated: 2026-06-26

| File | Entries | Recent |
|---|---:|---|
| architecture.md | 3 | Customer signal reporting |
| conventions.md | 2 | 대회 포맷 표준 |
| decisions.md | 7 | Manual recording mode contract |
| errors.md | 7 | Prettier via npx blocked by registry/cache access |
| lessons.md | 0 | - |

Recent work:
- 2026-06-26 admin: `/admin/tournaments` top area now follows v2.41 Toss PageHead + ad-toolbar + KPI flow while preserving server search and pagination.
- 2026-06-26 admin: shared PageHead and Toolbar were aligned with v2.41 `ts-ph`/`ad-toolbar` package structure.
- 2026-06-26 admin: shared admin DataTable wrappers were aligned with v2.41 `ad-tablescroll`/`ad-table` package structure.
- 2026-06-26 admin: BDR v2.41 admin Toss package was reviewed and shared KPI rows were converted from v2.40 `au-stat` to v2.41 `ad-kpi-*`.
- 2026-06-26 design: v2.41 admin Toss reverse-bake handoff was absorbed into `BDR-current`; admin/operation areas keep Toss as the official design system while public user surfaces keep BDR rules.
- 2026-06-26 theme: added the missing `--color-on-primary` alias used by primary buttons.
- 2026-06-26 live: box score tables now switch between basic and advanced stats, with one help popover per team table and PIE calculated against both teams.
- 2026-06-26 tournament-admin: target tournament panels/components no longer depend on shadcn `Card/Button`; wrappers use Toss `ts-*`/`ct-emptybox`.
- 2026-06-26 tournament-admin: `game_time`/`game_method` are derived from canonical `game_rules`, and match-level manual recording mode is counted and blocked from Flutter/score-sheet system inputs.
- 2026-06-26 tournament-admin: selected division rows now support inline rename/delete and validate empty/duplicate names before sync.
- 2026-06-26 record-app: game-rule presets now cover time/period only, while `clock_mode` remains a separate v1 response field and admin control.
- 2026-06-25 tournament-admin: fixed edit/delete persistence for venue fields, unused division rule deletion, and stale division schedule cleanup.
- 2026-06-25 tournament: 조별리그+토너먼트에서 홀수/비 2의 제곱 진출팀을 부전승 포함 트리로 생성하도록 보강.
- 2026-06-25 tournament: 조별리그+토너먼트 본선 generator와 3개 조 이상 동순위 순위결정전 생성을 구현.
- 2026-06-25 tournament: 대회 포맷 표준을 6개로 정리하고 신규 생성/관리/공개 라벨과 요강 추출 기준을 통일.
- 2026-06-25 customer-signals: `/help/contact` 접수 폼, `/api/web/customer-signals`, 공통 메일러, 기존 경기/코트 신고 트리거 메일 보고를 추가.
- 2026-06-25 referee: KBA 심판/경기원 규정과 FIBA table officials 기준에 맞춰 기록원·계시원을 경기원 직군으로 통합.
- 2026-06-25 agents: `POST /api/web/admin/agents/record-app-impact` 규칙 기반 서버 API를 추가해 기록앱 영향 패킷을 반환.
- 2026-06-25 agents: `bdr_stat_v3` repo를 기록앱 기준으로 고정하고 record-app liaison 소통/서버 영향 분석 MVP 방향을 문서화.
- 2026-06-25 agents: 상황별 운영 워크플로우 문서로 작은 수정/UI/DB/`api/v1`/배포/장애 대응 에이전트 호출 순서를 고정.
- 2026-06-25 agents: BDR 운영 에이전트에 reviewer/release/ops/content/db 역할과 기록 앱 liaison 협업 게이트를 추가.
- 2026-06-25 admin: 종별별 승인팀 자동 조편성 API와 참가팀 화면 버튼을 추가해 `groupName`/`seedNumber`를 대진 생성 전 준비할 수 있게 함.
- 2026-06-25 admin: 대회 생성의 종별 일정/체육관 배정을 관리 저장 API와 정합시키고 참가팀 화면에 승인팀 기준 종별별 대진 준비 현황을 추가.
- 2026-06-25 tournament: 카카오 장소 검색, 지도/길안내 URL 저장, 공개 일정 길안내, 경기장 알림 cron을 연결.
- 2026-06-25 admin: 대회 관리자 설정을 생성 흐름과 맞춰 다중 후원사, 체육관, 일정 저장과 모바일 2행 경기 프리셋을 반영.
- 2026-06-25 admin: 경기 운영 패널과 기록 방식 카드를 생성 화면 톤으로 정리하고 모바일 경기 카드를 추가.
- 2026-06-24 Security: PostCSS override로 Next 하위 취약 버전 제거, `npm audit` 0건 확인.
- 2026-06-24 Security: 취약 `xlsx` 제거, `.xlsx` 전용 파서와 스플릿 생성기 교체, high/critical audit 0건 확인.
- 2026-06-23 QA/STAGE: v2.40 기준 디자인 일관 QA 패키지와 STAGE E/F/G 실행 순서 정리.

Recent membership work:
- 2026-06-25 membership: `membershipType` is the global permission grade, while feature subscriptions now share a common usable-subscription check for payment, profile, site, and admin flows.
