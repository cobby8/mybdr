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
 *   - rounded-[4px] / material-symbols-outlined 만 (lucide-react ❌)
 *   - 모바일 = Card 스택 / PC = 섹션 사이 자연 간격 (space-y-6)
 */

"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { DivisionStanding } from "@/lib/tournaments/division-advancement";
import { AdvancePlayoffsButton } from "../_components/AdvancePlayoffsButton";
import { PlaceholderValidationBanner } from "../_components/PlaceholderValidationBanner";
import { StandingsTable } from "../_components/StandingsTable";

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

export function PlayoffsClient({ tournamentId, divisionStandings, matches }: Props) {
  // Advance 버튼 성공 시 router.refresh() — server component 재실행으로 standings + matches 재조회
  const router = useRouter();

  // ─────────────────────────────────────────────────────────────
  // 매치 분류 — 한번만 계산 (rendering 분기 단순화)
  // ─────────────────────────────────────────────────────────────

  // 순위전 매치 — roundName 에 "순위" 포함
  const rankingMatches = matches.filter(
    (m) => m.roundName && RANKING_ROUND_REGEX.test(m.roundName),
  );

  // 결승 매치 — roundName 에 "결승" 또는 "final" 포함
  const finalMatches = matches.filter(
    (m) => m.roundName && FINAL_ROUND_REGEX.test(m.roundName),
  );

  // 종별 코드 목록 (Advance 버튼 props)
  const divisionCodes = divisionStandings.map((d) => d.code);

  // 종별 라벨 lookup (순위전/결승 매치 그룹핑 시 표시명 변환)
  const labelByCode = new Map(divisionStandings.map((d) => [d.code, d.label]));

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
          섹션 5 (상단 배치) — placeholder 형식 위반 검출 배너
          이유: 상단 노출 = 운영자가 진입 즉시 사고 인지 가능.
          검출 0건 = null 반환 (배너 미표시).
         ───────────────────────────────────────────────────────────── */}
      <PlaceholderValidationBanner matches={matches} />

      {/* ─────────────────────────────────────────────────────────────
          섹션 2 — Advance 버튼 (예선 종료 → 순위전 placeholder 일괄 매핑)
          이유: 운영 흐름상 진입 즉시 보여야 함 (단계 10 trigger).
         ───────────────────────────────────────────────────────────── */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined align-middle text-[18px]" aria-hidden="true">
                trending_up
              </span>{" "}
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
            divisionCodes={divisionCodes}
            // server component 재실행 → standings + matches 재조회
            onSuccess={() => router.refresh()}
          />
        </div>
      </Card>

      {/* ─────────────────────────────────────────────────────────────
          섹션 1 — 종별 standings 표
          이유: 운영자가 예선 결과 확인 후 Advance 클릭 흐름 (위 섹션 2 와 자연 연결).
         ───────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          <span className="material-symbols-outlined align-middle text-[16px]" aria-hidden="true">
            leaderboard
          </span>{" "}
          종별 예선 결과 ({divisionStandings.length}종별)
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {divisionStandings.map((d) => (
            <StandingsTable
              key={d.code}
              divisionLabel={d.label === d.code ? d.code : `${d.label} (${d.code})`}
              standings={d.standings}
            />
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          섹션 3 — 순위전 매치 목록 (자동 채움 결과 시각화)
          이유: Advance 호출 후 결과 확인 = 다음 단계 (결승 진출 팀) 시각화.
          종별 그룹핑 (강남구 4 종별 = 4 sub-Card).
         ───────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          <span className="material-symbols-outlined align-middle text-[16px]" aria-hidden="true">
            sports_basketball
          </span>{" "}
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

      {/* ─────────────────────────────────────────────────────────────
          섹션 4 — 결승전 정보 + 우승팀
          이유: 단계 11 = 우승팀 결정 (시상 / 트로피 / 통계 동결 trigger).
          현재 = 결승 매치 + winner_team_id 표시만 (자동 박제는 score-updater 가 수행).
         ───────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          <span className="material-symbols-outlined align-middle text-[16px]" aria-hidden="true">
            emoji_events
          </span>{" "}
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
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-success)", fontSize: 24 }}
              aria-hidden="true"
            >
              emoji_events
            </span>
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
