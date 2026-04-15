/**
 * GET /api/web/teams/[id] — 팀 상세 조회 (수정 폼용)
 * PATCH /api/web/teams/[id] — 팀 정보 수정 (팀장만)
 * DELETE /api/web/teams/[id] — 팀 해산 (팀장만, soft delete: status='dissolved')
 */
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";
// Phase 2A-2: 팀 수정 입력값 검증 (영문명 엄격 규칙 포함)
import { updateTeamSchema } from "@/lib/validation/team";

type RouteCtx = { params: Promise<{ id: string }> };

/**
 * 팀장 여부 확인 유틸 — captain role + active 상태
 */
async function isCaptain(teamId: bigint, userId: bigint): Promise<boolean> {
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, role: "captain", status: "active" },
  });
  return !!member;
}

// ─────────────────────────────────────────────────
// GET: 팀 상세 조회 (수정 폼용)
// 인증 필요 — 팀장만 수정 폼 데이터를 가져올 수 있음
// ─────────────────────────────────────────────────
export const GET = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;
  const teamId = BigInt(id);

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      // Phase 2A-2: 영문명 + 대표언어 (수정 폼 UI에서 읽고 쓰기 위해 필요)
      name_en: true,
      name_primary: true,
      description: true,
      city: true,
      district: true,
      home_court: true,
      founded_year: true,
      primaryColor: true,
      secondaryColor: true,
      is_public: true,
      accepting_members: true,
      max_members: true,
      status: true,
      captainId: true,
    },
  });

  if (!team) {
    return apiError("존재하지 않는 팀입니다.", 404, "NOT_FOUND");
  }

  // IDOR: 팀장만 수정 데이터 접근 가능
  const captain = await isCaptain(teamId, ctx.userId);
  if (!captain && ctx.session.role !== "super_admin") {
    return apiError("팀장만 접근할 수 있습니다.", 403, "FORBIDDEN");
  }

  return apiSuccess({
    id: team.id.toString(),
    name: team.name,
    // Phase 2A-2: 응답에도 포함 — 수정 폼이 기존 값으로 초기화할 수 있게
    name_en: team.name_en,
    name_primary: team.name_primary,
    description: team.description,
    city: team.city,
    district: team.district,
    home_court: team.home_court,
    founded_year: team.founded_year,
    primary_color: team.primaryColor,
    secondary_color: team.secondaryColor,
    is_public: team.is_public,
    accepting_members: team.accepting_members,
    max_members: team.max_members,
    status: team.status,
  });
});

