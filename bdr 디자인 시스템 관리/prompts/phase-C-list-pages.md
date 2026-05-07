# Phase C — 메인 9개 탭 목록 페이지 시안 갱신

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.

---

## 🎯 본 Phase 의 클로드 디자인 작업 범위

**클로드 디자인이 직접 수정 가능한 파일**:
- `BDR-current/screens/Games.jsx` — 경기 목록
- `BDR-current/screens/Team.jsx` — 팀 목록
- `BDR-current/screens/Match.jsx` — 대회 목록
- `BDR-current/screens/Court.jsx` — 코트 목록
- `BDR-current/screens/BoardList.jsx` — 커뮤니티 목록
- `BDR-current/components.jsx` — 필터 / 카드 / 페이지네이션 공유 컴포넌트
- `BDR-current/tokens.css` — 보완 (필요 시)

**클로드 디자인 범위 외 (PM 이 Cowork 와 별도 진행)**:
- `src/app/(web)/games`, `teams`, `tournaments`, `courts`, `community` 운영 페이지
- `src/components/shared/region-picker / floating-filter-panel / edition-switcher`

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase C: 메인 9개 탭 목록 5 페이지 시안 (P1, 일상 사용)

배경:
- Phase A (시스템 베이스라인) + Phase B (홈) 완료 후 진입.
- 메인 9개 탭 중 목록 페이지 5 개: 경기 / 팀 / 대회 / 코트 / 커뮤니티.
- 이미 _v2 박제 완료된 상세 페이지 (`/games/[id]`, `/teams/[id]`, `/users/[id]`, `/live/[id]`) 와 시각 톤 정합 시켜야 함.
- audit-2026-05-07.md 결과: 운영 src/app/(web)/* 의 5 영역 36+19+17+15+9=96 폐기 토큰.

본 Phase 작업 (시안 영역만):

1. screens/Games.jsx 시안 갱신 — 경기 목록:
   * Hero 헤더 grid 1fr auto (제목 + 액션) / FilterChipBar (지역/카테고리)
   * 카드 패턴: 라이트 라운딩 10px / 다크 0px brutalism
   * NEW 뱃지 (NavBadge variant="new") — 24h 신규 매치
   * 필터 시: 결과 카운트 표시
   * 빈 상태 / 로딩 패턴

2. screens/Team.jsx 시안 갱신 — 팀 목록:
   * 지역 / 정렬 필터 칩 (FilterChipBar)
   * 팀 카드 — 로고 / 이름 / 멤버 수 / 최근 활동
   * 팀 등록 CTA (메인 진입점에서 등록 버튼 — 더보기 메뉴 X)

3. screens/Match.jsx 시안 갱신 — 대회 목록:
   * 진행 상태 탭 (전체/준비중/접수중/진행중/종료)
   * 토너먼트 카드 — 종료/진행 상태별 시각 변형
   * 검색 q 유지

4. screens/Court.jsx 시안 갱신 — 코트 목록:
   * 카카오맵 통합 영역 (시안에서는 placeholder)
   * 가로 스크롤 fade chevron 칩 바 (지역 필터)
   * 코트 카드 / 인기 코트 / 최근 본 코트

5. screens/BoardList.jsx 시안 갱신 — 커뮤니티 목록:
   * 게시판 탭 (자유/정보/후기/공지)
   * 글 row 패턴 (BoardRow 컴포넌트)
   * 24h NEW 뱃지

6. components.jsx — 5 페이지 공유 컴포넌트:
   * FilterChipBar (이미 정의 가능 — 02 §10-6 fade chevron 원형 배지) — 5 페이지 공통
   * TournamentCard / TeamCard / GameCard / CourtCard / BoardRow 시각 톤 정합
   * 페이지네이션 / 무한스크롤 패턴

7. tokens.css 보완 (필요 시):
   * Phase A 에서 추가된 신규 16 토큰 활용 — Phase C 에서 추가 토큰 필요 여부 검토

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — Phase A 갱신본 그대로 카피 (재구성 X)
- 토큰: 02 §1 신 토큰만 / Phase A 에서 추가된 신규 토큰 활용
- 듀얼 테마: 02 §0 — 라이트/다크 카드 라운딩 / 그림자 분리
- 더보기 가짜링크 4건 (gameResult / gameReport / guestApps / referee) 절대 사용 X — 03 §4 / 04 §5-A
- 카피: 01 §6 보존 / placeholder 5단어 / "예) " ❌
- 모바일: 720px 분기 / iOS 16px / 인라인 grid auto-fit minmax / 44px 터치 타겟
- PageBackButton 정책 — 메인 9개 탭 페이지에는 PageBackButton 사용 X (02 §10-4)
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

신규 컴포넌트 표준 활용 (02 §10):
- §10-1 NavBadge — LIVE 경기 / NEW 글 / 24h 신규 카운트
- §10-5 Hero 헤더 grid 1fr auto — 5 페이지 모두 적용
- §10-6 FilterChipBar — 가로 스크롤 fade chevron 원형 배지

자체 검수 (Phase C 시안 완료 시 모두 통과):
□ 5 시안 (Games / Team / Match / Court / BoardList) 갱신 ✅
□ FilterChipBar / 카드 컴포넌트 components.jsx 표준화 ✅
□ 라이트 / 다크 둘 다 시각 검증 ✅
□ 모바일 366px 가로 overflow 0
□ 더보기 가짜링크 4건 사용 X (회귀 가드)
□ AppNav 13 룰 영향 0 (헤더 변경 X)
□ PageBackButton 메인 9 탭 페이지에 사용 X
□ var(--*) 토큰만
□ 06-self-checklist.md §1~§5 모두 ✅

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (5 screens + components.jsx)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / games / teams / match / courts / community 정상 노출
- 변경 요약 보고:
  * 5 시안 갱신
  * components.jsx 신규 / 갱신된 카드/필터 컴포넌트
  * tokens.css 보완 여부

후속 (PM 이 Cowork 와 진행 — Claude 디자인 작업 외):
- src/app/(web)/games/page.tsx 등 5 페이지 _v2 폴더 신설 + 토큰 마이그레이션
- src/components/shared/region-picker (8) / floating-filter-panel (19) / edition-switcher (19) 마이그레이션
- /tournaments 의 [id] 하위 29 파일 — 별도 작업 (본 Phase 는 목록만)

질문 / 가정 (작업 시작 전 PM 결정 필요 시):
1. /tournaments 목록 — 진행 상태 탭 5종 (전체/준비중/접수중/진행중/종료) 박제 우선?
2. /courts 카카오맵 통합 영역 — 시안에서는 placeholder 박스로 처리 vs 실제 카카오맵 임베드 시안?
3. /community 카테고리 게시판 (BDR NEWS 통합) — 이미 admin sidebar 에 통합됨 — 사용자 영역 시안에 BDR NEWS 카테고리 노출?

작업 시작.
```

---

## 📚 참조

- `claude-project-knowledge/02-design-system-tokens.md` §10-1 §10-5 §10-6
- `claude-project-knowledge/04-page-inventory.md` §2 A등급 + §3 B등급 (목록 페이지 디테일 누락 보강)
- `claude-project-knowledge/06-self-checklist.md` 자체 검수
- `BDR-current/screens/Games.jsx` `Team.jsx` `Match.jsx` `Court.jsx` `BoardList.jsx`

## 🛠 PM 후속 작업 (Cowork 와 함께)

```
"Phase C 클로드 디자인 시안 완료. src/ 마이그레이션 진행해줘:
- /games, /teams, /tournaments, /courts, /community 5 목록 페이지 _v2 폴더 신설 + 토큰 매핑 (02 §9)
- src/components/shared/region-picker, floating-filter-panel, edition-switcher 마이그레이션
검증: grep 'var(--color-' 위 영역 → 0
시각: 라이트/다크/모바일 366px 검증"
```
