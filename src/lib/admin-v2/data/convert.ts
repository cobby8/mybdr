// ============================================================
// convert.ts — admin-v2 데이터 계층 키 변환 (자기완결)
//   camelCase ↔ snake_case 재귀 변환. jsonb(rawKeys)는 값 verbatim 보존.
//   ★ snake↔camel 변환은 데이터 계층(client.ts)에서만 일어나는 단일 지점.
//     호출부는 항상 camel 타입만 본다 → snake 재발버그 구조 차단.
//   레거시 lib 참조 0 — 이 계층 안에서 완결.
// ============================================================

export function toSnake(str: string): string {
  // camelCase → snake_case (연속 대문자/숫자 경계 보존)
  return str
    .replace(/([A-Z])/g, "_$1")
    .replace(/__+/g, "_")
    .toLowerCase()
    .replace(/^_/, "");
}

export function toCamel(str: string): string {
  // snake_case → camelCase (선행 _ 보존 안 함)
  return str.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.getPrototypeOf(v) === Object.prototype
  );
}

// 재귀 키 변환. rawKeys 에 매칭되는 키는 "키 이름만" 변환하고 값은 verbatim 보존
// (jsonb 컬럼 — settings/scheduleDates 등 내부 구조를 건드리지 않음).
export function convertKeysDeep<T = unknown>(
  value: unknown,
  fn: (k: string) => string,
  rawKeys?: Set<string>
): T {
  if (Array.isArray(value)) {
    return value.map((v) => convertKeysDeep(v, fn, rawKeys)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const nk = fn(k);
      // 원본키 또는 변환키가 rawKeys 에 있으면 값 verbatim (jsonb 보존)
      const isRaw = rawKeys && (rawKeys.has(k) || rawKeys.has(nk));
      out[nk] = isRaw ? v : convertKeysDeep(v, fn, rawKeys);
    }
    return out as T;
  }
  return value as T;
}
