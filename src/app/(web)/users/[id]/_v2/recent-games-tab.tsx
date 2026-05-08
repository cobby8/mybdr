/* ============================================================
 * RecentGamesTab — /users/[id] v2 "최근 경기" 탭
 *
 * 5/9 NBA 스타일 개선:
 * - board__row 6열 단순 행 → PlayerMatchCard 카드형 (대회상세 ScheduleTimeline 패턴)
 * - 카드 상단: 매치코드/라운드/시간/코트 + 상태 뱃지
 * - 카드 중앙: 홈팀 로고+이름 vs 스코어박스 vs 어웨이팀 이름+로고
 * - 카드 하단: 본인 기록 줄 (22 PTS · 14 REB · 3 AST · 2 STL [W])
 * - 카드 클릭 → /live/[matchId] (대회상세와 라우팅 일관)
 *
 * 빈 상태:
 * - 매치 0건 → "최근 경기 기록이 없습니다." 안내
 *
 * 모바일:
 * - 카드 1열 (PlayerMatchCard 자체가 모바일 720px 분기 내장)
 * - 본인 기록 줄 4 stat 만 (5+ stat 시 줄바꿈 위험 회피)
 * ============================================================ */

import { PlayerMatchCard, type PlayerMatchCardProps } from "@/components/match/PlayerMatchCard";

export interface RecentGamesTabProps {
  /** PlayerMatchCardProps 그대로 전달 (page.tsx 변환 로직에서 매핑) */
  matches: PlayerMatchCardProps[];
}

export function RecentGamesTab({ matches }: RecentGamesTabProps) {
  // 빈 상태 — 매치 0건 또는 모두 NULL
  if (matches.length === 0) {
    return (
      <div className="card" style={{ padding: "36px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--ink-mute)", fontSize: 13, margin: 0 }}>
          최근 경기 기록이 없습니다.
        </p>
      </div>
    );
  }

  // 카드 목록 — flex column gap=10 (대회상세는 grid md:2열이지만 본 페이지는 1열로 단순화 — 본인 기록 줄 가독성 ↑)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {matches.map((m) => (
        <PlayerMatchCard key={m.matchId} {...m} />
      ))}
    </div>
  );
}
