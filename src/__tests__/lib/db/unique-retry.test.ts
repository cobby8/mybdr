/**
 * withUniqueRetry 단위 테스트
 *
 * Phase 5 C (b28545f) UNIQUE 인덱스 적용 후 회차 race 차단용 헬퍼.
 */
import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { withUniqueRetry } from "@/lib/db/unique-retry";

// Prisma.PrismaClientKnownRequestError 의 mock 인스턴스 생성 헬퍼
function makeP2002Error(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError(
    "Unique constraint failed on the fields: (`series_id`,`edition_number`)",
    {
      code: "P2002",
      clientVersion: "6.0.0",
      meta: { target: ["series_id", "edition_number"] },
    },
  );
}

function makeOtherPrismaError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Record not found", {
    code: "P2025",
    clientVersion: "6.0.0",
  });
}

describe("withUniqueRetry", () => {
  it("첫 시도 성공 → 결과 반환 (재시도 0)", async () => {
    const fn = vi.fn().mockResolvedValue({ id: 42 });
    const result = await withUniqueRetry(fn);
    expect(result).toEqual({ id: 42 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("첫 시도 P2002 catch → 재시도 → 두 번째 성공", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeP2002Error())
      .mockResolvedValueOnce({ id: 43 });
    const result = await withUniqueRetry(fn);
    expect(result).toEqual({ id: 43 });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("두 번 연속 P2002 → 마지막 P2002 throw", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeP2002Error())
      .mockRejectedValueOnce(makeP2002Error());
    await expect(withUniqueRetry(fn)).rejects.toMatchObject({
      code: "P2002",
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("비-P2002 Prisma 에러 (P2025) → 즉시 throw (재시도 ❌)", async () => {
    const fn = vi.fn().mockRejectedValue(makeOtherPrismaError());
    await expect(withUniqueRetry(fn)).rejects.toMatchObject({
      code: "P2025",
    });
    expect(fn).toHaveBeenCalledTimes(1); // 재시도 없음
  });

  it("일반 Error (Prisma 아님) → 즉시 throw (재시도 ❌)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("network down"));
    await expect(withUniqueRetry(fn)).rejects.toThrow("network down");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("maxAttempts=3 → 2회 재시도 가능 → 세 번째 성공", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(makeP2002Error())
      .mockRejectedValueOnce(makeP2002Error())
      .mockResolvedValueOnce({ id: 99 });
    const result = await withUniqueRetry(fn, 3);
    expect(result).toEqual({ id: 99 });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("maxAttempts=3 → 3회 연속 P2002 → 마지막 P2002 throw", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(makeP2002Error()); // 항상 P2002
    await expect(withUniqueRetry(fn, 3)).rejects.toMatchObject({
      code: "P2002",
    });
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("fn 이 sync throw 해도 catch (Promise 안에서 throw)", async () => {
    const fn = vi.fn().mockImplementation(async () => {
      throw new Error("immediate fail");
    });
    await expect(withUniqueRetry(fn)).rejects.toThrow("immediate fail");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("maxAttempts=1 → 재시도 0 (첫 시도만)", async () => {
    const fn = vi.fn().mockRejectedValue(makeP2002Error());
    await expect(withUniqueRetry(fn, 1)).rejects.toMatchObject({
      code: "P2002",
    });
    expect(fn).toHaveBeenCalledTimes(1); // 재시도 없음
  });
});
