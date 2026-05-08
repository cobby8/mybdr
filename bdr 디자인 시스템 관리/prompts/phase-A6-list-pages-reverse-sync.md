# Phase A.6 — 메인 9개 탭 목록 페이지 시안 → 운영 역박제

> Claude 디자인 세션에 **본 마크다운 전체** 를 복사 후 붙여넣기.
> Phase A.5 완료 후에 진행 (Phase A.5 = 헤더/공유 컴포넌트 10건 / Phase A.6 = 메인 9개 탭 목록 5 페이지).

---

## 🎯 본 Phase 의 목적

**현재 상태**:
- BDR-current/screens/Games.jsx, Match.jsx, Team.jsx, Court.jsx, BoardList.jsx = 5/1 시점 시안 (옛 v2 화려한 디자인)
- 운영 mybdr.kr/games, /tournaments, /teams, /courts, /community = 사용자 직접 단순화 (미니멀 정제판)
- 갭 매우 큼 — 운영 사용자 첫인상 ≠ 시안. Phase C (시안 박제 + src/) 의 베이스라인 정합 필요

**본 Phase 작업**: 운영 mybdr.kr 의 5 메인 탭 목록 페이지 UI 를 시안 (BDR-current/) 에 역박제.
→ 결과: BDR-current/ 5 시안 = 운영 mybdr.kr 와 시각 정합 + Phase B/C 진입 베이스 정합.

---

## 📋 의뢰

