# CLI 작업 큐 — 2026-06-27 갱신 (Cowork 자동 루프)

> 목적: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션.
> admin-toss sweep 운영 반영 완료. 새 zip 없음. 다음 = v2.42 시안 paste → 회신 박제.

---

## 0. 현재 상태 (Cowork bash 점검 기준)

| 항목 | 상태 |
|---|---|
| 브랜치 | `dev` |
| 최신 commit | `847a1b5` refactor: align operate panels with toss flow |
| `origin/main..origin/dev` | 0 (dev 가 main 앞선 commit 없음) |
| `origin/dev..origin/main` | 0 (정합) |
| 미push commit | 0 |
| git 무결성 | 🟢 정상 (6/24 NUL 손상 재현 안 됨 — 마운트 아티팩트로 추정) |
| 새 Claude.ai zip | 없음 (uploads = SKILL.md / _zips 최신 = 6/25 Cowork 생성 B1 source) |

---

## 1. 현재 CLI 큐

| # | 항목 | 상태 | 다음 액션 |
|---|---|---|---|
| A | admin-toss v2.42 통합 시안 paste | 의뢰서 완료 / paste 대기 | `admin-toss-v242-integrated-design-request-2026-06-26.md` §0 본문 paste |
| B | B1 역박제 QA source-request paste | 패키지 완료 / paste 대기 | `source-request-B1-workspace-delivery-2026-06-26.md` + B1 zip |
| C | STAGE E Home+Legal 의뢰 | 작성 완료 (6/24) / 보류 | admin 정합 트랙 정리 후 paste |
| D | STAGE F 잔여 사용자 흐름 | 대기 | E 착수 후 |
| E | STAGE G PA3 / referee | 보류 | DB/API/담당(Flutter 공백) 얽힘 → 별도 결재 |

---

## 2. 권장 실행 순서

1. (사용자 결재) admin Toss 방향 1순위 — parity 박제(A) vs BDR 역박제(B). 한 줄 결정.
2. 결정에 따라 A 또는 B paste → Claude.ai 작업
3. 회신 zip 도착 → 해당 `_qa/bake-*-checklist.md` CLI batch 분할
4. 각 batch: `cmd /c npx tsc --noEmit` + 시각 회귀 표본 6/6
5. subin 폐지 상태 → dev 직접 작업, 릴리스는 dev→main PR (수빈 단독 머지)

---

## 3. 주의

- `git add .` 금지 — 필요 파일만 명시 staging.
- push/commit/merge 는 사용자 명시 요청 전 자동 실행 금지 (본 루프 안 함).
- 운영 DB destructive 금지. schema diff + 승인 선행.
- `/api/v1` (Flutter) 변경 = 담당 공백 → 사용자 결정 필요.
- admin Toss 영역은 lucide/Toss radius 허용(예외). 공개 사용자 영역은 BDR 13룰·AppNav frozen 유지.
