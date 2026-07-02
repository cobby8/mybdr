# CLI 작업 큐 — 2026-06-28 갱신 (Cowork 자동 루프)

> 목적: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션.
> 6/28 새벽 admin-v2 리빌드(R0→R1) 진행. 새 zip 없음. 미push 3건 + main/dev 분기 결재 대기.

---

## 0. 현재 상태 (Cowork bash 점검 기준)

| 항목 | 상태 |
|---|---|
| 브랜치 | `dev` |
| 최신 commit | `096ab55` feat(admin-v2): R1 토대 — 시안 정본 1:1 포팅 |
| 로컬 dev vs `origin/dev` | **ahead 3** (096ab55 R1 / 941ed8a R0 / accadce M3 — 미push) |
| `origin/main..origin/dev` | 57 (dev 가 admin-v2 등으로 앞섬) |
| `origin/dev..origin/main` | **16** (main 이 release/* 머지로 앞섬 — 역머지 필요) |
| uncommitted | 2건 (`.claude/agents/live-expert.md`, backup json — 무관 추정) |
| 새 Claude.ai zip | 없음 (uploads = SKILL.md / _zips 최신 = 6/25 B1 source) |

---

## 1. 현재 CLI 큐

| # | 항목 | 상태 | 다음 액션 |
|---|---|---|---|
| A | admin-v2 리빌드 (R1 정본 1:1 포팅) | 🔵 진행 중 / 미push 3건 | 사용자 push 결재 → 후속 R2+ |
| B | admin-toss v2.42 통합 parity 시안 paste | 의뢰서 완료 / paste 대기 | 방향 결재 후 §0 본문 paste |
| C | B1 역박제 QA source-request paste | 패키지 완료 / paste 대기 | 방향 결재 후 delivery 본문 + B1 zip |
| D | admin-toss PR-1 셸 육안 검증 | 의뢰서 완료 / 검증 대기 | 프리뷰 `/admin/*` 체크리스트 |
| E | STAGE E Home+Legal 의뢰 | 작성 완료(6/24) / 보류 | admin 정합 트랙 정리 후 |
| F | STAGE F·G (잔여 사용자 / PA3 / referee) | 대기 / 보류 | E 착수 후 · 별도 결재 |

---

## 2. 권장 실행 순서

1. (사용자) 미push 3건 push 여부 + `main → dev` 역머지 결재.
2. (사용자) admin Toss 방향 1순위 — parity 박제(B) vs BDR 역박제(C) 한 줄 결정.
3. 결정에 따라 B 또는 C paste → Claude.ai 작업.
4. admin-toss PR-1 셸 육안 검증(D) — 회신 zip 무관, 언제든 가능.
5. 회신 zip 도착 시 해당 `_qa/bake-*-checklist.md` CLI batch 분할 → `cmd /c npx tsc --noEmit` + 시각 회귀 6/6.

---

## 3. 주의

- 본 루프는 git 변경(commit/push/merge) 자동 실행 안 함 — 전부 사용자 결재.
- `git add .` 금지 — 필요 파일만 명시 staging.
- 운영 DB destructive 금지. schema diff + 승인 선행.
- `/api/v1` (Flutter) 변경 = 담당 공백 → 사용자 결정 필요.
- admin Toss 영역은 lucide/Toss radius 허용(예외). 공개 사용자 영역은 BDR 13룰·AppNav frozen 유지.
- main/dev 분기 방치 시 다음 dev→main PR 충돌 ↑ — 역머지 우선 권장.
