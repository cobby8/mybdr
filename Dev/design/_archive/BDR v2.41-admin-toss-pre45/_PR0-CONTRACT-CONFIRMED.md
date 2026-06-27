# PR-0 계약 확정 (admin-toss 박제 선행) — 2026-06-27

> PR-1~5 착수 전 **반드시 먼저 읽을 것.** 이 문서가 §1 치환·§5 스키마 실측·§6 결정의 단일 source.
> 기준 패키지 = 이 폴더(`Dev/design/BDR v2.41-admin-toss/`). 구버전 핸드오프는 `Dev/design/_archive/_handoff-admin-toss-superseded-2026-06-27/`로 격리됨.

---

## §1 프롬프트 ↔ 패키지 불일치 치환표 (확정)

| 프롬프트 지칭 | 처리 |
|---|---|
| `START-HERE.md` (§9 진입맵) | **부재** → `README.md` + `HANDOFF.md §1` + `_qa/deadbutton-audit-B1.md §2`로 진입맵 파악 |
| `screenshots/INDEX.md` + `*.png` | **부재** → 정합 기준 = 라이브 **preview HTML 8종** + **진입 HTML 9종**(스크린샷 아님). `npx serve` 후 육안 대조 |
| PARITY-MATRIX / CLEANUP-MANIFEST / DATA-CONTRACT / TOURNAMENT-OPS-STATES / ADMIN-TOSS-STATE-QA / RESPONSIVE-QA | 전부 실재 ✅ 그대로 |

**정합 기준 정정**: "스크린샷 픽셀 정합" → **preview/진입 HTML 대비 정합**.

---

## §5 신규필드 9건 — 운영 스키마 실측 대조 (확정)

DATA-CONTRACT의 "🔴 DB 미보유" 가정 중 상당수가 **오판**. 아래가 실측 결과 — **신규 생성 전 이 표 우선.**

| # | 시안 요구 | 운영 스키마 실재 | 판정 | CLI 액션 |
|---|---|---|---|---|
| 1 | `summary.progress*` 산식 | 저장필드 없음 (status/count 파생) | 파생 산식 | **산식 정의만**, 마이그 0 |
| 2 | schedule duration/start/slot | `TournamentMatch.scheduledAt·court_number·match_number`, `Tournament.schedule_dates`(Json), `DivisionRule.settings`(Json) | 일부신규 | 핵심 바인딩. duration/lane/break = JSON 확장 → 불충분 시 ADD COLUMN(NULL) |
| 3 | bracket `seed{slot,teamId,locked}` | `TournamentTeam.seedNumber·groupName·group_order`, `tournament_bracket_versions` | 일부신규 | seed 바인딩. `locked`만 신규 ADD COLUMN(NULL)/notes |
| 4 | matches `recording_mode`+reason | `youtube_status`(별개), defaultMode=`settings` Json, `tournament_match_audits` | 일부신규 | defaultMode 바인딩. 매치별 recording_mode ADD COLUMN(NULL). reason=audits 재사용 |
| **5★** | teams `coach_token`+로스터 | **전부 존재**: `apply_token`(@unique)·`apply_token_expires_at`·`applied_via` = 코치토큰 / `TournamentTeamPlayer`(player_name·birth_date·jersey_number·position·phone·parent_*·school_name·grade) = 로스터 | **기존재사용** | **바인딩만. 신규 생성 절대 금지** |
| 6 | recorders `match_recorder` 배정 | `tournament_recorders`(대회별 풀)·`match_events.recordedBy`(사후) | 일부신규 | 풀 바인딩. 매치별 사전배정 = `TournamentMatch.recorder_id` ADD COLUMN(NULL)/신규테이블 |
| 7 | site subdomain unique + `publishedSections[]` | `TournamentSite.subdomain` **@unique 존재**, `theme_settings`(Json) | 일부신규 | unique=검증쿼리만(마이그 0). publishedSections=theme_settings JSON 확장 권장 |
| 8 | admins `invite.status` + role→perm | `TournamentAdminMember`(role·**permissions Json**·isActive). invite 흐름 없음 | 일부신규 | role/permissions 바인딩. invite `status` ADD COLUMN(NULL)/신규 invite 테이블 |
| 9 | settle `tournament_expense` | **모델 전혀 없음**(grep 0) | **전면신규** | 신규 테이블 CREATE(tournament_id FK+label+amount), 무중단 |

### ★ 실제 마이그레이션 필요 (NULL허용 ADD / CREATE만, 운영 DB 단일 — schema diff 사용자 검토 후)
- #2 court_start_time·laneKey·breakMin·종별 duration → **JSON 확장 우선**
- #3 seed `locked` → JSON/notes 또는 ADD COLUMN(NULL)
- #4 `TournamentMatch.recording_mode` → ADD COLUMN(NULL)
- #6 매치별 기록원 → `TournamentMatch.recorder_id` ADD COLUMN(NULL)/신규테이블
- #7 `publishedSections[]` → theme_settings JSON 확장 권장
- #8 admin invite `status` → ADD COLUMN(NULL)/신규테이블
- #9 `tournament_expense` → **유일한 명백한 신규 엔티티**, 신규 테이블 CREATE

### 바인딩만 — 신규 생성 금지 (이미 운영 존재)
- **#5 teams ★최중요**: coach_token=apply_token, 로스터=TournamentTeamPlayer 전 필드 존재. 시안 "DB 미보유"는 오판.
- #1 progress: 파생 산식 정의만. #7 subdomain unique: 검증 쿼리만.

> 신규 필드 추가 시 errors.md 룰: apiSuccess 응답키 **snake_case 자동 변환** — 프론트 접근자도 snake_case. 신규 필드 추가 전 curl 1회 raw 응답 확인 필수.

스키마 참조 라인: TournamentTeam L564 · TournamentTeamPlayer L626 · TournamentMatch L691 · tournament_bracket_versions L791 · TournamentSite L861 · tournament_recorders L2250 · TournamentAdminMember L386 · TournamentDivisionRule L3473 (`prisma/schema.prisma`)

---

## §6 사용자(수빈) 결정 (확정 2026-06-27)

| 항목 | 결정 |
|---|---|
| **6-1 생성 입구** (prospectus/association) | **5단계 마법사 단일 진입 + prospectus/association 코드 보존**. `admin-entry-cta` 4-method 패널은 입구에서 5단계로 단일화하되, PDF요강·협회등록 라우트/코드는 제거하지 않고 일단 보존(나중 결정) |
| **6-2 `/admin/tournaments` 목록** | **완전 제거**. 목록은 `/tournament-admin`로 일원화. 단 상세 `/admin/tournaments/[id]`의 **audit-log·transfer-organizer(감독 전용)는 유지** |

→ 6-1 = PR-3 반영 / 6-2 = PR-4 반영.

---

## 다음: PR-1 (공유 기반) 착수 가능
toss.css 토큰 이식 → toss-kit → `components/admin-toss` → admin-shell/admin-blocks. CLEANUP-MANIFEST 처분표 준수(유지 ts- / 교체 au- / 삭제 admin-·ta-·관리자 Material Symbols). lucide만. 선행 보고 = 본 문서 §5 표 재확인 후 코드.
