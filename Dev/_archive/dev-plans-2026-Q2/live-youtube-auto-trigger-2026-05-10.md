# 라이브 YouTube 영상 자동 등록 트리거 — 기획서

> 작성일: 2026-05-10 / 작성자: planner-architect
> 대상: 라이브 페이지 (`/live/[id]`) + 신규 무인증 endpoint
> Status: 결재 대기 (Q1~Q7)
> 진행 권장 시점: 라이브 PR1~5 commit push 후

---

## §1. 배경 / 사용자 요구사항

### 컨텍스트
- **5/9** 라이브 YouTube 임베딩 PR1~5 통합 commit 완료 (`0633e44` PR1~3 / `02f7d0e` PR4+5).
- 기존 `GET /youtube-stream/search` API 는 **운영자 권한 + 분당 30회 rate limit + 80점 임계** 알고리즘 박제 완료 (`src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search/route.ts`).
- **현재 상태**: 운영자가 직접 라이브 페이지 모달 진입 → "BDR 자동 검색" 버튼 클릭 → 후보 노출 → 수동 채택. 매치 시작 직전 운영자 미진입 시 영상 미등록 상태 지속.

### 사용자 요구 (5/10 직접 인용)
> "경기 시작 예정시간 10분전~10분후까지 30초에 한 번씩 찾도록 설정하고, 영상을 찾아서 등록완료한 경우는 자동 트리거가 멈추도록 하자"

### 합의된 권장안 (5/10 결정)
| 결정 | 권장 |
|------|------|
| 폴링 위치 | 클라이언트 setInterval 30초 (라이브 페이지 진입자 작동) |
| 트리거 활성 | 누구나 (운영자 X, 일반 viewer 도 작동) |
| 권한 가드 | **무인증 자동 등록 endpoint 신설** — `POST /api/web/match-stream/auto-register/[matchId]` (rate limit 분당 6회/IP, 80점+만 INSERT) |
| 윈도우 | scheduledAt 또는 started_at 기준 ±10분 |
| 멈춤 조건 | `youtube_video_id != null` |
| 기존 search API | 운영자 권한 유지 + 그대로 재사용 (수동 검색용) |

### 기대 효과
- 운영자 미진입 시에도 **일반 viewer 가 라이브 페이지에 들어오는 순간 자동 검색 트리거** → BDR 채널에 매치 영상이 올라오는 즉시 자동 등록 → 임베드 즉시 노출
- 운영자 수동 작업 0 → 운영 부담 감소

---

## §2. 아키텍처 옵션 비교 (3종 / 결정 추천)

| 옵션 | 위치 | 빈도 | 권한 | 일반 viewer 동작 | 비용 | 권장 |
|------|------|------|------|---------------|------|------|
| **A** | 라이브 페이지 클라 setInterval | 30초 | 무인증 + rate limit | ✅ 페이지 진입 시 | 0 (Vercel cron 미사용) | ⭐ |
| B | Vercel Cron 백엔드 | 1분 (최소) | 서버 (cron token) | 사용자 페이지 무관 | Hobby plan: 1일 1회 / Pro: 무제한 | △ |
| C | A + B 하이브리드 | 30초 + 1분 | 둘 다 | 둘 다 커버 | A + B 합산 | △ (분량 ↑) |

### 옵션 A 권장 사유
1. **사용자 명시 = 30초 폴링** — Vercel Cron 최소 1분 주기로 30초 요구 불충족
2. **무인증 endpoint** + rate limit 6회/IP = abuse 방어 충분
3. **80점+만 INSERT** = 잘못된 영상 등록 위험 0 (search/route.ts scoreMatch 알고리즘 신뢰)
4. **페이지 진입자 무 시 폴링 0** = 비용 증가 0 (B 는 매치 1건당 라이브 윈도우 ±10분 = 20분 = 20회 cron 무조건 발동)
5. **5/9 search API 인프라 100% 재사용** — scoreMatch 헬퍼 추출만 하면 됨

### 옵션 B 단점
- Vercel Hobby plan = 일 1회 cron 만 무료 (Pro 필요)
- 매치 N건 동시 윈도우 진입 시 cron 1회당 N매치 동시 처리 → quota 분산 효과 X
- 클라 폴링이 이미 작동하면 cron 중복

