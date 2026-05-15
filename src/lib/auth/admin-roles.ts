/**
 * Admin 권한 매트릭스 단일 진입점 — getAdminRoles()
 *
 * 2026-05-11 — admin 마이페이지 Phase 1 MVP (decisions.md [2026-05-11] §admin/me).
 *
 * 이유 (왜):
 *   - AdminLayout 가 이미 super_admin/site_admin/tournament_admin/partner_member/org_member
 *     5종 권한을 계산. 같은 로직을 `/admin/me` 마이페이지에서 다시 짜면 정합성 어긋남 (5/5
 *     인증 단일 진입점 박제 룰 동일 회귀 패턴).
 *   - tournamentAdminMember / tournament_recorders 는 Phase 1 마이페이지에서 "토너먼트별
 *     운영 권한" 표시용 필요. layout 도 같은 SELECT 를 dedup (React.cache) 로 재사용.
 *
 * 어떻게:
 *   1. layout + `/admin/me` 양쪽 호출 → React.cache 로 동일 요청 내 DB SELECT dedup.
 *   2. super_admin 인 경우 partner/org SELECT skip (효율 보존).
 *   3. 모든 DB SELECT 는 `isActive: true` 필터 (Phase 1-B-2 reviewer Major fix 패턴 동일).
 *   4. tournament 정보는 JOIN (name) — 마이페이지 카드 표시용. 권한 계산 자체에는
 *      tournament name 불필요하지만 layout 도 React.cache 같은 SELECT 재사용하므로
 *      한 번에 가져옴 (추가 라운드트립 회피).
 *
 * 보장:
 *   - layout 가드와 동일 5종 (super/site/tournament_admin + partner/org) 정합 — 한 사용자가
 *     layout 진입 가능하면 마이페이지에 표시된 권한도 일치.
 *   - schema 변경 0 / Flutter v1 영향 0 / 운영 DB SELECT only (read).
 */

import { cache } from "react";
import { prisma } from "@/lib/db/prisma";
import { getAuthUser, type AuthUser } from "./get-auth-user";
// PR3 (2026-05-15): recorder_admin (전역 기록원 관리자) 매트릭스 박제용 — isSuperAdmin 자동 흡수.
import { isRecorderAdmin } from "./is-recorder-admin";

// AdminLayout 호환 — sidebar.tsx 의 AdminRole 타입과 동일 (메뉴 필터링 재사용)
// PR3 (2026-05-15): recorder_admin 은 AdminRole union 에 추가하지 않음.
//   이유: (admin)/admin/* sidebar 진입 자동 허용 금지 (scratchpad §1 권한 매트릭스).
//         recorder_admin = /referee/admin/* 전용 신호. summary.recorderAdmin boolean 으로 분리 표시.
//         summary.roles 에 "recorder_admin" 을 넣으면 (admin)/admin/layout 의 length>0 가드 통과 발생.
//         RoleMatrixCard 는 boolean 으로 직접 표시 — roles 배열 push 불필요.
export type AdminRole =
  | "super_admin"
  | "site_admin"
  | "tournament_admin"
  | "partner_member"
  | "org_member";

// 토너먼트별 권한 (마이페이지 카드 표시용)
// 2026-05-11 Phase 2 — status / startDate / endDate / format 추가 (관리 토너먼트 카드 분류용)
// 기존 Phase 1 필드 (tournamentId / tournamentName / role) 는 그대로 — 회귀 0 보장.
export interface TournamentAdminEntry {
  tournamentId: string;
  tournamentName: string | null;
  role: string; // "admin" / "manager" 등 (tournament_admin_members.role)
  // Phase 2 확장 — 옵셔널 (회귀 가드). 기존 호출자는 status undefined 로 받음 → 영향 0
  tournamentStatus?: string | null;
  tournamentStartDate?: Date | null;
  tournamentEndDate?: Date | null;
  tournamentFormat?: string | null;
}

export interface TournamentRecorderEntry {
  tournamentId: string;
  tournamentName: string | null;
  // Phase 2 확장 — 옵셔널
  tournamentStatus?: string | null;
  tournamentStartDate?: Date | null;
  tournamentEndDate?: Date | null;
  tournamentFormat?: string | null;
}

// 파트너 / 단체 소속 (마이페이지 카드 표시용 — null 이면 미소속)
export interface PartnerMembership {
  partnerId: string;
  partnerName: string;
  role: string;
}

