# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 — 시안 갭 fix 100% 완료]** PR #228~#235 4회차 main 머지. PhoneInput/BirthDateInput 마이그 (1순위 4 input + 2~3순위 6 input = 10 input) + 시안 역박제 10 페이지 (1순위 3 + 2~3순위 7) 모두 main 배포. Production = `afcbd65`. 미푸시 0 / 동기화 깨끗. 운영 → 시안 박제 갭 **0건** (5/7 lessons.md 룰 회복).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**: PR3 가드 활성 / mock 폴백 503 자동 / SDK 모드 전환 (코드 변경 0)
- **롤백 1초**: 환경변수 제거

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo redirect
- mock 통과자 (identity_method='mock') 사후 식별 + 권유 안내 (강제 invalidate X)

### 🚀 2순위 — PhoneInput/BirthDateInput 마이그 4순위 (admin+referee 그룹)
- (admin) 1건 + (referee) 1건 = 2 input. 별도 그룹이라 사용자 영향 적음, 일관성 차원

### 🚀 3순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자 흐름 / xp +100 / profile/edit 잠금 회귀 0

### 🚀 4순위 — manage 탭 그룹화 (P2-6 보류) / game.game_type 마이그 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/8~5/9)

- **PR3 layout 가드 + mock 모드** ✅ main `f39afae` (헬퍼 2 + server layout 1 + 4 페이지)
- **본인인증 mock 자체 입력 폴백** ✅ main `93670c5` (DB user.identity_method ADD COLUMN + modal 337L + endpoint 156L + 보안 가드 3단)
- **사이트 전역 PhoneInput / BirthDateInput** ✅ main `118c9f1` (87L+109L 신규 + conventions.md [2026-05-08] 룰 박제)
- **PhoneInput 기존 사용처 마이그** ✅ main `702d00e` (1순위 4 input) + main `b96f58c` (2~3순위 6 input)
- **운영 → 시안 역박제 갭 fix** ✅ main `71d4087` (1순위 News+MatchNews+Scoreboard) + main `afcbd65` (2~3순위 7건) = 시안 갭 0건

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) / 듀얼토너먼트 풀 시스템 | ✅ |
| **디자인 시안 박제** | ✅ ~95% (시안 갭 0건, admin/referee 그룹 외) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 모드 전환) |
| **사이트 전역 input 룰** | ✅ PhoneInput/BirthDateInput + 10 input 마이그 / admin+referee 2건 잔여 |
| **운영 → 시안 역박제 갭 fix** | ✅ 10 페이지 (1+2+3순위) — 시안 갭 0건 달성 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-09 | PR #228~#235 8건 → main 4회 머지 (`702d00e` → `b96f58c` → `71d4087` → `afcbd65`) | **5/9 main 4회 — input 마이그 + 시안 갭 fix 일괄 완료** — (1) PR #228/#229 PhoneInput/BirthDateInput 1순위 4 input (profile/edit 휴2+생1 + tournaments/join 휴1, formatPhone 7L 제거). (2) PR #230/#231 잔여 6 input (verify state 하이픈+replace 정규화 / registration / games/new step+v2 / games/edit within24h / partner-admin/venue). (3) PR #232/#233 시안 역박제 1순위 3건 (News+MatchNews+Scoreboard 매치 코드 v4). (4) PR #234/#235 시안 역박제 2~3순위 7건 (CourtManage/Checkin/TeamsManage/Requests/ProfileSettings/OrgApply/SeriesEdition). 시안 갭 0건 달성. tester 통과 단위 76건+ / reviewer ⭐⭐⭐⭐⭐ 2회. | ✅ |
| 2026-05-08 | PR #214~#227 14건 → main 7회 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5` `118c9f1`) | **5/8 main 7회 신기록** — (1) 디자인 박제 11 commit + truncated 빌드 9건 실패 → hot fix `333516b`. (2) PR3 layout 가드 mock 모드 (헬퍼 2 + server layout 1 + 4 페이지). (3) BDR-current sync v2.5 부분 + v2.5.1 (zip 2회). (4) mock 자체 입력 폴백 (DB ADD COLUMN + modal 337L + endpoint 156L + 가드 3단). (5) PhoneInput/BirthDateInput 전역 컴포넌트 + conventions.md [2026-05-08] 룰 박제. errors.md 5/7 truncated 재발 2회차 + 보완 4룰. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding PR1.1~PR5 (PR3 보류), Phase A.5 drawer truncated → hot fix `168be48`. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄** | ✅ |
| 2026-05-05 | `ae4ffd7` ~ `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** | ✅ |
| 2026-05-05 | DB UPDATE 4건 | **열혈농구단 SEASON2 출전 명단 정비** | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 → main `3f016c9` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 — 5/7 main 21회 baseline / 5/8 main 7회 신기록) — 복원: git log -- .claude/scratchpad.md -->
