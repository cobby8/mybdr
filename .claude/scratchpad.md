# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/6 세션 마무리]** 팀 멤버 라이프사이클 시스템 5 Phase + UI fix 13건 + apiError 일괄 fix main 배포 완료 (`4253e68`). jersey 도메인 재설계 (옵션 C+UI) + 신청/승인 워크플로 + 이적 + 권한 위임 + 유령회원 + UI 디자인 시스템 통일 모두 운영 적용. 다음 세션 진입 = 뱃지 미동작 fix (envelope 가정 잘못) + onboarding PR1~5.

---

## 🎯 다음 세션 진입점

### 🐛 0순위 — 본인 카드 좌하단 뱃지 미동작 (envelope 가정 잘못)
- **원인 추정**: `member-pending-badge.tsx` + `member-actions-menu.tsx` 의 fetch 응답 처리가 `json.data.requests` envelope 가정 — 실제 mybdr `apiSuccess` = `{ requests: [...] }` 직접. → `json.requests` 로 수정 필요.
- 영향: 좌하단 뱃지 미표시 + dropdown trigger 라벨 갱신 안 됨 (사용자 보고 5/6).
- 분량: 두 컴포넌트의 fetch 응답 envelope 수정 ~0.2d.
- 위치: `src/app/(web)/teams/[id]/_components_v2/member-pending-badge.tsx` + `member-actions-menu.tsx`

### 🚀 1순위 — 박성후 등록 + 이도균 ✅ 완료
- ~~**이도균** (user_id=3352) — 5/5 완료: ttpId=2830 #70 / team_members.jersey=70.~~
- **박성후** (user_id=3382, default_jersey=21) — 5/5 이후 본인 가입 완료 ✅. 펜타곤 팀 가입 신청 + tournament_team_players 등록 = 사용자 액션 또는 PM 수동 처리 결정.

### 🚀 2순위 — onboarding 10단계 시스템 PR1~5 (옵션 B 합의)
PR1~5 (~5.5d) — decisions.md `[2026-05-05]` 참조. PR5 먼저 권장.

### 🚀 3순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)
- game.game_type: 56 파일 + DB 영향
- 매치 코드 v4 Phase 6: 라이브 페이지 deep link (옵션)

