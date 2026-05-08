# BDR 디자인 의뢰 로드맵 — Phase A → F (2-Stream 워크플로우)

> 작성: 2026-05-07 / 갱신: 2026-05-07 (2-stream 워크플로우 명시)
> 목적: 폐기 토큰 (`--color-*`) 329 파일 마이그레이션 + 핵심 페이지 시안 박제를 **영역별 시안 박제와 함께 점진 진행**.
> 진입점: [audit-2026-05-07.md](audit-2026-05-07.md) 의 6 의뢰 → 본 문서의 Phase A~F 로 재정렬.

---

## 0. 작업 분리 (2-Stream)

```
┌──────────────────┬──────────────────────────────────────────────────┐
│ Stream             │ 담당                                                │
├──────────────────┼──────────────────────────────────────────────────┤
│ ① 시안 박제          │ 클로드 디자인 (Claude.ai Project — BDR 디자인)              │
│  (BDR-current/)   │ - screens/*.jsx                                   │
│                  │ - components.jsx (AppNav frozen + 공유 컴포넌트)             │
│                  │ - tokens.css                                      │
│                  │ - MyBDR.html                                      │
├──────────────────┼──────────────────────────────────────────────────┤
│ ② 운영 마이그레이션      │ Cowork (저) 또는 Claude Code                          │
│  (src/)           │ - 시안 산출물 → src/ 적용                                │
│                  │ - var(--color-*) → BDR v2 토큰 (02 §9 매핑)              │
│                  │ - tsc / eslint / git commit                       │
└──────────────────┴──────────────────────────────────────────────────┘
```

**핵심**: 클로드 디자인 Project 는 시안 박제 영역 (BDR-current/) 만 가지고 있음. 운영 src/ 코드 적용은 PM 이 Cowork 에게 별도 의뢰.

---

## 1. 진행 원칙

1. **각 Phase 별 2-step 진행**:
   - Step 1: 클로드 디자인이 시안 박제 (BDR-current/ 갱신) — 본 폴더의 prompts/phase-X.md 사용
   - Step 2: PM 이 Cowork 에 src/ 마이그레이션 의뢰 — 각 prompt 파일 하단의 "PM 후속 작업" 블록 사용
2. **사용자 워크플로우 순서** — 헤더 진입점 → 홈 → 핵심 사용 페이지 → 본인 영역 → 글로벌 정리 → 백오피스.
3. **작은 범위 → 큰 범위** — Phase A (3 페이지 + 시스템 베이스라인) 로 패턴 검증 → Phase B (홈) → Phase C (5 페이지) → ... → Phase F (80 파일).
4. **각 Phase 완료 = 시안 + src/ 둘 다 통과** — `06-self-checklist.md` + 영역별 `grep "var(--color-"` = 0.
5. **각 Phase 별도 PR 또는 commit 그룹** — 영향 범위 격리.

---

## 2. 최적 순서

