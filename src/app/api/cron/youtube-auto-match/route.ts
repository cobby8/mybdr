// 2026-05-09 — YouTube 영상 ↔ 매치 자동 매칭 cron (5분 폴링).
//
// 이유(왜):
//   - BDR uploads 에 새 영상 업로드 시 5분 내 자동 매칭 (운영자 수동 등록 0).
//   - PR-B (auto-register) 는 라이브 페이지 viewer 폴링 트리거 — viewer 0명이거나
//     윈도우 ±10분 밖 매치 (예정 매치 + 종료 매치) 는 매칭 안 됨.
//   - 본 cron 은 모든 미등록 매치 (예정 + 진행중 + 종료) 를 5분 주기로 스캔 — viewer 무관 자동 박제.
//   - 기존 batch script (`scripts/_temp/youtube-batch-match.ts`) 의 v3 알고리즘 본체를 cron 으로 자동화.
//
// 방법(어떻게):
//   1) Vercel Cron Bearer 가드 (CRON_SECRET) — lineup-reminder / stale-pending-fix 동일 패턴
//   2) 미등록 매치 (`youtube_video_id IS NULL`) 모두 SELECT — 예정 + 진행중 + 종료 무관
//   3) DB 이미 등록된 video_id pool 사전 조회 → 후보 영상 pool 에서 제외 (1:1 매핑 가드)
//   4) BDR uploads playlist fetch (fetchEnrichedVideos / Redis cache 공유 — quota 0~2)
//   5) 매치별 v3 점수 계산 (홈25 + 어웨이25 + 대회20 + 같은날20 + 시간10 = 100)
//   6) 1:1 매핑 가드 — 같은 video_id 가 여러 매치에 채택되면 점수 desc / 시간차 asc 1건만 winner
//   7) ≥80점 winner 매치 UPDATE (`youtube_video_id` + `youtube_status="auto_verified"` + `youtube_verified_at`)
//   8) admin_logs INSERT — audit (severity=info / action="auto_match_youtube_cron")
//
// 가드:
//   - 미등록 매치 0건 → 200 + scanned/matched/applied/skipped 모두 0 (idle)
//   - YouTube API 키 미설정 → 503 (다음 cron 사이클 재시도)
//   - 80점 미만 = 자동 채택 X (사용자 수동 검토)
//   - admin_logs 실패 = silent (등록은 성공)
//   - 1시간 미만 영상 = 다음 cron 사이클에서 매칭 (5분 주기 폴링이라 OK)
//
// 회귀:
//   - DB schema 변경 0 (UPDATE 만 / NULL → 값 단방향)
//   - destructive SQL 0
//   - Flutter v1 영향 0 (web cron only — `/api/v1/...` 무관)
//   - 기존 batch script 그대로 유지 (수동 실행 backup)
//   - 기존 cron 7건 영향 0 (별도 path / schedule)
//
// 환경변수:
//   - CRON_SECRET (lineup-reminder 와 공유 — 이미 운영 등록)
//   - YOUTUBE_API_KEY + BDR_YOUTUBE_UPLOADS_PLAYLIST_ID (이미 운영 등록)
//   - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (선택 — 미설정 시 인메모리 fallback)
//
// vercel.json: { "path": "/api/cron/youtube-auto-match", "schedule": "*/5 * * * *" }

