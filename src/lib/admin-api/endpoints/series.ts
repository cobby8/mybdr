import { adminFetch } from "../client";
import type { AdminSeriesSummary, AdminSeriesResponse } from "../types";

/**
 * 정규대회(시리즈) 타입드 엔드포인트 — 대회관리자 셸 "정규대회" 화면.
 * route: GET /api/web/series/my (본인 소유 + active 시리즈 — withWebAuth scoped)
 *
 * ⚠️ 이 route 는 wizard 드롭다운용이라 최소 필드(id/name/organization)만 반환.
 *   레거시 series 목록 페이지는 Prisma 직접 조회로 회차/다음 회차/상태까지 쓰지만 HTTP 엔드포인트엔 없음.
 *   → 파일럿은 name + 단체만 실배선(나머지 필드는 미배선 갭, M4 백엔드 확장 대상).
 */
export function listMySeries(
  signal?: AbortSignal
): Promise<AdminSeriesSummary[]> {
  return adminFetch<AdminSeriesResponse>("/api/web/series/my", {
    signal,
  }).then((res) => res.data ?? []);
}
