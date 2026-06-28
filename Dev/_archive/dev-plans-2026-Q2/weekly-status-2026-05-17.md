# MyBDR 주간 진행률 점검 — 2026-05-17 (일)

> 점검 범위: 2026-05-10 ~ 2026-05-17 (지난 7일)
> 이전 리포트: `Dev/weekly-status-2026-05-04.md`
> 플랜 캘린더상 W5+ 진입 (원래 4주 UX 플랜은 4/19~5/16 완결 — 이번 주부터는 L2/L3 장기 과제 + 카페 안정화 모니터링 단계)

## 0. 한 문장 요약

이번 주는 강남구협회장배 유소년부 운영을 떠받치는 score-sheet(FIBA 종이 기록지) 정합성 + 대진표 generator(PR-G5 시리즈) + admin 흐름 개선(PR-Admin 1~6)이 사실상 메인 작업이었고, 원래 UX/카페 두 워크스트림은 4월에 이미 마무리된 상태라 신규 활동은 없습니다.

## 1. UX 워크스트림 (원래 4주 플랜)

- **이번 주 완료**: 원래 22개 작업(Q1~Q12 / M1~M7 / L1)은 04-23 시점에 모두 완결되어 이번 주 추가 작업 0건입니다 (지난 5/4 보고서와 동일).
- **진행 중**: 플랜 외 — score-sheet UI/UX 일괄 박제(설명서 모달 / 영역 통일 / Bench Tech UI / 토글·아이콘 정합), 강남구 운영 디자인 fix(종별 칩 / 일정 카드 메타 / Hero), admin 흐름 개선 6 PR.
- **다음 주 예정**: 원래 플랜상 W5+ — L2(본인/타인 프로필 시각 통합) / L3(단체-시리즈-대회 3계층 IA)는 기획서만 작성된 상태로 분기 단위 보류. 정식 진입 시점 사용자 결정 필요.
- **지연/차단**: 04-23 / 05-04 보고서에서 두 번 거론된 "재확인 5건"은 여전히 명시적 처리 흔적이 없습니다 (확인 필요 — 세 번째 언급).

## 2. 카페 sync 워크스트림

- **이번 주 완료**: **신규 카페 sync 커밋 0건**. 4/25 이후 운영 안정화 모드 그대로.
- **운영 인프라 현황 (재확인)**:
  - `.github/workflows/cafe-sync.yml` — 시간당 KST 07~24 18회/일 실행 중 (`cafe-sync-verify.yml` 보조 워크플로우 동시 운영)
  - `src/lib/cafe-sync/` 5파일(board-map / fetcher / article-fetcher / extract-fallbacks / upsert) + `scripts/sync-cafe.ts` 존재 확인
  - `vercel.json` cron 항목에 cafe-sync **미등록** = GH Actions 단일 운영 확정 (계획서 Phase 3.1 Vercel Cron 진입 안 함, 의식적 선택)
  - `src/app/api/cron/cafe-sync/` 디렉토리 없음 — 원래 계획의 Vercel Cron 엔드포인트는 도입하지 않은 채로 GH Actions 단일 흐름으로 안정화한 상태
- **다음 주 예정**: 별도 신규 작업 없음. 운영 지표(파싱 성공률 / 쿠키 만료 / 누적 수집 건수) **운영 시작 후 측정 가능**.
- **지연/차단**: 없음. 다만 04-19 계획서의 P3.4 (admin 카페 동기화 모니터링 페이지)와 P3.5 (Slack 알림)은 진입하지 않은 상태가 유지되고 있습니다 — 운영자가 별도 모니터링 페이지 없이 GH Actions Job 로그로 직접 확인 중이라면 그대로 두는 것이 맞아 보이지만, 사용자 결정이 필요한 항목입니다.

## 3. 새 워크스트림 — 이번 주의 실질적 메인 작업 4갈래

### 3-1. score-sheet (FIBA 종이 기록지) — Phase 19 / 22 / 23 + Bench Tech + Delay of Game

- 이번 주 가장 큰 워크스트림. **+25 커밋 이상** (score-sheet 직접 commit만 셈).
- **Bench Technical (B/C) + Delay of Game (W/T) 박제** (사용자 결재 권장안 100%): FIBA Article 36.3 / 36.4 / 36.2.3 종이 양식 박제. 신규 4파일 / 수정 7파일 / +1,445 LOC. `bench-tech-helpers.ts` 추방 가드 + W→T 자동 분기 + `BenchTechModal` UI + PBP action_subtype 5종 신규(C / B_HEAD / B_BENCH / DELAY_W / DELAY_T). tsc 0 / vitest 18/18 PASS. 1차/2차/3차 수정 (시인성 + 위치 + 설명서)까지 완료.
- **PR-Public-1 공개 bracket 탭 종별 view** (강남구협회장배 6 종별 / 36 팀 / 59 매치). 신규 3 컴포넌트 + API 확장 (+48). 3 commit (본체 + fix1 isDual + fix2 isLeague).
- **score-sheet 잡다한 fix** — Delay/벤치T 시인성 사용자 보고 #170/#171, 설명서 모달 신규 3 섹션, 임시 번호 super_admin 우회 분기, PBP 정렬 3차 tiebreak created_at ASC.

