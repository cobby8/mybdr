/**
 * 2026-05-11 Phase 3-A — 코치 비로그인 명단 입력 API.
 *
 * 도메인 컨텍스트:
 *   - 운영자가 발급한 apply_token URL 을 코치가 받아 비로그인으로 진입.
 *   - 코치가 자기 팀 선수 명단을 입력해 제출 → TournamentTeamPlayer N건 INSERT.
 *   - 토큰은 일회용 — 제출 시 consumed_at 마킹해 재입력 차단 (운영자가 별도 재발급 가능).
 *
 * 엔드포인트:
 *   GET  /api/web/team-apply/[token]  → 토큰 유효성 + 대회/팀/종별 정보
 *   POST /api/web/team-apply/[token]  → 선수 명단 N건 제출 (트랜잭션)
 *
 * 보안:
 *   - 토큰 자체가 인증 (256bit CSPRNG) — 비로그인 진입.
 *   - 만료 (apply_token_expires_at < now) → 410 Gone.
 *   - 일회용 (applied_via='coach_token' + invited_at set) → 두 번째 진입 시 409 Conflict.
 *   - IDOR: 토큰 unique → 다른 팀 접근 불가능.
 *   - rate limit: TODO Phase 3-A 후속 (IP 단위 5분 5회).
 *
 * 응답: apiSuccess() / apiError() — snake_case 자동 변환.
 */

import { type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

type Ctx = { params: Promise<{ token: string }> };

// 토큰 길이 검증 — newApplyToken 은 64자 hex
const TOKEN_REGEX = /^[a-f0-9]{64}$/;

// POST body 입력 zod 스키마
const PlayerSchema = z.object({
  player_name: z.string().trim().min(1, "이름 입력").max(30),
  // birth_date: YYYY-MM-DD 형식 (HTML date input 표준)
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 형식 (YYYY-MM-DD)"),
  jersey_number: z.number().int().min(0).max(99).nullable().optional(),
  position: z.string().trim().max(10).nullable().optional(),
  school_name: z.string().trim().max(50).nullable().optional(),
  grade: z.number().int().min(1).max(12).nullable().optional(),
  parent_name: z.string().trim().max(30).nullable().optional(),
  parent_phone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/, "휴대폰 형식 (010-XXXX-XXXX)")
    .nullable()
    .optional(),
});

const PostBodySchema = z.object({
  players: z.array(PlayerSchema).min(1, "선수 1명 이상").max(30, "선수 최대 30명"),
});

// ============================================================
// GET — 토큰 유효성 검증 + 대회/팀/종별 정보 반환 (페이지 server fetch 용)
// ============================================================
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { token } = await params;

  if (!TOKEN_REGEX.test(token)) {
    return apiError("유효하지 않은 토큰 형식입니다.", 400);
  }

  // TournamentTeam + Team + Tournament 함께 fetch (관계명 = team / tournament — schema 명시)
  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    include: {
      team: { select: { name: true } },
      tournament: {
        select: {
          id: true, name: true, startDate: true, endDate: true,
          venue_name: true, city: true, district: true,
        },
      },
      _count: { select: { players: true } },
    },
  });

  if (!tt) return apiError("존재하지 않는 토큰입니다.", 404);

  const now = new Date();

  // 만료 검증
  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return apiError("만료된 토큰입니다. 운영자에게 재발급을 요청하세요.", 410, "TOKEN_EXPIRED");
  }

  // 일회용 검증 — applied_via === 'coach_token' 이면 이미 제출됨
  if (tt.applied_via === "coach_token") {
    return apiError("이미 명단이 제출된 토큰입니다.", 409, "TOKEN_CONSUMED");
  }

  // 종별 룰 (해당 division 매핑)
  const divisionRule = tt.category
    ? await prisma.tournamentDivisionRule.findFirst({
        where: { tournamentId: tt.tournament.id, code: tt.category },
        select: {
          code: true, label: true,
          birthYearMin: true, birthYearMax: true,
          gradeMin: true, gradeMax: true,
        },
      })
    : null;

  return apiSuccess({
    tournamentTeamId: tt.id.toString(),
    teamName: tt.team?.name ?? "(이름 없음)",
    managerName: tt.manager_name,
    divisionCode: tt.category,
    divisionRule,
    tournament: {
      id: tt.tournament.id,
      name: tt.tournament.name,
      startDate: tt.tournament.startDate?.toISOString() ?? null,
      endDate: tt.tournament.endDate?.toISOString() ?? null,
      venueName: tt.tournament.venue_name,
      city: tt.tournament.city,
      district: tt.tournament.district,
    },
    existingPlayerCount: tt._count.players,
    expiresAt: tt.apply_token_expires_at?.toISOString() ?? null,
  });
}

