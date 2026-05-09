/**
 * 2026-05-09 PR2 — 매치 사전 라인업 확정 API (팀장/운영자 입력)
 *
 * 도메인 컨텍스트 (Dev/match-lineup-confirmation-2026-05-09.md):
 *   - Q1=A: 신규 테이블 match_lineup_confirmed (PR1 박제)
 *   - Q5=C: 자동 채움 + 변경 자유 (현재 PR 은 입력 API 만 / 자동 매핑은 PR5 roster 응답 확장 후속)
 *   - Q6=A: 주전 5명 강제 (UI/API 모두 검증)
 *   - Q7=A: 양 팀 미입력 = 기록원 수동 fallback (현재 흐름 그대로)
 *   - Q9=A: 운영자 대리 허용 (super_admin / organizer / admin member 양쪽 편집)
 *
 * 엔드포인트:
 *   GET    — 매치 + 양 팀 ttp + 기존 라인업 (있으면) + 양쪽 canEdit 응답
 *   POST   — 라인업 입력/재입력 (upsert, UNIQUE(matchId, teamSide))
 *   DELETE — 라인업 해제 (자동 채움 fallback 으로 복귀)
 *
 * 권한 흐름 (resolveLineupAuth / getLineupCanEdit 헬퍼):
 *   - admin 3종 → 양쪽
 *   - team.captain/manager → 해당 측만
 *   - 그 외 → 403
 *
 * Flutter v1 영향 0 — 본 라우트는 web only. roster API (/api/v1/) 는 PR5 에서 별도.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";
import { getWebSession } from "@/lib/auth/web-session";
import { parseBigIntParam } from "@/lib/utils/parse-bigint";
import {
  resolveLineupAuth,
  getLineupCanEdit,
  getMatchWithTeams,
  type TeamSide,
} from "@/lib/auth/match-lineup";

type Ctx = { params: Promise<{ id: string; matchId: string }> };

// ======================================================================
// zod 스키마 — POST/DELETE 입력 검증
// ======================================================================

// teamSide enum (DB VARCHAR(10) 와 1:1 매핑 — TS 단 가드)
const TeamSideEnum = z.enum(["home", "away"]);

// id 배열 정규화 — 프론트가 string/number 혼용 가능성 → 모두 bigint 로 변환
const TtpIdArray = z.array(z.union([z.string(), z.number()])).transform((arr) =>
  arr.map((v) => {
    const big = parseBigIntParam(String(v));
    if (big === null) {
      throw new Error("INVALID_TTP_ID");
    }
    return big;
  }),
);

const PostBodySchema = z.object({
  teamSide: TeamSideEnum,
  // Q6=A 강제: 주전 정확히 5명. 4명/6명 = 422
  starters: TtpIdArray.refine((arr) => arr.length === 5, {
    message: "주전은 정확히 5명이어야 합니다.",
  }),
  // 후보 substitutes 는 0건도 허용 (가변)
  substitutes: TtpIdArray,
});

const DeleteBodySchema = z.object({
  teamSide: TeamSideEnum,
});

// ======================================================================
// 공통 — BigInt 직렬화 헬퍼
// apiSuccess() 가 BigInt 직접 직렬화 못 하므로 string 변환 필수.
// ======================================================================
function serializeLineup(row: {
  id: bigint;
  matchId: bigint;
  teamSide: string;
  starters: bigint[];
  substitutes: bigint[];
  confirmedById: bigint;
  confirmedAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id.toString(),
    matchId: row.matchId.toString(),
    teamSide: row.teamSide,
    // ttp.id 들도 string 으로 — 프론트 number safe 보장
    starters: row.starters.map((b) => b.toString()),
    substitutes: row.substitutes.map((b) => b.toString()),
    confirmedById: row.confirmedById.toString(),
    confirmedAt: row.confirmedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// ======================================================================
// GET /api/web/tournaments/[id]/matches/[matchId]/lineup
// ======================================================================
/**
 * 매치 + 양 팀 ttp 목록 + 기존 라인업 (있으면) + 양쪽 canEdit 응답.
 * 미로그인 시 401 (private endpoint — 팀장/운영자 전용).
 */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, matchId } = await params;

  // 1) 세션 검증 — 미로그인 = 401
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  // 2) matchId BigInt 변환 가드
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 3) 매치 + 양 팀 정보 조회 (IDOR 가드 = tournamentId 일치 검증)
  const match = await getMatchWithTeams(matchBigInt, tournamentId);
  if (!match) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 4) 양쪽 canEdit 계산 — 응답 표시 + 클라 가드 양 용도
  const canEdit = await getLineupCanEdit(userId, tournamentId, match, session);

  // 5) 권한 0 = 403 (clientside 방어 추가, GET 도 noise 줄이려고 차단)
  if (!canEdit.home && !canEdit.away && !canEdit.isAdmin) {
    return apiError("권한이 없습니다.", 403);
  }

  // 6) 양 팀 ttp 명단 — is_active=true 만 (미활성 멤버 제외)
  //    UI 가 starters 5명 / substitutes N명 선택 후보 풀
  const homeTtpId = match.homeTeam?.id ?? null;
  const awayTtpId = match.awayTeam?.id ?? null;

  // findMany — home/away 둘 다 fetch (UNION 효과). null 가드는 후처리.
  const teamPlayers = await prisma.tournamentTeamPlayer.findMany({
    where: {
      tournamentTeamId: {
        in: [homeTtpId, awayTtpId].filter((v): v is bigint => v !== null),
      },
      is_active: true,
    },
    select: {
      id: true,
      tournamentTeamId: true,
      jerseyNumber: true,
      role: true,
      position: true,
      player_name: true,
      isStarter: true,
      users: {
        select: {
          id: true,
          name: true,
          nickname: true,
          profile_image_url: true,
        },
      },
    },
    // 등번호 오름차순 (NULL 마지막) — UI 친화적 정렬
    orderBy: [{ jerseyNumber: "asc" }, { id: "asc" }],
  });

  // 양 팀 분리
  const homePlayers = teamPlayers.filter((p) => p.tournamentTeamId === homeTtpId);
  const awayPlayers = teamPlayers.filter((p) => p.tournamentTeamId === awayTtpId);

  // 7) 기존 라인업 (있으면) — home + away 각각
  const existingLineups = await prisma.matchLineupConfirmed.findMany({
    where: { matchId: matchBigInt },
    select: {
      id: true,
      matchId: true,
      teamSide: true,
      starters: true,
      substitutes: true,
      confirmedById: true,
      confirmedAt: true,
      updatedAt: true,
    },
  });
  const homeLineup = existingLineups.find((l) => l.teamSide === "home") ?? null;
  const awayLineup = existingLineups.find((l) => l.teamSide === "away") ?? null;

  // 8) ttp 직렬화 — BigInt → string 변환 (apiSuccess BigInt 직렬화 안전)
  const serializeTtp = (p: (typeof teamPlayers)[number]) => ({
    id: p.id.toString(),
    tournamentTeamId: p.tournamentTeamId.toString(),
    jerseyNumber: p.jerseyNumber,
    role: p.role,
    position: p.position,
    playerName: p.player_name,
    isStarter: p.isStarter ?? false,
    user: p.users
      ? {
          id: p.users.id.toString(),
          name: p.users.name,
          nickname: p.users.nickname,
          profileImageUrl: p.users.profile_image_url,
        }
      : null,
  });

  return apiSuccess({
    match: {
      id: match.id.toString(),
      tournamentId: match.tournamentId,
      homeTeamId: match.homeTeamId?.toString() ?? null,
      awayTeamId: match.awayTeamId?.toString() ?? null,
      scheduledAt: match.scheduledAt?.toISOString() ?? null,
      startedAt: match.started_at?.toISOString() ?? null,
      status: match.status,
    },
    homeTeam: match.homeTeam?.team
      ? {
          tournamentTeamId: match.homeTeam.id.toString(),
          teamId: match.homeTeam.team.id.toString(),
          name: match.homeTeam.team.name,
          players: homePlayers.map(serializeTtp),
          lineup: homeLineup ? serializeLineup(homeLineup) : null,
        }
      : null,
    awayTeam: match.awayTeam?.team
      ? {
          tournamentTeamId: match.awayTeam.id.toString(),
          teamId: match.awayTeam.team.id.toString(),
          name: match.awayTeam.team.name,
          players: awayPlayers.map(serializeTtp),
          lineup: awayLineup ? serializeLineup(awayLineup) : null,
        }
      : null,
    canEdit,
  });
}

