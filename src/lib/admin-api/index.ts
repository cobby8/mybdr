/**
 * 관리자 영역 타입드 데이터 계층 — barrel.
 *
 * 사용 예:
 *   import { adminFetch, AdminApiError, listExpenses, useAdminQuery } from "@/lib/admin-api";
 *
 * 구조:
 *  - client      : adminFetch(★snake↔camel 변환 유일 지점) + AdminApiError
 *  - types       : camelCase 도메인 타입
 *  - schemas     : Zod 응답 스키마(고위험 신규필드 우선)
 *  - endpoints/* : 영역별 타입드 함수
 *  - use-admin-query : 클라 훅({data,loading,error})
 */

export { adminFetch, AdminApiError } from "./client";
export type { AdminFetchOptions } from "./client";

export * from "./types";
export * from "./schemas";

export * as tournamentsApi from "./endpoints/tournaments";
export * as expensesApi from "./endpoints/expenses";
export * as organizationsApi from "./endpoints/organizations";
export * as seriesApi from "./endpoints/series";

export { useAdminQuery } from "./use-admin-query";
