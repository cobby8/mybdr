/**
 * 웹 종이 기록지 페이지 / BFF 권한 가드 헬퍼.
 *
 * 2026-05-11 — Phase 1-B-2 신규 (decisions.md [2026-05-11] §2 = `requireRecorder` 의 web 세션 대응판).
 *
 * 권한 매트릭스 (사용자 결재 / planner-architect §보안·운영 가드):
 *   - super_admin                                  → 전체 통과
 *   - tournament.organizerId === userId            → 본 대회 통과
 *   - tournamentAdminMember(isActive=true)         → 본 대회 통과
 *   - tournament_recorders ∋ userId                → 본 대회 통과
 *   - 그 외 일반 user / 익명                       → 차단
 *
 * 단일 책임 (호출자 분리):
 *   - 본 헬퍼: 권한 검증 + match/tournament SELECT (페이지/BFF 양쪽 재사용)
 *   - 모드 가드: caller (page.tsx / BFF) 가 `getRecordingMode(match)` 별도 확인
 *     (모드 가드 흡수 = caller 별 UX 분기 다름 — page = 안내 페이지 / BFF = 403 — 책임 분리)
 *
 * 응답 컨벤션:
 *   - 통과 시 `{ user, match, tournament }` 반환
 *   - 미통과 시 NextResponse (apiError 401/403/404 / page caller 가 redirect 또는 안내 UI 전환)
 */

