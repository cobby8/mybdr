# 작업 스크래치패드

## 현재 작업
- **요청**: 대회/시리즈/단체 연결 구조 전체 진단 (planner-architect, 읽기 전용)
- **상태**: ✅ 진단 완료 (운영 DB 실측 + 코드 흐름 추적)
- **모드**: no-stop (자동 머지 위임)

## 진단 (planner-architect) — 대회/시리즈/단체 연결 구조 전체 점검 (2026-05-12)

🎯 목표: 3 엔티티 (organizations / tournament_series / tournament) 연결 흐름의 빈 칸 + 정합성 깨짐 root cause 일괄 파악 → fix 로드맵 5 Phase 제시

### 1. 데이터 모델 관계도 (ASCII)

```
       organizations (BigInt id)               
       ├─ owner_id → User (1:1)               
       ├─ series_count (캐시 — 정합성 가드 부재)
       └─ status: pending / approved / rejected
               │ 1:N
               ▼
       organization_members (org_id, user_id, role: owner/admin/member)
               │
       ┌───────┴────────┐
       │                │
       │     tournament_series (BigInt id)
       │     ├─ organization_id  ❶ Nullable!
       │     ├─ organizer_id (User, 단일)
       │     ├─ tournaments_count (캐시 — 정합성 가드 부재)
       │     └─ status: active / inactive
       │             │ 1:N
       │             ▼
       │      Tournament (UUID id)
       │      ├─ series_id    ❷ Nullable (대회는 시리즈 없어도 됨)
       │      ├─ organizerId  ❸ 시리즈 organizer 와 독립
       │      └─ tournament_admin_members (TAM, 다인 권한)
       │
       └─ FK = onDelete NoAction (단체 삭제 = 시리즈 고아화)
```

### 2. 발견된 문제점 (운영 DB 실측 포함)

| # | 카테고리 | 심각도 | 영향 | 위치 / 사실 |
|---|---------|--------|------|------------|
| **P1** | DB/API | 🔴 Critical | 운영 카운터 깨짐 12건 | series id=8 (BDR) `tournaments_count` stored=**0** / actual=**12**. org id=3 (강남구농구협회) `series_count` stored=**0** / actual=**1**. **카운터 backfill/recompute 0건 / cron 0건**. createTournament service (`src/lib/services/tournament.ts:418`) 가 `series_id` 입력 자체 없고 +1 박제도 없음. editions API 만 +1 / PATCH/absorb 가 +1·-1 → wizard 진입 X 인 직접 create path 는 stale |
| **P2** | API | 🔴 Critical | 시리즈 organization_id NULL 박제 | `/tournament-admin/series/new/page.tsx:31` 호출이 `organization_id` 파라미터 **미전송** → 운영자가 본 페이지에서 만들면 org_id NULL 박제 (id=10 사례 = 운영 사실). `/(web)/series/new/` 페이지는 **alert("준비 중") 만** — DB mutation 0 |
| **P3** | API | 🟠 Major | 시리즈 PATCH/DELETE 부재 | `/api/web/series/[id]/route.ts` GET 1개. `organization_id` 사후 변경 / 시리즈 메타 (name/desc/is_public) 수정 / 시리즈 삭제 0건. 단체-시리즈 분리 = DB UPDATE 만 (실측 사례) |
| **P4** | API | 🟠 Major | 대회 DELETE 부재 | `/api/web/tournaments/[id]/route.ts` GET/PATCH 만. 대회 삭제 흐름 자체 없음 (status=cancelled 도 불완전). 시리즈 삭제 시 소속 대회 운명 미정의 |
| **P5** | 권한 | 🟠 Major | requireSeriesOwner 가 organizer_id 만 검증 | 단체 소속 시리즈인데 다른 단체 admin/owner 가 못 만짐. `series-permission.ts:78` — organization_members role 분기 0건. PR1 PATCH 도 organizer 본인만 series 이동 가능 |
| **P6** | UI | 🟠 Major | 단체-시리즈 분리 / 단체간 이동 UI 0 | 실측 사례 = DB UPDATE 만 (강남구 BDR 시리즈). organization 페이지에서도 시리즈 PATCH organization_id=null UI 없음 |
| **P7** | UI | 🟡 Minor | 시리즈 신규 진입점 4개 분기 | `/(web)/series/new` (alert만), `/tournament-admin/series/new` (org_id 미전송), `/tournament-admin/organizations/[orgId]` (정상, org_id 박제), 메인 nav 메뉴 — 진입점 일관성 X |
| **P8** | 일관성 | 🟡 Minor | 단체 삭제 / cascade 미정의 | organizations FK onDelete NoAction. 단체 삭제 시 시리즈 organization_id 자동 NULL X / cascade 결정 미정의. lifecycle 사용자 결재 항목 |
| **P9** | UI | 🟢 Info | 공개 페이지 events 탭 평탄화 vs 관리 페이지 unflatten | `/organizations/[slug]?tab=events` = series → tournaments 평탄. `/tournament-admin/organizations/[orgId]` = series 카드 list. 운영자가 흡수 UI 보려면 series 클릭 → 새 페이지. 통합 hub 부재 |

