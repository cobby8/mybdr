import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { redirect } from "next/navigation";
import Link from "next/link";

/* ============================================================
 * 대회 운영자 도구 — /tournament-admin (대시보드)
 *
 * 2026-05-04 (사용자 요청): 다른 관리자 페이지(/admin/tournaments)와 UI 일치 + 대회 목록 리스트형.
 * 이전: 통계 카드 3개 + 큰 카드 list + 빠른 시작 + 시리즈 섹션.
 * 변경: AdminPageHeader + 통계 mini bar + admin-table 리스트.
 *
 * 서버 컴포넌트에서 Prisma로 직접 쿼리 (API 호출 X).
 * ============================================================ */

export const dynamic = "force-dynamic";

// 대회 상태 4종 통일 매핑 (admin-table 뱃지 색상)
const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  draft: { label: "준비중", color: "var(--color-text-muted)" },
  upcoming: { label: "준비중", color: "var(--color-text-muted)" },
  registration: { label: "접수중", color: "var(--color-info)" },
  active: { label: "접수중", color: "var(--color-info)" },
  open: { label: "접수중", color: "var(--color-info)" },
  in_progress: { label: "진행중", color: "var(--color-primary)" },
  live: { label: "진행중", color: "var(--color-primary)" },
  ongoing: { label: "진행중", color: "var(--color-primary)" },
  completed: { label: "종료", color: "var(--color-text-disabled)" },
  ended: { label: "종료", color: "var(--color-text-disabled)" },
  cancelled: { label: "종료", color: "var(--color-text-disabled)" },
};

// 탭 키별 status 매핑
const TAB_STATUS_MAP: Record<string, string[]> = {
  preparing: ["draft", "upcoming"],
  registration: ["registration", "active", "open"],
  in_progress: ["in_progress", "live", "ongoing"],
  completed: ["completed", "ended", "cancelled"],
};

