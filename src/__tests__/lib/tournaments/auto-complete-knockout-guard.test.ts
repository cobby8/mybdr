/**
 * 2026-06-14 KO Sprint1 재발방지 [KO-9] — auto-complete 결선 미생성 가드 회귀 게이트.
 *
 * 버그: full_league_knockout / group_stage_knockout 같은 "예선 후 결선 별도생성" format이
 *       결선 매치 0건일 때, 예선만 100% 완료되면 auto-complete.ts가 finished===total 로
 *       오판해 대회를 자동 종료(completed)해버린다.
 *
 * 본 테스트 2축:
 *   1) PURE isKnockoutFormat — knockout format 분류 회귀 게이트
 *      (full_league_knockout=true / group_stage_knockout=true / 그 외·null=false)
 *   2) 가드 분기 — checkAndAutoCompleteTournament 가 결선 0건 시 차단 / 결선 있으면 통과 /
 *      비knockout format 은 가드 우회해 기존대로 종료
 *
 * ⚠️ countKnockoutMatches(글로벌 prisma 의존)는 mock 으로 대체 — DB I/O 없이 분기만 검증.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// [KO-9] 가드 분기 검증을 위해 결선 카운트 헬퍼를 mock (글로벌 prisma I/O 제거)
const countKnockoutMatchesMock = vi.fn();
vi.mock("@/lib/tournaments/tournament-seeding", () => ({
  countKnockoutMatches: (...args: unknown[]) => countKnockoutMatchesMock(...args),
}));

import {
  isKnockoutFormat,
  checkAndAutoCompleteTournament,
} from "@/lib/tournaments/auto-complete";

// ─────────────────────────────────────────────────────────────────────────
// 1축: PURE isKnockoutFormat 회귀 게이트
// ─────────────────────────────────────────────────────────────────────────
describe("isKnockoutFormat — 예선후 결선생성 format 분류 (PURE 회귀 게이트)", () => {
  it("full_league_knockout → true", () => {
    expect(isKnockoutFormat("full_league_knockout")).toBe(true);
  });

  it("group_stage_knockout → true", () => {
    expect(isKnockoutFormat("group_stage_knockout")).toBe(true);
  });

  it("round_robin → false (결선 별도생성 아님)", () => {
    expect(isKnockoutFormat("round_robin")).toBe(false);
  });

  it("single_elimination → false (단일 토너먼트 — 전체가 결선)", () => {
    expect(isKnockoutFormat("single_elimination")).toBe(false);
  });

  it("league_advancement → false", () => {
    expect(isKnockoutFormat("league_advancement")).toBe(false);
  });

  it("null → false (가드 미적용)", () => {
    expect(isKnockoutFormat(null)).toBe(false);
  });

  it("undefined → false (가드 미적용)", () => {
    expect(isKnockoutFormat(undefined)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2축: 가드 분기 (checkAndAutoCompleteTournament)
// ─────────────────────────────────────────────────────────────────────────

/**
 * 가짜 PrismaClient 생성 — findUnique/count/update 만 stub.
 * @param opts.status 토너먼트 status
 * @param opts.format 토너먼트 format
 * @param opts.total 전체 매치 수
 * @param opts.finished 종료 매치 수
 */
function makeFakeClient(opts: {
  status: string;
  format: string | null;
  total: number;
  finished: number;
}) {
  const updateMock = vi.fn().mockResolvedValue({});
  // count 는 호출 순서가 [total, finished] (Promise.all)
  let countCall = 0;
  const client = {
    tournament: {
      findUnique: vi.fn().mockResolvedValue({ status: opts.status, format: opts.format }),
      update: updateMock,
    },
    tournamentMatch: {
      count: vi.fn().mockImplementation(() => {
        countCall += 1;
        return Promise.resolve(countCall === 1 ? opts.total : opts.finished);
      }),
    },
  };
  return { client, updateMock };
}

describe("checkAndAutoCompleteTournament — 결선 미생성 가드 분기", () => {
  beforeEach(() => {
    countKnockoutMatchesMock.mockReset();
  });

  it("결선 format + 결선 0건 → 자동종료 차단 (knockout-not-generated)", async () => {
    countKnockoutMatchesMock.mockResolvedValue(0); // 결선 매치 0건
    const { client, updateMock } = makeFakeClient({
      status: "in_progress",
      format: "full_league_knockout",
      total: 6,
      finished: 6, // 예선 100% 완료 (오판 유발 조건)
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await checkAndAutoCompleteTournament(client as any, "t1");

    expect(res.updated).toBe(false);
    expect(res.reason).toBe("knockout-not-generated");
    expect(updateMock).not.toHaveBeenCalled(); // 종료 UPDATE 안 함
  });

  it("결선 format + 결선 매치 존재 → 가드 통과해 정상 종료", async () => {
    countKnockoutMatchesMock.mockResolvedValue(3); // 결선 매치 생성됨
    const { client, updateMock } = makeFakeClient({
      status: "in_progress",
      format: "group_stage_knockout",
      total: 9,
      finished: 9, // 예선+결선 전부 완료
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await checkAndAutoCompleteTournament(client as any, "t2");

    expect(res.updated).toBe(true);
    expect(res.reason).toContain("auto-completed");
    expect(updateMock).toHaveBeenCalledTimes(1); // 종료 UPDATE 실행
  });

  it("비knockout format(round_robin) → 가드 우회, 결선 카운트 호출 없이 정상 종료", async () => {
    const { client, updateMock } = makeFakeClient({
      status: "in_progress",
      format: "round_robin",
      total: 4,
      finished: 4,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await checkAndAutoCompleteTournament(client as any, "t3");

    expect(res.updated).toBe(true);
    expect(res.reason).toContain("auto-completed");
    expect(updateMock).toHaveBeenCalledTimes(1);
    // 결선 없는 format 은 countKnockoutMatches 자체를 호출하지 않아야 함 (회귀 안전)
    expect(countKnockoutMatchesMock).not.toHaveBeenCalled();
  });
});
