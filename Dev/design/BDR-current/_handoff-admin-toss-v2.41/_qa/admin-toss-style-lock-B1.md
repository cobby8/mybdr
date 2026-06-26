# _qa/admin-toss-style-lock-B1.md — 관리자 Toss 스타일 잠금 (공식 관리자 디자인 시스템)

> 작성 2026-06-26 · **PM 정정 채택**: Toss 스타일 = MyBDR **관리자/운영자 영역 공식 디자인 시스템**.
> 적용 범위: `/tournament-admin/*` 워크스페이스 + 패널 + v2.40 통합 Admin Console(`Dev/design/BDR v2.40/_admin-unified/`).
> **사용자 공개 영역(`(web)/*`)에는 적용하지 않음** — 거긴 기존 BDR 13룰 + AppNav frozen + 사용자 결정 §1~§8 그대로.
> 본 문서는 **잠금(lock)**: 관리자 시안은 아래 토큰/클래스/아이콘/컴포넌트를 **그대로** 사용해야 하며, BDR 13룰로 번역하면 reject.

---

## 0. 원칙 (2개 디자인 시스템 공존)

| 영역 | 디자인 시스템 | 근거 |
|---|---|---|
| 사용자 공개 (`(web)/*`, 대회 공개 사이트) | **BDR 13룰** + AppNav frozen + 사용자 결정 §1~§8 | CLAUDE.md |
| 관리자/운영자 (`/tournament-admin/*`, `/admin/*`, 워크스페이스, 7 패널) | **Toss 스타일**(본 문서) | PM 정정 2026-06-26 |

> 경계: 운영자가 만드는 **대회 공개 사이트**(site-panel의 결과물·서브도메인 페이지)는 *사용자 공개 영역* → BDR 룰. 사이트를 **설정하는 운영 패널**(site-panel UI)은 *관리자 영역* → Toss. 둘을 혼동 금지.

---

## 1. canonical 자산 (재사용 — 신규 작성 금지)

| 파일 | 역할 |
|---|---|
| `Dev/design/BDR v2.40/_admin-unified/toss.css` | Toss 토큰 + `ts-*` 유틸 클래스 정본 |
| `Dev/design/BDR v2.40/_admin-unified/toss-kit.jsx` | Toss React 키트(Btn/Card/Modal/Badge/Icon 등) |
| `Dev/design/BDR v2.40/_admin-unified/au.css` / `au-kit.jsx` | Admin Console 셸·화면 키트 |
| `Dev/design/BDR v2.40/_admin-unified/AdminConsole.html` | 통합 Admin Console 기준 셸 |

> 워크스페이스 Toss 역박제본은 위 `toss.css`/`toss-kit.jsx`를 **복사·재사용**한다. BDR `tokens.css`/`admin.css`로 치환 금지.

---

## 2. 토큰 잠금 (운영 src 실측 — 그대로 사용)

> 아래는 위반이 아니라 **정식 토큰**. 우변 BDR 치환 금지.

### 2-1. 색
- `--color-primary` (Toss blue, 주요 액션) · `--primary` · `--primary-weak`
- `--color-info` (navy, 정보/링크 강조) · `--color-accent` (진행 fill)
- `--color-success` · `--color-warning` · `--color-error` · `--color-on-primary`
- 텍스트: `--color-text-primary`/`-secondary`/`-muted` · `--ink`/`--ink-soft`/`--ink-mute`/`--ink-dim`
- 면: `--color-card` · `--color-elevated` · `--color-surface` · `--color-background` · `--grey-50`/`--grey-100`
- 선: `--color-border` · `--color-border-subtle` · `--color-border-strong` · `--danger`
- 틴트 패턴: `color-mix(in srgb, var(--color-*) N%, transparent)` — **허용**(BDR 토큰 틴트로 치환 금지).

### 2-2. 라운딩 / 그림자 / 타이포
- 라운딩: `--radius-card` · `--radius-chip` · 임의값 `rounded-[12px]/[14px]/[16px]/[18px]/[24px]` · **`rounded-full`/9999px 허용**(버튼·칩·아바타·스와치·step 번호 전부).
- 그림자: `--sh-sm`/`--sh-md`/`--sh-lg`.
- 폰트: `--ff` · `--ff-mono` · `--ff-display`.

### 2-3. 도메인 hex 예외 (토큰화 제외 — 의도적)
- site `TEMPLATES` 미리보기 hex(Classic/Dark/Minimal) · `COLOR_PRESETS` 8색 · `UNIFORM_PALETTE` 16 저지색 · 팀 `primaryColor` 런타임 데이터.

---

## 3. 클래스 잠금 (`ts-*` / `ct-*` / `amt-*` / kit)

