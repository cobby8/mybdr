# CLI 작업 큐 — 2026-06-16 갱신 (Cowork 자동 점검)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: Cowork scheduled task (`mybdr-progress-monitor`)
> **이전 큐**: `_cli-queue-status-2026-06-15.md`
> **당일 요지**: 새 zip 0. **신규 = 로컬 미push 커밋 1건**(`502fe53` 대회 상태 표시 fix). 일관성 QA paste 미발송 이월. CLI 박제 큐는 비어있음.

---

## 0. ★ 당일 점검 (2026-06-16 09:00)

```
🆕 git : 로컬 subin 에 미push 커밋 1건 — 502fe53 (대회 진행중 종료 오표시 fix · src/lib/constants/tournament-status.ts + test)
         origin main = dev = subin 정합(583225a) / origin/subin..subin = 1 / 운영 미반영
✅ uploads / _zips : 새 zip 0 — BDR-v2.31-FULL(6/14) 이 마지막. 처리 완료.
✅ BDR-current : v2.31 FULL sync 완료. ②③ 역박제 보존 (TournamentDetail/Completed 미변경)
✅ 박제 frontier : Phase 1~12 + 라인업 + mock→real + P1-a/b + Admin S2 머지 종료 (STAGE A~D ✅)
⚠️ phase-ledger.md : 6/12(Phase 9C) 이후 미갱신 — 6/13~6/16 진척 미기록. 다음 CLI 세션 ledger 정리 권장.
ℹ️ 의뢰서 : 일관성 QA delivery 작성됨(`design-consistency-qa-delivery-2026-06-15.md`) — Claude.ai paste 대기

→ 다음 = (수빈) 502fe53 push+PR / 일관성 QA paste / STAGE E·F 결재. _next-actions-2026-06-16.md 참조.
```

---

## 1. 변경 사항 (06-15 → 06-16)

```
🆕 502fe53 (2026-06-16 03:14) — fix(tournament): effectiveStatus in_progress 보정 제외
   · 진행중 대회가 종료로 오표시되던 표시레이어 보정 / 메모리 [대회 상태 오표시 전수조사] 후속
   · src/lib/constants/tournament-status.ts (+5) + effective-tournament-status.test.ts (+11 -4)
   · 스키마·api/v1 0 / subin 로컬만 (미push)
· 그 외 박제 frontier·zip·BDR-current 변화 0 (6/15 상태 유지)
```

---

## 2. 현재 CLI 큐 — 박제 큐 비어있음 (신규 = push 대기 1건)

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|------|-----|------|---------|
| 0 | **502fe53 push + PR** | 🆕 미push | **수빈** | `git push origin subin` → subin→dev → dev→main 머지 ★ 오늘 신규 |
| A | **일관성 QA 패스** | ⏳ delivery 작성됨 | **수빈** | brief+v2.31 zip drag-drop + paste (6/15 이월) |
| B | 일관성 QA 픽스 batch | ⏸ QA 회신 zip 후 | Cowork→CLI | `_qa/bake-fix-checklist.md` 축별 분할 박제 |
| C | STAGE E (Phase 13 home+legal) | ⏸ 결재 대기 | 수빈→Cowork | 옵션 A(법적 먼저·권장) / B(통합) 결재 1줄 |
| D | STAGE F (잔여 사용자 5) | ⏸ 선택 | 수빈→Cowork | games/edit·report / my-games / guest-apps / profile-complete |
| E | 잔여 minor 2 (qual 정렬·FormEvent 캐스팅) | ⏸ 선택 (동작 영향 0) | CLI | 다음 박제 세션에 묶어 처리 |
| F | phase-ledger 갱신 | ⏳ 적체 | CLI | 6/13~6/16 진척 ledger 반영 |
| G | (선택) PA3 재설계 | ⏸ 보류 (STAGE G) | 수빈 | 옵션 A/B/C 결재 |

---

## 3. Phase 점수판 (STAGE 기준)

```
STAGE A (정합·회귀)   : ✅ 종료 (Phase 9 + 회귀 v2 + RECORDER-AUDIT)
STAGE B (Phase 10)    : ✅ 종료 (5/5 박제+머지)
STAGE C (Phase 11 ×9) : ✅ 종료 (v2.31 FULL 박제+머지)
STAGE D (Phase 12)    : ✅ 종료 (super-admin Batch A/B + Admin Console S2)
+ 라인업 LC1 / mock→real / P1-a court / P1-b awards : ✅ 종료
+ 대회 상태 표시 fix (502fe53)                      : 🆕 push 대기 (운영 미반영)
STAGE E (Phase 13)    : ⏸ 결재 대기 (home full + legal ~3 · safety 는 v2.31 포함)
STAGE F (잔여 사용자) : ⏸ ~5 page (games/edit·report / my-games / guest-apps / profile-complete)
STAGE G (PA3/referee) : ⏸ 별 결재 (referee = Flutter / 원영 이탈로 담당 공백)
+ 일관성 QA 패스       : ⏳ Claude.ai paste 대기 (전체 완성도 점검 디자인 축)
```

---

## 4. 권장 실행 순서 (오늘)

```
1. (수빈) 502fe53 push + PR 머지       — git push origin subin → subin→dev → dev→main ★ 신규·저위험
2. (수빈) 일관성 QA paste              — brief + v2.31 FULL zip drag-drop + delivery §paste 본문
3. (수빈) STAGE E 결재 1줄 (선택)      — 옵션 A(법적 먼저) 권장 / 또는 STAGE F 우선
   → 결재 시 Cowork 가 다음 09:00 루프에서 해당 STAGE 의뢰 패키지 자동 작성
```
