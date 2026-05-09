# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/10 후속 #1 + #2 — pending → scheduled 자동 전환 헬퍼 + stale pending 모니터링 cron 둘 다 박제]**

### 구현 기록 — 후속 #1 (developer)

📝 구현한 기능: stale pending 재발 방지 — 매치 update 시 (pending + homeTeam + awayTeam + scheduledAt 모두 충족) 자동으로 status="scheduled" 전환

| 파일 | 변경 | 신규/수정 |
|------|------|---------|
| `src/lib/tournaments/auto-status.ts` | `shouldAutoSchedule()` 헬퍼 + `autoScheduleAuditContext()` + `AutoScheduleTrigger` 타입 (60L) | 신규 |
| `src/app/api/web/tournaments/[id]/matches/[matchId]/route.ts` | PATCH route 가드 — 사용자 명시 status 없을 때만 trigger / context 분기 | 수정 |
| `src/lib/services/match.ts` | `updateMatch` + `updateMatchStatus` winner 진출 — 무조건 "scheduled" 박던 코드 → 헬퍼 가드 (scheduledAt 미정 시 pending 유지) | 수정 |
| `src/lib/tournaments/dual-progression.ts` | `progressDualMatch` winner/loser 진출 시 다음 매치 자동 전환 가드 | 수정 |

핵심 박제:
- 4 조건 (pending + homeTeam + awayTeam + scheduledAt 모두 NULL 아님) → 자동 scheduled
- 사용자 명시 status (예: cancelled) 우선 — 자동 전환 X (사용자 의도 보존)
- audit context "auto-schedule pending→scheduled" 명시 (admin trigger 와 구분)
- 후속 #2 cron 과 상호 보완 — 본 PR 은 update 시점 즉시 전환 / cron 은 1시간 폴링 백업

검증:
- `npx tsc --noEmit` 0 에러 ✅
- 기존 PATCH route 사용처 영향 0 (사용자 명시 status 우선 룰)
- single elim 회귀 위험 = `updateMatch`/`updateMatchStatus` 의 기존 무조건 "scheduled" → 가드 추가 (scheduledAt 미정 시 pending 유지) 의도가 맞는 변경 (의도 X 였을 가능성 높음)
- DB schema 0 / Flutter v1 0

💡 tester 참고:
- 검증 시나리오:
  1. dual_tournament 매치 (pending) — 운영자가 home + away + 일정 한꺼번에 입력 → status 자동 "scheduled"
  2. status 만 단독 변경 (예: scheduled → cancelled) — 사용자 명시 우선, 자동 전환 X
  3. 4 조건 중 하나 NULL — pending 유지 (예: 팀 둘 채웠지만 일정 미정)
  4. winner 진출 시 다음 매치가 (반대 슬롯 + 일정) 채워져 있으면 자동 scheduled
- audit 검증: tournament_match_audits 에 `auto-schedule pending→scheduled` context 박힘
- 주의 입력: cancelled → scheduled reschedule 시 → currentStatus 가 cancelled 이므로 본 룰 영향 X

⚠️ reviewer 참고:
- **`updateMatch`/`updateMatchStatus` 행위 변경**: 기존 "winner 진출 시 무조건 scheduled" → "scheduledAt 있을 때만"
  - 영향: single elim 트리에서 winner 진출 + 다음 매치 일정 미정 → 다음 매치 pending 유지 (이전엔 scheduled 박혔음)
  - 의도 맞는 변경 (scheduledAt 없는데 scheduled 는 의미 X — UI 노출 정책에도 부합)
- audit log from/to 자동 박제 (status 변경 추적 가능)

---

### 구현 기록 — 후속 #2 (developer)

📝 구현한 기능: stale pending 매치 자동 정정 cron (1시간 폴링) + admin_log audit

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| `src/app/api/cron/stale-pending-fix/route.ts` | 신규 cron — Bearer 가드 + stale pending SELECT + updateMany + admin_logs createMany (155L) | 신규 |
| `vercel.json` | crons 배열에 `stale-pending-fix` (`0 * * * *` 매시 정각) 추가 | 수정 |

