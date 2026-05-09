# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/10 종료 — 17 PR main 배포 신기록]**

main 최종 = `0d7ddf4` (PR #290). subin = dev = main 동기화 깨끗. 미푸시 0.

5/10 누적 main 머지 = **17회** (5/9 8회 신기록 갱신).

운영 액션:
- ✅ `prisma db push` 동기화
- ✅ Vercel `CRON_SECRET` 환경변수 설정 + 재배포
- ✅ matchId=149 시각 검증 완료
- ✅ 자동 트리거 운영 검증 완료
- ⏳ Flutter PR6 (사용자 본인 별도 세션)

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — Flutter PR6 (사용자 본인 작업 — 별도 세션)
- `Dev/lineup-pr6-flutter-prompt-2026-05-10.md` §2 프롬프트 → Flutter AI 인스턴스 전달
- starter_select_screen.dart `_loadData()` 자동 매핑 박제

### 🟡 보류
- PortOne 본인인증 운영 활성화 (콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가)
- PlayerMatchCard 글로벌 재사용 확장
- Phase 3 (UserSeasonStat / Splits / ShotZoneStat cron 활성화 시)
- manage 탭 그룹화 / game.game_type / 매치 코드 v4 Phase 6

---

## 🟡 HOLD / 우선순위 압축
- **HOLD**: 자율 QA 봇 / BDR 기자봇 v2 (Phase 2~7)
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지

---

## 구현 기록 (developer · 2026-05-10 PlayerLink/TeamLink 2단계)

📝 구현한 기능: 1순위 페이지 (라이브 / 매치 결과 / 매치 카드) 박스스코어·hero scoreboard 선수명/팀명 하이퍼링크 마이그.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/api/live/[id]/route.ts` | users select 에 id 추가 (3 위치) + PlayerRow user_id 필드 + MVP user_id 필드 + 진행중/종료 분기 데이터 채우기 | 수정 |
| `src/app/live/[id]/page.tsx` | PlayerRow / mvp_player 타입 user_id 추가 + import {TeamLink, PlayerLink} + TeamBlock 큰 팀명 1·쿼터테이블 팀명 2·BoxScoreTable 활성/DNP 이름 2 = TeamLink 3·PlayerLink 2 | 수정 |
| `src/app/live/[id]/_v2/game-result.tsx` | PlayerRowV2 / MvpPlayerV2 user_id 타입 추가 (직접 사용처는 box-score-table·mvp-banner) | 수정 |
| `src/app/live/[id]/_v2/hero-scoreboard.tsx` | import TeamLink + TeamScoreBlock 큰 팀명 (홈/원정 2) + 쿼터테이블 좌측 팀명 (홈/원정 2) = TeamLink 4 | 수정 |
| `src/app/live/[id]/_v2/box-score-table.tsx` | import PlayerLink + 활성 행 이름 셀 + DNP 행 이름 셀 = PlayerLink 2 | 수정 |
| `src/app/live/[id]/_v2/mvp-banner.tsx` | import PlayerLink + MVP 이름 = PlayerLink 1 (style props 패턴) | 수정 |

**적용 카운트**:
- TeamLink 7개 (page.tsx 3 / hero-scoreboard 4)
- PlayerLink 5개 (page.tsx 2 / box-score-table 2 / mvp-banner 1)

**미적용 (의도적)**:
- `live-match-card.tsx` — 부모 카드 자체가 `<Link href="/live/{id}">` (매치 페이지 이동) 이므로 안에 `<TeamLink>` (또 다른 `<a>`) 를 넣으면 nested `<a>` HTML 위반 + Next.js Link warning. 사용자 spec 에 언급되었으나 기술 제약으로 적용 보류 → tester / PM 결재 시 onClick + e.stopPropagation 우회 가능 (별도 컴포넌트 변형 필요).
- 모바일 미니스코어 헤더 약칭 (page.tsx L1119/1124) — spec 권장 "링크 미적용". 약칭 좁아 클릭 영역 부적합.
- TeamLogo 자체 (page.tsx) — 텍스트만 link, 로고는 클릭 영역 X (spec 결정).

💡 tester 참고:
- 테스트 방법:
  1. `/live/149` 종료 매치 (GameResultV2) → hero scoreboard 양 팀명 / MVP 이름 / 박스스코어 활성 선수 / DNP 선수 클릭 → 각각 `/teams/{id}` / `/users/{id}` 이동 확인.
  2. `/live/{진행중 매치 id}` (scheduled/ready/live) → page.tsx hero scoreboard 큰 팀명 (TeamBlock) / 쿼터테이블 팀명 / 박스스코어 선수 이름 클릭 → 동일 라우팅 확인.
  3. placeholder ttp (user_id NULL — 예: 게스트 선수) → 클릭 시 이동 X / hover underline X (span fallback) 확인.
  4. 다크모드 + 라이트모드 색상 / hover underline / opacity-80 정상.
  5. 모바일 (iOS Safari) + PC (Chrome) 양 환경 터치/클릭.
- 정상 동작:
  - 정상 user_id 있는 선수 클릭 = `/users/{id}` 진입.
  - 정상 team_id 있는 팀 클릭 = `/teams/{id}` 진입.
  - 색상/폰트/사이즈 = 1단계 직전과 동일 (TeamLink/PlayerLink 가 부모 색·폰트 상속).
- 주의할 입력:
  - placeholder ttp (player_name 만 있는 선수) — 링크 비활성 + span fallback (1단계 보장).
  - 매치 종료 직후 폴링 시 `user_id` undefined 가능성 — 컴포넌트가 `!userId` 분기로 자동 span fallback.

⚠️ reviewer 참고:
- API `route.ts` users select 3 위치에 id 추가 = SELECT 페이로드 미미 증가 (PK 1개 / per row).
- `match.playerStats` 의 toPlayerRow 안 `user?.id` 접근 — user 가 NULL 인 케이스 (외래 user 삭제) 도 `null` 정상 fallback.
- live-match-card.tsx 미적용 사유 = nested `<a>` 회귀 회피 — PM 결재 시 별도 PR 변형 가능.
- 회귀 영향 0 검증: tsc 통과 / className·style 모두 그대로 / Flutter v1 API 영향 0 (`/api/v1/...` 미변경) / DB schema 0.

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 라이브 YouTube (임베딩+자동트리거+자동매칭cron) | ✅ main 배포 |
| 사전 라인업 PR1~5 (web) | ✅ main 배포 / PR6 (Flutter) ⏳ 사용자 별도 세션 |
| 매치 카드 패널 (네이버 패턴) + 자동 등록 시연 | ✅ main 배포 |
| stale pending 자동 전환 (#1+#2) | ✅ main 배포 |
| **모바일 박스스코어 PDF 저장 (Fix A→D + 양식 동등)** | ✅ main 배포 |
| **PlayerLink/TeamLink 1단계 (글로벌 컴포넌트 박제)** | ✅ main `b4e437d` 배포 |
| **PlayerLink/TeamLink 2단계 (1순위 라이브 페이지 마이그)** | ⏳ 미커밋 / tsc 통과 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-10 | (미커밋) | **PlayerLink/TeamLink 2단계 — 1순위 라이브 페이지 마이그** — API `route.ts` PlayerRow + MVP 응답 user_id 추가 (homeTeam/awayTeam/playerStats users.id select 확장). 프론트 4 파일: page.tsx (TeamBlock 큰 팀명 + 쿼터테이블 팀명 2 + BoxScoreTable 활성/DNP 이름 2 = TeamLink 3개·PlayerLink 2개), hero-scoreboard.tsx (TeamScoreBlock + 쿼터테이블 팀명 = TeamLink 4개), box-score-table.tsx (활성/DNP 이름 = PlayerLink 2개), mvp-banner.tsx (MVP 이름 = PlayerLink 1개). game-result.tsx PlayerRowV2/MvpPlayerV2 user_id 타입만 추가. live-match-card.tsx 미적용 (부모 카드 자체가 매치 페이지 Link → nested `<a>` 회피). | ✅ tsc 0 에러 |
| 2026-05-10 | main `b4e437d` | **PlayerLink / TeamLink 글로벌 컴포넌트 박제 (1단계)** — `src/components/links/{player-link,team-link}.tsx` 신규 (71L+56L). userId/teamId BigInt→/users·/teams 라우트, null 시 span fallback (placeholder ttp 대응). hover:underline+opacity-80 (시각 산만 방지). 회귀 영향 0 (사용처 0). 후속 PR 점진 마이그 진입 준비. | ✅ tsc |
| 2026-05-10 | main `0d7ddf4` (PR #290) | **PDF 양식 PC 프린트 동등 — 상단 정렬 + spacing 동등 (시리즈 종료)** | ✅ |
| 2026-05-10 | main 시리즈 (#266 ~ #288) | **모바일 박스스코어 PDF 저장 시리즈 11 PR** — Fix A→B→C 미작동 → Fix D html2canvas+jspdf 근본 해결 / 프린트·PDF 버튼 분리 / 섹션별 페이지 분할 / globals.css single source 통합 / Loading overlay / inline width fallback / errors.md 박제 ("모바일 print = window.print 금지 / 클라이언트 PDF 라이브러리 강제") | ✅ |
| 2026-05-10 | main 시리즈 (#260 ~ #265) | **stale pending 자동 전환** — 후속 #1 (auto-status.ts 헬퍼 + matches PATCH + services/match + dual-progression 4 위치) + 후속 #2 (cron stale-pending-fix 1시간 폴링) + YouTube 자동 매칭 cron 5분 (사용자 직접) | ✅ |
| 2026-05-10 | DB 작업 (commit 무관) | **아울스 (teamId=220) #64 김용우 등록** — userId=3400 / G / ttpId=2846. 이하성 (#4 / userId=3162) 실명 user.name 이미 박제. **stale pending 3건 정정** (matchId 150/151/152 → scheduled). | ✅ |
| 2026-05-10 | main `84569c3` (PR #248+#249) | **PR-B/C 자동 트리거 + 사전 라인업 PR4 + 매치 카드 + Tailwind 3차 fix** | ✅ |
| 2026-05-10 | main `c62994b` (PR #246+#247) | **PR-A scoreMatch 헬퍼 추출 + 자동 트리거 설계 보고서 + Live.jsx 시안 박제** | ✅ |
| 2026-05-09 | main `a80845c` (PR #244+#245) | **5/9~10 누적 일괄 — 라이브 YouTube 임베딩 + 사전 라인업 PR3~5 + Flutter PR6 핸드오프** — matchId=148 자동 등록 시연. errors.md sticky 모바일 미작동 박제. | ✅ |
| 2026-05-09 | main 8회 (`02f7d0e`~`76bf5f3`) | **5/9 단일 일 main 8회 신기록** — PhoneInput 마이그 100% + 시안 갭 fix + 공개프로필 NBA + 내농구 super-set + 사전 라인업 PR1+PR2 + 라이브 YouTube PR4+PR5 | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 / 5/6 PR1e DROP COLUMN + UI fix 13건 / 5/7 main 21회 신기록 Onboarding 10단계 + PortOne V2 + Phase A.5 / 5/8 main 7회 PR3 mock + PhoneInput + 시안 11 commit) — 복원: git log -- .claude/scratchpad.md -->