export interface OrgMembership {
  organizationId: string;
  organizationName: string;
  role: string;
}

// 2026-05-11 Phase 3 — 협회 관리자 (Association Admin) 소속 (마이페이지 RoleMatrixCard 행 추가).
// 이유: super_admin 이 referee/admin 영역 자동 통과 (Phase 1-B) — RoleMatrixCard 에 8번째 행으로 표시.
// AssociationAdmin.user_id @unique → 1 유저 = 1 협회만 (단일 매핑).
export interface AssociationAdminMembership {
  associationId: string;
  associationName: string;
  role: string; // 9 role 중 1 (secretary_general / referee_chief / ...)
}

/**
 * AdminRoleSummary — `/admin/me` + AdminLayout 양쪽 재사용 결과.
 *
 * boolean 5종 (super/site/tournament_admin + partner/org 존재 여부) +
 * 토너먼트별 리스트 2종 + 파트너/단체 단일 + AdminLayout 호환 `roles` 배열.
 *
 * 사용 예 (layout):
 *   const summary = await getAdminRoles(userId, session);
 *   if (summary.roles.length === 0) redirect(...);
 *   <AdminSidebar roles={summary.roles} />
 *
 * 사용 예 (마이페이지):
 *   const summary = await getAdminRoles(userId, session);
 *   <RoleMatrixCard roles={summary} />
 */
export interface AdminRoleSummary {
  // boolean 매트릭스 — UI 매트릭스 표시 / 효율 분기
  superAdmin: boolean;
  siteAdmin: boolean;
  tournamentAdmin: boolean;
  // 2026-05-15 PR3 — recorder_admin (전역 기록원 관리자) boolean.
  //   isRecorderAdmin(session) 결과 — super_admin 자동 흡수 (Q1 결재).
  //   RoleMatrixCard 가 superAdmin 도 "Super 자동" 흡수 표시할 수 있도록 분리 박제.
  recorderAdmin: boolean;
  // 토너먼트별 운영 권한 리스트 (마이페이지 표시 — 5건 펼치기 UX 는 Phase 2)
  tournamentAdminMembers: TournamentAdminEntry[];
  tournamentRecorders: TournamentRecorderEntry[];
  // 파트너 / 단체 소속 (단일 — 다중 케이스는 우선 첫 번째만 표시, Phase 2 확장)
  partnerMember: PartnerMembership | null;
  orgMember: OrgMembership | null;
  // 2026-05-11 Phase 3 — 협회 관리자 (referee/admin 영역) 단일 (user_id @unique 보장).
  // null = 미소속. super_admin 본인은 직접 매핑 없음 → null (UI 에서 "Super 자동" 표시).
  associationAdmin: AssociationAdminMembership | null;
  // AdminLayout sidebar 메뉴 필터링 호환 — boolean 매트릭스에서 파생
  roles: AdminRole[];
}

// JwtPayload 일부 (admin_role 옵션 — jwt.ts 와 일치)
interface SessionLike {
  role?: string;
  admin_role?: string;
}

/**
 * 권한 매트릭스 SELECT + 계산 단일 함수.
 *
 * React.cache 적용 — 같은 (userId, session) 호출 시 DB SELECT dedup.
 * layout + `/admin/me` 가 같은 요청에서 호출되어도 DB 라운드트립 1회.
 *
 * @param userId  User.id (bigint)
 * @param session JwtPayload (role / admin_role 분기용) — null 허용 (직접 SELECT 만)
 *
 * 보안:
 *   - 본인 user_id 만 SELECT (다른 사용자 권한 노출 0).
 *   - isActive: true 필터 (비활성 권한 회수된 케이스 차단 — Phase 1-B-2 fix 패턴).
 *   - DB SELECT 실패 시 안전하게 empty summary 반환 (가드 = 권한 없음 처리).
 */
