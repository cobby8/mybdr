# BDR v2.2 — 모바일 오딧 + D등급(누락 페이지) 보강

> v2.1 → v2.2 작업 요약. 자산 위치 및 회귀 검수 매트릭스.

## 1. 빌드 결과 요약

### 모바일 오딧 (M1~M9, 완료)
v2.1 에서 식별된 9건의 모바일 회귀 이슈 픽스:

| ID | 영역 | 픽스 내용 |
|---|---|---|
| M1 | gameResult | 가로 스크롤 페이드 + 스와이프 hint |
| M2 | live       | 비디오 aspect-ratio 16/9 + 스코어버그 클램프 |
| M3 | gallery    | 라이트박스 모달 모바일 stack |
| M4 | stats      | 슈팅 차트 aspect-ratio 점검 |
| M5 | calendar   | 셀 탭 → 일간 모달 |
| M6 | postWrite  | 툴바 그룹/스크롤 처리 |
| M7 | profile    | 모바일 hero 변환 |
| M8 | gameResult | 쿼터별 스코어 컬럼 축소 |
| M9 | global     | 가로 스크롤 영역 우측 페이드 마스크 (`responsive.css` G-9, G-10 가드) |

### D등급(누락 페이지) 12건 보강

#### P0 · 필수 동작 (4건)
- **PostEdit** (`/post/:id/edit`) — 글 수정 (제목/본문/카테고리/사진)
- **GameEdit** (`/game/:id/edit`) — 경기 수정 (일시/장소/룰/공지)
- **LiveResult** (`/live/result`) — 라이브 종료 후 결과 확정 화면
- **ProfileComplete** (`/profile/complete`) — 가입 후 프로필 완성 (4-step wizard)

#### P1 · 내 프로필 강화 (4건)
- **ProfileGrowth** (`/profile/growth`) — 12주 성장 추이 + 마일스톤
- **ProfileBookings** (`/profile/bookings`) — 내 예약 현황 (코트·코치·이벤트)
- **VenueDetail** (`/venues/:slug`) — 코트 SEO 공개 페이지 (비로그인 열람)
- **ProfileWeeklyReport** (`/profile/weekly`) — 주간 리포트 뉴스레터

#### P2 · 보강 (2건)
- **ProfileCompletePreferences** (`/profile/complete/preferences`) — 4-step 취향 wizard
- **HelpGlossary** (`/help/glossary`) — `/help` 글로서리 탭으로 redirect 박제

#### P3 · 옵션B (1건)
- **RefereeInfo** (`/referee`) — 심판 제도 SEO 안내 (옵션B 채택)

## 2. 폴더 구조

```
BDR v2.2/
├── MyBDR.html               ← 메인 진입 (라우터)
├── _mobile_audit.html       ← 모바일 오딧 그리드 (v2.2 신규 그룹 3개 추가)
├── _mobile_audit_report.html ← M1~M9 오딧 리포트
├── README.md                ← 본 파일
├── extras-data.jsx
├── components.jsx
├── responsive.css           ← M9 글로벌 가드 포함
└── screens/
    ├── (v2.1 기존 페이지 70+)
    └── (v2.2 신규 11개)
```

## 3. 회귀 검수 매트릭스

각 신규 페이지의 JSDoc 헤더에 다음 매트릭스 포함:
```
기능              | 옛 페이지 | 시안 v2.2 | 진입점 | 모바일
```

진입점/복귀 경로/모바일 1열 변환 모두 페이지별 헤더에서 확인 가능.

## 4. 라우트 등록 현황

`MyBDR.html` 라우터 case 추가 완료:
- `postEdit`, `gameEdit`, `liveResult`, `profileComplete`
- `profileGrowth`, `profileBookings`, `venueDetail`, `profileWeekly`
- `profileCompletePref`, `helpGlossary`, `refereeInfo`

`_mobile_audit.html` 그룹 추가 완료:
- "v2.2 P0·필수"
- "v2.2 P1·내 프로필 강화"
- "v2.2 P2·P3"

## 5. v2.1 자산 보존

v2.2 폴더는 v2.1 의 **카피 + 추가**. 기존 페이지는 변경하지 않았고,
모바일 오딧 픽스는 `responsive.css` 글로벌 가드 (G-9, G-10) 와 해당 페이지의
breakpoint CSS 만 수정. v2.1 폴더는 별도 위치에 그대로 보존.

## 6. 다음 단계 후보

- 라이브 데이터 연결 (현재 모두 더미)
- ProfileGrowth/WeeklyReport 의 실제 집계 쿼리 정의
- VenueDetail 구조화 데이터 (JSON-LD `Place`/`SportsActivityLocation`)
- RefereeInfo 옵션A (인터랙티브 자가진단) 추가 검토
