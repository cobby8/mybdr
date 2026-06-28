# CLI 작업 큐 — 2026-06-08 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 보기 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`) + zip 도착 이벤트
> **이전 큐**: `_cli-queue-status-2026-06-07.md`
> **당일 이력**: 오전 점검 = "Phase 9 박제 시작 대기" → **14:40 Phase 9 v2.29 zip 도착 → sync 의뢰서 작성** (본 갱신)

---

## 0. ★ 당일 업데이트 (14:40) — Phase 9 v2.29 zip 도착

```
✅ Phase 9 (알림·메시지·검색) 박제 zip 도착 — "BDR v2 (8).zip" = BDR v2.29
   · _zips/BDR-v2.29-phase9-bake-2026-06-08.zip 로 영구 사본 저장
✅ Cowork 사전 diff 검증 (diff -rq 실측) = 클린 incremental:
   · 변경 = README.md / index.html (버전) · 추가 10 (notify-shared.jsx/css + nu1~3/na1 html + 4 screens jsx)
   · 삭제 0 · Phase 1~8 carry-over 변경 0
✅ sync CLI 의뢰서 자동 작성 = phase-9-v2.29-sync-cli-prompt-2026-06-08.md (옵션 A · 17 케이스 검수)

→ 다음 = CLI sync 1 회 실행 → Phase 9C Auto Chain (4 PR 예상)
```

---

## 1. 변경 사항 (06-07 → 06-08)

```
✅ Phase 7 (인증·온보딩 4) 종료 — v2.27 → 7C → #662
✅ Phase 8 (코트·장소 8) 종료 — v2.28 → 8C → #662
✅ mobile OAuth /api/v1/auth/kakao·google (#663/#664) 운영 반영 — ★ Flutter api/v1 = 원영 사후 공지 대상
🆕 Phase 9 v2.29 zip 도착 + sync 의뢰서 작성 (위 §0)
🆕 Phase 10 (정보 페이지 5) 의뢰서 + delivery prompt + baseline ready — Phase 9 뒤 큐

git 상태 (2026-06-08):
  · origin/main  = 7531ef8 (#664)
  · origin/dev = origin/subin = 72a2ed6 (#663) — 정합
  · BDR-current  = v2.28 (sync 실행 후 → v2.29)
  · 미커밋 working-tree = .claude/ 내부 (design/src 무관 · 영향 0)
```

---

## 2. 현재 CLI 큐 — 1 건 (sync 실행 대기)

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| A | **Phase 9 v2.29 sync** | ✅ 의뢰서 작성됨 → 실행 대기 | CLI | `Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md` §2(A)부터 |
| B | Phase 9C 운영 박제 | ⏸ sync 후 | CLI | sync 완료 → Cowork batch 의뢰서 (4 PR) 자동 작성 |
| C | Phase 10 Claude.ai 박제 | ⏸ Phase 9 뒤 큐 | 수빈 | Phase 9C 후 phase-10-claude-ai-delivery-prompt paste |
| D | (선택) PA3 재설계 | ⏸ 보류 | 수빈 | 옵션 A/B/C 결재 |

→ **다음 진행 = Phase 9 sync 실행** (CLI 1 회). 사용자 결재 = 옵션 A 자동 (반대 시에만 중단).

---

## 3. 권장 실행 순서

```
[Step 1 — Phase 9 v2.29 sync ★ 다음 액션]
  CLI 에 한 줄:
  "Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2 사전 점검 + 옵션 결재(A)부터 시작해줘."
  → DryRun → 실행 → 회귀 17 케이스 → phase-ledger Phase 9 ⑩ ✅ → commit/push
  → BDR-current = v2.29 (root 104 / screens 84 / notify-shared 신규)

[Step 2 — Phase 9C 운영 박제] sync 후
  Cowork 가 phase-9C-batch-cli-prompt 자동 작성 (4 PR: NU1 Notifications / NU2 Messages carry / NU3 Search / NA1 AdminNotifications)
  → 옵션 B (보수·mock 0) 자동 결재 / NU2 "준비 중" carry / NA1 /admin/notifications

[Step 3 — Phase 10 박제] Phase 9C 후
  phase-10-claude-ai-delivery-prompt-2026-06-08.md §메시지 본체 paste (정보 페이지 5 시안)
```

---

## 4. 즉시 시작 명령

```
# Phase 9 sync (CLI, 다음 액션):
Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2(A)부터 시작해줘.
```

---

