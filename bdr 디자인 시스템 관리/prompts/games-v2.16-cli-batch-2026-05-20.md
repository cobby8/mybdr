# 경기 탭 v2.16 박제 CLI 작업지시서

> **작성일**: 2026-05-20
> **트리거**: `uploads/BDR v2 (1).zip` 업로드 — v2.16 경기 list/detail/create 시안 도착
> **수행 주체**: `mybdr/` 레포 CLI 클로드 (Cursor / Claude Code)
> **선행 조건**: Phase 0 사용자 결정 완료 (아래 §0)
> **참조 룰**: CLAUDE.md §🗂️ Dev/design 워크플로우 5단계 + §🔄 운영 → 시안 동기화

---

## 0. ✅ Phase 0 — 결정 완료 (2026-05-20, PM 수빈)

박제 진행 전 결정 2건 **완료** — 차단 해제. §1 ~ §3 모두 진행 가능.

### 0-1. 경기 상세 페이지 — 레이아웃 → **V2 (Hero-led) 채택** ✅

- 풀폭 다크 hero band 에 종별 컬러를 강하게 노출
- hero 안에 핵심 정보 (종별 / 제목 / 일시 / 코트 / 정원) 통합
- hero 아래 빠른 액션 ribbon (정원 progress + 신청 CTA + 주최자 미니카드)
- 본문 = 단일 칼럼 섹션 카드 (경기 안내 / 코트 정보 / 참가자 / 댓글 / 같은 코트 다른 경기 / 주최자 다른 모집)
- 모바일 = hero 그대로 + 본문 1-column + 하단 fixed sticky bar (정원 + 신청 버튼)
- 운영 마이그레이션 = `_v2` 구조 유지 + hero 컴포넌트 신설

→ 박제 source: `Dev/design/BDR-current/_game_detail_explore.html` **라인 1928 ~ 1920** (시안 V2 영역) + 라인 ~1760 ~ 1920 모바일 영역도 참조 (모바일 hero 동일 적용).

### 0-2. 경기 상세 페이지 — 참가자 표시 → **Concept B (10인 슬롯 보드) 채택** ✅

- 5×2 슬롯 그리드 (정원 10명 기준 — 6:4 픽업 시 6+4=10)
- filled 슬롯 = 풍부한 카드 (닉네임 + 레벨 + 포지션 + 평점 + 아바타)
- empty 슬롯 = "이 자리에 들어오기" CTA 다이렉트 (점선 border + accent 색상)
- "픽업 모집 = 자리 채우기" 본질을 가장 직관적으로 시각화 → 액션 유발도 ★★★
- 모바일 = 슬롯 그리드 가변 (5×2 → 2×5 또는 1열 스크롤)
- ConceptA (코트 라인업) / ConceptC (대시보드) = **미박제** (BDR-current `_archive/` 보존)

→ 박제 source: `Dev/design/BDR-current/screens-gd/ConceptB.jsx` 의 React 로직 그대로

### 0-3. 결정 이력

| 일자 | 결정 | 결정자 | 근거 |
|---|---|---|---|
| 2026-05-20 | V2 (Hero-led) | 수빈 | 카드 종별 컬러 언어를 상세까지 일관 확장 / 시각 임팩트 ↑ |
| 2026-05-20 | Concept B (10인 슬롯 보드) | 수빈 | 모집 게임의 본질 = 자리 채우기 / 빈 슬롯 직접 CTA / 모바일 호환 ↑ |

→ 본 결정은 `Dev/design/claude-project-knowledge/01-user-design-decisions.md` 에 §9 추가하여 영구 보존 (CLI 작업자가 함께 갱신).

---

## 1. Phase 1 — BDR-current 동기화 (사용자 결정 무관, 즉시 진행 가능)

CLAUDE.md §🗂️ 워크플로우 5단계 따름.

### 1-1. 사전 점검

```bash
# subin 브랜치 확인
git status -sb
git remote -v   # github.com/bdr-tech/mybdr 확인
# Dev/design/ 현재 상태
ls "Dev/design/BDR-current/" | head -5
cat "Dev/design/BDR-current/README.md" | head -3
# 현재 BDR-current 는 v2.14 baseline (확인 완료)
```

→ PM 보고: "현재 BDR-current = v2.14. zip = v2.10 ~ v2.16 (v2.16 까지 포함). 동기화 진행해도 될까요?" 승인 후 진행.

