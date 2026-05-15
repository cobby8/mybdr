/**
 * 2026-05-16 PR-Public-1 — 종별 조편성 표 (시안 사진 1 패턴).
 *
 * 이유(왜):
 *   - 강남구협회장배 같은 다종별 + 조별 풀리그 대회의 공개 페이지에서
 *     "어느 팀이 어느 조 소속인지" 한눈에 보여주는 카드.
 *   - GroupStandings (web 기존) 는 승/패/득실차 중심 = 시즌 결과 표시용.
 *     이 컴포넌트는 "대회 시작 전/예선 진행 중" 시점 조편성 시각화 (정적).
 *
 * 입력:
 *   - division: 종별 코드 (예: "i3-U9") — 헤더 라벨용
 *   - divisionLabel: 종별 표시명 (예: "초3 U9")
 *   - groupTeams: 해당 종별 팀 (이미 부모에서 division 필터링됨)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 헤더 / var(--color-card) 배경 / rounded-[4px]
 *   - material-symbols-outlined 만 / lucide-react ❌
 *   - 모바일 세로 스택 / PC 2컬럼 grid (조 ≥2 시)
 */

"use client";

import { useMemo } from "react";
import { TeamLink } from "@/components/links/team-link";
import type { GroupTeam } from "../bracket/_components/group-standings";

type Props = {
  divisionLabel: string;
  groupTeams: GroupTeam[];
};

export function DivisionGroupComposition({ divisionLabel, groupTeams }: Props) {
  // 그룹별 팀 분류 + 정렬 (그룹명 알파벳순)
  // useMemo = teams 배열 변경 시만 재계산 (parent re-render 보호)
  const groups = useMemo(() => {
    const map = new Map<string, GroupTeam[]>();
    for (const t of groupTeams) {
      const key = t.groupName ?? "미배정";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    // 조 안 팀 정렬 = 시드 번호 없음 → 팀명 알파벳순 (조편성 단계 = 결과 무관)
    for (const [, teams] of map) {
      teams.sort((a, b) => a.teamName.localeCompare(b.teamName, "ko-KR"));
    }
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [groupTeams]);

  const groupNames = Array.from(groups.keys());

  // 팀 0건이면 미렌더 (조편성 박제 전 / 회귀 0)
  if (groupNames.length === 0) return null;

  return (
    <section>
      {/* 섹션 헤더 — 종별 라벨 + "조편성" */}
      <div className="mb-4 flex items-center gap-2">
        <span
          className="w-1.5 h-6 rounded-sm"
          style={{ backgroundColor: "var(--color-info)" }}
          aria-hidden="true"
        />
        <h3
          className="text-base font-bold sm:text-lg"
          style={{ color: "var(--color-text-primary)" }}
        >
          {divisionLabel} · 조편성
        </h3>
        <span
          className="ml-2 rounded-[4px] px-2 py-0.5 text-xs"
          style={{
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-muted)",
          }}
        >
          {groupNames.length}개 조 · {groupTeams.length}팀
        </span>
      </div>

      {/* 조별 카드 grid — 모바일 1컬럼 / PC 2컬럼 (조 2개 이상 시 가로 활용) */}
      <div className="grid gap-4 sm:grid-cols-2">
        {groupNames.map((groupName) => {
          const teams = groups.get(groupName) ?? [];
          return (
            <div
              key={groupName}
              className="rounded-[4px] border overflow-hidden"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-card)",
              }}
            >
              {/* 조 헤더 — Navy 배경 + 조명 */}
              <div
                className="px-4 py-2.5 text-sm font-bold"
                style={{
                  backgroundColor: "var(--color-info)",
                  color: "#fff",
                }}
              >
                {groupName}조 ({teams.length}팀)
              </div>

              {/* 팀 리스트 — 시드 번호 + 팀명 (시안 사진 1 패턴) */}
              <ul>
                {teams.map((team, idx) => (
                  <li
                    key={team.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{
                      borderTop:
                        idx === 0 ? "none" : "1px solid var(--color-border)",
                    }}
                  >
                    {/* 시드 번호 (조 안 순서) — 모노 폰트 / 콤팩트 */}
                    <span
                      className="font-mono text-xs tabular-nums w-6 text-right"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </span>

                    {/* 팀 로고 또는 이니셜 — group-standings.tsx 와 동일 패턴 */}
                    {team.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.logoUrl}
                        alt={team.teamName}
                        className="w-7 h-7 rounded object-cover shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        {team.teamName.charAt(0)}
                      </div>
                    )}

                    {/* 팀명 — TeamLink (글로벌 패턴) */}
                    <TeamLink
                      teamId={team.teamId}
                      name={team.teamName}
                      className="font-medium text-sm flex-1 min-w-0 truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
