import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_STATUS_COLOR,
  TOURNAMENT_FORMAT_LABEL,
} from "@/lib/constants/tournament-status";
import { calculateSetupProgress } from "@/lib/tournaments/setup-status";
import { SetupChecklist } from "./_components/SetupChecklist";

// 2026-05-13 UI-1 (대시보드 체크리스트 hub):
//   기존 8 메뉴 카드 → 8 항목 체크리스트 + 진행도 바 + 공개 가드로 재구성.
//   기존 메뉴 중 보조 액션 (참가팀 / 관리자 / 기록원 / 공개 사이트 열기) 4개만 페이지 하단 유지.
//   API/DB 변경 0 — 기존 columns + relations 만 조회 (divisionRules + matches count 추가 include).
//
// 2026-05-12: 기록 모드 카드는 메인 대시보드에서 제거 → 경기/기록시스템 관리 페이지로 이동.

export const dynamic = "force-dynamic";

// D-Day 계산 (한국 시간 기준)
function getDDay(startDate: Date): string {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(startDate.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diff = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "진행중";
  if (diff === 0) return "D-Day";
  return `D-${diff}`;
}

export default async function TournamentAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 이유: 체크리스트 8 항목 판정에 필요한 relations 까지 한 번에 fetch (N+1 회피).
  //   - divisionRules.format / settings (3·4 항목)
  //   - tournamentSite.isPublished (6 항목)
  //   - _count.tournamentMatches (8 항목 — 대진표 생성 여부)
  //   - tournament.settings (7 항목 — default_recording_mode)
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { tournamentTeams: true, tournamentMatches: true } },
      tournamentSite: { select: { subdomain: true, isPublished: true } },
      divisionRules: { select: { format: true, settings: true } }, // ⭐ UI-1 신규
    },
  });

  if (!tournament) notFound();

  // 권한 — super_admin 통과 / 그 외 organizer 또는 active TAM
  // 2026-05-11 Phase 2-C — super_admin 우대 추가 (운영자 페이지 진입 차단 회귀 fix).
  if (session.role !== "super_admin") {
    const isOrganizer = tournament.organizerId === userId;
    if (!isOrganizer) {
      const member = await prisma.tournamentAdminMember.findFirst({
        where: { tournamentId: id, userId, isActive: true },
      });
      if (!member) notFound();
    }
  }

  const status = tournament.status ?? "draft";
  const site = tournament.tournamentSite[0];

  // 체크리스트 진행도 산출 — setup-status.ts 헬퍼 위임 (UI 책임 0)
  const progress = calculateSetupProgress(
    id,
    {
      name: tournament.name,
      startDate: tournament.startDate,
      venue_name: tournament.venue_name,
      series_id: tournament.series_id,
      maxTeams: tournament.maxTeams,
      entry_fee: tournament.entry_fee,
      auto_approve_teams: tournament.auto_approve_teams,
      settings: tournament.settings,
    },
    {
      divisionRules: tournament.divisionRules.map((r) => ({
        format: r.format,
        settings: r.settings,
      })),
      hasTournamentSite: !!site,
      isSitePublished: !!site?.isPublished,
      matchesCount: tournament._count.tournamentMatches,
    }
  );

  // 보조 액션 4개 — 체크리스트에 흡수되지 않는 운영성 진입점.
  //   참가팀 (정원 관리 vs 신청 정책 분리) / 관리자 / 기록원 / 공개 사이트 외부 링크.
  const secondaryActions = [
    {
      href: `/tournament-admin/tournaments/${id}/teams`,
      label: "참가팀 관리",
      icon: "groups",
      desc: `${tournament._count.tournamentTeams}팀 등록됨`,
    },
    {
      href: `/tournament-admin/tournaments/${id}/admins`,
      label: "관리자",
      icon: "admin_panel_settings",
      desc: "스태프 권한 관리",
    },
    {
      href: `/tournament-admin/tournaments/${id}/recorders`,
      label: "기록원",
      icon: "edit_note",
      desc: "스탯 기록원 지정",
    },
  ];

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                href="/tournament-admin/tournaments"
                className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                ← 대회 목록
              </Link>
            </div>
            <h1
              className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {tournament.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span
                className={TOURNAMENT_STATUS_COLOR[status] ?? "text-[var(--color-text-muted)]"}
              >
                ● {TOURNAMENT_STATUS_LABEL[status] ?? status}
              </span>
              {tournament.startDate && (
                <>
                  <span className="text-[var(--color-text-muted)]">
                    {tournament.startDate.toLocaleDateString("ko-KR")}
                    {tournament.endDate &&
                      ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
                  </span>
                  {/* D-Day 뱃지 = accent (빨강 본문 금지) */}
                  <span className="rounded-[10px] bg-[rgba(244,162,97,0.12)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                    {getDDay(tournament.startDate)}
                  </span>
                </>
              )}
              <span className="text-[var(--color-text-muted)]">
                {TOURNAMENT_FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "토너먼트"}
              </span>
            </div>
          </div>
          {site?.isPublished && <Badge>공개 중</Badge>}
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "참가팀", value: tournament._count.tournamentTeams },
          { label: "최대팀", value: tournament.maxTeams ?? 16 },
          { label: "경기 수", value: tournament._count.tournamentMatches },
          {
            label: "참가비",
            value: tournament.entry_fee
              ? `${Number(tournament.entry_fee).toLocaleString()}원`
              : "무료",
          },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            <p className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">
              {s.value}
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* ⭐ 셋업 체크리스트 (8 항목 + progress) — 기존 8 메뉴 카드 대체 */}
      {/* 2026-05-13 UI-5: 공개 게이트 props 추가 (tournamentId / isSitePublished / hasSite) */}
      <SetupChecklist
        progress={progress}
        tournamentId={id}
        isSitePublished={!!site?.isPublished}
        hasSite={!!site}
      />

      {/* 보조 액션 (참가팀 / 관리자 / 기록원 / 공개 사이트) */}
      <section className="mt-2">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
          빠른 액션
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {secondaryActions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="block text-[var(--color-text-primary)]"
            >
              <Card className="cursor-pointer transition-colors hover:bg-[var(--color-elevated)]">
                <div className="mb-2 text-[var(--color-text-muted)]">
                  <span className="material-symbols-outlined">{a.icon}</span>
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {a.label}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.desc}</p>
              </Card>
            </Link>
          ))}
          {/* 공개 사이트 보기 — site 박제 + 공개 시만 노출 */}
          {site?.isPublished && site.subdomain && (
            <a
              href={`https://${site.subdomain}.mybdr.kr`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[var(--color-text-primary)]"
            >
              <Card className="cursor-pointer transition-colors hover:bg-[var(--color-elevated)]">
                <div className="mb-2 text-[var(--color-text-muted)]">
                  <span className="material-symbols-outlined">open_in_new</span>
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  공개 사이트 보기
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {site.subdomain}.mybdr.kr
                </p>
              </Card>
            </a>
          )}
        </div>
      </section>
    </div>
  );
}
