# 라이브 페이지 YouTube 라이브 임베딩 — 기획서

> 작성일: 2026-05-09 / 작성자: planner-architect
> 대상 페이지: `/live/[id]` (TournamentMatch 라이브 페이지)
> Status: 결재 대기 (Q1~Q9)
> 진행 권장 시점: 5/10 D-day(동호회최강전) 후

---

## §1. 배경 / 사용자 요구사항

### 왜 — 컨텍스트
- **5/9 D-day 동호회 최강전 운영 중** + 5/9 RecommendedVideos 부활 (`858936e`) → YouTube API 인프라(`/api/web/youtube/recommend`) + Redis cache + uploads playlist (150건) 완전 구축됨.
- 라이브 페이지 (`/live/[id]`) 는 minutes-engine v3 + STL Phase 1 + 5/4 sticky+팀비교 + 매치 코드 v4 박제 진행 중.
- **현재 상태**: 라이브 매치 진행 중에 외부 시청자가 페이지 진입해도 영상 0건 — 점수판/박스스코어만 노출됨. 영상 시청은 별도 YouTube 탭으로 이탈 필요.

### 사용자 요구사항 (2건)
| # | 흐름 | 우선순위 |
|---|------|---------|
| 1 | **기본 흐름** — 대회 관리자가 YouTube 링크 복사 → 라이브 페이지 입력 필드에 붙여넣기 → 자동 임베딩 | 필수 (P1) |
| 2 | **선택 흐름** — BDR YouTube 채널 (@BDRBASKET) 에서 매치 **제목 + 시간** 일치 영상 자동 검색 → 자동 임베딩 | 개선 (P2) |

### 인프라 인지 (재사용 가능)
| 자산 | 위치 | 재사용 |
|------|------|------|
| YouTube Data API v3 키 | `process.env.YOUTUBE_API_KEY` (Vercel Production) | ✅ |
| BDR uploads playlist ID | `process.env.BDR_YOUTUBE_UPLOADS_PLAYLIST_ID` | ✅ |
| 영상 메타데이터 fetcher | `fetchEnrichedVideos()` (`/api/web/youtube/recommend/route.ts`) — 150건 / 30분 cache | ✅ (확장) |
| Redis cache | Upstash (`UPSTASH_REDIS_REST_URL`/`TOKEN`) | ✅ |
| CSP iframe 정책 | `next.config.ts` `frame-src https://www.youtube.com https://www.youtube-nocookie.com` | ✅ 이미 등록됨 |
| 라이브 v2 페이지 | `src/app/live/[id]/page.tsx` (1800L, GameResultV2 + HeroScoreboard + tabs 5종) | ✅ 임베드만 추가 |
| 권한 헬퍼 | `tournament-auth.ts` (organizer / tournamentAdminMember.is_active=true / tournament_recorders) | ✅ |
| 시안 baseline | `Dev/design/BDR-current/screens/Live.jsx`, `LiveResult.jsx` (영상 임베드 영역 미존재 → 시안 갱신 필요) | ⚠ 후속 |

---

## §2. 데이터 모델 — 옵션 비교

### 옵션 A. `tournament_matches` 단일 테이블 (단순, 권장)
```prisma
model TournamentMatch {
  // 신규 1 컬럼
  youtube_video_id  String?   @map("youtube_video_id")  @db.VarChar(20)
  // (선택) 메타: live | upcoming | none, 마지막 검증 시각
  youtube_status    String?   @map("youtube_status")    @db.VarChar(10)
  youtube_verified_at DateTime? @map("youtube_verified_at") @db.Timestamp(6)
}
```
- **장점**: ADD COLUMN NULL 무중단 / 단일 SELECT / 매치 1건 = 영상 1건 (1:1)
- **단점**: 다중 카메라 / 재방송 시 확장 어려움
- **공간**: ~20 byte/row × 매치 수천 = 무시 수준

### 옵션 B. `match_streams` 별도 테이블 (확장성)
```prisma
model MatchStream {
  id           BigInt   @id @default(autoincrement())
  matchId      BigInt   @map("match_id")
  platform     String   @db.VarChar(20)  // youtube, twitch, kakaotv
  videoId      String   @map("video_id") @db.VarChar(50)
  url          String?  @db.VarChar(500)
  isLive       Boolean  @default(false) @map("is_live")
  isPrimary    Boolean  @default(true)  @map("is_primary")
  detectedBy   String   @map("detected_by") @db.VarChar(20) // manual | auto
  createdAt    DateTime @default(now()) @map("created_at") @db.Timestamp(6)
  match        TournamentMatch @relation(...)
  @@index([matchId])
}
```
- **장점**: 다중 플랫폼 (YouTube + 트위치 + 카카오TV) / 다중 영상 (메인 + 서브 카메라) / 재방송 link 분리
- **단점**: 신규 테이블 + JOIN 필수 / 1단계는 over-engineering