### 옵션 C 단점
- 같은 매치 30초 / 1분 둘 다 폴링 → cache hit 99% 라도 분량 ↑
- 별도 cron token / 별도 endpoint 추가로 인프라 복잡도 ↑

→ **옵션 A 단독 채택 권장**

---

## §3. 옵션 A 상세 설계

### 3.1 클라이언트 측 (라이브 페이지 `src/app/live/[id]/page.tsx`)

#### 트리거 조건 (4개 모두 만족 시 활성)
1. `match` 객체 로드 완료 (fetchMatch 응답 후)
2. `match.youtube_video_id == null` (이미 등록되면 폴링 0)
3. `match.scheduled_at` 또는 `match.started_at` 존재
4. 현재 시각이 윈도우 안 (`|now - refTime| <= 10분`)

#### 폴링 동작
- 즉시 1회 실행 (페이지 진입 직후) → 이후 30초 간격 setInterval
- 매 tick 마다 윈도우 검증 → 윈도우 밖이면 clearInterval
- 응답 `registered: true` 받으면 clearInterval + fetchMatch refetch (임베드 자동 노출)

#### 코드 예시 (개략)
```typescript
const [autoRegisterActive, setAutoRegisterActive] = useState(false);

useEffect(() => {
  if (!match || match.youtube_video_id) return;
  if (typeof window === "undefined") return;

  const ref = match.scheduled_at || match.started_at;
  if (!ref) return;
  const refTime = new Date(ref).getTime();
  const WINDOW = 10 * 60 * 1000;

  const checkWindow = () => {
    const now = Date.now();
    return Math.abs(now - refTime) <= WINDOW;
  };

  if (!checkWindow()) return; // 윈도우 밖 — 폴링 시작 X

  setAutoRegisterActive(true);

  const tick = async () => {
    if (!checkWindow()) {
      clearInterval(interval);
      setAutoRegisterActive(false);
      return;
    }
    try {
      const res = await fetch(
        `/api/web/match-stream/auto-register/${match.id}`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data?.data?.registered) {
        clearInterval(interval);
        setAutoRegisterActive(false);
        fetchMatch(); // 매치 refetch → 임베드 즉시 노출
      }
    } catch (err) {
      console.warn("[auto-register] tick failed:", err);
      // tick 실패 시 다음 30초에 재시도 (rate limit 등)
    }
  };

  tick(); // 즉시 1회
  const interval = setInterval(tick, 30 * 1000);
  return () => clearInterval(interval);
}, [match, fetchMatch]);
```

#### 윈도우 밖 진입 시 동작
- `-15분` 진입: `checkWindow()=false` → 폴링 시작 0
- `+15분` 진입: 동일 — 폴링 시작 0
- 윈도우 안에서 시작 후 윈도우 벗어남: 다음 tick 에 검증 후 clearInterval

### 3.2 서버 측 — 신규 endpoint

#### 위치
`POST /api/web/match-stream/auto-register/[matchId]`

> ※ 기존 `/api/web/tournaments/[id]/matches/[matchId]/...` 와 다른 경로 — 무인증이라 tournament 컨텍스트 필요 없음. matchId 만 단일.

#### 권한
- **무인증** (라이브 페이지 = 공개 / 일반 viewer 도 호출 가능)
- `withWebAuth` 미적용 / 별도 가드 0
- IDOR 가드 0 (모든 매치 정보는 공개 — 라이브 페이지가 이미 공개)

#### Rate limit
- **분당 6회/IP** (10초당 1회)
- 30초 폴링 = 분당 2회 호출 → 여유 ↑
- N매치 동시 진입 시 IP 1개 → 6회/분 초과 가능 → 지수 백오프 또는 매치 단위 키 분리 (아래 "rate limit 키 전략" 참조)

#### Rate limit 키 전략 (선택)
| 키 | 장점 | 단점 |
|----|------|------|
| A. IP only | 간단 | 같은 IP 다 매치 동시 진입 시 차단 |
| **B. IP + matchId** ⭐ | 매치별 독립 | 매치 N건 동시 시 N×6회 = 분당 N×6회 (악용 가능) |
| C. 매치별 (IP 0) | 매치별 폴링 효율 | IP 0 = abuse 방어 약함 |

