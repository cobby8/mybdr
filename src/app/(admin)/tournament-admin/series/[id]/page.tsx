import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect, notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { CopyLinkButton } from "./_components/copy-link-button";
import { DeleteSeriesButton } from "./_components/delete-series-button";
import { isSuperAdmin } from "@/lib/auth/is-super-admin";

export const dynamic = "force-dynamic";

const STATUS_INFO: Record<string, { label: string; variant: "success" | "default" | "error" | "warning" | "info" }> = {
  draft:               { label: "준비중",   variant: "default" },
  registration_open:   { label: "모집중",   variant: "success" },
  registration_closed: { label: "접수마감", variant: "warning" },
  ongoing:             { label: "진행중",   variant: "info" },
  completed:           { label: "완료",    variant: "default" },
  cancelled:           { label: "취소",    variant: "error" },
};

export default async function SeriesDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 핫픽스 B: 진입 로그 — Vercel runtime logs 에 `[series-detail]` prefix 로 캡처
  // 이유: error.tsx 발동 시 진짜 원인 파악용. id 값만 박제 (민감 데이터 X)
  console.log("[series-detail] entry", { id });

  const session = await getWebSession();
  if (!session) redirect("/login");

  // 세션 진단 로그 — sub / role 만 박제 (이메일/이름 등 민감 데이터 제외)
  // 이유: BigInt(session.sub) 변환 가능 여부 확인 — 비숫자 sub 가 진짜 원인 후보
  console.log("[series-detail] session", {
    hasSession: !!session,
    sub: session.sub,
    role: session.role,
  });

  // 핫픽스 C: id BigInt 변환 안전화 — 잘못된 path 파라미터 (예: "abc") 면 notFound
  // 이유: BigInt("abc") 는 SyntaxError throw → error.tsx 발동. notFound() 로 정상 404 처리.
  let seriesIdBig: bigint;
  try {
    seriesIdBig = BigInt(id);
  } catch (err) {
    console.log("[series-detail] invalid-id", { id, err: err instanceof Error ? err.message : String(err) });
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
  }).catch((err) => {
    // prisma 조회 실패 — 진단용 로그 (재발 시 원인 파악)
    console.error("[series-detail] prisma-error", { id, err: err instanceof Error ? err.message : String(err) });
    return null;
  });

  if (!series) notFound();

  // 핫픽스 C: session.sub BigInt 변환 안전화
  // 이유: session.sub 가 비숫자 string (잘못된 JWT / 옛 쿠키 잔존) 이면 BigInt() throw → error.tsx 발동.
  //       안전 변환 후 null 이면 권한 없음으로 간주하여 redirect (진짜 원인 후보 1순위)
  const sessionUserId = (() => {
    try {
      return BigInt(session.sub);
    } catch (err) {
      console.error("[series-detail] invalid-session-sub", {
        sub: session.sub,
        err: err instanceof Error ? err.message : String(err),
      });
      return null;
    }
  })();

  if (sessionUserId === null) redirect("/tournament-admin/series");

  // Phase C — 편집/삭제 권한 분기:
  //   기존 = organizer 본인만 진입 (단순)
  //   신규 = organizer + 단체 owner/admin + super_admin (Q2 결재 — 운영 셀프서비스)
  //   super_admin 우선 검증 → 일반 유저는 organizer 또는 단체 owner/admin 검증
  const isSuper = isSuperAdmin(session);
  const isOrganizer = series.organizer_id === sessionUserId;

  // 단체 owner/admin 검증 — 단체 소속 시리즈인 경우만 SELECT
  let isOrgEditor = false;
  if (!isSuper && !isOrganizer && series.organization_id !== null) {
    const m = await prisma.organization_members.findFirst({
      where: {
        organization_id: series.organization_id,
        user_id: sessionUserId,
        is_active: true,
        role: { in: ["owner", "admin"] },
      },
      select: { id: true },
    });
    isOrgEditor = !!m;
  }

  const canView = isSuper || isOrganizer || isOrgEditor;
  if (!canView) redirect("/tournament-admin/series");

  // 편집 가능 여부 — 페이지 진입 가능 = 편집 가능 (canView 와 동일)
  const canEdit = canView;
  // 삭제 가능 여부 — super_admin only (본 PR Hard DELETE 만 구현)
  const canDelete = isSuper;

  const totalTeams = series.tournaments.reduce((sum, t) => sum + (t.teams_count ?? 0), 0);
  const nextEdition = (series.tournaments_count ?? 0) + 1;

  return (
    <div className="pb-28">
      {/* 헤더 */}
      <div className="mb-2 flex items-start justify-between gap-4">
        <div>
          <Link href="/tournament-admin/series" className="mb-2 inline-block text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-muted)]">
            ← 시리즈 목록
          </Link>
          <h1 className="text-xl font-bold sm:text-2xl">{series.name}</h1>
          {series.description && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{series.description}</p>
          )}
        </div>
        {/* 액션 버튼 그룹 — 권한별 편집/삭제 노출.
            모바일 44px+ 터치 가드 (디자인 룰 §13). var(--color-*) 토큰만 사용. */}
        <div className="flex flex-shrink-0 items-center gap-2">
          {canEdit && (
            <Link
              href={`/tournament-admin/series/${id}/edit`}
              className="btn btn--sm inline-flex items-center gap-1"
              aria-label="시리즈 편집"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              <span className="hidden sm:inline">편집</span>
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

      {/* 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">{series.tournaments_count ?? 0}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">총 회차</p>
        </div>
        <div className="rounded-[16px] bg-[var(--color-elevated)] p-4 text-center">
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">{totalTeams}</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">누적 참가팀</p>
        </div>
        <div className="hidden rounded-[16px] bg-[var(--color-elevated)] p-4 text-center sm:block">
          {/* 옆 두 통계 (총 회차 / 누적 참가팀) 와 동일하게 accent 통일 */}
          <p className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">{nextEdition}회</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">다음 회차</p>
        </div>
      </div>

      {/* 회차 목록 */}
      <h2 className="mb-3 text-base font-semibold">회차 목록</h2>

      {series.tournaments.length > 0 ? (
        <div className="space-y-3">
          {series.tournaments.map((t) => {
            const info = STATUS_INFO[t.status ?? "draft"] ?? { label: t.status, variant: "default" as const };
            const location = [t.city, t.venue_name].filter(Boolean).join(" ");
            // 2026-05-12 — Link>Card cascade + 회차 번호 원형 빨강 → info(Navy) 톤다운
            return (
              <Link key={t.id} href={`/tournament-admin/tournaments/${t.id}`} className="block text-[var(--color-text-primary)]">
                <Card className="flex items-center justify-between hover:bg-[var(--color-elevated)] transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-info)] text-sm font-bold text-white">
                      {t.edition_number}
                    </span>
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{t.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {t.startDate
                          ? new Date(t.startDate).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
                          : "날짜 미정"}
                        {location && ` · ${location}`}
                        {` · ${t.teams_count ?? 0}/${t.maxTeams ?? "?"}팀`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={info.variant}>{info.label}</Badge>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <div className="mb-3 text-3xl">🏆</div>
          <p className="mb-4 text-sm">아직 회차가 없습니다.</p>
          {/* 2026-05-12 — pill 9999px ❌ + admin 빨강 본문 금지 룰 (CLAUDE.md §디자인 13 룰 §10/§11):
              `rounded-full bg-[var(--color-accent)]` (빨강 pill) → `btn btn--primary` 표준 클래스.
              .btn--primary = 라이트 navy / 다크 BDR Red 자동 분기. text 흰색 명시 (:visited 보라 회피). */}
          <Link
            href={`/tournament-admin/series/${id}/add-edition`}
            className="btn btn--primary"
          >
            첫 번째 회차 추가하기
          </Link>
        </Card>
      )}

      {/* 모바일 하단 고정 버튼 */}
      {series.tournaments.length > 0 && (
        <div className="fixed bottom-20 right-4 lg:bottom-8">
          {/* 모바일 하단 고정 FAB — pill 9999px ❌. shadow 보존, btn--primary 클래스 + 4px 라운딩 */}
          <Link
            href={`/tournament-admin/series/${id}/add-edition`}
            className="btn btn--primary shadow-lg"
          >
            <span className="text-lg">+</span>
            {nextEdition}회 추가
          </Link>
        </div>
      )}
    </div>
  );
}