### 1-2. zip → 임시 폴더 풀이

```bash
mkdir -p /tmp/bdr_v2_sync
cd /tmp/bdr_v2_sync
unzip -q "/path/to/uploads/BDR v2 (1).zip"
# 결과: Dev/design/BDR v2.{2..16}/ + screens/ + CLAUDE.md
```

### 1-3. 기존 BDR-current → _archive/BDR v2.14/ 이동

```bash
cd /path/to/mybdr
mv "Dev/design/BDR-current" "Dev/design/_archive/BDR v2.14"
git add -A "Dev/design/_archive/BDR v2.14"
```

### 1-4. v2.16 → BDR-current/ 카피 + 누락 자산 보강

v2.16 폴더는 **델타** (카드/상세/개설 + tokens.css + screens-gd/) 만 있고 v2.15 의 다른 화면이 누락됨. 따라서:

```bash
# Step 1: v2.15 base 복사
cp -r "/tmp/bdr_v2_sync/Dev/design/BDR v2.15" "Dev/design/BDR-current"

# Step 2: v2.16 델타로 덮어쓰기 — 카드 css/screens + 신규 파일
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/games.css" "Dev/design/BDR-current/games.css"  # 없으면 생성
cp -r "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/screens-gd" "Dev/design/BDR-current/"
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/tokens.css" "Dev/design/BDR-current/tokens.css"

# Step 3: v2.16 의 _create_game_explore.html / _game_detail_explore.html / _games_card_final.html 도 BDR-current 보존
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/_games_card_final.html" "Dev/design/BDR-current/"
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/_game_detail_explore.html" "Dev/design/BDR-current/"
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/_create_game_explore.html" "Dev/design/BDR-current/"
cp "/tmp/bdr_v2_sync/Dev/design/BDR v2.16/design-canvas.jsx" "Dev/design/BDR-current/"

# Step 4: zip 최상위 screens/ (Games/GameDetail/CreateGame/MyGames/Match/Live/Scrim/GameReport/GameResult) 도 BDR-current/screens/ 로 덮어쓰기 (이게 가장 최신)
cp /tmp/bdr_v2_sync/screens/*.jsx "Dev/design/BDR-current/screens/"
```

→ **주의**: zip 최상위 `screens/` 가 가장 최신 (v2.16 이후 추가 수정 포함 가능성). v2.16 폴더와 비교해서 더 큰 파일 = 최신으로 선택.

### 1-5. _archive/ 옛 버전 정리

```bash
# v2.10 ~ v2.15 폴더는 _archive 로 (이미 v2.14 = 이전 BDR-current 가 들어가 있으므로 추가)
for V in 2.10 2.11 2.12 2.13 2.15; do
  if [ -d "/tmp/bdr_v2_sync/Dev/design/BDR v$V" ]; then
    mv "/tmp/bdr_v2_sync/Dev/design/BDR v$V" "Dev/design/_archive/BDR v$V"
  fi
done

# v2.16 도 _archive 보존 (BDR-current 가 v2.15 base + v2.16 델타라서 원본 v2.16 폴더는 _archive 에 별도 보존)
mv "/tmp/bdr_v2_sync/Dev/design/BDR v2.16" "Dev/design/_archive/BDR v2.16"
```

### 1-6. README.md 갱신

`Dev/design/BDR-current/README.md` 첫 5줄 갱신:

```markdown
# BDR-current = v2.16 (v2.15 base + v2.16 경기 탭 갱신)

## 작업 요약 (2026-05-20)

v2.14 → v2.16 동기화. **경기 탭 list/detail/create 신규 시안 박제.**

- 카드(목록) ✅ — Date Tile + Area Chip 최종 (`_games_card_final.html`, `screens/Games.jsx`)
- 상세 🟡 — V1/V2 + ConceptA/B/C 결정 후 박제 (Phase 0 차단)
- 개설 ✅ — 단일 페이지 + 라이브 프리뷰 (`_create_game_explore.html`, `screens/CreateGame.jsx`)
- tokens.css — v2.15 라이트 토큰 (`--bdr-red`, `--bg-elev`, `--ink-soft/-dim`, `--cafe-blue`, `--kind/-deep`) 확장
```

### 1-7. claude-project-knowledge 갱신

`Dev/design/claude-project-knowledge/04-page-inventory.md` 갱신:

- §2 A등급 — `/games`, `/games/my-games`, `/games/[id]`, `/games/new` 등급 변경 (B → A 승격 예정 — Phase 2 박제 후)
- §5-B-1 `_v2` 폴더 목록 — 박제 후 갱신
- 신규 §3.5 추가: **"v2.16 경기 탭 신규 디자인 언어"** — 종별 컬러 (`--kind`), Date Tile, Area Chip, 호스트 아바타, Pretendard 900 사용

### 1-8. commit + push

```bash
git add Dev/design/
git commit -m "design: BDR-current sync v2.16 (경기 탭 list/detail/create 시안)"
git push origin subin
# PR: subin → dev
```

---

## 2. Phase 2 — 경기 카드(목록) 운영 박제 (사용자 결정 무관, §1 완료 후 진행 가능)

목록 카드만 결정 완료 (`_games_card_final.html` = 최종) → 운영 박제 진행.

### 2-1. 영향 받는 운영 파일

| 운영 경로 | 작업 |
|---|---|
| `src/app/(web)/games/page.tsx` | `_v2` 미적용 → `_v2/page.tsx` 신설 + `page.tsx` 가 _v2 import |
| `src/app/(web)/games/_v2/` | 신규 — 카드 패턴 박제 |
| `src/components/game-card/` (or 신설) | `<GameCard>` 컴포넌트 — Date Tile + Area Chip + Host Avatar + Progress |
| `src/app/globals.css` 또는 `tokens.css` | 신규 토큰 반영 (`--kind-*`, `--cafe-blue-*`) |

### 2-2. GameCard 컴포넌트 스펙 (시안 `_games_card_final.html` 코드 그대로)

```jsx
// src/components/game-card/GameCard.tsx
type GameCardProps = {
  kind: 'pickup' | 'guest' | 'scrim';  // 종별 — --kind 컬러 결정
  date: { md: string; day: string };   // "4/25", "(목)"
  time: { start: string; end: string }; // "20:30", "22:30"
  area: string;                         // "경기 하남시"
  isRecurring: boolean;                 // 정기 칩
  isFree: boolean;                      // 무료 칩
  title: string;                        // 2줄 clamp
  place: string;                        // "미사강변체육관"
  fee: number | 'free';                 // ₩5,000 또는 무료
  host: { avatar: string; name: string; isHost: boolean };
  filled: number;                       // 7
  total: number;                        // 10
  closingSoon?: boolean;                // 마감임박
  applyHref: string;
};
```

마크업 구조 (시안 라인 615 ~ 후반부 그대로):
```html
<article class="gcard kind-{pickup|guest|scrim}">
  <div class="gcard__main">
    <div class="dt">  <!-- Date Tile (좌측 세로) -->
      <div class="dt__kind">픽업</div>
      <div class="dt__date">...</div>
      <div class="dt__time">...</div>
    </div>
    <div class="gcard__content">
      <div class="gcard__row1">  <!-- Area Chip + 정기 등 칩 -->
        <span class="gcard__area-chip">...</span>
        <span class="gcard__chip">정기</span>
      </div>
      <h4 class="gcard__title">...</h4>
      <div class="gcard__meta">  <!-- 장소 + 회비 -->
        ...
      </div>
    </div>
  </div>
  <div class="gcard__foot">
    <div class="host">...</div>            <!-- 주최자 아바타 + 닉 -->
    <div class="gcard__progress">...</div>  <!-- 정원 progress -->
    <button class="btn-apply">신청</button>
  </div>
</article>
```

### 2-3. 토큰 통합

`_games_card_final.html` 의 `:root` (라인 ~25-60) 토큰을 `tokens.css` 에 통합:

```css
/* v2.16 신규 토큰 */
--kind-pickup: var(--bdr-red);
--kind-pickup-deep: var(--bdr-red-ink);
--kind-guest: #C66400;        /* 게스트 — 오렌지 */
--kind-guest-deep: #9D4F00;
--kind-scrim: #1CA05E;        /* 연습경기 — 그린 */
--kind-scrim-deep: #137A45;

/* 종별 카드 스코프 */
.gcard.kind-pickup { --kind: var(--kind-pickup); --kind-deep: var(--kind-pickup-deep); }
.gcard.kind-guest  { --kind: var(--kind-guest);  --kind-deep: var(--kind-guest-deep);  }
.gcard.kind-scrim  { --kind: var(--kind-scrim);  --kind-deep: var(--kind-scrim-deep);  }
```

