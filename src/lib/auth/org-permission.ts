/**
 * 단체(Organization) 권한 헬퍼
 *
 * 관리자 역할 체계:
 * - isAdmin=true (기존) → super_admin (모든 권한)
 * - admin_role="org_admin" → 단체 승인/거절 권한
 * - admin_role="content_admin" → 콘텐츠 관리 권한
 *
 * 기존 isAdmin 호환을 유지하면서, admin_role로 세분화된 권한을 추가한다.
 *
 * 2026-05-12 (Phase E) — `requireOrganizationOwner()` 추가:
 *   단체 archive (status='archived') / 복구 같은 destructive 액션은 owner 만 통과해야 함 (admin 도 X).
 *   super_admin 우회는 옵션 (운영 사고 긴급 fix 여지).
 */

import type { JwtPayload } from "./jwt";
// 2026-05-11 Phase 2 — isSuperAdmin 단일 source 통합 (5 파일 중복 제거).
// 본 파일은 외부 호출자 호환을 위해 re-export 만 유지.
import { isSuperAdmin as isSuperAdminCore, type SuperAdminSession } from "./is-super-admin";
import { prisma } from "@/lib/db/prisma";

// 관리자 역할 타입
export type AdminRole = "super_admin" | "org_admin" | "content_admin";

/**
 * 슈퍼 관리자인지 확인 — 단일 source `is-super-admin.ts` 로 위임.
 * 기존 isAdmin=true (role=super_admin) 또는 admin_role=super_admin.
 *
 * @deprecated 본 re-export 는 기존 외부 호출자 (game-reports route 등) 호환용.
 *   신규 코드는 `@/lib/auth/is-super-admin` 직접 import 권장.
 */
export function isSuperAdmin(session: JwtPayload): boolean {
  // JwtPayload 는 role 필수 — 단일 source 시그니처와 호환 (옵셔널 input 받음).
  return isSuperAdminCore(session);
}

/**
 * 단체 관리 권한이 있는지 확인
 * super_admin 또는 org_admin이면 단체 승인/거절 가능
 */
export function canManageOrganizations(session: JwtPayload): boolean {
  if (isSuperAdmin(session)) return true;
  return session.admin_role === "org_admin";
}

/**
 * 특정 admin_role을 가지고 있는지 확인
 * super_admin은 모든 역할을 포함한다
 */
export function hasAdminRole(session: JwtPayload, role: AdminRole): boolean {
  if (isSuperAdmin(session)) return true;
  return session.admin_role === role;
}

/**
 * 관리자 여부 확인 (어떤 admin_role이든)
 * 기존 isAdmin 호환: role=super_admin이면 관리자
 */
export function isAnyAdmin(session: JwtPayload): boolean {
  if (session.role === "super_admin") return true;
  return !!session.admin_role;
}

// ============================================================
// Phase E (2026-05-12) — 단체 lifecycle (archive/복구) 권한
// ============================================================

/**
 * 단체 권한 검증 실패 시 throw 되는 에러.
 * route 핸들러에서 catch 하여 apiError(message, status) 로 변환한다.
 *
 * series-permission.ts 의 `SeriesPermissionError` 와 동일 패턴.
 */
export class OrganizationPermissionError extends Error {
  public readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "OrganizationPermissionError";
    this.status = status;
  }
}

/**
 * 단체 owner 권한 검증 — Phase E archive/복구 같은 destructive 액션 전용.
 *
 * 이유 (왜 admin 도 차단):
 *   - 단체 archive 는 단체 자체의 lifecycle 변경 → owner 만의 결정이어야 함 (admin 일임 X).
 *   - 복구 (archived → approved) 도 owner 만 가능 — admin 이 임의로 archive/복구 반복 차단.
 *   - 시리즈/대회 편집 (admin 가능) 과 의도적 분리.
 *
 * 통과 조건 (어느 하나라도 true):
 *   1) super_admin (옵션) — 운영 사고 긴급 fix 여지
 *   2) organization_members.role === 'owner' && is_active === true
 *
 * @param organizationId 검증 대상 단체 ID (BigInt)
 * @param userId 현재 로그인 유저 ID (BigInt)
 * @param session 세션 (super_admin 판정용 — null 가능)
 * @param opts.allowSuperAdmin 기본 true — super_admin 우회 허용. false 면 owner 본인만 통과
 * @returns organizations row + 통과 사유
 *
 * @throws {OrganizationPermissionError} 404 단체 없음 / 403 권한 없음
 */
export async function requireOrganizationOwner(
  organizationId: bigint,
  userId: bigint,
  session: SuperAdminSession | null | undefined,
  opts?: { allowSuperAdmin?: boolean },
): Promise<{
  organization: NonNullable<Awaited<ReturnType<typeof prisma.organizations.findUnique>>>;
  via: "owner" | "super_admin";
}> {
  const allowSuperAdmin = opts?.allowSuperAdmin ?? true;

  // 단체 존재 검증 — 우선 SELECT (super_admin 도 단체 없으면 404 = series-permission 패턴 일치)
  const organization = await prisma.organizations.findUnique({
    where: { id: organizationId },
  });

  if (!organization) {
    throw new OrganizationPermissionError("단체를 찾을 수 없습니다.", 404);
  }

  // (1) super_admin 우회 — 가장 먼저 (멤버십 SELECT 회피)
  if (allowSuperAdmin && isSuperAdminCore(session)) {
    return { organization, via: "super_admin" };
  }

  // (2) owner 본인 — role='owner' 이면서 is_active=true 만 통과 (admin/member 차단)
  const membership = await prisma.organization_members.findFirst({
    where: {
      organization_id: organizationId,
      user_id: userId,
      is_active: true,
      role: "owner",
    },
    select: { id: true },
  });

  if (!membership) {
    throw new OrganizationPermissionError("권한이 없습니다.", 403);
  }

  return { organization, via: "owner" };
}
