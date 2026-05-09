/**
 * 2026-05-10 PR-A — YouTube 영상 ↔ 매치 매칭 점수 알고리즘 (헬퍼 추출).
 *
 * 추출 사유:
 *   - search route (운영자 권한 후보 추천) + auto-register route (무인증 자동 등록 — PR-B)
 *     두 곳에서 동일 알고리즘 사용
 *   - 점수 정의 / 임계값 / 가중치 변경 시 단일 source-of-truth 유지
 *
 * 점수 체계 (총 165점):
 *   시간 매칭: ±30분 +60 / ±60분 +30 / ±4시간 +10
 *   home_team 부분 매칭: +30
 *   away_team 부분 매칭: +30
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

  // 팀명 — 공백 제거 후 부분 매칭 (한글 공백 변형 대응)
  const homeNameNorm = match.homeTeamName.replace(/\s+/g, "").toLowerCase();
  const awayNameNorm = match.awayTeamName.replace(/\s+/g, "").toLowerCase();
  const haystackNorm = haystack.replace(/\s+/g, "");

  if (homeNameNorm.length >= 2 && haystackNorm.includes(homeNameNorm)) {
    breakdown.home_team = 30;
  }
  if (awayNameNorm.length >= 2 && haystackNorm.includes(awayNameNorm)) {
    breakdown.away_team = 30;
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
