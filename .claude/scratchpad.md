# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 세션 마무리 — subin 10회 push 완료, 디자인 박제 회차]** home BDR v2 토큰 마이그레이션 (145→0) + gitignore 정리 + 5/7 디자인 박제 후속 (CLAUDE.md / claude-project-knowledge / 디자인 시스템 관리) + **BDR-current sync v2.4** (5/1 v2.3 → 5/8 Phase A.6 운영 정합) + 운영→시안 역박제 4 영역 (PasswordInput / MemberPendingBadge / MyPage 다중팀 / 가입 모달) + zip 처리 100% + mypage feasibility 보관. lessons.md 박제 (sync 갭 spot check 매트릭스 + 재발 방지 3 룰). 다음 = PortOne 운영 활성화 + PR3 layout 가드.

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP 중 선택)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **검증**: 미인증 계정 → /onboarding/identity → PortOne 위젯 호출 → 인증 완료 → /onboarding/environment 자동 진입
- **승인 대기 중**: 콘솔 작업 후 mybdr.com/onboarding/identity 진입 시 위젯 정상 노출 여부 확인

### 🚀 1순위 — PR3 layout 가드 (PortOne 활성화 후)
- 미인증 사용자 핵심 페이지 진입 시 강제 redirect → `/onboarding/identity`
- 현재 옵션 C (안내 only) → 옵션 B (강제 redirect) 로 진입
- 분량 0.5d. middleware.ts 또는 (web)/layout.tsx 가드.

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과하는지
- xp +100 부여 확인 (xp 컬럼 SELECT 또는 마이페이지 표시)
- profile/edit 이름/생년월일/휴대폰 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/5+5/6)

- **팀 멤버 라이프사이클 + Jersey 재설계 — ✅ 5 Phase + PR1e + UI fix 모두 main 완료** (`Dev/team-member-lifecycle-2026-05-05.md` / `4253e68` main 5/6 23h 기준). 16+ commit / 신규 테이블 5 + DROP COLUMN 1 / 코드 60+ 파일 / 기능 변경 0 / Flutter v1 호환 0.
- **인증 흐름 재설계** — ✅ 완료 (5/5 `3f016c9` main).

---

