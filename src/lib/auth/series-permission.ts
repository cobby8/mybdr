/**
 * Series Permission — 시리즈(tournament_series) organizer 권한 헬퍼.
 *
 * 2026-05-12 — 대회-시리즈 연결 API (PR1) 신규.
 * 2026-05-12 (Phase C) — `requireSeriesEditor()` 추가 — Q2 권한 확장:
 *   시리즈 organizer + 단체 owner/admin + super_admin 모두 통과.
 *
 * 이유 (왜):
 *   - 운영자가 자신의 대회를 사후에 시리즈에 연결하는 API 추가 시, "자신이 소유한 시리즈로만
 *     연결 허용" 권한 검증이 필요.
 *   - Phase C: 시리즈 PATCH/DELETE 시 단체 소속 시리즈인 경우 단체 owner/admin 도 만질 수 있어야
 *     운영 셀프서비스 가능 (Q2 결재 — 사용자 결정).
 *   - 기존 tournament-auth 패턴(`requireTournamentAdmin`)과 동일하게 (1) 존재 검증 → 404 분기 →
 *     (2) organizer 검증 → 403 분기 → (3) super_admin 우회 옵션 패턴 통일.
 *
 * 어떻게:
 *   - throw 기반 (호출자가 try/catch 로 잡아 apiError 변환) — `requireTournamentAdmin` 의 NextResponse
 *     반환 패턴과 다른 이유: route 안에서 $transaction 내부에서도 호출 가능하도록 (NextResponse 를
 *     transaction 안에서 다루기 곤란).
 *   - 시리즈 row 자체를 반환 — 호출자가 organization_id, tournaments_count 등 즉시 참조 가능.
 *
 * 사용 예:
 *   import { requireSeriesOwner, SeriesPermissionError } from "@/lib/auth/series-permission";
 *   try {
 *     const targetSeries = await requireSeriesOwner(BigInt("8"), userId, { allowSuperAdmin: true, session });
 *   } catch (e) {
 *     if (e instanceof SeriesPermissionError) return apiError(e.message, e.status);
 *     throw e;
 *   }
 */

import { prisma } from "@/lib/db/prisma";
import { isSuperAdmin, type SuperAdminSession } from "@/lib/auth/is-super-admin";

/**
 * 시리즈 권한 체크 실패 시 throw 되는 에러.
 * route 핸들러에서 catch 하여 apiError(message, status) 로 변환한다.
 */
export class SeriesPermissionError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "SeriesPermissionError";
    this.status = status;
  }
}

/**
 * 시리즈를 SELECT 한 뒤 (1) 존재 / (2) organizer 일치 검증.
 *
 * @param seriesId 검증 대상 시리즈 ID (BigInt)
 * @param userId 현재 로그인 유저 ID (BigInt)
 * @param opts.allowSuperAdmin true 면 session.role/admin_role === "super_admin" 시 검증 우회
 * @param opts.session super_admin 우회 판정에 사용할 세션 — allowSuperAdmin=true 일 때만 필수
 * @returns tournament_series row (호출자가 organization_id 등 참조 가능)
 *
 * @throws {SeriesPermissionError} 404 시리즈 없음 / 403 권한 없음
 */
export async function requireSeriesOwner(
  seriesId: bigint,
  userId: bigint,
  opts?: {
    allowSuperAdmin?: boolean;
    session?: SuperAdminSession | null;
  }
) {
  // 시리즈 존재 검증 — 우선 SELECT (super_admin 도 대상 시리즈 없으면 404 = tournament-auth 패턴 일치)
  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    throw new SeriesPermissionError("시리즈를 찾을 수 없습니다.", 404);
  }

  // super_admin 우회 — allowSuperAdmin=true + session.role/admin_role 매칭 시 organizer 검증 skip
  if (opts?.allowSuperAdmin && isSuperAdmin(opts.session)) {
    return series;
  }

  // organizer 검증 — 본인 소유 시리즈만 허용
  if (series.organizer_id !== userId) {
    throw new SeriesPermissionError("권한이 없습니다.", 403);
  }

  return series;
}