→ **B 권장** (`auto-register:${matchId}:${ip}`) — 매치 단위 차단으로 다 매치 동시 폴링 정상 + 같은 매치 abuse 차단

#### 매치 단위 cache (Redis)
- key: `mybdr:youtube:match-auto:{matchId}`
- TTL: 5분 (search/route.ts 와 동일)
- value: `{ checked_at, best_score, best_video_id, registered }`
- 같은 매치 30초 폴링 시 매치별 1번만 search 알고리즘 발동 → 5분 안 폴링 N회 = cache hit
- 5분 후 cache miss → search 재실행 → BDR 채널 신규 영상 발견 가능

#### 응답 케이스
| 케이스 | HTTP | body |
|-------|------|------|
| 매치 ID 파싱 실패 | 404 | `apiError("경기를 찾을 수 없습니다", 404)` |
| 매치 0건 | 404 | 위 동일 |
| 매치 status ∉ [scheduled, ready, live] | 422 | `apiError("진행 가능한 매치가 아닙니다", 422)` |
| 윈도우 밖 (10분 외) | 422 | `apiError("자동 검색 윈도우가 아닙니다", 422)` |
| 이미 등록됨 (youtube_video_id != null) | 200 | `apiSuccess({ already_registered: true, video_id })` |
| 80점+ 발견 → 자동 등록 | 200 | `apiSuccess({ registered: true, video_id, status: "auto_verified", score })` |
| 80점 미만 | 200 | `apiSuccess({ registered: false })` |
| Rate limit 초과 | 429 | `apiError("요청이 너무 많습니다", 429)` |
| YouTube API 미설정 | 503 | `apiError("YouTube API 가 설정되지 않았습니다", 503)` |
| YouTube API 장애 | 502 | `apiError("YouTube 영상 조회 실패", 502)` |

#### 동작 흐름
```
1. matchId BigInt 파싱
2. Rate limit 검사 (auto-register:${matchId}:${ip})
3. 매치 조회 (homeTeam.team.name / awayTeam.team.name / tournament.name / scheduledAt / started_at / matchCode / roundName / youtube_video_id / status)
4. 가드: status / youtube_video_id / 윈도우 검증
5. Cache 확인 (5분 내 결과 있으면 그대로 반환)
6. fetchEnrichedVideos (uploads playlist 150건 / cache hit 99%)
7. scoreMatch 알고리즘 (search/route.ts 헬퍼 재사용)
8. 최고 점수 영상 score >= 80 ?
   - YES → DB UPDATE (youtube_video_id, status="auto_verified", verified_at=now)
        + admin_log INSERT (운영자 활동 추적, severity="info", action="auto_register")
        + cache 저장 (registered=true)
        + 응답 { registered: true, video_id, status: "auto_verified" }
   - NO → cache 저장 (registered=false / 5분 만료)
        + 응답 { registered: false }
9. fire-and-forget cache write
```

### 3.3 보안 분석

#### 무인증 endpoint 위험 항목
| 위험 | 가드 |
|------|------|
| 무한 폴링 abuse | rate limit 6회/분/IP+matchId |
| 잘못된 video_id 등록 | 80점+ 임계 (search route 알고리즘 신뢰) + scoreMatch 시간/팀명/대회명 4축 검증 |
| YouTube quota 폭증 | uploads playlist cache hit 99% + 매치 단위 5분 cache (분당 cost 0~2) |
| IDOR | 매치 정보 공개 (라이브 페이지 이미 공개) → IDOR 가드 불필요 |
| DDoS | rate limit 으로 1차 차단 / Vercel edge 가드 2차 |

#### 비교: search route 와 차이
| 항목 | search (기존) | auto-register (신규) |
|------|--------------|--------------------|
| 권한 | 운영자만 (`resolveMatchStreamAuth`) | 무인증 |
| Rate limit | 30회/분/userId | 6회/분/IP+matchId |
| 자동 INSERT | ❌ 후보만 반환 | ✅ 80점+ INSERT |
| Cache 키 | `mybdr:youtube:match-search:{matchId}` 5분 | `mybdr:youtube:match-auto:{matchId}` 5분 |
| 응답 | 후보 N건 score breakdown | `{ registered, video_id, status }` |
| 사용 목적 | 운영자 수동 검색 | 클라 자동 폴링 |

