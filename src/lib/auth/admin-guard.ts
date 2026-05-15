import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
// PR3 (2026-05-15): isRecorderAdmin 가 isSuperAdmin 자동 흡수 — sentinel 분기 단일 진입점.
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

/**
 * 협회 관리자(Association Admin) 인증 + 권한 유틸리티.
 *
 * v2 사용법 (기존 호환):
 *   const admin = await getAssociationAdmin();
 *   if (!admin) return apiError("접근 권한이 없습니다.", 403, "FORBIDDEN");
 *
 * v3 권한 체크:
 *   const admin = await getAssociationAdmin();
 *   if (!admin) return apiError("접근 권한이 없습니다.", 403);
 *   if (!hasPermission(admin.role, "referee_manage")) return apiError("권한 부족", 403);
 *
 * 내부 동작:
 *   1) getWebSession()으로 현재 로그인 세션 가져오기
 *   2) super_admin 이면 sentinel role 반환 (첫 활성 협회 자동 선택)
 *   3) User 테이블에서 admin_role이 "association_admin"인지 확인
 *   4) AssociationAdmin 매핑 테이블에서 user_id로 소속 협회 + role 조회
 *   5) 둘 다 통과하면 { userId, associationId, role } 반환, 아니면 null
 *
 * 2026-05-11 Phase 1-B — super_admin sentinel 정책 신규 (decisions.md).
 *   이유: super_admin 도 referee/admin 영역 진입 + 12 permission 모두 자동 통과해야 함.
 *         AssociationAdmin.user_id @unique 라서 super_admin 별도 row 생성 불가 → sentinel 처리.
 *   동작: super_admin 진입 시 첫 활성 협회 자동 선택 + sentinel role (`__super_admin__`).
 *         `hasPermission()` 이 sentinel role 무조건 true 반환 → 12 permission 자동 통과.
 *         협회 0개 운영 상태 = associationId=0n sentinel (페이지 별 안내 처리).
 *
 * 2026-05-15 PR3 — recorder_admin sentinel 통과 (Q2 결재 = 옵션 A).
 *   이유: recorder_admin = 전역 기록원 관리자. /referee/admin 진입 + 협회 12 permission 자동 통과.
 *   동작: isRecorderAdmin 분기 = isSuperAdmin OR recorder_admin (자동 흡수) → 둘 다 동일 sentinel role 반환.
 *         별도 sentinel 상수 분리 없이 SUPER_ADMIN_SENTINEL_ROLE 그대로 재사용 (permission 자동 통과 일관).
 *         별도 권한 차단 분기 추가 0 (정산 등 12 permission 전부 통과 — 본 PR 범위 외 세분화는 PR4 이후).
 */

// ── super_admin sentinel 상수 ──
//   AssociationAdmin.role 의 9 정식 role 과 구분되는 sentinel — hasPermission 자동 통과 마커.
//   외부에서도 sentinel role 식별이 필요할 수 있어 export (UI 안내 헤더 등).
export const SUPER_ADMIN_SENTINEL_ROLE = "__super_admin__";

// ── 타입 정의 ──

export type AdminGuardResult = {
  userId: bigint;
  associationId: bigint;
  // v3: 협회 내 역할 (9종 중 하나)
  role: string;
};

// 권한 그룹명 타입
export type Permission =
  | "referee_manage"
  | "game_manage"
  | "cert_verify"
  | "assignment_manage"
  | "assignment_view"
  | "settlement_manage"
  | "settlement_view"
  | "excel_upload"
  | "admin_manage"
  | "resident_id_view"
  | "document_manage"
  | "document_print";

// ── 권한 매트릭스 ──
// 각 권한 그룹에 접근 가능한 역할 목록
const PERMISSIONS: Record<Permission, string[]> = {
  // 심판 등록/수정/삭제
  referee_manage: ["secretary_general", "referee_chief", "referee_clerk"],
  // 경기원 등록/수정/삭제
  game_manage: ["secretary_general", "game_chief", "game_clerk"],
  // 자격증 검증 (심판팀 + 경기팀)
  cert_verify: [
    "secretary_general",
    "referee_chief",
    "referee_clerk",
    "game_chief",
    "game_clerk",
  ],
  // 배정 관리 (생성/수정/삭제)
  assignment_manage: ["secretary_general", "referee_chief", "game_chief"],
  // 배정 열람 — 모든 역할 허용 (임원 포함)
  assignment_view: [
    "secretary_general",
    "referee_chief",
    "referee_clerk",
    "game_chief",
    "game_clerk",
    "president",
    "vice_president",
    "director",
    "staff",
  ],
  // 정산 관리 — 사무국장만
  settlement_manage: ["secretary_general"],
  // 정산 열람 — 사무국장 + 팀장급 + 임원
  settlement_view: [
    "secretary_general",
    "referee_chief",
    "game_chief",
    "president",
    "vice_president",
    "director",
  ],
  // Excel 일괄 업로드
  excel_upload: [
    "secretary_general",
    "referee_chief",
    "referee_clerk",
    "game_chief",
    "game_clerk",
  ],
  // 관리자 추가/삭제 — 사무국장만
  admin_manage: ["secretary_general"],
  // 주민번호 열람 — 회장 + 사무국장만
  resident_id_view: ["president", "secretary_general"],
  // 정산 서류 관리 (업로드/삭제) — 사무국장 + 직원
  document_manage: ["secretary_general", "staff"],
  // 정산 서류 인쇄/다운로드 — 사무국장만
  document_print: ["secretary_general"],
};

