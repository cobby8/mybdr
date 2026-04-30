import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { Breadcrumb } from "@/components/shared/breadcrumb";

/**
 * /teams/manage  — 운영 중인 팀 선택 허브
 * ─────────────────────────────────────────────────────────
 * 이유(왜):
 *   기존 More 메뉴 "팀 관리"는 `/teams`(전체 디렉토리)로만 점프해서
 *   사용자가 본인 운영팀을 직접 찾아야 하는 단계가 있었다.
 *   이 페이지는 **운영 중인 팀(captain/vice/manager)** 만 추려서
 *   곧바로 manage 페이지로 진입시키는 허브다.
 *
 * 분기 (요청자 운영팀 N 개):
 *   - 0개 → "운영 중인 팀이 없습니다" 빈 상태 + /teams (목록) / /teams/new (등록) 안내
 *   - 1개 → `/teams/[id]/manage` 로 redirect (불필요한 클릭 절약)
 *   - 2개 이상 → 카드 그리드로 선택 화면
 *
 * 보안:
 *   - 비로그인 → /login redirect
 *   - 운영팀 판정은 teamMember.role IN [captain, vice, manager] AND status="active"
 *   - 해산팀(team.status="dissolved")은 manage 페이지 자체가 막혀있으므로 여기서는 굳이 필터하지 않음
 */

export const metadata: Metadata = {
  title: "팀 관리 | MyBDR",
  description: "내가 운영하는 팀을 선택해 관리합니다.",
};

// 운영진 역할 — members route.ts와 동일한 정의 (변경 시 양쪽 같이 수정).
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

// 역할 라벨 — manage 페이지 ROLE_OPTIONS와 톤 통일
const ROLE_LABEL: Record<string, string> = {
  captain: "팀장",
  vice: "부팀장",
  manager: "매니저",
};

