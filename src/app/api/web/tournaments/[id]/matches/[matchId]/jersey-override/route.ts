/**
 * 2026-05-05 Phase 1 PR4 — 매치 임시 jersey 번호 운영자 모달 API
 *
 * 도메인 컨텍스트 (Dev/team-member-lifecycle-2026-05-05.md §0, §3):
 *   jersey 우선순위 = match_player_jersey(이 row) → ttp.jerseyNumber → team_members.jersey_number
 *   매치 시점 운영자가 "이 선수 이 경기 한정 #99" 같은 케이스를 처리.
 *
 * 권한: 토너먼트 운영자 only (organizer + tournament_admin_members.is_active=true).
 *   캡틴/선수 본인 사용 불가 (긴 흐름은 Phase 2 PR6+ 신청/승인 워크플로).
 *
 * 엔드포인트:
 *   POST   — 임시 번호 INSERT/UPDATE (UPSERT, 운영자가 한 번 더 변경 케이스)
 *   DELETE — 임시 번호 해제 (운영자 실수 정정)
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { requireTournamentAdmin } from "@/lib/auth/tournament-auth";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { adminLog } from "@/lib/admin/log";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// 입력 zod — jersey 0~99 정수. reason 은 50자 이내 권장 (DB 무제한이지만 UX 가드).
const PostBodySchema = z.object({
  // BigInt id 는 string/number 양쪽 받기 (프론트 fetch JSON 전송 시 number 권장)
  tournamentTeamPlayerId: z.union([z.string(), z.number()]),
  jerseyNumber: z.number().int().min(0).max(99),
  reason: z.string().max(200).optional(),
});

const DeleteBodySchema = z.object({
  tournamentTeamPlayerId: z.union([z.string(), z.number()]),
  reason: z.string().max(200).optional(),
});

/**
 * POST /api/web/tournaments/[id]/matches/[matchId]/jersey-override
 *
 * body: { tournamentTeamPlayerId, jerseyNumber, reason? }
 * 401 = 미로그인 / 403 = 권한 없음 / 404 = 매치/ttp 없음
 * 409 = JERSEY_CONFLICT (같은 매치 같은 번호 다른 ttp 사용 중)
 * 422 = VALIDATION_ERROR (zod)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, matchId } = await params;

  // 권한 = 운영자만 (organizer + tournament_admin_members.is_active=true).
  const auth = await requireTournamentAdmin(tournamentId);
  if ("error" in auth) return auth.error;

  // matchId 파싱 — BigInt 변환 실패 가드 (TC-026 패턴)
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 입력 파싱
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const { tournamentTeamPlayerId, jerseyNumber, reason } = parsed.data;

  const ttpBigInt = parseBigIntParam(String(tournamentTeamPlayerId));
  if (ttpBigInt === null) {
    return apiError("선수 ID 가 유효하지 않습니다.", 400);
  }

  // 1) 매치가 해당 토너먼트 소속인지 검증 (URL params 위조 방어)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: {
      id: true,
      tournamentId: true,
      homeTeamId: true,
      awayTeamId: true,
    },
  });
  if (!match) return apiError("경기를 찾을 수 없습니다.", 404);
  if (match.tournamentId !== tournamentId) {
    return apiError("해당 대회의 경기가 아닙니다.", 404);
  }

  // 2) ttp 가 해당 매치의 home/away team 에 속하는지 검증 (IDOR 방어)
  const ttp = await prisma.tournamentTeamPlayer.findUnique({
    where: { id: ttpBigInt },
    select: {
      id: true,
      tournamentTeamId: true,
      jerseyNumber: true,
      player_name: true,
      users: { select: { name: true, nickname: true } },
    },
  });
  if (!ttp) return apiError("선수를 찾을 수 없습니다.", 404);

  const teamIds = [match.homeTeamId, match.awayTeamId].filter(
    (t): t is bigint => t !== null,
  );
  if (!teamIds.some((tid) => tid === ttp.tournamentTeamId)) {
    return apiError("이 경기에 출전하는 선수가 아닙니다.", 400);
  }

  // 3) 같은 매치 내 같은 jersey 다른 ttp 사용 중인지 검증 (UNIQUE 충돌 사전 차단)
  //    UNIQUE 인덱스로 DB 가 막아주지만, 친절한 에러 메시지 위해 사전 SELECT.
  const conflicting = await prisma.matchPlayerJersey.findUnique({
    where: {
      tournamentMatchId_jerseyNumber: {
        tournamentMatchId: matchBigInt,
        jerseyNumber,
      },
    },
    select: {
      id: true,
      tournamentTeamPlayerId: true,
    },
  });
  if (conflicting && conflicting.tournamentTeamPlayerId !== ttpBigInt) {
    return apiError(
      `#${jerseyNumber} 번호는 이미 다른 선수가 사용 중입니다.`,
      409,
      "JERSEY_CONFLICT",
    );
  }

  // 4) UPSERT — 같은 매치 내 같은 ttp 기존 row 있으면 UPDATE (운영자 재변경 케이스)
  //    운영자 변경 이력 추적은 admin_logs 가 단일 source (description 에 old→new 기록).
  const existing = await prisma.matchPlayerJersey.findUnique({
    where: {
      tournamentMatchId_tournamentTeamPlayerId: {
        tournamentMatchId: matchBigInt,
        tournamentTeamPlayerId: ttpBigInt,
      },
    },
    select: { id: true, jerseyNumber: true },
  });

  const upserted = await prisma.matchPlayerJersey.upsert({
    where: {
      tournamentMatchId_tournamentTeamPlayerId: {
        tournamentMatchId: matchBigInt,
        tournamentTeamPlayerId: ttpBigInt,
      },
    },
    create: {
      tournamentMatchId: matchBigInt,
      tournamentTeamPlayerId: ttpBigInt,
      jerseyNumber,
      reason: reason ?? null,
      createdById: auth.userId,
    },
    update: {
      jerseyNumber,
      reason: reason ?? null,
      // updatedAt 은 @updatedAt — 자동
      // createdById 는 최초 등록자 보존 (재변경 시 갱신 안 함). 이력은 admin_logs.
    },
  });

  // 5) admin_logs INSERT — 운영자 활동 추적 (warning severity)
  //    description 형식: "매치 [matchId] 선수 [name] jersey [old]→[new] 사유: [reason]"
  const playerName =
    ttp.player_name ??
    ttp.users?.nickname ??
    ttp.users?.name ??
    `선수#${ttpBigInt.toString()}`;
  const oldJersey = existing
    ? `#${existing.jerseyNumber}`
    : ttp.jerseyNumber != null
      ? `#${ttp.jerseyNumber}(원본)`
      : "-";
  const description =
    `매치 ${matchBigInt.toString()} 선수 ${playerName} jersey ${oldJersey}→#${jerseyNumber}` +
    (reason ? ` 사유: ${reason}` : "");

  await adminLog("match_jersey_override", "match_player_jersey", {
    targetType: "match_player_jersey",
    targetId: upserted.id,
    description,
    severity: "warning",
    changesMade: {
      tournament_match_id: matchBigInt.toString(),
      tournament_team_player_id: ttpBigInt.toString(),
      jersey_number: jerseyNumber,
      reason: reason ?? null,
    },
    previousValues: existing
      ? { jersey_number: existing.jerseyNumber }
      : { jersey_number: ttp.jerseyNumber, source: "ttp_original" },
  });

  return apiSuccess({
    id: upserted.id.toString(),
    tournamentMatchId: matchBigInt.toString(),
    tournamentTeamPlayerId: ttpBigInt.toString(),
    jerseyNumber: upserted.jerseyNumber,
    reason: upserted.reason,
    createdAt: upserted.createdAt.toISOString(),
    updatedAt: upserted.updatedAt.toISOString(),
    isUpdate: existing !== null,
  });
}

/**
 * DELETE /api/web/tournaments/[id]/matches/[matchId]/jersey-override
 *
 * body: { tournamentTeamPlayerId, reason? } — 운영자 실수 정정 / 잘못 등록 해제.
 * 404 = 임시 번호 row 없음 (이미 해제됨)
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, matchId } = await params;

  const auth = await requireTournamentAdmin(tournamentId);
  if ("error" in auth) return auth.error;

  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  const parsed = DeleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("입력값이 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }
  const { tournamentTeamPlayerId, reason } = parsed.data;

  const ttpBigInt = parseBigIntParam(String(tournamentTeamPlayerId));
  if (ttpBigInt === null) {
    return apiError("선수 ID 가 유효하지 않습니다.", 400);
  }

  // 매치 토너먼트 소속 검증 (POST 와 동일 가드)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchBigInt },
    select: { id: true, tournamentId: true },
  });
  if (!match) return apiError("경기를 찾을 수 없습니다.", 404);
  if (match.tournamentId !== tournamentId) {
    return apiError("해당 대회의 경기가 아닙니다.", 404);
  }

  // 기존 row 조회 (없으면 404 + admin_logs 위해 jersey_number 추출)
  const existing = await prisma.matchPlayerJersey.findUnique({
    where: {
      tournamentMatchId_tournamentTeamPlayerId: {
        tournamentMatchId: matchBigInt,
        tournamentTeamPlayerId: ttpBigInt,
      },
    },
    include: {
      tournamentTeamPlayer: {
        select: {
          player_name: true,
          users: { select: { name: true, nickname: true } },
        },
      },
    },
  });
  if (!existing) {
    return apiError("해제할 임시 번호가 없습니다.", 404);
  }

  await prisma.matchPlayerJersey.delete({
    where: { id: existing.id },
  });

  const playerName =
    existing.tournamentTeamPlayer.player_name ??
    existing.tournamentTeamPlayer.users?.nickname ??
    existing.tournamentTeamPlayer.users?.name ??
    `선수#${ttpBigInt.toString()}`;
  const description =
    `매치 ${matchBigInt.toString()} 선수 ${playerName} 임시 jersey #${existing.jerseyNumber} 해제` +
    (reason ? ` 사유: ${reason}` : "");

  await adminLog("match_jersey_override_release", "match_player_jersey", {
    targetType: "match_player_jersey",
    targetId: existing.id,
    description,
    severity: "warning",
    previousValues: {
      jersey_number: existing.jerseyNumber,
      reason: existing.reason,
    },
  });

  return apiSuccess({ released: true });
}
