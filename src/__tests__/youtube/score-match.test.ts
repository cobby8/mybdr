/**
 * 2026-05-10 백포트 회귀 방지 — score-match.ts swap-aware 알고리즘.
 *
 * 5/10 결승 영상 매핑 사고 (errors.md 5/10 첫 항목) 재발 방지:
 *   - 매치 158 (결승, 슬로우 vs 아울스) 에 매치 157 영상 (4강, 아울스 vs 업템포) 잘못 매핑
 *   - 원인: 단순 substring 매칭 → "아울스" 1팀 hit 으로 home_team:30 + away_team:30 = 60
 *           + 시간 시그널 60 = 120점 통과 (임계값 80)
 *   - fix: extractTeamsFromTitle + swap-aware 정확/swap 일치만 인정 (반쪽 매칭 0점)
 */

import { describe, it, expect } from "vitest";
import {
  scoreMatch,
  extractTeamsFromTitle,
  normalizeTeamName,
  SCORE_THRESHOLD_AUTO,
  type MatchContext,
} from "@/lib/youtube/score-match";
import type { EnrichedVideo } from "@/lib/youtube/enriched-videos";

// --- helpers ---

function makeVideo(overrides: Partial<EnrichedVideo> = {}): EnrichedVideo {
  return {
    videoId: "test_video_id",
    title: "test title",
    description: "",
    thumbnail: "https://example.com/thumb.jpg",
    publishedAt: new Date("2026-05-10T05:00:00.000Z").toISOString(),
    liveBroadcastContent: "none",
    viewCount: 0,
    duration: "PT10M",
    ...overrides,
  };
}

function makeContext(overrides: Partial<MatchContext> = {}): MatchContext {
  return {
    homeTeamName: "슬로우",
    awayTeamName: "아울스",
    tournamentName: "제21회 몰텐배",
    roundName: "결승",
    matchCode: null,
    scheduledAt: new Date("2026-05-10T05:00:00.000Z"),
    startedAt: null,
    ...overrides,
  };
}

// --- normalizeTeamName ---

describe("normalizeTeamName", () => {
  it("공백 / 특수문자 / 대소문자를 정규화한다", () => {
    expect(normalizeTeamName(" Aulles ")).toBe("aulles");
    expect(normalizeTeamName("아울스 (A)")).toBe("아울스a");
    expect(normalizeTeamName("Cross-Over")).toBe("crossover");
    expect(normalizeTeamName("")).toBe("");
  });
});

// --- extractTeamsFromTitle ---

describe("extractTeamsFromTitle", () => {
  it("'vs' 토큰으로 home/away 를 추출한다", () => {
    const r = extractTeamsFromTitle("제 21회 MOLTEN배 4강 아울스 vs 업템포 [경기 영상]");
    expect(r).toEqual({ home: "아울스", away: "업템포" });
  });

  it("'vs.' 마침표 변형도 매칭한다", () => {
    const r = extractTeamsFromTitle("아울스 vs. 업템포");
    expect(r).toEqual({ home: "아울스", away: "업템포" });
  });

  it("'대' 한글 토큰도 매칭한다", () => {
    const r = extractTeamsFromTitle("제21회 몰텐배 슬로우 대 아울스 결승");
    expect(r).toEqual({ home: "슬로우", away: "아울스" });
  });

  it("vs 토큰이 없으면 null", () => {
    expect(extractTeamsFromTitle("제 21회 MOLTEN배 결승 영상")).toBeNull();
    expect(extractTeamsFromTitle("아울스 업템포 매치")).toBeNull();
  });

  it("좌/우측이 비어있으면 null", () => {
    expect(extractTeamsFromTitle("vs 업템포")).toBeNull();
    expect(extractTeamsFromTitle("아울스 vs ")).toBeNull();
  });
});

// --- 5/10 결승 사고 회귀 방지 ---

