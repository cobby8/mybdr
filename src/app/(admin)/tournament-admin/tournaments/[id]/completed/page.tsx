import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
import { AdminCompletedHero } from "./admin-completed-hero";
import {
  AdminCompletedCardGrid,
  type CompletedCard,
} from "./admin-completed-card-grid";

// ============================================================
// PR-1C-13 PA7 AdminTournamentCompleted (D1 · 종료 후 hub — 신규 라우트)
//   /tournament-admin/tournaments/[id]/completed
//
// 시안: BDR-current/screens/AdminTournamentCompleted.jsx (5 카드 hub + 🏆 hero)
// ★ UB1 (사용자 측 종료 = /tournaments/[id] status 분기) 과 완전히 다른 페이지.
//   본 페이지 = 관리자 측 종료 후 작업 hub (결과/통계/알기자/사진영상/사이트).
//
// 데이터: setup hub ([id]/page.tsx) 권한 가드 패턴 답습 + champion/mvp relation
//   1줄 include 만 추가 (새 fetch / 새 query 0). status≠completed 면 setup hub redirect.
//
// 5 카드 매핑 (가짜링크 ❌ — 운영 실재 라우트만 활성):
//   1 결과   = [id]/playoffs (실재)
//   2 통계   = [id]/matches (매치 목록 — 전용 통계 라우트 부재 → 매치로 대체)
//   3 알기자 = /admin/news (super_admin 만 실재 → 그 외 disabled)
//   4 사진영상 = 전용 라우트 부재 → disabled "준비 중"
//   5 사이트 = [id]/site (실재)
// ============================================================

export const dynamic = "force-dynamic";

// 종료 상태 판정 — status 가 종료군이면 hub 표시 (그 외 setup hub redirect)
const COMPLETED_STATUSES = new Set(["completed", "ended", "closed"]);

