# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/8 마무리 — PR3 layout 가드 mock 모드 main 배포 완료]** subin → dev → main 4 PR (#214 #215 #216 #217 #218 #219) 완주 / 빌드 9건 truncated hot fix → PR3 mock 모드 정상 빌드 / Production = PR #219 머지커밋 (mock 모드 default = 회귀 0). PortOne 콘솔 채널 발급 + 환경변수 추가 시 자동 활성화 대기 (사용자 외부 작업 / 이번 주 내 예상).

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업, 이번 주 내 예상)
- **PortOne 콘솔**: 본인인증 채널 발급 (PASS / SMS / KCP)
- **Vercel 환경변수**: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- **활성화 후 검증**: 미인증 계정 → /games/[id] / /teams/[id] / /tournaments/[id]/join 진입 → /onboarding/identity?returnTo=... redirect → PortOne 위젯 → 인증 완료 후 returnTo 자동 복귀

### 🚀 1순위 — PR3 활성화 검증 (PortOne 활성화 직후)
- mock 모드 → 활성 모드 자동 전환 (코드 변경 0)
- 회귀 검증: 인증 완료 사용자 + 비로그인 사용자 영향 0 / PR1.5.b 클라 안내 그대로 작동
- 롤백 1초: 환경변수 제거 = 자동 mock 모드

### 🚀 2순위 — onboarding 흐름 검증 + 사용자 영향 모니터링
- 카카오/구글/네이버 소셜 가입자가 흐름 정상 통과하는지 / xp +100 부여 확인 / profile/edit 잠금 회귀 0

### 🚀 3순위 — manage 탭 그룹화 (P2-6 보류) + 데드 코드 정리
- manage 8~9 탭 → "신청 관리" / "운영진" 그룹화 (IA 변경, 사용자 결정 필요)

### 🚀 4순위 — game.game_type 0~5 마이그레이션 / 매치 코드 v4 Phase 6 (보류)

---

## 기획설계 (planner-architect / 5/8)