### 3. 우선순위별 fix 로드맵 (5 Phase)

| Phase | 범위 | LOC 추정 | 위험 | 산출물 |
|-------|------|---------|------|--------|
| **A. 즉시 fix (1~2 PR)** | (a) 카운터 일회성 recompute 스크립트 + 운영 DB backfill / (b) `/tournament-admin/series/new` 페이지에 organization 드롭다운 추가 (P2) / (c) `/(web)/series/new` 페이지 alert 제거 (또는 redirect to 단체 페이지) | 200~300 | 낮음 (UI 추가 + 스크립트) | scripts/recompute-series-counters.ts + form 1 dropdown + redirect 1줄 |
| **B. 정합성 가드 (1 PR)** | createTournament service 에 series_id 입력 + +1 박제 통합 / Tournament DELETE 추가 (소프트 delete or 카운터 -1) / cron recompute 주 1회 | 300~500 | 중 (모든 create path 점검 필요) | services 수정 + 신규 DELETE route + cron |
| **C. 시리즈 PATCH/DELETE (1 PR)** | `/api/web/series/[id]` PATCH (name/desc/is_public/organization_id 변경) + DELETE (소프트 status=inactive) / requireSeriesOwner 확장 = organization owner/admin 도 허용 / 카운터 동기화 transaction | 400~600 | 중 (권한 매트릭스 변경) | route + permission helper 확장 |
| **D. UI 단체↔시리즈 운영자 셀프서비스 (2 PR)** | 단체 페이지 시리즈 카드에 "단체에서 분리" / "다른 단체로 이동" 메뉴 (3-dot) / 시리즈 페이지 "단체 변경" 드롭다운 / 운영자 단체 admin/owner 가 시리즈 만질 수 있게 권한 확장 | 600~1000 | 중 (UI + 권한 + transaction) | OrgSeriesActionsMenu + SeriesSettingsForm |
| **E. lifecycle 정책 + cascade (1 PR + 결재)** | 단체 삭제 정책 결재 (option A: status archived 보존 / B: 소속 series.organization_id NULL 자동 / C: cascade) / 시리즈 삭제 시 대회 운명 정책 / cron monthly audit | 300~500 + 결재 1회 | 높음 (DB 정책) | 결재 문서 + cron + admin UI |

### 4. 운영자 결재 사항 (3 항목)

1. **단체 삭제 정책** — A 보존 (status=archived, series.organization_id 유지) / B 자동 분리 (NULL) / C cascade 전체 삭제. 강력 추천 = **A** (감사 + 복구 가능)
2. **시리즈 organization_id 변경 권한** — 시리즈 organizer 본인만 / 단체 owner+admin 도 가능 / super_admin 만. 추천 = **단체 owner+admin + super_admin** (운영 셀프서비스)
3. **대회 organizer ≠ 시리즈 organizer 케이스** — 단체 소속 시리즈 안에서 대회 organizer 가 단체 멤버 아닐 때 권한 흐름. 추천 = **단체 admin/owner 가 단체 소속 시리즈 모든 대회 관리 가능** (현재 = 안 됨)

### 5. 장기 비전

단체 페이지가 **시리즈/대회의 hub** — 운영자가 단체 페이지에서 모든 시리즈/대회 lifecycle (create / status / 분리 / 이동 / 삭제) 1-click. 시리즈 페이지는 단체 sub-page. 대회는 시리즈 sub-page. 공개 페이지 events 탭 = 평탄화 유지 (운영 페이지는 hierarchy 유지). 카운터 = 단방향 trigger (create/update/delete 시 같은 transaction +N/-N) + cron monthly recompute audit.

### 6. knowledge 갱신 후보

- `architecture.md` 후보: 3 엔티티 관계도 + FK NoAction 정책 + 카운터 정합성 메커니즘 부재
- `decisions.md` 후보: 단체 삭제 정책 (위 결재 1) / 권한 확장 정책 (결재 2) / 카운터 정합성 보장 메커니즘 결정

### 본 진단 작업의 부산물 (정리됨)
- `scripts/_temp/diag-series-org-counters.ts` — 운영 DB 실측 후 삭제 ✓ (운영 SELECT 만, schema 변경 0, UPDATE 0)


## 진행 현황표 (옵션 A — 본 세션)
| # | 이슈 | 작업 | 상태 |
|---|------|------|------|
| 31 | 빨강 버튼 디자인 위반 | organizations 2 페이지 6 토큰 → btn--primary / accent / info | ✅ |
| 30/32 | 단체 페이지 흐름 | snukobe org_members admin INSERT (강남구농구협회 orgId=3) | ✅ |
| 29 | 대회 자동 종료 로직 | auto-complete.ts + match-sync 통합 + vitest +8 + 운영 1건 backfill | ✅ |
| 32-추가 | 단체 관리/페이지 관리 메뉴 | 단체 상세 추가 메뉴 link 보강 | 보류 (별 PR) |
| 33 | 대진표 고도화 | dual_tournament rounds/brackets 매핑 강화 | 보류 (별 PR) |
| 34 | 권한 자동 부여 | 단체 admin → 대회 운영자 자동 부여 (헬퍼 또는 트리거) | 보류 (별 PR) |