// ── 임원 역할 목록 (열람 전용) ──
const EXECUTIVE_ROLES = ["president", "vice_president", "director"];

// ── 핵심 함수들 ──

export async function getAssociationAdmin(): Promise<AdminGuardResult | null> {
  // 1) 세션 확인 — 로그인 안 되어 있으면 null
  const session = await getWebSession();
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 2) 🆕 super_admin / recorder_admin sentinel 분기 (Phase 1-B / 2026-05-11 + PR3 / 2026-05-15)
  //   이유: super_admin = 모든 협회 + 12 permission 자동 통과 (partner-admin 패턴 일관).
  //         recorder_admin = 전역 기록원 관리자도 /referee/admin 영역 자동 통과 (Q2 결재 옵션 A).
  //   동작: 첫 활성 협회 자동 선택 + sentinel role 반환 → hasPermission() 자동 통과.
  //         isRecorderAdmin 가 isSuperAdmin 자동 흡수 (Q1) — 단일 분기로 둘 다 통과.
  //   협회 0개 운영 상태 = associationId=0n sentinel (페이지 별 안내).
  if (isRecorderAdmin(session)) {
    // 첫 활성 협회 자동 선택 — 협회별 active 컬럼 없음 (Association 모델 = 정적 마스터).
    // 협회 admin 매핑이 존재하는 첫 협회를 우선 선택 (운영 안전 — 실제 사용 중인 협회).
    // 매핑이 0건이면 협회 자체 첫 row 사용. 둘 다 0이면 0n sentinel.
    const firstActiveAdmin = await prisma.associationAdmin.findFirst({
      select: { association_id: true },
      orderBy: { id: "asc" },
    });

    let associationId = firstActiveAdmin?.association_id;
    if (associationId === undefined) {
      const firstAssociation = await prisma.association.findFirst({
        select: { id: true },
        orderBy: { id: "asc" },
      });
      associationId = firstAssociation?.id ?? BigInt(0);
    }

    return {
      userId,
      associationId,
      role: SUPER_ADMIN_SENTINEL_ROLE,
    };
  }

  // 3) User.admin_role 확인 — "association_admin"이어야 함
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin_role: true },
  });
  if (!user || user.admin_role !== "association_admin") return null;

  // 4) AssociationAdmin 매핑 조회 — user_id가 unique이므로 findUnique 사용
  //    v3: role 필드도 함께 가져옴
  const adminMapping = await prisma.associationAdmin.findUnique({
    where: { user_id: userId },
    select: { association_id: true, role: true },
  });
  if (!adminMapping) return null;

  return {
    userId,
    associationId: adminMapping.association_id,
    role: adminMapping.role,
  };
}

/**
 * 특정 권한 보유 여부 확인
 *
 * @param role - 관리자의 역할 코드 (예: "secretary_general")
 * @param permission - 확인할 권한 그룹 (예: "referee_manage")
 * @returns 해당 역할이 권한을 가지고 있으면 true
 *
 * 2026-05-11 Phase 1-B — super_admin sentinel role 자동 통과.
 *   이유: getAssociationAdmin() 이 super_admin 시 sentinel role 반환 → 12 permission 모두 통과 보장.
 */
export function hasPermission(role: string, permission: Permission): boolean {
  // 🆕 super_admin sentinel — 12 permission 모두 자동 통과
  if (role === SUPER_ADMIN_SENTINEL_ROLE) return true;
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(role);
}

/**
 * 권한 검사 + apiError 반환 헬퍼.
 * 라우트 핸들러에서 한 줄로 권한 체크할 때 사용.
 *
 * 사용법:
 *   const denied = requirePermission(admin.role, "referee_manage");
 *   if (denied) return denied;
 *
 * @returns 권한 없으면 Response (403), 있으면 null
 */
export function requirePermission(
  role: string,
  permission: Permission
): Response | null {
  if (hasPermission(role, permission)) return null;

  // 권한 없음 — 403 JSON 응답 직접 생성 (apiError import 순환 방지)
  return new Response(
    JSON.stringify({
      success: false,
      error: { message: "이 기능에 대한 접근 권한이 없습니다.", code: "FORBIDDEN" },
    }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}

/**
 * 임원(회장/부회장/이사) 여부 확인.
 * 임원은 기본적으로 열람만 가능하며, 데이터 수정 권한은 없다.
 */
export function isExecutive(role: string): boolean {
  return EXECUTIVE_ROLES.includes(role);
}

// 외부에서 권한 목록을 참조할 수 있도록 export
export { PERMISSIONS };