### 2-4. 적용 라우트 (카드 컴포넌트 재사용)

`<GameCard>` 적용 대상:
1. `/games` (목록)
2. `/games/my-games` (내 경기 — 탭별로 카드 재사용)
3. `/guest-apps` (게스트 신청 모아보기)
4. `/profile/activity` 내 "다가오는 경기" 섹션 (있다면)
5. `/teams/[id]` 의 "팀 경기" 섹션 (있다면)
6. `/courts/[id]` 의 "이 코트 다른 경기" 섹션 (있다면)

→ 전부 한 번에 박제하지 말고 **§1 = 카드 컴포넌트 만들기 + /games 목록만**. 나머지는 별도 PR 분리.

### 2-5. 다크모드 검수

시안은 라이트 토큰 (`--bg: #F4F6FA`, `--ink: #1A1E27`). 운영은 다크모드 기본 (CLAUDE.md §디자인 핵심). 다크 변형 추가 필요:

```css
[data-theme="dark"] {
  --bg: #0E1116;
  --bg-elev: #14181F;
  --bg-card: #14181F;
  --bg-alt: #1A1F28;
  --bg-head: #1F2530;
  --ink: #E6E9EF;
  --ink-soft: #B9BFCB;
  --ink-mute: #8990A0;
  --ink-dim: #6C7382;
  --border: #2A323F;
  --border-strong: #3A4456;
}
```

(시안에 다크 토큰 명시 없음 → 위 값은 v2.6 base 다크 토큰에서 추정. 박제 시 사용자에게 확인.)

### 2-6. 회귀 검증 — `_v2` 박제 자체 검수 (06-self-checklist 적용)

- [ ] AppNav frozen 7 룰 위반 ❌
- [ ] 핑크/살몬/코랄 ❌ — `--bdr-red`, `--cafe-blue`, `--ok` 만 사용
- [ ] 라운딩 4px (`border-radius: 4px`) 또는 50% (정사각 원형) — 9999px pill ❌
- [ ] lucide-react ❌ — Material Symbols Outlined 만
- [ ] 720px 모바일 분기 / iOS input 16px / 버튼 44px 터치
- [ ] 시안 placeholder 5단어 이내 ("예: " ❌)
- [ ] BDR-current 시안 박제 (자체 신규 ❌)

### 2-7. commit 분리

```bash
# PR 1: 토큰 + 컴포넌트
git commit -m "design(games): GameCard 컴포넌트 + v2.16 토큰 (--kind-*, Date Tile, Area Chip)"

# PR 2: 목록 적용
git commit -m "design(games): /games 목록 v2.16 박제 (_v2 신설)"

# PR 3: my-games + guest-apps 적용
git commit -m "design(games): /games/my-games, /guest-apps 카드 통일"
```

---

## 3. Phase 3 — 경기 상세 + 개설 박제 (Phase 0 완료, 진행 가능)

### 3-1. 상세 페이지 박제 (V2 + Concept B — 결정 완료 §0-1, §0-2)

| 운영 경로 | 작업 |
|---|---|
| `src/app/(web)/games/[id]/page.tsx` | 기존 `_v2` 폴더 갱신 (이미 `_v2` 적용된 영역 — CLAUDE.md §5-B-1 명시) |
| `src/app/(web)/games/[id]/_v2/page.tsx` | **V2 (Hero-led)** 박제 |
| `src/app/(web)/games/[id]/_v2/_components/GameDetailHero.tsx` | 신규 — 풀폭 다크 hero band 컴포넌트 |
| `src/app/(web)/games/[id]/_v2/_components/ParticipantsSlotBoard.tsx` | 신규 — Concept B 10인 슬롯 보드 |
| `src/app/(web)/games/[id]/_v2/_components/ApplyRibbon.tsx` | 신규 — hero 아래 빠른 액션 ribbon (정원 progress + 신청 CTA + 호스트 미니) |
| `src/app/(web)/games/[id]/_v2/_components/MobileStickyBar.tsx` | 신규 — 모바일 하단 fixed bar |

**박제 source 위치** (BDR-current 동기화 후):