// ============================================================
// POST — 선수 명단 N건 제출 (트랜잭션)
// ============================================================
export async function POST(req: NextRequest, { params }: Ctx) {
  const { token } = await params;

  if (!TOKEN_REGEX.test(token)) {
    return apiError("유효하지 않은 토큰 형식입니다.", 400);
  }

  // 1) 입력 zod 검증
  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { players } = parsed.data;

  // 2) 토큰 검증 (트랜잭션 외부 사전 검증 — 빠른 거부)
  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    select: {
      id: true, tournamentId: true, category: true,
      apply_token_expires_at: true, applied_via: true,
    },
  });
  if (!tt) return apiError("존재하지 않는 토큰입니다.", 404);

  const now = new Date();
  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return apiError("만료된 토큰입니다.", 410, "TOKEN_EXPIRED");
  }
  if (tt.applied_via === "coach_token") {
    return apiError("이미 명단이 제출된 토큰입니다.", 409, "TOKEN_CONSUMED");
  }

  // 3) 종별 룰 fetch — 출생연도/학년 검증
  const rule = tt.category
    ? await prisma.tournamentDivisionRule.findFirst({
        where: { tournamentId: tt.tournamentId, code: tt.category },
        select: { birthYearMin: true, birthYearMax: true, gradeMin: true, gradeMax: true },
      })
    : null;

  // 4) 각 선수 룰 검증 (서버단 가드 — 클라이언트 우회 차단)
  const validationErrors: Array<{ index: number; field: string; message: string }> = [];
  players.forEach((p, idx) => {
    const birthYear = Number(p.birth_date.slice(0, 4));
    if (rule?.birthYearMin && birthYear < rule.birthYearMin) {
      validationErrors.push({ index: idx, field: "birth_date", message: `${rule.birthYearMin}년 이후 출생자만 가능` });
    }
    if (rule?.birthYearMax && birthYear > rule.birthYearMax) {
      validationErrors.push({ index: idx, field: "birth_date", message: `${rule.birthYearMax}년 이전 출생자만 가능` });
    }
    if (p.grade != null) {
      if (rule?.gradeMin && p.grade < rule.gradeMin) {
        validationErrors.push({ index: idx, field: "grade", message: `${rule.gradeMin}학년 이상` });
      }
      if (rule?.gradeMax && p.grade > rule.gradeMax) {
        validationErrors.push({ index: idx, field: "grade", message: `${rule.gradeMax}학년 이하` });
      }
    }
  });
  if (validationErrors.length > 0) {
    return apiError("종별 자격 검증 실패", 422, "DIVISION_VALIDATION_FAILED", { errors: validationErrors });
  }

  // 5) 트랜잭션 — Player INSERT + TournamentTeam 마킹 (applied_via='coach_token' 일회용 가드)
  const result = await prisma.$transaction(async (tx) => {
    // 이중 제출 guard — 트랜잭션 내부에서 applied_via 재검증
    const cur = await tx.tournamentTeam.findUnique({
      where: { id: tt.id },
      select: { applied_via: true },
    });
    if (cur?.applied_via === "coach_token") {
      throw new Error("CONCURRENT_SUBMIT");
    }

    // TournamentTeamPlayer 다건 createMany — TTP.invited_at 으로 명단 입력 시각 박제
    await tx.tournamentTeamPlayer.createMany({
      data: players.map((p) => ({
        tournamentTeamId: tt.id,
        player_name: p.player_name,
        birth_date: p.birth_date, // VarChar 컬럼이라 string 그대로
        jerseyNumber: p.jersey_number ?? null,
        position: p.position ?? null,
        school_name: p.school_name ?? null,
        grade: p.grade ?? null,
        parent_name: p.parent_name ?? null,
        parent_phone: p.parent_phone ?? null,
        division_code: tt.category,
        is_active: true,
        claim_status: "pending",
        auto_registered: false,
        invited_at: now,
      })),
    });

    // TournamentTeam 마킹 — applied_via='coach_token' (일회용 표시)
    await tx.tournamentTeam.update({
      where: { id: tt.id },
      data: {
        applied_via: "coach_token",
      },
    });

    return { inserted: players.length };
  }).catch((e) => {
    if (e?.message === "CONCURRENT_SUBMIT") {
      return { error: "CONCURRENT_SUBMIT" as const };
    }
    throw e;
  });

  if ("error" in result) {
    return apiError("동시 제출 충돌 — 이미 명단이 제출되었습니다.", 409, "TOKEN_CONSUMED");
  }

  return apiSuccess({
    ok: true,
    insertedCount: result.inserted,
  });
}
