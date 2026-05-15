import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_FORMAT_LABEL } from "@/lib/constants/tournament-status";
import Link from "next/link";
// Admin-7-A 박제 (BDR v2.14 AdminTournamentAdminList.jsx) — eyebrow + breadcrumbs + actions 헤더
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export const dynamic = "force-dynamic";

/**
 * 본인 운영 대회 목록 — /tournament-admin/tournaments
 *
 * 2026-05-15 Admin-7-A 박제:
 *   - raw <h1> + Link → AdminPageHeader (eyebrow/breadcrumbs/actions)
 *   - <Badge> → admin-stat-pill[data-tone] (status tone 매핑)
 *   - Card 컴포넌트 보존 (운영 UX) — 시안 admin-table 박제는 옵션 A 별 PR
 *   - Prisma 쿼리 / super_admin 분기 / format 표시 비즈 0 변경
 */

// 시안 동일 4 tone 매핑 (Admin-5 패턴) — TOURNAMENT_STATUS_LABEL 의 키 전체 커버
type StatusTone = "ok" | "warn" | "info" | "mute";
const STATUS_TONE: Record<string, StatusTone> = {
  // 준비중 → mute
  draft: "mute",
  upcoming: "mute",
  // 접수중 → info (파란)
  registration: "info",
  registration_open: "info",
  active: "info",
  published: "info",
  open: "info",
  opening_soon: "info",
  registration_closed: "info",
  // 진행중 → ok (초록)
  in_progress: "ok",
  live: "ok",
  ongoing: "ok",
  group_stage: "ok",
  // 종료 → mute (회색)
  completed: "mute",
  ended: "mute",
  closed: "mute",
  cancelled: "mute",
};

export default async function TournamentAdminTournamentsPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  // 2026-05-11 — 권한 시스템 정리 6번째 super_admin 우회 fix (사용자 결재 4건).
  // - super_admin: 모든 대회 표시 (제한 X)
  // - 일반 운영자: 본인이 organizer 인 대회 OR 위임받은 TAM (is_active) 대회 합산
  const isSuper = isSuperAdmin(session);
  const userId = BigInt(session.sub);

  const tournaments = await prisma.tournament.findMany({
    where: isSuper
      ? {}
      : {
          OR: [
            { organizerId: userId },
            { adminMembers: { some: { userId, isActive: true } } },
          ],
        },
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  // 헤더 라벨 분기 — super_admin 진입 시 "전체 대회" / 일반 "내 대회"
  const headerLabel = isSuper ? "전체 대회" : "내 대회";

  return (
    <div>
      {/* Admin-7-A 박제: raw h1 + Link → AdminPageHeader (eyebrow + breadcrumbs + actions) */}
      <AdminPageHeader
        eyebrow={`ADMIN · 대회 운영${isSuper ? " · SUPER" : ""}`}
        title={headerLabel}
        subtitle={`${isSuper ? "전체" : "내가 운영하는"} 대회를 상태별로 관리합니다.`}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 운영자 도구" },
          { label: headerLabel },
        ]}
        actions={
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="btn btn--primary"
            style={{ textDecoration: "none" }}
          >
            + 새 대회 만들기
          </Link>
        }
      />

      {tournaments.length > 0 ? (
        <div className="space-y-3">
          {/* 2026-05-12 — <Link><Card> link color cascade 차단: 명시 색 박제 */}
          {tournaments.map((t) => {
            // Admin-7-A 박제: Badge → admin-stat-pill[data-tone] (status tone 폴백 mute)
            const statusKey = t.status ?? "draft";
            const statusLabel = TOURNAMENT_STATUS_LABEL[statusKey] ?? statusKey;
            const statusTone: StatusTone = STATUS_TONE[statusKey] ?? "mute";
            return (
              <Link
                key={t.id}
                href={`/tournament-admin/tournaments/${t.id}`}
                className="block text-[var(--color-text-primary)]"
              >
                <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{t.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {t.startDate ? t.startDate.toLocaleDateString("ko-KR") : "날짜 미정"}
                      {t.format && ` · ${TOURNAMENT_FORMAT_LABEL[t.format] ?? t.format}`}
                    </p>
                  </div>
                  <span className="admin-stat-pill" data-tone={statusTone}>
                    {statusLabel}
                  </span>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-2 text-lg font-semibold text-[var(--color-text-muted)]">No Tournaments</div>
          관리하는 대회가 없습니다.{" "}
          {/* 액션 링크 = accent 강조 (빨강 본문 금지) */}
          <Link href="/tournament-admin/tournaments/new/wizard" className="text-[var(--color-accent)] hover:underline">새 대회 만들기</Link>
        </Card>
      )}
    </div>
  );
}