### 🚀 4순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리 (P3-11)
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)
- jersey-change-button.tsx 데드 코드 (PR8 이후 미사용) 삭제 결정

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
| 2026-05-06 | `7211f97` `86f9eb9` `64b1bab` `d5d491e` `465b7ca` `f6b43ab` → main `4253e68` | **5/6 누적 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 이동 + 좌하단 뱃지 + dropdown overflow + apiError 일괄 fix** — (1) PR1e: `user.default_jersey_number` 컬럼 DROP (54명 메모 손실, 가치 0, 명시 승인 + --accept-data-loss). (2) UI fix 13건 / 11건 fix: 5 모달 + dropdown 토큰 통일 (`--surface` → `--color-card`) / placeholder "예) " 4건 / iOS 16px / grid 모바일 분기 / dropdown overflow / window.prompt → ForceActionModal. (3) 본인 카드 dropdown 잘림 fix (overflow visible). (4) 좌하단 신청 중 뱃지 (`member-pending-badge.tsx`) — 4종 라벨 (jersey/dormant/withdraw/transfer). (5) 마이페이지 소속팀 카드 = 히어로 아래 풀 width + 각 row "활동 관리" + "팀페이지 →". (6) "내 액션" → "활동 관리" 라벨. (7) apiError 인자 순서 9 파일 69건 fix (한국어 메시지 정상화 — 휴면/번호변경/탈퇴 신청 시 "ALREADY_PENDING" 영문 노출 → 한국어). transfer 검색 endpoint URL fix. tsc 0 / 미푸시 0. | ✅ |
| 2026-05-05 | `ae4ffd7` `d72aa0a` `f2d7a96` `a647f88` `2e3e22b` `8600c74` `1e8c9db` `b9b2776` `504e858` `d274000` `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — 보고서 `Dev/team-member-lifecycle-2026-05-05.md` 옵션 C+UI. Phase 1 Jersey (PR1~5): default_jersey 사용처 정리 / 가입폼 jersey + 자동 복사 / 마이페이지 다중 팀 카드 / tournament join ttp 자동 sync (운영자 시야 X) / match_player_jersey 신설 + W1 라이브 운영자 모달 + admin_logs / v1 6 endpoints 우선순위 helper (Flutter 변경 0). Phase 2 워크플로 (PR6~9): team_member_requests + team_member_history 인프라 / 번호변경 신청 + dispatcher 활성화 / 휴면+탈퇴 + lazy 복구 helper. Phase 3 이적 (PR10~11): transfer_requests state machine 양쪽 팀장 승인 + 자동 이동 트랜잭션. Phase 4 권한 위임 (PR12~13): team_officer_permissions captain only 위임 (재위임 X) + 매트릭스 적용 4 endpoint. Phase 5 유령회원 (PR14~16): last_activity_at + 5분 throttle + 활동 추적 5종 / 유령 후보 + 강제 액션 / 회원 상태 정비 + 명단 완전 삭제 옵션. ADD TABLE 5건 + ADD COLUMN 1건 모두 무중단. 사용자 결정 8건 + 미묘 6건 룰 반영. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 (코드 변경 0) | **열혈농구단 SEASON2 출전 명단 정비** — 쓰리포인트/백승훈 ttpId=2540 (18→39) + 몽키즈/이지환 ttpId=2583 (0→4) + 몽키즈/최원영 ttpId=2581 (10→20) + 제주 리딤/이도균 ttpId=2830 INSERT #70 (옵션 2 트랜잭션, team_members.jersey NULL→70 동시). 매 건 사전 검증 (동명이인 0 / 충돌 0) → 사용자 명시 승인 → 사후 SELECT 재확인 PASS. 임시 스크립트 즉시 삭제. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
| 2026-05-05 | `7f26b6f` + `60e8468` + `61e9ab1` + `5fd1716` + `d8bba4a` + `eb015aa` → main `3f016c9` | **인증 흐름 전체 재설계 main 배포 — 로그인 hard reload + getAuthUser() 단일 헬퍼 + 쿠키 자동 cleanup** — `7f26b6f` 로그인 server action redirect → return success + window.location.href hard reload (SSR 새 쿠키 인지 보장). C1~C4 옵션 A+B-PR1: signup layout 가드 / me API 탈퇴 401→200 통일 / ProfileCtaCard 글로벌 fetcher 위임 / `src/lib/auth/get-auth-user.ts` 신규 (JWT verify + DB SELECT + status 분기 + 쿠키 자동 cleanup + React.cache dedup) + 4 layout (web/login/signup/profile) 위임. **사용자 검증 통과 — 탈퇴 회원 쿠키 본질 해결** (1회 진입 후 잘못된 쿠키 자동 제거). 회귀: 빈 본문 chunk 404 = 배포 직후 chunk 캐시 mismatch (강력 새로고침 안내, 일시적). tsc 0 / 운영 DB 영향 0 / scratchpad+architecture+conventions+errors+index 박제. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 세션 + 5/5 auth 4건 묶임 홈/SWR/hydration fix + 5/5 auth 6건 묶임 탈퇴/가입/세션 가드 + 듀얼 P3~P7 + Step 2 활성화 + 듀얼 표준화 + 도메인 sub-agent P3 + 매치 코드 v4 Phase 1~7 + 5/5 58af36a 트리 카드 시간 표시 + 5/5 auth 흐름 조사 보고서 + 5/5 login layout 가드 fix + 5/5 SEASON2 PDF vs DB 비교 + 5/5 onboarding 10단계 합의 + 5/5 배번 정책 ef7e78e + 5/5 admin/users 4섹션 06d1376) — 5/5 인증 재설계 옵션 A+B-PR1 prepend + 5/6 UI fix prepend / 복원: git log -- .claude/scratchpad.md -->
