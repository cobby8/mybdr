# Phase 4 (v2.22) — BDR-current sync CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 박제**: Phase 1 (v2.18 + v2.19) sync ✅ + Phase 2 (v2.20) + Phase 3 (v2.21) + Phase 4 (v2.22) 박제 — Phase 2/3 sync ⏸ 대기 + Phase 4 sync ⏸ 대기
> **선행 의뢰**: `phase-3-v2.21-sync-cli-prompt-2026-05-28.md` (동일 패턴 — Phase 4 차이만)
> **운영 코드 변경**: **0** — 시안 sync + 회귀 검수 + ledger + commit/push 만
> **★ 본 의뢰의 특수성**: v2.22 = v2.20 + v2.21 superset → **v2.22 sync 1 회 = Phase 2 + 3 + 4 sync 동시 처리**

---

## 1. 한 줄 요약

`uploads/BDR v2 (7).zip` 안 `Dev/design/BDR v2.22/` (Phase 4 박제 8 시안 + Phase 3 박제 7 + Phase 2 박제 10 + Phase 1A/1B carry-over) 를 `sync-bdr-current.ps1` 로 `BDR-current/` 에 동기화 → 회귀 검수 (4+8+Phase 2 특수 4+Phase 3 특수 4+Phase 4 특수 4 = 24 케이스) → phase-ledger Phase 2 ⑩ + Phase 3 ⑩ + Phase 4 ⑩ **동시 ✅** → commit/push.

---

## 2. 사전 점검 + 옵션 결재

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ 현재 BDR-current/ = v2.19 cumulative (Phase 1A + Phase 1B + Phase 2 baseline 10)
   ※ Phase 2/3 sync 모두 미실행 — v2.22 가 v2.20/v2.21 superset 이므로 v2.22 sync 가 모두 처리
