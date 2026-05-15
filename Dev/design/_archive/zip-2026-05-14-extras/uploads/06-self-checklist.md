# 시안 완료 후 자체 검수 체크리스트

> 모든 시안은 제출 전에 다음 체크리스트를 통과해야 함.
> 위반 1건이라도 발견 시 시안 재작업 후 제출.

---

## §1. AppNav (헤더) 7 룰 검수 ⭐ 가장 중요

| # | 항목 | 통과 기준 | 위반 시 |
|---|------|---------|---------|
| 1 | 9 메인 탭 | tabs 배열 = `[홈/경기/대회/단체/팀/코트/랭킹/커뮤니티/더보기]` 9개 | 03 frozen 코드 카피 |
| 2 | utility bar 우측 (계정/설정/로그아웃) | 모바일 viewport 에서도 노출 (좌측만 hidden) | `.util-left` 클래스 분리 확인 |
| 3 | main bar 우측 = 검색/알림/다크/햄버거 4개만 | "더보기 ▼" dropdown trigger / "RDM rdm_captain" 아바타 노출 X | 시안에서 제거 |
| 4 | 다크모드 — PC 듀얼 / 모바일 단일 아이콘 | ThemeSwitch viewport 분기 (768px) | `.theme-switch--mobile` 클래스 추가 |
| 5 | 검색/알림 = `app-nav__icon-btn` 클래스 | border / 배경 박스 X | `.btn--sm` → `.app-nav__icon-btn` 교체 |
| 6 | 모바일 닉네임 hidden | 햄버거와 충돌 방지 | `display: none` 또는 hidden 분기 |
| 7 | 더보기 = 9번째 탭 | 클릭 시 drawer + 5그룹 패널 노출 | drawer 안에 moreGroups 5개 |

### 자동 검수 grep

```bash
# §1-3 위반 검사
grep -n "더보기 ▼\|RDM rdm_captain" components.jsx
# → 0 매칭 기대

# §1-5 위반 검사
grep -n 'btn btn--sm" title="검색"' components.jsx
# → 0 매칭 기대 (.app-nav__icon-btn 사용해야 함)
```

---

## §2. 더보기 5그룹 IA 검수

| 항목 | 통과 기준 |
|------|---------|
| 5그룹 구조 | 내 활동 / 경기·대회 / 등록·예약 / 둘러보기 / 계정·도움 |
| 가짜링크 4건 | gameResult / gameReport / guestApps / referee 모두 추가 X |
| refereeInfo | "둘러보기" 그룹에 (referee 대신) 사용 |
| 마이페이지 | "계정·도움" 그룹 첫 항목 (Phase 13 신규) |

### 자동 검수

```bash
grep -E "id:\s*'(gameResult|gameReport|guestApps)'" components.jsx
# → 0 매칭 기대

grep -E "id:\s*'referee'" components.jsx | grep -v "refereeInfo\|refereeRequest"
# → 0 매칭 기대 (가짜링크 referee 단독 X)
```

---

## §3. 디자인 토큰 검수

| 항목 | 통과 기준 |
|------|---------|
| 색상 | `var(--accent / --cafe-blue / --bg-alt / --ink-mute)` 등 토큰만 |
| 하드코딩 hex | `#`로 시작하는 hex 값 0건 (또는 토큰 안 fallback 만) |
| 핑크/살몬/코랄 | 절대 0건 |
| 라운딩 | 버튼 4px / 카드 8px (pill 9999px X — 아바타·dot 만 허용) |
| 아이콘 | Material Symbols Outlined 또는 검증된 이모지 |

### 자동 검수

```bash
# 하드코딩 hex 검사 (시안에서)
grep -nE "#[0-9A-Fa-f]{3,8}" screens/[NewFile].jsx | grep -v "var(--"
# → 토큰 외 hex 0 매칭 기대

# 핑크 / 살몬 검사
grep -inE "pink|salmon|coral|#FF[8AB][0-9A-F]{4}" screens/
# → 0 매칭 기대

# pill 9999px 검사
grep -nE "border-radius:\s*9999px|radius:\s*999" screens/
# → 0 매칭 기대 (아바타 / dot / 뱃지 외)

# lucide-react 검사
grep -rE "from ['\"]lucide-react['\"]" screens/
# → 0 매칭 기대
```