## 작업 로그 (최근 10건)
| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 10]** 정밀 디자인 fix (Critical 4 + Major 3) — §B 헤더 underscore (큰 박스 폐기) / §C Players 15행 (fillRowsTo12 → fillRowsTo15 alias 유지) + 행 24→22px / §E Time-outs 빈 박스 + 마킹 시 X 글자 / §F Team fouls 1·2·3·4 빈 박스 + 마킹 시 검정 채움 (1·2·3·4 라벨 폐기) / §G Player Fouls 1-5 빈 박스 + 마킹 시 P/T/U/D 글자만. §A·§D 결재 = BDR 브랜드 + 자동 fill 유지 (변경 0). 2 파일. tsc 0 / vitest 543/543 PASS (기존 541 + 신규 2 alias 회귀 가드). A4 fit 좌측 ~1058px / 1123 안 fit ✓. 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 9]** A4 1 페이지 fit + 레이아웃 재배치 — 좌측 Team A+B 세로 분할 (FIBA PDF 정합) / 우측 Running+Period+Final 누적 / Footer 최하단 가로 1~2줄 (Notes frameless 시 폐기) / Players 행 28→24px / 폰트 압축 (헤더 13px / 라벨 10 / 데이터 11~12 / 인쇄 8pt) / @page margin 8→6mm / fiba-frame 198mm×285mm 강제. 7 파일. tsc 0 / vitest 541 PASS. 좌측 ~975px / 우측 ~1025px (A4 1123 안에 fit ✓). 회귀 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[Phase A 즉시 fix]** 운영 사고 3종 차단 — (A-1) `/tournament-admin/series/new` organization 드롭다운 추가 (owner/admin + approved 필터) (A-2) `/(web)/series/new` alert 폼 → admin redirect 통합 (A-3) `scripts/_temp/series-counter-recompute.ts` DRY-RUN/APPLY 모드 분리. tsc 0 / vitest 541 PASS / DRY-RUN 실측 = 진단 fact 일치 (series id=8 0→12 / org id=3 0→1). schema 변경 0 / Flutter v1 영향 0. APPLY 는 사용자 승인 후 별 turn 실행 | ✅ |
| 2026-05-12 | (진단) | **[진단]** 대회/시리즈/단체 연결 구조 전체 점검 — 운영 DB 실측: series id=8 카운터 0/12 깨짐 + org id=3 카운터 0/1 깨짐 + series id=10 org_id NULL. root cause = `/tournament-admin/series/new` org_id 미전송 + createTournament service +1 박제 부재 + cron 0건. 9 문제점 매트릭스 + 5 Phase 로드맵 + 3 결재 항목. 코드 변경 0 / SELECT only / 스크립트 정리 ✓ | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 8]** PDF 1:1 완전 정합 — 단일 외곽 박스 통합 + 헤더 컴팩트 4 줄 + Players 행 28px + Footer 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열). 7 파일 +450/-258. tsc 0 / vitest 541/541. 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | (커밋 대기) | **[FIBA Phase 7.1]** LineupSelectionModal 확장 — 전체 선택/해제 + FIBA 12명 cap (Article 4.2.2) + 13번째 차단 + applyRosterCap 헬퍼 + isLineupSelectionValid 12명 상한. tsc 0 / vitest 533/533 (+7). 회귀 0. schema 변경 0. | ✅ |
| 2026-05-12 | d89f600 | **[live]** score-match swap-aware 백포트 — 5/10 결승 영상 사고 2차 fix | ✅ |
| 2026-05-12 | ff190a7 | **[live]** 결승 영상 매핑 오류 fix — auto-register 1:1 매핑 가드 백포트 | ✅ |
| 2026-05-12 | 32b8ec9 | **[live]** TeamLink href 404 — TournamentTeam.id → Team.id 분리 | ✅ |
| 2026-05-12 | eead692 | **[stats]** 통산 스탯 3 결함 일괄 — mpg 모달 회귀 + 승률 source + FG%/3P% NBA 표준 | ✅ |
| 2026-05-12 | 714eda3 | **[stats]** 통산 mpg 단위 변환 — DB 초 → 표시 분 (사용자 보고) | ✅ |

## 구현 기록 (developer) — FIBA Phase 10 정밀 디자인 fix (2026-05-12)

