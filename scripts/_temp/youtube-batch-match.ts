/**
 * 2026-05-09 — 매치 YouTube 일괄 자동 매칭 batch (developer 1회성).
 *
 * 컨텍스트:
 *   PR1~5 완료 후 누적된 매치 (youtube_video_id IS NULL) 들에 대해
 *   BDR uploads playlist (150건) 와 1회 매칭 → 80점+ 자동 등록 권장 / 50~79 후보 보고.
 *
 *   **2026-05-09 확장 (예정 매치 포함)**:
 *   - 기존: 종료 매치만 매칭 (status completed/ended/final OR ended_at OR scheduledAt<now-1d)
 *   - 신규: **모든 매치** (예정 + 진행중 + 종료) 매칭 → 앞으로 진행될 경기에 미리 영상 삽입.
 *   - 사유: BDR 채널 사전 등록 영상 / 라이브 스트림 미리 박제 가능.
 *   - 옵션 분기: --completed-only (기존 동작) / --scheduled-only (예정만) / 기본=모두 포함
 *
 * 알고리즘 v3 (5/9 — 정확 날짜 매칭 + 이미 등록 영상 제외):
 *   - 점수 배분 (총 100점): 홈팀(25) + 어웨이팀(25) + 대회명(20) + 날짜(20) + 시간(10)
 *   - 임계값 80점 (양 팀 정확 25+25 + 대회명 20 + 날짜 20 = 90점 → 정상 자동 채택)
 *   - **날짜 점수 룰 강화 (v3)**: 같은날 only — 정확 매칭 시그널만 인정
 *     · 같은날 = 20
 *     · ±1일 (자정 경계 시간대 오차) = 5
 *     · 그 외 = 0 (사실상 매칭 차단 — 다른 날 영상은 임계값 80 도달 불가)
 *   - **이미 등록된 video_id 제외 (v3 신규)**: DB 사전 조회 → 후보 pool 에서 제외
 *     · 사유: v2 에서 같은 팀 조합의 새 매치가 이전 영상에 중복 매핑되는 사일런트 버그 차단
 *     · 결과: 이전 12 매치 영상 = 새 매치 후보로 안 나옴 → 1:1 매핑 룰 강화
 *
 * 흐름:
 *   1) 매치 list 조회 (youtube_video_id IS NULL + status 필터 옵션)
 *      ※ --include-existing 시 NULL 조건 제거 (이전 채택 매치도 재채점, 정확도 비교)
 *   2) **DB 에서 이미 등록된 video_id list 조회 → usedSet** (v3 신규)
 *   3) BDR uploads 영상 일괄 fetch (fetchEnrichedVideos / Redis cache)
 *   4) **availableVideos = videos 에서 usedSet 영상 제외** (v3 신규)
 *   5) 매치별 scoreMatch v3 (정확 날짜 룰 + availableVideos pool)
 *   6) dry-run 기본 — 결과 리포트만 / --apply 시 80점+ DB UPDATE + admin_logs
 *   7) 결과 — 예정 매치 vs 종료 매치 분리 표시
 *
 * 안전 가드 (CLAUDE.md §DB 정책):
 *   - dry-run 기본 (실수 방지)
 *   - UPDATE 만 (NULL → 값) / DROP / TRUNCATE / 대량 DELETE 0
 *   - 80점 미만 자동 등록 X (사용자 검토 후 수동 등록)
 *   - Flutter v1 영향 0 (`/api/v1/...` schema 비변경)
 *   - BigInt 직렬화: id.toString() 명시
 *   - --include-existing 은 정확도 측정용 read-only (UPDATE 미수행 — 안전 가드)
 *   - 회귀 차단: youtube_video_id IS NULL 필터로 이전 12 매치 자동 제외
 *
 * 사용법:
 *   npx tsx scripts/_temp/youtube-batch-match.ts                       # dry-run (예정+종료 모두)
 *   npx tsx scripts/_temp/youtube-batch-match.ts --apply               # 실제 UPDATE
 *   npx tsx scripts/_temp/youtube-batch-match.ts --completed-only      # 종료 매치만 (기존 동작)
 *   npx tsx scripts/_temp/youtube-batch-match.ts --scheduled-only      # 예정 매치만
 *   npx tsx scripts/_temp/youtube-batch-match.ts --include-existing    # 이전 채택 매치도 재채점 (정확도 측정)
 *   npx tsx scripts/_temp/youtube-batch-match.ts --tournament=<uuid>
 *   npx tsx scripts/_temp/youtube-batch-match.ts --threshold=70        # 임계값 조정
 *   npx tsx scripts/_temp/youtube-batch-match.ts --limit=20            # 테스트용
 *   npx tsx scripts/_temp/youtube-batch-match.ts --apply --admin-id=1  # admin_logs 작성자
 *
 * 작업 후 본 파일은 scripts/_temp/ 에서 제거 권장 (CLAUDE.md §운영 DB credentials 노출 방지).
 */

import { PrismaClient, type Prisma } from "@prisma/client";
// enriched-videos 는 모듈 top-level 에서 BDR_YOUTUBE_UPLOADS_PLAYLIST_ID 를 const 로 박제하므로
// 명령줄 --playlist-id 오버라이드 후 dynamic import 로 늦게 로드해야 반영됨.
// 타입 import 는 컴파일 시점만 영향 (런타임 동작 X) → 정적 import 로 OK.
import type { EnrichedVideo } from "../../src/lib/youtube/enriched-videos";

const prisma = new PrismaClient();

// ============ CLI 인자 파싱 ============

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
// 정확도 측정용 — 이전 채택 매치 (youtube_video_id IS NOT NULL) 도 재채점
// 신규 알고리즘 (5요소) 으로 이전 12 매치를 다시 점수화하여 정확도 검증.
// 안전: APPLY 와 결합되어도 이전 채택 매치는 UPDATE 대상에서 자동 제외됨 (이중 가드).
const INCLUDE_EXISTING = args.includes("--include-existing");