---

## §4. 카피 / 콘텐츠 검수

| 항목 | 통과 기준 |
|------|---------|
| 글로벌 슬로건 | "전국 농구 매칭 플랫폼" |
| "서울 3x3" 한정 표현 | 0 매칭 (3x3 = 게임 종류로만 OK) |
| About 운영진 | 일반 라벨 (실명 박제 X) |
| placeholder 길이 | 5단어 이내 (사용자 결정 §B) |
| "예: " / "ex)" placeholder | 0 매칭 (사용자 결정 §B) |
| alert("준비 중") 신규 | 라우트 존재 시 Link 사용, alert 추가 X |

### 자동 검수

```bash
grep -rE "서울 3x3|서울을 중심으로 한 3x3" screens/
# → 0 매칭 기대 (3x3 만 단독은 OK)

grep -rE 'placeholder=["\047]예: ' screens/
# → 0 매칭 기대
```

---

## §5. 모바일 룰 검수

| 항목 | 통과 기준 |
|------|---------|
| 720px 분기 | 모든 인라인 grid `repeat(N, 1fr)` 에 720px 분기 또는 `auto-fit minmax` |
| 가로 overflow | iPhone SE (320px) 에서 0 |
| iOS input 16px | 모바일 input/select/textarea font-size 16px |
| 버튼 44px | 모바일 .btn min-height 44px |
| 사이드바 모바일 | lg:hidden 또는 stack 1열 (with-aside 패턴) |
| 다크/라이트 양쪽 검증 | 양 모드 모두 시각 통과 |

### 자동 검수

```bash
# 인라인 고정 grid 검사 (auto-fit / className 분기 없는 패턴)
grep -nE "gridTemplateColumns:\s*['\"]repeat\([0-9]" screens/
# → 0 매칭 기대 또는 auto-fit minmax 변환됨

# input 16px 검사 (시안 CSS)
grep -A 3 "input.*max-width.*720" responsive.css
# → font-size: 16px !important 포함 기대
```

---

## §6. 페이지 간 연결성 검수

| 항목 | 통과 기준 |
|------|---------|
| 진입 경로 | 시안 헤더 코멘트에 "진입: ..." 명시 |
| 다음 액션 | 클릭 시 어디로 가는지 명시 |
| 복귀 경로 | AppNav / PageBackButton / breadcrumb 중 1 |
| Edge cases | 권한 없음 / 빈 상태 / 에러 / 로딩 모두 명세 |

### 시안 JSDoc 표준 헤더

```jsx
/**
 * [ComponentName] — [라우트 경로] ([등급] [Phase] [신규/회귀])
 *
 * Why: [페이지 목적 1줄]
 * Pattern: [디자인 패턴]
 *
 * 진입: [어디서]
 * 복귀: [어디로]
 * 에러: [권한 / 빈 상태 / 에러 처리]
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 | v2.X | 진입점 | 모바일
 *   [기능1]          | ... | ✅   | ...    | 1열
 *   [기능2]          | ... | ✅   | ...    | hscroll
 */
```

---

## §7. 시안 외 영역 (E등급) 작업 시

만약 admin / referee / tournament-admin / partner-admin / _site 영역 자체 디자인 의뢰면:

| 항목 | 통과 기준 |
|------|---------|
| AppNav 적용 X | 자체 셸 사용 (AdminSidebar / RefereeShell 등) |
| 디자인 토큰 일치 | §3 동일 |
| 사용자 결정 §1 (헤더) | 적용 X (자체 셸이라 무관) |
| 사용자 결정 §2 (더보기) | 적용 X |
| 사용자 결정 §3~§8 | 영역별 적용 (예: settings 이모지 아이콘 §4-2) |
| 박제 등급 | E (영구) — 박제율 KPI 영향 X |

