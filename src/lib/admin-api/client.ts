import { z } from "zod";
import {
  convertKeysToCamelCase,
  convertKeysToSnakeCase,
} from "@/lib/utils/case";

/**
 * 관리자 영역 타입드 데이터 계층 — adminFetch
 *
 * 왜 이 파일이 존재하나 (M1 핵심):
 *  - 이번 세션 5회 재발한 snake_case 버그(route 는 snake 응답인데 프론트가 camel 로 읽어
 *    silent undefined)를 **fetch 1곳에서 구조적으로 근절**한다.
 *  - 보낼 때 camel→snake(convertKeysToSnakeCase) / 받을 때 snake→camel(convertKeysToCamelCase)
 *    을 adminFetch 안에서만 처리 → 호출부는 항상 camelCase 타입만 본다.
 *  - 변환 지점이 **단 1곳**이므로 케이스 처리 누락이 구조적으로 불가능.
 *
 * 응답 래핑 구조(0번 점검 결과):
 *  - `apiSuccess(data)` = `NextResponse.json(convertKeysToSnakeCase(data))` → **래퍼 없음**.
 *    body 자체가 snake_case 데이터. 따라서 언래핑 = body 그대로가 data (별도 .data 추출 불필요).
 *  - `apiError(error, status)` = `{ error: string | {field,message}[], code? }`.
 *    → !res.ok 시 body.error 에서 메시지 추출.
 */

/** API 에러 — status + 사람이 읽을 메시지를 담아 throw. 호출부는 catch 해서 UI 에 노출. */
export class AdminApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
  }
}

export type AdminFetchOptions<TRes> = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** 요청 body (camelCase). adminFetch 가 snake 로 변환해 전송. */
  body?: unknown;
  /** 응답 런타임 계약 검증 Zod 스키마(camelCase 변환 후 parse). 고위험 신규필드 우선. */
  schema?: z.ZodType<TRes>;
  /** AbortController.signal — 컴포넌트 언마운트 시 요청 취소용. */
  signal?: AbortSignal;
  /**
   * ⚠️ jsonb 함정(errors.md F-2b) 차단용.
   * `settings` / `themeSettings` / `categories` 같은 jsonb 컬럼은 내부 키가 사용자 데이터라
   * 재귀 camel 변환되면 깨진다(예: schedule_dates 의 court_ids → courtIds 로 바뀌어 오버레이 깨짐).
   * 여기에 지정한 키는 **값을 raw 그대로 보존**(키 이름만 camel, 내부는 변환 제외).
   * snake/camel 어느 형태로 적어도 매칭됨(예: "theme_settings" 또는 "themeSettings").
   */
  rawJsonKeys?: string[];
};

/** snake_case 키 1개를 camelCase 로 (값 재귀 변환 없이 키 문자열만). */
function snakeToCamelKey(key: string): string {
  return key.replace(/_([a-z])/g, (_, c: string) => (c as string).toUpperCase());
}

/**
 * rawJsonKeys 가 지정됐을 때만 쓰는 가드 변환기.
 * - rawJsonKeys 가 없으면 호출 안 함(아래 adminFetch 가 기존 convertKeysToCamelCase 를 그대로 재사용).
 * - 지정 키는 값을 verbatim 보존하고, 그 외 키 값만 기존 convertKeysToCamelCase 로 위임(재사용).
 * - 모든 깊이에서 raw 키를 잡기 위해 객체/배열은 직접 재귀한다.
 */
function camelizePreservingRaw(value: unknown, rawKeys: Set<string>): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => camelizePreservingRaw(item, rawKeys));
  }
  if (value === null || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => {
      const camelKey = snakeToCamelKey(key);
      // snake 원본 키 또는 camel 변환 키 둘 중 하나라도 rawKeys 에 있으면 값 raw 보존(F-2b 차단)
      if (rawKeys.has(key) || rawKeys.has(camelKey)) {
        return [camelKey, val];
      }
      // 그 외: 자식도 raw 키를 만날 수 있으니 직접 재귀
      return [camelKey, camelizePreservingRaw(val, rawKeys)];
    })
  );
}

/** apiError 응답 body 에서 사람이 읽을 메시지 추출(string / validation 배열 / fallback). */
function extractErrorMessage(body: unknown, fallback: string): { message: string; code?: string } {
  if (body && typeof body === "object") {
    const rec = body as Record<string, unknown>;
    const code = typeof rec.code === "string" ? rec.code : undefined;
    const err = rec.error;
    if (typeof err === "string" && err.trim()) return { message: err, code };
    // validationError 형태: [{ field, message }]
    if (Array.isArray(err) && err.length > 0) {
      const first = err[0] as { message?: unknown };
      if (typeof first?.message === "string") return { message: first.message, code };
    }
  }
  return { message: fallback, code: undefined };
}

/**
 * 관리자 API 단일 진입점.
 *
 * 흐름: body camel→snake → fetch → !ok 면 AdminApiError → body=data(snake)
 *       → snake→camel(★유일 변환 지점) → schema.parse(런타임 계약) → typed TRes 반환.
 *
 * @returns camelCase 가 보장된 TRes
 * @throws AdminApiError (네트워크/HTTP 에러/계약 위반)
 */
export async function adminFetch<TRes>(
  endpoint: string,
  opts: AdminFetchOptions<TRes> = {}
): Promise<TRes> {
  const { method = "GET", body, schema, signal, rawJsonKeys } = opts;

  // 1) body 가 있으면 camel→snake 로 변환해서 전송(보내기 케이스 통일)
  const hasBody = body !== undefined && method !== "GET";
  const requestInit: RequestInit = {
    method,
    credentials: "same-origin", // 커스텀 웹세션 쿠키 동봉
    signal,
  };
  if (hasBody) {
    requestInit.headers = { "Content-Type": "application/json" };
    requestInit.body = JSON.stringify(convertKeysToSnakeCase(body));
  }

  let res: Response;
  try {
    res = await fetch(endpoint, requestInit);
  } catch (e) {
    // AbortError 는 그대로 전파(호출부 무시), 그 외 네트워크 에러는 AdminApiError 로 통일
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new AdminApiError(0, "네트워크 오류가 발생했습니다.");
  }

  // 응답 body 파싱(에러 응답이 JSON 이 아닐 수도 있으니 방어)
  let parsedBody: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      parsedBody = JSON.parse(text);
    } catch {
      parsedBody = null;
    }
  }

  // 2) HTTP 에러 → 메시지 추출해서 AdminApiError throw
  if (!res.ok) {
    const { message, code } = extractErrorMessage(
      parsedBody,
      `요청 처리 중 오류가 발생했습니다. (${res.status})`
    );
    throw new AdminApiError(res.status, message, code);
  }

  // 3) 언래핑 — apiSuccess 는 래퍼 없이 raw data 를 반환하므로 body 자체가 data(snake)
  const rawData = parsedBody;

  // 4) ★유일 변환 지점: snake→camel.
  //    rawJsonKeys 가 없으면 기존 convertKeysToCamelCase 그대로 재사용(중복 구현 회피·동일 동작 보장).
  //    있으면 지정 jsonb 키만 raw 보존하는 가드 변환기 사용.
  const camelData =
    rawJsonKeys && rawJsonKeys.length > 0
      ? camelizePreservingRaw(rawData, new Set(rawJsonKeys))
      : convertKeysToCamelCase(rawData);

  // 5) schema 가 있으면 런타임 계약 검증(고위험 신규필드 안전망)
  if (schema) {
    return schema.parse(camelData);
  }

  // 6) typed TRes(camelCase 보장) 반환
  return camelData as TRes;
}