📝 구현 범위: 사용자 결재 7건 fix — §A·§D 결재 보존 (변경 0) / §B·§C·§E·§F·§G 5건 적용

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `team-section.tsx` | §B 헤더 = "Team A ____슬로우____" underscore (큰 박스 폐기 / uppercase + tracking-wider 폐기) / §C `fillRowsTo15` 신규 + `fillRowsTo12` deprecated alias (12 → 15 / FIBA 종이기록지 표준) / §C 행 24 → 22px (15행 fit) + 빈 row 동일 / §E Time-outs 채운 칸 검정 ● 배경 → 빈 박스 + 마킹 시 X 글자 / §F Team fouls 1·2·3·4 빈 박스 + 마킹 시 검정 채움 (1·2·3·4 라벨 폐기 / accent → text-primary) / §F Extra(OT) 동일 / §G Player Fouls 1-5 빈 박스 (1·2·3·4·5 숫자 폐기) + 마킹 시 P/T/U/D 글자만 / 컴포넌트 상단 주석 Phase 10 추가 | 수정 |
| `team-section-fill-rows.test.ts` | `fillRowsTo12` → `fillRowsTo15` 테스트 4건 갱신 (빈 / 5 / 15 / 18명) + `fillRowsTo12` alias 회귀 가드 2건 신규 추가 (deprecated alias 동작 검증) | 수정 |

### 적용 X 항목 (사용자 결재 = 변경 0)
- **§A 헤더 타이틀** = BDR 브랜드 유지 (FibaHeader.tsx — BASKETBALL DAILY ROUTINE / SCORESHEET + BDR 로고 모두 그대로)
- **§D Players 데이터** = 자동 fill 유지 (사전 라인업 + Licence User.id read-only)

### A4 1 페이지 fit 재검증 (15행 증가 후)
- Team 한쪽 합: 헤더 22 + Time-outs/Fouls 70 + thead 22 + 15행 × 22 = 330 + Coach 22 + 패딩 = **~474px**
- Team A + Team B 합 = **~948px**
- 상위 헤더 (~110px) + 풋터 (~80px) = ~190px
- 총합: **~1058px** ≤ A4 1123px **fit ✓**
- 인쇄 시 `_print.css` 의 198mm × 285mm 강제 + overflow: hidden 보호

### 검증
- **tsc --noEmit**: **0 에러**
- **vitest**: **543/543 PASS** (기존 541 + Phase 10 신규 2건 alias 회귀 가드)
- **회귀 안전망**: `fillRowsTo12` deprecated alias 유지 → 기존 호출자 깨지지 않음. 본 PR 안 호출자 = team-section.tsx 1곳 + 테스트 1곳만
- **grep 회귀 0**:
  - lucide-react = 주석 1건 (룰 명시 — 정상)
  - BigInt N n literal = 0건
  - 핑크/살몬/코랄 hardcode = 0건
- **schema 변경 0** / **Flutter v1 영향 0** / **AppNav 영향 0** / **BFF·service 변경 0**

### 디자인 변경 7건 결과
| # | 결재 | 적용 |
|---|------|------|
| §A | BDR 브랜드 유지 | ✅ 변경 0 (FibaHeader 그대로) |
| §B | Team A/B 헤더 = underscore | ✅ team-section.tsx 헤더 박스 → underscore |
| §C | Players 15행 | ✅ fillRowsTo15 + 행 22px |
| §D | 자동 fill 유지 | ✅ 변경 0 (Licence User.id 그대로) |
| §E | Time-outs 빈 박스 + X 마킹 | ✅ 검정 ● 배경 폐기 + X 글자 |
| §F | Team fouls 빈 박스 | ✅ 라벨 폐기 + 검정 채움 |
| §G | Player Fouls 빈 박스 | ✅ 1·2·3·4·5 숫자 폐기 + P/T/U/D 글자만 |

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → 다음 시각 확인:
  - 좌측 Team A 헤더 = "Team A ____슬로우____" underscore 형태 (큰 박스 X)
  - Players 표 = 15행 (사전 라인업 + 빈 행 fill)
  - Time-outs 5칸 = 빈 박스 → 클릭 시 X 글자
  - Team fouls Period 1·2·3·4 = 빈 박스 4개 (1·2·3·4 라벨 없음) → Player fouls 마킹 시 자동 검정 채움
  - Player Fouls 1-5 = 빈 박스 (숫자 없음) → 클릭 시 모달 → P/T/U/D 글자만 표시
- 정상: tsc 0 / vitest 543 PASS / A4 1 페이지 안 fit 유지
- 주의: 운영자가 X 글자 = "사용된 타임아웃" 인지 학습 필요 (UX 변경)
- 시각 검증 우선 — FIBA 종이기록지 PDF / JPG 와 1:1 비교 권장

### ⚠️ reviewer 참고
- `fillRowsTo12` deprecated alias 유지 = 구버전 호출자 회귀 안전망. Phase 11+ 후속 PR 에서 회수 가능
- §E Time-outs 의 "마킹 시 X" 는 종이기록지 운영자 관행 정합. 인쇄 시 `_print.css` 의 `[aria-label*="마킹됨"]` 회색 배경 룰이 빈 박스에도 적용되지만 — X 글자 자체로 식별 가능 (회색 배경 + X 글자 이중 식별)
- §F Team fouls 채움색 = `var(--color-text-primary)` (검정/흰 모드 자동 분기). 인쇄 시 `_print.css` 가 검정 강제
- §G Player Fouls 빈 박스 = 마킹 전 칸 클릭 가능 영역 안내가 `aria-label` 만 남음. 운영자가 빈 박스 호버 = 색 변경 효과 없음 → Phase 11+ 후속 UX 보강 후보 (호버 시 + 표시 등)

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — FIBA Phase 9 A4 1페이지 fit + 레이아웃 재배치 (2026-05-12)

