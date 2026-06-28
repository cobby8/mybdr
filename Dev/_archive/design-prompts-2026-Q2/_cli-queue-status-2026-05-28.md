# CLI 작업 큐 — 2026-05-28 갱신 (Phase 4 박제 zip 도착 후)

> **목적**: 수빈이 CLI 에 던질 다음 작업을 한 눈에 보기 — 의존성 / 권장 순서 / 의뢰서 위치 / 예상 시간
> **갱신**: Cowork (Phase 4 박제 zip 도착 + Phase 4 sync 의뢰서 작성 후)

---

## 1. 대기 중 CLI 의뢰서 — 2 건 (단순화)

| # | 의뢰서 | 영역 | 예상 시간 | 의존 | 산출 |
|---|--------|-----|---------|------|------|
| **A** | `phase-4-v2.22-sync-cli-prompt-2026-05-28.md` ⭐ **최신** | **시안 sync** (Phase 2 + 3 + 4 동시) | ~5분 | 독립 | BDR-current = v2.22 cumulative + commit/push |
| **B** | `phase-1C-batch-cli-prompt-2026-05-28.md` | **운영 박제 batch** (Phase 1 대회 영역) | ~1 session | 독립 | 15 PR (PR-1C-2 ~ 1C-16) — subin → dev |
| (옵션) | `phase-3-v2.21-sync-cli-prompt-2026-05-28.md` | (옵션 B 분리 sync — v2.21) | ~5분 | 의뢰 A 가 superset | Phase 2 + 3 만 |
| (옵션) | `phase-2-v2.20-sync-cli-prompt-2026-05-28.md` | (옵션 B 분리 sync — v2.20) | ~5분 | 의뢰 A 가 superset | Phase 2 만 |

→ **의뢰 A (v2.22) 가 v2.20 + v2.21 + Phase 4 superset 이므로 단독 처리 = Phase 2 + 3 + 4 sync 모두 동시 완료**.
→ 옵션 B/C 분리 sync 는 **phase 별 검수 분리 원할 때만**.

---

## 2. 권장 실행 순서

### 시나리오 1 — 빠른 진행 ⭐ 권장 (1 session)

```
1. 의뢰 A (Phase 4 sync · v2.22 동시 = Phase 2/3/4 모두)  → 5분
2. 의뢰 B (Phase 1C 운영 박제 batch)                       → 1 session (~수시간)
```

→ 같은 day 안에 sync + 운영 박제 모두 완료. 사용자 결재:
- 의뢰 A: 옵션 결재 (옵션 A 권장 — v2.22 단독 sync)
- 의뢰 B: §2 사전 점검 + PR-1C-4 §4 결제 옵션 + 각 batch 끝의 PR 결재

### 시나리오 2 — 단계 분리 (보수적)

```
1. 의뢰 A (Phase 4 sync v2.22)                          → 5분
2. PR-1C-1 #650 결재 (subin → dev → main)
3. 의뢰 B (Phase 1C 운영 박제 batch)                     → 1 session
4. 의뢰 B 결과 PR 들 결재
5. Phase 2C 운영 박제 의뢰서 작성 (Cowork 자동)
6. Phase 2C batch (~10 PR)
7. Phase 3C 운영 박제 의뢰서 작성 (Cowork 자동)
8. Phase 3C batch (~7 PR)
9. Phase 4C 운영 박제 의뢰서 작성 (Cowork 자동)
10. Phase 4C batch (~8 PR)
```

→ **권장 = 시나리오 1** (의뢰 A + 의뢰 B 같이 진행).

---

## 3. 각 의뢰서 즉시 시작 명령

### 의뢰 A — Phase 4 sync (v2.22 = Phase 2/3/4 동시)

```
Read Dev/design/prompts/phase-4-v2.22-sync-cli-prompt-2026-05-28.md 하고 §2 사전 점검 + 옵션 결재부터 시작해줘.
```

**핵심 결재**: §2 옵션 A (v2.22 1 회 sync · 권장) vs 옵션 B (3 회 sync · 분리)

