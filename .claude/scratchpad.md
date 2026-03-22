# 작업 스크래치패드

## 효율화 규칙 (2026-03-21 적용)
1. **병렬 실행**: 독립적인 에이전트는 동시 실행 (tester+reviewer 병렬 등)
2. **스크래치패드 경량 모드**: 소규모 작업(1~2파일)은 작업 로그 한 줄만. 대규모(5+파일)만 섹션 기록
3. **확인 생략**: 명확한 요청은 바로 실행. 모호한 것만 확인 질문
4. **tester+reviewer 병렬**: 동시 실행 후 결과 취합. 소규모는 tester만
5. **커밋 간소화**: tester 통과 시 PM이 직접 커밋. 복잡한 git만 git-manager 호출
6. **기록 관리**: PM이 매 작업 후 knowledge/scratchpad 업데이트 확인. 에러/교훈은 즉시 기록

## 현재 작업
- **요청**: admin 폴더를 (web) -> (admin) 라우트 그룹으로 이동하여 레이아웃 분리
- **상태**: 완료
- **현재 담당**: developer

---

## 기획설계 (planner-architect)

### 하드코딩 데이터 vs DB/API 연결 전체 분석 결과

분석일: 2026-03-23

---

#### 0. 레이아웃 (layout.tsx, slide-menu.tsx)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| layout.tsx | 사이드바 프로필: 이름/역할 | 연결됨 | /api/web/me fetch | - |
| layout.tsx | "Level 1" 텍스트 | 미연결 | DB에 level 필드 없음 | 낮음 |
| layout.tsx | "경기 시작하기" 버튼 | 연결됨 | /games/new 링크 (정적, OK) | N/A |
| layout.tsx | "Upgrade Pro" 버튼 | 연결됨 | /pricing 링크 (정적, OK) | N/A |
| slide-menu.tsx | 프로필: 이름/역할 | 연결됨 | props로 전달 (layout에서) | - |
| slide-menu.tsx | "Upgrade Pro" 배너 | 하드코딩 텍스트 | 정적 CTA, OK | N/A |

**요약**: "Level 1"만 하드코딩. DB에 레벨 시스템이 없으므로 스키마 변경 필요.

---

#### 1. 홈페이지

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| hero-bento.tsx | 없음 | 연결됨 | /api/web/youtube/recommend | - |
| hero-bento.tsx | fallback unsplash 이미지 | 적절한 하드코딩 | API 실패 시 placeholder | N/A |
| recommended-games.tsx | 4개 카드 전부 하드코딩 (제목/날짜/가격/이미지) | 연결 가능 | /api/web/recommended-games API 존재하지만 응답 미사용! | **높음** |
| recommended-games.tsx | "토요일 밤 5vs5 풀코트 매치" 등 더미 텍스트 | 연결 가능 | API 응답의 games 배열 사용 | **높음** |
| recommended-games.tsx | unsplash 이미지 2개 | 대체 필요 | DB에 game 이미지 필드 없음 -> placeholder 아이콘 | 중간 |
| recommended-games.tsx | 대회 카드 2개: "BDR 오픈 챌린지 윈터", "연말 왕중왕전" | 연결 가능 | /api/web/tournaments로 최신 대회 가져오기 | **높음** |
| recommended-games.tsx | "12/16", "100만", "8/8" 등 수치 | 연결 가능 | API 응답 필드 매핑 | **높음** |
| notable-teams.tsx | TEAMS 더미 배열 4개 (Storm FC, Red Eagles 등) | 연결 가능 | /api/web/teams?sort=wins&limit=4 | **높음** |
| recommended-videos.tsx | DUMMY_VIDEOS 배열 4개 | 연결됨 (fallback) | /api/web/youtube/recommend -> API 성공 시 사용, 실패 시 더미 | - |
| right-sidebar-logged-in.tsx | "42 Wins" | 연결 가능 | /api/web/profile/stats | **높음** |
| right-sidebar-logged-in.tsx | "Gold I" Rank | 연결 불가 | DB에 랭크 시스템 없음 | 낮음 |
| right-sidebar-logged-in.tsx | 실시간 랭킹 3팀 (서울 다이내믹스 등) | 연결 가능 | /api/web/teams?sort=wins&limit=3 | **높음** |
| right-sidebar-logged-in.tsx | 커뮤니티 최신글 3개/조회수 높은 글 2개 | 연결 가능 | /api/web/community?limit=3 + sort=views | 중간 |
| right-sidebar-logged-in.tsx | "대회 알림 받기" | 정적 CTA | 알림 시스템 미구현 | N/A |
| right-sidebar-guest.tsx | "4,200개 이상의 팀" | 연결 가능 | teams count 쿼리 | 중간 |
| right-sidebar-guest.tsx | "12.5k+" 등록매치, "85.2k+" 활동선수 | 연결 가능 | games count + users count | 중간 |
| right-sidebar-guest.tsx | 실시간 랭킹 3팀 (로그인과 동일) | 연결 가능 | /api/web/teams?sort=wins&limit=3 | **높음** |
| right-sidebar-guest.tsx | 커뮤니티 최신글 2개 | 연결 가능 | /api/web/community?limit=2 | 중간 |
| right-sidebar-guest.tsx | "지금 바로 시작하세요" CTA | 정적 텍스트, OK | 하드코딩 적절 | N/A |
| right-sidebar-guest.tsx | "실시간 데이터 분석" SERVICE FEATURE | 정적 소개, OK | 하드코딩 적절 | N/A |