📝 구현 범위: 좌측 Team A+B 세로 분할 / 우측 Running+Period+Final 누적 / Footer 최하단 가로 펼침 / A4 1 페이지 fit

### 영역별 높이 박제 (A4 1123px 안에 fit 검증)
- Header: ~80~95px (8%)
- Team A: ~400px (Time-outs/Fouls 50 + thead 22 + 12행 × 24 + Coach)
- Team B: ~400px (Team A 동일 구조)
- Footer: ~80px (1줄 4col + 1줄 3col + 1줄 Captain)
- 합계 (좌측 기준): ~975px (A4 1123 안 fit ✓)
- 합계 (우측 기준): ~1025px (Header 95 + Running 680 + Period+Final 170 + Footer 80) (A4 1123 안 fit ✓)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `score-sheet-form.tsx` | max-w-screen-md → max-w-[820px] + px-1 py-1 / 우측 컬럼 = RunningScore 아래 `fiba-divider-top` + PeriodScoresSection 누적 (FIBA PDF 정합) / Phase 8 → Phase 9 주석 갱신 | 수정 |
| `fiba-header.tsx` | sectionClass px-3 py-2 → px-2 py-1 / 로고 28×14 → 24×12 / SCORESHEET text-sm (14) → text-[13px] / Basketball Daily Routine 9 → 8px / gap-3 → gap-2 / gap-y-0.5 → gap-y-0 (3·4줄) | 수정 |
| `team-section.tsx` | sectionClass px-2 py-2 → px-1 py-1 / 헤더 라벨 11px → 10px / 팀명 text-sm → text-[13px] / Time-outs+Fouls gap-2 → gap-1.5 / mb-1.5 → mb-0.5 / Players thead py-1 → py-0.5 + height 22 / Players td py-1 → py-0 / 행 28 → 24px / Licence text-xs → text-[11px] / Player text-xs → text-[11px] + lineHeight 1.1 / 등번호 text-[11px] / Player in h-9 w-9 → h-5 w-5 + input h-5 → h-4 / Fouls td py-0 / 퇴장 라벨 10 → 9px + icon 12 → 11px | 수정 |
| `running-score-grid.tsx` | 헤더 px-2 py-1 → px-2 py-0.5 / 안내 텍스트 10 → 9px + 축약 ("P1 · 1탭=입력 / 마지막=해제") | 수정 |
| `period-scores-section.tsx` | gap-2 → gap-1 / 헤더 px-2 py-1 → px-2 py-0.5 / 버튼 h-9 min-w-9 → h-7 min-w-7 + px-1 / "현재:" 제거 / 표 thead/tbody py-1 → py-0 / 종료 버튼 py-2 text-sm → py-1 text-xs / icon text-base → text-sm / Final px-3 py-2 → px-2 py-1 / mt-1 → mt-0.5 / Final 숫자 text-2xl → text-xl + leading-tight / ":" text-base → text-sm / Winner mt-2 py-1 → mt-1 py-0.5 | 수정 |
| `footer-signatures.tsx` | sectionClass px-3 py-2 → px-2 py-1 / 4col gap-x-3 gap-y-1 → gap-x-2 gap-y-0 / 3col mt-1 → mt-0.5 + gap-y-0 / Captain mt-1 → mt-0.5 / Notes textarea: frameless=true (운영 기본) 시 숨김 (FIBA PDF 정합 + A4 fit) / frameless=false 시 유지 (회귀 안전망) / SigInput inline minHeight 24 → 22 / gap-1.5 → gap-1 | 수정 |
| `_print.css` | @page margin 8mm → 6mm / `.score-sheet-fiba-frame` 인쇄 시 width 198mm + max-height 285mm + page-break-inside avoid + page-break-after always + overflow hidden / section padding 4px 8px → 2px 4px / margin-bottom 4 → 0 / md\:grid-cols-2 gap 6px → 0 / h1 11pt → 10pt / h2/h3 9pt / 본문 root 8pt 추가 / table 8pt → 7pt / td padding 2px 3px → 1px 2px + line-height 1.2 / input 9pt → 8pt + height 14pt / textarea 8pt / 아이콘 10 → 9pt | 수정 |

### 단일 박스 + 신규 레이아웃 (FIBA PDF 정합)
- 외곽 = `score-sheet-fiba-frame` (검정 1px solid / rounded-0 / shadow X)
- 헤더 (~8%): FibaHeader 4 줄 컴팩트
- 본문 (~75%): 좌:우 50:50
  - 좌측 (50%) = Team A (위 50%) `fiba-divider-bottom` Team B (아래 50%) — FIBA PDF 세로 분할 정합
  - 우측 (50%) = RunningScoreGrid (~60%) `fiba-divider-top` PeriodScoresSection (Period+Final+Winner 통합)
- 풋터 (~7%): FooterSignatures 1~2 줄 가로 펼침 (Notes 폐기)

