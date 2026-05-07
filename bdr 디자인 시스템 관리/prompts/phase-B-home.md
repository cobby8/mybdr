# Phase B — 홈 페이지 시안 갱신 (사용자 첫 진입)

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.

---

## 🎯 본 Phase 의 클로드 디자인 작업 범위

**클로드 디자인이 직접 수정 가능한 파일**:
- `BDR-current/screens/Home.jsx` — 홈 시안
- `BDR-current/components.jsx` — 홈에서 쓰는 카드 컴포넌트 (HeroBento / RecommendedCard 등)
- `BDR-current/tokens.css` — 카드 / hero 토큰 보완 (Phase A 에서 미커버 잔여)

**클로드 디자인 범위 외 (PM 이 Cowork 와 별도 진행)**:
- `src/components/home/*` (14 파일) 토큰 마이그레이션
- `src/app/(web)/page.tsx` (홈 라우트)

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase B: 홈 페이지 시안 (P0, 사용자 첫 진입)

배경:
- Phase A 완료 (시스템 베이스라인 동기화 + 헤더 진입점) 후 진입.
- 홈 = 사용자 첫 진입 화면 = 첫인상.
- audit-2026-05-07.md 결과: 운영 src/components/home/* 14 파일에 145 폐기 토큰 잔존 — 본 시안 갱신 후 PM 이 Cowork 와 함께 운영 적용.
- 본 시안 작업의 목적: 운영 마이그레이션의 시각 가이드 + 카드/hero 패턴 표준화.

본 Phase 작업 (시안 영역만):

1. screens/Home.jsx 시안 갱신:
   * 헤로 (Hero) — 라이트 = 다음카페 친근한 톤 / 다크 = brutalism 큰 헤딩 (var(--fs-hero) 활용)
   * 본인 요약 카드 (my-summary-hero) — Tier 1 큰 카드 (마이페이지 hub 패턴 따름, 04 §2 A등급)
   * 추천 영역 4 종 — 경기 / 대회 / 비디오 / 팀 (recommended-* 운영 컴포넌트 시각 가이드)
   * 뉴스 피드 (news-feed) — 카드 리스트
   * 최근 활동 (recent-activity) — 12주 막대
   * 사이드바 (right-sidebar-logged-in) — 데스크톱 only (모바일 stack)
   * 듀얼 테마: 라이트 카드 라운딩 10px / 다크 카드 라운딩 0px brutalism

2. components.jsx — 홈에서 쓰는 카드 패턴 표준화:
   * HeroBento, NotableTeams, RecommendedGames, RecommendedTournaments, RecommendedVideos, NewsFeed, RecentActivity, ProfileWidget, MySummaryHero 등 시안 컴포넌트
   * Hero 헤더 grid 1fr auto 패턴 적용 (02 §10-5)
   * NavBadge LIVE / NEW 변형 활용 (02 §10-1) — 추천 경기 LIVE / 추천 대회 NEW
   * 카드 라운딩 듀얼 (var(--radius-card))

3. tokens.css 보완 (Phase A 에서 미커버):
   * 홈 hero / 카드 패턴에서 사용하는 토큰 — 02 §1 §4 §5 와 일치 검증
   * 빈 hero 그림자, 카드 그림자 = var(--sh-md) 또는 var(--sh-lg)

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase A 에서 갱신된 utility 로고 이미지 + 햄버거 NavBadge 그대로 카피 (재구성 X)
- 토큰: 02 §1 신 토큰만 / Phase A 에서 추가된 신규 토큰 16종 활용 (--bg-head, --sh-md, --fs-h1 등)
- 듀얼 테마: 02 §0 — 라이트 카드 10px soft shadow / 다크 카드 0px hard offset shadow
- 카피: 01 §6 보존 — "서울 3x3 농구 커뮤니티" 카피 ✅ / About 운영진 실명 박제 ❌
- 모바일: 720px 분기 / 인라인 grid auto-fit minmax / 가로 overflow 차단 (max-width: 100vw)
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

신규 컴포넌트 표준 활용 (02 §10):
- §10-1 NavBadge — 추천 경기 LIVE 펄스 / 추천 대회 NEW
- §10-5 Hero 헤더 grid 1fr auto — Hero 좌측 (1fr 가변) / 우측 액션 (auto)
- §10-6 fade chevron 칩바 — 카테고리/지역 필터에 활용 가능

자체 검수 (Phase B 시안 완료 시 모두 통과):
□ Home.jsx 시안 갱신 ✅
□ 홈 카드 컴포넌트 표준화 (components.jsx) ✅
□ 라이트 / 다크 둘 다 시각 검증 (라이트 = 친근 다음카페 / 다크 = brutalism)
□ 모바일 366px 가로 overflow 0
□ AppNav 7 frozen + Phase 19 6 룰 = 13 룰 영향 0 (헤더 변경 X)
□ NavBadge LIVE / NEW 활용 ✅
□ var(--*) 토큰만 / hex 직접 X / deprecated --color-* X
□ 06-self-checklist.md §1~§5 모두 ✅

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (Home.jsx + components.jsx 의 홈 관련 컴포넌트 + tokens.css 보완)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / 홈 정상 노출 (라이트/다크/모바일 모두)
- 변경 요약 보고:
  * Home.jsx: 시안 갱신 영역 (hero / 카드 그룹 / 사이드바)
  * components.jsx: 신규 / 갱신된 카드 컴포넌트 목록
  * tokens.css: 보완된 토큰 (있으면)

후속 (PM 이 Cowork 와 진행 — Claude 디자인 작업 외):
- src/components/home/* 14 파일 토큰 마이그레이션 (02 §9 매핑 표)
- 핫스팟: my-summary-hero (32) / profile-widget (21) / news-feed (16) / recommended-videos (13)
- src/app/(web)/page.tsx 홈 라우트 검증

질문 / 가정 (작업 시작 전 PM 결정 필요 시):
1. my-summary-hero 시안 — 시즌 스탯 4 KPI (PPG/RPG/APG/+/-) 카드 그리드 vs 단일 시각화?
2. recommended-videos — YouTube 임베드 패턴 vs sticker 카드 (운영은 임베드)?
3. 모바일 hero — edge-to-edge 풀블리드 (마이페이지 hub 패턴) 적용?

작업 시작.
```

---

## 📚 참조

- `claude-project-knowledge/02-design-system-tokens.md` §0 듀얼 테마 / §1 §4 §5 토큰 / §10 신규 컴포넌트
- `claude-project-knowledge/04-page-inventory.md` §2 A등급 (`/` = 홈) §3 B등급 (홈 hero 카로셀 보강)
- `claude-project-knowledge/06-self-checklist.md` 자체 검수
- `BDR-current/screens/Home.jsx` (현재 시안)
- `BDR-current/components.jsx` (Phase A 에서 utility 로고 이미지 + NavBadge 추가됨)

## 🛠 PM 후속 작업 (Cowork 와 함께)

```
"Phase B 클로드 디자인 시안 완료. src/ 마이그레이션 진행해줘:
- src/components/home/* 14 파일 토큰 매핑 (02 §9)
- src/app/(web)/page.tsx 홈 라우트 검증
- 핫스팟 우선: my-summary-hero (32 위반), profile-widget (21), news-feed (16)
검증: grep 'var(--color-' src/components/home/ → 0"
```
