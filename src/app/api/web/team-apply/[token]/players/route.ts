/**
 * 2026-05-12 — 코치 명단 수정용 — 인증 통과 후 기존 명단 fetch.
 * 2026-05-13 — 최초 1회 코치 정보 setup 흐름 추가 (manager_name/phone NULL 케이스 입력값으로 SET).
 *
 * POST /api/web/team-apply/[token]/players
 *   body: { manager_name, manager_phone }
 *   → 인증 매칭 통과 시 기존 TournamentTeamPlayer 목록 반환 (수정 폼 prefill).
 *
 * 사유: GET 으로 노출 시 토큰만 알면 명단 유출 위험.
 *       POST + 인증 매칭 검증 후 응답 = 코치 본인만 명단 조회 가능.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

const TOKEN_REGEX = /^[a-f0-9]{64}$/;

const BodySchema = z.object({
  manager_name: z.string().trim().min(1).max(30),
  manager_phone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/),
});

function normalizePhoneStr(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!TOKEN_REGEX.test(token)) {
    return apiError("유효하지 않은 토큰 형식입니다.", 400);
  }

  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("코치 이름과 연락처를 입력하세요.", 422, "VALIDATION_ERROR");
  }
  const { manager_name, manager_phone } = parsed.data;

  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    select: {
      id: true,
      applied_via: true,
      manager_name: true,
      manager_phone: true,
      apply_token_expires_at: true,
    },
  });
  if (!tt) return apiError("존재하지 않는 토큰입니다.", 404);

  const now = new Date();
  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return apiError("만료된 토큰입니다.", 410, "TOKEN_EXPIRED");
  }
  if (tt.applied_via !== "coach_token") {
    return apiError("아직 명단이 제출되지 않은 토큰입니다.", 400, "NOT_SUBMITTED");
  }

  // 인증 매칭 — 4-분기 (2026-05-13)
  //   사유: 운영자가 수동 등록한 팀 중 manager_* 가 비어있는 케이스(GNBA 8팀 등)에서
  //         코치가 자가수정 페이지에 진입조차 못하던 문제 해결.
  //         토큰 자체가 256bit 비밀이라 "토큰 보유자 = 정당한 코치" 보안 모델로 충분.
  const inputName = manager_name.trim();
  const inputPhone = normalizePhoneStr(manager_phone);
  const dbName = (tt.manager_name ?? "").trim();
  const dbPhone = normalizePhoneStr(tt.manager_phone ?? "");

  // 분기 1: 둘 다 있음 → 기존 매칭 검증 (현행 유지)
  if (dbName && dbPhone) {
    if (inputName !== dbName || inputPhone !== dbPhone) {
      return apiError("코치 이름 또는 연락처가 일치하지 않습니다.", 401, "COACH_AUTH_FAILED");
    }
  }
  // 분기 2: 이름만 있음 → 이름 매칭 후 phone 만 UPDATE
  else if (dbName && !dbPhone) {
    if (inputName !== dbName) {
      return apiError("코치 이름이 일치하지 않습니다.", 401, "COACH_AUTH_FAILED");
    }
    await prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: { manager_phone: inputPhone },
    });
  }
  // 분기 3: 전화만 있음 → 전화 매칭 후 name 만 UPDATE
  else if (!dbName && dbPhone) {
    if (inputPhone !== dbPhone) {
      return apiError("코치 연락처가 일치하지 않습니다.", 401, "COACH_AUTH_FAILED");
    }
    await prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: { manager_name: inputName },
    });
  }
  // 분기 4: 둘 다 없음 → 입력값으로 둘 다 UPDATE (최초 setup, 무조건 통과)
  else {
    await prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: { manager_name: inputName, manager_phone: inputPhone },
    });
  }

  // 기존 명단 fetch
  const players = await prisma.tournamentTeamPlayer.findMany({
    where: { tournamentTeamId: tt.id, is_active: true },
    select: {
      player_name: true,
      birth_date: true,
      jerseyNumber: true,
      position: true,
      school_name: true,
      grade: true,
      parent_name: true,
      parent_phone: true,
    },
    orderBy: { jerseyNumber: "asc" },
  });

  return apiSuccess({
    players: players.map((p) => ({
      player_name: p.player_name,
      birth_date: p.birth_date,
      jersey_number: p.jerseyNumber,
      position: p.position,
      school_name: p.school_name,
      grade: p.grade,
      parent_name: p.parent_name,
      parent_phone: p.parent_phone,
    })),
  });
}
