# CLI 작업 큐 — 2026-06-24 갱신 (Cowork 자동 루프)

> 목적: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션.
> v2.40 릴리스 완료. 새 zip 없음. 다음 = QA paste → STAGE E.

---

## 0. 현재 상태 (Cowork bash 점검 기준)

| 항목 | 상태 |
|---|---|
| 브랜치 | `dev` |
| 로컬 ref | dev `504dcd2` (#756, 6/23 20:17) / main 로컬 ref `53e3397`(#733, 6/21) |
| 원격 정합 | fetch 미완(네트워크 timeout) — 6/23 문서 기준 `origin/dev == origin/main` |
| `.git/config` | ⚠️ line26 NUL 손상 발견 → 읽기용 최소 복구(.bak 보존) |
| `.git/HEAD` | ⚠️ NUL 손상 → `ref: refs/heads/dev` 복구(.bak 보존) |
| `.git/index` | ⚠️ `bad index file sha1 signature` — **미수정**, 네이티브 확인 필요 |
| 워킹트리 | git status 불가(index 손상) — 6/23 기준 clean |

> ⚠️ git 손상은 6/23 에도 한 번 기록됐다 "Codex 정상"으로 해소된 이력 → **재발**. 액션 3 참조.

---

## 1. 현재 CLI 큐

| # | 항목 | 상태 | 다음 액션 |
|---|---|---|---|
| A | 일관성 QA v2.40 paste | 패키지 완료 / paste 대기 | `design-consistency-qa-delivery-2026-06-23.md` paste + baseline zip |
| B | STAGE E Home+Legal 의뢰 | **오늘 작성 완료** | `stage-e-home-legal-brief-2026-06-24.md` paste (QA와 병행 가능) |
| C | git NUL 손상 네이티브 확인 | 신규 | Windows 터미널 `git fsck` / index 손상 시 `git reset` 재생성 |
| D | STAGE F 잔여 사용자 흐름 | 대기 | E 착수 후 의뢰서 작성 |
| E | STAGE G PA3/referee | 보류 | DB/API/담당 얽힘 → 별도 결재 |

---

## 2. 권장 실행 순서

1. (병행) QA v2.40 paste + STAGE E paste
2. git NUL 손상 네이티브 확인 (액션 3)
3. QA 회신 zip 도착 → `_qa/bake-fix-checklist.md` CLI batch 분할
4. STAGE E 회신 zip 도착 → `_stage-e/bake-checklist.md` CLI batch 분할
5. 각 batch: `cmd /c npx tsc --noEmit` + 시각 회귀 표본

---

## 3. 주의

- `git add .` 금지 — 필요 파일만 명시 staging.
- push/commit/merge 는 사용자 명시 요청 전 자동 실행 금지 (본 루프도 안 함).
- 운영 DB destructive 금지. schema diff + 승인 선행.
- index 손상 복구 시 working tree clean 먼저 확인 (staged 변경 소실 주의).
