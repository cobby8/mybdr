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

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 라이브 YouTube 임베딩 (모바일 sticky / PC PIP) | ✅ main 배포 |
| 라이브 YouTube 자동 트리거 (PR-A/B/C) | ✅ main 배포 + cron 정상 작동 검증 |
| 사전 라인업 PR1~5 (web 측 종단) | ✅ main 배포 |
| 사전 라인업 PR4 Vercel Cron | ✅ main 배포 + CRON_SECRET 설정 완료 |
| 사전 라인업 PR6 (Flutter 클라) | ⏳ 사용자 본인 별도 세션 |
| 매치 카드 패널 (네이버 패턴) | ✅ main 배포 |
| 매치 148/149 자동 등록 시연 | ✅ DB + 시각 검증 완료 |
| 운영자 CTA 미스터리 | ✅ 버그 X (errors.md 박제) |
| Tailwind .md scan 함정 3차 fix | ✅ main 배포 |
| BDR-current Live.jsx PIP 시안 박제 | ✅ main 배포 |
| 아울스 #64 김용우 등록 / 이하성 실명 박제 | ✅ DB |
| stale pending 자동 전환 (후속 #1 + #2) | ✅ main 배포 |
| YouTube 자동 매칭 cron (5분) | ✅ main 배포 |
| **모바일 박스스코어 PDF 저장 (Fix A→D + 양식 동등)** | ✅ main 배포 (PC 프린트 동등 / 상단 정렬 / spacing 동등) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-10 | (미커밋) | **PlayerLink / TeamLink 글로벌 컴포넌트 박제 (1단계)** — `src/components/links/{player-link,team-link}.tsx` 신규 (71L+56L). userId/teamId BigInt→/users·/teams 라우트, null 시 span fallback (placeholder ttp 대응). hover:underline+opacity-80 (시각 산만 방지). 회귀 영향 0 (사용처 0). 후속 PR 점진 마이그 진입 준비. | ✅ tsc |
| 2026-05-10 | main `0d7ddf4` (PR #290) | **PDF 양식 PC 프린트 동등 — 상단 정렬 + spacing 동등 (시리즈 종료)** | ✅ |
| 2026-05-10 | main 시리즈 (#266 ~ #288) | **모바일 박스스코어 PDF 저장 시리즈 11 PR** — Fix A→B→C 미작동 → Fix D html2canvas+jspdf 근본 해결 / 프린트·PDF 버튼 분리 / 섹션별 페이지 분할 / globals.css single source 통합 / Loading overlay / inline width fallback / errors.md 박제 ("모바일 print = window.print 금지 / 클라이언트 PDF 라이브러리 강제") | ✅ |
| 2026-05-10 | main 시리즈 (#260 ~ #265) | **stale pending 자동 전환** — 후속 #1 (auto-status.ts 헬퍼 + matches PATCH + services/match + dual-progression 4 위치) + 후속 #2 (cron stale-pending-fix 1시간 폴링) + YouTube 자동 매칭 cron 5분 (사용자 직접) | ✅ |
| 2026-05-10 | DB 작업 (commit 무관) | **아울스 (teamId=220) #64 김용우 등록** — userId=3400 / G / ttpId=2846. 이하성 (#4 / userId=3162) 실명 user.name 이미 박제. **stale pending 3건 정정** (matchId 150/151/152 → scheduled). | ✅ |
| 2026-05-10 | main `84569c3` (PR #248+#249) | **PR-B/C 자동 트리거 + 사전 라인업 PR4 + 매치 카드 + Tailwind 3차 fix** | ✅ |
| 2026-05-10 | main `c62994b` (PR #246+#247) | **PR-A scoreMatch 헬퍼 추출 + 자동 트리거 설계 보고서 + Live.jsx 시안 박제** | ✅ |
| 2026-05-09 | main `a80845c` (PR #244+#245) | **5/9~10 누적 일괄 — 라이브 YouTube 임베딩 + 사전 라인업 PR3~5 + Flutter PR6 핸드오프** — matchId=148 자동 등록 시연. errors.md sticky 모바일 미작동 박제. | ✅ |
| 2026-05-09 | main 8회 (`02f7d0e`~`76bf5f3`) | **5/9 단일 일 main 8회 신기록** — PhoneInput 마이그 100% + 시안 갭 fix + 공개프로필 NBA + 내농구 super-set + 사전 라인업 PR1+PR2 + 라이브 YouTube PR4+PR5 | ✅ |
| 2026-05-08 | main 7회 (`c6a6848`~`118c9f1`) | **5/8 main 7회** — PR3 layout 가드 mock + mock 자체 입력 폴백 + PhoneInput 전역 컴포넌트 + 디자인 박제 11 commit | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 / 5/6 PR1e DROP COLUMN + UI fix 13건 / 5/7 main 21회 신기록 Onboarding 10단계 + PortOne V2 + Phase A.5) — 복원: git log -- .claude/scratchpad.md -->
