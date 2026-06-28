# MyBDR 주간 진행률 점검 — 2026-05-04 (월)

> 점검 범위: 2026-04-27 ~ 2026-05-04 (지난 7일)
> 이전 리포트: `Dev/weekly-status-2026-04-26.md`
> 플랜 캘린더상 W3 Day 2 (5/3~5/9 — 원래는 M3/M5/M6 주간이었으나 이미 4월에 완결)

## 0. 한 문장 요약

5/2 동호회최강전을 무사히 마감했고, 그 결과로 라이브/통계 정확도 개선과 신규 워크스트림 두 개(**알기자 BDR NEWS** + **매치 코드 v4**)가 실질적인 메인 작업이었습니다.

## 1. UX 워크스트림 (원래 4주 플랜)

- **이번 주 완료**: 원래 22개 작업(Q1~Q12 / M1~M7 / L1)은 04-23 시점에 모두 완결되어 이번 주 추가 작업은 없습니다 (지난 04-26 보고서대로).
- **진행 중**: 플랜 외 — admin UI 마크업 (web) 패턴 통일(Phase C-1/C-2/C-3+ 17파일), courts/teams Hero `1fr auto` 그리드 통일, app-nav BDR 로고 utility bar 이동 등 **잔여 polish**가 이번 주의 UX 성격 작업.
- **다음 주 예정**: 원래 플랜상 W4(M4·M7·L1)인데 이미 종결. L2(프로필 시각 통합) / L3(3계층 IA)는 기획서만 작성된 상태로 분기 단위 보류.
- **지연/차단**: 04-23 보고서에서 거론된 "수빈 재확인 5건"의 처리 흔적은 여전히 보이지 않음 (확인 필요).

## 2. 카페 sync 워크스트림

- **이번 주 완료**: **신규 카페 sync 커밋 0건**. 04-25 이후 운영 안정화 모드 그대로.
- **운영 인프라 현황 (확인됨)**:
  - `.github/workflows/cafe-sync.yml` — 매시간 KST 07~24 (UTC 22~15) 18회/일 실행 중. 쿠키는 `.auth/cafe-state.json` 복원 후 `DAUM_CAFE_COOKIE` 주입.
  - `vercel.json`의 cron에는 cafe-sync 미등록 — **GH Actions 단일 운영**으로 확정 (다른 5개 cron만: tournament-reminders / weekly-report / expire-pending-bookings / game-report-reminders / youtube/recommend).
  - `src/lib/cafe-sync/` 5파일(board-map / fetcher / article-fetcher / extract-fallbacks / upsert) + `scripts/sync-cafe.ts` 등 모두 정상 존재.
- **다음 주 예정**: 별도 신규 작업 없음. 운영 지표(파싱 성공률 / 쿠키 만료 / 누적 수집 건수) 첫 본격 평가 시점 — 운영 시작 후 측정 가능.
- **지연/차단**: 없음. 윈도우 일일 쿠키 갱신 산출물(`scripts/refresh-cafe-daily.{README.md,bat,task.xml}`)은 이번 주 git에 추가 반영된 것으로 추정(파일 존재 확인됨, 정확한 커밋 여부는 확인 필요).

## 3. 새 워크스트림 — 알기자(BDR NEWS bot) + 매치 코드 v4 + 5/2 D-day 후속

이번 주의 **실질적 메인 작업** 세 갈래.

### 3-1. 알기자 (BDR NEWS bot)
- Phase 1 **DB 영구 저장 마이그** — `tournament_matches.summary_brief Json?` ADD COLUMN + `auto-publish-match-brief.ts` 트리거 통합(`Promise.allSettled`로 Phase 1+2 독립 병렬) + tab-summary client fetch 제거. 5/4 backfill: completed 35매치 중 34건 UPDATE 성공 (평균 175자, 목표 적중).
- Phase 2 통합 + 후속 #2~#7 — 카드 썸네일 / regenerate / retry / 모니터링 / EXIF 추천 + linkify 헬퍼 통합(`buildLinkifyEntries` / Batch).
- 사진 업로드 정책 강화 — 매치당 15장 제한 + 클라이언트 측 압축(트래픽 80% 절감). Supabase Storage `news-photos` bucket 운영 적용.
- 사이드 사고 fix — community_posts.status 필터 부재(draft 7건 무단 노출 사고, commit `05677ed`). 회귀 방지 룰 conventions에 박제.

