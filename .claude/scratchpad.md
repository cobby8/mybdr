# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 마무리 — 단일 일 main 6회 머지 완료]** PR #214~#225 12건 / 작업 6회차 (디자인 박제 + truncated hot fix + PR3 mock 모드 + BDR-current v2.5/v2.5.1 + mock 자체 입력 폴백). Production = main `93670c5`. 미푸시 0 / 동기화 깨끗. PortOne 콘솔 채널 발급 + 환경변수 추가 외부 작업 대기 (이번 주 내 예상) — 추가 시 자동 SDK 모드 전환 (코드 변경 0).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 직후 자동 전환**:
  - PR3 layout 가드 → 미인증 사용자 강제 redirect 활성
  - mock 자체 입력 폴백 → SDK 모드 자동 전환 + mock-verify endpoint 503 자동 거부
- **롤백 1초**: 환경변수 제거 = mock 모드 자동 복귀

### 🚀 1순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join 진입 → /onboarding/identity?returnTo= redirect 정상
- PortOne 위젯 호출 → 인증 완료 → returnTo 자동 복귀
- mock 통과자 (identity_method='mock') 사후 식별 + 권유 안내 (강제 invalidate 안 함)

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과 / xp +100 / profile/edit 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/8)

- **PR3 layout 가드 + mock 모드** ✅ main 배포 (`Dev/pr3-layout-guard-design-2026-05-08.md` / PR #218/#219 `f39afae`). 헬퍼 2 + server layout 1 + 수정 4 페이지 / `user.name_verified` 컬럼 / mock flag = channel key 자동 ON / 회귀 0.
- **본인인증 mock 자체 입력 폴백** ✅ main 배포 (`Dev/identity-mock-fallback-design-2026-05-08.md` / PR #224/#225 `93670c5`). 사용자 Q1~Q5 일괄 승인. 신규 2 (modal 337L + endpoint 156L) + 수정 2 (button +35L + DB +5L) / 보안 가드 3단 / `user.identity_method` ADD COLUMN 무중단 / admin_logs 기록.
- **팀 멤버 라이프사이클 + Jersey 재설계** ✅ main 완료 (5/5~5/6 / `4253e68`)
- **인증 흐름 재설계** ✅ main 완료 (5/5 `3f016c9`)

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
| 디자인 시안 박제 | ⏳ 38% (40+/117) — BDR-current v2.5.1 sync |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택 — live-expert 영구) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne env 추가 시 자동 활성) |
| **mock 자체 입력 폴백** | ✅ main 배포 (PortOne 활성화 시 자동 SDK 모드 전환) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | PR #214~#225 12건 → main 6회 머지 (`e0d880b` 빌드실패 → `c6a6848` `f39afae` `8846f6d` `13a962e` `93670c5`) | **5/8 단일 일 main 6회 머지 신기록 (운영 영향 0)** — (1) PR #214/#215 5/8 누적 11 commit (home 토큰 마이그 145→0 / BDR-current sync v2.4 / 역박제 4영역 / 5/7 박제 후속) → 빌드 9건 실패 (`48643f5` profile-cta-card 161줄 truncated 38줄 손실, Vercel auto promotion 차단으로 운영 `168be48` 유지). (2) PR #216/#217 hot fix `333516b` 38줄 복원 → main `c6a6848` 운영 복구. errors.md 5/7 재발 2회차 박제 + 보완 4룰. (3) PR #218/#219 PR3 layout 가드 mock 모드 `f39afae` (planner 8섹션 / Q1~Q5 승인 / 헬퍼 2건 + server layout 1건 + 4 페이지 / tester 9/9 + reviewer ⭐⭐⭐⭐⭐). (4) PR #220/#221 BDR-current v2.5 부분 머지 `8846f6d` (zip onboarding 5종 + 사용자 미작업 4파일 보존 / 운영→시안 양쪽 살리는 머지). (5) PR #222/#223 v2.5.1 `13a962e` (Profile 시리즈 5종 + SettingsRow 컴포넌트 / zip이 우리 5/8 mock 받은 base — 충돌 0 자동 머지). (6) PR #224/#225 mock 자체 입력 폴백 `93670c5` (DB user.identity_method ADD COLUMN 무중단 / MockIdentityModal 337L + mock-verify endpoint 156L + IdentityVerifyButton +35L / 보안 가드 3단 + admin_logs 기록 / Q1~Q5 일괄 승인 / tester 9/9 + reviewer ⭐⭐⭐⭐⭐). | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding PR1.1~PR5 (PR3 보류), Phase A.5 drawer fix → truncated → hot fix `168be48` (13분 내 운영 복구). errors.md 박제 (truncated + IME + envelope). PR3 layout 가드 PortOne 활성화 후로 보류 → 5/8 mock 모드로 진행. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄 fix** — PR1e default_jersey_number DROP. UI 13건 (5 모달 토큰 / placeholder / iOS 16px / dropdown / ForceActionModal). 마이페이지 소속팀 카드 풀 width. apiError 9 파일 69건 한국어 정상화. | ✅ |
| 2026-05-05 | `ae4ffd7` ~ `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — Phase 1 Jersey / Phase 2 워크플로 / Phase 3 이적 / Phase 4 권한 위임 / Phase 5 유령회원. ADD TABLE 5건 + ADD COLUMN 1건 무중단. 사용자 결정 8건 + 미묘 6건. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 | **열혈농구단 SEASON2 출전 명단 정비** — 4명 ttpId 정비 (백승훈 39 / 이지환 4 / 최원영 20 / 이도균 #70 INSERT). 사전 검증 + 명시 승인 + 사후 재확인. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 → main `3f016c9` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 — 5/7 main 21회 baseline) — 복원: git log -- .claude/scratchpad.md -->
