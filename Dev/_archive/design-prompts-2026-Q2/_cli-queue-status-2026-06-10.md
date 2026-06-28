# CLI 작업 큐 — 2026-06-10 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`) + zip 도착 이벤트
> **이전 큐**: `_cli-queue-status-2026-06-09.md`
> **당일 요지**: 어제 준비분 **전부 실행됨** (Phase 9 sync + 대회상세 v2(9) 박제 + #665/#666 머지). 남은 STAGE A = 박제 2건(종료 대회 + 9C). 새 zip 0.

---

## 0. ★ 당일 점검 (2026-06-10 09:00)

```
큰 진전 — 어제 큐 2건 + 추가 작업 모두 완료.

✅ git : subin = origin/subin(830e114) 정합 / 미push 0 / 대기 PR 0
   · subin→dev #665 → dev→main #666 머지 완료 (오늘 새벽, 운영 반영)
✅ Phase 9 v2.29 sync 실행 완료 (fb81e53)
✅ 대회상세 진행중 뷰 재구성 박제 v2(9) (a9cb476) + 역박제(508325a) + 검증 PASS(830e114)
✅ BDR-current = v2.29 + 대회상세 진행중 뷰 역박제 반영
✅ 새 zip 도착 0 — 최신 = _zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip (어제 처리·박제 대기)

⏸ 남은 STAGE A = 박제 2건 (둘 다 의뢰서 ready / 독립):
   1) 종료 대회 재구성 박제 (P0 회귀) — 선행(v2(9) 진행중 뷰) 해소됨 → 실행 가능
   2) Phase 9C 운영 박제 4 PR — sync 완료라 §4 만 실행

→ 다음 = 위 2건 한 세션 박제 (액션 1). _next-actions-2026-06-10.md 참조.
```

---

## 1. 변경 사항 (06-09 → 06-10)

```
✅ Phase 9 v2.29 sync 실행 (fb81e53)
✅ 대회상세 진행중 뷰 v2(9) 박제 + 역박제 + 검증 (a9cb476 / 508325a / fe971d7 / 830e114)
✅ subin→dev #665 / dev→main #666 머지 (운영 반영)

git 상태 (2026-06-10):
  · origin/main  = #666 (dev→main) — 최신
  · origin/dev = #665 (subin→dev)
  · origin/subin = 830e114 = local subin — 정합 / 미push 0
  · BDR-current  = v2.29 + 대회상세 진행중 뷰
```

---

## 2. 현재 CLI 큐 — 박제 2건 (둘 다 ready)

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| A | **종료 대회 재구성 박제 (P0 회귀)** | ✅ 의뢰서 ready · 선행 해소 → 실행 대기 | CLI | `Read tournament-completed-redesign-bake-cli-prompt-2026-06-09.md` §1+§2 |
| B | **Phase 9C 운영 박제 4 PR** | ✅ 의뢰서 ready (§3 sync 완료) → §4 실행 대기 | CLI | `Read phase-9-auto-chain-cli-prompt-2026-06-07.md` §4 만 |
| C | Phase 10 정보 페이지 박제 | ✅ 패키지 ready → Claude.ai 전달 대기 | 수빈 | `phase-10-claude-ai-delivery-prompt-2026-06-08.md` paste (병렬/STAGE B) |
| D | (선택) PA3 재설계 | ⏸ 보류 | 수빈 | 옵션 A/B/C 결재 |

→ **다음 = A + B 한 세션 박제** (액션 1). P0 회귀(A) 먼저. 결재 = default 자동(반대 시 중단). Phase 10(C)은 병렬 선택.

---

## 3. 권장 실행 순서

```
[Step 1 — 종료 대회 박제 ★ 다음 액션 · P0]
  Read tournament-completed-redesign-bake-cli-prompt-2026-06-09.md §1+§2 부터
  → 0 스키마(스탯=match_player_stats 집계 / 기사=community_posts+news_photo)
  → 강조 var(--cafe-blue) / 승자점수 --bdr-red / 네이비배너 --bdr-navy
  → 사이드바 제거 · NBA 브래킷 · 기사 2열 · 진행중 뷰 불변 · mock ❌
  → 산출: src/lib/tournaments/stat-leaders.ts 신규 + TournamentCompleted 역박제 = 1 PR

[Step 2 — Phase 9C 운영 박제 4 PR] (같은 세션 이어서)
  Read phase-9-auto-chain-cli-prompt-2026-06-07.md §4 만 (§3 sync 완료)
  → 9C-1 NU1 Notifications / 9C-2 NU3 Search / 9C-3 NU2 Messages(준비중 carry·mock 0) / 9C-4 NA1 AdminNotifications
  → 옵션 B(보수·mock 0) 자동 / messages 모델 신설 ❌

[Step 3 — 머지] A+B PR 도착 후
  subin → dev → main 일괄 (STAGE A 종료)

[병렬/선택 — Phase 10 Claude.ai paste]
  phase-10-claude-ai-delivery-prompt-2026-06-08.md §메시지 본체 + 4 drag-drop
```

---

## 4. 즉시 시작 명령

```
# 종료 대회 박제 (CLI, 다음 액션 · P0):
Read Dev/design/prompts/tournament-completed-redesign-bake-cli-prompt-2026-06-09.md 하고 §1 데이터출처 + §2 사전점검부터 시작해줘. 0 스키마·var(--cafe-blue)·종료 분기만·mock ❌. 결재 default 자동.

# 이어서 Phase 9C 4 PR:
Read Dev/design/prompts/phase-9-auto-chain-cli-prompt-2026-06-07.md §4 만 실행해줘. §3 sync 완료. 결재 default 자동.
```

---

## 5. Phase 진행 점수판 (2026-06-10 09:00)

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
| 8 | 코트·장소 (8) | ✅ v2.28 | ✅ | ✅ 8/8 | ✅ #664 | ✅ | 3측 stakeholder |
| **9** | **알림·메시지·검색 (4)** | ✅ v2.29 | ✅ | ⏸ **4 PR ready (§4)** | ⏸ | ⏸ | **★ 운영 박제 = 다음 액션 B** |
| **회귀 v2** | **대회 진행중 뷰 (1)** | ✅ | ✅ | ✅ a9cb476 | ✅ #666 | ✅ | 종료뷰 선행 (공용 tdr-*) |
| **회귀 v2** | **대회 종료 뷰 (1)** | ✅ v2(11) | ⏸ | ⏸ **ready** | ⏸ | ⏸ | **★ P0 = 다음 액션 A** |
| 10 | 정보 페이지 (5) | ⏸ 패키지 ready | ⏸ | ⏸ | ⏸ | ⏸ | Phase 9C 후 paste (병렬 가능) |

→ **Phase 1~8 운영 반영 완료 (77 시안) + Phase 9 sync + 대회 진행중 뷰**. 남은 STAGE A = 종료 뷰 + 9C 박제(2건).

---

## 6. 자동 점검 결과 (Cowork scheduled task — 2026-06-10)

```
[uploads / _zips 점검] 새 zip 0
  - 최신 = _zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip (어제 도착 · 박제 대기)
  - 본 세션 uploads = SKILL.md (task 본체)만

[phase-ledger 점검] Phase 1~8 ✅ / Phase 9 ⑩ ✅ (sync) / ⑪ ⏸ (9C 박제 대기)
  - ⚠️ ledger stale: 대회상세 v2(9) 박제 + #665/#666 머지 미반영
    → CLI 가 액션 1 박제 commit 시 Phase 9 ⑪ + 회귀 v2 행 함께 갱신 권장

[git 점검] ✅ main #666 / dev #665 / subin 정합 / 미push 0 / 대기 PR 0
  - 어제 대비 진전 = sync + 대회상세 박제 + 머지 (어제 준비분 실행 완료)

[의뢰서 점검] ✅ 신규 작성 불필요 — 대기 의뢰서 전부 존재
  - 종료 대회 박제 : tournament-completed-redesign-bake-cli-prompt-2026-06-09.md ✅
  - Phase 9C       : phase-9-auto-chain-cli-prompt-2026-06-07.md §4 ✅
  - Phase 10       : phase-10-claude-ai-delivery-prompt-2026-06-08.md ✅

[다음 액션 우선순위]
  1. ★★★ CLI: 종료 대회 박제 (P0 회귀 · 의뢰서 ready · 선행 해소)
  2. ★★★ CLI: Phase 9C 4 PR (같은 세션 이어서 · §4)
  3. (병렬) Claude.ai: Phase 10 paste (선택)
  4. (액션 1 후) 머지: subin→dev→main → STAGE A 종료
  5. (사후) mobile OAuth api/v1 원영 공지
  6. (선택) PA3 재설계 옵션 결재
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

**큐 끝.** ★ 어제 준비분 전부 실행 완료. **다음 = CLI 박제 2건(종료 대회 P0 + Phase 9C 4 PR) 한 세션 → 머지 → STAGE A 종료.**