// ─────────────────────────────────────────────────
// PATCH: 팀 정보 수정 (팀장만)
// - 해산(dissolved) 상태인 팀은 수정 불가
// ─────────────────────────────────────────────────
export const PATCH = withWebAuth(async (req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;
  const teamId = BigInt(id);

  // 팀 존재 + 상태 확인
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, status: true },
  });
  if (!team) {
    return apiError("존재하지 않는 팀입니다.", 404, "NOT_FOUND");
  }
  // 해산된 팀은 수정 불가
  if (team.status === "dissolved") {
    return apiError("해산된 팀은 수정할 수 없습니다.", 400, "TEAM_DISSOLVED");
  }
  // IDOR: 팀장만 수정 가능
  const captain = await isCaptain(teamId, ctx.userId);
  if (!captain && ctx.session.role !== "super_admin") {
    return apiError("팀장만 수정할 수 있습니다.", 403, "FORBIDDEN");
  }

  // 요청 본문 파싱
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return apiError("잘못된 요청 형식입니다.", 400, "BAD_REQUEST");
  }

  // Phase 2A-2: Zod로 body 검증 — 영문명 엄격 규칙(알파벳/숫자/공백/하이픈)을 여기서 한 번에 걸러냄
  // 기존 필드 검증도 그대로 살아있지만 Zod가 통과한 값만 updateData로 내려감
  const parsed = updateTeamSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return apiError(
      firstIssue?.message ?? "입력값이 올바르지 않습니다.",
      400,
      "INVALID_INPUT"
    );
  }
  const body = parsed.data;

  // 수정 가능한 필드만 추출 (부분 업데이트)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};

  // 팀명: 2~30자 (Zod가 이미 trim + 길이 검증 완료)
  if (body.name !== undefined) {
    updateData.name = body.name;
  }
  // Phase 2A-2: 영문명 — null로 명시 전달 시 지우기 / 문자열이면 저장
  // nameEnSchema가 빈 문자열을 null로 치환해주므로 그대로 대입 가능
  if (body.name_en !== undefined) {
    updateData.name_en = body.name_en; // string | null
  }
  // Phase 2A-2: 대표 언어 — "ko" | "en" (기본값 "ko"는 Zod에서 주입됨)
  if (body.name_primary !== undefined) {
    updateData.name_primary = body.name_primary;
  }
  // 설명
  if (body.description !== undefined) {
    updateData.description = body.description?.trim() || null;
  }
  // 도시
  if (body.city !== undefined) {
    updateData.city = body.city?.trim() || null;
  }
  // 지역구
  if (body.district !== undefined) {
    updateData.district = body.district?.trim() || null;
  }
  // 홈코트
  if (body.home_court !== undefined) {
    updateData.home_court = body.home_court?.trim() || null;
  }
  // 창단연도 — null이면 지우기, 숫자면 범위 검증 후 저장
  // Phase 2A-2: updateTeamSchema에서 null을 허용하도록 명시되어 strict 체크 대응 필요
  if (body.founded_year !== undefined) {
    if (body.founded_year === null) {
      updateData.founded_year = null;
    } else {
      if (body.founded_year < 1900 || body.founded_year > new Date().getFullYear()) {
        return apiError("유효하지 않은 창단 연도입니다.", 400, "INVALID_YEAR");
      }
      updateData.founded_year = body.founded_year;
    }
  }
  // 팀 색상
  if (body.primary_color !== undefined) {
    updateData.primaryColor = body.primary_color;
  }
  if (body.secondary_color !== undefined) {
    updateData.secondaryColor = body.secondary_color;
  }
  // 공개 여부
  if (body.is_public !== undefined) {
    updateData.is_public = body.is_public;
  }
  // 멤버 모집 여부
  if (body.accepting_members !== undefined) {
    updateData.accepting_members = body.accepting_members;
  }
  // 최대 멤버 수
  if (body.max_members !== undefined) {
    if (body.max_members < 2 || body.max_members > 50) {
      return apiError("최대 인원은 2~50명 사이로 입력해주세요.", 400, "INVALID_MAX");
    }
    updateData.max_members = body.max_members;
  }

  if (Object.keys(updateData).length === 0) {
    return apiError("수정할 항목이 없습니다.", 400, "NO_CHANGES");
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: updateData,
  });

  return apiSuccess({
    id: updated.id.toString(),
    name: updated.name,
    status: updated.status,
  });
});

// ─────────────────────────────────────────────────
// DELETE: 팀 해산 (팀장만)
// - 실제 삭제가 아닌 status를 'dissolved'로 변경 (soft delete)
// - 이미 해산된 팀은 재해산 불가
// ─────────────────────────────────────────────────
export const DELETE = withWebAuth(async (_req: Request, routeCtx: RouteCtx, ctx: WebAuthContext) => {
  const { id } = await routeCtx.params;
  const teamId = BigInt(id);

  // 팀 존재 + 상태 확인
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, status: true },
  });
  if (!team) {
    return apiError("존재하지 않는 팀입니다.", 404, "NOT_FOUND");
  }
  // 이미 해산된 팀
  if (team.status === "dissolved") {
    return apiError("이미 해산된 팀입니다.", 400, "TEAM_DISSOLVED");
  }
  // IDOR: 팀장만 해산 가능
  const captain = await isCaptain(teamId, ctx.userId);
  if (!captain && ctx.session.role !== "super_admin") {
    return apiError("팀장만 해산할 수 있습니다.", 403, "FORBIDDEN");
  }

  // soft delete: status를 'dissolved'로 변경 + 멤버 모집 중단
  await prisma.team.update({
    where: { id: teamId },
    data: {
      status: "dissolved",
      accepting_members: false,
    },
  });

  return apiSuccess({ message: "팀이 해산되었습니다." });
});