// 2026-05-09 신규: 매치 status 분기 옵션 (3 모드)
//  - --completed-only: 기존 동작 (종료 매치만 — status completed/ended/final OR ended_at OR scheduledAt<now-1d)
//  - --scheduled-only: 예정 매치만 (위 종료 조건의 반대 — 종료 시그널 0)
//  - (기본): 모든 매치 (예정 + 진행중 + 종료) — 사용자 요청 충실
// 두 옵션 동시 지정 시 사용자 의도 모호 → 에러 후 종료
const COMPLETED_ONLY = args.includes("--completed-only");
const SCHEDULED_ONLY = args.includes("--scheduled-only");
if (COMPLETED_ONLY && SCHEDULED_ONLY) {
  console.error(
    "❌ --completed-only 와 --scheduled-only 동시 지정 불가. 둘 중 하나만 선택하거나 (기본) 모든 매치 매칭.",
  );
  process.exit(1);
}
const TOURNAMENT_FILTER = (() => {
  const a = args.find((x) => x.startsWith("--tournament="));
  return a ? a.replace("--tournament=", "").trim() : null;
})();
// v2 (5/9 5요소 업그레이드): 자동 채택 임계값 80점
// 사유: 5요소 점수 배분 — 홈(25) + 어웨이(25) + 대회명(20) + 날짜(20) + 시간(10) = 100
//   - 양 팀 정확 25+25 + 대회명 20 + 날짜 10 = 80점 (자동 채택 최소 시그널)
//   - 양 팀만 정확 50점 = 후보 검토 강등 (오매칭 차단 — 다른 대회 동명 팀)
const THRESHOLD = (() => {
  const a = args.find((x) => x.startsWith("--threshold="));
  if (!a) return 80;
  const v = parseInt(a.replace("--threshold=", ""), 10);
  return Number.isFinite(v) && v >= 0 && v <= 200 ? v : 80;
})();
const LIMIT = (() => {
  const a = args.find((x) => x.startsWith("--limit="));
  if (!a) return null;
  const v = parseInt(a.replace("--limit=", ""), 10);
  return Number.isFinite(v) && v > 0 ? v : null;
})();
const ADMIN_ID_OVERRIDE = (() => {
  const a = args.find((x) => x.startsWith("--admin-id="));
  if (!a) return null;
  const v = parseInt(a.replace("--admin-id=", ""), 10);
  return Number.isFinite(v) && v > 0 ? v : null;
})();
// 로컬 .env 에 BDR_YOUTUBE_UPLOADS_PLAYLIST_ID 미설정 시 명령줄로 주입 가능
const PLAYLIST_ID_OVERRIDE = (() => {
  const a = args.find((x) => x.startsWith("--playlist-id="));
  return a ? a.replace("--playlist-id=", "").trim() : null;
})();
if (PLAYLIST_ID_OVERRIDE) {
  process.env.BDR_YOUTUBE_UPLOADS_PLAYLIST_ID = PLAYLIST_ID_OVERRIDE;
}

// ============ 매칭 알고리즘 (search/route.ts 와 동일) ============

// v3 5요소 점수 배분 (총 100점)
// home(25) + away(25) + tournament(20) + date(20) + time(10) = 100
const SCORE_HOME_EXACT = 25; // 홈팀 정확 일치
const SCORE_HOME_NORMALIZED = 20; // 홈팀 정규화 후 일치 (괄호/특수문자 제거)
const SCORE_AWAY_EXACT = 25;
const SCORE_AWAY_NORMALIZED = 20;
const SCORE_TOURNAMENT_FULL = 20; // 대회명 전체 substring 매칭
const SCORE_TOURNAMENT_PARTIAL = 10; // 대회명 일부 키워드 매칭
// v3 (5/9): 날짜 정확 매칭 only — 다른 날 영상 자동 채택 차단
const SCORE_DATE_SAME_DAY = 20; // 같은 날 (KST 기준 — 자동 채택 시그널)
const SCORE_DATE_PLUS_MINUS_1 = 5; // ±1일 (자정 경계 시간대 오차 대응 — 임계값 도달 불가하게 약한 점수)
// v2 의 ±1~7일=15, ±8~30일=10 제거 — 다른 날 영상은 점수 0 → 자동 채택 임계값(80) 도달 불가 → 차단
const SCORE_TIME_6H = 10; // 영상 publishedAt vs 매치 시각 ±6시간
const SCORE_TIME_24H = 5; // ±24시간

// 시간 차등 임계값 (ms)
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
// 2026-05-09 — 시간 윈도우 ±1h 강제 가드 (사용자 결정).
// 사유: 게임 지연 가능성 흡수하면서 다른 시간대 매치 영상 잘못 매칭 차단.
//       ±1h 외 영상은 후보 자체에서 제외 (점수 계산 X / 다른 점수 만족해도 매칭 X).
//       cron route.ts 와 동일 룰 (코드 일관성).
const TIME_WINDOW_MS = 60 * 60 * 1000;

interface ScoreBreakdown {
  home_team: number; // 0~25
  away_team: number; // 0~25
  tournament: number; // 0~20
  date: number; // 0~20
  time: number; // 0~10
}

interface ScoredCandidate {
  video_id: string;
  title: string;
  thumbnail: string;
  score: number;
  is_live: boolean;
  published_at: string;
  view_count: number;
  score_breakdown: ScoreBreakdown;
}

interface MatchMeta {
  homeTeamName: string;
  awayTeamName: string;
  tournamentName: string;
  roundName: string | null;
  matchCode: string | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
}

// 팀명 정규화 — 공백/특수문자 제거 + 소문자
// 사유: "Cross Over" vs "크로스오버" 같이 영문/한글 혼재 / 괄호·하이픈·점 등 변형 대응.
function normalizeTeamName(s: string): string {
  return s
    .replace(/[()\[\]·.\-_]/g, "") // 괄호/특수문자 제거
    .replace(/\s+/g, "") // 공백 제거
    .toLowerCase();
}