import { type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { fetchEnrichedVideos, type EnrichedVideo } from "@/lib/youtube/enriched-videos";
// 2026-05-10 백포트 — swap-aware 헬퍼 단일 source (score-match.ts 와 통합)
// 본 cron 의 v3 점수 체계 (25+25+20+20+10 = 100점) 는 유지 / 팀명 토큰 추출만 공용 사용
import { extractTeamsFromTitle, normalizeTeamName } from "@/lib/youtube/score-match";

// ============ v3 알고리즘 점수 (batch script 와 동일 — 100점 만점) ============
// 본 알고리즘은 batch script v3 와 정합 유지 (search/auto-register 의 v2 165점 algorithm 과 다름).
// 사유: cron 자동 매칭은 정확 날짜 매칭 기반 (라이브 박제 / 같은날 only) — search/auto-register 는 윈도우
//       ±10분 라이브 트리거 (시간 시그널 강함). 두 알고리즘 분리 운영.
const SCORE_HOME_EXACT = 25; // 홈팀 정확 일치
const SCORE_AWAY_EXACT = 25; // 어웨이팀 정확 일치
const SCORE_TOURNAMENT_FULL = 20; // 대회명 풀 매칭 또는 토큰 2개+
const SCORE_TOURNAMENT_PARTIAL = 10; // 대회명 토큰 1개
const SCORE_DATE_SAME_DAY = 20; // 같은 날 (KST 기준)
const SCORE_DATE_PLUS_MINUS_1 = 5; // ±1일 (자정 경계 시간대 오차 — 임계값 미달)
const SCORE_TIME_6H = 10; // ±6시간
const SCORE_TIME_24H = 5; // ±24시간

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
// 2026-05-09 — 시간 윈도우 ±1h 강제 가드 (사용자 결정).
// 사유: 게임 지연 가능성 흡수하면서 다른 시간대 매치 영상 잘못 매칭 차단.
//       ±1h 외 영상은 후보 자체에서 제외 (점수 계산 X / 다른 점수 만족해도 매칭 X).
const TIME_WINDOW_MS = 60 * 60 * 1000;

// 자동 채택 임계값 — 양 팀 정확 50 + 대회명 20 + 같은날 20 = 90점 (정상 자동 채택)
// 차단 케이스: 다른 날 영상 = 양 팀 50 + 대회명 20 + 날짜 0 + 시간 0 = 70점 (미달)
const SCORE_THRESHOLD = 80;

interface ScoreBreakdown {
  home_team: number;
  away_team: number;
  tournament: number;
  date: number;
  time: number;
}

interface ScoredCandidate {
  video_id: string;
  title: string;
  score: number;
  is_live: boolean;
  published_at: string;
  score_breakdown: ScoreBreakdown;
}

interface MatchMeta {
  homeTeamName: string;
  awayTeamName: string;
  tournamentName: string;
  scheduledAt: Date | null;
  startedAt: Date | null;
}

// 2026-05-10 백포트 — `normalizeTeamName` / `extractTeamsFromTitle` 는
// score-match.ts 단일 source 에서 import (cron + search/auto-register 동일 알고리즘).

// YYYY-MM-DD (UTC) — DB scheduledAt 도 UTC 라 비교 일치
function toDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// 대회명 정규화 — 토큰 단위 부분 매칭용
function extractTournamentKeywords(name: string): string[] {
  return name
    .replace(/[()\[\]·.\-_]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2)
    .map((t) => t.toLowerCase());
}

// 매치 + 영상 1건 → 신뢰도 점수 (v3 — batch script 와 동일)
function scoreMatchV3(video: EnrichedVideo, match: MatchMeta): ScoredCandidate {
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
      score: 0,
      is_live: video.liveBroadcastContent === "live",
      published_at: video.publishedAt,
      score_breakdown: breakdown,
    };
  }

  // 1+2) 양 팀 매칭 — 영상 제목 토큰 분리 후 정확/swap 비교
  const titleTeams = extractTeamsFromTitle(video.title);
  if (titleTeams) {
    const videoHome = normalizeTeamName(titleTeams.home);
    const videoAway = normalizeTeamName(titleTeams.away);
    const matchHome = normalizeTeamName(match.homeTeamName);
    const matchAway = normalizeTeamName(match.awayTeamName);

    if (matchHome && matchAway && videoHome && videoAway) {
      const exactSame = videoHome === matchHome && videoAway === matchAway;
      const exactSwap = videoHome === matchAway && videoAway === matchHome;
      if (exactSame || exactSwap) {
        breakdown.home_team = SCORE_HOME_EXACT;
        breakdown.away_team = SCORE_AWAY_EXACT;
      }
    }
  }

  // 3) 대회명 매칭
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");
  if (match.tournamentName) {
    const fullNorm = match.tournamentName.replace(/\s+/g, "").toLowerCase();
    if (fullNorm.length >= 4 && haystackNorm.includes(fullNorm)) {
      breakdown.tournament = SCORE_TOURNAMENT_FULL;
    } else {
      const tokens = extractTournamentKeywords(match.tournamentName);
      let hits = 0;
      for (const t of tokens) {
        const tNorm = t.replace(/\s+/g, "");
        if (tNorm.length >= 2 && haystackNorm.includes(tNorm)) hits++;
      }
      if (hits >= 2) breakdown.tournament = SCORE_TOURNAMENT_FULL;
      else if (hits === 1) breakdown.tournament = SCORE_TOURNAMENT_PARTIAL;
    }
  }

  // 4) 날짜 매칭 — 같은날 only (자동 채택 시그널)
  const matchAt = match.startedAt ?? match.scheduledAt;
  const videoAt = new Date(video.publishedAt);
  if (matchAt) {
    const matchDate = toDateOnly(matchAt);
    const videoDate = toDateOnly(videoAt);
    const diffAbsMs = Math.abs(videoAt.getTime() - matchAt.getTime());
    if (matchDate === videoDate) {
      breakdown.date = SCORE_DATE_SAME_DAY;
    } else if (diffAbsMs <= 24 * 60 * 60 * 1000) {
      // ±1일 (자정 경계 — 임계값 도달 불가하게 약한 점수만 부여)
      breakdown.date = SCORE_DATE_PLUS_MINUS_1;
    }
  }

  // 5) 시간 매칭
  if (matchAt) {
    const diffAbs = Math.abs(videoAt.getTime() - matchAt.getTime());
    if (diffAbs <= SIX_HOURS_MS) breakdown.time = SCORE_TIME_6H;
    else if (diffAbs <= TWENTY_FOUR_HOURS_MS) breakdown.time = SCORE_TIME_24H;
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
    score,
    is_live: video.liveBroadcastContent === "live",
    published_at: video.publishedAt,
    score_breakdown: breakdown,
  };
}

