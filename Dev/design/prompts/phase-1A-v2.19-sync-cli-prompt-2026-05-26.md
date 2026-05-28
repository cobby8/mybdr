# Phase 1A (v2.19) — BDR-current sync CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행**: `phase-1B-v2.18-sync-cli-prompt-2026-05-26.md` (동일 패턴 — 차이만 명시)
> **운영 코드 변경**: 0 — 시안 sync + 회귀 검수 + ledger + commit/push

---

## 1. 한 줄 요약

`uploads/BDR v2 (3).zip` 안 `Dev/design/BDR v2.19/` (10 시안 = PA1~PA9 + admin.css) 을 `sync-bdr-current.ps1` 로 `BDR-current/` 에 동기화 → 회귀 검수 6 케이스 → phase-ledger Phase 1 ⑩ (1A) ✅ → commit.

---

## 2. 사전 점검 (CLAUDE.md "오늘 작업 시작하자" 6 단계)

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ 결과 요약 → "이대로 작업 시작해도 될까요?" 사용자 결재
```

→ 결재 전 sync 실행 ❌.

---

## 3. sync 실행 (옵션 A delta replace)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (3).zip"

# DryRun 먼저
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.19" -DryRun

# 통과 시 실 실행
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.19"
```

**완료 검증**:
```powershell
ls Dev/design/BDR-current/screens/    # 예상 = PA1~PA9 9 jsx + admin.css
ls Dev/design/_archive/BDR-current-2026-05-26-pre-v2.19/screens/    # 예상 = v2.18 9 + baseline 5 = 14 jsx 보존
```

→ Phase 1B v2.18 9 시안 + Phase 1A baseline 임시 복원 5 파일 = 모두 `_archive/BDR-current-2026-05-26-pre-v2.19/` 로 이동.

---

## 4. 회귀 검수 6 케이스 (Phase 1B sync 답습)

```bash
# 케이스 1 — main bar 우측 "더보기 ▼" / "RDM"
grep -rn '더보기.*▼\|RDM' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx 2>/dev/null
# 기대: 0

# 케이스 2 — 모바일 듀얼 다크 라벨
grep -rn '라이트.*다크\|☀.*☾' Dev/design/BDR-current/shared.jsx Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: PC 듀얼만 (모바일 단일 아이콘 분기 있으면 OK)

# 케이스 3 — 검색·쪽지·알림 박스 (.btn / .btn--sm)
grep -rn 'app-nav__icon-btn.*btn--sm\|btn.*app-nav__icon-btn' Dev/design/BDR-current/ 2>/dev/null
# 기대: 0

# 케이스 4 — `--color-*` 폐기 토큰
grep -rn '\-\-color-' Dev/design/BDR-current/screens/ Dev/design/BDR-current/*.css 2>/dev/null
# 기대: 0

# 케이스 5 — lucide-react import
grep -rn 'from .lucide-react' Dev/design/BDR-current/screens/ 2>/dev/null
# 기대: 0

# 케이스 6 — 가짜링크 (gameResult / gameReport / guestApps / referee)
grep -rnE 'gameResult|gameReport|guestApps|/referee\b' Dev/design/BDR-current/screens/ Dev/design/BDR-current/shared.jsx 2>/dev/null | grep -v "refereeInfo"
# 기대: 0
```

→ 위반 발견 시 중단 + 사용자 보고.

---

## 5. phase-ledger 갱신

`.claude/phase-ledger.md` Phase 1 의 ⑩ 행 (Phase 1A) 갱신:

```
| ⑩ sync 실행 | 1A | ✅ 완료 | CLI | 2026-05-26 | sync-bdr-current.ps1 -NewVersion v2.19 / BDR-current = PA1~PA9 9 jsx + admin.css / pre-snapshot = _archive/BDR-current-2026-05-26-pre-v2.19/ / 회귀 검수 6 케이스 통과 |
```

---

## 6. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git status   # 검토
git commit -m "design: BDR-current sync v2.19 (Phase 1A 대회 관리자 박제 10 시안)

- v2.19 = Phase 1A (대회 관리자) 박제 = PA1~PA9 (수정 7 + 신규 3) + admin.css 보조
- BDR-current/ = 10 파일 + admin.css (이전 = v2.18 9 + 임시 복원 5 = 14)
- pre-snapshot = _archive/BDR-current-2026-05-26-pre-v2.19/ (v2.18 + baseline 5 보존)
- 회귀 검수 6 케이스 통과
- phase-ledger Phase 1 ⑩ (1A) ✅ 갱신

다음 = 묶음 2 (Phase 2A + 2B 경기 영역) — phase-1A+2 통합 가이드 §1 묶음 2"

git push origin subin
```

---

## 7. 완료 후 사용자 보고

```
Phase 1A v2.19 sync 완료 ✅
- BDR-current = 10 시안 (수정 7 + 신규 3)
- 회귀 검수 6 케이스 통과
- pre-snapshot 보존 (v2.18 + baseline 5 = 14 파일)
- phase-ledger Phase 1 ⑩ (1A) ✅
- commit `<hash>` push 완료

다음 = 묶음 2 (Phase 2 경기). 통합 가이드 §1 묶음 2 진행 가능.
```

---

**의뢰 끝.** Phase 1B 의뢰서 답습. CLI 진입 → §2 결재 → §3 sync → §4 검수 → §5 ledger → §6 commit → §7 보고.