- **PR3 layout 가드 + mock 모드 — ✅ main 배포 완료** (`Dev/pr3-layout-guard-design-2026-05-08.md` / PR #218 #219 / main `f39afae`). 신규 헬퍼 2건 (`identity-gate-flag.ts` 26L + `require-identity-for-page.ts` 61L) + 신규 server layout 1건 (`tournaments/[id]/join/layout.tsx` 41L) + 수정 4 페이지. 본인인증 컬럼 = `user.name_verified` (PR1.5.a 동일). mock flag = channel key 환경변수 존재 시 자동 ON (옵션 a). 이중 보호 = PR1.5.a 서버 게이트 + PR1.5.b 클라 안내 + PR3 페이지 진입 redirect 모두 보존. 회귀 0 (mock 모드 default). 롤백 1초 (환경변수 제거).
- **팀 멤버 라이프사이클 + Jersey 재설계** — ✅ 5 Phase + PR1e + UI fix 모두 main 완료 (5/5~5/6 / `4253e68`)
- **인증 흐름 재설계** — ✅ 완료 (5/5 `3f016c9`)

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
| 디자인 시안 박제 | ⏳ 38% (40+/117) |
| 도메인 sub-agent (옵션 A) | ✅ P1+P2+P3 (C 채택 — live-expert 영구) |
| 매치 코드 v4 | ✅ Phase 1+2+3+4+5+7 |
| **PR3 layout 가드 mock 모드** | ✅ main 배포 (PortOne 환경변수 추가 시 자동 활성) |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-08 | `48643f5` ~ `1dbc3ee` 11건 → PR #214/#215 머지 → 빌드 9건 실패 → hot fix `333516b` → PR #216/#217 → main `c6a6848` → PR3 `f55105e` `666e815` → PR #218/#219 → main `f39afae` | **5/8 누적 — 디자인 박제 + 머지 + truncated hot fix + PR3 mock 모드 배포** — (디자인) home BDR v2 토큰 마이그 145→0 / BDR-current sync v2.4 / 운영→시안 역박제 4영역 / 5/7 박제 후속 / gitignore. (머지) subin→dev #214 + dev→main #215 gh CLI 자동. (Hot fix) `48643f5` profile-cta-card.tsx 161줄 단독 잘림 (38줄 손실) → 빌드 9건 연쇄 실패 (Production = `168be48` 그대로 유지, auto promotion 차단으로 운영 영향 0) → `333516b` 38줄 복원 → PR #216/#217 → main `c6a6848`. errors.md 박제 (5/7 룰 + 보완 4룰). (PR3) planner-architect 설계서 8섹션 + 사용자 Q1~Q5 일괄 승인 → developer 신규 헬퍼 2건 + server layout 1건 + 수정 4 페이지 (200L) → tester 9/9 통과 + reviewer ⭐⭐⭐⭐⭐ 수정 0 → PR #218 (subin→dev) + #219 (dev→main) → main `f39afae` 배포. mock 모드 default = 회귀 0 / 환경변수 추가 시 자동 활성 / 롤백 1초. | ✅ |
| 2026-05-07 | main 21회 (`2cc9df3` ~ `168be48`) | **5/7 단일 일 신기록 21회 main — Onboarding 10단계 + PortOne V2 + Phase A.5** — fix 7건 (envelope 8회 / IME 9곳 / 마이페이지 정렬 / 알림 deep-link), Onboarding 시리즈 PR1.1~PR5 (단 PR3 보류), Phase A.5 drawer fix → truncated → hot fix `168be48` (13분 내 운영 복구). errors.md 박제 (truncated + IME + envelope). PR3 layout 가드 PortOne 활성화 후로 보류 → 5/8 mock 모드로 진행. | ✅ |
| 2026-05-06 | `7211f97` ~ `f6b43ab` → main `4253e68` | **5/6 누적 — PR1e DROP COLUMN + UI fix 13건 + 마이페이지 소속팀 + 좌하단 뱃지 + apiError 일괄 fix** — PR1e default_jersey_number DROP (54명 메모 손실, 가치 0). UI 13건 fix (5 모달 토큰 통일 / placeholder / iOS 16px / dropdown overflow / ForceActionModal). 마이페이지 소속팀 카드 풀 width. apiError 9 파일 69건 한국어 정상화. tsc 0 / 미푸시 0. | ✅ |
| 2026-05-05 | `ae4ffd7` ~ `5d62f7f` → main `8bbce95` | **팀 멤버 라이프사이클 + Jersey 재설계 5 Phase 16 PR main 배포** — Phase 1 Jersey / Phase 2 워크플로 / Phase 3 이적 / Phase 4 권한 위임 / Phase 5 유령회원. ADD TABLE 5건 + ADD COLUMN 1건 무중단. 사용자 결정 8건 + 미묘 6건 룰 반영. tsc 0 / Flutter v1 호환 0. | ✅ |
| 2026-05-05 | DB UPDATE 4건 (코드 0) | **열혈농구단 SEASON2 출전 명단 정비** — 4명 ttpId 정비 (백승훈 39 / 이지환 4 / 최원영 20 / 이도균 #70 INSERT). 매 건 사전 검증 + 사용자 명시 승인 + 사후 재확인 PASS. errors+lessons 박제 (도메인 단방향 함정). | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 + 5/5 auth 10+ 건 / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 5/5 SEASON2 PDF vs DB / 5/5 onboarding 10단계 합의 / 5/5 인증 흐름 재설계 옵션 A+B-PR1 `7f26b6f` ~ `eb015aa` → main `3f016c9` / 5/6 UI fix 13건 + apiError 일괄 fix / 5/7 envelope 8회 `7945452` — 5/7 main 21회 누적 baseline) — 복원: git log -- .claude/scratchpad.md -->
