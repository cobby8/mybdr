/**
 * 매치별 기록 모드 (Flutter 기록앱 vs 웹 종이 기록지) 게이팅 헬퍼.
 *
 * 2026-05-11 — Phase 1-A 신규.
 *
 * 배경: 웹 종이 기록지 도입 시 Flutter 기록앱과 동시 입력 충돌 우려 — 사용자 결재 (decisions.md [2026-05-11] §3)
 * 로 "매치별 mode 게이팅" 채택. 한 매치 = 한 mode만. 충돌 자체 차단.
 *
 * 저장 위치: `tournament_matches.settings` JSON 의 `recording_mode` 키.
 *   - 값: `"flutter"` | `"paper"` (그 외/누락 = `"flutter"` fallback)
 *   - 기본값 = `"flutter"` (운영 그대로 — 기존 매치 무영향)
 *   - schema 변경 0 (settings 컬럼은 이미 존재 — schema.prisma:659)
 *
 * 사용처:
 *   1. Flutter v1 sync / batch-sync / status 라우트 — `"paper"` 매치 server-side 차단
 *   2. (Phase 1-B) 웹 종이 기록지 BFF — `"flutter"` 매치 server-side 차단
 *   3. admin 토글 라우트 — 운영자가 mode 전환 (audit 박제)
 *
 * 응답 컨벤션: `apiError(403, "RECORDING_MODE_*")` — snake_case 자동 변환 (errors.md 2026-04-17 재발 5회 인지).
 */

import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiError } from "@/lib/api/response";
import { prisma } from "@/lib/db/prisma";

// 매치 기록 모드 — Flutter 기록앱(JWT) vs 웹 종이 기록지(BFF)
export type RecordingMode = "flutter" | "paper";

// "paper" 만 명시적으로 매칭 — 그 외 (null / undefined / "flutter" / 기타) 모두 fallback
// 이유: 기존 운영 매치 (settings={} 또는 settings=null) 100% 가 Flutter 자동 호환 보장
const PAPER_MODE: RecordingMode = "paper";
const FLUTTER_MODE: RecordingMode = "flutter";

/**
 * 매치의 기록 모드 추출.
 *
 * @param match `settings: Prisma.JsonValue | null` 을 가진 객체 (TournamentMatch row 또는 부분)
 * @returns `"flutter"` (기본) | `"paper"` — 명시적 "paper" 만 paper, 그 외 모두 flutter
 *
 * fallback 사례 (전부 flutter):
 *   - settings = null → 운영 신규 매치 default
 *   - settings = {} → 운영 기존 매치 (Prisma default)
 *   - settings = { ...other_keys } → recording_mode 미설정
 *   - settings = { recording_mode: "flutter" } → 명시적 flutter
 *   - settings = { recording_mode: "INVALID" } → 알 수 없는 값 fallback
 *   - settings 자체가 JSON 객체가 아닌 경우 (string / number / array) → fallback
 */
export function getRecordingMode(match: {
  settings: Prisma.JsonValue | null;
}): RecordingMode {
  const settings = match.settings;
  // JSON 객체가 아닌 경우 (null / array / primitive) 모두 fallback
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return FLUTTER_MODE;
  }
  // Prisma.JsonValue 의 객체 case — recording_mode 키 직접 추출
  const value = (settings as Record<string, unknown>).recording_mode;
  // "paper" 만 명시적 match — 그 외 (다른 string / null / undefined) 전부 fallback
  return value === PAPER_MODE ? PAPER_MODE : FLUTTER_MODE;
}

/**
 * 매치 기록 모드 가드 — expected 와 다르면 403 NextResponse 반환.
 *
 * 사용 패턴 (route 안):
 * ```ts
 * const guard = assertRecordingMode(match, "flutter", "Flutter sync");
 * if (guard) return guard;  // 403 응답 — paper 매치는 차단
 * // ... 정상 로직 ...
 * ```
 *
 * 응답 형식 (apiError 컨벤션):
 * ```json
 * { "error": "...", "code": "RECORDING_MODE_PAPER" | "RECORDING_MODE_FLUTTER",
 *   "match_id": "123", "current_mode": "paper" }
 * ```
 *
 * @param match `{ id: bigint, settings: Prisma.JsonValue | null }` — id 는 에러 응답 박제용
 * @param expected `"flutter"` | `"paper"` — 호출 컨텍스트가 기대하는 모드
 * @param context 에러 메시지용 사람 읽기 가능 표시 (예: "Flutter sync from app")
 * @returns 모드 불일치 시 NextResponse (403) / 일치 시 null
 */
export function assertRecordingMode(
  match: { id: bigint; settings: Prisma.JsonValue | null },
  expected: RecordingMode,
  context: string
): NextResponse | null {
  const current = getRecordingMode(match);
  // 일치 — 통과 (caller 가 정상 진행)
  if (current === expected) return null;

  // 불일치 — expected 별 사용자 카피 분기 (Flutter 측 / 웹 측 양면)
  if (current === PAPER_MODE) {
    // expected=flutter 인데 paper — Flutter v1 sync / batch-sync / status 차단
    return apiError(
      "이 매치는 종이 기록지 모드로 진행 중입니다. 웹 기록지 페이지에서 입력해주세요.",
      403,
      "RECORDING_MODE_PAPER",
      {
        match_id: match.id.toString(),
        current_mode: current,
        context,
      }
    );
  }
  // expected=paper 인데 flutter — 웹 BFF 차단 (Phase 1-B 본 함수 재사용)
  return apiError(
    "이 매치는 Flutter 기록앱 모드로 진행 중입니다. 웹 종이 기록지로 입력하려면 관리자가 모드를 전환해야 합니다.",
    403,
    "RECORDING_MODE_FLUTTER",
    {
      match_id: match.id.toString(),
      current_mode: current,
      context,
    }
  );
}