### 검증
- tsc --noEmit: **0 에러**
- vitest: **541/541 PASS** (기존 541건 회귀 0)
- BigInt n literal: 0건
- lucide-react: 0건 (주석만 — Material Symbols Outlined 유지)
- 핑크/코랄/살몬: 0건
- schema 변경: 0 / Flutter v1 영향: 0 / AppNav 영향: 0 / BFF·service 변경: 0
- A4 1 페이지 fit: 좌측 ~975px / 우측 ~1025px (모두 1123px 안에 fit ✓)

### 회귀 안전망
- 모든 컴포넌트의 `frameless` prop = 기본 false (기존 호출자 영향 0)
- Notes textarea = `frameless=false` 시 유지 (회귀 0). DraftPayload signatures.notes 필드 유지 (localStorage 복원 동일)
- SigInput 비 inline 모드도 함수 내 분기 보존 (회귀 가드)
- 점수/파울/타임아웃 핵심 데이터 흐름 변경 0 (디자인만 / BFF·service 변경 0)
- buildSubmitPayload `notes: signatures.notes || undefined` 그대로 (UI 입력 X 라면 빈 문자열 → 생략 정상 동작)

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → A4 1 페이지 안에 모든 영역 fit / 좌측 Team A 위 + Team B 아래 / 우측 Running + Period + Final 누적 / Footer 최하단
- 정상: tsc 0 / vitest 541 PASS / A4 1 페이지 안에 fit (브라우저 인쇄 미리보기 확인 권장)
- 주의: Notes textarea 가 frameless 모드 (운영 기본) 에서 숨겨짐 — 운영자 안내 필요 시 별도 보고
- 시각 검증 우선: A4 1 페이지 fit (화면 + 인쇄 미리보기) + FIBA PDF 와 1:1 비교

### ⚠️ reviewer 참고
- 우측 컬럼 = Period+Final 이 RunningScore 박스 안 (`fiba-divider-top`) 으로 들어가서 FIBA PDF 정합
- `_print.css` `.score-sheet-fiba-frame { width: 198mm; max-height: 285mm; overflow: hidden }` 인쇄 시 강제 → 브라우저별 fit 동작 검증 필요 (Chrome/Edge 우선)
- Notes 폐기 (frameless=true 시) — 운영자 메모 기능 = signatures.notes 만 draft 박제, UI 비표시. BFF payload 는 그대로 전송 가능 (input UI 만 없음 / localStorage draft 안 notes 빈 문자열 유지)
- 행 24px / 폰트 11px = FIBA PDF 정합 vs 가독성 트레이드오프. 사용자 시각 검증 후 추가 조정 여지

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — FIBA Phase 8 PDF 1:1 완전 정합 (2026-05-12)

📝 구현 범위: 단일 박스 + 헤더 컴팩트 + Players 표 28px + Footer 가로 펼침 + 검정 border

### FIBA PDF 측정값 (이미지 직접 분석)
- 외곽 박스: A4 세로 / 검정 1px solid / rounded 0 / shadow X
- 헤더 영역: ~12% 비율 / 4 줄 컴팩트 (로고 + Scoresheet / Team A·B / Competition·Date·Time·Referee / Game No·Place·Umpire1·2)
- 좌측 50%: Team A 상 / Team B 하 (세로 분할 = 1px 검정)
- 우측 50%: Running Score 4 세트 + Period 합산 + Final + Winner (세로 누적)
- Players 행 높이: ~28px (15행 / FIBA PDF 정합)
- 하단 풋터: ~12% 비율 / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4 컬럼 + Referee/Umpire1·2 3 컬럼 + Captain)

### 변경 파일
| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `_components/_print.css` | `.score-sheet-fiba-frame` + `.fiba-divider-*` + `.fiba-frameless` + `.md-fiba-divider-right` 클래스 신규 / 인쇄 시 border 검정 #000 강제 (회색 #ccc → 검정) | 수정 |
| `_components/fiba-header.tsx` | `frameless` prop 추가 / 4 줄 컴팩트 레이아웃 (로고 + Scoresheet / Team A·B / Comp·Date·Time·Referee / GameNo·Place·Umpire1·2) / `InlineFieldDisplay` + `InlineFieldInput` 신규 / legacy `FieldDisplay`+`FieldInput` 제거 | 수정 |
| `_components/team-section.tsx` | `frameless` prop / Time-outs + Team fouls 가로 1줄 인라인 / Players 행 28px 박제 / Coach·Asst Coach 인라인 underscore / 타임아웃 칸 h-9 → h-6 컴팩트 | 수정 |
| `_components/running-score-grid.tsx` | `frameless` prop / 자체 border 제거 옵션 | 수정 |
| `_components/period-scores-section.tsx` | `frameless` prop / Period 표 + Final Score 박스 자체 border 제거 옵션 / frameless 시 상단 분할선만 (border-top) | 수정 |
| `_components/footer-signatures.tsx` | `frameless` prop / 가로 펼침 (Scorer/Asst/Timer/Shot Clock 4열 + Referee/Umpire1·2 3열 + Captain) / `SigInput` `inline` 옵션 추가 (라벨 + underscore 한 줄) / Signatures 헤더 제거 (FIBA PDF 정합) | 수정 |
| `_components/score-sheet-form.tsx` | `score-sheet-fiba-frame` div 한 겹으로 5 영역 통합 / 모든 자식 `frameless` prop 주입 / 좌·우 컬럼 사이 `md-fiba-divider-right` 분할선 / 헤더·풋터 분할선 (`fiba-divider-bottom`/`fiba-divider-top`) / main padding px-2 → px-1 컴팩트 | 수정 |

