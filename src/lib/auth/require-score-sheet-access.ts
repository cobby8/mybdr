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

// ─────────────────────────────────────────────────────────────────────────────
// Phase 23 PR-EDIT2 (2026-05-15) — 종료 매치 수정 모드 권한 분리 (사용자 결재 Q4).
//
// 왜 (이유):
//   PR-RO1~RO4 = 종료 매치 read-only 차단 5계층 박제. PR-EDIT1~EDIT4 = 수정 모드 별도 진입.
//   기존 `requireScoreSheetAccess` 는 점수 입력 권한 = recorder 까지 통과 (단순 박제).
//   본 헬퍼 = 수정 모드 진입 권한 = super_admin / organizer / TAM 만 통과 (recorder 제외).
//
// 사용자 결재 Q4 (= 사용자가 권고안 채택):
//   - super_admin                          → 통과 (전역 관리자)
//   - tournament.organizerId === userId    → 통과 (본 대회 운영자)
//   - tournamentAdminMember(isActive=true) → 통과 (운영진)
//   - tournament_recorders                 → 차단 ❌ (수정 권한 ❌ — 보수적)
//   - 그 외 = 403
//
// recorder_admin (전역 기록원 관리자) 분기:
//   - 의뢰서 Q4 표 = "super_admin + organizer + TAM" 만 명시 (recorder_admin 미포함).
//   - 안전 룰: recorder_admin 도 차단 (recorder 자동 흡수 의미상 동일 — 수정 권한 보수적).
//   - 사용자 후속 결재 시 분기 가능 (한 줄 추가).
//
// 응답 컨벤션:
//   - 통과 시 ScoreSheetAccessOk + `canEdit: boolean` 확장 (현재는 항상 true — 미통과면 error)
//   - 미통과 시 NextResponse (apiError 401/403/404 — caller 가 UI 분기)
//
// 단일 source: 기본 헬퍼와 90% 동일 로직 / 권한 매트릭스만 분리.
// ─────────────────────────────────────────────────────────────────────────────

export interface ScoreSheetEditAccessOk extends ScoreSheetAccessOk {
  // PR-EDIT2 — 수정 권한 여부 (현재는 통과 = true / 미통과 = error 반환).
  //   page.tsx 가 본 값을 prop 으로 ScoreSheetForm 에 전달 → toolbar "수정 모드" 버튼 노출 분기.
  canEdit: boolean;
}

export type ScoreSheetEditAccessResult =
  | ScoreSheetEditAccessOk
  | { error: NextResponse };

/**
 * 매치 ID 로 수정 모드 권한 가드 + 매치/대회 정보 SELECT.
 *
 * PR-EDIT2 (2026-05-15) — 사용자 결재 Q4 (recorder 제외 / 보수적 권한 매트릭스).
 *
 * @param matchId TournamentMatch.id (BigInt 자동 변환)
 * @returns 통과 시 `{ ...AccessOk, canEdit: true }` / 미통과 시 `{ error: NextResponse }`
 *
 * 호출 패턴:
 * ```ts
 * const result = await requireScoreSheetEditAccess(matchId);
 * if ("error" in result) return result.error;
 * const { user, match, tournament, canEdit } = result;
 * ```
 *
 * 권한 매트릭스 (사용자 결재 Q4):
 *   - super_admin                          → 통과
 *   - tournament.organizerId === userId    → 통과
 *   - tournamentAdminMember(isActive=true) → 통과
 *   - tournament_recorders                 → 차단 ❌ (수정 권한 보수적)
 *   - recorder_admin (전역)                → 차단 ❌ (recorder 자동 흡수 의미상 동일)
 *   - 그 외                                 → 차단 ❌
 */
export async function requireScoreSheetEditAccess(
  matchId: bigint | number
): Promise<ScoreSheetEditAccessResult> {
  // 1) web 세션 확인 — 익명 시 401
  const session = await getWebSession();
  if (!session) {
    return {
      error: apiError("로그인이 필요합니다.", 401, "UNAUTHORIZED"),
    };
  }

  const userId = BigInt(session.sub);
  const matchIdBig = typeof matchId === "bigint" ? matchId : BigInt(matchId);

  // 2) 매치 + 대회 SELECT (기본 헬퍼와 동일 shape 보장)
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

  // 3) 권한 매트릭스 — recorder 차단 (Q4 결재 = 보수적 / 수정 권한 = 운영자만)
  // 이유: super_admin (전역) / organizer (본 대회) / TAM (운영진) 만 통과.
  //   recorder / recorder_admin = 점수 입력 권한이지 수정 권한 ❌ (사용자 결재 Q4).
  const superAdmin = isSuperAdmin(session);
  const isOrganizer = match.tournament.organizerId === userId;

  let hasEditAccess = superAdmin || isOrganizer;

  // 4) TAM SELECT — super/organizer 가 아니면 추가 확인
  if (!hasEditAccess) {
    const adminMember = await prisma.tournamentAdminMember.findFirst({
      where: { tournamentId: match.tournamentId, userId, isActive: true },
      select: { id: true },
    });
    hasEditAccess = Boolean(adminMember);
  }

  if (!hasEditAccess) {
    return {
      error: apiError(
        "종료 매치 수정 권한이 없습니다. 운영자 또는 대회 관리자만 수정 모드로 진입할 수 있습니다.",
        403,
        "EDIT_FORBIDDEN"
      ),
    };
  }

  // 5) 사용자 정보 SELECT — nickname (audit context 박제용)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, nickname: true },
  });

  if (!user) {
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
      updatedAt: match.updatedAt,
    },
    tournament: match.tournament,
    // PR-EDIT2 — 통과 시 항상 true (미통과 = 위에서 error 반환됨).
    //   page.tsx 가 본 값을 prop 으로 ScoreSheetForm 에 전달 → toolbar 버튼 노출.
    canEdit: true,
  };
}

/**
 * 수정 권한 여부만 boolean 으로 반환 (page.tsx 가 require-score-sheet-access 와 병행 호출).
 *
 * PR-EDIT2 (2026-05-15) — 의뢰서 `page.tsx` 가 기존 `requireScoreSheetAccess` 호출 후
 *   본 헬퍼로 추가 권한 검증 → canEdit boolean 만 추출. error 분기 별도 처리 안 함
 *   (이미 기본 가드 통과한 사용자 = 권한 있음 / 본 헬퍼 = 권한 없음 boolean false 반환).
 *
 * 의뢰서 표현 "반환: 기존 access 결과 + canEdit: boolean 필드 추가" 의 단일 source 위치.
 *
 * @returns true = 수정 가능 (super/organizer/TAM) / false = 수정 불가 (recorder/recorder_admin/일반)
 */
export async function checkScoreSheetEditAccess(
  matchId: bigint | number,
  tournamentId: string
): Promise<boolean> {
  const session = await getWebSession();
  if (!session) return false;

  const userId = BigInt(session.sub);

  // super_admin = 자동 통과
  if (isSuperAdmin(session)) return true;

  // organizer / TAM 검증 (parallel — DB 라운드트립 최소화)
  const [tournament, adminMember] = await Promise.all([
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { organizerId: true },
    }),
    prisma.tournamentAdminMember.findFirst({
      where: { tournamentId, userId, isActive: true },
      select: { id: true },
    }),
  ]);

  // matchId 인자는 향후 매치별 별도 권한 분기 시 사용 (현재 미사용 / 의뢰서 시그니처 보존)
  void matchId;

  if (tournament?.organizerId === userId) return true;
  if (adminMember) return true;

  return false;
}