### 3.4 YouTube quota 영향

| 시나리오 | quota 추가 |
|---------|----------|
| uploads playlist cache hit | 0 |
| uploads playlist cache miss (30분 1회) | 2 (`/playlistItems` × 2 + `/videos` × 3 = ~5) |
| 매치 단위 5분 cache hit (auto-register) | 0 |
| 매치 단위 5분 cache miss | 위 uploads 와 동일 cost (cache hit 99%) |
| 분당 동시 매치 N건 폴링 | 매치별 5분 1회 → N매치 동시 = 분당 cost 0 (다 cache hit) |

→ 일일 quota 10,000 대비 **0.1% 미만** 사용 (search route 와 동일)

---

## §4. 분리 검토 (search vs auto-register 별도 endpoint 사유)

### 왜 별도 endpoint?
1. **권한 가드 다름** — search = 운영자 / auto-register = 무인증
2. **Rate limit 룰 다름** — search 30회/userId / auto-register 6회/IP+matchId
3. **응답 형태 다름** — search = 후보 N건 / auto-register = registered Boolean
4. **부수 효과 다름** — search = read only / auto-register = INSERT + admin_log
5. **Cache 키 다름** — 분리해야 후보 검토(search) 와 자동 등록(auto-register) 결과 독립 관리 가능
6. **악용 시나리오 다름** — search abuse 시 운영자 접근만 / auto-register abuse 시 일반 사용자 접근

### scoreMatch 헬퍼 추출 (PR-A)
- 현재: search/route.ts 내부 로컬 함수 (170L 통째)
- 추출 후: `src/lib/youtube/score-match.ts` 별도 파일
- 사용처: search route + auto-register route 공용
- 변경 영향 0 (함수 시그니처 그대로)

```typescript
// src/lib/youtube/score-match.ts (추출 후)
export interface MatchInfoForScoring {
  homeTeamName: string;
  awayTeamName: string;
  tournamentName: string;
  roundName: string | null;
  matchCode: string | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
}

export interface ScoredCandidate {
  video_id: string;
  title: string;
  thumbnail: string;
  score: number;
  is_live: boolean;
  published_at: string;
  view_count: number;
  score_breakdown: { time: number; home_team: number; away_team: number; tournament: number; match_code: number; round: number };
}

export const SCORE_THRESHOLD_AUTO = 80;
export const SCORE_THRESHOLD_CANDIDATE = 50;
export const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000;

export function scoreMatch(video: EnrichedVideo, match: MatchInfoForScoring): ScoredCandidate {
  // search/route.ts 의 80~168L 로직 그대로 이동
}
```

---

## §5. 클라이언트 코드 — 통합 위치 / UI 안내

### 5.1 `src/app/live/[id]/page.tsx` 마운트
- 기존 useEffect (fetchMatch 마운트) 다음에 useEffect 1개 추가
- match 변경 시 cleanup → 새 폴링 시작
- 라이브 페이지 외 페이지 영향 0

### 5.2 UI 안내 (선택 / P2)
- **isAdmin 시**: "🔍 BDR 채널 자동 검색 중..." 토스트 (autoRegisterActive=true 시)
- **일반 viewer**: 표시 0 (백그라운드 폴링 / UX 방해 없음)
- 운영자가 매치 시작 직전 진입 시 "자동 검색 활성" 시각 피드백

```tsx
{autoRegisterActive && isAdmin && (
  <div className="px-3 py-2 rounded text-sm" style={{
    backgroundColor: "var(--color-info-light)",
    color: "var(--color-info)"
  }}>
    <span className="material-symbols-outlined text-base align-middle">search</span>
    BDR 채널 자동 검색 중...
  </div>
)}
```

### 5.3 일반 viewer UX
- 라이브 페이지 진입 → 영상 미등록 상태 (영역 hidden 또는 placeholder)
- 백그라운드 폴링 → 80점+ 발견 시 fetchMatch refetch → 임베드 영역 자동 노출
- 페이지 새로고침 0 / 부드러운 전환

---

## §6. PR 분할 (3 PR)

