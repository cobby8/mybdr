/**
 * Admin 마이페이지 — `/admin/me`
 *
 * 2026-05-11 — Phase 1 MVP (사용자 결재 7건 권장안 채택).
 *
 * 표시 범위 (Phase 1):
 *   1. 로그인 정보 (닉네임 / 이메일 / 가입일 / UID)
 *   2. 권한 매트릭스 7종 (super/site/tournament_admin + TAM/recorder + partner/org)
 *
 * Phase 2 후속:
 *   - 관리 토너먼트 진행 상태 (status JOIN)
 *   - 본인인증 상태 (mock / portone)
 *   - 최근 admin 활동 로그
 *
 * 인증 흐름:
 *   - getAuthUser() 단일 진입점 (5/5 박제) — state === "active" 만 통과.
 *   - AdminLayout 가 이미 redirect 처리하지만, 페이지 직접 진입 케이스 대비 가드 보강.
 *   - layout + 이 페이지가 같은 요청에서 호출 시 React.cache dedup (DB SELECT 1회).
 *
 * 데이터 fetch:
 *   - getAdminRoles(userId, session) — 권한 매트릭스 (admin-roles.ts 헬퍼)
 *   - User 추가 SELECT — email / createdAt / profile_image_url
 *     (getAuthUser 가 반환하는 user 는 id/nickname/status 만 → 마이페이지 표시용 보강 SELECT)
 *
 * server component (interactivity = 자식 UserMenu/LogoutButton 만 client).
 */

import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { getAdminRoles } from "@/lib/auth/admin-roles";
import { prisma } from "@/lib/db/prisma";
import { UserInfoCard } from "./_components/user-info-card";
import { RoleMatrixCard } from "./_components/role-matrix-card";

// Next.js 메타데이터 — admin 영역 페이지 타이틀
export const metadata = {
  title: "마이페이지 | BDR Admin",
};

export default async function AdminMyPage() {
  // 1) 인증 단일 진입점 — JWT verify + DB user.status 분기 + 쿠키 자동 cleanup (5/5 박제)
  const auth = await getAuthUser();
  if (auth.state !== "active" || !auth.user || !auth.session) {
    // layout 도 동일 가드 — 이중 안전망. 직접 진입 케이스 대비.
    redirect("/login");
  }

  const userId = auth.user.id;

  // 2) 권한 매트릭스 + User 추가 정보 병렬 SELECT
  // 이유: getAuthUser 의 user = id/nickname/status 만 → 마이페이지에 email/createdAt/profile 필요.
  //       React.cache 덕분에 getAdminRoles 는 layout 과 dedup.
  const [summary, userDetails] = await Promise.all([
    getAdminRoles(userId, auth.session),
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
        profile_image_url: true,
      },
    }),
  ]);

  // 3) user details 없음 = 비정상 (getAuthUser active 통과했으므로 사실상 일어나면 안 됨)
  // 안전 가드 — DB drift / race condition 케이스 redirect.
  if (!userDetails) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      {/* 페이지 헤더 */}
      <header>
        <h1
          className="text-2xl font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          마이페이지
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-secondary)" }}
        >
          내 로그인 정보와 관리자 권한을 확인할 수 있습니다.
        </p>
      </header>

      {/* 로그인 정보 카드 */}
      <UserInfoCard
        user={{
          id: userDetails.id,
          nickname: userDetails.nickname,
          email: userDetails.email,
          createdAt: userDetails.createdAt,
          profileImageUrl: userDetails.profile_image_url,
        }}
      />

      {/* 권한 매트릭스 카드 */}
      <RoleMatrixCard roles={summary} />
    </div>
  );
}
