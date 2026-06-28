# CLI 작업 큐 — 2026-06-09 갱신 (Cowork · 수빈 요청)

> **목적**: 잔여 CLI 작업 한 눈에 보기 — 의뢰서 / 의존 / 권장 다음 액션
> **갱신 트리거**: 당일 zip 3종 도착 (BDR v2 (9)~(12)) + 수빈 요청
> **이전 큐**: `_cli-queue-status-2026-06-08.md`
> **비고**: 본 문서는 같은 날 09:00 모니터 자동판(zip 도착 *전*, "변화 0")을 **supersede** — 오후 도착 시안 3종 반영본.

---

## 0. ★ 당일 업데이트 (2026-06-09) — 대회상세/종료 재구성 시안 3종 도착

```
✅ BDR v2 (9)  = 대회상세(진행중) 재구성 — _zips/BDR-v2-9-대회상세-redesign-2026-06-09.zip
✅ BDR v2 (10) = 대회종료 재구성 (초안)      — _zips/BDR-v2-10-대회종료-redesign-2026-06-09.zip
✅ BDR v2 (11) = 대회종료 재구성 (기사 2열)  — _zips/BDR-v2-11-대회종료-redesign-v2-2026-06-09.zip  ★종료 active
   · BDR v2 (12) = v11 과 byte 동일 (md5 전부 일치) → 중복, 사본 미생성
✅ 박제 의뢰서 2건 작성:
   · tournament-detail-redesign-bake-cli-prompt-2026-06-09.md    (진행중 v2(9))
   · tournament-completed-redesign-bake-cli-prompt-2026-06-09.md (종료 v2(11))

→ 06-08 큐의 "회귀 v2 종료대회 Claude.ai paste 대기"(C) = 시안 도착으로 해소 → 이제 ③ bake 단계.

★ Cowork schema 실측 발견 (회귀 방지):
   시안 HANDOFF "스탯 리더·대회 기사 = DB 미보유" = Claude.ai 가 운영 DB 못 봐서 생긴 오판.
   운영 실측 = 둘 다 기존 데이터로 박제 가능 → 수빈 결재 "0 스키마 박제".
   · 스탯 리더 = match_player_stats 집계 (points/total_rebounds/assists/threePointersMade, 인덱스 O)
   · 대회 기사 2열 = community_posts(알기자, category=news, tournament_id) 리스트 + news_photo(is_hero)
   → 신규 테이블/컬럼 ❌ (③ 의뢰서 stop condition 에 박음)
```

---

## 1. 변경 사항 (06-08 → 06-09)

```
🆕 대회상세(진행중) 박제 의뢰서 (v2(9))
🆕 대회종료 박제 의뢰서 (v2(11)=v2(12), 기사 2열, 0스키마)
유지: Phase 9 v2.29 sync 미실행 (BDR-current = 여전히 v2.28 / 46c41e6, 6-07)
해소: 회귀 v2 종료대회 = Claude.ai 박제 도착 → bake 단계(③) 로 전환

git 상태 (2026-06-09):
  · origin/main = 7531ef8 (#664)
  · subin = 72a2ed6 (#663) — 정합 / 미push 0
  · BDR-current = v2.28 (Phase 9 sync 실행 시 → v2.29)
```

---

## 2. 현재 CLI 큐 — 3 건

| # | 항목 | 상태 | 의뢰서 | 의존 |
|---|------|-----|-------|------|
| ① | **Phase 9 v2.29 sync** | 의뢰서 ready → 실행 대기 | `phase-9-v2.29-sync-cli-prompt-2026-06-08.md` | 독립 (②③ 무관) |
| ② | **대회상세(진행중) 박제** | 의뢰서 ready | `tournament-detail-redesign-bake-cli-prompt-2026-06-09.md` | `tdr-*` 기준 확정 |
| ③ | **대회종료 박제** | 의뢰서 ready (0스키마) | `tournament-completed-redesign-bake-cli-prompt-2026-06-09.md` | **② 후 권장** (tdr-* 재사용) |

