# CLI 작업 큐 — 2026-06-23 갱신 (현 상태 재점검 반영)

> **목적**: 잔여 CLI 작업 한 눈에 — 의뢰서 / 의존 / 권장 다음 액션
> **정정**: 09:00 자동 점검의 `.git/config` 손상 / dev 미push 기록은 현재 상태와 다름. 현재 git 명령 정상, `dev == origin/dev`.

---

## 0. 현재 상태

| 항목 | 상태 |
|---|---|
| 브랜치 | `dev` |
| 원격 정합 | `dev == origin/dev` |
| 미푸시 커밋 | 0 |
| 미수신 커밋 | 0 |
| `.git/config` | 정상 동작 확인 (`git config --list`) |
| 최근 HEAD | `9f5a29e feat: add tournament admin workspace` |
| 워킹트리 | 다수 untracked 문서 + `BDR v2.33/_delivery-records-*` 삭제 상태 존재 |

---

## 1. 현재 CLI 큐

| # | 항목 | 상태 | 책임자 | 다음 액션 |
|---|---|---|---|---|
| 1 | **워킹트리 정리 범위 확정** | 필요 | CLI/수빈 | 삭제된 `BDR v2.33/_delivery-records-*`와 다수 untracked 문서 의도 확인. `git add .` 금지 |
| 2 | **v2.40 admin console 후속 확인** | dev 반영 완료 | CLI | `v2.40-admin-bake-cli-prompts-2026-06-22.md` 기준 남은 bake batch/검증 항목 확인 |
| 3 | **phase-ledger 경로 정리** | 파일 없음 | CLI/수빈 | `.Codex/phase-ledger.md` 또는 `.claude/phase-ledger.md` 중 실제 경로 결정 후 복구/생성 |
| 4 | **매칭 M6 상태 확인** | 문서상 불명 | CLI | git/PR 로그 기준 완료 여부 재확인 |
| 5 | **새 대회 생성폼 +8 배포 확인** | dev 로그상 반영 | CLI | main 배포 여부 확인 |
| 6 | **BDR-current 역박제 갭 검토** | 확대 | CLI | Toss + 생성폼 + v2.40 콘솔 src 직접 박제분과 BDR-current 갭 비교 |
| A | 일관성 QA 패스 | 이월 | 수빈 | 필요 시 Claude.ai paste 재개 |
| B | STAGE E/F/G | 결재 대기 | 수빈 | home+legal / 잔여 사용자 / PA3-referee |

---

## 2. 최근 v2.40 커밋 상태

`origin/dev`에 반영된 최근 흐름:

```text
9f5a29e feat: add tournament admin workspace
5e44d94 docs: 대회 운영자 도구 워크스페이스 구조 지시서 추가
f29b36b feat(admin): v2.40 콘솔 캠페인 생성 플로우 추가
8713f2a feat(admin): v2.40 콘솔 단체 대회 상세 추가
f1b25a1 feat(admin): v2.40 콘솔 드릴다운 상세 4종 추가
986cb1f feat(admin): v2.40 콘솔 시스템 5화면 키트 통일
e29b860 feat(admin): v2.40 콘솔 비즈니스 4화면 키트 통일
e2b851f feat(admin): v2.40 콘솔 사용자·커뮤니티 5화면 키트 통일
e797d6a feat(admin): v2.40 콘솔 운영 5화면 키트 통일
124d8ae feat(admin): v2.40 통합 콘솔 공통 키트 박제
b52e9bf docs(admin): v2.40 콘솔 A0 사전설계 메모
4da8189 feat(admin): v2.40 통합 콘솔 IA 재그룹
```

---

## 3. 권장 실행 순서

1. 워킹트리 정리 범위 확정
2. v2.40 admin console 후속 프롬프트 검토
3. phase-ledger 경로 결정 및 복구/생성
4. 매칭 M6 / 생성폼 main 배포 여부 확인
5. BDR-current 역박제 갭 검토

---

## 4. 주의

- 현재 dirty worktree가 크므로 unrelated 파일을 건드리지 말 것.
- `git add .` 금지. 필요 파일만 명시적으로 staging.
- push는 사용자 명시 요청 전 자동 실행 금지.
- 운영 DB destructive 작업 금지. DB 변경은 schema diff와 사용자 승인 선행.
