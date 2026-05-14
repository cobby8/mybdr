# 대회 관리자 통합 마법사 — 회귀 체크리스트

> 본 문서는 통합 마법사 (단체 → 시리즈 → 대회 → 회차) 작업이 장기적으로 깨지지 않게 보장하기 위한 영구 체크리스트.
> 가이드: `Dev/wizard-2026-05-13/04-prompts/phase-7-auto-verification.md` §작업 C

## 진입 상태 (2026-05-15)

| Phase | 상태 |
|-------|------|
| 1 (shared-types 인프라) | ✅ 완료 (`7be3aca`) |
| 2 (Step 0 단체 UI) | 🚧 BLOCKED (D1+D3 시안 필요) |
| 3 (Step 1 시리즈 UI) | 🚧 BLOCKED (D1 시안 필요) |
| 4 (Step 2 prefill) | 🚧 BLOCKED (D2 시안 필요) |
| 5 A (last-edition GET) | ✅ 완료 (`5306a2c`) |
| 5 B (editions 확장) | ✅ 완료 (`5306a2c` + retry `d858632`) |
| 5 C (DB unique 인덱스) | ✅ 운영 적용 (`b28545f`, 96ms) |
| 6 (Association 마법사) | 🚧 BLOCKED (D4 시안 필요) |
| 7 (자동 검증) | 🟡 부분 (본 체크리스트 박제 / E2E·스모크 = UI 완성 후) |

## 회귀 체크리스트 (8 항목)

각 검증은 **운영 적용 전** 반드시 통과해야 함. (1)(2)(3) 은 UI 검증 — Phase 2~4 완성 후 진입. (4)~(8) 은 백엔드/DB — 즉시 검증 가능.

### UI 검증 (Phase 2~4 완성 후 활성)

#### (1) AppNav main bar 우측 5개 영향 0
- 위치: 모든 페이지 상단
- 기대값: 검색 / 쪽지 / 알림 / 다크 / 햄버거 — 순서/개수 변경 0
- 검증 방법: 마법사 진입 전후 `screen[0..768px]` `screen[769..1280px]` 시각 비교
- 룰 source: `Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` 7 룰

#### (2) `/tournament-admin/tournaments/new/wizard` 직접 URL 진입 정상 동작
- 마법사 진입점 URL 변경 0 (가이드 §2-1: 기존 wizard 확장)
- 비로그인 → `/login?redirect=/tournament-admin/...` 복귀
- 로그인 → Step 0 (단체) 렌더

#### (3) `/tournament-admin/series/[id]/add-edition` (구 페이지) 정책
- 결정 1: 마법사로 리다이렉트 (series_id 프리셋 → Step 1 자동 선택)
- 결정 2: 그대로 동작 + 마법사 안내 배너
- 본 작업에서는 **결정 2** (구 페이지 보존 + 호환) — 마법사 사용자 결재 후 변경 가능

### 백엔드/DB 검증 (즉시)

#### (4) series_id NULL 인 1회성 대회 생성 동작
- 운영 DB 에서 `SELECT COUNT(*) FROM tournaments WHERE series_id IS NULL` 정상 진행 (운영 데이터 잔존)
- 마법사가 Step 1 에서 "시리즈 없이 1회성 대회" 분기 가능
- UNIQUE INDEX `tournaments_series_edition_unique` 는 NULL 행 영향 0 (PostgreSQL 특성)

#### (5) organization_id NULL 인 시리즈 생성 동작
- `tournament_series.organization_id` nullable 컬럼 — 기존 데이터 잔존 OK
- 마법사 Step 0 에서 "단체 없이 진행" 분기 → series 생성 시 organization_id NULL 박힘

#### (6) Tournament.status === "draft" 강제 박힘
- `02-db-changes.md §3` 결정: 마법사로 생성된 대회는 항상 draft
- 검증: editions POST 호출 시 body 에 status 다른 값 박혀도 무시
- 코드 위치: `src/app/api/web/series/[id]/editions/route.ts` (hasFullPayload 분기 안 status destructuring 제거)

#### (7) tournament_series.tournaments_count drift 0건
```sql
SELECT ts.id, ts.tournaments_count AS cached, COUNT(t.id) AS actual,
  ts.tournaments_count - COUNT(t.id) AS drift
FROM tournament_series ts
LEFT JOIN tournaments t ON t.series_id = ts.id
GROUP BY ts.id
HAVING ts.tournaments_count != COUNT(t.id)
LIMIT 20;
```
- 정상: 0건
- drift 발생 시 야간 cron `series-counter-audit` 가 자동 보정
- 마법사 회차 생성 시 트랜잭션 안에서 `increment: 1` 명시 (editions/route.ts)

#### (8) (series_id, edition_number) UNIQUE 가드 동작 (Phase 5 C 적용)
- 인덱스: `tournaments_series_edition_unique` (`b28545f` 적용)
- 검증: 같은 (series_id, edition_number) INSERT 2회 시도 → 두 번째가 23505 에러
- editions POST 의 retry 로직 (`d858632`) 이 23505 catch → count 재조회 후 1회 재시도 → 그래도 실패 시 409

## 자동 검증 스크립트 (Phase 2~4 완성 후 실행)

### Playwright E2E 3 시나리오
- 위치: `e2e/wizard/` (디렉토리 신규 필요)
- 시나리오 1: 단체+시리즈 둘 다 없는 신규 사용자 — Step 0~4 전체 종주
- 시나리오 2: 기존 시리즈에 회차 복제 ON — prefill 검증
- 시나리오 3: 1회성 대회 (단체/시리즈 둘 다 없이) — series_id NULL 박힘 검증

### API 스모크 스크립트
- 위치: `scripts/_temp/wizard-smoke.ts` (1회성)
- 8 단계: 로그인 → org POST → series POST → editions POST 회차 1 → last-edition GET → editions POST 회차 2 (복제) → division_rules count 비교 → cleanup
- 작업 후 즉시 정리 (CLAUDE.md §🗄️ 가드 3 — 운영 DB credentials 노출 방지)

## 운영 영향 정리

| 영역 | 변경 | 영향 |
|------|------|------|
| DB schema | UNIQUE INDEX 1개 추가 (Phase 5 C) | 무중단 / 데이터 변경 0 |
| API 신규 | `GET /api/web/series/[id]/last-edition` (Phase 5 A) | 신규 — 기존 호출자 0 |
| API 확장 | `POST /api/web/series/[id]/editions` body + retry (Phase 5 B) | 기존 호출자 회귀 0 (응답 키 100% 유지) |
| Flutter v1 API | 0 | 원영 사전 공지 불필요 |
| UI | 마법사 페이지 0 (Phase 2~4 미진입) | 사용자 체감 0 |

## 후속 큐

- **Phase 2/3/4/6** 시안 도착 후 진입 → UI 통합
- E2E + 스모크 스크립트 실행 (Phase 4 완성 후)
- KPI 박제 (선택 — Phase 7 D)

## 변경 이력

- 2026-05-15: 신규 작성 (Phase 7 작업 C / commit 후속)