```
✅ BDR 디자인 의뢰 — Phase A.6: 메인 9개 탭 목록 5 페이지 시안 운영 역박제

배경:
- Phase A 완료 (헤더 진입점) + Phase A.5 완료 (공유 컴포넌트 10건 역박제) 가정.
- 본 Phase A.6: 메인 9개 탭 중 목록 5 페이지 (Games / Match / Team / Court / BoardList) 시안이 옛 화려한 디자인 / 운영은 미니멀 정제판.
- PM 스크린샷 비교 결과 갭 큼 — 시안 단순화 + 운영 패턴 박제 필요.

작업 영역 (시안만):
- BDR-current/screens/Games.jsx (경기 목록)
- BDR-current/screens/Match.jsx (대회 목록)
- BDR-current/screens/Team.jsx (팀 목록)
- BDR-current/screens/Court.jsx (코트 목록)
- BDR-current/screens/BoardList.jsx (커뮤니티 목록)
- BDR-current/components.jsx (필요 시 공유 카드 컴포넌트 갱신)

본 Phase 작업 (5 페이지):

### 1. Games.jsx — /games 운영 정합

**운영 패턴 (PM 스크린샷 + src 검증)**:
- 헤더: eyebrow "경기 · GAMES" + h1 "픽업 · 게스트 모집" + 부제 "같이 뛸 사람을 찾는 N건의 모집이 열려있습니다"
- 우측 액션: **필터 아이콘 (분리)** + **"+ 만들기"** (CTA 카피 단순화 — "+ 모집 글쓰기" → "+ 만들기")
- 게임 유형 탭: 전체 N / 픽업 N / 게스트 N / **연습** N (시안의 "스크림" → "연습")
- 카드 디자인: **단순 카드** (상단 색상 막대 — 픽업=파랑 / 게스트=빨강 / 연습=초록 / 풀 width 가로 라인)
- 카드 정보: 좌상단 색상 라벨 (픽업/게스트/연습) + 우상단 지역 + 제목 + 장소·일시·레벨·비용 + 하단 태그 칩
- **칩 7개 제거** (시안의 오늘/이번주/주말/서울/경기/무료/초보환영) → 필터 아이콘 dropdown 으로 통합

**시안 변경**:
- 칩 영역 제거 — 필터 아이콘 우측 상단 분리
- 카드 마크업 단순화 — 상단 색상 막대 + 정보 그리드
- "스크림" → "연습"
- "+ 모집 글쓰기" → "+ 만들기"
- 게스트 카드 빨강 라벨 / 픽업 카드 파랑 / 연습 카드 초록 (var(--accent), var(--cafe-blue), var(--ok))

### 2. Match.jsx — /tournaments 운영 정합 (변경 가장 큼)

**운영 패턴 (PM 스크린샷 + src 검증)**:
- 헤더: eyebrow "대회 · TOURNAMENTS" + h1 "대회"
- 우측 액션: **리스트 / 월간 / 주간** view 토글 + **검색 아이콘** + **필터 아이콘**
- 상태 탭: 전체 N / 접수중 N / 진행중 N / 종료 N (4 탭 — 시안의 6탭 단순화)
- 카드 디자인: **단순 리스트 카드** (시안의 큰 포스터 카드 → 미니멀)
  * 좌상단: 접수중 뱃지 (초록 var(--ok))
  * 우상단: D-day (D-18, D-9, D-2 — 시안의 마감임박/PRO/AMATEUR 라벨 모두 제거)
  * 제목: 대회명
  * 정보 row: 일자 / 지역 / 참가비
  * 하단: 진행률 막대 (0/6, 0/24 등 — 신청자 수)
  * 우하단: "신청" 버튼

**시안 변경**:
- 카드 마크업 = 큰 포스터 그라디언트 (BDR CHALLENGE / KINGS CUP 등 시각 히로) → 단순 리스트 카드
- PRO / AMATEUR / OPEN / SPRING 2026 / VOL.07 등 sub 라벨 모두 제거
- 마감임박 / 종료 / 진행중 / 접수예정 라벨 → D-day 단일 표준
- 진행률 막대 패턴 통일 (참가팀 N/총원)
- view 토글 (리스트/월간/주간) 신규 추가 — 리스트가 default
- 검색 + 필터 아이콘 우측 상단 분리

### 3. Team.jsx — /teams 운영 정합

**운영 패턴 (PM 스크린샷 미공유 — 운영 src 추정 + Phase A.5 의 소속 팀 카드 패턴 참조)**:
- 헤더: eyebrow "팀 · TEAMS" + h1 "등록 팀 N팀" (시안 그대로)
- 우측 액션: 필터 아이콘 + 팀 등록 CTA
- 팀 카드: 로고 + 팀명 한/영 + 지역 + 멤버 수 + 최근 활동 + (선택) 본인 소속 시 #N jersey
- 운영 = 단순 그리드 / 카드 형태는 정제판 (PM 후속 검증)

**시안 변경**:
- 시안 그대로 둘 부분 + 운영 단순화 패턴 반영 (PM 후속 스크린샷 받으면 추가 명세)
- 팀 카드 hover 시 우측 화살표 / 본인 소속 표시 패턴 정합

### 4. Court.jsx — /courts 운영 정합

**운영 패턴 (PM 스크린샷 미공유 — 운영 src 추정)**:
- 헤더: eyebrow "코트 · COURTS" + h1 (시안 그대로)
- 카카오맵 영역 (시안에서는 placeholder)
- 가로 스크롤 fade chevron 칩바 (지역 필터)
- 코트 카드 — 인기 코트 / 최근 본 코트 그룹화

**시안 변경**:
- 칩 필터 (전체/실내/실외/무료/지금 한산) 운영과 비교 후 명칭 정합
- 카카오맵 placeholder 박스 — 운영 위치 / 시각 정합

### 5. BoardList.jsx — /community 운영 정합

**운영 패턴 (PM 스크린샷 미공유)**:
- 헤더: eyebrow + h1 (게시판 이름) + 부제 "전체 N개의 글"
- 게시판 탭 (자유/정보/후기/공지)
- 글 row 패턴 (BoardRow) — 핀 글 / 일반 글 분리
- 24h NEW 뱃지 + 조회수 / 댓글 수
- 운영의 BDR NEWS 통합 카테고리 검토

**시안 변경**:
- 글 row 패턴 정합 + 운영 폭 / 정렬 검증 (PM 스크린샷 받으면 명세 추가)

### 6. AppDrawer / 더보기 — **PC 깨짐 현상 fix (긴급)**

**현재 버그 (PM 스크린샷 2026-05-07)**:
- PC (mybdr.kr/tournaments) 에서 "더보기" 클릭 시 drawer 가 **CSS 미적용 stacked list** 로 노출
- 9 메인 탭 + 글쓰기/알림/검색/관리자 + 5그룹 (내 활동 / 경기·대회 / ...) 모두 좌측 정렬 + 그룹 구분 없음 + 패널 컨테이너 없음
- 03 §1 Phase 19 frozen 룰 위반 — drawer 는 PC + 모바일 동일하게 깔끔한 5그룹 패널이어야 함

**시안 박제 (components.jsx 의 AppDrawer + drawer.css 검수)**:
- drawer 컨테이너 `position: fixed` + `right: 0` (또는 panel 위치) + `width: 42vw` (Phase A.5 박제)
- drawer 내부 5그룹 IA — `.drawer-group` (border / padding / 그룹 헤더 eyebrow 노출) 명확히 구분
- 그룹 간 구분선 (`var(--border)` 또는 `--cafe-blue-hair`)
- 그룹 헤더: eyebrow 작은 라벨 ("내 활동" / "경기·대회" / "등록·예약" / "둘러보기" / "계정·도움")
- 항목 row: 좌 아이콘 + 텍스트 + 우 chevron
- PC 분기: 햄버거 hidden / drawer = panel 우측 슬라이드 OR backdrop overlay (둘 중 시안 우선)
- 모바일 분기 (≤768px): drawer 풀폭 100vw 또는 42vw 그대로 (PM 결정)

**시안 검증**:
- BDR-current/components.jsx 의 AppDrawer 함수 + drawer.css (또는 인라인 style) 의 패널 마크업 정합 — 5그룹 박스 정상 노출
- 모든 viewport (PC 1440 / tablet 900 / mobile 366) 에서 drawer 깨짐 0
- Phase A.5 의 "drawer 폭 60vw→42vw" 와 함께 PC drawer 패널 구조 정합

룰 인지 (반드시 준수):
- AppNav: 03 frozen 13 룰 — 본 Phase 헤더 변경 X (Phase A 갱신본 그대로 카피)
- 토큰: 02 §1 신 토큰만 / Phase A.5 에서 박제된 NavBadge / FilterChipBar 활용
- 듀얼 테마: 02 §0 — 라이트 카드 10px / 다크 카드 0px brutalism
- 카피: 01 §6 보존 — 단, 운영의 단순화 카피 (예: "+ 만들기" / "연습") 적용
- 더보기 가짜링크 4건 (gameResult / gameReport / guestApps / referee) ❌
- 핑크/살몬/코랄 ❌ / lucide-react ❌ / pill 9999px ❌

신규 컴포넌트 표준 활용 (02 §10):
- §10-1 NavBadge — D-day 표시 / 접수중 뱃지 / NEW 카드
- §10-5 Hero 헤더 grid 1fr auto — 5 페이지 모두 적용
- §10-6 FilterChipBar — Court 의 가로 스크롤 칩바

자체 검수 (Phase A.6 시안 완료 시 모두 통과):
□ Games.jsx — 칩 제거 / "스크림"→"연습" / "+ 모집 글쓰기"→"+ 만들기" / 카드 단순화
□ Match.jsx — 큰 포스터 카드 → 단순 리스트 / D-day 표준 / view 토글 신규 / PRO/AMATEUR 라벨 제거
□ Team.jsx — 운영 정합 (PM 스크린샷 후속 명세 적용 가능 영역 표시)
□ Court.jsx — 운영 정합 + FilterChipBar 활용
□ BoardList.jsx — 운영 정합 (PM 스크린샷 후속)
□ **AppDrawer PC 깨짐 fix — 5그룹 패널 정상 노출 (PC 1440 / tablet 900 / mobile 366 모두 검증)**
□ AppNav 13 룰 영향 0 / 06-self-checklist.md §1~§5 통과
□ var(--*) 토큰만 / hex 직접 X / `--color-*` `--surface` 잔존 0
□ 라이트 / 다크 둘 다 시각 검증

산출 형식:
- BDR-current/ 안의 시안 직접 수정 (5 screens + components.jsx 의 카드/필터 컴포넌트)
- 시안 결과물 = MyBDR.html 라우터 진입 시 / games / match / team / court / boardList 정상 노출 + 운영 mybdr.kr 와 시각 정합
- 변경 요약 보고:
  * 5 시안 갱신 영역
  * components.jsx 신규 / 갱신된 컴포넌트 (TournamentCard 단순화 / GameCard 단순화 / FilterChipBar 활용)

후속 (PM 결정 / 추가 검증 필요):
- /teams, /courts, /community 운영 스크린샷 추가 공유 시 → 의뢰서 §3~§5 명세 보강
- 본 Phase 완료 후 Phase B (홈) 진입

질문 / 가정:
1. Match 의 view 토글 (리스트/월간/주간) — 리스트 default / 월간·주간은 후속 Phase 또는 시안 placeholder?
2. Match 의 진행률 막대 — 신청 인원 (0/6) vs 참가 팀 (0/16) 의미? (시안 데이터 더미는 신청 인원 기준 권장)
3. Games 카드의 색상 막대 — 픽업 var(--cafe-blue) / 게스트 var(--accent) / 연습 var(--ok) 매핑 OK?
4. Team / Court / BoardList 운영 스크린샷 미공유 — PM 후속 공유까지 시안 그대로 유지 vs 운영 src 추정 박제?

작업 시작.
```

---

## 📚 운영 출처 참조

- `src/app/(web)/games/page.tsx` + `_v2/` (Games 운영 마크업)
- `src/app/(web)/tournaments/page.tsx` + `tournaments-filter.tsx` (Tournaments 운영)
- `src/app/(web)/teams/page.tsx` (Teams 운영)
- `src/app/(web)/courts/page.tsx` (Courts 운영)
- `src/app/(web)/community/page.tsx` (Community 운영)
- 운영 mybdr.kr/games, /tournaments — PM 스크린샷 (2026-05-07)

## 🛠 Phase A.6 후속 (Phase B 진입 전)

```
1. PM 검수: BDR-current/ 5 시안이 운영 mybdr.kr 와 시각 정합 (라이트 / 다크 / 모바일)
2. /teams, /courts, /community 운영 스크린샷 받으면 §3~§5 명세 보강 후 클로드 디자인 추가 의뢰
3. Phase A.5 + A.6 완료 = BDR-current/ 가 운영 곤수준 정합 ✅
4. Phase B 진입 (홈 페이지)
```
