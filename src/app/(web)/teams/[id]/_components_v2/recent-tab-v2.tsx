import { prisma } from "@/lib/db/prisma";
// Phase 3: 공식 기록 가드 (status IN completed/live + scheduledAt <= NOW + NOT NULL)
import { officialMatchWhere } from "@/lib/tournaments/official-match";
// 4단계 C — 행 전체 router.push (서버 컴포넌트라 클라 래퍼 분리) + 상대팀 TeamLink (nested anchor 회피)
import { TeamLink } from "@/components/links/team-link";
import { RecentTabRow } from "./recent-tab-row";

/**
 * RecentTabV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx` tab === 'recent' 재현.
 *
 * 이유(왜): 기존 GamesTab은 픽업 경기 + 토너먼트 경기 30건 통합 타임라인.
 * 시안은 오직 토너먼트 공식 기록만 5열 `.board`로 간결 표시
 * (날짜/상대/스코어/결과/대회).
 * 본 컴포넌트도 공식 기록(토너먼트)에 집중하여 "최근 경기 5열 테이블"로
 * 시안과 정확히 일치시킨다. 픽업 경기 통합 타임라인은 기존 games-tab.tsx를
 * 원하면 URL?tab=games (레거시) 로 접근 가능하도록 둘 수도 있으나
 * v2 전환 이후에는 recent 탭으로 대체한다.
 *
 * 방법(어떻게):
 * - tournamentTeam.id 목록 → tournamentMatch 조회 (officialMatchWhere)
 * - 이 팀이 홈/원정 중 어느 쪽인지 판별해 MY vs OPP 방향 통일
 * - columns: `80px 1fr 120px 80px 160px`
 * - 날짜: MM.DD (ff-mono 12px)
 * - 상대: `.title a` (`/tournaments/[id]` 링크)
 * - 스코어: `MY : OPP` (ff-mono 700)
 * - 결과: W → badge--ok, L → 다크 filled
 * - 대회: 12px muted
 *
 * 2026-05-02 Phase D 갱신 (사용자 결정 3=A):
 * - 시안 정합 — `.board data-table` 마커 추가 + 각 셀에 `data-label` (날짜/스코어/결과/대회)
 *   + 상대 셀에 `data-primary="true"` 마커 추가.
 * - globals.css L1634~1690 `.data-table` 모바일 카드 변환 룰 활용.
 *   ≤720px 에서 자동 카드 변환 (헤더 행 hidden + key-value 라인 + primary 카드 제목).
 *
 * DB 매핑 / 미지원:
 * - 연습경기/정규리그 분류 → DB 없음 → tournament.name 표시로 대체
 */

type Props = {
  teamId: bigint;
};