**핵심 발견**: recommended-games.tsx가 가장 큰 문제. API(/api/web/recommended-games)가 이미 존재하고 fetch도 하지만, 응답 데이터를 카드 렌더링에 전혀 사용하지 않고 4개 하드코딩 카드만 보여줌.

---

#### 2. 경기 (목록/상세/생성)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| games-content.tsx | 없음 | 연결됨 | /api/web/games fetch | - |
| games-content.tsx | 상태 배지 (LIVE/STARTS SOON/FULLY BOOKED) | 연결됨 | 프론트 계산 (getStatusBadge) | - |
| games-content.tsx | 카드 이미지 영역 | placeholder 아이콘 | DB에 game 이미지 없음 | 낮음 |
| hero-banner.tsx | 히어로 이미지 | 그라디언트 배경 대체 | DB에 venue 이미지 없음 | 낮음 |
| hero-banner.tsx | "GAME VENUE" fallback | 연결됨 | game.venue_name || game.title | - |
| game detail page.tsx | 모든 데이터 | 연결됨 | getGame + listGameApplications | - |
| game wizard (6파일) | 기존 로직 유지 | 연결됨 | createGameAction | - |

**요약**: 경기 영역은 거의 완벽하게 연결됨. 이미지만 DB 필드 부재.

---

