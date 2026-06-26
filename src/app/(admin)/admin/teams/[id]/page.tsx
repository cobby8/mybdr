import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Badge, DL, Panel, StatusBadge, type StatusMeta } from "@/components/admin/console-kit";
import {
  DetailHead,
  DetailTabs,
  EmptyDetail,
  MiniStat,
  displayUser,
  formatDate,
  initials,
  parseBigIntId,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const TEAM_STATUS: Record<string, StatusMeta> = {
  active: { tone: "ok", label: "활동중" },
  inactive: { tone: "danger", label: "비활성" },
  merged: { tone: "grey", label: "통합" },
  dissolved: { tone: "grey", label: "해산" },
};

const MEMBER_STATUS: Record<string, StatusMeta> = {
  active: { tone: "ok", label: "활동" },
  inactive: { tone: "grey", label: "비활성" },
  left: { tone: "grey", label: "탈퇴" },
  pending: { tone: "warn", label: "대기" },
};

const ENTRY_STATUS: Record<string, StatusMeta> = {
  approved: { tone: "ok", label: "승인" },
  active: { tone: "ok", label: "활성" },
  pending: { tone: "warn", label: "대기" },
  rejected: { tone: "danger", label: "반려" },
  waitlist: { tone: "grey", label: "대기열" },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  paid: { tone: "ok", label: "입금" },
  unpaid: { tone: "warn", label: "미입금" },
  refunded: { tone: "grey", label: "환불" },
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "roster", "tournaments"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

export default async function AdminTeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const teamId = parseBigIntId(id);
  if (!teamId) notFound();

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      name_en: true,
      slug: true,
      description: true,
      city: true,
      district: true,
      home_court: true,
      founded_year: true,
      status: true,
      is_public: true,
      accepting_members: true,
      auto_accept_members: true,
      max_members: true,
      members_count: true,
      wins: true,
      losses: true,
      draws: true,
      tournaments_count: true,
      createdAt: true,
      updatedAt: true,
      users_teams_captain_idTousers: {
        select: { id: true, nickname: true, name: true, email: true },
      },
      users_teams_manager_idTousers: {
        select: { id: true, nickname: true, name: true, email: true },
      },
      teamMembers: {
        orderBy: [{ status: "asc" }, { joined_at: "desc" }],
        take: 50,
        include: {
          user: {
            select: { id: true, nickname: true, name: true, email: true, position: true },
          },
        },
      },
      tournamentTeams: {
        orderBy: { createdAt: "desc" },
        take: 30,
        include: {
          tournament: {
            select: { id: true, name: true, startDate: true, status: true },
          },
        },
      },
    },
  });

  if (!team) notFound();

  const activeTab = getTab(tabParam);
  const baseHref = `/admin/teams/${id}`;
  const tabs = [
    { id: "overview", label: "개요", icon: "clipboard-list", href: baseHref },
    { id: "roster", label: "로스터", icon: "users", href: `${baseHref}?tab=roster`, count: team.teamMembers.length },
    { id: "tournaments", label: "대회 전적", icon: "trophy", href: `${baseHref}?tab=tournaments`, count: team.tournamentTeams.length },
  ];

  const region = [team.city, team.district].filter(Boolean).join(" ");
  const gamesTotal = (team.wins ?? 0) + (team.losses ?? 0) + (team.draws ?? 0);

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/teams"
        backLabel="팀 목록"
        eyebrow="ADMIN / 팀 상세"
        eyebrowIcon="shield"
        avatar={initials(team.name)}
        title={team.name}
        sub={[region, team.name_en, team.slug && `/${team.slug}`].filter(Boolean).join(" / ")}
        badges={
          <>
            <StatusBadge map={TEAM_STATUS} value={team.status ?? "active"} />
            <Badge tone={team.is_public ? "primary" : "grey"}>{team.is_public ? "공개" : "비공개"}</Badge>
            <Badge tone={team.accepting_members ? "ok" : "grey"}>
              {team.accepting_members ? "멤버 모집" : "모집 중지"}
            </Badge>
          </>
        }
        actions={
          <Link href="/admin/teams" className="btn btn--sm">
            상태 관리
          </Link>
        }
      />

      <MiniStat
        items={[
          { label: "멤버", value: `${team.members_count ?? team.teamMembers.length}명` },
          { label: "전적", value: gamesTotal > 0 ? `${team.wins ?? 0}W ${team.losses ?? 0}L` : "-" },
          { label: "대회", value: `${team.tournaments_count ?? team.tournamentTeams.length}회` },
          { label: "정원", value: team.max_members ? `${team.max_members}명` : "-" },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="ad-dgrid">
          <div className="ad-dstack">
            <Panel title="팀 정보">
              <DL
                rows={[
                  ["팀명", team.name],
                  ["영문명", team.name_en ?? "-"],
                  ["지역", region || "-"],
                  ["홈코트", team.home_court ?? "-"],
                  ["창단연도", team.founded_year ? String(team.founded_year) : "-"],
                  ["생성일", formatDate(team.createdAt)],
                  ["수정일", formatDate(team.updatedAt)],
                ]}
              />
            </Panel>
            <Panel title="소개">
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                {team.description || "등록된 팀 소개가 없습니다."}
              </p>
            </Panel>
          </div>

          <div className="ad-dstack">
            <Panel title="운영자">
              <DL
                rows={[
                  [
                    "주장",
                    <Link key="captain" href={`/admin/users/${team.users_teams_captain_idTousers.id.toString()}`}>
                      {displayUser(team.users_teams_captain_idTousers)}
                    </Link>,
                  ],
                  [
                    "매니저",
                    team.users_teams_manager_idTousers ? (
                      <Link href={`/admin/users/${team.users_teams_manager_idTousers.id.toString()}`}>
                        {displayUser(team.users_teams_manager_idTousers)}
                      </Link>
                    ) : (
                      "-"
                    ),
                  ],
                  ["자동 승인", team.auto_accept_members ? "ON" : "OFF"],
                ]}
              />
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "roster" && (
        <Panel title="로스터" sub={`최근 ${team.teamMembers.length}명`} pad={0} style={{ overflow: "hidden" }}>
          {team.teamMembers.length === 0 ? (
            <EmptyDetail title="등록된 로스터가 없습니다." />
          ) : (
            <table className="ad-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>선수</th>
                  <th>역할</th>
                  <th>포지션</th>
                  <th>배번</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {team.teamMembers.map((member) => (
                  <tr key={member.id.toString()}>
                    <td className="ad-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${member.userId.toString()}`}>{displayUser(member.user)}</Link>
                    </td>
                    <td>{member.role ?? "-"}</td>
                    <td>{member.position ?? member.user.position ?? "-"}</td>
                    <td>{member.jerseyNumber != null ? `#${member.jerseyNumber}` : "-"}</td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={MEMBER_STATUS} value={member.status ?? "active"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "tournaments" && (
        <Panel title="대회 참가 이력" sub={`최근 ${team.tournamentTeams.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {team.tournamentTeams.length === 0 ? (
            <EmptyDetail title="대회 참가 이력이 없습니다." />
          ) : (
            <table className="ad-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>대회</th>
                  <th>종별</th>
                  <th>시드</th>
                  <th>전적</th>
                  <th>입금</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {team.tournamentTeams.map((entry) => (
                  <tr key={entry.id.toString()}>
                    <td className="ad-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/tournament-admin/tournaments/${entry.tournamentId}`}>{entry.tournament.name}</Link>
                      <div style={{ color: "var(--ink-mute)", fontSize: 12 }}>{formatDate(entry.tournament.startDate)}</div>
                    </td>
                    <td>{entry.division ?? entry.category ?? "-"}</td>
                    <td>{entry.seedNumber ?? "-"}</td>
                    <td>{`${entry.wins ?? 0}W ${entry.losses ?? 0}L ${entry.draws ?? 0}D`}</td>
                    <td>
                      <StatusBadge map={PAYMENT_STATUS} value={entry.payment_status ?? "unpaid"} />
                    </td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={ENTRY_STATUS} value={entry.status ?? "pending"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}
    </div>
  );
}
