import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { Card } from "@/components/ui/card";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import {
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_FORMAT_LABEL,
} from "@/lib/constants/tournament-status";
import { calculateSetupProgress, canPublish } from "@/lib/tournaments/setup-status";
import { TournamentWorkspace } from "./_components/TournamentWorkspace";
import { SetupHubMobileSticky } from "./_components/setup-hub-mobile-sticky";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// 이유: 시안 AdminTournamentSetupHub v2.14 의 상태 뱃지 패턴(`admin-stat-pill[data-tone]`)
//   박제 — Admin-7-A `STATUS_TONE` 매핑과 일관 (17 status 키 4 tone 매핑).
//   tournament.status enum 17종 (TOURNAMENT_STATUS_LABEL) 모두 커버 + 폴백 "mute".
type StatusTone = "ok" | "warn" | "info" | "mute" | "err";
const STATUS_TONE: Record<string, StatusTone> = {
  // 준비중 = mute (회색)
  draft: "mute",
  upcoming: "mute",
  // 접수중 = info (파랑)
  registration: "info",
  registration_open: "info",
  active: "info",
  published: "info",
  open: "info",
  opening_soon: "info",
  registration_closed: "info",
  // 진행중 = ok (초록)
  in_progress: "ok",
  live: "ok",
  ongoing: "ok",
  group_stage: "ok",
  // 종료 = mute (회색) — Admin-7-A 패턴과 동일
  completed: "mute",
  ended: "mute",
  closed: "mute",
  cancelled: "mute",
};

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

  // ⭐ PR-1C-13 (PA7) — 종료된 대회면 "종료 후 hub" CTA 노출용 플래그.
  //   종료군(completed/ended/closed) 일 때만 종료 후 정리 hub(신규 라우트) 링크.
  const isCompleted =
    status === "completed" || status === "ended" || status === "closed";

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

  // ⭐ PR-1C-9 (B1) — 모바일 sticky 공개 버튼용 게이트 (setup-status.ts 단일 source 재사용).
  //   새 쿼리/계산 0 — 위 progress 결과를 canPublish() 로 한 줄 도출.
  const publishGate = canPublish(progress);

  // 이유: 시안 v2.14 AdminTournamentSetupHub 헤더 패턴 박제 — eyebrow + breadcrumbs +
  //   actions slot. subtitle 에 시작일·종료일·D-Day·format 통합 (한 줄 표시).
  //   상태 + D-Day 는 본문 상단 메타 라인(admin-stat-pill)으로 분리 — 시안 동일 패턴.
  const statusTone = STATUS_TONE[status] ?? "mute";
  const statusLabel = TOURNAMENT_STATUS_LABEL[status] ?? status;
  const formatLabel =
    TOURNAMENT_FORMAT_LABEL[tournament.format ?? ""] ?? tournament.format ?? "토너먼트";
  // 기존 subtitle 정보 (시작일·종료일·format) 통합. D-Day 는 별 pill 로 분리.
  const dateRangeText = tournament.startDate
    ? `${tournament.startDate.toLocaleDateString("ko-KR")}${
        tournament.endDate ? ` ~ ${tournament.endDate.toLocaleDateString("ko-KR")}` : ""
      }`
    : null;
  const subtitleParts = [dateRangeText, formatLabel].filter(Boolean).join(" · ");

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in (공유셸 미부착)
    <div data-skin="toss">
      {/* 헤더 — 시안 v2.14 AdminPageHeader 박제 (Admin-2 commit) */}
      <AdminPageHeader
        eyebrow="ADMIN · 대회 운영"
        title={tournament.name}
        subtitle={subtitleParts || undefined}
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 운영자 도구" },
          { label: "내 대회" },
          { label: tournament.name },
        ]}
        actions={
          <>
            <Link href="/tournament-admin/tournaments" className="btn btn--sm">
              {/* Material arrow_back → lucide arrow-left */}
              <Icon name="arrow-left" size={16} />
              대회 목록
            </Link>
          </>
        }
      />

      {/* 상태 메타 라인 — 시안 admin-stat-pill 패턴 박제 (D-Day + 상태 + 공개 여부) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="admin-stat-pill" data-tone={statusTone}>
          {statusLabel}
        </span>
        {tournament.startDate && (
          <span className="admin-stat-pill" data-tone="mute">
            {getDDay(tournament.startDate)}
          </span>
        )}
        {site?.isPublished && (
          <span className="admin-stat-pill" data-tone="ok">
            {/* Material public → lucide globe */}
            <Icon name="globe" size={12} />
            공개 중
          </span>
        )}
        {/* ⭐ PR-1C-13 (PA7) — 종료 대회면 "종료 후 hub"(신규 라우트) CTA */}
        {isCompleted && (
          <Link
            href={`/tournament-admin/tournaments/${id}/completed`}
            className="btn btn--sm btn--primary"
          >
            {/* Material emoji_events → lucide trophy */}
            <Icon name="trophy" size={16} />
            종료 후 hub
          </Link>
        )}
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

      {/* WS1 — 체크리스트 허브를 섹션형 운영 워크스페이스로 승격. */}
      <TournamentWorkspace
        progress={progress}
        tournamentId={id}
        teamCount={tournament._count.tournamentTeams}
        maxTeams={tournament.maxTeams}
        matchCount={tournament._count.tournamentMatches}
        isSitePublished={!!site?.isPublished}
        hasSite={!!site}
        siteSubdomain={site?.subdomain}
        isCompleted={isCompleted}
      />

      {/* ⭐ PR-1C-9 (B1) — 모바일 sticky 공개 버튼 (시안 atsh-mobile-sticky 박제).
          PC(sm 이상)는 컴포넌트 내부 sm:hidden 으로 미노출 — 본문 PublishGate 가 처리. */}
      <SetupHubMobileSticky
        tournamentId={id}
        canPublish={publishGate.ok}
        missingCount={publishGate.missing.length}
        isSitePublished={!!site?.isPublished}
        hasSite={!!site}
      />
    </div>
  );
}
