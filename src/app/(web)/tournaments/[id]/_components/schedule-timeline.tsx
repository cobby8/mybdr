"use client";

/**
 * 일정 카드 뷰 + 팀별 필터
 * - 상단: 팀 필터 버튼 가로 스크롤
 * - 본문: 날짜별 그룹 > 카드 목록 (시간+라운드명+상태 | 홈팀 스코어 어웨이팀)
 * - 선택 팀 경기 하이라이트 (왼쪽 primary 보더)
 */

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatShortTime, formatGroupDate } from "@/lib/utils/format-date";

// -- 타입 정의: 서버에서 넘겨받을 경기 데이터 구조 --
export interface ScheduleMatch {
  id: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  // 2026-05-02: 일정 탭 매치 카드 팀 로고 (TBD/예정 매치 또는 logoUrl 미등록 팀은 null)
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  roundName: string | null;
  scheduledAt: string | null; // ISO 문자열로 직렬화됨
  courtNumber: string | null;
}

export interface ScheduleTeam {
  id: string;
  name: string;
}

interface Props {
  matches: ScheduleMatch[];
  teams: ScheduleTeam[];
}

// -- 날짜별로 경기를 그룹핑하는 유틸 --
function groupByDate(matches: ScheduleMatch[]): Map<string, ScheduleMatch[]> {
  const groups = new Map<string, ScheduleMatch[]>();

  for (const match of matches) {
    // 날짜가 없으면 "일정 미정" 그룹으로, 있으면 간결한 포맷 사용
    const dateKey = formatGroupDate(match.scheduledAt);

    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(match);
  }

  return groups;
}

// -- 시간 포맷: 공통 유틸 사용 (format-date.ts의 formatShortTime) --

// -- 팀 로고 (24px mobile / 28px desktop, 원형, contain) --
// 왜 이런 구조? 16팀 PNG 가 이미 512×512 padding 정규화된 상태이므로 contain 사용이
// 잘림 0 + 비율 보존 + 일관 표시를 동시에 만족. logoUrl 없으면 회색 원 + 팀명 첫 글자.
// img 태그 직접 사용 — Next/Image 의 도메인 화이트리스트 제약 회피 + 외부 이미지 비대상.
function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string | null }) {
  // 첫 글자 fallback: 한글/영문 모두 1자만. 팀명 없으면 "·" placeholder.
  const initial = name && name.length > 0 ? name.charAt(0) : "·";

  return (
    <span
      // h/w 24px 모바일, sm:28px 데스크톱. flex-shrink-0 으로 팀명 길어져도 로고 축소 방지
      className="flex h-6 w-6 flex-shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-7 sm:w-7"
      style={{
        // 옅은 회색 보더 (다크모드에서도 자연스럽도록 토큰 사용)
        border: "1px solid var(--color-border)",
        // 로고 없을 때 fallback 배경
        backgroundColor: logoUrl ? "var(--color-surface)" : "var(--color-elevated)",
      }}
      aria-hidden="true"
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt=""
          // contain — 비율 보존 + 잘림 0 (PNG 가 8% padding 정규화되어 있음)
          className="h-full w-full object-contain"
          loading="lazy"
        />
      ) : (
        // logoUrl null 일 때 첫 글자 표시 (TBD/예정 또는 미등록 팀)
        <span
          className="text-[10px] font-bold sm:text-xs"
          style={{ color: "var(--color-text-tertiary)", fontFamily: "var(--font-heading)" }}
        >
          {initial}
        </span>
      )}
    </span>
  );
}

// -- 상태 배지 렌더링 --
function StatusBadge({ status }: { status: string | null }) {
  if (status === "completed") {
    return <Badge variant="info">종료</Badge>;
  }
  if (status === "live" || status === "in_progress") {
    return <Badge variant="error">LIVE</Badge>;
  }
  return <Badge variant="default">예정</Badge>;
}

