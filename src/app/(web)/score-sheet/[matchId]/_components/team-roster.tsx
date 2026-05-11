/**
 * 좌(홈) / 우(어웨이) 팀 명단 카드 컴포넌트.
 *
 * 2026-05-11 — Phase 1-B-2 신규.
 *
 * 표시 규칙 (사용자 결재 / planner §5):
 *   - 등번호 · 표시명 (player_name 또는 user.nickname)
 *   - 사전 라인업 (PR1~5) 가 있으면 starters[5] = "선발" 강조 (◉) / substitutes[7] = 정상
 *   - 라인업 0건 매치 = 전체 명단 정상 표시 + 안내 ("사전 라인업 미입력")
 *   - 캡틴/매니저 표시 = role === "captain" 시 (★)
 *
 * Phase 1-B-2 범위 (사용자 결재 = Phase 1+2 MVP / 본 PR = MVP 마지막):
 *   - 선수별 boxscore stat 입력은 Phase 2 (별도 PR) — 본 컴포넌트는 명단 표시만.
 *   - manual roster 입력 (라인업 미입력 매치) = 본 컴포넌트는 read-only / 추후 별도 PR.
 */

"use client";

export interface RosterItem {
  tournamentTeamPlayerId: string; // bigint → string
  jerseyNumber: number | null;
  role: string | null;
  displayName: string;
  userId: string | null;
  isStarter: boolean; // 사전 라인업 starters[] 포함 여부
  isInLineup: boolean; // starters + substitutes 합집합 포함 여부
}

export interface TeamRosterData {
  teamSide: "home" | "away";
  teamName: string;
  tournamentTeamId: string | null;
  hasConfirmedLineup: boolean;
  players: RosterItem[];
}

interface TeamRosterProps {
  data: TeamRosterData;
}

export function TeamRoster({ data }: TeamRosterProps) {
  const sideLabel = data.teamSide === "home" ? "홈" : "원정";
  const sideColor =
    data.teamSide === "home" ? "var(--color-primary)" : "var(--color-info)";

  return (
    <div
      className="rounded-[12px] p-4"
      style={{
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* 헤더 — 팀명 + 사이드 라벨 + 라인업 상태 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-[4px] px-2 py-1 text-xs font-medium text-white"
            style={{ backgroundColor: sideColor }}
          >
            {sideLabel}
          </span>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            {data.teamName}
          </h3>
        </div>
        {data.hasConfirmedLineup ? (
          <span className="text-xs text-[var(--color-success)]">
            ✓ 사전 라인업
          </span>
        ) : (
          <span className="text-xs text-[var(--color-text-muted)]">
            라인업 미입력
          </span>
        )}
      </div>

      {/* 명단 표 */}
      {data.players.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">
          {data.tournamentTeamId
            ? "등록된 선수가 없습니다."
            : "팀이 아직 배정되지 않은 경기입니다."}
        </p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
              <th className="w-10 py-2 text-center">#</th>
              <th className="w-10 py-2 text-center">선발</th>
              <th className="py-2 text-left">선수명</th>
            </tr>
          </thead>
          <tbody>
            {data.players.map((p) => (
              <tr
                key={p.tournamentTeamPlayerId}
                className="border-b border-[var(--color-border-light,var(--color-border))]"
              >
                <td className="py-2 text-center text-[var(--color-text-primary)]">
                  {p.jerseyNumber ?? "—"}
                </td>
                <td className="py-2 text-center">
                  {/* 사전 라인업 starters → ◉ 표시 (Material Symbols Outlined 미사용 — 가독성 우선) */}
                  {p.isStarter ? (
                    <span style={{ color: sideColor }}>◉</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">○</span>
                  )}
                </td>
                <td className="py-2 text-[var(--color-text-primary)]">
                  {p.displayName}
                  {p.role === "captain" && (
                    <span className="ml-1 text-[var(--color-warning)]">★</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
