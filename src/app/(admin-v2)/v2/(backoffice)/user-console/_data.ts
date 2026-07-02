// ============================================================
// _data.ts — 유저 콘솔 서버 데이터 페치 + 매핑 (page.tsx / teams / orgs 공용)
//   기존 user-console/page.tsx 의 Prisma READ + snake→도메인 단일 매핑을 추출.
//   각 서브라우트(/, /teams, /orgs)가 동일 쿼리를 재사용 — 로직 복제 0.
//   mutation(updateUserStatusAction·approve/reject REST) 은 호출부(page.tsx)에 유지.
// ============================================================

import { prisma } from "@/lib/db/prisma";
import type { AdminBoUser, AdminBoTeam, AdminBoOrg } from "@/lib/admin-v2/data";

// 아바타 색 팔레트 (정본 av)
const AV = ["#3182F6", "#15B86A", "#6D5AE6", "#FF9500", "#F04452", "#00B8D9", "#E0457B", "#8B5CF6"];

// KST 날짜 표시 (서버=UTC → Asia/Seoul 고정)
function fmtDate(d: Date | null | undefined): string {
  if (!d) return "-";
  return d.toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
function fmtDateTime(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// status → 표시 라벨/톤
function userStatusLabel(s: string | null): { badge: string; tone: string } {
  if (s === "active") return { badge: "활성", tone: "ok" };
  if (s === "suspended") return { badge: "정지", tone: "danger" };
  if (s === "withdrawn") return { badge: "탈퇴", tone: "grey" };
  return { badge: s || "휴면", tone: "grey" };
}
function teamStatusLabel(s: string | null): { st: string; sttone: string } {
  if (s === "active") return { st: "운영중", sttone: "ok" };
  if (s === "inactive") return { st: "비활성", sttone: "mute" };
  if (s === "merged") return { st: "통합됨", sttone: "mute" };
  if (s === "dissolved") return { st: "해산됨", sttone: "mute" };
  return { st: s || "운영중", sttone: "ok" };
}
function orgStatusLabel(s: string): { badge: string; tone: string } {
  if (s === "approved") return { badge: "인증됨", tone: "primary" };
  if (s === "pending") return { badge: "대기", tone: "warn" };
  if (s === "rejected") return { badge: "반려", tone: "danger" };
  return { badge: s, tone: "grey" };
}
const TEAM_ROLE: Record<string, string> = { member: "멤버", manager: "매니저", coach: "코치", treasurer: "총무", director: "이사" };
const ORG_ROLE: Record<string, string> = { owner: "대표 운영자", admin: "운영자", member: "멤버" };

// ──────────────────────────────────────────────
// 공용 페치 함수 — 3개 리스트 병렬 Prisma READ + snake→도메인 매핑
// ──────────────────────────────────────────────
export async function fetchUserConsoleData(): Promise<{
  userData: AdminBoUser[];
  teamData: AdminBoTeam[];
  orgData: AdminBoOrg[];
}> {
  const [users, teams, orgs] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ isAdmin: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true, nickname: true, name: true, email: true, phone: true,
        city: true, district: true, status: true, isAdmin: true,
        membershipType: true, provider: true, createdAt: true, last_login_at: true,
        teamMembers: {
          where: { status: "active" },
          take: 12,
          include: { team: { select: { name: true } } },
        },
      },
    }),
    prisma.team.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, name: true, city: true, district: true, founded_year: true,
        members_count: true, wins: true, losses: true, draws: true, status: true,
        users_teams_captain_idTousers: { select: { nickname: true, name: true } },
        teamMembers: {
          orderBy: [{ status: "asc" }, { joined_at: "desc" }],
          take: 30,
          include: { user: { select: { nickname: true, name: true, position: true } } },
        },
      },
    }),
    prisma.organizations.findMany({
      orderBy: [{ status: "asc" }, { created_at: "desc" }],
      take: 50,
      select: {
        id: true, name: true, slug: true, region: true, status: true,
        description: true, contact_email: true, contact_phone: true,
        website_url: true, logo_url: true, banner_url: true,
        is_public: true, created_at: true,
        owner: { select: { nickname: true, name: true, email: true } },
        _count: { select: { series: true, members: true } },
        members: {
          where: { role: { in: ["owner", "admin"] } },
          orderBy: [{ role: "asc" }, { created_at: "asc" }],
          take: 12,
          include: { user: { select: { nickname: true, name: true } } },
        },
      },
    }),
  ]);

  // ── snake → 표시 도메인 단일 매핑 ──
  const userData: AdminBoUser[] = users.map((u, i) => {
    const { badge, tone } = userStatusLabel(u.status);
    return {
      id: u.id.toString(),
      name: u.nickname || u.name || "이름없음",
      email: u.email,
      phone: u.phone ?? null,
      region: [u.city, u.district].filter(Boolean).join(" ") || "-",
      provider: u.provider ?? null,
      status: u.status ?? "active",
      badge, tone,
      isAdmin: u.isAdmin === true,
      membershipLabel: `등급 ${u.membershipType ?? 0}`,
      joined: fmtDate(u.createdAt),
      lastSeen: fmtDateTime(u.last_login_at),
      teams: u.teamMembers.map((tm, j) => ({
        name: tm.team?.name || "팀",
        kind: TEAM_ROLE[tm.role ?? "member"] ?? "멤버",
        role: TEAM_ROLE[tm.role ?? "member"] ?? "멤버",
        color: AV[(i + j) % AV.length],
      })),
    };
  });

  const teamData: AdminBoTeam[] = teams.map((t, i) => {
    const { st, sttone } = teamStatusLabel(t.status);
    const region = [t.city, t.district].filter(Boolean).join(" ") || "-";
    return {
      id: t.id.toString(),
      name: t.name,
      sub: t.founded_year ? `창단 ${t.founded_year}` : region,
      color: AV[i % AV.length],
      region,
      members: `${t.members_count ?? t.teamMembers.length}명`,
      status: st,
      sttone,
      captain: t.users_teams_captain_idTousers?.nickname || t.users_teams_captain_idTousers?.name || "-",
      foundedYear: t.founded_year ?? null,
      wins: t.wins ?? 0,
      losses: t.losses ?? 0,
      draws: t.draws ?? 0,
      roster: t.teamMembers.map((tm, j) => ({
        name: tm.user?.nickname || tm.user?.name || "선수",
        pos: tm.position ?? tm.user?.position ?? "-",
        role: TEAM_ROLE[tm.role ?? "member"] ?? "멤버",
        jersey: tm.jerseyNumber != null ? `#${tm.jerseyNumber}` : null,
        color: AV[(i + j) % AV.length],
      })),
    };
  });

  const orgData: AdminBoOrg[] = orgs.map((o, i) => {
    const { badge, tone } = orgStatusLabel(o.status);
    const staff = o.members
      .filter((m) => m.role === "owner" || m.role === "admin")
      .map((m, j) => ({
        name: m.user?.nickname || m.user?.name || "운영자",
        role: ORG_ROLE[m.role ?? "member"] ?? "멤버",
        color: AV[(i + j) % AV.length],
      }));
    return {
      id: o.id.toString(),
      name: o.name,
      slug: o.slug,
      region: o.region || "-",
      type: o.region || "주최 단체",
      status: o.status,
      badge, tone,
      tourn: `${o._count.series}개`,
      contactEmail: o.contact_email ?? null,
      contactPhone: o.contact_phone ?? null,
      website: o.website_url ?? null,
      logoUrl: o.logo_url ?? null,
      bannerUrl: o.banner_url ?? null,
      description: o.description ?? null,
      isPublic: o.is_public,
      createdAt: fmtDate(o.created_at),
      seriesCount: o._count.series,
      membersCount: o._count.members,
      owner: o.owner ? { name: o.owner.nickname || o.owner.name || "-", email: o.owner.email } : null,
      staff,
    };
  });

  return { userData, teamData, orgData };
}
