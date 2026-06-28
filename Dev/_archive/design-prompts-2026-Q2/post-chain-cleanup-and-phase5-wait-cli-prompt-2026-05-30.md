# Auto Chain 후속 CLI 의뢰서 — 정리 + Phase 5 대기 모드

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **작성일**: 2026-05-30
> **선행 완료**: Auto Chain 25 PR 모두 완료 + 머지 (#654/#655 / 운영 배포 `6f22c02`)
> **목적**: chain 후 git 정리 + phase-ledger 완전 종료 마킹 + Phase 5 (랭킹·커뮤니티) sync 의뢰 대기 모드

---

## 1. 한 줄 요약

`subin` 브랜치에 `dev` 머지 동기화 + phase-ledger Phase 2/3/4 ⑭ 완전 종료 마킹 + Phase 5 영역 (랭킹·커뮤니티) Claude.ai 박제 결과 zip 도착 시 자동 sync 의뢰서 작성 → CLI sync 1 단계 진입.

---

## 2. 사전 점검 (1 회만)

```
□ git fetch origin --prune
□ 현재 브랜치 = subin
□ Auto Chain 25 PR 머지 결과 = #654 + #655 (origin/main = 6f22c02)
□ subin 미push 변경 (scratchpad / phase-ledger 외) = 0 확인
□ uploads/ 안 Phase 5 zip 도착 여부 (BDR v2 (8).zip 또는 차상 신규) — 없으면 본 chain 1단계 (정리) 만 실행
```

→ 결과 요약 → **"이대로 정리 + 대기 모드 진입 OK?" 사용자 결재 1 회**.

---

## 3. 1단계 — git 동기화 + phase-ledger 완전 종료

### 3-1. dev → subin 머지 동기화

```bash
git checkout dev
git pull origin dev
git checkout subin
git merge dev --no-edit
git push origin subin
```

→ main merge commit 들이 subin 에도 반영. 이후 Phase 5 작업 베이스 정합.

### 3-2. phase-ledger Phase 2/3/4 ⑭ 완전 종료 마킹

본 ledger 의 Phase 2/3/4 ⑭ 행 갱신:

```
[Phase 2]
| ⑭ Phase 완료 | 2 | ✅ 종료 | CLI→Cowork | 2026-05-29 | 경기 영역 운영 반영 완료. Phase 3·4도 동일 머지 (#654/#655) — Phase 5 진입 (랭킹·커뮤니티) 결재 |

[Phase 3]
| ⑭ Phase 완료 | 3 | ✅ 종료 | CLI→Cowork | 2026-05-29 | 팀 영역 운영 반영 완료 (#654/#655 머지) |

[Phase 4]
| ⑭ Phase 완료 | 4 | ✅ 종료 | CLI→Cowork | 2026-05-29 | 단체 영역 운영 반영 완료 (#654/#655 머지) |
```

→ Phase 1~4 모두 종료 마킹. 다음 = Phase 5 entry 신규 추가 (별도 의뢰서로 / 본 chain 영향 0).

### 3-3. scratchpad 정리

`.claude/scratchpad.md`:
- 현재 작업 = "Phase 5 (랭킹·커뮤니티) Claude.ai 박제 대기" 로 갱신
- Auto Chain 25 PR commit 맵은 그대로 보존
- 작업 로그 1 줄 추가: `2026-05-30 | Phase 1~4 종료 마킹 + git 동기화 + Phase 5 대기 모드 진입`

### 3-4. commit + push

```bash
git add .claude/phase-ledger.md .claude/scratchpad.md
git commit -m "docs: Phase 1~4 종료 마킹 + Auto Chain 후속 정리

- Phase 2/3/4 ⑭ ✅ 종료 (Phase 1 은 이미 종료)
- main merge commit dev→subin 동기화 완료
- Phase 5 (랭킹·커뮤니티) Claude.ai 박제 대기 모드 진입
- PR-1C-10 PA3 = ⏸ 보류 유지 (planner 재설계)"

git push origin subin
```

→ 1단계 끝 = 2단계 대기 모드 진입.

---

## 4. 2단계 — Phase 5 대기 모드 (Claude.ai 박제 후 자동 sync 의뢰)

### 4-1. 대기 조건

uploads/ 안 새 zip 도착 (`BDR v2 (8).zip` 또는 그 이후 신규 mtime) 감지 시 자동 다음 액션:

1. unzip → 안 최신 BDR vX.Y/ 폴더 파악
2. v2.22 → v2.23 (예상) sync 의뢰서 자동 작성 → `Dev/design/prompts/phase-5-vX.Y-sync-cli-prompt-YYYY-MM-DD.md`
3. 사용자 보고 = "Phase 5 박제 zip 도착 — 다음 명령 던지세요: Read Dev/design/prompts/phase-5-vX.Y-sync-cli-prompt-...md"

### 4-2. 자동 sync 의뢰서 패턴 (Phase 4 답습)

`phase-4-v2.22-sync-cli-prompt-2026-05-28.md` 답습 + Phase 5 특수:
- 신규 shared 파일 검수 (예: rank-shared.jsx / community-shared.jsx — 박제 결과 의존)
- Phase 1~4 carry-over (변경 ❌) 검증
- 회귀 검수 케이스 = 기본 12 + Phase 2/3/4 특수 + Phase 5 특수 (총 ~28 케이스)

### 4-3. Cowork scheduled task 와 협업

`mybdr-progress-monitor` (매일 09:00) 가 uploads/ 점검 → 새 zip 발견 시 sync 의뢰서 자동 작성. CLI 는 의뢰서 도착 시 사용자가 한 줄로 sync 시작.

→ 본 CLI 의뢰서는 sync 의뢰서가 도착하면 그 의뢰서로 자동 chain 가능 (별 의뢰).

---

## 5. (선택) PR-1C-10 PA3 재설계 — 본 chain 외 별 의뢰

planner 재설계 대기 중. 본 의뢰서 영향 0. 사용자 결정 후 별 의뢰서 작성:

```
[옵션 A] 신규 기능 (시안 종별위임 → 운영 신규 종별 운영자 시스템 신설) — DB 변경 필요 / 큰 작업
[옵션 B] 리디자인만 (시안 종별위임 → 운영 협회 마법사 시각 보강만) — DB 변경 ❌ / Phase 1C 답습
[옵션 C] SKIP 유지 (보류 / 별 우선순위 시 진행)
```

→ 사용자 결재 후 진행.

---

## 6. 산출물 (CLI → 사용자, 1단계 끝)

```
1. dev → subin 머지 동기화 + push
2. phase-ledger Phase 2/3/4 ⑭ ✅ 종료 갱신
3. scratchpad 정리 (Phase 5 대기 모드)
4. docs commit `<hash>` push
5. 미push commit 알림 = 0
6. Phase 5 sync 의뢰서 = (zip 도착 후 자동 작성) or "Phase 5 zip 도착 대기 중" 안내
```

---

## 7. 사용자 (수빈) 의 다음 액션

```
☐ 본 prompt CLI 에 전달 → §2 사전 점검 결재 (1 회)
☐ 1단계 정리 완료 후 알림 받기
☐ Phase 5 Claude.ai 박제 진행 (별 패키지로 의뢰)
☐ Phase 5 zip 도착 → Cowork 가 sync 의뢰서 자동 작성 → CLI sync 1 단계
☐ Phase 5C 운영 박제 = 새 Auto Chain (Phase 4C 답습 패턴)
```

---

## 8. 시작 — CLI 에 한 줄로 전달

```
Read Dev/design/prompts/post-chain-cleanup-and-phase5-wait-cli-prompt-2026-05-30.md 하고 §2 사전 점검부터 시작해줘.
```

---

**의뢰서 끝.** chain 후 정리 + Phase 5 대기 모드. 본 의뢰는 ~5 분 작업.