□ phase-ledger Phase 2 ⑨ + Phase 3 ⑨ + Phase 4 ⑨ zip 도착 = ✅ 확인
□ phase-ledger Phase 2/3/4 ⑩ = ⏸ → 본 sync 1 회로 **셋 다 ✅** 갱신
□ Phase 1C unstaged 변경 = 0 (PR-1C-1 #650 이후 subin 브랜치 깨끗)
```

### 옵션 결재 — sync 횟수 (1 회 결재)

**옵션 A (권장)** — **v2.22 1 회 sync** (Phase 2 + 3 + 4 동시):
- BDR-current/ 가 v2.19 cumulative → 바로 v2.22 cumulative 로 점프
- pre-snapshot 1 회 = `_archive/BDR-current-2026-05-28-pre-v2.22/`
- Phase 2/3/4 ⑩ 모두 ✅
- commit 1 회

**옵션 B** (보수적) — **v2.20 → v2.21 → v2.22 3 회 sync**:
- 각 phase 별 검수 분리
- pre-snapshot 3 + commit 3
- 시간 ~15 분

→ **권장 = 옵션 A** (단순 + 안전 / Phase 3 v2.21 sync 의뢰서 답습 패턴).

→ 결재 전 sync 실행 ❌.

---

## 3. sync 실행 — 옵션 A (권장)

```powershell
$zip = "C:\Users\user\AppData\Roaming\Claude\local-agent-mode-sessions\c0769406-f6f7-43ef-a526-ace597d51b2e\a351b808-1854-4f53-8f58-a2b588a6bb69\local_eafa9aee-c49c-4879-81a9-27714aa3011b\uploads\BDR v2 (7).zip"

# DryRun 먼저
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.22" -DryRun

# 통과 시 실 실행 (BOM 우회 ❌ — 영구 해결됨)
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.22"
```

**완료 검증**:
```powershell
# v2.22 sync 결과 — 예상 ~65 파일
ls Dev/design/BDR-current/                          # game-shared + team-shared + org-shared (NEW) 포함
ls Dev/design/BDR-current/screens/                  # jsx 39 (= Phase 1A 11 + 1B 5 + Phase 2 10 + Phase 3 5 + Phase 4 8) + css 6 = 45
ls Dev/design/BDR-current/screens/_baseline/        # Phase 2 baseline 10 carry-over

# pre-snapshot — 예상 = v2.19 cumulative (jsx 26 + css 6)
ls Dev/design/_archive/BDR-current-2026-05-28-pre-v2.22/
```

### sync 후 BDR-current/ 구조 예상

```
BDR-current/
├── README.md / index.html                       ← v2.22
├── tokens.css / shared.jsx                      ← v2.20 그대로 (변경 ❌)
├── admin.css / shell.css                        ← v2.22 (+ Phase 4 패턴 추가)
├── game-shared.jsx                              ← v2.20 carry-over (Phase 2)
├── team-shared.jsx + team-shared.css            ← v2.21 carry-over (Phase 3)
├── org-shared.jsx + org-shared.css              ← v2.22 신규 (Phase 4 · 529 + 1360 line)
├── Phase 1A html (9) + Phase 1B html (8) + Phase 2 html (10) + Phase 3 html (6) + Phase 4 html (8)
├── screens/
│   ├── Phase 1A 시안 (11 jsx) — Admin*Tournament*.jsx · carry-over
│   ├── Phase 1B 시안 (5 jsx + 6 css) — carry-over
│   ├── Phase 2 시안 (10 jsx) — Games / GameDetail / 등 · carry-over
│   ├── Phase 3 시안 (5 jsx) — Teams / TeamDetail / 등 · carry-over + MyActivity 누적
│   ├── Phase 4 시안 (8 jsx) — OrganizationsList / OrganizationDetail / OrganizationApply / Series / OrgAdmin / OrgAdminDetail / SeriesAdmin / AdminOrganizations
│   └── _baseline/ (Phase 2 baseline 10 · carry-over)
```

---

## 4. 회귀 검수 — 24 케이스

### 4 frozen + 8 self + Phase 2 특수 4 + Phase 3 특수 4 (Phase 3 v2.21 sync 의뢰서 §4 답습)

→ phase-3-v2.21-sync-cli-prompt-2026-05-28.md §4 케이스 1~20 그대로 적용.

### Phase 4 특수 4 케이스 (신규)

```bash
# 케이스 21 — org-shared.jsx + org-shared.css 신규 보존 (Phase 4 결과)
test -f Dev/design/BDR-current/org-shared.jsx && echo "✓ org-shared.jsx" || echo "✗ 누락"
test -f Dev/design/BDR-current/org-shared.css && echo "✓ org-shared.css" || echo "✗ 누락"
wc -l Dev/design/BDR-current/org-shared.jsx Dev/design/BDR-current/org-shared.css
# 기대: 529 + 1360

# 케이스 22 — Phase 4 신규 8 시안 (OrganizationsList / OrganizationDetail / OrganizationApply / Series / OrgAdmin / OrgAdminDetail / SeriesAdmin / AdminOrganizations)
for f in OrganizationsList OrganizationDetail OrganizationApply Series OrgAdmin OrgAdminDetail SeriesAdmin AdminOrganizations; do
  test -f "Dev/design/BDR-current/screens/$f.jsx" && echo "✓ $f.jsx" || echo "✗ $f.jsx 누락"
done

# 케이스 23 — Phase 4 4 가정 lock 검증 (Claude.ai 가 결정한 Q1~Q4)
# Q1 Series Operator badge = navy+silver (1B3C87)
grep -nE "SeriesOperatorBadge|#1B3C87|navy.*silver|--cafe-blue" Dev/design/BDR-current/org-shared.jsx Dev/design/BDR-current/org-shared.css 2>/dev/null | head -5
# 기대: 패턴 존재

# 케이스 24 — Phase 3 team-shared / Phase 2 game-shared carry-over (변경 ❌)
diff Dev/design/BDR-current/team-shared.jsx Dev/design/_archive/BDR-current-2026-05-28-pre-v2.22/team-shared.jsx 2>/dev/null
diff Dev/design/BDR-current/game-shared.jsx Dev/design/_archive/BDR-current-2026-05-28-pre-v2.22/game-shared.jsx 2>/dev/null
# 기대: 둘 다 차이 0 또는 pre-snapshot 에 미존재 (Phase 2/3 sync 미진행 상태에서 점프했으므로)
```

→ 위반 1 건 발견 시 sync 중단 + pre-snapshot 복원 검토.

---

## 5. phase-ledger 갱신 (Phase 2 + 3 + 4 동시)

`.claude/phase-ledger.md` 갱신:

```
[Phase 2]
| ⑩ sync 실행 | 2A + 2B | ✅ 완료 | CLI | 2026-05-28 | v2.22 sync 안에 v2.20 carry-over 처리됨 / 단일 sync 결합 |

[Phase 3]
| ⑩ sync 실행 | 3A + 3B | ✅ 완료 | CLI | 2026-05-28 | v2.22 sync 안에 v2.21 carry-over 처리됨 / 단일 sync 결합 |

[Phase 4 — 신규 entry · 예정 Phase 섹션 위에 추가]

### Phase 4 — 단체 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ① 점검 리포트 | 4 (단체 전체) | ✅ 완료 | Cowork | 2026-05-28 | `organization-user-admin-connectivity-plan-2026-05-28.md` |
| ② 갭 분석 (BO1~BO8) | 4 | ✅ 완료 | Cowork | 2026-05-28 | 8 갭 — BO1/BO2/BO3 ★★★+ |
| ③ 사용자 결재 | 4 | ✅ 완료 | 수빈 | 2026-05-28 | 영역=단체 / 8 시안 / 3 측 stakeholder |
| ④ 의뢰 작성 | 4B 사용자 | ✅ 완료 | Cowork | 2026-05-28 | `org-user-redesign-prompt-2026-05-28.md` (4 시안 OU1~OU4) |
| ④ 의뢰 작성 | 4A 관리자 | ✅ 완료 | Cowork | 2026-05-28 | `org-admin-redesign-prompt-2026-05-28.md` (4 시안 OO1~OO3 + OA1) |
| ⑤ phase-ledger 갱신 | 4A/4B | ✅ 완료 | Cowork | 2026-05-28 | Phase 4 entry 추가 |
| ⑥ git commit + push | 4A/4B | ⏳ 대기 | - | - | 본 sync commit 포함 |
| ⑦ Claude.ai 전달 | 4A + 4B | ✅ 완료 | 수빈 | 2026-05-28 | drag-drop 4 + paste 1 |
| ⑧ 시안 박제 | 4A + 4B | ✅ 완료 | Claude.ai | 2026-05-28 | BDR v2.22 박제 + 4 가정 lock (Q1~Q4) |
| ⑨ zip 출력 | 4A + 4B | ✅ 완료 | Claude.ai | 2026-05-28 | uploads/BDR v2 (7).zip 도착 |
| ⑩ sync 실행 | 4A + 4B | ✅ 완료 | CLI | 2026-05-28 | v2.22 sync — Phase 2 + 3 + 4 동시. BDR-current = Phase 1/2/3/4 cumulative |
| ⑪ 운영 박제 (Phase 4C) | 4C | ⏸ 보류 | CLI | - | PR ~8건 예상 (OU1~4 + OO1~3 + OA1) |
| ⑫ ~ ⑭ | | ⏸ 보류 | | | |
```

---

## 6. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git status
git commit -m "design: BDR-current sync v2.22 (Phase 2 + 3 + 4 = 25 시안 동시)

- v2.22 = Phase 4 (단체) 박제 + Phase 3 (팀) + Phase 2 (경기) carry-over 통합
- Phase 4 신규 8 = OU1 + OU2 + OU3 + OU4 + OO1 + OO2 + OO3 + OA1
- Phase 4 4 가정 lock (Q1~Q4 박제 자동 결정):
  Q1 Series Operator badge = navy+silver (Site Operator dark+gold 와 분리)
  Q2 OO2 6 sub-tab = basic/members/series/editions/officers/activity
  Q3 OO3 마법사 3-step = 기본 / 설명·로고·정기성 / 검토+첫 회차
  Q4 OU3 5-step = 단체 기본 / 활동 지역 / 연락 / 검토 메모 / 검토+제출
- org-shared.jsx (529) + org-shared.css (1360) 신규
- Phase 3 박제 5 + team-shared.jsx (613) + team-shared.css (1106) carry-over
- Phase 2 박제 10 + game-shared.jsx carry-over
- Phase 1A/1B carry-over (변경 0) = 17 jsx + 6 css
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.22/ (v2.19 cumulative)
- 회귀 검수 24 케이스 통과 (4 frozen + 8 self + Phase 2 특수 4 + Phase 3 특수 4 + Phase 4 특수 4)
- 양측 의존 = BG1~BG7 (Phase 2) + BT1~BT8 (Phase 3) + BO1~BO8 (Phase 4)
- 2 측 badge 분리 = Site Operator (dark+gold) vs Series Operator (navy+silver)
- phase-ledger Phase 2 ⑩ + Phase 3 ⑩ + Phase 4 ⑩ 동시 ✅

다음 = Phase 2C + 3C + 4C 운영 박제 (Cowork 가 별 의뢰서)"

git push origin subin
```

---

## 7. 양측 의존 검증 메모 (Phase 2C + 3C + 4C 운영 박제 사전 준비)

### Phase 4 (BO1~BO8 · 단체)

| BO | 등급 | 본 의뢰 | 운영 데이터 모델 |
|----|------|---------|----------------|
| BO1 | ★★★ | OU3 신청 ↔ OA1 모달 | `organizations.{status, apply_note, contact_email, region}` |
| BO2 | ★★★ | OU2 events + OU4 ↔ OO2 series-tab | OrgHierarchyCrumbs 공용 컴포넌트 |
| BO3 | ★★ | OO2 only (단체 내부) | `organization_members.role` (owner/admin/member) |
| BO4 | ★★ | OO3 only (시리즈 마법사) | `tournament_series` + `tournament_editions` |
| BO5 | ★★★ | OA1 only (super-admin) | `organizations.status` 변경 + 알림 |
| BO7 | ★ | OU2 teams-tab → Phase 3 TU2 | `Team` cross-domain |
| BO8 | ★★ | OU2 sidebar + OU4 회차 → Phase 1 | `tournaments.id` cross-domain |

### Phase 3 (BT1~BT8 · 팀) + Phase 2 (BG1~BG7 · 경기)

→ phase-3-v2.21-sync-cli-prompt §7 + phase-2-v2.20-sync-cli-prompt §7 그대로 활용.

---

## 8. 완료 후 사용자 보고

```
Phase 2 v2.20 + Phase 3 v2.21 + Phase 4 v2.22 sync 완료 ✅ (v2.22 1 회 sync 로 동시 처리)
- BDR-current = jsx 39 + css 6 + game-shared.jsx + team-shared.* + org-shared.* + _baseline/ 10
  = ~60 파일 (Phase 1A 11 + Phase 1B 5 + Phase 2 10 + Phase 3 5 + Phase 4 8 + 보조)
- Phase 4 신규 8 시안 (OU1~4 + OO1~3 + OA1) + org-shared (529+1360 line)
- Phase 4 4 가정 lock (Q1~Q4) commit 메시지에 박제 명시
- Phase 1A/1B/2/3 carry-over 변경 0
- 회귀 검수 24 케이스 통과
- pre-snapshot = _archive/BDR-current-2026-05-28-pre-v2.22/ 보존
- phase-ledger Phase 2/3/4 ⑩ 동시 ✅
- commit `<hash>` push 완료

다음 가능한 batch:
- Phase 1C 운영 박제 batch (15 PR · 의뢰서 작성됨)
- Phase 2C + 3C + 4C 운영 박제 (~25 PR · Cowork 자동 작성 가능)
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-4-v2.22-sync-cli-prompt-2026-05-28.md 하고 §2 사전 점검 + 옵션 결재부터 시작해줘.`