| PR | 내용 | 의존 | 추정 |
|----|------|------|------|
| **PR-A** | scoreMatch 헬퍼 추출 (`src/lib/youtube/score-match.ts`) — search route 리팩터링 (회귀 0) | 없음 | 30분 |
| **PR-B** | auto-register endpoint 신규 (`POST /api/web/match-stream/auto-register/[matchId]`) + Redis cache + rate limit + admin_log | PR-A | 1.5h |
| **PR-C** | 라이브 페이지 클라 setInterval + 윈도우 가드 + UI 안내 (선택) | PR-A | 1h |
| 검증 | tester (curl + 윈도우 가드 + cache hit + tsc + Flutter v1 회귀) + reviewer 병렬 | PR 별 | 30분 |

### PR 의존도
```
PR-A (헬퍼 추출, 회귀 0)
   ├─ PR-B (서버 endpoint, 헬퍼 import)
   └─ PR-C (클라 폴링, 헬퍼 미사용 — 병렬 가능)
```

→ PR-A 후 PR-B/PR-C 병렬 작업 가능

### 분배 권장
- **수빈**: PR-A (헬퍼) → PR-B (서버) → PR-C (클라) 순차
- 또는 **수빈**: PR-A + PR-C / **원영**: PR-B 병렬

---

## §7. 검증 시나리오

### 핵심 시나리오 (6건)
1. **윈도우 안 진입 + BDR 영상 80점+** → 30초 폴링 시작 / 1~2 tick 안 자동 등록 → 임베드 자동 노출
2. **윈도우 안 진입 + 영상 0건 (미업로드)** → 폴링 30초 간격 지속 / `registered: false` 반복 / 윈도우 밖 자동 stop
3. **이미 등록됨 진입** → 폴링 시작 0 (early return) / 임베드 즉시 노출
4. **윈도우 밖 (-15분) 진입** → 폴링 시작 0
5. **윈도우 안 진입 → 윈도우 밖 (체류 30분+)** → 폴링 시작 후 다음 tick 에 stop
6. **80점 미만 후보만 (예: 50점)** → 등록 0 / 다음 30초 재시도 / search route 의 50점 이상 후보는 운영자 모달에서만 노출

### Edge case (5건)
7. **rate limit 초과** → 429 / 클라가 다음 tick 까지 대기 / 다른 매치 폴링 영향 0
8. **YouTube API 장애** → 502 / 클라가 다음 tick 재시도 / 폴링 중단 0
9. **DB 장애** → 500 / 클라가 다음 tick 재시도
10. **Redis 장애** → cache 미적용 (graceful) / search 매번 실행 (fallback / quota 부담)
11. **2개 탭 같은 매치 진입** → IP+matchId 동일 = 같은 rate limit 키 / 분당 2 + 2 = 4회 / 6회 한도 안 (정상)

### 회귀 (3건)
12. **search route 변경 0** — auto-register 별도 endpoint
13. **DB schema 변경 0** — PR1 그대로 (youtube_video_id / youtube_status / youtube_verified_at)
14. **Flutter v1 영향 0** — `/api/v1/...` 변경 0 (web only)

### tester 검증 명령
```bash
# 1. tsc
npx tsc --noEmit

# 2. curl 윈도우 안 (매치 #N)
curl -X POST https://mybdr.kr/api/web/match-stream/auto-register/N

# 3. curl 윈도우 밖
curl -X POST https://mybdr.kr/api/web/match-stream/auto-register/N
# 422 expected

# 4. Rate limit 초과 (7회 연속)
for i in {1..7}; do curl -X POST .../auto-register/N; done
# 7번째에 429 expected

# 5. cache hit 검증 (Redis)
redis-cli GET mybdr:youtube:match-auto:N

# 6. admin_log 검증
SELECT * FROM admin_logs WHERE action='match_youtube_stream_auto_register' ORDER BY created_at DESC LIMIT 5;
```

---

## §8. 회귀 / 영향 분석

