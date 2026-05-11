/**
 * 단체(Organization) 권한 헬퍼
 *
 * 관리자 역할 체계:
 * - isAdmin=true (기존) → super_admin (모든 권한)
 * - admin_role="org_admin" → 단체 승인/거절 권한
 * - admin_role="content_admin" → 콘텐츠 관리 권한
 *
 * 기존 isAdmin 호환을 유지하면서, admin_role로 세분화된 권한을 추가한다.
 */

import type { JwtPayload } from "./jwt";
// 2026-05-11 Phase 2 — isSuperAdmin 단일 source 통합 (5 파일 중복 제거).
// 본 파일은 외부 호출자 호환을 위해 re-export 만 유지.
import { isSuperAdmin as isSuperAdminCore } from "./is-super-admin";

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