### 옵션 C. `match.metadata` JSON 컬럼
- **장점**: schema 변경 0
- **단점**: 인덱스/쿼리 어려움 / 타입 안정성 0

### 권장
**옵션 A** (1단계 P1 흐름) → 6개월 후 다중 플랫폼 요구 시 옵션 B 마이그.
- ADD COLUMN 무중단 / Flutter v1 영향 0 (`/api/v1/...` schema query 비포함 컬럼만 추가) / TS 타입 자동 생성.

---

## §3. 자동 검색 알고리즘 — BDR 채널 ↔ 매치 매칭

### 입력
- 매치 정보: `homeTeam.name` + `awayTeam.name` + `tournament.name` + `roundName` + `scheduledAt` + `started_at` + `match_code`
- BDR 채널 영상: `fetchEnrichedVideos()` 결과 (uploads playlist 150건 — 라이브 + VOD 혼재)

### 매칭 로직 (3단계)

#### 1단계 — 시간 매칭 (필수 가드)
- 영상 = 라이브 (`liveBroadcastContent === "live"`) → 매치 `started_at` ± 60분 / `scheduledAt` ± 60분
- 영상 = VOD (`liveBroadcastContent === "none"`) → 영상 `publishedAt` ≥ 매치 `scheduledAt` ± 24시간
- **임계값**: 시간 일치 = +50점 / 시간 ±2배 일치 = +20점 / 시간 무관 = 0점

#### 2단계 — 제목 키워드 매칭
- 매치 키워드 추출 (정규화):
  - 홈 팀명 (예: "열혈농구단")
  - 어웨이 팀명 (예: "BDR 올스타")
  - 대회명 (예: "동호회최강전")
  - 라운드 (예: "결승" / "8강" / "Final")
  - 매치 코드 (예: "26-GG-MD21-001")
- 영상 제목 (`video.title`) + 설명 (`video.description`) 에서 키워드 매칭:
  - 양 팀명 모두 포함 = +30점
  - 한 팀명만 포함 = +15점
  - 대회명 포함 = +10점
  - 라운드명 포함 = +5점
  - 매치 코드 포함 = +20점 (가장 강한 시그널)

#### 3단계 — 채널 매칭 (BDR 단독)
- 영상 채널 ID = BDR (`UC...` from `BDR_YOUTUBE_UPLOADS_PLAYLIST_ID` 도출) → +20점
- 외부 채널 → 0점 (수동 등록만 허용)

### 신뢰도 점수 → 분기
| 점수 | 분기 |
|------|------|
| ≥80 | 자동 등록 (관리자 알림만) — 권장 임계값 |
| 50~79 | 후보 N건 노출 → 관리자 수동 선택 |
| <50 | fallback (수동 URL 입력만) |

### YouTube Data API endpoint (재사용 + 신규)
- 재사용: `/playlistItems` (BDR uploads, 150건) — 기존 `fetchPlaylistItems()`
- 재사용: `/videos?part=snippet,liveStreamingDetails,...` — 기존 `fetchVideoDetails()`
- 신규 (옵션): `/search?channelId={BDR}&q={keyword}&publishedAfter=...&publishedBefore=...&eventType=live` — quota 100/call (uploads 검색으로 충분 시 미사용)

---

## §4. 관리자 UI — 매치 관리 페이지 또는 라이브 페이지 운영자 영역

### 진입점 (옵션)
- **A. 라이브 페이지 직접** — `/live/[id]` 헤더 우측 운영자 버튼 ("YouTube 영상" 모달 trigger)
  - 사유: 5/5 PR4 매치 jersey override 모달 패턴 재사용 (`MatchJerseyOverrideModal`)
  - admin-check API 통과한 운영자만 노출
- **B. 매치 관리 페이지** — `/admin/tournaments/[id]/matches/[matchId]` 또는 `/manage/tournaments/[id]`
  - 사유: 라이브 외 별도 UI 분리

### 권장: A (라이브 페이지 모달, 패턴 재사용 + 빠른 진입)

### 모달 구성 (3섹션)
1. **YouTube URL 입력** (필수 1차)
   - 입력 필드 1개 (URL 또는 video ID 11자)
   - 자동 추출 정규식: `youtu.be/{id}` / `youtube.com/watch?v={id}` / `youtube.com/embed/{id}`
   - 미리보기 (썸네일 + 제목 + 라이브 여부) — `/videos` API 1회 호출