import type { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
// 2026-05-11 Phase 2 — isSuperAdmin 단일 source 통합 (인라인 제거).
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
// 2026-05-15 PR1 — recorder_admin 권한 자동 흡수 (모든 대회 점수기록 통과).
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

// 권한 통과 시 반환 — match/tournament 양쪽 정보 (settings 포함, BFF 모드 가드 재사용)
export interface ScoreSheetAccessOk {
  user: {
    id: bigint;
    nickname: string | null;
  };
  match: {
    id: bigint;
    tournamentId: string;
    homeTeamId: bigint | null;
    awayTeamId: bigint | null;
    winner_team_id: bigint | null;
    status: string | null;
    settings: import("@prisma/client").Prisma.JsonValue | null;
    homeScore: number | null;
    awayScore: number | null;
    roundName: string | null;
    round_number: number | null;
    match_number: number | null;
    scheduledAt: Date | null;
    court_number: string | null;
    venue_id: bigint | null;
    quarterScores: import("@prisma/client").Prisma.JsonValue | null;
    notes: string | null;
    match_code: string | null;
    // Phase 23 (2026-05-14) — draft vs DB 우선순위 비교용 (사용자 결재 Q1).
    //   ScoreSheetForm 의 localStorage draft.savedAt 과 비교해 더 최신인 쪽을 선택.
    updatedAt: Date | null;
  };
  tournament: {
    id: string;
    name: string | null;
    organizerId: bigint | null;
    format: string | null;
  };
}

export type ScoreSheetAccessResult = ScoreSheetAccessOk | { error: NextResponse };

/**
 * 매치 ID 로 권한 가드 + 매치/대회 정보 SELECT.
 *
 * @param matchId TournamentMatch.id (BigInt 자동 변환)
 * @returns 통과 시 `{ user, match, tournament }` / 미통과 시 `{ error: NextResponse }`
 *
 * 호출 패턴:
 * ```ts
 * const result = await requireScoreSheetAccess(matchId);
 * if ("error" in result) return result.error;
 * const { user, match, tournament } = result;
 * ```
 *
 * IDOR 가드:
 *   - matchId → match.tournamentId 자동 결정 (URL params 위조 회피 — tournament 별 검증)
 *   - tournament_recorders / tournamentAdminMember 검증은 SELECT 한 tournamentId 사용
 */
export async function requireScoreSheetAccess(
  matchId: bigint | number
): Promise<ScoreSheetAccessResult> {
  // 1) web 세션 확인 — 익명 시 401
  const session = await getWebSession();
  if (!session) {
    return {
      error: apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED"),
    };
  }

  const userId = BigInt(session.sub);
  const matchIdBig = typeof matchId === "bigint" ? matchId : BigInt(matchId);

  // 2) 매치 + 대회 SELECT (필요 컬럼만 — BFF 가 service 호출 시 재사용)
  // 이유: 권한 검증 + 페이지 렌더링 정보 + service `existingMatch` 1회 SELECT 로 통합.
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchIdBig },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
      winner_team_id: true,
      status: true,
      settings: true,
      homeScore: true,
      awayScore: true,
      roundName: true,
      round_number: true,
      match_number: true,
      scheduledAt: true,
      court_number: true,
      venue_id: true,
      quarterScores: true,
      notes: true,
      match_code: true,
      // Phase 23 (2026-05-14) — draft vs DB 비교용 (운영 영향 0 — SELECT 만)
      updatedAt: true,
      tournament: {
        select: {
          id: true,
          name: true,
          organizerId: true,
          format: true,
        },
      },
    },
  });

  if (!match) {
    return {
      error: apiError("경기를 찾을 수 없습니다.", 404, "MATCH_NOT_FOUND"),
    };
  }

  // 3) 권한 매트릭스 — super_admin / recorder_admin / organizer / admin member / recorder 중 하나면 통과
  // 이유: 점수 입력 = recorder 기본 권한 + 운영자 메타 변경 권한 양쪽 포괄 (lineup-confirm 헬퍼 패턴 동일).
  // isSuperAdmin / isRecorderAdmin 은 단일 source 사용 (Phase 2 통합 + PR1 add-only 분기).
  // recorder_admin = 전역 기록원 관리자 — 본인 배정 여부 무관 모든 대회 통과 (Q1 결재 = super_admin 자동 흡수).
  const superAdmin = isSuperAdmin(session);
  const recorderAdmin = isRecorderAdmin(session);

  const isOrganizer = match.tournament.organizerId === userId;

  let hasAccess = superAdmin || recorderAdmin || isOrganizer;

  // 4) 운영자 멤버 / 기록원 SELECT — super_admin/organizer 면 추가 쿼리 skip (효율)
  if (!hasAccess) {
    const [adminMember, recorder] = await Promise.all([
      prisma.tournamentAdminMember.findFirst({
        where: { tournamentId: match.tournamentId, userId, isActive: true },
        select: { id: true },
      }),
      prisma.tournament_recorders.findFirst({
        // isActive: true — 비활성(권한 회수된) 기록원 차단 (reviewer Major 1건 fix)
        where: { tournamentId: match.tournamentId, recorderId: userId, isActive: true },
        select: { id: true },
      }),
    ]);
    hasAccess = Boolean(adminMember) || Boolean(recorder);
  }

  if (!hasAccess) {
    return {
      error: apiError(
        "종이 기록지 입력 권한이 없습니다. 운영자 또는 기록원만 입력 가능합니다.",
        403,
        "FORBIDDEN"
      ),
    };
  }

  // 5) 사용자 정보 SELECT — nickname (audit context 박제용)
  // 이유: BFF 가 audit `context = "score-sheet 입력 by {nickname}"` 형식 박제 — nickname 재사용.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true },
  });

  if (!user) {
    // JWT 살아있지만 DB user 없음 (탈퇴/삭제) — 안전 차단
    return {
      error: apiError("사용자 정보를 찾을 수 없습니다.", 401, "USER_NOT_FOUND"),
    };
  }

  return {
    user,
    match: {
      id: match.id,
      tournamentId: match.tournamentId,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
      winner_team_id: match.winner_team_id,
      status: match.status,
      settings: match.settings,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      roundName: match.roundName,
      round_number: match.round_number,
      match_number: match.match_number,
      scheduledAt: match.scheduledAt,
      court_number: match.court_number,
      venue_id: match.venue_id,
      quarterScores: match.quarterScores,
      notes: match.notes,
      match_code: match.match_code,
      // Phase 23 — draft vs DB 우선순위 비교용
      updatedAt: match.updatedAt,
    },
    tournament: match.tournament,
  };
}
