"use client";

import Link from "next/link";
import useSWR from "swr";

/* ============================================================
 * NotableTeams -- 주목할만한 팀 섹션
 *
 * 2026-03-27: 컴팩트 카드 스타일 적용
 * - h-20 lg:h-28 이미지 영역 (팀 색상 그라디언트 + 이니셜)
 * - p-3 정보 영역 (팀명 + 멤버수/전적)
 * - 경기/대회 카드와 동일한 rounded-xl + border 패턴
 *
 * 데이터: /api/web/teams API에서 승수(wins) 기준 상위 4팀
 * API 실패 시 FALLBACK_TEAMS로 graceful degradation
 * ============================================================ */

/* API 응답의 팀 데이터 타입 (apiSuccess가 snake_case로 자동 변환) */
interface TeamData {
  id: string;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  city: string | null;
  district: string | null;
  wins: number;
  losses: number;
  accepting_members: boolean;
  tournaments_count: number;
  member_count: number;
}

/* API 실패 시 표시할 fallback 데이터 */
const FALLBACK_TEAMS: TeamData[] = [
  { id: "0", name: "Storm FC", primary_color: "#3B82F6", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Red Eagles", primary_color: "#EF4444", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Ace One", primary_color: "#F4A261", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
  { id: "0", name: "Neon Pulse", primary_color: "#8B5CF6", secondary_color: null, city: null, district: null, wins: 0, losses: 0, accepting_members: true, tournaments_count: 0, member_count: 0 },
];

/* 서버에서 미리 가져온 데이터를 받을 수 있는 props */
interface NotableTeamsProps {
  fallbackData?: { teams: TeamData[] };
}

/**
 * 팀 색상을 기반으로 그라디언트 생성
 * primary_color가 있으면 해당 색상 기반, 없으면 기본 회색 그라디언트
 */
function getTeamGradient(color: string | null): string {
  if (!color) return "linear-gradient(135deg, #374151 0%, #1f2937 100%)";
  // 팀 색상에서 어두운 변형을 만들어 그라디언트 생성
  return `linear-gradient(135deg, ${color}33 0%, ${color} 50%, ${color}cc 100%)`;
}

/**
 * 팀명에서 이니셜 추출 (한글이면 첫 글자, 영문이면 각 단어 첫 글자)
 */
function getInitials(name: string): string {
  // 한글로 시작하면 첫 2글자
  if (/^[가-힣]/.test(name)) return name.slice(0, 2);
  // 영문이면 각 단어 첫 글자 (최대 2글자)
  return name.split(/\s+/).map(w => w[0]).join("").toUpperCase().slice(0, 2);
}

export function NotableTeams({ fallbackData }: NotableTeamsProps = {}) {
  // useSWR로 팀 API 호출 (SWR이 자동 중복 제거)
  const { data: json, isLoading } = useSWR<{ teams: TeamData[] }>(
    "/api/web/teams",
    null,
    { fallbackData }
  );

  // API 응답에서 상위 4팀 추출, 데이터 없으면 fallback 사용
  const apiTeams: TeamData[] = json?.teams ?? [];
  const teams = apiTeams.length > 0 ? apiTeams.slice(0, 4) : FALLBACK_TEAMS;

  return (
    <section>
      {/* 섹션 헤더: 파란 세로 막대 + 제목 + 필터 버튼 */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold font-heading tracking-tight text-text-primary flex items-center gap-3">
          <span className="w-1.5 h-6 bg-tertiary" />
          주목할만한 팀
        </h3>
        <button className="bg-card hover:bg-elevated text-text-primary p-2 rounded transition-colors">
          <span className="material-symbols-outlined">filter_list</span>
        </button>
      </div>

      {/* 반응형 레이아웃: 모바일 가로 스크롤 / 데스크탑 4열 그리드 */}
      <div className="flex flex-row overflow-x-auto gap-4 no-scrollbar -mx-6 px-6 md:grid md:grid-cols-4 md:overflow-visible md:mx-0 md:px-0">
        {teams.map((team) => (
          <TeamCard key={team.id + team.name} team={team} isLoading={isLoading} />
        ))}
      </div>
    </section>
  );
}

/* ---- 개별 팀 카드 컴포넌트 (컴팩트 스타일) ---- */
function TeamCard({ team, isLoading }: { team: TeamData; isLoading: boolean }) {
  const href = team.id !== "0" ? `/teams/${team.id}` : "#";
  const isFallback = team.id === "0";

  return (
    <Link href={href} className="min-w-[160px] md:min-w-0 block">
      <div className="group rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-card)] hover:shadow-lg transition-all h-full">
        {/* 이미지 영역: 팀 색상 기반 그라디언트 + 이니셜 */}
        <div
          className="relative h-20 lg:h-28 flex items-center justify-center"
          style={{ background: getTeamGradient(team.primary_color) }}
        >
          {/* 팀 이니셜 (큰 반투명 텍스트로 배경 장식) */}
          <span className="text-4xl lg:text-5xl font-black text-white/30 select-none">
            {getInitials(team.name)}
          </span>

          {/* 팀 아이콘 뱃지 (좌상단) */}
          <span className="absolute top-2 left-2 flex items-center justify-center w-8 h-8 rounded bg-black/30 backdrop-blur-sm">
            <span
              className="material-symbols-outlined text-xl text-white"
              style={team.primary_color ? { color: team.primary_color } : undefined}
            >
              shield
            </span>
          </span>

          {/* 멤버 모집중 뱃지 (우상단) */}
          {team.accepting_members && !isFallback && (
            <span className="absolute top-2 right-2 rounded bg-[var(--color-primary)] px-1.5 py-0.5 text-xs font-bold text-white">
              모집중
            </span>
          )}
        </div>

        {/* 정보 영역 (p-3 컴팩트) */}
        <div className="p-3">
          {/* 팀명 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-bold line-clamp-1 text-[var(--color-text-primary)] flex-1">
              {isLoading ? (
                <span className="inline-block w-20 h-4 bg-[var(--color-elevated)] rounded animate-pulse" />
              ) : (
                team.name
              )}
            </h4>
          </div>

          {/* 전적 + 멤버수 */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            {isLoading ? (
              <span className="inline-block w-24 h-3 bg-[var(--color-elevated)] rounded animate-pulse" />
            ) : !isFallback ? (
              <>
                {/* 전적 */}
                <span className="flex items-center gap-0.5">
                  <span className="font-bold text-[var(--color-text-secondary)]">{team.wins}W</span>
                  <span>/</span>
                  <span>{team.losses}L</span>
                </span>
                <span className="text-[var(--color-border)]">|</span>
                {/* 멤버수 */}
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs">group</span>
                  {team.member_count}명
                </span>
              </>
            ) : (
              <span>-</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
