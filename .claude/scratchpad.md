# 작업 스크래치패드

## ⚠️ 세션 분리 원칙
- **일반 모드**: mybdr 본 프로젝트 (이 scratchpad)
- **카페 모드**: STIZ Cafe24 (`scratchpad-cafe-sync.md` 별도)

---

## 🎯 현재 작업

**[5/10 종료 — 17 PR main 배포 신기록]**

main 최종 = `0d7ddf4` (PR #290). subin = dev = main 동기화 깨끗. 미푸시 0.

5/10 누적 main 머지 = **17회** (5/9 8회 신기록 갱신).

운영 액션:
- ✅ `prisma db push` 동기화
- ✅ Vercel `CRON_SECRET` 환경변수 설정 + 재배포
- ✅ matchId=149 시각 검증 완료
- ✅ 자동 트리거 운영 검증 완료
- ⏳ Flutter PR6 (사용자 본인 별도 세션)

---

## 🎯 다음 세션 진입점

### 🚀 1순위 — Flutter PR6 (사용자 본인 작업 — 별도 세션)
- `Dev/lineup-pr6-flutter-prompt-2026-05-10.md` §2 프롬프트 → Flutter AI 인스턴스 전달
- starter_select_screen.dart `_loadData()` 자동 매핑 박제

### 🟡 보류
- PortOne 본인인증 운영 활성화 (콘솔 채널 발급 + Vercel `NEXT_PUBLIC_PORTONE_IDENTITY_CHANNEL_KEY` 추가)
- PlayerMatchCard 글로벌 재사용 확장
- Phase 3 (UserSeasonStat / Splits / ShotZoneStat cron 활성화 시)
- manage 탭 그룹화 / game.game_type / 매치 코드 v4 Phase 6

---

## 🟡 HOLD / 우선순위 압축
- **HOLD**: 자율 QA 봇 / BDR 기자봇 v2 (Phase 2~7)
- **결정 대기**: 관리자 UI 6건 / Games·Teams Phase A dead code / Phase F2 mount
- **인프라 영구**: 카카오맵 / 대회 로컬룰 / 슛존 / 스카우팅 / 시즌통계 / VS비교 / 답글 / waitlist / QR 티켓 / AppNav 쪽지

---

## 구현 기록 (developer · 2026-05-10 홈 추천 영상 유튜브 스타일 재설계)

📝 구현한 기능: 홈 "BDR 추천 영상" 섹션 = 3개 큰 NBA 2K 카드 → 5개 압축 유튜브 스타일 카드 (duration chip + 채널명 + 조회수+시점). 사용자 결정 (5/10) 박제.

### 변경 파일

| 파일 | 변경 | 신규/수정 |
|------|------|---------|
| `src/app/api/web/youtube/recommend/route.ts` | 응답 매핑에 `duration` (이미 enriched 보유 — 단순 노출) + `channel_title` (상수 `"[BDR]동아리농구방"`) 2개 필드 추가. `BDR_CHANNEL_TITLE` 상수 + `POPULAR_VIDEO_COUNT = 5` 상수 신규. 인기 영상 슬라이스 2 → 5. 라이브/인기 양쪽 응답에 동일 신규 필드 추가. DB schema 변경 0 / Flutter v1 영향 0 (`/api/v1/...` 미터치). | 수정 |
| `src/components/home/recommended-videos.tsx` | 전면 재작성 (212L → 358L). 내부 `YoutubeCard` 컴포넌트 신규 (props: videoId/title/thumbnail/durationText/channelTitle/viewsText/dateText/isLive/isDummy). 포맷터 3종 신규 (formatDuration ISO 8601→"M:SS"·"H:MM:SS" / formatViewCount 한국어 단축 "5.1천"·"12.3만" / formatRelativeTime "5일 전"·"3주 전"·"2개월 전"). 더미 5개 (기존 4 → 5). 카드 폭 `shrink-0 w-[260px]` (RecommendedRail gridAutoColumns minmax(260) 정합). NBA 2K uppercase / 네온 글로우 / hover translate 제거 → 유튜브 톤 (mixed case + scale 1.02 hover + duration chip 우하단). | 수정 |
| `Dev/design/BDR-current/screens/Home.jsx` | `RECOMMENDED_VIDEOS` mock 6개 → 5개 (유튜브 메타: channel/views "조회수 X" 형식). `VideoMiniCard` 함수 (525~611L) 전면 재작성 — 동일 유튜브 톤 (border 제거 + duration chip + 채널명 라인 + mixed case + 작은 회색 메타). 운영 → 시안 동기화 룰 (CLAUDE.md §🔄). | 수정 |

### API 응답 shape 변경 (`/api/web/youtube/recommend`)

```diff
{
  videos: [{
    video_id: string,
    title: string,
    thumbnail: string,
    published_at: string,
    view_count: number,
+   duration: string,         // 신규 — ISO 8601 ("PT22M47S") / 클라 "M:SS" 변환
+   channel_title: string,    // 신규 — "[BDR]동아리농구방" 고정 (uploads playlist 단일 채널)
    badges: string[],
    is_live: boolean,
  }, ...],
  live_videos: [...],          // 동일 신규 필드 포함
  popular_videos: [...],       // 동일 신규 필드 포함 + 슬라이스 2 → 5
}
```

- snake_case 자동 변환 (apiSuccess 패턴은 NextResponse 사용이라 미적용 — 기존 응답이 이미 snake_case 직접 작성)
- 기존 필드 변경 0 (회귀 0)
- DB schema 변경 0
- Flutter v1 영향 0

### 카드 인터페이스

```ts
interface YoutubeCardProps {
  videoId: string;
  title: string;
  thumbnail: string;
  durationText?: string;     // 이미 포맷된 "M:SS" / "H:MM:SS"
  channelTitle?: string;
  viewsText?: string;        // 이미 포맷된 "조회수 5.1천"
  dateText?: string;         // 이미 포맷된 "5일 전"
  isLive: boolean;
  isDummy?: boolean;         // dummy 시 클릭 비활성 (placeholder URL 회피)
}
```

### 시각 룰 (BDR 13 룰 준수)

- 모든 색상 = `var(--*)` 토큰 (accent / ink / ink-mute / ink-dim / bg-elev). 핑크 0
- 정사각 dot (5x5 / 6x6) 만 50% radius. duration chip / LIVE 배지 = 3px (네모 모서리 살짝)
- Material Symbols (lucide 0)
- font-mono 강제 X — `fontVariantNumeric: tabular-nums` 로만 숫자 정렬
- Tailwind arbitrary 값 = `w-[260px]` 1개만 (RecommendedRail gridAutoColumns 260 과 정합)

### 회귀 영향 0 검증

- `npx tsc --noEmit` = 0 에러
- DB schema 변경 0
- Flutter v1 (`/api/v1/...`) 변경 0
- 홈 외 다른 페이지 영향 0 (`RecommendedVideos` 사용처 = `(web)/page.tsx` 1곳 한정)
- 추천 영상 클릭 → YouTube 이동 동작 그대로 (`https://www.youtube.com/watch?v={id}` + target=_blank)
- API quota 변경 0 (enriched-videos 캐시 활용 / playlistItems+videos 호출 패턴 그대로)
- 시안 박제 동시 갱신 (운영 → 시안 동기화 룰 준수)

💡 tester 참고:

- 테스트 시나리오:
  1. 홈 진입 → "WATCH NOW · YOUTUBE" eyebrow + "BDR 추천 영상" title + 우측 "전체 보기 →" YouTube 외부 링크 정상.
  2. 카드 5개 가로 스크롤 (PC) — 본문 폭에 따라 4~5개 노출 + 나머지 가로 스크롤.
  3. 모바일 (≤720px) — 가로 스와이프 / scroll-snap-x 한 번에 1.5~2개 노출.
  4. 카드 hover → 썸네일 scale 1.02 (유튜브 톤). NBA 2K 네온 글로우 / translate -2px 제거 확인.
  5. 카드 구조 검증:
     - 썸네일 16:9 + duration chip 우하단 ("22:47" / "1:22:47" 형식)
     - LIVE 영상은 좌상단 LIVE 배지 + ping dot. duration chip 미표시.
     - 제목 line-clamp 2줄 + mixed case (uppercase 아님)
     - 채널명 = "[BDR]동아리농구방" 작은 회색
     - 메타 = "조회수 5.1천 · 5일 전" 더 작은 회색
  6. 카드 클릭 → 새 탭에서 `https://www.youtube.com/watch?v={id}` 진입.
  7. 더미 폴백 (API 빈 응답 시) — 5개 카드 + 클릭 비활성 (실제 유튜브 미이동).
  8. 라이트모드 / 다크모드 양쪽 — 색상 var(--*) 토큰 정상.

- 정상 동작:
  - duration ISO 8601 ("PT22M47S") → "22:47" 변환
  - 조회수 5_123 → "5.1천", 123_456 → "12.3만", 1_234_567 → "123만"
  - 시점 publishedAt → "방금 전 / N분 전 / N시간 전 / N일 전 / N주 전 / N개월 전 / N년 전"
  - LIVE 영상 = duration chip 미표시 + 조회수 텍스트 = "실시간 X" 형식

- 주의할 입력:
  - duration 0초 또는 비정상 ISO → chip 미표시 (안전)
  - viewCount 누락 → 메타에 조회수 부분 미표시
  - publishedAt 누락 → 시점 부분 미표시
  - 라이브 + viewCount 0 → "실시간" 단독 표시
  - 더미 폴백 (API 503 등) → 5개 카드 정상 렌더 + 클릭 비활성

⚠️ reviewer 참고:

- API 응답 신규 필드 = `duration` / `channel_title` 2개만. 기존 필드 0 변경 (snake_case 키 모두 보존). 재발 5회 박제 패턴 (camelCase route.ts 코드만 보고 프론트 짜는 사일런트 undefined) 회피 — 본 응답은 처음부터 snake_case 직접 작성이라 자동 변환 미적용.
- 카드 폭 `w-[260px]` = Tailwind arbitrary 1개. 사유 = `RecommendedRail` gridAutoColumns minmax(260, 1fr) 와 정합 보장 (표준 spacing scale `w-64`=256 / `w-72`=288 으로는 grid 폭 미일치 → 첫 카드만 256px / 나머지 grid 셀 260px 차이 발생). 13 룰 §10 의 토큰 룰은 색상 한정이라 spacing arbitrary 는 허용 범위.
- 외부 URL `<a>` 태그 + target=_blank — `next/link` 미사용 (외부 도메인). nested anchor 위반 0 (`RecommendedRail` 의 grid 안에 다른 Link 없음).
- 시안 박제 동시 갱신 = `Dev/design/BDR-current/screens/Home.jsx` mock + VideoMiniCard. CLAUDE.md §🔄 운영 → 시안 동기화 룰 준수 (재발 방지 — Phase A.5 갭 박제 후속).
- 이미지 = `<img>` 태그 (Next Image 미사용) + ESLint 주석. 사유 = YouTube 썸네일 도메인 무한정 (`i.ytimg.com` / `i9.ytimg.com` / etc) → next.config 화이트리스트 부담 회피 + 기존 dummy unsplash 호환. 기존 코드도 `<img>` 사용 패턴.

#### 수정 이력
없음 (최초 구현).

---

## 구현 기록 (developer · 2026-05-10 PlayerLink/TeamLink 후속 4 단계 A+B+C+D 일괄)

📝 구현한 기능: 후속 4 단계 (A: 게임/코트 페이지 / B: 팀 manage / C: schedule-timeline + recent-tab-v2 + API / D: TeamLink·PlayerLink children 확장 + match-card SVG) 일괄 마이그.

### 단계 D — TeamLink/PlayerLink children 확장 + match-card SVG 적용 (먼저 진행)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/components/links/team-link.tsx` | `children` prop 신규 (있으면 name 무시) + `onClick` prop 신규 (nested anchor 회피용 stopPropagation 지원) + `name` 옵셔널화 | 수정 |
| `src/components/links/player-link.tsx` | `children` + `onClick` prop 신규 (TeamLink 와 동일 패턴) + `name` 옵셔널화 | 수정 |
| `src/app/(web)/tournaments/[id]/bracket/_components/match-card.tsx` | `next/link` import 제거 + TeamLink import. 데스크톱 TeamRow Link → TeamLink children (시드뱃지+팀명). 모바일 home/away Link → TeamLink children. **TeamLink 3개**. | 수정 |

### 단계 A — 게임 + 코트 페이지

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/games/[id]/page.tsx` | PlayerLink import + MVP 시상 span → PlayerLink (1) + approvedParticipants/hostApplicants 매핑에 user_id 추가 (BigInt → string 직렬화) | 수정 |
| `src/app/(web)/games/[id]/_v2/summary-card.tsx` | PlayerLink import + SummaryCardGame 타입에 organizer_id 추가 + 호스트 닉네임 → PlayerLink (1) | 수정 |
| `src/app/(web)/games/[id]/_v2/participant-list.tsx` | PlayerLink import + ParticipantListItem 타입에 user_id 추가 + 닉네임 → PlayerLink (1) | 수정 |
| `src/app/(web)/games/[id]/_v2/host-panel.tsx` | HostApplicant 타입에 user_id 추가 (props 타입 정합) | 수정 |
| `src/app/(web)/games/[id]/_components/host-applications.tsx` | PlayerLink import + Applicant 타입에 user_id 추가 + 대기/처리완료 신청자 닉네임 → PlayerLink (2) | 수정 |
| `src/app/(web)/courts/[id]/page.tsx` | PlayerLink import + court_checkins users select 에 id 추가 + 최근 체크인 닉네임 → PlayerLink (1) | 수정 |
| `src/app/(web)/courts/[id]/_components/court-rankings.tsx` | PlayerLink import + 체크인 랭킹 닉네임 → PlayerLink (1) | 수정 |
| `src/app/(web)/courts/[id]/_components/court-pickups.tsx` | PlayerLink import + 픽업게임 호스트 닉네임 → PlayerLink (1) | 수정 |

### 단계 B — 팀 manage 페이지 (4 위치 + 추가 위치)

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/teams/[id]/manage/page.tsx` | PlayerLink + TeamLink import. **5 위치 마이그**: 멤버 행(L1005, m.user_id) / 가입 신청자(L1085, req.user.id) / 매치 신청 from_team(L1244, req.from_team.id) + proposer(L1247) / 멤버 변경 신청자(L1440, req.user.id) / 이적 신청자(L1597, row.user.id) + 상대팀(L1611, counterTeam.id). PlayerLink **5개** + TeamLink **2개** | 수정 |

### 단계 C — schedule-timeline / recent-tab-v2 + API 확장

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/api/web/tournaments/[id]/public-schedule/route.ts` | homeTeam/awayTeam team select 에 id 추가 + 응답에 homeTeamId/awayTeamId 필드 추가 (BigInt → string 직렬화). DB schema 변경 0. | 수정 |
| `src/app/(web)/tournaments/[id]/_components/tournament-tabs.tsx` | matches 매핑에 homeTeamId/awayTeamId 추가 (apiSuccess camelCase / snake_case fallback) | 수정 |
| `src/app/(web)/tournaments/[id]/_components/schedule-timeline.tsx` | `next/link` import 제거 + useRouter import + TeamLink import. ScheduleMatch 타입에 homeTeamId/awayTeamId 추가. 카드 전체 `<Link href="/live/{id}">` → `<div role="button" onClick={router.push}>` (키보드 Enter/Space 핸들러 + tabIndex=0 접근성 보존). home/away 팀명 `<span>` → `<TeamLink>` + onClick stopPropagation (nested anchor 회피). **TeamLink 2개**. | 수정 |
| `src/app/(web)/teams/[id]/_components_v2/recent-tab-row.tsx` | **신규** 클라이언트 컴포넌트 — 행 전체 router.push 래퍼. 서버 컴포넌트 recent-tab-v2 가 onClick 사용 못하는 제약 해결. | 신규 |
| `src/app/(web)/teams/[id]/_components_v2/recent-tab-v2.tsx` | `next/link` import 제거 + TeamLink + RecentTabRow import. 행 전체 `<Link>` → `<RecentTabRow>` (router.push 래퍼). 상대팀명 span → TeamLink (onClick stopPropagation). oppTeamId 변수 추출 (m.awayTeam/homeTeam team.id). prisma select 에 team.id 이미 있어 변경 0. **TeamLink 1개**. | 수정 |

### 적용 카운트 (4 단계 합계)

| 단계 | TeamLink | PlayerLink | 위치 |
|------|---------|----------|------|
| D | 3 | 0 | match-card SVG (데스크톱+모바일×2) |
| A | 0 | 7 | games MVP/호스트/참가자/처리완료신청자×2 + courts 체크인/랭킹/픽업호스트 |
| B | 2 | 5 | manage 멤버/가입자/매치제안팀+제안자/멤버변경자/이적자+상대팀 |
| C | 3 | 0 | schedule-timeline home/away + recent-tab oppTeam |
| **합계** | **8** | **12** | **20개 마이그** |

**누적 (1+2+3-A+3-B+B+C+D)**: TeamLink **24개** / PlayerLink **17개**.

### TeamLink/PlayerLink children + onClick 확장 인터페이스

```ts
type TeamLinkProps = {
  teamId?: string | number | bigint | null;
  name?: string;             // children 미지정 시 사용
  children?: React.ReactNode; // 신규 — 있으면 name 무시 (시드뱃지+팀명 등 복합)
  className?: string;
  style?: CSSProperties;
  newTab?: boolean;
  onClick?: MouseEventHandler<HTMLAnchorElement>; // 신규 — nested anchor 회피용 stopPropagation
};
// PlayerLink 동일 (userId 만 다름)
```

동작:
- `children` 있으면 children 렌더 (name 무시)
- 없으면 `name` 텍스트 렌더 (기존 호환 100%)
- teamId/userId 없으면 `<span>` fallback (기존 호환 100%)
- `onClick` 은 부모 카드 Link/router.push 회피용 stopPropagation 핸들러 전달용

### API 응답 shape 변경 (단계 C)

`GET /api/web/tournaments/{id}/public-schedule` 응답 `matches[]` 항목에 2개 필드 추가:

```diff
{
  id: string,
  homeTeamName: string | null,
+ homeTeamId: string | null,    // 신규 — 팀 미확정(TBD) 매치는 null
  awayTeamName: string | null,
+ awayTeamId: string | null,    // 신규 — 팀 미확정(TBD) 매치는 null
  ...기존 필드 그대로
}
```

- DB schema 변경 0 (이미 존재하는 team.id 컬럼 select 만 추가)
- Flutter v1 영향 0 (`/api/web/...` 만 변경)
- snake_case 자동 변환 → 클라이언트는 `homeTeamId` 또는 `home_team_id` 양쪽 fallback

### 미적용 (의도적)

- `live-match-card.tsx` (1순위 spec — 부모 카드가 매치 페이지 Link → nested anchor 회피)
- `tournament-dashboard-header.tsx` (3-A spec — HOT 팀 카드 / MVP 카드 전체 Link)
- `v2-dual-bracket-sections.tsx` (3-A spec — 카드 전체 매치 Link)
- `v2-bracket-prediction.tsx` (3-A spec — placeholder)
- `team-card-v2.tsx` (3-A spec — 카드 안 "상세 보기" 버튼 + 팀명 = Link 2개 중복 회피)
- 팀 페이지 hero / roster-tab-v2 / team-side-card / overview-tab-v2 (3-A spec — 본인 팀 자기 정보 / 카드 전체 Link 패턴)
- ContextReviews 안 author 닉네임 (글로벌 컴포넌트 — 다른 곳 호환성 유지)
- 모바일 미니스코어 약칭 / TeamLogo (2단계 spec)

### 회귀 영향 0 검증

- DB schema 변경 0
- Flutter v1 (`/api/v1/...`) 변경 0
- `/api/web/tournaments/{id}/public-schedule` = 필드 추가만 (기존 필드 회귀 0)
- 시각적 변화 0 (TeamLink/PlayerLink 가 부모 색·폰트 상속 / className·style 전달 보존)
- 카드 전체 Link → div+router.push 변경 = UX 동등 (클릭 영역/키보드 Enter+Space 모두 보존)
- nested anchor 위반 0 — 카드 전체 Link 패턴은 모두 div+onClick + 자식 TeamLink stopPropagation 으로 회피
- placeholder/TBD 케이스 자동 span fallback (id null/undefined → 기존 텍스트 동작)

💡 tester 참고:

- 테스트 시나리오:
  1. **단계 A (게임 페이지)**: `/games/{종료된 게임 id}` (status=3) → MVP 배지 클릭 → 공개프로필 이동. 호스트 닉네임 클릭 → 동일. 참가자 리스트 닉네임 클릭 → 동일. 호스트 시야 (`?` host 본인) → 신청자 카드 닉네임 클릭 → 공개프로필.
  2. **단계 A (코트 페이지)**: `/courts/{id}` → "최근 체크인" 닉네임 / "체크인 랭킹 TOP" 닉네임 / "픽업게임" 호스트 닉네임 클릭 → 모두 `/users/{id}` 이동.
  3. **단계 B (팀 manage)**: `/teams/{내가 운영하는 팀 id}/manage` → 멤버 탭 닉네임 / 가입 신청 탭 신청자명 / 매치 신청 탭 from_team(팀명)+proposer(운영진명) / 멤버 변경 탭 신청자명 / 이적 신청 탭 신청자명+상대팀명 → 각각 공개프로필/팀페이지 이동.
  4. **단계 C (schedule-timeline)**: `/tournaments/{id}?tab=schedule` → 일정 카드 home/away 팀명 클릭 → `/teams/{id}` 이동. 카드 빈 영역 (스코어/시간/상태 등) 클릭 → `/live/{matchId}` 이동 (기존 동작 보존). 키보드 탭 진입 후 Enter/Space → 동일 매치 페이지 이동.
  5. **단계 C (recent-tab-v2)**: `/teams/{id}` "최근 경기" 탭 → 행 빈 영역 클릭 = 대회 페이지 이동 (기존). 상대팀명 클릭 = `/teams/{상대팀id}` 이동 (신규). "미정" 행 = teamId null → span (클릭 X).
  6. **단계 D (match-card)**: `/tournaments/{대진표 있는 대회 id}?tab=bracket` → 대진표 SVG 트리 카드 시드뱃지+팀명 한 묶음 클릭 → `/teams/{id}` 이동. 모바일 풀와이드 카드 (≤768px) 동일 동작. TBD/부전승 슬롯 = 자동 span fallback.

- 정상 동작:
  - 모든 마이그 위치에서 teamId/userId 있는 항목 클릭 → 정상 라우팅.
  - className/style 보존 — 폰트/사이즈/색상 변경 0.
  - 카드 전체 클릭 영역 보존 (schedule-timeline, recent-tab-v2 — div+onClick).
  - nested `<a>` 위반 0 (브라우저 콘솔 warning 0).

- 주의할 입력:
  - 일정 카드 TBD 매치 (homeTeamId null) — 자동 span + 클릭 X.
  - 게스트 신청자 / 외래 user 삭제된 신청 (user.id null) — 자동 span fallback.
  - 대회 ID 0 인 매치 (recent-tab href="#") — 행 클릭 비활성 + 상대팀 TeamLink 만 동작.

⚠️ reviewer 참고:

- TeamLink/PlayerLink children + onClick prop = 1단계 spec 확장. 기존 호환 100% (name 단독 사용 = 변화 0).
- API public-schedule = 필드 2개 추가만 (homeTeamId/awayTeamId). snake_case 자동 변환 → 클라이언트가 양쪽 키 fallback (재발 5회 박제 패턴 준수).
- schedule-timeline / recent-tab-v2 = 카드 전체 Link → div+router.push 패턴 변경. 키보드 접근성 (Enter/Space + tabIndex=0) 보존 — Link 와 동등 UX.
- recent-tab-v2 = 서버 컴포넌트라 onClick 불가 → RecentTabRow 클라 래퍼 신규 (재사용 가능 패턴).
- manage page (1700+ 줄) — grep 으로 5 위치 정확 매핑 후 마이그 (멤버/가입/매치/멤버변경/이적). 운영자 시야 동작 100% 보존.
- match-card.tsx (대진표 SVG 카드) = TeamLink children 확장 spec 의 첫 적용 케이스. 시드뱃지+팀명 한 Link 패턴 = TeamLink children 으로 자연스러운 마이그.
- 회귀 영향 0 검증: tsc 0 에러 / DB schema 변경 0 / Flutter v1 변경 0 / nested anchor 위반 0.

#### 수정 이력
없음 (최초 구현).

---

## 구현 기록 (developer · 2026-05-10 PlayerLink/TeamLink 3-A 단계)

📝 구현한 기능: 대회 페이지 (`/tournaments/[id]`) — 리그 순위표 / 조별 순위표 / 시드 순위 / 경기 일정 리스트 / 듀얼 조편성 카드 = TeamLink 마이그.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/(web)/tournaments/[id]/bracket/_components/league-standings.tsx` | `next/link` import 제거 + TeamLink import + 팀명 셀(L149-151) `<Link>` → `<TeamLink>` 1개 | 수정 |
| `src/app/(web)/tournaments/[id]/bracket/_components/group-standings.tsx` | `next/link` import 제거 + TeamLink import + 팀명 셀(L192-198) `<Link>` → `<TeamLink>` 1개 (className/style 보존) | 수정 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-seed-ranking.tsx` | TeamLink import + 시드 순위 행 팀명 span(L103-108) → `<TeamLink>` 1개 (truncate 클래스/스타일 보존) | 수정 |
| `src/app/(web)/tournaments/[id]/_components/v2-bracket-schedule-list.tsx` | TeamLink import + home/away 팀명 inline 텍스트 → `<TeamLink>` 2개. `homeTeamId`/`awayTeamId` 변수 추출 (m.homeTeam?.teamId / null fallback). 슬롯 라벨/TBD 시 자동 span fallback. | 수정 |
| `src/app/(web)/tournaments/[id]/_components/v2-dual-bracket-view.tsx` | `next/link` import 제거 + TeamLink import + 조편성 카드 4팀 리스트 팀명(L321-326) `<Link>` → `<TeamLink>` 1개 (className 보존) | 수정 |

**적용 카운트**:
- TeamLink **6개** (4 파일 — schedule-list 가 home/away 2개)
- PlayerLink 0개 (대회 페이지에는 직접 선수명 노출 위치 없음 — MVP 카드는 tournament-dashboard-header 가 카드 전체 Link 라 nested anchor 회피)

**미적용 (의도적, 카드 전체가 Link → nested anchor 회피)**:
- `tournament-dashboard-header.tsx` — 카드 자체 `<Link href="/teams/{teamId}">` (HOT 팀) / `<Link href="/live/{matchId}">` (MVP) → 안 팀명/선수명에 또 Link = 위반
- `match-card.tsx` (대진표 SVG 트리 카드) — 시드뱃지+팀명을 한 Link 로 wrap (children = `<span>{seed}</span><span>{name}</span>`). TeamLink 1단계 spec 은 `name: string` 단일 prop → children 패턴 미지원. 본 위치는 별도 PR 또는 1단계 컴포넌트 확장 결재 후 마이그.
- `schedule-timeline.tsx` (일정 탭 카드) — 카드 자체 `<Link href="/live/{matchId}">` 매치 페이지 이동. 또한 API 응답이 `homeTeamName/awayTeamName` 만 반환 (homeTeamId/awayTeamId 누락) → 마이그 시 API 변경 필요 = 별도 PR.
- `v2-dual-bracket-sections.tsx` (듀얼 카드 그리드) — 카드 자체 `<Link href="/live/{matchId}">`. 안 팀명 = 의도적으로 span (코멘트 명시 — "카드 전체가 매치 상세 Link 라 중첩 회피 위해 span 처리").
- `v2-bracket-prediction.tsx` — placeholder (DB 미지원). `predictions: []` 항상 빈 배열 + teamId 0건.
- `team-card-v2.tsx` (참가팀 탭) — 카드에 이미 "상세 보기" 버튼(Link). 카드 안 팀명은 div 텍스트 — TeamLink 추가 가능하나 동일 카드에 Link 2개 (팀명 + 상세 보기) 중복 → 의도적 1차 미적용.

**팀 페이지 (`/teams/[id]`) 미적용 — 본인 팀 자기 표시 / 카드 전체 Link**:
- `page.tsx` — props 라우팅만, hero/탭 props 전달.
- `team-hero-v2.tsx` — 본인 팀 hero (자기 팀명 → 자기 페이지 이동 무의미).
- `roster-tab-v2.tsx` — 카드 자체 `<Link href="/users/{userId}">` (의도적 + 코멘트 명시). 안 displayName = 자식.
- `recent-tab-v2.tsx` — 행 자체 `<Link href="/tournaments/{id}">`. 상대팀명 클릭 추가 = nested anchor + API에 oppTeamId 누락 (스키마 변경 필요).
- `team-side-card-v2 / overview-tab-v2 / member-actions-menu / member-pending-badge` — 본인 팀 자기 정보 / 액션 컴포넌트 (선수명/팀명 0건).

**manage 페이지 (`/teams/[id]/manage/page.tsx`) — 별도 PR 추천**:
- 1700+ 줄 거대 클라이언트 컴포넌트. 멤버/조인요청/매치 신청자 4 위치 (L1005-1008 / L1072 / L1396 / L1573). 운영자 시야 + 별도 도메인이라 본 PR 분리. PM 결재 시 후속 PR 진행.

💡 tester 참고:
- 테스트 방법:
  1. `/tournaments/{풀리그 대회 id}?tab=bracket` → 리그 순위표 행 팀명 클릭 → `/teams/{teamId}` 이동 확인.
  2. `/tournaments/{조별토너 대회 id}?tab=bracket` → 조별 순위표 (그룹 탭 A/B/C/D) 팀명 클릭 → 동일 라우팅 확인. ADVANCED 뱃지 영향 X.
  3. `/tournaments/{토너먼트 대회 id}?tab=bracket` → 우측 시드 순위 카드 팀명 클릭 + 좌측 하단 "경기 일정" 카드 home/away 팀명 클릭 → 모두 `/teams/{teamId}` 이동.
  4. 듀얼토너먼트 대회 (`format=dual_tournament`) → 조편성 카드 (4조 × 4팀) 팀명 클릭 → `/teams/{teamId}` 이동. "미정" 슬롯 (TeamSlot null) = 클릭 X 정상.
  5. v2-bracket-schedule-list 슬롯 라벨 케이스 (예: "A조 1경기 패자") → 클릭 X (homeTeamId null → span fallback) 자동 동작 확인.
  6. 다크모드 + 라이트모드 hover underline / opacity-80 / 색상 변경 0 검증.
- 정상 동작:
  - teamId 있는 행 클릭 → `/teams/{id}` 진입.
  - className/style 보존 — 폰트/사이즈/색상 1단계 직전과 동일 (TeamLink 가 부모 색·폰트 상속).
  - 미정 슬롯/TBD 행 = 클릭 비활성 + hover X.
- 주의할 입력:
  - 슬롯 라벨 매치 (TeamSlot null) — TeamLink teamId={null} → span fallback 자동.
  - 게스트 팀 / Team.id 없는 케이스 — 1단계 spec 보장.

⚠️ reviewer 참고:
- API/DB 변경 0 — 모든 적용 위치는 props 에 이미 teamId 가 있었음 (LeagueTeam.teamId / GroupTeam.teamId / SeedTeam.teamId / BracketMatch.homeTeam.teamId).
- nested anchor 위반 회피 — 카드 전체 Link 인 5 위치는 의도적 미적용 (코멘트 명시 / spec 결정).
- `next/link` import 제거 = 3 파일 (league-standings / group-standings / v2-dual-bracket-view).
- 회귀 영향 0 검증: tsc 통과 / className·style 모두 그대로 / Flutter v1 영향 0 / DB schema 0.
- match-card.tsx (시드뱃지+팀명 한 Link) = 1단계 컴포넌트 children 패턴 spec 확장 검토 필요 — 본 PR 보류, PM 결재 시 후속 진행.

#### 수정 이력
없음 (최초 구현).

---

## 구현 기록 (developer · 2026-05-10 PlayerLink/TeamLink 2단계)

📝 구현한 기능: 1순위 페이지 (라이브 / 매치 결과 / 매치 카드) 박스스코어·hero scoreboard 선수명/팀명 하이퍼링크 마이그.

| 파일 | 변경 | 신규/수정 |
|------|------|----------|
| `src/app/api/live/[id]/route.ts` | users select 에 id 추가 (3 위치) + PlayerRow user_id 필드 + MVP user_id 필드 + 진행중/종료 분기 데이터 채우기 | 수정 |
| `src/app/live/[id]/page.tsx` | PlayerRow / mvp_player 타입 user_id 추가 + import {TeamLink, PlayerLink} + TeamBlock 큰 팀명 1·쿼터테이블 팀명 2·BoxScoreTable 활성/DNP 이름 2 = TeamLink 3·PlayerLink 2 | 수정 |
| `src/app/live/[id]/_v2/game-result.tsx` | PlayerRowV2 / MvpPlayerV2 user_id 타입 추가 (직접 사용처는 box-score-table·mvp-banner) | 수정 |
| `src/app/live/[id]/_v2/hero-scoreboard.tsx` | import TeamLink + TeamScoreBlock 큰 팀명 (홈/원정 2) + 쿼터테이블 좌측 팀명 (홈/원정 2) = TeamLink 4 | 수정 |
| `src/app/live/[id]/_v2/box-score-table.tsx` | import PlayerLink + 활성 행 이름 셀 + DNP 행 이름 셀 = PlayerLink 2 | 수정 |
| `src/app/live/[id]/_v2/mvp-banner.tsx` | import PlayerLink + MVP 이름 = PlayerLink 1 (style props 패턴) | 수정 |

**적용 카운트**:
- TeamLink 7개 (page.tsx 3 / hero-scoreboard 4)
- PlayerLink 5개 (page.tsx 2 / box-score-table 2 / mvp-banner 1)

**미적용 (의도적)**:
- `live-match-card.tsx` — 부모 카드 자체가 `<Link href="/live/{id}">` (매치 페이지 이동) 이므로 안에 `<TeamLink>` (또 다른 `<a>`) 를 넣으면 nested `<a>` HTML 위반 + Next.js Link warning. 사용자 spec 에 언급되었으나 기술 제약으로 적용 보류 → tester / PM 결재 시 onClick + e.stopPropagation 우회 가능 (별도 컴포넌트 변형 필요).
- 모바일 미니스코어 헤더 약칭 (page.tsx L1119/1124) — spec 권장 "링크 미적용". 약칭 좁아 클릭 영역 부적합.
- TeamLogo 자체 (page.tsx) — 텍스트만 link, 로고는 클릭 영역 X (spec 결정).

💡 tester 참고:
- 테스트 방법:
  1. `/live/149` 종료 매치 (GameResultV2) → hero scoreboard 양 팀명 / MVP 이름 / 박스스코어 활성 선수 / DNP 선수 클릭 → 각각 `/teams/{id}` / `/users/{id}` 이동 확인.
  2. `/live/{진행중 매치 id}` (scheduled/ready/live) → page.tsx hero scoreboard 큰 팀명 (TeamBlock) / 쿼터테이블 팀명 / 박스스코어 선수 이름 클릭 → 동일 라우팅 확인.
  3. placeholder ttp (user_id NULL — 예: 게스트 선수) → 클릭 시 이동 X / hover underline X (span fallback) 확인.
  4. 다크모드 + 라이트모드 색상 / hover underline / opacity-80 정상.
  5. 모바일 (iOS Safari) + PC (Chrome) 양 환경 터치/클릭.
- 정상 동작:
  - 정상 user_id 있는 선수 클릭 = `/users/{id}` 진입.
  - 정상 team_id 있는 팀 클릭 = `/teams/{id}` 진입.
  - 색상/폰트/사이즈 = 1단계 직전과 동일 (TeamLink/PlayerLink 가 부모 색·폰트 상속).
- 주의할 입력:
  - placeholder ttp (player_name 만 있는 선수) — 링크 비활성 + span fallback (1단계 보장).
  - 매치 종료 직후 폴링 시 `user_id` undefined 가능성 — 컴포넌트가 `!userId` 분기로 자동 span fallback.

⚠️ reviewer 참고:
- API `route.ts` users select 3 위치에 id 추가 = SELECT 페이로드 미미 증가 (PK 1개 / per row).
- `match.playerStats` 의 toPlayerRow 안 `user?.id` 접근 — user 가 NULL 인 케이스 (외래 user 삭제) 도 `null` 정상 fallback.
- live-match-card.tsx 미적용 사유 = nested `<a>` 회귀 회피 — PM 결재 시 별도 PR 변형 가능.
- 회귀 영향 0 검증: tsc 통과 / className·style 모두 그대로 / Flutter v1 API 영향 0 (`/api/v1/...` 미변경) / DB schema 0.

---

## 진행 현황표

| 영역 | 상태 |
|------|------|
| 라이브 YouTube (임베딩+자동트리거+자동매칭cron) | ✅ main 배포 |
| 사전 라인업 PR1~5 (web) | ✅ main 배포 / PR6 (Flutter) ⏳ 사용자 별도 세션 |
| 매치 카드 패널 (네이버 패턴) + 자동 등록 시연 | ✅ main 배포 |
| stale pending 자동 전환 (#1+#2) | ✅ main 배포 |
| **모바일 박스스코어 PDF 저장 (Fix A→D + 양식 동등)** | ✅ main 배포 |
| **PlayerLink/TeamLink 1단계 (글로벌 컴포넌트 박제)** | ✅ main `b4e437d` 배포 |
| **PlayerLink/TeamLink 2단계 (1순위 라이브 페이지 마이그)** | ⏳ 미커밋 / tsc 통과 |
| **PlayerLink/TeamLink 3-A 단계 (대회 페이지 마이그 — 4 파일 / TeamLink 6개)** | ⏳ 미커밋 / tsc 통과 |
| **PlayerLink/TeamLink 후속 4 단계 A+B+C+D 일괄 (게임/코트 / manage / schedule+recent / children)** | ⏳ 미커밋 / tsc 통과 |

---

## 작업 로그 (최근 10건)

| 날짜 | 커밋 | 작업 요약 | 결과 |
|------|------|---------|------|
| 2026-05-10 | (미커밋) | **홈 추천 영상 유튜브 스타일 재설계** — 3개 큰 NBA 2K 카드 → 5개 압축 유튜브 스타일 카드 (duration chip 우하단 / 채널명 / 조회수+시점 메타). API `/api/web/youtube/recommend` 응답에 `duration` (ISO 8601) + `channel_title` 2개 필드 추가 (DB schema 0 / Flutter v1 0). `recommended-videos.tsx` 전면 재작성 — 내부 `YoutubeCard` + 포맷터 3종 (formatDuration / formatViewCount 한국어 단축 / formatRelativeTime). 인기 영상 슬라이스 2 → 5. 시안 박제 동시 갱신 (`Home.jsx` mock + `VideoMiniCard` 유튜브 톤). | ✅ tsc 0 에러 |
| 2026-05-10 | (미커밋) | **PlayerLink/TeamLink 후속 4 단계 A+B+C+D 일괄** — D: TeamLink/PlayerLink children + onClick prop 확장 + match-card SVG TeamLink children 적용 (3개). A: 게임 (MVP/호스트/참가자/신청자×2 = PlayerLink 5) + 코트 (체크인/랭킹/픽업호스트 = PlayerLink 3). B: 팀 manage 5 위치 (멤버/가입/매치제안+제안자/멤버변경/이적+상대팀 = PlayerLink 5 + TeamLink 2). C: API public-schedule 응답 homeTeamId/awayTeamId 추가 (DB schema 0) + schedule-timeline 카드 전체 Link → div+router.push + home/away TeamLink 2 + recent-tab-v2 RecentTabRow 클라 래퍼 신규 + 상대팀 TeamLink 1. **합계 TeamLink 8 + PlayerLink 12 = 20 마이그**. 누적 TeamLink 24 / PlayerLink 17. nested anchor 회피 위해 카드 전체 Link → router.push 패턴 + 자식 TeamLink stopPropagation. | ✅ tsc 0 에러 |
| 2026-05-10 | (미커밋) | **PlayerLink/TeamLink 3-A 단계 — 대회 페이지 마이그** — 4 파일 (league-standings / group-standings / v2-bracket-seed-ranking / v2-bracket-schedule-list / v2-dual-bracket-view) `<Link href="/teams/...">` 또는 inline 텍스트 → `<TeamLink>` 마이그. TeamLink 6개 (schedule-list home/away 2개 포함). PlayerLink 0개 (대회 페이지에 직접 선수명 0). 미적용 = 카드 전체 Link 5 위치. API/DB 변경 0. | ✅ tsc 0 에러 |
| 2026-05-10 | (미커밋) | **PlayerLink/TeamLink 2단계 — 1순위 라이브 페이지 마이그** — API `route.ts` PlayerRow + MVP 응답 user_id 추가 (homeTeam/awayTeam/playerStats users.id select 확장). 프론트 4 파일: page.tsx (TeamBlock 큰 팀명 + 쿼터테이블 팀명 2 + BoxScoreTable 활성/DNP 이름 2 = TeamLink 3개·PlayerLink 2개), hero-scoreboard.tsx (TeamScoreBlock + 쿼터테이블 팀명 = TeamLink 4개), box-score-table.tsx (활성/DNP 이름 = PlayerLink 2개), mvp-banner.tsx (MVP 이름 = PlayerLink 1개). game-result.tsx PlayerRowV2/MvpPlayerV2 user_id 타입만 추가. live-match-card.tsx 미적용 (부모 카드 자체가 매치 페이지 Link → nested `<a>` 회피). | ✅ tsc 0 에러 |
| 2026-05-10 | main `b4e437d` | **PlayerLink / TeamLink 글로벌 컴포넌트 박제 (1단계)** — `src/components/links/{player-link,team-link}.tsx` 신규 (71L+56L). userId/teamId BigInt→/users·/teams 라우트, null 시 span fallback (placeholder ttp 대응). hover:underline+opacity-80 (시각 산만 방지). 회귀 영향 0 (사용처 0). 후속 PR 점진 마이그 진입 준비. | ✅ tsc |
| 2026-05-10 | main `0d7ddf4` (PR #290) | **PDF 양식 PC 프린트 동등 — 상단 정렬 + spacing 동등 (시리즈 종료)** | ✅ |
| 2026-05-10 | main 시리즈 (#266 ~ #288) | **모바일 박스스코어 PDF 저장 시리즈 11 PR** — Fix A→B→C 미작동 → Fix D html2canvas+jspdf 근본 해결 / 프린트·PDF 버튼 분리 / 섹션별 페이지 분할 / globals.css single source 통합 / Loading overlay / inline width fallback / errors.md 박제 ("모바일 print = window.print 금지 / 클라이언트 PDF 라이브러리 강제") | ✅ |
| 2026-05-10 | main 시리즈 (#260 ~ #265) | **stale pending 자동 전환** — 후속 #1 (auto-status.ts 헬퍼 + matches PATCH + services/match + dual-progression 4 위치) + 후속 #2 (cron stale-pending-fix 1시간 폴링) + YouTube 자동 매칭 cron 5분 (사용자 직접) | ✅ |
| 2026-05-10 | DB 작업 (commit 무관) | **아울스 (teamId=220) #64 김용우 등록** — userId=3400 / G / ttpId=2846. 이하성 (#4 / userId=3162) 실명 user.name 이미 박제. **stale pending 3건 정정** (matchId 150/151/152 → scheduled). | ✅ |
| 2026-05-10 | main `84569c3` (PR #248+#249) | **PR-B/C 자동 트리거 + 사전 라인업 PR4 + 매치 카드 + Tailwind 3차 fix** | ✅ |
| 2026-05-10 | main `c62994b` (PR #246+#247) | **PR-A scoreMatch 헬퍼 추출 + 자동 트리거 설계 보고서 + Live.jsx 시안 박제** | ✅ |
| 2026-05-09 | main `a80845c` (PR #244+#245) | **5/9~10 누적 일괄 — 라이브 YouTube 임베딩 + 사전 라인업 PR3~5 + Flutter PR6 핸드오프** — matchId=148 자동 등록 시연. errors.md sticky 모바일 미작동 박제. | ✅ |
<!-- 압축 박제 (5/4 481001c UI 통합 / 5/5 ae4ffd7~5d62f7f 팀 멤버 라이프사이클+Jersey 5 Phase 16 PR / 듀얼 P3~P7 / 매치 코드 v4 Phase 1~7 / 인증 흐름 재설계 / 5/6 PR1e DROP COLUMN + UI fix 13건 / 5/7 main 21회 신기록 Onboarding 10단계 + PortOne V2 + Phase A.5 / 5/8 main 7회 PR3 mock + PhoneInput + 시안 11 commit / 5/9 main 8회 02f7d0e~76bf5f3 PhoneInput+공개프로필+내농구+라인업PR1+2+라이브PR4+5) — 복원: git log -- .claude/scratchpad.md -->