### 3-2. 대진표 generator (PR-G5 시리즈) — 강남구협회장배 순위전 13건 사고 영구 차단

- **PR-G5** (commit `eba655d`) `placeholder-helpers.ts` 신규 — `buildSlotLabel` 5 kind + `buildPlaceholderNotes` + `parseSlotLabel`. `planLeague` / `planGroup` 순수 함수 + `generateLeague` / `generateGroup` DB INSERT idempotent. 6 format 보강.
- **PR-G5.2 dual generator** placeholder-helpers 통과 (인라인 박제 12건 → `buildSlotLabel` 호출 변환 / 신규 SlotKind `group_match_result`).
- **PR-G5.5-followup** Tournament 단위 placeholder applier 분리 + 매치 PATCH route division_rule 분기 advancer 자동 호출 통합.
- **PR-G5.5-NBA-seed** 8강/4강 NBA 시드 표준 generator (opt-in / `seedingMode='nba'`).
- **PR-G5.8** swiss generator R1 박제 + R(N) endpoint stub (옵션 B). Dutch + Buchholz + 최근 대전 회피.
- 회귀 0 / vitest 240/240 / tsc 0 일관 유지.

### 3-3. admin 흐름 개선 6 PR (PR-Admin 1~6)

Phase 0 점검 보고서 `Dev/admin-flow-audit-2026-05-16.md` (231줄 / 18건 인벤토리 / 영향도 H 8건) 작성 후 Phase 1 6 PR 박제 (총 +3,060 LOC):
- **PR-Admin-1** NextStepCTA 컴포넌트 + 3 페이지 박제
- **PR-Admin-2** matches 단일 순위전 trigger AdvancePlayoffsButton
- **PR-Admin-3** placeholder 검증 배너 (강남구 사고 영구 차단)
- **PR-Admin-4** bracket 종별별 generator trigger (별도 endpoint)
- **PR-Admin-5** SetupChecklist 종별 + 운영방식 카드 통합 (8→7)
- **PR-Admin-6** /playoffs 신규 hub (5 섹션 + 재사용 컴포넌트 4종)

옵션 B PM 직접 검증 모드 적용 (PR당 30~40분→15~20분 단축). 회귀 0.

### 3-4. 강남구협회장배 운영 / 통합 마법사 / hotfix

- 강남구협회장배 유소년부 36 팀 + Tournament 로고 일괄 박제 (commit `ade2cd4`)
- 통합 마법사 Phase 1+5 A+B+C — `last-edition` API 신규 + editions 확장 + retry 보강 + `@@unique([series_id, edition_number])` 운영 적용 (96ms, raw CREATE UNIQUE INDEX)
- 운영 hotfix 다수: `updateTeamStandings` SET 방식 변환 (다중 path 호출 idempotent), 순위전 매치 standings 제외 + advancer 예선 종료 가드 (2 사고 영구 fix), `apiToken` 자동 발급 누락 fix, 코치 명단 제출 500 hotfix (등번호 array unique 3중 가드)

## 4. 미푸시 또는 미완료 작업

- **git status 명령 자체 실패**: `fatal: unknown index entry format 0xc9480000` — Windows에서 작성된 git 인덱스를 Linux 컨테이너가 읽지 못해 미푸시 변경 직접 확인 불가. 추정: scratchpad "🟢 박제 완료 — PM이 commit / push 즉시 처리(사용자 명시 자동 머지)" 상태로 들어가 있어 본 작업 큐는 비어있는 것으로 보입니다 (확인 필요).
- **score-sheet score-sheet Bench Tech / Delay 박제** — scratchpad상 PM 단계까지 완료, 커밋/푸시 직전 또는 직후. 가장 최근 커밋 5건이 score-sheet 설명서 fix(`4829360` ~ `f3d7b96`)인 점으로 미루어 본체는 푸시 완료된 것으로 추정.
- **장기 HOLD 큐** — L2 프로필 시각 통합 / L3 3계층 IA / 자율 QA 봇 / BDR 기자봇 v2 / Phase 7 옵션 deep link `/match/[code]`.

## 5. PR 현황