// ============ admin_logs system actor (PR-B / stale-pending-fix 패턴 동일) ============
// admin_id NOT NULL FK → super_admin 첫 번째를 system actor 로 박제.
// 모듈 단위 1회 캐시 — 운영 DB 에 super_admin ≥1 보장됨.
let cachedSystemAdminId: bigint | null = null;
async function resolveSystemAdminId(): Promise<bigint | null> {
  if (cachedSystemAdminId !== null) return cachedSystemAdminId;
  const sa = await prisma.user.findFirst({
    where: { admin_role: "super_admin", isAdmin: true },
    select: { id: true },
    orderBy: { id: "asc" },
  });
  cachedSystemAdminId = sa?.id ?? null;
  return cachedSystemAdminId;
}

/**
 * GET /api/cron/youtube-auto-match
 *
 * Vercel Cron 만 호출 가능 (Bearer CRON_SECRET 가드).
 * 5분 폴링 (vercel.json crons schedule).
 *
 * 200 응답:
 *   {
 *     scanned: number,    // 미등록 매치 SELECT 건수
 *     matched: number,    // 점수 ≥80 winner 후보 매치 건수 (1:1 매핑 후)
 *     applied: number,    // 실제 UPDATE 성공 건수
 *     skipped: number,    // 1:1 충돌로 박탈된 매치 건수
 *     fetched_at: ISO,
 *   }
 * 401 = Bearer 가드 실패
 * 503 = YouTube API 키 미설정 (다음 cron 재시도)
 */
