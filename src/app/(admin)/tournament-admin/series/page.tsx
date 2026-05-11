import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SeriesListPage() {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const seriesList = await prisma.tournament_series.findMany({
    where: { organizer_id: BigInt(session.sub) },
    orderBy: { created_at: "desc" },
    include: {
      tournaments: {
        orderBy: { edition_number: "desc" },
        take: 1,
        select: { status: true, edition_number: true },
      },
    },
  }).catch(() => []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>시리즈</h1>
        {/* 2026-05-12 — pill 빨강 ❌ (admin 빨강 본문 금지) → btn btn--primary 표준 (Navy/Red 자동 분기) */}
        <Link
          href="/tournament-admin/series/new"
          className="btn btn--primary"
        >
          새 시리즈 만들기
        </Link>
      </div>

      {seriesList.length > 0 ? (
        <div className="space-y-3">
          {seriesList.map((s) => {
            const latest = s.tournaments[0];
            return (
              // 2026-05-12 — <Link><Card> cascade 차단: <a> color: var(--link) 가 자식 text 로 inherit
              //   되는 패턴. Link 자체에 명시 색 박제 + 자식 p/span 도 명시 박제 (회귀 가드).
              <Link
                key={s.id.toString()}
                href={`/tournament-admin/series/${s.id}`}
                className="block text-[var(--color-text-primary)]"
              >
                <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                  <div>
                    <p className="font-semibold text-[var(--color-text-primary)]">{s.name}</p>
                    <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                      총 {s.tournaments_count ?? 0}회차
                      {s.description && ` · ${s.description}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {latest && (
                      <Badge>
                        {TOURNAMENT_STATUS_LABEL[latest.status ?? "draft"] ?? latest.status}
                      </Badge>
                    )}
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {latest ? `${latest.edition_number}회차 진행` : "회차 없음"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="py-16 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-lg font-semibold text-[var(--color-text-muted)]">No Series</div>
          <p className="mb-4">아직 시리즈가 없습니다.</p>
          {/* 2026-05-12 — pill 빨강 ❌ → btn btn--primary 표준 */}
          <Link
            href="/tournament-admin/series/new"
            className="btn btn--primary"
          >
            첫 시리즈 만들기
          </Link>
        </Card>
      )}
    </div>
  );
}