---

## §8. 출시 전 최종 검수 (의뢰서 §5 산출물 체크리스트)

```
[ ] Dev/design/BDR v2.X/ 폴더 생성 (이전 버전 카피 + 변경)
[ ] README.md 에 v(X-1) → v(X) 변경 요약
[ ] screens/[ComponentName].jsx 작성 또는 갱신
[ ] components.jsx 의 AppNav frozen — 변경 0 (또는 03 코드 카피만)
[ ] components.jsx moreGroups — 가짜링크 4건 X / refereeInfo / mypage 추가 검수
[ ] tokens.css — 변경 시 명시 (보통 변경 X)
[ ] responsive.css — 새 모바일 룰 추가 시 G-10 패턴 따라
[ ] MyBDR.html — 신규 라우트 등록 (해당 시)
[ ] _mobile_audit.html — 신규 그룹 등록 (해당 시)
[ ] §1~§6 자체 검수 모두 통과
[ ] PR / 산출물 보고 1줄: "✅ Phase X — [작업명] 완료, 검수 모두 통과"
```

---

## §9. 검수 자동화 스크립트 (참고)

`scripts/check-design-rules.sh` (사이트 코드용 — 시안에는 별도 적용 X):

```bash
#!/usr/bin/env bash
set -e

# 1. lucide-react import 검사
echo "[1] lucide-react import..."
LUCIDE=$(rg -n "from ['\"]lucide-react" src 2>/dev/null || true)
[ -z "$LUCIDE" ] && echo "✅ 0건" || { echo "🚨 $LUCIDE"; exit 1; }

# 2. 핑크 / 살몬 검사
echo "[2] 금지 색상..."
PINK=$(rg -n "#FF[8AB][0-9A-Fa-f]{4}|pink-[0-9]|salmon|coral" src 2>/dev/null || true)
[ -z "$PINK" ] && echo "✅ 0건" || { echo "🚨 $PINK"; exit 1; }

# 3. 가짜링크 4건 검사
echo "[3] 가짜링크 추가..."
GHOST=$(grep -E "id:\s*['\"](gameResult|gameReport|guestApps)['\"]" src/components/bdr-v2/more-groups.ts 2>/dev/null || true)
[ -z "$GHOST" ] && echo "✅ 0건" || { echo "🚨 $GHOST"; exit 1; }

# 4. "서울 3x3" 검사
echo "[4] 서울 3x3 한정 표현..."
SEOUL=$(rg -n "서울 3x3|서울을 중심으로 한 3x3" src 2>/dev/null || true)
[ -z "$SEOUL" ] && echo "✅ 0건" || { echo "🚨 $SEOUL"; exit 1; }

# 5. AppNav 위반 검사
echo "[5] AppNav 위반..."
NAV1=$(rg -n "더보기 ▼|RDM rdm_captain" src/components/bdr-v2/app-nav.tsx 2>/dev/null || true)
[ -z "$NAV1" ] && echo "✅ 0건" || { echo "🚨 $NAV1"; exit 1; }

echo ""
echo "🎉 모든 검수 통과"
```

→ `npm run check:design` (이미 사이트에 등록됨, `package.json` 의 scripts 참고).

---

## 부록 — 검수 결과 보고 형식

```
✅ [작업명] 시안 검수 결과

§1. AppNav 7 룰: 7/7 통과
§2. 더보기 5그룹 IA: 통과 (가짜링크 0)
§3. 디자인 토큰: 통과 (하드코딩 hex 0)
§4. 카피: 통과
§5. 모바일: 통과 (720px / iOS 16px / 44px)
§6. 연결성: JSDoc 매트릭스 첨부 완료
§7. (해당 시) E등급 자체 영역 룰

산출물:
- Dev/design/BDR v2.X/screens/[ComponentName].jsx
- components.jsx moreGroups [변경 사항]
- README.md 변경 요약 첨부

검수 통과. PR 생성 준비 완료.
```