### 3-2. 매치 코드 v4
- Phase 1+2+3 완료 (commit `8af51eb` push + `bec591b` 미푸시).
  - P1 schema 6컬럼 (`Tournament.short_code/region_code` + `Match.match_code/category_letter/division_tier/group_letter`) — `prisma db execute` 직접 SQL 우회로 운영 무중단 적용.
  - P2 helper (`src/lib/tournaments/match-code.ts`) — 순수 함수 4종 + REGION_CODE_MAP 17 + alias 6 + CITY_TO_SIDO 26, vitest 27/27.
  - P3 backfill — 운영 2대회 61매치 (몰텐 27 case④ + 열혈 34 case①), 트랜잭션 wrap, UNIQUE 충돌 0.
- **현재 Phase 4 진행 중** — generator 4종 통합 (single elim / full league / hybrid / dual). 코드 작성 완료, **tester+reviewer 병렬 후 커밋** 단계 (미커밋 상태). 잔여 ~3.5h (Phase 5 UI 노출 + Phase 7 옵션 deep link).

### 3-3. 5/2 동호회최강전 D-day 후속
- 라이브 sticky 헤더 + 모바일 미니스코어 + 팀 비교 막대 옵션 C 정규화(commit `1f8ee19`, `7fe5963`).
- minutes-engine v3 — 출전시간 정확도 92% → 100% (Tier 3 boundary firstGap/lastGap, isStarter DB + endLineup chain). raw 알고리즘 버전 명시 룰 박제.
- live MVP 배너 BDR Game Score + tooltip, "스코어링 런" 라벨 명확화, MVP 승팀 한정.
- duel_tournament `advanceWinner` 무한 루프 corrupt 차단 + 진출 슬롯 home=away 회귀 방지 4종 가드.
- 시간 데이터 소실 매치 안내 배너 + #141 stat 14건 박제 + #145 진단.

## 4. 미푸시 또는 미완료 작업

- **매치 코드 v4 Phase 4** — developer 위임 후 코드 작성 완료, 미커밋(`bec591b`만 미푸시 P3 backfill). tester+reviewer 검증 후 커밋 + push 필요.
- **`git status`** — modified 1698줄, 대부분 `.claude/` 누적 갱신 (scratchpad / knowledge 5종 / agents/live-expert.md / handoff 등) + `.env.example` / `.env.production` / 워크플로우 / Dev 문서 다수. **CRLF↔LF 노이즈와 진짜 변경이 섞여 있어** 한번 정리 권장.
- **HOLD 큐** — 자율 QA 봇 시스템 (Phase 1~5 / 9d), BDR 기자봇 v2 (Phase 1 완료 후 Phase 2~7 대기).
- **5/2 대회 종료 후 잔여 큐** — placeholder User 86건(LOW, 본인 가입 시 mergeTempMember 자동), ttp 부족팀 5팀(MI 9 / 슬로우 8 / MZ 11 / SA 9 / 우아한 9 — 사용자 액션 대기).

## 5. PR 현황