/**
 * 시리즈 편집 권한 (Phase C / Q2 결재) — organizer + 단체 owner/admin + super_admin 통과.
 *
 * 이유 (왜 requireSeriesOwner 와 분리):
 *   - 시리즈 PATCH/DELETE 시 단체 소속 시리즈인 경우 단체 owner/admin 도 운영 셀프서비스
 *     가능해야 함 (운영자 결재 Q2). organizer 본인만 가능한 케이스 (예: 시리즈 자체 생성/wizard
 *     create-tournament 흐름) 와 분리해서 의도 명시.
 *   - super_admin 우회는 옵션 (PR1 패턴 일치) — 본 헬퍼 호출 시 항상 super_admin 통과 (운영 사고
 *     긴급 fix 여지).
 *
 * 통과 조건 (어느 하나라도 true):
 *   1) super_admin (session.role/admin_role)
 *   2) series.organizer_id === userId (시리즈 organizer 본인)
 *   3) series.organization_id !== null && organization_members 에서 (user_id, role IN [owner, admin], is_active=true)
 *
 * @param seriesId 검증 대상 시리즈 ID (BigInt)
 * @param userId 현재 로그인 유저 ID (BigInt)
 * @param session JWT/web 세션 (super_admin 판정용)
 * @returns tournament_series row + 통과 사유 (`'organizer' | 'org_owner' | 'org_admin' | 'super_admin'`)
 *
 * @throws {SeriesPermissionError} 404 시리즈 없음 / 403 권한 없음
 */
export async function requireSeriesEditor(
  seriesId: bigint,
  userId: bigint,
  session: SuperAdminSession | null | undefined,
): Promise<{
  series: Awaited<ReturnType<typeof prisma.tournament_series.findUnique>>;
  via: "organizer" | "org_owner" | "org_admin" | "super_admin";
}> {
  // 시리즈 SELECT — 존재 검증 우선 (super_admin 도 시리즈 없으면 404, requireSeriesOwner 패턴 일치)
  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesId },
  });

  if (!series) {
    throw new SeriesPermissionError("시리즈를 찾을 수 없습니다.", 404);
  }

  // (1) super_admin 우회 — 가장 먼저 (단체 멤버 SELECT 회피)
  if (isSuperAdmin(session)) {
    return { series, via: "super_admin" };
  }

  // (2) 시리즈 organizer 본인
  if (series.organizer_id === userId) {
    return { series, via: "organizer" };
  }

  // (3) 단체 owner/admin — series.organization_id 가 NULL 이면 단체 권한 검증 자체 skip (외부인 차단)
  if (series.organization_id !== null) {
    const membership = await prisma.organization_members.findFirst({
      where: {
        organization_id: series.organization_id,
        user_id: userId,
        is_active: true,
        role: { in: ["owner", "admin"] },
      },
      select: { role: true },
    });

    if (membership) {
      return {
        series,
        via: membership.role === "owner" ? "org_owner" : "org_admin",
      };
    }
  }

  throw new SeriesPermissionError("권한이 없습니다.", 403);
}

/**
 * 단체 owner/admin 멤버십 검증 — 시리즈 organization_id 변경 시 (이전/새 단체 양쪽) 사전 검증용.
 *
 * 이유: requireSeriesEditor 와 별도 — 시리즈가 아닌 "임의 단체" 의 멤버십을 단발 확인할 때 사용.
 * super_admin 우회 X (호출자가 따로 분기) — 카운터 동기화 정확성 우선.
 *
 * @returns true = owner/admin / false = 권한 없음
 */
export async function isOrganizationEditor(
  organizationId: bigint,
  userId: bigint,
): Promise<boolean> {
  const m = await prisma.organization_members.findFirst({
    where: {
      organization_id: organizationId,
      user_id: userId,
      is_active: true,
      role: { in: ["owner", "admin"] },
    },
    select: { id: true },
  });
  return !!m;
}
