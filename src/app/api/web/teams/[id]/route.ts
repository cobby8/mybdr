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

// 운영진 역할 — GET(조회) 가드 통과 대상.
// 이유(왜): P1-A에서 members API는 부팀장(vice)·매니저(manager)도 통과시켰는데,
// 정작 팀 단일 정보 GET이 captain only로 막혀 있어 manage 페이지의 "팀 설정" 탭이
// 부팀장/매니저 진입 시 403 → 빈 폼으로 보이는 UX 단절이 있었다.
// 정책 결정 3A에 따라 GET만 운영진 통과로 확장하고,
// PATCH(수정) / DELETE(해산)는 captain only를 그대로 유지한다.
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

/**
 * 팀장 여부 확인 유틸 — captain role + active 상태
 * (PATCH/DELETE 가드 그대로 사용)
 *
 * 2026-04-29: team.captain_id 직접 매칭 추가.
 * 이유(왜): team_members.role 이 'director' 등 비표준 값이지만 team.captain_id 는 정상인
 * 케이스(김병곤 사례)에서 PATCH/DELETE 가 막히던 문제. captain_id 가 본인이면 무조건 팀장으로 인정.
 */
async function isCaptain(teamId: bigint, userId: bigint): Promise<boolean> {
  // 1) 팀의 captain_id 직접 매칭 — 이게 정의상 가장 신뢰할 수 있는 팀장 판정 기준
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { captainId: true },
  });
  if (team?.captainId === userId) return true;

  // 2) fallback: team_members 에 role='captain' active 도 인정 (기존 동작 보존)
  const member = await prisma.teamMember.findFirst({
    where: { teamId, userId, role: "captain", status: "active" },
  });
  return !!member;
}

// ─────────────────────────────────────────────────
// GET: 팀 상세 조회 (수정 폼용)
// 인증 필요 — 운영진(captain/vice/manager)이면 폼 데이터 조회 허용
// 단, 실제 수정/해산은 PATCH/DELETE에서 captain만 허용 (응답의 my_role/is_captain으로 UI 분기)
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
      // 2026-04-29: 관리 페이지에서 홈/어웨이 컬러 + 로고 편집을 위해 select 에 추가.
      // home_color/away_color 는 prisma schema 에서 @map 없이 snake_case 그대로,
      // logo_url 은 @map("logo_url") 매핑된 camelCase logoUrl.
      home_color: true,
      away_color: true,
      logoUrl: true,
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

  // IDOR: 운영진(captain/vice/manager)만 폼 데이터 접근 가능
  // 이유(왜): captain 외 운영진도 manage 페이지의 "팀 설정" 탭에서 정보를 볼 수 있어야
  // UX가 끊기지 않는다 (수정 권한은 PATCH 가드에서 별도 차단).
  const myMember = await prisma.teamMember.findFirst({
    where: {
      teamId,
      userId: ctx.userId,
      role: { in: [...TEAM_MANAGER_ROLES] },
      status: "active",
    },
    select: { role: true },
  });
  // 2026-04-29: team.captainId 직접 매칭 보강 — team_members.role 이 비표준 값('director' 등)
  // 으로 등록되어 myMember 조회에서 누락된 경우에도, captain_id 본인이면 무조건 통과.
  const isCaptainById = team.captainId === ctx.userId;
  if (!myMember && !isCaptainById && ctx.session.role !== "super_admin") {
    return apiError("팀 운영진만 접근할 수 있습니다.", 403, "FORBIDDEN");
  }

  // super_admin은 운영진이 아니지만 통과 — my_role은 null로 응답하되 is_captain은 true 처리
  // (super_admin은 운영 목적으로 captain 권한과 동일하게 다룸)
  // captain_id 로 잡힌 사용자는 myMember 가 null 일 수 있어 my_role 도 'captain' 으로 보정.
  const myRole = myMember?.role ?? (isCaptainById ? "captain" : null);
  const isCaptainFlag =
    myRole === "captain" || isCaptainById || ctx.session.role === "super_admin";

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
    // 2026-04-29: 신규 필드 — apiSuccess 가 자동 snake_case 변환 적용하지만,
    // prisma camelCase logoUrl 만 명시 매핑 (home_color/away_color 는 이미 snake).
    home_color: team.home_color,
    away_color: team.away_color,
    logo_url: team.logoUrl,
    is_public: team.is_public,
    accepting_members: team.accepting_members,
    max_members: team.max_members,
    status: team.status,
    // 정책 결정 3A: 클라이언트가 입력 필드/버튼 disabled 분기에 사용
    // my_role: "captain" | "vice" | "manager" | null (super_admin이면 null)
    // is_captain: PATCH/DELETE 가능 여부 — captain 또는 super_admin
    my_role: myRole,
    is_captain: isCaptainFlag,
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
  // 2026-04-29: 홈/어웨이 유니폼 색상 (생성 폼에서 받지만 관리에서 누락이었음).
  // schema 매핑: home_color/away_color 는 @map 없이 snake_case 그대로 사용.
  if (body.home_color !== undefined) {
    updateData.home_color = body.home_color;
  }
  if (body.away_color !== undefined) {
    updateData.away_color = body.away_color;
  }
  // 2026-04-29: 팀 로고 URL — prisma 필드명은 logoUrl (@map "logo_url").
  // logoUrlSchema preprocess 가 빈 문자열을 null 로 치환하므로, null 명시도 허용 (지우기).
  if (body.logo_url !== undefined) {
    updateData.logoUrl = body.logo_url;
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
