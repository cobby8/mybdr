/**
 * 2026-05-16 PR-Admin-6 — playoffs hub client (5 섹션 컴포지션).
 *
 * 이유(왜):
 *   - server component (page.tsx) 가 standings + matches fetch → 본 client 가 5 섹션 렌더.
 *   - AdvancePlayoffsButton (PR-Admin-2) / PlaceholderValidationBanner (PR-Admin-3) 재사용
 *     → 신규 비즈 로직 0 / UI 컴포지션만.
 *
 * 5 섹션:
 *   1) 종별 standings 표 (StandingsTable 재사용)
 *   2) AdvancePlayoffsButton (예선 종료 → 순위전 placeholder 일괄 매핑)
 *   3) 순위전 매치 목록 (roundName "순위" 매치 — 종별 그룹핑)
 *   4) 결승전 정보 + 우승팀 (roundName "결승" 매치 + winner_team_id)
 *   5) PlaceholderValidationBanner (placeholder 형식 위반 검출)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy / var(--color-success) / var(--color-warning) 토큰만
 *   - rounded-[4px] / Toss 리스킨 후 lucide-react 키트(<Icon>) 사용 (Track B-c)
 *   - 모바일 = Card 스택 / PC = 섹션 사이 자연 간격 (space-y-6)
 */

"use client";

// 2026-05-16 Track A — 종별 탭 박제 (옵션 A 인라인).
//   이유(왜): 강남구 6 종별 박제 시 5 섹션 × 6 = 세로 약 6240px (운영 불가능).
//   탭 1개로 단일 종별 표시 (또는 "전체") → 운영자 시각 단축.
//   matches-client.tsx line 553~624 패턴 재사용 (검증된 패턴 / premature abstraction 회피).
//
// 2026-05-28 PR-1C-8 — E1 5 섹션 탭 시각 박제 (시안 AdminTournamentPlayoffs.jsx).
//   이유(왜): 시안 = 5 섹션을 탭으로 전환 (순위표 / 순위전 / 결승 / 결과).
//   기존 운영은 5 섹션 세로 나열 → 강남구 다종별 시 스크롤 과다.
//   시안 탭 UX 도입 = 섹션 전환으로 시각 단축. 데이터 흐름 / state / 핸들러 100% 유지.
//   가드: 시안 mock(8강/4강 고정 트리)은 운영 데이터(종별 N개 × 가변 라운드)와 달라
//        8강·4강 강제 분리 ❌ (데이터 왜곡 회피). 순위전 매치는 통합 탭으로 표현.
//        Banner / Advance = 모든 탭 상단 항상 노출 (시안 의도 = 진입 즉시 사고 인지 + trigger).
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { DivisionStanding } from "@/lib/tournaments/division-advancement";
import { AdvancePlayoffsButton } from "../_components/AdvancePlayoffsButton";
import { PlaceholderValidationBanner } from "../_components/PlaceholderValidationBanner";
import { StandingsTable } from "../_components/StandingsTable";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
// PR-1C-8 — 시안 E1 apl-* 클래스 (탭 / 결승 hero 시각). 토큰 대체본.
import "./playoffs-admin.css";

// ─────────────────────────────────────────────────────────────────────────
// 외부에 export 하는 타입 (page.tsx server component 에서 import)
// ─────────────────────────────────────────────────────────────────────────

export type DivisionStandingsBundle = {
  code: string;
  label: string;
  standings: DivisionStanding[];
};

// 매치 — server 에서 BigInt 직렬화 후 client 에 전달
export type PlayoffsMatch = {
  id: string;
  roundName: string | null;
  round_number: number | null;
  match_number: number | null;
  group_name: string | null;
  status: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number;
  awayScore: number;
  winner_team_id: string | null;
  notes: string | null;
  settings: Record<string, unknown> | null;
  scheduledAt: string | null;
  venue_name: string | null;
  court_number: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
};

