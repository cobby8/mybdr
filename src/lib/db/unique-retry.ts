/**
 * Prisma unique constraint (P2002) 충돌 시 재시도 헬퍼.
 *
 * 운영 DB 의 unique 인덱스 (예: tournaments_series_edition_unique) 와 동시
 * 채번 (count + 1 패턴) 의 race condition 으로 발생할 수 있는 P2002 충돌을
 * 클라이언트 단에서 1회 자동 재시도로 보강.
 *
 * **사용 예** (editions/route.ts):
 * ```ts
 * const tournament = await withUniqueRetry(async () => {
 *   const count = await prisma.tournament.count({ where: { series_id } });
 *   const editionNumber = count + 1;
 *   return prisma.$transaction(async (tx) => {
 *     return tx.tournament.create({
 *       data: { series_id, edition_number: editionNumber, ... },
 *     });
 *   });
 * });
 * ```
 *
 * **동작**:
 * - 첫 시도 성공 → 결과 반환 (재시도 0)
 * - 첫 시도 P2002 catch → 재시도 (count 등은 fn 안에서 자동 재조회)
 * - 마지막 시도도 P2002 → 그 에러 throw (호출자가 409 처리)
 * - **P2002 외 에러는 즉시 throw** (재시도 ❌ — 다른 에러는 retry 의미 없음)
 *
 * **2026-05-15 박제**: Phase 5 C UNIQUE 인덱스 적용 (`b28545f`) 후 editions/route.ts 의
 * for-loop attempt 패턴을 헬퍼로 추출. 다른 unique race 케이스 (예: 토너먼트 short_code
 * 채번 / api_token 채번) 에서도 재사용 가능.
 *
 * @param fn          재시도 대상 비동기 함수 (실패 시 throw)
 * @param maxAttempts 최대 시도 횟수 (기본 2 = 첫 시도 + 1회 재시도)
 * @returns           fn 의 반환값
 * @throws            (a) P2002 외 에러는 즉시 (b) 마지막 시도도 P2002 → 그 에러
 */
import { Prisma } from "@prisma/client";

export async function withUniqueRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 2,
): Promise<T> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      // P2002 = Prisma unique constraint failed
      // attempt < maxAttempts - 1 이면 한 번 더 시도, 아니면 throw
      if (
        attempt < maxAttempts - 1 &&
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        continue; // 재시도
      }
      // 비-P2002 또는 마지막 시도 → throw
      throw err;
    }
  }
  // for-loop 가 정상 break 없이 끝나는 케이스는 이론상 unreachable
  // (attempt < maxAttempts 동안 continue 만 발생하면 마지막 iteration 에서 throw 됨)
  throw lastErr;
}
