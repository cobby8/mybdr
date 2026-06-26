import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/admin-toss";
import { CopyLinkButton } from "./_components/copy-link-button";
import { DeleteSeriesButton } from "./_components/delete-series-button";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

export const dynamic = "force-dynamic";

const STATUS_INFO: Record<string, { label: string; tone: "ok" | "mute" | "warn" | "danger" | "primary" }> = {
  draft: { label: "준비중", tone: "mute" },
  registration_open: { label: "모집중", tone: "ok" },
  registration_closed: { label: "접수마감", tone: "warn" },
  ongoing: { label: "진행중", tone: "primary" },
  completed: { label: "완료", tone: "mute" },
  cancelled: { label: "취소", tone: "danger" },
};

function formatDate(value: Date | null) {
  if (!value) return "날짜 미정";
  return value.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
}

export default async function SeriesDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  let seriesIdBig: bigint;
  try {
    seriesIdBig = BigInt(id);
  } catch {
    notFound();
  }

  const series = await prisma.tournament_series.findUnique({
    where: { id: seriesIdBig },
    include: {
      tournaments: {
        orderBy: { edition_number: "asc" },
        select: {
          id: true,
          name: true,
          edition_number: true,
          startDate: true,
          status: true,
          venue_name: true,
          city: true,
          maxTeams: true,
          teams_count: true,
        },
      },
    },
  }).catch(() => null);

  if (!series) notFound();

  const sessionUserId = (() => {
    try {
      return BigInt(session.sub);
    } catch {
      return null;
    }
  })();

  if (sessionUserId === null) redirect("/tournament-admin/series");

  const isSuper = isSuperAdmin(session);
  const isOrganizer = series.organizer_id === sessionUserId;

  let isOrgEditor = false;
  if (!isSuper && !isOrganizer && series.organization_id !== null) {
    const member = await prisma.organization_members.findFirst({
      where: {
        organization_id: series.organization_id,
        user_id: sessionUserId,
        is_active: true,
        role: { in: ["owner", "admin"] },
      },
      select: { id: true },
    });
    isOrgEditor = !!member;
  }

  const canView = isSuper || isOrganizer || isOrgEditor;
  if (!canView) redirect("/tournament-admin/series");

  const canEdit = canView;
  const canDelete = isSuper;
  const totalTeams = series.tournaments.reduce((sum, tournament) => sum + (tournament.teams_count ?? 0), 0);
  const nextEdition = (series.tournaments_count ?? 0) + 1;

  return (
    <div data-skin="toss" className="space-y-6 pb-28">
      <div className="ts-ph">
        <Link href="/tournament-admin/series" className="ad-backlink">
          <Icon name="chevron-left" size={15} />
          시리즈 목록
        </Link>
        <div className="ts-ph__row">
          <div style={{ minWidth: 0 }}>
            <div className="ts-ph__eyebrow">
              <Icon name="layers" size={15} />
              시리즈 운영
            </div>
            <div className="ts-ph__title">{series.name}</div>
            {series.description && <div className="ts-ph__sub">{series.description}</div>}
          </div>
          <div className="ts-ph__actions">
            {canEdit && (
              <Link href={`/tournament-admin/series/${id}/edit`} className="ts-btn ts-btn--secondary ts-btn--sm">
                <Icon name="pencil" size={15} />
                수정
              </Link>
            )}
            <CopyLinkButton slug={series.slug} />
            {canDelete && (
              <DeleteSeriesButton
                seriesId={id}
                seriesName={series.name}
                tournamentsCount={series.tournaments_count ?? 0}
              />
            )}
          </div>
        </div>
      </div>

      <div className="ad-kpi-grid">
        <div className="ad-kpi">
          <div className="ad-kpi__top">
            <span className="ad-kpi__icon" data-tone="primary">
              <Icon name="calendar-days" size={20} />
            </span>
          </div>
          <div className="ad-kpi__val">{series.tournaments_count ?? 0}</div>
          <div className="ad-kpi__label">총 회차</div>
        </div>
        <div className="ad-kpi">
          <div className="ad-kpi__top">
            <span className="ad-kpi__icon" data-tone="ok">
              <Icon name="users" size={20} />
            </span>
          </div>
          <div className="ad-kpi__val">{totalTeams}</div>
          <div className="ad-kpi__label">누적 참가팀</div>
        </div>
        <div className="ad-kpi">
          <div className="ad-kpi__top">
            <span className="ad-kpi__icon" data-tone="warn">
              <Icon name="plus-circle" size={20} />
            </span>
          </div>
          <div className="ad-kpi__val">{nextEdition}회</div>
          <div className="ad-kpi__label">다음 회차</div>
        </div>
      </div>

      <section className="ad-section">
        <div className="ad-panel__head">
          <div className="ad-panel__title">회차 목록</div>
          <Link href={`/tournament-admin/series/${id}/add-edition`} className="ts-btn ts-btn--secondary ts-btn--sm">
            <Icon name="plus" size={15} />
            회차 추가
          </Link>
        </div>

        {series.tournaments.length > 0 ? (
          <div className="ad-tablescroll">
            <div className="ts-table ad-table">
              <div
                className="ts-thead"
                style={{ gridTemplateColumns: "80px minmax(220px,1.4fr) 130px 160px 110px 64px" }}
              >
                <span>회차</span>
                <span>대회</span>
                <span>일정</span>
                <span>장소</span>
                <span>상태</span>
                <span />
              </div>
              {series.tournaments.map((tournament) => {
                const info = STATUS_INFO[tournament.status ?? "draft"] ?? {
                  label: tournament.status ?? "준비중",
                  tone: "mute" as const,
                };
                const location = [tournament.city, tournament.venue_name].filter(Boolean).join(" ");
                return (
                  <Link
                    key={tournament.id}
                    href={`/tournament-admin/tournaments/${tournament.id}`}
                    className="ts-trow"
                    style={{ gridTemplateColumns: "80px minmax(220px,1.4fr) 130px 160px 110px 64px" }}
                  >
                    <span className="ad-cell-mono">{tournament.edition_number}회</span>
                    <span>
                      <span className="ad-cell-strong">{tournament.name}</span>
                      <span className="ad-cell-sub">
                        {tournament.teams_count ?? 0}/{tournament.maxTeams ?? "?"}팀
                      </span>
                    </span>
                    <span className="ad-cell-mono">{formatDate(tournament.startDate)}</span>
                    <span className="ad-cell-muted">{location || "장소 미정"}</span>
                    <span className="ad-statusline">
                      <span className="ad-dot" data-tone={info.tone === "primary" ? "ok" : info.tone} />
                      {info.label}
                    </span>
                    <span className="ad-rowact">
                      <span className="ad-iconbtn" title="운영">
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
              <Icon name="calendar-plus" size={30} />
            </div>
            <div className="ts-empty__title">아직 회차가 없습니다</div>
            <div className="ts-empty__desc">첫 회차를 추가하면 이 시리즈에서 바로 운영할 수 있습니다.</div>
            <div style={{ marginTop: 18 }}>
              <Link href={`/tournament-admin/series/${id}/add-edition`} className="ts-btn ts-btn--primary">
                첫 회차 추가하기
              </Link>
            </div>
          </div>
        )}
      </section>

      {series.tournaments.length > 0 && (
        <div className="fixed bottom-20 right-4 lg:bottom-8">
          <Link href={`/tournament-admin/series/${id}/add-edition`} className="ts-btn ts-btn--primary shadow-lg">
            <Icon name="plus" size={17} />
            {nextEdition}회 추가
          </Link>
        </div>
      )}
    </div>
  );
}
