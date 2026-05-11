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
// 2026-05-12: 기록 모드 카드는 메인 대시보드에서 제거 → 경기/기록시스템 관리 페이지로 이동.
//   사용자 지적: 대회 정보 메인에 기록 모드 설정이 큰 카드로 떠 있는 건 어색.
//   변경: /tournament-admin/tournaments/[id]/matches 페이지 상단에 통합.

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

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { tournamentTeams: true, tournamentMatches: true } },
      tournamentSite: { select: { subdomain: true, isPublished: true } },
    },
  });

  if (!tournament) notFound();

  // 2026-05-12: 기록 모드 카드는 메인 대시보드에서 제거됨 (사용자 지적).
  //   /matches 페이지 (경기/기록시스템 관리) 로 이동.

  // 권한 — super_admin 은 모든 대회 통과 / 그 외에는 organizer 또는 active TAM
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

  const actions = [
    {
      href: `/tournament-admin/tournaments/${id}/wizard`,
      label: "대회 설정",
      icon: "SET",
      desc: "기본 정보, 규칙, 일정 수정",
    },
    {
      href: `/tournament-admin/tournaments/${id}/teams`,
      label: "참가팀 관리",
      icon: "TM",
      desc: `${tournament._count.tournamentTeams}팀 등록됨`,
    },
    {
      href: `/tournament-admin/tournaments/${id}/bracket`,
      label: "대진표 생성",
      icon: "BR",
      desc: "자동 생성 · 팀 배치 편집 · 버전 관리",
    },
    {
      href: `/tournament-admin/tournaments/${id}/matches`,
      label: "경기/기록시스템 관리",
      icon: "MT",
      desc: `${tournament._count.tournamentMatches}경기 · 스코어 입력`,
    },
    {
      href: `/tournament-admin/tournaments/${id}/site`,
      label: "사이트 관리",
      icon: "WEB",
      desc: tournament.tournamentSite[0]
        ? `${tournament.tournamentSite[0].subdomain}.mybdr.kr`
        : "사이트 미설정",
    },
    {
      href: `/tournament-admin/tournaments/${id}/admins`,
      label: "관리자",
      icon: "ADM",
      desc: "스태프 권한 관리",
    },
    {
      href: `/tournament-admin/tournaments/${id}/recorders`,
      label: "기록원",
      icon: "REC",
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
              <Link href="/tournament-admin/tournaments" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                ← 대회 목록
              </Link>
            </div>
            <h1 className="text-2xl font-extrabold uppercase tracking-wide sm:text-3xl" style={{ fontFamily: "var(--font-heading)" }}>{tournament.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
              <span className={TOURNAMENT_STATUS_COLOR[status] ?? "text-[var(--color-text-muted)]"}>
                ● {TOURNAMENT_STATUS_LABEL[status] ?? status}
              </span>
              {tournament.startDate && (
                <>
                  <span className="text-[var(--color-text-muted)]">
                    {tournament.startDate.toLocaleDateString("ko-KR")}
                    {tournament.endDate && ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}`}
                  </span>
                  {/* D-Day 뱃지 = 강조 정보 (accent) — 빨강 본문 금지 */}
                  <span className="rounded-[10px] bg-[rgba(244,162,97,0.12)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)]">
                    {getDDay(tournament.startDate)}
                  </span>
                </>
              )}
              <span className="text-[var(--color-text-muted)]">{TOURNAMENT_FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "싱글 엘리미네이션"}</span>
            </div>
          </div>
          {tournament.tournamentSite[0]?.isPublished && (
            <Badge>공개 중</Badge>
          )}
        </div>
      </div>

      {/* 빠른 통계 */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "참가팀", value: tournament._count.tournamentTeams },
          { label: "최대팀", value: tournament.maxTeams ?? 16 },
          { label: "경기 수", value: tournament._count.tournamentMatches },
          { label: "참가비", value: tournament.entry_fee ? `${Number(tournament.entry_fee).toLocaleString()}원` : "무료" },
        ].map((s) => (
          <Card key={s.label} className="text-center py-4">
            {/* 2026-05-12 — 통계 빨강 4 카드 = 시각 노이즈 과다 (사용자 보고) → text-primary 톤다운 */}
            <p className="text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">{s.value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* 2026-05-12 — 기록 모드 카드는 /matches 페이지로 이동 (사용자 지적: 메인에 큰 카드 어색) */}

      {/* 액션 카드 */}
      {/* 2026-05-12 — 메뉴 라벨 빨강 7개 (SET/TM/BR/MT/WEB/ADM/REC) = 시각 노이즈 과다 (사용자 보고)
          → text-muted 톤다운 + Link>Card cascade 차단 (link color 빨강 inherit 방지) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((a) => (
          <Link key={a.href} href={a.href} className="block text-[var(--color-text-primary)]">
            <Card className="cursor-pointer transition-colors hover:bg-[var(--color-elevated)]">
              <div className="mb-2 text-sm font-bold text-[var(--color-text-muted)]">{a.icon}</div>
              <h3 className="font-semibold text-[var(--color-text-primary)]">{a.label}</h3>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{a.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