// ======================================================================
// POST /api/web/tournaments/[id]/matches/[matchId]/lineup
// ======================================================================
/**
 * 라인업 입력/재입력 (upsert).
 *
 * body: { teamSide: "home"|"away", starters: ttpId[5], substitutes: ttpId[N] }
 * 401 = 미로그인 / 403 = 권한 없음 / 404 = 매치 없음
 * 409 = 매치 이미 시작됨
 * 422 = VALIDATION_ERROR (zod / starters≠5 / 중복 / ttp 무결성)
 */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, matchId } = await params;

  // 1) 세션 검증
  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

  // 2) matchId 파싱
  const matchBigInt = parseBigIntParam(matchId);
  if (matchBigInt === null) {
    return apiError("경기를 찾을 수 없습니다.", 404);
  }

  // 3) body 파싱 (try/catch — invalid JSON 가드)
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError("잘못된 요청입니다.", 400);
  }

  // 4) zod 검증 — TtpIdArray transform 가 throw 할 수 있어 try/catch 추가
  let parsed:
    | { success: true; data: z.infer<typeof PostBodySchema> }
    | { success: false; message: string };
  try {
    const r = PostBodySchema.safeParse(body);
    if (!r.success) {
      // refine 메시지 우선 추출 (주전 5명 강제)
      const startersErr = r.error.issues.find((i) =>
        i.path.includes("starters"),
      );
      parsed = {
        success: false,
        message: startersErr?.message ?? "입력값이 유효하지 않습니다.",
      };
    } else {
      parsed = { success: true, data: r.data };
    }
  } catch {
    return apiError("선수 ID가 유효하지 않습니다.", 422, "VALIDATION_ERROR");
  }

  if (!parsed.success) {
    return apiError(parsed.message, 422, "VALIDATION_ERROR");
  }

  const { teamSide, starters, substitutes } = parsed.data;
  const teamSideTyped = teamSide as TeamSide;

  // 5) 권한 검증 — admin 양쪽 / 팀장 본인 측만
  const auth = await resolveLineupAuth(
    userId,
    tournamentId,
    matchBigInt,
    teamSideTyped,
    session,
  );
  if ("error" in auth) return auth.error;
  const { match } = auth;

  // 6) 매치 상태 가드 — 이미 시작된 매치 = 409 (라인업 사후 변경 차단)
  //    status 가 "scheduled" 또는 "ready" 아닐 때 차단 (Q9 준수)
  if (match.status !== "scheduled" && match.status !== "ready") {
    return apiError("이미 시작된 경기입니다.", 409);
  }

  // 7) starters ∩ substitutes = ∅ 검증 (중복 0)
  const startersSet = new Set(starters.map((b) => b.toString()));
  const substitutesSet = new Set(substitutes.map((b) => b.toString()));
  const overlap = [...startersSet].filter((s) => substitutesSet.has(s));
  if (overlap.length > 0) {
    return apiError(
      "주전과 후보가 중복될 수 없습니다.",
      422,
      "VALIDATION_ERROR",
    );
  }

  // starters 자체 중복 (같은 ttp 두 번)
  if (startersSet.size !== starters.length) {
    return apiError("주전에 중복된 선수가 있습니다.", 422, "VALIDATION_ERROR");
  }
  // substitutes 자체 중복
  if (substitutesSet.size !== substitutes.length) {
    return apiError("후보에 중복된 선수가 있습니다.", 422, "VALIDATION_ERROR");
  }

  // 8) ttp 무결성 검증 — 모든 id 가 해당 teamSide tournamentTeam 소속 + is_active=true
  const targetSideObj =
    teamSideTyped === "home" ? match.homeTeam : match.awayTeam;
  if (!targetSideObj) {
    return apiError("팀이 배정되지 않은 경기입니다.", 409);
  }
  const targetTournamentTeamId = targetSideObj.id;

  const allIds = [...starters, ...substitutes];
  const validTtps = await prisma.tournamentTeamPlayer.findMany({
    where: {
      id: { in: allIds },
      tournamentTeamId: targetTournamentTeamId,
      is_active: true,
    },
    select: { id: true },
  });
  if (validTtps.length !== allIds.length) {
    return apiError(
      "선수 명단이 유효하지 않습니다.",
      422,
      "VALIDATION_ERROR",
    );
  }

  // 9) upsert (UNIQUE(matchId, teamSide) — 재입력 자유)
  const upserted = await prisma.matchLineupConfirmed.upsert({
    where: {
      matchId_teamSide: {
        matchId: matchBigInt,
        teamSide: teamSideTyped,
      },
    },
    create: {
      matchId: matchBigInt,
      teamSide: teamSideTyped,
      starters,
      substitutes,
      confirmedById: userId,
    },
    update: {
      starters,
      substitutes,
      // 재입력 시 confirmedById 갱신 — 누가 마지막에 변경했는지 추적
      confirmedById: userId,
    },
  });

  return apiSuccess({
    lineup: serializeLineup(upserted),
  });
}

