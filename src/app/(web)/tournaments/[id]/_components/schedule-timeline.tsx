"use client";

/**
 * 일정 카드 뷰 + 팀별 필터
 * - 상단: 팀 필터 버튼 가로 스크롤
 * - 본문: 날짜별 그룹 > 카드 목록 (시간+라운드명+상태 | 홈팀 스코어 어웨이팀)
 * - 선택 팀 경기 하이라이트 (왼쪽 primary 보더)
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { formatShortTime, formatGroupDate, formatGroupDateShort } from "@/lib/utils/format-date";
// 4단계 C — 일정 카드 양 팀명 → 팀페이지 TeamLink (nested anchor 회피 위해 카드 전체 router.push 변경)
import { TeamLink } from "@/components/links/team-link";

// -- 타입 정의: 서버에서 넘겨받을 경기 데이터 구조 --
export interface ScheduleMatch {
  id: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  // 4단계 C: 팀 ID — 일정 카드 팀명 클릭 시 팀페이지 이동용. TBD 매치는 null → 자동 span fallback.
  homeTeamId: string | null;
  awayTeamId: string | null;
  // 2026-05-02: 일정 탭 매치 카드 팀 로고 (TBD/예정 매치 또는 logoUrl 미등록 팀은 null)
  homeTeamLogoUrl: string | null;
  awayTeamLogoUrl: string | null;
  // 2026-05-02: 팀 미확정 슬롯 라벨 (예: "A조 1경기 패자" / "8강 1경기 승자")
  // 팀 확정 시 무시됨. settings.homeSlotLabel/awaySlotLabel 출처.
  homeSlotLabel?: string | null;
  awaySlotLabel?: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  roundName: string | null;
  scheduledAt: string | null; // ISO 문자열로 직렬화됨
  courtNumber: string | null;
  // 2026-05-02: 일정 카드 콤팩트 + 매치번호/조 표시 (사용자 요청)
  matchNumber?: number | null;
  groupName?: string | null;
  // Phase 5 (매치 코드 v4) — 글로벌 매치 식별 코드 (NULL 가능)
  // 형식: `26-GG-MD21-001` (14자 영숫자) — 대회 short_code/region_code 미부여 시 null
  // 카드 매치번호 자리에 우선 표시, NULL 이면 기존 #매치번호 fallback
  matchCode?: string | null;
  // 2026-05-15 — 강남구협회장배 6 종별 × 2 체육관 분리 UI (PR-G3).
  //   division: settings.division_code (예: "i2-U11"). null = 종별 미부여 (단일 종별 대회).
  //   venueName: tournament_match.venue_name (예: "수도공고"). null = 체육관 미부여.
  //   둘 다 옵셔널 — 일반 대회 (단일 종별 / 단일 체육관) 회귀 0.
  division?: string | null;
  venueName?: string | null;
}

// 종별 색상 매핑 — 6 종별 가시성 (BDR 토큰 우선, primary/info/success/warning/secondary 분산)
// 사유: 종별 카드 좌측 border 색상 분리 — 동일 종별 시각 군집화.
// `getDivisionColorVar(code)` = 결정적 (입력 동일 = 출력 동일) — 캐시 무관.
// 토큰만 사용 (하드코딩 hex 0 / CLAUDE.md 13 룰 준수).
const DIVISION_COLOR_TOKENS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "var(--color-info)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-accent)",
];
export function getDivisionColorVar(code: string | null | undefined): string | null {
  if (!code) return null;
  // 결정적 hash — 코드 첫 글자 charCode + 길이 합산 % 6
  let sum = 0;
  for (let i = 0; i < code.length; i++) sum += code.charCodeAt(i);
  return DIVISION_COLOR_TOKENS[sum % DIVISION_COLOR_TOKENS.length];
}

export interface ScheduleTeam {
  id: string;
  name: string;
}

interface Props {
  matches: ScheduleMatch[];
  teams: ScheduleTeam[];
  // 2026-05-09 사용자 결정: 날짜 탭 자체 관리 (팀 필터 chip 위 row).
  // 외부에서도 selectedDate prop 전달 가능 (controlled — 미전달 시 자체 state).
  selectedDate?: string | null;
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

// -- 팀 로고 (32px mobile / 36px desktop, 원형, contain) --
// 왜 이런 구조? 16팀 PNG 가 이미 512×512 padding 정규화된 상태이므로 contain 사용이
// 잘림 0 + 비율 보존 + 일관 표시를 동시에 만족. logoUrl 없으면 회색 원 + 팀명 첫 글자.
// img 태그 직접 사용 — Next/Image 의 도메인 화이트리스트 제약 회피 + 외부 이미지 비대상.
// 2026-05-02 사용자 요청: 24/28 → 32/36 (약 30% 확대) — 팀 식별 가독성 강화
function TeamLogo({ logoUrl, name }: { logoUrl: string | null; name: string | null }) {
  // 첫 글자 fallback: 한글/영문 모두 1자만. 팀명 없으면 "·" placeholder.
  const initial = name && name.length > 0 ? name.charAt(0) : "·";

  return (
    <span
      // h/w 32px 모바일, sm:36px 데스크톱. flex-shrink-0 으로 팀명 길어져도 로고 축소 방지
      className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-9 sm:w-9"
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
        // 폰트도 로고 확대에 맞춰 키움 (xs/sm)
        <span
          className="text-xs font-bold sm:text-sm"
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

export function ScheduleTimeline({ matches, teams, selectedDate: selectedDateProp }: Props) {
  // 4단계 C: 카드 전체 Link → router.push 로 변경 (TeamLink 와 nested anchor 회피)
  const router = useRouter();
  // 선택된 팀 ID (null = 전체 보기)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  // 5/9 사용자 결정: 날짜 탭 자체 state (controlled prop 우선 / fallback 자체 관리)
  const [selectedDateState, setSelectedDateState] = useState<string | null>(null);
  const selectedDate = selectedDateProp !== undefined ? selectedDateProp : selectedDateState;

  // 2026-05-15 — 종별 / 체육관 필터 (강남구협회장배 6 종별 × 2 체육관 분리)
  //   동시 적용 가능: 종별=i2-U11 + venue=강남구민체육관 = 교집합.
  //   매치 데이터에 종별/체육관 1개 이하 → 해당 필터 row 자체 미표시 (회귀 0).
  const [selectedDivision, setSelectedDivision] = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

  // 매치들에서 unique 날짜 추출 — key (풀 텍스트) + short (탭 표시용) 페어
  const uniqueDates: { key: string; short: string }[] = useMemo(() => {
    const seen = new Set<string>();
    const order: { key: string; short: string }[] = [];
    const sorted = [...matches].sort((a, b) => {
      const ta = a.scheduledAt ? new Date(a.scheduledAt).getTime() : Infinity;
      const tb = b.scheduledAt ? new Date(b.scheduledAt).getTime() : Infinity;
      return ta - tb;
    });
    for (const m of sorted) {
      const key = formatGroupDate(m.scheduledAt);
      if (!seen.has(key)) {
        seen.add(key);
        order.push({ key, short: formatGroupDateShort(m.scheduledAt) });
      }
    }
    return order;
  }, [matches]);

  // 종별 / 체육관 unique 추출 (필터 chip row 표시 조건 — 2개 이상일 때만 노출)
  const uniqueDivisions = useMemo(
    () => Array.from(new Set(matches.map((m) => m.division ?? null).filter((d): d is string => !!d))).sort(),
    [matches],
  );
  const uniqueVenues = useMemo(
    () => Array.from(new Set(matches.map((m) => m.venueName ?? null).filter((v): v is string => !!v))).sort(),
    [matches],
  );

  // 선택된 팀 + 날짜 + 종별 + 체육관 필터 적용
  const filteredMatches = useMemo(() => {
    let filtered = matches;
    // 팀 필터
    if (selectedTeam) {
      const teamName = teams.find((t) => t.id === selectedTeam)?.name;
      if (teamName) {
        filtered = filtered.filter(
          (m) => m.homeTeamName === teamName || m.awayTeamName === teamName
        );
      }
    }
    // 날짜 필터 (selectedDate = formatGroupDate 풀 텍스트 / null = 전체)
    if (selectedDate) {
      filtered = filtered.filter(
        (m) => formatGroupDate(m.scheduledAt) === selectedDate
      );
    }
    // 2026-05-15 — 종별 필터
    if (selectedDivision) {
      filtered = filtered.filter((m) => m.division === selectedDivision);
    }
    // 2026-05-15 — 체육관 필터
    if (selectedVenue) {
      filtered = filtered.filter((m) => m.venueName === selectedVenue);
    }
    return filtered;
  }, [matches, selectedTeam, selectedDate, selectedDivision, selectedVenue, teams]);

  // 날짜별 그룹핑
  const dateGroups = useMemo(() => groupByDate(filteredMatches), [filteredMatches]);

  // 선택된 팀 이름 (하이라이트용)
  const selectedTeamName = selectedTeam
    ? teams.find((t) => t.id === selectedTeam)?.name ?? null
    : null;

  return (
    <div>
      {/* 2026-05-15 — 종별 필터 (강남구협회장배 6 종별 × 2 체육관 분리 UI / PR-G3).
          종별 2개 이상일 때만 노출 — 단일 종별 대회 회귀 0. 색상 = getDivisionColorVar 결정. */}
      {uniqueDivisions.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            종별:
          </span>
          <button
            type="button"
            onClick={() => setSelectedDivision(null)}
            className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedDivision === null ? "var(--color-info)" : "var(--color-elevated)",
              color: selectedDivision === null ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${selectedDivision === null ? "var(--color-info)" : "var(--color-border)"}`,
            }}
          >
            전체 ({matches.length})
          </button>
          {uniqueDivisions.map((code) => {
            const count = matches.filter((m) => m.division === code).length;
            const color = getDivisionColorVar(code);
            const active = selectedDivision === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setSelectedDivision(active ? null : code)}
                className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? (color ?? "var(--color-primary)") : "var(--color-elevated)",
                  color: active ? "white" : "var(--color-text-secondary)",
                  border: `1px solid ${active ? (color ?? "var(--color-primary)") : "var(--color-border)"}`,
                  borderLeftWidth: active ? "1px" : "3px",
                  borderLeftColor: color ?? "var(--color-border)",
                }}
              >
                {code} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 2026-05-15 — 체육관 필터 (PR-G3). 체육관 2개 이상일 때만 노출. */}
      {uniqueVenues.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium" style={{ color: "var(--color-text-muted)" }}>
            체육관:
          </span>
          <button
            type="button"
            onClick={() => setSelectedVenue(null)}
            className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedVenue === null ? "var(--color-info)" : "var(--color-elevated)",
              color: selectedVenue === null ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${selectedVenue === null ? "var(--color-info)" : "var(--color-border)"}`,
            }}
          >
            전체
          </button>
          {uniqueVenues.map((venue) => {
            const count = matches.filter((m) => m.venueName === venue).length;
            const active = selectedVenue === venue;
            return (
              <button
                key={venue}
                type="button"
                onClick={() => setSelectedVenue(active ? null : venue)}
                className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: active ? "var(--color-info)" : "var(--color-elevated)",
                  color: active ? "white" : "var(--color-text-secondary)",
                  border: `1px solid ${active ? "var(--color-info)" : "var(--color-border)"}`,
                }}
              >
                <span className="material-symbols-outlined align-middle" style={{ fontSize: 14, marginRight: 4 }}>
                  location_on
                </span>
                {venue} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* 5/9 사용자 결정: 날짜 탭 — 팀 필터 위 row + 가로 스크롤 + 줄바꿈 X */}
      {uniqueDates.length > 1 && (
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          <button
            type="button"
            onClick={() => setSelectedDateState(null)}
            className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              backgroundColor: selectedDate === null ? "var(--color-primary)" : "var(--color-elevated)",
              color: selectedDate === null ? "white" : "var(--color-text-secondary)",
              border: `1px solid ${selectedDate === null ? "var(--color-primary)" : "var(--color-border)"}`,
            }}
          >
            전체
          </button>
          {uniqueDates.map(({ key, short }) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDateState(key === selectedDate ? null : key)}
              className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: selectedDate === key ? "var(--color-primary)" : "var(--color-elevated)",
                color: selectedDate === key ? "white" : "var(--color-text-secondary)",
                border: `1px solid ${selectedDate === key ? "var(--color-primary)" : "var(--color-border)"}`,
              }}
              title={key}
            >
              {short}
            </button>
          ))}
        </div>
      )}

      {/* 팀 필터 버튼 그룹: 가로 스크롤 (5/9 사용자 결정 — 날짜 탭과 동일 크기로 축소) */}
      {teams.length > 0 && (
        <div className="mb-6 flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
          {/* "전체" 버튼 */}
          <button
            onClick={() => setSelectedTeam(null)}
            className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
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
              className="flex-shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
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

            {/* 2026-05-02: 카드 콤팩트 + 매치번호 표시 + 데스크톱 그리드 (사용자 요청)
                — 모바일 1열 / md+ 2열. xl 3열은 카드 너비 좁아 팀명 잘림 → 2열로 통일 (2026-05-03 fix). */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {dayMatches.map((match) => {
                // 이 경기에 선택된 팀이 참여하는지 확인 (하이라이트용)
                const isHighlighted =
                  selectedTeamName !== null &&
                  (match.homeTeamName === selectedTeamName || match.awayTeamName === selectedTeamName);

                // 홈/어웨이 중 이긴 쪽 판별 (종료 경기만)
                const isCompleted = match.status === "completed";
                const homeWins = isCompleted && (match.homeScore ?? 0) > (match.awayScore ?? 0);
                const awayWins = isCompleted && (match.awayScore ?? 0) > (match.homeScore ?? 0);

                // 2026-05-15 — 종별 색상 좌측 border (PR-G3 시각 분리).
                //   동일 종별 = 동일 색상 좌측 4px border → 카드 군집화. 팀 highlight 우선 (3px primary).
                const divisionColor = getDivisionColorVar(match.division ?? null);
                const showDivisionBorder = !isHighlighted && !!divisionColor;
                return (
                  // 4단계 C: 카드 전체 Link → div + onClick 으로 변경 (TeamLink 와 nested anchor 회피).
                  //   클릭 영역/UX 동일 — 카드 안 빈 영역 클릭 시 router.push, 팀명 클릭 시 stopPropagation 으로
                  //   TeamLink 만 동작 (팀페이지 이동).
                  //   접근성: role="button" + tabIndex=0 + Enter/Space 키 핸들러 (Link 대비 키보드 접근 보존).
                  <div
                    key={match.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => router.push(`/live/${match.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/live/${match.id}`);
                      }
                    }}
                    className="block cursor-pointer rounded-lg border p-3 transition-all hover:opacity-80"
                    style={{
                      borderColor: isHighlighted ? "var(--color-primary)" : "var(--color-border)",
                      backgroundColor: "var(--color-card)",
                      borderLeftWidth: isHighlighted ? "3px" : showDivisionBorder ? "4px" : undefined,
                      borderLeftColor: isHighlighted
                        ? "var(--color-primary)"
                        : showDivisionBorder
                        ? divisionColor!
                        : undefined,
                    }}
                  >
                    {/* 카드 상단 메타 — DualMatchCard 패턴 (inline 1줄): 코드/번호 | 라운드 | 시간 | 코트 ... [상태] */}
                    <div className="mb-2.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        {/* Phase 5 (매치 코드 v4) — 글로벌 코드 우선, NULL 시 매치번호 fallback
                            이유: 코드(`26-GG-MD21-001`) 14자 = 대회+회차+지역+번호 정보 풍부.
                            모바일 360px viewport flex-wrap 으로 줄바꿈 안전 (font-size 10px). */}
                        {match.matchCode ? (
                          <>
                            <span
                              className="match-code"
                              title={`매치 코드: ${match.matchCode}`}
                              aria-label={`매치 코드 ${match.matchCode}`}
                            >
                              {match.matchCode}
                            </span>
                            <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                          </>
                        ) : match.matchNumber != null ? (
                          <>
                            <span
                              className="font-mono text-xs"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              #{match.matchNumber}
                            </span>
                            <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                          </>
                        ) : null}
                        {/* 라운드명 */}
                        {match.roundName && (
                          <span
                            className="truncate text-xs font-medium"
                            style={{ color: "var(--color-text-tertiary)" }}
                          >
                            {match.roundName}
                          </span>
                        )}
                        {/* 시간 */}
                        {match.scheduledAt && (
                          <>
                            <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                            <span
                              className="whitespace-nowrap text-xs font-bold"
                              style={{ color: "var(--color-text-secondary)", fontFamily: "var(--font-heading)" }}
                            >
                              {formatShortTime(match.scheduledAt)}
                            </span>
                          </>
                        )}
                        {/* 코트 */}
                        {match.courtNumber && (
                          <>
                            <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                            <span
                              className="text-xs"
                              style={{ color: "var(--color-text-tertiary)" }}
                            >
                              {match.courtNumber}코트
                            </span>
                          </>
                        )}
                        {/* 2026-05-15 — 체육관 표시 (PR-G3). venue 박혀있을 때만. */}
                        {match.venueName && (
                          <>
                            <span className="text-xs" style={{ color: "var(--color-border)" }}>|</span>
                            <span
                              className="inline-flex items-center gap-0.5 text-xs"
                              style={{ color: "var(--color-text-tertiary)" }}
                              title={`체육관: ${match.venueName}`}
                            >
                              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                                location_on
                              </span>
                              {match.venueName}
                            </span>
                          </>
                        )}
                        {/* 2026-05-15 — 종별 배지 (PR-G3). 종별 색상 + 코드. uniqueDivisions 1개 이하 = 표시 0 (회귀). */}
                        {match.division && uniqueDivisions.length > 1 && (
                          <span
                            className="rounded-sm px-1.5 py-0.5 text-[10px] font-bold uppercase"
                            style={{
                              backgroundColor: `color-mix(in srgb, ${divisionColor ?? "var(--color-text-muted)"} 12%, transparent)`,
                              color: divisionColor ?? "var(--color-text-secondary)",
                            }}
                            title={`종별: ${match.division}`}
                          >
                            {match.division}
                          </span>
                        )}
                      </div>
                      <StatusBadge status={match.status} />
                    </div>

                    {/* 카드 하단: 팀 VS 팀 + 스코어 (기존 로직 유지)
                        2026-05-02: 팀명 좌/우에 로고 inline 추가 (홈은 좌측, 어웨이는 우측 = 안쪽 spectroscope 로고 → 팀명 → 가운데 스코어 → 팀명 → 로고). 모바일에서도 24px 로 공간 영향 최소. */}
                    <div className="flex items-center justify-between">
                      {/* 홈팀: 로고(좌) + 팀명 — gap-2 (8px) 로 시안 일관
                          2026-05-02 사용자 요청: 팀명 폰트 ~30% 확대 (text-sm 14px → text-base 16px / sm:text-lg 18px)
                          2026-05-02: 팀 미확정 시 slotLabel ("A조 1경기 패자" 등) → 없으면 "미정"
                          → italic + muted 색상으로 시각적 구분 (DualMatchCard 동일 패턴) */}
                      <div className="flex flex-1 items-center gap-2 text-left min-w-0">
                        <TeamLogo
                          logoUrl={match.homeTeamLogoUrl}
                          name={match.homeTeamName}
                        />
                        {/* 4단계 C: 홈팀명 → 팀페이지 TeamLink. teamId 없거나 슬롯 라벨이면 자동 span fallback.
                            onClick stopPropagation = 부모 카드 router.push 트리거 회피 (팀명 클릭 = 팀페이지 이동만). */}
                        <TeamLink
                          teamId={match.homeTeamId}
                          name={match.homeTeamName ?? match.homeSlotLabel ?? "미정"}
                          onClick={(e) => e.stopPropagation()}
                          className={`truncate font-bold ${
                            match.homeTeamName
                              ? "text-base sm:text-lg"
                              : "text-sm italic sm:text-base"
                          }`}
                          style={{
                            color: match.homeTeamName
                              ? homeWins
                                ? "var(--color-text-primary)"
                                : isCompleted
                                ? "var(--color-text-secondary)"
                                : "var(--color-text-primary)"
                              : "var(--color-text-muted)",
                            opacity: match.homeTeamName ? 1 : 0.7,
                          }}
                        />
                      </div>

                      {/* 스코어 or VS
                          2026-05-02 사용자 요청: 점수 박스 30% 확대 (팀명 30% 확대와 비례 맞춤)
                          - 글자: text-sm(14) → text-lg(18) ≈ 28%↑, 콜론 text-xs → text-sm
                          - 박스: px-3 py-1 → px-4 py-1.5 (가로 12→16 / 상하 4→6)
                          - VS: text-xs → text-base 동일 비율 */}
                      <div className="mx-3 flex-shrink-0">
                        {isCompleted || match.status === "live" || match.status === "in_progress" ? (
                          <div
                            className="flex items-center gap-1.5 rounded-full px-4 py-1.5"
                            style={{ backgroundColor: "var(--color-elevated)" }}
                          >
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ fontFamily: "var(--font-heading)", color: homeWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                            >
                              {match.homeScore ?? 0}
                            </span>
                            <span className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>:</span>
                            <span
                              className="text-lg font-bold tabular-nums"
                              style={{ fontFamily: "var(--font-heading)", color: awayWins ? "var(--color-primary)" : "var(--color-text-secondary)" }}
                            >
                              {match.awayScore ?? 0}
                            </span>
                          </div>
                        ) : (
                          <span
                            className="rounded-full px-4 py-1.5 text-base font-bold"
                            style={{
                              backgroundColor: "var(--color-primary)",
                              color: "white",
                            }}
                          >
                            VS
                          </span>
                        )}
                      </div>

                      {/* 어웨이팀: 팀명 + 로고(우) — justify-end 로 스코어 쪽으로 붙임
                          2026-05-02 사용자 요청: 팀명 폰트 ~30% 확대 (홈팀과 동일)
                          2026-05-02: 미확정 시 slotLabel → "미정" fallback (홈팀과 동일 패턴) */}
                      <div className="flex flex-1 items-center justify-end gap-2 text-right min-w-0">
                        {/* 4단계 C: 어웨이팀명 → 팀페이지 TeamLink. 동일 패턴 (stopPropagation 으로 부모 카드 클릭 회피) */}
                        <TeamLink
                          teamId={match.awayTeamId}
                          name={match.awayTeamName ?? match.awaySlotLabel ?? "미정"}
                          onClick={(e) => e.stopPropagation()}
                          className={`truncate font-bold ${
                            match.awayTeamName
                              ? "text-base sm:text-lg"
                              : "text-sm italic sm:text-base"
                          }`}
                          style={{
                            color: match.awayTeamName
                              ? awayWins
                                ? "var(--color-text-primary)"
                                : isCompleted
                                ? "var(--color-text-secondary)"
                                : "var(--color-text-primary)"
                              : "var(--color-text-muted)",
                            opacity: match.awayTeamName ? 1 : 0.7,
                          }}
                        />
                        <TeamLogo
                          logoUrl={match.awayTeamLogoUrl}
                          name={match.awayTeamName}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
