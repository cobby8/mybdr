# Phase 9 (v2.29) — BDR-current sync CLI 의뢰서

> **수신**: Claude CLI (mybdr, `subin` 브랜치)
> **선행 박제**: Phase 1~8 sync ✅ + 운영 반영 완료 (#662/#664). BDR-current = v2.28 (Phase 8)
> **선행 의뢰**: `phase-4-v2.22-sync-cli-prompt-2026-05-28.md` (동일 패턴 — Phase 9 차이만)
> **운영 코드 변경**: **0** — 시안 sync + 회귀 검수 + ledger + commit/push 만
> **★ 본 sync 특성**: **단순 incremental** (v2.28 → v2.29). Phase 9 4 시안만 신규 / Phase 1~8 carry-over 변경 0 (Cowork 사전 diff 검증 완료)

---

## 1. 한 줄 요약

`_zips/BDR-v2.29-phase9-bake-2026-06-08.zip` 안 `Dev/design/BDR v2.29/` (Phase 9 박제 4 시안 NU1~NU3 + NA1 + Phase 1~8 carry-over) 를 `sync-bdr-current.ps1` 로 `BDR-current/` 에 동기화 → 회귀 검수 (4 frozen + 8 self + Phase 9 특수 5 = 17 케이스) → phase-ledger Phase 9 섹션 신규 추가 (⑩ ✅) → commit/push.

---

## 2. 사전 점검 + 옵션 결재

```
□ git remote -v / fetch / 브랜치 = subin / .env / .env.local
□ 현재 BDR-current/ = v2.28 (Phase 8) — root 98 / screens 80 / shared.jsx 10
□ phase-ledger Phase 8 ⑩~⑭ = ✅ 종료 확인 / Phase 9 섹션 = 아직 없음 (본 sync 가 신규 추가)
□ subin = dev = #663 정합 (0 ahead / 0 behind) — 깨끗
□ 미커밋 working-tree = .claude/ 내부 파일 (design/src 무관) — 본 sync 와 분리 commit 권장
```

### 옵션 결재 — sync 횟수 (Cowork 자동 결재 = 옵션 A)

**옵션 A (자동 결재 default)** — **v2.29 1 회 incremental sync**:
- BDR-current/ v2.28 → v2.29 (Phase 9 4 시안 추가)
- pre-snapshot 1 회 = `_archive/BDR-current-2026-06-08-pre-v2.29/`
- Phase 9 ⑩ ✅ / commit 1 회
- ※ v2.22(Phase 2+3+4 superset) 같은 다중 결합 아님 — Phase 8 까지 이미 sync 완료 상태에서 Phase 9 만 누적

→ **권장 = 옵션 A** (단순 incremental). 다른 옵션 불필요.

→ 결재 전 sync 실행 ❌. (자동 점검 룰상 옵션 A 로 진행해도 무방 — 사용자 명시 반대 시에만 중단)

### ★ Cowork 사전 diff 검증 결과 (2026-06-08, `diff -rq` 실측)

```
변경 (differ)  : README.md, index.html  (v2.28→v2.29 버전 / index 목차 Phase 9 추가) — 정상
추가 (NEW 10)  : notify-shared.jsx, notify-shared.css,
                 nu1-notifications.html, nu2-messages.html, nu3-search.html, na1-admin-notifications.html,
                 screens/Notifications.jsx, screens/Messages.jsx, screens/Search.jsx, screens/AdminNotifications.jsx
삭제 (removed) : 0
Phase 1~8 carry-over 변경 : 0  ← admin.css/tokens.css/shell.css/shared.jsx + 9 shared.* + 전 wrapper/screens 전부 identical
```
→ **회귀 위험 0 의 클린 incremental.** 아래 검수는 sync 후 재확인용.

---

## 3. sync 실행 — 옵션 A

```powershell
$zip = "C:\0. Programing\mybdr\Dev\design\_zips\BDR-v2.29-phase9-bake-2026-06-08.zip"
# (대안 원본: uploads 의 "BDR v2 (8).zip" — 동일 내용. _zips 사본이 영구 경로라 권장)

# DryRun 먼저
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.29" -DryRun

# 통과 시 실 실행 (BOM 우회 ❌ — commit 5609c61 영구 해결됨)
.\scripts\sync-bdr-current.ps1 -ZipPath $zip -NewVersion "v2.29"
```

**완료 검증 (기대값)**:
```powershell
ls Dev/design/BDR-current/                  # root 104 (notify-shared.jsx/css + nu1~3/na1 html 추가)
ls Dev/design/BDR-current/screens/          # 84 (= 80 + Notifications/Messages/Search/AdminNotifications)
ls Dev/design/BDR-current/*-shared.jsx      # 11 (notify-shared.jsx NEW 포함)
ls Dev/design/_archive/BDR-current-2026-06-08-pre-v2.29/   # pre-snapshot = v2.28 (root 98 / screens 80)
```

### sync 후 BDR-current/ 신규 파일 (10) line count 기대

```
notify-shared.jsx        148
notify-shared.css        181
screens/Notifications.jsx 92   (NU1)
screens/Messages.jsx     121   (NU2)
screens/Search.jsx        94   (NU3)
screens/AdminNotifications.jsx 160 (NA1)
+ nu1/nu2/nu3/na1 wrapper html 4
```

---

## 4. 회귀 검수 — 17 케이스

### 4 frozen (AppNav) + 8 self → `phase-4-v2.22-sync-cli-prompt` §4 케이스 1~12 그대로 적용

추가 주의: NU1~NU3 = 사용자 시안 `active="more"` (알림·검색은 더보기 그룹) · NA1 = admin standalone.

### Phase 9 특수 5 케이스 (신규)

```bash
CUR=Dev/design/BDR-current
PRE=Dev/design/_archive/BDR-current-2026-06-08-pre-v2.29

# 케이스 13 — notify-shared.jsx + notify-shared.css 신규 보존
test -f $CUR/notify-shared.jsx && test -f $CUR/notify-shared.css && echo "✓ notify-shared 쌍" || echo "✗ 누락"
wc -l $CUR/notify-shared.jsx $CUR/notify-shared.css   # 기대: 148 / 181

# 케이스 14 — Phase 9 신규 4 screens
for f in Notifications Messages Search AdminNotifications; do
  test -f "$CUR/screens/$f.jsx" && echo "✓ $f.jsx" || echo "✗ $f.jsx 누락"
done

# 케이스 15 — Phase 1~8 carry-over 변경 0 (★ 핵심) — pre-snapshot 과 신규 10 파일 제외 전부 동일
diff -rq $PRE $CUR | grep -vE "README.md|index.html|notify-shared|nu1-|nu2-|nu3-|na1-|Notifications.jsx|Messages.jsx|Search.jsx|AdminNotifications.jsx"
# 기대: 출력 0줄 (= carry-over diff 0)

# 케이스 16 — 13 룰 (Phase 9 파일 한정)
grep -rni "lucide-react" $CUR/notify-shared.* $CUR/screens/{Notifications,Messages,Search,AdminNotifications}.jsx    # 기대 0
grep -rniE "href=[\"']#[\"']|TODO_LINK|가짜" $CUR/screens/{Notifications,Messages,Search,AdminNotifications}.jsx       # 가짜링크 기대 0

# 케이스 17 — Phase 9 가정 보존: messages 모델 미신설 / "준비 중" carry / NotifCategory enum 일치
grep -ni "준비 중" $CUR/screens/Messages.jsx | head -2          # NU2 DB 미지원 carry (제거 ❌)
grep -niE "tournament|game|team|community|system" $CUR/notify-shared.jsx | head -3   # NotifCategory enum (NU1 표시 = NA1 발송 동일)
```

→ 케이스 15 가 1 줄이라도 출력되면 sync 중단 + pre-snapshot 복원 검토 (carry-over 깨짐).

---

## 5. phase-ledger 갱신 — Phase 9 섹션 신규 추가

`.claude/phase-ledger.md` 의 "## 완료 Phase (이력)" 위, Phase 8 섹션 아래에 추가:

```
### Phase 9 — 알림·메시지·검색 영역

| 단계 | 영역 | 상태 | 책임자 | 갱신일 | 메모 |
|------|------|------|------|------|------|
| ⑩ sync 실행 | 9A+9B | ✅ 완료 | CLI | 2026-06-08 | v2.29 incremental sync. `notify-shared.jsx/css` 신규(148+181). Notifications/Messages/Search/AdminNotifications 4 jsx. Phase 1~8 carry-over diff 0 / pre-snapshot `_archive/BDR-current-2026-06-08-pre-v2.29/`. messages DB 0% = 정적 더미 "준비 중" carry. 회귀 17 케이스 통과 |
| ⑪ 운영 박제 (9C) | 9C | ⏸ 보류 | CLI | - | PR 4 예상 (NU1 Notifications + NU2 Messages carry + NU3 Search + NA1 AdminNotifications). Cowork batch 의뢰서 후속 |
| ⑫ 회귀 검수 | 9C | ⏸ 보류 | | | |
| ⑬ PR 결재 | 9C | ⏸ 보류 | 수빈 | | |
| ⑭ Phase 완료 | 9 | ⏸ 보류 | | | |
```

(부록 B 갱신 이력에도 1줄 추가 권장: `| 2026-06-08 | Phase 9 v2.29 sync ⑩ ✅ — 알림·메시지·검색 4 시안 / notify-shared 신규 / carry-over diff 0 | Phase 9 박제 zip 도착 |`)

---

## 6. commit + push

```bash
git add Dev/design/ .claude/phase-ledger.md
git status
git commit -m "design: BDR-current sync v2.29 (Phase 9 알림·메시지·검색 4 시안)

- v2.29 = v2.28(Phase 8) + Phase 9 incremental (NU1~NU3 + NA1)
- 신규: notify-shared.jsx(148) + notify-shared.css(181)
  + screens/Notifications.jsx(92) Messages.jsx(121) Search.jsx(94) AdminNotifications.jsx(160)
  + nu1~nu3 / na1 wrapper html
- Phase 1~8 carry-over 변경 0 (Cowork 사전 diff + 회귀 케이스 15 검증)
- pre-snapshot = _archive/BDR-current-2026-06-08-pre-v2.29/ (v2.28)
- 가정: messages DB 0% 정적 더미 '준비 중' carry / 검색 결과 mock / main bar 카운트 안내
- 회귀 검수 17 케이스 통과 (4 frozen + 8 self + Phase 9 특수 5)
- 양측 의존 = BN1~BN4
- phase-ledger Phase 9 ⑩ ✅ (섹션 신규)

다음 = Phase 9C 운영 박제 (Cowork batch 의뢰서)"

git push origin subin
```

---

## 7. 양측 의존 검증 메모 (Phase 9C 운영 박제 사전 준비)

| BN | 등급 | 본 의뢰 | 운영 데이터 모델 |
|----|------|---------|----------------|
| BN1 | ★★★★ | NU1 카테고리 chip + 카운트 동기화 | `notifications` (1765) + NotifCategory enum + main bar 카운트 (전 Phase cross-domain) |
| BN2 | ★★★ | NU2 메시지 hub (carry) | **messages 모델 없음 (DB 0%)** → 정적 더미 carry + "준비 중" (제거 ❌ · 모델 신설 ❌) |
| BN3 | ★★★ | NU3 통합 검색 | Phase 1~8 cross-domain (game/tournament/team/court/user/community) 결과 진입 link |
| BN4 | ★★ | NA1 발송 → NU1 수신 | `notifications.*` target 분리 (전체/일반/팀장/관리자) · POST /api/web/admin/notifications · Phase 4 OA1 답습 |

→ 9C 박제 옵션 = B (보수 / mock 0) 자동 결재. NU2 = DB 미지원이므로 "준비 중" 유지 (mock 더미 carry 허용 — 운영 지침). NA1 라우트 = `/admin/notifications` (가짜링크 ❌).

---

## 8. 완료 후 사용자 보고

```
Phase 9 v2.29 sync 완료 ✅ (incremental 1 회)
- BDR-current = v2.29 (root 104 / screens 84 / shared.jsx 11) — notify-shared.* 신규
- Phase 9 신규 4 시안 (NU1 알림 + NU2 메시지 carry + NU3 검색 + NA1 AdminNotifications)
- Phase 1~8 carry-over 변경 0 (carry-over diff 0 검증)
- 회귀 검수 17 케이스 통과
- pre-snapshot = _archive/BDR-current-2026-06-08-pre-v2.29/ 보존
- phase-ledger Phase 9 ⑩ ✅ (섹션 신규)
- commit `<hash>` push 완료

다음 = Phase 9C 운영 박제 batch (4 PR · Cowork 자동 작성 가능)
```

---

**의뢰서 끝.** 수빈이 CLI 에 한 줄로 전달:
`Read Dev/design/prompts/phase-9-v2.29-sync-cli-prompt-2026-06-08.md 하고 §2 사전 점검 + 옵션 결재(A)부터 시작해줘.`