export default async function TeamsManageHubPage() {
  // 1) 로그인 가드
  const session = await getWebSession();
  if (!session?.sub) {
    // 로그인 후 이 페이지로 돌아오도록 next 파라미터 동봉
    redirect("/login?next=/teams/manage");
  }

  const userId = BigInt(session.sub);

  // 2) 내가 운영진인 팀 조회
  // 이유: teamMember 한 번의 쿼리로 role/team을 동시에 가져오면 N+1 없음.
  const memberships = await prisma.teamMember.findMany({
    where: {
      userId,
      role: { in: [...TEAM_MANAGER_ROLES] },
      status: "active",
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          name_en: true,
          city: true,
          district: true,
          primaryColor: true,
          secondaryColor: true,
          members_count: true,
          status: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  // 2-B) team.captain_id 직접 매칭 — DB 데이터 일관성이 깨진 케이스 보강 (2026-04-29 김병곤 사례)
  // 이유(왜): team.captain_id 는 정상이지만 team_members.role 이 'director' 등 비표준 값으로
  // 등록된 사용자는 위 TEAM_MANAGER_ROLES 필터에 걸려 누락된다. captain_id 로 등록된 사용자는
  // 정의상 무조건 팀장이므로 별도 쿼리로 합산한다 (N+1 방지: 팀당 1쿼리 아닌 단일 쿼리).
  const captainTeams = await prisma.team.findMany({
    where: { captainId: userId },
    select: {
      id: true,
      name: true,
      name_en: true,
      city: true,
      district: true,
      primaryColor: true,
      secondaryColor: true,
      members_count: true,
      status: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // 위 두 결과를 합산 — 중복(membership 에 captain 으로 이미 잡힌 팀)은 team.id 기준 dedup
  // 형태를 memberships 와 동일하게 맞춰 아래 렌더 로직 재사용.
  const membershipTeamIds = new Set(memberships.map((m) => m.team?.id?.toString()).filter(Boolean));
  const captainOnlyAsMemberships = captainTeams
    .filter((t) => !membershipTeamIds.has(t.id.toString()))
    .map((t) => ({
      // memberships 행과 호환되는 최소 필드 — id 는 team.id 를 그대로 사용 (Link key 충돌 방지 위해 prefix)
      id: BigInt(`-${t.id.toString()}`), // 음수로 변환해 진짜 teamMember.id 와 충돌 회피
      role: "captain" as string, // captain_id 로 잡힌 팀이므로 라벨은 captain
      team: t,
    }));

  // 해산된 팀은 manage 페이지가 막혀있으므로 허브 카드에서도 제외 (사용자 혼란 방지).
  const activeTeams = [...memberships, ...captainOnlyAsMemberships].filter(
    (m) => m.team && m.team.status !== "dissolved"
  );

  // 3-A) 0개 → 빈 상태 안내
  if (activeTeams.length === 0) {
    return (
      <div className="page">
        <div style={{ marginBottom: 14 }}>
          <Breadcrumb
            items={[
              { label: "팀", href: "/teams" },
              { label: "팀 관리" },
            ]}
          />
        </div>
        <div
          className="card"
          style={{
            padding: "48px 32px",
            textAlign: "center",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{
              fontSize: 48,
              color: "var(--color-text-muted)",
              marginBottom: 12,
              display: "inline-block",
            }}
          >
            groups
          </span>
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: "var(--color-text-primary)",
              marginBottom: 6,
            }}
          >
            운영 중인 팀이 없습니다
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "var(--color-text-secondary)",
              marginBottom: 20,
            }}
          >
            팀을 직접 만들거나 가입 후 운영진으로 임명되면 이 페이지에 표시됩니다.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link href="/teams/new" className="btn btn--primary">
              새 팀 만들기
            </Link>
            <Link href="/teams" className="btn">
              팀 둘러보기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3-B) 1개 → 곧바로 manage 페이지로 redirect (사용자 한 번 덜 클릭)
  if (activeTeams.length === 1) {
    const only = activeTeams[0];
    redirect(`/teams/${only.team!.id.toString()}/manage`);
  }

  // 3-C) 여러 개 → 선택 카드 그리드
  return (
    <div className="page">
      <div style={{ marginBottom: 14 }}>
        <Breadcrumb
          items={[
            { label: "팀", href: "/teams" },
            { label: "팀 관리" },
          ]}
        />
      </div>

      {/* 페이지 헤더 — 운영팀이 여러 개일 때만 표시 */}
      <header style={{ marginBottom: 20 }}>
        <div
          className="eyebrow"
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.14em",
            color: "var(--color-text-muted)",
            textTransform: "uppercase",
            marginBottom: 8,
          }}
        >
          MY TEAMS · 운영 팀 선택
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            color: "var(--color-text-primary)",
          }}
        >
          관리할 팀을 선택하세요
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: 13,
            color: "var(--color-text-secondary)",
          }}
        >
          내가 운영진(팀장·부팀장·매니저)으로 등록된 팀 {activeTeams.length}개
        </p>
      </header>

      {/* 카드 그리드 — sm까지 1열, md+ 2열 */}
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
        }}
      >
        {activeTeams.map((m) => {
          const team = m.team!;
          // 팀 컬러 — primary(없으면 BDR 네이비 fallback), 흰색은 가독성 안 좋아 우회
          const accent =
            team.primaryColor &&
            team.primaryColor.toLowerCase() !== "#ffffff" &&
            team.primaryColor.toLowerCase() !== "#fff"
              ? team.primaryColor
              : team.secondaryColor &&
                team.secondaryColor.toLowerCase() !== "#ffffff" &&
                team.secondaryColor.toLowerCase() !== "#fff"
              ? team.secondaryColor
              : "#1B3C87";
          const tagBase = (team.name_en && team.name_en.trim()) || team.name.slice(0, 2);
          const tag = tagBase.trim().toUpperCase().slice(0, 3);
          const location = [team.city, team.district].filter(Boolean).join(" ");

          return (
            <Link
              key={m.id.toString()}
              href={`/teams/${team.id.toString()}/manage`}
              className="card"
              style={{
                padding: "16px 18px",
                display: "block",
                textDecoration: "none",
                color: "inherit",
                // hover 효과는 .card 글로벌 스타일에 위임 (있으면 재사용)
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "56px 1fr auto",
                  gap: 14,
                  alignItems: "center",
                }}
              >
                {/* 팀 이니셜 박스 — accent 배경 */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    background: accent,
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "var(--ff-display)",
                    fontWeight: 900,
                    fontSize: 18,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {tag}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "var(--color-text-primary)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {team.name}
                  </div>
                  <div
                    style={{
                      marginTop: 3,
                      fontSize: 12,
                      color: "var(--color-text-muted)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {ROLE_LABEL[m.role ?? "manager"] ?? m.role}
                    {location ? ` · ${location}` : ""} · 멤버 {team.members_count ?? 0}명
                  </div>
                </div>
                <span
                  className="material-symbols-outlined"
                  aria-hidden
                  style={{
                    color: "var(--color-text-muted)",
                    fontSize: 20,
                  }}
                >
                  chevron_right
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* 하단 보조 액션 — 새 팀 만들기 */}
      <div style={{ marginTop: 20, textAlign: "center" }}>
        <Link
          href="/teams/new"
          className="btn"
          style={{ fontSize: 12 }}
        >
          + 새 팀 만들기
        </Link>
      </div>
    </div>
  );
}
