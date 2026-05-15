import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { isRecorderAdmin } from "@/lib/auth/is-recorder-admin";
import {
  getAssociationAdmin,
  SUPER_ADMIN_SENTINEL_ROLE,
} from "@/lib/auth/admin-guard";

/**
 * /referee/admin — 관리자 대시보드 (서버 컴포넌트).
 *
 * 이유: 정적 통계 표시만 하므로 서버에서 직접 Prisma 쿼리.
 *      API 호출 없이 서버에서 데이터를 가져오면 클라이언트 왕복이 줄어든다.
 *      (admin layout에서 이미 권한 체크 완료)
 *
 * 2026-05-11 Phase 1-B — super_admin sentinel 안내 헤더 추가.
 *   이유: super_admin = 모든 협회 자동 통과 정책. 진입 시 sentinel 표시 + 첫 활성 협회
 *         자동 선택 (getAssociationAdmin sentinel role).
 *   동작: 일반 association_admin 진입 시 기존 동작 유지. super_admin 진입 시 안내 헤더 + sentinel
 *         협회 (첫 활성) 데이터 표시. 협회 0개 운영 시 (associationId=0n) 안내만 표시 + 통계 0.
 *
 * 2026-05-15 PR3 — recorder_admin sentinel 안내 헤더 분기 추가.
 *   이유: recorder_admin 도 sentinel 분기 (협회 N/A 상태에서도 진입 허용) — 안내 텍스트는
 *         "Recorder Admin 권한 진입" 으로 분기 표시 (운영자가 진입 경로 식별).
 *   분기: super_admin 우선 표시 (isRecorderAdmin 가 super 흡수하지만, 진입 정체성은 super_admin 이면
 *         "Super Admin", recorder_admin 만 있으면 "Recorder Admin" 으로 분기).
 */

