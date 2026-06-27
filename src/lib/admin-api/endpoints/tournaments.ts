import { adminFetch } from "../client";
import {
  TOURNAMENT_RAW_JSON_KEYS,
  type AdminTournamentDetail,
  type AdminTournamentSummary,
} from "../types";

/**
 * 대회(tournament) 타입드 엔드포인트 — 파일럿(대회관리자 셸)이 쓰는 목록/상세.
 * route: /api/web/tournaments (GET 목록), /api/web/tournaments/[id] (GET 상세)
 *
 * ⚠️ 상세는 jsonb 컬럼(settings/categories/divisions/scheduleDates 등) 다수 →
 *    rawJsonKeys 로 내부 키 변환을 막아 F-2b 함정(예: schedule_dates.court_ids 깨짐) 차단.
 *    스칼라 필드만 camel 변환되고 jsonb 값은 raw 보존.
 *
 * Zod 미적용(전면 강제 금지 원칙) — 대회 스키마는 광범위해 고위험 신규필드(expenses)에만 검증 집중.
 */

/** 대회 목록(공개 GET — status 필터 옵션). */
export function listTournaments(
  params?: { status?: string },
  signal?: AbortSignal
): Promise<AdminTournamentSummary[]> {
  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  return adminFetch<AdminTournamentSummary[]>(`/api/web/tournaments${query}`, {
    signal,
  });
}

/** 대회 상세 — jsonb 키 raw 보존(rawJsonKeys). */
export function getTournament(
  id: string,
  signal?: AbortSignal
): Promise<AdminTournamentDetail> {
  return adminFetch<AdminTournamentDetail>(`/api/web/tournaments/${id}`, {
    signal,
    rawJsonKeys: [...TOURNAMENT_RAW_JSON_KEYS],
  });
}