export default async function TournamentAdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await getWebSession();
  if (!session) redirect("/login");

  const { status: statusParam, q: qParam } = await searchParams;
  const currentTab = statusParam && TAB_STATUS_MAP[statusParam] ? statusParam : "all";

  const organizerId = BigInt(session.sub);

  // 내 대회 목록 (전체 — in-memory filter + count 위해 모든 status 받음)
  const allTournaments = await prisma.tournament.findMany({
    where: { organizerId },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      status: true,
      maxTeams: true,
      startDate: true,
      createdAt: true,
      tournamentTeams: {
        select: { status: true, payment_status: true },
      },
    },
  });

  // 탭별 카운트 (in-memory)
  const totalTournaments = allTournaments.length;
  const preparingCount = allTournaments.filter((t) =>
    TAB_STATUS_MAP.preparing.includes(t.status || ""),
  ).length;
  const registrationCount = allTournaments.filter((t) =>
    TAB_STATUS_MAP.registration.includes(t.status || ""),
  ).length;
  const activeTournaments = allTournaments.filter((t) =>
    TAB_STATUS_MAP.in_progress.includes(t.status || ""),
  ).length;
  const completedTournaments = allTournaments.filter((t) =>
    TAB_STATUS_MAP.completed.includes(t.status || ""),
  ).length;

  // 탭 + 검색어 필터링
  const myTournaments = allTournaments.filter((t) => {
    if (currentTab !== "all") {
      const allowedStatuses = TAB_STATUS_MAP[currentTab] || [];
      if (!allowedStatuses.includes(t.status || "")) return false;
    }
    if (qParam && qParam.trim()) {
      if (!t.name.toLowerCase().includes(qParam.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      {/* 2026-05-04 (사용자 fix 2차): AdminPageHeader 폐기 + 인라인 마크업.
          본질: AdminPageHeader 의 sm:flex-row 가 어떤 이유로 미적용 → actions 가 title 아래 좌측 정렬됨.
          해결: 인라인 마크업으로 직접 제어 — title block 좌 + 새 대회 만들기 우측 상단 (style 인라인). */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          marginBottom: 24,
          flexWrap: "wrap",
        }}
      >
        {/* 좌측: eyebrow + h1 + subtitle */}
        <div style={{ minWidth: 0, flex: "1 1 auto" }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--color-text-muted)",
              marginBottom: 4,
            }}
          >
            ADMIN · TOURNAMENT
          </div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "var(--ff-display)",
              letterSpacing: "-0.015em",
              color: "var(--color-text-primary)",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            대회 운영자 도구
          </h1>
          <p
            style={{
              fontSize: 13,
              color: "var(--color-text-muted)",
              marginTop: 4,
              marginBottom: 0,
            }}
          >
            내 대회 {totalTournaments}개 · 진행 중 {activeTournaments} · 완료 {completedTournaments}
          </p>
        </div>

        {/* 우측 상단: + 새 대회 만들기 (인라인 정렬, sm:flex-row 의존 X) */}
        <Link
          href="/tournament-admin/tournaments/new/wizard"
          className="btn btn--primary"
          style={{ textDecoration: "none", flexShrink: 0 }}
        >
          + 새 대회 만들기
        </Link>
      </div>

      {/* 검색 form — 별도 row (admin/users 패턴 일치) */}
      <form method="GET" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {/* 검색 시 현재 탭 유지 */}
        {currentTab !== "all" && <input type="hidden" name="status" value={currentTab} />}
        <input
          name="q"
          defaultValue={qParam ?? ""}
          placeholder="대회명 검색"
          className="input"
          style={{ flex: 1, minWidth: 0, maxWidth: 320 }}
        />
        <button type="submit" className="btn btn--primary btn--sm" style={{ flexShrink: 0 }}>
          검색
        </button>
      </form>

      {/* 탭 — admin/users 패턴 (전체/준비중/접수중/진행중/종료) */}
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--color-border)",
          marginBottom: 16,
          overflowX: "auto",
        }}
      >
        {(
          [
            { key: "all", label: "전체", count: totalTournaments },
            { key: "preparing", label: "준비중", count: preparingCount },
            { key: "registration", label: "접수중", count: registrationCount },
            { key: "in_progress", label: "진행중", count: activeTournaments },
            { key: "completed", label: "종료", count: completedTournaments },
          ] as const
        ).map((tab) => {
          const isActive = currentTab === tab.key;
          // 탭 클릭 시 q 유지 + status 변경
          const params = new URLSearchParams();
          if (tab.key !== "all") params.set("status", tab.key);
          if (qParam) params.set("q", qParam);
          const href =
            params.toString().length > 0
              ? `/tournament-admin?${params.toString()}`
              : "/tournament-admin";

          return (
            <Link
              key={tab.key}
              href={href}
              style={{
                position: "relative",
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "var(--ff-display)",
                letterSpacing: "-0.01em",
                color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                textDecoration: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {tab.label}
              <span
                style={{
                  marginLeft: 6,
                  padding: "2px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: "var(--ff-mono)",
                  borderRadius: 4,
                  backgroundColor: isActive
                    ? "color-mix(in oklab, var(--color-accent) 12%, transparent)"
                    : "var(--color-elevated)",
                  color: isActive ? "var(--color-accent)" : "var(--color-text-muted)",
                }}
              >
                {tab.count}
              </span>
              {/* 활성 탭 밑줄 */}
              {isActive && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -1,
                    height: 2,
                    backgroundColor: "var(--color-accent)",
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* 대회 리스트 — admin-table 패턴 (다른 관리자 페이지와 일치) */}
      {myTournaments.length === 0 ? (
        <div
          className="rounded-md py-12 text-center"
          style={{ backgroundColor: "var(--color-card)", boxShadow: "var(--shadow-card)" }}
        >
          <span
            className="material-symbols-outlined mb-3 block text-4xl"
            style={{ color: "var(--color-text-disabled)" }}
          >
            emoji_events
          </span>
          <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
            아직 대회가 없어요
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--color-text-muted)" }}>
            첫 대회를 만들어보세요
          </p>
          <Link
            href="/tournament-admin/tournaments/new/wizard"
            className="btn btn--primary mt-4 inline-block"
            style={{ textDecoration: "none" }}
          >
            대회 만들기
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>대회명</th>
                <th>상태</th>
                <th>참가팀</th>
                <th>입금/대기</th>
                <th>시작일</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {myTournaments.map((tournament) => {
                const teams = tournament.tournamentTeams || [];
                const totalTeams = teams.length;
                const approvedTeams = teams.filter((t) => t.status === "approved").length;
                const pendingTeams = teams.filter((t) => t.status === "pending").length;
                const paidTeams = teams.filter((t) => t.payment_status === "paid").length;

                const statusInfo =
                  STATUS_DISPLAY[tournament.status || "draft"] || STATUS_DISPLAY.draft;
                const maxTeams = tournament.maxTeams || 0;

                return (
                  <tr key={tournament.id}>
                    <td>
                      <Link
                        href={`/tournament-admin/tournaments/${tournament.id}`}
                        style={{
                          color: "var(--color-text-primary)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        {tournament.name}
                      </Link>
                    </td>
                    <td>
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-semibold"
                        style={{
                          color: statusInfo.color,
                          backgroundColor: "var(--color-surface)",
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {approvedTeams}
                      {maxTeams > 0 && (
                        <span style={{ color: "var(--color-text-muted)" }}>/{maxTeams}</span>
                      )}
                    </td>
                    <td style={{ fontSize: 13 }}>
                      <span style={{ color: "var(--color-text-primary)" }}>{paidTeams}</span>
                      {totalTeams > 0 && (
                        <span style={{ color: "var(--color-text-muted)" }}>/{totalTeams}</span>
                      )}
                      {pendingTeams > 0 && (
                        <span
                          style={{
                            marginLeft: 6,
                            color: "var(--color-primary)",
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        >
                          (대기 {pendingTeams})
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--color-text-muted)" }}>
                      {tournament.startDate
                        ? new Date(tournament.startDate).toLocaleDateString("ko-KR", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td>
                      <Link
                        href={`/tournament-admin/tournaments/${tournament.id}`}
                        className="btn btn--sm"
                        style={{ textDecoration: "none" }}
                      >
                        관리
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