export default async function AdminDashboardPage() {
  const session = await getWebSession();
  // layout에서 이미 검증됨. 방어용 null 체크.
  if (!session) return null;

  const userId = BigInt(session.sub);

  // 🆕 super_admin / recorder_admin sentinel 분기 (Phase 1-B / PR3)
  //   getAssociationAdmin() 이 super/recorder_admin 시 sentinel role + 첫 활성 협회 자동 선택.
  //   기존 페이지 동작 보존을 위해 sentinel 경로는 별도 처리 — 협회명/통계는 첫 협회 사용.
  // PR3 분기 우선순위: super_admin 이면 "Super Admin" / 그 외 recorder_admin 이면 "Recorder Admin".
  //   이유: isRecorderAdmin 가 super 자동 흡수 — super_admin 보유자는 super 정체성 우선 표시.
  const superAdmin = isSuperAdmin(session);
  const recorderAdmin = !superAdmin && isRecorderAdmin(session);
  const isSentinelSession = superAdmin || recorderAdmin;
  let associationId: bigint;
  let associationName: string;
  let isSuperAdminEntry = false; // 안내 헤더 표시 여부 (super or recorder 진입)
  let entryRole: "super_admin" | "recorder_admin" | null = null; // 안내 텍스트 분기
  let hasAssociation = true;

  if (isSentinelSession) {
    // sentinel — getAssociationAdmin() 통해서 첫 활성 협회 자동 선택 (admin-guard 동일 로직).
    const guardResult = await getAssociationAdmin();
    if (!guardResult || guardResult.role !== SUPER_ADMIN_SENTINEL_ROLE) {
      // 비정상 — admin-guard 가 sentinel 안 줬으면 폴백 (있을 수 없는 케이스).
      return null;
    }
    isSuperAdminEntry = true;
    entryRole = superAdmin ? "super_admin" : "recorder_admin";
    associationId = guardResult.associationId;
    // 협회 0개 운영 시 associationId=0n sentinel — 안전 처리.
    if (associationId === BigInt(0)) {
      hasAssociation = false;
      associationName = "(협회 미등록)";
    } else {
      const association = await prisma.association.findUnique({
        where: { id: associationId },
        select: { name: true },
      });
      associationName = association?.name ?? "(이름 없음)";
    }
  } else {
    // 기존 동작 — association_admin 본인의 매핑 사용
    const adminMapping = await prisma.associationAdmin.findUnique({
      where: { user_id: userId },
      include: {
        association: { select: { name: true, code: true } },
      },
    });
    if (!adminMapping) return null;

    associationId = adminMapping.association_id;
    associationName = adminMapping.association.name;
  }

  // 4개 통계 병렬 조회 — 협회 0개 운영 (sentinel associationId=0n) 시 skip + 0 표시
  // 이유: associationId=0n 인 row 는 실재하지 않음 → 쿼리해도 0건 (성능 무관) 이지만 명시적 분기.
  const [totalReferees, certStats, unpaidTotal, recentAssignments] =
    hasAssociation
      ? await Promise.all([
          prisma.referee.count({
            where: { association_id: associationId },
          }),
          prisma.refereeCertificate.groupBy({
            by: ["verified"],
            where: { referee: { association_id: associationId } },
            _count: true,
          }),
          prisma.refereeSettlement.aggregate({
            where: {
              referee: { association_id: associationId },
              status: "pending",
            },
            _sum: { amount: true },
          }),
          prisma.refereeAssignment.count({
            where: {
              referee: { association_id: associationId },
              assigned_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              },
            },
          }),
        ])
      : [
          0,
          [] as Array<{ verified: boolean; _count: number }>,
          { _sum: { amount: null as number | null } },
          0,
        ];

  const verifiedCount =
    certStats.find((s) => s.verified === true)?._count ?? 0;
  const unverifiedCount =
    certStats.find((s) => s.verified === false)?._count ?? 0;
  const totalCerts = verifiedCount + unverifiedCount;
  const verificationRate =
    totalCerts > 0 ? Math.round((verifiedCount / totalCerts) * 100) : 0;
  const unpaidAmount = unpaidTotal._sum.amount ?? 0;

  // 통계 카드 데이터
  const stats = [
    {
      icon: "groups",
      label: "소속 심판",
      value: `${totalReferees}명`,
    },
    {
      icon: "verified",
      label: "자격증 검증율",
      value: `${verificationRate}%`,
      sub: `${verifiedCount}/${totalCerts}건`,
    },
    {
      icon: "payments",
      label: "미정산 총액",
      value: `${unpaidAmount.toLocaleString("ko-KR")}원`,
    },
    {
      icon: "event",
      label: "최근 30일 배정",
      value: `${recentAssignments}건`,
    },
  ];

  // 빠른 링크
  const quickLinks = [
    {
      href: "/referee/admin/members",
      icon: "manage_accounts",
      label: "심판 관리",
      description: "소속 심판 목록 조회 및 자격증 검증",
    },
    {
      href: "/referee/admin/bulk-verify",
      icon: "upload_file",
      label: "Excel 일괄 검증",
      description: "Excel 파일로 자격증 일괄 검증 처리",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 2026-05-11 Phase 1-B — super_admin sentinel 안내 헤더.
          이유: super_admin = 자기 협회 소속 아니어도 진입 가능 (전능 권한). 진입 시 어느 협회
                 데이터인지 명시 (첫 활성 협회 자동 선택). 일반 admin 은 헤더 미표시.
          시각: var(--color-warning) 차분한 강조 (사용자 결재: 회색 / warning 약하게 강조). */}
      {isSuperAdminEntry && (
        <div
          className="flex items-start gap-2 rounded-md border p-3"
          style={{
            borderColor: "var(--color-warning, #FFAB00)",
            backgroundColor:
              "var(--color-warning-bg, rgba(255,171,0,0.08))",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 22,
              color: "var(--color-warning, #FFAB00)",
            }}
          >
            verified
          </span>
          <div className="min-w-0">
            <div
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {/* PR3 분기 — super_admin 우선 / recorder_admin 별도 라벨 */}
              {entryRole === "recorder_admin"
                ? "Recorder Admin 권한 진입"
                : "Super Admin 권한 진입"}
              {hasAssociation && (
                <span
                  className="ml-2 text-xs font-normal"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  — Association: {associationName}
                </span>
              )}
            </div>
            <div
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {hasAssociation
                ? "협회 자동 선택 — 모든 12 권한 자동 통과합니다. (협회 전환 UI 는 후속 Phase)"
                : "협회가 등록되지 않았습니다. 통계 0 표시 — 운영자가 협회를 등록한 뒤 다시 진입해 주세요."}
            </div>
          </div>
        </div>
      )}

      {/* 헤더 */}
      <header>
        <h1
          className="text-2xl font-black uppercase tracking-wider"
          style={{ color: "var(--color-text-primary)" }}
        >
          관리자 대시보드
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--color-text-muted)" }}
        >
          {associationName} 관리 현황
        </p>
      </header>

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="p-4"
            style={{
              backgroundColor: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 4,
            }}
          >
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-xl"
                style={{ color: "var(--color-primary)" }}
              >
                {stat.icon}
              </span>
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                {stat.label}
              </span>
            </div>
            <p
              className="mt-2 text-xl font-black"
              style={{ color: "var(--color-text-primary)" }}
            >
              {stat.value}
            </p>
            {stat.sub && (
              <p
                className="mt-0.5 text-xs"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {stat.sub}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* 빠른 링크 */}
      <section>
        <h2
          className="mb-3 text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          빠른 메뉴
        </h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center gap-4 p-4 transition-colors"
              style={{
                backgroundColor: "var(--color-card)",
                border: "1px solid var(--color-border)",
                borderRadius: 4,
              }}
            >
              <span
                className="material-symbols-outlined text-2xl"
                style={{ color: "var(--color-primary)" }}
              >
                {link.icon}
              </span>
              <div>
                <p
                  className="font-bold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {link.label}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {link.description}
                </p>
              </div>
              <span
                className="material-symbols-outlined ml-auto text-lg"
                style={{ color: "var(--color-text-muted)" }}
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
