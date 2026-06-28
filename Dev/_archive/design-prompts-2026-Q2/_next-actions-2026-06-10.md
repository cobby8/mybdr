# 오늘의 액션 (2026-06-10)

> Cowork 자동 루프 (`mybdr-progress-monitor`) — 매일 09:00.
> **요지**: 어제 준비분 **모두 실행됨** (Phase 9 sync ✅ + 대회상세 진행중 뷰 v2(9) 박제 ✅ + #665/#666 머지 ✅).
> 남은 STAGE A = **CLI 박제 2건** (종료 대회 + Phase 9C). 둘 다 의뢰서 ready / 선행 의존 해소됨.
> 직전 액션 문서: `_next-actions-2026-06-09.md` / 큐: `_cli-queue-status-2026-06-10.md`

---

## ☑ 어제 → 오늘 변화 (실행 확인)

```
✅ Phase 9 v2.29 sync 실행 완료        (fb81e53)
✅ 대회상세 진행중 뷰 재구성 박제 v2(9) (a9cb476) + 역박제(508325a) + 검증 PASS(830e114)
✅ subin→dev #665 → dev→main #666 머지  (오늘 새벽 운영 반영)
→ subin = 정합 / 미push 0 / 대기 PR 0
```

---

## ☐ 액션 1 — CLI (한 세션, ~15분) ★ STAGE A 마무리

박제 2건을 **한 세션에 순서대로**. P0 회귀(종료 대회) 먼저 → Phase 9C. 둘 다 독립.

**CLI 메시지 (그대로 붙여넣기)**:

```
STAGE A 마무리 — 박제 2건 순서대로 (한 세션):

1) Read Dev/design/prompts/tournament-completed-redesign-bake-cli-prompt-2026-06-09.md
   하고 §1 데이터출처 + §2 사전점검부터 시작해줘.
   0 스키마(신규 DB ❌) · 강조색 var(--cafe-blue) · 종료 분기만 · mock 박제 ❌.

2) 이어서 Read Dev/design/prompts/phase-9-auto-chain-cli-prompt-2026-06-07.md
   §4 (Phase 9C 4 PR)만 실행해줘. §3 sync 는 이미 완료(fb81e53)라 건너뛰어.
   NU1 Notifications / NU3 Search / NU2 Messages(준비중 carry) / NA1 AdminNotifications.

둘 다 결재 default 자동(반대 시에만 중단). 끝나면 subin push + GitHub PR.
```

→ 산출 = **종료 대회 박제 1 PR**(stat-leaders.ts 신규 + TournamentCompleted 역박제) + **Phase 9C 4 PR** = 총 5 PR.
→ Stop 조건: lint/tsc 실패 · 회귀 6 위반 · DB schema/messages 모델 신설 · /api/v1 · LOC>+2000 · mock 사용.

---

## ☐ 액션 2 — Claude.ai paste (2분) · **선택 (병렬 / STAGE B 선행)**

Phase 10 정보 페이지 5 시안. 계획상 STAGE B(9C 뒤)지만, Claude.ai 파이프라인을 채우려면 **지금 병렬 paste 가능**. 엄격 순서를 원하면 9C 완료 후로 미뤄도 됨.

**첨부 (drag-drop 4건)**:
- `Dev/design/_zips/BDR-current-phase10-baseline-2026-06-08.zip` (605KB)
- `Dev/design/prompts/info-pages-user-admin-connectivity-plan-2026-06-08.md`
- `Dev/design/prompts/info-pages-user-redesign-prompt-2026-06-08.md`
- `Dev/design/prompts/info-admin-redesign-prompt-2026-06-08.md`

**paste 본문**: `phase-10-claude-ai-delivery-prompt-2026-06-08.md` §메시지 본체 (5 시안 = IU1 About + IU2 News + IU3 Help·Glossary + IU4 Reviews + IA1 AdminNews).

→ zip 회신 도착 시 Cowork 에 "Phase 10 zip 도착" 한 줄 → 자동 sync + Phase 10C Auto Chain(5 PR).

---

## ☐ 액션 3 — GitHub PR 머지 (3분) · **액션 1 완료 후**

작업 시작 시점 = 대기 PR 0(어제 #665/#666 머지 완료). 액션 1이 5 PR 생성한 뒤:

```
subin → dev PR 머지 → dev → main PR 머지 → main 운영 배포
```

→ 머지 시 STAGE A 종료 (Phase 9 + 회귀 v2 종료 대회 운영 반영 완료).

---

## 상태

```
박제+머지 완료 : Phase 1~8 (77 시안) + Phase 9 sync(v2.29) + 대회상세 진행중 뷰 v2(9)
진행 중(STAGE A): 종료 대회 박제 ⏸(ready) · Phase 9C 운영 박제 4 PR ⏸(ready)
다음 큐(STAGE B): Phase 10 정보 페이지 5 — 패키지 ✅ ready
git : subin=dev(#665)=main(#666) 정합 / 미push 0 / 대기 PR 0
BDR-current : v2.29 + 대회상세 진행중 뷰 역박제 반영
```

## 알림

- ✅ 어제 준비 2건 + 추가 작업(대회상세 v2 박제) 모두 완료 — 진행 양호.
- ⏳ phase-ledger Phase 9 ⑪ 은 9C 박제(액션 1) 시 CLI 가 ✅ 갱신. 현재 ledger 는 대회상세 v2(9) 박제·#665/#666 머지 미반영(stale) — 액션 1 박제 commit 때 CLI 가 함께 정리 권장.
- 🆕 새 zip 도착 0 (최신 = _zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip / 어제 처리 · 박제 대기).
- ℹ️ mobile OAuth `/api/v1/auth/kakao·google`(#663/#664) = Flutter 영역 → 원영 사후 공지 대상(미처리 시).