type Props = {
  tournamentId: string;
  divisionStandings: DivisionStandingsBundle[];
  matches: PlayoffsMatch[];
};

// ─────────────────────────────────────────────────────────────────────────
// 정규식 — placeholder-helpers.ts:266 RANKING_ROUND_REGEX 동등 (export 안되어 있어 박제 동일).
//   "순위" 키워드 포함 = 순위결정전 / 순위전 / 1위 동순위전 등 generator 별 표기 차 모두 매치.
// ─────────────────────────────────────────────────────────────────────────
const RANKING_ROUND_REGEX = /순위/;

// 결승 식별 — roundName "결승" 또는 "Final" 포함
const FINAL_ROUND_REGEX = /결승|final/i;

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  scheduled: "예정",
  in_progress: "진행 중",
  completed: "종료",
  cancelled: "취소",
  bye: "부전승",
};

// 일정 표시 — KST yyyy.MM.dd HH:mm
function formatSchedule(iso: string | null): string {
  if (!iso) return "일정 미정";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "일정 미정";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// 슬롯 라벨 — 팀 확정이면 팀명 / 아니면 settings 슬롯 라벨 / 그래도 없으면 notes 추출 / "미정"
function slotLabel(
  teamName: string | null,
  fallback: string | undefined | null,
): string {
  if (teamName) return teamName;
  if (fallback && fallback.trim()) return fallback;
  return "미정";
}

// 매치의 종별 코드 추출 (settings.division_code)
function getDivisionCode(m: PlayoffsMatch): string | null {
  const s = (m.settings ?? {}) as Record<string, unknown>;
  return (s.division_code as string) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// PR-1C-8 — 5 섹션 탭 정의 (시안 AdminTournamentPlayoffs.jsx TABS 박제).
//   시안 5 탭 = 순위표 / 8강 / 4강 / 결승 / 결과.
//   운영 매핑: 8강·4강은 고정 라운드가 아니라 종별 가변 → "순위전" 통합 탭으로 표현
//             (데이터 왜곡 회피). 카운트는 실제 데이터 기반 (mock ❌).
//   icon = Material Symbols Outlined (시안 동일).
// ─────────────────────────────────────────────────────────────────────────
type SectionKey = "standings" | "ranking" | "final" | "result";

// icon = lucide 키트 이름 — Material leaderboard/sports_basketball/emoji_events/edit_note 대체
//   (lucide 농구 아이콘 부재 → volleyball 의미대체, 기존 선례 동일)
const SECTION_TABS: Array<{ k: SectionKey; lbl: string; icon: string }> = [
  { k: "standings", lbl: "순위표", icon: "bar-chart-3" }, // leaderboard
  { k: "ranking", lbl: "순위전", icon: "volleyball" }, // sports_basketball
  { k: "final", lbl: "결승", icon: "trophy" }, // emoji_events
  { k: "result", lbl: "결과 박제", icon: "file-pen" }, // edit_note
];

export function PlayoffsClient({ tournamentId, divisionStandings, matches }: Props) {
  // Advance 버튼 성공 시 router.refresh() — server component 재실행으로 standings + matches 재조회
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─────────────────────────────────────────────────────────────
  // 2026-05-16 Track A — 종별 탭 state (옵션 A 인라인 / matches-client 패턴)
  //   selectedDivision = null → "전체" / "i3-U9" 등 → 단일 종별
  //   URL ?division= deep link (bracket 페이지에서 종별 클릭 진입 후속 박제 시 활용)
  // ─────────────────────────────────────────────────────────────
  const [selectedDivision, setSelectedDivision] = useState<string | null>(
    searchParams?.get("division") ?? null,
  );

  // ─────────────────────────────────────────────────────────────
  // PR-1C-8 — 섹션 탭 state (시안 E1 5 탭 박제 / 운영 4 탭 매핑)
  //   기본 = "standings" (시안 초기 tab 동일). 탭 전환 = 섹션 표시 토글만 (데이터 0 변경).
  // ─────────────────────────────────────────────────────────────
  const [section, setSection] = useState<SectionKey>("standings");

  // 종별 코드 목록 (Advance 버튼 props + 탭 렌더 source)
  const divisionCodes = divisionStandings.map((d) => d.code);

  // 종별 라벨 lookup (순위전/결승 매치 그룹핑 시 표시명 변환)
  const labelByCode = new Map(divisionStandings.map((d) => [d.code, d.label]));

  // 탭 표시 가드 — 종별이 2개 이상일 때만 탭 렌더 (단일 종별 운영 시 회귀 0)
  const showDivisionTabs = divisionStandings.length > 1;

  // URL deep link 폴백 — ?division= 잘못된 코드면 null 로 초기화 (빈 화면 방지)
  // showDivisionTabs 가 false 면 selectedDivision = null 강제 (단일 종별 일관)
  useEffect(() => {
    if (!showDivisionTabs && selectedDivision !== null) {
      setSelectedDivision(null);
      return;
    }
    if (selectedDivision !== null && !divisionCodes.includes(selectedDivision)) {
      setSelectedDivision(null);
    }
  }, [selectedDivision, divisionCodes, showDivisionTabs]);

  // selectedDivision 변경 시 URL 동기화 (브라우저 뒤로가기 / deep link 공유)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (selectedDivision) {
      params.set("division", selectedDivision);
    } else {
      params.delete("division");
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : "?", { scroll: false });
    // searchParams 는 dependency 에서 제외 — replace 호출 시 자기 자신 변경 → 무한 loop 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDivision, router]);

  // ─────────────────────────────────────────────────────────────
  // 5 섹션 prop 차등 — selectedDivision 에 따라 source 필터링
  //   재사용 컴포넌트 (Banner / Advance / StandingsTable / DivisionMatchGroup / FinalCard)
  //   시그니처는 0 변경 — 부모에서 prop 만 차등 전달.
  // ─────────────────────────────────────────────────────────────

  // 단일 종별 모드 = matches 도 해당 종별만 (Banner 검증 범위 축소)
  const filteredMatches = selectedDivision
    ? matches.filter((m) => getDivisionCode(m) === selectedDivision)
    : matches;

  // Advance 버튼 호출 종별 = 단일 종별 모드면 1개만 / 전체면 전부
  const advanceDivisionCodes = selectedDivision ? [selectedDivision] : divisionCodes;

  // 종별 standings = 단일 종별 모드면 해당 종별만 / 전체면 전부
  const visibleStandings = selectedDivision
    ? divisionStandings.filter((d) => d.code === selectedDivision)
    : divisionStandings;

  // ─────────────────────────────────────────────────────────────
  // 매치 분류 — filteredMatches 기반 (단일 종별 모드 = 해당 종별 매치만)
  // ─────────────────────────────────────────────────────────────

  // 순위전 매치 — roundName 에 "순위" 포함
  const rankingMatches = filteredMatches.filter(
    (m) => m.roundName && RANKING_ROUND_REGEX.test(m.roundName),
  );

  // 결승 매치 — roundName 에 "결승" 또는 "final" 포함
  const finalMatches = filteredMatches.filter(
    (m) => m.roundName && FINAL_ROUND_REGEX.test(m.roundName),
  );

  // 순위전 매치 종별 그룹핑 — 종별 코드 → 매치들
  const rankingByDivision = rankingMatches.reduce<Map<string, PlayoffsMatch[]>>((map, m) => {
    const code = getDivisionCode(m) ?? "_no_division";
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push(m);
    return map;
  }, new Map());

  // 결승 매치 종별 그룹핑
  const finalByDivision = finalMatches.reduce<Map<string, PlayoffsMatch[]>>((map, m) => {
    const code = getDivisionCode(m) ?? "_no_division";
    if (!map.has(code)) map.set(code, []);
    map.get(code)!.push(m);
    return map;
  }, new Map());

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          2026-05-16 Track A — 종별 탭 (옵션 A 인라인 / matches-client 패턴 재사용)
          이유: 강남구 6 종별 박제 시 5 섹션 × 6 종별 = 세로 약 6240px (운영 불가능).
          탭 1개로 단일 종별 표시 (또는 "전체") → 운영자 시각 단축.
          가드: divisionStandings.length ≤ 1 = 탭 미렌더 (단일 종별 운영 회귀 0).
         ───────────────────────────────────────────────────────────── */}
      {showDivisionTabs && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--color-text-muted)]">종별:</span>
          {/* "전체" 탭 — selectedDivision = null (모든 종별 표시 / 기존 동작 유지) */}
          <button
            type="button"
            onClick={() => setSelectedDivision(null)}
            className={`min-h-[44px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedDivision === null
                ? "bg-[var(--color-info)] text-white"
                : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            전체 ({divisionStandings.length}종별)
          </button>
          {/* 종별별 탭 — 카운트 = 해당 종별 매치 수 (운영자가 한눈에 규모 파악) */}
          {divisionStandings.map((d) => {
            const count = matches.filter((m) => getDivisionCode(m) === d.code).length;
            const tabLabel = d.label === d.code ? d.code : d.label;
            return (
              <button
                key={d.code}
                type="button"
                onClick={() => setSelectedDivision(d.code)}
                className={`min-h-[44px] rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedDivision === d.code
                    ? "bg-[var(--color-info)] text-white"
                    : "bg-[var(--color-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {tabLabel} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          섹션 5 (상단 배치) — placeholder 형식 위반 검출 배너
          이유: 상단 노출 = 운영자가 진입 즉시 사고 인지 가능.
          검출 0건 = null 반환 (배너 미표시).
          Track A: filteredMatches (단일 종별 모드 = 해당 종별 매치만 검증) + applyFilter true 라벨.
          PR-1C-8: 탭 무관 항상 상단 노출 (시안 의도 = 진입 즉시 사고 인지).
         ───────────────────────────────────────────────────────────── */}
      <PlaceholderValidationBanner
        matches={filteredMatches}
        applyFilter={selectedDivision !== null}
      />

      {/* ─────────────────────────────────────────────────────────────
          PR-1C-8 — 5 섹션 탭 바 (시안 E1 apl-tabs 박제)
          이유: 시안 = 섹션을 탭으로 전환 → 세로 스크롤 단축 (강남구 다종별 운영성).
          탭 카운트 = 실제 데이터 기반 (순위전 = rankingMatches / 결승 = finalMatches). mock ❌.
          전환 = 섹션 표시 토글만 (데이터 / state 재계산 0).
         ───────────────────────────────────────────────────────────── */}
      <div className="apl-tabs" role="tablist">
        {SECTION_TABS.map((t) => {
          // 탭별 카운트 — 순위전 / 결승은 실제 매치 수. 순위표·결과는 카운트 없음.
          const count =
            t.k === "ranking"
              ? rankingMatches.length
              : t.k === "final"
                ? finalMatches.length
                : null;
          return (
            <button
              key={t.k}
              type="button"
              role="tab"
              aria-selected={section === t.k}
              className={`apl-tabs__tab${section === t.k ? " is-on" : ""}`}
              onClick={() => setSection(t.k)}
            >
              {/* t.icon = lucide 키트 이름(bar-chart-3/volleyball/trophy/file-pen) */}
              <Icon name={t.icon} size={16} />
              {t.lbl}
              {count != null && <span className="apl-tabs__num">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          탭 1: 순위표 (standings) — 종별 standings 표 + Advance 버튼
          시안 standings 섹션 = 순위표 + 하단 진출 버튼 흐름 박제.
          ═══════════════════════════════════════════════════════════════ */}
      {section === "standings" && (
        <div className="apl-section">
          {/* ─────────────────────────────────────────────────────────
              섹션 1 — 종별 standings 표
              이유: 운영자가 예선 결과 확인 후 Advance 클릭 흐름 (아래 진출 버튼과 자연 연결).
             ───────────────────────────────────────────────────────── */}
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {/* Material leaderboard → lucide bar-chart-3 */}
              <Icon name="bar-chart-3" size={16} className="align-middle" />{" "}
              종별 예선 결과 ({visibleStandings.length}
              {selectedDivision ? "종별 (선택)" : "종별"})
            </h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Track A: visibleStandings = 단일 종별 모드 = 해당 종별만 / 전체 = 전부 */}
              {visibleStandings.map((d) => (
                <StandingsTable
                  key={d.code}
                  divisionLabel={d.label === d.code ? d.code : `${d.label} (${d.code})`}
                  standings={d.standings}
                />
              ))}
            </div>
          </section>

          {/* ─────────────────────────────────────────────────────────
              섹션 2 — Advance 버튼 (예선 종료 → 순위전 placeholder 일괄 매핑)
              이유: 시안 = 순위표 하단 진출 버튼. 운영 흐름 = 단계 10 trigger.
              AdvancePlayoffsButton 기존 컴포넌트 재사용 (위치·로직 0 변경).
             ───────────────────────────────────────────────────────── */}
          <Card>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {/* Material trending_up → lucide trending-up */}
                  <Icon name="trending-up" size={18} className="align-middle" />{" "}
                  예선 종료 → 순위전 진출
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  모든 종별 standings 기반으로 순위전 placeholder 매치 (A조 N위 vs B조 N위) 자동 채움.
                  <br />
                  재호출 시 이미 채워진 슬롯은 보호됨 (idempotent).
                </p>
              </div>
              <AdvancePlayoffsButton
                tournamentId={tournamentId}
                // Track A: 단일 종별 모드 = 해당 종별만 호출 / 전체 = 일괄 호출 (기존 동작)
                divisionCodes={advanceDivisionCodes}
                // server component 재실행 → standings + matches 재조회
                onSuccess={() => router.refresh()}
              />
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          탭 2: 순위전 (ranking) — 순위전 매치 목록 (시안 8강/4강 통합)
          가드: 운영 데이터는 8강·4강 고정 라운드 없음 (종별 가변 라운드).
               시안 8강/4강 강제 분리 ❌ → roundName 기준 종별 그룹핑 유지 (데이터 왜곡 회피).
          ═══════════════════════════════════════════════════════════════ */}
      {section === "ranking" && (
        <div className="apl-section">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {/* Material sports_basketball → lucide volleyball (농구 부재 의미대체) */}
              <Icon name="volleyball" size={16} className="align-middle" />{" "}
              순위전 매치 ({rankingMatches.length}경기)
            </h2>
            {rankingMatches.length === 0 ? (
              <Card className="py-8 text-center text-[var(--color-text-muted)]">
                <p className="text-sm">순위전 매치가 없습니다.</p>
                <p className="mt-1 text-xs">
                  종별 generator 가 순위전 placeholder 를 박제했는지 확인 (대진표 페이지).
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {Array.from(rankingByDivision.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, divMatches]) => (
                    <DivisionMatchGroup
                      key={code}
                      divisionLabel={
                        code === "_no_division"
                          ? "종별 미지정"
                          : labelByCode.get(code) ?? code
                      }
                      matches={divMatches}
                    />
                  ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          탭 3: 결승 (final) — 결승전 정보 + 우승팀
          시안 final 섹션 = 결승 hero 강조. 운영 = 결승 매치 + winner_team_id 표시.
          ═══════════════════════════════════════════════════════════════ */}
      {section === "final" && (
        <div className="apl-section">
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              {/* Material emoji_events → lucide trophy */}
              <Icon name="trophy" size={16} className="align-middle" />{" "}
              결승전 & 우승팀 ({finalMatches.length}종별 결승)
            </h2>
            {finalMatches.length === 0 ? (
              <Card className="py-8 text-center text-[var(--color-text-muted)]">
                <p className="text-sm">결승 매치가 없습니다.</p>
                <p className="mt-1 text-xs">
                  종별 generator 가 결승 매치를 박제했는지 확인 (대진표 페이지).
                </p>
              </Card>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {Array.from(finalByDivision.entries())
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([code, divFinals]) => (
                    <FinalCard
                      key={code}
                      divisionLabel={
                        code === "_no_division"
                          ? "종별 미지정"
                          : labelByCode.get(code) ?? code
                      }
                      finals={divFinals}
                    />
                  ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          탭 4: 결과 박제 (result) — 시안 static 안내 카드 박제
          가드: 운영 데이터 없음 (D1/PA7 종료 후 hub 연동 예정 — PR-1C-13).
               시안 acp-card static 안내 그대로 (mock ❌ / 동작 미구현 / 안내성).
          ═══════════════════════════════════════════════════════════════ */}
      {section === "result" && (
        <div className="apl-section">
          <Card>
            <div className="flex items-start gap-3">
              {/* Material emoji_events → lucide trophy */}
              <Icon
                name="trophy"
                size={26}
                color="var(--color-info)"
                className="flex-shrink-0"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    결과 박제 · 우승 / 준우승 / 3위 결정전
                  </h3>
                  <span
                    className="rounded-[4px] px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      backgroundColor: "var(--color-elevated)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    결승 종료 후 입력
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  결승전 종료 시 자동으로 우승팀·준우승이 채워지고 3위 결정전 매치가 생성됩니다.
                  종료 후 종료 hub 의 &ldquo;결과 박제&rdquo; 카드와 연동됩니다.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// DivisionMatchGroup — 종별 안 순위전 매치 카드 (roundName 별 sub-그룹)
// ─────────────────────────────────────────────────────────────────────────

function DivisionMatchGroup({
  divisionLabel,
  matches,
}: {
  divisionLabel: string;
  matches: PlayoffsMatch[];
}) {
  // roundName 별 sub-그룹화 (1·2위 결정전 / 3·4위 결정전 등)
  const byRoundName = matches.reduce<Map<string, PlayoffsMatch[]>>((map, m) => {
    const key = (m.roundName ?? "").trim() || "기타";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
    return map;
  }, new Map());

  const roundEntries = Array.from(byRoundName.entries()).sort(([a], [b]) =>
    a.localeCompare(b, "ko-KR", { numeric: true }),
  );

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{divisionLabel}</p>
        <span className="rounded-[4px] bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
          {matches.length}경기
        </span>
      </div>
      <div className="space-y-3">
        {roundEntries.map(([roundName, rMatches]) => (
          <div key={roundName}>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {roundName} ({rMatches.length})
            </p>
            <div className="space-y-1.5">
              {rMatches.map((m) => (
                <PlayoffMatchRow key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// PlayoffMatchRow — 순위전 매치 1행 (home/away/score/status + 일정/장소)
// ─────────────────────────────────────────────────────────────────────────

function PlayoffMatchRow({ match }: { match: PlayoffsMatch }) {
  // 슬롯 라벨 — settings.homeSlotLabel / awaySlotLabel 폴백 (snake_case 도 폴백)
  const homeFallback =
    (match.settings?.homeSlotLabel as string | undefined) ??
    (match.settings?.home_slot_label as string | undefined);
  const awayFallback =
    (match.settings?.awaySlotLabel as string | undefined) ??
    (match.settings?.away_slot_label as string | undefined);
  const homeLabel = slotLabel(match.homeTeamName, homeFallback);
  const awayLabel = slotLabel(match.awayTeamName, awayFallback);
  const isHomeUndecided = match.homeTeamName == null;
  const isAwayUndecided = match.awayTeamName == null;
  const completed = match.status === "completed";
  const homeWon = completed && match.homeScore > match.awayScore;
  const awayWon = completed && match.awayScore > match.homeScore;

  return (
    <div className="rounded-[4px] bg-[var(--color-elevated)] p-3">
      <div className="mb-2 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[var(--color-text-muted)]">
            #{match.match_number ?? "-"}
          </span>
          <span className="text-[var(--color-text-muted)]">{formatSchedule(match.scheduledAt)}</span>
        </div>
        <span
          className="rounded-[4px] px-2 py-0.5 text-[11px]"
          style={{
            backgroundColor:
              completed
                ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                : match.status === "in_progress"
                  ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                  : "var(--color-surface)",
            color:
              completed
                ? "var(--color-success)"
                : match.status === "in_progress"
                  ? "var(--color-info)"
                  : "var(--color-text-muted)",
          }}
        >
          {STATUS_LABEL[match.status] ?? match.status}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* HOME */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`flex-1 truncate text-sm ${
              isHomeUndecided
                ? "italic text-[var(--color-text-muted)]"
                : homeWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={homeLabel}
          >
            {homeLabel}
          </span>
          <span
            className={`min-w-[28px] text-right text-sm tabular-nums ${
              homeWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.homeScore : "-"}
          </span>
        </div>

        <span className="text-xs text-[var(--color-text-muted)]">vs</span>

        {/* AWAY */}
        <div className="flex flex-1 items-center gap-2 min-w-0">
          <span
            className={`min-w-[28px] text-sm tabular-nums ${
              awayWon ? "font-bold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
            }`}
          >
            {completed ? match.awayScore : "-"}
          </span>
          <span
            className={`flex-1 truncate text-sm ${
              isAwayUndecided
                ? "italic text-[var(--color-text-muted)]"
                : awayWon
                  ? "font-bold text-[var(--color-text-primary)]"
                  : "font-medium text-[var(--color-text-primary)]"
            }`}
            title={awayLabel}
          >
            {awayLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// FinalCard — 종별 결승 매치 + 우승팀 표시
// ─────────────────────────────────────────────────────────────────────────

function FinalCard({
  divisionLabel,
  finals,
}: {
  divisionLabel: string;
  finals: PlayoffsMatch[];
}) {
  // 우승팀 식별 — winner_team_id 박제된 결승 매치 1건 (score-updater 자동 박제 결과)
  const championMatch = finals.find((m) => m.status === "completed" && m.winner_team_id != null);
  let championName: string | null = null;
  if (championMatch && championMatch.winner_team_id) {
    if (championMatch.winner_team_id === championMatch.homeTeamId) {
      championName = championMatch.homeTeamName;
    } else if (championMatch.winner_team_id === championMatch.awayTeamId) {
      championName = championMatch.awayTeamName;
    }
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{divisionLabel}</p>
        <span className="rounded-[4px] bg-[var(--color-elevated)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
          {finals.length}경기
        </span>
      </div>

      {/* 우승팀 강조 — championName 박제 시 노출 */}
      {championName && (
        <div
          className="mb-3 rounded-[4px] p-3"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-success) 12%, transparent)",
            borderLeft: "3px solid var(--color-success)",
          }}
        >
          <div className="flex items-center gap-2">
            {/* Material emoji_events → lucide trophy */}
            <Icon name="trophy" size={24} color="var(--color-success)" />
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">우승팀</p>
              <p className="text-base font-bold" style={{ color: "var(--color-success)" }}>
                {championName}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 결승 매치 행 — PlayoffMatchRow 재사용 */}
      <div className="space-y-1.5">
        {finals.map((m) => (
          <PlayoffMatchRow key={m.id} match={m} />
        ))}
      </div>
    </Card>
  );
}