#### 3. 팀 (목록/상세)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| teams-content.tsx | 없음 | 연결됨 | /api/web/teams fetch | - |
| teams-content.tsx | 배지 (TOP1/HOT/NEW/PLATINUM 등) | 연결됨 | 프론트 계산 (computeBadges) | - |
| teams-content.tsx | 팀 아이콘 | groups 아이콘 대체 | DB에 team logo 없음 | 낮음 |
| team detail [id]/page.tsx | 히어로 배너 | 팀 고유색 그라디언트 | DB에 팀 이미지 없음 | 낮음 |
| team detail [id]/page.tsx | 모든 데이터 | 연결됨 | prisma 직접 쿼리 | - |
| team detail _tabs/* | 모든 데이터 | 연결됨 | prisma 쿼리 | - |

**요약**: 팀 영역도 완벽하게 연결됨. 이미지(로고/배너)만 DB 필드 부재.

---

#### 4. 프로필 (내/타인)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| profile/page.tsx | 없음 | 연결됨 | useSWR /api/web/profile + stats | - |
| profile-header.tsx | 티어 배지 (PLATINUM/GOLD 등) | 프론트 계산 | 총 경기수 기반 임시 로직 | - |
| profile-header.tsx | "-%"  Win Rate | 미연결 | DB에 개인 승률 없음 | 중간 |
| profile-header.tsx | createdAt | 미연결 | API에 createdAt 필드 미포함 | 중간 |
| stat-bars.tsx | PPG/RPG/APG | 연결됨 | /api/web/profile/stats | - |
| ability-section.tsx | 레이더 차트 6축 | 연결됨 | stats API의 career_averages | - |
| ability-section.tsx | "피지컬"="리바운드" (같은 값) | DB 한계 | 별도 physical 스탯 필드 없음 | 낮음 |
| current-team-card.tsx | 팀 정보 | 연결됨 | profile API의 teams 배열 | - |
| recent-games-section.tsx | 최근 경기 | 연결됨 | profile API의 recent_games | - |
| users/[id]/page.tsx | 모든 데이터 | 연결됨 | prisma 직접 + matchPlayerStat | - |
| user-radar-section.tsx | 레이더 차트 | 연결됨 | matchPlayerStat aggregate | - |
| user-stats-section.tsx | 시즌 데이터 | 연결됨 | matchPlayerStat aggregate | - |

**요약**: 대부분 연결됨. Win Rate와 createdAt만 API 확장 필요.

---

#### 5. 대회 (목록/상세/대진표)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| tournaments-content.tsx | 없음 | 연결됨 | /api/web/tournaments fetch | - |
| tournaments-content.tsx | 카드 이미지 | 이름 기반 그라디언트 | DB에 대회 이미지 없음 | 낮음 |
| tournament-hero.tsx | 히어로 이미지 | CSS 그라디언트 대체 | DB에 대회 이미지 없음 | 낮음 |
| tournament-hero.tsx | 모든 데이터 | 연결됨 | prisma 직접 쿼리 | - |
| tournament-sidebar.tsx | 참가비/팀수/디비전/은행정보 | 연결됨 | prisma 직접 쿼리 | - |
| tournament-about.tsx | 대회 소개 | 연결됨 | prisma (description 파싱) | - |
| tournament-dashboard-header.tsx | "누적 관중" value="-" | 미연결 | DB에 관중 수 필드 없음 | 낮음 |
| tournament-dashboard-header.tsx | 결승전 예정일 | 연결됨 | prisma 쿼리 전달 | - |
| bracket-view.tsx + match-card.tsx | 대진표 데이터 | 연결됨 | prisma + buildRoundGroups | - |
| finals-sidebar.tsx | 결승전 정보 | 연결됨 | prisma 쿼리 | - |

**요약**: 거의 완벽하게 연결됨. "누적 관중" 하나만 DB 필드 부재.

---

#### 6. 커뮤니티 (목록/상세)

| 파일 | 하드코딩 항목 | 연결 가능 여부 | 연결 방법 | 우선순위 |
|------|------------|-------------|----------|---------|
| community-content.tsx | 없음 | 연결됨 | /api/web/community fetch | - |
| community-sidebar.tsx | 인기글 TOP 5 | 연결됨 | posts prop에서 조회수 정렬 | - |
| community-sidebar.tsx | 실시간 인기글 | 연결됨 | posts prop에서 최근+조회수 | - |
| community-sidebar.tsx | 이벤트 배너 ("BDR 공식 굿즈") | 하드코딩 placeholder | 광고 시스템 미구현 | N/A |
| post-detail-sidebar.tsx | 작성자 게시글/댓글 수 | 연결됨 | prisma count 쿼리 | - |
| post-detail-sidebar.tsx | 실시간 인기글 | 연결됨 | prisma 쿼리 | - |
| post-detail-sidebar.tsx | "팔로우" 버튼 | UI만 (기능 미구현) | 팔로우 시스템 없음 | 낮음 |
| post-detail-sidebar.tsx | 이벤트 배너 ("BDR 3x3 아마추어 챔피언십") | 하드코딩 placeholder | 이벤트 시스템 미구현 | N/A |
| community/[id]/page.tsx | 모든 데이터 | 연결됨 | prisma 직접 쿼리 | - |
| comment-form.tsx | 댓글 작성 | 연결됨 | createCommentAction | - |

**요약**: 완벽하게 연결됨. 이벤트 배너와 팔로우 버튼만 미구현.

---

### 전체 요약 (우선순위별)

#### 높음 - API만 연결하면 됨 (기존 API 존재, 데이터 있음)
| # | 파일 | 항목 | 연결 방법 | 예상 작업량 |
|---|------|------|----------|----------|
| 1 | recommended-games.tsx | 4개 카드 전부 | /api/web/recommended-games 응답을 실제로 렌더링 | 중 (API 응답 -> 카드 매핑 로직 필요) |
| 2 | notable-teams.tsx | TEAMS 더미 배열 4개 | /api/web/teams?sort=wins&limit=4 새 fetch 추가 | 소 |
| 3 | right-sidebar-logged-in.tsx | "42 Wins" 통계 | /api/web/profile/stats fetch 추가 | 소 |
| 4 | right-sidebar-logged-in.tsx | 실시간 랭킹 3팀 | /api/web/teams?sort=wins&limit=3 fetch 추가 | 소 |
| 5 | right-sidebar-guest.tsx | 실시간 랭킹 3팀 | /api/web/teams?sort=wins&limit=3 fetch 추가 | 소 |

#### 중간 - 새 API 엔드포인트 또는 기존 API 확장 필요
| # | 파일 | 항목 | 필요한 작업 |
|---|------|------|----------|
| 6 | right-sidebar-logged-in.tsx | 커뮤니티 최신글/인기글 | /api/web/community에 limit 파라미터 추가 or 새 경량 API |
| 7 | right-sidebar-guest.tsx | 커뮤니티 최신글 | 동일 |
| 8 | right-sidebar-guest.tsx | "4,200개 팀", "12.5k 매치", "85.2k 선수" | /api/web/stats (총 팀/경기/유저 count) 새 API |
| 9 | profile-header.tsx | Win Rate (-%") | /api/web/profile/stats에 승률 추가 (matchPlayerStat에서 계산) |
| 10 | profile-header.tsx | 가입일 (createdAt) | /api/web/profile 응답에 created_at 필드 추가 |

#### 낮음 - DB 스키마 변경 필요
| # | 파일 | 항목 | 필요한 스키마 변경 |
|---|------|------|----------------|
| 11 | layout.tsx | "Level 1" | users 테이블에 level 필드 추가 + 레벨 시스템 설계 |
| 12 | right-sidebar-logged-in.tsx | "Gold I" Rank | 랭킹 시스템 설계 (별도 테이블 or users 필드) |
| 13 | ability-section.tsx | "피지컬" 별도 데이터 | matchPlayerStat에 physical 필드 추가 |
| 14 | tournament-dashboard-header.tsx | "누적 관중" | tournaments에 spectator_count 필드 추가 |
| 15 | 경기/팀/대회 카드 이미지 | 이미지 URL | games/teams/tournaments에 image_url 필드 + 이미지 업로드 시스템 |

#### N/A - 하드코딩이 적절함
- CTA 텍스트: "지금 바로 시작하세요", "Upgrade Pro", "경기 시작하기" 등
- 정적 소개: "실시간 데이터 분석" SERVICE FEATURE
- 이벤트/광고 배너: placeholder (광고 시스템 미구현)
- fallback 이미지: unsplash URL (API 실패 시)

---

### 실행 계획 (추천 우선순위)

| 순서 | 작업 | 담당 | 선행 조건 | 예상 시간 |
|------|------|------|----------|----------|
| 1 | recommended-games.tsx: API 응답 -> 실제 카드 렌더링 | developer | 없음 | 15분 |
| 2 | notable-teams.tsx: /api/web/teams fetch + 더미 배열 제거 | developer | 없음 | 10분 |
| 3 | right-sidebar 양쪽: 랭킹/통계/커뮤니티 API 연결 | developer | 없음 | 20분 |
| 4 | profile-header.tsx: Win Rate + createdAt API 확장 | developer | API 수정 | 15분 |
| 5 | 플랫폼 통계 API: /api/web/stats 신규 | developer | 없음 | 10분 |
| 6 | tester 검증 | tester | 1~5 완료 | 10분 |

**주의사항 (developer)**:
- recommended-games.tsx는 이미 fetch를 하고 있음 (data/loading 상태도 있음). 하드코딩 카드 JSX를 API 응답 기반 동적 렌더링으로 교체하면 됨
- right-sidebar는 서버 컴포넌트가 아닌 클라이언트 컴포넌트이므로 fetch/useSWR 사용
- notable-teams는 현재 상수 배열 TEAMS만 있고 fetch 로직이 전혀 없음 -> 새로 추가

---

## 📊 UI/UX 리디자인 전체 진행 현황

### 완료된 페이지
| # | 페이지 | 디자인 폴더 | 커밋 수 | 파일 수 | tester 검증 |
|---|--------|-----------|--------|--------|-------------|
| 0 | 레이아웃 (사이드바/헤더/네비) | 0. 레이아웃 | 5 | ~30 | 통과 |
| 1 | 홈페이지 | 1. 홈 | 3 | 7 | 19/19 |
| 2 | 경기 (목록/상세/생성) | 2. 경기 | 3 | 17 | 각 통과 |
| 3 | 팀 (목록/상세) | 3. 팀 | 2 | 9 | 14P+14P |
| 4 | 프로필 (내/타인) | 4. 프로필 | 1 | 12 | 28/28 |
| 5 | 대회 (목록/상세/대진표) | 5. 대회 | 3 | 16 | tsc만 |
| 6 | 커뮤니티 (목록/상세) | 6. 커뮤니티 | 1 | 8 | tsc만 |

### 미완료 페이지
| 페이지 | 디자인 | 상태 |
|--------|--------|------|
| 코트 (목록/상세) | 미제공 | 대기 |
| 요금제/결제 | 미제공 | 대기 |
| 라이브 (목록/상세) | 미제공 | 대기 |
| 대회 관리 (tournament-admin) | 미제공 | 대기 |
| 인증 (로그인/회원가입) | 미제공 | 대기 |
| 알림 | 미제공 | 대기 |
| 시리즈 | 미제공 | 대기 |

### 커밋 통계
- **총 커밋**: 39개
- **총 수정 파일**: ~200파일+
- **미푸시**: 프로필/대회/커뮤니티 커밋 (팀까지 푸시됨)

---

## 구현 기록 (developer)

### recommended-games.tsx: API 응답 기반 동적 렌더링 교체

구현한 기능: 하드코딩 카드 4개를 /api/web/recommended-games API 응답 기반 동적 렌더링으로 교체

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/recommended-games.tsx | 하드코딩 카드 -> API 응답 games 배열 순회 렌더링 | 수정 |

주요 변경 사항:
1. GameCard 하위 컴포넌트 분리: 경기 유형(0=PICKUP/1=GUEST/2=PRACTICE)별 뱃지/아이콘/그라디언트 자동 매핑
2. GAME_TYPE_CONFIG: 유형별 label, Material Symbols 아이콘, CSS 변수 기반 그라디언트 정의
3. formatDate/formatTime 헬퍼: ISO 문자열을 MM.DD, HH:MM으로 변환
4. API 실패 시 FALLBACK_GAMES 상수 4개로 graceful degradation
5. match_reason 배열의 첫 번째 항목을 우상단 뱃지로 표시 (추천 이유)
6. spots_left 있으면 "N자리 남음" 텍스트 표시
7. 카드 전체를 Link로 감싸 경기 상세로 이동 (uuid 앞 8자리 또는 id)
8. 기존 디자인 유지: 모바일 가로스크롤/데스크탑 2열 그리드, 빨간 세로 막대 헤더

tester 참고:
- 테스트 방법: 홈페이지 접속하여 추천 경기 섹션 확인
- 정상 동작: DB에 경기 데이터가 있으면 API 응답 기반 카드 렌더링, 없으면 fallback 카드 4개
- 로그인/비로그인 모두 확인 필요 (제목 텍스트 분기)
- 카드 클릭 시 /games/{uuid 앞 8자리} 경로로 이동하는지 확인

reviewer 참고:
- 대회(tournament) 카드는 이번 작업에서 제거됨 (API가 games만 반환하므로). 대회 데이터 표시는 별도 API 연결 작업 필요
- button 대신 Link+span 사용 (a 태그 안에 button 불가 이슈)

---

### notable-teams.tsx: /api/web/teams API 연결

구현한 기능: 더미 TEAMS 배열을 제거하고 /api/web/teams API에서 승수 기준 상위 4팀을 동적으로 표시

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/notable-teams.tsx | 더미 배열 -> API fetch + 동적 렌더링 | 수정 |

주요 변경 사항:
1. useState + useEffect로 /api/web/teams fetch 추가
2. API 응답에서 상위 4팀 slice (API가 이미 wins DESC 정렬)
3. TeamData 인터페이스 정의 (API 응답 타입 매핑)
4. primaryColor를 shield 아이콘의 inline style color로 적용
5. 승수(wins) + 멤버수(memberCount)를 "NW · N명" 형식으로 표시
6. 카드를 Link로 감싸 /teams/{id}로 이동
7. 로딩 중 스켈레톤 UI (animate-pulse)
8. API 실패 시 FALLBACK_TEAMS 4개로 graceful degradation
9. 기존 디자인 유지: 파란 세로 막대, 가로스크롤/4열 그리드, shield 아이콘

tester 참고:
- 테스트 방법: 홈페이지 접속하여 "주목할만한 팀" 섹션 확인
- 정상 동작: DB에 팀 데이터가 있으면 상위 4팀이 wins 순으로 표시
- 카드에 팀 고유색 shield 아이콘 + "NW · N명" 텍스트가 보여야 함
- 카드 클릭 시 /teams/{id}로 이동하는지 확인
- API 실패 시 fallback 카드 4개 (Storm FC, Red Eagles 등)가 표시되어야 함

reviewer 참고:
- primaryColor가 null인 팀은 아이콘에 기본 색상(CSS 상속) 적용

---

### right-sidebar 양쪽: 하드코딩 데이터 API 연결

구현한 기능: 로그인/비로그인 우측 사이드바의 하드코딩 데이터를 실제 API 응답으로 교체

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/components/home/right-sidebar-logged-in.tsx | 나의 통계/랭킹/커뮤니티 3개 API 연결 | 수정 |
| src/components/home/right-sidebar-guest.tsx | 랭킹/커뮤니티 2개 API 연결 | 수정 |

주요 변경 사항:
1. right-sidebar-logged-in.tsx:
   - "42 Wins" -> /api/web/profile/stats에서 gamesPlayed 가져옴 (라벨도 "Games"로 변경)
   - "Gold I" -> 경기수 기반 getTier() 함수로 동적 티어 계산 (Bronze/Silver/Gold/Platinum/Diamond)
   - 실시간 랭킹 3팀 -> /api/web/teams에서 wins DESC 상위 3팀
   - 커뮤니티 최신글 3개 -> /api/web/community에서 앞 3개 (created_at DESC)
   - 조회수 높은 글 2개 -> 같은 API 응답을 viewCount DESC 재정렬 후 상위 2개
   - 랭킹 항목에 pts 대신 실제 wins(NW) 표시
   - 각 항목을 Link로 감싸 상세 페이지로 이동 가능
2. right-sidebar-guest.tsx:
   - 실시간 랭킹 3팀 -> /api/web/teams (로그인 사이드바와 동일)
   - 커뮤니티 최신글 2개 -> /api/web/community 앞 2개
   - 플랫폼 통계 ("4,200개 팀", "12.5k+", "85.2k+") -> 하드코딩 유지 + TODO 주석 추가
   - "전체보기"/"커뮤니티 이동" 버튼을 Link로 교체
3. 공통:
   - Promise.allSettled로 병렬 API 호출 (하나 실패해도 나머지 정상 동작)
   - API 실패 시 FALLBACK 상수로 graceful degradation
   - 기존 디자인/레이아웃/fontSize 120% 완전 유지

tester 참고:
- 테스트 방법: 홈페이지에서 로그인/비로그인 상태로 각각 접속하여 우측 사이드바 확인
- 로그인 상태: 나의 통계에 실제 경기수 + 티어가 표시되는지 확인
- 실시간 랭킹: 3팀이 wins 내림차순으로 표시, 각 팀 클릭 시 /teams/{id}로 이동
- 커뮤니티: 게시글 제목이 실제 DB 데이터와 일치, 클릭 시 /community/{publicId}로 이동
- API 실패 시(네트워크 끊김 등) fallback 데이터가 표시되어야 함
- 비로그인: 플랫폼 통계 숫자("12.5k+", "85.2k+")는 하드코딩이므로 그대로 유지 확인

reviewer 참고:
- "Wins" 라벨을 "Games"로 변경함 (API가 총 경기수만 반환, 승수는 별도 집계 필요)
- 플랫폼 통계는 새 API 필요하여 하드코딩 유지 (TODO 주석 있음)

---

### profile-header: Win Rate + 가입일 API 연결

구현한 기능: 프로필 헤더의 Win Rate(하드코딩 "-%")를 실제 승률로, 가입일(createdAt)을 API에서 가져와 표시

| 파일 경로 | 변경 내용 | 신규/수정 |
|----------|----------|----------|
| src/lib/services/user.ts | PROFILE_DETAIL_SELECT에 createdAt 추가 + getPlayerStats에 승률 계산 로직 추가 | 수정 |
| src/app/api/web/profile/route.ts | 응답에 created_at 필드 추가 (ISO 문자열) | 수정 |
| src/app/(web)/profile/page.tsx | ProfileData/StatsData 인터페이스 확장 + ProfileHeader에 createdAt/winRate 전달 | 수정 |
| src/app/(web)/profile/_components/profile-header.tsx | winRate prop 추가 + "-%"를 실제 값으로 교체 | 수정 |

승률 계산 로직:
- MatchPlayerStat에서 유저가 참여한 모든 경기 조회
- 각 경기의 winner_team_id와 선수의 tournamentTeamId 비교
- 결과 확정(winner_team_id != null) 경기만 대상
- 승률 = (승리수 / 결과확정 경기수) * 100 (소수점 1자리)

tester 참고:
- 테스트 방법: /profile 페이지 접속
- 정상 동작: Win Rate에 실제 승률(예: "66.7%") 표시, 가입일에 "YYYY. M. D." 형식 날짜 표시
- 대회 경기 기록이 없는 유저: Win Rate "-%", 가입일은 표시됨
- 경기 기록은 있지만 결과 미확정(winner_team_id 없는) 경기만 있는 유저: Win Rate "-%"

reviewer 참고:
- 승률 계산은 대회(tournament) 경기 기록(MatchPlayerStat) 기준. 일반 경기(game_applications)는 포함 안 됨
- findMany로 전체 경기 기록을 가져오는데, 대량 데이터 시 성능 고려 필요 (현재는 충분)

---

## 작업 로그 (최근 10건)
| 날짜 | 담당 | 작업 | 결과 |
|------|------|------|------|
| 03-23 | developer | admin 폴더 (web)->(admin) 라우트 그룹 이동 (13파일, tsc 통과, 이중 레이아웃 해결) | 완료 |
| 03-23 | developer | profile-header: Win Rate + 가입일 API 연결 (4파일, tsc 통과) | 완료 |
| 03-23 | developer | right-sidebar 양쪽: 하드코딩 -> API 연결 (3개 API, tsc 통과) | 완료 |
| 03-23 | developer | notable-teams.tsx: 더미 배열 -> /api/web/teams API 연결 (tsc 통과) | 완료 |
| 03-23 | developer | recommended-games.tsx: 하드코딩 카드 -> API 동적 렌더링 (tsc 통과) | 완료 |
| 03-23 | developer | 하드코딩→API 연결 4건 (추천경기+팀+사이드바+프로필승률) 8파일 | 완료 |
| 03-23 | planner-architect | 하드코딩 데이터 vs DB/API 연결 전체 분석 (7개 영역, 30+ 파일) | 완료 |
| 03-23 | developer | 커뮤니티 2종 리디자인 (8파일) | 완료 |
| 03-23 | developer | 대진표 리디자인 (7파일) | 완료 |
| 03-23 | developer | 대회 상세 리디자인 (5파일) | 완료 |
| 03-23 | developer | 대회 목록 리디자인 (4파일) | 완료 |
| 03-23 | developer+tester | 프로필 2종 리디자인 (12파일, 28/28 통과) | 완료 |
| 03-23 | developer+tester | 팀 상세 리디자인 (6파일, 14P/1W) | 완료 |
| 03-23 | developer+tester | 팀 목록 리디자인 (3파일, 14P/2W) | 완료 |
| 03-23 | developer | YouTube 인기영상 playlistItems 페이지네이션 (3차 수정) | 완료 |