// ======================================================================
// DELETE /api/web/tournaments/[id]/matches/[matchId]/lineup
// ======================================================================
/**
 * 라인업 해제 (자동 채움 fallback 으로 복귀).
 *
 * body: { teamSide: "home"|"away" }
 * 401 / 403 / 404 = 매치 없음 / 라인업 미입력 (해제 대상 0)
 * 409 = 이미 시작된 경기
 */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id: tournamentId, matchId } = await params;

  const session = await getWebSession();
  if (!session) return apiError("로그인이 필요합니다.", 401);
  const userId = BigInt(session.sub);

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
  const teamSideTyped = parsed.data.teamSide as TeamSide;

  // 권한 검증 (POST 와 동일 흐름)
  const auth = await resolveLineupAuth(
    userId,
    tournamentId,
    matchBigInt,
    teamSideTyped,
    session,
  );
  if ("error" in auth) return auth.error;
  const { match } = auth;

  // 이미 시작된 매치 = 해제 차단 (감사 보존)
  if (match.status !== "scheduled" && match.status !== "ready") {
    return apiError("이미 시작된 경기입니다.", 409);
  }

  // 기존 row 조회 후 삭제 — 없으면 404
  const existing = await prisma.matchLineupConfirmed.findUnique({
    where: {
      matchId_teamSide: {
        matchId: matchBigInt,
        teamSide: teamSideTyped,
      },
    },
    select: { id: true },
  });
  if (!existing) {
    return apiError("해제할 라인업이 없습니다.", 404);
  }

  await prisma.matchLineupConfirmed.delete({
    where: { id: existing.id },
  });

  return apiSuccess({ released: true });
}
