/**
 * 2026-05-09 — 종료 매치 YouTube 일괄 자동 매칭 batch (developer 1회성).
 *
 * 컨텍스트:
 *   PR1~5 완료 후 누적된 종료 매치 (youtube_video_id IS NULL) 들에 대해
 *   BDR uploads playlist (150건) 와 1회 매칭 → 80점+ 자동 등록 권장 / 50~79 후보 보고.
 *
 * 흐름:
 *   1) 종료 매치 list 조회 (youtube_video_id IS NULL + 종료 조건)
 *   2) BDR uploads 영상 일괄 fetch (fetchEnrichedVideos / Redis cache)
 *   3) 매치별 scoreMatch (search/route.ts 와 동일 알고리즘 inline)
 *   4) dry-run 기본 — 결과 리포트만 / --apply 시 80점+ DB UPDATE + admin_logs
 *
 * 안전 가드 (CLAUDE.md §DB 정책):
 *   - dry-run 기본 (실수 방지)
 *   - UPDATE 만 (NULL → 값) / DROP / TRUNCATE / 대량 DELETE 0
 *   - 80점 미만 자동 등록 X (사용자 검토 후 수동 등록)
 *   - Flutter v1 영향 0 (`/api/v1/...` schema 비변경)
 *   - BigInt 직렬화: id.toString() 명시
 *
 * 사용법:
 *   npx tsx scripts/_temp/youtube-batch-match.ts                   # dry-run
 *   npx tsx scripts/_temp/youtube-batch-match.ts --apply           # 실제 UPDATE
 *   npx tsx scripts/_temp/youtube-batch-match.ts --tournament=<uuid>
 *   npx tsx scripts/_temp/youtube-batch-match.ts --threshold=70    # 임계값 조정
 *   npx tsx scripts/_temp/youtube-batch-match.ts --limit=20        # 테스트용
 *   npx tsx scripts/_temp/youtube-batch-match.ts --apply --admin-id=1   # admin_logs 작성자
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
const TOURNAMENT_FILTER = (() => {
  const a = args.find((x) => x.startsWith("--tournament="));
  return a ? a.replace("--tournament=", "").trim() : null;
})();
// Fix (5/9): 양 팀 정확 매칭 + 1:1 매핑 도입 후 자동 채택 임계값 60점으로 조정
// 사유: VOD 업로드는 매치 종료 후 며칠 뒤 올라오므로 time 점수 0~10 이 정상.
// 양 팀 정확 매칭 (home=30 + away=30 = 60) 만으로도 강한 시그널이며
// 1:1 매핑 + 양 팀 정확 매칭 조합으로 오매칭은 차단됨.
const THRESHOLD = (() => {
  const a = args.find((x) => x.startsWith("--threshold="));
  if (!a) return 60;
  const v = parseInt(a.replace("--threshold=", ""), 10);
  return Number.isFinite(v) && v >= 0 && v <= 200 ? v : 60;
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

// Q2: 시간 매칭 ± 30분
const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000;

interface ScoreBreakdown {
  time: number;
  home_team: number;
  away_team: number;
  tournament: number;
  match_code: number;
  round: number;
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

// 매치 + 영상 1건 → 신뢰도 점수
//
// Fix (5/9):
//  - 이전: 양 팀 부분 매칭 (한 팀만 일치해도 30점) → 오매칭 발생 (예: "업템포 vs MI" ↔ "슬로우 vs 업템포")
//  - 신규: 영상 제목에서 양 팀 추출 → 매치 양 팀 정확 일치 (swap 포함) 시만 home=30+away=30
//  - 한 팀만 일치 = 0점 (오매칭 차단)
function scoreMatch(video: EnrichedVideo, match: MatchMeta): ScoredCandidate {
  const breakdown: ScoreBreakdown = {
    time: 0,
    home_team: 0,
    away_team: 0,
    tournament: 0,
    match_code: 0,
    round: 0,
  };

  // 1) 시간 매칭 — 영상 publishedAt vs 매치 시작/예정 시각
  const matchTime = (match.startedAt ?? match.scheduledAt)?.getTime();
  if (matchTime) {
    const videoTime = new Date(video.publishedAt).getTime();
    const diff = Math.abs(videoTime - matchTime);
    if (diff <= TIME_MATCH_WINDOW_MS) {
      breakdown.time = 60;
    } else if (diff <= TIME_MATCH_WINDOW_MS * 2) {
      breakdown.time = 30;
    } else if (diff <= TIME_MATCH_WINDOW_MS * 8) {
      breakdown.time = 10;
    }
  }

  // 2) 양 팀 정확 매칭 (가장 중요 — 오매칭 차단)
  // 영상 제목에서 "vs"/"대" 토큰 분리 → home/away 추출 → 매치와 정확 비교
  const titleTeams = extractTeamsFromTitle(video.title);
  if (titleTeams) {
    const videoHome = normalizeTeamName(titleTeams.home);
    const videoAway = normalizeTeamName(titleTeams.away);
    const matchHome = normalizeTeamName(match.homeTeamName);
    const matchAway = normalizeTeamName(match.awayTeamName);

    if (matchHome && matchAway && videoHome && videoAway) {
      const exactSame =
        videoHome === matchHome && videoAway === matchAway;
      // swap: 영상이 매치의 어웨이 vs 홈 순서로 표기된 경우도 OK
      const exactSwap =
        videoHome === matchAway && videoAway === matchHome;

      if (exactSame || exactSwap) {
        breakdown.home_team = 30;
        breakdown.away_team = 30;
      }
      // 한 팀만 일치 / 부분 일치 = 0점 (오매칭 차단)
    }
  }

  // 3) 보조 시그널 (대회명/매치코드/라운드) — 키워드 매칭 (양 팀 정확 매칭 못해도 참고용)
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");

  // 대회명 — 앞 8자만 부분 매칭
  const tournamentTrim = match.tournamentName.replace(/\s+/g, "").toLowerCase().slice(0, 8);
  if (tournamentTrim.length >= 3 && haystackNorm.includes(tournamentTrim)) {
    breakdown.tournament = 10;
  }

  // 매치 코드 — 가장 강한 시그널 (예: "26-GG-MD21-001")
  if (match.matchCode && haystack.includes(match.matchCode.toLowerCase())) {
    breakdown.match_code = 20;
  }

  // 라운드 — 약한 시그널 ("결승" / "8강" / "준결승")
  if (match.roundName) {
    const roundNorm = match.roundName.replace(/\s+/g, "").toLowerCase();
    if (roundNorm.length >= 2 && haystackNorm.includes(roundNorm)) {
      breakdown.round = 5;
    }
  }

  const score =
    breakdown.time +
    breakdown.home_team +
    breakdown.away_team +
    breakdown.tournament +
    breakdown.match_code +
    breakdown.round;

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
  console.log(`\n${mode}`);
  console.log(`  threshold: ${THRESHOLD}점 (자동 채택 기준)`);
  console.log(`  tournament: ${TOURNAMENT_FILTER ?? "(전체)"}`);
  console.log(`  limit: ${LIMIT ?? "(unlimited)"}\n`);

  // 종료 매치 조건 — youtube_video_id IS NULL + 종료 시그널
  // status = completed/ended/final 이면 OR ended_at != NULL 이면 OR (started_at != NULL AND scheduledAt < now()-1d)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where: Prisma.TournamentMatchWhereInput = {
    youtube_video_id: null, // 이미 등록된 매치 skip
    AND: [
      ...(TOURNAMENT_FILTER ? [{ tournamentId: TOURNAMENT_FILTER }] : []),
      {
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
      },
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
      tournament: { select: { id: true, name: true } },
      homeTeam: { include: { team: { select: { name: true } } } },
      awayTeam: { include: { team: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: "desc" },
    take: LIMIT ?? undefined,
  });

  console.log(`종료 매치 (영상 미등록): ${matches.length}건\n`);

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
      });
      continue;
    }

    const scored = videos
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

  console.log("=".repeat(80));
  console.log(`📊 매칭 결과 요약 (threshold=${THRESHOLD})`);
  console.log("=".repeat(80));
  console.log(`  ✅ 자동 채택 (≥${THRESHOLD}점): ${autoAccept.length}건`);
  console.log(`  🟡 후보 검토 (50~${THRESHOLD - 1}점): ${reviewable.length}건`);
  console.log(`  ❌ 매칭 실패 (<50점 / 후보 0): ${noMatch.length}건`);
  console.log(`  📌 총 종료 매치: ${results.length}건\n`);

  // 자동 채택 매치 상세 (사용자가 --apply 결정 시 직접 확인용)
  if (autoAccept.length > 0) {
    console.log("─".repeat(80));
    console.log(`✅ 자동 채택 권장 매치 (${autoAccept.length}건):`);
    console.log("─".repeat(80));
    for (const r of autoAccept) {
      const c = r.bestCandidate!;
      const dateStr = r.scheduledAt?.toISOString().slice(0, 16).replace("T", " ") ?? "?";
      console.log(
        `  [${c.score}점] match#${r.matchId.toString()} ${r.homeTeamName} vs ${r.awayTeamName}`,
      );
      console.log(`    대회: ${r.tournamentName} / 코드: ${r.matchCode ?? "-"} / 시각: ${dateStr}`);
      console.log(`    영상: ${c.video_id} — ${c.title.slice(0, 70)}${c.title.length > 70 ? "..." : ""}`);
      console.log(
        `    breakdown: time=${c.score_breakdown.time} home=${c.score_breakdown.home_team} away=${c.score_breakdown.away_team} tour=${c.score_breakdown.tournament} code=${c.score_breakdown.match_code} round=${c.score_breakdown.round}`,
      );
      console.log("");
    }
  }

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

  // ============ --apply: 실제 등록 ============

  if (!APPLY) {
    console.log("=".repeat(80));
    console.log("🟢 dry-run 종료. DB 변경 0.");
    console.log(
      `   실제 등록 (${autoAccept.length}건): npx tsx scripts/_temp/youtube-batch-match.ts --apply\n`,
    );
    return;
  }

  if (autoAccept.length === 0) {
    console.log("=".repeat(80));
    console.log("⚠️  자동 채택 대상 0건 — UPDATE 실행 안 함. 종료.\n");
    return;
  }

  // admin_logs 작성용 admin_id 결정
  const adminId = await resolveAdminId();
  if (!adminId) {
    console.error("❌ admin_id 결정 실패 (super_admin 사용자 없음 / --admin-id=<N> 명시 필요)");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log(`🚀 [APPLY] ${autoAccept.length}건 UPDATE 실행 (admin_id=${adminId.toString()})`);
  console.log("=".repeat(80));

  const now = new Date();
  let updated = 0;
  let failed = 0;

  for (const r of autoAccept) {
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
