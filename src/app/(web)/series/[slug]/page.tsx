import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, type BreadcrumbItem } from "@/components/shared/breadcrumb";
import { SeriesDetailTabs } from "./series-detail-tabs";

// 왜 revalidate 30: 회차 모집 상태 변경이 잦아 30초 ISR
export const revalidate = 30;

// 왜 cache 키 보존: 시리즈별 캐시 분리 + 30초 revalidate (기존 유지)
function getSeriesData(slug: string) {
  return unstable_cache(
    async () => {
      const series = await prisma.tournament_series
        .findUnique({
          where: { slug },
          include: {
            organization: { select: { name: true, slug: true } },
            tournaments: {
              orderBy: { edition_number: "desc" },
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
                is_public: true,
              },
            },
          },
        })
        .catch(() => null);
      return series;
    },
    [`series-hub-${slug}`],
    { revalidate: 30 }
  )();
}

export default async function SeriesHubPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // 왜 await params: Next.js 15 — params는 Promise (기존 보존)
  const { slug } = await params;
  const series = await getSeriesData(slug);

  if (!series) notFound();

  // 왜 is_public 가드: 비공개 회차 제외 (기존 보존)
  const publicEditions = series.tournaments.filter((t) => t.is_public !== false);
  const totalTeams = publicEditions.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);
  const latestActive = publicEditions.find(
    (t) => t.status === "registration_open" || t.status === "ongoing"
  );

  // L3 브레드크럼: 홈 / [단체명 또는 시리즈] / {시리즈명} (기존 로직 보존)
  const breadcrumbItems: BreadcrumbItem[] = [{ label: "홈", href: "/" }];
  if (series.organization) {
    breadcrumbItems.push({
      label: series.organization.name,
      href: `/organizations/${series.organization.slug}`,
    });
  } else {
    breadcrumbItems.push({ label: "시리즈", href: "/series" });
  }
  breadcrumbItems.push({ label: series.name });

  // 왜 founded year 추출: 시안 hero의 "설립 YYYY" 표시. created_at 기반 폴백
  const foundedYear =
    series.created_at instanceof Date
      ? series.created_at.getFullYear()
      : new Date().getFullYear();

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      {/* L3 브레드크럼 — PC에서만 (breadcrumb.tsx 내부 hidden lg:block 보존) */}
      <div className="mb-3">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      {/* hero — 시안 박제. 그라디언트는 var(--color-accent) 기반 */}
      <div
        className="relative mb-6 overflow-hidden rounded-[16px] px-9 py-10 text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, transparent) 50%, #0B0D10)",
        }}
      >
        {/* 시안의 사선 패턴 오버레이 */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            background:
              "repeating-linear-gradient(135deg, #fff 0 2px, transparent 2px 18px)",
          }}
        />
        <div className="relative">
          <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-85">
            SERIES{series.organization ? ` · ${series.organization.name}` : ""}
          </div>
          <h1
            className="m-0 mb-1.5 text-[44px] font-black leading-tight tracking-tight sm:text-[56px]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {series.name}
          </h1>
          {series.description && (
            <div className="mb-4 text-[15px] opacity-90 sm:text-[17px]">
              {series.description}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] opacity-90">
            <span>
              <b style={{ fontFamily: "var(--font-heading)" }}>
                {series.tournaments_count ?? 0}
              </b>
              회 진행
            </span>
            <span>·</span>
            <span>3v3 토너먼트</span>
            <span>·</span>
            <span>설립 {foundedYear}</span>
          </div>
        </div>
      </div>

      {/* 본문 grid: 좌측 탭 + 우측 sticky aside */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* 4탭 영역 — client component로 위임 */}
        <SeriesDetailTabs
          editions={publicEditions.map((t) => ({
            id: t.id,
            name: t.name,
            edition_number: t.edition_number,
            startDate:
              t.startDate instanceof Date ? t.startDate.toISOString() : null,
            status: t.status,
            venue_name: t.venue_name,
            city: t.city,
            maxTeams: t.maxTeams,
            teams_count: t.teams_count,
          }))}
          stats={{
            totalEditions: series.tournaments_count ?? publicEditions.length,
            totalTeams,
            latestActiveLabel: latestActive
              ? `${latestActive.edition_number}회`
              : null,
          }}
          about={{
            seriesName: series.name,
            description: series.description ?? null,
            host: series.organization?.name ?? null,
            foundedYear,
          }}
        />

        {/* 우측 sticky aside — 시안: 다음 회차 + 알림 */}
        <aside className="space-y-3.5 lg:sticky lg:top-[120px] lg:self-start">
          {latestActive ? (
            <Link href={`/tournaments/${latestActive.id}`}>
              <div className="cursor-pointer rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5 transition-colors hover:bg-[var(--color-surface-bright)]">
                <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                  다음 회차
                </div>
                <div
                  className="mb-1 text-[20px] font-black"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {latestActive.name}
                </div>
                <div className="mb-3.5 text-[13px] text-[var(--color-text-muted)]">
                  {latestActive.startDate
                    ? new Date(latestActive.startDate).toLocaleDateString(
                        "ko-KR",
                        { timeZone: "Asia/Seoul" }
                      )
                    : "날짜 미정"}
                  {latestActive.venue_name && ` — ${latestActive.venue_name}`}
                </div>
                <div className="rounded bg-[var(--color-accent)] px-4 py-2.5 text-center text-sm font-bold text-[var(--color-on-accent)]">
                  참가 신청
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5">
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                다음 회차
              </div>
              <div className="text-[14px] text-[var(--color-text-muted)]">
                현재 모집 중인 회차가 없습니다.
              </div>
            </div>
          )}

          {/* 알림 받기 — UI만 (DB/API 없음, 시안 박제) */}
          <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-5">
            <div className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
              알림 받기
            </div>
            <div className="mb-3 text-[13px] text-[var(--color-text-muted)]">
              새 회차가 열리면 알려드릴게요
            </div>
            <button
              type="button"
              className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface-bright)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]"
              disabled
              title="시리즈 팔로우 기능은 추후 제공 예정입니다"
            >
              ★ 시리즈 팔로우
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
