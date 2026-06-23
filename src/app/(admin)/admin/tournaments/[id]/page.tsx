import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, DL, Panel, StatusBadge, type StatusMeta } from "@/components/admin/console-kit";
import { prisma } from "@/lib/db/prisma";
import {
  DetailHead,
  DetailTabs,
  EmptyDetail,
  MiniStat,
  displayUser,
  formatDate,
  formatDateTime,
  formatJsonValue,
  formatWon,
  initials,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TOURNAMENT_STATUS: Record<string, StatusMeta> = {
  draft: { tone: "grey", label: "준비중" },
  upcoming: { tone: "grey", label: "준비중" },
  registration: { tone: "primary", label: "접수중" },
  registration_open: { tone: "primary", label: "접수중" },
  active: { tone: "primary", label: "접수중" },
  published: { tone: "primary", label: "접수중" },
  open: { tone: "primary", label: "접수중" },
  in_progress: { tone: "ok", label: "진행중" },
  live: { tone: "ok", label: "진행중" },
  ongoing: { tone: "ok", label: "진행중" },
  completed: { tone: "grey", label: "종료" },
  ended: { tone: "grey", label: "종료" },
  closed: { tone: "grey", label: "종료" },
  cancelled: { tone: "danger", label: "취소" },
};

const TEAM_STATUS: Record<string, StatusMeta> = {
  pending: { tone: "warn", label: "대기" },
  approved: { tone: "ok", label: "승인" },
  rejected: { tone: "danger", label: "거절" },
  waitlisted: { tone: "grey", label: "대기열" },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  paid: { tone: "ok", label: "입금" },
  unpaid: { tone: "warn", label: "미입금" },
  waived: { tone: "grey", label: "면제" },
  refunded: { tone: "grey", label: "환불" },
};

const MATCH_STATUS: Record<string, StatusMeta> = {
  scheduled: { tone: "grey", label: "예정" },
  ready: { tone: "primary", label: "대기" },
  in_progress: { tone: "ok", label: "진행중" },
  completed: { tone: "grey", label: "종료" },
  cancelled: { tone: "danger", label: "취소" },
};

const SETTLEMENT_STATUS: Record<string, StatusMeta> = {
  pending: { tone: "warn", label: "대기" },
  scheduled: { tone: "primary", label: "예정" },
  paid: { tone: "ok", label: "지급" },
  cancelled: { tone: "danger", label: "취소" },
  refunded: { tone: "grey", label: "환수" },
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "teams", "bracket", "settlement"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

function toNumber(value: unknown): number {
  if (value == null) return 0;
  const n = Number(String(value));
  return Number.isFinite(n) ? n : 0;
}

function resolveTeamFee(divFees: unknown, division: string | null, entryFee: unknown) {
  const fallback = toNumber(entryFee);
  if (!division || !divFees || Array.isArray(divFees) || typeof divFees !== "object") {
    return fallback;
  }

  const feeMap = divFees as Record<string, unknown>;
  const raw = feeMap[division] ?? feeMap[division.trim()];
  return raw == null || raw === "" ? fallback : toNumber(raw);
}

function matchTitle(match: { roundName: string | null; round_number: number | null; match_number: number | null }) {
  const round = match.roundName ?? (match.round_number ? `${match.round_number}라운드` : "라운드 미정");
  return match.match_number ? `${round} · ${match.match_number}경기` : round;
}

export default async function AdminTournamentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  if (!UUID_RE.test(id)) notFound();

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      _count: { select: { tournamentTeams: true, tournamentMatches: true, adminMembers: true } },
      courts: { select: { id: true, name: true, address: true, city: true, district: true } },
      teams: { select: { id: true, name: true } },
      tournament_series: {
        include: {
          organization: { select: { id: true, name: true, slug: true, status: true } },
        },
      },
      tournamentSite: {
        select: { subdomain: true, isPublished: true, createdAt: true },
      },
      users_tournaments_organizer_idTousers: {
        select: { id: true, nickname: true, name: true, email: true },
      },
      users_tournaments_mvp_player_idTousers: {
        select: { id: true, nickname: true, name: true, email: true },
      },
      adminMembers: {
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, nickname: true, name: true, email: true } },
        },
      },
      tournamentTeams: {
        orderBy: [{ division: "asc" }, { seedNumber: "asc" }, { createdAt: "asc" }],
        include: {
          _count: { select: { players: true } },
          team: { select: { id: true, name: true, city: true, district: true, status: true } },
          users: { select: { id: true, nickname: true, name: true, email: true } },
        },
      },
      tournamentMatches: {
        orderBy: [{ round_number: "asc" }, { match_number: "asc" }, { scheduledAt: "asc" }],
        include: {
          homeTeam: { include: { team: { select: { id: true, name: true } } } },
          awayTeam: { include: { team: { select: { id: true, name: true } } } },
        },
      },
    },
  });

  if (!tournament) notFound();

  const matchIds = tournament.tournamentMatches.map((match) => match.id);
  const refereeAssignments = matchIds.length
    ? await prisma.refereeAssignment.findMany({
        where: { tournament_match_id: { in: matchIds } },
        orderBy: { created_at: "desc" },
        include: {
          settlement: true,
          referee: {
            select: {
              id: true,
              verified_name: true,
              registered_name: true,
              user: { select: { nickname: true, name: true, email: true } },
            },
          },
        },
      })
    : [];

  const activeTab = getTab(tabParam);
  const baseHref = `/admin/tournaments/${id}`;
  const site = tournament.tournamentSite[0] ?? null;
  const paidTeams = tournament.tournamentTeams.filter((team) => team.payment_status === "paid");
  const waivedTeams = tournament.tournamentTeams.filter((team) => team.payment_status === "waived");
  const unpaidTeams = tournament.tournamentTeams.filter((team) => team.payment_status !== "paid" && team.payment_status !== "waived");
  const revenueRows = tournament.tournamentTeams.map((team) => ({
    id: team.id,
    teamName: team.team.name,
    division: team.division,
    paymentStatus: team.payment_status ?? "unpaid",
    fee: resolveTeamFee(tournament.div_fees, team.division, tournament.entry_fee),
  }));
  const entryRevenue = revenueRows
    .filter((row) => row.paymentStatus === "paid")
    .reduce((sum, row) => sum + row.fee, 0);
  const refereeSettlementTotal = refereeAssignments.reduce(
    (sum, assignment) => sum + (assignment.settlement?.amount ?? 0),
    0
  );
  const assignmentFeeTotal = refereeAssignments.reduce((sum, assignment) => sum + (assignment.fee ?? 0), 0);
  const partialNet = entryRevenue - refereeSettlementTotal;

  const tabs = [
    { id: "overview", label: "개요", icon: "trophy", href: baseHref },
    { id: "teams", label: "참가팀", icon: "users", href: `${baseHref}?tab=teams`, count: tournament.tournamentTeams.length },
    { id: "bracket", label: "대진표", icon: "list-tree", href: `${baseHref}?tab=bracket`, count: tournament.tournamentMatches.length },
    { id: "settlement", label: "정산", icon: "receipt", href: `${baseHref}?tab=settlement`, count: paidTeams.length },
  ];

  const venue = tournament.courts?.name ?? tournament.venue_name ?? "-";
  const region = [tournament.city, tournament.district].filter(Boolean).join(" ");

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/tournaments"
        backLabel="대회 목록"
        eyebrow="ADMIN / 대회 상세"
        eyebrowIcon="trophy"
        avatar={initials(tournament.name)}
        title={tournament.name}
        sub={[region, venue, formatDate(tournament.startDate)].filter((v) => v && v !== "-").join(" / ")}
        badges={
          <>
            <StatusBadge map={TOURNAMENT_STATUS} value={tournament.status ?? "draft"} />
            <Badge tone={tournament.is_public ? "ok" : "grey"}>{tournament.is_public ? "공개" : "비공개"}</Badge>
            {site?.isPublished && <Badge tone="ok">사이트 공개</Badge>}
          </>
        }
        actions={
          <>
            <Link href={`/tournament-admin/tournaments/${id}`} className="btn btn--sm">
              운영 페이지
            </Link>
            <Link href={`/tournament-admin/tournaments/${id}/teams`} className="btn btn--sm">
              참가팀 운영
            </Link>
          </>
        }
      />

      <MiniStat
        items={[
          { label: "참가팀", value: tournament._count.tournamentTeams.toLocaleString() },
          { label: "경기", value: tournament._count.tournamentMatches.toLocaleString() },
          { label: "입금팀", value: paidTeams.length.toLocaleString() },
          { label: "수입", value: formatWon(entryRevenue) },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="대회 정보">
              <DL
                rows={[
                  ["상태", TOURNAMENT_STATUS[tournament.status ?? "draft"]?.label ?? tournament.status ?? "-"],
                  ["형식", tournament.format ?? "-"],
                  ["기간", `${formatDate(tournament.startDate)} ~ ${formatDate(tournament.endDate)}`],
                  ["등록 기간", `${formatDate(tournament.registration_start_at)} ~ ${formatDate(tournament.registration_end_at)}`],
                  ["정원", `${tournament.min_teams ?? "-"} ~ ${tournament.maxTeams ?? "-"}팀`],
                  ["로스터", `${tournament.roster_min ?? "-"} ~ ${tournament.roster_max ?? "-"}명`],
                  ["참가비 기본값", formatWon(tournament.entry_fee)],
                  ["종별 참가비", formatJsonValue(tournament.div_fees)],
                ]}
              />
            </Panel>

            <Panel title="장소 / 공개">
              <DL
                rows={[
                  ["장소", venue],
                  ["주소", tournament.venue_address ?? tournament.courts?.address ?? "-"],
                  ["지역", region || "-"],
                  ["공개 여부", tournament.is_public ? "공개" : "비공개"],
                  ["대회 사이트", site?.subdomain ? `${site.subdomain}.mybdr.kr` : "-"],
                  ["사이트 생성일", formatDateTime(site?.createdAt)],
                  ["조회수", (tournament.views_count ?? 0).toLocaleString()],
                ]}
              />
            </Panel>
          </div>

          <div className="au-dstack">
            <Panel title="주최 / 위계">
              <DL
                rows={[
                  ["주최자", displayUser(tournament.users_tournaments_organizer_idTousers)],
                  ["주최자 이메일", tournament.users_tournaments_organizer_idTousers.email],
                  ["단체", tournament.tournament_series?.organization?.name ?? "-"],
                  ["시리즈", tournament.tournament_series?.name ?? "-"],
                  ["회차", tournament.edition_number ? `${tournament.edition_number}회` : "-"],
                  ["관리자", `${tournament._count.adminMembers}명`],
                ]}
              />
              {tournament.tournament_series?.organization && (
                <div className="mt-4">
                  <Link
                    href={`/admin/organizations/${tournament.tournament_series.organization.id}`}
                    className="ts-btn ts-btn--secondary ts-btn--sm"
                  >
                    단체 상세 보기
                  </Link>
                </div>
              )}
            </Panel>

            <Panel title="운영 페이지 위임">
              <p className="text-sm" style={{ color: "var(--ink-mute)", lineHeight: 1.7 }}>
                콘솔 상세는 감독용 읽기 요약입니다. 셋업 체크리스트, 대진 생성, 기록원, 사이트 공개 같은 변경 작업은 기존 대회 운영 페이지에서 처리합니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/tournament-admin/tournaments/${id}`} className="ts-btn ts-btn--primary ts-btn--sm">
                  운영 허브
                </Link>
                <Link href={`/tournament-admin/tournaments/${id}/bracket`} className="ts-btn ts-btn--secondary ts-btn--sm">
                  대진 운영
                </Link>
                <Link href={`/tournament-admin/tournaments/${id}/matches`} className="ts-btn ts-btn--secondary ts-btn--sm">
                  경기 운영
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "teams" && (
        <Panel title="참가팀" sub={`${tournament.tournamentTeams.length}팀`} pad={0} style={{ overflow: "hidden" }}>
          {tournament.tournamentTeams.length === 0 ? (
            <EmptyDetail title="참가팀이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th>팀</th>
                  <th>종별/시드</th>
                  <th>상태</th>
                  <th>입금</th>
                  <th>명단</th>
                  <th>참가비</th>
                </tr>
              </thead>
              <tbody>
                {tournament.tournamentTeams.map((team) => {
                  const fee = resolveTeamFee(tournament.div_fees, team.division, tournament.entry_fee);
                  return (
                    <tr key={String(team.id)}>
                      <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                        <Link href={`/admin/teams/${team.team.id}`}>{team.team.name}</Link>
                        <span>{[team.team.city, team.team.district].filter(Boolean).join(" ") || "지역 미설정"}</span>
                      </td>
                      <td>
                        {team.division ?? "-"}
                        {team.seedNumber ? ` / ${team.seedNumber}번` : ""}
                      </td>
                      <td>
                        <StatusBadge map={TEAM_STATUS} value={team.status ?? "pending"} />
                      </td>
                      <td>
                        <StatusBadge map={PAYMENT_STATUS} value={team.payment_status ?? "unpaid"} />
                      </td>
                      <td>{team._count.players}명</td>
                      <td>{formatWon(fee)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "bracket" && (
        <Panel title="대진표 요약" sub={`${tournament.tournamentMatches.length}경기`} pad={0} style={{ overflow: "hidden" }}>
          {tournament.tournamentMatches.length === 0 ? (
            <EmptyDetail title="생성된 경기가 없습니다." desc="대진 생성은 대회 운영 페이지에서 진행합니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th>경기</th>
                  <th>홈</th>
                  <th>어웨이</th>
                  <th>스코어</th>
                  <th>상태</th>
                  <th>일시</th>
                </tr>
              </thead>
              <tbody>
                {tournament.tournamentMatches.map((match) => (
                  <tr key={String(match.id)}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/live/${match.id}`}>{matchTitle(match)}</Link>
                      <span>
                        {[match.group_name, match.court_number].filter(Boolean).join(" / ") || "배정 정보 없음"}
                      </span>
                    </td>
                    <td>{match.homeTeam?.team.name ?? "TBD"}</td>
                    <td>{match.awayTeam?.team.name ?? "TBD"}</td>
                    <td>
                      {(match.homeScore ?? 0).toLocaleString()} : {(match.awayScore ?? 0).toLocaleString()}
                    </td>
                    <td>
                      <StatusBadge map={MATCH_STATUS} value={match.status ?? "scheduled"} />
                    </td>
                    <td>{formatDateTime(match.scheduledAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "settlement" && (
        <div className="au-dstack">
          <Panel title="정산 요약">
            <DL
              rows={[
                ["입금 참가팀", `${paidTeams.length}팀`],
                ["면제 참가팀", `${waivedTeams.length}팀`],
                ["미입금 참가팀", `${unpaidTeams.length}팀`],
                ["참가비 수입", formatWon(entryRevenue)],
                ["심판 정산비", formatWon(refereeSettlementTotal)],
                ["배정비 입력 합계", assignmentFeeTotal > 0 ? formatWon(assignmentFeeTotal) : "—"],
                ["운영비", "— (DB 모델 없음)"],
                ["부분 순이익", `${formatWon(partialNet)} · 운영비 미반영 추정치`],
              ]}
            />
          </Panel>

          <Panel title="참가비 산출" sub="payment_status=paid만 수입 반영" pad={0} style={{ overflow: "hidden" }}>
            {revenueRows.length === 0 ? (
              <EmptyDetail title="참가팀이 없습니다." />
            ) : (
              <table className="au-sub">
                <thead>
                  <tr>
                    <th>팀</th>
                    <th>종별</th>
                    <th>입금</th>
                    <th>산출 참가비</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueRows.map((row) => (
                    <tr key={String(row.id)}>
                      <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                        {row.teamName}
                      </td>
                      <td>{row.division ?? "-"}</td>
                      <td>
                        <StatusBadge map={PAYMENT_STATUS} value={row.paymentStatus} />
                      </td>
                      <td>{formatWon(row.paymentStatus === "paid" ? row.fee : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Panel>

          <Panel title="심판 정산" sub={`${refereeAssignments.length}건 배정`} pad={0} style={{ overflow: "hidden" }}>
            {refereeAssignments.length === 0 ? (
              <EmptyDetail title="심판 정산 데이터가 없습니다." desc="RefereeSettlement 기준 실측 금액만 반영합니다." />
            ) : (
              <table className="au-sub">
                <thead>
                  <tr>
                    <th>심판</th>
                    <th>경기</th>
                    <th>역할</th>
                    <th>배정</th>
                    <th>정산</th>
                    <th>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {refereeAssignments.map((assignment) => {
                    const match = tournament.tournamentMatches.find((item) => item.id === assignment.tournament_match_id);
                    const refereeName =
                      assignment.referee.verified_name ??
                      assignment.referee.registered_name ??
                      displayUser(assignment.referee.user);
                    return (
                      <tr key={String(assignment.id)}>
                        <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                          {refereeName}
                          <span>Referee #{String(assignment.referee.id)}</span>
                        </td>
                        <td>{match ? matchTitle(match) : `경기 #${String(assignment.tournament_match_id)}`}</td>
                        <td>{assignment.role}</td>
                        <td>{assignment.status}</td>
                        <td>
                          {assignment.settlement ? (
                            <StatusBadge map={SETTLEMENT_STATUS} value={assignment.settlement.status} />
                          ) : (
                            "정산 없음"
                          )}
                        </td>
                        <td>{assignment.settlement ? formatWon(assignment.settlement.amount) : "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