| 영역 | 영향 |
|------|------|
| search API (`/api/web/.../search`) | 0 (헬퍼 추출만 / 시그니처 동일) |
| 등록 API (`/api/web/.../youtube-stream`) | 0 (변경 0) |
| DB schema | 0 (PR1 그대로) |
| Flutter v1 (`/api/v1/...`) | 0 (web only) |
| Vercel Cron | 0 (옵션 A 단독 채택 / cron 미사용) |
| Redis cache | 신규 키 1건 (`match-auto:{matchId}`) |
| YouTube quota | +0/매치 (cache hit 99%) |
| 라이브 페이지 진입 시간 | 0 (useEffect 비동기 / SSR 영향 0) |
| 시안 (BDR-current/screens/Live.jsx) | 0 (UI 변경 0 — 백그라운드 폴링) |
| 디자인 토큰 | 0 (UI 안내 P2 시 var(--color-info-light) 등 기존 토큰 사용) |
| admin_logs | INSERT 신규 (action="match_youtube_stream_auto_register") — 80점+ 자동 등록 시만 |
| 운영자 운영 흐름 | 0 (수동 등록 그대로 사용 가능 / 자동 + 수동 양립) |

---

## §9. 위험 / 가드

| 위험 | 가드 |
|------|------|
| 무인증 endpoint abuse | rate limit 6회/분/IP+matchId + 80점+ 임계 + matchId 단일 (광범위 query 0) |
| 잘못된 video_id 자동 등록 | scoreMatch 알고리즘 신뢰 (5/9 batch v3 정확도 100% 검증) + 80점 임계 |
| 매치 단위 cache stale | 5분 TTL — BDR 채널 신규 업로드 5분 후 자동 발견 |
| BDR 채널 다른 영상 오매칭 | 시간 매칭 ±30분 + 양 팀명 매칭 = 60+30+30 = 120점 만점 / 80점 = 60% 룰 (안전 임계) |
| Rate limit 키 전략 abuse | IP+matchId 분리 → 매치당 6회/IP/분 / 동시 N매치 = N×6회 (수용 가능) |
| 운영자 수동 등록과 충돌 | 운영자가 수동 등록한 영상 (status="manual") → youtube_video_id != null → 폴링 즉시 stop / 충돌 0 |
| 매치 status 변경 (예: cancelled) | guard: status ∉ [scheduled, ready, live] → 422 / 폴링 다음 tick 에 422 받고 stop |
| 클라 fetch 실패 | tick 내부 try/catch → console.warn / 다음 tick 재시도 |
| 시안 영향 | 0 (백그라운드 폴링 / UI 변경 0) |

---

## §10. 사용자 결재 항목 (Q1~Q7)

| Q | 결재 | planner 권장안 | 사유 |
|---|------|---------|------|
| Q1 | 윈도우 ±10분 정확? | **A** (사용자 명시) | 사용자 직접 인용 "10분전~10분후" |
| Q2 | rate limit 분당 6회/IP+matchId 적정? | **A** | 30초 폴링 = 분당 2회 / 4회 여유 / 같은 매치 abuse 차단 + 다른 매치 독립 |
| Q3 | 80점 임계값 그대로? (search route 와 동일) | **A** | 5/9 batch v3 정확도 100% 검증 / 80점 = 시간+양팀+대회명 다 일치 |
| Q4 | 무인증 endpoint OK? | **A** | 라이브 페이지 공개 + matchId 단일 query + 80점+만 INSERT (잘못된 등록 위험 0) |
| Q5 | 클라이언트 + Cron 하이브리드 필요? | **A 만** (옵션 A) | 30초 요구 = Cron 1분 미달 / Vercel Hobby plan cron 1일 1회 |
| Q6 | PR 분할 3건 적정? | **A** | PR-A 헬퍼 / PR-B 서버 / PR-C 클라 — 회귀 가드 명확 + PR-B/C 병렬 가능 |
| Q7 | scoreMatch 헬퍼 추출 PR-A 별도? | **별도 권장** | 회귀 0 분리 PR + 추후 마이그 시 단일 source / 합칠 시 PR-B 부피 ↑ |

### 추가 결재 (선택)
- Q8. UI 안내 (운영자 토스트) — PR-C 동시 / 별도 P2 큐
  - planner 권장: **PR-C 동시** (코드 +5L 이내)
- Q9. admin_log severity — "info" / "warning"
  - planner 권장: **info** (정상 동작 / warning 은 수동 제거 시)
- Q10. 매치 status guard — `[scheduled, ready, live]` / `[scheduled, ready, in_progress, live]`
  - planner 권장: **`[scheduled, ready, in_progress]`** (라이브 진입 가능 status 와 동일)

