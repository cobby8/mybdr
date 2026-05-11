import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_FORMAT_LABEL } from "@/lib/constants/tournament-status";
import Link from "next/link";

export const dynamic = "force-dynamic";

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{headerLabel}</h1>
        {/* 2026-05-12 — admin 빨강 본문 금지 → btn btn--primary 표준 */}
        <Link href="/tournament-admin/tournaments/new/wizard" className="btn btn--primary">새 대회</Link>
      </div>

      {tournaments.length > 0 ? (
        <div className="space-y-3">
          {tournaments.map((t) => (
            {/* 2026-05-12 — <Link><Card> link color cascade 차단: 명시 색 박제 */}
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
                <Badge>{TOURNAMENT_STATUS_LABEL[t.status ?? "draft"] ?? t.status}</Badge>
              </Card>
            </Link>
          ))}
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
