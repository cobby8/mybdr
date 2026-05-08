# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/9 신규 — planner-architect / 홈 시안 100% 본격 적용]** **홈 시안 12 섹션 vs 운영 7 섹션 — 갭 7 영역 본격 마이그 계획서 (3 Phase / 5 PR)**
- 산출: `Dev/home-design-full-alignment-2026-05-09.md` (13 섹션 / Q1~Q10 결재 / 11~15h 합계)
- 핵심: 5/9 옵션 B (RecommendedRail 헤더 통일) + StatsStrip 최하단 매핑 후 갭 잔존 7건 (A Header / B HeroBento / C 열린 대회 빅 배너 / D NoticeCard 분리 / E 주목할 팀 / F 사이드바 / G 카드 시안 정합)
- 신규 컴포넌트 10개 (~750L) + 신규 prefetch 7개 + 신규 API 1건 (`/api/web/organizations`)
- Phase 1 P0 (3~4h): HomeHeader + NoticeCard 분리 + 열린 대회 RecommendedRail (시안 정합 50% → 70%)
- Phase 2 P1 (3~4h): 주목할 팀 + HeroCarousel 시각 정합 (70% → 85%)
- Phase 3 P2 (5~7h): 사이드바 + 카드 시안 정합 + 신규 API (85% → 100%)
- 결재 Q1~Q10 권장: A(HeroCarousel 유지+시각만) / A(사이드바 도입) / A(NoticeCard Phase 1) / A(G-2 신규 카드만) / A(NotableOrgs API) / A(시안 ProfileWidget) / B(5/10 후) / A(5 PR) / A(Phase 3 카드 추출) / A(StatsStrip 폐기)
- 다음: 사용자 Q1~Q10 결재 → Phase 1 상세 설계서 작성 → developer 진행

---

## 📊 진행 현황

| 영역 | 상태 | 비고 |
|------|------|------|
| 5/9 옵션 B | ✅ 머지 (`ce0102e`) | RecommendedRail 통일 헤더 + 헤더 교체 (RecommendedVideos/Games) |
| 5/9 P0 부활 | ✅ 머지 (`c8d5f22`) | MySummaryHero + RecommendedGames + RecommendedVideos |
| 5/9 StatsStrip | ✅ 머지 (`946b8b8`) | 최하단 이동 (시안 CommunityPulse 매핑) |
| 5/9 NBA 프로필 Phase 2 | ✅ 머지 (`ee0cc25`) | 활동 로그 5종 + 통산 더보기 모달 |
| 홈 시안 100% Phase 1 | 🟡 진행 중 | A(HomeHeader) ✅ / B·C 남음 (NoticeCard 분리 / 열린 대회 RecommendedRail) |
| 홈 시안 100% Phase 2~3 | ⏸ Phase 1 후 | 추정 8~11h / 시안 70% → 100% |
| PortOne 활성화 | ⏸ 외부 작업 | 사용자 콘솔 + Vercel env 추가 |
| PhoneInput 마이그 4순위 | ✅ 완료 (`a9f2e0f`) | admin+referee 100% |

---

## 📋 작업 로그 (최근 10건)

| 날짜 | 작업 | 결과 |
|------|------|------|
| 5/9 | Phase 1 A — HomeHeader 추가 / 신규 151L / page.tsx import + 배치 (HeroCarousel 위) / 모바일 4 분기점 가드 (720/360px) / search·games/new 운영 라우트 확인 / tsc 0 / 회귀 0 | ✅ 미푸시 |
| 5/9 | planner-architect — 홈 시안 100% 본격 적용 계획서 (13 섹션 / Q1~Q10 / 3 Phase / 5 PR / 11~15h) | ✅ 결재 대기 (`Dev/home-design-full-alignment-2026-05-09.md`) |
| 5/9 | StatsStrip 최하단 이동 (시안 CommunityPulse 매핑) | ✅ `946b8b8` |
| 5/9 | 옵션 B — RecommendedRail 통일 + 헤더 교체 (RecommendedVideos/Games) | ✅ `ce0102e` |
| 5/9 | P0 부활 — MySummaryHero + RecommendedGames | ✅ `c8d5f22` |
| 5/9 | 공개프로필 Phase 2 활동 로그 + 통산 더보기 모달 + 경기참가 0 fix | ✅ `ee0cc25` |
| 5/9 | NBA 프로필 — 통산 8열 + PlayerMatchCard + Hero jersey | ✅ `a005430` |
| 5/9 | 추천 영상 헤더 "HIGHLIGHTS" → "WATCH NOW" | ✅ `d6bdf1a` |
| 5/9 | 추천 유튜브 섹션 부활 + 시안 역박제 | ✅ `858936e` |
| 5/9 | PhoneInput/BirthDateInput 4순위 (admin+referee) 마이그 100% | ✅ `a9f2e0f` |

---

## 🎯 다음 세션 진입점

### 🚨 0순위 — PortOne 본인인증 운영 활성화 (사용자 외부 작업)
- PortOne 콘솔: 본인인증 채널 발급 (PASS / SMS / KCP)
- Vercel env: `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY=channel-key-xxx` 추가 → 재배포
- 활성화 직후 자동 전환: PR3 가드 활성 / mock 폴백 503 자동 / 코드 변경 0
- 롤백 1초: 환경변수 제거

### 🚀 1순위 — 홈 시안 100% Phase 1 결재 (본 작업)
- `Dev/home-design-full-alignment-2026-05-09.md` Q1~Q10 결재
- Phase 1 P0 (3~4h): HomeHeader + NoticeCard 분리 + 열린 대회 RecommendedRail
- 결재 후 → planner-architect 상세 설계서 작성 → developer 진행

### 🚀 2순위 — 사전 라인업 확정 + 기록앱 자동 매핑
- `Dev/match-lineup-confirmation-2026-05-09.md` Q1~Q9 결재 대기 (~8.5h / 8 PR)

### 🚀 3순위 — PortOne 활성화 후 검증
- 미인증 계정 → /games/[id] /teams/[id] /tournaments/[id]/join → /onboarding/identity redirect

### 🚀 4순위 — 홈 시안 100% Phase 2~3
- Phase 2 P1 (3~4h): 주목할 팀 + HeroCarousel 시각 정합
- Phase 3 P2 (5~7h): 사이드바 + 신규 API + 카드 시안 정합

---

## 🔒 미푸시 커밋

- 현재 미푸시 커밋: 0건 (subin 브랜치 / 작업 시작 전 clean 상태)
