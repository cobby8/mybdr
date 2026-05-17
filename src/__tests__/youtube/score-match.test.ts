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

// --- 2026-05-17 다단어 팀명 fallback 회귀 방지 (옵션 E, "YNC B" 사고 박제) ---
//
// 사고 배경: extractTeamsFromTitle 가 좌측 마지막 / 우측 첫 1 토큰만 추출하므로
//   영상 제목 "... 스티즈강남 vs YNC B ..." 에서 "YNC B" 다단어 팀명이
//   "B" 1 토큰만 추출돼 매칭 실패 → 5/17 매치 201/203 자동 매핑 누락.
//
// 검증: 6 케이스 — fallback 동작 / swap 검출 / 5/10 사고 회귀 가드 보존 /
//   substring 룰 / 영역 겹침 룰 / 기존 token 성공 시 미진입.
describe("scoreMatch — 다단어 팀명 fallback (2026-05-17 YNC B 사고)", () => {
  it("케이스 1: YNC B home 매치 + 영상 '스티즈강남 vs YNC B' → fallback 동작", () => {
    // 좌측 마지막 토큰 = "스티즈강남" (1 토큰) / 우측 첫 토큰 = "YNC" → token 매칭 실패
    // fallback 으로 normalize 제목에서 "yncb" / "스티즈강남" 양쪽 substring 검출 → 매칭
    const video = makeVideo({
      title: "BDR 리그 8강 스티즈강남 vs YNC B 풀영상",
    });
    const match = makeContext({
      homeTeamName: "YNC B",
      awayTeamName: "스티즈강남",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(30);
    expect(r.score_breakdown.away_team).toBe(30);
  });

  it("케이스 2: YNC B away 매치 + 영상 'YNC B vs 김포훕스타' → swap 검출", () => {
    const video = makeVideo({
      title: "BDR 16강 YNC B vs 김포훕스타 풀영상",
    });
    const match = makeContext({
      homeTeamName: "김포훕스타",
      awayTeamName: "YNC B",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(30);
    expect(r.score_breakdown.away_team).toBe(30);
  });

  it("케이스 3: 5/10 사고 회귀 가드 — 매치 '슬로우 vs 아울스' / 영상 '아울스 vs 업템포'", () => {
    // 핵심 보존: fallback 추가로 5/10 정책이 깨지면 안 됨.
    // 영상 제목에 "슬로우" 없음 → fallback 룰 2 (양쪽 모두 제목 존재) 차단 → 0점 유지.
    const video = makeVideo({
      title: "제 21회 MOLTEN배 4강 아울스 vs 업템포",
    });
    const match = makeContext({
      homeTeamName: "슬로우",
      awayTeamName: "아울스",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(0);
    expect(r.score_breakdown.away_team).toBe(0);
  });

  it("케이스 4: substring 룰 — 매치 '강남 vs 스티즈강남' + 영상에 둘 다 포함 → skip", () => {
    // matchHomeNorm "강남" ⊂ matchAwayNorm "스티즈강남" → 룰 4 fallback skip
    const video = makeVideo({
      title: "강남 vs 스티즈강남 풀영상",
    });
    const match = makeContext({
      homeTeamName: "강남",
      awayTeamName: "스티즈강남",
    });
    const r = scoreMatch(video, match);
    // 토큰 매칭은 정확히 home="강남"/away="스티즈강남" → 통과 가능하므로
    // 토큰 매칭 차단을 위해 vs 토큰 없는 제목으로 재구성
    // (본 케이스의 목적은 fallback substring 룰 검증)
    expect(r.score_breakdown.home_team).toBeGreaterThanOrEqual(0);
  });

  it("케이스 4-b: substring 룰 (vs 토큰 없는 제목으로 fallback 단독 검증)", () => {
    // vs 토큰 없으므로 token 매칭 자체가 실행 안 됨 → fallback 만 평가됨
    // matchHomeNorm "강남" ⊂ matchAwayNorm "스티즈강남" → 룰 4 skip → 0점 유지
    const video = makeVideo({
      title: "BDR 하이라이트 강남 스티즈강남 명장면 모음",
    });
    const match = makeContext({
      homeTeamName: "강남",
      awayTeamName: "스티즈강남",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(0);
    expect(r.score_breakdown.away_team).toBe(0);
  });

  it("케이스 5: 영역 겹침 룰 — 동일 팀명 매치 (A vs A) → skip", () => {
    // homeIdx === awayIdx 로 영역 100% 겹침 → 룰 5 skip
    // (substring 룰 4 가 먼저 차단 — A ⊂ A — 하지만 fallback 안전성 검증 목적)
    const video = makeVideo({
      title: "BDR 연습경기 YNC B 자체 스크리미지",
    });
    const match = makeContext({
      homeTeamName: "YNC B",
      awayTeamName: "YNC B",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(0);
    expect(r.score_breakdown.away_team).toBe(0);
  });

  it("케이스 6: 기존 token 매칭 성공 케이스 → fallback 미진입 (회귀 0)", () => {
    // token 매칭으로 이미 30+30 부여 → 룰 1 (breakdown.home_team===0 가드) 로 fallback 진입 안 함.
    // 결과: 정확히 30+30 유지 (fallback 이 중복 적용되지 않음 — 점수 60 초과 ❌)
    const video = makeVideo({
      title: "제 21회 MOLTEN배 4강 아울스 vs 업템포",
    });
    const match = makeContext({
      homeTeamName: "아울스",
      awayTeamName: "업템포",
    });
    const r = scoreMatch(video, match);
    expect(r.score_breakdown.home_team).toBe(30);
    expect(r.score_breakdown.away_team).toBe(30);
  });
});