// 영상 제목에서 "vs" / " 대 " / "VS" 분리 후 양 팀 토큰 추출
// 예: "제 21회 MOLTEN배 동호회최강전 B조 1경기 아울스 vs 크로스오버"
//   → 좌측 = "제 21회 ... 아울스" / 우측 = "크로스오버"
//   → 좌측 마지막 토큰 = "아울스" / 우측 첫 토큰 = "크로스오버"
function extractTeamsFromTitle(title: string): { home: string; away: string } | null {
  // "vs" / "VS" / " 대 " 분리 (대소문자 무시 / 공백 토큰 양쪽)
  // 우선순위: " vs " (영문 + 공백) > "vs" (공백 없음 fallback) > " 대 "
  const patterns = [
    /\s+vs\.?\s+/i, // " vs " / " VS " / " vs. "
    /\s+대\s+/, // " 대 " (한글)
  ];

  for (const re of patterns) {
    const idx = title.search(re);
    if (idx < 0) continue;
    const match = title.match(re);
    if (!match) continue;
    const left = title.slice(0, idx).trim();
    const right = title.slice(idx + match[0].length).trim();
    if (!left || !right) continue;

    // 좌측: 마지막 공백 이후 토큰만 (예: "... 아울스" → "아울스")
    const leftTokens = left.split(/\s+/);
    const homeRaw = leftTokens[leftTokens.length - 1] ?? "";

    // 우측: 첫 공백 이전 토큰만 (예: "크로스오버 1쿼터" → "크로스오버")
    // 단, 우측 끝에 따라오는 부가 정보(스코어/쿼터/대회 부가) 제거
    const rightTokens = right.split(/\s+/);
    const awayRaw = rightTokens[0] ?? "";

    if (!homeRaw || !awayRaw) continue;
    return { home: homeRaw, away: awayRaw };
  }
  return null;
}

// YYYY-MM-DD 추출 (UTC 기준 — DB scheduledAt 도 UTC 저장이므로 일치)
// 사유: KST 변환은 양쪽 동일하게 적용되므로 UTC 비교 = KST 비교 결과 동일.
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 대회명 정규화 — 토큰 단위 부분 매칭용
// 예: "제 21회 MOLTEN배 동호회최강전" → ["21회", "molten배", "동호회최강전"]
function extractTournamentKeywords(name: string): string[] {
  return name
    .replace(/[()\[\]·.\-_]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.toLowerCase());
}

// 매치 + 영상 1건 → 신뢰도 점수 (v3 — 정확 날짜 매칭)
//
// 점수 배분 (총 100점):
//   1. 홈팀 (25) — 영상 vs 토큰 좌측 정확/정규화 매칭 (swap 포함)
//   2. 어웨이팀 (25) — 영상 vs 토큰 우측 정확/정규화 매칭 (swap 포함)
//   3. 대회명 (20) — 영상 제목/설명에 대회명 substring 또는 일부 키워드 매칭
//   4. 날짜 (20) — publishedAt date vs scheduledAt date (같은날 20 / ±1일 자정경계 5 / 그 외 0)
//   5. 시간 (10) — publishedAt 시각 vs scheduledAt 시각 (±6h=10 / ±24h=5)
//
// 자동 채택 시그널 = 80점
//   · 정확 매칭: 양 팀 50 + 대회명 20 + 같은날 20 = 90점 (시간 점수 무관)
//   · 차단: 다른 날 영상은 양 팀 50 + 대회명 20 + 날짜 0 = 70점 (임계값 미달)
function scoreMatch(video: EnrichedVideo, match: MatchMeta): ScoredCandidate {
  const breakdown: ScoreBreakdown = {
    home_team: 0,
    away_team: 0,
    tournament: 0,
    date: 0,
    time: 0,
  };

  // ============ 0) ±1h 시간 윈도우 강제 가드 (2026-05-09 사용자 결정) ============
  // 매치 scheduledAt (또는 startedAt) 의 ±1시간 안 영상만 후보로 인정.
  // ±1h 외 = 모든 점수 0 부여 후 즉시 반환 → 임계값 80 도달 불가 → 후보 자체에서 제외.
  // 사유: 다른 시간대 매치 영상이 양 팀 + 대회명 + 같은날 만족만으로 잘못 매칭되는 케이스 차단.
  //       (예: 5/2 매치 영상이 5/9 같은 팀 매치 후보로 잡히는 사일런트 버그).
  // cron route.ts 와 동일 룰 (코드 일관성).
  const matchAtForGuard = match.startedAt ?? match.scheduledAt;
  const videoAtForGuard = new Date(video.publishedAt);
  if (
    !matchAtForGuard ||
    Math.abs(videoAtForGuard.getTime() - matchAtForGuard.getTime()) > TIME_WINDOW_MS
  ) {
    // 점수 0 ScoredCandidate 반환 — 임계값 80 미달이라 1:1 매핑 단계에서 자동 제외됨.
    return {
      video_id: video.videoId,
      title: video.title,
      thumbnail: video.thumbnail,
      score: 0,
      is_live: video.liveBroadcastContent === "live",
      published_at: video.publishedAt,
      view_count: video.viewCount,
      score_breakdown: breakdown,
    };
  }

  // ============ 1+2) 양 팀 매칭 (가장 중요 — 오매칭 차단) ============
  // 영상 제목에서 "vs"/"대" 토큰 분리 → home/away 추출 → 매치와 정확 비교
  const titleTeams = extractTeamsFromTitle(video.title);
  if (titleTeams) {
    const videoHome = normalizeTeamName(titleTeams.home);
    const videoAway = normalizeTeamName(titleTeams.away);
    const matchHome = normalizeTeamName(match.homeTeamName);
    const matchAway = normalizeTeamName(match.awayTeamName);

    if (matchHome && matchAway && videoHome && videoAway) {
      const exactSame = videoHome === matchHome && videoAway === matchAway;
      // swap: 영상이 매치의 어웨이 vs 홈 순서로 표기된 경우도 OK
      const exactSwap = videoHome === matchAway && videoAway === matchHome;

      if (exactSame || exactSwap) {
        // 정규화 후 정확 일치 = 25+25 (정규화 / 정확 모두 동일 점수 — 한글/영문 혼재 흡수)
        breakdown.home_team = SCORE_HOME_EXACT;
        breakdown.away_team = SCORE_AWAY_EXACT;
      }
      // 한 팀만 일치 / 부분 일치 = 0점 (오매칭 차단)
    }
  }

  // ============ 3) 대회명 매칭 ============
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");

  if (match.tournamentName) {
    // 풀네임 substring 매칭 (정규화 후) — 가장 강한 시그널
    const fullNorm = match.tournamentName.replace(/\s+/g, "").toLowerCase();
    if (fullNorm.length >= 4 && haystackNorm.includes(fullNorm)) {
      breakdown.tournament = SCORE_TOURNAMENT_FULL;
    } else {
      // 토큰별 매칭 — 2개 이상 매칭 = 풀(20) / 1개 매칭 = 부분(10)
      // 사유: "MOLTEN배 동호회최강전" 일부만 영상 제목에 들어가는 케이스 흡수.
      const tokens = extractTournamentKeywords(match.tournamentName);
      let hits = 0;
      for (const t of tokens) {
        const tNorm = t.replace(/\s+/g, "");
        if (tNorm.length >= 2 && haystackNorm.includes(tNorm)) {
          hits++;
        }
      }
      if (hits >= 2) {
        breakdown.tournament = SCORE_TOURNAMENT_FULL;
      } else if (hits === 1) {
        breakdown.tournament = SCORE_TOURNAMENT_PARTIAL;
      }
    }
  }

  // ============ 4) 날짜 매칭 (v3 — 정확 매칭 only) ============
  // **v3 (5/9 갱신)**: 사용자 명시 "실시간 중계만 등록 — 정확히 해당 경기일자에 매칭".
  // 사유: v2 (1~7일=15 / 8~30일=10) → 같은 팀 조합의 다른 날 영상이 임계값 80 도달하여 오매핑 발생.
  //       v3 룰: 같은날만 자동 채택 / ±1일 자정 경계 시간대 오차만 약한 점수 / 그 외 = 0 (차단).
  // 임계값 80 도달 조합:
  //   · 양 팀 정확 50 + 대회명 20 + 같은날 20 = 90점 ✅ (정상 자동 채택)
  //   · 양 팀 정확 50 + 대회명 20 + 다른날 0 + 시간 0 = 70점 ❌ (임계값 미달 — 차단)
  const matchAt = match.startedAt ?? match.scheduledAt;
  const videoAt = new Date(video.publishedAt);

  if (matchAt) {
    const matchDate = toDateOnly(matchAt);
    const videoDate = toDateOnly(videoAt);
    const diffAbsMs = Math.abs(videoAt.getTime() - matchAt.getTime());

    if (matchDate === videoDate) {
      // 같은 날 (라이브 방송 또는 당일 업로드) — 자동 채택 시그널
      breakdown.date = SCORE_DATE_SAME_DAY;
    } else if (diffAbsMs <= ONE_DAY_MS) {
      // ±1일 (자정 경계 — KST/UTC 시간대 변환 오차 대응)
      // 약한 점수만 부여 — 양 팀+대회명 풀 매치여도 50+20+5+10=85 → 매우 드문 케이스만 자동 채택 가능
      breakdown.date = SCORE_DATE_PLUS_MINUS_1;
    }
    // 그 외 (±2일 이상) = 0점 (사실상 자동 매칭 차단)
  }

  // ============ 5) 시간 매칭 (publishedAt 시각 vs scheduledAt 시각) ============
  if (matchAt) {
    const diffAbs = Math.abs(videoAt.getTime() - matchAt.getTime());
    if (diffAbs <= SIX_HOURS_MS) {
      breakdown.time = SCORE_TIME_6H;
    } else if (diffAbs <= TWENTY_FOUR_HOURS_MS) {
      breakdown.time = SCORE_TIME_24H;
    }
    // 그 외 = 0점
  }

  const score =
    breakdown.home_team +
    breakdown.away_team +
    breakdown.tournament +
    breakdown.date +
    breakdown.time;

  return {
    video_id: video.videoId,
    title: video.title,
    thumbnail: video.thumbnail,
    score,
    is_live: video.liveBroadcastContent === "live",
    published_at: video.publishedAt,
    view_count: video.viewCount,
    score_breakdown: breakdown,
  };
}