export async function GET(req: NextRequest) {
  // 1) Vercel Cron 만 호출 가능 — Bearer 가드
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return apiError("Unauthorized", 401);
  }

  const now = new Date();

  // 2) 미등록 매치 SELECT — 모든 매치 (예정 + 진행중 + 종료) 무관 / youtube_video_id IS NULL
  const matches = await prisma.tournamentMatch.findMany({
    where: { youtube_video_id: null },
    select: {
      id: true,
      scheduledAt: true,
      started_at: true,
      tournament: { select: { name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
  });

  // 3) 미등록 매치 0건 → idle 응답
  if (matches.length === 0) {
    return apiSuccess({
      scanned: 0,
      matched: 0,
      applied: 0,
      skipped: 0,
      fetched_at: now.toISOString(),
    });
  }

  // 4) YouTube API 키 확인 — 미설정 시 503 (다음 cron 사이클 재시도)
  const youtubeKey = process.env.YOUTUBE_API_KEY;
  if (!youtubeKey) {
    return apiError("YouTube API 가 설정되지 않았습니다.", 503, "YOUTUBE_API_NOT_CONFIGURED");
  }

  // 5) BDR uploads playlist fetch (Redis cache 공유 — quota 0~2)
  let videos: EnrichedVideo[] = [];
  try {
    videos = await fetchEnrichedVideos(youtubeKey);
  } catch (err) {
    console.error("[youtube-auto-match] fetchEnrichedVideos failed:", err);
    return apiError("YouTube 영상 조회에 실패했습니다.", 502);
  }

  if (videos.length === 0) {
    return apiSuccess({
      scanned: matches.length,
      matched: 0,
      applied: 0,
      skipped: 0,
      fetched_at: now.toISOString(),
    });
  }

  // 6) v3 1:1 매핑 가드 — DB 이미 등록된 video_id pool 사전 조회 → 후보 pool 제외
  // 사유: 같은 팀 조합 + 같은 대회의 새 매치가 이전 영상에 중복 매핑되는 사일런트 버그 차단.
  const usedRows = await prisma.tournamentMatch.findMany({
    where: { youtube_video_id: { not: null } },
    select: { youtube_video_id: true },
  });
  const usedSet = new Set<string>(
    usedRows
      .map((m) => m.youtube_video_id)
      .filter((v): v is string => typeof v === "string" && v.length > 0),
  );
  const availableVideos = videos.filter((v) => !usedSet.has(v.videoId));

  if (availableVideos.length === 0) {
    return apiSuccess({
      scanned: matches.length,
      matched: 0,
      applied: 0,
      skipped: 0,
      fetched_at: now.toISOString(),
    });
  }

  // 7) 매치별 점수 계산 + best 후보 선정
  type Result = {
    matchId: bigint;
    homeTeamName: string;
    awayTeamName: string;
    scheduledAt: Date | null;
    startedAt: Date | null;
    bestCandidate: ScoredCandidate | null;
  };

  const results: Result[] = matches.map((m) => {
    const meta: MatchMeta = {
      homeTeamName: m.homeTeam?.team?.name ?? "",
      awayTeamName: m.awayTeam?.team?.name ?? "",
      tournamentName: m.tournament?.name ?? "",
      scheduledAt: m.scheduledAt,
      startedAt: m.started_at,
    };

    // 양 팀 모두 빈 매치는 매칭 skip
    if (!meta.homeTeamName && !meta.awayTeamName) {
      return {
        matchId: m.id,
        homeTeamName: "",
        awayTeamName: "",
        scheduledAt: meta.scheduledAt,
        startedAt: meta.startedAt,
        bestCandidate: null,
      };
    }

    const scored = availableVideos
      .map((v) => scoreMatchV3(v, meta))
      .sort((a, b) => b.score - a.score);

    return {
      matchId: m.id,
      homeTeamName: meta.homeTeamName,
      awayTeamName: meta.awayTeamName,
      scheduledAt: meta.scheduledAt,
      startedAt: meta.startedAt,
      bestCandidate: scored[0] ?? null,
    };
  });

  // 8) 1:1 매핑 — 같은 video_id 가 여러 매치에 채택되면 점수 desc / 시간차 asc winner 1건만
  // 사유: BDR 영상 1건 ↔ 매치 1건 단방향 룰 (batch script 와 동일).
  type Claim = { matchIdx: number; score: number; timeDiffMs: number };
  const claimsByVideo = new Map<string, Claim[]>();
  results.forEach((r, idx) => {
    const c = r.bestCandidate;
    if (!c || c.score < SCORE_THRESHOLD) return;
    const matchTime = (r.startedAt ?? r.scheduledAt)?.getTime() ?? 0;
    const videoTime = new Date(c.published_at).getTime();
    const timeDiffMs = matchTime
      ? Math.abs(videoTime - matchTime)
      : Number.MAX_SAFE_INTEGER;
    const list = claimsByVideo.get(c.video_id) ?? [];
    list.push({ matchIdx: idx, score: c.score, timeDiffMs });
    claimsByVideo.set(c.video_id, list);
  });

  const winnerIdxSet = new Set<number>();
  let conflictSkipped = 0;
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
    conflictSkipped += claims.length - 1;
  }

  // 9) winner 매치 UPDATE + admin_logs INSERT
  const winners = results.filter((_, idx) => winnerIdxSet.has(idx));

  if (winners.length === 0) {
    return apiSuccess({
      scanned: matches.length,
      matched: 0,
      applied: 0,
      skipped: conflictSkipped,
      fetched_at: now.toISOString(),
    });
  }

  // admin_id 미리 1회 resolve (createMany 일괄 INSERT 용)
  const systemAdminId = await resolveSystemAdminId();

  let applied = 0;
  // admin_logs createMany 일괄 INSERT input 수집
  const logInputs: Prisma.admin_logsCreateManyInput[] = [];

  for (const r of winners) {
    const c = r.bestCandidate!;
    try {
      // UPDATE 가드: youtube_video_id IS NULL 재확인 (race condition — 동시 cron / auto-register 방어)
      // updateMany 로 where 절에 NULL 가드 명시 → 다른 process 가 먼저 등록하면 count=0
      const updResult = await prisma.tournamentMatch.updateMany({
        where: { id: r.matchId, youtube_video_id: null },
        data: {
          youtube_video_id: c.video_id,
          youtube_status: "auto_verified",
          youtube_verified_at: now,
        },
      });

      if (updResult.count === 0) {
        // race condition — 다른 process 가 먼저 등록 / skip
        continue;
      }

      applied++;

      // admin_logs 박제 (silent fail OK — 등록 자체는 성공)
      if (systemAdminId !== null) {
        logInputs.push({
          admin_id: systemAdminId,
          action: "auto_match_youtube_cron",
          resource_type: "tournament_match",
          resource_id: r.matchId,
          target_type: "tournament_match",
          target_id: r.matchId,
          changes_made: {
            video_id: c.video_id,
            title: c.title,
            score: c.score,
            score_breakdown: c.score_breakdown,
            is_live: c.is_live,
            status: "auto_verified",
            trigger: "cron_5min_polling",
          } as unknown as Prisma.InputJsonValue,
          previous_values: {
            youtube_video_id: null,
            youtube_status: null,
          } as Prisma.InputJsonValue,
          severity: "info",
          description: `cron auto-match score=${c.score} video=${c.video_id}`,
          created_at: now,
          updated_at: now,
        });
      }
    } catch (err) {
      // 단일 매치 UPDATE 실패 = 다음 매치로 진행 (cron 전체 중단 X)
      console.error(
        `[youtube-auto-match] match#${r.matchId.toString()} UPDATE failed:`,
        err,
      );
    }
  }

  // admin_logs createMany 일괄 INSERT (실패해도 cron 응답은 성공)
  if (logInputs.length > 0) {
    try {
      await prisma.admin_logs.createMany({ data: logInputs });
    } catch (err) {
      console.error("[youtube-auto-match] admin_logs.createMany failed:", err);
    }
  }

  return apiSuccess({
    scanned: matches.length,
    matched: winners.length,
    applied,
    skipped: conflictSkipped,
    fetched_at: now.toISOString(),
  });
}
