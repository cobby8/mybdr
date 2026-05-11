/**
 * 2026-05-11 Phase 1 — 강남구협회장배 유소년 일괄 등록 (운영자 어드민 페이지).
 *
 * 진입: /admin/tournaments/[id]/teams
 * 권한: super_admin / tournament.organizerId / tournamentAdminMember (canManageTournament 헬퍼)
 * 디자인 등급: E (admin 자체 셸) — 사용자 영역 13 룰 중 디자인 토큰만 일치, AppNav 적용 X.
 *
 * 동작:
 *   - 서버 컴포넌트에서 권한 검증 + 초기 데이터 SELECT (API 우회 — Next.js 서버 컴포넌트 표준 패턴)
 *   - 토큰 URL 생성은 클라이언트가 window.location.origin 으로 직접 구성 (배포 환경별 일관성)
 *   - 팀 추가 / 토큰 복사 등 인터랙션은 teams-client.tsx 클라이언트 컴포넌트
 */

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { canManageTournament } from "@/lib/auth/tournament-permission";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { TeamApplicationsClient } from "./teams-client";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined>;

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function AdminTournamentTeamsPage({ params }: PageProps) {
  const { id: tournamentId } = await params;

  // 1) 세션 검증 — 미로그인은 /login 으로
  const session = await getWebSession();
  if (!session) redirect("/login");
  const userId = BigInt(session.sub);

  // 2) 대회 존재 + 권한 동시 검증
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, name: true, startDate: true },
  });
  if (!tournament) notFound();

  const allowed = await canManageTournament(tournamentId, userId, session);
  if (!allowed) {
    // 권한 없음 → 대회 정보 노출 회피하기 위해 notFound 와 동일 톤 (404)
    notFound();
  }

  // 3) 초기 팀 목록 SELECT — API GET 과 동일 query (서버 컴포넌트 직접 호출)
  const teams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      manager_name: true,
      manager_phone: true,
      status: true,
      applied_via: true,
      apply_token: true,
      apply_token_expires_at: true,
      team: { select: { name: true } },
      _count: { select: { players: true } },
    },
  });

  // 클라 컴포넌트로 전달할 plain object 직렬화 (BigInt/Date → string)
  const now = new Date();
  const initialTeams = teams.map((tt) => {
    const tokenAlive =
      tt.apply_token &&
      tt.apply_token_expires_at &&
      tt.apply_token_expires_at > now;
    return {
      id: tt.id.toString(),
      teamName: tt.team?.name ?? "(이름 없음)",
      managerName: tt.manager_name,
      managerPhone: tt.manager_phone,
      status: tt.status ?? "pending",
      appliedVia: tt.applied_via,
      applyToken: tokenAlive ? tt.apply_token : null,
      applyTokenExpiresAt: tt.apply_token_expires_at?.toISOString() ?? null,
      playerCount: tt._count.players,
    };
  });

  return (
    <div>
      <AdminPageHeader
        title="팀 신청서 관리"
        subtitle={`${tournament.name} · 총 ${initialTeams.length}팀`}
      />
      <TeamApplicationsClient
        tournamentId={tournamentId}
        tournamentName={tournament.name}
        initialTeams={initialTeams}
      />
    </div>
  );
}