## 5. Phase 진행 점수판 (2026-06-08 14:40)

| Phase | 영역 | Claude.ai | sync | 운영 박제 | dev→main | 완료 | 비고 |
|-------|------|----------|------|---------|---------|------|------|
| 1A | 대회 관리자 (10) | ✅ v2.19 | ✅ | ✅ 15/16 | ✅ #653 | ✅ | PA3 SKIP |
| 1B | 대회 사용자 (8) | ✅ v2.18 | ✅ | ✅ | ✅ #653 | ✅ | |
| 2 | 경기 (10) | ✅ v2.20 | ✅ | ✅ 10/10 | ✅ #655 | ✅ | |
| 3 | 팀 (7) | ✅ v2.21 | ✅ | ✅ 6/6 | ✅ #655 | ✅ | |
| 4 | 단체 (8) | ✅ v2.22 | ✅ | ✅ 8/8 | ✅ #655 | ✅ | Q1~Q4 lock |
| 5 | 랭킹·커뮤니티 (6) | ✅ v2.23 | ✅ | ✅ 6/6 | ✅ #658 | ✅ | |
| 6.1 | 프로필 본체 (6) | ✅ v2.24 | ✅ | ✅ 6/6 | ✅ #658 | ✅ | |
| 6.2 | 결제·구독·예약 (7) | ✅ v2.25 | ✅ | ✅ 7/7 | ✅ #660 | ✅ | |
| 6.3 | 성장·리포트·설정 (3) | ✅ v2.26 | ✅ | ✅ 3/3 | ✅ #660 | ✅ | |
| 7 | 인증·온보딩 (4) | ✅ v2.27 | ✅ | ✅ 4/4 | ✅ #662 | ✅ | standalone |
| 8 | 코트·장소 (8) | ✅ v2.28 | ✅ | ✅ 8/8 | ✅ #662 | ✅ | 3측 stakeholder |
| **9** | **알림·메시지·검색 (4)** | ✅ **v2.29** | ⏸ **의뢰서 ready** | ⏸ | ⏸ | ⏸ | **★ zip 도착 → sync 실행 대기** |
| 10 | 정보 페이지 (5) | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | 의뢰서+delivery+baseline ready / Phase 9 뒤 큐 |

→ **Phase 1~8 운영 반영 완료 (77 시안)**. Phase 9 = sync 직전 (박제 ✅).

---

## 6. 자동 점검 결과 (Cowork scheduled task — 2026-06-08)

```
[uploads 점검] ★ Phase 9 zip 도착 확인 (파일 도구로 수빈 세션 uploads 접근)
  - "BDR v2 (8).zip" = Dev/design/BDR v2.29/ (104 root / 84 screens / 11 shared)
  - _zips/BDR-v2.29-phase9-bake-2026-06-08.zip 영구 사본 저장
  - diff -rq vs BDR-current(v2.28) = 변경 README/index + 추가 10 + carry-over diff 0

[phase-ledger 점검] Phase 1~8 ✅ / Phase 9 섹션 = sync 의뢰서 §5 로 추가 예정
  - ⚠ 부록 B 이력 = 06-08 sync 시 같이 1줄 추가 권장

[git 점검] ✅ main #664 / dev=subin #663 정합 / Phase 9C/10C commit 0

[의뢰서 점검] ✅ Phase 9 sync 의뢰서 자동 작성 (phase-9-v2.29-sync-cli-prompt-2026-06-08.md)
  - 운영 박제 batch 의뢰서 = sync 후 작성 (sync✅+박제⏸ 진입 시)
  - 본 큐 status 갱신 ✅

[다음 액션 우선순위]
  1. ★★★ CLI: Phase 9 v2.29 sync 실행 (의뢰서 ready)
  2. sync 후 Cowork: Phase 9C batch 의뢰서 자동 작성 (4 PR)
  3. (사후) mobile OAuth api/v1 원영 공지
  4. (선택) PA3 재설계 옵션 결재
```

---

## 7. (선택) PR-1C-10 PA3 재설계 — 별 의뢰

planner 재설계 대기. 본 큐 영향 0.

```
[옵션 A] 신규 기능 — DB 변경 / 큰 작업
[옵션 B] 리디자인만 — DB 변경 ❌
[옵션 C] SKIP 유지 (보류)
```

---

**큐 끝.** ★ Phase 9 v2.29 zip 도착 + sync 의뢰서 작성 완료. **다음 = CLI sync 1 회 실행 → Phase 9C.**