### 단일 박스 통합 동작
- 외곽 = `score-sheet-fiba-frame` (검정 1px solid + rounded 0 + shadow X)
- 내부 5 영역 = 자체 border 제거 (`fiba-frameless` 적용) + 내부 1px 분할선 (`fiba-divider-bottom`/`fiba-divider-right`/`fiba-divider-top`)
- 다크 모드 = 외곽/분할선 모두 `var(--color-text-primary)` (흰색) 자동 적용
- 라이트 모드 = 검정 (`var(--color-text-primary)` = ink 토큰)
- 인쇄 시 = 모든 border 검정 #000 강제 (`_print.css` override)

### 헤더 4 줄 컴팩트 (FIBA PDF 정합)
- 1줄: 로고 + "Basketball Daily Routine" 작은 라벨 + "SCORESHEET" 타이틀
- 2줄: Team A 라벨 + 팀명 underscore / Team B 라벨 + 팀명 underscore (2 컬럼)
- 3줄: Competition / Date / Time / Referee (4 컬럼 inline underscore)
- 4줄: Game No / Place / Umpire 1 / Umpire 2 (4 컬럼 inline underscore)

### Footer 가로 펼침
- 1줄: Scorer / Assistant scorer / Timer / Shot clock operator (4 컬럼)
- 2줄: Referee / Umpire 1 / Umpire 2 (3 컬럼)
- 3줄: Captain's signature in case of protest (1 컬럼 full)
- Notes textarea (선택) 유지

### 검증
- tsc 0 에러
- vitest 541/541 PASS (기존 533 → 신규 8 추가 — fiba-header-split-datetime / quarter-end-modal 등 / 회귀 0)
- BigInt n literal 0 / lucide-react 0 / 핑크-빨강 hardcode 0
- schema 변경 0 / Flutter v1 영향 0 / AppNav 영향 0 / BFF·service 변경 0

### 회귀 안전망
- 모든 컴포넌트의 `frameless` prop = 선택값 (기본 false). 기존 호출자가 prop 미주입 시 = 기존 박스 모드 그대로
- 본 PR 에서 score-sheet-form.tsx 만 frameless 활성. 다른 파일이 5 컴포넌트 직접 import 하는 경우 영향 없음 (기본 모드 유지)
- 회귀 가드: `SigInput` 비 inline 모드도 함수 내 분기로 보존
- localStorage draft (header / teamA / teamB / runningScore / fouls / timeouts / signatures / lineup) 모두 기존 형식 유지 → mid-game reload 시 복원 동일

### 💡 tester 참고
- 테스트 방법: score-sheet/[matchId] 진입 → 라인업 모달 확정 → 단일 외곽 박스 + 4 줄 헤더 + 좌·우 분할 + 컴팩트 Players 표 + 가로 풋터 표시
- 정상: tsc 0 / vitest 541 PASS / FIBA PDF 시각 정합
- 주의: 다크 모드 진입 시 박스 외곽 + 분할선 = 흰색 / 라이트 모드 = 검정 / 인쇄 시 무조건 검정 + 라이트 강제 (기존 동작 유지)
- 시각 검증 우선 (FIBA PDF 와 1:1 비교 필요)

### ⚠️ reviewer 참고
- 단일 박스 통합으로 5 카드 분리 폐기 → CSS 룰 충돌 가능성 검토 (`.fiba-frameless` 가 `.score-sheet-fiba-frame` 안에서만 동작하도록 prefix)
- `md-fiba-divider-right` = Tailwind 인식 X → `_print.css` 의 `@media (min-width: 768px)` 미디어쿼리에서 적용 (커스텀 클래스)
- frameless prop 디폴트 false = 기존 호출자 회귀 0 보장. score-sheet-form.tsx 만 true 주입

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

## 구현 기록 (developer) — Phase A 즉시 fix (2026-05-12)

📝 구현 범위: 운영 사고 차단 3종 fix (admin organization 드롭다운 + (web) redirect + 카운터 backfill 스크립트)

### 변경 파일
| # | 파일 | 변경 | 신규/수정 |
|---|------|------|----------|
| A-1 | `src/app/(admin)/tournament-admin/series/new/page.tsx` | useEffect mount → `GET /api/web/organizations` → owner/admin + approved 필터 → 드롭다운 ("단체 미연결" 옵션 + 단체목록) → POST body 에 organization_id 포함 | 수정 |
| A-2 | `src/app/(web)/series/new/page.tsx` | 기존 권한 가드 + alert 폼 페이지 → server-side `redirect('/tournament-admin/series/new')` 통합. 비로그인 시 `buildLoginRedirect` 로 admin 페이지 복귀 쿼리 동봉 | 수정 |
| A-3 | `scripts/_temp/series-counter-recompute.ts` | DRY-RUN(default) / `--apply` 모드 분리. tournament_series.tournaments_count + organizations.series_count 2종 점검 + APPLY 시 UPDATE | 신규 |