2. **BDR 채널 자동 검색** (선택 2차)
   - 버튼: "BDR 채널에서 자동 검색"
   - 결과: 후보 N건 표 (썸네일 + 제목 + 신뢰도 점수 + 라이브 뱃지 + "선택" 버튼)
   - 빈 결과: "BDR 채널에 일치 영상 없음 — 수동 URL 입력하세요"
3. **현재 등록 영상 노출 + 제거**
   - 등록 시: video preview + "제거" 버튼

---

## §5. 라이브 페이지 임베딩

### 위치 옵션
| 옵션 | 위치 | 장점 | 단점 |
|------|------|------|------|
| A | hero 영역 위 (스코어보드 위) | 영상 우선 노출 | 점수 확인 스크롤 |
| B | hero 영역 아래 + sticky 가능 | 점수 + 영상 균형 | 모바일 영상 작음 |
| C | tabs 신규 "영상" 탭 | 깔끔 분리 | 영상 발견 못 함 |

**권장**: B (hero 아래 + 모바일 sticky 옵션)

### 구현 (iframe)
```tsx
// 의사 코드 — 토큰 변수는 BDR-current/tokens.css 사용
<div className="aspect-video w-full overflow-hidden rounded">
  <iframe
    src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&modestbranding=1`}
    title="라이브 중계"
    referrerPolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
    allowFullScreen
    className="h-full w-full"
  />
