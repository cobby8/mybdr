import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { MEMBERSHIP_LABELS, type MembershipType } from "@/lib/auth/roles";
import { Badge, DL, Panel, StatusBadge, type StatusMeta } from "@/components/admin/console-kit";
import {
  DetailHead,
  DetailTabs,
  EmptyDetail,
  MiniStat,
  displayUser,
  formatDate,
  formatDateTime,
  formatWon,
  initials,
  parseBigIntId,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const USER_STATUS: Record<string, StatusMeta> = {
  active: { tone: "ok", label: "활성" },
  suspended: { tone: "danger", label: "정지" },
  withdrawn: { tone: "grey", label: "탈퇴" },
};

const APP_STATUS: Record<string, StatusMeta> = {
  "0": { tone: "warn", label: "대기" },
  "1": { tone: "ok", label: "승인" },
  "2": { tone: "danger", label: "거절" },
  "3": { tone: "grey", label: "대기열" },
};

const PAYMENT_STATUS: Record<string, StatusMeta> = {
  paid: { tone: "ok", label: "결제완료" },
  pending: { tone: "warn", label: "대기" },
  failed: { tone: "danger", label: "실패" },
  refunded: { tone: "grey", label: "환불" },
  partial_refunded: { tone: "grey", label: "부분환불" },
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "activity", "games", "billing"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

function membershipLabel(value: number) {
  return MEMBERSHIP_LABELS[value as MembershipType] ?? String(value);
}

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const userId = parseBigIntId(id);
  if (!userId) notFound();

  const [user, counts, seasonStats, gameApplications, payments] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        nickname: true,
        name: true,
        phone: true,
        city: true,
        district: true,
        position: true,
        height: true,
        weight: true,
        bio: true,
        membershipType: true,
        subscription_status: true,
        subscription_started_at: true,
        subscription_expires_at: true,
        status: true,
        isAdmin: true,
        admin_role: true,
        provider: true,
        evaluation_rating: true,
        total_games_hosted: true,
        total_games_participated: true,
        last_login_at: true,
        createdAt: true,
        updatedAt: true,
        teamMembers: {
          orderBy: { joined_at: "desc" },
          take: 12,
          include: {
            team: {
              select: {
                id: true,
                name: true,
                city: true,
                status: true,
              },
            },
          },
        },
      },
    }),
    Promise.all([
      prisma.teamMember.count({ where: { userId } }),
      prisma.game_applications.count({ where: { user_id: userId } }),
      prisma.payments.count({ where: { user_id: userId } }),
    ]),
    prisma.userSeasonStat.findMany({
      where: { user_id: userId },
      orderBy: { season_year: "desc" },
      take: 5,
    }),
    prisma.game_applications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 20,
      include: {
        games: {
          select: {
            id: true,
            title: true,
            venue_name: true,
            city: true,
            scheduled_at: true,
            status: true,
          },
        },
      },
    }),
    prisma.payments.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      take: 20,
      select: {
        id: true,
        payment_code: true,
        payable_type: true,
        final_amount: true,
        payment_method: true,
        status: true,
        paid_at: true,
        created_at: true,
        description: true,
      },
    }),
  ]);

  if (!user) notFound();

  const [teamCount, gameCount, paymentCount] = counts;
  const activeTab = getTab(tabParam);
  const baseHref = `/admin/users/${id}`;
  const tabs = [
    { id: "overview", label: "개요", icon: "id-card", href: baseHref },
    { id: "activity", label: "활동", icon: "activity", href: `${baseHref}?tab=activity` },
    { id: "games", label: "경기 기록", icon: "volleyball", href: `${baseHref}?tab=games`, count: gameCount },
    { id: "billing", label: "결제", icon: "credit-card", href: `${baseHref}?tab=billing`, count: paymentCount },
  ];

  const userName = displayUser(user);
  const region = [user.city, user.district].filter(Boolean).join(" ");
  const roleLabel = user.isAdmin ? "관리자" : membershipLabel(user.membershipType);

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/users"
        backLabel="유저 목록"
        eyebrow="ADMIN / 사용자 상세"
        eyebrowIcon="users"
        avatar={initials(user.nickname ?? user.email)}
        title={userName}
        sub={`${user.email}${region ? ` / ${region}` : ""}`}
        badges={
          <>
            <Badge tone={user.isAdmin ? "danger" : "primary"}>{roleLabel}</Badge>
            <StatusBadge map={USER_STATUS} value={user.status ?? "active"} />
            {user.admin_role && <Badge tone="grey">{user.admin_role}</Badge>}
          </>
        }
        actions={
          <Link href="/admin/game-reports" className="btn btn--sm">
            신고 검토
          </Link>
        }
      />

      <MiniStat
        items={[
          { label: "소속 팀", value: teamCount.toLocaleString() },
          { label: "경기 신청", value: gameCount.toLocaleString() },
          { label: "결제", value: paymentCount.toLocaleString() },
          { label: "평점", value: user.evaluation_rating ? Number(user.evaluation_rating).toFixed(1) : "-" },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="회원 정보">
              <DL
                rows={[
                  ["닉네임", user.nickname ?? "-"],
                  ["이름", user.name ?? "-"],
                  ["이메일", user.email],
                  ["전화번호", user.phone ?? "-"],
                  ["지역", region || "-"],
                  ["포지션", user.position ?? "-"],
                  ["신장/체중", [user.height && `${user.height}cm`, user.weight && `${user.weight}kg`].filter(Boolean).join(" / ") || "-"],
                  ["가입일", formatDate(user.createdAt)],
                  ["최근 접속", formatDateTime(user.last_login_at)],
                ]}
              />
            </Panel>

            <Panel title="소속 팀" sub={`최근 ${user.teamMembers.length}건`}>
              {user.teamMembers.length === 0 ? (
                <EmptyDetail title="소속 팀이 없습니다." />
              ) : (
                <div className="au-feed">
                  {user.teamMembers.map((member) => (
                    <div className="au-feed__row" key={member.id.toString()}>
                      <span className="au-feed__dot" />
                      <div className="au-feed__body">
                        <div className="au-feed__title">
                          <Link href={`/admin/teams/${member.teamId.toString()}`}>{member.team.name}</Link>
                        </div>
                        <div className="au-feed__desc">
                          {[member.role, member.position, member.jerseyNumber != null ? `#${member.jerseyNumber}` : null]
                            .filter(Boolean)
                            .join(" / ") || "멤버"}
                        </div>
                        <div className="au-feed__meta">
                          {member.status ?? "-"} / {formatDate(member.joined_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="au-dstack">
            <Panel title="구독">
              <DL
                rows={[
                  ["등급", membershipLabel(user.membershipType)],
                  ["상태", user.subscription_status ?? "-"],
                  ["시작", formatDate(user.subscription_started_at)],
                  ["만료", formatDate(user.subscription_expires_at)],
                  ["Provider", user.provider ?? "-"],
                ]}
              />
            </Panel>
            <Panel title="프로필 메모">
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                {user.bio || "등록된 자기소개가 없습니다."}
              </p>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <Panel title="활동 요약">
          <DL
            rows={[
              ["주최 경기", `${user.total_games_hosted ?? 0}건`],
              ["참가 경기", `${user.total_games_participated ?? 0}건`],
              ["최근 접속", formatDateTime(user.last_login_at)],
              ["계정 갱신", formatDateTime(user.updatedAt)],
            ]}
          />
        </Panel>
      )}

      {activeTab === "games" && (
        <Panel title="경기 신청 기록" sub={`최근 ${gameApplications.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {gameApplications.length === 0 ? (
            <EmptyDetail title="경기 신청 기록이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>경기</th>
                  <th>장소</th>
                  <th>예정일</th>
                  <th style={{ paddingRight: 20 }}>신청 상태</th>
                </tr>
              </thead>
              <tbody>
                {gameApplications.map((application) => (
                  <tr key={application.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/games/${application.game_id.toString()}`}>
                        {application.games.title ?? "(제목 없음)"}
                      </Link>
                    </td>
                    <td>{application.games.venue_name ?? application.games.city ?? "-"}</td>
                    <td>{formatDate(application.games.scheduled_at)}</td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={APP_STATUS} value={String(application.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "billing" && (
        <Panel title="결제 기록" sub={`최근 ${payments.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {payments.length === 0 ? (
            <EmptyDetail title="결제 기록이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>결제</th>
                  <th>유형</th>
                  <th>일시</th>
                  <th>상태</th>
                  <th style={{ paddingRight: 20, textAlign: "right" }}>금액</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      {payment.description ?? payment.payment_code}
                    </td>
                    <td>{payment.payable_type}</td>
                    <td>{formatDateTime(payment.paid_at ?? payment.created_at)}</td>
                    <td>
                      <StatusBadge map={PAYMENT_STATUS} value={payment.status} />
                    </td>
                    <td style={{ paddingRight: 20, textAlign: "right", fontWeight: 800 }}>
                      {formatWon(payment.final_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {seasonStats.length > 0 && (
        <Panel title="시즌 누적" sub="최근 시즌 집계" style={{ marginTop: 16 }}>
          <div className="au-chips">
            {seasonStats.map((stat) => (
              <span className="au-chips__item" key={stat.id.toString()}>
                {stat.season_label ?? `${stat.season_year} 시즌`} / {stat.games_played}경기 / {stat.wins}승
              </span>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