export const getAdminRoles = cache(
  async (
    userId: bigint,
    session: SessionLike | null
  ): Promise<AdminRoleSummary> => {
    // 1) JWT 기반 boolean 계산 — super/site/tournament_admin
    // 이유: AdminLayout 원본 로직과 정확히 동일 (정합성 보장).
    const superAdmin = session?.role === "super_admin";
    const siteAdmin = session?.admin_role === "site_admin";
    const tournamentAdmin = session?.role === "tournament_admin";
    // 2026-05-15 PR3 — recorder_admin (전역 기록원 관리자) 박제.
    //   isRecorderAdmin 은 isSuperAdmin 자동 흡수 → super_admin 보유자도 true 반환 (Q1 결재).
    //   UI 측 (RoleMatrixCard) 에서 super_admin 일 때는 "Super 자동" 표시 / 그 외 본인 권한 표시.
    const recorderAdmin = isRecorderAdmin(session);

    // 2) DB SELECT — super_admin 이면 일부 skip (효율)
    // partner/org 는 super_admin 인 경우 굳이 조회 불필요 (AdminLayout 동일 패턴 + 마이페이지
    // 표시 정합성 위해 super_admin 도 조회 — 본인 소속 정보는 마이페이지에 보여줘야 함).
    // 결정: super_admin 이어도 partner/org/tam/recorder SELECT 는 실행 (마이페이지 정보 표시 필요).
    let tournamentAdminMembers: TournamentAdminEntry[] = [];
    let tournamentRecorders: TournamentRecorderEntry[] = [];
    let partnerMember: PartnerMembership | null = null;
    let orgMember: OrgMembership | null = null;
    // 2026-05-11 Phase 3 — 협회 관리자 (referee/admin) 매핑
    let associationAdmin: AssociationAdminMembership | null = null;

    try {
      const [tamRows, recorderRows, partnerRow, orgRow, associationAdminRow] = await Promise.all([
        // 토너먼트별 운영 권한 — JOIN Tournament(name + status + startDate + endDate + format)
        // 2026-05-11 Phase 2: take 51 (50 상한 + 1 도달 안내) / status/startDate/endDate/format 추가
        // 사유: 관리 토너먼트 카드에서 진행 중/예정/완료 분류 + 50 상한 도달 시 UI 안내.
        prisma.tournamentAdminMember.findMany({
          where: { userId, isActive: true },
          select: {
            tournamentId: true,
            role: true,
            tournament: {
              select: {
                name: true,
                status: true,
                startDate: true,
                endDate: true,
                format: true,
              },
            },
          },
          take: 51, // 51 = 50 + 1 → length === 51 이면 "상한 도달" 안내
          orderBy: { createdAt: "desc" }, // 최근 위임 우선 표시
        }),
        // 토너먼트별 기록원 권한 — JOIN Tournament(name + status + startDate + endDate + format)
        prisma.tournament_recorders.findMany({
          where: { recorderId: userId, isActive: true },
          select: {
            tournamentId: true,
            tournament: {
              select: {
                name: true,
                status: true,
                startDate: true,
                endDate: true,
                format: true,
              },
            },
          },
          take: 51,
          orderBy: { createdAt: "desc" },
        }),
        // 파트너 소속 — JOIN partners(name) (다중 케이스 우선 첫 건)
        prisma.partner_members.findFirst({
          where: { user_id: userId, is_active: true },
          select: {
            partner_id: true,
            role: true,
            partner: { select: { name: true } },
          },
        }),
        // 단체 소속 — JOIN organizations(name) (다중 케이스 우선 첫 건)
        prisma.organization_members.findFirst({
          where: { user_id: userId, is_active: true },
          select: {
            organization_id: true,
            role: true,
            organization: { select: { name: true } },
          },
        }),
        // 2026-05-11 Phase 3 — 협회 관리자 매핑 (user_id @unique 라 findUnique 가능)
        // RoleMatrixCard 의 referee 행 표시용. JOIN Association(name).
        prisma.associationAdmin.findUnique({
          where: { user_id: userId },
          select: {
            association_id: true,
            role: true,
            association: { select: { name: true } },
          },
        }),
      ]);

      // 토너먼트별 운영 권한 매핑 — bigint → 직렬화 가능 / null name 안전
      // 2026-05-11 Phase 2: tournament status/startDate/endDate/format 도 매핑
      tournamentAdminMembers = tamRows.map((r) => ({
        tournamentId: r.tournamentId,
        tournamentName: r.tournament?.name ?? null,
        role: r.role,
        tournamentStatus: r.tournament?.status ?? null,
        tournamentStartDate: r.tournament?.startDate ?? null,
        tournamentEndDate: r.tournament?.endDate ?? null,
        tournamentFormat: r.tournament?.format ?? null,
      }));

      tournamentRecorders = recorderRows.map((r) => ({
        tournamentId: r.tournamentId,
        tournamentName: r.tournament?.name ?? null,
        tournamentStatus: r.tournament?.status ?? null,
        tournamentStartDate: r.tournament?.startDate ?? null,
        tournamentEndDate: r.tournament?.endDate ?? null,
        tournamentFormat: r.tournament?.format ?? null,
      }));

      // partner — bigint id → string 직렬화 (마이페이지 표시용)
      if (partnerRow) {
        partnerMember = {
          partnerId: partnerRow.partner_id.toString(),
          partnerName: partnerRow.partner?.name ?? "(이름 없음)",
          role: partnerRow.role,
        };
      }

      if (orgRow) {
        orgMember = {
          organizationId: orgRow.organization_id.toString(),
          organizationName: orgRow.organization?.name ?? "(이름 없음)",
          role: orgRow.role,
        };
      }

      // 2026-05-11 Phase 3 — 협회 관리자 매핑 (bigint → string 직렬화)
      if (associationAdminRow) {
        associationAdmin = {
          associationId: associationAdminRow.association_id.toString(),
          associationName:
            associationAdminRow.association?.name ?? "(이름 없음)",
          role: associationAdminRow.role,
        };
      }
    } catch {
      // DB SELECT 실패 시 안전하게 비어 있는 상태로 폴백 — 가드는 권한 없음 처리.
      // (운영 중 DB 일시 장애 시 layout 진입 실패보다 권한 없음이 안전)
      tournamentAdminMembers = [];
      tournamentRecorders = [];
      partnerMember = null;
      orgMember = null;
      associationAdmin = null;
    }

    // 3) AdminLayout sidebar 호환 `roles` 배열 — boolean 매트릭스에서 파생
    // 이유: 기존 AdminSidebar / AdminMobileNav 가 roles: AdminRole[] prop 으로 메뉴 필터.
    //       summary 객체 하나로 layout + sidebar prop + 마이페이지 카드 모두 커버.
    const roles: AdminRole[] = [];
    if (superAdmin) roles.push("super_admin");
    if (siteAdmin) roles.push("site_admin");
    if (tournamentAdmin) roles.push("tournament_admin");
    // partner/org 는 super_admin 인 경우에도 메뉴 진입에 영향 — AdminLayout 원본 로직 보존:
    // super_admin 일 때는 skip (메뉴 중복 방지). super 가 아니면 소속 시에만 push.
    if (!superAdmin) {
      if (partnerMember) roles.push("partner_member");
      if (orgMember) roles.push("org_member");
    }
    // 2026-05-15 PR3 — recorder_admin 은 roles 배열 push 하지 않음.
    //   이유: (admin)/admin/layout 이 roles.length === 0 일 때만 차단 — recorder_admin push 시
    //         일반 사용자가 (admin)/admin/* 영역 진입 가능해짐 (혼선 회피 룰 위반).
    //         RoleMatrixCard 가 boolean 으로 별도 표시 (summary.recorderAdmin) → push 불필요.

    return {
      superAdmin,
      siteAdmin,
      tournamentAdmin,
      recorderAdmin,
      tournamentAdminMembers,
      tournamentRecorders,
      partnerMember,
      orgMember,
      associationAdmin,
      roles,
    };
  }
);

/**
 * 편의 헬퍼 — `getAuthUser()` 결과에서 바로 권한 매트릭스 계산.
 *
 * layout / 마이페이지 페이지 양쪽에서 같은 패턴 반복 회피용 (선택).
 *
 * @param auth getAuthUser() 결과 (state === "active" 만 통과 가정)
 * @returns AdminRoleSummary
 *
 * 사용:
 *   const auth = await getAuthUser();
 *   if (auth.state !== "active" || !auth.user) redirect("/login");
 *   const summary = await getAdminRolesFromAuth(auth);
 */
export async function getAdminRolesFromAuth(
  auth: AuthUser
): Promise<AdminRoleSummary> {
  if (auth.state !== "active" || !auth.user || !auth.session) {
    // 비정상 호출 — 빈 매트릭스 반환 (caller 가 redirect 처리)
    return {
      superAdmin: false,
      siteAdmin: false,
      tournamentAdmin: false,
      recorderAdmin: false, // PR3 (2026-05-15)
      tournamentAdminMembers: [],
      tournamentRecorders: [],
      partnerMember: null,
      orgMember: null,
      associationAdmin: null,
      roles: [],
    };
  }
  return getAdminRoles(auth.user.id, auth.session);
}