---

## §11. 추정 시간

| 시나리오 | PR | 시간 |
|---------|----|------|
| 최소 (서버 + 클라만) | PR-A + PR-B + PR-C | ~3h |
| + 검증 (tester + reviewer 병렬) | + 30분 | ~3.5h |
| + UI 안내 (운영자 토스트) | + 0 (PR-C 안 통합) | ~3.5h |
| + push + 미푸시 commit 정리 | + 30분 | ~4h |

---

## §12. 다음 액션

1. **사용자**: Q1~Q7 결재 (특히 Q1, Q4, Q5 핵심) → 확정
2. **planner**: 결재 후 PR-A/PR-B/PR-C 상세 task 분해
3. **developer (PR-A)**: `src/lib/youtube/score-match.ts` 헬퍼 추출 + search route 리팩터
4. **developer (PR-B)**: auto-register endpoint + Redis cache + rate limit + admin_log
5. **developer (PR-C)**: live/[id]/page.tsx useEffect + UI 안내 (운영자만)
6. **tester**: PR 별 검증 (위 §7 시나리오 14건)
7. **reviewer**: PR 별 코드 리뷰 (병렬)
8. **PM**: 미푸시 commit 알림 + scratchpad 갱신 + index.md 갱신

---

## §13. PR 별 task 상세

### PR-A: scoreMatch 헬퍼 추출
1. `src/lib/youtube/score-match.ts` 신규 (170L)
   - `interface MatchInfoForScoring`
   - `interface ScoredCandidate`
   - `const SCORE_THRESHOLD_AUTO = 80`
   - `const SCORE_THRESHOLD_CANDIDATE = 50`
   - `const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000`
   - `function scoreMatch(video, match): ScoredCandidate`
2. `src/app/api/web/tournaments/[id]/matches/[matchId]/youtube-stream/search/route.ts` 리팩터
   - 로컬 `scoreMatch` / `interface ScoredCandidate` / 상수 3종 제거
   - `import { scoreMatch, SCORE_THRESHOLD_CANDIDATE, type ScoredCandidate } from "@/lib/youtube/score-match"` 추가
   - 회귀 0 (시그니처 동일)
3. tsc 0
4. tester: curl search route 동작 동일 검증

### PR-B: auto-register endpoint
1. `src/app/api/web/match-stream/auto-register/[matchId]/route.ts` 신규 (~250L)
   - matchId BigInt 파싱
   - rate limit (`auto-register:${matchId}:${ip}` / 6회/분)
   - 매치 조회 + status / youtube_video_id / 윈도우 가드
   - Redis cache 확인 (`mybdr:youtube:match-auto:${matchId}` 5분)
   - fetchEnrichedVideos + scoreMatch (PR-A 헬퍼)
   - 80점+ → DB UPDATE (youtube_video_id, status="auto_verified", verified_at) + admin_log
   - 응답 매트릭스 (§3.2 표 9종)
2. tsc 0
3. tester: 시나리오 1~14건 검증

### PR-C: 라이브 페이지 클라 폴링
1. `src/app/live/[id]/page.tsx` 수정 (~50L 추가)
   - useEffect (match 마운트 다음)
   - autoRegisterActive state
   - checkWindow / tick / setInterval 30초
   - 응답 registered:true 시 fetchMatch + clearInterval
   - 운영자 토스트 (isAdmin 시) — Q8 결재에 따라
2. tsc 0
3. tester: 시나리오 1~6 (윈도우 / 등록 / 윈도우 밖) 검증

---

## §14. 코드 예시 — 서버 endpoint 핵심 부분