### 의뢰 B — Phase 1C 운영 박제 batch

```
Read Dev/design/prompts/phase-1C-batch-cli-prompt-2026-05-28.md 하고 §2 사전 점검부터 시작해줘. unstaged .gitignore 는 PR-1C-2 진입 전에 chore commit 으로 우선 처리해줘.
```

**핵심 결재**: §2 사전 점검 + PR-1C-4 §4 결제 옵션 (옵션 B 권장 = bank 단일)

---

## 4. 진행 흐름 시각화

```
[현재 상태 = 2026-05-28]
✅ Phase 1A (대회 관리자) Claude.ai 박제 + sync (v2.19)
✅ Phase 1B (대회 사용자) Claude.ai 박제 + sync (v2.18)
✅ Phase 1C-1 운영 박제 (UA1 Tournaments · PR #650)
✅ Phase 2 (경기) Claude.ai 박제 — v2.20 / sync 대기
✅ Phase 3 (팀) Claude.ai 박제 — v2.21 / sync 대기 (v2.20 superset)
✅ Phase 4 (단체) Claude.ai 박제 — v2.22 / sync 대기 (v2.20+v2.21 superset · 4 가정 lock Q1~Q4)

[다음 단계 — 시나리오 1 권장]
↓ 의뢰 A — Phase 4 sync v2.22 (~5분 / Phase 2/3/4 동시)
↓ 의뢰 B — Phase 1C 운영 박제 batch (~1 session · 15 PR)
↓
[batch 끝 후 자동 다음]
- Phase 2C + 3C + 4C 운영 박제 의뢰서 작성 (Cowork 자동)
- 또는 Phase 5 영역 결재 (Phase 4 답습 흐름)
```

---

## 5. Phase 별 진행 점수판 (최신)

| Phase | 영역 | Claude.ai 박제 | sync | 운영 박제 | 비고 |
|-------|------|--------------|------|---------|------|
| 1A | 대회 관리자 (10) | ✅ v2.19 | ✅ 2026-05-26 | ⏳ batch 의뢰서 | PR-1C-1 ✅ #650 |
| 1B | 대회 사용자 (8) | ✅ v2.18 | ✅ 2026-05-26 | ⏳ batch 의뢰서 | |
| 2 | 경기 (10) | ✅ v2.20 | ⏸ 의뢰 A | ⏸ 의뢰서 미작성 | Phase 2C 별 의뢰서 |
| 3 | 팀 (7) | ✅ v2.21 | ⏸ 의뢰 A | ⏸ 의뢰서 미작성 | Phase 3C 별 의뢰서 |
| 4 | 단체 (8) | ✅ v2.22 ⭐ NEW | ⏸ 의뢰 A | ⏸ 의뢰서 미작성 | Phase 4C 별 의뢰서 / 3 측 stakeholder |

→ **본 큐 처리 (의뢰 A + B) 후**:
- Phase 1C 운영 박제 끝 (15 PR + PR-1C-1 = 16 PR)
- Phase 2/3/4 sync 모두 끝 (BDR-current = v2.22 cumulative)
- 다음 → Phase 2C + 3C + 4C 운영 박제 의뢰서 (Cowork 자동) 또는 Phase 5 영역 결재

---

## 6. 새 Phase 진입 (Phase 5) — 결재 대기 영역

본 큐 처리 후 다음 Phase 후보 (`_phase4-candidates-2026-05-28.md` 참조):
- **코트·장소 (Courts/Venues)** — `/courts` + `/venues` + `/partner-admin` ★★★★
- **알림·메시지 + 검색 묶음** — main bar 5 아이콘 묶음 ★★★
- **프로필 / 마이페이지 본체** — `/profile/*` 16+ sub ★★★★ (복잡 / 분할 의뢰 필요)
- 랭킹·커뮤니티 / About·마케팅 등

→ 본 큐 끝나면 사용자 결재 받고 Phase 5 진입.

---

**큐 끝.** 의뢰 A + 의뢰 B 처리 후 본 파일 갱신.
