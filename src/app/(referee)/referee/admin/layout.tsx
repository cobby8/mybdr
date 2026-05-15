import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
// PR3 (2026-05-15): isRecorderAdmin = isSuperAdmin 자동 흡수 (Q1 결재) — isSuperAdmin 단독 import 불필요.
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";

/**
 * /referee/admin 레이아웃 — 서버 컴포넌트.
 *
 * 이유: 관리자 전용 페이지에 접근하기 전에 서버에서 권한을 체크한다.
 *      redirect() 대신 "접근 권한 없음" 화면을 표시한다.
 *      (이 layout은 referee layout 안에 들어가므로 셸은 유지된다.)
 *
 * 체크 순서:
 *   1) 세션 확인 (상위 referee layout에서 이미 리다이렉트하므로 방어용)
 *   2) 🆕 super_admin 분기 — 즉시 통과 (Phase 1-B / 2026-05-11)
 *   3) 🆕 recorder_admin 분기 — 즉시 통과 (PR3 / 2026-05-15)
 *   4) User.admin_role === "association_admin" 확인
 *   5) AssociationAdmin 매핑 존재 확인
 *
 * 2026-05-11 Phase 1-B — super_admin 우회 추가.
 *   이유: super_admin = 전능 권한 정책 (partner-admin / canManageTournament 등 일관).
 *         AssociationAdmin row 없어도 진입 허용 (대시보드에서 sentinel 안내).
 *
 * 2026-05-15 PR3 — recorder_admin 우회 추가.
 *   이유: recorder_admin = 전역 기록원 관리자 (모든 대회 점수기록 + 기록원 배정 + /referee/admin 진입).
 *         super_admin 자동 흡수 (isRecorderAdmin 내부 OR) — recorder_admin 단일 분기로 둘 다 통과.
 *         Q2 결재 = 협회 12 permission 도 sentinel 자동 통과 (admin-guard.ts 동시 변경).
 */

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getWebSession();

  // 세션이 없으면 상위 layout에서 이미 redirect됨. 방어 코드.
  if (!session) {
    return <AccessDenied />;
  }

  // 🆕 super_admin / recorder_admin 분기 — User.admin_role / AssociationAdmin 검증 skip + 통과
  // 협회 0개 운영 상태 안전 (페이지 측 sentinel 안내 처리)
  // PR3 (2026-05-15): isRecorderAdmin 이 isSuperAdmin 자동 흡수 — recorder_admin 단일 분기로 둘 다 통과.
  if (isRecorderAdmin(session)) {
    return <>{children}</>;
  }

  const userId = BigInt(session.sub);

  // User.admin_role 확인
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { admin_role: true },
  });

  if (!user || user.admin_role !== "association_admin") {
    return <AccessDenied />;
  }

  // AssociationAdmin 매핑 존재 확인
  const adminMapping = await prisma.associationAdmin.findUnique({
    where: { user_id: userId },
    select: { id: true },
  });

  if (!adminMapping) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

// 접근 권한 없음 표시 컴포넌트
function AccessDenied() {
  return (
    <div
      className="flex flex-col items-center justify-center px-6 py-24 text-center"
      style={{
        backgroundColor: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 4,
      }}
    >
      <span
        className="material-symbols-outlined text-5xl"
        style={{ color: "var(--color-text-muted)" }}
      >
        lock
      </span>
      <h2
        className="mt-4 text-lg font-bold"
        style={{ color: "var(--color-text-primary)" }}
      >
        접근 권한이 없습니다
      </h2>
      <p
        className="mt-2 max-w-sm text-sm"
        style={{ color: "var(--color-text-muted)" }}
      >
        이 페이지는 협회 관리자만 접근할 수 있습니다.
        관리자 권한이 필요하시면 소속 협회에 문의해 주세요.
      </p>
    </div>
  );
}