| Phase | 영역 | 시안 (Stream ①) | 운영 (Stream ②) | 의존성 |
|-------|------|---------------|---------------|--------|
| **A** | **시스템 베이스라인 동기화 + 헤더 진입점** (검색 / 쪽지 / 알림) | tokens.css 신규 16 토큰 / components.jsx Phase 19 / 3 시안 | search/messages/notifications 페이지 + search-autocomplete (37) | 없음 — 시작 가능 |
| **A.5** | **운영 → 시안 역박제 (BDR-current stale 보강)** | components.jsx 8 컴포넌트 + screens 다수 (NavBadge 정합 / 햄버거 R3 / drawer 슬림 / 본인 카드 신청 중 뱃지 등 10건) | (시안만 — 운영 src/ 변경 0) | A 완료 후 / B 진입 전 |
| **B** | 홈 페이지 (P0) | Home.jsx + 카드 컴포넌트 표준 | src/components/home/* 14 파일 (145 위반) + 홈 라우트 | A 완료 권장 |
| **C** | 메인 9개 탭 목록 (`/games`, `/teams`, `/tournaments`, `/courts`, `/community`) | 5 시안 + FilterChipBar / 카드 컴포넌트 | 5 페이지 _v2 박제 + region-picker / floating-filter-panel / edition-switcher | A, B 완료 권장 |
| **D** | 프로필 편집/설정 (`/profile/edit`, `/profile/settings`) | EditProfile/Settings.jsx + ProfileDropdown / PasswordInput / ForceActionModal / SettingsToggle | 2 페이지 + profile-dropdown / profile-accordion | A 완료 권장 |
| **E** | 글로벌 공유 컴포넌트 + tokens.css 최종 정합 | components.jsx 8 글로벌 + tokens.css 02 §1~§9 1:1 | shared 9 파일 + nav-badge.css 하드코딩 hex 정리 | A~D 완료 |
| **F** | admin / referee 일괄 매핑 (E등급) | ❌ 시안 박제 X | (admin 49 + referee 31 = 80 파일 sed 일괄) | E 완료 권장 |

→ **시안 (Stream ①) 추정**: 5~8 세션 (Phase A~E)
→ **운영 (Stream ②) 추정**: 6~10 세션 (각 Phase 후속 + Phase F 일괄)
→ **합계 11~18 세션** (각 세션 = 1~2시간).

---

## 3. Phase 별 이유 / 자연스러운 흐름

### 3-1. Phase A 가 가장 먼저인 이유

- **시스템 베이스라인 동기화** — tokens.css 신규 16 토큰 미정의 + components.jsx 의 utility 로고 이미지 + 햄버거 NavBadge 미반영. 본 Phase 에서 정합 → 후속 Phase 가 활용 가능.
- **작은 범위로 패턴 검증** — 페이지 3개만 (검색/쪽지/알림) → 시안 박제 + AppNav 정합 + 후속 src/ 마이그레이션 패턴이 한 번에 완성됨. 후속 Phase 의 표준이 됨.
- **헤더 진입점 = 모든 페이지의 출발점** — 검색/쪽지/알림은 모든 페이지에서 진입. 정합되면 사용자가 즉시 인지.
- **Phase 19 신규 진입점 (쪽지) 완성** — `/messages` 페이지가 이미 존재하지만 헤더 쪽지 아이콘과 시각 톤 차이 가능성. 본 Phase 에서 정합.
- **search-autocomplete (37건) = 가장 큰 단일 폐기 토큰 잔존 컴포넌트** → 헤더 검색 진입점과 같이 마이그레이션하면 자연스러움.

### 3-2. Phase B 가 두 번째인 이유

- **사용자 첫 진입 = 첫인상** — `/` 진입 시 즉시 보이는 14 컴포넌트가 145 폐기 토큰 잔존. P0.
- **헤더 정합 후 진행 권장** — 사용자가 홈에 진입하기 전에 이미 헤더 (Phase A) 가 정합되어 있으면 시각 충돌 없음.
- **홈 컴포넌트 패턴이 재사용됨** — `home-hero`, `recommended-*`, `news-feed` 등의 카드 패턴이 다른 페이지에서도 활용됨 → 일찍 박제하면 후속 Phase 가 쉬워짐.

### 3-3. Phase C 가 세 번째인 이유

- **메인 9개 탭 목록 = 사용자 일상 사용 페이지** — 진입 빈도 높음.
- **상세 페이지 (`_v2`) 와의 일관성** — `/games/[id]/_v2`, `/teams/[id]/_components_v2`, `/users/[id]/_v2` 가 이미 박제 완료. 목록 페이지 박제 시 이 상세 페이지의 카드 톤과 정합 시켜야 함.
- **공통 필터 컴포넌트 활용** — FilterChipBar (이미 박제) + region-picker / floating-filter-panel 마이그레이션이 5 페이지에 동시 적용됨. 시너지 큼.

### 3-4. Phase D 가 네 번째인 이유

- **본인 영역 = `/profile/_v2` 이미 완료** — 본 Phase 는 잔여 (편집/설정) 마무리.
- **profile-dropdown 정합** — 헤더 (Phase A 완료) 의 utility bar 우측 "이름/설정/로그아웃" 링크 와 시각 정합.
- **/profile/settings 일부 `_components_v2` 적용 중** — 미적용 부분 마저 박제하면 _v2 100% 완료.

### 3-5. Phase E 가 다섯 번째인 이유

- **shared 컴포넌트는 페이지 의존** — Phase A~D 에서 각 페이지 박제 시 그 페이지에서 사용하는 shared 도 같이 정리됨.
- **잔여 = 특정 페이지 종속 안 되는 것들** — `pwa-install-banner` (전역 배너), `push-permission` (전역 모달), `slide-menu` (모바일 슬라이드) 등.
- **글로벌 영향이지만 작은 범위** — Phase A~D 에서 흡수 안 된 잔여만 정리. 1 세션 추정.

### 3-6. Phase F 가 마지막인 이유

- **E등급 (admin / referee / tournament-admin / partner-admin) 은 시안 박제 대상 X** — 자체 셸 사용. 토큰만 일치하면 OK (CLAUDE.md `04-page-inventory.md §5`).
- **클로드 디자인 작업 영역 외** — Phase F 는 시안 의뢰서 없음. PM 이 Cowork 에 직접 의뢰 (`prompts/phase-F-admin-referee.md` 참조).
- **기계적 sed replace 가능** — 02 토큰 §9 매핑 표를 그대로 적용. 시각 검증은 Phase 완료 후 한 번만.
- **마지막에 진행하면 깔끔한 0 달성** — `grep "var(--color-" src/` = 0 마무리 commit.

---

## 4. Phase 별 산출 검증 기준

각 Phase 완료 시 다음 모두 통과해야 다음 Phase 진입:

```bash
# 영역별 폐기 토큰 잔존 0
grep -rln "var(--color-" [phase 영역] | wc -l   # → 0

# 13 룰 통과 (06-self-checklist.md)
grep -rn "from 'lucide-react'" src/             # → 0
grep -rn "9999px" src/ | grep -v "//\|/\*"     # → 0 (코드)
grep -rn 'placeholder=["'\''](예) ' src/        # → 0

# AppNav frozen 영향 0 (Phase A 외)
git diff src/components/bdr-v2/app-nav.tsx     # → 빈 diff (Phase A 외)
```

---

## 5. 각 Phase 프롬프트 (2-Stream 사용 가이드)

**Phase 별 시안 프롬프트 (클로드 디자인 — Stream ①)**:

| Phase | 시안 프롬프트 파일 | Cowork 후속 (Stream ②) |
|-------|--------------|---------------------|
| A | [prompts/phase-A-headers.md](prompts/phase-A-headers.md) | 프롬프트 하단 "PM 후속 작업" 블록 |
| B | [prompts/phase-B-home.md](prompts/phase-B-home.md) | 프롬프트 하단 "PM 후속 작업" 블록 |
| C | [prompts/phase-C-list-pages.md](prompts/phase-C-list-pages.md) | 프롬프트 하단 "PM 후속 작업" 블록 |
| D | [prompts/phase-D-profile-edit.md](prompts/phase-D-profile-edit.md) | 프롬프트 하단 "PM 후속 작업" 블록 |
| E | [prompts/phase-E-shared-cleanup.md](prompts/phase-E-shared-cleanup.md) | 프롬프트 하단 "PM 후속 작업" 블록 |
| F | [prompts/phase-F-admin-referee.md](prompts/phase-F-admin-referee.md) | **시안 X / 본 파일 자체가 Cowork 의뢰서** |

### 사용 방법 (각 Phase)

```
Step 1 — 시안 박제 (클로드 디자인)
  ① prompts/phase-X.md 열기
  ② §"📋 의뢰" 블록 통째 복사
  ③ Claude.ai Project (BDR 디자인) 새 세션에 붙여넣기
  ④ 클로드 디자인이 BDR-current/ 안의 파일 갱신
  ⑤ 시안 결과 검수 (06-self-checklist.md)

Step 2 — 운영 마이그레이션 (Cowork 또는 Claude Code)
  ① prompts/phase-X.md §"🛠 PM 후속 작업" 블록 복사
  ② Cowork (저) 에게 의뢰 (또는 Claude Code 세션)
  ③ Cowork 가 src/ 토큰 마이그레이션 + commit
  ④ grep 검증 통과 확인
```

→ 클로드 디자인 Project 9 파일 박제는 자동 적용됨.
→ Cowork 는 본 repo (mybdr) 전체 접근 가능.

---

## 6. 진행 추적 (2-Stream)

| Phase | Stream ① 시안 | Stream ② 운영 | 시작일 | 완료일 | commit |
|-------|------------|------------|------|------|--------|
| A — 시스템 베이스라인 + 헤더 진입점 | ✅ 완료 | ⬜ pending | 2026-05-07 | 2026-05-07 | (CLI 박제) |
| **A.5 — 운영 → 시안 역박제 (§1~§11)** | ✅ 완료 | 🟡 PM commit 대기 (Cowork stage 완료) | 2026-05-07 | 2026-05-07 | verifier 통과 / staged: globals.css + nav-badge.css |
| **A.6 — 메인 9 탭 목록 5 페이지 역박제** | ✅ 완료 | (운영 source of truth — 변경 불필요) | 2026-05-07 | 2026-05-07 | verifier 통과 / 5 페이지 + drawer + Fix 5건 |
| B — 홈 페이지 (P0) | ⬜ pending | ⬜ pending (145 위반) | | | |
| C — 메인 9개 탭 목록 | ⬜ pending | ⬜ pending | | | |
| D — 프로필 편집/설정 | ⬜ pending | ⬜ pending | | | |
| E — 글로벌 공유 + tokens 최종 | ⬜ pending | ⬜ pending | | | |
| F — admin/referee 일괄 매핑 | — (시안 X) | ⬜ pending | | | |

→ Phase 완료 시 위 표 갱신 (날짜 + commit hash). 각 Phase 는 ① 시안 + ② 운영 모두 통과해야 완료.

---

## 7. 출처 / 검증

- [audit-2026-05-07.md](audit-2026-05-07.md) — 전수조사 결과
- `Dev/design/claude-project-knowledge/02-design-system-tokens.md` — 토큰 + §9 마이그레이션 매핑
- `Dev/design/claude-project-knowledge/03-appnav-frozen-component.md` — Phase 19 13 룰
- `Dev/design/claude-project-knowledge/04-page-inventory.md` — _v2 박제 16 영역 + 잔여 분포
- `Dev/design/claude-project-knowledge/06-self-checklist.md` — 자체 검수
