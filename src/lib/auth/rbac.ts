export const ROLES = {
  FREE: "free",
  PRO: "pro",
  PICKUP_HOST: "pickup_host",
  TOURNAMENT_ADMIN: "tournament_admin",
  SUPER_ADMIN: "super_admin",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const TOURNAMENT_ROLES = {
  ORGANIZER: "organizer",
  COORDINATOR: "coordinator",
  SCOREKEEPER: "scorekeeper",
} as const;

export type TournamentRole =
  (typeof TOURNAMENT_ROLES)[keyof typeof TOURNAMENT_ROLES];

const ROLE_HIERARCHY: Record<Role, number> = {
  [ROLES.FREE]: 0,
  [ROLES.PRO]: 1,
  [ROLES.PICKUP_HOST]: 2,
  [ROLES.TOURNAMENT_ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4,
};

export function hasRole(userRole: string, requiredRole: Role): boolean {
  const userLevel = ROLE_HIERARCHY[userRole as Role] ?? -1;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] ?? Infinity;
  return userLevel >= requiredLevel;
}

// 2026-05-11 Phase 1-B cleanup — `isSuperAdmin(role: string)` 삭제 (사용처 0건 dead code).
// 단일 source 는 `@/lib/auth/is-super-admin.ts` 의 `isSuperAdmin(session)`.
// (role-only 시그니처는 admin_role 미체크라 sentinel 정책 회귀 위험 있어 제거)