## 🟡 HOLD / 우선순위 2~3 (압축)
- **HOLD**: 자율 QA 봇 (1~5 / 9d) / BDR 기자봇 v2 (Phase 2~7)
- **5/2 잔여**: placeholder User 86건 LOW (auto merge) / ttp 부족팀 5팀 사용자 액션
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / PortOne / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지 / D-6·D-3 후속 / Q1 토큰 마이그

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 5/2 동호회최강전 D-day | ✅ DB 16팀 + 27경기 + 회귀 5종 |
| dual_tournament 회귀 방지 | ✅ A~E 5종 |
| Live `/live/[id]` v2 | ✅ STL + minutes-engine v3 + 5/4 sticky+팀비교 (1f8ee19) |
| 마이페이지 D-1~D-8 | ✅ 8/8 |
| Reviews 통합 (Q1) | ✅ |
| 듀얼토너먼트 풀 시스템 | ✅ Phase A~F2 |
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| **도메인 sub-agent (옵션 A)** | ✅ P1+P2+P3 완료 (C 채택 — live-expert 영구 / 신규 박제 0) |
| **매치 코드 v4** | ✅ Phase 1+2+3+4+5+7 (전 Phase 완료) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | `48643f5` `36c533f` `2788604` `3af6cd6` `30547d1` `0d4d0ed` `8ec584f` `1e3ee9a` `c293758` `6c8cf68` (10건 push) | **5/8 누적 — 디자인 박제 회차** — (1) home BDR v2 토큰 마이그레이션 145 → 0 (globals.css + 14 home 컴포넌트). (2) `.claude/settings.local.json` + `.claude/scheduled_tasks.lock` gitignore 처리. (3) 5/7 디자인 박제 후속 (CLAUDE.md +33 / claude-project-knowledge 02·03·04 +413 / 디자인 시스템 관리 폴더 신설 11 파일). (4) BDR-current sync v2.4 (5/1 v2.3 → Phase A.6 운영 정합) — `_archive/BDR-current-2026-05-01-v2.3/` 백업 + zip v2.4 87 screens 카피. (5) sync 갭 lessons.md 박제 (운영→시안 역박제 갭 4건) + 재발 방지 3 룰. (6) 역박제 영역 1 PasswordInput Login/Signup (3+2 input). (7) 역박제 영역 2~4 (TeamManage 본인 row MemberPendingBadge mock + MyPage 단일→다중 팀 row + TeamDetail 가입 모달 mock — jersey input + 사용 중 번호 + 충돌 안내). (8) zip 처리 100% (mypage feasibility 보관 + 그 외 무시). 시안 mock-up 박제 (운영 코드 1대1 복사 X — 시각/구조 정합만). | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main 머지 — Onboarding 10단계 + PortOne V2 + Phase A.5 drawer + 다수 fix** — (A) 초반 fix 7건: envelope+snake_case 8회 재발 (`7945452`) / 한글 IME Enter 9곳 (`d7e921c`) / 마이페이지 한 줄 정렬 + 세로 stack + 우측 정렬 (`9513fe3` `e344375` `f1c5cee`) / 신청 알림 404 fix (`2c9afe2`) / 알림 deep-link scroll+highlight (`0ccf785`). (B) Onboarding 시리즈: PR1.1+1.2 본인인증 진입 (`c9fe34b`) / PR1.3 settings 단일 진입점 (`49698c0`) / PR1.5.a 서버 4 endpoint 게이트 (`00d001b`) / 옛 알림 redirect (`f8bb636`) / PR1.5.b 클라 4 페이지 (`569c9e9`) / 카드 미표시 + 임시 모달 + 인증 필드 잠금 (`c13bae0`) / manage 변경 요청 envelope 9회 (`a16541b`) / PR2 environment+basketball (`f992210`) / PortOne V2 실 통합 (`d7a82b5`) / PR4 preferences 통합 + xp +100 (`00704be`) / PR5 §6 안내 (`6fcac51`). (C) 후반: Phase A.5 drawer fix (`0809432` truncated → 빌드 실패) → hot fix `168be48` (워킹트리 정상 css 재 commit, 13분 내 운영 복구). errors.md 박제 — truncated commit 함정 + IME 9회 + envelope 9회. PR3 layout 가드는 PortOne 운영 활성화 후로 보류. | ✅ |
| 2026-05-06 | `7211f97` `86f9eb9` `64b1bab` `d5d491e` `465b7ca` `f6b43ab` → main `4253e68` | **5/6 누적 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 이동 + 좌하단 뱃지 + dropdown overflow + apiError 일괄 fix** — (1) PR1e: `user.default_jersey_number` 컬럼 DROP (54명 메모 손실, 가치 0, 명시 승인 + --accept-data-loss). (2) UI fix 13건 / 11건 fix: 5 모달 + dropdown 토큰 통일 (`--surface` → `--color-card`) / placeholder "예) " 4건 / iOS 16px / grid 모바일 분기 / dropdown overflow / window.prompt → ForceActionModal. (3) 본인 카드 dropdown 잘림 fix (overflow visible). (4) 좌하단 신청 중 뱃지 (`member-pending-badge.tsx`) — 4종 라벨 (jersey/dormant/withdraw/transfer). (5) 마이페이지 소속팀 카드 = 히어로 아래 풀 width + 각 row "활동 관리" + "팀페이지 →". (6) "내 액션" → "활동 관리" 라벨. (7) apiError 인자 순서 9 파일 69건 fix (한국어 메시지 정상화 — 휴면/번호변경/탈퇴 신청 시 "ALREADY_PENDING" 영문 노출 → 한국어). transfer 검색 endpoint URL fix. tsc 0 / 미푸시 0. | ✅ |
| 2026-05-05 | `ae4ffd7` `d72aa0a` `f2d7a96` `a647f88` `2e3e22b` `8600c74` `1e8c9db` `b9b2776` `504e858` `d274000` `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — 보고서 `Dev/team-member-lifecycle-2026-05-05.md` 옵션 C+UI. Phase 1 Jersey (PR1~5): default_jersey 사용처 정리 / 가입폼 jersey + 자동 복사 / 마이페이지 다중 팀 카드 / tournament join ttp 자동 sync (운영자 시야 X) / match_player_jersey 신설 + W1 라이브 운영자 모달 + admin_logs / v1 6 endpoints 우선순위 helper (Flutter 변경 0). Phase 2 워크플로 (PR6~9): team_member_requests + team_member_history 인프라 / 번호변경 신청 + dispatcher 활성화 / 휴면+탈퇴 + lazy 복구 helper. Phase 3 이적 (PR10~11): transfer_requests state machine 양쪽 팀장 승인 + 자동 이동 트랜잭션. Phase 4 권한 위임 (PR12~13): team_officer_permissions captain only 위임 (재위임 X) + 매트릭스 적용 4 endpoint. Phase 5 유령회원 (PR14~16): last_activity_at + 5분 throttle + 활동 추적 5종 / 유령 후보 + 강제 액션 / 회원 상태 정비 + 명단 완전 삭제 옵션. ADD TABLE 5건 + ADD COLUMN 1건 모두 무중단. 사용자 결정 8건 + 미묘 6건 룰 반영. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 (코드 변경 0) | **열혈농구단 SEASON2 출전 명단 정비** — 쓰리포인트/백승훈 ttpId=2540 (18→39) + 몽키즈/이지환 ttpId=2583 (0→4) + 몽키즈/최원영 ttpId=2581 (10→20) + 제주 리딤/이도균 ttpId=2830 INSERT #70 (옵션 2 트랜잭션, team_members.jersey NULL→70 동시). 매 건 사전 검증 (동명이인 0 / 충돌 0) → 사용자 명시 승인 → 사후 SELECT 재확인 PASS. 임시 스크립트 즉시 삭제. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 옵션 A+B-PR1 `7f26b6f` `60e8468` `61e9ab1` `5fd1716` `d8bba4a` `eb015aa` → main `3f016c9` (로그인 hard reload + getAuthUser 단일 헬퍼 + 쿠키 자동 cleanup) / 5/5 SEASON2 출전 명단 정비 4건 DB UPDATE / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 `7945452` — 모두 5/7 main 21회 누적의 baseline) — 복원: git log -- .claude/scratchpad.md -->
