/**
 * 2026-05-10 PR-A — YouTube 영상 ↔ 매치 매칭 점수 알고리즘 (헬퍼 추출).
 * 2026-05-10 백포트 — cron v3 `extractTeamsFromTitle` swap-aware 알고리즘 통합.
 *
 * 추출 사유:
 *   - search route (운영자 권한 후보 추천) + auto-register route (무인증 자동 등록 — PR-B)
 *     두 곳에서 동일 알고리즘 사용
 *   - 점수 정의 / 임계값 / 가중치 변경 시 단일 source-of-truth 유지
 *
 * ⚠️ 5/10 결승 영상 매핑 사고 후속 백포트 (errors.md 5/10 첫 항목):
 *   - 사고: 매치 158 결승 (슬로우 vs 아울스) 에 매치 157 영상 (4강 아울스 vs 업템포) 잘못 매핑
 *   - 1차 fix: auto-register 1:1 매핑 가드 (`usedSet`) 백포트 (commit ff190a7)
 *   - 본 백포트 (2차): 단순 substring 매칭 → swap-aware 정확/swap 매칭만 인정
 *     · 영상 제목에서 "vs"/"대" 토큰 분리 → home/away 추출
 *     · 매치 home/away 와 정확 일치 OR swap 일치만 점수 부여
 *     · 단일 팀만 매칭되면 0점 (반쪽 매칭 차단)
 *
 * 점수 체계 (총 165점):
 *   시간 매칭: ±30분 +60 / ±60분 +30 / ±4시간 +10
 *   home_team 정확/swap 매칭: +30 (단일 팀만 hit = 0점)
 *   away_team 정확/swap 매칭: +30 (단일 팀만 hit = 0점)
 *   tournament 앞 8자 부분 매칭: +10
 *   match_code 정확 매칭: +20
 *   round_name 부분 매칭: +5
 *
 * 임계값 (Q8 결재):
 *   ≥80점 = 자동 채택 (auto-register / batch 자동 등록)
 *   50~79점 = 후보 노출 (search route)
 *   <50점 = 무시
 */

import type { EnrichedVideo } from "@/lib/youtube/enriched-videos";

// 시간 매칭 윈도우 — 매치 시작/예정 시각 ±30분이 강한 시그널 (라이브 영상 publishedAt = 라이브 시작 시각)
export const TIME_MATCH_WINDOW_MS = 30 * 60 * 1000;

// 자동 채택 임계값 (auto-register / batch 자동 등록 룰)
export const SCORE_THRESHOLD_AUTO = 80;

// 후보 노출 임계값 (search route 운영자 모달)
export const SCORE_THRESHOLD_CANDIDATE = 50;

// 점수 breakdown — 운영자 UI 에서 "왜 이 영상이 후보로 추천됐는지" 설명용
export interface ScoreBreakdown {
  time: number;
  home_team: number;
  away_team: number;
  tournament: number;
  match_code: number;
  round: number;
}

export interface ScoredCandidate {
  video_id: string;
  title: string;
  thumbnail: string;
  score: number;
  is_live: boolean;
  published_at: string;
  view_count: number;
  score_breakdown: ScoreBreakdown;
}

// scoreMatch 의 두 번째 인자 — 매치 메타 정보 (search route + auto-register 공용)
export interface MatchContext {
  homeTeamName: string;
  awayTeamName: string;
  tournamentName: string;
  roundName: string | null;
  matchCode: string | null;
  scheduledAt: Date | null;
  startedAt: Date | null;
}

/**
 * 팀명 정규화 — 공백/특수문자 제거 + 소문자.
 * cron v3 `normalizeTeamName` 와 동일 (한/영 혼재 흡수 + 괄호/대시 무시).
 */
