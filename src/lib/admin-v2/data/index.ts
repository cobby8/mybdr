// admin-v2 데이터 계층 배럴 (R1 클린 슬레이트 토대)
// adminFetch(단일 변환점) + AdminApiError + 변환 유틸 + 타입 + Zod 스키마.
// 레거시 lib 0 의존 — 이 계층 안에서 완결.
export * from "./convert";
export * from "./client";
export * from "./types";
export * from "./schemas";