export async function RecentTabV2({ teamId }: Props) {
  // 1) 이 팀이 참가한 TournamentTeam ID 목록
  const tournamentTeams = await prisma.tournamentTeam
    .findMany({ where: { teamId }, select: { id: true } })
    .catch(() => []);
  const ttIds = tournamentTeams.map((tt) => tt.id);

  // 2) 공식 기록 조회 (최근 5건)
  //    Phase 3 규칙: officialMatchWhere 가 status + scheduledAt NOT NULL 가드를 통합 적용
  const matches =
    ttIds.length > 0
      ? await prisma.tournamentMatch
          .findMany({
            where: officialMatchWhere({
              OR: [
                { homeTeamId: { in: ttIds } },
                { awayTeamId: { in: ttIds } },
              ],
            }),
            include: {
              homeTeam: { include: { team: { select: { id: true, name: true } } } },
              awayTeam: { include: { team: { select: { id: true, name: true } } } },
              tournament: { select: { id: true, name: true } },
            },
            orderBy: { scheduledAt: "desc" },
            take: 10,
          })
          .catch(() => [])
      : [];

  if (matches.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: "40px 20px",
          textAlign: "center",
          color: "var(--ink-mute)",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 32, marginBottom: 8, display: "block" }}
        >
          sports_basketball
        </span>
        <p style={{ margin: 0, fontSize: 14 }}>최근 공식 경기 기록이 없습니다.</p>
      </div>
    );
  }

  const gridColumns = "80px 1fr 120px 80px 160px";

  return (
    <div className="board data-table">
      <div
        className="board__head data-table__head"
        style={{ gridTemplateColumns: gridColumns }}
      >
        <div>날짜</div>
        <div>상대</div>
        <div>스코어</div>
        <div>결과</div>
        <div>대회</div>
      </div>
      {matches.map((m) => {
        // MY vs OPP 방향 통일 — 이 팀이 home/away 어느 쪽?
        const isHome = m.homeTeamId !== null && ttIds.some((id) => id === m.homeTeamId);
        const myScore = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
        const oppScore = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;
        const oppName = isHome
          ? m.awayTeam?.team?.name ?? "미정"
          : m.homeTeam?.team?.name ?? "미정";
        // 4단계 C: 상대 팀 ID — 팀명 클릭 시 팀페이지 이동용 (BigInt → string 직렬화)
        const oppTeamId = isHome
          ? m.awayTeam?.team?.id?.toString() ?? null
          : m.homeTeam?.team?.id?.toString() ?? null;
        const tournamentName = m.tournament?.name ?? "대회";
        const href = m.tournament?.id ? `/tournaments/${m.tournament.id}` : "#";

        // 날짜 MM.DD (KST)
        const dateLabel = m.scheduledAt
          ? m.scheduledAt.toLocaleDateString("ko-KR", {
              month: "2-digit",
              day: "2-digit",
              timeZone: "Asia/Seoul",
            })
          : "—";

        // 결과 판정
        let resultNode: React.ReactNode;
        if (m.status === "live") {
          resultNode = (
            <span className="badge badge--soft">LIVE</span>
          );
        } else if (myScore > oppScore) {
          resultNode = <span className="badge badge--ok">W</span>;
        } else if (myScore < oppScore) {
          resultNode = (
            <span
              className="badge"
              style={{
                background: "var(--ink-dim)",
                color: "#fff",
                borderColor: "transparent",
              }}
            >
              L
            </span>
          );
        } else {
          // 0-0 또는 동점 — 공식 기록이어도 라벨 "-"
          resultNode = (
            <span style={{ color: "var(--ink-mute)", fontSize: 12 }}>—</span>
          );
        }

        return (
          // 4단계 C: 행 전체 Link → RecentTabRow (클라 래퍼) 변경. 부모 행 router.push + 자식 TeamLink 가능.
          <RecentTabRow
            key={m.id.toString()}
            href={href}
            className="board__row data-table__row"
            style={{ gridTemplateColumns: gridColumns, color: "inherit" }}
          >
            {/* 날짜 — data-label "날짜" / ff-mono 12px */}
            <div
              data-label="날짜"
              style={{ fontFamily: "var(--ff-mono)", fontSize: 12 }}
            >
              {dateLabel}
            </div>
            {/* 상대 — data-primary 모바일 카드 제목 */}
            {/* 4단계 C: 상대팀명 → TeamLink. teamId 없으면 자동 span fallback ("미정" 케이스) */}
            <div data-primary="true" className="title">
              <TeamLink
                teamId={oppTeamId}
                name={oppName}
                onClick={(e) => e.stopPropagation()}
                style={{ fontWeight: 600 }}
              />
            </div>
            {/* 스코어 — data-label "스코어" / ff-mono 700 */}
            <div
              data-label="스코어"
              style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}
            >
              {myScore} : {oppScore}
            </div>
            {/* 결과 — data-label "결과" / W badge--ok / L 다크 filled / LIVE soft / 동점 — */}
            <div data-label="결과">{resultNode}</div>
            {/* 대회 — data-label "대회" / 12px muted */}
            <div
              data-label="대회"
              style={{ fontSize: 12, color: "var(--ink-mute)" }}
              className="truncate"
            >
              {tournamentName}
            </div>
          </RecentTabRow>
        );
      })}
    </div>
  );
}

/**
 * computeRecentForm
 * ─────────────────────────────────────────────────────────
 * 사이드 카드 "최근 폼" 5칸 계산용 헬퍼.
 * page.tsx에서 team-side-card-v2에 W/L 배열을 주입할 때 사용.
 * 별도 유틸 파일을 만들 만큼의 로직은 아니라 본 파일에서 export.
 */
export async function computeRecentForm(teamId: bigint): Promise<("W" | "L" | "-")[]> {
  const tournamentTeams = await prisma.tournamentTeam
    .findMany({ where: { teamId }, select: { id: true } })
    .catch(() => []);
  const ttIds = tournamentTeams.map((tt) => tt.id);
  if (ttIds.length === 0) return [];

  const matches = await prisma.tournamentMatch
    .findMany({
      where: officialMatchWhere({
        OR: [{ homeTeamId: { in: ttIds } }, { awayTeamId: { in: ttIds } }],
      }),
      select: {
        homeTeamId: true,
        awayTeamId: true,
        homeScore: true,
        awayScore: true,
        scheduledAt: true,
        status: true,
      },
      orderBy: { scheduledAt: "desc" },
      take: 5,
    })
    .catch(() => []);

  // 최신순 그대로 (시안은 최신이 왼쪽). 계산 시점 기준 5건.
  return matches.map((m): "W" | "L" | "-" => {
    const isHome = m.homeTeamId !== null && ttIds.some((id) => id === m.homeTeamId);
    const myScore = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0;
    const oppScore = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0;
    if (myScore > oppScore) return "W";
    if (myScore < oppScore) return "L";
    return "-";
  });
}
