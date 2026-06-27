// ============================================================
// client.ts — admin-v2 타입드 fetch (R1 클린 슬레이트 토대)
//   adminFetch<T>: ★ snake↔camel 변환의 유일 지점.
//     - 요청 body: camel → snake (서버 계약)
//     - 응답: snake → camel (호출부는 camel 타입만 봄)
//     - jsonb(rawJsonKeys): 키만 변환·값 verbatim 보존
//     - apiError({error,code}) 메시지 추출 → AdminApiError throw
//     - schema(Zod4) 있으면 런타임 parse
//   레거시 lib 0 참조 — convert.ts 만 사용(자기완결).
// ============================================================

import type { ZodType } from "zod";
import { convertKeysDeep, toCamel, toSnake } from "./convert";

export class AdminApiError extends Error {
  /** HTTP status (네트워크 에러 = 0) */
  readonly status: number;
  /** apiError 의 code (있으면) */
  readonly code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export type AdminFetchOptions<T> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** 요청 body(camel). 자동 snake 변환 후 JSON 전송. */
  body?: unknown;
  /** Zod4 응답 스키마 — 있으면 parse(핵심필드 런타임 검증). */
  schema?: ZodType<T>;
  /** jsonb 키(camel 또는 snake). 값 verbatim 보존. */
  rawJsonKeys?: string[];
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function adminFetch<T = unknown>(
  path: string,
  opts: AdminFetchOptions<T> = {}
): Promise<T> {
  const raw = opts.rawJsonKeys ? new Set(opts.rawJsonKeys) : undefined;

  const init: RequestInit = {
    method: opts.method || (opts.body !== undefined ? "POST" : "GET"),
    signal: opts.signal,
  };
  if (opts.body !== undefined) {
    init.headers = { "Content-Type": "application/json", ...opts.headers };
    // 요청 body: camel → snake (단일 변환점)
    init.body = JSON.stringify(convertKeysDeep(opts.body, toSnake, raw));
  } else if (opts.headers) {
    init.headers = opts.headers;
  }

  let res: Response;
  try {
    res = await fetch(path, init);
  } catch (e) {
    // 네트워크/abort 에러 → status 0
    throw new AdminApiError(
      e instanceof Error ? e.message : "네트워크 오류",
      0
    );
  }

  // apiSuccess/apiError 모두 raw snake JSON body(래퍼 없음)
  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }

  if (!res.ok) {
    const errObj =
      json && typeof json === "object" ? (json as Record<string, unknown>) : {};
    const message =
      typeof errObj.error === "string"
        ? errObj.error
        : typeof errObj.message === "string"
          ? errObj.message
          : `요청 실패 (${res.status})`;
    const code = typeof errObj.code === "string" ? errObj.code : undefined;
    throw new AdminApiError(message, res.status, code);
  }

  // 응답: snake → camel (단일 변환점) — jsonb 는 값 verbatim
  const camel = convertKeysDeep<T>(json, toCamel, raw);
  if (opts.schema) return opts.schema.parse(camel);
  return camel;
}
