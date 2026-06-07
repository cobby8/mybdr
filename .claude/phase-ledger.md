# Phase Ledger — 세 플랫폼 실시간 Phase 상태

> 본 ledger 는 **세 플랫폼이 같이 보는 source of truth**. 핸드오프마다 갱신.
> 명명 / 우선순위 / 라이프사이클 = `WORKFLOW.md` 참조.

---

## 현재 진행 중 Phase

### Phase 1 — 대회 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 1 (대회 전체) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-user-admin-connectivity-plan-2026-05-25.md` |
| ② 갭 분석 (B1~B7) | 1 (연결 다리) | ✅ 완료 | Cowork | 2026-05-25 | 7 갭 식별 — B1/B6 ★★★★★ |
| ③ 사용자 결재 | 1 | ✅ 완료 | 수빈 | 2026-05-25 | Phase 1B 방향 OK / 선검증 묶음 / 의뢰 작성 진행 |
| ④ 의뢰 작성 | 1A (관리자) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-admin-redesign-prompt-2026-05-25.md` (10 시안) |
| ④ 의뢰 작성 | 1B (사용자+다리) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/tournament-user-redesign-prompt-2026-05-25.md` (8 시안 + 1 컴포넌트) |
| ⑤ phase-ledger 갱신 | 1A/1B | ✅ 완료 | Cowork | 2026-05-25 | 본 ledger 초기화 (WORKFLOW.md 도입과 함께) |
| ⑥ git commit + push | 1A/1B | ⏳ 대기 | Cowork→수빈 | - | WORKFLOW.md + phase-ledger + sync 스크립트 묶어 commit |
| **⑦ Claude.ai 전달** | 1B (사용자+다리) | ✅ 완료 | 수빈 | 2026-05-25 | 의뢰 전달 + 박제 시작 |
| **⑦ Claude.ai 전달** | 1A (관리자) | ⏳ 대기 | **수빈 (수동)** | - | **통합 가이드 묶음 1** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` §1 묶음 1. baseline 5 admin 임시 복원 + zip + Phase 1A 의뢰서 전달 |
| ⑧ 시안 박제 | 1B | ✅ 완료 | Claude.ai | 2026-05-25 | BDR v2.18 박제 — 9 파일 (사용자 6 + 관리자 보강 3) |
| ⑨ zip 출력 | 1B (v2.18) | ✅ 완료 | Claude.ai | 2026-05-25 | uploads/BDR v2 (2).zip 도착. v2.2~v2.18 히스토리 포함 / v2.18 활성 |
| **⑩ sync 실행** | 1B (v2.18) | ✅ 완료 | CLI | 2026-05-26 | `sync-bdr-current.ps1 -NewVersion "v2.18"` 실행 완료. BDR-current = 15 파일 (jsx 9 UA1~UD3 + css 6) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.18/` (149 파일 전부 보존). 회귀 검수 6 케이스 통과 (더보기/RDM/--color/lucide-react/9999px/가짜링크/icon-btn). 인코딩 우회 = UTF-8 BOM 임시 파일 1회성 (원본 스크립트 변경 0). |
| ⑧ 시안 박제 | 1A | ⏸ 보류 | Claude.ai | - | 1A 의뢰 전달 후 |
| ⑨ zip 출력 | 1A | ⏸ 보류 | Claude.ai | - | 별 zip 묶음 — v2.19 또는 v2.18 갱신 |
| **⑩ sync 실행** | 1A | ✅ 완료 | CLI | 2026-05-26 | `sync-bdr-current.ps1 -NewVersion "v2.19"` 실행 완료. BDR-current = 23 파일 (jsx 17 admin 11 + user 6 / css 6 user) — v2.19 cumulative (v2.18 user + Phase 1A admin) / pre-snapshot = `_archive/BDR-current-2026-05-26-pre-v2.19/` (v2.18 15 + baseline 5 = 20 파일 보존). 회귀 검수 6 케이스 통과. Step 0 BOM 영구 해결 commit `5609c61` (Phase 1B 임시 우회 패턴 폐기). |
| **⑪ 운영 박제 (Phase 1C)** | 1C | ✅ 박제 종료 (PA3 SKIP 제외 15/16) | CLI | 2026-05-28 | **15 PR 박제 완료** (PA3 SKIP 1건 제외 전부). 머지 12 PR (`40d19db` UA1 / `9734de4` UA2+UC2 / `19dfa03` UB1 / `e4e629b` UA3 / `7e57690` UC1 / `08524bd` PA5 / `0cf3e1f` PA1 / `30f60a5` PA8 / `b468436` PA4 / `4f5d4cc` PA9 / `05d961d` PA6 / `32f4d2b` PA7). **🆕 대형 3 로컬 commit (미push)**: PR-1C-14 PA2 `d33177e` (진입점 sub-tab 4옵션 + draft 배너 [작성시각 hide=mock❌] + 3step flow / Legacy 보존 / 라우팅·API 0) / PR-1C-15 Teams `044527d` + PR-1C-16 Bracket `7694763` (carryover 잔여 rgba/#fff/rounded-full → 토큰). 모두 API/AppNav/가짜링크 0 / tsc 0 / PM 직접검증 회귀 6/6. **⏸ PR-1C-10 PA3 = SKIP** (시안 종별위임≠운영 협회생성 / planner 재설계 대기). **남은 작업 = 3 commit push + PA3 재설계만**. |
| **⑫ 회귀 검수 (역박제 룰)** | 1C | ✅ 진행 중 (PR-1C-1~6) | CLI | 2026-05-28 | PR-1C-1~6 각 자체 회귀 6/6 + 추가 케이스 PASS. PR-1C-6 = 옵션 A (vban hide / mock 금지 / 데이터 흐름 100% 유지). 운영→시안 drift 0. |
| **⑬ PR 결재** | 1C | ✅ 완료 | 수빈 | 2026-05-28 | 대형 3 박제 subin→dev (PR #652 `7da6fc4`) → dev→main (PR #653 `3de14c9`) 머지 완료. Vercel 운영 배포. subin=dev=main 정합. **Phase 1C 박제+머지 종료** (PA3 SKIP만 잔존) |
| ⑭ Phase 완료 | 1 | ✅ 종료 (15/16) | CLI→Cowork | 2026-05-29 | **Phase 1C 종료** — 15 PR 박제+머지 완료. PR-1C-10 PA3 = ⏸ 보류 (planner DB 실측 재확인: 종별 운영자 DB 출처 부재 = TournamentDivisionRule 운영자필드0 + TournamentAdminMember 종별컬럼0 / 시안≠운영 근본 다름). **사용자 결재 (CLI 세션 2026-05-29) = Phase 2C 우선 진행 / PA3 의도(신규기능 vs 리디자인) 후결정** |

### Phase 1 + Phase 2 통합 다음 액션 (수빈 본인)

**통합 가이드**: `Dev/design/prompts/phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` (Cowork 2026-05-26 작성)

```
[Step 0 — 영구 해결 (Phase 1A sync 전 1회)]
☑ scripts/sync-bdr-current.ps1 UTF-8 BOM 추가 commit `5609c61` (2026-05-26) — Phase 2/3/.. 후속 sync 에서 우회 반복 회피

[묶음 1 — Phase 1A (대회 관리자 10 시안)]
☐ baseline 5 admin 파일 임시 복원 (AdminTournamentAdminList/Wizard1Step/WizardAssociation/Matches/Divisions)
☐ BDR-current 전체 zip 묶기 (Downloads/BDR-current-phase1A-baseline-2026-05-26.zip)
☐ Claude.ai 세션 1: zip + tournament-admin-redesign-prompt-2026-05-25.md 전달
☐ Phase 1A zip 회신 도착 → Cowork 알림
☐ Cowork/CLI 가 sync CLI 의뢰서 작성 (phase-1A-vX.Y-sync-cli-prompt)
☐ CLI sync 실행 → phase-ledger Phase 1 ⑩ ✅ 갱신

[묶음 2 — Phase 2A + 2B (경기 영역 10 시안)] — 묶음 1 sync 후
☐ baseline 9 경기 파일 임시 복원 (Games/GameDetail/CreateGame/GuestApply/Live/GameResult/Home/AdminGames/AdminGameReports + MyActivity 보존)
☐ BDR-current 전체 zip 묶기 (phase2-baseline-2026-05-XX.zip)
☐ Claude.ai 세션 2: zip + game-admin + game-user 의뢰서 3건 전달
   (BG7 = Hero 위 sticky / BG2 = 평균+종류만 룰 명시 / 양측 BG1·BG2 의존 강조)
☐ Phase 2 zip 회신 도착 → Cowork 알림
☐ Phase 2 sync CLI 의뢰서 작성
☐ CLI sync 실행 → phase-ledger Phase 2 ⑩ ✅ 갱신

[Phase 1C + Phase 2C — 운영 박제]
☐ Phase 1 운영 박제 의뢰서 (PR ~16~19) — Phase 1B + 1A 합산
☐ Phase 2 운영 박제 의뢰서 (PR ~10)
☐ subin → dev → main PR 결재
```

→ 위 단계 완료 후 Phase 3 (영역 미정) 시작.

---

## 예정 Phase

### Phase 2 — 경기 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 2 (경기 전체) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-user-admin-connectivity-plan-2026-05-25.md` (8 갭 BG1~BG8) |
| ② 갭 분석 (BG1~BG7) | 2 (연결 다리) | ✅ 완료 | Cowork | 2026-05-25 | 7 갭 확정 — BG4 ★★★★★ / BG6 ★★★★ / BG7 ★★★★ / BG1·BG2·BG3 ★★★ / BG5 ★★ (BG8 자동 매칭 별 Phase) |
| ③ 사용자 결재 | 2 | ✅ 완료 | 수빈 | 2026-05-25 | 범위 BG1~BG7 / BG7 = Hero 위 sticky 띠 / BG2 = 평균+flag종류만 (개별건수❌) / Phase 1A 와 병행 |
| ④ 의뢰 작성 | 2A (관리자) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-admin-redesign-prompt-2026-05-25.md` (UD1 AdminGames + UD2 AdminGameReports = 2 시안) |
| ④ 의뢰 작성 | 2B (사용자+다리) | ✅ 완료 | Cowork | 2026-05-25 | `Dev/design/prompts/game-user-redesign-prompt-2026-05-25.md` (UA1~UA5 + UB1 + UC1 + UC2 = 8 시안) |
| ⑤ phase-ledger 갱신 | 2A/2B | ✅ 완료 | Cowork | 2026-05-25 | 본 ledger 의 Phase 2 섹션 갱신 |
| ⑥ git commit + push | 2A/2B | ⏳ 대기 | Cowork→수빈 | - | Phase 2 점검 리포트 + 의뢰 2건 + ledger 갱신 묶어 commit |
| **⑦ Claude.ai 전달** | 2A + 2B 묶음 | ⏳ 대기 (묶음 1 sync 후) | **수빈 (수동)** | - | **통합 가이드 묶음 2** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` §1 묶음 2. Phase 1A sync 완료 후 진행 (옵션 B 권장). baseline 9 경기 임시 복원 + zip + Phase 2A/2B 의뢰서 2건 전달 |
| ⑧ 시안 박제 | 2A + 2B | ⏸ 보류 | Claude.ai | - | ⑦ 후 시작. 합계 10 시안 |
| ⑨ zip 출력 | 2A + 2B | ✅ 완료 | Claude.ai | 2026-05-28 | `uploads/BDR v2 (5).zip` (BDR v2.20) 도착 |
| **⑩ sync 실행** | 2A + 2B | ✅ 완료 | CLI | 2026-05-28 | `sync-bdr-current.ps1 -NewVersion "v2.20"` 실행 (BOM 우회 0 / commit `5609c61` 영구 해결). BDR-current = 34 루트 (game-shared.jsx NEW) + screens 26 jsx + 6 css + `_baseline/` 10 jsx 보존 / pre-snapshot `_archive/BDR-current-2026-05-28-pre-v2.20/` (26 jsx). 회귀 4+8+특수 4 케이스 통과 (game-shared ✓ / _baseline 10 ✓ / Phase 1A admin carry-over diff 0 / 가짜링크 screens 직속 0 / lucide 0 / 9999px 주석만). 시안 css 하드코딩 hex 23건 = §6-1 시안 원본 → Phase 2C 박제 시 토큰 대체 대상. |
| ⑪ 운영 박제 (Phase 2C) | 2C | ✅ 완료 (10/10) | CLI | 2026-05-29 | auto-chain 2단계 10 PR push. `13feb36`~`9292fe6`. game_applications.status Int0/1/2 단일진실 / MVP=final_mvp_user_id / 매너 평균+flag종류만 / 각 tsc0 회귀6 mock0 / 새schema·api/v1 0 |
| ⑫ 회귀 검수 (역박제 룰) | 2C | ✅ 완료 | CLI | 2026-05-29 | 각 PR 자체 회귀 6/6 PASS (더보기/RDM/--color/lucide/9999px/가짜링크). 운영→시안 drift 0 |
| ⑬ PR 결재 | 2C | ✅ 완료 | 수빈 | 2026-05-29 | chain 25 PR 일괄 머지. subin→dev `#654` `72b3399` → dev→main `#655` `6f22c02`. 운영 배포 / dev=main 정합 |
| ⑭ Phase 완료 | 2 | ✅ 종료 | CLI→Cowork | 2026-05-29 | **Phase 2 종료** — 경기 영역 운영 반영 완료. Phase 3·4도 동일 머지(#654/#655)로 운영 반영 |

### Phase 3 — 팀 영역 (시안 sync 완료)

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 3A+3B | ✅ 완료 | CLI | 2026-05-29 | v2.22 sync 안에 Phase 3(팀 7 시안) cumulative. `team-shared.jsx/css` 신규. TU1~TU5 + TA1/TA2 |
| ⑪ 운영 박제 (3C) | 3C | ✅ 완료 (6/6) | CLI | 2026-05-29 | auto-chain 3단계 6 PR push. `50ee237`~`0b61922` (TU3/TU1/TU5/TU2/TU4/TA). team_join_requests·member_requests.status=String / TeamOfficerPermissions / 운영 초과구현→비파괴 최소박제 / 각 tsc0 회귀6 mock0. PR 결재 수빈 수동 대기 |
| ⑬ PR 결재 | 3C | ✅ 완료 | 수빈 | 2026-05-29 | chain 25 PR 일괄 머지 (#654/#655) |
| ⑭ Phase 완료 | 3 | ✅ 종료 | CLI→Cowork | 2026-05-29 | 팀 영역 운영 반영 완료 (#654/#655 머지) |

### Phase 4 — 단체 영역 (시안 sync 완료)

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 4A+4B | ✅ 완료 | CLI | 2026-05-29 | v2.22 sync 독립. `org-shared.jsx/css` 신규. 4 가정 lock Q1~Q4. OU1~OU4 + OA1 + OO1~OO3 |
| ⑪ 운영 박제 (4C) | 4C | ✅ 완료 (8/8) | CLI | 2026-05-29 | auto-chain 4단계 8 PR push. `8ec6a54`~`fa7b63b` (OU1~4/OA1/OO1/OO3/OO2). OrgHierarchyCrumbs 공용(4C-2 신규) / BO1 컬럼 OU3=OA1 / Q2 6탭·Q3 3-step·Q4 5-step lock 보존 / 미지원필드 hide / 각 tsc0 회귀6 mock0. PR 결재 수빈 수동 대기 |
| ⑬ PR 결재 | 4C | ✅ 완료 | 수빈 | 2026-05-29 | chain 25 PR 일괄 머지 (#654/#655) |
| ⑭ Phase 완료 | 4 | ✅ 종료 | CLI→Cowork | 2026-05-29 | 단체 영역 운영 반영 완료 (#654/#655 머지) |

### Phase 5 — 랭킹 · 커뮤니티 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 5A+5B | ✅ 완료 | CLI | 2026-05-30 | v2.23 sync. `comm-shared.jsx/css` 신규(300+841 line). Rankings + CommunityList/Detail/New/Edit + AdminCommunity 6 jsx. 4 가정 lock A1~A4. Phase 1~4 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-05-30-pre-v2.23/`. 회귀 검수 통과 |
| ⑪ 운영 박제 (5C) | 5C | ✅ 완료 (6/6) | CLI | 2026-05-31 | auto-chain 5 commit push. `68fc5c3`(5C-1 CU4+CU3 공용 wizard·BC5 5C-6 흡수) / `c058f6e`(5C-2 CU1) / `70c6c6c`(5C-3 CU2·BC4) / `a2e01e0`(5C-4 RU1·BC1/BC7) / `3e3423f`(5C-5 CA1·OA1 답습). 공용 `community-wizard.tsx` 신규. A1 댓글 실데이터 / A2 신고 hide / A4 cross-domain·MVP·핀 hide(mock 0) / 데이터 패칭·서버액션 0 변경 / 각 tsc0 회귀6. PR 결재 수빈 수동 대기 |
| ⑫ 회귀 검수 | 5C | ✅ 완료 | CLI | 2026-05-31 | 각 PR 자체 회귀 6 PASS / 데이터 패칭 0 변경 / stop condition 발동 0. globals.css cu1-/cu2-/ru1- prefix 충돌 0 |
| ⑬ PR 결재 | 5C | ✅ 완료 | 수빈 | 2026-05-31 | subin→dev #656 + dev→main #658 머지 (운영 `26586af`) |
| ⑭ Phase 완료 | 5 | ✅ 종료 | CLI→Cowork | 2026-05-31 | 랭킹·커뮤니티 운영 반영 완료 (#658) |

### Phase 6.1 — 프로필 본체 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 6.1A+6.1B | ✅ 완료 | CLI | 2026-05-31 | v2.24 sync. `profile-shared.jsx/css` 신규(293+395 line). Profile/Edit/Basketball/Achievements/UserPublicProfile/AdminUsers 6 jsx. Phase 1~5 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-05-31-pre-v2.24/`. publicView() privacy 보존 |
| ⑪ 운영 박제 (6.1C) | 6.1C | ✅ 완료 (6/6) | CLI | 2026-05-31 | auto-chain 6 commit. `cc78745`(1 PU4·BP3) / `77dacdd`(2 PU1·BP6 보강) / `a7d4f13`(3 PU2·BP4) / `39f6a0c`(4 PU3·BP2 cross-domain 서버쿼리4) / `fd53cbe`(5 PA1·BP5 자기정지가드) / `f29a3ca`(6 PU5·BP1 publicView). 데이터 정책=server조회 허용 / 각 tsc0 회귀6 / mock 0 / DB schema·api/v1 0 |
| ⑫ 회귀 검수 | 6.1C | ✅ 완료 | CLI | 2026-05-31 | BP1 publicView privacy 7키 분기(민감3종 미페칭 노출0) / BP5 자기정지 서버가드 보강 / BP2 schema 검증후 실재필드만 / stop 발동 0. prefix pf-achv-/pu1-/pu2-/pu3-/pa1-/pu5- 충돌 0 |
| ⑬ PR 결재 | 6.1C | ✅ 완료 | 수빈 | 2026-05-31 | subin→dev #657 + dev→main #658 머지 (운영 `26586af`) |
| ⑭ Phase 완료 | 6.1 | ✅ 종료 | CLI→Cowork | 2026-05-31 | 프로필 본체 운영 반영 완료 (#658) |

### Phase 6.2 — 결제 · 구독 · 예약 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 6.2A+6.2B | ✅ 완료 | CLI | 2026-05-31 | v2.25 sync. `billing-shared.jsx/css` 신규(260+333 line). Pricing/PricingCheckout/PricingResult/ProfileBilling/ProfileBookings/AdminPayments/AdminPlans 7 jsx. Phase 1~6.1 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-05-31-pre-v2.25/`. ★ 토스 위젯 실연결 |
| ⑪ 운영 박제 (6.2C) | 6.2C | ✅ 완료 (7/7) | CLI | 2026-05-31 | auto-chain 7 commit. `dc31be2`(1 BU5·BB3) / `cb2ee63`(2 BU1·BB1 plans 실조회) / `682e275`(3 BU4·BB4 톤) / `f08a488`(4 AdminPlans·BB1 카드) / `d44af40`(5 AdminPayments·BB2 환불 실연결) / `2ce5c80`(6 BU3·BB1/BB2/BB7 3탭) / `51b4378`(7 BU2·BB5 토스 흐름 0 변경). 토스 SDK·requestPayment·confirm·refund API 0 변경 / mock 0 / 각 tsc0. BB7=PU2 결제링크 활성(6.1C-3) |
| ⑫ 회귀 검수 | 6.2C | ✅ 완료 | CLI | 2026-05-31 | 토스 위젯 mock 0(가짜 카드입력 미재현) / refund IDOR(본인만, admin타인=별도과제 기록) / plans 실데이터 일관(pricing=AdminPlans=billing) / stop 발동 0. prefix bu1~5-/ba1-2- 충돌 0 |
| ⑬ PR 결재 | 6.2C | ✅ 완료 | 수빈 | 2026-06-06 | subin→dev #659 + dev→main #660 머지 (운영 `32153c7`) |
| ⑭ Phase 완료 | 6.2 | ✅ 종료 | CLI→Cowork | 2026-06-06 | 결제·구독·예약 운영 반영 완료 (#660) |

### Phase 6.3 — 마이페이지 후반부 (성장·주간리포트·설정) · Phase 6 묶음 종료

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 6.3A+6.3B | ✅ 완료 | CLI | 2026-05-31 | v2.26 sync. `growth-shared.jsx/css` 신규(152+216). ProfileGrowth/WeeklyReport/ProfileSettings 3 jsx. Phase 1~6.2 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-05-31-pre-v2.26/` |
| ⑪ 운영 박제 (6.3C) | 6.3C | ✅ 완료 (3/3) | CLI | 2026-05-31 | auto-chain 3 commit. `280c9ef`(1 GU2 WeeklyReport·BG2) / `b9e6516`(2 GU1 ProfileGrowth·BG1) / `acbd0b2`(3 GU3 ProfileSettings·BG3). 모두 보강(데이터 패칭·액션 0 변경) / placeholder warn-soft 통일 / BG3 billing link 활성 / 각 tsc0 |
| ⑫ 회귀 검수 | 6.3C | ✅ 완료 | CLI | 2026-05-31 | KPI/마일스톤=출처 상이로 표기 정합(데이터 0 변경) / 이모지 PU4 정합 / danger 2차 confirm / stop 발동 0. prefix 충돌 0 |
| ⑬ PR 결재 | 6.3C | ✅ 완료 | 수빈 | 2026-06-06 | subin→dev #659 + dev→main #660 머지 (운영 `32153c7`) |
| ⑭ Phase 완료 | 6.3 | ✅ 종료 | CLI→Cowork | 2026-06-06 | ★ Phase 6 묶음(6.1+6.2+6.3 = 16 시안) 운영 반영 완료 (#658/#660) |

### Phase 7 — 인증 · 온보딩 영역 (AppNav 미적용 standalone)

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 7A+7B | ✅ 완료 | CLI | 2026-06-07 | v2.27 sync. `auth-shared.jsx/css` 신규(162+197). LoginSignup/Onboarding/PasswordRecovery/Verify 4 jsx. Phase 1~6.3 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-06-07-pre-v2.27/` / ★ AppNav 미적용 standalone |
| ⑪ 운영 박제 (7C) | 7C | ✅ 완료 (4/4) | CLI | 2026-06-07 | auto-chain 4 commit. `cd261b5`(1 AU1·BA1 강도미터+OAuth통일) / `62d8e92`(2 AU3·BA3 forgot hero) / `8fa3671`(3 AU4·BA4/BA5 verify 톤) / `239b779`(4 AU2·BA2 OnboardingStepper). ★ 사용자 결정=AppNav **현상유지**(해석 A, layout 0 변경) / Phase 10-5 wrapper·12-5 IdentityVerifyButton 0 변경 / 각 tsc0 |
| ⑫ 회귀 검수 | 7C | ✅ 완료 | CLI | 2026-06-07 | OAuth=활성 provider만(Apple hide) / verified 결과 카드 hide(API 미제공 mock 0) / 강도미터 5단계 정합 / IdentityVerifyButton mock 0 변경 / stop 발동 0 |
| ⑬ PR 결재 | 7C | 🔵 진행 중 | 수빈 | 2026-06-07 | subin→dev #661 (빌드 pass) / 머지 대기 |
| ⑭ Phase 완료 | 7 | ⏳ 대기 | CLI→Cowork | - | 인증·온보딩 운영 반영 |

### Phase 8 — 코트 · 장소 영역 (3측 stakeholder)

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 8A+8B | ✅ 완료 | CLI | 2026-06-07 | v2.28 sync. `court-shared.jsx/css` 신규(15594+23133 byte). Courts/CourtDetail/CourtBooking/VenueDetail/PartnerAdmin/PartnerVenue/PartnerCampaigns/AdminCourtsPartners 8 jsx. Phase 1~7 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-06-07-pre-v2.28/` |
| ⑪ 운영 박제 (8C) | 8C | ⏳ 대기 | CLI | 2026-06-07 | auto-chain 8 PR (1 VP1 / 2 VU4 / 3 VP2 / 4 VP3 / 5 VU1 / 6 VA1 / 7 VU2 / 8 VU3). ★ VU3 토스=BU2 답습 / 2측 badge / 옛 carry-over |
| ⑬ PR 결재 | 8C | ⏳ 대기 | 수빈 | - | chain subin→dev→main 머지 |
| ⑭ Phase 완료 | 8 | ⏳ 대기 | CLI→Cowork | - | 코트·장소 운영 반영 |

---

## 완료 Phase (이력)

> Phase 단위 완료 시 본 섹션으로 이동.

(없음 — Phase 1 진행 중)

---

## 갱신 규칙

### 상태 enum

- `⏳ 대기` — 다음 책임자 액션 대기
- `🔵 진행 중` — 현재 작업 중
- `✅ 완료` — 단계 완료 / 다음으로
- `❌ 차단` — 의사결정 / 데이터 / 권한 막힘 (메모에 사유)
- `⏸ 보류` — 의도적 미진행 (메모에 사유 + 재개 조건)

### 갱신 책임자

- **Cowork** = ① ~ ⑥ + ⑭
- **수빈** = ⑦ / ⑩ / ⑬ (수동 액션) — Cowork 에 한 줄 알리면 자동 갱신
- **Claude.ai** = ⑧ ~ ⑨ (수빈이 zip 받을 때 Cowork 가 대신 갱신)
- **CLI** = ⑪ ~ ⑫ (commit 마다 갱신)

### 갱신 형식

```
| <단계 번호> <단계명> | <영역> | <상태 enum> | <책임자> | <YYYY-MM-DD> | <한 줄 메모 / 파일 경로> |
```

→ 모호하면 WORKFLOW.md §5 Phase ledger 사용법 참조.

---

## 부록 A — Phase ID 정렬 룰

```
Phase 번호 ↑    영역 ↑
1A          1A     관리자 측 의뢰
1B          1B     사용자 측 + 연결 다리 의뢰
1C          1C     운영 박제
1A.5        1A.5   Phase 1A 후속 / 역박제 (필요 시)
2           2      다음 영역
```

본 ledger 안 정렬 = Phase 번호 → 영역 (1A → 1B → 1C → 2 ...).

## 부록 B — 본 ledger 갱신 이력

| 일자 | 변경 | 트리거 |
|------|------|------|
| 2026-05-25 | 초기화 (Phase 1A/1B 의뢰 작성 완료 상태) | WORKFLOW.md 도입 |
| 2026-05-25 | Phase 1B ⑦⑧⑨ ✅ + ⑩ 다른 세션 처리 메모 | v2.18 zip 도착 / 다른 세션 CLI 의뢰서 작성 |
| 2026-05-26 | Phase 1B ⑩ ✅ 완료 (CLI sync 실행) | BDR-current = 15 파일 / 회귀 검수 6 케이스 통과 |
| 2026-05-25 | Phase 2 ①~⑤ ✅ 완료 (점검 리포트 + 의뢰 2A/2B 작성) | Phase 2 결재 4건 + 의뢰 2건 작성 |
| 2026-05-26 | **통합 가이드 작성** = `phase-1A+2-claude-ai-delivery-guide-2026-05-26.md` (다른 세션 Phase 1A 가이드 superset + Phase 2 baseline 9 추가) | Phase 1A + Phase 2 묶음 전달 결정 — 옵션 B (2 세션 분리) 권장 |
| 2026-05-26 | **사용자 결재 — 옵션 B 채택** (2 세션 분리 / 대회 → 경기 순) | 가이드 §0-0 결재 결과 명시 |
| 2026-05-28 | **Phase 1C 대형 3 박제 완료** (PR-1C-14 PA2 `d33177e` / 15 Teams `044527d` / 16 Bracket `7694763`) — 15/16 박제 종료 (PA3 SKIP 제외) | 새 세션 batch / 3 commit 미push / push+결재 대기 |
| 2026-05-29 | **Auto Chain 전체 완료 (25 PR)** — Phase 2C ⑪⑫ ✅ (10 PR) / Phase 3C ⑪ ✅ (6 PR) / Phase 4C ⑪ ✅ (8 PR) + v2.22 sync(dee2445) | CLI auto-chain 1 session 완수 / subin push 완료 / subin→dev→main 머지 수빈 수동 대기 |
| 2026-05-29 | **Phase 2/3/4 운영 반영 완료** — subin→dev `#654` → dev→main `#655` (운영 `6f22c02`) | 25 PR 일괄 머지 / Vercel 운영 배포 / Phase 2 ⑬⑭ ✅ 종료 / Phase 3·4 동일 머지로 운영 반영 |
| 2026-05-30 | **Phase 5 신규 + v2.23 sync ⑩ ✅** — 랭킹·커뮤니티 영역. `comm-shared` 신규 / 6 jsx / carry-over diff 0 | Auto Chain Phase 5C 6 PR 박제 시작 |