describe("scoreMatch — 5/10 결승 사고 회귀 방지", () => {
  it("매치 158 결승(슬로우 vs 아울스)에 매치 157 영상(4강 아울스 vs 업템포) 잘못 매칭 차단", () => {
    const video157 = makeVideo({
      videoId: "zIU3_RDRKuk",
      title: "제 21회 MOLTEN배 4강 아울스 vs 업템포",
      // 시간은 결승과 ±30분 안 가정 (보수적 worst-case — 동시간대 publish)
      publishedAt: new Date("2026-05-10T05:10:00.000Z").toISOString(),
    });
    const match158 = makeContext({
      homeTeamName: "슬로우",
      awayTeamName: "아울스",
      roundName: "결승",
      scheduledAt: new Date("2026-05-10T05:00:00.000Z"),
    });

    const r = scoreMatch(video157, match158);
    // 핵심 검증: 반쪽 매칭 (아울스 1팀만 일치) → 양 팀 점수 0
    expect(r.score_breakdown.home_team).toBe(0);
    expect(r.score_breakdown.away_team).toBe(0);
    // 임계값 80 미달 → 자동 채택 차단
    expect(r.score).toBeLessThan(SCORE_THRESHOLD_AUTO);
  });

  it("정상 케이스: 매치 157(4강 아울스 vs 업템포) 영상은 정확히 매칭", () => {
    const video157 = makeVideo({
      videoId: "zIU3_RDRKuk",
      title: "제 21회 MOLTEN배 4강 아울스 vs 업템포",
      publishedAt: new Date("2026-05-10T03:00:00.000Z").toISOString(),
    });
    const match157 = makeContext({
      homeTeamName: "아울스",
      awayTeamName: "업템포",
      roundName: "4강",
      scheduledAt: new Date("2026-05-10T03:00:00.000Z"),
    });

    const r = scoreMatch(video157, match157);
    expect(r.score_breakdown.home_team).toBe(30);
    expect(r.score_breakdown.away_team).toBe(30);
    expect(r.score).toBeGreaterThanOrEqual(SCORE_THRESHOLD_AUTO);
  });

  it("swap 케이스: 영상 'A vs B' / 매치 home=B / away=A 도 정확히 매칭", () => {
    const video = makeVideo({
      title: "제 21회 MOLTEN배 결승 슬로우 vs 아울스",
      publishedAt: new Date("2026-05-10T05:00:00.000Z").toISOString(),
    });
    const matchSwap = makeContext({
      homeTeamName: "아울스", // ← 영상은 슬로우/아울스 / 매치는 아울스/슬로우
      awayTeamName: "슬로우",
    });

    const r = scoreMatch(video, matchSwap);
    expect(r.score_breakdown.home_team).toBe(30);
    expect(r.score_breakdown.away_team).toBe(30);
  });

  it("부분 substring 만 일치하는 영상은 양 팀 점수 0 (단순 includes 폴백 차단)", () => {
    // 영상 제목에 "아울스" 가 description 으로 들어가고 vs 토큰 없음 케이스
    const video = makeVideo({
      title: "BDR 영상 모음 — 아울스 하이라이트",
      description: "슬로우 코트 레전드 플레이",
      publishedAt: new Date("2026-05-10T05:00:00.000Z").toISOString(),
    });
    const match = makeContext({
      homeTeamName: "슬로우",
      awayTeamName: "아울스",
    });

    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(0);
    expect(r.score_breakdown.away_team).toBe(0);
  });

  it("vs 토큰 없는 다른 매치 영상 = 시간 시그널만 부여 (임계값 80 미달)", () => {
    // 5/10 결승 매치 ±30분 안 publish 됐지만 vs 토큰 없는 영상 (예: 하이라이트)
    const video = makeVideo({
      title: "제 21회 MOLTEN배 결승 하이라이트",
      publishedAt: new Date("2026-05-10T05:15:00.000Z").toISOString(),
    });
    const match = makeContext();

    const r = scoreMatch(video, match);
    // 시간 60 + tournament 10 + round 5 = 75 (정확히 80 미달)
    expect(r.score).toBeLessThan(SCORE_THRESHOLD_AUTO);
  });
});

// --- 기존 점수 체계 회귀 방지 ---

describe("scoreMatch — 점수 체계 회귀 방지", () => {
  it("매치 코드 정확 일치 시 +20 부여", () => {
    const video = makeVideo({
      title: "제 21회 MOLTEN배 아울스 vs 업템포 [26-MD-01]",
    });
    const match = makeContext({
      homeTeamName: "아울스",
      awayTeamName: "업템포",
      matchCode: "26-MD-01",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.match_code).toBe(20);
  });

  it("시간 ±30분 = 60 / ±60분 = 30 / ±4시간 = 10", () => {
    const matchTime = new Date("2026-05-10T05:00:00.000Z");
    const match = makeContext({ scheduledAt: matchTime });

    // ±15분 → 60
    const v15 = makeVideo({ publishedAt: new Date("2026-05-10T05:15:00.000Z").toISOString() });
    expect(scoreMatch(v15, match).score_breakdown.time).toBe(60);

    // ±45분 → 30
    const v45 = makeVideo({ publishedAt: new Date("2026-05-10T05:45:00.000Z").toISOString() });
    expect(scoreMatch(v45, match).score_breakdown.time).toBe(30);

    // ±3시간 → 10
    const v3h = makeVideo({ publishedAt: new Date("2026-05-10T08:00:00.000Z").toISOString() });
    expect(scoreMatch(v3h, match).score_breakdown.time).toBe(10);

    // ±10시간 → 0
    const v10h = makeVideo({ publishedAt: new Date("2026-05-10T15:00:00.000Z").toISOString() });
    expect(scoreMatch(v10h, match).score_breakdown.time).toBe(0);
  });

  it("tournament 앞 8자 부분 매칭 +10 / round 부분 매칭 +5", () => {
    const video = makeVideo({
      title: "제21회몰텐배 결승 아울스 vs 업템포",
    });
    const match = makeContext({
      homeTeamName: "아울스",
      awayTeamName: "업템포",
      tournamentName: "제21회 몰텐배",
      roundName: "결승",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.tournament).toBe(10);
    expect(r.score_breakdown.round).toBe(5);
  });
});