핵심 박제:
- PR-B (`auto-register/[matchId]/route.ts`) `resolveSystemAdminId` 패턴 그대로 — admin_id NOT NULL FK 채우기 위해 super_admin 첫 번째 system actor
- 미래 매치만 (`scheduledAt: { gte: now }`) — 지난 pending 은 manual 검토 (cron 범위 외)
- updateMany where 절에 `status: "pending"` 가드 재확인 (race condition 방지)
- admin_logs.changes_made = { from, to, trigger, match_code, tournament_id, scheduled_at } 박제
- admin_logs createMany 실패 = silent fail (정정 자체는 성공 / audit 누락만)
- BigInt JSON 직렬화 회피 — 응답에서 m.id.toString() 변환

검증:
- `npx tsc --noEmit` 0 에러 ✅
- 운영 영향 0 (cron 추가만 / DB schema 변경 0)
- Bearer 가드 401 정상 동작 (lineup-reminder 와 동일 패턴)
- admin_logs INSERT 정합성 — action / resource_type / created_at / updated_at 필수 필드 모두 채움

회귀 영향:
| 영역 | 영향 |
|------|------|
| 기존 lineup-reminder cron | 0 (별도 path / 별도 schedule) |
| matches PATCH route (후속 #1) | 0 (cron 은 별도 폴링) |
| DB schema | 0 (admin_logs 기존 룰 사용) |
| Flutter v1 | 0 |

💡 tester 참고:
- 테스트 방법: Bearer 가드 검증 (Authorization 헤더 없이 호출 → 401)
- 정상 동작: 미래 stale pending 0건 → `{ count: 0, matches: [] }` (idle 정상)
- 주의할 입력: 미래 + pending + 양 팀 매칭됨 매치만 정정 (지난 pending 은 정정 0)
- Vercel CRON_SECRET 미설정 시 cron 401 (정상 동작 안 함)

⚠️ reviewer 참고:
- super_admin 0건 운영 DB 케이스 → admin_logs 박제 skip (silent fail / 정정 자체는 성공). 실 운영 DB 에 super_admin ≥1 보장됨 (PR-B 와 동일 가정)
- stale pending 0건 시 admin_logs.createMany 호출 0 — early return 가드
- `0 * * * *` schedule 적정성 (5분 폴링은 과함 / 1시간이면 충분)

---

main `84569c3` (PR #248 + #249). subin = dev = main 동기화 깨끗. 미푸시 0.

5/10 누적 main 머지 = **2회** (PR #246 PR-A 헬퍼 / PR #248 PR-B/C + PR4 + 매치 카드 + Tailwind 3차 fix).

운영 액션:
- ✅ `prisma db push` 동기화 (lineup_reminder_sent_at ADD COLUMN)
- ⏳ Vercel `CRON_SECRET` 환경변수 추가 (사용자 대시보드 작업 — 미완료 시 cron 401)

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — Vercel `CRON_SECRET` 환경변수 추가 (사용자 외부 작업)
- Vercel 대시보드 → Settings → Environment Variables
- `CRON_SECRET = <임의 strong string>` (예: `openssl rand -base64 32`)
- 미설정 시 `*/5 * * * *` lineup-reminder cron 401 (동작 0)
- 추가 후 5분 내 첫 발사 + Vercel Logs 확인

### 🚀 1순위 — matchId=149 시각 검증
- /live/149 새로고침 → 영상 자동 임베드 노출 확인 (`7YboUxk5Nkw` LIVE)
- 모바일 sticky / PC PIP 동작 검증

### 🚀 2순위 — Flutter PR6 (사용자 본인 작업)
- `Dev/lineup-pr6-flutter-prompt-2026-05-10.md` §2 프롬프트 본문 → Flutter AI 인스턴스 전달
- starter_select_screen.dart `_loadData()` 자동 매핑 박제

### 🚀 3순위 — 라이브 자동 트리거 운영 검증 (cron 발사 후)
- 윈도우 ±10분 매치 진입 시 30초 폴링 작동 확인
- 운영자 토스트 노출 (isAdmin)
- rate limit 분당 6회 한도 검증

### 🚀 4순위 — PortOne 본인인증 운영 활성화 (계속 보류)
- PortOne 콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가

### 🚀 5순위 — PlayerMatchCard 글로벌 재사용 확장 / Phase 3 (cron 활성화 시) / manage 탭 그룹화

---

## 🟡 HOLD / 우선순위 압축
- **HOLD**: 자율 QA 봇 / BDR 기자봇 v2 (Phase 2~7)
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 라이브 YouTube 임베딩 (모바일 sticky / PC PIP) | ✅ main 배포 |
| 라이브 YouTube 자동 트리거 (PR-A/B/C) | ✅ main 배포 (Vercel CRON_SECRET 대기) |
| 사전 라인업 PR1~5 (web 측 종단) | ✅ main 배포 |
| 사전 라인업 PR4 Vercel Cron | ✅ main 배포 (Vercel CRON_SECRET 대기) |
| 사전 라인업 PR6 (Flutter 클라) | ⏳ 사용자 본인 작업 |
| 매치 카드 패널 (네이버 패턴) | ✅ main 배포 |
| 매치 148/149 자동 등록 시연 | ✅ DB 박제 완료 |
| 운영자 CTA 미스터리 | ✅ 버그 X (errors.md 박제) |
| Tailwind .md scan 함정 3차 fix | ✅ main 배포 |
| BDR-current Live.jsx PIP 시안 박제 | ✅ main 배포 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-09 | subin (미커밋) | **YouTube 자동 매칭 cron 라우트 신규 + vercel.json 5분 주기 등록** — `src/app/api/cron/youtube-auto-match/route.ts` 신규 (507L) + vercel.json crons +1 entry. v3 알고리즘 inline 복제 (batch script 와 정합 — 같은날 only / 80점 임계값) / 1:1 매핑 가드 (DB 기존 video_id pool 제외) / admin_logs createMany / Bearer CRON_SECRET 가드. tsc 0 에러. Flutter v1 영향 0. CRON_SECRET 이미 lineup-reminder 가 사용 중 — 추가 사용자 액션 0. | ⏳ 커밋 대기 |
| 2026-05-10 | subin (미커밋) | **후속 #1 — pending → scheduled 자동 전환 헬퍼 박제** — `auto-status.ts` 신규 + matches PATCH route + services/match.ts (updateMatch/updateMatchStatus) + dual-progression.ts 4 위치 박제. 4 조건 가드 (pending + homeTeam + awayTeam + scheduledAt). tsc 0 에러. 후속 #2 cron 과 상호 보완 (update 시점 즉시 + 1시간 폴링 백업). | ⏳ 커밋 대기 |
| 2026-05-10 | main `84569c3` (PR #249) | **PR-B/C 라이브 자동 트리거 + 사전 라인업 PR4 + 매치 카드 + Tailwind 3차 fix** — 5 commit (a490556 PR-B / 21d3783 매치 카드 / 8d5d660 Tailwind / a32ecf9 PR4 / 12e9159 docs). matchId=149 자동 등록 시연 (125점). prisma db push 동기화. CRON_SECRET 사용자 액션 대기. | ✅ |
| 2026-05-10 | main `c62994b` (PR #247) | **PR-A scoreMatch 헬퍼 추출 + 자동 트리거 설계 보고서 + Live.jsx 시안 박제** — 2 commit (ab12cd9 PR-A / d9d0ebf 시안). search route -113L 리팩 / 회귀 0. | ✅ |
| 2026-05-09 | main `a80845c` (PR #245) | **5/9~10 누적 일괄 — 라이브 YouTube 임베딩 (모바일 sticky / PC PIP) + 사전 라인업 PR3~5 + Flutter PR6 핸드오프 2종** — 9 commit. matchId=148 자동 등록 시연. errors.md `[2026-05-10] sticky 모바일 미작동` 박제. | ✅ |
| 2026-05-09 | main 8회 (`02f7d0e`~`76bf5f3`) | **5/9 단일 일 main 8회 신기록** — PhoneInput 마이그 100% (13 input) + 시안 갭 fix 100% (10 페이지) + 공개프로필 NBA Phase 1+2 + 내농구 super-set (10 영역) + 사전 라인업 PR1+PR2 + 라이브 YouTube PR4+PR5 + getDisplayName 통일 + YouTube batch v3. | ✅ |
| 2026-05-08 | main 7회 (`c6a6848`~`118c9f1`) | **5/8 main 7회** — PR3 layout 가드 mock + 본인인증 mock 자체 입력 폴백 + PhoneInput 전역 컴포넌트 + 디자인 박제 11 commit. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3`~`168be48`) | **5/7 단일 일 신기록 21회** — Onboarding 10단계 + PortOne V2 + Phase A.5. | ✅ |
| 2026-05-06 | main `4253e68` | **5/6 PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄** | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계) — 복원: git log -- .claude/scratchpad.md -->