`gh` CLI 미설치로 직접 조회 불가. git log로 본 머지 흐름:
- 이번 주 `subin → dev → main` 머지 **수회** (5/4에 admin/news 레이아웃 / admin sidebar 가드 / DataTableV2 CSS / admin Phase C-3+ / admin Phase C-1+C-2 / 사진 업로드 정책 / Supabase bucket / 알기자 후속 #2~#7 / 알기자 Phase 1 MVP / live sticky / 알기자 linkify / community status fix 등).
- subin/dev/main 3-tier 머지 흐름이 정상적으로 돌고 있음.
- 매치 코드 v4 Phase 4 PR은 아직 미생성 (커밋 자체가 미완).

## 6. knowledge 갱신 점검

지난 7일간 갱신: **매우 활발** (특히 5/4 — 13건 이상 prepend).
- architecture: 알기자 Phase 1 DB 영구 저장 마이그(05-04)
- decisions: 매치 코드 v4 prisma 결정 / 알기자 Phase 1 schema 옵션 B / 트리거 통합 allSettled / 알기자 사진 옵션 B / 도메인 sub-agent 옵션 A 채택
- conventions: prisma db execute 우회 / community_posts status 필터 의무 / LinkifyNewsBody 의무 / 알기자 사진 정규화 룰
- errors: Prisma relation camelCase ↔ schema @@map / community_posts status 사고 / Hero grid min-width 함정
- lessons: prisma generate Windows EPERM / Supabase Storage bucket 우회 / CSS Grid item min-width:auto 함정

→ **갱신 빈도 매우 양호**. 04-29 ~ 05-03 사이는 상대적으로 한산했고 **5/4에 집중적으로 누적된 패턴**.

## 7. 다음 주 우선순위 추천 1~3개

1. **매치 코드 v4 Phase 4~7 마무리 + Phase 5 UI 노출** (~3.5h, 가장 시급)
   - 사유: Phase 4 코드 작성 완료 + 미커밋 상태로 일주일 끌면 컨텍스트 휘발됨. tester+reviewer 검증 → 커밋/푸시 → Phase 5(매치 카드에 `match_code` 표시) → 옵션 Phase 7(deep link `/match/[code]`)까지 한 사이클로 마무리하면 사용자에게 즉시 가치 도달.

2. **자율 QA 봇 시스템 또는 도메인 sub-agent P2~P3 진입** (1~2일)
   - 사유: 5/4에 도메인 sub-agent 시스템 옵션 A 채택 + 시범 live-expert P1 박제 완료. KPI 측정 누적(P2 #2~#3)이 진행 중이므로 실제 개발 작업 1~2건을 의도적으로 sub-agent로 처리해 KPI 데이터 모으기 시작. P3 Go/No-Go 결정 시점이 5/18로 잡혀 있어 **이번 주가 측정 기간**.

3. **`git status` 정리 + .claude/ 누적 변경 commit/푸시** (1시간)
   - 사유: 1698줄의 modified 파일이 노이즈와 진짜 변경 섞인 채 누적 중. 일주일 더 끌면 다른 머신에서 작업 시작 시 충돌 위험. knowledge 갱신은 이미 5/4에 push 완료된 것으로 보이지만, 잔여 변경(특히 scratchpad-cafe-sync.md / scratchpad-ui.md / agents/live-expert.md / 환경파일)을 한 번에 정리.

## 8. 수빈에게 던지는 질문

- **매치 코드 v4 Phase 5 UI 노출 범위** — `/games`, `/tournaments/[id]/bracket`, `/live/[id]` 3~5 페이지 매치 카드에 `match_code` 표시 예정인데, 표시 위치(eyebrow / badge / hero meta 어디)를 사용자가 직접 지정할지, 시안 자율로 진행할지 확인 부탁드립니다.
- **5/2 대회 종료 후 잔여 큐 — ttp 부족팀 5팀** (MI/슬로우/MZ/SA/우아한)은 사용자 액션 대기 항목입니다. 운영 안정화 차원에서 다음 주 안에 한번에 처리할 시점을 정해두시면 좋겠습니다.
- 04-23 보고서의 "재확인 5건"은 design_v2 작업 흐름에 쓸려나간 듯한데, **여전히 큐에 남은 항목인지** 한번 확인 부탁드립니다 — 같은 질문이 이번이 두 번째라 명시적으로 닫고 가는 게 좋을 듯합니다.