`gh` CLI 미설치로 직접 조회 불가. git log 머지 흐름:
- 이번 주 `subin → dev → main` 머지 매우 활발 — PR #557 ~ #581 사이 약 25개 PR 흐름. 머지 페이스가 빠르고 정상적.
- 가장 최근 머지: `#581 from cobby8/subin` (score-sheet 설명서 i3 자동 → 전후반 모드 일반 설명).
- PR 자체 메타데이터(상태/라벨/리뷰어)는 `gh` 인증 필요.

## 6. knowledge 갱신 점검

지난 7일간 갱신: **매우 활발**. `index.md` 마지막 갱신 2026-05-16 (PR-Public-1 + 본 세션 push 16 commit). 항목 누적: decisions.md 119, conventions.md 52, lessons.md 49, errors.md 49.

이번 주 신규 박제:
- **decisions**: PR-Public-1 / Phase 1 admin 6 PR / PR-G5.8 swiss / PR-G5.5-followup-B 매치 PATCH / PR-G5.5-NBA-seed / PR-G5.2 dual / PR-G5.5-followup Tournament 단위 placeholder / 매치 코드 PR-G5 강남구 사고 후속 다수
- **lessons**: admin 흐름 점검 Phase 0 → Phase 1 패턴 / developer agent 거짓 보고 사고 (1차 영구 차단 rule prefix + 자가 진단 5건 의무)
- **conventions**: PM git add 전 git status staged 점검 / PM agent 결과 인수 git diff 실측 검증 의무
- **errors**: Flutter "Token parameter required" / wizard status enum mismatch / TournamentTeamPlayer 등번호 unique 3중 누락

→ **갱신 빈도 매우 양호**. 권장 사항 없음.

## 7. 다음 주 우선순위 추천 1~3개

1. **L2 + L3 정식 진입 시점 결정** (사용자 결정 의존 — 30분)
   - 사유: 원래 4주 UX 플랜이 5/16에 종결되었고 W5+ 구간 진입했지만 L2(프로필 시각 통합 ~15시간) / L3(3계층 IA ~12시간) 기획서는 아직 책장에 머물러 있습니다. 운영 도메인(강남구·score-sheet)의 긴급 작업이 마무리되어가는 지금이 분기 단위 장기 과제를 진입할 자연스러운 분기점 — 사용자가 이번 분기 진입할지, 다음 분기로 미룰지 결정해주시면 큐를 정리할 수 있습니다.

2. **score-sheet + 대진표 generator + admin 흐름 = 3 도메인 회귀 시험 한 사이클** (~2시간)
   - 사유: 이번 주 한 도메인 안에서 PR 8~10개 동시 박제가 이어졌고 회귀 0 보장 노력은 reviewer/tester에서 했지만, 강남구협회장배 운영(현재 진행 중) 시나리오를 §3 단계별로 한 번 통합 점검하는 시간이 가치 있습니다. Phase 0 점검 보고서 `Dev/admin-flow-audit-2026-05-16.md` 의 18건 인벤토리 중 영향도 H 8건 확실히 fix됐는지 운영 시나리오로 재검증.

3. **카페 sync — admin 모니터링 UI 진입 여부 결정** (사용자 결정 의존 — 30분)
   - 사유: 운영 시작 후 4주가 지났고 GH Actions Job 로그만으로 모니터링 중인 상태. 누적 수집 건수/파싱 성공률/쿠키 만료 알림을 1개 페이지에서 보고 싶은 시점이 왔는지 확인 — 진입한다면 04-19 계획서 P3.4 + P3.5(Slack) 우선 (~2.5h).

## 8. 수빈에게 던지는 질문

- **L2 / L3 장기 과제** — 이번 분기(2026 Q2) 안에 진입하실 의향이 있으신가요, 아니면 강남구협회장배 운영이 마무리될 때까지 미뤄두는 게 맞을까요? L3는 단체-시리즈-대회 IA 명확화라 score-sheet/admin 흐름과 맞물려 있어 지금 진입하는 게 시너지 큽니다.
- **카페 sync admin UI / Slack 알림** — 지금 운영 4주차인데 알림/모니터링 없이도 별 이슈 없으셨는지요? 진입할지 그대로 둘지 결정해주시면 큐 정리됩니다.
- **04-23 / 05-04 두 번 거론된 "재확인 5건"** — 세 번째 언급입니다. design_v2 작업 흐름에 흡수되어 닫힌 항목인지, 아직 큐에 남은 항목인지 명시적으로 닫고 가는 게 좋겠습니다.
- **score-sheet Bench Tech / Delay 박제 통합 테스트** — 운영 시합에서 실제 코치 추방 1회 / Delay W→T 분기 1회를 직접 사용해보셨는지요? 운영 검증 1차 결과를 받아두면 이후 보강이 빠릅니다.