/**
 * settings JSON 갱신용 헬퍼 — 기존 settings 보존 + recording_mode 만 set.
 *
 * 사용처: admin 토글 라우트 (`POST /api/web/admin/matches/[id]/recording-mode`)
 *
 * Prisma JSON update 패턴 — `settings.set` 또는 직접 spread.
 * 본 함수는 spread 결과 객체를 반환 (caller 가 Prisma update.data.settings 에 그대로 전달).
 *
 * @param current 기존 settings (null / 객체 / 비객체)
 * @param mode 신규 mode 값
 * @returns 신규 settings 객체 — Prisma.InputJsonObject 호환
 */
export function withRecordingMode(
  current: Prisma.JsonValue | null,
  mode: RecordingMode
): Record<string, unknown> {
  // 기존 settings 가 객체가 아닌 경우 (null / array / primitive) → 빈 객체에서 시작
  const base: Record<string, unknown> =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  base.recording_mode = mode;
  return base;
}

// ─────────────────────────────────────────────────────────────────────────
// Phase 1 (2026-05-11) — tournament-admin 대시보드 "기록 모드" 카드용 헬퍼 3종
//
// 배경: (c) 하이브리드 정책 — 대회 단위 기본값(`tournament.settings.default_recording_mode`)
//   + 매치별 override (`tournamentMatch.settings.recording_mode`). 카드는 두 레이어 모두 표시 +
//   bulk 라우트는 매치별 settings JSON 을 일괄 갱신.
//
// schema 변경 0 — Tournament.settings / TournamentMatch.settings 모두 기존 Json 컬럼 활용.
// ─────────────────────────────────────────────────────────────────────────

/**
 * 대회 단위 매치 모드 통계 — tournament-admin 카드 표시용.
 *
 * 본 함수는 다음 4 값을 1회 호출로 반환:
 *   - total: 대회 전체 매치 수
 *   - paper: settings.recording_mode = "paper" 매치 수
 *   - flutter: 그 외 매치 수 (= total - paper, fallback "flutter" 포함)
 *   - inProgress: status = "in_progress" 매치 수 ("scope=exclude_in_progress" 라디오 안내용)
 *
 * Prisma JSON path 쿼리는 DB 종속 — 본 함수는 단순 findMany + JS 분류 (매치 수 < 1000 기준 충분).
 *
 * @param tournamentId Tournament.id (uuid string)
 * @returns 매치 통계 (total / paper / flutter / inProgress)
 */
export async function getTournamentMatchStats(tournamentId: string): Promise<{
  total: number;
  paper: number;
  flutter: number;
  inProgress: number;
}> {
  // 한번에 매치 list — settings + status 만 SELECT (BigInt id 도 select 안 함 = 가장 가벼움)
  const matches = await prisma.tournamentMatch.findMany({
    where: { tournamentId },
    select: { settings: true, status: true },
  });

  let paper = 0;
  let inProgress = 0;
  for (const m of matches) {
    // 매치별 mode 추출 (getRecordingMode 재사용 — 단일 source)
    if (getRecordingMode({ settings: m.settings }) === PAPER_MODE) paper++;
    // status="in_progress" 카운트 (라이브 진행 중 매치 — bulk 시 신중 분기 안내용)
    if (m.status === "in_progress") inProgress++;
  }

  return {
    total: matches.length,
    paper,
    flutter: matches.length - paper,
    inProgress,
  };
}

/**
 * 대회 단위 default 기록 모드 추출.
 *
 * 저장 위치: `tournament.settings.default_recording_mode`
 *   - 값: `"flutter"` | `"paper"` (그 외/누락 = `"flutter"` fallback)
 *   - 기본값 = `"flutter"` (운영 그대로 — 기존 대회 무영향)
 *
 * 매치별 settings.recording_mode 와 동일한 fallback 룰 — paper 만 명시적 match.
 *
 * @param tournament `{ settings: Prisma.JsonValue | null }` (Tournament row 또는 부분)
 * @returns `"flutter"` | `"paper"` — 명시적 "paper" 만 paper, 그 외 모두 flutter
 */
export function getTournamentDefaultMode(tournament: {
  settings: Prisma.JsonValue | null;
}): RecordingMode {
  const settings = tournament.settings;
  // JSON 객체가 아닌 경우 (null / array / primitive) 모두 fallback
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
    return FLUTTER_MODE;
  }
  const value = (settings as Record<string, unknown>).default_recording_mode;
  return value === PAPER_MODE ? PAPER_MODE : FLUTTER_MODE;
}

/**
 * tournament.settings JSON 갱신용 헬퍼 — 기존 settings 보존 + default_recording_mode 만 set.
 *
 * withRecordingMode 와 동일 패턴 (다만 key 가 `default_recording_mode` — 대회 레벨 키).
 *
 * @param current 기존 tournament.settings (null / 객체 / 비객체)
 * @param mode 신규 default mode 값
 * @returns 신규 settings 객체 — Prisma.InputJsonObject 호환
 */
export function withTournamentDefaultMode(
  current: Prisma.JsonValue | null,
  mode: RecordingMode
): Record<string, unknown> {
  const base: Record<string, unknown> =
    current && typeof current === "object" && !Array.isArray(current)
      ? { ...(current as Record<string, unknown>) }
      : {};
  base.default_recording_mode = mode;
  return base;
}