// ============ admin_logs 작성용 admin_id 결정 ============
//
// scripts 는 web session 미존재 → admin_id 를 직접 결정해야 함.
// 우선순위: --admin-id=<N> > admin_role='super_admin' isAdmin=true 첫 번째 user
// 주의: User 모델은 `role` 컬럼 없음 (admin_role / isAdmin 사용 — schema.prisma 검증)
async function resolveAdminId(): Promise<bigint | null> {
  if (ADMIN_ID_OVERRIDE) {
    const u = await prisma.user.findUnique({
      where: { id: BigInt(ADMIN_ID_OVERRIDE) },
      select: { id: true, admin_role: true, isAdmin: true },
    });
    if (!u) return null;
    return u.id;
  }
  const sa = await prisma.user.findFirst({
    where: { admin_role: "super_admin", isAdmin: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  return sa?.id ?? null;
}

// ============ 메인 ============

async function main() {
  const mode = APPLY ? "[APPLY — 실제 UPDATE 실행]" : "[DRY-RUN — DB 변경 없음]";
  // 매치 status 모드 라벨 (사용자 가시성)
  const statusModeLabel = COMPLETED_ONLY
    ? "completed-only (종료 매치만)"
    : SCHEDULED_ONLY
      ? "scheduled-only (예정 매치만)"
      : "all (예정 + 진행중 + 종료)";
  console.log(`\n${mode}`);
  console.log(
    `  algorithm: v3 (5요소 정확매칭 — 홈25+어웨이25+대회20+날짜20+시간10 / 같은날 only)`,
  );
  console.log(`  threshold: ${THRESHOLD}점 (자동 채택 기준)`);
  console.log(`  status mode: ${statusModeLabel}`);
  console.log(`  tournament: ${TOURNAMENT_FILTER ?? "(전체)"}`);
  console.log(`  limit: ${LIMIT ?? "(unlimited)"}`);
  console.log(`  include-existing: ${INCLUDE_EXISTING ? "Y (이전 채택 매치도 재채점)" : "N"}\n`);

  // 매치 조건 — youtube_video_id IS NULL + status 모드 분기
  //   - completed-only: 종료 시그널 (status completed/ended/final OR ended_at OR scheduledAt<now-1d)
  //   - scheduled-only: 종료 시그널 NOT (= 예정 매치)
  //   - (기본): 필터 0 — 모든 매치 (예정 + 진행중 + 종료)
  // --include-existing 시 NULL 조건 제거 (정확도 측정용 — 이전 채택 매치도 재채점)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // 종료 시그널 OR 절 (재사용용 — completed-only / scheduled-only 양쪽 모두 활용)
  const completedSignalOR: Prisma.TournamentMatchWhereInput = {
    OR: [
      { status: { in: ["completed", "ended", "final"] } },
      { ended_at: { not: null } },
      {
        AND: [
          { started_at: { not: null } },
          { scheduledAt: { lt: oneDayAgo } },
        ],
      },
    ],
  };

  // status 모드별 필터 분기
  // 사유: 사용자가 "예정 매치도 매칭" 요청 → 기본값 = 모든 매치 (필터 0).
  // completed-only / scheduled-only 는 명시적 옵션 시만 적용.
  const statusFilter: Prisma.TournamentMatchWhereInput[] = COMPLETED_ONLY
    ? [completedSignalOR]
    : SCHEDULED_ONLY
      ? [{ NOT: completedSignalOR }]
      : []; // 기본: 모든 매치

  const where: Prisma.TournamentMatchWhereInput = {
    ...(INCLUDE_EXISTING ? {} : { youtube_video_id: null }),
    AND: [
      ...(TOURNAMENT_FILTER ? [{ tournamentId: TOURNAMENT_FILTER }] : []),
      ...statusFilter,
    ],
  };

  const matches = await prisma.tournamentMatch.findMany({
    where,
    select: {
      id: true,
      uuid: true,
      scheduledAt: true,
      started_at: true,
      ended_at: true,
      status: true,
      roundName: true,
      match_code: true,
      // 정확도 비교용 — 이전 알고리즘 채택 결과 (--include-existing 시 활용)
      youtube_video_id: true,
      youtube_status: true,
      tournament: { select: { id: true, name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
    take: LIMIT ?? undefined,
  });

  // 매치 분류 통계 (예정 vs 종료) — 헤더 표시용
  // 사유: 사용자 요청 "예정 매치 vs 종료 매치 분리 표시" — 결과 리포트 분리 + 헤더에서도 미리 분포 확인.
  // 종료 시그널 isCompleted = (status in completed/ended/final) OR ended_at != NULL OR (started_at != NULL AND scheduledAt < now-1d)
  const isMatchCompleted = (m: (typeof matches)[number]): boolean => {
    if (m.status && ["completed", "ended", "final"].includes(m.status)) return true;
    if (m.ended_at) return true;
    if (m.started_at && m.scheduledAt && m.scheduledAt.getTime() < oneDayAgo.getTime()) return true;
    return false;
  };

  const completedCount = matches.filter(isMatchCompleted).length;
  const upcomingCount = matches.length - completedCount;

  console.log(`매치 (영상 미등록): ${matches.length}건 — 종료 ${completedCount}건 / 예정 ${upcomingCount}건\n`);

  if (matches.length === 0) {
    console.log("매칭 대상 매치가 없습니다. 종료.");
    return;
  }

  // BDR uploads 영상 일괄 fetch — Redis cache 우선 (quota 0~2)
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    console.error("YOUTUBE_API_KEY 환경변수 미설정 → 종료");
    process.exit(1);
  }

  console.log("BDR uploads playlist fetch (fetchEnrichedVideos / cache 우선)...");
  let videos: EnrichedVideo[] = [];
  try {
    // dynamic import — --playlist-id 오버라이드가 모듈 import 전에 적용되도록 보장
    const mod = await import("../../src/lib/youtube/enriched-videos");
    videos = await mod.fetchEnrichedVideos(youtubeKey);
  } catch (err) {
    console.error("fetchEnrichedVideos 실패:", err);
    process.exit(1);
  }
  console.log(`  → 영상 후보 ${videos.length}건 확보\n`);

  if (videos.length === 0) {
    console.log("BDR uploads 영상 0건 → 매칭 불가. 종료.");
    return;
  }

  // ============ v3 신규: 이미 등록된 video_id 제외 ============
  //
  // 사유: v2 에서 같은 팀 조합 + 같은 대회의 새 매치가 이전에 다른 매치에 등록된 영상에
  //       중복 매핑되는 사일런트 버그 발생 (1:1 매핑 룰이 batch 단일 실행 안에서만 보장).
  // 룰 강화: DB 에서 이미 youtube_video_id 등록된 영상 list 사전 조회 → 후보 pool 에서 제외.
  // 결과: 이전 12 매치 영상은 새 매치 후보로 안 나옴 → 같은 팀 조합 새 매치는 다른 영상 또는
  //       매칭 실패 (영상 없음 = 정상).
  //
  // 단, --include-existing 시는 정확도 비교용 read-only 모드 → 제외 룰 미적용 (이전 매치 재채점 위해 같은 영상 후보 유지).
  let availableVideos = videos;
  if (!INCLUDE_EXISTING) {
    const usedRows = await prisma.tournamentMatch.findMany({
      where: { youtube_video_id: { not: null } },
      select: { youtube_video_id: true },
    });
    const usedSet = new Set<string>(
      usedRows
        .map((m) => m.youtube_video_id)
        .filter((v): v is string => typeof v === "string" && v.length > 0),
    );
    const before = availableVideos.length;
    availableVideos = videos.filter((v) => !usedSet.has(v.videoId));
    const excluded = before - availableVideos.length;
    console.log(
      `  v3 가드 — DB 이미 등록된 영상 ${usedSet.size}건 / pool 제외 ${excluded}건 → 매칭 후보 ${availableVideos.length}건\n`,
    );
  } else {
    console.log(
      `  --include-existing — DB 등록 영상 제외 가드 미적용 (정확도 비교 모드)\n`,
    );
  }

  if (availableVideos.length === 0) {
    console.log("매칭 가능한 영상 0건 (전부 DB 등록됨) → 종료.");
    return;
  }

  // ============ 매치별 매칭 ============

  type MatchScoreResult = {
    matchId: bigint;
    matchUuid: string;
    homeTeamName: string;
    awayTeamName: string;
    tournamentName: string;
    matchCode: string | null;
    scheduledAt: Date | null;
    startedAt: Date | null;
    bestCandidate: ScoredCandidate | null;
    candidatesAbove50: ScoredCandidate[];
    // 정확도 비교용 — DB 에 이미 등록된 영상 정보 (--include-existing 시 활용)
    existingVideoId: string | null;
    existingStatus: string | null;
    // 2026-05-09 신규: 매치 분류 (종료/예정) — 결과 리포트 분리 표시용
    isCompleted: boolean;
  };

  const results: MatchScoreResult[] = [];

  for (const m of matches) {
    const meta: MatchMeta = {
      homeTeamName: m.homeTeam?.team?.name ?? "",
      awayTeamName: m.awayTeam?.team?.name ?? "",
      tournamentName: m.tournament?.name ?? "",
      roundName: m.roundName,
      matchCode: m.match_code,
      scheduledAt: m.scheduledAt,
      startedAt: m.started_at,
    };

    const matchIsCompleted = isMatchCompleted(m);

    // 양 팀 모두 빈 경우 매칭 신뢰도 0 → skip 후보 (혹시 모를 데이터 깨짐)
    if (!meta.homeTeamName && !meta.awayTeamName) {
      results.push({
        matchId: m.id,
        matchUuid: m.uuid,
        homeTeamName: "",
        awayTeamName: "",
        tournamentName: meta.tournamentName,
        matchCode: meta.matchCode,
        scheduledAt: meta.scheduledAt,
        startedAt: meta.startedAt,
        bestCandidate: null,
        candidatesAbove50: [],
        existingVideoId: m.youtube_video_id,
        existingStatus: m.youtube_status,
        isCompleted: matchIsCompleted,
      });
      continue;
    }

    // v3: availableVideos (DB 미등록 영상만) 풀에서 채점
    const scored = availableVideos
      .map((v) => scoreMatch(v, meta))
      .sort((a, b) => b.score - a.score);

    const candidatesAbove50 = scored.filter((c) => c.score >= 50);

    results.push({
      matchId: m.id,
      matchUuid: m.uuid,
      homeTeamName: meta.homeTeamName,
      awayTeamName: meta.awayTeamName,
      tournamentName: meta.tournamentName,
      matchCode: meta.matchCode,
      scheduledAt: meta.scheduledAt,
      startedAt: meta.startedAt,
      bestCandidate: scored[0] ?? null,
      candidatesAbove50,
      existingVideoId: m.youtube_video_id,
      existingStatus: m.youtube_status,
      isCompleted: matchIsCompleted,
    });
  }

  // ============ 영상-매치 1:1 매핑 (Fix 5/9) ============
  //
  // 한 video_id 가 여러 매치에 동시 매칭되는 사일런트 버그 차단.
  // 알고리즘:
  //  1) video_id 별로 그룹화 → 각 그룹에서 최고 점수 매치만 채택
  //  2) 점수 동률 시 시간 가장 가까운 매치 우선 (|video.publishedAt - match.scheduledAt| 최소)
  //  3) 패배한 매치들은 bestCandidate 를 다음 후보로 강등 (재매핑) — 단순화 위해 본 batch 에서는 제외 처리

  // 자동 채택 대상 후보 (score >= THRESHOLD) 만 1:1 매핑 적용
  type Claim = {
    matchIdx: number; // results 배열 인덱스
    score: number;
    timeDiffMs: number; // 영상 publishedAt vs 매치 시각 절대값 (작을수록 우선)
  };

  const claimsByVideo = new Map<string, Claim[]>();
  results.forEach((r, idx) => {
    const c = r.bestCandidate;
    if (!c || c.score < THRESHOLD) return;
    const matchTime = (r.startedAt ?? r.scheduledAt)?.getTime() ?? 0;
    const videoTime = new Date(c.published_at).getTime();
    const timeDiffMs = matchTime ? Math.abs(videoTime - matchTime) : Number.MAX_SAFE_INTEGER;
    const list = claimsByVideo.get(c.video_id) ?? [];
    list.push({ matchIdx: idx, score: c.score, timeDiffMs });
    claimsByVideo.set(c.video_id, list);
  });

  // video_id 별 winner 매치 인덱스 set
  const winnerIdxSet = new Set<number>();
  // video_id 별 loser 매치 인덱스 set (1:1 충돌로 자동 채택 박탈)
  const loserIdxSet = new Set<number>();

  for (const [, claims] of claimsByVideo) {
    if (claims.length === 1) {
      winnerIdxSet.add(claims[0].matchIdx);
      continue;
    }
    // 점수 desc → 시간차 asc → 첫 번째가 winner
    claims.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.timeDiffMs - b.timeDiffMs;
    });
    winnerIdxSet.add(claims[0].matchIdx);
    for (let i = 1; i < claims.length; i++) {
      loserIdxSet.add(claims[i].matchIdx);
    }
  }

  // ============ 리포트 ============

  const autoAccept = results.filter(
    (r, idx) =>
      r.bestCandidate && r.bestCandidate.score >= THRESHOLD && winnerIdxSet.has(idx),
  );
  // 1:1 충돌로 박탈된 매치는 후보 검토로 강등 (운영자 수동 결정)
  const conflictReviewable = results.filter(
    (_r, idx) => loserIdxSet.has(idx),
  );
  const reviewable = [
    ...results.filter(
      (r) =>
        r.bestCandidate &&
        r.bestCandidate.score >= 50 &&
        r.bestCandidate.score < THRESHOLD,
    ),
    ...conflictReviewable,
  ];
  const noMatch = results.filter(
    (r) => !r.bestCandidate || r.bestCandidate.score < 50,
  );

  // 2026-05-09 신규: 자동 채택을 종료/예정 분리 통계
  // 사유: 사용자 요청 "예정 매치 vs 종료 매치 분리 표시" — 사용자가 결정 가능 (예정 vs 종료 별도 결재)
  const autoAcceptCompleted = autoAccept.filter((r) => r.isCompleted);
  const autoAcceptUpcoming = autoAccept.filter((r) => !r.isCompleted);
  const reviewableCompleted = reviewable.filter((r) => r.isCompleted);
  const reviewableUpcoming = reviewable.filter((r) => !r.isCompleted);
  const noMatchCompleted = noMatch.filter((r) => r.isCompleted);
  const noMatchUpcoming = noMatch.filter((r) => !r.isCompleted);

  console.log("=".repeat(80));
  console.log(`📊 매칭 결과 요약 (threshold=${THRESHOLD})`);
  console.log("=".repeat(80));
  console.log(`  ✅ 자동 채택 (≥${THRESHOLD}점): ${autoAccept.length}건  [종료 ${autoAcceptCompleted.length} / 예정 ${autoAcceptUpcoming.length}]`);
  console.log(`  🟡 후보 검토 (50~${THRESHOLD - 1}점): ${reviewable.length}건  [종료 ${reviewableCompleted.length} / 예정 ${reviewableUpcoming.length}]`);
  console.log(`  ❌ 매칭 실패 (<50점 / 후보 0): ${noMatch.length}건  [종료 ${noMatchCompleted.length} / 예정 ${noMatchUpcoming.length}]`);
  console.log(`  📌 총 매치: ${results.length}건  [종료 ${completedCount} / 예정 ${upcomingCount}]\n`);

  // 자동 채택 매치 상세 — 종료/예정 분리 표시
  // 사용자가 --apply 결정 시 직접 확인용. 예정 매치는 "사전 영상 매핑" 시그널로 별도 표시.
  const printAutoAcceptSection = (
    label: string,
    list: typeof autoAccept,
  ) => {
    if (list.length === 0) return;
    console.log("─".repeat(80));
    console.log(`✅ ${label} (${list.length}건):`);
    console.log("─".repeat(80));
    for (const r of list) {
      const c = r.bestCandidate!;
      const dateStr = r.scheduledAt?.toISOString().slice(0, 16).replace("T", " ") ?? "?";
      console.log(
        `  [${c.score}점] match#${r.matchId.toString()} ${r.homeTeamName} vs ${r.awayTeamName}`,
      );
      console.log(`    대회: ${r.tournamentName} / 코드: ${r.matchCode ?? "-"} / 시각: ${dateStr}`);
      console.log(`    영상: ${c.video_id} — ${c.title.slice(0, 70)}${c.title.length > 70 ? "..." : ""}`);
      // v2 5요소 breakdown — 점수 분포 직관 확인용
      console.log(
        `    breakdown: home=${c.score_breakdown.home_team} away=${c.score_breakdown.away_team} tour=${c.score_breakdown.tournament} date=${c.score_breakdown.date} time=${c.score_breakdown.time}`,
      );
      console.log("");
    }
  };

  // 종료 매치 자동 채택
  printAutoAcceptSection("자동 채택 권장 — 종료 매치 (VOD)", autoAcceptCompleted);
  // 예정 매치 자동 채택 — 사전 영상 매핑 (라이브 예고 / 예고편 등)
  printAutoAcceptSection("자동 채택 권장 — 예정 매치 (사전 영상)", autoAcceptUpcoming);

  // 후보 검토 매치 (50~99점 + 1:1 충돌 박탈) — 운영자 수동 검토 권장
  if (reviewable.length > 0) {
    console.log("─".repeat(80));
    console.log(
      `🟡 후보 검토 매치 (운영자 수동 결정 권장 — ${reviewable.length}건${conflictReviewable.length > 0 ? ` / 1:1 충돌 박탈 ${conflictReviewable.length}건 포함` : ""}):`,
    );
    console.log("─".repeat(80));
    for (const r of reviewable.slice(0, 30)) {
      const c = r.bestCandidate!;
      const matchIdx = results.indexOf(r);
      const conflictTag = loserIdxSet.has(matchIdx) ? " [1:1 충돌 박탈]" : "";
      console.log(
        `  [${c.score}점] match#${r.matchId.toString()} ${r.homeTeamName} vs ${r.awayTeamName} — ${c.video_id}${conflictTag}`,
      );
    }
    if (reviewable.length > 30) {
      console.log(`  ... (+${reviewable.length - 30}건 생략)`);
    }
    console.log("");
  }

  // 매칭 실패 (50점 미만 / 후보 0)
  if (noMatch.length > 0) {
    console.log("─".repeat(80));
    console.log(`❌ 매칭 실패 매치 (${noMatch.length}건):`);
    console.log("─".repeat(80));
    for (const r of noMatch.slice(0, 20)) {
      const reason = !r.bestCandidate ? "(후보 0건)" : `(최고 ${r.bestCandidate.score}점)`;
      console.log(
        `  match#${r.matchId.toString()} ${r.homeTeamName || "?"} vs ${r.awayTeamName || "?"} ${reason}`,
      );
    }
    if (noMatch.length > 20) {
      console.log(`  ... (+${noMatch.length - 20}건 생략)`);
    }
    console.log("");
  }

  // ============ 정확도 비교 표 (--include-existing 활성 시) ============
  //
  // 이전 알고리즘 (60점 임계값 + 양 팀 매칭만) 으로 등록된 매치를
  // 신규 알고리즘 (80점 임계값 + 5요소) 으로 재채점하여 정확도 검증.
  //
  // 분류:
  //  1. 일치 (자동→자동): 이전 자동 채택 + 신규 알고리즘도 같은 video_id 자동 채택 ✅
  //  2. 강등 (자동→후보): 이전 자동 채택 / 신규 80점 미만 (대회명/날짜 미매칭 — 오매칭 가능성)
  //  3. 영상 변경 (자동→자동 다른영상): 이전 영상 ≠ 신규 best — 운영자 검토 필요
  //  4. 후보없음 (자동→실패): 신규 알고리즘에서 후보 0건 — 영상 fetch 누락 가능
  if (INCLUDE_EXISTING) {
    const previouslyMatched = results.filter((r) => r.existingVideoId !== null);
    if (previouslyMatched.length > 0) {
      console.log("=".repeat(80));
      console.log(`📐 정확도 비교 — 이전 알고리즘 채택 매치 ${previouslyMatched.length}건 재채점`);
      console.log("=".repeat(80));

      let consistent = 0; // 일치 (자동→자동 같은 영상)
      let demoted = 0; // 강등 (자동→후보)
      let videoChanged = 0; // 영상 변경 (자동→자동 다른 영상)
      let noCandidate = 0; // 후보 0건

      console.log(
        "\n| match# | 매치 | 이전 영상 | 이전 status | 신규 점수 | 신규 best 영상 | 분류 |",
      );
      console.log(
        "|--------|------|-----------|-------------|-----------|----------------|------|",
      );

      for (const r of previouslyMatched) {
        const matchLabel = `${r.homeTeamName} vs ${r.awayTeamName}`;
        const prevVideo = r.existingVideoId ?? "?";
        const prevStatus = r.existingStatus ?? "?";
        const newScore = r.bestCandidate?.score ?? 0;
        const newVideo = r.bestCandidate?.video_id ?? "(후보 0)";

        let classification = "";
        if (!r.bestCandidate) {
          classification = "후보없음 ⚠️";
          noCandidate++;
        } else if (newScore < THRESHOLD) {
          classification = `강등→후보 (${newScore}점)`;
          demoted++;
        } else if (r.bestCandidate.video_id === r.existingVideoId) {
          classification = `일치 ✅ (${newScore}점)`;
          consistent++;
        } else {
          classification = `영상변경 ⚠️ (${newScore}점)`;
          videoChanged++;
        }

        console.log(
          `| ${r.matchId.toString()} | ${matchLabel} | ${prevVideo} | ${prevStatus} | ${newScore} | ${newVideo} | ${classification} |`,
        );
      }

      const total = previouslyMatched.length;
      const accuracyPct = total > 0 ? ((consistent / total) * 100).toFixed(1) : "0.0";

      console.log("");
      console.log("─".repeat(80));
      console.log(`📊 정확도 결과 (이전 ${total}건 재채점):`);
      console.log("─".repeat(80));
      console.log(`  ✅ 일치 (자동→자동 같은 영상): ${consistent}건 (${accuracyPct}%)`);
      console.log(`  ⚠️  강등 (자동→후보, 오매칭 가능성): ${demoted}건`);
      console.log(`  ⚠️  영상변경 (자동→자동 다른 영상): ${videoChanged}건`);
      console.log(`  ⚠️  후보없음 (영상 fetch 누락): ${noCandidate}건`);
      console.log("");

      if (consistent === total && total > 0) {
        console.log(
          `  🎯 정확도 100% — 이전 ${total}건 모두 신규 알고리즘에서도 동일 영상 자동 채택`,
        );
        console.log(`     → 신규 알고리즘 안전, --apply 권장.\n`);
      } else if (demoted > 0 || videoChanged > 0) {
        console.log(
          `  📌 강등/영상변경 ${demoted + videoChanged}건 — 운영자 수동 검토 권장 후 --apply.\n`,
        );
      }
    }
  }

  // ============ --apply: 실제 등록 ============

  if (!APPLY) {
    // dry-run 종료 메시지 — UPDATE 가능 건수 (이전 채택 매치 제외) 안내
    const newAutoCount = autoAccept.filter((r) => r.existingVideoId === null).length;
    console.log("=".repeat(80));
    console.log("🟢 dry-run 종료. DB 변경 0.");
    console.log(
      `   실제 등록 (${newAutoCount}건 신규 채택): npx tsx scripts/_temp/youtube-batch-match.ts --apply\n`,
    );
    return;
  }

  // 안전 가드: --include-existing 시 이전 채택 매치는 UPDATE 대상에서 제외
  // (NULL → 값 단방향 정책 + 이미 운영 적용된 매치 덮어쓰기 차단)
  const applyTargets = autoAccept.filter((r) => r.existingVideoId === null);
  const skippedExisting = autoAccept.length - applyTargets.length;

  if (skippedExisting > 0) {
    console.log(
      `⚠️  --include-existing 가드 — 이전 채택 매치 ${skippedExisting}건 UPDATE 제외 (NULL→값 단방향 정책)`,
    );
  }

  if (applyTargets.length === 0) {
    console.log("=".repeat(80));
    console.log("⚠️  자동 채택 대상 0건 (UPDATE 가능 매치) — UPDATE 실행 안 함. 종료.\n");
    return;
  }

  // admin_logs 작성용 admin_id 결정
  const adminId = await resolveAdminId();
  if (!adminId) {
    console.error("❌ admin_id 결정 실패 (super_admin 사용자 없음 / --admin-id=<N> 명시 필요)");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log(`🚀 [APPLY] ${applyTargets.length}건 UPDATE 실행 (admin_id=${adminId.toString()})`);
  console.log("=".repeat(80));

  const now = new Date();
  let updated = 0;
  let failed = 0;

  for (const r of applyTargets) {
    const c = r.bestCandidate!;
    try {
      // 단일 SQL UPDATE (NULL → 값 / 운영 영향 0)
      await prisma.tournamentMatch.update({
        where: { id: r.matchId },
        data: {
          youtube_video_id: c.video_id,
          youtube_status: "auto_verified", // batch 자동 채택 = auto_verified
          youtube_verified_at: now,
        },
      });

      // admin_logs INSERT — batch 운영자 활동 추적 (severity=info)
      await prisma.admin_logs.create({
        data: {
          admin_id: adminId,
          action: "match_youtube_stream_batch_auto",
          resource_type: "tournament_match",
          resource_id: r.matchId,
          target_type: "tournament_match",
          target_id: r.matchId,
          description: `[batch] 매치 ${r.matchId.toString()} YouTube 자동 매칭 (score=${c.score}, video=${c.video_id})`,
          severity: "info",
          changes_made: {
            tournament_match_id: r.matchId.toString(),
            youtube_video_id: c.video_id,
            youtube_status: "auto_verified",
            score: c.score,
            score_breakdown: c.score_breakdown,
          },
          previous_values: {
            youtube_video_id: null,
            youtube_status: null,
          },
          created_at: now,
          updated_at: now,
        },
      });

      updated++;
      console.log(
        `  ✅ match#${r.matchId.toString()} ← ${c.video_id} (score=${c.score})`,
      );
    } catch (err) {
      failed++;
      console.error(`  ❌ match#${r.matchId.toString()} UPDATE 실패:`, err);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log(`🏁 [APPLY] 완료 — UPDATE 성공 ${updated}건 / 실패 ${failed}건`);
  console.log("=".repeat(80) + "\n");
}

main()
  .catch((err) => {
    console.error("❌ 스크립트 실행 중 오류:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
