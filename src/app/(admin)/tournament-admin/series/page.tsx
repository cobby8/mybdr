import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/admin-toss";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { TOURNAMENT_STATUS_LABEL } from "@/lib/constants/tournament-status";

export const dynamic = "force-dynamic";

function formatLatestEdition(
  latest: { edition_number: number | null; status: string | null } | undefined,
) {
  if (!latest) return "회차 없음";
  return `${latest.edition_number ?? "-"}회차`;
}

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
    <div data-skin="toss" className="space-y-6">
      <div className="ts-ph">
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="layers" size={15} />
              대회 관리자
            </div>
            <div className="ts-ph__title">시리즈</div>
            <div className="ts-ph__sub">반복 개최되는 대회 묶음과 다음 회차를 관리합니다.</div>
          </div>
          <div className="ts-ph__actions">
            <Link href="/tournament-admin/series/new" className="ts-btn ts-btn--primary">
              <Icon name="plus" size={17} />
              시리즈 만들기
            </Link>
          </div>
        </div>
      </div>

      {seriesList.length > 0 ? (
        <div className="ad-tablescroll">
          <div className="ts-table ad-table">
            <div
              className="ts-thead"
              style={{ gridTemplateColumns: "minmax(220px,1.4fr) 110px 130px 110px 64px" }}
            >
              <span>시리즈</span>
              <span>회차</span>
              <span>최근 상태</span>
              <span>다음</span>
              <span />
            </div>
            {seriesList.map((series) => {
              const latest = series.tournaments[0];
              const status = latest?.status ?? "draft";
              return (
                <Link
                  key={series.id.toString()}
                  href={`/tournament-admin/series/${series.id}`}
                  className="ts-trow"
                  style={{ gridTemplateColumns: "minmax(220px,1.4fr) 110px 130px 110px 64px" }}
                >
                  <span>
                    <span className="ad-cell-strong">{series.name}</span>
                    <span className="ad-cell-sub">
                      {series.description || "설명 없음"}
                    </span>
                  </span>
                  <span className="ad-cell-mono">{series.tournaments_count ?? 0}회</span>
                  <span className="ad-statusline">
                    <span className="ad-dot" data-tone={latest ? "ok" : "mute"} />
                    {latest ? TOURNAMENT_STATUS_LABEL[status] ?? status : "대기"}
                  </span>
                  <span className="ad-cell-muted">{formatLatestEdition(latest)}</span>
                  <span className="ad-rowact">
                    <span className="ad-iconbtn" title="보기">
                      <Icon name="chevron-right" size={16} />
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="ts-empty">
          <div className="ts-empty__icon">
            <Icon name="layers" size={30} />
          </div>
          <div className="ts-empty__title">아직 시리즈가 없습니다</div>
          <div className="ts-empty__desc">첫 시리즈를 만들고 회차 대회를 이어서 운영해 보세요.</div>
          <div style={{ marginTop: 18 }}>
            <Link href="/tournament-admin/series/new" className="ts-btn ts-btn--primary">
              시리즈 만들기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
