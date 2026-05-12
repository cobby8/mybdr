/**
 * createTournament — Phase B 정합성 가드: seriesId 입력 시 카운터 +1 통합 검증.
 *
 * 2026-05-12 신규 — 직접 createTournament 호출 path 가 series_id 박제 자체 안 하고 카운터 +1 도
 *   안 하던 root cause (운영 series id=8 stored=0 / actual=12) 차단 회귀 가드.
 *
 * 검증 매트릭스 (4 케이스):
 *   1. seriesId 미전송 → tournament.create 단발 / $transaction 안 씀 / series UPDATE 0회
 *   2. seriesId 전달 → $transaction 안에서 tournament.create + series UPDATE increment 1
 *   3. seriesId === null 명시 → 미전송과 동일 처리 (단발 INSERT)
 *   4. tournament.create 실패 시 series UPDATE 도 미발생 (트랜잭션 롤백 — mock 으로는 createMock 이
 *      throw 하면 update 도 호출 안 됨 검증)
 *
 * mock 패턴: prisma.$transaction(callback) 시 callback(tx) 직접 실행 — tx = { tournament, tournament_series }.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// prisma 전체 mock — createTournament 안에서 사용하는 메서드만 stub.
const tournamentCreateMock = vi.fn();
const seriesUpdateMock = vi.fn();
const tournamentSiteCreateMock = vi.fn();
const transactionMock = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    tournament: {
      create: (...args: unknown[]) => tournamentCreateMock(...args),
    },
    tournament_series: {
      update: (...args: unknown[]) => seriesUpdateMock(...args),
    },
    tournamentSite: {
      create: (...args: unknown[]) => tournamentSiteCreateMock(...args),
    },
    $transaction: (...args: unknown[]) => transactionMock(...args),
  },
}));

// crypto.randomBytes 안정화 — apiToken 결정적 값.
vi.mock("crypto", async () => {
  const actual = await vi.importActual<typeof import("crypto")>("crypto");
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from("a".repeat(32))),
  };
});

import { createTournament } from "@/lib/services/tournament";

describe("createTournament — Phase B series 카운터 정합성", () => {
  beforeEach(() => {
    tournamentCreateMock.mockReset();
    seriesUpdateMock.mockReset();
    tournamentSiteCreateMock.mockReset();
    transactionMock.mockReset();

    // default: tournament.create 성공 시 가짜 row 반환.
    tournamentCreateMock.mockResolvedValue({
      id: "uuid-fake-1",
      name: "테스트 대회",
      organizerId: BigInt(1),
      series_id: null,
    });

    // $transaction(callback) 패턴 — callback(tx) 직접 실행.
    // tx 는 prisma 와 동일 구조 (tournament + tournament_series).
    transactionMock.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      return fn({
        tournament: {
          create: (...args: unknown[]) => tournamentCreateMock(...args),
        },
        tournament_series: {
          update: (...args: unknown[]) => seriesUpdateMock(...args),
        },
      });
    });
  });

  it("seriesId 미전송 → tournament.create 단발 / $transaction 안 씀 / series UPDATE 0회", async () => {
    await createTournament({
      name: "개인 대회",
      organizerId: BigInt(1),
      // seriesId 미전송
    });

    // $transaction 호출 안 됨
    expect(transactionMock).not.toHaveBeenCalled();
    // tournament.create 1회
    expect(tournamentCreateMock).toHaveBeenCalledTimes(1);
    // series UPDATE 0회
    expect(seriesUpdateMock).not.toHaveBeenCalled();

    // create data 안에 series_id 키 없음 (Prisma optional FK 자연 NULL).
    const callArgs = tournamentCreateMock.mock.calls[0][0];
    expect(callArgs.data.series_id).toBeUndefined();
  });

  it("seriesId === null 명시 → 미전송과 동일 처리 (단발 INSERT)", async () => {
    await createTournament({
      name: "개인 대회",
      organizerId: BigInt(1),
      seriesId: null,
    });

    expect(transactionMock).not.toHaveBeenCalled();
    expect(seriesUpdateMock).not.toHaveBeenCalled();
    const callArgs = tournamentCreateMock.mock.calls[0][0];
    expect(callArgs.data.series_id).toBeUndefined();
  });

  it("seriesId 전달 → $transaction 안에서 tournament.create + series UPDATE increment 1", async () => {
    const SERIES_ID = BigInt(8);

    await createTournament({
      name: "BDR 시리즈 대회",
      organizerId: BigInt(1),
      seriesId: SERIES_ID,
    });

    // $transaction 호출됨
    expect(transactionMock).toHaveBeenCalledTimes(1);
    // tournament.create 1회 (트랜잭션 내부)
    expect(tournamentCreateMock).toHaveBeenCalledTimes(1);
    // series UPDATE 1회 — increment 1
    expect(seriesUpdateMock).toHaveBeenCalledTimes(1);

    // create data 안에 series_id 박제됨
    const createArgs = tournamentCreateMock.mock.calls[0][0];
    expect(createArgs.data.series_id).toBe(SERIES_ID);

    // series UPDATE 인자 — { where: { id: SERIES_ID }, data: { tournaments_count: { increment: 1 } } }
    const updateArgs = seriesUpdateMock.mock.calls[0][0];
    expect(updateArgs.where.id).toBe(SERIES_ID);
    expect(updateArgs.data.tournaments_count).toEqual({ increment: 1 });
  });

  it("tournament.create 실패 시 series UPDATE 도 미발생 (트랜잭션 롤백 동등)", async () => {
    const SERIES_ID = BigInt(8);

    // tournament.create 가 throw — 트랜잭션 callback 도 throw → series UPDATE 호출 안 됨.
    tournamentCreateMock.mockRejectedValueOnce(new Error("DB constraint violation"));

    await expect(
      createTournament({
        name: "실패 케이스",
        organizerId: BigInt(1),
        seriesId: SERIES_ID,
      }),
    ).rejects.toThrow("DB constraint violation");

    // tournament.create 가 throw 했으므로 series UPDATE 호출 0회 (롤백 동등).
    expect(seriesUpdateMock).not.toHaveBeenCalled();
  });
});
