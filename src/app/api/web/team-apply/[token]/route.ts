/**
 * 2026-05-11 Phase 3-A — 코치 비로그인 명단 입력 API.
 * 2026-05-13 — PUT 인증 매칭에 최초 1회 코치 정보 setup 흐름 추가 (POST /players 와 동일 4-분기).
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

// POST body 입력 zod 스키마.
// 필수: 이름 / 생년월일 / 등번호 / 부모연락처 (사용자 요청 2026-05-11 Phase 3-A)
// 선택: 포지션 / 학교명 / 부모이름 (학년은 클라이언트에서 생년월일 기반 자동 계산)
const PlayerSchema = z.object({
  player_name: z.string().trim().min(1, "이름 입력").max(30),
  birth_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "생년월일 형식 (YYYY-MM-DD)"),
  jersey_number: z.number().int().min(0).max(99),
  parent_phone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/, "휴대폰 형식 (010-XXXX-XXXX)"),
  position: z.string().trim().max(10).nullable().optional(),
  school_name: z.string().trim().max(50).nullable().optional(),
  grade: z.number().int().min(1).max(12).nullable().optional(),
  parent_name: z.string().trim().max(30).nullable().optional(),
});

const PostBodySchema = z.object({
  players: z
    .array(PlayerSchema)
    .min(1, "선수 1명 이상")
    .max(30, "선수 최대 30명")
    // 2026-05-15 — 등번호 array unique 검증 (DB @@unique([tournamentTeamId, jerseyNumber]) 위반 → 500 회귀 영구 차단)
    .refine(
      (arr) => new Set(arr.map((p) => p.jersey_number)).size === arr.length,
      { message: "등번호 중복 — 한 팀 안에서 등번호는 unique 해야 합니다." },
    ),
});

// 2026-05-12 — 명단 수정 (PUT) body 스키마 — POST 와 동일 + 코치 인증 정보 추가.
const PutBodySchema = z.object({
  manager_name: z.string().trim().min(1, "코치 이름 입력").max(30),
  manager_phone: z
    .string()
    .trim()
    .regex(/^(010-\d{4}-\d{4}|01\d{9})$/, "휴대폰 형식 (010-XXXX-XXXX)"),
  players: z
    .array(PlayerSchema)
    .min(1, "선수 1명 이상")
    .max(30, "선수 최대 30명")
    // 2026-05-15 — 등번호 array unique 검증 (DB @@unique([tournamentTeamId, jerseyNumber]) 위반 → 500 회귀 영구 차단)
    .refine(
      (arr) => new Set(arr.map((p) => p.jersey_number)).size === arr.length,
      { message: "등번호 중복 — 한 팀 안에서 등번호는 unique 해야 합니다." },
    ),
});

// 전화번호 정규화 — '010-XXXX-XXXX' 표준으로 변환 (DB 박제 형식 + 입력값 매칭 시 사용)
function normalizePhoneStr(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  return raw.trim();
}

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

  // 2026-05-12 사용자 요청: 이미 제출된 토큰도 401 대신 409 + "수정 가능" 메타로 응답 변경.
  //   client 에서 ALREADY_SUBMITTED 신호 받으면 "수정하기" 버튼 표시.
  //   실제 수정 = PUT /api/web/team-apply/[token]/edit 에서 코치 이름+전화번호 인증.
  const alreadySubmitted = tt.applied_via === "coach_token";

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
    // 2026-05-12 — 이미 제출 여부 표시 (client 가 "수정하기" 버튼 분기)
    alreadySubmitted,
    hasCoachInfo: !!(tt.manager_name && tt.manager_phone),
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
  // 2026-05-12 룰 변경 (사용자 요청): 종별 학년/연령보다 "많은" 경우만 차단 / "어린" 경우 자유 참여.
  //   예: i3-U11 (5학년부) = 5학년 이하 (3·4학년 통과 / 6학년 이상 차단)
  //   - gradeMax 만 검증 (gradeMin 검증 제거)
  //   - birthYearMin 만 검증 (너무 일찍 태어남 = 나이많음 차단 / birthYearMax 검증 제거)
  const validationErrors: Array<{ index: number; field: string; message: string }> = [];
  players.forEach((p, idx) => {
    const birthYear = Number(p.birth_date.slice(0, 4));
    if (rule?.birthYearMin && birthYear < rule.birthYearMin) {
      validationErrors.push({ index: idx, field: "birth_date", message: `${rule.birthYearMin}년 이후 출생자만 가능` });
    }
    if (p.grade != null) {
      if (rule?.gradeMax && p.grade > rule.gradeMax) {
        validationErrors.push({ index: idx, field: "grade", message: `${rule.gradeMax}학년 이하` });
      }
    }
  });
  if (validationErrors.length > 0) {
    return apiError("종별 자격 검증 실패", 422, "DIVISION_VALIDATION_FAILED", { errors: validationErrors });
  }

  // 5) 트랜잭션 — Player INSERT + TournamentTeam 마킹 (applied_via='coach_token' 일회용 가드)
  // 2026-05-15 — P2002 명시 catch 추가 (PUT 과 동일 — defense in depth)
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
        jerseyNumber: p.jersey_number,
        position: p.position ?? null,
        school_name: p.school_name ?? null,
        grade: p.grade ?? null,
        parent_name: p.parent_name ?? null,
        parent_phone: p.parent_phone,
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
  }).catch((e: unknown) => {
    if ((e as { message?: string } | null)?.message === "CONCURRENT_SUBMIT") {
      return { error: "CONCURRENT_SUBMIT" as const };
    }
    if ((e as { code?: string } | null)?.code === "P2002") {
      return { error: "JERSEY_DUPLICATE" as const };
    }
    throw e;
  });

  if ("error" in result) {
    if (result.error === "JERSEY_DUPLICATE") {
      return apiError(
        "등번호 중복 — 같은 팀 안에서 등번호는 unique 해야 합니다.",
        422,
        "JERSEY_DUPLICATE",
      );
    }
    return apiError("동시 제출 충돌 — 이미 명단이 제출되었습니다.", 409, "TOKEN_CONSUMED");
  }

  return apiSuccess({
    ok: true,
    insertedCount: result.inserted,
  });
}

// ============================================================
// PUT — 명단 수정 (제출 완료된 토큰만 / 코치 이름·전화번호 인증)
// 2026-05-12 사용자 요청:
//   - 최초 제출한 코치만 수정 가능
//   - 매번 manager_name + manager_phone 매칭 검증 (별도 세션 토큰 없음)
//   - 매칭 통과 시 = 기존 명단 DELETE + 새 명단 INSERT (트랜잭션)
//   - applied_via='coach_token' 유지 (수정 후에도 일회용 status 유지)
// ============================================================
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { token } = await params;
  if (!TOKEN_REGEX.test(token)) {
    return apiError("유효하지 않은 토큰 형식입니다.", 400);
  }

  // 1) 입력 zod 검증
  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError("잘못된 요청입니다.", 400); }
  const parsed = PutBodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("유효하지 않은 입력입니다.", 422, "VALIDATION_ERROR");
  }
  const { manager_name, manager_phone, players } = parsed.data;

  // 2) 토큰 + 코치 정보 조회
  const tt = await prisma.tournamentTeam.findUnique({
    where: { apply_token: token },
    select: {
      id: true, tournamentId: true, category: true,
      apply_token_expires_at: true, applied_via: true,
      manager_name: true, manager_phone: true,
    },
  });
  if (!tt) return apiError("존재하지 않는 토큰입니다.", 404);

  const now = new Date();
  if (tt.apply_token_expires_at && tt.apply_token_expires_at < now) {
    return apiError("만료된 토큰입니다.", 410, "TOKEN_EXPIRED");
  }
  // 수정 대상 = 최초 제출 완료된 토큰만 (applied_via='coach_token')
  if (tt.applied_via !== "coach_token") {
    return apiError("아직 명단이 제출되지 않은 토큰입니다.", 400, "NOT_SUBMITTED");
  }

  // 3) 코치 인증 매칭 — 4-분기 (2026-05-13)
  //   사유: POST /players 와 동일 — manager_* NULL 케이스에서 최초 1회 setup 허용.
  //         PUT 은 보통 POST /players 인증 직후 호출이라 이미 setup 끝난 상태가 많지만,
  //         페이지 새로고침 등으로 PUT 단독 호출될 수 있어 멱등성 보장 위해 동일 분기 적용.
  const inputName = manager_name.trim();
  const inputPhone = normalizePhoneStr(manager_phone);
  const dbName = (tt.manager_name ?? "").trim();
  const dbPhone = normalizePhoneStr(tt.manager_phone ?? "");

  // 분기 1: 둘 다 있음 → 기존 매칭 검증
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

  // 4) 종별 룰 검증 (POST 와 동일 — 어린 학년/연령 자유)
  const rule = tt.category
    ? await prisma.tournamentDivisionRule.findFirst({
        where: { tournamentId: tt.tournamentId, code: tt.category },
        select: { birthYearMin: true, gradeMax: true },
      })
    : null;
  const validationErrors: Array<{ index: number; field: string; message: string }> = [];
  players.forEach((p, idx) => {
    const birthYear = Number(p.birth_date.slice(0, 4));
    if (rule?.birthYearMin && birthYear < rule.birthYearMin) {
      validationErrors.push({ index: idx, field: "birth_date", message: `${rule.birthYearMin}년 이후 출생자만 가능` });
    }
    if (p.grade != null && rule?.gradeMax && p.grade > rule.gradeMax) {
      validationErrors.push({ index: idx, field: "grade", message: `${rule.gradeMax}학년 이하` });
    }
  });
  if (validationErrors.length > 0) {
    return apiError("종별 자격 검증 실패", 422, "DIVISION_VALIDATION_FAILED", { errors: validationErrors });
  }

  // 5) 트랜잭션 — 기존 명단 DELETE + 새 명단 INSERT
  // 2026-05-15 — P2002 (unique 위반) 명시 catch — zod refine 통과 후 외부 race 등 외 케이스에서도
  //   500 회귀 차단. 1차 가드 = 클라이언트 + 2차 = zod refine + 3차 = 본 catch (defense in depth).
  try {
    await prisma.$transaction(async (tx) => {
      await tx.tournamentTeamPlayer.deleteMany({
        where: { tournamentTeamId: tt.id },
      });
      await tx.tournamentTeamPlayer.createMany({
        data: players.map((p) => ({
          tournamentTeamId: tt.id,
          player_name: p.player_name,
          birth_date: p.birth_date,
          jerseyNumber: p.jersey_number,
          position: p.position ?? null,
          school_name: p.school_name ?? null,
          grade: p.grade ?? null,
          parent_name: p.parent_name ?? null,
          parent_phone: p.parent_phone,
          division_code: tt.category,
          is_active: true,
          claim_status: "pending",
          auto_registered: false,
          invited_at: now,
        })),
      });
    });
  } catch (e: unknown) {
    const code = (e as { code?: string } | null)?.code;
    if (code === "P2002") {
      return apiError(
        "등번호 중복 — 같은 팀 안에서 등번호는 unique 해야 합니다.",
        422,
        "JERSEY_DUPLICATE",
      );
    }
    throw e;
  }

  return apiSuccess({ ok: true, updatedCount: players.length });
}
