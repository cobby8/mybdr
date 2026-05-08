# 홈 5/9 부활분 디자인 시스템 정합 + 시안 구현 매핑 계획서

> 작성: 2026-05-09 (planner-architect)
> 대상: `RecommendedVideos` + `MySummaryHero` + `RecommendedGames` (5/9 부활 3종)
> 참조: `Dev/design/BDR-current/screens/Home.jsx` (RecommendedRail / VideoMiniCard / GameMiniCard / TourneyMiniCard / TeamMiniCard)
> 영향: API/DB/Flutter v1 = **0** (UI 시각 패턴 정렬만)

---

## §1. 배경 / 요구사항 / 정책

### 배경
- 5/9 부활 3 컴포넌트 (`c8d5f22` MySummaryHero+RecommendedGames / `858936e` RecommendedVideos) — 운영 page.tsx 에 들어감
- 각 컴포넌트가 **서로 다른 디자인 시스템 패턴** 위에 작성됨 → 시안 (BDR-current/screens/Home.jsx) 의 단일 통일 패턴 (RecommendedRail) 과 비교 시 일관성 0
- 시안 = "RecommendedRail 1개 + 카드 N개" 단일 형식으로 4 섹션 통일 (#1 곧 시작할 경기 / #2 열린 대회 / #2.5 추천 영상 / #3 주목할 팀)

### 요구사항
1. 운영 3 컴포넌트의 **헤더/카드/토큰** 패턴을 시안의 RecommendedRail 통일 패턴과 정합
2. **API/DB/Flutter v1 영향 0** 보장 (UI 변경만 / SWR 키, fetch 로직 보존)
3. 회귀 위험 0 우선 — 점진적 마이그 옵션 우선 추천

### 정책 (글로벌 CLAUDE.md 디자인 13 룰)
- §10 토큰 — `var(--*)` 100% / 핑크/살몬/코랄 ❌ / Material Symbols Outlined / pill 9999px ❌ (단 정사각형 원형은 50% OK)
- §C 카피 — 시안 우선 (사용자 결정 §6-1)
- §🔄 운영 → 시안 동기화 룰 (errors.md 5/7) — 운영 src/ UI 변경 시 BDR-current/ 같이 갱신

---

## §2. 차이 매트릭스 — 시안 vs 운영 6 영역

| # | 영역 | 시안 (BDR-current Home.jsx) | RecommendedVideos (운영) | MySummaryHero (운영) | RecommendedGames (운영) |
|---|------|----------------------------|--------------------------|----------------------|------------------------|
| 1 | **헤더 형식** | RecommendedRail 컴포넌트 (eyebrow + h3 + 우측 텍스트 버튼) | 자체 inline 헤더 (h2 + Link) | 헤더 없음 (카드 4장만) | TossSectionHeader (h3 + Link) |
| 2 | **eyebrow** | `"GAMES · 픽업 · 게스트"` 같은 영문 카테고리 + `.eyebrow` 클래스 | ❌ 없음 | ❌ 없음 | ❌ 없음 |
| 3 | **title 폰트** | `font-size:18 font-weight:800 letter-spacing:-0.01em` (h3) | `text-xl md:text-2xl font-black uppercase tracking-tighter` (h2 NBA 2K) | — | `text-xl md:text-2xl font-black uppercase tracking-tighter` (h3 토스) |
| 4 | **more 액션** | 단순 텍스트 button "전체 보기 →" (border:0 background:transparent) | "VIEW ALL »" Link 외부 (uppercase font-black) | — | "VIEW ALL >" Link (chevron 아이콘) |
| 5 | **카드 width × height** | `gridAutoColumns: minmax(260px, 1fr)` (inset=220px) / 카드 height 100% 고정 0 | `w-56` (224px) / aspect-video / h-full | `min-w-[240px]` / 자유 height | `w-[280px]` / `h-[112px]` 고정 (가로형) |
| 6 | **토큰 사용법** | `style={{}}` 직접 + `var(--*)` (Tailwind 0%) | Tailwind + `bg-[var(--TOKEN)]` 임의 클래스 혼용 | Tailwind + `style={{ color: "var(--*)" }}` 혼용 | Tailwind + `bg-[var(--TOKEN)]` 임의 클래스 혼용 |

### 핵심 차이 요약
- **#1 헤더 통일성**: 운영 3개가 각자 다른 헤더 형식 → 시안 1개 RecommendedRail 통일 ↔ 운영 (자체 헤더 / 헤더 없음 / TossSectionHeader 3종)
- **#2 eyebrow 부재**: 운영 3개 모두 영문 카테고리 라벨 0 → 시안의 정보 계층 (작은 영문 라벨 → 큰 한글 제목) 미구현
- **#5 카드 width 분산**: 224px / 240px / 280px 3종 → 시안은 1개 (260/220px)
- **#6 토큰 직접 사용 vs Tailwind 임의**: 시안은 `style={{}}` 직접 / 운영은 `bg-[var(--bg-card)]` Tailwind JIT — 동일 효과지만 일관성 차이

---

## §3. RecommendedRail 통일 컴포넌트 설계

### 3.1 위치
- `src/components/bdr-v2/recommended-rail.tsx` (신규 ~80L)
  - 사유: bdr-v2 = "디자인 시안 직접 카피 컴포넌트" 도메인 (CardPanel, BoardRow, HotPostRow 등 동거). home/ 은 도메인별 (heading 자체가 home 한정 X — 추후 다른 페이지 재사용 가능)

### 3.2 props 시그니처
```tsx
interface RecommendedRailProps {
  /** 큰 한글 제목 (예: "곧 시작할 경기") */
  title: string;
  /** 영문 카테고리 라벨 (예: "GAMES · 픽업 · 게스트") — 빨간 줄 + 영문 (var(--accent)) */
  eyebrow?: string;
  /** "전체 보기 →" 버튼 클릭 시 이동할 URL — 생략 시 미노출 */
  moreHref?: string;
  /** "전체 보기 →" 라벨 커스터마이즈 (기본 "전체 보기 →") */
  moreLabel?: string;
  /** 카드들 (가로 스크롤) */
  children: React.ReactNode;
  /** true 면 사이드바 내부용 (260px → 220px 카드 width) */
  inset?: boolean;
}
```

### 3.3 JSX 구조 (시안 line 405~440 카피 / Tailwind X / `style={{}}` 직접)
```tsx
<section style={{ marginTop: inset ? 0 : 28 }}>
  {/* 헤더: eyebrow + h3 + 우측 "전체 보기 →" Link */}
  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12, gap: 12 }}>
    <div style={{ minWidth: 0 }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 2 }}>{eyebrow}</div>}
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {title}
      </h3>
    </div>
    {moreHref && (
      <Link href={moreHref} style={{ background: 'transparent', border: 0, fontSize: 12, color: 'var(--ink-mute)', whiteSpace: 'nowrap', flex: '0 0 auto' }}>
        {moreLabel ?? '전체 보기 →'}
      </Link>
    )}
  </div>
  {/* 본문: 가로 스크롤 grid */}
  <div style={{
    display: 'grid', gridAutoFlow: 'column',
    gridAutoColumns: inset ? 'minmax(220px, 1fr)' : 'minmax(260px, 1fr)',
    gap: 12, overflowX: 'auto', scrollSnapType: 'x mandatory', paddingBottom: 6,
  }}>
    {React.Children.toArray(children).map((c, i) => (
      <div key={i} style={{ scrollSnapAlign: 'start', minWidth: 0 }}>{c}</div>
    ))}
  </div>
</section>
```

### 3.4 시안 → 운영 차이 (구현 시 주의)
- `more={() => setRoute('games')}` (시안 함수) → `moreHref="/games"` (운영 Next Link) 변환
- `.eyebrow` 클래스 = globals.css 에 정의됨 (시안 baseline 일치, 직접 카피 OK)
- `var(--ink-mute)` / `var(--accent)` 시안 토큰 = 운영 globals.css alias 정의 ✅ (5/9 PlayerProfile 박제 reviewer 검증)

---

## §4. 카드 컴포넌트 통일 매핑

### 4.1 시안 → 운영 매핑 표

| 시안 카드 | 운영 대응 | 권장 처리 |
|---------|---------|---------|
| `GameMiniCard` (시안 line 445) | RecommendedGames 의 `GameCard` (운영 280×112 가로형) | **시안 형식 카피** (260×자유 height 세로형 / 색상바 + 진행도 progress bar) — 운영 컴포넌트 재작성 |
| `TourneyMiniCard` (시안 line 495) | (현재 운영에 부재 — 5/9 부활 외) | 본 작업 범위 외 (RecommendedTournaments 컴포넌트 미존재) |
| `VideoMiniCard` (시안 line 533) | RecommendedVideos 의 인라인 카드 (운영 224×aspect-video 세로형) | **운영 카드 보존** (시안과 시각 거의 동일 — LIVE 뱃지 + 듀레이션 뱃지 + uppercase 제목 전부 일치) — 헤더만 RecommendedRail 로 교체 |
| `TeamMiniCard` (시안 line 616) | (운영에 부재) | 본 작업 범위 외 |

### 4.2 MySummaryHero 의 4 카드
- 시안 = `MySummaryHero` 함수 line 310 (별도 컴포넌트 — RecommendedRail 사용 안 함)
- 운영 = 헤더 없는 4 카드 가로 스크롤 (이미 시안과 거의 동일)
- 결론: **MySummaryHero 는 RecommendedRail 적용 대상 아님** — 시안도 별도 형식. 운영 보존 OK

### 4.3 추출 가능한 글로벌 카드 컴포넌트 (선택사항)
| 신규 컴포넌트 | 위치 | 설명 |
|------------|------|------|
| `GameMiniCard` | `src/components/bdr-v2/game-mini-card.tsx` | 시안 line 445~490 카피. 색상바(상단 3px) + 제목 2줄 clamp + 일정 + 진행도 progress bar (applied/spots %). props: `game: { id, kind, title, area, date, time, court, applied, spots, status }` |
| `VideoMiniCard` | `src/components/bdr-v2/video-mini-card.tsx` | 시안 line 533~610 카피 또는 운영 RecommendedVideos 카드 추출. props: `video: { videoId, title, thumbnail, isLive, duration?, views?, date }` |

→ **후속 작업 추천**: 본 PR 에서는 RecommendedRail 만 추출, 카드 추출은 후속 PR (회귀 위험 분리)

---

## §5. 옵션 A/B/C 비교

| 항목 | A. 시안 100% (전면 재작성) | B. 헤더만 통일 (wrapper) ⭐ 권장 | C. 시안 컴포넌트 직접 도입 |
|------|------------------------|------------------------------|----------------------|
| 작업 범위 | RecommendedRail 신규 + 3 컴포넌트 카드 모두 시안 형식으로 재작성 | RecommendedRail wrapper 신규 + 3 컴포넌트 헤더만 교체 | 시안 Home.jsx 4 섹션을 운영 page.tsx 로 직접 이식 (mock → SWR 변환) |
| 코드 변경량 | RecommendedRail 80L + 3 컴포넌트 ~150L 재작성 = ~230L | RecommendedRail 80L + 3 컴포넌트 헤더 영역 ~30L 교체 = ~110L | 시안 4 섹션 mock 데이터 제거 + SWR 연결 = ~250L |
| 시간 | 약 2~3시간 | 약 45~60분 | 약 3~4시간 |
| 시안 일치도 | 95%+ (카드 width 통일 + 진행도 바 + uppercase 패턴 통일) | 80% (헤더 통일 / 카드는 운영 보존 — width 224/280 분산 잔존) | 99% (시안 그대로 / 단 운영 SWR 패턴 재구현 부담) |
| 회귀 위험 | 중 (3 컴포넌트 카드 width 변경 → 모바일 720px 분기 영향 / 사용자 피드백 가능) | 저 (헤더만 변경 / 카드 width 보존 / 모바일 영향 0) | 고 (4 섹션 일괄 재작성 → SWR 키 / fallback / 데이터 매핑 모두 재검증 필요) |
| API/DB 영향 | 0 | 0 | 0 |
| Flutter v1 | 0 | 0 | 0 |
| RecommendedVideos NBA 2K 스타일 | "WATCH NOW" 폐기 → eyebrow="WATCH NOW · YOUTUBE" 변환 (시안 §A) | "WATCH NOW" 폐기 → eyebrow 변환 (동일) | 시안 그대로 (동일) |
| MySummaryHero EmptyCard | 그대로 보존 (RecommendedRail 미적용) | 그대로 보존 (RecommendedRail 미적용 — 시안과 동일 별도 형식) | 시안 MySummaryHero 직접 카피 |

### 옵션 추천: **B (헤더만 통일)**
- 사유 1: 회귀 위험 최저 (카드 width 보존 → 모바일 영향 0)
- 사유 2: 시간 60분 → 5/9 같은 날 PR 가능
- 사유 3: 시안 일치도 80% → 후속 PR 로 카드 통일 점진 가능

---

## §6. 마이그 단계 (P0/P1/P2 — 옵션 B 기준)

### P0 (45~60분 / 본 PR)
1. **신규**: `src/components/bdr-v2/recommended-rail.tsx` (80L)
   - RecommendedRail 컴포넌트 (시안 line 405~440 카피)
2. **수정**: `src/components/home/recommended-videos.tsx`
   - 자체 inline 헤더 제거 (line 86~101 — `<div className="flex items-end ...">` 12줄)
   - RecommendedRail wrapper 적용 → `<RecommendedRail title="BDR 추천 영상" eyebrow="WATCH NOW · YOUTUBE" moreHref="https://www.youtube.com/@BDRBASKET">`
   - 카드 영역 (line 105~198) 그대로 보존
   - **주의**: `moreHref` 외부 URL 처리 (Next Link `target=_blank` 처리 필요 — RecommendedRail props 에 `target?: string` 추가 검토)
3. **수정**: `src/components/home/recommended-games.tsx`
   - TossSectionHeader 제거 (line 137)
   - RecommendedRail wrapper 적용 → `<RecommendedRail title={title} eyebrow="GAMES · 픽업 · 게스트" moreHref="/games">`
   - GameCard (운영 280×112) 보존
4. **MySummaryHero 무수정** — 시안에서도 별도 형식 (RecommendedRail 미사용)
5. **수정**: `Dev/design/BDR-current/screens/Home.jsx` — 운영 → 시안 역박제 룰 (errors.md 5/7) — 시안 RecommendedRail #1, #2 의 eyebrow 값을 운영과 동기화 (이미 일치)

### P1 (후속 / 다음 주 / 옵션)
- 카드 width 통일 (260px) — RecommendedVideos 224 → 260, RecommendedGames 280 → 260
- VideoMiniCard / GameMiniCard 글로벌 컴포넌트 추출 (`src/components/bdr-v2/`)
- Tailwind 임의 클래스 (`bg-[var(--TOKEN)]`) → CSS 변수 직접 (`style={{}}`) 마이그

### P2 (인프라 / 보류)
- 시안 GameMiniCard 의 progress bar (applied/spots %) → 운영 GameCard 통합 (현재 운영 spots_left 만 표시)
- 시안 TourneyMiniCard 도입 (RecommendedTournaments 컴포넌트 신규 — 현재 운영에 부재)

---

## §7. 회귀 평가

### 7.1 영향 0 영역
- **API 응답 키 / endpoint**: 변경 0 (헤더 wrapper 만 교체)
- **DB schema**: 변경 0
- **Flutter v1 (`/api/v1/*`)**: 변경 0
- **SWR 키 / fetcher**: 변경 0 (`/api/web/youtube/recommend` / `/api/web/profile` / `/api/web/profile/stats` / `/api/web/recommended-games` 모두 보존)
- **fallback 데이터**: DUMMY_VIDEOS / FALLBACK_GAMES 모두 보존

### 7.2 사용자 영향 (UI 변경)
- **헤더 시각 변경**:
  - RecommendedVideos: `"WATCH NOW"` (font-black uppercase NBA 2K) → `"BDR 추천 영상"` (h3 한글 + eyebrow `"WATCH NOW · YOUTUBE"`) — **NBA 2K 톤 약화**
  - RecommendedGames: `"추천 경기"` (TossSectionHeader 토스 굵은 한글) → `"추천 경기"` (h3 한글 + eyebrow `"GAMES · 픽업 · 게스트"`) — 톤 차분화
- **레이아웃 변경**: 헤더 높이 ~5px 감소 (시안 h3 18px vs 운영 h2 24px) — 카드 영역 5px 위로 올라감 (모바일 영향 0)
- **사용자 결정 §C 카피 정책 충돌**: 글로벌 CLAUDE.md §11 "시안 우선" → 본 변경은 시안 정합 방향 → 충돌 0

### 7.3 모바일 720px 분기
- RecommendedVideos / RecommendedGames 카드 width 변경 X (옵션 B) → 모바일 영향 0
- RecommendedRail 자체 시안 line 187 `@media (max-width: 720px) .home h1 { font-size: 22px !important; }` 는 h1 한정 → h3 영향 0

---

## §8. 토큰 정합 점검

### 8.1 시안 토큰 (RecommendedRail / 카드)
- `var(--ink)` / `var(--ink-mute)` / `var(--ink-dim)` / `var(--ink-soft)` — 텍스트 4단계
- `var(--accent)` / `var(--ok)` / `var(--cafe-blue)` — 강조 색상
- `var(--border)` / `var(--bg-card)` / `var(--bg-elev)` / `var(--bg-alt)` — 배경
- `var(--ff-mono)` — 모노스페이스 (스코어/숫자)
- `.eyebrow` / `.card` / `.badge` / `.btn` — 클래스

### 8.2 운영 토큰 (현재)
- `var(--accent)` / `var(--bg-card)` / `var(--bg-elev)` / `var(--ink)` / `var(--ink-mute)` / `var(--border)` — 모두 globals.css alias 정의 ✅
- Tailwind 임의 클래스 (`bg-[var(--bg-card)]` / `border-[var(--accent)]`) — 같은 토큰 직접 참조 / 시각 동일

### 8.3 정합 결론
- **토큰 호환 ✅** (시안과 운영 globals.css 모두 동일 토큰 정의)
- Tailwind JIT 임의 클래스 vs `style={{}}` 직접 = 시각 결과 100% 동일 (단지 코드 패턴 차이)
- **마이그 강제 X** — 본 PR 은 새로 만드는 RecommendedRail 만 시안 패턴 (`style={{}}`) 적용, 기존 운영 컴포넌트의 Tailwind JIT 보존

---

## §9. 추정 시간 + 사용자 결재 항목

### 9.1 시간 추정 (옵션 B)
| 단계 | 작업 | 시간 |
|------|------|------|
| 1 | RecommendedRail 신규 작성 (시안 카피) | 15분 |
| 2 | RecommendedVideos 헤더 교체 | 10분 |
| 3 | RecommendedGames 헤더 교체 | 10분 |
| 4 | tester (tsc + 모바일 720px 분기 + RecommendedRail 4 case) + reviewer 병렬 | 15분 |
| 5 | PM 커밋 + 진행 현황 갱신 | 5분 |
| **합계** | | **약 55분** |

### 9.2 사용자 결재 항목 (Q1~Q7)

**Q1. 옵션 선택 — A/B/C 중 어떤 것?**
- A: 시안 100% (3 컴포넌트 카드 모두 재작성 / ~3시간 / 시안 일치 95%)
- **B (권장)**: 헤더만 통일 (~55분 / 시안 일치 80% / 회귀 0)
- C: 시안 컴포넌트 직접 도입 (~3시간 / 시안 일치 99% / 회귀 위험 고)

**Q2. RecommendedRail 컴포넌트 위치 — `src/components/bdr-v2/` vs `src/components/home/`?**
- **A (권장)**: `src/components/bdr-v2/` — bdr-v2 는 시안 카피 컴포넌트 도메인 (CardPanel/BoardRow/HotPostRow 동거). 다른 페이지 재사용 가능
- B: `src/components/home/` — 현재 부활 3 컴포넌트 위치 일관성

**Q3. NBA 2K 스타일 ("WATCH NOW" 굵은 헤더) 보존 vs RecommendedRail 통일?**
- **A (권장)**: RecommendedRail 통일 — eyebrow=`"WATCH NOW · YOUTUBE"` 로 NBA 톤 일부 보존
- B: NBA 2K 스타일 보존 — RecommendedVideos 만 헤더 교체 제외

**Q4. EmptyCard CTA (MySummaryHero) 보존 vs 카드 스타일 시안 정합?**
- **A (권장)**: 보존 — MySummaryHero 는 시안에서도 별도 형식 (RecommendedRail 미사용)
- B: 시안 MySummaryHero 함수 직접 카피 (line 310)

**Q5. Tailwind 임의 클래스 (`bg-[var(--TOKEN)]`) → CSS 변수 직접 (`style={{}}`) 마이그?**
- **A (권장)**: 점진 — 신규 RecommendedRail 만 `style={{}}`, 운영 카드 그대로 Tailwind JIT 유지
- B: 강제 — 3 컴포넌트 모두 시안 형식 통일 (옵션 A 와 사실상 동일)

**Q6. 시안 GameMiniCard / VideoMiniCard 운영 컴포넌트 추출?**
- **A (권장)**: 후속 PR — 본 PR 은 헤더만, 카드 추출은 P1 단계
- B: 즉시 추출 — `src/components/bdr-v2/game-mini-card.tsx` + `video-mini-card.tsx` 신규

**Q7. P0 마이그 시점?**
- A: 즉시 (5/9 오늘) — 5/9 부활 PR 과 같은 날 통합
- **B (권장)**: 5/10 후 / 다음 주 — 5/9 부활 검증 후 후속 PR
- C: 다른 우선 작업 (PortOne 활성화) 후

---

## §10. 추가 고려사항

### 10.1 RecommendedRail `moreHref` 외부 URL 처리
- RecommendedVideos 의 "VIEW ALL »" → `https://www.youtube.com/@BDRBASKET` (외부)
- Next.js `<Link>` 는 외부 URL 자동 감지 → `target="_blank" rel="noopener noreferrer"` 추가 필요
- props 에 `moreTarget?: '_blank' | '_self'` 추가 검토 (권장)

### 10.2 RecommendedRail 자체 SSR 호환성
- `React.Children.toArray(children)` — server component 에서도 동작 ✅
- `Link` 컴포넌트 — server component OK ✅
- 결론: RecommendedRail = server component (use client 불필요)

### 10.3 시안 박제 (운영 → 시안 역박제 룰 / errors.md 5/7)
- 본 PR 변경 = 운영 헤더 형식 변경 → 시안과 정합
- BDR-current/screens/Home.jsx 의 RecommendedRail 호출부 (line 96, 109, 124, 157) 변경 X (이미 시안 = 진실의 원천)
- → **역박제 불필요** (시안 → 운영 한쪽 방향만 정합)

---

## §11. 한 줄 요약

운영 5/9 부활 3 컴포넌트의 헤더를 시안 RecommendedRail 통일 형식으로 정합 → **옵션 B (헤더만 통일)** 권장 / 신규 컴포넌트 1개 (`recommended-rail.tsx` 80L) + 수정 2 컴포넌트 (RecommendedVideos / RecommendedGames 헤더 교체) / 약 55분 / 회귀 0 / 사용자 결재 Q1~Q7.