- ① = 알림·메시지·검색 (Phase 9C/10 체인 해제). ②③ = 대회 `tournaments/[id]/page.tsx` (진행중/종료 분기).
- ① ⊥ ②③ (다른 파일). ② → ③ 순서 권장 (같은 page.tsx, ②가 tdr-* 베이스 먼저 박제).

---

## 3. 권장 실행 순서 (CLI 한 줄)

```
[① Phase 9 sync ★ 다음 액션]
  Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2(A)부터. 결재 default 자동.
  → BDR-current v2.29 + Phase 9C Auto Chain (NU1/NU2/NU3/NA1 4 PR)

[② 대회상세(진행중) 박제]
  Read Dev/design/prompts/tournament-detail-redesign-bake-cli-prompt-2026-06-09.md 하고 §2부터.
  강조색=var(--cafe-blue) (§3 함정) / status==='completed' 분기 보존 / 결재 default 자동.

[③ 대회종료 박제] (② 후)
  Read Dev/design/prompts/tournament-completed-redesign-bake-cli-prompt-2026-06-09.md 하고 §1+§2부터.
  0스키마(신규 DB ❌) / 강조 var(--cafe-blue) / mock 박제 ❌ / 종료 분기만.
```

---

## 4. 즉시 시작 명령

```
# 다음 액션 (CLI):
Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2(A)부터 시작해줘.
```

---

## 5. Phase 진행 점수판 (2026-06-09)

| Phase / 항목 | Claude.ai | sync | 운영 박제 | dev→main | 비고 |
|-------|----------|------|---------|---------|------|
| 1~8 | ✅ v2.19~v2.28 | ✅ | ✅ | ✅ #650~#664 | 91 page 완료 |
| 9 (알림·메시지·검색) | ✅ v2.29 | ⏸ **①** | ⏸ 9C | ⏸ | sync 실행 = 다음 액션 |
| 10 (정보 페이지) | ⏸ | ⏸ | ⏸ | ⏸ | 9C 뒤 큐 (paste 대기) |
| 회귀: 대회상세 진행중 | ✅ v2(9) | — | ⏸ **②** | ⏸ | 단일 페이지 박제 |
| 회귀: 대회종료 | ✅ v2(11) | — | ⏸ **③** | ⏸ | 0스키마 · 기사 2열 |

→ **Phase 1~8 운영 반영 완료 (91 page)**. 09:00 모니터판 대비 = 당일 시안 3종 + 의뢰서 2건 추가.

---

## 6. 핵심 결재 / 주의 (②③ 공통)

```
· 강조색 = var(--cafe-blue) (#0F5FCC). td-redesign.css --cta:var(--accent)(빨강)는 폴백 — 인라인 #0F5FCC 가 확정값. 빨강 오박 주의. 승자 점수만 var(--bdr-red).
· ③ 0 스키마 — 신규 DB 테이블/컬럼 ❌. 발견 시 STOP (실측상 불필요).
· 진행중 뷰 ↔ 종료 뷰 분기 상호 보존 (한 쪽 박제가 다른 쪽 깨지 않게).
· Stop: lint/tsc · 회귀 6 · DB schema · /api/v1 · LOC>+2000 · mock 박제 · 사용자결정 §1~§8.
```

---

## 7. 기타 대기 (큐 외 · 연속성)

```
· Phase 10 (정보 페이지 5) — Claude.ai paste 대기 (phase-10-claude-ai-delivery-prompt-2026-06-08.md). Phase 9C 후 진입.
· mobile OAuth /api/v1 (#663/#664) — 원영 사후 공지 (Flutter 영향).
· PA3 재설계 — planner DB 보류 (옵션 A/B/C 결재). 본 큐 영향 0.
· 머지 = STAGE A 일괄 (subin → dev → main), ①②③ PR 모인 뒤.
```

---

**큐 끝.** 다음 = CLI ① Phase 9 sync → ② 대회상세 → ③ 대회종료. 머지는 STAGE A 일괄.