| 컴포넌트 | source |
|---|---|
| V2 Hero band (PC) | `Dev/design/BDR-current/_game_detail_explore.html` 라인 1928 ~ 2050 영역 (시안 V2 hero) |
| V2 본문 섹션 카드 | 동일 파일 라인 2050 ~ 1760 영역 (단일 칼럼 섹션) |
| V2 모바일 hero | 동일 파일 라인 1761 ~ 1920 (V1 mobile 영역 — V2 도 동일 적용) |
| Concept B 슬롯 보드 | `Dev/design/BDR-current/screens-gd/ConceptB.jsx` 전체 |
| 데이터 mock | `Dev/design/BDR-current/screens-gd/data.jsx` (GD_GAME / GD_APPLICANTS / GD_ME) |

**구조 요약** (CLI 가 박제 시 참고):

```
[다크 Hero Band]
  ├ row1: 종별 chip (픽업/게스트/연습) + 무료/실외/초보환영/정기 tags
  ├ title: Pretendard 900 큰 글씨
  └ meta-row: 일시 / 코트 / 정원 (수직 separator)

[Apply Ribbon (hero 바로 아래)]
  ├ 정원 progress bar (7/10)
  ├ 신청 CTA (마감임박 = accent gradient / 마감 = 회색 / 승인 = green)
  └ 호스트 미니카드 (아바타 + 닉네임 + "주최자")

[본문 단일 칼럼 섹션 카드]
  ├ 경기 안내 (description prose)
  ├ 코트 정보 + 지도 미리보기 (Kakao/Naver embed 자리)
  ├ 참가자 (Concept B 10인 슬롯 보드) ← 핵심
  ├ 댓글 (인라인)
  ├ 같은 코트 다른 경기 (GameCard 미니 가로 스크롤)
  └ 주최자 다른 모집 (GameCard 미니 가로 스크롤)

[모바일 하단 sticky bar]
  └ 정원 + 신청 버튼 (44px 터치)
```

**Concept B 슬롯 보드 props 스펙**:
```ts
type ParticipantsSlotBoardProps = {
  spotsTotal: number;  // 10 (기본) / 6 (3x3) 등 가변
  applicants: Array<{ id; nickname; level: '초급'|'중급'|'상급'; pos: 'PG'|'SG'|'SF'|'PF'|'C'; rating: number; avatar }>;
  meSlot?: number;     // 본인이 이미 신청한 슬롯 idx (있으면)
  onJoinSlot: (slotIdx: number) => void;  // 빈자리 클릭
  kind: 'pickup'|'guest'|'scrim';  // --kind-* 토큰 결정
};
```

### 3-2. 개설 페이지 박제

| 운영 경로 | 작업 |
|---|---|
| `src/app/(web)/games/new/page.tsx` | 기존 `_v2` 폴더 갱신 (이미 `_v2` 적용 — CLAUDE.md §5-B-1) |
| `src/app/(web)/games/new/_v2/` | `_create_game_explore.html` 박제 |

**핵심 패턴**:
- 좌 폼 7섹션 (1. 종류 / 2. 일시 / 3. 장소 / 4. 모집 / 5. 상세 / 6. 신청조건 / 7. 추가옵션)
- 우 sticky **라이브 프리뷰** (입력 즉시 GameCard 미리보기 갱신)
- 종별 선택 즉시 컬러 시스템 반영
- 정기 모집 → 요일 picker → 다음 4주 자동 예고
- 모바일 collapsible 미리보기 + 하단 fixed CTA
- 코트 picker = 별도 모달 (시안에서 분리 명시)

### 3-3. 영향 받는 후속 페이지 (v2.16 디자인 언어 확장)

상세/개설 박제 후 다음 페이지도 종별 컬러 + 호스트 아바타 + Pretendard 900 일관성 확보:

- `/games/[id]/edit` — 개설과 동일 폼 (단 수정 모드)
- `/games/[id]/guest-apply` — 게스트 신청 — 상단에 GameCard 미니 표시
- `/games/[id]/report` — 경기 결과 신고

→ 별도 PR 분리 (§3.1, §3.2 PR 머지 후).

---

## 4. 운영 → 시안 동기화 룰 적용 (CLAUDE.md §🔄)

§2 / §3 박제 commit 시 BDR-current/ 도 동기화:

- `BDR-current/screens/Games.jsx` ← 운영 `_v2` 박제 결과로 갱신
- `BDR-current/screens/GameDetail.jsx` ← V1 또는 V2 박제 결과로 갱신
- `BDR-current/screens/CreateGame.jsx` ← 박제 결과로 갱신
- `BDR-current/tokens.css` ← 다크 토큰 추가 결과로 갱신