- **버튼**: `ts-btn` + `ts-btn--primary`/`--secondary`/`--danger`/`--ghost`/`--sm`/`--block` · 보조 `btn`/`btn--sm`/`btn--primary`(ui 키트).
- **카드/면**: `ts-card`(`--tight`) · `Card`(ui) · `ct-emptybox`(`--tall`).
- **입력**: `ts-input` · `ts-select` · `ts-field`(`__label`/`__hint`) · `ts-chip`(`data-active`) · `ts-badge`(`--grey`).
- **셸/레이아웃**: `ct-page`(`--workspace`) · `ct-grid`(`--2`/`--workspace`) · `ct-col` · `ts-segment`(`__btn`) · `ta-panel-embed` · `admin-stat-pill`(`data-tone`).
- **워크스페이스 부속**: `ct-headicon` · `ct-metric` · `ct-panel-summary`/`-stats`/`-actions` · `ct-sptile` · `ct-iconbtn`.
- **생성 마법사(ct-schedule-venue / ct-game-settings)**: `ct-stepper` · `ct-segsm` · `ct-vsearch`(`__menu`/`__opt`) · `ct-venuerow` · `ct-dateblock` · `ct-courtpick` · `ct-courttag` · `ct-cal`(`__nav`/`__wk`/`__grid`/`__day`) · `ct-rule-details` · `ct-preset-grid` · `ct-rulegrid` · `ct-game-rules-card` · `ct-embedded-block`.
- **경기표**: `amt-table`(`-wrap`/`__time`/`__court`/`__div`/`__teams`/`__score`) — `matches-admin.css`.
- **셋업 hub 부속(BDR-current에 이미 존재)**: `atsh-progress`/`atsh-item`/`atsh-gate`/`atsh-toast`/`atsh-mobile-sticky`. (이 클래스들은 Toss 토큰으로 재정의해 통일.)

---

## 4. 아이콘 잠금 (lucide — 유지)

- 키트: `@/components/admin-toss`의 `<Icon name="…" />` = **lucide**. Material Symbols로 치환 **금지**.
- 실측 사용 이름(그대로 유지): `x`·`search`·`map-pin`·`map-pin-off`·`calendar-days`·`calendar-plus`·`calendar-check`·`chevron-left/right/up/down`·`minus`·`plus`·`check`·`shirt`·`arrow-left-right`·`sliders-horizontal`·`gamepad-2`·`file-text`·`pencil`·`trophy`·`globe`·`rocket`·`triangle-alert`·`info`·`link`·`download`·`message-circle`·`copy`·`printer`·`trash-2`·`user-plus`·`clipboard-paste`·`refresh-cw`·`briefcase`·`id-card`·`user`·`circle-help`·`volleyball`·`layout-grid`·`category`·`calendar`·`timer`·`flag`·`clock`·`shield_person`(혼용 시 lucide 우선).
- 정적 HTML 시안에서 lucide를 못 쓰면: lucide 아이콘 폰트/SVG 스프라이트를 가져와 동일 이름으로 사용(임의로 Material Symbols 대체 금지). 부득이한 대체는 PM 승인 후 매핑표 별도 관리.

---

## 5. 컴포넌트 잠금 (kit 혼재 = 정상)

- `admin-toss`: `Icon` · `Btn` · `Card` · `Modal` · `Badge`.
- `ui`: `Card` · `Button`(`variant="secondary"`) · `Image`.
- `ts-*` 유틸 클래스 직접 사용.
- **혼재 허용**: 한 화면에 `ts-btn`과 `ui/Button`, `admin-toss/Modal`이 함께 있어도 위반 아님(운영 실측 그대로). 통일 강제 금지(운영과의 1:1 정합 우선).

---

## 6. 이모지 / 영문 (관리자 영역 한정 허용)

- 이모지 🎨📄🚀🏆👥 등 운영 실측 그대로 유지(제거·치환 금지).
- 영문 토큰(vs·HOME/AWAY·BYE 등)이 운영 코드에 있으면 **운영 그대로**(관리자 영역). 단 운영이 이미 한글("대" 등)이면 한글 유지.
- ⚠️ **사용자 공개 영역 분리**: 운영자가 만든 공개 사이트/공개 라벨은 BDR 룰 → 영문 금지·한글화 계속 적용.

---

## 7. 시안화 규칙 (역박제 = Toss 구조 1:1)

1. 운영 src의 DOM 구조·클래스·상태 분기·조건부 렌더를 **그대로** 재현(시각·인터랙션).
2. 데이터 fetch/PATCH/POST는 **mock**(클라이언트 상태 시연). 단 CSV·클립보드·프린트·파싱·캘린더 토글 등 순수 클라이언트 동작은 실제 구현.
3. Toss 토큰/클래스/아이콘은 §2~§5 그대로. BDR 토큰으로 번역 0.
4. 기능/상태 누락 0 — `function-lock-B1.md` 대조.
5. 운영 src 파일은 수정 금지(읽기 전용 reference). API/Prisma/라우트 제안 금지.

---

## 8. reject 조건 (관리자 시안)

- ❌ Toss 토큰/클래스/lucide를 BDR(`--accent`/Material Symbols/`btn`)로 번역.
- ❌ `rounded-full`/9999px를 4px로 강제 변경(관리자 영역).
- ❌ 이모지·영문 라벨을 임의 제거/한글화(운영이 그대로인 경우).
- ❌ 운영 src 직접 수정 / API·Prisma·라우트 제안.
- ❌ 기능·상태 분기 누락(`function-lock-B1.md` 위반).
- ✅ (반대로) 사용자 공개 영역에 Toss 토큰 침범 = reject(거긴 BDR).