export default async function TournamentCompletedHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getWebSession();
  if (!session) redirect("/login");

  const userId = BigInt(session.sub);

  // 이유: setup hub 와 동일한 findUnique + champion(teams) / mvp relation 만 추가.
  //   새 query 0 — 우승팀명 / MVP명 은 relation 으로 한 번에 가져옴.
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      tournamentSite: { select: { subdomain: true, isPublished: true } },
      // 우승팀 (champion_team_id relation) — UB1 과 동일 데이터
      teams: { select: { name: true } },
      // MVP (mvp_player_id relation) — name 우선, 없으면 nickname
      users_tournaments_mvp_player_idTousers: {
        select: { name: true, nickname: true },
      },
    },
  });

  if (!tournament) notFound();

  // 권한 — setup hub 와 동일 (super_admin 통과 / 그 외 organizer 또는 active TAM)
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

  // 미종료 대회 = 종료 후 hub 진입 불가 → setup hub 로 redirect (시안 헤더 명시)
  if (!COMPLETED_STATUSES.has(status)) {
    redirect(`/tournament-admin/tournaments/${id}`);
  }

  const isSuperAdmin = session.role === "super_admin";
  const site = tournament.tournamentSite[0];

  // 우승팀 / MVP — relation null 시 hero 가 fallback 처리
  const championName = tournament.teams?.name ?? null;
  const mvp = tournament.users_tournaments_mvp_player_idTousers;
  const mvpName = mvp?.name ?? mvp?.nickname ?? null;

  // 회차 라벨 — edition_number 있으면 "Vol.N"
  const edition = tournament.edition_number
    ? `Vol.${tournament.edition_number}`
    : null;

  // ── 5 카드 — 운영 실재 라우트만 href (없으면 disabled "준비 중") ──
  const base = `/tournament-admin/tournaments/${id}`;
  const championDone = !!championName; // 우승팀 확정 = 결과 박제 완료

  const cards: CompletedCard[] = [
    // 1. 결과 박제 — playoffs (순위전·결승·결과 hub) 실재
    {
      num: "1",
      title: "결과 박제",
      // Material emoji_events → lucide trophy
      icon: "trophy",
      desc: "우승팀 · 준우승 · 베스트5 · MVP. 순위전/결승 결과를 확정하고 보정해요.",
      state: championDone ? "done" : "idle",
      stateLabel: championDone ? "우승팀 확정됨" : "확정 필요",
      href: `${base}/playoffs`,
      cta: championDone ? "결과 수정" : "결과 확정하기",
    },
    // 2. 매치 결과 — 전용 통계 라우트 부재 → 매치 목록으로 대체 (mock 통계 수치 hide)
    {
      num: "2",
      title: "매치 결과",
      // Material scoreboard → lucide layout-dashboard
      icon: "layout-dashboard",
      desc: "전체 매치 일정과 스코어를 확인해요. (대시보드 통계 차트는 준비 중)",
      state: "auto",
      stateLabel: "매치 기록",
      href: `${base}/matches`,
      cta: "매치 보기",
    },
    // 3. 알기자 발행 — /admin/news (super_admin 만 실재) → 그 외 disabled
    {
      num: "3",
      title: "알기자 발행",
      // Material newspaper → lucide newspaper
      icon: "newspaper",
      desc: "결과 기반 종료 알기자를 작성/검수 후 발행해요.",
      state: "idle",
      stateLabel: isSuperAdmin ? "작성 가능" : "권한 필요",
      href: isSuperAdmin ? "/admin/news" : undefined, // super_admin 외 = disabled
      cta: "알기자 관리",
    },
    // 4. 사진·영상 — 전용 운영 라우트 부재 → disabled "준비 중" (mock 6장/0영상 hide)
    {
      num: "4",
      title: "사진 · 영상",
      // Material photo_library → lucide images
      icon: "images",
      desc: "경기 사진 업로드 + LIVE 영상 매핑. 종료 사이트에 노출돼요.",
      state: "idle",
      stateLabel: "준비 중",
      href: undefined, // 운영 라우트 부재 → 가짜링크 대신 disabled
      cta: "사진 추가",
    },
    // 5. 사이트 archive — [id]/site 실재 (관리) + 공개 시 외부 사이트 링크
    {
      num: "5",
      title: "사이트 archive",
      // Material public → lucide globe
      icon: "globe",
      desc: "공개 사이트 종료 상태 박제 — 우승팀 hero / 다음 회차 예고.",
      state: site?.isPublished ? "done" : "idle",
      stateLabel: site?.isPublished ? "공개됨" : "비공개",
      href: `${base}/site`,
      cta: "사이트 관리",
      metrics: site?.isPublished
        ? [{ v: "공개", l: "상태" }]
        : undefined, // 조회수 등 mock 수치 hide
    },
  ];

  // 진행도 footer — 진짜 판정만 (결과 확정 + 사이트 공개). mock 2/5 ❌
  const doneCount = [championDone, !!site?.isPublished].filter(Boolean).length;

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss">
      {/* 헤더 — setup hub 와 동일 AdminPageHeader 패턴 (breadcrumbs label only) */}
      <AdminPageHeader
        eyebrow="ADMIN · 종료 후 hub"
        title={`종료 후 정리 · ${tournament.name}`}
        subtitle="종료 직후 처리해야 할 항목을 한 곳에서. 모두 완료하면 다음 회차 준비를 시작할 수 있어요."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 운영자 도구" },
          { label: "내 대회" },
          { label: tournament.name },
          { label: "종료 후 hub" },
        ]}
        actions={
          <Link href={base} className="btn btn--sm">
            {/* Material arrow_back → lucide arrow-left */}
            <Icon name="arrow-left" size={16} />
            대회 관리
          </Link>
        }
      />

      {/* 🏆 우승팀 hero — champion null 시 fallback */}
      <AdminCompletedHero
        tournamentName={tournament.name}
        edition={edition}
        championName={championName}
        mvpName={mvpName}
        endedAt={tournament.endDate}
      />

      {/* 5 카드 grid */}
      <AdminCompletedCardGrid cards={cards} />

      {/* 진행도 요약 footer — 진짜 판정만 (결과 확정 / 사이트 공개) */}
      <div className="acp-card" style={{ marginTop: 14 }}>
        <div className="acp-card__head" style={{ marginBottom: 0 }}>
          {/* Material checklist → lucide list-checks (acp-card__icon 슬롯 유지) */}
          <Icon name="list-checks" size={20} className="acp-card__icon" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="acp-card__num">종료 정리 진행도</div>
            <h3 className="acp-card__title">{doneCount}/2 핵심 항목 완료</h3>
          </div>
        </div>
        <p className="acp-card__desc" style={{ margin: "8px 0 0" }}>
          결과 확정 · 사이트 공개를 마치면 다음 회차 준비를 시작할 수 있어요.
        </p>
      </div>
    </div>
  );
}
