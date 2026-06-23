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
  initials,
  parseBigIntId,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const ORG_STATUS: Record<string, StatusMeta> = {
  pending: { tone: "primary", label: "대기" },
  approved: { tone: "ok", label: "승인" },
  rejected: { tone: "danger", label: "거절" },
  archived: { tone: "grey", label: "보관" },
};

const MEMBER_ROLE: Record<string, StatusMeta> = {
  owner: { tone: "danger", label: "소유자" },
  admin: { tone: "primary", label: "관리자" },
  member: { tone: "grey", label: "멤버" },
};

const TOURNAMENT_STATUS: Record<string, StatusMeta> = {
  draft: { tone: "grey", label: "준비중" },
  registration: { tone: "primary", label: "접수중" },
  registration_open: { tone: "primary", label: "접수중" },
  active: { tone: "primary", label: "접수중" },
  in_progress: { tone: "ok", label: "진행중" },
  live: { tone: "ok", label: "진행중" },
  completed: { tone: "grey", label: "종료" },
  ended: { tone: "grey", label: "종료" },
  closed: { tone: "grey", label: "종료" },
  cancelled: { tone: "danger", label: "취소" },
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "members", "series", "editions"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

function boolLabel(value: boolean | null | undefined) {
  return value ? "공개" : "비공개";
}

export default async function AdminOrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const orgId = parseBigIntId(id);
  if (!orgId) notFound();

  const org = await prisma.organizations.findUnique({
    where: { id: orgId },
    include: {
      owner: {
        select: {
          id: true,
          nickname: true,
          name: true,
          email: true,
        },
      },
      members: {
        orderBy: [{ role: "asc" }, { created_at: "asc" }],
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              name: true,
              email: true,
              status: true,
            },
          },
        },
      },
      series: {
        orderBy: { created_at: "desc" },
        include: {
          tournaments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              name: true,
              edition_number: true,
              status: true,
              startDate: true,
              endDate: true,
              city: true,
              district: true,
              maxTeams: true,
              _count: { select: { tournamentTeams: true, tournamentMatches: true } },
            },
          },
        },
      },
    },
  });

  if (!org) notFound();

  const activeTab = getTab(tabParam);
  const baseHref = `/admin/organizations/${id}`;
  const editions = org.series.flatMap((series) =>
    series.tournaments.map((tournament) => ({
      ...tournament,
      seriesId: series.id,
      seriesName: series.name,
    }))
  );
  const adminMembers = org.members.filter((member) => member.role === "owner" || member.role === "admin");

  const tabs = [
    { id: "overview", label: "개요", icon: "building-2", href: baseHref },
    { id: "members", label: "멤버", icon: "users", href: `${baseHref}?tab=members`, count: org.members.length },
    { id: "series", label: "시리즈", icon: "layers-3", href: `${baseHref}?tab=series`, count: org.series.length },
    { id: "editions", label: "회차", icon: "trophy", href: `${baseHref}?tab=editions`, count: editions.length },
  ];

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/organizations"
        backLabel="단체 목록"
        eyebrow="ADMIN / 단체 상세"
        eyebrowIcon="building-2"
        avatar={initials(org.name)}
        avatarGrey
        title={org.name}
        sub={`${org.slug}${org.region ? ` / ${org.region}` : ""}`}
        badges={
          <>
            <StatusBadge map={ORG_STATUS} value={org.status} />
            <Badge tone={org.is_public ? "ok" : "grey"}>{boolLabel(org.is_public)}</Badge>
            {org.owner && <Badge tone="grey">owner: {displayUser(org.owner)}</Badge>}
          </>
        }
        actions={
          <>
            <Link href={`/tournament-admin/organizations/${org.id}`} className="btn btn--sm">
              운영 페이지
            </Link>
            <Link href={`/organizations/${org.slug}`} className="btn btn--sm">
              공개 페이지
            </Link>
          </>
        }
      />

      <MiniStat
        items={[
          { label: "멤버", value: org.members.length.toLocaleString() },
          { label: "운영진", value: adminMembers.length.toLocaleString() },
          { label: "시리즈", value: org.series.length.toLocaleString() },
          { label: "회차", value: editions.length.toLocaleString() },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="단체 정보">
              <DL
                rows={[
                  ["단체명", org.name],
                  ["slug", org.slug],
                  ["지역", org.region ?? "-"],
                  ["소개", org.description ?? "-"],
                  ["연락 이메일", org.contact_email ?? "-"],
                  ["연락 전화", org.contact_phone ?? "-"],
                  ["웹사이트", org.website_url ?? "-"],
                  ["공개 여부", boolLabel(org.is_public)],
                ]}
              />
            </Panel>

            <Panel title="승인 워크플로">
              <DL
                rows={[
                  ["상태", ORG_STATUS[org.status]?.label ?? org.status],
                  ["신청 메모", org.apply_note ?? "-"],
                  ["승인일", formatDateTime(org.approved_at)],
                  ["승인자 ID", org.approved_by ? String(org.approved_by) : "-"],
                  ["거절일", formatDateTime(org.rejection_at)],
                  ["거절 사유", org.rejection_reason ?? "-"],
                  ["생성일", formatDateTime(org.created_at)],
                  ["수정일", formatDateTime(org.updated_at)],
                ]}
              />
            </Panel>
          </div>

          <div className="au-dstack">
            <Panel title="소유자">
              <DL
                rows={[
                  ["이름", displayUser(org.owner)],
                  ["이메일", org.owner.email],
                  ["유저 ID", String(org.owner.id)],
                ]}
              />
            </Panel>

            <Panel title="콘솔 역할">
              <p className="text-sm" style={{ color: "var(--ink-mute)", lineHeight: 1.7 }}>
                이 화면은 단체의 읽기 요약입니다. 멤버 초대, 시리즈 생성, 단체 보관/복구 같은 운영 작업은 기존 단체 운영 페이지에서 처리합니다.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/tournament-admin/organizations/${org.id}`} className="ts-btn ts-btn--primary ts-btn--sm">
                  단체 운영 페이지
                </Link>
                <Link href={`/tournament-admin/organizations/${org.id}/members`} className="ts-btn ts-btn--secondary ts-btn--sm">
                  멤버 관리
                </Link>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "members" && (
        <Panel title="멤버" sub={`${org.members.length}명`} pad={0} style={{ overflow: "hidden" }}>
          {org.members.length === 0 ? (
            <EmptyDetail title="멤버가 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th>멤버</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {org.members.map((member) => (
                  <tr key={String(member.id)}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${member.user.id}`}>{displayUser(member.user)}</Link>
                      <span>{member.user.email}</span>
                    </td>
                    <td>
                      <StatusBadge map={MEMBER_ROLE} value={member.role} />
                    </td>
                    <td>{member.is_active ? "활성" : "비활성"}</td>
                    <td>{formatDate(member.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "series" && (
        <Panel title="시리즈" sub={`${org.series.length}개`} pad={0} style={{ overflow: "hidden" }}>
          {org.series.length === 0 ? (
            <EmptyDetail title="시리즈가 없습니다." desc="운영 페이지에서 새 시리즈를 만들 수 있습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th>시리즈</th>
                  <th>상태</th>
                  <th>회차</th>
                  <th>생성일</th>
                </tr>
              </thead>
              <tbody>
                {org.series.map((series) => (
                  <tr key={String(series.id)}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/tournament-admin/series/${series.id}`}>{series.name}</Link>
                      <span>{series.slug}</span>
                    </td>
                    <td>{series.status ?? "-"}</td>
                    <td>{series.tournaments.length.toLocaleString()}회</td>
                    <td>{formatDate(series.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "editions" && (
        <Panel title="회차" sub={`${editions.length}개`} pad={0} style={{ overflow: "hidden" }}>
          {editions.length === 0 ? (
            <EmptyDetail title="회차가 없습니다." desc="시리즈에 연결된 대회가 아직 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th>대회</th>
                  <th>상태</th>
                  <th>팀/경기</th>
                  <th>기간</th>
                </tr>
              </thead>
              <tbody>
                {editions.map((edition) => (
                  <tr key={edition.id}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/tournaments/${edition.id}`}>{edition.name}</Link>
                      <span>
                        {edition.seriesName}
                        {edition.edition_number ? ` · ${edition.edition_number}회` : ""}
                      </span>
                    </td>
                    <td>
                      <StatusBadge map={TOURNAMENT_STATUS} value={edition.status ?? "draft"} />
                    </td>
                    <td>
                      {edition._count.tournamentTeams}팀 / {edition._count.tournamentMatches}경기
                    </td>
                    <td>
                      {formatDate(edition.startDate)}
                      {edition.endDate ? ` ~ ${formatDate(edition.endDate)}` : ""}
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
