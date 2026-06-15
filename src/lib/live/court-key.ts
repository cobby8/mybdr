import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * 코트키(courtKey) 인코딩/디코딩 + 읽기 key(HMAC) 발급/검증
 *
 * ── 왜 코트키인가 ──────────────────────────────────────────────
 * 방송 담당자가 OBS URL을 "대회+날짜+코트" 단위로 1회만 세팅하면, 그 코트에서
 * 지금 진행 중인 경기(in_progress)를 서버가 자동으로 골라 점수판을 먹여준다.
 * 경기가 바뀌어도 URL(=courtKey)은 그대로다. 그래서 키는 매치가 아니라 코트로 잡는다.
 *
 * ── 인코딩 방식 (결정적·단순·안전) ─────────────────────────────
 * courtKey = base64url( JSON.stringify({ t, d, c }) )
 *   t = tournamentId (UUID 문자열)
 *   d = 경기 날짜 "YYYY-MM-DD" (KST 고정)
 *   c = 코트 참조. venue_id 우선("v:<id>"), 없으면 court_number 폴백("n:<번호>")
 * - JSON→base64url 은 가역(디코딩 가능)이고 URL 안전. 서명이 아니라 단순 식별자이므로
 *   누구나 디코딩할 수 있어도 무방하다(점수 조회 보호는 아래 HMAC key가 담당).
 * - c 의 접두사(v:/n:)로 resolve 단계에서 venue_id 쿼리인지 court_number 쿼리인지 구분.
 */

export interface CourtKeyParts {
  tournamentId: string;
  /** KST 기준 "YYYY-MM-DD" */
  date: string;
  /** "v:<venue_id>" 또는 "n:<court_number>" */
  courtRef: string;
}

// ── base64url 헬퍼 (Node Buffer 기반) ──────────────────────────
function toBase64Url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Buffer {
  // base64url → base64 복원(패딩 보정)
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, "base64");
}

/**
 * 코트 식별 정보 → courtRef 문자열.
 * venue_id 우선, 없으면 court_number 폴백. 둘 다 없으면 null(코트 식별 불가).
 */
export function buildCourtRef(
  venueId: bigint | null | undefined,
  courtNumber: string | null | undefined
): string | null {
  if (venueId !== null && venueId !== undefined) return `v:${venueId.toString()}`;
  if (courtNumber !== null && courtNumber !== undefined && courtNumber.trim() !== "") {
    return `n:${courtNumber.trim()}`;
  }
  return null;
}

/** CourtKeyParts → courtKey 문자열 인코딩 */
export function encodeCourtKey(parts: CourtKeyParts): string {
  const json = JSON.stringify({ t: parts.tournamentId, d: parts.date, c: parts.courtRef });
  return toBase64Url(Buffer.from(json, "utf8"));
}

/**
 * courtKey 문자열 → CourtKeyParts 디코딩.
 * 잘못된 형식이면 null(호출부에서 400 처리).
 */
export function decodeCourtKey(courtKey: string): CourtKeyParts | null {
  try {
    const json = fromBase64Url(courtKey).toString("utf8");
    const obj = JSON.parse(json) as { t?: unknown; d?: unknown; c?: unknown };
    if (
      typeof obj.t !== "string" ||
      typeof obj.d !== "string" ||
      typeof obj.c !== "string"
    ) {
      return null;
    }
    // 날짜 형식 최소 검증 (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(obj.d)) return null;
    // courtRef 접두사 검증
    if (!obj.c.startsWith("v:") && !obj.c.startsWith("n:")) return null;
    return { tournamentId: obj.t, date: obj.d, courtRef: obj.c };
  } catch {
    return null;
  }
}

/**
 * 읽기 key(HMAC) 발급. courtKey 자체에 서명한다.
 * - URL이 코트 고정이라 key도 코트 고정 → 경기가 바뀌어도 불변(요구 충족).
 * - secret 은 전용 env(SCOREBOARD_READ_SECRET). JWT_SECRET 재사용 금지.
 */
export function getReadSecret(): string {
  const secret = process.env.SCOREBOARD_READ_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SCOREBOARD_READ_SECRET 환경변수가 없거나 너무 짧습니다(16자 이상 필요). .env 에 설정하세요."
    );
  }
  return secret;
}

/** courtKey → 읽기 key(base64url HMAC-SHA256) */
export function signCourtKey(courtKey: string): string {
  const mac = createHmac("sha256", getReadSecret()).update(courtKey).digest();
  return toBase64Url(mac);
}

/**
 * 제출된 key 검증. timing-safe 비교.
 * - 길이가 다르면 false(timingSafeEqual은 길이 다르면 throw하므로 사전 차단).
 */
export function verifyReadKey(courtKey: string, providedKey: string): boolean {
  if (!providedKey) return false;
  let expected: string;
  try {
    expected = signCourtKey(courtKey);
  } catch {
    // secret 미설정 → 검증 불가(상위에서 별도 처리하지만 안전하게 false)
    return false;
  }
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(providedKey, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
