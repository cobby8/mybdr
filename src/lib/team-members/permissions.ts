// ─────────────────────────────────────────────────────────────────────────────
// 2026-05-05 Phase 4 PR12 — 팀 운영진 권한 위임 검증 helper
// ─────────────────────────────────────────────────────────────────────────────
// 이유(왜): 모든 승인 API (PR6/PR7/PR8/PR9/PR10) 가 captain + 위임받은 자(role
//   manager/coach/treasurer/director 중 활성 권한 row 보유) 둘 다 처리할 수 있어야 함.
//   현재 captain + role='manager' 직접 검증 패턴은 위임 룰 #4 (보고서 §4) 를 반영 X.
//   본 helper 가 단일 진입점 → 모든 승인 endpoint 가 호출.
//
// 룰:
//   1. captain 자동 부여 — 모든 권한 (Team.captainId === userId)
//   2. 위임 권한 — TeamOfficerPermissions 활성 row (revokedAt IS NULL) 의 permissions JSON
//      에서 해당 키 === true
//   3. 위임받은 자가 재위임 불가 — 본 helper 의 검증 범위 밖 (별도 API 에서 captain 만 허용)
//
// 신규 endpoint 추가 시 본 키 enum 에 추가:
//   - jerseyChangeApprove: 번호 변경 승인 (PR7)
//   - dormantApprove: 휴면 승인 (PR8)
//   - withdrawApprove: 탈퇴 승인 (PR9)
//   - transferApprove: 이적 승인 (PR10) — 본 captain 사이드 한정
//   - ghostClassify: 유령 분류 (Phase 5 PR15)
//   - forceChange: 강제 jersey 변경 (Phase 5 PR15)
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/db/prisma";

export type TeamOfficerPermission =
  | "jerseyChangeApprove"
  | "dormantApprove"
  | "withdrawApprove"
  | "transferApprove"
  | "ghostClassify"
  | "forceChange";

// ─────────────────────────────────────────────────────────────────────────────
// 단일 권한 검증
// ─────────────────────────────────────────────────────────────────────────────
// captain 인지 먼저 확인 → 위임 row 조회 → permissions JSON 의 키 boolean 확인.
// 두 번 SELECT 발생 가능 — captain 이 흔한 경로이므로 첫 SELECT 에서 80%+ 종결됨.
export async function hasTeamOfficerPermission(
  teamId: bigint,
  userId: bigint,
  permission: TeamOfficerPermission,
): Promise<boolean> {
  // 1. captain 검증 — Team.captainId === userId 면 즉시 true
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { captainId: true },
  });
  if (!team) return false;
  if (team.captainId === userId) return true;

  // 2. 위임받은 자 검증 — 활성 권한 row (revokedAt IS NULL) 에서 permissions[key] === true
  const grant = await prisma.teamOfficerPermissions.findFirst({
    where: { teamId, userId, revokedAt: null },
    select: { permissions: true },
  });
  if (!grant) return false;

  // permissions JSON 은 Prisma JsonValue. 안전한 접근 — object 타입 + 키 존재 + true 값.
  const perms = grant.permissions as Record<string, unknown> | null;
  if (!perms || typeof perms !== "object") return false;
  return perms[permission] === true;
}

// ─────────────────────────────────────────────────────────────────────────────
// captain 여부 별도 확인 (재위임 차단용)
// ─────────────────────────────────────────────────────────────────────────────
// 이유: 운영진 권한 위임 API 는 captain 만 호출 가능 (보고서 §4 결정 #4). hasTeamOfficer
//   Permission 은 위임받은 자도 통과시키므로 별도 helper 필요.
export async function isTeamCaptain(teamId: bigint, userId: bigint): Promise<boolean> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { captainId: true },
  });
  return !!team && team.captainId === userId;
}
