// 대회 대시보드 헤더: 진행률 / LIVE / 핫팀 3카드 레이아웃
// API에서 받은 통계 데이터를 3칸 그리드로 표시
//
// 2026-05-02 사용자 요청 변경:
//  - 진행률: 완료(completed) + 라이브(live) 모두 카운트 → 진행 중 경기도 진행률 반영
//  - LIVE: 라이브 매치 정보 (팀명) 표시 + 클릭 시 /live/[id] 이동
//  - HOT: 모든 경기 종료(isAllCompleted) 후에만 노출

import Link from "next/link";

type DashboardHeaderProps = {
  totalMatches: number;
  completedMatches: number;
  liveMatchCount: number;
  /** 첫 라이브 매치 정보 (클릭 시 /live/[id] 이동) — 라이브 0건이면 null */
  liveMatchPreview: { id: string; homeName: string | null; awayName: string | null } | null;
  /** 모든 경기 종료 여부 — true 일 때만 HOT 카드에 핫팀 노출 */
  isAllCompleted: boolean;
  hotTeam: { teamId: string; teamName: string } | null;
  /** 직전 종료 매치 MVP — 대회 진행 중 HOT 카드에 노출 (2026-05-02) */
  recentMvp: {
    matchId: string;
    homeTeamName: string;
    awayTeamName: string;
    playerId: number;
    name: string;
    jerseyNumber: number | null;
    teamName: string;
    pts: number;
    reb: number;
    ast: number;
  } | null;
};

export function TournamentDashboardHeader({
  totalMatches,
  completedMatches,
  liveMatchCount,
  liveMatchPreview,
  isAllCompleted,
  hotTeam,
  recentMvp,
}: DashboardHeaderProps) {
  // 진행률 퍼센트 계산 (0으로 나누기 방지)
  // 2026-05-02: 라이브 매치도 진행 중으로 카운트 → (완료 + 라이브) / 전체
  const progressCount = completedMatches + liveMatchCount;
  const progressPercent =
    totalMatches > 0 ? Math.round((progressCount / totalMatches) * 100) : 0;

  return (
    <section className="mb-8">
      {/* 대시보드 제목 */}
      <h2
        className="mb-4 text-lg font-bold sm:text-xl"
        style={{
          fontFamily: "var(--font-heading)",
          color: "var(--color-text-primary)",
        }}
      >
        대회 대시보드
      </h2>

      {/* 통계 3칸 그리드 */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {/* 카드 1: 대회 진행률 — 완료 경기 / 전체 경기 비율 */}
        <div
          className="rounded-lg border p-3 sm:p-4"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
          }}
        >
          <p
            className="mb-2 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            진행률
          </p>
          <p
            className="text-lg font-black sm:text-2xl"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--color-text-primary)",
            }}
          >
            {progressPercent}%
          </p>
          {/* 프로그레스바: 진행률을 시각적으로 표시 */}
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--color-surface)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progressPercent}%`,
                backgroundColor: "var(--color-primary)",
              }}
            />
          </div>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            {progressCount}/{totalMatches} 경기
          </p>
        </div>

        {/* 카드 2: LIVE — 현재 진행 중 첫 매치 정보 + 클릭 시 /live/[id] 이동 (2026-05-02 사용자 요청) */}
        {liveMatchPreview ? (
          <Link
            href={`/live/${liveMatchPreview.id}`}
            className="rounded-lg border p-3 sm:p-4 transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              LIVE
            </p>
            <p
              className="text-sm font-bold truncate sm:text-base"
              style={{ color: "var(--color-primary)" }}
            >
              {liveMatchPreview.homeName ?? "?"} vs {liveMatchPreview.awayName ?? "?"}
            </p>
            <p className="mt-1 text-xs flex items-center gap-1.5">
              <span
                className="inline-block rounded-full px-1.5 py-0.5 text-[10px] font-bold animate-pulse"
                style={{
                  backgroundColor: "rgba(227,27,35,0.15)",
                  color: "var(--color-primary)",
                }}
              >
                LIVE
              </span>
              <span style={{ color: "var(--color-text-muted)" }}>
                {liveMatchCount > 1 ? `+${liveMatchCount - 1}경기 더 →` : "스코어 보기 →"}
              </span>
            </p>
          </Link>
        ) : (
          <div
            className="rounded-lg border p-3 sm:p-4"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              LIVE
            </p>
            <p
              className="text-lg font-black sm:text-2xl"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              -
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              진행 중인 경기 없음
            </p>
          </div>
        )}

        {/* 카드 3: HOT — 우선순위
            (1) 대회 종료 후 → 핫팀 (최고 성적팀)
            (2) 진행 중 + 직전 종료 매치 MVP 있음 → MVP 선수 (클릭 시 매치 결과 페이지)
            (3) 종료 매치 0건 → '대회 시작 후 표시' (2026-05-02 사용자 요청) */}
        {isAllCompleted && hotTeam ? (
          <Link
            href={`/teams/${hotTeam.teamId}`}
            className="rounded-lg border p-3 sm:p-4 transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              HOT
            </p>
            <p
              className="text-sm font-bold truncate sm:text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              {hotTeam.teamName}
            </p>
            <p
              className="mt-1 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              최고 성적팀 →
            </p>
          </Link>
        ) : recentMvp ? (
          <Link
            href={`/live/${recentMvp.matchId}`}
            className="rounded-lg border p-3 sm:p-4 transition-colors hover:opacity-80"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              HOT · 직전 경기 MVP
            </p>
            <p
              className="text-sm font-bold truncate sm:text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              {recentMvp.name}
              {recentMvp.jerseyNumber != null && (
                <span
                  className="ml-1 text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  #{recentMvp.jerseyNumber}
                </span>
              )}
            </p>
            <p
              className="mt-1 text-xs truncate"
              style={{ color: "var(--color-text-muted)" }}
            >
              {recentMvp.teamName} · {recentMvp.pts}pt {recentMvp.reb}r {recentMvp.ast}a →
            </p>
          </Link>
        ) : (
          <div
            className="rounded-lg border p-3 sm:p-4"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-card)",
            }}
          >
            <p
              className="mb-2 text-xs font-medium uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              HOT
            </p>
            <p
              className="text-lg font-black sm:text-2xl"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              -
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
              경기 종료 후 표시
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