```typescript
// src/app/api/web/match-stream/auto-register/[matchId]/route.ts (요약)

import { type NextRequest } from "next/server";
import { Redis } from "@upstash/redis";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import { fetchEnrichedVideos } from "@/lib/youtube/enriched-videos";
import { scoreMatch, SCORE_THRESHOLD_AUTO } from "@/lib/youtube/score-match";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { adminLog } from "@/lib/admin/log";

const WINDOW_MS = 10 * 60 * 1000; // ±10분
const CACHE_TTL = 5 * 60; // 5분
const CACHE_KEY = (matchId: string) => `mybdr:youtube:match-auto:${matchId}`;

type Ctx = { params: Promise<{ matchId: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
  const { matchId } = await ctx.params;
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) return apiError("경기를 찾을 수 없습니다.", 404);

  // Rate limit (IP + matchId)
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rl = await checkRateLimit(`auto-register:${matchId}:${ip}`, {
    limit: 6,
    windowSec: 60,
  });
  if (!rl.allowed) return apiError("요청이 너무 많습니다.", 429);

  // 매치 조회
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: {
      id: true,
      status: true,
      scheduledAt: true,
      started_at: true,
      roundName: true,
      match_code: true,
      youtube_video_id: true,
      tournament: { select: { name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
  });
  if (!match) return apiError("경기 정보를 찾을 수 없습니다.", 404);

  // 이미 등록됨 → 즉시 200
  if (match.youtube_video_id) {
    return apiSuccess({ already_registered: true, video_id: match.youtube_video_id });
  }

  // status guard (Q10 결재)
  if (!["scheduled", "ready", "in_progress"].includes(match.status ?? "")) {
    return apiError("진행 가능한 매치가 아닙니다.", 422);
  }

  // 윈도우 검증
  const ref = match.scheduledAt ?? match.started_at;
  if (!ref) return apiError("매치 시각이 없습니다.", 422);
  const refTime = ref.getTime();
  const now = Date.now();
  if (Math.abs(now - refTime) > WINDOW_MS) {
    return apiError("자동 검색 윈도우가 아닙니다.", 422);
  }

  // Cache 확인 — 5분 안 결과 그대로 반환
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get<{ registered: boolean; video_id?: string }>(CACHE_KEY(matchId));
      if (cached) return apiSuccess(cached);
    } catch (err) {
      console.error("[auto-register] redis get failed:", err);
    }
  }

  // YouTube fetch
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) return apiError("YouTube API 가 설정되지 않았습니다.", 503);

  let videos;
  try {
    videos = await fetchEnrichedVideos(youtubeKey);
  } catch (err) {
    console.error("[auto-register] fetch failed:", err);
    return apiError("YouTube 영상 조회 실패.", 502);
  }

  // 점수 계산 + 최고점 영상
  const homeTeamName = match.homeTeam?.team?.name ?? "";
  const awayTeamName = match.awayTeam?.team?.name ?? "";
  const tournamentName = match.tournament?.name ?? "";

  const best = videos
    .map((v) => scoreMatch(v, {
      homeTeamName,
      awayTeamName,
      tournamentName,
      roundName: match.roundName,
      matchCode: match.match_code,
      scheduledAt: match.scheduledAt,
      startedAt: match.started_at,
    }))
    .sort((a, b) => b.score - a.score)[0];

  // 80점+ → 자동 등록
  if (best && best.score >= SCORE_THRESHOLD_AUTO) {
    const verifiedAt = new Date();
    await prisma.tournamentMatch.update({
      where: { id: matchBigInt },
      data: {
        youtube_video_id: best.video_id,
        youtube_status: "auto_verified",
        youtube_verified_at: verifiedAt,
      },
    });

    await adminLog("match_youtube_stream_auto_register", "tournament_match", {
      targetType: "tournament_match",
      targetId: matchBigInt,
      description: `매치 ${matchBigInt.toString()} 자동 등록 (score=${best.score})`,
      severity: "info",
      changesMade: {
        tournament_match_id: matchBigInt.toString(),
        youtube_video_id: best.video_id,
        youtube_status: "auto_verified",
        score: best.score,
      },
    });

    const result = { registered: true, video_id: best.video_id, status: "auto_verified", score: best.score };
    if (redis) {
      redis.set(CACHE_KEY(matchId), result, { ex: CACHE_TTL }).catch((err) => {
        console.error("[auto-register] redis set failed:", err);
      });
    }
    return apiSuccess(result);
  }

  // 80점 미만 → cache 저장 + 미등록 응답
  const result = { registered: false };
  if (redis) {
    redis.set(CACHE_KEY(matchId), result, { ex: CACHE_TTL }).catch((err) => {
      console.error("[auto-register] redis set failed:", err);
    });
  }
  return apiSuccess(result);
}
```

---

**보고서 끝.** Q1~Q7 결재 대기 / 라이브 PR1~5 push 후 진입 권장.
