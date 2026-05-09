# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/10 마무리 — 라이브 자동 트리거 + 사전 라인업 PR4 main 배포 완료]**

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
| 2026-05-10 | main `84569c3` (PR #249) | **PR-B/C 라이브 자동 트리거 + 사전 라인업 PR4 + 매치 카드 + Tailwind 3차 fix** — 5 commit (a490556 PR-B / 21d3783 매치 카드 / 8d5d660 Tailwind / a32ecf9 PR4 / 12e9159 docs). matchId=149 자동 등록 시연 (125점). prisma db push 동기화. CRON_SECRET 사용자 액션 대기. | ✅ |
| 2026-05-10 | main `c62994b` (PR #247) | **PR-A scoreMatch 헬퍼 추출 + 자동 트리거 설계 보고서 + Live.jsx 시안 박제** — 2 commit (ab12cd9 PR-A / d9d0ebf 시안). search route -113L 리팩 / 회귀 0. | ✅ |
| 2026-05-09 | main `a80845c` (PR #245) | **5/9~10 누적 일괄 — 라이브 YouTube 임베딩 (모바일 sticky / PC PIP) + 사전 라인업 PR3~5 + Flutter PR6 핸드오프 2종** — 9 commit. matchId=148 자동 등록 시연. errors.md `[2026-05-10] sticky 모바일 미작동` 박제. | ✅ |
| 2026-05-09 | main 8회 (`02f7d0e`~`76bf5f3`) | **5/9 단일 일 main 8회 신기록** — PhoneInput 마이그 100% (13 input) + 시안 갭 fix 100% (10 페이지) + 공개프로필 NBA Phase 1+2 + 내농구 super-set (10 영역) + 사전 라인업 PR1+PR2 + 라이브 YouTube PR4+PR5 + getDisplayName 통일 + YouTube batch v3. | ✅ |
| 2026-05-08 | main 7회 (`c6a6848`~`118c9f1`) | **5/8 main 7회** — PR3 layout 가드 mock + 본인인증 mock 자체 입력 폴백 + PhoneInput 전역 컴포넌트 + 디자인 박제 11 commit. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3`~`168be48`) | **5/7 단일 일 신기록 21회** — Onboarding 10단계 + PortOne V2 + Phase A.5. | ✅ |
| 2026-05-06 | main `4253e68` | **5/6 PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄** | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계) — 복원: git log -- .claude/scratchpad.md -->
