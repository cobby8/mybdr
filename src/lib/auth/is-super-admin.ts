/**
 * isSuperAdmin — super_admin 권한 판정 단일 진입점.
 *
 * 2026-05-11 — Phase 2 (권한 시스템 통합) 신규.
 *
 * 이유 (왜):
 *   - 5 파일에 동일 함수 중복 박제 — 시그니처 일관성 약함 (tournament-permission / match-stream
 *     / match-lineup / require-score-sheet-access 인라인 / tournament-auth 인라인). 향후 super_admin
 *     판정 룰 변경 시 5 곳 수정 누락 위험 + JwtPayload 시그니처 vs ad-hoc 시그니처 불일치.
 *   - 단일 source 통합 → super_admin 룰 변경은 본 파일 1개 수정으로 끝.
 *
 * 어떻게:
 *   - 가장 느슨한 input 시그니처 (role / admin_role 옵션) 채택 — JwtPayload / web 세션 / undefined
 *     모두 받음.
 *   - DB 조회 0 (JWT/세션 payload 만 평가) — 호출처에서 React.cache dedup 불필요.
 *
 * 통과 조건 (어느 하나라도 true):
 *   - session.role === "super_admin"   (isAdmin=true 사용자의 JWT 토큰)
 *   - session.admin_role === "super_admin" (DB User.admin_role 세분화 필드)
 *
 * 사용 예:
 *   import { isSuperAdmin } from "@/lib/auth/is-super-admin";
 *   if (isSuperAdmin(session)) return true;
 *
 * 호환:
 *   - 기존 `org-permission.ts` 의 `isSuperAdmin(session: JwtPayload)` 와 동일 결과.
 *   - 기존 인라인 헬퍼 4종 (`{ role?: string; admin_role?: string }`) 과 동일 결과.
 */

// 가장 느슨한 시그니처 — JwtPayload (role 필수) / 세션 (role/admin_role 옵션) / null/undefined 모두 허용.
// 이유: org-permission 의 JwtPayload(role 필수) + match-stream/lineup 의 {role?, admin_role?} 둘 다 호환해야 함.
export interface SuperAdminSession {
  role?: string;
  admin_role?: string;
}

/**
 * 세션이 super_admin 권한을 보유하는지 판정.
 *
 * @param session JWT payload 또는 web 세션 (null/undefined 허용 — 미로그인 false)
 * @returns role 또는 admin_role 둘 중 하나라도 "super_admin" 이면 true
 *
 * 안전 가드: session 자체가 null/undefined 면 false (미로그인 처리).
 */
export function isSuperAdmin(
  session: SuperAdminSession | null | undefined,
): boolean {
  if (!session) return false;
  return session.role === "super_admin" || session.admin_role === "super_admin";
}