</div>
```
- `youtube-nocookie.com` 사용 (privacy 강화 — CSP 이미 등록됨)
- `autoplay=1&mute=1` — Chrome autoplay 정책 우회 (사용자 클릭 시 unmute)
- `modestbranding=1` — YouTube 로고 최소화

### 라이브 vs VOD 분기 표시
| 상태 | UI |
|------|------|
| 라이브 | 빨간 LIVE 뱃지 + 시청자 수 (`liveStreamingDetails.concurrentViewers`) + 채팅 link (`activeLiveChatId` 있으면) |
| VOD | 회색 "다시보기" 뱃지 + 게시일 |
| 영상 미등록 | 영역 hidden 또는 placeholder ("영상 준비 중") |

### 모바일 가드 (5/9 conventions.md 4 분기점)
| 분기점 | 동작 |
|--------|------|
| 360px | iframe 16:9 가로 100% / 점수판 위 sticky 옵션 hidden |
| 720px | iframe + 점수판 stack |
| 900px+ | iframe + minutes-engine 좌우 분할 (선택 — 1단계 미적용) |
| 1024px+ | iframe 최대 너비 720px / 좌우 여백 |

---

## §6. 권한 / API

### 등록 권한 (3 role)
| Role | 가능 |
|------|------|
| super_admin | ✅ 모든 매치 |
| organizer (Tournament.organizer_id) | ✅ 본인 대회 매치 |
| tournamentAdminMember (is_active=true) | ✅ 소속 대회 매치 |
| tournament_recorders | ⚠ 결재 (Q7) |
| 일반 사용자 | ❌ |

### 신규 API (3건)

#### 1. `POST /api/web/tournaments/[id]/matches/[matchId]/youtube-stream` — 등록/갱신
- **Auth**: `withWebAuth` + 권한 검증 (super_admin / organizer / tournamentAdminMember)
- **Body**: `{ video_id: string, source: "manual" | "auto" }`
- **검증**: video_id 11자 정규식 + `/videos` API 1회 호출로 실존 검증
- **응답**: `apiSuccess({ video_id, status: "live"|"none", verified_at })`

#### 2. `GET /api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search` — BDR 채널 자동 검색
- **Auth**: `withWebAuth` + 권한 검증
- **로직**: §3 알고리즘 적용 → 후보 N건 (점수 ≥50)
- **Cache**: Redis 30분 (key = `mybdr:youtube:match-search:{matchId}`)
- **응답**: `apiSuccess({ candidates: [{ video_id, title, thumbnail, score, is_live, badges }] })`

#### 3. `DELETE /api/web/tournaments/[id]/matches/[matchId]/youtube-stream` — 제거
- **Auth**: 등록과 동일
- **응답**: `apiSuccess({ removed: true })`

### Flutter v1 영향
- `/api/v1/...` 변경 0 — schema 신규 컬럼 NULL 허용으로 기존 query 영향 0
- 향후 Flutter 앱에서 영상 노출 원하면 `/api/v1/matches/[id]` 응답에 `youtube_video_id` 추가 (별도 PR)

---

## §7. 자동 검색 매칭 로직 상세 (§3 보강)

### 트리거 옵션
| 옵션 | 트리거 | 장점 | 단점 |
|------|------|------|------|
| A | 관리자 수동 ("자동 검색" 버튼) | 단순 / quota 절약 | 수동 진입 필요 |
| B | cron 매치 시작 시 자동 | 무인 운영 | quota 부담 / 매치 N개 동시 시 폭증 |
| C | 매치 status="in_progress" 전환 webhook | 정확 / 효율 | webhook 구축 비용 |

**권장**: A (1단계) → 운영 안정 후 B 도입 (Q3 결재)

### Quota 관리
- YouTube Data API v3 일일 quota: 10,000
- `/playlistItems` = 1 / `/videos` = 1 / `/search` = 100 ⚠
- 자동 검색 = playlistItems 재사용 (cache hit 시 0) + videos 1회 = quota 0~2/매치
- search API 미사용 권장 (uploads 150건으로 충분)

### Cache 정책
| 키 | TTL | 무효화 |
|----|-----|------|
| `mybdr:youtube:enriched` (기존) | 30분 / 라이브 5분 | 자동 |
| `mybdr:youtube:match-search:{matchId}` (신규) | 30분 | 매치 status 변경 시 무효 |

---

## §8. 보안 / CSP

### CSP — 이미 등록됨 ✅
`next.config.ts` line 51:
```
frame-src ... https://www.youtube.com https://www.youtube-nocookie.com
```
→ **변경 0**

### 보안 가드
| 위치 | 가드 |
|------|------|
| 등록 API | `withWebAuth` + 권한 검증 (organizer / admin / recorder) + IDOR 방지 (matchId → tournamentId 일치 검증) |
| iframe | `youtube-nocookie.com` 우선 / `referrerPolicy="strict-origin-when-cross-origin"` / `allowFullScreen` 만 / `sandbox` 미적용 (autoplay 충돌) |
| video_id 입력 | 정규식 11자 검증 + `/videos` 실존 검증 (악의적 video_id 차단) |
| Rate limit | 검색 API 분당 30회/IP (기존 패턴 재사용) |

---

## §9. 모바일 가드 — 4 분기점 (5/9 conventions.md 룰)

§5 표 참조. 추가 룰:
- iOS Safari: `playsinline` 자동 (iframe 기본) / autoplay 정책 `mute=1` 필수
- 안드로이드: 풀스크린 버튼 작동 검증 (allowFullScreen)
- iframe 비율 `aspect-video` (Tailwind) = 56.25% padding-bottom 등가

---

## §10. 회귀 / 영향 분석

| 영역 | 영향 |
|------|------|
| Flutter v1 (`/api/v1/...`) | 0 — schema 컬럼 NULL 허용 |
| 기존 라이브 페이지 (minutes-engine / STL / sticky) | 0 — 신규 영역만 추가 |
| YouTube recommend API (`/api/web/youtube/recommend`) | 0 — 별도 endpoint |
| Redis cache | 신규 키 1건 추가 (`match-search:{matchId}`) |
| CSP / 보안 헤더 | 0 — 이미 등록됨 |
| 시안 (BDR-current) | ⚠ 영상 영역 미존재 → 동기화 후속 큐 (운영 → 시안 역박제) |
| DB 마이그 | ADD COLUMN NULL 1~3건 (옵션 A) — 무중단 |
| YouTube quota | +0~2/매치 등록 (cache hit 99%) — 무시 수준 |

---

## §11. 마이그 단계 + PR 분할 (5 PR 권장)

| PR | 내용 | 의존 | 추정 |
|----|------|------|------|
| PR1 | DB schema (ADD COLUMN `youtube_video_id` + `youtube_status` + `youtube_verified_at`) + 권한 헬퍼 (`canManageMatchStream(userId, matchId)`) + Prisma generate | 없음 | 30분 |
| PR2 | 등록/제거 API (`POST` + `DELETE` `/youtube-stream`) + zod 검증 + IDOR 가드 | PR1 | 1.5시간 |
| PR3 | 라이브 페이지 임베딩 (iframe 컴포넌트 + 라이브/VOD 분기 + 모바일 가드) | PR1 | 2시간 |
| PR4 | 운영자 모달 (수동 URL 입력) — `MatchJerseyOverrideModal` 패턴 재사용 | PR2, PR3 | 2시간 |
| PR5 | 자동 검색 알고리즘 (`GET /youtube-stream/search` + 신뢰도 점수 + Redis cache) + 모달에 검색 결과 노출 | PR2, PR4 | 3시간 |

### 보류 (선택)
- **PR6**: cron 자동 매칭 (매치 시작 webhook) — Q3 결재 후
- **PR7**: 다중 플랫폼 옵션 B 마이그 (match_streams 테이블) — 6개월 후

---

## §12. 추정 시간

| 시나리오 | PR | 시간 |
|---------|----|------|
| 최소 (수동 URL 입력만) | PR1+2+3+4 | ~6시간 |
| 권장 (자동 검색 포함) | PR1~5 | ~9시간 |
| 풀 (cron + 다중 플랫폼) | PR1~7 | ~15시간 |

### 분배 권장
- **수빈 (subin 브랜치)**: PR1 (DB) → PR2 (API) → PR3 (라이브 페이지 임베드) → PR4 (모달)
- **원영 (wonyoung 브랜치)**: PR5 (자동 검색 알고리즘) — Flutter 앱 영상 노출 향후 PR 담당
- 의존 순서: PR1 → PR2/PR3 (병렬) → PR4 → PR5

---

## §13. 사용자 결재 항목 (Q1~Q9)

| Q | 결재 | planner 권장안 | 사유 |
|---|------|---------|------|
| Q1 | 데이터 모델 (A 단일컬럼 / B 별도테이블 / C JSON) | **A** | 1단계 단순 + 무중단 + 6개월 후 B 마이그 가능 |
| Q2 | 자동 검색 신뢰도 임계값 (90/80/70/60) | **80** | 시간+제목+채널 모두 일치 시 80~110 / FP 낮음 |
| Q3 | 자동 검색 트리거 (수동 / cron / 둘 다) | **수동 1단계** | quota 절약 + 운영 안정 후 cron 도입 |
| Q4 | 임베딩 위치 (hero 위 / hero 아래 / 별도 탭) | **hero 아래** | 점수 + 영상 균형 |
| Q5 | 라이브 vs VOD 분기 표시 (LIVE 뱃지 / 시청자 수 / 채팅 link) | **모두 노출** | 라이브 매력 극대화 |
| Q6 | 다중 플랫폼 (YouTube only / 트위치 등 확장) | **YouTube only 1단계** | 옵션 B 후속 마이그 |
| Q7 | 권한 (organizer + admin / + recorder / + super_admin) | **3종 (organizer + admin + super_admin)** | recorder 는 점수 입력 권한만 — 영상 등록 별도 |
| Q8 | PR 분할 깊이 (3 / 4 / 5) | **5** | PR 별 회귀 가드 명확 + 병렬 가능 |
| Q9 | 진행 시점 (5/10 후 / 다음 주 / 다음 달) | **5/10 D-day 후** | 본 D-day 기간 운영 영향 0 우선 |

### 추가 결재 (선택)
- Q10. 시안 (BDR-current/screens/Live.jsx) 동기화 — 영상 영역 추가 시점 (PR3 동시 / 별도 후속 큐)
  - planner 권장: **별도 후속 큐** (5/7 운영 → 시안 역박제 룰 준수)
- Q11. 영상 미등록 시 placeholder vs hidden
  - planner 권장: **hidden** (영상 없을 때 영역 0 — 깔끔)

---

## §14. 다음 액션

1. **사용자**: Q1~Q9 결재 (특히 Q1, Q3, Q9 핵심)
2. **planner**: 결재 후 PR1~5 상세 task 분해
3. **developer (PR1)**: schema ADD COLUMN + Prisma generate + 권한 헬퍼
4. **tester**: PR 별 회귀 검수 (Flutter v1 / 기존 라이브 페이지 / quota 사용량)
5. **PM**: 5/10 D-day 후 진입 + 미푸시 commit 알림 + index.md 갱신

---

## §15. 위험 / 가드

| 위험 | 가드 |
|------|------|
| YouTube quota 폭증 | uploads playlist 재사용 + Redis cache + search API 미사용 |
| 악의적 video_id 입력 | 정규식 11자 + `/videos` 실존 검증 + 권한 가드 3중 |
| iframe 보안 | youtube-nocookie + referrerPolicy + frame-src CSP |
| 매치 종료 후 영상 stale | youtube_status 컬럼 + cron 검증 (옵션 — Q3) |
| Flutter v1 회귀 | schema 컬럼 NULL 허용 + 기존 query 영향 0 검증 |
| 시안 갭 (운영 → 시안 역박제) | PR3 후 BDR-current/screens/Live.jsx 동기화 큐 |

---

**보고서 끝.** Q1~Q9 결재 대기 / 5/10 D-day 후 진입 권장.