export function ScheduleTimeline({ matches, teams }: Props) {
  // 선택된 팀 ID (null = 전체 보기)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  // 선택된 팀으로 필터링된 경기 목록
  const filteredMatches = useMemo(() => {
    if (!selectedTeam) return matches;
    // 팀 이름으로 필터 (선택한 팀이 홈 또는 어웨이인 경기)
    const teamName = teams.find((t) => t.id === selectedTeam)?.name;
    if (!teamName) return matches;
    return matches.filter(
      (m) => m.homeTeamName === teamName || m.awayTeamName === teamName
    );
  }, [matches, selectedTeam, teams]);

  // 날짜별 그룹핑
  const dateGroups = useMemo(() => groupByDate(filteredMatches), [filteredMatches]);

  // 선택된 팀 이름 (하이라이트용)
  const selectedTeamName = selectedTeam
    ? teams.find((t) => t.id === selectedTeam)?.name ?? null
    : null;

  return (
    <div>
      {/* 팀 필터 버튼 그룹: 가로 스크롤 */}
      {teams.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {/* "전체" 버튼 */}
          <button
            onClick={() => setSelectedTeam(null)}
            className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all"
            style={{
              backgroundColor: selectedTeam === null ? "var(--color-primary)" : "var(--color-elevated)",
              color: selectedTeam === null ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${selectedTeam === null ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            전체
          </button>
          {/* 각 팀 버튼 */}
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => setSelectedTeam(team.id === selectedTeam ? null : team.id)}
              className="flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all"
              style={{
                backgroundColor: selectedTeam === team.id ? "var(--color-primary)" : "var(--color-elevated)",
                color: selectedTeam === team.id ? "white" : "var(--color-text-secondary)",
                border: `1px solid ${selectedTeam === team.id ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
            >
              {team.name}
            </button>
          ))}
        </div>
      )}

      {/* 날짜별 타임라인 */}
      {dateGroups.size === 0 && (
        <div
          className="rounded-[var(--radius-card)] border p-8 text-center"
          style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-card)", color: "var(--color-text-muted)" }}
        >
          {selectedTeam ? "선택한 팀의 일정이 없습니다." : "일정이 없습니다."}
        </div>
      )}

      <div className="space-y-8">
        {Array.from(dateGroups.entries()).map(([dateLabel, dayMatches]) => (
          <div key={dateLabel}>
            {/* 날짜 헤더 */}
            <div className="mb-4 flex items-center gap-3">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <h2
                className="text-base font-bold"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {dateLabel}
              </h2>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {dayMatches.length}경기
              </span>
            </div>

            {/* 경기 카드 목록 — 타임라인 제거, 시간을 카드 내부로 이동 */}
            <div className="space-y-3">
              {dayMatches.map((match) => {
                // 이 경기에 선택된 팀이 참여하는지 확인 (하이라이트용)
                const isHighlighted =
                  selectedTeamName !== null &&
                  (match.homeTeamName === selectedTeamName || match.awayTeamName === selectedTeamName);

                // 홈/어웨이 중 이긴 쪽 판별 (종료 경기만)
                const isCompleted = match.status === "completed";
                const homeWins = isCompleted && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                const awayWins = isCompleted && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                return (
                  <Link
                    key={match.id}
                    href={`/live/${match.id}`}
                    className="block rounded-lg border p-4 transition-all hover:opacity-80"
                    style={{
                      borderColor: isHighlighted ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      borderLeftWidth: isHighlighted ? "3px" : undefined,
                      borderLeftColor: isHighlighted ? "var(--color-primary)" : undefined,
                    }}
                  >
                    {/* 카드 상단: 시간 + 라운드명 + 코트 + 상태 배지 */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* 시간 표시 — 기존 왼쪽 타임라인에서 카드 내부로 이동 */}
                        <span
                          className="text-xs font-bold"
                          style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-heading)" }}
                        >
                          {formatShortTime(match.scheduledAt)}
                        </span>
                        {/* 시간과 라운드명 사이 구분선 */}
                        {(match.roundName || match.courtNumber) && (
                          <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                        )}
                        {match.roundName && (
                          <span
                            className="text-xs font-medium"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {match.roundName}
                          </span>
                        )}
                        {match.courtNumber && (
                          <span
                            className="text-xs"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {match.courtNumber}코트
                          </span>
                        )}
                      </div>
                      <StatusBadge status={match.status} />
                    </div>

                    {/* 카드 하단: 팀 VS 팀 + 스코어 (기존 로직 유지)
                        2026-05-02: 팀명 좌/우에 로고 inline 추가 (홈은 좌측, 어웨이는 우측 = 안쪽 spectroscope 로고 → 팀명 → 가운데 스코어 → 팀명 → 로고). 모바일에서도 24px 로 공간 영향 최소. */}
                    <div className="flex items-center justify-between">
                      {/* 홈팀: 로고(좌) + 팀명 — gap-2 (8px) 로 시안 일관 */}
                      <div className="flex flex-1 items-center gap-2 text-left">
                        <TeamLogo
                          logoUrl={match.homeTeamLogoUrl}
                          name={match.homeTeamName}
                        />
                        <span
                          className="truncate text-sm font-bold"
                          style={{
                            color: homeWins
                              ? "var(--color-text-primary)"
                              : isCompleted
                              ? "var(--color-text-secondary)"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {match.homeTeamName ?? "TBD"}
                        </span>
                      </div>

                      {/* 스코어 or VS */}
                      <div className="mx-3 flex-shrink-0">
                        {isCompleted || match.status === "live" || match.status === "in_progress" ? (
                          <div
                            className="flex items-center gap-1 rounded-full px-3 py-1"
                            style={{ backgroundColor: "var(--color-elevated)" }}
                          >
                            <span
                              className="text-sm font-bold"
                              style={{ fontFamily: "var(--font-heading)", color: homeWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                            >
                              {match.homeScore ?? 0}
                            </span>
                            <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>:</span>
                            <span
                              className="text-sm font-bold"
                              style={{ fontFamily: "var(--font-heading)", color: awayWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                            >
                              {match.awayScore ?? 0}
                            </span>
                          </div>
                        ) : (
                          <span
                            className="rounded-full px-3 py-1 text-xs font-bold"
                            style={{
                              backgroundColor: "var(--color-primary)",
                              color: "white",
                            }}
                          >
                            VS
                          </span>
                        )}
                      </div>

                      {/* 어웨이팀: 팀명 + 로고(우) — justify-end 로 스코어 쪽으로 붙임 */}
                      <div className="flex flex-1 items-center justify-end gap-2 text-right">
                        <span
                          className="truncate text-sm font-bold"
                          style={{
                            color: awayWins
                              ? "var(--color-text-primary)"
                              : isCompleted
                              ? "var(--color-text-secondary)"
                              : "var(--color-text-primary)",
                          }}
                        >
                          {match.awayTeamName ?? "TBD"}
                        </span>
                        <TeamLogo
                          logoUrl={match.awayTeamLogoUrl}
                          name={match.awayTeamName}
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
