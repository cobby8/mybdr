// 조별리그 순위표 컴포넌트
// Group A/B/C/D 탭 + 팀별 순위 테이블
// 시안: bdr_3(라이트) 참조 - 빨간 세로 막대 + 그룹 탭 + ADVANCED 배지

"use client";

import { useState, useMemo } from "react";
// 5/10 PlayerLink/TeamLink 3-A 단계 — 팀명 클릭 시 팀 페이지 이동 (글로벌 패턴 통일).
import { TeamLink } from "@/components/links/team-link";

// DB에서 가져온 팀 데이터 타입
export type GroupTeam = {
  id: string;
  teamId: string; // Team 테이블의 실제 id (팀 페이지 링크용)
  teamName: string;
  groupName: string | null;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifference: number;
};

type GroupStandingsProps = {
  teams: GroupTeam[];
  // 2026-05-15 — advancedCount prop deprecated (ADVANCED 뱃지 삭제됨 / 호환 위해 남김)
  advancedCount?: number;
};

export function GroupStandings({
  teams,
}: GroupStandingsProps) {
  // 그룹별로 팀을 분류
  const groups = useMemo(() => {
    const map = new Map<string, GroupTeam[]>();
    for (const t of teams) {
      const key = t.groupName ?? "미배정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // 2026-05-15 — 농구 정렬: 승수 desc → 득실차 desc (승점/무승부 미사용 — 사용자 결정)
    for (const [, groupTeams] of map) {
      groupTeams.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.pointDifference - a.pointDifference;
      });
    }
    // 그룹명 알파벳 순 정렬
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [teams]);

  const groupNames = Array.from(groups.keys());
  const [activeGroup, setActiveGroup] = useState(groupNames[0] ?? "");

  // 그룹 데이터가 없으면 표시하지 않음
  if (groupNames.length === 0) return null;

  const activeTeams = groups.get(activeGroup) ?? [];

  return (
    <section className="mb-12">
      {/* 섹션 헤더 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          {/* 빨간 세로 막대 */}
          <span
            className="w-1.5 h-6 rounded-sm"
            style={{ backgroundColor: "var(--color-primary)" }}
          />
          조별리그 순위표 (Group Stage)
        </h3>

        {/* 그룹 탭 */}
        <div
          className="flex p-1 rounded"
          style={{ backgroundColor: "var(--color-surface)" }}
        >
          {groupNames.map((name) => (
            <button
              key={name}
              onClick={() => setActiveGroup(name)}
              className="px-4 py-1.5 text-xs font-bold transition-all rounded"
              style={{
                backgroundColor:
                  activeGroup === name
                    ? "var(--color-card)"
                    : "transparent",
                color:
                  activeGroup === name
                    ? "var(--color-text-primary)"
                    : "var(--color-text-muted)",
                boxShadow:
                  activeGroup === name ? "var(--shadow-card)" : "none",
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {/* 순위 테이블
          2026-05-15 사용자 결정: 무/승점 컬럼 삭제 (농구 무승부 없음 / 승점 의미 없음).
                                  ADVANCED 뱃지 삭제 (advancedCount 자동 판정 부정확).
                                  가로 스크롤 제거 (컬럼 5개 = 모바일 fit). */}
      <div
        className="rounded overflow-hidden"
        style={{
          backgroundColor: "var(--color-card)",
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-xs font-bold uppercase tracking-widest"
              style={{
                backgroundColor: "var(--color-surface)",
                color: "var(--color-text-muted)",
                borderBottom: "1px solid var(--color-border)",
              }}
            >
              <th className="px-3 py-4 sm:px-6">순위</th>
              <th className="px-3 py-4 sm:px-6">팀명</th>
              <th className="px-2 py-4 text-center sm:px-6">경기</th>
              <th
                className="px-2 py-4 text-center sm:px-6"
                style={{ color: "var(--color-primary)" }}
              >
                승
              </th>
              <th className="px-2 py-4 text-center sm:px-6">패</th>
              <th className="px-2 py-4 text-center sm:px-6">득실차</th>
            </tr>
          </thead>
          <tbody>
            {activeTeams.map((team, idx) => {
              const rank = idx + 1;
              const totalGames = team.wins + team.losses + team.draws;

              return (
                <tr
                  key={team.id}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid var(--color-border)",
                  }}
                >
                  {/* 순위 */}
                  <td
                    className="px-3 py-4 font-bold sm:px-6"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {String(rank).padStart(2, "0")}
                  </td>

                  {/* 팀명 */}
                  <td className="px-3 py-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      {/* 팀 아이콘 placeholder */}
                      <div
                        className="w-8 h-8 rounded flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: "var(--color-surface)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined text-xs"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          shield
                        </span>
                      </div>
                      <TeamLink
                        teamId={team.teamId}
                        name={team.teamName}
                        className="font-bold"
                        style={{ color: "var(--color-text-primary)" }}
                      />
                    </div>
                  </td>

                  {/* 경기 수 */}
                  <td
                    className="px-2 py-4 text-center font-medium sm:px-6"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {totalGames}
                  </td>

                  {/* 승 */}
                  <td
                    className="px-2 py-4 text-center font-bold sm:px-6"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {team.wins}
                  </td>

                  {/* 패 */}
                  <td
                    className="px-2 py-4 text-center sm:px-6"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {team.losses}
                  </td>

                  {/* 득실차 */}
                  <td
                    className="px-2 py-4 text-center sm:px-6"
                    style={{ color: "var(--color-text-secondary)" }}
                  >
                    {team.pointDifference > 0
                      ? `+${team.pointDifference}`
                      : team.pointDifference === 0
                        ? "0"
                        : String(team.pointDifference)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