commit message: `design(sync): 운영 games _v2 시안 박제` (CLAUDE.md §🔄 형식)

---

## 5. 검증 명령

박제 완료 후 stale 0 확인:

```bash
# BDR-current 마지막 commit
git log -1 --format="%ai" -- Dev/design/BDR-current/

# 운영 src/ UI commit
git log --since="<above-date>" --oneline -- "src/app/(web)/games/" | grep -iE "ui|design|card"

# 결과가 비어있어야 stale 0
```

---

## 6. 일정 추정

| Phase | 작업 | 추정 |
|---|---|---|
| §1 | BDR-current 동기화 | 30분 (자동화 가능) |
| §2 | 카드 컴포넌트 + /games 목록 | 4 ~ 6시간 |
| §3-1 | 상세 박제 | 6 ~ 10시간 (V1/V2 + Concept 선택) |
| §3-2 | 개설 박제 (라이브 프리뷰 포함) | 8 ~ 12시간 |
| §3-3 | edit / guest-apply / report 후속 | 4 ~ 6시간 |
| **합계** | | **22 ~ 35시간** (= 3 ~ 5일 작업) |

→ PR 단위로 쪼개서 매일 1 ~ 2 PR 머지 권장 (dev → main 머지는 원영/수빈 공동 승인).

---

## 7. 위험 / 차단 요인

| 항목 | 위험 | 완화 |
|---|---|---|
| Phase 0 결정 지연 | §3 전체 차단 | §1, §2 만 먼저 진행 (병렬) |
| API 응답 키 snake_case 누락 | 신규 필드 (kind / closingSoon 등) 시 sailent undefined | CLAUDE.md §보안 — curl 1회 raw 응답 확인 필수 (errors.md 2026-04-17) |
| Flutter 앱 API 변경 영향 | `/api/v1/games/*` 응답 변경 시 원영 사전 공지 필요 | 종별 분류 (kind) 가 신규 필드면 사전 공지 |
| 다크 토큰 누락 | 시안에 다크 변형 없음 | §2-5 사용자 확인 후 박제 |
| 운영 DB 영향 | schema 변경 0 (UI 박제만) | CLAUDE.md §DB 정책 무관 |

---

## 8. 산출물 체크리스트

CLI 작업 완료 시 다음 결과물 확보:

- [ ] §1 commit: `design: BDR-current sync v2.16 (경기 탭)`
- [ ] §1 PR 머지: subin → dev → main
- [ ] §2 PR 1: `design(games): GameCard + v2.16 토큰`
- [ ] §2 PR 2: `design(games): /games 목록 v2.16 박제`
- [ ] §2 PR 3: `design(games): /games/my-games, /guest-apps 카드 통일`
- [ ] §3-1 PR: `design(games): /games/[id] 상세 v2.16 박제 ({V1|V2}+{A|B|C})`
- [ ] §3-2 PR: `design(games): /games/new 단일 페이지 + 라이브 프리뷰`
- [ ] §3-3 PR: `design(games): /games/[id]/edit, /guest-apply, /report 후속 동기화`
- [ ] §4 동기화 commit: `design(sync): 운영 games _v2 시안 박제`
- [ ] §5 검증: `git log` stale 0 확인
- [ ] claude-project-knowledge/04-page-inventory.md 갱신 (B → A 등급 변경)

---

## 9. 첫 CLI 응답 표준 형식

CLI 클로드가 본 의뢰 받았을 때 첫 응답:

```
✅ BDR 경기 탭 v2.16 박제 의뢰 확인 — Phase 1 ~ Phase 3
이해: list/detail/create 박제. 카드 final / 상세 = V2 (Hero-led) + Concept B (10인 슬롯) / 개설 = 단일 페이지 + 라이브 프리뷰
사용자 결정 §1 ~ §8 보존 + §9 신규 (V2 + Concept B) / AppNav frozen — 03 카피
자체 검수: 06 §A,B,C,D 전체

[Phase 0 완료 — 차단 해제]
- §1 BDR-current 동기화 = 즉시 진행
- §2 카드 박제 = 즉시 진행
- §3 상세 (V2 + Concept B) + 개설 박제 = 즉시 진행

§1 → §2 → §3 순서로 PR 분리 진행. 매 PR 머지 후 dev 동기화 + 다음 PR.
```