export function normalizeTeamName(s: string): string {
  return s
    .replace(/[()\[\]·.\-_]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

/**
 * 영상 제목에서 "vs" / "대" 토큰 분리 → home/away 추출.
 * cron v3 `extractTeamsFromTitle` 백포트 (5/10 결승 사고 후속).
 *
 * 예: "제 21회 MOLTEN배 ... 아울스 vs 크로스오버" → home="아울스" / away="크로스오버"
 *
 * 알고리즘:
 *   - "vs" / "vs." / " 대 " 정규식 (case-insensitive, 공백 가드)
 *   - 좌측 마지막 토큰 = home / 우측 첫 토큰 = away
 *   - 매칭 실패 시 null (단순 substring 폴백 X — 반쪽 매칭 차단 의도)
 */
export function extractTeamsFromTitle(title: string): { home: string; away: string } | null {
  const patterns = [/\s+vs\.?\s+/i, /\s+대\s+/];
  for (const re of patterns) {
    const idx = title.search(re);
    if (idx < 0) continue;
    const m = title.match(re);
    if (!m) continue;
    const left = title.slice(0, idx).trim();
    const right = title.slice(idx + m[0].length).trim();
    if (!left || !right) continue;
    const leftTokens = left.split(/\s+/);
    const rightTokens = right.split(/\s+/);
    const homeRaw = leftTokens[leftTokens.length - 1] ?? "";
    const awayRaw = rightTokens[0] ?? "";
    if (!homeRaw || !awayRaw) continue;
    return { home: homeRaw, away: awayRaw };
  }
  return null;
}

/**
 * 매치 정보 + BDR 영상 1건 → 신뢰도 점수 계산.
 * 점수 ≥80 = 자동 채택 / 50~79 = 후보 노출 / <50 = 무시.
 *
 * 본 함수는 이전 `search/route.ts` 의 동명 함수에서 그대로 추출 — 로직 변경 0.
 */
export function scoreMatch(video: EnrichedVideo, match: MatchContext): ScoredCandidate {
  const breakdown: ScoreBreakdown = {
    time: 0,
    home_team: 0,
    away_team: 0,
    tournament: 0,
    match_code: 0,
    round: 0,
  };

  // 1) 시간 매칭 — 영상 publishedAt vs 매치 시작/예정 시각
  // 라이브 영상은 publishedAt = 라이브 시작 시각이라 정확. VOD 도 매치 종료 직후 업로드가 일반적.
  const matchTime = (match.startedAt ?? match.scheduledAt)?.getTime();
  if (matchTime) {
    const videoTime = new Date(video.publishedAt).getTime();
    const diff = Math.abs(videoTime - matchTime);
    if (diff <= TIME_MATCH_WINDOW_MS) {
      breakdown.time = 60; // ±30분 = 강한 시그널
    } else if (diff <= TIME_MATCH_WINDOW_MS * 2) {
      breakdown.time = 30; // ±60분 = 중간 시그널
    } else if (diff <= TIME_MATCH_WINDOW_MS * 8) {
      breakdown.time = 10; // ±4시간 = 약한 시그널 (같은 날)
    }
  }

  // 2) 제목/설명 키워드 매칭 (case-insensitive)
  const haystack = `${video.title} ${video.description}`.toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");

  // 2026-05-10 백포트 — 팀명 swap-aware 매칭 (cron v3 알고리즘 통합).
  // 사유: 단순 substring 매칭은 "아울스 vs 업템포" 영상이 "슬로우 vs 아울스" 매치에
  //       "아울스" 1팀만 부분 매칭으로 30+30 부여 가능 (5/10 결승 158 사고 본질).
  // 방법: 영상 제목 → home/away 추출 → 매치 home/away 와 정확/swap 일치만 점수 부여.
  //       반쪽 매칭은 0점 (cron v3 와 동일 정책).
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
        breakdown.home_team = 30;
        breakdown.away_team = 30;
      }
    }
  }

  // 대회명 — 길어서 부분 매칭 (앞 8자만 사용)
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