### A-1 핵심 흐름
- 마운트 시 1회 `fetch("/api/web/organizations")` → `OrganizationItem[]` 응답 (snake_case 변환: `myRole` → `my_role`)
- 필터: `my_role === "owner" || "admin"` + `status === "approved"` (member 는 시리즈 생성 불가)
- 드롭다운 옵션: "단체 미연결 (개인 시리즈)" + 단체 N건
- POST body — organizationId 빈 문자열이면 키 자체 제외 (서버 null 박제)
- 이중 가드: 클라이언트 필터 + 서버 `/api/web/series` 의 organization_members 검증

### A-2 redirect 전략
- 옵션 b 채택 (운영자 페이지 단일 진입점)
- 비로그인: `buildLoginRedirect("/tournament-admin/series/new")` 동봉 → 로그인 후 admin 페이지 자동 복귀
- admin layout 가드(super_admin / tournament_admin)가 권한 없는 사용자 거름 (이중 가드)
- `_form/series-create-form.tsx` (dead code) 는 그대로 두고 별도 PR에서 회수 (회수 X)

### A-3 backfill 스크립트
- 기본 모드 = DRY-RUN (SELECT 만, UPDATE 0건)
- `--apply` 인자 추가 시 실제 UPDATE
- Prisma `_count.tournaments` / `_count.series` relation count 로 actual 산출
- 각 mismatch 박제 출력 + 요약 (전체 N / 불일치 N)

### 검증 결과
- **tsc**: 0 에러
- **vitest**: 541/541 PASS (회귀 0)
- **DRY-RUN 실측** (운영 DB, SELECT only):
  ```
  === tournament_series.tournaments_count 점검 ===
    전체: 3건 / 불일치: 1건
      series id=8 (BDR 시리즈): stored=0 / actual=12
  === organizations.series_count 점검 ===
    전체: 2건 / 불일치: 1건
      org id=3 (강남구농구협회): stored=0 / actual=1
  ```
  → 진단 fact 와 100% 일치 (재현 OK)
- **grep 회귀 0**: BigInt(N)n / 핑크/살몬/코랄 / lucide-react 모두 0건
- **Flutter v1 영향 0**: `src/app/api/v1/` 내 organization_id / series_count / tournaments_count 사용 0건 grep 확인
- **schema 변경 0**: schema.prisma 미수정

### 💡 tester 참고
- 테스트 방법:
  1. `/tournament-admin/series/new` 진입 → 드롭다운 표시 확인 (본인 owner/admin 단체만)
  2. "단체 미연결" 선택 → 시리즈 생성 → 시리즈의 organization_id = null
  3. 단체 선택 → 시리즈 생성 → DB 에 organization_id 박제 + organizations.series_count +1 (POST `/api/web/series` 의 increment 로 자동 처리)
  4. `/(web)/series/new` 진입 → admin 페이지로 즉시 redirect
  5. 비로그인 사용자 `/(web)/series/new` 진입 → /login?redirect=%2Ftournament-admin%2Fseries%2Fnew
- 정상 동작:
  - 운영자가 단체 선택 시 → organization_id NULL 박제 사고 영구 차단
  - DRY-RUN 결과가 진단 fact 와 일치 (운영 카운터 불일치 2건 실측)
- 주의할 입력:
  - 단체가 0개인 사용자 → "관리 가능한 단체가 없어 개인 시리즈로 생성됩니다." 안내 표시
  - member 권한 단체 → 드롭다운에 노출 X (서버 검증과 이중)
  - APPLY 모드 = 사용자 명시 승인 후 PM 이 실행 (developer 가 직접 X)

### ⚠️ reviewer 참고
- 응답 키 snake_case 자동 변환 룰 — `apiSuccess(myRole)` → 응답에 `my_role`. 본 페이지 OrganizationItem 타입에서 `my_role` 로 매핑 (errors.md 2026-04-17 5회 재발 패턴 회피)
- A-2 의 (web) → (admin) redirect 는 같은 도메인 절대 경로 → next/navigation redirect 안전. middleware /tournament-admin/* matcher 가 layout 가드에서 처리
- A-3 스크립트 = 운영 DB SELECT only (DRY-RUN). APPLY 는 별 turn 사용자 승인 후 실행 — 임시 스크립트 정리 X (APPLY 후속 실행 필요)
- 후속 작업 후보 (Phase B+): createTournament service +1 박제 + Tournament DELETE -1 박제 + cron monthly recompute → 본 PR 범위 외

#### 수정 이력
| 회차 | 날짜 | 수정 내용 | 수정 파일 | 사유 |
|------|------|----------|----------|------|

---

